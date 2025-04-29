import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAppError } from '../../../redux/app/app.selectors';
import { setAppIdle } from '../../../redux/app/app.reducer';
import { AppDispatch } from '../../../redux/store';

export function ErrorOverlayView(): React.ReactNode {
  const errorMessage = useSelector(selectAppError);
  const dispatch = useDispatch<AppDispatch>();

  const handleDismiss = () => {
    dispatch(setAppIdle());
  };

  if (!errorMessage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(127,29,29,0.5)] z-50 flex justify-center items-center cursor-pointer"
      onClick={handleDismiss}
    >
      <div
        className="text-center p-6 rounded bg-white shadow-xl max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-red-700 mb-3">Error Occurred</h3>
        <p className="text-red-600 mb-4 whitespace-pre-wrap">{errorMessage}</p>
        <p className="text-sm text-gray-500">
          (Click anywhere on the overlay to dismiss)
        </p>
      </div>
    </div>
  );
}
