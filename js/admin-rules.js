(async () => {
  await window.adminSidebarReady;

  const {
    data: { session },
  } = await foxgloveSupabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const {
    data: currentProfile,
    error: profileError,
  } = await foxgloveSupabase
    .from("profiles")
    .select(`
      first_name,
      role,
      is_active
    `)
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

  const displayNameInput =
    document.querySelector("#rule-display-name");

  const documentFileInput =
    document.querySelector("#rule-document-file");

  const activeCheckbox =
    document.querySelector("#rule-document-active");

  const uploadButton =
    document.querySelector("#upload-rule-document");

  const uploadMessage =
    document.querySelector("#rule-upload-message");

  const listMessage =
    document.querySelector("#rules-list-message");

  const documentList =
    document.querySelector("#rules-document-list");

  const documentCount =
    document.querySelector("#rules-document-count");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  function showUploadMessage(
    message,
    isError = false
  ) {
    uploadMessage.textContent = message;
    uploadMessage.hidden = false;

    uploadMessage.classList.toggle(
      "is-error",
      isError
    );
  }

  function clearUploadMessage() {
    uploadMessage.textContent = "";
    uploadMessage.hidden = true;
    uploadMessage.classList.remove(
      "is-error"
    );
  }

  function showListMessage(
    message,
    isError = false
  ) {
    listMessage.textContent = message;
    listMessage.hidden = false;

    listMessage.classList.toggle(
      "is-error",
      isError
    );
  }

  function clearListMessage() {
    listMessage.textContent = "";
    listMessage.hidden = true;
    listMessage.classList.remove(
      "is-error"
    );
  }

  function getFileExtension(filename) {
    return filename
      .split(".")
      .pop()
      ?.toLowerCase() || "";
  }

  function createStoragePath(file) {
    const extension =
      getFileExtension(file.name);

    return (
      `${Date.now()}-` +
      `${crypto.randomUUID()}.` +
      `${extension}`
    );
  }

  function validateRuleFile(file) {
    if (!file) {
      return "Select a document to upload.";
    }

    const extension =
      getFileExtension(file.name);

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
    ];

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      return "Only PDF, DOC, and DOCX files are allowed.";
    }

    const maximumSize =
      20 * 1024 * 1024;

    if (file.size > maximumSize) {
      return "The document must be 20 MB or smaller.";
    }

    return "";
  }

  async function createSignedDocumentUrl(
    storagePath
  ) {
    const {
      data,
      error,
    } = await foxgloveSupabase.storage
      .from("rule-documents")
      .createSignedUrl(
        storagePath,
        60 * 10
      );

    if (error) {
      console.error(
        "Unable to create document link:",
        error
      );

      return "";
    }

    return data?.signedUrl || "";
  }

  async function openRuleDocument(
    documentRecord
  ) {
    const signedUrl =
      await createSignedDocumentUrl(
        documentRecord.storage_path
      );

    if (!signedUrl) {
      showListMessage(
        "Unable to open the document.",
        true
      );

      return;
    }

    window.open(
      signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function toggleRuleVisibility(
    documentRecord,
    checkbox,
    status
  ) {
    checkbox.disabled = true;
    status.textContent = "Saving...";
    status.classList.remove("is-error");

    const { error } =
      await foxgloveSupabase
        .from("rule_documents")
        .update({
          is_active: checkbox.checked,
        })
        .eq("id", documentRecord.id);

    if (error) {
      console.error(
        "Unable to update document visibility:",
        error
      );

      checkbox.checked =
        documentRecord.is_active;

      status.textContent =
        "Unable to save.";

      status.classList.add(
        "is-error"
      );

      checkbox.disabled = false;
      return;
    }

    documentRecord.is_active =
      checkbox.checked;

    status.textContent = "Saved";
    checkbox.disabled = false;
  }

  async function deleteRuleDocument(
    documentRecord,
    row
  ) {
    const confirmed =
      window.confirm(
        `Delete "${documentRecord.display_name}"?`
      );

    if (!confirmed) {
      return;
    }

    const { error: storageError } =
      await foxgloveSupabase.storage
        .from("rule-documents")
        .remove([
          documentRecord.storage_path,
        ]);

    if (storageError) {
      console.error(
        "Unable to delete document file:",
        storageError
      );

      showListMessage(
        "Unable to delete the document file.",
        true
      );

      return;
    }

    const { error: databaseError } =
      await foxgloveSupabase
        .from("rule_documents")
        .delete()
        .eq("id", documentRecord.id);

    if (databaseError) {
      console.error(
        "Unable to delete document record:",
        databaseError
      );

      showListMessage(
        "The file was removed, but the document record could not be deleted.",
        true
      );

      return;
    }

    row.remove();

    const remainingCount =
      documentList.children.length;

    documentCount.textContent =
      String(remainingCount);

    if (remainingCount === 0) {
      showListMessage(
        "No rule documents have been uploaded."
      );
    }
  }

  function createRuleDocumentRow(
  documentRecord
) {
  const row =
    document.createElement("article");

  row.className =
    "rules-document-row";

  const extension =
    getFileExtension(
      documentRecord.file_name
    );

  const documentType =
    extension === "pdf"
      ? "PDF Document"
      : "Word Document";

  const icon =
    document.createElement("div");

  icon.className =
    `rules-document-icon is-${extension}`;

  icon.setAttribute(
    "aria-hidden",
    "true"
  );

  icon.textContent =
    extension === "pdf"
      ? "PDF"
      : "W";

  const details =
    document.createElement("div");

  details.className =
    "rules-document-details";

  const officialBadge =
    document.createElement("span");

  officialBadge.className =
    "rules-document-official";

  officialBadge.textContent =
    "Official";

  const title =
    document.createElement("h3");

  title.textContent =
    documentRecord.display_name;

  const metadata =
    document.createElement("p");

  const uploadedDate =
    documentRecord.uploaded_at
      ? new Date(
          documentRecord.uploaded_at
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        )
      : "";

  metadata.textContent =
    uploadedDate
      ? `${documentType} • Uploaded ${uploadedDate}`
      : documentType;

  details.append(
    officialBadge,
    title,
    metadata
  );

  const visibility =
    document.createElement("label");

  visibility.className =
    "rules-document-visibility";

  const checkbox =
    document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.checked =
    documentRecord.is_active;

  const visibilityText =
    document.createElement("span");

  visibilityText.textContent =
    "Visible to members";

  visibility.append(
    checkbox,
    visibilityText
  );

  const status =
    document.createElement("span");

  status.className =
    "rules-document-status";

  status.setAttribute(
    "role",
    "status"
  );

  checkbox.addEventListener(
    "change",
    async () => {
      await toggleRuleVisibility(
        documentRecord,
        checkbox,
        status
      );
    }
  );

  const actions =
    document.createElement("div");

  actions.className =
    "rules-document-actions";

  const openButton =
    document.createElement("button");

  openButton.type = "button";
  openButton.className =
    "admin-secondary-button";

  openButton.textContent =
    "Open";

  openButton.addEventListener(
    "click",
    async () => {
      await openRuleDocument(
        documentRecord
      );
    }
  );

  const deleteButton =
    document.createElement("button");

  deleteButton.type = "button";
  deleteButton.className =
    "admin-secondary-button is-danger";

  deleteButton.textContent =
    "Delete";

  deleteButton.addEventListener(
    "click",
    async () => {
      await deleteRuleDocument(
        documentRecord,
        row
      );
    }
  );

  actions.append(
    openButton,
    deleteButton
  );

  row.append(
    icon,
    details,
    visibility,
    status,
    actions
  );

  return row;
}

  async function loadRuleDocuments() {
    showListMessage(
      "Loading documents..."
    );

    const {
      data,
      error,
    } = await foxgloveSupabase
      .from("rule_documents")
      .select(`
        id,
        display_name,
        storage_path,
        file_name,
        file_type,
        is_active,
        sort_order,
        uploaded_at
      `)
      .order("sort_order", {
        ascending: true,
      })
      .order("uploaded_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load rule documents:",
        error
      );

      showListMessage(
        "Unable to load rule documents.",
        true
      );

      return;
    }

    const documents =
      Array.isArray(data)
        ? data
        : [];

    documentList.innerHTML = "";

    documentCount.textContent =
      String(documents.length);

    if (documents.length === 0) {
      showListMessage(
        "No rule documents have been uploaded."
      );

      return;
    }

    clearListMessage();

    documents.forEach(
      (documentRecord) => {
        documentList.append(
          createRuleDocumentRow(
            documentRecord
          )
        );
      }
    );
  }

  async function uploadRuleDocument() {
    const displayName =
      displayNameInput.value.trim();

    const file =
      documentFileInput.files[0];

    if (!displayName) {
      showUploadMessage(
        "Enter the visible document name.",
        true
      );

      return;
    }

    const fileValidationError =
      validateRuleFile(file);

    if (fileValidationError) {
      showUploadMessage(
        fileValidationError,
        true
      );

      return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent =
      "Uploading...";

    clearUploadMessage();

    const storagePath =
      createStoragePath(file);

    const { error: uploadError } =
      await foxgloveSupabase.storage
        .from("rule-documents")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Rule document upload failed:",
        uploadError
      );

      showUploadMessage(
        uploadError.message,
        true
      );

      uploadButton.disabled = false;
      uploadButton.textContent =
        "Upload Document";

      return;
    }

    const { error: insertError } =
      await foxgloveSupabase
        .from("rule_documents")
        .insert({
          display_name:
            displayName,
          storage_path:
            storagePath,
          file_name:
            file.name,
          file_type:
            file.type || null,
          is_active:
            activeCheckbox.checked,
          uploaded_by_profile_id:
            session.user.id,
        });

    if (insertError) {
      console.error(
        "Unable to save rule document record:",
        insertError
      );

      await foxgloveSupabase.storage
        .from("rule-documents")
        .remove([
          storagePath,
        ]);

      showUploadMessage(
        "Unable to save the uploaded document.",
        true
      );

      uploadButton.disabled = false;
      uploadButton.textContent =
        "Upload Document";

      return;
    }

    displayNameInput.value = "";
    documentFileInput.value = "";
    activeCheckbox.checked = true;

    showUploadMessage(
      "Document uploaded successfully."
    );

    uploadButton.disabled = false;
    uploadButton.textContent =
      "Upload Document";

    await loadRuleDocuments();
  }

  uploadButton.addEventListener(
    "click",
    uploadRuleDocument
  );

  displayNameInput.addEventListener(
    "input",
    clearUploadMessage
  );

  documentFileInput.addEventListener(
    "change",
    clearUploadMessage
  );

  logoutButton?.addEventListener(
    "click",
    async () => {
      await foxgloveSupabase.auth.signOut();
      window.location.replace("login.html");
    }
  );

  await loadRuleDocuments();
})();