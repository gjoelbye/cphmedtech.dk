const cards = document.querySelectorAll('.timeline-card');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  { threshold: 0, rootMargin: '0px 0px -50px 0px' }
);

cards.forEach((card) => observer.observe(card));
