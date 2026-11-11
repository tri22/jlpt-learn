import { SITE_NAME } from '../constants/site.js'
import './Home.css'

const ENTRIES = [
  {
    href: '#/on-tap',
    kicker: 'Review',
    title: 'Practice individual skills',
    desc: 'Vocabulary, Grammar, Kanji, Reading, and Listening.',
    cta: 'Start reviewing',
  },
  {
    href: '#/thi-thu',
    kicker: 'Mock exams',
    title: 'Comprehensive exams',
    desc: '90 questions in 90 minutes using the JLPT format.',
    cta: 'Start a mock exam',
  },
]

export default function Home() {
  return (
    <main className="home">
      <div className="home-head">
        <h1>{SITE_NAME}</h1>
        <p>
          Free online JLPT practice.
        </p>
      </div>

      <div className="home-entries">
        {ENTRIES.map((entry) => (
          <a key={entry.href} className="entry-card" href={entry.href}>
            <span className="entry-card__kicker">{entry.kicker}</span>
            <span className="entry-card__title">{entry.title}</span>
            <span className="entry-card__desc">{entry.desc}</span>
            <span className="entry-card__cta">{entry.cta} →</span>
          </a>
        ))}
      </div>
    </main>
  )
}
