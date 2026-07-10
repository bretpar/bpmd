// LocalStorage helpers for patient phase state on program pages.
// Kept namespaced separately from workout progress so nothing existing breaks.

export type PhaseState = {
  currentPhaseId: string | null;
  completedPhaseIds: string[];
};

const key = (slug: string) => `bpmd:program:${slug}:phase_state`;

export const loadPhaseState = (slug: string): PhaseState => {
  try {
    const raw = localStorage.getItem(key(slug));
    if (!raw) return { currentPhaseId: null, completedPhaseIds: [] };
    const parsed = JSON.parse(raw);
    return {
      currentPhaseId: parsed.currentPhaseId ?? null,
      completedPhaseIds: Array.isArray(parsed.completedPhaseIds) ? parsed.completedPhaseIds : [],
    };
  } catch {
    return { currentPhaseId: null, completedPhaseIds: [] };
  }
};

export const savePhaseState = (slug: string, state: PhaseState) => {
  try { localStorage.setItem(key(slug), JSON.stringify(state)); } catch { /* noop */ }
};

export const setCurrentPhase = (slug: string, phaseId: string) => {
  const s = loadPhaseState(slug);
  savePhaseState(slug, { ...s, currentPhaseId: phaseId });
};

export const markPhaseCompleted = (slug: string, phaseId: string) => {
  const s = loadPhaseState(slug);
  if (!s.completedPhaseIds.includes(phaseId)) s.completedPhaseIds.push(phaseId);
  savePhaseState(slug, s);
};

export type PhaseStatus = "start" | "current" | "completed" | "next" | "upcoming";

export const phaseStatusFor = (
  phaseId: string,
  index: number,
  phases: { id: string }[],
  state: PhaseState,
): PhaseStatus => {
  if (state.completedPhaseIds.includes(phaseId)) return "completed";
  if (state.currentPhaseId === phaseId) return "current";
  if (!state.currentPhaseId && index === 0) return "start";
  if (state.currentPhaseId) {
    const curIdx = phases.findIndex((p) => p.id === state.currentPhaseId);
    if (curIdx >= 0 && index === curIdx + 1) return "next";
  }
  return "upcoming";
};
