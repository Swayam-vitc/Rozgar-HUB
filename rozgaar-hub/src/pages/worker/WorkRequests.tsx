import { useState, useEffect } from "react";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Briefcase,
    MapPin,
    IndianRupee,
    Calendar,
    CheckCircle,
    XCircle,
    Phone,
    MessageCircle
} from "lucide-react";
import { workerAPI } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function WorkRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchHireRequests();
    }, []);

    const fetchHireRequests = async () => {
        try {
            setLoading(true);

            // Fetch pending requests
            const pendingResponse = await workerAPI.getHireRequests({ status: 'pending' }) as any;
            const pendingData = pendingResponse.data || pendingResponse;
            if (pendingData.success) {
                setRequests(pendingData.hireRequests || []);
            }

            // Fetch accepted requests (not completed)
            const acceptedResponse = await workerAPI.getHireRequests({ status: 'accepted' }) as any;
            const acceptedData = acceptedResponse.data || acceptedResponse;
            if (acceptedData.success) {
                // Filter out completed requests
                const activeAccepted = (acceptedData.hireRequests || []).filter((req: any) => !req.completed);
                setAcceptedRequests(activeAccepted);
            }
        } catch (error: any) {
            console.error("Error fetching hire requests:", error);
            toast.error(error.message || "Failed to load work requests");
        } finally {
            setLoading(false);
        }
    };


    const handleAccept = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            const response = await workerAPI.updateHireRequest(requestId, { status: 'accepted' }) as any;

            if (response.success) {
                toast.success("Work request accepted! You can now chat with the employer.");
                // Refresh both lists
                fetchHireRequests();
            }
        } catch (error: any) {
            console.error("Error accepting request:", error);
            toast.error(error.message || "Failed to accept work request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            const response = await workerAPI.updateHireRequest(requestId, { status: 'rejected' }) as any;

            if (response.success) {
                toast.success("Work request rejected");
                // Remove from pending list
                setRequests(requests.filter(req => req._id !== requestId));
            }
        } catch (error: any) {
            console.error("Error rejecting request:", error);
            toast.error(error.message || "Failed to reject work request");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex min-h-screen bg-background">
            <WorkerSidebar />

            <main className="flex-1 md:ml-64 pb-20 md:pb-0">
                <div className="container mx-auto p-4 md:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Work Requests</h1>
                        <p className="text-muted-foreground">
                            Review and Respond to Hiring Requests From Employers
                        </p>
                    </div>

                    {/* Requests Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading work requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
                            <p className="text-muted-foreground">
                                You don't have any pending work requests at the moment.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((request, index) => (
                                <motion.div
                                    key={request._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className="shadow-card hover:shadow-elevated transition-all duration-200 h-full flex flex-col">
                                        <CardHeader className="pb-3">
                                            {/* Employer Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={request?.employerPhoto} />
                                                    <AvatarFallback className="gradient-saffron text-white">
                                                        {request?.employerName?.[0] || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm">{request?.employerName || "Unknown Employer"}</h3>
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{request?.employerPhoneNumber || "No phone available"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{request?.createdAt ? formatDate(request.createdAt) : "Date unknown"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Job Title */}
                                            <h2 className="text-xl font-bold leading-tight mb-2">
                                                {request?.jobTitle || "General Work Request"}
                                            </h2>
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-3">
                                            {/* Job Description */}
                                            {request?.jobDescription && (
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {request.jobDescription}
                                                </p>
                                            )}

                                            {request?.message && (
                                                <div className="bg-muted/50 p-3 rounded-lg">
                                                    <p className="text-sm italic">"{request.message}"</p>
                                                </div>
                                            )}

                                            <Separator />

                                            {/* Location */}
                                            {(request?.jobLocation?.city || request?.jobLocation?.state) && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {[request?.jobLocation?.city, request?.jobLocation?.state]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Salary */}
                                            {(request?.salaryAmount || 0) > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-bold text-lg text-primary">
                                                            ₹{request.salaryAmount}
                                                        </span>
                                                        {request?.salaryType && (
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                {request.salaryType}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="pt-4 flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleReject(request._id)}
                                                disabled={processingId === request._id}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="flex-1 gradient-hero text-white"
                                                onClick={() => handleAccept(request._id)}
                                                disabled={processingId === request._id}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                {processingId === request._id ? "Processing..." : "Accept Work"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Accepted Requests Section - Show Chat Option */}
                    {!loading && acceptedRequests.length > 0 && (
                        <div className="mt-12">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2">Accepted Jobs</h2>
                                <p className="text-muted-foreground">
                                    Jobs You've Accepted - Click Chat to Message the Employer
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {acceptedRequests.map((request, index) => (
                                    <motion.div
                                        key={request._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Card className="shadow-card hover:shadow-elevated transition-all duration-200 h-full flex flex-col border-l-4 border-l-green-500">
                                            <CardHeader className="pb-3">
                                                {/* Employer Info */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={request?.employerPhoto} />
                                                        <AvatarFallback className="gradient-saffron text-white">
                                                            {request?.employerName?.[0] || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-sm">{request?.employerName || "Unknown Employer"}</h3>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{request?.employerPhoneNumber || "No phone available"}</span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                        Active
                                                    </Badge>
                                                </div>

                                                {/* Job Title */}
                                                <h2 className="text-xl font-bold leading-tight mb-2">
                                                    {request?.jobTitle || "General Work Request"}
                                                </h2>
                                            </CardHeader>

                                            <CardContent className="flex-1 space-y-3">
                                                {/* Job Description */}
                                                {request?.jobDescription && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {request.jobDescription}
                                                    </p>
                                                )}

                                                <Separator />

                                                {/* Location */}
                                                {(request?.jobLocation?.city || request?.jobLocation?.state) && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {[request?.jobLocation?.city, request?.jobLocation?.state]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Salary */}
                                                {(request?.salaryAmount || 0) > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="font-bold text-lg text-primary">
                                                                ₹{request.salaryAmount}
                                                            </span>
                                                            {request?.salaryType && (
                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                    {request.salaryType}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>

                                            <CardFooter className="pt-4">
                                                <Button
                                                    className="w-full gradient-hero text-white"
                                                    onClick={() => navigate('/worker/messages')}
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                    Chat with Employer
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
