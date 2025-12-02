import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Star,
    MapPin,
    CheckCircle,
    IndianRupee,
    Briefcase,
    ArrowLeft,
    Award
} from "lucide-react";
import { StreakBadge } from "@/components/StreakBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function WorkerProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [worker, setWorker] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hiring, setHiring] = useState(false);

    useEffect(() => {
        fetchWorkerProfile();
    }, [id]);

    const fetchWorkerProfile = async () => {
        try {
            setLoading(true);
            const response = await employerAPI.getWorkerProfile(id!) as any;
            if (response.success) {
                setWorker(response.worker);
            }
        } catch (error: any) {
            console.error("Error fetching worker profile:", error);
            toast.error(error.message || "Failed to load worker profile");
            navigate("/employer/workers");
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async () => {
        try {
            setHiring(true);
            const response = await employerAPI.hireWorker({
                workerId: id!
            }) as any;

            if (response.success) {
                toast.success("Hiring request sent successfully!");
            }
        } catch (error: any) {
            console.error("Error hiring worker:", error);
            toast.error(error.message || "Failed to send hiring request");
        } finally {
            setHiring(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <EmployerSidebar />
                <main className="flex-1 md:ml-64">
                    <div className="container mx-auto p-4 md:p-8">
                        <div className="text-center py-12">Loading worker profile...</div>
                    </div>
                </main>
            </div>
        );
    }

    if (!worker) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <EmployerSidebar />

            <main className="flex-1 md:ml-64">
                <div className="container mx-auto p-4 md:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/employer/workers")}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Workers
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-bold">Worker Profile</h1>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Left Column - Profile Card */}
                        <div className="md:col-span-1">
                            <Card className="shadow-card">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center">
                                        <Avatar className="h-32 w-32 mb-4">
                                            <AvatarImage src={worker.profilePhoto} />
                                            <AvatarFallback className="text-3xl">
                                                {worker.name[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <h2 className="text-2xl font-bold mb-2">{worker.name}</h2>

                                        <div className="flex items-center gap-1 mb-3">
                                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                            <span className="font-semibold text-lg">
                                                {worker.averageRating?.toFixed(1) || worker.rating?.toFixed(1) || "0.0"}
                                            </span>
                                            <span className="text-sm text-muted-foreground ml-1">
                                                ({worker.totalRatings || worker.completedJobs || 0} ratings)
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-muted-foreground mb-4">
                                            <MapPin className="h-4 w-4" />
                                            <span>
                                                {worker.location?.city && worker.location?.state
                                                    ? `${worker.location.city}, ${worker.location.state}`
                                                    : "Location not set"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                                            <StreakBadge streak={worker.streak || 0} />
                                            <LevelBadge level={worker.level || "bronze"} />
                                            {worker.verified && (
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Rates */}
                                        <div className="w-full space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Daily Rate</span>
                                                <div className="flex items-center gap-1 font-bold text-lg">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {worker.dailyRate || 0}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                                                <div className="flex items-center gap-1 font-bold text-lg">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {worker.hourlyRate || 0}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Total Earnings</span>
                                                <div className="flex items-center gap-1 font-bold text-lg">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {worker.totalEarnings || 0}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Hire Button */}
                                        <Button
                                            className="w-full gradient-hero text-white"
                                            size="lg"
                                            onClick={handleHire}
                                            disabled={hiring}
                                        >
                                            {hiring ? "Sending Request..." : "Hire Worker"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Details */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Skills */}
                            <Card className="shadow-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5" />
                                        Skills & Expertise
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {worker.skills && worker.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {worker.skills.map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No skills listed</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* About/Bio */}
                            <Card className="shadow-card">
                                <CardHeader>
                                    <CardTitle>About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {worker.bio ? (
                                        <p className="text-muted-foreground leading-relaxed">{worker.bio}</p>
                                    ) : (
                                        <p className="text-muted-foreground italic">No bio available</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Work Experience Stats */}
                            <Card className="shadow-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Work Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {worker.completedJobs || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Completed Jobs
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {worker.averageRating?.toFixed(1) || worker.rating?.toFixed(1) || "0.0"}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Average Rating
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {worker.streak || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Day Streak
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Work Photos */}
                            {worker.workPhotos && worker.workPhotos.length > 0 && (
                                <Card className="shadow-card">
                                    <CardHeader>
                                        <CardTitle>Work Portfolio</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {worker.workPhotos.map((photo: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                                                >
                                                    <img
                                                        src={photo}
                                                        alt={`Work ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
