import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card } from "@/components/ui/card";
import { CalendarEvent } from "@/types";
import { useTranslation } from "react-i18next";

interface WorkerCalendarProps {
  events?: CalendarEvent[];
}

// Generate consistent color for each job based on job title
const getJobColor = (title: string): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52B788', // Green
  ];

  // Simple hash function to get consistent color for same job
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const WorkerCalendar = ({ events = [] }: WorkerCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const { t } = useTranslation();

  // Transform events to include color based on job and ensure proper date formatting
  const coloredEvents = events.map(event => {
    const color = event.color || getJobColor(event.title);

    // Ensure dates are properly formatted for FullCalendar
    let startDate = event.start;
    let endDate = event.end;

    // If start is a Date object or string, convert to YYYY-MM-DD format for all-day events
    if (startDate) {
      const dateObj = new Date(startDate);
      startDate = dateObj.toISOString().split('T')[0];
    }

    // For all-day events, end date should be the next day for proper display
    if (endDate) {
      const dateObj = new Date(endDate);
      // Add one day for FullCalendar's exclusive end date
      dateObj.setDate(dateObj.getDate() + 1);
      endDate = dateObj.toISOString().split('T')[0];
    } else if (startDate) {
      // If no end date, set it to day after start
      const dateObj = new Date(startDate);
      dateObj.setDate(dateObj.getDate() + 1);
      endDate = dateObj.toISOString().split('T')[0];
    }

    return {
      id: event.id,
      title: event.title,
      start: startDate,
      end: endDate,
      allDay: true, // Critical for full-day block display
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      display: 'block',
      extendedProps: {
        description: (event as any).description || '',
        location: (event as any).location || '',
        employer: (event as any).employer || '',
        salaryAmount: (event as any).salaryAmount || 0,
        scheduledTime: (event as any).scheduledTime || '',
      },
    };
  });

  return (
    <Card className="p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={coloredEvents}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        height="auto"
        eventClick={(info) => {
          const event = info.event;
          const props = event.extendedProps;

          let message = `📋 Job: ${event.title}\n`;
          if (props.location) {
            message += `📍 Location: ${props.location}\n`;
          }
          if (props.employer) {
            message += `👔 Employer: ${props.employer}\n`;
          }
          if (props.salaryAmount) {
            message += `💰 Salary: ₹${props.salaryAmount}\n`;
          }
          if (props.scheduledTime) {
            message += `⏰ Time: ${props.scheduledTime}\n`;
          }
          if (props.description) {
            message += `\n${props.description}`;
          }

          alert(message);
        }}
        eventContent={(arg) => {
          return (
            <div className="fc-event-main-frame p-1">
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky font-medium text-xs truncate">
                  {arg.event.title}
                </div>
              </div>
            </div>
          );
        }}
        dayCellClassNames="hover:bg-muted/50 transition-colors"
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
      />
    </Card>
  );
};
