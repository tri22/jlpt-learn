import { SITE_NAME } from '../constants/site.js'
import './About.css'

export default function About() {
  return (
    <main className="about">
      <h1>About</h1>

      <p>
        {SITE_NAME} is an online practice platform for the JLPT N5 exam. Questions include images and
        audio to help learners become familiar with the exam format.
      </p>

      <section>
        <h2>Exam structure</h2>
        <ul>
          <li>Vocabulary — ~15 minutes</li>
          <li>Grammar — ~15 minutes</li>
          <li>Reading — ~35 minutes</li>
          <li>Kanji — ~10 minutes</li>
          <li>Listening — ~20 minutes</li>
        </ul>
      </section>

      <section>
        <h2>Content</h2>
        <p>
          This practice material does not replace the official JLPT exam. Please report any content
          errors so they can be corrected.
        </p>
      </section>
    </main>
  )
}
