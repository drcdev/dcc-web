// Blog settings in one place (data-model.md "Blog settings"; research R5;
// FR-027). Every page, the feed and the views note read these values.

export const blog = {
  /** The blog's name, shown as the eyebrow above every blog page title. */
  sectionName: "Drift & Convergence",
  feedTitle: "Drift & Convergence",
  feedDescription: "Writing by Don Coleman on compliant data, technology teams, agentic AI and healthcare leadership.",
  /** The landing page's description (search results and link previews). Draft wording for Don to revise. */
  landingDescription:
    "Drift & Convergence is Don Coleman's writing on compliant data, technology teams, agentic AI and healthcare leadership, in two series: Convergence and Drift.",
  /** The sentence that opens the series lead on the landing page. Draft wording for Don to revise. */
  seriesIntro: "My writing runs in two series. Each has its own page, so you can start with the one that fits.",
  /** Posts on one listing page. */
  pageSize: 12,
  /** Featured posts on the landing page. */
  featuredMax: 3,
  /** Latest posts on the landing page. */
  latestMax: 6,
  /** Posts in the home page's "Recent writing" section. */
  recentMax: 3,
  /** Related posts under a post. */
  relatedMax: 3,
  /** Shown under every post. Placeholder wording until Don supplies his own. */
  viewsNote: "The views in this post are my own and do not represent any employer or client.",
} as const;
