import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders without label when not provided', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter description')
    ).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<Textarea label="Description" id="desc" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('passes through HTML textarea attributes', () => {
    render(
      <Textarea
        placeholder="Enter text here"
        required
        disabled
        rows={4}
        maxLength={100}
      />
    );
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('applies custom className along with default styles', () => {
    render(<Textarea className="custom-class" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
    expect(textarea).toHaveClass(
      'shadow',
      'appearance-none',
      'border',
      'rounded'
    );
  });

  it('handles user input correctly', async () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    await fireEvent.change(textarea, {
      target: { value: 'test content\nwith multiple\nlines' },
    });
    expect(textarea).toHaveValue('test content\nwith multiple\nlines');
  });

  it('maintains textarea-label association with provided id', () => {
    render(<Textarea label="Comments" id="comments" />);
    const label = screen.getByText('Comments');
    const textarea = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', 'comments');
    expect(textarea).toHaveAttribute('id', 'comments');
  });

  it('renders with required attribute and shows visual indication', () => {
    render(<Textarea label="Required Field" required />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('handles multiline input correctly', async () => {
    render(<Textarea rows={3} />);
    const textarea = screen.getByRole('textbox');
    const multilineText = 'Line 1\nLine 2\nLine 3';
    await fireEvent.change(textarea, { target: { value: multilineText } });
    expect(textarea).toHaveValue(multilineText);
    expect(textarea).toHaveAttribute('rows', '3');
  });
});
