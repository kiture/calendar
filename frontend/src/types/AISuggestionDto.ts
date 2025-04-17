/**
 * DTO representing a single event suggestion from the AI service.
 */
export interface AISuggestionDto {
  title: string;
  /** Suggested date or start time (ISO 8601 format). */
  date: string;
  location: string;
  description: string;
  /** Optional identifier from the AI source. */
  source_id?: string;
  // Include other relevant fields provided by the AI service if necessary.
}
