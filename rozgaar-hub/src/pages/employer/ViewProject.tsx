import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, IndianRupee, Users, Clock, Briefcase, ArrowLeft, Edit, Loader2 } from "lucide-react";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function ViewProject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) {
                toast.error("Job ID not provided");
                navigate("/employer/projects");
                return;
            }

            try {
                setLoading(true);
                const response = await employerAPI.getJobs({ id }) as any;

                if (response.success && response.jobs && response.jobs.length > 0) {
                    setJob(response.jobs[0]);
                } else {
                    toast.error("Job not found");
                    navigate("/employer/projects");
                }
            } catch (error) {
                console.error("Error fetching job:", error);
                toast.error("Failed to load job details");
                navigate("/employer/projects");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <EmployerSidebar />

            <main className="flex-1 md:ml-64">
                <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/employer/projects")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Projects
                        </Button>
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">{job.title}</h1>
                                <p className="text-muted-foreground">
                                    Posted on {new Date(job.postedDate || job.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate(`/employer/projects/${id}/edit`)}
                                className="gradient-hero text-white"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                            </Button>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6">
                        <Badge
                            variant={
                                job.status === "open"
                                    ? "default"
                                    : job.status === "in-progress"
                                        ? "secondary"
                                        : "outline"
                            }
                            className="text-lg px-4 py-2"
                        >
                            {job.status}
                        </Badge>
                    </div>

                    {/* Job Details Card */}
                    <Card className="mb-6 shadow-card">
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                            </div>

                            {/* Location */}
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </h3>
                                <p className="text-muted-foreground">{job.location?.city}, {job.location?.state}</p>
                            </div>

                            {/* Payment Details */}
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4" />
                                    Payment
                                </h3>
                                <div className="flex items-center gap-4">
                                    <p className="text-2xl font-bold text-primary">₹{job.payAmount}</p>
                                    <Badge variant="outline">{job.payType}</Badge>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Start Date
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {new Date(job.startDate).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Duration
                                    </h3>
                                    <p className="text-muted-foreground">{job.duration}</p>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div>
                                <h3 className="font-semibold mb-2">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills && job.skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Team Requirements */}
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Requirements
                                </h3>
                                {job.teamRequired ? (
                                    <p className="text-muted-foreground">
                                        Team of {job.teamSize} workers required
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">Single worker</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employer Info Card */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>Employer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-1">Posted By</h3>
                                <p className="text-muted-foreground">{job.employerName}</p>
                            </div>
                            {job.employerId && (
                                <div>
                                    <h3 className="font-semibold mb-1">Employer ID</h3>
                                    <p className="text-muted-foreground text-sm font-mono">{job.employerId}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/employer/projects")}
                            className="flex-1"
                        >
                            Back to Projects
                        </Button>
                        <Button
                            onClick={() => navigate(`/employer/projects/${id}/edit`)}
                            className="flex-1 gradient-hero text-white"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Project
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
