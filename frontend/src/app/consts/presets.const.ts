import { SystemPreset } from "../interfaces/quickfill.interface";

export const SYSTEM_PRESETS = [{
  id: 'isbl',
  i18nName: "accordion.parts.preset.isbl",
  i18nTooltip: "accordion.parts.preset.tooltip.isbl",
  parts: [
    { typeId: "1010", material: "P235GH", quantity: 8.5, active: true },
    { typeId: "2110", material: "P235GH", quantity: 3.6, active: true },
    { typeId: "3000", material: "P235GH", quantity: 0.8, active: true },
    { typeId: "7030", material: "P235GH", quantity: 1, active: true },
  ]
},{
  id: 'osbl',
  i18nName: "accordion.parts.preset.osbl",
  i18nTooltip: "accordion.parts.preset.tooltip.osbl",
  parts: [
    { typeId: "1010", material: "P235GH", quantity: 9.5, active: true },
    { typeId: "2110", material: "P235GH", quantity: 1.5, active: true },
    { typeId: "3000", material: "P235GH", quantity: 0.4, active: true },
    { typeId: "7030", material: "P235GH", quantity: 1, active: true },
  ]
}] as SystemPreset[];