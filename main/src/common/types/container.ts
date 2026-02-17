import type { FetchState } from '@tubitv/refetch/lib/types';
import type { Response } from 'express';
import type { Location } from 'history';
import type React from 'react';

import type ExperimentManager from 'common/experiments/ExperimentManager';
import type { StoreState } from 'common/types/storeState';

import type { TubiThunkDispatch } from './reduxThunk';
// The following is a starting point, created quickly
// from the initial state for the reducer. As we start
// to use these, we should flesh out the definitions,
// especially for things like {}, unknown, making
// properties optional where necessary, and
// adding "| null" if nullable.
export interface ContainerState extends FetchState {
  /**
   * Ordered home screen container list
   */
  containersList: string[];
  // map ID to container object
  containerIdMap: ContainerIdMap;
  // load status of each container, see discussion
  // https://github.com/adRise/www/pull/100#issuecomment-207938058
  containerLoadIdMap: Record<string, ContainerLoadState>;
  containerChildrenIdMap: Record<string, string[]>;
  // container context, will be set whenever entering container page, cleared whenever leaving video page
  containerContext: string;
  totalCount?: number;
  nextContainerIndexToLoad: number | null;
  sponsorship: SponsorshipState;
  /**
   * Aka "browser list" from Tensor, list of all containers in home page
   * response
   */
  containerMenuList: string[];
  isContainerMenuListLoaded: boolean;
  personalizationId?: string;
}

export interface ContainerLoadState {
  loaded: boolean;
  loading: boolean;
  cursor: number | null;
  ttl?: number | null;
  error?: unknown | null; // Needs a more precise type than 'unknown' when possible
}

export enum ContainerType {
  regular = 'regular',
  complex = 'complex',
  channel = 'channel',
  continue_watching = 'continue_watching',
  history = 'history',
  queue = 'queue',
  linear = 'linear',
  genesis = 'genesis',
}

export enum ContainerChildType {
  content = 'content',
  container = 'container',
}

export interface Container {
  backgrounds?: string[];
  childType: ContainerChildType;
  description: string;
  externalUrl?: string;
  id: string;
  logo?: string;
  parentId?: string;
  slug: string;
  thumbnail?: string | null;
  title: string;
  type: ContainerType;
  tags?: string[];
  sponsorship?: Sponsorship | null;
  cursor?: string | number | null;
  children?: string[];
  valid_duration?: number | null;
  author?: unknown;
}

export interface ContainerIdMap {
  [contId: string]: Container;
}

export interface Sponsorship {
  spon_exp: string;
  brand_name: string;
  image_urls: {
    brand_background: string;
    brand_color: string;
    brand_logo: string;
    brand_graphic: string;
    tile_background: string;
  };
  pixels: SponsorshipPixels;
}

interface SponsorshipPixels {
  homescreen: string[];
  container_list: string[];
  container_details: string[];
}

export type SponsorshipPixelsScreen = keyof SponsorshipPixels;

interface SponsorshipState {
  // Map from container ID to object specifying which of the 3 groups of pixels have been fired
  pixelsFired: Record<string, Partial<Record<SponsorshipPixelsScreen, boolean>>>;
  sponExp?: string;
}

export interface FetchDataParams<T extends Record<string, unknown> = Record<string, unknown>> {
  components: InstanceType<typeof React.PureComponent | typeof React.Component>[];
  deferred?: boolean;
  dispatch: TubiThunkDispatch;
  experimentManager: ReturnType<typeof ExperimentManager>;
  getState: () => StoreState;
  location: Location;
  params: T;
  res?: Response;
}
