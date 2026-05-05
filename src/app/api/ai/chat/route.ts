import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Embedding from "@/models/Embedding";
import Conversation from "@/models/Conversation";
import { generateEmbedding, cosineSimilarity, getChatModel } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { message, conversationId, fileIds } = body;

  if (!message)
    return NextResponse.json({ error: "Message requis" }, { status: 400 });

  await connectDB();

  // 1. Embedding de la question
  const questionEmbedding = await generateEmbedding(message);

  // 2. Récupération des embeddings pertinents (RAG)
  const query: Record<string, unknown> = { userEmail: session.user.email };
  if (fileIds && fileIds.length > 0) {
    query.fileId = { $in: fileIds };
  }

  const allEmbeddings = await Embedding.find(query).limit(200);

  // Similarité cosinus
  const scored = allEmbeddings.map((emb) => ({
    chunk: emb.chunk,
    fileName: emb.fileName,
    fileId: emb.fileId,
    score: cosineSimilarity(questionEmbedding, emb.embedding),
  }));

  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .filter((c) => c.score > 0.3)
    .slice(0, 5);

  // 3. Contexte RAG
  const context =
    topChunks.length > 0
      ? topChunks
          .map((c, i) => `[Source ${i + 1} - ${c.fileName}]:\n${c.chunk}`)
          .join("\n\n---\n\n")
      : "Aucun document pertinent trouvé dans votre espace.";

  // 4. Récupérer/créer la conversation
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({
      _id: conversationId,
      userEmail: session.user.email,
    });
  }
  if (!conversation) {
    conversation = await Conversation.create({
      userEmail: session.user.email,
      title: message.slice(0, 50),
      messages: [],
      fileIds: fileIds || [],
    });
  }

  // 5. Historique (max 10 derniers échanges)
  const history = conversation.messages.slice(-10);

  // 6. Appel Gemini
  const model = getChatModel();

  const systemPrompt = `Tu es un assistant intelligent qui analyse et répond aux questions basées sur des documents.

Extraits de documents disponibles :

${context}

Instructions :
- Réponds en français
- Base tes réponses UNIQUEMENT sur les documents fournis ci-dessus
- Si tu cites un document, mentionne son nom entre crochets
- Si les documents ne contiennent pas la réponse, dis-le clairement
- Sois précis, structuré et utile
- Ne fabrique pas d'informations qui ne sont pas dans les documents`;

  // Construire l'historique Gemini
  const chatHistory = history.flatMap((m: { role: string; content: string }) => [
    {
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    },
  ]);

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7,
    },
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessage(message);
  const assistantMessage = result.response.text();
  const sources = [...new Set(topChunks.map((c) => c.fileName))];

  // 7. Sauvegarder
  conversation.messages.push(
    { role: "user", content: message, timestamp: new Date() },
    { role: "assistant", content: assistantMessage, sources, timestamp: new Date() }
  );
  await conversation.save();

  return NextResponse.json({
    message: assistantMessage,
    sources,
    conversationId: conversation._id.toString(),
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const conversations = await Conversation.find({ userEmail: session.user.email })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt messages")
    .limit(20);

  return NextResponse.json(conversations);
}
