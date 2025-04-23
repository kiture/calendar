import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAppError } from '../../redux/app/app.selectors'; // Corrected selector name
import { setAppIdle } from '../../redux/app/app.reducer';
import { AppDispatch } from '../../redux/store';

export function ErrorOverlay(): React.ReactNode { // Explicit return type
  const errorMessage = useSelector(selectAppError);
  const dispatch = useDispatch<AppDispatch>();

  const handleDismiss = () => {
    dispatch(setAppIdle());
  };

  // If there is no error message, render nothing
  if (!errorMessage) {
    return null;
  }

  return (
    // Full-screen overlay, click anywhere to dismiss
    <div 
      className="fixed inset-0 bg-[rgba(127,29,29,0.5)] z-50 flex justify-center items-center cursor-pointer"
      onClick={handleDismiss} // Dismiss on click
    >
      <div 
        className="text-center p-6 rounded bg-white shadow-xl max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // Prevent click inside the box from closing it
      >
        <h3 className="text-xl font-bold text-red-700 mb-3">Error Occurred</h3>
        {/* Display the error message */}
        <p className="text-red-600 mb-4 whitespace-pre-wrap">{errorMessage}</p>
        <p className="text-sm text-gray-500">(Click anywhere on the overlay to dismiss)</p>
      </div>
    </div>
  );
} 