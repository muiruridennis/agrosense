import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVaccinationCoverage1786377203765 implements MigrationInterface {
    name = 'AddVaccinationCoverage1786377203765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vaccination_records" DROP COLUMN "dose"`);
        await queryRunner.query(`ALTER TABLE "vaccination_records" ADD "dose" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vaccination_records" DROP COLUMN "dose"`);
        await queryRunner.query(`ALTER TABLE "vaccination_records" ADD "dose" numeric(10,3)`);
    }

}
