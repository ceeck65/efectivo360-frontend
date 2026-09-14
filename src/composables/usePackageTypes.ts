/**
 * Empaques de compra homologados por tipo de medida del producto.
 *
 * Las claves usan el enum real del backend — GlobalProduct.SaleUnitChoices /
 * Product.sale_unit (apps/products/models.py): PESO, VOLUMEN, UNIDAD. Ninguno
 * de estos valores de empaque (salvo los pocos que coinciden con
 * PurchaseExpressEntryView's KNOWN_BACKEND_PACKAGE_TYPES) existe en el enum
 * estricto `package_type` del backend — todos viajan igual vía el alias de
 * texto libre `purchase_unit_name`, que el backend siempre acepta.
 */

export interface PackageOption {
  label: string;
  value: string;
}

export const PACKAGE_OPTIONS_BY_MEASURE: Record<string, PackageOption[]> = {
  UNIDAD: [
    { label: 'Caja', value: 'CAJA' },
    { label: 'Bulto', value: 'BULTO' },
    { label: 'Paquete', value: 'PAQUETE' },
    { label: 'Unidad Directa', value: 'UNIDAD_DIRECTA' },
  ],
  PESO: [
    { label: 'Saco', value: 'SACO' },
    { label: 'Cesta', value: 'CESTA' },
    { label: 'Bún / Caja', value: 'BUN_CAJA' },
    { label: 'Kg Directo', value: 'KG_DIRECTO' },
  ],
  VOLUMEN: [
    { label: 'Bidón', value: 'BIDON' },
    { label: 'Tambor', value: 'TAMBOR' },
    { label: 'Galón', value: 'GALON' },
    { label: 'Litro Directo', value: 'LITRO_DIRECTO' },
  ],
};

const DIRECT_PACKAGE_BY_MEASURE: Record<string, string> = {
  UNIDAD: 'UNIDAD_DIRECTA',
  PESO: 'KG_DIRECTO',
  VOLUMEN: 'LITRO_DIRECTO',
};

const UNITS_LABEL_BY_MEASURE: Record<string, string> = {
  UNIDAD: 'unidades',
  PESO: 'Kg',
  VOLUMEN: 'Litros',
};

/** Package options valid for a product's measure. Unknown/missing measure falls back to UNIDAD. */
export function packageOptionsFor(saleUnit: string | null | undefined): PackageOption[] {
  return PACKAGE_OPTIONS_BY_MEASURE[saleUnit || ''] || PACKAGE_OPTIONS_BY_MEASURE.UNIDAD;
}

/** The "direct" package (no conversion) for a measure — the sane default when adding a row. */
export function directPackageFor(saleUnit: string | null | undefined): string {
  return DIRECT_PACKAGE_BY_MEASURE[saleUnit || ''] || DIRECT_PACKAGE_BY_MEASURE.UNIDAD;
}

/** Display unit for "Total Unidades" style labels (+X Kg, +X Litros, +X unidades). */
export function unitsLabelFor(saleUnit: string | null | undefined): string {
  return UNITS_LABEL_BY_MEASURE[saleUnit || ''] || UNITS_LABEL_BY_MEASURE.UNIDAD;
}
