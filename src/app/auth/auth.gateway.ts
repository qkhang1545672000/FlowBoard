/* eslint-disable @typescript-eslint/no-explicit-any */
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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/auth',
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private socketUserMap = new Map<string, string>(); // socketId -> userId
  private disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Hàm kiểm tra xem một user có đang online thực sự qua WebSocket hay không
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  handleConnection(client: Socket) {
    console.log(`[AuthGateway] Client đã kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[AuthGateway] Client đã ngắt kết nối: ${client.id}`);

    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;

    // Xóa socket cụ thể này ra khỏi map của client
    this.socketUserMap.delete(client.id);
    const sockets = this.userSockets.get(userId);

    if (sockets) {
      sockets.delete(client.id);

      // 🛡️ CHỈ KHI NÀO user thực sự không còn bất kỳ tab/kết nối socket nào nữa mới bắt đầu tính giờ offline
      if (sockets.size === 0) {
        // Xóa timeout cũ nếu có
        if (this.disconnectTimeouts.has(userId)) {
          clearTimeout(this.disconnectTimeouts.get(userId));
        }

        const timeout = setTimeout(() => {
          // Kiểm tra lại lần cuối: Nếu trong 3 giây này mà user đã mở lại socket mới thì hủy bỏ lệnh offline
          const currentSockets = this.userSockets.get(userId);
          if (!currentSockets || currentSockets.size === 0) {
            this.userSockets.delete(userId);
            this.server.emit('user-status-changed', {
              userId,
              isOnline: false,
            });
            console.log(
              `[AuthGateway] User ${userId} đã OFFLINE thực sự sau thời gian chờ`,
            );
          }
          this.disconnectTimeouts.delete(userId);
        }, 3000); // 3 giây chờ chuyển trang

        this.disconnectTimeouts.set(userId, timeout);
      }
    }
  }

  @SubscribeMessage('user-online')
  handleUserOnline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!userId) return;

    // 🛡️ CỰC KỲ QUAN TRỌNG: Khi nhận được tín hiệu online, HỦY NGAY LẬP TỨC mọi lệnh chờ offline đang chạy!
    if (this.disconnectTimeouts.has(userId)) {
      clearTimeout(this.disconnectTimeouts.get(userId));
      this.disconnectTimeouts.delete(userId);
      console.log(
        `[AuthGateway] Hủy lệnh offline cho User ${userId} vì đã có socket mới online`,
      );
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    this.userSockets.get(userId)!.add(client.id);
    this.socketUserMap.set(client.id, userId);

    console.log(
      `[AuthGateway] Nhận tín hiệu USER-ONLINE cho ID: ${userId} (Socket: ${client.id})`,
    );

    // Gửi sự kiện online tới toàn bộ client
    this.server.emit('user-status-changed', {
      userId,
      isOnline: true,
    });
  }

  @SubscribeMessage('user-offline')
  handleUserOffline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!userId) return;

    if (this.disconnectTimeouts.has(userId)) {
      clearTimeout(this.disconnectTimeouts.get(userId));
      this.disconnectTimeouts.delete(userId);
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
    }
    this.socketUserMap.delete(client.id);

    if (!sockets || sockets.size === 0) {
      this.userSockets.delete(userId);
      this.server.emit('user-status-changed', {
        userId,
        isOnline: false,
      });
      console.log(`[AuthGateway] User ${userId} chủ động gửi tín hiệu OFFLINE`);
    }
  }
}
