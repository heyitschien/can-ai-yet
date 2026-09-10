import { STATUS_LABEL, type CapabilityStatus } from "@/lib/domain";

export function StatusMark({ status }: { status: CapabilityStatus }) {
  return (
    <span className={`status-${status} inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] font-medium`}>
      <span aria-hidden>{status === "green" ? "●" : status === "yellow" ? "▲" : status === "red" ? "■" : "○"}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}
