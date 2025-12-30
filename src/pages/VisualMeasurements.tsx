import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Check, AlertTriangle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BodyDiagram } from '../components/BodyDiagram';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import {
  MEASUREMENT_POINTS,
  CATEGORIES,
  MeasurementPoint,
  getMeasurementsByCategory,
  isValueOutOfRange,
} from '../lib/bodyMeasurements';

interface StoredMeasurement {
  id: string;
  measurement_id: string;
  value: number;
}

interface ClientInfo {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
}

export function VisualMeasurements() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toasts, showToast, removeToast } = useToast();

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [storedMeasurements, setStoredMeasurements] = useState<Record<string, StoredMeasurement>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['torso']));
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  async function loadSessionData() {
    if (!sessionId) return;

    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('client_id, client:clients(id, name, first_name, last_name)')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !sessionData) {
      showToast('Failed to load session', 'error');
      setLoading(false);
      return;
    }

    const clientData = sessionData.client as ClientInfo;
    setClient(clientData);

    const { data: measurementsData } = await supabase
      .from('measurements')
      .select('id, measurement_name, unit_cm')
      .eq('session_id', sessionId)
      .like('measurement_name', 'body_%');

    if (measurementsData) {
      const loadedMeasurements: Record<string, number> = {};
      const loadedStoredMeasurements: Record<string, StoredMeasurement> = {};

      measurementsData.forEach(m => {
        const pointId = m.measurement_name.replace('body_', '');
        if (m.unit_cm !== null) {
          loadedMeasurements[pointId] = Number(m.unit_cm);
          loadedStoredMeasurements[pointId] = {
            id: pointId,
            measurement_id: m.id,
            value: Number(m.unit_cm),
          };
        }
      });

      setMeasurements(loadedMeasurements);
      setStoredMeasurements(loadedStoredMeasurements);
    }

    setLoading(false);
  }

  function handleSelectPoint(point: MeasurementPoint) {
    setSelectedPoint(point);
    setInputValue(measurements[point.id]?.toString() || '');
  }

  function handleInputChange(value: string) {
    setInputValue(value);
  }

  async function handleSaveMeasurement() {
    if (!selectedPoint || !sessionId) return;

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue <= 0) {
      showToast('Please enter a valid measurement value', 'error');
      return;
    }

    setSaving(true);

    const measurementName = `body_${selectedPoint.id}`;
    const stored = storedMeasurements[selectedPoint.id];

    if (stored) {
      const { error } = await supabase
        .from('measurements')
        .update({ unit_cm: numValue })
        .eq('id', stored.measurement_id);

      if (error) {
        showToast('Failed to update measurement', 'error');
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('measurements')
        .insert({
          session_id: sessionId,
          measurement_name: measurementName,
          unit_cm: numValue,
          section: selectedPoint.category === 'legs' ? 'trousers' : 'jacket',
        })
        .select()
        .single();

      if (error) {
        showToast('Failed to save measurement', 'error');
        setSaving(false);
        return;
      }

      setStoredMeasurements(prev => ({
        ...prev,
        [selectedPoint.id]: {
          id: selectedPoint.id,
          measurement_id: data.id,
          value: numValue,
        },
      }));
    }

    setMeasurements(prev => ({ ...prev, [selectedPoint.id]: numValue }));
    showToast('Measurement saved', 'success');
    setSaving(false);
  }

  function handleNavigate(direction: 'prev' | 'next') {
    if (!selectedPoint) return;

    const currentIndex = MEASUREMENT_POINTS.findIndex(p => p.id === selectedPoint.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < MEASUREMENT_POINTS.length) {
      handleSelectPoint(MEASUREMENT_POINTS[newIndex]);
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

  const completedCount = Object.keys(measurements).length;
  const totalCount = MEASUREMENT_POINTS.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const completedIds = new Set(Object.keys(measurements));

  function getCategoryCompletedCount(categoryId: string): number {
    const categoryPoints = getMeasurementsByCategory(categoryId);
    return categoryPoints.filter(p => measurements[p.id] !== undefined).length;
  }

  const currentIndex = selectedPoint
    ? MEASUREMENT_POINTS.findIndex(p => p.id === selectedPoint.id)
    : -1;
  const isFirstPoint = currentIndex === 0;
  const isLastPoint = currentIndex === MEASUREMENT_POINTS.length - 1;

  const showWarning = selectedPoint && inputValue && !isNaN(parseFloat(inputValue)) && isValueOutOfRange(selectedPoint.id, parseFloat(inputValue));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const clientDisplayName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}`
    : client?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/sessions/${sessionId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Body Measurements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clientDisplayName}
          </p>
        </div>
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
            />
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Categories
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map(category => {
                const isExpanded = expandedCategories.has(category.id);
                const completedInCategory = getCategoryCompletedCount(category.id);
                const categoryPoints = getMeasurementsByCategory(category.id);

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
                          {completedInCategory} / {category.count}
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
                        {categoryPoints.map(point => {
                          const isCompleted = measurements[point.id] !== undefined;
                          const isSelected = selectedPoint?.id === point.id;

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
                              {isCompleted && (
                                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                                  {measurements[point.id]} {point.unit}
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
                    Measurement Value
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        step="0.1"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={`Enter value (${selectedPoint.minValue}-${selectedPoint.maxValue})`}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        {selectedPoint.unit}
                      </span>
                    </div>
                    <Button onClick={handleSaveMeasurement} disabled={saving || !inputValue}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>

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
