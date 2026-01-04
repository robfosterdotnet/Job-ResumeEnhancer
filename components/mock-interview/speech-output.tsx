"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface SpeechOutputProps {
  text: string
  autoSpeak?: boolean
  rate?: number
  pitch?: number
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
}

// Check for browser support
const isSpeechSynthesisSupported = () => {
  if (typeof window === "undefined") return false
  return "speechSynthesis" in window
}

export function useSpeechOutput({
  rate = 1,
  pitch = 1,
}: { rate?: number; pitch?: number } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Check support on each render (browser APIs only available client-side)
  const isSupported = isSpeechSynthesisSupported()
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.lang = "en-US"

      // Try to get a natural-sounding voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Natural") ||
            voice.name.includes("Premium") ||
            voice.name.includes("Enhanced"))
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, rate, pitch]
  )

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const toggle = useCallback(
    (text: string) => {
      if (isSpeaking) {
        stop()
      } else {
        speak(text)
      }
    },
    [isSpeaking, speak, stop]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isSupported,
  }
}

export function SpeechOutput({
  text,
  autoSpeak = false,
  rate = 1,
  pitch = 1,
  onSpeakStart,
  onSpeakEnd,
}: SpeechOutputProps) {
  // Check support on each render (browser APIs only available client-side)
  const isSupported = isSpeechSynthesisSupported()
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    if (!isSupported || !autoSpeak || !text || hasSpokenRef.current) return

    // Mark as spoken to prevent re-speaking on re-renders
    hasSpokenRef.current = true

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.lang = "en-US"

    // Try to get a natural-sounding voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Natural") ||
            voice.name.includes("Premium") ||
            voice.name.includes("Enhanced"))
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }

    // Voices might not be loaded yet
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice()
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice
    }

    utterance.onstart = () => onSpeakStart?.()
    utterance.onend = () => onSpeakEnd?.()

    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [isSupported, autoSpeak, text, rate, pitch, onSpeakStart, onSpeakEnd])

  // Reset spoken flag when text changes
  useEffect(() => {
    hasSpokenRef.current = false
  }, [text])

  // This component doesn't render anything
  return null
}
