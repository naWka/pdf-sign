// Rasterize src/assets/icon.svg into the PNG sizes Chrome requires.
// Run once (npm run gen:icons); the PNGs are committed so the build never
// depends on sharp. Re-run only when the SVG changes.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'src/assets/icon.svg')
const outDir = resolve(root, 'src/assets/icons')

const sizes = [16, 32, 48, 128]

const svg = await readFile(svgPath)
await mkdir(outDir, { recursive: true })

for (const size of sizes) {
  const out = resolve(outDir, `icon-${size}.png`)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out)
  console.log(`  ✓ icon-${size}.png`)
}
console.log('Icons generated in src/assets/icons/')
