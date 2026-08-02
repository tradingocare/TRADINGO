import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

describe('UI Component Integration', () => {
  it('Button responds to click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Clickable</Button>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Button renders disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('Badge renders with children', () => {
    render(<Badge variant="default">With Text</Badge>);
    expect(screen.getByText('With Text')).toBeInTheDocument();
  });

  it('Card composes with header and content', () => {
    render(
      <Card>
        <CardHeader><CardTitle>Card Title</CardTitle></CardHeader>
        <CardContent>Card content here</CardContent>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content here')).toBeInTheDocument();
  });

  it('Card with Footer renders footer content', () => {
    render(
      <Card>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
