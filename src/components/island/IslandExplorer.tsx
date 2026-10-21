import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Compass, Maximize2, Minus, Pause, Play, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IslandPokemon, IslandScene } from './islandScene'
import IslandPokemonPicker from './IslandPokemonPicker'
import IslandPokemonImage from './IslandPokemonImage'
import './island.css'
import { shouldAutoLoadIsland } from '../../utils/islandLoading'
import { useDialogViewport } from '../../hooks/useDialogViewport'

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
  const [touchMode, setTouchMode] = useState(() => matchMedia('(max-width: 767px), (pointer: coarse)').matches)
  useDialogViewport(shell, expanded)

  useEffect(() => {
    const media = matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => setTouchMode(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (!shouldAutoLoadIsland({ compact: matchMedia('(max-width: 767px)').matches, coarsePointer: matchMedia('(pointer: coarse)').matches, saveData: connection?.saveData ?? false })) return
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
        const controls = shell.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')
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
          <p className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-500"><Compass size={14} /> Interactive 3D map</p>
          <h2 id="island-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Legendary Island</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Orbit the island. Find a legend. Discover their story.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><Sparkles size={13} /> 34 legendary &amp; mythical Pokémon</span>
      </div>
      <div ref={shell} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Explore Legendary Island' : undefined} className={`island-shell ${expanded ? 'island-expanded' : ''}`}>
        <div className="island-stage">
          <img className={`island-poster ${status === 'ready' ? 'island-poster-hidden' : ''}`} src="/models/island-poster.webp" alt="A miniature Pokémon island with forests, waterways, a volcano and legendary Pokémon" loading="lazy" />
          <div ref={host} className={`island-canvas ${status !== 'ready' ? 'invisible' : ''}`} />
          <div className="island-label"><span className="island-dot" />{status === 'ready' ? 'Live' : 'Legendary Island'}</div>
          <button className="island-expand island-button" onClick={() => { setActive(true); setExpanded(!expanded) }} aria-label={expanded ? 'Close expanded island' : 'Expand island'} aria-pressed={expanded}><Maximize2 size={16} /><span>{expanded ? 'Close' : 'Expand'}</span></button>
          {(!active || (touchMode && !expanded)) && <div className="island-loading island-entry">
            <button type="button" className="island-enter-button" onClick={() => { setActive(true); if (touchMode) setExpanded(true) }}><Play size={18} />{active ? 'Open 3D island' : 'Enter 3D island'}</button>
            <p>Explore 34 legends in an interactive island.</p>
            {!active && <p className="text-xs">3D loads when you enter · about 15 MB</p>}
          </div>}
          {active && (!touchMode || expanded) && status !== 'ready' && <div className="island-loading" role="status">
            <Compass size={26} className={status === 'loading' ? 'animate-pulse' : ''} />
            <p>{status === 'error' ? 'The 3D island could not be loaded.' : `Loading island${progress > 0 ? ` · ${progress}%` : '…'}`}</p>
            {status === 'error' && <><p className="text-xs opacity-70">You can still discover every legend in the Pokédex.</p><button className="island-button" onClick={() => { setProgress(0); setAttempt(attempt + 1) }}>Try again</button><Link to="/pokedex?legendary=1" className="text-sm underline">Explore the Pokédex</Link></>}
          </div>}
          {status === 'ready' && <div className="island-hint">{touchMode ? 'Drag to orbit · Pinch to zoom · Tap a Pokémon' : 'Drag to orbit · Scroll to zoom · Click a Pokémon'}</div>}
          {selected && status === 'ready' && <div className="island-selection" aria-live="polite">
            <IslandPokemonImage id={selected.id} className="island-selection-image" />
            <div><span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Legend discovered · #{String(selected.id).padStart(3, '0')}</span><h3 className="font-display text-xl font-bold">{selected.name}</h3></div>
            <Link to={`/pokemon/${selected.id}`} className="island-detail">Pokédex <ArrowUpRight size={16} /></Link>
          </div>}
        </div>
        <div className="island-toolbar">
          <IslandPokemonPicker pokemon={pokemon} selected={selected} disabled={status !== 'ready'} onSelect={(id) => scene.current?.select(id)} />
          <div className="flex items-center gap-1">
            <button className="island-button" aria-label="Zoom in" disabled={status !== 'ready'} onClick={() => scene.current?.zoom(0.8)}><Plus size={17} /></button>
            <button className="island-button" aria-label="Zoom out" disabled={status !== 'ready'} onClick={() => scene.current?.zoom(1.25)}><Minus size={17} /></button>
            <span className="mx-1 h-5 w-px bg-white/[0.08]" />
            <button className="island-button" aria-label="Reset island view" disabled={status !== 'ready'} onClick={() => { scene.current?.reset(); setSelected(null) }}><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></button>
            <button className="island-button" aria-label={rotating ? 'Pause auto-rotation' : 'Start auto-rotation'} aria-pressed={rotating} disabled={status !== 'ready'} onClick={() => { scene.current?.rotate(!rotating); setRotating(!rotating) }}>{rotating ? <Pause size={15} /> : <Play size={15} />}<span className="hidden sm:inline">Orbit</span></button>
          </div>
        </div>
      </div>
    </section>
  )
}
