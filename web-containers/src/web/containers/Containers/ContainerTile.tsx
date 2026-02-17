import type { TileOrientation } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { memo } from 'react';
import { Link } from 'react-router';

import TubiOriginal from 'common/components/uilib/SvgLibrary/TubiOriginal';
import type { Container } from 'common/types/container';
import { getContainerUrl } from 'common/utils/urlConstruction';

import styles from './ContainerTile.scss';

export enum ContainerTileType {
  Nomral,
  Channel,
}

export interface ContainerTileProps {
  container: Container;
  isPlainTile?: boolean;
  tileOrientation?: TileOrientation;
  tileType?: ContainerTileType;
  centerTitle?: boolean;
  invisible?: boolean; // for seo, we use display:none for loading more button
}

const ContainerTile: FC<ContainerTileProps> = ({
  container,
  isPlainTile,
  tileOrientation,
  tileType,
  centerTitle,
  invisible = false,
}) => {
  const isChannelTile = tileType === ContainerTileType.Channel;
  const tileClassnames = classNames(styles.containerTile, {
    [styles.portraitTile]: !tileOrientation || tileOrientation === 'portrait',
    [styles.landscapeTile]: tileOrientation === 'landscape',
    [styles.channelTile]: isChannelTile,
    [styles.isPlainTile]: isPlainTile,
    [styles.centerTitle]: centerTitle,
  });
  const url = getContainerUrl(container.id, { type: container.type });
  // we should use logo_center like in ott did
  const channelLogo = (container.logo || '').replace('logo_short', 'logo_center');
  const isTubiOriginalContainer = container.id === 'tubi_originals' || container.id === 'originales_de_tubi';
  return (
    <Link to={url} className={classNames({ [styles.invisibleTile]: invisible })}>
      <div className={tileClassnames} data-test-id="web-container-tile">
        {isChannelTile ? null : (
          <div className={classNames(styles.containerTitle, { [styles.tubiOriginalTitle]: isTubiOriginalContainer })}>
            {isTubiOriginalContainer ? <TubiOriginal /> : container.title}
          </div>
        )}
        {isPlainTile ? null : (
          <div className={styles.containerImageWrapper}>
            {container.thumbnail ? (
              <img className={styles.containerImage} src={container.thumbnail} alt={container.title} />
            ) : null}
            {isChannelTile ? <img className={styles.containerLogo} src={channelLogo} /> : null}
          </div>
        )}
      </div>
    </Link>
  );
};

export default memo(ContainerTile);
