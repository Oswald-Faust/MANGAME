import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Modèle principal pour le chat et l'analyse
export const getChatModel = () =>
  genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Modèle pour les embeddings
export const getEmbeddingModel = () =>
  genAI.getGenerativeModel({ model: "text-embedding-004" });

// Génère un embedding pour un texte
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text.slice(0, 8000));
  return result.embedding.values;
}

// Similarité cosinus
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

// Analyse une image en base64 ou URL
export async function analyzeImage(imageUrl: string): Promise<string> {
  const model = getChatModel();

  // Télécharger l'image et la convertir en base64
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const base64 = buffer.toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    "Décris le contenu de cette image en détail, en français.",
  ]);

  return result.response.text();
}

// Transcrit un fichier audio/vidéo via Gemini
export async function transcribeMedia(
  url: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const model = getChatModel();

  // Télécharger le fichier
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString("base64");

  // Gemini peut traiter directement audio et vidéo
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType,
        data: base64,
      },
    },
    `Transcris le contenu audio/vidéo de ce fichier (${fileName}) en français.
     Fournis une transcription complète et fidèle.
     Si c'est une vidéo, décris aussi ce qui se passe visuellement.`,
  ]);

  return result.response.text();
}

export default genAI;
