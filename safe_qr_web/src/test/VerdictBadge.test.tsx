import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VerdictBadge } from '../components/ui/VerdictBadge';

describe('VerdictBadge', () => {
  it('renderiza label em português', () => {
    render(<VerdictBadge verdict="unsafe" />);
    expect(screen.getByText('Inseguro')).toBeInTheDocument();
  });

  it('renderiza veredito seguro', () => {
    render(<VerdictBadge verdict="safe" />);
    expect(screen.getByText('Seguro')).toBeInTheDocument();
  });
});
