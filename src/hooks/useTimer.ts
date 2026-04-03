import { useEffect, useState } from 'react'
import * as realtimeLib from '../lib/realtime'

export function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    try {
      const unsub = realtimeLib.onSessionEvent('round_tick', (evt: unknown) => {
        const event = evt as { secondsRemaining: number } | null
        if (event?.secondsRemaining !== undefined) {
          setSeconds(event.secondsRemaining)
        }
      })

      return () => {
        unsub()
      }
    } catch (err) {
      console.error('Timer sync error:', err)
      return undefined
    }
  }, [])

  const start = (duration: number) => {
    setSeconds(duration)
    setIsRunning(true)
  }

  const pause = () => {
    setIsRunning(false)
  }

  const reset = () => {
    setSeconds(0)
    setIsRunning(false)
  }

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
  }
}
