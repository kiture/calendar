import { createAsyncThunk } from '@reduxjs/toolkit';
import { makeApiRequest } from '../../utils/fetch-helper';
import { AISuggestionDto } from '../../types/AISuggestionDto';
import { AppDispatch } from '../store';
import { RootState } from '../store';


type AsyncThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  getState: () => RootState;
};

export const fetchEventSuggestions = createAsyncThunk<
  AISuggestionDto[], // Success return type
  {
    startDate: string;
    endDate: string;
    location: string;
    type?: string;
  }, // Argument type
  AsyncThunkConfig
>('ai/fetchEventSuggestions', async (params, thunkAPI) => {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    location: params.location,
  });

  if (params.type) {
    queryParams.append('type', params.type);
  }

  return await makeApiRequest<AISuggestionDto[]>(
    `/api/ai/event-suggestions?${queryParams.toString()}`,
    'GET',
    thunkAPI,
    { loadingMessage: 'Generating event suggestions...' }
  );
});