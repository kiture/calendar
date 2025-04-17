export interface Status<T> {
  type: T;
}

export interface ErrorStatus extends Status<'error'> {
  error: string;
}

export interface LoadingStatus extends Status<'loading'> {
  info: string;
}

export type IdleStatus = Status<'idle'>;

export type InitializingStatus = Status<'initializing'>;

export type AppStatus =
  | ErrorStatus
  | LoadingStatus
  | IdleStatus
  | InitializingStatus
  | null;

export interface AppState {
  appTitle: string;
  status: AppStatus;
}

export const initialState: AppState = {
  appTitle: 'Events Calendar',
  status: null,
};
