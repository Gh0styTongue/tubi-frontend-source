import { useCallback, useEffect, useState } from 'react';

export default function useDocumentVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const handleVisibilityChange = useCallback(() => {
    setIsVisible(!document.hidden);
  }, []);
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return isVisible;
}
