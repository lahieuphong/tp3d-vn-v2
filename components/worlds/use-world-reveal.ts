'use client';

import { useEffect, type RefObject } from 'react';

export function useWorldReveal(
  root: RefObject<HTMLElement | null>,
  signature: string,
) {
  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;
    const cards = [
      ...element.querySelectorAll<HTMLElement>('[data-world-card]'),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            card.dataset.reveal = 'visible';
            observer.unobserve(card);
          }
      },
      { threshold: 0.06 },
    );
    const revealAll = () => {
      observer.disconnect();
      cards.forEach((card) => {
        card.dataset.reveal = 'visible';
      });
    };
    const focusReveal = (event: FocusEvent) => {
      const card =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-world-card]')
          : null;
      if (card) {
        card.dataset.reveal = 'visible';
        observer.unobserve(card);
      }
    };
    const columns = Math.max(
      1,
      getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    cards.forEach((card, index) => {
      if (card.dataset.reveal) return;
      if (card.getBoundingClientRect().top < window.innerHeight) {
        card.dataset.reveal = 'visible';
        return;
      }
      card.dataset.reveal = 'pending';
      card.style.setProperty('--reveal-delay', `${(index % columns) * 70}ms`);
      observer.observe(card);
    });
    element.addEventListener('focusin', focusReveal);
    reduced.addEventListener('change', revealAll);
    return () => {
      revealAll();
      element.removeEventListener('focusin', focusReveal);
      reduced.removeEventListener('change', revealAll);
    };
  }, [root, signature]);
}
