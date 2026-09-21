import { useEffect, useState, useCallback } from "react";
import { getAlerts } from "../lib/api";
import type { Alert } from "../lib/types";
import { AlertTable } from "../components/AlertTable";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const PAGE_SIZE = 20;

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchAlerts = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (!append) setIsLoading(true);
      try {
        const data = await getAlerts(PAGE_SIZE, currentOffset);
        if (append) {
          setAlerts((prev) => [...prev, ...data]);
        } else {
          setAlerts(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setError("");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch alerts";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Reset pagination and refetch when filters change
  useEffect(() => {
    setOffset(0);
    fetchAlerts(0, false);
  }, [statusFilter, severityFilter, fetchAlerts]);

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchAlerts(newOffset, true);
  };

  // Client-side filtering — the backend doesn't expose filter query params,
  // so we filter the already-fetched data before rendering.
  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold tracking-tight">Alert History</h2>
        <p className="text-muted-foreground">
          View and filter all alerts received.
        </p>
      </motion.div>

      {/* Filter controls */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Status
          </span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="firing">Firing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Severity
          </span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger id="severity-filter" className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div variants={itemVariants} className="rounded-md bg-destructive/15 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Table */}
      {isLoading ? (
        <motion.div variants={itemVariants} className="flex h-24 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-4">
          <AlertTable alerts={filteredAlerts} />

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
