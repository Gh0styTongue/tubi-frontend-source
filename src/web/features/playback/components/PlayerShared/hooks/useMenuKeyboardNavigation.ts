import { useCallback } from 'react';

export const useKeyboardNavigation = (onClose: () => void, onBack?: () => void) => {
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const menuItems = Array.from(
      e.currentTarget.parentElement?.querySelectorAll('[role="menuitem"]') || []
    );
    const currentIndex = menuItems.indexOf(e.currentTarget);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        (menuItems[nextIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        (menuItems[prevIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        if (onBack) {
          onBack();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).click();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).click();
        break;
      default:
        break;
    }
  }, [onClose, onBack]);

  const handleRadioKeyDown = useCallback((e: React.KeyboardEvent) => {
    const radioItems = Array.from(
      e.currentTarget.parentElement?.querySelectorAll('[role="radio"]') || []
    );
    const currentIndex = radioItems.indexOf(e.currentTarget);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (currentIndex + 1) % radioItems.length;
        (radioItems[nextIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = currentIndex === 0 ? radioItems.length - 1 : currentIndex - 1;
        (radioItems[prevIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        if (onBack) {
          onBack();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).click();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).click();
        break;
      default:
        break;
    }
  }, [onBack]);

  return { handleMenuKeyDown, handleRadioKeyDown };
};
