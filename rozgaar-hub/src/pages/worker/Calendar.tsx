import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { WorkerCalendar } from "@/components/WorkerCalendar";
import { mockCalendarEvents } from "@/lib/mockData";
import { useTranslation } from "react-i18next";

export default function Calendar() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('myCalendar')}</h1>
            <p className="text-muted-foreground">
              {t('manageSchedule')}
            </p>
          </div>

          <WorkerCalendar events={mockCalendarEvents} />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
