import { ArrowRight, Home, Search, Shuffle, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import './not-found.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <Seo
        title="Page Not Found"
        description="The page you are looking for does not exist."
        path="/404"
      />
      <div className="not-found-content">
        <div className="not-found-scene">
          <div className="not-found-aura" aria-hidden="true" />
          <div className="not-found-code" aria-hidden="true">
            <span>4</span>
            <span className="not-found-zero">0</span>
            <span>4</span>
          </div>
          <Zap className="not-found-spark not-found-spark-left" aria-hidden="true" />
          <Zap className="not-found-spark not-found-spark-right" aria-hidden="true" />
          <img
            src="/images/pikachu-official.png"
            alt="A cheerful Pikachu ready to guide you back to your adventure"
            width={475}
            height={475}
            className="not-found-pikachu"
            fetchPriority="high"
          />
          <div className="not-found-ground" aria-hidden="true" />
        </div>
        <h1 id="not-found-title">
          Looks like we lost the trail.
        </h1>
        <p className="not-found-description">
          <span className="sr-only">Error 404. </span>
          Even Pikachu couldn’t find this page.
          <br className="not-found-copy-break" /> Let’s get you back to your adventure.
        </p>
        <div className="not-found-actions">
          <Link
            to="/"
            className="not-found-button not-found-button-primary"
          >
            <Home size={18} aria-hidden="true" />
            Back home
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            to="/pokedex"
            className="not-found-button not-found-button-secondary"
          >
            <Search size={18} aria-hidden="true" />
            Open Pokédex
          </Link>
        </div>
        <div className="not-found-discover">
          <button
            type="button"
            className="not-found-random"
            onClick={() => navigate(`/pokemon/${Math.floor(Math.random() * 1025) + 1}`)}
          >
            <Shuffle size={16} aria-hidden="true" />
            Discover a random Pokémon
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
