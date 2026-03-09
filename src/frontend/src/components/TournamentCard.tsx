import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Clock, IndianRupee, LogIn, Trophy, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Tournament } from "../backend.d";
import { TournamentStatus } from "../backend.d";

interface TournamentCardProps {
  tournament: Tournament | SampleTournament;
  index?: number;
  isLoggedIn?: boolean;
  markerIndex?: number;
  onJoinFull?: () => void;
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

function getStatusClasses(status: TournamentStatus): string {
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

function formatEntryFee(fee: bigint): string {
  return fee === BigInt(0) ? "FREE" : `₹${fee.toString()}`;
}

function useCountdown(startTimeNanos: bigint) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isPast: false,
  });

  useEffect(() => {
    const compute = () => {
      const nowMs = Date.now();
      const startMs = Number(startTimeNanos / 1_000_000n);
      const diff = startMs - nowMs;

      if (diff <= 0) {
        // Check if it's within the last 2 hours (assume live)
        const hoursPast = -diff / (1000 * 60 * 60);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: hoursPast < 2,
          isPast: hoursPast >= 2,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isLive: false,
        isPast: false,
      });
    };

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [startTimeNanos]);

  return timeLeft;
}

function CountdownTimer({ startTime }: { startTime: bigint }) {
  const { days, hours, minutes, seconds, isLive, isPast } =
    useCountdown(startTime);

  if (isLive || isPast) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-neon-green glow-text-green animate-pulse">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-ping inline-block" />
          LIVE NOW
        </span>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      {days > 0 && (
        <>
          <div className="countdown-box rounded px-1.5 py-0.5 text-center min-w-[28px]">
            <span className="text-xs font-mono font-bold text-primary glow-text-cyan">
              {pad(days)}
            </span>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
              d
            </div>
          </div>
          <span className="text-muted-foreground text-xs">:</span>
        </>
      )}
      <div className="countdown-box rounded px-1.5 py-0.5 text-center min-w-[28px]">
        <span className="text-xs font-mono font-bold text-primary glow-text-cyan">
          {pad(hours)}
        </span>
        <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
          h
        </div>
      </div>
      <span className="text-muted-foreground text-xs">:</span>
      <div className="countdown-box rounded px-1.5 py-0.5 text-center min-w-[28px]">
        <span className="text-xs font-mono font-bold text-primary glow-text-cyan">
          {pad(minutes)}
        </span>
        <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
          m
        </div>
      </div>
      <span className="text-muted-foreground text-xs">:</span>
      <div className="countdown-box rounded px-1.5 py-0.5 text-center min-w-[28px]">
        <span className="text-xs font-mono font-bold text-accent glow-text-gold">
          {pad(seconds)}
        </span>
        <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
          s
        </div>
      </div>
    </div>
  );
}

export function TournamentCard({
  tournament,
  index = 0,
  isLoggedIn,
  markerIndex = 1,
  onJoinFull,
}: TournamentCardProps) {
  const slotsUsed = "slotsUsed" in tournament ? (tournament.slotsUsed ?? 0) : 0;
  const maxSlots = Number(tournament.maxSlots);
  const slotsRemaining = maxSlots - slotsUsed;
  const isFull = slotsRemaining <= 0;
  const isEnded =
    tournament.status === TournamentStatus.Completed ||
    tournament.status === TournamentStatus.Cancelled;
  const isLive = tournament.status === TournamentStatus.Live;

  const fillPercent = Math.min(100, (slotsUsed / maxSlots) * 100);

  const fillColor = isFull
    ? "oklch(0.60 0.24 20)"
    : fillPercent > 80
      ? "oklch(0.78 0.19 55)"
      : "oklch(0.86 0.22 198)";

  const fillGlow = isFull
    ? "0 0 6px oklch(0.60 0.24 20 / 0.6)"
    : fillPercent > 80
      ? "0 0 6px oklch(0.78 0.19 55 / 0.6)"
      : "0 0 6px oklch(0.86 0.22 198 / 0.6)";

  const handleJoinClick = (e: React.MouseEvent) => {
    if (isFull && onJoinFull) {
      e.preventDefault();
      onJoinFull();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: "easeOut" }}
      data-ocid={`home.tournament_card.${markerIndex}`}
    >
      <div className="gaming-card rounded-lg relative overflow-hidden group h-full flex flex-col">
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/50 z-10" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/50 z-10" />

        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            <span className="text-[10px] font-black text-neon-green uppercase tracking-widest glow-text-green">
              LIVE
            </span>
          </div>
        )}

        {/* Neon accent line at top */}
        <div
          className="h-[2px] w-full"
          style={{
            background: isLive
              ? "linear-gradient(90deg, transparent, oklch(0.75 0.22 135), transparent)"
              : "linear-gradient(90deg, transparent, oklch(0.86 0.22 198), transparent)",
          }}
        />

        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Tournament name + status */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-black text-base leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {tournament.name}
            </h3>
            {!isLive && (
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 mt-0.5 ${getStatusClasses(tournament.status)}`}
              >
                {tournament.status}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {tournament.description}
          </p>

          {/* Prize + Entry fee */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/20 rounded p-2.5 border border-border/40">
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="w-2.5 h-2.5 text-neon-gold" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  Prize
                </span>
              </div>
              <p className="text-sm font-black text-neon-gold glow-text-gold">
                {tournament.prizePool}
              </p>
            </div>
            <div className="bg-muted/20 rounded p-2.5 border border-border/40">
              <div className="flex items-center gap-1 mb-1">
                <IndianRupee className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  Entry
                </span>
              </div>
              <p className="text-sm font-black text-primary glow-text-cyan">
                {formatEntryFee(tournament.entryFee)}
              </p>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <CountdownTimer startTime={tournament.startTime} />
          </div>

          {/* Participant progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  Slots
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span
                  className={
                    isFull ? "text-destructive font-bold" : "text-foreground"
                  }
                >
                  {slotsUsed}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{maxSlots}</span>
                {isFull && (
                  <span className="ml-1 text-destructive font-bold uppercase tracking-wider">
                    FULL
                  </span>
                )}
                {!isFull && (
                  <span className="ml-1 text-muted-foreground">
                    ({slotsRemaining} left)
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/30">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${fillPercent}%` }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
                style={{
                  background: fillColor,
                  boxShadow: fillGlow,
                }}
              />
            </div>
            <div className="text-[9px] text-muted-foreground/60 font-mono text-right">
              {Math.round(fillPercent)}% filled
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-1">
            {isFull ? (
              <Button
                onClick={handleJoinClick}
                className="w-full text-[10px] uppercase tracking-wider font-bold bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30 transition-all"
                variant="ghost"
                data-ocid={`home.join_button.${markerIndex}`}
              >
                You're Late — Slots Full
              </Button>
            ) : isEnded ? (
              <Button
                disabled
                className="w-full text-[10px] uppercase tracking-wider opacity-40"
                variant="ghost"
              >
                {tournament.status}
              </Button>
            ) : (
              <Link to="/tournament/$id" params={{ id: tournament.id }}>
                <Button
                  className="w-full text-[10px] uppercase tracking-wider font-bold neon-btn"
                  data-ocid={`home.join_button.${markerIndex}`}
                >
                  {isLoggedIn ? (
                    <>
                      <Zap className="w-3 h-3 mr-1.5" />
                      Join Now
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3 h-3 mr-1.5" />
                      Login to Join
                    </>
                  )}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
