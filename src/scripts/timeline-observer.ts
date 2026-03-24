const cards = document.querySelectorAll('.timeline-card');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  { threshold: 0.1 }
);

cards.forEach((card) => observer.observe(card));
