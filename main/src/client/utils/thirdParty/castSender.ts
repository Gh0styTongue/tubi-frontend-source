import { loadScript } from 'common/utils/dom';

import { ThirdPartyScript } from './thirdPartyScript';

class CastSender extends ThirdPartyScript {
  name = 'castSender';

  /* istanbul ignore next */
  protected load() {
    loadScript('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
  }

  onAppStart() {
    this.load();
  }

  // No need to enable/disable tracking as it doesn't collect user's personal indentifiable information
  // Ref: https://docs.google.com/spreadsheets/d/1Z-e0m-G9YhEt5lIaGJFVF9Idp49AlxwHhargk4EWFdA/
  /* istanbul ignore next */
  onCoppaCompliant() {}

  /* istanbul ignore next */
  onCoppaNotCompliant() {}
}

export default CastSender;
