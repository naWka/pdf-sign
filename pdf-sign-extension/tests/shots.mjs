// Screenshot the running companion site (http://localhost:4321) across pages,
// themes, and viewports for visual review. Uses the playwright installed here.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.env.SITE || 'http://localhost:4321'
const out = new URL('../shots/', import.meta.url).pathname
await mkdir(out, { recursive: true })

const pages = [
  ['home', '/'],
  ['pricing', '/pricing'],
  ['privacy', '/privacy'],
  ['success', '/success?txn=demo'],
]

const browser = await chromium.launch()

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: 'load' })
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}${name}-${scheme}.png`, fullPage: true })
    console.log(`  ${name}-${scheme}.png`)
  }
  await ctx.close()
}

// Mobile home
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const mp = await m.newPage()
await mp.goto(base + '/', { waitUntil: 'load' })
await mp.waitForTimeout(500)
await mp.screenshot({ path: `${out}home-mobile.png`, fullPage: true })
console.log('  home-mobile.png')
await m.close()

await browser.close()
console.log('done ->', out)
