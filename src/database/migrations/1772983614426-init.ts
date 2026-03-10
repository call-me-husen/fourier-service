import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1772983614426 implements MigrationInterface {
  name = 'Init1772983614426';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "phone" character varying, "address" character varying, "emergency_contact" character varying, "emergency_phone" character varying, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "photo" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "date_of_birth" date NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "surename" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "surename"`);
    await queryRunner.query(
      `ALTER TABLE "employees" DROP COLUMN "date_of_birth"`,
    );
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "photo"`);
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "phone" character varying`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
