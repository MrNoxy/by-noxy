import { useNavigate } from 'react-router-dom'
import { Card } from './Card'
import { Button } from './Button'
import styles from './ComingSoon.module.css'

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  const navigate = useNavigate()
  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <h2>{title}</h2>
        <p>
          This isn&rsquo;t built yet &mdash; it&rsquo;s scheduled for <strong>{phase}</strong> of the Notey build
          plan. Nothing here is faked; the screen simply doesn&rsquo;t exist until that phase ships.
        </p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  )
}
