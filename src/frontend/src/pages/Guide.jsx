import './Guide.css'

export default function Guide() {
  return (
    <main className="guide">
      <h1>User Guide</h1>

      <section>
        <h2>Take an exam</h2>
        <ol>
          <li>Select a subject in the top navigation to filter the exam catalog.</li>
          <li>Select an exam card to open the exam screen.</li>
          <li>Select one answer per question. Use the question navigator to jump to any question.</li>
          <li>Select the flag button to mark a question for review.</li>
          <li>Select “Submit” to grade the exam and view the answers.</li>
        </ol>
      </section>

      <section>
        <h2>Timer</h2>
        <p>
          Each exam has a predefined duration shown on the exam screen. When time expires, the exam is
          graded automatically. Select “Restart” to begin again with cleared answers and a reset timer.
        </p>
      </section>

      <section>
        <h2>Audio and images</h2>
        <p>
          Listening questions include audio, and some questions include images. External resources require
          an Internet connection.
        </p>
      </section>
    </main>
  )
}
