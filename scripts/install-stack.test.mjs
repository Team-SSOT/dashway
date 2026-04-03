import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertRequiredAdminOptions,
  parseCliArgs,
  resolveSelectedAppUnits,
  toggleSelectedAppIds,
  validateInstallerManifest,
} from './install-stack-lib.mjs'

const manifestFixture = validateInstallerManifest({
  schemaVersion: 1,
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
        schemaVersion: 1,
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
