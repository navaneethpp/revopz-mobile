type ScanCallback = (serials: string[]) => void;

class ScanEvents {
    private callback: ScanCallback | null = null;

    setCallback(cb: ScanCallback) {
        this.callback = cb;
    }

    trigger(scannedSerials: string[]) {
        if (this.callback) {
            this.callback(scannedSerials);
        }
    }

    clear() {
        this.callback = null;
    }
}

export const scanEvents = new ScanEvents();
