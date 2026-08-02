import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  interactive?: boolean
  children: ReactNode
}

export function Card({ glass = false, interactive = false, className, children, ...rest }: CardProps) {
  const classes = [styles.card, glass ? styles.glass : '', interactive ? styles.interactive : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
