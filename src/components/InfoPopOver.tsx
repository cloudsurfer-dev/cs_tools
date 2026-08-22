import { useEffect, useRef, useState } from "react";

interface InfoPopoverProps {
    children: React.ReactNode;
}

export const InfoPopOver = ({ children }: InfoPopoverProps) => {
    const [open, setOpen] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const iconRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!open && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const midpoint = window.innerWidth / 2;
            setOpenLeft(rect.left > midpoint);
        }
        setOpen((prev) => !prev);
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if (
                iconRef.current?.contains(e.target as Node) ||
                popoverRef.current?.contains(e.target as Node)
            ) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <div className="relative inline-flex items-center">
            {/* Info icon button */}
            <button
                type="button"
                ref={iconRef}
                onClick={toggle}
                className="w-4 h-4 rounded-full border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-[10px] leading-none transition-colors"
                aria-label="Info"
                title="Click for info"
            >
                i
            </button>

            {/* Popover */}
            {open && (
                <div
                    ref={popoverRef}
                    className={`absolute top-6 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3.5 text-xs text-zinc-300 leading-relaxed animate-in fade-in zoom-in-95 duration-100 ${
                        openLeft ? "right-0" : "left-0"
                    }`}
                >
                    {children}
                </div>
            )}
        </div>
    );
};
