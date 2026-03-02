import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import AccessControl "./authorization/access-control";
import MixinAuth "./authorization/MixinAuthorization";
import Stripe "./stripe/stripe";
import OutCall "./http-outcalls/outcall";

persistent actor {
  type UnitStatus = { #VACANT; #OCCUPIED; #RESERVED; #DELINQUENT; #DISABLED };
  type LeaseStatus = { #ACTIVE; #ENDED; #DELINQUENT };
  type InvoiceStatus = { #DRAFT; #SENT; #PAID; #OVERDUE };
  type PayMethod = { #CARD; #ACH; #OTHER };
  type PayStatus = { #PENDING; #SUCCESS; #FAILED };

  type Facility = { id : Nat; name : Text; address : Text; tz : Text };
  type StorageUnit = {
    id : Nat; fid : Nat; num : Text; sz : Text;
    fl : Nat; rw : Nat; cl : Nat; rent : Float;
    status : UnitStatus; notes : Text
  };
  type Tenant = {
    id : Nat; name : Text; email : Text;
    phone : Text; addr : Text; payMethod : Text
  };
  type Lease = {
    id : Nat; tenantId : Nat; unitId : Nat;
    startDate : Text; endDate : ?Text;
    rent : Float; billingDay : Nat; autoPay : Bool; status : LeaseStatus
  };
  type Invoice = {
    id : Nat; leaseId : Nat; pStart : Text; pEnd : Text;
    dueDate : Text; amount : Float; invStatus : InvoiceStatus; sentAt : ?Text
  };
  type Payment = {
    id : Nat; tenantId : Nat; invoiceId : Nat; pDate : Text;
    amount : Float; method : PayMethod; txId : Text; payStatus : PayStatus
  };
  type AdminStats = {
    totalUnits : Nat; occupiedUnits : Nat;
    occupancyRate : Float; mrr : Float; overdueCount : Nat
  };

  let accessControlState = AccessControl.initState();
  include MixinAuth(accessControlState);

  var stripeKey : Text = "";
  var appBaseUrl : Text = "https://your-app.icp0.io";
  var seeded : Bool = false;

  var nextFid : Nat = 1;
  var nextUid : Nat = 1;
  var nextTid : Nat = 1;
  var nextLid : Nat = 1;
  var nextIid : Nat = 1;
  var nextPid : Nat = 1;

  let facilities = Map.empty<Nat, Facility>();
  let units = Map.empty<Nat, StorageUnit>();
  let tenants = Map.empty<Nat, Tenant>();
  let leases = Map.empty<Nat, Lease>();
  let invoices = Map.empty<Nat, Invoice>();
  let payments = Map.empty<Nat, Payment>();
  let principalToTenant = Map.empty<Text, Nat>();

  func filterMap<K, V>(m : Map.Map<K, V>, pred : V -> Bool) : [V] {
    var r : [V] = [];
    for ((_, v) in m.entries()) {
      if (pred(v)) r := r.concat([v]);
    };
    r;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func setStripeConfig(key : Text, baseUrl : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    stripeKey := key;
    appBaseUrl := baseUrl;
  };

  public shared ({ caller }) func registerCustomer(name : Text, email : Text, phone : Text) : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be authenticated");
    switch (principalToTenant.get(caller.toText())) {
      case (?tid) { return tid };
      case (null) {};
    };
    let id = nextTid;
    nextTid += 1;
    tenants.add(id, { id; name; email; phone; addr = ""; payMethod = "CARD" });
    principalToTenant.add(caller.toText(), id);
    id;
  };

  public shared ({ caller }) func linkTenantToCaller(tenantId : Nat) : async () {
    if (caller.isAnonymous()) Runtime.trap("Must be authenticated");
    principalToTenant.add(caller.toText(), tenantId);
  };

  public query ({ caller }) func getMyTenantId() : async ?Nat {
    principalToTenant.get(caller.toText());
  };

  public shared ({ caller }) func createFacility(name : Text, address : Text, tz : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let id = nextFid;
    nextFid += 1;
    facilities.add(id, { id; name; address; tz });
    id;
  };

  public query func listFacilities() : async [Facility] {
    facilities.values().toArray();
  };

  public shared ({ caller }) func updateFacility(id : Nat, name : Text, address : Text, tz : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (facilities.get(id)) {
      case (null) Runtime.trap("Not found");
      case (?_) { facilities.add(id, { id; name; address; tz }) };
    };
  };

  public shared ({ caller }) func createUnit(fid : Nat, num : Text, sz : Text, fl : Nat, rw : Nat, cl : Nat, rent : Float, notes : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let id = nextUid;
    nextUid += 1;
    units.add(id, { id; fid; num; sz; fl; rw; cl; rent; status = #VACANT; notes });
    id;
  };

  public query func listUnitsByFacility(fid : Nat) : async [StorageUnit] {
    filterMap(units, func(u : StorageUnit) : Bool { u.fid == fid });
  };

  public query func listAllUnits() : async [StorageUnit] {
    units.values().toArray();
  };

  public shared ({ caller }) func updateUnit(id : Nat, num : Text, sz : Text, fl : Nat, rw : Nat, cl : Nat, rent : Float, status : UnitStatus, notes : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (units.get(id)) {
      case (null) Runtime.trap("Not found");
      case (?u) { units.add(id, { u with num; sz; fl; rw; cl; rent; status; notes }) };
    };
  };

  public shared ({ caller }) func deleteUnit(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    units.remove(id);
  };

  public shared ({ caller }) func createTenant(name : Text, email : Text, phone : Text, addr : Text, payMethod : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let id = nextTid;
    nextTid += 1;
    tenants.add(id, { id; name; email; phone; addr; payMethod });
    id;
  };

  public query func getTenant(id : Nat) : async ?Tenant {
    tenants.get(id);
  };

  public query ({ caller }) func listTenants() : async [Tenant] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    tenants.values().toArray();
  };

  public query ({ caller }) func searchTenants(q : Text) : async [Tenant] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let lq = q.toLower();
    filterMap(tenants, func(t : Tenant) : Bool {
      t.name.toLower().contains(#text lq) or
      t.email.toLower().contains(#text lq) or
      t.phone.contains(#text lq)
    });
  };

  public shared ({ caller }) func updateTenant(id : Nat, name : Text, email : Text, phone : Text, addr : Text, payMethod : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (tenants.get(id)) {
      case (null) Runtime.trap("Not found");
      case (?_) { tenants.add(id, { id; name; email; phone; addr; payMethod }) };
    };
  };

  public shared ({ caller }) func createLease(tenantId : Nat, unitId : Nat, startDate : Text, rent : Float, billingDay : Nat) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (units.get(unitId)) {
      case (null) Runtime.trap("Unit not found");
      case (?u) { units.add(unitId, { u with status = #OCCUPIED }) };
    };
    let id = nextLid;
    nextLid += 1;
    leases.add(id, {
      id; tenantId; unitId; startDate;
      endDate = null; rent; billingDay; autoPay = false; status = #ACTIVE
    });
    id;
  };

  public shared ({ caller }) func endLease(leaseId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (leases.get(leaseId)) {
      case (null) Runtime.trap("Not found");
      case (?l) {
        switch (units.get(l.unitId)) {
          case (?u) { units.add(l.unitId, { u with status = #VACANT }) };
          case (null) {};
        };
        leases.add(leaseId, { l with status = #ENDED; endDate = ?"2026-03-01" });
      };
    };
  };

  public shared ({ caller }) func updateLease(leaseId : Nat, rent : Float, billingDay : Nat, autoPay : Bool, status : LeaseStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (leases.get(leaseId)) {
      case (null) Runtime.trap("Not found");
      case (?l) { leases.add(leaseId, { l with rent; billingDay; autoPay; status }) };
    };
  };

  public shared ({ caller }) func setAutoPay(leaseId : Nat, enabled : Bool) : async () {
    switch (leases.get(leaseId)) {
      case (null) Runtime.trap("Not found");
      case (?l) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isOwner = switch (principalToTenant.get(caller.toText())) {
          case (?tid) { tid == l.tenantId };
          case (null) { false };
        };
        if (not isAdmin and not isOwner) Runtime.trap("Unauthorized");
        leases.add(leaseId, { l with autoPay = enabled });
      };
    };
  };

  public query func getLease(id : Nat) : async ?Lease {
    leases.get(id);
  };

  public query func listAllLeases() : async [Lease] {
    leases.values().toArray();
  };

  public query ({ caller }) func listLeasesByTenant(tenantId : Nat) : async [Lease] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin) {
      switch (principalToTenant.get(caller.toText())) {
        case (?tid) { if (tid != tenantId) Runtime.trap("Unauthorized") };
        case (null) Runtime.trap("Unauthorized");
      };
    };
    filterMap(leases, func(l : Lease) : Bool { l.tenantId == tenantId });
  };

  public query ({ caller }) func getMyLeases() : async [Lease] {
    switch (principalToTenant.get(caller.toText())) {
      case (null) { [] };
      case (?tid) {
        filterMap(leases, func(l : Lease) : Bool { l.tenantId == tid });
      };
    };
  };

  public query ({ caller }) func getMyInvoices() : async [Invoice] {
    switch (principalToTenant.get(caller.toText())) {
      case (null) { [] };
      case (?tid) {
        var leaseIds : [Nat] = [];
        for ((_, l) in leases.entries()) {
          if (l.tenantId == tid) leaseIds := leaseIds.concat([l.id]);
        };
        filterMap(invoices, func(inv : Invoice) : Bool {
          var found = false;
          for (lid in leaseIds.vals()) {
            if (inv.leaseId == lid) found := true;
          };
          found;
        });
      };
    };
  };

  public query ({ caller }) func getMyPayments() : async [Payment] {
    switch (principalToTenant.get(caller.toText())) {
      case (null) { [] };
      case (?tid) {
        filterMap(payments, func(p : Payment) : Bool { p.tenantId == tid });
      };
    };
  };

  public shared ({ caller }) func createInvoice(leaseId : Nat, pStart : Text, pEnd : Text, dueDate : Text, amount : Float) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let id = nextIid;
    nextIid += 1;
    invoices.add(id, { id; leaseId; pStart; pEnd; dueDate; amount; invStatus = #DRAFT; sentAt = null });
    id;
  };

  public query func getInvoice(id : Nat) : async ?Invoice {
    invoices.get(id);
  };

  public query func listAllInvoices() : async [Invoice] {
    invoices.values().toArray();
  };

  public query ({ caller }) func listInvoicesByTenant(tenantId : Nat) : async [Invoice] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    var leaseIds : [Nat] = [];
    for ((_, l) in leases.entries()) {
      if (l.tenantId == tenantId) leaseIds := leaseIds.concat([l.id]);
    };
    filterMap(invoices, func(inv : Invoice) : Bool {
      var found = false;
      for (lid in leaseIds.vals()) {
        if (inv.leaseId == lid) found := true;
      };
      found;
    });
  };

  public shared ({ caller }) func updateInvoiceStatus(invoiceId : Nat, status : InvoiceStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    switch (invoices.get(invoiceId)) {
      case (null) Runtime.trap("Not found");
      case (?inv) { invoices.add(invoiceId, { inv with invStatus = status }) };
    };
  };

  public shared ({ caller }) func markOverdueInvoices() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    var count : Nat = 0;
    for ((id, inv) in invoices.entries()) {
      switch (inv.invStatus) {
        case (#SENT) {
          if (inv.dueDate < "2026-03-01") {
            invoices.add(id, { inv with invStatus = #OVERDUE });
            count += 1;
          };
        };
        case (_) {};
      };
    };
    count;
  };

  public shared ({ caller }) func generateDueInvoices() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    var count : Nat = 0;
    for ((_, l) in leases.entries()) {
      switch (l.status) {
        case (#ACTIVE) {
          var exists = false;
          for ((_, inv) in invoices.entries()) {
            if (inv.leaseId == l.id and inv.pStart == "2026-03-01") exists := true;
          };
          if (not exists) {
            let id = nextIid;
            nextIid += 1;
            invoices.add(id, {
              id; leaseId = l.id;
              pStart = "2026-03-01"; pEnd = "2026-03-31";
              dueDate = "2026-03-04"; amount = l.rent;
              invStatus = #SENT; sentAt = ?"2026-03-01"
            });
            count += 1;
          };
        };
        case (_) {};
      };
    };
    count;
  };

  public shared ({ caller }) func createPaymentRecord(tenantId : Nat, invoiceId : Nat, amount : Float, method : PayMethod, txId : Text, status : PayStatus) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    let id = nextPid;
    nextPid += 1;
    payments.add(id, { id; tenantId; invoiceId; pDate = "2026-03-01"; amount; method; txId; payStatus = status });
    id;
  };

  public query ({ caller }) func listPaymentsByTenant(tenantId : Nat) : async [Payment] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin) {
      switch (principalToTenant.get(caller.toText())) {
        case (?tid) { if (tid != tenantId) Runtime.trap("Unauthorized") };
        case (null) Runtime.trap("Unauthorized");
      };
    };
    filterMap(payments, func(p : Payment) : Bool { p.tenantId == tenantId });
  };

  public query ({ caller }) func getAdminStats() : async AdminStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Admin only");
    var total : Nat = 0;
    var occupied : Nat = 0;
    for ((_, u) in units.entries()) {
      total += 1;
      switch (u.status) { case (#OCCUPIED) { occupied += 1 }; case (_) {} };
    };
    var mrr : Float = 0.0;
    for ((_, l) in leases.entries()) {
      switch (l.status) { case (#ACTIVE) { mrr += l.rent }; case (_) {} };
    };
    var overdueCount : Nat = 0;
    for ((_, inv) in invoices.entries()) {
      switch (inv.invStatus) { case (#OVERDUE) { overdueCount += 1 }; case (_) {} };
    };
    let rate = if (total == 0) { 0.0 } else {
      occupied.toFloat() / total.toFloat() * 100.0
    };
    { totalUnits = total; occupiedUnits = occupied; occupancyRate = rate; mrr; overdueCount };
  };

  public shared ({ caller }) func createCheckoutSession(invoiceId : Nat) : async Text {
    switch (invoices.get(invoiceId)) {
      case (null) Runtime.trap("Invoice not found");
      case (?inv) {
        if (stripeKey == "") {
          return "demo://checkout?invoice=" # invoiceId.toText();
        };
        let cents : Nat = Int.abs((inv.amount * 100.0).toInt());
        let item : Stripe.ShoppingItem = {
          currency = "usd";
          productName = "Storage Invoice #" # invoiceId.toText();
          productDescription = inv.pStart # " to " # inv.pEnd;
          priceInCents = cents;
          quantity = 1;
        };
        let config : Stripe.StripeConfiguration = {
          secretKey = stripeKey;
          allowedCountries = ["US"]
        };
        let successUrl = appBaseUrl # "/portal/payment-success?session_id={CHECKOUT_SESSION_ID}&invoice_id=" # invoiceId.toText();
        let cancelUrl = appBaseUrl # "/portal/invoices";
        await Stripe.createCheckoutSession(config, caller, [item], successUrl, cancelUrl, transform);
      };
    };
  };

  public shared ({ caller }) func confirmPayment(invoiceId : Nat, sessionId : Text) : async Text {
    switch (invoices.get(invoiceId)) {
      case (null) Runtime.trap("Invoice not found");
      case (?inv) {
        if (stripeKey == "") {
          invoices.add(invoiceId, { inv with invStatus = #PAID });
          let pid = nextPid;
          nextPid += 1;
          let tid = switch (leases.get(inv.leaseId)) {
            case (?l) { l.tenantId };
            case (null) { 0 };
          };
          payments.add(pid, {
            id = pid; tenantId = tid; invoiceId;
            pDate = "2026-03-01"; amount = inv.amount;
            method = #CARD; txId = "demo_" # sessionId; payStatus = #SUCCESS
          });
          return "paid";
        };
        let config : Stripe.StripeConfiguration = {
          secretKey = stripeKey;
          allowedCountries = ["US"]
        };
        switch (await Stripe.getSessionStatus(config, sessionId, transform)) {
          case (#failed(_)) { "failed" };
          case (#completed(_)) {
            invoices.add(invoiceId, { inv with invStatus = #PAID });
            let pid = nextPid;
            nextPid += 1;
            let tid = switch (leases.get(inv.leaseId)) {
              case (?l) { l.tenantId };
              case (null) { 0 };
            };
            payments.add(pid, {
              id = pid; tenantId = tid; invoiceId;
              pDate = "2026-03-01"; amount = inv.amount;
              method = #CARD; txId = sessionId; payStatus = #SUCCESS
            });
            "paid";
          };
        };
      };
    };
  };

  public shared func seedDemoData() : async Text {
    if (seeded) return "Already seeded";
    seeded := true;

    let fid = nextFid;
    nextFid += 1;
    facilities.add(fid, {
      id = fid;
      name = "StoreSmart Downtown";
      address = "123 Main Street, Springfield, IL 62701";
      tz = "America/Chicago"
    });

    type UDef = (Text, Text, UnitStatus, Float);
    let defs : [UDef] = [
      ("A1","5x5",#VACANT,49.0), ("A2","5x5",#OCCUPIED,49.0),
      ("A3","5x5",#OCCUPIED,49.0), ("A4","5x5",#RESERVED,49.0),
      ("B1","5x10",#VACANT,89.0), ("B2","5x10",#OCCUPIED,89.0),
      ("B3","5x10",#VACANT,89.0), ("B4","5x10",#DELINQUENT,89.0),
      ("C1","10x10",#VACANT,149.0), ("C2","10x10",#OCCUPIED,149.0),
      ("C3","10x10",#VACANT,149.0), ("C4","10x10",#DISABLED,149.0),
      ("D1","10x20",#VACANT,249.0), ("D2","10x20",#OCCUPIED,249.0),
      ("D3","10x20",#OCCUPIED,249.0), ("D4","10x20",#RESERVED,249.0)
    ];

    var uids : [Nat] = [];
    var row : Nat = 0;
    var col : Nat = 0;
    for ((num, sz, status, rent) in defs.vals()) {
      let uid = nextUid;
      nextUid += 1;
      let n = if (status == #DISABLED) { "Under maintenance" } else { "" };
      units.add(uid, { id = uid; fid; num; sz; fl = 1; rw = row; cl = col; rent; status; notes = n });
      uids := uids.concat([uid]);
      col += 1;
      if (col == 4) { col := 0; row += 1 };
    };

    let t1 = nextTid; nextTid += 1;
    tenants.add(t1, { id = t1; name = "Alice Johnson"; email = "alice@example.com"; phone = "555-0101"; addr = "45 Oak Ave, Springfield IL"; payMethod = "CARD" });
    let t2 = nextTid; nextTid += 1;
    tenants.add(t2, { id = t2; name = "Bob Martinez"; email = "bob@example.com"; phone = "555-0202"; addr = "78 Elm St, Springfield IL"; payMethod = "ACH" });
    let t3 = nextTid; nextTid += 1;
    tenants.add(t3, { id = t3; name = "Carol Smith"; email = "carol@example.com"; phone = "555-0303"; addr = "12 Pine Rd, Springfield IL"; payMethod = "CARD" });

    let l1 = nextLid; nextLid += 1;
    leases.add(l1, { id = l1; tenantId = t1; unitId = uids[1]; startDate = "2025-01-15"; endDate = null; rent = 49.0; billingDay = 15; autoPay = true; status = #ACTIVE });
    let l2 = nextLid; nextLid += 1;
    leases.add(l2, { id = l2; tenantId = t1; unitId = uids[5]; startDate = "2025-03-01"; endDate = null; rent = 89.0; billingDay = 1; autoPay = false; status = #ACTIVE });
    let l3 = nextLid; nextLid += 1;
    leases.add(l3, { id = l3; tenantId = t2; unitId = uids[9]; startDate = "2024-11-10"; endDate = null; rent = 149.0; billingDay = 10; autoPay = true; status = #ACTIVE });
    let l4 = nextLid; nextLid += 1;
    leases.add(l4, { id = l4; tenantId = t3; unitId = uids[13]; startDate = "2025-02-20"; endDate = null; rent = 249.0; billingDay = 20; autoPay = false; status = #ACTIVE });
    let l5 = nextLid; nextLid += 1;
    leases.add(l5, { id = l5; tenantId = t2; unitId = uids[14]; startDate = "2025-01-01"; endDate = null; rent = 249.0; billingDay = 1; autoPay = false; status = #DELINQUENT });
    let l6 = nextLid; nextLid += 1;
    leases.add(l6, { id = l6; tenantId = t3; unitId = uids[2]; startDate = "2025-02-01"; endDate = null; rent = 49.0; billingDay = 1; autoPay = true; status = #ACTIVE });

    let i1 = nextIid; nextIid += 1;
    invoices.add(i1, { id = i1; leaseId = l1; pStart = "2026-02-15"; pEnd = "2026-03-14"; dueDate = "2026-02-15"; amount = 49.0; invStatus = #PAID; sentAt = ?"2026-02-13" });
    let i2 = nextIid; nextIid += 1;
    invoices.add(i2, { id = i2; leaseId = l1; pStart = "2026-03-15"; pEnd = "2026-04-14"; dueDate = "2026-03-15"; amount = 49.0; invStatus = #SENT; sentAt = ?"2026-03-10" });
    let i3 = nextIid; nextIid += 1;
    invoices.add(i3, { id = i3; leaseId = l2; pStart = "2026-03-01"; pEnd = "2026-03-31"; dueDate = "2026-03-01"; amount = 89.0; invStatus = #OVERDUE; sentAt = ?"2026-02-28" });
    let i4 = nextIid; nextIid += 1;
    invoices.add(i4, { id = i4; leaseId = l3; pStart = "2026-02-10"; pEnd = "2026-03-09"; dueDate = "2026-02-10"; amount = 149.0; invStatus = #PAID; sentAt = ?"2026-02-08" });
    let i5 = nextIid; nextIid += 1;
    invoices.add(i5, { id = i5; leaseId = l4; pStart = "2026-02-20"; pEnd = "2026-03-19"; dueDate = "2026-02-20"; amount = 249.0; invStatus = #OVERDUE; sentAt = ?"2026-02-18" });
    let i6 = nextIid; nextIid += 1;
    invoices.add(i6, { id = i6; leaseId = l5; pStart = "2026-01-01"; pEnd = "2026-01-31"; dueDate = "2026-01-01"; amount = 249.0; invStatus = #OVERDUE; sentAt = ?"2025-12-31" });

    let p1 = nextPid; nextPid += 1;
    payments.add(p1, { id = p1; tenantId = t1; invoiceId = i1; pDate = "2026-02-14"; amount = 49.0; method = #CARD; txId = "ch_demo_001"; payStatus = #SUCCESS });
    let p2 = nextPid; nextPid += 1;
    payments.add(p2, { id = p2; tenantId = t2; invoiceId = i4; pDate = "2026-02-09"; amount = 149.0; method = #ACH; txId = "ch_demo_002"; payStatus = #SUCCESS });

    "Seeded: 1 facility, 16 units, 3 tenants, 6 leases, 6 invoices, 2 payments";
  };
}
