import { useStudioStore } from '../../store/useStudioStore'
import { Segmented } from '../ui/Field'
import { useEditor } from './EditorContext'

/** Interruptor Journey (solo frontstage) / Blueprint (frontstage + backstage). */
export function ViewToggle() {
  const { map, view } = useEditor()
  const setMapView = useStudioStore((s) => s.setMapView)
  return (
    <Segmented
      label="Vista del mapa"
      hideLabel
      value={view}
      onChange={(v) => setMapView(map.id, v)}
      options={[
        { value: 'journey', label: 'Journey' },
        { value: 'blueprint', label: 'Blueprint' },
      ]}
    />
  )
}
