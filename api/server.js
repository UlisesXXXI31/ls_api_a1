const express = require('express');
const cors = require('cors'); // <-- ¡Esta es la nueva línea!
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ¡Nueva línea!

// Aquí va la URL de conexión a tu base de datos MongoDB.
// Reemplaza <nombre-de-tu-base-de-datos> con el nombre que quieras darle.
const uri = 'mongodb://127.0.0.1:27017/vocabulario-app';

mongoose.connect(uri)
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));
const User = require('./models/user');
const Progress = require('./models/progress');
const app = express();
app.use(cors()); // <-- ¡Y esta es la otra nueva línea!
app.use(express.json());
const port = 3000;

app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el servidor!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
// Ruta para crear datos de prueba (temporal)
app.get('/api/seed', async (req, res) => {
  try {
    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    //1. crar un usuario de prueba (ahora como alumno)
    

         // 1. Crear un usuario de prueba (ahora como profesor)
   

    // 2. Crear un registro de progreso para el usuario
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

    // 1. Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // 2. Comparar la contraseña ingresada con la guardada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // 3. Verificar si el usuario es un profesor
    if (user.role !== 'teacher' && user.role !== 'student') {
      return res.status(403).json({ message: 'Acceso denegado. Este panel es solo para profesores y alumnos' });
    }

    // Si todo es correcto, envía una respuesta exitosa
   // ...
// ...
// Si todo es correcto, envía una respuesta exitosa con el ID del usuario
   res.status(200).json({ message: 'Inicio de sesión exitoso', user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (error) {
    res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
  }
});
// Ruta para que el alumno obtenga su ID a través del email
app.get('/api/users/by-email', async (req, res) => {
  try {
    const { email } = req.query; // Usamos req.query para obtener el email de la URL

    // 1. Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si el usuario existe, devolvemos su ID y rol
    res.status(200).json({ 
      message: 'Usuario encontrado',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
  }
});
// Ruta para obtener todos los usuarios (alumnos)
app.get('/api/users', async (req, res) => {
  try {
    // En tu modelo de usuario, busca todos los usuarios con el rol 'student'
    const users = await User.find({ role: 'student' }).select('-password'); // .select('-password') para no enviar la contraseña

    // Si no hay usuarios, devuelve un array vacío
    if (!users) {
      return res.status(404).json({ message: 'No hay usuarios registrados.' });
    }

    // Si hay usuarios, los devuelve en formato JSON
    res.status(200).json({ users: users });
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
// Ruta para obtener el progreso de un usuario por su ID
app.get('/api/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Busca todos los registros de progreso para ese usuario, ordenados por fecha
    const progressHistory = await Progress.find({ userId: userId }).sort({ date: 1 });

    if (!progressHistory || progressHistory.length === 0) {
      return res.status(404).json({ message: 'No se encontró historial de progreso para este usuario.' });
    }

    res.status(200).json({ progress: progressHistory });
  } catch (error) {
    console.error('Error al obtener el progreso del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});