export function formatTime(seconds) {
  const safe = Math.max(0, seconds)
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const secs = String(safe % 60).padStart(2, '0')
  return `${hours}:${minutes}:${secs}`
}
