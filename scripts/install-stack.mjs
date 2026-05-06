import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { clearLine, cursorTo, moveCursor } from 'node:readline'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  INSTALLER_STATE_VERSION,
  assertRequiredAdminOptions,
  buildComposeEnvironment,
  buildStatePath,
  loadInstallerManifest,
  loadDashwayConfig,
  parseAppSelectionValue,
  parseCliArgs,
  readInstallState,
  writeInstallState,
} from './install-stack-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(repoRoot, 'installer', 'manifest.json')
const dashwayConfigPath = path.join(repoRoot, 'dashway.config.json')

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const manifest = await loadInstallerManifest(manifestPath)
  const dashwayConfig = await loadDashwayConfig(dashwayConfigPath)
  const composeEnvironment = buildComposeEnvironment(dashwayConfig)
  const installRoot = process.cwd()
  const statePath = buildStatePath(installRoot)
  const previousState = await readInstallState(statePath)
  const installSecret = previousState?.installSecret ?? randomBootstrapSecret()
  const installerInputs = await collectAdminInputs({
    options,
    previousState,
  })
  const selectedConfigApps = await collectConfigAppSelection({
    options,
    configApps: dashwayConfig.apps,
    previousState,
  })
  const coreExecutionPlan = buildCoreInstallExecutionPlan({
    manifest,
    installSecret,
    installerInputs,
    composeEnvironment,
  })

  let bootstrapResponse = null
  for (const step of coreExecutionPlan) {
    bootstrapResponse = await executeInstallStep(step, bootstrapResponse)
  }

  if (bootstrapResponse === null) {
    throw new Error('Installer bootstrap step did not run.')
  }

  for (const step of buildSelectedConfigAppPlan(selectedConfigApps, composeEnvironment)) {
    await executeInstallStep(step, null)
  }

  const graphqlUrl = buildGraphqlUrl(manifest.core.bootstrapUrl)
  const accessToken = await loginContextApi({
    graphqlUrl,
    email: installerInputs.adminEmail,
    password: installerInputs.adminPassword,
  })
  const contextApps = await fetchContextApiApps({
    graphqlUrl,
    accessToken,
  })
  const selectedContextApps = resolveSelectedContextAppsByConfig({
    contextApps,
    selectedConfigApps,
  })
  await updateContextApiAppEnablement({
    graphqlUrl,
    accessToken,
    contextApps,
    selectedApps: selectedContextApps,
  })

  const state = {
    schemaVersion: INSTALLER_STATE_VERSION,
    installSecret,
    installedAt: previousState?.installedAt ?? new Date().toISOString(),
    lastAppliedAt: new Date().toISOString(),
    admin: {
      name: installerInputs.adminName,
      email: installerInputs.adminEmail,
    },
    selectedAppIds: selectedContextApps.map((app) => app.id),
    selectedAppNames: selectedConfigApps.map((app) => app.name),
    contextApi: {
      healthUrl: manifest.core.healthUrl,
      bootstrapUrl: manifest.core.bootstrapUrl,
      graphqlUrl,
    },
    bootstrap: bootstrapResponse,
  }
  await writeInstallState(statePath, state)

  console.log('Install completed.')
  console.log(`Admin email: ${bootstrapResponse.adminEmail}`)
  console.log(`Enabled apps: ${state.selectedAppNames.join(', ') || '(none)'}`)
  console.log(`State file: ${statePath}`)
}

function printHelp() {
  console.log(`Usage:
  pnpm install:stack --admin-name <name> --admin-email <email> --admin-password <password> [--apps chat,issue-tracker]

Notes:
  - Dashway Infra starts first, then Context API.
  - The installer reads app choices from dashway.config.json before app services start.
  - Interactive app selection uses a keyboard checklist: Up/Down, Space, Enter.
  - Selected apps are enabled in Context API only after their health checks pass.
  - In an interactive terminal, missing admin fields and app selection are prompted.
  - In a non-interactive terminal, required admin values and --apps must be passed as flags.`)
}

async function assertFileExists(filePath) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`Required file does not exist: ${filePath}`)
  }
}

function randomBootstrapSecret() {
  return randomBytes(24).toString('hex')
}

function buildCoreInstallExecutionPlan({ manifest, installSecret, installerInputs, composeEnvironment }) {
  return [
    {
      type: 'assert-file-exists',
      composeFile: manifest.infra.composeFile,
      unit: manifest.infra,
    },
    {
      type: 'assert-file-exists',
      composeFile: manifest.core.composeFile,
      unit: manifest.core,
    },
    {
      type: 'compose-up',
      unit: manifest.infra,
      environment: composeEnvironment,
      wait: true,
    },
    {
      type: 'compose-up',
      unit: manifest.core,
      environment: {
        ...composeEnvironment,
        CONTEXT_API_INSTALL_BOOTSTRAP_ENABLED: 'true',
        CONTEXT_API_INSTALL_BOOTSTRAP_SECRET: installSecret,
      },
      wait: false,
    },
    {
      type: 'wait-for-healthy',
      unit: manifest.core,
      url: manifest.core.healthUrl,
      timeoutMs: 120_000,
    },
    {
      type: 'bootstrap',
      unit: manifest.core,
      url: manifest.core.bootstrapUrl,
      headers: {
        'X-Dashway-Install-Secret': installSecret,
      },
      body: {
        admin: {
          name: installerInputs.adminName,
          email: installerInputs.adminEmail,
          password: installerInputs.adminPassword,
        },
        apps: [],
        selectedAppIds: [],
      },
    },
  ]
}

function buildSelectedConfigAppPlan(selectedApps, composeEnvironment) {
  return [
    ...selectedApps.map((app) => ({
      type: 'assert-file-exists',
      composeFile: app.composeFile,
      unit: app,
    })),
    ...selectedApps.map((app) => ({
      type: 'compose-up',
      unit: app,
      environment: composeEnvironment,
      wait: false,
    })),
    ...selectedApps.map((app) => ({
      type: 'wait-for-healthy',
      unit: app,
      url: app.healthUrl,
      timeoutMs: 120_000,
    })),
  ]
}

async function executeInstallStep(step, currentBootstrapResponse) {
  if (step.type === 'assert-file-exists') {
    await assertFileExists(path.join(repoRoot, step.composeFile))
    return currentBootstrapResponse
  }

  if (step.type === 'compose-up') {
    console.log(`Bringing up ${step.unit.displayName}...`)
    await runComposeUp({
      composeFile: path.join(repoRoot, step.unit.composeFile),
      environment: step.environment,
      wait: step.wait,
    })
    return currentBootstrapResponse
  }

  if (step.type === 'wait-for-healthy') {
    console.log(`Waiting for ${step.unit.displayName} install health endpoint...`)
    await waitForHealthy(step.url, step.timeoutMs)
    return currentBootstrapResponse
  }

  if (step.type === 'bootstrap') {
    console.log('Syncing installer bootstrap state into context-api...')
    return postJson({
      url: step.url,
      headers: step.headers,
      body: step.body,
    })
  }

  throw new Error(`Unknown install step type: ${step.type}`)
}

async function collectAdminInputs({ options, previousState }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    assertRequiredAdminOptions(options)

    return {
      adminName: options.adminName.trim(),
      adminEmail: options.adminEmail.trim(),
      adminPassword: options.adminPassword,
    }
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })
  try {
    const adminName = await promptRequiredValue(rl, {
      label: 'Admin name',
      value: options.adminName,
      defaultValue: previousState?.admin?.name,
    })
    const adminEmail = await promptRequiredValue(rl, {
      label: 'Admin email',
      value: options.adminEmail,
      defaultValue: previousState?.admin?.email,
    })
    const adminPassword = await promptRequiredValue(rl, {
      label: 'Admin password',
      value: options.adminPassword,
      secret: true,
    })
    return {
      adminName,
      adminEmail,
      adminPassword,
    }
  } finally {
    rl.close()
  }
}

async function promptRequiredValue(rl, { label, value, defaultValue, secret = false }) {
  const currentValue = value?.trim()
  if (currentValue) {
    return currentValue
  }

  while (true) {
    const suffix = defaultValue ? ` [${defaultValue}]` : ''
    const visibilityNote = secret ? ' (input visible)' : ''
    const answer = await rl.question(`${label}${suffix}${visibilityNote}: `)

    const trimmedAnswer = answer.trim()
    if (trimmedAnswer.length > 0) {
      return trimmedAnswer
    }
    if (defaultValue?.trim()) {
      return defaultValue.trim()
    }

    console.log(`${label} is required.`)
  }
}

async function collectConfigAppSelection({ options, configApps, previousState }) {
  if (configApps.length === 0) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      if (options.apps !== undefined && parseAppSelectionValue(options.apps).length > 0) {
        throw new Error('No apps are registered in dashway.config.json.')
      }
    } else {
      console.log('No selectable apps are registered in dashway.config.json.')
    }
    return []
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    if (options.apps === undefined) {
      throw new Error(
        `--apps is required in non-interactive mode. Available apps: ${configApps.map((app) => app.name).join(', ')}`,
      )
    }
    return resolveSelectedConfigApps(configApps, options.apps)
  }

  if (options.apps !== undefined) {
    return resolveSelectedConfigApps(configApps, options.apps)
  }

  return promptConfigAppSelection({
    input: process.stdin,
    output: process.stdout,
    configApps,
    initialSelectedAppIds: configApps
      .map((app) => app.id)
      .filter((appId) => previousState?.selectedAppNames?.includes(appId)),
  })
}

async function promptConfigAppSelection({ input, output, configApps, initialSelectedAppIds }) {
  if (typeof input.setRawMode !== 'function') {
    throw new Error('Interactive app selection requires a raw TTY. Use --apps to select apps in this terminal.')
  }

  return new Promise((resolve, reject) => {
    const selectedAppIds = new Set(
      configApps
        .map((app) => app.id)
        .filter((appId) => initialSelectedAppIds.includes(appId)),
    )
    const previousRawMode = input.isRaw === true
    const wasPaused = typeof input.isPaused === 'function' ? input.isPaused() : false
    let cursorIndex = 0
    let renderedLineCount = 0
    let settled = false

    function selectedAppsLabel() {
      const selectedNames = configApps
        .filter((app) => selectedAppIds.has(app.id))
        .map((app) => app.name)
      return selectedNames.join(', ') || '(none)'
    }

    function clearRenderedSelection() {
      if (renderedLineCount === 0) {
        return
      }

      moveCursor(output, 0, -renderedLineCount)
      for (let index = 0; index < renderedLineCount; index += 1) {
        clearLine(output, 0)
        if (index < renderedLineCount - 1) {
          moveCursor(output, 0, 1)
        }
      }
      if (renderedLineCount > 1) {
        moveCursor(output, 0, -(renderedLineCount - 1))
      }
      cursorTo(output, 0)
      renderedLineCount = 0
    }

    function renderSelection() {
      const lines = [
        'Select apps to install and enable.',
        '',
        ...configApps.map((app, index) => {
          const cursor = index === cursorIndex ? '>' : ' '
          const checked = selectedAppIds.has(app.id) ? 'x' : ' '
          return `${cursor} [${checked}] ${app.name} (:${app.port})`
        }),
        '',
        'Space toggle, Enter confirm, Up/Down or j/k move, q cancel',
      ]

      clearRenderedSelection()
      output.write(`${lines.join('\n')}\n`)
      renderedLineCount = lines.length
    }

    function cleanup() {
      input.off('data', handleKeypress)
      clearRenderedSelection()
      output.write('\x1b[?25h')
      input.setRawMode(previousRawMode)
      if (wasPaused) {
        input.pause()
      }
    }

    function finish(callback) {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      callback()
    }

    function moveSelection(direction) {
      cursorIndex = (cursorIndex + direction + configApps.length) % configApps.length
      renderSelection()
    }

    function toggleCurrentSelection() {
      const currentAppId = configApps[cursorIndex].id
      if (selectedAppIds.has(currentAppId)) {
        selectedAppIds.delete(currentAppId)
      } else {
        selectedAppIds.add(currentAppId)
      }
      renderSelection()
    }

    function handleKeypress(chunk) {
      const key = chunk.toString('utf8')

      if (key === '\u0003') {
        finish(() => {
          output.write('\n')
          reject(new Error('Install cancelled.'))
        })
        return
      }

      if (key === '\u001b' || key === 'q') {
        finish(() => {
          reject(new Error('App selection cancelled.'))
        })
        return
      }

      if (key === '\r' || key === '\n') {
        finish(() => {
          output.write(`Selected apps: ${selectedAppsLabel()}\n`)
          resolve(configApps.filter((app) => selectedAppIds.has(app.id)))
        })
        return
      }

      if (key === ' ') {
        toggleCurrentSelection()
        return
      }

      if (key === '\u001b[A' || key === 'k') {
        moveSelection(-1)
        return
      }

      if (key === '\u001b[B' || key === 'j') {
        moveSelection(1)
      }
    }

    output.write('\x1b[?25l')
    input.setRawMode(true)
    input.resume()
    input.on('data', handleKeypress)
    renderSelection()
  })
}

function resolveSelectedConfigApps(configApps, rawAppsValue) {
  const selectedValues = [...new Set(parseAppSelectionValue(rawAppsValue))]
  const selectedApps = []
  const unknownValues = []

  for (const selectedValue of selectedValues) {
    const app = configApps.find((candidate) => candidate.name === selectedValue)
    if (app) {
      selectedApps.push(app)
    } else {
      unknownValues.push(selectedValue)
    }
  }

  if (unknownValues.length > 0) {
    throw new Error(
      `Unknown apps: ${unknownValues.join(', ')}. Available apps: ${configApps.map((app) => app.name).join(', ')}`,
    )
  }

  return selectedApps
}

function resolveSelectedContextAppsByConfig({ contextApps, selectedConfigApps }) {
  const contextAppsByName = new Map()
  for (const app of contextApps) {
    if (contextAppsByName.has(app.name)) {
      throw new Error(`Context API returned duplicate apps named ${app.name}.`)
    }
    contextAppsByName.set(app.name, app)
  }

  const missingNames = selectedConfigApps
    .map((app) => app.name)
    .filter((name) => !contextAppsByName.has(name))
  if (missingNames.length > 0) {
    throw new Error(`Selected apps are missing from Context API app catalog: ${missingNames.join(', ')}`)
  }

  return selectedConfigApps.map((app) => contextAppsByName.get(app.name))
}

async function runComposeUp({ composeFile, environment, wait = false }) {
  const args = ['compose', '-f', composeFile, 'up', '-d', '--build']
  if (wait) {
    args.push('--wait')
  }

  await runCommand('docker', args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...environment,
    },
  })
}

function buildGraphqlUrl(bootstrapUrl) {
  const graphqlUrl = new URL(bootstrapUrl)
  graphqlUrl.pathname = '/graphql'
  graphqlUrl.search = ''
  graphqlUrl.hash = ''
  return graphqlUrl.toString()
}

async function loginContextApi({ graphqlUrl, email, password }) {
  const data = await postGraphql({
    url: graphqlUrl,
    query: `
      mutation InstallerLogin($input: LoginInput!) {
        login(input: $input) {
          tokens {
            accessToken
          }
        }
      }
    `,
    variables: {
      input: {
        email,
        password,
      },
    },
  })

  const accessToken = data?.login?.tokens?.accessToken
  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    throw new Error('Context API login response did not include an access token.')
  }

  return accessToken
}

async function fetchContextApiApps({ graphqlUrl, accessToken }) {
  const data = await postGraphql({
    url: graphqlUrl,
    accessToken,
    query: `
      query InstallerApps($page: Int!, $size: Int!) {
        apps(page: $page, size: $size) {
          apps {
            id
            name
            port
            isEnabled
          }
        }
      }
    `,
    variables: {
      page: 0,
      size: 100,
    },
  })

  const apps = data?.apps?.apps
  if (!Array.isArray(apps)) {
    throw new Error('Context API apps query did not return an app list.')
  }

  return apps.map((app) => ({
    id: String(app.id),
    name: String(app.name),
    port: Number(app.port),
    isEnabled: Boolean(app.isEnabled),
  }))
}

async function updateContextApiAppEnablement({ graphqlUrl, accessToken, contextApps, selectedApps }) {
  const selectedAppIds = new Set(selectedApps.map((app) => app.id))

  for (const app of contextApps) {
    const shouldEnable = selectedAppIds.has(app.id)
    if (app.isEnabled === shouldEnable) {
      continue
    }

    await postGraphql({
      url: graphqlUrl,
      accessToken,
      query: shouldEnable
        ? `
          mutation InstallerActivateApp($input: ActivateAppInput!) {
            activateApp(input: $input) {
              id
              isEnabled
            }
          }
        `
        : `
          mutation InstallerDeactivateApp($input: DeactivateAppInput!) {
            deactivateApp(input: $input) {
              id
              isEnabled
            }
          }
        `,
      variables: {
        input: {
          id: app.id,
        },
      },
    })
  }
}

async function waitForHealthy(url, timeoutMs) {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await request({
        url,
        method: 'GET',
      })
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return
      }
      lastError = new Error(`Health check returned status ${response.statusCode}.`)
    } catch (error) {
      lastError = error
    }
    await sleep(2_000)
  }

  throw new Error(
    `Timed out waiting for ${url} to become healthy.${lastError ? ` Last error: ${lastError.message}` : ''}`,
  )
}

async function postJson({ url, headers, body }) {
  const payload = JSON.stringify(body)
  const response = await request({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload).toString(),
      ...headers,
    },
    body: payload,
  })

  const text = response.body.toString('utf8')
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `HTTP request failed with status ${response.statusCode}: ${text || '(empty response)'}`,
    )
  }

  return text.length === 0 ? {} : JSON.parse(text)
}

async function postGraphql({ url, query, variables = {}, accessToken }) {
  const response = await postJson({
    url,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: {
      query,
      variables,
    },
  })

  if (Array.isArray(response.errors) && response.errors.length > 0) {
    const messages = response.errors
      .map((error) => error?.message)
      .filter(Boolean)
      .join('; ')
    throw new Error(`Context API GraphQL request failed: ${messages || JSON.stringify(response.errors)}`)
  }

  return response.data
}

function request({ url, method, headers = {}, body }) {
  const target = new URL(url)
  const transport = target.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const requestHandle = transport.request(
      target,
      {
        method,
        headers,
      },
      (response) => {
        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            body: Buffer.concat(chunks),
          })
        })
      },
    )

    requestHandle.on('error', reject)
    requestHandle.setTimeout(10_000, () => {
      requestHandle.destroy(new Error(`Request timed out for ${url}`))
    })

    if (body) {
      requestHandle.write(body)
    }
    requestHandle.end()
  })
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

function sleep(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
