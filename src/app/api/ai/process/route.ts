import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";
import Embedding from "@/models/Embedding";
import { generateEmbedding, analyzeImage, transcribeMedia } from "@/lib/gemini";

export const maxDuration = 300;

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function extractText(
  url: string,
  mimeType: string,
  accessToken?: string
): Promise<string> {
  let buffer: Buffer;

  if (accessToken && url.includes("google")) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    const response = await fetch(url);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  if (mimeType === "application/pdf" || url.endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (await import("pdf-parse")) as any;
    const fn = pdfParse.default || pdfParse;
    const data = await fn(buffer);
    return data.text;
  }

  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    url.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return buffer.toString("utf-8");
  }

  return "";
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { fileId, userEmail, accessToken } = body;

  await connectDB();
  const file = await File.findById(fileId);
  if (!file || file.userEmail !== userEmail) {
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  }

  try {
    let textContent = "";

    if (file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/")) {
      // Transcription via Gemini (supporte audio et vidéo nativement)
      try {
        const transcription = await transcribeMedia(file.url, file.mimeType, file.name);
        textContent = transcription;
        file.transcription = transcription;
      } catch (err) {
        console.error("Erreur transcription Gemini:", err);
        textContent = `[Transcription non disponible pour ${file.name}]`;
      }
    } else if (file.mimeType.startsWith("image/")) {
      // Description image via Gemini Vision
      try {
        textContent = await analyzeImage(file.url);
      } catch (err) {
        console.error("Erreur analyse image Gemini:", err);
        textContent = `[Image: ${file.name}]`;
      }
    } else {
      // Extraction texte PDF, DOCX, TXT, etc.
      try {
        textContent = await extractText(file.url, file.mimeType, accessToken);
      } catch (err) {
        console.error("Erreur extraction texte:", err);
        textContent = "";
      }
    }

    if (textContent && textContent.trim().length > 10) {
      file.content = textContent.slice(0, 50000);

      const chunks = chunkText(textContent);
      await Embedding.deleteMany({ fileId });

      // Embeddings par chunks (max 20 pour ne pas saturer)
      for (let i = 0; i < Math.min(chunks.length, 20); i++) {
        const chunk = chunks[i].trim();
        if (chunk.length < 10) continue;

        try {
          const embedding = await generateEmbedding(chunk);
          await Embedding.create({
            fileId,
            fileName: file.name,
            userEmail,
            chunk,
            chunkIndex: i,
            embedding,
          });
        } catch (embErr) {
          console.error(`Erreur embedding chunk ${i}:`, embErr);
        }
      }
    }

    file.processed = true;
    await file.save();

    return NextResponse.json({ success: true, fileId });
  } catch (error) {
    console.error("Erreur traitement fichier:", error);
    file.processed = true;
    await file.save();
    return NextResponse.json({ error: "Erreur traitement" }, { status: 500 });
  }
}
