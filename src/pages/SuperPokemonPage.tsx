import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, Flag, Heart, LockKeyhole, Maximize2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { Seo } from '../components/Seo'
import { CHARACTER_INFO, render } from '../game/platformer/art'
import { AudioBus } from '../game/platformer/audio'
import type { Action } from '../game/platformer/input'
import { LEVEL_INFO } from '../game/platformer/levels'
import { Runtime } from '../game/platformer/runtime'
import { finishLevel, loadSave, storeSave } from '../game/platformer/save'
import type { Character, Save } from '../game/platformer/save'
import { World } from '../game/platformer/world'
import '../game/platformer/platformer.css'

type Screen = 'welcome' | 'characters' | 'levels' | 'play' | 'result'
interface Hud { hp: number; score: number; collected: number; time: number; progress: number }
const EMPTY_HUD: Hud = { hp: 3, score: 0, collected: 0, time: 0, progress: 0 }
const CHARACTERS = Object.keys(CHARACTER_INFO) as Character[]
const formatTime = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`

function Sprite({ character, className = '' }: { character: Character; className?: string }) {
  return <span aria-hidden="true" className={`sp-sprite ${className}`} style={{ backgroundPosition: `0 ${CHARACTER_INFO[character].row * 20}%` }} />
}

function JourneyPreview({ levelId, atlas }: { levelId: number; atlas: HTMLImageElement }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (ctx) render(ctx, new World(levelId, 'pikachu'), atlas, true)
  }, [levelId, atlas])
  return <canvas ref={ref} width={960} height={540} aria-hidden="true" />
}

function Controls() {
  return <div className="sp-control-guide">
    <p><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd><span>Move left and right</span></p>
    <p><kbd>W</kbd> / <kbd>↑</kbd><span>Jump · Hold for a higher leap</span></p>
    <p><kbd>S</kbd> / <kbd>↓</kbd><span>Crouch / Drop through one-way platforms</span></p>
    <p><kbd>Shift</kbd> / <kbd>Ctrl</kbd><span>Hold to sprint · Press once to attack</span></p>
    <p><kbd>P</kbd><span>Pause / Resume</span><kbd>M</kbd><span>Toggle sound</span></p>
  </div>
}

export default function SuperPokemonPage() {
  const [save, setSave] = useState<Save>(loadSave)
  const [storageFailed, setStorageFailed] = useState(false)
  const [screen, setScreen] = useState<Screen>('welcome')
  const [levelId, setLevelId] = useState(1)
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState<Hud>(EMPTY_HUD)
  const [won, setWon] = useState(false)
  const [atlas, setAtlas] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(0)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [help, setHelp] = useState(false)
  const [message, setMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<Runtime | null>(null)
  const worldRef = useRef<World | null>(null)
  const audioRef = useRef<AudioBus | null>(null)
  const actionsRef = useRef({ pause: () => {}, mute: () => {}, finish: () => {} })
  const character = save.character
  const info = CHARACTER_INFO[character]

  const persist = (next: Save) => { setSave(next); setStorageFailed(!storeSave(next)) }
  const toggleMute = () => {
    const muted = !save.muted
    persist({ ...save, muted }); audioRef.current?.setMuted(muted)
    if (!paused && !muted) audioRef.current?.unlock()
  }
  const togglePause = () => {
    const world = worldRef.current
    if (!world || world.status !== 'playing') return
    const next = !world.paused
    world.paused = next; world.input.clear(); setPaused(next); setHelp(false)
    if (next) audioRef.current?.pause()
    else { audioRef.current?.unlock(); runtimeRef.current?.resetClock(); runtimeRef.current?.focus() }
  }
  const syncHud = () => {
    const w = worldRef.current
    if (w) setHud({ hp: w.hp, score: w.score, collected: w.collected, time: w.time, progress: w.player.x / w.level.goal })
  }
  actionsRef.current = {
    pause: togglePause, mute: toggleMute,
    finish: () => {
      const w = worldRef.current
      if (!w) return
      syncHud(); setWon(w.status === 'won'); setPaused(false)
      if (w.status === 'won') persist(finishLevel(save, levelId, w.score, w.time, w.collected))
      setScreen('result')
    },
  }

  useEffect(() => {
    const audio = new AudioBus(); audioRef.current = audio
    return () => { audio.destroy(); audioRef.current = null }
  }, [])
  useEffect(() => {
    let cancelled = false
    const image = new Image()
    setError(''); setLoading(15)
    const timeout = window.setTimeout(() => { if (!cancelled) { setLoading(0); setError('Pixel art loading timed out. Please try again.') } }, 15000)
    image.onload = () => { if (!cancelled) { clearTimeout(timeout); setAtlas(image); setLoading(100) } }
    image.onerror = () => { if (!cancelled) { clearTimeout(timeout); setLoading(0); setError('Could not load the pixel art. Check your connection and try again.') } }
    image.src = `${import.meta.env.BASE_URL}super-pokemon/sprites.png`
    return () => { cancelled = true; clearTimeout(timeout); image.onload = null; image.onerror = null }
  }, [attempt])

  useEffect(() => {
    if (!atlas || !canvasRef.current || !rootRef.current || screen !== 'play') return
    const world = new World(levelId, character)
    worldRef.current = world
    setHud(EMPTY_HUD); setPaused(false); setHelp(false)
    audioRef.current!.muted = save.muted
    let runtime: Runtime
    try {
      runtime = new Runtime(world, canvasRef.current, rootRef.current, atlas, audioRef.current!, syncHud,
        () => actionsRef.current.pause(), () => actionsRef.current.mute(), () => actionsRef.current.finish())
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start the game. Please try again.'); return }
    runtimeRef.current = runtime; runtime.focus()
    return () => { runtime.destroy(); if (runtimeRef.current === runtime) runtimeRef.current = null }
    // The simulation owns live state; sound settings and callbacks go through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas, screen, levelId, character, run])

  useEffect(() => {
    if (!atlas || !canvasRef.current || screen === 'play') return
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) render(ctx, screen === 'result' && worldRef.current ? worldRef.current : new World(1, character), atlas, screen !== 'result')
  }, [atlas, screen, levelId, character])

  const startLevel = (id: number) => {
    setLevelId(id); setRun(n => n + 1); setScreen('play'); setPaused(false)
    audioRef.current?.setMuted(save.muted); audioRef.current?.unlock()
  }
  const showLevels = () => { worldRef.current?.input.clear(); setPaused(false); setScreen('levels'); setHelp(false) }
  const touch = (action: Action, pressed: boolean, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const w = worldRef.current
    if (!w || w.paused || w.status !== 'playing') return
    if (pressed) { event.currentTarget.setPointerCapture(event.pointerId); runtimeRef.current?.focus() }
    w.input.set(action, `touch-${event.pointerId}`, pressed)
  }
  const touchButton = (action: Action, label: string, symbol: React.ReactNode) => <button type="button" key={action} aria-label={label} className={`sp-touch-button sp-touch-${action}`}
    onPointerDown={e => touch(action, true, e)} onPointerUp={e => touch(action, false, e)} onPointerCancel={e => touch(action, false, e)} onLostPointerCapture={e => touch(action, false, e)}>{symbol}<small>{label}</small></button>
  const fullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await rootRef.current?.requestFullscreen() }
    catch { setMessage('Fullscreen is unavailable in this browser. Rotate your device for a wider view.') }
  }

  return <div className="sp-page">
    <Seo title="Super Pokémon · Pixel Adventure" description="Choose Pikachu, Charmander, or Mewtwo and explore three Pokémon platforming levels." path="/games/super-pokemon" />
    <div className="container-app sp-container">
      <div className="sp-breadcrumb"><Link to="/games"><ArrowLeft size={14} /> Game Center</Link><span>/</span><span>SUPER POKÉMON</span><span className="sp-offline"><i /> SAVED ON THIS DEVICE · NO SIGN-IN</span></div>
      <header className="sp-header">
        <div><h1>Super <span>Pokémon</span><Sparkles className="sp-title-star" aria-hidden="true" /></h1><p className="sp-tagline">A little partner. A whole world of adventure.</p></div>
        <div className="sp-header-note"><span><span className="sp-mini-ball" /> KANTO ADVENTURES</span><small>MOVE · JUMP · EXPLORE</small></div>
      </header>

      <div className={`sp-console ${['welcome', 'characters', 'levels'].includes(screen) ? 'sp-is-menu' : ''}`} ref={rootRef} tabIndex={0} aria-label="Super Pokémon game area">
        <div className="sp-hud">
          <div className="sp-partner"><Sprite character={character} /><strong>{info.name}</strong></div>
          <div className="sp-hearts" aria-label={`Health ${hud.hp} / 3`}>{[1, 2, 3].map(i => <Heart key={i} size={19} className={i <= hud.hp ? 'is-full' : ''} fill={i <= hud.hp ? 'currentColor' : 'none'} />)}</div>
          <div className="sp-stat"><small>SCORE</small><strong>{hud.score.toString().padStart(5, '0')}</strong></div>
          <div className="sp-stat"><small>POKÉ BALLS</small><strong><span className="sp-mini-ball" /> × {hud.collected.toString().padStart(2, '0')}</strong></div>
          <div className="sp-stat sp-level-stat"><strong>{LEVEL_INFO[levelId - 1].name}</strong></div>
          <div className="sp-hud-actions">
            <button aria-label={save.muted ? 'Turn sound on' : 'Mute'} onClick={toggleMute}>{save.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button aria-label={paused ? 'Resume game' : 'Pause game'} onClick={togglePause} disabled={screen !== 'play'}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
            <button aria-label="Toggle fullscreen" onClick={() => void fullscreen()}><Maximize2 size={17} /></button>
          </div>
        </div>

        <div className={`sp-stage sp-screen-${screen} ${screen === 'play' && !paused ? 'sp-is-playing' : ''}`} onPointerDown={e => { if (e.target === canvasRef.current) runtimeRef.current?.focus() }}>
          <canvas ref={canvasRef} width={960} height={540} aria-label="Pokémon side-scrolling platform game" />
          {screen === 'play' && !paused && <div className="sp-time">{formatTime(hud.time)}</div>}

          {(!atlas || error) && <div className="sp-overlay"><div className="sp-menu sp-loading" role="status"><span className="sp-menu-icon">◓</span><h2>{error ? 'Adventure unavailable' : 'Preparing your adventure…'}</h2><p>{error || 'Loading local pixel art'}</p>{!error && <><progress value={loading} max="100" /><small>{loading}%</small></>}{error && <button className="sp-primary" onClick={() => { setAtlas(null); setAttempt(n => n + 1); setRun(n => n + 1) }}>Try again</button>}</div></div>}

          {atlas && !error && screen === 'welcome' && <div className="sp-overlay sp-welcome-overlay"><div className="sp-welcome">
            <h2>Ready, set.<br /><span>EXPLORE!</span></h2><p>Big jumps. Hidden treasures. Your favorite partner.<br />A pixel-sized Pokémon adventure is waiting for you.</p>
            <button className="sp-primary" onClick={() => { audioRef.current?.setMuted(save.muted); audioRef.current?.unlock(); setScreen('characters') }}><Play size={19} fill="currentColor" /> Start adventure <ArrowRight size={19} /></button>
            <small>No sign-in. Just jump in.</small>
          </div><div className="sp-welcome-partners" aria-label="Adventure partners">{CHARACTERS.map(c => <div className={`sp-hero-partner sp-hero-${c}`} key={c}><Sprite character={c} /><strong>{CHARACTER_INFO[c].name}</strong></div>)}<span className="sp-hero-caption">YOUR NEXT ADVENTURE STARTS TOGETHER</span><Sparkles className="sp-hero-spark" aria-hidden="true" /></div><div className="sp-welcome-worlds"><span><i /> Pallet Town Meadows</span><span><i /> Viridian Forest</span><span><i /> Mt. Moon Cave</span></div></div>}

          {atlas && !error && screen === 'characters' && <div className="sp-overlay"><div className="sp-menu sp-selection">
            <h2>Choose your partner</h2><p>One adventure. Three ways to make it your own.</p>
            <div className="sp-character-grid">{CHARACTERS.map(c => { const detail = CHARACTER_INFO[c]; return <button key={c} className={`sp-character ${character === c ? 'is-selected' : ''}`} onClick={() => persist({ ...save, character: c })} aria-pressed={character === c} style={{ '--partner-color': detail.color } as React.CSSProperties}>
              <span className="sp-type">{detail.type}</span><div className="sp-character-art"><Sprite character={c} /></div><strong>{detail.name}</strong><p>{detail.description}</p><span className="sp-selected-mark">{character === c ? '✓ YOUR PARTNER' : 'CHOOSE ME'} {character !== c && <ArrowRight size={14} />}</span>
            </button> })}</div>
            <div className="sp-menu-footer"><button className="sp-text-button" onClick={() => setScreen('welcome')}><ArrowLeft size={14} /> Back</button><button className="sp-primary" onClick={() => setScreen('levels')}>Choose your journey <ArrowRight size={16} /></button></div>
          </div></div>}

          {atlas && !error && screen === 'levels' && <div className="sp-overlay"><div className="sp-menu sp-selection">
            <h2>Where will you explore?</h2><p>From sunny meadows to moonlit caves. Clear a journey to open the next.</p>
            <div className="sp-level-grid">{LEVEL_INFO.map(l => { const locked = l.id > save.unlocked, best = save.best[l.id]; return <button disabled={locked} key={l.id} className={`sp-level-card sp-map-${l.theme}`} onClick={() => startLevel(l.id)}>
              <div className="sp-map-art"><JourneyPreview levelId={l.id} atlas={atlas} /><span className="sp-map-label">{l.theme === 'grass' ? 'MEADOWS' : l.theme === 'forest' ? 'FOREST' : 'CAVE'}</span>{locked ? <LockKeyhole size={20} /> : <Flag size={20} />}</div>
              <strong>{l.name}</strong><p>{l.subtitle}</p><small>{locked ? `Clear ${LEVEL_INFO[l.id - 2].name} to unlock` : best ? `Best ${best.score} points · ${formatTime(best.time)}` : l.id === 1 ? 'A perfect place to start' : 'A new discovery awaits'}</small><span className="sp-level-action">{locked ? 'LOCKED' : 'LET’S GO'} {!locked && <ChevronRight size={16} />}</span>
            </button> })}</div>
            <div className="sp-menu-footer"><button className="sp-text-button" onClick={() => setScreen('characters')}><ArrowLeft size={14} /> Change partner</button><span className="sp-current-partner"><Sprite character={character} /> {info.name} is ready!</span></div>
          </div></div>}

          {screen === 'play' && paused && <div className="sp-overlay sp-pause-overlay"><div className="sp-menu sp-pause-menu" role="dialog" aria-modal="true" aria-label="Pause menu">
            <span className="sp-menu-icon"><Pause size={24} /></span><p className="sp-eyebrow">TAKE A LITTLE BREAK</p><h2>Adventure paused</h2><p>Your partner will be right here when you are ready.</p>
            <button className="sp-primary" onClick={togglePause}><Play size={16} /> Resume adventure</button>
            <div className="sp-pause-options"><button onClick={() => startLevel(levelId)}><RotateCcw size={15} /> Restart</button><button onClick={() => setHelp(!help)}>Controls {help ? '−' : '+'}</button><button onClick={showLevels}>Level select</button><Link to="/games">Back to Game Center</Link></div>
            {help && <Controls />}
            <small>Press P to resume · After losing focus, resume manually.</small>
          </div></div>}

          {screen === 'result' && <div className="sp-overlay"><div className="sp-menu sp-result" role="dialog" aria-label="Challenge results">
            <span className="sp-menu-icon">{won ? '✦' : '♡'}</span><p className="sp-eyebrow">{won ? 'ADVENTURE COMPLETE' : 'ANOTHER ADVENTURE AWAITS'}</p><h2>{won ? (levelId === 3 ? 'You are the champion!' : 'You made it!') : 'Every brave explorer tries again.'}</h2>
            <p>{won ? (levelId < 3 ? 'The next adventure is unlocked. New sights are waiting.' : 'You and your partner conquered all three levels. Try for a new high score!') : 'Take what you learned and give it another go.'}</p>
            <div className="sp-result-stats"><div><small>LEVEL SCORE</small><strong>{hud.score}</strong></div><div><small>COLLECTED</small><strong>{hud.collected}</strong></div><div><small>{won ? 'TIME' : 'SURVIVAL TIME'}</small><strong>{formatTime(hud.time)}</strong></div></div>
            <div className="sp-result-buttons">{won && levelId < 3 && <button className="sp-primary" onClick={() => startLevel(levelId + 1)}>Next level <ArrowRight size={16} /></button>}<button className={won && levelId < 3 ? 'sp-secondary' : 'sp-primary'} onClick={() => startLevel(levelId)}><RotateCcw size={15} /> Retry level</button></div>
            <button className="sp-text-button" onClick={showLevels}>Level select</button>
          </div></div>}
        </div>
        {screen !== 'play' && <div className="sp-stage-footer"><span><i /> {screen === 'result' ? 'ADVENTURE COMPLETE' : 'READY FOR ADVENTURE'}<span className="sp-footer-separator">/</span>{LEVEL_INFO[levelId - 1].name}</span><div className="sp-progress" aria-label={`Level progress ${Math.min(100, Math.round(hud.progress * 100))}%`}><i style={{ width: `${Math.min(100, hud.progress * 100)}%` }} /></div><span>GO EXPLORE. <Flag size={12} /></span></div>}
        {screen === 'play' && !paused && <div className="sp-touch-controls" aria-label="Touch game controls"><div className="sp-touch-directions">{touchButton('left', 'Left', '←')}{touchButton('right', 'Right', '→')}{touchButton('down', 'Down', '↓')}</div><div className="sp-touch-abilities">{touchButton('sprint', 'Sprint', '»')}{touchButton('attack', 'Attack', '✦')}{touchButton('jump', 'Jump', '↑')}</div></div>}
      </div>

      <div className={`sp-below ${screen === 'play' ? 'sp-below-playing' : ''}`}>{screen !== 'play' && <div className="sp-quick-controls"><span>QUICK CONTROLS</span><p><kbd>A</kbd><kbd>D</kbd> Move</p><p><kbd>W</kbd> Jump</p><p><kbd>Shift</kbd> Sprint / Attack</p><p><kbd>P</kbd> Pause</p></div>}<button className="sp-text-button" onClick={() => setHelp(!help)}>Full controls {help ? '−' : '+'}</button></div>
      {help && !(screen === 'play' && paused) && <div className="sp-help-panel"><Controls /><p>On mobile, hold a direction and jump at the same time. Rotate to landscape for a wider view. Press down on a one-way platform to drop through it. Elemental energy boosts your attacks for 12 seconds. Attacks fire once when pressed; holding sprint will not repeat them.</p></div>}
      {storageFailed && <p className="sp-storage-message" role="status">Your browser blocked local storage. You can keep playing, but this session's progress will not be saved.</p>}
      {message && <p role="status" className="sp-storage-message">{message}</p>}
      <div className="sp-journey-caption"><span>THE JOURNEY IS THE REWARD.</span><p>From meadow to forest to cave. A new discovery waits at every turn.</p><span>✦</span></div>
    </div>
  </div>
}
