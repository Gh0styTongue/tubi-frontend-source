import React from 'react';

import GenreTags from 'web/rd/components/ContentDetail/GenreTags/GenreTags';

import styles from '../containers/CreatorLanding/CreatorLanding.scss';

interface CreatorHeroProps {
  name: string;
  avatar?: string;
  genres?: string[];
  description: string;
}

const CreatorHero: React.FC<CreatorHeroProps> = ({
  name,
  avatar,
  genres,
  description,
}) => {
  return (
    <section className={styles.creatorHero}>
      <div className={styles.heroMeta}>
        <div className={styles.heroNameRow}>
          { avatar && <div className={styles.heroAvatarWrapper}>
            <img src={avatar} alt={name} className={styles.heroAvatar} />
          </div>
          }
          <h1 className={styles.heroName}>{name}</h1>
        </div>

        <div className={styles.heroAttributes}>
          <GenreTags tags={genres} />
        </div>

        <p className={styles.heroDescription}>{description}</p>
      </div>
    </section>
  );
};

export default CreatorHero;
