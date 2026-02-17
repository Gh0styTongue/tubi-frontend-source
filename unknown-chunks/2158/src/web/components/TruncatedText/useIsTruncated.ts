import { useState, useEffect } from 'react';

const useIsTruncated = (ref: React.MutableRefObject<HTMLElement | null>) => {
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current as HTMLElement | null;

    if (!el) {
      return;
    }

    // The condition origins from https://codepen.io/cupnoodle/pen/powvObw
    if (el.offsetHeight < el.scrollHeight || el.offsetWidth < el.scrollWidth) {
      setIsTruncated(true);
    }
  }, [ref]);

  return isTruncated;
};

export default useIsTruncated;
