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

  /* =====================================
   GALLERY SUBMISSION COUNT
===================================== */

const gallerySubmissionCount =
  document.querySelector(
    "#overview-gallery-count"
  );

const gallerySubmissionMessage =
  document.querySelector(
    "#overview-gallery-message"
  );

async function loadGallerySubmissionCount() {
  if (
    !gallerySubmissionCount ||
    !gallerySubmissionMessage
  ) {
    return;
  }

  const {
    data: currentGallerySeason,
    error: seasonError,
  } = await foxgloveSupabase
    .from("tournaments")
    .select("id, year")
    .eq(
      "is_member_lounge_season",
      true
    )
    .limit(1)
    .maybeSingle();

  if (
    seasonError ||
    !currentGallerySeason
  ) {
    if (seasonError) {
      console.error(
        "Unable to load Gallery season:",
        seasonError
      );
    }

    gallerySubmissionCount.textContent =
      "0";

    gallerySubmissionMessage.textContent =
      "No current Member’s Lounge season is selected.";

    return;
  }

  const {
    count,
    error: galleryCountError,
  } = await foxgloveSupabase
    .from("gallery_images")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "tournament_id",
      currentGallerySeason.id
    )
    .eq(
      "submission_status",
      "pending"
    )
    .eq("is_active", true);

  if (galleryCountError) {
    console.error(
      "Unable to load Gallery submission count:",
      galleryCountError
    );

    gallerySubmissionCount.textContent =
      "—";

    gallerySubmissionMessage.textContent =
      "Unable to load photo submissions.";

    return;
  }

  const total = count || 0;

  gallerySubmissionCount.textContent =
    String(total);

  gallerySubmissionMessage.textContent =
    total === 0
      ? `No pending photo submissions for ${currentGallerySeason.year}.`
      : `${total} pending ${
          total === 1
            ? "photo requires"
            : "photos require"
        } review for ${currentGallerySeason.year}.`;
}

await loadGallerySubmissionCount();

  /* =====================================
     MEMBER'S LOUNGE CURRENT SEASON
  ====================================== */

  const memberSeasonSelect =
    document.querySelector("#member-season-select");

  const memberSeasonDescription =
    document.querySelector("#member-season-description");

  const saveMemberSeasonButton =
    document.querySelector("#save-member-season");

  const memberSeasonMessage =
    document.querySelector("#member-season-admin-message");

  let memberSeasonTournaments = [];

  function showMemberSeasonMessage(
    message,
    isError = false
  ) {
    if (!memberSeasonMessage) {
      return;
    }

    memberSeasonMessage.textContent = message;
    memberSeasonMessage.hidden = false;

    memberSeasonMessage.classList.toggle(
      "is-error",
      isError
    );
  }

  function clearMemberSeasonMessage() {
    if (!memberSeasonMessage) {
      return;
    }

    memberSeasonMessage.textContent = "";
    memberSeasonMessage.hidden = true;
    memberSeasonMessage.classList.remove("is-error");
  }

  function populateMemberSeasonSelect() {
    memberSeasonSelect.innerHTML = "";

    if (memberSeasonTournaments.length === 0) {
      const emptyOption =
        document.createElement("option");

      emptyOption.value = "";
      emptyOption.textContent =
        "No tournament seasons available";

      memberSeasonSelect.appendChild(emptyOption);
      memberSeasonSelect.disabled = true;
      saveMemberSeasonButton.disabled = true;
      return;
    }

    memberSeasonTournaments.forEach((tournament) => {
      const option =
        document.createElement("option");

      option.value = tournament.id;
      option.textContent =
        `The ${tournament.year} Foxglove`;

      memberSeasonSelect.appendChild(option);
    });

    const activeTournament =
      memberSeasonTournaments.find(
        (tournament) =>
          tournament.is_member_lounge_season
      );

    const selectedTournament =
      activeTournament || memberSeasonTournaments[0];

    memberSeasonSelect.value =
      selectedTournament.id;

    setMemberSeasonDescription(
  selectedTournament.member_lounge_description
);
  }

  function updateMemberSeasonDescriptionPreview() {
  const preview = document.querySelector(
    "#member-season-description-preview"
  );

  if (!preview) {
    return;
  }

  preview.textContent =
    memberSeasonDescription.value ||
    "Select a message to preview what members will see.";
}

function setMemberSeasonDescription(description) {
  const savedDescription = description || "";

  const matchingOption = Array.from(
    memberSeasonDescription.options
  ).some((option) => option.value === savedDescription);

  memberSeasonDescription.value =
    matchingOption ? savedDescription : "";

  updateMemberSeasonDescriptionPreview();
}

function updateMemberSeasonDescription() {
  const selectedTournament =
    memberSeasonTournaments.find(
      (tournament) =>
        String(tournament.id) ===
        memberSeasonSelect.value
    );

  setMemberSeasonDescription(
    selectedTournament?.member_lounge_description
  );

  clearMemberSeasonMessage();
}

  async function loadMemberSeasonOptions() {
    const { data, error } =
      await foxgloveSupabase
        .from("tournaments")
        .select(`
          id,
          year,
          is_member_lounge_season,
          member_lounge_description
        `)
        .order("year", { ascending: true });

    if (error) {
      memberSeasonSelect.innerHTML = `
        <option value="">
          Unable to load seasons
        </option>
      `;

      memberSeasonSelect.disabled = true;
      saveMemberSeasonButton.disabled = true;

      showMemberSeasonMessage(
        "Unable to load tournament seasons.",
        true
      );

      return;
    }

    memberSeasonTournaments = data || [];

    populateMemberSeasonSelect();
  }

  async function saveMemberSeason() {
    const selectedTournamentId =
      memberSeasonSelect.value;

    const description =
      memberSeasonDescription.value.trim();

    if (!selectedTournamentId) {
      showMemberSeasonMessage(
        "Select a tournament season.",
        true
      );

      return;
    }

    saveMemberSeasonButton.disabled = true;
    saveMemberSeasonButton.textContent = "Saving...";

    clearMemberSeasonMessage();

    const { error: clearError } =
      await foxgloveSupabase
        .from("tournaments")
        .update({
          is_member_lounge_season: false,
        })
        .eq("is_member_lounge_season", true);

    if (clearError) {
      showMemberSeasonMessage(
        "Unable to update the current season.",
        true
      );

      saveMemberSeasonButton.disabled = false;
      saveMemberSeasonButton.textContent =
        "Save Current Season";

      return;
    }

    const {
  data: savedTournament,
  error: saveError,
} = await foxgloveSupabase
  .from("tournaments")
  .update({
    is_member_lounge_season: true,
    member_lounge_description:
      description || null,
  })
  .eq("id", selectedTournamentId)
  .select(`
    id,
    year,
    is_member_lounge_season,
    member_lounge_description
  `)
  .single();

if (saveError || !savedTournament) {
  console.error(
    "Current season save failed:",
    saveError
  );

  showMemberSeasonMessage(
    "Unable to save the current season. Please try again.",
    true
  );

  saveMemberSeasonButton.disabled = false;
  saveMemberSeasonButton.textContent =
    "Save Current Season";

  return;
}

    memberSeasonTournaments =
      memberSeasonTournaments.map(
        (tournament) => ({
          ...tournament,

          is_member_lounge_season:
            String(tournament.id) ===
            selectedTournamentId,

          member_lounge_description:
            String(tournament.id) ===
            selectedTournamentId
              ? description
              : tournament.member_lounge_description,
        })
      );

    showMemberSeasonMessage(
      "The Member’s Lounge season has been updated."
    );

    await loadGallerySubmissionCount();

    saveMemberSeasonButton.disabled = false;
    saveMemberSeasonButton.textContent =
      "Save Current Season";
  }

  if (
    memberSeasonSelect &&
    memberSeasonDescription &&
    saveMemberSeasonButton
  ) {
    memberSeasonSelect.addEventListener(
  "change",
  updateMemberSeasonDescription
);

memberSeasonDescription.addEventListener(
  "change",
  () => {
    updateMemberSeasonDescriptionPreview();
    clearMemberSeasonMessage();
  }
);

saveMemberSeasonButton.addEventListener(
  "click",
  saveMemberSeason
);

    await loadMemberSeasonOptions();
  }

  /* =====================================
   MEMBER'S LOUNGE MESSAGE
===================================== */

const memberMessageTitle =
  document.querySelector("#member-message-title");

const memberMessageAuthor =
  document.querySelector("#member-message-author");

const memberMessageBody =
  document.querySelector("#member-message-body");

const memberMessagePublished =
  document.querySelector("#member-message-published");

const memberMessageStatus =
  document.querySelector("#member-message-admin-status");

const saveMemberMessageButton =
  document.querySelector("#save-member-message");

const clearMemberMessageButton =
  document.querySelector("#clear-member-message");

let currentMemberMessageId = null;

function showMemberMessageStatus(
  message,
  isError = false
) {
  if (!memberMessageStatus) return;

  memberMessageStatus.textContent = message;
  memberMessageStatus.hidden = false;

  memberMessageStatus.classList.toggle(
    "is-error",
    isError
  );
}

function clearMemberMessageStatus() {
  if (!memberMessageStatus) return;

  memberMessageStatus.hidden = true;
  memberMessageStatus.textContent = "";
  memberMessageStatus.classList.remove("is-error");
}

function resetMemberMessageEditor() {
  currentMemberMessageId = null;

  memberMessageTitle.value = "";
  memberMessageAuthor.value =
    "Tournament Committee";
  memberMessageBody.value = "";
  memberMessagePublished.checked = true;

  clearMemberMessageStatus();
}

async function loadMemberMessage() {

  const { data, error } =
    await foxgloveSupabase
      .from("member_lounge_messages")
      .select("*")
      .order("updated_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) {
    resetMemberMessageEditor();
    return;
  }

  currentMemberMessageId = data.id;

  memberMessageTitle.value =
    data.title;

  memberMessageAuthor.value =
    data.author_name;

  memberMessageBody.value =
    data.message_body;

  memberMessagePublished.checked =
    data.is_published;
}

async function saveMemberMessage() {

  const record = {

    title:
      memberMessageTitle.value.trim(),

    author_name:
      memberMessageAuthor.value.trim(),

    message_body:
      memberMessageBody.value.trim(),

    is_published:
      memberMessagePublished.checked,

    published_at:
      memberMessagePublished.checked
        ? new Date().toISOString()
        : null,

  };

  if (
    !record.title ||
    !record.author_name ||
    !record.message_body
  ) {

    showMemberMessageStatus(
      "All fields are required.",
      true
    );

    return;

  }

  saveMemberMessageButton.disabled = true;
  saveMemberMessageButton.textContent =
    "Saving...";

  clearMemberMessageStatus();

if (record.is_published) {
  const { error: unpublishError } =
    await foxgloveSupabase
      .from("member_lounge_messages")
      .update({
        is_published: false,
      })
      .eq("is_published", true);

  if (unpublishError) {
    console.error(
      "Unable to unpublish the previous message:",
      unpublishError
    );

    showMemberMessageStatus(
      "Unable to replace the currently published message. Please try again.",
      true
    );

    saveMemberMessageButton.disabled = false;
    saveMemberMessageButton.textContent =
      "Save Message";

    return;
  }
}

  let response;

  if (currentMemberMessageId) {

    response =
      await foxgloveSupabase
        .from("member_lounge_messages")
        .update(record)
        .eq("id", currentMemberMessageId)
        .select()
        .single();

  } else {

    response =
      await foxgloveSupabase
        .from("member_lounge_messages")
        .insert(record)
        .select()
        .single();

  }

  if (response.error) {

    console.error(response.error);

    showMemberMessageStatus(
      response.error.message,
      true
    );

  } else {

    currentMemberMessageId =
      response.data.id;

    showMemberMessageStatus(
      "Message saved successfully."
    );

  }

  saveMemberMessageButton.disabled = false;
  saveMemberMessageButton.textContent =
    "Save Message";
}

if (
  memberMessageTitle &&
  memberMessageAuthor &&
  memberMessageBody &&
  saveMemberMessageButton
) {

  saveMemberMessageButton.addEventListener(
    "click",
    saveMemberMessage
  );

  clearMemberMessageButton.addEventListener(
    "click",
    resetMemberMessageEditor
  );

  await loadMemberMessage();

}
  
  const logoutButton = document.querySelector("#logout-button");

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });
})();