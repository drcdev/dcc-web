// Body text for the sample posts (FR-004, FR-010): real sentences on each
// post's own subject, so a reader can judge a direction on writing that looks
// like the blog will look. Plain TypeScript with no Astro imports, so Vitest
// and Playwright can read it. Prototype-only: deleted with the prototypes.

export interface FullBody {
  /** Paragraphs before the first heading. */
  opening: string[];
  /** One lead-in paragraph under each of the first three headings. */
  found: string;
  check: string;
  cost: string;
  /** Paragraph under the last heading. */
  closing: string;
}

/** Short bodies: paragraphs only. */
export const shortBodies: Record<string, string[]> = {
  "quiet-handoffs": [
    "Most of the delivery problems I have been asked to look at started in the gap between two people, not inside either person's work. A ticket moves from design to build, a build moves to operations, an incident moves from the night shift to the morning shift. Each move loses a little context, and nobody notices until the losses add up.",
    "Four habits have helped every team I have worked with. Write the handoff down in the same place every time. Name the person who receives it, not the team. Say what is unfinished, not only what is done. And check, a day later, that the receiver had what they needed.",
    "None of this is exciting, and that is the point. A good handoff is one nobody remembers, because nothing went wrong afterwards.",
  ],
  "audit-trail-as-a-product": [
    "In regulated work the audit trail is usually a by-product. Systems write whatever is easy to write, and someone assembles a report when the auditors arrive. It works until the question changes, and then it turns into a month of searching through logs.",
    "We began treating the trail as a product with users. The auditor is one of them, the support engineer is another. We asked each what they need to see, wrote those needs down, and gave the trail an owner who answers for its quality in the same way as for any other service.",
    "The first result was a shorter list of events, each one clearer. The second was that audits stopped being a special project and became a report we could run on any Tuesday.",
  ],
  "what-a-clinic-taught-me-about-uptime": [
    "Some years ago I spent a morning in a clinic waiting room while our scheduling system ran slowly. Nothing was down. Our dashboards were green. But the front desk was writing names on paper, and a patient with a mobility aid was waiting to be told which room to go to.",
    "I had always described availability as a percentage. That morning it became a question about what a person could do at ten past nine. The desk staff had no interest in our response times. They wanted to check someone in and move on.",
    "We changed the way we report. Alongside uptime we now track the few tasks that clinic staff must be able to finish, and we measure how long they take. It is a smaller set of numbers, and it is the one that people in the building recognise.",
  ],
  "small-teams-large-interfaces": [
    "A team of six can look after a lot of code. It cannot look after an unlimited number of boundaries, and the boundaries are where most of our incidents began. Each new integration added a partner, a schedule and a set of assumptions that lived in someone's head.",
    "We listed every interface the team touched and gave each one a single owner. The owner was not the person who built it. It was the person who would be called if it broke, which turned out to be a more useful test.",
    "In incident reviews the effect was quick to see. We no longer spent the first twenty minutes working out who should be in the room. The owner was named, the partner contact was written next to it, and the conversation started with the problem.",
  ],
  "three-years-between-a-hospital-two-labs-and-a-payer": [
    "The rule was simple to state: never change a message format and its consumers in the same release. We wrote it down in the first month and broke it in most quarters afterwards, usually for a good reason. A lab wanted a new field. A payer changed a code list with two weeks' notice.",
    "Each break cost us more than the last. Messages were rejected quietly, claims sat in a queue, and someone had to reconcile by hand. We tried reminders, checklists and review gates, and none of them held for long.",
    "What finally worked was making the safe path the easy one. Producers publish the new format alongside the old for a fixed period. Consumers move when they are ready. A small test harness replays real message shapes against both, and it runs before anything is deployed. The rule now keeps itself.",
  ],
  "retention-rules-in-plain-language": [
    "How long you keep data is a decision, and someone should be able to say who made it. In most organisations the answer sits in a policy document written for auditors, in language the engineers rarely read.",
    "The template we use fits on one page. It names the data, the reason we hold it, the period, the person who can change the period, and what happens at the end. Each answer is a sentence, not a clause.",
    "The page is short on purpose. If a rule cannot be written in plain words, it usually cannot be applied consistently either, and that is worth finding out before the data has piled up.",
  ],
  "when-the-pilot-outlives-the-plan": [
    "Every AI pilot has an end date on the slide. In practice the end date passes, the pilot is still running, and a handful of people now depend on it. Nobody decided that it should become production. It simply did.",
    "Before a pilot starts, I ask four questions. Who will notice if it stops? What does it do when it is wrong? Who reviews what it produced last week? And what would make us switch it off?",
    "If those answers are missing at the start, they will be harder to find later, when the pilot has users and a reputation. Writing them down costs an hour. Writing them after the fact costs a difficult meeting.",
  ],
  "on-call-without-heroics": [
    "A rota that depends on one person who always answers is a risk, not a strength. That person will eventually be on leave, or tired, or gone, and the team will find out how much knowledge they were carrying.",
    "We spread the load in two steps. First we shortened the shifts so nobody stayed on the hook for a full week. Then we asked each engineer to write down what they actually do when the phone rings at 3 a.m., in the order they do it.",
    "Those notes became the runbook. They were not elegant, but they were true, and a new engineer could follow them on the first night. The heroes are still there. They are just no longer the plan.",
  ],
  "schema-changes-are-people-changes": [
    "The migration script is the easy part. It runs in minutes, it can be tested, and it can be rolled back. The hard part is everything that quietly depends on the old shape: the report someone built three years ago, the export that goes to a partner, the spreadsheet with a macro.",
    "Before a change now, we search for consumers in three places: the code, the query logs and the people. The people search is the one that finds things. A short message to the teams nearby asking who reads this table gets answers within a day.",
    "We then announce the change with a date and a description of what is different. Most of the work ends up being conversation, and that is fine. The schema is only the part that happens to be written in SQL.",
  ],
  "first-ninety-days-of-a-legacy-rescue": [
    "When you take over a system in trouble, the temptation is to fix what is visibly broken. I have learned to wait. The first thirty days go to measuring: how often it fails, how long recovery takes, who is called and what they do.",
    "In the second month I pick one thing that hurts the team every week and fix it properly. It does not have to be the largest problem. It needs to be one where the team can see the difference, because that earns the trust needed for harder changes.",
    "The third month is for saying no. By then there is a list of ideas, and most of them are reasonable. The job is to protect the small number of changes that reduce risk, and to leave the rest until the system is steady.",
  ],
  "data-contracts-between-friends": [
    "Two teams that trust each other still need a written agreement about the data that passes between them. Trust survives a good day. A contract survives a reorganisation, a new hire and a bad Friday.",
    "Ours fits on one page. It lists the fields and their meaning, how often the data arrives, what counts as late, and who to contact. It also says how much notice one side must give before changing anything.",
    "Both teams sign it, and both teams keep a copy next to the code. It rarely comes out of the drawer, but when something drifts, the first conversation is short, because the question is already answered.",
  ],
};

/** Full bodies, for the two posts that show the figure, code sample and table. */
export const fullBodies: Record<string, FullBody> = {
  "ai-agents-and-the-mainframe": {
    opening: [
      "An agent can read the screens of an old system faster than a new hire, and it does not get bored. That makes it tempting to point one at the oldest, least documented system you own and let it get on with the work.",
      "We tried it on a claims application that had run for more than twenty years. It went better than I expected in some places and worse in others, and the difference was not where I would have guessed.",
    ],
    found:
      "The agent was excellent at reading. It could walk through forty screens, collect the fields, and describe what each one appeared to do. It was much less reliable at knowing which screens were safe to change, because that knowledge had never been written anywhere.",
    check:
      "We put a check between the agent and every change. It compares the counts in the operational system with the reporting system and stops the release if they differ. The query below is the whole check.",
    cost: "The table shows what each safeguard cost us and what it protects. The cheapest ones were the ones that saved us, and none needed the agent to be clever.",
    closing:
      "The agent stayed on reading and drafting. People stayed on approving and changing. That split is not permanent, but it is honest about what we know today.",
  },
  "reading-a-system-you-did-not-build": {
    opening: [
      "Sooner or later you inherit a system you did not build. There is no author to ask, the documentation is a year behind, and the system is still doing something important every night.",
      "I have a rough order for learning one. Start with the data, then the jobs, then the people who wake up when it breaks. Code comes fourth, which surprises people.",
    ],
    found:
      "Start by writing down what each job actually does, not what its name suggests. A job called cleanup may be the only thing that feeds the month-end report. We found three like that, and each one changed what we planned to remove.",
    check:
      "Then compare the system with itself. If two places should agree on a count, check that they do. The query below does that for us each night, and it has caught more problems than any review.",
    cost: "The last step is to price each safeguard. The table sets effort beside protection so that the team can choose what to do first instead of arguing about it.",
    closing:
      "None of this is clever. It is a habit of writing things down and checking them, which is why it keeps working when the team changes.",
  },
};
