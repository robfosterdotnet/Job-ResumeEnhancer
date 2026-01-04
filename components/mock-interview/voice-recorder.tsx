"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
  className?: string
}

type RecordingState = "idle" | "listening" | "processing"

// Check for browser support
const isSpeechRecognitionSupported = () => {
  if (typeof window === "undefined") return false
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
}

export function VoiceRecorder({
  onTranscript,
  isDisabled = false,
  className,
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [interimTranscript, setInterimTranscript] = useState("")
  // Check support on each render (browser APIs only available client-side)
  const isSupported = isSpeechRecognitionSupported()
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startRecording = useCallback(() => {
    if (!isSupported || isDisabled) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setRecordingState("listening")
      setInterimTranscript("")
    }

    recognition.onresult = (event) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (final) {
        onTranscript(final)
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setRecordingState("idle")
      setInterimTranscript("")
    }

    recognition.onend = () => {
      setRecordingState("idle")
      setInterimTranscript("")
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, isDisabled, onTranscript])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setRecordingState("idle")
    setInterimTranscript("")
  }, [])

  const toggleRecording = useCallback(() => {
    if (recordingState === "listening") {
      stopRecording()
    } else {
      startRecording()
    }
  }, [recordingState, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!isSupported) {
    return (
      <div className={className}>
        <Button variant="outline" disabled title="Voice input not supported in this browser">
          <MicOff className="h-4 w-4 mr-2" />
          Voice not supported
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          variant={recordingState === "listening" ? "destructive" : "outline"}
          onClick={toggleRecording}
          disabled={isDisabled}
          className="relative"
        >
          {recordingState === "listening" ? (
            <>
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <MicOff className="h-4 w-4 mr-2" />
              Stop Recording
            </>
          ) : recordingState === "processing" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {recordingState === "listening" && interimTranscript && (
        <p className="mt-2 text-sm text-muted-foreground italic">
          {interimTranscript}
        </p>
      )}
    </div>
  )
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}
