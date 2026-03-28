// models/index.js
const mongoose = require('mongoose');

// ── STUDENT ──────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  roll_no:      { type: String, unique: true, required: true },
  name:         { type: String, required: true },
  dept:         { type: String, required: true, enum: ['CSE','EEE','EIE','MECHANICAL','MECHATRONICS'] },
  year:         { type: Number, required: true, min: 1, max: 4 },
  sem:          { type: Number, required: true },
  attendance:   { type: Number, required: true },   // 0-100
  internal:     { type: Number, required: true },   // 0-100
  assignment:   { type: Number, required: true },   // 0-100
  final_exam:   { type: Number, required: true },   // 0-100
  risk:         { type: String, enum: ['high','moderate','low'], required: true },
  risk_score:   { type: Number, required: true },   // 0-100 (ML risk probability)
  interventions: { type: Map, of: String, default: {} },
}, { timestamps: true });

// ── POLICY ────────────────────────────────────────────────────────────────────
const policySchema = new mongoose.Schema({
  name:                  { type: String, required: true, unique: true },
  attendancePolicy:      { type: Number, default: 30 },
  internalWeight:        { type: Number, default: 40 },
  finalExamWeight:       { type: Number, default: 20 },
  continuousAssessment:  { type: Number, default: 5  },
  remedialIntervention:  { type: Number, default: 5  },
}, { timestamps: true });

// ── USER ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin','faculty'], required: true },
  dept:     { type: String, default: null },
}, { timestamps: true });

module.exports = {
  Student: mongoose.model('Student', studentSchema),
  Policy:  mongoose.model('Policy',  policySchema),
  User:    mongoose.model('User',    userSchema),
};
