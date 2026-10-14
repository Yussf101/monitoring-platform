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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#7d8590] uppercase tracking-wider mb-1">
            <span className="text-[#4493f8] font-medium">PROMETHEUS ENGINE // DISCOVERY</span>
            <span>•</span>
            <span>HTTP_SD RUNTIME</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f6fc]">
              Prometheus Service Discovery
            </h2>
            <Badge variant="info" className="font-mono text-xs uppercase">
              /api/discovery
            </Badge>
          </div>
          <p className="text-sm text-[#7d8590] mt-1 max-w-2xl leading-[21px]">
            Canonical JSON endpoint served to Prometheus <code className="font-mono text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded-[4px] border border-[#30363d] text-xs">http_sd_configs</code> for instant scrape target orchestration without daemon reloads.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchDiscovery}
            disabled={isLoading}
            aria-label="Poll service discovery endpoint"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-[#30363d] bg-[#212830] hover:bg-[#30363d] hover:border-[#8b949e] text-sm font-medium text-[#f0f6fc] hover:text-white transition-colors disabled:opacity-50 shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#7d8590] ${isLoading ? 'animate-spin text-[#4493f8]' : ''}`} aria-hidden="true" />
            <span>Poll SD</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            aria-label="Copy Prometheus HTTP service discovery JSON configuration"
            className="flex items-center gap-1.5 h-8 px-3.5 py-[5px] rounded-[6px] bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm font-medium transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset] border border-[rgba(240,246,252,0.1)]"
          >
            {isCopied ? <Check className="h-4 w-4 text-white" aria-hidden="true" /> : <Copy className="h-4 w-4 text-white" aria-hidden="true" />}
            <span>{isCopied ? "Copied JSON" : "Copy SD Config"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-xs text-[#f85149] font-sans">
          <span className="font-semibold mr-2">[SD_ERROR]:</span>
          {error}
        </div>
      )}

      {/* Discovery Architecture Overview Card */}
      <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_1px_0_rgba(27,31,36,0.1)] overflow-hidden">
        {/* Box Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#21262d] border border-[#30363d] text-[#848d97]">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#e6edf3]">
                HTTP Service Discovery Pipeline
              </span>
              <span className="hidden sm:inline-block text-xs text-[#848d97] ml-2">
                — Zero-reload scraper synchronizer
              </span>
            </div>
          </div>

          <a
            href="http://localhost:9090/targets"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Inspect Prometheus native targets page in new tab"
            className="inline-flex items-center gap-1.5 text-xs text-[#2f81f7] hover:underline font-semibold"
          >
            <span>Prometheus Native Targets</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          </a>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#848d97] leading-relaxed">
            The Prometheus daemon queries this endpoint every scrape interval. New and modified targets synchronize immediately without restarting or sending SIGHUP.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-3">
              <span className="text-[10px] uppercase text-[#848d97] block font-semibold">
                SD Target Count
              </span>
              <span className="text-lg font-semibold tabular-nums text-[#e6edf3] mt-1 block font-mono">
                {discoveryTargets.length} <span className="text-xs font-normal text-[#848d97]">NODES</span>
              </span>
            </div>

            <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-3">
              <span className="text-[10px] uppercase text-[#848d97] block font-semibold">
                Mechanism
              </span>
              <span className="text-sm font-semibold text-[#58a6ff] mt-1 block font-mono">
                http_sd_configs
              </span>
            </div>

            <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-3">
              <span className="text-[10px] uppercase text-[#848d97] block font-semibold">
                Filter Predicate
              </span>
              <span className="text-sm font-semibold text-[#3fb950] mt-1 block font-mono">
                is_active = True
              </span>
            </div>
          </div>

          {/* CLI Test Helper styled as GitHub Terminal Block */}
          <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
              <Terminal className="h-4 w-4 text-[#848d97] shrink-0" aria-hidden="true" />
              <span className="text-[#6e7681] shrink-0">$</span>
              <span className="break-all text-[#e6edf3] font-medium" title={curlCommand}>{curlCommand}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCurl}
              aria-label="Copy cURL test command"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#c9d1d9] hover:text-white border border-[#30363d] transition-colors shrink-0 ml-3"
            >
              {isCurlCopied ? <Check className="h-3 w-3 text-[#3fb950]" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              <span>{isCurlCopied ? "Copied" : "Copy cURL"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Targets Inspection List & JSON Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual Targets */}
        <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_1px_0_rgba(27,31,36,0.1)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
            <span className="text-xs font-semibold text-[#e6edf3]">
              Active Scrape Targets ({discoveryTargets.length})
            </span>
            <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
          </div>

          <div className="p-4 bg-[#0d1117] flex-1">
            {discoveryTargets.length === 0 ? (
              <p className="text-xs text-[#848d97] py-8 text-center">
                No active targets advertised for Prometheus discovery.
              </p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {discoveryTargets.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-3 hover:border-[#8b949e] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#e6edf3]">
                        {item.targets.join(", ")}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        DISCOVERED
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                      {Object.entries(item.labels).map(([key, val]) => (
                        <span
                          key={key}
                          className="rounded-full bg-[#21262d] px-2 py-0.2 border border-[#30363d] text-[#848d97]"
                        >
                          <span className="text-[#58a6ff]">{key}</span>: <span className="text-[#e6edf3]">{val}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_1px_0_rgba(27,31,36,0.1)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#2f81f7]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#e6edf3]">
                Live JSON Payload
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#848d97] uppercase">
              GET /api/discovery
            </span>
          </div>

          <div className="p-3 bg-[#0d1117] flex-1 flex flex-col">
            <pre className="flex-1 max-h-[340px] overflow-auto rounded-[6px] border border-[#30363d] bg-[#010409] p-3 text-xs font-mono text-[#3fb950] leading-relaxed">
              {JSON.stringify(discoveryTargets, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
