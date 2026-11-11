/** Review subjects matching the `subject` value returned by the API. */
export const SUBJECTS = [
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'kanji', label: 'Kanji' },
  { id: 'reading', label: 'Reading' },
  { id: 'listening', label: 'Listening' },
]

export const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((item) => [item.id, item.label]))
