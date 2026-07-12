import type { Metadata } from 'next'
import d from './privacy.module.css'
import { Nav, Footer } from '@/components/SiteChrome'

export const metadata: Metadata = {
  title: 'Privacy Policy — Sign & Fill PDF',
  description:
    'How Sign & Fill PDF handles your data: your PDFs are processed locally in your browser and are never uploaded.',
}

export default function Privacy() {
  return (
    <>
      <Nav />
      <article className={d.doc}>
        <h1>Privacy Policy</h1>
        <p className={d.updated}>Last updated: July 12, 2026</p>

        <p className={d.lead}>
          Sign &amp; Fill PDF is built around a single promise: your files stay on your
          device. This policy explains, plainly, what that means and the little data the
          product does touch.
        </p>

        <div className={d.callout}>
          Your PDFs are opened, edited, and exported entirely inside your browser. They are
          never uploaded to us or to any third party. We cannot see them, store them, or
          recover them.
        </div>

        <h2>The files you sign</h2>
        <p>
          When you open a PDF in the editor, it is read into your browser&apos;s memory and
          all work, rendering, adding signatures and fields, and exporting, happens locally
          using code bundled inside the extension. No part of your document is transmitted
          over the network. Closing the tab discards it.
        </p>

        <h2>What is stored on your device</h2>
        <p>The extension keeps a small amount of data in your browser&apos;s local storage:</p>
        <ul>
          <li>Signatures you choose to save, so you can reuse them (stored as images, on your device only).</li>
          <li>A counter of how many free exports you have used.</li>
          <li>Your license key and its cached validity, if you purchase the lifetime unlock.</li>
        </ul>
        <p>This data never leaves your device and can be cleared at any time by removing the extension or clearing its storage.</p>

        <h2>Purchases and licensing</h2>
        <p>
          If you buy the lifetime unlock, payment is handled by our authorized reseller,
          Paddle, acting as merchant of record. Paddle processes your payment and collects
          the billing details you provide to them; we never see your card information. We
          store only what is needed to issue and validate your license, a transaction
          identifier, your email, and license status, on our licensing backend. We use this
          solely to deliver your license and honor refunds.
        </p>
        <p>
          When your extension occasionally re-checks that a license is still valid, it sends
          only the license identifier, never any file or personal document content.
        </p>

        <h2>Analytics and tracking</h2>
        <p>
          The product contains no third-party ad trackers and does not profile you. Any
          website analytics we use are privacy-respecting and aggregate only; they never
          receive your documents.
        </p>

        <h2>Permissions</h2>
        <p>
          The extension requests the minimum permissions it needs: local storage for the
          items above, the ability to save a finished file to your computer, and an optional
          right-click entry to open a linked PDF. It does not request broad access to your
          browsing.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email us at privacy@signfillpdf.com and we will get
          back to you.
        </p>
      </article>
      <Footer />
    </>
  )
}
