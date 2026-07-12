import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Nav, Footer } from '@/components/SiteChrome'
import { SuccessClient } from '@/components/SuccessClient'

export const metadata: Metadata = {
  title: 'Purchase complete — Sign & Fill PDF',
  robots: { index: false, follow: false },
}

export default function Success() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <SuccessClient />
      </Suspense>
      <Footer />
    </>
  )
}
