import './App.css'
import {MacFixer} from "./components/MacFixer.tsx";
import {InterfaceStatus} from "./components/InterfaceStatus.tsx";
import {Home} from "./components/Home.tsx";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";


function App() {
    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-900 text-zinc-500">

                <header className="w-full border-b border-zinc-800 bg-zinc-900">
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
                            <NavLink to="/vlanmapper" className="hover:text-white transition-colors [&.active]:text-white [&.active]:font-medium">
                                VLAN Mapper
                            </NavLink>
                        </nav>

                    </div>
                </header>

                <main className="mx-auto max-w-8xl px-6 py-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/macfixer" element={<MacFixer />} />
                        <Route path="/vlanmapper" element={<InterfaceStatus />} />
                    </Routes>
                </main>

            </div>
        </HashRouter>
    )
}

export default App
