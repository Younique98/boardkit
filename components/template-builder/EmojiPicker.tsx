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
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors bg-white dark:bg-gray-800"
      >
        <span className="text-2xl">{value || "😀"}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Click to choose
        </span>
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs z-10"
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
