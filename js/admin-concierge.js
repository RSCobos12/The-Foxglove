(async () => {
  await window.adminSidebarReady;

  const supabase = window.foxgloveSupabase;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const { data: currentProfile, error: profileError } =
    await supabase
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
    await supabase.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  const welcomeMessage =
    document.querySelector("#admin-welcome");

  const newButton =
    document.querySelector("#new-concierge-button");

  const statusMessage =
    document.querySelector("#concierge-admin-message");

  const conciergeList =
    document.querySelector("#concierge-list");

  const emptyMessage =
    document.querySelector("#concierge-empty");

  const conciergeCount =
    document.querySelector("#concierge-count");

  const editorTitle =
    document.querySelector("#concierge-editor-title");

  const editorForm =
    document.querySelector("#concierge-editor-form");

  const conciergeId =
    document.querySelector("#concierge-id");

  const category =
    document.querySelector("#concierge-category");

  const businessName =
    document.querySelector("#concierge-name");

  const headline =
    document.querySelector("#concierge-headline");

  const description =
    document.querySelector("#concierge-description");

  const websiteUrl =
    document.querySelector("#concierge-website-url");

  const mapsUrl =
    document.querySelector("#concierge-google-maps-url");

  const imageFile =
    document.querySelector("#concierge-image-file");

  const currentImageUrl =
    document.querySelector(
      "#concierge-current-image-url"
    );

  const currentImagePath =
    document.querySelector(
      "#concierge-current-image-path"
    );

  const imagePreview =
    document.querySelector("#concierge-image-preview");

  const imagePlaceholder =
    document.querySelector(
      "#concierge-image-placeholder"
    );

  const isActive =
    document.querySelector("#concierge-is-active");

  const saveButton =
    document.querySelector("#save-concierge-button");

  const cancelButton =
    document.querySelector("#cancel-concierge-button");

  const deleteButton =
    document.querySelector("#delete-concierge-button");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  let recommendations = [];
  let selectedImageFile = null;

  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.hidden = false;
    statusMessage.classList.toggle("is-error", isError);
  }

  function hideMessage() {
    statusMessage.textContent = "";
    statusMessage.hidden = true;
    statusMessage.classList.remove("is-error");
  }

  function formatCategory(value) {
    if (!value) return "";

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );
  }

  function updateCount() {
    conciergeCount.textContent =
      `${recommendations.length} / 25`;

    newButton.disabled =
      recommendations.length >= 25;
  }

  function displayImage(url = "") {
    if (url) {
      imagePreview.src = url;
      imagePreview.hidden = false;
      imagePlaceholder.hidden = true;
    } else {
      imagePreview.removeAttribute("src");
      imagePreview.hidden = true;
      imagePlaceholder.hidden = false;
    }
  }

  function resetEditor() {
    editorForm.reset();

    conciergeId.value = "";
    currentImageUrl.value = "";
    currentImagePath.value = "";

    selectedImageFile = null;

    editorTitle.textContent =
      "Add Recommendation";

    isActive.checked = true;

    deleteButton.hidden = true;

    displayImage();

    document
      .querySelectorAll(".concierge-list-item")
      .forEach((item) => {
        item.classList.remove("is-selected");
      });

    hideMessage();
  }

  function openRecommendation(recommendation) {
    conciergeId.value = recommendation.id;
    category.value = recommendation.category;
    businessName.value = recommendation.name;
    headline.value = recommendation.headline || "";
    description.value = recommendation.description;
    websiteUrl.value = recommendation.website_url || "";
    mapsUrl.value =
      recommendation.google_maps_url || "";

    currentImageUrl.value =
      recommendation.image_url || "";

    currentImagePath.value =
      recommendation.image_path || "";

    isActive.checked = recommendation.is_active;

    selectedImageFile = null;

    editorTitle.textContent =
      `Edit ${recommendation.name}`;

    deleteButton.hidden = false;

    displayImage(recommendation.image_url);

    document
      .querySelectorAll(".concierge-list-item")
      .forEach((item) => {
        item.classList.toggle(
          "is-selected",
          item.dataset.id === recommendation.id
        );
      });

    hideMessage();
  }

  function createListItem(recommendation) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "concierge-list-item";
    button.dataset.id = recommendation.id;

    const thumbnail = document.createElement("img");
    thumbnail.className = "concierge-list-thumb";
    thumbnail.alt = "";

    if (recommendation.image_url) {
      thumbnail.src = recommendation.image_url;
    }

    const copy = document.createElement("span");
    copy.className = "concierge-list-copy";

    const name = document.createElement("strong");
    name.textContent = recommendation.name;

    const type = document.createElement("small");
    type.textContent =
      formatCategory(recommendation.category);

    copy.append(name, type);

    const status = document.createElement("span");
    status.className = "concierge-list-status";

    if (recommendation.is_active) {
      status.classList.add("is-active");
    }

    status.setAttribute(
      "aria-label",
      recommendation.is_active
        ? "Active recommendation"
        : "Inactive recommendation"
    );

    button.append(thumbnail, copy, status);

    button.addEventListener("click", () => {
      openRecommendation(recommendation);
    });

    return button;
  }

  function renderRecommendations() {
    conciergeList.innerHTML = "";

    updateCount();

    if (recommendations.length === 0) {
      conciergeList.hidden = true;
      emptyMessage.hidden = false;
      return;
    }

    conciergeList.hidden = false;
    emptyMessage.hidden = true;

    recommendations.forEach((recommendation) => {
      conciergeList.appendChild(
        createListItem(recommendation)
      );
    });
  }

  async function loadRecommendations() {
    showMessage("Loading Concierge Collection...");

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
          image_path,
          website_url,
          google_maps_url,
          is_active,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(error);

      showMessage(
        "Unable to load Concierge recommendations.",
        true
      );

      return;
    }

    recommendations = data || [];

    renderRecommendations();
    resetEditor();
  }

  function createStoragePath(file) {
    const extension =
      file.name.split(".").pop().toLowerCase();

    const safeExtension =
      ["jpg", "jpeg", "png", "webp"].includes(
        extension
      )
        ? extension
        : "jpg";

    return (
      `${session.user.id}/` +
      `${crypto.randomUUID()}.${safeExtension}`
    );
  }

  async function uploadImage(file) {
    const path = createStoragePath(file);

    const { error: uploadError } =
      await supabase.storage
        .from("concierge-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("concierge-images")
        .getPublicUrl(path);

    return {
      path,
      url: data.publicUrl,
    };
  }

  async function removeStoredImage(path) {
    if (!path) return;

    const { error } =
      await supabase.storage
        .from("concierge-images")
        .remove([path]);

    if (error) {
      console.error(
        "Unable to remove old concierge image:",
        error
      );
    }
  }

  imageFile.addEventListener("change", () => {
    const file = imageFile.files?.[0];

    selectedImageFile = file || null;

    if (!file) {
      displayImage(currentImageUrl.value);
      return;
    }

    const maximumSize =
      10 * 1024 * 1024;

    if (file.size > maximumSize) {
      imageFile.value = "";
      selectedImageFile = null;

      showMessage(
        "The selected image must be smaller than 10 MB.",
        true
      );

      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    displayImage(previewUrl);
    hideMessage();
  });

  newButton.addEventListener("click", () => {
    resetEditor();

    document
      .querySelector("#concierge-editor-panel")
      .scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  });

  cancelButton.addEventListener(
    "click",
    resetEditor
  );

  editorForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const editingId =
        conciergeId.value.trim();

      const record = {
        category: category.value,
        name: businessName.value.trim(),
        headline:
          headline.value.trim() || null,
        description:
          description.value.trim(),
        website_url:
          websiteUrl.value.trim() || null,
        google_maps_url:
          mapsUrl.value.trim() || null,
        is_active: isActive.checked,
      };

      if (
        !record.category ||
        !record.name ||
        !record.description
      ) {
        showMessage(
          "Category, business name and description are required.",
          true
        );

        return;
      }

      if (
        !editingId &&
        recommendations.length >= 25
      ) {
        showMessage(
          "The Concierge Collection is limited to 25 recommendations.",
          true
        );

        return;
      }

      saveButton.disabled = true;
      saveButton.textContent = "Saving...";

      hideMessage();

      let uploadedImage = null;

      try {
        if (selectedImageFile) {
          uploadedImage =
            await uploadImage(selectedImageFile);

          record.image_url =
            uploadedImage.url;

          record.image_path =
            uploadedImage.path;
        } else {
          record.image_url =
            currentImageUrl.value || null;

          record.image_path =
            currentImagePath.value || null;
        }

        let savedRecommendation;
        let saveError;

        if (editingId) {
          const response =
            await supabase
              .from("concierge_recommendations")
              .update(record)
              .eq("id", editingId)
              .select()
              .single();

          savedRecommendation = response.data;
          saveError = response.error;
        } else {
          const response =
            await supabase
              .from("concierge_recommendations")
              .insert(record)
              .select()
              .single();

          savedRecommendation = response.data;
          saveError = response.error;
        }

        if (saveError) {
          throw saveError;
        }

        if (
          editingId &&
          uploadedImage &&
          currentImagePath.value &&
          currentImagePath.value !==
            uploadedImage.path
        ) {
          await removeStoredImage(
            currentImagePath.value
          );
        }

        if (editingId) {
          recommendations =
            recommendations.map(
              (recommendation) =>
                recommendation.id === editingId
                  ? savedRecommendation
                  : recommendation
            );
        } else {
          recommendations.push(
            savedRecommendation
          );
        }

        renderRecommendations();
        openRecommendation(savedRecommendation);

        showMessage(
          editingId
            ? "Recommendation updated."
            : "Recommendation added."
        );
      } catch (error) {
        console.error(error);

        if (uploadedImage?.path) {
          await removeStoredImage(
            uploadedImage.path
          );
        }

        const errorDetails =
  error?.message ||
  error?.error_description ||
  error?.details ||
  "Unknown Supabase error";

console.error(
  "Concierge recommendation save failed:",
  error
);

showMessage(
  `Unable to save the recommendation: ${errorDetails}`,
  true
);
      } finally {
        saveButton.disabled = false;
        saveButton.textContent =
          "Save Recommendation";
      }
    }
  );

  deleteButton.addEventListener(
    "click",
    async () => {
      const editingId =
        conciergeId.value.trim();

      if (!editingId) return;

      const recommendation =
        recommendations.find(
          (item) => item.id === editingId
        );

      if (!recommendation) return;

      const confirmed = window.confirm(
        `Delete ${recommendation.name}?`
      );

      if (!confirmed) return;

      deleteButton.disabled = true;
      deleteButton.textContent =
        "Deleting...";

      const { error } =
        await supabase
          .from("concierge_recommendations")
          .delete()
          .eq("id", editingId);

      if (error) {
        console.error(error);

        showMessage(
          "Unable to delete the recommendation.",
          true
        );

        deleteButton.disabled = false;
        deleteButton.textContent =
          "Delete Recommendation";

        return;
      }

      await removeStoredImage(
        recommendation.image_path
      );

      recommendations =
        recommendations.filter(
          (item) => item.id !== editingId
        );

      renderRecommendations();
      resetEditor();

      showMessage(
        "Recommendation deleted."
      );

      deleteButton.disabled = false;
      deleteButton.textContent =
        "Delete Recommendation";
    }
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      await supabase.auth.signOut();
      window.location.replace("login.html");
    }
  );

  await loadRecommendations();
})();