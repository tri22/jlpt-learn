/** Các môn ôn tập, khớp với `subject` trả về từ API. */
export const SUBJECTS = [
  { id: 'vocabulary', label: 'Từ vựng' },
  { id: 'grammar', label: 'Ngữ pháp' },
  { id: 'kanji', label: 'Kanji' },
  { id: 'reading', label: 'Đọc hiểu' },
  { id: 'listening', label: 'Nghe hiểu' },
]

export const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((item) => [item.id, item.label]))
