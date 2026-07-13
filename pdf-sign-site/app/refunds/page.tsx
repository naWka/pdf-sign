import type { Metadata } from 'next'
import d from '../privacy/privacy.module.css'
import { Nav, Footer } from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'Refund Policy — Sign & Fill PDF',
  description: 'Our refund policy for the Sign & Fill PDF lifetime purchase.',
}

export default function Refunds() {
  return (
    <>
      <Nav />
      <article className={d.doc}>
        <h1>Refund Policy</h1>
        <p className={d.updated}>Last updated: July 13, 2026</p>

        <p className={d.lead}>
          We want you to be happy with the purchase. If the lifetime unlock isn&apos;t working for you,
          we offer a straightforward refund.
        </p>

        <div className={d.callout}>
          Request a refund within 14 days of purchase for a full refund, no questions asked.
        </div>

        <h2>How to request a refund</h2>
        <p>
          Email support@signfillpdf.com from the address you used at checkout, within 14 days of your
          purchase. Include your order or receipt number (from your Paddle receipt email). We will
          process the refund promptly.
        </p>

        <h2>How refunds are processed</h2>
        <p>
          Purchases are handled by our reseller, Paddle, as merchant of record. Approved refunds are
          issued by Paddle to your original payment method. The time for the funds to appear depends
          on your bank or card provider.
        </p>

        <h2>After a refund</h2>
        <p>
          When a purchase is refunded, the associated lifetime license is deactivated. The extension
          returns to the free tier; your existing documents and saved signatures on your device are
          unaffected.
        </p>

        <h2>Contact</h2>
        <p>Any questions about refunds? Email support@signfillpdf.com and we&apos;ll help.</p>
      </article>
      <Footer />
    </>
  )
}
