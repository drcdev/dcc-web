// Plain share links for a post (data-model.md "Share links"; FR-028; research R10).
// Only the post's title and full address go into a link: no tracking or campaign parameters.

export interface ShareLinks {
  linkedin: string;
  email: string;
}

export function shareLinks(title: string, url: string): ShareLinks {
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  };
}
