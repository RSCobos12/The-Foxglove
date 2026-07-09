function getBasePath() {
  const isInsidePagesFolder = window.location.pathname.includes("/pages/");
  return isInsidePagesFolder ? "../" : "";
}

async function loadComponent(selector, filePath) {
  const element = document.querySelector(selector);

  if (!element) return;

  const response = await fetch(filePath);
  const html = await response.text();

  element.innerHTML = html;
}

async function loadSharedComponents() {
  const basePath = getBasePath();

  await loadComponent("#site-header", `${basePath}components/header.html`);
  await loadComponent("#site-footer", `${basePath}components/footer.html`);

  setActiveNav();
  initHeaderScroll();
}

function setActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav a[href]");

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
    if (window.scrollY > 40) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }
  };

  updateHeader();

  window.addEventListener("scroll", updateHeader);
}

loadSharedComponents();