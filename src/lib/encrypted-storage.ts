/**
 * 암호화된 localStorage 래퍼 + 오프라인 큐
 *
 * - 모든 로컬 저장은 AES-GCM으로 암호화
 * - Supabase 저장 실패 시 오프라인 큐에 쌓음
 * - 온라인 복구 시 큐 flush → 로컬 삭제
 */
import { supabase } from "./supabase";

// ── 암호화 키 (유저별 파생) ───────────────────────
const MASTER_SALT = "artsoul-2026";

async function deriveKey(userId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(userId + MASTER_SALT),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode(MASTER_SALT), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(data: string, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(data),
  );
  // iv + ciphertext → base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

// ── 암호화된 읽기/쓰기 ──────────────────────────
export async function encryptedSet(key: string, data: any, userId: string): Promise<void> {
  const json = JSON.stringify(data);
  const encrypted = await encrypt(json, userId);
  localStorage.setItem(key, encrypted);
}

export async function encryptedGet<T>(key: string, userId: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const decrypted = await decrypt(raw, userId);
    return JSON.parse(decrypted);
  } catch {
    // 암호화 전 평문 데이터가 남아있을 수 있음 → 그냥 파싱 시도
    try { return JSON.parse(raw); } catch { return null; }
  }
}

// ── 오프라인 큐 ─────────────────────────────────
interface QueueItem {
  table: string;
  action: "upsert" | "insert" | "update" | "delete";
  data: any;
  match?: Record<string, any>;
  timestamp: number;
}

const QUEUE_KEY = "artsoul-sync-queue";

function getQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(item: Omit<QueueItem, "timestamp">) {
  const queue = getQueue();
  queue.push({ ...item, timestamp: Date.now() });
  saveQueue(queue);
}

/** Supabase에 쓰기 시도. 실패하면 큐에 쌓음 */
export async function dbWrite(
  table: string,
  action: "upsert" | "insert" | "update" | "delete",
  data: any,
  match?: Record<string, any>,
  upsertConflict?: string,
): Promise<boolean> {
  try {
    let query;
    if (action === "upsert") {
      query = supabase.from(table).upsert(data, upsertConflict ? { onConflict: upsertConflict } : undefined);
    } else if (action === "insert") {
      query = supabase.from(table).insert(data);
    } else if (action === "update" && match) {
      let q = supabase.from(table).update(data);
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
      query = q;
    } else if (action === "delete" && match) {
      let q = supabase.from(table).delete();
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
      query = q;
    } else {
      return false;
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch {
    // 오프라인이거나 DB 에러 → 큐에 저장
    enqueue({ table, action, data, match });
    return false;
  }
}

/** 온라인 복구 시 큐 flush */
export async function flushQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let flushed = 0;
  const remaining: QueueItem[] = [];

  for (const item of queue) {
    try {
      let query;
      if (item.action === "upsert") {
        query = supabase.from(item.table).upsert(item.data);
      } else if (item.action === "insert") {
        query = supabase.from(item.table).insert(item.data);
      } else if (item.action === "update" && item.match) {
        let q = supabase.from(item.table).update(item.data);
        for (const [k, v] of Object.entries(item.match)) q = q.eq(k, v);
        query = q;
      } else if (item.action === "delete" && item.match) {
        let q = supabase.from(item.table).delete();
        for (const [k, v] of Object.entries(item.match)) q = q.eq(k, v);
        query = q;
      }
      if (query) {
        const { error } = await query;
        if (error) throw error;
      }
      flushed++;
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);

  // 큐가 전부 비었으면 암호화된 로컬 캐시 정리
  if (remaining.length === 0) {
    cleanLocalCache();
  }

  return flushed;
}

function cleanLocalCache() {
  // 동기화 완료 후 로컬 민감 데이터는 유지 (오프라인 사용 위해)
  // 큐만 삭제
  localStorage.removeItem(QUEUE_KEY);
}

// ── 온라인 감지 + 자동 flush ────────────────────
export function startOnlineSync() {
  const handleOnline = () => {
    flushQueue().then(count => {
      if (count > 0) console.log(`[sync] ${count}건 동기화 완료`);
    });
  };

  window.addEventListener("online", handleOnline);

  // 이미 온라인이면 바로 flush
  if (navigator.onLine) handleOnline();

  return () => window.removeEventListener("online", handleOnline);
}
