import classNames from 'classnames';
import React from 'react';

import Spinner from 'common/components/uilib/Spinner/Spinner';
import type { LegalAssetState } from 'common/types/legalAsset';

import styles from './LegalAsset.scss';

const removeTitle = (html: string): string => {
  const matches = html.match(/<h1.*>.*<\/h1>/);
  if (matches && matches.length > 0) {
    return html.replace(matches[0], '');
  }
  return html;
};

const removeATag = (html: string): string => html.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '');

// update anchor tags with ATag class like the ATag component
const updateATag = (html: string): string => {
  const aTags = html.match(/<a[^>]*>/g);
  if (aTags && aTags.length > 0) {
    return aTags.reduce(
      (result, aTag) => {
        const newATag = aTag.slice(0, aTag.length - 1).concat('  rel="noopener" target="_self" class="ATag">');
        return result.replace(aTag, newATag);
      },
      html);
  }
  return html;
};

interface Props {
  legalType: string;
  embedded?: boolean;
  mainClassName?: string;
  legalAsset: LegalAssetState;
}

export const LegalAsset = ({ legalType, embedded: noLinks, mainClassName, legalAsset }: Props) => {
  const rawHtml = removeTitle(legalAsset[legalType].html);
  if (!rawHtml) return <Spinner />;

  // we don't use links for the embedded pages
  const html = noLinks ? removeATag(rawHtml) : updateATag(rawHtml);

  return (
    <div className={classNames(styles.mainContent, mainClassName)}>
      <div className={classNames(styles.legalAsset, { [styles.notEmbedded]: !noLinks })} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
