import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
// import { CHARS } from "../../utils";


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
  @Column({ default: 0 })
  amount!: number;
}
