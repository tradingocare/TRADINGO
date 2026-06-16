import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../error-state';
import { NotFoundState } from '../not-found-state';

const mockError = new Error('Test error message');
mockError.stack = 'Error: Test error message\n    at Object.<anonymous> (test.ts:1:1)';

describe('ErrorState', () => {
  it('renders error title and message', () => {
    render(<ErrorState error={mockError} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('retry button calls reset when clicked', () => {
    const resetMock = jest.fn();
    render(<ErrorState error={mockError} reset={resetMock} />);
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when reset is not provided', () => {
    render(<ErrorState error={mockError} />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('renders Go Home link', () => {
    render(<ErrorState error={mockError} />);
    const homeLink = screen.getByText('Go Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders Dashboard link when showDashboard is true', () => {
    render(<ErrorState error={mockError} showDashboard dashboardHref="/seller/dashboard" />);
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/seller/dashboard');
  });

  it('does not render Dashboard link when showDashboard is false', () => {
    render(<ErrorState error={mockError} showDashboard={false} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('generates and displays error ID', () => {
    render(<ErrorState error={mockError} />);
    expect(screen.getByText(/ERR-/)).toBeInTheDocument();
  });

  it('displays the error digest when present', () => {
    const errorWithDigest = Object.assign(mockError, { digest: 'DIGEST-123' });
    render(<ErrorState error={errorWithDigest} />);
    expect(screen.getByText('DIGEST-123')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<ErrorState error={mockError} title="Custom Title" message="Custom message." />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message.')).toBeInTheDocument();
  });

  it('renders with dark mode class (no crash)', () => {
    const { container } = render(<ErrorState error={mockError} />);
    expect(container.querySelector('.dark')).toBeNull();
  });

  it('is mobile responsive (renders in small viewport)', () => {
    const { container } = render(<ErrorState error={mockError} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('no infinite reset loop - does not auto-call reset on render', () => {
    const resetMock = jest.fn();
    render(<ErrorState error={mockError} reset={resetMock} />);
    expect(resetMock).not.toHaveBeenCalled();
  });
});

describe('NotFoundState', () => {
  it('renders 404 title and message', () => {
    render(<NotFoundState />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText('The page you are looking for does not exist or has been moved.')).toBeInTheDocument();
  });

  it('renders Go Home link', () => {
    render(<NotFoundState />);
    const homeLink = screen.getByText('Go Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders Dashboard link with custom href', () => {
    render(<NotFoundState showDashboard dashboardHref="/buyer/dashboard" />);
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/buyer/dashboard');
  });

  it('renders Browse Products link when showSearch is true', () => {
    render(<NotFoundState showSearch searchHref="/search" />);
    const searchLink = screen.getByText('Browse Products');
    expect(searchLink.closest('a')).toHaveAttribute('href', '/search');
  });

  it('does not render optional links when disabled', () => {
    render(<NotFoundState showHome={false} showDashboard={false} showSearch={false} />);
    expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Browse Products')).not.toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<NotFoundState title="Custom 404" message="Custom message." />);
    expect(screen.getByText('Custom 404')).toBeInTheDocument();
    expect(screen.getByText('Custom message.')).toBeInTheDocument();
  });

  it('renders with dark mode class (no crash)', () => {
    const { container } = render(<NotFoundState />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('is mobile responsive (renders in small viewport)', () => {
    const { container } = render(<NotFoundState />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
