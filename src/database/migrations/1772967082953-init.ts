import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1772967082953 implements MigrationInterface {
  name = 'Init1772967082953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "job_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_647b08f0ec097a17f8fff8adfb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" date NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_40dfddee0c0d7125c767d8962b1" UNIQUE ("date"), CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying, "parent_id" character varying, CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "employee_code" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying, "phone" character varying, "roleId" uuid, "departmentId" uuid, "jobPositionId" uuid, CONSTRAINT "UQ_56162b5f24af743a154680684f5" UNIQUE ("employee_code"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_765bc1ac8967533a04c74a9f6a" ON "employees" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_128e230d6e6d8bc89894856841" ON "employees" ("first_name", "last_name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" date NOT NULL, "clock_in" TIMESTAMP WITH TIME ZONE, "clock_out" TIMESTAMP WITH TIME ZONE, "employeeId" uuid, CONSTRAINT "UQ_1c22de8136d6fe469e9c7512b19" UNIQUE ("employeeId", "date"), CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_24d98872eb52c3edb30ce96c1e9" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_4edfe103ebf2fcb98dbb582554b" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_3671383a43544c974d26aff1f83" FOREIGN KEY ("jobPositionId") REFERENCES "job_positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_4a9f77d05b9c764ff1053401cdd" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_4a9f77d05b9c764ff1053401cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_3671383a43544c974d26aff1f83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_4edfe103ebf2fcb98dbb582554b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_24d98872eb52c3edb30ce96c1e9"`,
    );
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_128e230d6e6d8bc89894856841"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_765bc1ac8967533a04c74a9f6a"`,
    );
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP TABLE "holidays"`);
    await queryRunner.query(`DROP TABLE "job_positions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
