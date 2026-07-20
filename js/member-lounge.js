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

  if (normalized.length <= 110) {
    return normalized;
  }

  return `${normalized
    .slice(0, 107)
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