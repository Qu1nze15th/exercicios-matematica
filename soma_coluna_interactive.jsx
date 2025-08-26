import React, { useEffect, useState } from "react";

// SomaColunaInteractive.jsx
// Página única React + Tailwind que demonstra 9 exercícios de soma em coluna
// - Interface visual, passo-a-passo (unidades -> dezenas -> centenas)
// - Armazenamento local (localStorage) para salvar progresso
// - Recursos de acessibilidade: fonte grande, botões claros, leitura por voz
// - Funciona por toque/teclado e foi projetado para crianças com baixa alfabetização

const PROBLEMS = [
  [544, 256],
  [624, 347],
  [564, 288],
  [545, 286],
  [654, 268],
  [458, 259],
  [532, 399],
  [445, 298],
  [546, 298],
];

const STORAGE_KEY = "soma_coluna_progress_v1";

export default function SomaColunaInteractive() {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState(() => {
    // estado por exercício: {step: 0..3, carries: [0,0,0], answers: [null,null,null]}
    const saved = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return PROBLEMS.map(() => ({ step: 0, carries: [0, 0, 0], answers: [null, null, null], showHints: false }));
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const cur = state[index];
  const [a, b] = PROBLEMS[index];

  // split digits right-aligned into arrays [hundreds, tens, units]
  const digits = (n) => {
    const s = String(n).padStart(3, "0");
    return [Number(s[0]), Number(s[1]), Number(s[2])];
  };

  const ad = digits(a);
  const bd = digits(b);

  const speak = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "pt-BR";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  };

  function setStepFor(i, newPartial) {
    setState((s) => {
      const copy = s.map((x) => ({ ...x, carries: [...x.carries], answers: [...x.answers] }));
      copy[i] = { ...copy[i], ...newPartial };
      return copy;
    });
  }

  function handleCheckColumn(colIndex) {
    // colIndex: 2 -> units, 1 -> tens, 0 -> hundreds (aligned with arrays)
    const sum = ad[colIndex] + bd[colIndex] + cur.carries[colIndex];
    const digit = sum % 10;
    const carry = Math.floor(sum / 10);

    // update answer and propagate carry to left column (colIndex-1)
    setState((s) => {
      const copy = s.map((x) => ({ ...x, carries: [...x.carries], answers: [...x.answers] }));
      copy[index].answers[colIndex] = digit;
      if (colIndex - 1 >= 0) copy[index].carries[colIndex - 1] = copy[index].carries[colIndex - 1] + carry;
      // advance step if clicking current step
      copy[index].step = Math.max(copy[index].step, 0) + 1;
      return copy;
    });

    speak(`${ad[colIndex]} mais ${bd[colIndex]} mais ${cur.carries[colIndex]} é ${sum}. Escreve ${digit} e sobe ${carry}`);
  }

  function resetCurrent() {
    setState((s) => {
      const copy = s.map((x) => ({ ...x, carries: [...x.carries], answers: [...x.answers] }));
      copy[index] = { step: 0, carries: [0, 0, 0], answers: [null, null, null], showHints: false };
      return copy;
    });
  }

  function completeAll() {
    // fill all answers automatically (useful para professor)
    setState((s) => {
      const copy = s.map((x) => ({ ...x, carries: [...x.carries], answers: [...x.answers] }));
      PROBLEMS.forEach((p, i) => {
        const da = digits(p[0]);
        const db = digits(p[1]);
        const carries = [0, 0, 0];
        const answers = [null, null, null];
        // units
        let sum = da[2] + db[2] + carries[2];
        answers[2] = sum % 10;
        carries[1] = Math.floor(sum / 10);
        // tens
        sum = da[1] + db[1] + carries[1];
        answers[1] = sum % 10;
        carries[0] = Math.floor(sum / 10);
        // hundreds
        sum = da[0] + db[0] + carries[0];
        answers[0] = sum;
        copy[i] = { step: 3, carries, answers, showHints: false };
      });
      return copy;
    });
  }

  // keyboard shortcuts: space -> next step, left/right -> prev/next problem
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, PROBLEMS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === " ") {
        e.preventDefault();
        // try to check current column
        const col = 2 - cur.step; // if step 0 -> col 2 (units), step1 -> col1, step2 -> col0
        if (col >= 0) handleCheckColumn(col);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, state]);

  return (
    <div className="min-h-screen bg-amber-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Soma em Coluna — Passo a passo</h1>
          <div className="space-x-2">
            <button
              className="px-3 py-2 rounded shadow-sm border text-sm"
              onClick={() => {
                resetCurrent();
                speak("Reiniciar exercício");
              }}
              aria-label="Reiniciar exercício"
            >
              🔄 Reiniciar
            </button>
            <button
              className="px-3 py-2 rounded shadow-sm border text-sm"
              onClick={() => {
                completeAll();
                speak("Resolvido automaticamente");
              }}
              aria-label="Resolver tudo"
            >
              ✅ Resolver tudo
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm">Exercício</div>
                <div className="text-xl font-semibold">{index + 1} / {PROBLEMS.length}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Toque para ouvir</div>
                <button
                  className="mt-1 px-3 py-2 rounded bg-amber-200"
                  onClick={() => speak(`Exercício ${index + 1}. ${a} mais ${b}`)}
                >🔊 Ouvir</button>
              </div>
            </div>

            <div className="bg-amber-100 rounded p-4 text-center">
              {/* visual de coluna */}
              <div className="text-xs mb-2">Siga: Unidades → Dezenas → Centenas</div>

              <div className="flex justify-center items-end gap-2 select-none">
                {/* carries (vai 1) */}
                <div className="flex flex-col items-center w-16">
                  <div className="h-6">{cur.carries[0] > 0 ? `+${cur.carries[0]}` : ""}</div>
                  <div className="h-6">{cur.carries[1] > 0 ? `+${cur.carries[1]}` : ""}</div>
                  <div className="h-6">{cur.carries[2] > 0 ? `+${cur.carries[2]}` : ""}</div>
                </div>

                <div className="text-right font-mono text-3xl md:text-5xl">
                  <div className="leading-none">{String(a).padStart(3, " ")}</div>
                  <div className="leading-none">+{String(b).padStart(2, " ")}</div>
                  <div className="border-t-2 mt-1 pt-1 text-4xl md:text-6xl">
                    {cur.answers[0] !== null || cur.step > 2 ? cur.answers[0] : " \u00A0"}
                    {cur.answers[1] !== null || cur.step > 1 ? cur.answers[1] : " \u00A0"}
                    {cur.answers[2] !== null || cur.step > 0 ? cur.answers[2] : " \u00A0"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <button
                  className="px-3 py-2 rounded bg-white border"
                  onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                  aria-label="Exercício anterior"
                >⬅️</button>
                <button
                  className="px-4 py-2 rounded bg-amber-300 font-semibold"
                  onClick={() => {
                    // check current column
                    const col = 2 - cur.step;
                    if (col < 0) {
                      speak("Exercício já concluído");
                      return;
                    }
                    handleCheckColumn(col);
                  }}
                  aria-label="Verificar próximo passo"
                >
                  ▶️ Verificar passo
                </button>
                <button
                  className="px-3 py-2 rounded bg-white border"
                  onClick={() => setIndex((i) => Math.min(i + 1, PROBLEMS.length - 1))}
                  aria-label="Próximo exercício"
                >➡️</button>
              </div>

              <div className="mt-3 text-sm text-center">
                <button
                  className="underline"
                  onClick={() => {
                    setStepFor(index, { showHints: !cur.showHints });
                  }}
                >{cur.showHints ? "Ocultar dicas" : "Mostrar dica"}</button>
              </div>

              {cur.showHints && (
                <div className="mt-3 bg-white p-2 rounded text-left text-sm">
                  <div><strong>Unidades:</strong> some os algarismos das unidades. Se for 10 ou mais, escreva só a unidade e suba 1.</div>
                  <div><strong>Dezenas:</strong> some as dezenas e o que subiu das unidades.</div>
                  <div><strong>Centenas:</strong> some as centenas e o que subiu das dezenas.</div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-center text-gray-600">Dica: pressione <kbd className="px-1 bg-white border rounded">Espaço</kbd> para avançar passo a passo</div>
          </section>

          <aside className="bg-white p-4 rounded-lg shadow flex flex-col gap-3">
            <h2 className="font-semibold">Ajuda visual</h2>
            <ol className="list-decimal pl-5 text-sm">
              <li>Toque <strong>Verificar passo</strong> — o app calcula a coluna atual (unidades primeiro).</li>
              <li>O resultado aparece grande, com o "vai 1" mostrado acima das colunas.</li>
              <li>Se quiser, aperte <strong>Reiniciar</strong> para começar novamente.</li>
            </ol>

            <div className="pt-2 border-t">
              <h3 className="font-semibold">Progresso salvo</h3>
              <p className="text-sm">Tudo que você fizer fica salvo automaticamente no dispositivo.</p>
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-2 rounded border"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    window.location.reload();
                  }}
                >🗑️ Apagar progresso</button>

                <button
                  className="px-3 py-2 rounded border"
                  onClick={() => {
                    // export simples do estado
                    const data = JSON.stringify(state, null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "soma_coluna_progress.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >📤 Exportar progresso</button>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-gray-600">
              <div className="font-semibold">Acessibilidade</div>
              <ul className="list-disc pl-5">
                <li>Fontes grandes e botões altos para toque fácil.</li>
                <li>Leitura por voz disponível para cada exercício.</li>
                <li>Feedback imediato visual e sonoro a cada passo.</li>
              </ul>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-sm text-center text-gray-600">Feito para prática: Unidades → Dezenas → Centenas • Use as setas ou toque nos botões</footer>
      </div>
    </div>
  );
}
