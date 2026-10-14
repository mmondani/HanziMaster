import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './pagination';

describe('MJ2 · Pagination', () => {
  it('MJ2-4 marca la página actual, navega por número y con anterior/siguiente', async () => {
    const onChange = vi.fn();
    render(<Pagination page={3} pageCount={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'Página 5' }));
    expect(onChange).toHaveBeenLastCalledWith(5);
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('MJ2-5 en los extremos deshabilita anterior o siguiente', () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    rerender(<Pagination page={3} pageCount={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('con una sola página no se muestra', () => {
    render(<Pagination page={1} pageCount={1} onChange={() => {}} />);
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull();
  });
});
