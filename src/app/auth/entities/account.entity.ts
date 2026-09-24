import { User } from 'src/app/user/entities/user.entity';
import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
@Index(['providerId', 'accountId'], { unique: true })
export class Account extends BaseUuidEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  accountId: string;

  @Column({ type: 'text' })
  providerId: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  accessTokenExpiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  scope: string | null;

  @Column({ type: 'text', nullable: true })
  idToken: string | null;

  @Column({ type: 'text', nullable: true })
  password: string | null;

  //   Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
