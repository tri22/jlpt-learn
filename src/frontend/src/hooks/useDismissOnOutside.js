import { useEffect } from 'react'

/**
 * Call `onDismiss` when the user clicks outside `ref` or presses Escape.
 *
 * Used by mobile menus and dropdowns so they close themselves.
 *
 * @param {import('react').RefObject<HTMLElement>} ref element to monitor
 * @param {boolean} active listen only while open
 * @param {() => void} onDismiss callback invoked to close the element
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
