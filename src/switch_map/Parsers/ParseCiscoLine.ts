import { STATUS_OPTIONS, type Port } from "../Types.ts";

export const parseCiscoLine = (line: string): Port | null => {
    const portMatch = line.match(/^(Gi|Fa|Te|Eth|Po)\d+(?:\/\d+)+/i);
    if (!portMatch) return null;
    const portStr = portMatch[0];

    const rest = line.slice(line.indexOf(portStr) + portStr.length).trim();

    const statusIndex = STATUS_OPTIONS.map((s) => rest.indexOf(s)).find((i) => i !== -1);
    if (statusIndex === undefined) return null;

    const name   = rest.slice(0, statusIndex).trim();
    const after  = rest.slice(statusIndex).trim().split(/\s+/);
    const status = after[0] as Port["status"];
    const vlan   = after[1] ?? "unknown";

    return { port: portStr, name, status, vlan };
};

export const parseCisco = (raw: string): Port[] =>
    raw
        .split("\n")
        .map(parseCiscoLine)
        .filter((p): p is Port => p !== null);
