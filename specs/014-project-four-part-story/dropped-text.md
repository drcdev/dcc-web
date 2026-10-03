# Dropped text per project (T033-T035; FR-022)

Scratch note for the pull request description (T036). Everything below was removed from the old files; nothing was added.

## Focus Pocus

- Comparison caption: The ways to reach OmniFocus that were considered
- Option summary, Keep converting to TaskPaper: Ask the AI for TaskPaper text and import it into OmniFocus by hand.
  - Pro: Nothing to build.
  - Con: Every model formats TaskPaper a little differently
  - Con: so most imports need fixing.
  - Con: The AI cannot see the existing tasks.
- Option summary, OmniFocus URL scheme or Actions: Open omnifocus:// links, or run OmniFocus automation actions, to add tasks.
  - Pro: No scripting and no permission prompts.
  - Con: Opens the app or an overlay for every change.
  - Con: Cannot read tasks back.
- Option summary, AppleScript bridge: Send AppleScript commands to OmniFocus from a small helper.
  - Pro: Long-established and well documented for OmniFocus.
  - Con: Awkward to write and test
  - Con: and hard to return structured data.
- Option summary, JXA behind an MCP server: Run JavaScript for Automation scripts from a TypeScript MCP server that Claude Desktop calls.
  - Pro: Reads and writes tasks with structured results.
  - Pro: Scripts are plain JavaScript that can be tested.
  - Pro: Claude discovers the tools on its own through MCP.
  - Con: JXA is slow and thinly documented
  - Con: so each script takes trial and error and some need long timeouts.
- Constraints chapter paragraphs that repeat a constraint's one-line explanation (kept in the list); sentences with extra detail were kept in the Options paragraph instead:
  - OmniFocus can only be automated on a Mac, so everything had to run locally and ask macOS for permission.
  - The work had to happen in the background. Opening the app or an overlay for every change would defeat the purpose.
  - Claude had to read tasks as well as write them, to answer questions and to avoid duplicating what was already there.
  - KEPT in Options (reworded only to stand alone): JXA is not a fast interface. Even a database of 1,600 tasks needed caching and pagination before bulk changes were usable.
- Reworded: the Why line starts "Why <option> won:" followed by the old reason.

## drc.dev, the first portfolio

- Comparison caption: The three ways to publish a project list that were considered
- Option summary, A GitHub profile README: List the projects in the README of the drcdev profile repository.
  - Pro: Nothing to build or deploy.
  - Con: Lives on github.com
  - Con: not on drc.dev.
  - Con: No room for screenshots
  - Con: badges or detail pages.
- Option summary, A page on the Ghost blog: Add a projects page to doncoleman.ca using the Flux theme.
  - Pro: Already hosted and already styled.
  - Con: Mixes projects into a writing site.
  - Con: The design follows the newsletters
  - Con: not the code.
- Option summary, A Next.js static site on GitHub Pages: Export a small React site to plain HTML and let GitHub Pages serve it.
  - Pro: Free hosting with a custom domain.
  - Pro: Static HTML with no server to patch.
  - Con: A build step and a deploy workflow to maintain for a handful of pages.
- Constraints chapter paragraphs that repeat a constraint's one-line explanation (kept in the list); sentences with extra detail were kept in the Options paragraph instead:
  - The site had to be free to host and have no server, because it changes a few times a year.
  - It had to live on drc.dev rather than inside GitHub or the blog.
  - Adding a project had to be one entry with a Markdown description, not a new page to lay out.
  - The look had to feel like a terminal, with box-drawing borders, bracketed buttons and a monospace typeface.
- Reworded: the Why line starts "Why <option> won:" followed by the old reason.

## Flux

- Comparison caption: The three ways to get a two-newsletter Ghost site that were considered
- Option summary, Ghost's stock Casper theme: Use the default theme and separate the newsletters with tags and settings.
  - Pro: Maintained by Ghost and always compatible with new releases.
  - Con: One accent colour and one archive for everything.
  - Con: No place to add AI features.
- Option summary, A marketplace theme, customised: Buy a theme close to the goal and fork it for the two streams.
  - Pro: A finished design to start from.
  - Con: Every change fights the original's structure.
  - Con: Updates from the vendor become merges.
- Option summary, A theme built from scratch: Write a Handlebars theme with Tailwind v4 and a build step for minified, hashed assets.
  - Pro: Every part of the design serves the two newsletters.
  - Pro: Security headers and sanitising can be built in from the start.
  - Con: Ghost's theme rules and routes have to be learned the hard way.
- Constraints chapter paragraphs that repeat a constraint's one-line explanation (kept in the list); sentences with extra detail were kept in the Options paragraph instead:
  - KEPT in Options (reworded only to stand alone): Each newsletter needed its own colour, timeline and subscribe button, driven by Ghost's own settings rather than a hard-coded list.
  - KEPT in Options (reworded only to stand alone): The site runs on Magic Pages, a hosted Ghost service, so everything had to live in the theme and in Ghost's routes and redirects files.
  - Dark mode had to offer light, dark and follow-the-system, and switch without a flash of the wrong theme.
  - KEPT in Options (reworded only to stand alone): AI-generated text on a page is a risk, so anything a model writes had to be sanitised, and the theme had to keep content security policy headers and integrity hashes on its scripts.
- Reworded: the Flux outcome's "The split-screen picture above" became "The split-screen picture"; each Why line starts "Why <option> won:" followed by the old reason.

## Plunge Buddy

- Comparison caption: The three ways to check plunge conditions that were considered
- Option summary, Check three websites: Open a weather site, a marine forecast and a tide table before each plunge.
  - Pro: Nothing to build.
  - Con: Three tabs and three layouts every time.
  - Con: Each site has its own cookies and ads.
- Option summary, An iOS Shortcut or widget: Chain the three services together with Shortcuts and show the result on the home screen.
  - Pro: Quick to put together.
  - Con: Fragile when a service changes its response.
  - Con: Hard to share with anyone else.
- Option summary, A native SwiftUI app: A small iPhone app that asks three public APIs and shows the answers on one card.
  - Pro: One screen that is quick to read.
  - Pro: Location handled by the system with the usual permission prompt.
  - Con: Needs an Apple developer account and App Store review to share.
- Constraints chapter paragraphs that repeat a constraint's one-line explanation (kept in the list); sentences with extra detail were kept in the Options paragraph instead:
  - Air temperature, water temperature, wave height and the tide times had to sit together on one card, with no scrolling between sources.
  - KEPT in Options (reworded only to stand alone): The app had to use the phone's location, and fall back to Vancouver, BC when permission is refused.
  - KEPT in Options (reworded only to stand alone): Nothing about the user should leave the phone. There is no account, no analytics and no server of our own, which also keeps the app cheap to keep running.
- Reworded: the Why line starts "Why <option> won:" followed by the old reason.

## Tempo

- Comparison caption: The three ways to get a guided routine timer that were considered
- Option summary, An existing interval timer app: Use one of the many HIIT or interval timers already in the app stores.
  - Pro: Nothing to build or maintain.
  - Con: None found that handled left and right sides or nested rounds the way the routines needed.
  - Con: Voice cues were often an upgrade or an afterthought.
- Option summary, A native iPhone app in Swift: Build the timer once for iOS with SwiftUI.
  - Pro: The best fit with the phone's speech and health features.
  - Con: No Android or web version without a second codebase.
- Option summary, A Flutter app: One Dart codebase that builds for iOS, Android and the web.
  - Pro: One codebase for all three platforms.
  - Pro: Mature packages for local SQL
  - Pro: text to speech and health logging.
  - Con: Platform features such as Apple Health need plugins and some per-platform care.
- Constraints chapter paragraphs that repeat a constraint's one-line explanation (kept in the list); sentences with extra detail were kept in the Options paragraph instead:
  - A workout happens wherever there is floor space, so the app had to work with no connection and no account.
  - KEPT in Options (reworded only to stand alone): The same routine should be usable on an iPhone, an Android phone or in a browser, and a change on one device should be able to reach the others.
  - KEPT in Options (reworded only to stand alone): Bilateral steps are the awkward part. A step can run for the left side, then the right side, repeat for a number of reps, and sit inside a round that repeats as well.
  - KEPT in Options (reworded only to stand alone): Recovery periods needed their own countdown, with a way to skip one when the rest is not needed.
- Reworded: the Why line starts "Why <option> won:" followed by the old reason.
