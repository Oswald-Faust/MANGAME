import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  name: string;
  userEmail: string;
  folderId?: string;
  mimeType: string;
  size: number;
  url: string;
  blobKey?: string;
  source: "local" | "google-drive";
  driveFileId?: string;
  driveViewLink?: string;
  content?: string; // Texte extrait
  transcription?: string; // Pour les vidéos
  processed: boolean;
  embeddingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    name: { type: String, required: true },
    userEmail: { type: String, required: true },
    folderId: String,
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
    blobKey: String,
    source: {
      type: String,
      enum: ["local", "google-drive"],
      default: "local",
    },
    driveFileId: String,
    driveViewLink: String,
    content: String,
    transcription: String,
    processed: { type: Boolean, default: false },
    embeddingId: String,
  },
  { timestamps: true }
);

FileSchema.index({ userEmail: 1, folderId: 1 });
FileSchema.index({ userEmail: 1, source: 1 });

export default mongoose.models.File ||
  mongoose.model<IFile>("File", FileSchema);
