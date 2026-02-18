import { useEffect } from 'react';

import { closeChatBot, showSierraChatButton } from 'web/containers/HelpCenter/SierraChatClient/SierraChatUtils';

export const useSierraChat = (isCxChatbotEnabled: boolean) => {
  useEffect(() => {
    if (isCxChatbotEnabled) {
      showSierraChatButton();
    }
    return () => {
      if (isCxChatbotEnabled) {
        closeChatBot();
      }
    };
  }, [isCxChatbotEnabled]);
};
