// ╔══════════════════════════════════════════════════════╗
// ║   AcadPredict API v3  —  MongoDB + Express + JWT     ║
// ║   node server.js                                     ║
// ╚══════════════════════════════════════════════════════╝
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const { Student, Policy, User } = require('./models');

const app    = express();
const PORT   = process.env.PORT   || 3000;
const SECRET = process.env.JWT_SECRET || 'acadpredict_secret';
const MONGO  = process.env.MONGO_URI  || 'mongodb+srv://loguritish28_db_user:uuZviPoBo1AoxoQ0@cluster0.bi95ca8.mongodb.net/rithika?retryWrites=true&w=majority';

app.use(cors());
app.use(express.json());

// ── DB CONNECTION ─────────────────────────────────────────────────────────────
mongoose.connect(MONGO)
  .then(() => console.log(`\n🌸  AcadPredict API  →  http://localhost:${PORT}\n   MongoDB connected\n`))
  .catch(e  => { console.error('❌ MongoDB connection failed:', e.message); process.exit(1); });

// ── AI RECOMMENDATION ENGINE ─────────────────────────────────────────────────
function generateRecommendations(s) {
  const recs = [];

  // Attendance analysis
  if (s.attendance < 60) {
    recs.push({ area: 'Attendance', priority: 'critical',
      tip: `Attendance is critically low at ${s.attendance}%. Student is at high risk of detention. Immediate personal counseling and parent notification required. Consider assigning a peer mentor.` });
  } else if (s.attendance < 75) {
    recs.push({ area: 'Attendance', priority: 'high',
      tip: `Attendance at ${s.attendance}% is below the 75% threshold. Student risks losing exam eligibility. Schedule weekly check-ins and set attendance improvement targets.` });
  } else if (s.attendance < 85) {
    recs.push({ area: 'Attendance', priority: 'moderate',
      tip: `Attendance at ${s.attendance}% is acceptable but has room to improve. Encourage consistent class participation through attendance incentive programs.` });
  }

  // Internal marks analysis
  if (s.internal < 45) {
    recs.push({ area: 'Internal Marks', priority: 'critical',
      tip: `Internal marks at ${s.internal}% indicate serious academic difficulty. Arrange immediate doubt-clearing sessions, enroll in remedial coaching, and review fundamental concepts from previous semesters.` });
  } else if (s.internal < 60) {
    recs.push({ area: 'Internal Marks', priority: 'high',
      tip: `Internal marks at ${s.internal}% need significant improvement. Recommend joining study groups, seeking faculty office hours, and completing all practice assignments before the next internal exam.` });
  } else if (s.internal < 72) {
    recs.push({ area: 'Internal Marks', priority: 'moderate',
      tip: `Internal marks at ${s.internal}% show moderate performance. Focus on weak subject areas, attempt previous year question papers, and target above 75% in the next internal.` });
  }

  // Assignment completion
  if (s.assignment < 50) {
    recs.push({ area: 'Assignments', priority: 'critical',
      tip: `Assignment score of ${s.assignment}% indicates very low submission rate. Set mandatory submission deadlines with penalties. Consider assigning a faculty mentor to monitor weekly progress.` });
  } else if (s.assignment < 65) {
    recs.push({ area: 'Assignments', priority: 'high',
      tip: `Assignment completion at ${s.assignment}% needs improvement. Create a personal deadline tracker and prioritize outstanding submissions. Assignment performance directly impacts internal marks.` });
  } else if (s.assignment < 78) {
    recs.push({ area: 'Assignments', priority: 'moderate',
      tip: `Assignment score of ${s.assignment}% is satisfactory. Encourage higher quality submissions — focus on depth over speed and attempt bonus questions for extra marks.` });
  }

  // Final exam performance
  if (s.final_exam < 45) {
    recs.push({ area: 'Final Exam Preparation', priority: 'critical',
      tip: `Final exam score of ${s.final_exam}% is critically low. Immediate enrollment in remedial classes is essential. Create a structured revision schedule covering all syllabus units. Practice 5+ past papers per subject.` });
  } else if (s.final_exam < 60) {
    recs.push({ area: 'Final Exam Preparation', priority: 'high',
      tip: `Final exam score of ${s.final_exam}% needs improvement. Focus on high-weightage units, solve previous year papers, and attend extra coaching for difficult subjects. Target minimum 65% in next attempt.` });
  } else if (s.final_exam < 75) {
    recs.push({ area: 'Final Exam Preparation', priority: 'moderate',
      tip: `Final exam at ${s.final_exam}% shows decent performance. To reach distinction level (>75%), practice advanced problems, focus on application-type questions and improve time management during exams.` });
  }

  // Combined risk analysis
  if (s.attendance < 75 && s.internal < 60) {
    recs.push({ area: 'Combined Risk Alert', priority: 'critical',
      tip: `Both attendance (${s.attendance}%) and internal marks (${s.internal}%) are below acceptable levels simultaneously. This pattern strongly predicts failure. Initiate immediate multi-level intervention: faculty mentor + parent meeting + remedial classes + weekly progress tracking.` });
  }

  // Positive reinforcement for good students
  if (recs.length === 0) {
    const avg = Math.round((s.attendance + s.internal + s.assignment + s.final_exam) / 4);
    if (avg >= 85) {
      recs.push({ area: 'Excellence Track', priority: 'good',
        tip: `Excellent performance with ${avg}% average! Nominate for departmental honors and encourage participation in competitive coding/technical events. Consider for teaching assistant roles to further solidify knowledge.` });
    } else {
      recs.push({ area: 'Steady Progress', priority: 'good',
        tip: `Good overall performance with ${avg}% average. Focus on pushing weak areas above 80% to move toward distinction. Participate in workshops and industry-connect programs to enhance placement prospects.` });
    }
  }

  return recs;
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
function authMW(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(h.slice(7), SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
function adminOnly(req, res, next) {
  authMW(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}
function staffOnly(req, res, next) {
  authMW(req, res, () => {
    if (!['admin','faculty'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.get('/api/health', async (_, res) => {
  const count = await Student.countDocuments();
  res.json({ status: 'ok', students: count, timestamp: new Date() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email: email?.toLowerCase() });
    if (!u || !bcrypt.compareSync(password, u.password))
      return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: u._id, email: u.email, role: u.role, name: u.name, dept: u.dept }, SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: u._id, name: u.name, email: u.email, role: u.role, dept: u.dept } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authMW, async (req, res) => {
  const u = await User.findById(req.user.id).select('-password');
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/admin/dashboard', adminOnly, async (_, res) => {
  try {
    const DEPTS = ['CSE','EEE','EIE','MECHANICAL','MECHATRONICS'];

    // Aggregate dept stats in one query
    const deptAgg = await Student.aggregate([
      { $group: {
        _id: '$dept',
        total:       { $sum: 1 },
        avgAtt:      { $avg: '$attendance' },
        avgInt:      { $avg: '$internal' },
        highCount:   { $sum: { $cond: [{ $eq: ['$risk','high'] },     1, 0] } },
        modCount:    { $sum: { $cond: [{ $eq: ['$risk','moderate'] }, 1, 0] } },
        lowCount:    { $sum: { $cond: [{ $eq: ['$risk','low'] },      1, 0] } },
      }},
    ]);

    const deptStats = {};
    for (const d of deptAgg) {
      deptStats[d._id] = {
        totalStudents:  d.total,
        avgAttendance:  Math.round(d.avgAtt),
        avgInternal:    Math.round(d.avgInt),
        riskCount:      d.highCount,
        passRate:       Math.round((d.lowCount + d.modCount) / d.total * 100),
        high:           d.highCount,
        moderate:       d.modCount,
        low:            d.lowCount,
      };
    }

    const totalAgg = await Student.aggregate([
      { $group: {
        _id: null,
        total: { $sum: 1 },
        high:  { $sum: { $cond: [{ $eq: ['$risk','high'] },     1, 0] } },
        mod:   { $sum: { $cond: [{ $eq: ['$risk','moderate'] }, 1, 0] } },
        low:   { $sum: { $cond: [{ $eq: ['$risk','low'] },      1, 0] } },
      }}
    ]);
    const tot = totalAgg[0] || { total:0, high:0, mod:0, low:0 };

    const avgPass = Math.round(Object.values(deptStats).reduce((a,v)=>a+v.passRate,0)/DEPTS.length);
    const semTrend = [
      { sem:'Sem 1', passRate:62, avgAttendance:65 },
      { sem:'Sem 2', passRate:67, avgAttendance:68 },
      { sem:'Sem 3', passRate:65, avgAttendance:67 },
      { sem:'Sem 4', passRate:71, avgAttendance:72 },
      { sem:'Sem 5', passRate:70, avgAttendance:73 },
      { sem:'Sem 6', passRate:74, avgAttendance:76 },
      { sem:'Sem 7', passRate:77, avgAttendance:78 },
      { sem:'Sem 8', passRate:80, avgAttendance:82 },
    ];

    res.json({ totalStudents: tot.total, avgPassRate: avgPass, highRisk: tot.high,
      deptStats, riskDist: { high: tot.high, moderate: tot.mod, low: tot.low }, semTrend });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function calcPR(p) {
  return Math.min(98, Math.round(50 + p.attendancePolicy*.14 + p.internalWeight*.10 + p.finalExamWeight*.08 + p.continuousAssessment*.12 + p.remedialIntervention*.10));
}

app.get('/api/admin/policy', adminOnly, async (_, res) => {
  try {
    const [a, b] = await Promise.all([Policy.findOne({name:'A'}), Policy.findOne({name:'B'})]);
    res.json({
      A: { ...a.toObject(), predictedPassRate: calcPR(a) },
      B: { ...b.toObject(), predictedPassRate: calcPR(b) },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/policy/b', adminOnly, async (req, res) => {
  try {
    const keys = ['attendancePolicy','internalWeight','finalExamWeight','continuousAssessment','remedialIntervention'];
    const update = {};
    for (const k of keys) if (req.body[k] !== undefined) update[k] = Number(req.body[k]);
    const b = await Policy.findOneAndUpdate({ name:'B' }, update, { new: true });
    res.json({ ...b.toObject(), predictedPassRate: calcPR(b) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/policy/reset', adminOnly, async (_, res) => {
  try {
    const b = await Policy.findOneAndUpdate({ name:'B' },
      { attendancePolicy:30, internalWeight:40, finalExamWeight:20, continuousAssessment:5, remedialIntervention:5 },
      { new: true });
    res.json({ ...b.toObject(), predictedPassRate: calcPR(b) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/impact', adminOnly, async (_, res) => {
  try {
    const yearAgg = await Student.aggregate([
      { $group: {
        _id: '$year',
        total:   { $sum: 1 },
        high:    { $sum: { $cond: [{ $eq: ['$risk','high'] },     1, 0] } },
        mod:     { $sum: { $cond: [{ $eq: ['$risk','moderate'] }, 1, 0] } },
        low:     { $sum: { $cond: [{ $eq: ['$risk','low'] },      1, 0] } },
        avgAtt:  { $avg: '$attendance' },
      }},
      { $sort: { _id: 1 } }
    ]);
    const yearStats = yearAgg.map(y => ({
      year:y._id, total:y.total, high:y.high, moderate:y.mod, low:y.low,
      passRate:Math.round((y.low+y.mod)/y.total*100),
      avgAttendance:Math.round(y.avgAtt),
    }));

    const deptAgg = await Student.aggregate([
      { $group: {
        _id: '$dept',
        total:  { $sum: 1 },
        high:   { $sum: { $cond: [{ $eq: ['$risk','high'] },     1, 0] } },
        mod:    { $sum: { $cond: [{ $eq: ['$risk','moderate'] }, 1, 0] } },
        low:    { $sum: { $cond: [{ $eq: ['$risk','low'] },      1, 0] } },
        avgAtt: { $avg: '$attendance' },
      }}
    ]);
    const deptStats = {};
    for (const d of deptAgg) {
      deptStats[d._id] = { totalStudents:d.total, riskCount:d.high, passRate:Math.round((d.low+d.mod)/d.total*100), avgAttendance:Math.round(d.avgAtt) };
    }
    res.json({ yearStats, deptStats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/reports', adminOnly, async (_, res) => {
  try {
    const agg = await Student.aggregate([
      { $group: { _id:null, total:{$sum:1}, high:{$sum:{$cond:[{$eq:['$risk','high']},1,0]}}, mod:{$sum:{$cond:[{$eq:['$risk','moderate']},1,0]}}, low:{$sum:{$cond:[{$eq:['$risk','low']},1,0]}} }}
    ]);
    const tot = agg[0];
    const [a,b] = await Promise.all([Policy.findOne({name:'A'}),Policy.findOne({name:'B'})]);
    const semTrend = [
      {sem:'Sem 1',passRate:62,avgAttendance:65},{sem:'Sem 2',passRate:67,avgAttendance:68},
      {sem:'Sem 3',passRate:65,avgAttendance:67},{sem:'Sem 4',passRate:71,avgAttendance:72},
      {sem:'Sem 5',passRate:70,avgAttendance:73},{sem:'Sem 6',passRate:74,avgAttendance:76},
      {sem:'Sem 7',passRate:77,avgAttendance:78},{sem:'Sem 8',passRate:80,avgAttendance:82},
    ];
    res.json({ totalStudents:tot.total, riskDist:{high:tot.high,moderate:tot.mod,low:tot.low}, semTrend,
      policyA:{...a.toObject(),predictedPassRate:calcPR(a)}, policyB:{...b.toObject(),predictedPassRate:calcPR(b)} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FACULTY ROUTES ────────────────────────────────────────────────────────────
app.get('/api/faculty/dashboard', staffOnly, async (req, res) => {
  try {
    const dept = req.user.dept;
    const year = req.query.year ? Number(req.query.year) : null;
    const filter = { dept, ...(year && { year }) };

    const [poolAgg, yearAgg] = await Promise.all([
      Student.aggregate([
        { $match: filter },
        { $group: { _id:null, total:{$sum:1}, avgAtt:{$avg:'$attendance'}, avgInt:{$avg:'$internal'},
          high:{$sum:{$cond:[{$eq:['$risk','high']},1,0]}}, mod:{$sum:{$cond:[{$eq:['$risk','moderate']},1,0]}}, low:{$sum:{$cond:[{$eq:['$risk','low']},1,0]}} }}
      ]),
      Student.aggregate([
        { $match: { dept } },
        { $group: { _id:'$year', total:{$sum:1}, high:{$sum:{$cond:[{$eq:['$risk','high']},1,0]}},
          mod:{$sum:{$cond:[{$eq:['$risk','moderate']},1,0]}}, low:{$sum:{$cond:[{$eq:['$risk','low']},1,0]}}, avgAtt:{$avg:'$attendance'} }},
        { $sort: {_id:1} }
      ])
    ]);

    const p = poolAgg[0] || {total:0,avgAtt:0,avgInt:0,high:0,mod:0,low:0};
    const IMPROVEMENTS = {
      CSE:         ['Increase lab sessions for programming practice','Introduce peer-coding programs & hackathons','Add weekly competitive coding challenges','Consider flipped classroom for complex algorithms'],
      EEE:         ['Strengthen circuit simulation lab practice','Add project-based assessments with real hardware','Introduce industry mentor sessions monthly','Increase hands-on PCB design workshops'],
      EIE:         ['Enhance sensor & IoT lab hours by 20%','Introduce real-world instrumentation mini-projects','Add signal processing & MATLAB workshops','Connect students with automation industry partners'],
      MECHANICAL:  ['Add more CAD/CAM software training hours','Increase workshop-based practical assessments','Arrange industry plant visits each semester','Introduce 3D printing & rapid prototyping sessions'],
      MECHATRONICS:['Integrate robotics project weeks each semester','Boost interdisciplinary EE+Mechanical labs','Add Arduino/Raspberry Pi embedded systems electives','Facilitate industry internships in automation firms'],
    };

    res.json({
      dept, totalStudents:p.total,
      avgAttendance:Math.round(p.avgAtt), avgInternal:Math.round(p.avgInt), highRisk:p.high,
      riskDist:{high:p.high,moderate:p.mod,low:p.low},
      yearStats:yearAgg.map(y=>({year:y._id,total:y.total,high:y.high,moderate:y.mod,low:y.low,
        passRate:Math.round((y.low+y.mod)/y.total*100), avgAttendance:Math.round(y.avgAtt)})),
      improvements: IMPROVEMENTS[dept] || [],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faculty/risk', staffOnly, async (req, res) => {
  try {
    const dept = req.user.dept;
    const year = req.query.year ? Number(req.query.year) : null;
    const filter = { dept, ...(year && { year }) };
    const students = await Student.find(filter)
      .sort({ risk: 1, risk_score: -1 }) // high first, sorted by score
      .lean();
    // Ensure sort: high > moderate > low
    const order = { high:0, moderate:1, low:2 };
    students.sort((a,b) => order[a.risk]-order[b.risk] || b.risk_score-a.risk_score);
    res.json(students);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faculty/students', staffOnly, async (req, res) => {
  try {
    const dept = req.user.dept;
    const year = req.query.year ? Number(req.query.year) : null;
    const filter = { dept, ...(year && { year }) };
    res.json(await Student.find(filter).sort({ year:1, roll_no:1 }).lean());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faculty/student/:id', authMW, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).lean();
    if (!s) return res.status(404).json({ error: 'Student not found' });
    const recommendations = generateRecommendations(s);
    const trend = {
      attendance: [Math.max(30,s.attendance-10), Math.max(30,s.attendance-7), Math.max(30,s.attendance-4),
                   Math.max(30,s.attendance-2),  Math.max(30,s.attendance-1), s.attendance],
      internal:   [Math.max(20,s.internal-8),    Math.max(20,s.internal-5),   Math.max(20,s.internal-3),
                   Math.max(20,s.internal-1),     s.internal,                  Math.min(99,s.internal+1)],
    };
    res.json({ ...s, recommendations, trend });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faculty/intervention/:id', authMW, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).select('name risk interventions').lean();
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ studentId:s._id, name:s.name, risk:s.risk, interventions: Object.fromEntries(s.interventions || []) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/faculty/intervention/:id', staffOnly, async (req, res) => {
  try {
    const { action, status } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    if (!status || status === 'none') s.interventions.delete(action);
    else s.interventions.set(action, status);
    await s.save();
    res.json({ studentId:s._id, name:s.name, interventions: Object.fromEntries(s.interventions) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faculty/reports', staffOnly, async (req, res) => {
  try {
    const dept = req.user.dept;
    const year = req.query.year ? Number(req.query.year) : null;
    const filter = { dept, ...(year && { year }) };
    const agg = await Student.aggregate([
      { $match: filter },
      { $group: { _id:null, total:{$sum:1}, high:{$sum:{$cond:[{$eq:['$risk','high']},1,0]}},
        mod:{$sum:{$cond:[{$eq:['$risk','moderate']},1,0]}}, low:{$sum:{$cond:[{$eq:['$risk','low']},1,0]}},
        avgAtt:{$avg:'$attendance'}, avgInt:{$avg:'$internal'} }}
    ]);
    const p = agg[0] || {total:0,high:0,mod:0,low:0,avgAtt:0,avgInt:0};
    res.json({ dept, totalStudents:p.total, riskDist:{high:p.high,moderate:p.mod,low:p.low},
      avgAttendance:Math.round(p.avgAtt), avgInternal:Math.round(p.avgInt) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT);
