import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Check the shared priority-access password typed on /redpill/priority-access. */
export const unlockRedPillAccess = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().trim().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { redPillCodeMatches } = await import("./redpill-access.server");
    return { ok: redPillCodeMatches(data.password) };
  });
