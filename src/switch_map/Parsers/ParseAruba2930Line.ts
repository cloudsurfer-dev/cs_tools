import { type Port, type Status } from "../Types.ts";

const parseAruba2930Line = (line: string): Port | null => {
    // Match Up or Down as the anchor point
    const statusMatch = line.match(/\b(Up|Down|Disabled|Blocked)\b/i);
    if (!statusMatch) return null;

    const statusIndex = line.indexOf(statusMatch[0]);

    // Everything before Up/Down is the port + name
    const portAndName = line.slice(0, statusIndex).trim();
    if (!portAndName) return null;

    // Port ID is everything up to the first space or dash
    const portId = portAndName.split(/[\s-]/)[0];

    // Validate port format — must be digit/digit e.g. 1/1, 2/24 or modular A1, B2
    if (!/^(\d+\/\d+|[A-Z]\d+|\d+)$/.test(portId)) return null;

    // Name is whatever comes after the port ID
    const name = portAndName.slice(portId.length).replace(/^[-\s]+/, "").trim();

    // Status normalised to match Port type
    const rawStatus = statusMatch[0].toLowerCase();
    let status: Status = "unknown";
    if (rawStatus === "up") status = "connected";
    else if (rawStatus === "down") status = "notconnect";
    else if (rawStatus === "disabled" || rawStatus === "blocked") status = "disabled";

    // Last token after status is the VLAN or mode
    const afterStatus = line.slice(statusIndex + statusMatch[0].length).trim();
    const tokens = afterStatus.split(/\s+/).filter(Boolean);
    const lastToken = tokens[tokens.length - 1] ?? "1";
    const speed = tokens[0];

    // Trunk ports have Trk in the name, No means untagged default VLAN
    const vlan = name.includes("Trk") || portAndName.includes("Trk") || afterStatus.toLowerCase().includes("trk")
        ? "trunk"
        : lastToken === "No" || lastToken === "0"
            ? "1"
            : lastToken;

    return { port: portId, name, status, vlan, speed };
};

export const parseAruba2930 = (raw: string): Port[] =>
    raw
        .split("\n")
        .map(parseAruba2930Line)
        .filter((p): p is Port => p !== null);