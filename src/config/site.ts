// Site-wide defaults for page metadata and the footer (data-model.md SiteConfig).

export interface SiteConfig {
  /** Site name: the home page title, og:site_name and the suffix of every other title. */
  name: string;
  /** Description used by any page that does not set its own. */
  defaultDescription: string;
  /** Default sharing image, a site path rendered absolute against the build's origin. */
  defaultImage: string;
  /** Alt text for the default sharing image. */
  defaultImageAlt: string;
  /** Open Graph locale; the page language is `en`. */
  locale: string;
  /**
   * Whether search engines may index the site. Off on every deployment until the
   * domain switch (FR-019); the domain-switch follow-up turns it on together with
   * removing `X-Robots-Tag: noindex` from public/_headers.
   */
  indexable: boolean;
  /** Name in the footer copyright line. */
  copyrightName: string;
}

export const site: SiteConfig = {
  name: "Don Coleman",
  defaultDescription: "Writing, projects and consulting from Don Coleman.",
  defaultImage: "/og-default.png",
  defaultImageAlt: "Don Coleman",
  locale: "en_CA",
  indexable: false,
  copyrightName: "Don Coleman",
};
