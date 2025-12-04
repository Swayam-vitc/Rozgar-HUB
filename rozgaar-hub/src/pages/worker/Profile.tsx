import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StreakBadge } from "@/components/StreakBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { Camera, Star, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { workerAPI, authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

import { useTranslation } from "react-i18next";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    state: "",
    city: "",
    hourlyRate: "",
    dailyRate: "",
    bio: "",
    skills: [] as string[],
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await workerAPI.getProfile() as any;

        if (response.success && response.worker) {
          const worker = response.worker;
          setProfileData(worker);

          setFormData({
            name: worker.name || "",
            phone: worker.phone || "",
            email: worker.email || "",
            state: worker.location?.state || "",
            city: worker.location?.city || "",
            hourlyRate: worker.hourlyRate?.toString() || "",
            dailyRate: worker.dailyRate?.toString() || "",
            bio: worker.bio || "",
            skills: worker.skills || [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(t('failedLoadProfile') || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        name: formData.name,
        phone: formData.phone,
        location: {
          state: formData.state,
          city: formData.city,
        },
        hourlyRate: Number(formData.hourlyRate) || 0,
        dailyRate: Number(formData.dailyRate) || 0,
        bio: formData.bio,
        skills: formData.skills,
      };

      const response = await authAPI.updateProfile(updateData) as any;

      if (response.success) {
        toast.success(t('profileUpdated'));

        // Update user in auth store
        if (response.user) {
          setUser(response.user);
        }

        // Refresh profile data
        const profileResponse = await workerAPI.getProfile() as any;
        if (profileResponse.success) {
          setProfileData(profileResponse.worker);
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || t('profileUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('myProfile')}</h1>
            <p className="text-muted-foreground">
              {t('manageProfile')}
            </p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8 shadow-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileData?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} />
                    <AvatarFallback>{formData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">{formData.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{profileData?.rating || 0}</span>
                      <span className="text-muted-foreground text-sm">({profileData?.reviewsCount || 0} {t('reviews')})</span>
                    </div>
                    <StreakBadge streak={profileData?.streak || 0} />
                    <LevelBadge level={profileData?.level || "bronze"} />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {formData.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profileData?.completedJobs || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('completedJobs')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">₹{profileData?.totalEarnings?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('totalEarnings')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profileData?.verified ? "✓" : "✗"}</p>
                  <p className="text-sm text-muted-foreground">{t('verificationStatus')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>{t('editProfile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('fullName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneNumber')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">{t('emailCannotChange')}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">{t('state') || 'State'}</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Karnataka"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('city') || 'City'}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Belagavi"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">{t('hourlyRate')}</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="75"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyRate">{t('dailyRate')}</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder={t('bioPlaceholder')}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full gradient-saffron text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
