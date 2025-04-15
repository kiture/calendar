import { EventDto } from './EventDto';

/**
 * DTO for the response when listing events within a group.
 */
export interface ListEventsResponseDto {
  events: EventDto[];
  total_count: number;
} 