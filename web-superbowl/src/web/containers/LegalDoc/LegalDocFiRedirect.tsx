/* istanbul ignore file */
import React from 'react';

const LegalDocFiRedirect = () => {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://privacyportal.onetrust.com/webform/8d9cb670-94ff-4659-969d-6b15fd288fcc/e14fd516-9328-4119-8a34-f78bb21e99f2';
  }
  return (
    <React.Fragment />
  );
};

export default LegalDocFiRedirect;
