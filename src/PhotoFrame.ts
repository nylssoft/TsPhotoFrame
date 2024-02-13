import "./PhotoFrame.css";
import { ControlUtils } from "./ControlUtils";
import { ArrayUtils } from "./ArrayUtils";

type Dimension = {
    w: number;
    h: number;
};

class PhotoFrame {
    
    private canvas?: HTMLCanvasElement;
    private extraCanvas?: HTMLCanvasElement;
    private dirty: boolean = true;
    private image?: HTMLImageElement;
    private extraImage?: HTMLImageElement;
    private lastWindowWidth: number = 0;
    private animateWidth: number = 0;
    private animateHeight: number = 0;
    private originalUrls: string[] = [];
    private urlStack: string[] = [];
    private nextCounter: number = -1;
    private toggle: boolean = false;
    private delay: number = 50 * 10;
    private shuffle: boolean = true;

    private draw(): void {
        if (this.nextCounter >= 0) {
            this.nextCounter += 1;
            if (this.nextCounter > this.delay) {
                this.toggleNextUrl();
            }    
        }
        if (this.dirty) {
            if (this.canvas) {
                const ctx: CanvasRenderingContext2D = this.canvas.getContext("2d")!;
                this.dirty = this.drawImage(ctx, this.canvas, this.image, this.animateWidth, this.animateHeight);    
            }
            if (this.extraCanvas) {
                const ctx: CanvasRenderingContext2D = this.extraCanvas.getContext("2d")!;
                let dirty: boolean = this.drawImage(ctx, this.extraCanvas, this.extraImage, this.animateWidth, this.animateHeight);
                this.dirty = this.dirty || dirty;
            }
        }
        window.requestAnimationFrame(() => this.draw());
    }

    private drawImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, image: HTMLImageElement | undefined, animateWidth: number, animateHeight: number): boolean {
        let w: number = canvas.width;
        let h: number = canvas.height;
        // animate canvas size to resized width and height
        let animate = false;
        let speedX = 10;
        let speedY = speedX;
        const stepsWidth = Math.abs(w - animateWidth);
        const stepsHeight = Math.abs(h - animateHeight);
        if (stepsWidth > 0 && stepsHeight > 0) {
            const stepsFac = stepsHeight / stepsWidth;
            speedY = speedX * stepsFac;
        }
        if (stepsWidth > 0) {
            if (w < animateWidth) {
                w = Math.floor(Math.min(animateWidth, w + speedX));
            }
            else {
                w = Math.floor(Math.max(animateWidth, w - speedX));
            }
            canvas.width = w;
            animate = true;
        }
        if (stepsHeight > 0) {
            if (h < animateHeight) {
                h = Math.floor(Math.min(animateHeight, h + speedY));
            }
            else {
                h = Math.floor(Math.max(animateHeight, h - speedY));
            }
            canvas.height = h;
            animate = true;
        }
        // draw canvas
        ctx.clearRect(0, 0, w, h);
        const bw: number = Math.floor(w / 40);
        const x1: number = 2 * bw;
        const x2: number = w - 3 * bw;
        const y1: number = bw;
        const y2: number = h - 2 * bw;
        const paperW: number = w - 4 * bw;
        const paperH: number = h - 2 * bw;
        // draw paper background
        ctx.fillStyle = "white";
        ctx.fillRect(x1, y1, paperW, paperH);
        // draw black border
        ctx.fillStyle = "black";
        // top left to top right
        ctx.fillRect(x1, y1, paperW, bw);
        // buttom left to bottom right
        ctx.fillRect(x1, y2, paperW, bw);
        // top left to bottom left
        ctx.fillRect(x1, y1 + bw, bw, y2 - 2 * bw);
        // top right to bottom right
        ctx.fillRect(x2, y1 + bw, bw, y2 - 2 * bw);
        if (image) {
            let ix: number = 4 * bw;
            let iy: number = 4 * bw;
            const origw: number = w - 8 * bw;
            const origh: number = h - 8 * bw;
            let iw: number = origw;
            let ih: number = origh;
            // keep ratio of original image, image has to fit always
            const ratio: number = image.width / image.height;
            const niw: number = ih * ratio;
            if (niw <= iw) {
                iw = Math.floor(niw);
            }
            else {
                ih = Math.floor(ih * (iw / niw));
            }
            // center
            if (iw < origw) {
                ix = Math.floor(ix + (origw - iw) / 2);
            }
            if (ih < origh) {
                iy = Math.floor(iy + (origh - ih) / 2);
            }
            ctx.drawImage(image, ix, iy, iw, ih);
        }
        return animate;
    }

    private getWidthAndHeight(canvas: HTMLCanvasElement, lastW: number): Dimension {                
        const fac: number = 3 / 4;
        let w: number = window.innerWidth;
        let h: number = Math.floor(w * fac);
        const bw: number = Math.floor(w / 40);
        w = w - 2 * bw;
        h = h - 2 * bw;
        while (h > window.innerHeight) {
            w = w - bw;
            h = Math.floor(w * fac);
        }
        if (window.innerWidth > lastW && w < canvas.width ||
            window.innerWidth < lastW && w > canvas.width) {
            w = canvas.width;
            h = canvas.height;
        }
        return {w, h};
    }

    private createImage(url: string | undefined): HTMLImageElement | undefined {
        if (url) {
            const img = new Image();
            img.src = url;
            img.addEventListener("load", () => {
                this.dirty = true;
                this.nextCounter = 0;
            }, false);
            return img;
        }
        return undefined;
    }

    private getNextUrl(): string | undefined {
        if (this.originalUrls && this.originalUrls.length > 0) {
            let url: string | undefined = this.urlStack.pop();
            if (!url) {
                this.urlStack = [...this.originalUrls];
                if (this.shuffle) {
                    ArrayUtils.shuffle(this.urlStack);
                }
                url = this.urlStack.pop();
            }
            return url;
        }
        return undefined;
    }

    private toggleNextUrl(): void {
        const img: HTMLImageElement | undefined = this.createImage(this.getNextUrl());
        if (this.extraCanvas && this.toggle) {
            this.extraImage = img;
        }
        else {
            this.image = img;
        }
        this.toggle = !this.toggle;
        this.dirty = true;
    }

    private createExtraCanvas(height: number): void {
        let extraContainer: HTMLElement = document.getElementById("extra")!;
        if (window.innerHeight > 2 * height && !this.extraCanvas) {
            this.extraCanvas = ControlUtils.create(extraContainer, "canvas") as HTMLCanvasElement;
            this.extraCanvas.width = this.canvas!.width;
            this.extraCanvas.height = this.canvas!.height;
            this.extraImage = this.createImage(this.getNextUrl());
        }
        else if (window.innerHeight <= 2 * height) {
            this.extraCanvas = undefined;
            ControlUtils.removeAllChildren(extraContainer);
        }
    }

    private onResize(): void {
        const dim: Dimension = this.getWidthAndHeight(this.canvas!, this.lastWindowWidth);            
        this.animateWidth = dim.w;
        this.animateHeight = dim.h;
        this.lastWindowWidth = window.innerWidth;
        this.createExtraCanvas(dim.h);
        this.nextCounter = 0;
        this.dirty = true;
    }

    private render(): void {
        ControlUtils.removeAllChildren(document.body);
        const mainDiv: HTMLDivElement = ControlUtils.createDiv(document.body, "container");
        const extraDiv: HTMLDivElement = ControlUtils.createDiv(document.body, "container");
        extraDiv.id = "extra";
        this.canvas = ControlUtils.create(mainDiv, "canvas") as HTMLCanvasElement;
        const dim: Dimension = this.getWidthAndHeight(this.canvas!, this.lastWindowWidth);
        this.canvas!.width = dim.w;
        this.canvas!.height = dim.h;
        this.animateWidth = dim.w;
        this.animateHeight = dim.h;
        this.createExtraCanvas(dim.h)
        this.toggleNextUrl();
        addEventListener("click", () => this.toggleNextUrl());
        addEventListener("resize", () => this.onResize());
    }

    private get_session_storage(key:string): string | undefined {
        try {
            const value:string|null = window.sessionStorage.getItem(key);
            if (value) {
                return value;
            }
        }
        catch {
        }
        return undefined;
    }

    private get_authentication_token(): string | undefined {
        let pwdmanState;
        let str = this.get_session_storage("pwdman-state");
        if (str && str.length > 0) {
            pwdmanState = JSON.parse(str);
            if (pwdmanState && !pwdmanState.requiresPass2 && pwdmanState.token.length > 0) {
                return pwdmanState.token;
            }
        }
        return undefined;
    }

    async initAsync(): Promise<void>  {
        const params:URLSearchParams = new URLSearchParams(window.location.search);
        if (params.has("delay")) {
            this.delay = parseInt(params.get("delay")!);
        }
        if (params.has("shuffle")) {
            this.shuffle = params.get("shuffle") != "false";
        }
        let requestInit: RequestInit | undefined = undefined;
        const token: string | undefined = this.get_authentication_token();
        if (token) {
            requestInit = { headers: { "token": token } };
        }
        // endpoint on stockfleth.eu
        const resp: Response = await window.fetch("/api/pwdman/photoframe", requestInit);
        const json = await resp.json();
        this.originalUrls = json as string[];
        this.urlStack = [...this.originalUrls];
        if (this.shuffle) {
            ArrayUtils.shuffle(this.urlStack);
        }
        this.render();
        window.requestAnimationFrame(() => this.draw());    
    }

}

const photoFrame: PhotoFrame = new PhotoFrame();

window.onload = () => photoFrame.initAsync();

