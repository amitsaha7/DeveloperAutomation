Formatter.FormatterWorkerPool=class{constructor(){this._taskQueue=[];this._workerTasks=new Map();}
_createWorker(){const worker=new Common.Worker('formatter_worker');worker.onmessage=this._onWorkerMessage.bind(this,worker);worker.onerror=this._onWorkerError.bind(this,worker);return worker;}
_processNextTask(){if(!this._taskQueue.length)
return;let freeWorker=this._workerTasks.keysArray().find(worker=>!this._workerTasks.get(worker));if(!freeWorker&&this._workerTasks.size<Formatter.FormatterWorkerPool.MaxWorkers)
freeWorker=this._createWorker();if(!freeWorker)
return;const task=this._taskQueue.shift();this._workerTasks.set(freeWorker,task);freeWorker.postMessage({method:task.method,params:task.params});}
_onWorkerMessage(worker,event){const task=this._workerTasks.get(worker);if(task.isChunked&&event.data&&!event.data['isLastChunk']){task.callback(event.data);return;}
this._workerTasks.set(worker,null);this._processNextTask();task.callback(event.data?event.data:null);}
_onWorkerError(worker,event){console.error(event);const task=this._workerTasks.get(worker);worker.terminate();this._workerTasks.delete(worker);const newWorker=this._createWorker();this._workerTasks.set(newWorker,null);this._processNextTask();task.callback(null);}
_runChunkedTask(methodName,params,callback){const task=new Formatter.FormatterWorkerPool.Task(methodName,params,onData,true);this._taskQueue.push(task);this._processNextTask();function onData(data){if(!data){callback(true,null);return;}
const isLastChunk=!!data['isLastChunk'];const chunk=data['chunk'];callback(isLastChunk,chunk);}}
_runTask(methodName,params){let callback;const promise=new Promise(fulfill=>callback=fulfill);const task=new Formatter.FormatterWorkerPool.Task(methodName,params,callback,false);this._taskQueue.push(task);this._processNextTask();return promise;}
parseJSONRelaxed(content){return this._runTask('parseJSONRelaxed',{content:content});}
parseSCSS(content){return this._runTask('parseSCSS',{content:content}).then(rules=>rules||[]);}
format(mimeType,content,indentString){const parameters={mimeType:mimeType,content:content,indentString:indentString};return(this._runTask('format',parameters));}
javaScriptIdentifiers(content){return this._runTask('javaScriptIdentifiers',{content:content}).then(ids=>ids||[]);}
evaluatableJavaScriptSubstring(content){return this._runTask('evaluatableJavaScriptSubstring',{content:content}).then(text=>text||'');}
preprocessTopLevelAwaitExpressions(content){return this._runTask('preprocessTopLevelAwaitExpressions',{content:content}).then(text=>text||'');}
parseCSS(content,callback){this._runChunkedTask('parseCSS',{content:content},onDataChunk);function onDataChunk(isLastChunk,data){const rules=(data||[]);callback(isLastChunk,rules);}}
javaScriptOutline(content,callback){this._runChunkedTask('javaScriptOutline',{content:content},onDataChunk);function onDataChunk(isLastChunk,data){const items=(data||[]);callback(isLastChunk,items);}}
outlineForMimetype(content,mimeType,callback){switch(mimeType){case'text/html':case'text/javascript':this.javaScriptOutline(content,javaScriptCallback);return true;case'text/css':this.parseCSS(content,cssCallback);return true;}
return false;function javaScriptCallback(isLastChunk,items){callback(isLastChunk,items.map(item=>({line:item.line,column:item.column,title:item.name,subtitle:item.arguments})));}
function cssCallback(isLastChunk,rules){callback(isLastChunk,rules.map(rule=>({line:rule.lineNumber,column:rule.columnNumber,title:rule.selectorText||rule.atRule})));}}
findLastExpression(content){return(this._runTask('findLastExpression',{content}));}
findLastFunctionCall(content){return(this._runTask('findLastFunctionCall',{content}));}
argumentsList(content){return(this._runTask('argumentsList',{content}));}};Formatter.FormatterWorkerPool.MaxWorkers=2;Formatter.FormatterWorkerPool.Task=class{constructor(method,params,callback,isChunked){this.method=method;this.params=params;this.callback=callback;this.isChunked=isChunked;}};Formatter.FormatterWorkerPool.FormatResult=class{constructor(){this.content;this.mapping;}};Formatter.FormatterWorkerPool.FormatMapping;Formatter.FormatterWorkerPool.OutlineItem;Formatter.FormatterWorkerPool.JSOutlineItem=class{constructor(){this.name;this.arguments;this.line;this.column;}};Formatter.FormatterWorkerPool.TextRange;Formatter.FormatterWorkerPool.CSSProperty=class{constructor(){this.name;this.nameRange;this.value;this.valueRange;this.range;this.disabled;}};Formatter.FormatterWorkerPool.CSSStyleRule=class{constructor(){this.selectorText;this.styleRange;this.lineNumber;this.columnNumber;this.properties;}};Formatter.FormatterWorkerPool.CSSAtRule;Formatter.FormatterWorkerPool.CSSRule;Formatter.FormatterWorkerPool.SCSSProperty=class{constructor(){this.range;this.name;this.value;this.disabled;}};Formatter.FormatterWorkerPool.SCSSRule=class{constructor(){this.selectors;this.properties;this.styleRange;}};Formatter.formatterWorkerPool=function(){if(!Formatter._formatterWorkerPool)
Formatter._formatterWorkerPool=new Formatter.FormatterWorkerPool();return Formatter._formatterWorkerPool;};;Formatter.Formatter=function(){};Formatter.Formatter.format=function(contentType,mimeType,content,callback){if(contentType.isDocumentOrScriptOrStyleSheet())
new Formatter.ScriptFormatter(mimeType,content,callback);else
new Formatter.ScriptIdentityFormatter(mimeType,content,callback);};Formatter.Formatter.locationToPosition=function(lineEndings,lineNumber,columnNumber){const position=lineNumber?lineEndings[lineNumber-1]+1:0;return position+columnNumber;};Formatter.Formatter.positionToLocation=function(lineEndings,position){const lineNumber=lineEndings.upperBound(position-1);let columnNumber;if(!lineNumber)
columnNumber=position;else
columnNumber=position-lineEndings[lineNumber-1]-1;return[lineNumber,columnNumber];};Formatter.ScriptFormatter=class{constructor(mimeType,content,callback){content=content.replace(/\r\n?|[\n\u2028\u2029]/g,'\n').replace(/^\uFEFF/,'');this._callback=callback;this._originalContent=content;Formatter.formatterWorkerPool().format(mimeType,content,Common.moduleSetting('textEditorIndent').get()).then(this._didFormatContent.bind(this));}
_didFormatContent(formatResult){const sourceMapping=new Formatter.FormatterSourceMappingImpl(this._originalContent.computeLineEndings(),formatResult.content.computeLineEndings(),formatResult.mapping);this._callback(formatResult.content,sourceMapping);}};Formatter.ScriptIdentityFormatter=class{constructor(mimeType,content,callback){callback(content,new Formatter.IdentityFormatterSourceMapping());}};Formatter.FormatterSourceMapping=function(){};Formatter.FormatterSourceMapping.prototype={originalToFormatted(lineNumber,columnNumber){},formattedToOriginal(lineNumber,columnNumber,offset){}};Formatter.IdentityFormatterSourceMapping=class{originalToFormatted(lineNumber,columnNumber){return[lineNumber,columnNumber||0];}
formattedToOriginal(lineNumber,columnNumber,offset){return[lineNumber,columnNumber||0];}};Formatter.FormatterSourceMappingImpl=class{constructor(originalLineEndings,formattedLineEndings,mapping){this._originalLineEndings=originalLineEndings;this._formattedLineEndings=formattedLineEndings;this._mapping=mapping;}
originalToFormatted(lineNumber,columnNumber){const originalPosition=Formatter.Formatter.locationToPosition(this._originalLineEndings,lineNumber,columnNumber||0);const formattedPosition=this._convertPosition(this._mapping.original,this._mapping.formatted,originalPosition||0);return Formatter.Formatter.positionToLocation(this._formattedLineEndings,formattedPosition);}
formattedToOriginal(lineNumber,columnNumber,offset){const formattedPosition=Formatter.Formatter.locationToPosition(this._formattedLineEndings,lineNumber,columnNumber||0);const originalPosition=this._convertPosition(this._mapping.formatted,this._mapping.original,formattedPosition);return Formatter.Formatter.positionToLocation(this._originalLineEndings,(originalPosition||0)+(offset||0));}
_convertPosition(positions1,positions2,position){const index=positions1.upperBound(position)-1;let convertedPosition=positions2[index]+position-positions1[index];if(index<positions2.length-1&&convertedPosition>positions2[index+1])
convertedPosition=positions2[index+1];return convertedPosition;}};;