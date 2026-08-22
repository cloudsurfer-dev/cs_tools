import { useState, useMemo } from "react";
import { Toast } from "../components/Toast";

type MacFormat = "colon" | "cisco" | "hyphen" | "plain" | "dot";
type MacCase = "upper" | "lower";
type OutputSeparator = "newline" | "comma" | "space" | "quotes_comma";

const SAMPLE_MIXED = `00:1A:2B:3C:4D:5E
00-50-56-A1-B2-C3
aabb.ccdd.eeff
001122334455
00 11 22 aa bb cc
00.12.34.56.78.9a`;

const SAMPLE_CISCO_TABLE = `Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 10     001a.2b3c.4d5e    DYNAMIC     Gi1/0/1
 10     0050.56a1.b2c3    DYNAMIC     Gi1/0/2
 20     aabb.cc00.1122    DYNAMIC     Gi1/0/3
 20     0011.2233.4455    DYNAMIC     Gi1/0/4
Total Mac Addresses for this criterion: 4`;

const SAMPLE_RAW_HEX = `001A2B3C4D5E
005056A1B2C3
AABBCCDDEEFF
112233445566`;

const parseMacAddresses = (text: string): { macs: string[]; totalLines: number; skippedLines: number } => {
    if (!text.trim()) {
        return { macs: [], totalLines: 0, skippedLines: 0 };
    }

    const lines = text.split(/\r?\n/);
    const macs: string[] = [];
    let linesWithMac = 0;
    let emptyLines = 0;

    // Pattern matches all common MAC variations
    const regex = /\b(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}\b|\b[0-9a-fA-F]{4}[.-][0-9a-fA-F]{4}[.-][0-9a-fA-F]{4}\b|\b(?:[0-9a-fA-F]{2}\.){5}[0-9a-fA-F]{2}\b|\b(?:[0-9a-fA-F]{2}\s+){5}[0-9a-fA-F]{2}\b|\b[0-9a-fA-F]{4}\s+[0-9a-fA-F]{4}\s+[0-9a-fA-F]{4}\b|\b[0-9a-fA-F]{12}\b/gi;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            emptyLines++;
            continue;
        }

        const matches = trimmed.match(regex);
        if (matches && matches.length > 0) {
            linesWithMac++;
            for (const match of matches) {
                const hex12 = match.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
                if (hex12.length === 12) {
                    macs.push(hex12);
                }
            }
        } else {
            // Fallback for line with non-standard whitespace or symbols
            const clean = trimmed.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
            if (clean.length === 12) {
                macs.push(clean);
                linesWithMac++;
            }
        }
    }

    const nonBlankLines = lines.length - emptyLines;
    const skippedLines = Math.max(0, nonBlankLines - linesWithMac);

    return { macs, totalLines: lines.length, skippedLines };
};

const formatSingleMac = (hex12: string, format: MacFormat, letterCase: MacCase): string => {
    const raw = letterCase === "upper" ? hex12.toUpperCase() : hex12.toLowerCase();
    switch (format) {
        case "colon":
            return raw.replace(/(.{2})(?=.)/g, "$1:");
        case "cisco":
            return raw.replace(/(.{4})(?=.)/g, "$1.");
        case "hyphen":
            return raw.replace(/(.{2})(?=.)/g, "$1-");
        case "dot":
            return raw.replace(/(.{2})(?=.)/g, "$1.");
        case "plain":
            return raw;
    }
};

export const MacFixer = () => {
    const [input, setInput] = useState<string>("");
    const [format, setFormat] = useState<MacFormat>("colon");
    const [letterCase, setLetterCase] = useState<MacCase>("upper");
    const [separator, setSeparator] = useState<OutputSeparator>("newline");
    const [deduplicate, setDeduplicate] = useState<boolean>(false);
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
    };

    const { macs, totalLines, skippedLines } = useMemo(() => {
        return parseMacAddresses(input);
    }, [input]);

    const formattedList = useMemo(() => {
        let list = [...macs];
        if (deduplicate) {
            list = Array.from(new Set(list));
        }
        if (sortAsc) {
            list.sort((a, b) => a.localeCompare(b));
        }
        return list.map((hex) => formatSingleMac(hex, format, letterCase));
    }, [macs, format, letterCase, deduplicate, sortAsc]);

    const formattedOutput = useMemo(() => {
        if (formattedList.length === 0) return "";
        switch (separator) {
            case "newline":
                return formattedList.join("\n");
            case "comma":
                return formattedList.join(", ");
            case "space":
                return formattedList.join(" ");
            case "quotes_comma":
                return formattedList.map((item) => `"${item}"`).join(", ");
        }
    }, [formattedList, separator]);

    const handleCopy = async () => {
        if (!formattedOutput) return;
        try {
            await navigator.clipboard.writeText(formattedOutput);
            showToast(`Copied ${formattedList.length} MAC address${formattedList.length === 1 ? "" : "es"}!`);
        } catch {
            showToast("Failed to copy to clipboard.");
        }
    };

    const handlePasteClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setInput((prev) => (prev ? `${prev}\n${text}` : text));
                showToast("Pasted from clipboard!");
            }
        } catch {
            showToast("Unable to read clipboard. Please paste directly into the box.");
        }
    };

    const handleDownload = () => {
        if (!formattedOutput) return;
        const blob = new Blob([formattedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mac-addresses-${format}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Downloaded as text file!");
    };

    const setFormatPreset = (newFormat: MacFormat) => {
        setFormat(newFormat);
        if (newFormat === "cisco") {
            setLetterCase("lower");
        } else if (newFormat === "colon" || newFormat === "hyphen" || newFormat === "plain") {
            setLetterCase("upper");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {toastMessage && (
                <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        MAC Fixer & Formatter
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        Instantly extract and standardize MAC addresses from raw hex, CLI tables, and any notation.
                    </p>
                </div>

                {/* Quick Presets / Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-zinc-700"
                    >
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Paste
                    </button>
                    <button
                        type="button"
                        onClick={() => setInput("")}
                        disabled={!input}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-medium transition-colors border border-zinc-700"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Main Converter Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Input Box */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label htmlFor="mac-input" className="text-sm font-semibold text-white">
                                    Input MAC Addresses
                                </label>
                                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                                    Any format
                                </span>
                            </div>
                            <div className="text-xs text-zinc-400">
                                {input.trim() ? (
                                    <span>
                                        <strong className="text-emerald-400">{macs.length}</strong> MAC{macs.length === 1 ? "" : "s"} detected
                                        <span className="text-zinc-500"> ({totalLines} line{totalLines === 1 ? "" : "s"}{skippedLines > 0 ? `, ${skippedLines} skipped` : ""})</span>
                                    </span>
                                ) : (
                                    <span>0 items</span>
                                )}
                            </div>
                        </div>

                        <textarea
                            id="mac-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={14}
                            placeholder="Paste MAC addresses here in any wild format...&#10;&#10;Examples:&#10;• 00:1A:2B:3C:4D:5E&#10;• 00-1a-2b-3c-4d-5e&#10;• 001a.2b3c.4d5e&#10;• 001A2B3C4D5E&#10;• 00 11 22 33 44 55&#10;• Cisco switch 'show mac address-table' output"
                            className="w-full p-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-xs sm:text-sm leading-relaxed resize-y"
                        />
                    </div>

                    {/* Presets footer */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-xs">
                        <span className="text-zinc-500 mr-1 font-medium">Load Samples:</span>
                        <button
                            type="button"
                            onClick={() => setInput(SAMPLE_MIXED)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
                        >
                            Mixed Wild Formats
                        </button>
                        <button
                            type="button"
                            onClick={() => setInput(SAMPLE_CISCO_TABLE)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
                        >
                            Cisco Switch Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setInput(SAMPLE_RAW_HEX)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
                        >
                            Raw Hex (12-char)
                        </button>
                    </div>
                </div>

                {/* Right Panel: Formatted Output */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="mac-output" className="text-sm font-semibold text-white">
                                Formatted Output
                            </label>
                            <span className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                                {formattedList.length} MAC{formattedList.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Format Selection Buttons */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-400">Notation Format</span>
                                <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setLetterCase("upper")}
                                        className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-all ${
                                            letterCase === "upper"
                                                ? "bg-emerald-600 text-white"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        UPPER
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLetterCase("lower")}
                                        className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-all ${
                                            letterCase === "lower"
                                                ? "bg-emerald-600 text-white"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        lower
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setFormatPreset("colon")}
                                    className={`px-3 py-2 rounded-lg text-xs font-mono flex flex-col items-start border transition-all ${
                                        format === "colon"
                                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold"
                                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                >
                                    <span className="text-[11px] text-zinc-400 font-sans">Standard</span>
                                    <span>XX:XX:XX:XX:XX:XX</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormatPreset("cisco")}
                                    className={`px-3 py-2 rounded-lg text-xs font-mono flex flex-col items-start border transition-all ${
                                        format === "cisco"
                                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold"
                                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                >
                                    <span className="text-[11px] text-zinc-400 font-sans">Cisco Switch</span>
                                    <span>xxxx.xxxx.xxxx</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormatPreset("hyphen")}
                                    className={`px-3 py-2 rounded-lg text-xs font-mono flex flex-col items-start border transition-all ${
                                        format === "hyphen"
                                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold"
                                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                >
                                    <span className="text-[11px] text-zinc-400 font-sans">Hyphen / Windows</span>
                                    <span>XX-XX-XX-XX-XX-XX</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormatPreset("plain")}
                                    className={`px-3 py-2 rounded-lg text-xs font-mono flex flex-col items-start border transition-all ${
                                        format === "plain"
                                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold"
                                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                >
                                    <span className="text-[11px] text-zinc-400 font-sans">Plain Hex</span>
                                    <span>XXXXXXXXXXXX</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormatPreset("dot")}
                                    className={`px-3 py-2 rounded-lg text-xs font-mono flex flex-col items-start border transition-all col-span-2 sm:col-span-1 ${
                                        format === "dot"
                                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold"
                                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                >
                                    <span className="text-[11px] text-zinc-400 font-sans">Dot Pairs</span>
                                    <span>XX.XX.XX.XX.XX.XX</span>
                                </button>
                            </div>
                        </div>

                        {/* List Options */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs text-zinc-400">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={deduplicate}
                                        onChange={(e) => setDeduplicate(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Remove Duplicates</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={sortAsc}
                                        onChange={(e) => setSortAsc(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Sort A-Z</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <label htmlFor="separator-select" className="text-zinc-400">
                                    Delimiter:
                                </label>
                                <select
                                    id="separator-select"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value as OutputSeparator)}
                                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="newline">Newline (1 per line)</option>
                                    <option value="comma">Comma (, )</option>
                                    <option value="space">Space ( )</option>
                                    <option value="quotes_comma">Quoted (&quot;...&quot;, &quot;...&quot;)</option>
                                </select>
                            </div>
                        </div>

                        {/* Text Output Box */}
                        <textarea
                            id="mac-output"
                            value={formattedOutput}
                            readOnly
                            rows={10}
                            placeholder="Formatted output will appear here automatically..."
                            className="w-full p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 placeholder-zinc-600 font-mono text-xs sm:text-sm leading-relaxed resize-y focus:outline-none"
                        />
                    </div>

                    {/* Actions Bar */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!formattedOutput}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/40"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Formatted MACs
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={!formattedOutput}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-medium text-xs sm:text-sm transition-colors border border-zinc-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download TXT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

