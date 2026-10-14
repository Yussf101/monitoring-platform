import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Server } from "lucide-react";
import { createTarget } from "../lib/api";
import { cn } from "../lib/utils";

interface AddTargetModalProps {
  onSuccess: () => void;
  triggerClassName?: string;
}

export function AddTargetModal({ onSuccess, triggerClassName }: AddTargetModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState<number>(9100);
  const [environment, setEnvironment] = useState("production");
  const [osType, setOsType] = useState("linux");
  const [sshUser, setSshUser] = useState("youssef");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await createTarget({
        name: name.trim(),
        ip_address: ipAddress.trim(),
        port: Number(port),
        environment,
        os_type: osType,
        ssh_user: sshUser.trim(),
        is_active: isActive,
      });
      setOpen(false);
      setName("");
      setIpAddress("");
      setPort(9100);
      setEnvironment("production");
      setOsType("linux");
      setSshUser("youssef");
      setIsActive(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create target");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="default" 
          className={cn(
            "text-white font-medium text-sm leading-5 gap-1.5 shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset] rounded-[6px] border border-[rgba(240,246,252,0.1)] px-3 py-[5px] h-8",
            triggerClassName || "bg-[#1f6feb] hover:bg-[#388bfd]"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Target</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_8px_24px_rgba(1,4,9,0.7)] text-[#f0f6fc]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#21262d] border border-[#30363d] text-[#7d8590]">
              <Server className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-[#f0f6fc]">Add Monitored Node</DialogTitle>
              <p className="text-sm text-[#7d8590] mt-0.5 leading-[21px]">
                Configure host address and Node Exporter port to expose to the Prometheus scraper.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-name" className="text-[11px] font-semibold text-[#848d97]">Node Identifier / Name</Label>
              <Input
                id="target-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. web-app-prod-01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-ip" className="text-[11px] font-semibold text-[#848d97]">IP Address</Label>
              <Input
                id="target-ip"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.50"
                pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                title="Please enter a valid IPv4 address (e.g., 192.168.1.50)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-port" className="text-[11px] font-semibold text-[#848d97]">Metrics Port</Label>
              <Input
                id="target-port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                min={1}
                max={65535}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-env" className="text-[11px] font-semibold text-[#848d97]">Environment</Label>
              <select
                id="target-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="flex h-8 w-full rounded-[6px] border border-[#30363d] bg-[#0d1117] px-2.5 py-1 text-xs text-[#e6edf3] focus:ring-2 focus:ring-[#2f81f7]/30 focus:border-[#2f81f7] focus:outline-none transition-colors"
              >
                <option value="production" className="bg-[#161b22]">production</option>
                <option value="staging" className="bg-[#161b22]">staging</option>
                <option value="development" className="bg-[#161b22]">development</option>
                <option value="testing" className="bg-[#161b22]">testing</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-os" className="text-[11px] font-semibold text-[#848d97]">OS Platform</Label>
              <select
                id="target-os"
                value={osType}
                onChange={(e) => setOsType(e.target.value)}
                className="flex h-8 w-full rounded-[6px] border border-[#30363d] bg-[#0d1117] px-2.5 py-1 text-xs text-[#e6edf3] focus:ring-2 focus:ring-[#2f81f7]/30 focus:border-[#2f81f7] focus:outline-none transition-colors"
              >
                <option value="linux" className="bg-[#161b22]">Linux</option>
                <option value="windows" className="bg-[#161b22]">Windows</option>
                <option value="darwin" className="bg-[#161b22]">macOS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-ssh" className="text-[11px] font-semibold text-[#848d97]">Ansible / SSH User</Label>
              <Input
                id="target-ssh"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
                placeholder="youssef"
              />
            </div>
            <div className="flex flex-col justify-end space-y-1.5">
              <Label htmlFor="target-active" className="text-[11px] font-semibold text-[#848d97]">Auto Enable Scrape</Label>
              <div className="flex items-center gap-2 h-8">
                <input
                  type="checkbox"
                  id="target-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#30363d] bg-[#0d1117] text-[#1f6feb] focus:ring-[#388bfd] cursor-pointer"
                />
                <label htmlFor="target-active" className="text-xs text-[#c9d1d9] cursor-pointer select-none">
                  Activate for SD
                </label>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-[#f85149] font-medium">{error}</p>}

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#30363d]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting}
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white"
            >
              {isSubmitting ? "Registering..." : "Add Target"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
