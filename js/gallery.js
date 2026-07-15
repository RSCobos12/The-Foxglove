document.addEventListener("DOMContentLoaded", async () => {
  const galleryData = {};

  for (let year = 2027; year <= 2035; year += 1) {
    galleryData[year] = {
      featured: null,
      images: Array(13).fill(null),
    };
  }

  const yearButtons = document.querySelectorAll(".gallery-year");
  const featuredYearHeading =
    document.querySelector(".featured-year h2");
  const featuredImage =
    document.querySelector(".featured-photo");
  const featuredPlaceholder =
    document.querySelector(".featured-placeholder");
  const placeholderYear =
    document.querySelector(".placeholder-year");

  const galleryImages = Array.from(
    document.querySelectorAll(".gallery-photo")
  );

  const galleryPlaceholders = Array.from(
    document.querySelectorAll(".gallery-placeholder")
  );

  const fadeContainers = document.querySelectorAll(
    ".gallery-fade-content"
  );

  const lightbox =
    document.querySelector("#gallery-lightbox");
  const lightboxImage =
    document.querySelector(".gallery-lightbox-image");
  const closeButton =
    document.querySelector(".gallery-lightbox-close");
  const previousButton =
    document.querySelector(".gallery-lightbox-prev");
  const nextButton =
    document.querySelector(".gallery-lightbox-next");
  const counter =
    document.querySelector(".gallery-lightbox-counter");

  let currentImageIndex = 0;
  let transitionTimer = null;
  let featuredMode = false;

  function getPublicUrl(storagePath) {
    const { data } = foxgloveSupabase
      .storage
      .from("gallery-images")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  async function loadSupabaseGalleryData() {
    const { data: tournaments, error: tournamentsError } =
      await foxgloveSupabase
        .from("tournaments")
        .select("id, year")
        .in("status", ["open", "complete", "archived"]);

    if (tournamentsError) {
      console.error(
        "Unable to load public tournament years:",
        tournamentsError
      );
      return;
    }

    if (!tournaments || tournaments.length === 0) {
      return;
    }

    const tournamentIds = tournaments.map(
      (tournament) => tournament.id
    );

    const tournamentYearById = new Map(
      tournaments.map((tournament) => [
        tournament.id,
        tournament.year,
      ])
    );

    const { data: images, error: imagesError } =
      await foxgloveSupabase
        .from("gallery_images")
        .select(
          "tournament_id, storage_path, position, is_featured, alt_text"
        )
        .in("tournament_id", tournamentIds)
        .eq("submission_status", "approved")
        .eq("is_active", true);

    if (imagesError) {
      console.error(
        "Unable to load public Gallery images:",
        imagesError
      );
      return;
    }

    (images || []).forEach((image) => {
      const year = tournamentYearById.get(
        image.tournament_id
      );

      if (!galleryData[year]) return;

      const imageUrl = getPublicUrl(image.storage_path);

      if (image.is_featured) {
        galleryData[year].featured = {
          url: imageUrl,
          alt:
            image.alt_text ||
            `The Foxglove Invitational ${year} featured image`,
        };
        return;
      }

      if (
        Number.isInteger(image.position) &&
        image.position >= 1 &&
        image.position <= 13
      ) {
        galleryData[year].images[image.position - 1] = {
          url: imageUrl,
          alt:
            image.alt_text ||
            `The Foxglove Invitational ${year} gallery image ${image.position}`,
        };
      }
    });
  }

  function replaceGalleryContent(year) {
    const selectedGallery = galleryData[year];

    if (!selectedGallery) return;

    featuredYearHeading.textContent = year;
    placeholderYear.textContent = year;

    featuredImage.onload = () => {
      featuredPlaceholder.style.display = "none";
    };

    featuredImage.onerror = () => {
      featuredImage.style.display = "none";
      featuredPlaceholder.style.display = "flex";
    };

    if (selectedGallery.featured) {
      featuredImage.style.display = "block";
      featuredImage.src = selectedGallery.featured.url;
      featuredImage.alt = selectedGallery.featured.alt;
      featuredPlaceholder.style.display = "none";
    } else {
      featuredImage.removeAttribute("src");
      featuredImage.alt = "";
      featuredImage.style.display = "block";
      featuredPlaceholder.style.display = "flex";
    }

    galleryImages.forEach((image, index) => {
      const placeholder = galleryPlaceholders[index];
      const imageRecord = selectedGallery.images[index];

      image.onload = () => {
        image.style.display = "block";

        if (placeholder) {
          placeholder.style.display = "none";
        }
      };

      image.onerror = () => {
        image.style.display = "none";

        if (placeholder) {
          placeholder.style.display = "flex";
        }
      };

      if (imageRecord) {
        image.src = imageRecord.url;
        image.alt = imageRecord.alt;
      } else {
        image.removeAttribute("src");
        image.alt = "";
        image.style.display = "none";

        if (placeholder) {
          placeholder.style.display = "flex";
        }
      }
    });
  }

  function updateGallery(year, animate = true) {
    if (!galleryData[year]) return;

    window.clearTimeout(transitionTimer);

    if (!animate) {
      replaceGalleryContent(year);
      return;
    }

    fadeContainers.forEach((container) => {
      container.classList.add("is-fading");
    });

    transitionTimer = window.setTimeout(() => {
      replaceGalleryContent(year);

      window.requestAnimationFrame(() => {
        fadeContainers.forEach((container) => {
          container.classList.remove("is-fading");
        });
      });
    }, 350);
  }

  function showLightboxImage(index) {
    const totalImages = galleryImages.length;

    currentImageIndex =
      (index + totalImages) % totalImages;

    const selectedImage =
      galleryImages[currentImageIndex];

    if (
      !selectedImage.src ||
      !selectedImage.complete ||
      selectedImage.naturalWidth === 0
    ) {
      return;
    }

    lightboxImage.src = selectedImage.src;
    lightboxImage.alt = selectedImage.alt;

    counter.textContent =
      `${currentImageIndex + 1} / ${totalImages}`;
  }

  function openGalleryLightbox(index) {
    const selectedImage = galleryImages[index];

    if (
      !selectedImage.src ||
      !selectedImage.complete ||
      selectedImage.naturalWidth === 0
    ) {
      return;
    }

    featuredMode = false;
    lightbox.classList.remove("is-featured");

    showLightboxImage(index);

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");

    closeButton.focus();
  }

  function openFeaturedLightbox() {
    if (
      !featuredImage.src ||
      !featuredImage.complete ||
      featuredImage.naturalWidth === 0
    ) {
      return;
    }

    featuredMode = true;

    lightboxImage.src = featuredImage.src;
    lightboxImage.alt = featuredImage.alt;

    lightbox.classList.add("is-featured");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");

    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.classList.remove("is-featured");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");

    featuredMode = false;
  }

  function showPreviousImage() {
    if (featuredMode) return;

    showLightboxImage(currentImageIndex - 1);
  }

  function showNextImage() {
    if (featuredMode) return;

    showLightboxImage(currentImageIndex + 1);
  }

  yearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedYear = button.dataset.year;

      yearButtons.forEach((yearButton) => {
        yearButton.classList.remove("active");
      });

      button.classList.add("active");
      updateGallery(selectedYear);
    });
  });

  featuredImage.addEventListener(
    "click",
    openFeaturedLightbox
  );

  galleryImages.forEach((image, index) => {
    image.addEventListener("click", () => {
      openGalleryLightbox(index);
    });
  });

  closeButton.addEventListener(
    "click",
    closeLightbox
  );

  previousButton.addEventListener(
    "click",
    showPreviousImage
  );

  nextButton.addEventListener(
    "click",
    showNextImage
  );

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft" && !featuredMode) {
      showPreviousImage();
    }

    if (event.key === "ArrowRight" && !featuredMode) {
      showNextImage();
    }
  });

  await loadSupabaseGalleryData();
  updateGallery("2027", false);
});