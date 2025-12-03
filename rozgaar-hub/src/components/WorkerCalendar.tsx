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

export const WorkerCalendar = ({ events = [] }: WorkerCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const { t } = useTranslation();

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
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
        eventClick={(info) => {
          alert(t('jobAlert', { title: info.event.title }));
        }}
      />
    </Card>
  );
};
