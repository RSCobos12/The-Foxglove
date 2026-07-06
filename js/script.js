console.log("The Foxglove Invitational is live.");

const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
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