import { Router } from "express";
import multer from "multer";
import path from "path";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary";
import { requireAuth } from "../middleware/auth";

export const uploadRouter = Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).replace(".", "");
    const allowedFormats = ["jpg", "jpeg", "png", "webp", "pdf"];
    
    return {
      folder: "kofte",
      format: allowedFormats.includes(ext.toLowerCase()) ? ext.toLowerCase() : "png",
      public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

uploadRouter.post("/photo", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: req.file.path });
});

uploadRouter.post("/document", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: req.file.path });
});
