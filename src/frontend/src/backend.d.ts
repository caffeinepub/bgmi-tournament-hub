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
    gamePlayerId: string;
    playerName: string;
    phone: Phone;
    registeredAt: bigint;
    tournamentId: string;
}
export interface Tournament {
    id: string;
    startTime: bigint;
    status: TournamentStatus;
    upiQrImageId: string;
    thirdPrize: bigint;
    maxSlots: bigint;
    name: string;
    createdAt: bigint;
    secondPrize: bigint;
    description: string;
    roomPassword?: string;
    gameType: GameType;
    entryFee: bigint;
    roomId?: string;
    prizePool: bigint;
}
export type Phone = string;
export interface Transaction {
    id: string;
    status: TransactionStatus;
    userId: Principal;
    createdAt: bigint;
    description: string;
    txType: TransactionType;
    screenshotId: string;
    amount: bigint;
}
export type UpiId = string;
export interface UserProfile {
    name: string;
    winningsBalance: bigint;
    upiId: UpiId;
    phone: Phone;
    walletBalance: bigint;
}
export enum GameType {
    BGMI = "BGMI",
    FreeFire = "FreeFire"
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
export enum TransactionStatus {
    Rejected = "Rejected",
    Completed = "Completed",
    Pending = "Pending"
}
export enum TransactionType {
    Withdrawal = "Withdrawal",
    CashAdded = "CashAdded",
    PrizeWon = "PrizeWon",
    MatchJoined = "MatchJoined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminApproveAddCash(txId: string): Promise<void>;
    adminApproveWithdrawal(txId: string): Promise<void>;
    adminCreditPrize(user: Principal, amount: bigint, description: string): Promise<void>;
    adminRejectAddCash(txId: string): Promise<void>;
    adminRejectWithdrawal(txId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelTournament(id: string): Promise<void>;
    createTournament(name: string, description: string, prizePool: bigint, secondPrize: bigint, thirdPrize: bigint, entryFee: bigint, maxSlots: bigint, startTime: bigint, upiQrImageId: string, gameType: GameType): Promise<string>;
    creditWalletBalance(user: Principal, amount: bigint): Promise<void>;
    deleteTournament(id: string): Promise<void>;
    getAllUsersWithPrincipal(): Promise<Array<[Principal, UserProfile]>>;
    getCallerRegistrations(): Promise<Array<Registration>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyTransactions(): Promise<Array<Transaction>>;
    getPendingTransactions(): Promise<Array<Transaction>>;
    getTournament(id: string): Promise<Tournament>;
    getTournamentRegistrations(tournamentId: string): Promise<Array<Registration>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinTournamentWithWallet(tournamentId: string, gamePlayerId: string): Promise<string>;
    listTournamentsByGameType(gameType: GameType): Promise<Array<Tournament>>;
    registerForTournament(tournamentId: string, playerName: string, phone: Phone, gamePlayerId: string, paymentScreenshotId: string): Promise<string>;
    requestAddCash(amount: bigint, screenshotId: string): Promise<string>;
    requestWithdrawal(upiId: string, amount: bigint): Promise<string>;
    saveCallerUserProfile(name: string, phone: Phone, upiId: UpiId): Promise<void>;
    setRoomDetails(tournamentId: string, roomId: string, roomPassword: string): Promise<void>;
    updatePaymentScreenshot(registrationId: string, paymentScreenshotId: string): Promise<void>;
    updatePaymentStatus(updates: Array<[string, PaymentStatus]>): Promise<void>;
    updateTournament(id: string, name: string, description: string, prizePool: bigint, secondPrize: bigint, thirdPrize: bigint, entryFee: bigint, maxSlots: bigint, startTime: bigint, status: TournamentStatus, upiQrImageId: string, gameType: GameType): Promise<void>;
}
