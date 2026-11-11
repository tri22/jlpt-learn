import { useEffect, useMemo, useState } from 'react'
import QuestionCard from '../components/QuestionCard.jsx'
import ExamSheet from '../components/ExamSheet.jsx'
import './Exam.css'

export default function Exam({ exam }) {
  const totalSeconds = exam.durationMinutes * 60
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState({})
  const [graded, setGraded] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  const answeredCount = Object.keys(answers).length
  const score = useMemo(() => {
    if (!graded) return 0
    return exam.questions.reduce((total, question) => {
      return answers[question.id] === exam.answerKey[String(question.id)] ? total + 1 : total
    }, 0)
  }, [answers, graded, exam])

  useEffect(() => {
    if (graded) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [graded])

  useEffect(() => {
    if (secondsLeft === 0 && !graded) setGraded(true)
  }, [secondsLeft, graded])

  function selectAnswer(id, key) {
    if (graded) return
    setAnswers((current) => ({ ...current, [id]: key }))
  }

  function toggleFlag(id) {
    if (graded) return
    setFlagged((current) => ({ ...current, [id]: !current[id] }))
  }

  function jumpTo(id) {
    document.getElementById(`cau-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function submit() {
    setGraded(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function restart() {
    setAnswers({})
    setFlagged({})
    setGraded(false)
    setSecondsLeft(totalSeconds)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="exam">
      <div className="exam-main">
        <div className="exam-title">
          <h1>{exam.title}</h1>
          {graded ? (
            <p className="score">
              Result: {score}/{exam.questionCount}. Answered {answeredCount}/{exam.questionCount}.
            </p>
          ) : (
            <p>Select one answer per question. You can flag questions for review before submitting.</p>
          )}
        </div>
        {exam.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={answers[question.id]}
            correctKey={exam.answerKey[String(question.id)]}
            flagged={Boolean(flagged[question.id])}
            graded={graded}
            onSelect={selectAnswer}
            onToggleFlag={toggleFlag}
          />
        ))}
      </div>
      <ExamSheet
        questions={exam.questions}
        answers={answers}
        flagged={flagged}
        answerKey={exam.answerKey}
        graded={graded}
        score={score}
        answeredCount={answeredCount}
        questionCount={exam.questionCount}
        secondsLeft={secondsLeft}
        onJumpTo={jumpTo}
        onSubmit={submit}
        onRestart={restart}
      />
    </main>
  )
}
