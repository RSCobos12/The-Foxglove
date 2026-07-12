console.log("The Foxglove Invitational is live.");

const winnerPresentations = document.querySelectorAll(".winner-presentation");
const mobileWinnerView = window.matchMedia("(max-width: 700px)");

winnerPresentations.forEach((presentation) => {
  const video = presentation.querySelector(".winner-video");

  if (!video) return;

  let resetTimer;
  let mobilePlayTimer;

  function showPhoto() {
    presentation.classList.remove("is-playing");
    video.pause();
    video.currentTime = 0;
  }

  function playPresentation() {
    clearTimeout(resetTimer);
    clearTimeout(mobilePlayTimer);

    video.pause();
    video.currentTime = 0;

    presentation.classList.add("is-playing");

    video.play().catch((error) => {
      console.log("Winner video failed:", error);
      showPhoto();
    });
  }

  function scheduleMobilePlayback() {
    clearTimeout(mobilePlayTimer);

    mobilePlayTimer = setTimeout(() => {
      playPresentation();
    }, 10000);
  }

  function initializePresentation() {
    showPhoto();

    if (mobileWinnerView.matches) {
      scheduleMobilePlayback();
    }
  }

  presentation.addEventListener("mouseenter", () => {
    if (mobileWinnerView.matches) return;

    playPresentation();
  });

  presentation.addEventListener("mouseleave", () => {
    if (mobileWinnerView.matches) return;

    presentation.classList.remove("is-playing");

    resetTimer = setTimeout(() => {
      video.pause();
      video.currentTime = 0;
    }, 800);
  });

  video.addEventListener("ended", () => {
    showPhoto();

    if (mobileWinnerView.matches) {
      scheduleMobilePlayback();
    }
  });

  mobileWinnerView.addEventListener("change", initializePresentation);

  initializePresentation();
});

const winnerCards = document.querySelectorAll(".winner-card");

winnerCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("placeholder")) return;

    winnerCards.forEach((winnerCard) => {
      winnerCard.classList.remove("active");
    });

    card.classList.add("active");
  });
});

const courseCards = document.querySelectorAll(".course-card");

const courseCardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("course-card-visible");
        }, index * 100);

        courseCardObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

courseCards.forEach((card) => {
  courseCardObserver.observe(card);
});