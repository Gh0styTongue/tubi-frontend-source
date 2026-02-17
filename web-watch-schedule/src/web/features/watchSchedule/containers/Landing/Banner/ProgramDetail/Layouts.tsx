import classNames from 'classnames';
import React from 'react';
import type { ReactNode } from 'react';

import type { Program } from 'web/features/watchSchedule/types/landing';

import ButtonWrapper from './ButtonWrapper';
import ImgWrapper from './ImgWrapper';
import styles from './ProgramDetail.scss';

interface LayoutProps {
  isLive: boolean;
  liveChannelLink: string;
  program: Program;
  programTitle: ReactNode;
  programmingTitle: ReactNode;
}

export const SmallScreenLayout = ({
  isLive,
  liveChannelLink,
  program,
  programTitle,
  programmingTitle,
}: LayoutProps) => {
  const buttonProps = {
    isLive,
    liveChannelLink,
    program,
  };

  return (
    <div data-test-id="banner-small-screen-layout" className={classNames(styles.layout, styles.smallScreen)}>
      <h4>{programmingTitle}</h4>
      <div className={styles.imgAndContent}>
        <ImgWrapper program={program} />
        <div className={styles.content}>
          <p>{programTitle}</p>
        </div>
      </div>
      <p className={styles.desc}>{program.description}</p>
      <ButtonWrapper {...buttonProps} />
    </div>
  );
};

export const SmallMediumScreenLayout = ({
  isLive,
  liveChannelLink,
  program,
  programTitle,
  programmingTitle,
}: LayoutProps) => {
  const buttonProps = {
    isLive,
    liveChannelLink,
    program,
  };

  return (
    <div
      data-test-id="banner-small-medium-screen-layout"
      className={classNames(styles.layout, styles.smallMediumScreen)}
    >
      <div className={styles.imgAndContent}>
        <ImgWrapper program={program} />
        <div className={styles.content}>
          <h4>{programmingTitle}</h4>
          <p>{programTitle}</p>
          <p>{program.description}</p>
        </div>
      </div>
      <ButtonWrapper {...buttonProps} />
    </div>
  );
};

export const LargeScreenLayout = ({
  isLive,
  liveChannelLink,
  program,
  programTitle,
  programmingTitle,
}: LayoutProps) => {
  const buttonProps = {
    isLive,
    liveChannelLink,
    program,
  };

  return (
    <div data-test-id="banner-large-screen-layout" className={styles.layout}>
      <ImgWrapper program={program} />
      <div className={styles.content}>
        <h4>{programmingTitle}</h4>
        <p>{programTitle}</p>
        <p>{program.description}</p>
      </div>
      <ButtonWrapper {...buttonProps} />
    </div>
  );
};
