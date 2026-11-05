import { UnitType } from '../types/floorplan';

export const FEET_TO_METERS = 0.3048;
export const METERS_TO_FEET = 1 / FEET_TO_METERS;

export const convertLength = (val: number, fromUnit: UnitType, toUnit: UnitType): number => {
  if (fromUnit === toUnit) return val;
  if (fromUnit === 'feet' && toUnit === 'meters') return val * FEET_TO_METERS;
  if (fromUnit === 'meters' && toUnit === 'feet') return val * METERS_TO_FEET;
  return val;
};

export const formatLength = (val: number, unit: UnitType, precision = 1): string => {
  const symbol = unit === 'feet' ? 'ft' : 'm';
  return `${val.toFixed(precision)} ${symbol}`;
};

export const formatArea = (val: number, unit: UnitType, precision = 1): string => {
  if (unit === 'feet') {
    return `${val.toFixed(precision)} sq ft`;
  } else {
    // If area was calculated in sq ft, convert to sq m
    const sqMeters = val * 0.092903;
    return `${sqMeters.toFixed(precision)} m²`;
  }
};
