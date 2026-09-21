import { Helmet } from 'react-helmet-async'

interface SeoProps {
  title: string
  description: string
  path?: string
  type?: 'website' | 'article'
  image?: string
  imageAlt?: string
  jsonLd?: Record<string, unknown>
}

const SITE_NAME = 'Pokémon World'
const BASE_URL = 'https://pokemon-world.vercel.app'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

export function Seo({
  title,
  description,
  path = '/',
  type = 'website',
  image,
  imageAlt,
  jsonLd,
}: SeoProps) {
  const fullTitle = path === '/' ? title : `${title} | ${SITE_NAME}`
  const url = `${BASE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {/* Structured data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
