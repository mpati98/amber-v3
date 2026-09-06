import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), ".data");

export type PublicationStatus = "TO_READ" | "READING" | "READ" | "ABANDONED";
export type PublicationFormat = "PHYSICAL" | "EBOOK" | "AUDIOBOOK";
export type DocumentType = "TEXT" | "CHECKLIST" | "MINDMAP" | "IMAGE" | "FILE";

export type Publication = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  coverUrl: string | null;
  format: PublicationFormat;
  status: PublicationStatus;
  rating: number | null;
  currentPage: number | null;
  totalPages: number | null;
  tags: string; // JSON-stringified array
  url: string | null;
  review: string | null;
  notes: string | null;
  dateAdded: string;
  dateStarted: string | null;
  dateFinished: string | null;
};

export type Highlight = {
  id: string;
  publicationId: string;
  quote: string;
  page: number | null;
  note: string | null;
  createdAt: string;
};

export type ReadingGoal = {
  id: string;
  year: number;
  targetBooks: number | null;
  targetPages: number | null;
  note: string | null;
};

export type Topic = {
  id: string;
  name: string;
  description: string | null;
};

export type Document = {
  id: string;
  title: string;
  type: DocumentType;
  content: string | null;
  attachmentUrl: string | null;
  tags: string;
  pinned: boolean;
  sourceUrl: string | null;
  topicId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Tables = {
  publications: Publication[];
  highlights: Highlight[];
  readingGoals: ReadingGoal[];
  topics: Topic[];
  documents: Document[];
};

function filePath(name: keyof Tables) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensureFile(name: keyof Tables, seed: unknown[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(seed, null, 2));
  }
}

function read<T>(name: keyof Tables): T[] {
  ensureFile(name, []);
  return JSON.parse(fs.readFileSync(filePath(name), "utf-8"));
}

function write<T>(name: keyof Tables, data: T[]) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

export const db = {
  id: () => randomUUID(),

  publications: {
    findMany(): Publication[] {
      return read<Publication>("publications");
    },
    findUnique(id: string): Publication | undefined {
      return read<Publication>("publications").find((p) => p.id === id);
    },
    create(data: Partial<Publication>): Publication {
      const items = read<Publication>("publications");
      const item: Publication = {
        id: db.id(),
        title: "",
        author: null,
        isbn: null,
        coverUrl: null,
        format: "PHYSICAL",
        status: "TO_READ",
        rating: null,
        currentPage: null,
        totalPages: null,
        tags: "[]",
        url: null,
        review: null,
        notes: null,
        dateAdded: new Date().toISOString(),
        dateStarted: null,
        dateFinished: null,
        ...data,
      };
      items.unshift(item);
      write("publications", items);
      return item;
    },
    update(id: string, data: Partial<Publication>): Publication | undefined {
      const items = read<Publication>("publications");
      const idx = items.findIndex((p) => p.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...data };
      write("publications", items);
      return items[idx];
    },
    delete(id: string) {
      const items = read<Publication>("publications").filter((p) => p.id !== id);
      write("publications", items);
      // cascade delete highlights
      const highlights = read<Highlight>("highlights").filter((h) => h.publicationId !== id);
      write("highlights", highlights);
    },
  },

  highlights: {
    findMany(publicationId?: string): Highlight[] {
      const items = read<Highlight>("highlights");
      return publicationId ? items.filter((h) => h.publicationId === publicationId) : items;
    },
    create(data: Omit<Highlight, "id" | "createdAt">): Highlight {
      const items = read<Highlight>("highlights");
      const item: Highlight = { id: db.id(), createdAt: new Date().toISOString(), ...data };
      items.unshift(item);
      write("highlights", items);
      return item;
    },
    update(id: string, data: Partial<Highlight>): Highlight | undefined {
      const items = read<Highlight>("highlights");
      const idx = items.findIndex((h) => h.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...data };
      write("highlights", items);
      return items[idx];
    },
    delete(id: string) {
      write("highlights", read<Highlight>("highlights").filter((h) => h.id !== id));
    },
    random(): (Highlight & { publication?: Pick<Publication, "title" | "author" | "coverUrl"> }) | null {
      const items = read<Highlight>("highlights");
      if (items.length === 0) return null;
      const pick = items[Math.floor(Math.random() * items.length)];
      const pub = read<Publication>("publications").find((p) => p.id === pick.publicationId);
      return { ...pick, publication: pub ? { title: pub.title, author: pub.author, coverUrl: pub.coverUrl } : undefined };
    },
  },

  readingGoals: {
    findMany(): ReadingGoal[] {
      return read<ReadingGoal>("readingGoals").sort((a, b) => b.year - a.year);
    },
    findByYear(year: number): ReadingGoal | undefined {
      return read<ReadingGoal>("readingGoals").find((g) => g.year === year);
    },
    upsert(year: number, data: Partial<ReadingGoal>): ReadingGoal {
      const items = read<ReadingGoal>("readingGoals");
      const idx = items.findIndex((g) => g.year === year);
      if (idx === -1) {
        const item: ReadingGoal = { id: db.id(), year, targetBooks: null, targetPages: null, note: null, ...data };
        items.push(item);
        write("readingGoals", items);
        return item;
      }
      items[idx] = { ...items[idx], ...data };
      write("readingGoals", items);
      return items[idx];
    },
  },

  topics: {
    findMany(): (Topic & { documentCount: number })[] {
      const topics = read<Topic>("topics");
      const documents = read<Document>("documents");
      return topics
        .map((t) => ({ ...t, documentCount: documents.filter((d) => d.topicId === t.id).length }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    upsertByName(name: string, description?: string | null): Topic {
      const items = read<Topic>("topics");
      const existing = items.find((t) => t.name === name);
      if (existing) return existing;
      const item: Topic = { id: db.id(), name, description: description ?? null };
      items.push(item);
      write("topics", items);
      return item;
    },
  },

  documents: {
    findMany(): Document[] {
      return read<Document>("documents").sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    findUnique(id: string): Document | undefined {
      return read<Document>("documents").find((d) => d.id === id);
    },
    create(data: Partial<Document>): Document {
      const items = read<Document>("documents");
      const now = new Date().toISOString();
      const item: Document = {
        id: db.id(),
        title: "",
        type: "TEXT",
        content: null,
        attachmentUrl: null,
        tags: "[]",
        pinned: false,
        sourceUrl: null,
        topicId: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      items.unshift(item);
      write("documents", items);
      return item;
    },
    update(id: string, data: Partial<Document>): Document | undefined {
      const items = read<Document>("documents");
      const idx = items.findIndex((d) => d.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      write("documents", items);
      return items[idx];
    },
    delete(id: string) {
      write("documents", read<Document>("documents").filter((d) => d.id !== id));
    },
    random(): (Document & { topic?: Topic }) | null {
      const items = read<Document>("documents");
      if (items.length === 0) return null;
      const sorted = [...items].sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );
      const pool = sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 2)));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const topics = read<Topic>("topics");
      const topic = topics.find((t) => t.id === pick.topicId);
      return { ...pick, topic };
    },
  },
};
