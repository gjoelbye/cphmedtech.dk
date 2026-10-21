import { isEventUpcoming } from '../utils/event-dates';

// Pages are built ahead of time, so re-check event dates against today
// in case the site hasn't been redeployed since an event took place.

document.querySelectorAll<HTMLElement>('[data-event-phase]').forEach((el) => {
  const upcoming = isEventUpcoming(el.dataset.eventDate ?? '');
  el.hidden = (el.dataset.eventPhase === 'upcoming') !== upcoming;
});

document.querySelectorAll<HTMLElement>('[data-upcoming-list]').forEach((list) => {
  let visible = 0;
  list.querySelectorAll<HTMLElement>('[data-event-date]').forEach((card) => {
    card.hidden = !isEventUpcoming(card.dataset.eventDate ?? '');
    if (!card.hidden) visible++;
  });
  list.hidden = visible === 0;
  const empty = list.parentElement?.querySelector<HTMLElement>('[data-upcoming-empty]');
  if (empty) empty.hidden = visible > 0;
});
