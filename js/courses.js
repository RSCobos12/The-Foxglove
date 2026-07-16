document.addEventListener("DOMContentLoaded", async () => {
  const coursesGrid =
    document.querySelector("#courses-grid");

  if (!coursesGrid) return;

  const courseCardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => {
            entry.target.classList.add(
              "course-card-visible"
            );
          }, index * 100);

          courseCardObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
    }
  );

  function createStat(label, value) {
    const stat = document.createElement("div");
    const statLabel = document.createElement("span");
    const statValue = document.createElement("strong");

    statLabel.textContent = label;
    statValue.textContent = value;

    stat.append(statLabel, statValue);

    return stat;
  }

  function createCourseCard(course) {
    const article = document.createElement("article");
    article.className = "course-card";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "course-image";

    const image = document.createElement("img");
    image.src =
      `../assets/courses/${course.image_path}`;
    image.alt = course.name;
    image.loading = "lazy";

    imageWrapper.appendChild(image);

    const content = document.createElement("div");
    content.className = "course-content";

    const name = document.createElement("h3");
    name.textContent = course.name;

    const location = document.createElement("p");
    location.className = "course-location";
    location.textContent = course.location;

    const description = document.createElement("p");
    description.className = "course-description";
    description.textContent = course.description;

    const divider = document.createElement("div");
    divider.className = "course-divider";

    const stats = document.createElement("div");
    stats.className = "course-stats";

    stats.append(
      createStat("PAR", course.par),
      createStat("RATING", course.rating),
      createStat("SLOPE", course.slope)
    );

    const websiteLink = document.createElement("a");
    websiteLink.className = "course-link";
    websiteLink.href = course.website_url;
    websiteLink.target = "_blank";
    websiteLink.rel = "noopener noreferrer";
    websiteLink.textContent = "Official Website →";

    content.append(
      name,
      location,
      description,
      divider,
      stats,
      websiteLink
    );

    article.append(imageWrapper, content);

    return article;
  }

  function showCoursesError() {
    coursesGrid.innerHTML = "";

    const message = document.createElement("p");
    message.className = "courses-load-message";
    message.textContent =
      "Course information is temporarily unavailable.";

    coursesGrid.appendChild(message);
  }

  const { data: courses, error } =
    await foxgloveSupabase
      .from("courses")
      .select(`
        id,
        name,
        location,
        description,
        par,
        rating,
        slope,
        website_url,
        image_path,
        display_order
      `)
      .order("display_order", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Unable to load courses:",
      error
    );

    showCoursesError();
    return;
  }

  coursesGrid.innerHTML = "";

  (courses || []).forEach((course) => {
    const card = createCourseCard(course);

    coursesGrid.appendChild(card);
    courseCardObserver.observe(card);
  });
});