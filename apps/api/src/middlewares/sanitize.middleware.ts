import sanitizeHtml from 'sanitize-html';

/**
 * HTML sanitization configuration
 * Allows safe HTML tags while preventing XSS attacks
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    // Paragraphs and breaks
    'p', 'br', 'hr',
    // Lists
    'ul', 'ol', 'li',
    // Links
    'a',
    // Code
    'code', 'pre',
    // Quotes
    'blockquote',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Images (be careful with src)
    'img',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    '*': ['class'], // Allow class on all elements for styling
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Ensure links open safely
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
  },
  // Strip all script tags and their contents
  exclusiveFilter: (frame) => {
    return frame.tag === 'script' || frame.tag === 'style';
  },
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Used for post details and comment values
 */
export function sanitizeContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return sanitizeHtml(html, sanitizeOptions);
}

/**
 * Strict sanitization - removes ALL HTML
 * Used for titles and other plain text fields
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Convert markdown-style content to plain text
 * Extracts text content from HTML
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Remove HTML tags and decode entities
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
