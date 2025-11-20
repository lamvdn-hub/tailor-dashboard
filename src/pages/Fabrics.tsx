import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MobileSelect } from '../components/MobileSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { supabase, Fabric } from '../lib/supabase';

export function Fabrics() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFabrics, setFilteredFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    composition: '',
    colorPattern: '',
    stockCode: '',
    status: 'in' as 'in' | 'out',
  });

  useEffect(() => {
    loadFabrics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredFabrics(
        fabrics.filter(
          (fabric) =>
            fabric.name.toLowerCase().includes(query) ||
            fabric.stock_code?.toLowerCase().includes(query) ||
            fabric.composition?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredFabrics(fabrics);
    }
  }, [searchQuery, fabrics]);

  async function loadFabrics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('fabrics')
      .select('*')
      .order('name', { ascending: true });

    if (data && !error) {
      setFabrics(data);
      setFilteredFabrics(data);
    }
    setLoading(false);
  }

  async function handleAddFabric(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const { error } = await supabase.from('fabrics').insert({
      name: formData.name,
      composition: formData.composition || null,
      color_pattern: formData.colorPattern || null,
      stock_code: formData.stockCode || null,
      status: formData.status,
    });

    if (!error) {
      setFormData({
        name: '',
        composition: '',
        colorPattern: '',
        stockCode: '',
        status: 'in',
      });
      setShowAddForm(false);
      loadFabrics();
    }
  }

  async function updateFabricStatus(fabricId: string, newStatus: 'in' | 'out') {
    await supabase
      .from('fabrics')
      .update({ status: newStatus })
      .eq('id', fabricId);

    loadFabrics();
  }

  async function deleteFabric(fabricId: string) {
    if (!confirm('Are you sure you want to delete this fabric?')) {
      return;
    }

    const { error } = await supabase.from('fabrics').delete().eq('id', fabricId);

    if (!error) {
      loadFabrics();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Fabrics</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-5 h-5 mr-2 inline" />
          Add New Fabric
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Fabric</h2>

          <form onSubmit={handleAddFabric} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fabric Name *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter fabric name"
              />

              <Input
                label="Composition"
                type="text"
                value={formData.composition}
                onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                placeholder="e.g., 100% Cotton"
              />

              <Input
                label="Color / Pattern"
                type="text"
                value={formData.colorPattern}
                onChange={(e) => setFormData({ ...formData, colorPattern: e.target.value })}
                placeholder="e.g., Navy Blue Pinstripe"
              />

              <Input
                label="Stock Code"
                type="text"
                value={formData.stockCode}
                onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
                placeholder="e.g., FAB-001"
              />

              <MobileSelect
                label="Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as 'in' | 'out' })}
                options={[
                  { value: 'in', label: 'In Stock' },
                  { value: 'out', label: 'Out of Stock' },
                ]}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Add Fabric</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search fabrics by name, code, or composition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-2xl"
          />
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading fabrics...</p>
        ) : filteredFabrics.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            {searchQuery ? 'No fabrics found matching your search.' : 'No fabrics yet. Add your first fabric to get started.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabric Name</TableHead>
                <TableHead>Composition</TableHead>
                <TableHead>Color / Pattern</TableHead>
                <TableHead>Stock Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFabrics.map((fabric) => (
                <TableRow key={fabric.id}>
                  <TableCell className="font-medium">{fabric.name}</TableCell>
                  <TableCell>{fabric.composition || '-'}</TableCell>
                  <TableCell>{fabric.color_pattern || '-'}</TableCell>
                  <TableCell>{fabric.stock_code || '-'}</TableCell>
                  <TableCell>
                    <MobileSelect
                      value={fabric.status}
                      onChange={(value) => updateFabricStatus(fabric.id, value as 'in' | 'out')}
                      options={[
                        { value: 'in', label: 'In Stock' },
                        { value: 'out', label: 'Out of Stock' },
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="danger"
                      onClick={() => deleteFabric(fabric.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
