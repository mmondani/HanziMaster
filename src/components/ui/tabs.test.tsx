import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './tabs';

const ITEMS = [{ id: 'campos', label: 'Campos' }, { id: 'tags', label: 'Tags' }, { id: 'layouts', label: 'Layouts' }];

function Harness() {
  const [v, setV] = useState('campos');
  return <Tabs label="Idioma" items={ITEMS} value={v} onChange={setV}>Panel {v}</Tabs>;
}

describe('Tabs', () => {
  it('expone tablist/tab/tabpanel y marca el tab activo', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Idioma' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Campos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel campos');
  });

  it('las flechas cambian de pestaña y mueven el foco', async () => {
    render(<Harness />);
    screen.getByRole('tab', { name: 'Campos' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tags' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel tags');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Layouts' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Campos' })).toHaveFocus();
  });

  it('solo el tab activo es tabulable', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Tags' })).toHaveAttribute('tabindex', '-1');
  });
});
