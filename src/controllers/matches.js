import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/dbConnection.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/matchStatus.js";
import { desc } from "drizzle-orm";

const MAX_LIMIT = 100;

export const createMatch = async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(new ApiResponse(400, parsed.error.message));
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  const [createdMatch] = await db
    .insert(matches)
    .values({
      ...parsed.data,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      status: getMatchStatus(startTime, endTime),
    })
    .returning();

  if (!createdMatch) {
    throw new ApiError(500, "Failed to create match");
  }

  return res.status(201).json(new ApiResponse(201, createdMatch));
};

export const getMatches = async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], JSON.stringify(parsed.error)));
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  const data = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(limit);

  if(!data) {
    throw new ApiError(500, "Failed to get matches");
  }

  return res.status(200).json(new ApiResponse(200, data));
};
