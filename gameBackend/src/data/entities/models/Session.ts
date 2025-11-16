import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Session { 
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column({ type: 'varchar', length: 6, nullable: true })
    roomCode: string
    

}