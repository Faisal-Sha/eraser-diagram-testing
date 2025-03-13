export interface PipeFittings {
    name: string;
    id: string;
    pipefittingname: string;
    units: string;
    prices: ListCondition[];
}

export interface ListCondition {
    dn1: string | undefined;
    s1: string | undefined;
    dn2: string | undefined;
    s2: string | undefined;
    material: string | undefined;
    delivery: string | undefined;
    installation: string | undefined;
}
