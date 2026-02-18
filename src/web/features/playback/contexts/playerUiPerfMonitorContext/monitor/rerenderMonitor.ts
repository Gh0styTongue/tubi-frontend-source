export class RerenderMonitor {
  private rerenderCount: Record<string, number> = {};

  markRerender = (componentName: string) => {
    this.rerenderCount[componentName] = (this.rerenderCount[componentName] || 0) + 1;
  };

  getStats = (sessionLengthSec: number) => {
    return {
      rerenderCount: Object.entries(this.rerenderCount).reduce((acc, [componentName, renderCount]) => {
        acc[componentName] = {
          // rc - render count
          rc: renderCount,
          // rps - renders per second
          rps: renderCount / sessionLengthSec,
        };
        return acc;
      }, {} as Record<string, { rc: number; rps: number }>),
    };
  };
}
