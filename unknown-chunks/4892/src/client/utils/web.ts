let isIncognitoResult: boolean = false;

if (__CLIENT__) {
  import('detect-incognito').then(({ detectIncognito }) => {
    detectIncognito().then(({ isPrivate }) => {
      isIncognitoResult = isPrivate;
    }).catch(() => {
      isIncognitoResult = false;
    });
  });
}

export function isIncognito(): boolean {
  return isIncognitoResult;
}
