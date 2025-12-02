import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import {
  Briefcase,
  Plus,
  Users,
  Calendar,
  MessageSquare,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0,
    totalSpent: 0,
    paymentsCount: 0
  });
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, jobsRes] = await Promise.all([
          employerAPI.getAnalytics() as Promise<any>,
          employerAPI.getJobs({ status: 'open' }) as Promise<any>
        ]);

        if (analyticsRes.success) {
          setAnalytics(analyticsRes.analytics);
        }

        if (jobsRes.success) {
          setActiveProjects(jobsRes.jobs);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👔</h2>
            <p className="text-muted-foreground">Manage your projects and find the best workers</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Projects"
              value={analytics.activeJobs}
              icon={Briefcase}
              gradient="gradient-saffron"
            />
            <StatCard
              title="Total Applications"
              value={analytics.totalApplications}
              icon={Users}
              gradient="gradient-hero"
            />
            <StatCard
              title="Total Spent"
              value={`₹${analytics.totalSpent.toLocaleString()}`}
              icon={IndianRupee}
            />
            <StatCard
              title="Completed Jobs"
              value={analytics.completedJobs}
              icon={TrendingUp}
              gradient="gradient-success"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/employer/post-job")}
            >
              <Plus className="h-6 w-6" />
              <span>Post Job</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/employer/workers")}
            >
              <Users className="h-6 w-6" />
              <span>Find Workers</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/employer/projects")}
            >
              <Calendar className="h-6 w-6" />
              <span>My Projects</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => navigate("/employer/messages")}
            >
              <MessageSquare className="h-6 w-6" />
              <span>Messages</span>
            </Button>
          </div>

          {/* Active Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading projects...</div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active projects found. Post a job to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.slice(0, 4).map((job) => (
                    <div
                      key={job._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.location?.city}, {job.location?.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{job.budget || job.payAmount}/{job.payType}</p>
                        <p className="text-sm text-muted-foreground capitalize">{job.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
