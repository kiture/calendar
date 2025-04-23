import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { format, parseISO } from 'date-fns'; // Import parseISO

import { AppDispatch, RootState } from '../../redux/store';
import { selectEventById } from '../../redux/events/event.selectors';
import { selectSelectedGroupId } from '../../redux/group/group.selectors'; // Assume this exists
import { updateEvent, createEventInGroup } from '../../redux/events/event.thunks';
import { CreateEventCommand } from '../../types/CreateEventCommand';
import { UpdateEventCommand } from '../../types/UpdateEventCommand';

import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea'; // Assuming Textarea component exists
import { Button } from '../ui/Button';

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
  if (!isEditMode && initialDateFromState instanceof Date) {
      try {
          // Format the passed date for datetime-local input
          // Default time to 09:00 for a newly selected day
          initialStartTimeString = format(initialDateFromState, "yyyy-MM-dd'T'09:00");
          console.log('Setting initial start time from state:', initialStartTimeString);
      } catch (e) {
          console.error("Error formatting initial date from state:", initialDateFromState, e);
      }
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

  // Populate form when event data loads in edit mode
  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      // Format date from ISO string to datetime-local input format
      try {
          const date = parseISO(eventToEdit.start_time);
          // Format: YYYY-MM-DDTHH:mm (T literal character)
          const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
          setStartTime(formattedDate);
      } catch (e) {
          console.error("Error parsing date:", eventToEdit.start_time, e);
          // Set a default or leave empty if parsing fails
          setStartTime('');
      }
    }
  }, [eventToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!title || !startTime) {
      alert('Title and Start Time are required.');
      return;
    }

    // Convert local datetime string back to ISO 8601 for the backend
    let startTimeISO: string;
    try {
       startTimeISO = new Date(startTime).toISOString();
    } catch (error) {
       alert('Invalid Start Time format.' + error);
       return;
    }

    const eventData = {
      title,
      description,
      start_time: startTimeISO,
    };

    try {
      if (isEditMode && eventId) {
        await dispatch(updateEvent({ eventId, updates: eventData as UpdateEventCommand })).unwrap();
        navigate(-1);
      } else if (selectedGroupId) {
        await dispatch(createEventInGroup({ groupId: selectedGroupId, eventData: eventData as CreateEventCommand })).unwrap();
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
      <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
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
          label="Start Time"
          id="start_time"
          // Use datetime-local input type
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <div className="flex justify-end pt-4">
           <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="mr-2">
                Cancel
           </Button>
           <Button type="submit" variant="primary">
             {(isEditMode ? 'Update Event' : 'Create Event')}
           </Button>
        </div>
      </form>
    </div>
  );
} 