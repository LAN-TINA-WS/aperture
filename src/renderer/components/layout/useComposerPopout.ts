// ═══════════════════════════════════════════════
// Aperture — useComposerPopout (1:1 Hermes)
//
// Hermes composer pop-out gestures ported to React:
//  - Pointer Events for drag
//  - Long-press activation (360ms) on floating body
//  - Peel-out from dock (16px upward drag)
//  - Release-to-dock near bottom center
//  - 5px transparent drag platform
//  - rAF-coalesced position updates
//  - bottom/right positioning
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════
   Constants (from Hermes use-popout-drag)
   ═══════════════════════════════════════════════ */

const LONG_PRESS_MS = 360
const LONG_PRESS_MOVE_TOLERANCE = 10
const PEEL_OUT_PX = 16
const DOCK_ZONE_BOTTOM_PX = 72
const DOCK_ZONE_CENTER_TOLERANCE_PX = 150
const DOCK_VERTICAL_FALLOFF_PX = 260
const DOCK_HORIZONTAL_FALLOFF_PX = 220
const POPOUT_WIDTH_REM = 24        // var(--composer-popout-width)
const POPOUT_ESTIMATED_HEIGHT = 80 // rough estimate for initial peel

interface PopoutPosition {
  bottom: number
  right: number
}

interface PressState {
  armed: boolean
  mode: 'dock' | 'float'
  pointerId: number
  startBottom: number
  startRight: number
  startX: number
  startY: number
}

/* ═══════════════════════════════════════════════
   Helpers (from Hermes)
   ═══════════════════════════════════════════════ */

function gestureTargetOk(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return !target.closest('button, a, input, textarea, select, [role="menuitem"]')
}

function isFloatDragPlatform(target: EventTarget | null, composerEl: HTMLElement | null) {
  if (!(target instanceof Element) || !composerEl) return false
  // 5px padding area = the root div itself, not surface/input
  if (target === composerEl || composerEl.contains(target)) {
    if (target.closest('[data-slot="composer-surface"], textarea')) return false
    return gestureTargetOk(target)
  }
  return false
}

/** 0 (far) → 1 (inside dock zone) */
function dockProximityOf(rect: DOMRect) {
  const centerX = rect.left + rect.width / 2
  const horizontalDist = Math.abs(centerX - window.innerWidth / 2)
  const verticalGap = window.innerHeight - DOCK_ZONE_BOTTOM_PX - rect.bottom

  const v = verticalGap <= 0 ? 1 : Math.max(0, 1 - verticalGap / DOCK_VERTICAL_FALLOFF_PX)
  const h = horizontalDist <= DOCK_ZONE_CENTER_TOLERANCE_PX
    ? 1
    : Math.max(0, 1 - (horizontalDist - DOCK_ZONE_CENTER_TOLERANCE_PX) / DOCK_HORIZONTAL_FALLOFF_PX)
  return v * h
}

function clampOffset(value: number, max: number) {
  return Math.min(Math.max(0, value), max)
}

function popoutPositionUnderPointer(
  clientX: number, clientY: number,
  grabX: number, grabY: number,
  boxWidth: number, boxHeight: number
): PopoutPosition {
  return {
    bottom: window.innerHeight - clientY + grabY - boxHeight,
    right: window.innerWidth - clientX + grabX - boxWidth,
  }
}

/* ═══════════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════════ */

export interface ComposerPopoutAPI {
  poppedOut: boolean
  dockProximity: number
  dragging: boolean
  position: PopoutPosition
  setPoppedOut: (v: boolean) => void
  togglePopout: () => void
  onPointerDown: (e: React.PointerEvent) => void
  rootRef: React.RefObject<HTMLDivElement | null>
}

export function useComposerPopout(): ComposerPopoutAPI {
  const [poppedOut, setPoppedOut] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [dockProximity, setDockProximity] = useState(0)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const positionRef = useRef<PopoutPosition>({ bottom: 100, right: 40 })
  const stateRef = useRef<PressState | null>(null)
  const timerRef = useRef<number | null>(null)
  const poppedOutRef = useRef(poppedOut)
  poppedOutRef.current = poppedOut

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetGesture = useCallback(() => {
    clearTimer()
    stateRef.current = null
    setDragActive(false)
    setDockProximity(0)
  }, [clearTimer])

  const beginFloatDrag = useCallback((state: PressState, clientX: number, clientY: number) => {
    clearTimer()
    state.mode = 'float'
    state.armed = true
    state.startBottom = positionRef.current.bottom
    state.startRight = positionRef.current.right
    state.startX = clientX
    state.startY = clientY
    setDragActive(true)
  }, [clearTimer])

  const peelOffFromDock = useCallback((state: PressState, clientX: number, clientY: number) => {
    const composer = rootRef.current
    if (!composer) return

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const rect = composer.getBoundingClientRect()
    const boxWidth = POPOUT_WIDTH_REM * rem
    const boxHeight = POPOUT_ESTIMATED_HEIGHT
    const grabX = clampOffset(state.startX - rect.left, boxWidth)
    const grabY = clampOffset(state.startY - rect.top, boxHeight)
    const next = popoutPositionUnderPointer(clientX, clientY, grabX, grabY, boxWidth, boxHeight)

    positionRef.current = next
    setPoppedOut(true)
    beginFloatDrag(state, clientX, clientY)
  }, [beginFloatDrag])

  // ── Pointer Down ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || !gestureTargetOk(e.target)) return

    const po = poppedOutRef.current

    // Floating: 5px platform drags immediately
    if (po && isFloatDragPlatform(e.target, rootRef.current)) {
      stateRef.current = {
        armed: true,
        mode: 'float',
        pointerId: e.pointerId,
        startBottom: positionRef.current.bottom,
        startRight: positionRef.current.right,
        startX: e.clientX,
        startY: e.clientY,
      }
      setDragActive(true)
      return
    }

    stateRef.current = {
      armed: false,
      mode: po ? 'float' : 'dock',
      pointerId: e.pointerId,
      startBottom: positionRef.current.bottom,
      startRight: positionRef.current.right,
      startX: e.clientX,
      startY: e.clientY,
    }

    clearTimer()

    // Docked: NO timer — pop-out is purely the upward peel gesture
    // Floating: arm long-press to drag the body
    if (po) {
      timerRef.current = window.setTimeout(() => {
        const state = stateRef.current
        if (!state || state.armed) return
        state.armed = true
        setDragActive(true)
      }, LONG_PRESS_MS)
    }
  }, [clearTimer])

  // ── Pointer Move / Up (document-level, always mounted) ──
  useEffect(() => {
    let raf: number | null = null
    let pending: { x: number; y: number } | null = null

    const cancelRaf = () => {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null }
    }

    const flush = () => {
      raf = null
      const state = stateRef.current
      if (!state?.armed || state.mode !== 'float' || !pending) return

      positionRef.current = {
        bottom: state.startBottom - (pending.y - state.startY),
        right: state.startRight - (pending.x - state.startX),
      }

      // Update DOM directly
      const el = rootRef.current
      if (el) {
        el.style.bottom = positionRef.current.bottom + 'px'
        el.style.right = positionRef.current.right + 'px'
        setDockProximity(dockProximityOf(el.getBoundingClientRect()))
      }
    }

    const handleMove = (e: PointerEvent) => {
      const state = stateRef.current
      if (!state || e.pointerId !== state.pointerId) return

      // Pre-arm: cheap inline checks
      if (!state.armed) {
        const dx = e.clientX - state.startX
        const dy = e.clientY - state.startY

        if (state.mode === 'dock') {
          // Peel off on clear upward drag (not sideways/down)
          if (-dy > PEEL_OUT_PX && -dy > Math.abs(dx)) {
            peelOffFromDock(state, e.clientX, e.clientY)
          } else if (Math.abs(dx) > PEEL_OUT_PX || dy > LONG_PRESS_MOVE_TOLERANCE) {
            resetGesture()
          }
        } else if (Math.abs(dx) > LONG_PRESS_MOVE_TOLERANCE || Math.abs(dy) > LONG_PRESS_MOVE_TOLERANCE) {
          resetGesture()
        }
        return
      }

      if (state.mode !== 'float') return

      e.preventDefault()
      pending = { x: e.clientX, y: e.clientY }
      raf ??= requestAnimationFrame(flush)
    }

    const handleUp = (e: PointerEvent) => {
      const state = stateRef.current
      if (!state || e.pointerId !== state.pointerId) return

      cancelRaf()

      if (state.armed && state.mode === 'float') {
        const el = rootRef.current
        const rect = el?.getBoundingClientRect()
        if (rect && dockProximityOf(rect) >= 1) {
          setPoppedOut(false)
        }
      }

      resetGesture()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    return () => {
      cancelRaf()
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [peelOffFromDock, resetGesture])

  useEffect(() => clearTimer, [clearTimer])

  // ── Escape to dock ──
  useEffect(() => {
    if (!poppedOut) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setPoppedOut(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [poppedOut])

  const togglePopout = useCallback(() => {
    if (poppedOut) {
      setPoppedOut(false)
    } else {
      positionRef.current = { bottom: 100, right: 40 }
      setPoppedOut(true)
    }
  }, [poppedOut])

  return {
    poppedOut,
    dockProximity,
    dragging: dragActive,
    position: positionRef.current,
    setPoppedOut,
    togglePopout,
    onPointerDown,
    rootRef,
  }
}
