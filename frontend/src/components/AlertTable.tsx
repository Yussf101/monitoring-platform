import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import type { Alert } from "../lib/types";

interface AlertTableProps {
  alerts: Alert[];
}

/**
 * Formats a UTC ISO string into a locale-friendly date/time.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Maps severity values to visual badge variants.
 */
function severityVariant(severity: string): "destructive" | "default" | "secondary" | "outline" {
  switch (severity.toLowerCase()) {
    case "critical":
      return "destructive";
    case "warning":
      return "default";
    default:
      return "secondary";
  }
}

export function AlertTable({ alerts }: AlertTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Alert Name</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Fired At</TableHead>
            <TableHead>Resolved At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                {alert.status === "firing" ? (
                  <Badge variant="destructive" className="gap-1.5">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Firing
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-green-500/50 text-green-600"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Resolved
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium">{alert.alert_name}</TableCell>
              <TableCell>
                <Badge variant={severityVariant(alert.severity)}>
                  {alert.severity}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate text-muted-foreground">
                {alert.message || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(alert.fired_at)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {alert.resolved_at ? formatDate(alert.resolved_at) : "—"}
              </TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No alerts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
