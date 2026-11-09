import './ExamList.css'

/** Rút gọn id đề thành nhãn đọc được: `de-3` -> `Đề 3`, `jt4y-n5-kanji-05` -> `Kanji 05`. */
function examLabel(exam) {
  if (exam.id.startsWith('de-')) return `Đề ${exam.id.slice(3)}`

  const match = exam.id.match(/^jt4y-n5-([a-z]+)-(\d+)$/)
  if (match) {
    const labels = {
      vocabulary: 'Từ vựng',
      grammar: 'Ngữ pháp',
      reading: 'Đọc hiểu',
      kanji: 'Kanji',
      listening: 'Nghe hiểu',
    }
    return `${labels[match[1]] ?? match[1]} ${match[2]}`
  }

  return ''
}

export default function ExamList({ exams = [] }) {
  if (!exams.length) {
    return <p className="exam-list__empty">Chưa có đề thi nào.</p>
  }

  return (
    <ul className="exam-list">
      {exams.map((exam) => (
        <li key={exam.id}>
          <a className="exam-card" href={`#/bai-thi/${exam.id}`}>
            {examLabel(exam) ? <span className="exam-card__no">{examLabel(exam)}</span> : null}
            <span className="exam-card__title">{exam.title.replace(/^Đề\s+Thi\s+/i, '')}</span>
            <span className="exam-card__facts">
              <span>{exam.questionCount} câu</span>
              <span aria-hidden="true">·</span>
              <span>{exam.durationMinutes} phút</span>
            </span>
            <span className="exam-card__cta">Bắt đầu làm bài</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
