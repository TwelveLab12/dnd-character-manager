import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { CharacterList } from "./character-list";

function renderCharacterList() {
  return render(
    <RepositoryProvider>
      <StoreProvider>
        <CharacterList />
      </StoreProvider>
    </RepositoryProvider>,
  );
}

async function createCharacter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /nouveau personnage/i }));
  await user.type(screen.getByLabelText(/^nom$/i), "Yomi Tsuki");
  await user.type(screen.getByLabelText(/^classe$/i), "Clerc");
  await user.click(screen.getByRole("button", { name: /^créer$/i }));
}

describe("CharacterList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows an empty state, then creates and lists a character", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    expect(await screen.findByText(/aucun personnage/i)).toBeInTheDocument();

    await createCharacter(user);

    expect(await screen.findByText("Yomi Tsuki")).toBeInTheDocument();
    expect(screen.getByText(/clerc — niveau 1/i)).toBeInTheDocument();
  });

  it("deletes a character after confirmation", async () => {
    const user = userEvent.setup();
    renderCharacterList();

    await createCharacter(user);
    await screen.findByText("Yomi Tsuki");

    await user.click(screen.getByRole("button", { name: /supprimer/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^supprimer$/i }));

    await waitFor(() => expect(screen.queryByText("Yomi Tsuki")).not.toBeInTheDocument());
    expect(await screen.findByText(/aucun personnage/i)).toBeInTheDocument();
  });
});
