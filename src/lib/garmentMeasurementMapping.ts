export interface GarmentMeasurementMapping {
  diagramPointId: string;
  definitionName: string;
  section: 'jacket' | 'trousers';
  isPaired: boolean;
}

export const GARMENT_MEASUREMENT_MAPPINGS: GarmentMeasurementMapping[] = [
  { diagramPointId: 'chest', definitionName: 'Chest', section: 'jacket', isPaired: false },
  { diagramPointId: 'waist', definitionName: 'Waist', section: 'jacket', isPaired: false },
  { diagramPointId: 'hip', definitionName: 'Seat/Hip', section: 'jacket', isPaired: false },
  { diagramPointId: 'shoulder_width', definitionName: 'Shoulder Width', section: 'jacket', isPaired: false },
  { diagramPointId: 'back_length', definitionName: 'Back Length', section: 'jacket', isPaired: false },
  { diagramPointId: 'front_length', definitionName: 'Front Length', section: 'jacket', isPaired: false },
  { diagramPointId: 'sleeve_length', definitionName: 'Sleeve Length', section: 'jacket', isPaired: true },
  { diagramPointId: 'arm_circumference', definitionName: 'Bicep Circumference', section: 'jacket', isPaired: true },
  { diagramPointId: 'wrist', definitionName: 'Cuff Circumference', section: 'jacket', isPaired: false },
  { diagramPointId: 'waist', definitionName: 'Waist', section: 'trousers', isPaired: false },
  { diagramPointId: 'hip', definitionName: 'Seat/Hip', section: 'trousers', isPaired: false },
  { diagramPointId: 'inseam', definitionName: 'Inseam', section: 'trousers', isPaired: true },
  { diagramPointId: 'outseam', definitionName: 'Outseam', section: 'trousers', isPaired: true },
  { diagramPointId: 'thigh', definitionName: 'Thigh', section: 'trousers', isPaired: true },
  { diagramPointId: 'knee', definitionName: 'Knee', section: 'trousers', isPaired: true },
];

export type GarmentType = 'jacket' | 'trousers' | 'suit';

export function getMappingsForGarment(garmentType: GarmentType): GarmentMeasurementMapping[] {
  if (garmentType === 'suit') {
    return GARMENT_MEASUREMENT_MAPPINGS;
  }
  return GARMENT_MEASUREMENT_MAPPINGS.filter(m => m.section === garmentType);
}

export function getDiagramPointIdsForGarment(garmentType: GarmentType): Set<string> {
  const mappings = getMappingsForGarment(garmentType);
  return new Set(mappings.map(m => m.diagramPointId));
}

export function getMappingForPoint(pointId: string, section: 'jacket' | 'trousers'): GarmentMeasurementMapping | undefined {
  return GARMENT_MEASUREMENT_MAPPINGS.find(m => m.diagramPointId === pointId && m.section === section);
}

export function getAllMappingsForPoint(pointId: string, garmentType: GarmentType): GarmentMeasurementMapping[] {
  const mappings = getMappingsForGarment(garmentType);
  return mappings.filter(m => m.diagramPointId === pointId);
}
