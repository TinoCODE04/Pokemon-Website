interface IslandLoadEnvironment {
  compact: boolean
  coarsePointer: boolean
  saveData: boolean
  effectiveType?: string
}

export function getIslandProfile({ compact, coarsePointer, saveData, effectiveType }: IslandLoadEnvironment): 'mobile' | 'desktop' {
  return compact || coarsePointer || saveData || effectiveType === 'slow-2g' || effectiveType === '2g' ? 'mobile' : 'desktop'
}

export function shouldAutoLoadIsland(environment: IslandLoadEnvironment): boolean {
  return getIslandProfile(environment) === 'desktop'
}
