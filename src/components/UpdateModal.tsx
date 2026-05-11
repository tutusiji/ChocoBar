import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

/**
 * 更新检查对话框组件
 * 显示当前版本和最新版本信息，提示是否有可用更新
 */
export function UpdateModal() {
  const { updateOpen, setUpdateOpen, updateInfo } = useAppStore();

  if (!updateOpen || !updateInfo) return null;

  return (
    <div
      className="search-overlay"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setUpdateOpen(false);
      }}
    >
      <div
        className="about-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="about-header">
          <div className="about-title">
            <h2>Check for Updates</h2>
          </div>
          <button
            className="btn btn-icon btn-close"
            onClick={() => setUpdateOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="about-body">
          <div className="update-status">
            {updateInfo.has_update ? (
              <>
                <AlertCircle size={32} color="var(--accent)" />
                <p>Update available: v{updateInfo.latest_version}</p>
              </>
            ) : (
              <>
                <CheckCircle size={32} color="#4caf50" />
                <p>{updateInfo.message}</p>
              </>
            )}
            <span className="update-version">
              Current version: v{updateInfo.current_version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
