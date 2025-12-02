import { useState, useEffect } from "react";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Briefcase,
    MapPin,
    Star,
    Phone,
    Calendar,
    CheckCircle,
    UserPlus,
    IndianRupee
} from "lucide-react";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    jobId: {
        _id: string;
        title: string;
        location: {
            state: string;
            city: string;
        };
        payType: string;
        payAmount: number;
        status: string;
    };
    status: string;
    appliedDate: string;
    message: string;
}

export default function Applications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [hireDialogOpen, setHireDialogOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [hiring, setHiring] = useState(false);

    const [hireForm, setHireForm] = useState({
        jobTitle: "",
        jobDescription: "",
        state: "",
        city: "",
        salaryType: "daily",
        salaryAmount: "",
        message: ""
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await employerAPI.getAllApplications() as any;

            if (response.success) {
                setApplications(response.applications || []);
            }
        } catch (error: any) {
            console.error("Error fetching applications:", error);
            toast.error(error.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const handleHireClick = (application: Application) => {
        setSelectedApplication(application);
        setHireForm({
            jobTitle: application.jobId.title || "",
            jobDescription: "",
            state: application.jobId.location?.state || "",
            city: application.jobId.location?.city || "",
            salaryType: application.jobId.payType || "daily",
            salaryAmount: application.jobId.payAmount?.toString() || "",
            message: ""
        });
        setHireDialogOpen(true);
    };

    const handleHireSubmit = async () => {
        if (!selectedApplication) return;

        if (!hireForm.jobTitle || !hireForm.salaryAmount) {
            toast.error("Please fill in job title and salary");
            return;
        }

        try {
            setHiring(true);
            const response = await employerAPI.hireWorker({
                workerId: selectedApplication.workerId._id,
                jobId: selectedApplication.jobId._id,
                applicationId: selectedApplication._id,
                jobTitle: hireForm.jobTitle,
                jobDescription: hireForm.jobDescription,
                jobLocation: {
                    state: hireForm.state,
                    city: hireForm.city
                },
                salaryType: hireForm.salaryType,
                salaryAmount: parseFloat(hireForm.salaryAmount),
                message: hireForm.message
            }) as any;

            if (response.success) {
                toast.success("Hire request sent successfully!");
                setHireDialogOpen(false);
                setSelectedApplication(null);
                setHireForm({
                    jobTitle: "",
                    jobDescription: "",
                    state: "",
                    city: "",
                    salaryType: "daily",
                    salaryAmount: "",
                    message: ""
                });
            }
        } catch (error: any) {
            console.error("Error hiring worker:", error);
            toast.error(error.message || "Failed to send hire request");
        } finally {
            setHiring(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        return variants[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="flex min-h-screen bg-background">
            <EmployerSidebar />

            <main className="flex-1 md:ml-64">
                <div className="container mx-auto p-4 md:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Job Applications</h1>
                        <p className="text-muted-foreground">
                            Review applications and hire workers for your projects
                        </p>
                    </div>

                    {/* Applications Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading applications...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
                            <p className="text-muted-foreground">
                                When workers apply to your job postings, they'll appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {applications.map((application, index) => (
                                <motion.div
                                    key={application._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="shadow-card hover:shadow-elevated transition-all duration-200 h-full flex flex-col">
                                        <CardHeader className="pb-3">
                                            {/* Worker Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={application.workerId.profilePhoto} />
                                                    <AvatarFallback className="gradient-saffron text-white">
                                                        {application.workerId.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-base truncate">
                                                        {application.workerId.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                            <span>{application.workerId.averageRating?.toFixed(1) || application.workerId.rating?.toFixed(1) || "0.0"}</span>
                                                        </div>
                                                        <span>•</span>
                                                        <span>{application.workerId.totalRatings || application.workerId.completedJobs || 0} ratings</span>
                                                    </div>
                                                </div>
                                                {application.workerId.verified && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Verified
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Job Title */}
                                            <div className="flex items-start gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-semibold">{application.jobId.title}</p>
                                                    <Badge className={`text-xs mt-1 ${getStatusBadge(application.status)}`}>
                                                        {application.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-3">
                                            {/* Location */}
                                            {(application.workerId.location?.city || application.workerId.location?.state) && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {application.workerId.location?.city && application.workerId.location?.state
                                                            ? `${application.workerId.location.city}, ${application.workerId.location.state}`
                                                            : "Location not set"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Phone */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{application.workerId.phone}</span>
                                            </div>

                                            {/* Applied Date */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>Applied {formatDate(application.appliedDate)}</span>
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

                                            {/* Application Message */}
                                            {application.message && (
                                                <div className="bg-muted/50 p-2 rounded text-sm">
                                                    <p className="italic line-clamp-2">"{application.message}"</p>
                                                </div>
                                            )}

                                            <Separator />

                                            {/* Job Pay */}
                                            <div className="flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-bold text-primary">
                                                    ₹{application.jobId.payAmount}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {application.jobId.payType}
                                                </Badge>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-4">
                                            <Button
                                                className="w-full gradient-hero text-white"
                                                onClick={() => handleHireClick(application)}
                                                disabled={application.status !== "pending"}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                {application.status === "pending" ? "Hire Worker" : "Already Processed"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Hire Dialog */}
            <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Hire {selectedApplication?.workerId.name}</DialogTitle>
                        <DialogDescription>
                            Fill in the job details to send a hiring request to this worker.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="jobTitle">Job Title *</Label>
                            <Input
                                id="jobTitle"
                                value={hireForm.jobTitle}
                                onChange={(e) => setHireForm({ ...hireForm, jobTitle: e.target.value })}
                                placeholder="e.g., Plumber for Home Repair"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="jobDescription">Job Description</Label>
                            <Textarea
                                id="jobDescription"
                                value={hireForm.jobDescription}
                                onChange={(e) => setHireForm({ ...hireForm, jobDescription: e.target.value })}
                                placeholder="Describe the work to be done..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={hireForm.state}
                                    onChange={(e) => setHireForm({ ...hireForm, state: e.target.value })}
                                    placeholder="State"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={hireForm.city}
                                    onChange={(e) => setHireForm({ ...hireForm, city: e.target.value })}
                                    placeholder="City"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="salaryType">Salary Type *</Label>
                                <Select
                                    value={hireForm.salaryType}
                                    onValueChange={(value) => setHireForm({ ...hireForm, salaryType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="fixed">Fixed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="salaryAmount">Amount (₹) *</Label>
                                <Input
                                    id="salaryAmount"
                                    type="number"
                                    value={hireForm.salaryAmount}
                                    onChange={(e) => setHireForm({ ...hireForm, salaryAmount: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message">Message to Worker</Label>
                            <Textarea
                                id="message"
                                value={hireForm.message}
                                onChange={(e) => setHireForm({ ...hireForm, message: e.target.value })}
                                placeholder="Any additional message..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHireDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleHireSubmit}
                            disabled={hiring}
                            className="gradient-hero text-white"
                        >
                            {hiring ? "Sending..." : "Send Hire Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
