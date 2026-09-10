'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_FRACTION,
  MIN_FRACTION,
  POSITION_KEY,
  type ReadingPosition,
  parsePositions,
  shouldOffer,
  withPosition,
  withoutPosition,
} from '@/lib/reading-position';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Reading aids for a long page: a progress line, the current section marked in the contents, and
 * an offer to continue where you left off. The reasoning is in docs/11-reading-design.md.
 *
 * One scroll listener, throttled to animation frames, drives all three. The contents lists are
 * server-rendered and this only annotates them with aria-current, so without JavaScript they
 * still work and simply do not highlight.
 *
 * Continuing is offered, never imposed. Being moved on arrival is disorienting, and the reader
 * may have come back to look something up rather than to finish.
 */

/** How far down the viewport a heading has to pass before its section counts as being read. */
const READING_LINE = 0.3;

/** Once the reader has got this far on their own, the offer has no job left to do. */
const OFFER_EXPIRES_AT = 0.1;

const SAVE_INTERVAL_MS = 1500;

function loadAll(): Record<string, ReadingPosition> {
  try {
    return parsePositions(window.localStorage.getItem(POSITION_KEY));
  } catch {
    return {};
  }
}

function storeAll(map: Record<string, ReadingPosition>) {
  try {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(map));
  } catch {
    /* storage blocked or full: a convenience, not a requirement */
  }
}

export function ReadingAids({
  kind,
  id,
  headings,
}: {
  kind: string;
  id: string;
  headings: Heading[];
}) {
  const key = `${kind}:${id}`;
  const fill = useRef<HTMLDivElement>(null);
  const [offer, setOffer] = useState<ReadingPosition | null>(null);
  /* While an offer is showing, the saved place must not be overwritten by a first glance. */
  const offering = useRef(false);

  useEffect(() => {
    /* Arriving at a specific section is a request to be there, not somewhere else. */
    if (window.location.hash) return;
    const saved = loadAll()[key];
    if (saved && shouldOffer(saved, Date.now()) && document.getElementById(saved.headingId)) {
      offering.current = true;
      setOffer(saved);
    }
  }, [key]);

  useEffect(() => {
    const prose = document.querySelector<HTMLElement>('.prose');
    if (!prose) return;

    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        '.rail-list a[href^="#"], .reading-contents a[href^="#"]',
      ),
    );
    const textFor = new Map(headings.map((h) => [h.id, h.text]));

    let frame = 0;
    let active = '';
    let fraction = 0;
    let lastSave = 0;

    const save = () => {
      if (offering.current) return;
      if (fraction >= MAX_FRACTION) {
        storeAll(withoutPosition(loadAll(), key));
        return;
      }
      if (fraction < MIN_FRACTION || !active) return;
      storeAll(
        withPosition(loadAll(), key, {
          headingId: active,
          headingText: textFor.get(active) ?? '',
          fraction,
          at: Date.now(),
        }),
      );
    };

    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      const rect = prose.getBoundingClientRect();
      fraction = rect.height > 0 ? Math.min(1, Math.max(0, (line - rect.top) / rect.height)) : 0;
      fill.current?.style.setProperty('--p', fraction.toFixed(4));

      let current = '';
      for (const t of targets) {
        if (t.getBoundingClientRect().top <= line) current = t.id;
        else break;
      }
      if (current !== active) {
        active = current;
        for (const a of links) {
          if (active && a.hash === `#${active}`) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        }
      }

      if (offering.current && fraction > OFFER_EXPIRES_AT) {
        offering.current = false;
        setOffer(null);
      }

      const now = Date.now();
      if (now - lastSave > SAVE_INTERVAL_MS) {
        lastSave = now;
        save();
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') save();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      save();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [key, headings]);

  const continueReading = useCallback(() => {
    if (!offer) return;
    offering.current = false;
    setOffer(null);
    const heading = document.getElementById(offer.headingId);
    if (!heading) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    /* Move focus too, so keyboard and screen-reader users arrive where the page did. */
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }, [offer]);

  const dismiss = useCallback(() => {
    offering.current = false;
    setOffer(null);
  }, []);

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <div ref={fill} className="reading-progress-fill" />
      </div>
      {offer && (
        <div className="resume" role="status">
          <span>
            You were reading <strong>{offer.headingText || 'this page'}</strong>.
          </span>
          <span className="row" style={{ gap: 'var(--s2)' }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={continueReading}>
              Continue
            </button>
            <button type="button" className="btn btn-sm" onClick={dismiss}>
              Read from the start
            </button>
          </span>
        </div>
      )}
    </>
  );
}
