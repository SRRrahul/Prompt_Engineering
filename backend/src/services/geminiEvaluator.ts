import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function evaluateAnswer(
  answerText: string,
  questionText: string,
  modelAnswer: string,
  rubric: string,
  maxMarks: number,
  isRetry = false
): Promise<{ score: number | null; feedback: string | null; accuracyPercentage?: number | null; matchedPoints?: string[]; missingPoints?: string[]; gradingError?: boolean }> {
  try {
    const prompt = `You are a strict and fair university examiner.
Your primary task is to evaluate the student's answer by DIRECTLY COMPARING it with the provided Model Answer.

Question: ${questionText}
Model Answer (Source of Truth): ${modelAnswer}
Grading Rubric: ${rubric}
Max Marks: ${maxMarks}

Student's Answer:
"${answerText}"

Carefully compare the student's answer to the model answer. Evaluate for conceptual accuracy, completeness, and relevance — not just keyword matching.

Provide your evaluation strictly as a JSON object with the following keys:
1. "accuracyPercentage": a number from 0 to 100 representing how closely the student's answer matches the model answer conceptually.
2. "score": a number representing marks awarded (should generally be accuracyPercentage / 100 * maxMarks).
3. "feedback": a short string (1-3 sentences) explaining what matched and what was missing.
4. "matchedPoints": an array of strings detailing key points from the model answer that were correctly covered.
5. "missingPoints": an array of strings detailing key points from the model answer that were missing or weak.

Format strictly like this:
{ "accuracyPercentage": 85, "score": 8.5, "feedback": "Good understanding of the core concept. However, it missed mentioning X and Y.", "matchedPoints": ["Concept A", "Concept B"], "missingPoints": ["Concept X", "Concept Y"] }
Do not include any Markdown formatting blocks (e.g., \`\`\`json) or additional text in the output.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Safely extract JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Response did not contain valid JSON');
    }
    
    const parsed = JSON.parse(match[0]);
    return {
      accuracyPercentage: typeof parsed.accuracyPercentage === 'number' ? parsed.accuracyPercentage : null,
      score: typeof parsed.score === 'number' ? parsed.score : null,
      feedback: typeof parsed.feedback === 'string' ? parsed.feedback : null,
      matchedPoints: Array.isArray(parsed.matchedPoints) ? parsed.matchedPoints : [],
      missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
      gradingError: parsed.accuracyPercentage === null
    };

  } catch (error: any) {
    console.error('Gemini grading error:', error);
    
    if (!isRetry) {
      console.log('Retrying in 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
      return evaluateAnswer(answerText, questionText, modelAnswer, rubric, maxMarks, true);
    }
    
    return { score: null, feedback: null, accuracyPercentage: null, matchedPoints: [], missingPoints: [], gradingError: true };
  }
}
