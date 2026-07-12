/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The site is static-friendly; no PDF or user files are ever processed here.
  poweredByHeader: false,
}

export default nextConfig
