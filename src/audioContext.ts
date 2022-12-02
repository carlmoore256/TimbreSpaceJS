var audioInitialized = false;

function audioContextHandler() {
    const audioContext = new AudioContext();
    if (audioContext.state == "suspended") audioContext.resume();
    return audioContext;
}

export function bindInitializeAudio(
        callback : (audioContext : AudioContext) => void,
        bindTo : HTMLElement | any,
        event : string = 'click') 
{
    bindTo.addEventListener(event, function handler() {
        const status = initializeAudio(callback);
        console.log("YO GOT AUDIO CONTEXT", status);
        if (!status) {
            this.removeEventListener('click', handler);
        } else {
            console.log("Initialized audio ctx", status);
        }
    })

}

/** Passes an audio context to a callback, returns true if started, false if already started */
export function initializeAudio(callback : (audioContext : AudioContext) => void) {
    if (audioInitialized = true) {
        console.log("Audio already initialized")
        return false;
    }
    const audioContext = audioContextHandler();    
    // const audioElem = document.getElementById("audio");
    // const source = audioContext.createMediaElementSource(audioElem);
    // source.connect(audioContext.destination);
    // window.audioContext = audioContext;
    // window.source = source;
    callback(audioContext);
    audioInitialized = true;
    return true;
}


// document.addEventListener('click', function handler() {
//     const audioContext = initializeAudio(foo);
//     if (!audioContext) {
//         this.removeEventListener('click', handler);
//     } else {
//         console.log("Initialized audio ctx", audioContext);
//     }
// })