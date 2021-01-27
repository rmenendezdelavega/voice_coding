// this function just allows to test the input by keyboard instead of speech recognition
function newTextInput(){
  var inputText = prompt("Enter the new text input")
  //var input = nlp(inputText)
  input_statement(inputText)
}

// this function takes a string (the result of the speech recognition) and shows it to the user
// if the user accepts the result, this function calls input_statement(result)
// if not, this function asks the user for the input he/she wants to process
function speechRecognitionProcessing(result){
  var resultValid = window.confirm("The speech recognition result is:\n\n" + result + "\n\nPress 'Aceptar' if you want to continue with it or 'Cancelar' in case you prefer to change it.");

  if (resultValid) {
    input_statement(result)
  }
  else {
    var inputText = prompt("You decided to change the result of the speech recognition:\n\n" + result + "\n\nWrite down what you want as the input text.")
    input_statement(inputText)
  }
}
