export interface StepperProps {
  steps: string[];
  /** Índice (desde 0) del paso actual. */
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="steps" aria-label="Progreso" style={{ listStyle: 'none', padding: 0 }}>
      {steps.map((label, i) => (
        <li key={label} className={`s ${i === current ? 'on' : i < current ? 'done' : ''}`} aria-current={i === current ? 'step' : undefined}>
          <span className="n" aria-hidden="true">{i + 1}</span>
          {label}
          {i < steps.length - 1 && <span className="bar" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
