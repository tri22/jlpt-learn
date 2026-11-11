import { SITE_NAME } from '../constants/site.js'
import './Footer.css'

export default function Footer({ exams = [] }) {
  const totalQuestions = exams.reduce((sum, exam) => sum + exam.questionCount, 0)

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-about">
          <strong>{SITE_NAME}</strong>
          <p>JLPT N5 practice exams with images and audio.</p>
        </div>

        <dl className="footer-facts">
          <div>
            <dt>Exams</dt>
            <dd>{exams.length}</dd>
          </div>
          <div>
            <dt>Total questions</dt>
            <dd>{totalQuestions}</dd>
          </div>
          <div>
            <dt>Sections</dt>
            <dd>Vocabulary · Grammar · Reading · Listening</dd>
          </div>
        </dl>

        <p className="footer-note">
          Practice content only; this site does not replace the official JLPT examination.
        </p>
      </div>
    </footer>
  )
}
