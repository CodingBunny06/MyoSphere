import { useState } from "react";

type Section = "Overview" | "Training" | "Nutrition" | "Progress" | "Studio";
const sections: Section[] = ["Overview", "Training", "Nutrition", "Progress", "Studio"];
const navIcons: Record<Section, string> = {
  Overview: "⌂", Training: "↗", Nutrition: "◒", Progress: "◷", Studio: "✳",
};

function App() {
  const [active, setActive] = useState<Section>("Overview");
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="app-shell">
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
            {showProfile && <div className="profile-popover"><strong>Your profile</strong><span>Local preview</span><button onClick={() => setShowProfile(false)}>Close</button></div>}
          </div>
        </header>

        <div className="page-content">
          {active === "Overview" ? (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow">SUNDAY, NOVEMBER 22</div><h1>Your space to <em>get stronger.</em></h1><p className="subheading">A little progress, consistently made.</p></div>
                <div className="streak-card"><span className="streak-symbol">✳</span><div><strong>0 day streak</strong><small>Your next chapter starts today</small></div></div>
              </section>

              <section className="hero-card">
                <div className="hero-copy"><span className="hero-kicker">YOUR NEXT SESSION</span><h2>Make today<br/>count.</h2><p>Your training journey is ready when you are.</p><button className="primary-button" onClick={() => setActive("Training")}>Explore training <span>↗</span></button></div>
                <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core">M<span>✳</span></div><div className="orbit-caption">BUILT AROUND YOU</div></div>
                <div className="hero-index">01 — 05</div>
              </section>

              <section className="section-heading"><div><span className="eyebrow">YOUR OVERVIEW</span><h2>The essentials</h2></div><span className="muted-label">A fresh start</span></section>
              <section className="metric-grid">
                <article className="metric-card"><div className="metric-top"><span>TRAINING</span><span className="metric-icon">↗</span></div><strong>—</strong><p>Workouts this week</p><div className="metric-foot">Log your first session <span>→</span></div></article>
                <article className="metric-card"><div className="metric-top"><span>NUTRITION</span><span className="metric-icon">◒</span></div><strong>—</strong><p>Daily energy logged</p><div className="metric-foot">Start a food diary <span>→</span></div></article>
                <article className="metric-card"><div className="metric-top"><span>PROGRESS</span><span className="metric-icon">◷</span></div><strong>—</strong><p>Progress check-ins</p><div className="metric-foot">Add your first check-in <span>→</span></div></article>
              </section>

              <section className="lower-grid">
                <article className="panel week-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR ROUTINE</span><h3>This week</h3></div><button className="text-button" onClick={() => setActive("Training")}>View plan ↗</button></div><div className="week-days">{["M","T","W","T","F","S","S"].map((day, i) => <div className="day-column" key={i}><span>{day}</span><div className={i === 6 ? "day-dot today" : "day-dot"}>{i === 6 ? "•" : ""}</div></div>)}</div><div className="empty-state"><span>✳</span><p>Your training week will take shape here.</p></div></article>
                <article className="panel focus-panel"><span className="eyebrow">A NOTE TO SELF</span><div className="focus-quote">“Small steps.<br/><em>Strong foundations.</em>”</div><p>Build habits that last. The numbers will follow.</p><div className="focus-line" /></article>
              </section>
              <footer className="page-footer"><span>MYOSPHERE · YOUR FITNESS, IN YOUR ORBIT</span><span>LOCAL-FIRST · PRIVATE BY DEFAULT</span></footer>
            </>
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