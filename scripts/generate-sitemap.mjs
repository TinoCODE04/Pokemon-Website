/**
 * Generates public/sitemap.xml at build time.
 * Run: node scripts/generate-sitemap.mjs
 *
 * Covers all static routes plus dynamic movie slugs.
 * Pokemon detail pages (1000+) are intentionally omitted — too many
 * URLs for a static sitemap. Google will discover them via links.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BASE_URL = 'https://pokemon-world.vercel.app'
const TODAY = new Date().toISOString().slice(0, 10)

// Import movie slugs from the data file (ESM-compatible)
const { MOVIES } = await import(join(ROOT, 'src/data/movies.ts')).catch(() => ({ MOVIES: [] }))

/** @param {string} path @param {string} [lastmod] @param {string} [priority] */
function urlEntry(path, lastmod = TODAY, priority = '0.5') {
  return `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`
}

const staticRoutes = [
  { path: '/', priority: '1.0' },
  { path: '/pokedex', priority: '0.9' },
  { path: '/rankings', priority: '0.8' },
  { path: '/types', priority: '0.8' },
  { path: '/generations', priority: '0.8' },
  { path: '/abilities', priority: '0.8' },
  { path: '/compare', priority: '0.7' },
  { path: '/games', priority: '0.7' },
  { path: '/movies', priority: '0.8' },
  { path: '/favorites', priority: '0.6' },
]

// Type detail pages (18 types)
const typeRoutes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
  'dragon', 'dark', 'steel', 'fairy',
].map((t) => ({ path: `/types/${t}`, priority: '0.6' }))

// Generation detail pages (9 gens)
const genRoutes = Array.from({ length: 9 }, (_, i) => ({
  path: `/generations/${i + 1}`,
  priority: '0.6',
}))

// Movie detail pages from the data catalogue
const movieRoutes = MOVIES.map((m) => ({
  path: `/movies/${m.slug}`,
  priority: '0.6',
  lastmod: m.verifiedAt ?? TODAY,
}))

const allRoutes = [...staticRoutes, ...typeRoutes, ...genRoutes, ...movieRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map((r) => urlEntry(r.path, r.lastmod, r.priority)).join('\n')}
</urlset>
`

const outPath = join(ROOT, 'public', 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')
console.log(`Sitemap written to ${outPath} (${allRoutes.length} URLs)`)
