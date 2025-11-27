import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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
    @ManyToOne(() => Player, { cascade: true, eager: true })
    winner?: Player;
    @Column({default:false})
    isStaked!: boolean;
    @Column({ default: false })
    isValidForPayment!: boolean;
    @Column({ default: false })
    isPaid!: boolean;

    @Column({ nullable: true })
    paymentTx?: string;

    @Column({ nullable: true })
    paidAt?: Date;
}   