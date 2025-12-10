import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Camera, ZoomIn, Upload, Trash2, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MobileSelect } from '../components/MobileSelect';
import { MeasurementTable } from '../components/MeasurementTable';
import { Textarea } from '../components/Textarea';
import { SuitConfiguration } from '../components/SuitConfiguration';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase, Session, Client, MeasurementDefinition } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';
import { processPhoto, validatePhotoFile } from '../lib/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import Lightbox from '../components/Lightbox';

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

interface SessionPhoto {
  id: string;
  session_id: string;
  file_path: string;
  thumbnail_path: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
  file_url: string;
  thumbnail_url: string;
}

export function SessionDetail() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [showCopied, setShowCopied] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
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
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  function handleCopyOrderId(displayId: string) {
    navigator.clipboard.writeText(displayId);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }

  async function loadSessionData() {
    if (!sessionId) return;

    setLoading(true);
    await refreshSessionData();
    setLoading(false);
  }

  async function refreshSessionData() {
    if (!sessionId) return;

    console.log('Loading session data for:', sessionId);

    const [sessionRes, measurementsRes, defsRes, photosRes] = await Promise.all([
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
      supabase
        .from('session_photos')
        .select('*')
        .eq('session_id', sessionId)
        .order('uploaded_at', { ascending: true }),
    ]);

    console.log('Photos query result:', photosRes);

    if (photosRes.error) {
      console.error('Error loading photos:', photosRes.error);
    }

    if (photosRes.data) {
      console.log(`Found ${photosRes.data.length} photo(s) for this session`);

      const photosWithUrls = await Promise.all(
        photosRes.data.map(async (photo) => {
          const { data: fileUrl, error: fileError } = await supabase.storage
            .from('session_photos')
            .createSignedUrl(photo.file_path, 3600);

          const { data: thumbUrl, error: thumbError } = await supabase.storage
            .from('session_photos')
            .createSignedUrl(photo.thumbnail_path, 3600);

          if (fileError || thumbError) {
            console.error('Error creating signed URLs:', { fileError, thumbError });
          }

          console.log('Photo URLs:', {
            file_path: photo.file_path,
            file_url: fileUrl?.signedUrl,
            thumbnail_path: photo.thumbnail_path,
            thumbnail_url: thumbUrl?.signedUrl,
          });

          return {
            ...photo,
            file_url: fileUrl?.signedUrl || '',
            thumbnail_url: thumbUrl?.signedUrl || '',
          };
        })
      );

      setPhotos(photosWithUrls);
      console.log('Photos state updated with', photosWithUrls.length, 'photos');
    } else {
      console.log('No photos found for this session');
      setPhotos([]);
    }

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

  function getStatusOptions(serviceType: string) {
    const normalizedServiceType = serviceType.toLowerCase().trim();

    if (normalizedServiceType === 'mtm' || normalizedServiceType === 'made-to-measure') {
      return [
        { value: 'active', label: 'Active' },
        { value: 'fitting', label: 'Fitting' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'completed', label: 'Completed' },
      ];
    } else if (normalizedServiceType === 'bespoke') {
      return [
        { value: 'active', label: 'Active' },
        { value: 'fitting_1', label: 'Fitting #1' },
        { value: 'fitting_2', label: 'Fitting #2' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'completed', label: 'Completed' },
      ];
    } else if (normalizedServiceType === 'alteration' || normalizedServiceType === 'alterations') {
      return [
        { value: 'active', label: 'Active' },
        { value: 'fitting', label: 'Fitting' },
        { value: 'pickup', label: 'Pickup' },
        { value: 'completed', label: 'Completed' },
      ];
    }

    return [
      { value: 'active', label: 'Active' },
      { value: 'fitting', label: 'Fitting' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'completed', label: 'Completed' },
    ];
  }

  async function updateStatus(newStatus: string) {
    await supabase
      .from('sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    setSession(prev => prev ? { ...prev, status: newStatus } : null);
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0 || !sessionId || !user) return;

    setUploadingPhoto(true);

    let successCount = 0;
    let failureCount = 0;
    const failedFiles: string[] = [];

    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userProfile) {
        showToast('User profile not found. Please try logging out and back in.', 'error');
        setUploadingPhoto(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const validation = validatePhotoFile(file);
        if (!validation.valid) {
          showToast(validation.error || 'Invalid file', 'error');
          failureCount++;
          failedFiles.push(file.name);
          continue;
        }

        const processed = await processPhoto(file);

        const timestamp = Date.now();
        const randomId = crypto.randomUUID();
        const filePath = `${sessionId}/${timestamp}_${randomId}.jpg`;
        const thumbPath = `${sessionId}/thumb_${timestamp}_${randomId}.jpg`;

        const { error: fileError } = await supabase.storage
          .from('session_photos')
          .upload(filePath, processed.file, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (fileError) {
          showToast(`Failed to upload ${file.name}: ${fileError.message}`, 'error');
          failureCount++;
          failedFiles.push(file.name);
          continue;
        }

        const { error: thumbError } = await supabase.storage
          .from('session_photos')
          .upload(thumbPath, processed.thumbnail, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (thumbError) {
          showToast(`Failed to upload thumbnail: ${thumbError.message}`, 'error');
          await supabase.storage.from('session_photos').remove([filePath]);
          failureCount++;
          failedFiles.push(file.name);
          continue;
        }

        const { error: metadataError } = await supabase
          .from('session_photos')
          .insert({
            session_id: sessionId,
            file_path: filePath,
            thumbnail_path: thumbPath,
            file_size: processed.file.size,
            uploaded_by: userProfile.id,
          });

        if (metadataError) {
          showToast(`Failed to save photo metadata: ${metadataError.message}`, 'error');
          await supabase.storage.from('session_photos').remove([filePath, thumbPath]);
          failureCount++;
          failedFiles.push(file.name);
          continue;
        }

        successCount++;
      }

      await refreshSessionData();

      if (successCount > 0 && failureCount === 0) {
        showToast(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully`, 'success');
      } else if (successCount > 0 && failureCount > 0) {
        showToast(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded, ${failureCount} failed`, 'error');
      } else if (failureCount > 0) {
        showToast(`Failed to upload ${failureCount} photo${failureCount > 1 ? 's' : ''}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast('Failed to upload photos', 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDeletePhoto(photoId: string, filePath: string, thumbnailPath: string) {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    setDeletingPhotoId(photoId);

    try {
      const { error: dbError } = await supabase
        .from('session_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        showToast('Failed to delete photo: ' + dbError.message, 'error');
        setDeletingPhotoId(null);
        return;
      }

      await supabase.storage
        .from('session_photos')
        .remove([filePath, thumbnailPath]);

      await refreshSessionData();
      showToast('Photo deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast('Failed to delete photo', 'error');
    } finally {
      setDeletingPhotoId(null);
    }
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
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/clients/${session.client_id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Details</h1>
          {session.display_id && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">
                Order #{session.display_id}
              </span>
              <button
                onClick={() => handleCopyOrderId(session.display_id!)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                title="Copy order number"
              >
                {showCopied ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Copied!</span>
                ) : (
                  <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          )}
        </div>
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
              onChange={(value) => updateStatus(value)}
              options={getStatusOptions(session.service_type || 'MTM')}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Garment Photos</h2>
          <div className="flex items-center gap-3">
            {photos.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              multiple
              onChange={(e) => handlePhotoUpload(e.target.files)}
              className="hidden"
              id="photo-upload-input"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploadingPhoto ? 'Uploading...' : photos.length > 0 ? 'Add More' : 'Add Photos'}
            </Button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No photos yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              Add photos of the garment to track progress and reference details
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
              <Upload className="w-4 h-4 mr-2" />
              {uploadingPhoto ? 'Uploading...' : 'Upload Photos'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              JPG, PNG, or HEIC • Max 5MB per photo
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden group"
                >
                  <img
                    src={photo.thumbnail_url}
                    alt={`Garment photo ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setLightboxIndex(index);
                      setShowLightbox(true);
                    }}
                    onError={(e) => {
                      console.error('Failed to load thumbnail:', photo.thumbnail_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  <div
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setLightboxIndex(index);
                      setShowLightbox(true);
                    }}
                  >
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>

                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.file_path, photo.thumbnail_path)}
                    disabled={deletingPhotoId === photo.id}
                    className={`absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 ${
                      deletingPhotoId === photo.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Delete photo"
                  >
                    {deletingPhotoId === photo.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Click photos to view full size • Hover to delete
            </p>
          </>
        )}
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

      {showLightbox && photos.length > 0 && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
