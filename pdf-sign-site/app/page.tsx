import Link from 'next/link'
import s from './page.module.css'
import { Nav, Footer } from '@/components/SiteChrome'
import { DocumentMock } from '@/components/DocumentMock'
import { BuyButton } from '@/components/BuyButton'
import { config } from '@/lib/config'
import {
  IShield,
  ILock,
  IWifiOff,
  ICheck,
  IChrome,
  IPen,
  IBolt,
  IInfinity,
} from '@/components/icons'

export default function Home() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <header className={s.hero}>
        <div className={`wrap ${s.heroGrid}`}>
          <div>
            <span className={`${s.heroEyebrow} ${s.reveal} ${s.d1}`}>
              <IShield /> Your files never leave your computer
            </span>
            <h1 className={`${s.heroTitle} ${s.reveal} ${s.d2}`}>
              Sign and fill any PDF, <span className={s.ink}>right in your browser.</span>
            </h1>
            <p className={`${s.heroLead} ${s.reveal} ${s.d3}`}>
              No upload. No account. Open a PDF, sign it, download it, in about ten
              seconds, with nothing sent to a server.
            </p>
            <div className={`${s.heroCtas} ${s.reveal} ${s.d4}`}>
              <a className="btn btn--ink btn--lg" href={config.storeUrl} target="_blank" rel="noopener">
                <IChrome /> Add to Chrome, free
              </a>
              <Link className="btn btn--ghost btn--lg" href="#how">
                See how it works
              </Link>
            </div>
            <p className={`${s.heroMeta} ${s.reveal} ${s.d4}`}>
              Free to start. One-time lifetime unlock, no subscription.
            </p>
          </div>
          <div className={`${s.heroArt} ${s.reveal} ${s.d3}`}>
            <DocumentMock />
          </div>
        </div>
      </header>

      {/* Trust strip */}
      <div className={s.trust}>
        <div className={`wrap ${s.trustInner}`}>
          <span className={s.trustItem}><ILock /> No upload</span>
          <span className={s.trustItem}><IPen /> No account</span>
          <span className={s.trustItem}><IWifiOff /> Works offline</span>
          <span className={s.trustItem}><IInfinity /> Pay once, yours forever</span>
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="section-pad">
        <div className="wrap">
          <div className={s.head}>
            <p className="eyebrow">Three steps, one minute</p>
            <h2>How it works</h2>
          </div>
          <div className={s.steps}>
            <div className={s.step}>
              <div className={s.stepNum}>1</div>
              <h3>Open your PDF</h3>
              <p>Drag it in or pick a file. It opens locally in the editor. Nothing is uploaded.</p>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>2</div>
              <h3>Sign and fill</h3>
              <p>Draw, type, or upload a signature. Add text, dates, and checkboxes anywhere.</p>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>3</div>
              <h3>Download</h3>
              <p>Export a flattened PDF straight to your device. Done, no round trip to a server.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-pad" style={{ background: 'var(--workspace)' }}>
        <div className="wrap">
          <div className={s.head}>
            <p className="eyebrow">Everything you need, nothing you don&apos;t</p>
            <h2>Built for one job, done well</h2>
          </div>
          <div className={s.features}>
            <div className={`${s.feature} ${s.wide}`}>
              <div className={s.featIcon}><IPen /></div>
              <h3>Sign three ways</h3>
              <p>
                Draw your signature with a mouse or trackpad, type it in a handwriting
                font, or upload an image. Save two to three signatures for instant reuse.
              </p>
              <ul className={s.featList}>
                <li>Draw</li>
                <li>Type</li>
                <li>Upload</li>
                <li>Saved signatures</li>
              </ul>
            </div>
            <div className={s.feature}>
              <div className={s.featIcon}><ICheck /></div>
              <h3>Fill out forms</h3>
              <p>Add text anywhere, tick checkboxes, insert dates and initials on any form.</p>
            </div>
            <div className={s.feature}>
              <div className={s.featIcon}><IBolt /></div>
              <h3>Tidy the pages</h3>
              <p>Rotate, reorder, or delete pages before you export. Quick fixes, no extra tool.</p>
            </div>
            <div className={s.feature}>
              <div className={s.featIcon}><IWifiOff /></div>
              <h3>Works offline</h3>
              <p>The whole editor runs on your device. On a plane or off the grid, it still signs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy band */}
      <section id="privacy" className="section-pad">
        <div className="wrap">
          <div className={s.privacy}>
            <div className={s.privacyGrid}>
              <div>
                <p className="eyebrow" style={{ color: 'var(--gold)' }}>
                  Privacy is the product
                </p>
                <h2>Your document stays on your machine.</h2>
                <p className={s.lead}>
                  Most tools make you create an account and upload your document to their
                  cloud just to add a signature. This one never does. Open the Network tab
                  and watch: your file is not going anywhere.
                </p>
              </div>
              <ul className={s.assureList}>
                <li>
                  <span className={s.assureIcon}><ILock /></span>
                  <div>
                    <h4>Nothing is uploaded</h4>
                    <p>PDFs are read and written in your browser. No server ever sees them.</p>
                  </div>
                </li>
                <li>
                  <span className={s.assureIcon}><IPen /></span>
                  <div>
                    <h4>No account, no sign-up</h4>
                    <p>No email, no login. Install and start signing immediately.</p>
                  </div>
                </li>
                <li>
                  <span className={s.assureIcon}><IShield /></span>
                  <div>
                    <h4>Minimal permissions</h4>
                    <p>Only what it needs to run. No broad access to your browsing.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-pad" style={{ background: 'var(--workspace)' }}>
        <div className="wrap">
          <div className={s.priceCard}>
            <span className={s.priceBadge}>Lifetime, not a subscription</span>
            <div className={s.priceValue}>{config.priceDisplay}</div>
            <p className={s.priceSub}>
              Start free with a handful of exports. When you are ready, unlock unlimited
              signing with a single payment, forever, on this device.
            </p>
            <ul className={s.priceList}>
              <li><ICheck /> Unlimited exports, forever</li>
              <li><ICheck /> One payment, no subscription</li>
              <li><ICheck /> Still 100% local, nothing uploaded</li>
              <li><ICheck /> Works offline after unlocking</li>
            </ul>
            <BuyButton />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad">
        <div className="wrap">
          <div className={`${s.head} ${s.center}`}>
            <h2>Questions</h2>
          </div>
          <div className={s.faq}>
            <div className={s.faqItem}>
              <h3>Is my PDF really not uploaded?</h3>
              <p>
                Correct. All parsing, editing, and export happen in your browser with
                bundled libraries. You can verify it in your browser&apos;s Network tab.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3>Do I need an account?</h3>
              <p>No. There is no sign-up and no login. The lifetime unlock is a license key you paste in, not an account.</p>
            </div>
            <div className={s.faqItem}>
              <h3>Is this a subscription?</h3>
              <p>No. It is a one-time payment for lifetime access on your device. Signing a PDF is a one-off task, so the price should be too.</p>
            </div>
            <div className={s.faqItem}>
              <h3>Can I sign a PDF without Adobe?</h3>
              <p>Yes, that is the whole idea. No Adobe, no Acrobat, no cloud service. Just your browser.</p>
            </div>
            <div className={s.faqItem}>
              <h3>Does the unlock work offline?</h3>
              <p>Yes. The license is verified on your device, so once unlocked it keeps working with no connection.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
