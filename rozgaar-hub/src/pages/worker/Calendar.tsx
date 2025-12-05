import { useState, useEffect } from "react";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { WorkerCalendar } from "@/components/WorkerCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Phone, IndianRupee, Loader2 } from "lucide-react";
import { calendarAPI } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export default function Calendar() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, tasksRes] = await Promise.all([
        calendarAPI.getCalendarEvents() as Promise<any>,
        calendarAPI.getTodaysTasks() as Promise<any>
      ]);

      if (eventsRes.success) {
        // Transform events for FullCalendar
        const calendarEvents = eventsRes.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          extendedProps: {
            description: event.description,
            location: event.location,
            employer: event.employer,
            salaryAmount: event.salaryAmount,
            scheduledTime: event.scheduledTime
          }
        }));
        setEvents(calendarEvents);
      }

      if (tasksRes.success) {
        setTodaysTasks(tasksRes.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const callEmployer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openMaps = (location: any) => {
    if (location?.coordinates?.lat && location?.coordinates?.lng) {
      const url = `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`;
      window.open(url, '_blank');
    } else if (location?.formatted) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.formatted)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('myCalendar')}</h1>
            <p className="text-muted-foreground">
              {t('manageSchedule')}
            </p>
          </div>

          {/* Today's Tasks Section */}
          {todaysTasks.length > 0 && (
            <Card className="mb-8 shadow-card bg-gradient-to-br from-primary/10 to-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Tasks ({todaysTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysTasks.map((task) => (
                    <Card key={task.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{task.jobTitle}</h3>
                            <p className="text-sm text-muted-foreground">{task.jobDescription}</p>
                          </div>
                          <Badge variant="default" className="text-nowrap">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.scheduledTime}
                          </Badge>
                        </div>

                        {/* Location */}
                        {task.workLocation?.address && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => openMaps(task.workLocation)}
                          >
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span className="truncate text-left flex-1">
                              {task.workLocation.formatted || task.workLocation.address}
                            </span>
                          </Button>
                        )}

                        {/* Employer & Amount */}
                        <div className="flex items-center justify-between gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{task.employer.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              <IndianRupee className="h-4 w-4" />
                              {task.salaryAmount.toLocaleString()}
                            </div>
                            {task.employer.phone && (
                              <Button
                                size="sm"
                                onClick={() => callEmployer(task.employer.phone)}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <WorkerCalendar events={events} />

          {/* Empty State */}
          {events.length === 0 && todaysTasks.length === 0 && (
            <Card className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Scheduled Work</h3>
              <p className="text-muted-foreground">
                Your calendar is clear. Wait for employers to schedule work with you.
              </p>
            </Card>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
