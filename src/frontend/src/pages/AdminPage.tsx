import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Key,
  Loader2,
  OctagonX,
  Plus,
  Shield,
  Trash2,
  Trophy,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GameType,
  PaymentStatus,
  type Tournament,
  TournamentStatus,
} from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCancelTournament,
  useCreateTournament,
  useDeleteTournament,
  useGetAllUsers,
  useIsCallerAdmin,
  useListTournaments,
  useSetRoomDetails,
  useTournamentRegistrations,
  useUpdatePaymentStatus,
  useUpdateTournament,
} from "../hooks/useQueries";

type TournamentFormData = {
  name: string;
  description: string;
  prizePool: string;
  secondPrize: string;
  thirdPrize: string;
  entryFee: string;
  maxSlots: string;
  startTime: string;
  upiQrImageId: string;
  status: TournamentStatus;
  gameType: GameType;
};

const defaultFormData: TournamentFormData = {
  name: "",
  description: "",
  prizePool: "",
  secondPrize: "",
  thirdPrize: "",
  entryFee: "",
  maxSlots: "",
  startTime: "",
  upiQrImageId: "",
  status: TournamentStatus.Upcoming,
  gameType: GameType.BGMI,
};

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
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${cls}`}
    >
      {status}
    </span>
  );
}

function GameTypeBadge({ gameType }: { gameType: GameType }) {
  const isFF = gameType === GameType.FreeFire;
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
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
      {isFF ? "FF" : "BGMI"}
    </span>
  );
}

function AdminRegistrationsTab() {
  const { data: tournaments } = useListTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const { data: registrations, isLoading } =
    useTournamentRegistrations(selectedTournamentId);
  const updateStatus = useUpdatePaymentStatus();

  const handleStatusUpdate = async (
    registrationId: string,
    newStatus: PaymentStatus,
  ) => {
    try {
      await updateStatus.mutateAsync([{ registrationId, newStatus }]);
      toast.success(`Payment ${newStatus.toLowerCase()} successfully`);
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-48">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Select Tournament
          </Label>
          <Select
            value={selectedTournamentId}
            onValueChange={setSelectedTournamentId}
          >
            <SelectTrigger
              className="bg-muted/30 border-border"
              data-ocid="admin.select_tournament"
            >
              <SelectValue placeholder="Choose a tournament..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {tournaments?.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-foreground">
                  <span className="flex items-center gap-2">
                    {t.name}
                    <span className="text-[9px] text-muted-foreground">
                      ({t.gameType})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedTournamentId ? (
        <div
          className="text-center py-16 gaming-card rounded-lg"
          data-ocid="admin.registrations.empty_state"
        >
          <Shield className="w-10 h-10 text-primary/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Select a tournament to view registrations
          </p>
        </div>
      ) : isLoading ? (
        <div
          className="space-y-2"
          data-ocid="admin.registrations.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 bg-muted/30 rounded" />
          ))}
        </div>
      ) : !registrations || registrations.length === 0 ? (
        <div
          className="text-center py-16 gaming-card rounded-lg"
          data-ocid="admin.registrations.empty_state"
        >
          <p className="text-muted-foreground text-sm">
            No registrations for this tournament yet
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-lg border border-border"
          data-ocid="admin.registrations.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/20">
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Player
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Game ID
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Registered
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg, idx) => (
                <TableRow
                  key={reg.id}
                  className="border-border hover:bg-muted/20"
                  data-ocid={`admin.registrations.row.${idx + 1}`}
                >
                  <TableCell className="text-sm font-medium">
                    {reg.playerName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {reg.gamePlayerId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {reg.phone}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(reg.registeredAt)}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={reg.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {reg.paymentStatus !== PaymentStatus.Verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusUpdate(reg.id, PaymentStatus.Verified)
                          }
                          disabled={updateStatus.isPending}
                          data-ocid={`admin.verify_button.${idx + 1}`}
                          className="text-accent hover:text-accent hover:bg-accent/10 text-xs uppercase tracking-wider h-7 px-2"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verify
                        </Button>
                      )}
                      {reg.paymentStatus !== PaymentStatus.Rejected && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusUpdate(reg.id, PaymentStatus.Rejected)
                          }
                          disabled={updateStatus.isPending}
                          data-ocid={`admin.reject_button.${idx + 1}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs uppercase tracking-wider h-7 px-2"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AdminUsersTab() {
  const { data: users, isLoading } = useGetAllUsers();

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="admin.users.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 bg-muted/30 rounded" />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        className="text-center py-16 gaming-card rounded-lg"
        data-ocid="admin.users.empty_state"
      >
        <Users className="w-10 h-10 text-primary/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No registered users yet</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="overflow-x-auto rounded-lg border border-border"
        data-ocid="admin.users.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Phone
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                UPI ID
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, idx) => (
              <TableRow
                key={`${user.phone}-${idx}`}
                className="border-border hover:bg-muted/20"
                data-ocid={`admin.users.row.${idx + 1}`}
              >
                <TableCell className="font-medium text-sm">
                  {user.name}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {user.phone}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {user.upiId || (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type TournamentFormProps = {
  isEdit?: boolean;
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
  qrFile: File | null;
  qrInputRef: React.RefObject<HTMLInputElement | null>;
  handleQrChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreate: (e: React.FormEvent) => Promise<void>;
  handleUpdate: (e: React.FormEvent) => Promise<void>;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  setEditTournament: (t: Tournament | null) => void;
  setCreateOpen: (open: boolean) => void;
};

function TournamentForm({
  isEdit = false,
  formData,
  setFormData,
  qrFile,
  qrInputRef,
  handleQrChange,
  handleCreate,
  handleUpdate,
  isCreatePending,
  isUpdatePending,
  setEditTournament,
  setCreateOpen,
}: TournamentFormProps) {
  return (
    <form
      onSubmit={isEdit ? handleUpdate : handleCreate}
      data-ocid="admin.tournament_form"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Game Type */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Game Type *
          </Label>
          <Select
            value={formData.gameType}
            onValueChange={(v) =>
              setFormData((p) => ({ ...p, gameType: v as GameType }))
            }
          >
            <SelectTrigger
              className="bg-muted/30 border-border"
              data-ocid="admin.tournament.gametype_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value={GameType.BGMI} className="text-foreground">
                🎮 BGMI
              </SelectItem>
              <SelectItem value={GameType.FreeFire} className="text-foreground">
                🔥 Free Fire MAX
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Tournament Name *
          </Label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="e.g. BGMI Pro League S1"
            required
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.name_input"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Description *
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Describe the tournament..."
            required
            className="bg-muted/30 border-border min-h-[80px]"
            data-ocid="admin.tournament.description_textarea"
          />
        </div>

        {/* 1st Prize */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            1st Prize (₹) *
          </Label>
          <Input
            type="number"
            min="0"
            value={formData.prizePool}
            onChange={(e) =>
              setFormData((p) => ({ ...p, prizePool: e.target.value }))
            }
            placeholder="e.g. 5000"
            required
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.prize_input"
          />
        </div>

        {/* 2nd Prize */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            2nd Prize (₹)
          </Label>
          <Input
            type="number"
            min="0"
            value={formData.secondPrize}
            onChange={(e) =>
              setFormData((p) => ({ ...p, secondPrize: e.target.value }))
            }
            placeholder="e.g. 2000"
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.second_prize_input"
          />
        </div>

        {/* 3rd Prize */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            3rd Prize (₹)
          </Label>
          <Input
            type="number"
            min="0"
            value={formData.thirdPrize}
            onChange={(e) =>
              setFormData((p) => ({ ...p, thirdPrize: e.target.value }))
            }
            placeholder="e.g. 1000"
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.third_prize_input"
          />
        </div>

        {/* Entry Fee */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Entry Fee (₹)
          </Label>
          <Input
            type="number"
            min="0"
            value={formData.entryFee}
            onChange={(e) =>
              setFormData((p) => ({ ...p, entryFee: e.target.value }))
            }
            placeholder="0 for free"
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.entryfee_input"
          />
        </div>

        {/* Max Slots */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Max Slots *
          </Label>
          <Input
            type="number"
            min="1"
            value={formData.maxSlots}
            onChange={(e) =>
              setFormData((p) => ({ ...p, maxSlots: e.target.value }))
            }
            placeholder="100"
            required
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.maxslots_input"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Start Time *
          </Label>
          <Input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) =>
              setFormData((p) => ({ ...p, startTime: e.target.value }))
            }
            required
            className="bg-muted/30 border-border"
            data-ocid="admin.tournament.starttime_input"
          />
        </div>

        {/* Status (edit only) */}
        {isEdit && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(v) =>
                setFormData((p) => ({ ...p, status: v as TournamentStatus }))
              }
            >
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {Object.values(TournamentStatus).map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* QR Upload */}
        <div className="space-y-1.5 md:col-span-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
            UPI QR Code Image
          </span>
          <label className="flex items-center gap-3 p-3 border border-dashed border-border rounded cursor-pointer hover:border-primary/60 transition-colors">
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrChange}
            />
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {qrFile ? qrFile.name : "Upload QR image (PNG/JPG)"}
            </span>
          </label>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            isEdit ? setEditTournament(null) : setCreateOpen(false)
          }
          data-ocid="admin.tournament.cancel_button"
          className="border border-border"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="neon-btn"
          disabled={isCreatePending || isUpdatePending}
          data-ocid="admin.tournament_submit_button"
        >
          {isCreatePending || isUpdatePending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isEdit ? "Update Tournament" : "Create Tournament"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: tournaments, isLoading: tournamentsLoading } =
    useListTournaments();

  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const cancelTournament = useCancelTournament();
  const setRoomDetails = useSetRoomDetails();

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stopId, setStopId] = useState<string | null>(null);
  const [roomTournament, setRoomTournament] = useState<Tournament | null>(null);

  // Forms
  const [formData, setFormData] = useState<TournamentFormData>(defaultFormData);
  const [roomForm, setRoomForm] = useState({ roomId: "", roomPassword: "" });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !identity) {
      void navigate({ to: "/" });
    }
  }, [adminLoading, identity, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      void navigate({ to: "/" });
    }
  }, [adminLoading, isAdmin, navigate]);

  const handleOpenEdit = (tournament: Tournament) => {
    setEditTournament(tournament);
    const ms = Number(tournament.startTime) / 1_000_000;
    const dt = new Date(ms);
    const local = dt.toISOString().slice(0, 16);
    setFormData({
      name: tournament.name,
      description: tournament.description,
      prizePool: tournament.prizePool.toString(),
      secondPrize: tournament.secondPrize.toString(),
      thirdPrize: tournament.thirdPrize.toString(),
      entryFee: tournament.entryFee.toString(),
      maxSlots: tournament.maxSlots.toString(),
      startTime: local,
      upiQrImageId: tournament.upiQrImageId,
      status: tournament.status,
      gameType: tournament.gameType,
    });
  };

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setQrFile(null);
    setCreateOpen(true);
  };

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setQrFile(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startMs = new Date(formData.startTime).getTime();
      const startNanos = BigInt(startMs) * BigInt(1_000_000);
      const qrId = qrFile ? `qr-${Date.now()}-${qrFile.name}` : "";
      await createTournament.mutateAsync({
        name: formData.name,
        description: formData.description,
        prizePool: BigInt(formData.prizePool || "0"),
        secondPrize: BigInt(formData.secondPrize || "0"),
        thirdPrize: BigInt(formData.thirdPrize || "0"),
        entryFee: BigInt(formData.entryFee || "0"),
        maxSlots: BigInt(formData.maxSlots || "100"),
        startTime: startNanos,
        upiQrImageId: qrId,
        gameType: formData.gameType,
      });
      toast.success("Tournament created!");
      setCreateOpen(false);
      setFormData(defaultFormData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create tournament");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTournament) return;
    try {
      const startMs = new Date(formData.startTime).getTime();
      const startNanos = BigInt(startMs) * BigInt(1_000_000);
      const qrId = qrFile
        ? `qr-${Date.now()}-${qrFile.name}`
        : formData.upiQrImageId;
      await updateTournament.mutateAsync({
        id: editTournament.id,
        name: formData.name,
        description: formData.description,
        prizePool: BigInt(formData.prizePool || "0"),
        secondPrize: BigInt(formData.secondPrize || "0"),
        thirdPrize: BigInt(formData.thirdPrize || "0"),
        entryFee: BigInt(formData.entryFee || "0"),
        maxSlots: BigInt(formData.maxSlots || "100"),
        startTime: startNanos,
        status: formData.status,
        upiQrImageId: qrId,
        gameType: formData.gameType,
      });
      toast.success("Tournament updated!");
      setEditTournament(null);
    } catch {
      toast.error("Failed to update tournament");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTournament.mutateAsync(deleteId);
      toast.success("Tournament deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete tournament");
    }
  };

  const handleStop = async () => {
    if (!stopId) return;
    try {
      await cancelTournament.mutateAsync(stopId);
      toast.success("Tournament stopped!");
      setStopId(null);
    } catch {
      toast.error("Failed to stop tournament");
    }
  };

  const handleSetRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTournament) return;
    try {
      await setRoomDetails.mutateAsync({
        tournamentId: roomTournament.id,
        roomId: roomForm.roomId,
        roomPassword: roomForm.roomPassword,
      });
      toast.success("Room details set!");
      setRoomTournament(null);
      setRoomForm({ roomId: "", roomPassword: "" });
    } catch {
      toast.error("Failed to set room details");
    }
  };

  if (adminLoading) {
    return (
      <div
        className="container mx-auto px-4 py-10"
        data-ocid="admin.loading_state"
      >
        <Skeleton className="h-8 w-48 bg-muted/50 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="font-display font-black text-2xl uppercase tracking-wider text-foreground">
          Admin <span className="text-accent glow-text-green">Panel</span>
        </h1>
      </div>

      <Tabs defaultValue="tournaments">
        <TabsList className="bg-muted/30 border border-border mb-6">
          <TabsTrigger
            value="tournaments"
            data-ocid="admin.tournaments_tab"
            className="uppercase tracking-wider text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Tournaments
          </TabsTrigger>
          <TabsTrigger
            value="registrations"
            data-ocid="admin.registrations_tab"
            className="uppercase tracking-wider text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Registrations
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-ocid="admin.users_tab"
            className="uppercase tracking-wider text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Users
          </TabsTrigger>
        </TabsList>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-muted-foreground">
              All Tournaments
            </h2>
            <Button
              className="neon-btn text-xs"
              onClick={handleOpenCreate}
              data-ocid="admin.create_tournament_button"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Tournament
            </Button>
          </div>

          {tournamentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 bg-muted/30 rounded" />
              ))}
            </div>
          ) : !tournaments || tournaments.length === 0 ? (
            <div
              className="text-center py-16 gaming-card rounded-lg"
              data-ocid="admin.tournaments.empty_state"
            >
              <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No tournaments yet. Create your first one!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Game
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      1st Prize
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      2nd Prize
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      3rd Prize
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Entry
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Start
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((t, idx) => (
                    <TableRow
                      key={t.id}
                      className="border-border hover:bg-muted/20"
                      data-ocid={`admin.tournaments.row.${idx + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {t.name}
                      </TableCell>
                      <TableCell>
                        <GameTypeBadge gameType={t.gameType} />
                      </TableCell>
                      <TableCell className="text-xs text-neon-gold font-bold">
                        ₹{t.prizePool.toString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.secondPrize > BigInt(0)
                          ? `₹${t.secondPrize.toString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.thirdPrize > BigInt(0)
                          ? `₹${t.thirdPrize.toString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {t.entryFee === BigInt(0) ? "Free" : `₹${t.entryFee}`}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                            t.status === TournamentStatus.Live
                              ? "status-live"
                              : t.status === TournamentStatus.Upcoming
                                ? "status-upcoming"
                                : t.status === TournamentStatus.Completed
                                  ? "status-completed"
                                  : "status-cancelled"
                          }`}
                        >
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(t.startTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {t.status !== TournamentStatus.Cancelled &&
                            t.status !== TournamentStatus.Completed && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setStopId(t.id)}
                                data-ocid={`admin.stop_button.${idx + 1}`}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Stop Match"
                              >
                                <OctagonX className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(t)}
                            data-ocid={`admin.edit_button.${idx + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRoomTournament(t);
                              setRoomForm({
                                roomId: t.roomId ?? "",
                                roomPassword: t.roomPassword ?? "",
                              });
                            }}
                            data-ocid={`admin.set_room_button.${idx + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(t.id)}
                            data-ocid={`admin.delete_button.${idx + 1}`}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <AdminRegistrationsTab />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-muted-foreground">
              Registered Users
            </h2>
          </div>
          <AdminUsersTab />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase tracking-wider">
              Create Tournament
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Fill in the tournament details below.
            </DialogDescription>
          </DialogHeader>
          <TournamentForm
            isEdit={false}
            formData={formData}
            setFormData={setFormData}
            qrFile={qrFile}
            qrInputRef={qrInputRef}
            handleQrChange={handleQrChange}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            isCreatePending={createTournament.isPending}
            isUpdatePending={updateTournament.isPending}
            setEditTournament={setEditTournament}
            setCreateOpen={setCreateOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTournament}
        onOpenChange={(o) => !o && setEditTournament(null)}
      >
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase tracking-wider">
              Edit Tournament
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Update the tournament details below.
            </DialogDescription>
          </DialogHeader>
          <TournamentForm
            isEdit={true}
            formData={formData}
            setFormData={setFormData}
            qrFile={qrFile}
            qrInputRef={qrInputRef}
            handleQrChange={handleQrChange}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            isCreatePending={createTournament.isPending}
            isUpdatePending={updateTournament.isPending}
            setEditTournament={setEditTournament}
            setCreateOpen={setCreateOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Room Details Dialog */}
      <Dialog
        open={!!roomTournament}
        onOpenChange={(o) => !o && setRoomTournament(null)}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg uppercase tracking-wider">
              Set Room Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {roomTournament?.name} — These details will be revealed to
              verified players.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSetRoom}
            data-ocid="admin.room_form"
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Room ID *
              </Label>
              <Input
                value={roomForm.roomId}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, roomId: e.target.value }))
                }
                placeholder="Enter room ID"
                required
                className="bg-muted/30 border-border font-mono"
                data-ocid="admin.room.id_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Room Password *
              </Label>
              <Input
                value={roomForm.roomPassword}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, roomPassword: e.target.value }))
                }
                placeholder="Enter room password"
                required
                className="bg-muted/30 border-border font-mono"
                data-ocid="admin.room.password_input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRoomTournament(null)}
                data-ocid="admin.room.cancel_button"
                className="border border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="neon-btn-green"
                disabled={setRoomDetails.isPending}
                data-ocid="admin.room_submit_button"
              >
                {setRoomDetails.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Set Room Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stop Match Confirm Dialog */}
      <AlertDialog open={!!stopId} onOpenChange={(o) => !o && setStopId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold uppercase tracking-wider">
              Stop This Match?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This will cancel the tournament immediately. All registered
              players will be notified. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="admin.stop.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              data-ocid="admin.stop.confirm_button"
            >
              {cancelTournament.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <OctagonX className="w-4 h-4 mr-2" />
              )}
              Stop Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold uppercase tracking-wider">
              Delete Tournament?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This action cannot be undone. All registrations for this
              tournament will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="admin.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              data-ocid="admin.delete.confirm_button"
            >
              {deleteTournament.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
