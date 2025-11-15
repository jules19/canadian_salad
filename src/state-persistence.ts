import * as fs from 'fs';
import * as path from 'path';
import { Room } from './types';

const STATE_DIR = path.join(process.cwd(), 'game-states');
const SNAPSHOT_INTERVAL_MS = 30 * 1000; // 30 seconds

export class StatePersistence {
  private snapshotTimer: NodeJS.Timer | null = null;

  constructor() {
    // Ensure state directory exists
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
  }

  /**
   * Starts periodic snapshots
   */
  startPeriodicSnapshots(getRooms: () => Room[]): void {
    if (this.snapshotTimer) {
      return; // Already running
    }

    this.snapshotTimer = setInterval(() => {
      this.saveSnapshot(getRooms());
    }, SNAPSHOT_INTERVAL_MS);

    console.log('State persistence enabled (snapshots every 30s)');
  }

  /**
   * Stops periodic snapshots
   */
  stopPeriodicSnapshots(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  /**
   * Saves a snapshot of all rooms
   */
  saveSnapshot(rooms: Room[]): void {
    if (rooms.length === 0) {
      return; // No need to save empty state
    }

    const timestamp = Date.now();
    const filename = `game-state-${timestamp}.json`;
    const filepath = path.join(STATE_DIR, filename);

    try {
      const data = JSON.stringify({ timestamp, rooms }, null, 2);
      fs.writeFileSync(filepath, data, 'utf-8');

      // Clean up old snapshots (keep last 10)
      this.cleanupOldSnapshots(10);
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    }
  }

  /**
   * Loads the most recent snapshot
   */
  loadLatestSnapshot(): Room[] | null {
    try {
      const files = fs.readdirSync(STATE_DIR)
        .filter(f => f.startsWith('game-state-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[0];
      const filepath = path.join(STATE_DIR, latestFile);
      const data = fs.readFileSync(filepath, 'utf-8');
      const parsed = JSON.parse(data);

      console.log(`Loaded snapshot from ${latestFile} with ${parsed.rooms.length} rooms`);
      return parsed.rooms;
    } catch (error) {
      console.error('Failed to load snapshot:', error);
      return null;
    }
  }

  /**
   * Cleans up old snapshots, keeping only the most recent N
   */
  private cleanupOldSnapshots(keepCount: number): void {
    try {
      const files = fs.readdirSync(STATE_DIR)
        .filter(f => f.startsWith('game-state-') && f.endsWith('.json'))
        .sort()
        .reverse();

      // Delete old files
      files.slice(keepCount).forEach(file => {
        const filepath = path.join(STATE_DIR, file);
        fs.unlinkSync(filepath);
      });
    } catch (error) {
      console.error('Failed to cleanup snapshots:', error);
    }
  }

  /**
   * Manual save (for graceful shutdown)
   */
  saveBeforeShutdown(rooms: Room[]): void {
    console.log('Saving state before shutdown...');
    this.saveSnapshot(rooms);
  }
}
