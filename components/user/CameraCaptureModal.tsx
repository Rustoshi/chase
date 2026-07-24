"use client"

import { useEffect, useRef, useState } from "react"
import { X, RefreshCw, Loader2, AlertTriangle } from "lucide-react"

interface Props {
  open:      boolean
  onClose:   () => void
  onCapture: (file: File) => void
}

/**
 * Live camera capture that works on both desktop (webcam) and mobile (device
 * camera) via getUserMedia. Requires a secure context (HTTPS or localhost).
 */
export function CameraCaptureModal({ open, onClose, onCapture }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [error,    setError]    = useState("")
  const [starting, setStarting] = useState(false)

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false

    ;(async () => {
      setError("")
      setStarting(true)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Your browser doesn't support camera access. Please upload from your gallery instead.")
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (err) {
        const msg = err instanceof Error && /denied|permission/i.test(err.message)
          ? "Camera access was blocked. Allow it in your browser settings, or upload from your gallery."
          : (err instanceof Error ? err.message : "Unable to access the camera. Please upload from your gallery instead.")
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setStarting(false)
      }
    })()

    return () => { cancelled = true; stop() }
  }, [open, facingMode])

  function handleClose() { stop(); onClose() }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
      stop()
      onCapture(file)
    }, "image/jpeg", 0.92)
  }

  if (!open) return null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-white text-sm font-medium">Take a photo</span>
        <button onClick={handleClose} className="p-2 text-white/80" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        {error ? (
          <div className="text-center max-w-xs">
            <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <p className="text-white/90 text-sm leading-relaxed">{error}</p>
            <button onClick={handleClose} className="mt-5 text-[13px] font-medium text-white underline">Close</button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-full max-w-full rounded-lg"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
          />
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="flex items-center justify-center gap-10 py-7">
          <button
            onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
            className="flex flex-col items-center gap-1 text-white/80"
            aria-label="Switch camera"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="text-[11px]">Flip</span>
          </button>

          <button
            onClick={capture}
            disabled={starting}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white disabled:opacity-50"
            aria-label="Capture photo"
          >
            {starting
              ? <Loader2 className="h-6 w-6 animate-spin text-black" />
              : <span className="h-14 w-14 rounded-full border-4 border-black/20" />}
          </button>

          {/* Spacer to visually balance the flip button */}
          <span className="w-9" />
        </div>
      )}
    </div>
  )
}
