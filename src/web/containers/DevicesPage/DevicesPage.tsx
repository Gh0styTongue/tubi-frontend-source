import { createGetChildRef, createRefMapRef } from '@adrise/utils/lib/useRefMap';
import { Col, Container, Row, ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { Component } from 'react';
import { Helmet } from 'react-helmet-async';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl, defineMessages } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import AmazonFireIcon from 'common/components/uilib/SvgLibrary/AmazonFireIcon';
import AndroidIcon from 'common/components/uilib/SvgLibrary/AndroidIcon';
import AndroidManIcon from 'common/components/uilib/SvgLibrary/AndroidManIcon';
import AppleIcon from 'common/components/uilib/SvgLibrary/AppleIcon';
import AppleTVIcon from 'common/components/uilib/SvgLibrary/AppleTVIcon';
import AppStoreBadge from 'common/components/uilib/SvgLibrary/AppStoreBadge';
import ChromecastIcon from 'common/components/uilib/SvgLibrary/ChromecastIcon';
import CoxIcon from 'common/components/uilib/SvgLibrary/CoxIcon';
import GooglePlayBadge from 'common/components/uilib/SvgLibrary/GooglePlayBadge';
import GoogleTVIcon from 'common/components/uilib/SvgLibrary/GoogleTVIcon';
import HisenseIcon from 'common/components/uilib/SvgLibrary/HisenseIcon';
import LGTVIcon from 'common/components/uilib/SvgLibrary/LGTVIcon';
import Playstation from 'common/components/uilib/SvgLibrary/Playstation';
import RokuIcon from 'common/components/uilib/SvgLibrary/RokuIcon';
import SamsungIcon from 'common/components/uilib/SvgLibrary/SamsungIcon';
import SonyIcon from 'common/components/uilib/SvgLibrary/SonyIcon';
import TivoIcon from 'common/components/uilib/SvgLibrary/TivoIcon';
import VizioIcon from 'common/components/uilib/SvgLibrary/VizioIcon';
import WebAndDesktopIcon from 'common/components/uilib/SvgLibrary/WebAndDesktopIcon';
import WindowsIcon from 'common/components/uilib/SvgLibrary/WindowsIcon';
import XboxIcon from 'common/components/uilib/SvgLibrary/XboxIcon';
import XfinityIcon from 'common/components/uilib/SvgLibrary/XfinityIcon';
import Device from 'web/components/Device/Device';
import Footer from 'web/components/Footer/Footer';
import Navbar from 'web/components/Navbar/Navbar';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import styles from './DevicesPage.scss';

const pageTransitions = {
  enter: styles.pageEnter,
  enterActive: styles.pageEnterActive,
};

export const messages = defineMessages({
  streamingDevices: {
    description: 'supported device page navigation link',
    defaultMessage: 'STREAMING DEVICES',
  },
  smartTvs: {
    description: 'supported device page navigation link',
    defaultMessage: 'SMART TVs',
  },
  mobileTablet: {
    description: 'supported device page navigation link',
    defaultMessage: 'MOBILE & TABLET',
  },
  webDesktop: {
    description: 'supported device page navigation link',
    defaultMessage: 'WEB & DESKTOP',
  },
  rokuText: {
    description: 'device installation instructions',
    defaultMessage:
      'You can directly install the latest version of the Tubi channel to your Roku player from Roku’s Channel Store.',
  },
  rokuReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Firmware 7.7.',
  },
  tvOsText: {
    description: 'device installation instructions',
    defaultMessage:
      'The easiest way to install the Tubi channel to your Apple TV is to search for it in your homescreen and follow the installation instructions.',
  },
  tvOsReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Apple TV (4th Generation)',
  },
  amazonText: {
    description: 'device installation instructions',
    defaultMessage:
      'You can directly install the latest version of the Tubi channel to your Amazon Fire TV player from Amazon’s Appstore.',
  },
  amazonReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Software version 5.2.1.0_user_550144920',
  },
  xboxText: {
    description: 'device installation instructions',
    defaultMessage:
      'The easiest way to install the Tubi app to your Xbox is to search for it in under the Store tab and follow the installation instructions.',
  },
  xboxReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Available in US only',
  },
  psText: {
    description: 'device installation instructions',
    defaultMessage:
      'The easiest way to install the Tubi app on your PlayStation is to search for it in the PlayStation Store.',
  },
  psReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Available in US, Canada and Latin America only',
  },
  chromecastText: {
    description: 'device installation instructions',
    defaultMessage: 'To use Chromecast from your iOS or Android device, click the link below.',
  },
  chromecastReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Available in US, Canada and Latin America only',
  },
  googletvText: {
    description: 'device installation instructions',
    defaultMessage: 'You can directly install the latest version of the Tubi app to your Google TV from the Google Play Store.',
  },
  googletvReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Software version 8.0',
  },
  tivoText: {
    description: 'device installation instructions',
    defaultMessage: 'Tubi comes preloaded on TiVO devices. Select Apps from TiVO Central, and scroll down the list.',
  },
  tivoReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Available in US, Canada and Latin America only',
  },
  androidtvText: {
    description: 'device installation instructions',
    defaultMessage:
      'You can directly install the latest version of the Tubi app to your Android TV device from the Google Play Store on Android TV.',
  },
  androidtvReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Android TV devices running Android 4.1 or above',
  },
  xfinityText: {
    description: 'device installation instructions',
    defaultMessage: 'Find Tubi in the Apps section of your Xfinity X1 device.',
  },
  coxText: {
    description: 'device installation instructions',
    defaultMessage: 'Find Tubi in the Apps section of your Contour device.',
  },
  samsungText: {
    description: 'device hardware/software requirements',
    defaultMessage:
      'The easiest way to install the Tubi app to your Samsung Smart TV is to access Smart Hub and select Apps. Then search for Tubi and follow installation instructions.',
  },
  samsungReq: {
    description: 'device installation instructions',
    defaultMessage: 'Firmware version 7.1',
  },
  sonyText: {
    description: 'device installation instructions',
    defaultMessage:
      'The easiest way to access the Tubi app on your Sony TV is to find the app featured on your home screen.',
  },
  sonyReq: {
    description: 'device hardware/software requirements, anchor tag (website link)',
    defaultMessage: 'Requirements',
  },
  vizioText: {
    description: 'device installation instructions',
    defaultMessage:
      'The easiest way to access the Tubi app on your VIZIO SmartCast™ TV is to scroll through the app row on the home screen.',
  },
  lgtvText: {
    description: 'device installation instructions for LG TV',
    defaultMessage:
      'The easiest way to access the Tubi app on your LG TV is to scroll through the app row on the home screen.',
  },
  hisenseText: {
    description: 'device installation instructions for Hisense',
    defaultMessage:
      'The easiest way to access the Tubi app on your Hisense TV is to scroll through the app row on the home screen.',
  },
  iosText: {
    description: 'device installation instructions',
    defaultMessage: 'Get the latest version of the Tubi iOS app for your iPad or iPhone from the App Store.',
  },
  iosReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'iPhone 5s or iPad 5th gen, running iOS 11 or above',
  },
  androidText: {
    description: 'device installation instructions',
    defaultMessage: 'Get the latest version of the Tubi Android app for your Android Devices from Google Play.',
  },
  androidReq: {
    description: 'device hardware/software requirements',
    defaultMessage: 'Android devices running Android 5 or above.',
  },
  webText: {
    description: 'device installation instructions',
    defaultMessage: 'You can directly watch Tubi Movies & TV Shows on your desktop or laptop.',
  },
  webReq: {
    description: 'device hardware/software requirements',
    defaultMessage:
      'Google Chrome version 70 or later on Windows 7 or later, Mac OS X 10.10 or later, or Linux; Mozilla Firefox version 70 or later on Windows 7 or later, Mac OS X 10.10 or later, or Linux; Safari version 10 or later on Mac OS X 10.10 or later; Microsoft Edge version 12 or later',
  },
  windowsText: {
    description: 'device installation instructions for Windows',
    defaultMessage:
      'Get the latest version of Tubi for Windows 2-in-1 laptops and tablet computers in the Microsoft Store.',
  },
  metaDescription: {
    description: 'description of the device support page for SEO purposes',
    defaultMessage:
      'Watch thousands of free movies and TV shows anywhere on every device with Tubi. Find apps for Chromecast, xbox, Amazon FireTV, mobile, Roku and more.',
  },
  metaTitle: {
    description: 'title of the device support page for SEO purposes',
    defaultMessage: 'Watch Free Movies & TV on Mobile, Chromecast, Roku & More | Tubi',
  },
  metaKeywords: {
    description: 'keywords for the device support page for SEO purposes',
    defaultMessage: 'Free, Movies, TV shows, legal, streaming, HD, full length, full movie',
  },
});

interface OwnProps {
  location: { query?: { device: string } };
}

interface OwnState {
  mainRoutesIdx: number;
  subRoutesIdx: number;
}

type DevicesPageProps = OwnProps & WrappedComponentProps & WithRouterProps;

export class DevicesPage extends Component<DevicesPageProps, OwnState> {
  private mainNav: { key: string, element: string, path: string }[];

  private devices: { title: string | JSX.Element, deviceHeader?: JSX.Element, downloadBadge?: JSX.Element, href?: string, key: string, element: JSX.Element, text: string | JSX.Element, requirements?: string, imageUrl: string, path: string }[][];

  private deviceNodeRefMap = createRefMapRef<HTMLDivElement | null>();

  private getDeviceNodeRef = createGetChildRef(this.deviceNodeRefMap, null);

  constructor(props: DevicesPageProps) {
    super(props);
    const { intl } = this.props;
    this.mainNav = [
      {
        key: 'STREAMING DEVICES',
        element: intl.formatMessage(messages.streamingDevices),
        path: '/static/devices',
      },
      {
        key: 'SMART TVs',
        element: intl.formatMessage(messages.smartTvs),
        path: '/static/devices?device=samsung',
      },
      {
        key: 'MOBILE & TABLET',
        element: intl.formatMessage(messages.mobileTablet),
        path: '/static/devices?device=ios',
      },
      {
        key: 'WEB & DESKTOP',
        element: intl.formatMessage(messages.webDesktop),
        path: '/static/devices?device=web',
      },
    ];
    /**
     * DEVICES: iOS, Android, Web, ROKU, tVOS, AMAZON FIRE TV, PLAYSTATION 4, XBOX ONE, XBOX 360, SAMSUNG TV, TiVO, Chromecast, VIZIO
     * device must have: 'title', 'element', 'image', and 'text'
     * optional fields: 'href', 'requirements'
     */
    this.devices = [
      [
        {
          title: 'Roku',
          key: 'roku',
          element: <RokuIcon className={styles.icon} />,
          text: intl.formatMessage(messages.rokuText),
          requirements: intl.formatMessage(messages.rokuReq),
          href: 'https://channelstore.roku.com/details/41468/tubi-tv',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/roku-repaint.png',
          path: '/static/devices?device=roku',
        },
        {
          title: 'tvOS',
          key: 'tvos',
          element: <AppleTVIcon className={styles.icon} />,
          text: intl.formatMessage(messages.tvOsText),
          requirements: intl.formatMessage(messages.tvOsReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/appletv-repaint.png',
          path: '/static/devices?device=tvos',
        },
        {
          title: 'Amazon Fire TV',
          key: 'amazon',
          element: <AmazonFireIcon className={styles.icon} />,
          text: intl.formatMessage(messages.amazonText),
          requirements: intl.formatMessage(messages.amazonReq),
          href: 'https://www.amazon.com/Tubi-Inc/dp/B075NTHVJW',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/amazontv-repaint.png',
          path: '/static/devices?device=amazon',
        },
        {
          // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for device name
          title: <div>Xbox One & Xbox Series X</div>,
          key: 'xbox',
          element: <XboxIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.xboxText),
          requirements: intl.formatMessage(messages.xboxReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/xbox-series-x-repaint.png',
          path: '/static/devices?device=xbox',
        },
        {
          // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for device name
          title: <div>Playstation 4 & Playstation 5</div>,
          key: 'playstation',
          element: <Playstation className={styles.icon} />,
          text: intl.formatMessage(messages.psText),
          requirements: intl.formatMessage(messages.psReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/playstation5-repaint.png',
          path: '/static/devices?device=playstation',
        },
        {
          title: 'Google TV',
          key: 'googletv',
          element: <GoogleTVIcon className={styles.iconWidest} />,
          text: intl.formatMessage(messages.googletvText),
          requirements: intl.formatMessage(messages.googletvReq),
          href: 'https://play.google.com/store/apps/details?id=com.tubitv',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/chromecast-repaint.png',
          path: '/static/devices?device=googletv',
        },
        {
          title: 'Chromecast',
          key: 'chromecast',
          element: <ChromecastIcon className={styles.iconWidest} />,
          text: intl.formatMessage(messages.chromecastText),
          requirements: intl.formatMessage(messages.chromecastReq),
          href: 'https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410086840731',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/chromecast-repaint.png',
          path: '/static/devices?device=chromecast',
        },
        {
          title: 'TiVO',
          key: 'tivo',
          element: <TivoIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.tivoText),
          requirements: intl.formatMessage(messages.tivoReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/tivo-repaint.png',
          path: '/static/devices?device=tivo',
        },
        {
          title: 'Android TV',
          key: 'androidtv',
          element: <AndroidManIcon className={styles.icon} />,
          deviceHeader: <AndroidIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.androidtvText),
          requirements: intl.formatMessage(messages.androidtvText),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/ott.png',
          path: '/static/devices?device=androidtv',
        },
        {
          title: 'xfinity x1',
          key: 'xfinity',
          element: <XfinityIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.xfinityText),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/xfinity-med-repaint.png',
          path: '/static/devices?device=xfinity',
        },
        {
          title: 'Cox Contour',
          key: 'cox',
          element: <CoxIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.coxText),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/cox-repaint.png',
          path: '/static/devices?device=cox',
        },
      ],
      [
        {
          title: 'Samsung',
          key: 'samsung',
          element: <SamsungIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.samsungText),
          requirements: intl.formatMessage(messages.samsungReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/samsungtv-repaint.png',
          path: '/static/devices?device=samsung',
        },
        {
          title: 'Sony',
          key: 'sony',
          element: <SonyIcon className={styles.iconWide} />,
          deviceHeader: (
            <ATag className={styles.headerLink} to="https://www.sony.com/electronics/smart-tv-features-apps-and-internet/apps?mkexvar=261" target="_blank">
              <SonyIcon className={styles.iconWide} />
            </ATag>),
          text: <div>
            {intl.formatMessage(messages.sonyText)}
          </div>,
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/sony-repaint.png',
          href: 'https://www.sony.com/electronics/smart-tv-features-apps-and-internet/apps?mkexvar=261',
          path: '/static/devices?device=sony',
        },
        {
          title: 'VIZIO',
          key: 'vizio',
          text: <div>{intl.formatMessage(messages.vizioText)}</div>,
          element: <VizioIcon className={styles.iconWide} />,
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/ott.png',
          path: '/static/devices?device=vizio',
        },
        {
          title: 'LG TV',
          key: 'lgtv',
          text: <div>{intl.formatMessage(messages.lgtvText)}</div>,
          element: <LGTVIcon className={styles.iconMediumWide} />,
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/ott.png',
          path: '/static/devices?device=lgtv',
        },
        {
          title: 'Hisense',
          key: 'hisense',
          text: <div>{intl.formatMessage(messages.hisenseText)}</div>,
          element: <HisenseIcon className={styles.iconWide} />,
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/ott.png',
          path: '/static/devices?device=hisense',
        },
      ],
      [
        {
          title: 'iOS',
          key: 'ios',
          element: <AppleIcon className={styles.icon} />,
          text: intl.formatMessage(messages.iosText),
          requirements: intl.formatMessage(messages.iosReq),
          href: 'https://itunes.apple.com/app/tubi-tv-stream-free-movies/id886445756?mt=8',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/ipadiphone-repaint.png',
          path: '/static/devices?device=ios',
          downloadBadge: <AppStoreBadge isSpanishLanguage={false} />,
        },
        {
          title: 'Android',
          key: 'android',
          element: <AndroidManIcon className={styles.icon} />,
          text: intl.formatMessage(messages.androidText),
          requirements: intl.formatMessage(messages.androidReq),
          href: 'https://play.google.com/store/apps/details?id=com.tubitv',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/android-repaint.png',
          path: '/static/devices?device=android',
          downloadBadge: <GooglePlayBadge isSpanishLanguage={false} />,
        },
        {
          title: 'Windows',
          key: 'windows',
          element: <WindowsIcon className={styles.icon} />,
          text: intl.formatMessage(messages.windowsText),
          href: 'https://apps.microsoft.com/store/detail/tubi-free-movies-and-tv/9N1SV6841F0B',
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/windowstablet-repaint.png',
          path: '/static/devices?device=windows',
        },
      ],
      [
        {
          title: 'Web & Desktop',
          key: 'web',
          element: <WebAndDesktopIcon className={styles.iconWide} />,
          text: intl.formatMessage(messages.webText),
          requirements: intl.formatMessage(messages.webReq),
          imageUrl: '//mcdn.tubitv.com/tubitv-assets/img/devices/webdesktop-repaint.png',
          path: '/static/devices?device=web',
          href: '/home',
        },
      ],
    ];

    this.meta = this.getMeta();

    const queryParam = props.location.query ? props.location.query.device : null;
    this.state = queryParam ? this.getInitialState(queryParam)
      : {
        mainRoutesIdx: 0,
        subRoutesIdx: 0,
      };
  }

  private meta: ReturnType<typeof this.getMeta>;

  getMeta = () => {
    const { intl } = this.props;
    const canonical = getCanonicalLink('static/devices');
    const description = intl.formatMessage(messages.metaDescription);
    const title = intl.formatMessage(messages.metaTitle);

    const meta = {
      title,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'keywords', content: intl.formatMessage(messages.metaKeywords) },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:url', content: canonical },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };

    return meta;
  };

  componentDidMount() {
    // load images up front so cached for transition
    this.devices.forEach((deviceGroup) => {
      deviceGroup.forEach(({ imageUrl }) => {
        const image = new Image();
        image.src = imageUrl;
      });
    });
  }

  getInitialState(deviceString: string | null) {
    const initialState = {
      mainRoutesIdx: 0,
      subRoutesIdx: 0,
    };
    this.devices.some((deviceGroup, groupIdx) => {
      return deviceGroup.some((device, deviceIdx) => {
        if (device.key === deviceString) {
          initialState.mainRoutesIdx = groupIdx;
          initialState.subRoutesIdx = deviceIdx;
          return true;
        }
        return false;
      });
    });
    return initialState;
  }

  subNavigate = (idx: number) => {
    this.setState({
      subRoutesIdx: idx,
    });
    this.props.router.push(this.devices[this.state.mainRoutesIdx][idx].path);
  };

  mainNavigate = (mainIdx: number) => {
    this.setState({
      mainRoutesIdx: mainIdx,
      subRoutesIdx: 0,
    });
    this.props.router.push(this.mainNav[mainIdx].path);
  };

  render() {
    const { mainRoutesIdx, subRoutesIdx } = this.state;
    const activeSubRoutes = this.devices[mainRoutesIdx];
    const activeDevice = activeSubRoutes[subRoutesIdx];

    return (
      <div>
        <Helmet {...this.meta} />
        <div className={styles.navWrapper}>
          <Navbar
            routes={this.mainNav}
            onClick={this.mainNavigate}
            activeIdx={mainRoutesIdx}
            className={styles.static}
          />
          {activeSubRoutes.length < 2 ? null : (
            <Navbar
              routes={activeSubRoutes}
              onClick={this.subNavigate}
              activeIdx={subRoutesIdx}
              className={classNames(styles.subNav, styles.static)}
            />
          )}
        </div>
        <Container className={styles.devicesWrapper}>
          <Row className={styles.devicesRow}>
            <Col lg="9" xl="6" className={styles.center}>
              <TransitionGroup component="div" exit={false}>
                <CSSTransition
                  key={activeDevice.key}
                  classNames={pageTransitions}
                  timeout={{ enter: 400 }}
                  nodeRef={this.getDeviceNodeRef(activeDevice.key)}
                >
                  <Device
                    ref={this.getDeviceNodeRef(activeDevice.key)}
                    {...activeDevice}
                  />
                </CSSTransition>
              </TransitionGroup>
            </Col>
          </Row>
        </Container>
        <Footer inverted />
      </div>
    );
  }
}

export default injectIntl(withRouter(DevicesPage));
