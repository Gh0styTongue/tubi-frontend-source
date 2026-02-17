import { Container, HeroBackground } from '@tubitv/web-ui';
import React, { Component } from 'react';

import { addEventListener, removeEventListener } from 'common/utils/dom';
import RefreshChannelDetails from 'web/rd/components/ChannelDetails/ChannelDetails';
import RefreshFluidGrid from 'web/rd/components/FluidGrid/FluidGrid';

import styles from './WebChannel.scss';

type WebChannelProps = {
  title: string;
  items: any[];
  description: string;
  id: string;
  trackCb: (idx: number, id: string) => void;
  backgroundImage: string;
  logo?: string;
};
type WebChannelState = {
  showShareMenu: boolean,
};
class WebChannel extends Component<WebChannelProps, WebChannelState> {
  constructor(props: WebChannelProps) {
    super(props);
    this.state = {
      showShareMenu: false,
    };
  }

  componentDidMount() {
    addEventListener(window, 'click', this.hideShare);
  }

  componentWillUnmount() {
    removeEventListener(window, 'click', this.hideShare);
  }

  showShare = () => this.setState({ showShareMenu: true });

  hideShare = () => this.setState({ showShareMenu: false });

  onShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (this.state.showShareMenu) {
      this.hideShare();
    } else {
      this.showShare();
    }
  };

  render() {
    const {
      title,
      items,
      description,
      id,
      trackCb,
      backgroundImage,
      logo = '',
    } = this.props;

    return (
      <div className={styles.webChannel}>
        <div className={styles.bgWrapper}>
          <HeroBackground
            src={backgroundImage}
            className={styles.refreshBackground}
          />
        </div>
        <Container className={styles.channelContent}>
          <RefreshChannelDetails
            title={title}
            channelId={id}
            description={description}
            logo={logo}
          />
          <RefreshFluidGrid
            contentIds={items}
            trackCb={trackCb}
          />
        </Container>
      </div>
    );
  }
}
export default WebChannel;
