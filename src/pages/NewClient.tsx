import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';

export function NewClient() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  async function loadClientData() {
    setFetchingData(true);
    setErrors({});

    const { data, error } = await supabase
      .from('clients')
      .select('first_name, last_name, phone, email')
      .eq('id', clientId)
      .maybeSingle();

    if (error) {
      setErrors({ fetch: 'Failed to load client data' });
      setFetchingData(false);
      return;
    }

    if (data) {
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        phone: data.phone || '',
        email: data.email || '',
      });
    }

    setFetchingData(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrors({ name: 'First name and last name are required' });
      return;
    }

    setLoading(true);
    setErrors({});

    if (clientId) {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const { error } = await supabase
        .from('clients')
        .update({
          name: fullName,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          email: formData.email || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      if (!error) {
        navigate('/clients');
      } else {
        setErrors({ submit: 'Failed to update client' });
      }
    } else {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const { error } = await supabase.from('clients').insert({
        name: fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        email: formData.email || null,
      });

      if (!error) {
        navigate('/clients');
      } else {
        setErrors({ submit: 'Failed to create client' });
      }
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {clientId ? 'Edit Client' : 'New Client'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        {fetchingData ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.fetch && (
              <p className="text-red-600 text-sm">{errors.fetch}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.name}
                placeholder="Enter first name"
              />
              <Input
                label="Last Name *"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />

            {errors.submit && (
              <p className="text-red-600 text-sm">{errors.submit}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : clientId ? 'Update Client' : 'Create Client'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
