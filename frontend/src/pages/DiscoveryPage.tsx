import { useEffect, useState } from "react";
import { getDiscoveryTargets } from "../lib/api";
import type { DiscoveryTarget } from "../lib/types";
import { Radio, Copy, Check, ExternalLink, Code2, RefreshCw, Terminal } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function DiscoveryPage() {
  const [discoveryTargets, setDiscoveryTargets] = useState<DiscoveryTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isCurlCopied, setIsCurlCopied] = useState(false);

  const fetchDiscovery = async () => {
    setIsLoading(true);
    try {
      const data = await getDiscoveryTargets();
      setDiscoveryTargets(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to query service discovery endpoint");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscovery();
  }, []);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(discoveryTargets, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const curlCommand = `curl -s http://localhost:8000/api/discovery | jq .`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setIsCurlCopied(true);
    setTimeout(() => setIsCurlCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Station Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Service Discovery
            </h2>
            <span className="linear-pill">
              /api/discovery
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-[21px]">
            JSON endpoint served to Prometheus <code className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded-[4px] border border-border text-xs">http_sd_configs</code> for live target orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchDiscovery}
            disabled={isLoading}
            aria-label="Poll service discovery endpoint"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-border bg-secondary hover:bg-muted text-sm font-medium text-foreground transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? 'animate-spin text-primary' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            aria-label="Copy Prometheus HTTP service discovery JSON configuration"
            className="flex items-center gap-1.5 h-8 px-3.5 py-[5px] rounded-[6px] bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm font-medium transition-colors shadow-xs"
          >
            {isCopied ? <Check className="h-4 w-4 text-white" aria-hidden="true" /> : <Copy className="h-4 w-4 text-white" aria-hidden="true" />}
            <span>{isCopied ? "Copied" : "Copy JSON"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-sans">
          <span className="font-semibold mr-2">[SD_ERROR]:</span>
          {error}
        </div>
      )}

      {/* Discovery Architecture Overview Card - Styled as Linear Monolith */}
      <div className="linear-monolith overflow-hidden">
        {/* Linear Header */}
        <div className="linear-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 text-[#8b95f6]">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-mono text-xs text-foreground font-semibold">
              Pipeline :: Prometheus HTTP Service Discovery
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="linear-pill">
              active_sd
            </span>
            <a
              href="http://localhost:9090/targets"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Inspect Prometheus native targets page in new tab"
              className="inline-flex items-center gap-1.5 text-xs text-[#8b95f6] hover:text-[#a5b4fc] hover:underline font-semibold"
            >
              <span>Prometheus Targets</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">
            Prometheus daemon polls this endpoint every scrape interval. Node changes synchronize without daemon reloads.
          </p>

          {/* Linear Metric Chambers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="linear-card p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-muted-foreground block font-mono font-semibold tracking-wider">
                Pipeline // Targets
              </span>
              <span className="text-2xl font-bold tabular-nums text-[#8b95f6] mt-2 block font-mono">
                {discoveryTargets.length} <span className="text-xs font-normal text-muted-foreground">NODES</span>
              </span>
            </div>

            <div className="linear-card p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-muted-foreground block font-mono font-semibold tracking-wider">
                Mechanism // Config
              </span>
              <span className="text-sm font-semibold text-foreground mt-2 block font-mono">
                http_sd_configs
              </span>
            </div>

            <div className="linear-card p-3.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-muted-foreground block font-mono font-semibold tracking-wider">
                Filter // Predicate
              </span>
              <span className="text-sm font-semibold text-emerald-400 mt-2 block font-mono">
                is_active = True
              </span>
            </div>
          </div>

          {/* CLI Test Helper inside Linear Well */}
          <div className="linear-well p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
              <Terminal className="h-4 w-4 text-[#8b95f6] shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground shrink-0">$</span>
              <span className="break-all text-foreground font-medium" title={curlCommand}>{curlCommand}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCurl}
              aria-label="Copy cURL test command"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] dark:bg-white/[0.05] bg-slate-200 hover:bg-white/[0.1] text-xs font-semibold text-foreground border border-white/10 dark:border-white/10 border-slate-300 transition-colors shrink-0 ml-3"
            >
              {isCurlCopied ? <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              <span>{isCurlCopied ? "Copied" : "Copy cURL"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Targets Inspection List & JSON Code Viewer in Linear Monoliths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual Targets in Linear Monolith */}
        <div className="linear-monolith flex flex-col overflow-hidden">
          <div className="linear-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5e6ad2]" />
              <span className="font-mono text-xs font-semibold text-foreground">
                advertised_nodes ({discoveryTargets.length})
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#8b95f6]">HTTP-SD</span>
          </div>

          <div className="p-4 flex-1">
            {discoveryTargets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center font-mono">
                // No active scrape targets currently registered in database.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {discoveryTargets.map((item, idx) => (
                  <div
                    key={idx}
                    className="linear-card p-3 transition-colors font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {item.targets.join(", ")}
                      </span>
                      <span className="linear-pill">
                        DISCOVERED
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {Object.entries(item.labels).map(([key, val]) => (
                        <span
                          key={key}
                          className="rounded-md bg-white/[0.05] dark:bg-white/[0.05] bg-slate-100 px-2 py-0.5 border border-white/10 dark:border-white/10 border-slate-200 text-muted-foreground"
                        >
                          <span className="text-[#8b95f6]">{key}</span>: <span className="text-foreground">{val}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* JSON Code Viewer in Linear Monolith */}
        <div className="linear-monolith flex flex-col overflow-hidden">
          <div className="linear-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#8b95f6]" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold text-foreground">
                raw_payload.json
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase">
              GET /api/discovery
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <pre className="linear-well flex-1 max-h-[340px] overflow-auto p-3 text-xs font-mono text-[#8b95f6] leading-relaxed">
              {JSON.stringify(discoveryTargets, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
