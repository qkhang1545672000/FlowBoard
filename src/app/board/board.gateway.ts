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
import { ColumnLockType } from 'src/shared/types/column-lock-type.enum';
import { string } from 'zod';

interface LockedUser {
  id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface LockTaskPayload {
  boardId: string;
  taskId: string;
  user: LockedUser;
}

interface UnlockTaskPayload {
  boardId: string;
  taskId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Lưu trữ các thẻ đang bị khóa theo dạng: Map<taskId, { userId, socketId, boardId, user }>
  private lockedTasks = new Map<
    string,
    { socketId: string; boardId: string; user: LockedUser }
  >();

  handleConnection(client: Socket) {
    console.log(`Client đã kết nối: ${client.id}`);
  }

  // Tự động dọn dẹp các thẻ bị khóa nếu client ngắt kết nối đột ngột khi đang kéo
  handleDisconnect(client: Socket) {
    console.log(`Client đã ngắt kết nối: ${client.id}`);

    this.lockedTasks.forEach((value, taskId) => {
      if (value.socketId === client.id) {
        this.lockedTasks.delete(taskId);
        const roomName = `board:${value.boardId}`;

        // Thông báo cho toàn bộ client trong room rằng thẻ đã được mở khóa
        this.server.to(roomName).emit('task-unlocked', { taskId });
      }
    });
  }

  @SubscribeMessage('join-board')
  handleJoinBoard(
    @MessageBody() boardId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${boardId}`;
    client.join(roomName);
    console.log(`Client ${client.id} đã vào room: ${roomName}`);
  }

  @SubscribeMessage('leave-board')
  handleLeaveBoard(
    @MessageBody() boardId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${boardId}`;
    client.leave(roomName);
    console.log(`Client ${client.id} đã rời room: ${roomName}`);
  }

  // ==========================================
  // XỬ LÝ KHÓA VÀ MỞ KHÓA THẺ REALTIME
  // ==========================================

  @SubscribeMessage('lock-task')
  handleLockTask(
    @MessageBody() payload: LockTaskPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;

    // Lưu thông tin khóa vào bộ nhớ Server
    this.lockedTasks.set(payload.taskId, {
      socketId: client.id,
      boardId: payload.boardId,
      user: payload.user,
    });

    // Broadcast cho TẤT CẢ các client khác trong room (trừ người đang kéo)
    client.to(roomName).emit('task-locked', {
      taskId: payload.taskId,
      lockedBy: payload.user,
    });
  }

  @SubscribeMessage('unlock-task')
  handleUnlockTask(
    @MessageBody() payload: UnlockTaskPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;

    // Xóa thẻ khỏi danh sách khóa
    this.lockedTasks.delete(payload.taskId);

    // Phát sự kiện mở khóa đến tất cả mọi người trong room
    this.server.to(roomName).emit('task-unlocked', {
      taskId: payload.taskId,
    });
  }

  // ==========================================
  // XỬ LÝ SỰ KIỆN BOARD D&D CŨ
  // ==========================================

  @SubscribeMessage('create-column')
  handleCreateColumn(
    @MessageBody() payload: { boardId: string; newColumn: any },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('column-created', {
      newColumn: payload.newColumn,
    });
  }

  @SubscribeMessage('create-task')
  handleCreateTask(
    @MessageBody() payload: { boardId: string; columnId: string; newTask: any },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('task-created', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      columnId: payload.columnId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      newTask: payload.newTask,
    });
  }

  @SubscribeMessage('typeLock-column')
  handleLockColumn(
    @MessageBody()
    payload: { boardId: string; columnId: string; typeLock: ColumnLockType },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('column-typeLock', {
      columnId: payload.columnId,
      typeLock: payload.typeLock,
    });
  }

  @SubscribeMessage('move-task')
  handleMoveTask(
    @MessageBody()
    payload: {
      boardId: string;
      activeId: string;
      columnId: string;
      position: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('task-moved', payload);
  }

  @SubscribeMessage('move-column')
  handleMoveColumn(
    @MessageBody() payload: { boardId: string; columns: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('column-moved', payload);
  }

  @SubscribeMessage('delete-column')
  handleDeleteColumn(
    @MessageBody() payload: { boardId: string; columnId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `board:${payload.boardId}`;
    client.to(roomName).emit('column-deleted', {
      columnId: payload.columnId,
    });
  }
}
