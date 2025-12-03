import { useState, useEffect } from "react";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, IndianRupee, Users } from "lucide-react";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function Projects() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await employerAPI.getJobs({}) as any;
        if (response.success) {
          setJobs(response.jobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">
              Manage your posted jobs and track progress
            </p>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="text-center py-8">Loading projects...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-lg text-muted-foreground mb-4">No projects found</p>
                <Button className="gradient-hero text-white" onClick={() => window.location.href = '/employer/post-job'}>
                  Post a Job
                </Button>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job._id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {typeof job.location === 'object'
                              ? `${job.location.city}, ${job.location.state}`
                              : job.location || "Location"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.startDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {job.payAmount}/{job.payType}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          job.status === "open"
                            ? "default"
                            : job.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills && job.skills.map((skill: string) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {job.teamRequired && (
                          <>
                            <Users className="h-4 w-4" />
                            <span>Team of {job.teamSize}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/employer/projects/${job._id}`}
                        >
                          View Applications
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-hero text-white"
                          onClick={() => window.location.href = `/employer/projects/${job._id}/edit`}
                        >
                          Edit Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
