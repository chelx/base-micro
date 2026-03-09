import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('file_metadata')
export class FileMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  storagePath: string;

  @Column()
  checksum: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
