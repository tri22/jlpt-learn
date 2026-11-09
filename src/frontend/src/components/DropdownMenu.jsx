import { useCallback, useRef, useState } from 'react'
import { useDismissOnOutside } from '../hooks/useDismissOnOutside.js'
import './DropdownMenu.css'

/**
 * Menu xổ xuống dùng chung: một nút bấm mở ra danh sách lựa chọn.
 *
 * @param {string} label nhãn hiển thị trên nút bấm
 * @param {Array<{id: string, label: string}>} items các lựa chọn
 * @param {string|null} value lựa chọn đang active
 * @param {(id: string) => void} onSelect gọi khi chọn một mục
 * @param {boolean} active nút bấm được đánh dấu active
 * @param {string} className class bổ sung cho phần tử gốc
 */
export default function DropdownMenu({
  label,
  items = [],
  value = null,
  onSelect,
  active = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useDismissOnOutside(rootRef, open, close)

  function pick(id) {
    onSelect?.(id)
    close()
  }

  return (
    <li className={`dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`dropdown__trigger${active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <span className="dropdown__caret" aria-hidden="true" />
      </button>

      <div className={`dropdown__menu${open ? ' is-open' : ''}`}>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`dropdown__item${value === item.id ? ' is-active' : ''}`}
                onClick={() => pick(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
