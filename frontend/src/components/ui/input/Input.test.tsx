import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders without label when not provided', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input type="email" placeholder="test@example.com" required disabled />
    );
    const input = screen.getByPlaceholderText('test@example.com');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });

  it('applies custom className along with default styles', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
    expect(input).toHaveClass('shadow', 'appearance-none', 'border', 'rounded');
  });

  it('handles user input correctly', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    await fireEvent.change(input, { target: { value: 'test input' } });
    expect(input).toHaveValue('test input');
  });

  it('maintains input-label association with provided id', () => {
    render(<Input label="Username" id="username" />);
    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', 'username');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('renders with required attribute and shows visual indication', () => {
    render(<Input label="Required Field" required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });
});
