"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import emoji picker to avoid SSR issues
const Picker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
)

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors bg-white dark:bg-gray-800 min-h-[44px]"
      >
        <span className="text-2xl">{value || "😀"}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Click to choose
        </span>
      </button>

      {showPicker && (
        <div className="fixed sm:absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 sm:top-full sm:left-0 mt-2 z-50 max-w-[90vw] sm:max-w-none">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="absolute -top-2 -right-2 min-w-[44px] min-h-[44px] bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs z-10"
              aria-label="Close emoji picker"
            >
              ✕
            </button>
            <Picker
              onEmojiClick={(emojiData) => {
                onChange(emojiData.emoji)
                setShowPicker(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
