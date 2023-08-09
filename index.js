let readerIsRun = false;
let recordIsRun = false;
let readerCursorIndex = 0;
let bpm = 120;
let readerIsFocused = false;
let intervalId = null;
startButton.onclick = readerToggle;
let clickedToTime = 0;
let bindedRecordClickHandler = () => {}

function readerToggle() {
    if (!readerIsRun) {
        if (recordIsRun) recordToggle();
        readerIsRun = true;
        startButton.textContent = '⏸'; //Если курсор в конце ритма(ритм только написан или вставлен)
        readerCursorIndex = rhythm.value.length === rhythm.selectionStart ? 0 : rhythm.selectionStart;
        runRhythm();
    } else {
        readerIsRun = false;
        startButton.textContent = '▶';
    }
}

/* 
TODO 
кнопка разложить/свернуть
кнопка расставить тактовые черты согласно указанному пользователем размеру
стиль сокращения нет/все/letry

добавлено 
кнопка запись ритма

чтобы ввести 0 нажмите 'o' или 'щ'
смена темпа на лету(120), 
Если указано однозначное число:
1) 0 или 1 вернёт в изначальный темп
3 перейти в темп соответствующий триолям, 5 - квинтоли 6 - секстолям
xN умножить темп на число 2 4 .5
*/

const recordClickHandler = durationOf8 => {
    //длительность удержания 16я нота для квантайза клика
    clickedToTime = performance.now() + durationOf8 / 2;
}

record.onclick = recordToggle;

function recordToggle() {
    if (!recordIsRun) {
        const sizeValue = +size.value || 4;
        let countDown = sizeValue;
        if (!+countDown) return;

        if (readerIsRun) readerToggle();
        recordIsRun = true;
        record.textContent = '■';
        const durationOf8 = calculateDurations(+BPM.value)[1];

        beep(880); //Обратный отсчёт
        
        intervalId = setInterval(() => {
            if (--countDown === 0) { 
                //Запускаем таймер записи. Первый такт
                clearInterval(intervalId);
                if (metronome.checked) beep(880);
                rhythm.value += '|'; 
                countDown = sizeValue * 2;

                document.addEventListener('mousedown', bindedRecordClickHandler = recordClickHandler.bind(null, durationOf8));
                if (keyUpReaction.checked) document.addEventListener('mouseup', bindedRecordClickHandler = recordClickHandler.bind(null, durationOf8));

                intervalId = setInterval(() => {
                    const now = performance.now();
                    if (now < clickedToTime) rhythm.value += '¹';
                    else {
                        if (reduce.checked) {
                            const last = rhythm.value[rhythm.value.length - 1];
                            if (last === '¹') rhythm.setRangeText('1', rhythm.value.length - 1,  rhythm.value.length, 'end');
                            else if (last === '⁰') rhythm.setRangeText('.', rhythm.value.length - 1,  rhythm.value.length, 'end');
                            else rhythm.value += '⁰';
                        } else {
                            rhythm.value += '⁰';
                        }
                    }

                    if (!--countDown) {
                        if (metronome.checked) beep(880);
                        countDown = sizeValue * 2;
                        rhythm.value += '|'; 
                    } else if (countDown === sizeValue && metronome.checked) 
                        beep(880);

                }, durationOf8 / 2);

            } else beep(880);
        }, durationOf8 * 2);


    } else {
        document.removeEventListener('mousedown', bindedRecordClickHandler);
        document.removeEventListener('mouseup', bindedRecordClickHandler);
        clearInterval(intervalId);
        recordIsRun = false;
        record.textContent = '⏺';
    }
}

genRandomRhythm.onclick = () => {
    const notes = ['.', '1', '2', '⁰', '¹'];
    rhythm.value = Array.from(' '.repeat(getRandomInt(16, 32))).map(() => notes[getRandomInt(0, 4)]).join('');
}

reset.onclick = () => {
    rhythm.value = '';
    readerCursorIndex = 0;
}

BPM.onchange = event => 
    bpm = +event.target.value ?? 120;

rhythm.onclick = () => {
    if (readerIsFocused) return;
    readerIsFocused = true;
}

rhythm.onblur = () => {
    if (readerIsFocused) 
        readerIsFocused = false;
}

rhythm.oninput = event => {
    if (event.data === null) return;
    let replace = '';
    if (['@','"'].includes(event.data)) replace = '²';
    if ('!' === event.data) replace = '¹';
    if ('0' === event.data) replace = '⁰';
    if (['o','щ'].includes(event.data)) replace = '0';

    if (replace) 
        rhythm.setRangeText(
            replace, 
            rhythm.selectionStart - 1, 
            rhythm.selectionStart, "end"
        );
}

function beep(frequency) {
    let ctx = new AudioContext();
    let osc = ctx.createOscillator();
    osc.frequency.value = frequency;
    osc.connect(ctx.destination);
    osc.start(0);
    setTimeout(() => osc.stop(), 100);
}

function calculateDurations(bpm) {
    let durationOf4 = 60 * 1000 / bpm;
    let durationOf8 = durationOf4 / 2;
    let durationOf16 = durationOf8 / 2;

    return {
        '.': durationOf8, // восьмая пауза
        '0': durationOf8, // восьмая пауза
        '1': durationOf8, // восьмая с акцентом
        '2': durationOf8, // восьмая
        '⁰': durationOf16, // шестнадцатая пауза
        '¹': durationOf16, // шестнадцатая с акцентом
        '²': durationOf16, // шестнадцатая
        '|': 0, //metronome
        '\n': 0
    };
}

function calculateBpm(expression, bpm) { //expression 0,1,2 same effect
    if (expression.length === 1 && +expression) {
        if (expression === '1' || expression === '0') bpm = +BPM.value; // установит стартовый bpm
        else bpm *= expression / 2; // установит bpm для нестандартного деления такта(триоли, квинтоли...)
    } else if (['x','X','х','Х'].includes(expression[0])) {
        const val = expression.slice(1, expression.length);
        if (+val) bpm *= val; // установит указанный множитель bpm
    } else if (expression.length > 1 && +expression) 
        bpm = +expression; // установит указанный bpm
    return bpm;
}

// Вернёт -1 если скобка выражения не закрыта/открыта
function readExpression(fromIndex, toLeft) {
    let [fromSymbol, toSymbol] = toLeft ? [')', '('] : ['(', ')'];
    const method = `${toLeft ? 'lastI' : 'i'}ndexOf`;

    let from = rhythm.value[method](fromSymbol, fromIndex);
    if (from === -1) return -1;
    let to = rhythm.value[method](toSymbol, from);
    if (to === -1) return -1;
    if (from > to) [from, to] = [to, from];

    return {to, value: rhythm.value.slice(++from, to)};
}

async function runRhythm() {
    let prevNote = rhythm.value[readerCursorIndex - 1];

    //клик метронома для стартовой позиции и только пройденных тактовых черт
    if ([undefined, '|', '\n'].includes(prevNote))  
        beep(880);

    //каждый запуск проверяет в каком блоке темпа находится курсор
    const result = readExpression(readerCursorIndex, true);
    bpm = calculateBpm(result.value ?? '0', +BPM.value);
    let noteDurationMap = calculateDurations(bpm);

    for (; rhythm.value[readerCursorIndex] && readerIsRun; readerCursorIndex++) {
        const note = rhythm.value[readerCursorIndex];

        //Смена темпа
        if (note === '(') {
            const result = readExpression(readerCursorIndex);
            if (result === -1) continue;
            bpm = calculateBpm(result.value, +BPM.value);
            readerCursorIndex = result.to;
            noteDurationMap = calculateDurations(bpm);
            continue;
        }

        const duration = noteDurationMap[note];

        if (duration === void 0) continue; //пропускаем неизвестные символы

        if (!readerIsFocused) { //Если пользователь не редактирует содержимое - передвинуть курсор
            rhythm.focus(); 
            rhythm.selectionStart = rhythm.selectionEnd = readerCursorIndex;
        }

        if (note === '|' || note === '\n') 
            beep(880);
        else if (note === '1' || note === '¹') {
            beep(587.32);
        } else if (!['.', '0', '⁰'].includes(note)) 
            beep(440);

        await new Promise(res => setTimeout(res, duration));
    }

    //Конец воспроизведения(пользователь не нажимал стоп)
    if (readerIsRun) {
        if (isLooped.checked === true) {
            readerCursorIndex = 0;
            runRhythm();
        } else { // перенести курсор на край поля ввода и остановить
            rhythm.selectionStart = rhythm.selectionEnd = rhythm.value.length;
            readerToggle();
        }  
    }
}

document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !readerIsFocused) {
        event.preventDefault();
        readerToggle();
    }
});
//ритмы
//1.21|.2¹².|1⁰².1|.2¹².|1⁰².2|1⁰².2|1.21|.2..
//⁰²⁰²|12⁰¹⁰²|¹²⁰¹
//1⁰¹11|⁰²21.|¹²¹²12|⁰²212
//122|122|¹²¹²¹²|122 6/8
//333|1212|.. триоли
//1212|(3)122122(1)|1212|1212
/*
1.21|.2¹².|1⁰².1|.2¹².|
(x0.5)1⁰².2|1⁰².2|1.21|.2..
(3)122122|(1)1212
1212|1.21
*/

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}