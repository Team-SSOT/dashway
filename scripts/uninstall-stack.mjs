import { spawn } from 'node:child_process'
import { access, rm, rmdir } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  buildComposeEnvironment,
  buildComposeUninstallPlan,
  buildStatePath,
  loadDashwayConfig,
  loadInstallerManifest,
  parseUninstallCliArgs,
  readInstallState,
} from './install-stack-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(repoRoot, 'installer', 'manifest.json')
const dashwayConfigPath = path.join(repoRoot, 'dashway.config.json')

async function main() {
  const options = parseUninstallCliArgs(process.argv.slice(2))
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
  const uninstallPlan = buildComposeUninstallPlan({
    manifest,
    configApps: dashwayConfig.apps,
    purgeServiceImages: options.purgeServiceImages,
    removeImages: !options.keepImages,
  })

  await confirmUninstall({
    options,
    previousState,
    statePath,
  })

  for (const step of uninstallPlan) {
    await executeUninstallStep(step, composeEnvironment)
  }

  await removeInstallState(statePath)

  console.log('Uninstall completed.')
  console.log(`State file removed: ${statePath}`)
}

function printHelp() {
  console.log(`Usage:
  pnpm uninstall:stack --yes [--keep-images] [--purge-service-images]

Notes:
  - Stops and removes configured apps, Context API, then Dashway Infra.
  - Docker Compose cleanup uses down --volumes --remove-orphans.
  - Context API and app service images are removed by default.
  - Infra service images such as postgres, redis, and meilisearch are kept by default.
  - Use --purge-service-images to also remove infra service images.
  - Use --keep-images to keep all Docker images.
  - The installer state file is removed after Compose cleanup succeeds.
  - In a non-interactive terminal, --yes is required.`)
}

async function confirmUninstall({ options, previousState, statePath }) {
  if (options.yes) {
    return
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Uninstall requires --yes in a non-interactive terminal.')
  }

  console.log('This will remove Dashway containers, networks, volumes, and installer state.')
  if (options.keepImages) {
    console.log('Docker images will be kept.')
  } else if (options.purgeServiceImages) {
    console.log('All Compose service images, including infra images, will be removed.')
  } else {
    console.log('Context API and app service images will be removed; infra images will be kept.')
  }
  if (!previousState) {
    console.log(`No installer state file was found at ${statePath}; Compose cleanup will still run.`)
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })
  try {
    const answer = await rl.question('Continue uninstall? [y/N]: ')
    const normalized = answer.trim().toLowerCase()
    if (normalized !== 'y' && normalized !== 'yes') {
      throw new Error('Uninstall cancelled.')
    }
  } finally {
    rl.close()
  }
}

async function executeUninstallStep(step, composeEnvironment) {
  if (step.type === 'assert-file-exists') {
    await assertFileExists(path.join(repoRoot, step.composeFile))
    return
  }

  if (step.type === 'compose-down') {
    const imageNote = step.removeImages ? ' and service images' : ''
    console.log(`Removing ${step.unit.displayName}${imageNote}...`)
    await runComposeDown({
      composeFile: path.join(repoRoot, step.composeFile),
      environment: composeEnvironment,
      removeImages: step.removeImages,
    })
    return
  }

  throw new Error(`Unknown uninstall step type: ${step.type}`)
}

async function assertFileExists(filePath) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`Required file does not exist: ${filePath}`)
  }
}

async function runComposeDown({ composeFile, environment, removeImages }) {
  const args = ['compose', '-f', composeFile, 'down', '--volumes', '--remove-orphans']
  if (removeImages) {
    args.push('--rmi', 'all')
  }

  await runCommand('docker', args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...environment,
    },
  })
}

async function removeInstallState(statePath) {
  await rm(statePath, { force: true })
  try {
    await rmdir(path.dirname(statePath))
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'ENOTEMPTY') {
      throw error
    }
  }
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

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
