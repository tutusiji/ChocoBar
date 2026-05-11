import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

/**
 * 搜索模态框组件
 * 支持按名称搜索已安装应用，并将选中的应用添加到面板
 */
export function SearchModal() {
  const {
    searchOpen,
    searchQuery,
    searchResults,
    setSearchOpen,
    setSearchQuery,
    addPinnedApp,
  } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  // 将搜索结果中的应用添加到面板
  const handleAdd = (app: (typeof searchResults)[0]) => {
    addPinnedApp(app);
  };

  // 点击遮罩层关闭搜索模态框
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSearchOpen(false);
    }
  };

  return (
    <div className="search-overlay" onClick={handleOverlayClick}>
      <div className="search-modal">
        <div className="search-header">
          <Search size={18} />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
              }
            }}
          />
          <button
            className="btn btn-icon"
            onClick={() => setSearchOpen(false)}
          >
            <X size={14} />
          </button>
        </div>
        <div className="search-results">
          {searchResults.length === 0 ? (
            <div className="search-empty">
              {searchQuery
                ? "No applications found"
                : "Type to search applications..."}
            </div>
          ) : (
            searchResults.map((app) => (
              <div key={app.id} className="search-item">
                <div className="si-icon">
                  <span>{app.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="si-info">
                  <div className="si-name">{app.name}</div>
                  <div className="si-path">{app.path}</div>
                </div>
                <button className="si-add" onClick={() => handleAdd(app)}>
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
