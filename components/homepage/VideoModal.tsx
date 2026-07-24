"use client"

import { useState } from "react"
import { Play } from "lucide-react"

export function VideoModalTrigger() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group inline-flex items-center gap-3 px-6 py-4 text-base font-medium text-white/70 hover:text-white transition-colors duration-200"
      >
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-110 transition-all duration-300">
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        </span>
        See How It Works
      </button>

      {/* Video Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm hero-modal-fade"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-[#0D1F3C] rounded-2xl overflow-hidden hero-modal-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Video placeholder</p>
                <p className="text-white/40 text-sm mt-2">Add your brand video here</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Re-export for backwards compatibility
export { VideoModalTrigger as VideoModal }
