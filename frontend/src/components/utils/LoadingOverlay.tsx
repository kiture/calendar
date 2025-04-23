import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAppLoading } from '../../redux/app/app.selectors';

export function LoadingOverlay() {
  const message = useSelector(selectAppLoading);

  const [isVisible, setIsVisible] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (message) {
      setDisplayMessage(message);
      setIsVisible(true);
    } else {
      timeoutIdRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [message]);

  if (!isVisible) {
    return null;
  }

  return (
    // Use a background color with opacity
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex justify-center items-center transition-opacity duration-300 ease-in-out"
      style={{ opacity: isVisible ? 1 : 0 }} // Example using style for opacity transition
    >
      <div className="text-center p-4 rounded bg-base-100 shadow-xl">
        <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
        {/* Display the persisted message */}
        {displayMessage && displayMessage.trim() !== '' && (
          <p className="text-black mt-2 text-lg">{displayMessage}</p>
        )}
      </div>
    </div>
  );
}
