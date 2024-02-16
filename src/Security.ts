import { Storage } from "./Storage";

type AuthResult = {
    requiresPin: boolean;
    token: string;
    username: string;
    requiresPass2: boolean;
    longLivedToken: string;
};

type ClientInfo = {
    uuid: string;
    name: string;
};

type PwdManState = {
    token: string;
    userName: string;    
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

    public async authenticateLongLivedTokenAsync(): Promise<boolean> {
        const token: string | undefined = this.getAuthenticationToken();
        // token not available and PIN has not been entered yet
        if (!token && !this.isPinRequired()) {
            const lltoken: string | undefined = this.storage.get("pwdman-lltoken", "LOCAL");
            // login with long lived token if it exists
            if (lltoken) {
                const requestInit: RequestInit = { headers: { "token": lltoken, "uuid": this.getClientUuid() } };
                // endpoint on stockfleth.eu
                const resp: Response = await window.fetch("/api/pwdman/auth/lltoken", requestInit);
                if (!resp.ok) {
                    // remove long lived token on failure
                    this.storage.remove("pwdman-lltoken", "LOCAL");
                    return false;
                }
                const authResult: AuthResult | undefined = await resp.json() as AuthResult;
                if (!authResult) {
                    // unexpected return type
                    return false;
                }
                // if no PIN is required, store result in session storage
                if (!authResult.requiresPin) {
                    const state: PwdManState = {
                        "token": authResult.token,
                        "userName": authResult.username,
                        "requiresPass2": authResult.requiresPass2
                    };
                    this.storage.set("pwdman-state", JSON.stringify(state), "SESSION");
                    this.storage.set("pwdman-lltoken", authResult.longLivedToken, "LOCAL");
                }
                // PIN required, redirect to PIN dialog
                else {
                    this.setPinRequired(true);
                    const sanitizeUrl: string = this.sanitizeLocation(window.location.href);
                    this.setSanitizedWindowLocation("/pwdman?nexturl=" + encodeURI(sanitizeUrl));
                    return true;
                }    
            }
        }
        return false;
    };

    public setSanitizedWindowLocation(url: string): void {
        window.location.href = this.sanitizeLocation(url);
    } 

    // private

    private isPinRequired(): boolean {
        return this.storage.get("pin-required", "SESSION") === "true";
    }

    private setPinRequired(required: boolean): void {
        if (!required) {
            this.storage.remove("pin-required", "SESSION");
        }
        else {
            this.storage.set("pin-required", "true", "SESSION");
        }
    };

    private getClientUuid(): string {
        const ci: string | undefined = this.storage.get("clientinfo", "LOCAL");
        if (ci && ci.length > 0) {
            const clientInfo: ClientInfo | undefined = JSON.parse(ci) as ClientInfo;
            if (clientInfo) {
                return clientInfo.uuid;
            }
        }
        return "";
    }

    private sanitizeLocation(url: string): string {
        let idx: number = -1;
        if (url.length > 0) {
            if (url.charAt(0) != "/") {
                idx = url.indexOf("//");
                if (idx >= 0) {
                    url = url.substring(idx + 2);
                    idx = url.indexOf("/");
                    if (idx > 0) {
                        url = url.substring(idx);
                    }
                }
            }
            if (url.startsWith("/webpack/")) {
                return url;
            }            
            if (url.charAt(0) == "/") {
                let testurl: string = url;
                idx = testurl.indexOf("?");
                if (idx > 0) {
                    testurl = testurl.substring(0, idx);
                }
                const validurls: string[] = [
                    "/backgammon", "/chess", "/contacts", "/diary", "/documents", "/notes", "/password",
                    "/pwdman", "/skat", "/skatticket", "/slideshow", "/tetris", "/usermgmt", "/view", "/makeadate"];
                if (validurls.includes(testurl)) {
                    return url;
                }
            }
        }
        return "/view";
    }

}