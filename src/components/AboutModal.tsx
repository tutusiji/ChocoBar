import { useEffect } from "react";
import { X, Globe, Mail, Github } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

/**
 * 关于对话框组件
 * 显示应用名称、版本、作者、许可证等信息
 */
export function AboutModal() {
  const { aboutOpen, setAboutOpen, appInfo, fetchAppInfo } = useAppStore();

  useEffect(() => {
    if (aboutOpen && !appInfo) {
      fetchAppInfo();
    }
  }, [aboutOpen, appInfo, fetchAppInfo]);

  if (!aboutOpen) return null;

  const info = appInfo || {
    name: "ChocoPanel",
    version: "0.1.0",
    description: "A lightweight Windows quick-launch panel",
    author: "ChocoPanel Developer",
    website: "https://github.com/chocopanel",
    email: "dev@chocopanel.app",
    license: "MIT",
  };

  return (
    <div
      className="search-overlay"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setAboutOpen(false);
      }}
    >
      <div
        className="about-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="about-header">
          <div className="about-icon">
            <svg width="48" height="48" viewBox="0 0 256 256" fill="none">
              <rect width="256" height="256" rx="48" fill="#1e1e1e" />
              <rect x="32" y="32" width="192" height="192" rx="24" fill="#2a2a2a" stroke="#f0c040" strokeWidth="4" />
              <rect x="56" y="64" width="56" height="56" rx="10" fill="#f0c040" opacity="0.9" />
              <rect x="128" y="64" width="56" height="56" rx="10" fill="#f0c040" opacity="0.6" />
              <rect x="56" y="136" width="56" height="56" rx="10" fill="#f0c040" opacity="0.4" />
              <rect x="128" y="136" width="56" height="56" rx="10" fill="#f0c040" opacity="0.25" />
            </svg>
          </div>
          <div className="about-title">
            <h2>{info.name}</h2>
            <span className="about-version">v{info.version}</span>
          </div>
          <button
            className="btn btn-icon btn-close"
            onClick={() => setAboutOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="about-body">
          <p className="about-desc">{info.description}</p>

          <div className="about-info-list">
            <div className="about-info-row">
              <span className="about-label">Author</span>
              <span className="about-value">{info.author}</span>
            </div>
            <div className="about-info-row">
              <span className="about-label">License</span>
              <span className="about-value">{info.license}</span>
            </div>
            <div className="about-info-row">
              <Globe size={14} />
              <a href={info.website} target="_blank" rel="noreferrer">
                {info.website}
              </a>
            </div>
            <div className="about-info-row">
              <Mail size={14} />
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </div>
            <div className="about-info-row">
              <Github size={14} />
              <a href={info.website} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
