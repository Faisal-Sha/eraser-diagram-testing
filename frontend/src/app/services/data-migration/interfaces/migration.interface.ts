export type VersionFormat = `${number}.${number}.${number}`;

export interface Migration {
  version: VersionFormat;
  migrate: (data: any) => any;
}