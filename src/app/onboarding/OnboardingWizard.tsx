"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UniversityCard } from "@/components/university/UniversityCard";
import { completeOnboarding } from "@/actions/onboarding";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Option {
  id: string;
  name: string;
  shortName?: string;
  city?: string | null;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [athleticsList, setAthleticsList] = useState<Option[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [athleticsId, setAthleticsId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/onboarding/universities")
      .then((r) => r.json())
      .then((d) => setUniversities(d.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!universityId) return;
    fetch(`/api/onboarding/courses?universityId=${universityId}`)
      .then((r) => r.json())
      .then((d) => setCourses(d.data ?? []));
    fetch(`/api/onboarding/athletics?universityId=${universityId}`)
      .then((r) => r.json())
      .then((d) => setAthleticsList(d.data ?? []));
  }, [universityId]);

  function next() {
    if (step === 1 && !universityId) {
      setError("Selecione sua faculdade");
      return;
    }
    if (step === 2 && !courseId) {
      setError("Selecione seu curso");
      return;
    }
    if (step === 3 && !athleticsId) {
      setError("Selecione sua atlética");
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function submit() {
    if (!nickname.trim()) {
      setError("Escolha um apelido");
      return;
    }
    startTransition(async () => {
      const res = await completeOnboarding({
        universityId,
        courseId,
        athleticsId,
        nickname: nickname.trim(),
      });
      if (res?.error) setError(res.error);
    });
  }

  const selectedUni = universities.find((u) => u.id === universityId);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-[#1e3a5f]" : "bg-gray-100"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Escolha sua faculdade
          </h2>
          <p className="text-sm text-gray-500 mb-4">Passo 1 de 4</p>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {universities.map((u) => (
              <UniversityCard
                key={u.id}
                name={u.name}
                shortName={u.shortName ?? u.name}
                city={u.city}
                selected={universityId === u.id}
                onClick={() => setUniversityId(u.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Escolha seu curso
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {selectedUni?.shortName ?? "Sua faculdade"} · Passo 2 de 4
          </p>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCourseId(c.id)}
                className={`w-full rounded-xl border-2 p-4 text-left text-sm font-semibold ${
                  courseId === c.id
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Escolha sua atlética
          </h2>
          <p className="text-sm text-gray-500 mb-4">Passo 3 de 4</p>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {athleticsList.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAthleticsId(a.id)}
                className={`w-full rounded-xl border-2 p-4 text-left text-sm font-semibold ${
                  athleticsId === a.id
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Escolha seu apelido
          </h2>
          <p className="text-sm text-gray-500 mb-4">Passo 4 de 4</p>
          <Input
            placeholder="Ex: craque_fei_99"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
          />
          <p className="mt-2 text-xs text-gray-400">
            Este nome aparecerá nos rankings e na comunidade.
          </p>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={back} className="flex-1">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={next} className="flex-1">
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending} className="flex-1">
            {pending ? "Entrando..." : "Começar"}
          </Button>
        )}
      </div>
    </div>
  );
}
