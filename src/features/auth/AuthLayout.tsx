import type { ReactNode } from 'react'
import { Card } from '../../components/Card'
import styles from './Auth.module.css'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className={styles.screen}>
      <div className={styles.backdrop} aria-hidden="true" />
      <Card glass className={styles.panel}>
        <div className={styles.logoMark} aria-hidden="true">
          N
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {children}
      </Card>
    </div>
  )
}
