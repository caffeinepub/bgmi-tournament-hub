import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  IndianRupee,
  Loader2,
  Medal,
  Phone,
  QrCode,
  Trophy,
  Upload,
  User,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameType, PaymentStatus, TournamentStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerRegistrations,
  useGetTournament,
  useGetUserProfile,
  useRegisterForTournament,
  useSaveUserProfile,
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
  gameType,
}: {
  roomId: string;
  roomPassword: string;
  gameType?: GameType;
}) {
  const [showPass, setShowPass] = useState(false);
  const isFF = gameType === GameType.FreeFire;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const borderColor = isFF
    ? "oklch(0.75 0.22 52 / 0.4)"
    : "oklch(0.75 0.22 135 / 0.4)";
  const glowColor = isFF
    ? "oklch(0.75 0.22 52 / 0.12)"
    : "oklch(0.75 0.22 135 / 0.12)";
  const textColor = isFF ? "oklch(0.78 0.22 52)" : "oklch(0.75 0.22 135)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg p-5 relative overflow-hidden"
      data-ocid="tournament.room_details_panel"
      style={{
        background: isFF
          ? "linear-gradient(135deg, oklch(0.10 0.025 50) 0%, oklch(0.08 0.018 55) 100%)"
          : "linear-gradient(135deg, oklch(0.10 0.025 145) 0%, oklch(0.08 0.018 155) 100%)",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 20px ${glowColor}, 0 4px 20px oklch(0.04 0.01 255 / 0.8)`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2"
        style={{ borderColor: textColor }}
      />
      <div
        className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2"
        style={{ borderColor: textColor }}
      />

      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5" style={{ color: textColor }} />
        <h3
          className="font-display font-black text-base uppercase tracking-wider"
          style={{ color: textColor }}
        >
          Room Details Revealed!
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className="rounded p-3 border"
          style={{
            background: isFF
              ? "oklch(0.08 0.02 50 / 0.6)"
              : "oklch(0.08 0.02 145 / 0.6)",
            borderColor: isFF
              ? "oklch(0.75 0.22 52 / 0.25)"
              : "oklch(0.75 0.22 135 / 0.25)",
          }}
        >
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
            Room ID
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono font-black text-foreground text-lg">
              {roomId}
            </p>
            <button
              type="button"
              onClick={() => copyToClipboard(roomId, "Room ID")}
              className="text-muted-foreground hover:text-neon-green transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          className="rounded p-3 border"
          style={{
            background: isFF
              ? "oklch(0.08 0.02 50 / 0.6)"
              : "oklch(0.08 0.02 145 / 0.6)",
            borderColor: isFF
              ? "oklch(0.75 0.22 52 / 0.25)"
              : "oklch(0.75 0.22 135 / 0.25)",
          }}
        >
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
            Password
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono font-black text-foreground text-lg">
              {showPass ? roomPassword : "••••••••"}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-muted-foreground hover:text-neon-green transition-colors"
              >
                {showPass ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(roomPassword, "Password")}
                className="text-muted-foreground hover:text-neon-green transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p
        className="text-[10px] mt-3 font-mono text-center uppercase tracking-widest"
        style={{ color: `${textColor}70` }}
      >
        ↑ Use these details in {isFF ? "Free Fire MAX" : "BGMI"} to enter the
        custom room ↑
      </p>
    </motion.div>
  );
}

function FullTournamentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm text-center gaming-card"
        data-ocid="full_tournament.dialog"
      >
        <DialogHeader>
          <div className="text-5xl text-center mb-2">😅</div>
          <DialogTitle className="font-display font-black text-xl uppercase tracking-wider text-center">
            You're Late!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            This tournament is already{" "}
            <span className="text-destructive font-bold">FULL</span>.
            <br />
            <span className="text-primary">
              Keep an eye out for the next one!
            </span>
          </DialogDescription>
        </DialogHeader>
        <Button
          className="neon-btn w-full mt-2"
          onClick={onClose}
          data-ocid="full_tournament.close_button"
        >
          Got it 👊
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function TournamentDetailPage() {
  const { id } = useParams({ from: "/tournament/$id" });
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { actor, isFetching: actorFetching } = useActor();

  const { data: tournament, isLoading: tournamentLoading } =
    useGetTournament(id);
  const { data: myRegistrations } = useCallerRegistrations();
  const { data: userProfile } = useGetUserProfile();
  const registerMutation = useRegisterForTournament();
  const saveProfileMutation = useSaveUserProfile();

  // Steps: "profile" | "details" | "payment" | "done"
  const [flowStep, setFlowStep] = useState<
    "profile" | "details" | "payment" | "done"
  >("details");
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    upiId: "",
  });
  const [gamePlayerId, setGamePlayerId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [fullDialogOpen, setFullDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myRegistration = myRegistrations?.find((r) => r.tournamentId === id);
  const isFF = tournament?.gameType === GameType.FreeFire;
  const gameLabel = isFF
    ? "Free Fire MAX In-Game ID (UID)"
    : "BGMI In-Game ID (UID)";
  const gamePlaceholder = isFF
    ? "Your Free Fire MAX player ID"
    : "Your BGMI player ID";

  // Check if profile is complete when user logs in
  useEffect(() => {
    if (isLoggedIn && userProfile !== undefined) {
      if (!userProfile || !userProfile.phone) {
        setFlowStep("profile");
      } else {
        setProfileForm({
          name: userProfile.name,
          phone: userProfile.phone,
          upiId: userProfile.upiId ?? "",
        });
        setFlowStep("details");
      }
    }
  }, [isLoggedIn, userProfile]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(profileForm.phone.replace(/\s+/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    try {
      await saveProfileMutation.mutateAsync({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        upiId: profileForm.upiId.trim(),
      });
      toast.success("Profile saved!");
      setFlowStep("details");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleJoinClick = () => {
    if (!tournament) return;
    setFlowStep("payment");
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    if (!gamePlayerId.trim()) {
      toast.error(`Please enter your ${isFF ? "Free Fire MAX" : "BGMI"} ID`);
      return;
    }
    setUploading(true);
    try {
      const screenshotId = `screenshot-${Date.now()}-${screenshotFile.name}`;
      await registerMutation.mutateAsync({
        tournamentId: id,
        playerName: userProfile?.name ?? profileForm.name,
        phone: userProfile?.phone ?? profileForm.phone,
        gamePlayerId: gamePlayerId.trim(),
        paymentScreenshotId: screenshotId,
      });
      toast.success("Registration submitted! Awaiting payment verification.");
      setFlowStep("done");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (tournamentLoading || actorFetching || !actor) {
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
        <p className="text-muted-foreground mb-4 text-sm">
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

  const statusClass =
    tournament.status === TournamentStatus.Live
      ? "status-live"
      : tournament.status === TournamentStatus.Upcoming
        ? "status-upcoming"
        : tournament.status === TournamentStatus.Completed
          ? "status-completed"
          : "status-cancelled";

  const accentColor = isFF ? "oklch(0.75 0.22 52)" : "oklch(0.86 0.22 198)";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs uppercase tracking-wider font-bold">
          All Tournaments
        </span>
      </Link>

      {/* Tournament info card */}
      <div className="gaming-card rounded-lg p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/50" />

        {/* Top neon line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor} / 0.6, transparent)`,
          }}
        />

        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* Game type badge */}
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm"
                style={{
                  background: isFF
                    ? "oklch(0.75 0.22 52 / 0.15)"
                    : "oklch(0.86 0.22 198 / 0.12)",
                  color: isFF ? "oklch(0.80 0.22 52)" : "oklch(0.86 0.22 198)",
                  border: isFF
                    ? "1px solid oklch(0.75 0.22 52 / 0.4)"
                    : "1px solid oklch(0.86 0.22 198 / 0.4)",
                }}
              >
                {isFF ? "FREE FIRE" : "BGMI"}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm shrink-0 ${statusClass}`}
              >
                {tournament.status}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-foreground mb-1 glow-text-cyan">
              {tournament.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tournament.description}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/20 rounded p-3 border border-border/40">
            <div className="flex items-center gap-1 mb-1">
              <IndianRupee className="w-3 h-3 text-primary" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Entry
              </span>
            </div>
            <p className="font-black text-primary glow-text-cyan">
              {tournament.entryFee === BigInt(0)
                ? "FREE"
                : `₹${tournament.entryFee}`}
            </p>
          </div>
          <div className="bg-muted/20 rounded p-3 border border-border/40">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Max Slots
              </span>
            </div>
            <p className="font-black text-foreground font-mono">{maxSlots}</p>
          </div>
          <div className="bg-muted/20 rounded p-3 border border-border/40">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Starts
              </span>
            </div>
            <p className="font-bold text-foreground text-xs leading-tight">
              {formatDate(tournament.startTime)}
            </p>
          </div>
          <div className="bg-muted/20 rounded p-3 border border-border/40">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Prize Pool
              </span>
            </div>
            <p className="font-black text-neon-gold glow-text-gold">
              ₹{tournament.prizePool.toString()}
            </p>
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-lg p-3 text-center"
            style={{
              background: "oklch(0.78 0.19 55 / 0.1)",
              border: "1px solid oklch(0.78 0.19 55 / 0.35)",
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-neon-gold" />
              <span className="text-[9px] text-neon-gold font-bold uppercase tracking-wider">
                1st Prize
              </span>
            </div>
            <p className="font-black text-neon-gold glow-text-gold">
              ₹{tournament.prizePool.toString()}
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              background: "oklch(0.72 0.04 240 / 0.08)",
              border: "1px solid oklch(0.72 0.04 240 / 0.3)",
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Medal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                2nd Prize
              </span>
            </div>
            <p className="font-black text-muted-foreground">
              {tournament.secondPrize > BigInt(0)
                ? `₹${tournament.secondPrize.toString()}`
                : "—"}
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              background: "oklch(0.65 0.08 40 / 0.08)",
              border: "1px solid oklch(0.65 0.08 40 / 0.3)",
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Medal
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.65 0.12 45)" }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: "oklch(0.65 0.12 45)" }}
              >
                3rd Prize
              </span>
            </div>
            <p className="font-black" style={{ color: "oklch(0.65 0.12 45)" }}>
              {tournament.thirdPrize > BigInt(0)
                ? `₹${tournament.thirdPrize.toString()}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* My registration status */}
      {myRegistration && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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
              gameType={tournament.gameType}
            />
          ) : myRegistration.paymentStatus === PaymentStatus.Pending ? (
            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded border border-neon-gold/20">
              <Clock className="w-5 h-5 text-neon-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Payment Under Review
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment screenshot is being verified. Room ID & Password
                  will appear here once confirmed.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-destructive">
                  Payment Rejected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment was not verified. Please contact support or
                  submit a new registration.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Join Flow */}
      {!myRegistration && !isEnded && (
        <div className="gaming-card rounded-lg p-6 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
            }}
          />

          {!isLoggedIn ? (
            <div className="text-center py-10">
              <Trophy className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg mb-2 uppercase tracking-wider">
                Login Required
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Login to register for this tournament and get your Room ID after
                payment verification.
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
              {/* Step: Profile */}
              {flowStep === "profile" && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSaveProfile}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase tracking-wider mb-1">
                      Complete Your Profile
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      We need your details before you can join a tournament.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Your Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                        <Input
                          placeholder="Your full name"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          data-ocid="profile.name_input"
                          required
                          className="bg-muted/20 border-border focus:border-primary/60 pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                        <Input
                          type="tel"
                          placeholder="10-digit phone number"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          data-ocid="profile.phone_input"
                          required
                          className="bg-muted/20 border-border focus:border-primary/60 pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        UPI ID
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                        <Input
                          placeholder="yourname@upi (optional)"
                          value={profileForm.upiId}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              upiId: e.target.value,
                            }))
                          }
                          data-ocid="profile.upi_input"
                          className="bg-muted/20 border-border focus:border-primary/60 pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="neon-btn"
                    disabled={saveProfileMutation.isPending}
                    data-ocid="profile.save_button"
                  >
                    {saveProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save & Continue →
                  </Button>
                </motion.form>
              )}

              {/* Step: Details (Join button) */}
              {flowStep === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase tracking-wider mb-1">
                      Ready to Join?
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Hi{" "}
                      <span className="text-primary font-bold">
                        {userProfile?.name ?? profileForm.name}
                      </span>
                      ! Enter your {isFF ? "Free Fire MAX" : "BGMI"} ID and
                      proceed to payment.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      {gameLabel} *
                    </Label>
                    <Input
                      placeholder={gamePlaceholder}
                      value={gamePlayerId}
                      onChange={(e) => setGamePlayerId(e.target.value)}
                      data-ocid="tournament.game_id_input"
                      className="bg-muted/20 border-border focus:border-primary/60"
                    />
                  </div>
                  {tournament.entryFee > BigInt(0) ? (
                    <Button
                      className={`w-full px-8 ${isFF ? "neon-btn-ff" : "neon-btn"}`}
                      onClick={() => {
                        if (!gamePlayerId.trim()) {
                          toast.error(
                            `Please enter your ${isFF ? "Free Fire MAX" : "BGMI"} ID`,
                          );
                          return;
                        }
                        handleJoinClick();
                      }}
                      data-ocid="tournament.join_button"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Pay via UPI &amp; Join (₹{tournament.entryFee.toString()})
                    </Button>
                  ) : (
                    <Button
                      className={`w-full sm:w-auto px-8 ${isFF ? "neon-btn-ff" : "neon-btn"}`}
                      onClick={() => {
                        if (!gamePlayerId.trim()) {
                          toast.error(
                            `Please enter your ${isFF ? "Free Fire MAX" : "BGMI"} ID`,
                          );
                          return;
                        }
                        handleJoinClick();
                      }}
                      data-ocid="tournament.join_button"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Join for Free
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Step: Payment */}
              {flowStep === "payment" && (
                <motion.form
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleFinalSubmit}
                  className="space-y-5"
                  data-ocid="tournament.payment_section"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="font-display font-bold text-lg uppercase tracking-wider">
                        Payment
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Scan QR, pay, upload screenshot
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFlowStep("details")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Entry fee display */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: isFF
                        ? "oklch(0.75 0.22 52 / 0.08)"
                        : "oklch(0.86 0.22 198 / 0.08)",
                      border: isFF
                        ? "1px solid oklch(0.75 0.22 52 / 0.3)"
                        : "1px solid oklch(0.86 0.22 198 / 0.3)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Amount to Pay
                      </span>
                      <span
                        className="font-display font-black text-3xl"
                        style={{ color: accentColor }}
                      >
                        {tournament.entryFee === BigInt(0)
                          ? "FREE"
                          : `₹${tournament.entryFee}`}
                      </span>
                    </div>
                  </div>

                  {/* UPI QR section */}
                  <div className="bg-muted/10 border border-border rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        UPI Payment
                      </h3>
                    </div>

                    <div className="flex justify-center mb-4">
                      {tournament.upiQrImageId ? (
                        <div className="w-52 h-52 bg-white rounded-xl flex items-center justify-center overflow-hidden border-4 border-primary/30 shadow-lg">
                          <img
                            src={tournament.upiQrImageId}
                            alt="UPI QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-52 h-52 bg-muted/20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
                          <QrCode className="w-12 h-12 text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground text-center">
                            QR code provided by admin
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Scan and pay{" "}
                      <strong className="text-primary">
                        ₹{tournament.entryFee.toString()}
                      </strong>{" "}
                      via UPI, then upload screenshot below
                    </p>
                  </div>

                  {/* Screenshot upload */}
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Upload Payment Screenshot *
                    </Label>
                    <label
                      className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors bg-muted/10"
                      data-ocid="tournament.upload_button"
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
                            className="max-h-36 rounded-lg object-contain border border-border"
                          />
                          <p className="text-xs text-neon-green font-bold">
                            ✓ {screenshotFile?.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Tap to change
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload payment screenshot
                          </p>
                          <p className="text-[10px] text-muted-foreground/50">
                            PNG, JPG up to 10MB
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
                    className={`w-full ${isFF ? "neon-btn-ff" : "neon-btn"}`}
                    data-ocid="tournament.submit_button"
                  >
                    {uploading || registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting…
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

              {/* Step: Done */}
              {flowStep === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div
                    className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "0 0 20px oklch(0.75 0.22 135 / 0.2)" }}
                  >
                    <CheckCircle className="w-8 h-8 text-neon-green glow-text-green" />
                  </div>
                  <h3 className="font-display font-black text-xl text-neon-green glow-text-green mb-2 uppercase tracking-wider">
                    Registered!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Your registration is submitted and awaiting payment
                    verification.
                    <br />
                    <span className="text-primary font-bold">
                      Room ID & Password will be revealed here once verified.
                    </span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Tournament ended state */}
      {isEnded && !myRegistration && (
        <div className="gaming-card rounded-lg p-8 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-muted-foreground mb-1 uppercase tracking-wider">
            Tournament {tournament.status}
          </h3>
          <p className="text-xs text-muted-foreground">
            Registration is closed for this tournament.
          </p>
        </div>
      )}

      {/* Full tournament dialog */}
      <FullTournamentDialog
        open={fullDialogOpen}
        onClose={() => setFullDialogOpen(false)}
      />
    </div>
  );
}
