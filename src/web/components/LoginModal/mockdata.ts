import type { User } from 'common/features/authentication/types/auth';

export const mockedUserList: User[] = [
  { userId: 1, tubiId: '1', name: 'John' },
  { userId: 2, tubiId: '2', name: 'Elizabeth' },
  { userId: 3, tubiId: '3', name: 'Hannah' },
  { userId: 4, tubiId: '4', name: 'Oliver', parentTubiId: '1' },
  { userId: 5, tubiId: '5', name: undefined, parentTubiId: '1' },
];
