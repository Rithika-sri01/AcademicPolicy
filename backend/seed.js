// seed.js — Run: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Student, Policy, User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://loguritish28_db_user:uuZviPoBo1AoxoQ0@cluster0.bi95ca8.mongodb.net/rithika?retryWrites=true&w=majority';

// ── NAME POOLS ────────────────────────────────────────────────────────────────
const FIRST = ['Aarav','Aakash','Abhishek','Aditi','Aditya','Akash','Amrita','Ananya','Anjali','Ankit','Anushka','Arjun','Arvind','Asha','Avinash','Ayesha','Chaitanya','Deepa','Deepak','Devika','Dhruv','Divya','Fatima','Ganesh','Gautam','Girish','Harish','Harsha','Hemant','Ishaan','Ishita','Jaya','Jyoti','Kabir','Kalpana','Karthik','Kavita','Kavya','Kiran','Krishna','Kunal','Lakshmi','Madhav','Mahesh','Manoj','Meena','Mihir','Mohan','Nandini','Naveen','Neha','Nikhil','Nisha','Nitesh','Pallavi','Pankaj','Parth','Pavan','Pooja','Pradeep','Pranav','Preethi','Priya','Rahul','Rajesh','Rakesh','Ramesh','Ravi','Rekha','Ritesh','Rohit','Ruhi','Sachin','Sahil','Sandeep','Sangeetha','Sanjay','Sanya','Sarika','Saurabh','Seema','Shikha','Shivani','Shreya','Shruti','Shubham','Siddharth','Sneha','Sonam','Srinivas','Suresh','Surya','Swati','Tanvi','Tejas','Tushar','Uma','Vaibhav','Varsha','Venkat','Vijay','Vikram','Vinay','Vishal','Yash','Yogesh','Preeti','Mukesh','Rajeev','Suneeta','Bhavna','Chirag','Dimple','Esha','Farhan','Geeta'];
const LAST  = ['Agarwal','Anand','Arora','Banerjee','Basu','Bhat','Chauhan','Chopra','Das','Dave','Desai','Dubey','Dutta','Gandhi','Ghosh','Goswami','Gupta','Iyer','Jain','Joshi','Kapoor','Kaur','Khanna','Krishnan','Kumar','Lal','Mahajan','Malhotra','Mehta','Menon','Mishra','Mukherjee','Murthy','Nair','Narayanan','Pal','Pandey','Patel','Patil','Pillai','Prasad','Rao','Reddy','Roy','Sarkar','Saxena','Sen','Shah','Sharma','Shukla','Singh','Sinha','Srinivasan','Subramanian','Tiwari','Tripathi','Varma','Verma','Yadav','Balaji','Ganesan','Natarajan','Ramamurthy','Venkatesh','Naidu','Raju','Chakraborty','Chatterjee','Dey','Mandal','Kamath','Hegde','Kulkarni','Naik','Pawar','Kamble','Deshmukh','Thakur','Rathod','Panchal','Kothari','Bajaj','Bhatt','Choudhary','Dixit','Fernandes','Garg','Hora','Jha'];

const DEPTS  = ['CSE','EEE','EIE','MECHANICAL','MECHATRONICS'];
const PREFIX = { CSE:'CS', EEE:'EE', EIE:'EI', MECHANICAL:'ME', MECHATRONICS:'MT' };
const YSEM   = { 1:1, 2:3, 3:5, 4:7 };

// Each dept×year has a unique "personality" — varied means & stds
// This ensures data is REALISTIC & VARIED, not uniform
const PROFILES = {
  CSE: {
    1: { a:[68,14], i:[58,16], g:[65,13], f:[55,15], highBias:0.18 },
    2: { a:[72,12], i:[63,14], g:[70,12], f:[60,13], highBias:0.12 },
    3: { a:[76,11], i:[67,13], g:[74,11], f:[64,12], highBias:0.08 },
    4: { a:[79,10], i:[70,12], g:[77,10], f:[68,11], highBias:0.05 },
  },
  EEE: {
    1: { a:[64,15], i:[54,17], g:[61,14], f:[51,16], highBias:0.22 },
    2: { a:[68,13], i:[59,15], g:[65,13], f:[56,14], highBias:0.16 },
    3: { a:[72,12], i:[63,14], g:[69,12], f:[60,13], highBias:0.11 },
    4: { a:[75,11], i:[67,13], g:[73,11], f:[64,12], highBias:0.07 },
  },
  EIE: {
    1: { a:[66,14], i:[56,16], g:[63,13], f:[53,15], highBias:0.20 },
    2: { a:[70,12], i:[61,14], g:[67,12], f:[58,13], highBias:0.14 },
    3: { a:[74,11], i:[65,13], g:[71,11], f:[62,12], highBias:0.09 },
    4: { a:[77,10], i:[68,12], g:[74,10], f:[65,11], highBias:0.06 },
  },
  MECHANICAL: {
    1: { a:[60,16], i:[50,18], g:[57,15], f:[47,17], highBias:0.28 },
    2: { a:[64,14], i:[55,16], g:[61,14], f:[52,15], highBias:0.20 },
    3: { a:[68,13], i:[59,15], g:[65,13], f:[56,14], highBias:0.14 },
    4: { a:[72,12], i:[63,14], g:[69,12], f:[60,13], highBias:0.09 },
  },
  MECHATRONICS: {
    1: { a:[67,14], i:[57,16], g:[64,13], f:[54,15], highBias:0.19 },
    2: { a:[71,12], i:[62,14], g:[68,12], f:[59,13], highBias:0.13 },
    3: { a:[75,11], i:[66,13], g:[72,11], f:[63,12], highBias:0.08 },
    4: { a:[78,10], i:[69,12], g:[75,10], f:[66,11], highBias:0.05 },
  },
};

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function normalRand(mean, std, seed) {
  const u1 = seededRand(seed), u2 = seededRand(seed + 13);
  const z  = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

function calcRisk(att, int_, asgn, fin, highBias) {
  // Weighted composite score
  const score = att * 0.30 + int_ * 0.35 + asgn * 0.15 + fin * 0.20;
  // Apply dept/year bias for more varied distribution
  const biasedScore = score * (1 - highBias * 0.3);

  if (biasedScore < 44)  return { risk: 'high',     risk_score: clamp(78 + biasedScore * 0.08, 51, 99) };
  if (biasedScore < 63)  return { risk: 'moderate', risk_score: clamp(38 + biasedScore * 0.22, 18, 79) };
  return                        { risk: 'low',      risk_score: clamp(28 - biasedScore * 0.08,  2, 32) };
}

const usedNames = new Set();
function genName(seed) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const fn = FIRST[Math.floor(seededRand(seed + attempt * 7)      * FIRST.length)];
    const ln = LAST [Math.floor(seededRand(seed + attempt * 7 + 500) * LAST.length)];
    const name = `${fn} ${ln}`;
    if (!usedNames.has(name)) { usedNames.add(name); return name; }
  }
  return `Student ${seed}`; // fallback
}

async function seed() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  // Clear existing data
  await Promise.all([Student.deleteMany({}), Policy.deleteMany({}), User.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // ── USERS ──────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  await User.insertMany([
    { name:'Dr. Ramesh Kumar',   email:'admin1@college.edu',   password:hash('admin123'),   role:'admin',   dept:null },
    { name:'Dr. Priya Nair',     email:'admin2@college.edu',   password:hash('admin123'),   role:'admin',   dept:null },
    { name:'Dr. Suresh Pillai',  email:'admin3@college.edu',   password:hash('admin123'),   role:'admin',   dept:null },
    { name:'Prof. Anita Sharma', email:'faculty1@college.edu', password:hash('faculty123'), role:'faculty', dept:'CSE' },
    { name:'Prof. Kiran Das',    email:'faculty2@college.edu', password:hash('faculty123'), role:'faculty', dept:'EEE' },
    { name:'Prof. Sneha Iyer',   email:'faculty3@college.edu', password:hash('faculty123'), role:'faculty', dept:'EIE' },
    { name:'Prof. Ravi Verma',   email:'faculty4@college.edu', password:hash('faculty123'), role:'faculty', dept:'MECHANICAL' },
    { name:'Prof. Meena Reddy',  email:'faculty5@college.edu', password:hash('faculty123'), role:'faculty', dept:'MECHATRONICS' },
  ]);
  console.log('👥 Users created (3 admin + 5 faculty)');

  // ── POLICIES ───────────────────────────────────────────────────────────────
  await Policy.insertMany([
    { name:'A', attendancePolicy:30, internalWeight:40, finalExamWeight:20, continuousAssessment:5, remedialIntervention:5 },
    { name:'B', attendancePolicy:30, internalWeight:40, finalExamWeight:20, continuousAssessment:5, remedialIntervention:5 },
  ]);
  console.log('📋 Policies A & B created');

  // ── STUDENTS (2500) ────────────────────────────────────────────────────────
  const students = [];
  let sid = 1, ns = 1;

  for (const dept of DEPTS) {
    const px = PREFIX[dept];
    for (const year of [1, 2, 3, 4]) {
      const by  = 2024 - (year - 1);
      const sem = YSEM[year];
      const p   = PROFILES[dept][year];

      for (let i = 1; i <= 125; i++) {
        // Each student gets unique seed — truly varied values
        const seed = ns;
        const att  = clamp(normalRand(p.a[0], p.a[1], seed),      30, 99);
        const int_ = clamp(normalRand(p.i[0], p.i[1], seed + 1),  20, 99);
        const asgn = clamp(normalRand(p.g[0], p.g[1], seed + 2),  20, 99);
        const fin  = clamp(normalRand(p.f[0], p.f[1], seed + 3),  20, 99);

        const { risk, risk_score } = calcRisk(att, int_, asgn, fin, p.highBias);
        const name    = genName(ns);
        const roll_no = `${px}${by}Y${year}${String(i).padStart(3,'0')}`;

        students.push({ roll_no, name, dept, year, sem, attendance:att, internal:int_, assignment:asgn, final_exam:fin, risk, risk_score });
        ns += 17; // stride of 17 — more randomness
        sid++;
      }
    }
  }

  // Bulk insert in batches of 500
  for (let i = 0; i < students.length; i += 500) {
    await Student.insertMany(students.slice(i, i + 500));
    console.log(`   Inserted students ${i+1}–${Math.min(i+500, students.length)}`);
  }

  // Print distribution summary
  const total = await Student.countDocuments();
  const high  = await Student.countDocuments({ risk:'high' });
  const mod   = await Student.countDocuments({ risk:'moderate' });
  const low   = await Student.countDocuments({ risk:'low' });

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Total students : ${total}`);
  console.log(`   High risk      : ${high}  (${(high/total*100).toFixed(1)}%)`);
  console.log(`   Moderate risk  : ${mod}   (${(mod/total*100).toFixed(1)}%)`);
  console.log(`   Low risk       : ${low}   (${(low/total*100).toFixed(1)}%)`);

  await mongoose.disconnect();
  console.log('\n🎉 Database ready! Now run: node server.js');
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
