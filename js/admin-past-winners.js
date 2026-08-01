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
    document.querySelector("#winner-year");

  const form =
    document.querySelector("#winner-form");

  const statusMessage =
    document.querySelector("#winner-admin-message");

  const winnerName =
    document.querySelector("#winner-name");

  const winningScore =
    document.querySelector("#winning-score");

  const winnerDinner =
    document.querySelector("#winner-dinner");

  const coursesPlayed =
    document.querySelector("#courses-played");

  const reflection =
    document.querySelector("#winner-reflection");

  const cardImageFile =
    document.querySelector("#card-image-file");

  const mainImageFile =
    document.querySelector("#main-image-file");

  const presentationVideoFile =
    document.querySelector("#presentation-video-file");

  const cardImagePreview =
    document.querySelector("#card-image-preview");

  const mainImagePreview =
    document.querySelector("#main-image-preview");

  const videoPreview =
    document.querySelector("#video-preview");

  const saveButton =
    document.querySelector("#save-winner-button");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  let tournaments = [];
  let currentChampion = null;

  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", isError);
    statusMessage.hidden = false;
  }

  function hideMessage() {
    statusMessage.hidden = true;
    statusMessage.classList.remove("is-error");
  }

  function getPublicUrl(storagePath) {
    if (!storagePath) return null;

    const { data } = foxgloveSupabase
      .storage
      .from("champions-media")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  function getExtension(filename) {
    const extension =
      filename.split(".").pop().toLowerCase();

    return extension === "jpeg"
      ? "jpg"
      : extension;
  }

  function renderImagePreview(
    container,
    storagePath,
    fallbackText
  ) {
    container.innerHTML = "";

    if (!storagePath) {
      container.textContent = fallbackText;
      return;
    }

    const image = document.createElement("img");

    image.src = getPublicUrl(storagePath);
    image.alt = "";
    container.appendChild(image);
  }

  function renderVideoPreview(storagePath) {
    videoPreview.innerHTML = "";

    if (!storagePath) {
      videoPreview.textContent =
        "No video uploaded";
      return;
    }

    const video = document.createElement("video");

    video.src = getPublicUrl(storagePath);
    video.controls = true;
    video.preload = "metadata";

    videoPreview.appendChild(video);
  }

  function previewSelectedImage(fileInput, container) {
    const file = fileInput.files[0];

    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.src = objectUrl;
    image.alt = "Selected image preview";

    container.innerHTML = "";
    container.appendChild(image);

    image.addEventListener(
      "load",
      () => URL.revokeObjectURL(objectUrl),
      { once: true }
    );
  }

  function previewSelectedVideo() {
    const file = presentationVideoFile.files[0];

    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.src = objectUrl;
    video.controls = true;
    video.preload = "metadata";

    videoPreview.innerHTML = "";
    videoPreview.appendChild(video);

    video.addEventListener(
      "loadedmetadata",
      () => URL.revokeObjectURL(objectUrl),
      { once: true }
    );
  }

  async function loadChampion() {
    const tournamentId = yearSelect.value;

    if (!tournamentId) return;

    showMessage("Loading winner information...");
    form.hidden = true;

    const { data, error } = await foxgloveSupabase
      .from("champions")
      .select(`
        id,
        winner_name,
        winning_score,
        winner_dinner,
        courses_played,
        reflection,
        card_image_path,
        main_image_path,
        presentation_video_path
      `)
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    if (error) {
      showMessage(
        "Unable to load winner information.",
        true
      );
      return;
    }

    currentChampion = data || null;

    winnerName.value =
      currentChampion?.winner_name || "";

    winningScore.value =
      currentChampion?.winning_score || "";

    winnerDinner.value =
      currentChampion?.winner_dinner || "";

    coursesPlayed.value =
      currentChampion?.courses_played || "";

    reflection.value =
      currentChampion?.reflection || "";

    cardImageFile.value = "";
    mainImageFile.value = "";
    presentationVideoFile.value = "";

    renderImagePreview(
      cardImagePreview,
      currentChampion?.card_image_path,
      "No image uploaded"
    );

    renderImagePreview(
      mainImagePreview,
      currentChampion?.main_image_path,
      "No image uploaded"
    );

    renderVideoPreview(
      currentChampion?.presentation_video_path
    );

    hideMessage();
    form.hidden = false;
  }

  async function uploadMedia(file, label, year) {
    if (!file) return null;

    if (file.size > 25 * 1024 * 1024) {
      throw new Error(
        `${file.name} exceeds the 25 MB limit.`
      );
    }

    const extension = getExtension(file.name);

    const storagePath =
      `${year}/${label}-${crypto.randomUUID()}.${extension}`;

    const { error } = await foxgloveSupabase
      .storage
      .from("champions-media")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return storagePath;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    
const normalizedWinnerName =
  winnerName.value.trim();

if (!normalizedWinnerName) {
  showMessage(
    "Winner name is required.",
    true
  );

  winnerName.focus();
  return;
}

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    showMessage("Saving winner information...");

    const selectedTournament =
      tournaments.find(
        (tournament) =>
          tournament.id === yearSelect.value
      );

    const newlyUploadedPaths = [];

    try {
      const newCardImagePath =
        await uploadMedia(
          cardImageFile.files[0],
          "card-image",
          selectedTournament.year
        );

      if (newCardImagePath) {
        newlyUploadedPaths.push(newCardImagePath);
      }

      const newMainImagePath =
        await uploadMedia(
          mainImageFile.files[0],
          "main-image",
          selectedTournament.year
        );

      if (newMainImagePath) {
        newlyUploadedPaths.push(newMainImagePath);
      }

      const newVideoPath =
        await uploadMedia(
          presentationVideoFile.files[0],
          "presentation-video",
          selectedTournament.year
        );

      if (newVideoPath) {
        newlyUploadedPaths.push(newVideoPath);
      }

      const oldPathsToRemove = [];

      if (
        newCardImagePath &&
        currentChampion?.card_image_path
      ) {
        oldPathsToRemove.push(
          currentChampion.card_image_path
        );
      }

      if (
        newMainImagePath &&
        currentChampion?.main_image_path
      ) {
        oldPathsToRemove.push(
          currentChampion.main_image_path
        );
      }

      if (
        newVideoPath &&
        currentChampion?.presentation_video_path
      ) {
        oldPathsToRemove.push(
          currentChampion.presentation_video_path
        );
      }

      const championRecord = {
        tournament_id: selectedTournament.id,
        winner_name:
  normalizedWinnerName,
        winning_score:
          winningScore.value.trim() || null,
        winner_dinner:
          winnerDinner.value.trim() || null,
        courses_played:
          coursesPlayed.value.trim() || null,
        reflection:
          reflection.value.trim() || null,
        card_image_path:
          newCardImagePath ||
          currentChampion?.card_image_path ||
          null,
        main_image_path:
          newMainImagePath ||
          currentChampion?.main_image_path ||
          null,
        presentation_video_path:
          newVideoPath ||
          currentChampion?.presentation_video_path ||
          null,
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } =
        await foxgloveSupabase
          .from("champions")
          .upsert(
            championRecord,
            {
              onConflict: "tournament_id",
            }
          );

      if (saveError) {
        throw saveError;
      }

      if (oldPathsToRemove.length > 0) {
        await foxgloveSupabase
          .storage
          .from("champions-media")
          .remove(oldPathsToRemove);
      }

      showMessage(
        `${selectedTournament.year} winner saved successfully.`
      );

      await loadChampion();
    } catch (error) {
      if (newlyUploadedPaths.length > 0) {
        await foxgloveSupabase
          .storage
          .from("champions-media")
          .remove(newlyUploadedPaths);
      }

      showMessage(
        error.message ||
        "Unable to save winner information.",
        true
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save Winner";
    }
  });

  cardImageFile.addEventListener(
    "change",
    () => previewSelectedImage(
      cardImageFile,
      cardImagePreview
    )
  );

  mainImageFile.addEventListener(
    "change",
    () => previewSelectedImage(
      mainImageFile,
      mainImagePreview
    )
  );

  presentationVideoFile.addEventListener(
    "change",
    previewSelectedVideo
  );

  const {
    data: tournamentData,
    error: tournamentError,
  } = await foxgloveSupabase
    .from("tournaments")
    .select("id, year")
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
    const option = document.createElement("option");

    option.value = tournament.id;
    option.textContent = tournament.year;

    yearSelect.appendChild(option);
  });

  yearSelect.addEventListener(
    "change",
    loadChampion
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      await foxgloveSupabase.auth.signOut();
      window.location.replace("login.html");
    }
  );

  await loadChampion();
})();