/**
 * WebSocket Real-time Service
 * - Live visitors counter (updates every 5s)
 * - Live comments (instant appear)
 * - Live reactions (instant counter updates)
 * - Breaking news push
 * - Admin notifications
 */

import { Server as HTTPServer } from 'http'
import { Server as IOServer } from 'socket.io'
import type { NextApiRequest } from 'next'

export interface RealtimeEvent {
  type: 'visitor_update' | 'new_comment' | 'reaction_update' | 'breaking_news' | 'article_published' | 'admin_notification'
  data: any
  room?: string  // articleId, 'global', 'admin'
}

let io: IOServer | null = null

export function initRealtimeServer(server: HTTPServer) {
  if (io) return io

  io = new IOServer(server, {
    path: '/api/realtime',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  // Track connected clients
  const connectedClients = new Map<string, { rooms: Set<string>; sessionId: string }>()

  io.on('connection', (socket) => {
    console.log(`[Realtime] Client connected: ${socket.id}`)
    connectedClients.set(socket.id, { rooms: new Set(['global']), sessionId: socket.handshake.query.sessionId as string || '' })

    // Join article room
    socket.on('join_article', (articleId: string) => {
      socket.join(`article:${articleId}`)
      connectedClients.get(socket.id)?.rooms.add(`article:${articleId}`)
      // Broadcast updated visitor count for this article
      const articleViewers = countClientsInRoom(`article:${articleId}`)
      socket.to(`article:${articleId}`).emit('visitor_update', { articleId, count: articleViewers })
    })

    // Leave article room
    socket.on('leave_article', (articleId: string) => {
      socket.leave(`article:${articleId}`)
      connectedClients.get(socket.id)?.rooms.delete(`article:${articleId}`)
    })

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin')
      connectedClients.get(socket.id)?.rooms.add('admin')
    })

    // Handle new comment (broadcast to article room)
    socket.on('new_comment', (data: { articleId: string; comment: any }) => {
      socket.to(`article:${data.articleId}`).emit('new_comment', data.comment)
    })

    // Handle reaction update
    socket.on('reaction_update', (data: { articleId: string; type: string; count: number }) => {
      socket.to(`article:${data.articleId}`).emit('reaction_update', data)
    })

    // Handle visitor heartbeat
    socket.on('heartbeat', (data: { articleId?: string }) => {
      // Just keep connection alive
    })

    socket.on('disconnect', () => {
      console.log(`[Realtime] Client disconnected: ${socket.id}`)
      const client = connectedClients.get(socket.id)
      if (client) {
        // Update article viewer counts
        for (const room of client.rooms) {
          if (room.startsWith('article:')) {
            const articleId = room.replace('article:', '')
            const count = countClientsInRoom(room)
            socket.to(room).emit('visitor_update', { articleId, count })
          }
        }
      }
      connectedClients.delete(socket.id)
    })
  })

  // Periodic global visitor count broadcast
  setInterval(() => {
    if (io) {
      io.to('global').emit('visitor_update', {
        type: 'global',
        count: connectedClients.size,
      })
    }
  }, 5000)

  return io
}

function countClientsInRoom(room: string): number {
  if (!io) return 0
  const clients = io.sockets.adapter.rooms.get(room)
  return clients?.size || 0
}

export function getIO(): IOServer | null {
  return io
}

/**
 * Broadcast an event to all connected clients or a specific room.
 */
export function broadcastEvent(event: RealtimeEvent) {
  if (!io) return
  if (event.room) {
    io.to(event.room).emit(event.type, event.data)
  } else {
    io.emit(event.type, event.data)
  }
}

/**
 * Broadcast breaking news to all connected clients.
 */
export function broadcastBreakingNews(article: { id: string; titleAr: string; slug: string }) {
  broadcastEvent({
    type: 'breaking_news',
    data: article,
  })
}

/**
 * Broadcast new article published.
 */
export function broadcastArticlePublished(article: { id: string; titleAr: string; slug: string; category?: { nameAr: string; icon: string } }) {
  broadcastEvent({
    type: 'article_published',
    data: article,
  })
}
