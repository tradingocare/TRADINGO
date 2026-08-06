import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
  it('renders without text', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders with size variant', () => {
    render(<LoadingSpinner size="lg" text="Loading large" />);
    expect(screen.getByText('Loading large')).toBeInTheDocument();
  });
});
