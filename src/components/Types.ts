export const STATUS_OPTIONS = ["connected", "notconnect", "disabled", "err-disabled"] as const;
export type Status = (typeof STATUS_OPTIONS)[number];

export interface Port {
    port: string;
    name: string;
    status: Status | "unknown";
    vlan: string;
}