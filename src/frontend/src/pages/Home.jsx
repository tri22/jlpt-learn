import { SITE_NAME } from '../constants/site.js'
import './Home.css'

const ENTRIES = [
  {
    href: '#/on-tap',
    kicker: 'Ôn tập',
    title: 'Luyện từng kĩ năng',
    desc: 'Từ vựng, Ngữ pháp, Kanji, Đọc hiểu, Nghe hiểu.',
    cta: 'Bắt đầu ôn tập',
  },
  {
    href: '#/thi-thu',
    kicker: 'Thi thử',
    title: 'Đề tổng hợp',
    desc: '90 câu trong 90 phút theo format kỳ thi JLPT.',
    cta: 'Vào phòng thi',
  },
]

export default function Home() {
  return (
    <main className="home">
      <div className="home-head">
        <h1>{SITE_NAME}</h1>
        <p>
          Nền tảng luyện thi JLPT miễn phí.
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
