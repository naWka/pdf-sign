import type { Metadata } from 'next'
import s from '../page.module.css'
import { Nav, Footer } from '@/components/SiteChrome'
import { BuyButton } from '@/components/BuyButton'
import { config } from '@/lib/config'
import { ICheck } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Pricing — Sign & Fill PDF (one-time lifetime, no subscription)',
  description:
    'One payment, lifetime access. Sign and fill unlimited PDFs locally in your browser. No subscription, no account.',
}

export default function Pricing() {
  return (
    <>
      <Nav />
      <section className="section-pad">
        <div className="wrap">
          <div className={`${s.head} ${s.center}`}>
            <p className="eyebrow">Simple, honest pricing</p>
            <h2>Pay once. Yours forever.</h2>
            <p>
              A signed PDF is a one-off task, so this is a one-off price, not a monthly
              bill you forget to cancel.
            </p>
          </div>

          <div className={s.priceCard}>
            <span className={s.priceBadge}>Lifetime license</span>
            <div className={s.priceValue}>{config.priceDisplay}</div>
            <p className={s.priceSub}>
              Try it free first. When the free exports run out, unlock unlimited signing
              with a single payment on this device.
            </p>
            <ul className={s.priceList}>
              <li><ICheck /> Unlimited exports, forever</li>
              <li><ICheck /> One payment, no subscription</li>
              <li><ICheck /> Every file stays 100% local</li>
              <li><ICheck /> Verified on-device, works offline</li>
              <li><ICheck /> Draw, type, or upload signatures</li>
            </ul>
            <BuyButton label={`Unlock lifetime for ${config.priceDisplay}`} />
            <p className={s.priceSub} style={{ marginTop: 20, fontSize: '0.85rem' }}>
              Secure checkout by Paddle, our authorized reseller, which handles payment and
              any applicable tax. After paying, you get a license key to paste into the
              extension&apos;s settings.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
