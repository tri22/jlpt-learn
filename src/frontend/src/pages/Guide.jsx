import './Guide.css'

export default function Guide() {
  return (
    <main className="guide">
      <h1>Hướng dẫn sử dụng</h1>

      <section>
        <h2>Làm một đề thi</h2>
        <ol>
          <li>Chọn môn ở thanh trên cùng (Từ vựng, Ngữ pháp, Đọc hiểu, Kanji, Nghe hiểu) để lọc danh sách đề.</li>
          <li>Bấm vào một thẻ đề để mở màn hình làm bài.</li>
          <li>Chọn một đáp án cho mỗi câu. Bạn có thể dùng bảng chỉ mục bên phải để nhảy tới câu bất kỳ.</li>
          <li>Bấm biểu tượng cờ để đánh dấu câu cần xem lại.</li>
          <li>Bấm “Nộp bài” để chấm điểm ngay và xem đáp án.</li>
        </ol>
      </section>

      <section>
        <h2>Bộ đếm thời gian</h2>
        <p>
          Mỗi đề có sẵn thời gian thi (hiển thị ở đầu trang làm bài). Khi hết giờ, bài thi tự động được
          nộp và chấm điểm. Bạn có thể bấm “Làm lại” để bắt đầu một lượt mới với bộ câu hỏi và bộ đếm thời
          gian đã reset.
        </p>
      </section>

      <section>
        <h2>Âm thanh và hình ảnh</h2>
        <p>
          Các câu nghe hiểu có sẵn đoạn audio kèm theo; một số câu có hình minh hoạ. Tài nguyên này được
          tham chiếu từ nguồn đề thi gốc nên cần kết nối Internet để hiển thị.
        </p>
      </section>
    </main>
  )
}
