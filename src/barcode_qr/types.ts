export type BarcodeFormat =
    | "CODE128"
    | "CODE128A"
    | "CODE128B"
    | "CODE128C"
    | "EAN13"
    | "EAN8"
    | "UPC"
    | "CODE39"
    | "ITF14"
    | "MSI"
    | "pharmacode"
    | "codabar";

export interface BarcodeSettings {
    format: BarcodeFormat;
    width: number;
    height: number;
    displayValue: boolean;
    fontSize: number;
    textAlign: "left" | "center" | "right";
    textPosition: "bottom" | "top";
    textMargin: number;
    background: string;
    lineColor: string;
    margin: number;
}

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrSettings {
    errorCorrectionLevel: QrErrorCorrectionLevel;
    width: number;
    margin: number;
    darkColor: string;
    lightColor: string;
}

export type GeneratorTab = "barcode" | "qrcode" | "batch";

export type QrTemplateType = "text" | "url" | "wifi";

export interface WifiConfig {
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
    hidden: boolean;
}
