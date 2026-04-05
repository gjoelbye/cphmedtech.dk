// Animated count-up for stat counters, triggered by IntersectionObserver
const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');

if (counters.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.countTo || '0', 10);
        const suffix = el.dataset.countSuffix || '';

        observer.unobserve(el);
        el.classList.add('is-counting');

        const duration = 1200;
        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          el.textContent = current + suffix;

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((el) => observer.observe(el));
}
