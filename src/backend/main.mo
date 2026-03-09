import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";


// Specify the data migration function in with-clause

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type Phone = Text;
  public type UserProfile = {
    name : Text;
    phone : Phone; // Use Phone type for phone field
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

  // Tournament Record
  public type Tournament = {
    id : Text;
    name : Text;
    description : Text;
    prizePool : Text;
    entryFee : Nat;
    maxSlots : Nat;
    startTime : Int;
    status : TournamentStatus;
    upiQrImageId : Text;
    roomId : ?Text;
    roomPassword : ?Text;
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
    phone : Phone; // Use Phone type for phone field
    bgmiId : Text;
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
    let playerRegs = registrations.values().toArray().filter(func(reg) {
      Principal.equal(reg.playerId, playerId) and reg.tournamentId == tournamentId and reg.paymentStatus == #Verified
    });
    not playerRegs.isEmpty();
  };

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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Tournament Management Functions
  public shared ({ caller }) func createTournament(
    name : Text,
    description : Text,
    prizePool : Text,
    entryFee : Nat,
    maxSlots : Nat,
    startTime : Int,
    upiQrImageId : Text,
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
      entryFee;
      maxSlots;
      startTime;
      status = #Upcoming;
      upiQrImageId;
      roomId = null;
      roomPassword = null;
      createdAt = Time.now();
    };

    tournaments.add(tournamentId, newTournament);
    tournamentId;
  };

  public shared ({ caller }) func updateTournament(
    id : Text,
    name : Text,
    description : Text,
    prizePool : Text,
    entryFee : Nat,
    maxSlots : Nat,
    startTime : Int,
    status : TournamentStatus,
    upiQrImageId : Text,
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
          entryFee;
          maxSlots;
          startTime;
          status;
          upiQrImageId;
          roomId = tournament.roomId;
          roomPassword = tournament.roomPassword;
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
          entryFee = tournament.entryFee;
          maxSlots = tournament.maxSlots;
          startTime = tournament.startTime;
          status = #Cancelled;
          upiQrImageId = tournament.upiQrImageId;
          roomId = tournament.roomId;
          roomPassword = tournament.roomPassword;
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

  public query ({ caller }) func listTournaments() : async [Tournament] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let allTournaments = tournaments.values().toArray().sort(
      func(a, b) { Nat.compare(a.startTime.toNat(), b.startTime.toNat()) }
    );

    if (isAdmin) {
      return allTournaments;
    };

    allTournaments.map(
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
            entryFee = tournament.entryFee;
            maxSlots = tournament.maxSlots;
            startTime = tournament.startTime;
            status = tournament.status;
            upiQrImageId = tournament.upiQrImageId;
            roomId = null;
            roomPassword = null;
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
            entryFee = tournament.entryFee;
            maxSlots = tournament.maxSlots;
            startTime = tournament.startTime;
            status = tournament.status;
            upiQrImageId = tournament.upiQrImageId;
            roomId = null;
            roomPassword = null;
            createdAt = tournament.createdAt;
          };
        };
      };
    };
  };

  // Registration Functions
  public shared ({ caller }) func registerForTournament(
    tournamentId : Text,
    playerName : Text,
    phone : Phone,
    bgmiId : Text,
    paymentScreenshotId : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register for tournaments");
    };

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
          bgmiId;
          paymentScreenshotId;
          paymentStatus = #Pending;
          registeredAt = Time.now();
        };

        registrations.add(regId, newRegistration);
        regId;
      };
    };
  };

  public shared ({ caller }) func updatePaymentScreenshot(registrationId : Text, paymentScreenshotId : Text) : async () {
    switch (registrations.get(registrationId)) {
      case (null) { Runtime.trap("Registration not found") };
      case (?registration) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isOwner = Principal.equal(registration.playerId, caller);
        
        // Ensure caller is at least a user (not a guest) or an admin
        if (not isAdmin and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Unauthorized: Only users can update payment screenshots");
        };
        
        // Verify ownership or admin status
        if (not isOwner and not isAdmin) {
          Runtime.trap("Unauthorized: Only the player or admin can update payment screenshot");
        };

        let updatedRegistration : Registration = {
          id = registration.id;
          tournamentId = registration.tournamentId;
          playerId = registration.playerId;
          playerName = registration.playerName;
          phone = registration.phone;
          bgmiId = registration.bgmiId;
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
            bgmiId = registration.bgmiId;
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
          entryFee = tournament.entryFee;
          maxSlots = tournament.maxSlots;
          startTime = tournament.startTime;
          status = tournament.status;
          upiQrImageId = tournament.upiQrImageId;
          roomId = ?roomId;
          roomPassword = ?roomPassword;
          createdAt = tournament.createdAt;
        };
        tournaments.add(tournamentId, updatedTournament);
      };
    };
  };

  public query ({ caller }) func getCallerRegistrations() : async [Registration] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their registrations");
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
