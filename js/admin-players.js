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

    /* =====================================
     PLAYER DIRECTORY SELECTORS
  ===================================== */

  const welcomeMessage =
    document.querySelector(
      "#admin-welcome"
    );

  const memberCount =
    document.querySelector(
      "#member-count"
    );

  const rsvpColumnHeading =
    document.querySelector(
      "#rsvp-column-heading"
    );

  const playersMessage =
    document.querySelector(
      "#players-message"
    );

  const tableWrapper =
    document.querySelector(
      "#players-table-wrapper"
    );

  const tableBody =
    document.querySelector(
      "#players-table-body"
    );

  const inviteMemberButton =
    document.querySelector(
      "#add-member-button"
    );

    const inviteMemberPanel =
  document.querySelector(
    "#invite-member-panel"
  );

const inviteMemberForm =
  document.querySelector(
    "#invite-member-form"
  );

const closeInviteMemberButton =
  document.querySelector(
    "#close-invite-member"
  );

const cancelInviteMemberButton =
  document.querySelector(
    "#cancel-invite-member"
  );

const inviteFirstName =
  document.querySelector(
    "#invite-first-name"
  );

const inviteLastName =
  document.querySelector(
    "#invite-last-name"
  );

const inviteEmail =
  document.querySelector(
    "#invite-email"
  );

const inviteRole =
  document.querySelector(
    "#invite-role"
  );

const inviteMemberMessage =
  document.querySelector(
    "#invite-member-message"
  );

const sendMemberInvitationButton =
  document.querySelector(
    "#send-member-invitation"
  );

  let inviteMemberInitialState = "";

  const logoutButton =
    document.querySelector(
      "#logout-button"
    );

  /* =====================================
     MEMBER EDITOR SELECTORS
  ===================================== */

  const memberEditorPanel =
    document.querySelector(
      "#member-editor-panel"
    );

  const memberEditorForm =
    document.querySelector(
      "#member-editor-form"
    );

  const memberEditorTitle =
    document.querySelector(
      "#member-editor-title"
    );

  const memberEditorSeason =
    document.querySelector(
      "#member-editor-season"
    );

  const memberRsvpLabel =
    document.querySelector(
      "#member-rsvp-label"
    );

  const memberEditorMessage =
    document.querySelector(
      "#member-editor-message"
    );

  const closeMemberEditorButton =
    document.querySelector(
      "#close-member-editor"
    );

  const cancelMemberEditorButton =
    document.querySelector(
      "#cancel-member-editor"
    );

  const saveMemberEditorButton =
    document.querySelector(
      "#save-member-editor"
    );

  const memberEditorId =
    document.querySelector(
      "#member-editor-id"
    );

  /* PERSONAL INFORMATION */

  const memberFirstName =
    document.querySelector(
      "#member-first-name"
    );

  const memberLastName =
    document.querySelector(
      "#member-last-name"
    );

  const memberEmail =
    document.querySelector(
      "#member-email"
    );

  const memberPhone =
    document.querySelector(
      "#member-phone"
    );

  /* MAILING ADDRESS */

  const memberAddressLine1 =
    document.querySelector(
      "#member-address-line-1"
    );

  const memberAddressLine2 =
    document.querySelector(
      "#member-address-line-2"
    );

  const memberCity =
    document.querySelector(
      "#member-city"
    );

  const memberState =
    document.querySelector(
      "#member-state"
    );

  const memberPostalCode =
    document.querySelector(
      "#member-postal-code"
    );

  /* TOURNAMENT INFORMATION */

  const memberHandicapIndex =
    document.querySelector(
      "#member-handicap-index"
    );

  const memberJacketSize =
    document.querySelector(
      "#member-jacket-size"
    );

  const memberRsvpStatus =
    document.querySelector(
      "#member-rsvp-status"
    );

  /* ACCOUNT SETTINGS */

  const memberRole =
    document.querySelector(
      "#member-role"
    );

  const memberAccountStatus =
    document.querySelector(
      "#member-account-status"
    );

  const memberLastLogin =
    document.querySelector(
      "#member-last-login"
    );

  /* EDITOR STATE */

  let memberEditorInitialState = "";

  let currentEditingProfile = null;

  let memberEditorMessageTimer = null;

  function showMemberEditorMessage(
  message,
  isError = false
) {
  if (memberEditorMessageTimer) {
    window.clearTimeout(
      memberEditorMessageTimer
    );

    memberEditorMessageTimer = null;
  }

  memberEditorMessage.textContent =
    message;

  memberEditorMessage.hidden = false;

  memberEditorMessage.classList.remove(
    "is-success",
    "is-error",
    "is-fading"
  );

  memberEditorMessage.classList.add(
    isError
      ? "is-error"
      : "is-success"
  );

  if (!isError) {
    memberEditorMessageTimer =
      window.setTimeout(() => {
        memberEditorMessage.classList.add(
          "is-fading"
        );

        window.setTimeout(() => {
          clearMemberEditorMessage();
        }, 220);
      }, 3200);
  }
}

function clearMemberEditorMessage() {
  if (memberEditorMessageTimer) {
    window.clearTimeout(
      memberEditorMessageTimer
    );

    memberEditorMessageTimer = null;
  }

  memberEditorMessage.textContent = "";
  memberEditorMessage.hidden = true;

  memberEditorMessage.classList.remove(
    "is-success",
    "is-error",
    "is-fading"
  );
}

function clearMemberEditorMessage() {
  memberEditorMessage.textContent = "";

  memberEditorMessage.hidden = true;

  memberEditorMessage.classList.remove(
    "is-error"
  );
}

function getMemberEditorState() {
  return JSON.stringify({
    firstName:
      memberFirstName.value,
    lastName:
      memberLastName.value,
    phone:
      memberPhone.value,
    addressLine1:
      memberAddressLine1.value,
    addressLine2:
      memberAddressLine2.value,
    city:
      memberCity.value,
    state:
      memberState.value,
    postalCode:
      memberPostalCode.value,
    handicapIndex:
      memberHandicapIndex.value,
    jacketSize:
      memberJacketSize.value,
      rsvpStatus:
  memberRsvpStatus.value,
    role:
      memberRole.value,
    accountStatus:
      memberAccountStatus.value,
  });
}

function rememberMemberEditorState() {
  memberEditorInitialState =
    getMemberEditorState();

  saveMemberEditorButton.disabled =
    true;
}

function updateMemberEditorSaveState() {
  if (!currentEditingProfile) {
    saveMemberEditorButton.disabled =
      true;

    return;
  }

  saveMemberEditorButton.disabled =
    getMemberEditorState() ===
    memberEditorInitialState;
}

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
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      role,
      account_status,
      jacket_size,
      handicap_index
    `)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

      const {
  data: activeTournament,
  error: activeTournamentError,
} = await foxgloveSupabase
  .from("tournaments")
  .select("id, year")
  .eq("is_member_lounge_season", true)
  .limit(1)
  .maybeSingle();

let activeRsvps = [];

if (
  rsvpColumnHeading &&
  activeTournament?.year
) {
  rsvpColumnHeading.textContent =
    `RSVP — ${activeTournament.year}`;
}

if (
  !activeTournamentError &&
  activeTournament
) {
  const {
    data: rsvpData,
    error: rsvpError,
  } = await foxgloveSupabase
    .from("rsvps")
    .select(
  "profile_id, attendance_status"
)
    .eq(
      "tournament_id",
      activeTournament.id
    );

  if (!rsvpError) {
    activeRsvps = rsvpData || [];
  }
}

const rsvpByProfileId = new Map();

activeRsvps.forEach((response) => {
  if (response.profile_id) {
    rsvpByProfileId.set(
      response.profile_id,
      response.attendance_status
    );
  }
});

function openBasicMemberEditor(profile) {

  currentEditingProfile =
  profile;

clearMemberEditorMessage();

  const fullName =
    `${profile.first_name ?? ""} ${
      profile.last_name ?? ""
    }`.trim();

  memberEditorId.value =
    profile.id;

  memberFirstName.value =
    profile.first_name || "";

  memberLastName.value =
    profile.last_name || "";

  memberEmail.value =
    profile.email || "";

  memberPhone.value =
    profile.phone || "";

    memberAddressLine1.value =
  profile.address_line_1 || "";

memberAddressLine2.value =
  profile.address_line_2 || "";

memberCity.value =
  profile.city || "";

memberState.value =
  profile.state || "";

memberPostalCode.value =
  profile.postal_code || "";

  memberHandicapIndex.value =
  profile.handicap_index === null ||
  profile.handicap_index === undefined
    ? ""
    : Number(
        profile.handicap_index
      ).toFixed(1);

memberJacketSize.value =
  profile.jacket_size || "";

  const currentRsvpStatus =
  profile.id
    ? rsvpByProfileId.get(profile.id)
    : null;

if (currentRsvpStatus === "attending") {
  memberRsvpStatus.value =
    "attending";
} else if (
  currentRsvpStatus === "declined"
) {
  memberRsvpStatus.value =
    "declined";
} else {
  memberRsvpStatus.value =
    "no_response";
}

  memberRole.value =
  profile.role === "admin"
    ? "admin"
    : "member";

    if (
  profile.account_status === "active" ||
  profile.account_status === "invited" ||
  profile.account_status === "inactive"
) {
  memberAccountStatus.value =
    profile.account_status;
} else {
  memberAccountStatus.value =
    "inactive";
}

memberLastLogin.value =
  "Not available";

  memberEditorTitle.textContent =
    fullName || "Edit Member";

    const currentSeasonYear =
  activeTournament?.year;

memberEditorSeason.textContent =
  currentSeasonYear
    ? `Editing member information and ${currentSeasonYear} RSVP status.`
    : "Editing member information.";

memberRsvpLabel.textContent =
  currentSeasonYear
    ? `RSVP Status — ${currentSeasonYear}`
    : "RSVP Status";

  memberEditorPanel.hidden = false;

  rememberMemberEditorState();

  memberEditorPanel.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

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

function createPlayerRow(profile) {
  const row =
    document.createElement("tr");

  const nameCell =
    document.createElement("td");

  const emailCell =
    document.createElement("td");

  const statusCell =
    document.createElement("td");

  const rsvpCell =
    document.createElement("td");

  const jacketSizeCell =
    document.createElement("td");

  const handicapCell =
    document.createElement("td");

  const fullName =
    `${profile.first_name ?? ""} ${
      profile.last_name ?? ""
    }`.trim();

  const memberButton =
    document.createElement("button");

  memberButton.type = "button";

  memberButton.className =
    "member-name-button";

  memberButton.textContent =
    fullName || "Unnamed Member";

  memberButton.addEventListener(
    "click",
    () => {
      openBasicMemberEditor(profile);
    }
  );

  nameCell.appendChild(
    memberButton
  );

  emailCell.textContent =
    profile.email || "No email";

  /* ACCOUNT STATUS */

  const statusBadge =
    document.createElement("span");

  if (
    profile.account_status ===
    "active"
  ) {
    statusBadge.className =
      "admin-status-badge is-active";

    statusBadge.textContent =
      "Active";
  } else if (
    profile.account_status ===
    "invited"
  ) {
    statusBadge.className =
      "admin-status-badge";

    statusBadge.textContent =
      "Invitation Pending";
  } else {
    statusBadge.className =
      "admin-status-badge is-inactive";

    statusBadge.textContent =
      "Inactive";
  }

  statusCell.appendChild(
    statusBadge
  );

  /* CURRENT-SEASON RSVP */

  const memberRsvpStatus =
    rsvpByProfileId.get(
      profile.id
    );

  const rsvpBadge =
    document.createElement("span");

  if (
    memberRsvpStatus ===
    "attending"
  ) {
    rsvpBadge.className =
      "admin-status-badge is-active";

    rsvpBadge.textContent =
      "Attending";
  } else if (
    memberRsvpStatus ===
    "declined"
  ) {
    rsvpBadge.className =
      "admin-status-badge is-inactive";

    rsvpBadge.textContent =
      "Declined";
  } else {
    rsvpBadge.className =
      "admin-status-badge";

    rsvpBadge.textContent =
      "No Response";
  }

  rsvpCell.appendChild(
    rsvpBadge
  );

  /* TOURNAMENT INFORMATION */

  jacketSizeCell.textContent =
    profile.jacket_size ||
    "Not Set";

  handicapCell.textContent =
    profile.handicap_index === null ||
    profile.handicap_index ===
      undefined
      ? "Not Set"
      : Number(
          profile.handicap_index
        ).toFixed(1);

  row.append(
    nameCell,
    emailCell,
    statusCell,
    rsvpCell,
    jacketSizeCell,
    handicapCell
  );

  return row;
}

profiles.forEach((profile) => {
  tableBody.appendChild(
    createPlayerRow(profile)
  );
});

    playersMessage.hidden = true;
    tableWrapper.hidden = false;
  }

 function closeBasicMemberEditor() {
  const hasUnsavedChanges =
    currentEditingProfile &&
    getMemberEditorState() !==
      memberEditorInitialState;

  if (hasUnsavedChanges) {
    const confirmed =
      window.confirm(
        "Discard your unsaved member changes?"
      );

    if (!confirmed) {
      return;
    }
  }

  memberEditorPanel.hidden = true;

  memberEditorForm.reset();

  memberEditorId.value = "";

  memberEditorTitle.textContent =
    "Edit Member";

  currentEditingProfile = null;

  memberEditorInitialState = "";

  clearMemberEditorMessage();

  saveMemberEditorButton.disabled =
    true;
}

async function saveMemberProfile() {
  if (!currentEditingProfile) {
    return;
  }

  const firstName =
  memberFirstName.value.trim();

const lastName =
  memberLastName.value.trim();

if (!firstName) {
  showMemberEditorMessage(
    "First name is required.",
    true
  );

  return;
}

if (!lastName) {
  showMemberEditorMessage(
    "Last name is required.",
    true
  );

  return;
}

const handicapValue =
  memberHandicapIndex.value.trim();

if (
  handicapValue !== "" &&
  Number.isNaN(Number(handicapValue))
) {
  showMemberEditorMessage(
    "Handicap Index must be a valid number.",
    true
  );

  return;
}
  
  showMemberEditorMessage(
    "Saving member information..."
  );

  saveMemberEditorButton.disabled =
    true;

  const accountStatus =
    memberAccountStatus.value;

  const updates = {
    first_name:
  firstName,

    last_name:
  lastName,

    phone:
      memberPhone.value.trim() || null,

    address_line_1:
      memberAddressLine1.value.trim() ||
      null,

    address_line_2:
      memberAddressLine2.value.trim() ||
      null,

    city:
      memberCity.value.trim() || null,

    state:
      memberState.value.trim() || null,

    postal_code:
      memberPostalCode.value.trim() ||
      null,

   handicap_index:
  handicapValue === ""
    ? null
    : Number(handicapValue),

    jacket_size:
      memberJacketSize.value.trim() ||
      null,

    role:
      memberRole.value,

    account_status:
      accountStatus,

    is_active:
      accountStatus === "active",
  };

  const {
    data,
    error,
  } = await foxgloveSupabase
    .from("profiles")
    .update(updates)
    .eq(
      "id",
      memberEditorId.value
    )
    .select()
    .single();

  if (error) {
    console.error(
  "Member save failed:"
);

console.log(
  "Code:",
  error.code
);

console.log(
  "Message:",
  error.message
);

console.log(
  "Details:",
  error.details
);

console.log(
  "Hint:",
  error.hint
);

console.log(
  error
);

    showMemberEditorMessage(
      "Unable to save member information.",
      true
    );

    saveMemberEditorButton.disabled =
      false;

    return;
  }

  Object.assign(
    currentEditingProfile,
    data
  );

  try {
  await saveMemberRsvpStatus();
} catch (rsvpError) {
  console.error(
  "RSVP override failed:"
);

console.log(
  "Code:",
  rsvpError.code
);

console.log(
  "Message:",
  rsvpError.message
);

console.log(
  "Details:",
  rsvpError.details
);

console.log(
  "Hint:",
  rsvpError.hint
);

console.log(
  rsvpError
);

  showMemberEditorMessage(
    "Member information saved, but the RSVP status could not be updated.",
    true
  );

  return;
}

rememberMemberEditorState();

showMemberEditorMessage(
  "Member information and RSVP status saved successfully."
);
}

async function saveMemberRsvpStatus() {
  if (
    !currentEditingProfile ||
    !activeTournament
  ) {
    return;
  }

  const profileId =
    currentEditingProfile.id;

  if (!profileId) {
    return;
  }

  const rsvpStatus =
    memberRsvpStatus.value;

  const existingRsvpStatus =
    rsvpByProfileId.get(profileId);

  if (
    existingRsvpStatus ===
    rsvpStatus
  ) {
    return;
  }

  const rsvpRecord = {
    tournament_id:
      activeTournament.id,

    profile_id:
      profileId,

    member_id:
      profileId,

    first_name:
      memberFirstName.value.trim(),

    last_name:
      memberLastName.value.trim(),

    email:
      currentEditingProfile.email,

    attendance_status:
      rsvpStatus,

    updated_at:
      new Date().toISOString(),
  };

  const {
    data: savedRsvp,
    error: rsvpError,
  } = await foxgloveSupabase
    .from("rsvps")
    .upsert(
      rsvpRecord,
      {
        onConflict:
          "tournament_id,profile_id",
      }
    )
    .select(
      "profile_id, attendance_status"
    )
    .single();

  if (
    rsvpError ||
    !savedRsvp
  ) {
    throw (
      rsvpError ||
      new Error(
        "RSVP update returned no record."
      )
    );
  }

  rsvpByProfileId.set(
    savedRsvp.profile_id,
    savedRsvp.attendance_status
  );
}

memberEditorForm.addEventListener(
  "input",
  updateMemberEditorSaveState
);

memberEditorForm.addEventListener(
  "change",
  updateMemberEditorSaveState
);

memberEditorForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    await saveMemberProfile();
  }
);

function getInviteMemberState() {
  return JSON.stringify({
    firstName:
      inviteFirstName.value,
    lastName:
      inviteLastName.value,
    email:
      inviteEmail.value,
    role:
      inviteRole.value,
  });
}

function rememberInviteMemberState() {
  inviteMemberInitialState =
    getInviteMemberState();
}

function openInviteMemberPanel() {
  memberEditorPanel.hidden = true;

  inviteMemberPanel.hidden = false;

  inviteMemberForm.reset();

  inviteRole.value = "member";

  inviteMemberMessage.hidden = true;
  inviteMemberMessage.textContent = "";

  inviteMemberPanel.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  rememberInviteMemberState();

  inviteFirstName.focus();
}

function closeInviteMemberPanel() {
  const hasUnsavedChanges =
    !inviteMemberPanel.hidden &&
    getInviteMemberState() !==
      inviteMemberInitialState;

  if (hasUnsavedChanges) {
    const confirmed =
      window.confirm(
        "Discard your unsaved invitation information?"
      );

    if (!confirmed) {
      return;
    }
  }

  inviteMemberPanel.hidden = true;

  inviteMemberForm.reset();

  inviteRole.value = "member";

  inviteMemberMessage.hidden = true;
  inviteMemberMessage.textContent = "";

  inviteMemberInitialState = "";
}

async function submitMemberInvitation(
  event
) {
  event.preventDefault();

  const firstName =
    inviteFirstName.value.trim();

  const lastName =
    inviteLastName.value.trim();

  const email =
    inviteEmail.value
      .trim()
      .toLowerCase();

  const role =
    inviteRole.value;

  inviteMemberMessage.hidden = true;
  inviteMemberMessage.textContent = "";

  if (!firstName) {
    inviteMemberMessage.textContent =
      "First name is required.";

    inviteMemberMessage.className =
      "admin-status-message is-error";

    inviteMemberMessage.hidden = false;

    return;
  }

  if (!lastName) {
    inviteMemberMessage.textContent =
      "Last name is required.";

    inviteMemberMessage.className =
      "admin-status-message is-error";

    inviteMemberMessage.hidden = false;

    return;
  }

  if (!email) {
    inviteMemberMessage.textContent =
      "Email address is required.";

    inviteMemberMessage.className =
      "admin-status-message is-error";

    inviteMemberMessage.hidden = false;

    return;
  }

  sendMemberInvitationButton.disabled =
    true;

  sendMemberInvitationButton.textContent =
    "Sending...";

  const {
    data,
    error,
  } = await foxgloveSupabase.functions.invoke(
    "invite-member",
    {
      body: {
        firstName,
        lastName,
        email,
        role,
      },
    }
  );

  sendMemberInvitationButton.disabled =
    false;

  sendMemberInvitationButton.textContent =
    "Send Invitation";

  if (error) {
    let errorMessage =
      "Unable to send the member invitation.";

    if (error.context) {
      try {
        const errorBody =
          await error.context.json();

        if (errorBody?.error) {
          errorMessage =
            errorBody.error;
        }
      } catch {
        // Keep the default message.
      }
    }

    inviteMemberMessage.textContent =
      errorMessage;

    inviteMemberMessage.className =
      "admin-status-message is-error";

    inviteMemberMessage.hidden = false;

    return;
  }

  inviteMemberMessage.textContent =
    data?.message ||
    "Member invitation sent successfully.";

  inviteMemberMessage.className =
    "admin-status-message is-success";

  inviteMemberMessage.hidden = false;

  const invitedMember = {
  id:
    data?.member?.id ||
    null,

  first_name:
    firstName,

  last_name:
    lastName,

  email,

  role,

  account_status:
    "invited",

  is_active:
    false,

  jacket_size:
    null,

  handicap_index:
    null,
};

profiles.push(
  invitedMember
);

tableBody.appendChild(
  createPlayerRow(
    invitedMember
  )
);

memberCount.textContent =
  profiles.length;

inviteMemberInitialState = "";

window.setTimeout(() => {
  closeInviteMemberPanel();
}, 900);
}

inviteMemberButton.disabled = false;

inviteMemberButton.addEventListener(
  "click",
  openInviteMemberPanel
);

closeInviteMemberButton.addEventListener(
  "click",
  closeInviteMemberPanel
);

cancelInviteMemberButton.addEventListener(
  "click",
  closeInviteMemberPanel
);

inviteMemberForm.addEventListener(
  "submit",
  submitMemberInvitation
);

closeMemberEditorButton.addEventListener(
  "click",
  closeBasicMemberEditor
);

cancelMemberEditorButton.addEventListener(
  "click",
  closeBasicMemberEditor
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!inviteMemberPanel.hidden) {
      closeInviteMemberPanel();
      return;
    }

    if (!memberEditorPanel.hidden) {
      closeBasicMemberEditor();
    }
  }
);

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });
})();