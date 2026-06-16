import { Router } from "express";
import { prisma } from "../db";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { slug: "asc" } });
  res.json(categories);
});
