import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Board } from './board.entity';
import { User } from 'src/app/user/entities/user.entity';

@Entity('activity_logs')
export class ActivityLog extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text' })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;
}
