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

  const focusableElements = Array.from(
    menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
  );

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement =
    focusableElements[focusableElements.length - 1];

  const closeMenu = (returnFocus = true) => {
    toggle.classList.remove("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mobile-menu-open");

    if (returnFocus) {
      toggle.focus();
    }
  };

  const openMenu = () => {
    toggle.classList.add("is-open");
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
    menu.setAttribute("aria-hidden", "false");
    document.body.classList.add("mobile-menu-open");

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.contains("is-open");

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = menu.classList.contains("is-open");

    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (
      event.key !== "Tab" ||
      !firstFocusableElement ||
      !lastFocusableElement
    ) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === lastFocusableElement
    ) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu(false);
    }
  });
}

loadSharedComponents();