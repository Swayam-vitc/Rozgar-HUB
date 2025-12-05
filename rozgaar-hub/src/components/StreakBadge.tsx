import { Flame, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const StreakBadge = ({ streak, size = "md", animated = true }: StreakBadgeProps) => {
  const [prevStreak, setPrevStreak] = useState(streak);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const isGolden = streak >= 10;
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  // Trigger animation when streak increases
  useEffect(() => {
    if (animated && streak > prevStreak) {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 600);
    }
    setPrevStreak(streak);
  }, [streak]);

  return (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={shouldAnimate ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative flex items-center gap-1">
        <Flame
          className={`${sizeClasses[size]} ${isGolden ? 'text-yellow-500' : 'text-orange-500'}`}
          fill="currentColor"
        />
        <span className={`font-bold ${textSize[size]} ${isGolden ? 'text-yellow-600' : 'text-orange-600'}`}>
          {streak}
        </span>
        {isGolden && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Star className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" fill="currentColor" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
