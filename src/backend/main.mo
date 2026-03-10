import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import _List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import _Storage "blob-storage/Storage";

import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type Phone = Text;
  public type UpiId = Text;

  public type UserProfile = {
    name : Text;
    phone : Phone;
    upiId : UpiId;
    walletBalance : Nat;
    winningsBalance : Nat;
  };

  // Tournament Status Enum
  public type TournamentStatus = {
    #Upcoming;
    #Live;
    #Completed;
    #Cancelled;
  };

  module TournamentStatus {
    public func compare(a : TournamentStatus, b : TournamentStatus) : Order.Order {
      let toNat = func(status : TournamentStatus) : Nat {
        switch (status) {
          case (#Upcoming) { 0 };
          case (#Live) { 1 };
          case (#Completed) { 2 };
          case (#Cancelled) { 3 };
        };
      };
      Nat.compare(toNat(a), toNat(b));
    };
  };

  // Game Type Enum
  public type GameType = {
    #BGMI;
    #FreeFire;
  };

  module GameType {
    public func compare(a : GameType, b : GameType) : Order.Order {
      let toNat = func(game : GameType) : Nat {
        switch (game) {
          case (#BGMI) { 0 };
          case (#FreeFire) { 1 };
        };
      };
      Nat.compare(toNat(a), toNat(b));
    };
  };

  // Tournament Record
  public type Tournament = {
    id : Text;
    name : Text;
    description : Text;
    prizePool : Nat;
    secondPrize : Nat;
    thirdPrize : Nat;
    entryFee : Nat;
    maxSlots : Nat;
    startTime : Int;
    status : TournamentStatus;
    upiQrImageId : Text;
    roomId : ?Text;
    roomPassword : ?Text;
    gameType : GameType;
    createdAt : Int;
  };

  let tournaments = Map.empty<Text, Tournament>();

  // Payment Status Enum
  public type PaymentStatus = {
    #Pending;
    #Verified;
    #Rejected;
  };

  module PaymentStatus {
    public func compare(a : PaymentStatus, b : PaymentStatus) : Order.Order {
      let toNat = func(status : PaymentStatus) : Nat {
        switch (status) {
          case (#Pending) { 0 };
          case (#Verified) { 1 };
          case (#Rejected) { 2 };
        };
      };
      Nat.compare(toNat(a), toNat(b));
    };
  };

  // Registration Record
  public type Registration = {
    id : Text;
    tournamentId : Text;
    playerId : Principal;
    playerName : Text;
    phone : Phone;
    gamePlayerId : Text;
    paymentScreenshotId : Text;
    paymentStatus : PaymentStatus;
    registeredAt : Int;
  };

  let registrations = Map.empty<Text, Registration>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ID Generator
  let idGenerator = { var counter = 0 };

  func generateId() : Text {
    idGenerator.counter += 1;
    idGenerator.counter.toText();
  };

  // Helper Functions
  func isPlayerVerifiedForTournament(playerId : Principal, tournamentId : Text) : Bool {
    switch (userProfiles.get(playerId)) {
      case (null) { false };
      case (?_) {
        let playerRegs = registrations.values().toArray().filter(func(reg) {
          Principal.equal(reg.playerId, playerId) and reg.tournamentId == tournamentId and reg.paymentStatus == #Verified
        });
        not playerRegs.isEmpty();
      };
    };
  };

  // Transaction Types
  public type TransactionType = {
    #CashAdded;
    #MatchJoined;
    #PrizeWon;
    #Withdrawal;
  };

  public type TransactionStatus = {
    #Pending;
    #Completed;
    #Rejected;
  };

  public type Transaction = {
    id : Text;
    userId : Principal;
    txType : TransactionType;
    amount : Nat;
    description : Text;
    status : TransactionStatus;
    screenshotId : Text;
    createdAt : Int;
  };

  let transactions = Map.empty<Text, Transaction>();

  // System Functions
  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getAllUsersWithPrincipal() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.toArray();
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text, phone : Phone, upiId : UpiId) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot create profiles");
    };
    // Auto-register as user if first time (new user account creation)
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (?_) {};
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) { { walletBalance = 0; winningsBalance = 0 } };
      case (?profile) {
        {
          walletBalance = profile.walletBalance;
          winningsBalance = profile.winningsBalance;
        };
      };
    };

    let profile : UserProfile = {
      name;
      phone;
      upiId;
      walletBalance = existingProfile.walletBalance;
      winningsBalance = existingProfile.winningsBalance;
    };
    userProfiles.add(caller, profile);
  };

  // Admin-only wallet credit (for manual adjustments)
  public shared ({ caller }) func creditWalletBalance(user : Principal, amount : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can credit wallet balance");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          name = profile.name;
          phone = profile.phone;
          upiId = profile.upiId;
          walletBalance = profile.walletBalance + amount;
          winningsBalance = profile.winningsBalance;
        };
        userProfiles.add(user, updatedProfile);

        // Log the transaction
        let txId = generateId();
        let transaction : Transaction = {
          id = txId;
          userId = user;
          txType = #CashAdded;
          amount;
          description = "Admin Wallet Credit";
          status = #Completed;
          screenshotId = "";
          createdAt = Time.now();
        };
        transactions.add(txId, transaction);
      };
    };
  };

  // Tournament Management Functions
  public shared ({ caller }) func createTournament(
    name : Text,
    description : Text,
    prizePool : Nat,
    secondPrize : Nat,
    thirdPrize : Nat,
    entryFee : Nat,
    maxSlots : Nat,
    startTime : Int,
    upiQrImageId : Text,
    gameType : GameType,
  ) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create tournaments");
    };

    let tournamentId = generateId();
    let newTournament : Tournament = {
      id = tournamentId;
      name;
      description;
      prizePool;
      secondPrize;
      thirdPrize;
      entryFee;
      maxSlots;
      startTime;
      status = #Upcoming;
      upiQrImageId;
      roomId = null;
      roomPassword = null;
      gameType;
      createdAt = Time.now();
    };

    tournaments.add(tournamentId, newTournament);
    tournamentId;
  };

  public shared ({ caller }) func updateTournament(
    id : Text,
    name : Text,
    description : Text,
    prizePool : Nat,
    secondPrize : Nat,
    thirdPrize : Nat,
    entryFee : Nat,
    maxSlots : Nat,
    startTime : Int,
    status : TournamentStatus,
    upiQrImageId : Text,
    gameType : GameType,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update tournaments");
    };

    switch (tournaments.get(id)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?tournament) {
        let updatedTournament : Tournament = {
          id = tournament.id;
          name;
          description;
          prizePool;
          secondPrize;
          thirdPrize;
          entryFee;
          maxSlots;
          startTime;
          status;
          upiQrImageId;
          roomId = tournament.roomId;
          roomPassword = tournament.roomPassword;
          gameType;
          createdAt = tournament.createdAt;
        };
        tournaments.add(id, updatedTournament);
      };
    };
  };

  public shared ({ caller }) func cancelTournament(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can cancel tournaments");
    };

    switch (tournaments.get(id)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?tournament) {
        let updatedTournament : Tournament = {
          id = tournament.id;
          name = tournament.name;
          description = tournament.description;
          prizePool = tournament.prizePool;
          secondPrize = tournament.secondPrize;
          thirdPrize = tournament.thirdPrize;
          entryFee = tournament.entryFee;
          maxSlots = tournament.maxSlots;
          startTime = tournament.startTime;
          status = #Cancelled;
          upiQrImageId = tournament.upiQrImageId;
          roomId = tournament.roomId;
          roomPassword = tournament.roomPassword;
          gameType = tournament.gameType;
          createdAt = tournament.createdAt;
        };
        tournaments.add(id, updatedTournament);
      };
    };
  };

  public shared ({ caller }) func deleteTournament(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete tournaments");
    };

    if (not tournaments.containsKey(id)) {
      Runtime.trap("Tournament not found");
    };
    tournaments.remove(id);
  };

  public query ({ caller }) func listTournamentsByGameType(gameType : GameType) : async [Tournament] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let filteredTournaments = tournaments.values().toArray().filter(
      func(t) { t.gameType == gameType }
    ).sort(
      func(a, b) { Nat.compare(a.startTime.toNat(), b.startTime.toNat()) }
    );

    if (isAdmin) {
      return filteredTournaments;
    };

    filteredTournaments.map(
      func(tournament) {
        let isVerified = isPlayerVerifiedForTournament(caller, tournament.id);
        if (isVerified) {
          tournament;
        } else {
          {
            id = tournament.id;
            name = tournament.name;
            description = tournament.description;
            prizePool = tournament.prizePool;
            secondPrize = tournament.secondPrize;
            thirdPrize = tournament.thirdPrize;

            entryFee = tournament.entryFee;
            maxSlots = tournament.maxSlots;
            startTime = tournament.startTime;
            status = tournament.status;
            upiQrImageId = tournament.upiQrImageId;
            roomId = null;
            roomPassword = null;
            gameType = tournament.gameType;
            createdAt = tournament.createdAt;
          };
        };
      }
    );
  };

  public query ({ caller }) func getTournament(id : Text) : async Tournament {
    switch (tournaments.get(id)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?tournament) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isVerified = isPlayerVerifiedForTournament(caller, id);

        if (isAdmin or isVerified) {
          tournament;
        } else {
          {
            id = tournament.id;
            name = tournament.name;
            description = tournament.description;
            prizePool = tournament.prizePool;
            secondPrize = tournament.secondPrize;
            thirdPrize = tournament.thirdPrize;
            entryFee = tournament.entryFee;
            maxSlots = tournament.maxSlots;
            startTime = tournament.startTime;
            status = tournament.status;
            upiQrImageId = tournament.upiQrImageId;
            roomId = null;
            roomPassword = null;
            gameType = tournament.gameType;
            createdAt = tournament.createdAt;
          };
        };
      };
    };
  };

  // Join Tournament with Wallet Balance
  public shared ({ caller }) func joinTournamentWithWallet(tournamentId : Text, gamePlayerId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join tournaments");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        switch (tournaments.get(tournamentId)) {
          case (null) { Runtime.trap("Tournament not found") };
          case (?tournament) {
            if (tournament.status != #Upcoming) {
              Runtime.trap("Tournament is not open for registration");
            };

            let tournamentRegistrations = registrations.values().toArray().filter(func(reg) {
              reg.tournamentId == tournamentId;
            });

            if (tournamentRegistrations.size() >= tournament.maxSlots) {
              Runtime.trap("Tournament is full");
            };

            if (tournamentRegistrations.any(func(reg) { Principal.equal(reg.playerId, caller) })) {
              Runtime.trap("Player is already registered for this tournament");
            };

            if (profile.walletBalance < tournament.entryFee) {
              Runtime.trap("Insufficient wallet balance");
            };

            // Deduct entry fee
            let updatedProfile : UserProfile = {
              name = profile.name;
              phone = profile.phone;
              upiId = profile.upiId;
              walletBalance = profile.walletBalance - tournament.entryFee;
              winningsBalance = profile.winningsBalance;
            };
            userProfiles.add(caller, updatedProfile);

            // Create verified registration
            let regId = generateId();
            let registration : Registration = {
              id = regId;
              tournamentId;
              playerId = caller;
              playerName = profile.name;
              phone = profile.phone;
              gamePlayerId;
              paymentScreenshotId = "";
              paymentStatus = #Verified;
              registeredAt = Time.now();
            };
            registrations.add(regId, registration);

            // Log transaction
            let txId = generateId();
            let transaction : Transaction = {
              id = txId;
              userId = caller;
              txType = #MatchJoined;
              amount = tournament.entryFee;
              description = "Joined Tournament " # tournamentId;
              status = #Completed;
              screenshotId = "";
              createdAt = Time.now();
            };
            transactions.add(txId, transaction);

            return regId;
          };
        };
      };
    };
  };

  // Cash Add Requests and Admin Approval
  public shared ({ caller }) func requestAddCash(amount : Nat, screenshotId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cash");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?_profile) {
        let txId = generateId();
        let transaction : Transaction = {
          id = txId;
          userId = caller;
          txType = #CashAdded;
          amount;
          description = "Cash Add Request";
          status = #Pending;
          screenshotId;
          createdAt = Time.now();
        };
        transactions.add(txId, transaction);
        txId;
      };
    };
  };

  public shared ({ caller }) func adminApproveAddCash(txId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve cash additions");
    };

    switch (transactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) {
        if (transaction.status != #Pending or transaction.txType != #CashAdded) {
          Runtime.trap("Invalid transaction type or status");
        };

        switch (userProfiles.get(transaction.userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?profile) {
            let updatedProfile : UserProfile = {
              name = profile.name;
              phone = profile.phone;
              upiId = profile.upiId;
              walletBalance = profile.walletBalance + transaction.amount;
              winningsBalance = profile.winningsBalance;
            };
            userProfiles.add(transaction.userId, updatedProfile);

            let updatedTransaction : Transaction = {
              id = transaction.id;
              userId = transaction.userId;
              txType = transaction.txType;
              amount = transaction.amount;
              description = transaction.description;
              status = #Completed;
              screenshotId = transaction.screenshotId;
              createdAt = transaction.createdAt;
            };
            transactions.add(txId, updatedTransaction);
          };
        };
      };
    };
  };

  public shared ({ caller }) func adminRejectAddCash(txId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject cash additions");
    };

    switch (transactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) {
        if (transaction.status != #Pending or transaction.txType != #CashAdded) {
          Runtime.trap("Invalid transaction type or status");
        };

        let updatedTransaction : Transaction = {
          id = transaction.id;
          userId = transaction.userId;
          txType = transaction.txType;
          amount = transaction.amount;
          description = transaction.description;
          status = #Rejected;
          screenshotId = transaction.screenshotId;
          createdAt = transaction.createdAt;
        };
        transactions.add(txId, updatedTransaction);
      };
    };
  };

  // Prize Credit and Winnings Withdrawal
  public shared ({ caller }) func adminCreditPrize(user : Principal, amount : Nat, description : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can credit prizes");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          name = profile.name;
          phone = profile.phone;
          upiId = profile.upiId;
          walletBalance = profile.walletBalance;
          winningsBalance = profile.winningsBalance + amount;
        };
        userProfiles.add(user, updatedProfile);

        // Log transaction
        let txId = generateId();
        let transaction : Transaction = {
          id = txId;
          userId = user;
          txType = #PrizeWon;
          amount;
          description;
          status = #Completed;
          screenshotId = "";
          createdAt = Time.now();
        };
        transactions.add(txId, transaction);
      };
    };
  };

  public shared ({ caller }) func requestWithdrawal(upiId : Text, amount : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        if (profile.winningsBalance < amount) {
          Runtime.trap("Insufficient winnings balance");
        };

        // Deduct winnings balance immediately
        let updatedProfile : UserProfile = {
          name = profile.name;
          phone = profile.phone;
          upiId;
          walletBalance = profile.walletBalance;
          winningsBalance = profile.winningsBalance - amount;
        };
        userProfiles.add(caller, updatedProfile);

        // Create pending withdrawal transaction
        let txId = generateId();
        let transaction : Transaction = {
          id = txId;
          userId = caller;
          txType = #Withdrawal;
          amount;
          description = "Withdrawal to " # upiId;
          status = #Pending;
          screenshotId = "";
          createdAt = Time.now();
        };
        transactions.add(txId, transaction);
        txId;
      };
    };
  };

  public shared ({ caller }) func adminApproveWithdrawal(txId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };

    switch (transactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) {
        if (transaction.status != #Pending or transaction.txType != #Withdrawal) {
          Runtime.trap("Invalid transaction type or status");
        };

        let updatedTransaction : Transaction = {
          id = transaction.id;
          userId = transaction.userId;
          txType = transaction.txType;
          amount = transaction.amount;
          description = transaction.description;
          status = #Completed;
          screenshotId = transaction.screenshotId;
          createdAt = transaction.createdAt;
        };
        transactions.add(txId, updatedTransaction);
      };
    };
  };

  public shared ({ caller }) func adminRejectWithdrawal(txId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };

    switch (transactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) {
        if (transaction.status != #Pending or transaction.txType != #Withdrawal) {
          Runtime.trap("Invalid transaction type or status");
        };

        switch (userProfiles.get(transaction.userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?profile) {
            // Refund winnings balance to user
            let updatedProfile : UserProfile = {
              name = profile.name;
              phone = profile.phone;
              upiId = profile.upiId;
              walletBalance = profile.walletBalance;
              winningsBalance = profile.winningsBalance + transaction.amount;
            };
            userProfiles.add(transaction.userId, updatedProfile);

            let updatedTransaction : Transaction = {
              id = transaction.id;
              userId = transaction.userId;
              txType = transaction.txType;
              amount = transaction.amount;
              description = transaction.description;
              status = #Rejected;
              screenshotId = transaction.screenshotId;
              createdAt = transaction.createdAt;
            };
            transactions.add(txId, updatedTransaction);
          };
        };
      };
    };
  };

  // Get Transactions
  public query ({ caller }) func getMyTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    transactions.values().toArray().filter(func(tx) { Principal.equal(tx.userId, caller) }).sort(
      func(a, b) { Nat.compare(b.createdAt.toNat(), a.createdAt.toNat()) }
    );
  };

  public query ({ caller }) func getPendingTransactions() : async [Transaction] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending transactions");
    };

    transactions.values().toArray().filter(func(tx) { tx.status == #Pending });
  };

  // Registration Functions
  public shared ({ caller }) func registerForTournament(
    tournamentId : Text,
    playerName : Text,
    phone : Phone,
    gamePlayerId : Text,
    paymentScreenshotId : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register for tournaments");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?_profile) {
        switch (tournaments.get(tournamentId)) {
          case (null) { Runtime.trap("Tournament not found") };
          case (?tournament) {
            if (tournament.status != #Upcoming) {
              Runtime.trap("Tournament is not open for registration");
            };

            let tournamentRegistrations = registrations.values().toArray().filter(func(reg) {
              reg.tournamentId == tournamentId;
            });

            if (tournamentRegistrations.size() >= tournament.maxSlots) {
              Runtime.trap("Tournament is full");
            };

            if (tournamentRegistrations.any(func(reg) { Principal.equal(reg.playerId, caller) })) {
              Runtime.trap("Player is already registered for this tournament");
            };

            let regId = generateId();
            let newRegistration : Registration = {
              id = regId;
              tournamentId;
              playerId = caller;
              playerName;
              phone;
              gamePlayerId;
              paymentScreenshotId;
              paymentStatus = #Pending;
              registeredAt = Time.now();
            };

            registrations.add(regId, newRegistration);
            regId;
          };
        };
      };
    };
  };

  public shared ({ caller }) func updatePaymentScreenshot(registrationId : Text, paymentScreenshotId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update payment screenshots");
    };

    switch (registrations.get(registrationId)) {
      case (null) { Runtime.trap("Registration not found") };
      case (?registration) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isOwner = Principal.equal(registration.playerId, caller);

        if (not isOwner and not isAdmin) {
          Runtime.trap("Unauthorized: Only the player or admin can update payment screenshot");
        };

        let updatedRegistration : Registration = {
          id = registration.id;
          tournamentId = registration.tournamentId;
          playerId = registration.playerId;
          playerName = registration.playerName;
          phone = registration.phone;
          gamePlayerId = registration.gamePlayerId;
          paymentScreenshotId;
          paymentStatus = registration.paymentStatus;
          registeredAt = registration.registeredAt;
        };

        registrations.add(registrationId, updatedRegistration);
      };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(updates : [(Text, PaymentStatus)]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };

    for ((registrationId, newStatus) in updates.values()) {
      switch (registrations.get(registrationId)) {
        case (null) { Runtime.trap("Registration not found") };
        case (?registration) {
          let updatedRegistration : Registration = {
            id = registration.id;
            tournamentId = registration.tournamentId;
            playerId = registration.playerId;
            playerName = registration.playerName;
            phone = registration.phone;
            gamePlayerId = registration.gamePlayerId;
            paymentScreenshotId = registration.paymentScreenshotId;
            paymentStatus = newStatus;
            registeredAt = registration.registeredAt;
          };
          registrations.add(registrationId, updatedRegistration);
        };
      };
    };
  };

  public shared ({ caller }) func setRoomDetails(tournamentId : Text, roomId : Text, roomPassword : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set room details");
    };

    switch (tournaments.get(tournamentId)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?tournament) {
        let updatedTournament : Tournament = {
          id = tournament.id;
          name = tournament.name;
          description = tournament.description;
          prizePool = tournament.prizePool;
          secondPrize = tournament.secondPrize;
          thirdPrize = tournament.thirdPrize;
          entryFee = tournament.entryFee;
          maxSlots = tournament.maxSlots;
          startTime = tournament.startTime;
          status = tournament.status;
          upiQrImageId = tournament.upiQrImageId;
          roomId = ?roomId;
          roomPassword = ?roomPassword;
          gameType = tournament.gameType;
          createdAt = tournament.createdAt;
        };
        tournaments.add(tournamentId, updatedTournament);
      };
    };
  };

  public query ({ caller }) func getCallerRegistrations() : async [Registration] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view registrations");
    };
    registrations.values().toArray().filter(func(reg) { Principal.equal(reg.playerId, caller) });
  };

  public query ({ caller }) func getTournamentRegistrations(tournamentId : Text) : async [Registration] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view tournament registrations");
    };

    registrations.values().toArray().filter(func(reg) { reg.tournamentId == tournamentId });
  };
};
