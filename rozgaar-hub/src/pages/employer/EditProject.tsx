import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { employerAPI } from "@/lib/api";

const skillOptions = ["Construction", "Plumbing", "Electrical", "Painting", "Carpentry", "Cleaning"];

const indianLocations: { [key: string]: string[] } = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"]
};

export default function EditProject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        payAmount: "",
        payType: "daily" as "hourly" | "daily" | "fixed",
        duration: "",
        startDate: "",
        teamRequired: false,
        teamSize: "",
        status: "open" as "open" | "in-progress" | "closed",
    });

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) {
                toast.error("Job ID not provided");
                navigate("/employer/projects");
                return;
            }

            try {
                setLoading(true);
                console.log("Fetching job with ID:", id);
                const response = await employerAPI.getJobById(id) as any;
                console.log("Job fetch response:", response);

                if (response.success && response.job) {
                    const job = response.job;
                    console.log("Job data:", job);

                    // Handle location - it's an object with city and state properties
                    let locationString = "";
                    let city = "";
                    let state = "";

                    if (job.location) {
                        if (typeof job.location === 'string') {
                            // If it's a string, parse it
                            const locationParts = job.location.split(", ");
                            city = locationParts[0] || "";
                            state = locationParts[1] || "";
                            locationString = job.location;
                        } else if (typeof job.location === 'object') {
                            // If it's an object, extract city and state
                            city = job.location.city || "";
                            state = job.location.state || "";
                            locationString = city && state ? `${city}, ${state}` : (city || state || "");
                        }
                    }

                    setFormData({
                        title: job.title || "",
                        description: job.description || "",
                        location: locationString,
                        payAmount: job.payAmount?.toString() || "",
                        payType: job.payType || "daily",
                        duration: job.duration || "",
                        startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : "",
                        teamRequired: job.teamRequired || false,
                        teamSize: job.teamSize?.toString() || "",
                        status: job.status || "open",
                    });

                    setSelectedSkills(job.skills || []);
                    setSelectedState(state);
                    setSelectedCity(city);
                } else {
                    console.error("Job not found in response:", response);
                    toast.error("Job not found");
                    navigate("/employer/projects");
                }
            } catch (error: any) {
                console.error("Error fetching job:", error);
                console.error("Error details:", error.response?.data || error.message);
                toast.error(error.response?.data?.message || "Failed to load job details");
                navigate("/employer/projects");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id, navigate]);

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const handleLocationChange = (state: string, city: string) => {
        setSelectedState(state);
        setSelectedCity(city);
        if (state && city) {
            setFormData(prev => ({ ...prev, location: `${city}, ${state}` }));
        } else if (state) {
            setFormData(prev => ({ ...prev, location: state }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedSkills.length === 0) {
            toast.error("Please select at least one skill");
            return;
        }

        if (!formData.title || !formData.description || !formData.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!formData.payAmount || Number(formData.payAmount) <= 0) {
            toast.error("Please enter a valid payment amount");
            return;
        }

        try {
            setSaving(true);
            const jobData = {
                ...formData,
                location: {
                    city: selectedCity,
                    state: selectedState
                },
                skills: selectedSkills,
                payAmount: Number(formData.payAmount),
                teamSize: formData.teamRequired ? Number(formData.teamSize) : 1
            };

            console.log("Updating job with data:", jobData);
            const response = await employerAPI.updateJob(id!, jobData);
            console.log("Update response:", response);

            toast.success("Job updated successfully!");
            navigate(`/employer/projects/${id}`);
        } catch (error: any) {
            console.error("Error updating job:", error);
            console.error("Error details:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || error.message || "Failed to update job");
        } finally {
            setSaving(false);
        }
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

    return (
        <div className="flex min-h-screen bg-background">
            <EmployerSidebar />

            <main className="flex-1 md:ml-64">
                <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/employer/projects/${id}`)}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Project
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Edit Project</h1>
                        <p className="text-muted-foreground">
                            Update your job posting details
                        </p>
                    </div>

                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Job Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the work, requirements, and any special instructions..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-xs text-muted-foreground">State</Label>
                                            <Select
                                                value={selectedState}
                                                onValueChange={(value) => handleLocationChange(value, "")}
                                            >
                                                <SelectTrigger id="state">
                                                    <SelectValue placeholder="Select State" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(indianLocations).map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                                            <Select
                                                value={selectedCity}
                                                onValueChange={(value) => handleLocationChange(selectedState, value)}
                                                disabled={!selectedState}
                                            >
                                                <SelectTrigger id="city">
                                                    <SelectValue placeholder="Select City" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedState && indianLocations[selectedState]?.map((city) => (
                                                        <SelectItem key={city} value={city}>
                                                            {city}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payType">Payment Type</Label>
                                        <Select
                                            value={formData.payType}
                                            onValueChange={(value: "hourly" | "daily" | "fixed") =>
                                                setFormData({ ...formData, payType: value })
                                            }
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

                                    <div className="space-y-2">
                                        <Label htmlFor="payAmount">Amount (₹)</Label>
                                        <Input
                                            id="payAmount"
                                            type="number"
                                            placeholder="500"
                                            value={formData.payAmount}
                                            onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration</Label>
                                        <Input
                                            id="duration"
                                            placeholder="e.g., 3 days"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Job Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "open" | "in-progress" | "closed") =>
                                            setFormData({ ...formData, status: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label>Required Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {skillOptions.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                                className="cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => toggleSkill(skill)}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>

                                    {selectedSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                            {selectedSkills.map((skill) => (
                                                <Badge key={skill} className="gradient-saffron text-white">
                                                    {skill}
                                                    <X
                                                        className="ml-1 h-3 w-3 cursor-pointer"
                                                        onClick={() => toggleSkill(skill)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg">
                                    <Label className="text-lg">Hiring Preference</Label>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Button
                                            type="button"
                                            variant={!formData.teamRequired ? "default" : "outline"}
                                            className="h-20"
                                            onClick={() => setFormData({ ...formData, teamRequired: false })}
                                        >
                                            <div>
                                                <div className="font-bold">Single Worker</div>
                                                <div className="text-xs">Hire one worker</div>
                                            </div>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={formData.teamRequired ? "default" : "outline"}
                                            className="h-20"
                                            onClick={() => setFormData({ ...formData, teamRequired: true })}
                                        >
                                            <div>
                                                <div className="font-bold">Team</div>
                                                <div className="text-xs">Hire multiple workers</div>
                                            </div>
                                        </Button>
                                    </div>
                                    {formData.teamRequired && (
                                        <div className="space-y-2">
                                            <Label htmlFor="teamSize">Team Size</Label>
                                            <Input
                                                id="teamSize"
                                                type="number"
                                                placeholder="Number of workers needed"
                                                value={formData.teamSize}
                                                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate(`/employer/projects/${id}`)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 gradient-hero text-white"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
