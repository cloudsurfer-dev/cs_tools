import { type Port } from "../Types.ts";

const parseAruba2930Line = (line: string): Port | null => {
    // Match Up or Down as the anchor point
    const statusMatch = line.match(/\b(Up|Down)\b/i);
    if (!statusMatch) return null;

    const statusIndex = line.indexOf(statusMatch[0]);

    // Everything before Up/Down is the port + name
    const portAndName = line.slice(0, statusIndex).trim();
    if (!portAndName) return null;

    // Port ID is everything up to the first space or dash
    const portId = portAndName.split(/[\s-]/)[0];

    // Validate port format — must be digit/digit e.g. 1/1, 2/24
    if (!/^\d+\/\d+$/.test(portId)) return null;

    // Name is whatever comes after the port ID
    const name = portAndName.slice(portId.length).replace(/^[-\s]+/, "").trim();

    // Status normalised to match existing Port type
    const status = statusMatch[0].toLowerCase() === "up" ? "connected" : "notconnect";

    // Last token after status is the VLAN
    const afterStatus = line.slice(statusIndex + statusMatch[0].length).trim();
    const tokens      = afterStatus.split(/\s+/).filter(Boolean);
    const lastToken   = tokens[tokens.length - 1] ?? "0";

    // Trunk ports have Trk in the name, No means untagged default VLAN
    const vlan = name.includes("Trk") || portAndName.includes("Trk")
        ? "trunk"
        : lastToken === "No"
            ? "0"
            : lastToken;

    return { port: portId, name, status, vlan };
};

export const parseAruba2930 = (raw: string): Port[] =>
    raw
        .split("\n")
        .map(parseAruba2930Line)
        .filter((p): p is Port => p !== null);