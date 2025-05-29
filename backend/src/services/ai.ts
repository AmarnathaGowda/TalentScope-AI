import { Configuration, OpenAIApi } from 'openai'
import { JobDescription } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

interface Question {
  text: string
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'EXPERIENCE'
}

export const generateInterviewQuestions = async (
  job: JobDescription
): Promise<Question[]> => {
  try {
    const prompt = `Generate 10 interview questions for a ${job.title} position.
Requirements: ${job.requirements}
Required skills: ${job.skills.join(', ')}

Please generate a mix of technical, behavioral, and experience-based questions.
Format the response as a JSON array with each question having 'text' and 'type' properties.
Type should be one of: TECHNICAL, BEHAVIORAL, or EXPERIENCE.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI interviewer assistant helping to generate relevant interview questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new AppError('Failed to generate questions', 500)
    }

    try {
      const questions = JSON.parse(result) as Question[]
      return questions.map((q) => ({
        text: q.text,
        type: q.type,
      }))
    } catch (error) {
      throw new AppError('Failed to parse generated questions', 500)
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new AppError('Failed to generate interview questions', 500)
  }
}

export const analyzeInterviewResponse = async (
  question: string,
  response: string,
  jobRequirements: string
): Promise<{
  score: number
  feedback: string
}> => {
  try {
    const prompt = `Analyze the following interview response:
Question: ${question}
Response: ${response}
Job Requirements: ${jobRequirements}

Please evaluate the response and provide:
1. A score between 0 and 100
2. Detailed feedback on the response

Format the response as a JSON object with 'score' and 'feedback' properties.`

    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI interview evaluator providing objective assessment of candidate responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const analysis = result.choices[0]?.message?.content
    if (!analysis) {
      throw new AppError('Failed to analyze response', 500)
    }

    try {
      const { score, feedback } = JSON.parse(analysis)
      return {
        score: Number(score),
        feedback: String(feedback),
      }
    } catch (error) {
      throw new AppError('Failed to parse analysis result', 500)
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new AppError('Failed to analyze interview response', 500)
  }
}

export const analyzeSkillMatch = async (
  candidateSkills: string[],
  jobSkills: string[]
): Promise<number> => {
  try {
    const prompt = `Analyze the skill match between a candidate and a job position:
Candidate Skills: ${candidateSkills.join(', ')}
Required Job Skills: ${jobSkills.join(', ')}

Please evaluate the match and provide:
1. A match score between 0 and 100
2. Consider both exact matches and related skills
3. Weight more important skills higher (e.g., primary programming languages)

Return only the numeric score.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI skill matching assistant providing objective skill compatibility scores.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new AppError('Failed to analyze skill match', 500)
    }

    const score = parseInt(result.match(/\d+/)?.[0] || '0')
    return Math.min(100, Math.max(0, score)) // Ensure score is between 0 and 100

  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new AppError('Failed to analyze skill match', 500)
  }
} 