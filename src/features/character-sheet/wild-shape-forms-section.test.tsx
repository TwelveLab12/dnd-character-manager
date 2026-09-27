import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { Character } from "@/domain/character";
import { makeTestCharacter } from "@/test/fixtures";
import { WildShapeFormsSection } from "./wild-shape-forms-section";

function Harness({ initial }: { initial: Character }) {
  const [character, setCharacter] = useState(initial);
  return (
    <>
      <WildShapeFormsSection
        character={character}
        onChange={(patch) => setCharacter((current) => ({ ...current, ...patch }))}
      />
      <output data-testid="forms">{JSON.stringify(character.wildShapeForms ?? [])}</output>
    </>
  );
}

describe("WildShapeFormsSection", () => {
  it("adds a beast with an attack and flags what the level does not allow", async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeTestCharacter({ classId: "druide", level: 2 })} />);

    expect(screen.getByText(/FP 1\/4 au plus, ni nage ni vol/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ajouter une forme" }));
    await user.type(screen.getByLabelText("Nom"), "Crocodile");
    await user.clear(screen.getByLabelText("FP"));
    await user.type(screen.getByLabelText("FP"), "1/2");
    await user.type(screen.getByLabelText("Nage (m)"), "9");
    await user.click(screen.getByRole("button", { name: "Ajouter une attaque" }));
    await user.type(screen.getByLabelText("Attaque"), "Morsure");

    expect(screen.getByText(/au-delà du FP 1\/4/)).toBeInTheDocument();
    expect(screen.getByText(/pas de forme nageuse/)).toBeInTheDocument();
    const forms = JSON.parse(screen.getByTestId("forms").textContent ?? "[]");
    expect(forms[0]).toMatchObject({
      name: "Crocodile",
      challengeRating: "1/2",
      swimSpeed: 9,
      attacks: [{ name: "Morsure", damageDice: "1d4" }],
    });
  });
});
