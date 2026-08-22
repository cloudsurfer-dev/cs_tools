export const STATUS_OPTIONS = [
    "connected",
    "notconnect",
    "notconnected",
    "disabled",
    "err-disabled",
    "err-disable",
    "inactive",
    "monitoring",
    "sfpAbsent",
    "faulty",
    "down",
    "up",
] as const;

export type Status =
    | "connected"
    | "notconnect"
    | "disabled"
    | "err-disabled"
    | "unknown";

export interface Port {
    port: string;
    name: string;
    status: Status;
    vlan: string;
    duplex?: string;
    speed?: string;
    portType?: string;
}