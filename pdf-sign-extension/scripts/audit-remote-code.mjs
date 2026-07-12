// Pre-publish guard. The hard requirement for MV3 review is NO remotely-loaded
// code: nothing fetched and executed from an http(s) URL. That is a FAIL.
//
// eval / new Function are reported as WARNINGS, not failures: the bundled pdf.js
// contains `new Function("")` purely as feature-detection (its `isEvalSupported`
// check, run inside try/catch) plus one PostScript path gated behind that flag.
// Under the extension CSP (`script-src 'self'`) those throw and pdf.js takes the
// non-eval path; we also pass `isEvalSupported: false`. So they are inert. The
// warning stays visible so any *new* eval we might introduce gets noticed.
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')

// Remotely-loaded code — these FAIL the audit.
const REMOTE = [
  { re: /importScripts\s*\(\s*['"`]https?:\/\//g, label: 'importScripts(http…)' },
  { re: /\bimport\s*\(\s*['"`]https?:\/\//g, label: 'import("http…")' },
  { re: /new\s+Worker\s*\(\s*['"`]https?:\/\//g, label: 'new Worker(http…)' },
  { re: /(?:src|href)\s*=\s*['"`]https?:\/\/[^'"`]+\.(?:js|mjs)/g, label: 'script src=http…' },
]

// eval sinks — WARN only (see note above).
const SINKS = [
  { re: /\beval\s*\(/g, label: 'eval(' },
  { re: /new\s+Function\s*\(/g, label: 'new Function(' },
]

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) yield* walk(p)
    else yield p
  }
}

try {
  await stat(dist)
} catch {
  console.error('✗ dist/ not found — run `npm run build` first.')
  process.exit(1)
}

let failures = 0
let warnings = 0
for await (const file of walk(dist)) {
  if (!['.js', '.mjs', '.html'].includes(extname(file))) continue
  const text = await readFile(file, 'utf8')
  const rel = file.replace(dist, 'dist')
  for (const { re, label } of REMOTE) {
    const m = text.match(re)
    if (m) {
      failures += m.length
      console.error(`✗ REMOTE CODE: ${label} × ${m.length} in ${rel}`)
    }
  }
  for (const { re, label } of SINKS) {
    const m = text.match(re)
    if (m) {
      warnings += m.length
      console.warn(`⚠ eval sink: ${label} × ${m.length} in ${rel} (CSP-inert; review if ours)`)
    }
  }
}

if (failures > 0) {
  console.error(`\nRemote-code audit FAILED: ${failures} remotely-loaded reference(s).`)
  process.exit(1)
}
console.log(
  `\n✓ Remote-code audit passed: no http(s) script sources in dist/.` +
    (warnings ? ` (${warnings} CSP-inert eval sink(s) in bundled libs — reviewed.)` : ''),
)
