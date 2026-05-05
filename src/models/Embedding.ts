import mongoose, { Schema, Document } from "mongoose";

export interface IEmbedding extends Document {
  fileId: string;
  fileName: string;
  userEmail: string;
  chunk: string;
  chunkIndex: number;
  embedding: number[];
  createdAt: Date;
}

const EmbeddingSchema = new Schema<IEmbedding>(
  {
    fileId: { type: String, required: true },
    fileName: { type: String, required: true },
    userEmail: { type: String, required: true },
    chunk: { type: String, required: true },
    chunkIndex: { type: Number, default: 0 },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

EmbeddingSchema.index({ userEmail: 1, fileId: 1 });

export default mongoose.models.Embedding ||
  mongoose.model<IEmbedding>("Embedding", EmbeddingSchema);
