// Generate a small 2-page sample PDF fixture for the E2E test.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = resolve(fileURLToPath(new URL('.', import.meta.url)), 'fixtures')
await mkdir(dir, { recursive: true })

const doc = await PDFDocument.create()
const font = await doc.embedFont(StandardFonts.Helvetica)
for (let i = 1; i <= 2; i++) {
  const page = doc.addPage([595, 842]) // A4 points
  page.drawText(`Sample Agreement — page ${i}`, { x: 60, y: 780, size: 20, font, color: rgb(0.15, 0.15, 0.2) })
  page.drawText('Full name: ____________________', { x: 60, y: 700, size: 13, font })
  page.drawText('Signature: ____________________', { x: 60, y: 120, size: 13, font })
}
const bytes = await doc.save()
await writeFile(resolve(dir, 'sample.pdf'), bytes)
console.log(`sample.pdf written (${bytes.length} bytes, 2 pages)`)
