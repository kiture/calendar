import { RootState } from "./store";

export const selectUser = (state: RootState) => state.app.user;

export const selectAppTitle = (state: RootState) => state.app.appTitle;
