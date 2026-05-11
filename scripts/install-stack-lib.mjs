import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const INSTALLER_STATE_VERSION = 1
const APP_NAME_PATTERN = /^[A-Za-z0-9_-]+$/

export function parseAppSelectionValue(rawAppsValue) {
  return rawAppsValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function parseCliArgs(argv) {
  const options = {
    adminName: undefined,
    adminEmail: undefined,
    adminPassword: undefined,
    apps: undefined,
    help: false,
  }
  const supportedFlags = new Set(['admin-name', 'admin-email', 'admin-password', 'apps', 'help'])

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help' || token === '-h') {
      options.help = true
      continue
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`)
    }

    const equalIndex = token.indexOf('=')
    const flag = equalIndex >= 0 ? token.slice(2, equalIndex) : token.slice(2)
    if (!supportedFlags.has(flag)) {
      throw new Error(`Unknown option: --${flag}`)
    }

    let value = equalIndex >= 0 ? token.slice(equalIndex + 1) : undefined
    if (value === undefined) {
      index += 1
      if (index >= argv.length) {
        throw new Error(`Option --${flag} requires a value.`)
      }
      value = argv[index]
    }

    switch (flag) {
      case 'admin-name':
        options.adminName = value
        break
      case 'admin-email':
        options.adminEmail = value
        break
      case 'admin-password':
        options.adminPassword = value
        break
      case 'apps':
        options.apps = value
        break
      default:
        throw new Error(`Unsupported option: --${flag}`)
    }
  }

  return options
}

export function parseUninstallCliArgs(argv) {
  const options = {
    help: false,
    keepImages: false,
    purgeServiceImages: false,
    yes: false,
  }
  const supportedFlags = new Map([
    ['help', 'help'],
    ['keep-images', 'keepImages'],
    ['purge-service-images', 'purgeServiceImages'],
    ['yes', 'yes'],
  ])

  for (const token of argv) {
    if (token === '-h') {
      options.help = true
      continue
    }
    if (token === '-y') {
      options.yes = true
      continue
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`)
    }

    const flag = token.slice(2)
    const optionName = supportedFlags.get(flag)
    if (!optionName) {
      throw new Error(`Unknown option: --${flag}`)
    }

    options[optionName] = true
  }

  if (options.keepImages && options.purgeServiceImages) {
    throw new Error('--keep-images cannot be used with --purge-service-images.')
  }

  return options
}

export function validateInstallerManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Installer manifest must be a JSON object.')
  }
  if (manifest.schemaVersion !== 2) {
    throw new Error(`Unsupported installer manifest schema version: ${manifest.schemaVersion}`)
  }

  assertInfraUnit(manifest.infra)
  assertCoreUnit(manifest.core)

  if (!Array.isArray(manifest.apps)) {
    throw new Error('Installer manifest apps must be an array.')
  }

  const seenAppIds = new Set()
  const seenCatalogIds = new Set()
  for (const app of manifest.apps) {
    assertAppUnit(app)
    if (seenAppIds.has(app.id)) {
      throw new Error(`Installer app id "${app.id}" is duplicated.`)
    }
    if (seenCatalogIds.has(app.catalog.id)) {
      throw new Error(`Installer app catalog id "${app.catalog.id}" is duplicated.`)
    }
    seenAppIds.add(app.id)
    seenCatalogIds.add(app.catalog.id)
  }

  return manifest
}

export async function loadInstallerManifest(manifestPath) {
  const manifestSource = await readFile(manifestPath, 'utf8')
  return validateInstallerManifest(JSON.parse(manifestSource))
}

export async function loadDashwayConfig(configPath) {
  const configSource = await readFile(configPath, 'utf8')
  const config = JSON.parse(configSource)
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('dashway.config.json must be a JSON object.')
  }
  if (config.schemaVersion !== 1) {
    throw new Error(`Unsupported dashway.config.json schema version: ${config.schemaVersion}`)
  }
  if (!Array.isArray(config.apps)) {
    throw new Error('dashway.config.json apps must be an array.')
  }
  const postgres = normalizePostgresConfig(config.database?.postgres)

  const apps = config.apps.map((app, index) => {
    const configPath = `apps[${index}]`
    if (!app || typeof app !== 'object' || Array.isArray(app)) {
      throw new Error(`dashway.config.json ${configPath} must be an object.`)
    }

    const name = requireConfigString(app, 'name', `${configPath}.name`)
    if (!APP_NAME_PATTERN.test(name)) {
      throw new Error(
        `dashway.config.json ${configPath}.name may only contain letters, numbers, underscores, and hyphens.`,
      )
    }
    const composeFile = requireConfigString(app, 'composeFile', `${configPath}.composeFile`)
    const port = app.port
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`dashway.config.json ${configPath}.port must be a positive integer.`)
    }

    return {
      id: buildDeterministicAppId(name),
      name,
      port,
      composeFile,
      displayName: name,
    }
  })

  const duplicateNames = apps
    .map((app) => app.name)
    .filter((name, index, names) => names.indexOf(name) !== index)
  if (duplicateNames.length > 0) {
    throw new Error(`dashway.config.json apps contain duplicate names: ${[...new Set(duplicateNames)].join(', ')}`)
  }

  return {
    ...config,
    database: {
      ...config.database,
      postgres,
    },
    apps,
  }
}

export function buildComposeEnvironment(config) {
  const postgres = config.database.postgres
  return {
    DASHWAY_POSTGRES_DB: postgres.databases.contextApi,
    DASHWAY_POSTGRES_HOST: postgres.host,
    DASHWAY_POSTGRES_PUBLIC_HOST: postgres.publicHost,
    DASHWAY_POSTGRES_PUBLIC_PORT: String(postgres.port),
    DASHWAY_POSTGRES_USER: postgres.username,
    DASHWAY_POSTGRES_PASSWORD: postgres.password,
  }
}

export function buildContextApiComposeEnvironment(config) {
  return buildSpringDatasourceEnvironment(config, 'contextApi')
}

export function buildAppComposeEnvironment(config, app) {
  return {
    DASHWAY_APP_NAME: app.name,
    ...buildSpringDatasourceEnvironment(config, 'chat'),
    CHAT_CONTEXT_API_BASE_URL: 'http://context-api:8080',
  }
}

function buildSpringDatasourceEnvironment(config, databaseKey) {
  const postgres = config.database.postgres
  const databaseName = postgres.databases[databaseKey]
  if (typeof databaseName !== 'string' || databaseName.trim().length === 0) {
    throw new Error(`dashway.config.json database.postgres.databases.${databaseKey} must be a non-empty string.`)
  }

  return {
    SPRING_DATASOURCE_URL: `jdbc:postgresql://${postgres.host}:${postgres.port}/${databaseName}`,
    SPRING_DATASOURCE_USERNAME: postgres.username,
    SPRING_DATASOURCE_PASSWORD: postgres.password,
  }
}

function buildDeterministicAppId(name) {
  const hash = createHash('sha256')
    .update(`dashway-app:${name}`)
    .digest('hex')
  const variantByte = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0')

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${variantByte}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}

export function buildComposeInstallPlan({ manifest, selectedAppUnits }) {
  return [
    { ...manifest.infra, kind: 'infra' },
    { ...manifest.core, kind: 'core' },
    ...selectedAppUnits.map((appUnit) => ({ ...appUnit, kind: 'app' })),
  ]
}

export function buildInstallExecutionPlan({
  manifest,
  selectedAppUnits,
  installSecret,
  installerInputs,
}) {
  const composeInstallPlan = buildComposeInstallPlan({
    manifest,
    selectedAppUnits,
  })
  const [infraUnit, coreUnit, ...appComposeUnits] = composeInstallPlan
  const bootstrapPayload = {
    admin: {
      name: installerInputs.adminName,
      email: installerInputs.adminEmail,
      password: installerInputs.adminPassword,
    },
    apps: manifest.apps.map((appUnit) => ({
      id: appUnit.catalog.id,
      name: appUnit.catalog.name,
      port: appUnit.catalog.port,
    })),
    selectedAppIds: selectedAppUnits.map((appUnit) => appUnit.catalog.id),
  }

  return [
    ...composeInstallPlan.map((composeUnit) => ({
      type: 'assert-file-exists',
      composeFile: composeUnit.composeFile,
      unit: composeUnit,
    })),
    {
      type: 'compose-up',
      unit: infraUnit,
      environment: {},
      wait: true,
    },
    {
      type: 'compose-up',
      unit: coreUnit,
      environment: {
        CONTEXT_API_INSTALL_BOOTSTRAP_ENABLED: 'true',
        CONTEXT_API_INSTALL_BOOTSTRAP_SECRET: installSecret,
      },
      wait: false,
    },
    {
      type: 'wait-for-healthy',
      unit: coreUnit,
      url: manifest.core.healthUrl,
      timeoutMs: 120_000,
    },
    {
      type: 'bootstrap',
      unit: coreUnit,
      url: manifest.core.bootstrapUrl,
      headers: {
        'X-Dashway-Install-Secret': installSecret,
      },
      body: bootstrapPayload,
    },
    ...appComposeUnits.map((appUnit) => ({
      type: 'compose-up',
      unit: appUnit,
      environment: {},
      wait: false,
    })),
  ]
}

export function buildComposeUninstallPlan({
  manifest,
  configApps,
  purgeServiceImages = false,
  removeImages = true,
}) {
  const appsInShutdownOrder = [...configApps].reverse()
  const unitsInShutdownOrder = [
    ...appsInShutdownOrder.map((app) => ({
      ...app,
      kind: 'app',
    })),
    {
      ...manifest.core,
      kind: 'core',
    },
    {
      ...manifest.infra,
      kind: 'infra',
    },
  ]

  return [
    ...unitsInShutdownOrder.map((unit) => ({
      type: 'assert-file-exists',
      composeFile: unit.composeFile,
      unit,
    })),
    ...unitsInShutdownOrder.map((unit) => ({
      type: 'compose-down',
      composeFile: unit.composeFile,
      removeImages: removeImages && (unit.kind !== 'infra' || purgeServiceImages),
      unit,
    })),
  ]
}

export function resolveSelectedAppUnits(manifest, rawAppsValue) {
  const appIds = manifest.apps.map((app) => app.id)
  if (rawAppsValue === undefined) {
    return []
  }

  const selectedIds = parseAppSelectionValue(rawAppsValue)
  const dedupedIds = [...new Set(selectedIds)]
  const unknownIds = dedupedIds.filter((id) => !appIds.includes(id))
  if (unknownIds.length > 0) {
    throw new Error(`Unknown app ids: ${unknownIds.join(', ')}`)
  }

  return dedupedIds.map((selectedId) =>
    manifest.apps.find((app) => app.id === selectedId),
  )
}

export function assertRequiredAdminOptions(options) {
  const missingFlags = []
  if (!options.adminName?.trim()) {
    missingFlags.push('--admin-name')
  }
  if (!options.adminEmail?.trim()) {
    missingFlags.push('--admin-email')
  }
  if (!options.adminPassword?.trim()) {
    missingFlags.push('--admin-password')
  }

  if (missingFlags.length > 0) {
    throw new Error(`Missing required options: ${missingFlags.join(', ')}`)
  }
}

export function toggleSelectedAppIds(currentSelectedIds, appUnits, rawInput) {
  const trimmedInput = rawInput.trim()
  if (trimmedInput.length === 0) {
    return [...currentSelectedIds]
  }

  const nextSelectedIds = new Set(currentSelectedIds)
  const tokens = trimmedInput
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return [...nextSelectedIds]
  }

  for (const token of tokens) {
    const parsedIndex = Number.parseInt(token, 10)
    if (!Number.isInteger(parsedIndex)) {
      throw new Error(`Invalid selection "${token}". Use app numbers like 1,2.`)
    }
    if (parsedIndex < 1 || parsedIndex > appUnits.length) {
      throw new Error(`Selection ${parsedIndex} is out of range. Choose between 1 and ${appUnits.length}.`)
    }

    const appId = appUnits[parsedIndex - 1].id
    if (nextSelectedIds.has(appId)) {
      nextSelectedIds.delete(appId)
    } else {
      nextSelectedIds.add(appId)
    }
  }

  return appUnits
    .map((appUnit) => appUnit.id)
    .filter((appId) => nextSelectedIds.has(appId))
}

export function buildStatePath(installRoot) {
  return path.join(installRoot, '.dashway', 'install-state.json')
}

export async function readInstallState(statePath) {
  try {
    const stateSource = await readFile(statePath, 'utf8')
    return JSON.parse(stateSource)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export async function writeInstallState(statePath, state) {
  await mkdir(path.dirname(statePath), { recursive: true, mode: 0o700 })
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
}

function assertInfraUnit(infra) {
  assertComposeUnit(infra, 'infra', ['id', 'displayName', 'composeFile'])
}

function assertCoreUnit(core) {
  assertComposeUnit(core, 'core', ['id', 'displayName', 'composeFile', 'healthUrl', 'bootstrapUrl'])
}

function assertComposeUnit(unit, unitName, fields) {
  if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
    throw new Error(`Installer manifest ${unitName} must be an object.`)
  }

  for (const field of fields) {
    if (typeof unit[field] !== 'string' || unit[field].trim().length === 0) {
      throw new Error(`Installer ${unitName} field "${field}" must be a non-empty string.`)
    }
  }
}

function assertAppUnit(app) {
  assertComposeUnit(app, 'app', ['id', 'displayName', 'composeFile'])
  if (!app.catalog || typeof app.catalog !== 'object' || Array.isArray(app.catalog)) {
    throw new Error(`Installer app "${app.id}" is missing a catalog definition.`)
  }
  for (const field of ['id', 'name']) {
    if (typeof app.catalog[field] !== 'string' || app.catalog[field].trim().length === 0) {
      throw new Error(`Installer app "${app.id}" catalog field "${field}" must be a non-empty string.`)
    }
  }
  if (!Number.isInteger(app.catalog.port) || app.catalog.port <= 0) {
    throw new Error(`Installer app "${app.id}" catalog port must be a positive integer.`)
  }
}

function normalizePostgresConfig(postgres) {
  if (!postgres || typeof postgres !== 'object' || Array.isArray(postgres)) {
    throw new Error('dashway.config.json database.postgres must be an object.')
  }

  const host = requireConfigString(postgres, 'host', 'database.postgres.host')
  const publicHost = requireConfigString(postgres, 'publicHost', 'database.postgres.publicHost')
  const username = requireConfigString(postgres, 'username', 'database.postgres.username')
  const password = requireConfigString(postgres, 'password', 'database.postgres.password')
  const port = postgres.port
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('dashway.config.json database.postgres.port must be a positive integer.')
  }

  const databases = postgres.databases
  if (!databases || typeof databases !== 'object' || Array.isArray(databases)) {
    throw new Error('dashway.config.json database.postgres.databases must be an object.')
  }
  const contextApiDatabase = requireConfigString(databases, 'contextApi', 'database.postgres.databases.contextApi')
  const chatDatabase = requireConfigString(databases, 'chat', 'database.postgres.databases.chat')

  return {
    host,
    publicHost,
    port,
    username,
    password,
    databases: {
      contextApi: contextApiDatabase,
      chat: chatDatabase,
    },
  }
}

function requireConfigString(object, field, configPath) {
  const value = object[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`dashway.config.json ${configPath} must be a non-empty string.`)
  }
  return value.trim()
}
