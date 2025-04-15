import { UserDto } from '@shared/types/UserDto';

export type ErrorStatus = {
  error: string;
};

export type LoadingStatus = {
  loading: boolean;
};

export type InitializingStatus = object;

export type AppStatus = ErrorStatus | LoadingStatus | InitializingStatus;

export interface AppState {
  appTitle: string;
  user: UserDto | null;
  status: AppStatus | null;
}
