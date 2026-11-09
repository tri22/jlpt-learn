import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Review from './pages/Review.jsx'
import MockTest from './pages/MockTest.jsx'
import Exam from './pages/Exam.jsx'
import Guide from './pages/Guide.jsx'
import About from './pages/About.jsx'
import { useExam, useExams } from './hooks/useExams.js'
import { SITE_NAME } from './constants/site.js'
import { SUBJECT_LABELS } from './constants/subjects.js'
import './index.css'

const STATIC_ROUTES = ['thi-thu', 'huong-dan', 'gioi-thieu']

const PAGE_TITLES = {
  'thi-thu': 'Thi thử',
  'huong-dan': 'Hướng dẫn',
  'gioi-thieu': 'Giới thiệu',
}

function parseRoute(hash) {
  const match = hash.match(/^#\/bai-thi\/([\w-]+)/)
  if (match) return { name: 'exam', param: match[1] }

  // Ôn tập: #/on-tap hoặc #/on-tap/<môn>
  const reviewMatch = hash.match(/^#\/on-tap(?:\/([\w-]+))?/)
  if (reviewMatch) return { name: 'on-tap', param: reviewMatch[1] ?? null }

  const staticMatch = hash.match(/^#\/([\w-]+)/)
  if (staticMatch && STATIC_ROUTES.includes(staticMatch[1])) {
    return { name: staticMatch[1], param: null }
  }

  return { name: 'home', param: null }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  const { exams, loading, error } = useExams()
  const { exam: examDetail, loading: examLoading, error: examError } = useExam(
    route.name === 'exam' ? route.param : null,
  )

  useEffect(() => {
    function onHashChange() {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const exam = route.name === 'exam' ? examDetail : null
  const subject = route.name === 'on-tap' ? route.param : null

  // Đổi tiêu đề tab theo trang đang xem
  useEffect(() => {
    if (route.name === 'exam') {
      document.title = exam ? `${exam.title} — ${SITE_NAME}` : `Đang tải đề thi… — ${SITE_NAME}`
      return
    }
    if (route.name === 'home') {
      document.title = `${SITE_NAME} — Luyện thi JLPT N5`
      return
    }
    if (route.name === 'on-tap') {
      const label = subject ? SUBJECT_LABELS[subject] : null
      document.title = label ? `Ôn tập ${label} — ${SITE_NAME}` : `Ôn tập — ${SITE_NAME}`
      return
    }
    document.title = `${PAGE_TITLES[route.name] ?? SITE_NAME} — ${SITE_NAME}`
  }, [route, exam, subject])

  // Đường dẫn tương ứng trang hiện tại, dùng để đánh dấu link đang active
  const currentPath = useMemo(() => {
    if (route.name === 'exam') return '#/bai-thi'
    if (route.name === 'home') return '#/'
    if (route.name === 'on-tap') return subject ? `#/on-tap/${subject}` : '#/on-tap'
    return `#/${route.name}`
  }, [route, subject])

  return (
    <>
      <Navbar
        current={currentPath}
        subject={subject}
        onSubjectChange={(next) => {
          window.location.hash = next ? `#/on-tap/${next}` : '#/on-tap'
        }}
      />
      {route.name === 'exam' ? (
        examLoading ? (
          <main className="exam">
            <p>Đang tải đề thi…</p>
          </main>
        ) : examError ? (
          <main className="exam">
            <p role="alert">Không tải được đề thi: {examError.message}</p>
          </main>
        ) : exam ? (
          <>
            <Header exam={exam} />
            <Exam exam={exam} />
          </>
        ) : (
          <main className="exam">
            <p>Không tìm thấy đề thi.</p>
          </main>
        )
      ) : route.name === 'on-tap' ? (
        <Review exams={exams} subject={subject} loading={loading} error={error} />
      ) : route.name === 'thi-thu' ? (
        <MockTest exams={exams} loading={loading} error={error} />
      ) : route.name === 'huong-dan' ? (
        <Guide />
      ) : route.name === 'gioi-thieu' ? (
        <About />
      ) : (
        <Home />
      )}
      <Footer exams={exams} />
    </>
  )
}
