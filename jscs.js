(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    return mod(require("tern/lib/infer"), require("tern/lib/tern"), require("jscs/lib/string-checker"));
  }
  if (typeof define == "function" && define.amd) // AMD
    return define([ "tern/lib/infer", "tern/lib/tern", "jshint/lib/jshint" ], mod);
  mod(tern, tern, JscsStringChecker);
})(function(infer, tern, StringChecker) {
  "use strict";
  
  tern.registerPlugin("jscs", function(server, options) {

  });
  
  function validate(server, query, file, messages) {
    
    function getSeverity(error) {
      switch(error.severity) {
        case 1:
          return "warning";
        case 2:
          return "error";     
        default:
          return "error";
      }    
    }

    function makeError(message) {
	  var from = tern.resolvePos(file, {line: message.line - 1, ch: message.column -2}), to = from; 
	  try {
	    to = tern.resolvePos(file, {line: message.line - 1, ch: message.column -1});
	  } catch(e) {}
  	  var error = {
	    message: message.message,
	    severity: getSeverity(message),
	    from: tern.outputPos(query, file, from),
	    to: tern.outputPos(query, file, to)	      
	  }
	  if (!query.groupByFiles) error.file = file.name;
	  return error;
    }

    var checker = new StringChecker();
    checker.registerDefaultRules();
    var options = {};//{preset: presetSelect.value};
    var indent = null; //indentSelect.value;
    if (indent) {
        if (!isNaN(parseInt(indent))) {
            indent = parseInt(indent);
        }
        options.validateIndentation = indent;
    }
    checker.configure(options);
    
    var text = file.text, name = file.name;
    var errors = checker.checkString(text, name);
    if (errors) {
      for (var i = 0; i < errors.getErrorCount(); i++) {
        var error = errors.getErrorList()[i];
        messages.push(makeError(error));
      }
    }
  }
  
  tern.defineQueryType("jscs", {
    takesFile: true,
    run: function(server, query, file) {
      try {
        var messages = [];
        validate(server, query, file, messages);
        return {messages: messages};
      } catch(err) {
        console.error(err.stack);
        return {messages: []};
      }        
    }
  });
  
  tern.defineQueryType("jscs-full", {
    run: function(server, query) {
      try {
        var messages = [], files = server.files, groupByFiles = query.groupByFiles == true;
        for (var i = 0; i < files.length; ++i) {
          var messagesFile = groupByFiles ? [] : messages, file = files[i];
          validate(server, query, file, messagesFile);
          if (groupByFiles) messages.push({file:file.name, messages: messagesFile});
        }        
        return {messages: messages};
      } catch(err) {
        console.error(err.stack);
        return {messages: []};
      }
    }
  });
  
});