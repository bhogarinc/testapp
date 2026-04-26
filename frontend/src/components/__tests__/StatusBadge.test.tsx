/**
 * StatusBadge Component Tests
 * 
 * Tests for the status badge component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders healthy status', () => {
    render(<StatusBadge status="healthy" />);
    const badge = screen.getByText(/healthy/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('healthy');
  });

  it('renders degraded status', () => {
    render(<StatusBadge status="degraded" />);
    const badge = screen.getByText(/degraded/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('degraded');
  });

  it('renders unhealthy status', () => {
    render(<StatusBadge status="unhealthy" />);
    const badge = screen.getByText(/unhealthy/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('unhealthy');
  });

  it('renders with custom label', () => {
    render(<StatusBadge status="healthy" label="All Good" />);
    expect(screen.getByText(/all good/i)).toBeInTheDocument();
  });

  it('renders with icon when showIcon is true', () => {
    render(<StatusBadge status="healthy" showIcon />);
    expect(screen.getByTestId('status-icon')).toBeInTheDocument();
  });
});
