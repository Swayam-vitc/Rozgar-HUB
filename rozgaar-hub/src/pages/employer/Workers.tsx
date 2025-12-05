import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Star, MapPin, CheckCircle } from "lucide-react";
import { StreakBadge } from "@/components/StreakBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { employerAPI } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [hiring, setHiring] = useState(false);

  const [hireForm, setHireForm] = useState({
    jobTitle: "",
    jobDescription: "",
    state: "",
    city: "",
    salaryType: "daily",
    salaryAmount: "",
    message: "",
    scheduledDate: "",
    scheduledTime: "",
    workAddress: ""
  });

  const fetchWorkers = async (query = "") => {
    try {
      setLoading(true);
      const params: any = {};
      if (query) {
        params.skills = query;
      }

      const response = await employerAPI.searchWorkers(params) as any;
      if (response.success) {
        setWorkers(response.workers);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkers(searchQuery);
  };

  const handleViewProfile = (workerId: string) => {
    navigate(`/employer/worker/${workerId}`);
  };

  const handleHireClick = (worker: any) => {
    setSelectedWorker(worker);
    setHireForm({
      jobTitle: "",
      jobDescription: "",
      state: worker.location?.state || "",
      city: worker.location?.city || "",
      salaryType: "daily",
      salaryAmount: worker.dailyRate?.toString() || "",
      message: "",
      scheduledDate: "",
      scheduledTime: "",
      workAddress: ""
    });
    setHireDialogOpen(true);
  };

  const handleHireSubmit = async () => {
    if (!selectedWorker) return;

    if (!hireForm.jobTitle || !hireForm.salaryAmount) {
      toast.error("Please fill in job title and salary");
      return;
    }

    try {
      setHiring(true);
      const response = await employerAPI.hireWorker({
        workerId: selectedWorker._id,
        jobTitle: hireForm.jobTitle,
        jobDescription: hireForm.jobDescription,
        jobLocation: {
          state: hireForm.state,
          city: hireForm.city
        },
        salaryType: hireForm.salaryType,
        salaryAmount: parseFloat(hireForm.salaryAmount),
        message: hireForm.message,
        scheduledDate: hireForm.scheduledDate,
        scheduledTime: hireForm.scheduledTime,
        workAddress: hireForm.workAddress
      }) as any;

      if (response.success) {
        toast.success("Hire request sent successfully!");
        setHireDialogOpen(false);
        setSelectedWorker(null);
        setHireForm({
          jobTitle: "",
          jobDescription: "",
          state: "",
          city: "",
          salaryType: "daily",
          salaryAmount: "",
          message: "",
          scheduledDate: "",
          scheduledTime: "",
          workAddress: ""
        });
      }
    } catch (error: any) {
      console.error("Error hiring worker:", error);
      toast.error(error.message || "Failed to send hire request");
    } finally {
      setHiring(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Workers</h1>
            <p className="text-muted-foreground">
              Search and hire verified workers for your projects
            </p>
          </div>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by skills..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>

          {/* Workers Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">Loading workers...</div>
            ) : workers.length === 0 ? (
              <div className="col-span-full text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-lg text-muted-foreground">No workers found matching your criteria</p>
              </div>
            ) : (
              workers.map((worker) => (
                <Card key={worker._id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-3">
                        <AvatarImage src={worker.profilePhoto} />
                        <AvatarFallback>{worker.name[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg mb-1">{worker.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{worker.averageRating?.toFixed(1) || worker.rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-sm text-muted-foreground">
                          ({worker.totalRatings || worker.completedJobs || 0} ratings)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        {worker.location?.city && worker.location?.state
                          ? `${worker.location.city}, ${worker.location.state}`
                          : "Location not set"}
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mb-4">
                      <StreakBadge streak={worker.streak || 0} />
                      <LevelBadge level={worker.level || "bronze"} />
                      {worker.verified && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {worker.skills && worker.skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">Daily Rate</p>
                      <p className="text-xl font-bold text-primary">₹{worker.dailyRate || 0}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => handleViewProfile(worker._id)}
                      >
                        View Profile
                      </Button>
                      <Button
                        className="flex-1 gradient-hero text-white"
                        size="sm"
                        onClick={() => handleHireClick(worker)}
                      >
                        Hire
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Hire Dialog */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hire {selectedWorker?.name}</DialogTitle>
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

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Schedule & Location (Optional)</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid gap-2">
                  <Label htmlFor="scheduledDate">Work Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={hireForm.scheduledDate}
                    onChange={(e) => setHireForm({ ...hireForm, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduledTime">Work Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={hireForm.scheduledTime}
                    onChange={(e) => setHireForm({ ...hireForm, scheduledTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workAddress">Work Address</Label>
                <Input
                  id="workAddress"
                  value={hireForm.workAddress}
                  onChange={(e) => setHireForm({ ...hireForm, workAddress: e.target.value })}
                  placeholder="Enter full work address..."
                />
                <p className="text-xs text-muted-foreground">
                  Worker will see this in their calendar
                </p>
              </div>
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
