import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Clock, IndianRupee, LogIn, Trophy, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { Tournament } from "../backend.d";
import { TournamentStatus } from "../backend.d";

interface TournamentCardProps {
  tournament: Tournament | SampleTournament;
  index?: number;
  onJoin?: () => void;
  isLoggedIn?: boolean;
  markerIndex?: number;
}

export interface SampleTournament {
  id: string;
  name: string;
  description: string;
  prizePool: string;
  entryFee: bigint;
  maxSlots: bigint;
  status: TournamentStatus;
  startTime: bigint;
  upiQrImageId: string;
  createdAt: bigint;
  roomId?: string;
  roomPassword?: string;
  slotsUsed?: number;
}

function getStatusClass(status: TournamentStatus): string {
  switch (status) {
    case TournamentStatus.Live:
      return "status-live";
    case TournamentStatus.Upcoming:
      return "status-upcoming";
    case TournamentStatus.Completed:
      return "status-completed";
    case TournamentStatus.Cancelled:
      return "status-cancelled";
    default:
      return "status-upcoming";
  }
}

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

function formatEntryFee(fee: bigint): string {
  return fee === BigInt(0) ? "FREE" : `₹${fee.toString()}`;
}

export function TournamentCard({
  tournament,
  index = 0,
  isLoggedIn,
  markerIndex = 1,
}: TournamentCardProps) {
  const slotsUsed = "slotsUsed" in tournament ? (tournament.slotsUsed ?? 0) : 0;
  const maxSlots = Number(tournament.maxSlots);
  const slotsRemaining = maxSlots - slotsUsed;
  const isFull = slotsRemaining <= 0;
  const isEnded =
    tournament.status === TournamentStatus.Completed ||
    tournament.status === TournamentStatus.Cancelled;
  const joinDisabled = isFull || isEnded;

  const fillPercent = Math.min(100, (slotsUsed / maxSlots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      data-ocid={`tournaments.item.${markerIndex}`}
    >
      <div className="gaming-card rounded-lg relative overflow-hidden group">
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/60" />

        {/* Status pulse dot for Live */}
        {tournament.status === TournamentStatus.Live && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              LIVE
            </span>
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-foreground leading-tight mb-1 truncate">
                {tournament.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tournament.description}
              </p>
            </div>
            {tournament.status !== TournamentStatus.Live && (
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 ${getStatusClass(tournament.status)}`}
              >
                {tournament.status}
              </span>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/30 rounded p-2.5 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Prize Pool
                </span>
              </div>
              <p className="text-sm font-bold text-primary glow-text-cyan">
                {tournament.prizePool}
              </p>
            </div>
            <div className="bg-muted/30 rounded p-2.5 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <IndianRupee className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Entry Fee
                </span>
              </div>
              <p className="text-sm font-bold text-accent">
                {formatEntryFee(tournament.entryFee)}
              </p>
            </div>
          </div>

          {/* Slots */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Slots
                </span>
              </div>
              <span className="text-xs font-mono text-foreground">
                <span className={isFull ? "text-destructive" : "text-accent"}>
                  {isFull ? "FULL" : `${slotsRemaining} left`}
                </span>
                {" / "}
                <span className="text-muted-foreground">{maxSlots}</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPercent}%`,
                  background: isFull
                    ? "oklch(0.62 0.22 25)"
                    : fillPercent > 75
                      ? "oklch(0.75 0.2 60)"
                      : "oklch(0.82 0.22 138)",
                  boxShadow: isFull
                    ? "0 0 6px oklch(0.62 0.22 25 / 0.6)"
                    : "0 0 6px oklch(0.82 0.22 138 / 0.6)",
                }}
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDate(tournament.startTime)}</span>
          </div>

          {/* CTA */}
          <Link to="/tournament/$id" params={{ id: tournament.id }}>
            <Button
              className={`w-full text-xs uppercase tracking-wider font-bold ${
                joinDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : isLoggedIn
                    ? "neon-btn"
                    : "neon-btn"
              }`}
              disabled={joinDisabled}
              data-ocid={`tournaments.join_button.${markerIndex}`}
            >
              {isEnded ? (
                <span>{tournament.status}</span>
              ) : isFull ? (
                <span>Slots Full</span>
              ) : isLoggedIn ? (
                <>
                  <Zap className="w-3 h-3 mr-1.5" />
                  Join Tournament
                </>
              ) : (
                <>
                  <LogIn className="w-3 h-3 mr-1.5" />
                  Login to Join
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
