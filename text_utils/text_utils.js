import'../common/common.js';import{StringUtilities}from'../platform/platform.js';class ContentProvider{contentURL(){throw new Error('not implemented');}
contentType(){throw new Error('not implemented');}
contentEncoded(){throw new Error('not implemented');}
requestContent(){throw new Error('not implemented');}
searchInContent(query,caseSensitive,isRegex){throw new Error('not implemented');}}
class SearchMatch{constructor(lineNumber,lineContent){this.lineNumber=lineNumber;this.lineContent=lineContent;}}
const contentAsDataURL=function(content,mimeType,contentEncoded,charset){const maxDataUrlSize=1024*1024;if(content===undefined||content===null||content.length>maxDataUrlSize){return null;}
return'data:'+mimeType+(charset?';charset='+charset:'')+(contentEncoded?';base64':'')+','+
content;};let DeferredContent;var ContentProvider$1=Object.freeze({__proto__:null,ContentProvider:ContentProvider,SearchMatch:SearchMatch,contentAsDataURL:contentAsDataURL,DeferredContent:DeferredContent});class TextCursor{constructor(lineEndings){this._lineEndings=lineEndings;this._offset=0;this._lineNumber=0;this._columnNumber=0;}
advance(offset){this._offset=offset;while(this._lineNumber<this._lineEndings.length&&this._lineEndings[this._lineNumber]<this._offset){++this._lineNumber;}
this._columnNumber=this._lineNumber?this._offset-this._lineEndings[this._lineNumber-1]-1:this._offset;}
offset(){return this._offset;}
resetTo(offset){this._offset=offset;this._lineNumber=this._lineEndings.lowerBound(offset);this._columnNumber=this._lineNumber?this._offset-this._lineEndings[this._lineNumber-1]-1:this._offset;}
lineNumber(){return this._lineNumber;}
columnNumber(){return this._columnNumber;}}
var TextCursor$1=Object.freeze({__proto__:null,TextCursor:TextCursor});class TextRange{constructor(startLine,startColumn,endLine,endColumn){this.startLine=startLine;this.startColumn=startColumn;this.endLine=endLine;this.endColumn=endColumn;}
static createFromLocation(line,column){return new TextRange(line,column,line,column);}
static fromObject(serializedTextRange){return new TextRange(serializedTextRange.startLine,serializedTextRange.startColumn,serializedTextRange.endLine,serializedTextRange.endColumn);}
static comparator(range1,range2){return range1.compareTo(range2);}
static fromEdit(oldRange,newText){let endLine=oldRange.startLine;let endColumn=oldRange.startColumn+newText.length;const lineEndings=StringUtilities.findLineEndingIndexes(newText);if(lineEndings.length>1){endLine=oldRange.startLine+lineEndings.length-1;const len=lineEndings.length;endColumn=lineEndings[len-1]-lineEndings[len-2]-1;}
return new TextRange(oldRange.startLine,oldRange.startColumn,endLine,endColumn);}
isEmpty(){return this.startLine===this.endLine&&this.startColumn===this.endColumn;}
immediatelyPrecedes(range){if(!range){return false;}
return this.endLine===range.startLine&&this.endColumn===range.startColumn;}
immediatelyFollows(range){if(!range){return false;}
return range.immediatelyPrecedes(this);}
follows(range){return(range.endLine===this.startLine&&range.endColumn<=this.startColumn)||range.endLine<this.startLine;}
get linesCount(){return this.endLine-this.startLine;}
collapseToEnd(){return new TextRange(this.endLine,this.endColumn,this.endLine,this.endColumn);}
collapseToStart(){return new TextRange(this.startLine,this.startColumn,this.startLine,this.startColumn);}
normalize(){if(this.startLine>this.endLine||(this.startLine===this.endLine&&this.startColumn>this.endColumn)){return new TextRange(this.endLine,this.endColumn,this.startLine,this.startColumn);}
return this.clone();}
clone(){return new TextRange(this.startLine,this.startColumn,this.endLine,this.endColumn);}
serializeToObject(){const serializedTextRange={};serializedTextRange.startLine=this.startLine;serializedTextRange.startColumn=this.startColumn;serializedTextRange.endLine=this.endLine;serializedTextRange.endColumn=this.endColumn;return serializedTextRange;}
compareTo(other){if(this.startLine>other.startLine){return 1;}
if(this.startLine<other.startLine){return-1;}
if(this.startColumn>other.startColumn){return 1;}
if(this.startColumn<other.startColumn){return-1;}
return 0;}
compareToPosition(lineNumber,columnNumber){if(lineNumber<this.startLine||(lineNumber===this.startLine&&columnNumber<this.startColumn)){return-1;}
if(lineNumber>this.endLine||(lineNumber===this.endLine&&columnNumber>this.endColumn)){return 1;}
return 0;}
equal(other){return this.startLine===other.startLine&&this.endLine===other.endLine&&this.startColumn===other.startColumn&&this.endColumn===other.endColumn;}
relativeTo(line,column){const relative=this.clone();if(this.startLine===line){relative.startColumn-=column;}
if(this.endLine===line){relative.endColumn-=column;}
relative.startLine-=line;relative.endLine-=line;return relative;}
relativeFrom(line,column){const relative=this.clone();if(this.startLine===0){relative.startColumn+=column;}
if(this.endLine===0){relative.endColumn+=column;}
relative.startLine+=line;relative.endLine+=line;return relative;}
rebaseAfterTextEdit(originalRange,editedRange){console.assert(originalRange.startLine===editedRange.startLine);console.assert(originalRange.startColumn===editedRange.startColumn);const rebase=this.clone();if(!this.follows(originalRange)){return rebase;}
const lineDelta=editedRange.endLine-originalRange.endLine;const columnDelta=editedRange.endColumn-originalRange.endColumn;rebase.startLine+=lineDelta;rebase.endLine+=lineDelta;if(rebase.startLine===editedRange.endLine){rebase.startColumn+=columnDelta;}
if(rebase.endLine===editedRange.endLine){rebase.endColumn+=columnDelta;}
return rebase;}
toString(){return JSON.stringify(this);}
containsLocation(lineNumber,columnNumber){if(this.startLine===this.endLine){return this.startLine===lineNumber&&this.startColumn<=columnNumber&&columnNumber<=this.endColumn;}
if(this.startLine===lineNumber){return this.startColumn<=columnNumber;}
if(this.endLine===lineNumber){return columnNumber<=this.endColumn;}
return this.startLine<lineNumber&&lineNumber<this.endLine;}}
class SourceRange{constructor(offset,length){this.offset=offset;this.length=length;}}
class SourceEdit{constructor(sourceURL,oldRange,newText){this.sourceURL=sourceURL;this.oldRange=oldRange;this.newText=newText;}
static comparator(edit1,edit2){return TextRange.comparator(edit1.oldRange,edit2.oldRange);}
newRange(){return TextRange.fromEdit(this.oldRange,this.newText);}}
var TextRange$1=Object.freeze({__proto__:null,TextRange:TextRange,SourceRange:SourceRange,SourceEdit:SourceEdit});class Text{constructor(value){this._value=value;}
lineEndings(){if(!this._lineEndings){this._lineEndings=StringUtilities.findLineEndingIndexes(this._value);}
return this._lineEndings;}
value(){return this._value;}
lineCount(){const lineEndings=this.lineEndings();return lineEndings.length;}
offsetFromPosition(lineNumber,columnNumber){return(lineNumber?this.lineEndings()[lineNumber-1]+1:0)+columnNumber;}
positionFromOffset(offset){const lineEndings=this.lineEndings();const lineNumber=lineEndings.lowerBound(offset);return{lineNumber:lineNumber,columnNumber:offset-(lineNumber&&(lineEndings[lineNumber-1]+1))};}
lineAt(lineNumber){const lineEndings=this.lineEndings();const lineStart=lineNumber>0?lineEndings[lineNumber-1]+1:0;const lineEnd=lineEndings[lineNumber];let lineContent=this._value.substring(lineStart,lineEnd);if(lineContent.length>0&&lineContent.charAt(lineContent.length-1)==='\r'){lineContent=lineContent.substring(0,lineContent.length-1);}
return lineContent;}
toSourceRange(range){const start=this.offsetFromPosition(range.startLine,range.startColumn);const end=this.offsetFromPosition(range.endLine,range.endColumn);return new SourceRange(start,end-start);}
toTextRange(sourceRange){const cursor=new TextCursor(this.lineEndings());const result=TextRange.createFromLocation(0,0);cursor.resetTo(sourceRange.offset);result.startLine=cursor.lineNumber();result.startColumn=cursor.columnNumber();cursor.advance(sourceRange.offset+sourceRange.length);result.endLine=cursor.lineNumber();result.endColumn=cursor.columnNumber();return result;}
replaceRange(range,replacement){const sourceRange=this.toSourceRange(range);return this._value.substring(0,sourceRange.offset)+replacement+
this._value.substring(sourceRange.offset+sourceRange.length);}
extract(range){const sourceRange=this.toSourceRange(range);return this._value.substr(sourceRange.offset,sourceRange.length);}}
let Position;var Text$1=Object.freeze({__proto__:null,Text:Text,Position:Position});const Utils={get _keyValueFilterRegex(){return/(?:^|\s)(\-)?([\w\-]+):([^\s]+)/;},get _regexFilterRegex(){return/(?:^|\s)(\-)?\/([^\s]+)\//;},get _textFilterRegex(){return/(?:^|\s)(\-)?([^\s]+)/;},get _SpaceCharRegex(){return/\s/;},get Indent(){return{TwoSpaces:'  ',FourSpaces:'    ',EightSpaces:'        ',TabCharacter:'\t'};},isStopChar:function(char){return(char>' '&&char<'0')||(char>'9'&&char<'A')||(char>'Z'&&char<'_')||(char>'_'&&char<'a')||(char>'z'&&char<='~');},isWordChar:function(char){return!Utils.isStopChar(char)&&!Utils.isSpaceChar(char);},isSpaceChar:function(char){return Utils._SpaceCharRegex.test(char);},isWord:function(word){for(let i=0;i<word.length;++i){if(!Utils.isWordChar(word.charAt(i))){return false;}}
return true;},isOpeningBraceChar:function(char){return char==='('||char==='{';},isClosingBraceChar:function(char){return char===')'||char==='}';},isBraceChar:function(char){return Utils.isOpeningBraceChar(char)||Utils.isClosingBraceChar(char);},textToWords:function(text,isWordChar,wordCallback){let startWord=-1;for(let i=0;i<text.length;++i){if(!isWordChar(text.charAt(i))){if(startWord!==-1){wordCallback(text.substring(startWord,i));}
startWord=-1;}else if(startWord===-1){startWord=i;}}
if(startWord!==-1){wordCallback(text.substring(startWord));}},lineIndent:function(line){let indentation=0;while(indentation<line.length&&Utils.isSpaceChar(line.charAt(indentation))){++indentation;}
return line.substr(0,indentation);},isUpperCase:function(text){return text===text.toUpperCase();},isLowerCase:function(text){return text===text.toLowerCase();},splitStringByRegexes(text,regexes){const matches=[];const globalRegexes=[];for(let i=0;i<regexes.length;i++){const regex=regexes[i];if(!regex.global){globalRegexes.push(new RegExp(regex.source,regex.flags?regex.flags+'g':'g'));}else{globalRegexes.push(regex);}}
doSplit(text,0,0);return matches;function doSplit(text,regexIndex,startIndex){if(regexIndex>=globalRegexes.length){matches.push({value:text,position:startIndex,regexIndex:-1,captureGroups:[]});return;}
const regex=globalRegexes[regexIndex];let currentIndex=0;let result;regex.lastIndex=0;while((result=regex.exec(text))!==null){const stringBeforeMatch=text.substring(currentIndex,result.index);if(stringBeforeMatch){doSplit(stringBeforeMatch,regexIndex+1,startIndex+currentIndex);}
const match=result[0];matches.push({value:match,position:startIndex+result.index,regexIndex:regexIndex,captureGroups:result.slice(1)});currentIndex=result.index+match.length;}
const stringAfterMatches=text.substring(currentIndex);if(stringAfterMatches){doSplit(stringAfterMatches,regexIndex+1,startIndex+currentIndex);}}}};class FilterParser{constructor(keys){this._keys=keys;}
static cloneFilter(filter){return{key:filter.key,text:filter.text,regex:filter.regex,negative:filter.negative};}
parse(query){const splitResult=Utils.splitStringByRegexes(query,[Utils._keyValueFilterRegex,Utils._regexFilterRegex,Utils._textFilterRegex]);const filters=[];for(let i=0;i<splitResult.length;i++){const regexIndex=splitResult[i].regexIndex;if(regexIndex===-1){continue;}
const result=splitResult[i].captureGroups;if(regexIndex===0){if(this._keys.indexOf((result[1]))!==-1){filters.push({key:result[1],regex:undefined,text:result[2],negative:!!result[0]});}else{filters.push({key:undefined,regex:undefined,text:result[1]+':'+result[2],negative:!!result[0]});}}else if(regexIndex===1){try{filters.push({key:undefined,regex:new RegExp((result[1]),'i'),text:undefined,negative:!!result[0]});}catch(e){filters.push({key:undefined,regex:undefined,text:'/'+result[1]+'/',negative:!!result[0]});}}else if(regexIndex===2){filters.push({key:undefined,regex:undefined,text:result[1],negative:!!result[0]});}}
return filters;}}
class BalancedJSONTokenizer{constructor(callback,findMultiple){this._callback=callback;this._index=0;this._balance=0;this._buffer='';this._findMultiple=findMultiple||false;this._closingDoubleQuoteRegex=/[^\\](?:\\\\)*"/g;}
write(chunk){this._buffer+=chunk;const lastIndex=this._buffer.length;const buffer=this._buffer;let index;for(index=this._index;index<lastIndex;++index){const character=buffer[index];if(character==='"'){this._closingDoubleQuoteRegex.lastIndex=index;if(!this._closingDoubleQuoteRegex.test(buffer)){break;}
index=this._closingDoubleQuoteRegex.lastIndex-1;}else if(character==='{'){++this._balance;}else if(character==='}'){--this._balance;if(this._balance<0){this._reportBalanced();return false;}
if(!this._balance){this._lastBalancedIndex=index+1;if(!this._findMultiple){break;}}}else if(character===']'&&!this._balance){this._reportBalanced();return false;}}
this._index=index;this._reportBalanced();return true;}
_reportBalanced(){if(!this._lastBalancedIndex){return;}
this._callback(this._buffer.slice(0,this._lastBalancedIndex));this._buffer=this._buffer.slice(this._lastBalancedIndex);this._index-=this._lastBalancedIndex;this._lastBalancedIndex=0;}
remainder(){return this._buffer;}}
class TokenizerFactory{createTokenizer(mimeType){throw new Error('not implemented');}}
function isMinified(text){const kMaxNonMinifiedLength=500;let linesToCheck=10;let lastPosition=0;do{let eolIndex=text.indexOf('\n',lastPosition);if(eolIndex<0){eolIndex=text.length;}
if(eolIndex-lastPosition>kMaxNonMinifiedLength&&text.substr(lastPosition,3)!=='//#'){return true;}
lastPosition=eolIndex+1;}while(--linesToCheck>=0&&lastPosition<text.length);linesToCheck=10;lastPosition=text.length;do{let eolIndex=text.lastIndexOf('\n',lastPosition);if(eolIndex<0){eolIndex=0;}
if(lastPosition-eolIndex>kMaxNonMinifiedLength&&text.substr(lastPosition,3)!=='//#'){return true;}
lastPosition=eolIndex-1;}while(--linesToCheck>=0&&lastPosition>0);return false;}
const performSearchInContent=function(content,query,caseSensitive,isRegex){const regex=createSearchRegex(query,caseSensitive,isRegex);const text=new Text(content);const result=[];for(let i=0;i<text.lineCount();++i){const lineContent=text.lineAt(i);regex.lastIndex=0;if(regex.exec(lineContent)){result.push(new SearchMatch(i,lineContent));}}
return result;};let ParsedFilter;var TextUtils=Object.freeze({__proto__:null,Utils:Utils,FilterParser:FilterParser,BalancedJSONTokenizer:BalancedJSONTokenizer,TokenizerFactory:TokenizerFactory,isMinified:isMinified,performSearchInContent:performSearchInContent,ParsedFilter:ParsedFilter});class StaticContentProvider{constructor(contentURL,contentType,lazyContent){this._contentURL=contentURL;this._contentType=contentType;this._lazyContent=lazyContent;}
static fromString(contentURL,contentType,content){const lazyContent=()=>Promise.resolve({content,isEncoded:false});return new StaticContentProvider(contentURL,contentType,lazyContent);}
contentURL(){return this._contentURL;}
contentType(){return this._contentType;}
contentEncoded(){return Promise.resolve(false);}
requestContent(){return this._lazyContent();}
async searchInContent(query,caseSensitive,isRegex){const{content}=(await this._lazyContent());return content?performSearchInContent(content,query,caseSensitive,isRegex):[];}}
var StaticContentProvider$1=Object.freeze({__proto__:null,StaticContentProvider:StaticContentProvider});export{ContentProvider$1 as ContentProvider,StaticContentProvider$1 as StaticContentProvider,Text$1 as Text,TextCursor$1 as TextCursor,TextRange$1 as TextRange,TextUtils};