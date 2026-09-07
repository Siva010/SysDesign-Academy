'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/* The dialog pulls in MiniSearch and the concept table; keep it out of the initial bundle. */
const SearchDialog = dynamic(() => import('./SearchDialog').then((m) => m.SearchDialog), {
  ssr: false,
});

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === '/' && !open) {
        const t = e.target as HTMLElement | null;
        const typing =
          t &&
          (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="search-trigger" onClick={() => setOpen(true)}>
        <span>Search or describe a problem</span>
        <kbd>/</kbd>
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}
