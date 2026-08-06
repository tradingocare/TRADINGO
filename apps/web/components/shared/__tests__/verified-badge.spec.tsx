import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { VerifiedBadge } from '../VerifiedBadge';

describe('VerifiedBadge', () => {
  it('renders verified text', () => {
    render(<VerifiedBadge type="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders trusted text', () => {
    render(<VerifiedBadge type="trusted" />);
    expect(screen.getByText('Trusted')).toBeInTheDocument();
  });

  it('renders sm size', () => {
    render(<VerifiedBadge type="verified" size="sm" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});
