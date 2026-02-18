export function isAFTMMModel(): boolean {
  return __OTTPLATFORM__ === 'FIRETV_HYB' && window.navigator.userAgent.includes('AFTMM ');
}
