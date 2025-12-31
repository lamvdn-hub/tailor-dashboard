import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clipboard, Check, User } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { SuitConfiguration } from '../components/SuitConfiguration';
import { MeasurementTable } from '../components/MeasurementTable';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase, Client, Fabric, MeasurementDefinition, Measurement } from '../lib/supabase';
import { getMeasurementCategoriesForGarment, normalizeMeasurementName } from '../lib/measurementCategories';
import { formatDate } from '../lib/dateUtils';
import { generateDisplayId, normalizeDisplayId } from '../lib/displayIdUtils';
import PhotoUpload from '../components/PhotoUpload';
import { ProcessedPhoto, cleanupPhotoPreview } from '../lib/imageUtils';

interface MeasurementValue {
  definitionId: string;
  leftCm?: number | null;
  rightCm?: number | null;
  unitCm?: number | null;
}

export function NewSession() {
  const navigate = useNavigate();
  const { clientId: initialClientId } = useParams<{ clientId: string }>();

  const isValidClientId = (id: string | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const validInitialClientId = isValidClientId(initialClientId) ? initialClientId : undefined;

  const [clients, setClients] = useState<Client[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [jacketDefinitions, setJacketDefinitions] = useState<MeasurementDefinition[]>([]);
  const [trousersDefinitions, setTrousersDefinitions] = useState<MeasurementDefinition[]>([]);
  const [formData, setFormData] = useState({
    clientId: validInitialClientId || '',
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
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [measurementInterface, setMeasurementInterface] = useState<'form' | 'guided' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach(photo => cleanupPhotoPreview(photo.preview));
    };
  }, [photos]);

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

  function navigateToGuidedEntry() {
    if (!formData.clientId) {
      showToast('Please select a client first', 'error');
      return;
    }

    if (formData.garmentType === 'suit' && !formData.suitType) {
      showToast('Please select a suit type first', 'error');
      return;
    }

    navigate('/sessions/new/body-measurements', {
      state: {
        draftMode: true,
        sessionData: formData,
      }
    });
  }

  async function handleLoadLatestMeasurements() {
    if (!formData.clientId) {
      showToast('Please select a client first', 'warning');
      return;
    }

    if (!formData.garmentType) {
      showToast('Please select a garment type first', 'warning');
      return;
    }

    const hasExistingValues = [...jacketValues, ...trousersValues].some(
      v => v.leftCm !== null && v.leftCm !== undefined ||
           v.rightCm !== null && v.rightCm !== undefined ||
           v.unitCm !== null && v.unitCm !== undefined
    );

    if (hasExistingValues) {
      const confirmed = window.confirm(
        'Overwrite Existing Measurements?\n\nThis will replace any measurements you\'ve entered. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    setLoadingMeasurements(true);

    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, created_at')
        .eq('client_id', formData.clientId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        showToast('No stored measurements found for this client', 'warning');
        setLoadingMeasurements(false);
        return;
      }

      const latestSessionId = sessionsData[0].id;
      const latestSessionDate = sessionsData[0].created_at;

      const { data: measurementsData, error: measurementsError } = await supabase
        .from('measurements')
        .select('*')
        .eq('session_id', latestSessionId);

      if (measurementsError) throw measurementsError;

      if (!measurementsData || measurementsData.length === 0) {
        showToast('No measurements found in latest session', 'warning');
        setLoadingMeasurements(false);
        return;
      }

      const relevantCategories = getMeasurementCategoriesForGarment(formData.garmentType);
      const filteredMeasurements = measurementsData.filter(m => {
        const normalizedName = normalizeMeasurementName(m.measurement_name);
        return relevantCategories.some(cat =>
          normalizedName.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(normalizedName.toLowerCase())
        );
      });

      if (filteredMeasurements.length === 0) {
        showToast(`No ${formData.garmentType} measurements found. Loaded 0 measurements.`, 'warning');
        setLoadingMeasurements(false);
        return;
      }

      if (formData.garmentType === 'jacket' || formData.garmentType === 'suit') {
        const newJacketValues = jacketDefinitions.map(def => {
          const leftMeasurement = filteredMeasurements.find(
            m => m.measurement_name === `${def.name} (L)`
          );
          const rightMeasurement = filteredMeasurements.find(
            m => m.measurement_name === `${def.name} (R)`
          );
          const singleMeasurement = filteredMeasurements.find(
            m => m.measurement_name === def.name
          );

          if (def.mode === 'paired') {
            return {
              definitionId: def.id,
              leftCm: leftMeasurement?.unit_cm ? Number(leftMeasurement.unit_cm) : null,
              rightCm: rightMeasurement?.unit_cm ? Number(rightMeasurement.unit_cm) : null,
            };
          } else {
            return {
              definitionId: def.id,
              unitCm: singleMeasurement?.unit_cm ? Number(singleMeasurement.unit_cm) : null,
            };
          }
        });
        setJacketValues(newJacketValues);
      }

      if (formData.garmentType === 'trousers' || formData.garmentType === 'suit') {
        const newTrousersValues = trousersDefinitions.map(def => {
          const leftMeasurement = filteredMeasurements.find(
            m => m.measurement_name === `${def.name} (L)`
          );
          const rightMeasurement = filteredMeasurements.find(
            m => m.measurement_name === `${def.name} (R)`
          );
          const singleMeasurement = filteredMeasurements.find(
            m => m.measurement_name === def.name
          );

          if (def.mode === 'paired') {
            return {
              definitionId: def.id,
              leftCm: leftMeasurement?.unit_cm ? Number(leftMeasurement.unit_cm) : null,
              rightCm: rightMeasurement?.unit_cm ? Number(rightMeasurement.unit_cm) : null,
            };
          } else {
            return {
              definitionId: def.id,
              unitCm: singleMeasurement?.unit_cm ? Number(singleMeasurement.unit_cm) : null,
            };
          }
        });
        setTrousersValues(newTrousersValues);
      }

      showToast(`Measurements loaded from ${formatDate(latestSessionDate)}`, 'success');
    } catch (error) {
      console.error('Error loading measurements:', error);
      showToast('Error loading measurements', 'error');
    } finally {
      setLoadingMeasurements(false);
    }
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrors({ submit: 'User not authenticated' });
      setLoading(false);
      return;
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userProfile) {
      console.warn('User profile not found, will use null for uploaded_by');
    }

    let displayId: string;
    try {
      displayId = await generateDisplayId(user.id);
    } catch (error) {
      setErrors({ submit: 'Failed to generate order number' });
      setLoading(false);
      return;
    }

    const sessionInsert: any = {
      client_id: formData.clientId,
      service_type: formData.serviceType,
      garment_type: formData.garmentType,
      fabric_id: formData.fabricId || null,
      style_notes: formData.styleNotes || null,
      client_requests: formData.clientRequests || null,
      adjustment_remarks: formData.adjustmentRemarks || null,
      display_id: displayId,
      display_id_normalized: normalizeDisplayId(displayId),
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

    if (photos.length > 0) {
      console.log(`Starting photo upload for ${photos.length} photo(s)...`);
      setUploadingPhotos(true);
      let uploadedCount = 0;

      try {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          console.log(`Uploading photo ${i + 1}/${photos.length}...`);

          const timestamp = Date.now();
          const randomId = crypto.randomUUID();

          const filePath = `${sessionData.id}/${timestamp}_${randomId}.jpg`;
          console.log('Uploading full-size image to:', filePath);
          console.log('File size:', photo.file.size, 'bytes');

          const { data: fileData, error: fileError } = await supabase.storage
            .from('session_photos')
            .upload(filePath, photo.file, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (fileError) {
            console.error('File upload error:', fileError);
            throw new Error(`Failed to upload image: ${fileError.message}`);
          }

          console.log('Full-size image uploaded successfully:', fileData);

          const thumbPath = `${sessionData.id}/thumb_${timestamp}_${randomId}.jpg`;
          console.log('Uploading thumbnail to:', thumbPath);
          console.log('Thumbnail size:', photo.thumbnail.size, 'bytes');

          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('session_photos')
            .upload(thumbPath, photo.thumbnail, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (thumbError) {
            console.error('Thumbnail upload error:', thumbError);
            throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
          }

          console.log('Thumbnail uploaded successfully:', thumbData);

          console.log('Saving photo metadata to database...');
          const { data: metadataData, error: metadataError } = await supabase
            .from('session_photos')
            .insert({
              session_id: sessionData.id,
              file_path: filePath,
              thumbnail_path: thumbPath,
              file_size: photo.file.size,
              uploaded_by: userProfile?.id || null
            })
            .select();

          if (metadataError) {
            console.error('Metadata save error:', metadataError);
            throw new Error(`Failed to save metadata: ${metadataError.message}`);
          }

          console.log('Metadata saved successfully:', metadataData);
          uploadedCount++;
        }

        console.log(`Successfully uploaded ${uploadedCount} photo(s)`);
        showToast(`${uploadedCount} photo(s) uploaded successfully`, 'success');
      } catch (error) {
        console.error('Error uploading photos:', error);
        showToast(`Photos upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setUploadingPhotos(false);
      }
    } else {
      console.log('No photos to upload');
    }

    setLoading(false);
    navigate(`/sessions/${sessionData.id}`);
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Session</h1>
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
              disabled={!!validInitialClientId}
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

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#506B4D]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#506B4D]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Choose Measurement Entry Method</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select how you want to enter body measurements for this session
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMeasurementInterface('form')}
                className={`p-6 rounded-lg border-2 transition-all text-left cursor-pointer ${
                  measurementInterface === 'form'
                    ? 'border-[#506B4D] bg-[#506B4D]/5 dark:bg-[#506B4D]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#506B4D]/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    measurementInterface === 'form'
                      ? 'bg-[#506B4D] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {measurementInterface === 'form' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Form Entry
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Traditional table-based measurement entry with manual input fields
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMeasurementInterface('guided')}
                disabled={!formData.clientId}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  !formData.clientId
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                } ${
                  measurementInterface === 'guided'
                    ? 'border-[#506B4D] bg-[#506B4D]/5 dark:bg-[#506B4D]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#506B4D]/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    measurementInterface === 'guided'
                      ? 'bg-[#506B4D] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {measurementInterface === 'guided' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">2</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Guided Entry (Visual Diagram)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Interactive body diagram with visual guides and step-by-step instructions
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {measurementInterface === null && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Please select a measurement entry method to continue
                </p>
              </div>
            )}

            {!formData.clientId && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-amber-900 dark:text-amber-300">
                  Please select a client before choosing measurement entry method
                </p>
              </div>
            )}
          </div>
        </Card>

        {measurementInterface === 'form' && (
          <>
            <div className="flex justify-center py-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleLoadLatestMeasurements}
                disabled={loadingMeasurements || !formData.clientId || !formData.garmentType}
                className="w-full sm:w-auto"
              >
                <Clipboard className="w-5 h-5 mr-2" />
                {loadingMeasurements ? 'Loading...' : 'Load from Latest Measurements'}
              </Button>
            </div>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400 -mt-2">
              Loads from latest record - all fields remain editable
            </p>
          </>
        )}

        {measurementInterface === 'form' && (
          <>
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

            <Card>
              <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={5} />
            </Card>

            {uploadingPhotos && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-700 dark:text-blue-300">Uploading photos...</p>
              </Card>
            )}

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
          </>
        )}

        {measurementInterface === 'guided' && (
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={navigateToGuidedEntry}
            >
              Start Visual Measurements
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
