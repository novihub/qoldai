'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState } from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors"
    >
      {copied ? '  Скопировано' : 'Копировать'}
    </button>
  );
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>
        ),

        // Paragraph
        p: ({ children }) => (
          <p className="mb-3 leading-7">{children}</p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-7">{children}</li>
        ),

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mb-4 bg-blue-500/10 italic">
            {children}
          </blockquote>
        ),

        // Code blocks
        pre: ({ children }) => {
          // Extract text content from children for copy button
          const getTextContent = (node: any): string => {
            if (typeof node === 'string') return node;
            if (Array.isArray(node)) return node.map(getTextContent).join('');
            if (node?.props?.children) return getTextContent(node.props.children);
            return '';
          };
          const codeText = getTextContent(children);

          return (
            <div className="relative group mb-4">
              <CopyButton text={codeText} />
              <pre className="overflow-x-auto p-4 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200">
                {children}
              </pre>
            </div>
          );
        },

        // Inline code
        code: ({ className, children, ...props }) => {
          const isCodeBlock = className?.includes('language-');
          
          if (isCodeBlock) {
            return (
              <code className={`${className} text-sm`} {...props}>
                {children}
              </code>
            );
          }

          return (
            <code className="px-1.5 py-0.5 rounded bg-gray-100 text-blue-600 text-sm font-mono border border-gray-200" {...props}>
              {children}
            </code>
          );
        },

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {children}
          </a>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full h-auto rounded-lg my-4"
          />
        ),

        // Horizontal rule
        hr: () => <hr className="my-6 border-gray-600" />,

        // Tables (GFM)
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-600 rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/5">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-gray-600">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-white/5">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold border-b border-gray-600">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm">{children}</td>
        ),

        // Strong & emphasis
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),

        // Strikethrough (GFM)
        del: ({ children }) => (
          <del className="line-through opacity-60">{children}</del>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
