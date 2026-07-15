window.adminSidebarReady = (async () => {
  const sidebarPlaceholder = document.querySelector(
    "#admin-sidebar-placeholder"
  );

  if (!sidebarPlaceholder) {
    throw new Error("Admin sidebar placeholder was not found.");
  }

  const response = await fetch(
    "/components/admin-sidebar.html"
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load admin sidebar. HTTP status: ${response.status}`
    );
  }

  sidebarPlaceholder.innerHTML = await response.text();

  const currentPage = document.body.dataset.adminPage;

  const activeLink = sidebarPlaceholder.querySelector(
    `[data-admin-page="${currentPage}"]`
  );

  if (activeLink) {
    activeLink.classList.add("is-active");
    activeLink.setAttribute("aria-current", "page");
  }
})().catch((error) => {
  console.error(error);
});