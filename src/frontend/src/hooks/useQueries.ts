import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PaymentStatusUpdate,
  Registration,
  Tournament,
  TournamentStatus,
} from "../backend.d";
import { useActor } from "./useActor";

// ---- Tournaments ----
export function useListTournaments() {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament[]>({
    queryKey: ["tournaments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTournaments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTournament(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament>({
    queryKey: ["tournament", id],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getTournament(id);
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

// ---- Mutations ----
export function useCreateTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      prizePool: string;
      entryFee: bigint;
      maxSlots: bigint;
      startTime: bigint;
      upiQrImageId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTournament(
        params.name,
        params.description,
        params.prizePool,
        params.entryFee,
        params.maxSlots,
        params.startTime,
        params.upiQrImageId,
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
      prizePool: string;
      entryFee: bigint;
      maxSlots: bigint;
      startTime: bigint;
      status: TournamentStatus;
      upiQrImageId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTournament(
        params.id,
        params.name,
        params.description,
        params.prizePool,
        params.entryFee,
        params.maxSlots,
        params.startTime,
        params.status,
        params.upiQrImageId,
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
      email: string;
      phone: string;
      bgmiId: string;
      paymentScreenshotId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerForTournament(
        params.tournamentId,
        params.playerName,
        params.email,
        params.phone,
        params.bgmiId,
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
      return actor.updatePaymentStatus(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["callerRegistrations"] });
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
