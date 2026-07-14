import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma, { uid } from './config/db';

const SAMPLE_QUESTIONS = [
  { text: 'Define prompt engineering and explain its significance in the context of large language models. Describe at least three key principles that make a prompt effective.', modelAnswer: 'Prompt engineering is the practice of designing and refining inputs to AI language models to elicit desired outputs. It is significant because the quality of the prompt directly affects the quality, accuracy, and relevance of the model output. Key principles include: (1) Clarity and specificity — prompts should be unambiguous and precise; (2) Context provision — providing relevant background information helps the model understand the task; (3) Output formatting — specifying the desired format constrains the response appropriately; (4) Role assignment — instructing the model to act as an expert improves domain-specific responses.', rubric: 'Award marks for: correct definition (2), explanation of significance (2), each valid principle with explanation (2 each, max 6). Total: 10 marks.', marks: 10 },
  { text: 'Compare and contrast zero-shot, one-shot, and few-shot prompting techniques. Provide a concrete example of each technique applied to a text classification task.', modelAnswer: 'Zero-shot prompting asks the model to perform a task without any examples. One-shot provides one example. Few-shot provides multiple examples. For text classification: Zero-shot — "Classify as positive or negative: The product is amazing"; One-shot — provide one labeled example then the target; Few-shot — three or more labeled examples before target. Few-shot generally yields the highest accuracy for novel tasks.', rubric: 'Correct definition of each technique (2 each = 6), concrete example for each (1 each = 3), comparative analysis (1). Total: 10 marks.', marks: 10 },
  { text: 'Explain the concept of chain-of-thought prompting. How does it improve reasoning in large language models? Discuss potential limitations of this technique.', modelAnswer: 'Chain-of-thought (CoT) prompting encourages models to generate intermediate reasoning steps before arriving at an answer, mimicking human step-by-step thinking. It improves reasoning by making implicit reasoning explicit, reducing errors in multi-step problems, and allowing self-correction. Limitations include: increased token usage and cost, risk of hallucinated reasoning steps, and reduced benefit for simple tasks.', rubric: 'Definition and mechanism (3), improvement explanation with example (4), at least two limitations (2), clarity (1). Total: 10 marks.', marks: 10 },
  { text: 'What are hallucinations in large language models, and how can prompt engineering strategies mitigate them? Provide at least three mitigation strategies with examples.', modelAnswer: 'Hallucinations are cases where an LLM generates factually incorrect or fabricated information with confidence. Mitigation strategies: (1) Retrieval-Augmented Generation (RAG) — grounding prompts in factual retrieved documents; (2) Explicit uncertainty instruction — "If unsure, say I do not know"; (3) Source citation requirements — asking the model to cite sources; (4) Verification prompts — "Double-check your answer"; (5) Temperature reduction — lower temperature yields more conservative outputs.', rubric: 'Clear definition (2), each mitigation strategy with example (2 each = 6), quality of explanation (2). Total: 10 marks.', marks: 10 },
  { text: 'Describe the role of system prompts in AI-powered applications. How do they differ from user prompts? Discuss ethical considerations when designing system prompts for consumer-facing AI products.', modelAnswer: 'System prompts are pre-configured instructions establishing the model\'s persona, constraints, tone, and scope — set by the developer. They differ from user prompts in being persistent, hidden, and defining behavioral guardrails. Ethical considerations: transparency (should users know?), manipulation risk, data privacy (may expose business logic), and bias injection (discriminatory assumptions).', rubric: 'Accurate definition and distinction (3), real-world example (2), at least three ethical considerations (4), coherence (1). Total: 10 marks.', marks: 10 },
  { text: 'Explain the ReAct (Reasoning + Acting) prompting framework. How does it combine reasoning traces with tool use in AI agents? Provide an example use case where ReAct outperforms standard prompting.', modelAnswer: 'ReAct interleaves reasoning traces (Thought) with task-specific actions (Act) and observations (Observe). Unlike pure chain-of-thought, ReAct allows the model to interact with external tools mid-reasoning. Example: a research assistant needing current facts — standard CoT might hallucinate; ReAct prompts the model to search the web, observe results, then synthesize an accurate answer.', rubric: 'ReAct definition and components (3), comparison with CoT (2), clear worked example (3), use case analysis (2). Total: 10 marks.', marks: 10 },
  { text: 'What is prompt injection and why is it a security concern for AI-powered applications? Describe two types of prompt injection attacks and propose defenses for each.', modelAnswer: 'Prompt injection is an attack where malicious input overrides system instructions. Types: (1) Direct injection — user input containing "Ignore previous instructions"; defense: input validation, instruction hierarchy. (2) Indirect injection — malicious instructions in external documents the model retrieves; defense: sandboxing tool outputs, separate trusted instruction channels. Both require defense-in-depth: input sanitization, output filtering.', rubric: 'Clear definition and concern (3), two distinct attack types (2 each = 4), defense for each (2), analysis quality (1). Total: 10 marks.', marks: 10 },
  { text: 'Discuss the importance of temperature and top-p (nucleus sampling) parameters in language model generation. How should these parameters be tuned for different tasks such as creative writing versus technical documentation?', modelAnswer: 'Temperature controls randomness: high values (>1.0) = more diverse; low values (<0.3) = deterministic. Top-p limits selection to tokens whose cumulative probability exceeds p. Tuning: Creative writing — high temperature (0.8–1.2), high top-p (0.9); Technical documentation — low temperature (0.1–0.3), low top-p (0.5–0.7); Chatbots — moderate (0.5–0.7). Miscalibration increases hallucination risk.', rubric: 'Temperature explanation (3), top-p explanation (2), task-specific tuning (3), risk analysis (2). Total: 10 marks.', marks: 10 },
];

async function seed() {
  console.log('🌱 Seeding GTEC database...\n');

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@gtec.edu';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@GTEC2024';
  const adminName = process.env.ADMIN_SEED_NAME || 'GTEC Administrator';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        id: '00000000-admin-0000-0000-000000000000',
        role: 'admin', name: adminName, email: adminEmail,
        username: 'admin', passwordHash,
        examStatus: 'not_started', registeredAt: new Date().toISOString(),
      }
    });
    console.log(`✅ Admin seeded: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  const questionsCount = await prisma.question.count();
  if (questionsCount === 0) {
    const qs = SAMPLE_QUESTIONS.map(q => ({
      ...q, id: `q-${Math.random().toString(36).slice(2, 10)}`,
      createdBy: '00000000-admin-0000-0000-000000000000',
      createdAt: new Date().toISOString(),
    }));
    await prisma.question.createMany({ data: qs });
    console.log(`✅ Seeded ${qs.length} sample questions`);
  } else {
    console.log(`ℹ️  Questions already exist (${questionsCount} found) — skipping`);
  }
  
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        id: 'singleton',
        timerDurationMinutes: 60,
        questionsPerExam: 5,
        minWordCount: 250,
        maxViolationsBeforeAutoSubmit: 5
      }
    });
  }

  console.log('\n🎓 GTEC database seeded successfully!');
  console.log('─'.repeat(50));
  console.log(`Admin Login : ${adminEmail}`);
  console.log(`Password   : ${adminPassword}`);
  console.log('─'.repeat(50));
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
