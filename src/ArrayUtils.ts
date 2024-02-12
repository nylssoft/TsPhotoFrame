export class ArrayUtils {

    static shuffle(arr: number[]): void {
        let ridx;
        let tmp;
        let cidx = arr.length;
        while (0 !== cidx) {
            ridx = Math.floor(Math.random() * cidx);
            cidx -= 1;
            tmp = arr[cidx];
            arr[cidx] = arr[ridx];
            arr[ridx] = tmp;
        }
    }

    static buildRange(start: number, stop: number): number[] {
        return Array.from({ length: (stop - start) + 1 }, (_value, index) => start + index);
    }

}
