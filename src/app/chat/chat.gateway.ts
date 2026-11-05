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
      console.log(`✅ Đã đưa user vào phòng: user_${userId}`);
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

    // 2. Xác định targetId tương ứng
    const targetId =
      payload.dto.taskId || payload.dto.boardId || payload.dto.workspaceId;

    if (!targetId) return;

    const roomName = this.getRoomName(payload.dto.scope, targetId);

    // 3. Broadcast tin nhắn mới tới TẤT CẢ mọi người trong Room (bao gồm cả sender để sync)
    this.server.to(roomName).emit('new-message', savedMessage);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (payload.dto.scope === 'WORKSPACE') {
      // Lấy danh sách tất cả các thành viên thuộc workspace này từ Database (qua ChatService)
      // Ví dụ: const memberIds = await this.chatService.getWorkspaceMemberIds(targetId);

      // Tạm thời nếu bạn chưa viết hàm lấy memberIds, bạn có thể truyền qua payload hoặc query DB:
      const memberIds: string[] =
        await this.workspaceService.getWorkspaceMemberIds(targetId);
      console.log('mmmmmmmmmmmmmmsadc', memberIds);
      // Gửi thông báo đến "kênh chung cá nhân" (user_{id}) của TỪNG THÀNH VIÊN
      memberIds.forEach((memberId) => {
        // Không cần gửi thông báo cho chính người gửi
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
