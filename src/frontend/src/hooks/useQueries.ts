import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GameType,
  PaymentStatus,
  Registration,
  Tournament,
  TournamentStatus,
  Transaction,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

type PaymentStatusUpdate = { registrationId: string; newStatus: PaymentStatus };

// ---- Tournaments ----
export function useListTournamentsByGameType(gameType: GameType) {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament[]>({
    queryKey: ["tournaments", gameType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTournamentsByGameType(gameType);
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compat: fetch both game types and combine
export function useListTournaments() {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament[]>({
    queryKey: ["tournaments", "all"],
    queryFn: async () => {
      if (!actor) return [];
      const [bgmi, ff] = await Promise.all([
        actor.listTournamentsByGameType("BGMI" as GameType),
        actor.listTournamentsByGameType("FreeFire" as GameType),
      ]);
      return [...bgmi, ...ff];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTournament(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament | null>({
    queryKey: ["tournament", id],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getTournament(id);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Registrations ----
export function useCallerRegistrations() {
  const { actor, isFetching } = useActor();
  return useQuery<Registration[]>({
    queryKey: ["callerRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerRegistrations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTournamentRegistrations(tournamentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Registration[]>({
    queryKey: ["tournamentRegistrations", tournamentId],
    queryFn: async () => {
      if (!actor || !tournamentId) return [];
      return actor.getTournamentRegistrations(tournamentId);
    },
    enabled: !!actor && !isFetching && !!tournamentId,
  });
}

// ---- Users ----
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const pairs = await actor.getAllUsersWithPrincipal();
      return pairs.map(([, profile]) => profile);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsersWithPrincipal() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ["allUsersWithPrincipal"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsersWithPrincipal();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Transactions ----
export function useMyTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePendingTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["pendingTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Mutations ----
export function useCreateTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      prizePool: bigint;
      secondPrize: bigint;
      thirdPrize: bigint;
      entryFee: bigint;
      maxSlots: bigint;
      startTime: bigint;
      upiQrImageId: string;
      gameType: GameType;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTournament(
        params.name,
        params.description,
        params.prizePool,
        params.secondPrize,
        params.thirdPrize,
        params.entryFee,
        params.maxSlots,
        params.startTime,
        params.upiQrImageId,
        params.gameType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      description: string;
      prizePool: bigint;
      secondPrize: bigint;
      thirdPrize: bigint;
      entryFee: bigint;
      maxSlots: bigint;
      startTime: bigint;
      status: TournamentStatus;
      upiQrImageId: string;
      gameType: GameType;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTournament(
        params.id,
        params.name,
        params.description,
        params.prizePool,
        params.secondPrize,
        params.thirdPrize,
        params.entryFee,
        params.maxSlots,
        params.startTime,
        params.status,
        params.upiQrImageId,
        params.gameType,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", variables.id] });
    },
  });
}

export function useDeleteTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTournament(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useCancelTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.cancelTournament(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      name: string;
      phone: string;
      upiId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(
        profile.name,
        profile.phone,
        profile.upiId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetRoomDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tournamentId: string;
      roomId: string;
      roomPassword: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setRoomDetails(
        params.tournamentId,
        params.roomId,
        params.roomPassword,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["tournament", variables.tournamentId],
      });
    },
  });
}

export function useRegisterForTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tournamentId: string;
      playerName: string;
      phone: string;
      gamePlayerId: string;
      paymentScreenshotId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerForTournament(
        params.tournamentId,
        params.playerName,
        params.phone,
        params.gamePlayerId,
        params.paymentScreenshotId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: PaymentStatusUpdate[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePaymentStatus(
        updates.map((u) => [u.registrationId, u.newStatus]),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentRegistrations"] });
    },
  });
}

export function useCreditWalletBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { user: Principal; amount: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.creditWalletBalance(params.user, params.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["allUsersWithPrincipal"] });
    },
  });
}

export function useUpdatePaymentScreenshot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      registrationId: string;
      paymentScreenshotId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePaymentScreenshot(
        params.registrationId,
        params.paymentScreenshotId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerRegistrations"] });
    },
  });
}

// ---- Wallet / Transaction Mutations ----
export function useRequestAddCash() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { amount: bigint; screenshotId: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestAddCash(params.amount, params.screenshotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { upiId: string; amount: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestWithdrawal(params.upiId, params.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useJoinWithWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tournamentId: string;
      gamePlayerId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinTournamentWithWallet(
        params.tournamentId,
        params.gamePlayerId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useAdminApproveAddCash() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminApproveAddCash(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["allUsersWithPrincipal"] });
    },
  });
}

export function useAdminRejectAddCash() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminRejectAddCash(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useAdminApproveWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminApproveWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useAdminRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminRejectWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useAdminCreditPrize() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      user: Principal;
      amount: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminCreditPrize(
        params.user,
        params.amount,
        params.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithPrincipal"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}
