import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import type { AppItem } from "../types";

/**
 * 搜索模态框组件
 * 支持按名称搜索已安装应用（防抖，至少 2 字符触发），并将选中的应用添加到面板
 */
export function SearchModal() {
  const { searchOpen, setSearchOpen, pinnedApps, addPinnedApp } =
    useAppStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 打开时只聚焦，不加载任何数据
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // 防抖搜索：输入至少 2 个字符才触发，400ms 延迟
  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.trim().length < 2) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const apps = await invoke<AppItem[]>("search_apps", { query: q });
          const pinnedIds = new Set(pinnedApps.map((p) => p.id));
          setResults(apps.filter((a) => !pinnedIds.has(a.id)));
          setSearched(true);
        } catch (e) {
          console.error("Search failed:", e);
        }
        setLoading(false);
      }, 400);
    },
    [pinnedApps]
  );

  // 搜索输入变化处理
  const handleQueryChange = (value: string) => {
    setQuery(value);
    doSearch(value);
  };

  if (!searchOpen) return null;

  // 将搜索结果中的应用添加到面板，并从结果列表中移除
  const handleAdd = (app: AppItem) => {
    addPinnedApp(app);
    setResults((prev) => prev.filter((a) => a.id !== app.id));
  };

  return (
    <div
      className="search-overlay"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSearchOpen(false);
      }}
    >
      <div
        className="search-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-header">
          <Search size={18} />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Type at least 2 characters to search..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
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
          {loading ? (
            <div className="search-empty">Searching...</div>
          ) : !searched ? (
            <div className="search-empty">
              Type to search installed applications
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              No applications found for "{query}"
            </div>
          ) : (
            results.map((app) => (
              <div key={app.id} className="search-item">
                <div className="si-icon">
                  {app.icon_data ? (
                    <img src={app.icon_data} alt={app.name} />
                  ) : (
                    <span>{app.name.charAt(0).toUpperCase()}</span>
                  )}
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
