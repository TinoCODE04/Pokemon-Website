import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import {
  ArrowLeft,
  Crown,
  Gamepad2,
  Heart,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import type { Pokemon } from '../api/types'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { PokeballMark } from '../components/layout/Navbar'
import { Spinner } from '../components/ui/Feedback'
import {
  calculateDamage,
  chooseAiMove,
  getBattleMoves,
  getEffectiveness,
  getMaxHp,
  getStat,
  pickOpponentId,
  type BattleMove,
  type DamageResult,
} from '../game/battle'
import { useAllPokemon } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { useFavorites } from '../store/AppContext'
import { useLocalStorage } from '../store/useLocalStorage'
import { cn } from '../utils/cn'
import { artworkUrl, bestArtwork, formatDexNumber, formatName, spriteUrl } from '../utils/format'

type GameMode = 'quick' | 'legendary'
type GameView = 'modes' | 'select' | 'loading' | 'battle'
type BattleOutcome = 'playing' | 'won' | 'lost'

interface BattleRecord {
  wins: number
  losses: number
  streak: number
  bestStreak: number
  legendaryWins: number
}

const EMPTY_RECORD: BattleRecord = { wins: 0, losses: 0, streak: 0, bestStreak: 0, legendaryWins: 0 }
const FEATURED_FIGHTERS = [
  { id: 25, name: 'Pikachu' },
  { id: 6, name: 'Charizard' },
  { id: 448, name: 'Lucario' },
  { id: 150, name: 'Mewtwo' },
  { id: 381, name: 'Latios' },
  { id: 380, name: 'Latias' },
  { id: 94, name: 'Gengar' },
  { id: 658, name: 'Greninja' },
]

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode = searchParams.get('mode')
  const initialPokemon = Number(searchParams.get('pokemon') ?? 25)
  const [mode, setMode] = useState<GameMode | null>(
    initialMode === 'quick' || initialMode === 'legendary' ? initialMode : null,
  )
  const [view, setView] = useState<GameView>(mode ? 'select' : 'modes')
  const [selectedId, setSelectedId] = useState(Number.isFinite(initialPokemon) && initialPokemon > 0 ? initialPokemon : 25)
  const [search, setSearch] = useState('')
  const [player, setPlayer] = useState<Pokemon | null>(null)
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [playerHp, setPlayerHp] = useState(0)
  const [opponentHp, setOpponentHp] = useState(0)
  const [playerMaxHp, setPlayerMaxHp] = useState(0)
  const [opponentMaxHp, setOpponentMaxHp] = useState(0)
  const [moves, setMoves] = useState<BattleMove[]>([])
  const [message, setMessage] = useState('Choose a move to begin.')
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<BattleOutcome>('playing')
  const [loadError, setLoadError] = useState('')
  const [soundEnabled, setSoundEnabled] = useLocalStorage('px-battle-sound', true)
  const [record, setRecord] = useLocalStorage<BattleRecord>('px-battle-record', EMPTY_RECORD)
  const [recentFighters, setRecentFighters] = useLocalStorage<number[]>('px-recent-fighters', [])
  const { favorites } = useFavorites()
  const allPokemon = useAllPokemon()
  const queryClient = useQueryClient()
  const playerControls = useAnimation()
  const opponentControls = useAnimation()
  const debouncedSearch = useDebounce(search, 120)

  const namesById = useMemo(() => {
    const map = new Map<number, string>()
    allPokemon.data?.results.forEach((entry) => map.set(extractId(entry), entry.name))
    return map
  }, [allPokemon.data])

  const searchResults = useMemo(() => {
    const value = debouncedSearch.trim().toLowerCase()
    if (!value || !allPokemon.data) return []
    const numeric = /^\d+$/.test(value) ? Number(value) : null
    const starts: { id: number; name: string }[] = []
    const contains: { id: number; name: string }[] = []
    for (const entry of allPokemon.data.results) {
      const id = extractId(entry)
      const item = { id, name: entry.name }
      if (numeric !== null && id === numeric) starts.unshift(item)
      else if (entry.name.startsWith(value)) starts.push(item)
      else if (entry.name.includes(value)) contains.push(item)
      if (starts.length + contains.length >= 16) break
    }
    return [...starts, ...contains].slice(0, 8)
  }, [allPokemon.data, debouncedSearch])

  const chooseMode = (nextMode: GameMode) => {
    setMode(nextMode)
    setView('select')
    setLoadError('')
    setSearchParams({ mode: nextMode, pokemon: String(selectedId) }, { replace: true })
  }

  const choosePokemon = (id: number) => {
    setSelectedId(id)
    setRecentFighters((previous) => [id, ...previous.filter((item) => item !== id)].slice(0, 4))
    setSearch('')
    if (mode) setSearchParams({ mode, pokemon: String(id) }, { replace: true })
  }

  const startBattle = async () => {
    if (!mode) return
    setRecentFighters((previous) => [selectedId, ...previous.filter((item) => item !== selectedId)].slice(0, 4))
    setView('loading')
    setLoadError('')
    setBusy(true)
    const enemyId = pickOpponentId(mode, selectedId)

    try {
      const [nextPlayer, nextOpponent] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: ['pokemon', 'detail', String(selectedId)],
          queryFn: () => getPokemon(selectedId),
          staleTime: 1000 * 60 * 60,
        }),
        queryClient.fetchQuery({
          queryKey: ['pokemon', 'detail', String(enemyId)],
          queryFn: () => getPokemon(enemyId),
          staleTime: 1000 * 60 * 60,
        }),
      ])

      const nextPlayerMax = getMaxHp(nextPlayer)
      const nextOpponentMax = getMaxHp(nextOpponent, mode === 'legendary')
      setPlayer(nextPlayer)
      setOpponent(nextOpponent)
      setPlayerMaxHp(nextPlayerMax)
      setOpponentMaxHp(nextOpponentMax)
      setPlayerHp(nextPlayerMax)
      setOpponentHp(nextOpponentMax)
      setMoves(getBattleMoves(nextPlayer))
      setOutcome('playing')
      setBattleLog([])
      setMessage(`${formatName(nextOpponent.name)} entered the arena!`)
      setBusy(false)
      setView('battle')
      setSearchParams({ mode, pokemon: String(selectedId) }, { replace: true })
    } catch {
      setLoadError('The fighters could not be loaded. Check your connection and try again.')
      setBusy(false)
      setView('select')
    }
  }

  const animateAttack = async (side: 'player' | 'opponent', hit: boolean) => {
    const attacker = side === 'player' ? playerControls : opponentControls
    const target = side === 'player' ? opponentControls : playerControls
    const direction = side === 'player' ? 1 : -1
    await attacker.start({
      x: [0, direction * 48, 0],
      y: [0, -12, 0],
      rotate: [0, direction * 5, 0],
      transition: { duration: 0.38, ease: 'easeOut' },
    })
    if (hit) {
      await target.start({
        x: [0, direction * 10, direction * -8, 0],
        filter: ['brightness(1)', 'brightness(2.6)', 'brightness(1)'],
        transition: { duration: 0.27 },
      })
    }
  }

  const finishBattle = (won: boolean) => {
    setOutcome(won ? 'won' : 'lost')
    setBusy(false)
    setRecord((previous) => {
      const streak = won ? previous.streak + 1 : 0
      return {
        wins: previous.wins + (won ? 1 : 0),
        losses: previous.losses + (won ? 0 : 1),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
        legendaryWins: previous.legendaryWins + (won && mode === 'legendary' ? 1 : 0),
      }
    })
    playTone(won ? 'victory' : 'defeat', soundEnabled)
  }

  const performMove = async (selectedMove: BattleMove) => {
    if (!player || !opponent || busy || outcome !== 'playing') return
    setBusy(true)

    const enemyMove = chooseAiMove(opponent, player)
    const playerSpeed = getStat(player, 'speed')
    const opponentSpeed = getStat(opponent, 'speed') * (mode === 'legendary' ? 1.05 : 1)
    const playerFirst = (selectedMove.priority ?? 0) > (enemyMove.priority ?? 0)
      || ((selectedMove.priority ?? 0) === (enemyMove.priority ?? 0) && playerSpeed >= opponentSpeed)
    const order: { side: 'player' | 'opponent'; move: BattleMove }[] = playerFirst
      ? [{ side: 'player', move: selectedMove }, { side: 'opponent', move: enemyMove }]
      : [{ side: 'opponent', move: enemyMove }, { side: 'player', move: selectedMove }]

    let nextPlayerHp = playerHp
    let nextOpponentHp = opponentHp

    for (const turn of order) {
      if (nextPlayerHp <= 0 || nextOpponentHp <= 0) break
      const attacker = turn.side === 'player' ? player : opponent
      const defender = turn.side === 'player' ? opponent : player
      const result = calculateDamage(
        attacker,
        defender,
        turn.move,
        turn.side === 'opponent' && mode === 'legendary' ? 1.08 : 1,
      )
      const attackerName = formatName(attacker.name)
      setMessage(`${attackerName} used ${turn.move.name}!`)
      playTone('attack', soundEnabled)
      await animateAttack(turn.side, !result.missed && result.effectiveness > 0)

      const line = battleLine(attackerName, turn.move, result)
      setMessage(line)
      setBattleLog((previous) => [line, ...previous].slice(0, 6))
      if (turn.side === 'player') {
        nextOpponentHp = Math.max(0, nextOpponentHp - result.damage)
        setOpponentHp(nextOpponentHp)
      } else {
        nextPlayerHp = Math.max(0, nextPlayerHp - result.damage)
        setPlayerHp(nextPlayerHp)
      }
      if (result.damage > 0) playTone('hit', soundEnabled)

      if (nextOpponentHp <= 0) {
        setMessage(`${formatName(opponent.name)} fainted. You won!`)
        await opponentControls.start({ opacity: [1, 0], y: [0, 36], transition: { duration: 0.55 } })
        finishBattle(true)
        return
      }
      if (nextPlayerHp <= 0) {
        setMessage(`${formatName(player.name)} fainted. The battle is over.`)
        await playerControls.start({ opacity: [1, 0], y: [0, 36], transition: { duration: 0.55 } })
        finishBattle(false)
        return
      }
      await wait(520)
    }

    setMessage('Choose your next move.')
    setBusy(false)
  }

  const resetToModes = () => {
    setMode(null)
    setView('modes')
    setPlayer(null)
    setOpponent(null)
    setSearchParams({}, { replace: true })
  }

  const chooseAnother = () => {
    playerControls.set({ opacity: 1, x: 0, y: 0 })
    opponentControls.set({ opacity: 1, x: 0, y: 0 })
    setView('select')
    setOutcome('playing')
  }

  const rematch = () => {
    playerControls.set({ opacity: 1, x: 0, y: 0 })
    opponentControls.set({ opacity: 1, x: 0, y: 0 })
    void startBattle()
  }

  return (
    <div className="game-shell min-h-[calc(100vh-4rem)] text-slate-900 transition-colors dark:text-slate-100">
      <div className="container-app py-8 sm:py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="pixel-panel flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-sky-300 bg-white sm:h-16 sm:w-16 dark:border-sky-300/40 dark:bg-slate-900">
              <PokeballMark className="h-9 w-9 sm:h-10 sm:w-10" />
            </span>
            <div>
              <span className="pixel-label mb-2 inline-flex items-center gap-2 text-[8px] font-bold uppercase text-sky-700 sm:text-[9px] dark:text-sky-300">
                <Gamepad2 className="h-3.5 w-3.5" />
                Pokémon Battle System
              </span>
              <h1 className="game-logo-title text-4xl font-bold uppercase leading-none text-slate-950 sm:text-5xl dark:text-white">Battle Arena</h1>
              <p className="mt-2 max-w-xl font-game text-base text-slate-600 sm:text-lg dark:text-sky-100/75">
                Choose your partner. Read the matchup. Win the turn.
              </p>
            </div>
          </div>
          <BattleRecordStrip record={record} />
        </header>

        <AnimatePresence mode="wait">
          {view === 'modes' && <ModeSelection key="modes" onChoose={chooseMode} />}
          {view === 'select' && mode && (
            <FighterSelection
              key="select"
              mode={mode}
              selectedId={selectedId}
              search={search}
              searchResults={searchResults}
              favorites={favorites}
              recentFighters={recentFighters}
              namesById={namesById}
              isLoadingSearch={allPokemon.isLoading}
              error={loadError}
              onSearch={setSearch}
              onSelect={choosePokemon}
              onStart={() => void startBattle()}
              onBack={resetToModes}
            />
          )}
          {view === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pixel-panel rounded-lg border-4 border-sky-300 bg-white py-16 dark:border-sky-400/40 dark:bg-[#121e35]">
              <Spinner label={mode === 'legendary' ? 'Summoning a legendary opponent…' : 'Finding an opponent…'} />
            </motion.div>
          )}
          {view === 'battle' && player && opponent && mode && (
            <BattleArena
              key="battle"
              mode={mode}
              player={player}
              opponent={opponent}
              playerHp={playerHp}
              opponentHp={opponentHp}
              playerMaxHp={playerMaxHp}
              opponentMaxHp={opponentMaxHp}
              moves={moves}
              message={message}
              battleLog={battleLog}
              busy={busy}
              outcome={outcome}
              streak={record.streak}
              soundEnabled={soundEnabled}
              playerControls={playerControls}
              opponentControls={opponentControls}
              onMove={(move) => void performMove(move)}
              onToggleSound={() => setSoundEnabled((value) => !value)}
              onRematch={rematch}
              onChooseAnother={chooseAnother}
              onExit={resetToModes}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function BattleRecordStrip({ record }: { record: BattleRecord }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Battle record">
      {[
        ['Wins', record.wins],
        ['Streak', record.streak],
        ['Best', record.bestStreak],
        ['Legendaries', record.legendaryWins],
      ].map(([label, value]) => (
        <div key={label} className="pixel-panel min-w-16 rounded-md border-2 border-slate-300 bg-white px-3 py-2.5 text-center dark:border-slate-600 dark:bg-[#18233a]">
          <p className="font-game text-2xl font-bold leading-none text-slate-900 dark:text-white">{value}</p>
          <p className="pixel-label mt-1.5 text-[7px] uppercase text-sky-700 dark:text-sky-200/70">{label}</p>
        </div>
      ))}
    </div>
  )
}

function ModeSelection({ onChoose }: { onChoose: (mode: GameMode) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="grid gap-5 lg:grid-cols-2">
        <button
          onClick={() => onChoose('quick')}
          className="pixel-panel group relative min-h-80 overflow-hidden rounded-xl border-4 border-sky-400/60 bg-gradient-to-br from-sky-50 via-cyan-100 to-sky-200 p-6 text-left text-slate-900 transition hover:-translate-y-1 hover:border-sky-500 sm:p-8 dark:border-sky-400/45 dark:from-[#101c38] dark:via-[#102b4d] dark:to-[#0a5671] dark:text-white dark:hover:border-sky-300"
        >
          <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(90deg,transparent_50%,rgba(255,255,255,.12)_50%)] [background-size:12px_12px]" />
          <div className="pointer-events-none absolute bottom-2 right-3 flex items-end -space-x-4 opacity-90 transition group-hover:-translate-y-2">
            <img src={spriteUrl(25)} alt="" className="pixel-sprite h-28 w-28 object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
            <img src={spriteUrl(94)} alt="" className="pixel-sprite h-32 w-32 object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
          </div>
          <div className="relative flex h-full max-w-[68%] flex-col">
            <span className="pixel-panel flex h-12 w-12 items-center justify-center rounded-md border-2 border-sky-300 bg-white/80 text-sky-700 dark:border-sky-200/50 dark:bg-sky-950/60 dark:text-sky-200">
              <Swords className="h-7 w-7" />
            </span>
            <p className="pixel-label mt-7 text-[8px] uppercase text-sky-700 dark:text-sky-200">Classic mode</p>
            <h2 className="mt-2 font-game text-4xl font-bold leading-none">Quick Battle</h2>
            <p className="mt-4 max-w-md font-game text-lg leading-snug text-slate-700 dark:text-sky-50/85">
              Face a balanced random opponent. Type matchups, move priority, and speed decide every turn.
            </p>
            <span className="pixel-label mt-auto inline-flex items-center gap-2 pt-6 text-[8px] text-amber-700 dark:text-yellow-300">
              Press A / Click <Zap className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          onClick={() => onChoose('legendary')}
          className="pixel-panel group relative min-h-80 overflow-hidden rounded-xl border-4 border-amber-400/70 bg-gradient-to-br from-amber-50 via-orange-100 to-rose-200 p-6 text-left text-slate-900 transition hover:-translate-y-1 hover:border-amber-500 sm:p-8 dark:border-amber-400/50 dark:from-[#231439] dark:via-[#4b2445] dark:to-[#744313] dark:text-white dark:hover:border-amber-300"
        >
          <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(90deg,transparent_50%,rgba(255,255,255,.12)_50%)] [background-size:12px_12px]" />
          <div className="pointer-events-none absolute bottom-1 right-1 flex items-end -space-x-5 opacity-90 transition group-hover:-translate-y-2">
            <img src={spriteUrl(150)} alt="" className="pixel-sprite h-28 w-28 object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
            <img src={spriteUrl(384)} alt="" className="pixel-sprite h-36 w-36 object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
          </div>
          <Sparkles className="absolute right-7 top-7 h-7 w-7 text-amber-600/80 dark:text-amber-300/70" />
          <div className="relative flex h-full max-w-[68%] flex-col">
            <span className="pixel-panel flex h-12 w-12 items-center justify-center rounded-md border-2 border-amber-300 bg-white/80 text-amber-700 dark:border-amber-200/50 dark:bg-amber-950/50 dark:text-amber-200">
              <Crown className="h-7 w-7 fill-current" />
            </span>
            <p className="pixel-label mt-7 text-[8px] uppercase text-amber-700 dark:text-amber-200">Boss challenge</p>
            <h2 className="mt-2 font-game text-4xl font-bold leading-none">Legendary Challenge</h2>
            <p className="mt-4 max-w-md font-game text-lg leading-snug text-slate-700 dark:text-amber-50/85">
              Battle a random Legendary Pokémon with boosted HP and sharper AI. Build your legendary win count.
            </p>
            <span className="pixel-label mt-auto inline-flex items-center gap-2 pt-6 text-[8px] text-amber-700 dark:text-yellow-300">
              Press A / Click <Crown className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [Shield, 'Fair rules', 'Stats are normalized so every fighter has a real chance.'],
          [Zap, 'Fast turns', 'Most battles finish in a few focused minutes.'],
          [Trophy, 'Local records', 'Wins, streaks, and legendary victories stay on this device.'],
        ].map(([Icon, title, text]) => {
          const FeatureIcon = Icon as typeof Shield
          return (
            <div key={title as string} className="pixel-panel flex gap-3 rounded-md border-2 border-slate-300 bg-white p-4 dark:border-slate-600 dark:bg-[#141f35]">
              <FeatureIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-yellow-300" />
              <div>
                <p className="font-game text-lg font-bold text-slate-900 dark:text-white">{title as string}</p>
                <p className="mt-1 font-game text-base leading-snug text-slate-600 dark:text-sky-100/65">{text as string}</p>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

interface FighterSelectionProps {
  mode: GameMode
  selectedId: number
  search: string
  searchResults: { id: number; name: string }[]
  favorites: number[]
  recentFighters: number[]
  namesById: Map<number, string>
  isLoadingSearch: boolean
  error: string
  onSearch: (value: string) => void
  onSelect: (id: number) => void
  onStart: () => void
  onBack: () => void
}

function FighterSelection(props: FighterSelectionProps) {
  const favoriteChoices = props.favorites.slice(0, 8).map((id) => ({
    id,
    name: formatName(props.namesById.get(id) ?? `Pokémon ${id}`),
  }))
  const recentChoices = props.recentFighters.slice(0, 4).map((id) => ({
    id,
    name: formatName(props.namesById.get(id) ?? `Pokémon ${id}`),
  }))
  const selectedName = formatName(
    props.namesById.get(props.selectedId)
      ?? FEATURED_FIGHTERS.find((item) => item.id === props.selectedId)?.name
      ?? `Pokémon ${props.selectedId}`,
  )

  return (
    <motion.div className="pb-20 sm:pb-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <button onClick={props.onBack} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-md border-2 border-transparent px-3 font-game text-base font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 dark:text-sky-200/70 dark:hover:border-sky-300/30 dark:hover:bg-white/5 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Change mode
      </button>

      <div className={cn(
        'pixel-panel relative overflow-hidden rounded-lg border-4 p-6 sm:p-8',
        props.mode === 'legendary'
          ? 'border-amber-300 bg-gradient-to-r from-amber-100/80 via-white/80 to-violet-100/70 dark:border-amber-400/30 dark:from-amber-400/10 dark:via-transparent dark:to-violet-500/10'
          : 'border-sky-300 bg-gradient-to-r from-sky-100/80 via-white/80 to-red-50/70 dark:border-sky-400/25 dark:from-sky-400/10 dark:via-transparent dark:to-brand-500/5',
      )}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={cn('pixel-label text-[8px] font-bold uppercase', props.mode === 'legendary' ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300')}>
              {props.mode === 'legendary' ? 'Legendary Challenge' : 'Quick Battle'}
            </p>
            <h2 className="mt-2 font-game text-3xl font-extrabold sm:text-4xl">Choose your fighter</h2>
            <p className="mt-2 font-game text-lg text-slate-600 dark:text-sky-100/70">Search the full Pokédex or pick a familiar favorite.</p>
          </div>
          <div className="pixel-panel flex min-w-40 flex-col items-center rounded-md border-2 border-amber-400 bg-white/90 px-4 py-3 text-center dark:border-yellow-300/60 dark:bg-[#162139]" aria-live="polite">
            <p className="pixel-label text-[7px] uppercase text-amber-700 dark:text-yellow-300">Selected</p>
            <p className="mt-1 font-game text-xl font-extrabold">{selectedName}</p>
            <motion.div
              key={props.selectedId}
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="relative mt-2 flex h-24 w-24 items-center justify-center"
            >
              <span className="absolute bottom-1 h-3 w-16 rounded-full bg-black/35 blur-sm" />
              <img
                src={spriteUrl(props.selectedId)}
                alt={`${selectedName} selected`}
                className="pixel-sprite relative h-24 w-24 object-contain drop-shadow-lg"
                onError={(event) => {
                  const image = event.currentTarget
                  if (!image.dataset.fallback) {
                    image.dataset.fallback = '1'
                    image.src = artworkUrl(props.selectedId)
                  } else {
                    image.onerror = null
                    image.src = '/favicon.svg'
                  }
                }}
              />
            </motion.div>
            <p className="pixel-label mt-1 text-[6px] text-sky-700 dark:text-sky-200/55">{formatDexNumber(props.selectedId)}</p>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={props.search}
            onChange={(event) => props.onSearch(event.target.value)}
            placeholder="Search by name or Pokédex number"
            aria-label="Search for your fighter"
            className="pixel-panel h-14 w-full rounded-md border-2 border-slate-300 bg-white pl-12 pr-4 font-game text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30 dark:border-slate-500 dark:bg-[#111b30] dark:text-white dark:placeholder:text-sky-100/35 dark:focus:border-yellow-300 dark:focus:ring-yellow-300/20"
          />
        </div>

        {!props.search.trim() && recentChoices.length > 0 && (
          <div className="mt-4 border-t-2 border-slate-300 pt-4 dark:border-slate-600/70">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="pixel-label text-[7px] uppercase text-amber-700 dark:text-yellow-300">Recently selected</p>
              <p className="font-game text-sm text-slate-500 dark:text-sky-100/45">Choose again with one click</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {recentChoices.map((item) => (
                <FighterChoice
                  key={item.id}
                  {...item}
                  selected={props.selectedId === item.id}
                  onSelect={props.onSelect}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {props.search.trim() && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {props.isLoadingSearch && <p className="col-span-full py-3 text-sm text-slate-500">Loading the Pokédex…</p>}
            {!props.isLoadingSearch && props.searchResults.length === 0 && <p className="col-span-full py-3 text-sm text-slate-500">No Pokémon found.</p>}
            {props.searchResults.map((item) => (
              <FighterChoice key={item.id} id={item.id} name={formatName(item.name)} selected={props.selectedId === item.id} onSelect={props.onSelect} compact />
            ))}
          </div>
        )}
      </div>

      {favoriteChoices.length > 0 && !props.search.trim() && (
        <section className="mt-7">
          <h3 className="mb-3 flex items-center gap-2 font-game text-2xl font-bold text-slate-900 dark:text-white"><Heart className="h-4 w-4 fill-brand-500 text-brand-500" /> Your favorites</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {favoriteChoices.map((item) => <FighterChoice key={item.id} {...item} selected={props.selectedId === item.id} onSelect={props.onSelect} />)}
          </div>
        </section>
      )}

      {!props.search.trim() && (
        <section className="mt-7">
          <h3 className="mb-3 font-game text-2xl font-bold text-slate-900 dark:text-white">Featured fighters</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {FEATURED_FIGHTERS.map((item) => <FighterChoice key={item.id} {...item} selected={props.selectedId === item.id} onSelect={props.onSelect} />)}
          </div>
        </section>
      )}

      {props.error && <p className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" role="alert">{props.error}</p>}

      <div className="fixed inset-x-4 bottom-4 z-30 flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-2xl backdrop-blur-xl sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none dark:border-white/10 dark:bg-night-950/85 dark:sm:bg-transparent">
        <button
          onClick={props.onStart}
          className={cn(
            'game-button-shadow inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-white/50 px-7 font-game text-lg font-extrabold text-white transition hover:-translate-y-0.5 sm:w-auto',
            props.mode === 'legendary'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/40'
              : 'bg-gradient-to-r from-brand-500 to-orange-500 shadow-brand-500/25 hover:shadow-brand-500/40',
          )}
        >
          {props.mode === 'legendary' ? <Crown className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
          Start {props.mode === 'legendary' ? 'Legendary Challenge' : 'Quick Battle'}
        </button>
      </div>
    </motion.div>
  )
}

function FighterChoice({ id, name, selected, onSelect, compact = false }: { id: number; name: string; selected: boolean; onSelect: (id: number) => void; compact?: boolean }) {
  return (
    <button
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={cn(
        'pixel-panel group relative flex items-center rounded-md border-2 bg-white text-left text-slate-900 transition hover:-translate-y-0.5 hover:border-amber-400 dark:bg-[#131e34] dark:text-white dark:hover:border-yellow-300',
        compact ? 'gap-3 p-2.5' : 'flex-col p-3 text-center',
        selected
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/30 dark:border-yellow-300 dark:bg-[#23304b] dark:ring-yellow-300/25'
          : 'border-slate-300 dark:border-slate-600',
      )}
    >
      {selected && <span className="pixel-label absolute right-2 top-2 text-[10px] text-amber-600 dark:text-yellow-300">▶</span>}
      <img
        src={spriteUrl(id)}
        alt=""
        loading="lazy"
        className={cn('pixel-sprite object-contain drop-shadow-md transition group-hover:scale-110', compact ? 'h-12 w-12' : 'h-20 w-20')}
        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/favicon.svg' }}
      />
      <div className={cn('min-w-0', !compact && 'mt-1 w-full')}>
        <p className="truncate font-game text-lg font-bold leading-tight">{name}</p>
        <p className="pixel-label mt-1 text-[6px] text-sky-700 dark:text-sky-200/55">{formatDexNumber(id)}</p>
      </div>
    </button>
  )
}

interface BattleArenaProps {
  mode: GameMode
  player: Pokemon
  opponent: Pokemon
  playerHp: number
  opponentHp: number
  playerMaxHp: number
  opponentMaxHp: number
  moves: BattleMove[]
  message: string
  battleLog: string[]
  busy: boolean
  outcome: BattleOutcome
  streak: number
  soundEnabled: boolean
  playerControls: ReturnType<typeof useAnimation>
  opponentControls: ReturnType<typeof useAnimation>
  onMove: (move: BattleMove) => void
  onToggleSound: () => void
  onRematch: () => void
  onChooseAnother: () => void
  onExit: () => void
}

function BattleArena(props: BattleArenaProps) {
  const playerImage = props.player.sprites.other?.showdown?.back_default
    ?? props.player.sprites.back_default
    ?? bestArtwork(props.player.sprites)
  const opponentImage = props.opponent.sprites.other?.showdown?.front_default
    ?? props.opponent.sprites.front_default
    ?? bestArtwork(props.opponent.sprites)
  const boss = props.mode === 'legendary'
  const { busy, moves: availableMoves, onMove, outcome } = props

  useEffect(() => {
    const chooseMoveWithKeyboard = (event: KeyboardEvent) => {
      if (busy || outcome !== 'playing') return
      const index = Number(event.key) - 1
      const move = availableMoves[index]
      if (!move || index < 0 || index > 3) return
      event.preventDefault()
      onMove(move)
    }
    window.addEventListener('keydown', chooseMoveWithKeyboard)
    return () => window.removeEventListener('keydown', chooseMoveWithKeyboard)
  }, [availableMoves, busy, onMove, outcome])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button disabled={props.busy} onClick={props.onExit} className="inline-flex min-h-10 items-center gap-2 rounded-md border-2 border-transparent px-3 font-game text-base font-bold text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-wait disabled:opacity-40 dark:text-sky-200/70 dark:hover:border-sky-300/30 dark:hover:bg-white/5 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Exit battle
        </button>
        <div className="flex items-center gap-2">
          <span className={cn('pixel-label rounded-md border-2 px-3 py-2 text-[7px]', boss ? 'border-amber-400/60 bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300' : 'border-sky-400/60 bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300')}>
            {boss ? 'Legendary Challenge' : 'Quick Battle'}
          </span>
          <span className="pixel-label rounded-md border-2 border-emerald-400/60 bg-emerald-100 px-3 py-2 text-[7px] text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300">Streak {props.streak}</span>
          <button onClick={props.onToggleSound} className="pixel-panel flex h-10 w-10 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-sky-700 dark:border-slate-600 dark:bg-[#18233a] dark:text-sky-100" aria-label={props.soundEnabled ? 'Mute battle sounds' : 'Enable battle sounds'}>
            {props.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <section className={cn(
        'battle-stage pixel-panel relative min-h-[520px] overflow-hidden rounded-lg border-4 text-white sm:min-h-[560px]',
        boss ? 'border-amber-400/70' : 'border-sky-300/60',
      )} aria-label="Battle arena">
        <img src="/battle-arena-pixel.jpg" alt="" className="pixel-sprite absolute inset-0 h-full w-full object-cover" />
        <div className={cn('absolute inset-0', boss ? 'bg-amber-950/20 mix-blend-multiply' : 'bg-sky-950/5')} />
        <div className="absolute left-[4%] top-[5%] z-20 w-[78%] max-w-sm sm:left-[10%] sm:top-[12%] sm:w-80">
          <CombatantPanel pokemon={props.opponent} hp={props.opponentHp} maxHp={props.opponentMaxHp} boss={boss} />
        </div>
        <div className="absolute bottom-[5%] right-[4%] z-20 w-[78%] max-w-sm sm:bottom-[10%] sm:right-[10%] sm:w-80">
          <CombatantPanel pokemon={props.player} hp={props.playerHp} maxHp={props.playerMaxHp} player />
        </div>

        <div className="absolute right-[2%] top-[24%] z-10 h-40 w-40 sm:right-[12%] sm:top-[16%] sm:h-56 sm:w-56">
          <span className="absolute bottom-3 left-1/2 h-5 w-36 -translate-x-1/2 rounded-full bg-black/35 blur-lg" />
          <motion.img
            animate={props.opponentControls}
            src={opponentImage}
            alt={formatName(props.opponent.name)}
            className="pixel-sprite relative h-full w-full scale-110 object-contain drop-shadow-[0_10px_3px_rgba(15,23,42,0.4)]"
            onError={(event) => {
              const image = event.currentTarget
              if (!image.dataset.fallback) {
                image.dataset.fallback = '1'
                image.src = artworkUrl(props.opponent.id)
              } else {
                image.onerror = null
                image.src = '/favicon.svg'
              }
            }}
          />
        </div>
        <div className="absolute bottom-[20%] left-[2%] z-10 h-44 w-44 sm:bottom-[15%] sm:left-[11%] sm:h-64 sm:w-64">
          <span className="absolute bottom-2 left-1/2 h-6 w-40 -translate-x-1/2 rounded-full bg-black/40 blur-lg" />
          <motion.img
            animate={props.playerControls}
            src={playerImage}
            alt={formatName(props.player.name)}
            className="pixel-sprite relative h-full w-full scale-110 object-contain drop-shadow-[0_12px_3px_rgba(15,23,42,0.45)]"
            onError={(event) => {
              const image = event.currentTarget
              if (!image.dataset.fallback) {
                image.dataset.fallback = '1'
                image.src = artworkUrl(props.player.id)
              } else {
                image.onerror = null
                image.src = '/favicon.svg'
              }
            }}
          />
        </div>

        {boss && <Crown className="absolute right-6 top-6 h-7 w-7 fill-amber-300 text-amber-300 opacity-80" />}

        <AnimatePresence>
          {props.outcome !== 'playing' && (
            <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.85, y: 18 }} animate={{ scale: 1, y: 0 }} className="game-dialog w-full max-w-md rounded-lg p-7 text-center" role="status" aria-live="assertive">
                <span className={cn('pixel-panel mx-auto flex h-16 w-16 items-center justify-center rounded-md border-2', props.outcome === 'won' ? 'border-amber-500 bg-amber-300 text-amber-900' : 'border-slate-500 bg-slate-300 text-slate-700')}>
                  {props.outcome === 'won' ? <Trophy className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
                </span>
                <p className="pixel-label mt-5 text-[8px] uppercase text-slate-500 dark:text-slate-400">Battle complete</p>
                <h2 className="mt-2 font-game text-4xl font-extrabold">{props.outcome === 'won' ? 'Victory!' : 'Defeated'}</h2>
                <p className="mt-3 font-game text-lg text-slate-600 dark:text-slate-300">{props.outcome === 'won' ? `${formatName(props.player.name)} won the battle.` : `${formatName(props.opponent.name)} controlled the arena.`}</p>
                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  <button onClick={props.onRematch} className="game-button-shadow inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-red-800 bg-brand-500 px-5 font-game text-lg font-extrabold text-white hover:bg-brand-600"><RotateCcw className="h-4 w-4" /> Battle again</button>
                  <button onClick={props.onChooseAnother} className="game-button-shadow min-h-11 rounded-md border-2 border-slate-600 bg-slate-700 px-5 font-game text-lg font-bold text-white hover:bg-slate-600">Choose another</button>
                </div>
                <button onClick={props.onExit} className="mt-4 font-game text-base font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Back to games</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="game-dialog flex min-h-52 flex-col rounded-lg p-5 sm:p-6" aria-live="polite">
          <p className="pixel-label text-[8px] uppercase text-brand-600">Battle message</p>
          <p className="mt-3 font-game text-2xl font-bold leading-snug">{props.message}</p>
          <div className="mt-4 space-y-1.5 border-t-2 border-slate-300 pt-4 dark:border-slate-600">
            {props.battleLog.length === 0
              ? <p className="font-game text-base text-slate-500 dark:text-slate-400">The battle log will appear here.</p>
              : props.battleLog.slice(0, 3).map((line, index) => <p key={`${line}-${index}`} className={cn('font-game text-base', index === 0 ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400')}>{line}</p>)}
          </div>
        </section>

        <section className="game-dialog rounded-lg p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="pixel-label text-[8px] uppercase text-sky-700 dark:text-sky-300">Command</p>
              <h2 className="mt-1 font-game text-2xl font-bold">Choose a move</h2>
              <p className="mt-1 font-game text-sm text-slate-500 dark:text-slate-400">Hover or focus a move to inspect it.</p>
            </div>
            {props.busy && <span className="inline-flex items-center gap-2 font-game text-base font-semibold text-slate-500 dark:text-slate-400"><span className="h-2 w-2 animate-pulse bg-brand-500" /> Resolving turn</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {props.moves.map((move, index) => (
              <MoveButton
                key={move.id}
                index={index}
                move={move}
                effectiveness={getEffectiveness(move.type, props.opponent.types.map((entry) => entry.type.name))}
                disabled={props.busy || props.outcome !== 'playing'}
                onClick={() => props.onMove(move)}
              />
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function CombatantPanel({ pokemon, hp, maxHp, player = false, boss = false }: { pokemon: Pokemon; hp: number; maxHp: number; player?: boolean; boss?: boolean }) {
  const percentage = Math.max(0, Math.min(100, (hp / Math.max(maxHp, 1)) * 100))
  const color = percentage > 55 ? 'bg-emerald-400' : percentage > 25 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="game-dialog rounded-md p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {boss && <Crown className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
            <p className="truncate font-game text-xl font-extrabold sm:text-2xl">{formatName(pokemon.name)}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-1"><TypeBadge type={pokemon.types[0]?.type.name ?? 'normal'} size="sm" />{pokemon.types[1] && <TypeBadge type={pokemon.types[1].type.name} size="sm" />}</div>
        </div>
        <span className="pixel-label text-[7px] uppercase text-slate-500 dark:text-slate-400">{player ? 'You' : boss ? 'Boss' : 'Rival'}</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden border-2 border-slate-700 bg-slate-300 dark:bg-slate-600">
        <motion.div className={cn('h-full', color)} animate={{ width: `${percentage}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
      <div className="pixel-label mt-2 flex justify-between text-[7px] text-slate-600 dark:text-slate-300"><span>HP</span><span>{hp} / {maxHp}</span></div>
    </div>
  )
}

function MoveButton({ move, index, effectiveness, disabled, onClick }: { move: BattleMove; index: number; effectiveness: number; disabled: boolean; onClick: () => void }) {
  const color = moveTypeColor(move.type)
  const tooltipId = `move-${move.id}-description`
  const effectivenessText = effectiveness === 0
    ? 'No effect'
    : effectiveness > 1
      ? `${effectiveness}× super effective`
      : effectiveness < 1
        ? `${effectiveness}× not very effective`
        : 'Normal effectiveness'
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-describedby={tooltipId}
        className="game-button-shadow relative min-h-20 w-full overflow-hidden rounded-md border-2 border-slate-300 bg-white p-4 text-left text-slate-900 transition hover:-translate-y-0.5 hover:border-amber-400 focus-visible:border-amber-400 disabled:cursor-wait disabled:opacity-50 dark:border-slate-800 dark:bg-[#24314b] dark:text-white dark:hover:border-yellow-300 dark:focus-visible:border-yellow-300"
        style={{ '--move-color': color } as React.CSSProperties}
      >
        <span className="absolute inset-y-0 left-0 w-2 bg-[var(--move-color)]" />
        <span className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[var(--move-color)] opacity-10 blur-2xl transition group-hover:opacity-20" />
        <span className="relative flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <span className="pixel-label flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-slate-100 text-[8px] text-amber-700 dark:border-white/25 dark:bg-black/20 dark:text-yellow-200">{index + 1}</span>
            <span>
              <span className="block font-game text-xl font-extrabold leading-none">{move.name}</span>
              <span className="mt-1.5 block font-game text-sm font-semibold capitalize text-slate-600 dark:text-sky-100/65">{move.type} · {move.category}</span>
            </span>
          </span>
          <span className="pixel-label text-right text-[7px] text-slate-600 dark:text-sky-100/60"><span className="mb-1 block text-[9px] text-slate-900 dark:text-white">{move.power}</span>{move.accuracy}%</span>
        </span>
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-72 -translate-x-1/2 rounded-md border-2 border-yellow-300/70 bg-[#101a2e] p-3.5 text-left text-white opacity-0 shadow-2xl transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="font-game text-xl font-bold">{move.name}</span>
          <span className="rounded-sm px-2 py-1 font-game text-sm font-bold capitalize text-white" style={{ backgroundColor: color }}>{move.type}</span>
        </span>
        <span className="mt-2 block font-game text-base leading-snug text-sky-100/80">{move.description}</span>
        <span className="mt-3 grid grid-cols-3 gap-2 border-t border-white/15 pt-3 text-center">
          <span><span className="pixel-label block text-[6px] text-sky-200/50">Power</span><span className="mt-1 block font-game text-lg font-bold">{move.power}</span></span>
          <span><span className="pixel-label block text-[6px] text-sky-200/50">Accuracy</span><span className="mt-1 block font-game text-lg font-bold">{move.accuracy}%</span></span>
          <span><span className="pixel-label block text-[6px] text-sky-200/50">Class</span><span className="mt-1 block font-game text-lg font-bold capitalize">{move.category}</span></span>
        </span>
        <span className={cn(
          'mt-3 block rounded-sm border px-2.5 py-1.5 text-center font-game text-sm font-bold',
          effectiveness === 0
            ? 'border-slate-500 bg-slate-700 text-slate-200'
            : effectiveness > 1
              ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
              : effectiveness < 1
                ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                : 'border-sky-400/40 bg-sky-400/10 text-sky-200',
        )}>{effectivenessText}</span>
        <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-yellow-300/70 bg-[#101a2e]" />
      </span>
    </div>
  )
}

function battleLine(attackerName: string, move: BattleMove, result: DamageResult): string {
  if (result.missed) return `${attackerName}'s ${move.name} missed!`
  if (result.effectiveness === 0) return `${attackerName} used ${move.name}. It had no effect.`
  const effect = result.effectiveness > 1 ? ' It was super effective!' : result.effectiveness < 1 ? ' It was not very effective.' : ''
  const critical = result.critical ? ' Critical hit!' : ''
  return `${attackerName}'s ${move.name} dealt ${result.damage} damage.${critical}${effect}`
}

function moveTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c', grass: '#7ac74c', ice: '#96d9d6',
    fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a',
    rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad',
  }
  return colors[type] ?? '#e3350d'
}

function playTone(kind: 'attack' | 'hit' | 'victory' | 'defeat', enabled: boolean) {
  if (!enabled) return
  try {
    const AudioContextClass = window.AudioContext
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    const frequencies = { attack: 310, hit: 150, victory: 620, defeat: 110 }
    oscillator.type = kind === 'hit' || kind === 'defeat' ? 'sawtooth' : 'sine'
    oscillator.frequency.setValueAtTime(frequencies[kind], now)
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'victory' ? 980 : Math.max(70, frequencies[kind] * 0.7), now + 0.18)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.23)
    oscillator.addEventListener('ended', () => void context.close())
  } catch {
    // Audio feedback is optional and may be blocked by the browser.
  }
}
