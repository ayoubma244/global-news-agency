/**
 * WebSocket Mini-Service (port 3003)
 * Runs socket.io server for real-time features.
 */

import { createServer } from 'http'
import { Server as IOServer } from 'socket.io'

const PORT = 3003

const httpServer = createServer()
const io = new IOServer(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})

const connectedClients = new Map<string, Set<string>>()

io.on('connection', (socket) => {
  console.log(`[Realtime] Client connected: ${socket.id}`)
  connectedClients.set(socket.id, new Set(['global']))

  socket.on('join_article', (articleId: string) => {
    socket.join(`article:${articleId}`)
    connectedClients.get(socket.id)?.add(`article:${articleId}`)
    const count = io.sockets.adapter.rooms.get(`article:${articleId}`)?.size || 0
    io.to(`article:${articleId}`).emit('visitor_update', { articleId, count })
  })

  socket.on('leave_article', (articleId: string) => {
    socket.leave(`article:${articleId}`)
    connectedClients.get(socket.id)?.delete(`article:${articleId}`)
    const count = io.sockets.adapter.rooms.get(`article:${articleId}`)?.size || 0
    io.to(`article:${articleId}`).emit('visitor_update', { articleId, count })
  })

  socket.on('join_admin', () => {
    socket.join('admin')
  })

  socket.on('new_comment', (data: { articleId: string; comment: any }) => {
    socket.to(`article:${data.articleId}`).emit('new_comment', data.comment)
  })

  socket.on('reaction_update', (data: { articleId: string; type: string; count: number }) => {
    socket.to(`article:${data.articleId}`).emit('reaction_update', data)
  })

  socket.on('disconnect', () => {
    console.log(`[Realtime] Client disconnected: ${socket.id}`)
    const rooms = connectedClients.get(socket.id)
    if (rooms) {
      for (const room of rooms) {
        if (room.startsWith('article:')) {
          const articleId = room.replace('article:', '')
          const count = io.sockets.adapter.rooms.get(room)?.size || 0
          io.to(room).emit('visitor_update', { articleId, count })
        }
      }
    }
    connectedClients.delete(socket.id)
  })
})

// Periodic global visitor count
setInterval(() => {
  io.to('global').emit('visitor_update', { type: 'global', count: connectedClients.size })
}, 5000)

httpServer.listen(PORT, () => {
  console.log(`[Realtime] WebSocket server running on port ${PORT}`)
})
