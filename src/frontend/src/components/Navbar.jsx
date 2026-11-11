import { useCallback, useRef, useState } from 'react'
import DropdownMenu from './DropdownMenu.jsx'
import { useDismissOnOutside } from '../hooks/useDismissOnOutside.js'
import { SITE_NAME, SITE_TAGLINE } from '../constants/site.js'
import { SUBJECTS } from '../constants/subjects.js'
import './Navbar.css'

/** Static application pages. */
const NAV_LINKS = [
  { href: '#/thi-thu', label: 'Mock Exams' },
  { href: '#/huong-dan', label: 'Guide' },
  { href: '#/gioi-thieu', label: 'About' },
]

/** Review subjects with an all-subjects option first. */
const REVIEW_ITEMS = [{ id: 'all', label: 'All subjects' }, ...SUBJECTS]

export default function Navbar({ current = '', subject = null, onSubjectChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useDismissOnOutside(menuRef, menuOpen, closeMenu)

  function pickSubject(id) {
    onSubjectChange?.(id === 'all' ? null : id)
    closeMenu()
  }

  return (
    <nav className="navbar" ref={menuRef} aria-label="Main navigation">
      <div className="navbar__inner">
        <a className="navbar__brand" href="#/">
          <span className="navbar__seal" aria-hidden="true">
            N5
          </span>
          <span className="navbar__brand-text">
            <strong>{SITE_NAME}</strong>
            <small>{SITE_TAGLINE}</small>
          </span>
        </a>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">Open menu</span>
          <span className="navbar__bars" aria-hidden="true" />
        </button>

        <ul id="navbar-menu" className={`navbar__menu${menuOpen ? ' is-open' : ''}`}>
          <DropdownMenu
            label="Review"
            items={REVIEW_ITEMS}
            value={subject ?? 'all'}
            active={current.startsWith('#/on-tap')}
            onSelect={pickSubject}
          />

          {NAV_LINKS.map((link) => (
            <li key={link.href} className="navbar__item">
              <a
                className={`navbar__link${current === link.href ? ' is-active' : ''}`}
                href={link.href}
                aria-current={current === link.href ? 'page' : undefined}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
