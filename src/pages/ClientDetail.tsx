import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { supabase, Client, Session, Measurement } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';

interface SessionWithDetails extends Session {
  fabric?: { name: string } | null;
}

interface ProcessedMeasurement {
  id: string;
  name: string;
  leftValue?: string | number | null;
  rightValue?: string | number | null;
  singleValue?: string | number | null;
  isPaired: boolean;
}

export function ClientDetail() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'measurements' | 'fabrics'>('sessions');
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [latestMeasurements, setLatestMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  async function loadClientData() {
    if (!clientId) return;

    setLoading(true);

    const [clientRes, sessionsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase
        .from('sessions')
        .select('*, fabric:fabrics(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
    ]);

    if (clientRes.data) {
      setClient(clientRes.data);
    }

    if (sessionsRes.data) {
      setSessions(sessionsRes.data as SessionWithDetails[]);

      if (sessionsRes.data.length > 0) {
        const latestSession = sessionsRes.data[0];
        const measurementsRes = await supabase
          .from('measurements')
          .select('*')
          .eq('session_id', latestSession.id)
          .order('measurement_name');

        if (measurementsRes.data) {
          setLatestMeasurements(measurementsRes.data);
        }
      } else {
        setLatestMeasurements([]);
      }
    }

    setLoading(false);
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this session? All associated measurements will also be deleted.')) {
      return;
    }

    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

    if (!error) {
      loadClientData();
    }
  }

  function processMeasurements(measurements: Measurement[]): ProcessedMeasurement[] {
    const processed = new Map<string, ProcessedMeasurement>();

    measurements.forEach((measurement) => {
      const name = measurement.measurement_name;
      const leftMatch = name.match(/^(.+)\s*\(L\)$/);
      const rightMatch = name.match(/^(.+)\s*\(R\)$/);

      if (leftMatch) {
        const baseName = leftMatch[1].trim();
        const existing = processed.get(baseName);
        if (existing) {
          existing.leftValue = measurement.unit_cm;
        } else {
          processed.set(baseName, {
            id: measurement.id,
            name: baseName,
            leftValue: measurement.unit_cm,
            rightValue: null,
            isPaired: true,
          });
        }
      } else if (rightMatch) {
        const baseName = rightMatch[1].trim();
        const existing = processed.get(baseName);
        if (existing) {
          existing.rightValue = measurement.unit_cm;
        } else {
          processed.set(baseName, {
            id: measurement.id,
            name: baseName,
            leftValue: null,
            rightValue: measurement.unit_cm,
            isPaired: true,
          });
        }
      } else {
        processed.set(name, {
          id: measurement.id,
          name: name,
          singleValue: measurement.unit_cm,
          isPaired: false,
        });
      }
    });

    return Array.from(processed.values());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Client not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {client.first_name && client.last_name
            ? `${client.first_name} ${client.last_name}`
            : client.name}
        </h1>
      </div>

      <Card>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Phone</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{client.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Email</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-[#B0B0B0]">Member Since</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(client.created_at)}</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-[#506B4D] text-[#506B4D] dark:border-[#6B8A63] dark:text-[#6B8A63]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('measurements')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'measurements'
              ? 'border-[#506B4D] text-[#506B4D] dark:border-[#6B8A63] dark:text-[#6B8A63]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Latest Measurements
        </button>
        <button
          onClick={() => setActiveTab('fabrics')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'fabrics'
              ? 'border-[#506B4D] text-[#506B4D] dark:border-[#6B8A63] dark:text-[#6B8A63]'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Fabrics Used
        </button>
      </div>

      {activeTab === 'sessions' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Sessions</h2>
            <Button onClick={() => navigate(`/clients/${clientId}/sessions/new`)}>
              <Plus className="w-5 h-5 mr-2 inline" />
              Add New Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No sessions yet. Create the first session for this client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Garment Type</TableHead>
                  <TableHead>Fabric</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDate(session.created_at)}</TableCell>
                    <TableCell className="capitalize">{session.garment_type}</TableCell>
                    <TableCell>{session.fabric?.name || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          session.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : session.status === 'ready'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/sessions/${session.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deleteSession(session.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'measurements' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest Measurements</h2>

          {latestMeasurements.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No measurements available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit (cm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processMeasurements(latestMeasurements).map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell className="font-medium">{measurement.name}</TableCell>
                    <TableCell>
                      {measurement.isPaired ? (
                        <span>
                          {measurement.leftValue != null && measurement.leftValue !== '' ? (
                            <>
                              {`${measurement.leftValue} (L)`}
                              {measurement.rightValue != null && measurement.rightValue !== '' && ', '}
                            </>
                          ) : null}
                          {measurement.rightValue != null && measurement.rightValue !== ''
                            ? `${measurement.rightValue} (R)`
                            : measurement.leftValue == null || measurement.leftValue === '' ? '-' : ''}
                        </span>
                      ) : (
                        <span>
                          {measurement.singleValue != null && measurement.singleValue !== ''
                            ? measurement.singleValue
                            : '-'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'fabrics' && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Fabrics Used</h2>
          <p className="text-center py-8 text-gray-500">
            Fabric history will be shown here based on past sessions.
          </p>
        </Card>
      )}
    </div>
  );
}
