export interface MeasurementPoint {
  id: string;
  name: string;
  category: 'torso' | 'arms' | 'legs' | 'other';
  instruction: string;
  x: number;
  y: number;
  minValue: number;
  maxValue: number;
  unit: 'cm' | 'kg';
}

export const MEASUREMENT_POINTS: MeasurementPoint[] = [
  {
    id: 'neck',
    name: 'Neck Circumference',
    category: 'torso',
    instruction: 'Measure around the base of the neck where a shirt collar would sit. Keep the tape snug but not tight, with one finger space for comfort.',
    x: 150,
    y: 62,
    minValue: 30,
    maxValue: 50,
    unit: 'cm',
  },
  {
    id: 'chest',
    name: 'Chest Circumference',
    category: 'torso',
    instruction: 'Measure around the fullest part of the chest, under the arms. Keep the tape parallel to the floor and ensure it passes over the shoulder blades at the back.',
    x: 150,
    y: 115,
    minValue: 70,
    maxValue: 150,
    unit: 'cm',
  },
  {
    id: 'waist',
    name: 'Waist Circumference',
    category: 'torso',
    instruction: 'Measure around the natural waistline, typically the narrowest part of the torso. This is usually about 2-3cm above the navel.',
    x: 150,
    y: 165,
    minValue: 60,
    maxValue: 140,
    unit: 'cm',
  },
  {
    id: 'hip',
    name: 'Hip Circumference',
    category: 'torso',
    instruction: 'Measure around the fullest part of the hips and buttocks. Keep the tape parallel to the floor.',
    x: 150,
    y: 210,
    minValue: 70,
    maxValue: 150,
    unit: 'cm',
  },
  {
    id: 'shoulder_width',
    name: 'Shoulder Width',
    category: 'torso',
    instruction: 'Measure from the edge of one shoulder to the edge of the other, across the back. Find the bony points at the top of each shoulder.',
    x: 150,
    y: 80,
    minValue: 35,
    maxValue: 60,
    unit: 'cm',
  },
  {
    id: 'back_length',
    name: 'Back Length',
    category: 'torso',
    instruction: 'Measure from the prominent bone at the base of the neck (C7 vertebra) straight down to the natural waistline.',
    x: 150,
    y: 140,
    minValue: 40,
    maxValue: 80,
    unit: 'cm',
  },
  {
    id: 'front_length',
    name: 'Front Length',
    category: 'torso',
    instruction: 'Measure from the point where the shoulder meets the neck, over the chest, down to the natural waistline.',
    x: 150,
    y: 130,
    minValue: 40,
    maxValue: 80,
    unit: 'cm',
  },
  {
    id: 'sleeve_length',
    name: 'Sleeve Length',
    category: 'arms',
    instruction: 'Measure from the shoulder point, down the outside of a slightly bent arm, to the wrist bone.',
    x: 75,
    y: 150,
    minValue: 50,
    maxValue: 90,
    unit: 'cm',
  },
  {
    id: 'arm_circumference',
    name: 'Upper Arm Circumference',
    category: 'arms',
    instruction: 'Measure around the fullest part of the upper arm (bicep area), with the arm relaxed at the side.',
    x: 80,
    y: 125,
    minValue: 20,
    maxValue: 50,
    unit: 'cm',
  },
  {
    id: 'forearm',
    name: 'Forearm Circumference',
    category: 'arms',
    instruction: 'Measure around the fullest part of the forearm, below the elbow.',
    x: 70,
    y: 175,
    minValue: 15,
    maxValue: 40,
    unit: 'cm',
  },
  {
    id: 'wrist',
    name: 'Wrist Circumference',
    category: 'arms',
    instruction: 'Measure around the wrist at the wrist bone, where a watch would typically sit.',
    x: 60,
    y: 215,
    minValue: 12,
    maxValue: 25,
    unit: 'cm',
  },
  {
    id: 'inseam',
    name: 'Inseam',
    category: 'legs',
    instruction: 'Measure from the crotch seam down the inside of the leg to the ankle bone. Stand straight with feet slightly apart.',
    x: 130,
    y: 320,
    minValue: 60,
    maxValue: 100,
    unit: 'cm',
  },
  {
    id: 'outseam',
    name: 'Outseam',
    category: 'legs',
    instruction: 'Measure from the natural waistline, down the outside of the leg to the ankle bone.',
    x: 180,
    y: 280,
    minValue: 80,
    maxValue: 120,
    unit: 'cm',
  },
  {
    id: 'thigh',
    name: 'Thigh Circumference',
    category: 'legs',
    instruction: 'Measure around the fullest part of the upper thigh, just below the crotch.',
    x: 125,
    y: 250,
    minValue: 40,
    maxValue: 80,
    unit: 'cm',
  },
  {
    id: 'knee',
    name: 'Knee Circumference',
    category: 'legs',
    instruction: 'Measure around the knee with the leg slightly bent, at the center of the kneecap.',
    x: 125,
    y: 330,
    minValue: 30,
    maxValue: 60,
    unit: 'cm',
  },
  {
    id: 'calf',
    name: 'Calf Circumference',
    category: 'legs',
    instruction: 'Measure around the fullest part of the calf muscle.',
    x: 125,
    y: 380,
    minValue: 25,
    maxValue: 55,
    unit: 'cm',
  },
  {
    id: 'height',
    name: 'Height',
    category: 'other',
    instruction: 'Stand against a wall without shoes. Measure from the floor to the top of the head. Keep posture straight and natural.',
    x: 200,
    y: 50,
    minValue: 140,
    maxValue: 220,
    unit: 'cm',
  },
  {
    id: 'weight',
    name: 'Weight',
    category: 'other',
    instruction: 'Weigh without shoes, in light clothing. For best accuracy, weigh at the same time each day.',
    x: 200,
    y: 420,
    minValue: 40,
    maxValue: 200,
    unit: 'kg',
  },
];

export const CATEGORIES = [
  { id: 'torso', name: 'Torso', count: 7 },
  { id: 'arms', name: 'Arms', count: 4 },
  { id: 'legs', name: 'Legs', count: 5 },
  { id: 'other', name: 'Other', count: 2 },
] as const;

export function getMeasurementsByCategory(category: string): MeasurementPoint[] {
  return MEASUREMENT_POINTS.filter(m => m.category === category);
}

export function getMeasurementById(id: string): MeasurementPoint | undefined {
  return MEASUREMENT_POINTS.find(m => m.id === id);
}

export function isValueOutOfRange(id: string, value: number): boolean {
  const measurement = getMeasurementById(id);
  if (!measurement) return false;
  return value < measurement.minValue || value > measurement.maxValue;
}
