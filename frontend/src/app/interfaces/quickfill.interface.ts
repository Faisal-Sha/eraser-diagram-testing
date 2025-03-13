export interface Quickfill {
    usedPresetId: string;
    groups: QuickfillGroup[];
    presets: UserPreset[];
}

export interface QuickfillGroup {
    name: string;
    length: number;
    dn: number;
    s: number;
}

export interface QuickfillPart {
    typeId: string;
    material: string;
    quantity: number;
    active: boolean; 
}

interface BasicPreset {
    id: string;
    parts: QuickfillPart[];
}

export type QuickfillPreset = UserPreset | SystemPreset;

export interface UserPreset extends BasicPreset {
    name: string;
};

export interface SystemPreset extends BasicPreset {
    i18nName: string;
    i18nTooltip: string;
};
