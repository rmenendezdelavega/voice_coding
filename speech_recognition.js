var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

var diagnosticPara = document.querySelector('.output');
var testBtn = document.querySelector('button');

function startSpeechRecognition() {
  testBtn.disabled = true;
  testBtn.textContent = 'Test in progress';

  var recognition = new SpeechRecognition();

  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function(event) {
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object
    var speechResult = event.results[0][0].transcript.toLowerCase();
    console.log(speechResult)

    speechRecognitionProcessing(speechResult)
  }

  recognition.onspeechend = function() { // when speech recognised by the speech recognition service has stopped being detected
    recognition.stop();
    testBtn.disabled = false;
    testBtn.textContent = 'START NEW SPEECH RECOGNITION';
  }

  recognition.onerror = function(event) { // when a speech recognition error occurs
    testBtn.disabled = false;
    testBtn.textContent = 'START NEW SPEECH RECOGNITION';
    alert('Error occurred in recognition: ' + event.error);
  }
}

testBtn.addEventListener('click', startSpeechRecognition);
