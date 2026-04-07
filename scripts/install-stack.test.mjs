import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertRequiredAdminOptions,
  buildComposeInstallPlan,
  buildInstallExecutionPlan,
  parseCliArgs,
  resolveSelectedAppUnits,
  toggleSelectedAppIds,
  validateInstallerManifest,
} from './install-stack-lib.mjs'

const manifestFixture = validateInstallerManifest({
  schemaVersion: 2,
  infra: {
    id: 'dashway-infra',
    displayName: 'Dashway Infra',
    composeFile: 'docker-compose.yml',
  },
  core: {
    id: 'context-api',
    displayName: 'Context API',
    composeFile: 'context-api/docker-compose.yml',
    healthUrl: 'http://127.0.0.1:8080/internal/install/health',
    bootstrapUrl: 'http://127.0.0.1:8080/internal/install/bootstrap',
  },
  apps: [
    {
      id: 'chat-api',
      displayName: 'Chat API',
      composeFile: 'apps/chat-api/docker-compose.yml',
      catalog: {
        id: 'fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7',
        name: 'chat',
        port: 8090,
      },
    },
    {
      id: 'tasks-api',
      displayName: 'Tasks API',
      composeFile: 'apps/tasks-api/docker-compose.yml',
      catalog: {
        id: 'b4666c56-e479-4c7f-a99e-c881d9c239e9',
        name: 'tasks',
        port: 8091,
      },
    },
  ],
})

const installerInputsFixture = {
  adminName: 'Alice Admin',
  adminEmail: 'admin@example.com',
  adminPassword: 'super-secret',
}

test('parseCliArgs accepts inline and separated flags', () => {
  const options = parseCliArgs([
    '--admin-name',
    'Alice Admin',
    '--admin-email=admin@example.com',
    '--admin-password',
    'super-secret',
    '--apps=chat-api,tasks-api',
  ])

  assert.equal(options.adminName, 'Alice Admin')
  assert.equal(options.adminEmail, 'admin@example.com')
  assert.equal(options.adminPassword, 'super-secret')
  assert.equal(options.apps, 'chat-api,tasks-api')
})

test('assertRequiredAdminOptions rejects missing admin flags', () => {
  assert.throws(
    () => assertRequiredAdminOptions({ adminName: 'Alice', adminEmail: '', adminPassword: '' }),
    /Missing required options: --admin-email, --admin-password/,
  )
})

test('resolveSelectedAppUnits returns deduped app units in selection order', () => {
  const appUnits = resolveSelectedAppUnits(manifestFixture, 'tasks-api,chat-api,tasks-api')

  assert.deepEqual(
    appUnits.map((appUnit) => appUnit.id),
    ['tasks-api', 'chat-api'],
  )
})

test('resolveSelectedAppUnits rejects unknown app ids', () => {
  assert.throws(
    () => resolveSelectedAppUnits(manifestFixture, 'missing-api'),
    /Unknown app ids: missing-api/,
  )
})

test('resolveSelectedAppUnits returns empty when apps are omitted', () => {
  const appUnits = resolveSelectedAppUnits(manifestFixture, undefined)

  assert.deepEqual(appUnits, [])
})

test('validateInstallerManifest rejects duplicate catalog ids', () => {
  assert.throws(
    () =>
      validateInstallerManifest({
        schemaVersion: 2,
        infra: manifestFixture.infra,
        core: manifestFixture.core,
        apps: [
          manifestFixture.apps[0],
          {
            ...manifestFixture.apps[1],
            catalog: {
              ...manifestFixture.apps[0].catalog,
            },
          },
        ],
      }),
    /catalog id .* is duplicated/,
  )
})

test('validateInstallerManifest rejects a missing infra definition', () => {
  assert.throws(
    () =>
      validateInstallerManifest({
        schemaVersion: 2,
        core: manifestFixture.core,
        apps: [],
      }),
    /Installer manifest infra must be an object/,
  )
})

test('toggleSelectedAppIds toggles entries by number order', () => {
  const selectedAppIds = toggleSelectedAppIds(['chat-api'], manifestFixture.apps, '1,2')

  assert.deepEqual(selectedAppIds, ['tasks-api'])
})

test('toggleSelectedAppIds rejects out of range selections', () => {
  assert.throws(
    () => toggleSelectedAppIds([], manifestFixture.apps, '3'),
    /Selection 3 is out of range/,
  )
})

test('buildComposeInstallPlan returns infra, core, and selected apps in install order', () => {
  const composeInstallPlan = buildComposeInstallPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[1], manifestFixture.apps[0]],
  })

  assert.deepEqual(
    composeInstallPlan.map((composeUnit) => `${composeUnit.kind}:${composeUnit.id}`),
    ['infra:dashway-infra', 'core:context-api', 'app:tasks-api', 'app:chat-api'],
  )
})

test('buildInstallExecutionPlan returns the installer steps in execution order', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[1], manifestFixture.apps[0]],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  assert.deepEqual(
    executionPlan.map((step) => `${step.type}:${step.unit.id}`),
    [
      'assert-file-exists:dashway-infra',
      'assert-file-exists:context-api',
      'assert-file-exists:tasks-api',
      'assert-file-exists:chat-api',
      'compose-up:dashway-infra',
      'compose-up:context-api',
      'wait-for-healthy:context-api',
      'bootstrap:context-api',
      'compose-up:tasks-api',
      'compose-up:chat-api',
    ],
  )
})

test('buildInstallExecutionPlan validates compose files for infra, core, and selected apps', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[0]],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  assert.deepEqual(
    executionPlan
      .filter((step) => step.type === 'assert-file-exists')
      .map((step) => step.composeFile),
    [
      'docker-compose.yml',
      'context-api/docker-compose.yml',
      'apps/chat-api/docker-compose.yml',
    ],
  )
})

test('buildInstallExecutionPlan marks only infra compose-up with wait', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[0]],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  assert.deepEqual(
    executionPlan
      .filter((step) => step.type === 'compose-up')
      .map((step) => ({ id: step.unit.id, wait: step.wait })),
    [
      { id: 'dashway-infra', wait: true },
      { id: 'context-api', wait: false },
      { id: 'chat-api', wait: false },
    ],
  )
})

test('buildInstallExecutionPlan includes bootstrap env on the core compose step', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[0]],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  const coreComposeStep = executionPlan.find(
    (step) => step.type === 'compose-up' && step.unit.id === 'context-api',
  )

  assert.deepEqual(coreComposeStep.environment, {
    CONTEXT_API_INSTALL_BOOTSTRAP_ENABLED: 'true',
    CONTEXT_API_INSTALL_BOOTSTRAP_SECRET: 'install-secret',
  })
})

test('buildInstallExecutionPlan builds the bootstrap payload from the manifest and selection', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [manifestFixture.apps[1]],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  const bootstrapStep = executionPlan.find((step) => step.type === 'bootstrap')

  assert.deepEqual(bootstrapStep.body, {
    admin: {
      name: 'Alice Admin',
      email: 'admin@example.com',
      password: 'super-secret',
    },
    apps: [
      {
        id: 'fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7',
        name: 'chat',
        port: 8090,
      },
      {
        id: 'b4666c56-e479-4c7f-a99e-c881d9c239e9',
        name: 'tasks',
        port: 8091,
      },
    ],
    selectedAppIds: ['b4666c56-e479-4c7f-a99e-c881d9c239e9'],
  })
})

test('buildInstallExecutionPlan omits app compose steps when no apps are selected', () => {
  const executionPlan = buildInstallExecutionPlan({
    manifest: manifestFixture,
    selectedAppUnits: [],
    installSecret: 'install-secret',
    installerInputs: installerInputsFixture,
  })

  assert.deepEqual(
    executionPlan
      .filter((step) => step.type === 'compose-up')
      .map((step) => step.unit.id),
    ['dashway-infra', 'context-api'],
  )
})
