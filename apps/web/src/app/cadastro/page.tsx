"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/components/analytics/posthog-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
type TaxonomyItem = { id: string; name: string; slug: string };

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<TaxonomyItem[]>([]);
  const [courses, setCourses] = useState<TaxonomyItem[]>([]);
  const [athletics, setAthletics] = useState<TaxonomyItem[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [athleticId, setAthleticId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((data) => {
        setSchools(data.schools ?? []);
        setCourses(data.courses ?? []);
        setAthletics(data.athletics ?? []);
      });
  }, []);

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, schoolId, courseId, athleticId }),
    });

    if (res.ok) {
      const data = await res.json();
      trackEvent("signup_completed", { school_id: schoolId, course_id: courseId });
      if (data.userId && process.env.NODE_ENV === "development") {
        await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.userId }),
        });
      }
      router.push("/");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro — passo {step} de 4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <label className="text-sm font-medium">Faculdade</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Selecione...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button disabled={!schoolId} onClick={() => setStep(2)} className="w-full">
                Próximo
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="text-sm font-medium">Curso</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Selecione...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button disabled={!courseId} onClick={() => setStep(3)} className="w-full">
                Próximo
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <label className="text-sm font-medium">Atlética</label>
              <select
                value={athleticId}
                onChange={(e) => setAthleticId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Selecione...</option>
                {athletics.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <Button disabled={!athleticId} onClick={() => setStep(4)} className="w-full">
                Próximo
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <label className="text-sm font-medium">Apelido</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como quer aparecer nos rankings"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              />
              <Button
                disabled={displayName.length < 2 || loading}
                onClick={finish}
                className="w-full"
              >
                {loading ? "Salvando..." : "Entrar no Unicartola"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
