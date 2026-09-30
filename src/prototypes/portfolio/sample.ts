// Sample content for the three portfolio directions (data-model.md).
//
// DRAFT FOR REVIEW: the Focus Pocus story below was drafted by Claude from the
// public sources (https://drc.dev, https://drc.dev/projects/focus-pocus and
// https://github.com/drcdev/focus-pocus). Facts taken from those pages: the
// MCP server, TypeScript and Node.js, JXA, 35+ tools, 39 JXA scripts, natural
// language dates, bulk operations, caching for large databases, macOS-only.
// The options considered, the constraints' framing, the reasons and the
// lessons are Claude's plain-language reading of them, and Don should correct
// them. Themes and status for every entry are a draft as well.
import type {
  Constraint,
  Direction,
  ProjectEntry,
  SampleStory,
  StoryOption,
  StoryStage,
  Visual,
} from "./types.ts";

const REVIEW_NOTE = "Themes and status are a draft for Don's review.";
const projectPage = (slug: string) => `https://drc.dev/projects/${slug}`;

const screenshot: Visual = {
  kind: "placeholder",
  media: "screenshot",
  label: "Screenshot of Claude Desktop managing OmniFocus tasks",
  description: "A chat in Claude Desktop where a request for tasks due this week is answered from OmniFocus.",
};

const clip: Visual = {
  kind: "placeholder",
  media: "clip",
  label: "Short clip of a task being created by conversation",
  description: "A few seconds of a task being created from a plain sentence and appearing in OmniFocus. No autoplay.",
};

const architecture: Visual = {
  kind: "diagram",
  id: "architecture",
  label: "How Focus Pocus connects Claude Desktop to OmniFocus",
  description:
    "Claude Desktop calls the Focus Pocus MCP server, which runs JXA scripts that read and change tasks in OmniFocus.",
};

const optionsVisual: Visual = {
  kind: "diagram",
  id: "options",
  label: "The three ways to reach OmniFocus that were considered",
  description:
    "Three routes lead from the goal of managing tasks by conversation: an AppleScript bridge, the OmniFocus URL scheme, and JXA scripts behind an MCP server. The JXA route is the one chosen.",
};

const stages: StoryStage[] = [
  {
    id: "problem",
    heading: "The problem",
    body: [
      "OmniFocus holds the task list, but working with it means switching apps and clicking through screens.",
      "The aim was to ask for what is needed in plain sentences, from inside Claude Desktop, and have OmniFocus do it.",
    ],
    visual: screenshot,
    draft: true,
  },
  {
    id: "constraints",
    heading: "What made it hard",
    body: [
      "OmniFocus can only be automated on a Mac, so everything had to run locally and ask macOS for permission.",
      "People say dates in many ways, such as \"next Friday at 2pm\" or \"in 3 days\", and the tool had to read them correctly.",
      "Changing many tasks at once must not slow down a database of a thousand tasks or more.",
      "Claude Desktop talks to outside tools through the Model Context Protocol, so the tool had to fit that model.",
    ],
    draft: true,
  },
  {
    id: "options",
    heading: "Options considered",
    body: [
      "Three routes were open. Each one reaches OmniFocus differently, and each one meets the four constraints to a different degree.",
    ],
    visual: optionsVisual,
    draft: true,
  },
  {
    id: "built",
    heading: "What was built",
    body: [
      "Focus Pocus is an MCP server written in TypeScript on Node.js. It gives Claude Desktop more than 35 tools for tasks, projects and tags.",
      "Behind the tools are 39 JXA scripts that do the work inside OmniFocus. A cache with pagination keeps large databases responsive, and a diagnostics tool checks the setup.",
    ],
    visual: architecture,
    draft: true,
  },
  {
    id: "outcome",
    heading: "How it turned out",
    body: [
      "Tasks can be created, updated and managed by conversation, including in bulk, with dates read from everyday phrases.",
      "Claude can also open the Inbox, Forecast, Flagged and Projects views, and balance work across the schedule.",
    ],
    visual: clip,
    draft: true,
  },
  {
    id: "lessons",
    heading: "What I learned",
    body: [
      "Coding with an AI assistant went fastest when the boundary between the assistant and the app was small and well named.",
      "Limits remain: it only runs on macOS, it needs automation permission, and the first run on a large database is slower.",
      "More detail is in the blog post about building Focus Pocus.",
    ],
    draft: true,
  },
  {
    id: "invitation",
    heading: "Have a problem like this?",
    body: ["If a tool you use every day could work better with an AI assistant, tell me about it."],
    draft: true,
  },
];

const constraints: Constraint[] = [
  { id: "macos-only", label: "Works on macOS", detail: "OmniFocus is automated through macOS, with permission granted by the user." },
  { id: "natural-dates", label: "Natural-language dates", detail: "Phrases such as \"next Friday at 2pm\" become real due dates." },
  { id: "bulk-speed", label: "Fast bulk changes", detail: "Changing many tasks does not slow a large OmniFocus database." },
  { id: "mcp-model", label: "Fits Claude Desktop's MCP model", detail: "The tool is offered to Claude as a set of MCP tools." },
];

const options: StoryOption[] = [
  {
    id: "applescript-bridge",
    name: "AppleScript bridge",
    summary: "Send AppleScript commands to OmniFocus from a small helper.",
    pros: ["Long-established and well documented for OmniFocus."],
    cons: ["Awkward to write and test, and hard to return structured data."],
    fit: { "macos-only": "meets", "natural-dates": "partly", "bulk-speed": "partly", "mcp-model": "partly" },
    chosen: false,
  },
  {
    id: "url-scheme",
    name: "OmniFocus URL scheme",
    summary: "Open omnifocus:// links to add or change tasks.",
    pros: ["No scripting and no permission prompts."],
    cons: ["Cannot read tasks back, so questions about the task list cannot be answered."],
    fit: { "macos-only": "meets", "natural-dates": "misses", "bulk-speed": "misses", "mcp-model": "misses" },
    chosen: false,
  },
  {
    id: "jxa-mcp",
    name: "JXA scripts behind an MCP server",
    summary: "Run JavaScript for Automation scripts from a TypeScript MCP server that Claude Desktop calls.",
    pros: ["Reads and writes tasks with structured results.", "Scripts are plain JavaScript that can be tested."],
    cons: ["JXA is thinly documented, so each script takes trial and error."],
    fit: { "macos-only": "meets", "natural-dates": "meets", "bulk-speed": "meets", "mcp-model": "meets" },
    chosen: true,
    reason:
      "It is the only route that can both read and change OmniFocus, return structured results, and be offered to Claude as MCP tools.",
  },
];

const focusPocusEntry: ProjectEntry = {
  slug: "focus-pocus",
  title: "Focus Pocus",
  problem: "Manage OmniFocus tasks by talking to Claude Desktop instead of clicking through screens.",
  visual: screenshot,
  themes: ["AI integration", "Developer tools", "Productivity"],
  status: "shipped",
  storyPath: "/focus-pocus/",
  externalHref: projectPage("focus-pocus"),
  reviewNote: REVIEW_NOTE,
};

export const focusPocus: SampleStory = {
  entry: focusPocusEntry,
  stages,
  constraints,
  options,
  demo: {
    live: false,
    href: "https://drc.dev/projects/focus-pocus",
    secondaryHref: "https://github.com/drcdev/focus-pocus",
    standInNote: "Focus Pocus has no live demo. This link opens its project page instead.",
    still: clip,
  },
};

const placeholderFor = (title: string): Visual => ({
  kind: "placeholder",
  media: "screenshot",
  label: `Screenshot of ${title}`,
  description: `A screenshot of ${title} will go here.`,
});

export const otherEntries: ProjectEntry[] = [
  {
    slug: "tempo",
    title: "Tempo",
    problem: "A routine timer that keeps a daily routine moving at its own rhythm.",
    visual: placeholderFor("Tempo"),
    themes: ["Mobile", "Productivity"],
    status: "in-progress",
    externalHref: projectPage("tempo"),
    reviewNote: REVIEW_NOTE,
  },
  {
    slug: "flux",
    title: "Flux",
    problem: "A Ghost theme that helps readers find more to read, with AI-powered engagement.",
    visual: placeholderFor("Flux"),
    themes: ["AI integration", "Design systems", "Web"],
    status: "shipped",
    externalHref: projectPage("flux"),
    reviewNote: REVIEW_NOTE,
  },
  {
    slug: "drcdev-github-io",
    title: "drc.dev",
    problem: "A portfolio site that shows this work in one place.",
    visual: placeholderFor("drc.dev"),
    themes: ["Design systems", "Web"],
    status: "shipped",
    externalHref: projectPage("drcdev-github-io"),
    reviewNote: REVIEW_NOTE,
  },
  {
    slug: "plunge-buddy",
    title: "Plunge Buddy",
    problem: "Check cold plunge conditions near you in real time.",
    visual: placeholderFor("Plunge Buddy"),
    themes: ["Mobile"],
    status: "experiment",
    externalHref: projectPage("plunge-buddy"),
    reviewNote: REVIEW_NOTE,
  },
];

export const allEntries: ProjectEntry[] = [focusPocus.entry, ...otherEntries];

export const directions: Direction[] = [
  {
    key: "a",
    name: "Timeline",
    summary: "Stages sit on a vertical rail, options open in place, and each stage fades up as it scrolls in.",
    indexPath: "/design/portfolio/a/",
    storyPath: "/design/portfolio/a/focus-pocus/",
    behaviours: {
      stages: "Seven stages on a vertical rail, one after another.",
      options: "Each option opens in place; the chosen one starts open.",
      demo: "A link to the project page inside the built stage.",
      reveals: "Each stage fades and rises into view as it scrolls in.",
    },
    dimensions: {
      storyLayout: "vertical rail",
      stageMovement: "scroll-driven fade and rise",
      optionPattern: "disclosure",
      indexStructure: "chronological list",
      revealStyle: "scroll-driven, no page transition",
    },
    javascript: ["filter"],
    newResources: [],
  },
  {
    key: "b",
    name: "Cards",
    summary: "Stages are stacked cards, options are tabs, and the index is a grid of cards.",
    indexPath: "/design/portfolio/b/",
    storyPath: "/design/portfolio/b/focus-pocus/",
    behaviours: {
      stages: "Seven stacked cards with no sticky parts.",
      options: "One tab per option; the chosen one is selected first.",
      demo: "A demo panel with a still frame and a link.",
      reveals: "Cards rise in one after another, and the page changes with a view transition.",
    },
    dimensions: {
      storyLayout: "stacked cards",
      stageMovement: "staggered card reveal",
      optionPattern: "tabs",
      indexStructure: "bento grid",
      revealStyle: "staggered cards with view transition",
    },
    javascript: ["filter", "option-tabs"],
    newResources: [],
  },
  {
    key: "c",
    name: "Chapters",
    summary: "Full-width chapters with a sticky visual and progress rail, and options compared in a table.",
    indexPath: "/design/portfolio/c/",
    storyPath: "/design/portfolio/c/focus-pocus/",
    behaviours: {
      stages: "Seven full-width chapters with a progress rail.",
      options: "A comparison table of constraints against options.",
      demo: "A sticky visual panel beside the chapter text.",
      reveals: "Chapters reveal as they scroll in, and the page changes with a view transition.",
    },
    dimensions: {
      storyLayout: "full-width chapters with sticky visual",
      stageMovement: "chapter progress rail",
      optionPattern: "comparison table",
      indexStructure: "chapter list",
      revealStyle: "chapter reveal with view transition",
    },
    javascript: ["filter"],
    newResources: [],
  },
];
