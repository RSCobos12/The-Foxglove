(async () => {
  const supabase = window.foxgloveSupabase;

  if (!supabase) {
    window.location.replace("login.html");
    return;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    window.location.replace("login.html");
    return;
  }

  const { data: profile, error: profileError } =
  await supabase
    .from("profiles")
    .select(
      `
        first_name,
        last_name,
        role,
        is_active,
        jacket_size,
        jacket_size_updated_at
      `
    )
    .eq("id", session.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    await supabase.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  const firstName =
    profile.first_name?.trim() || "Member";

  const lastName =
    profile.last_name?.trim() || "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initials = [
    firstName.charAt(0),
    lastName.charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const heroFirstName =
    document.querySelector("#member-first-name");

  const sidebarName =
    document.querySelector("#member-sidebar-name");

  const sidebarInitials =
    document.querySelector("#member-sidebar-initials");

  if (heroFirstName) {
    heroFirstName.textContent = `${firstName}.`;
  }

  if (sidebarName) {
    sidebarName.textContent = fullName;
  }

     if (sidebarInitials) {
    sidebarInitials.textContent = initials || "FG";
  }

  /* =====================================
     JACKET SIZE
  ====================================== */

  const jacketDialog =
  document.querySelector("#member-jacket-dialog");

const openJacketDialogButton =
  document.querySelector(
    "#open-jacket-size-dialog"
  );

const closeJacketDialogButton =
  document.querySelector(
    "#close-jacket-size-dialog"
  );

const cancelJacketSizeButton =
  document.querySelector("#cancel-jacket-size");
  
  const memberJacketSize =
    document.querySelector("#member-jacket-size");

  const memberJacketSizeSelect =
    document.querySelector(
      "#member-jacket-size-select"
    );

  const saveMemberJacketSizeButton =
    document.querySelector(
      "#save-member-jacket-size"
    );

  const memberJacketMessage =
    document.querySelector("#member-jacket-message");

  function showJacketMessage(
    message,
    isError = false
  ) {
    if (!memberJacketMessage) {
      return;
    }

    memberJacketMessage.textContent = message;
    memberJacketMessage.hidden = false;

    memberJacketMessage.classList.toggle(
      "is-error",
      isError
    );
  }

  function clearJacketMessage() {
    if (!memberJacketMessage) {
      return;
    }

    memberJacketMessage.textContent = "";
    memberJacketMessage.hidden = true;
    memberJacketMessage.classList.remove("is-error");
  }

  function displayJacketSize(size) {
    if (memberJacketSize) {
      memberJacketSize.textContent =
        size || "Not Set";
    }

    if (memberJacketSizeSelect) {
      memberJacketSizeSelect.value = size || "";
    }
  }

  displayJacketSize(profile.jacket_size);

  if (
  jacketDialog &&
  openJacketDialogButton
) {
  openJacketDialogButton.addEventListener(
    "click",
    () => {
      clearJacketMessage();

      memberJacketSizeSelect.value =
        profile.jacket_size || "";

      jacketDialog.showModal();
    }
  );
}

function closeJacketDialog() {
  if (jacketDialog?.open) {
    jacketDialog.close();
  }
}

closeJacketDialogButton?.addEventListener(
  "click",
  closeJacketDialog
);

cancelJacketSizeButton?.addEventListener(
  "click",
  closeJacketDialog
);

jacketDialog?.addEventListener(
  "click",
  (event) => {
    if (event.target === jacketDialog) {
      closeJacketDialog();
    }
  }
);

  if (
    memberJacketSizeSelect &&
    saveMemberJacketSizeButton
  ) {
    memberJacketSizeSelect.addEventListener(
      "change",
      clearJacketMessage
    );

    saveMemberJacketSizeButton.addEventListener(
      "click",
      async () => {
        const selectedSize =
          memberJacketSizeSelect.value;

        if (!selectedSize) {
          showJacketMessage(
            "Please select a jacket size.",
            true
          );

          return;
        }

        saveMemberJacketSizeButton.disabled = true;
        saveMemberJacketSizeButton.textContent =
          "Saving...";

        clearJacketMessage();

        const { error: jacketSizeError } =
          await supabase.rpc(
            "update_my_jacket_size",
            {
              p_jacket_size: selectedSize,
            }
          );

        if (jacketSizeError) {
          console.error(
            "Jacket size update failed:",
            jacketSizeError
          );

          showJacketMessage(
            "Unable to update your jacket size.",
            true
          );

          saveMemberJacketSizeButton.disabled = false;
          saveMemberJacketSizeButton.textContent =
            "Update Size";

          return;
        }

        profile.jacket_size = selectedSize;

displayJacketSize(selectedSize);

showJacketMessage(
  "Your jacket size has been updated."
);

window.setTimeout(() => {
  closeJacketDialog();
}, 800);

        saveMemberJacketSizeButton.disabled = false;
        saveMemberJacketSizeButton.textContent =
          "Update Size";
      }
    );
  }

  /* =====================================
     CURRENT SEASON
  ====================================== */

  const memberSeasonTitle =
    document.querySelector("#member-season-title");

    const memberGallerySeasonYear =
  document.querySelector(
    "#member-gallery-season-year"
  );

  const memberSeasonDescription =
    document.querySelector(
      "#member-season-description"
    );

  const {
    data: currentSeason,
    error: currentSeasonError,
  } = await supabase
    .from("tournaments")
    .select(`
      year,
      member_lounge_description
    `)
    .eq("is_member_lounge_season", true)
    .limit(1)
    .maybeSingle();

  if (
    !currentSeasonError &&
    currentSeason &&
    memberSeasonTitle &&
    memberSeasonDescription
  ) {
    memberSeasonTitle.textContent =
      `The ${currentSeason.year} Foxglove`;

    memberSeasonDescription.textContent =
      currentSeason.member_lounge_description ||
      "Planning for the next Foxglove gathering is underway.";

      if (memberGallerySeasonYear) {
  memberGallerySeasonYear.textContent =
    currentSeason.year;
}

  } else if (
    memberSeasonTitle &&
    memberSeasonDescription
  ) {
    memberSeasonTitle.textContent =
      "The Foxglove";

    memberSeasonDescription.textContent =
      "Current season information is being prepared.";
  }

  /* =====================================
   LIVE WEATHER
====================================== */

const localWeatherLocation =
  document.querySelector(
    "#member-local-weather-location"
  );

const localWeatherIcon =
  document.querySelector(
    "#member-local-weather-icon"
  );

const localWeatherTemperature =
  document.querySelector(
    "#member-local-weather-temperature"
  );

const localWeatherCondition =
  document.querySelector(
    "#member-local-weather-condition"
  );

const montereyWeatherIcon =
  document.querySelector(
    "#member-monterey-weather-icon"
  );

const montereyWeatherTemperature =
  document.querySelector(
    "#member-monterey-weather-temperature"
  );

const montereyWeatherCondition =
  document.querySelector(
    "#member-monterey-weather-condition"
  );

function getWeatherPresentation(
  weatherCode,
  isDay = true
) {
  const presentations = {
    0: {
      condition: "Clear",
      icon: isDay ? "☀" : "☾",
    },

    1: {
      condition: "Mostly Clear",
      icon: isDay ? "🌤" : "☾",
    },

    2: {
      condition: "Partly Cloudy",
      icon: "⛅",
    },

    3: {
      condition: "Cloudy",
      icon: "☁",
    },

    45: {
      condition: "Foggy",
      icon: "☁",
    },

    48: {
      condition: "Foggy",
      icon: "☁",
    },

    51: {
      condition: "Light Drizzle",
      icon: "🌦",
    },

    53: {
      condition: "Drizzle",
      icon: "🌦",
    },

    55: {
      condition: "Heavy Drizzle",
      icon: "🌧",
    },

    56: {
      condition: "Freezing Drizzle",
      icon: "🌧",
    },

    57: {
      condition: "Freezing Drizzle",
      icon: "🌧",
    },

    61: {
      condition: "Light Rain",
      icon: "🌦",
    },

    63: {
      condition: "Rain",
      icon: "🌧",
    },

    65: {
      condition: "Heavy Rain",
      icon: "🌧",
    },

    66: {
      condition: "Freezing Rain",
      icon: "🌧",
    },

    67: {
      condition: "Freezing Rain",
      icon: "🌧",
    },

    71: {
      condition: "Light Snow",
      icon: "❄",
    },

    73: {
      condition: "Snow",
      icon: "❄",
    },

    75: {
      condition: "Heavy Snow",
      icon: "❄",
    },

    77: {
      condition: "Snow Grains",
      icon: "❄",
    },

    80: {
      condition: "Light Showers",
      icon: "🌦",
    },

    81: {
      condition: "Rain Showers",
      icon: "🌧",
    },

    82: {
      condition: "Heavy Showers",
      icon: "🌧",
    },

    85: {
      condition: "Snow Showers",
      icon: "❄",
    },

    86: {
      condition: "Heavy Snow Showers",
      icon: "❄",
    },

    95: {
      condition: "Thunderstorms",
      icon: "⛈",
    },

    96: {
      condition: "Thunderstorms",
      icon: "⛈",
    },

    99: {
      condition: "Severe Thunderstorms",
      icon: "⛈",
    },
  };

  return (
    presentations[weatherCode] || {
      condition: "Current Conditions",
      icon: "—",
    }
  );
}

async function fetchCurrentWeather(
  latitude,
  longitude
) {
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    "&current=temperature_2m,weather_code,is_day" +
    "&temperature_unit=fahrenheit" +
    "&timezone=auto";

  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error(
      `Weather request failed: ${response.status}`
    );
  }

  const weatherData = await response.json();

  if (!weatherData.current) {
    throw new Error(
      "Current weather data was unavailable."
    );
  }

  return weatherData.current;
}

function displayLocalWeather(weather) {
  const presentation =
    getWeatherPresentation(
      weather.weather_code,
      Boolean(weather.is_day)
    );

  if (localWeatherLocation) {
    localWeatherLocation.textContent =
      "Your Local Weather";
  }

  if (localWeatherIcon) {
    localWeatherIcon.textContent =
      presentation.icon;
  }

  if (localWeatherTemperature) {
    localWeatherTemperature.textContent =
      `${Math.round(weather.temperature_2m)}°F`;
  }

  if (localWeatherCondition) {
    localWeatherCondition.textContent =
      presentation.condition;
  }
}

function displayMontereyWeather(weather) {
  const presentation =
    getWeatherPresentation(
      weather.weather_code,
      Boolean(weather.is_day)
    );

  if (montereyWeatherIcon) {
    montereyWeatherIcon.textContent =
      presentation.icon;
  }

  if (montereyWeatherTemperature) {
    montereyWeatherTemperature.textContent =
      `${Math.round(weather.temperature_2m)}°F`;
  }

  if (montereyWeatherCondition) {
    montereyWeatherCondition.textContent =
      presentation.condition;
  }
}

function displayLocalWeatherUnavailable(
  message
) {
  if (localWeatherLocation) {
    localWeatherLocation.textContent =
      "Local Weather";
  }

  if (localWeatherIcon) {
    localWeatherIcon.textContent = "—";
  }

  if (localWeatherTemperature) {
    localWeatherTemperature.textContent =
      "--°F";
  }

  if (localWeatherCondition) {
    localWeatherCondition.textContent =
      message;
  }
}

async function loadMontereyWeather() {
  try {
    const montereyWeather =
      await fetchCurrentWeather(
        36.6002,
        -121.8947
      );

    displayMontereyWeather(
      montereyWeather
    );
  } catch (error) {
    console.error(
      "Unable to load Monterey weather:",
      error
    );

    if (montereyWeatherIcon) {
      montereyWeatherIcon.textContent = "—";
    }

    if (montereyWeatherTemperature) {
      montereyWeatherTemperature.textContent =
        "--°F";
    }

    if (montereyWeatherCondition) {
      montereyWeatherCondition.textContent =
        "Weather currently unavailable";
    }
  }
}

function loadLocalWeather() {
  if (!navigator.geolocation) {
    displayLocalWeatherUnavailable(
      "Location is not supported by this browser"
    );

    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const localWeather =
          await fetchCurrentWeather(
            position.coords.latitude,
            position.coords.longitude
          );

        displayLocalWeather(localWeather);
      } catch (error) {
        console.error(
          "Unable to load local weather:",
          error
        );

        displayLocalWeatherUnavailable(
          "Weather currently unavailable"
        );
      }
    },

    (error) => {
      console.warn(
        "Location access was unavailable:",
        error
      );

      displayLocalWeatherUnavailable(
        "Enable location access to view weather"
      );
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 900000,
    }
  );
}

await Promise.all([
  loadMontereyWeather(),
  loadLocalWeather(),
]);

  /* =====================================
   MEMBER RSVP STATUS
====================================== */

const memberRsvpIcon =
  document.querySelector("#member-rsvp-icon");

const memberRsvpStatus =
  document.querySelector("#member-rsvp-status");

const memberRsvpDescription =
  document.querySelector(
    "#member-rsvp-description"
  );

const memberRsvpLink =
  document.querySelector("#member-rsvp-link");

function formatRsvpDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function displayAwaitingRsvp() {
  if (memberRsvpIcon) {
    memberRsvpIcon.textContent = "?";
  }

  if (memberRsvpStatus) {
    memberRsvpStatus.textContent =
      "Awaiting Response";
  }

  if (memberRsvpDescription) {
    memberRsvpDescription.textContent =
      "We have not yet received your RSVP for the current season.";
  }

  if (memberRsvpLink) {
    memberRsvpLink.textContent = "Respond";

    const arrow =
      document.createElement("span");

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    arrow.textContent = "›";

    memberRsvpLink.appendChild(arrow);
  }
}

function displayAttendingRsvp(rsvp) {
  if (memberRsvpIcon) {
    memberRsvpIcon.textContent = "✓";
  }

  if (memberRsvpStatus) {
    memberRsvpStatus.textContent =
      "Confirmed Attending";
  }

  if (memberRsvpDescription) {
    const submittedDate =
      formatRsvpDate(
        rsvp.updated_at
      );

    memberRsvpDescription.textContent =
      submittedDate
        ? `Your RSVP was received on ${submittedDate}.`
        : "Your RSVP has been received. We look forward to having you with us.";
  }

  if (memberRsvpLink) {
    memberRsvpLink.textContent =
      "View RSVP";

    const arrow =
      document.createElement("span");

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    arrow.textContent = "›";

    memberRsvpLink.appendChild(arrow);
  }
}

function displayDeclinedRsvp(rsvp) {
  if (memberRsvpIcon) {
    memberRsvpIcon.textContent = "×";
  }

  if (memberRsvpStatus) {
    memberRsvpStatus.textContent =
      "Unable to Attend";
  }

  if (memberRsvpDescription) {
    const submittedDate =
      formatRsvpDate(
        rsvp.updated_at
      );

    memberRsvpDescription.textContent =
      submittedDate
        ? `Your RSVP was received on ${submittedDate}.`
        : "Your RSVP has been received.";
  }

  if (memberRsvpLink) {
    memberRsvpLink.textContent =
      "Update RSVP";

    const arrow =
      document.createElement("span");

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    arrow.textContent = "›";

    memberRsvpLink.appendChild(arrow);
  }
}

async function loadMemberRsvpStatus() {
  const {
    data: activeTournament,
    error: tournamentError,
  } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_member_lounge_season", true)
    .limit(1)
    .maybeSingle();

  if (
    tournamentError ||
    !activeTournament
  ) {
    if (tournamentError) {
      console.error(
        "Unable to load active tournament:",
        tournamentError
      );
    }

    displayAwaitingRsvp();
    return;
  }

  const {
    data: memberRsvp,
    error: rsvpError,
  } = await supabase
    .from("rsvps")
    .select(`
      id,
      attendance_status,
      updated_at
    `)
    .eq("member_id", session.user.id)
    .eq("tournament_id", activeTournament.id)
    .order("updated_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (rsvpError) {
    console.error(
      "Unable to load member RSVP:",
      rsvpError
    );

    displayAwaitingRsvp();
    return;
  }

  if (!memberRsvp) {
    displayAwaitingRsvp();
    return;
  }

  const status =
    memberRsvp.attendance_status
      ?.trim()
      .toLowerCase();

  if (
    status === "attending" ||
    status === "confirmed" ||
    status === "yes"
  ) {
    displayAttendingRsvp(memberRsvp);
    return;
  }

  if (
    status === "declined" ||
    status === "not attending" ||
    status === "no"
  ) {
    displayDeclinedRsvp(memberRsvp);
    return;
  }

  displayAwaitingRsvp();
}

await loadMemberRsvpStatus();

  /* =====================================
   MESSAGE FROM THE COMMITTEE
====================================== */

const memberMessageCardTitle =
  document.querySelector(
    "#member-message-card-title"
  );

const memberMessageCardPreview =
  document.querySelector(
    "#member-message-card-preview"
  );

const memberMessageDialog =
  document.querySelector(
    "#member-message-dialog"
  );

const openMemberMessageButton =
  document.querySelector(
    "#open-member-message-dialog"
  );

const closeMemberMessageButton =
  document.querySelector(
    "#close-member-message-dialog"
  );

const memberMessageDialogTitle =
  document.querySelector(
    "#member-message-dialog-title"
  );

const memberMessageDialogBody =
  document.querySelector(
    "#member-message-dialog-body"
  );

const memberMessageDialogAuthor =
  document.querySelector(
    "#member-message-dialog-author"
  );

const memberMessageDialogDate =
  document.querySelector(
    "#member-message-dialog-date"
  );

let activeMemberMessage = null;

function createMessagePreview(message) {
  const normalized =
    message.replace(/\s+/g, " ").trim();

  const maximumLength = 300;

  if (normalized.length <= maximumLength) {
    return normalized;
  }

  return `${normalized
    .slice(0, maximumLength - 3)
    .trim()}...`;
}

function closeMemberMessageDialog() {
  if (memberMessageDialog?.open) {
    memberMessageDialog.close();
  }
}

function displayMemberMessage(message) {
  activeMemberMessage = message;

  if (memberMessageCardTitle) {
    memberMessageCardTitle.textContent =
      message.title;
  }

  if (memberMessageCardPreview) {
    memberMessageCardPreview.textContent =
      createMessagePreview(
        message.message_body
      );
  }

  if (memberMessageDialogTitle) {
    memberMessageDialogTitle.textContent =
      message.title;
  }

  if (memberMessageDialogBody) {
    memberMessageDialogBody.textContent =
      message.message_body;
  }

  if (memberMessageDialogAuthor) {
    memberMessageDialogAuthor.textContent =
      message.author_name ||
      "Tournament Committee";
  }

  if (
    memberMessageDialogDate &&
    message.published_at
  ) {
    const publishedDate =
      new Date(message.published_at);

    memberMessageDialogDate.dateTime =
      publishedDate.toISOString();

    memberMessageDialogDate.textContent =
      publishedDate.toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );
  }
}

async function loadMemberMessage() {
  const { data, error } =
    await supabase
      .from("member_lounge_messages")
      .select(`
        id,
        title,
        message_body,
        author_name,
        published_at
      `)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(
      "Unable to load committee message:",
      error
    );

    return;
  }

  if (data) {
    displayMemberMessage(data);
  }
}

openMemberMessageButton?.addEventListener(
  "click",
  () => {
    if (
      activeMemberMessage &&
      memberMessageDialog
    ) {
      memberMessageDialog.showModal();
    }
  }
);

closeMemberMessageButton?.addEventListener(
  "click",
  closeMemberMessageDialog
);

memberMessageDialog?.addEventListener(
  "click",
  (event) => {
    if (event.target === memberMessageDialog) {
      closeMemberMessageDialog();
    }
  }
);

await loadMemberMessage();

/* =====================================
   PLAYER DIRECTORY
===================================== */

const memberDirectoryDialog =
  document.querySelector(
    "#member-directory-dialog"
  );

const openMemberDirectoryButton =
  document.querySelector(
    "#open-member-directory"
  );

const closeMemberDirectoryButton =
  document.querySelector(
    "#close-member-directory"
  );

const memberDirectoryList =
  document.querySelector(
    "#member-directory-list"
  );

const memberDirectoryMessage =
  document.querySelector(
    "#member-directory-message"
  );

let memberDirectoryLoaded = false;

function closeMemberDirectory() {
  if (memberDirectoryDialog?.open) {
    memberDirectoryDialog.close();
  }
}

function showMemberDirectoryMessage(
  message,
  isError = false
) {
  if (!memberDirectoryMessage) {
    return;
  }

  memberDirectoryMessage.textContent =
    message;

  memberDirectoryMessage.hidden = false;

  memberDirectoryMessage.classList.toggle(
    "is-error",
    isError
  );
}

function clearMemberDirectoryMessage() {
  if (!memberDirectoryMessage) {
    return;
  }

  memberDirectoryMessage.textContent = "";
  memberDirectoryMessage.hidden = true;

  memberDirectoryMessage.classList.remove(
    "is-error"
  );
}

function formatDirectoryHandicap(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not Set";
  }

  const numericValue =
    Number(value);

  if (!Number.isFinite(numericValue)) {
    return "Not Set";
  }

  return numericValue.toFixed(1);
}

function createMemberDirectoryRow(
  player
) {
  const row =
    document.createElement("div");

  row.className =
    "member-directory-row";

  const playerName =
    document.createElement("strong");

  const fullName =
    `${player.first_name || ""} ${
      player.last_name || ""
    }`.trim();

  playerName.textContent =
    fullName || "Foxglove Member";

  const handicapArea =
    document.createElement("div");

  handicapArea.className =
    "member-directory-handicap";

  const handicapLabel =
    document.createElement("span");

  handicapLabel.textContent =
    "Handicap Index";

  const handicapValue =
    document.createElement("strong");

  handicapValue.textContent =
    formatDirectoryHandicap(
      player.handicap_index
    );

  handicapArea.append(
    handicapLabel,
    handicapValue
  );

  row.append(
    playerName,
    handicapArea
  );

  return row;
}

async function loadMemberDirectory() {
  if (
    !memberDirectoryList ||
    memberDirectoryLoaded
  ) {
    return;
  }

  showMemberDirectoryMessage(
    "Loading Player Directory..."
  );

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_member_directory"
  );

  if (error) {
    console.error(
      "Unable to load Player Directory:",
      error
    );

    showMemberDirectoryMessage(
      "Unable to load the Player Directory.",
      true
    );

    return;
  }

  const players =
    Array.isArray(data)
      ? data
      : [];

  memberDirectoryList.innerHTML = "";

  if (players.length === 0) {
    showMemberDirectoryMessage(
      "No active players are currently listed."
    );

    return;
  }

  players.forEach((player) => {
    memberDirectoryList.append(
      createMemberDirectoryRow(player)
    );
  });

  memberDirectoryLoaded = true;
  clearMemberDirectoryMessage();
}

openMemberDirectoryButton?.addEventListener(
  "click",
  async () => {
    if (!memberDirectoryDialog) {
      return;
    }

    memberDirectoryDialog.showModal();

    await loadMemberDirectory();
  }
);

closeMemberDirectoryButton?.addEventListener(
  "click",
  closeMemberDirectory
);

memberDirectoryDialog?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      memberDirectoryDialog
    ) {
      closeMemberDirectory();
    }
  }
);

async function openMemberDirectoryFromHash() {
  if (
    window.location.hash !==
    "#member-directory"
  ) {
    return;
  }

  if (!memberDirectoryDialog) {
    return;
  }

  memberDirectoryDialog.showModal();

  await loadMemberDirectory();

  history.replaceState(
    null,
    "",
    window.location.pathname +
      window.location.search
  );
}

await openMemberDirectoryFromHash();

/* =====================================
   GALLERY UPLOAD
===================================== */

const galleryInput =
  document.querySelector(
    "#member-gallery-file-input"
  );

const galleryUploadButton =
  document.querySelector(
    "#member-gallery-upload-button"
  );

const galleryUploadStatus =
  document.querySelector(
    "#member-gallery-upload-status"
  );

const uploadSlots = Array.from(
  document.querySelectorAll(
    ".member-upload-slot"
  )
);

const selectedGalleryFiles =
  new Array(5).fill(null);

let activeUploadSlot = 0;

function showGalleryUploadStatus(
  message,
  isError = false
) {
  if (!galleryUploadStatus) {
    return;
  }

  galleryUploadStatus.textContent = message;
  galleryUploadStatus.hidden = false;

  galleryUploadStatus.classList.toggle(
    "is-error",
    isError
  );
}

function clearGalleryUploadStatus() {
  if (!galleryUploadStatus) {
    return;
  }

  galleryUploadStatus.textContent = "";
  galleryUploadStatus.hidden = true;
  galleryUploadStatus.classList.remove("is-error");
}

function updateGalleryUploadButton() {
  if (!galleryUploadButton) {
    return;
  }

  const selectedCount =
    selectedGalleryFiles.filter(Boolean).length;

  galleryUploadButton.disabled =
    selectedCount === 0;

  galleryUploadButton.textContent =
    selectedCount === 1
      ? "Upload 1 Photo"
      : `Upload ${selectedCount} Photos`;
}

function clearGallerySlot(slotIndex) {
  const slot = uploadSlots[slotIndex];

  if (!slot) {
    return;
  }

  const selectedFile =
    selectedGalleryFiles[slotIndex];

  if (selectedFile?.previewUrl) {
    URL.revokeObjectURL(
      selectedFile.previewUrl
    );
  }

  selectedGalleryFiles[slotIndex] = null;

  const preview =
    slot.querySelector(
      ".member-upload-preview"
    );

  const placeholder =
    slot.querySelector(
      ".member-upload-slot-placeholder"
    );

  const label =
    slot.querySelector(
      ".member-upload-slot-label"
    );

  const help =
    slot.querySelector(
      ".member-upload-slot-help"
    );

  const remove =
    slot.querySelector(
      ".member-upload-remove"
    );

  if (preview) {
    preview.removeAttribute("src");
    preview.alt = "";
    preview.hidden = true;
  }

  if (placeholder) {
    placeholder.hidden = false;
  }

  if (label) {
    label.hidden = false;
  }

  if (help) {
    help.hidden = false;
  }

  if (remove) {
    remove.hidden = true;
  }

  slot.classList.remove(
    "has-selected-file"
  );

  slot.setAttribute(
    "aria-label",
    `Select photo ${slotIndex + 1}`
  );

  updateGalleryUploadButton();
  clearGalleryUploadStatus();
}

function displayGalleryPreview(
  slotIndex,
  file
) {
  const slot = uploadSlots[slotIndex];

  if (!slot) {
    return;
  }

  clearGallerySlot(slotIndex);

  const previewUrl =
    URL.createObjectURL(file);

  selectedGalleryFiles[slotIndex] = {
    file,
    previewUrl,
  };

  const preview =
    slot.querySelector(
      ".member-upload-preview"
    );

  const placeholder =
    slot.querySelector(
      ".member-upload-slot-placeholder"
    );

  const label =
    slot.querySelector(
      ".member-upload-slot-label"
    );

  const help =
    slot.querySelector(
      ".member-upload-slot-help"
    );

  const remove =
    slot.querySelector(
      ".member-upload-remove"
    );

  if (preview) {
    preview.src = previewUrl;
    preview.alt =
      `Selected photo ${slotIndex + 1}: ${file.name}`;
    preview.hidden = false;
  }

  if (placeholder) {
    placeholder.hidden = true;
  }

  if (label) {
    label.hidden = true;
  }

  if (help) {
    help.hidden = true;
  }

  if (remove) {
    remove.hidden = false;
  }

  slot.classList.add(
    "has-selected-file"
  );

  slot.setAttribute(
    "aria-label",
    `Replace selected photo ${slotIndex + 1}`
  );

  updateGalleryUploadButton();
  clearGalleryUploadStatus();
}

function validateGalleryFile(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const maximumFileSize =
    10 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG and WebP images are allowed.";
  }

  if (file.size > maximumFileSize) {
    return `${file.name} is larger than 10 MB.`;
  }

  return "";
}

function addGalleryFiles(
  files,
  startingSlot = 0
) {
  const fileList =
    Array.from(files || []);

  if (fileList.length === 0) {
    return;
  }

  let nextSlot = startingSlot;

  for (const file of fileList) {
    const validationError =
      validateGalleryFile(file);

    if (validationError) {
      showGalleryUploadStatus(
        validationError,
        true
      );

      continue;
    }

    while (
      nextSlot < selectedGalleryFiles.length &&
      selectedGalleryFiles[nextSlot]
    ) {
      nextSlot += 1;
    }

    if (
      nextSlot >=
      selectedGalleryFiles.length
    ) {
      showGalleryUploadStatus(
        "You may select up to five photos.",
        true
      );

      break;
    }

    displayGalleryPreview(
      nextSlot,
      file
    );

    nextSlot += 1;
  }

  updateGalleryUploadButton();
}

uploadSlots.forEach(
  (slot, slotIndex) => {
    slot.addEventListener(
      "click",
      (event) => {
        const removeButton =
          event.target.closest(
            ".member-upload-remove"
          );

        if (removeButton) {
          event.preventDefault();
          event.stopPropagation();

          clearGallerySlot(slotIndex);
          return;
        }

        activeUploadSlot = slotIndex;

        if (galleryInput) {
          galleryInput.value = "";
          galleryInput.click();
        }
      }
    );

    slot.addEventListener(
      "dragover",
      (event) => {
        event.preventDefault();

        slot.classList.add(
          "is-dragging"
        );
      }
    );

    slot.addEventListener(
      "dragleave",
      () => {
        slot.classList.remove(
          "is-dragging"
        );
      }
    );

    slot.addEventListener(
      "drop",
      (event) => {
        event.preventDefault();

        slot.classList.remove(
          "is-dragging"
        );

        addGalleryFiles(
          event.dataTransfer.files,
          slotIndex
        );
      }
    );
  }
);

galleryInput?.addEventListener(
  "change",
  () => {
    addGalleryFiles(
      galleryInput.files,
      activeUploadSlot
    );

    galleryInput.value = "";
  }
);

updateGalleryUploadButton();

function getGalleryFileExtension(file) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (extension === "jpeg") {
    return "jpg";
  }

  if (
    extension === "jpg" ||
    extension === "png" ||
    extension === "webp"
  ) {
    return extension;
  }

  return "jpg";
}

function createGalleryStoragePath(
  tournamentYear,
  file
) {
  const extension =
    getGalleryFileExtension(file);

  return (
    `${tournamentYear}/member-submissions/` +
    `${session.user.id}/` +
    `${crypto.randomUUID()}.${extension}`
  );
}

async function removeGalleryStorageFile(
  storagePath
) {
  if (!storagePath) {
    return;
  }

  const { error } =
    await supabase.storage
      .from("gallery-images")
      .remove([storagePath]);

  if (error) {
    console.error(
      "Unable to remove Gallery upload:",
      error
    );
  }
}

async function loadActiveGalleryTournament() {
  const { data, error } =
    await supabase
      .from("tournaments")
      .select("id, year")
      .eq("is_member_lounge_season", true)
      .limit(1)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load the current tournament: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      "No current tournament season has been selected."
    );
  }

  return data;
}

async function createGalleryFileHash(file) {
  if (!window.crypto?.subtle) {
    throw new Error(
      "Your browser cannot verify duplicate photos."
    );
  }

  const fileBuffer =
    await file.arrayBuffer();

  const hashBuffer =
    await window.crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

async function uploadMemberGalleryFile(
  selectedFile,
  tournament
) {
  const file =
    selectedFile.file;

  const fileHash =
    await createGalleryFileHash(file);

  const {
    data: existingSubmission,
    error: duplicateCheckError,
  } = await supabase
    .from("gallery_images")
    .select("id, submission_status")
    .eq("tournament_id", tournament.id)
    .eq(
      "uploaded_by_profile_id",
      session.user.id
    )
    .eq("file_hash", fileHash)
    .in(
      "submission_status",
      ["pending", "approved"]
    )
    .limit(1)
    .maybeSingle();

  if (duplicateCheckError) {
    throw new Error(
      `${file.name}: unable to verify whether this photo was already submitted.`
    );
  }

  if (existingSubmission) {
    return {
      skipped: true,
      duplicate: true,
      filename: file.name,
    };
  }

  const storagePath =
    createGalleryStoragePath(
      tournament.year,
      file
    );

  const { error: storageError } =
    await supabase.storage
      .from("gallery-images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

  if (storageError) {
    throw new Error(
      `${file.name}: ${storageError.message}`
    );
  }

  const filenameWithoutExtension =
    file.name.replace(/\.[^/.]+$/, "");

  const { error: databaseError } =
    await supabase
      .from("gallery_images")
      .insert({
        tournament_id: tournament.id,

        uploaded_by_profile_id:
          session.user.id,

        reviewed_by_profile_id: null,

        storage_path: storagePath,

        file_hash: fileHash,

        position: null,

        is_featured: false,

        submission_status: "pending",

        alt_text:
          filenameWithoutExtension ||
          `${tournament.year} Foxglove member submission`,

        is_active: true,

        reviewed_at: null,
      });

  if (databaseError) {
    await removeGalleryStorageFile(
      storagePath
    );

    if (
      databaseError.code === "23505"
    ) {
      return {
        skipped: true,
        duplicate: true,
        filename: file.name,
      };
    }

    throw new Error(
      `${file.name}: ${databaseError.message}`
    );
  }

  return {
    skipped: false,
    duplicate: false,
    storagePath,
    filename: file.name,
  };
}

function setGalleryControlsDisabled(
  isDisabled
) {
  uploadSlots.forEach((slot) => {
    slot.disabled = isDisabled;
  });

  if (galleryInput) {
    galleryInput.disabled = isDisabled;
  }

  if (galleryUploadButton) {
    galleryUploadButton.disabled =
      isDisabled ||
      !selectedGalleryFiles.some(Boolean);
  }
}

function clearAllGallerySlots() {
  selectedGalleryFiles.forEach(
    (_, slotIndex) => {
      clearGallerySlot(slotIndex);
    }
  );

  activeUploadSlot = 0;

  if (galleryInput) {
    galleryInput.value = "";
  }

  updateGalleryUploadButton();
}

async function submitGalleryUploads() {
  const filesToUpload =
    selectedGalleryFiles.filter(Boolean);

  if (filesToUpload.length === 0) {
    showGalleryUploadStatus(
      "Select at least one photo before uploading.",
      true
    );

    return;
  }

  setGalleryControlsDisabled(true);

  if (galleryUploadButton) {
    galleryUploadButton.textContent =
      `Checking 0 of ${filesToUpload.length}...`;
  }

  clearGalleryUploadStatus();

  const uploadedFiles = [];
  const duplicateFiles = [];

  try {
    const activeTournament =
      await loadActiveGalleryTournament();

    for (
      let index = 0;
      index < filesToUpload.length;
      index += 1
    ) {
      if (galleryUploadButton) {
        galleryUploadButton.textContent =
          `Processing ${index + 1} of ${filesToUpload.length}...`;
      }

      showGalleryUploadStatus(
        `Checking photo ${index + 1} of ${filesToUpload.length}...`
      );

      const result =
        await uploadMemberGalleryFile(
          filesToUpload[index],
          activeTournament
        );

      if (result.duplicate) {
        duplicateFiles.push(
          result.filename
        );
      } else {
        uploadedFiles.push(result);
      }
    }

    clearAllGallerySlots();

    if (
      uploadedFiles.length > 0 &&
      duplicateFiles.length === 0
    ) {
      showGalleryUploadStatus(
        uploadedFiles.length === 1
          ? "Your photo was submitted for Gallery approval."
          : `${uploadedFiles.length} photos were submitted for Gallery approval.`
      );

      return;
    }

    if (
      uploadedFiles.length === 0 &&
      duplicateFiles.length > 0
    ) {
      showGalleryUploadStatus(
        duplicateFiles.length === 1
          ? "That photo has already been submitted."
          : `${duplicateFiles.length} selected photos have already been submitted.`,
        true
      );

      return;
    }

    showGalleryUploadStatus(
      `${uploadedFiles.length} ${
        uploadedFiles.length === 1
          ? "photo was"
          : "photos were"
      } submitted. ${
        duplicateFiles.length
      } ${
        duplicateFiles.length === 1
          ? "duplicate was"
          : "duplicates were"
      } skipped.`
    );
  } catch (error) {
    console.error(
      "Gallery submission failed:",
      error
    );

    showGalleryUploadStatus(
      error?.message ||
      "Unable to submit your Gallery photos.",
      true
    );
  } finally {
    setGalleryControlsDisabled(false);
    updateGalleryUploadButton();
  }
}

galleryUploadButton?.addEventListener(
  "click",
  submitGalleryUploads
);

  /* =====================================
     CONCIERGE RECOMMENDATION
  ====================================== */

  const conciergeImage =
    document.querySelector("#member-concierge-image");

  const conciergeName =
    document.querySelector("#member-concierge-name");

  const conciergeHeadline =
    document.querySelector(
      "#member-concierge-headline"
    );

  const conciergeDescription =
    document.querySelector(
      "#member-concierge-description"
    );

  const conciergeActions =
    document.querySelector(
      "#member-concierge-actions"
    );

  const conciergeWebsite =
    document.querySelector(
      "#member-concierge-website"
    );

  const conciergeMap =
    document.querySelector("#member-concierge-map");

  function showConciergeFallback() {
    if (conciergeName) {
      conciergeName.textContent =
        "Monterey Recommendations";
    }

    if (conciergeHeadline) {
      conciergeHeadline.textContent =
        "Curated for Foxglove members";
    }

    if (conciergeDescription) {
      conciergeDescription.textContent =
        "Concierge recommendations are currently being prepared for the next edition of The Foxglove.";
    }

    if (conciergeActions) {
      conciergeActions.hidden = true;
    }

    if (conciergeWebsite) {
      conciergeWebsite.hidden = true;
      conciergeWebsite.removeAttribute("href");
    }

    if (conciergeMap) {
      conciergeMap.hidden = true;
      conciergeMap.removeAttribute("href");
    }
  }

  function displayConciergeRecommendation(
    recommendation
  ) {
    if (conciergeName) {
      conciergeName.textContent =
        recommendation.name;
    }

    if (conciergeHeadline) {
      conciergeHeadline.textContent =
        recommendation.headline ||
        formatConciergeCategory(
          recommendation.category
        );
    }

    if (conciergeDescription) {
      conciergeDescription.textContent =
        recommendation.description;
    }

    if (
      conciergeImage &&
      recommendation.image_url
    ) {
      conciergeImage.src =
        recommendation.image_url;

      conciergeImage.alt =
        `${recommendation.name} concierge recommendation`;
    }

    const hasWebsite =
      Boolean(recommendation.website_url);

    const hasMap =
      Boolean(recommendation.google_maps_url);

    if (conciergeWebsite) {
      conciergeWebsite.hidden = !hasWebsite;

      if (hasWebsite) {
        conciergeWebsite.href =
          recommendation.website_url;
      } else {
        conciergeWebsite.removeAttribute("href");
      }
    }

    if (conciergeMap) {
      conciergeMap.hidden = !hasMap;

      if (hasMap) {
        conciergeMap.href =
          recommendation.google_maps_url;
      } else {
        conciergeMap.removeAttribute("href");
      }
    }

    if (conciergeActions) {
      conciergeActions.hidden =
        !hasWebsite && !hasMap;
    }
  }

  function formatConciergeCategory(category) {
    const labels = {
      restaurant: "Dining Recommendation",
      bar: "Bar Recommendation",
      hotel: "Hotel Recommendation",
    };

    return labels[category] ||
      "Concierge Recommendation";
  }

  async function loadRandomConciergeRecommendation() {
    const { data, error } =
      await supabase
        .from("concierge_recommendations")
        .select(`
          id,
          category,
          name,
          headline,
          description,
          image_url,
          website_url,
          google_maps_url
        `)
        .eq("is_active", true);

    if (
      error ||
      !Array.isArray(data) ||
      data.length === 0
    ) {
      if (error) {
        console.error(
          "Unable to load concierge recommendations:",
          error
        );
      }

      showConciergeFallback();
      return;
    }

    const randomIndex =
      Math.floor(Math.random() * data.length);

    const randomRecommendation =
      data[randomIndex];

    displayConciergeRecommendation(
      randomRecommendation
    );
  }

  await loadRandomConciergeRecommendation();
  
  const logoutButton =
    document.querySelector("#member-logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Logging Out...";

      const { error } = await supabase.auth.signOut();

      if (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";
        return;
      }

      window.location.replace("login.html");
    });
  }
})();

lucide.createIcons();