console.log("The Foxglove Invitational is live.");

const winnerPresentations = document.querySelectorAll(".winner-presentation");

winnerPresentations.forEach((presentation) => {
  const video = presentation.querySelector(".winner-video");

  if (!video) return;

  let resetTimer;

  presentation.addEventListener("mouseenter", () => {
    clearTimeout(resetTimer);

    video.pause();
    video.currentTime = 0;

    presentation.classList.add("is-playing");

    video.play().catch((error) => {
      console.log("Winner video failed:", error);
    });
  });

  presentation.addEventListener("mouseleave", () => {
    presentation.classList.remove("is-playing");

    resetTimer = setTimeout(() => {
      video.pause();
      video.currentTime = 0;
    }, 800);
  });

  video.addEventListener("ended", () => {
    presentation.classList.remove("is-playing");

    resetTimer = setTimeout(() => {
      video.pause();
      video.currentTime = 0;
    }, 800);
  });
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