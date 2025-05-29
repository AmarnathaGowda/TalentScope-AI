import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AppError } from '../middleware/errorHandler'
import { Readable } from 'stream'
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract'

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

interface UploadedFile {
  buffer: Buffer
  originalname: string
  mimetype: string
}

export const uploadToS3 = async (file: UploadedFile): Promise<string> => {
  try {
    const key = `resumes/${Date.now()}-${file.originalname}`
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    )

    // Generate signed URL for temporary access
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: key,
      }),
      { expiresIn: 3600 } // URL expires in 1 hour
    )

    return signedUrl
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new AppError('Failed to upload file', 500)
  }
}

interface ParsedResume {
  skills: string[]
  experience: number
  education: Array<{
    degree: string
    institution: string
    year: number
  }>
  workHistory: Array<{
    company: string
    role: string
    duration: string
    responsibilities: string[]
  }>
}

export const parseResumeWithAI = async (
  resumeUrl: string
): Promise<ParsedResume> => {
  try {
    // Get the file from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: resumeUrl.split('/').pop() || '',
      })
    )

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    if (response.Body instanceof Readable) {
      for await (const chunk of response.Body) {
        chunks.push(chunk)
      }
    }
    const buffer = Buffer.concat(chunks)

    // Use Textract to analyze the document
    const textractResponse = await textractClient.send(
      new AnalyzeDocumentCommand({
        Document: {
          Bytes: buffer,
        },
        FeatureTypes: ['FORMS', 'TABLES'],
      })
    )

    // Process Textract response
    const extractedText = textractResponse.Blocks?.filter(
      (block) => block.BlockType === 'LINE'
    )
      .map((block) => block.Text)
      .join('\n')

    // Use regex patterns to extract information
    const skills = extractSkills(extractedText)
    const experience = calculateExperience(extractedText)
    const education = extractEducation(extractedText)
    const workHistory = extractWorkHistory(extractedText)

    return {
      skills,
      experience,
      education,
      workHistory,
    }
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw new AppError('Failed to parse resume', 500)
  }
}

// Helper functions for text extraction
function extractSkills(text: string): string[] {
  // Basic skill extraction - can be enhanced with ML/AI
  const skillKeywords = [
    'JavaScript',
    'Python',
    'Java',
    'React',
    'Node.js',
    'AWS',
    'SQL',
    'Machine Learning',
    // Add more skills as needed
  ]

  return skillKeywords.filter((skill) =>
    text.toLowerCase().includes(skill.toLowerCase())
  )
}

function calculateExperience(text: string): number {
  // Basic experience calculation - can be enhanced
  const years = text.match(/(\d+)[\s-]*years? of experience/i)
  return years ? parseInt(years[1]) : 0
}

function extractEducation(text: string): Array<{
  degree: string
  institution: string
  year: number
}> {
  // Basic education extraction - can be enhanced
  const education = []
  const eduPattern = /([A-Za-z\s]+) from ([A-Za-z\s]+) .*?(\d{4})/g
  let match

  while ((match = eduPattern.exec(text)) !== null) {
    education.push({
      degree: match[1].trim(),
      institution: match[2].trim(),
      year: parseInt(match[3]),
    })
  }

  return education
}

function extractWorkHistory(text: string): Array<{
  company: string
  role: string
  duration: string
  responsibilities: string[]
}> {
  // Basic work history extraction - can be enhanced
  const workHistory = []
  const workPattern = /([A-Za-z\s]+) - ([A-Za-z\s]+) \((.*?)\)/g
  let match

  while ((match = workPattern.exec(text)) !== null) {
    workHistory.push({
      company: match[1].trim(),
      role: match[2].trim(),
      duration: match[3].trim(),
      responsibilities: [], // Would need more complex parsing for responsibilities
    })
  }

  return workHistory
} 