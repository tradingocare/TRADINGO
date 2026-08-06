import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Card className="custom-class">Test</Card>);
    expect(screen.getByText('Test').className).toContain('custom-class');
  });
});
