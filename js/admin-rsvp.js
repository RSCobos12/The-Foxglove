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

  const welcomeMessage =
    document.querySelector("#admin-welcome");

  const yearSelect =
    document.querySelector("#rsvp-year");

  const filterSelect =
    document.querySelector("#rsvp-filter");

  const countElement =
    document.querySelector("#rsvp-count");

  const statusMessage =
    document.querySelector("#rsvp-admin-message");

  const tableWrapper =
    document.querySelector("#rsvp-table-wrapper");

  const tableBody =
    document.querySelector("#rsvp-table-body");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  let tournaments = [];
  let responses = [];

  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle(
      "is-error",
      isError
    );
    statusMessage.hidden = false;
  }

  function formatSubmittedDate(value) {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(new Date(value));
  }

  function getFilteredResponses() {
    const selectedFilter = filterSelect.value;

    if (selectedFilter === "all") {
      return responses;
    }

    if (
      selectedFilter === "new" ||
      selectedFilter === "reviewed"
    ) {
      return responses.filter(
        (response) =>
          response.review_status === selectedFilter
      );
    }

    return responses.filter(
      (response) =>
        response.attendance_status === selectedFilter
    );
  }

  function createStatusBadge(response) {
    const badge = document.createElement("span");

    badge.className =
      `admin-status-badge ${
        response.review_status === "new"
          ? "is-new"
          : "is-reviewed"
      }`;

    badge.textContent =
      response.review_status === "new"
        ? "New"
        : "Reviewed";

    return badge;
  }

  function renderResponses() {
    const filteredResponses =
      getFilteredResponses();

    countElement.textContent =
      `${filteredResponses.length} ${
        filteredResponses.length === 1
          ? "response"
          : "responses"
      }`;

    tableBody.innerHTML = "";

    if (filteredResponses.length === 0) {
      tableWrapper.hidden = true;
      showMessage(
        "No RSVP responses match this filter."
      );
      return;
    }

    statusMessage.hidden = true;
    tableWrapper.hidden = false;

    filteredResponses.forEach((response) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      const attendanceCell = document.createElement("td");
      const emailCell = document.createElement("td");
      const dietaryCell = document.createElement("td");
      const requestsCell = document.createElement("td");
      const submittedCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const actionCell = document.createElement("td");

      nameCell.textContent =
        `${response.first_name} ${response.last_name}`;

      attendanceCell.textContent =
        response.attendance_status === "attending"
          ? "Attending"
          : "Declined";

      emailCell.textContent = response.email;

      dietaryCell.textContent =
        response.dietary_restrictions || "—";

      requestsCell.textContent =
        response.special_requests || "—";

      submittedCell.textContent =
        formatSubmittedDate(response.submitted_at);

      statusCell.appendChild(
        createStatusBadge(response)
      );

      if (response.review_status === "new") {
        const reviewButton =
          document.createElement("button");

        reviewButton.type = "button";
        reviewButton.className =
          "admin-secondary-button";

        reviewButton.textContent =
          "Mark Reviewed";

        reviewButton.addEventListener(
          "click",
          async () => {
            reviewButton.disabled = true;
            reviewButton.textContent = "Saving...";

            const { error } =
              await foxgloveSupabase
                .from("rsvps")
                .update({
                  review_status: "reviewed",
                  updated_at:
                    new Date().toISOString(),
                })
                .eq("id", response.id);

            if (error) {
              showMessage(
                "Unable to update the RSVP.",
                true
              );

              reviewButton.disabled = false;
              reviewButton.textContent =
                "Mark Reviewed";

              return;
            }

            response.review_status =
              "reviewed";

            renderResponses();
          }
        );

        actionCell.appendChild(reviewButton);
      } else {
        actionCell.textContent = "—";
      }

      row.append(
        nameCell,
        attendanceCell,
        emailCell,
        dietaryCell,
        requestsCell,
        submittedCell,
        statusCell,
        actionCell
      );

      tableBody.appendChild(row);
    });
  }

  async function loadResponses() {
    const tournamentId = yearSelect.value;

    if (!tournamentId) return;

    showMessage("Loading RSVP responses...");
    tableWrapper.hidden = true;

    const { data, error } =
      await foxgloveSupabase
        .from("rsvps")
        .select(`
          id,
          first_name,
          last_name,
          email,
          attendance_status,
          dietary_restrictions,
          special_requests,
          review_status,
          submitted_at,
          updated_at
        `)
        .eq("tournament_id", tournamentId)
        .order(
          "submitted_at",
          { ascending: false }
        );

    if (error) {
      showMessage(
        "Unable to load RSVP responses.",
        true
      );
      return;
    }

    responses = data || [];
    renderResponses();
  }

  const {
  data: tournamentData,
  error: tournamentError,
} = await foxgloveSupabase
  .from("tournaments")
  .select(
    "id, year, is_member_lounge_season"
  )
  .order("year", { ascending: true });

if (tournamentError) {
  showMessage(
    "Unable to load tournament years.",
    true
  );
  return;
}

tournaments = tournamentData || [];

tournaments.forEach((tournament) => {
  const option =
    document.createElement("option");

  option.value = tournament.id;
  option.textContent = tournament.year;

  yearSelect.appendChild(option);
});

const currentTournament =
  tournaments.find(
    (tournament) =>
      tournament.is_member_lounge_season
  );

if (currentTournament) {
  yearSelect.value =
    currentTournament.id;
}

  yearSelect.addEventListener(
    "change",
    loadResponses
  );

  filterSelect.addEventListener(
    "change",
    renderResponses
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      await foxgloveSupabase.auth.signOut();
      window.location.replace("login.html");
    }
  );

  await loadResponses();
})();