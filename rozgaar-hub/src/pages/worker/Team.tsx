import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Copy, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const myTeam = [

];

export default function Team() {
  const { t } = useTranslation();

  const handleCopyInvite = () => {
    navigator.clipboard.writeText("");
    toast.success(t('team.inviteCopied') || "Invite link copied!");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('team.title') || t('nav.team')}</h1>
            <p className="text-muted-foreground">
              {t('team.subtitle') || "Build your team and apply for jobs together"}
            </p>
          </div>

          {/* Invite Section */}
          <Card className="mb-8 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {t('team.inviteWorkers') || "Invite Workers"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('team.enterContact') || "Enter phone number or email"}
                  className="flex-1"
                />
                <Button className="gradient-saffron text-white">
                  {t('team.sendInvite') || "Send Invite"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value="https://rozgaarhub.com/team/invite/abc123"
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleCopyInvite}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('team.copy') || "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('team.teamMembers') || "Team Members"} ({myTeam.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {myTeam.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-card transition-shadow"
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.photo} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{member.rating}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('team.viewProfile') || "View Profile"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
