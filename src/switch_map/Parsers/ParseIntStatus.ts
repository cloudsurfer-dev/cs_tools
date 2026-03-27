import { type Port } from "../Types.ts";
import { parseCisco } from "./ParseCiscoLine.ts";
import { parseAruba2930 } from "./ParseAruba2930Line.ts";

export type Vendor = "cisco" | "aruba2930" | "unknown";

const detectVendor = (raw: string): Vendor => {
    const sample = raw.split("\n").find((l) => l.trim().length > 0) ?? "";
    console.log("sample:", JSON.stringify(sample));
    console.log("trimmed:", JSON.stringify(sample.trim()));
    console.log("cisco test:", /^(Gi|Fa|Te|Eth|Po)\d+(?:\/\d+)+/i.test(sample.trim()));
    console.log("aruba test:", /^\s*\d+\/\d+/.test(sample));

    // Cisco — port starts with Gi/Fa/Te/Eth/Po followed by digits and slashes
    if (/^(Gi|Fa|Te|Eth|Po)\d+(?:\/\d+)+/i.test(sample.trim())) return "cisco";

    // Aruba 2930F — port starts with digit/digit e.g. 1/1, 2/24
    if (/^\s*\d+\/\d+/.test(sample)) return "aruba2930";

    return "unknown";
};

export const parseIntStatus = (raw: string): { ports: Port[]; vendor: Vendor } => {
    const vendor = detectVendor(raw);
    switch (vendor) {
        case "cisco":     return { ports: parseCisco(raw),      vendor };
        case "aruba2930": return { ports: parseAruba2930(raw),  vendor };
        default:          return { ports: [],                    vendor };
    }
};
