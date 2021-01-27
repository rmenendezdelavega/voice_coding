nlp.extend(compromiseNumbers);

function input_statement(inputText){
  // any input firstly is tried to set as an instruction_statement
  // if it is not possible, it tries to set it as an operation_statement
  // and if it is not possible either, it tries to set it as a value_statement
  var newInstruction = instruction_statement(inputText)
  if (newInstruction == false) {
    var newBlock = operation_statement(inputText)
    if (newBlock == 0) { // case that none operation_statement is recognised
      var operationBlock = value_statement(nlp(inputText).text())
      return operationBlock
    }
    return newBlock
  }
}

function instruction_statement(inputText){
  var instruction = findInstruction(inputText)
  var done = false // this variable is created to set if there has been any instruction done or not
  if (instruction != null) {
    done = true
    window[instruction]() // this calls the function whose name is equal to instruction
  }
  return done
}

function operation_statement(inputText){
  var input = nlp(inputText)
  var operation = findOperation(input.firstTerms().text())
  if (operation[0] != null){
    var operationBlock = window[operation[0]](input, operation[1])
  }
  else {
    var operationBlock = 0
  }
  return operationBlock
}

function value_statement(inputText){
  var value = nlp(inputText) // this is necessary in order to treat the text with compromise
  // this is necessary in order to change a number in text format into digits, avoiding that the word "and", which could appear in some numbers, would be detected as a logic_operation
  value.numbers().toNumber()
  // now this try to find if there is already a variable called as inputText with find_variable() function
  // in that case, the value will be that variable
  var valueSet = false
  var foundVariable = find_variable(value.text())
  if(foundVariable != null){
    valueBlock = addBlock('variables_get');
    valueBlock.setFieldValue(foundVariable.getId(), 'VAR')
    valueSet = true;
  }
  // if there isn't any variable with that name, valueSet will be false
  // so now it will try to set the adequate value
  // this case in in which the input is exactly one number
  if(value.text() == value.numbers().text() && value.numbers().toNumber().wordCount() < 2){
    value = parseInt(value.numbers().toNumber().text());
    var valueBlock = math_number(value);
    valueSet = true;
  }
  // now, it tries to find any coincidence in the dictionary and calls the function that corresponds to the coincidence found
  if (valueSet == false){
    var textToFind = nlp(value.text()) // this other variable is necessary because the findCoincidence function changes the value passed as argument
    // don't know why I have to write textToFind = nlp(value.text()) and simply textToFind = value doesn't work
    var coincidence = findCoincidence(textToFind)
    if (coincidence[0] != null){
      var valueBlock = window[coincidence[0]](value, coincidence[1])
      // with this it calls the function whose name is equal to coincidence[0] passing value as the argument
      // and also the coincidence[1], which is the word found (not the keyWord, that is coincidence[0]) that would be used just in some functions
    }
    // if it is not recognised as one of the previous possibilities, it is set as a string
    else{
      var valueBlock = text(value)
    }
  }
  return valueBlock
}

function set_statement(input, keyWord){
  var variablesSetBlock = addBlock('variables_set')
  var valueField = variablesSetBlock.getInput('VALUE').connection

  if (keyWord == 'set' | keyWord == 'initialize') {
    var foundVariable = find_variable(input.after(keyWord).before('to').text())

    if (foundVariable == null){
      addVariable(input.after(keyWord).before('to').text())
      foundVariable = workspace.getVariable(input.after(keyWord).before('to').text())
    }
  }
  else if (keyWord == 'create') {
    var foundVariable = find_variable(input.after('variable').before('equal').text())

    if (foundVariable == null){
      addVariable(input.after('variable').before('equal').text())
      foundVariable = workspace.getVariable(input.after('variable').before('equal').text())
    }
  }

  variablesSetBlock.setFieldValue(foundVariable.getId(), 'VAR')

  var valueBlock = value_statement(input.after('to').text())

  if (valueBlock == null){
    alert('The value you are trying to set does not exist. Please try again')
    return 0
  }
  else if (valueBlock == 0) { // if valueBlock is 0 that means that value_statement returned 0, which means there was an error
    alert("Please, try to create again just this block and drag it to its correct place")
  }
  else{
    var valueBlockOutput = valueBlock.outputConnection;
    valueField.connect(valueBlockOutput);
    return variablesSetBlock
  }
}

function if_statement(input){
  var nelse = input.match('else').wordCount()
  var nthen = input.match('then').wordCount()

  var condition0Block = value_statement(input.after('if').before('then').text())
  var condition0BlockOutput = condition0Block.outputConnection

  var ifBlock = addBlock('controls_if')
  var condition0Field = ifBlock.getInput('IF0').connection
  var do0Field = ifBlock.getInput('DO0').connection

  if (condition0BlockOutput.checkType(condition0Field)) {
    if (nelse == 0) { // this means the sentence is: if ... then ...
      var do0Block = operation_statement(input.after('then').text())
      var do0BlockOutput = do0Block.previousConnection
      if (do0Block == 0) { // if do0Block is 0 that means that operation_statement returned 0, which means there was an error
        alert("The block for the 'DO' operation recognised as '" + input.after('then').text() + "' has not been created due to an error. Please, try to create just this block and drag it to its correct place")
        condition0Field.connect(condition0BlockOutput)
      }
      else {
      condition0Field.connect(condition0BlockOutput)
      do0Field.connect(do0BlockOutput)
      }
      return ifBlock
    }
    else if (nelse == 1) {
      if (nthen == 1){ // this means the sentence is: if ... then ... else ...
        ifBlock.domToMutation(Blockly.Xml.textToDom('<xml><mutation else="1"/></xml>').firstChild);
        var elseField = ifBlock.getInput('ELSE').connection

        var do0Block = operation_statement(input.after('then').before('else').text())
        var do0BlockOutput = do0Block.previousConnection
        var elseBlock = operation_statement(input.after('else').text())
        var elseBlockOutput = elseBlock.previousConnection
        if (do0Block == 0) { // if do0Block is 0 that means that operation_statement returned 0, which means there was an error
          alert("The block for the 'DO' operation recognised as '" + input.after('then').before('else').text() + "' has not been created due to an error. Please, try to create just this block and drag it to its correct place")
          condition0Field.connect(condition0BlockOutput)
          elseField.connect(elseBlockOutput)
        }
        else if (elseBlock == 0) { // if elseBlock is 0 that means that operation_statement returned 0, which means there was an error
          alert("The block for the 'ELSE' operation recognised as '" + input.after('else').text() + "' has not been created due to an error. Please, try to create just this block and drag it to its correct place")
          condition0Field.connect(condition0BlockOutput)
          do0Field.connect(do0BlockOutput)
        }
        else{
          condition0Field.connect(condition0BlockOutput)
          do0Field.connect(do0BlockOutput)
          elseField.connect(elseBlockOutput)
        }
        return ifBlock
      }
      else if (nthen == 2) { // this means the sentence is: if ... then ... else if ... then ...
        ifBlock.domToMutation(Blockly.Xml.textToDom('<xml><mutation elseif="1"/></xml>').firstChild);
        var condition1Field = ifBlock.getInput('IF1').connection
        var do1Field = ifBlock.getInput('DO1').connection

        var do0Block = operation_statement(input.after('then').before('else').text())
        var do0BlockOutput = do0Block.previousConnection
        input.before('else').delete()
        var condition1Block = value_statement(input.after('if').before('then').text())
        var condition1BlockOutput = condition1Block.outputConnection
        var do1Block = operation_statement(input.after('then').text())
        var do1BlockOutput = do1Block.previousConnection

        if (condition1BlockOutput.checkType(condition1Field)) {
          if (do0Block == 0) {
            alert("The block for the first 'DO' operation has not been created due to an error. Please, try again to create just this block and drag it to its correct place")
            condition0Field.connect(condition0BlockOutput)
            condition1Field.connect(condition1BlockOutput)
            do1Field.connect(do1BlockOutput)
          }
          else if (do1Block == 0) {
            alert("The block for the second 'DO' operation has not been created due to an error. Please, try again to create just this block and drag it to its correct place")
            condition0Field.connect(condition0BlockOutput)
            do0Field.connect(do0BlockOutput)
            condition1Field.connect(condition1BlockOutput)
          }
          else {
            condition0Field.connect(condition0BlockOutput)
            do0Field.connect(do0BlockOutput)
            condition1Field.connect(condition1BlockOutput)
            do1Field.connect(do1BlockOutput)
          }
          return ifBlock
        }
        else {
          alert("Something about the if_statement syntaxis went wrong. Please check and retry")

          workspace.getBlockById(do0Block.id).dispose()
          workspace.getBlockById(do1Block.id).dispose()
          workspace.getBlockById(condition0Block.id).dispose()
          workspace.getBlockById(condition1Block.id).dispose()
          workspace.getBlockById(ifBlock.id).dispose()
          return 0
        }
      }
    }
    else if (nelse == 2) { // this means the sentence is: if ... then ... else if ... then ... else ...
      ifBlock.domToMutation(Blockly.Xml.textToDom('<xml><mutation elseif="1" else="1"/></xml>').firstChild);
      var condition1Field = ifBlock.getInput('IF1').connection
      var do1Field = ifBlock.getInput('DO1').connection
      var elseField = ifBlock.getInput('ELSE').connection

      var do0Block = operation_statement(input.after('then').before('else').text())
      var do0BlockOutput = do0Block.previousConnection
      input.before('else').delete()
      var condition1Block = value_statement(input.after('if').before('then').text())
      var condition1BlockOutput = condition1Block.outputConnection
      var do1Block = operation_statement(input.after('then').before('else').text())
      var do1BlockOutput = do1Block.previousConnection
      input.before('then').delete()
      var elseBlock = operation_statement(input.after('else').text())
      var elseBlockOutput = elseBlock.previousConnection

      if (condition1BlockOutput.checkType(condition1Field)) {
        if (do0Block == 0) {
          alert("The block for the first 'DO' operation has not been created due to an error. Please, try again to create just this block and drag it to its correct place")

          condition0Field.connect(condition0BlockOutput)
          condition1Field.connect(condition1BlockOutput)
          do1Field.connect(do1BlockOutput)
          elseField.connect(elseBlockOutput)
        }
        else if (do1Block == 0) {
          alert("The block for the second 'DO' operation has not been created due to an error. Please, try again to create just this block and drag it to its correct place")

          condition0Field.connect(condition0BlockOutput)
          do0Field.connect(do0BlockOutput)
          condition1Field.connect(condition1BlockOutput)
          elseField.connect(elseBlockOutput)
        }
        else if (elseBlock == 0) {
          alert("The block for the 'ELSE' operation has not been created due to an error. Please, try again to create just this block and drag it to its correct place")

          condition0Field.connect(condition0BlockOutput)
          do0Field.connect(do0BlockOutput)
          condition1Field.connect(condition1BlockOutput)
          do1Field.connect(do1BlockOutput)
        }
        else {
          condition0Field.connect(condition0BlockOutput)
          do0Field.connect(do0BlockOutput)
          condition1Field.connect(condition1BlockOutput)
          do1Field.connect(do1BlockOutput)
          elseField.connect(elseBlockOutput)
        }
        return ifBlock
      }
      else {
        alert("Something about the if_statement syntaxis went wrong. Please check and retry")

        workspace.getBlockById(do0Block.id).dispose()
        workspace.getBlockById(do1Block.id).dispose()
        workspace.getBlockById(condition0Block.id).dispose()
        workspace.getBlockById(condition1Block.id).dispose()
        workspace.getBlockById(elseBlock.id).dispose()
        workspace.getBlockById(ifBlock.id).dispose()
        return 0
      }
    }
    else { // in this case the syntaxis is not correct
      alert("Something about the if_statement syntaxis went wrong. Please check and retry")
      workspace.getBlockById(condition0Block.id).dispose()
      workspace.getBlockById(ifBlock.id).dispose()
    }
  }
}

function repeat_loop_statement(input){
  var timesBlock = value_statement(input.after('repeat').before('times').text())
  var timesBlockOutput = timesBlock.outputConnection
  var doBlock = operation_statement(input.after('operation').text())
  var doBlockOutput = doBlock.previousConnection

  var repeatLoopBlock = addBlock('controls_repeat_ext')
  var timesField = repeatLoopBlock.getInput('TIMES').connection
  var doField = repeatLoopBlock.getInput('DO').connection

  if (timesBlockOutput.checkType(timesField)) {
    timesField.connect(timesBlockOutput)
    doField.connect(doBlockOutput)
  }
  else {
    alert("The value '" + input.after('repeat').before('times').text() + "', representing number of times you want to repeat the operation, must be a number. Please, try again to create just this block and drag it to its correct place")

    workspace.getBlockById(timesBlock.id).dispose()
    doField.connect(doBlockOutput)
  }
  return repeatLoopBlock
}

function whileUntil_loop_statement(input){
  var mode = input.firstTerms().text()
  var conditionBlock = value_statement(input.after(mode).before('repeat').text())
  var conditionBlockOutput = conditionBlock.outputConnection
  var doBlock = operation_statement(input.after('operation').text())
  var doBlockOutput = doBlock.previousConnection

  var whileUntilLoopBlock = addBlock('controls_whileUntil')
  var conditionField = whileUntilLoopBlock.getInput('BOOL').connection
  var doField = whileUntilLoopBlock.getInput('DO').connection

  whileUntilLoopBlock.setFieldValue(nlp(mode).toUpperCase().text(), 'MODE')

  if (conditionBlockOutput.checkType(conditionField)) {
    conditionField.connect(conditionBlockOutput)
    doField.connect(doBlockOutput)

    return whileUntilLoopBlock
  }
  else {
    alert("The value '" + input.after(mode).before('repeat').text() + "', representing the condition to repeat the operation " + mode + " it is true, must be a boolean. Please, try again to create just this block and drag it to its correct place")

    workspace.getBlockById(conditionBlock.id).dispose()
    doField.connect(doBlockOutput)
  }
}

function for_loop_statement(input){
  var fromBlock = value_statement(input.after('from').before('to').text())
  var fromBlockOutput = fromBlock.outputConnection
  var toBlock = value_statement(input.after('to').before('by').text())
  var toBlockOutput = toBlock.outputConnection
  var byBlock = value_statement(input.after('by').before('and').text())
  var byBlockOutput = byBlock.outputConnection

  var forLoopBlock = addBlock('controls_for')
  var fromField = forLoopBlock.getInput('FROM').connection
  var toField = forLoopBlock.getInput('TO').connection
  var byField = forLoopBlock.getInput('BY').connection
  var doField = forLoopBlock.getInput('DO').connection
  var foundVariable = find_variable(input.after('with').before('from').text())

  if (foundVariable == null){ // this creates the variable in case it didn't exist
    addVariable(input.after('with').before('from').text())
    foundVariable = workspace.getVariable(input.after('with').before('from').text());
  }

  // this goes better here because if you want to use the variable for the count also in the do operation and it is a new created variable here, it wouldn't work if this goes before
  var doBlock = operation_statement(input.after('operation').text())
  var doBlockOutput = doBlock.previousConnection

  forLoopBlock.setFieldValue(foundVariable.getId(), 'VAR')

  if (fromBlockOutput.checkType(fromField) && toBlockOutput.checkType(toField) && byBlockOutput.checkType(byField)) {
    fromField.connect(fromBlockOutput)
    toField.connect(toBlockOutput)
    byField.connect(byBlockOutput)
    doField.connect(doBlockOutput)

  }
  else {
    if (!fromBlockOutput.checkType(fromField)) {
      alert("The value '" + input.after('from').before('to').text() + "', representing the low limit in the for loop, must be a number. Please, try again to create just this block and drag it to its correct place")
      workspace.getBlockById(fromBlock.id).dispose()

      toField.connect(toBlockOutput)
      byField.connect(byBlockOutput)
      doField.connect(doBlockOutput)
    }
    else if (!toBlockOutput.checkType(toField)) {
      alert("The value '" + input.after('to').before('by').text() + "', representing the high limit in the for loop, must be a number. Please, try again to create just this block and drag it to its correct place")
      workspace.getBlockById(toBlock.id).dispose()

      fromField.connect(fromBlockOutput)
      byField.connect(byBlockOutput)
      doField.connect(doBlockOutput)
    }
    else if (!byBlockOutput.checkType(byField)) {
      alert("The value '" + input.after('by').before('and').text() + "', representing the increment/decrement in the for loop, must be a number. Please, try again to create just this block and drag it to its correct place")
      workspace.getBlockById(byBlock.id).dispose()

      fromField.connect(fromBlockOutput)
      toField.connect(toBlockOutput)
      doField.connect(doBlockOutput)
    }
  }
  return forLoopBlock
}

function forEach_loop_statement(input){
  var listBlock = value_statement(input.after('list').before('do').text())
  var listBlockOutput = listBlock.outputConnection
  var doBlock = operation_statement(input.after('operation').text())
  var doBlockOutput = doBlock.previousConnection
  var foundVariable = find_variable(input.after('to').before('in').text())

  var forEachLoopBlock = addBlock('controls_forEach')
  var listField = forEachLoopBlock.getInput('LIST').connection
  var doField = forEachLoopBlock.getInput('DO').connection

  if (foundVariable == null) { // this creates the variable in case it didn't exist
    addVariable(input.after('to').before('in').text())
    foundVariable = workspace.getVariable(input.after('to').before('in').text());
  }
  forEachLoopBlock.setFieldValue(foundVariable.getId(), 'VAR')

  if (listBlockOutput.checkType(listField)) {
    listField.connect(listBlockOutput)
    doField.connect(doBlockOutput)
  }
  else {
    alert("The value '" + input.after('list').before('do').text() + "', representing the the list/array in which you want to find the item, must be a list/array. Please, try again to create just this block and drag it to its correct place")
    workspace.getBlockById(listBlock.id).dispose()

    doField.connect(doBlockOutput)
  }
  return forEachLoopBlock
}

function flow_statement(input){
  var flowBlock = addBlock('controls_flow_statements')
  if(input.firstTerms().text() == 'break'){flowBlock.setFieldValue('BREAK', 'FLOW')}
  else {flowBlock.setFieldValue('CONTINUE', 'FLOW')}
  return flowBlock
}

function text_append_statement(input){
  var textBlock = value_statement(input.after('text').before('to').text())
  var textBlockOutput = textBlock.outputConnection
  var foundVariable = find_variable(input.after('to').text())
  var textAppendBlock = addBlock('text_append')
  var textField = textAppendBlock.getInput('TEXT').connection

  if (foundVariable == null) { // this creates the variable in case it didn't exist
    addVariable(input.after('to').text())
    foundVariable = workspace.getVariable(input.after('to').text());
  }
  textAppendBlock.setFieldValue(foundVariable.getId(), 'VAR')

  if (textBlockOutput.checkType(textField)) {
    textField.connect(textBlockOutput)
  }
  else {
    alert("The value '" + iinput.after('text').before('to').text() + "', representing the the text you want to append to '" + input.after('to').text() + "' , must be a text. Please, try again to create just this block and drag it to its correct place")
    workspace.getBlockById(textBlock.id).dispose()
  }
  return textAppendBlock
}

function text_print_statement(input){
  var textBlock = value_statement(input.after('print').text())
  var textBlockOutput= textBlock.outputConnection
  var textPrintBlock = addBlock('text_print')
  var textField = textPrintBlock.getInput('TEXT').connection

  textField.connect(textBlockOutput)

  return textPrintBlock
}

function remove_from_list_statement(input, keyWord){
  var listBlock = value_statement(input.after('in').text())
  var listBlockOutput = listBlock.outputConnection
  var listsGetIndexBlock = addBlock('lists_getIndex')
  var listField = listsGetIndexBlock.getInput('VALUE').connection
  var positionField = listsGetIndexBlock.getInput('AT').connection
  listsGetIndexBlock.setFieldValue('REMOVE', 'MODE')

  if (input.has('random')){
    listsGetIndexBlock.setFieldValue('RANDOM', 'WHERE')
  }
  else if (input.has('last')){
    listsGetIndexBlock.setFieldValue('LAST', 'WHERE')
  }
  else {
    var position = input.after(keyWord).before('item').numbers()
    // now it'll check if the position given is valid or not
    if (position.length == 0) { // there is not a number, so it is not a valid position
      var positionValid = false
    }
    else { // there is a number, so it is a valid position
      var positionValid = true
      var positionBlock = value_statement(position.text())
      var positionBlockOutput = positionBlock.outputConnection
    }

    if (input.has('start')){listsGetIndexBlock.setFieldValue('FROM_START', 'WHERE')}
    else if (input.has('end')){listsGetIndexBlock.setFieldValue('FROM_END', 'WHERE')}

    // this is needed to be checked here and not after with listBlockOutput because
    // in case it is "random/last item", position field and block do not exist
    if (positionValid){
      positionField.connect(positionBlockOutput)
    }
    else {
      alert("The value '" + input.after(keyWord).before('item').text() + "', representing the position of the item to take in '" + input.after('in').text() + "', must be an ordinal number. Please, try again to create just this block and drag it to its correct place")
    }
  }
  if (listBlockOutput.checkType(listField)){
    listField.connect(listBlockOutput)
  }
  else{
    alert("The value '" + input.after('in').text() + "', representing the list/array of which you want to take the '" + input.after(keyWord).before('item').text() + "' item, must be a list/array. Please, try again to create just this block and drag it to its correct place")
    workspace.getBlockById(listBlock.id).dispose()
  }
  return listsGetIndexBlock
}

function lists_setIndex_statement(input){
  var listsSetIndexBlock = addBlock('lists_setIndex')
  var positionField = listsSetIndexBlock.getInput('AT').connection
  var valueField = listsSetIndexBlock.getInput('TO').connection
  var listField = listsSetIndexBlock.getInput('LIST').connection
  // first, recognise if it is 'set' or 'insert' and some key words for each case
  if (input.has('set')) {
    var mode = 'set'
    var at = 'item'
    var to = 'as'
  }
  else if (input.has('insert')) {
    var mode = 'insert'
    var at = 'position'
    var to = 'value'
  }
  else { // in case there is no "set" or "insert", give an error and try again
    alert("Missing the word 'set' or 'insert', which is necessary for this block. Please, check and try again")
    return 0
  }
  listsSetIndexBlock.setFieldValue(nlp(mode).toUpperCase().text(), 'MODE')
  var listBlock = value_statement(input.after('list').before(mode).text())
  var listBlockOutput = listBlock.outputConnection
  var valueBlock = value_statement(input.after(to).text())
  var valueBlockOutput = valueBlock.outputConnection

  if (input.has('random')) {
    listsSetIndexBlock.setFieldValue('RANDOM', 'WHERE')
  }
  else if (input.has('last')) {
    listsSetIndexBlock.setFieldValue('LAST', 'WHERE')
  }
  else {
    // this creates a variable to check if the position given is a number, otherwise it is not a valid instruction
    var position = input.after(mode).before(at).numbers()
    if (position.length == 0) { // there is not a number, so it is not a valid position
      var positionValid = false
    }
    else { // there is a number, so it is a valid position
      var positionValid = true
      var positionBlock = value_statement(position.text())
      var positionBlockOutput = positionBlock.outputConnection
    }

    if (input.has('start')) {listsSetIndexBlock.setFieldValue('FROM_START', 'WHERE')}
    else if (input.has('end')) {listsSetIndexBlock.setFieldValue('FROM_END', 'WHERE')}

    // this is needed to be checked here and not after with listBlockOutput because
    // in case it is "random/last item", position field and block do not exist
    if (positionValid){
      positionField.connect(positionBlockOutput)
    }
    else {
      alert("The value '" + input.after(mode).before(at).text() + "', representing the position of the item to set/insert in '" + input.after('list').before(mode).text() + "', must be an ordinal number. Please, try again to create just this block and drag it to its correct place")
    }
  }

  if (listBlockOutput.checkType(listField)){
    valueField.connect(valueBlockOutput)
    listField.connect(listBlockOutput)
  }
  else {
    alert("The value '" + input.after('list').before(mode).text() + "', representing the list/array in which you want to set/insert an item, must be a list/array. Please, try again to create just this block and drag it to its correct place")
    valueField.connect(valueBlockOutput)
    workspace.getBlockById(listBlock.id).dispose()
  }
  return listsSetIndexBlock
}

function find_variable(name){
  // now this try to find if there is already a variable called as the name input
  // in that case, that variable will be the returned element
  // otherwise, this function returns null
  var variables = workspace.getAllVariableNames()
  var variableFound = false
  var variable
  for (var i=0; i < variables.length; i++){
    if (name == variables[i]){variableFound = true}
  }
  if (variableFound == true) {
  variable = workspace.getVariable(name);
  }
  return variable
}

function logic_boolean(value){
  var logicBooleanBlock = addBlock('logic_boolean')
  if (value.text() == 'true'){
    logicBooleanBlock.setFieldValue('TRUE', 'BOOL')
  }
  else if (value.text() == 'false'){
    logicBooleanBlock.setFieldValue('FALSE', 'BOOL')
  }
  return logicBooleanBlock
}

function logic_null(){
  var logicNullBlock = addBlock('logic_null')
  return logicNullBlock
}

function logic_compare(value){
  if (value.has('is lower than or equal to')){
    var comparison = 'LTE'
    var logic_comparator = 'is lower than or equal to'
  }
  else if (value.has('is greater than or equal to')){
    var comparison = 'GTE'
    var logic_comparator = 'is greater than or equal to'
  }
  else if (value.has('is lower than')){
    var comparison = 'LT'
    var logic_comparator = 'is lower than'
  }
  else if (value.has('is greater than')){
    var comparison = 'GT'
    var logic_comparator = 'is greater than'
  }
  else if (value.has('is not equal to')){
    var comparison = 'NEQ'
    var logic_comparator = 'is not equal to'
  }
  else if (value.has('is equal to')){
    var comparison = 'EQ'
    var logic_comparator = 'is equal to'
  }
  var logicCompareBlock = addBlock('logic_compare')
  var operandAField = logicCompareBlock.getInput('A').connection
  var operandBField = logicCompareBlock.getInput('B').connection
  logicCompareBlock.setFieldValue(comparison, 'OP')

  var operandABlock = value_statement(value.before(logic_comparator).text())
  var operandBBlock = value_statement(value.after(logic_comparator).text())
  var operandABlockOutput = operandABlock.outputConnection
  var operandBBlockOutput = operandBBlock.outputConnection

  if (operandABlockOutput.checkType(operandAField) && operandBBlockOutput.checkType(operandBField)){
    operandAField.connect(operandABlockOutput)
    operandBField.connect(operandBBlockOutput)
    return logicCompareBlock
  }
  else {
    if (!operandABlockOutput.checkType(operandAField)){
      alert("The value '" + value.before(logic_comparator).text() + "', representing the first operand of a logic comparison, must be a number. Please, check and retry")
    }
    else if (!operandBBlockOutput.checkType(operandBField)){
      alert("The value '" + value.after(logic_comparator).text() + "', representing the second operand of a logic comparison, must be a number. Please, check and retry")
    }

    workspace.getBlockById(logicCompareBlock.id).dispose()
    workspace.getBlockById(operandABlock.id).dispose()
    workspace.getBlockById(operandBBlock.id).dispose()

    return 0
  }
}

function logic_operation(value, wordFound){
  if (wordFound == 'and'){logic_operator = 'AND'}
  else{logic_operator = 'OR'}

  var operandA = value.before(logic_operator).text()
  var operandB = value.after(logic_operator).text()

  var logicOperationBlock = addBlock('logic_operation')
  var operandAField = logicOperationBlock.getInput('A').connection
  var operandBField = logicOperationBlock.getInput('B').connection
  logicOperationBlock.setFieldValue(logic_operator, 'OP')

  var operandABlock = value_statement(operandA)
  var operandBBlock = value_statement(operandB)
  var operandABlockOutput = operandABlock.outputConnection
  var operandBBlockOutput = operandBBlock.outputConnection

  if (operandABlockOutput.checkType(operandAField) && operandBBlockOutput.checkType(operandBField)){
    operandAField.connect(operandABlockOutput)
    operandBField.connect(operandBBlockOutput)
    return logicOperationBlock
  }
  else {
    if (!operandABlockOutput.checkType(operandAField)){
      alert("The value '" + value.before(logic_operator).text() + "', representing the first operand of a logic operation, must be a boolean. Please, check and retry")
    }
    else if (!operandBBlockOutput.checkType(operandBField)){
      alert("The value '" + value.after(logic_operator).text() + "', representing the second operand of a logic operation, must be a boolean. Please, check and retry")
    }

    workspace.getBlockById(logicOperationBlock.id).dispose()
    workspace.getBlockById(operandABlock.id).dispose()
    workspace.getBlockById(operandBBlock.id).dispose()

    return 0
  }
}

function logic_negate(value){ // LN initials used in variables names refer to logic_negate
  var operandBlock = value_statement(value.after('not').text())
  var operandBlockOutput = operandBlock.outputConnection

  var logicNegateBlock = addBlock('logic_negate')
  var operandField = logicNegateBlock.getInput('BOOL').connection

  if(operandBlockOutput.checkType(operandField)){
    operandField.connect(operandBlockOutput)
    return logicNegateBlock
    }
  else {
    alert("The value '" + value.after('not').text() + "', representing the element to negate, must be a boolean. Please, check and retry")

    workspace.getBlockById(logicNegateBlock.id).dispose()
    workspace.getBlockById(operandBlock.id).dispose()

    return 0
  }
}

function logic_ternary(value){
  var ifBlock = value_statement(value.after('test').before('if true').text())
  var ifBlockOutput = ifBlock.outputConnection
  var thenBlock = value_statement(value.after('then').before('else').text())
  var thenBlockOutput = thenBlock.outputConnection
  var elseBlock = value_statement(value.after('else').text())
  var elseBlockOutput = elseBlock.outputConnection

  var logicTernaryBlock = addBlock('logic_ternary')
  var ifField = logicTernaryBlock.getInput('IF').connection
  var thenField = logicTernaryBlock.getInput('THEN').connection
  var elseField = logicTernaryBlock.getInput('ELSE').connection

  if (ifBlockOutput.checkType(ifField)){ // thenField and elseField do not need to be checked since they accept any type of value
    ifField.connect(ifBlockOutput)
    thenField.connect(thenBlockOutput)
    elseField.connect(elseBlockOutput)

    return logicTernaryBlock
  }
  else {
    alert("The value '" + value.after('test').before('if true').text() + "', representing the value to test in a logic ternary, must be a boolean. Please, check and retry")

    workspace.getBlockById(logicTernaryBlock.id).dispose()
    workspace.getBlockById(ifBlock.id).dispose()
    workspace.getBlockById(thenBlock.id).dispose()
    workspace.getBlockById(elseBlock.id).dispose()

    return 0
  }
}

function math_number_property(value,wordFound){
  operandBlock = value_statement(value.before('is').text()) // this must go first, otherwise value_statement would overwrite the valueBlock variable

  mathNumberPropertyBlock = addBlock('math_number_property')

  if (wordFound != 'divisible'){
    var math_property = nlp(wordFound).toUpperCase().text() // nlp is necessary in order to use compromise (in this case to change to upper case)
    mathNumberPropertyBlock.setFieldValue(math_property, 'PROPERTY')
  }
  else{
    var math_property = 'DIVISIBLE_BY'
    mathNumberPropertyBlock.setFieldValue(math_property, 'PROPERTY')
    divisorBlock = value_statement(value.after('by').text())
    divisorField = mathNumberPropertyBlock.getInput('DIVISOR').connection
    divisorBlockOutput = divisorBlock.outputConnection

    if(divisorBlockOutput.checkType(divisorField)){
      divisorField.connect(divisorBlockOutput)
    }
    else{
      alert("The value '" + value.after('by').text() + "', representing the divisor input, must be a number. Please, check and retry")

      workspace.getBlockById(mathNumberPropertyBlock.id).dispose()
      workspace.getBlockById(operandBlock.id).dispose()
      workspace.getBlockById(divisorBlock.id).dispose()

      return 0
    }
  }

  operandField = mathNumberPropertyBlock.getInput('NUMBER_TO_CHECK').connection
  operandBlockOutput = operandBlock.outputConnection

  if (operandBlockOutput.checkType(operandField)){
    operandField.connect(operandBlockOutput)
    return mathNumberPropertyBlock
  }
  else{
    alert("The value '" + value_statement(value.before('is').text()) + "', representing the number to check, must be a number. Please, check and retry")

    workspace.getBlockById(mathNumberPropertyBlock.id).dispose()
    workspace.getBlockById(operandBlock.id).dispose()
    workspace.getBlockById(divisorBlock.id).dispose()

    return 0
  }
}

function math_number(value){
  var mathNumberBlock = addBlock('math_number')
  mathNumberBlock.setFieldValue(value, 'NUM');

  return mathNumberBlock
}

function math_arithmetic(value, wordFound){
  if (wordFound == 'plus'){
    var operation = 'ADD'
    var operandA = value.before('plus').text()
    var operandB = value.after('plus').text()
  }
  else if (wordFound == 'times'){
    var operation = 'MULTIPLY'
    var operandA = value.before('times').text()
    var operandB = value.after('times').text()
  }
  else if (wordFound == 'divided'){
    var operation = 'DIVIDE'
    var operandA = value.before('divided').text()
    var operandB = value.after('by').text()
  }
  else if (wordFound == 'power'){
    var operation = 'POWER'
    var operandA = value.before('to').text()
    var operandB = value.match('[.] power', 0).text()
  }
  else { // case it is a substraction
    var operation = 'MINUS'
    switch (value.match('minus').wordCount()){
      case 1:  // case exmaple: one minus two
        var operandA = value.before('minus').text()
        var operandB = value.after('minus').text()
      break;
      case 2:
        if (value.firstTerms().text() == 'minus'){ // case example: minus one minus two
          var operandA = value.before(value.match('minus').last()).text()
          var operandB = value.after(value.match('minus').last()).text()
        }
        else { // case example: one minus minus two
          var operandA = value.before(value.match('minus').first()).text()
          var operandB = value.after(value.match('minus').first()).text()
        }
      break;
      case 3: // case example: minus one minus minus two
        var operandA = value.numbers().first().text()
        var operandB = value.numbers().last().text()
      break;
    }
  }
  var mathArithmeticBlock = addBlock('math_arithmetic')
  var operandAField = mathArithmeticBlock.getInput('A').connection;
  var operandBField = mathArithmeticBlock.getInput('B').connection;
  mathArithmeticBlock.setFieldValue(operation, 'OP')

  var operandABlock = value_statement(operandA)
  var operandBBlock = value_statement(operandB)
  var operandABlockOutput = operandABlock.outputConnection
  var operandBBlockOutput = operandBBlock.outputConnection

  if (operandABlockOutput.checkType(operandAField) && operandBBlockOutput.checkType(operandBField)){
    operandAField.connect(operandABlockOutput);
    operandBField.connect(operandBBlockOutput);
    return mathArithmeticBlock;
  }
  else{
    if (!operandABlockOutput.checkType(operandAField)){
      alert("The value '" + operandA + "', representing the first operand of an arithmetic operation, must be a number. Please, check and retry")
    }
    else if (!operandBBlockOutput.checkType(operandBField)){
      alert("The value '" + operandB + "', representing the second operand of an arithmetic operation, must be a number. Please, check and retry")
    }

    workspace.getBlockById(operandABlock.id).dispose()
    workspace.getBlockById(operandBBlock.id).dispose()
    workspace.getBlockById(mathArithmeticBlock.id).dispose()

    return 0
  }
}

function math_single(value, wordFound){
  if (wordFound == 'square root'){var math_single_operator = 'ROOT'}
  else if(wordFound == 'absolute value'){var math_single_operator = 'ABS'}
  else if(wordFound == 'natural logarithm'){var math_single_operator = 'LN'}
  else if(wordFound == 'common logarithm'){var math_single_operator = 'LOG10'}

  var operandBlock = value_statement(value.after('of').text())
  var operandBlockOutput = operandBlock.outputConnection
  var mathSingleBlock = addBlock('math_single')
  var operandField = mathSingleBlock.getInput('NUM').connection
  mathSingleBlock.setFieldValue(math_single_operator, 'OP')

  if (operandBlockOutput.checkType(operandField)){
    operandField.connect(operandBlockOutput)
    return mathSingleBlock
  }
  else{
    alert("The value '" + value.after('of').text() +"', representing the operand in a math_single block, must be a number. Please check and retry")

    workspace.getBlockById(operandBlock.id).dispose()
    workspace.getBlockById(mathSingleBlock.id).dispose()

    return 0
  }
}

function math_trig(value, wordFound){
  if (wordFound == 'sine'){
    if (value.has('inverse')){var math_trig_operator = 'ASIN'}
    else {math_trig_operator = 'SIN'}
  }
  else if (wordFound == 'cosine'){
    if (value.has('inverse')){var math_trig_operator = 'ACOS'}
    else {math_trig_operator = 'COS'}
  }
  else if (wordFound == 'tangent'){
    if (value.has('inverse')){var math_trig_operator = 'ATAN'}
    else {math_trig_operator = 'TAN'}
  }

  var operandBlock = value_statement(value.after('of').text())
  var operandBlockOutput = operandBlock.outputConnection
  var mathTrigBlock = addBlock('math_trig')
  var operandField = mathTrigBlock.getInput('NUM').connection
  mathTrigBlock.setFieldValue(math_trig_operator, 'OP')

  if(operandBlockOutput.checkType(operandField)){
    operandField.connect(operandBlockOutput)
    return mathTrigBlock
  }
  else{
    alert("The value '" + value.after('of').text() +"', representing the operand of a trigonometrical operation, must be a number. Please check and retry")

    workspace.getBlockById(operandBlock.id).dispose()
    workspace.getBlockById(mathTrigBlock.id).dispose()

    return 0
}
}

function math_constant(value, wordFound){
  var mathConstantBlock = addBlock('math_constant')

  if (wordFound == 'pi'){mathConstantBlock.setFieldValue('PI', 'CONSTANT')}
  else if (wordFound == 'euler'){mathConstantBlock.setFieldValue('E', 'CONSTANT')}
  else if (wordFound == 'golden ratio'){mathConstantBlock.setFieldValue('GOLDEN_RATIO', 'CONSTANT')}
  else if (wordFound == 'infinite' | wordFound == 'infinity'){mathConstantBlock.setFieldValue('INFINITY', 'CONSTANT')}
  return mathConstantBlock
}

function math_round(value){
  if (value.has('round up')){
    var math_round_operator = 'ROUNDUP'
    var operand = value.after('up').text()
  }
  else if (value.has('round down')){
    var math_round_operator = 'ROUNDDOWN'
    var operand = value.after('down').text()
  }
  else {
    var math_round_operator = 'ROUND'
    var operand = value.after('round').text()
  }

  var operandBlock = value_statement(operand)
  var operandBlockOutput = operandBlock.outputConnection
  var mathRoundBlock = addBlock('math_round')
  var operandField = mathRoundBlock.getInput('NUM').connection
  mathRoundBlock.setFieldValue(math_round_operator, 'OP')

  if (operandBlockOutput.checkType(operandField)){
    operandField.connect(operandBlockOutput)
    return mathRoundBlock
  }
  else{
    alert("The value '" + operand +"', representing the number in a rounding operation, must be a number. Please check and retry")

    workspace.getBlockById(operandBlock.id).dispose()
    workspace.getBlockById(mathRoundBlock.id).dispose()

    return 0
  }
}

function math_on_list(value,wordFound){
  var variable = find_variable(value.after('of').text())
  if (variable != null){ // case the variable exists
    switch(wordFound){
      case 'summation':  var math_on_list_operator = 'SUM'; break;
      case 'minimum':  var math_on_list_operator = 'MIN'; break;
      case 'maximum':  var math_on_list_operator = 'MAX'; break;
      case 'average':  var math_on_list_operator = 'AVERAGE'; break;
      case 'median':  var math_on_list_operator = 'MEDIAN'; break;
      case 'modes':  var math_on_list_operator = 'MODE'; break;
      case 'standard deviation':  var math_on_list_operator = 'STD_DEV'; break;
      case 'random item':  var math_on_list_operator = 'RANDOM'; break;
    }
    var variableBlock = addBlock('variables_get')
    variableBlock.setFieldValue(variable.getId(), 'VAR')
    var variableBlockOutput = variableBlock.outputConnection

    var mathOnListBlock = addBlock('math_on_list')
    var variableField = mathOnListBlock.getInput('LIST').connection
    mathOnListBlock.setFieldValue(math_on_list_operator, 'OP')

    if (variableBlockOutput.checkType(variableField)){
      variableField.connect(variableBlockOutput)
      return mathOnListBlock
    }
    else{ // case the variable is not a list
      alert("The value '" + value.after('of').text() + "' must be a list/array in order to obtain its '" + wordFound + "'. Please check and retry")
      return 0
    }
  }
  else { // case there is not any variable called as value.after('of').text()
    alert("The value '" + value.after('of').text() + "' must be an already existing variable in order to obtain its '" + wordFound + "'. Please check and retry")
    return 0
  }
}

function math_modulo(value){
  var dividendBlock = value_statement(value.after('of').before('divided').text())
  var dividendBlockOutput = dividendBlock.outputConnection

  var divisorBlock = value_statement(value.after('by').text())
  var divisorBlockOutput = divisorBlock.outputConnection

  var mathModuloBlock = addBlock('math_modulo')
  var dividendField = mathModuloBlock.getInput('DIVIDEND').connection
  var divisorField = mathModuloBlock.getInput('DIVISOR').connection

  if (dividendBlockOutput.checkType(dividendField) && divisorBlockOutput.checkType(divisorField)){
    dividendField.connect(dividendBlockOutput)
    divisorField.connect(divisorBlockOutput)

    return mathModuloBlock
  }
  else{
    if (!dividendBlockOutput.checkType(dividendField)){
      alert("The value '" + value.after('of').before('divided').text() + "', representing the dividend in a operation to obtain the remainder of a division, must be a number. Please check and retry")
    }
    else if (!divisorBlockOutput.checkType(divisorField)) {
      alert("The value '" + value.after('by').text() + "', representing the divisor in a operation to obtain the remainder of a division, must be a number. Please check and retry")
    }
    workspace.getBlockById(dividendBlock.id).dispose()
    workspace.getBlockById(divisorBlock.id).dispose()
    workspace.getBlockById(mathModuloBlock.id).dispose()

    return 0
  }
}

function math_constrain(value){
  var variable = find_variable(value.before('constrained').text())
  if (variable != null){ // case the variable exists
    var variableBlock = addBlock('variables_get')
    variableBlock.setFieldValue(variable.getId(), 'VAR')
    var variableBlockOutput = variableBlock.outputConnection

    var lowBlock = value_statement(value.after('between').before('and').text())
    var lowBlockOutput = lowBlock.outputConnection
    var highBlock = value_statement(value.after('and').text())
    var highBlockOutput = highBlock.outputConnection

    var mathConstrainBlock = addBlock('math_constrain')
    var variableField = mathConstrainBlock.getInput('VALUE').connection
    var lowLimitField = mathConstrainBlock.getInput('LOW').connection
    var highLimitField = mathConstrainBlock.getInput('HIGH').connection

    if (variableBlockOutput.checkType(variableField) && lowBlockOutput.checkType(lowLimitField) && highBlockOutput.checkType(highLimitField)){
      variableField.connect(variableBlockOutput)
      lowLimitField.connect(lowBlockOutput)
      highLimitField.connect(highBlockOutput)

      return mathConstrainBlock
    }
    else{
      if (!variableBlockOutput.checkType(variableField)){
        alert("The value '" + value.before('constrained').text() + "', representing a variable to constrain, must be a number. Please check and retry")

      }
      else if (!lowBlockOutput.checkType(lowLimitField)) {
        alert("The value '" + value.after('between').before('and').text() + "', representing the low limit in a constraint operation, must be a number. Please check and retry")
      }
      else if(!highBlockOutput.checkType(highLimitField)){
        alert("The value '" + value.after('and').text() + "', representing the high limit in a constraint operation, must be a number. Please check and retry")
      }
      workspace.getBlockById(mathConstrainBlock.id).dispose()
      workspace.getBlockById(variableBlock.id).dispose()
      workspace.getBlockById(lowBlock.id).dispose()
      workspace.getBlockById(highBlock.id).dispose()

      return 0
    }
  }
  else{ // case there is not any variable called as value.before('constrained').text()
    alert(value.before('constrained').text() + ', representing a variable to constrain, must be an already existing variable. Please check and retry')
    return 0
  }
}

function math_random_int(value){
  fromBlock = value_statement(value.after('from').before('to').text())
  fromBlockOutput = fromBlock.outputConnection
  toBlock = value_statement(value.after('to').text())
  toBlockOutput = toBlock.outputConnection

  mathRandomIntBlock = addBlock('math_random_int')
  fromField = mathRandomIntBlock.getInput('FROM').connection
  toField = mathRandomIntBlock.getInput('TO').connection


  if (fromBlockOutput.checkType(fromField) && toBlockOutput.checkType(toField)){
    fromField.connect(fromBlockOutput)
    toField.connect(toBlockOutput)

    return mathRandomIntBlock
  }
  else{
    if (!fromBlockOutput.checkType(fromField)) {
      alert("The value '" + value.after('from').before('to').text() + "', representing the low limit for a random integer, must be a number. Please check and retry")
    }
    else if (!toBlockOutput.checkType(toField)) {
      alert("The value '" + value.after('to').text() + "', representing the high limit for a random integer, must be a number. Please check and retry")
    }
    workspace.getBlockById(mathRandomIntBlock.id).dispose()
    workspace.getBlockById(fromBlock.id).dispose()
    workspace.getBlockById(toBlock.id).dispose()

    return 0
  }
}

function math_random_float(){
  var mathRandomFloatBlock = addBlock('math_random_float')
  return mathRandomFloatBlock
}

function text(value){
  var textBlock = addBlock('text')
  textBlock.setFieldValue(value.text(), 'TEXT')
  return textBlock
}

function text_join(value){
  var n = value.match('and').wordCount() + 1 // n represents the number of inputs that will be needed
  var textJoinBlock = addBlock('text_join')

  // by default, the text_join block has 2 inputs
  // so now, this will set the necessary number of inputs
  if (n < 2){ // in this case, 1 input must be removed
    textJoinBlock.removeInput('ADD1')
  }
  else if (n >= 2){ // in this case, n-2 inputs must be added
    for (i = 2; i < n; i++){
      textJoinBlock.appendInput_(1, 'ADD' + i)
    }
  }

  // and this will take the connection of the inputs
  var textFields = []
  for (var i = 0; i < n; i++){
    textFields[i] = textJoinBlock.getInput('ADD' + i).connection
  }

  var textBlocks = [] // this array will contain the blocks from which the text is created
  if (n < 2){
    textBlocks[0] = value_statement(value.after('with').text())
  }
  else{
    textBlocks[0] = value_statement(value.after('with').before('and').text())
    value.before('and').delete()
    for (var i = 1; i < n-1; i++){
      textBlocks[i] = value_statement(value.after('and').before('and').text())
      value.matchOne('and').delete()
      value.before('and').delete()
    }
    textBlocks[n-1] = value_statement(value.after('and').text())
  }

  // in this function there is not an error alert because the text_join block inputs accept any type of block
  var textBlocksOutputs = []
  for (var i = 0; i < n; i++){
    textBlocksOutputs[i] = textBlocks[i].outputConnection
    textFields[i].connect(textBlocksOutputs[i])
  }
  return textJoinBlock
}

function text_length(value){
  var textBlock = value_statement(value.after('of').text())
  var textBlockOutput = textBlock.outputConnection

  var textLengthBlock = addBlock('text_length')
  var textField = textLengthBlock.getInput('VALUE').connection

  if (textBlockOutput.checkType(textField)){
    textField.connect(textBlockOutput)
    return textLengthBlock
  }
  else {
    alert("The value '" + value.after('of').text() + "', representing the text of which you want to know the length, must be a text. Please check and retry")

    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textLengthBlock.id).dispose()

    return 0
  }
}

function text_isEmpty(value){
  var textBlock = value_statement(value.before('is').text())
  var textBlockOutput = textBlock.outputConnection

  var textIsEmptyBlock = addBlock('text_isEmpty')
  var textField = textIsEmptyBlock.getInput('VALUE').connection

  if (textBlockOutput.checkType(textField)){
    textField.connect(textBlockOutput)
    return textIsEmptyBlock
  }
  else {
    alert("The value '" + value.before('is').text() + "', representing the text you want to know if it is empty, must be a text. Please check and retry")

    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textIsEmptyBlock.id).dispose()

    return 0
  }
}

function occurrence(value){
  if (value.has('text')){var occurrenceBlock = text_indexOf(value)}
  else if (value.has('list')) {var occurrenceBlock = lists_indexOf(value)}
  return occurrenceBlock
}

function text_indexOf(value){
  var textVariableBlock = value_statement(value.after('in text').text())
  var textVariableBlockOutput = textVariableBlock.outputConnection

  var textToFindBlock = value_statement(value.after('of').before('in').text())
  var textToFindBlockOutput = textToFindBlock.outputConnection

  var textIndexOfBlock = addBlock('text_indexOf')
  var textVariableField = textIndexOfBlock.getInput('VALUE').connection
  var textToFindField = textIndexOfBlock.getInput('FIND').connection

  if (value.has('first')){textIndexOfBlock.setFieldValue('FIRST', 'END')}
  else if (value.has('last')){textIndexOfBlock.setFieldValue('LAST', 'END')}

  if (textToFindBlockOutput.checkType(textToFindField) && textVariableBlockOutput.checkType(textVariableField)){
    textVariableField.connect(textVariableBlockOutput)
    textToFindField.connect(textToFindBlockOutput)
    return textIndexOfBlock
  }
  else {
    if (!textToFindBlockOutput.checkType(textToFindField)){
      alert("The value '" + value.after('of').before('in').text() + "', representing the text to find in '" + value.after('in text').text() + "', must be a text. Please check and retry")
    }
    else if (!textVariableBlockOutput.checkType(textVariableField)){
      alert("The value '" + value.after('in text').text() + "', representing the text where you want to find '" + value.after('of').before('in').text() + "', must be a text. Please check and retry")
    }
    workspace.getBlockById(textIndexOfBlock.id).dispose()
    workspace.getBlockById(textVariableBlock.id).dispose()
    workspace.getBlockById(textToFindBlock.id).dispose()

    return 0
  }
}

function text_charAt(value){
  var textBlock = value_statement(value.after('in').text())
  var textBlockOutput = textBlock.outputConnection

  var textChartAtBlock = addBlock('text_charAt')
  var textField = textChartAtBlock.getInput('VALUE').connection

  if (value.has('random')){
    textChartAtBlock.setFieldValue('RANDOM', 'WHERE')
  }
  else if (value.has('last')){
    textChartAtBlock.setFieldValue('LAST', 'WHERE')
  }
  else {
    // this creates a variable to check if the position given is a number, otherwise it is not a valid instruction
    var position = value.before('letter').numbers()
    if (position.length == 0) { // there is not a number, so it is not a valid position
      var positionValid = false
    }
    else { // there is a number, so it is a valid position
      var positionValid = true
      var positionBlock = value_statement(position.text())
      var positionBlockOutput = positionBlock.outputConnection
    }

    if (value.has('start')){
      textChartAtBlock.setFieldValue('FROM_START', 'WHERE')
    }
    else if (value.has('end')){
      textChartAtBlock.setFieldValue('FROM_END', 'WHERE')
    }
    var positionField = textChartAtBlock.getInput('AT').connection // this has to be here and not before because the input "AT" will be created or not depending on the previous else if statements

    // this is needed to be checked here and not after with textBlockOutput because
    // in case it is "random letter", position field and block do not exist
    if (positionValid){
      positionField.connect(positionBlockOutput)
    }
    else {
      alert("The value '" + value.before('letter').text() + "', representing the position of the letter to take in '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      workspace.getBlockById(positionBlock.id).dispose()
      return 0
    }
  }

  if (textBlockOutput.checkType(textField)){
    textField.connect(textBlockOutput)
    return textChartAtBlock
  }
  else
  {
    alert("The value '" + value.after('in').text() + "', representing the text of which you want to take '" + value.before('letter').text() + "' letter, must be a text. Please check and retry")

    workspace.getBlockById(textChartAtBlock.id).dispose()
    workspace.getBlockById(textBlock.id).dispose()

    return 0
  }
}

function text_getSubstring(value){
  var textBlock = value_statement(value.after('in').text())
  var textBlockOutput = textBlock.outputConnection

  var textGetSubstringBlock = addBlock('text_getSubstring')
  var position1Field = textGetSubstringBlock.getInput('AT1').connection
  var position2Field = textGetSubstringBlock.getInput('AT2').connection
  var textField = textGetSubstringBlock.getInput('STRING').connection


  if (value.match('start').wordCount() == 1){ // case there is just one "from start"
    if (value.match('start [.]', 0).text() == 'to'){ // case the "from start" is in the first letter
      textGetSubstringBlock.setFieldValue('FROM_START', 'WHERE1')
    }
    else if (value.match('start [.]', 0).text() == 'in'){ // case the "from start" is in the second letter
      textGetSubstringBlock.setFieldValue('FROM_START', 'WHERE2')
    }
  }
  else if (value.match('start').wordCount() == 2){ // case there is a "from start" in the two letters
    textGetSubstringBlock.setFieldValue('FROM_START', 'WHERE1')
    textGetSubstringBlock.setFieldValue('FROM_START', 'WHERE2')
  }
  if (value.match('end').wordCount() == 1){ // case there is just one "from end"
    if (value.match('end [.]', 0).text() == 'to'){ // case the "from end" is in the first letter
      textGetSubstringBlock.setFieldValue('FROM_END', 'WHERE1')
    }
    else if (value.match('end [.]', 0).text() == 'in'){ // case the "from end" is in the second letter
      textGetSubstringBlock.setFieldValue('FROM_END', 'WHERE2')
    }
  }
  else if (value.match('end').wordCount() == 2){ // case there is a "from end" in the two letters
    textGetSubstringBlock.setFieldValue('FROM_END', 'WHERE1')
    textGetSubstringBlock.setFieldValue('FROM_END', 'WHERE2')
  }

  // this creates a variable to check if the position 1 given is a number, otherwise it is not a valid instruction
  var position1 = value.after('from').before('letter').numbers()
  if (position1.length == 0) { // there is not a number, so it is not a valid position
    var position1Valid = false
  }
  else { // there is a number, so it is a valid position
    var position1Valid = true
    var position1Block = value_statement(position1.text())
    var position1BlockOutput = position1Block.outputConnection
  }

  if (value.has('last')){
    var position2 = 'last'
    textGetSubstringBlock.setFieldValue('LAST', 'WHERE2')
  }
  else{
    // this creates a variable to check if the position 2 given is a number, otherwise it is not a valid instruction
    var position2 = value.after('to').before('letter').numbers()
    if (position2.length == 0) { // there is not a number, so it is not a valid position
      var position2Valid = false
    }
    else { // there is a number, so it is a valid position
      var position2Valid = true
      var position2Block = value_statement(position2.text())
      var position2BlockOutput = position2Block.outputConnection
    }

    if (position2Valid){
      position2Field.connect(position2BlockOutput)
    }
    else {
      alert("The value '" + value.after('to').before('letter').text() + "', representing the final position of the substring you want to get from '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      workspace.getBlockById(position1Block.id).dispose()
      workspace.getBlockById(textBlock.id).dispose()
      workspace.getBlockById(textGetSubstringBlock.id).dispose()
      return 0
    }
  }
  if (position1Valid && textBlockOutput.checkType(textField)){
    position1Field.connect(position1BlockOutput)
    textField.connect(textBlockOutput)
    return textGetSubstringBlock
  }
  else {
    if (!position1Valid){
      alert("The value '" + value.after('from').before('letter').text() + "', representing the initial position of the substring you want to get from '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      if(position2 != 'last'){workspace.getBlockById(position2Block.id).dispose()}
      workspace.getBlockById(textBlock.id).dispose()
      workspace.getBlockById(textGetSubstringBlock.id).dispose()
    }
    else if (!textBlockOutput.checkType(textField)) {
      alert("The value '" + value.after('in').text() + "', representing the text of which you want to get a substring, must be a text. Please check and retry")
      workspace.getBlockById(position1Block.id).dispose()
      workspace.getBlockById(position2Block.id).dispose()
      workspace.getBlockById(textBlock.id).dispose()
      workspace.getBlockById(textGetSubstringBlock.id).dispose()
    }
    return 0
  }
}

function text_changeCase(value){
  var textBlock = value_statement(value.after('change').before('to').text())
  var textBlockOutput = textBlock.outputConnection

  var textChangeCaseBlock = addBlock('text_changeCase')
  var textField = textChangeCaseBlock.getInput('TEXT').connection

  if (value.has('upper') | value.has('uppercase')){
    textChangeCaseBlock.setFieldValue('UPPERCASE', 'CASE')
  }
  else if (value.has('lower') | value.has('lowercase')){
    textChangeCaseBlock.setFieldValue('LOWERCASE', 'CASE')
  }
  else if (value.has('title') | value.has('titlecase')){
    textChangeCaseBlock.setFieldValue('TITLECASE', 'CASE')
  }

  if (textBlockOutput.checkType(textField)){
    textField.connect(textBlockOutput)
    return textChangeCaseBlock
  }
  else {
    alert("The value '" + value.after('change').before('to').text() + "', representing the text of which you want to change the case, must be a text. Please check and retry")

    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textChangeCaseBlock.id).dispose()

    return 0
  }
}

function text_trim(value){
  var textBlock = value_statement(value.after('of').text())
  var textBlockOutput = textBlock.outputConnection

  var textTrimBlock = addBlock('text_trim')
  var textField = textTrimBlock.getInput('TEXT').connection

  if (value.has('both')){
    textTrimBlock.setFieldValue('BOTH', 'MODE')
  }
  else if (value.has('left')){
    textTrimBlock.setFieldValue('LEFT', 'MODE')
  }
  else if (value.has('right')){
    textTrimBlock.setFieldValue('RIGHT', 'MODE')
  }

  if (textBlockOutput.checkType(textField)){
    textField.connect(textBlockOutput)
    return textTrimBlock
  }
  else {
    alert("The value '" + value.after('of').text() + "', representing the text you want to trim, must be a text. Please check and retry")

    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textTrimBlock.id).dispose()

    return 0
  }
}

function text_count(value){
  var textToCountBlock = value_statement(value.after('count').before('in').text())
  var textToCountBlockOutput = textToCountBlock.outputConnection
  var textBlock = value_statement(value.after('in').text())
  var textBlockOutput = textBlock.outputConnection

  var textCountValueBlock = addBlock('text_count')
  var textToCountField = textCountValueBlock.getInput('SUB').connection
  var textField = textCountValueBlock.getInput('TEXT').connection

  if (textToCountBlockOutput.checkType(textToCountField) && textBlockOutput.checkType(textField)){
    textToCountField.connect(textToCountBlockOutput)
    textField.connect(textBlockOutput)
    return textCountValueBlock
  }
  else {
    if (!textToCountBlockOutput.checkType(textToCountField)) {
      alert("The value '" + value.after('count').before('in').text() + "', representing the text you want to count in '" + value.after('in').text() + "', must be a text. Please check and retry")
    }
    else if (!textBlockOutput.checkType(textField)) {
      alert("The value '" + value.after('in').text() + "', representing the text in which you want to count '" + value.after('count').before('in').text() + "', must be a text. Please check and retry")
    }

    workspace.getBlockById(textToCountBlock.id).dispose()
    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textCountValueBlock.id).dispose()

    return 0
  }
}

function text_replace(value){
  var textToReplaceBlock = value_statement(value.after('replace').before('with').text())
  var textToReplaceBlockOutput = textToReplaceBlock.outputConnection
  var newTextBlock = value_statement(value.after('with').before('in').text())
  var newTextBlockOutput = newTextBlock.outputConnection
  var textBlock = value_statement(value.after('in').text())
  var textBlockOutput = textBlock.outputConnection

  var textReplaceBlock = addBlock('text_replace')
  var textToReplaceField = textReplaceBlock.getInput('FROM').connection
  var newTextField = textReplaceBlock.getInput('TO').connection
  var textField = textReplaceBlock.getInput('TEXT').connection

  if (textToReplaceBlockOutput.checkType(textToReplaceField) && newTextBlockOutput.checkType(newTextField) && textBlockOutput.checkType(textField)){
    textToReplaceField.connect(textToReplaceBlockOutput)
    newTextField.connect(newTextBlockOutput)
    textField.connect(textBlockOutput)
    return textReplaceBlock
  }
  else {
    if (!textToReplaceBlockOutput.checkType(textToReplaceField)) {
      alert("The value '" + value.after('replace').before('with').text() + "', representing the text you want to replace in '" + value.after('in').text() + "' with '" + value.after('with').before('in').text() + "', must be a text. Please check and retry")
    }
    else if (!newTextBlockOutput.checkType(newTextField)) {
      alert("The value '" + value.after('with').before('in').text() + "', representing the text you want to put in '" + value.after('in').text() + "' replacing '" + value.after('replace').before('with').text() + "', must be a text. Please check and retry")
    }
    else if (!textBlockOutput.checkType(textField)) {
      alert("The value '" + value.after('in').text() + "', representing the text in which you want to replace '" + value.after('replace').before('with').text() + "' with '" + value.after('with').before('in').text() + "', must be a text. Please check and retry")
    }
    workspace.getBlockById(textToReplaceBlock.id).dispose()
    workspace.getBlockById(newTextBlock.id).dispose()
    workspace.getBlockById(textBlock.id).dispose()
    workspace.getBlockById(textReplaceBlock.id).dispose()

    return 0
  }
}

function reverse(value){
  if (value.has('text')){var reverseBlock = text_reverse(value)}
  else if (value.has('list')) {var reverseBlock = lists_reverse(value)}
  return reverseBlock
}

function text_reverse(value){
  var textToReverseBlock = value_statement(value.after('text').text())
  var textToReverseBlockOutput = textToReverseBlock.outputConnection

  var textReverseBlock = addBlock('text_reverse')
  var textToReverseField = textReverseBlock.getInput('TEXT').connection

  if (textToReverseBlockOutput.checkType(textToReverseField)){
    textToReverseField.connect(textToReverseBlockOutput)
    return textReverseBlock
  }
  else {
    alert("The value '" + value.after('text').text() + "', representing the text to reverse, must be a text. Please check and retry")

    workspace.getBlockById(textToReverseBlock.id).dispose()
    workspace.getBlockById(textReverseBlock.id).dispose()

    return 0
  }
}

function text_prompt_ext(value){
  var messageBlock = value_statement(value.after('message').text())
  var messageBlockOutput = messageBlock.outputConnection

  var textPromptExtBlock = addBlock('text_prompt_ext')
  var messageField = textPromptExtBlock.getInput('TEXT').connection

  if (value.match('for [.]', 0).text() == 'text'){textPromptExtBlock.setFieldValue('TEXT', 'TYPE')}
  else if (value.match('for [.]', 0).text() == 'number'){textPromptExtBlock.setFieldValue('NUMBER', 'TYPE')}

  if (messageBlockOutput.checkType(messageField)){
    messageField.connect(messageBlockOutput)
    return textPromptExtBlock
  }
  else {
    alert("The value '" + value.after('message').text() + "', representing the message to show, must be a text. Please check and retry")

    workspace.getBlockById(messageBlock.id).dispose()
    workspace.getBlockById(textPromptExtBlock.id).dispose()

    return 0
  }
}

function lists_create_empty(){
  var listsCreateEmptyBlock = addBlock('lists_create_empty')
  return listsCreateEmptyBlock
}

function lists_create_with(value){
  var n = value.match('and').wordCount() + 1 // this represents the number of items of the list
  var listsCreateWithBlock = addBlock('lists_create_with')

  // by default, the block has 3 inputs
  // so now, this will set the necessary number of inputs
  if (n < 3){ // in this case, 1 or 2 inputs must be removed
    for(i = n; i < 3; i++){
      listsCreateWithBlock.removeInput('ADD' + i)
    }
  }
  else if (n >= 3){ // in this case, n-3 inputs must be added
    for (i = 3; i < n; i++){
      listsCreateWithBlock.appendInput_(1, 'ADD' + i)
    }
  }

  // and this will take the connection of the inputs
  var itemFields = []
  for (var i = 0; i < n; i++){
    itemFields[i] = listsCreateWithBlock.getInput('ADD' + i).connection
  }

  var itemBlocks = [] // this array will contain the blocks from which the list is created
  if (n < 2){
    itemBlocks[0] = value_statement(value.after('with').text())
  }
  else{
    itemBlocks[0] = value_statement(value.after('with').before('and').text())
    value.before('and').delete()
    for (var i = 1; i < n-1; i++){
      itemBlocks[i] = value_statement(value.after('and').before('and').text())
      value.matchOne('and').delete()
      value.before('and').delete()
    }
    itemBlocks[n-1] = value_statement(value.after('and').text())
  }

  // in this function there is not an error alert because the text_join block inputs accept any type of block
  var itemBlocksOutputs = []
  for (var i = 0; i < n; i++){
    itemBlocksOutputs[i] = itemBlocks[i].outputConnection
    itemFields[i].connect(itemBlocksOutputs[i])
  }

  return listsCreateWithBlock
}

function lists_repeat(value){
  var itemBlock = value_statement(value.after('with').before('repeated').text())
  var itemBlockOutput = itemBlock.outputConnection
  var timesBlock = value_statement(value.after('repeated').before('times').text())
  var timesBlockOutput = timesBlock.outputConnection

  var listsRepeatBlock = addBlock('lists_repeat')
  var itemField = listsRepeatBlock.getInput('ITEM').connection
  var timesField = listsRepeatBlock.getInput('NUM').connection

  if (timesBlockOutput.checkType(timesField)){ // no need to check itemField because it accepts every type of value
    itemField.connect(itemBlockOutput)
    timesField.connect(timesBlockOutput)
    return listsRepeatBlock
  }
  else {
    if (!timesBlockOutput.checkType(timesField)) {
      alert("The value '" + value.after('repeated').before('times').text() + "', representing the number of times to repeat '" + value.after('with').before('repeated').text() + "' to create a list, must be a number. Please check and retry")
    }
    alert('The blocks you are trying to set are incompatible. Please check and retry')

    workspace.getBlockById(listsRepeatBlock.id).dispose()
    workspace.getBlockById(itemBlock.id).dispose()
    workspace.getBlockById(timesBlock.id).dispose()

    return 0
  }
}

function lists_indexOf(value){
  var listVariableBlock = value_statement(value.after('list').text())
  var listVariableBlockOutput = listVariableBlock.outputConnection
  var itemToFindBlock = value_statement(value.after('of').before('in').text())
  var itemToFindBlockOutput = itemToFindBlock.outputConnection

  var listsIndexOfBlock = addBlock('lists_indexOf')
  var listVariableField = listsIndexOfBlock.getInput('VALUE').connection
  var itemToFindField = listsIndexOfBlock.getInput('FIND').connection

  if (value.has('first')){
    listsIndexOfBlock.setFieldValue('FIRST', 'END')
  }
  else if (value.has('last')){
    listsIndexOfBlock.setFieldValue('LAST', 'END')
  }

  if (listVariableBlockOutput.checkType(listVariableField)){ // no need to check itemField because it accepts every type of value
    listVariableField.connect(listVariableBlockOutput)
    itemToFindField.connect(itemToFindBlockOutput)

    return listsIndexOfBlock
  }
  else {
    alert("The value '" + value.after('list').text() + "', representing the list in which you want to find '" + value.after('of').before('in').text() + "', must be a list/array. Please check and retry")

    workspace.getBlockById(listVariableBlock.id).dispose()
    workspace.getBlockById(itemToFindBlock.id).dispose()
    workspace.getBlockById(listsIndexOfBlock.id).dispose()

    return 0
  }
}

function get(value){
  if ((value.has('get') | value.has('remove')) && value.has('item') && !value.has('sublist')) {var getBlock = lists_getIndex(value)}
  else if (value.has('sublist')){var getBlock = lists_getSublist(value)}
  return getBlock
}

function lists_getIndex(value){
  var listBlock = value_statement(value.after('in').text())
  var listBlockOutput = listBlock.outputConnection

  var listsGetIndexBlock = addBlock('lists_getIndex')
  var listField = listsGetIndexBlock.getInput('VALUE').connection
  var positionField = listsGetIndexBlock.getInput('AT').connection

  if (value.has('random')){
    listsGetIndexBlock.setFieldValue('RANDOM', 'WHERE')
  }
  else if (value.has('last')){
    listsGetIndexBlock.setFieldValue('LAST', 'WHERE')
  }
  else {
    if (value.has('get') && !value.has('remove')){ // case "get"
      var positionText = value.after('get').before('item').text()
      var position = value.after('get').before('item').numbers()
      listsGetIndexBlock.setFieldValue('GET', 'MODE')
    }
    else if (value.has('get') && value.has('remove')){ // case "get and remove")
      var positionText = value.after('remove').before('item').text()
      var position = value.after('remove').before('item').numbers()
      listsGetIndexBlock.setFieldValue('GET_REMOVE', 'MODE')
    }

    // now it'll check if the position given is valid or not
    if (position.length == 0) { // there is not a number, so it is not a valid position
      var positionValid = false
    }
    else { // there is a number, so it is a valid position
      var positionValid = true
      var positionBlock = value_statement(position.text())
      var positionBlockOutput = positionBlock.outputConnection
    }

    //var positionField = listsGetIndexBlock.getInput('AT').connection // this has to be here and not before because the input "AT" will be created or not depending on the previous else if statements

    if (value.has('start')){
      listsGetIndexBlock.setFieldValue('FROM_START', 'WHERE')
    }
    else if (value.has('end')){
      listsGetIndexBlock.setFieldValue('FROM_END', 'WHERE')
    }
    // this is needed to be checked here and not after with listBlockOutput because
    // in case it is "random/last item", position field and block do not exist
    if (positionValid){
      positionField.connect(positionBlockOutput)
    }
    else {
      alert("The value '" + positionText + "', representing the position of the item to take in '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      workspace.getBlockById(listBlock.id).dispose()
      workspace.getBlockById(listsGetIndexBlock.id).dispose()
      return 0
    }
  }

  if (listBlockOutput.checkType(listField)){
    listField.connect(listBlockOutput)
    return listsGetIndexBlock
  }
  else
  {
    alert("The value '" + value.after('in').text() + "', representing the list/array of which you want to take '" + positionText + "' item, must be a list/array. Please check and retry")

    workspace.getBlockById(listsGetIndexBlock.id).dispose()
    workspace.getBlockById(listBlock.id).dispose()

    return 0
  }
}

function lists_getSublist(value){
  var listBlock = value_statement(value.after('in').text())
  var listBlockOutput = listBlock.outputConnection

  var listsGetSublistBlock = addBlock('lists_getSublist')
  var position1Field = listsGetSublistBlock.getInput('AT1').connection
  var position2Field = listsGetSublistBlock.getInput('AT2').connection
  var listField = listsGetSublistBlock.getInput('LIST').connection


  if (value.match('start').wordCount() == 1){ // case there is just one "from start"
    if (value.match('start [.]', 0).text() == 'to'){ // case the "from start" is in the first letter
      listsGetSublistBlock.setFieldValue('FROM_START', 'WHERE1')
    }
    else if (value.match('start [.]', 0).text() == 'in'){ // case the "from start" is in the second letter
      listsGetSublistBlock.setFieldValue('FROM_START', 'WHERE2')
    }
  }
  else if (value.match('start').wordCount() == 2){ // case there is a "from start" in the two letters
    listsGetSublistBlock.setFieldValue('FROM_START', 'WHERE1')
    listsGetSublistBlock.setFieldValue('FROM_START', 'WHERE2')
  }
  if (value.match('end').wordCount() == 1){ // case there is just one "from end"
    if (value.match('end [.]', 0).text() == 'to'){ // case the "from end" is in the first letter
      listsGetSublistBlock.setFieldValue('FROM_END', 'WHERE1')
    }
    else if (value.match('end [.]', 0).text() == 'in'){ // case the "from end" is in the second letter
      listsGetSublistBlock.setFieldValue('FROM_END', 'WHERE2')
    }
  }
  else if (value.match('end').wordCount() == 2){ // case there is a "from end" in the two letters
    listsGetSublistBlock.setFieldValue('FROM_END', 'WHERE1')
    listsGetSublistBlock.setFieldValue('FROM_END', 'WHERE2')
  }

  // this creates a variable to check if the position 1 given is a number, otherwise it is not a valid instruction
  var position1 = value.after('from').before('item').numbers()
  if (position1.length == 0) { // there is not a number, so it is not a valid position
    var position1Valid = false
  }
  else { // there is a number, so it is a valid position
    var position1Valid = true
    var position1Block = value_statement(position1.text())
    var position1BlockOutput = position1Block.outputConnection
  }

  if (value.has('last')){
    listsGetSublistBlock.setFieldValue('LAST', 'WHERE2')
  }
  else{
    // this creates a variable to check if the position 2 given is a number, otherwise it is not a valid instruction
    var position2 = value.after('to').before('item').numbers()
    if (position2.length == 0) { // there is not a number, so it is not a valid position
      var position2Valid = false
    }
    else { // there is a number, so it is a valid position
      var position2Valid = true
      var position2Block = value_statement(position2.text())
      var position2BlockOutput = position2Block.outputConnection
    }

    if (position2Valid){
      position2Field.connect(position2BlockOutput)
    }
    else {
      alert("The value '" + value.after('to').before('item').text() + "', representing the final position of the sublist you want to get from '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      workspace.getBlockById(position1Block.id).dispose()
      workspace.getBlockById(listBlock.id).dispose()
      workspace.getBlockById(listsGetSublistBlock.id).dispose()
      return 0
    }
  }

  if (position1Valid && listBlockOutput.checkType(listField)){
    position1Field.connect(position1BlockOutput)
    listField.connect(listBlockOutput)
    return listsGetSublistBlock
  }
  else {
    if (!position1Valid){
      alert("The value '" + value.after('from').before('item').text() + "', representing the initial position of the sublist you want to get from '" + value.after('in').text() + "', must be an ordinal number. Please check and retry")
      workspace.getBlockById(listBlock.id).dispose()
      workspace.getBlockById(listsGetSublistBlock.id).dispose()
    }
    else if (!listBlockOutput.checkType(listField)) {
      alert("The value '" + value.after('in').text() + "', representing the list/array of which you want to get a substring, must be a list/array. Please check and retry")
      workspace.getBlockById(listBlock.id).dispose()
      workspace.getBlockById(position1Block.id).dispose()
      workspace.getBlockById(listsGetSublistBlock.id).dispose()
    }
    return 0
  }
}

function lists_split(value){
  var listsSplitBlock = addBlock('lists_split')
  var valueField = listsSplitBlock.getInput('INPUT').connection
  var delimiterField = listsSplitBlock.getInput('DELIM').connection
  if (value.match('[.] from', 0).text() == 'list'){
    var type = 'split' // will be necessary to check possible errors
    listsSplitBlock.setFieldValue('SPLIT', 'MODE')
    var valueBlock = value_statement(value.after('text').before('with').text())
  }
  else if (value.match('[.] from', 0).text() == 'text'){
    var type = 'join' // will be necessary to check possible errors
    listsSplitBlock.setFieldValue('JOIN', 'MODE')
    var valueBlock = value_statement(value.after('list').before('with').text())
  }
  var valueBlockOutput = valueBlock.outputConnection

  var delimiter = findDelimiter(value.after('with').before('as').text())
  var delimiterBlock = value_statement(delimiter)
  var delimiterBlockOutput = delimiterBlock.outputConnection

  if (valueBlockOutput.checkType(valueField) && delimiterBlockOutput.checkType(delimiterField)){
    valueField.connect(valueBlockOutput)
    delimiterField.connect(delimiterBlockOutput)
    return listsSplitBlock
  }
  else {
    if (!valueBlockOutput.checkType(valueField)) {
      if (type == 'split') {
        alert("The value '" + value.after('text').before('with').text() + "', representing the text from which you want to make a list, must be a text. Please check and retry")
      }
      else if (type == 'join') {
        alert("The value '" + value.after('list').before('with').text() + "', representing the list/array from which you want to make a text, must be a list/array. Please check and retry")
      }
    }
    else if (!delimiterBlockOutput.checkType(delimiterField)) {
      alert("The value '" + value.after('with').before('as').text() + "', representing the delimiter, must be a predefined delimiter. Please check and retry")
    }

    workspace.getBlockById(valueBlock.id).dispose()
    workspace.getBlockById(delimiterBlock.id).dispose()
    workspace.getBlockById(listsSplitBlock.id).dispose()

    return 0
  }
}

function lists_reverse(value){
  var listBlock = value_statement(value.after('list').text())
  var listBlockOutput = listBlock.outputConnection

  var listsReverseBlock = addBlock('lists_reverse')
  var listToReverseField = listsReverseBlock.getInput('LIST').connection

  if (listBlockOutput.checkType(listToReverseField)){
    listToReverseField.connect(listBlockOutput)
    return listsReverseBlock
  }
  else {
    alert("The value '" + value.after('list').text() + "', representing the list/array to reverse, must be a list/array. Please check and retry")

    workspace.getBlockById(listBlock.id).dispose()
    workspace.getBlockById(listsReverseBlock.id).dispose()

    return 0
  }
}

function lists_sort(value){
  var listsSortBlock = addBlock('lists_sort')
  var listField = listsSortBlock.getInput('LIST').connection

  if (value.has('case')){
    listsSortVBlock.setFieldValue('IGNORE_CASE', 'TYPE')
  }
  else if (value.has('numerically')){
    listsSortBlock.setFieldValue('NUMERIC', 'TYPE')
  }
  else if (value.has('alphabetically')){
    listsSortBlock.setFieldValue('TEXT', 'TYPE')
  }

  value.match('ignoring case').delete() // this simplifies the recognition of the listBlock position

  if (value.has('ascending')){
    listsSortBlock.setFieldValue('1', 'DIRECTION')
    var list = value.after('ascending').text()
  }
  else if (value.has('descending')){
    listsSortBlock.setFieldValue('-1', 'DIRECTION')
    var list = value.after('descending').text()
  }
  var listBlock = value_statement(list)
  var listBlockOutput = listBlock.outputConnection

  if (listBlockOutput.checkType(listField)){
    listField.connect(listBlockOutput)
    return listsSortBlock
  }
  else {
    alert("The value '" + list + "', representing the list/array to sort, must be a list/array. Please check and retry")

    workspace.getBlockById(listBlock.id).dispose()
    workspace.getBlockById(listsSortBlock.id).dispose()

    return 0
  }
}

function colour_random(){
  var colourRandomBlock = addBlock('colour_random')
  return colourRandomBlock
}

function colour_rgb(value){
  var numbers = value.numbers().toNumber().out('array')

  var redBlock = value_statement(numbers[0])
  var redBlockOutput = redBlock.outputConnection
  var greenBlock = value_statement(numbers[1])
  var greenBlockOutput = greenBlock.outputConnection
  var blueBlock = value_statement(numbers[2])
  var blueBlockOutput = blueBlock.outputConnection

  var colourRgbBlock = addBlock ('colour_rgb')
  var redField = colourRgbBlock.getInput('RED').connection
  var greenField = colourRgbBlock.getInput('GREEN').connection
  var blueField = colourRgbBlock.getInput('BLUE').connection

  if (numbers.length == 3){
    redField.connect(redBlockOutput)
    greenField.connect(greenBlockOutput)
    blueField.connect(blueBlockOutput)
    return colourRgbBlock
  }
  else {
    if (numbers.length == 2) {
      alert('One of the values introduced for the RGB colour block is not valid. Please check and retry')
    }
    else if (numbers.length == 1) {
      alert('Two of the values introduced for the RGB colour block are not valid. Please check and retry')
    }
    else if (numbers.length == 0) {
      alert('None of the values introduced for the RGB colour block are valid. Please check and retry')
    }
    workspace.getBlockById(redBlock.id).dispose()
    workspace.getBlockById(greenBlock.id).dispose()
    workspace.getBlockById(blueBlock.id).dispose()
    workspace.getBlockById(colourRgbBlock.id).dispose()

    return 0
  }
}
