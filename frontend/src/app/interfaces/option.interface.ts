export interface OptionItem {
  label: string;
  value: string | number;
  group?: string;
}

export interface OptionGroup {
  label: string;
  value: string | number;
  items: OptionItem[];
}