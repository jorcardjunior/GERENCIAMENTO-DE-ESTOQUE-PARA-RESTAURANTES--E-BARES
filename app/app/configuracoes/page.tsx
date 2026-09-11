"use client";

import { NeuCard } from "@/components/ui/neu-card";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import {
  SETTING_CATEGORIES,
  SETTING_DESCRIPTIONS,
  SETTING_LABELS,
  SETTING_OPTIONS,
  SETTING_TYPES,
} from "@/lib/settings";
import { playAlert, playBeep } from "@/lib/sound";
import {
  Bell,
  DollarSign,
  Loader2,
  Package,
  Save,
  Settings2,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";

const CATEGORIES: { key: string; label: string; icon: any; description: string }[] = [
  {
    key: "notifications",
    label: "Notificações",
    icon: Bell,
    description: "Alertas sonoros, vencimentos e limites de estoque",
  },
  {
    key: "stock",
    label: "Estoque",
    icon: Package,
    description: "Lead time, consumo e margem de segurança",
  },
  {
    key: "financial",
    label: "Financeiro",
    icon: DollarSign,
    description: "Metas de CMV e fechamento mensal",
  },
  { key: "system", label: "Sistema", icon: Settings2, description: "Período padrão do dashboard" },
];

const _CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all ${value ? "bg-brand-500" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { settings, loading, saving, save } = useSettings();
  const [activeCategory, setActiveCategory] = useState<string>("notifications");
  const [localPrefs, setLocalPrefs] = useState({ sound: true, volume: "50", fontSize: "normal" });
  const [pendingFontSize, setPendingFontSize] = useState<string>("normal");
  const [testPlaying, setTestPlaying] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  useEffect(() => {
    const saved = localStorage.getItem("user_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalPrefs(parsed);
        setPendingFontSize(parsed.fontSize || "normal");
      } catch {}
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.fontSize = localPrefs.fontSize;
  }, [localPrefs.fontSize]);

  function updateLocal(key: string, value: string) {
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
    localStorage.setItem("user_prefs", JSON.stringify(updated));
  }

  function handleChange(key: string, value: string) {
    save({ [key]: value });
  }

  function playTest() {
    setTestPlaying(true);
    playAlert(Number(localPrefs.volume) || 50);
    setTimeout(() => playBeep(Number(localPrefs.volume) || 50), 800);
    setTimeout(() => setTestPlaying(false), 1500);
  }

  function renderSetting(key: string) {
    const type = SETTING_TYPES[key] || "text";
    const label = SETTING_LABELS[key] || key;
    const desc = SETTING_DESCRIPTIONS[key] || "";
    const value = settings[key] ?? "";
    const options = SETTING_OPTIONS[key];

    if (type === "boolean") {
      return (
        <div
          key={key}
          className="flex items-center justify-between py-4 border-b border-border last:border-0"
        >
          <div className="flex-1 pr-4">
            <p className="text-sm font-medium text-text">{label}</p>
            {desc && <p className="text-xs text-text/40 mt-0.5">{desc}</p>}
          </div>
          <Toggle
            value={value === "true"}
            onChange={(v) => handleChange(key, v ? "true" : "false")}
          />
        </div>
      );
    }

    if (type === "select" && options) {
      return (
        <div key={key} className="py-4 border-b border-border last:border-0">
          <p className="text-sm font-medium text-text mb-1">{label}</p>
          {desc && <p className="text-xs text-text/40 mb-2">{desc}</p>}
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "var(--color-text)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              outline: "none",
              cursor: "pointer",
              width: "100%",
              maxWidth: 240,
            }}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ background: "var(--surface)", color: "var(--text)" }}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={key} className="py-4 border-b border-border last:border-0">
        <p className="text-sm font-medium text-text mb-1">{label}</p>
        {desc && <p className="text-xs text-text/40 mb-2">{desc}</p>}
        <div className="flex items-center gap-3">
          <input
            type={type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            min={0}
            max={key.includes("volume") ? 100 : undefined}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "var(--color-text)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              outline: "none",
              width: 100,
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-surface min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-surface min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              Configurações
            </h1>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: 4 }}>
              {isAdmin
                ? "Gerencie todas as configurações do sistema"
                : "Suas preferências pessoais"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(37,99,235,0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(37,99,235,0.15)",
            }}
          >
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[11px] font-bold text-brand-400">ADMIN</span>
          </div>
        )}
      </div>

      {/* Personal Preferences (everyone) */}
      <NeuCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(37,99,235,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Volume2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Preferências Pessoais</h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
              Configurações locais deste dispositivo
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Alerta Sonoro</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                Tocar som ao receber notificações
              </p>
            </div>
            <Toggle
              value={localPrefs.sound}
              onChange={(v) => updateLocal("sound", v ? "true" : "false")}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-1">Volume do Alerta</p>
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
              <input
                type="range"
                min="0"
                max="100"
                value={localPrefs.volume}
                onChange={(e) => updateLocal("volume", e.target.value)}
                style={{ flex: 1, accentColor: "#2563eb" }}
              />
              <Volume2 className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
              <span className="text-sm font-bold text-text w-8 text-right tabular-nums">
                {localPrefs.volume}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-1">Tamanho da Fonte</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
              Aumentar textos nos gráficos e sistema
            </p>
            <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
              <select
                value={pendingFontSize}
                onChange={(e) => setPendingFontSize(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "var(--color-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "8px 14px",
                  outline: "none",
                  cursor: "pointer",
                  flex: 1,
                  maxWidth: 180,
                }}
              >
                <option
                  value="small"
                  style={{ background: "var(--surface)", color: "var(--text)" }}
                >
                  Pequena
                </option>
                <option
                  value="normal"
                  style={{ background: "var(--surface)", color: "var(--text)" }}
                >
                  Normal
                </option>
                <option
                  value="large"
                  style={{ background: "var(--surface)", color: "var(--text)" }}
                >
                  Grande
                </option>
                <option
                  value="xlarge"
                  style={{ background: "var(--surface)", color: "var(--text)" }}
                >
                  Extra Grande
                </option>
              </select>
              <button
                onClick={() => updateLocal("fontSize", pendingFontSize)}
                disabled={pendingFontSize === localPrefs.fontSize}
                style={{
                  padding: "8px 18px",
                  background:
                    pendingFontSize === localPrefs.fontSize
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border:
                    pendingFontSize === localPrefs.fontSize
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                  borderRadius: "10px",
                  color:
                    pendingFontSize === localPrefs.fontSize
                      ? "var(--color-text-tertiary)"
                      : "white",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: pendingFontSize === localPrefs.fontSize ? "default" : "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {pendingFontSize === localPrefs.fontSize ? "Aplicado" : "Aplicar"}
              </button>
            </div>
          </div>
          <button
            onClick={playTest}
            disabled={testPlaying || !localPrefs.sound}
            style={{
              padding: "8px 18px",
              background: testPlaying ? "rgba(37,99,235,0.3)" : "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: "10px",
              color: testPlaying ? "var(--color-text-secondary)" : "var(--color-brand-400)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: testPlaying ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            {testPlaying ? "Tocando..." : "Testar Som"}
          </button>
        </div>
      </NeuCard>

      {/* Admin: System Settings */}
      {isAdmin && (
        <>
          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: active
                      ? "1px solid rgba(37,99,235,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: active ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${active ? "text-brand-400" : "text-text-secondary"}`}
                  />
                  <p className="text-sm font-bold text-text">{cat.label}</p>
                  <p
                    style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: 2 }}
                  >
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Settings Panel */}
          <NeuCard className="p-6">
            {CATEGORIES.map((cat) => {
              if (cat.key !== activeCategory) return null;
              const Icon = cat.icon;
              return (
                <div key={cat.key}>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        background: "rgba(37,99,235,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text">{cat.label}</h2>
                      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    {Object.entries(settings)
                      .filter(([key]) => SETTING_CATEGORIES[key] === cat.key)
                      .map(([key]) => renderSetting(key))}
                  </div>
                </div>
              );
            })}
          </NeuCard>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => save(settings)}
              disabled={saving}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: saving ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </>
      )}

      {/* Info Card */}
      <NeuCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-text-tertiary)",
              letterSpacing: "0.1em",
            }}
          >
            SOBRE AS CONFIGURAÇÕES
          </p>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
          {isAdmin
            ? "As configurações de sistema são aplicadas globalmente. Alterações em lead time, margem de segurança e dias de consumo afetam diretamente a Sugestão de Compra. As preferências pessoais (som, volume) são salvas apenas neste dispositivo."
            : "Suas preferências pessoais de som e volume são salvas apenas neste dispositivo. As configurações do sistema são gerenciadas pelo administrador."}
        </p>
      </NeuCard>
    </div>
  );
}
