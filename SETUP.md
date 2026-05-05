# DocAI - Guide de configuration

## Stack
- **Next.js 16** + TypeScript + Tailwind CSS
- **MongoDB** (Atlas)
- **Vercel Blob** (stockage fichiers)
- **NextAuth v5** (Google OAuth)
- **OpenAI** (GPT-4o + Whisper + Embeddings)
- **Google Drive API** (lecture des fichiers)

---

## 1. Variables d'environnement

Copiez `.env.example` en `.env.local` et remplissez les valeurs.

### MongoDB
Déjà configuré dans le brief :
```
MONGODB_URI=mongodb+srv://faust:faust@cluster0.n0tuv0c.mongodb.net/?appName=Cluster0
```

### NextAuth Secret
```bash
openssl rand -base64 32
```

### Google OAuth + Drive API

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un projet ou utiliser un existant
3. Activer les APIs :
   - **Google Drive API**
   - **Google OAuth 2.0**
4. Créer des identifiants OAuth 2.0 (type: Application Web)
5. Ajouter les URIs de redirection :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://votre-domaine.vercel.app/api/auth/callback/google`
6. Copier Client ID et Client Secret

### OpenAI API
1. Aller sur [platform.openai.com](https://platform.openai.com/api-keys)
2. Créer une nouvelle clé API
3. Modèles utilisés : `gpt-4o`, `whisper-1`, `text-embedding-3-small`

### Vercel Blob
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Storage → Create Store → Blob
3. Connecter au projet
4. Copier `BLOB_READ_WRITE_TOKEN`

---

## 2. Installation et démarrage

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

---

## 3. Architecture

```
src/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── signin/page.tsx             # Page de connexion Google
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handlers
│       ├── files/                  # CRUD fichiers
│       ├── folders/                # CRUD dossiers
│       ├── upload/                 # Upload vers Vercel Blob
│       ├── drive/                  # Proxy Google Drive API
│       ├── ai/
│       │   ├── chat/               # Chat IA avec RAG
│       │   └── process/            # Traitement fichiers (PDF, DOCX, vidéo)
│       └── stats/                  # Statistiques
├── components/
│   ├── Sidebar.tsx                 # Navigation
│   ├── FileExplorer.tsx            # Gestionnaire de fichiers local
│   ├── DriveExplorer.tsx           # Explorateur Google Drive
│   ├── AIChat.tsx                  # Interface chat IA
│   ├── FileViewer.tsx              # Visualiseur de fichiers
│   ├── UploadZone.tsx              # Zone drag & drop upload
│   └── FileIcon.tsx                # Icônes de fichiers
├── lib/
│   ├── mongodb.ts                  # Connexion MongoDB
│   ├── auth.ts                     # Configuration NextAuth
│   ├── openai.ts                   # Client OpenAI + embeddings
│   └── utils.ts                    # Utilitaires
└── models/
    ├── User.ts                     # Modèle utilisateur
    ├── File.ts                     # Modèle fichier
    ├── Folder.ts                   # Modèle dossier
    ├── Embedding.ts                # Modèle embeddings RAG
    └── Conversation.ts             # Modèle conversations IA
```

---

## 4. Fonctionnalités

### Gestion de fichiers
- Upload par drag & drop (tous types : PDF, Word, images, vidéos, etc.)
- Création de dossiers organisés
- Navigation par arborescence (breadcrumb)
- Vue grille ou liste
- Recherche dans les fichiers
- Suppression avec nettoyage du Blob

### Google Drive
- Connexion via OAuth Google (scope `drive.readonly`)
- Navigation dans les dossiers Drive
- Import des fichiers Drive dans l'app
- Vue dans l'interface native Google Drive

### Assistant IA (RAG)
- **PDF** : extraction texte via `pdf-parse`
- **DOCX/Word** : extraction texte via `mammoth`
- **Images** : description via GPT-4o Vision
- **Vidéos/Audio** : transcription via OpenAI Whisper
- **Texte brut, JSON, code** : lecture directe
- Génération d'embeddings par chunks (text-embedding-3-small)
- Recherche sémantique par similarité cosinus
- Chat contextuel avec historique de conversation
- Attribution des sources dans les réponses

---

## 5. Déploiement sur Vercel

```bash
vercel --prod
```

Ajouter toutes les variables d'environnement dans les Settings Vercel.

Mettre à jour `NEXTAUTH_URL` avec l'URL de production.
