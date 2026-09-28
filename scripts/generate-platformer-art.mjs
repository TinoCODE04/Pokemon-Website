import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

// Local placeholder art: six poses per row, 48px cells. No network sources.
const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const poly = (points, c) => `<polygon points="${points}" fill="${c}"/>`
function sprite(row, frame) {
  const walk = frame === 1 ? -2 : frame === 2 ? 2 : 0
  const arm = frame === 3 ? -4 : frame === 4 ? 2 : 0
  let s = ''
  if (row === 0) {
    s += poly('12,20 8,20 8,6 12,2 16,18 24,18 28,2 32,6 30,20 34,24 34,36 30,40 14,40 10,36 10,26', '#634528')
    s += poly('12,20 12,8 14,8 18,22 24,22 28,8 30,8 28,22 32,26 32,34 28,38 16,38 12,34', '#ffd746')
    s += poly('32,30 38,28 36,24 40,20 46,20 46,26 42,28 44,34 38,36 38,40 32,38', '#7b4e2b')
    s += poly('34,28 38,28 38,24 42,22 44,22 44,26 40,28 42,32 36,34', '#ffd746')
    s += rect(14, 25, 4, 4, '#242c36') + rect(26, 25, 4, 4, '#242c36')
    s += rect(14, 25, 2, 2, '#fff') + rect(26, 25, 2, 2, '#fff')
    s += rect(12, 30, 5, 4, '#ec5b44') + rect(28, 30, 5, 4, '#ec5b44') + rect(22, 31, 2, 2, '#573925')
    s += rect(10 + arm, 34, 6, 4, '#ffd746') + rect(30 - arm, 34, 6, 4, '#ffd746')
    s += rect(14 + walk, 40, 7, 4, '#634528') + rect(26 - walk, 40, 7, 4, '#634528')
  } else if (row === 1) {
    s += poly('12,14 16,8 28,8 34,14 34,26 30,30 34,36 30,42 16,42 12,36 14,28 10,22 10,16', '#773d2d')
    s += poly('14,14 18,10 28,10 32,16 32,24 28,28 30,36 28,40 18,40 14,36 16,26 12,22 12,16', '#f28b48')
    s += rect(18, 28, 10, 12, '#ffe0a0') + rect(27, 15, 4, 6, '#28343c') + rect(27, 15, 2, 2, '#fff')
    s += rect(12 + arm, 29, 6, 5, '#f28b48') + rect(30 - arm, 29, 6, 5, '#f28b48')
    s += poly('30,36 38,34 38,22 42,22 44,36 38,40 30,40', '#ec773b')
    s += poly('38,24 36,18 40,12 42,16 44,10 48,18 46,26 40,28', '#f45237')
    s += poly('40,24 40,18 42,16 46,20 44,24', '#ffdf6b')
    s += rect(14 + walk, 40, 8, 4, '#773d2d') + rect(26 - walk, 40, 8, 4, '#773d2d')
  } else if (row === 2) {
    s += poly('12,14 12,6 18,8 26,8 32,4 34,14 32,22 28,24 30,34 28,42 16,42 14,34 18,24 12,20', '#685881')
    s += poly('14,14 14,8 18,12 28,10 30,8 32,14 30,20 26,24 28,34 26,40 18,40 16,34 20,24 14,20', '#d8cee9')
    s += rect(16, 16, 4, 4, '#8666b9') + rect(28, 16, 4, 4, '#8666b9') + rect(20, 32, 8, 8, '#9f86bd')
    s += poly('28,36 38,36 42,30 40,22 44,22 46,32 42,40 30,42', '#a18ac2')
    s += rect(8 + arm, 26, 10, 5, '#d8cee9') + rect(28 - arm, 26, 10, 5, '#d8cee9')
    s += rect(14 + walk, 40, 8, 4, '#685881') + rect(26 - walk, 40, 8, 4, '#685881')
  } else if (row === 3) {
    s += poly('10,22 14,16 34,16 38,22 38,36 32,42 16,42 10,36', '#263c5c')
    s += rect(14, 20, 20, 18, '#5a7db3') + rect(18, 26, 3, 4, '#101d35') + rect(28, 26, 3, 4, '#101d35')
    s += poly('22,18 12,14 6,6 16,8 22,14 20,4 24,0 28,10 28,14 38,4 44,8 34,18', '#548c4f')
    s += rect(14 + walk, 40, 8, 4, '#253c5c') + rect(30 - walk, 40, 8, 4, '#253c5c')
  } else if (row === 4) {
    s += poly('4,16 10,12 6,6 18,8 24,2 30,8 42,6 38,16 46,24 40,28 44,38 32,38 24,46 18,40 6,42 10,32 2,26', '#76608e')
    s += poly('14,14 30,12 38,20 38,32 30,38 18,38 10,30 10,22', '#493452')
    s += rect(12, 20, 9, 6, '#fff7e3') + rect(27, 20, 9, 6, '#fff7e3') + rect(18, 22, 3, 5, '#b35976') + rect(27, 22, 3, 5, '#b35976')
    s += rect(18, 32, 14, 3, '#e7bdca')
  } else {
    s += poly('10,8 22,4 32,8 38,20 36,30 42,38 36,46 20,44 12,38 6,26', '#5c6479')
    s += poly('12,10 22,8 30,12 34,20 30,26 34,32 30,38 38,40 34,44 22,40 16,34 10,24', '#a3acb5')
    s += rect(12, 18, 10, 4, '#374158') + rect(26, 18, 8, 4, '#374158')
    s += poly('18,10 22,0 26,10', '#c9d1ce') + rect(16, 27, 14, 3, '#374158')
  }
  if (frame === 4) s += rect(36, 26, 4, 4, row === 0 ? '#fff2a3' : row === 1 ? '#ffb56a' : '#d7b5ff')
  if (frame === 5) s += rect(12, 24, 24, 12, '#ff657c66')
  return `<g transform="translate(${frame * 48},${row * 48})">${s}</g>`
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" shape-rendering="crispEdges">${Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, frame) => sprite(row, frame)).join('')).join('')}</svg>`
await mkdir('public/super-pokemon', { recursive: true })
await sharp(Buffer.from(svg)).png().toFile('public/super-pokemon/sprites.png')
console.log('Generated local 288×288 pixel atlas (6 characters × 6 poses).')
