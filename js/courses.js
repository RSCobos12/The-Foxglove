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