import ExamList from '../components/ExamList.jsx'
import { SUBJECT_LABELS, SUBJECTS } from '../constants/subjects.js'
import './Review.css'

export default function Review({ exams = [], subject = null, loading = false, error = null }) {
  const reviewExams = exams.filter((exam) => exam.kind === 'review')

  // subject = null shows every subject, grouped by subject.
  const groups = subject
    ? [
        {
          subject,
          label: SUBJECT_LABELS[subject] ?? subject,
          items: reviewExams.filter((exam) => exam.subject === subject),
        },
      ]
    : SUBJECTS.map((item) => ({
        subject: item.id,
        label: item.label,
        items: reviewExams.filter((exam) => exam.subject === item.id),
      })).filter((group) => group.items.length)

  const visibleExams = subject
    ? reviewExams.filter((exam) => exam.subject === subject)
    : reviewExams
  const totalQuestions = visibleExams.reduce((sum, exam) => sum + exam.questionCount, 0)

  return (
    <main className="review">
      <div className="review-head">
        <h1>{subject ? `Review · ${SUBJECT_LABELS[subject] ?? subject}` : 'Review'}</h1>
        <p>
          {`${visibleExams.length} subject exams, ${totalQuestions} questions. Use short exams to identify `}
          weak subjects and focus your study.
        </p>
      </div>

      {loading ? <p>Loading exams…</p> : null}
      {error ? <p role="alert">Could not load exams: {error.message}</p> : null}

      {!loading && !error
        ? groups.map((group) => (
            <section key={group.subject} className="review-group">
              <div className="review-group__head">
                <h2>{group.label}</h2>
                <span className="review-group__count">{group.items.length} exams</span>
              </div>
              <ExamList exams={group.items} />
            </section>
          ))
        : null}
    </main>
  )
}
