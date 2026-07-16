import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { uid } from '../config/db';
import { shuffleArray } from '../services/shuffle';
import { evaluateAnswer } from '../services/geminiEvaluator';
import User from '../models/User';
import Question from '../models/Question';
import ExamSession from '../models/ExamSession';
import Answer from '../models/Answer';
import Settings from '../models/Settings';

const router = Router();
router.use(authenticateToken, requireRole('examiner'));

async function getOrCreateSettings() {
  let s = await Settings.findById('singleton');
  if (!s) {
    s = await Settings.create({ _id: 'singleton', timerDurationMinutes: 60, questionsPerExam: 1, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 });
  }
  return s;
}

// GET /api/exam/settings
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  const s = await getOrCreateSettings();
  return res.json(s);
});

// POST /api/exam/start
router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const examinerId = req.user!.id;
    const settings = await getOrCreateSettings();

    let session = await ExamSession.findOne({ examinerId }).sort({ startTime: -1 });

    if (session && session.status === 'in_progress') {
      let qOrder: string[] = [];
      try { qOrder = JSON.parse(session.questionOrder); } catch (e) { }
      const allQuestions = await Question.find({ _id: { $in: qOrder } });
      const ordered = qOrder.map((id: string) => allQuestions.find((q: any) => String(q._id) === id)).filter(Boolean);
      const mappedQs = ordered.map((q: any) => ({ id: q._id, text: q.text, rubric: q.rubric, marks: q.marks }));
      const elapsed = Date.now() - new Date(session.startTime!).getTime();
      const remainingMs = Math.max(0, (session.durationMinutes * 60 * 1000) - elapsed);
      
      const answers = await Answer.find({ sessionId: String(session._id) });
      const answersMap = answers.reduce((acc: any, a: any) => { acc[a.questionId] = a.answerText; return acc; }, {});

      return res.json({
        session: { id: session._id, startTime: session.startTime, durationMinutes: session.durationMinutes, remainingMs, status: session.status, violationCount: session.violationCount },
        questions: mappedQs,
        answers: answersMap
      });
    }

    if (session && ['completed', 'auto_submitted', 'time_expired'].includes(session.status)) {
      return res.status(409).json({ message: 'Exam already completed' });
    }

    const allQs = await Question.find({}, '_id');
    const allQsIds = allQs.map(q => String(q._id));

    if (allQsIds.length < settings.questionsPerExam) {
      return res.status(400).json({ message: `Not enough questions. Need ${settings.questionsPerExam}, found ${allQsIds.length}` });
    }

    const shuffled = shuffleArray(allQsIds);
    const selected = shuffled.slice(0, settings.questionsPerExam);
    const sessionId = uid();
    const now = new Date().toISOString();

    await ExamSession.create({
      _id: sessionId,
      examinerId,
      questionOrder: JSON.stringify(selected),
      startTime: now,
      status: 'in_progress',
      violationCount: 0,
      violationLog: '[]',
      durationMinutes: settings.timerDurationMinutes,
    });

    await User.findByIdAndUpdate(examinerId, { examStatus: 'in_progress' });

    const questions = await Question.find({ _id: { $in: selected } });
    const ordered = selected.map((id: string) => questions.find((q: any) => String(q._id) === id)).filter(Boolean);
    const mappedQs = ordered.map((q: any) => ({ id: q._id, text: q.text, rubric: q.rubric, marks: q.marks }));

    return res.status(201).json({
      session: { id: sessionId, startTime: now, durationMinutes: settings.timerDurationMinutes, remainingMs: settings.timerDurationMinutes * 60 * 1000, status: 'in_progress', violationCount: 0 },
      questions: mappedQs,
    });
  } catch (error: any) {
    console.error('Exam start error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/exam/session
router.get('/session', async (req: AuthRequest, res: Response) => {
  const session = await ExamSession.findOne({ examinerId: req.user!.id }).sort({ startTime: -1 });
  if (!session) return res.status(404).json({ message: 'No exam session found' });

  const elapsed = session.startTime ? Date.now() - new Date(session.startTime).getTime() : 0;
  const remainingMs = Math.max(0, (session.durationMinutes * 60 * 1000) - elapsed);
  let qCount = 0;
  try { qCount = JSON.parse(session.questionOrder).length; } catch (e) { }

  return res.json({
    id: session._id, startTime: session.startTime, durationMinutes: session.durationMinutes,
    remainingMs, status: session.status, violationCount: session.violationCount, questionCount: qCount,
  });
});

// POST /api/exam/answer
router.post('/answer', async (req: AuthRequest, res: Response) => {
  try {
    const examinerId = req.user!.id;
    const { questionId, answerText } = req.body;
    if (!questionId || answerText === undefined) return res.status(400).json({ message: 'questionId and answerText required' });

    const session = await ExamSession.findOne({ examinerId, status: 'in_progress' }).sort({ startTime: -1 });
    if (!session) return res.status(403).json({ message: 'No active exam session' });

    const elapsed = Date.now() - new Date(session.startTime!).getTime();
    if (elapsed > session.durationMinutes * 60 * 1000 + 30000) {
      await ExamSession.findByIdAndUpdate(session._id, { status: 'time_expired' });
      return res.status(403).json({ message: 'Exam time has expired' });
    }

    const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
    const settings = await getOrCreateSettings();

    const existing = await Answer.findOne({ sessionId: String(session._id), questionId });
    if (existing) {
      await Answer.findByIdAndUpdate(existing._id, { answerText: answerText.trim(), wordCount });
    } else {
      await Answer.create({
        _id: uid(),
        sessionId: String(session._id),
        questionId,
        examinerId,
        answerText: answerText.trim(),
        wordCount,
        isGraded: false,
      });
    }

    return res.json({ saved: true, wordCount, meetsMinimum: wordCount >= (settings?.minWordCount || 250), minWordCount: settings?.minWordCount || 250 });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/exam/submit
router.post('/submit', async (req: AuthRequest, res: Response) => {
  try {
    const examinerId = req.user!.id;
    const session = await ExamSession.findOne({ examinerId }).sort({ startTime: -1 });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (['completed', 'auto_submitted'].includes(session.status)) return res.status(409).json({ message: 'Already submitted' });

    const elapsed = Date.now() - new Date(session.startTime!).getTime();
    const isExpired = elapsed > session.durationMinutes * 60 * 1000 + 60000;
    const finalStatus = req.body.autoSubmit || isExpired ? 'auto_submitted' : 'completed';
    const now = new Date().toISOString();

    await ExamSession.findByIdAndUpdate(session._id, { status: finalStatus, endTime: now });
    await User.findByIdAndUpdate(examinerId, { examStatus: 'completed' });

    const answers = await Answer.find({ sessionId: String(session._id) });
    let qOrder: string[] = [];
    try { qOrder = JSON.parse(session.questionOrder); } catch (e) { }
    const questions = await Question.find({ _id: { $in: qOrder } });

    // AI Evaluation is now triggered manually by admins.

    return res.json({
      message: 'Exam submitted. Your answers are being evaluated.',
      status: finalStatus, submittedAt: now,
      answeredCount: answers.length, totalQuestions: qOrder.length,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/exam/violation
router.post('/violation', async (req: AuthRequest, res: Response) => {
  const session = await ExamSession.findOne({ examinerId: req.user!.id }).sort({ startTime: -1 });
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const newCount = session.violationCount + 1;
  let currentLog: any[] = [];
  try { currentLog = JSON.parse(session.violationLog); } catch (e) { }
  const log = [...currentLog, { type: req.body.type || 'unknown', timestamp: new Date().toISOString() }];

  await ExamSession.findByIdAndUpdate(session._id, { violationCount: newCount, violationLog: JSON.stringify(log) });

  const settings = await getOrCreateSettings();
  const maxV = settings?.maxViolationsBeforeAutoSubmit || 5;
  return res.json({ violationCount: newCount, autoSubmit: newCount >= maxV, maxViolations: maxV });
});

// GET /api/exam/result
router.get('/result', async (req: AuthRequest, res: Response) => {
  const session = await ExamSession.findOne({ examinerId: req.user!.id }).sort({ startTime: -1 });
  if (!session) return res.status(404).json({ message: 'No session found' });

  const answers = await Answer.find({ sessionId: String(session._id) });
  const questions = await Question.find();

  const enriched = answers.map((a: any) => {
    const q = questions.find((q: any) => String(q._id) === a.questionId);
    return { questionId: { text: q?.text, marks: q?.marks }, answerText: a.answerText, wordCount: a.wordCount, aiScore: a.aiScore, aiFeedback: a.aiFeedback, isGraded: a.isGraded };
  });

  const gradedAnswers = answers.filter((a: any) => a.isGraded);
  const totalScore = gradedAnswers.reduce((s: number, a: any) => s + (a.aiScore || 0), 0);
  const maxScore = answers.reduce((s: number, a: any) => {
    const q = questions.find((q: any) => String(q._id) === a.questionId);
    return s + (q?.marks || 10);
  }, 0);

  // Global rank
  const allSessions = await ExamSession.find();
  const sessionScores = await Promise.all(allSessions.map(async (s: any) => {
    const sa = await Answer.find({ sessionId: String(s._id) });
    const score = sa.reduce((acc: number, a: any) => acc + (a.adminOverrideScore !== null && a.adminOverrideScore !== undefined ? a.adminOverrideScore : (a.aiScore || 0)), 0);
    return { examinerId: s.examinerId, score };
  }));
  sessionScores.sort((a, b) => b.score - a.score);
  let rank = 0;
  for (let i = 0; i < sessionScores.length; i++) {
    if (sessionScores[i].examinerId === req.user!.id) { rank = i + 1; break; }
  }

  return res.json({
    status: session.status,
    isGrading: answers.some((a: any) => !a.isGraded && a.answerText.trim()),
    totalScore, maxScore,
    percentage: maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0',
    rank, totalStudents: sessionScores.length,
    answers: enriched,
  });
});

// Helper: async grading
async function gradeAllAnswers(answers: any[], questions: any[]) {
  for (const answer of answers) {
    if (!answer.answerText.trim()) continue;
    try {
      const question = questions.find((q: any) => String(q._id) === answer.questionId);
      if (!question) continue;
      const result = await evaluateAnswer(answer.answerText, question.text, question.modelAnswer, question.rubric, question.marks);
      const finalScore = result.accuracyPercentage != null ? (result.accuracyPercentage / 100) * question.marks : result.score;
      await Answer.findByIdAndUpdate(answer._id, {
        aiScore: finalScore,
        accuracyPercentage: result.accuracyPercentage,
        matchedPoints: JSON.stringify(result.matchedPoints || []),
        missingPoints: JSON.stringify(result.missingPoints || []),
        aiFeedback: result.feedback,
        isGraded: true,
        gradingError: result.gradingError || false,
        submittedAt: new Date().toISOString()
      });
    } catch (err) { console.error(`Grade failed for ${answer._id}:`, err); }
  }
  console.log('✅ AI grading complete');
}

export default router;
