// backend/models/progress.js (VERSIÓN CORREGIDA)

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const progressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonName: { // <-- ¡CORREGIDO! 'N' minúscula para seguir la convención
    type: String,
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Exportar usando el patrón "singleton" para evitar errores en Vercel
module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
