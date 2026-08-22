import { Link } from "react-router-dom";

export const Home = () => {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3 py-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    IT & Network Engineering Utilities
                </h1>
                <p className="text-base text-zinc-400 max-w-2xl mx-auto">
                    A suite of tools for network technicians, IT administrators, and lab setups.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Barcode & QR Code Card */}
                <Link
                    to="/barcodes"
                    className="group bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between"
                >
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                            Bar & QR Codes
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Generate Code 128, EAN-13, UPC, Code 39 barcodes and 2D QR codes with Wi-Fi and bulk printing support.
                        </p>
                    </div>
                    <div className="pt-4 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                        Open Generator →
                    </div>
                </Link>

                {/* MAC Fixer Card */}
                <Link
                    to="/macfixer"
                    className="group bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
                >
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                            MAC Fixer
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Convert MAC addresses from any wild format into clean Standard (XX:XX:XX:XX:XX:XX), Cisco (xxxx.xxxx.xxxx), or hyphen notation.
                        </p>
                    </div>
                    <div className="pt-4 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                        Open MAC Fixer →
                    </div>
                </Link>

                {/* Switch Map Card */}
                <Link
                    to="/switchmap"
                    className="group bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/50 rounded-xl p-6 transition-all shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
                >
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            Switch Map
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Parse Cisco / Aruba switch interface status, MAC tables, and Infoblox exports into interactive visual port maps.
                        </p>
                    </div>
                    <div className="pt-4 flex items-center text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                        Open Switch Map →
                    </div>
                </Link>
            </div>
        </div>
    );
};
