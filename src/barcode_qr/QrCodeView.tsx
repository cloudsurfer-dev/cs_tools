import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
    type QrErrorCorrectionLevel,
    type QrSettings,
    type QrTemplateType,
    type WifiConfig,
} from "./types";
import { copyCanvasToClipboardAsPng, downloadBlob, downloadCanvasAsPng } from "./utils";

interface QrCodeViewProps {
    onToast: (msg: string) => void;
}

export const QrCodeView = ({ onToast }: QrCodeViewProps) => {
    const [templateType, setTemplateType] = useState<QrTemplateType>("text");
    const [rawText, setRawText] = useState<string>("https://github.com");

    const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
        ssid: "",
        password: "",
        encryption: "WPA",
        hidden: false,
    });

    const [settings, setSettings] = useState<QrSettings>({
        errorCorrectionLevel: "M",
        width: 320,
        margin: 2,
        darkColor: "#000000",
        lightColor: "#ffffff",
    });

    const [renderError, setRenderError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Compute active payload text
    const getPayload = (): string => {
        switch (templateType) {
            case "text":
            case "url":
                return rawText;
            case "wifi": {
                if (!wifiConfig.ssid) return "";
                const enc = wifiConfig.encryption === "nopass" ? "nopass" : wifiConfig.encryption;
                const pwd = enc === "nopass" ? "" : wifiConfig.password;
                const hidden = wifiConfig.hidden ? "true" : "false";
                return `WIFI:T:${enc};S:${wifiConfig.ssid};P:${pwd};H:${hidden};;`;
            }
        }
    };

    const payload = getPayload();
    const inputError = !payload.trim() ? "Please fill in the required fields to generate a QR code." : null;
    const error = inputError || renderError;

    useEffect(() => {
        if (!payload.trim()) {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            return;
        }

        if (canvasRef.current) {
            QRCode.toCanvas(
                canvasRef.current,
                payload,
                {
                    errorCorrectionLevel: settings.errorCorrectionLevel,
                    width: settings.width,
                    margin: settings.margin,
                    color: {
                        dark: settings.darkColor,
                        light: settings.lightColor,
                    },
                },
                (err) => {
                    if (err) {
                        setRenderError(err.message || "Failed to generate QR code");
                    } else {
                        setRenderError(null);
                    }
                }
            );
        }
    }, [payload, settings]);

    const handleCopy = async () => {
        if (!canvasRef.current || error || !payload.trim()) return;
        const ok = await copyCanvasToClipboardAsPng(canvasRef.current);
        if (ok) {
            onToast("QR code copied to clipboard as PNG!");
        } else {
            onToast("Could not copy directly to clipboard. Try downloading PNG.");
        }
    };

    const handleDownloadPng = () => {
        if (!canvasRef.current || error || !payload.trim()) return;
        const safeName = templateType + "-" + Date.now();
        downloadCanvasAsPng(canvasRef.current, `qr-code-${safeName}.png`);
        onToast("QR code downloaded as PNG!");
    };

    const handleDownloadSvg = async () => {
        if (!payload.trim() || error) return;
        try {
            const svgString = await QRCode.toString(payload, {
                type: "svg",
                errorCorrectionLevel: settings.errorCorrectionLevel,
                margin: settings.margin,
                color: {
                    dark: settings.darkColor,
                    light: settings.lightColor,
                },
            });
            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const safeName = templateType + "-" + Date.now();
            downloadBlob(blob, `qr-code-${safeName}.svg`);
            onToast("QR code downloaded as SVG!");
        } catch {
            onToast("Failed to generate SVG QR code.");
        }
    };

    const handlePrint = () => {
        if (!canvasRef.current || error || !payload.trim()) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print QR Code</title>
                    <style>
                        body {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            background: #fff;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" style="max-width: 100%; height: auto;" />
                    <script>
                        window.onload = () => {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">QR Code Configuration</h3>
                    <p className="text-xs text-zinc-400">Choose a data template, customize styling, colors and error correction.</p>
                </div>

                {/* Template Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Content Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: "text", label: "Text" },
                            { id: "url", label: "URL / Link" },
                            { id: "wifi", label: "Wi-Fi" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setTemplateType(item.id as QrTemplateType);
                                    if (item.id === "url" && !rawText.startsWith("http")) {
                                        setRawText("https://example.com");
                                    }
                                }}
                                className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                                    templateType === item.id
                                        ? "bg-indigo-600 text-white font-semibold"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Form Inputs */}
                <div className="space-y-4 pt-1">
                    {(templateType === "text" || templateType === "url") && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-200">
                                {templateType === "url" ? "Target Website URL" : "Plain Text Content"}
                            </label>
                            {templateType === "text" ? (
                                <textarea
                                    rows={4}
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    placeholder="Enter any text, notes, configuration..."
                                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                            ) : (
                                <input
                                    type="url"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono"
                                />
                            )}
                        </div>
                    )}

                    {templateType === "wifi" && (
                        <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-zinc-300 block mb-1">Network Name (SSID) *</label>
                                    <input
                                        type="text"
                                        value={wifiConfig.ssid}
                                        onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                                        placeholder="Office-Guest-WiFi"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-300 block mb-1">Security / Encryption</label>
                                    <select
                                        value={wifiConfig.encryption}
                                        onChange={(e) => setWifiConfig({ ...wifiConfig, encryption: e.target.value as "WPA" | "WEP" | "nopass" })}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="WPA">WPA / WPA2 / WPA3</option>
                                        <option value="WEP">WEP</option>
                                        <option value="nopass">None (Open Network)</option>
                                    </select>
                                </div>
                            </div>
                            {wifiConfig.encryption !== "nopass" && (
                                <div>
                                    <label className="text-xs font-medium text-zinc-300 block mb-1">Wi-Fi Password</label>
                                    <input
                                        type="text"
                                        value={wifiConfig.password}
                                        onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                                        placeholder="SecretWiFiKey123"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={wifiConfig.hidden}
                                    onChange={(e) => setWifiConfig({ ...wifiConfig, hidden: e.target.checked })}
                                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-zinc-300">Hidden Network</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Appearance Settings */}
                <div className="pt-2 border-t border-zinc-800 space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Style & Error Correction</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Error Correction */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-zinc-300">Error Correction</label>
                                <span className="text-xs text-zinc-400">Level {settings.errorCorrectionLevel}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 border border-zinc-700 rounded-lg overflow-hidden">
                                {(["L", "M", "Q", "H"] as QrErrorCorrectionLevel[]).map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, errorCorrectionLevel: lvl })}
                                        className={`py-1.5 text-xs text-center font-medium ${
                                            settings.errorCorrectionLevel === lvl
                                                ? "bg-indigo-600 text-white"
                                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                        }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                {settings.errorCorrectionLevel === "L" && "Low (~7% recovery) - Smallest code size"}
                                {settings.errorCorrectionLevel === "M" && "Medium (~15% recovery) - Recommended"}
                                {settings.errorCorrectionLevel === "Q" && "Quartile (~25% recovery) - Good for scanning in rough conditions"}
                                {settings.errorCorrectionLevel === "H" && "High (~30% recovery) - Best durability"}
                            </p>
                        </div>

                        {/* Quiet Zone */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-zinc-300">Quiet Zone / Margin</label>
                                <span className="text-xs text-zinc-400 font-mono">{settings.margin} modules</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={6}
                                step={1}
                                value={settings.margin}
                                onChange={(e) => setSettings({ ...settings, margin: Number(e.target.value) })}
                                className="w-full accent-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-xs font-medium text-zinc-300 block mb-2">QR Code Color (Dark)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.darkColor}
                                    onChange={(e) => setSettings({ ...settings, darkColor: e.target.value })}
                                    className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                                />
                                <span className="text-xs font-mono text-zinc-300">{settings.darkColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-zinc-300 block mb-2">Background Color (Light)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.lightColor}
                                    onChange={(e) => setSettings({ ...settings, lightColor: e.target.value })}
                                    className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                                />
                                <span className="text-xs font-mono text-zinc-300">{settings.lightColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview & Action Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-base font-semibold text-white mb-4 self-start">Live Preview</h3>

                    <div className="w-full min-h-[300px] bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex items-center justify-center">
                        {error && (
                            <div className="text-center p-4">
                                <div className="text-red-400 font-medium text-sm mb-1">Invalid QR Content</div>
                                <div className="text-xs text-zinc-400">{error}</div>
                            </div>
                        )}
                        <div className={`p-3 bg-white rounded shadow-sm flex items-center justify-center ${error ? "hidden" : "block"}`}>
                            <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
                        </div>
                    </div>

                    {/* Raw payload snippet */}
                    {payload && !error && (
                        <div className="w-full mt-3 px-3 py-2 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400 truncate" title={payload}>
                            Payload: {payload}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="w-full grid grid-cols-2 gap-2.5 mt-4">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!!error || !payload.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Image
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={!!error || !payload.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            disabled={!!error || !payload.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PNG
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadSvg}
                            disabled={!!error || !payload.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Download SVG
                        </button>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-xs text-zinc-400 space-y-2">
                    <div className="font-semibold text-zinc-200">About QR Codes:</div>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400">
                        <li>Standard camera apps on iOS and Android can scan Wi-Fi and URL QR codes instantly.</li>
                        <li>Higher error correction levels (Q / H) make the code more readable if the sticker is scratched or dusty.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
