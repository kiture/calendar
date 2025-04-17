/**
 * Represents the query parameters for fetching AI event suggestions.
 */
export interface GetEventSuggestionsQuery {
  /** Start date for search range (ISO 8601 date format). */
  startDate: string;
  /** End date for search range (ISO 8601 date format). */
  endDate: string;
  /** Location context (e.g., "Warsaw, Poland"). */
  location: string;
  /** Optional type of event (e.g., "concert"). */
  type?: string;
}
