import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
  @Column({ type: "varchar", length: 6, nullable: true })
  roomCode?: string;
  @Column({default:'WAITING'})
  status!: string;
  @Column({default:false})
  isStaked!: boolean;
  @Column({ nullable: true })
  player1?: string;
  @Column({ nullable: true })
  player2?: string;
  @Column({ type: 'bigint', default:'0'})
  amount!: string;
  @Column({ nullable: true })
  gameObjectId?: string
}
