import { render, screen } from '@testing-library/react';
import { Field } from './field';
import { Input } from './input';

describe('Field', () => {
  it('asocia la etiqueta visible con el control', () => {
    render(<Field label="Palabra" required>{(c) => <Input {...c} />}</Field>);
    const input = screen.getByLabelText(/Palabra/);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('muestra el error junto al campo y lo enlaza con aria-describedby', () => {
    render(<Field label="Palabra" error="Falta la palabra" help="Ayuda">{(c) => <Input {...c} />}</Field>);
    const input = screen.getByLabelText('Palabra');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const described = input.getAttribute('aria-describedby')!.split(' ');
    const texts = described.map((id) => document.getElementById(id)!.textContent);
    expect(texts).toEqual(['Falta la palabra', 'Ayuda']);
    expect(screen.getByRole('alert')).toHaveTextContent('Falta la palabra');
  });

  it('sin error no marca el control como inválido', () => {
    render(<Field label="Nombre">{(c) => <Input {...c} />}</Field>);
    expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('aria-invalid');
  });
});
