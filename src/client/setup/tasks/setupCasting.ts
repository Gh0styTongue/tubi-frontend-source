import logger from 'common/helpers/logging';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import CastingClientManager from 'ott/features/casting/CastingClientManager';

interface SetupCastingParams {
  roomId: string;
  dispatch: TubiThunkDispatch;
}

/**
 * Initialize CastingClient for OTT platforms when room_id is present in deeplink
 *
 * This function handles the setup of casting client connection for multiple OTT platforms
 * including Samsung, Vizio, FireTV, AndroidTV, and LG.
 *
 * @param params - Configuration object
 * @param params.roomId - The room ID from deeplink query parameters
 * @param params.dispatch - Redux dispatch function for state management
 *
 * @example
 * ```typescript
 * // In deeplink handler
 * if (query.room_id) {
 *   await setupCastingFromDeeplink({
 *     roomId: query.room_id,
 *     dispatch: store.dispatch,
 *   });
 * }
 * ```
 */
export async function setupCastingFromDeeplink({ roomId, dispatch }: SetupCastingParams): Promise<void> {
  if (!roomId) {
    return;
  }

  try {
    // Set dispatch to enable proper back button behavior during casting navigation
    CastingClientManager.setDispatch(dispatch);

    const client = await CastingClientManager.getClient({
      roomId,
    });

    await client.connect();

    logger.info({
      roomId,
      platform: __OTTPLATFORM__,
      context: 'CastingSetup',
      action: 'initialize_casting_client',
    }, `Successfully initialized casting client from ${__OTTPLATFORM__} deeplink`);
  } catch (error) {
    logger.error({
      error,
      roomId,
      platform: __OTTPLATFORM__,
      context: 'CastingSetup',
      action: 'initialize_casting_client',
    }, `Failed to initialize casting client from ${__OTTPLATFORM__} deeplink`);
  }
}
