import { useId, type InputHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label: string;
}

export function Switch({ label, className, id, ...rest }: SwitchProps) {
  const uid = useId();
  const inputId = id ?? uid;
  return (
    <label className={['check', className].filter(Boolean).join(' ')} htmlFor={inputId}>
      <span className="switch">
        <input id={inputId} type="checkbox" role="switch" {...rest} />
        <span />
      </span>
      <span className="grow">{label}</span>
    </label>
  );
}
