export const MATERIAL_TYPE: { [key: string]: string } = { "P235GH": 'N', "P250GH": 'N', "P265GH": 'N', "1.4539": 'S', "1.4571": 'S' };
export const MATERIAL_DENSITY: { [key: string]: number } = { "P235GH": 7.85, "P250GH": 7.85, "P265GH": 7.85, "1.4539": 7.97, "1.4571": 7.97 };
export const MATERIAL_FACTOR: { [key: string]: number } = { "P235GH": 1, "P250GH": 1, "P265GH": 1, "1.4539": 1.6, "1.4571": 1.6 };

/**
 * Retrieves the material type based on the given material key.
 *
 * @param material - The key of the material to retrieve the type for.
 *
 * @returns The material type ('N' or 'S') associated with the given material key.
 *          If the material key is not found in the `MATERIAL_TYPE` object, 'N' is returned by default.
 */
export function getMaterialType(material: string): string {
    return MATERIAL_TYPE[material] || 'N';
}

/**
 * Retrieves an example material key based on the given material type.
 *
 * @param material - The material type ('N' or 'S') to retrieve an example key for.
 *
 * @returns An example material key associated with the given material type, or undefined if no key is found.
 */
export function getMaterialExampleType(material: 'N' | 'S' ): string | undefined {
    return Object.keys(MATERIAL_TYPE).find((key) => MATERIAL_TYPE[key] === material);
}

/**
 * Retrieves the density of a material based on its key.
 *
 * @param material - The key of the material to retrieve the density for.
 *
 * @returns The density of the material associated with the given key.
 *          If the material key is not found in the `MATERIAL_DENSITY` object, 1 is returned by default.
 */
export function getMaterialDensity(material: string): number {
    return MATERIAL_DENSITY[material] || 1;
}

/**
 * Retrieves the factor associated with a material based on its key.
 *
 * @remarks
 * The factor is used in the calculation of pipe properties.
 * If the material key is not found in the `MATERIAL_FACTOR` object, 1 is returned by default.
 *
 * @param material - The key of the material to retrieve the factor for.
 *
 * @returns The factor of the material associated with the given key.
 *          If the material key is not found in the `MATERIAL_FACTOR` object, 1 is returned.
 */
export function getMaterialFactor(material: string): number {
    return MATERIAL_FACTOR[material] || 1;
}
