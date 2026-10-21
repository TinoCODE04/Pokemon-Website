interface IslandLoadEnvironment {
  compact: boolean
  coarsePointer: boolean
  saveData: boolean
}

export function shouldAutoLoadIsland({ compact, coarsePointer, saveData }: IslandLoadEnvironment): boolean {
  return !compact && !coarsePointer && !saveData
}
