import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { format, parseISO } from 'date-fns'; // Import parseISO

import { AppDispatch, RootState } from '../../../redux/store';
import { selectEventById } from '../../../redux/events/event.selectors';
import { selectSelectedGroupId } from '../../../redux/group/group.selectors'; // Assume this exists
import {
  updateEvent,
  createEventInGroup,
} from '../../../redux/events/event.thunks';
import { CreateEventCommand } from '../../../types/CreateEventCommand';
import { UpdateEventCommand } from '../../../types/UpdateEventCommand';

import { Input } from '../../ui/input/Input';
import { Textarea } from '../../ui/textarea/Textarea'; // Assuming Textarea component exists
import { Button } from '../../ui/button/Button';

export function EventFormView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation(); // Get location object

  const isEditMode = Boolean(eventId);

  // --- Initial Date Logic ---
  // Get initial date from navigation state if available (Create mode only)
  const initialDateFromState = location.state?.selectedDate as Date | undefined;
  let initialStartTimeString = '';
  let initialEndTimeString = '';
  if (!isEditMode && initialDateFromState instanceof Date) {
    initialStartTimeString = format(initialDateFromState, "yyyy-MM-dd'T'09:00");
    initialEndTimeString = format(initialDateFromState, "yyyy-MM-dd'T'09:00");
  }
  // -------------------------

  const eventToEdit = useSelector((state: RootState) =>
    eventId ? selectEventById(eventId)(state) : undefined
  );
  const selectedGroupId = useSelector(selectSelectedGroupId); // For create mode

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(initialStartTimeString);
  const [endTime, setEndTime] = useState(initialEndTimeString);
  const [place, setPlace] = useState('');

  // Populate form when event data loads in edit mode
  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setPlace(eventToEdit.place || '');
      // Format start_time for datetime-local input
      if (eventToEdit.start_time) {
        try {
          const dateStart = parseISO(eventToEdit.start_time);
          const formattedStart = format(dateStart, "yyyy-MM-dd'T'HH:mm");
          setStartTime(formattedStart);
        } catch (e) {
          console.error('Error parsing start date:', eventToEdit.start_time, e);
          setStartTime('');
        }
      } else {
        setStartTime('');
      }
      // Format end_time for datetime-local input
      if (eventToEdit.end_time) {
        try {
          const dateEnd = parseISO(eventToEdit.end_time);
          const formattedEnd = format(dateEnd, "yyyy-MM-dd'T'HH:mm");
          setEndTime(formattedEnd);
        } catch (e) {
          console.error('Error parsing end date:', eventToEdit.end_time, e);
          setEndTime('');
        }
      } else {
        setEndTime('');
      }
    }
  }, [eventToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!title || !startTime || !endTime) {
      alert('Title, Start Time, and End Time are required.');
      return;
    }

    // Convert local datetime strings back to ISO 8601 for the backend
    let startTimeISO: string;
    let endTimeISO: string;
    try {
      startTimeISO = new Date(startTime).toISOString();
      endTimeISO = new Date(endTime).toISOString();
    } catch (error) {
      alert('Invalid date format: ' + error);
      return;
    }

    const eventData = {
      title,
      description,
      place,
      start_time: startTimeISO,
      end_time: endTimeISO,
    };

    try {
      if (isEditMode && eventId) {
        await dispatch(
          updateEvent({ eventId, updates: eventData as UpdateEventCommand })
        ).unwrap();
        navigate(-1);
      } else if (selectedGroupId) {
        await dispatch(
          createEventInGroup({
            groupId: selectedGroupId,
            eventData: eventData as CreateEventCommand,
          })
        ).unwrap();
        navigate(-1);
      } else {
        console.error('Cannot create event without a selected group ID.');
        alert('Error: No group selected. Cannot create event.');
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Event' : 'Create New Event'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Event Title"
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Location"
          id="place"
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <Input
          label="Start Time"
          id="start_time"
          // Use datetime-local input type
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <Input
          label="End Time"
          id="end_time"
          // Use datetime-local input type
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditMode ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
