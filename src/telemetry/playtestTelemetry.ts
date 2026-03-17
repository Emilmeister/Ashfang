export type PlaytestOutcome = 'victory' | 'defeat' | 'abandoned';

export type PlaytestRun = {
  id: string;
  startedAtIso: string;
  outcome: PlaytestOutcome;
  durationMs: number;
  timeToFunMs: number | null;
  pauseCount: number;
  menuExitCount: number;
};

const STORAGE_KEY = 'ashfang-playtest-runs';
const MAX_STORED_RUNS = 20;

type ActiveRun = {
  id: string;
  startedAtEpochMs: number;
  startedAtIso: string;
  timeToFunMs: number | null;
  pauseCount: number;
  menuExitCount: number;
};

const getStorage = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

const readRuns = (): PlaytestRun[] => {
  const storage = getStorage();
  const raw = storage?.getItem(STORAGE_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as PlaytestRun[]) : [];
};

const writeRuns = (runs: PlaytestRun[]): void => {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(runs.slice(-MAX_STORED_RUNS)));
};

class PlaytestTelemetry {
  private activeRun: ActiveRun | null = null;

  startRun(): void {
    this.activeRun = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10_000)}`,
      startedAtEpochMs: Date.now(),
      startedAtIso: new Date().toISOString(),
      timeToFunMs: null,
      pauseCount: 0,
      menuExitCount: 0,
    };
  }

  recordTimeToFun(timeToFunMs: number): void {
    if (!this.activeRun || this.activeRun.timeToFunMs !== null) return;
    this.activeRun.timeToFunMs = Math.max(0, Math.round(timeToFunMs));
  }

  recordPause(): void {
    if (!this.activeRun) return;
    this.activeRun.pauseCount += 1;
  }

  recordMenuExit(): void {
    if (!this.activeRun) return;
    this.activeRun.menuExitCount += 1;
  }

  finishRun(outcome: PlaytestOutcome): void {
    if (!this.activeRun) return;

    const completedRun: PlaytestRun = {
      id: this.activeRun.id,
      startedAtIso: this.activeRun.startedAtIso,
      outcome,
      durationMs: Date.now() - this.activeRun.startedAtEpochMs,
      timeToFunMs: this.activeRun.timeToFunMs,
      pauseCount: this.activeRun.pauseCount,
      menuExitCount: this.activeRun.menuExitCount,
    };

    writeRuns([...readRuns(), completedRun]);
    this.activeRun = null;
  }

  getRecentRuns(): PlaytestRun[] {
    return readRuns();
  }
}

export const playtestTelemetry = new PlaytestTelemetry();
