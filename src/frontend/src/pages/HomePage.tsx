import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Gamepad2,
  MapPin,
  Swords,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TournamentStatus } from "../backend.d";
import {
  type SampleTournament,
  TournamentCard,
} from "../components/TournamentCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useListTournaments } from "../hooks/useQueries";

// ---- BGMI Maps Data ----
const BGMI_MAPS = [
  {
    id: "erangel",
    name: "Erangel",
    size: "8×8 km",
    sizeTag: "CLASSIC",
    terrain: "Mixed — Fields, Forests, Towns",
    color: "oklch(0.70 0.18 145)",
    bgColor: "oklch(0.12 0.025 155)",
    tips: [
      "Control Georgopol and Pochinki for best loot",
      "Long-range combat favors sniper rifles",
      "Military Base has top-tier loot with high risk",
      "Blue zone is slow — use vehicles to rotate safely",
    ],
    description:
      "The original 8×8 km island where it all began. A diverse landscape of forests, fields, and towns rewards strategic players who can manage both close-quarters and long-range combat.",
  },
  {
    id: "miramar",
    name: "Miramar",
    size: "8×8 km",
    sizeTag: "DESERT",
    terrain: "Open Desert, Rocky Hills",
    color: "oklch(0.75 0.19 60)",
    bgColor: "oklch(0.12 0.025 65)",
    tips: [
      "Use vehicles strategically — the desert is huge",
      "Hillside cover is crucial for survival",
      "High-risk, high-reward towns like Los Leones",
      "Snipers dominate the open terrain",
    ],
    description:
      "An 8×8 km desert wasteland that demands vehicle mastery and long-range skills. The sun-baked terrain offers little cover — adapt or die.",
  },
  {
    id: "sanhok",
    name: "Sanhok",
    size: "4×4 km",
    sizeTag: "JUNGLE",
    terrain: "Dense Jungle, Rivers",
    color: "oklch(0.72 0.22 145)",
    bgColor: "oklch(0.10 0.028 155)",
    tips: [
      "Fast-paced close combat — SMGs and shotguns shine",
      "Boot Camp has the best loot on the map",
      "Always check the rivers — they're ambush zones",
      "Circles are smaller and faster here",
    ],
    description:
      "A compact 4×4 km tropical rainforest. High loot density and fast circles make this a non-stop action fest. Blink and you're dead.",
  },
  {
    id: "vikendi",
    name: "Vikendi",
    size: "6×6 km",
    sizeTag: "SNOW",
    terrain: "Snowy Mountains, Frozen Lakes",
    color: "oklch(0.80 0.10 220)",
    bgColor: "oklch(0.11 0.018 235)",
    tips: [
      "Footprints in snow reveal enemy positions",
      "Dino Park is the go-to for early loot",
      "Cold weather reduces bullet drop visibility",
      "Snowmobiles are fastest for rotation",
    ],
    description:
      "A 6×6 km snow biome with a unique mechanic — your footprints betray your position. Stealth matters more here than anywhere else.",
  },
  {
    id: "livik",
    name: "Livik",
    size: "2×2 km",
    sizeTag: "NORDIC",
    terrain: "Mixed Nordic Terrain",
    color: "oklch(0.68 0.28 285)",
    bgColor: "oklch(0.10 0.028 285)",
    tips: [
      "Extremely fast circles — always stay alert",
      "Very aggressive play style required",
      "Power Plant is the hotspot for fights",
      "Hot drops are unavoidable here",
    ],
    description:
      "The smallest original BGMI map at 2×2 km. Ultra-fast games that punish passive play and reward hyper-aggression.",
  },
  {
    id: "karakin",
    name: "Karakin",
    size: "2×2 km",
    sizeTag: "DESERT",
    terrain: "Arid Desert, Crumbling Buildings",
    color: "oklch(0.72 0.20 45)",
    bgColor: "oklch(0.11 0.022 50)",
    tips: [
      "Walls can be breached with sticky bombs",
      "Sticky bombs are a unique mechanic — learn them",
      "Always check rooftops for snipers",
      "Building destruction changes the entire flow",
    ],
    description:
      "A 2×2 km destructible desert map where nothing is safe. Walls crumble, rooftops collapse — every building is a potential tomb.",
  },
  {
    id: "nusa",
    name: "Nusa",
    size: "1×1 km",
    sizeTag: "ISLAND",
    terrain: "Tropical Beach Paradise",
    color: "oklch(0.78 0.19 180)",
    bgColor: "oklch(0.10 0.025 185)",
    tips: [
      "Smallest map ever — ultra-fast games",
      "Use vehicles constantly for positioning",
      "Short-range weapons dominate the entire map",
      "Matches last under 10 minutes",
    ],
    description:
      "BGMI's tiniest map at just 1×1 km. A beautiful island paradise that hides brutal combat at every corner. Blink and the match is over.",
  },
  {
    id: "rondo",
    name: "Rondo",
    size: "6×6 km",
    sizeTag: "URBAN",
    terrain: "Cyberpunk Futuristic City",
    color: "oklch(0.75 0.22 310)",
    bgColor: "oklch(0.10 0.028 305)",
    tips: [
      "Multi-level combat in skyscrapers",
      "Ziplines allow rapid vertical rotation",
      "Urban warfare specialist advantage",
      "Cover behind tech structures is abundant",
    ],
    description:
      "A 6×6 km cyberpunk metropolis that rewrites the rules of battle royale. Skyscrapers, ziplines, and futuristic infrastructure create a vertical warfare experience.",
  },
];

const SAMPLE_TOURNAMENTS: SampleTournament[] = [
  {
    id: "sample-1",
    name: "BGMI Pro League Season 1",
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
      "Fast-paced weekend showdown for squads. Live now — limited slots remaining. Don't miss out!",
    prizePool: "₹2,000",
    entryFee: BigInt(20),
    maxSlots: BigInt(50),
    status: TournamentStatus.Live,
    startTime: BigInt(Date.now() - 30 * 60 * 1000) * BigInt(1_000_000),
    upiQrImageId: "",
    createdAt: BigInt(Date.now() - 2 * 60 * 60 * 1000) * BigInt(1_000_000),
    slotsUsed: 43,
  },
  {
    id: "sample-3",
    name: "Chicken Dinner Classic",
    description:
      "Premium BGMI tournament. Prove your worth on Erangel & Miramar. Claim the chicken dinner.",
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

function MapCard({
  map,
  index,
}: { map: (typeof BGMI_MAPS)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      data-ocid={`home.map_card.${index + 1}`}
    >
      <button
        type="button"
        className="map-card rounded-lg overflow-hidden w-full text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{ borderColor: `${map.color}30` }}
      >
        {/* Map header */}
        <div
          className="p-4"
          style={{
            background: `linear-gradient(135deg, ${map.bgColor} 0%, oklch(0.08 0.015 255) 100%)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Color indicator */}
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                style={{
                  background: `${map.color}22`,
                  border: `1.5px solid ${map.color}50`,
                  boxShadow: `0 0 10px ${map.color}30`,
                }}
              >
                <MapPin className="w-4 h-4" style={{ color: map.color }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="font-display font-black text-base uppercase tracking-wider"
                    style={{ color: map.color }}
                  >
                    {map.name}
                  </h3>
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: `${map.color}18`,
                      color: map.color,
                      border: `1px solid ${map.color}40`,
                    }}
                  >
                    {map.sizeTag}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: "oklch(0.86 0.22 198 / 0.10)",
                      color: "oklch(0.86 0.22 198)",
                      border: "1px solid oklch(0.86 0.22 198 / 0.30)",
                    }}
                  >
                    {map.size}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {map.terrain}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-7 w-7 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              data-ocid={`home.map_card_expand_button.${index + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {map.description}
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Swords className="w-3 h-3" style={{ color: map.color }} />
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: map.color }}
                    >
                      Pro Tips
                    </span>
                  </div>
                  {map.tips.map((tip, i) => (
                    <div key={tip} className="flex items-start gap-2">
                      <span
                        className="text-[8px] font-black mt-0.5 shrink-0"
                        style={{ color: map.color }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[11px] text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

// Full Tournament popup for when user clicks "You're Late"
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
          <div className="text-4xl mb-2 text-center">😅</div>
          <DialogTitle className="font-display font-black text-xl uppercase tracking-wider text-center">
            You're Late!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm text-center mt-1 leading-relaxed">
            This tournament is already full. All slots have been taken!
            <br />
            <span className="text-primary font-bold">
              Keep an eye out for the next one.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Button
          className="neon-btn w-full mt-2"
          onClick={onClose}
          data-ocid="full_tournament.close_button"
        >
          Got It! 👊
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function HomePage() {
  const { data: tournaments, isLoading } = useListTournaments();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const [fullTournamentDialogOpen, setFullTournamentDialogOpen] =
    useState(false);

  // Filter to show active/upcoming tournaments from backend; fall back to sample data
  const activeTournaments = tournaments?.filter(
    (t) =>
      t.status === TournamentStatus.Upcoming ||
      t.status === TournamentStatus.Live,
  );
  const displayTournaments =
    activeTournaments && activeTournaments.length > 0
      ? activeTournaments
      : !isLoading && tournaments && tournaments.length > 0
        ? []
        : SAMPLE_TOURNAMENTS;
  const isSampleData = !tournaments || tournaments.length === 0;
  const hasNoActiveTournaments =
    !isLoading &&
    tournaments &&
    tournaments.length > 0 &&
    activeTournaments?.length === 0;

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[300px] sm:h-[380px] md:h-[480px] w-full">
          <img
            src="/assets/generated/hero-banner-v2.dim_1400x500.jpg"
            alt="IND eSports Hero"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
          <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

          {/* Hero content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="max-w-xl"
              >
                {/* Logo + branding */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/assets/generated/ind-esports-logo-trident-gun-transparent.dim_400x400.png"
                    alt="IND eSports"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_16px_oklch(0.86_0.22_198/0.8)]"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-[1px] w-6 bg-primary/60" />
                      <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
                        India's #1 BGMI Platform
                      </span>
                    </div>
                    <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-none tracking-tight">
                      <span className="text-primary glow-text-cyan">IND</span>
                      <br />
                      <span className="text-foreground">eSports</span>
                    </h1>
                  </div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-1"
                >
                  Dominate. Compete. Win.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[11px] font-mono text-neon-purple/80 uppercase tracking-widest"
                >
                  Register → Pay → Play → Conquer
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-y border-border bg-card/60 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {[
            {
              label: "Active Tournaments",
              value: "Live Now",
              color: "text-neon-green glow-text-green",
            },
            {
              label: "Prize Money",
              value: "₹17K+",
              color: "text-neon-gold glow-text-gold",
            },
            {
              label: "Verified Platform",
              value: "100% Safe",
              color: "text-primary glow-text-cyan",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div>
                <p
                  className={`text-sm font-black font-display uppercase tracking-wider ${color}`}
                >
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

      {/* ===== BGMI MAPS SECTION ===== */}
      <section
        className="container mx-auto px-4 py-12"
        data-ocid="home.maps_section"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-6 w-1 bg-neon-purple rounded-full"
              style={{ boxShadow: "0 0 8px oklch(0.68 0.28 285)" }}
            />
            <h2 className="font-display font-black text-2xl tracking-wider uppercase text-foreground">
              BGMI Battle{" "}
              <span className="text-neon-purple glow-text-purple">Maps</span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-4 uppercase tracking-wider font-mono">
            8 Maps · Tap to reveal tactics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3">
          {BGMI_MAPS.map((map, i) => (
            <MapCard key={map.id} map={map} index={i} />
          ))}
        </div>
      </section>

      {/* ===== TOURNAMENTS SECTION ===== */}
      <section
        className="container mx-auto px-4 py-10 pb-16"
        data-ocid="home.tournaments_section"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-6 w-1 bg-neon-gold rounded-full"
              style={{ boxShadow: "0 0 8px oklch(0.78 0.19 55)" }}
            />
            <h2 className="font-display font-black text-2xl tracking-wider uppercase text-foreground">
              Explore{" "}
              <span className="text-neon-gold glow-text-gold">Tournaments</span>
            </h2>
            {isSampleData && !isLoading && (
              <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/40 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                Preview
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground ml-4 uppercase tracking-wider font-mono">
            Register · Pay · Get Room ID · Dominate
          </p>
        </motion.div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-ocid="tournaments.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <TournamentSkeleton key={i} />
            ))}
          </div>
        ) : hasNoActiveTournaments ? (
          /* No active tournaments - stylish empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="gaming-card rounded-lg p-12 text-center relative overflow-hidden animate-neon-border"
            data-ocid="home.empty_state"
          >
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50" />

            <div className="relative z-10">
              <div
                className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: "0 0 30px oklch(0.86 0.22 198 / 0.15)" }}
              >
                <Gamepad2 className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="font-display font-black text-xl text-foreground mb-2 uppercase tracking-wider">
                No Tournaments Right Now
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                The admin hasn't announced any upcoming matches yet.
                <br />
                <span className="text-primary font-bold">Check back soon!</span>
              </p>
            </div>
          </motion.div>
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
                onJoinFull={() => setFullTournamentDialogOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Full Tournament Dialog */}
      <FullTournamentDialog
        open={fullTournamentDialogOpen}
        onClose={() => setFullTournamentDialogOpen(false)}
      />
    </div>
  );
}
