// Test-owned assessment data for the unit and component tests of specs/037. It is not the site's
// real assessment: the tests never name real content, so editing the data file needs no test edit.
import type { Assessment } from "../../src/content/schemas/assessment.ts";

const shiftNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];

export function sampleAssessment(): Assessment {
  return {
    title: "Sample assessment",
    intro: "Three statements for each shift.",
    scale: ["Rarely", "Sometimes", "Often", "Usually", "Almost always"],
    shifts: shiftNames.map((name, i) => ({
      id: name.toLowerCase(),
      name,
      from: `${name} from wording`,
      to: `${name} to wording`,
      anchor: `shift-${i + 1}-${name.toLowerCase()}`,
      practicalApplication: `Practise ${name} by doing the first thing. Ask: "What next?"`,
      week: `Spend this week on ${name} with one small task.`,
      statements: [0, 1, 2].map((n) => `${name} statement ${n + 1}.`),
    })),
    integrationWeek: { name: "Bring it together", week: "Look back over weeks 1-5 and choose one focus." },
  };
}
