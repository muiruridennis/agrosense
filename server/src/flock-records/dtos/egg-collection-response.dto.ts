export class TrayBreakdownDto {
  /** Complete trays of 30 */
  fullTrays!: number;

  /** Eggs left over after forming complete trays — NOT "extra", just not yet a full tray */
  looseEggs!: number;

  /** Ready-to-render sentence, e.g. "328 eggs = 10 trays + 28 loose eggs" */
  display!: string;
}

export class EggCollectionResponseDto {
  id!: string;

  createdAt!: Date;

  updatedAt!: Date;

  flockRecordId!: string;

  morningEggs!: number;

  afternoonEggs!: number;

  eveningEggs!: number;

  totalEggs!: number;

  trayBreakdown!: TrayBreakdownDto;
}