import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { SuitConfiguration } from '../components/SuitConfiguration';
import { MeasurementTable } from '../components/MeasurementTable';
import { supabase, Client, Fabric, MeasurementDefinition } from '../lib/supabase';

interface MeasurementValue {
  definitionId: string;
  leftCm?: number | null;
  rightCm?: number | null;
  unitCm?: number | null;
}

export function NewSession() {
  const navigate = useNavigate();
  const { clientId: initialClientId } = useParams<{ clientId: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [jacketDefinitions, setJacketDefinitions] = useState<MeasurementDefinition[]>([]);
  const [trousersDefinitions, setTrousersDefinitions] = useState<MeasurementDefinition[]>([]);
  const [formData, setFormData] = useState({
    clientId: initialClientId || '',
    serviceType: 'MTM' as 'MTM' | 'Bespoke',
    garmentType: 'jacket' as 'jacket' | 'trousers' | 'suit',
    fabricId: '',
    styleNotes: '',
    clientRequests: '',
    adjustmentRemarks: '',
    suitType: '',
    lapelType: '',
    buttonType: '',
    ventType: '',
    jacketNotes: '',
    trousersNotes: '',
  });
  const [jacketValues, setJacketValues] = useState<MeasurementValue[]>([]);
  const [trousersValues, setTrousersValues] = useState<MeasurementValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clientsRes, fabricsRes, defsRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('fabrics').select('*').eq('status', 'in').order('name'),
      supabase.from('measurement_definitions').select('*').order('section').order('order_index'),
    ]);

    if (clientsRes.data) setClients(clientsRes.data);
    if (fabricsRes.data) setFabrics(fabricsRes.data);

    if (defsRes.data) {
      const jacketDefs = defsRes.data.filter(d => d.section === 'jacket');
      const trousersDefs = defsRes.data.filter(d => d.section === 'trousers');

      setJacketDefinitions(jacketDefs);
      setTrousersDefinitions(trousersDefs);

      setJacketValues(jacketDefs.map(d => ({ definitionId: d.id })));
      setTrousersValues(trousersDefs.map(d => ({ definitionId: d.id })));
    }
  }

  function updateJacketValue(definitionId: string, field: 'leftCm' | 'rightCm' | 'unitCm', value: string) {
    setJacketValues(prev => {
      const existing = prev.find(v => v.definitionId === definitionId);
      if (existing) {
        return prev.map(v =>
          v.definitionId === definitionId
            ? { ...v, [field]: value ? parseFloat(value) : null }
            : v
        );
      }
      return [...prev, { definitionId, [field]: value ? parseFloat(value) : null }];
    });
  }

  function updateTrousersValue(definitionId: string, field: 'leftCm' | 'rightCm' | 'unitCm', value: string) {
    setTrousersValues(prev => {
      const existing = prev.find(v => v.definitionId === definitionId);
      if (existing) {
        return prev.map(v =>
          v.definitionId === definitionId
            ? { ...v, [field]: value ? parseFloat(value) : null }
            : v
        );
      }
      return [...prev, { definitionId, [field]: value ? parseFloat(value) : null }];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.clientId) {
      setErrors({ client: 'Please select a client' });
      return;
    }

    if (formData.garmentType === 'suit' && !formData.suitType) {
      setErrors({ suit: 'Please select a suit type' });
      return;
    }

    setLoading(true);
    setErrors({});

    const sessionInsert: any = {
      client_id: formData.clientId,
      service_type: formData.serviceType,
      garment_type: formData.garmentType,
      fabric_id: formData.fabricId || null,
      style_notes: formData.styleNotes || null,
      client_requests: formData.clientRequests || null,
      adjustment_remarks: formData.adjustmentRemarks || null,
    };

    if (formData.garmentType === 'suit') {
      sessionInsert.suit_type = formData.suitType || null;
      sessionInsert.lapel_type = formData.lapelType || null;
      sessionInsert.button_type = formData.buttonType || null;
      sessionInsert.vent_type = formData.ventType || null;
      sessionInsert.jacket_notes = formData.jacketNotes || null;
      sessionInsert.trousers_notes = formData.trousersNotes || null;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionInsert)
      .select()
      .single();

    if (sessionError || !sessionData) {
      setErrors({ submit: 'Failed to create session' });
      setLoading(false);
      return;
    }

    let measurementRows: any[] = [];

    if (formData.garmentType === 'suit') {
      const jacketRows: any[] = [];
      jacketValues.forEach(v => {
        const definition = jacketDefinitions.find(d => d.id === v.definitionId);
        if (!definition) return;

        if (definition.mode === 'paired') {
          if (v.leftCm !== null && v.leftCm !== undefined) {
            jacketRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (L)`,
              unit_cm: v.leftCm,
              section: 'jacket',
            });
          }
          if (v.rightCm !== null && v.rightCm !== undefined) {
            jacketRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (R)`,
              unit_cm: v.rightCm,
              section: 'jacket',
            });
          }
        } else if (v.unitCm !== null && v.unitCm !== undefined) {
          jacketRows.push({
            session_id: sessionData.id,
            measurement_definition_id: v.definitionId,
            measurement_name: definition.name,
            unit_cm: v.unitCm,
            section: 'jacket',
          });
        }
      });

      const trousersRows: any[] = [];
      trousersValues.forEach(v => {
        const definition = trousersDefinitions.find(d => d.id === v.definitionId);
        if (!definition) return;

        if (definition.mode === 'paired') {
          if (v.leftCm !== null && v.leftCm !== undefined) {
            trousersRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (L)`,
              unit_cm: v.leftCm,
              section: 'trousers',
            });
          }
          if (v.rightCm !== null && v.rightCm !== undefined) {
            trousersRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (R)`,
              unit_cm: v.rightCm,
              section: 'trousers',
            });
          }
        } else if (v.unitCm !== null && v.unitCm !== undefined) {
          trousersRows.push({
            session_id: sessionData.id,
            measurement_definition_id: v.definitionId,
            measurement_name: definition.name,
            unit_cm: v.unitCm,
            section: 'trousers',
          });
        }
      });

      measurementRows = [...jacketRows, ...trousersRows];
    } else if (formData.garmentType === 'jacket') {
      jacketValues.forEach(v => {
        const definition = jacketDefinitions.find(d => d.id === v.definitionId);
        if (!definition) return;

        if (definition.mode === 'paired') {
          if (v.leftCm !== null && v.leftCm !== undefined) {
            measurementRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (L)`,
              unit_cm: v.leftCm,
              section: 'jacket',
            });
          }
          if (v.rightCm !== null && v.rightCm !== undefined) {
            measurementRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (R)`,
              unit_cm: v.rightCm,
              section: 'jacket',
            });
          }
        } else if (v.unitCm !== null && v.unitCm !== undefined) {
          measurementRows.push({
            session_id: sessionData.id,
            measurement_definition_id: v.definitionId,
            measurement_name: definition.name,
            unit_cm: v.unitCm,
            section: 'jacket',
          });
        }
      });
    } else {
      trousersValues.forEach(v => {
        const definition = trousersDefinitions.find(d => d.id === v.definitionId);
        if (!definition) return;

        if (definition.mode === 'paired') {
          if (v.leftCm !== null && v.leftCm !== undefined) {
            measurementRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (L)`,
              unit_cm: v.leftCm,
              section: 'trousers',
            });
          }
          if (v.rightCm !== null && v.rightCm !== undefined) {
            measurementRows.push({
              session_id: sessionData.id,
              measurement_definition_id: v.definitionId,
              measurement_name: `${definition.name} (R)`,
              unit_cm: v.rightCm,
              section: 'trousers',
            });
          }
        } else if (v.unitCm !== null && v.unitCm !== undefined) {
          measurementRows.push({
            session_id: sessionData.id,
            measurement_definition_id: v.definitionId,
            measurement_name: definition.name,
            unit_cm: v.unitCm,
            section: 'trousers',
          });
        }
      });
    }

    if (measurementRows.length > 0) {
      const { error: measurementError } = await supabase.from('measurements').insert(measurementRows);

      if (measurementError) {
        console.error('Failed to save measurements:', measurementError);
        setErrors({ submit: 'Failed to save measurements' });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate(`/sessions/${sessionData.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">New Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Session Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Client *"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              options={[
                { value: '', label: 'Select a client...' },
                ...clients.map(c => ({
                  value: c.id,
                  label: c.first_name && c.last_name
                    ? `${c.first_name} ${c.last_name}`
                    : c.name
                })),
              ]}
              error={errors.client}
              disabled={!!initialClientId}
            />

            <Select
              label="Service Type *"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as 'MTM' | 'Bespoke' })}
              options={[
                { value: 'MTM', label: 'MTM' },
                { value: 'Bespoke', label: 'Bespoke' },
              ]}
            />

            <Select
              label="Garment Type *"
              value={formData.garmentType}
              onChange={(e) => setFormData({ ...formData, garmentType: e.target.value as 'jacket' | 'trousers' | 'suit' })}
              options={[
                { value: 'jacket', label: 'Jacket' },
                { value: 'trousers', label: 'Trousers' },
                { value: 'suit', label: 'Suit' },
              ]}
            />

            <Select
              label="Fabric"
              value={formData.fabricId}
              onChange={(e) => setFormData({ ...formData, fabricId: e.target.value })}
              options={[
                { value: '', label: 'Select a fabric...' },
                ...fabrics.map(f => ({ value: f.id, label: f.name })),
              ]}
            />
          </div>
        </Card>

        {formData.garmentType === 'suit' && (
          <Card>
            <SuitConfiguration
              suitType={formData.suitType}
              lapelType={formData.lapelType}
              buttonType={formData.buttonType}
              ventType={formData.ventType}
              onChange={(field, value) => setFormData({ ...formData, [field]: value })}
            />
            {errors.suit && (
              <p className="text-red-600 text-sm mt-2">{errors.suit}</p>
            )}
          </Card>
        )}

        {formData.garmentType === 'suit' ? (
          <>
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Jacket Measurements</h2>
              <div className="overflow-x-auto">
                <MeasurementTable
                  definitions={jacketDefinitions}
                  values={jacketValues}
                  isEditing={true}
                  onValueChange={updateJacketValue}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Trousers Measurements</h2>
              <div className="overflow-x-auto">
                <MeasurementTable
                  definitions={trousersDefinitions}
                  values={trousersValues}
                  isEditing={true}
                  onValueChange={updateTrousersValue}
                />
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">
              {formData.garmentType === 'jacket' ? 'Jacket' : 'Trousers'} Measurements
            </h2>
            <div className="overflow-x-auto">
              <MeasurementTable
                definitions={formData.garmentType === 'jacket' ? jacketDefinitions : trousersDefinitions}
                values={formData.garmentType === 'jacket' ? jacketValues : trousersValues}
                isEditing={true}
                onValueChange={formData.garmentType === 'jacket' ? updateJacketValue : updateTrousersValue}
              />
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-white">Notes</h2>

          <div className="space-y-4">
            {formData.garmentType === 'suit' ? (
              <>
                <Textarea
                  label="Jacket Notes"
                  value={formData.jacketNotes}
                  onChange={(e) => setFormData({ ...formData, jacketNotes: e.target.value })}
                  placeholder="Style specifications and notes for the jacket..."
                  rows={3}
                />

                <Textarea
                  label="Trousers Notes"
                  value={formData.trousersNotes}
                  onChange={(e) => setFormData({ ...formData, trousersNotes: e.target.value })}
                  placeholder="Style specifications and notes for the trousers..."
                  rows={3}
                />
              </>
            ) : (
              <>
                <Textarea
                  label="Style Notes"
                  value={formData.styleNotes}
                  onChange={(e) => setFormData({ ...formData, styleNotes: e.target.value })}
                  placeholder="Describe the style specifications..."
                  rows={3}
                />
              </>
            )}

            <Textarea
              label="Client Requests"
              value={formData.clientRequests}
              onChange={(e) => setFormData({ ...formData, clientRequests: e.target.value })}
              placeholder="Special requests from the client..."
              rows={3}
            />

            <Textarea
              label="Adjustment Remarks"
              value={formData.adjustmentRemarks}
              onChange={(e) => setFormData({ ...formData, adjustmentRemarks: e.target.value })}
              placeholder="Notes about adjustments or alterations..."
              rows={3}
            />
          </div>
        </Card>

        {errors.submit && (
          <Card className="bg-red-50 border border-red-200">
            <p className="text-red-600">{errors.submit}</p>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Session'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
