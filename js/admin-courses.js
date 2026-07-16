(async () => {
  await window.adminSidebarReady;

  const {
    data: { session },
  } = await foxgloveSupabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const { data: currentProfile, error: profileError } =
    await foxgloveSupabase
      .from("profiles")
      .select("first_name, role, is_active")
      .eq("id", session.user.id)
      .single();

  if (
    profileError ||
    !currentProfile ||
    currentProfile.role !== "admin" ||
    !currentProfile.is_active
  ) {
    await foxgloveSupabase.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  const welcomeMessage =
    document.querySelector("#admin-welcome");

  const addCourseButton =
    document.querySelector("#add-course-button");

  const courseCount =
    document.querySelector("#course-count");

  const statusMessage =
    document.querySelector("#courses-admin-message");

  const coursesList =
    document.querySelector("#courses-admin-list");

  const editorPanel =
    document.querySelector("#course-editor-panel");

  const editorTitle =
    document.querySelector("#course-editor-title");

  const editorForm =
    document.querySelector("#course-editor-form");

  const courseId =
    document.querySelector("#course-id");

  const courseName =
    document.querySelector("#course-name");

  const courseLocation =
    document.querySelector("#course-location");

  const coursePar =
    document.querySelector("#course-par");

  const courseRating =
    document.querySelector("#course-rating");

  const courseSlope =
    document.querySelector("#course-slope");

  const courseDisplayOrder =
    document.querySelector("#course-display-order");

  const courseImagePath =
    document.querySelector("#course-image-path");

  const courseWebsite =
    document.querySelector("#course-website");

  const courseDescription =
    document.querySelector("#course-description");

  const cancelCourseButton =
    document.querySelector("#cancel-course-button");

  const saveCourseButton =
    document.querySelector("#save-course-button");

  const logoutButton =
    document.querySelector("#logout-button");

  welcomeMessage.textContent =
    `Welcome back, ${currentProfile.first_name}.`;

  let courses = [];

  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", isError);
    statusMessage.hidden = false;
  }

  function hideMessage() {
    statusMessage.hidden = true;
    statusMessage.classList.remove("is-error");
  }

  function updateCourseCount() {
    courseCount.textContent =
      `${courses.length} ${courses.length === 1 ? "course" : "courses"}`;
  }

  function resetEditor() {
    editorForm.reset();
    courseId.value = "";
    editorTitle.textContent = "Add Course";
    editorPanel.hidden = true;
  }

  function openAddEditor() {
    editorForm.reset();
    courseId.value = "";

    const nextDisplayOrder =
      courses.length === 0
        ? 1
        : Math.max(
            ...courses.map((course) => course.display_order)
          ) + 1;

    courseDisplayOrder.value = nextDisplayOrder;
    editorTitle.textContent = "Add Course";
    editorPanel.hidden = false;

    editorPanel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function openEditEditor(course) {
    courseId.value = course.id;
    courseName.value = course.name;
    courseLocation.value = course.location;
    coursePar.value = course.par;
    courseRating.value = course.rating;
    courseSlope.value = course.slope;
    courseDisplayOrder.value = course.display_order;
    courseImagePath.value = course.image_path;
    courseWebsite.value = course.website_url;
    courseDescription.value = course.description;

    editorTitle.textContent = `Edit ${course.name}`;
    editorPanel.hidden = false;

    editorPanel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function createCourseRow(course) {
    const row = document.createElement("article");
    row.className = "courses-admin-row";

    const summary = document.createElement("div");
    summary.className = "courses-admin-summary";

    const order = document.createElement("div");
    order.className = "courses-admin-order";
    order.textContent = course.display_order;

    const text = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = course.name;

    const location = document.createElement("p");
    location.textContent = course.location;

    text.append(name, location);
    summary.append(order, text);

    const actions = document.createElement("div");
    actions.className = "courses-admin-actions";

    const moveUpButton = document.createElement("button");
    moveUpButton.type = "button";
    moveUpButton.className = "admin-secondary-button";
    moveUpButton.textContent = "Move Up";
    moveUpButton.disabled =
      course.display_order ===
      Math.min(...courses.map((item) => item.display_order));

    moveUpButton.addEventListener("click", async () => {
      await moveCourse(course, -1);
    });

    const moveDownButton = document.createElement("button");
    moveDownButton.type = "button";
    moveDownButton.className = "admin-secondary-button";
    moveDownButton.textContent = "Move Down";
    moveDownButton.disabled =
      course.display_order ===
      Math.max(...courses.map((item) => item.display_order));

    moveDownButton.addEventListener("click", async () => {
      await moveCourse(course, 1);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "admin-secondary-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      openEditEditor(course);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className =
      "admin-secondary-button is-danger";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Remove ${course.name} from the public Courses page?`
      );

      if (!confirmed) return;

      await removeCourse(course);
    });

    actions.append(
      moveUpButton,
      moveDownButton,
      editButton,
      removeButton
    );

    row.append(summary, actions);

    return row;
  }

  function renderCourses() {
    coursesList.innerHTML = "";
    updateCourseCount();

    if (courses.length === 0) {
      coursesList.hidden = true;
      showMessage("No courses have been added.");
      return;
    }

    hideMessage();
    coursesList.hidden = false;

    courses
      .slice()
      .sort(
        (a, b) =>
          a.display_order - b.display_order
      )
      .forEach((course) => {
        coursesList.appendChild(
          createCourseRow(course)
        );
      });
  }

  async function loadCourses() {
    showMessage("Loading course library...");
    coursesList.hidden = true;

    const { data, error } =
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
      showMessage(
        "Unable to load the course library.",
        true
      );
      return;
    }

    courses = data || [];
    renderCourses();
  }

  async function moveCourse(course, direction) {
    const sortedCourses = courses
      .slice()
      .sort(
        (a, b) =>
          a.display_order - b.display_order
      );

    const currentIndex = sortedCourses.findIndex(
      (item) => item.id === course.id
    );

    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= sortedCourses.length
    ) {
      return;
    }

    const targetCourse = sortedCourses[targetIndex];

    showMessage("Updating course order...");

    const temporaryOrder = -1;

    const { error: tempError } =
      await foxgloveSupabase
        .from("courses")
        .update({
          display_order: temporaryOrder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);

    if (tempError) {
      showMessage(
        "Unable to update course order.",
        true
      );
      return;
    }

    const { error: targetError } =
      await foxgloveSupabase
        .from("courses")
        .update({
          display_order: course.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetCourse.id);

    if (targetError) {
      await foxgloveSupabase
        .from("courses")
        .update({
          display_order: course.display_order,
        })
        .eq("id", course.id);

      showMessage(
        "Unable to update course order.",
        true
      );
      return;
    }

    const { error: finalError } =
      await foxgloveSupabase
        .from("courses")
        .update({
          display_order: targetCourse.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);

    if (finalError) {
      showMessage(
        "Unable to update course order.",
        true
      );
      return;
    }

    await loadCourses();
  }

  async function removeCourse(course) {
    showMessage(`Removing ${course.name}...`);

    const { error } =
      await foxgloveSupabase
        .from("courses")
        .delete()
        .eq("id", course.id);

    if (error) {
      showMessage(
        "Unable to remove the course.",
        true
      );
      return;
    }

    const remainingCourses = courses
      .filter((item) => item.id !== course.id)
      .sort(
        (a, b) =>
          a.display_order - b.display_order
      );

    for (
      let index = 0;
      index < remainingCourses.length;
      index += 1
    ) {
      const expectedOrder = index + 1;
      const remainingCourse = remainingCourses[index];

      if (
        remainingCourse.display_order !== expectedOrder
      ) {
        await foxgloveSupabase
          .from("courses")
          .update({
            display_order: expectedOrder,
            updated_at: new Date().toISOString(),
          })
          .eq("id", remainingCourse.id);
      }
    }

    resetEditor();
    await loadCourses();
  }

  editorForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      saveCourseButton.disabled = true;
      saveCourseButton.textContent = "Saving...";

      const record = {
        name: courseName.value.trim(),
        location: courseLocation.value.trim(),
        description: courseDescription.value.trim(),
        par: Number(coursePar.value),
        rating: Number(courseRating.value),
        slope: Number(courseSlope.value),
        website_url: courseWebsite.value.trim(),
        image_path: courseImagePath.value.trim(),
        display_order: Number(
          courseDisplayOrder.value
        ),
        updated_at: new Date().toISOString(),
      };

      let error;

      if (courseId.value) {
        const result =
          await foxgloveSupabase
            .from("courses")
            .update(record)
            .eq("id", courseId.value);

        error = result.error;
      } else {
        const result =
          await foxgloveSupabase
            .from("courses")
            .insert(record);

        error = result.error;
      }

      if (error) {
        showMessage(
          error.code === "23505"
            ? "That display order is already in use."
            : "Unable to save the course.",
          true
        );

        saveCourseButton.disabled = false;
        saveCourseButton.textContent =
          "Save Course";

        return;
      }

      resetEditor();
      await loadCourses();

      saveCourseButton.disabled = false;
      saveCourseButton.textContent =
        "Save Course";
    }
  );

  addCourseButton.addEventListener(
    "click",
    openAddEditor
  );

  cancelCourseButton.addEventListener(
    "click",
    resetEditor
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      await foxgloveSupabase.auth.signOut();
      window.location.replace("login.html");
    }
  );

  await loadCourses();
})();