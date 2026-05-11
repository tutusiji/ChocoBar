import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import type { AppItem } from "../types";

/** 图标加载队列：限制并发数量，避免同时发起过多请求 */
const iconLoadQueue: Array<() => Promise<void>> = [];
let activeLoads = 0;
const MAX_CONCURRENT_LOADS = 3;

/** 处理图标加载队列 */
async function processQueue() {
  if (activeLoads >= MAX_CONCURRENT_LOADS || iconLoadQueue.length === 0) {
    return;
  }

  activeLoads++;
  const task = iconLoadQueue.shift();
  if (task) {
    try {
      await task();
    } catch (e) {
      console.error("图标加载失败:", e);
    }
  }
  activeLoads--;
  processQueue();
}

/**
 * 搜索模态框组件
 * 支持按关键词搜索已安装应用，最少输入 2 个字符才触发搜索
 * 搜索结果限制为 50 个，图标使用延迟加载避免卡顿
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

  // 防抖搜索：输入至少2个字符才触发
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
          console.error("搜索失败:", e);
        }
        setLoading(false);
      }, 400);
    },
    [pinnedApps]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    doSearch(value);
  };

  if (!searchOpen) return null;

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
            placeholder="输入至少 2 个字符搜索..."
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
            <div className="search-empty">正在搜索...</div>
          ) : !searched ? (
            <div className="search-empty">
              输入关键词搜索已安装的应用
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              未找到与 "{query}" 匹配的应用
            </div>
          ) : (
            results.map((app) => (
              <SearchResultItem
                key={app.id}
                app={app}
                onAdd={handleAdd}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 搜索结果项组件
 * 图标使用延迟加载队列，限制并发数量，显示首字母占位符
 */
function SearchResultItem({
  app,
  onAdd,
}: {
  app: AppItem;
  onAdd: (app: AppItem) => void;
}) {
  const [iconData, setIconData] = useState<string | null>(app.icon_data);
  const [iconLoading, setIconLoading] = useState(!app.icon_data);

  // 延迟加载图标：使用队列限制并发数量
  useEffect(() => {
    if (app.icon_data) {
      setIconData(app.icon_data);
      setIconLoading(false);
      return;
    }

    let cancelled = false;

    const loadIcon = async () => {
      try {
        const icon = await invoke<string | null>("get_app_icon", {
          path: app.path,
        });
        if (!cancelled && icon) {
          setIconData(icon);
        }
      } catch (e) {
        console.error("获取图标失败:", e);
      }
      if (!cancelled) {
        setIconLoading(false);
      }
    };

    // 加入队列，限制并发
    iconLoadQueue.push(loadIcon);
    processQueue();

    return () => {
      cancelled = true;
    };
  }, [app.path, app.icon_data]);

  return (
    <div className="search-item">
      <div className="si-icon">
        {iconLoading ? (
          <span className="si-icon-loading" />
        ) : iconData ? (
          <img src={iconData} alt={app.name} />
        ) : (
          <span>{app.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="si-info">
        <div className="si-name">{app.name}</div>
        <div className="si-path">{app.path}</div>
      </div>
      <button className="si-add" onClick={() => onAdd(app)}>
        添加
      </button>
    </div>
  );
}
