import { useEffect, useState } from "react";
import { getTargets, deleteTarget } from "../lib/api";
import type { Target } from "../lib/types";
import { TargetTable } from "../components/TargetTable";
import { AddTargetModal } from "../components/AddTargetModal";

export function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTargets = async () => {
    setIsLoading(true);
    try {
      const data = await getTargets();
      setTargets(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch targets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this target?")) return;
    try {
      await deleteTarget(id);
      await fetchTargets();
    } catch (err: any) {
      alert(err.message || "Failed to delete target");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Targets</h2>
          <p className="text-muted-foreground">
            Manage the servers and endpoints you are monitoring.
          </p>
        </div>
        <AddTargetModal onSuccess={fetchTargets} />
      </div>
      
      {error && (
        <div className="rounded-md bg-destructive/15 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading targets...</p>
        </div>
      ) : (
        <TargetTable targets={targets} onDelete={handleDelete} />
      )}
    </div>
  );
}
