import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Compass, Maximize2, Minus, Pause, Play, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IslandPokemon, IslandScene } from './islandScene'
import './island.css'

export default function IslandExplorer() {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const scene = useRef<IslandScene | null>(null)
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [progress, setProgress] = useState(0)
  const [pokemon, setPokemon] = useState<IslandPokemon[]>([])
  const [selected, setSelected] = useState<IslandPokemon | null>(null)
  const [rotating, setRotating] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [expanded, setExpanded] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); observer.disconnect() }
    }, { rootMargin: '200px' })
    if (section.current) observer.observe(section.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!active || !host.current) return
    let cancelled = false
    setStatus('loading')
    void import('./islandScene').then(({ createIslandScene }) => {
      if (cancelled || !host.current) return
      scene.current = createIslandScene(host.current, {
        ready: (list) => { setPokemon(list); setStatus('ready') },
        progress: setProgress,
        select: (entry) => { setSelected(entry); setRotating(false) },
        error: () => setStatus('error'),
      })
    }).catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null }
  }, [active, attempt])
  useEffect(() => {
    if (!expanded) return
    const old = document.body.style.overflow
    const opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    shell.current?.querySelector<HTMLButtonElement>('.island-expand')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
      if (event.key === 'Tab') {
        const controls = shell.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), a[href]')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', key); opener?.focus() }
  }, [expanded])

  return (
    <section ref={section} className="container-app pt-10" aria-labelledby="island-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-500"><Compass size={14} /> A world waiting to be explored</p>
          <h2 id="island-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Legendary Island</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Orbit the island. Find a legend. Discover their story.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><Sparkles size={13} /> 34 legendary &amp; mythical Pokémon</span>
      </div>
      <div ref={shell} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Explore Legendary Island' : undefined} className={`island-shell ${expanded ? 'island-expanded' : ''}`}>
        <div className="island-stage">
          <img className={`island-poster ${status === 'ready' ? 'island-poster-hidden' : ''}`} src="/models/island-poster.webp" alt="A miniature Pokémon island with forests, waterways, a volcano and legendary Pokémon" loading="lazy" />
          <div ref={host} className={`island-canvas ${status !== 'ready' ? 'invisible' : ''}`} />
          <div className="island-label"><span className="island-dot" /> {status === 'ready' ? 'LIVE EXPLORATION' : 'LEGENDARY ISLAND'} <span className="opacity-40">/</span> 001</div>
          <button className="island-expand island-button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Close expanded island' : 'Expand island'} aria-pressed={expanded}><Maximize2 size={16} /><span>{expanded ? 'Close' : 'Expand'}</span></button>
          {status !== 'ready' && <div className="island-loading" role="status">
            <Compass size={26} className={status === 'loading' ? 'animate-pulse' : ''} />
            <p>{status === 'error' ? 'The 3D island could not be loaded.' : `Preparing your island${progress > 0 ? ` · ${progress}%` : '…'}`}</p>
            {status === 'error' && <><p className="text-xs opacity-70">You can still discover every legend in the Pokédex.</p><button className="island-button" onClick={() => { setProgress(0); setAttempt(attempt + 1) }}>Try again</button><Link to="/pokedex?legendary=1" className="text-sm underline">Explore the Pokédex</Link></>}
          </div>}
          {status === 'ready' && <div className="island-hint">Drag to orbit <span>·</span> Pinch or scroll to zoom <span>·</span> Click a Pokémon</div>}
          {selected && status === 'ready' && <div className="island-selection" aria-live="polite">
            <div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Legend discovered · #{String(selected.id).padStart(3, '0')}</span><h3 className="font-display text-xl font-bold">{selected.name}</h3></div>
            <Link to={`/pokemon/${selected.id}`} className="island-detail">Pokédex <ArrowUpRight size={16} /></Link>
          </div>}
        </div>
        <div className="island-toolbar">
          <label className="island-select-label"><Compass size={16} /><span className="sr-only">Find a Pokémon on the island</span><select aria-label="Find a Pokémon on the island" disabled={status !== 'ready'} value={selected?.id ?? ''} onChange={(event) => scene.current?.select(Number(event.target.value))}><option value="" disabled>Find a Pokémon…</option>{pokemon.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <div className="flex items-center gap-1">
            <button className="island-button" aria-label="Zoom in" disabled={status !== 'ready'} onClick={() => scene.current?.zoom(0.8)}><Plus size={17} /></button>
            <button className="island-button" aria-label="Zoom out" disabled={status !== 'ready'} onClick={() => scene.current?.zoom(1.25)}><Minus size={17} /></button>
            <span className="mx-1 h-5 w-px bg-white/10" />
            <button className="island-button" aria-label="Reset island view" disabled={status !== 'ready'} onClick={() => { scene.current?.reset(); setSelected(null) }}><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></button>
            <button className="island-button" aria-label={rotating ? 'Pause auto-rotation' : 'Start auto-rotation'} aria-pressed={rotating} disabled={status !== 'ready'} onClick={() => { scene.current?.rotate(!rotating); setRotating(!rotating) }}>{rotating ? <Pause size={15} /> : <Play size={15} />}<span className="hidden sm:inline">Orbit</span></button>
          </div>
        </div>
      </div>
    </section>
  )
}
