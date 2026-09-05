import * as fs from "fs";
import * as path from "path";
import { diskStorage } from "multer";
import { v4 as uuid } from "uuid";
import { UPLOADS_ROOT } from "./uploads.service";

/** One multer config per subdirectory ("restaurants" | "dishes" | "avatars")
 *  — the actual mimetype/size validation happens in UploadsService (so it
 *  applies whether the request even reaches multer's callback), this is just
 *  where the file lands on disk. Directory is created lazily on first upload
 *  rather than at boot, so a fresh checkout doesn't need any manual setup
 *  step. */
export function multerOptionsFor(subdir: "restaurants" | "dishes" | "avatars") {
  const dir = path.join(UPLOADS_ROOT, subdir);
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        // Only ever the fixed set UploadsService's own mimetype check allows
        // through — the original filename's extension is otherwise untrusted
        // input and never used to pick what lands on disk.
        const extByMime: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
        };
        const ext = extByMime[file.mimetype] ?? "";
        cb(null, `${uuid()}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  };
}
