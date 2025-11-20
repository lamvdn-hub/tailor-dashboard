import { AlertCircle } from 'lucide-react';
import { Input } from './Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { MeasurementDefinition } from '../lib/supabase';

interface MeasurementValue {
  definitionId: string;
  leftCm?: number | null;
  rightCm?: number | null;
  unitCm?: number | null;
}

interface MeasurementTableProps {
  definitions: MeasurementDefinition[];
  values: MeasurementValue[];
  isEditing: boolean;
  onValueChange: (definitionId: string, field: 'leftCm' | 'rightCm' | 'unitCm', value: string) => void;
  onBlur?: (definitionId: string) => void;
}

export function MeasurementTable({
  definitions,
  values,
  isEditing,
  onValueChange,
  onBlur,
}: MeasurementTableProps) {
  function getValue(definitionId: string): MeasurementValue {
    return values.find(v => v.definitionId === definitionId) || {
      definitionId,
      leftCm: null,
      rightCm: null,
      unitCm: null,
    };
  }

  function calculateDiff(definitionId: string): number | null {
    const value = getValue(definitionId);
    const left = value.leftCm ?? null;
    const right = value.rightCm ?? null;

    if (left === null || right === null) return null;
    return Math.abs(left - right);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Measurement Name</TableHead>
          {definitions.some(d => d.mode === 'paired') ? (
            <>
              <TableHead className="w-1/4">Left (cm)</TableHead>
              <TableHead className="w-1/4">Right (cm)</TableHead>
              <TableHead className="w-1/6">Diff (cm)</TableHead>
            </>
          ) : (
            <TableHead className="w-2/3">Total (cm)</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {definitions.map((definition) => {
          const value = getValue(definition.id);
          const diff = definition.mode === 'paired' ? calculateDiff(definition.id) : null;
          const hasWarning = diff !== null && diff > 2;

          if (definition.mode === 'paired') {
            return (
              <TableRow key={definition.id}>
                <TableCell className="font-medium">{definition.name}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={value.leftCm?.toString() || ''}
                      onChange={(e) => onValueChange(definition.id, 'leftCm', e.target.value)}
                      onBlur={() => onBlur?.(definition.id)}
                      placeholder="0.0"
                      className="w-full"
                    />
                  ) : (
                    <span>{value.leftCm ?? '-'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={value.rightCm?.toString() || ''}
                      onChange={(e) => onValueChange(definition.id, 'rightCm', e.target.value)}
                      onBlur={() => onBlur?.(definition.id)}
                      placeholder="0.0"
                      className="w-full"
                    />
                  ) : (
                    <span>{value.rightCm ?? '-'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {diff !== null && (
                    <span className={`flex items-center gap-1 ${hasWarning ? 'text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded' : 'text-gray-600 dark:text-gray-400'}`}>
                      {hasWarning && <AlertCircle className="w-4 h-4" />}
                      {diff.toFixed(1)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          } else {
            return (
              <TableRow key={definition.id}>
                <TableCell className="font-medium">{definition.name}</TableCell>
                <TableCell colSpan={3}>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={value.unitCm?.toString() || ''}
                      onChange={(e) => onValueChange(definition.id, 'unitCm', e.target.value)}
                      onBlur={() => onBlur?.(definition.id)}
                      placeholder="0.0"
                      className="w-full max-w-xs"
                    />
                  ) : (
                    <span>{value.unitCm ?? '-'}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          }
        })}
      </TableBody>
    </Table>
  );
}
