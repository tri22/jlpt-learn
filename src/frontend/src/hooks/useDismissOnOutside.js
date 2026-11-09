import { useEffect } from 'react'

/**
 * Gọi `onDismiss` khi người dùng bấm ra ngoài phần tử `ref` hoặc nhấn Escape.
 *
 * Dùng cho menu di động và dropdown để chúng tự đóng.
 *
 * @param {import('react').RefObject<HTMLElement>} ref phần tử cần theo dõi
 * @param {boolean} active chỉ lắng nghe khi đang mở
 * @param {() => void} onDismiss hàm được gọi khi cần đóng
 */
export function useDismissOnOutside(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) return undefined

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onDismiss()
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, active, onDismiss])
}
