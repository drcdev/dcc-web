// The browser module of the self-assessment (specs/037 contracts/assessment-ui.md). Loaded lazily
// by the bootstrap script in SelfAssessment.astro. It reads the form, checks it, scores it and
// draws the chart and the text summary. Nothing leaves the page: no request, no storage. It sets
// no `style` attribute (the page policy forbids it); the chart's geometry is SVG attributes.
import { planOrder } from "./plan.ts";
import { band, formatScore, markerPosition, nextToPractise, selectLowBand, summaryLine, sumOf } from "./score.ts";

interface Data {
  scale: string[];
  title: string;
  shifts: { name: string; from: string; to: string; anchor: string; practicalApplication: string; week: string }[];
  integrationWeek: { name: string; week: string };
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

/** One chart row: the shift's name, its From and To wording, and a track with a marker at the mean. */
function chartRow(shift: Data["shifts"][number], sum: number): HTMLElement {
  const row = element("div", "mt-4 first:mt-0");
  row.dataset.chartRow = "";
  row.append(element("p", "m-0 font-semibold text-dusk-900 dark:text-white", shift.name));
  const ends = element("div", "mt-1 flex justify-between gap-4 text-sm [overflow-wrap:anywhere]");
  ends.append(element("span", "", shift.from), element("span", "text-right", shift.to));
  const svg = svgNode("svg", { viewBox: "-6 0 112 12", "aria-hidden": "true", focusable: "false", class: "mt-1 block h-auto w-full max-w-xl" });
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
    svgNode("circle", {
      cx: String(markerPosition(sum) * 100),
      cy: "6",
      r: "5",
      class: "fill-rust-700 dark:fill-rust-300 forced-colors:fill-[Highlight]",
    }),
  );
  row.append(ends, svg);
  return row;
}

/** A shift to practise: a link to its section in the post and its Practical Application paragraph. */
function practiseItem(shift: Data["shifts"][number]): HTMLElement {
  const item = element("div", "mt-4");
  item.dataset.lowShift = "";
  const link = element("a", "font-semibold text-rust-800 underline underline-offset-2 dark:text-rust-300", `Read ${shift.name}`);
  link.href = `#${shift.anchor}`;
  link.dataset.lowLink = shift.anchor;
  item.append(link, element("p", "m-0 mt-1 [overflow-wrap:anywhere]", shift.practicalApplication));
  return item;
}

/** The printable plan sheet: title, date, the five positions, then weeks 1 to 6 (FR-010). */
function planSheet(data: Data, sums: number[]): HTMLElement {
  const sheet = element("section");
  sheet.dataset.assessmentPlanSheet = "";
  sheet.append(element("h2", "", data.title), element("p", "", new Date().toLocaleDateString("en-CA", { dateStyle: "long" })));
  const positions = element("ul");
  sums.forEach((sum, s) => positions.append(element("li", "", summaryLine(data.shifts[s]!, sum))));
  sheet.append(positions);
  const weeks = [...planOrder(sums).map((s) => ({ name: data.shifts[s]!.name, text: data.shifts[s]!.week })), { name: data.integrationWeek.name, text: data.integrationWeek.week }];
  weeks.forEach((week, n) => {
    const section = element("div");
    section.dataset.planWeek = "";
    section.append(element("h3", "", `Week ${n + 1}: ${week.name}`), element("p", "", week.text));
    sheet.append(section);
  });
  return sheet;
}

const countText = (count: number): string => (count === 1 ? "1 statement needs an answer." : `${count} statements need an answer.`);

export function init(root: HTMLElement): void {
  const data = JSON.parse(root.dataset.assessmentData ?? "{}") as Data;
  const form = root.querySelector<HTMLFormElement>("[data-assessment-form]")!;
  const status = root.querySelector<HTMLElement>("[data-assessment-status]")!;
  const errors = root.querySelector<HTMLElement>("[data-assessment-errors]")!;
  const results = root.querySelector<HTMLElement>("[data-assessment-results]")!;
  const show = root.querySelector<HTMLButtonElement>("[data-assessment-show]")!;
  const fieldsets = [...form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-statement]")];
  let shown = false;
  const printButton = element("button", "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-rust-700 bg-transparent px-5 py-2 text-base font-medium text-rust-800 hover:bg-rust-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust-700 dark:border-rust-300 dark:text-rust-300 dark:hover:bg-rust-950 dark:focus-visible:outline-rust-300 forced-colors:border-[ButtonText] forced-colors:text-[ButtonText]", "Print my plan");
  printButton.type = "button";
  printButton.dataset.assessmentPrint = "";
  printButton.addEventListener("click", () => window.print());

  const answerOf = (fieldset: HTMLFieldSetElement): number => Number(fieldset.querySelector<HTMLInputElement>("input:checked")?.value ?? 0);
  const clearError = (fieldset: HTMLFieldSetElement) => {
    fieldset.removeAttribute("aria-invalid");
    fieldset.removeAttribute("aria-describedby");
    fieldset.querySelector<HTMLElement>("[data-statement-error]")!.hidden = true;
  };

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
    const chart = element("div", "mt-4");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", "Chart of where you sit between From and To for each shift. The list below gives the same information in words.");
    chart.dataset.assessmentChart = "";
    const summary = element("ul", "m-0 mt-4 list-none p-0");
    sums.forEach((sum, s) => {
      const shift = data.shifts[s]!;
      chart.append(chartRow(shift, sum));
      const item = element("li", "mt-2 first:mt-0 [overflow-wrap:anywhere]", summaryLine(shift, sum));
      item.dataset.summaryLine = "";
      item.dataset.band = band(sum);
      item.dataset.score = formatScore(sum);
      summary.append(item);
    });
    const practise = element("div", "mt-6");
    practise.append(element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", "What to practise"));
    const low = selectLowBand(sums);
    if (low.length > 0) {
      for (const s of low) practise.append(practiseItem(data.shifts[s]!));
    } else {
      const next = nextToPractise(sums);
      practise.append(
        element("p", "m-0 mt-2", "None of your scores is below the middle."),
        element("p", "m-0 mt-2 font-semibold", `Next to practise: ${data.shifts[next]!.name}`),
        practiseItem(data.shifts[next]!),
      );
    }
    results.replaceChildren(element("h3", "m-0 text-lg font-bold text-dusk-900 dark:text-white", "Your results"), chart, summary, practise, element("p", "mt-6 mb-0"));
    results.lastElementChild!.append(printButton);
    document.body.querySelector(":scope > [data-assessment-plan-sheet]")?.remove();
    document.body.append(planSheet(data, sums));
    document.documentElement.setAttribute("data-assessment-plan", "");
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
    heading.tabIndex = -1;
    heading.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    heading.focus({ preventScroll: true });
  });

  root.dataset.assessmentReady = "true";
}
