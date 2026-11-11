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

// Keep existing public hash slugs for bookmark compatibility; route names stay English internally.
const STATIC_ROUTES = {
  'thi-thu': 'mock-exams',
  'huong-dan': 'guide',
  'gioi-thieu': 'about',
}

const PAGE_TITLES = {
  'mock-exams': 'Mock Exams',
  guide: 'Guide',
  about: 'About',
}

function parseRoute(hash) {
  const match = hash.match(/^#\/bai-thi\/([\w-]+)/)
  if (match) return { name: 'exam', param: match[1] }

  // Review: #/on-tap or #/on-tap/<subject>
  const reviewMatch = hash.match(/^#\/on-tap(?:\/([\w-]+))?/)
  if (reviewMatch) return { name: 'review', param: reviewMatch[1] ?? null }

  const staticMatch = hash.match(/^#\/([\w-]+)/)
  if (staticMatch && Object.hasOwn(STATIC_ROUTES, staticMatch[1])) {
    return { name: STATIC_ROUTES[staticMatch[1]], param: null }
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
  const subject = route.name === 'review' ? route.param : null

  // Update the browser title for the current page.
  useEffect(() => {
    if (route.name === 'exam') {
      document.title = exam ? `${exam.title} — ${SITE_NAME}` : `Loading exam… — ${SITE_NAME}`
      return
    }
    if (route.name === 'home') {
      document.title = `${SITE_NAME} — JLPT N5 Practice`
      return
    }
    if (route.name === 'review') {
      const label = subject ? SUBJECT_LABELS[subject] : null
      document.title = label ? `${label} Review — ${SITE_NAME}` : `Review — ${SITE_NAME}`
      return
    }
    document.title = `${PAGE_TITLES[route.name] ?? SITE_NAME} — ${SITE_NAME}`
  }, [route, exam, subject])

  // Current route used to mark the active navigation link.
  const currentPath = useMemo(() => {
    if (route.name === 'exam') return '#/bai-thi'
    if (route.name === 'home') return '#/'
    if (route.name === 'review') return subject ? `#/on-tap/${subject}` : '#/on-tap'
    if (route.name === 'mock-exams') return '#/thi-thu'
    if (route.name === 'guide') return '#/huong-dan'
    if (route.name === 'about') return '#/gioi-thieu'
    return '#/'
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
            <p>Loading exam…</p>
          </main>
        ) : examError ? (
          <main className="exam">
            <p role="alert">Could not load the exam: {examError.message}</p>
          </main>
        ) : exam ? (
          <>
            <Header exam={exam} />
            <Exam exam={exam} />
          </>
        ) : (
          <main className="exam">
            <p>Exam not found.</p>
          </main>
        )
      ) : route.name === 'review' ? (
        <Review exams={exams} subject={subject} loading={loading} error={error} />
      ) : route.name === 'mock-exams' ? (
        <MockTest exams={exams} loading={loading} error={error} />
      ) : route.name === 'guide' ? (
        <Guide />
      ) : route.name === 'about' ? (
        <About />
      ) : (
        <Home />
      )}
      <Footer exams={exams} />
    </>
  )
}
