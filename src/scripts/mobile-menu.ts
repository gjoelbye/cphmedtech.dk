const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
const toggleBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const closeBtns = document.querySelectorAll<HTMLElement>('[data-menu-close]');

function openMenu() {
  if (!menu || !toggleBtn) return;
  menu.classList.add('is-open');
  menu.setAttribute('aria-hidden', 'false');
  toggleBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  if (!menu || !toggleBtn) return;
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  toggleBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

toggleBtn?.addEventListener('click', () => {
  const isOpen = menu?.classList.contains('is-open');
  if (isOpen) closeMenu();
  else openMenu();
});

closeBtns.forEach((btn) => btn.addEventListener('click', closeMenu));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.classList.contains('is-open')) {
    closeMenu();
    toggleBtn?.focus();
  }
});
