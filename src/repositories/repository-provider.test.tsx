import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RepositoryProvider,
  useCharacterRepository,
  useSpellRepository,
} from "./repository-provider";

describe("RepositoryProvider", () => {
  it("provides repository instances to consumers", () => {
    const { result } = renderHook(
      () => ({
        characterRepository: useCharacterRepository(),
        spellRepository: useSpellRepository(),
      }),
      { wrapper: RepositoryProvider },
    );

    expect(result.current.characterRepository).toBeDefined();
    expect(result.current.spellRepository).toBeDefined();
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useCharacterRepository())).toThrow(
      /must be used within a RepositoryProvider/,
    );
  });
});
