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
          <span>Số câu đã làm</span>
          <strong>
            {graded ? score : answeredCount}
            <small>/{questionCount}</small>
          </strong>
        </div>
        <div>
          <span>{graded ? 'Kết quả' : 'Thời gian còn lại'}</span>
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
                  aria-label={`Câu ${index + 1}`}
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
        {graded ? 'Làm lại' : 'Nộp bài'}
      </button>

      <ul className="legend">
        <li>
          <i className="swatch done" /> Câu đã làm
        </li>
        <li>
          <i className="swatch" /> Câu chưa làm
        </li>
        <li>
          <i className="swatch flagged" /> Câu cần kiểm tra lại
        </li>
      </ul>

      {/* Trên màn hình hẹp, sidebar bị đẩy xuống dưới nên cần một thanh cố định
          đáy màn hình để luôn thấy tiến độ và nút nộp bài. */}
      <div className="sheet-bar">
        <span>
          {answeredCount}/{questionCount}
        </span>
        <span>{graded ? `${score} đúng` : formatTime(secondsLeft)}</span>
        <button type="button" onClick={graded ? onRestart : onSubmit}>
          {graded ? 'Làm lại' : 'Nộp bài'}
        </button>
      </div>
    </aside>
  )
}
