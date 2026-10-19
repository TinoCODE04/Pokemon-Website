import { spriteUrl } from '../../utils/format'

export default function IslandPokemonImage({ id, className }: { id: number; className?: string }) {
  return <img
    key={id}
    className={className}
    src={`/images/island-pokemon/${id}.webp`}
    alt=""
    width={160}
    height={160}
    loading="lazy"
    decoding="async"
    onError={(event) => {
      const image = event.currentTarget
      if (!image.dataset.fallback) {
        image.dataset.fallback = 'sprite'
        image.src = spriteUrl(id)
      } else if (image.dataset.fallback === 'sprite') {
        image.dataset.fallback = 'placeholder'
        image.src = '/favicon.svg'
      }
    }}
  />
}
