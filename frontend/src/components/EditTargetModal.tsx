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
import { Edit2 } from "lucide-react";
import { updateTarget } from "../lib/api";
import type { Target } from "../lib/types";

interface EditTargetModalProps {
  target: Target;
  onSuccess: () => void;
}

export function EditTargetModal({ target, onSuccess }: EditTargetModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(target.name);
  const [ipAddress, setIpAddress] = useState(target.ip_address);
  const [port, setPort] = useState(target.port || 9100);
  const [environment, setEnvironment] = useState(target.environment || "production");
  const [osType, setOsType] = useState(target.os_type || "linux");
  const [sshUser, setSshUser] = useState(target.ssh_user || "youssef");
  const [isActive, setIsActive] = useState(target.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updateTarget(target.id, {
        name,
        ip_address: ipAddress,
        port: Number(port),
        environment,
        os_type: osType,
        ssh_user: sshUser,
        is_active: isActive,
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update target");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Edit Target Configuration"
          aria-label={`Edit target configuration for ${target.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#30363d] bg-[#21262d] text-[#848d97] hover:bg-[#30363d] hover:border-[#8b949e] hover:text-white transition-colors shadow-[0_1px_0_rgba(27,31,36,0.1)]"
        >
          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_8px_24px_rgba(1,4,9,0.7)] text-[#f0f6fc]">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-[#f0f6fc]">Edit Target: {target.name}</DialogTitle>
          <p className="text-sm text-[#7d8590] mt-0.5 leading-[21px]">
            Modify host address, scrape port, or toggle active discovery broadcast.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-[11px] font-semibold text-[#848d97]">Target Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-ip" className="text-[11px] font-semibold text-[#848d97]">IP Address</Label>
              <Input
                id="edit-ip"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-port" className="text-[11px] font-semibold text-[#848d97]">Metrics Port</Label>
              <Input
                id="edit-port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                min={1}
                max={65535}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-env" className="text-[11px] font-semibold text-[#848d97]">Environment</Label>
              <select
                id="edit-env"
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
              <Label htmlFor="edit-os" className="text-[11px] font-semibold text-[#848d97]">OS Type</Label>
              <select
                id="edit-os"
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
              <Label htmlFor="edit-user" className="text-[11px] font-semibold text-[#848d97]">SSH User</Label>
              <Input
                id="edit-user"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-end space-y-1.5">
              <Label htmlFor="edit-active" className="text-[11px] font-semibold text-[#848d97]">Scrape Status</Label>
              <div className="flex items-center gap-2 h-8">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#30363d] bg-[#0d1117] text-[#1f6feb] focus:ring-[#388bfd] cursor-pointer"
                />
                <label htmlFor="edit-active" className="text-xs text-[#c9d1d9] font-medium cursor-pointer select-none">
                  {isActive ? 'Active (SD Scraped)' : 'Inactive (Muted)'}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
