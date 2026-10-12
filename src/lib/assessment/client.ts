// The browser module of the self-assessment (specs/037 contracts/assessment-ui.md). Loaded lazily
// by the bootstrap script in SelfAssessment.astro. It reads the form, checks it, scores it and
// draws the chart and the text summary. Nothing leaves the page: no request, no storage. It sets
// no `style` attribute (the page policy forbids it); the chart's geometry is SVG attributes.
import stylesheet from "./client.css?url";
import { decodeResult, encodeResult, resultUrl, type AssessmentResult } from "./result-link.ts";
import { band, changeText, formatScore, markerPosition, nextToPractise, selectLowBand, summaryLine, sumOf } from "./score.ts";

interface Data {
  scale: string[];
  title: string;
  shifts: { name: string; from: string; to: string; anchor: string; practicalApplication: string }[];
}

const SVG = "http://www.w3.org/2000/svg";

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgNode<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

const MARK_NOW = "fill-rust-700 dark:fill-rust-300 forced-colors:fill-[Highlight]";
const MARK_EARLIER = "stroke-dusk-900 dark:stroke-white forced-colors:stroke-[CanvasText]";

/** The new result: a filled circle centred on the track position `x` (0 to 100). */
const circleMark = (x: number, radius = 4.5, cy = 6) =>
  svgNode("circle", { cx: String(x), cy: String(cy), r: String(radius), "data-marker": "new", class: MARK_NOW });

/** The earlier result: a hollow diamond, told apart from the circle by shape, not by colour alone. */
const diamondMark = (x: number, half = 6.5, cy = 6) =>
  svgNode("polygon", {
    points: `${x},${cy - half} ${x + half},${cy} ${x},${cy + half} ${x - half},${cy}`,
    fill: "none",
    "stroke-width": "2",
    "stroke-linejoin": "round",
    "data-marker": "earlier",
    class: MARK_EARLIER,
  });

/** What a chart row draws: the new mean, the earlier mean, or both (a comparison). */
interface Marks {
  now?: number;
  earlier?: number;
}

/** One chart row: the shift's name, its From and To wording, and a track with a marker at each mean. */
function chartRow(shift: Data["shifts"][number], marks: Marks): HTMLElement {
  const row = element("div", "mt-4 first:mt-0");
  row.dataset.chartRow = "";
  row.append(element("p", "m-0 font-semibold text-dusk-900 dark:text-white", shift.name));
  const ends = element("div", "mt-1 flex justify-between gap-4 text-sm [overflow-wrap:anywhere]");
  ends.append(element("span", "", shift.from), element("span", "text-right", shift.to));
  const svg = svgNode("svg", { viewBox: "-8 -2 116 16", "aria-hidden": "true", focusable: "false", class: "mt-1 block h-auto w-full max-w-xl" });
  svg.append(
    svgNode("line", {
      "data-chart-track": "",
      x1: "0",
      x2: "100",
      y1: "6",
      y2: "6",
      "stroke-width": "2",
      "stroke-linecap": "round",
      class: "stroke-dusk-600 dark:stroke-dusk-300 forced-colors:stroke-[CanvasText]",
    }),
  );
  if (marks.earlier !== undefined) svg.append(diamondMark(markerPosition(marks.earlier) * 100));
  if (marks.now !== undefined) svg.append(circleMark(markerPosition(marks.now) * 100));
  row.append(ends, svg);
  return row;
}

/** The legend of a comparison: a text label next to each marker. */
function legend(earlierDate: string): HTMLElement {
  const box = element("p", "m-0 mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm");
  box.dataset.chartLegend = "";
  const entry = (mark: SVGElement, text: string) => {
    const item = element("span", "inline-flex items-center gap-2");
    const icon = svgNode("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", class: "size-4 shrink-0" });
    icon.append(mark);
    item.append(icon, text);
    return item;
  };
  box.append(entry(circleMark(8, 5, 8), "Now (filled circle)"), entry(diamondMark(8, 6.5, 8), `Earlier, ${formatDate(earlierDate)} (hollow diamond)`));
  return box;
}

/** A date such as `2026-09-01` shown in words; the date is displayed, never used for arithmetic. */
const formatDate = (iso: string): string => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-CA", { dateStyle: "long", timeZone: "UTC" });

const pad = (n: number): string => String(n).padStart(2, "0");
const today = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * The chart and the text summary for one set of sums. `earlier` is the other result drawn on the
 * same rows (a comparison, which adds the change per shift); `as` says which marker the sums use.
 */
function chartAndSummary(data: Data, sums: number[], as: "now" | "earlier", compareWith?: number[]) {
  const chart = element("div", "mt-4");
  chart.setAttribute("role", "img");
  chart.setAttribute("aria-label", "Chart of where you sit between From and To for each shift. The list below gives the same information in words.");
  chart.dataset.assessmentChart = "";
  const summary = element("ul", "m-0 mt-4 list-none p-0");
  sums.forEach((sum, s) => {
    const shift = data.shifts[s]!;
    chart.append(chartRow(shift, as === "now" ? { now: sum, earlier: compareWith?.[s] } : { earlier: sum }));
    const change = compareWith ? `; ${changeText(compareWith[s]!, sum)} since your earlier result` : "";
    const item = element("li", "mt-2 first:mt-0 [overflow-wrap:anywhere]", summaryLine(shift, sum) + change);
    item.dataset.summaryLine = "";
    item.dataset.band = band(sum);
    item.dataset.score = formatScore(sum);
    summary.append(item);
  });
  return { chart, summary };
}

/**
 * The mindsets to develop (FR-008, FR-010): the shifts below the middle, weakest first, or, when
 * none is, the lowest-scoring shift to practise next. The results and the printed sheet share it.
 */
function focusAreas(data: Data, sums: number[]): { intro: string[]; shifts: number[] } {
  const low = selectLowBand(sums);
  if (low.length > 0) return { intro: [], shifts: low };
  const next = nextToPractise(sums);
  return { intro: ["None of your scores is below the middle.", `Next to practise: ${data.shifts[next]!.name}`], shifts: [next] };
}

/** One mindset to develop: name and score, From → To, its Practical Application and a link to its section. */
function focusItem(shift: Data["shifts"][number], sum: number, link: HTMLElement, className = ""): HTMLElement {
  const item = element("div", className);
  item.append(
    element("p", className && "m-0 font-semibold text-dusk-900 dark:text-white", `${shift.name}: ${formatScore(sum)} of 5`),
    element("p", className && "m-0 mt-1 text-sm [overflow-wrap:anywhere]", `${shift.from} → ${shift.to}`),
    element("p", className && "m-0 mt-1 [overflow-wrap:anywhere]", shift.practicalApplication),
    link,
  );
  return item;
}

/** The section in the results: each mindset with a Read link that moves to its section in the post. */
function practiseItem(shift: Data["shifts"][number], sum: number): HTMLElement {
  const link = element("a", "mt-1 inline-block font-semibold text-rust-800 underline underline-offset-2 dark:text-rust-300", `Read ${shift.name}`);
  link.href = `#${shift.anchor}`;
  link.dataset.lowLink = shift.anchor;
  const item = focusItem(shift, sum, link, "mt-4");
  item.dataset.lowShift = "";
  return item;
}

/** The printable sheet: title, date, the mindsets to develop with each section's full address, and the results link (FR-010). */
function focusSheet(data: Data, sums: number[], date: string, url: string): HTMLElement {
  const sheet = element("section");
  sheet.dataset.assessmentFocusSheet = "";
  const { intro, shifts } = focusAreas(data, sums);
  const page = location.origin + location.pathname;
  sheet.append(element("h2", "", data.title), element("p", "", formatDate(date)), element("h3", "", "Mindsets to develop"), ...intro.map((text) => element("p", "", text)));
  for (const s of shifts) {
    const shift = data.shifts[s]!;
    const item = focusItem(shift, sums[s]!, element("p", "", `Read ${shift.name}: ${page}#${shift.anchor}`));
    item.dataset.focusItem = "";
    sheet.append(item);
  }
  const link = element("p", "", `Results link: ${url}`);
  link.dataset.focusLink = "";
  sheet.append(link);
  return sheet;
}

const countText = (count: number): string => (count === 1 ? "1 statement needs an answer." : `${count} statements need an answer.`);

/**
 * Links the block's own stylesheet (client.css) once. It is imported as a URL and linked here, not
 * imported as CSS: Astro bundles CSS imported anywhere in a post's component graph, client scripts
 * included, with every page that calls render() on that post (the listings do, for the reading
 * time), and the stylesheet must ship only with posts that render the block (FR-017, FR-018b).
 */
function addStylesheet(): void {
  if (document.querySelector("link[data-assessment-stylesheet]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = stylesheet;
  link.dataset.assessmentStylesheet = "";
  document.head.append(link);
}

export function init(root: HTMLElement): void {
  addStylesheet();
  const data = JSON.parse(root.dataset.assessmentData ?? "{}") as Data;
  const form = root.querySelector<HTMLFormElement>("[data-assessment-form]")!;
  const status = root.querySelector<HTMLElement>("[data-assessment-status]")!;
  const errors = root.querySelector<HTMLElement>("[data-assessment-errors]")!;
  const results = root.querySelector<HTMLElement>("[data-assessment-results]")!;
  const show = root.querySelector<HTMLButtonElement>("[data-assessment-show]")!;
  const clear = root.querySelector<HTMLButtonElement>("[data-assessment-clear]")!;
  const earlierPanel = root.querySelector<HTMLElement>("[data-assessment-earlier]")!;
  const details = root.querySelector("details")!;
  const titleLink = document.querySelector<HTMLAnchorElement>("[data-assessment-link]");
  const titleWording = { text: titleLink?.textContent ?? "", href: titleLink?.getAttribute("href") ?? "" };
  const version = root.dataset.version ?? "";
  const fieldsets = [...form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-statement]")];
  let shown = false;
  // The result the reader arrived with, from the results link (US4). Kept until cleared.
  let earlier: AssessmentResult | null = null;
  const printButton = element("button", "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-rust-700 bg-transparent px-5 py-2 text-base font-medium text-rust-800 hover:bg-rust-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust-700 dark:border-rust-300 dark:text-rust-300 dark:hover:bg-rust-950 dark:focus-visible:outline-rust-300 forced-colors:border-[ButtonText] forced-colors:text-[ButtonText]", "Print my focus areas");
  printButton.type = "button";
  printButton.dataset.assessmentPrint = "";
  printButton.addEventListener("click", () => window.print());

  const answerOf = (fieldset: HTMLFieldSetElement): number => Number(fieldset.querySelector<HTMLInputElement>("input:checked")?.value ?? 0);
  const clearError = (fieldset: HTMLFieldSetElement) => {
    fieldset.removeAttribute("aria-invalid");
    fieldset.removeAttribute("aria-describedby");
    fieldset.querySelector<HTMLElement>("[data-statement-error]")!.hidden = true;
  };

  /** Scrolls a heading into view and focuses it, leaving the address unchanged (research R6). */
  function goTo(heading: HTMLElement) {
    heading.tabIndex = -1;
    heading.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    heading.focus({ preventScroll: true });
  }

  /** The earlier result from the results link, shown on its own above the form (L1, L2). */
  function showEarlier(result: AssessmentResult) {
    const sums = result.sums;
    const heading = element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", `Earlier result from ${formatDate(result.date)}`);
    heading.id = "assessment-earlier";
    heading.dataset.earlierHeading = "";
    const { chart, summary } = chartAndSummary(data, sums, "earlier");
    earlierPanel.replaceChildren(heading);
    if (result.version !== version) {
      earlierPanel.append(element("p", "m-0 mt-2 font-medium", "This result was made with an earlier set of questions, so it cannot be compared with a new one."));
    }
    earlierPanel.append(chart, summary);
    earlierPanel.hidden = false;
    if (titleLink) {
      titleLink.textContent = "Your earlier result is below";
      titleLink.setAttribute("href", "#assessment-earlier");
    }
  }

  function showErrors(missing: HTMLFieldSetElement[]) {
    for (const fieldset of fieldsets) clearError(fieldset);
    const heading = element("p", "m-0 font-semibold", countText(missing.length));
    heading.dataset.errorCount = "";
    const list = element("ul", "m-0 mt-2 list-disc pl-6");
    for (const fieldset of missing) {
      fieldset.setAttribute("aria-invalid", "true");
      const message = fieldset.querySelector<HTMLElement>("[data-statement-error]")!;
      message.hidden = false;
      fieldset.setAttribute("aria-describedby", message.id);
      const item = element("li");
      const link = element("a", "text-rust-800 underline underline-offset-2 dark:text-rust-300", fieldset.querySelector("legend")!.textContent ?? "");
      link.href = `#${fieldset.id}`;
      link.dataset.errorLink = fieldset.id;
      item.append(link);
      list.append(item);
    }
    errors.replaceChildren(heading, list);
    errors.hidden = false;
    results.hidden = true;
    status.textContent = heading.textContent;
    missing[0]!.querySelector<HTMLInputElement>("input")!.focus();
  }

  function showResults() {
    errors.hidden = true;
    const sums = data.shifts.map((_, s) => sumOf([0, 1, 2].map((i) => answerOf(fieldsets[s * 3 + i]!))));
    const comparable = earlier !== null && earlier.version === version;
    const { chart, summary } = chartAndSummary(data, sums, "now", comparable ? earlier!.sums : undefined);
    const result: AssessmentResult = { version, date: today(), sums };
    const url = resultUrl(location, result);
    const practise = element("div", "mt-6");
    practise.append(element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", "Mindsets to develop"));
    const focus = focusAreas(data, sums);
    focus.intro.forEach((text, n) => practise.append(element("p", n ? "m-0 mt-2 font-semibold" : "m-0 mt-2", text)));
    for (const s of focus.shifts) practise.append(practiseItem(data.shifts[s]!, sums[s]!));
    const link = element("div", "mt-6");
    link.append(element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", "Your results link"));
    const text = element("p", "m-0 mt-2 [overflow-wrap:anywhere]", url);
    text.dataset.resultsLink = "";
    const copy = element("button", `${printButton.className} mt-3`, "Copy link");
    copy.type = "button";
    copy.dataset.assessmentCopy = "";
    const note = element(
      "p",
      "m-0 mt-2 text-sm",
      "Anyone with the link can see these scores. The site keeps no copy, and clearing your answers does not undo a link you have already shared.",
    );
    note.dataset.resultsLinkNote = "";
    link.append(text, copy, note);
    const heading = element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", "Your results");
    results.replaceChildren(heading, chart, ...(comparable ? [legend(earlier!.date)] : []), summary, practise, link, element("p", "mt-6 mb-0"));
    results.lastElementChild!.append(printButton);
    document.body.querySelector(":scope > [data-assessment-focus-sheet]")?.remove();
    document.body.append(focusSheet(data, sums, result.date, url));
    history.replaceState(history.state, "", `#${encodeResult(result)}`);
    document.documentElement.setAttribute("data-assessment-focus", "");
    results.hidden = false;
    status.textContent = shown ? "Your results are updated." : "Your results are ready below.";
    shown = true;
  }

  show.addEventListener("click", () => {
    const missing = fieldsets.filter((fieldset) => answerOf(fieldset) === 0);
    if (missing.length > 0) showErrors(missing);
    else {
      showResults();
      show.focus();
    }
  });

  // Answering a statement clears its own error at once.
  form.addEventListener("change", (event) => {
    const fieldset = (event.target as HTMLElement).closest<HTMLFieldSetElement>("fieldset[data-statement]");
    if (!fieldset || !fieldset.hasAttribute("aria-invalid")) return;
    clearError(fieldset);
    errors.querySelector(`[data-error-link="${fieldset.id}"]`)?.closest("li")?.remove();
    const left = errors.querySelectorAll("li").length;
    if (left === 0) errors.hidden = true;
    else errors.querySelector("[data-error-count]")!.textContent = countText(left);
  });

  // An error link moves focus to the statement without changing the address.
  errors.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest<HTMLElement>("[data-error-link]");
    if (!link) return;
    event.preventDefault();
    document.getElementById(link.dataset.errorLink!)?.querySelector<HTMLInputElement>("input")?.focus();
  });

  // A section link scrolls the heading into view and focuses it, leaving the address unchanged.
  // Smooth scrolling only when the reader has not asked for reduced motion.
  results.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-low-link]");
    if (!link) return;
    const heading = document.getElementById(link.dataset.lowLink!);
    if (!heading) return;
    event.preventDefault();
    goTo(heading);
  });

  // Copy the results link. When the Clipboard API refuses, the link stays on the page to select.
  results.addEventListener("click", (event) => {
    if (!(event.target as HTMLElement).closest("[data-assessment-copy]")) return;
    const url = results.querySelector<HTMLElement>("[data-results-link]")!.textContent ?? "";
    const done = () => (status.textContent = "Link copied.");
    const failed = () => (status.textContent = "The link could not be copied. Select the link text and copy it.");
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, failed);
    else failed();
  });

  // The title-card link opens the block and goes to its heading (or to the earlier result's
  // heading) without changing the address (FR-001a). Its href names the block's content, so that
  // without JavaScript the browser opens the block itself.
  titleLink?.addEventListener("click", (event) => {
    const target = document.getElementById(titleLink.getAttribute("href")!.slice(1));
    if (!target) return;
    event.preventDefault();
    details.open = true;
    goTo(target.hasAttribute("data-assessment-content") ? document.getElementById(root.getAttribute("aria-labelledby")!)! : target);
  });

  // Clear: every trace of the answers, the results, the focus sheet and the address fragment goes (L6, U14).
  clear.addEventListener("click", () => {
    form.reset();
    for (const fieldset of fieldsets) clearError(fieldset);
    errors.hidden = true;
    results.replaceChildren();
    results.hidden = true;
    earlierPanel.replaceChildren();
    earlierPanel.hidden = true;
    document.body.querySelector(":scope > [data-assessment-focus-sheet]")?.remove();
    document.documentElement.removeAttribute("data-assessment-focus");
    if (titleLink) {
      titleLink.textContent = titleWording.text;
      titleLink.setAttribute("href", titleWording.href);
    }
    earlier = null;
    shown = false;
    history.replaceState(history.state, "", location.pathname + location.search);
    status.textContent = "Your answers have been cleared.";
    fieldsets[0]!.querySelector<HTMLInputElement>("input")!.focus();
  });

  // Arriving through a results link (L1, L2, L3). A fragment that is not a result is left alone.
  const arrived = decodeResult(location.hash);
  if (arrived.kind === "malformed" || (arrived.kind === "result" && arrived.result.sums.length !== data.shifts.length)) {
    status.textContent = "This results link could not be read.";
  } else if (arrived.kind === "result") {
    earlier = arrived.result;
    showEarlier(earlier);
  }

  root.dataset.assessmentReady = "true";
}
