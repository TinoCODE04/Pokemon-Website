export type PaginationItem = number | '…'

export function paginationWindow(currentPage: number, totalPages: number): PaginationItem[] {
  const total = Math.max(1, Math.floor(totalPages))
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total)
  if (total <= 12) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set<number>()
  if (current <= 8) {
    for (let page = 1; page <= 10; page++) pages.add(page)
    pages.add(total - 1)
    pages.add(total)
  } else if (current >= total - 7) {
    pages.add(1)
    pages.add(2)
    for (let page = total - 9; page <= total; page++) pages.add(page)
  } else {
    pages.add(1)
    pages.add(2)
    for (let page = current - 2; page <= current + 2; page++) pages.add(page)
    pages.add(total - 1)
    pages.add(total)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: PaginationItem[] = []
  for (let index = 0; index < sorted.length; index++) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) result.push('…')
    result.push(sorted[index])
  }
  return result
}
