import { z } from "zod";

export const listMatchesQuerySchema = z.object({
  limit: z
    .coerce.number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "sport is required"),
    homeTeam: z.string().min(1, "homeTeam is required"),
    awayTeam: z.string().min(1, "awayTeam is required"),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z
      .coerce.number()
      .int()
      .min(0)
      .optional(),
    awayScore: z
      .coerce.number()
      .int()
      .min(0)
      .optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endTime must be after startTime",
          path: ["endTime"],
        });
      }
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

