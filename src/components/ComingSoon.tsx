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
          soon
        </p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  )
}
