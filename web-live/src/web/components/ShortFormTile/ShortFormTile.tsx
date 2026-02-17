import { toCSSUrl } from '@adrise/utils/lib/url';
import { Col } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import PlayButtonEmpty from 'common/components/uilib/PlayButtonEmpty/PlayButtonEmpty';
import { TILE_BACKGROUND_COLOR } from 'common/constants/style-constants';
import type { WebStoreState } from 'common/types/storeState';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import styles from './ShortFormTile.scss';

interface ShortFormTileProps {
  id: string;
  // shortForm title
  title: string;
  // image url
  image: string;
  // url to send to on click
  to: string;
  hostCls?: string;
  trackCb: (index: number, id: string) => void;
  // lazy load active status
  lazyActive?: boolean;
  // Col size
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
  idx?: number;
}

class ShortFormTile extends Component<ShortFormTileProps> {
  static defaultProps = {
    lazyActive: true,
  };

  handleClick = () => {
    const { trackCb, to, idx = 0 } = this.props;
    if (trackCb) {
      trackCb(idx, to);
    }
  };

  render() {
    const { image, title, to, hostCls, lazyActive, xs, sm, md, lg, xl, xxl } = this.props;
    // hostCls is provided by GetPage
    const outerCls = classNames(hostCls, styles.shortFormTile);
    const imageStyle = lazyActive ? {
      backgroundImage: toCSSUrl(image),
    } : {
      backgroundColor: TILE_BACKGROUND_COLOR,
    };
    const tileSize = { xs, sm, md, lg, xl, xxl };

    return (
      <Col className={outerCls} {...tileSize}>
        <Link to={to} onClick={this.handleClick}>
          <div className={styles.image} style={imageStyle}>
            <div className={styles.overlay}>
              <PlayButtonEmpty />
            </div>
          </div>
          <div className={styles.text}>{title}</div>
        </Link>
      </Col>
    );
  }
}

const mapStateToProps = ({ video }: WebStoreState, { id }: { id: string }) => {
  const clipData = video.byId[id];
  if (!clipData) {
    return {
      title: '',
      image: '',
      to: '',
    };
  }
  const { title, thumbnails: images = [] } = clipData;

  const to = getUrlByVideo({ video: clipData });

  return {
    title,
    image: images[0],
    to,
  };
};
export default connect(mapStateToProps)(ShortFormTile);
