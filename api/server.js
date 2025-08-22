// VERSIÓN CORREGIDA DE api/server.js

// --- 1. Imports ---
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- 2. Creación de la App ---
const app = express();

// --- 3. Middlewares ---
app.use(cors({
  origin: 'https://ulisesxxxi31.github.io'
}));
app.use(express.json());

// --- 4. Conexión a la Base de Datos ---
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log('Conexión exitosa a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión a MongoDB Atlas:', err));

// --- 5. Importación de Modelos ---
const User = require('../models/user');
const Progress = require('../models/progress');

// --- 6. Rutas de la API ---
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el servidor!');
});

// Ruta para crear datos de prueba (temporal)
app.get('/api/seed', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Crear un usuario de prueba (profesor)
    const testUser = new User({
        name: 'Profesor de Prueba',
        email: 'prof.prueba@seed.com',
        password: hashedPassword,
        role: 'teacher'
    });
    await testUser.save();

    // Crear un registro de progreso para el usuario
    const testProgress = new Progress({
      user: testUser._id,
      taskName: 'Lección 1: Vocabulario básico',
      score: 95,
      completed: true
    });
    await testProgress.save();

    res.status(200).json({ message: 'Datos de prueba (Profesor y progreso) creados con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { userId, taskName, score, completed } = req.body;
    const newProgress = new Progress({
      user: userId,
      taskName,
      score,
      completed
    });
    await newProgress.save();
    res.status(201).json({ message: 'Progreso guardado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/students', async (req, res) => {
  try {
    const studentProgress = await Progress.find().populate('user', 'name email');
    const groupedProgress = studentProgress.reduce((acc, progress) => {
      const { user, ...rest } = progress._doc;
      if (!acc[user.name]) {
        acc[user.name] = {
          name: user.name,
          email: user.email,
          tasks: []
        };
      }
      acc[user.name].tasks.push(rest);
      return acc;
    }, {});
    res.status(200).json(Object.values(groupedProgress));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de autenticación (login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    if (user.role !== 'teacher' && user.role !== 'student') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.status(200).json({ message: 'Inicio de sesión exitoso', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
  }
});

app.get('/api/users/by-email', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ 
      message: 'Usuario encontrado',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password');
    if (!users) {
      return res.status(404).json({ message: 'No hay usuarios registrados.' });
    }
    res.status(200).json({ users: users });
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progressHistory = await Progress.find({ userId: userId }).sort({ date: 1 });
    if (!progressHistory || progressHistory.length === 0) {
      return res.status(404).json({ message: 'No se encontró historial de progreso.' });
    }
    res.status(200).json({ progress: progressHistory });
  } catch (error) {
    console.error('Error al obtener el progreso del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// --- 7. Export de la App ---
module.exports = app;
