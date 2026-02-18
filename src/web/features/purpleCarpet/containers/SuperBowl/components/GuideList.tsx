/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import classNames from 'classnames';
import React from 'react';

import styles from '../SuperBowl.scss';

export interface Guide {
  id: number;
  description: string | React.ReactNode;
  children?: Guide[];
}

interface GuidesListProps {
  title?: string;
  description?: string | React.ReactNode;
  guides: Guide[];
  ordered?: boolean;
  children?: React.ReactNode;
}
const renderGuide = (guide: Guide) => {
  return (
    <li key={guide.id}>
      <p>{guide.description}</p>
      {guide.children && guide.children.length > 0 && <GuideList guides={guide.children} isChild />}
    </li>
  );
};

const GuideList: React.FC<{ guides: Guide[]; ordered?: boolean; isChild?: boolean }> = ({
  guides,
  isChild,
  ordered = false,
}) => {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <ListTag className={classNames(styles.guideListTag, { [styles.noListStyle]: !isChild && guides.length === 1 })}>
      {guides.map((guide) => renderGuide(guide))}
    </ListTag>
  );
};

const GuideContainer: React.FC<GuidesListProps> = ({ guides, title, description, children, ordered = false }) => {
  return (
    <div className={styles.guideContainer}>
      <div className={styles.guideContainerInner}>
        <h2 className={styles.guideTitle}>{title}</h2>
        <GuideList guides={guides} ordered={ordered} />
        {description ? <p className={styles.guideDescription}>{description}</p> : null}
        {children}
      </div>
    </div>
  );
};

export default GuideContainer;
