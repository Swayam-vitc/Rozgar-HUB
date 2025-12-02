import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, feedback: string) => Promise<void>;
    workerName: string;
}

export function RatingModal({ isOpen, onClose, onSubmit, workerName }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);
    const [animationType, setAnimationType] = useState<"good" | "bad">("good");

    const handleSubmit = async () => {
        if (rating === 0) {
            return;
        }

        setSubmitting(true);
        setAnimationType(rating >= 3 ? "good" : "bad");
        setShowAnimation(true);

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await onSubmit(rating, feedback);
            onClose();
        } catch (error) {
            console.error("Error submitting rating:", error);
        } finally {
            setSubmitting(false);
            setShowAnimation(false);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !submitting && !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate {workerName}'s Work</DialogTitle>
                    <DialogDescription>
                        How was your experience working with {workerName}?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Star Rating */}
                    <div className="space-y-3">
                        <Label>Rating</Label>
                        <div className="flex justify-center gap-2 relative">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`h-12 w-12 transition-colors ${star <= displayRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </motion.button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-center text-sm text-muted-foreground">
                                {rating === 5 && "Excellent! ⭐"}
                                {rating === 4 && "Great! 👍"}
                                {rating === 3 && "Good 👌"}
                                {rating === 2 && "Needs Improvement 😐"}
                                {rating === 1 && "Poor 😞"}
                            </p>
                        )}
                    </div>

                    {/* Feedback */}
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Share your experience..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            disabled={submitting}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0 || submitting}
                        className="w-full gradient-saffron text-white"
                        size="lg"
                    >
                        {submitting ? "Submitting..." : "Submit Rating"}
                    </Button>
                </div>

                {/* Star Animation Overlay */}
                <AnimatePresence>
                    {showAnimation && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-background/95 z-50 rounded-lg"
                        >
                            {animationType === "good" ? (
                                <GoodRatingAnimation rating={rating} />
                            ) : (
                                <BadRatingAnimation rating={rating} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

// Good rating animation (3-5 stars)
function GoodRatingAnimation({ rating }: { rating: number }) {
    return (
        <div className="relative">
            {[...Array(rating)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: 0, x: 0, y: 0 }}
                    animate={{
                        scale: [0, 1.5, 1],
                        rotate: [0, 360, 720],
                        x: [0, Math.random() * 200 - 100],
                        y: [0, -200 - Math.random() * 100],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                        ease: "easeOut",
                    }}
                    className="absolute"
                    style={{
                        left: `${i * 40}px`,
                    }}
                >
                    <Star className="h-12 w-12 fill-yellow-400 text-yellow-400" />
                </motion.div>
            ))}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 text-2xl font-bold text-green-600"
            >
                <Sparkles className="h-8 w-8" />
                Great Job!
                <Sparkles className="h-8 w-8" />
            </motion.div>
        </div>
    );
}

// Bad rating animation (1-2 stars)
function BadRatingAnimation({ rating }: { rating: number }) {
    return (
        <div className="relative">
            {[...Array(rating)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 1, y: 0 }}
                    animate={{
                        scale: [1, 0.5, 0],
                        opacity: [1, 0.5, 0],
                        y: [0, 50],
                    }}
                    transition={{
                        duration: 1,
                        delay: i * 0.1,
                        ease: "easeIn",
                    }}
                    className="absolute"
                    style={{
                        left: `${i * 40}px`,
                    }}
                >
                    <Star className="h-12 w-12 fill-red-500 text-red-500" />
                </motion.div>
            ))}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-2 text-2xl font-bold text-red-600"
            >
                <X className="h-8 w-8" />
                Needs Improvement
                <X className="h-8 w-8" />
            </motion.div>
        </div>
    );
}
