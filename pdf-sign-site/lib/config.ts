// Public site config, read from NEXT_PUBLIC_* env with safe fallbacks so the site
// builds and renders before the real accounts exist.

export const config = {
  storeUrl:
    process.env.NEXT_PUBLIC_STORE_URL ||
    'https://chromewebstore.google.com/category/extensions',
  paddleToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || '',
  paddleEnv: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
  functionsUrl: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '',
  priceDisplay: process.env.NEXT_PUBLIC_PRICE_DISPLAY || 'one-time',
}

export const paddleConfigured = Boolean(config.paddleToken && config.paddlePriceId)
