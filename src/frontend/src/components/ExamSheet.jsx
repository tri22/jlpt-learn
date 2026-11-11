import { formatTime } from '../utils/time.js'
import './ExamSheet.css'

export default function ExamSheet({
  questions,
  answers,
  flagged,
  answerKey,
  graded,
  score,
  answeredCount,
  questionCount,
  secondsLeft,
  onJumpTo,
  onSubmit,
  onRestart,
}) {
  return (
    <aside className="sheet">
      <div className="sheet-stats">
        <div>
          <span>Answered</span>
          <strong>
            {graded ? score : answeredCount}
            <small>/{questionCount}</small>
          </strong>
        </div>
        <div>
          <span>{graded ? 'Result' : 'Time remaining'}</span>
          <strong className={secondsLeft < 300 && !graded ? 'urgent' : ''}>
            {graded ? `${score}/${questionCount}` : formatTime(secondsLeft)}
          </strong>
        </div>
      </div>

      <div className="nav-scroll">
        <ol className="nav-grid">
          {questions.map((question, index) => {
            const selected = answers[question.id]
            const correct = answerKey[String(question.id)]
            const status = graded
              ? selected === correct
                ? 'correct'
                : 'wrong'
              : flagged[question.id]
                ? 'flagged'
                : selected
                  ? 'done'
                  : ''
            return (
              <li key={question.id}>
                <button
                  type="button"
                  className={status}
                  aria-label={`Question ${index + 1}`}
                  onClick={() => onJumpTo(question.id)}
                >
                  {index + 1}
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <button type="button" className="primary block" onClick={graded ? onRestart : onSubmit}>
        {graded ? 'Restart' : 'Submit'}
      </button>

      <ul className="legend">
        <li>
          <i className="swatch done" /> Answered
        </li>
        <li>
          <i className="swatch" /> Unanswered
        </li>
        <li>
          <i className="swatch flagged" /> Flagged for review
        </li>
      </ul>

      {/* On narrow screens, the sidebar moves below the exam. Keep progress and
          submission controls visible in a fixed bottom bar. */}
      <div className="sheet-bar">
        <span>
          {answeredCount}/{questionCount}
        </span>
        <span>{graded ? `${score} correct` : formatTime(secondsLeft)}</span>
        <button type="button" onClick={graded ? onRestart : onSubmit}>
          {graded ? 'Restart' : 'Submit'}
        </button>
      </div>
    </aside>
  )
}
