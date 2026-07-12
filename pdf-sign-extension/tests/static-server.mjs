// Minimal static file server for the built extension (dist/). Serves the editor
// as a plain web page so Playwright can drive it with a chrome.* shim, no browser
// extension loading or display required. Not part of the shipped product.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 5178)

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || '/').split('?')[0])
    if (path === '/') path = '/src/editor/editor.html'
    // Prevent path traversal outside dist/.
    const filePath = normalize(join(root, path))
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden')
      return
    }
    const s = await stat(filePath)
    if (!s.isFile()) throw new Error('not a file')
    const body = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream',
      // Workers require same-origin; keep it simple and permissive for the test.
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(port, () => console.log(`static server on http://localhost:${port}`))
