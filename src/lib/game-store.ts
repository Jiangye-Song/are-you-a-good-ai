import { GameState } from '@/types/game';

class GameStore {
  private games = new Map<string, GameState>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

  set(sessionId: string, state: GameState): void {
    this.games.set(sessionId, state);

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.games.delete(sessionId);
    }, this.TTL);
  }

  get(sessionId: string): GameState | undefined {
    return this.games.get(sessionId);
  }

  delete(sessionId: string): void {
    this.games.delete(sessionId);
  }

  // Optional: Cleanup old sessions
  cleanup(): void {
    const now = Date.now();
    for (const [id, state] of this.games.entries()) {
      if (now - state.createdAt.getTime() > this.TTL) {
        this.games.delete(id);
      }
    }
  }
}

export const gameStore = new GameStore();
