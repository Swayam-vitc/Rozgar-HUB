import { useState, useEffect } from "react";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuthStore } from "@/store/authStore";
import { WorkerProfile } from "@/types";
import { StatCard } from "@/components/StatCard";
import { StreakBadge } from "@/components/StreakBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { WorkerCalendar } from "@/components/WorkerCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IndianRupee,
  Briefcase,
  Calendar as CalendarIcon,
  Search,
  Users,
  Wallet,
  MessageSquare,
  MapPin,
  CheckCircle,
  XCircle,
  Phone,
} from "lucide-react";
import { mockCalendarEvents } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { workerAPI, paymentAPI, calendarAPI } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ongoingJobs, setOngoingJobs] = useState<any[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch profile
        const profileResponse = await workerAPI.getProfile() as any;
        if (profileResponse.success) {
          setWorkerProfile(profileResponse.worker);
        }

        // Fetch accepted hire requests (ongoing jobs) - exclude completed ones
        const acceptedResponse = await workerAPI.getHireRequests({ status: 'accepted' }) as any;
        if (acceptedResponse.success) {
          // Filter out completed jobs from ongoing jobs
          const activeJobs = (acceptedResponse.hireRequests || []).filter((job: any) => !job.completed);
          setOngoingJobs(activeJobs);
        }

        // Fetch rejected hire requests
        const rejectedResponse = await workerAPI.getHireRequests({ status: 'rejected' }) as any;
        if (rejectedResponse.success) {
          setRejectedJobs(rejectedResponse.hireRequests || []);
        }

        // Fetch payment data
        const [paymentsRes, pendingRes] = await Promise.all([
          paymentAPI.getPaymentHistory(),
          paymentAPI.getPendingPayments()
        ]);

        if ((paymentsRes as any).success) {
          setPaymentHistory((paymentsRes as any).payments || []);
        }

        if ((pendingRes as any).success) {
          setPendingPayments((pendingRes as any).pendingPayments || []);
        }

        // Fetch today's tasks
        try {
          const tasksRes = await calendarAPI.getTodaysTasks() as any;
          if (tasksRes.success) {
            setTodaysTasks(tasksRes.tasks || []);
          }
        } catch (error) {
          console.log("No today's tasks");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Show loading state if user data is not yet loaded
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("dashboard.loadingDashboard")}</p>
        </div>
      </div>
    );
  }

  if (!workerProfile) return null;
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{t("dashboard.welcomeBack")}, {workerProfile.name}! 👋</h2>
            <p className="text-muted-foreground">{t("dashboard.workOverview")}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title={t("dashboard.totalEarnings")}
              value={`₹${workerProfile.totalEarnings?.toLocaleString() || '0'}`}
              icon={IndianRupee}
              gradient="gradient-success"
              trend="+12% from last month"
            />
            <StatCard
              title={t("dashboard.ongoingJobs")}
              value={ongoingJobs.length.toString()}
              icon={Briefcase}
              gradient="gradient-saffron"
            />
            <StatCard
              title={t("dashboard.completedJobs")}
              value={workerProfile.completedJobs || 0}
              icon={CalendarIcon}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/worker/jobs")}
            >
              <Search className="h-6 w-6" />
              <span>{t("dashboard.findJobs")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/worker/team")}
            >
              <Users className="h-6 w-6" />
              <span>{t("dashboard.myTeam")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/worker/wallet")}
            >
              <Wallet className="h-6 w-6" />
              <span>{t("dashboard.wallet")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/worker/messages")}
            >
              <MessageSquare className="h-6 w-6" />
              <span>{t("dashboard.messages")}</span>
            </Button>
          </div>

          {/* Ongoing Jobs Section */}
          {ongoingJobs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                {t("dashboard.ongoingJobs")}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ongoingJobs.map((job) => (
                  <Card key={job._id} className="shadow-card hover:shadow-elevated transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={job.employerPhoto} />
                          <AvatarFallback className="gradient-saffron text-white">
                            {job.employerName?.[0] || "E"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{job.employerName}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{job.employerPhoneNumber}</span>
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-base">{job.jobTitle || t("dashboard.workAssignment")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {job.jobDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.jobDescription}</p>
                      )}
                      {(job.jobLocation?.city || job.jobLocation?.state) && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {[job.jobLocation?.city, job.jobLocation?.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      {job.salaryAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-primary">₹{job.salaryAmount}</span>
                          {job.salaryType && (
                            <Badge variant="secondary" className="text-xs">
                              {job.salaryType}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {t("dashboard.acceptedOn")} {formatDate(job.updatedAt || job.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Jobs Section */}
          {rejectedJobs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                {t("dashboard.rejectedJobs")}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedJobs.map((job) => (
                  <Card key={job._id} className="shadow-card opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={job.employerPhoto} />
                          <AvatarFallback className="bg-muted">
                            {job.employerName?.[0] || "E"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{job.employerName}</h4>
                        </div>
                        <Badge variant="destructive" className="text-xs">{t("dashboard.rejected")}</Badge>
                      </div>
                      <CardTitle className="text-base">{job.jobTitle || t("dashboard.workAssignment")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {job.salaryAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">₹{job.salaryAmount}</span>
                          {job.salaryType && (
                            <Badge variant="outline" className="text-xs">
                              {job.salaryType}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {t("dashboard.rejectedOn")} {formatDate(job.updatedAt || job.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.yourSchedule")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkerCalendar events={mockCalendarEvents} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pending Payments */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{t("dashboard.pendingPayments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-primary">
                      ₹{totalPending.toLocaleString()}
                    </div>
                    <div className="space-y-2">
                      {pendingPayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Job #{payment.jobId}</span>
                          <span className="font-medium">₹{payment.amount}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline">
                      {t("dashboard.viewAll")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Tasks */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{t("dashboard.todaysTasks")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks scheduled for today
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {todaysTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <p className="font-medium">{task.jobTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.scheduledTime} • {task.employer.name}
                            </p>
                            {task.workLocation?.address && (
                              <p className="text-xs text-muted-foreground truncate">
                                📍 {task.workLocation.address}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
