import { describe, expect, it } from "bun:test";
import { extractDenseMap } from "../../../core/structural-minifier/hierarchy-extractor";

describe("extractDenseMap", () => {
  it("builds dotted feature references with path anchors", async () => {
    const content = [
      "# Customizing errors",
      "",
      "## Global error customization",
      "",
      "## Error precedence",
    ].join("\n");

    const dense = await extractDenseMap(
      "sections/06-customizing-errors.md",
      content,
    );

    expect(dense.featureRefs).toContain(
      "Customizing_errors.customizing_errors=>sections/06-customizing-errors.md#customizing-errors",
    );
    expect(dense.featureRefs).toContain(
      "Customizing_errors.global_error_customization=>sections/06-customizing-errors.md#global-error-customization",
    );
    expect(dense.featureRefs).toContain(
      "Customizing_errors.error_precedence=>sections/06-customizing-errors.md#error-precedence",
    );
  });
});
