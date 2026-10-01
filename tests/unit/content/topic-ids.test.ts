// Pure helpers for topic ids (data-model.md "Free-form topic" and "Post";
// FR-011, FR-012). No framework needed.
import { describe, expect, it } from "vitest";
import { editDistance, mainTopic, nearMiss, orderTopics, topicLabel } from "../../../src/lib/content/topic-ids.ts";

describe("editDistance", () => {
  it("is 0 for equal strings", () => {
    expect(editDistance("drift", "drift")).toBe(0);
  });
  it("counts insertions, deletions and substitutions", () => {
    expect(editDistance("agentic-ai", "agentic-a1")).toBe(1);
    expect(editDistance("agentic-ai", "agentic-a")).toBe(1);
    expect(editDistance("convergence", "convergance")).toBe(1);
    expect(editDistance("drift", "drfit")).toBe(2);
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("kitten", "sitting")).toBe(3);
  });
});

describe("nearMiss", () => {
  const controlled = ["compliant-data", "technology-teams", "agentic-ai", "healthcare-leadership", "drift", "convergence"];

  it("names the controlled id a close id probably meant", () => {
    expect(nearMiss("convergance", controlled)).toBe("convergence");
    expect(nearMiss("drfit", controlled)).toBe("drift");
    expect(nearMiss("agentic-a", controlled)).toBe("agentic-ai");
    expect(nearMiss("agentic-a1", controlled)).toBe("agentic-ai");
  });

  it("returns undefined for an exact controlled id", () => {
    expect(nearMiss("drift", controlled)).toBeUndefined();
  });

  it("returns undefined for an id that is not close to any controlled id", () => {
    expect(nearMiss("cloud-cost", controlled)).toBeUndefined();
    expect(nearMiss("security", controlled)).toBeUndefined();
  });
});

describe("nearMiss ties", () => {
  it("names the controlled id earlier in the list when two are equally near", () => {
    expect(nearMiss("cat", ["bat", "hat"])).toBe("bat");
    expect(nearMiss("cat", ["hat", "bat"])).toBe("hat");
  });
});

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
