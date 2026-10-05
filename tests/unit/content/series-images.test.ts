// The series-to-image map (data-model.md "Series image"; FR-001, FR-004). The list comes from
// `seriesIds`, so no series name is written here.
import { describe, expect, it } from "vitest";
import { seriesIds, topics } from "../../../src/config/topics.ts";
import { seriesImage, seriesImages } from "../../../src/config/series-images.ts";

describe("series images", () => {
  it("has exactly one entry per series id and no other key", () => {
    expect(Object.keys(seriesImages).sort()).toEqual([...seriesIds].sort());
  });

  it.each([...seriesIds])("the image for %s is 2:1", (id) => {
    const image = seriesImage(id);
    expect(image.width).toBe(image.height * 2);
  });

  it("throws for an id that is not a series", () => {
    const other = topics.find((t) => !("series" in t));
    expect(other).toBeDefined();
    expect(() => seriesImage(other!.id)).toThrow();
    expect(() => seriesImage("not-a-topic")).toThrow();
  });
});
