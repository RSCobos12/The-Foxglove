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
  let approvedImagePickerContext = null;

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

  const approvedImagePicker =
  document.querySelector(
    "#approved-image-picker"
  );

const approvedImagePickerTitle =
  document.querySelector(
    "#approved-image-picker-title"
  );

const approvedImagePickerGrid =
  document.querySelector(
    "#approved-image-picker-grid"
  );

const approvedImagePickerMessage =
  document.querySelector(
    "#approved-image-picker-message"
  );

const closeApprovedImagePickerButton =
  document.querySelector(
    "#close-approved-image-picker"
  );

function closeApprovedImagePicker() {
  approvedImagePickerContext = null;

  if (approvedImagePicker?.open) {
    approvedImagePicker.close();
  }
}

function showApprovedImagePickerMessage(
  message,
  isError = false
) {
  if (!approvedImagePickerMessage) {
    return;
  }

  approvedImagePickerMessage.textContent =
    message;

  approvedImagePickerMessage.hidden = false;

  approvedImagePickerMessage.classList.toggle(
    "is-error",
    isError
  );
}

function clearApprovedImagePickerMessage() {
  if (!approvedImagePickerMessage) {
    return;
  }

  approvedImagePickerMessage.textContent = "";
  approvedImagePickerMessage.hidden = true;

  approvedImagePickerMessage.classList.remove(
    "is-error"
  );
}

function isImageCurrentlyAssigned(image) {
  return (
    image.is_featured === true ||
    Number.isInteger(image.position)
  );
}

function createApprovedImagePickerCard(
  image
) {
  const card =
    document.createElement("button");

  card.type = "button";
  card.className =
    "approved-image-picker-card";

  const imageUrl =
    getGallerySubmissionImageUrl(
      image.storage_path
    );

  const previewWrap =
    document.createElement("span");

  previewWrap.className =
    "approved-image-picker-preview";

  const preview =
    document.createElement("img");

  preview.src = imageUrl;

  preview.alt =
    image.alt_text ||
    "Approved Gallery image";

  previewWrap.append(preview);

  const assignmentBadge =
    document.createElement("span");

  assignmentBadge.className =
    "approved-image-picker-badge";

  if (image.is_featured) {
    assignmentBadge.textContent =
      "Featured";

    assignmentBadge.hidden = false;
  } else if (
    Number.isInteger(image.position)
  ) {
    assignmentBadge.textContent =
      `Image ${image.position}`;

    assignmentBadge.hidden = false;
  } else {
    assignmentBadge.hidden = true;
  }

  previewWrap.append(
    assignmentBadge
  );

  const details =
    document.createElement("span");

  details.className =
    "approved-image-picker-card-details";

  const name =
    document.createElement("strong");

  name.textContent =
    getGalleryMemberName(image);

  const assignment =
    document.createElement("small");

  const isCurrentImage =
    approvedImagePickerContext &&
    (
      (
        approvedImagePickerContext
          .isFeatured &&
        image.is_featured
      ) ||
      (
        !approvedImagePickerContext
          .isFeatured &&
        image.is_featured === false &&
        image.position ===
          approvedImagePickerContext
            .position
      )
    );

  if (isCurrentImage) {
    assignment.textContent =
      "Currently assigned to this slot";

    card.classList.add(
      "is-current-assignment"
    );

    card.disabled = true;
  } else if (image.is_featured) {
    assignment.textContent =
      "Currently assigned as Featured Image";
  } else if (
    Number.isInteger(image.position)
  ) {
    assignment.textContent =
      `Currently assigned to Image ${image.position}`;
  } else {
    assignment.textContent =
      "Available for placement";
  }

  details.append(
    name,
    assignment
  );

  card.append(
    previewWrap,
    details
  );

  if (!isCurrentImage) {
    card.addEventListener(
      "click",
      async () => {
        if (
          isImageCurrentlyAssigned(image)
        ) {
          const confirmed =
            window.confirm(
              "This image is already assigned to another Gallery position. Move it here?"
            );

          if (!confirmed) {
            return;
          }
        }

        await assignApprovedImageToSlot(
          image,
          approvedImagePickerContext
        );
      }
    );
  }

  return card;
}

function renderApprovedImagePicker(
  approvedImages
) {
  if (!approvedImagePickerGrid) {
    return;
  }

  approvedImagePickerGrid.innerHTML = "";

  if (approvedImages.length === 0) {
    const emptyState =
      document.createElement("div");

    emptyState.className =
      "gallery-submission-empty";

    emptyState.textContent =
      "No approved images are available.";

    approvedImagePickerGrid.append(
      emptyState
    );

    return;
  }

  approvedImages.forEach((image) => {
    approvedImagePickerGrid.append(
      createApprovedImagePickerCard(image)
    );
  });
}

async function openApprovedImagePicker(
  context
) {
  approvedImagePickerContext =
    context;

  if (approvedImagePickerTitle) {
    approvedImagePickerTitle.textContent =
      `Select Image for ${context.title}`;
  }

  clearApprovedImagePickerMessage();

  if (approvedImagePickerGrid) {
    approvedImagePickerGrid.innerHTML = "";
  }

  approvedImagePicker?.showModal();

  showApprovedImagePickerMessage(
    "Loading approved images..."
  );

  const { data, error } =
    await foxgloveSupabase
      .from("gallery_images")
      .select(`
        id,
        storage_path,
        alt_text,
        position,
        is_featured,
        submission_status,
        uploaded_by_profile_id,
        profiles:uploaded_by_profile_id (
          first_name,
          last_name
        )
      `)
      .eq(
        "tournament_id",
        yearSelect.value
      )
      .eq(
        "submission_status",
        "approved"
      )
      .eq("is_active", true)
      .order("uploaded_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Unable to load approved images:",
      error
    );

    showApprovedImagePickerMessage(
      "Unable to load approved images.",
      true
    );

    return;
  }

  clearApprovedImagePickerMessage();

  renderApprovedImagePicker(
    Array.isArray(data)
      ? data
      : []
  );
}

async function assignApprovedImageToSlot(
  image,
  context
) {
  if (!context) {
    return;
  }

  showApprovedImagePickerMessage(
    `Assigning image to ${context.title}...`
  );

  if (
    context.existingImage &&
    context.existingImage.id !== image.id
  ) {
    const { error: clearExistingError } =
      await foxgloveSupabase
        .from("gallery_images")
        .update({
          is_featured: false,
          position: null,
        })
        .eq(
          "id",
          context.existingImage.id
        );

    if (clearExistingError) {
      console.error(
        "Unable to clear existing Gallery slot:",
        clearExistingError
      );

      showApprovedImagePickerMessage(
        "Unable to clear the existing Gallery slot.",
        true
      );

      return;
    }
  }

  const {
    error: clearSelectedError,
  } = await foxgloveSupabase
    .from("gallery_images")
    .update({
      is_featured: false,
      position: null,
    })
    .eq("id", image.id);

  if (clearSelectedError) {
    console.error(
      "Unable to clear selected image assignment:",
      clearSelectedError
    );

    showApprovedImagePickerMessage(
      "Unable to prepare the selected image.",
      true
    );

    return;
  }

  const {
    error: assignmentError,
  } = await foxgloveSupabase
    .from("gallery_images")
    .update({
      is_featured:
        context.isFeatured,
      position:
        context.isFeatured
          ? null
          : context.position,
      reviewed_by_profile_id:
        session.user.id,
      reviewed_at:
        new Date().toISOString(),
    })
    .eq("id", image.id)
    .eq(
      "submission_status",
      "approved"
    );

  if (assignmentError) {
    console.error(
      "Unable to assign approved image:",
      assignmentError
    );

    showApprovedImagePickerMessage(
      "Unable to assign the approved image.",
      true
    );

    return;
  }

  closeApprovedImagePicker();

  await loadGalleryImages();
  await loadGallerySubmissions();

  switchGalleryAdminView(
    "placement"
  );

  showMessage(
    `${context.title} updated successfully.`
  );
}

closeApprovedImagePickerButton
  ?.addEventListener(
    "click",
    closeApprovedImagePicker
  );

approvedImagePicker?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      approvedImagePicker
    ) {
      closeApprovedImagePicker();
    }
  }
);

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

      const selectApprovedButton =
  document.createElement("button");

selectApprovedButton.type = "button";

selectApprovedButton.className =
  "admin-secondary-button gallery-select-approved-button";

selectApprovedButton.textContent =
  existingImage
    ? "Replace with Approved Image"
    : "Select Approved Image";

selectApprovedButton.addEventListener(
  "click",
  () => {
    openApprovedImagePicker({
      isFeatured,
      position,
      title,
      existingImage,
    });
  }
);

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

    actions.append(
  selectApprovedButton,
  uploadButton,
  fileInput
);

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
    .select(`
      id,
      year,
      name,
      is_member_lounge_season
    `)
    .order("year", {
      ascending: true,
    });

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

  const currentSeasonTournament =
  tournaments.find(
    (tournament) =>
      tournament.is_member_lounge_season
  );

if (currentSeasonTournament) {
  yearSelect.value =
    currentSeasonTournament.id;
}

  yearSelect.addEventListener(
  "change",
  async () => {
    await loadGalleryImages();
    await loadGallerySubmissions();
  }
);

  logoutButton.addEventListener("click", async () => {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
  });

  await loadGalleryImages();

  /* =====================================
   GALLERY SUBMISSION REVIEW
===================================== */

const galleryAdminTabs =
  Array.from(
    document.querySelectorAll(
      ".gallery-admin-tab"
    )
  );

const gallerySubmissionsManager =
  document.querySelector(
    "#gallery-submissions-manager"
  );

const galleryPlacementManager =
  document.querySelector(
    "#gallery-manager"
  );

const galleryReviewFilters =
  Array.from(
    document.querySelectorAll(
      ".gallery-review-filter"
    )
  );

const gallerySubmissionGrid =
  document.querySelector(
    "#gallery-submission-grid"
  );

const galleryReviewMessage =
  document.querySelector(
    "#gallery-review-message"
  );

const galleryPendingCount =
  document.querySelector(
    "#gallery-pending-count"
  );

const galleryApprovedCount =
  document.querySelector(
    "#gallery-approved-count"
  );

const galleryRejectedCount =
  document.querySelector(
    "#gallery-rejected-count"
  );

let gallerySubmissionRows = [];
let activeGalleryReviewStatus =
  "pending";

function showGalleryReviewMessage(
  message,
  isError = false
) {
  if (!galleryReviewMessage) {
    return;
  }

  galleryReviewMessage.textContent =
    message;

  galleryReviewMessage.hidden = false;

  galleryReviewMessage.classList.toggle(
    "is-error",
    isError
  );
}

function clearGalleryReviewMessage() {
  if (!galleryReviewMessage) {
    return;
  }

  galleryReviewMessage.textContent = "";
  galleryReviewMessage.hidden = true;
  galleryReviewMessage.classList.remove(
    "is-error"
  );
}

function formatGallerySubmissionDate(
  dateValue
) {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date =
    new Date(dateValue);

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getGalleryMemberName(
  submission
) {
  const firstName =
    submission.profiles
      ?.first_name
      ?.trim() || "";

  const lastName =
    submission.profiles
      ?.last_name
      ?.trim() || "";

  return (
    `${firstName} ${lastName}`.trim() ||
    "Foxglove Member"
  );
}

function getGallerySubmissionImageUrl(
  storagePath
) {
  if (!storagePath) {
    return "";
  }

  const {
    data,
  } = foxgloveSupabase.storage
    .from("gallery-images")
    .getPublicUrl(storagePath);

  return data?.publicUrl || "";
}

function updateGallerySubmissionCounts() {
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  gallerySubmissionRows.forEach(
    (submission) => {
      const status =
        submission.submission_status;

      if (
        Object.prototype.hasOwnProperty.call(
          counts,
          status
        )
      ) {
        counts[status] += 1;
      }
    }
  );

  if (galleryPendingCount) {
    galleryPendingCount.textContent =
      String(counts.pending);
  }

  if (galleryApprovedCount) {
    galleryApprovedCount.textContent =
      String(counts.approved);
  }

  if (galleryRejectedCount) {
    galleryRejectedCount.textContent =
      String(counts.rejected);
  }
}

function getGallerySubmissionFilename(
  storagePath
) {
  if (!storagePath) {
    return "Gallery image";
  }

  const filename =
    storagePath.split("/").pop();

  return filename || "Gallery image";
}

function setGallerySubmissionButtonsDisabled(
  card,
  isDisabled
) {
  card
    ?.querySelectorAll("button")
    .forEach((button) => {
      button.disabled = isDisabled;
    });
}

async function updateGallerySubmissionStatus(
  submission,
  newStatus,
  card
) {
  const statusLabels = {
    approved: "Approving submission...",
    rejected: "Rejecting submission...",
    pending: "Restoring submission...",
  };

  setGallerySubmissionButtonsDisabled(
    card,
    true
  );

  showGalleryReviewMessage(
    statusLabels[newStatus] ||
    "Updating submission..."
  );

  const { error } =
    await foxgloveSupabase
      .from("gallery_images")
      .update({
        submission_status: newStatus,
        reviewed_by_profile_id:
          session.user.id,
        reviewed_at:
          new Date().toISOString(),
      })
      .eq("id", submission.id);

  if (error) {
    console.error(
      "Unable to update Gallery submission:",
      error
    );

    showGalleryReviewMessage(
      "Unable to update the Gallery submission.",
      true
    );

    setGallerySubmissionButtonsDisabled(
      card,
      false
    );

    return;
  }

  submission.submission_status =
    newStatus;

  submission.reviewed_by_profile_id =
    session.user.id;

  submission.reviewed_at =
    new Date().toISOString();

  updateGallerySubmissionCounts();

  card?.classList.add(
    "is-leaving"
  );

  window.setTimeout(() => {
    clearGalleryReviewMessage();
    renderGallerySubmissions();
  }, 180);
}

function createGallerySubmissionCard(
  submission
) {
  const card =
    document.createElement("article");

  card.className =
    "gallery-submission-card";

  card.dataset.submissionId =
    submission.id;

  const imageUrl =
    getGallerySubmissionImageUrl(
      submission.storage_path
    );

  const memberName =
    getGalleryMemberName(submission);

  const tournamentYear =
    submission.tournaments?.year
      ? String(
          submission.tournaments.year
        )
      : "Tournament year unavailable";

  const submittedDate =
    formatGallerySubmissionDate(
      submission.uploaded_at
    );

  const status =
    submission.submission_status ||
    "pending";

  const filename =
    getGallerySubmissionFilename(
      submission.storage_path
    );

  const preview =
    document.createElement("div");

  preview.className =
    "gallery-submission-preview";

  const image =
    document.createElement("img");

  image.src = imageUrl;

  image.alt =
    submission.alt_text ||
    `${memberName} Gallery submission`;

  const statusBadge =
    document.createElement("span");

  statusBadge.className =
    `gallery-submission-status is-${status}`;

  statusBadge.textContent =
    status;

  preview.append(
    image,
    statusBadge
  );

  const details =
    document.createElement("div");

  details.className =
    "gallery-submission-details";

  const member =
    document.createElement("p");

  member.className =
    "gallery-submission-member";

  member.textContent =
    memberName;

  const meta =
    document.createElement("div");

  meta.className =
    "gallery-submission-meta";

  const tournamentLine =
    document.createElement("span");

  tournamentLine.textContent =
    `${tournamentYear} Tournament`;

  const dateLine =
    document.createElement("span");

  dateLine.textContent =
    `Submitted ${submittedDate}`;

  const filenameLine =
    document.createElement("span");

  filenameLine.className =
    "gallery-submission-filename";

  filenameLine.textContent =
    filename;

  meta.append(
    tournamentLine,
    dateLine,
    filenameLine
  );

  const actions =
    document.createElement("div");

  actions.className =
    "gallery-submission-actions";

  const viewButton =
    document.createElement("a");

  viewButton.className =
    "admin-secondary-button gallery-submission-view";

  viewButton.href = imageUrl;
  viewButton.target = "_blank";

  viewButton.rel =
    "noopener noreferrer";

  viewButton.textContent =
    "View Full Size";

  actions.append(viewButton);

  if (status === "pending") {
    const moderationActions =
      document.createElement("div");

    moderationActions.className =
      "gallery-moderation-actions";

    const approveButton =
      document.createElement("button");

    approveButton.type = "button";

    approveButton.className =
      "admin-primary-button";

    approveButton.textContent =
      "Approve";

    approveButton.addEventListener(
      "click",
      async () => {
        await updateGallerySubmissionStatus(
          submission,
          "approved",
          card
        );
      }
    );

    const rejectButton =
      document.createElement("button");

    rejectButton.type = "button";

    rejectButton.className =
      "admin-secondary-button is-danger";

    rejectButton.textContent =
      "Reject";

    rejectButton.addEventListener(
      "click",
      async () => {
        const confirmed =
          window.confirm(
            `Reject this photo from ${memberName}?`
          );

        if (!confirmed) {
          return;
        }

        await updateGallerySubmissionStatus(
          submission,
          "rejected",
          card
        );
      }
    );

    moderationActions.append(
      approveButton,
      rejectButton
    );

    actions.append(
      moderationActions
    );
  }

  if (status === "rejected") {
    const restoreButton =
      document.createElement("button");

    restoreButton.type = "button";

    restoreButton.className =
      "admin-secondary-button";

    restoreButton.textContent =
      "Restore to Pending";

    restoreButton.addEventListener(
      "click",
      async () => {
        await updateGallerySubmissionStatus(
          submission,
          "pending",
          card
        );
      }
    );

    actions.append(
      restoreButton
    );
  }

  if (status === "approved") {
    const placementButton =
      document.createElement("button");

    placementButton.type = "button";

    placementButton.className =
      "admin-secondary-button gallery-send-placement";

    placementButton.textContent =
      "Send to Gallery Placement";

    placementButton.addEventListener(
  "click",
  () => {
    switchGalleryAdminView(
      "placement"
    );

    galleryPlacementManager
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    showMessage(
      `${submission.first_name || "Member"} ${
        submission.last_name || ""
      }'s approved photo is available in the approved-image picker. Choose a Gallery position to place it.`
        .replace(/\s+/g, " ")
        .trim()
    );
  }
);

actions.append(
  placementButton
);
  }

  details.append(
    member,
    meta,
    actions
  );

  card.append(
    preview,
    details
  );

  return card;
}

function renderGallerySubmissions() {
  if (!gallerySubmissionGrid) {
    return;
  }

  gallerySubmissionGrid.innerHTML = "";

  const filteredSubmissions =
    gallerySubmissionRows.filter(
      (submission) =>
        submission.submission_status ===
        activeGalleryReviewStatus
    );

  if (
    filteredSubmissions.length === 0
  ) {
    const emptyState =
      document.createElement("div");

    emptyState.className =
      "gallery-submission-empty";

    emptyState.textContent =
      `No ${activeGalleryReviewStatus} Gallery submissions.`;

    gallerySubmissionGrid.append(
      emptyState
    );

    return;
  }

  filteredSubmissions.forEach(
    (submission) => {
      gallerySubmissionGrid.append(
        createGallerySubmissionCard(
          submission
        )
      );
    }
  );
}

async function loadGallerySubmissions() {
  showGalleryReviewMessage(
    "Loading Gallery submissions..."
  );

  const {
    data,
    error,
  } = await foxgloveSupabase
    .from("gallery_images")
    .select(`
  id,
  storage_path,
  alt_text,
  submission_status,
  uploaded_at,
  reviewed_at,
  uploaded_by_profile_id,
  profiles:uploaded_by_profile_id (
    first_name,
    last_name
  ),
  tournaments:tournament_id (
    year
  )
`)
    .eq(
  "tournament_id",
  yearSelect.value
)
.in(
  "submission_status",
  [
    "pending",
    "approved",
    "rejected",
  ]
)
.order(
  "uploaded_at",
  {
    ascending: false,
  }
);

  if (error) {
    console.error(
      "Unable to load Gallery submissions:",
      error
    );

    showGalleryReviewMessage(
      "Unable to load Gallery submissions.",
      true
    );

    return;
  }

  gallerySubmissionRows =
    Array.isArray(data)
      ? data
      : [];

  updateGallerySubmissionCounts();
  clearGalleryReviewMessage();
  renderGallerySubmissions();
}

function switchGalleryAdminView(
  viewName
) {
  galleryAdminTabs.forEach(
    (tab) => {
      const isActive =
        tab.dataset.galleryView ===
        viewName;

      tab.classList.toggle(
        "is-active",
        isActive
      );

      tab.setAttribute(
        "aria-selected",
        String(isActive)
      );
    }
  );

  if (gallerySubmissionsManager) {
    gallerySubmissionsManager.hidden =
      viewName !== "submissions";
  }

  if (galleryPlacementManager) {
    galleryPlacementManager.hidden =
      viewName !== "placement";
  }
}

galleryAdminTabs.forEach(
  (tab) => {
    tab.addEventListener(
      "click",
      () => {
        switchGalleryAdminView(
          tab.dataset.galleryView
        );
      }
    );
  }
);

galleryReviewFilters.forEach(
  (filterButton) => {
    filterButton.addEventListener(
      "click",
      () => {
        activeGalleryReviewStatus =
          filterButton.dataset
            .submissionStatus;

        galleryReviewFilters.forEach(
          (button) => {
            const isActive =
              button ===
              filterButton;

            button.classList.toggle(
              "is-active",
              isActive
            );

            button.setAttribute(
              "aria-selected",
              String(isActive)
            );
          }
        );

        renderGallerySubmissions();
      }
    );
  }
);

switchGalleryAdminView(
  "submissions"
);

await loadGallerySubmissions();
})();