import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Session } from "./Session";
import { Player } from "./Player";

@Entity()
export class Game { 

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @JoinColumn()
    @OneToOne(() => Session, { cascade: true, eager: true })
    session?: Session;

    @JoinColumn()
    @OneToOne(() => Player, { cascade: true, eager: true })
    winner?: Player;
}