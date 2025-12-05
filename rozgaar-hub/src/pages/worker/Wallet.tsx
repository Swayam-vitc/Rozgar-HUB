import { useEffect, useState } from "react";
import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon, TrendingUp, Download, IndianRupee, CheckCircle, Clock,
  AlertCircle, Send, QrCode, Plus, Copy, Check, ArrowUpRight, ArrowDownLeft,
  Building2, Search, X, Smartphone, Tv, Zap, Droplet, Wifi, ExternalLink
} from "lucide-react";
import { walletAPI, rechargeAPI, billAPI, paymentAPI } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  transactionType: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  fromUserId?: { name: string; phone: string };
  toUserId?: { name: string; phone: string };
  createdAt: string;
}

interface BankAccount {
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isDefault: boolean;
}

interface WalletData {
  walletId: string;
  balance: number;
  currency: string;
  qrCode: string;
  linkedBankAccounts: BankAccount[];
}

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  color: string;
}

const ServiceCard = ({ icon: Icon, title, onClick, color }: ServiceCardProps) => (
  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
    <CardContent className="p-6 flex flex-col items-center gap-3">
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-center">{title}</p>
    </CardContent>
  </Card>
);

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [jobPayments, setJobPayments] = useState<any[]>([]);
  const [pendingJobPayments, setPendingJobPayments] = useState<any[]>([]);

  // Dialog states
  const [activeService, setActiveService] = useState<string | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);

  // Form states for send money
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientData, setRecipientData] = useState<any>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendDesc, setSendDesc] = useState("");

  // Form states for services
  const [mobileNumber, setMobileNumber] = useState("");
  const [operator, setOperator] = useState("");
  const [serviceAmount, setServiceAmount] = useState("");
  const [consumerNumber, setConsumerNumber] = useState("");
  const [provider, setProvider] = useState("");

  const [topupAmount, setTopupAmount] = useState("");
  const [topupPaymentMethod, setTopupPaymentMethod] = useState("upi");
  const [topupUpiId, setTopupUpiId] = useState("");
  const [topupCardNumber, setTopupCardNumber] = useState("");
  const [topupCardExpiry, setTopupCardExpiry] = useState("");
  const [topupCardCvv, setTopupCardCvv] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  // Bank form
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    isDefault: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions()
      ]);
      setWallet((walletRes as any).wallet);
      setTransactions((transactionsRes as any).transactions);

      // Fetch job payment history
      try {
        const jobPaymentsRes = await paymentAPI.getPaymentHistory() as any;
        if (jobPaymentsRes.success) {
          setJobPayments(jobPaymentsRes.payments || []);
        }
      } catch (error) {
        console.log("No job payment history yet");
      }

      // Fetch pending job payments
      try {
        const pendingRes = await paymentAPI.getPendingPayments() as any;
        if (pendingRes.success) {
          setPendingJobPayments(pendingRes.pendingPayments || []);
        }
      } catch (error) {
        console.log("No pending job payments");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyWalletId = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.walletId);
      setCopied(true);
      toast.success("Wallet ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const searchRecipient = async () => {
    if (!recipientQuery) {
      toast.error("Please enter wallet ID or phone number");
      return;
    }
    try {
      setSubmitting(true);
      const res = await walletAPI.searchUser(recipientQuery);
      setRecipientData((res as any).user);
      toast.success("User found!");
    } catch (error: any) {
      toast.error(error.message || "User not found");
      setRecipientData(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientData || !sendAmount || Number(sendAmount) <= 0) {
      toast.error("Please complete all fields");
      return;
    }

    try {
      setSubmitting(true);
      await walletAPI.sendMoney({
        recipientWalletId: recipientData.walletId,
        amount: Number(sendAmount),
        description: sendDesc
      });
      toast.success("Money sent successfully!");
      setIsSendOpen(false);
      resetSendForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to send money");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMobileRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rechargeAPI.mobileRecharge({
        mobileNumber,
        operator,
        amount: Number(serviceAmount)
      });
      toast.success("Mobile recharge successful!");
      setActiveService(null);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Recharge failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDTHRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rechargeAPI.dthRecharge({
        subscriberId: consumerNumber,
        operator,
        amount: Number(serviceAmount)
      });
      toast.success("DTH recharge successful!");
      setActiveService(null);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Recharge failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleElectricityBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await billAPI.payElectricity({
        consumerNumber,
        provider,
        amount: Number(serviceAmount)
      });
      toast.success("Electricity bill paid successfully!");
      setActiveService(null);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaterBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await billAPI.payWater({
        consumerNumber,
        provider,
        amount: Number(serviceAmount)
      });
      toast.success("Water bill paid successfully!");
      setActiveService(null);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadbandBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await billAPI.payBroadband({
        accountNumber: consumerNumber,
        provider,
        amount: Number(serviceAmount)
      });
      toast.success("Broadband bill paid successfully!");
      setActiveService(null);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || Number(topupAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate payment method credentials
    if (topupPaymentMethod === "upi" && !topupUpiId) {
      toast.error("Please enter UPI ID");
      return;
    }

    if (topupPaymentMethod === "card" && (!topupCardNumber || !topupCardExpiry || !topupCardCvv)) {
      toast.error("Please enter complete card details");
      return;
    }

    try {
      setSubmitting(true);
      // In real app, this would process the payment
      // For now, simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      await walletAPI.addMoney({
        amount: Number(topupAmount),
        paymentMethod: topupPaymentMethod
      });

      toast.success("Money added successfully!");
      setIsTopupOpen(false);
      setTopupAmount("");
      setTopupUpiId("");
      setTopupCardNumber("");
      setTopupCardExpiry("");
      setTopupCardCvv("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add money");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      await walletAPI.withdraw({
        amount: Number(withdrawAmount),
        description: withdrawDesc,
        bankAccountId: selectedBank || undefined
      });
      toast.success("Withdrawal successful!");
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setWithdrawDesc("");
      setSelectedBank("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await walletAPI.linkBankAccount(bankForm);
      toast.success("Bank account linked successfully!");
      setIsBankOpen(false);
      setBankForm({
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        isDefault: false
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to link bank account");
    } finally {
      setSubmitting(false);
    }
  };

  const resetSendForm = () => {
    setRecipientQuery("");
    setRecipientData(null);
    setSendAmount("");
    setSendDesc("");
  };

  const resetServiceForm = () => {
    setMobileNumber("");
    setOperator("");
    setServiceAmount("");
    setConsumerNumber("");
    setProvider("");
  };

  const filteredTransactions = activeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.transactionType === activeFilter);

  // Wallet transactions earnings
  const walletEarnings = transactions
    .filter(t => t.type === 'credit' && new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  // Job payment earnings this month
  const jobEarnings = jobPayments
    .filter(p => {
      const paidDate = new Date(p.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Combined this month earnings
  const thisMonthEarnings = walletEarnings + jobEarnings;

  // Pending from wallet transactions
  const walletPending = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending from job payments  
  const jobPending = pendingJobPayments.reduce((sum, p) => sum + p.amount, 0);

  // Combined pending
  const pendingAmount = walletPending + jobPending;

  const services = [
    { icon: Smartphone, title: "Mobile Recharge", color: "bg-blue-500", service: "mobile" },
    { icon: Tv, title: "DTH Recharge", color: "bg-purple-500", service: "dth" },
    { icon: Zap, title: "Electricity", color: "bg-yellow-500", service: "electricity" },
    { icon: Droplet, title: "Water Bill", color: "bg-cyan-500", service: "water" },
    { icon: Wifi, title: "Broadband", color: "bg-green-500", service: "broadband" },
    { icon: Send, title: "Send Money", color: "bg-pink-500", service: "send" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Wallet</h1>
            <p className="text-muted-foreground">
              Pay bills, recharge, and manage your money
            </p>
          </div>

          {/* Wallet ID Card */}
          {wallet && (
            <Card className="mb-4 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Payment ID</p>
                    <p className="text-lg font-mono font-bold">{wallet.walletId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWalletId}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Card */}
          <Card className="mb-8 shadow-elevated gradient-hero text-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <WalletIcon className="h-5 w-5" />
                <span className="text-white/80">Total Balance</span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <IndianRupee className="h-8 w-8" />
                <span className="text-5xl font-bold">
                  {wallet ? wallet.balance.toLocaleString() : "0"}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-col h-auto py-3">
                      <Plus className="h-5 w-5 mb-1" />
                      <span className="text-xs">Add Money</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Money</DialogTitle>
                      <DialogDescription>
                        Top-up your wallet balance using UPI, Card, or Net Banking
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTopup}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="topup-amount">Amount (₹)</Label>
                          <Input
                            id="topup-amount"
                            type="number"
                            placeholder="0.00"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            min="1"
                            required
                          />
                        </div>

                        <div className="border-t pt-4">
                          <Label className="mb-3 block">Select Payment Method</Label>
                          <Tabs value={topupPaymentMethod} onValueChange={setTopupPaymentMethod}>
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="upi">UPI</TabsTrigger>
                              <TabsTrigger value="card">Card</TabsTrigger>
                              <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upi" className="space-y-4 mt-4">
                              <div className="grid gap-2">
                                <Label htmlFor="upi-id">UPI ID</Label>
                                <Input
                                  id="upi-id"
                                  placeholder="yourname@upi"
                                  value={topupUpiId}
                                  onChange={(e) => setTopupUpiId(e.target.value)}
                                  required={topupPaymentMethod === "upi"}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter your UPI ID (e.g., 9876543210@paytm)
                                </p>
                              </div>
                            </TabsContent>

                            <TabsContent value="card" className="space-y-4 mt-4">
                              <div className="grid gap-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <Input
                                  id="card-number"
                                  placeholder="1234 5678 9012 3456"
                                  value={topupCardNumber}
                                  onChange={(e) => setTopupCardNumber(e.target.value)}
                                  maxLength={19}
                                  required={topupPaymentMethod === "card"}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="card-expiry">Expiry (MM/YY)</Label>
                                  <Input
                                    id="card-expiry"
                                    placeholder="12/25"
                                    value={topupCardExpiry}
                                    onChange={(e) => setTopupCardExpiry(e.target.value)}
                                    maxLength={5}
                                    required={topupPaymentMethod === "card"}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="card-cvv">CVV</Label>
                                  <Input
                                    id="card-cvv"
                                    type="password"
                                    placeholder="123"
                                    value={topupCardCvv}
                                    onChange={(e) => setTopupCardCvv(e.target.value)}
                                    maxLength={3}
                                    required={topupPaymentMethod === "card"}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                🔒 Test Mode: Use any details. No real money charged.
                              </p>
                            </TabsContent>

                            <TabsContent value="netbanking" className="space-y-4 mt-4">
                              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                <p className="text-sm text-center">
                                  You will be redirected to your bank's website to complete the payment
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={submitting} className="w-full">
                          {submitting ? "Processing..." : `Pay ₹${topupAmount || 0}`}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-col h-auto py-3">
                      <Download className="h-5 w-5 mb-1" />
                      <span className="text-xs">Withdraw</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw Money</DialogTitle>
                      <DialogDescription>
                        Transfer to your bank account
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdraw}>
                      <div className="grid gap-4 py-4">
                        {wallet && wallet.linkedBankAccounts.length > 0 && (
                          <div className="grid gap-2">
                            <Label>Select Bank Account</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                            >
                              <option value="">Select account</option>
                              {wallet.linkedBankAccounts.map((acc) => (
                                <option key={acc._id} value={acc._id}>
                                  {acc.bankName} - {acc.accountNumber.slice(-4)}
                                  {acc.isDefault && " (Default)"}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Processing..." : "Withdraw"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-col h-auto py-3">
                      <QrCode className="h-5 w-5 mb-1" />
                      <span className="text-xs">Receive</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Receive Money</DialogTitle>
                      <DialogDescription>
                        Share your payment ID
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 text-center">
                      <div className="mb-4 p-8 bg-white rounded-lg inline-block">
                        <div className="text-6xl">📱</div>
                        <p className="text-sm text-muted-foreground mt-2">QR Code</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Your Payment ID</p>
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-lg font-mono font-bold">{wallet?.walletId}</code>
                          <Button variant="outline" size="sm" onClick={copyWalletId}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBankOpen} onOpenChange={setIsBankOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-col h-auto py-3">
                      <Building2 className="h-5 w-5 mb-1" />
                      <span className="text-xs">Bank</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Bank Account</DialogTitle>
                      <DialogDescription>
                        Add your bank account for withdrawals
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBank}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Account Holder Name</Label>
                          <Input
                            value={bankForm.accountHolderName}
                            onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Account Number</Label>
                          <Input
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>IFSC Code</Label>
                          <Input
                            value={bankForm.ifscCode}
                            onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Bank Name</Label>
                          <Input
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Adding..." : "Add Account"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.service}
                  icon={service.icon}
                  title={service.title}
                  color={service.color}
                  onClick={() => {
                    if (service.service === "send") {
                      setIsSendOpen(true);
                    } else {
                      setActiveService(service.service);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Service Dialog */}
          <Dialog open={activeService !== null} onOpenChange={() => setActiveService(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {activeService === "mobile" && "Mobile Recharge"}
                  {activeService === "dth" && "DTH Recharge"}
                  {activeService === "electricity" && "Electricity Bill"}
                  {activeService === "water" && "Water Bill"}
                  {activeService === "broadband" && "Broadband Bill"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={
                activeService === "mobile" ? handleMobileRecharge :
                  activeService === "dth" ? handleDTHRecharge :
                    activeService === "electricity" ? handleElectricityBill :
                      activeService === "water" ? handleWaterBill :
                        handleBroadbandBill
              }>
                <div className="grid gap-4 py-4">
                  {(activeService === "mobile" || activeService === "dth") && (
                    <>
                      <div className="grid gap-2">
                        <Label>Operator</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                          required
                        >
                          <option value="">Select operator</option>
                          {activeService === "mobile" ? (
                            <>
                              <option value="Airtel">Airtel</option>
                              <option value="Jio">Jio</option>
                              <option value="Vi">Vi</option>
                              <option value="BSNL">BSNL</option>
                            </>
                          ) : (
                            <>
                              <option value="Tata Sky">Tata Sky</option>
                              <option value="Airtel Digital TV">Airtel Digital TV</option>
                              <option value="Dish TV">Dish TV</option>
                              <option value="Sun Direct">Sun Direct</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{activeService === "mobile" ? "Mobile Number" : "Subscriber ID"}</Label>
                        <Input
                          value={activeService === "mobile" ? mobileNumber : consumerNumber}
                          onChange={(e) => activeService === "mobile" ? setMobileNumber(e.target.value) : setConsumerNumber(e.target.value)}
                          placeholder={activeService === "mobile" ? "10-digit mobile number" : "Subscriber ID"}
                          required
                        />
                      </div>
                    </>
                  )}

                  {(activeService === "electricity" || activeService === "water" || activeService === "broadband") && (
                    <>
                      <div className="grid gap-2">
                        <Label>Provider</Label>
                        <Input
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          placeholder="e.g., MSEB, Municipal Corporation"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{activeService === "broadband" ? "Account Number" : "Consumer Number"}</Label>
                        <Input
                          value={consumerNumber}
                          onChange={(e) => setConsumerNumber(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={serviceAmount}
                      onChange={(e) => setServiceAmount(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Pay Now"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Send Money Dialog */}
          <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
                <DialogDescription>
                  Enter recipient's payment ID or phone number
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMoney}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Search Recipient</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Payment ID or Phone"
                        value={recipientQuery}
                        onChange={(e) => setRecipientQuery(e.target.value)}
                      />
                      <Button type="button" onClick={searchRecipient} disabled={submitting}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {recipientData && (
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{recipientData.name}</p>
                            <p className="text-sm text-muted-foreground">{recipientData.phone}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRecipientData(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="send-amount">Amount (₹)</Label>
                    <Input
                      id="send-amount"
                      type="number"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      min="1"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="send-desc">Message (Optional)</Label>
                    <Input
                      id="send-desc"
                      placeholder="Add a note"
                      value={sendDesc}
                      onChange={(e) => setSendDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting || !recipientData}>
                    {submitting ? "Sending..." : "Send Money"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">This Month</p>
                    <p className="text-2xl font-bold">₹{thisMonthEarnings.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="send">Sent</TabsTrigger>
                  <TabsTrigger value="receive">Received</TabsTrigger>
                </TabsList>
              </Tabs>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:shadow-card transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{transaction.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.transactionType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                        >
                          {transaction.status}
                        </Badge>
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
    </div>
  );
}
