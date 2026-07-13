// Static export is enabled only when STATIC_EXPORT=1 (GitHub Pages / any static
// host). PAGES_BASE_PATH sets the sub-path when served from a project Pages URL
// like https://user.github.io/<repo>. Left unset, the site builds normally
// (e.g. for Vercel at a domain root).
const isExport = process.env.STATIC_EXPORT === '1'
const basePath = process.env.PAGES_BASE_PATH || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: basePath || undefined,
        // Expose the base path to the client so links/fetches can prefix it.
        env: { NEXT_PUBLIC_BASE_PATH: basePath },
      }
    : {}),
}

export default nextConfig
