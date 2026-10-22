import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Maximize2, Minus, Pause, Play, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IslandPokemon, IslandScene } from './islandScene'
import IslandPokemonPicker from './IslandPokemonPicker'
import IslandPokemonImage from './IslandPokemonImage'
import IslandPreview from './IslandPreview'
import { ISLAND_ASSETS } from '../../data/islandAssets'
import { ISLAND_PREVIEW } from '../../data/islandPreview'
import { getIslandProfile, shouldAutoLoadIsland } from '../../utils/islandLoading'
import { useDialogViewport } from '../../hooks/useDialogViewport'
import './island.css'

type Status = 'idle' | 'downloading' | 'preparing' | 'ready' | 'error'
type Profile = keyof typeof ISLAND_ASSETS
const PREVIEW_POKEMON = ISLAND_PREVIEW.pokemon.map(({ id, name }) => ({ id, name }))

function environment() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return { compact: matchMedia('(max-width: 767px)').matches, coarsePointer: matchMedia('(pointer: coarse)').matches, saveData: connection?.saveData ?? false, effectiveType: connection?.effectiveType }
}

export default function IslandExplorer() {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const scene = useRef<IslandScene | null>(null)
  const profileChosen = useRef(false)
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [profile, setProfile] = useState<Profile>(() => getIslandProfile(environment()))
  const [selected, setSelected] = useState<IslandPokemon | null>(null)
  const [rotating, setRotating] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [expanded, setExpanded] = useState(false)
  const [touchMode, setTouchMode] = useState(() => matchMedia('(max-width: 767px), (pointer: coarse)').matches)
  const loading = status === 'downloading' || status === 'preparing'
  const showScene = status === 'ready' && (!touchMode || expanded)
  const asset = ISLAND_ASSETS[profile]
  const selectedId = selected?.id
  useDialogViewport(shell, expanded)

  useEffect(() => {
    const media = matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => {
      setTouchMode(media.matches)
      if (!active && !profileChosen.current) setProfile(getIslandProfile(environment()))
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [active])

  useEffect(() => {
    if (!shouldAutoLoadIsland(environment())) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const currentEnvironment = environment()
      if (!shouldAutoLoadIsland(currentEnvironment)) return
      if (!profileChosen.current) setProfile(getIslandProfile(currentEnvironment))
      setActive(true)
    }, { rootMargin: '200px' })
    if (section.current) observer.observe(section.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!active || !host.current) return
    let cancelled = false
    let instance: IslandScene | null = null
    setStatus('downloading')
    setProgress(0)
    void import('./islandScene').then(({ createIslandScene }) => {
      if (cancelled || !host.current) return
      const loadEnvironment = environment()
      instance = createIslandScene(host.current, {
        ready: () => {
          if (cancelled) return
          const expandedNow = shell.current?.classList.contains('island-expanded')
          const currentEnvironment = environment()
          const willShowScene = expandedNow || (!currentEnvironment.compact && !currentEnvironment.coarsePointer)
          if (willShowScene && shell.current?.querySelector('.island-preview-map')?.contains(document.activeElement)) {
            shell.current.querySelector<HTMLButtonElement>(expandedNow ? '.island-expand' : '.island-picker-trigger')?.focus({ preventScroll: true })
          }
          setStatus('ready')
        },
        progress: (value) => { if (!cancelled) setProgress(value) },
        preparing: () => { if (!cancelled) setStatus('preparing') },
        select: (entry) => { if (!cancelled) { setSelected(entry); setRotating(false) } },
        error: () => { if (!cancelled) { setStatus('error'); setActive(false) } },
      }, { ...ISLAND_ASSETS[profile], compact: loadEnvironment.compact || loadEnvironment.coarsePointer, rotating: !matchMedia('(prefers-reduced-motion: reduce)').matches })
      scene.current = instance
    }).catch(() => { if (!cancelled) { setStatus('error'); setActive(false) } })
    return () => { cancelled = true; instance?.dispose(); if (scene.current === instance) scene.current = null }
    // Device/profile is captured for each requested load; resizing doesn't restart a download.
  }, [active, profile])

  useEffect(() => {
    if (status === 'ready' && selectedId !== undefined) scene.current?.select(selectedId)
  }, [status, selectedId])

  useEffect(() => {
    if (status === 'ready') scene.current?.rotate(rotating)
  }, [status, rotating])

  useEffect(() => {
    if (status === 'ready') scene.current?.present(showScene)
  }, [status, showScene])

  useEffect(() => {
    if (!expanded) return
    const old = document.body.style.overflow
    const opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    shell.current?.querySelector<HTMLButtonElement>('.island-expand')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
      if (event.key === 'Tab') {
        const controls = Array.from(shell.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href]') ?? []).filter((element) => element.getClientRects().length)
        if (!controls.length) return
        const first = controls[0], last = controls[controls.length - 1]
        if (!shell.current?.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus() }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', key); if (opener?.isConnected) opener.focus() }
  }, [expanded])

  const start = () => { if (!profileChosen.current) setProfile(getIslandProfile(environment())); setProgress(0); setStatus('downloading'); setActive(true) }
  const cancel = () => { scene.current?.dispose(); scene.current = null; setActive(false); setStatus('idle'); setProgress(0) }
  const selectPokemon = (id: number) => {
    const entry = PREVIEW_POKEMON.find((pokemon) => pokemon.id === id)
    if (!entry) return
    setSelected(entry)
    if (status === 'ready') scene.current?.select(id)
  }

  return (
    <section ref={section} className="container-app pt-10" aria-labelledby="island-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="island-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Legendary Island</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Find a legend in the preview, or step inside and explore in 3D.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><Sparkles size={13} /> 34 legendary &amp; mythical Pokémon</span>
      </div>
      <div ref={shell} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Explore Legendary Island' : undefined} className={`island-shell ${expanded ? 'island-expanded' : ''}`}>
        <div className={`island-stage ${!showScene ? 'island-preview-stage' : ''}`}>
          {!showScene && <IslandPreview selectedId={selectedId} onSelect={selectPokemon} />}
          <div ref={host} className={`island-canvas ${!showScene ? 'invisible' : ''}`} />
          <div className="island-label"><span className="island-dot" />{showScene ? 'Live 3D' : 'Preview · tap a legend'}</div>
          <button className="island-expand island-button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Close expanded island' : 'Expand island'} aria-pressed={expanded}><Maximize2 size={16} /><span>{expanded ? 'Close' : 'Expand'}</span></button>
          {showScene && <div className="island-hint">{touchMode ? 'Drag to orbit · Pinch to zoom · Tap a Pokémon' : 'Drag to orbit · Scroll to zoom · Click a Pokémon'}</div>}
        </div>

        <div className="island-load-panel">
          <div className="island-load-copy" role="status" aria-live="polite">
            {loading ? <>
              <p>{status === 'downloading' ? `Downloading island · ${progress}%` : 'Preparing the 3D scene…'}</p>
              <progress aria-label={status === 'downloading' ? 'Island model download' : 'Preparing island scene'} value={status === 'downloading' ? progress : undefined} max={100} />
              <small>You can keep exploring the preview while it loads.</small>
            </> : <>
              <p>{status === 'error' ? '3D couldn’t load. The preview is still ready to explore.' : status === 'ready' ? 'Your 3D island is ready.' : 'Explore now. Enter 3D whenever you like.'}</p>
              <small>{status === 'ready' ? (touchMode && !expanded ? 'Open the full view to rotate and zoom.' : 'Drag the island to look around.') : `${(asset.bytes / 1e6).toFixed(1)} MB for 3D · the preview needs no model download`}</small>
            </>}
          </div>
          <div className="island-load-actions">
            <label className="island-quality"><span>3D detail · {(asset.bytes / 1e6).toFixed(1)} MB</span>
              <select aria-label="Island 3D detail" value={profile} disabled={loading} onChange={(event) => { profileChosen.current = true; setProfile(event.target.value as Profile); if (active) { setStatus('downloading'); setProgress(0) } }}>
                <option value="mobile">Light</option>
                <option value="desktop">Standard</option>
              </select>
            </label>
            {loading ? <button className="island-button island-secondary-action" onClick={cancel} aria-label="Cancel 3D loading">Cancel</button>
              : status === 'ready' ? <>
                {touchMode && !expanded && <button className="island-enter-button" aria-label="Open 3D island" onClick={() => setExpanded(true)}><Play size={14} />Open 3D</button>}
                {showScene && <button className="island-button island-secondary-action" onClick={() => { cancel(); setExpanded(false) }}>Use preview</button>}
              </> : <button className="island-enter-button" aria-label={status === 'error' ? 'Try 3D again' : 'Enter 3D island'} onClick={start}><Play size={14} />{status === 'error' ? 'Retry 3D' : 'Enter 3D'}</button>}
          </div>
        </div>

        {selected && <div className="island-selection" aria-live="polite">
          <IslandPokemonImage id={selected.id} className="island-selection-image" />
          <div><span className="text-[10px] font-bold uppercase tracking-widest">Legend discovered · #{String(selected.id).padStart(3, '0')}</span><h3 className="font-display text-xl font-bold">{selected.name}</h3></div>
          <Link to={`/pokemon/${selected.id}`} className="island-detail">Pokédex <ArrowUpRight size={16} /></Link>
        </div>}

        <div className="island-toolbar">
          <IslandPokemonPicker pokemon={PREVIEW_POKEMON} selected={selected} disabled={false} onSelect={selectPokemon} />
          {showScene && <div className="flex items-center gap-1">
            <button className="island-button" aria-label="Zoom in" disabled={!showScene} onClick={() => scene.current?.zoom(0.8)}><Plus size={17} /></button>
            <button className="island-button" aria-label="Zoom out" disabled={!showScene} onClick={() => scene.current?.zoom(1.25)}><Minus size={17} /></button>
            <span className="mx-1 h-5 w-px bg-white/[0.08]" />
            <button className="island-button" aria-label="Reset island view" disabled={!showScene} onClick={() => { scene.current?.reset(); setSelected(null) }}><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></button>
            <button className="island-button" aria-label={rotating ? 'Pause auto-rotation' : 'Start auto-rotation'} aria-pressed={rotating} disabled={!showScene} onClick={() => setRotating(!rotating)}>{rotating ? <Pause size={15} /> : <Play size={15} />}<span className="hidden sm:inline">Orbit</span></button>
          </div>}
        </div>
      </div>
    </section>
  )
}
