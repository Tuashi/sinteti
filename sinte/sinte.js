let contextoAudio = new (window.AudioContext || window.webkitAudioContext)();

let osc1 = null;
let osc2 = null;

let freq1Slider = document.getElementById("frecuencia1");
let freq2Slider = document.getElementById("frecuencia2");
let freq1Span = document.getElementById("valorFrecuencia1");
let freq2Span = document.getElementById("valorFrecuencia2");

freq1Slider.addEventListener("input", () => {
  freq1Span.textContent = `${freq1Slider.value} Hz`;
  if (osc1) {
    osc1.frequency.setValueAtTime(freq1Slider.value, contextoAudio.currentTime);
  }
});

freq2Slider.addEventListener("input", () => {
  freq2Span.textContent = `${freq2Slider.value} Hz`;
  if (osc2) {
    osc2.frequency.setValueAtTime(freq2Slider.value, contextoAudio.currentTime);
  }
});

let tipo1Select = document.getElementById("tipo1");
let tipo2Select = document.getElementById("tipo2");

document.getElementById("iniciar1").addEventListener("click", () => {
  detenerOsc1();
  osc1 = contextoAudio.createOscillator();
  osc1.type = tipo1Select.value;
  osc1.frequency.setValueAtTime(freq1Slider.value, contextoAudio.currentTime);
  osc1.connect(contextoAudio.destination);
  osc1.start();
});

document.getElementById("iniciar2").addEventListener("click", () => {
  detenerOsc2();
  osc2 = contextoAudio.createOscillator();
  osc2.type = tipo2Select.value;
  osc2.frequency.setValueAtTime(freq2Slider.value, contextoAudio.currentTime);
  osc2.connect(contextoAudio.destination);
  osc2.start();
});

document.getElementById("sumar").addEventListener("click", () => {
  detenerTodo();

  osc1 = contextoAudio.createOscillator();
  osc2 = contextoAudio.createOscillator();

  osc1.type = tipo1Select.value;
  osc2.type = tipo2Select.value;

  osc1.frequency.setValueAtTime(freq1Slider.value, contextoAudio.currentTime);
  osc2.frequency.setValueAtTime(freq2Slider.value, contextoAudio.currentTime);

  osc1.connect(contextoAudio.destination);
  osc2.connect(contextoAudio.destination);

  osc1.start();
  osc2.start();
});

document.getElementById("detener").addEventListener("click", detenerTodo);

function detenerOsc1() {
  if (osc1) {
    osc1.stop();
    osc1.disconnect();
    osc1 = null;
  }
}

function detenerOsc2() {
  if (osc2) {
    osc2.stop();
    osc2.disconnect();
    osc2 = null;
  }
}

function detenerTodo() {
  detenerOsc1();
  detenerOsc2();
}

let ruidoFuente = null;

function crearFiltroPasoBanda() {
  const filtro = contextoAudio.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 550; // frecuencia central
  filtro.Q.value = 0.5; // ancho de banda
  return filtro;
}

function reproducirRuido(tipo) {
  detenerRuido();

  const bufferSize = 2 * contextoAudio.sampleRate;
  const buffer = contextoAudio.createBuffer(1, bufferSize, contextoAudio.sampleRate);
  const datos = buffer.getChannelData(0);

  if (tipo === "blanco") {
    for (let i = 0; i < bufferSize; i++) {
      datos[i] = Math.random() * 2 - 1;
    }
  } else if (tipo === "rosa") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const blanco = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + blanco * 0.0555179;
      b1 = 0.99332 * b1 + blanco * 0.0750759;
      b2 = 0.96900 * b2 + blanco * 0.1538520;
      b3 = 0.86650 * b3 + blanco * 0.3104856;
      b4 = 0.55000 * b4 + blanco * 0.5329522;
      b5 = -0.7616 * b5 - blanco * 0.0168980;
      datos[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362;
      datos[i] *= 0.11;
      b6 = blanco * 0.115926;
    }
  }

  ruidoFuente = contextoAudio.createBufferSource();
  ruidoFuente.buffer = buffer;
  ruidoFuente.loop = true;

  const filtro = crearFiltroPasoBanda();
  ruidoFuente.connect(filtro).connect(contextoAudio.destination);
  ruidoFuente.start();
}

function detenerRuido() {
  if (ruidoFuente) {
    ruidoFuente.stop();
    ruidoFuente.disconnect();
    ruidoFuente = null;
  }
}

document.getElementById("ruidoBlanco").addEventListener("click", () => {
  reproducirRuido("blanco");
});

document.getElementById("ruidoRosa").addEventListener("click", () => {
  reproducirRuido("rosa");
});

document.getElementById("detenerRuido").addEventListener("click", detenerRuido);

//
//
// 🎹 Piano virtual: teclas controladas por el teclado
//
const teclaNotas = {
  'a': 1.0,    // C4
  'w': 1.059,  // C#4
  's': 1.122,  // D4
  'e': 1.189,  // D#4
  'd': 1.26,   // E4
  'f': 1.335,  // F4
  't': 1.414,  // F#4
  'g': 1.498,  // G4
  'y': 1.587,  // G#4
  'h': 1.682,  // A4
  'u': 1.781,  // A#4
  'j': 1.887,  // B4
  'o': 2.0,    // C5
  'k': 2.122   // C#5
};

document.addEventListener("keydown", (event) => {
  const tecla = event.key.toLowerCase();
  if (teclaNotas[tecla]) {
    reproducirNotaDesdeBase(teclaNotas[tecla]);
    resaltarVisual(tecla);
  }
});

function reproducirNotaDesdeBase(factor) {
  const baseFreq = parseFloat(freq1Slider.value); // Frecuencia base del slider 1
  const freq = baseFreq * factor;

  const osc1Temp = contextoAudio.createOscillator();
  const osc2Temp = contextoAudio.createOscillator();
  const gainNode = contextoAudio.createGain();

  osc1Temp.type = tipo1Select.value;
  osc2Temp.type = tipo2Select.value;

  osc1Temp.frequency.setValueAtTime(freq, contextoAudio.currentTime);
  osc2Temp.frequency.setValueAtTime(freq, contextoAudio.currentTime);

  osc1Temp.connect(gainNode);
  osc2Temp.connect(gainNode);
  gainNode.connect(contextoAudio.destination);

  gainNode.gain.setValueAtTime(1, contextoAudio.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 1);

  osc1Temp.start();
  osc2Temp.start();
  osc1Temp.stop(contextoAudio.currentTime + 1);
  osc2Temp.stop(contextoAudio.currentTime + 1);
}

function resaltarVisual(tecla) {
  const div = document.querySelector(`.key[data-key="${tecla}"]`);
  if (div) {
    div.classList.add("active");
    setTimeout(() => div.classList.remove("active"), 150);
  }
}
