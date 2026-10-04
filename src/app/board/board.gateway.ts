// 1. IMPORT CÁC DECORATOR VÀ INTERFACE TỪ MÔ-ĐUN WEBSOCKET CỦA NESTJS
import {
  WebSocketGateway, // Decorator đánh dấu class này là một WebSocket Gateway
  SubscribeMessage, // Decorator dùng để đăng ký handler lắng nghe sự kiện cụ thể từ client
  MessageBody, // Decorator để lấy dữ liệu (payload) gửi kèm từ client
  ConnectedSocket, // Decorator để lấy instance của Socket (client) đang kết nối
  WebSocketServer, // Decorator để inject server Socket.io vào Gateway
  OnGatewayConnection, // Interface định nghĩa hàm chạy khi có client mới kết nối
  OnGatewayDisconnect, // Interface định nghĩa hàm chạy khi có client ngắt kết nối
} from '@nestjs/websockets';

// 2. IMPORT CÁC CLASS TỪ THƯ VIỆN SOCKET.IO ĐỂ ĐỊNH KIỂU TYPESCRIPT
import { Server, Socket } from 'socket.io';

// 3. CẤU HÌNH GATEWAY
@WebSocketGateway({
  cors: {
    origin: '*', // Cấu hình CORS: Cho phép tất cả các nguồn (domain) kết nối.
    // Trong môi trường Production, nên đổi thành URL Next.js cụ thể (ví dụ: 'http://localhost:3000')
  },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Inject WebSocket Server instance (Socket.io Server) để phát tin nhắn tới toàn hệ thống/room
  @WebSocketServer()
  server: Server;

  // 4. BẮT SỰ KIỆN CLIENT KẾT NỐI (Chạy tự động nhờ triển khai OnGatewayConnection)
  handleConnection(client: Socket) {
    console.log(`Client đã kết nối: ${client.id}`);
  }

  // 5. BẮT SỰ KIỆN CLIENT NGẮT KẾT NỐI (Chạy tự động nhờ triển khai OnGatewayDisconnect)
  handleDisconnect(client: Socket) {
    console.log(`Client đã ngắt kết nối: ${client.id}`);
  }

  // 6. XỬ LÝ SỰ KIỆN CLIENT THAM GIA VÀO BOARD ('join-board')
  @SubscribeMessage('join-board')
  handleJoinBoard(
    @MessageBody() boardId: string, // Lấy boardId gửi từ client
    @ConnectedSocket() client: Socket, // Lấy socket của client vừa gửi yêu cầu
  ) {
    const roomName = `board:${boardId}`; // Tạo tên room dạng chuỗi, ví dụ: "board:123"
    client.join(roomName); // Thêm client này vào room tương ứng
    console.log(`Client ${client.id} đã vào room: ${roomName}`);
  }

  // 7. XỬ LÝ SỰ KIỆN CLIENT RỜI KHỎI BOARD ('leave-board')
  @SubscribeMessage('leave-board')
  handleLeaveBoard(
    @MessageBody() boardId: string, // Lấy boardId từ client
    @ConnectedSocket() client: Socket, // Lấy socket của client
  ) {
    const roomName = `board:${boardId}`; // Xác định tên room
    client.leave(roomName); // Đưa client ra khỏi room
    console.log(`Client ${client.id} đã rời room: ${roomName}`);
  }

  // 8. XỬ LÝ SỰ KIỆN TẠO CỘT MỚI ('create-column') -> MỚI THÊM VÀO
  @SubscribeMessage('create-column')
  handleCreateColumn(
    @MessageBody()
    payload: {
      boardId: string;
      newColumn: any; // Hoặc dùng Column interface của bạn để định kiểu chuẩn
    },
    @ConnectedSocket() client: Socket, // Socket của người vừa bấm tạo cột
  ) {
    const roomName = `board:${payload.boardId}`;

    // Broadcast sự kiện 'column-created' đến TẤT CẢ các client khác trong room (trừ chính người vừa tạo)
    client.to(roomName).emit('column-created', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      newColumn: payload.newColumn,
    });
  }

  // 9. XỬ LÝ SỰ KIỆN DI CHUYỂN TASK ('move-task')
  @SubscribeMessage('move-task')
  handleMoveTask(
    @MessageBody()
    payload: {
      boardId: string;
      activeId: string;
      columnId: string;
      position: number;
    },
    @ConnectedSocket() client: Socket, // Socket của người gửi (người thực hiện kéo thả)
  ) {
    const roomName = `board:${payload.boardId}`;

    // Broadcast sự kiện 'task-moved' cùng payload tới TẤT CẢ các client khác trong room
    client.to(roomName).emit('task-moved', payload);
  }

  // 10. XỬ LÝ SỰ KIỆN DI CHUYỂN CỘT / COLUMN ('move-column')
  @SubscribeMessage('move-column')
  handleMoveColumn(
    @MessageBody()
    payload: {
      boardId: string;
      columns: any[];
    },
    @ConnectedSocket() client: Socket, // Socket của người vừa chuyển vị trí cột
  ) {
    const roomName = `board:${payload.boardId}`;

    // Broadcast sự kiện 'column-moved' tới tất cả người dùng còn lại trong room
    client.to(roomName).emit('column-moved', payload);
  }

  // XỬ LÝ SỰ KIỆN XÓA CỘT ('delete-column')
  @SubscribeMessage('delete-column')
  handleDeleteColumn(
    @MessageBody()
    payload: {
      boardId: string;
      columnId: string;
    },
    @ConnectedSocket() client: Socket, // Socket của người vừa bấm xóa cột
  ) {
    const roomName = `board:${payload.boardId}`;

    // Broadcast sự kiện 'column-deleted' đến TẤT CẢ các client khác trong room (trừ chính người vừa xóa)
    client.to(roomName).emit('column-deleted', {
      columnId: payload.columnId,
    });
  }
}
