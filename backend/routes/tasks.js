const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for the user
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ assignedTo: req.user._id }, { assignedBy: req.user._id }]
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('GET tasks error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get tasks by project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (project.owner.toString() !== req.user._id.toString() && 
        !project.members.some(m => m.toString() === req.user._id.toString()) &&
        req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(tasks);
  } catch (error) {
    console.error('GET tasks by project error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    
    // Validate required fields
    if (!title || !description || !projectId || !dueDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, projectId, dueDate' 
      });
    }
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (project.owner.toString() !== req.user._id.toString() && 
        !project.members.some(m => m.toString() === req.user._id.toString()) &&
        req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }
    
    // ✅ FIXED: Convert empty string to null for assignedTo
    const validAssignedTo = assignedTo && assignedTo !== "" ? assignedTo : null;
    
    // If assignedTo is provided, check if user exists
    if (validAssignedTo) {
      const User = require('../models/User');
      const assignedUser = await User.findById(validAssignedTo);
      if (!assignedUser) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }
    
    const task = new Task({
      title,
      description,
      project: projectId,
      assignedTo: validAssignedTo,
      assignedBy: req.user._id,
      dueDate: new Date(dueDate),
      priority: priority || 'Medium',
      status: 'Pending'
    });
    
    await task.save();
    
    // Populate references for response
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('POST task error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is authorized to update this task
    const project = await Project.findById(task.project);
    const isAuthorized = task.assignedTo?.toString() === req.user._id.toString() ||
                         task.assignedBy?.toString() === req.user._id.toString() ||
                         project?.owner?.toString() === req.user._id.toString() ||
                         req.user.role === 'Admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }
    
    task.status = status;
    await task.save();
    
    res.json({
      success: true,
      message: 'Task status updated',
      task
    });
  } catch (error) {
    console.error('PATCH task status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update full task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, status } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check authorization
    const project = await Project.findById(task.project);
    const isAuthorized = project?.owner?.toString() === req.user._id.toString() ||
                         req.user.role === 'Admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }
    
    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo && assignedTo !== "") task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (priority) task.priority = priority;
    if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) task.status = status;
    
    await task.save();
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('PUT task error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check authorization
    const project = await Project.findById(task.project);
    const isAuthorized = project?.owner?.toString() === req.user._id.toString() ||
                         task.assignedBy?.toString() === req.user._id.toString() ||
                         req.user.role === 'Admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to delete this task' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('DELETE task error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;