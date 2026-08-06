import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox').className).toContain('custom-class');
  });
});
