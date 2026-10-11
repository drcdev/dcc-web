// The components a post body can use without an import (specs/037 contracts/assessment-data.md).
// The post route passes `postComponents` to `<Content components={...} />`
// (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content), and
// `validatePageBody` accepts these names in a post and rejects them in a page (row A8).
import DevelopmentPlan from "./DevelopmentPlan.astro";
import PracticalApplication from "./PracticalApplication.astro";
import SelfAssessment from "./SelfAssessment.astro";

export const postComponentNames = ["PracticalApplication", "DevelopmentPlan", "SelfAssessment"] as const;

export const postComponents = { PracticalApplication, DevelopmentPlan, SelfAssessment };
