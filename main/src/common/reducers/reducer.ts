import player from '@adrise/player/lib/reducer';
import { combineReducers } from 'redux';

import auth from 'common/features/authentication/reducers/auth';
import consent from 'common/features/gdpr/reducers/consent';
import linearReminder from 'common/features/linearReminder/reducers/linearReminder';
import live from 'common/features/playback/reducers/live';
import purpleCarpet from 'common/features/purpleCarpet/reducer';
import skinsAd from 'common/features/skinsAd/reducer';
import ottPlayer from 'ott/features/playback/reducers/ottPlayer';
import playerUI from 'ott/features/playback/reducers/playerUI';

import container from './container';
import contentMode from './contentMode';
import epg from './epg';
import experiments from './experiments';
import history from './history';
import legalAsset from './legalAsset';
import queue from './queue';
import reminder from './reminder';
import remoteConfig from './remoteConfig';
import search from './search';
import ui from './ui';
import userReactions from './userReactions';
import userSettings from './userSettings';
import video from './video';

function getOtherReducers() {
  let otherReducers = {};

  if (!__ISOTT__) {
    const captionSettings = require('./webCaptionSettings').default;
    const chromecast = require('web/features/playback/reducers/chromecast').default;
    const fixedBanner = require('web/features/fixedBanner/reducers/fixedBanner').default;
    const person = require('web/features/person/reducers/person').default;
    const pwdReset = require('common/features/authentication/reducers/pwdReset').default;
    const support = require('./support').default;
    const watchSchedule = require('web/features/watchSchedule/reducers/landing').default;
    const webUI = require('./webUI').default;

    otherReducers = {
      captionSettings,
      fixedBanner,
      pwdReset,
      person,
      chromecast,
      player,
      support,
      watchSchedule,
      webUI,
    };
  } else {
    const fire = require('./fire').default;
    const ottUI = require('./ottUI').default;
    const ottSystem = require('./ottSystem').default;
    const a11y = require('./a11y').default;
    const captionSettings = require('./ottCaptionSettings').default;
    const pmr = require('./pmr').default;
    otherReducers = {
      a11y,
      captionSettings,
      fire,
      ottPlayer,
      ottSystem,
      ottUI,
      player,
      playerUI,
      pmr,
    };
  }
  return otherReducers;
}

export const getTopLevelReducer = () =>
  combineReducers({
    auth,
    userReactions,
    userSettings,
    container,
    contentMode,
    video,
    search,
    queue,
    history,
    ui,
    experiments,
    legalAsset,
    live,
    reminder,
    linearReminder,
    epg,
    consent,
    remoteConfig,
    purpleCarpet,
    skinsAd,
    ...getOtherReducers(),
  });
