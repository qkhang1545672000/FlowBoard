import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Board } from './board.entity';
import { User } from 'src/app/user/entities/user.entity';
import { BoardMemberRole } from 'src/shared/types/BoardMemberRole.enum';

@Entity('board_members')
@Unique(['boardId', 'userId']) // Đảm bảo mỗi user chỉ xuất hiện 1 lần trong 1 board
export class BoardMember extends BaseUuidEntity {
  @Index()
  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: BoardMemberRole,
    default: BoardMemberRole.MEMBER,
  })
  role: BoardMemberRole;
}
