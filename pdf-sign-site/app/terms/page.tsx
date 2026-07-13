import type { Metadata } from 'next'
import d from '../privacy/privacy.module.css'
import { Nav, Footer } from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'Terms of Service — Sign & Fill PDF',
  description: 'The terms for using Sign & Fill PDF, a local, in-browser PDF signing extension.',
}

export default function Terms() {
  return (
    <>
      <Nav />
      <article className={d.doc}>
        <h1>Terms of Service</h1>
        <p className={d.updated}>Last updated: July 13, 2026</p>

        <p className={d.lead}>
          These terms govern your use of Sign &amp; Fill PDF (the &ldquo;extension&rdquo;) and this
          website. By installing or using the extension, you agree to them.
        </p>

        <h2>What the product does</h2>
        <p>
          Sign &amp; Fill PDF is a browser extension that lets you sign and fill PDF files entirely on
          your own device. Your files are processed locally and are never uploaded to us or any third
          party. See our <a href="/privacy">Privacy Policy</a> for details.
        </p>

        <h2>Free use and lifetime unlock</h2>
        <p>
          The extension is free to use for a limited number of exports. After that, continued
          unlimited exporting requires a one-time &ldquo;lifetime&rdquo; purchase. This is a single
          payment, not a subscription. The unlock is delivered as a license key that you activate on
          your device.
        </p>

        <h2>Payments</h2>
        <p>
          Purchases are processed by our authorized reseller, Paddle, acting as the merchant of
          record. Paddle handles payment, billing, and any applicable taxes. Your payment details are
          provided to and handled by Paddle, not by us.
        </p>

        <h2>License</h2>
        <p>
          On purchase you receive a personal license to use the extension&apos;s paid features. You may
          not resell, redistribute, or sublicense your license key. We may revoke a license that was
          obtained fraudulently or charged back.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use the extension only for lawful purposes and only on documents you have the right to edit.
          You are responsible for the content of the documents you sign and fill.
        </p>

        <h2>No warranty</h2>
        <p>
          The extension is provided &ldquo;as is&rdquo; without warranties of any kind. It is a
          convenience tool for filling and signing PDFs; it does not provide legally certified
          electronic signatures, notarization, or compliance guarantees (for example eIDAS or ESIGN).
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect or consequential
          damages arising from use of the extension. Because your files never leave your device, you
          are solely responsible for keeping copies of your documents.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. Material changes will be reflected by the &ldquo;Last
          updated&rdquo; date above. Continued use after a change means you accept the updated terms.
        </p>

        <h2>Contact</h2>
        <p>Questions about these terms? Email support@signfillpdf.com.</p>
      </article>
      <Footer />
    </>
  )
}
