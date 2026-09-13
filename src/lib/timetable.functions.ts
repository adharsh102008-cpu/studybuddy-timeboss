import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  dataUrl: z.string().min(20).max(12_000_000),
});

export type ExtractedRow = {
  day_of_week: number;
  period: number;
  subject: string;
  start_time: string;
  end_time: string;
};

const SYSTEM = `You read a photo of a student's weekly class timetable and return it as JSON.
Return ONLY JSON of the form {"entries":[{"day_of_week":1,"period":1,"subject":"Mathematics","start_time":"09:00","end_time":"09:45"}]}.
day_of_week: 0=Sunday,1=Monday,...,6=Saturday. Times must be 24-hour "HH:MM".
If a period has no explicit time, estimate sensible consecutive school times.
Skip breaks, lunch and empty cells.`;

export const extractTimetable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ entries: ExtractedRow[] }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract this weekly timetable as JSON." },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Too many requests right now — try again shortly.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted for this app. Add credits to continue.");
      throw new Error(`Could not read the timetable (${res.status}). ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return { entries: [] };

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { entries: [] };
    }

    const RowSchema = z.object({
      day_of_week: z.coerce.number().int().min(0).max(6),
      period: z.coerce.number().int().min(1).max(20).catch(1),
      subject: z.string().min(1).max(60),
      start_time: z.string().max(8),
      end_time: z.string().max(8),
    });
    const result = z
      .object({ entries: z.array(RowSchema).max(120) })
      .safeParse(parsed);

    return { entries: result.success ? result.data.entries : [] };
  });
