import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, store } from '../../../redux/store';
import { fetchEventSuggestions } from '../../../redux/ai/ai.thunks';
import { AISuggestionDto } from '../../../types/AISuggestionDto';
import { selectSelectedGroupId } from '../../../redux/group/group.selectors';
import { createEventInGroup } from '../../../redux/events/event.thunks';

interface FormData {
  startDate: string;
  endDate: string;
  location: string;
  type: string;
}

export function AISuggestionsView() {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<FormData>({
    startDate: '',
    endDate: '',
    location: '',
    type: '',
  });
  const [suggestions, setSuggestions] = useState<AISuggestionDto[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSuggestions = await dispatch(fetchEventSuggestions(formData));
    setSuggestions((prev) => [
      ...prev,
      ...(newSuggestions.payload as AISuggestionDto[]),
    ]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">AI Event Suggestions</h1>
          <p className="text-base-content/70 mt-2">
            Get personalized event suggestions based on your preferences
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Start Date</span>
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="input input-bordered w-full bg-base-100"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">End Date</span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="input input-bordered w-full bg-base-100"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Location</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter location"
                className="input input-bordered w-full bg-base-100"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Event Type</span>
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="Enter event type"
                className="input input-bordered w-full bg-base-100"
              />
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="btn btn-primary w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Generate Suggestions
            </button>
          </div>
        </form>

        {/* Results Section */}
        {suggestions.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Your Personalized Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestions.map((suggestion: AISuggestionDto, index: number) => (
                <div
                  key={index}
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-200"
                >
                  <div className="card-body">
                    <h3 className="card-title text-lg font-bold">
                      {suggestion.title}
                    </h3>
                    {suggestion.type && (
                      <div className="badge badge-accent mb-2">
                        {suggestion.type}
                      </div>
                    )}
                    <p className="text-base-content/80 mb-4">
                      {suggestion.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          <strong>Start:</strong>{' '}
                          {new Date(suggestion.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          <strong>End:</strong>{' '}
                          {new Date(suggestion.endTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>
                          <strong>Location:</strong>{' '}
                          {suggestion.location || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const groupId = selectSelectedGroupId(
                            store.getState()
                          );
                          if (groupId) {
                            dispatch(
                              createEventInGroup({
                                groupId,
                                eventData: {
                                  title: suggestion.title,
                                  description: suggestion.description,
                                  start_time: suggestion.startTime,
                                  end_time: suggestion.endTime,
                                  place: suggestion.location,
                                  is_ai_suggestion: true,
                                },
                              })
                            );
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
