import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Stats {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ default: 0 })
  wins: number;
  @Column({ default: 0 })
  losses: number;
  @Column({ default: 0 })
  gamePlayed: number;
  @Column({ default: 0 })
  winStreak: number;
  @Column({ default: 0 })
  bestStreak: number;
  @Column({ default: 0 })
  rating: number;
  @Column
  recentForm: string[];
}
