import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { uploadFile } from "../services/storage";

export const uploadRouter = Router();

// Use memory storage so we can handle it via the storage service (S3/Local fallback)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

uploadRouter.post("/photo", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const url = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const fullUrl = url.startsWith("/uploads") ? `${req.protocol}://${req.get("host")}${url}` : url;
    res.json({ url: fullUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

uploadRouter.post("/document", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const url = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const fullUrl = url.startsWith("/uploads") ? `${req.protocol}://${req.get("host")}${url}` : url;
    res.json({ url: fullUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});
