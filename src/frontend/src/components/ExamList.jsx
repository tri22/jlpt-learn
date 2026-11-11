import './ExamList.css'
import { formatExamTitle } from '../utils/exam.js'

/** Convert an exam ID into a readable label: `de-3` -> `Exam 3`. */
function examLabel(exam) {
  if (exam.id.startsWith('de-')) return `Exam ${exam.id.slice(3)}`

  const match = exam.id.match(/^jt4y-n5-([a-z]+)-(\d+)$/)
  if (match) {
    const labels = {
      vocabulary: 'Vocabulary',
      grammar: 'Grammar',
      reading: 'Reading',
      kanji: 'Kanji',
      listening: 'Listening',
    }
    return `${labels[match[1]] ?? match[1]} ${match[2]}`
  }

  return ''
}

export default function ExamList({ exams = [] }) {
  if (!exams.length) {
    return <p className="exam-list__empty">No exams available.</p>
  }

  return (
    <ul className="exam-list">
      {exams.map((exam) => (
        <li key={exam.id}>
          <a className="exam-card" href={`#/bai-thi/${exam.id}`}>
            {examLabel(exam) ? <span className="exam-card__no">{examLabel(exam)}</span> : null}
            <span className="exam-card__title">{formatExamTitle(exam.title)}</span>
            <span className="exam-card__facts">
              <span>{exam.questionCount} questions</span>
              <span aria-hidden="true">·</span>
              <span>{exam.durationMinutes} minutes</span>
            </span>
            <span className="exam-card__cta">Start exam</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
