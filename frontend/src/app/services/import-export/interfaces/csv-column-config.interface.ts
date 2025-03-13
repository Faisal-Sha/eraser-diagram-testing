import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";

export interface CSVColumnConfig {
  name: string;
  export?: {
    enabled?: (() => Promise<boolean> | boolean) | boolean;
    transform?: (item: ItemPipeFittingEntity, path: string) => Promise<string> | string;
  };
  import?: {
    enabled?: (() => Promise<boolean> | boolean) | boolean;
    transform?: (field: string, value: string | undefined, item: ItemPipeFittingEntity, row: any) => Promise<any> | any;
    required?: (() => Promise<boolean> | boolean) | boolean;
    targetKey?: string;
  };
}