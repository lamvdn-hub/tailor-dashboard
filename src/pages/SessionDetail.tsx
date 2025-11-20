import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MobileSelect } from '../components/MobileSelect';
import { MeasurementTable } from '../components/MeasurementTable';
import { Textarea } from '../components/Textarea';
import { SuitConfiguration } from '../components/SuitConfiguration';
import { supabase, Session, Client, MeasurementDefinition } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';

interface SessionWithClient extends Session {
  client: Client;
  fabric?: { name: string } | null;
}

interface MeasurementValue {
  definitionId: string;
  measurementId?: string;
  leftMeasurementId?: string;
  rightMeasurementId?: string;
  leftCm?: number | null;
  rightCm?: number | null;
  unitCm?: number | null;
}

export function SessionDetail() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionWithClient | null>(null);
  const [jacketDefinitions, setJacketDefinitions] = useState<MeasurementDefinition[]>([]);
  const [trousersDefinitions, setTrousersDefinitions] = useState<MeasurementDefinition[]>([]);
  const [jacketValues, setJacketValues] = useState<MeasurementValue[]>([]);
  const [trousersValues, setTrousersValues] = useState<MeasurementValue[]>([]);
  const [jacketValuesBackup, setJacketValuesBackup] = useState<MeasurementValue[]>([]);
  const [trousersValuesBackup, setTrousersValuesBackup] = useState<MeasurementValue[]>([]);
  const [isEditingJacket, setIsEditingJacket] = useState(false);
  const [isEditingTrousers, setIsEditingTrousers] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingSuitConfig, setIsEditingSuitConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingJacket, setSavingJacket] = useState(false);
  const [savingTrousers, setSavingTrousers] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingSuitConfig, setSavingSuitConfig] = useState(false);
  const [notesData, setNotesData] = useState({
    style_notes: '',
    client_requests: '',
    adjustment_remarks: '',
    jacket_notes: '',
    trousers_notes: '',
  });
  const [suitConfigData, setSuitConfigData] = useState({
    suit_type: '',
    lapel_type: '',
    button_type: '',
    vent_type: '',
  });

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  async function loadSessionData() {
    if (!sessionId) return;

    setLoading(true);
    await refreshSessionData();
    setLoading(false);
  }

  async function refreshSessionData() {
    if (!sessionId) return;
    const [sessionRes, measurementsRes, defsRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, client:clients(*), fabric:fabrics(name)')
        .eq('id', sessionId)
        .maybeSingle(),
      supabase
        .from('measurements')
        .select('*')
        .eq('session_id', sessionId)
        .order('section')
        .order('measurement_name'),
      supabase
        .from('measurement_definitions')
        .select('*')
        .order('section')
        .order('order_index'),
    ]);

    if (sessionRes.data) {
      setSession(sessionRes.data as SessionWithClient);
      setNotesData({
        style_notes: sessionRes.data.style_notes || '',
        client_requests: sessionRes.data.client_requests || '',
        adjustment_remarks: sessionRes.data.adjustment_remarks || '',
        jacket_notes: sessionRes.data.jacket_notes || '',
        trousers_notes: sessionRes.data.trousers_notes || '',
      });
      setSuitConfigData({
        suit_type: sessionRes.data.suit_type || '',
        lapel_type: sessionRes.data.lapel_type || '',
        button_type: sessionRes.data.button_type || '',
        vent_type: sessionRes.data.vent_type || '',
      });
    }

    if (defsRes.data) {
      const jacketDefs = defsRes.data.filter(d => d.section === 'jacket');
      const trousersDefs = defsRes.data.filter(d => d.section === 'trousers');

      setJacketDefinitions(jacketDefs);
      setTrousersDefinitions(trousersDefs);

      if (measurementsRes.data) {
        const jacketMeasurements = measurementsRes.data.filter(m => m.section === 'jacket');
        const trousersMeasurements = measurementsRes.data.filter(m => m.section === 'trousers');

        const jacketVals = jacketDefs.map(def => {
          if (def.mode === 'paired') {
            const leftMeasurement = jacketMeasurements.find(
              m => m.measurement_name === `${def.name} (L)`
            );
            const rightMeasurement = jacketMeasurements.find(
              m => m.measurement_name === `${def.name} (R)`
            );
            return {
              definitionId: def.id,
              leftMeasurementId: leftMeasurement?.id,
              rightMeasurementId: rightMeasurement?.id,
              leftCm: leftMeasurement?.unit_cm ? Number(leftMeasurement.unit_cm) : null,
              rightCm: rightMeasurement?.unit_cm ? Number(rightMeasurement.unit_cm) : null,
            };
          } else {
            const existing = jacketMeasurements.find(
              m => m.measurement_definition_id === def.id || m.measurement_name === def.name
            );
            return {
              definitionId: def.id,
              measurementId: existing?.id,
              unitCm: existing?.unit_cm ? Number(existing.unit_cm) : null,
            };
          }
        });

        const trousersVals = trousersDefs.map(def => {
          if (def.mode === 'paired') {
            const leftMeasurement = trousersMeasurements.find(
              m => m.measurement_name === `${def.name} (L)`
            );
            const rightMeasurement = trousersMeasurements.find(
              m => m.measurement_name === `${def.name} (R)`
            );
            return {
              definitionId: def.id,
              leftMeasurementId: leftMeasurement?.id,
              rightMeasurementId: rightMeasurement?.id,
              leftCm: leftMeasurement?.unit_cm ? Number(leftMeasurement.unit_cm) : null,
              rightCm: rightMeasurement?.unit_cm ? Number(rightMeasurement.unit_cm) : null,
            };
          } else {
            const existing = trousersMeasurements.find(
              m => m.measurement_definition_id === def.id || m.measurement_name === def.name
            );
            return {
              definitionId: def.id,
              measurementId: existing?.id,
              unitCm: existing?.unit_cm ? Number(existing.unit_cm) : null,
            };
          }
        });

        setJacketValues(jacketVals);
        setTrousersValues(trousersVals);
      }
    }
  }

  function updateJacketValue(definitionId: string, field: 'leftCm' | 'rightCm' | 'unitCm', value: string) {
    setJacketValues(prev =>
      prev.map(v =>
        v.definitionId === definitionId
          ? { ...v, [field]: value ? parseFloat(value) : null }
          : v
      )
    );
  }

  function updateTrousersValue(definitionId: string, field: 'leftCm' | 'rightCm' | 'unitCm', value: string) {
    setTrousersValues(prev =>
      prev.map(v =>
        v.definitionId === definitionId
          ? { ...v, [field]: value ? parseFloat(value) : null }
          : v
      )
    );
  }

  async function handleAutoSave(definitionId: string, section: 'jacket' | 'trousers') {
    const values = section === 'jacket' ? jacketValues : trousersValues;
    const value = values.find(v => v.definitionId === definitionId);

    if (!value) return;

    const definition = (section === 'jacket' ? jacketDefinitions : trousersDefinitions).find(
      d => d.id === definitionId
    );

    if (!definition) return;

    if (definition.mode === 'paired') {
      if (value.leftCm !== null && value.leftCm !== undefined) {
        if (value.leftMeasurementId) {
          await supabase
            .from('measurements')
            .update({ unit_cm: value.leftCm })
            .eq('id', value.leftMeasurementId);
        } else {
          const { data } = await supabase
            .from('measurements')
            .insert({
              session_id: sessionId,
              measurement_definition_id: definitionId,
              measurement_name: `${definition.name} (L)`,
              unit_cm: value.leftCm,
              section: section,
            })
            .select()
            .single();

          if (data) {
            const setter = section === 'jacket' ? setJacketValues : setTrousersValues;
            setter(prev =>
              prev.map(v =>
                v.definitionId === definitionId ? { ...v, leftMeasurementId: data.id } : v
              )
            );
          }
        }
      }

      if (value.rightCm !== null && value.rightCm !== undefined) {
        if (value.rightMeasurementId) {
          await supabase
            .from('measurements')
            .update({ unit_cm: value.rightCm })
            .eq('id', value.rightMeasurementId);
        } else {
          const { data } = await supabase
            .from('measurements')
            .insert({
              session_id: sessionId,
              measurement_definition_id: definitionId,
              measurement_name: `${definition.name} (R)`,
              unit_cm: value.rightCm,
              section: section,
            })
            .select()
            .single();

          if (data) {
            const setter = section === 'jacket' ? setJacketValues : setTrousersValues;
            setter(prev =>
              prev.map(v =>
                v.definitionId === definitionId ? { ...v, rightMeasurementId: data.id } : v
              )
            );
          }
        }
      }
    } else {
      if (value.measurementId) {
        await supabase
          .from('measurements')
          .update({ unit_cm: value.unitCm ?? null })
          .eq('id', value.measurementId);
      } else if (value.unitCm !== null && value.unitCm !== undefined) {
        const { data } = await supabase
          .from('measurements')
          .insert({
            session_id: sessionId,
            measurement_definition_id: definitionId,
            measurement_name: definition.name,
            unit_cm: value.unitCm,
            section: section,
          })
          .select()
          .single();

        if (data) {
          const setter = section === 'jacket' ? setJacketValues : setTrousersValues;
          setter(prev =>
            prev.map(v =>
              v.definitionId === definitionId ? { ...v, measurementId: data.id } : v
            )
          );
        }
      }
    }

    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  function handleStartEditJacket() {
    setJacketValuesBackup(JSON.parse(JSON.stringify(jacketValues)));
    setIsEditingJacket(true);
  }

  function handleCancelJacket() {
    setJacketValues(jacketValuesBackup);
    setIsEditingJacket(false);
  }

  async function handleSaveJacket() {
    setSavingJacket(true);

    for (const value of jacketValues) {
      await handleAutoSave(value.definitionId, 'jacket');
    }

    await refreshSessionData();
    setSavingJacket(false);
    setIsEditingJacket(false);
  }

  function handleStartEditTrousers() {
    setTrousersValuesBackup(JSON.parse(JSON.stringify(trousersValues)));
    setIsEditingTrousers(true);
  }

  function handleCancelTrousers() {
    setTrousersValues(trousersValuesBackup);
    setIsEditingTrousers(false);
  }

  async function handleSaveTrousers() {
    setSavingTrousers(true);

    for (const value of trousersValues) {
      await handleAutoSave(value.definitionId, 'trousers');
    }

    await refreshSessionData();
    setSavingTrousers(false);
    setIsEditingTrousers(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);

    await supabase
      .from('sessions')
      .update({
        style_notes: notesData.style_notes || null,
        client_requests: notesData.client_requests || null,
        adjustment_remarks: notesData.adjustment_remarks || null,
        jacket_notes: notesData.jacket_notes || null,
        trousers_notes: notesData.trousers_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await refreshSessionData();
    setSavingNotes(false);
    setIsEditingNotes(false);
  }

  function updateNoteField(field: keyof typeof notesData, value: string) {
    setNotesData(prev => ({ ...prev, [field]: value }));
  }

  function updateSuitConfigField(field: string, value: string) {
    const fieldMap: { [key: string]: string } = {
      'suitType': 'suit_type',
      'lapelType': 'lapel_type',
      'buttonType': 'button_type',
      'ventType': 'vent_type',
    };
    const mappedField = fieldMap[field] || field;
    setSuitConfigData(prev => ({ ...prev, [mappedField]: value }));
  }

  async function handleSaveSuitConfig() {
    setSavingSuitConfig(true);

    await supabase
      .from('sessions')
      .update({
        suit_type: suitConfigData.suit_type || null,
        lapel_type: suitConfigData.lapel_type || null,
        button_type: suitConfigData.button_type || null,
        vent_type: suitConfigData.vent_type || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    await refreshSessionData();
    setSavingSuitConfig(false);
    setIsEditingSuitConfig(false);
  }

  async function updateStatus(newStatus: 'active' | 'completed' | 'ready') {
    await supabase
      .from('sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    setSession(prev => prev ? { ...prev, status: newStatus } : null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading session details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Session not found</p>
      </div>
    );
  }

  const isSuit = session.garment_type === 'suit';
  const isJacket = session.garment_type === 'jacket';
  const isTrousers = session.garment_type === 'trousers';

  const formatSuitType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/clients/${session.client_id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Details</h1>
      </div>

      <Card>
        <div className="grid grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Client</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {session.client.first_name && session.client.last_name
                ? `${session.client.first_name} ${session.client.last_name}`
                : session.client.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Garment Type</p>
            <p className="text-base font-medium capitalize text-gray-900 dark:text-white">{session.garment_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Fabric</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{session.fabric?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Date</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(session.created_at)}</p>
          </div>
          <div>
            <MobileSelect
              label="Status"
              value={session.status}
              onChange={(value) => updateStatus(value as 'active' | 'completed' | 'ready')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'ready', label: 'Ready for Pickup' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>
        </div>
      </Card>

      {isSuit && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suit Configuration</h2>
            {!isEditingSuitConfig ? (
              <Button onClick={() => setIsEditingSuitConfig(true)}>Edit Suit Config.</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveSuitConfig} disabled={savingSuitConfig}>
                  {savingSuitConfig ? 'Saving...' : 'Done'}
                </Button>
                <Button variant="secondary" onClick={async () => {
                  await refreshSessionData();
                  setIsEditingSuitConfig(false);
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {isEditingSuitConfig ? (
            <SuitConfiguration
              suitType={suitConfigData.suit_type}
              lapelType={suitConfigData.lapel_type}
              buttonType={suitConfigData.button_type}
              ventType={suitConfigData.vent_type}
              onChange={updateSuitConfigField}
            />
          ) : (
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Suit Type</p>
                <p className="text-base font-medium dark:text-white">{session.suit_type ? formatSuitType(session.suit_type) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Lapel Type</p>
                <p className="text-base font-medium capitalize dark:text-white">{session.lapel_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Button Configuration</p>
                <p className="text-base font-medium dark:text-white">{session.button_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Vent Type</p>
                <p className="text-base font-medium capitalize dark:text-white">{session.vent_type || '-'}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {(isSuit || isJacket) && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Jacket Measurements</h2>
            {!isEditingJacket ? (
              <Button onClick={handleStartEditJacket}>Edit Measurements</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveJacket} disabled={savingJacket}>
                  {savingJacket ? 'Saving...' : 'Done'}
                </Button>
                <Button variant="secondary" onClick={handleCancelJacket}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <MeasurementTable
              definitions={jacketDefinitions}
              values={jacketValues}
              isEditing={isEditingJacket}
              onValueChange={updateJacketValue}
              onBlur={() => {}}
            />
          </div>
        </Card>
      )}

      {(isSuit || isTrousers) && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trousers Measurements</h2>
            {!isEditingTrousers ? (
              <Button onClick={handleStartEditTrousers}>Edit Measurements</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveTrousers} disabled={savingTrousers}>
                  {savingTrousers ? 'Saving...' : 'Done'}
                </Button>
                <Button variant="secondary" onClick={handleCancelTrousers}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <MeasurementTable
              definitions={trousersDefinitions}
              values={trousersValues}
              isEditing={isEditingTrousers}
              onValueChange={updateTrousersValue}
              onBlur={() => {}}
            />
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h2>
          {!isEditingNotes ? (
            <Button onClick={() => setIsEditingNotes(true)}>Edit Notes</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving...' : 'Done'}
              </Button>
              <Button variant="secondary" onClick={async () => {
                await refreshSessionData();
                setIsEditingNotes(false);
              }}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isSuit ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#B0B0B0] mb-2">
                  Jacket Notes
                </label>
                {isEditingNotes ? (
                  <Textarea
                    value={notesData.jacket_notes}
                    onChange={(e) => updateNoteField('jacket_notes', e.target.value)}
                    placeholder="Add jacket notes..."
                    rows={3}
                  />
                ) : (
                  <p className="text-base text-gray-900 dark:text-white">
                    {notesData.jacket_notes || (
                      <span className="text-gray-400 dark:text-gray-500 italic">No notes added yet</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#B0B0B0] mb-2">
                  Trousers Notes
                </label>
                {isEditingNotes ? (
                  <Textarea
                    value={notesData.trousers_notes}
                    onChange={(e) => updateNoteField('trousers_notes', e.target.value)}
                    placeholder="Add trousers notes..."
                    rows={3}
                  />
                ) : (
                  <p className="text-base text-gray-900 dark:text-white">
                    {notesData.trousers_notes || (
                      <span className="text-gray-400 dark:text-gray-500 italic">No notes added yet</span>
                    )}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-[#B0B0B0] mb-2">
                Style Notes
              </label>
              {isEditingNotes ? (
                <Textarea
                  value={notesData.style_notes}
                  onChange={(e) => updateNoteField('style_notes', e.target.value)}
                  placeholder="Add style notes..."
                  rows={3}
                />
              ) : (
                <p className="text-base text-gray-900 dark:text-white">
                  {notesData.style_notes || (
                    <span className="text-gray-400 dark:text-gray-500 italic">No notes added yet</span>
                  )}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#B0B0B0] mb-2">
              Client Requests
            </label>
            {isEditingNotes ? (
              <Textarea
                value={notesData.client_requests}
                onChange={(e) => updateNoteField('client_requests', e.target.value)}
                placeholder="Add client requests..."
                rows={3}
              />
            ) : (
              <p className="text-base text-gray-900 dark:text-white">
                {notesData.client_requests || (
                  <span className="text-gray-400 dark:text-gray-500 italic">No notes added yet</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-[#B0B0B0] mb-2">
              Adjustment Remarks
            </label>
            {isEditingNotes ? (
              <Textarea
                value={notesData.adjustment_remarks}
                onChange={(e) => updateNoteField('adjustment_remarks', e.target.value)}
                placeholder="Add adjustment remarks..."
                rows={3}
              />
            ) : (
              <p className="text-base text-gray-900 dark:text-white">
                {notesData.adjustment_remarks || (
                  <span className="text-gray-400 dark:text-gray-500 italic">No notes added yet</span>
                )}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
