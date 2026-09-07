import { CONCEPTS } from '../src/content/concepts';
import { CONCEPT_LEVEL } from '../src/content/level-concepts';
import { loadAllLessons } from '../src/lib/content-node';
const taught = new Set(loadAllLessons().flatMap((l) => l.concepts));
const byLevel: Record<number, string[]> = {};
for (const c of CONCEPTS) {
  if (taught.has(c.id)) continue;
  const lv = CONCEPT_LEVEL[c.id] ?? -1;
  (byLevel[lv] ??= []).push(c.id);
}
for (const [lv, ids] of Object.entries(byLevel).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`\nLEVEL ${lv} (${ids.length}):`);
  console.log('  ' + ids.join(', '));
}
