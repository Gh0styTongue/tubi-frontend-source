import React, { useMemo } from 'react';
import type { WithContext, FAQPage } from 'schema-dts';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

export interface FaqPageItem {
  question: string;
  answer: string;
}

// https://developers.google.com/search/docs/appearance/structured-data/faqpage
export const genJsonLd = (items: FaqPageItem[]): WithContext<FAQPage> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(({ question, answer }) => ({
      '@type': 'Question',
      'name': question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': answer,
      },
    })),
  };
};

interface Props {
  items: FaqPageItem[];
}

const FaqPageSchema = ({ items }: Props) => {
  const jsonLd = useMemo(() => genJsonLd(items), [items]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default FaqPageSchema;
