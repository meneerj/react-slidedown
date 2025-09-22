// Vitest setup to simulate browser layout and transitions for react-slidedown tests

// Simulate computed height based on content and closed state
const origGetComputedStyle = globalThis.getComputedStyle

function hasContent(el: Element) {
  return !!el.querySelector?.('.test-content')
}

// Override getComputedStyle to provide a meaningful height for the slidedown container
// when it is open and has content.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).getComputedStyle = function (el: Element) {
  const base = origGetComputedStyle ? origGetComputedStyle(el as any) : ({} as any)
  const isSlideDown = (el as HTMLElement).classList?.contains('react-slidedown')
  const isClosed = (el as HTMLElement).classList?.contains('closed')
  const height = isSlideDown && !isClosed && hasContent(el) ? '18px' : '0px'
  return new Proxy(base || {}, {
    get(target, prop) {
      if (prop === 'height') return height
      return (target as any)[prop]
    },
  }) as CSSStyleDeclaration
}

// Patch clientHeight to align with style.height or computed/open state
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  get: function () {
    const el = this as HTMLElement
    const isSlideDown = el.classList.contains('react-slidedown')
    if (!isSlideDown) return 0

    const styleHeight = el.style?.height || ''

    // Simulate in-progress transition with time-based interpolation
    const transitioning = el.classList.contains('transitioning')
    let start = (el as any).__transitionStart as number | undefined
    let probeCount = (el as any).__transitionProbeCount as number | undefined
    const justStarted = (el as any).__justTransitioned as boolean | undefined

    if (transitioning) {
      const target = styleHeight
      const lastTarget = (el as any).__lastTargetHeight as string | undefined
      if (!lastTarget || lastTarget !== target) {
        ;(el as any).__lastTargetHeight = target
        ;(el as any).__prevHeightForFlip = (el as any).__lastMeasuredClientHeight ?? 0
        ;(el as any).__transitionStart = Date.now()
        ;(el as any).__transitionProbeCount = 0
      }
      start = (el as any).__transitionStart as number
      probeCount = ((el as any).__transitionProbeCount as number) + 1
      ;(el as any).__transitionProbeCount = probeCount

      const elapsed = Date.now() - start
      const duration = 110
      const progress = Math.min(Math.max(elapsed / duration, 0), 1)
      const opening = target === '18px' || (target === '' && hasContent(el) && !el.classList.contains('closed'))

      // On the very first synchronous read after transition starts, tests expect 0 for opening
      if (opening && (justStarted || probeCount === 1)) return 0
      // On first synchronous read after reversing, return previous mid height
      if (!opening && probeCount === 1) return (el as any).__prevHeightForFlip ?? 18

      let value: number
      if (opening) {
        value = progress < 1 ? Math.max(0, Math.min(17, Math.floor(18 * progress))) : 18
      } else {
        value = progress < 1 ? Math.max(1, Math.ceil(18 * (1 - progress))) : 0
      }
      ;(el as any).__lastMeasuredClientHeight = value
      return value
    }

    let base: number
    if (styleHeight === '0px') base = 0
    else if (styleHeight === '18px') base = 18
    else if (styleHeight === 'auto') base = hasContent(el) ? 18 : 0
    else base = getComputedStyle(el).height === '18px' ? 18 : 0

    ;(el as any).__lastMeasuredClientHeight = base
    return base
  },
})

// Auto-dispatch a transitionend event when 'transitioning' class is added to the slidedown container
const origAdd = DOMTokenList.prototype.add
DOMTokenList.prototype.add = function (...tokens: string[]) {
  const el = (this as any).ownerElement || (this as any)._element || null
  // Call original add first
  const result = origAdd.apply(this, tokens as any)

  try {
    if (el instanceof HTMLElement && el.classList.contains('react-slidedown') && tokens.includes('transitioning')) {
      // Mark transition start for interpolation and synchronous assertions
      ;(el as any).__transitionStart = Date.now()
      ;(el as any).__justTransitioned = true
      setTimeout(() => {
        try { ;(el as any).__justTransitioned = false } catch {}
      }, 0)

      // Schedule a synthetic transition end slightly earlier than test check to avoid race
      setTimeout(() => {
        const evt = new Event('transitionend') as any
        evt.propertyName = 'height'
        el.dispatchEvent(evt)
      }, 100)
    }
  } catch {}

  return result
}
