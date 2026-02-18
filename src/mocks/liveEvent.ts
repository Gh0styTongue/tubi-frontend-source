// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import dayjs from 'dayjs';
import { http, HttpResponse, bypass } from 'msw';

import getApiConfig from 'common/apiConfig';
import titleArt from 'common/features/liveEvent/mocks/artTitle.png';
import background from 'common/features/liveEvent/mocks/background.jpg';
import bannerBackground from 'common/features/liveEvent/mocks/bannerBackground.png';
import bannerOTT from 'common/features/liveEvent/mocks/bannerOTT.png';
import channelLogo from 'common/features/liveEvent/mocks/nfl-logo.png';
import { ContainerUiCustomizationType } from 'common/types/container';

import { liveEventContent } from './fixtures/liveEventContent';

const apiConfig = getApiConfig();
const { tensorPrefixV7, epgServicePrefix, cmsPrefixV2 } = apiConfig;

type Phase = 'banner' | '1minBeforeTheGame' | 'live' | '1minBeforeTheEnd' | 'ended';

const phase: Phase = process.env.LIVE_EVENT_PHASE as Phase || 'live';

const mockLiveContent = () => {
  liveEventContent.backgrounds = [background];
  liveEventContent.images.backgrounds = [background];
  liveEventContent.schedule_data.channel_logo = channelLogo;
  liveEventContent.backgrounds = [background];
  liveEventContent.images.title_art = [titleArt];
  liveEventContent.needs_login = true;
  liveEventContent.genres = ['Football'];
};

export const liveEventHandlers = [
  http.get(`${tensorPrefixV7}/homescreen`, async ({ request }) => {
    const response = await fetch(bypass(request));
    const body = await response.json();
    if (body.group_cursor >= 9) {
      return HttpResponse.json(body);
    }

    mockLiveContent();
    if (phase === 'banner') {
      body.containers.splice(2, 0, {
        id: 'live_event_banner',
        children: [liveEventContent.id],
        ui_customization: {
          type: ContainerUiCustomizationType.liveEventBanner,
          style: {
            banner_text_registered: "Don't miss Super Bowl LIX live. Stream it for free on Feb 9 at 6 PM ET. Pregame coverage starts at 11 AM ET.",
            banner_text_guest: 'Register now to stream Super Bowl LIX live and free on February 9 at 6 PM ET. Pregame coverage starts at 11 AM ET.',
            banner_text_unsupported_devices: "Super Bowl LIX isn't available on this device. Scan the QR code for more information or use Apple AirPlay on LG webOS 4.0 and above.",
            background_mobile: 'We should return the correct background image Mobile',
            background_tv: bannerOTT,
            background_tv_behind_banner: bannerBackground,
            unsupported_background_tv: bannerOTT,
          },
        },
      });
    } else {
      body.containers.unshift({
        id: 'live_event',
        children: [liveEventContent.id],
        ui_customization: {
          type: ContainerUiCustomizationType.liveEvent,
        },
      });
    }
    body.contents[liveEventContent.id] = liveEventContent;

    return HttpResponse.json(body);
  }),
  http.get(`${tensorPrefixV7}/containers/top_searched`, async ({ request }) => {
    const response = await fetch(bypass(request));
    const body = await response.json();
    body.container.children.unshift(liveEventContent.id);
    body.contents[liveEventContent.id] = liveEventContent;
    return HttpResponse.json(body);
  }),
  http.get(`${epgServicePrefix}/api/v1/listing/:id`, () => {
    let startTime = dayjs();
    let endTime = dayjs();
    switch (phase) {
      case 'banner':
        startTime = dayjs().add(8, 'days');
        endTime = dayjs().add(9, 'days');
        break;
      case '1minBeforeTheGame':
        startTime = dayjs().add(10, 'second');
        endTime = dayjs().add(1, 'hour');
        break;
      case 'live':
        startTime = dayjs().subtract(1, 'hour');
        endTime = dayjs().add(1, 'hour');
        break;
      case '1minBeforeTheEnd':
        startTime = dayjs().subtract(1, 'hour');
        endTime = dayjs().add(1, 'minute');
        break;
      case 'ended':
        startTime = dayjs().subtract(2, 'minute');
        endTime = dayjs().subtract(1, 'minute');
        break;
      default:
        break;
    }
    return HttpResponse.json({
      end_time: endTime.toISOString(),
      // this is the schedule ID which we should use for the epg endpoint below
      id: liveEventContent.schedule_data.id,
      third_party_id: 'SLXXXXX-XXXX',
      start_time: startTime.toISOString(),
      channel_id: 'FOX_LIVE_EVENTS_CHANNEL_CONTENT_ID',
      content_id: liveEventContent.id,
      player_type: 'fox',
      channel_logo: channelLogo,
    });
  }),
  http.get(`${cmsPrefixV2}/content`, async ({ request }) => {
    const url = new URL(request.url);
    const response = await fetch(bypass(request));
    const body = await response.json();
    const contentId = url.searchParams.get('content_id');
    if (contentId === liveEventContent.id) {
      mockLiveContent();
      return HttpResponse.json(liveEventContent);
    }
    return HttpResponse.json(body);
  }),
];
