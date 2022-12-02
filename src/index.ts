import { TimbreSpace } from "./TimbreSpace";
import { initializeAudio, bindInitializeAudio } from "./audioContext";

const DEFAULT_AUDIO = "assets/bass.wav";

const foo = (audioContext : AudioContext) => {
    console.log("YOOOO");
    const audioElem = document.getElementById("audio");
    const source = audioContext.createMediaElementSource(audioElem);
    console.log("Got foo audio ctx", audioContext, "SR", audioContext.sampleRate, "SOURCE", source);
    source.connect(audioContext.destination);
}

function App() {

    bindInitializeAudio(foo, document, 'click');

    const timbreSpace = new TimbreSpace(
        window.innerWidth, window.innerHeight,
        false, document,
        DEFAULT_AUDIO
    );
    timbreSpace.init();
    const canvas = timbreSpace.getDOMElement() as HTMLCanvasElement;
    document.getElementById("root")?.appendChild(canvas);
    timbreSpace.start();
}

App();
