import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Compass, Search, X } from 'lucide-react'
import type { IslandPokemon } from './islandScene'
import IslandPokemonImage from './IslandPokemonImage'

interface Props {
  pokemon: IslandPokemon[]
  selected: IslandPokemon | null
  disabled: boolean
  onSelect: (id: number) => void
}

export default function IslandPokemonPicker({ pokemon, selected, disabled, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const panelId = useId()
  const term = query.trim().toLowerCase().replace(/^#/, '')
  const results = pokemon.filter((entry) => entry.name.toLowerCase().includes(term) || String(entry.id).padStart(3, '0').includes(term))

  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const close = () => { setOpen(false); trigger.current?.focus() }

  return <div ref={root} className="island-picker" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={(event) => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
  }}>
    <button ref={trigger} className="island-picker-trigger" disabled={disabled}
      aria-label={selected ? `Find a Pokémon on the island, selected ${selected.name}` : 'Find a Pokémon on the island'}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined}
      onClick={() => { setQuery(''); setOpen(!open) }}>
      {selected ? <IslandPokemonImage id={selected.id} className="island-trigger-image" /> : <Compass size={20} />}
      <span className="island-trigger-copy"><span>{selected?.name ?? 'Find a Pokémon'}</span><small>{selected ? `#${String(selected.id).padStart(3, '0')} · On the island` : `${pokemon.length || 34} legends to discover`}</small></span>
      <ChevronDown size={15} className={open ? 'island-chevron-open' : ''} />
    </button>
    {open && <div id={panelId} role="dialog" aria-label="Find a Pokémon" className="island-picker-panel">
      <div className="island-picker-heading"><div><h3>Find your legend</h3><p>Choose a Pokémon to explore the island.</p></div><button className="island-button" aria-label="Close Pokémon picker" onClick={close}><X size={16} /></button></div>
      <div className="island-picker-search"><Search size={16} /><input ref={search} value={query} aria-label="Search island Pokémon" placeholder="Search name or #number…" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>('.island-pokemon-option')?.focus() }
        if (event.key === 'Enter' && results.length === 1) { onSelect(results[0].id); close() }
      }} />{query && <button className="island-search-clear" aria-label="Clear Pokémon search" onClick={() => { setQuery(''); search.current?.focus() }}><X size={14} /></button>}</div>
      <p className="island-picker-count" role="status">{results.length} Pokémon {term ? 'found' : 'on the island'}</p>
      <div className="island-picker-results" role="group" aria-label="Island Pokémon" onKeyDown={(event) => {
        const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
        const index = options.indexOf(document.activeElement as HTMLButtonElement)
        const offset = { ArrowDown: 2, ArrowUp: -2, ArrowRight: 1, ArrowLeft: -1 }[event.key]
        if (offset !== undefined || event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (offset ?? 0)))
          options[next]?.focus()
        }
      }}>
        {results.map((entry) => <button key={entry.id} className="island-pokemon-option" aria-pressed={selected?.id === entry.id} onClick={() => { onSelect(entry.id); close() }}>
          <IslandPokemonImage id={entry.id} className="island-option-image" />
          <span className="island-option-copy"><small>#{String(entry.id).padStart(3, '0')}</small><span>{entry.name}</span></span>
          {selected?.id === entry.id && <Check size={14} className="island-option-check" />}
        </button>)}
        {!results.length && <div className="island-picker-empty"><Search size={24} /><p>No Pokémon found.</p><span>Try another name or Pokédex number.</span><button onClick={() => { setQuery(''); search.current?.focus() }}>Show all Pokémon</button></div>}
      </div>
    </div>}
  </div>
}
