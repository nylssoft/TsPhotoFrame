import "./PhotoFrame.css";
import { ControlUtils } from "./ControlUtils";
import { ArrayUtils } from "./ArrayUtils";
import { Security } from "./Security";
import { version } from "../package.json";
import { parse } from "exifr";

type Dimension = {
    w: number;
    h: number;
};

class PhotoFrame {
    
    private canvas?: HTMLCanvasElement;
    private versionLabel?: HTMLElement;
    private dateLabel?: HTMLElement;
    private dirty: boolean = true;
    private image?: HTMLImageElement;
    private lastWindowWidth: number = 0;
    private animateWidth: number = 0;
    private animateHeight: number = 0;
    private originalUrls: string[] = [];
    private urlStack: string[] = [];
    private nextCounter: number = -1;
    private delay: number = 50 * 10;
    private shuffle: boolean = true;

    private security: Security = new Security();

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
                this.updateLabelVisibility();
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
        const y1: number = bw;
        const paperW: number = w - 4 * bw;
        const paperH: number = h - 2 * bw;
        // Draw the mat and a mitered wooden frame with beveled edges.
        ctx.fillStyle = "#f4f0e6";
        ctx.fillRect(x1, y1, paperW, paperH);
        if (bw > 0) {
            const right: number = x1 + paperW;
            const bottom: number = y1 + paperH;
            const horizontal: CanvasGradient = ctx.createLinearGradient(0, y1, 0, y1 + bw);
            horizontal.addColorStop(0, "#2c1911");
            horizontal.addColorStop(0.18, "#795138");
            horizontal.addColorStop(0.55, "#67402b");
            horizontal.addColorStop(0.85, "#3b2217");
            horizontal.addColorStop(1, "#21130e");
            const vertical: CanvasGradient = ctx.createLinearGradient(x1, 0, x1 + bw, 0);
            vertical.addColorStop(0, "#21130e");
            vertical.addColorStop(0.18, "#67402b");
            vertical.addColorStop(0.55, "#54321f");
            vertical.addColorStop(0.85, "#342016");
            vertical.addColorStop(1, "#1c100c");

            ctx.fillStyle = horizontal;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(right, y1);
            ctx.lineTo(right - bw, y1 + bw);
            ctx.lineTo(x1 + bw, y1 + bw);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = vertical;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + bw, y1 + bw);
            ctx.lineTo(x1 + bw, bottom - bw);
            ctx.lineTo(x1, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.save();
            ctx.translate(right + x1, bottom + y1);
            ctx.rotate(Math.PI);
            ctx.fillStyle = horizontal;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(right, y1);
            ctx.lineTo(right - bw, y1 + bw);
            ctx.lineTo(x1 + bw, y1 + bw);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = vertical;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + bw, y1 + bw);
            ctx.lineTo(x1 + bw, bottom - bw);
            ctx.lineTo(x1, bottom);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = "rgba(36, 20, 13, 0.35)";
            ctx.lineWidth = Math.max(1, bw / 8);
            ctx.strokeRect(x1 + bw, y1 + bw, paperW - 2 * bw, paperH - 2 * bw);
        }
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
            ctx.save();
            ctx.shadowColor = "rgba(40, 30, 20, 0.35)";
            ctx.shadowBlur = Math.max(1, bw / 3);
            ctx.shadowOffsetY = Math.max(1, bw / 8);
            ctx.drawImage(image, ix, iy, iw, ih);
            ctx.restore();
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
            return img;
        }
        return undefined;
    }

    private getNextUrl(): string | undefined {
        if (this.originalUrls && this.originalUrls.length > 0) {
            let url: string | undefined = this.urlStack.pop();
            if (!url) {
                this.urlStack = [...this.originalUrls];
                url = this.urlStack.pop();
            }
            return url;
        }
        return undefined;
    }

    private toggleNextUrl(): void {
        this.nextCounter = 0;
        const img: HTMLImageElement | undefined = this.createImage(this.getNextUrl());
        if (img) {
            img.addEventListener("load", () => {
                this.image = img;
                this.dirty = true;
                this.nextCounter = 0;
                if (this.dateLabel) {
                    this.dateLabel.textContent = "";
                    this.updateLabelVisibility();
                }
                void this.showPhotoDate(img);
            }, false);
        }
    }

    private async showPhotoDate(img: HTMLImageElement): Promise<void> {
        try {
            const response = await fetch(img.currentSrc);
            if (!response.ok) {
                throw new Error(`Photo request failed with status ${response.status}`);
            }
            const blob = await response.blob();
            const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
            if (header[0] !== 0xff || header[1] !== 0xd8) {
                return;
            }
            const metadata = await parse(blob, ["DateTimeOriginal"]);
            const date = metadata?.DateTimeOriginal;
            if (this.image === img && this.dateLabel && date instanceof Date && !Number.isNaN(date.getTime())) {
                this.dateLabel.textContent = date.toLocaleDateString();
                this.updateLabelVisibility();
            }
        }
        catch (error) {
            console.warn("Could not read the photo capture date:", error);
        }
    }

    private onResize(): void {
        const dim: Dimension = this.getWidthAndHeight(this.canvas!, this.lastWindowWidth);            
        this.animateWidth = dim.w;
        this.animateHeight = dim.h;
        this.lastWindowWidth = window.innerWidth;
        this.nextCounter = 0;
        this.dirty = true;
        this.updateLabelVisibility();
    }

    private updateLabelVisibility(): void {
        if (this.canvas) {
            const canvasRect = this.canvas.getBoundingClientRect();
            for (const label of [this.versionLabel, this.dateLabel]) {
                if (label) {
                    const labelRect = label.getBoundingClientRect();
                    const fits = !!label.textContent && labelRect.left >= 0 && labelRect.right <= window.innerWidth &&
                        labelRect.top >= 0 && labelRect.top >= canvasRect.bottom + 8;
                    label.style.visibility = fits ? "visible" : "hidden";
                }
            }
        }
    }

    private render(): void {
        ControlUtils.removeAllChildren(document.body);
        const mainDiv: HTMLDivElement = ControlUtils.createDiv(document.body, "container");
        this.canvas = ControlUtils.create(mainDiv, "canvas") as HTMLCanvasElement;
        const dim: Dimension = this.getWidthAndHeight(this.canvas!, this.lastWindowWidth);
        this.canvas!.width = dim.w;
        this.canvas!.height = dim.h;
        this.animateWidth = dim.w;
        this.animateHeight = dim.h;
        this.versionLabel = ControlUtils.create(document.body, "div", "version", `v${version}`);
        this.dateLabel = ControlUtils.create(document.body, "div", "photo-date");
        this.updateLabelVisibility();
        this.toggleNextUrl();
        addEventListener("click", () => this.toggleNextUrl());
        addEventListener("resize", () => this.onResize());
    }

    async initAsync(): Promise<void>  {
        await this.security.authenticateLongLivedTokenAsync();
        const params:URLSearchParams = new URLSearchParams(window.location.search);
        if (params.has("delay")) {
            this.delay = parseInt(params.get("delay")!);
        }
        if (params.has("shuffle")) {
            this.shuffle = params.get("shuffle") != "false";
        }
        let requestInit: RequestInit | undefined = undefined;
        let token: string | undefined = this.security.getAuthenticationToken();
        if (!token) {
            token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("familyaccesstoken="))
                ?.split("=")[1];
        }
        if (token) {
            requestInit = { headers: { "token": token } };
        }
        // endpoint on stockfleth.eu
        const resp: Response = await window.fetch("/api/pwdman/photoframe", requestInit);
        if (resp.ok) {
            const json = await resp.json();
            this.originalUrls = json as string[];
            if (this.shuffle) {
                ArrayUtils.shuffle(this.originalUrls);
            }
            this.urlStack = [...this.originalUrls];    
        }
        this.render();
        window.requestAnimationFrame(() => this.draw());    
    }

}

const photoFrame: PhotoFrame = new PhotoFrame();

window.onload = () => photoFrame.initAsync();

