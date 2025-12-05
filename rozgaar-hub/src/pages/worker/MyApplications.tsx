import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, IndianRupee, Building, ChevronDown, ChevronUp, Clock, Briefcase } from "lucide-react";
import { workerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function MyApplications() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await workerAPI.getApplications() as any;
                if (response.success) {
                    setApplications(response.applications);
                }
            } catch (error) {
                console.error("Error fetching applications:", error);
                toast.error("Failed to load applications");
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "hired":
                return "default"; // Green - most important status
            case "accepted":
                return "secondary"; // Blue-ish
            case "rejected":
                return "destructive";
            case "pending":
                return "outline";
            default:
                return "outline";
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <WorkerSidebar />

            <main className="flex-1 md:ml-64 pb-20 md:pb-0">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Applications</h1>
                        <p className="text-muted-foreground">
                            Track the Status of Your Job Applications
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {loading ? (
                            <div className="text-center py-8">Loading applications...</div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg bg-muted/20">
                                <p className="text-lg text-muted-foreground mb-4">You haven't applied to any jobs yet</p>
                                <Button className="gradient-hero text-white" onClick={() => window.location.href = '/worker/jobs'}>
                                    Browse Jobs
                                </Button>
                            </div>
                        ) : (
                            applications.map((app) => (
                                <Card key={app._id} className="shadow-card hover:shadow-elevated transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl mb-2">{app.jobId?.title || "Job Title Unavailable"}</CardTitle>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Building className="h-4 w-4" />
                                                        {app.jobId?.employerName || "Employer"}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {typeof app.jobId?.location === 'object'
                                                            ? `${app.jobId.location.city}, ${app.jobId.location.state}`
                                                            : app.jobId?.location || "Location"}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        Applied on {new Date(app.appliedDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={getStatusColor(app.status) as any}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Quick Info */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-1 font-medium text-lg">
                                                <IndianRupee className="h-5 w-5 text-green-600" />
                                                <span className="text-green-600">₹{app.jobId?.payAmount}</span>
                                                <span className="text-sm text-muted-foreground">/{app.jobId?.payType}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpand(app._id)}
                                                className="flex items-center gap-1"
                                            >
                                                {expandedId === app._id ? (
                                                    <>
                                                        <span>Hide Details</span>
                                                        <ChevronUp className="h-4 w-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>View Details</span>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === app._id && (
                                            <div className="space-y-4 pt-4 border-t">
                                                {/* Job Description */}
                                                {app.jobId?.description && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <Briefcase className="h-4 w-4" />
                                                            Job Description
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {app.jobId.description}
                                                        </p>
                                                    </div>
                                                )}

                                                <Separator />

                                                {/* Job Details Grid */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {app.jobId?.startDate && (
                                                        <div>
                                                            <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm">
                                                                <Calendar className="h-4 w-4" />
                                                                Start Date
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(app.jobId.startDate).toLocaleDateString('en-IN', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {app.jobId?.duration && (
                                                        <div>
                                                            <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm">
                                                                <Clock className="h-4 w-4" />
                                                                Duration
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{app.jobId.duration}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skills Required */}
                                                {app.jobId?.skills && app.jobId.skills.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 text-sm">Skills Required</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {app.jobId.skills.map((skill: string) => (
                                                                <Badge key={skill} variant="secondary" className="text-xs">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Application Message */}
                                                {app.message && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 text-sm">Your Application Message</h4>
                                                        <div className="bg-muted/50 p-3 rounded-lg">
                                                            <p className="text-sm italic">"{app.message}"</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Status-specific Actions */}
                                                {(app.status === 'accepted' || app.status === 'hired') && (
                                                    <div className="pt-2">
                                                        <Button
                                                            className="w-full gradient-hero text-white"
                                                            onClick={() => navigate('/worker/calendar')}
                                                        >
                                                            View Calendar Event
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
