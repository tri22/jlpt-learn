import './Header.css'

export default function Header({ exam }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <p className="site-header__title">{exam.title}</p>
        <dl className="header-facts">
          <div>
            <dt>Số câu</dt>
            <dd>{exam.questionCount}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>
              {exam.durationMinutes}
              <small>phút</small>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
