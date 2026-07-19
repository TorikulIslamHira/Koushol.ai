import { Link } from 'react-router-dom'
import { BookOpenCheck, Sparkles, Volume2, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const STEPS = [
  {
    number: '1',
    title: 'Read a chapter',
    description: 'Bite-sized lessons, one topic at a time — no wall of text to get through.',
  },
  {
    number: '2',
    title: 'Take the quiz',
    description: "Prove you understood it before moving on — 70% to pass, retake anytime.",
  },
  {
    number: '3',
    title: 'Unlock the next step',
    description: 'Progress locks sequentially, so you can\'t skip ahead of what you know.',
  },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-assisted course creation',
    description: 'Teachers turn raw notes into structured chapters and quizzes automatically.',
  },
  {
    icon: Volume2,
    title: 'Listen to any chapter',
    description: 'Bengali and multi-language narration, generated per chapter.',
  },
  {
    icon: BookOpenCheck,
    title: 'Sequential unlocking',
    description: 'Chapters and quizzes gate progress, so learning actually builds up.',
  },
  {
    icon: GraduationCap,
    title: 'Built for teachers too',
    description: 'Publish courses, track student progress, and see quiz performance per chapter.',
  },
]

/** Landing page ("/") — hero, how-it-works, feature highlights, closing CTA. */
export function HomePage() {
  return (
    <div className="flex flex-col gap-20 py-12">
      <section className="flex flex-col items-start gap-6">
        <h1 className="font-display text-4xl font-bold text-brand-ink sm:text-5xl">
          Learn by doing, <span className="text-brand-green">not just reading.</span>
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Koushol turns courses into interactive chapters and quizzes — read, get tested, unlock
          the next step, and earn a certificate when you finish.
        </p>
        <Link to="/courses">
          <Button className="gap-2">
            Browse courses
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-brand-ink">How it works</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-2">
              <span className="font-display text-3xl font-bold text-brand-green/30">
                {step.number}
              </span>
              <h3 className="font-display font-semibold text-brand-ink">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-brand-ink">
          What makes it different
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="flex gap-4">
              <feature.icon
                className="h-6 w-6 shrink-0 text-brand-green"
                aria-hidden="true"
                strokeWidth={1.75}
              />
              <div>
                <h3 className="font-display font-semibold text-brand-ink">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-brand-green px-8 py-10 text-center text-white">
        <h2 className="font-display text-2xl font-semibold">Ready to start learning?</h2>
        <p className="mt-2 text-white/90">
          Browse the catalog — the first chapter of every course is free to read.
        </p>
        <Link to="/courses" className="mt-6 inline-block">
          <Button variant="secondary">Browse courses</Button>
        </Link>
      </section>
    </div>
  )
}
