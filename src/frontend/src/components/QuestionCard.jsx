import './QuestionCard.css'

function ChoiceButton({ choice, isSelected, isCorrect, isWrong, graded, onSelect }) {
  const className = [
    'choice',
    isSelected ? 'is-selected' : '',
    isCorrect ? 'is-correct' : '',
    isWrong ? 'is-wrong' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      disabled={graded}
      aria-pressed={isSelected}
      onClick={() => onSelect(choice.key)}
    >
      <span className="choice-key">{choice.key}</span>
      <span dangerouslySetInnerHTML={{ __html: choice.html }} />
    </button>
  )
}

function QuestionVerdict({ selected, correctKey }) {
  if (!selected) return <>Unanswered — correct answer: {correctKey}</>
  if (selected === correctKey) return <>Correct</>
  return <>Incorrect — correct answer: {correctKey}</>
}

export default function QuestionCard({
  question,
  selected,
  correctKey,
  flagged,
  graded,
  onSelect,
  onToggleFlag,
}) {
  return (
    <article className="question" id={`cau-${question.id}`}>
      <header className="question-head">
        <h2>{question.label}</h2>
        <span className="kind">{question.kind}</span>
      </header>
      {question.quizHtml ? (
        <div className="quiz" dangerouslySetInnerHTML={{ __html: question.quizHtml }} />
      ) : null}
      <ul className="choices">
        {question.choices.map((choice) => (
          <li key={choice.key}>
            <ChoiceButton
              choice={choice}
              isSelected={selected === choice.key}
              isCorrect={graded && choice.key === correctKey}
              isWrong={graded && selected === choice.key && choice.key !== correctKey}
              graded={graded}
              onSelect={(key) => onSelect(question.id, key)}
            />
          </li>
        ))}
      </ul>
      <div className="question-foot">
        <button
          type="button"
          className={flagged ? 'flag on' : 'flag'}
          disabled={graded}
          onClick={() => onToggleFlag(question.id)}
        >
          {flagged ? 'Flagged for review' : 'Review later'}
        </button>
        {graded ? (
          <p className={selected === correctKey ? 'verdict ok' : 'verdict bad'}>
            <QuestionVerdict selected={selected} correctKey={correctKey} />
          </p>
        ) : null}
      </div>
    </article>
  )
}
