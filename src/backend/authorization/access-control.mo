import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

module {
  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  // Permanent admin principal ID - hardcoded for sagark57744@gmail.com
  let PERMANENT_ADMIN : Text = "qgd2k-5yawn-lg2mr-32rox-x4kp4-i3jqz-34lwi-cxl3q-unp5s-wf2fc-eae";

  public func initState() : AccessControlState {
    {
      var adminAssigned = false;
      userRoles = Map.empty<Principal, UserRole>();
    };
  };

  public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
    if (caller.isAnonymous()) { return };
    // If caller is the permanent admin, always assign admin role
    if (caller.toText() == PERMANENT_ADMIN) {
      state.userRoles.add(caller, #admin);
      state.adminAssigned := true;
      return;
    };
    switch (state.userRoles.get(caller)) {
      case (?_) {};
      case (null) {
        if (not state.adminAssigned and userProvidedToken == adminToken) {
          state.userRoles.add(caller, #admin);
          state.adminAssigned := true;
        } else {
          state.userRoles.add(caller, #user);
        };
      };
    };
  };

  public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
    if (caller.isAnonymous()) { return #guest };
    // Permanent admin always gets admin role
    if (caller.toText() == PERMANENT_ADMIN) { return #admin };
    switch (state.userRoles.get(caller)) {
      case (?role) { role };
      case (null) {
        Runtime.trap("User is not registered");
      };
    };
  };

  public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
    if (not (isAdmin(state, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign user roles");
    };
    state.userRoles.add(user, role);
  };

  public func hasPermission(state : AccessControlState, caller : Principal, requiredRole : UserRole) : Bool {
    let userRole = getUserRole(state, caller);
    if (userRole == #admin or requiredRole == #guest) { true } else {
      userRole == requiredRole;
    };
  };

  public func isAdmin(state : AccessControlState, caller : Principal) : Bool {
    // Permanent admin check
    if (caller.toText() == PERMANENT_ADMIN) { return true };
    getUserRole(state, caller) == #admin;
  };
};
