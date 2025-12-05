import { useState, useEffect } from "react";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, CreditCard, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentAPI, employerAPI } from "@/lib/api";
import { PaymentModal } from "@/components/PaymentModal";
import { RatingModal } from "@/components/RatingModal";
import { format } from "date-fns";

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, pendingRes] = await Promise.all([
        paymentAPI.getPaymentHistory(),
        paymentAPI.getPendingPayments()
      ]);

      if ((historyRes as any).success) {
        setPaymentHistory((historyRes as any).payments || []);
      }

      if ((pendingRes as any).success) {
        setPendingPayments((pendingRes as any).pendingPayments || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    fetchData();
    // After payment, show rating modal
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!selectedPayment) return;

    try {
      await employerAPI.completeJobWithRating(selectedPayment.id, {
        rating,
        feedback
      });
      toast.success("Rating submitted successfully!");
      setShowRatingModal(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
      throw error;
    }
  };

  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Combine all payments for display
  const allPayments = [
    ...pendingPayments.map(p => ({ ...p, status: 'pending' })),
    ...paymentHistory.map(p => ({ ...p, status: 'paid' }))
  ].sort((a, b) => new Date(b.createdAt || b.paidAt).getTime() - new Date(a.createdAt || a.paidAt).getTime());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Payments</h1>
            <p className="text-muted-foreground">
              Track and manage payments to workers
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">₹{totalPending.toLocaleString()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Jobs</p>
                    <p className="text-2xl font-bold text-primary">{allPayments.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {allPayments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payments found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Hire workers from the Workers page to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:shadow-card transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{payment.jobTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          Worker: {payment.worker?.name || payment.employer?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payment.status === 'paid' && payment.paidAt
                            ? `Paid on: ${format(new Date(payment.paidAt), 'MMM d, yyyy')}`
                            : payment.createdAt
                              ? `Created: ${format(new Date(payment.createdAt), 'MMM d, yyyy')}`
                              : 'Date unavailable'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">₹{payment.amount.toLocaleString()}</p>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            className="gradient-hero text-white"
                            onClick={() => handlePayClick(payment)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay Now
                          </Button>
                        )}
                        {payment.status === "paid" && payment.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{payment.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileBottomNav />

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          hireRequest={{
            id: selectedPayment.id,
            workerName: selectedPayment.worker?.name || 'Worker',
            jobTitle: selectedPayment.jobTitle,
            amount: selectedPayment.amount,
            salaryType: selectedPayment.salaryType || 'fixed'
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Rating Modal (Compulsory after payment) */}
      {selectedPayment && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            // Don't allow closing without rating
            toast.error("Please submit a rating to continue");
          }}
          onSubmit={handleSubmitRating}
          workerName={selectedPayment.worker?.name || 'Worker'}
        />
      )}
    </div>
  );
}
