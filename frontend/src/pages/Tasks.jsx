import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    projectId: '', 
    assignedTo: null,  // ✅ FIXED: Changed from '' to null
    dueDate: '', 
    priority: 'Medium' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/tasks`),
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/users`).catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validation
    if (!formData.title || !formData.description || !formData.projectId || !formData.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      // ✅ FIXED: Convert empty/null assignedTo properly
      const payload = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        assignedTo: formData.assignedTo && formData.assignedTo !== "" ? formData.assignedTo : null,
        dueDate: formData.dueDate,
        priority: formData.priority
      };
      
      await axios.post(`${API_URL}/tasks`, payload);
      toast.success('Task created successfully!');
      fetchData();
      setShowModal(false);
      // ✅ Reset form with null for assignedTo
      setFormData({ 
        title: '', 
        description: '', 
        projectId: '', 
        assignedTo: null, 
        dueDate: '', 
        priority: 'Medium' 
      });
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: 'white' }}>Tasks</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Track and manage tasks</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
      </div>

      <div className="dashboard-grid">
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <div key={status} className="glass-card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>{status}</h3>
            {tasks.filter(t => t.status === status).map(task => (
              <div key={task._id} style={{ padding: '12px', marginBottom: '12px', border: '1px solid rgba(0,180,216,0.2)', borderRadius: '12px', background: 'rgba(15,15,26,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontWeight: '600', color: 'white' }}>{task.title}</p>
                    <small style={{ color: '#00b4d8' }}>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</small>
                    {task.assignedTo && <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>Assigned to: {task.assignedTo.name}</small>}
                  </div>
                  {task.status !== 'Completed' && (
                    <select 
                      value={task.status} 
                      onChange={(e) => handleStatusUpdate(task._id, e.target.value)} 
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '20px', 
                        fontSize: '12px',
                        background: '#1a1a2e',
                        color: '#00b4d8',
                        border: '1px solid #00b4d8',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === status).length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No tasks</p>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '90%', background: 'rgba(26,26,46,0.98)', border: '1px solid rgba(0,180,216,0.3)' }}>
            <h2 style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #00b4d8, #00ff7f)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create New Task</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <input 
                  className="input-field" 
                  placeholder="Task Title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <textarea 
                  className="input-field" 
                  placeholder="Description" 
                  rows="2" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <select 
                  className="input-field" 
                  value={formData.projectId} 
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} 
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                {/* ✅ FIXED: AssignedTo dropdown with null handling */}
                <select 
                  className="input-field" 
                  value={formData.assignedTo || ""} 
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <select 
                  className="input-field" 
                  value={formData.priority} 
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;