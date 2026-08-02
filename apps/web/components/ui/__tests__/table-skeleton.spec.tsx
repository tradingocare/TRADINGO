import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { TableSkeleton } from '@/components/dashboard/skeleton';

describe('TableSkeleton', () => {
  it('renders default rows', () => {
    render(<TableSkeleton />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders custom row count', () => {
    render(<TableSkeleton rows={3} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with custom rows', () => {
    render(<TableSkeleton rows={2} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
