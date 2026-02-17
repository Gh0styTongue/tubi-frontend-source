import React from 'react';
import { Helmet } from 'react-helmet-async';

import { ONETRUST_SDK_INITED_EVENT_NAME } from 'common/features/gdpr/onetrust/onetrust';
import { getOnetrustIdentifier, onScriptLoadError } from 'common/features/gdpr/onetrust/utils';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';

// The OT web script is loaded asynchronously(https://developer.onetrust.com/onetrust/docs/performance-availability-cookie-script)
// And it will call `OptanonWrapper` function when the script is fully loaded
// We dispatched a custom event here to let main app know the script is loaded
const WEB_ONETRUST_INIT_SCRIPT = `
function OptanonWrapper() {
  var event = new Event('${ONETRUST_SDK_INITED_EVENT_NAME}');
  document.dispatchEvent(event);
}
`;

const OnetrustScript = () => {
  const deviceId = useAppSelector(state => state.auth.deviceId);
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  if (isGDPREnabled && __CLIENT__) {
    const appId = 'aa4c0545-ebdb-4607-a5dd-495e96292cf8';
    // See: https://developer.onetrust.com/onetrust/docs/cross-domain-cross-device
    return (
      <Helmet>
        <script>
          {/* eslint-disable-next-line react/jsx-no-literals */}
          {`var OneTrust = {
          dataSubjectParams: {
            id: "${getOnetrustIdentifier(deviceId)}",
            isAnonymous: true
          }
        };`}
        </script>
        <script
          // The script is from Onetrust portal
          // It will automatically display the consent banner when needed
          src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
          type="text/javascript"
          /* istanbul ignore next */
          data-domain-script={`${appId}${__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__ ? '-test' : ''}`}
          onError={onScriptLoadError}
        />
        <script>{WEB_ONETRUST_INIT_SCRIPT}</script>
      </Helmet>
    );
  }

  return null;
};

export default OnetrustScript;
