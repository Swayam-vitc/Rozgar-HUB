import { Job } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, IndianRupee, Users, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
}

export const JobCard = ({ job, onApply, isApplied = false }: JobCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                {job.verified && (
                  <CheckCircle className="h-4 w-4 text-accent" fill="currentColor" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{job.employerName}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location?.city && job.location?.state ? `${job.location.city}, ${job.location.state}` : 'Location not specified'}</span>
            </div>

            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              <span className="font-medium text-foreground">
                ₹{job.payAmount}/{job.payType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{job.duration}</span>
            </div>

            {job.teamRequired && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team of {job.teamSize} required</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 flex gap-2">
          <Button
            className="flex-1 gradient-saffron text-white"
            onClick={() => onApply?.(job._id)}
            disabled={isApplied}
          >
            {isApplied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Applied
              </>
            ) : (
              "Apply Solo"
            )}
          </Button>
          {job.teamRequired && !isApplied && (
            <Button variant="outline" className="flex-1">
              Apply with Team
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
