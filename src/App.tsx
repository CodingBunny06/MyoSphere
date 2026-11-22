import { useEffect, useState } from "react";
import AnatomyStudio from "./components/AnatomyStudio";
import { NutritionPage, ProgressPage, TrainingPage } from "./modules/WorkspaceModules";

type Section = "Overview" | "Training" | "Nutrition" | "Progress" | "Studio" | "Settings";
type Theme = "cyberpunk" | "matrix" | "synthwave" | "arctic" | "solar";
const themeOptions: { id: Theme; name: string; description: string; colors: string[] }[] = [
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan · electric magenta", colors: ["#080b14", "#62f3ff", "#ff4fd8"] },
  { id: "matrix", name: "Matrix", description: "Terminal green · acid lime", colors: ["#07110d", "#65ff9a", "#c7ff54"] },
  { id: "synthwave", name: "Synthwave", description: "Ultraviolet · hot pink", colors: ["#10091d", "#ad7cff", "#ff5ca8"] },
  { id: "arctic", name: "Arctic", description: "Ice blue · glacier teal", colors: ["#07131d", "#83ddff", "#5effd0"] },
  { id: "solar", name: "Solar flare", description: "Amber · molten orange", colors: ["#17100b", "#ffbd59", "#ff704d"] },
];
const sections: Section[] = ["Overview", "Training", "Nutrition", "Progress", "Studio"];
function readEntries(key: string): Array<Record<string, unknown>> {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function localDateLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
}

const navIcons: Record<Section, string> = {
  Overview: "⌂", Training: "↗", Nutrition: "◒", Progress: "◷", Studio: "✳", Settings: "⚙",
};

function App() {
  const [active, setActive] = useState<Section>("Overview");
  const [showProfile, setShowProfile] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState({ workouts: 0, calories: 0, checkIns: 0 });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("myosphere-theme");
    return themeOptions.some((option) => option.id === saved) ? (saved as Theme) : "cyberpunk";
  });

  useEffect(() => {
    window.localStorage.setItem("myosphere-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setActive("Overview")}>
          <span className="brand-mark">M</span>
          <span>myosphere<span className="brand-dot">.</span></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {sections.map((section) => (
            <button key={section} className={active === section ? "nav-link active" : "nav-link"} onClick={() => setActive(section)}>
              <span className="nav-icon">{navIcons[section]}</span>{section}
              {section === "Overview" && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="settings-shortcut" onClick={() => setActive("Settings")}><span>⚙</span> Settings</button>
          <div className="privacy-note"><span className="lock-icon">⌑</span><div><strong>Your space, your data</strong><small>Private by default</small></div></div>
          <div className="sidebar-version">MYOSPHERE · EARLY ACCESS</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">M</span><strong>myosphere<span className="brand-dot">.</span></strong></div>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <span className="private-chip"><span /> Private space</span>
            <button className="avatar-button" aria-label="Open profile menu" onClick={() => setShowProfile(!showProfile)}>B</button>
            {showProfile && <div className="profile-popover"><strong>Your profile</strong><span>Local preview</span><button onClick={() => { setActive("Settings"); setShowProfile(false); }}>⚙ Settings</button><button onClick={() => setShowProfile(false)}>Close</button></div>}
          </div>
        </header>

        <div className="page-content">
          {active === "Overview" ? (
            <>
              <section className="quote-marquee" aria-label="Motivation from athletes">
                <div className="quote-track">
                  <div className="quote-set"><span>“The last three or four reps is what makes the muscle grow.” <b>— ARNOLD SCHWARZENEGGER</b></span><i>✳</i><span>“Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.” <b>— RONNIE COLEMAN</b></span><i>✳</i></div>
                  <div className="quote-set" aria-hidden="true"><span>“The last three or four reps is what makes the muscle grow.” <b>— ARNOLD SCHWARZENEGGER</b></span><i>✳</i><span>“Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.” <b>— RONNIE COLEMAN</b></span><i>✳</i></div>
                </div>
              </section>
              <section className="welcome-row">
                <div><div className="eyebrow">{localDateLabel()}</div><h1>Your space to <em>get stronger.</em></h1><p className="subheading">A little progress, consistently made.</p></div>
                <div className="streak-card"><span className="streak-symbol">✳</span><div><strong>0 day streak</strong><small>Your next chapter starts today</small></div></div>
              </section>

              <section className="hero-card">
                <div className="hero-copy"><span className="hero-kicker">YOUR NEXT SESSION</span><h2>Make today<br/>count.</h2><p>Your training journey is ready when you are.</p><button className="primary-button" onClick={() => setActive("Training")}>Explore training <span>↗</span></button></div>
                <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core">M<span>✳</span></div><div className="orbit-caption">BUILT AROUND YOU</div></div>
                <div className="hero-index">01 — 05</div>
              </section>

              <section className="anatomy-card" aria-label="3D anatomy preview">
                <div className="anatomy-copy">
                  <span className="eyebrow">COMING INTO VIEW · 3D ANATOMY</span>
                  <h2>Understand your <em>muscles.</em></h2>
                  <p>Explore the body, discover muscle groups and see how each exercise works.</p>
                  <button className="anatomy-button" onClick={() => setActive("Studio")}>Explore the 3D studio <span>↗</span></button>
                </div>
                <div className="anatomy-visual" aria-hidden="true">
                  <div className="anatomy-orbit anatomy-orbit-a" />
                  <div className="anatomy-orbit anatomy-orbit-b" />
                  <svg className="anatomy-body" viewBox="0 0 150 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="75" cy="20" r="14" />
                    <path d="M62 40 C52 42 43 48 38 61 L25 91 L36 98 L51 72 L48 119 L43 169 L57 171 L68 126 L75 126 L82 126 L93 171 L107 169 L102 119 L99 72 L114 98 L125 91 L112 61 C107 48 98 42 88 40 Z" />
                    <path className="anatomy-muscle" d="M62 45 L75 53 L88 45 L94 67 L75 77 L56 67 Z" />
                    <path className="anatomy-muscle" d="M53 74 L69 82 L66 112 L50 108 Z M97 74 L81 82 L84 112 L100 108 Z" />
                    <path className="anatomy-muscle" d="M68 82 L75 79 L82 82 L80 119 L70 119 Z" />
                    <path className="anatomy-muscle" d="M51 121 L68 126 L58 165 L45 165 Z M99 121 L82 126 L92 165 L105 165 Z" />
                    <path className="anatomy-detail" d="M75 53 V119 M56 67 L75 77 L94 67 M50 108 L66 112 M100 108 L84 112" />
                  </svg>
                  <span className="anatomy-tag">MUSCLE MAP · PREVIEW</span>
                </div>
              </section>

              <section className="section-heading"><div><span className="eyebrow">YOUR OVERVIEW</span><h2>The essentials</h2></div><span className="muted-label">A fresh start</span></section>
              <section className="metric-grid">
                <article className="metric-card"><div className="metric-top"><span>TRAINING</span><span className="metric-icon">↗</span></div><strong>{overviewMetrics.workouts}</strong><p>Workouts this week</p><div className="metric-foot">Open training log <span>→</span></div></article>
                <article className="metric-card"><div className="metric-top"><span>NUTRITION</span><span className="metric-icon">◒</span></div><strong>{overviewMetrics.calories.toLocaleString()}</strong><p>Calories logged today</p><div className="metric-foot">Open food diary <span>→</span></div></article>
                <article className="metric-card"><div className="metric-top"><span>PROGRESS</span><span className="metric-icon">◷</span></div><strong>{overviewMetrics.checkIns}</strong><p>Progress check-ins</p><div className="metric-foot">Open progress journal <span>→</span></div></article>
              </section>

              <section className="lower-grid">
                <article className="panel week-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR ROUTINE</span><h3>This week</h3></div><button className="text-button" onClick={() => setActive("Training")}>View plan ↗</button></div><div className="week-days">{["M","T","W","T","F","S","S"].map((day, i) => <div className="day-column" key={i}><span>{day}</span><div className={i === 6 ? "day-dot today" : "day-dot"}>{i === 6 ? "•" : ""}</div></div>)}</div><div className="empty-state"><span>✳</span><p>Your training week will take shape here.</p></div></article>
                <article className="panel focus-panel"><span className="eyebrow">A NOTE TO SELF</span><div className="focus-quote">“Small steps.<br/><em>Strong foundations.</em>”</div><p>Build habits that last. The numbers will follow.</p><div className="focus-line" /></article>
              </section>
              <footer className="page-footer"><span>MYOSPHERE · YOUR FITNESS, IN YOUR ORBIT</span><span>LOCAL-FIRST · PRIVATE BY DEFAULT</span></footer>
            </>
          ) : active === "Training" ? (
            <TrainingPage />
          ) : active === "Nutrition" ? (
            <NutritionPage />
          ) : active === "Progress" ? (
            <ProgressPage />
          ) : active === "Studio" ? (
            <AnatomyStudio />
          ) : active === "Settings" ? (
            <section className="settings-page">
              <div className="settings-heading"><span className="eyebrow">MYOSPHERE / PREFERENCES</span><h1>Make it <em>yours.</em></h1><p>Choose the colour atmosphere for your workspace. Your selection stays saved on this device.</p></div>
              <div className="settings-section-title"><div><span className="eyebrow">APPEARANCE</span><h2>Colour themes</h2></div><span className="settings-local-note">SAVED LOCALLY</span></div>
              <div className="theme-grid">
                {themeOptions.map((option) => (
                  <button key={option.id} className={theme === option.id ? "theme-option selected" : "theme-option"} onClick={() => setTheme(option.id)} aria-pressed={theme === option.id}>
                    <span className="theme-preview" style={{ background: option.colors[0] }}><i style={{ background: option.colors[1] }} /><i style={{ background: option.colors[2] }} /><b style={{ background: option.colors[1] }} /></span>
                    <span className="theme-option-copy"><strong>{option.name}</strong><small>{option.description}</small></span>
                    <span className="theme-check">{theme === option.id ? "✓" : "○"}</span>
                  </button>
                ))}
              </div>
              <div className="settings-footnote"><span>⌑</span> Theme preferences are stored in this browser only. They don't change your account or share data externally.</div>
            </section>
          ) : (
            <section className="coming-soon"><span className="eyebrow">MYOSPHERE / {active.toUpperCase()}</span><div className="coming-icon">{navIcons[active]}</div><h1>{active}<em> is taking shape.</em></h1><p>This space is part of the MyoSphere roadmap. We're building the foundations first.</p><button className="primary-button" onClick={() => setActive("Overview")}>Back to overview <span>↗</span></button></section>
          )}
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {sections.map((section) => <button key={section} className={active === section ? "mobile-nav-item selected" : "mobile-nav-item"} onClick={() => setActive(section)}><span>{navIcons[section]}</span><small>{section}</small></button>)}
        </nav>
      </main>
    </div>
  );
}

export default App;