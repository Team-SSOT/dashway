import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  INSTALLER_STATE_VERSION,
  assertRequiredAdminOptions,
  buildInstallExecutionPlan,
  buildStatePath,
  loadInstallerManifest,
  parseCliArgs,
  readInstallState,
  resolveSelectedAppUnits,
  toggleSelectedAppIds,
  writeInstallState,
} from './install-stack-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(repoRoot, 'installer', 'manifest.json')

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const manifest = await loadInstallerManifest(manifestPath)
  const installRoot = process.cwd()
  const statePath = buildStatePath(installRoot)
  const previousState = await readInstallState(statePath)
  const installSecret = previousState?.installSecret ?? randomBootstrapSecret()
  const installerInputs = await collectInstallerInputs({
    options,
    manifest,
    previousState,
  })
  const selectedAppUnits = installerInputs.selectedAppUnits
  const executionPlan = buildInstallExecutionPlan({
    manifest,
    selectedAppUnits,
    installSecret,
    installerInputs,
  })

  if (manifest.apps.length === 0) {
    console.log('No selectable app services are registered yet. Installing infrastructure and context-api only.')
  }

  let bootstrapResponse = null
  for (const step of executionPlan) {
    if (step.type === 'assert-file-exists') {
      await assertFileExists(path.join(repoRoot, step.composeFile))
      continue
    }

    if (step.type === 'compose-up') {
      console.log(`Bringing up ${step.unit.displayName}...`)
      await runComposeUp({
        composeFile: path.join(repoRoot, step.unit.composeFile),
        environment: step.environment,
        wait: step.wait,
      })
      continue
    }

    if (step.type === 'wait-for-healthy') {
      console.log(`Waiting for ${step.unit.displayName} install health endpoint...`)
      await waitForHealthy(step.url, step.timeoutMs)
      continue
    }

    if (step.type === 'bootstrap') {
      console.log('Syncing installer bootstrap state into context-api...')
      bootstrapResponse = await postJson({
        url: step.url,
        headers: step.headers,
        body: step.body,
      })
    }
  }

  if (bootstrapResponse === null) {
    throw new Error('Installer bootstrap step did not run.')
  }

  const state = {
    schemaVersion: INSTALLER_STATE_VERSION,
    installSecret,
    installedAt: previousState?.installedAt ?? new Date().toISOString(),
    lastAppliedAt: new Date().toISOString(),
    admin: {
      name: installerInputs.adminName,
      email: installerInputs.adminEmail,
    },
    selectedAppIds: selectedAppUnits.map((appUnit) => appUnit.id),
    contextApi: {
      healthUrl: manifest.core.healthUrl,
      bootstrapUrl: manifest.core.bootstrapUrl,
    },
    bootstrap: bootstrapResponse,
  }
  await writeInstallState(statePath, state)

  console.log('Install completed.')
  console.log(`Admin email: ${bootstrapResponse.adminEmail}`)
  console.log(`Enabled app ids: ${state.selectedAppIds.join(', ') || '(none)'}`)
  console.log(`State file: ${statePath}`)
}

function printHelp() {
  console.log(`Usage:
  pnpm install:stack --admin-name <name> --admin-email <email> --admin-password <password> [--apps app-a,app-b]

Notes:
  - The installer reads server units from installer/manifest.json.
  - Dashway Infra starts first, then Context API.
  - In an interactive terminal, missing admin fields and app selection are prompted.
  - In a non-interactive terminal, required values must be passed as flags.`)
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

async function collectInstallerInputs({ options, manifest, previousState }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    assertRequiredAdminOptions(options)
    if (manifest.apps.length > 0 && options.apps === undefined) {
      throw new Error(
        `--apps is required in non-interactive mode. Available app ids: ${manifest.apps.map((appUnit) => appUnit.id).join(', ')}`,
      )
    }

    return {
      adminName: options.adminName.trim(),
      adminEmail: options.adminEmail.trim(),
      adminPassword: options.adminPassword,
      selectedAppUnits: resolveSelectedAppUnits(manifest, options.apps),
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
    const selectedAppUnits = options.apps !== undefined
      ? resolveSelectedAppUnits(manifest, options.apps)
      : await promptAppSelection(rl, {
          appUnits: manifest.apps,
          initialSelectedAppIds: previousState?.selectedAppIds ?? [],
        })

    return {
      adminName,
      adminEmail,
      adminPassword,
      selectedAppUnits,
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

async function promptAppSelection(rl, { appUnits, initialSelectedAppIds }) {
  if (appUnits.length === 0) {
    console.log('No selectable app services are registered yet. Installing context-api only.')
    return []
  }

  let selectedAppIds = appUnits
    .map((appUnit) => appUnit.id)
    .filter((appId) => initialSelectedAppIds.includes(appId))

  console.log('Select app services to install.')
  console.log('Toggle by entering numbers separated with commas. Press Enter when the selection is complete.')

  while (true) {
    console.log('')
    appUnits.forEach((appUnit, index) => {
      const checked = selectedAppIds.includes(appUnit.id) ? 'x' : ' '
      console.log(`[${checked}] ${index + 1}. ${appUnit.displayName} (${appUnit.id})`)
    })

    const answer = await rl.question('Toggle app numbers, or press Enter to continue: ')
    const trimmedAnswer = answer.trim()
    if (trimmedAnswer.length === 0) {
      console.log(
        `Selected apps: ${selectedAppIds.length > 0 ? selectedAppIds.join(', ') : '(none)'}`,
      )
      return resolveSelectedAppUnits(
        { ...manifestShapeForResolution(appUnits) },
        selectedAppIds.join(','),
      )
    }

    try {
      selectedAppIds = toggleSelectedAppIds(selectedAppIds, appUnits, trimmedAnswer)
    } catch (error) {
      console.log(error.message)
    }
  }
}

function manifestShapeForResolution(appUnits) {
  return {
    apps: appUnits,
  }
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
      `Bootstrap request failed with status ${response.statusCode}: ${text || '(empty response)'}`,
    )
  }

  return text.length === 0 ? {} : JSON.parse(text)
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
