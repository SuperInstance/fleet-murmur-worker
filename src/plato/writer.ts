import axios, { AxiosInstance } from 'axios';
import { Insight } from '../strategies';
import { QualityScore } from '../quality';

export interface InsightTile {
  domain: string;
  question: string;
  answer: string;
  confidence: number;
  source: string;
  quality: QualityScore;
  timestamp?: number;
}

export class PlatoWriter {
  private client: AxiosInstance;
  private writtenSlugs = new Set<string>();
  private room: string;
  
  constructor(baseUrl: string = 'http://localhost:8847', room: string = 'murmur_insights') {
    this.room = room;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Pre-populate already-written slugs from PLATO room
    this.prePopulateSlugs().catch(e => console.warn('[PlatoWriter] Pre-populate failed:', e.message));
  }
  
  /**
   * Write a passing insight to PLATO
   */
  private async prePopulateSlugs(): Promise<void> {
    try {
      const res = await this.client.get('/room/murmur_insights');
      const tiles = (res.data as any)?.tiles || [];
      for (const tile of tiles) {
        if (tile.answer) {
          const q = tile.question || '';
          const sm2 = q.match(/strategy:(\w+)/);
          const tm2 = q.match(/theorem:(\w+)/);
          if (sm2 && tm2) {
            const insightSlug = tile.question?.split('insight:')[1] || '';
          if (insightSlug) { this.writtenSlugs.add(sm2[1] + '_' + tm2[1] + '_' + insightSlug); }
          }
        }
      }
      console.log('[PlatoWriter] Pre-populated', this.writtenSlugs.size, 'slugs from PLATO');
    } catch(e) {
      console.warn('[PlatoWriter] Pre-populate error:', e instanceof Error ? e.message : String(e));
    }
  }

  async writeInsight(insight: Insight, quality: QualityScore): Promise<boolean> {
    const slug = `${insight.strategy}_${insight.theorem.id}_${this.slugify(insight.content)}`;
    if (this.writtenSlugs.has(slug)) {
      // Already written, skip silently
    }
    const tile: InsightTile = {
      domain: 'murmur_insights',
      question: `strategy:${insight.strategy} theorem:${insight.theorem.id} insight:${this.slugify(insight.content)}`,
      answer: insight.content,
      confidence: quality.overall,
      source: 'fleet-murmur-worker',
      quality,
      timestamp: insight.timestamp || Date.now(),
    };
    
    try {
      // Write to PLATO room via HTTP API
      const res = await this.client.post(`/room/${this.room}/submit`, tile);
      const result = res.data;
      if (result.status === "accepted") { this.writtenSlugs.add(slug); return true; }
      return false;
    } catch (error) {
      // Try alternative endpoint format
      try {
        await this.client.post(`/api/room/${this.room}`, tile);
        return true;
      } catch (altError) {
        const err = error as any;
        const status = err?.response?.status;
        if (status === 403) { return false; }
        console.error(`[PlatoWriter] Failed: ${status} - ${err?.response?.data?.reason || err.message}`);
        return false;
      }
    }
  }
  
  /**
   * Check PLATO connectivity
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  private slugify(text: string): string {
    // Create a short slug from the insight content
    const words = text.split(/\s+/).slice(0, 5);
    return words.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
}

export const defaultWriter = new PlatoWriter();