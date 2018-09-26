/* exported FastFloodFillCanvas */
class FastFloodFillCanvas extends AbstractFloodFillCanvas {

    *fillGenerator(p) {
        let stack = [];
        let numPushes = 0;
        let numRepeats = 0;
        let maxDepth = 0;
        let curColor = this.fillColor;

        if (this.renderer.pixelHasColor(p, curColor)) {
            return;
        }

        let prevColor = this.renderer.getPixelColor(p);
        this.renderer.drawPixel(p, curColor);
        stack.push(p);
        numPushes++;
        maxDepth = 1;

        while(stack.length != 0) {
            let pp = stack.pop();

            for(let i = 0; i < this.dirs.length; i++) {

                let ppp = {
                    x: pp.x + this.dirs[i].x,
                    y: pp.y + this.dirs[i].y
                };

                if(!this.renderer.pixelIsInside(ppp)) {
                    continue;
                }

                if (!this.renderer.pixelHasColor(ppp, prevColor)) {
                    numRepeats++;
                    continue;
                }

                yield this.renderer.drawPixel(ppp, [255, 0, 0, 255]);
                yield this.renderer.drawPixel(ppp, curColor);
                stack.push(ppp);

                numPushes++;

                if (stack.length > maxDepth) {
                    maxDepth = stack.length;
                }
            }
        }

        console.log(`Fast algorithm: ${numPushes} stack pushes, ${numRepeats} already colored pixels checked, ${maxDepth} max stack depth.`);
        this.renderer.update();
    }

}
