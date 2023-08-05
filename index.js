let metronomeIsRun = false;

document.getElementById('start').onclick = e => {
    if (!metronomeIsRun) {
        metronomeIsRun = true;
        e.target.textContent = 'Stop';
        runMetronome();
        runRhythm();
    } else {
        metronomeIsRun = false;
        e.target.textContent = 'Start';
    }
};

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
    if (metronomeIsRun) setTimeout(runMetronome, 60 * 1000 / (+document.getElementById('BPM').value ?? 120) );
}

async function runRhythm() {
    let durationOf4 = 60 * 1000 / (+document.getElementById('BPM').value ?? 120);
    let durationOf8 = durationOf4 / 2;
    let durationOf16 = durationOf8 / 2;
    const noteDurationMap = {
        '.': durationOf8,
        '0': durationOf8,
        '1': durationOf8,
        '2': durationOf8,
        '⁰': durationOf16,
        '¹': durationOf16,
        '²': durationOf16
    };
    //const notes = Array.prototype.map.call(rhythm.value, note => noteDurationMap[note]);
    const notes = rhythm.value;
    
    for (const note of notes) {
        if (!metronomeIsRun) break;
        const duration = noteDurationMap[note];
        if (!duration) continue;

        if (!['.', '0', '⁰'].includes(note)) 
            beep(440);

        await new Promise(res => setTimeout(res, duration));
    }

    if (isLooped.checked === true && metronomeIsRun) runRhythm();
}

//document.addEventListener('keydown', event => {});
//⁰²⁰²|12⁰¹⁰²|¹²⁰¹
//1.21|.2²¹.|1⁰².2|.2¹².|1⁰².2|1⁰².2|1.21|.2..