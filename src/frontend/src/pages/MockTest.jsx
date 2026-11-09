import './MockTest.css'

export default function MockTest({ exams = [], loading = false, error = null }) {
  const mockExams = exams.filter((exam) => exam.kind === 'mock')
  const totalQuestions = mockExams.reduce((sum, exam) => sum + exam.questionCount, 0)

  return (
    <main className="mock-test">
      <div className="mock-test__head">
        <h1>Thi thử</h1>
        <p>
          {`${mockExams.length} đề tổng hợp, ${totalQuestions} câu hỏi, 90 phút mỗi đề — đúng format kỳ `}
          thi JLPT N5. Bấm “Nộp bài” hoặc hết giờ để xem điểm và đáp án chi tiết.
        </p>
      </div>

      {loading ? <p>Đang tải danh sách đề…</p> : null}
      {error ? <p role="alert">Không tải được danh sách đề: {error.message}</p> : null}

      {!loading && !error ? (
        <div className="mock-test__grid">
          {mockExams.map((exam, index) => (
            <article key={exam.id} className="mock-card">
              <span className="mock-card__no">Đề {String(index + 1).padStart(2, '0')}</span>
              <h2 className="mock-card__title">{exam.title.replace(/^Đề\s+Thi\s+/i, '')}</h2>
              <p className="mock-card__facts">
                {exam.questionCount} câu hỏi · {exam.durationMinutes} phút · đủ 3 phần Từ vựng, Ngữ pháp, Đọc hiểu
              </p>
              <a className="mock-card__cta" href={`#/bai-thi/${exam.id}`}>
                Bắt đầu thi thử →
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  )
}
