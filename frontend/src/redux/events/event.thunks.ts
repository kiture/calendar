import { createAsyncThunk } from '@reduxjs/toolkit';

import { RootState, AppDispatch } from '../store';
import { makeApiRequest } from '../../utils/fetch-helper';
import { AttendeeDetailsDto } from '../../types/AttendeeDetailsDto';
import { EventDto } from '../../types/EventDto';
import { EventAttendanceDto } from '../../types/EventAttendanceDto';
import { UpdateEventCommand } from '../../types/UpdateEventCommand';
import { CreateEventCommand } from '../../types/CreateEventCommand';

// Reusable AsyncThunkConfig type (consider moving to a central types file)
type AsyncThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  getState: () => RootState;
  rejectValue: string;
};

// Thunk to get event details by ID
export const getEventById = createAsyncThunk<
  EventDto, // Return type
  string, // Argument type (eventId)
  AsyncThunkConfig
>('event/getById', async (eventId, thunkAPI) => {
  return makeApiRequest<EventDto>(`/api/events/${eventId}`, 'GET', thunkAPI, {
    loadingMessage: `Loading event ${eventId}...`,
  });
});

// Thunk to update an event
export const updateEvent = createAsyncThunk<
  EventDto,
  { eventId: string; updates: UpdateEventCommand }, // Argument type
  AsyncThunkConfig
>('event/update', async ({ eventId, updates }, thunkAPI) => {
  return makeApiRequest<EventDto>(`/api/events/${eventId}`, 'PUT', thunkAPI, {
    data: updates,
    loadingMessage: `Updating event ${eventId}...`,
  });
});

// Thunk to delete an event
export const deleteEvent = createAsyncThunk<
  string, // Return eventId on success
  string, // Argument type (eventId)
  AsyncThunkConfig
>('event/delete', async (eventId, thunkAPI) => {
  const result = await makeApiRequest<void>(
    `/api/events/${eventId}`,
    'DELETE',
    thunkAPI,
    { loadingMessage: `Deleting event ${eventId}...` }
  );
  // Handle 204 success from helper
  if (typeof result === 'object' && result !== null) {
    return eventId;
  }
  throw new Error('Deletion failed unexpectedly after API request.');
});

// Thunk to join an event (mark attendance)
export const joinEvent = createAsyncThunk<
  EventAttendanceDto, // Return type (attendance record)
  string, // Argument type (eventId)
  AsyncThunkConfig
>('event/join', async (eventId, thunkAPI) => {
  return makeApiRequest<EventAttendanceDto>(
    `/api/events/${eventId}/attendance`,
    'POST', // No body needed, user is inferred from token
    thunkAPI,
    { loadingMessage: `Joining event ${eventId}...` }
  );
});

// Thunk to leave an event (remove attendance)
export const leaveEvent = createAsyncThunk<
  AttendeeDetailsDto, // Return eventId on success
  string, // Argument type (eventId)
  AsyncThunkConfig
>('event/leave', async (eventId, thunkAPI) => {
  return makeApiRequest<AttendeeDetailsDto>(
    `/api/events/${eventId}/attendance`,
    'DELETE',
    thunkAPI,
    { loadingMessage: `Leaving event ${eventId}...` }
  );
});

// Thunk to list attendees for an event
export const listAttendees = createAsyncThunk<
  AttendeeDetailsDto[], // Return type
  string, // Argument type (eventId)
  AsyncThunkConfig
>('event/listAttendees', async (eventId, thunkAPI) => {
  return makeApiRequest<AttendeeDetailsDto[]>(
    `/api/events/${eventId}/attendees`,
    'GET',
    thunkAPI,
    { loadingMessage: `Loading attendees for event ${eventId}...` }
  );
});

// --- Thunks for group-related event actions (/api/groups/:groupId/events/...) ---

// Thunk to create an event within a specific group
export const createEventInGroup = createAsyncThunk<
  EventDto,
  { groupId: string; eventData: CreateEventCommand }, // Argument type
  AsyncThunkConfig
>('event/createInGroup', async ({ groupId, eventData }, thunkAPI) => {
  return makeApiRequest<EventDto>(
    `/api/groups/${groupId}/events`, // Group-specific event endpoint
    'POST',
    thunkAPI,
    {
      data: eventData,
      loadingMessage: `Creating event in group ${groupId}...`,
    }
  );
});

// Thunk to list events within a specific group (with date filtering)
export const listEventsInGroup = createAsyncThunk<
  EventDto[], // Return type
  { groupId: string; startDate?: string; endDate?: string }, // Argument type
  AsyncThunkConfig
>('event/listInGroup', async ({ groupId, startDate, endDate }, thunkAPI) => {
  // Construct URL with query parameters manually
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const queryString = params.toString();
  const urlPath = `/api/groups/${groupId}/events${queryString ? '?' + queryString : ''}`;

  // Note: Backend removed pagination, so fetch helper gets all within date range
  return makeApiRequest<EventDto[]>(
    urlPath, // Use the constructed path
    'GET',
    thunkAPI,
    { loadingMessage: `Loading events for group ${groupId}...` }
  );
});

// Thunk to fetch events the current user is associated with (attending, created, etc.)
export const fetchCurrentUserEvents = createAsyncThunk<
  EventDto[], // Return type: an array of EventDto
  void, // Argument type: no arguments needed
  AsyncThunkConfig
>('event/fetchCurrentUserEvents', async (_, thunkAPI) => {
  return makeApiRequest<EventDto[]>('/api/users/me/events', 'GET', thunkAPI, {
    loadingMessage: 'Loading your events...',
  });
});
