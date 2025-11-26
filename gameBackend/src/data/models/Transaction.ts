import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
  @Column({ default: "" })
  transactionDigest!: string;
  @Column({ default: "" })
  gameObjectId!: string;
  @Column()
  isValid!: boolean;
  @Column()
    owner!: string;
    @Column()
    amount!: number;
}
