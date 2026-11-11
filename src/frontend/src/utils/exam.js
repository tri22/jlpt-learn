// Preserve display compatibility with legacy Vietnamese titles without embedding localized copy.
const LEGACY_TITLE_PREFIX = /^\u0110\u1ec1\s+\u0054\u0068\u0069\s+/i

export function formatExamTitle(title) {
  return title.replace(LEGACY_TITLE_PREFIX, '')
}
