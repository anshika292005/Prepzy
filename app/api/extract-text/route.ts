import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText = '';

    if (file.type === 'application/pdf') {
       console.log("Analyzing PDF via pdf-parse...");
       const pdfData = await pdf(buffer);
       extractedText = pdfData.text || '';
       console.log(`pdf-parse extracted ${extractedText.length} characters.`);
       if (extractedText.trim().length === 0) {
         console.warn("PDF appears to be scanned or empty (no text layer).");
       }
    } else {
       console.log("Analyzing Image via Groq Vision...");
       const base64Data = buffer.toString('base64');
       const imageMediaType = file.type;

       const chatCompletion = await groq.chat.completions.create({
         messages: [
           {
             role: 'user',
             content: [
               { 
                 type: 'text', 
                 text: "Extract all text from this image exactly as written. This is study material for Indian competitive exams (JEE/UPSC). Output ONLY the extracted text with no commentary." 
               },
               {
                 type: 'image_url',
                 image_url: {
                   url: `data:${imageMediaType};base64,${base64Data}`,
                 },
               },
             ],
           },
         ],
         model: "llama-3.2-11b-vision-preview",
       });

       extractedText = chatCompletion.choices[0]?.message?.content || "";
       console.log(`Groq Vision extracted ${extractedText.length} characters.`);
    }

    if (!extractedText.trim()) {
       return NextResponse.json({ error: 'No text could be extracted from this file.' }, { status: 422 });
    }

    const charCount = extractedText.length;
    const estimatedTokens = Math.round(charCount / 4);

    return NextResponse.json({
      extractedText,
      charCount,
      estimatedTokens
    });

  } catch (error: any) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to extract text' }, { status: 500 });
  }
}
