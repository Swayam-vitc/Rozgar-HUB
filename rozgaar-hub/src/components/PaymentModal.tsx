import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { paymentAPI } from "@/lib/api";

// Razorpay Key ID (test mode)
const RAZORPAY_KEY_ID = "rzp_test_OxP9vJetTC4GOx";

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    hireRequest: {
        id: string;
        workerName: string;
        jobTitle: string;
        amount: number;
        salaryType: string;
    };
    onPaymentSuccess: () => void;
}

export const PaymentModal = ({ isOpen, onClose, hireRequest, onPaymentSuccess }: PaymentModalProps) => {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");

    const handlePayment = async () => {
        // Validate payment method credentials
        if (paymentMethod === "upi" && !upiId) {
            toast.error("Please enter UPI ID");
            return;
        }

        if (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCvv)) {
            toast.error("Please enter complete card details");
            return;
        }

        try {
            setLoading(true);

            // Create Razorpay order
            const orderResponse = await paymentAPI.createOrder(hireRequest.id) as any;

            if (!orderResponse.success) {
                toast.error(orderResponse.message || "Failed to create payment order");
                setLoading(false);
                return;
            }

            const order = orderResponse.order;
            const isSimulation = orderResponse.simulationMode;

            // If simulation mode, directly verify payment
            if (isSimulation) {
                toast.info("Test mode: Payment simulation");

                // Simulate payment success after 1 second
                setTimeout(async () => {
                    try {
                        const verifyResponse = await paymentAPI.verifyPayment({
                            razorpay_order_id: order.id,
                            razorpay_payment_id: `pay_sim_${Date.now()} `,
                            razorpay_signature: 'simulated_signature',
                            hireRequestId: hireRequest.id,
                            simulationMode: true
                        }) as any;

                        if (verifyResponse.success) {
                            toast.success("Payment successful! You can now submit your rating.");
                            onPaymentSuccess();
                            onClose();
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (error: any) {
                        console.error("Payment verification error:", error);
                        toast.error(error.message || "Payment verification failed");
                    } finally {
                        setLoading(false);
                    }
                }, 1000);
                return;
            }

            // Real Razorpay checkout
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "RozgaarHub",
                description: `Payment for ${hireRequest.jobTitle}`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Verify payment on backend
                        const verifyResponse = await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            hireRequestId: hireRequest.id,
                            simulationMode: false
                        }) as any;

                        if (verifyResponse.success) {
                            toast.success("Payment successful! You can now submit your rating.");
                            onPaymentSuccess();
                            onClose();
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (error: any) {
                        console.error("Payment verification error:", error);
                        toast.error(error.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: "Employer",
                    email: "",
                    contact: ""
                },
                notes: {
                    hire_request_id: hireRequest.id,
                    worker_name: hireRequest.workerName
                },
                theme: {
                    color: "#3b82f6"
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        toast.error("Payment cancelled");
                    }
                }
            };

            // Create Razorpay instance and open checkout
            const rzp = new window.Razorpay(options);
            rzp.open();
            setLoading(false);

        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Failed to initiate payment");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pay Worker</DialogTitle>
                    <DialogDescription>
                        Complete payment for work done by {hireRequest.workerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Payment Summary */}
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Job Title:</span>
                            <span className="font-medium">{hireRequest.jobTitle}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Worker:</span>
                            <span className="font-medium">{hireRequest.workerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Salary Type:</span>
                            <span className="font-medium capitalize">{hireRequest.salaryType}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-semibold">Total Amount:</span>
                            <span className="text-xl font-bold text-primary">
                                ₹{hireRequest.amount.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="border rounded-lg p-4">
                        <Label className="mb-3 block font-semibold">Select Payment Method</Label>
                        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="upi">
                                    <Smartphone className="h-4 w-4 mr-1" />
                                    UPI
                                </TabsTrigger>
                                <TabsTrigger value="card">
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Card
                                </TabsTrigger>
                                <TabsTrigger value="netbanking">
                                    <Building2 className="h-4 w-4 mr-1" />
                                    Net Banking
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="upi" className="space-y-3 mt-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-upi-id">UPI ID</Label>
                                    <Input
                                        id="payment-upi-id"
                                        placeholder="yourname@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        required={paymentMethod === "upi"}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter your UPI ID (e.g., 9876543210@paytm)
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="card" className="space-y-3 mt- 2">
                                <div className="grid gap-2">
                                    <Label htmlFor="payment-card-number">Card Number</Label>
                                    <Input
                                        id="payment-card-number"
                                        placeholder="4111 1111 1111 1111"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        maxLength={19}
                                        required={paymentMethod === "card"}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment-card-expiry">Expiry (MM/YY)</Label>
                                        <Input
                                            id="payment-card-expiry"
                                            placeholder="12/25"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            maxLength={5}
                                            required={paymentMethod === "card"}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment-card-cvv">CVV</Label>
                                        <Input
                                            id="payment-card-cvv"
                                            type="password"
                                            placeholder="123"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value)}
                                            maxLength={3}
                                            required={paymentMethod === "card"}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="netbanking" className="space-y-3 mt-2">
                                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                    <p className="text-sm text-center">
                                        You will be redirected to your bank's website to complete the payment
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Test Mode Notice */}
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            🧪 <strong>Test Mode:</strong> Use test cards for payment. No real money will be charged.
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Test Card: 4111 1111 1111 1111 | CVV: Any | Expiry: Any future date
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="gradient-hero text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay ₹{hireRequest.amount.toLocaleString()}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
