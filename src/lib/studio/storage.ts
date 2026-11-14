import type { BuildProject } from '@/types/brick';
import { sanitizeBins, type BuildBin } from './bins';
import { sanitizeProject } from './share';

const AUTOSAVE_KEY = 'builders-bench:studio:autosave';
const BINS_KEY = 'builders-bench:studio:bins';
const SOUND_KEY = 'builders-bench:studio:sound';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

function readJson(key: string): unknown {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Autosave stores the full project JSON and runs it back through validation. */
export function loadAutosave(): BuildProject | null {
  return sanitizeProject(readJson(AUTOSAVE_KEY));
}

export function saveAutosave(project: BuildProject): void {
  write(AUTOSAVE_KEY, JSON.stringify(project));
}

export function loadBins(): BuildBin[] {
  return sanitizeBins(readJson(BINS_KEY));
}

export function saveBins(bins: BuildBin[]): void {
  write(BINS_KEY, JSON.stringify(bins));
}

export function loadSoundEnabled(): boolean {
  return read(SOUND_KEY) !== 'off';
}

export function saveSoundEnabled(on: boolean): void {
  write(SOUND_KEY, on ? 'on' : 'off');
}
