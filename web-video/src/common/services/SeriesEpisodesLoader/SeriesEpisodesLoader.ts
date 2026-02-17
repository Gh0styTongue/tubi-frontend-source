import { secs } from '@adrise/utils/lib/time';
import { shallowEqual } from 'react-redux';
import type { MarkOptional } from 'ts-essentials';

import { loadEpisodesInSeries } from 'common/actions/video';
import logger from 'common/helpers/logging';
import type { SeriesEpisodesResponse } from 'common/types/series';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';

import type { PromiseResponse, StoreLike, VisibleEpisodes } from './types';
import { FetchStatus } from './types';

type EpisodesBySeason = SeriesEpisodesResponse['episodes_by_season'];

interface EpisodesRange {
  startSeason: number;
  endSeason: number;
  episodeStartIndex: number;
  episodeEndIndex: number;
}

type InternalUrlParams = MarkOptional<EpisodesRange, 'endSeason'>;

const enum PageStatus {
  Pending = 'pending',
  Loading = 'loading',
  Loaded = 'loaded',
}

interface ConstructorParams {
  seriesId: string;
  store: StoreLike;
  numVisibleSeasons: number;
  pageSize: number;
}

interface EpisodeMetadata {
  episodesBySeason: EpisodesBySeason;
  seasonNumbers: number[];
}

interface SeasonPage {
  season: number;
  page: number;
}

interface TryLoadPageParams extends SeasonPage {
  numSeasons?: number;
}

interface AdjacentSeasonsNotLoadedParams {
  allSeasons: number[];
  startSeasonIndex: number;
  numSeasons: number;
  page: number;
}

const RESPONSE_TIMEOUT_MS = secs(5);

export default class SeriesEpisodesLoader {
  seriesId: string;

  pageSize: number = 10;

  numVisibleSeasons: number;

  private storeLike: StoreLike | null;

  private visibleEpisodes: VisibleEpisodes = {
    seasonNumber: 1,
    // The start and end indexes of visible episodes.
    // This is necessary because the two may be on different pages.
    episodeStartIndex: 0,
    episodeEndIndexInclusive: 0,
  };

  private seriesContentId: string = '';

  private unsubscribeFromStore: VoidFunction | null = null;

  private resolveEpisodeMetadata: ((metadata: EpisodeMetadata) => void) | null = null;

  private episodeMetadata = new Promise<EpisodeMetadata>(resolve => {
    this.resolveEpisodeMetadata = resolve;
  });

  // A nested map of seasonNumber => pageNumber => pageStatus (pending, loading or loaded)
  private seasonPagesStatus: Record<number, Record<number, PageStatus>> = {};

  private seasonRangesAreBroken: boolean = false;

  constructor({ seriesId, store, pageSize, numVisibleSeasons }: ConstructorParams) {
    this.seriesId = seriesId;
    this.storeLike = store;
    this.pageSize = pageSize;
    this.numVisibleSeasons = numVisibleSeasons;
    this.seriesContentId = convertSeriesIdToContentId(seriesId);
    this.checkIfMetadataLoaded();
    this.update();
  }

  destroy(): void {
    this.unsubscribeFromStore?.();
    this.unsubscribeFromStore = null;
    this.resolveEpisodeMetadata = null;
    this.storeLike = null;
    this.seasonPagesStatus = {};
    this.seasonRangesAreBroken = false;
  }

  subscribeToStore(): void {
    if (this.storeLike) {
      this.unsubscribeFromStore = this.storeLike?.subscribe(this.checkIfMetadataLoaded.bind(this));
    }
  }

  /**
   * Tell the loader the (inclusive) range of episode indexes currently visible so that any missing pages of data can be fetched.
   * @return Whether the season number or episode indexes changed
   */
  updateVisibleEpisodes(visibleEpisodes: VisibleEpisodes): boolean {
    if (shallowEqual(this.visibleEpisodes, visibleEpisodes)) {
      return false;
    }
    this.visibleEpisodes = visibleEpisodes;
    this.update();
    return true;
  }

  // Called whenever the state changes to update the priorities for fetching other pages of episodes and seasons
  private async update(): Promise<void> {
    const activePages = this.visiblePageIndexes();
    await Promise.all(activePages.map(page => this.tryLoadPage({
      season: this.visibleEpisodes.seasonNumber,
      numSeasons: this.numVisibleSeasons,
      page,
    })));
  }

  private checkIfMetadataLoaded(): boolean {
    if (this.resolveEpisodeMetadata === null) return true; // if we already have the metadata, skip this step
    const metadataFromStore = this.storeLike?.getState().video.byId[this.seriesContentId]?.seasons;
    if (metadataFromStore) {
      const metadata: EpisodeMetadata = metadataFromStore.reduce(
        (meta, { number, episodes }) => {
          return {
            episodesBySeason: {
              ...meta.episodesBySeason,
              [number]: episodes,
            },
            seasonNumbers: meta.seasonNumbers.concat(Number(number)),
          };
        },
        {
          episodesBySeason: {},
          seasonNumbers: [] as number[],
        },
      );
      // sort the season numbers in ascending order, just in case they weren't already like that
      metadata.seasonNumbers.sort((a, b) => a - b);
      this.resolveEpisodeMetadata(metadata);
      this.resolveEpisodeMetadata = null; // so we only do it once
      this.unsubscribeFromStore?.();
      this.unsubscribeFromStore = null;
      return true;
    }
    return false;
  }

  private visiblePageIndexes(): number[] {
    const indexes: number[] = [];
    // Just in case the supplied indexes span more than 2 pages, figure out all the pages we need
    // in between the start and end indexes.
    const { episodeStartIndex: startIndex, episodeEndIndexInclusive: endIndex } = this.visibleEpisodes;
    for (let episodeIndex = startIndex; episodeIndex <= endIndex; episodeIndex++) {
      const index = Math.floor(episodeIndex / this.pageSize);
      if (indexes.indexOf(index) < 0) {
        indexes.push(index);
      }
    }
    return indexes;
  }

  private async tryLoadPage(params: TryLoadPageParams): Promise<void> {
    /* istanbul ignore next */
    if (!this.storeLike) return; // In case this gets called after we call `.destroy()`. It's unlikely, but better safe than sorry.
    const { seasonNumbers: allSeasons } = await this.episodeMetadata;
    const { season, numSeasons = 1, page } = params;
    const seasons = await this.getNSeasonNumbers(season, numSeasons);
    if (seasons.length === 0) return; // if it is an invalid season, then we don't want to bother trying to fetch it

    const loadedSeasons = await this.getLoadedStatusForPageInSeasons(seasons, page);
    if (loadedSeasons.allLoaded) return;

    const episodeStartIndex = page * this.pageSize;
    const episodeEndIndex = (page + 1) * this.pageSize - 1;
    seasons.forEach((season) => {
      if (this.getPageStatus({ season, page }) !== PageStatus.Pending) return;

      const urlParams: InternalUrlParams = {
        startSeason: season,
        episodeStartIndex,
        episodeEndIndex,
      };
      this.setPageStatus({ season, page, status: PageStatus.Loading });
      const startSeasonIndex = allSeasons.indexOf(season);
      const adjacentSeasonsNotFetchedCount = this.countAdjacentSeasonsNotLoaded({
        allSeasons,
        startSeasonIndex,
        page,
        numSeasons,
      });
      for (let i = startSeasonIndex + 1; i <= startSeasonIndex + adjacentSeasonsNotFetchedCount; i++) {
        const adjacentSeason = allSeasons[i];
        // if ranges are known to be not working, just issue individual queries for each season
        if (this.seasonRangesAreBroken) {
          this.tryLoadPage({ season: adjacentSeason, page, numSeasons: 1 });
        } else {
          // mark the adjacent series as loading before we fetch all of them
          this.setPageStatus({ season: adjacentSeason, page, status: PageStatus.Loading });
        }
      }
      if (adjacentSeasonsNotFetchedCount > 0 && !this.seasonRangesAreBroken) {
        urlParams.endSeason = urlParams.startSeason + adjacentSeasonsNotFetchedCount;
      }
      this.fetch(urlParams).then(() => this.checkWhatWasLoaded(urlParams, page));
    });
  }

  private async getNSeasonNumbers(startSeason: number, n: number): Promise<number[]> {
    const { seasonNumbers: allSeasons } = await this.episodeMetadata;
    const startSeasonIndex = allSeasons.indexOf(startSeason);
    if (startSeasonIndex < 0) return [];
    return allSeasons.slice(startSeasonIndex, startSeasonIndex + n); // will only take as many seasons as it can
  }

  private async getLoadedStatusForPageInSeasons(seasons: number[], page: number) {
    const areSeasonsLoaded = await Promise.all(seasons.map(season => this.isPageOfSeasonLoaded({ season, page })));
    const allLoaded = areSeasonsLoaded.every(Boolean);
    const loadedSeasons = areSeasonsLoaded.reduce((acc, isLoaded, index) => {
      return { ...acc, [seasons[index]]: isLoaded };
    }, {} as Record<number, boolean>);
    return {
      ...loadedSeasons,
      allLoaded,
    };
  }

  private async isPageOfSeasonLoaded({ season, page }: SeasonPage): Promise<boolean> {
    if (this.getPageStatus({ season, page }) === PageStatus.Loaded) return true;
    const { episodesBySeason, seasonNumbers: allSeasons } = await this.episodeMetadata;
    const seasonIndex = allSeasons.indexOf(season);
    if (seasonIndex < 0) return true; // if it is an invalid season, then we don't want to bother trying to fetch it
    const seasonEpisodes = episodesBySeason[season];
    if (!seasonEpisodes) return false;
    const episodeStartIndex = page * this.pageSize;
    const episodeEndIndex = Math.min((page + 1) * this.pageSize, seasonEpisodes.length);
    const videoStore = this.storeLike?.getState().video.byId;
    for (let idx = episodeStartIndex; idx < episodeEndIndex; ++idx) {
      if (!videoStore?.[seasonEpisodes[idx].id]) return false;
    }
    this.setPageStatus({ season, page, status: PageStatus.Loaded });
    return true;
  }

  private countAdjacentSeasonsNotLoaded({ allSeasons, startSeasonIndex, numSeasons, page }: AdjacentSeasonsNotLoadedParams): number {
    let adjacentSeasonsNotFetchedCount = 0;
    for (let i = 1; i <= numSeasons - 1; i++) {
      const adjacentSeasonNum: number | undefined = allSeasons[startSeasonIndex + i];
      if (adjacentSeasonNum && this.getPageStatus({ season: adjacentSeasonNum, page }) === PageStatus.Pending) {
        adjacentSeasonsNotFetchedCount++;
      }
    }
    return adjacentSeasonsNotFetchedCount;
  }

  private getPageStatus({ season, page }: SeasonPage): PageStatus {
    if (!this.seasonPagesStatus[season]) return PageStatus.Pending;
    return this.seasonPagesStatus[season][page] ?? PageStatus.Pending;
  }

  private setPageStatus({ season, page, status }: SeasonPage & { status: PageStatus }): void {
    if (!this.seasonPagesStatus[season]) {
      this.seasonPagesStatus[season] = { [page]: status };
    } else {
      this.seasonPagesStatus[season][page] = status;
    }
  }

  private async checkWhatWasLoaded(urlParams: InternalUrlParams, page: number) {
    if (!this.checkIfMetadataLoaded()) return;
    // Double-check that episodes were loaded from all pages requested.
    // If not, mark that page as being not loaded yet, so we can try again.
    // This can happen if the support for season ranges is broken, as it has been frequently during development.
    const { seasonNumbers } = await this.episodeMetadata;
    const startSeasonIndex = seasonNumbers.indexOf(urlParams.startSeason);
    const numSeasonsFetched = (urlParams.endSeason ?? urlParams.startSeason) - urlParams.startSeason + 1;
    const seasonsFetched = seasonNumbers.slice(startSeasonIndex, startSeasonIndex + numSeasonsFetched);
    /* eslint-disable no-await-in-loop */
    for (const season of seasonsFetched) {
      if (!await this.isPageOfSeasonLoaded({ season, page })) {
        this.setPageStatus({ season, page, status: PageStatus.Pending });
        if (numSeasonsFetched > 1) {
          // mark ranges as broken and try again to fetch the same page, but for a single season this time
          this.seasonRangesAreBroken = true;
          await this.tryLoadPage({ season, page });
        }
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  fetch(params: InternalUrlParams): Promise<PromiseResponse<void>> {
    if (!this.storeLike) return Promise.resolve({ status: FetchStatus.Error });
    const { startSeason, endSeason = startSeason, episodeStartIndex, episodeEndIndex } = params;
    const numEpisodes = episodeEndIndex - episodeStartIndex + 1;
    const thisPage = Math.floor(episodeStartIndex / numEpisodes);
    const action = loadEpisodesInSeries({
      seriesId: this.seriesId,
      season: startSeason === endSeason ? startSeason : `${startSeason}-${endSeason}`,
      page: thisPage + 1,
      size: numEpisodes,
      force: true, // otherwise it won't fetch the episodes. needs to be fixed later.
    });
    const fetchPromise = this.storeLike.dispatch(action)
      .then(() => {
        return {
          status: FetchStatus.Success,
        };
      }).catch((err) => {
        logger.error(err, `Error fetching episodes in series ${this.seriesId} for seasons ${startSeason}-${endSeason}, episode indexes ${episodeStartIndex}-${episodeEndIndex}.`);
        return {
          status: FetchStatus.Error,
        };
      });
    const timeoutPromise = new Promise<PromiseResponse<void>>(resolve => {
      setTimeout(() => {
        resolve({ status: FetchStatus.Timeout });
      }, RESPONSE_TIMEOUT_MS);
    });
    return Promise.race([fetchPromise, timeoutPromise]);
  }
}
