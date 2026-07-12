import type { Metadata } from 'next'
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

// Display: a characterful grotesque (precise, a little mechanical) for headlines.
// Body: a clean humanist grotesque for calm, readable prose. Neither is a
// training-reflex default, and both self-host at build (no runtime font fetch).
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const SITE = 'https://signfillpdf.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Sign & Fill PDF — sign any PDF in your browser, no upload, no account',
  description:
    'Sign and fill any PDF right in your browser. No upload, no account — your files never leave your computer. Free to start, one-time lifetime unlock.',
  keywords: [
    'sign pdf',
    'sign pdf free',
    'fill and sign pdf',
    'sign pdf without adobe',
    'add signature to pdf',
    'pdf form filler',
  ],
  openGraph: {
    title: 'Sign & Fill PDF — private, local, no upload',
    description:
      'Sign and fill any PDF in your browser. Nothing is uploaded. Free to start; one-time lifetime unlock.',
    url: SITE,
    siteName: 'Sign & Fill PDF',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
