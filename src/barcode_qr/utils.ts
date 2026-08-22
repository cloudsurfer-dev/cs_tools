export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const downloadSvgElement = (svgElement: SVGSVGElement, filename: string) => {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, source], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(svgBlob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
};

export const svgToPngBlob = (svgElement: SVGSVGElement, scale = 2): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
            const rect = svgElement.getBoundingClientRect();
            const width = (rect.width || 300) * scale;
            const height = (rect.height || 150) * scale;

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error("Canvas context is not available"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Failed to convert canvas to blob"));
                }
            }, "image/png");
        };

        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };

        img.src = url;
    });
};

export const downloadSvgAsPng = async (svgElement: SVGSVGElement, filename: string, scale = 2) => {
    const blob = await svgToPngBlob(svgElement, scale);
    downloadBlob(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
};

export const copySvgToClipboardAsPng = async (svgElement: SVGSVGElement): Promise<boolean> => {
    try {
        const blob = await svgToPngBlob(svgElement, 2);
        if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": blob,
                }),
            ]);
            return true;
        }
    } catch (err) {
        console.error("Failed to copy image to clipboard:", err);
    }
    return false;
};

export const copyCanvasToClipboardAsPng = async (canvas: HTMLCanvasElement): Promise<boolean> => {
    try {
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }
                try {
                    if (navigator.clipboard && window.ClipboardItem) {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                "image/png": blob,
                            }),
                        ]);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (err) {
                    console.error("Clipboard write error:", err);
                    resolve(false);
                }
            }, "image/png");
        });
    } catch (err) {
        console.error("Canvas clipboard error:", err);
        return false;
    }
};

export const downloadCanvasAsPng = (canvas: HTMLCanvasElement, filename: string) => {
    canvas.toBlob((blob) => {
        if (blob) {
            downloadBlob(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
        }
    }, "image/png");
};
