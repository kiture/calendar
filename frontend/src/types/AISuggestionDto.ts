/**
 * DTO representing a single event suggestion from the AI service.
 */
export interface AISuggestionDto {
  title: string;
  /** Suggested date or start time (ISO 8601 format). */
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  /** Optional identifier from the AI source. */
  type: string;
  // Include other relevant fields provided by the AI service if necessary.
}
