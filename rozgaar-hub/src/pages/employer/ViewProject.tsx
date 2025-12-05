import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, IndianRupee, Users, Clock, Briefcase, ArrowLeft, Edit, Loader2, Star, Phone, CheckCircle, UserPlus } from "lucide-react";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";

interface Application {
    _id: string;
    workerId: {
        _id: string;
        name: string;
        phone: string;
        profilePhoto: string;
        skills: string[];
        rating: number;
        averageRating?: number;
        totalRatings?: number;
        completedJobs: number;
        verified: boolean;
        location: {
            state: string;
            city: string;
        };
    };
    status: string;
    appliedDate: string;
    message: string;
}

export default function ViewProject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [applicationsLoading, setApplicationsLoading] = useState(true);

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

    useEffect(() => {
        const fetchApplications = async () => {
            if (!id) return;

            try {
                setApplicationsLoading(true);
                const response = await employerAPI.getApplications(id) as any;
                if (response.success) {
                    setApplications(response.applications || []);
                }
            } catch (error) {
                console.error("Error fetching applications:", error);
                toast.error("Failed to load applications");
            } finally {
                setApplicationsLoading(false);
            }
        };

        if (id) {
            fetchApplications();
        }
    }, [id]);

    const handleStatusUpdate = async (applicationId: string, status: 'accepted' | 'rejected' | 'hired') => {
        try {
            const response = await employerAPI.updateApplication(applicationId, { status }) as any;
            if (response.success) {
                toast.success(`Application ${status} successfully!`);
                // Refresh applications
                const refreshResponse = await employerAPI.getApplications(id!) as any;
                if (refreshResponse.success) {
                    setApplications(refreshResponse.applications || []);
                }
            }
        } catch (error: any) {
            console.error("Error updating application:", error);
            toast.error(error.message || "Failed to update application");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        };
        return variants[status] || "bg-gray-100 text-gray-800";
    };

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
                <div className="container mx-auto p-4 md:p-8 max-w-6xl">
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

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Job Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Job Details Card */}
                            <Card className="shadow-card">
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
                        </div>

                        {/* Right Column - Applications */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-card sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Applications</span>
                                        <Badge variant="secondary">{applications.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {applicationsLoading ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                            <p className="text-sm text-muted-foreground">Loading applications...</p>
                                        </div>
                                    ) : applications.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Briefcase className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">No applications yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                            {applications.map((application) => (
                                                <Card key={application._id} className="border">
                                                    <CardContent className="p-4 space-y-3">
                                                        {/* Worker Info */}
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={application.workerId.profilePhoto} />
                                                                <AvatarFallback className="gradient-saffron text-white text-sm">
                                                                    {application.workerId.name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm truncate">
                                                                    {application.workerId.name}
                                                                </p>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                                    <span>{application.workerId.averageRating?.toFixed(1) || application.workerId.rating?.toFixed(1) || "0.0"}</span>
                                                                </div>
                                                            </div>
                                                            {application.workerId.verified && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Status */}
                                                        <Badge className={`text-xs ${getStatusBadge(application.status)}`}>
                                                            {application.status}
                                                        </Badge>

                                                        {/* Location & Phone */}
                                                        <div className="space-y-1 text-xs text-muted-foreground">
                                                            {application.workerId.location && (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>{application.workerId.location.city}, {application.workerId.location.state}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{application.workerId.phone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Applied {new Date(application.appliedDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>

                                                        {/* Skills */}
                                                        {application.workerId.skills && application.workerId.skills.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {application.workerId.skills.slice(0, 3).map((skill) => (
                                                                    <Badge key={skill} variant="outline" className="text-xs">
                                                                        {skill}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Message */}
                                                        {application.message && (
                                                            <div className="bg-muted/50 p-2 rounded text-xs">
                                                                <p className="italic line-clamp-2">"{application.message}"</p>
                                                            </div>
                                                        )}

                                                        <Separator />

                                                        {/* Action Buttons */}
                                                        {application.status === "pending" ? (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    onClick={() => handleStatusUpdate(application._id, 'hired')}
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Hire
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="flex-1"
                                                                    onClick={() => handleStatusUpdate(application._id, 'rejected')}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" variant="secondary" disabled className="w-full">
                                                                {application.status === 'hired' ? 'Worker Hired' : application.status === 'accepted' ? 'Accepted' : 'Rejected'}
                                                            </Button>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
