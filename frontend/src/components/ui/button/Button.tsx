import React from 'react';

// Define props for the Button component, extending standard button attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // Make children explicit
  variant?: 'primary' | 'secondary' | 'danger'; // Optional variant prop
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  // Basic styling - you can customize this further
  const baseStyle =
    'font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50';
  let variantStyle = '';

  switch (variant) {
    case 'secondary':
      variantStyle = 'bg-gray-500 hover:bg-gray-700 text-white';
      break;
    case 'danger':
      variantStyle = 'bg-red-500 hover:bg-red-700 text-white';
      break;
    case 'primary':
    default:
      variantStyle = 'bg-blue-500 hover:bg-blue-700 text-white';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className || ''}`}
      {...props} // Spread the rest of the props (like type, onClick, disabled)
    >
      {children}
    </button>
  );
}
