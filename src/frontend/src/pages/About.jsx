import { SITE_NAME } from '../constants/site.js'
import './About.css'

export default function About() {
  return (
    <main className="about">
      <h1>Giới thiệu</h1>

      <p>
        {SITE_NAME} là nền tảng luyện thi trực tuyến cho kỳ thi N5 của JLPT. Toàn bộ câu hỏi được giữ
        nguyên từ bản HTML gốc của đề thi, kèm hình ảnh và audio, giúp người học làm quen với đúng dạng
        bài thi thật.
      </p>

      <section>
        <h2>Cấu trúc đề thi</h2>
        <ul>
          <li>Từ vựng — ~15 phút</li>
          <li>Ngữ pháp — ~15 phút</li>
          <li>Đọc hiểu — ~35 phút</li>
          <li>Kanji — ~10 phút</li>
          <li>Nghe hiểu — ~20 phút</li>
        </ul>
      </section>

      <section>
        <h2>Nội dung</h2>
        <p>
          Bản dùng để luyện tập, không thay thế đề thi chính thức của JLPT. Nếu bạn tìm thấy lỗi nội
          dung, hãy báo lại để chúng tôi sửa.
        </p>
      </section>
    </main>
  )
}
