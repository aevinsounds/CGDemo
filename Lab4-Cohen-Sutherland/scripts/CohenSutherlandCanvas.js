const CODES = {
    INSIDE: 0b0000,
    LEFT:   0b0001,
    RIGHT:  0b0010,
    TOP:    0b0100,
    BOTTOM: 0b1000
};

CODES.toString = {
    [CODES.INSIDE]: 'INSIDE',
    [CODES.LEFT]:   'LEFT',
    [CODES.RIGHT]:  'RIGHT',
    [CODES.TOP]:    'TOP',
    [CODES.BOTTOM]: 'BOTTOM',

    [CODES.TOP    | CODES.LEFT]:  'TOP LEFT',
    [CODES.TOP    | CODES.RIGHT]: 'TOP RIGHT',
    [CODES.BOTTOM | CODES.LEFT]:  'BOTTOM LEFT',
    [CODES.BOTTOM | CODES.RIGHT]: 'BOTTOM RIGHT',
};

/* exported CohenSutherlandCanvas */
class CohenSutherlandCanvas {

    /**
    * Холст для рисования линий и окружностей по алгоритму Брезенхема.
    * Конструктор создает рендерер для рисования пикселей на холсте и массив для хранения фигур для рисования.
    * @class
    * @param {HTMLCanvasElement} canvas  HTML-элемент холст
    * @param {number}            width   ширина холста
    * @param {number}            height  высота холста
    * @param {array}             color   цвет рисования по холсту [r, g, b, a]
    */
    constructor(canvas, width, height, color, enabled) {

        this.clippingEnabled = enabled;

        /**
        * Холст.
        * @type {HTMLCanvasElement}
        */
        this.canvas = canvas;

        /**
        * Контекст для рисования на холсте.
        * @type {CanvasRenderingContext2D}
        */
        this.ctx = canvas.getContext('2d');

        this.width = width;
        this.height = height;

        /**
        * Установленный цвет рисования на холсте.
        * @type {array}
        */
        this.color = color;

        /**
        * Массив с фигурами для рисования.
        * @type {RenderArray}
        */
        this.shapes = new RenderArray();

        /**
        * Прямоугольник.
        */
        this.rectangle = {
            type: 'rectangle',
            p1: {},
            p2: {},
            properties: null
        };

        this.guidingLines = [];
        for(let i = 0; i < 4; i++) {
            this.guidingLines.push(this.add('line', { x: 0, y: 0 }, { x: 0, y: 0 }, 'dashed'));
        }

        this.shapes.add(this.rectangle);

        this.resetRectangle();
        this.update();
    }

    /** Ширина холста. */
    get width() {
        return this.canvas.width;
    }

    set width(width) {
        this.canvas.width = width;
    }

    /** Высота холста. */
    get height() {
        return this.canvas.height;
    }

    set height(height) {
        this.canvas.height = height;
    }

    /** Цвет кисти в виде массива. */
    get color() {
        return this._color;
    }

    set color(color) {
        this._color = color.slice();
        this.ctx.strokeStyle = `rgba(${color.join(',')})`;
    }

    resetRectangle() {
        let w = this.width - 300;
        let h = this.height - 200;
        this.rectangle.type = 'rectangle';
        this.rectangle.p1.x = this.width / 2 - w / 2;
        this.rectangle.p1.y = this.height / 2 - h / 2;
        this.rectangle.p2.x = this.width / 2 + w / 2;
        this.rectangle.p2.y = this.height / 2 + h / 2;
        this.rectangle.properties = null;
    }

    updateRectangleProperties() {
        let p1 = this.rectangle.p1;
        let p2 = this.rectangle.p2;
        let pr = this.rectangle.properties = {
            w: p2.x - p1.x,
            h: p2.y - p1.y,
            xmin: Math.min(p1.x, p2.x),
            xmax: Math.max(p1.x, p2.x),
            ymin: Math.min(p1.y, p2.y),
            ymax: Math.max(p1.y, p2.y)
        };

        this.guidingLines[0].p1.x = 0;
        this.guidingLines[0].p1.y = pr.ymin;
        this.guidingLines[0].p2.x = this.width;
        this.guidingLines[0].p2.y = pr.ymin;

        this.guidingLines[1].p1.x = 0;
        this.guidingLines[1].p1.y = pr.ymax;
        this.guidingLines[1].p2.x = this.width;
        this.guidingLines[1].p2.y = pr.ymax;

        this.guidingLines[2].p1.x = pr.xmin;
        this.guidingLines[2].p1.y = 0;
        this.guidingLines[2].p2.x = pr.xmin;
        this.guidingLines[2].p2.y = this.height;

        this.guidingLines[3].p1.x = pr.xmax;
        this.guidingLines[3].p1.y = 0;
        this.guidingLines[3].p2.x = pr.xmax;
        this.guidingLines[3].p2.y = this.height;
    }

    /**
    * Создает, добавляет в массив и возвращает фигуру для рисования.
    * @param {string} type  тип фигуры ('line' или 'circle')
    * @param {point}  p1        первая точка
    * @param {point}  p2        вторая точка
    * @param {string}   special   указывает специальный тип линии ('moving' или 'dashed')
    *
    * @return {object} Фигура в виде {type, p1, p2, special}.
    */
    add(type, p1, p2, special = '') {

        if (type == 'rectangle') {
            this.rectangle.p1.x = p1.x;
            this.rectangle.p1.y = p1.y;
            this.rectangle.p2.x = p2.x;
            this.rectangle.p2.y = p2.y;
            return this.rectangle;
        }

        let shape = {
            type: type,
            p1, p2, special
        };

        this.shapes.add(shape);
        return shape;
    }

    /* Очищает холст и выводит все фигуры из массива, кроме прямоугольника и направляющих линий. */
    update() {
        this.updateRectangleProperties();

        this.ctx.clearRect(0, 0, this.width, this.height);

        for(let i = 0; i < this.shapes.array.length; i++) {
            let shape = this.shapes.array[i];
            let isLast = i === this.shapes.array.length - 1;
            this[this.getDrawMethodName(shape.type)](shape.p1, shape.p2, shape.special, isLast);
        }
    }

    /**
    * Возвращает названия метода для рисования на основе типа фигуры.
    * @param  {string} type  тип фигуры ('line' или 'rectangle')
    *
    * @return {string} Названия метода для рисования.
    */
    getDrawMethodName(type) {
        return 'draw' + type.charAt(0).toUpperCase() + type.substring(1);
    }

    /** Очищает массив и холст. */
    clear() {
        this.shapes.clear();

        for (let line of this.guidingLines) {
            this.shapes.add(line);
        }

        this.shapes.add(this.rectangle);

        this.resetRectangle();
        this.update();
    }

    /**
    * Рисует линию.
    * @param {point}  p1    первая точка
    * @param {point}  p2    вторая точка
    */
    drawLine(p1, p2, special, printInfo) {

        if (this.clippingEnabled && !special) {
            [p1, p2] = this.clipLine(p1, p2, printInfo);

            if (printInfo) {
                console.log('Clipped to', p1, p2);
                console.log('');
            }
        }

        if(!p1 || !p2) {
            return;
        }

        let ctx = this.ctx;
        ctx.lineWidth = special == 'dashed' ? 2 : 1;
        ctx.setLineDash(special == 'dashed' ? [5, 2] : []);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    /**
    * Рисует прямоугольник.
    * @param {point}  p1    первая точка
    * @param {point}  p2    вторая точка
    */
    drawRectangle(p1, p2) {
        let w = p2.x - p1.x;
        let h = p2.y - p1.y;
        let ctx = this.ctx;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(p1.x, p1.y, w, h);
    }

    /**
     * Применяет алгоритм к отрезку.
     * @param {point} start точка начала отрезка
     * @param {point} end точка конца отрезка
     */
    clipLine(start, end, printInfo) {

        // Находим области точек
        let o1 = this.getOutCode(start);
        let o2 = this.getOutCode(end);
        let o1str = CODES.toString[o1];
        let o2str = CODES.toString[o2];

        if (printInfo) {
            console.log(`Clipping`, start, `(${o1str})`, end, `(${o2str})`);
        }

        // Обе точки находятся внутри прямоугольника
        if (o1 === CODES.INSIDE && o2 === CODES.INSIDE) {

            if (printInfo) {
                console.log(`Both points are INSIDE`);
            }

            return [start, end];
        }
        // Обе точки находятся снаружи в одной зоне
        else if (o1 & o2) {

            if (printInfo) {
                console.log(`Both points are around the ${CODES.toString[o1 & o2]} area`);
            }

            return [null, null];
        }
        // Точки находятся в разных зонах
        else {

            if (printInfo) {
                console.log(`Points are in different areas`);
            }

            // Отрезаем первую попавшуюся часть линии, находящуюся снаружи и запускаем алгоритм с новой начальной/конечной точкой
            if (o1 !== CODES.INSIDE) {
                
                let newStart = this.findIntersection(o1, start, end, printInfo);

                if (printInfo) {
                    console.log(`New starting point is`, newStart);
                }

                return this.clipLine(newStart, end, printInfo);
            }
            else {
                let newEnd = this.findIntersection(o2, start, end, printInfo);

                if (printInfo) {
                    console.log(`New end point is`, newEnd);
                }

                return this.clipLine(start, newEnd, printInfo);
            }
        }
    }

    // Находит область точки по отношению к прямоугольнику
    getOutCode(p) {
        let outcode = CODES.INSIDE;

        let x = p.x;
        let y = p.y;
        let pr = this.rectangle.properties;

        if (y > pr.ymax){
            outcode |= CODES.BOTTOM;
        }

        if (y < pr.ymin){
            outcode |= CODES.TOP;
        }

        if (x > pr.xmax){
            outcode |= CODES.RIGHT;
        }

        if (x < pr.xmin){
            outcode |= CODES.LEFT;
        }

        return outcode;
    }

    findIntersection(outcode, start, end, printInfo) {

        // В уравнении прямой линии y = mx + c
        // m = (y2-y1)/(x2-x1)
        let x1 = start.x;
        let x2 = end.x;
        let y1 = start.y;
        let y2 = end.y;

        let pr = this.rectangle.properties;

        // Находим m
        let m = (y2 - y1) / (x2 - x1);

        // Находим c, подставив одну из точек
        let c = y1 - m * x1;

        // Пересечение
        let intersection = null;
        let clipArea = null;

        if (outcode & CODES.BOTTOM) {

            clipArea = CODES.BOTTOM;

            // Пересечение линии x = ymax
            intersection = {
                x: (pr.ymax - c) / m,
                y: pr.ymax
            };
        }
        else if (outcode & CODES.TOP) {

            clipArea = CODES.TOP;

            // Пересечение линии x = ymin
            intersection = {
                x: (pr.ymin - c) / m,
                y: pr.ymin
            };
        }
        else if (outcode & CODES.RIGHT) {

            clipArea = CODES.RIGHT;
            // Пересечение линии y = xmax
            intersection = {
                x: pr.xmax,
                y: (m * pr.xmax + c)
            };
        }
        else if (outcode & CODES.LEFT) {

            clipArea = CODES.LEFT;

            // Пересечение линии y=xmin
            intersection = {
                x: pr.xmin,
                y: (m * pr.xmin + c)
            };
        }

        if (printInfo) {
            console.log(`Clipped ${CODES.toString[clipArea]} area`);
        }

        return intersection;
    }
}