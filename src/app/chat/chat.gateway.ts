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
import { WorkspaceService } from '../workspace/workspace.service';

// 1. Mở rộng scope cho phép DIRECT
interface JoinChatRoomPayload {
  scope: 'WORKSPACE' | 'BOARD' | 'TASK' | 'DIRECT';
  targetId: string; // Có thể là workspaceId, boardId, taskId hoặc recipientId (userId của người kia)
}

interface LeaveChatRoomPayload {
  scope: 'WORKSPACE' | 'BOARD' | 'TASK' | 'DIRECT';
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

  constructor(
    private readonly chatService: ChatService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    console.log(
      `[ChatGateway] Client kết nối với ID: ${client.id}, Query userId:`,
      userId,
    );
    if (userId) {
      client.join(`user_${userId}`);
      console.log(`✅ Đã đưa user vào phòng cá nhân: user_${userId}`);
    } else {
      console.log(`❌ KHÔNG TÌM THẤY userId trong query của client!`);
    }
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (payload.dto.scope === 'DIRECT') {
      // ==========================================
      // XỬ LÝ RIÊNG CHO CHAT 1-1 (DIRECT MESSAGE)
      // ==========================================
      const recipientId = payload.dto.recipientId;
      if (!recipientId) return;

      // Gửi đến room cá nhân của người nhận và người gửi để sync realtime giữa các thiết bị
      this.server.to(`user_${recipientId}`).emit('new-message', savedMessage);
      this.server
        .to(`user_${payload.senderId}`)
        .emit('new-message', savedMessage);

      // (Tùy chọn) Gửi thêm thông báo chuông/notification nếu cần
      this.server
        .to(`user_${recipientId}`)
        .emit('new-direct-chat-notification', {
          message: savedMessage,
          senderId: payload.senderId,
        });
    } else {
      // ==========================================
      // XỬ LÝ CHO WORKSPACE / BOARD / TASK CHAT
      // ==========================================
      const targetId =
        payload.dto.taskId || payload.dto.boardId || payload.dto.workspaceId;

      if (!targetId) return;

      const roomName = this.getRoomName(payload.dto.scope, targetId);

      // Broadcast tin nhắn mới tới TẤT CẢ mọi người trong Room chung
      this.server.to(roomName).emit('new-message', savedMessage);

      // Nếu là Workspace, gửi thêm thông báo notification riêng cho từng thành viên
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (payload.dto.scope === 'WORKSPACE') {
        const memberIds: string[] =
          await this.workspaceService.getWorkspaceMemberIds(targetId);

        memberIds.forEach((memberId) => {
          if (memberId !== payload.senderId) {
            this.server
              .to(`user_${memberId}`)
              .emit('new-workspace-chat-notification', {
                workspaceId: targetId,
                message: savedMessage,
                senderId: payload.senderId,
              });
          }
        });
      }
    }
  }
}
