import { AISuggestionDto } from './AISuggestionDto';

/**
 * DTO for the response containing a list of AI event suggestions.
 */
export interface ListEventSuggestionsResponseDto {
  suggestions: AISuggestionDto[];
} 