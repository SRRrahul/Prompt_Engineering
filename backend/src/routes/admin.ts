import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { uid } from '../config/db';
import { parse } from 'csv-parse/sync';
import User from '../models/User';
import Question from '../models/Question';
import ExamSession from '../models/ExamSession';
import Answer from '../models/Answer';
import Settings from '../models/Settings';
import { evaluateAnswer } from '../services/geminiEvaluator';

const router = Router();
router.use(authenticateToken, requireRole('admin'));

async function getOrCreateSettings() {
  let s = await Settings.findById('singleton');
  if (!s) {
    s = await Settings.create({ _id: 'singleton', timerDurationMinutes: 60, questionsPerExam: 1, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 });
  }
  return s;
}

// GET /api/admin/examiners
router.get('/examiners', async (_req: AuthRequest, res: Response) => {
  const users = await User.find({ role: 'examiner' });
  const enriched = await Promise.all(users.map(async (u: any) => {
    const session = await ExamSession.findOne({ examinerId: String(u._id) }).sort({ startTime: -1 });
    return {
      id: u._id, name: u.name, email: u.email, username: u.username,
      department: u.department, registeredAt: u.registeredAt, examStatus: u.examStatus,
      session: session ? { status: session.status, startTime: session.startTime, endTime: session.endTime, violationCount: session.violationCount } : null,
    };
  }));
  return res.json(enriched);
});

// GET /api/admin/questions
router.get('/questions', async (_req: AuthRequest, res: Response) => {
  const questions = await Question.find();
  return res.json(questions);
});

// POST /api/admin/questions
router.post('/questions', async (req: AuthRequest, res: Response) => {
  const { text, modelAnswer, rubric, marks } = req.body;
  if (!text || !modelAnswer || !rubric) return res.status(400).json({ message: 'text, modelAnswer, and rubric are required' });
  const q = await Question.create({
    _id: uid(), text: text.trim(), modelAnswer: modelAnswer.trim(),
    rubric: rubric.trim(), marks: marks || 10,
    createdBy: req.user!.id, createdAt: new Date().toISOString()
  });
  return res.status(201).json(q);
});

// POST /api/admin/questions/bulk
router.post('/questions/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { data, format } = req.body;
    if (!data) return res.status(400).json({ message: 'No data provided' });
    let records: any[] = format === 'json' ? JSON.parse(data) : parse(data, { columns: true, skip_empty_lines: true, trim: true });
    const questions = records.map((r: any) => ({
      _id: uid(),
      text: r.text || r.question || r.Question || '',
      modelAnswer: r.modelAnswer || r.model_answer || '',
      rubric: r.rubric || r.Rubric || r.criteria || '',
      marks: Number(r.marks || 10),
      createdBy: req.user!.id, createdAt: new Date().toISOString(),
    })).filter((q: any) => q.text && q.modelAnswer);
    await Question.insertMany(questions);
    return res.status(201).json({ inserted: questions.length, questions });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { text, modelAnswer, rubric, marks } = req.body;
    const q = await Question.findByIdAndUpdate(req.params.id, { text, modelAnswer, rubric, marks }, { new: true });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    return res.json(q);
  } catch (err) { return res.status(404).json({ message: 'Question not found' }); }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Question deleted' });
  } catch (err) { return res.status(404).json({ message: 'Question not found' }); }
});

// POST /api/admin/evaluate/:sessionId
router.post('/evaluate/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const session = await ExamSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const answers = await Answer.find({ sessionId: String(session._id) });
    let qOrder: string[] = [];
    try { qOrder = JSON.parse(session.questionOrder); } catch (e) { }
    const questions = await Question.find({ _id: { $in: qOrder } });

    // Evaluate synchronously or start async job
    let evaluatedCount = 0;
    for (const answer of answers) {
      if (!answer.answerText.trim()) continue;
      const question = questions.find((q: any) => String(q._id) === answer.questionId);
      if (!question) continue;
      
      const result = await evaluateAnswer(answer.answerText, question.text, question.modelAnswer, question.rubric, question.marks);
      const finalScore = result.accuracyPercentage != null ? (result.accuracyPercentage / 100) * question.marks : result.score;
      
      await Answer.findByIdAndUpdate(answer._id, {
        aiScore: finalScore,
        aiFeedback: result.feedback,
        isGraded: true,
      });
      evaluatedCount++;
    }

    return res.json({ message: `Successfully evaluated ${evaluatedCount} answers.`, evaluatedCount });
  } catch (error: any) {
    return res.status(500).json({ message: 'Evaluation failed', error: error.message });
  }
});

// GET /api/admin/results
router.get('/results', async (_req: AuthRequest, res: Response) => {
  const examiners = await User.find({ role: 'examiner' });
  const results = await Promise.all(examiners.map(async (examiner: any) => {
    const session = await ExamSession.findOne({ examinerId: String(examiner._id) }).sort({ startTime: -1 });
    const answers = session ? await Answer.find({ sessionId: String(session._id) }) : [];
    const totalScore = answers.reduce((sum: number, a: any) => {
      const score = a.adminOverrideScore !== null && a.adminOverrideScore !== undefined ? a.adminOverrideScore : (a.aiScore || 0);
      return sum + score;
    }, 0);
    const maxScore = answers.length * 10;
    let totalQuestions = 0;
    if (session?.questionOrder) {
      try { const p = JSON.parse(session.questionOrder); totalQuestions = Array.isArray(p) ? p.length : 0; } catch (e) { }
    }
    return {
      examiner: { id: examiner._id, name: examiner.name, email: examiner.email, username: examiner.username, department: examiner.department },
      session: session ? { id: session._id, status: session.status, startTime: session.startTime, endTime: session.endTime, durationMinutes: session.durationMinutes, violationCount: session.violationCount } : null,
      totalScore, maxScore,
      percentage: maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(1)) : 0,
      answeredCount: answers.filter((a: any) => a.answerText.trim()).length,
      gradedCount: answers.filter((a: any) => a.isGraded).length, totalQuestions,
    };
  }));
  const completed = results.filter((r: any) => r.session && ['completed', 'auto_submitted'].includes(r.session.status))
    .sort((a: any, b: any) => b.totalScore - a.totalScore);
  const ranked = completed.map((r: any, i: number) => ({ ...r, rank: i + 1 }));
  return res.json({ leaderboard: ranked, all: results, winner: ranked[0] || null, runnerUp: ranked[1] || null });
});

// GET /api/admin/settings
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  return res.json(await getOrCreateSettings());
});

// GET /api/admin/answers
router.get('/answers', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', examiner = '', department = '', minScore = '', maxScore = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build examiner filter
  let examinerIds: string[] | null = null;
  if (examiner || department) {
    const userQuery: any = { role: 'examiner' };
    if (examiner) userQuery.$or = [
      { name: { $regex: examiner, $options: 'i' } },
      { username: { $regex: examiner, $options: 'i' } }
    ];
    if (department) userQuery.department = { $regex: department, $options: 'i' };
    const matchingUsers = await User.find(userQuery, '_id');
    examinerIds = matchingUsers.map((u: any) => String(u._id));
  }

  const answerQuery: any = {};
  if (examinerIds !== null) answerQuery.examinerId = { $in: examinerIds };
  if (minScore !== '' || maxScore !== '') {
    answerQuery.aiScore = {};
    if (minScore !== '') answerQuery.aiScore.$gte = parseFloat(minScore as string);
    if (maxScore !== '') answerQuery.aiScore.$lte = parseFloat(maxScore as string);
  }

  const totalCount = await Answer.countDocuments(answerQuery);
  const rawAnswers = await Answer.find(answerQuery).sort({ submittedAt: -1 }).skip(skip).limit(limitNum);

  const answers = await Promise.all(rawAnswers.map(async (a: any) => {
    const session = await ExamSession.findById(a.sessionId);
    const user = session ? await User.findById(session.examinerId, 'id name username email department') : null;
    const question = await Question.findById(a.questionId, 'id text modelAnswer rubric marks');
    return {
      ...a.toObject(),
      session: session ? { ...session.toObject(), user } : null,
      question,
    };
  }));

  return res.json({ totalCount, totalPages: Math.ceil(totalCount / limitNum), currentPage: pageNum, answers });
});

// PUT /api/admin/answers/:id/override
router.put('/answers/:id/override', async (req: AuthRequest, res: Response) => {
  try {
    const { adminOverrideScore, adminNotes } = req.body;
    const answer = await Answer.findByIdAndUpdate(req.params.id, {
      adminOverrideScore: adminOverrideScore !== null ? parseFloat(adminOverrideScore) : null,
      adminNotes: adminNotes || null
    }, { new: true });
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    return res.json(answer);
  } catch (err: any) { return res.status(404).json({ message: 'Answer not found' }); }
});

// PUT /api/admin/settings
router.put('/settings', async (req: AuthRequest, res: Response) => {
  const { timerDurationMinutes, questionsPerExam, minWordCount, maxViolationsBeforeAutoSubmit } = req.body;
  const updates: any = {};
  if (timerDurationMinutes !== undefined) updates.timerDurationMinutes = timerDurationMinutes;
  if (questionsPerExam !== undefined) updates.questionsPerExam = questionsPerExam;
  if (minWordCount !== undefined) updates.minWordCount = minWordCount;
  if (maxViolationsBeforeAutoSubmit !== undefined) updates.maxViolationsBeforeAutoSubmit = maxViolationsBeforeAutoSubmit;
  const settings = await Settings.findByIdAndUpdate('singleton', updates, { new: true, upsert: true });
  return res.json(settings);
});

// GET /api/admin/violations/:sessionId
router.get('/violations/:sessionId', async (req: AuthRequest, res: Response) => {
  const session = await ExamSession.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  const user = await User.findById(session.examinerId);
  let violationLog: any[] = [];
  try { violationLog = JSON.parse(session.violationLog); } catch (e) { }
  return res.json({ examiner: user, violationCount: session.violationCount, violationLog });
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (_req: AuthRequest, res: Response) => {
  const totalExaminers = await User.countDocuments({ role: 'examiner' });
  const totalQuestions = await Question.countDocuments();
  const sessions = await ExamSession.find();
  const completedExams = sessions.filter((s: any) => ['completed', 'auto_submitted'].includes(s.status)).length;
  const inProgress = sessions.filter((s: any) => s.status === 'in_progress').length;
  return res.json({ totalExaminers, totalQuestions, completedExams, inProgress });
});

export default router;
