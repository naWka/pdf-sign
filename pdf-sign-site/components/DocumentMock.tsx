// The hero's product imagery: a paper contract being signed with ink, filled
// fields, a ticked box, and floating "local / offline" chips. Built as a
// self-contained SVG/HTML scene (no stock photo — this is a software tool, and a
// crafted mock reads truer than a generic desk photo).

import styles from './DocumentMock.module.css'

export function DocumentMock() {
  return (
    <div className={styles.stage}>
      <div className={styles.sheet}>
        <div className={styles.docTitle}>Freelance Services Agreement</div>
        <div className={styles.docSub}>This agreement is made between the parties below.</div>

        <div className={styles.line} />
        <div className={`${styles.line} ${styles.mid}`} />
        <div className={`${styles.line} ${styles.short}`} />

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Full name</div>
            <div className={styles.fieldRule}>
              <span className={styles.filled}>Alex Morgan</span>
            </div>
          </div>
          <div className={styles.field} style={{ maxWidth: 130 }}>
            <div className={styles.fieldLabel}>Date</div>
            <div className={styles.fieldRule}>
              <span className={`${styles.filled} ${styles.dateVal}`}>07 / 12 / 2026</span>
            </div>
          </div>
        </div>

        <div className={styles.check}>
          <span className={styles.checkbox}>
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          I agree to the terms above.
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Signature</div>
            <div className={styles.fieldRule}>
              <svg className={styles.sig} viewBox="0 0 320 58" aria-label="Handwritten ink signature">
                <path d="M8 44c14-2 20-34 26-34s2 40 10 40 12-42 20-42 4 34 12 34 14-26 22-26 6 20 12 20 10-8 16-14c6-6 14-10 24-10 8 0 30 2 44-2" />
              </svg>
            </div>
          </div>
        </div>

        <span className={`${styles.chip} ${styles.chipLocal}`}>
          <svg viewBox="0 0 24 24">
            <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Never uploaded
        </span>
        <span className={`${styles.chip} ${styles.chipOffline}`}>
          <svg viewBox="0 0 24 24">
            <path d="M3 4l18 18M8.5 12.5a5 5 0 0 1 6 0M5 9.5a9 9 0 0 1 4-2.2M19 9.5a9 9 0 0 0-3-2M12 18h.01" />
          </svg>
          Works offline
        </span>
      </div>
    </div>
  )
}
