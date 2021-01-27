// this is a function to show the code in javascript
function showCode(){
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    alert(code);
  }

// and this is to run it and show the result
function runCode(){
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    try {
      eval(code);
      } catch (e) {
      alert(e);
    }
}

// simple undo function
function undo(){
    workspace.undo(false);
}
// simple redo function
function redo(){
    workspace.undo(true);
}


function clearWorkspace(){
  workspace.clear();
}

// I create this variable in order to use it in the next two functions: copy and paste the workspace blocks
var myCopiedXml;

function copyWorkspace() {
myCopiedXml = Blockly.Xml.workspaceToDom(workspace);
}

function pasteWorkspace() {
  var blocks = myCopiedXml.getElementsByTagName("block")
  for (var i = 0; i < blocks.length; i++){
    // necessary condition to discard top block's child blocks (which don't have x nor y attributes)
    if ((blocks[i].getAttributeNode("x") != null) && (blocks[i].getAttributeNode("y") != null)){
      blocks[i].getAttributeNode("x").nodeValue = parseInt(myCopiedXml.getElementsByTagName("block")[i].getAttributeNode("x").nodeValue) + 20;
      blocks[i].getAttributeNode("y").nodeValue = parseInt(myCopiedXml.getElementsByTagName("block")[i].getAttributeNode("y").nodeValue) + 20;
    }
  }

Blockly.Xml.domToWorkspace(workspace, myCopiedXml);
}

// adding a simple block of any type
function addBlock (blockType){
  var insertedBlock = workspace.newBlock(blockType);
  insertedBlock.initSvg();
  insertedBlock.render();
  return insertedBlock;
}

// adding a variable
function addVariable(variableName, variableType){
  var variable = workspace.createVariable(variableName, variableType);
  return variable
}
