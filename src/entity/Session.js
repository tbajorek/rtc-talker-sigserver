import {Entity, Column, PrimaryGeneratedColumn, PrimaryColumn} from "typeorm";

@Entity()
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id = undefined;

    @Column("varchar")
    user_id = '';

    @Column("varchar")
    token = '';

    @Column("varchar")
    validUntil = '';
}