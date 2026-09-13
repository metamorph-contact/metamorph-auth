import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const saasRoot = resolve(root, '../metamorph-saas')
const catalogPath = join(saasRoot, 'config/central-identity/identity-catalog.development.json')
const releasePath = join(root, 'catalog/identity-ui-release.development.json')
const lockPath = join(saasRoot, 'config/central-identity/identity-catalog-version-lock.json')
const keyPath = join(saasRoot, 'config/central-identity/catalog-root-signing.development.pem')
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
const version = catalog.catalogVersion
const checkedPublicationRoot = join(root, 'catalog/publication')
const checkedVersionRoot = join(checkedPublicationRoot, version)
const temporary = mkdtempSync(join(tmpdir(), 'metamorph-auth-catalog-'))
const check = process.argv.includes('--check')

function run(command, ...args) {
  execFileSync(command, args, { cwd: saasRoot, stdio: 'inherit' })
}

function files(directory, prefix = '') {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    const relative = join(prefix, name)
    return statSync(path).isDirectory() ? files(path, relative) : [relative]
  }).sort()
}

function assertTree(expected, actual) {
  const expectedFiles = files(expected)
  const actualFiles = files(actual)
  if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) {
    throw new Error(`generated catalog file set drift: ${actual}`)
  }
  for (const relative of expectedFiles) {
    if (!readFileSync(join(expected, relative)).equals(readFileSync(join(actual, relative)))) {
      throw new Error(`generated catalog content drift: ${join(actual, relative)}`)
    }
  }
}

try {
  run(
    'cargo', 'run', '--quiet', '-p', 'metamorph-identity-catalog', '--bin', 'identity_catalog', '--',
    'author', catalogPath, releasePath, root, lockPath, keyPath, temporary,
  )
  run(
    'cargo', 'run', '--quiet', '-p', 'metamorph-identity-catalog', '--bin', 'identity_catalog', '--',
    'verify-publication', catalogPath, releasePath, root, lockPath, temporary,
  )
  const generated = join(temporary, version)
  if (check) {
    if (!existsSync(checkedVersionRoot)) throw new Error('signed development catalog publication is missing')
    assertTree(generated, checkedVersionRoot)
  } else {
    rmSync(checkedVersionRoot, { recursive: true, force: true })
    cpSync(generated, checkedVersionRoot, { recursive: true, errorOnExist: true })
  }
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
