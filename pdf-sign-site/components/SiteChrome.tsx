import Link from 'next/link'
import styles from './SiteChrome.module.css'
import { config } from '@/lib/config'
import { IPen, IChrome } from './icons'

export function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={`wrap ${styles.navInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <IPen />
          </span>
          Sign &amp; Fill PDF
        </Link>
        <div className={styles.links}>
          <Link href="/#how">How it works</Link>
          <Link href="/#privacy">Privacy</Link>
          <Link href="/pricing">Pricing</Link>
          <a className={styles.navCta} href={config.storeUrl} target="_blank" rel="noopener">
            <IChrome /> Add to Chrome
          </a>
        </div>
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.footInner}`}>
        <p className={styles.footNote}>
          Sign &amp; Fill PDF processes every file locally in your browser. Nothing is
          uploaded, ever.
        </p>
        <div className={styles.footLinks}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <a href={config.storeUrl} target="_blank" rel="noopener">
            Add to Chrome
          </a>
        </div>
      </div>
    </footer>
  )
}
