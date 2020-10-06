import{StringUtilities}from'../platform/platform.js';import{Runtime}from'../root/root.js';class App{presentUI(document){}}
var App$1=Object.freeze({__proto__:null,App:App});class AppProvider{createApp(){throw new Error('not implemented');}}
var AppProvider$1=Object.freeze({__proto__:null,AppProvider:AppProvider});class CharacterIdMap{constructor(){this._elementToCharacter=new Map();this._characterToElement=new Map();this._charCode=33;}
toChar(object){let character=this._elementToCharacter.get(object);if(!character){if(this._charCode>=0xFFFF){throw new Error('CharacterIdMap ran out of capacity!');}
character=String.fromCharCode(this._charCode++);this._elementToCharacter.set(object,character);this._characterToElement.set(character,object);}
return character;}
fromChar(character){const object=this._characterToElement.get(character);if(object===undefined){return null;}
return object;}}
var CharacterIdMap$1=Object.freeze({__proto__:null,CharacterIdMap:CharacterIdMap});let _rgbaToNickname;class Color{constructor(rgba,format,originalText){this._hsla=undefined;this._rgba=rgba;this._originalText=originalText||null;this._originalTextIsValid=!!this._originalText;this._format=format;if(typeof this._rgba[3]==='undefined'){this._rgba[3]=1;}
for(let i=0;i<4;++i){if(this._rgba[i]<0){this._rgba[i]=0;this._originalTextIsValid=false;}
if(this._rgba[i]>1){this._rgba[i]=1;this._originalTextIsValid=false;}}}
static parse(text){const value=text.toLowerCase().replace(/\s+/g,'');const simple=/^(?:#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(\w+))$/i;let match=value.match(simple);if(match){if(match[1]){let hex=match[1].toLowerCase();let format;if(hex.length===3){format=Format.ShortHEX;hex=hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);}else if(hex.length===4){format=Format.ShortHEXA;hex=hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2)+
hex.charAt(3)+hex.charAt(3);}else if(hex.length===6){format=Format.HEX;}else{format=Format.HEXA;}
const r=parseInt(hex.substring(0,2),16);const g=parseInt(hex.substring(2,4),16);const b=parseInt(hex.substring(4,6),16);let a=1;if(hex.length===8){a=parseInt(hex.substring(6,8),16)/255;}
return new Color([r/255,g/255,b/255,a],format,text);}
if(match[2]){const nickname=match[2].toLowerCase();if(nickname in Nicknames){const rgba=Nicknames[nickname];const color=Color.fromRGBA(rgba);color._format=Format.Nickname;color._originalText=text;return color;}
return null;}
return null;}
match=text.toLowerCase().match(/^\s*(?:(rgba?)|(hsla?))\((.*)\)\s*$/);if(match){const components=match[3].trim();let values=components.split(/\s*,\s*/);if(values.length===1){values=components.split(/\s+/);if(values[3]==='/'){values.splice(3,1);if(values.length!==4){return null;}}else if((values.length>2&&values[2].indexOf('/')!==-1)||(values.length>3&&values[3].indexOf('/')!==-1)){const alpha=values.slice(2,4).join('');values=values.slice(0,2).concat(alpha.split(/\//)).concat(values.slice(4));}else if(values.length>=4){return null;}}
if(values.length!==3&&values.length!==4||values.indexOf('')>-1){return null;}
const hasAlpha=(values[3]!==undefined);if(match[1]){const rgba=[Color._parseRgbNumeric(values[0]),Color._parseRgbNumeric(values[1]),Color._parseRgbNumeric(values[2]),hasAlpha?Color._parseAlphaNumeric(values[3]):1];if(rgba.indexOf(null)>-1){return null;}
return new Color((rgba),hasAlpha?Format.RGBA:Format.RGB,text);}
if(match[2]){const hsla=[Color._parseHueNumeric(values[0]),Color._parseSatLightNumeric(values[1]),Color._parseSatLightNumeric(values[2]),hasAlpha?Color._parseAlphaNumeric(values[3]):1];if(hsla.indexOf(null)>-1){return null;}
const rgba=[];Color.hsl2rgb((hsla),rgba);return new Color(rgba,hasAlpha?Format.HSLA:Format.HSL,text);}}
return null;}
static fromRGBA(rgba){return new Color([rgba[0]/255,rgba[1]/255,rgba[2]/255,rgba[3]],Format.RGBA);}
static fromHSVA(hsva){const rgba=[];Color.hsva2rgba(hsva,rgba);return new Color(rgba,Format.HSLA);}
static _parsePercentOrNumber(value){if(isNaN(value.replace('%',''))){return null;}
const parsed=parseFloat(value);if(value.indexOf('%')!==-1){if(value.indexOf('%')!==value.length-1){return null;}
return parsed/100;}
return parsed;}
static _parseRgbNumeric(value){const parsed=Color._parsePercentOrNumber(value);if(parsed===null){return null;}
if(value.indexOf('%')!==-1){return parsed;}
return parsed/255;}
static _parseHueNumeric(value){const angle=value.replace(/(deg|g?rad|turn)$/,'');if(isNaN(angle)||value.match(/\s+(deg|g?rad|turn)/)){return null;}
const number=parseFloat(angle);if(value.indexOf('turn')!==-1){return number%1;}
if(value.indexOf('grad')!==-1){return(number/400)%1;}
if(value.indexOf('rad')!==-1){return(number/(2*Math.PI))%1;}
return(number/360)%1;}
static _parseSatLightNumeric(value){if(value.indexOf('%')!==value.length-1||isNaN(value.replace('%',''))){return null;}
const parsed=parseFloat(value);return Math.min(1,parsed/100);}
static _parseAlphaNumeric(value){return Color._parsePercentOrNumber(value);}
static _hsva2hsla(hsva,out_hsla){const h=hsva[0];let s=hsva[1];const v=hsva[2];const t=(2-s)*v;if(v===0||s===0){s=0;}else{s*=v/(t<1?t:2-t);}
out_hsla[0]=h;out_hsla[1]=s;out_hsla[2]=t/2;out_hsla[3]=hsva[3];}
static hsl2rgb(hsl,out_rgb){const h=hsl[0];let s=hsl[1];const l=hsl[2];function hue2rgb(p,q,h){if(h<0){h+=1;}else if(h>1){h-=1;}
if((h*6)<1){return p+(q-p)*h*6;}
if((h*2)<1){return q;}
if((h*3)<2){return p+(q-p)*((2/3)-h)*6;}
return p;}
if(s<0){s=0;}
let q;if(l<=0.5){q=l*(1+s);}else{q=l+s-(l*s);}
const p=2*l-q;const tr=h+(1/3);const tg=h;const tb=h-(1/3);out_rgb[0]=hue2rgb(p,q,tr);out_rgb[1]=hue2rgb(p,q,tg);out_rgb[2]=hue2rgb(p,q,tb);out_rgb[3]=hsl[3];}
static hsva2rgba(hsva,out_rgba){Color._hsva2hsla(hsva,Color.hsva2rgba._tmpHSLA);Color.hsl2rgb(Color.hsva2rgba._tmpHSLA,out_rgba);for(let i=0;i<Color.hsva2rgba._tmpHSLA.length;i++){Color.hsva2rgba._tmpHSLA[i]=0;}}
static luminance(rgba){const rSRGB=rgba[0];const gSRGB=rgba[1];const bSRGB=rgba[2];const r=rSRGB<=0.03928?rSRGB/12.92:Math.pow(((rSRGB+0.055)/1.055),2.4);const g=gSRGB<=0.03928?gSRGB/12.92:Math.pow(((gSRGB+0.055)/1.055),2.4);const b=bSRGB<=0.03928?bSRGB/12.92:Math.pow(((bSRGB+0.055)/1.055),2.4);return 0.2126*r+0.7152*g+0.0722*b;}
static blendColors(fgRGBA,bgRGBA,out_blended){const alpha=fgRGBA[3];out_blended[0]=((1-alpha)*bgRGBA[0])+(alpha*fgRGBA[0]);out_blended[1]=((1-alpha)*bgRGBA[1])+(alpha*fgRGBA[1]);out_blended[2]=((1-alpha)*bgRGBA[2])+(alpha*fgRGBA[2]);out_blended[3]=alpha+(bgRGBA[3]*(1-alpha));}
static calculateContrastRatio(fgRGBA,bgRGBA){Color.blendColors(fgRGBA,bgRGBA,Color.calculateContrastRatio._blendedFg);const fgLuminance=Color.luminance(Color.calculateContrastRatio._blendedFg);const bgLuminance=Color.luminance(bgRGBA);const contrastRatio=(Math.max(fgLuminance,bgLuminance)+0.05)/(Math.min(fgLuminance,bgLuminance)+0.05);for(let i=0;i<Color.calculateContrastRatio._blendedFg.length;i++){Color.calculateContrastRatio._blendedFg[i]=0;}
return contrastRatio;}
static desiredLuminance(luminance,contrast,lighter){function computeLuminance(){if(lighter){return(luminance+0.05)*contrast-0.05;}
return(luminance+0.05)/contrast-0.05;}
let desiredLuminance=computeLuminance();if(desiredLuminance<0||desiredLuminance>1){lighter=!lighter;desiredLuminance=computeLuminance();}
return desiredLuminance;}
format(){return this._format;}
hsla(){if(this._hsla){return this._hsla;}
const r=this._rgba[0];const g=this._rgba[1];const b=this._rgba[2];const max=Math.max(r,g,b);const min=Math.min(r,g,b);const diff=max-min;const add=max+min;let h;if(min===max){h=0;}else if(r===max){h=((1/6*(g-b)/diff)+1)%1;}else if(g===max){h=(1/6*(b-r)/diff)+1/3;}else{h=(1/6*(r-g)/diff)+2/3;}
const l=0.5*add;let s;if(l===0){s=0;}else if(l===1){s=0;}else if(l<=0.5){s=diff/add;}else{s=diff/(2-add);}
this._hsla=([h,s,l,this._rgba[3]]);return this._hsla;}
canonicalHSLA(){const hsla=this.hsla();return[Math.round(hsla[0]*360),Math.round(hsla[1]*100),Math.round(hsla[2]*100),hsla[3]];}
hsva(){const hsla=this.hsla();const h=hsla[0];let s=hsla[1];const l=hsla[2];s*=l<0.5?l:1-l;return[h,s!==0?2*s/(l+s):0,(l+s),hsla[3]];}
hasAlpha(){return this._rgba[3]!==1;}
detectHEXFormat(){let canBeShort=true;for(let i=0;i<4;++i){const c=Math.round(this._rgba[i]*255);if(c%17){canBeShort=false;break;}}
const hasAlpha=this.hasAlpha();const cf=Format;if(canBeShort){return hasAlpha?cf.ShortHEXA:cf.ShortHEX;}
return hasAlpha?cf.HEXA:cf.HEX;}
asString(format){if(format===this._format&&this._originalTextIsValid){return this._originalText;}
if(!format){format=this._format;}
function toRgbValue(value){return Math.round(value*255);}
function toHexValue(value){const hex=Math.round(value*255).toString(16);return hex.length===1?'0'+hex:hex;}
function toShortHexValue(value){return(Math.round(value*255)/17).toString(16);}
switch(format){case Format.Original:{return this._originalText;}
case Format.RGB:{if(this.hasAlpha()){return null;}
return StringUtilities.sprintf('rgb(%d, %d, %d)',toRgbValue(this._rgba[0]),toRgbValue(this._rgba[1]),toRgbValue(this._rgba[2]));}
case Format.RGBA:{return StringUtilities.sprintf('rgba(%d, %d, %d, %f)',toRgbValue(this._rgba[0]),toRgbValue(this._rgba[1]),toRgbValue(this._rgba[2]),this._rgba[3]);}
case Format.HSL:{if(this.hasAlpha()){return null;}
const hsl=this.hsla();return StringUtilities.sprintf('hsl(%d, %d%, %d%)',Math.round(hsl[0]*360),Math.round(hsl[1]*100),Math.round(hsl[2]*100));}
case Format.HSLA:{const hsla=this.hsla();return StringUtilities.sprintf('hsla(%d, %d%, %d%, %f)',Math.round(hsla[0]*360),Math.round(hsla[1]*100),Math.round(hsla[2]*100),hsla[3]);}
case Format.HEXA:{return StringUtilities.sprintf('#%s%s%s%s',toHexValue(this._rgba[0]),toHexValue(this._rgba[1]),toHexValue(this._rgba[2]),toHexValue(this._rgba[3])).toLowerCase();}
case Format.HEX:{if(this.hasAlpha()){return null;}
return StringUtilities.sprintf('#%s%s%s',toHexValue(this._rgba[0]),toHexValue(this._rgba[1]),toHexValue(this._rgba[2])).toLowerCase();}
case Format.ShortHEXA:{const hexFormat=this.detectHEXFormat();if(hexFormat!==Format.ShortHEXA&&hexFormat!==Format.ShortHEX){return null;}
return StringUtilities.sprintf('#%s%s%s%s',toShortHexValue(this._rgba[0]),toShortHexValue(this._rgba[1]),toShortHexValue(this._rgba[2]),toShortHexValue(this._rgba[3])).toLowerCase();}
case Format.ShortHEX:{if(this.hasAlpha()){return null;}
if(this.detectHEXFormat()!==Format.ShortHEX){return null;}
return StringUtilities.sprintf('#%s%s%s',toShortHexValue(this._rgba[0]),toShortHexValue(this._rgba[1]),toShortHexValue(this._rgba[2])).toLowerCase();}
case Format.Nickname:{return this.nickname();}}
return this._originalText;}
rgba(){return this._rgba.slice();}
canonicalRGBA(){const rgba=new Array(4);for(let i=0;i<3;++i){rgba[i]=Math.round(this._rgba[i]*255);}
rgba[3]=this._rgba[3];return rgba;}
nickname(){if(!_rgbaToNickname){_rgbaToNickname=new Map();for(const nickname in Nicknames){let rgba=Nicknames[nickname];if(rgba.length!==4){rgba=rgba.concat(1);}
_rgbaToNickname.set(String(rgba),nickname);}}
return _rgbaToNickname.get(String(this.canonicalRGBA()))||null;}
toProtocolRGBA(){const rgba=this.canonicalRGBA();const result={r:rgba[0],g:rgba[1],b:rgba[2],a:undefined};if(rgba[3]!==1){result.a=rgba[3];}
return result;}
invert(){const rgba=[];rgba[0]=1-this._rgba[0];rgba[1]=1-this._rgba[1];rgba[2]=1-this._rgba[2];rgba[3]=this._rgba[3];return new Color(rgba,Format.RGBA);}
setAlpha(alpha){const rgba=this._rgba.slice();rgba[3]=alpha;return new Color(rgba,Format.RGBA);}
blendWith(fgColor){const rgba=[];Color.blendColors(fgColor._rgba,this._rgba,rgba);return new Color(rgba,Format.RGBA);}}
const Regex=/((?:rgb|hsl)a?\([^)]+\)|#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3,4}|\b[a-zA-Z]+\b(?!-))/g;const Format={Original:'original',Nickname:'nickname',HEX:'hex',ShortHEX:'shorthex',HEXA:'hexa',ShortHEXA:'shorthexa',RGB:'rgb',RGBA:'rgba',HSL:'hsl',HSLA:'hsla'};const Nicknames={'aliceblue':[240,248,255],'antiquewhite':[250,235,215],'aqua':[0,255,255],'aquamarine':[127,255,212],'azure':[240,255,255],'beige':[245,245,220],'bisque':[255,228,196],'black':[0,0,0],'blanchedalmond':[255,235,205],'blue':[0,0,255],'blueviolet':[138,43,226],'brown':[165,42,42],'burlywood':[222,184,135],'cadetblue':[95,158,160],'chartreuse':[127,255,0],'chocolate':[210,105,30],'coral':[255,127,80],'cornflowerblue':[100,149,237],'cornsilk':[255,248,220],'crimson':[237,20,61],'cyan':[0,255,255],'darkblue':[0,0,139],'darkcyan':[0,139,139],'darkgoldenrod':[184,134,11],'darkgray':[169,169,169],'darkgrey':[169,169,169],'darkgreen':[0,100,0],'darkkhaki':[189,183,107],'darkmagenta':[139,0,139],'darkolivegreen':[85,107,47],'darkorange':[255,140,0],'darkorchid':[153,50,204],'darkred':[139,0,0],'darksalmon':[233,150,122],'darkseagreen':[143,188,143],'darkslateblue':[72,61,139],'darkslategray':[47,79,79],'darkslategrey':[47,79,79],'darkturquoise':[0,206,209],'darkviolet':[148,0,211],'deeppink':[255,20,147],'deepskyblue':[0,191,255],'dimgray':[105,105,105],'dimgrey':[105,105,105],'dodgerblue':[30,144,255],'firebrick':[178,34,34],'floralwhite':[255,250,240],'forestgreen':[34,139,34],'fuchsia':[255,0,255],'gainsboro':[220,220,220],'ghostwhite':[248,248,255],'gold':[255,215,0],'goldenrod':[218,165,32],'gray':[128,128,128],'grey':[128,128,128],'green':[0,128,0],'greenyellow':[173,255,47],'honeydew':[240,255,240],'hotpink':[255,105,180],'indianred':[205,92,92],'indigo':[75,0,130],'ivory':[255,255,240],'khaki':[240,230,140],'lavender':[230,230,250],'lavenderblush':[255,240,245],'lawngreen':[124,252,0],'lemonchiffon':[255,250,205],'lightblue':[173,216,230],'lightcoral':[240,128,128],'lightcyan':[224,255,255],'lightgoldenrodyellow':[250,250,210],'lightgreen':[144,238,144],'lightgray':[211,211,211],'lightgrey':[211,211,211],'lightpink':[255,182,193],'lightsalmon':[255,160,122],'lightseagreen':[32,178,170],'lightskyblue':[135,206,250],'lightslategray':[119,136,153],'lightslategrey':[119,136,153],'lightsteelblue':[176,196,222],'lightyellow':[255,255,224],'lime':[0,255,0],'limegreen':[50,205,50],'linen':[250,240,230],'magenta':[255,0,255],'maroon':[128,0,0],'mediumaquamarine':[102,205,170],'mediumblue':[0,0,205],'mediumorchid':[186,85,211],'mediumpurple':[147,112,219],'mediumseagreen':[60,179,113],'mediumslateblue':[123,104,238],'mediumspringgreen':[0,250,154],'mediumturquoise':[72,209,204],'mediumvioletred':[199,21,133],'midnightblue':[25,25,112],'mintcream':[245,255,250],'mistyrose':[255,228,225],'moccasin':[255,228,181],'navajowhite':[255,222,173],'navy':[0,0,128],'oldlace':[253,245,230],'olive':[128,128,0],'olivedrab':[107,142,35],'orange':[255,165,0],'orangered':[255,69,0],'orchid':[218,112,214],'palegoldenrod':[238,232,170],'palegreen':[152,251,152],'paleturquoise':[175,238,238],'palevioletred':[219,112,147],'papayawhip':[255,239,213],'peachpuff':[255,218,185],'peru':[205,133,63],'pink':[255,192,203],'plum':[221,160,221],'powderblue':[176,224,230],'purple':[128,0,128],'rebeccapurple':[102,51,153],'red':[255,0,0],'rosybrown':[188,143,143],'royalblue':[65,105,225],'saddlebrown':[139,69,19],'salmon':[250,128,114],'sandybrown':[244,164,96],'seagreen':[46,139,87],'seashell':[255,245,238],'sienna':[160,82,45],'silver':[192,192,192],'skyblue':[135,206,235],'slateblue':[106,90,205],'slategray':[112,128,144],'slategrey':[112,128,144],'snow':[255,250,250],'springgreen':[0,255,127],'steelblue':[70,130,180],'tan':[210,180,140],'teal':[0,128,128],'thistle':[216,191,216],'tomato':[255,99,71],'turquoise':[64,224,208],'violet':[238,130,238],'wheat':[245,222,179],'white':[255,255,255],'whitesmoke':[245,245,245],'yellow':[255,255,0],'yellowgreen':[154,205,50],'transparent':[0,0,0,0],};const PageHighlight={Content:Color.fromRGBA([111,168,220,.66]),ContentLight:Color.fromRGBA([111,168,220,.5]),ContentOutline:Color.fromRGBA([9,83,148]),Padding:Color.fromRGBA([147,196,125,.55]),PaddingLight:Color.fromRGBA([147,196,125,.4]),Border:Color.fromRGBA([255,229,153,.66]),BorderLight:Color.fromRGBA([255,229,153,.5]),Margin:Color.fromRGBA([246,178,107,.66]),MarginLight:Color.fromRGBA([246,178,107,.5]),EventTarget:Color.fromRGBA([255,196,196,.66]),Shape:Color.fromRGBA([96,82,177,0.8]),ShapeMargin:Color.fromRGBA([96,82,127,.6]),CssGrid:Color.fromRGBA([0x4b,0,0x82,1])};class Generator{constructor(hueSpace,satSpace,lightnessSpace,alphaSpace){this._hueSpace=hueSpace||{min:0,max:360,count:undefined};this._satSpace=satSpace||67;this._lightnessSpace=lightnessSpace||80;this._alphaSpace=alphaSpace||1;this._colors=new Map();}
setColorForID(id,color){this._colors.set(id,color);}
colorForID(id){let color=this._colors.get(id);if(!color){color=this._generateColorForID(id);this._colors.set(id,color);}
return color;}
_generateColorForID(id){const hash=String.hashCode(id);const h=this._indexToValueInSpace(hash,this._hueSpace);const s=this._indexToValueInSpace(hash>>8,this._satSpace);const l=this._indexToValueInSpace(hash>>16,this._lightnessSpace);const a=this._indexToValueInSpace(hash>>24,this._alphaSpace);return`hsla(${h}, ${s}%, ${l}%, ${a})`;}
_indexToValueInSpace(index,space){if(typeof space==='number'){return space;}
const count=space.count||space.max-space.min;index%=count;return space.min+Math.floor(index/(count-1)*(space.max-space.min));}}
Color.hsva2rgba._tmpHSLA=[0,0,0,0];Color.calculateContrastRatio._blendedFg=[0,0,0,0];var Color$1=Object.freeze({__proto__:null,Color:Color,Regex:Regex,Format:Format,Nicknames:Nicknames,PageHighlight:PageHighlight,Generator:Generator});let EventDescriptor;function removeEventListeners(eventList){for(const eventInfo of eventList){eventInfo.eventTarget.removeEventListener(eventInfo.eventType,eventInfo.listener,eventInfo.thisObject);}
eventList.splice(0);}
class EventTarget{addEventListener(eventType,listener,thisObject){throw new Error('not implemented');}
once(eventType){throw new Error('not implemented');}
removeEventListener(eventType,listener,thisObject){throw new Error('not implemented');}
hasEventListeners(eventType){throw new Error('not implemented');}
dispatchEventToListeners(eventType,eventData){}}
EventTarget.removeEventListeners=removeEventListeners;function fireEvent(name,detail={},target=window){const evt=new CustomEvent(name,{bubbles:true,cancelable:true,detail});target.dispatchEvent(evt);}
let EventTargetEvent;var EventTarget$1=Object.freeze({__proto__:null,EventDescriptor:EventDescriptor,removeEventListeners:removeEventListeners,EventTarget:EventTarget,fireEvent:fireEvent,EventTargetEvent:EventTargetEvent});let _listenerCallbackTuple;class ObjectWrapper{constructor(){this._listeners;}
addEventListener(eventType,listener,thisObject){if(!listener){console.assert(false);}
if(!this._listeners){this._listeners=new Map();}
if(!this._listeners.has(eventType)){this._listeners.set(eventType,[]);}
const listenerForEventType=this._listeners.get(eventType);if(listenerForEventType){listenerForEventType.push({thisObject:thisObject,listener:listener,disposed:undefined});}
return{eventTarget:this,eventType:eventType,thisObject:thisObject,listener:listener};}
once(eventType){return new Promise(resolve=>{const descriptor=this.addEventListener(eventType,event=>{this.removeEventListener(eventType,descriptor.listener);resolve(event.data);});});}
removeEventListener(eventType,listener,thisObject){console.assert(!!listener);if(!this._listeners||!this._listeners.has(eventType)){return;}
const listeners=this._listeners.get(eventType)||[];for(let i=0;i<listeners.length;++i){if(listeners[i].listener===listener&&listeners[i].thisObject===thisObject){listeners[i].disposed=true;listeners.splice(i--,1);}}
if(!listeners.length){this._listeners.delete(eventType);}}
hasEventListeners(eventType){return!!(this._listeners&&this._listeners.has(eventType));}
dispatchEventToListeners(eventType,eventData){if(!this._listeners||!this._listeners.has(eventType)){return;}
const event=({data:eventData});const listeners=this._listeners.get(eventType).slice(0)||[];for(let i=0;i<listeners.length;++i){if(!listeners[i].disposed){listeners[i].listener.call(listeners[i].thisObject,event);}}}}
var _Object=Object.freeze({__proto__:null,ObjectWrapper:ObjectWrapper});class Revealer{reveal(object,omitFocus){throw new Error('not implemented');}}
let reveal=function(revealable,omitFocus){if(!revealable){return Promise.reject(new Error('Can\'t reveal '+revealable));}
return self.runtime.allInstances(Revealer,revealable).then(reveal);function reveal(revealers){const promises=[];for(let i=0;i<revealers.length;++i){promises.push(revealers[i].reveal((revealable),omitFocus));}
return Promise.race(promises);}};function setRevealForTest(newReveal){reveal=newReveal;}
const revealDestination=function(revealable){const extension=self.runtime.extension(Revealer,revealable);if(!extension){return null;}
return extension.descriptor()['destination'];};var Revealer$1=Object.freeze({__proto__:null,Revealer:Revealer,get reveal(){return reveal;},setRevealForTest:setRevealForTest,revealDestination:revealDestination});let consoleInstance;class Console extends ObjectWrapper{constructor(){super();this._messages=[];}
static instance({forceNew}={forceNew:false}){if(!consoleInstance||forceNew){consoleInstance=new Console();}
return consoleInstance;}
addMessage(text,level,show){const message=new Message(text,level||MessageLevel.Info,Date.now(),show||false);this._messages.push(message);this.dispatchEventToListeners(Events.MessageAdded,message);}
log(text){this.addMessage(text,MessageLevel.Info);}
warn(text){this.addMessage(text,MessageLevel.Warning);}
error(text){this.addMessage(text,MessageLevel.Error,true);}
messages(){return this._messages;}
show(){this.showPromise();}
showPromise(){return reveal(this);}}
const Events={MessageAdded:Symbol('messageAdded')};const MessageLevel={Info:'info',Warning:'warning',Error:'error'};class Message{constructor(text,level,timestamp,show){this.text=text;this.level=level;this.timestamp=(typeof timestamp==='number')?timestamp:Date.now();this.show=show;}}
var Console$1=Object.freeze({__proto__:null,Console:Console,Events:Events,MessageLevel:MessageLevel,Message:Message});class JavaScriptMetaData{signaturesForNativeFunction(name){throw new Error('not implemented');}
signaturesForInstanceMethod(name,receiverClassName){throw new Error('not implemented');}
signaturesForStaticMethod(name,receiverConstructorName){throw new Error('not implemented');}}
var JavaScriptMetaData$1=Object.freeze({__proto__:null,JavaScriptMetaData:JavaScriptMetaData});class Linkifier{linkify(object,options){throw new Error('linkify not implemented');}
static linkify(object,options){if(!object){return Promise.reject(new Error('Can\'t linkify '+object));}
return self.runtime.extension(Linkifier,object).instance().then(linkifier=>linkifier.linkify(object,options));}}
let Options;var Linkifier$1=Object.freeze({__proto__:null,Linkifier:Linkifier,Options:Options});class ParsedURL{constructor(url){this.isValid=false;this.url=url;this.scheme='';this.user='';this.host='';this.port='';this.path='';this.queryParams='';this.fragment='';this.folderPathComponents='';this.lastPathComponent='';const isBlobUrl=this.url.startsWith('blob:');const urlToMatch=isBlobUrl?url.substring(5):url;const match=urlToMatch.match(ParsedURL._urlRegex());if(match){this.isValid=true;if(isBlobUrl){this._blobInnerScheme=match[2].toLowerCase();this.scheme='blob';}else{this.scheme=match[2].toLowerCase();}
this.user=match[3];this.host=match[4];this.port=match[5];this.path=match[6]||'/';this.queryParams=match[7]||'';this.fragment=match[8];}else{if(this.url.startsWith('data:')){this.scheme='data';return;}
if(this.url.startsWith('blob:')){this.scheme='blob';return;}
if(this.url==='about:blank'){this.scheme='about';return;}
this.path=this.url;}
const lastSlashIndex=this.path.lastIndexOf('/');if(lastSlashIndex!==-1){this.folderPathComponents=this.path.substring(0,lastSlashIndex);this.lastPathComponent=this.path.substring(lastSlashIndex+1);}else{this.lastPathComponent=this.path;}}
static fromString(string){const parsedURL=new ParsedURL(string.toString());if(parsedURL.isValid){return parsedURL;}
return null;}
static platformPathToURL(fileSystemPath){fileSystemPath=fileSystemPath.replace(/\\/g,'/');if(!fileSystemPath.startsWith('file://')){if(fileSystemPath.startsWith('/')){fileSystemPath='file://'+fileSystemPath;}else{fileSystemPath='file:///'+fileSystemPath;}}
return fileSystemPath;}
static urlToPlatformPath(fileURL,isWindows){console.assert(fileURL.startsWith('file://'),'This must be a file URL.');if(isWindows){return fileURL.substr('file:///'.length).replace(/\//g,'\\');}
return fileURL.substr('file://'.length);}
static urlWithoutHash(url){const hashIndex=url.indexOf('#');if(hashIndex!==-1){return url.substr(0,hashIndex);}
return url;}
static _urlRegex(){if(ParsedURL._urlRegexInstance){return ParsedURL._urlRegexInstance;}
const schemeRegex=/([A-Za-z][A-Za-z0-9+.-]*):\/\//;const userRegex=/(?:([A-Za-z0-9\-._~%!$&'()*+,;=:]*)@)?/;const hostRegex=/((?:\[::\d?\])|(?:[^\s\/:]*))/;const portRegex=/(?::([\d]+))?/;const pathRegex=/(\/[^#?]*)?/;const queryRegex=/(?:\?([^#]*))?/;const fragmentRegex=/(?:#(.*))?/;ParsedURL._urlRegexInstance=new RegExp('^('+schemeRegex.source+userRegex.source+hostRegex.source+portRegex.source+')'+pathRegex.source+
queryRegex.source+fragmentRegex.source+'$');return ParsedURL._urlRegexInstance;}
static extractPath(url){const parsedURL=this.fromString(url);return parsedURL?parsedURL.path:'';}
static extractOrigin(url){const parsedURL=this.fromString(url);return parsedURL?parsedURL.securityOrigin():'';}
static extractExtension(url){url=ParsedURL.urlWithoutHash(url);const indexOfQuestionMark=url.indexOf('?');if(indexOfQuestionMark!==-1){url=url.substr(0,indexOfQuestionMark);}
const lastIndexOfSlash=url.lastIndexOf('/');if(lastIndexOfSlash!==-1){url=url.substr(lastIndexOfSlash+1);}
const lastIndexOfDot=url.lastIndexOf('.');if(lastIndexOfDot!==-1){url=url.substr(lastIndexOfDot+1);const lastIndexOfPercent=url.indexOf('%');if(lastIndexOfPercent!==-1){return url.substr(0,lastIndexOfPercent);}
return url;}
return'';}
static extractName(url){let index=url.lastIndexOf('/');const pathAndQuery=index!==-1?url.substr(index+1):url;index=pathAndQuery.indexOf('?');return index<0?pathAndQuery:pathAndQuery.substr(0,index);}
static completeURL(baseURL,href){const trimmedHref=href.trim();if(trimmedHref.startsWith('data:')||trimmedHref.startsWith('blob:')||trimmedHref.startsWith('javascript:')||trimmedHref.startsWith('mailto:')){return href;}
const parsedHref=this.fromString(trimmedHref);if(parsedHref&&parsedHref.scheme){return trimmedHref;}
const parsedURL=this.fromString(baseURL);if(!parsedURL){return null;}
if(parsedURL.isDataURL()){return href;}
if(href.length>1&&href.charAt(0)==='/'&&href.charAt(1)==='/'){return parsedURL.scheme+':'+href;}
const securityOrigin=parsedURL.securityOrigin();const pathText=parsedURL.path;const queryText=parsedURL.queryParams?'?'+parsedURL.queryParams:'';if(!href.length){return securityOrigin+pathText+queryText;}
if(href.charAt(0)==='#'){return securityOrigin+pathText+queryText+href;}
if(href.charAt(0)==='?'){return securityOrigin+pathText+href;}
const hrefMatches=href.match(/^[^#?]*/);if(!hrefMatches||!href.length){throw new Error('Invalid href');}
let hrefPath=hrefMatches[0];const hrefSuffix=href.substring(hrefPath.length);if(hrefPath.charAt(0)!=='/'){hrefPath=parsedURL.folderPathComponents+'/'+hrefPath;}
return securityOrigin+Root.Runtime.normalizePath(hrefPath)+hrefSuffix;}
static splitLineAndColumn(string){const beforePathMatch=string.match(ParsedURL._urlRegex());let beforePath='';let pathAndAfter=string;if(beforePathMatch){beforePath=beforePathMatch[1];pathAndAfter=string.substring(beforePathMatch[1].length);}
const lineColumnRegEx=/(?::(\d+))?(?::(\d+))?$/;const lineColumnMatch=lineColumnRegEx.exec(pathAndAfter);let lineNumber;let columnNumber;console.assert(!!lineColumnMatch);if(!lineColumnMatch){return{url:string,lineNumber:0,columnNumber:0};}
if(typeof(lineColumnMatch[1])==='string'){lineNumber=parseInt(lineColumnMatch[1],10);lineNumber=isNaN(lineNumber)?undefined:lineNumber-1;}
if(typeof(lineColumnMatch[2])==='string'){columnNumber=parseInt(lineColumnMatch[2],10);columnNumber=isNaN(columnNumber)?undefined:columnNumber-1;}
return{url:beforePath+pathAndAfter.substring(0,pathAndAfter.length-lineColumnMatch[0].length),lineNumber:lineNumber,columnNumber:columnNumber};}
static removeWasmFunctionInfoFromURL(url){const wasmFunctionRegEx=/:wasm-function\[\d+\]/;const wasmFunctionIndex=url.search(wasmFunctionRegEx);if(wasmFunctionIndex===-1){return url;}
return url.substring(0,wasmFunctionIndex);}
static isRelativeURL(url){return!(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url));}
get displayName(){if(this._displayName){return this._displayName;}
if(this.isDataURL()){return this.dataURLDisplayName();}
if(this.isBlobURL()){return this.url;}
if(this.isAboutBlank()){return this.url;}
this._displayName=this.lastPathComponent;if(!this._displayName){this._displayName=(this.host||'')+'/';}
if(this._displayName==='/'){this._displayName=this.url;}
return this._displayName;}
dataURLDisplayName(){if(this._dataURLDisplayName){return this._dataURLDisplayName;}
if(!this.isDataURL()){return'';}
this._dataURLDisplayName=this.url.trimEndWithMaxLength(20);return this._dataURLDisplayName;}
isAboutBlank(){return this.url==='about:blank';}
isDataURL(){return this.scheme==='data';}
isBlobURL(){return this.url.startsWith('blob:');}
lastPathComponentWithFragment(){return this.lastPathComponent+(this.fragment?'#'+this.fragment:'');}
domain(){if(this.isDataURL()){return'data:';}
return this.host+(this.port?':'+this.port:'');}
securityOrigin(){if(this.isDataURL()){return'data:';}
const scheme=this.isBlobURL()?this._blobInnerScheme:this.scheme;return scheme+'://'+this.domain();}
urlWithoutScheme(){if(this.scheme&&this.url.startsWith(this.scheme+'://')){return this.url.substring(this.scheme.length+3);}
return this.url;}}
ParsedURL._urlRegexInstance=null;var ParsedURL$1=Object.freeze({__proto__:null,ParsedURL:ParsedURL});class Progress{setTotalWork(totalWork){}
setTitle(title){}
setWorked(worked,title){}
worked(worked){}
done(){}
isCanceled(){return false;}}
class CompositeProgress{constructor(parent){this._parent=parent;this._children=[];this._childrenDone=0;this._parent.setTotalWork(1);this._parent.setWorked(0);}
_childDone(){if(++this._childrenDone!==this._children.length){return;}
this._parent.done();}
createSubProgress(weight){const child=new SubProgress(this,weight);this._children.push(child);return child;}
_update(){let totalWeights=0;let done=0;for(let i=0;i<this._children.length;++i){const child=this._children[i];if(child._totalWork){done+=child._weight*child._worked/child._totalWork;}
totalWeights+=child._weight;}
this._parent.setWorked(done/totalWeights);}}
class SubProgress{constructor(composite,weight){this._composite=composite;this._weight=weight||1;this._worked=0;this._totalWork=0;}
isCanceled(){return this._composite._parent.isCanceled();}
setTitle(title){this._composite._parent.setTitle(title);}
done(){this.setWorked(this._totalWork);this._composite._childDone();}
setTotalWork(totalWork){this._totalWork=totalWork;this._composite._update();}
setWorked(worked,title){this._worked=worked;if(typeof title!=='undefined'){this.setTitle(title);}
this._composite._update();}
worked(worked){this.setWorked(this._worked+(worked||1));}}
class ProgressProxy{constructor(delegate,doneCallback){this._delegate=delegate;this._doneCallback=doneCallback;}
isCanceled(){return this._delegate?this._delegate.isCanceled():false;}
setTitle(title){if(this._delegate){this._delegate.setTitle(title);}}
done(){if(this._delegate){this._delegate.done();}
if(this._doneCallback){this._doneCallback();}}
setTotalWork(totalWork){if(this._delegate){this._delegate.setTotalWork(totalWork);}}
setWorked(worked,title){if(this._delegate){this._delegate.setWorked(worked,title);}}
worked(worked){if(this._delegate){this._delegate.worked(worked);}}}
var Progress$1=Object.freeze({__proto__:null,Progress:Progress,CompositeProgress:CompositeProgress,SubProgress:SubProgress,ProgressProxy:ProgressProxy});class QueryParamHandler{handleQueryParam(value){}}
var QueryParamHandler$1=Object.freeze({__proto__:null,QueryParamHandler:QueryParamHandler});function UIString(string,...vararg){return StringUtilities.vsprintf(localize(string),Array.prototype.slice.call(arguments,1));}
function serializeUIString(string,values=[]){const messageParts=[string];const serializedMessage={messageParts,values};return JSON.stringify(serializedMessage);}
function deserializeUIString(serializedMessage){if(!serializedMessage){return{};}
return JSON.parse(serializedMessage);}
function localize(string){return string;}
class UIStringFormat{constructor(format){this._localizedFormat=localize(format);this._tokenizedFormat=StringUtilities.tokenizeFormatString(this._localizedFormat,StringUtilities.standardFormatters);}
static _append(a,b){return a+b;}
format(vararg){return StringUtilities.format(this._localizedFormat,arguments,StringUtilities.standardFormatters,'',UIStringFormat._append,this._tokenizedFormat).formattedResult;}}
const _substitutionStrings=new WeakMap();function ls(strings,...vararg){if(typeof strings==='string'){return strings;}
let substitutionString=_substitutionStrings.get(strings);if(!substitutionString){substitutionString=strings.join('%s');_substitutionStrings.set(strings,substitutionString);}
return UIString(substitutionString,...vararg);}
var UIString$1=Object.freeze({__proto__:null,UIString:UIString,serializeUIString:serializeUIString,deserializeUIString:deserializeUIString,localize:localize,UIStringFormat:UIStringFormat,ls:ls});class ResourceType{constructor(name,title,category,isTextType){this._name=name;this._title=title;this._category=category;this._isTextType=isTextType;}
static fromMimeType(mimeType){if(!mimeType){return resourceTypes.Other;}
if(mimeType.startsWith('text/html')){return resourceTypes.Document;}
if(mimeType.startsWith('text/css')){return resourceTypes.Stylesheet;}
if(mimeType.startsWith('image/')){return resourceTypes.Image;}
if(mimeType.startsWith('text/')){return resourceTypes.Script;}
if(mimeType.includes('font')){return resourceTypes.Font;}
if(mimeType.includes('script')){return resourceTypes.Script;}
if(mimeType.includes('octet')){return resourceTypes.Other;}
if(mimeType.includes('application')){return resourceTypes.Script;}
return resourceTypes.Other;}
static fromURL(url){return _resourceTypeByExtension.get(ParsedURL.extractExtension(url))||null;}
static fromName(name){for(const resourceTypeId in resourceTypes){const resourceType=(resourceTypes)[resourceTypeId];if(resourceType.name()===name){return resourceType;}}
return null;}
static mimeFromURL(url){const name=ParsedURL.extractName(url);if(_mimeTypeByName.has(name)){return _mimeTypeByName.get(name);}
const ext=ParsedURL.extractExtension(url).toLowerCase();return _mimeTypeByExtension.get(ext);}
static mimeFromExtension(ext){return _mimeTypeByExtension.get(ext);}
name(){return this._name;}
title(){return this._title;}
category(){return this._category;}
isTextType(){return this._isTextType;}
isScript(){return this._name==='script'||this._name==='sm-script';}
hasScripts(){return this.isScript()||this.isDocument();}
isStyleSheet(){return this._name==='stylesheet'||this._name==='sm-stylesheet';}
isDocument(){return this._name==='document';}
isDocumentOrScriptOrStyleSheet(){return this.isDocument()||this.isScript()||this.isStyleSheet();}
isFromSourceMap(){return this._name.startsWith('sm-');}
toString(){return this._name;}
canonicalMimeType(){if(this.isDocument()){return'text/html';}
if(this.isScript()){return'text/javascript';}
if(this.isStyleSheet()){return'text/css';}
return'';}}
class ResourceCategory{constructor(title,shortTitle){this.title=title;this.shortTitle=shortTitle;}}
const resourceCategories={XHR:new ResourceCategory(ls`XHR and Fetch`,ls`XHR`),Script:new ResourceCategory(ls`Scripts`,ls`JS`),Stylesheet:new ResourceCategory(ls`Stylesheets`,ls`CSS`),Image:new ResourceCategory(ls`Images`,ls`Img`),Media:new ResourceCategory(ls`Media`,ls`Media`),Font:new ResourceCategory(ls`Fonts`,ls`Font`),Document:new ResourceCategory(ls`Documents`,ls`Doc`),WebSocket:new ResourceCategory(ls`WebSockets`,ls`WS`),Manifest:new ResourceCategory(ls`Manifest`,ls`Manifest`),Other:new ResourceCategory(ls`Other`,ls`Other`)};const resourceTypes={XHR:new ResourceType('xhr',ls`XHR`,resourceCategories.XHR,true),Fetch:new ResourceType('fetch',ls`Fetch`,resourceCategories.XHR,true),EventSource:new ResourceType('eventsource',ls`EventSource`,resourceCategories.XHR,true),Script:new ResourceType('script',ls`Script`,resourceCategories.Script,true),Stylesheet:new ResourceType('stylesheet',ls`Stylesheet`,resourceCategories.Stylesheet,true),Image:new ResourceType('image',ls`Image`,resourceCategories.Image,false),Media:new ResourceType('media',ls`Media`,resourceCategories.Media,false),Font:new ResourceType('font',ls`Font`,resourceCategories.Font,false),Document:new ResourceType('document',ls`Document`,resourceCategories.Document,true),TextTrack:new ResourceType('texttrack',ls`TextTrack`,resourceCategories.Other,true),WebSocket:new ResourceType('websocket',ls`WebSocket`,resourceCategories.WebSocket,false),Other:new ResourceType('other',ls`Other`,resourceCategories.Other,false),SourceMapScript:new ResourceType('sm-script',ls`Script`,resourceCategories.Script,true),SourceMapStyleSheet:new ResourceType('sm-stylesheet',ls`Stylesheet`,resourceCategories.Stylesheet,true),Manifest:new ResourceType('manifest',ls`Manifest`,resourceCategories.Manifest,true),SignedExchange:new ResourceType('signed-exchange',ls`SignedExchange`,resourceCategories.Other,false)};const _mimeTypeByName=new Map([['Cakefile','text/x-coffeescript']]);const _resourceTypeByExtension=new Map([['js',resourceTypes.Script],['mjs',resourceTypes.Script],['css',resourceTypes.Stylesheet],['xsl',resourceTypes.Stylesheet],['jpeg',resourceTypes.Image],['jpg',resourceTypes.Image],['svg',resourceTypes.Image],['gif',resourceTypes.Image],['png',resourceTypes.Image],['ico',resourceTypes.Image],['tiff',resourceTypes.Image],['tif',resourceTypes.Image],['bmp',resourceTypes.Image],['webp',resourceTypes.Media],['ttf',resourceTypes.Font],['otf',resourceTypes.Font],['ttc',resourceTypes.Font],['woff',resourceTypes.Font]]);const _mimeTypeByExtension=new Map([['js','text/javascript'],['mjs','text/javascript'],['css','text/css'],['html','text/html'],['htm','text/html'],['xml','application/xml'],['xsl','application/xml'],['asp','application/x-aspx'],['aspx','application/x-aspx'],['jsp','application/x-jsp'],['c','text/x-c++src'],['cc','text/x-c++src'],['cpp','text/x-c++src'],['h','text/x-c++src'],['m','text/x-c++src'],['mm','text/x-c++src'],['coffee','text/x-coffeescript'],['dart','text/javascript'],['ts','text/typescript'],['tsx','text/typescript-jsx'],['json','application/json'],['gyp','application/json'],['gypi','application/json'],['cs','text/x-csharp'],['java','text/x-java'],['less','text/x-less'],['php','text/x-php'],['phtml','application/x-httpd-php'],['py','text/x-python'],['sh','text/x-sh'],['scss','text/x-scss'],['vtt','text/vtt'],['ls','text/x-livescript'],['md','text/markdown'],['cljs','text/x-clojure'],['cljc','text/x-clojure'],['cljx','text/x-clojure'],['styl','text/x-styl'],['jsx','text/jsx'],['jpeg','image/jpeg'],['jpg','image/jpeg'],['svg','image/svg+xml'],['gif','image/gif'],['webp','image/webp'],['png','image/png'],['ico','image/ico'],['tiff','image/tiff'],['tif','image/tif'],['bmp','image/bmp'],['ttf','font/opentype'],['otf','font/opentype'],['ttc','font/opentype'],['woff','application/font-woff']]);var ResourceType$1=Object.freeze({__proto__:null,ResourceType:ResourceType,ResourceCategory:ResourceCategory,resourceCategories:resourceCategories,resourceTypes:resourceTypes,_mimeTypeByName:_mimeTypeByName,_resourceTypeByExtension:_resourceTypeByExtension,_mimeTypeByExtension:_mimeTypeByExtension});class Runnable{run(){throw new Error('not implemented');}}
var Runnable$1=Object.freeze({__proto__:null,Runnable:Runnable});class Segment{constructor(begin,end,data){if(begin>end){throw new Error('Invalid segment');}
this.begin=begin;this.end=end;this.data=data;}
intersects(that){return this.begin<that.end&&that.begin<this.end;}}
class SegmentedRange{constructor(mergeCallback){this._segments=[];this._mergeCallback=mergeCallback;}
append(newSegment){let startIndex=this._segments.lowerBound(newSegment,(a,b)=>a.begin-b.begin);let endIndex=startIndex;let merged=null;if(startIndex>0){const precedingSegment=this._segments[startIndex-1];merged=this._tryMerge(precedingSegment,newSegment);if(merged){--startIndex;newSegment=merged;}else if(this._segments[startIndex-1].end>=newSegment.begin){if(newSegment.end<precedingSegment.end){this._segments.splice(startIndex,0,new Segment(newSegment.end,precedingSegment.end,precedingSegment.data));}
precedingSegment.end=newSegment.begin;}}
while(endIndex<this._segments.length&&this._segments[endIndex].end<=newSegment.end){++endIndex;}
if(endIndex<this._segments.length){merged=this._tryMerge(newSegment,this._segments[endIndex]);if(merged){endIndex++;newSegment=merged;}else if(newSegment.intersects(this._segments[endIndex])){this._segments[endIndex].begin=newSegment.end;}}
this._segments.splice(startIndex,endIndex-startIndex,newSegment);}
appendRange(that){that.segments().forEach(segment=>this.append(segment));}
segments(){return this._segments;}
_tryMerge(first,second){const merged=this._mergeCallback&&this._mergeCallback(first,second);if(!merged){return null;}
merged.begin=first.begin;merged.end=Math.max(first.end,second.end);return merged;}}
var SegmentedRange$1=Object.freeze({__proto__:null,Segment:Segment,SegmentedRange:SegmentedRange});let settingsInstance;class Settings{constructor(globalStorage,localStorage){this._globalStorage=globalStorage;this._localStorage=localStorage;this._sessionStorage=new SettingsStorage({});this._eventSupport=new ObjectWrapper();this._registry=new Map();this._moduleSettings=new Map();self.runtime.extensions('setting').forEach(this._registerModuleSetting.bind(this));}
static hasInstance(){return typeof settingsInstance!=='undefined';}
static instance(opts={forceNew:null,globalStorage:null,localStorage:null}){const{forceNew,globalStorage,localStorage}=opts;if(!settingsInstance||forceNew){if(!globalStorage||!localStorage){throw new Error(`Unable to create settings: global and local storage must be provided: ${new Error().stack}`);}
settingsInstance=new Settings(globalStorage,localStorage);}
return settingsInstance;}
_registerModuleSetting(extension){const descriptor=extension.descriptor();const settingName=descriptor['settingName'];const isRegex=descriptor['settingType']==='regex';const defaultValue=descriptor['defaultValue'];let storageType;switch(descriptor['storageType']){case'local':storageType=SettingStorageType.Local;break;case'session':storageType=SettingStorageType.Session;break;case'global':storageType=SettingStorageType.Global;break;default:storageType=SettingStorageType.Global;}
const setting=isRegex?this.createRegExpSetting(settingName,defaultValue,undefined,storageType):this.createSetting(settingName,defaultValue,storageType);if(extension.title()){setting.setTitle(extension.title());}
if(descriptor['userActionCondition']){setting.setRequiresUserAction(!!Runtime.Runtime.queryParam(descriptor['userActionCondition']));}
setting._extension=extension;this._moduleSettings.set(settingName,setting);}
moduleSetting(settingName){const setting=this._moduleSettings.get(settingName);if(!setting){throw new Error('No setting registered: '+settingName);}
return setting;}
settingForTest(settingName){const setting=this._registry.get(settingName);if(!setting){throw new Error('No setting registered: '+settingName);}
return setting;}
createSetting(key,defaultValue,storageType){const storage=this._storageFromType(storageType);if(!this._registry.get(key)){this._registry.set(key,new Setting(this,key,defaultValue,this._eventSupport,storage));}
return(this._registry.get(key));}
createLocalSetting(key,defaultValue){return this.createSetting(key,defaultValue,SettingStorageType.Local);}
createRegExpSetting(key,defaultValue,regexFlags,storageType){if(!this._registry.get(key)){this._registry.set(key,new RegExpSetting(this,key,defaultValue,this._eventSupport,this._storageFromType(storageType),regexFlags));}
return(this._registry.get(key));}
clearAll(){this._globalStorage.removeAll();this._localStorage.removeAll();const versionSetting=Settings.instance().createSetting(VersionController._currentVersionName,0);versionSetting.set(VersionController.currentVersion);}
_storageFromType(storageType){switch(storageType){case(SettingStorageType.Local):return this._localStorage;case(SettingStorageType.Session):return this._sessionStorage;case(SettingStorageType.Global):return this._globalStorage;}
return this._globalStorage;}}
class SettingsStorage{constructor(object,setCallback,removeCallback,removeAllCallback,storagePrefix){this._object=object;this._setCallback=setCallback||function(){};this._removeCallback=removeCallback||function(){};this._removeAllCallback=removeAllCallback||function(){};this._storagePrefix=storagePrefix||'';}
set(name,value){name=this._storagePrefix+name;this._object[name]=value;this._setCallback(name,value);}
has(name){name=this._storagePrefix+name;return name in this._object;}
get(name){name=this._storagePrefix+name;return this._object[name];}
remove(name){name=this._storagePrefix+name;delete this._object[name];this._removeCallback(name);}
removeAll(){this._object={};this._removeAllCallback();}
_dumpSizes(){Console.instance().log('Ten largest settings: ');const sizes={__proto__:null};for(const key in this._object){sizes[key]=this._object[key].length;}
const keys=Object.keys(sizes);function comparator(key1,key2){return sizes[key2]-sizes[key1];}
keys.sort(comparator);for(let i=0;i<10&&i<keys.length;++i){Console.instance().log('Setting: \''+keys[i]+'\', size: '+sizes[keys[i]]);}}}
class Setting{constructor(settings,name,defaultValue,eventSupport,storage){this._settings=settings;this._name=name;this._defaultValue=defaultValue;this._eventSupport=eventSupport;this._storage=storage;this._title='';this._extension=null;}
addChangeListener(listener,thisObject){return this._eventSupport.addEventListener(this._name,listener,thisObject);}
removeChangeListener(listener,thisObject){this._eventSupport.removeEventListener(this._name,listener,thisObject);}
get name(){return this._name;}
title(){return this._title;}
setTitle(title){this._title=title;}
setRequiresUserAction(requiresUserAction){this._requiresUserAction=requiresUserAction;}
get(){if(this._requiresUserAction&&!this._hadUserAction){return this._defaultValue;}
if(typeof this._value!=='undefined'){return this._value;}
this._value=this._defaultValue;if(this._storage.has(this._name)){try{this._value=JSON.parse(this._storage.get(this._name));}catch(e){this._storage.remove(this._name);}}
return this._value;}
set(value){this._hadUserAction=true;this._value=value;try{const settingString=JSON.stringify(value);try{this._storage.set(this._name,settingString);}catch(e){this._printSettingsSavingError(e.message,this._name,settingString);}}catch(e){Console.instance().error('Cannot stringify setting with name: '+this._name+', error: '+e.message);}
this._eventSupport.dispatchEventToListeners(this._name,value);}
remove(){this._settings._registry.delete(this._name);this._settings._moduleSettings.delete(this._name);this._storage.remove(this._name);}
extension(){return this._extension;}
_printSettingsSavingError(message,name,value){const errorMessage='Error saving setting with name: '+this._name+', value length: '+value.length+'. Error: '+message;console.error(errorMessage);Console.instance().error(errorMessage);this._storage._dumpSizes();}}
class RegExpSetting extends Setting{constructor(settings,name,defaultValue,eventSupport,storage,regexFlags){super(settings,name,defaultValue?[{pattern:defaultValue}]:[],eventSupport,storage);this._regexFlags=regexFlags;}
get(){const result=[];const items=this.getAsArray();for(let i=0;i<items.length;++i){const item=items[i];if(item.pattern&&!item.disabled){result.push(item.pattern);}}
return result.join('|');}
getAsArray(){return super.get();}
set(value){this.setAsArray([{pattern:value,disabled:false}]);}
setAsArray(value){delete this._regex;super.set(value);}
asRegExp(){if(typeof this._regex!=='undefined'){return this._regex;}
this._regex=null;try{const pattern=this.get();if(pattern){this._regex=new RegExp(pattern,this._regexFlags||'');}}catch(e){}
return this._regex;}}
class VersionController{static get _currentVersionName(){return'inspectorVersion';}
static get currentVersion(){return 29;}
updateVersion(){const localStorageVersion=window.localStorage?window.localStorage[VersionController._currentVersionName]:0;const versionSetting=Settings.instance().createSetting(VersionController._currentVersionName,0);const currentVersion=VersionController.currentVersion;const oldVersion=versionSetting.get()||parseInt(localStorageVersion||'0',10);if(oldVersion===0){versionSetting.set(currentVersion);return;}
const methodsToRun=this._methodsToRunToUpdateVersion(oldVersion,currentVersion);for(const method of methodsToRun){this[method].call(this);}
versionSetting.set(currentVersion);}
_methodsToRunToUpdateVersion(oldVersion,currentVersion){const result=[];for(let i=oldVersion;i<currentVersion;++i){result.push('_updateVersionFrom'+i+'To'+(i+1));}
return result;}
_updateVersionFrom0To1(){this._clearBreakpointsWhenTooMany(Settings.instance().createLocalSetting('breakpoints',[]),500000);}
_updateVersionFrom1To2(){Settings.instance().createSetting('previouslyViewedFiles',[]).set([]);}
_updateVersionFrom2To3(){Settings.instance().createSetting('fileSystemMapping',{}).set({});Settings.instance().createSetting('fileMappingEntries',[]).remove();}
_updateVersionFrom3To4(){const advancedMode=Settings.instance().createSetting('showHeaSnapshotObjectsHiddenProperties',false);moduleSetting('showAdvancedHeapSnapshotProperties').set(advancedMode.get());advancedMode.remove();}
_updateVersionFrom4To5(){const settingNames={'FileSystemViewSidebarWidth':'fileSystemViewSplitViewState','elementsSidebarWidth':'elementsPanelSplitViewState','StylesPaneSplitRatio':'stylesPaneSplitViewState','heapSnapshotRetainersViewSize':'heapSnapshotSplitViewState','InspectorView.splitView':'InspectorView.splitViewState','InspectorView.screencastSplitView':'InspectorView.screencastSplitViewState','Inspector.drawerSplitView':'Inspector.drawerSplitViewState','layerDetailsSplitView':'layerDetailsSplitViewState','networkSidebarWidth':'networkPanelSplitViewState','sourcesSidebarWidth':'sourcesPanelSplitViewState','scriptsPanelNavigatorSidebarWidth':'sourcesPanelNavigatorSplitViewState','sourcesPanelSplitSidebarRatio':'sourcesPanelDebuggerSidebarSplitViewState','timeline-details':'timelinePanelDetailsSplitViewState','timeline-split':'timelinePanelRecorsSplitViewState','timeline-view':'timelinePanelTimelineStackSplitViewState','auditsSidebarWidth':'auditsPanelSplitViewState','layersSidebarWidth':'layersPanelSplitViewState','profilesSidebarWidth':'profilesPanelSplitViewState','resourcesSidebarWidth':'resourcesPanelSplitViewState'};const empty={};for(const oldName in settingNames){const newName=settingNames[oldName];const oldNameH=oldName+'H';let newValue=null;const oldSetting=Settings.instance().createSetting(oldName,empty);if(oldSetting.get()!==empty){newValue=newValue||{};newValue.vertical={};newValue.vertical.size=oldSetting.get();oldSetting.remove();}
const oldSettingH=Settings.instance().createSetting(oldNameH,empty);if(oldSettingH.get()!==empty){newValue=newValue||{};newValue.horizontal={};newValue.horizontal.size=oldSettingH.get();oldSettingH.remove();}
if(newValue){Settings.instance().createSetting(newName,{}).set(newValue);}}}
_updateVersionFrom5To6(){const settingNames={'debuggerSidebarHidden':'sourcesPanelSplitViewState','navigatorHidden':'sourcesPanelNavigatorSplitViewState','WebInspector.Drawer.showOnLoad':'Inspector.drawerSplitViewState'};for(const oldName in settingNames){const oldSetting=Settings.instance().createSetting(oldName,null);if(oldSetting.get()===null){oldSetting.remove();continue;}
const newName=settingNames[oldName];const invert=oldName==='WebInspector.Drawer.showOnLoad';const hidden=oldSetting.get()!==invert;oldSetting.remove();const showMode=hidden?'OnlyMain':'Both';const newSetting=Settings.instance().createSetting(newName,{});const newValue=newSetting.get()||{};newValue.vertical=newValue.vertical||{};newValue.vertical.showMode=showMode;newValue.horizontal=newValue.horizontal||{};newValue.horizontal.showMode=showMode;newSetting.set(newValue);}}
_updateVersionFrom6To7(){const settingNames={'sourcesPanelNavigatorSplitViewState':'sourcesPanelNavigatorSplitViewState','elementsPanelSplitViewState':'elementsPanelSplitViewState','stylesPaneSplitViewState':'stylesPaneSplitViewState','sourcesPanelDebuggerSidebarSplitViewState':'sourcesPanelDebuggerSidebarSplitViewState'};const empty={};for(const name in settingNames){const setting=Settings.instance().createSetting(name,empty);const value=setting.get();if(value===empty){continue;}
if(value.vertical&&value.vertical.size&&value.vertical.size<1){value.vertical.size=0;}
if(value.horizontal&&value.horizontal.size&&value.horizontal.size<1){value.horizontal.size=0;}
setting.set(value);}}
_updateVersionFrom7To8(){}
_updateVersionFrom8To9(){const settingNames=['skipStackFramesPattern','workspaceFolderExcludePattern'];for(let i=0;i<settingNames.length;++i){const setting=Settings.instance().createSetting(settingNames[i],'');let value=setting.get();if(!value){return;}
if(typeof value==='string'){value=[value];}
for(let j=0;j<value.length;++j){if(typeof value[j]==='string'){value[j]={pattern:value[j]};}}
setting.set(value);}}
_updateVersionFrom9To10(){if(!window.localStorage){return;}
for(const key in window.localStorage){if(key.startsWith('revision-history')){window.localStorage.removeItem(key);}}}
_updateVersionFrom10To11(){const oldSettingName='customDevicePresets';const newSettingName='customEmulatedDeviceList';const oldSetting=Settings.instance().createSetting(oldSettingName,undefined);const list=oldSetting.get();if(!Array.isArray(list)){return;}
const newList=[];for(let i=0;i<list.length;++i){const value=list[i];const device={};device['title']=value['title'];device['type']='unknown';device['user-agent']=value['userAgent'];device['capabilities']=[];if(value['touch']){device['capabilities'].push('touch');}
if(value['mobile']){device['capabilities'].push('mobile');}
device['screen']={};device['screen']['vertical']={width:value['width'],height:value['height']};device['screen']['horizontal']={width:value['height'],height:value['width']};device['screen']['device-pixel-ratio']=value['deviceScaleFactor'];device['modes']=[];device['show-by-default']=true;device['show']='Default';newList.push(device);}
if(newList.length){Settings.instance().createSetting(newSettingName,[]).set(newList);}
oldSetting.remove();}
_updateVersionFrom11To12(){this._migrateSettingsFromLocalStorage();}
_updateVersionFrom12To13(){this._migrateSettingsFromLocalStorage();Settings.instance().createSetting('timelineOverviewMode','').remove();}
_updateVersionFrom13To14(){const defaultValue={'throughput':-1,'latency':0};Settings.instance().createSetting('networkConditions',defaultValue).set(defaultValue);}
_updateVersionFrom14To15(){const setting=Settings.instance().createLocalSetting('workspaceExcludedFolders',{});const oldValue=setting.get();const newValue={};for(const fileSystemPath in oldValue){newValue[fileSystemPath]=[];for(const entry of oldValue[fileSystemPath]){newValue[fileSystemPath].push(entry.path);}}
setting.set(newValue);}
_updateVersionFrom15To16(){const setting=Settings.instance().createSetting('InspectorView.panelOrder',{});const tabOrders=setting.get();for(const key of Object.keys(tabOrders)){tabOrders[key]=(tabOrders[key]+1)*10;}
setting.set(tabOrders);}
_updateVersionFrom16To17(){const setting=Settings.instance().createSetting('networkConditionsCustomProfiles',[]);const oldValue=setting.get();const newValue=[];if(Array.isArray(oldValue)){for(const preset of oldValue){if(typeof preset.title==='string'&&typeof preset.value==='object'&&typeof preset.value.throughput==='number'&&typeof preset.value.latency==='number'){newValue.push({title:preset.title,value:{download:preset.value.throughput,upload:preset.value.throughput,latency:preset.value.latency}});}}}
setting.set(newValue);}
_updateVersionFrom17To18(){const setting=Settings.instance().createLocalSetting('workspaceExcludedFolders',{});const oldValue=setting.get();const newValue={};for(const oldKey in oldValue){let newKey=oldKey.replace(/\\/g,'/');if(!newKey.startsWith('file://')){if(newKey.startsWith('/')){newKey='file://'+newKey;}else{newKey='file:///'+newKey;}}
newValue[newKey]=oldValue[oldKey];}
setting.set(newValue);}
_updateVersionFrom18To19(){const defaultColumns={status:true,type:true,initiator:true,size:true,time:true};const visibleColumnSettings=Settings.instance().createSetting('networkLogColumnsVisibility',defaultColumns);const visibleColumns=visibleColumnSettings.get();visibleColumns.name=true;visibleColumns.timeline=true;const configs={};for(const columnId in visibleColumns){if(!visibleColumns.hasOwnProperty(columnId)){continue;}
configs[columnId.toLowerCase()]={visible:visibleColumns[columnId]};}
const newSetting=Settings.instance().createSetting('networkLogColumns',{});newSetting.set(configs);visibleColumnSettings.remove();}
_updateVersionFrom19To20(){const oldSetting=Settings.instance().createSetting('InspectorView.panelOrder',{});const newSetting=Settings.instance().createSetting('panel-tabOrder',{});newSetting.set(oldSetting.get());oldSetting.remove();}
_updateVersionFrom20To21(){const networkColumns=Settings.instance().createSetting('networkLogColumns',{});const columns=(networkColumns.get());delete columns['timeline'];delete columns['waterfall'];networkColumns.set(columns);}
_updateVersionFrom21To22(){const breakpointsSetting=Settings.instance().createLocalSetting('breakpoints',[]);const breakpoints=breakpointsSetting.get();for(const breakpoint of breakpoints){breakpoint['url']=breakpoint['sourceFileId'];delete breakpoint['sourceFileId'];}
breakpointsSetting.set(breakpoints);}
_updateVersionFrom22To23(){}
_updateVersionFrom23To24(){const oldSetting=Settings.instance().createSetting('searchInContentScripts',false);const newSetting=Settings.instance().createSetting('searchInAnonymousAndContentScripts',false);newSetting.set(oldSetting.get());oldSetting.remove();}
_updateVersionFrom24To25(){const defaultColumns={status:true,type:true,initiator:true,size:true,time:true};const networkLogColumnsSetting=Settings.instance().createSetting('networkLogColumns',defaultColumns);const columns=networkLogColumnsSetting.get();delete columns.product;networkLogColumnsSetting.set(columns);}
_updateVersionFrom25To26(){const oldSetting=Settings.instance().createSetting('messageURLFilters',{});const urls=Object.keys(oldSetting.get());const textFilter=urls.map(url=>`-url:${url}`).join(' ');if(textFilter){const textFilterSetting=Settings.instance().createSetting('console.textFilter','');const suffix=textFilterSetting.get()?` ${textFilterSetting.get()}`:'';textFilterSetting.set(`${textFilter}${suffix}`);}
oldSetting.remove();}
_updateVersionFrom26To27(){function renameKeyInObjectSetting(settingName,from,to){const setting=Settings.instance().createSetting(settingName,{});const value=setting.get();if(from in value){value[to]=value[from];delete value[from];setting.set(value);}}
function renameInStringSetting(settingName,from,to){const setting=Settings.instance().createSetting(settingName,'');const value=setting.get();if(value===from){setting.set(to);}}
renameKeyInObjectSetting('panel-tabOrder','audits2','audits');renameKeyInObjectSetting('panel-closeableTabs','audits2','audits');renameInStringSetting('panel-selectedTab','audits2','audits');}
_updateVersionFrom27To28(){const setting=Settings.instance().createSetting('uiTheme','systemPreferred');if(setting.get()==='default'){setting.set('systemPreferred');}}
_updateVersionFrom28To29(){function renameKeyInObjectSetting(settingName,from,to){const setting=Settings.instance().createSetting(settingName,{});const value=setting.get();if(from in value){value[to]=value[from];delete value[from];setting.set(value);}}
function renameInStringSetting(settingName,from,to){const setting=Settings.instance().createSetting(settingName,'');const value=setting.get();if(value===from){setting.set(to);}}
renameKeyInObjectSetting('panel-tabOrder','audits','lighthouse');renameKeyInObjectSetting('panel-closeableTabs','audits','lighthouse');renameInStringSetting('panel-selectedTab','audits','lighthouse');}
_migrateSettingsFromLocalStorage(){const localSettings=new Set(['advancedSearchConfig','breakpoints','consoleHistory','domBreakpoints','eventListenerBreakpoints','fileSystemMapping','lastSelectedSourcesSidebarPaneTab','previouslyViewedFiles','savedURLs','watchExpressions','workspaceExcludedFolders','xhrBreakpoints']);if(!window.localStorage){return;}
for(const key in window.localStorage){if(localSettings.has(key)){continue;}
const value=window.localStorage[key];window.localStorage.removeItem(key);Settings.instance()._globalStorage.set(key,value);}}
_clearBreakpointsWhenTooMany(breakpointsSetting,maxBreakpointsCount){if(breakpointsSetting.get().length>maxBreakpointsCount){breakpointsSetting.set([]);}}}
const SettingStorageType={Global:Symbol('Global'),Local:Symbol('Local'),Session:Symbol('Session')};function moduleSetting(settingName){return Settings.instance().moduleSetting(settingName);}
function settingForTest(settingName){return Settings.instance().settingForTest(settingName);}
function detectColorFormat(color){const cf=Format;let format;const formatSetting=Settings.instance().moduleSetting('colorFormat').get();if(formatSetting===cf.Original){format=cf.Original;}else if(formatSetting===cf.RGB){format=(color.hasAlpha()?cf.RGBA:cf.RGB);}else if(formatSetting===cf.HSL){format=(color.hasAlpha()?cf.HSLA:cf.HSL);}else if(formatSetting===cf.HEX){format=color.detectHEXFormat();}else{format=cf.RGBA;}
return format;}
var Settings$1=Object.freeze({__proto__:null,Settings:Settings,SettingsStorage:SettingsStorage,Setting:Setting,RegExpSetting:RegExpSetting,VersionController:VersionController,SettingStorageType:SettingStorageType,moduleSetting:moduleSetting,settingForTest:settingForTest,detectColorFormat:detectColorFormat});class OutputStream{async write(data){}
async close(){}}
class StringOutputStream{constructor(){this._data='';}
async write(chunk){this._data+=chunk;}
async close(){}
data(){return this._data;}}
var StringOutputStream$1=Object.freeze({__proto__:null,OutputStream:OutputStream,StringOutputStream:StringOutputStream});class Trie{constructor(){this._size;this._root=0;this._edges;this._isWord;this._wordsInSubtree;this._freeNodes;this.clear();}
add(word){let node=this._root;++this._wordsInSubtree[this._root];for(let i=0;i<word.length;++i){const edge=word[i];let next=this._edges[node][edge];if(!next){if(this._freeNodes.length){next=(this._freeNodes.pop());}else{next=this._size++;this._isWord.push(false);this._wordsInSubtree.push(0);this._edges.push(({__proto__:null}));}
this._edges[node][edge]=next;}
++this._wordsInSubtree[next];node=next;}
this._isWord[node]=true;}
remove(word){if(!this.has(word)){return false;}
let node=this._root;--this._wordsInSubtree[this._root];for(let i=0;i<word.length;++i){const edge=word[i];const next=this._edges[node][edge];if(!--this._wordsInSubtree[next]){delete this._edges[node][edge];this._freeNodes.push(next);}
node=next;}
this._isWord[node]=false;return true;}
has(word){let node=this._root;for(let i=0;i<word.length;++i){node=this._edges[node][word[i]];if(!node){return false;}}
return this._isWord[node];}
words(prefix){prefix=prefix||'';let node=this._root;for(let i=0;i<prefix.length;++i){node=this._edges[node][prefix[i]];if(!node){return[];}}
const results=[];this._dfs(node,prefix,results);return results;}
_dfs(node,prefix,results){if(this._isWord[node]){results.push(prefix);}
const edges=this._edges[node];for(const edge in edges){this._dfs(edges[edge],prefix+edge,results);}}
longestPrefix(word,fullWordOnly){let node=this._root;let wordIndex=0;for(let i=0;i<word.length;++i){node=this._edges[node][word[i]];if(!node){break;}
if(!fullWordOnly||this._isWord[node]){wordIndex=i+1;}}
return word.substring(0,wordIndex);}
clear(){this._size=1;this._root=0;this._edges=[({__proto__:null})];this._isWord=[false];this._wordsInSubtree=[0];this._freeNodes=[];}}
var Trie$1=Object.freeze({__proto__:null,Trie:Trie});class TextDictionary{constructor(){this._words=new Map();this._index=new Trie();}
addWord(word){let count=this._words.get(word)||0;++count;this._words.set(word,count);this._index.add(word);}
removeWord(word){let count=this._words.get(word)||0;if(!count){return;}
if(count===1){this._words.delete(word);this._index.remove(word);return;}
--count;this._words.set(word,count);}
wordsWithPrefix(prefix){return this._index.words(prefix);}
hasWord(word){return this._words.has(word);}
wordCount(word){return this._words.get(word)||0;}
reset(){this._words.clear();this._index.clear();}}
var TextDictionary$1=Object.freeze({__proto__:null,TextDictionary:TextDictionary});let FinishCallback;class Throttler{constructor(timeout){this._timeout=timeout;this._isRunningProcess=false;this._asSoonAsPossible=false;this._process=null;this._lastCompleteTime=0;this._schedulePromise=new Promise(fulfill=>{this._scheduleResolve=fulfill;});}
_processCompleted(){this._lastCompleteTime=this._getTime();this._isRunningProcess=false;if(this._process){this._innerSchedule(false);}
this._processCompletedForTests();}
_processCompletedForTests(){}
_onTimeout(){delete this._processTimeout;this._asSoonAsPossible=false;this._isRunningProcess=true;Promise.resolve().then(this._process).catch(console.error.bind(console)).then(this._processCompleted.bind(this)).then(this._scheduleResolve);this._schedulePromise=new Promise(fulfill=>{this._scheduleResolve=fulfill;});this._process=null;}
schedule(process,asSoonAsPossible){this._process=process;const hasScheduledTasks=!!this._processTimeout||this._isRunningProcess;const okToFire=this._getTime()-this._lastCompleteTime>this._timeout;asSoonAsPossible=!!asSoonAsPossible||(!hasScheduledTasks&&okToFire);const forceTimerUpdate=asSoonAsPossible&&!this._asSoonAsPossible;this._asSoonAsPossible=this._asSoonAsPossible||asSoonAsPossible;this._innerSchedule(forceTimerUpdate);return this._schedulePromise;}
_innerSchedule(forceTimerUpdate){if(this._isRunningProcess){return;}
if(this._processTimeout&&!forceTimerUpdate){return;}
if(this._processTimeout){this._clearTimeout(this._processTimeout);}
const timeout=this._asSoonAsPossible?0:this._timeout;this._processTimeout=this._setTimeout(this._onTimeout.bind(this),timeout);}
_clearTimeout(timeoutId){clearTimeout(timeoutId);}
_setTimeout(operation,timeout){return window.setTimeout(operation,timeout);}
_getTime(){return window.performance.now();}}
var Throttler$1=Object.freeze({__proto__:null,FinishCallback:FinishCallback,Throttler:Throttler});class WorkerWrapper{constructor(appName){const url=appName+'.js'+location.search;this._workerPromise=new Promise(fulfill=>{const worker=new Worker(url,{type:'module'});worker.onmessage=event=>{console.assert(event.data==='workerReady');worker.onmessage=null;fulfill(worker);};});}
postMessage(message){this._workerPromise.then(worker=>{if(!this._disposed){worker.postMessage(message);}});}
dispose(){this._disposed=true;this._workerPromise.then(worker=>worker.terminate());}
terminate(){this.dispose();}
set onmessage(listener){this._workerPromise.then(worker=>worker.onmessage=listener);}
set onerror(listener){this._workerPromise.then(worker=>worker.onerror=listener);}}
var Worker$1=Object.freeze({__proto__:null,WorkerWrapper:WorkerWrapper});const ls$1=ls;let settings;export{App$1 as App,AppProvider$1 as AppProvider,CharacterIdMap$1 as CharacterIdMap,Color$1 as Color,Console$1 as Console,EventTarget$1 as EventTarget,JavaScriptMetaData$1 as JavaScriptMetaData,Linkifier$1 as Linkifier,_Object as ObjectWrapper,ParsedURL$1 as ParsedURL,Progress$1 as Progress,QueryParamHandler$1 as QueryParamHandler,ResourceType$1 as ResourceType,Revealer$1 as Revealer,Runnable$1 as Runnable,SegmentedRange$1 as SegmentedRange,Settings$1 as Settings,StringOutputStream$1 as StringOutputStream,TextDictionary$1 as TextDictionary,Throttler$1 as Throttler,Trie$1 as Trie,UIString$1 as UIString,Worker$1 as Worker,ls$1 as ls,settings};