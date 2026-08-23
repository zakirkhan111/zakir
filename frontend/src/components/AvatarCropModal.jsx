import React, { useCallback, useRef, useState } from 'react'
import { X, ZoomIn, Check } from 'lucide-react'

const OUTPUT_SIZE = 320 // px, final exported square avatar

/**
 * Centered modal that lets a user zoom/pan an image inside a strict circular
 * boundary, then exports the cropped result as a File (via canvas) so it can
 * be handed straight to the ImgBB upload handler.
 *
 * Props:
 *  - file: the raw File selected by the user (required to open)
 *  - onClose(): called when the modal should close without saving
 *  - onSet(croppedFile): called with a File once the user clicks "Set"
 */
export default function AvatarCropModal({ file, onClose, onSet }) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imgUrl] = useState(() => URL.createObjectURL(file))
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const stageRef = useRef(null)
  const imgRef = useRef(null)

  const STAGE = 288 // px, visible square stage (circle boundary sits inside it)

  const clampOffset = useCallback((next, z) => {
    // keep the image covering the circle at all times
    const maxPan = (STAGE * (z - 1)) / 2
    return {
      x: Math.max(-maxPan, Math.min(maxPan, next.x)),
      y: Math.max(-maxPan, Math.min(maxPan, next.y)),
    }
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, zoom))
  }
  const onPointerUp = () => { dragging.current = false }

  const onZoomChange = (e) => {
    const z = parseFloat(e.target.value)
    setZoom(z)
    setOffset((prev) => clampOffset(prev, z))
  }

  const handleClose = () => { URL.revokeObjectURL(imgUrl); onClose() }

  const handleSet = () => {
    const img = imgRef.current
    if (!img) return handleClose()

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    // circular clip
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    const scaleStageToOutput = OUTPUT_SIZE / STAGE
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const baseScale = Math.max(STAGE / naturalW, STAGE / naturalH) * zoom
    const drawW = naturalW * baseScale * scaleStageToOutput
    const drawH = naturalH * baseScale * scaleStageToOutput
    const dx = OUTPUT_SIZE / 2 - drawW / 2 + offset.x * scaleStageToOutput
    const dy = OUTPUT_SIZE / 2 - drawH / 2 + offset.y * scaleStageToOutput

    ctx.drawImage(img, dx, dy, drawW, drawH)

    canvas.toBlob((blob) => {
      if (!blob) return handleClose()
      const cropped = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-avatar.png', { type: 'image/png' })
      onSet(cropped)
      URL.revokeObjectURL(imgUrl)
    }, 'image/png', 0.95)
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="card w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Adjust your photo</h2>
          <button type="button" onClick={handleClose} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={stageRef}
          className="relative mx-auto overflow-hidden rounded-2xl bg-gray-900 select-none"
          style={{ width: STAGE, height: STAGE, cursor: dragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={imgUrl}
            draggable={false}
            alt="Avatar to crop"
            className="absolute top-1/2 left-1/2 max-w-none"
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              width: STAGE,
              height: STAGE,
              objectFit: 'cover',
            }}
          />
          {/* circular boundary overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: '0 0 0 9999px rgba(17,24,39,0.72)', borderRadius: '9999px' }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80" />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={onZoomChange} className="w-full accent-brand-600" />
        </div>
        <p className="text-center text-xs text-gray-400">Drag to pan, use the slider to zoom, then set your photo.</p>

        <div className="flex gap-3">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={handleSet} className="btn-primary flex-1"><Check className="h-4 w-4" /> Set</button>
        </div>
      </div>
    </div>
  )
}
