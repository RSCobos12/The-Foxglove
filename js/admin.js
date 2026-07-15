(async () => {
      await window.adminSidebarReady;

  const {
    data: { session },
  } = await foxgloveSupabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const { data: profile, error } = await foxgloveSupabase
    .from("profiles")
    .select("first_name, role, is_active")
    .eq("id", session.user.id)
    .single();

  if (
    error ||
    !profile ||
    profile.role !== "admin" ||
    !profile.is_active
  ) {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  const welcomeMessage = document.querySelector("#admin-welcome");

  if (welcomeMessage && profile.first_name) {
    welcomeMessage.textContent = `Welcome back, ${profile.first_name}.`;
  }

    const rsvpCount =
    document.querySelector("#overview-rsvp-count");

  const rsvpMessage =
    document.querySelector("#overview-rsvp-message");

  async function loadNewRsvpCount() {
    const { data: tournament, error: tournamentError } =
      await foxgloveSupabase
        .from("tournaments")
        .select("id")
        .eq("status", "open")
        .order("year", { ascending: false })
        .limit(1)
        .single();

    if (tournamentError || !tournament) {
      rsvpCount.textContent = "0";
      rsvpMessage.textContent =
        "No open tournament is currently available.";
      return;
    }

    const { count, error: rsvpError } =
      await foxgloveSupabase
        .from("rsvps")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("tournament_id", tournament.id)
        .eq("review_status", "new");

    if (rsvpError) {
      rsvpCount.textContent = "—";
      rsvpMessage.textContent =
        "Unable to load new RSVP submissions.";
      return;
    }

    const total = count || 0;

    rsvpCount.textContent = total;

    rsvpMessage.textContent =
      total === 0
        ? "No new RSVP submissions."
        : `${total} new ${
            total === 1 ? "response requires" : "responses require"
          } review.`;
  }

  await loadNewRsvpCount();

  const logoutButton = document.querySelector("#logout-button");

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });
})();