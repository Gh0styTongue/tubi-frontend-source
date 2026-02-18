import type { SyntheticEvent } from 'react';

import { doesWindowObjectExist } from 'client/utils/clientTools';

declare global {
  interface Window {
    sierraConfig: {
      display: 'corner';
      variables?: {
        country?: string;
        postal?: string;
        city?: string;
        state?: string;
      };
    };
    sierra: {
      openChatModal: () => void;
      closeChatModal: () => void;
    };
  }
}

export const SIERRA_CHAT_BUTTON_ID = 'sierraChatButton';

const sierraTubiToken = __SIERRA_TOKEN__;

export const loadSierraChatConfig = (geoData?: GeoData) => {
  if (doesWindowObjectExist()) {
    // https://tubi.sierra.ai/documentation/integrations/experience-sdk/web#configuration-options
    window.sierraConfig = {
      display: 'corner',
      variables: {
        country: geoData?.country || '',
        postal: geoData?.postalCode || '',
        city: geoData?.city || '',
        state: geoData?.state || '',
      },
    };
  }
};

export const showSierraChatButton = () => {
  if (doesWindowObjectExist() && window.sierra) {
    const sierraChatButton = document.getElementById(SIERRA_CHAT_BUTTON_ID);
    if (sierraChatButton) {
      sierraChatButton.style.display = 'block';
    }
  }
};

type GeoData = {
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export const loadSierraChatScript = (geoData?: GeoData) => {
  if (doesWindowObjectExist() && !window.sierra && !document.getElementById('sierraScript')) {
    loadSierraChatConfig(geoData);
    const sierraScript = document.createElement('script');
    sierraScript.id = 'sierraScript';
    sierraScript.type = 'module';
    sierraScript.src = `https://sierra.chat/agent/${sierraTubiToken}/embed`;
    document.head.appendChild(sierraScript);
    sierraScript.onload = () => {
      // show the sierra chat button
      showSierraChatButton();
    };
  }
};

export const handleChatBotClick = (e: SyntheticEvent) => {
  e.stopPropagation();
  e.preventDefault();
  if (doesWindowObjectExist() && window.sierra) {
    window.sierra.openChatModal();
  }
};

export const closeChatBot = () => {
  if (doesWindowObjectExist() && window.sierra) {
    window.sierra.closeChatModal();
  }
};
