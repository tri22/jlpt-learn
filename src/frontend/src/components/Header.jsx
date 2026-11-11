import './Header.css'

export default function Header({ exam }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <p className="site-header__title">{exam.title}</p>
        <dl className="header-facts">
          <div>
            <dt>Questions</dt>
            <dd>{exam.questionCount}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>
              {exam.durationMinutes}
              <small>minutes</small>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
