import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoonHitPointsGauge } from "./moon-hit-points-gauge";

describe("MoonHitPointsGauge", () => {
  it("shows the current and max hit points", () => {
    render(<MoonHitPointsGauge current={7} max={23} temporary={0} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("/ 23 PV")).toBeInTheDocument();
  });
});
