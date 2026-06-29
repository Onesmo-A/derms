const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const browserStorage = {
    getItem(key: string): string | null {
        return getStorage()?.getItem(key) ?? null;
    },
    setItem(key: string, value: string): void {
        getStorage()?.setItem(key, value);
    },
    removeItem(key: string): void {
        getStorage()?.removeItem(key);
    },
};
