import { Storage } from "./Storage";

type AuthResult = {
    requiresPin: boolean;
    token: string;
    requiresPass2: boolean;
    longLivedToken: string;
};

type PwdManState = {
    token: string;
    requiresPass2: boolean;
};

export class Security {

    private storage: Storage = new Storage();

    public getAuthenticationToken(): string | undefined {
        const str: string | undefined = this.storage.get("pwdman-state", "SESSION");
        if (str && str.length > 0) {
            const pwdmanState: PwdManState | undefined = JSON.parse(str) as PwdManState;
            if (pwdmanState && !pwdmanState.requiresPass2 && pwdmanState.token.length > 0) {
                return pwdmanState.token;
            }
        }
        return undefined;
    }

    public async authenticateLongLivedTokenAsync(): Promise<void> {
        const token: string | undefined = this.getAuthenticationToken();
        if (!token) {
            const lltoken: string | undefined = this.storage.get("pwdman-lltoken", "LOCAL");
            // login with long lived token if it exists
            if (lltoken) {
                const requestInit: RequestInit = { headers: { "token": lltoken, "uuid": this.getClientUuid() } };
                // endpoint on stockfleth.eu
                const resp: Response = await window.fetch("/api/pwdman/auth/lltoken", requestInit);
                if (!resp.ok) {
                    // remove long lived token on failure
                    this.storage.remove("pwdman-lltoken", "LOCAL");
                    return;
                }
                const authResult: AuthResult | undefined = await resp.json() as AuthResult;
                if (!authResult || authResult.requiresPin || authResult.requiresPass2) {
                    return;
                }    
                const state: PwdManState = {
                    "token": authResult.token,
                    "requiresPass2": false
                };
                this.storage.set("pwdman-state", JSON.stringify(state), "SESSION");
                this.storage.set("pwdman-lltoken", authResult.longLivedToken, "LOCAL");
            }
        }
    };

    // private

    private getClientUuid(): string {
        const ci: string | undefined = this.storage.get("clientinfo", "LOCAL");
        if (ci && ci.length > 0) {
            const clientInfo = JSON.parse(ci) as { uuid: string };
            if (clientInfo) {
                return clientInfo.uuid;
            }
        }
        return "";
    }

}