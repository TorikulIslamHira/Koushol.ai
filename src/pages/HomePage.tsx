import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

/** Landing page ("/") — brief pitch + CTA into the course catalog. */
export function HomePage() {
  return (
    <div className="flex flex-col items-start gap-6 py-12">
      <h1 className="font-display text-4xl font-bold text-brand-ink">
        Learn by doing, <span className="text-brand-green">not just reading.</span>
      </h1>
      <p className="max-w-xl text-lg text-black/60">
        Koushol turns courses into interactive chapters and quizzes — read, get tested, unlock
        the next step, and earn a certificate when you finish.
      </p>
      <Link to="/courses">
        <Button>Browse courses</Button>
      </Link>
    </div>
  )
}
