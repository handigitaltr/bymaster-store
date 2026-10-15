import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "@/lib/utils";

/**
 * Güvenli Markdown gösterimi: ham HTML desteklenmez (XSS'e karşı), bağlantılar yalnızca
 * http(s), mailto, tel ve site içi yollar olabilir.
 */
function safeHref(href: string | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  return null;
}

export function Markdown({ content, className, compact = false }: { content: string; className?: string; compact?: boolean }) {
  return (
    <div className={cx("prose-editorial", compact && "prose-compact", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const safe = safeHref(href);
            if (!safe) return <span>{children}</span>;
            return safe.startsWith("/") ? (
              <Link href={safe}>{children}</Link>
            ) : (
              <a href={safe} target={safe.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          },
          img: () => null,
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
