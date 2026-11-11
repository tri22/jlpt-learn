import { useCallback, useRef, useState } from 'react'
import { useDismissOnOutside } from '../hooks/useDismissOnOutside.js'
import './DropdownMenu.css'

/**
 * Shared dropdown menu: a button opens a list of options.
 *
 * @param {string} label button label
 * @param {Array<{id: string, label: string}>} items available options
 * @param {string|null} value active option
 * @param {(id: string) => void} onSelect called when an option is selected
 * @param {boolean} active whether the button is marked active
 * @param {string} className additional class for the root element
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
