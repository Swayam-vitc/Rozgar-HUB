import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { StateCitySelector } from "@/components/StateCitySelector";
import type { Location } from "@/lib/indianStatesAndCities";

const commonSkills = [
  "Construction",
  "Plumbing",
  "Electrical",
  "Painting",
  "Carpentry",
  "Cleaning",
  "Delivery",
  "Cooking",
  "Housekeeping",
  "Driving",
];

export default function WorkerOnboarding() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    location: { state: "", city: "" } as Location,
    hourlyRate: "",
    dailyRate: "",
    bio: "",
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill && !selectedSkills.includes(customSkill)) {
      setSelectedSkills([...selectedSkills, customSkill]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        skills: selectedSkills,
        location: formData.location,
        hourlyRate: Number(formData.hourlyRate) || 0,
        dailyRate: Number(formData.dailyRate) || 0,
        bio: formData.bio,
      };

      const response = await authAPI.updateProfile(profileData) as any;

      if (response.success) {
        // Update user in auth store
        if (response.user) {
          setUser(response.user);
        }

        toast.success("Profile completed! Welcome to RozgaarHub!");
        navigate("/worker/dashboard");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Worker Profile</CardTitle>
          <p className="text-muted-foreground">
            Help employers find you by completing your profile
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Skills Selection */}
            <div className="space-y-3">
              <Label>Your Skills</Label>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map((skill) => (
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

              {/* Selected Skills */}
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

              {/* Custom Skill Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                />
                <Button type="button" onClick={addCustomSkill} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            <StateCitySelector
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              required
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="50"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate (₹)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  placeholder="400"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Tell employers about your experience..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-saffron text-white"
              size="lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
