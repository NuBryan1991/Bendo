import { useStudioStore } from '../store/useStudioStore'

export function useProject(projectId: string | undefined) {
  return useStudioStore((s) => s.projects.find((p) => p.id === projectId))
}
