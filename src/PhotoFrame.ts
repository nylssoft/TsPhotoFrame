import "./PhotoFrame.css";
import { ControlUtils } from "./ControlUtils";
import { ArrayUtils } from "./ArrayUtils";

type Dimension = {
    w: number;
    h: number;
};

class PhotoFrame {
    
    private canvas?: HTMLCanvasElement;
    private dirty: boolean = true;
    private image?: HTMLImageElement;
    private lastWindowWidth: number = 0;
    private animateWidth: number = 0;
    private animateHeight: number = 0;
    private pictures: string[] = [];
    private pictureIdx: number = 0;
    private randmonIndices: number[] = [];
    private nextCounter: number = 0;
    private delay: number = 50 * 10;
    private shuffle: boolean = true;

    private draw(): void {
        this.nextCounter += 1;
        if (this.nextCounter > this.delay) {
            this.setNextPicture();
        }
        if (this.dirty && this.canvas) {
            const ctx: CanvasRenderingContext2D = this.canvas!.getContext("2d")!;
            this.dirty = this.drawImage(ctx, this.canvas, this.image, this.animateWidth, this.animateHeight);
        }
        window.requestAnimationFrame(() => this.draw());
    }

    private drawImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, image: HTMLImageElement | undefined, animateWidth: number, animateHeight: number): boolean {
        let w: number = canvas.width;
        let h: number = canvas.height;

        const speed = 10;
        let animate = false;
        if (w != animateWidth) {
            if (w < animateWidth) {
                w = Math.min(animateWidth, w + speed);
            }
            else {
                w = Math.max(animateWidth, w - speed);
            }
            canvas.width = w;
            animate = true;
        }
        if (h != animateHeight) {
            if (h < animateHeight) {
                h = Math.min(animateHeight, h + speed);
            }
            else {
                h = Math.max(animateHeight, h - speed);
            }
            canvas.height = h;
            animate = true;
        }

        ctx.clearRect(0, 0, w, h);

        const bw = Math.floor(w / 40);
        const gap: number = bw;

        ctx.fillStyle = "white";
        ctx.fillRect(gap + bw, gap, w - 4 * gap, h - 2 * gap);

        ctx.fillStyle = "black";
        ctx.fillRect(gap + bw, gap, w - 4 * gap, bw);
        ctx.fillRect(gap + bw, h - gap - bw, w - 4 * gap, bw);

        ctx.fillRect(gap + bw, gap + bw, bw, h - 2 * gap - 2 * bw);
        ctx.fillRect(w - 4 * gap + bw, gap + bw, bw, h - 2 * gap - 2 * bw);

        if (image) {
            let ix = gap + bw + 2 * bw;
            let iy = gap + bw + 2 * bw;
            const origw = w - 4 * gap - 4 * bw;
            const origh = h - 2 * gap - 6 * bw;
            let iw = origw;
            let ih = origh;
            // keep ratio of original image, image has to fit always
            const ratio = image.width / image.height;
            const niw = ih * ratio;
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

    private updatePicture(): void {
        if (this.pictures.length > 0) {
            const idx = this.randmonIndices[this.pictureIdx];
            const url: string = this.pictures[idx];
            const img = new Image();
            img.src = url;
            img.addEventListener("load", () => {
                this.nextCounter = 0;
                this.image = img;            
                this.dirty = true;
            },
            false);        
        }
    }

    private setNextPicture():void {
        if (this.pictures) {
            this.pictureIdx += 1;
            if (this.pictureIdx >= this.randmonIndices.length) {
                this.pictureIdx = 0;
            }
            this.updatePicture();
        }
    }

    private calculateDimension(canvas: HTMLCanvasElement, lastW: number): Dimension {
                
        const fac: number = 600 / 800;

        let w: number = window.innerWidth;
        let h: number = Math.floor(w * fac);

        const bw = Math.floor(w / 40);
        const gap: number = bw * 2;
        w = w - gap;
        h = h - gap;

        while (h > window.innerHeight) {
            w = w - gap;
            h = Math.floor(w * fac);
        }
        if (window.innerWidth > lastW && w < canvas.width ||
            window.innerWidth < lastW && w > canvas.width) {
            w = canvas.width;
            h = canvas.height;
        }
        return {w, h};
    }

    private onResize(): void {
        if (this.canvas) {
            const dim: Dimension = this.calculateDimension(this.canvas, this.lastWindowWidth);            
            this.animateWidth = dim.w;
            this.animateHeight = dim.h;
            this.dirty = true;
            this.lastWindowWidth = window.innerWidth;
        }
    }

    private renderPhotoFrame(parent: HTMLElement): void {
        this.canvas = ControlUtils.create(parent, "canvas") as HTMLCanvasElement;
        addEventListener("click", (event) => this.setNextPicture());
        addEventListener("resize", (event) => this.onResize());
        this.onResize();
        this.canvas.width = this.animateWidth;
        this.canvas.height = this.animateHeight;
    }

    private render(): void {
        ControlUtils.removeAllChildren(document.body);
        const mainDiv: HTMLDivElement = ControlUtils.createDiv(document.body, "container");
        this.updatePicture();
        this.renderPhotoFrame(mainDiv);
    }

    private get_session_storage(key:string):string | undefined {
        try {
            const value:string|null = window.sessionStorage.getItem(key);
            if (value) {
                return value;
            }
        }
        catch {
        }
        return undefined;
    };

    private get_authentication_token():string | undefined {
        let pwdmanState;
        let str = this.get_session_storage("pwdman-state");
        if (str && str.length > 0) {
            pwdmanState = JSON.parse(str);
            if (pwdmanState && !pwdmanState.requiresPass2 && pwdmanState.token.length > 0) {
                return pwdmanState.token;
            }
        }
        return undefined;
    };

    init(): void  {
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
        window.fetch("/api/pwdman/photoframe", requestInit).then(resp => {
            resp.json().then(json => {
                const pics: string[] = json as string[];
                this.randmonIndices = ArrayUtils.buildRange(0, pics.length - 1);
                if (this.shuffle) {
                    ArrayUtils.shuffle(this.randmonIndices);
                }
                this.pictures = pics;
                this.render();
                window.requestAnimationFrame(() => this.draw());    
            })
        });
    }

}

const photoFrame: PhotoFrame = new PhotoFrame();

window.onload = () => photoFrame.init();

