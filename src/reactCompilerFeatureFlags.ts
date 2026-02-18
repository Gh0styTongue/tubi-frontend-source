import { getClientIsInitialized, getExperiment } from 'common/experimentV2';
import { webottFiretvReactCompiler } from 'common/experimentV2/configs/webottFiretvReactCompiler';

// eslint-disable-next-line import/no-unused-modules
export function isCompilerEnabled() {
  if (__CLIENT__ && getClientIsInitialized()) {
    const result = getExperiment(webottFiretvReactCompiler).get('enable_compiler');
    return result;
  }
  return false;
}
