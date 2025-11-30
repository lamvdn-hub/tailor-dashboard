export const measurementCategories = {
  jacket: [
    'Sleeve Length',
    'Chest',
    'Shoulder Width',
    'Back Length',
    'Jacket Length',
    'Waist',
    'Bicep',
    'Wrist',
    'Neck',
    'Front Length',
  ],
  trousers: [
    'Waist',
    'Inseam',
    'Outseam',
    'Thigh',
    'Knee',
    'Ankle',
    'Hip',
    'Rise',
    'Crotch',
    'Bottom Opening',
  ],
};

export function getMeasurementCategoriesForGarment(garmentType: 'jacket' | 'trousers' | 'suit'): string[] {
  if (garmentType === 'suit') {
    return [...measurementCategories.jacket, ...measurementCategories.trousers];
  }
  return measurementCategories[garmentType] || [];
}

export function normalizeMeasurementName(name: string): string {
  return name.replace(/\s*\((L|R)\)\s*$/i, '').trim();
}
