import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
} from "lucide-react";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "disproven";
  size?: "sm" | "md";
}

export function VerificationBadge({ status, size = "md" }: VerificationBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "verified":
        return {
          icon: <CheckCircle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
          text: "Verified",
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        };
      case "pending":
        return {
          icon: <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
          text: "Pending Verification",
          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        };
      case "disproven":
        return {
          icon: <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />,
          text: "Disproven",
          className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className} ${size === "sm" ? "text-xs" : ""}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
}
