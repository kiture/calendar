import { User } from "./User";

export type ErrorStatus = {
  error: string;
}

export type LoadingStatus = {
  loading: boolean;
}

export type AppStatus = ErrorStatus | LoadingStatus;

export interface AppState {
  appTitle: string;
  user: User | null;
  status: AppStatus | null;
}
