'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
} from 'lucide-react';

interface GradeCriterion {
  criterion: string;
  awarded_marks: number;
  max_marks: number;
  feedback: string;
}

interface GradeResult {
  extracted_text: string;
  awarded_marks: number;
  max_marks: number;
  percentage: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  criteria: GradeCriterion[];
  feedback: string;
  confidence: number;
  quality_before: { score: number; recommendation: string };
  preprocess_steps: string[];
  processed_image_base64: string;
}

export default function AnswerGraderPage() {
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [rubric, setRubric] = useState('');
  const [maxMarks, setMaxMarks] = useState(10);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(selected.type)) {
      setError('Use a JPEG, PNG, WebP, or TIFF photograph.');
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('The photograph must be 15MB or smaller.');
      return;
    }
    setFile(selected);
    setResult(null);
    setError('');
  };

  const gradeAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !question.trim() || !correctAnswer.trim()) {
      setError('Add the question, correct answer, and a photograph before grading.');
      return;
    }

    setIsGrading(true);
    setResult(null);
    setError('');

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('question', question.trim());
      body.append('correct_answer', correctAnswer.trim());
      body.append('max_marks', String(maxMarks));
      body.append('rubric', rubric.trim());

      const response = await fetch('/api/grade-handwritten-answer', {
        method: 'POST',
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to grade this answer.');
      setResult(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to grade this answer.');
    } finally {
      setIsGrading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#172554] px-7 py-9 text-white shadow-xl shadow-blue-100 md:px-10">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
            <ScanLine className="h-4 w-4" />
            Handwritten Answer Intelligence
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Photograph. Read. Grade with partial marks.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
            OpenCV cleans shadows, low contrast, and page tilt. Groq Vision transcribes the handwriting,
            compares it with the model answer, and awards marks for every correct component.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Camera, label: 'Capture answer' },
              { icon: Sparkles, label: 'CLAHE cleanup' },
              { icon: ClipboardCheck, label: 'Criterion grading' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <Icon className="h-5 w-5 text-blue-200" />
                <span className="text-sm font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <svg className="absolute -right-16 -top-20 h-80 w-80 text-blue-400/20" viewBox="0 0 300 300" fill="none" aria-hidden="true">
          <circle cx="150" cy="150" r="112" stroke="currentColor" strokeWidth="28" />
          <circle cx="150" cy="150" r="58" stroke="currentColor" strokeWidth="18" />
          <path d="M150 76v148M76 150h148" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </section>

      <form onSubmit={gradeAnswer} className="grid items-start gap-7 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3B5CFF]">Step 1</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Set the marking context</h2>
            <p className="mt-1 text-sm text-slate-500">Give the AI grader the same information an examiner would receive.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Question</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder="Enter the full question the student answered."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#3B5CFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Correct answer or model solution</span>
            <textarea
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              rows={6}
              placeholder="Include the key facts, calculations, reasoning steps, and conclusion."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#3B5CFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">Maximum marks</span>
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={maxMarks}
                onChange={(event) => setMaxMarks(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#3B5CFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">Marking rubric <span className="font-medium text-slate-400">Optional</span></span>
              <input
                value={rubric}
                onChange={(event) => setRubric(event.target.value)}
                placeholder="Example: definition 2, explanation 4, example 2, conclusion 2"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#3B5CFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3B5CFF]">Step 2</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Add the handwritten answer</h2>
            <p className="mt-1 text-sm text-slate-500">Use a clear, well-lit photograph with the entire answer visible.</p>
          </div>

          <div
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const dropped = event.dataTransfer.files[0];
              if (dropped) selectFile(dropped);
            }}
            onClick={() => inputRef.current?.click()}
            className={`relative flex min-h-[310px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.6rem] border-2 border-dashed text-center transition ${
              isDragging ? 'border-[#3B5CFF] bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) selectFile(selected);
              }}
            />
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Handwritten answer preview" className="absolute inset-0 h-full w-full object-contain p-3" />
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); reset(); }}
                  className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-2 text-white transition hover:bg-slate-950"
                  aria-label="Remove photograph"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-slate-950/80 px-3 py-2 text-xs font-bold text-white">
                  <FileImage className="h-4 w-4" />
                  {file?.name}
                </div>
              </>
            ) : (
              <div className="max-w-sm px-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#3B5CFF] shadow-sm">
                  <ImagePlus className="h-8 w-8" />
                </div>
                <p className="mt-5 text-lg font-black text-slate-900">Photograph or upload the answer</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">JPEG, PNG, WebP, or TIFF. Maximum 15MB.</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3B5CFF] px-4 py-2.5 text-sm font-bold text-white">
                  <Upload className="h-4 w-4" />
                  Select image
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGrading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3B5CFF] px-5 py-4 text-base font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGrading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
            {isGrading ? 'Reading and grading answer' : 'Grade handwritten answer'}
          </button>
        </div>
      </form>

      {result && (
        <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-100 pb-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3B5CFF]">Grading report</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">{result.verdict}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{result.feedback}</p>
            </div>
            <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-blue-100 bg-blue-50 text-[#3B5CFF]">
              <span className="text-3xl font-black">{result.awarded_marks}</span>
              <span className="text-xs font-bold">of {result.max_marks}</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ReportMetric icon={Target} label="Score" value={`${result.percentage}%`} />
            <ReportMetric icon={ShieldCheck} label="AI confidence" value={`${Math.round(result.confidence * 100)}%`} />
            <ReportMetric icon={ScanLine} label="Image quality" value={`${result.quality_before.score}/100`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="flex items-center gap-2 font-black text-slate-900"><ClipboardCheck className="h-5 w-5 text-[#3B5CFF]" /> Extracted handwriting</h3>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{result.extracted_text || 'No legible text was detected.'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="flex items-center gap-2 font-black text-slate-900"><Sparkles className="h-5 w-5 text-[#3B5CFF]" /> Image processing</h3>
              <img
                src={`data:image/png;base64,${result.processed_image_base64}`}
                alt="OpenCV processed handwritten answer"
                className="mt-4 max-h-72 w-full rounded-xl border border-slate-200 bg-white object-contain"
              />
              <p className="mt-3 text-xs leading-5 text-slate-500">{result.quality_before.recommendation}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">Partial-mark breakdown</h3>
            <div className="mt-4 space-y-3">
              {result.criteria.map((criterion, index) => (
                <div key={`${criterion.criterion}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{criterion.criterion}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{criterion.feedback}</p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-[#3B5CFF]">
                      {criterion.awarded_marks} / {criterion.max_marks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FeedbackList title="What was done well" items={result.strengths} icon={CheckCircle2} tone="green" />
            <FeedbackList title="How to improve" items={result.improvements} icon={RefreshCw} tone="amber" />
          </div>
        </section>
      )}
    </div>
  );
}

function ReportMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#3B5CFF] shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
  tone: 'green' | 'amber';
}) {
  const styles = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-800';
  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <h3 className="flex items-center gap-2 font-black"><Icon className="h-5 w-5" /> {title}</h3>
      <ul className="mt-4 space-y-2">
        {(items.length ? items : ['No specific notes returned.']).map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
