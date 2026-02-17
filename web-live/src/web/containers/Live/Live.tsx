import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Container } from '@tubitv/web-ui';
import hoistNonReactStatics from 'hoist-non-react-statics';
import remove from 'lodash/remove';
import React, { Component } from 'react';
import { Helmet } from 'react-helmet-async';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { loadMoreItems } from 'common/actions/container';
import {
  CONTAINER_TYPES,
  CONTENT_MODES,
  LIVE_NEWS_CONTAINER_ID,
} from 'common/constants/constants';
import { NEWS_TILE_SIZE } from 'common/constants/style-constants';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { getContainerUrl } from 'common/utils/urlConstruction';
import type { FilterProps } from 'web/components/Filter/Filter';
import Filter from 'web/components/Filter/Filter';
import Footer from 'web/components/Footer/Footer';
import { LiveNewsTiles } from 'web/components/TileGroup';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import styles from './Live.scss';

const ALL_CHANNEL_ID = 'all';

export interface LiveProps extends ReturnType<typeof mapStateToProps> {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

const messages = defineMessages({
  newsOnTubi: {
    description: 'page title',
    defaultMessage: 'Live TV',
  },
  pageDesc: {
    description: 'page description',
    defaultMessage: 'News, sports, business, weather, and entertainment at your fingertips.',
  },
  filterBy: {
    description: 'description for filter',
    defaultMessage: 'Filter by',
  },
  metaDescription: {
    description: 'Description for shared content',
    defaultMessage: 'Watch Free Live TV on any device. Tubi offers streaming live news, sports, business, weather, and entertainment you will love.',
  },
  metaTitle: {
    description: 'Title for shared content',
    defaultMessage: 'Watch Free Live TV, Movies and TV Shows Online | Tubi',
  },
});

/**
 * Live container contains a responsive list of live news channels (for now). Split out from Container component because
 * the design specifies a single live news channel per row for mobile screen resolutions.
 */
export class Live extends Component<LiveProps> {
  static hasDynamicMeta = false;

  state = {
    filterIds: [ALL_CHANNEL_ID],
  };

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    // Currently we don;t have too much live new channels
    // so we can load them all at beginning.
    // we may need change this in the future.
    this.loadAllItems();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  loadAllItems() {
    const { containerLoadIdMap } = this.props.contents;
    Object.entries(containerLoadIdMap).forEach(([id, { cursor }]) => {
      if (cursor) {
        this.loadItemsById(id);
      }
    });
  }

  loadItemsById(id: string) {
    const { dispatch, location } = this.props;
    dispatch(loadMoreItems(location, id, undefined, CONTENT_MODES.linear)).then(() => {
      if (this.mounted && this.props.contents.containerLoadIdMap[id]?.cursor) {
        this.loadItemsById(id);
      }
    });
  }

  getMeta = () => {
    const { intl } = this.props;
    const description = intl.formatMessage(messages.metaDescription,);
    const canonical = getCanonicalLink(getContainerUrl(LIVE_NEWS_CONTAINER_ID, { type: CONTAINER_TYPES.LINEAR }));
    const title = intl.formatMessage(messages.newsOnTubi);

    return {
      title: intl.formatMessage(messages.metaTitle),
      description,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'keywords', content: 'Live News, Free Live News, HD Live News' },
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };
  };

  trackCb = (id: string, index: number) => {
    const { contents } = this.props;
    const contentId = contents.containerChildrenIdMap[id][index];
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug: LIVE_NEWS_CONTAINER_ID,
      contentId,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  };

  render() {
    const { intl, contents } = this.props;
    const { filterIds } = this.state;

    const meta = this.getMeta();

    const allCategories = (Object.values(contents.containerIdMap) || []) as {id: string; title: string}[];

    const filterItems = [
      { id: ALL_CHANNEL_ID, content: 'All' },
      ...allCategories.map(({ id, title }) => ({ id, content: title })),
    ];

    const onFilterSelected: FilterProps['onSelected'] = ({ id }) => {
      const { filterIds } = this.state;
      const selected = filterIds.includes(id);
      let newFilterIds = [...filterIds];
      if (id === ALL_CHANNEL_ID) {
        if (!selected) {
          newFilterIds = [ALL_CHANNEL_ID];
        }
      } else {
        if (!selected) {
          newFilterIds = [id];
        } else {
          remove(newFilterIds, (item) => item === id);
        }
        remove(newFilterIds, (item) => item === ALL_CHANNEL_ID);

        if (!newFilterIds.length) {
          newFilterIds = [ALL_CHANNEL_ID];
        }
      }
      this.setState({
        filterIds: newFilterIds,
      });
    };

    const categories = allCategories.filter(({ id }) => filterIds.includes(ALL_CHANNEL_ID) ? true : !!filterIds.find(item => item === id));

    return (
      <div className={styles.live}>
        <Helmet {...meta} />

        <Container className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>{intl.formatMessage(messages.newsOnTubi)}</h2>
            <div className={styles.description}>{intl.formatMessage(messages.pageDesc)}</div>
          </div>
          <div className={styles.filter}>
            <div className={styles.label}>{intl.formatMessage(messages.filterBy)}</div>
            <Filter className={styles.filterItems} items={filterItems} onSelected={onFilterSelected} selectedIds={this.state.filterIds} />
          </div>
          {categories.map(item => {
            const tileProps = {
              contents: contents.containerChildrenIdMap[item.id],
              displayAs: 'grid',
              containerId: item.id,
              trackCb: (index: number) => this.trackCb(item.id, index),
              id: item.id,
              isMobile: this.props.isMobile,
              type: CONTAINER_TYPES.LINEAR,
              ...NEWS_TILE_SIZE,
            } as const;
            return <div key={item.id}>
              <div className={styles.subTitle}>{item.title}</div>
              <LiveNewsTiles {...tileProps} />
            </div>;
          }
          )}
        </Container>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = ({ contentMode, ui: { isMobile } }: StoreState, { location }: WithRouterProps) => {
  return {
    contents: contentMode.linear,
    isMobile,
    location,
  };
};

const connectedComponent = hoistNonReactStatics(withRouter(connect(mapStateToProps)(injectIntl(Live))), Live);

export default connectedComponent;
