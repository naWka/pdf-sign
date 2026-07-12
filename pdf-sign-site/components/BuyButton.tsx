'use client'

import { useEffect, useState, useCallback } from 'react'
import { config, paddleConfigured } from '@/lib/config'

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void }
      Initialize: (opts: { token: string }) => void
      Checkout: { open: (opts: unknown) => void }
    }
  }
}

const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js'

export function BuyButton({
  className = 'btn btn--gold btn--lg',
  label = 'Unlock lifetime',
}: {
  className?: string
  label?: string
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!paddleConfigured) return
    if (window.Paddle) {
      setReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = PADDLE_JS
    script.async = true
    script.onload = () => {
      if (!window.Paddle) return
      window.Paddle.Environment.set(config.paddleEnv)
      window.Paddle.Initialize({ token: config.paddleToken })
      setReady(true)
    }
    document.body.appendChild(script)
  }, [])

  const onClick = useCallback(() => {
    if (!paddleConfigured || !window.Paddle) {
      // Not configured yet: send them to the store so the CTA still works.
      window.open(config.storeUrl, '_blank', 'noopener')
      return
    }
    window.Paddle.Checkout.open({
      items: [{ priceId: config.paddlePriceId, quantity: 1 }],
      settings: {
        displayMode: 'overlay',
        successUrl: `${window.location.origin}/success`,
      },
    })
  }, [])

  return (
    <button className={className} onClick={onClick} disabled={paddleConfigured && !ready}>
      {label}
    </button>
  )
}
