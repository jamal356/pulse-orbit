import { useEffect, useRef, useState, useCallback } from 'react'
import type { MediaConnection } from 'peerjs'
import Peer from 'peerjs'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed'

export function useVideo() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [myPeerId, setMyPeerId] = useState<string | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Create peer on mount
  useEffect(() => {
    const id = `peer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const peer = new Peer(id)

    peer.on('open', (peerId) => {
      setMyPeerId(peerId)
    })

    peer.on('call', (call) => {
      // Answer incoming call with local stream
      if (localStreamRef.current) {
        call.answer(localStreamRef.current)
      } else {
        call.answer()
      }
      handleIncomingCall(call)
    })

    peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      setConnectionStatus('failed')
    })

    peerRef.current = peer

    return () => {
      peer.destroy()
      peerRef.current = null
    }
  }, [])

  const handleIncomingCall = useCallback((call: MediaConnection) => {
    callRef.current = call
    setConnectionStatus('connecting')

    call.on('stream', (stream) => {
      setRemoteStream(stream)
      setConnectionStatus('connected')
    })

    call.on('close', () => {
      setRemoteStream(null)
      setConnectionStatus('idle')
    })

    call.on('error', (err) => {
      console.error('Call error:', err)
      setConnectionStatus('failed')
    })
  }, [])

  const startCamera = useCallback(async () => {
    // Try with ideal constraints first, fall back to basic if it fails (mobile compat)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      })
    } catch {
      // Fallback: basic constraints for older/restricted mobile devices
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        })
      } catch {
        // Last resort: video only, no audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }
    }
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }, [])

  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
  }, [])

  const connectToPeer = useCallback((remotePeerId: string) => {
    if (!peerRef.current || !localStreamRef.current) return

    setConnectionStatus('connecting')
    const call = peerRef.current.call(remotePeerId, localStreamRef.current)
    callRef.current = call

    call.on('stream', (stream) => {
      setRemoteStream(stream)
      setConnectionStatus('connected')
    })

    call.on('close', () => {
      setRemoteStream(null)
      setConnectionStatus('idle')
    })

    call.on('error', (err) => {
      console.error('Outgoing call error:', err)
      setConnectionStatus('failed')
    })
  }, [])

  const disconnect = useCallback(() => {
    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }
    setRemoteStream(null)
    setConnectionStatus('idle')
  }, [])

  return {
    localStream,
    remoteStream,
    connectionStatus,
    myPeerId,
    startCamera,
    stopCamera,
    connectToPeer,
    disconnect,
  }
}
