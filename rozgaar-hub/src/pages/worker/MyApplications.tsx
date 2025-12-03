import { useState, useEffect } from "react";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, IndianRupee, Building } from "lucide-react";
import { workerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function MyApplications() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            case "accepted":
                return "default"; // Greenish usually
            case "rejected":
                return "destructive";
            case "pending":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <WorkerSidebar />

            <main className="flex-1 md:ml-64 pb-20 md:pb-0">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Applications</h1>
                        <p className="text-muted-foreground">
                            Track the status of your job applications
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
                                            <div>
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
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1 font-medium">
                                                <IndianRupee className="h-4 w-4" />
                                                {app.jobId?.payAmount}/{app.jobId?.payType}
                                            </div>
                                            {app.status === 'accepted' && (
                                                <Button size="sm" variant="outline">View Details</Button>
                                            )}
                                        </div>
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
