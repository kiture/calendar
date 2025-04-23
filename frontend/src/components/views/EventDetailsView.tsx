import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale/pl';

import { AppDispatch, RootState } from '../../redux/store';
import {
  selectEventById,
  selectEventAttendeesByEventId,
  selectUserIsAttendingEvent,
} from '../../redux/events/event.selectors';
import {
  joinEvent,
  leaveEvent,
  deleteEvent,
} from '../../redux/events/event.thunks';
import { AttendeeDetailsDto } from '../../types/AttendeeDetailsDto';
import { Button } from '../ui/Button';

export function EventDetailsView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const event = useSelector((state: RootState) =>
    eventId ? selectEventById(eventId)(state) : undefined
  );
  const attendees = useSelector((state: RootState) =>
    eventId ? selectEventAttendeesByEventId(eventId)(state) : undefined
  );
  const isCurrentUserAttending = useSelector((state: RootState) =>
    eventId ? selectUserIsAttendingEvent(eventId)(state) : false
  );

  const handleJoin = async () => {
    if (!eventId) return;
    await dispatch(joinEvent(eventId));
  };

  const handleLeave = async () => {
    if (!eventId) return;
    await dispatch(leaveEvent(eventId));
  };

  const handleEdit = () => {
    if (!eventId) return;
    navigate(`/event/${eventId}/edit`);
  };

  const handleDelete = async () => {
    if (!eventId) return;

    if (
      window.confirm(
        `Are you sure you want to delete the event "${event?.title || 'this event'}"? This cannot be undone.`
      )
    ) {
      await dispatch(deleteEvent(eventId)).unwrap();
      navigate('/');
    }
  };

  if (!eventId) {
    return (
      <div className="text-center p-4 text-red-600">
        Error: Event ID missing.
      </div>
    );
  }

  if (!event) {
    return <div className="text-center p-4">Event not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-2xl md:text-3xl font-bold break-words mr-4">
          {event.title}
        </h1>
        <div className="flex space-x-2 flex-shrink-0">
          <Button onClick={handleEdit} variant="secondary">
            Edit
          </Button>
          <Button onClick={handleDelete} variant="danger">
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-4 text-base md:text-lg text-gray-600 space-y-1">
        <div>
          <strong>Start:</strong>{' '}
          {format(new Date(event.start_time), 'PPPPpppp', { locale: pl })}
        </div>
        <div>
          <strong>End:</strong>{' '}
          {format(new Date(event.end_time), 'PPPPpppp', { locale: pl })}
        </div>
        <div>
          <strong>Location:</strong> {event.place || 'Not specified'}
        </div>
      </div>

      <div className="mb-6">
        {isCurrentUserAttending ? (
          <Button onClick={handleLeave} variant="danger">
            Leave Event
          </Button>
        ) : (
          <Button onClick={handleJoin} variant="primary">
            Join Event
          </Button>
        )}
      </div>

      {event.description && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">
            Description
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
            {event.description}
          </p>
        </div>
      )}

      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Attendees</h3>
        {attendees && attendees.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {attendees.map((attendee: AttendeeDetailsDto) => (
              <li key={attendee.user_id} className="text-gray-700">
                {attendee.first_name ||
                  attendee.last_name ||
                  `User ID: ${attendee.user_id}`}
              </li>
            ))}
          </ul>
        )}
        {(!attendees || attendees.length === 0) && (
          <p className="text-gray-500">No attendees information available.</p>
        )}
      </div>
    </div>
  );
}
