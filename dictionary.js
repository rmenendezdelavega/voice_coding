function findValue (word){
    var coupleFound = []
    valueDictionary.forEach(words => {
        words.words.forEach(val => {
            if(val === word){
                coupleFound[0] = words.keyWord;
                coupleFound[1] = word;
            }
        })
    });
    return coupleFound
}

// this function finds any coincidence between groups from 1 to n words within the text input and the valueDictionary
function findCoincidence(text){
    var n = 4 // this is the maximum number of words a coincidence can have
    var foundCoincidence = [] // first element will be the value type (keyWord) and the second one, the word/s found in the dictionary (word)
    for(i=0; i<n; i++){
        foundCoincidence = findValue(text.terms().slice(0,n-i).text())
        if (foundCoincidence[0] != null){break}
    }
    if (foundCoincidence[0] == null){
        text.firstTerms().delete()
        if (text.wordCount()>0){
            foundCoincidence = findCoincidence(text)
        }
    }
    return foundCoincidence
}

const valueDictionary = [
    {keyWord:'logic_boolean', words:['true','false']},
    {keyWord:'logic_null', words:['null']},
    {keyWord:'logic_compare', words:['equal to', 'lower than', 'greater than']},
    {keyWord:'logic_operation', words:['and', 'or']},
    {keyWord:'logic_negate', words:['not']},
    {keyWord:'logic_ternary', words:['test']},
    {keyWord:'math_number_property', words:['even', 'odd', 'prime', 'whole', 'positive', 'negative', 'divisible']},
    {keyWord:'math_number', words:[]},
    {keyWord:'math_arithmetic', words:['plus', 'minus', 'times', 'divided', 'power']},
    {keyWord:'math_single', words:['square root', 'absolute value', 'natural logarithm', 'common logarithm']},
    {keyWord:'math_trig', words:['sine', 'cosine', 'tangent']},
    {keyWord:'math_constant', words:['pi', 'euler', 'golden ratio', 'infinite', 'infinity']},
    {keyWord:'math_round', words:['round']},
    {keyWord:'math_on_list', words:['summation', 'minimum', 'maximum', 'average', 'median', 'modes', 'standard deviation', 'random item']},
    {keyWord:'math_modulo', words:['remainder']},
    {keyWord:'math_constrain', words:['constrained']},
    {keyWord:'math_random_int', words:['random integer']},
    {keyWord:'math_random_float', words:['random fraction']},
    {keyWord:'text_join', words:['create text']},
    {keyWord:'text_length', words:['length of']},
    {keyWord:'text_isEmpty', words:['is empty']},
    {keyWord:'occurrence', words:['occurrence']}, // function occurrence() will determine if it refers to text_indexOf or lists_indexOf
    {keyWord:'text_charAt', words:['letter']},
    {keyWord:'text_getSubstring', words:['substring']},
    {keyWord:'text_changeCase', words:['case', 'uppercase', 'lowercase', 'titlecase']},
    {keyWord:'text_trim', words:['trim']},
    {keyWord:'text_count', words:['count']},
    {keyWord:'text_replace', words:['replace']},
    {keyWord:'reverse', words:['reverse']}, // function reverse() will determine if it refers to text_reverse or lists_reverse
    {keyWord:'text_prompt_ext', words:['prompt']},
    {keyWord:'lists_create_empty', words:['empty list']},
    {keyWord:'lists_create_with', words:['create list']},
    {keyWord:'lists_repeat', words:['repeated']},
    {keyWord:'lists_indexOf', words:['']},
    {keyWord:'get', words:['get']}, // function get() will determine if it refers to lists_getIndex or lists_getSublist
    {keyWord:'lists_split', words:['make list from', 'make a list from', 'make text from', 'make a text from']},
    {keyWord:'lists_sort', words:['sort']},
    {keyWord:'colour_random', words:['random colour']},
    {keyWord:'colour_rgb', words:['colour with']},
];

function findDelimiter (word){
  var delimiter
    delimiterDictionary.forEach(words => {
        words.words.forEach(val => {
            if(val === word){
                delimiter = words.keyWord;
            }
        })
    });
    return delimiter
}

const delimiterDictionary = [
    {keyWord:',', words:['comma']},
    {keyWord:'.', words:['dot']},
    {keyWord:':', words:['colon']},
    {keyWord:';', words:['semicolon']},
];

function findInstruction (word){
  var instruction = null
    instructionDictionary.forEach(words => {
        words.words.forEach(val => {
            if(val === word){
                instruction = words.keyWord;
            }
        })
    });
    return instruction
}

const instructionDictionary = [
    {keyWord:'showCode', words:['show code']},
    {keyWord:'runCode', words:['run code']},
    {keyWord:'undo', words:['undo']},
    {keyWord:'redo', words:['redo']},
    {keyWord:'clearWorkspace', words:['clear workspace']},
    {keyWord:'copyWorkspace', words:['copy workspace']},
    {keyWord:'pasteWorkspace', words:['paste workspace']},
];


function findOperation (word){
  var operation = []
    operationDictionary.forEach(words => {
        words.words.forEach(val => {
            if(val === word){
                operation[0] = words.keyWord;
                operation[1] = word;
            }
        })
    });
    return operation
}

const operationDictionary = [
    {keyWord:'set_statement', words:['set', 'initialize', 'create']},
    {keyWord:'change_statement', words:['']},
    {keyWord:'if_statement', words:['if']},
    {keyWord:'repeat_loop_statement', words:['repeat']},
    {keyWord:'whileUntil_loop_statement', words:['while', 'until']},
    {keyWord:'for_loop_statement', words:['count']},
    {keyWord:'foreach_loop_statement', words:['for']},
    {keyWord:'flow_statement', words:['break', 'continue']},
    {keyWord:'text_append_statement', words:['append', 'add']},
    {keyWord:'text_print_statement', words:['print']},
    {keyWord:'remove_from_list_statement', words:['remove', 'eliminate', 'delete']},
    {keyWord:'lists_setIndex_statement', words:['in']},
];
