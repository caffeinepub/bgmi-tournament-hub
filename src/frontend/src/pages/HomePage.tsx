import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { TournamentStatus } from "../backend.d";
import {
  type SampleTournament,
  TournamentCard,
} from "../components/TournamentCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useListTournaments } from "../hooks/useQueries";

const SAMPLE_TOURNAMENTS: SampleTournament[] = [
  {
    id: "sample-1",
    name: "BGMI Pro League S1",
    description:
      "India's most competitive BGMI tournament. Battle 100 squads for the ultimate prize pool. Only the best survive.",
    prizePool: "₹5,000",
    entryFee: BigInt(50),
    maxSlots: BigInt(100),
    status: TournamentStatus.Upcoming,
    startTime: BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
    upiQrImageId: "",
    createdAt: BigInt(Date.now()) * BigInt(1_000_000),
    slotsUsed: 64,
  },
  {
    id: "sample-2",
    name: "Weekend Warriors Cup",
    description:
      "Fast-paced weekend showdown for squads ready to prove their dominance. Live now — limited slots remaining!",
    prizePool: "₹2,000",
    entryFee: BigInt(20),
    maxSlots: BigInt(50),
    status: TournamentStatus.Live,
    startTime: BigInt(Date.now()) * BigInt(1_000_000),
    upiQrImageId: "",
    createdAt: BigInt(Date.now() - 2 * 60 * 60 * 1000) * BigInt(1_000_000),
    slotsUsed: 43,
  },
  {
    id: "sample-3",
    name: "Chicken Dinner Classic",
    description:
      "Premium BGMI tournament featuring Erangel & Miramar maps. Prove your worth, claim the chicken dinner.",
    prizePool: "₹10,000",
    entryFee: BigInt(100),
    maxSlots: BigInt(100),
    status: TournamentStatus.Upcoming,
    startTime:
      BigInt(Date.now() + 14 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
    upiQrImageId: "",
    createdAt: BigInt(Date.now()) * BigInt(1_000_000),
    slotsUsed: 28,
  },
];

function TournamentSkeleton() {
  return (
    <div className="gaming-card rounded-lg p-5 space-y-4">
      <Skeleton className="h-5 w-3/4 bg-muted/50" />
      <Skeleton className="h-3 w-full bg-muted/30" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 bg-muted/30 rounded" />
        <Skeleton className="h-14 bg-muted/30 rounded" />
      </div>
      <Skeleton className="h-2 bg-muted/30 rounded-full" />
      <Skeleton className="h-9 bg-muted/40 rounded" />
    </div>
  );
}

export function HomePage() {
  const { data: tournaments, isLoading } = useListTournaments();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const displayTournaments =
    tournaments && tournaments.length > 0 ? tournaments : SAMPLE_TOURNAMENTS;
  const isSampleData = !tournaments || tournaments.length === 0;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[260px] sm:h-[320px] md:h-[400px] w-full">
          <img
            src="/assets/generated/hero-banner.dim_1200x400.jpg"
            alt="BGMI Tournament Hub"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Scanline effect */}
          <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />

          {/* Hero content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-[2px] w-8 bg-primary" />
                  <span className="text-xs font-mono text-primary uppercase tracking-widest glow-text-cyan">
                    India's Premier Gaming Platform
                  </span>
                </div>
                <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-none tracking-tight mb-3">
                  <span className="text-foreground">BGMI</span>
                  <br />
                  <span className="text-primary glow-text-cyan">
                    TOURNAMENT
                  </span>
                  <br />
                  <span className="text-foreground">HUB</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Register. Compete. Conquer. Join elite BGMI tournaments and
                  claim your prize.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-y border-border bg-card/50"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-8 md:gap-16">
          {[
            { icon: Trophy, label: "Active Tournaments", value: "3+" },
            { icon: Zap, label: "Prize Money", value: "₹17K+" },
            { icon: Shield, label: "Verified Platform", value: "100%" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold text-primary glow-text-cyan">
                  {value}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:block">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tournaments Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h2 className="font-display font-bold text-xl tracking-wider uppercase">
              Active Tournaments
            </h2>
          </div>
          {isSampleData && !isLoading && (
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-sm uppercase tracking-wider">
              Sample Data
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-ocid="tournaments.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <TournamentSkeleton key={i} />
            ))}
          </div>
        ) : displayTournaments.length === 0 ? (
          <div
            className="text-center py-20 gaming-card rounded-lg"
            data-ocid="tournaments.empty_state"
          >
            <Trophy className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-muted-foreground mb-1">
              No Tournaments Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back soon — tournaments will appear here.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-ocid="tournaments.list"
          >
            {displayTournaments.map((tournament, idx) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                index={idx}
                isLoggedIn={isLoggedIn}
                markerIndex={idx + 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
