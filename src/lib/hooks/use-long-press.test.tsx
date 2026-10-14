import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LONG_PRESS_MS, useLongPress } from './use-long-press';

function Target({ onLongPress, onClick }: { onLongPress?: () => void; onClick?: () => void }) {
  const props = useLongPress(onLongPress);
  return <button type="button" {...props} onClick={(e) => { props.onClick?.(e); if (!e.defaultPrevented) onClick?.(); }}>x</button>;
}

const touch = { pointerType: 'touch', clientX: 10, clientY: 10 };

describe('useLongPress', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('dispara al mantener apretado con touch y anula el clic posterior', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    render(<Target onLongPress={onLongPress} onClick={onClick} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, touch);
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS); });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(b, touch);
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(b); // el siguiente clic normal sí pasa
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no dispara si se suelta antes, y el toque corto deja pasar el clic', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    render(<Target onLongPress={onLongPress} onClick={onClick} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, touch);
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS - 100); });
    fireEvent.pointerUp(b, touch);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(b);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no dispara si el dedo se mueve (scroll)', () => {
    const onLongPress = vi.fn();
    render(<Target onLongPress={onLongPress} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, touch);
    fireEvent.pointerMove(b, { ...touch, clientY: 40 });
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS * 2); });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('no se activa con mouse', () => {
    const onLongPress = vi.fn();
    render(<Target onLongPress={onLongPress} />);
    fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'mouse', clientX: 1, clientY: 1 });
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS * 2); });
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
