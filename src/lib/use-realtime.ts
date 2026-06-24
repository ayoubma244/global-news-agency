'use client'

import { useEffect, useState, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })
  }
  return socket
}

/**
 * Hook to get real-time visitor count for an article.
 */
export function useArticleVisitors(articleId: string) {
  const [visitorCount, setVisitorCount] = useState(0)

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      socket.emit('join_article', articleId)
    }

    const onVisitorUpdate = (data: { articleId?: string; count: number }) => {
      if (!data.articleId || data.articleId === articleId) {
        setVisitorCount(data.count)
      }
    }

    if (socket.connected) {
      onConnect()
    } else {
      socket.on('connect', onConnect)
    }
    socket.on('visitor_update', onVisitorUpdate)

    return () => {
      socket.off('connect', onConnect)
      socket.off('visitor_update', onVisitorUpdate)
      socket.emit('leave_article', articleId)
    }
  }, [articleId])

  return visitorCount
}

/**
 * Hook to get global visitor count.
 */
export function useGlobalVisitors() {
  const [visitorCount, setVisitorCount] = useState(0)

  useEffect(() => {
    const socket = getSocket()

    const onVisitorUpdate = (data: { type?: string; count: number }) => {
      if (data.type === 'global') {
        setVisitorCount(data.count)
      }
    }

    socket.on('visitor_update', onVisitorUpdate)

    return () => {
      socket.off('visitor_update', onVisitorUpdate)
    }
  }, [])

  return visitorCount
}

/**
 * Hook to listen for new comments in real-time.
 */
export function useLiveComments(articleId: string, onNewComment: (comment: any) => void) {
  useEffect(() => {
    const socket = getSocket()

    const onNewComment = (comment: any) => {
      if (comment.articleId === articleId) {
        onNewComment(comment)
      }
    }

    socket.on('new_comment', onNewComment)

    return () => {
      socket.off('new_comment', onNewComment)
    }
  }, [articleId, onNewComment])
}

/**
 * Hook to listen for reaction updates.
 */
export function useLiveReactions(articleId: string, onUpdate: (data: { type: string; count: number }) => void) {
  useEffect(() => {
    const socket = getSocket()

    const onReactionUpdate = (data: { articleId: string; type: string; count: number }) => {
      if (data.articleId === articleId) {
        onUpdate(data)
      }
    }

    socket.on('reaction_update', onReactionUpdate)

    return () => {
      socket.off('reaction_update', onReactionUpdate)
    }
  }, [articleId, onUpdate])
}

/**
 * Hook to listen for breaking news.
 */
export function useBreakingNews(onBreakingNews: (article: any) => void) {
  useEffect(() => {
    const socket = getSocket()

    socket.on('breaking_news', onBreakingNews)

    return () => {
      socket.off('breaking_news', onBreakingNews)
    }
  }, [onBreakingNews])
}

/**
 * Emit a new comment to other viewers.
 */
export function emitNewComment(articleId: string, comment: any) {
  const socket = getSocket()
  socket.emit('new_comment', { articleId, comment })
}

/**
 * Emit a reaction update.
 */
export function emitReactionUpdate(articleId: string, type: string, count: number) {
  const socket = getSocket()
  socket.emit('reaction_update', { articleId, type, count })
}
