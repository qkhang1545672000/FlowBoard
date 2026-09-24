import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Verification extends BaseUuidEntity {
  @Column({ type: 'text' })
  identifier: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
