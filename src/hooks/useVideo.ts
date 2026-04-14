import { useEffect, useRef, useState } from 'react'
import type { MediaConnection } from 'peerjs'
import Peer from 'peerjs'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed'

export function useVideo() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  // Real PeerJS-assigned id, surfaced once the peer's `open` event fires.
  // LiveSession needs this to broadcast it to its partner.
  const [myPeerId, setMyPeerId] = useState<string | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const seedId = `peer-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const peer = new Peer(seedId)

    peer.on('open', (openId) => {
      peerRef.current = peer
      setMyPeerId(openId)
    })

    peer.on('call', (call) => {
      handleIncomingCall(call)
    })

    peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      setConnectionStatus('failed')
    })

    return () => {
      if (callRef.current) {
        callRef.current.close()
      }
      if (peer) {
        peer.destroy()
      }
      setMyPeerId(null)
    }
  }, [])

  const startCamera = async () => {
    try {
      setConnectionStatus('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      localStreamRef.current = stream
      setLocalStream(stream)
      setConnectionStatus('idle')
      return stream
    } catch (err) {
      console.error('Camera access error:', err)
      setConnectionStatus('failed')
      throw err
    }
  }

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
  }

  const connectToPeer = async (remotePeerId: string) => {
    if (!peerRef.current || !localStreamRef.current) {
      throw new Error('Peer or local stream not initialized')
    }

    try {
      setConnectionStatus('connecting')
      const call = peerRef.current.call(remotePeerId, localStreamRef.current)

      call.on('stream', (remoteVideoStream) => {
        setRemoteStream(remoteVideoStream)
        setConnectionStatus('connected')
      })

      call.on('error', (err) => {
        console.error('Call error:', err)
        setConnectionStatus('failed')
      })

      call.on('close', () => {
        setRemoteStream(null)
        setConnectionStatus('idle')
      })

      callRef.current = call
    } catch (err) {
      console.error('Connect to peer error:', err)
      setConnectionStatus('failed')
      throw err
    }
  }

  const handleIncomingCall = (call: MediaConnection) => {
    if (!localStreamRef.current) {
      call.close()
      return
    }

    setConnectionStatus('connecting')
    call.answer(localStreamRef.current)

    call.on('stream', (remoteVideoStream: MediaStream) => {
      setRemoteStream(remoteVideoStream)
      setConnectionStatus('connected')
    })

    call.on('error', (err: Error) => {
      console.error('Incoming call error:', err)
      setConnectionStatus('failed')
    })

    call.on('close', () => {
      setRemoteStream(null)
      setConnectionStatus('idle')
    })

    callRef.current = call
  }

  const disconnect = () => {
    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }
    setRemoteStream(null)
    setConnectionStatus('idle')
  }

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
