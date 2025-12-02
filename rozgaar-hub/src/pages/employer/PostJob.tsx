import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, Loader2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { employerAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { indianLocations } from "@/lib/locationData";

const skillOptions = ["Construction", "Plumbing", "Electrical", "Painting", "Carpentry", "Cleaning"];

const predefinedJobRoles = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Driver",
  "Construction Worker",
  "Cleaner",
  "Gardener",
  "Mechanic",
  "Cook",
  "Security Guard",
  "Mason",
  "Welder",
  "Tailor",
  "Beautician"
];

export default function PostJob() {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [customJobTitles, setCustomJobTitles] = useState<string[]>([]);
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [addingJobTitle, setAddingJobTitle] = useState(false);
  const [openJobCombobox, setOpenJobCombobox] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

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
  });

  const [loading, setLoading] = useState(false);

  // Fetch custom job titles on mount
  useEffect(() => {
    const fetchCustomJobTitles = async () => {
      try {
        const response = await employerAPI.getJobTitles() as any;
        if (response.success && response.jobTitles) {
          setCustomJobTitles(response.jobTitles.map((jt: any) => jt.title));
        }
      } catch (error) {
        console.error("Error fetching custom job titles:", error);
      }
    };

    fetchCustomJobTitles();
  }, []);

  // Combine predefined and custom job titles
  const allJobRoles = [...predefinedJobRoles, ...customJobTitles];

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

  const handleAddCustomJobTitle = async () => {
    if (!newJobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }

    try {
      setAddingJobTitle(true);
      const response = await employerAPI.createJobTitle(newJobTitle.trim()) as any;

      if (response.success) {
        toast.success("Custom job title added successfully!");
        setCustomJobTitles(prev => [...prev, newJobTitle.trim()]);
        setFormData(prev => ({ ...prev, title: newJobTitle.trim() }));
        setNewJobTitle("");
        setShowAddJobDialog(false);
      }
    } catch (error: any) {
      console.error("Error adding custom job title:", error);
      toast.error(error.message || "Failed to add custom job title");
    } finally {
      setAddingJobTitle(false);
    }
  };

  const handleLiveLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    toast.info("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use Nominatim reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();

          if (data && data.address) {
            const state = data.address.state || "";
            const city = data.address.city || data.address.town || data.address.village || "";

            if (state && city) {
              // Try to match with our predefined states
              const matchedState = Object.keys(indianLocations).find(
                s => s.toLowerCase() === state.toLowerCase()
              );

              if (matchedState) {
                setSelectedState(matchedState);

                // Try to match city
                const matchedCity = indianLocations[matchedState].find(
                  c => c.toLowerCase() === city.toLowerCase()
                );

                if (matchedCity) {
                  setSelectedCity(matchedCity);
                  handleLocationChange(matchedState, matchedCity);
                  toast.success(`Location detected: ${matchedCity}, ${matchedState}`);
                } else {
                  // City not in our list, just set the state
                  handleLocationChange(matchedState, "");
                  toast.warning(`State detected: ${matchedState}. Please select city manually.`);
                }
              } else {
                toast.warning("Could not match location. Please select manually.");
              }
            } else {
              toast.error("Could not determine location details");
            }
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          toast.error("Failed to detect location. Please select manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable location access.");
        } else {
          toast.error("Failed to get your location");
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Please select a job title");
      return;
    }

    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    try {
      setLoading(true);
      const jobData = {
        ...formData,
        skills: selectedSkills,
        payAmount: Number(formData.payAmount),
        teamSize: formData.teamRequired ? Number(formData.teamSize) : 1
      };

      await employerAPI.createJob(jobData);
      toast.success("Job posted successfully!");
      navigate("/employer/projects");
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast.error(error.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Post a New Job</h1>
            <p className="text-muted-foreground">
              Find the perfect worker or team for your project
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Title with Searchable Combobox */}
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Popover open={openJobCombobox} onOpenChange={setOpenJobCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openJobCombobox}
                        className="w-full justify-between"
                      >
                        {formData.title || "Select job role..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search job role..." />
                        <CommandEmpty>No job role found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {allJobRoles.map((role) => (
                            <CommandItem
                              key={role}
                              value={role}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, title: currentValue });
                                setOpenJobCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.title === role ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {role}
                            </CommandItem>
                          ))}
                          <CommandItem
                            onSelect={() => {
                              setOpenJobCombobox(false);
                              setShowAddJobDialog(true);
                            }}
                            className="border-t bg-muted/50"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Job Title
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

                {/* Location with Live Detection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Location</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLiveLocation}
                      disabled={detectingLocation}
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Use Live Location
                        </>
                      )}
                    </Button>
                  </div>
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

                <Button type="submit" className="w-full gradient-hero text-white" size="lg" disabled={loading}>
                  {loading ? "Posting..." : "Post Job"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Custom Job Title Dialog */}
      <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Job Title</DialogTitle>
            <DialogDescription>
              Enter a custom job title that's not in the list. It will be saved for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newJobTitle">Job Title</Label>
              <Input
                id="newJobTitle"
                placeholder="e.g., Tile Installer"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomJobTitle();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddJobDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomJobTitle} disabled={addingJobTitle}>
              {addingJobTitle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Job Title"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
