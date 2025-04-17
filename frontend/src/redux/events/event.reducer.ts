import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './event.model';

// Import the thunks
import {
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  listAttendees,
  createEventInGroup,
  listEventsInGroup,
} from './event.thunks';
import { AttendeeDetailsDto } from '../../types/AttendeeDetailsDto';
import { EventDto } from '../../types/EventDto';

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
    },
    selectEvent: (state, action: PayloadAction<EventDto>) => {
      state.selectedEvent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        createEventInGroup.fulfilled,
        (state, action: PayloadAction<EventDto>) => {
          state.events.push(action.payload);
        }
      )
      // Handle getEventById
      .addCase(
        getEventById.fulfilled,
        (state, action: PayloadAction<EventDto>) => {
          state.events = [
            ...state.events.filter(
              (event) => event.event_id !== action.payload.event_id
            ),
            action.payload,
          ];
        }
      )
      // Handle deleteEvent
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.events = [
            ...state.events.filter(
              (event) => event.event_id !== action.payload
            ),
          ];
        }
      )
      // Handle updateEvent
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<EventDto>) => {
          state.events = [
            ...state.events.filter(
              (event) => event.event_id !== action.payload.event_id
            ),
            action.payload,
          ];
        }
      )
      .addCase(
        joinEvent.fulfilled,
        (state, action: PayloadAction<AttendeeDetailsDto>) => {
          if (!state.attendees[action.payload.event_id]) {
            state.attendees[action.payload.event_id] = [];
          }
          state.attendees[action.payload.event_id] = [
            ...state.attendees[action.payload.event_id].filter(
              (attendee) => attendee.user_id !== action.payload.user_id
            ),
            action.payload,
          ];
        }
      )
      .addCase(
        leaveEvent.fulfilled,
        (state, action: PayloadAction<AttendeeDetailsDto>) => {
          if (state.attendees[action.payload.event_id]) {
            state.attendees[action.payload.event_id] = [
              ...state.attendees[action.payload.event_id].filter(
                (attendee) => attendee.user_id !== action.payload.user_id
              ),
              action.payload,
            ];
          }
        }
      )
      // Handle listAttendees
      .addCase(
        listAttendees.fulfilled,
        (state, action: PayloadAction<AttendeeDetailsDto[]>) => {
          if (action.payload.length > 0) {
            state.attendees[action.payload[0].event_id] = action.payload;
          }
        }
      )
      // Handle listEventsInGroup
      .addCase(
        listEventsInGroup.fulfilled,
        (state, action: PayloadAction<EventDto[]>) => {
          console.log(action.payload);
          state.events = [
            ...state.events.filter(
              (event) =>
                !action.payload.find((e) => e.event_id === event.event_id)
            ),
            ...action.payload,
          ];
        }
      );
  },
});

export const { clearSelectedEvent } = eventSlice.actions;
export default eventSlice.reducer;
