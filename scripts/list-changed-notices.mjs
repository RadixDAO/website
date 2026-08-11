#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const [base, head = 'HEAD'] = process.argv.slice(2)
if (!base) throw new Error('Usage: list-changed-notices.mjs <base> [head]')

const zeroSha = /^0+$/
const args = zeroSha.test(base)
  ? ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', head]
  : ['diff', '--name-only', '--diff-filter=A', base, head]
const { stdout } = await execFileAsync('git', args)
const slugs = stdout
  .split('\n')
  .filter((file) => /^src\/content\/notices\/[^/]+\.md$/.test(file))
  .map((file) => file.split('/').at(-1).replace(/\.md$/, ''))

const value = slugs.join(',')
if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, `slugs=${value}\n`, { flag: 'a' })
} else {
  console.log(value)
}
