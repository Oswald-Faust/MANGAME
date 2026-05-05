import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "googleapis";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken)
    return NextResponse.json({ error: "Non authentifié ou Drive non connecté" }, { status: 401 });

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken") || undefined;
    const folderId = searchParams.get("folderId") || "root";

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink, parents)",
      pageSize: 50,
      pageToken,
      orderBy: "folder,name",
    });

    return NextResponse.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number; status?: string };
    console.error("Erreur Drive:", err);
    if (err.code === 401) {
      return NextResponse.json({ error: "Token expiré, reconnectez-vous" }, { status: 401 });
    }
    if (
      err.status === "PERMISSION_DENIED" ||
      (err.message || "").toLowerCase().includes("insufficient authentication scopes") ||
      (err.message || "").toLowerCase().includes("scope")
    ) {
      return NextResponse.json({ error: "insufficient_scopes" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur Google Drive" }, { status: 500 });
  }
}

// Synchroniser un fichier Drive dans notre DB
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { driveFile } = body;

  await connectDB();

  const existing = await File.findOne({
    driveFileId: driveFile.id,
    userEmail: session.user.email,
  });

  if (existing) return NextResponse.json(existing);

  const savedFile = await File.create({
    name: driveFile.name,
    userEmail: session.user.email,
    mimeType: driveFile.mimeType || "application/octet-stream",
    size: parseInt(driveFile.size || "0"),
    url: driveFile.webViewLink || "",
    source: "google-drive",
    driveFileId: driveFile.id,
    driveViewLink: driveFile.webViewLink,
    processed: false,
  });

  // Lancer le traitement
  fetch(`${process.env.NEXTAUTH_URL}/api/ai/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.NEXTAUTH_SECRET!,
    },
    body: JSON.stringify({
      fileId: savedFile._id.toString(),
      userEmail: session.user.email,
      accessToken: session.accessToken,
    }),
  }).catch(console.error);

  return NextResponse.json(savedFile, { status: 201 });
}
