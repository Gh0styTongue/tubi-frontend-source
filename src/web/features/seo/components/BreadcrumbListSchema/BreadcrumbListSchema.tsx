/* istanbul ignore file */
import React, { useMemo } from 'react';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

interface BreadcrumbItem {
  position: number;
  name: string;
  item: string;
}

interface BreadcrumbListConfig {
  id: string;
  items: BreadcrumbItem[];
}

const genJsonLd = (config: BreadcrumbListConfig) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': config.id,
  'itemListElement': config.items.map((it) => ({
    '@type': 'ListItem',
    'position': it.position,
    'name': it.name,
    'item': it.item,
  })),
});

interface BreadcrumbListSchemaProps {
  config: BreadcrumbListConfig;
}

const BreadcrumbListSchema: React.FC<BreadcrumbListSchemaProps> = ({ config }) => {
  const jsonLd = useMemo(() => genJsonLd(config), [config]);
  return <JsonLdScript jsonLd={jsonLd as any} />;
};

export default BreadcrumbListSchema;

