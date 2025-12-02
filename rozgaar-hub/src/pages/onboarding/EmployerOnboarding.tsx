import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { StateCitySelector } from "@/components/StateCitySelector";
import type { Location } from "@/lib/indianStatesAndCities";

export default function EmployerOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    location: { state: "", city: "" } as Location,
    bio: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile completed! Welcome to RozgaarHub!");
    navigate("/employer/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Employer Profile</CardTitle>
          <p className="text-muted-foreground">
            Set up your profile to start posting jobs
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company/Business Name</Label>
              <Input
                id="companyName"
                placeholder="Your Company Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <StateCitySelector
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="bio">About Your Business</Label>
              <Textarea
                id="bio"
                placeholder="Tell workers about your business..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full gradient-hero text-white" size="lg">
              Complete Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
