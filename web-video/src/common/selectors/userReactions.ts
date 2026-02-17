import { createSelector } from 'reselect';

import type StoreState from 'common/types/storeState';
import type { ReactionStatus } from 'common/types/userReactions';

const userReactionsSelector = ({ userReactions }: StoreState) => userReactions;

export const makeUserReactionStatusSelector = () =>
  createSelector(
    userReactionsSelector,
    (_: StoreState, contentId: string) => contentId,
    (userReactions, contentId): ReactionStatus | undefined =>
      userReactions.content[contentId]?.status,
  );
