import { type Port } from "../Types.ts";
import { parseCisco } from "./ParseCiscoLine.ts";
import { parseAruba2930 } from "./ParseAruba2930Line.ts";

export type Vendor = "cisco" | "aruba2930" | "unknown";

export const parseIntStatus = (raw: string): { ports: Port[]; vendor: Vendor } => {
    if (!raw.trim()) {
        return { ports: [], vendor: "unknown" };
    }

    const ciscoPorts = parseCisco(raw);
    const arubaPorts = parseAruba2930(raw);

    if (ciscoPorts.length >= arubaPorts.length && ciscoPorts.length > 0) {
        return { ports: ciscoPorts, vendor: "cisco" };
    }

    if (arubaPorts.length > 0) {
        return { ports: arubaPorts, vendor: "aruba2930" };
    }

    return { ports: [], vendor: "unknown" };
};
