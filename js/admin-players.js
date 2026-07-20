(async () => {
      await window.adminSidebarReady;
      
  const {
    data: { session },
  } = await foxgloveSupabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const { data: currentProfile, error: profileError } =
    await foxgloveSupabase
      .from("profiles")
      .select("first_name, role, is_active")
      .eq("id", session.user.id)
      .single();

  if (
    profileError ||
    !currentProfile ||
    currentProfile.role !== "admin" ||
    !currentProfile.is_active
  ) {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  const welcomeMessage = document.querySelector("#admin-welcome");
  const memberCount = document.querySelector("#member-count");
  const playersMessage = document.querySelector("#players-message");
  const tableWrapper = document.querySelector(
    "#players-table-wrapper"
  );
  const tableBody = document.querySelector("#players-table-body");
  const logoutButton = document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  const { data: profiles, error: profilesError } =
    await foxgloveSupabase
      .from("profiles")
      .select(`
  id,
  first_name,
  last_name,
  email,
  role,
  is_active,
  jacket_size,
  jacket_size_updated_at
`)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

      const {
  data: activeTournament,
  error: activeTournamentError,
} = await foxgloveSupabase
  .from("tournaments")
  .select("id")
  .eq("is_member_lounge_season", true)
  .limit(1)
  .maybeSingle();

let activeRsvps = [];

if (
  !activeTournamentError &&
  activeTournament
) {
  const {
    data: rsvpData,
    error: rsvpError,
  } = await foxgloveSupabase
    .from("rsvps")
    .select("email, attendance_status")
    .eq(
      "tournament_id",
      activeTournament.id
    );

  if (!rsvpError) {
    activeRsvps = rsvpData || [];
  }
}

const rsvpByEmail = new Map(
  activeRsvps.map((response) => [
    response.email?.trim().toLowerCase(),
    response.attendance_status,
  ])
);

  if (profilesError) {
    playersMessage.textContent =
      "Unable to load the Player Directory.";
    playersMessage.classList.add("is-error");
  } else if (!profiles || profiles.length === 0) {
    memberCount.textContent = "0 members";
    playersMessage.textContent = "No members have been added.";
  } else {
    memberCount.textContent =
      `${profiles.length} ${profiles.length === 1 ? "member" : "members"}`;

    tableBody.innerHTML = "";

    profiles.forEach((profile) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
const emailCell = document.createElement("td");
const roleCell = document.createElement("td");
const rsvpCell = document.createElement("td");
const jacketSizeCell = document.createElement("td");
const jacketUpdatedCell = document.createElement("td");
const statusCell = document.createElement("td");

      const fullName =
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

      nameCell.textContent = fullName || "Unnamed Member";
      emailCell.textContent = profile.email || "No email";
      roleCell.textContent =
  profile.role === "admin"
    ? "Administrator"
    : "Member";

const memberRsvpStatus =
  rsvpByEmail.get(
    profile.email?.trim().toLowerCase()
  );

const rsvpBadge =
  document.createElement("span");

if (memberRsvpStatus === "attending") {
  rsvpBadge.className =
    "admin-status-badge is-active";

  rsvpBadge.textContent = "Attending";
} else if (
  memberRsvpStatus === "declined"
) {
  rsvpBadge.className =
    "admin-status-badge is-inactive";

  rsvpBadge.textContent = "Declined";
} else {
  rsvpBadge.className =
    "admin-status-badge";

  rsvpBadge.textContent = "No Response";
}

rsvpCell.appendChild(rsvpBadge);

jacketSizeCell.textContent =
  profile.jacket_size || "Not Set";

if (profile.jacket_size_updated_at) {
  jacketUpdatedCell.textContent =
    new Date(
      profile.jacket_size_updated_at
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
} else {
  jacketUpdatedCell.textContent = "—";
}

const statusBadge = document.createElement("span");
      statusBadge.className =
        `admin-status-badge ${
          profile.is_active ? "is-active" : "is-inactive"
        }`;
      statusBadge.textContent =
        profile.is_active ? "Active" : "Inactive";

      statusCell.appendChild(statusBadge);

     row.append(
  nameCell,
  emailCell,
  roleCell,
  rsvpCell,
  jacketSizeCell,
  jacketUpdatedCell,
  statusCell
);
      tableBody.appendChild(row);
    });

    playersMessage.hidden = true;
    tableWrapper.hidden = false;
  }

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });
})();