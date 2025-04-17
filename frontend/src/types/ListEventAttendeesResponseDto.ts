import { AttendeeDetailsDto } from './AttendeeDetailsDto';

/**
 * DTO for the response when listing attendees of an event.
 */
export interface ListEventAttendeesResponseDto {
  attendees: AttendeeDetailsDto[];
  total_count: number;
}
