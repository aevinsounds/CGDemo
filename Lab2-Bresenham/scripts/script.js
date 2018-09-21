let mode = 'line'; // Режим рисования (line или circle)
let buttonLine = $('#button_line'); // Кнопка переключения в режим линии
let buttonCircle = $('#button_circle'); // Кнопка переключения в режим окружности
let buttonClear = $('#button_clear'); // Кнопка очистки холста
let canvas = $('#canvas'); // Холст для рисования

let color = [33, 150, 243, 255]; // Цвет кисти
let bresCanvas = new BresenhamsCanvas(canvas[0], canvas.width(), canvas.height(), color); // Рисующий объект
let brush = new Brush(bresCanvas, mode); // Кисть

// Ставим стандартный режим рисования (линия)
setMode('line');

// События рисование мышью
canvas.mousedown((event) => brush.start(event));
canvas.mousemove((event) => brush.update(event));
canvas.mouseup((event) => brush.end(event));
canvas.mouseout((event) => brush.end(event));

// Очистка по нажатию на крестик
buttonClear.click(() => bresCanvas.clear());

// Смена режима рисования по нажатию на кнопки внизу
buttonLine.click(() => setMode('line'));
buttonCircle.click(() => setMode('circle'));

// Устанавливает режим рисования
function setMode(_mode) {
    mode = _mode;
    let [on, off] = mode == 'line' ? [buttonLine, buttonCircle] : [buttonCircle, buttonLine];
    on.addClass('active');
    off.removeClass('active');
    brush.setType(mode);
}
