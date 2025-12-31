import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Check, AlertTriangle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BodyDiagram } from '../components/BodyDiagram';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase, MeasurementDefinition } from '../lib/supabase';
import {
  MEASUREMENT_POINTS,
  MeasurementPoint,
  isValueOutOfRange,
} from '../lib/bodyMeasurements';
import {
  GarmentType,
  getDiagramPointIdsForGarment,
  getAllMappingsForPoint,
} from '../lib/garmentMeasurementMapping';
import { generateDisplayId, normalizeDisplayId } from '../lib/displayIdUtils';

interface ClientInfo {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
}

interface SessionInfo {
  garment_type: GarmentType;
  client: ClientInfo;
}

interface StoredMeasurement {
  id: string;
  measurement_definition_id: string;
  measurement_name: string;
  unit_cm: number | null;
  section: string;
}

interface DiagramCategory {
  id: string;
  name: string;
  points: MeasurementPoint[];
}

interface DraftSessionData {
  clientId: string;
  serviceType: 'MTM' | 'Bespoke';
  garmentType: 'jacket' | 'trousers' | 'suit';
  fabricId: string;
  styleNotes: string;
  clientRequests: string;
  adjustmentRemarks: string;
  suitType?: string;
  lapelType?: string;
  buttonType?: string;
  ventType?: string;
  jacketNotes?: string;
  trousersNotes?: string;
}

interface DraftMeasurement {
  definitionId: string;
  measurementName: string;
  value: number;
  section: string;
}

export function VisualMeasurements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toasts, showToast, removeToast } = useToast();

  const isDraftMode = location.state?.draftMode === true;
  const draftSessionData = location.state?.sessionData as DraftSessionData | undefined;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [definitions, setDefinitions] = useState<MeasurementDefinition[]>([]);
  const [storedMeasurements, setStoredMeasurements] = useState<StoredMeasurement[]>([]);
  const [draftMeasurements, setDraftMeasurements] = useState<DraftMeasurement[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['torso']));
  const [inputValue, setInputValue] = useState('');
  const [inputValueRight, setInputValueRight] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filteredPoints, setFilteredPoints] = useState<MeasurementPoint[]>([]);
  const [categories, setCategories] = useState<DiagramCategory[]>([]);

  useEffect(() => {
    if (isDraftMode && draftSessionData) {
      loadDraftSession();
    } else if (sessionId) {
      loadSessionData();
    }
  }, [sessionId, isDraftMode]);

  useEffect(() => {
    if (session) {
      const validPointIds = getDiagramPointIdsForGarment(session.garment_type);
      const points = MEASUREMENT_POINTS.filter(p => validPointIds.has(p.id));
      setFilteredPoints(points);

      const categoryMap = new Map<string, MeasurementPoint[]>();
      points.forEach(point => {
        const existing = categoryMap.get(point.category) || [];
        existing.push(point);
        categoryMap.set(point.category, existing);
      });

      const categoryNames: Record<string, string> = {
        torso: 'Torso',
        arms: 'Arms',
        legs: 'Legs',
        other: 'Other',
      };

      const cats: DiagramCategory[] = [];
      ['torso', 'arms', 'legs', 'other'].forEach(catId => {
        const catPoints = categoryMap.get(catId);
        if (catPoints && catPoints.length > 0) {
          cats.push({
            id: catId,
            name: categoryNames[catId],
            points: catPoints,
          });
        }
      });
      setCategories(cats);
    }
  }, [session]);

  async function loadDraftSession() {
    if (!draftSessionData) return;

    setLoading(true);

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, first_name, last_name')
      .eq('id', draftSessionData.clientId)
      .maybeSingle();

    if (clientError || !clientData) {
      showToast('Failed to load client', 'error');
      setLoading(false);
      return;
    }

    setSession({
      garment_type: draftSessionData.garmentType as GarmentType,
      client: clientData as ClientInfo,
    });

    const { data: defsData } = await supabase
      .from('measurement_definitions')
      .select('*')
      .order('section')
      .order('order_index');

    if (defsData) {
      setDefinitions(defsData);
    }

    setLoading(false);
  }

  async function loadSessionData() {
    if (!sessionId) return;

    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('garment_type, client:clients(id, name, first_name, last_name)')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !sessionData) {
      showToast('Failed to load session', 'error');
      setLoading(false);
      return;
    }

    const clientData = sessionData.client as ClientInfo;
    setSession({
      garment_type: sessionData.garment_type as GarmentType,
      client: clientData,
    });

    const { data: defsData } = await supabase
      .from('measurement_definitions')
      .select('*')
      .order('section')
      .order('order_index');

    if (defsData) {
      setDefinitions(defsData);
    }

    const { data: measurementsData } = await supabase
      .from('measurements')
      .select('id, measurement_definition_id, measurement_name, unit_cm, section')
      .eq('session_id', sessionId);

    if (measurementsData) {
      setStoredMeasurements(measurementsData as StoredMeasurement[]);
    }

    setLoading(false);
  }

  function getDefinitionForMapping(definitionName: string, section: string): MeasurementDefinition | undefined {
    return definitions.find(d => d.name === definitionName && d.section === section);
  }

  function getStoredValueForDefinition(definitionId: string, suffix?: 'L' | 'R'): StoredMeasurement | undefined {
    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) return undefined;

    const measurementName = suffix ? `${definition.name} (${suffix})` : definition.name;

    if (isDraftMode) {
      const draftValue = draftMeasurements.find(m => m.measurementName === measurementName);
      if (draftValue) {
        return {
          id: draftValue.definitionId,
          measurement_definition_id: draftValue.definitionId,
          measurement_name: draftValue.measurementName,
          unit_cm: draftValue.value,
          section: draftValue.section,
        };
      }
      return undefined;
    }

    if (suffix) {
      return storedMeasurements.find(m => m.measurement_name === measurementName);
    }

    return storedMeasurements.find(m =>
      m.measurement_definition_id === definitionId || m.measurement_name === definition.name
    );
  }

  function isPointCompleted(pointId: string): boolean {
    if (!session) return false;
    const mappings = getAllMappingsForPoint(pointId, session.garment_type);

    for (const mapping of mappings) {
      const definition = getDefinitionForMapping(mapping.definitionName, mapping.section);
      if (!definition) continue;

      if (mapping.isPaired) {
        const leftVal = getStoredValueForDefinition(definition.id, 'L');
        const rightVal = getStoredValueForDefinition(definition.id, 'R');
        if (leftVal?.unit_cm != null || rightVal?.unit_cm != null) return true;
      } else {
        const val = getStoredValueForDefinition(definition.id);
        if (val?.unit_cm != null) return true;
      }
    }
    return false;
  }

  function getCurrentValueForPoint(pointId: string): { left?: number; right?: number; single?: number } {
    if (!session) return {};
    const mappings = getAllMappingsForPoint(pointId, session.garment_type);

    for (const mapping of mappings) {
      const definition = getDefinitionForMapping(mapping.definitionName, mapping.section);
      if (!definition) continue;

      if (mapping.isPaired) {
        const leftVal = getStoredValueForDefinition(definition.id, 'L');
        const rightVal = getStoredValueForDefinition(definition.id, 'R');
        return {
          left: leftVal?.unit_cm ?? undefined,
          right: rightVal?.unit_cm ?? undefined,
        };
      } else {
        const val = getStoredValueForDefinition(definition.id);
        return { single: val?.unit_cm ?? undefined };
      }
    }
    return {};
  }

  function isPairedMeasurement(pointId: string): boolean {
    if (!session) return false;
    const mappings = getAllMappingsForPoint(pointId, session.garment_type);
    return mappings.some(m => m.isPaired);
  }

  function handleSelectPoint(point: MeasurementPoint) {
    setSelectedPoint(point);
    const values = getCurrentValueForPoint(point.id);
    if (isPairedMeasurement(point.id)) {
      setInputValue(values.left?.toString() || '');
      setInputValueRight(values.right?.toString() || '');
    } else {
      setInputValue(values.single?.toString() || '');
      setInputValueRight('');
    }
  }

  async function handleSaveMeasurement() {
    if (!selectedPoint || !session) return;

    const mappings = getAllMappingsForPoint(selectedPoint.id, session.garment_type);
    if (mappings.length === 0) {
      showToast('No mapping found for this measurement', 'error');
      return;
    }

    setSaving(true);

    if (isDraftMode) {
      for (const mapping of mappings) {
        const definition = getDefinitionForMapping(mapping.definitionName, mapping.section);
        if (!definition) continue;

        if (mapping.isPaired) {
          const leftValue = inputValue ? parseFloat(inputValue) : null;
          const rightValue = inputValueRight ? parseFloat(inputValueRight) : null;

          if (leftValue !== null) {
            saveDraftMeasurementValue(definition, leftValue, 'L', mapping.section);
          }
          if (rightValue !== null) {
            saveDraftMeasurementValue(definition, rightValue, 'R', mapping.section);
          }
        } else {
          const value = inputValue ? parseFloat(inputValue) : null;
          if (value !== null) {
            saveDraftMeasurementValue(definition, value, undefined, mapping.section);
          }
        }
      }

      showToast('Measurement saved', 'success');
      setSaving(false);
      return;
    }

    if (!sessionId) return;

    for (const mapping of mappings) {
      const definition = getDefinitionForMapping(mapping.definitionName, mapping.section);
      if (!definition) continue;

      if (mapping.isPaired) {
        const leftValue = inputValue ? parseFloat(inputValue) : null;
        const rightValue = inputValueRight ? parseFloat(inputValueRight) : null;

        if (leftValue !== null) {
          await saveMeasurementValue(definition, leftValue, 'L', mapping.section);
        }
        if (rightValue !== null) {
          await saveMeasurementValue(definition, rightValue, 'R', mapping.section);
        }
      } else {
        const value = inputValue ? parseFloat(inputValue) : null;
        if (value !== null) {
          await saveMeasurementValue(definition, value, undefined, mapping.section);
        }
      }
    }

    const { data: updatedMeasurements } = await supabase
      .from('measurements')
      .select('id, measurement_definition_id, measurement_name, unit_cm, section')
      .eq('session_id', sessionId);

    if (updatedMeasurements) {
      setStoredMeasurements(updatedMeasurements as StoredMeasurement[]);
    }

    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    showToast('Measurement saved', 'success');
    setSaving(false);
  }

  function saveDraftMeasurementValue(
    definition: MeasurementDefinition,
    value: number,
    suffix: 'L' | 'R' | undefined,
    section: string
  ) {
    const measurementName = suffix ? `${definition.name} (${suffix})` : definition.name;

    setDraftMeasurements(prev => {
      const existing = prev.find(m => m.measurementName === measurementName);
      if (existing) {
        return prev.map(m =>
          m.measurementName === measurementName
            ? { ...m, value }
            : m
        );
      }
      return [...prev, {
        definitionId: definition.id,
        measurementName,
        value,
        section,
      }];
    });
  }

  async function saveMeasurementValue(
    definition: MeasurementDefinition,
    value: number,
    suffix: 'L' | 'R' | undefined,
    section: string
  ) {
    const measurementName = suffix ? `${definition.name} (${suffix})` : definition.name;
    const existing = storedMeasurements.find(m => m.measurement_name === measurementName);

    if (existing) {
      await supabase
        .from('measurements')
        .update({ unit_cm: value })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('measurements')
        .insert({
          session_id: sessionId,
          measurement_definition_id: definition.id,
          measurement_name: measurementName,
          unit_cm: value,
          section: section,
        });
    }
  }

  async function handleSaveSession() {
    if (!isDraftMode || !draftSessionData) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('User not authenticated', 'error');
        setSaving(false);
        return;
      }

      let displayId: string;
      try {
        displayId = await generateDisplayId(user.id);
      } catch (error) {
        showToast('Failed to generate order number', 'error');
        setSaving(false);
        return;
      }

      const sessionInsert: any = {
        client_id: draftSessionData.clientId,
        service_type: draftSessionData.serviceType,
        garment_type: draftSessionData.garmentType,
        fabric_id: draftSessionData.fabricId || null,
        style_notes: draftSessionData.styleNotes || null,
        client_requests: draftSessionData.clientRequests || null,
        adjustment_remarks: draftSessionData.adjustmentRemarks || null,
        display_id: displayId,
        display_id_normalized: normalizeDisplayId(displayId),
      };

      if (draftSessionData.garmentType === 'suit') {
        sessionInsert.suit_type = draftSessionData.suitType || null;
        sessionInsert.lapel_type = draftSessionData.lapelType || null;
        sessionInsert.button_type = draftSessionData.buttonType || null;
        sessionInsert.vent_type = draftSessionData.ventType || null;
        sessionInsert.jacket_notes = draftSessionData.jacketNotes || null;
        sessionInsert.trousers_notes = draftSessionData.trousersNotes || null;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionInsert)
        .select()
        .single();

      if (sessionError || !sessionData) {
        showToast('Failed to create session', 'error');
        setSaving(false);
        return;
      }

      if (draftMeasurements.length > 0) {
        const measurementRows = draftMeasurements.map(m => ({
          session_id: sessionData.id,
          measurement_definition_id: m.definitionId,
          measurement_name: m.measurementName,
          unit_cm: m.value,
          section: m.section,
        }));

        const { error: measurementError } = await supabase
          .from('measurements')
          .insert(measurementRows);

        if (measurementError) {
          console.error('Failed to save measurements:', measurementError);
          showToast('Failed to save measurements', 'error');
          setSaving(false);
          return;
        }
      }

      showToast('Session saved successfully', 'success');
      setSaving(false);
      navigate(`/sessions/${sessionData.id}`);
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('Failed to save session', 'error');
      setSaving(false);
    }
  }

  function handleNavigate(direction: 'prev' | 'next') {
    if (!selectedPoint) return;

    const currentIndex = filteredPoints.findIndex(p => p.id === selectedPoint.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < filteredPoints.length) {
      handleSelectPoint(filteredPoints[newIndex]);
    }
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  const completedIds = new Set(filteredPoints.filter(p => isPointCompleted(p.id)).map(p => p.id));
  const completedCount = completedIds.size;
  const totalCount = filteredPoints.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const currentIndex = selectedPoint
    ? filteredPoints.findIndex(p => p.id === selectedPoint.id)
    : -1;
  const isFirstPoint = currentIndex === 0;
  const isLastPoint = currentIndex === filteredPoints.length - 1;

  const showWarning = selectedPoint && inputValue && !isNaN(parseFloat(inputValue)) && isValueOutOfRange(selectedPoint.id, parseFloat(inputValue));
  const isPaired = selectedPoint ? isPairedMeasurement(selectedPoint.id) : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const clientDisplayName = session?.client?.first_name && session?.client?.last_name
    ? `${session.client.first_name} ${session.client.last_name}`
    : session?.client?.name || 'Unknown';

  const garmentLabel = session?.garment_type === 'suit' ? 'Suit' : session?.garment_type === 'jacket' ? 'Jacket' : 'Trousers';

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(isDraftMode ? '/sessions/new' : `/sessions/${sessionId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Body Measurements</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {clientDisplayName} - {garmentLabel}
              {isDraftMode && <span className="ml-2 text-amber-600 dark:text-amber-400">(Draft)</span>}
            </p>
          </div>
        </div>
        {isDraftMode && (
          <Button onClick={handleSaveSession} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving Session...' : 'Save Session'}
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount} of {totalCount} measurements completed
          </span>
          <span className="text-sm font-medium text-[#506B4D] dark:text-[#7ba76a]">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#506B4D] dark:bg-[#7ba76a] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Measurement Points
            </h2>
            <BodyDiagram
              selectedId={selectedPoint?.id || null}
              completedIds={completedIds}
              onSelectPoint={handleSelectPoint}
              visiblePointIds={new Set(filteredPoints.map(p => p.id))}
              garmentType={session?.garment_type || 'suit'}
            />
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Categories
            </h3>
            <div className="space-y-2">
              {categories.map(category => {
                const isExpanded = expandedCategories.has(category.id);
                const completedInCategory = category.points.filter(p => completedIds.has(p.id)).length;

                return (
                  <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {completedInCategory} / {category.points.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-2 space-y-1">
                        {category.points.map(point => {
                          const isCompleted = completedIds.has(point.id);
                          const isSelected = selectedPoint?.id === point.id;
                          const values = getCurrentValueForPoint(point.id);
                          const displayValue = isPairedMeasurement(point.id)
                            ? values.left != null && values.right != null
                              ? `L: ${values.left} / R: ${values.right}`
                              : values.left != null
                                ? `L: ${values.left}`
                                : values.right != null
                                  ? `R: ${values.right}`
                                  : ''
                            : values.single != null
                              ? `${values.single}`
                              : '';

                          return (
                            <button
                              key={point.id}
                              onClick={() => handleSelectPoint(point)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition ${
                                isSelected
                                  ? 'bg-[#506B4D]/10 dark:bg-[#506B4D]/20'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? 'bg-green-500'
                                  : 'bg-gray-200 dark:bg-gray-600'
                              }`}>
                                {isCompleted && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${
                                isCompleted
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {point.name}
                              </span>
                              {displayValue && (
                                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                                  {displayValue} {point.unit}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-6 sticky top-6">
            {selectedPoint ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-[#506B4D] dark:bg-[#7ba76a] text-white flex items-center justify-center text-sm font-bold">
                      {currentIndex + 1}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedPoint.name}
                    </h2>
                  </div>
                  {completedIds.has(selectedPoint.id) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
                      <Check className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    How to Measure
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {selectedPoint.instruction}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Measurement Value {isPaired && '(Left / Right)'}
                  </label>

                  {isPaired ? (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Left</label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`${selectedPoint.minValue}-${selectedPoint.maxValue}`}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            {selectedPoint.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Right</label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            value={inputValueRight}
                            onChange={(e) => setInputValueRight(e.target.value)}
                            placeholder={`${selectedPoint.minValue}-${selectedPoint.maxValue}`}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            {selectedPoint.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={`Enter value (${selectedPoint.minValue}-${selectedPoint.maxValue})`}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                          {selectedPoint.unit}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleSaveMeasurement} disabled={saving || (!inputValue && !inputValueRight)}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>

                  {showWarning && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Unusual value detected
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Please verify this measurement is correct. Expected range: {selectedPoint.minValue}-{selectedPoint.maxValue} {selectedPoint.unit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => handleNavigate('prev')}
                    disabled={isFirstPoint}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentIndex + 1} of {totalCount}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => handleNavigate('next')}
                    disabled={isLastPoint}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-400">?</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Measurement Point
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Click on a numbered point on the body diagram or select from the category list to begin taking measurements.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
