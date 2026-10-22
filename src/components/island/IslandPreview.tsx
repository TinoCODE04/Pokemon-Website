import type { MouseEvent } from 'react'
import { ISLAND_PREVIEW } from '../../data/islandPreview'

export default function IslandPreview({ selectedId, onSelect }: { selectedId?: number; onSelect: (id: number) => void }) {
  const select = (event: MouseEvent<HTMLButtonElement>, id: number) => {
    if (event.detail === 0) { onSelect(id); return }
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect()
    // Closely spaced touch targets select the nearest actual Pokémon, not the top DOM button.
    const nearest = ISLAND_PREVIEW.pokemon.reduce((best, entry) => {
      const distance = (point: typeof entry) => Math.hypot(bounds.left + bounds.width * point.x / 100 - event.clientX, bounds.top + bounds.height * point.y / 100 - event.clientY)
      return distance(entry) < distance(best) ? entry : best
    })
    onSelect(nearest.id)
  }

  return <div className="island-preview-map" role="group" aria-label="Clickable island preview">
    <img className="island-poster" src="/models/island-poster.webp" alt="A miniature Pokémon island with forests, waterways, a volcano and legendary Pokémon" loading="lazy" width={1400} height={850} />
    {ISLAND_PREVIEW.pokemon.map((entry) => (
      <button key={entry.id} type="button" className="island-hotspot" style={{ left: `${entry.x}%`, top: `${entry.y}%` }} aria-label={`Find ${entry.name} in the preview`} aria-pressed={selectedId === entry.id} onClick={(event) => select(event, entry.id)}>
        <span>{entry.name}</span>
      </button>
    ))}
  </div>
}
