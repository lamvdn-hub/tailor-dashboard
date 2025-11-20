import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MobileSelect } from '../components/MobileSelect';
import { PrioritySelect } from '../components/PrioritySelect';
import { TaskStatusSelect } from '../components/TaskStatusSelect';
import { Plus, Search, Trash2, CheckCircle2 } from 'lucide-react';

type Task = {
  id: string;
  description: string;
  client_id: string | null;
  session_id: string | null;
  category: 'Alteration' | 'Fitting' | 'Pickup' | 'Order' | 'Admin';
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: { id: string; first_name: string; last_name: string } | null;
  sessions?: { id: string; garment_type: string } | null;
};

type Client = {
  id: string;
  first_name: string;
  last_name: string;
};

type Session = {
  id: string;
  garment_type: string;
  clients?: { first_name: string; last_name: string } | null;
};

type FilterType = 'all' | 'today' | 'pending' | 'completed';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);

  const [newTask, setNewTask] = useState({
    description: '',
    client_id: '',
    session_id: '',
    category: 'Fitting' as Task['category'],
    due_date: new Date().toISOString().split('T')[0],
    priority: 'Medium' as Task['priority'],
    notes: '',
  });

  useEffect(() => {
    loadTasks();
    loadClients();
    loadSessions();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        clients:client_id(id, first_name, last_name),
        sessions:session_id(id, garment_type)
      `)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .order('last_name');
    setClients(data || []);
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select(`
        id,
        garment_type,
        clients:client_id(first_name, last_name)
      `)
      .order('created_at', { ascending: false });
    setSessions((data || []) as unknown as Session[]);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      ...newTask,
      client_id: newTask.client_id || null,
      session_id: newTask.session_id || null,
      notes: newTask.notes || null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(`
        *,
        clients:client_id(id, first_name, last_name),
        sessions:session_id(id, garment_type)
      `)
      .single();

    if (error) {
      alert('Error creating task: ' + error.message);
      return;
    }

    setTasks(prevTasks => [data, ...prevTasks]);

    setShowModal(false);
    setNewTask({
      description: '',
      client_id: '',
      session_id: '',
      category: 'Fitting',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      notes: '',
    });

    const liveRegion = document.getElementById('task-status-message');
    if (liveRegion) {
      liveRegion.textContent = 'Task created successfully';
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const handleUpdateField = async (taskId: string, field: string, value: any) => {
    const { error } = await supabase
      .from('tasks')
      .update({ [field]: value })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    }
    setEditingCell(null);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      alert('Error deleting task: ' + error.message);
      return;
    }

    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });

    const liveRegion = document.getElementById('task-status-message');
    if (liveRegion) {
      liveRegion.textContent = 'Task deleted successfully';
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.size} selected tasks?`)) return;

    const deletedIds = Array.from(selectedTasks);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', deletedIds);

    if (error) {
      alert('Error deleting tasks: ' + error.message);
      return;
    }

    setTasks(prevTasks => prevTasks.filter(t => !deletedIds.includes(t.id)));
    setSelectedTasks(new Set());

    const liveRegion = document.getElementById('task-status-message');
    if (liveRegion) {
      liveRegion.textContent = `${deletedIds.length} tasks deleted successfully`;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const handleBulkComplete = async () => {
    const completedIds = Array.from(selectedTasks);
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'Completed', completed_at: new Date().toISOString() })
      .in('id', completedIds);

    if (error) {
      alert('Error completing tasks: ' + error.message);
      return;
    }

    setTasks(prevTasks =>
      prevTasks.map(t =>
        completedIds.includes(t.id)
          ? { ...t, status: 'Completed' as const, completed_at: new Date().toISOString() }
          : t
      )
    );

    setSelectedTasks(new Set());

    const liveRegion = document.getElementById('task-status-message');
    if (liveRegion) {
      liveRegion.textContent = `${completedIds.length} tasks marked as completed`;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (task.due_date !== today) return false;
    }
    if (filter === 'pending' && task.status !== 'Pending') return false;
    if (filter === 'completed' && task.status !== 'Completed') return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const clientName = task.clients
        ? `${task.clients.first_name} ${task.clients.last_name}`.toLowerCase()
        : '';
      return (
        task.description.toLowerCase().includes(search) ||
        clientName.includes(search) ||
        task.category.toLowerCase().includes(search) ||
        (task.notes?.toLowerCase().includes(search) || false)
      );
    }

    return true;
  });

  const isOverdue = (task: Task) => {
    if (task.status === 'Completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 [text-shadow:_0_0_1px_rgb(0_0_0_/_40%)]';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 [text-shadow:_0_0_1px_rgb(0_0_0_/_40%)]';
      case 'Low':
        return 'bg-green-100 text-green-800 [text-shadow:_0_0_1px_rgb(0_0_0_/_40%)]';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="p-8 text-center dark:text-gray-400">Loading tasks...</div>;
  }

  return (
    <div>
      <div
        id="task-status-message"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage client appointments, alterations, and administrative tasks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  filter === 'all'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  filter === 'today'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  filter === 'pending'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  filter === 'completed'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="flex gap-2 sm:gap-3 items-center w-full sm:flex-1 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:outline-none"
                />
              </div>
              <Button onClick={() => setShowModal(true)} className="whitespace-nowrap">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          </div>

          {selectedTasks.size > 0 && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleBulkComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark {selectedTasks.size} Completed
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedTasks.size} Selected
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#506B4D] rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Session</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                      isOverdue(task) ? 'bg-red-50 dark:bg-red-900/30' : ''
                    } ${task.status === 'Completed' ? 'opacity-60' : ''} ${selectedTasks.has(task.id) ? 'dark:bg-gray-700' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 text-[#506B4D] rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.taskId === task.id && editingCell?.field === 'description' ? (
                        <input
                          type="text"
                          defaultValue={task.description}
                          autoFocus
                          onBlur={(e) => handleUpdateField(task.id, 'description', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateField(task.id, 'description', e.currentTarget.value);
                            }
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full min-w-[120px] sm:min-w-[200px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#506B4D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingCell({ taskId: task.id, field: 'description' })}
                          className="cursor-text hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded min-w-[120px] sm:min-w-[200px] text-gray-900 dark:text-white"
                        >
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[150px]">
                        <MobileSelect
                          value={task.client_id || ''}
                          onChange={(value) => handleUpdateField(task.id, 'client_id', value || null)}
                          options={[
                            { value: '', label: 'No Client' },
                            ...clients.map((client) => ({
                              value: client.id,
                              label: `${client.first_name} ${client.last_name}`,
                            })),
                          ]}
                          placeholder="No Client"
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[200px]">
                        <MobileSelect
                          value={task.session_id || ''}
                          onChange={(value) => handleUpdateField(task.id, 'session_id', value || null)}
                          options={[
                            { value: '', label: 'No Session' },
                            ...sessions.map((session) => ({
                              value: session.id,
                              label: `${session.garment_type} - ${session.clients?.first_name} ${session.clients?.last_name}`,
                            })),
                          ]}
                          placeholder="No Session"
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[120px]">
                        <MobileSelect
                          value={task.category}
                          onChange={(value) => handleUpdateField(task.id, 'category', value)}
                          options={[
                            { value: 'Alteration', label: 'Alteration' },
                            { value: 'Fitting', label: 'Fitting' },
                            { value: 'Pickup', label: 'Pickup' },
                            { value: 'Order', label: 'Order' },
                            { value: 'Admin', label: 'Admin' },
                          ]}
                          placeholder="Category"
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={task.due_date}
                        onChange={(e) => handleUpdateField(task.id, 'due_date', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#506B4D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <PrioritySelect
                        value={task.priority}
                        onChange={(value) => handleUpdateField(task.id, 'priority', value)}
                        options={[
                          { value: 'Low', label: 'Low' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'High', label: 'High' },
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusSelect
                        value={task.status}
                        onChange={(value) => handleUpdateField(task.id, 'status', value)}
                        options={[
                          { value: 'Pending', label: 'Pending' },
                          { value: 'Completed', label: 'Completed' },
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.taskId === task.id && editingCell?.field === 'notes' ? (
                        <input
                          type="text"
                          defaultValue={task.notes || ''}
                          autoFocus
                          onBlur={(e) => handleUpdateField(task.id, 'notes', e.target.value || null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateField(task.id, 'notes', e.currentTarget.value || null);
                            }
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full min-w-[100px] sm:min-w-[150px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#506B4D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingCell({ taskId: task.id, field: 'notes' })}
                          className="cursor-text hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded min-w-[100px] sm:min-w-[150px] text-sm text-gray-600 dark:text-gray-400"
                        >
                          {task.notes || 'Add notes...'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                No tasks found. Create your first task to get started!
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="min-h-screen flex items-start justify-center p-4 py-8">
            <div className="bg-white dark:bg-[#1B1F23] rounded-lg shadow-xl max-w-2xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-[#2C3236]">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#E8EAE7]">Add New Task</h2>
            </div>

            <form onSubmit={handleAddTask} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#B0B0B0] mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MobileSelect
                  label="Client"
                  value={newTask.client_id}
                  onChange={(value) => setNewTask({ ...newTask, client_id: value })}
                  options={[
                    { value: '', label: 'No Client' },
                    ...clients.map((client) => ({
                      value: client.id,
                      label: `${client.first_name} ${client.last_name}`,
                    })),
                  ]}
                  placeholder="Select a client"
                />

                <MobileSelect
                  label="Session"
                  value={newTask.session_id}
                  onChange={(value) => setNewTask({ ...newTask, session_id: value })}
                  options={[
                    { value: '', label: 'No Session' },
                    ...sessions.map((session) => ({
                      value: session.id,
                      label: `${session.garment_type} - ${session.clients?.first_name} ${session.clients?.last_name}`,
                    })),
                  ]}
                  placeholder="Select a session"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MobileSelect
                  label="Category *"
                  value={newTask.category}
                  onChange={(value) => setNewTask({ ...newTask, category: value as Task['category'] })}
                  options={[
                    { value: 'Alteration', label: 'Alteration' },
                    { value: 'Fitting', label: 'Fitting' },
                    { value: 'Pickup', label: 'Pickup' },
                    { value: 'Order', label: 'Order' },
                    { value: 'Admin', label: 'Admin' },
                  ]}
                  placeholder="Select a category"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#E8EAE7] mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E8EAE7] mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {(['Low', 'Medium', 'High'] as const).map((priority) => (
                    <label key={priority} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={newTask.priority === priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                        className="text-[#506B4D] focus:ring-[#506B4D] flex-shrink-0"
                      />
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(priority)}`}>
                        {priority}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E8EAE7] mb-2">Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-[#506B4D] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Task
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="secondary" className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
