import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
  className?: string;
  hideImages?: boolean; // optionally suppress <img> rendering (useful for summaries)
  summaryMode?: boolean; // flatten headings/lists/paragraphs for compact summaries
};

export default function Markdown({ content, className, hideImages = false, summaryMode = false }: Props) {
  // Normalize escaped newlines that often come from CSV/JSON imports ("\n" -> real newline)
  const normalized = typeof content === 'string'
    ? content.replace(/\\r\\n|\\n/g, '\n')
    : '';
  const headingAsSpan = (props: any) => <span className="font-semibold">{props.children}</span>;
  const listAsSpan = (props: any) => <span>{props.children}</span>;
  const liAsSpan = (props: any) => <span>{' \u2022 '}{props.children}</span>;
  const pAsSpan = (props: any) => <span>{props.children} </span>;
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // We intentionally do NOT enable raw HTML to avoid XSS; pure Markdown supports bold/italic/images/links.
        components={{
          img: ({ node, ...props }: any) => (hideImages || summaryMode) ? null : (
            // Use native img for flexible sizes; styled to fit layout.
            // eslint-disable-next-line @next/next/no-img-element
            <img {...props} alt={props.alt || ''} className="rounded-md border my-4 max-w-full h-auto" />
          ),
          a: ({ node, ...props }: any) => (
            <a {...props} target={props.target || '_blank'} rel="noopener noreferrer" className="underline text-primary" />
          ),
          ...(summaryMode ? {
            h1: headingAsSpan,
            h2: headingAsSpan,
            h3: headingAsSpan,
            h4: headingAsSpan,
            h5: headingAsSpan,
            h6: headingAsSpan,
            ul: listAsSpan,
            ol: listAsSpan,
            li: liAsSpan,
            p: pAsSpan,
            br: () => <span> </span>,
          } : {
            // Default, non-summary rendering with site-consistent typography
            h1: ({ node, ...props }: any) => (
              <h1 {...props} className="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-4" />
            ),
            h2: ({ node, ...props }: any) => (
              <h2 {...props} className="text-2xl md:text-3xl font-semibold tracking-tight mt-8 mb-3" />
            ),
            h3: ({ node, ...props }: any) => (
              <h3 {...props} className="text-xl font-semibold tracking-tight mt-6 mb-2" />
            ),
            h4: ({ node, ...props }: any) => (
              <h4 {...props} className="text-lg font-semibold tracking-tight mt-4 mb-2" />
            ),
            p: ({ node, ...props }: any) => (
              <p {...props} className="leading-7 my-4" />
            ),
            ul: ({ node, ...props }: any) => (
              <ul {...props} className="my-4 list-disc pl-6 space-y-1" />
            ),
            ol: ({ node, ...props }: any) => (
              <ol {...props} className="my-4 list-decimal pl-6 space-y-1" />
            ),
            li: ({ node, ...props }: any) => (
              <li {...props} className="ml-0" />
            ),
            blockquote: ({ node, ...props }: any) => (
              <blockquote {...props} className="border-l-2 pl-4 my-4 text-muted-foreground" />
            ),
            hr: ({ node, ...props }: any) => (
              <hr {...props} className="my-8 border-border" />
            ),
            code: ({ node, inline, className: cn, children, ...props }: any) => (
              inline ? (
                <code {...props} className="px-1 py-0.5 rounded bg-muted text-foreground" >{children}</code>
              ) : (
                <code {...props} className="px-1 py-0.5 rounded bg-muted text-foreground" >{children}</code>
              )
            ),
            pre: ({ node, ...props }: any) => (
              <pre {...props} className="my-4 overflow-x-auto rounded border p-4 bg-muted" />
            ),
          }),
          // You can extend other elements as needed (code blocks, blockquotes, etc.)
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
