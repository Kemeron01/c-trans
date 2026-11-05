/** Resolves any CSS color (including `var(--x)` and oklch) to 0–1 RGB. */
export function cssColorToRgb(value: string): [number, number, number] {
  const probe = document.createElement('span')
  probe.style.color = value
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}
