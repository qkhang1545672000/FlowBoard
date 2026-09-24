import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { UserRole } from 'src/shared/types/user-role.enum';
import { Column, DeleteDateColumn, Entity } from 'typeorm';

@Entity()
export class User extends BaseUuidEntity {
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @Column({ type: 'text', nullable: true })
  gender: string | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
