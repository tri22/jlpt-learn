import { SITE_NAME } from '../constants/site.js'
import './Footer.css'

export default function Footer({ exams = [] }) {
  const totalQuestions = exams.reduce((sum, exam) => sum + exam.questionCount, 0)

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-about">
          <strong>{SITE_NAME}</strong>
          <p>Kho đề luyện thi N5 dịch nguyên bản, kèm hình ảnh và audio của đề thi chính thức.</p>
        </div>

        <dl className="footer-facts">
          <div>
            <dt>Số đề</dt>
            <dd>{exams.length}</dd>
          </div>
          <div>
            <dt>Tổng câu hỏi</dt>
            <dd>{totalQuestions}</dd>
          </div>
          <div>
            <dt>Cấu trúc</dt>
            <dd>Từ vựng · Ngữ pháp · Đọc hiểu · Nghe</dd>
          </div>
        </dl>

        <p className="footer-note">
          Nội dung câu hỏi giữ nguyên từ bản HTML gốc. Bản dùng để luyện tập, không thay thế đề thi chính
          thức của JLPT.
        </p>
      </div>
    </footer>
  )
}
