import './App.css'
import {MacFixer} from "./pages/MacFixer.tsx";
import {SwitchMap} from "./pages/SwitchMap.tsx";
import {Home} from "./pages/Home.tsx";
import {BarcodeQrGenerator} from "./pages/BarcodeQrGenerator.tsx";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";


function App() {
    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-900 text-zinc-500">

                <header className="w-full border-b border-zinc-800 bg-zinc-900 no-print">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

                        <NavLink to="/" className="text-lg font-bold tracking-tight text-white">
                            Tools
                        </NavLink>

                        <nav className="flex items-center gap-6 text-sm text-zinc-400">
                            <NavLink to="/" end className="hover:text-white transition-colors [&.active]:text-white [&.active]:font-medium">
                                Home
                            </NavLink>
                            <NavLink to="/macfixer" className="hover:text-white transition-colors [&.active]:text-white [&.active]:font-medium">
                                MAC Fixer
                            </NavLink>
                            <NavLink to="/switchmap" className="hover:text-white transition-colors [&.active]:text-white [&.active]:font-medium">
                                Switch Map
                            </NavLink>
                            <NavLink to="/barcodes" className="hover:text-white transition-colors [&.active]:text-white [&.active]:font-medium">
                                Bar & QR Codes
                            </NavLink>
                        </nav>

                    </div>
                </header>

                <main className="w-full px-3 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/macfixer" element={<MacFixer />} />
                        <Route path="/SwitchMap" element={<SwitchMap />} />
                        <Route path="/switchmap" element={<SwitchMap />} />
                        <Route path="/barcodes" element={<BarcodeQrGenerator />} />
                        <Route path="/barcode" element={<BarcodeQrGenerator />} />
                        <Route path="/barqr" element={<BarcodeQrGenerator />} />
                    </Routes>
                </main>

            </div>
        </HashRouter>
    )
}

export default App
