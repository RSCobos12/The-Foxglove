function getBasePath() {
  const isInsidePagesFolder = window.location.pathname.includes("/pages/");
  return isInsidePagesFolder ? "../" : "";
}

async function loadComponent(selector, filePath) {
  const element = document.querySelector(selector);

  if (!element) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(
        `Failed to load component from "${filePath}". HTTP status: ${response.status}`
      );
    }

    const html = await response.text();
    element.innerHTML = html;
  } catch (error) {
    console.error(`Unable to load component for "${selector}":`, error);
  }
}

async function loadSharedComponents() {
  const basePath = getBasePath();

  await loadComponent("#site-header", `${basePath}components/header.html`);
  await loadComponent("#site-footer", `${basePath}components/footer.html`);

  setActiveNav();
  initHeaderScroll();
  initMobileNavigation();
}

function setActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".site-header a[href]");

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;

    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

function initHeaderScroll() {
  const siteHeader = document.querySelector(".site-header");

  if (!siteHeader) return;

  const updateHeader = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 40);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader);
}

function initMobileNavigation() {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const menu = document.querySelector(".mobile-menu");

  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.classList.remove("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mobile-menu-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");

    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    menu.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("mobile-menu-open", isOpen);
  });

  menu.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

loadSharedComponents();