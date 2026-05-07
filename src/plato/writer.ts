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
  }
  
  /**
   * Write a passing insight to PLATO
   */
  async writeInsight(insight: Insight, quality: QualityScore): Promise<boolean> {
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
      await this.client.post(`/room/${this.room}/submit`, tile);
      return true;
    } catch (error) {
      // Try alternative endpoint format
      try {
        await this.client.post(`/api/room/${this.room}`, tile);
        return true;
      } catch (altError) {
        console.error(`[PlatoWriter] Failed to write insight: ${error instanceof Error ? error.message : String(error)}`);
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