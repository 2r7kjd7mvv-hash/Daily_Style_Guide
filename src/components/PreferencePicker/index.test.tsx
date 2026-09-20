import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreferencePicker from './index';
import { TRIP_STYLE_OPTIONS } from '@/features/trip/preferences';

describe('PreferencePicker', () => {
  it('highlights selected options and reports the toggled values', () => {
    const onChange = vi.fn();
    render(<PreferencePicker options={TRIP_STYLE_OPTIONS} values={['leisure', 'photo']} onChange={onChange} />);
    expect(screen.getByText('休闲度假').closest('button')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByText('商务出差'));
    expect(onChange).toHaveBeenCalledWith(['leisure', 'photo', 'business']);
  });
});
