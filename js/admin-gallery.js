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
    document.querySelector("#gallery-year");

  const galleryMessage =
    document.querySelector("#gallery-admin-message");

  const galleryManager =
    document.querySelector("#gallery-manager");

  const featuredSlot =
    document.querySelector("#featured-slot");

  const gallerySlots =
    document.querySelector("#gallery-slots");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  let tournaments = [];
  let currentImages = [];

  function showMessage(message, isError = false) {
    galleryMessage.textContent = message;
    galleryMessage.classList.toggle("is-error", isError);
    galleryMessage.hidden = false;
  }

  function hideMessage() {
    galleryMessage.hidden = true;
    galleryMessage.classList.remove("is-error");
  }

  function getFileExtension(filename) {
    const extension = filename.split(".").pop().toLowerCase();

    if (extension === "jpeg") {
      return "jpg";
    }

    return extension;
  }

  function getPublicUrl(storagePath) {
    const { data } = foxgloveSupabase
      .storage
      .from("gallery-images")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  function findImage(isFeatured, position = null) {
    return currentImages.find((image) => {
      if (isFeatured) {
        return image.is_featured;
      }

      return !image.is_featured &&
        image.position === position;
    });
  }

  function createSlot({
    title,
    isFeatured,
    position = null,
  }) {
    const existingImage =
      findImage(isFeatured, position);

    const slot = document.createElement("div");
    slot.className = isFeatured
      ? "gallery-admin-slot is-featured"
      : "gallery-admin-slot";

    const preview = document.createElement("div");
    preview.className = "gallery-admin-preview";

    if (existingImage) {
      const image = document.createElement("img");
      image.src = getPublicUrl(existingImage.storage_path);
      image.alt = existingImage.alt_text || title;
      preview.appendChild(image);
    } else {
      const placeholder = document.createElement("span");
      placeholder.textContent = "No image uploaded";
      preview.appendChild(placeholder);
    }

    const details = document.createElement("div");
    details.className = "gallery-admin-slot-details";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const actions = document.createElement("div");
    actions.className = "gallery-admin-actions";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.hidden = true;

    const uploadButton = document.createElement("button");
    uploadButton.type = "button";
    uploadButton.className = "admin-secondary-button";
    uploadButton.textContent =
      existingImage ? "Replace" : "Upload";

    uploadButton.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];

      if (!file) return;

      await uploadGalleryImage({
        file,
        existingImage,
        isFeatured,
        position,
        title,
        uploadButton,
      });

      fileInput.value = "";
    });

    actions.append(uploadButton, fileInput);

    if (existingImage) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className =
        "admin-secondary-button is-danger";
      removeButton.textContent = "Remove";

      removeButton.addEventListener("click", async () => {
        const confirmed = window.confirm(
          `Remove ${title}?`
        );

        if (!confirmed) return;

        await removeGalleryImage(existingImage);
      });

      actions.appendChild(removeButton);
    }

    details.append(heading, actions);
    slot.append(preview, details);

    return slot;
  }

  function renderGallery() {
    featuredSlot.innerHTML = "";
    gallerySlots.innerHTML = "";

    featuredSlot.appendChild(
      createSlot({
        title: "Featured Image",
        isFeatured: true,
      })
    );

    for (let position = 1; position <= 13; position += 1) {
      gallerySlots.appendChild(
        createSlot({
          title: `Image ${position}`,
          isFeatured: false,
          position,
        })
      );
    }
  }

  async function loadGalleryImages() {
    const tournamentId = yearSelect.value;

    if (!tournamentId) return;

    showMessage("Loading Gallery...");

    const { data, error } = await foxgloveSupabase
      .from("gallery_images")
      .select(
        "id, storage_path, position, is_featured, alt_text"
      )
      .eq("tournament_id", tournamentId)
      .eq("submission_status", "approved")
      .eq("is_active", true);

    if (error) {
      showMessage(
        "Unable to load Gallery images.",
        true
      );
      return;
    }

    currentImages = data || [];

    renderGallery();
    hideMessage();
    galleryManager.hidden = false;
  }

  async function uploadGalleryImage({
    file,
    existingImage,
    isFeatured,
    position,
    title,
    uploadButton,
  }) {
    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    const selectedTournament = tournaments.find(
      (tournament) => tournament.id === yearSelect.value
    );

    const extension = getFileExtension(file.name);

    const fileLabel = isFeatured
      ? "featured"
      : `position-${position}`;

    const storagePath =
      `${selectedTournament.year}/${fileLabel}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await foxgloveSupabase
        .storage
        .from("gallery-images")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      showMessage(uploadError.message, true);
      uploadButton.disabled = false;
      uploadButton.textContent =
        existingImage ? "Replace" : "Upload";
      return;
    }

    let databaseError;

    if (existingImage) {
      const { error } = await foxgloveSupabase
        .from("gallery_images")
        .update({
          storage_path: storagePath,
          alt_text:
            `${selectedTournament.year} ${title}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by_profile_id: session.user.id,
        })
        .eq("id", existingImage.id);

      databaseError = error;

      if (!databaseError) {
        await foxgloveSupabase
          .storage
          .from("gallery-images")
          .remove([existingImage.storage_path]);
      }
    } else {
      const { error } = await foxgloveSupabase
        .from("gallery_images")
        .insert({
          tournament_id: selectedTournament.id,
          uploaded_by_profile_id: session.user.id,
          reviewed_by_profile_id: session.user.id,
          storage_path: storagePath,
          position,
          is_featured: isFeatured,
          submission_status: "approved",
          alt_text:
            `${selectedTournament.year} ${title}`,
          is_active: true,
          reviewed_at: new Date().toISOString(),
        });

      databaseError = error;
    }

    if (databaseError) {
      await foxgloveSupabase
        .storage
        .from("gallery-images")
        .remove([storagePath]);

      showMessage(databaseError.message, true);

      uploadButton.disabled = false;
      uploadButton.textContent =
        existingImage ? "Replace" : "Upload";

      return;
    }

    showMessage(`${title} saved successfully.`);

    await loadGalleryImages();
  }

  async function removeGalleryImage(image) {
    showMessage("Removing image...");

    const { error: storageError } =
      await foxgloveSupabase
        .storage
        .from("gallery-images")
        .remove([image.storage_path]);

    if (storageError) {
      showMessage(storageError.message, true);
      return;
    }

    const { error: databaseError } =
      await foxgloveSupabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);

    if (databaseError) {
      showMessage(databaseError.message, true);
      return;
    }

    showMessage("Image removed successfully.");

    await loadGalleryImages();
  }

  const { data: tournamentData, error: tournamentError } =
    await foxgloveSupabase
      .from("tournaments")
      .select("id, year, name")
      .order("year", { ascending: true });

  if (tournamentError) {
    showMessage(
      "Unable to load tournament years.",
      true
    );
    return;
  }

  tournaments = tournamentData || [];

  if (tournaments.length === 0) {
    showMessage(
      "Create a tournament before managing Gallery images.",
      true
    );
    return;
  }

  tournaments.forEach((tournament) => {
    const option = document.createElement("option");

    option.value = tournament.id;
    option.textContent = tournament.year;

    yearSelect.appendChild(option);
  });

  yearSelect.addEventListener(
    "change",
    loadGalleryImages
  );

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });

  await loadGalleryImages();
})();