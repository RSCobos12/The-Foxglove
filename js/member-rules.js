(async () => {
  const supabase =
    window.foxgloveSupabase;

      const mobileMenuButton =
    document.querySelector(
      "#member-mobile-menu-button"
    );

  const memberSidebar =
    document.querySelector(
      "#member-sidebar"
    );

  const mobileOverlay =
    document.querySelector(
      "#member-mobile-overlay"
    );

  function openMobileMenu() {
    if (
      !mobileMenuButton ||
      !memberSidebar ||
      !mobileOverlay
    ) {
      return;
    }

    memberSidebar.classList.add(
      "is-mobile-open"
    );

    mobileOverlay.classList.add(
      "is-visible"
    );

    mobileMenuButton.classList.add(
      "is-open"
    );

    mobileMenuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    mobileMenuButton.setAttribute(
      "aria-label",
      "Close member navigation"
    );

    document.body.classList.add(
      "member-mobile-menu-open"
    );
  }

  function closeMobileMenu() {
    if (
      !mobileMenuButton ||
      !memberSidebar ||
      !mobileOverlay
    ) {
      return;
    }

    memberSidebar.classList.remove(
      "is-mobile-open"
    );

    mobileOverlay.classList.remove(
      "is-visible"
    );

    mobileMenuButton.classList.remove(
      "is-open"
    );

    mobileMenuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    mobileMenuButton.setAttribute(
      "aria-label",
      "Open member navigation"
    );

    document.body.classList.remove(
      "member-mobile-menu-open"
    );
  }

  if (mobileMenuButton) {
    mobileMenuButton.addEventListener(
      "click",
      () => {
        const menuIsOpen =
          memberSidebar?.classList.contains(
            "is-mobile-open"
          );

        if (menuIsOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      }
    );
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener(
      "click",
      closeMobileMenu
    );
  }

  if (memberSidebar) {
    memberSidebar.addEventListener(
      "click",
      (event) => {
        const navigationItem =
          event.target.closest(
            ".member-nav-link"
          );

        if (
          navigationItem &&
          window.innerWidth <= 767
        ) {
          closeMobileMenu();
        }
      }
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        memberSidebar?.classList.contains(
          "is-mobile-open"
        )
      ) {
        closeMobileMenu();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 767) {
        closeMobileMenu();
      }
    }
  );

  if (!supabase) {
    window.location.replace(
      "login.html"
    );

    return;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError ||
    !session
  ) {
    window.location.replace(
      "login.html"
    );

    return;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      first_name,
      last_name,
      is_active
    `)
    .eq("id", session.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    await supabase.auth.signOut();

    window.location.replace(
      "login.html"
    );

    return;
  }

  const sidebarName =
    document.querySelector(
      "#member-sidebar-name"
    );

  const sidebarInitials =
    document.querySelector(
      "#member-sidebar-initials"
    );

  const rulesGrid =
    document.querySelector(
      "#member-rules-grid"
    );

  const rulesMessage =
    document.querySelector(
      "#member-rules-message"
    );

  const rulesCount =
    document.querySelector(
      "#member-rules-count"
    );

  const logoutButton =
    document.querySelector(
      "#member-logout-button"
    );

  const firstName =
    profile.first_name?.trim() ||
    "Member";

  const lastName =
    profile.last_name?.trim() ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initials =
    [
      firstName.charAt(0),
      lastName.charAt(0),
    ]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "FG";

  if (sidebarName) {
    sidebarName.textContent =
      fullName;
  }

  if (sidebarInitials) {
    sidebarInitials.textContent =
      initials;
  }

  function showRulesMessage(
    message,
    isError = false
  ) {
    if (!rulesMessage) {
      return;
    }

    rulesMessage.textContent =
      message;

    rulesMessage.hidden = false;

    rulesMessage.classList.toggle(
      "is-error",
      isError
    );
  }

  function clearRulesMessage() {
    if (!rulesMessage) {
      return;
    }

    rulesMessage.textContent = "";
    rulesMessage.hidden = true;

    rulesMessage.classList.remove(
      "is-error"
    );
  }

  function getFileExtension(
    filename
  ) {
    return filename
      ?.split(".")
      .pop()
      ?.toLowerCase() || "";
  }

  function getDocumentType(
    filename
  ) {
    const extension =
      getFileExtension(filename);

    if (extension === "pdf") {
      return "PDF Document";
    }

    if (
      extension === "doc" ||
      extension === "docx"
    ) {
      return "Word Document";
    }

    return "Document";
  }

  async function createSignedDocumentUrl(
    storagePath
  ) {
    const {
      data,
      error,
    } = await supabase.storage
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

  async function openDocument(
    documentRecord,
    card
  ) {
    card.classList.add(
      "is-loading"
    );

    const signedUrl =
      await createSignedDocumentUrl(
        documentRecord.storage_path
      );

    card.classList.remove(
      "is-loading"
    );

    if (!signedUrl) {
      showRulesMessage(
        "Unable to open the selected document.",
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

  function createDocumentCard(
    documentRecord
  ) {
    const card =
      document.createElement("button");

    card.type = "button";
    card.className =
      "member-rule-document-card";

    const extension =
      getFileExtension(
        documentRecord.file_name
      );

    const icon =
      document.createElement("span");

    icon.className =
      `member-rule-document-icon is-${extension}`;

    icon.setAttribute(
      "aria-hidden",
      "true"
    );

    icon.textContent =
      extension === "pdf"
        ? "PDF"
        : "W";

    const content =
      document.createElement("span");

    content.className =
      "member-rule-document-content";

    const official =
      document.createElement("span");

    official.className =
      "member-rule-document-badge";

    official.textContent =
      "Official";

    const title =
      document.createElement("strong");

    title.textContent =
      documentRecord.display_name;

    const type =
      document.createElement("small");

    type.textContent =
      getDocumentType(
        documentRecord.file_name
      );

    content.append(
      official,
      title,
      type
    );

    const arrow =
      document.createElement("span");

    arrow.className =
      "member-rule-document-arrow";

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    arrow.textContent = "›";

    card.append(
      icon,
      content,
      arrow
    );

    card.addEventListener(
      "click",
      async () => {
        await openDocument(
          documentRecord,
          card
        );
      }
    );

    return card;
  }

  async function loadRuleDocuments() {
    showRulesMessage(
      "Loading official documents..."
    );

    const {
      data,
      error,
    } = await supabase
      .from("rule_documents")
      .select(`
        id,
        display_name,
        storage_path,
        file_name,
        file_type,
        sort_order
      `)
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      })
      .order("uploaded_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load official documents:",
        error
      );

      showRulesMessage(
        "Unable to load official documents.",
        true
      );

      return;
    }

    const documents =
      Array.isArray(data)
        ? data
        : [];

    rulesGrid.innerHTML = "";

    if (rulesCount) {
      rulesCount.textContent =
        String(documents.length);
    }

    if (documents.length === 0) {
      showRulesMessage(
        "No official documents are currently available."
      );

      return;
    }

    clearRulesMessage();

    documents.forEach(
      (documentRecord) => {
        rulesGrid.append(
          createDocumentCard(
            documentRecord
          )
        );
      }
    );
  }

  logoutButton?.addEventListener(
    "click",
    async () => {
      await supabase.auth.signOut();

      window.location.replace(
        "login.html"
      );
    }
  );

  await loadRuleDocuments();
})();