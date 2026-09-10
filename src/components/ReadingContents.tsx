/**
 * The contents of a long page, for when the side rail is not shown - narrower screens, and focus
 * mode. A 22-screen lesson on a phone previously had no way to see its sections or jump to one.
 *
 * A plain <details>, so it works without JavaScript and costs nothing. ReadingAids marks the
 * current section in it as the reader scrolls. Only top-level sections are listed: on a phone
 * the subsections make the list longer than the screen it is meant to summarise.
 */
export function ReadingContents({
  headings,
}: {
  headings: { id: string; text: string; level: 2 | 3 }[];
}) {
  const sections = headings.filter((h) => h.level === 2);
  if (sections.length < 3) return null;

  return (
    <details className="reading-contents">
      <summary>
        Contents <span className="faint">· {sections.length} sections</span>
      </summary>
      <ol>
        {sections.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
