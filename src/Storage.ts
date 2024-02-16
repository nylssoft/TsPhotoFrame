
export type StorageScope = "SESSION" | "LOCAL";

export class Storage {

    private memoryStorage: Map<string, string> = new Map();

    public get(key:string, scope: StorageScope): string | undefined {
        try {
            let value: string | null;
            if (scope === "SESSION") {
                value = window.sessionStorage.getItem(key);
            }
            else {
                value = window.localStorage.getItem(key);
            }
            if (value) {
                return value;
            }
        }
        catch {
            // storage disabled
            if (scope === "SESSION") {
                return this.memoryStorage.get(key);
            }
        }
        return undefined;
    }

    public set(key: string, val: string, scope: StorageScope): void {
        try {
            if (scope === "SESSION") {
                window.sessionStorage.setItem(key, val);
            }
            else {
                window.localStorage.setItem(key, val);
            }
        }
        catch {
            // storage disabled
            if (scope === "SESSION") {
                this.memoryStorage.set(key, val);
            }
        }
    }

    public remove(key: string, scope: StorageScope): void {
        try {
            if (scope === "SESSION") {
                window.sessionStorage.removeItem(key);
            }
            else {
                window.localStorage.removeItem(key);
            }
        }
        catch {
            // storage disabled
            if (scope === "SESSION") {
                this.memoryStorage.delete(key);
            }
        }
    }

}