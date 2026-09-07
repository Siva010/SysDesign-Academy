'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MiniSearch from 'minisearch';
import { CONCEPTS } from '@/content/concepts';
import { SYMPTOMS } from '@/content/symptoms';
import {
  KIND_LABEL,
  boostByConcepts,
  expandQuery,
  type SearchDoc,
  type SearchIndexPayload,
} from '@/lib/search';

const CONCEPT_LITE = CONCEPTS.map((c) => ({ id: c.id, name: c.name, aliases: c.aliases }));

interface Result {
  doc: SearchDoc;
  score: number;
  matchedConcepts: string[];
}

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [payload, setPayload] = useState<SearchIndexPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`index request failed: ${r.status}`);
        return r.json() as Promise<SearchIndexPayload>;
      })
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch(() => {
        if (!cancelled) setError('Search index could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const engine = useMemo(() => {
    if (!payload) return null;
    const ms = new MiniSearch<SearchDoc>({
      fields: ['title', 'summary', 'text'],
      storeFields: ['id'],
      searchOptions: {
        boost: { title: 4, summary: 2 },
        prefix: true,
        fuzzy: 0.2,
      },
    });
    ms.addAll(payload.docs);
    return ms;
  }, [payload]);

  const docsById = useMemo(() => {
    const m = new Map<string, SearchDoc>();
    for (const d of payload?.docs ?? []) m.set(d.id, d);
    return m;
  }, [payload]);

  const expansion = useMemo(
    () => expandQuery(query, SYMPTOMS, CONCEPT_LITE),
    [query],
  );

  const results: Result[] = useMemo(() => {
    if (!engine || query.trim().length < 2) return [];
    const raw = engine.search(query, { prefix: true, fuzzy: 0.2 }).map((r) => ({
      id: String(r.id),
      score: r.score,
    }));
    return boostByConcepts(raw, docsById, expansion.concepts).slice(0, 24);
  }, [engine, query, docsById, expansion]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (r: Result | undefined) => {
    if (!r) return;
    onClose();
    router.push(r.doc.url);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div
      className="search-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search">
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search concepts, or describe a symptom: 'database gets slow'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search"
          autoComplete="off"
        />

        {expansion.reason && (
          <div className="search-reason">
            <strong>Interpreting this as:</strong> {expansion.reason}
          </div>
        )}

        <div className="search-results" role="listbox" aria-label="Search results">
          {error && <p className="search-empty">{error}</p>}

          {!error && !payload && query.length >= 2 && (
            <p className="search-empty">Loading index…</p>
          )}

          {!error && query.length < 2 && (
            <div className="search-empty">
              <p className="small muted" style={{ marginBottom: '0.75rem' }}>
                Search understands symptoms, not just keywords. Try one of these:
              </p>
              <div className="chip-row">
                {[
                  'database gets slow',
                  'duplicate payment',
                  'the queue keeps growing',
                  'should I use kafka',
                  'we lost data',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setQuery(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((r, i) => (
            <button
              key={r.doc.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`search-result${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              <div className="search-result-head">
                <span className="chip">{KIND_LABEL[r.doc.kind]}</span>
                <span className="search-result-title">{r.doc.title}</span>
                {typeof r.doc.level === 'number' && (
                  <span className="tiny faint">Level {r.doc.level}</span>
                )}
              </div>
              <div className="search-result-summary">{r.doc.summary}</div>
              {r.matchedConcepts.length > 0 && (
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  via{' '}
                  {r.matchedConcepts
                    .slice(0, 4)
                    .map((c) => payload?.conceptNames[c] ?? c)
                    .join(' · ')}
                </div>
              )}
            </button>
          ))}

          {!error && payload && query.length >= 2 && results.length === 0 && (
            <p className="search-empty">
              Nothing matched. Try describing what you observed rather than naming a technology.
            </p>
          )}
        </div>

        <div className="search-footer tiny faint">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>{payload ? `${payload.docs.length} documents` : ''}</span>
        </div>
      </div>
    </div>
  );
}
