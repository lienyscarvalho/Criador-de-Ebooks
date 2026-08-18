import { useEffect, useRef, useState } from "react";
import { iconSvg, THEMES, LANGS, TONES } from "../lib/icons";
import { signup, login, logout as apiLogout, me } from "../lib/auth";
import { fetchHistory, saveEbook } from "../lib/api";
import { EbookChapterPage, EbookCoverPage } from "../components/EbookPages";

function Icon({ svg, style, flip }) {
  return (
    <span
      style={{ display: "inline-flex", ...(flip ? { transform: "scaleX(-1)" } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const EXAMPLES = ["Hábitos atômicos", "Sistema solar para crianças", "Guia de finanças pessoais", "Introdução à fotografia"];

export default function Home() {
  const [screen, setScreen] = useState("loading"); // loading, auth, create, generating, preview
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signup");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [idea, setIdea] = useState("");
  const [pages, setPages] = useState(8);
  const [language, setLanguage] = useState("pt");
  const [tone, setTone] = useState("didatico");

  const [genProgress, setGenProgress] = useState(8);
  const [genLabel, setGenLabel] = useState("");

  const [ebook, setEbook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);

  const pdfRefs = useRef([]);

  // Ao carregar a página, verifica se já existe uma sessão válida (cookie)
  useEffect(() => {
    (async () => {
      const username = await me();
      if (username) {
        setUser(username);
        setHistory(await fetchHistory());
        setScreen("create");
      } else {
        setScreen("auth");
      }
    })();
  }, []);

  function flashToast(msg, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  /* ---------------- AUTH ---------------- */
  async function handleSignup(username, password) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const u = await signup(username, password);
      await loginSuccess(u);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function handleLogin(username, password) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const u = await login(username, password);
      await loginSuccess(u);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function loginSuccess(username) {
    setUser(username);
    setHistory(await fetchHistory());
    setScreen("create");
  }
  async function handleLogout() {
    try {
      await apiLogout();
    } catch (e) {
      /* ignore */
    }
    setUser(null);
    setScreen("auth");
    setAuthMode("signup");
    setAuthError("");
    setEbook(null);
    setHistory([]);
    setIdea("");
  }

  /* ---------------- GENERATION ---------------- */
  async function generateEbook() {
    if (!idea || idea.trim().length < 2) {
      flashToast("Digite uma ideia, palavra ou frase para começar.");
      return;
    }
    setScreen("generating");
    setGenProgress(8);
    setGenLabel("Planejando a estrutura do e-book...");

    const timer = setInterval(() => {
      setGenProgress((p) => {
        const next = Math.min(p + Math.random() * 7, 90);
        setGenLabel(next < 35 ? "Escrevendo os capítulos..." : next < 65 ? "Compondo a capa e as ilustrações..." : "Aplicando o layout visual...");
        return next;
      });
    }, 600);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, pages, language, tone }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (!res.ok) {
        throw new Error(data.error || "Falha ao gerar o e-book.");
      }
      setGenProgress(100);
      setGenLabel("Pronto!");
      await new Promise((r) => setTimeout(r, 350));
      setEbook(data);
      setPageIndex(0);
      setScreen("preview");
      persistEbook(data);
    } catch (err) {
      clearInterval(timer);
      setScreen("create");
      flashToast(err.message || "Não consegui gerar o e-book agora. Tente novamente.", 4500);
    }
  }

  async function persistEbook(ebookData) {
    try {
      const list = await saveEbook(ebookData);
      if (list) setHistory(list);
    } catch (e) {
      /* não é crítico: o e-book já está visível no preview mesmo se o histórico falhar */
    }
  }

  function openSaved(item) {
    setEbook(item);
    setPageIndex(0);
    setScreen("preview");
  }

  /* ---------------- PDF EXPORT ---------------- */
  async function exportPdf() {
    if (!ebook || exporting) return;
    setExporting(true);
    flashToast("Gerando PDF...", 60000);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;
      const pdf = new jsPDF({ unit: "px", format: [794, 1123] });

      const nodes = pdfRefs.current.filter(Boolean);
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: "#FCFBF7" });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([794, 1123]);
        pdf.addImage(imgData, "JPEG", 0, 0, 794, 1123);
      }
      const filename =
        (ebook.title || "ebook")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 50) || "ebook";
      pdf.save(filename + ".pdf");
      flashToast("PDF baixado com sucesso.");
    } catch (e) {
      flashToast("Não consegui gerar o PDF agora. Tente novamente.", 4000);
    } finally {
      setExporting(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  if (screen === "loading") {
    return (
      <div id="app">
        <div className="loading-wrap">
          <div className="orbit">
            <div className="ring" />
            <div className="ring2" />
          </div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      {screen === "auth" || !user ? (
        <AuthScreen
          authMode={authMode}
          setAuthMode={setAuthMode}
          authError={authError}
          authBusy={authBusy}
          showPass={showPass}
          setShowPass={setShowPass}
          onSignup={handleSignup}
          onLogin={handleLogin}
        />
      ) : null}

      {screen === "create" && user ? (
        <>
          <Topbar user={user} onLogout={handleLogout} />
          <CreateScreen
            idea={idea}
            setIdea={setIdea}
            pages={pages}
            setPages={setPages}
            language={language}
            setLanguage={setLanguage}
            tone={tone}
            setTone={setTone}
            onGenerate={generateEbook}
            history={history}
            onOpenSaved={openSaved}
          />
        </>
      ) : null}

      {screen === "generating" ? (
        <>
          <Topbar user={user} onLogout={handleLogout} />
          <div className="loading-wrap">
            <div className="orbit">
              <div className="ring" />
              <div className="ring2" />
            </div>
            <h2 className="display">Criando seu e-book</h2>
            <p>{genLabel}</p>
            <div className="progressbar">
              <div style={{ width: `${genProgress}%` }} />
            </div>
          </div>
        </>
      ) : null}

      {screen === "preview" && ebook ? (
        <>
          <Topbar user={user} onLogout={handleLogout} />
          <PreviewScreen
            ebook={ebook}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            onNewIdea={() => setScreen("create")}
            onExport={exportPdf}
            exporting={exporting}
          />
        </>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}

      {/* Área invisível usada só para renderizar as páginas em tamanho fixo para exportação em PDF */}
      {ebook ? (
        <div id="pdf-render">
          <div
            ref={(el) => (pdfRefs.current[0] = el)}
            style={{ width: 794, height: 1123, background: "#FCFBF7" }}
          >
            <EbookCoverPage ebook={ebook} />
          </div>
          {(ebook.chapters || []).map((c, i) => (
            <div
              key={i}
              ref={(el) => (pdfRefs.current[i + 1] = el)}
              style={{ width: 794, height: 1123, background: "#FCFBF7" }}
            >
              <EbookChapterPage chapter={c} index={i} total={ebook.chapters.length} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ============================= COMPONENTS ============================= */

function Topbar({ user, onLogout }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Icon svg={iconSvg("sparkle")} style={{ width: 18, height: 18 }} />
        </div>
        <div className="brand-name display">
          Nébula<span className="dot">.</span>
        </div>
      </div>
      {user ? (
        <div className="userpill">
          <div className="avatar">{(user[0] || "U").toUpperCase()}</div>
          <span>{user}</span>
          <button className="linklike" onClick={onLogout}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AuthScreen({ authMode, setAuthMode, authError, authBusy, showPass, setShowPass, onSignup, onLogin }) {
  const isLogin = authMode === "login";
  const mosaicColors = [THEMES.violet, THEMES.teal, THEMES.gold, THEMES.pink];
  const mosaicIcons = ["brain", "rocket", "bulb", "chart"];

  function handleSubmit(e) {
    e.preventDefault();
    const u = e.target.elements["auth-user"].value.trim();
    const p = e.target.elements["auth-pass"].value;
    if (isLogin) onLogin(u, p);
    else onSignup(u, p);
  }

  return (
    <div style={{ paddingTop: 4 }}>
      <div className="auth-shell">
        <div className="auth-side">
          <div className="grid-lines" />
          <div className="glow-orb g1" />
          <div className="glow-orb g2" />
          <div className="auth-side-top">
            <span className="tag">
              <Icon svg={iconSvg("wand")} style={{ width: 13, height: 13 }} /> Geração de e-books com IA
            </span>
            <h1 className="display">Uma ideia vira um e-book pronto pra publicar.</h1>
            <p>
              Escreva uma palavra, frase ou ideia. A IA estrutura os capítulos, ilustra cada página com uma capa
              profissional e entrega um PDF pronto pra ler ou vender.
            </p>
            <div className="mock-cover">
              <div className="mock-cover-inner">
                <div className="mtitle">Hábitos que Constroem o Futuro</div>
                <div className="msub">Um guia prático, ilustrado, gerado por IA</div>
                <div className="mock-chips">
                  {mosaicColors.map((t, i) => (
                    <div className="mock-chip" style={{ background: t.bg }} key={i}>
                      <Icon svg={iconSvg(mosaicIcons[i])} style={{ width: 13, height: 13 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="auth-side-bottom">
            <div>
              <Icon svg={iconSvg("check")} style={{ width: 14, height: 14 }} /> Gratuito
            </div>
            <div>
              <Icon svg={iconSvg("globe")} style={{ width: 14, height: 14 }} /> 4 idiomas
            </div>
            <div>
              <Icon svg={iconSvg("book")} style={{ width: 14, height: 14 }} /> Capa + PDF ilustrado
            </div>
          </div>
        </div>

        <div className="auth-form-col">
          <div className="tabs">
            <button className={`tab ${!isLogin ? "active" : ""}`} onClick={() => setAuthMode("signup")} type="button">
              Criar conta
            </button>
            <button className={`tab ${isLogin ? "active" : ""}`} onClick={() => setAuthMode("login")} type="button">
              Entrar
            </button>
          </div>

          {authError ? (
            <div className="err">
              <Icon svg={iconSvg("warn")} style={{ width: 15, height: 15 }} />
              <span>{authError}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="auth-user">Usuário</label>
              <div className="inputwrap">
                <input id="auth-user" name="auth-user" type="text" placeholder="seu.nome" autoComplete="username" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="auth-pass">Senha</label>
              <div className="inputwrap">
                <input
                  id="auth-pass"
                  name="auth-pass"
                  type={showPass ? "text" : "password"}
                  placeholder="mín. 4 caracteres"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? "ocultar" : "ver"}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={authBusy}>
              {authBusy ? "Aguarde..." : isLogin ? "Entrar" : "Criar minha conta"}
            </button>
          </form>

          <p className="authnote">
            <Icon svg={iconSvg("lock")} style={{ width: 13, height: 13 }} />
            <span>
              Sua senha é protegida com hash bcrypt e sua conta fica salva em um banco de dados real — funciona em
              qualquer dispositivo em que você entrar.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateScreen({ idea, setIdea, pages, setPages, language, setLanguage, tone, setTone, onGenerate, history, onOpenSaved }) {
  return (
    <>
      <div className="hero">
        <h1 className="display">
          Uma ideia. <span className="accent">Um e-book completo.</span>
        </h1>
        <p>Digite uma ideia, palavra ou frase. A IA escreve, ilustra e organiza um e-book com capa, pronto para baixar em PDF.</p>
      </div>

      <div className="create-card glass">
        <div className="idea-row">
          <textarea
            placeholder="Ex: hábitos atômicos, o sistema solar, como investir do zero..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>
        <div className="grid3">
          <div className="field">
            <label>Número de páginas</label>
            <input
              type="number"
              min={4}
              max={20}
              value={pages}
              onChange={(e) => setPages(Math.max(4, Math.min(20, parseInt(e.target.value, 10) || 8)))}
            />
          </div>
          <div className="field">
            <label>Idioma</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {Object.entries(LANGS).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tom de escrita</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              {Object.entries(TONES).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="create-actions">
          <button className="btn-primary" onClick={onGenerate} type="button">
            <Icon svg={iconSvg("wand")} style={{ width: 16, height: 16 }} /> Gerar e-book
          </button>
        </div>
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button className="chip" key={ex} type="button" onClick={() => setIdea(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {history.length ? (
        <div className="history">
          <h2>Seus e-books</h2>
          {history.map((h, i) => (
            <div className="hist-item glass" key={i}>
              <div>
                <div className="htitle">{h.title}</div>
                <div className="hmeta">
                  {h.chapters?.length || 0} páginas · {LANGS[h.language] || h.language}
                </div>
              </div>
              <button onClick={() => onOpenSaved(h)} type="button">
                Abrir
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function PreviewScreen({ ebook, pageIndex, setPageIndex, onNewIdea, onExport, exporting }) {
  const totalPages = (ebook.chapters?.length || 0) + 1;
  const isCover = pageIndex === 0;

  return (
    <>
      <div className="hero" style={{ marginBottom: 16 }}>
        <h1 className="display" style={{ fontSize: 26 }}>
          {ebook.title}
        </h1>
        <p>{ebook.subtitle || ""}</p>
      </div>

      <div className="preview-toolbar">
        <div className="left">
          <button
            className="iconbtn"
            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            aria-label="Página anterior"
          >
            <Icon svg={iconSvg("arrow")} flip />
          </button>
          <span className="pageindicator">
            {pageIndex + 1} / {totalPages}
          </span>
          <button
            className="iconbtn"
            onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
            disabled={pageIndex === totalPages - 1}
            aria-label="Próxima página"
          >
            <Icon svg={iconSvg("arrow")} />
          </button>
        </div>
        <div className="toolbar-actions">
          <button className="btn-ghost" onClick={onNewIdea} type="button">
            Nova ideia
          </button>
          <button className="btn-export" onClick={onExport} disabled={exporting} type="button">
            {exporting ? "Gerando PDF..." : "Baixar PDF"}
          </button>
        </div>
      </div>

      <div className="book-stage">
        <div className="page">
          {isCover ? (
            <EbookCoverPage ebook={ebook} />
          ) : (
            <EbookChapterPage chapter={ebook.chapters[pageIndex - 1]} index={pageIndex - 1} total={ebook.chapters.length} />
          )}
        </div>
      </div>

      <div className="dots">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div className={`dot ${i === pageIndex ? "active" : ""}`} key={i} />
        ))}
      </div>
    </>
  );
}
