import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TYPE_ORDER, typeStyle } from '../constants/types'

export default function TypesPage() {
  return (
    <div className="container-app py-10">
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Types</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Every Pokémon and move belongs to at least one of eighteen types. Type matchups decide
          battle: explore each type to see its strengths, weaknesses and immunities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_ORDER.map((type, i) => {
          const style = typeStyle(type)
          const Icon = style.icon
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.035 }}
            >
              <Link
                to={`/types/${type}`}
                className="card-surface group relative flex items-center gap-4 overflow-hidden p-5 transition hover:shadow-lg"
              >
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-2xl transition group-hover:opacity-30"
                  style={{ background: style.color }}
                />
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold capitalize">{type}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View matchups</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500 dark:text-slate-600" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
