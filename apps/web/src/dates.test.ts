import { describe, expect, it } from "vitest";
import { addDays, dayKey, fromIso, toIso } from "./dates";

describe("dates", () => {
  it("round-trips date + time through ISO in local time", () => {
    const iso = toIso("2030-03-05", "14:30");
    expect(fromIso(iso, true)).toEqual({ date: "2030-03-05", time: "14:30" });
  });
  it("date-only tasks hide the time", () => {
    expect(fromIso(toIso("2030-03-05", ""), false)).toEqual({ date: "2030-03-05", time: "" });
  });
  it("addDays crosses month boundaries", () => {
    expect(dayKey(addDays(new Date(2030, 0, 31), 1))).toBe("2030-02-01");
  });
});
