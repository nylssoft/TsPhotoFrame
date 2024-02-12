export class ControlUtils {

    static create(parent: HTMLElement, name: string, classid?: string, txt?: string): HTMLElement {
        const e: HTMLElement = document.createElement(name);
        if (classid) {
            e.setAttribute("class", classid);
        }
        parent.appendChild(e);
        if (txt) {
            e.textContent = txt;
        }
        return e;
    }

    static createDiv(parent: HTMLElement, classname?: string): HTMLDivElement {
        return ControlUtils.create(parent, "div", classname) as HTMLDivElement;
    }

    static createA(parent: HTMLElement, classname?: string, href?: string, txt?: string): HTMLAnchorElement {
        const a: HTMLAnchorElement = ControlUtils.create(parent, "a", classname) as HTMLAnchorElement;
        if (href) {
            a.href = href;
        }
        if (txt) {
            a.textContent = txt;
        }
        return a;
    };

    static createButton(parent: HTMLElement, txt: string, action?: (b: HTMLButtonElement) => void, value?: string, classname?: string): HTMLButtonElement {
        if (!classname) {
            classname = "button";
        }
        const b: HTMLButtonElement = ControlUtils.create(parent, "button", classname) as HTMLButtonElement;
        b.title = txt;
        b.textContent = txt;
        if (action) {
            b.addEventListener("click", e => action(b));
        }
        if (value) {
            b.value = value;
        }
        return b;
    }

    static removeAllChildren(parent: HTMLElement): void {
        const node: HTMLElement = parent;
        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }
    }

    static isMobile = (): boolean => window.matchMedia('(max-width: 480px)').matches;

}
