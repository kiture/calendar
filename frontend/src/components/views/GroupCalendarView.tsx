// frontend/src/components/views/GroupCalendarView.tsx
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pl } from 'date-fns/locale/pl'; // Polish locale
// Assuming this thunk exists
import {selectEventsForActiveGroup } from '../../redux/events/event.selectors'; // Assuming these selectors exist
import { EventDto } from '../../types/EventDto'; // Assuming EventDto type exists

// Setup the localizer by providing the required functions
const locales = {
  'pl': pl,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday as start of week
  getDay,
  locales,
});

// Define the structure react-big-calendar expects
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: EventDto;
}

export function GroupCalendarView() {
  const navigate = useNavigate();
  const eventsFromStore = useSelector(selectEventsForActiveGroup);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return eventsFromStore.map((event: EventDto): CalendarEvent => ({
      title: event.title,
      // Use start_time for both start and end as end_time is not available
      start: new Date(event.start_time),
      end: new Date(event.end_time? event.end_time : event.start_time), 
      // Set allDay to true for better visibility in month view, as no end_time is present
      allDay: true, 
      resource: event, 
    }));
  }, [eventsFromStore]);

  const handleSelectEvent = (event: CalendarEvent) => {
    // Try event.resource.event_id as the identifier
    const eventId = event.resource?.event_id; // GUESSING event_id
    if (eventId) {
      navigate(`/event/${eventId}`);
    } else {
      // Fallback check for 'id' just in case, then warn
      const fallbackId = event.resource?.event_id;
      if(fallbackId) {
         navigate(`/event/${fallbackId}`);
      } else {
         console.warn('Could not navigate: event ID missing from resource', event.resource);
      }
    }
  };

  // Handler for selecting a day slot
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // slotInfo contains start, end, slots, action (e.g., 'click', 'select')
    console.log('Selected slot start date:', slotInfo.start);
    // Navigate to the create event form view, passing the selected date
    navigate('/event/new', { state: { selectedDate: slotInfo.start } });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Group Calendar</h2>
      {/* Set height to make the calendar visible */}
      <div style={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.MONTH} // Set default view to month
          views={[Views.MONTH, Views.WEEK, Views.DAY]} // Allow switching views
          style={{ height: '100%' }}
          culture='pl' // Set culture for labels/formats
          messages={{
             // Optional: Add Polish messages here if needed
             // Example: allDay: 'Cały dzień', previous: 'Poprzedni', next: 'Następny', ...
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot} // Add the slot select handler
          selectable // Enable slot selection
        />
      </div>
    </div>
  );
}