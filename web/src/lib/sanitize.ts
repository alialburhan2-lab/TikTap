import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark",
    "a", "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "code", "pre", "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    span: ["dir"],
    p: ["dir"],
    "*": [],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    h1: "h2",
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {}),
        },
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

/** تنظيف HTML القادم من المحرر من أي شيفرات ضارة (XSS) */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html || "", OPTIONS);
}

/** تحويل HTML إلى نص عادي (للبحث والملخصات) */
export function htmlToText(html: string): string {
  return sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** نص عادي فقط لأي مدخل نصي قصير */
export function plainText(input: string): string {
  return htmlToText(input);
}

export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
