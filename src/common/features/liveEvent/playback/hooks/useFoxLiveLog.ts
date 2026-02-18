import { useState, useEffect, useCallback, useRef } from 'react';

import { getOTTRemote, isOTTKeys } from 'common/utils/keymap';

const REQUIRED_SEQUENCE_LENGTH = 10; // 5 pairs of left-right
const REMOTE = getOTTRemote();

export const useAlternateKeyPattern = (onPatternComplete: () => void) => {
  const [_, setKeySequence] = useState<number[]>([]);
  const lastKeyRef = useRef<number | null>(null);

  const isValidSequence = (sequence: number[]): boolean => {
    if (sequence.length !== REQUIRED_SEQUENCE_LENGTH) return false;

    // Check if keys alternate between left and right
    for (let i = 0; i < sequence.length; i++) {
      const expectedKey = i % 2 === 0 ? REMOTE.arrowLeft : REMOTE.arrowRight;
      if (sequence[i] !== expectedKey) return false;
    }
    return true;
  };

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isOTTKeys(e.keyCode)) return;

      const currentKey = e.keyCode;

      // Only track left and right arrow keys
      if (currentKey !== REMOTE.arrowLeft && currentKey !== REMOTE.arrowRight) {
        setKeySequence([]);
        lastKeyRef.current = null;
        return;
      }

      // Reset if same key pressed twice
      if (currentKey === lastKeyRef.current) {
        setKeySequence([]);
        lastKeyRef.current = null;
        return;
      }

      setKeySequence(prev => {
        const newSequence = [...prev, currentKey];

        // Check if sequence matches pattern
        if (isValidSequence(newSequence)) {
          onPatternComplete();
          return [];
        }

        // Keep only the last REQUIRED_SEQUENCE_LENGTH keys
        return newSequence.slice(-REQUIRED_SEQUENCE_LENGTH);
      });

      lastKeyRef.current = currentKey;
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPatternComplete]);
};

const useFoxLiveLog = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const latestLogRef = useRef<{ message: string; count: number } | null>(null);

  useAlternateKeyPattern(() => {
    setIsVisible(prev => !prev);
  });

  const addLog = useCallback((message: string) => {
    const performanceTime = (performance.now() / 1000).toFixed(2);
    const timeStampedMessage = `[${performanceTime}s] ${message}`;

    setLogs((prevLogs) => {
      // Check if message is the same as latest
      if (latestLogRef.current?.message === message) {
        // Increment count
        latestLogRef.current.count += 1;
        const countSuffix = ` (${latestLogRef.current.count}x)`;

        // Update last log entry with new count
        const newLogs = [...prevLogs];
        newLogs[newLogs.length - 1] = `[${performanceTime}s] ${message}${countSuffix}`;
        return newLogs;
      }

      // New unique message
      latestLogRef.current = { message, count: 1 };
      const newLogs = [...prevLogs, timeStampedMessage];
      return newLogs.length > 20 ? newLogs.slice(-20) : newLogs;
    });
  }, []);

  useEffect(() => {
    if (isVisible) {
      const logPanel = document.createElement('div');
      logPanel.style.position = 'fixed';
      logPanel.style.padding = '8px';
      logPanel.style.fontSize = '14px';
      logPanel.style.top = '0';
      logPanel.style.right = '0';
      logPanel.style.width = '30vw';
      logPanel.style.height = '50vh';
      logPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      logPanel.style.color = 'white';
      logPanel.style.overflowY = 'auto';
      logPanel.style.zIndex = '1000';
      logPanel.id = 'fox-live-log-panel';

      logs.forEach((log) => {
        const logItem = document.createElement('div');
        logItem.style.height = '5%';
        logItem.textContent = log;
        logPanel.appendChild(logItem);
      });

      document.body.appendChild(logPanel);

      return () => {
        document.body.removeChild(logPanel);
      };
    }
  }, [isVisible, logs]);

  return { addLog };
};

export default useFoxLiveLog;
