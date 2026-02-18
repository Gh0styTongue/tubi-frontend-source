import React from 'react';

export default ({ className }: { className?: string }) => {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: '<button is="google-cast-button"/>' }} />
  );
};
