let metronomeIsRun = false;
let readerCursorIndex = 0;
let bpm = 120;
let readerIsFocused = false;

startButton.onclick = toggleStart;

function toggleStart() {
    if (!metronomeIsRun) {
        metronomeIsRun = true;
        startButton.textContent = 'Stop'; //Если курсор в конце ритма(ритм только написан или вставлен)
        readerCursorIndex = rhythm.value.length === rhythm.selectionStart ? 0 : rhythm.selectionStart;
        runRhythm();
    } else {
        metronomeIsRun = false;
        startButton.textContent = 'Start';
    }
}

/* 

добавить смену темпа при смещении курсора вне блока с другим темпом

исправлен баг со скобкой
добавлено смена темпа на лету(120), 
Если указано однозначное число:
1) 0 вернёт в изначальный темп, 1 - предыдущий
3 перейти в темп соответствующий триолям, 5 - квинтоли 6 - секстолям
xN умножить темп на число 2 4 .5
генератор случайных ритмов
*/

genRandomRhythm.onclick = () => {
    const notes = ['.', '1', '2', '⁰', '¹'];
    rhythm.value = Array.from(' '.repeat(getRandomInt(16, 32))).map(() => notes[getRandomInt(0, 4)]).join('');
}

reset.onclick = () => 
    readerCursorIndex = 0;

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
    if (['#','№'].includes(event.data)) replace = '³';

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

function runMetronome() {
    beep(880);
    if (metronomeIsRun) setTimeout(runMetronome, 60 * 1000 / bpm);
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

async function runRhythm() {
    let noteDurationMap = calculateDurations(bpm);
    
    let prevNote = rhythm.value[readerCursorIndex - 1];

    //клик метронома для стартовой позиции и только пройденных тактовых черт
    if ([undefined, '|', '\n'].includes(prevNote))  
        beep(880);

    for (; rhythm.value[readerCursorIndex] && metronomeIsRun; readerCursorIndex++) {
        const note = rhythm.value[readerCursorIndex];

        //Смена темпа
        if (note === '(') { 
            const endExpressionIndex = rhythm.value.indexOf(')', readerCursorIndex);
            if (endExpressionIndex === -1) continue;

            const value = rhythm.value.slice(readerCursorIndex + 1, endExpressionIndex);
            
            if (value.length === 1 && +value) {
                if (value === '1' || value === '0') bpm = +BPM.value;
                else bpm *= value / 2;
            } else if (['x','X','х','Х'].includes(value[0])) {
                const val = value.slice(1, value.length);
                if (+val) bpm *= val;
            } else if (value.length > 1 && +value) 
                bpm = +value;
            
            readerCursorIndex = endExpressionIndex;
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
    if (metronomeIsRun) {
        bpm = +BPM.value;

        if (isLooped.checked === true) {
            readerCursorIndex = 0;
            runRhythm();
        } else { // остановить
            rhythm.selectionStart = rhythm.selectionEnd = rhythm.value.length;
            toggleStart();
        }  
    }
}

document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !readerIsFocused) {
        event.preventDefault();
        toggleStart();
    }
});
//1.21|.2¹².|1⁰².1|.2¹².|1⁰².2|1⁰².2|1.21|.2..
//⁰²⁰²|12⁰¹⁰²|¹²⁰¹
//1⁰¹11|⁰²21.|¹²¹²12|⁰²212
//122|122|¹²¹²¹²|122 6/8
//333|1212|.. триолиz
//1212|(3)122122(1)|1212|1212

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}