import mongoose, { Schema, Document } from "mongoose";

export interface IFolder extends Document {
  name: string;
  userEmail: string;
  parentId?: string;
  path: string;
  isRoot: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true },
    userEmail: { type: String, required: true },
    parentId: String,
    path: { type: String, default: "/" },
    isRoot: { type: Boolean, default: false },
    color: { type: String, default: "#6366f1" },
  },
  { timestamps: true }
);

export default mongoose.models.Folder ||
  mongoose.model<IFolder>("Folder", FolderSchema);
