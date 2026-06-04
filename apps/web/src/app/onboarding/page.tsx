"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniversities, getCourses, getAthletics } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type TaxonomyItem = { id: string; name: string; slug: string; schoolId?: string };

const STEPS = ["Faculdade", "Curso", "Atlética", "Apelido", "Entrar"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [schoolId, setSchoolId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [athleticId, setAthleticId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const schools = getUniversities();
  const courses = getCourses();
  const allAthletics = getAthletics();
  const filteredAthletics = schoolId
    ? allAthletics.filter((a) => a.schoolId === schoolId)
    : allAthletics;

  useEffect(() => {
    if (schoolId) setAthleticId("");
  }, [schoolId]);

  async function finish() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, schoolId, courseId, athleticId }),
      });
      if (res.ok) {
        router.push("/");
        return;
      }
    } catch {
      /* demo mode */
    }
    router.push("/");
    setLoading(false);
  }

  function next() {
    if (step < 5) setStep(step + 1);
    else finish();
  }

  const canProceed =
    (step === 1 && schoolId) ||
    (step === 2 && courseId) ||
    (step === 3 && athleticId) ||
    (step === 4 && displayName.length >= 2) ||
    step === 5;

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
          CL
        </div>
        <h1 className="text-xl font-bold">Bem-vindo ao Campus League</h1>
        <p className="text-sm text-muted-foreground">Represente sua faculdade</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                i + 1 < step
                  ? "bg-success text-white"
                  : i + 1 === step
                    ? "bg-accent text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-4", i + 1 < step ? "bg-success" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Etapa {step}: {STEPS[step - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <SelectGrid
              items={schools}
              value={schoolId}
              onChange={setSchoolId}
            />
          )}
          {step === 2 && (
            <SelectGrid items={courses} value={courseId} onChange={setCourseId} />
          )}
          {step === 3 && (
            <SelectGrid
              items={filteredAthletics}
              value={athleticId}
              onChange={setAthleticId}
            />
          )}
          {step === 4 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Como quer aparecer nos rankings?</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Palpiteiro42"
                maxLength={32}
              />
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Tudo pronto!</p>
              <div className="rounded-lg bg-muted p-4 text-left text-sm">
                <p>
                  <strong>Faculdade:</strong>{" "}
                  {schools.find((s) => s.id === schoolId)?.name}
                </p>
                <p>
                  <strong>Curso:</strong> {courses.find((c) => c.id === courseId)?.name}
                </p>
                <p>
                  <strong>Atlética:</strong>{" "}
                  {filteredAthletics.find((a) => a.id === athleticId)?.name}
                </p>
                <p>
                  <strong>Apelido:</strong> {displayName}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Voltar
              </Button>
            )}
            <Button
              onClick={next}
              disabled={!canProceed || loading}
              className="flex-1"
            >
              {loading ? "Entrando..." : step === 5 ? "Entrar na plataforma" : "Próximo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SelectGrid({
  items,
  value,
  onChange,
}: {
  items: TaxonomyItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
            value === item.id
              ? "border-accent bg-accent/5 text-accent"
              : "border-border hover:border-accent/30"
          )}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
