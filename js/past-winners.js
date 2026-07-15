document.addEventListener("DOMContentLoaded", async () => {
  const MEDIA_BUCKET = "champions-media";

  const winnerCards = Array.from(
    document.querySelectorAll(".winner-card")
  );

  const winnerPresentation =
    document.querySelector(".winner-presentation");

  const winnerPhoto =
    document.querySelector(".winner-photo");

  const winnerVideo =
    document.querySelector(".winner-video");

  const detailYear =
    document.querySelector(".winner-info .winner-year");

  const detailName =
    document.querySelector(".winner-info h2");

  const winningScore =
    document.querySelector(
      ".winner-stats > div:nth-child(1) strong"
    );

  const winnerDinner =
    document.querySelector(
      ".winner-stats > div:nth-child(2) strong"
    );

  const coursesPlayed =
    document.querySelector(".winner-courses p");

  const reflection =
    document.querySelector(
      ".winner-reflection blockquote"
    );

  const mobileWinnerView =
    window.matchMedia("(max-width: 700px)");

  const championsByYear = new Map();

  let resetTimer;
  let mobilePlayTimer;

  function getPublicUrl(storagePath) {
    if (!storagePath) return null;

    const { data } = foxgloveSupabase
      .storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  function hasPresentationVideo() {
    return Boolean(
      winnerVideo.getAttribute("src")
    );
  }

  function showPhoto() {
    window.clearTimeout(resetTimer);
    window.clearTimeout(mobilePlayTimer);

    winnerPresentation.classList.remove("is-playing");

    winnerVideo.pause();
    winnerVideo.currentTime = 0;
  }

  function playPresentation() {
    if (!hasPresentationVideo()) return;

    window.clearTimeout(resetTimer);
    window.clearTimeout(mobilePlayTimer);

    winnerVideo.pause();
    winnerVideo.currentTime = 0;

    winnerPresentation.classList.add("is-playing");

    winnerVideo.play().catch(() => {
      showPhoto();
    });
  }

  function scheduleMobilePlayback() {
    window.clearTimeout(mobilePlayTimer);

    if (!hasPresentationVideo()) return;

    mobilePlayTimer = window.setTimeout(() => {
      playPresentation();
    }, 10000);
  }

  function initializePresentation() {
    showPhoto();

    if (
      mobileWinnerView.matches &&
      hasPresentationVideo()
    ) {
      scheduleMobilePlayback();
    }
  }

  function createTrophyPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "trophy-placeholder";

    const icon = document.createElement("img");
    icon.src =
      "../assets/icons/foxglove-icon-gold-transparent.png";
    icon.alt = "";

    placeholder.appendChild(icon);

    return placeholder;
  }

  function renderWinnerCard(card, champion) {
    const year = card.dataset.year;
    const nameElement =
      card.querySelector(".winner-card-name");

    const existingImage =
      card.querySelector(":scope > img");

    const existingPlaceholder =
      card.querySelector(".trophy-placeholder");

    if (!champion) {
      card.classList.add("placeholder");
      card.classList.remove("active");

      nameElement.innerHTML =
        `Reserved for<br>${year} Winner`;

      existingImage?.remove();

      if (!existingPlaceholder) {
        card.appendChild(createTrophyPlaceholder());
      }

      return;
    }

    card.classList.remove("placeholder");

    nameElement.textContent = champion.winner_name;

    existingPlaceholder?.remove();

    const imagePath =
      champion.card_image_path ||
      champion.main_image_path;

    if (imagePath) {
      const cardImage =
        existingImage || document.createElement("img");

      cardImage.src = getPublicUrl(imagePath);
      cardImage.alt = champion.winner_name;

      if (!existingImage) {
        card.appendChild(cardImage);
      }
    } else {
      existingImage?.remove();
      card.appendChild(createTrophyPlaceholder());
    }
  }

  function renderWinnerDetail(year, champion) {
  if (!champion) return;

  detailYear.textContent = `${year} Winner`;
  detailName.textContent = champion.winner_name;

  winningScore.textContent =
    champion.winning_score || "—";

  winnerDinner.textContent =
    champion.winner_dinner || "—";

  coursesPlayed.textContent =
    champion.courses_played || "—";

  reflection.textContent =
    champion.reflection || "—";

  const mainImagePath =
    champion.main_image_path ||
    champion.card_image_path;

  if (mainImagePath) {
    winnerPhoto.src = getPublicUrl(mainImagePath);
winnerPhoto.alt = champion.winner_name;
winnerPhoto.style.display = "block";
winnerPhoto.classList.remove("is-placeholder");
  } else {
    winnerPhoto.removeAttribute("src");
    winnerPhoto.alt = "";
    winnerPhoto.style.display = "none";
  }

  if (champion.presentation_video_path) {
    winnerVideo.src = getPublicUrl(
      champion.presentation_video_path
    );

    winnerVideo.style.display = "block";
    winnerVideo.load();
  } else {
    winnerVideo.pause();
    winnerVideo.removeAttribute("src");
    winnerVideo.style.display = "none";
    winnerVideo.load();
  }

  initializePresentation();
}

function renderEmptyWinnerDetail(year = "2027") {
  showPhoto();

  detailYear.textContent = `${year} Winner`;
  detailName.textContent = `Reserved for ${year} Winner`;

  winningScore.textContent = "—";
  winnerDinner.textContent = "—";
  coursesPlayed.textContent = "—";

  reflection.textContent =
    "The next chapter of Foxglove history will be written here.";

  winnerPhoto.src =
  "../assets/icons/foxglove-icon-gold-transparent.png";

winnerPhoto.alt = "Foxglove placeholder";
winnerPhoto.style.display = "block";

  winnerVideo.pause();
  winnerVideo.removeAttribute("src");
  winnerVideo.style.display = "none";
  winnerVideo.load();

  winnerPresentation.classList.remove("is-playing");
}

function renderEmptyWinnerDetail(year = "2027") {
  showPhoto();

  detailYear.textContent = `${year} Winner`;
  detailName.textContent = `Reserved for ${year} Winner`;

  winningScore.textContent = "—";
  winnerDinner.textContent = "—";
  coursesPlayed.textContent = "—";

  reflection.textContent =
    "The next chapter of Foxglove history will be written here.";

  winnerPhoto.src =
  "../assets/icons/foxglove-icon-gold.png";

winnerPhoto.alt = "Foxglove placeholder";
winnerPhoto.style.display = "block";
winnerPhoto.classList.add("is-placeholder");

  winnerVideo.pause();
  winnerVideo.removeAttribute("src");
  winnerVideo.style.display = "none";
  winnerVideo.load();

  winnerPresentation.classList.remove("is-playing");
}

  function activateWinner(year) {
    const champion = championsByYear.get(
      Number(year)
    );

    if (!champion) return;

    winnerCards.forEach((card) => {
      card.classList.toggle(
        "active",
        card.dataset.year === String(year)
      );
    });

    renderWinnerDetail(year, champion);
  }

  async function loadChampions() {
    const {
      data: tournaments,
      error: tournamentError,
    } = await foxgloveSupabase
      .from("tournaments")
      .select("id, year")
      .order("year", { ascending: true });

    if (
      tournamentError ||
      !tournaments ||
      tournaments.length === 0
    ) {
      return;
    }

    const tournamentYearById = new Map(
      tournaments.map((tournament) => [
        tournament.id,
        tournament.year,
      ])
    );

    const tournamentIds = tournaments.map(
      (tournament) => tournament.id
    );

    const {
      data: champions,
      error: championError,
    } = await foxgloveSupabase
      .from("champions")
      .select(`
        tournament_id,
        winner_name,
        winning_score,
        winner_dinner,
        courses_played,
        reflection,
        card_image_path,
        main_image_path,
        presentation_video_path
      `)
      .in("tournament_id", tournamentIds);

    if (championError) return;

    (champions || []).forEach((champion) => {
      const year = tournamentYearById.get(
        champion.tournament_id
      );

      if (year) {
        championsByYear.set(year, champion);
      }
    });

    winnerCards.forEach((card) => {
      const year = Number(card.dataset.year);

      renderWinnerCard(
        card,
        championsByYear.get(year)
      );
    });

    const firstAvailableCard = winnerCards.find(
      (card) =>
        championsByYear.has(
          Number(card.dataset.year)
        )
    );

    if (firstAvailableCard) {
  activateWinner(firstAvailableCard.dataset.year);
} else {
  renderEmptyWinnerDetail("2027");
}
  }

  winnerCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("placeholder")) {
        return;
      }

      activateWinner(card.dataset.year);
    });
  });

  winnerPresentation.addEventListener(
    "mouseenter",
    () => {
      if (mobileWinnerView.matches) return;

      playPresentation();
    }
  );

  winnerPresentation.addEventListener(
    "mouseleave",
    () => {
      if (mobileWinnerView.matches) return;

      winnerPresentation.classList.remove(
        "is-playing"
      );

      resetTimer = window.setTimeout(() => {
        winnerVideo.pause();
        winnerVideo.currentTime = 0;
      }, 800);
    }
  );

  winnerVideo.addEventListener("ended", () => {
    showPhoto();

    if (mobileWinnerView.matches) {
      scheduleMobilePlayback();
    }
  });

  mobileWinnerView.addEventListener(
    "change",
    initializePresentation
  );

  await loadChampions();
});