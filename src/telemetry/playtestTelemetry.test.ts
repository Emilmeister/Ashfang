import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playtestTelemetry } from './playtestTelemetry';

describe('playtestTelemetry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('stores completed run with captured metrics', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T10:00:00.000Z'));

    playtestTelemetry.startRun();
    playtestTelemetry.recordTimeToFun(28_400);
    playtestTelemetry.recordPause();
    playtestTelemetry.recordMenuExit();

    vi.setSystemTime(new Date('2026-03-17T10:00:45.000Z'));
    playtestTelemetry.finishRun('abandoned');

    const runs = playtestTelemetry.getRecentRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      outcome: 'abandoned',
      durationMs: 45_000,
      timeToFunMs: 28_400,
      pauseCount: 1,
      menuExitCount: 1,
    });
  });

  it('ignores repeated time-to-fun updates', () => {
    playtestTelemetry.startRun();
    playtestTelemetry.recordTimeToFun(31_000);
    playtestTelemetry.recordTimeToFun(10_000);
    playtestTelemetry.finishRun('defeat');

    const [run] = playtestTelemetry.getRecentRuns();
    expect(run.timeToFunMs).toBe(31_000);
  });
});
