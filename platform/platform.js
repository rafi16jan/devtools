const escapeCharacters=(inputString,charsToEscape)=>{let foundChar=false;for(let i=0;i<charsToEscape.length;++i){if(inputString.indexOf(charsToEscape.charAt(i))!==-1){foundChar=true;break;}}
if(!foundChar){return String(inputString);}
let result='';for(let i=0;i<inputString.length;++i){if(charsToEscape.indexOf(inputString.charAt(i))!==-1){result+='\\';}
result+=inputString.charAt(i);}
return result;};const tokenizeFormatString=function(formatString,formatters){const tokens=[];function addStringToken(str){if(!str){return;}
if(tokens.length&&tokens[tokens.length-1].type==='string'){tokens[tokens.length-1].value+=str;}else{tokens.push({type:'string',value:str});}}
function addSpecifierToken(specifier,precision,substitutionIndex){tokens.push({type:'specifier',specifier:specifier,precision:precision,substitutionIndex:substitutionIndex});}
function addAnsiColor(code){const types={3:'color',9:'colorLight',4:'bgColor',10:'bgColorLight'};const colorCodes=['black','red','green','yellow','blue','magenta','cyan','lightGray','','default'];const colorCodesLight=['darkGray','lightRed','lightGreen','lightYellow','lightBlue','lightMagenta','lightCyan','white',''];const colors={color:colorCodes,colorLight:colorCodesLight,bgColor:colorCodes,bgColorLight:colorCodesLight};const type=types[Math.floor(code/10)];if(!type){return;}
const color=colors[type][code%10];if(!color){return;}
tokens.push({type:'specifier',specifier:'c',value:{description:(type.startsWith('bg')?'background : ':'color: ')+color}});}
let textStart=0;let substitutionIndex=0;const re=new RegExp(`%%|%(?:(\\d+)\\$)?(?:\\.(\\d*))?([${Object.keys(formatters).join('')}])|\\u001b\\[(\\d+)m`,'g');for(let match=re.exec(formatString);!!match;match=re.exec(formatString)){const matchStart=match.index;if(matchStart>textStart){addStringToken(formatString.substring(textStart,matchStart));}
if(match[0]==='%%'){addStringToken('%');}else if(match[0].startsWith('%')){const[_,substitionString,precisionString,specifierString]=match;if(substitionString&&Number(substitionString)>0){substitutionIndex=Number(substitionString)-1;}
const precision=precisionString?Number(precisionString):-1;addSpecifierToken(specifierString,precision,substitutionIndex);++substitutionIndex;}else{const code=Number(match[4]);addAnsiColor(code);}
textStart=matchStart+match[0].length;}
addStringToken(formatString.substring(textStart));return tokens;};const format=function(formatString,substitutions,formatters,initialValue,append,tokenizedFormat){if(!formatString||((!substitutions||!substitutions.length)&&formatString.search(/\u001b\[(\d+)m/)===-1)){return{formattedResult:append(initialValue,formatString),unusedSubstitutions:substitutions};}
function prettyFunctionName(){return'String.format("'+formatString+'", "'+Array.prototype.join.call(substitutions,'", "')+'")';}
function warn(msg){console.warn(prettyFunctionName()+': '+msg);}
function error(msg){console.error(prettyFunctionName()+': '+msg);}
let result=initialValue;const tokens=tokenizedFormat||tokenizeFormatString(formatString,formatters);const usedSubstitutionIndexes={};for(let i=0;i<tokens.length;++i){const token=tokens[i];if(token.type==='string'){result=append(result,token.value);continue;}
if(token.type!=='specifier'){error('Unknown token type "'+token.type+'" found.');continue;}
if(!token.value&&token.substitutionIndex>=substitutions.length){error('not enough substitution arguments. Had '+substitutions.length+' but needed '+
(token.substitutionIndex+1)+', so substitution was skipped.');result=append(result,'%'+(token.precision>-1?token.precision:'')+token.specifier);continue;}
if(!token.value){usedSubstitutionIndexes[token.substitutionIndex]=true;}
if(!(token.specifier in formatters)){warn('unsupported format character \u201C'+token.specifier+'\u201D. Treating as a string.');result=append(result,token.value?'':substitutions[token.substitutionIndex]);continue;}
result=append(result,formatters[token.specifier](token.value||substitutions[token.substitutionIndex],token));}
const unusedSubstitutions=[];for(let i=0;i<substitutions.length;++i){if(i in usedSubstitutionIndexes){continue;}
unusedSubstitutions.push(substitutions[i]);}
return{formattedResult:result,unusedSubstitutions:unusedSubstitutions};};const standardFormatters={d:function(substitution){return!isNaN(substitution)?substitution:0;},f:function(substitution,token){if(substitution&&token.precision>-1){substitution=substitution.toFixed(token.precision);}
return!isNaN(substitution)?substitution:(token.precision>-1?Number(0).toFixed(token.precision):0);},s:function(substitution){return substitution;}};const vsprintf=function(formatString,substitutions){return format(formatString,substitutions,standardFormatters,'',function(a,b){return a+b;}).formattedResult;};const sprintf=function(format,var_arg){return vsprintf(format,Array.prototype.slice.call(arguments,1));};const toBase64=inputString=>{function encodeBits(b){return b<26?b+65:b<52?b+71:b<62?b-4:b===62?43:b===63?47:65;}
const encoder=new TextEncoder();const data=encoder.encode(inputString.toString());const n=data.length;let encoded='';if(n===0){return encoded;}
let shift;let v=0;for(let i=0;i<n;i++){shift=i%3;v|=data[i]<<(16>>>shift&24);if(shift===2){encoded+=String.fromCharCode(encodeBits(v>>>18&63),encodeBits(v>>>12&63),encodeBits(v>>>6&63),encodeBits(v&63));v=0;}}
if(shift===0){encoded+=String.fromCharCode(encodeBits(v>>>18&63),encodeBits(v>>>12&63),61,61);}else if(shift===1){encoded+=String.fromCharCode(encodeBits(v>>>18&63),encodeBits(v>>>12&63),encodeBits(v>>>6&63),61);}
return encoded;};const findIndexesOfSubString=(inputString,searchString)=>{const matches=[];let i=inputString.indexOf(searchString);while(i!==-1){matches.push(i);i=inputString.indexOf(searchString,i+searchString.length);}
return matches;};const findLineEndingIndexes=inputString=>{const endings=findIndexesOfSubString(inputString,'\n');endings.push(inputString.length);return endings;};const isWhitespace=inputString=>{return/^\s*$/.test(inputString);};const trimURL=(url,baseURLDomain)=>{let result=url.replace(/^(https|http|file):\/\//i,'');if(baseURLDomain){if(result.toLowerCase().startsWith(baseURLDomain.toLowerCase())){result=result.substr(baseURLDomain.length);}}
return result;};const collapseWhitespace=inputString=>{return inputString.replace(/[\s\xA0]+/g,' ');};const reverse=inputString=>{return inputString.split('').reverse().join('');};const replaceControlCharacters=inputString=>{return inputString.replace(/[\0-\x08\x0B\f\x0E-\x1F\x80-\x9F]/g,'\uFFFD');};const countWtf8Bytes=inputString=>{let count=0;for(let i=0;i<inputString.length;i++){const c=inputString.charCodeAt(i);if(c<=0x7F){count++;}else if(c<=0x07FF){count+=2;}else if(c<0xD800||c>0xDFFF){count+=3;}else{if(c<=0xDBFF&&i+1<inputString.length){const next=inputString.charCodeAt(i+1);if(next>=0xDC00&&next<=0xDFFF){count+=4;i++;continue;}}
count+=3;}}
return count;};var stringUtilities=Object.freeze({__proto__:null,escapeCharacters:escapeCharacters,tokenizeFormatString:tokenizeFormatString,format:format,standardFormatters:standardFormatters,vsprintf:vsprintf,sprintf:sprintf,toBase64:toBase64,findIndexesOfSubString:findIndexesOfSubString,findLineEndingIndexes:findLineEndingIndexes,isWhitespace:isWhitespace,trimURL:trimURL,collapseWhitespace:collapseWhitespace,reverse:reverse,replaceControlCharacters:replaceControlCharacters,countWtf8Bytes:countWtf8Bytes});String.sprintf=sprintf;String.regexSpecialCharacters=function(){return'^[]{}()\\.^$*+?|-,';};String.prototype.escapeForRegExp=function(){return escapeCharacters(this,String.regexSpecialCharacters());};String.filterRegex=function(query){const toEscape=String.regexSpecialCharacters();let regexString='';for(let i=0;i<query.length;++i){let c=query.charAt(i);if(toEscape.indexOf(c)!==-1){c='\\'+c;}
if(i){regexString+='[^\\0'+c+']*';}
regexString+=c;}
return new RegExp(regexString,'i');};String.prototype.trimMiddle=function(maxLength){if(this.length<=maxLength){return String(this);}
let leftHalf=maxLength>>1;let rightHalf=maxLength-leftHalf-1;if(this.codePointAt(this.length-rightHalf-1)>=0x10000){--rightHalf;++leftHalf;}
if(leftHalf>0&&this.codePointAt(leftHalf-1)>=0x10000){--leftHalf;}
return this.substr(0,leftHalf)+'…'+this.substr(this.length-rightHalf,rightHalf);};String.prototype.trimEndWithMaxLength=function(maxLength){if(this.length<=maxLength){return String(this);}
return this.substr(0,maxLength-1)+'…';};String.prototype.toTitleCase=function(){return this.substring(0,1).toUpperCase()+this.substring(1);};String.prototype.compareTo=function(other){if(this>other){return 1;}
if(this<other){return-1;}
return 0;};String.prototype.removeURLFragment=function(){let fragmentIndex=this.indexOf('#');if(fragmentIndex===-1){fragmentIndex=this.length;}
return this.substring(0,fragmentIndex);};String.hashCode=function(string){if(!string){return 0;}
const p=((1<<30)*4-5);const z=0x5033d967;const z2=0x59d2f15d;let s=0;let zi=1;for(let i=0;i<string.length;i++){const xi=string.charCodeAt(i)*z2;s=(s+zi*xi)%p;zi=(zi*z)%p;}
s=(s+zi*(p-1))%p;return Math.abs(s|0);};String.naturalOrderComparator=function(a,b){const chunk=/^\d+|^\D+/;let chunka,chunkb,anum,bnum;while(1){if(a){if(!b){return 1;}}else{if(b){return-1;}
return 0;}
chunka=a.match(chunk)[0];chunkb=b.match(chunk)[0];anum=!isNaN(chunka);bnum=!isNaN(chunkb);if(anum&&!bnum){return-1;}
if(bnum&&!anum){return 1;}
if(anum&&bnum){const diff=chunka-chunkb;if(diff){return diff;}
if(chunka.length!==chunkb.length){if(!+chunka&&!+chunkb){return chunka.length-chunkb.length;}
return chunkb.length-chunka.length;}}else if(chunka!==chunkb){return(chunka<chunkb)?-1:1;}
a=a.substring(chunka.length);b=b.substring(chunkb.length);}};String.caseInsensetiveComparator=function(a,b){a=a.toUpperCase();b=b.toUpperCase();if(a===b){return 0;}
return a>b?1:-1;};Number.toFixedIfFloating=function(value){if(!value||isNaN(value)){return value;}
const number=Number(value);return number%1?number.toFixed(3):String(number);};Date.prototype.isValid=function(){return!isNaN(this.getTime());};Date.prototype.toISO8601Compact=function(){function leadZero(x){return(x>9?'':'0')+x;}
return this.getFullYear()+leadZero(this.getMonth()+1)+leadZero(this.getDate())+'T'+
leadZero(this.getHours())+leadZero(this.getMinutes())+leadZero(this.getSeconds());};(function(){const partition={value:function(comparator,left,right,pivotIndex){function swap(array,i1,i2){const temp=array[i1];array[i1]=array[i2];array[i2]=temp;}
const pivotValue=this[pivotIndex];swap(this,right,pivotIndex);let storeIndex=left;for(let i=left;i<right;++i){if(comparator(this[i],pivotValue)<0){swap(this,storeIndex,i);++storeIndex;}}
swap(this,right,storeIndex);return storeIndex;},configurable:true};Object.defineProperty(Array.prototype,'partition',partition);Object.defineProperty(Uint32Array.prototype,'partition',partition);const sortRange={value:function(comparator,leftBound,rightBound,sortWindowLeft,sortWindowRight){function quickSortRange(array,comparator,left,right,sortWindowLeft,sortWindowRight){if(right<=left){return;}
const pivotIndex=Math.floor(Math.random()*(right-left))+left;const pivotNewIndex=array.partition(comparator,left,right,pivotIndex);if(sortWindowLeft<pivotNewIndex){quickSortRange(array,comparator,left,pivotNewIndex-1,sortWindowLeft,sortWindowRight);}
if(pivotNewIndex<sortWindowRight){quickSortRange(array,comparator,pivotNewIndex+1,right,sortWindowLeft,sortWindowRight);}}
if(leftBound===0&&rightBound===(this.length-1)&&sortWindowLeft===0&&sortWindowRight>=rightBound){this.sort(comparator);}else{quickSortRange(this,comparator,leftBound,rightBound,sortWindowLeft,sortWindowRight);}
return this;},configurable:true};Object.defineProperty(Array.prototype,'sortRange',sortRange);Object.defineProperty(Uint32Array.prototype,'sortRange',sortRange);})();Object.defineProperty(Array.prototype,'lowerBound',{value:function(object,comparator,left,right){function defaultComparator(a,b){return a<b?-1:(a>b?1:0);}
comparator=comparator||defaultComparator;let l=left||0;let r=right!==undefined?right:this.length;while(l<r){const m=(l+r)>>1;if(comparator(object,this[m])>0){l=m+1;}else{r=m;}}
return r;},configurable:true});Object.defineProperty(Array.prototype,'upperBound',{value:function(object,comparator,left,right){function defaultComparator(a,b){return a<b?-1:(a>b?1:0);}
comparator=comparator||defaultComparator;let l=left||0;let r=right!==undefined?right:this.length;while(l<r){const m=(l+r)>>1;if(comparator(object,this[m])>=0){l=m+1;}else{r=m;}}
return r;},configurable:true});Object.defineProperty(Uint32Array.prototype,'lowerBound',{value:Array.prototype.lowerBound,configurable:true});Object.defineProperty(Uint32Array.prototype,'upperBound',{value:Array.prototype.upperBound,configurable:true});Object.defineProperty(Int32Array.prototype,'lowerBound',{value:Array.prototype.lowerBound,configurable:true});Object.defineProperty(Int32Array.prototype,'upperBound',{value:Array.prototype.upperBound,configurable:true});Object.defineProperty(Float64Array.prototype,'lowerBound',{value:Array.prototype.lowerBound,configurable:true});Object.defineProperty(Array.prototype,'binaryIndexOf',{value:function(value,comparator){const index=this.lowerBound(value,comparator);return index<this.length&&comparator(value,this[index])===0?index:-1;},configurable:true});Object.defineProperty(Array.prototype,'peekLast',{value:function(){return this[this.length-1];},configurable:true});(function(){function mergeOrIntersect(array1,array2,comparator,mergeNotIntersect){const result=[];let i=0;let j=0;while(i<array1.length&&j<array2.length){const compareValue=comparator(array1[i],array2[j]);if(mergeNotIntersect||!compareValue){result.push(compareValue<=0?array1[i]:array2[j]);}
if(compareValue<=0){i++;}
if(compareValue>=0){j++;}}
if(mergeNotIntersect){while(i<array1.length){result.push(array1[i++]);}
while(j<array2.length){result.push(array2[j++]);}}
return result;}
Object.defineProperty(Array.prototype,'intersectOrdered',{value:function(array,comparator){return mergeOrIntersect(this,array,comparator,false);},configurable:true});Object.defineProperty(Array.prototype,'mergeOrdered',{value:function(array,comparator){return mergeOrIntersect(this,array,comparator,true);},configurable:true});})();self.createSearchRegex=function(query,caseSensitive,isRegex){const regexFlags=caseSensitive?'g':'gi';let regexObject;if(isRegex){try{regexObject=new RegExp(query,regexFlags);}catch(e){}}
if(!regexObject){regexObject=self.createPlainTextSearchRegex(query,regexFlags);}
return regexObject;};self.createPlainTextSearchRegex=function(query,flags){const regexSpecialCharacters=String.regexSpecialCharacters();let regex='';for(let i=0;i<query.length;++i){const c=query.charAt(i);if(regexSpecialCharacters.indexOf(c)!==-1){regex+='\\';}
regex+=c;}
return new RegExp(regex,flags||'');};self.spacesPadding=function(spacesCount){return'\xA0'.repeat(spacesCount);};self.numberToStringWithSpacesPadding=function(value,symbolsCount){const numberString=value.toString();const paddingLength=Math.max(0,symbolsCount-numberString.length);return self.spacesPadding(paddingLength)+numberString;};Set.prototype.firstValue=function(){if(!this.size){return null;}
return this.values().next().value;};Set.prototype.addAll=function(iterable){for(const e of iterable){this.add(e);}};Map.prototype.inverse=function(){const result=new Platform.Multimap();for(const key of this.keys()){const value=this.get(key);result.set(value,key);}
return result;};class Multimap{constructor(){this._map=new Map();}
set(key,value){let set=this._map.get(key);if(!set){set=new Set();this._map.set(key,set);}
set.add(value);}
get(key){return this._map.get(key)||new Set();}
has(key){return this._map.has(key);}
hasValue(key,value){const set=this._map.get(key);if(!set){return false;}
return set.has(value);}
get size(){return this._map.size;}
delete(key,value){const values=this.get(key);if(!values){return false;}
const result=values.delete(value);if(!values.size){this._map.delete(key);}
return result;}
deleteAll(key){this._map.delete(key);}
keysArray(){return[...this._map.keys()];}
valuesArray(){const result=[];for(const set of this._map.values()){result.push(...set.values());}
return result;}
clear(){this._map.clear();}}
self.suppressUnused=function(value){};self.setImmediate=function(callback){const args=[...arguments].slice(1);Promise.resolve().then(()=>callback(...args));return 0;};self.runOnWindowLoad=function(callback){function windowLoaded(){self.removeEventListener('DOMContentLoaded',windowLoaded,false);callback();}
if(document.readyState==='complete'||document.readyState==='interactive'){callback();}else{self.addEventListener('DOMContentLoaded',windowLoaded,false);}};const _singletonSymbol=Symbol('singleton');self.singleton=function(constructorFunction){if(_singletonSymbol in constructorFunction){return constructorFunction[_singletonSymbol];}
const instance=new constructorFunction();constructorFunction[_singletonSymbol]=instance;return instance;};self.base64ToSize=function(content){if(!content){return 0;}
let size=content.length*3/4;if(content[content.length-1]==='='){size--;}
if(content.length>1&&content[content.length-2]==='='){size--;}
return size;};self.unescapeCssString=function(input){const reCssEscapeSequence=/(?<!\\)\\(?:([a-fA-F0-9]{1,6})|(.))[\n\t\x20]?/gs;return input.replace(reCssEscapeSequence,(_,$1,$2)=>{if($2){return $2;}
const codePoint=parseInt($1,16);const isSurrogate=0xD800<=codePoint&&codePoint<=0xDFFF;if(isSurrogate||codePoint===0x0000||codePoint>0x10FFFF){return'\uFFFD';}
return String.fromCodePoint(codePoint);});};self.Platform=self.Platform||{};Platform=Platform||{};Platform.Multimap=Multimap;const removeElement=(array,element,firstOnly)=>{let index=array.indexOf(element);if(index===-1){return false;}
if(firstOnly){array.splice(index,1);return true;}
for(let i=index+1,n=array.length;i<n;++i){if(array[i]!==element){array[index++]=array[i];}}
array.length=index;return true;};var arrayUtilities=Object.freeze({__proto__:null,removeElement:removeElement});const clamp=(num,min,max)=>{let clampedNumber=num;if(num<min){clampedNumber=min;}else if(num>max){clampedNumber=max;}
return clampedNumber;};const mod=(m,n)=>{return((m%n)+n)%n;};var numberUtilities=Object.freeze({__proto__:null,clamp:clamp,mod:mod});export{arrayUtilities as ArrayUtilities,Multimap,numberUtilities as NumberUtilities,stringUtilities as StringUtilities};