import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Trophy,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerRegistrations,
  useListTournaments,
  useUpdatePaymentScreenshot,
} from "../hooks/useQueries";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === PaymentStatus.Verified
      ? "payment-verified"
      : status === PaymentStatus.Pending
        ? "payment-pending"
        : "payment-rejected";
  const icon =
    status === PaymentStatus.Verified ? (
      <CheckCircle className="w-3 h-3" />
    ) : status === PaymentStatus.Pending ? (
      <Clock className="w-3 h-3" />
    ) : (
      <AlertCircle className="w-3 h-3" />
    );

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${cls}`}
    >
      {icon}
      {status}
    </span>
  );
}

export function MyRegistrationsPage() {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: registrations, isLoading } = useCallerRegistrations();
  const { data: tournaments } = useListTournaments();
  const updateScreenshot = useUpdatePaymentScreenshot();

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getTournament = (id: string) => tournaments?.find((t) => t.id === id);

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScreenshotUpdate = async (regId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    try {
      const screenshotId = `screenshot-${Date.now()}-${file.name}`;
      await updateScreenshot.mutateAsync({
        registrationId: regId,
        paymentScreenshotId: screenshotId,
      });
      toast.success("Screenshot updated successfully!");
    } catch {
      toast.error("Failed to update screenshot");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Trophy className="w-12 h-12 text-primary/40 mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">
          Please login to view your tournament registrations.
        </p>
        <Button
          onClick={login}
          className="neon-btn px-8"
          data-ocid="nav.login_button"
        >
          Login to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-5 w-1 bg-primary rounded-full" />
        <h1 className="font-display font-black text-2xl uppercase tracking-wider">
          My Registrations
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="my_registrations.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="gaming-card rounded-lg p-5">
              <Skeleton className="h-5 w-1/3 bg-muted/50 mb-3" />
              <Skeleton className="h-3 w-1/4 bg-muted/30 mb-4" />
              <Skeleton className="h-8 w-24 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      ) : !registrations || registrations.length === 0 ? (
        <div
          className="text-center py-20 gaming-card rounded-lg"
          data-ocid="my_registrations.empty_state"
        >
          <Trophy className="w-10 h-10 text-primary/40 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-muted-foreground mb-2">
            No Registrations Yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            You haven't joined any tournaments. Browse available ones and join
            now!
          </p>
          <Link to="/">
            <Button className="neon-btn">Browse Tournaments</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="my_registrations.list">
          {registrations.map((reg, idx) => {
            const tournament = getTournament(reg.tournamentId);
            const canUpdate =
              reg.paymentStatus === PaymentStatus.Pending ||
              reg.paymentStatus === PaymentStatus.Rejected;

            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                data-ocid={`my_registrations.item.${idx + 1}`}
              >
                <div className="gaming-card rounded-lg p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40" />

                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">
                        {tournament?.name ?? reg.tournamentId}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Registered: {formatDate(reg.registeredAt)}
                      </p>
                    </div>
                    <PaymentBadge status={reg.paymentStatus} />
                  </div>

                  {/* Player info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Player", value: reg.playerName },
                      { label: "BGMI ID", value: reg.bgmiId },
                      { label: "Phone", value: reg.phone },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-muted/20 rounded p-2 border border-border/40"
                      >
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          {label}
                        </p>
                        <p className="text-xs font-medium text-foreground truncate">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Verified: show room details */}
                  {reg.paymentStatus === PaymentStatus.Verified &&
                    tournament?.roomId &&
                    tournament?.roomPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <p className="text-xs font-bold text-accent uppercase tracking-wider glow-text-green">
                            Room Details
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-background/50 rounded p-2.5">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Room ID
                            </p>
                            <p className="font-mono font-bold text-sm text-foreground">
                              {tournament.roomId}
                            </p>
                          </div>
                          <div className="bg-background/50 rounded p-2.5">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Password
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-sm text-foreground flex-1">
                                {showPasswords[reg.id]
                                  ? tournament.roomPassword
                                  : "••••••••"}
                              </p>
                              <button
                                type="button"
                                onClick={() => togglePassword(reg.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords[reg.id] ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  {/* Pending message */}
                  {reg.paymentStatus === PaymentStatus.Pending && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-4">
                      <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Payment is under review. Room ID & Password will appear
                        here once verified.
                      </p>
                    </div>
                  )}

                  {/* Rejected message + re-upload */}
                  {reg.paymentStatus === PaymentStatus.Rejected && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded mb-4">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Payment was rejected. Please upload a new screenshot.
                      </p>
                    </div>
                  )}

                  {/* Update screenshot button */}
                  {canUpdate && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[reg.id]?.click()}
                        className="border-border hover:border-primary/60 text-xs uppercase tracking-wider"
                        disabled={updateScreenshot.isPending}
                      >
                        {updateScreenshot.isPending ? (
                          <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 mr-1.5" />
                        )}
                        Update Screenshot
                      </Button>
                      <Link
                        to="/tournament/$id"
                        params={{ id: reg.tournamentId }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                        >
                          View Tournament
                        </Button>
                      </Link>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[reg.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScreenshotUpdate(reg.id, file);
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
