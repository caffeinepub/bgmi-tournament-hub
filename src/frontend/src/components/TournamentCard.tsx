import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  IndianRupee,
  LogIn,
  Medal,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Tournament } from "../backend.d";
import { GameType, TournamentStatus } from "../backend.d";

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
  prizePool: string | bigint;
  secondPrize?: bigint;
  thirdPrize?: bigint;
  entryFee: bigint;
  maxSlots: bigint;
  status: TournamentStatus;
  startTime: bigint;
  upiQrImageId: string;
  createdAt: bigint;
  roomId?: string;
  roomPassword?: string;
  slotsUsed?: number;
  gameType?: GameType;
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

function formatPrize(val: bigint | string | undefined): string {
  if (val === undefined || val === null) return "—";
  if (typeof val === "bigint")
    return val === BigInt(0) ? "—" : `₹${val.toString()}`;
  return val as string;
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
  const isFull = slotsUsed >= maxSlots;
  const fillPercent =
    maxSlots > 0 ? Math.min((slotsUsed / maxSlots) * 100, 100) : 0;
  const isEnded =
    tournament.status === TournamentStatus.Completed ||
    tournament.status === TournamentStatus.Cancelled;

  const fillColor =
    fillPercent >= 80
      ? "linear-gradient(90deg, oklch(0.60 0.24 20), oklch(0.65 0.26 25))"
      : fillPercent >= 50
        ? "linear-gradient(90deg, oklch(0.78 0.19 55), oklch(0.82 0.21 60))"
        : "linear-gradient(90deg, oklch(0.86 0.22 198), oklch(0.80 0.20 210))";
  const fillGlow =
    fillPercent >= 80
      ? "0 0 8px oklch(0.60 0.24 20 / 0.5)"
      : fillPercent >= 50
        ? "0 0 8px oklch(0.78 0.19 55 / 0.4)"
        : "0 0 8px oklch(0.86 0.22 198 / 0.4)";

  const handleJoinClick = () => {
    if (isFull && onJoinFull) {
      onJoinFull();
    }
  };

  // Determine game type for styling
  const gameType =
    (tournament as SampleTournament).gameType ??
    (tournament as Tournament).gameType;
  const isFF = gameType === GameType.FreeFire;
  const cardBorderClass = isFF ? "gaming-card-ff" : "gaming-card";

  // Prize values
  const prizePoolVal = tournament.prizePool;
  const secondPrize =
    (tournament as Tournament).secondPrize ??
    (tournament as SampleTournament).secondPrize;
  const thirdPrize =
    (tournament as Tournament).thirdPrize ??
    (tournament as SampleTournament).thirdPrize;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      data-ocid={`home.tournament_card.${markerIndex}`}
    >
      <div
        className={`${cardBorderClass} rounded-lg overflow-hidden flex flex-col h-full`}
      >
        {/* Top neon line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: isFF
              ? "linear-gradient(90deg, transparent, oklch(0.75 0.22 52), transparent)"
              : "linear-gradient(90deg, transparent, oklch(0.86 0.22 198 / 0.7), transparent)",
          }}
        />

        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Header: Name + Status + Game Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {/* Game type badge */}
                <span
                  className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                  style={{
                    background: isFF
                      ? "oklch(0.75 0.22 52 / 0.15)"
                      : "oklch(0.86 0.22 198 / 0.12)",
                    color: isFF
                      ? "oklch(0.80 0.22 52)"
                      : "oklch(0.86 0.22 198)",
                    border: isFF
                      ? "1px solid oklch(0.75 0.22 52 / 0.4)"
                      : "1px solid oklch(0.86 0.22 198 / 0.4)",
                  }}
                >
                  {isFF ? "FREE FIRE" : "BGMI"}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${getStatusClasses(tournament.status)}`}
                >
                  {tournament.status}
                </span>
              </div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-foreground truncate">
                {tournament.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {tournament.description}
          </p>

          {/* Prize Tiers */}
          <div className="grid grid-cols-3 gap-1.5">
            <div
              className="rounded p-2 text-center"
              style={{
                background: "oklch(0.78 0.19 55 / 0.08)",
                border: "1px solid oklch(0.78 0.19 55 / 0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Trophy className="w-2.5 h-2.5 text-neon-gold" />
                <span className="text-[8px] text-neon-gold font-bold uppercase tracking-wider">
                  1st
                </span>
              </div>
              <p className="font-black text-[11px] text-neon-gold glow-text-gold">
                {formatPrize(prizePoolVal)}
              </p>
            </div>
            <div
              className="rounded p-2 text-center"
              style={{
                background: "oklch(0.72 0.04 240 / 0.08)",
                border: "1px solid oklch(0.72 0.04 240 / 0.25)",
              }}
            >
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Medal className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                  2nd
                </span>
              </div>
              <p className="font-black text-[11px] text-muted-foreground">
                {formatPrize(secondPrize)}
              </p>
            </div>
            <div
              className="rounded p-2 text-center"
              style={{
                background: "oklch(0.65 0.08 40 / 0.08)",
                border: "1px solid oklch(0.65 0.08 40 / 0.25)",
              }}
            >
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Medal
                  className="w-2.5 h-2.5"
                  style={{ color: "oklch(0.65 0.12 45)" }}
                />
                <span
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{ color: "oklch(0.65 0.12 45)" }}
                >
                  3rd
                </span>
              </div>
              <p
                className="font-black text-[11px]"
                style={{ color: "oklch(0.65 0.12 45)" }}
              >
                {formatPrize(thirdPrize)}
              </p>
            </div>
          </div>

          {/* Entry fee + countdown */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-primary" />
              <span className="text-xs font-black text-primary glow-text-cyan">
                {formatEntryFee(tournament.entryFee)}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider ml-0.5">
                entry
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <CountdownTimer startTime={tournament.startTime} />
            </div>
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
                  className={`w-full text-[10px] uppercase tracking-wider font-bold ${isFF ? "neon-btn-ff" : "neon-btn"}`}
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
