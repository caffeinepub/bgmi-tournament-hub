import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Registration {
    id: string;
    paymentStatus: PaymentStatus;
    playerId: Principal;
    paymentScreenshotId: string;
    playerName: string;
    phone: Phone;
    bgmiId: string;
    registeredAt: bigint;
    tournamentId: string;
}
export interface Tournament {
    id: string;
    startTime: bigint;
    status: TournamentStatus;
    upiQrImageId: string;
    maxSlots: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    roomPassword?: string;
    entryFee: bigint;
    roomId?: string;
    prizePool: string;
}
export type Phone = string;
export interface UserProfile {
    name: string;
    phone: Phone;
}
export enum PaymentStatus {
    Rejected = "Rejected",
    Verified = "Verified",
    Pending = "Pending"
}
export enum TournamentStatus {
    Live = "Live",
    Cancelled = "Cancelled",
    Completed = "Completed",
    Upcoming = "Upcoming"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelTournament(id: string): Promise<void>;
    createTournament(name: string, description: string, prizePool: string, entryFee: bigint, maxSlots: bigint, startTime: bigint, upiQrImageId: string): Promise<string>;
    deleteTournament(id: string): Promise<void>;
    getCallerRegistrations(): Promise<Array<Registration>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTournament(id: string): Promise<Tournament>;
    getTournamentRegistrations(tournamentId: string): Promise<Array<Registration>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listTournaments(): Promise<Array<Tournament>>;
    registerForTournament(tournamentId: string, playerName: string, phone: Phone, bgmiId: string, paymentScreenshotId: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRoomDetails(tournamentId: string, roomId: string, roomPassword: string): Promise<void>;
    updatePaymentScreenshot(registrationId: string, paymentScreenshotId: string): Promise<void>;
    updatePaymentStatus(updates: Array<[string, PaymentStatus]>): Promise<void>;
    updateTournament(id: string, name: string, description: string, prizePool: string, entryFee: bigint, maxSlots: bigint, startTime: bigint, status: TournamentStatus, upiQrImageId: string): Promise<void>;
}
