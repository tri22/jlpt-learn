import './MockTest.css'
import { formatExamTitle } from '../utils/exam.js'

export default function MockTest({ exams = [], loading = false, error = null }) {
  const mockExams = exams.filter((exam) => exam.kind === 'mock')
  const totalQuestions = mockExams.reduce((sum, exam) => sum + exam.questionCount, 0)

  return (
    <main className="mock-test">
      <div className="mock-test__head">
        <h1>Mock Exams</h1>
        <p>
          {`${mockExams.length} comprehensive exams, ${totalQuestions} questions, 90 minutes each in `}
          JLPT N5 format. Select “Submit” or wait for time to expire to view your score and answers.
        </p>
      </div>

      {loading ? <p>Loading exams…</p> : null}
      {error ? <p role="alert">Could not load exams: {error.message}</p> : null}

      {!loading && !error ? (
        <div className="mock-test__grid">
          {mockExams.map((exam, index) => (
            <article key={exam.id} className="mock-card">
              <span className="mock-card__no">Exam {String(index + 1).padStart(2, '0')}</span>
              <h2 className="mock-card__title">{formatExamTitle(exam.title)}</h2>
              <p className="mock-card__facts">
                {exam.questionCount} questions · {exam.durationMinutes} minutes · Vocabulary, Grammar, and Reading
              </p>
              <a className="mock-card__cta" href={`#/bai-thi/${exam.id}`}>
                Start mock exam →
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  )
}
