import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale/pl';

import { AppDispatch } from '../../redux/store';
// Assume these exist or create them:
import { selectCurrentUserEvents } from '../../redux/events/event.selectors';
import { leaveEvent, deleteEvent } from '../../redux/events/event.thunks';
import { EventDto } from '../../types/EventDto';
import { Button } from '../ui/Button';

export function MyEventsView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Asserting the type here, ensure selector returns EventDto[] or undefined/null
  const userEvents = useSelector(selectCurrentUserEvents) as
    | EventDto[]
    | undefined;

  const handleLeave = async (eventId: string) => dispatch(leaveEvent(eventId));

  const handleEdit = (eventId: string) => {
    navigate(`/event/${eventId}/edit`);
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (
      window.confirm(
        `Are you sure you want to DELETE the event "${eventTitle}"? This cannot be undone.`
      )
    ) {
      dispatch(deleteEvent(eventId));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Events</h1>
      {/* Check specifically for array and length */}
      {Array.isArray(userEvents) && userEvents.length > 0 ? (
        <ul className="space-y-4">
          {userEvents.map((event: EventDto) => (
            <li
              key={event.event_id}
              className="p-4 border rounded-lg shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0"
            >
              <div className="flex-grow mr-4">
                <Link
                  to={`/event/${event.event_id}`}
                  className="text-lg font-semibold text-blue-600 hover:underline break-words"
                >
                  {event.title}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(event.start_time), 'Pp', { locale: pl })}
                </p>
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                {/* Changed variant to secondary, removed size */}
                <Button
                  onClick={() => handleLeave(event.event_id)}
                  variant="secondary"
                >
                  Leave
                </Button>
                {/* Note: Consider adding owner check before showing Edit/Delete */}
                {/* Removed size */}
                <Button
                  onClick={() => handleEdit(event.event_id)}
                  variant="secondary"
                >
                  Edit
                </Button>
                {/* Removed size */}
                <Button
                  onClick={() => handleDelete(event.event_id, event.title)}
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">
          You are not currently participating in any events.
        </p>
      )}
    </div>
  );
}
