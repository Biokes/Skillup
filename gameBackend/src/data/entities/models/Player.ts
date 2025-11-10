import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, } from "typeorm";
import { Stats } from './Stats';

@Entity()
export class Player {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ default: "", nullable: true })
  username: string;
  @Column({ unique: true, nullable: false })
  walletAddress: string;
  @Column({ nullable: true })
  avatarURL: string;
  @OneToOne(() => Stats, { cascade: true, eager: true })
  @JoinColumn()
  stats: Stats;
}
