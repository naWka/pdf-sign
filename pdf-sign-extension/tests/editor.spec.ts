import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument } from 'pdf-lib'

const dir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const shim = readFileSync(resolve(dir, 'chrome-shim.js'), 'utf8')
const samplePdf = resolve(dir, 'fixtures/sample.pdf')

/* eslint-disable @typescript-eslint/no-explicit-any */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(shim)
})

test('open a PDF, fill text, sign, export, with nothing uploaded', async ({ page, baseURL }) => {
  // Record any request that leaves this origin. The product promise is that a
  // user's file never does; there should be none.
  const external: string[] = []
  page.on('request', (req) => {
    const u = req.url()
    if (!u.startsWith(baseURL!) && !u.startsWith('blob:') && !u.startsWith('data:')) {
      external.push(`${req.method()} ${u}`)
    }
  })

  await page.goto('/src/editor/editor.html')

  // Intake -> load the PDF via the hidden file input.
  await page.setInputFiles('#file-input', samplePdf)

  // Editor opens and both pages render to real canvases.
  await expect(page.locator('#editor')).toBeVisible()
  await expect(page.locator('.page')).toHaveCount(2)
  await expect(page.locator('.page__canvas').first()).toBeVisible()
  const canvasW = await page
    .locator('.page__canvas')
    .first()
    .evaluate((c) => (c as HTMLCanvasElement).width)
  expect(canvasW).toBeGreaterThan(0)

  // --- Place and type a text field on page 1 ---
  await page.click('[data-tool="text"]')
  const overlay0 = page.locator('.overlay').first()
  await overlay0.click({ position: { x: 130, y: 150 } })
  await expect(page.locator('.ov--text.is-editing')).toBeVisible()
  await page.keyboard.type('Alex Morgan')
  await page.locator('.ov--text .ov__text').blur() // commit the edit
  await expect(page.locator('.ov--text')).toHaveCount(1)

  // --- Add a typed signature through the capture modal ---
  await page.click('[data-tool="signature"]')
  await overlay0.click({ position: { x: 170, y: 360 } })
  await expect(page.locator('.modal.sig')).toBeVisible()
  await page.click('.sig__tab[data-mode="type"]')
  await page.fill('.sig-type__input', 'Alex Morgan')
  await page.click('.sig__confirm')
  await expect(page.locator('.modal.sig')).toHaveCount(0)
  await expect(page.locator('.ov--signature')).toHaveCount(1)

  // The signature was saved locally for reuse.
  const saved = await page.evaluate(() => (window as any).__storage['ssp.savedSignatures.v1'])
  expect(Array.isArray(saved) && saved.length).toBeTruthy()

  // --- Export ---
  await page.click('#download-btn')
  await page.waitForFunction(() => (window as any).__downloads.length > 0, null, { timeout: 25_000 })
  const dl = await page.evaluate(() => (window as any).__downloads[0])
  expect(dl.head).toBe('%PDF-')
  expect(dl.filename).toMatch(/-signed\.pdf$/)
  expect(dl.size).toBeGreaterThan(1000)

  // Exported PDF is valid and preserves both pages.
  const out = await PDFDocument.load(Buffer.from(dl.base64, 'base64'))
  expect(out.getPageCount()).toBe(2)

  // The free-export counter advanced by exactly one.
  const usage = await page.evaluate(() => (window as any).__storage['ssp.usage.v1'])
  expect(usage?.exportsUsed).toBe(1)

  // The wedge: no request ever left the origin with (or without) the file.
  expect(external, `unexpected external requests:\n${external.join('\n')}`).toEqual([])
})

test('page delete updates the count and export reflects it', async ({ page }) => {
  await page.goto('/src/editor/editor.html')
  await page.setInputFiles('#file-input', samplePdf)
  await expect(page.locator('.page')).toHaveCount(2)

  // Delete page 2 via its controls.
  await page.locator('.page').nth(1).locator('[data-act="del"]').click()
  await expect(page.locator('.page')).toHaveCount(1)

  await page.click('#download-btn')
  await page.waitForFunction(() => (window as any).__downloads.length > 0, null, { timeout: 25_000 })
  const dl = await page.evaluate(() => (window as any).__downloads[0])
  const out = await PDFDocument.load(Buffer.from(dl.base64, 'base64'))
  expect(out.getPageCount()).toBe(1)
})

test('paywall gates export after the free limit', async ({ page }) => {
  // Pre-seed usage at the limit so the very next export is gated.
  await page.addInitScript(() => {
    ;(window as any).__seedUsage = true
  })
  await page.goto('/src/editor/editor.html')
  await page.evaluate(() =>
    (window as any).chrome.storage.local.set({ 'ssp.usage.v1': { exportsUsed: 5 } }),
  )
  await page.setInputFiles('#file-input', samplePdf)
  await expect(page.locator('.page')).toHaveCount(2)

  await page.click('#download-btn')
  // Paywall appears; no download happens.
  await expect(page.locator('.modal.paywall')).toBeVisible()
  const count = await page.evaluate(() => (window as any).__downloads.length)
  expect(count).toBe(0)
})
