// Pure helpers for topic ids (data-model.md "Free-form topic" and "Post";
// FR-011, FR-012). No framework needed.
import { describe, expect, it } from "vitest";
import { mainTopic, orderTopics, topicLabel } from "../../../src/lib/content/topic-ids.ts";

describe("topicLabel", () => {
  it("turns hyphens into spaces and capitalises the first letter", () => {
    expect(topicLabel("cloud-cost")).toBe("Cloud cost");
    expect(topicLabel("security")).toBe("Security");
    expect(topicLabel("a-b-c")).toBe("A b c");
    expect(topicLabel("cloud--cost")).toBe("Cloud cost");
  });
});

describe("orderTopics", () => {
  it("puts the series first and keeps the others in written order", () => {
    expect(orderTopics(["agentic-ai", "drift", "cloud-cost"])).toEqual(["drift", "agentic-ai", "cloud-cost"]);
  });
  it("keeps the written order when there is no series", () => {
    expect(orderTopics(["cloud-cost", "agentic-ai"])).toEqual(["cloud-cost", "agentic-ai"]);
  });
  it("does not change its input", () => {
    const input = ["agentic-ai", "convergence"];
    orderTopics(input);
    expect(input).toEqual(["agentic-ai", "convergence"]);
  });
});

describe("mainTopic", () => {
  it("is the series id when there is one", () => {
    expect(mainTopic(["agentic-ai", "convergence"])).toBe("convergence");
  });
  it("is the first controlled id when there is no series", () => {
    expect(mainTopic(["cloud-cost", "agentic-ai", "compliant-data"])).toBe("agentic-ai");
  });
  it("is undefined when every topic is free-form", () => {
    expect(mainTopic(["cloud-cost", "security"])).toBeUndefined();
  });
});
