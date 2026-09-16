"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import { Button } from "@/components/ui/button";
import { SKILL_LABEL, type Skill } from "@/lib/skills";

type Question = { id: string; level?: string; question: string; options: string[] };

type TestData = {
  testId: string;
  title: string;
  description: string;
  instructions: string;
  grammarVocabulary: Question[];
  reading: { passage: string; questions: Question[] };
  writing: { prompt: string; note?: string };
};

type SkillResult = { cefrLevel: string | null; score: number | null };
type SubmitResponse = {
  results: Record<"GRAMMAR" | "VOCABULARY" | "READING" | "WRITING", SkillResult>;
  writingFeedback: string;
};

type Step = "intro" | "gv" | "reading" | "writing" | "results";

const RESULT_SKILLS: Skill[] = ["GRAMMAR", "VOCABULARY", "READING", "WRITING"];

function OptionList({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: number | undefined;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, i) => {
        const isSelected = selected === i;
        return (
          <label
            key={i}
            className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 font-sans text-[13px] transition ${
              isSelected
                ? "border-kincha-400 bg-kincha-400/10 text-kincha-200"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              className="sr-only"
              checked={isSelected}
              onChange={() => onSelect(i)}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export default function PlacementTestPage() {
  const [step, setStep] = useState<Step>("intro");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [gvAnswers, setGvAnswers] = useState<Record<string, number>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, number>>({});
  const [writingResponse, setWritingResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    fetch("/api/tra-dinh/placement-test")
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then(setTestData)
      .catch(() => setLoadError(true));
  }, []);

  const wordCount = useMemo(
    () => writingResponse.trim().split(/\s+/).filter(Boolean).length,
    [writingResponse]
  );

  const gvAllAnswered = testData ? testData.grammarVocabulary.every((q) => gvAnswers[q.id] !== undefined) : false;
  const readingAllAnswered = testData
    ? testData.reading.questions.every((q) => readingAnswers[q.id] !== undefined)
    : false;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/tra-dinh/placement-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grammarVocabularyAnswers: gvAnswers,
          readingAnswers,
          writingResponse,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      const data: SubmitResponse = await res.json();
      setResults(data);
      setStep("results");
    } catch {
      setSubmitError("Không nộp được bài, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-950 p-4 pb-24 text-white sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/tra-dinh" className="text-kincha-400 hover:text-kincha-200">
          ← Trà Đình
        </Link>
      </div>

      {loadError && (
        <ScrollCard glow="shuiro">
          <p className="font-sans text-[13px] text-shuiro-500">Không tải được bài test, thử lại nhé.</p>
        </ScrollCard>
      )}

      {!loadError && !testData && (
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      )}

      {testData && step === "intro" && (
        <ScrollCard glow="kincha">
          <h1 className="mb-2 font-serif-display text-xl font-semibold text-white">{testData.title}</h1>
          <p className="mb-3 font-sans text-[13px] text-white/60">{testData.description}</p>
          <p className="mb-5 font-sans text-[13px] text-white/70">{testData.instructions}</p>
          <Button onClick={() => setStep("gv")} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            Bắt đầu
          </Button>
        </ScrollCard>
      )}

      {testData && step === "gv" && (
        <div className="flex flex-col gap-4">
          <ScrollCard glow="yugen">
            <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">
              Ngữ pháp & Từ vựng — {testData.grammarVocabulary.length} câu
            </h2>
          </ScrollCard>
          {testData.grammarVocabulary.map((q, idx) => (
            <ScrollCard key={q.id} glow="yugen">
              <p className="mb-3 font-sans text-[13px] text-white">
                {idx + 1}. {q.question}
              </p>
              <OptionList
                question={q}
                selected={gvAnswers[q.id]}
                onSelect={(i) => setGvAnswers((prev) => ({ ...prev, [q.id]: i }))}
              />
            </ScrollCard>
          ))}
          <Button
            onClick={() => setStep("reading")}
            disabled={!gvAllAnswered}
            className="self-end bg-kincha-400 text-ink-950 hover:bg-kincha-400/80 disabled:opacity-40"
          >
            Tiếp tục
          </Button>
        </div>
      )}

      {testData && step === "reading" && (
        <div className="flex flex-col gap-4">
          <div className="sm:sticky sm:top-4 sm:z-10">
            <ScrollCard glow="kincha">
              <h2 className="mb-2 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Đọc hiểu</h2>
              <p className="font-sans text-[13px] leading-relaxed text-white/80">{testData.reading.passage}</p>
            </ScrollCard>
          </div>
          {testData.reading.questions.map((q, idx) => (
            <ScrollCard key={q.id} glow="yugen">
              <p className="mb-3 font-sans text-[13px] text-white">
                {idx + 1}. {q.question}
              </p>
              <OptionList
                question={q}
                selected={readingAnswers[q.id]}
                onSelect={(i) => setReadingAnswers((prev) => ({ ...prev, [q.id]: i }))}
              />
            </ScrollCard>
          ))}
          <Button
            onClick={() => setStep("writing")}
            disabled={!readingAllAnswered}
            className="self-end bg-kincha-400 text-ink-950 hover:bg-kincha-400/80 disabled:opacity-40"
          >
            Tiếp tục
          </Button>
        </div>
      )}

      {testData && step === "writing" && (
        <div className="flex flex-col gap-4">
          <ScrollCard glow="shuiro">
            <h2 className="mb-2 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Viết</h2>
            <p className="mb-3 font-sans text-[13px] text-white/80">{testData.writing.prompt}</p>
            <textarea
              value={writingResponse}
              onChange={(e) => setWritingResponse(e.target.value)}
              rows={10}
              placeholder="Viết câu trả lời của bạn ở đây..."
              className="w-full resize-y rounded-sm border border-white/15 bg-white/5 p-3 font-sans text-[13px] text-white placeholder:text-white/30 outline-none focus-visible:border-kincha-400/50 focus-visible:ring-3 focus-visible:ring-kincha-400/30"
            />
            <p className="mt-2 font-sans text-[11px] text-white/40">{wordCount} từ</p>
          </ScrollCard>
          {submitError && <p className="font-sans text-[12px] text-shuiro-500">{submitError}</p>}
          <Button
            onClick={submit}
            disabled={submitting || wordCount === 0}
            className="self-end bg-kincha-400 text-ink-950 hover:bg-kincha-400/80 disabled:opacity-40"
          >
            {submitting ? "Đang chấm..." : "Nộp bài"}
          </Button>
        </div>
      )}

      {step === "results" && results && (
        <div className="flex flex-col gap-4">
          <h1 className="font-serif-display text-xl font-semibold text-white">Kết quả</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {RESULT_SKILLS.map((skill) => {
              const r = results.results[skill as "GRAMMAR" | "VOCABULARY" | "READING" | "WRITING"];
              return (
                <ScrollCard key={skill} glow="kincha">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-sans text-[13px] font-medium text-white">{SKILL_LABEL[skill]}</h2>
                    <span className="rounded-sm border border-kincha-400/40 px-2 py-0.5 font-sans text-[13px] font-semibold text-kincha-400">
                      {r.cefrLevel ?? "—"}
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-white/50">{r.score ?? "—"}/100</p>
                  {skill === "WRITING" && results.writingFeedback && (
                    <p className="mt-3 border-t border-white/10 pt-3 font-sans text-[12px] text-white/70">
                      {results.writingFeedback}
                    </p>
                  )}
                </ScrollCard>
              );
            })}
          </div>
          <Link href="/tra-dinh" className="self-end">
            <Button className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">Về Trà Đình</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
