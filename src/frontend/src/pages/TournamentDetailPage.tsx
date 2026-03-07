import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  IndianRupee,
  Loader2,
  QrCode,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentStatus, TournamentStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerRegistrations,
  useGetTournament,
  useRegisterForTournament,
} from "../hooks/useQueries";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === PaymentStatus.Verified
      ? "payment-verified"
      : status === PaymentStatus.Pending
        ? "payment-pending"
        : "payment-rejected";
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${cls}`}
    >
      {status}
    </span>
  );
}

function RoomRevealCard({
  roomId,
  roomPassword,
}: { roomId: string; roomPassword: string }) {
  const [show, setShow] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="gaming-card rounded-lg p-5 glow-border-green relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent/60" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent/60" />
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-accent" />
        <h3 className="font-display font-bold text-accent glow-text-green uppercase tracking-wider">
          Room Details Revealed
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded p-3 border border-accent/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Room ID
          </p>
          <p className="font-mono font-bold text-foreground">{roomId}</p>
        </div>
        <div className="bg-muted/30 rounded p-3 border border-accent/20 relative">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Password
          </p>
          <div className="flex items-center gap-2">
            <p className="font-mono font-bold text-foreground flex-1">
              {show ? roomPassword : "••••••••"}
            </p>
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TournamentDetailPage() {
  const { id } = useParams({ from: "/tournament/$id" });
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: tournament, isLoading: tournamentLoading } =
    useGetTournament(id);
  const { data: myRegistrations } = useCallerRegistrations();
  const registerMutation = useRegisterForTournament();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    playerName: "",
    email: "",
    phone: "",
    bgmiId: "",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myRegistration = myRegistrations?.find((r) => r.tournamentId === id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.playerName ||
      !formData.email ||
      !formData.phone ||
      !formData.bgmiId
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile) {
      toast.error("Please upload payment screenshot");
      return;
    }
    setUploading(true);
    try {
      // Read file as base64 for storage ID (using filename + timestamp as mock ID)
      const screenshotId = `screenshot-${Date.now()}-${screenshotFile.name}`;
      await registerMutation.mutateAsync({
        tournamentId: id,
        playerName: formData.playerName,
        email: formData.email,
        phone: formData.phone,
        bgmiId: formData.bgmiId,
        paymentScreenshotId: screenshotId,
      });
      toast.success("Registration submitted! Awaiting payment verification.");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (tournamentLoading) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-4xl"
        data-ocid="tournament.loading_state"
      >
        <Skeleton className="h-8 w-64 bg-muted/50 mb-6" />
        <div className="gaming-card rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-1/2 bg-muted/50" />
          <Skeleton className="h-4 w-full bg-muted/30" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 bg-muted/30 rounded" />
            <Skeleton className="h-16 bg-muted/30 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="tournament.error_state"
      >
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">
          Tournament Not Found
        </h2>
        <p className="text-muted-foreground mb-4">
          This tournament doesn't exist or has been removed.
        </p>
        <Link to="/">
          <Button className="neon-btn">Back to Tournaments</Button>
        </Link>
      </div>
    );
  }

  const maxSlots = Number(tournament.maxSlots);
  const isEnded =
    tournament.status === TournamentStatus.Completed ||
    tournament.status === TournamentStatus.Cancelled;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back */}
      <Link
        to="/"
        className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm uppercase tracking-wider">
          All Tournaments
        </span>
      </Link>

      {/* Tournament header */}
      <div className="gaming-card rounded-lg p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/60" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/60" />

        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-foreground mb-1">
              {tournament.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tournament.description}
            </p>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm shrink-0 ${
              tournament.status === TournamentStatus.Live
                ? "status-live"
                : tournament.status === TournamentStatus.Upcoming
                  ? "status-upcoming"
                  : tournament.status === TournamentStatus.Completed
                    ? "status-completed"
                    : "status-cancelled"
            }`}
          >
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded p-3 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Prize
              </span>
            </div>
            <p className="font-bold text-primary glow-text-cyan">
              {tournament.prizePool}
            </p>
          </div>
          <div className="bg-muted/30 rounded p-3 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee className="w-3 h-3 text-accent" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Entry
              </span>
            </div>
            <p className="font-bold text-accent">
              {tournament.entryFee === BigInt(0)
                ? "FREE"
                : `₹${tournament.entryFee}`}
            </p>
          </div>
          <div className="bg-muted/30 rounded p-3 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Slots
              </span>
            </div>
            <p className="font-bold text-foreground font-mono">{maxSlots}</p>
          </div>
          <div className="bg-muted/30 rounded p-3 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Start
              </span>
            </div>
            <p className="font-bold text-foreground text-xs">
              {formatDate(tournament.startTime)}
            </p>
          </div>
        </div>
      </div>

      {/* My Registration status if already registered */}
      {myRegistration && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg uppercase tracking-wider">
              Your Registration
            </h2>
            <PaymentStatusBadge status={myRegistration.paymentStatus} />
          </div>

          {myRegistration.paymentStatus === PaymentStatus.Verified &&
          tournament.roomId &&
          tournament.roomPassword ? (
            <RoomRevealCard
              roomId={tournament.roomId}
              roomPassword={tournament.roomPassword}
            />
          ) : myRegistration.paymentStatus === PaymentStatus.Pending ? (
            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded border border-border">
              <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Payment Under Review
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment screenshot is being verified. Room details will
                  appear once confirmed.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Payment Rejected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment was not verified. Please contact support or
                  re-upload a valid screenshot.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Join Flow - only show if not already registered and not ended */}
      {!myRegistration && !isEnded && (
        <div className="gaming-card rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display font-bold text-xl uppercase tracking-wider">
              {isLoggedIn ? "Join Tournament" : "Login to Join"}
            </h2>
            {isLoggedIn && (
              <div className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    step === 1
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border"
                  }`}
                >
                  1
                </div>
                <div className="w-6 h-[1px] bg-border" />
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    step === 2
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border"
                  }`}
                >
                  2
                </div>
              </div>
            )}
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                You need to be logged in to register for this tournament.
              </p>
              <Button
                onClick={login}
                className="neon-btn px-8"
                data-ocid="tournament.join_button"
              >
                Login to Join
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleStep1Submit}
                  data-ocid="tournament.register_form"
                  className="space-y-4"
                >
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Step 1 of 2 — Player Details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Player Name *
                      </Label>
                      <Input
                        placeholder="Your in-game name"
                        value={formData.playerName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            playerName: e.target.value,
                          }))
                        }
                        data-ocid="tournament.name_input"
                        required
                        className="bg-muted/30 border-border focus:border-primary/60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Email Address *
                      </Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, email: e.target.value }))
                        }
                        data-ocid="tournament.email_input"
                        required
                        className="bg-muted/30 border-border focus:border-primary/60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Phone Number *
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, phone: e.target.value }))
                        }
                        data-ocid="tournament.phone_input"
                        required
                        className="bg-muted/30 border-border focus:border-primary/60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        BGMI In-Game ID *
                      </Label>
                      <Input
                        placeholder="Your BGMI player ID"
                        value={formData.bgmiId}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, bgmiId: e.target.value }))
                        }
                        data-ocid="tournament.bgmi_input"
                        required
                        className="bg-muted/30 border-border focus:border-primary/60"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="neon-btn w-full md:w-auto px-8"
                      data-ocid="tournament.submit_button"
                    >
                      Continue to Payment →
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleFinalSubmit}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Step 2 of 2 — Payment
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Entry fee display */}
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground uppercase tracking-wider">
                        Entry Fee to Pay
                      </span>
                      <span className="font-display font-black text-2xl text-primary glow-text-cyan">
                        {tournament.entryFee === BigInt(0)
                          ? "FREE"
                          : `₹${tournament.entryFee}`}
                      </span>
                    </div>
                  </div>

                  {/* UPI QR section */}
                  <div className="bg-muted/20 border border-border rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">
                        UPI Payment
                      </h3>
                    </div>

                    {tournament.upiQrImageId ? (
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-primary/30">
                          <img
                            src={tournament.upiQrImageId}
                            alt="UPI QR Code"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-muted/30 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                          <QrCode className="w-10 h-10 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground text-center">
                            QR Code will be provided by admin
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      Scan the QR code and pay{" "}
                      <strong className="text-primary">
                        ₹{tournament.entryFee.toString()}
                      </strong>{" "}
                      via UPI
                    </p>
                  </div>

                  {/* Screenshot upload */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Upload Payment Screenshot *
                    </Label>
                    <label
                      className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                      data-ocid="payment.upload_button"
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
                            alt="Payment screenshot"
                            className="max-h-32 rounded object-contain"
                          />
                          <p className="text-xs text-accent">
                            {screenshotFile?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground/60" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload payment screenshot
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      uploading || registerMutation.isPending || !screenshotFile
                    }
                    className="neon-btn w-full"
                    data-ocid="payment.submit_button"
                  >
                    {uploading || registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {isEnded && !myRegistration && (
        <div className="gaming-card rounded-lg p-8 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-muted-foreground mb-1">
            Tournament {tournament.status}
          </h3>
          <p className="text-sm text-muted-foreground">
            Registration is closed for this tournament.
          </p>
        </div>
      )}
    </div>
  );
}
