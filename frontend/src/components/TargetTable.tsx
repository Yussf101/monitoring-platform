import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trash2, LineChart } from "lucide-react";
import type { Target } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface TargetTableProps {
  targets: Target[];
  onDelete: (id: number) => void;
}

export function TargetTable({ targets, onDelete }: TargetTableProps) {
  if (targets.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No targets found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-card border p-4">
      <AnimatePresence mode="popLayout">
        {targets.map((target, index) => (
          <motion.div
            key={target.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center justify-between border-b pb-4 pt-2 last:border-0 last:pb-0 transition-colors hover:bg-muted/20 px-4 -mx-4 rounded-none"
          >
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{target.name}</span>
              <span className="text-xs text-muted-foreground">
                IP: {target.ip_address}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={target.is_active ? "default" : "secondary"}>
                {target.is_active ? "ACTIVE" : "INACTIVE"}
              </Badge>
              <a
                href={`http://localhost:3000/d/node-exporter/node-exporter-full?var-instance=${target.ip_address}:${target.port || 9100}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View in Grafana"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LineChart className="h-4 w-4" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                title="Delete Target"
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onDelete(target.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
