import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/projects`);
      setProjects(data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/projects/${editing._id}`, formData);
        toast.success('Project updated');
      } else {
        await axios.post(`${API_URL}/projects`, formData);
        toast.success('Project created');
      }
      fetchProjects();
      setShowModal(false);
      setFormData({ name: '', description: '', status: 'Active' });
      setEditing(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try {
        await axios.delete(`${API_URL}/projects/${id}`);
        toast.success('Project deleted');
        fetchProjects();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div><h1 style={{ color: 'white' }}>Projects</h1><p style={{ color: 'rgba(255,255,255,0.8)' }}>Manage your team projects</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      <div className="dashboard-grid">
        {projects.map(project => (
          <div key={project._id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3 style={{ marginBottom: '8px' }}>{project.name}</h3>
              {(isAdmin || project.owner?._id === user?._id) && (
                <div>
                  <button onClick={() => { setEditing(project); setFormData(project); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>✏️</button>
                  <button onClick={() => handleDelete(project._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
                </div>
              )}
            </div>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>{project.description}</p>
            <div className={`status-badge ${project.status === 'Active' ? 'status-progress' : 'status-completed'}`}>{project.status}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ marginBottom: '20px' }}>{editing ? 'Edit Project' : 'New Project'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <input className="input-field" placeholder="Project Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <textarea className="input-field" placeholder="Description" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <select className="input-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;