let metronomeIsRun = false;
let readerCursorIndex = 0;
let bpm = 120;
let readerIsFocused = false;

document.getElementById('start').onclick = e => {
    if (!metronomeIsRun) {
        metronomeIsRun = true;
        e.target.textContent = 'Stop';
        readerCursorIndex = rhythm.selectionStart;
        runRhythm(true);
    } else {
        metronomeIsRun = false;
        e.target.textContent = 'Start';
    }
};

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

/*rhythm.onmouseleave = () => {
    if (readerIsFocused) 
        readerIsFocused = false;
}*/

rhythm.oninput = event => {
    if (event.data === null) return;
    let replace = '';
    if (['@','"'].includes(event.data)) replace = '²';
    if ('!' === event.data) replace = '¹';
    if (')' === event.data) replace = '⁰';

    if (replace)
        event.target.value = event.target.value.substr(0, event.target.value.length - 1) + replace;
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

async function runRhythm(isManualStart) {
    let durationOf4 = 60 * 1000 / bpm;
    let durationOf8 = durationOf4 / 2;
    let durationOf16 = durationOf8 / 2;
    const noteDurationMap = {
        '.': durationOf8,
        '0': durationOf8,
        '1': durationOf8,
        '2': durationOf8,
        '⁰': durationOf16,
        '¹': durationOf16,
        '²': durationOf16,
        '|': 0, //metronome
        '\n': 0
    };

    /* if (isManualStart) 
     let note = rhythm.value[readerCursorIndex];
    if (isManualStart && !['|', '\n'].includes(note)) //начать метроном
    */
    
    for (; rhythm.value[readerCursorIndex] && metronomeIsRun; readerCursorIndex++) {
        const note = rhythm.value[readerCursorIndex];

        const duration = noteDurationMap[note];
        if (duration === void 0) continue;

        if (!readerIsFocused) {
            rhythm.focus(); 
            rhythm.selectionStart = rhythm.selectionEnd = readerCursorIndex;
        }

        if (note === '|' || note === '\n') 
            beep(880);
        else if (!['.', '0', '⁰'].includes(note)) 
            beep(440);

        await new Promise(res => setTimeout(res, duration));
    }

    if (isLooped.checked === true && metronomeIsRun) {
        readerCursorIndex = 0;
        runRhythm();
    };
}

//document.addEventListener('keydown', event => {});
//⁰²⁰²|12⁰¹⁰²|¹²⁰¹
//1.21|.2²¹.|1⁰².2|.2¹².|1⁰².2|1⁰².2|1.21|.2..
//rhythm.focus(); rhythm.selectionStart = rhythm.selectionEnd = 4; установит позицию курсора на 4