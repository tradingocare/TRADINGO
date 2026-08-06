import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="Empty" description="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders action button', () => {
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    render(<EmptyState variant="error" title="Error occurred" />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders loading variant', () => {
    render(<EmptyState variant="loading" title="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
