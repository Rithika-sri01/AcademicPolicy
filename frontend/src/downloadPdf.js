// downloadPdf.js — generates real .pdf file using jsPDF (no print dialog)
import { jsPDF } from 'jspdf';

// ── COLOURS ───────────────────────────────────────────────────────────────────
const COL = {
  purple:   [123, 82,  184],
  purpleLt: [237, 232, 255],
  text:     [42,  31,  46 ],
  text2:    [74,  61,  84 ],
  muted:    [154, 142, 168],
  green:    [46,  155, 106],
  greenLt:  [228, 248, 239],
  red:      [201, 107, 132],
  redLt:    [255, 232, 238],
  amber:    [184, 134, 11 ],
  amberLt:  [255, 248, 224],
  sky:      [40,  114, 184],
  border:   [229, 217, 248],
  rowAlt:   [250, 248, 255],
  white:    [255, 255, 255],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function setFont(doc, size, style, color) {
  doc.setFontSize(size);
  doc.setFont('helvetica', style || 'normal');
  doc.setTextColor(...(color || COL.text));
}

function drawRect(doc, x, y, w, h, color, radius) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, h, radius || 3, radius || 3, 'F');
}

function drawHeader(doc, title) {
  drawRect(doc, 0, 0, 210, 30, COL.purple, 0);
  setFont(doc, 16, 'bold', COL.white);
  doc.text('AcadPredict', 14, 12);
  setFont(doc, 9, 'normal', [200, 185, 240]);
  doc.text('Predictive Academic Policy Analyzer', 14, 19);
  setFont(doc, 11, 'bold', COL.white);
  doc.text(title, 196, 12, { align: 'right' });
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  setFont(doc, 8, 'normal', [200, 185, 240]);
  doc.text('Generated: ' + now, 196, 19, { align: 'right' });
}

function drawFooter(doc, pageNum, totalPages) {
  const y = 290;
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);
  setFont(doc, 8, 'normal', COL.muted);
  doc.text('AcadPredict v3  ·  MongoDB + Node.js + React', 14, y + 5);
  doc.text('Page ' + pageNum + ' of ' + totalPages, 196, y + 5, { align: 'right' });
}

function drawSectionTitle(doc, text, y) {
  drawRect(doc, 14, y, 182, 8, COL.purpleLt, 2);
  setFont(doc, 10, 'bold', COL.purple);
  doc.text(text, 18, y + 5.5);
  return y + 13;
}

function drawStatBoxes(doc, stats, y) {
  const boxW = 182 / stats.length;
  stats.forEach(function(item, i) {
    var label = item[0], value = item[1], color = item[2];
    var x = 14 + i * boxW;
    drawRect(doc, x + 1, y, boxW - 2, 22, COL.purpleLt, 3);
    setFont(doc, 16, 'bold', color || COL.purple);
    doc.text(String(value), x + boxW / 2, y + 11, { align: 'center' });
    setFont(doc, 7, 'bold', COL.muted);
    doc.text(label.toUpperCase(), x + boxW / 2, y + 17, { align: 'center' });
  });
  return y + 28;
}

function drawTable(doc, headers, rows, y, startPage) {
  var colW = 182 / headers.length;
  var curY = y;
  var page = startPage;

  drawRect(doc, 14, curY, 182, 8, COL.purple, 2);
  headers.forEach(function(h, i) {
    setFont(doc, 8, 'bold', COL.white);
    doc.text(h, 16 + i * colW, curY + 5.5);
  });
  curY += 9;

  rows.forEach(function(row, ri) {
    if (curY > 275) {
      doc.addPage();
      page++;
      drawHeader(doc, '(continued)');
      curY = 38;
    }
    if (ri % 2 === 0) drawRect(doc, 14, curY, 182, 8, COL.rowAlt, 0);
    row.forEach(function(cell, ci) {
      var text, color;
      if (typeof cell === 'object' && cell !== null) {
        text = cell.text; color = cell.color;
      } else {
        text = String(cell); color = COL.text2;
      }
      setFont(doc, 8, 'normal', color);
      doc.text(String(text), 16 + ci * colW, curY + 5.5, { maxWidth: colW - 3 });
    });
    curY += 9;
  });

  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.3);
  doc.line(14, curY, 196, curY);
  return { y: curY + 4, page: page };
}

function riskCell(risk) {
  var map = {
    high:     { text: 'High',     color: COL.red   },
    moderate: { text: 'Moderate', color: COL.amber  },
    low:      { text: 'Low',      color: COL.green  },
  };
  return map[risk] || map.low;
}

function savePDF(doc, name) {
  var filename = name.replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(filename);
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export function downloadPDF(title, _html, type, data) {
  if (type === 'semester') { buildSemesterPDF(data.semTrend);                           return; }
  if (type === 'policy')   { buildPolicyPDF(data.pa, data.pb);                          return; }
  if (type === 'dept')     { buildDeptPDF(data.deptStats);                              return; }
  if (type === 'course')   { buildCoursePDF(data.students, data.dept, data.year);       return; }
  if (type === 'progress') { buildProgressPDF(data.students, data.dept);                return; }
}

// ── 1. SEMESTER REPORT ────────────────────────────────────────────────────────
function buildSemesterPDF(semTrend) {
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'Semester Performance Report');
  var y = 38;
  var avgPass = Math.round(semTrend.reduce(function(a,s){ return a+s.passRate; }, 0) / semTrend.length);
  var avgAtt  = Math.round(semTrend.reduce(function(a,s){ return a+s.avgAttendance; }, 0) / semTrend.length);
  y = drawStatBoxes(doc, [
    ['Avg Pass Rate',  avgPass + '%', COL.purple],
    ['Avg Attendance', avgAtt  + '%', COL.green],
    ['Semesters',      semTrend.length,  COL.sky],
  ], y);
  y = drawSectionTitle(doc, 'Semester-wise Performance', y);
  var rows = semTrend.map(function(s) {
    return [
      s.sem,
      { text: s.passRate + '%',       color: s.passRate >= 75 ? COL.green : s.passRate >= 60 ? COL.amber : COL.red },
      { text: s.avgAttendance + '%',  color: s.avgAttendance >= 75 ? COL.green : COL.red },
      { text: s.passRate >= 75 ? 'Good' : s.passRate >= 60 ? 'Average' : 'Needs Work',
        color: s.passRate >= 75 ? COL.green : s.passRate >= 60 ? COL.amber : COL.red },
    ];
  });
  drawTable(doc, ['Semester', 'Pass Rate', 'Avg Attendance', 'Status'], rows, y, 1);
  drawFooter(doc, 1, 1);
  savePDF(doc, 'Semester_Performance_Report');
}

// ── 2. POLICY REPORT ──────────────────────────────────────────────────────────
function buildPolicyPDF(pa, pb) {
  var doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'Policy Comparison Report');
  var diff = pb.predictedPassRate - pa.predictedPassRate;
  var y = 38;
  y = drawStatBoxes(doc, [
    ['Policy A Pass Rate', pa.predictedPassRate + '%', COL.sky],
    ['Policy B Pass Rate', pb.predictedPassRate + '%', COL.purple],
    ['Difference', (diff > 0 ? '+' : '') + diff + '%', diff > 0 ? COL.green : diff < 0 ? COL.red : COL.muted],
  ], y);
  y = drawSectionTitle(doc, 'Policy Parameter Comparison', y);
  var keys = [
    ['attendancePolicy',     'Attendance Policy'],
    ['internalWeight',       'Internal Weight'],
    ['finalExamWeight',      'Final Exam Weight'],
    ['continuousAssessment', 'Continuous Assessment'],
    ['remedialIntervention', 'Remedial Intervention'],
  ];
  var rows = keys.map(function(item) {
    var k = item[0], l = item[1];
    var d = pb[k] - pa[k];
    return [l, pa[k] + '%', pb[k] + '%', { text: (d > 0 ? '+' : '') + d + '%', color: d > 0 ? COL.green : d < 0 ? COL.red : COL.muted }];
  });
  var res = drawTable(doc, ['Parameter', 'Policy A', 'Policy B', 'Change'], rows, y, 1);
  y = drawSectionTitle(doc, 'AI Recommendation', res.y + 4);
  var rec = diff > 5  ? 'Policy B significantly improves pass rate. Recommend full adoption.'
          : diff > 0  ? 'Policy B shows marginal improvement. Continue monitoring.'
          : diff === 0? 'Both policies are equivalent. Consider adjusting Policy B sliders.'
          :             'Policy B underperforms. Re-tune internal weight and remedial intervention.';
  drawRect(doc, 14, y, 182, 16, diff > 0 ? COL.greenLt : diff < 0 ? COL.redLt : COL.purpleLt, 3);
  setFont(doc, 9, 'normal', diff > 0 ? COL.green : diff < 0 ? COL.red : COL.purple);
  doc.text(rec, 18, y + 6, { maxWidth: 174 });
  drawFooter(doc, 1, 1);
  savePDF(doc, 'Policy_Comparison_Report');
}

// ── 3. DEPARTMENT REPORT ──────────────────────────────────────────────────────
function buildDeptPDF(deptStats) {
  var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'Department Analytics Report');
  var depts = Object.keys(deptStats);
  var y = 38;
  var totalStudents = depts.reduce(function(a, d) { return a + deptStats[d].totalStudents; }, 0);
  var avgPass       = Math.round(depts.reduce(function(a, d) { return a + deptStats[d].passRate; }, 0) / depts.length);
  var totalRisk     = depts.reduce(function(a, d) { return a + (deptStats[d].riskCount || 0); }, 0);
  y = drawStatBoxes(doc, [
    ['Total Students', totalStudents, COL.purple],
    ['Avg Pass Rate',  avgPass + '%', COL.green],
    ['Total High Risk',totalRisk,     COL.red],
    ['Departments',    depts.length,  COL.sky],
  ], y);
  y = drawSectionTitle(doc, 'Department-wise Summary', y);
  var rows = depts.map(function(d) {
    var v = deptStats[d];
    return [
      { text: d, color: COL.purple },
      v.totalStudents,
      { text: v.passRate + '%',       color: v.passRate >= 80 ? COL.green : v.passRate >= 65 ? COL.amber : COL.red },
      { text: v.avgAttendance + '%',  color: v.avgAttendance >= 75 ? COL.green : COL.red },
      { text: v.riskCount || 0,       color: COL.red },
      { text: v.passRate >= 80 ? 'Excellent' : v.passRate >= 65 ? 'Average' : 'Needs Help',
        color: v.passRate >= 80 ? COL.green : v.passRate >= 65 ? COL.amber : COL.red },
    ];
  });
  drawTable(doc, ['Department', 'Students', 'Pass Rate', 'Avg Att.', 'High Risk', 'Status'], rows, y, 1);
  drawFooter(doc, 1, 1);
  savePDF(doc, 'Department_Analytics_Report');
}

// ── 4. COURSE REPORT ──────────────────────────────────────────────────────────
function buildCoursePDF(students, dept, year) {
  var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
  var label = year ? 'Year ' + year : 'All Years';
  drawHeader(doc, dept + ' Course Performance');
  var high   = students.filter(function(s){ return s.risk==='high'; }).length;
  var mod    = students.filter(function(s){ return s.risk==='moderate'; }).length;
  var low    = students.filter(function(s){ return s.risk==='low'; }).length;
  var avgAtt = students.length ? Math.round(students.reduce(function(a,s){ return a+s.attendance;},0)/students.length) : 0;
  var avgInt = students.length ? Math.round(students.reduce(function(a,s){ return a+s.internal;},0)/students.length)   : 0;
  var y = 38;
  setFont(doc, 9, 'normal', COL.muted);
  doc.text('Department: ' + dept + '   |   Filter: ' + label + '   |   Total: ' + students.length + ' students', 14, y);
  y += 8;
  y = drawStatBoxes(doc, [
    ['Total',     students.length, COL.purple],
    ['High Risk', high,   COL.red],
    ['Moderate',  mod,    COL.amber],
    ['Low Risk',  low,    COL.green],
    ['Avg Att.',  avgAtt + '%', COL.sky],
    ['Avg Int.',  avgInt + '%', COL.purple],
  ], y);
  y = drawSectionTitle(doc, 'Student Details', y);
  var page = 1;
  var CHUNK = 25;
  for (var i = 0; i < students.length; i += CHUNK) {
    if (i > 0) { doc.addPage(); page++; drawHeader(doc, dept + ' Course Performance (continued)'); y = 38; }
    var chunk = students.slice(i, i + CHUNK);
    var rows  = chunk.map(function(s) {
      return [
        { text: s.name,       color: COL.text },
        { text: s.roll_no,    color: COL.muted },
        'Y' + s.year,
        { text: s.attendance + '%', color: s.attendance < 65 ? COL.red : COL.green },
        s.internal + '%',
        s.assignment + '%',
        s.final_exam + '%',
        riskCell(s.risk),
      ];
    });
    var res = drawTable(doc, ['Name','Roll No','Yr','Att.','Int.','Assign.','Final','Risk'], rows, y, page);
    y = res.y; page = res.page;
  }
  for (var p = 1; p <= page; p++) { doc.setPage(p); drawFooter(doc, p, page); }
  savePDF(doc, dept + '_Course_Performance_Report');
}

// ── 5. PROGRESS REPORT ────────────────────────────────────────────────────────
function buildProgressPDF(students, dept) {
  var doc    = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, dept + ' Student Progress Report');
  var atRisk = students.filter(function(s){ return s.risk !== 'low'; });
  var y = 38;
  setFont(doc, 9, 'normal', COL.muted);
  doc.text('Department: ' + dept + '   |   At-risk students: ' + atRisk.length, 14, y);
  y += 10;
  y = drawSectionTitle(doc, 'Improvement Action Plan', y);
  var rows = atRisk.map(function(s) {
    var tips = [];
    if (s.attendance < 75) tips.push('Improve attendance (' + s.attendance + '% to 75%+)');
    if (s.internal < 65)   tips.push('Boost internal marks (' + s.internal + '% to 65%+)');
    if (s.assignment < 70) tips.push('Complete assignments (' + s.assignment + '%)');
    if (s.final_exam < 60) tips.push('Enroll in remedial classes');
    return [
      { text: s.name,    color: COL.text },
      { text: s.roll_no, color: COL.muted },
      riskCell(s.risk),
      { text: tips.join(' | ') || 'Monitor progress', color: COL.text2 },
    ];
  });
  var res = drawTable(doc, ['Student', 'Roll No', 'Risk', 'Recommended Actions'], rows, y, 1);
  var page = res.page;
  for (var p = 1; p <= page; p++) { doc.setPage(p); drawFooter(doc, p, page); }
  savePDF(doc, dept + '_Progress_Report');
}

// ── UNUSED LEGACY STUBS (required by old imports, safe to ignore) ─────────────
export function buildSemesterReport()       {}
export function buildPolicyReport()         {}
export function buildDeptReport()           {}
export function buildFacultyCourseReport()  {}
export function buildProgressReport()       {}
