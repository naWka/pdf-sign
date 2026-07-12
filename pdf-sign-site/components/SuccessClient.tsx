'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import s from './SuccessClient.module.css'
import { config } from '@/lib/config'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; token: string }
  | { kind: 'pending' }
  | { kind: 'error' }

export function SuccessClient() {
  const params = useSearchParams()
  const txn = params.get('_ptxn') || params.get('txn') || ''
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!txn || !config.functionsUrl) {
      setState({ kind: 'error' })
      return
    }
    let cancelled = false
    let tries = 0

    const poll = async () => {
      tries++
      try {
        const res = await fetch(`${config.functionsUrl}/get-license?txn=${encodeURIComponent(txn)}`)
        if (res.ok) {
          const data = (await res.json()) as { token?: string }
          if (data.token && !cancelled) {
            setState({ kind: 'ready', token: data.token })
            return
          }
        }
      } catch {
        /* fall through to retry */
      }
      // The webhook can lag a few seconds behind the redirect; retry briefly.
      if (tries < 8 && !cancelled) {
        setTimeout(poll, 2000)
      } else if (!cancelled) {
        setState({ kind: 'pending' })
      }
    }
    void poll()
    return () => {
      cancelled = true
    }
  }, [txn])

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={s.wrap}>
      <div className={s.badge}>
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </div>
      <h1 className={s.title}>Thank you. You&apos;re unlocked.</h1>
      <p className={s.sub}>Here is your lifetime license key. Paste it into the extension to remove the export limit.</p>

      {state.kind === 'loading' && <p className={s.state}>Preparing your license key…</p>}

      {state.kind === 'ready' && (
        <>
          <div className={s.keyBox}>
            <div className={s.keyLabel}>Your license key</div>
            <div className={s.keyRow}>
              <div className={s.key}>{state.token}</div>
              <button className={s.copy} onClick={() => copy(state.token)}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <ol className={s.steps}>
            <li>Open the Sign &amp; Fill PDF extension, then its Settings (or right-click the icon, Options).</li>
            <li>Paste the key into the License field and click Unlock.</li>
            <li>That&apos;s it, unlimited exports, forever, and it works offline.</li>
          </ol>
        </>
      )}

      {state.kind === 'pending' && (
        <div className={s.err}>
          Your payment went through. Your key is still being generated, this can take a
          moment. We&apos;ve also emailed it to you; refresh this page in a minute if it
          hasn&apos;t appeared.
        </div>
      )}

      {state.kind === 'error' && (
        <div className={s.err}>
          We couldn&apos;t find a purchase for this link. If you just paid, check the email
          receipt for your license key, or contact support@signfillpdf.com.
        </div>
      )}
    </div>
  )
}
