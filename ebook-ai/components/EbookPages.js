import { iconSvg, THEMES, THEME_KEYS, LANGS } from "../lib/icons";

function Icon({ svg, style }) {
  return <span style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Block({ section }) {
  const type = section.type || "intro";
  let iconKey = "sparkle";
  if (type === "tip") iconKey = "bulb";
  else if (type === "warning") iconKey = "warn";
  else if (type === "example") iconKey = "check";
  else if (type === "summary") iconKey = "star";
  else if (type === "list") iconKey = "arrow";

  let bg = "#fff",
    iconBg = "#EFEDF7",
    iconColor = "#151420";
  if (type === "tip") {
    bg = "#FFF3D6";
    iconBg = "#FFC155";
    iconColor = "#4A3400";
  } else if (type === "warning") {
    bg = "#FFE3E9";
    iconBg = "#FF4D6D";
    iconColor = "#fff";
  } else if (type === "example") {
    bg = "#E4F5EA";
    iconBg = "#2FB170";
    iconColor = "#fff";
  } else if (type === "summary") {
    bg = "#E4EDFF";
    iconBg = "#2F6FED";
    iconColor = "#fff";
  }

  return (
    <div className="ebp-block" style={{ background: bg }}>
      <div className="eb-icon" style={{ background: iconBg, color: iconColor }}>
        <Icon svg={iconSvg(iconKey)} style={{ width: 15, height: 15, display: "flex" }} />
      </div>
      <div className="eb-content">
        {section.heading ? (
          <p className="eb-heading" style={{ color: type === "intro" ? "#726C63" : "#151420" }}>
            {section.heading}
          </p>
        ) : null}
        {type === "list" && Array.isArray(section.items) ? (
          <ul>
            {section.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        ) : (
          <p className="eb-text">{section.text || ""}</p>
        )}
      </div>
    </div>
  );
}

export function EbookChapterPage({ chapter, index, total }) {
  const theme = THEMES[chapter.colorTheme] || THEMES[THEME_KEYS[index % THEME_KEYS.length]];
  return (
    <div className="ebp-page">
      <div className="ebp-header" style={{ background: `linear-gradient(120deg, ${theme.bg}, ${theme.bg2})` }}>
        <div className="eh-badge">
          <Icon svg={iconSvg(chapter.icon)} style={{ width: 17, height: 17, display: "flex" }} />
        </div>
        <p className="eh-title">{chapter.title}</p>
        <p className="eh-sub">
          Página {index + 2} · Capítulo {index + 1} de {total}
        </p>
      </div>
      <div className="ebp-body">
        {(chapter.sections || []).map((s, i) => (
          <Block section={s} key={i} />
        ))}
      </div>
      <div className="ebp-footer">
        <span>{chapter.title}</span>
        <span>Gerado com IA</span>
      </div>
    </div>
  );
}

export function EbookCoverPage({ ebook }) {
  const chapters = ebook.chapters || [];
  const mosaic = chapters.slice(0, 8).map((c, i) => {
    const t = THEMES[c.colorTheme] || THEMES[THEME_KEYS[i % THEME_KEYS.length]];
    return (
      <div className="cv-chip" key={i} style={{ background: t.soft, borderColor: t.bg, color: t.bg }}>
        <Icon svg={iconSvg(c.icon)} style={{ width: 16, height: 16, display: "flex" }} />
      </div>
    );
  });
  return (
    <div
      className="ebp-cover"
      style={{ background: "radial-gradient(120% 90% at 15% 0%, #F3EEFF 0%, #FCFBF7 55%)" }}
    >
      <div
        className="cv-bg1"
        style={{
          width: 340,
          height: 340,
          background: "radial-gradient(circle, #7C5CFC55, transparent 70%)",
          top: -120,
          right: -100,
          position: "absolute",
        }}
      />
      <div
        className="cv-bg1"
        style={{
          width: 260,
          height: 260,
          background: "radial-gradient(circle, #22D3EE45, transparent 70%)",
          bottom: -80,
          left: -60,
          position: "absolute",
        }}
      />
      <div>
        <span className="cv-badge">
          <Icon svg={iconSvg("wand")} style={{ width: 12, height: 12, display: "inline-flex" }} /> Gerado por IA
        </span>
        <h1 className="cv-title">{ebook.title || "Seu e-book"}</h1>
        <p className="cv-sub">{ebook.subtitle || ""}</p>
        <div className="cv-mosaic">{mosaic}</div>
      </div>
      <div className="cv-footer">
        <span>{chapters.length} capítulos</span>
        <span>{LANGS[ebook.language] || "Português"}</span>
      </div>
    </div>
  );
}
