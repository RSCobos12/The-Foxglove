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
      .select(
        "id, first_name, last_name, email, role, is_active"
      )
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

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
      const statusCell = document.createElement("td");

      const fullName =
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

      nameCell.textContent = fullName || "Unnamed Member";
      emailCell.textContent = profile.email || "No email";
      roleCell.textContent =
        profile.role === "admin" ? "Administrator" : "Member";

      const statusBadge = document.createElement("span");
      statusBadge.className =
        `admin-status-badge ${
          profile.is_active ? "is-active" : "is-inactive"
        }`;
      statusBadge.textContent =
        profile.is_active ? "Active" : "Inactive";

      statusCell.appendChild(statusBadge);

      row.append(nameCell, emailCell, roleCell, statusCell);
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