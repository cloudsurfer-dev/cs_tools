import { useState, useRef, useEffect } from "react";
import { type Port, type Status } from "./Types";
import { type DeviceMap, normalizePortKey } from "./BuildDeviceMap";
import { type VlanStyle, DEFAULT_VLAN_STYLE } from "./VlanColors";
import { type DisplayMode, formatIpLastTwoOctets } from "./DisplayModes";
import { Modal } from "../components/Modal";

interface SwitchVisualProps {
    ports: Port[];
    displayMode: DisplayMode;
    deviceMap: DeviceMap;
    vlanColorMap: Map<string, VlanStyle>;
    searchQuery?: string;
    selectedVlan?: string | null;
    switchTitle?: string;
    onToast?: (msg: string) => void;
}

const getPortNumber = (portStr: string): number => {
    const match = portStr.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
};

const getPortData = (ports: Port[], portNumber: number): Port | undefined =>
    ports.find((p) => getPortNumber(p.port) === portNumber);

const getStatusColor = (status?: Status): { led: string; text: string; label: string; badge: string; bg: string } => {
    switch (status) {
        case "connected":
            return {
                led: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]",
                text: "text-emerald-400",
                label: "up",
                badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
                bg: "bg-emerald-950/20",
            };
        case "err-disabled":
            return {
                led: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]",
                text: "text-rose-400",
                label: "err",
                badge: "bg-rose-950/80 text-rose-300 border-rose-500/50",
                bg: "bg-rose-950/20",
            };
        case "disabled":
            return {
                led: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
                text: "text-amber-400",
                label: "dis",
                badge: "bg-amber-950/80 text-amber-300 border-amber-500/50",
                bg: "bg-amber-950/20",
            };
        case "notconnect":
            return {
                led: "bg-zinc-600",
                text: "text-zinc-500",
                label: "down",
                badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
                bg: "bg-zinc-950/40",
            };
        default:
            return {
                led: "bg-zinc-700",
                text: "text-zinc-500",
                label: "-",
                badge: "bg-zinc-800 text-zinc-500 border-zinc-700",
                bg: "bg-zinc-950/40",
            };
    }
};

const getCellText = (port: Port | undefined, mode: DisplayMode, deviceMap: DeviceMap): string => {
    if (!port) return "-";
    const device = deviceMap.get(port.port) || deviceMap.get(normalizePortKey(port.port));
    switch (mode) {
        case "status":
            return getStatusColor(port.status).label;
        case "vlan":
            return port.vlan || "1";
        case "ip":
            return device?.ip ? formatIpLastTwoOctets(device.ip) : "-";
        case "hostname":
            return device?.hostname || port.name || "-";
        case "name":
            return port.name || "-";
        case "mac":
            return device?.mac ? (device.mac.length > 6 ? device.mac.slice(-4) : device.mac) : "-";
    }
};

interface HoverInfo {
    port: Port;
    portNumber: number;
    rect: DOMRect;
}

export const SwitchVisual = ({
    ports,
    displayMode,
    deviceMap,
    vlanColorMap,
    searchQuery = "",
    selectedVlan = null,
    switchTitle = "Switch Unit",
    onToast,
}: SwitchVisualProps) => {
    const [selectedPort, setSelectedPort] = useState<Port | null>(null);
    const [hoveredPortInfo, setHoveredPortInfo] = useState<HoverInfo | null>(null);
    const hoverTimerRef = useRef<number | null>(null);
    const needsTruncate = displayMode === "hostname" || displayMode === "name";

    // Clear hover timer on unmount
    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) {
                window.clearTimeout(hoverTimerRef.current);
            }
        };
    }, []);

    const maxPortNum = Math.max(0, ...ports.map((p) => getPortNumber(p.port)));
    // Determine switch layout size
    let standardPortCount = 24;
    if (maxPortNum > 24) standardPortCount = 48;
    else if (maxPortNum <= 8) standardPortCount = 8;
    else if (maxPortNum <= 12) standardPortCount = 12;
    else if (maxPortNum <= 16) standardPortCount = 16;

    const basePortNumbers = Array.from({ length: standardPortCount }, (_, i) => i + 1);
    const odd = basePortNumbers.filter((n) => n % 2 !== 0);
    const even = basePortNumbers.filter((n) => n % 2 === 0);
    const columnCount = odd.length;

    // Extra SFP+ uplink ports (e.g., 49, 50, 51, 52)
    const uplinkPorts = ports.filter((p) => getPortNumber(p.port) > standardPortCount);
    const uplinkOdd = uplinkPorts.filter((p) => getPortNumber(p.port) % 2 !== 0);
    const uplinkEven = uplinkPorts.filter((p) => getPortNumber(p.port) % 2 === 0);

    const connectedCount = ports.filter((p) => p.status === "connected").length;
    const totalPorts = ports.length || standardPortCount;
    const activePercent = Math.round((connectedCount / (totalPorts || 1)) * 100);

    const isPortMatching = (port: Port | undefined, num: number): boolean => {
        if (!selectedVlan && !searchQuery.trim()) return true;
        if (!port) return false;

        const device = deviceMap.get(port.port) || deviceMap.get(normalizePortKey(port.port));

        if (selectedVlan && port.vlan.toLowerCase() !== selectedVlan.toLowerCase()) {
            return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matches =
                port.port.toLowerCase().includes(q) ||
                String(num).includes(q) ||
                port.name.toLowerCase().includes(q) ||
                port.vlan.toLowerCase().includes(q) ||
                port.status.toLowerCase().includes(q) ||
                (device?.mac && device.mac.toLowerCase().includes(q)) ||
                (device?.ip && device.ip.toLowerCase().includes(q)) ||
                (device?.hostname && device.hostname.toLowerCase().includes(q));
            return !!matches;
        }

        return true;
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        if (onToast) {
            onToast(`Copied ${label} to clipboard!`);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, num: number, data?: Port) => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
        }
        if (data) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredPortInfo({ port: data, portNumber: num, rect });
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
        }
        hoverTimerRef.current = window.setTimeout(() => {
            setHoveredPortInfo(null);
        }, 80);
    };

    const renderPortCell = (num: number, portData?: Port, isUplink = false) => {
        const data = portData || getPortData(ports, num);
        const vlanStyle = (data?.vlan && vlanColorMap.get(data.vlan)) || DEFAULT_VLAN_STYLE;
        const cellText = getCellText(data, displayMode, deviceMap);
        const isMatched = isPortMatching(data, num);
        const isSelected = selectedPort?.port === data?.port && !!data;

        return (
            <button
                type="button"
                key={num}
                onClick={() => data && setSelectedPort(data)}
                onMouseEnter={(e) => handleMouseEnter(e, num, data)}
                onMouseLeave={handleMouseLeave}
                disabled={!data}
                className={`relative flex items-center justify-center min-w-0 w-full h-11 sm:h-12 md:h-13 p-0 rounded-md sm:rounded-lg transition-all text-center select-none shadow-sm overflow-hidden ${
                    data ? "cursor-pointer" : "cursor-default opacity-20 bg-zinc-800"
                } ${
                    data
                        ? `${vlanStyle.bg} ${vlanStyle.cellText}`
                        : "bg-zinc-800 text-zinc-500"
                } ${
                    isSelected
                        ? "ring-3 ring-white scale-105 z-20 shadow-xl"
                        : isMatched
                        ? "hover:scale-[1.06] hover:z-10 hover:shadow-lg"
                        : "opacity-20 grayscale brightness-75"
                } ${isUplink ? "border-2 border-dashed border-white/40" : ""}`}
                title={data ? `${data.port} | VLAN ${data.vlan} | Status: ${data.status}` : `Port ${num}`}
            >
                <span className={`w-full max-w-full block font-mono font-bold text-[9px] sm:text-xs tracking-tighter leading-none ${
                    needsTruncate ? "truncate" : ""
                }`}>
                    {cellText}
                </span>
            </button>
        );
    };

    const activeSelectedDevice = selectedPort
        ? deviceMap.get(selectedPort.port) || deviceMap.get(normalizePortKey(selectedPort.port))
        : undefined;

    // Hovered device info
    const hoveredPort = hoveredPortInfo?.port;
    const hoveredDevice = hoveredPort
        ? deviceMap.get(hoveredPort.port) || deviceMap.get(normalizePortKey(hoveredPort.port))
        : undefined;

    // Smart tooltip position calculation
    let tooltipStyle: React.CSSProperties = {};
    if (hoveredPortInfo) {
        const { rect } = hoveredPortInfo;
        const popoverWidth = 320;
        const popoverHeight = 240;
        // Center horizontally on port button, clamp within viewport
        let left = rect.left + rect.width / 2 - popoverWidth / 2;
        left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

        // Display above if there's room, otherwise below
        const spaceAbove = rect.top;
        if (spaceAbove > popoverHeight + 20) {
            tooltipStyle = {
                position: "fixed",
                left: `${left}px`,
                top: `${rect.top - 8}px`,
                transform: "translateY(-100%)",
                width: `${popoverWidth}px`,
            };
        } else {
            tooltipStyle = {
                position: "fixed",
                left: `${left}px`,
                top: `${rect.bottom + 8}px`,
                width: `${popoverWidth}px`,
            };
        }
    }

    return (
        <div className="space-y-3">
            {/* Enterprise Switch Chassis Unit */}
            <div className="bg-gradient-to-b from-zinc-900 via-zinc-925 to-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative">
                {/* Switch Chassis Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800/80 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700/60 font-mono text-zinc-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                            <span className="font-bold text-white text-sm tracking-wide">{switchTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <span>Link Activity:</span>
                            <span className="font-mono font-bold text-emerald-400">
                                {connectedCount} / {totalPorts} Ports Up
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-300 text-xs font-semibold">
                                {activePercent}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ports Section (Odd Numbers Row -> Odd Cells -> Even Cells -> Even Numbers Row) */}
                <div className="w-full overflow-x-auto pb-1">
                    <div className="flex items-stretch gap-3 min-w-full">
                        {/* Main Ports Grid */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            {/* 1. Top Odd Port Numbers */}
                            <div
                                className="grid gap-1 sm:gap-1.5 w-full"
                                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(54px, 1fr))` }}
                            >
                                {odd.map((num) => (
                                    <div
                                        key={num}
                                        className="text-center font-mono text-[11px] sm:text-xs text-zinc-400 font-bold select-none truncate"
                                    >
                                        {num}
                                    </div>
                                ))}
                            </div>

                            {/* 2. Top Odd Port Cells */}
                            <div
                                className="grid gap-1 sm:gap-1.5 w-full"
                                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(54px, 1fr))` }}
                            >
                                {odd.map((num) => renderPortCell(num))}
                            </div>

                            {/* 3. Bottom Even Port Cells */}
                            <div
                                className="grid gap-1 sm:gap-1.5 w-full"
                                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(54px, 1fr))` }}
                            >
                                {even.map((num) => renderPortCell(num))}
                            </div>

                            {/* 4. Bottom Even Port Numbers */}
                            <div
                                className="grid gap-1 sm:gap-1.5 w-full"
                                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(54px, 1fr))` }}
                            >
                                {even.map((num) => (
                                    <div
                                        key={num}
                                        className="text-center font-mono text-[11px] sm:text-xs text-zinc-400 font-bold select-none truncate"
                                    >
                                        {num}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SFP+ / Uplink Ports Section (if present) */}
                        {uplinkPorts.length > 0 && (
                            <div className="flex flex-col gap-1.5 pl-3 border-l border-zinc-800 min-w-[90px] sm:min-w-[115px] flex-shrink-0">
                                {/* Uplink Odd Numbers */}
                                <div className="flex gap-1 justify-center">
                                    {(uplinkOdd.length > 0 ? uplinkOdd : uplinkPorts.slice(0, Math.ceil(uplinkPorts.length / 2))).map((p) => {
                                        const num = getPortNumber(p.port);
                                        return (
                                            <div key={num} className="flex-1 text-center font-mono text-[11px] sm:text-xs text-purple-400 font-bold select-none truncate">
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Uplink Odd Cells */}
                                <div className="flex gap-1 justify-center">
                                    {(uplinkOdd.length > 0 ? uplinkOdd : uplinkPorts.slice(0, Math.ceil(uplinkPorts.length / 2))).map((p) => {
                                        const num = getPortNumber(p.port);
                                        return renderPortCell(num, p, true);
                                    })}
                                </div>

                                {/* Uplink Even Cells */}
                                <div className="flex gap-1 justify-center">
                                    {(uplinkEven.length > 0 ? uplinkEven : uplinkPorts.slice(Math.ceil(uplinkPorts.length / 2))).map((p) => {
                                        const num = getPortNumber(p.port);
                                        return renderPortCell(num, p, true);
                                    })}
                                </div>

                                {/* Uplink Even Numbers */}
                                <div className="flex gap-1 justify-center">
                                    {(uplinkEven.length > 0 ? uplinkEven : uplinkPorts.slice(Math.ceil(uplinkPorts.length / 2))).map((p) => {
                                        const num = getPortNumber(p.port);
                                        return (
                                            <div key={num} className="flex-1 text-center font-mono text-[11px] sm:text-xs text-purple-400 font-bold select-none truncate">
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Floating Pop-up Tooltip Card */}
            {hoveredPort && hoveredPortInfo && (
                <div
                    style={tooltipStyle}
                    className="z-50 pointer-events-none bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-3.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
                >
                    {/* Header: Port identifier & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5 mb-2.5">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(hoveredPort.status).led}`} />
                                <span className="font-mono font-bold text-sm text-white">{hoveredPort.port}</span>
                            </div>
                            {hoveredPort.name ? (
                                <div className="text-[11px] text-zinc-400 truncate max-w-[210px] font-sans mt-0.5">
                                    {hoveredPort.name}
                                </div>
                            ) : (
                                <div className="text-[10px] text-zinc-500 italic mt-0.5">No port description</div>
                            )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusColor(hoveredPort.status).badge}`}>
                            {hoveredPort.status.toUpperCase()}
                        </span>
                    </div>

                    {/* Port Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-zinc-800 text-[11px]">
                        <div>
                            <span className="text-zinc-500 block text-[10px]">VLAN</span>
                            <span className="font-mono font-semibold text-white">
                                {hoveredPort.vlan.toLowerCase() === "trunk" ? "Trunk" : `VLAN ${hoveredPort.vlan}`}
                            </span>
                        </div>
                        <div>
                            <span className="text-zinc-500 block text-[10px]">Speed / Duplex</span>
                            <span className="font-mono font-semibold text-zinc-300">
                                {[hoveredPort.speed, hoveredPort.duplex].filter(Boolean).join(" ") || "Auto"}
                            </span>
                        </div>
                    </div>

                    {/* Device Mapping Section */}
                    <div className="pt-2 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                            Connected Device
                        </div>
                        {hoveredDevice ? (
                            <div className="space-y-1 font-mono text-[11px]">
                                {hoveredDevice.hostname && (
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-zinc-500 text-[10px]">Host:</span>
                                        <span className="font-bold text-sky-300 truncate max-w-[190px]" title={hoveredDevice.hostname}>
                                            {hoveredDevice.hostname}
                                        </span>
                                    </div>
                                )}
                                {hoveredDevice.ip && (
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-zinc-500 text-[10px]">IP:</span>
                                        <span className="font-semibold text-blue-300">
                                            {hoveredDevice.ip}{" "}
                                            <span className="text-zinc-400 font-normal">
                                                ({formatIpLastTwoOctets(hoveredDevice.ip)})
                                            </span>
                                        </span>
                                    </div>
                                )}
                                {hoveredDevice.mac && (
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-zinc-500 text-[10px]">MAC:</span>
                                        <span className="font-semibold text-emerald-400">
                                            {hoveredDevice.mac}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-[11px] text-zinc-500 italic">
                                No device mapped from MAC / Infoblox table
                            </div>
                        )}
                    </div>

                    {/* Footer click hint */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>Click port to inspect & CLI config</span>
                        <span className="font-mono text-zinc-400">Port {hoveredPortInfo.portNumber}</span>
                    </div>
                </div>
            )}

            {/* Selected Port Inspection Modal */}
            {selectedPort && (
                <Modal
                    title={`Port Details — ${selectedPort.port}`}
                    onClose={() => setSelectedPort(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setSelectedPort(null)}
                                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
                            >
                                Close
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        {/* Port Status Header */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${getStatusColor(selectedPort.status).led}`} />
                                <div>
                                    <div className="font-mono font-bold text-white text-base">
                                        {selectedPort.port}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {selectedPort.name || "No description configured"}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getStatusColor(selectedPort.status).badge}`}>
                                {selectedPort.status.toUpperCase()}
                            </span>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                                <span className="text-zinc-500 block font-medium">VLAN Assignment</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-white text-sm">
                                        {selectedPort.vlan}
                                    </span>
                                    {selectedPort.vlan.toLowerCase() === "trunk" ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/40">
                                            TRUNK
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                                <span className="text-zinc-500 block font-medium">Speed / Duplex</span>
                                <span className="font-mono font-semibold text-white text-sm">
                                    {selectedPort.speed || selectedPort.duplex ? `${selectedPort.speed || ""} ${selectedPort.duplex || ""}`.trim() : "Auto"}
                                </span>
                            </div>
                        </div>

                        {/* Enriched Device Information */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                                    Connected Device Information
                                </h4>
                                <span className="text-[11px] text-zinc-500 font-mono">
                                    {activeSelectedDevice ? "Mapped" : "No device mapped"}
                                </span>
                            </div>

                            {activeSelectedDevice ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-zinc-400 block">MAC Address:</span>
                                            <span className="font-mono text-sm font-semibold text-emerald-400">
                                                {activeSelectedDevice.mac}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(activeSelectedDevice.mac, "MAC Address")}
                                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700"
                                        >
                                            Copy MAC
                                        </button>
                                    </div>

                                    {activeSelectedDevice.ip && (
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                                            <div>
                                                <span className="text-[11px] text-zinc-400 block">IP Address:</span>
                                                <span className="font-mono text-sm font-semibold text-blue-400">
                                                    {activeSelectedDevice.ip}{" "}
                                                    <span className="text-xs text-zinc-500">
                                                        (Suffix: {formatIpLastTwoOctets(activeSelectedDevice.ip)})
                                                    </span>
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(activeSelectedDevice.ip!, "IP Address")}
                                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700"
                                            >
                                                Copy IP
                                            </button>
                                        </div>
                                    )}

                                    {activeSelectedDevice.hostname && (
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                                            <div>
                                                <span className="text-[11px] text-zinc-400 block">Hostname:</span>
                                                <span className="font-sans text-sm font-semibold text-sky-300">
                                                    {activeSelectedDevice.hostname}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(activeSelectedDevice.hostname!, "Hostname")}
                                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700"
                                            >
                                                Copy Hostname
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-zinc-500 text-xs">
                                    No active MAC or Infoblox record found for port {selectedPort.port}.
                                </div>
                            )}
                        </div>

                        {/* Cisco IOS CLI Command Snippet Generator */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-300">Cisco IOS Config Snippet</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(
                                            `interface ${selectedPort.port}\n description ${
                                                selectedPort.name || activeSelectedDevice?.hostname || "Connected Device"
                                            }\n switchport mode access\n switchport access vlan ${
                                                selectedPort.vlan === "trunk" ? "10" : selectedPort.vlan || "1"
                                            }\n no shutdown`,
                                            "Cisco Config"
                                        )
                                    }
                                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700"
                                >
                                    Copy Config
                                </button>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 overflow-x-auto leading-relaxed">
{`interface ${selectedPort.port}
 description ${selectedPort.name || activeSelectedDevice?.hostname || "Connected Device"}
 switchport mode access
 switchport access vlan ${selectedPort.vlan === "trunk" ? "10" : selectedPort.vlan || "1"}
 no shutdown`}
                            </pre>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
