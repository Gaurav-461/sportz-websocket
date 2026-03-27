import { Router } from "express";
import { createMatch, getMatches } from "../controllers/matches.js";

const router = Router();

router.get("/", getMatches);

router.post("/", createMatch);

export default router;
