import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { mdxComponents } from '@/components/mdx';

/**
 * Renders an MDX body with the curriculum's component library available.
 *
 * Compilation happens on the server at build time. Authors write prose plus the
 * lesson-template components; they never write raw HTML or per-page styling.
 */
export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          format: 'mdx',
        },
      }}
    />
  );
}
