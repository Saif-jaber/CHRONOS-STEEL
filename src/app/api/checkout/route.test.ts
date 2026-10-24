import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/checkout", () => {
  it("rejects checkout because this is a demo project", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Purchases are disabled on this portfolio demo.",
    });
  });
});
