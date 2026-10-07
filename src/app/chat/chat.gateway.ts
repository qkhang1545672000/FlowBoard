import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

interface JoinChatRoomPayload {
  scope: 'WORKSPACE' | 'BOARD' | 'TASK';
  targetId: string;
}

interface LeaveChatRoomPayload {
  scope: 'WORKSPACE' | 'BOARD' | 'TASK';
  targetId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`[ChatGateway] Client đã kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[ChatGateway] Client đã ngắt kết nối: ${client.id}`);
  }

  /**
   * Helper tạo tên Room đồng nhất theo format: chat:{scope}:{targetId}
   */
  private getRoomName(scope: string, targetId: string): string {
    return `chat:${scope.toLowerCase()}:${targetId}`;
  }

  // ==========================================
  // LẮNG NGHE SỰ KIỆN TỪ CLIENT
  // ==========================================

  @SubscribeMessage('join-chat')
  handleJoinChat(
    @MessageBody() payload: JoinChatRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = this.getRoomName(payload.scope, payload.targetId);
    client.join(roomName);
    console.log(`[ChatGateway] Client ${client.id} vào room: ${roomName}`);
    return { event: 'joined-chat', room: roomName };
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @MessageBody() payload: LeaveChatRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = this.getRoomName(payload.scope, payload.targetId);
    client.leave(roomName);
    console.log(`[ChatGateway] Client ${client.id} rời room: ${roomName}`);
    return { event: 'left-chat', room: roomName };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() payload: { senderId: string; dto: CreateMessageDto },
    @ConnectedSocket() client: Socket,
  ) {
    // 1. Lưu tin nhắn vào Database thông qua ChatService
    const savedMessage = await this.chatService.createMessage(
      payload.senderId,
      payload.dto,
    );

    // 2. Xác định targetId tương ứng
    const targetId =
      payload.dto.taskId || payload.dto.boardId || payload.dto.workspaceId;

    if (!targetId) return;

    const roomName = this.getRoomName(payload.dto.scope, targetId);

    // 3. Broadcast tin nhắn mới tới TẤT CẢ mọi người trong Room (bao gồm cả sender để sync)
    this.server.to(roomName).emit('new-message', savedMessage);
  }
}
