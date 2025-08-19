'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'
import { wsEventTarget } from '@/lib/apollo-client'

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [hasBeenConnected, setHasBeenConnected] = useState(false)

  useEffect(() => {
    if (!wsEventTarget) return

    const onConnected = () => {
      setIsConnected(true)
      setHasBeenConnected(true)
    }
    const onClosed = () => {
      setIsConnected(false)
      setHasBeenConnected(true)
    }
    const onError = () => {
      setIsConnected(false)
      setHasBeenConnected(true)
    }

    wsEventTarget.addEventListener('ws:connected', onConnected)
    wsEventTarget.addEventListener('ws:closed', onClosed)
    wsEventTarget.addEventListener('ws:error', onError)

    return () => {
      wsEventTarget?.removeEventListener('ws:connected', onConnected)
      wsEventTarget?.removeEventListener('ws:closed', onClosed)
      wsEventTarget?.removeEventListener('ws:error', onError)
    }
  }, [])

  if (!hasBeenConnected) return null

  return (
    <Badge variant={isConnected ? 'default' : 'destructive'} className="fixed bottom-4 right-4 z-50">
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Live Updates
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  )
}
