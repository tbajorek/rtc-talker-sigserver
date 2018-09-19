import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Online {
    @PrimaryGeneratedColumn("uuid")
    id =  undefined;

    @Column("varchar")
    user_id = '';
}