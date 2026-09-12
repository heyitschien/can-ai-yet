import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_CACHE_TTL_MS,
  type DemandProvenance,
  type DemandTarget,
} from "@/lib/demand/types";

export interface DemandCacheRecord<T> {
  key: string;
  storedAt: string;
  expiresAt: string;
  provenance: DemandProvenance;
  value: T;
}

export interface DemandCache {
  get<T>(key: string): Promise<DemandCacheRecord<T> | null>;
  set<T>(key: string, value: T, provenance: DemandProvenance, ttlMs?: number): Promise<DemandCacheRecord<T>>;
}

export interface CacheKeyInput {
  source: string;
  apiVersion: string;
  operation: string;
  seedOrKeywords: string;
  target: DemandTarget;
}

export function buildDemandCacheKey(input: CacheKeyInput): string {
  const material = [
    input.source,
    input.apiVersion,
    input.operation,
    input.seedOrKeywords.trim().toLowerCase(),
    input.target.geoTargetConstant,
    input.target.languageConstant,
    input.target.network,
    input.target.country,
    input.target.language,
  ].join("|");
  return createHash("sha256").update(material).digest("hex");
}

export class FileSystemDemandCache implements DemandCache {
  constructor(private readonly rootDir = path.join(process.cwd(), ".cache", "demand")) {}

  async get<T>(key: string): Promise<DemandCacheRecord<T> | null> {
    try {
      const raw = await readFile(this.filePath(key), "utf8");
      const parsed = JSON.parse(raw) as DemandCacheRecord<T>;
      if (Date.parse(parsed.expiresAt) <= Date.now()) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    provenance: DemandProvenance,
    ttlMs = DEFAULT_CACHE_TTL_MS,
  ): Promise<DemandCacheRecord<T>> {
    await mkdir(this.rootDir, { recursive: true });
    const storedAt = new Date().toISOString();
    const record: DemandCacheRecord<T> = {
      key,
      storedAt,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      provenance: {
        ...provenance,
        cached: false,
        cacheRetrievedAt: null,
        originalRetrievedAt: provenance.originalRetrievedAt ?? provenance.retrievedAt,
      },
      value,
    };
    await writeFile(this.filePath(key), JSON.stringify(record, null, 2), "utf8");
    return record;
  }

  private filePath(key: string): string {
    return path.join(this.rootDir, `${key}.json`);
  }
}

export function markCachedProvenance(
  provenance: DemandProvenance,
  cacheRetrievedAt = new Date().toISOString(),
): DemandProvenance {
  return {
    ...provenance,
    cached: true,
    cacheRetrievedAt,
    originalRetrievedAt: provenance.originalRetrievedAt ?? provenance.retrievedAt,
  };
}
