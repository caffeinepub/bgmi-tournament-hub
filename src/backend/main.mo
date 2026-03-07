import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type TournamentStatus = {
    #Upcoming;
    #Live;
    #Completed;
    #Cancelled;
  };

  module TournamentStatus {
    public func toText(status : TournamentStatus) : Text {
      switch (status) {
        case (#Upcoming) { "Upcoming" };
        case (#Live) { "Live" };
        case (#Completed) { "Completed" };
        case (#Cancelled) { "Cancelled" };
      };
    };

    public func compare(status1 : TournamentStatus, status2 : TournamentStatus) : Order.Order {
      let _toNat = func(status : TournamentStatus) : Nat {
        switch (status) {
          case (#Upcoming) { 0 };
          case (#Live) { 1 };
          case (#Completed) { 2 };
          case (#Cancelled) { 3 };
        };
      };
      Nat.compare(_toNat(status1), _toNat(status2));
    };
  };

  type Tournament = {
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

  module Tournament {
    public func compare(t1 : Tournament, t2 : Tournament) : Order.Order {
      Int.compare(t1.startTime, t2.startTime);
    };
  };

  let tournaments = Map.empty<Text, Tournament>();

  type PaymentStatus = {
    #Pending;
    #Verified;
    #Rejected;
  };

  module PaymentStatus {
    public func toText(status : PaymentStatus) : Text {
      switch (status) {
        case (#Pending) { "Pending" };
        case (#Verified) { "Verified" };
        case (#Rejected) { "Rejected" };
      };
    };

    public func compare(status1 : PaymentStatus, status2 : PaymentStatus) : Order.Order {
      let _toNat = func(status : PaymentStatus) : Nat {
        switch (status) {
          case (#Pending) { 0 };
          case (#Verified) { 1 };
          case (#Rejected) { 2 };
        };
      };
      Nat.compare(_toNat(status1), _toNat(status2));
    };
  };

  type Registration = {
    id : Text;
    tournamentId : Text;
    playerId : Principal;
    playerName : Text;
    email : Text;
    phone : Text;
    bgmiId : Text;
    paymentScreenshotId : Text;
    paymentStatus : PaymentStatus;
    registeredAt : Int;
  };

  module Registration {
    public func compare(r1 : Registration, r2 : Registration) : Order.Order {
      Int.compare(r1.registeredAt, r2.registeredAt);
    };
  };

  let registrations = Map.empty<Text, Registration>();

  type PaymentStatusUpdate = {
    registrationId : Text;
    newStatus : PaymentStatus;
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  let idGenerator = { var counter = 0 };

  func generateId() : Text {
    let id = idGenerator.counter;
    idGenerator.counter += 1;
    Nat.toText(id);
  };

  func isPlayerVerifiedForTournament(playerId : Principal, tournamentId : Text) : Bool {
    let playerRegs = registrations.values().toArray().filter(
      func(reg : Registration) : Bool {
        Principal.equal(reg.playerId, playerId) and reg.tournamentId == tournamentId and reg.paymentStatus == #Verified
      }
    );
    playerRegs.size() > 0;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
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

  public shared ({ caller }) func deleteTournament(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete tournaments");
    };

    switch (tournaments.get(id)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?_) {
        tournaments.remove(id);
      };
    };
  };

  public query ({ caller }) func getTournament(id : Text) : async Tournament {
    switch (tournaments.get(id)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?tournament) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isVerified = isPlayerVerifiedForTournament(caller, id);

        if (isAdmin or isVerified) {
          return tournament;
        } else {
          let tournamentWithoutSensitive : Tournament = {
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
          return tournamentWithoutSensitive;
        };
      };
    };
  };

  public query ({ caller }) func listTournaments() : async [Tournament] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let allTournaments = tournaments.values().toArray();

    if (isAdmin) {
      return allTournaments.sort();
    } else {
      let sanitizedTournaments = allTournaments.map(
        func(tournament : Tournament) : Tournament {
          let isVerified = isPlayerVerifiedForTournament(caller, tournament.id);
          if (isVerified) {
            return tournament;
          } else {
            return {
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
      return sanitizedTournaments.sort();
    };
  };

  public shared ({ caller }) func registerForTournament(
    tournamentId : Text,
    playerName : Text,
    email : Text,
    phone : Text,
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

        let tournamentRegistrations = registrations.values().toArray().filter(
          func(reg : Registration) : Bool { reg.tournamentId == tournamentId }
        );

        if (tournamentRegistrations.size() >= tournament.maxSlots) {
          Runtime.trap("Tournament is full");
        };

        let playerRegistrations = tournamentRegistrations.filter(
          func(reg : Registration) : Bool { Principal.equal(reg.playerId, caller) }
        );

        if (playerRegistrations.size() > 0) {
          Runtime.trap("Player is already registered for this tournament");
        };

        let regId = generateId();
        let newRegistration : Registration = {
          id = regId;
          tournamentId;
          playerId = caller;
          playerName;
          email;
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
        if (not Principal.equal(registration.playerId, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the player or admin can update payment screenshot");
        };

        let updatedRegistration : Registration = {
          id = registration.id;
          tournamentId = registration.tournamentId;
          playerId = registration.playerId;
          playerName = registration.playerName;
          email = registration.email;
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

  public shared ({ caller }) func updatePaymentStatus(updates : [PaymentStatusUpdate]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };

    for (update in updates.values()) {
      switch (registrations.get(update.registrationId)) {
        case (null) { Runtime.trap("Registration not found") };
        case (?registration) {
          let updatedRegistration : Registration = {
            id = registration.id;
            tournamentId = registration.tournamentId;
            playerId = registration.playerId;
            playerName = registration.playerName;
            email = registration.email;
            phone = registration.phone;
            bgmiId = registration.bgmiId;
            paymentScreenshotId = registration.paymentScreenshotId;
            paymentStatus = update.newStatus;
            registeredAt = registration.registeredAt;
          };
          registrations.add(update.registrationId, updatedRegistration);
        };
      };
    };
  };

  public shared ({ caller }) func setRoomDetails(
    tournamentId : Text,
    roomId : Text,
    roomPassword : Text,
  ) : async () {
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

    registrations.values().toArray().filter(
      func(reg : Registration) : Bool { Principal.equal(reg.playerId, caller) }
    );
  };

  public query ({ caller }) func getTournamentRegistrations(tournamentId : Text) : async [Registration] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view tournament registrations");
    };

    registrations.values().toArray().filter(
      func(reg : Registration) : Bool { reg.tournamentId == tournamentId }
    );
  };
};
