import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import i18n, { LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { register, loading: authLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: (searchParams.get("role") as "worker" | "employer") || "worker",
    language: "en",
  });

  // Update role if URL parameter changes
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "worker" || roleParam === "employer") {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(formData);
      toast.success("Account created successfully!");

      // Redirect based on role
      if (formData.role === 'worker') {
        navigate("/onboarding/worker");
      } else {
        navigate("/onboarding/employer");
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">
                <span className="text-primary">Rozgaar</span>
                <span className="text-secondary">Hub</span>
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl">{t("auth.signup")}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("auth.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "worker" | "employer") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("auth.language")}</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => {
                  setFormData({ ...formData, language: value });
                  i18n.changeLanguage(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full gradient-saffron text-white" disabled={authLoading}>
              {authLoading ? t("common.loading") : t("auth.signup")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => navigate("/auth/login")}>
                {t("auth.login")}
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
