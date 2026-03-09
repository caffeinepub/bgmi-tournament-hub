import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  LogIn,
  Trophy,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import { TransactionStatus, TransactionType } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetUserProfile,
  useMyTransactions,
  useRequestAddCash,
  useRequestWithdrawal,
} from "../hooks/useQueries";

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TxIcon({ txType }: { txType: TransactionType }) {
  if (txType === TransactionType.CashAdded) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "oklch(0.55 0.18 150 / 0.18)" }}
      >
        <ArrowDownLeft
          className="w-4 h-4"
          style={{ color: "oklch(0.65 0.18 150)" }}
        />
      </div>
    );
  }
  if (txType === TransactionType.MatchJoined) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "oklch(0.55 0.22 29 / 0.18)" }}
      >
        <ArrowUpRight
          className="w-4 h-4"
          style={{ color: "oklch(0.65 0.22 29)" }}
        />
      </div>
    );
  }
  if (txType === TransactionType.PrizeWon) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "oklch(0.86 0.22 72 / 0.18)" }}
      >
        <Trophy className="w-4 h-4" style={{ color: "oklch(0.86 0.22 72)" }} />
      </div>
    );
  }
  // Withdrawal
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "oklch(0.75 0.18 52 / 0.18)" }}
    >
      <ArrowUpRight
        className="w-4 h-4"
        style={{ color: "oklch(0.75 0.18 52)" }}
      />
    </div>
  );
}

function TxLabel({ txType }: { txType: TransactionType }) {
  const labels: Record<TransactionType, string> = {
    [TransactionType.CashAdded]: "Money Added",
    [TransactionType.MatchJoined]: "Match Joined",
    [TransactionType.PrizeWon]: "Prize Won",
    [TransactionType.Withdrawal]: "Withdrawal",
  };
  return <span>{labels[txType] ?? txType}</span>;
}

function TxAmount({ tx }: { tx: Transaction }) {
  const isCredit =
    tx.txType === TransactionType.CashAdded ||
    tx.txType === TransactionType.PrizeWon;
  const color = isCredit ? "oklch(0.65 0.18 150)" : "oklch(0.65 0.22 29)";
  return (
    <span className="text-sm font-bold font-mono" style={{ color }}>
      {isCredit ? "+" : "-"}₹{tx.amount.toString()}
    </span>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === TransactionStatus.Completed) {
    return (
      <Badge className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border-green-500/30">
        <CheckCircle className="w-2.5 h-2.5 mr-1" /> Completed
      </Badge>
    );
  }
  if (status === TransactionStatus.Rejected) {
    return (
      <Badge className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border-red-500/30">
        <XCircle className="w-2.5 h-2.5 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
      <Clock className="w-2.5 h-2.5 mr-1" /> Pending
    </Badge>
  );
}

export function WalletPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { data: transactions, isLoading: txLoading } = useMyTransactions();
  const requestAddCash = useRequestAddCash();
  const requestWithdrawal = useRequestWithdrawal();

  const [addCashOpen, setAddCashOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addCashAmount, setAddCashAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-2xl p-10 flex flex-col items-center gap-5"
          data-ocid="wallet.login_panel"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.86 0.22 72 / 0.12)",
              border: "1px solid oklch(0.86 0.22 72 / 0.3)",
            }}
          >
            <Wallet
              className="w-7 h-7"
              style={{ color: "oklch(0.86 0.22 72)" }}
            />
          </div>
          <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground">
            Your{" "}
            <span
              style={{ color: "oklch(0.86 0.22 72)" }}
              className="glow-text-gold"
            >
              Wallet
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Login to view your wallet balance, add cash, and withdraw winnings.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="neon-btn-gold px-8"
            data-ocid="wallet.login_button"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoggingIn ? "Connecting…" : "Login to View Wallet"}
          </Button>
        </motion.div>
      </div>
    );
  }

  const walletBalance = profile?.walletBalance ?? BigInt(0);
  const winningsBalance = profile?.winningsBalance ?? BigInt(0);
  const upiId = profile?.upiId ?? "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseInt(addCashAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!screenshotFile) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    try {
      setUploading(true);
      const screenshotId = `screenshot-${Date.now()}-${screenshotFile.name}`;
      await requestAddCash.mutateAsync({
        amount: BigInt(amount),
        screenshotId,
      });
      toast.success(
        "Top-up request submitted! Admin will approve within 24 hours.",
      );
      setAddCashOpen(false);
      setAddCashAmount("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setUploading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!withdrawUpi.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (BigInt(amount) > winningsBalance) {
      toast.error("Insufficient winnings balance");
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({
        upiId: withdrawUpi.trim(),
        amount: BigInt(amount),
      });
      toast.success(
        "Withdrawal request submitted! Admin will process within 24 hours.",
      );
      setWithdrawOpen(false);
      setWithdrawAmount("");
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wallet Balance */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.13 0.02 240), oklch(0.16 0.04 220))",
              border: "1px solid oklch(0.86 0.22 198 / 0.3)",
              boxShadow: "0 0 30px oklch(0.86 0.22 198 / 0.08)",
            }}
            data-ocid="wallet.wallet_balance_card"
          >
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20"
              style={{ background: "oklch(0.86 0.22 198)" }}
            />
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1">
                Wallet Balance
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-mono mb-2">
                For joining tournaments
              </p>
              {profileLoading ? (
                <Skeleton className="h-10 w-32 bg-muted/30" />
              ) : (
                <div
                  className="font-display font-black text-4xl"
                  style={{
                    color: "oklch(0.86 0.22 198)",
                    textShadow: "0 0 20px oklch(0.86 0.22 198 / 0.4)",
                  }}
                >
                  ₹{walletBalance.toString()}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="mt-4 w-full text-xs neon-btn"
              onClick={() => setAddCashOpen(true)}
              data-ocid="wallet.add_cash_button"
            >
              + Add Cash
            </Button>
          </div>

          {/* Winnings Balance */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.13 0.02 50), oklch(0.16 0.04 60))",
              border: "1px solid oklch(0.86 0.22 72 / 0.3)",
              boxShadow: "0 0 30px oklch(0.86 0.22 72 / 0.08)",
            }}
            data-ocid="wallet.winnings_balance_card"
          >
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20"
              style={{ background: "oklch(0.86 0.22 72)" }}
            />
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1">
                Winnings Balance
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-mono mb-2">
                Prize money earned
              </p>
              {profileLoading ? (
                <Skeleton className="h-10 w-32 bg-muted/30" />
              ) : (
                <div
                  className="font-display font-black text-4xl"
                  style={{
                    color: "oklch(0.86 0.22 72)",
                    textShadow: "0 0 20px oklch(0.86 0.22 72 / 0.4)",
                  }}
                >
                  ₹{winningsBalance.toString()}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="mt-4 w-full text-xs neon-btn-gold"
              onClick={() => {
                setWithdrawUpi(upiId);
                setWithdrawOpen(true);
              }}
              disabled={winningsBalance <= BigInt(0)}
              data-ocid="wallet.withdraw_button"
            >
              Withdraw Winnings
            </Button>
          </div>
        </div>

        {/* UPI info */}
        {upiId && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
            style={{
              background: "oklch(0.14 0.02 240 / 0.8)",
              border: "1px solid oklch(1 0 0 / 0.06)",
            }}
            data-ocid="wallet.upi_info"
          >
            <Wallet className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">UPI:</span>
            <span className="font-mono text-foreground/80">{upiId}</span>
          </div>
        )}

        {/* How it works */}
        <div
          className="gaming-card rounded-2xl p-5 space-y-3"
          data-ocid="wallet.how_it_works_panel"
        >
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">💰</span>
              <p>
                Add cash via UPI &amp; upload screenshot. Admin approves and
                credits your wallet.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">🎮</span>
              <p>
                Join tournaments with one click — entry fee deducted from your
                wallet automatically.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">🏆</span>
              <p>Win prize money and withdraw to your bank via UPI anytime.</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3" data-ocid="wallet.transactions_section">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Transaction History
          </h3>

          {txLoading ? (
            <div
              className="space-y-2"
              data-ocid="wallet.transactions.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 bg-muted/30 rounded-xl" />
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div
              className="gaming-card rounded-xl p-8 text-center"
              data-ocid="wallet.transactions.empty_state"
            >
              <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet.
              </p>
              <Link
                to="/"
                className="text-xs mt-2 inline-block"
                style={{ color: "oklch(0.86 0.22 198)" }}
              >
                Browse tournaments →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.13 0.02 240 / 0.7)",
                    border: "1px solid oklch(1 0 0 / 0.06)",
                  }}
                  data-ocid={`wallet.transactions.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <TxIcon txType={tx.txType} />
                    <div>
                      <p className="text-sm font-medium text-foreground/80 leading-none">
                        <TxLabel txType={tx.txType} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TxAmount tx={tx} />
                    <StatusBadge status={tx.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Cash Sheet */}
      <Sheet open={addCashOpen} onOpenChange={setAddCashOpen}>
        <SheetContent
          className="bg-card border-border max-w-md w-full"
          data-ocid="wallet.add_cash_sheet"
        >
          <SheetHeader>
            <SheetTitle className="font-display font-bold uppercase tracking-wider">
              Add Cash to Wallet
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Pay via UPI and upload the payment screenshot. Admin will approve
              and credit your wallet.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleAddCash} className="mt-6 space-y-5">
            {/* Admin UPI instructions */}
            <div
              className="rounded-xl p-4 text-xs space-y-1"
              style={{
                background: "oklch(0.86 0.22 198 / 0.06)",
                border: "1px solid oklch(0.86 0.22 198 / 0.2)",
              }}
            >
              <p className="font-bold uppercase tracking-wider text-muted-foreground">
                Pay Admin via UPI
              </p>
              <p className="text-muted-foreground">
                Send money to admin's UPI ID and upload the screenshot below as
                proof.
              </p>
              <p
                className="font-mono"
                style={{ color: "oklch(0.86 0.22 198)" }}
              >
                Contact admin for UPI details
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount to add"
                value={addCashAmount}
                onChange={(e) => setAddCashAmount(e.target.value)}
                className="bg-muted/20 border-border"
                data-ocid="wallet.add_cash_amount_input"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Payment Screenshot *
              </Label>
              <label
                className="block border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/60 transition-colors bg-muted/10"
                data-ocid="wallet.screenshot_upload_button"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {screenshotPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-32 rounded-lg object-contain"
                    />
                    <span className="text-xs text-muted-foreground">
                      Tap to change
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Upload className="w-7 h-7 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">
                      Tap to upload screenshot
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border"
                onClick={() => setAddCashOpen(false)}
                data-ocid="wallet.add_cash_cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 neon-btn"
                disabled={requestAddCash.isPending || uploading}
                data-ocid="wallet.add_cash_submit_button"
              >
                {requestAddCash.isPending || uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {uploading ? "Uploading..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Withdraw Sheet */}
      <Sheet open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <SheetContent
          className="bg-card border-border max-w-md w-full"
          data-ocid="wallet.withdraw_sheet"
        >
          <SheetHeader>
            <SheetTitle className="font-display font-bold uppercase tracking-wider">
              Withdraw Winnings
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Winnings balance: ₹{winningsBalance.toString()}. Admin will
              process within 24 hours.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleWithdraw} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Your UPI ID *
              </Label>
              <Input
                placeholder="yourname@upi"
                value={withdrawUpi}
                onChange={(e) => setWithdrawUpi(e.target.value)}
                className="bg-muted/20 border-border"
                data-ocid="wallet.withdraw_upi_input"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Money will be sent to this UPI ID
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                min="1"
                max={winningsBalance.toString()}
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-muted/20 border-border"
                data-ocid="wallet.withdraw_amount_input"
                required
              />
            </div>

            <div
              className="rounded-lg p-3 text-xs"
              style={{
                background: "oklch(0.86 0.22 72 / 0.06)",
                border: "1px solid oklch(0.86 0.22 72 / 0.2)",
              }}
            >
              <p className="text-muted-foreground">
                ⏱ Admin will verify and transfer to your UPI within 24 hours.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border"
                onClick={() => setWithdrawOpen(false)}
                data-ocid="wallet.withdraw_cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 neon-btn-gold"
                disabled={requestWithdrawal.isPending}
                data-ocid="wallet.withdraw_submit_button"
              >
                {requestWithdrawal.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Request Withdrawal
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
