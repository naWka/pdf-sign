// Render the Chrome Web Store image assets from the HTML frames in
// ../../store-assets: the 5 screenshots (1280×800) and the 2 promo tiles
// (440×280 small, 1400×560 marquee).
//
// Each page holds a single element sized exactly to the target canvas, so we
// clip to it and get pixel-exact output with no page padding around it.
//
// The store rejects PNGs with an alpha channel ("JPEG or 24-bit PNG, no alpha"),
// and Playwright always writes RGBA — so every capture is flattened onto white
// with sharp before it is saved.
//
// Usage: npm run gen:screenshots
//   → store-assets/screenshots/out/*.png
//   → store-assets/promo/out/*.png
import { readdir, mkdir, unlink } from 'node:fs/promises'
import { dirname, resolve, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assets = resolve(__dirname, '../../store-assets')

// [source dir, CSS selector of the exact-size canvas element]
const GROUPS = [
  { dir: resolve(assets, 'screenshots'), selector: '.frame' },
  { dir: resolve(assets, 'promo'), selector: '.tile' },
]

const browser = await chromium.launch()
// deviceScaleFactor 1: the store wants the literal pixel sizes, not a 2x image.
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 })

for (const { dir, selector } of GROUPS) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.html')).sort()
  if (files.length === 0) {
    console.error(`✗ no .html frames in ${dir}`)
    process.exit(1)
  }
  const outDir = resolve(dir, 'out')
  await mkdir(outDir, { recursive: true })
  console.log(`${basename(dir)}/`)

  for (const file of files) {
    await page.goto(pathToFileURL(resolve(dir, file)).href, { waitUntil: 'networkidle' })
    const el = page.locator(selector).first()
    await el.waitFor({ state: 'visible' })

    const out = resolve(outDir, `${basename(file, '.html')}.png`)
    const tmp = `${out}.rgba.png`
    await el.screenshot({ path: tmp })

    // Flatten: drop alpha so the result is a plain 24-bit RGB PNG.
    await sharp(tmp).flatten({ background: '#ffffff' }).png({ compressionLevel: 9 }).toFile(out)
    await unlink(tmp)

    const { width, height, channels } = await sharp(out).metadata()
    console.log(`  ✓ ${basename(out)} — ${width}×${height}, ${channels * 8}-bit`)
  }
}

await browser.close()
