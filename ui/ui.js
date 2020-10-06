import{ObjectWrapper,UIString,Settings,Color,EventTarget,Throttler}from'../common/common.js';import{Platform as Platform$1,userMetrics,InspectorFrontendHost,InspectorFrontendHostAPI}from'../host/host.js';import{NumberUtilities,StringUtilities}from'../platform/platform.js';import'../text_utils/text_utils.js';class ContextFlavorListener{flavorChanged(object){}}
var ContextFlavorListener$1=Object.freeze({__proto__:null,ContextFlavorListener:ContextFlavorListener});class Context{constructor(){this._flavors=new Map();this._eventDispatchers=new Map();}
setFlavor(flavorType,flavorValue){const value=this._flavors.get(flavorType)||null;if(value===flavorValue){return;}
if(flavorValue){this._flavors.set(flavorType,flavorValue);}else{this._flavors.delete(flavorType);}
this._dispatchFlavorChange(flavorType,flavorValue);}
_dispatchFlavorChange(flavorType,flavorValue){for(const extension of self.runtime.extensions(ContextFlavorListener)){if(extension.hasContextType(flavorType)){extension.instance().then(instance=>(instance).flavorChanged(flavorValue));}}
const dispatcher=this._eventDispatchers.get(flavorType);if(!dispatcher){return;}
dispatcher.dispatchEventToListeners(Events.FlavorChanged,flavorValue);}
addFlavorChangeListener(flavorType,listener,thisObject){let dispatcher=this._eventDispatchers.get(flavorType);if(!dispatcher){dispatcher=new ObjectWrapper.ObjectWrapper();this._eventDispatchers.set(flavorType,dispatcher);}
dispatcher.addEventListener(Events.FlavorChanged,listener,thisObject);}
removeFlavorChangeListener(flavorType,listener,thisObject){const dispatcher=this._eventDispatchers.get(flavorType);if(!dispatcher){return;}
dispatcher.removeEventListener(Events.FlavorChanged,listener,thisObject);if(!dispatcher.hasEventListeners(Events.FlavorChanged)){this._eventDispatchers.delete(flavorType);}}
flavor(flavorType){return this._flavors.get(flavorType)||null;}
flavors(){return new Set(this._flavors.keys());}
applicableExtensions(extensions){const targetExtensionSet=new Set();const availableFlavors=this.flavors();extensions.forEach(function(extension){if(self.runtime.isExtensionApplicableToContextTypes(extension,availableFlavors)){targetExtensionSet.add(extension);}});return targetExtensionSet;}}
const Events={FlavorChanged:Symbol('FlavorChanged')};var Context$1=Object.freeze({__proto__:null,Context:Context});class ActionDelegate{handleAction(context,actionId){}}
var ActionDelegate$1=Object.freeze({__proto__:null,ActionDelegate:ActionDelegate});class Action extends ObjectWrapper.ObjectWrapper{constructor(extension){super();this._extension=extension;this._enabled=true;this._toggled=false;}
id(){return this._extension.descriptor()['actionId'];}
extension(){return this._extension;}
execute(){return this._extension.instance().then(handleAction.bind(this));function handleAction(actionDelegate){const actionId=this._extension.descriptor()['actionId'];const delegate=(actionDelegate);return delegate.handleAction(self.UI.context,actionId);}}
icon(){return this._extension.descriptor()['iconClass']||'';}
toggledIcon(){return this._extension.descriptor()['toggledIconClass']||'';}
toggleWithRedColor(){return!!this._extension.descriptor()['toggleWithRedColor'];}
setEnabled(enabled){if(this._enabled===enabled){return;}
this._enabled=enabled;this.dispatchEventToListeners(Events$1.Enabled,enabled);}
enabled(){return this._enabled;}
category(){return ls(this._extension.descriptor()['category']||'');}
tags(){return this._extension.descriptor()['tags']||'';}
toggleable(){return!!this._extension.descriptor()['toggleable'];}
title(){let title=this._extension.title()||'';const options=this._extension.descriptor()['options'];if(options){for(const pair of options){if(pair['value']!==this._toggled){title=ls(pair['title']);}}}
return title;}
toggled(){return this._toggled;}
setToggled(toggled){console.assert(this.toggleable(),'Shouldn\'t be toggling an untoggleable action',this.id());if(this._toggled===toggled){return;}
this._toggled=toggled;this.dispatchEventToListeners(Events$1.Toggled,toggled);}}
const Events$1={Enabled:Symbol('Enabled'),Toggled:Symbol('Toggled')};var Action$1=Object.freeze({__proto__:null,Action:Action,Events:Events$1});class ActionRegistry{constructor(){this._actionsById=new Map();this._registerActions();}
_registerActions(){self.runtime.extensions('action').forEach(registerExtension,this);function registerExtension(extension){if(!extension.canInstantiate()){return;}
const actionId=extension.descriptor()['actionId'];console.assert(actionId);console.assert(!this._actionsById.get(actionId));const action=new Action(extension);if(!action.category()||action.title()){this._actionsById.set(actionId,action);}else{console.error(`Category actions require a title for command menu: ${actionId}`);}}}
availableActions(){return this.applicableActions([...this._actionsById.keys()],self.UI.context);}
actions(){return[...this._actionsById.values()];}
applicableActions(actionIds,context){const extensions=[];actionIds.forEach(function(actionId){const action=this._actionsById.get(actionId);if(action){extensions.push(action.extension());}},this);return[...context.applicableExtensions(extensions)].map(extensionToAction.bind(this));function extensionToAction(extension){return((this.action(extension.descriptor()['actionId'])));}}
action(actionId){return this._actionsById.get(actionId)||null;}}
var ActionRegistry$1=Object.freeze({__proto__:null,ActionRegistry:ActionRegistry});let _id=0;function nextId(prefix){return(prefix||'')+ ++_id;}
function bindLabelToControl(label,control){const controlId=nextId('labelledControl');control.id=controlId;label.setAttribute('for',controlId);}
function markAsAlert(element){element.setAttribute('role','alert');element.setAttribute('aria-live','polite');}
function markAsApplication(element){element.setAttribute('role','application');}
function markAsButton(element){element.setAttribute('role','button');}
function markAsCheckbox(element){element.setAttribute('role','checkbox');}
function markAsCombobox(element){element.setAttribute('role','combobox');}
function markAsModalDialog(element){element.setAttribute('role','dialog');element.setAttribute('aria-modal','true');}
function markAsGroup(element){element.setAttribute('role','group');}
function markAsLink(element){element.setAttribute('role','link');}
function markAsMenuButton(element){markAsButton(element);element.setAttribute('aria-haspopup',true);}
function markAsProgressBar(element,min=0,max=100){element.setAttribute('role','progressbar');element.setAttribute('aria-valuemin',min);element.setAttribute('aria-valuemax',max);}
function markAsTab(element){element.setAttribute('role','tab');}
function markAsTablist(element){element.setAttribute('role','tablist');}
function markAsTabpanel(element){element.setAttribute('role','tabpanel');}
function markAsTree(element){element.setAttribute('role','tree');}
function markAsTreeitem(element){element.setAttribute('role','treeitem');}
function markAsTextBox(element){element.setAttribute('role','textbox');}
function markAsMenu(element){element.setAttribute('role','menu');}
function markAsMenuItem(element){element.setAttribute('role','menuitem');}
function markAsMenuItemSubMenu(element){markAsMenuItem(element);element.setAttribute('aria-haspopup',true);}
function markAsList(element){element.setAttribute('role','list');}
function markAsListitem(element){element.setAttribute('role','listitem');}
function markAsListBox(element){element.setAttribute('role','listbox');}
function markAsMultiSelectable(element){element.setAttribute('aria-multiselectable','true');}
function markAsOption(element){element.setAttribute('role','option');}
function markAsRadioGroup(element){element.setAttribute('role','radiogroup');}
function markAsHidden(element){element.setAttribute('aria-hidden','true');}
function markAsSlider(element,min=0,max=100){element.setAttribute('role','slider');element.setAttribute('aria-valuemin',String(min));element.setAttribute('aria-valuemax',String(max));}
function markAsHeading(element,level){element.setAttribute('role','heading');element.setAttribute('aria-level',level);}
function markAsPoliteLiveRegion(element,isAtomic){element.setAttribute('aria-live','polite');if(isAtomic){element.setAttribute('aria-atomic','true');}}
function hasRole(element){return element.hasAttribute('role');}
function removeRole(element){element.removeAttribute('role');}
function setPlaceholder(element,placeholder){if(placeholder){element.setAttribute('aria-placeholder',placeholder);}else{element.removeAttribute('aria-placeholder');}}
function markAsPresentation(element){element.setAttribute('role','presentation');}
function markAsStatus(element){element.setAttribute('role','status');}
function ensureId(element){if(!element.id){element.id=nextId('ariaElement');}}
function setAriaValueText(element,valueText){element.setAttribute('aria-valuetext',valueText);}
function setAriaValueNow(element,value){element.setAttribute('aria-valuenow',value);}
function setAriaValueMinMax(element,min,max){element.setAttribute('aria-valuemin',min);element.setAttribute('aria-valuemax',max);}
function setControls(element,controlledElement){if(!controlledElement){element.removeAttribute('aria-controls');return;}
ensureId(controlledElement);element.setAttribute('aria-controls',controlledElement.id);}
function setChecked(element,value){element.setAttribute('aria-checked',!!value);}
function setCheckboxAsIndeterminate(element){element.setAttribute('aria-checked','mixed');}
function setDisabled(element,value){element.setAttribute('aria-disabled',!!value);}
function setExpanded(element,value){element.setAttribute('aria-expanded',!!value);}
function unsetExpandable(element){element.removeAttribute('aria-expanded');}
function setHidden(element,value){element.setAttribute('aria-hidden',!!value);}
const AutocompleteInteractionModel={inline:'inline',list:'list',both:'both',none:'none',};function setAutocomplete(element,interactionModel=AutocompleteInteractionModel.none){element.setAttribute('aria-autocomplete',interactionModel);}
function setSelected(element,value){element.setAttribute('aria-selected',!!value);}
function clearSelected(element){element.removeAttribute('aria-selected');}
function setInvalid(element,value){if(value){element.setAttribute('aria-invalid',value);}else{element.removeAttribute('aria-invalid');}}
function setPressed(element,value){element.setAttribute('aria-pressed',!!value);}
function setValueNow(element,value){element.setAttribute('aria-valuenow',value);}
function setValueText(element,value){element.setAttribute('aria-valuetext',value);}
function setProgressBarValue(element,valueNow,valueText){element.setAttribute('aria-valuenow',valueNow);if(valueText){element.setAttribute('aria-valuetext',valueText);}}
function setAccessibleName(element,name){element.setAttribute('aria-label',name);}
const _descriptionMap=new WeakMap();function setDescription(element,description){if(_descriptionMap.has(element)){_descriptionMap.get(element).remove();}
element.removeAttribute('data-aria-utils-animation-hack');if(!description){_descriptionMap.delete(element);element.removeAttribute('aria-describedby');return;}
const descriptionElement=createElement('span');descriptionElement.textContent=description;descriptionElement.style.display='none';ensureId(descriptionElement);element.setAttribute('aria-describedby',descriptionElement.id);_descriptionMap.set(element,descriptionElement);const contentfulVoidTags=new Set(['INPUT','IMG']);if(!contentfulVoidTags.has(element.tagName)){element.appendChild(descriptionElement);return;}
const inserted=element.insertAdjacentElement('afterend',descriptionElement);if(inserted){return;}
element.setAttribute('data-aria-utils-animation-hack','sorry');element.addEventListener('animationend',()=>{if(_descriptionMap.get(element)!==descriptionElement){return;}
element.removeAttribute('data-aria-utils-animation-hack');element.insertAdjacentElement('afterend',descriptionElement);},{once:true});}
function setActiveDescendant(element,activedescendant){if(!activedescendant){element.removeAttribute('aria-activedescendant');return;}
console.assert(element.hasSameShadowRoot(activedescendant),'elements are not in the same shadow dom');ensureId(activedescendant);element.setAttribute('aria-activedescendant',activedescendant.id);}
function hideFromLayout(element){element.style.position='absolute';element.style.left='-999em';element.style.width='100em';element.style.overflow='hidden';}
const AlertElementSymbol=Symbol('AlertElementSybmol');const MessageElementSymbol=Symbol('MessageElementSymbol');function alert(message,element){const document=element.ownerDocument;const messageElementId='ariaLiveMessageElement';if(!document[MessageElementSymbol]){const messageElement=document.body.createChild('div');messageElement.id=messageElementId;hideFromLayout(messageElement);document[MessageElementSymbol]=messageElement;}
if(!document[AlertElementSymbol]){const alertElement=document.body.createChild('div');hideFromLayout(alertElement);alertElement.setAttribute('role','alert');alertElement.setAttribute('aria-atomic','true');alertElement.setAttribute('aria-describedby',messageElementId);document[AlertElementSymbol]=alertElement;}
setAccessibleName(document[MessageElementSymbol],message.trimEndWithMaxLength(10000));}
var ARIAUtils=Object.freeze({__proto__:null,nextId:nextId,bindLabelToControl:bindLabelToControl,markAsAlert:markAsAlert,markAsApplication:markAsApplication,markAsButton:markAsButton,markAsCheckbox:markAsCheckbox,markAsCombobox:markAsCombobox,markAsModalDialog:markAsModalDialog,markAsGroup:markAsGroup,markAsLink:markAsLink,markAsMenuButton:markAsMenuButton,markAsProgressBar:markAsProgressBar,markAsTab:markAsTab,markAsTablist:markAsTablist,markAsTabpanel:markAsTabpanel,markAsTree:markAsTree,markAsTreeitem:markAsTreeitem,markAsTextBox:markAsTextBox,markAsMenu:markAsMenu,markAsMenuItem:markAsMenuItem,markAsMenuItemSubMenu:markAsMenuItemSubMenu,markAsList:markAsList,markAsListitem:markAsListitem,markAsListBox:markAsListBox,markAsMultiSelectable:markAsMultiSelectable,markAsOption:markAsOption,markAsRadioGroup:markAsRadioGroup,markAsHidden:markAsHidden,markAsSlider:markAsSlider,markAsHeading:markAsHeading,markAsPoliteLiveRegion:markAsPoliteLiveRegion,hasRole:hasRole,removeRole:removeRole,setPlaceholder:setPlaceholder,markAsPresentation:markAsPresentation,markAsStatus:markAsStatus,ensureId:ensureId,setAriaValueText:setAriaValueText,setAriaValueNow:setAriaValueNow,setAriaValueMinMax:setAriaValueMinMax,setControls:setControls,setChecked:setChecked,setCheckboxAsIndeterminate:setCheckboxAsIndeterminate,setDisabled:setDisabled,setExpanded:setExpanded,unsetExpandable:unsetExpandable,setHidden:setHidden,AutocompleteInteractionModel:AutocompleteInteractionModel,setAutocomplete:setAutocomplete,setSelected:setSelected,clearSelected:clearSelected,setInvalid:setInvalid,setPressed:setPressed,setValueNow:setValueNow,setValueText:setValueText,setProgressBarValue:setProgressBarValue,setAccessibleName:setAccessibleName,setDescription:setDescription,setActiveDescendant:setActiveDescendant,alert:alert});const _Eps=1e-5;class Vector{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}
length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);}
normalize(){const length=this.length();if(length<=_Eps){return;}
this.x/=length;this.y/=length;this.z/=length;}}
class Point{constructor(x,y){this.x=x;this.y=y;}
distanceTo(p){return Math.sqrt(Math.pow(p.x-this.x,2)+Math.pow(p.y-this.y,2));}
projectOn(line){if(line.x===0&&line.y===0){return new Point(0,0);}
return line.scale((this.x*line.x+this.y*line.y)/(Math.pow(line.x,2)+Math.pow(line.y,2)));}
scale(scalar){return new Point(this.x*scalar,this.y*scalar);}
toString(){return Math.round(this.x*100)/100+', '+Math.round(this.y*100)/100;}}
class CubicBezier{constructor(point1,point2){this.controlPoints=[point1,point2];}
static parse(text){const keywordValues=CubicBezier.KeywordValues;const value=text.toLowerCase().replace(/\s+/g,'');if(Object.keys(keywordValues).indexOf(value)!==-1){return CubicBezier.parse(keywordValues[value]);}
const bezierRegex=/^cubic-bezier\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/;const match=value.match(bezierRegex);if(match){const control1=new Point(parseFloat(match[1]),parseFloat(match[2]));const control2=new Point(parseFloat(match[3]),parseFloat(match[4]));return new CubicBezier(control1,control2);}
return null;}
evaluateAt(t){function evaluate(v1,v2,t){return 3*(1-t)*(1-t)*t*v1+3*(1-t)*t*t*v2+Math.pow(t,3);}
const x=evaluate(this.controlPoints[0].x,this.controlPoints[1].x,t);const y=evaluate(this.controlPoints[0].y,this.controlPoints[1].y,t);return new Point(x,y);}
asCSSText(){const raw='cubic-bezier('+this.controlPoints.join(', ')+')';const keywordValues=CubicBezier.KeywordValues;for(const keyword in keywordValues){if(raw===keywordValues[keyword]){return keyword;}}
return raw;}}
CubicBezier.Regex=/((cubic-bezier\([^)]+\))|\b(linear|ease-in-out|ease-in|ease-out|ease)\b)/g;CubicBezier.KeywordValues={'linear':'cubic-bezier(0, 0, 1, 1)','ease':'cubic-bezier(0.25, 0.1, 0.25, 1)','ease-in':'cubic-bezier(0.42, 0, 1, 1)','ease-in-out':'cubic-bezier(0.42, 0, 0.58, 1)','ease-out':'cubic-bezier(0, 0, 0.58, 1)'};class EulerAngles{constructor(alpha,beta,gamma){this.alpha=alpha;this.beta=beta;this.gamma=gamma;}
static fromRotationMatrix(rotationMatrix){const beta=Math.atan2(rotationMatrix.m23,rotationMatrix.m33);const gamma=Math.atan2(-rotationMatrix.m13,Math.sqrt(rotationMatrix.m11*rotationMatrix.m11+rotationMatrix.m12*rotationMatrix.m12));const alpha=Math.atan2(rotationMatrix.m12,rotationMatrix.m11);return new EulerAngles(radiansToDegrees(alpha),radiansToDegrees(beta),radiansToDegrees(gamma));}
toRotate3DString(){const gammaAxisY=-Math.sin(degreesToRadians(this.beta));const gammaAxisZ=Math.cos(degreesToRadians(this.beta));const axis={alpha:[0,1,0],beta:[-1,0,0],gamma:[0,gammaAxisY,gammaAxisZ]};return'rotate3d('+axis.alpha.join(',')+','+this.alpha+'deg) '+'rotate3d('+axis.beta.join(',')+','+this.beta+'deg) '+'rotate3d('+axis.gamma.join(',')+','+this.gamma+'deg)';}}
const scalarProduct=function(u,v){return u.x*v.x+u.y*v.y+u.z*v.z;};const crossProduct=function(u,v){const x=u.y*v.z-u.z*v.y;const y=u.z*v.x-u.x*v.z;const z=u.x*v.y-u.y*v.x;return new Vector(x,y,z);};const subtract=function(u,v){const x=u.x-v.x;const y=u.y-v.y;const z=u.z-v.z;return new Vector(x,y,z);};const multiplyVectorByMatrixAndNormalize=function(v,m){const t=v.x*m.m14+v.y*m.m24+v.z*m.m34+m.m44;const x=(v.x*m.m11+v.y*m.m21+v.z*m.m31+m.m41)/t;const y=(v.x*m.m12+v.y*m.m22+v.z*m.m32+m.m42)/t;const z=(v.x*m.m13+v.y*m.m23+v.z*m.m33+m.m43)/t;return new Vector(x,y,z);};const calculateAngle=function(u,v){const uLength=u.length();const vLength=v.length();if(uLength<=_Eps||vLength<=_Eps){return 0;}
const cos=scalarProduct(u,v)/uLength/vLength;if(Math.abs(cos)>1){return 0;}
return radiansToDegrees(Math.acos(cos));};const degreesToRadians=function(deg){return deg*Math.PI/180;};const radiansToDegrees=function(rad){return rad*180/Math.PI;};const boundsForTransformedPoints=function(matrix,points,aggregateBounds){if(!aggregateBounds){aggregateBounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};}
if(points.length%3){console.assert('Invalid size of points array');}
for(let p=0;p<points.length;p+=3){let vector=new Vector(points[p],points[p+1],points[p+2]);vector=multiplyVectorByMatrixAndNormalize(vector,matrix);aggregateBounds.minX=Math.min(aggregateBounds.minX,vector.x);aggregateBounds.maxX=Math.max(aggregateBounds.maxX,vector.x);aggregateBounds.minY=Math.min(aggregateBounds.minY,vector.y);aggregateBounds.maxY=Math.max(aggregateBounds.maxY,vector.y);}
return aggregateBounds;};class Size{constructor(width,height){this.width=width;this.height=height;}
clipTo(size){if(!size){return this;}
return new Size(Math.min(this.width,size.width),Math.min(this.height,size.height));}
scale(scale){return new Size(this.width*scale,this.height*scale);}
isEqual(size){return!!size&&this.width===size.width&&this.height===size.height;}
widthToMax(size){return new Size(Math.max(this.width,(typeof size==='number'?size:size.width)),this.height);}
addWidth(size){return new Size(this.width+(typeof size==='number'?size:size.width),this.height);}
heightToMax(size){return new Size(this.width,Math.max(this.height,(typeof size==='number'?size:size.height)));}
addHeight(size){return new Size(this.width,this.height+(typeof size==='number'?size:size.height));}}
class Insets{constructor(left,top,right,bottom){this.left=left;this.top=top;this.right=right;this.bottom=bottom;}
isEqual(insets){return!!insets&&this.left===insets.left&&this.top===insets.top&&this.right===insets.right&&this.bottom===insets.bottom;}}
class Rect{constructor(left,top,width,height){this.left=left;this.top=top;this.width=width;this.height=height;}
isEqual(rect){return!!rect&&this.left===rect.left&&this.top===rect.top&&this.width===rect.width&&this.height===rect.height;}
scale(scale){return new Rect(this.left*scale,this.top*scale,this.width*scale,this.height*scale);}
size(){return new Size(this.width,this.height);}
relativeTo(origin){return new Rect(this.left-origin.left,this.top-origin.top,this.width,this.height);}
rebaseTo(origin){return new Rect(this.left+origin.left,this.top+origin.top,this.width,this.height);}}
class Constraints{constructor(minimum,preferred){this.minimum=minimum||new Size(0,0);this.preferred=preferred||this.minimum;if(this.minimum.width>this.preferred.width||this.minimum.height>this.preferred.height){throw new Error('Minimum size is greater than preferred.');}}
isEqual(constraints){return!!constraints&&this.minimum.isEqual(constraints.minimum)&&this.preferred.isEqual(constraints.preferred);}
widthToMax(value){if(typeof value==='number'){return new Constraints(this.minimum.widthToMax(value),this.preferred.widthToMax(value));}
return new Constraints(this.minimum.widthToMax(value.minimum),this.preferred.widthToMax(value.preferred));}
addWidth(value){if(typeof value==='number'){return new Constraints(this.minimum.addWidth(value),this.preferred.addWidth(value));}
return new Constraints(this.minimum.addWidth(value.minimum),this.preferred.addWidth(value.preferred));}
heightToMax(value){if(typeof value==='number'){return new Constraints(this.minimum.heightToMax(value),this.preferred.heightToMax(value));}
return new Constraints(this.minimum.heightToMax(value.minimum),this.preferred.heightToMax(value.preferred));}
addHeight(value){if(typeof value==='number'){return new Constraints(this.minimum.addHeight(value),this.preferred.addHeight(value));}
return new Constraints(this.minimum.addHeight(value.minimum),this.preferred.addHeight(value.preferred));}}
var Geometry=Object.freeze({__proto__:null,_Eps:_Eps,Vector:Vector,Point:Point,CubicBezier:CubicBezier,EulerAngles:EulerAngles,scalarProduct:scalarProduct,crossProduct:crossProduct,subtract:subtract,multiplyVectorByMatrixAndNormalize:multiplyVectorByMatrixAndNormalize,calculateAngle:calculateAngle,degreesToRadians:degreesToRadians,radiansToDegrees:radiansToDegrees,boundsForTransformedPoints:boundsForTransformedPoints,Size:Size,Insets:Insets,Rect:Rect,Constraints:Constraints});function registerCustomElement(localName,typeExtension,definition){self.customElements.define(typeExtension,class extends definition{constructor(){super();this.setAttribute('is',typeExtension);}},{extends:localName});return()=>createElement(localName,typeExtension);}
class Icon extends HTMLSpanElement{constructor(){super();this._descriptor=null;this._spriteSheet=null;this._iconType='';}
static create(iconType,className){if(!Icon._constructor){Icon._constructor=registerCustomElement('span','ui-icon',Icon);}
const icon=(Icon._constructor());if(className){icon.className=className;}
if(iconType){icon.setIconType(iconType);}
return icon;}
setIconType(iconType){if(this._descriptor){this.style.removeProperty('--spritesheet-position');this.style.removeProperty('width');this.style.removeProperty('height');this._toggleClasses(false);this._iconType='';this._descriptor=null;this._spriteSheet=null;}
const descriptor=Descriptors[iconType]||null;if(descriptor){this._iconType=iconType;this._descriptor=descriptor;this._spriteSheet=SpriteSheets[this._descriptor.spritesheet];console.assert(this._spriteSheet,`ERROR: icon ${this._iconType} has unknown spritesheet: ${this._descriptor.spritesheet}`);this.style.setProperty('--spritesheet-position',this._propertyValue());this.style.setProperty('width',this._spriteSheet.cellWidth+'px');this.style.setProperty('height',this._spriteSheet.cellHeight+'px');this._toggleClasses(true);}else if(iconType){throw new Error(`ERROR: failed to find icon descriptor for type: ${iconType}`);}}
_toggleClasses(value){this.classList.toggle('spritesheet-'+this._descriptor.spritesheet,value);this.classList.toggle(this._iconType,value);this.classList.toggle('icon-mask',value&&!!this._descriptor.isMask);this.classList.toggle('icon-invert',value&&!!this._descriptor.invert);}
_propertyValue(){if(!this._descriptor.coordinates){if(!this._descriptor.position||!_positionRegex.test(this._descriptor.position)){throw new Error(`ERROR: icon '${this._iconType}' has malformed position: '${this._descriptor.position}'`);}
const column=this._descriptor.position[0].toLowerCase().charCodeAt(0)-97;const row=parseInt(this._descriptor.position.substring(1),10)-1;this._descriptor.coordinates={x:-(this._spriteSheet.cellWidth+this._spriteSheet.padding)*column,y:(this._spriteSheet.cellHeight+this._spriteSheet.padding)*(row+1)-this._spriteSheet.padding};}
return`${this._descriptor.coordinates.x}px ${this._descriptor.coordinates.y}px`;}}
const _positionRegex=/^[a-z][1-9][0-9]*$/;const SpriteSheets={'smallicons':{cellWidth:10,cellHeight:10,padding:10},'mediumicons':{cellWidth:16,cellHeight:16,padding:0},'largeicons':{cellWidth:28,cellHeight:24,padding:0},'arrowicons':{cellWidth:19,cellHeight:19,padding:0}};const Descriptors={'smallicon-bezier':{position:'a5',spritesheet:'smallicons',isMask:true},'smallicon-checkmark':{position:'b5',spritesheet:'smallicons'},'smallicon-checkmark-square':{position:'b6',spritesheet:'smallicons',isMask:true},'smallicon-checkmark-behind':{position:'d6',spritesheet:'smallicons',isMask:true},'smallicon-command-result':{position:'a4',spritesheet:'smallicons'},'smallicon-contrast-ratio':{position:'a6',spritesheet:'smallicons',isMask:true},'smallicon-cross':{position:'b4',spritesheet:'smallicons'},'smallicon-device':{position:'c5',spritesheet:'smallicons'},'smallicon-error':{position:'c4',spritesheet:'smallicons'},'smallicon-expand-less':{position:'f5',spritesheet:'smallicons',isMask:true},'smallicon-expand-more':{position:'e6',spritesheet:'smallicons',isMask:true},'smallicon-green-arrow':{position:'a3',spritesheet:'smallicons'},'smallicon-green-ball':{position:'b3',spritesheet:'smallicons'},'smallicon-info':{position:'c3',spritesheet:'smallicons'},'smallicon-inline-breakpoint-conditional':{position:'d4',spritesheet:'smallicons'},'smallicon-inline-breakpoint':{position:'d5',spritesheet:'smallicons'},'smallicon-no':{position:'c6',spritesheet:'smallicons',isMask:true},'smallicon-orange-ball':{position:'d3',spritesheet:'smallicons'},'smallicon-red-ball':{position:'a2',spritesheet:'smallicons'},'smallicon-shadow':{position:'b2',spritesheet:'smallicons',isMask:true},'smallicon-step-in':{position:'c2',spritesheet:'smallicons'},'smallicon-step-out':{position:'d2',spritesheet:'smallicons'},'smallicon-text-prompt':{position:'e5',spritesheet:'smallicons'},'smallicon-thick-left-arrow':{position:'e4',spritesheet:'smallicons'},'smallicon-thick-right-arrow':{position:'e3',spritesheet:'smallicons'},'smallicon-triangle-down':{position:'e2',spritesheet:'smallicons',isMask:true},'smallicon-triangle-right':{position:'a1',spritesheet:'smallicons',isMask:true},'smallicon-triangle-up':{position:'b1',spritesheet:'smallicons',isMask:true},'smallicon-user-command':{position:'c1',spritesheet:'smallicons'},'smallicon-warning':{position:'d1',spritesheet:'smallicons'},'smallicon-network-product':{position:'e1',spritesheet:'smallicons'},'smallicon-clear-warning':{position:'f1',spritesheet:'smallicons',isMask:true},'smallicon-clear-info':{position:'f2',spritesheet:'smallicons'},'smallicon-clear-error':{position:'f3',spritesheet:'smallicons'},'smallicon-account-circle':{position:'f4',spritesheet:'smallicons'},'smallicon-videoplayer-paused':{position:'f6',spritesheet:'smallicons',isMask:true},'smallicon-videoplayer-playing':{position:'g6',spritesheet:'smallicons',isMask:true},'smallicon-videoplayer-destroyed':{position:'g5',spritesheet:'smallicons',isMask:true},'mediumicon-clear-storage':{position:'a4',spritesheet:'mediumicons',isMask:true},'mediumicon-cookie':{position:'b4',spritesheet:'mediumicons',isMask:true},'mediumicon-database':{position:'c4',spritesheet:'mediumicons',isMask:true},'mediumicon-info':{position:'c1',spritesheet:'mediumicons',isMask:true},'mediumicon-manifest':{position:'d4',spritesheet:'mediumicons',isMask:true},'mediumicon-service-worker':{position:'a3',spritesheet:'mediumicons',isMask:true},'mediumicon-table':{position:'b3',spritesheet:'mediumicons',isMask:true},'mediumicon-arrow-in-circle':{position:'c3',spritesheet:'mediumicons',isMask:true},'mediumicon-file-sync':{position:'d3',spritesheet:'mediumicons',invert:true},'mediumicon-file':{position:'a2',spritesheet:'mediumicons',invert:true},'mediumicon-gray-cross-active':{position:'b2',spritesheet:'mediumicons'},'mediumicon-gray-cross-hover':{position:'c2',spritesheet:'mediumicons'},'mediumicon-red-cross-active':{position:'d2',spritesheet:'mediumicons'},'mediumicon-red-cross-hover':{position:'a1',spritesheet:'mediumicons'},'mediumicon-search':{position:'b1',spritesheet:'mediumicons'},'mediumicon-replace':{position:'c5',spritesheet:'mediumicons',isMask:true},'mediumicon-account-circle':{position:'e4',spritesheet:'mediumicons',isMask:true},'mediumicon-warning-triangle':{position:'e1',spritesheet:'mediumicons'},'mediumicon-error-circle':{position:'e3',spritesheet:'mediumicons'},'mediumicon-info-circle':{position:'e2',spritesheet:'mediumicons'},'mediumicon-bug':{position:'d1',spritesheet:'mediumicons',isMask:true},'mediumicon-list':{position:'e5',spritesheet:'mediumicons',isMask:true},'mediumicon-warning':{position:'d5',spritesheet:'mediumicons',isMask:true},'mediumicon-sync':{position:'a5',spritesheet:'mediumicons',isMask:true},'mediumicon-fetch':{position:'b5',spritesheet:'mediumicons',isMask:true},'mediumicon-cloud':{position:'a6',spritesheet:'mediumicons',isMask:true},'mediumicon-bell':{position:'b6',spritesheet:'mediumicons',isMask:true},'mediumicon-payment':{position:'c6',spritesheet:'mediumicons',isMask:true},'mediumicon-schedule':{position:'d6',spritesheet:'mediumicons',isMask:true},'badge-navigator-file-sync':{position:'a9',spritesheet:'largeicons'},'largeicon-activate-breakpoints':{position:'b9',spritesheet:'largeicons',isMask:true},'largeicon-add':{position:'a8',spritesheet:'largeicons',isMask:true},'largeicon-background-color':{position:'b8',spritesheet:'largeicons',isMask:true},'largeicon-box-shadow':{position:'a7',spritesheet:'largeicons',isMask:true},'largeicon-camera':{position:'b7',spritesheet:'largeicons',isMask:true},'largeicon-center':{position:'c9',spritesheet:'largeicons',isMask:true},'largeicon-checkmark':{position:'c8',spritesheet:'largeicons',isMask:true},'largeicon-chevron':{position:'c7',spritesheet:'largeicons',isMask:true},'largeicon-clear':{position:'a6',spritesheet:'largeicons',isMask:true},'largeicon-copy':{position:'b6',spritesheet:'largeicons',isMask:true},'largeicon-deactivate-breakpoints':{position:'c6',spritesheet:'largeicons',isMask:true},'largeicon-delete':{position:'d9',spritesheet:'largeicons',isMask:true},'largeicon-dock-to-bottom':{position:'d8',spritesheet:'largeicons',isMask:true},'largeicon-dock-to-left':{position:'d7',spritesheet:'largeicons',isMask:true},'largeicon-dock-to-right':{position:'d6',spritesheet:'largeicons',isMask:true},'largeicon-download':{position:'h6',spritesheet:'largeicons',isMask:true},'largeicon-edit':{position:'a5',spritesheet:'largeicons',isMask:true},'largeicon-eyedropper':{position:'b5',spritesheet:'largeicons',isMask:true},'largeicon-filter':{position:'c5',spritesheet:'largeicons',isMask:true},'largeicon-foreground-color':{position:'d5',spritesheet:'largeicons',isMask:true},'largeicon-hide-bottom-sidebar':{position:'e9',spritesheet:'largeicons',isMask:true},'largeicon-hide-left-sidebar':{position:'e8',spritesheet:'largeicons',isMask:true},'largeicon-hide-right-sidebar':{position:'e7',spritesheet:'largeicons',isMask:true},'largeicon-hide-top-sidebar':{position:'e6',spritesheet:'largeicons',isMask:true},'largeicon-large-list':{position:'e5',spritesheet:'largeicons',isMask:true},'largeicon-layout-editor':{position:'a4',spritesheet:'largeicons',isMask:true},'largeicon-load':{position:'h5',spritesheet:'largeicons',isMask:true},'largeicon-longclick-triangle':{position:'b4',spritesheet:'largeicons',isMask:true},'largeicon-menu':{position:'c4',spritesheet:'largeicons',isMask:true},'largeicon-navigator-domain':{position:'d4',spritesheet:'largeicons',isMask:true},'largeicon-navigator-file':{position:'e4',spritesheet:'largeicons',isMask:true},'largeicon-navigator-file-sync':{position:'f9',spritesheet:'largeicons',isMask:true},'largeicon-navigator-folder':{position:'f8',spritesheet:'largeicons',isMask:true},'largeicon-navigator-frame':{position:'f7',spritesheet:'largeicons',isMask:true},'largeicon-navigator-snippet':{position:'f6',spritesheet:'largeicons',isMask:true},'largeicon-navigator-worker':{position:'f5',spritesheet:'largeicons',isMask:true},'largeicon-node-search':{position:'f4',spritesheet:'largeicons',isMask:true},'largeicon-pan':{position:'a3',spritesheet:'largeicons',isMask:true},'largeicon-pause-animation':{position:'b3',spritesheet:'largeicons',isMask:true},'largeicon-pause':{position:'c3',spritesheet:'largeicons',isMask:true},'largeicon-pause-on-exceptions':{position:'d3',spritesheet:'largeicons',isMask:true},'largeicon-phone':{position:'e3',spritesheet:'largeicons',isMask:true},'largeicon-play-animation':{position:'f3',spritesheet:'largeicons',isMask:true},'largeicon-play-back':{position:'a2',spritesheet:'largeicons',isMask:true},'largeicon-play':{position:'b2',spritesheet:'largeicons',isMask:true},'largeicon-pretty-print':{position:'c2',spritesheet:'largeicons',isMask:true},'largeicon-refresh':{position:'d2',spritesheet:'largeicons',isMask:true},'largeicon-replay-animation':{position:'e2',spritesheet:'largeicons',isMask:true},'largeicon-resume':{position:'f2',spritesheet:'largeicons',isMask:true},'largeicon-rotate':{position:'g9',spritesheet:'largeicons',isMask:true},'largeicon-rotate-screen':{position:'g8',spritesheet:'largeicons',isMask:true},'largeicon-search':{position:'h4',spritesheet:'largeicons',isMask:true},'largeicon-settings-gear':{position:'g7',spritesheet:'largeicons',isMask:true},'largeicon-show-bottom-sidebar':{position:'g6',spritesheet:'largeicons',isMask:true},'largeicon-show-left-sidebar':{position:'g5',spritesheet:'largeicons',isMask:true},'largeicon-show-right-sidebar':{position:'g4',spritesheet:'largeicons',isMask:true},'largeicon-show-top-sidebar':{position:'g3',spritesheet:'largeicons',isMask:true},'largeicon-start-recording':{position:'g2',spritesheet:'largeicons',isMask:true},'largeicon-step-into':{position:'a1',spritesheet:'largeicons',isMask:true},'largeicon-step-out':{position:'b1',spritesheet:'largeicons',isMask:true},'largeicon-step-over':{position:'c1',spritesheet:'largeicons',isMask:true},'largeicon-step':{position:'h1',spritesheet:'largeicons',isMask:true},'largeicon-stop-recording':{position:'d1',spritesheet:'largeicons',isMask:true},'largeicon-terminate-execution':{position:'h2',spritesheet:'largeicons',isMask:true},'largeicon-text-shadow':{position:'e1',spritesheet:'largeicons',isMask:true},'largeicon-trash-bin':{position:'f1',spritesheet:'largeicons',isMask:true},'largeicon-undo':{position:'h7',spritesheet:'largeicons',isMask:true},'largeicon-undock':{position:'g1',spritesheet:'largeicons',isMask:true},'largeicon-visibility':{position:'h9',spritesheet:'largeicons',isMask:true},'largeicon-waterfall':{position:'h8',spritesheet:'largeicons',isMask:true},'largeicon-breaking-change':{position:'h3',spritesheet:'largeicons'},'largeicon-link':{position:'i1',spritesheet:'largeicons'},'mediumicon-arrow-top':{position:'a4',spritesheet:'arrowicons'},'mediumicon-arrow-bottom':{position:'a3',spritesheet:'arrowicons'},'mediumicon-arrow-left':{position:'a2',spritesheet:'arrowicons'},'mediumicon-arrow-right':{position:'a1',spritesheet:'arrowicons'}};let Descriptor;let SpriteSheet;var Icon$1=Object.freeze({__proto__:null,Icon:Icon,Descriptors:Descriptors,Descriptor:Descriptor,SpriteSheet:SpriteSheet});let _measuredScrollbarWidth;function measuredScrollbarWidth(document){if(typeof _measuredScrollbarWidth==='number'){return _measuredScrollbarWidth;}
if(!document){return 16;}
const scrollDiv=document.createElement('div');const innerDiv=document.createElement('div');scrollDiv.setAttribute('style','display: block; width: 100px; height: 100px; overflow: scroll;');innerDiv.setAttribute('style','height: 200px');scrollDiv.appendChild(innerDiv);document.body.appendChild(scrollDiv);_measuredScrollbarWidth=scrollDiv.offsetWidth-scrollDiv.clientWidth;document.body.removeChild(scrollDiv);return _measuredScrollbarWidth;}
function appendStyle(node,cssFile){const content=self.Runtime.cachedResources[cssFile]||'';if(!content){console.error(cssFile+' not preloaded. Check module.json');}
let styleElement=createElement('style');styleElement.textContent=content;node.appendChild(styleElement);const themeStyleSheet=self.UI.themeSupport.themeStyleSheet(cssFile,content);if(themeStyleSheet){styleElement=createElement('style');styleElement.textContent=themeStyleSheet+'\n'+Root.Runtime.resolveSourceURL(cssFile+'.theme');node.appendChild(styleElement);}}
class XElement extends HTMLElement{static get observedAttributes(){return['flex','padding','padding-top','padding-bottom','padding-left','padding-right','margin','margin-top','margin-bottom','margin-left','margin-right','overflow','overflow-x','overflow-y','font-size','color','background','background-color','border','border-top','border-bottom','border-left','border-right','max-width','max-height'];}
attributeChangedCallback(attr,oldValue,newValue){if(attr==='flex'){if(newValue===null){this.style.removeProperty('flex');}else if(newValue==='initial'||newValue==='auto'||newValue==='none'||newValue.indexOf(' ')!==-1){this.style.setProperty('flex',newValue);}else{this.style.setProperty('flex','0 0 '+newValue);}
return;}
if(newValue===null){this.style.removeProperty(attr);if(attr.startsWith('padding-')||attr.startsWith('margin-')||attr.startsWith('border-')||attr.startsWith('background-')||attr.startsWith('overflow-')){const shorthand=attr.substring(0,attr.indexOf('-'));const shorthandValue=this.getAttribute(shorthand);if(shorthandValue!==null){this.style.setProperty(shorthand,shorthandValue);}}}else{this.style.setProperty(attr,newValue);}}}
class _XBox extends XElement{constructor(direction){super();this.style.setProperty('display','flex');this.style.setProperty('flex-direction',direction);this.style.setProperty('justify-content','flex-start');}
static get observedAttributes(){return super.observedAttributes.concat(['x-start','x-center','x-stretch','x-baseline','justify-content']);}
attributeChangedCallback(attr,oldValue,newValue){if(attr==='x-start'||attr==='x-center'||attr==='x-stretch'||attr==='x-baseline'){if(newValue===null){this.style.removeProperty('align-items');}else{this.style.setProperty('align-items',attr==='x-start'?'flex-start':attr.substr(2));}
return;}
super.attributeChangedCallback(attr,oldValue,newValue);}}
class XVBox extends _XBox{constructor(){super('column');}}
class XHBox extends _XBox{constructor(){super('row');}}
class XCBox extends XElement{constructor(){super();this.style.setProperty('display','flex');this.style.setProperty('flex-direction','column');this.style.setProperty('justify-content','center');this.style.setProperty('align-items','center');}}
class XDiv extends XElement{constructor(){super();this.style.setProperty('display','block');}}
class XSpan extends XElement{constructor(){super();this.style.setProperty('display','inline');}}
class XText extends XElement{constructor(){super();this.style.setProperty('display','inline');this.style.setProperty('white-space','pre');}}
self.customElements.define('x-vbox',XVBox);self.customElements.define('x-hbox',XHBox);self.customElements.define('x-cbox',XCBox);self.customElements.define('x-div',XDiv);self.customElements.define('x-span',XSpan);self.customElements.define('x-text',XText);var XElement$1=Object.freeze({__proto__:null,XElement:XElement});class XWidget extends XElement{constructor(){super();this.style.setProperty('display','flex');this.style.setProperty('flex-direction','column');this.style.setProperty('align-items','stretch');this.style.setProperty('justify-content','flex-start');this.style.setProperty('contain','layout style');this._visible=false;this._shadowRoot;this._defaultFocusedElement=null;this._elementsToRestoreScrollPositionsFor=[];this._onShownCallback;this._onHiddenCallback;this._onResizedCallback;if(!XWidget._observer){XWidget._observer=new ResizeObserver(entries=>{for(const entry of entries){if(entry.target._visible&&entry.target._onResizedCallback){entry.target._onResizedCallback.call(null);}}});}
XWidget._observer.observe(this);this.setElementsToRestoreScrollPositionsFor([this]);}
static focusWidgetForNode(node){node=node&&node.parentNodeOrShadowHost();let widget=null;while(node){if(node instanceof XWidget){if(widget){node._defaultFocusedElement=widget;}
widget=node;}
node=node.parentNodeOrShadowHost();}}
isShowing(){return this._visible;}
registerRequiredCSS(cssFile){appendStyle(this._shadowRoot||this,cssFile);}
setOnShown(callback){this._onShownCallback=callback;}
setOnHidden(callback){this._onHiddenCallback=callback;}
setOnResized(callback){this._onResizedCallback=callback;}
setElementsToRestoreScrollPositionsFor(elements){for(const element of this._elementsToRestoreScrollPositionsFor){element.removeEventListener('scroll',XWidget._storeScrollPosition,{passive:true,capture:false});}
this._elementsToRestoreScrollPositionsFor=elements;for(const element of this._elementsToRestoreScrollPositionsFor){element.addEventListener('scroll',XWidget._storeScrollPosition,{passive:true,capture:false});}}
restoreScrollPositions(){for(const element of this._elementsToRestoreScrollPositionsFor){if(element._scrollTop){element.scrollTop=element._scrollTop;}
if(element._scrollLeft){element.scrollLeft=element._scrollLeft;}}}
static _storeScrollPosition(event){const element=event.currentTarget;element._scrollTop=element.scrollTop;element._scrollLeft=element.scrollLeft;}
setDefaultFocusedElement(element){if(element&&!this.isSelfOrAncestor(element)){throw new Error('Default focus must be descendant');}
this._defaultFocusedElement=element;}
focus(){if(!this._visible){return;}
let element;if(this._defaultFocusedElement&&this.isSelfOrAncestor(this._defaultFocusedElement)){element=this._defaultFocusedElement;}else if(this.tabIndex!==-1){element=this;}else{let child=this.traverseNextNode(this);while(child){if((child instanceof XWidget)&&child._visible){element=child;break;}
child=child.traverseNextNode(this);}}
if(!element||element.hasFocus()){return;}
if(element===this){HTMLElement.prototype.focus.call(this);}else{element.focus();}}
connectedCallback(){this._visible=true;this.restoreScrollPositions();if(this._onShownCallback){this._onShownCallback.call(null);}}
disconnectedCallback(){this._visible=false;if(this._onHiddenCallback){this._onHiddenCallback.call(null);}}}
self.customElements.define('x-widget',XWidget);var XWidget$1=Object.freeze({__proto__:null,XWidget:XWidget});function focusChanged(event){const document=event.target&&event.target.ownerDocument;const element=document?document.deepActiveElement():null;Widget.focusWidgetForNode(element);XWidget.focusWidgetForNode(element);if(!UI._keyboardFocus){return;}
markAsFocusedByKeyboard(element);}
function markAsFocusedByKeyboard(element){element.setAttribute('data-keyboard-focus','true');element.addEventListener('blur',()=>element.removeAttribute('data-keyboard-focus'),{once:true,capture:true});}
function injectCoreStyles(root){appendStyle(root,'ui/inspectorCommon.css');appendStyle(root,'ui/textButton.css');self.UI.themeSupport.injectHighlightStyleSheets(root);self.UI.themeSupport.injectCustomStyleSheets(root);}
function createShadowRootWithCoreStyles(element,cssFile,delegatesFocus){const shadowRoot=element.attachShadow({mode:'open',delegatesFocus});injectCoreStyles(shadowRoot);if(cssFile){appendStyle(shadowRoot,cssFile);}
shadowRoot.addEventListener('focus',focusChanged.bind(UI),true);return shadowRoot;}
class Widget extends ObjectWrapper.ObjectWrapper{constructor(isWebComponent,delegatesFocus){super();this.contentElement=createElementWithClass('div','widget');if(isWebComponent){this.element=createElementWithClass('div','vbox flex-auto');this._shadowRoot=createShadowRootWithCoreStyles(this.element,undefined,delegatesFocus);this._shadowRoot.appendChild(this.contentElement);}else{this.element=this.contentElement;}
this._isWebComponent=isWebComponent;this.element.__widget=this;this._visible=false;this._isRoot=false;this._isShowing=false;this._children=[];this._hideOnDetach=false;this._notificationDepth=0;this._invalidationsSuspended=0;this._defaultFocusedChild=null;}
static _incrementWidgetCounter(parentElement,childElement){const count=(childElement.__widgetCounter||0)+(childElement.__widget?1:0);if(!count){return;}
while(parentElement){parentElement.__widgetCounter=(parentElement.__widgetCounter||0)+count;parentElement=parentElement.parentElementOrShadowHost();}}
static _decrementWidgetCounter(parentElement,childElement){const count=(childElement.__widgetCounter||0)+(childElement.__widget?1:0);if(!count){return;}
while(parentElement){parentElement.__widgetCounter-=count;parentElement=parentElement.parentElementOrShadowHost();}}
static __assert(condition,message){if(!condition){throw new Error(message);}}
static focusWidgetForNode(node){while(node){if(node.__widget){break;}
node=node.parentNodeOrShadowHost();}
if(!node){return;}
let widget=node.__widget;while(widget._parentWidget){widget._parentWidget._defaultFocusedChild=widget;widget=widget._parentWidget;}}
markAsRoot(){Widget.__assert(!this.element.parentElement,'Attempt to mark as root attached node');this._isRoot=true;}
parentWidget(){return this._parentWidget;}
children(){return this._children;}
childWasDetached(widget){}
isShowing(){return this._isShowing;}
shouldHideOnDetach(){if(!this.element.parentElement){return false;}
if(this._hideOnDetach){return true;}
for(const child of this._children){if(child.shouldHideOnDetach()){return true;}}
return false;}
setHideOnDetach(){this._hideOnDetach=true;}
_inNotification(){return!!this._notificationDepth||(this._parentWidget&&this._parentWidget._inNotification());}
_parentIsShowing(){if(this._isRoot){return true;}
return!!this._parentWidget&&this._parentWidget.isShowing();}
_callOnVisibleChildren(method){const copy=this._children.slice();for(let i=0;i<copy.length;++i){if(copy[i]._parentWidget===this&&copy[i]._visible){method.call(copy[i]);}}}
_processWillShow(){this._callOnVisibleChildren(this._processWillShow);this._isShowing=true;}
_processWasShown(){if(this._inNotification()){return;}
this.restoreScrollPositions();this._notify(this.wasShown);this._callOnVisibleChildren(this._processWasShown);}
_processWillHide(){if(this._inNotification()){return;}
this.storeScrollPositions();this._callOnVisibleChildren(this._processWillHide);this._notify(this.willHide);this._isShowing=false;}
_processWasHidden(){this._callOnVisibleChildren(this._processWasHidden);}
_processOnResize(){if(this._inNotification()){return;}
if(!this.isShowing()){return;}
this._notify(this.onResize);this._callOnVisibleChildren(this._processOnResize);}
_notify(notification){++this._notificationDepth;try{notification.call(this);}finally{--this._notificationDepth;}}
wasShown(){}
willHide(){}
onResize(){}
onLayout(){}
ownerViewDisposed(){}
show(parentElement,insertBefore){Widget.__assert(parentElement,'Attempt to attach widget with no parent element');if(!this._isRoot){let currentParent=parentElement;while(currentParent&&!currentParent.__widget){currentParent=currentParent.parentElementOrShadowHost();}
Widget.__assert(currentParent,'Attempt to attach widget to orphan node');this._attach(currentParent.__widget);}
this._showWidget(parentElement,insertBefore);}
_attach(parentWidget){if(parentWidget===this._parentWidget){return;}
if(this._parentWidget){this.detach();}
this._parentWidget=parentWidget;this._parentWidget._children.push(this);this._isRoot=false;}
showWidget(){if(this._visible){return;}
Widget.__assert(this.element.parentElement,'Attempt to show widget that is not hidden using hideWidget().');this._showWidget((this.element.parentElement),this.element.nextSibling);}
_showWidget(parentElement,insertBefore){let currentParent=parentElement;while(currentParent&&!currentParent.__widget){currentParent=currentParent.parentElementOrShadowHost();}
if(this._isRoot){Widget.__assert(!currentParent,'Attempt to show root widget under another widget');}else{Widget.__assert(currentParent&&currentParent.__widget===this._parentWidget,'Attempt to show under node belonging to alien widget');}
const wasVisible=this._visible;if(wasVisible&&this.element.parentElement===parentElement){return;}
this._visible=true;if(!wasVisible&&this._parentIsShowing()){this._processWillShow();}
this.element.classList.remove('hidden');if(this.element.parentElement!==parentElement){if(!this._externallyManaged){Widget._incrementWidgetCounter(parentElement,this.element);}
if(insertBefore){Widget._originalInsertBefore.call(parentElement,this.element,insertBefore);}else{Widget._originalAppendChild.call(parentElement,this.element);}}
if(!wasVisible&&this._parentIsShowing()){this._processWasShown();}
if(this._parentWidget&&this._hasNonZeroConstraints()){this._parentWidget.invalidateConstraints();}else{this._processOnResize();}}
hideWidget(){if(!this._visible){return;}
this._hideWidget(false);}
_hideWidget(removeFromDOM){this._visible=false;const parentElement=this.element.parentElement;if(this._parentIsShowing()){this._processWillHide();}
if(removeFromDOM){Widget._decrementWidgetCounter(parentElement,this.element);Widget._originalRemoveChild.call(parentElement,this.element);}else{this.element.classList.add('hidden');}
if(this._parentIsShowing()){this._processWasHidden();}
if(this._parentWidget&&this._hasNonZeroConstraints()){this._parentWidget.invalidateConstraints();}}
detach(overrideHideOnDetach){if(!this._parentWidget&&!this._isRoot){return;}
const removeFromDOM=overrideHideOnDetach||!this.shouldHideOnDetach();if(this._visible){this._hideWidget(removeFromDOM);}else if(removeFromDOM&&this.element.parentElement){const parentElement=this.element.parentElement;Widget._decrementWidgetCounter(parentElement,this.element);Widget._originalRemoveChild.call(parentElement,this.element);}
if(this._parentWidget){const childIndex=this._parentWidget._children.indexOf(this);Widget.__assert(childIndex>=0,'Attempt to remove non-child widget');this._parentWidget._children.splice(childIndex,1);if(this._parentWidget._defaultFocusedChild===this){this._parentWidget._defaultFocusedChild=null;}
this._parentWidget.childWasDetached(this);this._parentWidget=null;}else{Widget.__assert(this._isRoot,'Removing non-root widget from DOM');}}
detachChildWidgets(){const children=this._children.slice();for(let i=0;i<children.length;++i){children[i].detach();}}
elementsToRestoreScrollPositionsFor(){return[this.element];}
storeScrollPositions(){const elements=this.elementsToRestoreScrollPositionsFor();for(let i=0;i<elements.length;++i){const container=elements[i];container._scrollTop=container.scrollTop;container._scrollLeft=container.scrollLeft;}}
restoreScrollPositions(){const elements=this.elementsToRestoreScrollPositionsFor();for(let i=0;i<elements.length;++i){const container=elements[i];if(container._scrollTop){container.scrollTop=container._scrollTop;}
if(container._scrollLeft){container.scrollLeft=container._scrollLeft;}}}
doResize(){if(!this.isShowing()){return;}
if(!this._inNotification()){this._callOnVisibleChildren(this._processOnResize);}}
doLayout(){if(!this.isShowing()){return;}
this._notify(this.onLayout);this.doResize();}
registerRequiredCSS(cssFile){appendStyle(this._isWebComponent?this._shadowRoot:this.element,cssFile);}
printWidgetHierarchy(){const lines=[];this._collectWidgetHierarchy('',lines);console.log(lines.join('\n'));}
_collectWidgetHierarchy(prefix,lines){lines.push(prefix+'['+this.element.className+']'+(this._children.length?' {':''));for(let i=0;i<this._children.length;++i){this._children[i]._collectWidgetHierarchy(prefix+'    ',lines);}
if(this._children.length){lines.push(prefix+'}');}}
setDefaultFocusedElement(element){this._defaultFocusedElement=element;}
setDefaultFocusedChild(child){Widget.__assert(child._parentWidget===this,'Attempt to set non-child widget as default focused.');this._defaultFocusedChild=child;}
focus(){if(!this.isShowing()){return;}
const element=this._defaultFocusedElement;if(element){if(!element.hasFocus()){element.focus();}
return;}
if(this._defaultFocusedChild&&this._defaultFocusedChild._visible){this._defaultFocusedChild.focus();}else{for(const child of this._children){if(child._visible){child.focus();return;}}
let child=this.contentElement.traverseNextNode(this.contentElement);while(child){if(child instanceof XWidget){child.focus();return;}
child=child.traverseNextNode(this.contentElement);}}}
hasFocus(){return this.element.hasFocus();}
calculateConstraints(){return new Constraints();}
constraints(){if(typeof this._constraints!=='undefined'){return this._constraints;}
if(typeof this._cachedConstraints==='undefined'){this._cachedConstraints=this.calculateConstraints();}
return this._cachedConstraints;}
setMinimumAndPreferredSizes(width,height,preferredWidth,preferredHeight){this._constraints=new Constraints(new Size(width,height),new Size(preferredWidth,preferredHeight));this.invalidateConstraints();}
setMinimumSize(width,height){this._constraints=new Constraints(new Size(width,height));this.invalidateConstraints();}
_hasNonZeroConstraints(){const constraints=this.constraints();return!!(constraints.minimum.width||constraints.minimum.height||constraints.preferred.width||constraints.preferred.height);}
suspendInvalidations(){++this._invalidationsSuspended;}
resumeInvalidations(){--this._invalidationsSuspended;if(!this._invalidationsSuspended&&this._invalidationsRequested){this.invalidateConstraints();}}
invalidateConstraints(){if(this._invalidationsSuspended){this._invalidationsRequested=true;return;}
this._invalidationsRequested=false;const cached=this._cachedConstraints;delete this._cachedConstraints;const actual=this.constraints();if(!actual.isEqual(cached)&&this._parentWidget){this._parentWidget.invalidateConstraints();}else{this.doLayout();}}
markAsExternallyManaged(){Widget.__assert(!this._parentWidget,'Attempt to mark widget as externally managed after insertion to the DOM');this._externallyManaged=true;}}
const _originalAppendChild=Element.prototype.appendChild;const _originalInsertBefore=Element.prototype.insertBefore;const _originalRemoveChild=Element.prototype.removeChild;const _originalRemoveChildren=Element.prototype.removeChildren;class VBox extends Widget{constructor(isWebComponent,delegatesFocus){super(isWebComponent,delegatesFocus);this.contentElement.classList.add('vbox');}
calculateConstraints(){let constraints=new Constraints();function updateForChild(){const child=this.constraints();constraints=constraints.widthToMax(child);constraints=constraints.addHeight(child);}
this._callOnVisibleChildren(updateForChild);return constraints;}}
class HBox extends Widget{constructor(isWebComponent){super(isWebComponent);this.contentElement.classList.add('hbox');}
calculateConstraints(){let constraints=new Constraints();function updateForChild(){const child=this.constraints();constraints=constraints.addWidth(child);constraints=constraints.heightToMax(child);}
this._callOnVisibleChildren(updateForChild);return constraints;}}
class VBoxWithResizeCallback extends VBox{constructor(resizeCallback){super();this._resizeCallback=resizeCallback;}
onResize(){this._resizeCallback();}}
class WidgetFocusRestorer{constructor(widget){this._widget=widget;this._previous=widget.element.ownerDocument.deepActiveElement();widget.focus();}
restore(){if(!this._widget){return;}
if(this._widget.hasFocus()&&this._previous){this._previous.focus();}
this._previous=null;this._widget=null;}}
Element.prototype.appendChild=function(child){Widget.__assert(!child.__widget||child.parentElement===this,'Attempt to add widget via regular DOM operation.');return Widget._originalAppendChild.call(this,child);};Element.prototype.insertBefore=function(child,anchor){Widget.__assert(!child.__widget||child.parentElement===this,'Attempt to add widget via regular DOM operation.');return Widget._originalInsertBefore.call(this,child,anchor);};Element.prototype.removeChild=function(child){Widget.__assert(!child.__widgetCounter&&!child.__widget,'Attempt to remove element containing widget via regular DOM operation');return Widget._originalRemoveChild.call(this,child);};Element.prototype.removeChildren=function(){Widget.__assert(!this.__widgetCounter,'Attempt to remove element containing widget via regular DOM operation');Widget._originalRemoveChildren.call(this);};Widget._originalAppendChild=_originalAppendChild;Widget._originalInsertBefore=_originalInsertBefore;Widget._originalRemoveChild=_originalRemoveChild;Widget._originalRemoveChildren=_originalRemoveChildren;var Widget$1=Object.freeze({__proto__:null,Widget:Widget,_originalAppendChild:_originalAppendChild,_originalInsertBefore:_originalInsertBefore,_originalRemoveChild:_originalRemoveChild,_originalRemoveChildren:_originalRemoveChildren,VBox:VBox,HBox:HBox,VBoxWithResizeCallback:VBoxWithResizeCallback,WidgetFocusRestorer:WidgetFocusRestorer});class GlassPane{constructor(){this._widget=new Widget(true);this._widget.markAsRoot();this.element=this._widget.element;this.contentElement=this._widget.contentElement;this._arrowElement=Icon.create('','arrow hidden');this.element.shadowRoot.appendChild(this._arrowElement);this.registerRequiredCSS('ui/glassPane.css');this.setPointerEventsBehavior(PointerEventsBehavior.PierceGlassPane);this._onMouseDownBound=this._onMouseDown.bind(this);this._onClickOutsideCallback=null;this._maxSize=null;this._positionX=null;this._positionY=null;this._anchorBox=null;this._anchorBehavior=AnchorBehavior.PreferTop;this._sizeBehavior=SizeBehavior.SetExactSize;this._marginBehavior=MarginBehavior.DefaultMargin;}
isShowing(){return this._widget.isShowing();}
registerRequiredCSS(cssFile){this._widget.registerRequiredCSS(cssFile);}
setDefaultFocusedElement(element){this._widget.setDefaultFocusedElement(element);}
setDimmed(dimmed){this.element.classList.toggle('dimmed-pane',dimmed);}
setPointerEventsBehavior(pointerEventsBehavior){this.element.classList.toggle('no-pointer-events',pointerEventsBehavior!==PointerEventsBehavior.BlockedByGlassPane);this.contentElement.classList.toggle('no-pointer-events',pointerEventsBehavior===PointerEventsBehavior.PierceContents);}
setOutsideClickCallback(callback){this._onClickOutsideCallback=callback;}
setMaxContentSize(size){this._maxSize=size;this._positionContent();}
setSizeBehavior(sizeBehavior){this._sizeBehavior=sizeBehavior;this._positionContent();}
setContentPosition(x,y){this._positionX=x;this._positionY=y;this._positionContent();}
setContentAnchorBox(anchorBox){this._anchorBox=anchorBox;this._positionContent();}
setAnchorBehavior(behavior){this._anchorBehavior=behavior;}
setMarginBehavior(behavior){this._marginBehavior=behavior;this._arrowElement.classList.toggle('hidden',behavior!==MarginBehavior.Arrow);}
show(document){if(this.isShowing()){return;}
this.element.style.zIndex=3000+1000*_panes.size;document.body.addEventListener('mousedown',this._onMouseDownBound,true);this._widget.show(document.body);_panes.add(this);this._positionContent();}
hide(){if(!this.isShowing()){return;}
_panes.delete(this);this.element.ownerDocument.body.removeEventListener('mousedown',this._onMouseDownBound,true);this._widget.detach();}
_onMouseDown(event){if(!this._onClickOutsideCallback){return;}
const node=event.deepElementFromPoint();if(!node||this.contentElement.isSelfOrAncestor(node)){return;}
this._onClickOutsideCallback.call(null,event);}
_positionContent(){if(!this.isShowing()){return;}
const showArrow=this._marginBehavior===MarginBehavior.Arrow;const gutterSize=showArrow?8:(this._marginBehavior===MarginBehavior.NoMargin?0:3);const scrollbarSize=measuredScrollbarWidth(this.element.ownerDocument);const arrowSize=10;const container=_containers.get((this.element.ownerDocument));if(this._sizeBehavior===SizeBehavior.MeasureContent){this.contentElement.positionAt(0,0);this.contentElement.style.width='';this.contentElement.style.maxWidth='';this.contentElement.style.height='';this.contentElement.style.maxHeight='';}
const containerWidth=container.offsetWidth;const containerHeight=container.offsetHeight;let width=containerWidth-gutterSize*2;let height=containerHeight-gutterSize*2;let positionX=gutterSize;let positionY=gutterSize;if(this._maxSize){width=Math.min(width,this._maxSize.width);height=Math.min(height,this._maxSize.height);}
if(this._sizeBehavior===SizeBehavior.MeasureContent){const measuredRect=this.contentElement.getBoundingClientRect();const widthOverflow=height<measuredRect.height?scrollbarSize:0;const heightOverflow=width<measuredRect.width?scrollbarSize:0;width=Math.min(width,measuredRect.width+widthOverflow);height=Math.min(height,measuredRect.height+heightOverflow);}
if(this._anchorBox){const anchorBox=this._anchorBox.relativeToElement(container);let behavior=this._anchorBehavior;this._arrowElement.classList.remove('arrow-none','arrow-top','arrow-bottom','arrow-left','arrow-right');if(behavior===AnchorBehavior.PreferTop||behavior===AnchorBehavior.PreferBottom){const top=anchorBox.y-2*gutterSize;const bottom=containerHeight-anchorBox.y-anchorBox.height-2*gutterSize;if(behavior===AnchorBehavior.PreferTop&&top<height&&bottom>top){behavior=AnchorBehavior.PreferBottom;}
if(behavior===AnchorBehavior.PreferBottom&&bottom<height&&top>bottom){behavior=AnchorBehavior.PreferTop;}
let arrowY;let enoughHeight=true;if(behavior===AnchorBehavior.PreferTop){positionY=Math.max(gutterSize,anchorBox.y-height-gutterSize);const spaceTop=anchorBox.y-positionY-gutterSize;if(this._sizeBehavior===SizeBehavior.MeasureContent){if(height>spaceTop){this._arrowElement.classList.add('arrow-none');enoughHeight=false;}}else{height=Math.min(height,spaceTop);}
this._arrowElement.setIconType('mediumicon-arrow-bottom');this._arrowElement.classList.add('arrow-bottom');arrowY=anchorBox.y-gutterSize;}else{positionY=anchorBox.y+anchorBox.height+gutterSize;const spaceBottom=containerHeight-positionY-gutterSize;if(this._sizeBehavior===SizeBehavior.MeasureContent){if(height>spaceBottom){this._arrowElement.classList.add('arrow-none');positionY=containerHeight-gutterSize-height;enoughHeight=false;}}else{height=Math.min(height,spaceBottom);}
this._arrowElement.setIconType('mediumicon-arrow-top');this._arrowElement.classList.add('arrow-top');arrowY=anchorBox.y+anchorBox.height+gutterSize;}
positionX=Math.max(gutterSize,Math.min(anchorBox.x,containerWidth-width-gutterSize));if(!enoughHeight){positionX=Math.min(positionX+arrowSize,containerWidth-width-gutterSize);}else if(showArrow&&positionX-arrowSize>=gutterSize){positionX-=arrowSize;}
width=Math.min(width,containerWidth-positionX-gutterSize);if(2*arrowSize>=width){this._arrowElement.classList.add('arrow-none');}else{let arrowX=anchorBox.x+Math.min(50,Math.floor(anchorBox.width/2));arrowX=NumberUtilities.clamp(arrowX,positionX+arrowSize,positionX+width-arrowSize);this._arrowElement.positionAt(arrowX,arrowY,container);}}else{const left=anchorBox.x-2*gutterSize;const right=containerWidth-anchorBox.x-anchorBox.width-2*gutterSize;if(behavior===AnchorBehavior.PreferLeft&&left<width&&right>left){behavior=AnchorBehavior.PreferRight;}
if(behavior===AnchorBehavior.PreferRight&&right<width&&left>right){behavior=AnchorBehavior.PreferLeft;}
let arrowX;let enoughWidth=true;if(behavior===AnchorBehavior.PreferLeft){positionX=Math.max(gutterSize,anchorBox.x-width-gutterSize);const spaceLeft=anchorBox.x-positionX-gutterSize;if(this._sizeBehavior===SizeBehavior.MeasureContent){if(width>spaceLeft){this._arrowElement.classList.add('arrow-none');enoughWidth=false;}}else{width=Math.min(width,spaceLeft);}
this._arrowElement.setIconType('mediumicon-arrow-right');this._arrowElement.classList.add('arrow-right');arrowX=anchorBox.x-gutterSize;}else{positionX=anchorBox.x+anchorBox.width+gutterSize;const spaceRight=containerWidth-positionX-gutterSize;if(this._sizeBehavior===SizeBehavior.MeasureContent){if(width>spaceRight){this._arrowElement.classList.add('arrow-none');positionX=containerWidth-gutterSize-width;enoughWidth=false;}}else{width=Math.min(width,spaceRight);}
this._arrowElement.setIconType('mediumicon-arrow-left');this._arrowElement.classList.add('arrow-left');arrowX=anchorBox.x+anchorBox.width+gutterSize;}
positionY=Math.max(gutterSize,Math.min(anchorBox.y,containerHeight-height-gutterSize));if(!enoughWidth){positionY=Math.min(positionY+arrowSize,containerHeight-height-gutterSize);}else if(showArrow&&positionY-arrowSize>=gutterSize){positionY-=arrowSize;}
height=Math.min(height,containerHeight-positionY-gutterSize);if(2*arrowSize>=height){this._arrowElement.classList.add('arrow-none');}else{let arrowY=anchorBox.y+Math.min(50,Math.floor(anchorBox.height/2));arrowY=NumberUtilities.clamp(arrowY,positionY+arrowSize,positionY+height-arrowSize);this._arrowElement.positionAt(arrowX,arrowY,container);}}}else{positionX=this._positionX!==null?this._positionX:(containerWidth-width)/2;positionY=this._positionY!==null?this._positionY:(containerHeight-height)/2;width=Math.min(width,containerWidth-positionX-gutterSize);height=Math.min(height,containerHeight-positionY-gutterSize);this._arrowElement.classList.add('arrow-none');}
this.contentElement.style.width=width+'px';if(this._sizeBehavior===SizeBehavior.SetExactWidthMaxHeight){this.contentElement.style.maxHeight=height+'px';}else{this.contentElement.style.height=height+'px';}
this.contentElement.positionAt(positionX,positionY,container);this._widget.doResize();}
widget(){return this._widget;}
static setContainer(element){_containers.set((element.ownerDocument),element);GlassPane.containerMoved(element);}
static container(document){return _containers.get(document);}
static containerMoved(element){for(const pane of _panes){if(pane.isShowing()&&pane.element.ownerDocument===element.ownerDocument){pane._positionContent();}}}}
const PointerEventsBehavior={BlockedByGlassPane:Symbol('BlockedByGlassPane'),PierceGlassPane:Symbol('PierceGlassPane'),PierceContents:Symbol('PierceContents')};const AnchorBehavior={PreferTop:Symbol('PreferTop'),PreferBottom:Symbol('PreferBottom'),PreferLeft:Symbol('PreferLeft'),PreferRight:Symbol('PreferRight'),};const SizeBehavior={SetExactSize:Symbol('SetExactSize'),SetExactWidthMaxHeight:Symbol('SetExactWidthMaxHeight'),MeasureContent:Symbol('MeasureContent')};const MarginBehavior={Arrow:Symbol('Arrow'),DefaultMargin:Symbol('DefaultMargin'),NoMargin:Symbol('NoMargin')};const _containers=new Map();const _panes=new Set();const GlassPanePanes=_panes;var GlassPane$1=Object.freeze({__proto__:null,GlassPane:GlassPane,PointerEventsBehavior:PointerEventsBehavior,AnchorBehavior:AnchorBehavior,SizeBehavior:SizeBehavior,MarginBehavior:MarginBehavior,GlassPanePanes:GlassPanePanes});class KeyboardShortcut{constructor(descriptor,action,type){this.descriptor=descriptor;this.action=action;this.type=type||Type.UserShortcut;}
static makeKey(keyCode,modifiers){if(typeof keyCode==='string'){keyCode=keyCode.charCodeAt(0)-(/^[a-z]/.test(keyCode)?32:0);}
modifiers=modifiers||Modifiers.None;return KeyboardShortcut._makeKeyFromCodeAndModifiers(keyCode,modifiers);}
static makeKeyFromEvent(keyboardEvent){let modifiers=Modifiers.None;if(keyboardEvent.shiftKey){modifiers|=Modifiers.Shift;}
if(keyboardEvent.ctrlKey){modifiers|=Modifiers.Ctrl;}
if(keyboardEvent.altKey){modifiers|=Modifiers.Alt;}
if(keyboardEvent.metaKey){modifiers|=Modifiers.Meta;}
const keyCode=keyboardEvent.keyCode||keyboardEvent['__keyCode'];return KeyboardShortcut._makeKeyFromCodeAndModifiers(keyCode,modifiers);}
static makeKeyFromEventIgnoringModifiers(keyboardEvent){const keyCode=keyboardEvent.keyCode||keyboardEvent['__keyCode'];return KeyboardShortcut._makeKeyFromCodeAndModifiers(keyCode,Modifiers.None);}
static eventHasCtrlOrMeta(event){return Platform$1.isMac()?event.metaKey&&!event.ctrlKey:event.ctrlKey&&!event.metaKey;}
static hasNoModifiers(event){return!event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.metaKey;}
static makeDescriptor(key,modifiers){return{key:KeyboardShortcut.makeKey(typeof key==='string'?key:key.code,modifiers),name:KeyboardShortcut.shortcutToString(key,modifiers)};}
static makeDescriptorFromBindingShortcut(shortcut){const parts=shortcut.split(/\+(?!$)/);let modifiers=0;let keyString;for(let i=0;i<parts.length;++i){if(typeof Modifiers[parts[i]]!=='undefined'){modifiers|=Modifiers[parts[i]];continue;}
console.assert(i===parts.length-1,'Only one key other than modifier is allowed in shortcut <'+shortcut+'>');keyString=parts[i];break;}
console.assert(keyString,'Modifiers-only shortcuts are not allowed (encountered <'+shortcut+'>)');if(!keyString){return null;}
const key=Keys[keyString]||KeyBindings[keyString];if(key&&key.shiftKey){modifiers|=Modifiers.Shift;}
return KeyboardShortcut.makeDescriptor(key?key:keyString,modifiers);}
static shortcutToString(key,modifiers){return KeyboardShortcut._modifiersToString(modifiers)+KeyboardShortcut._keyName(key);}
static _keyName(key){if(typeof key==='string'){return key.toUpperCase();}
if(typeof key.name==='string'){return key.name;}
return key.name[Platform$1.platform()]||key.name.other||'';}
static _makeKeyFromCodeAndModifiers(keyCode,modifiers){return(keyCode&255)|(modifiers<<8);}
static keyCodeAndModifiersFromKey(key){return{keyCode:key&255,modifiers:key>>8};}
static _modifiersToString(modifiers){const isMac=Platform$1.isMac();const m=Modifiers;const modifierNames=new Map([[m.Ctrl,isMac?'Ctrl\u2004':'Ctrl\u200A+\u200A'],[m.Alt,isMac?'\u2325\u2004':'Alt\u200A+\u200A'],[m.Shift,isMac?'\u21e7\u2004':'Shift\u200A+\u200A'],[m.Meta,isMac?'\u2318\u2004':'Win\u200A+\u200A']]);return[m.Meta,m.Ctrl,m.Alt,m.Shift].map(mapModifiers).join('');function mapModifiers(m){return modifiers&m?(modifierNames.get(m)):'';}}}
const Modifiers={None:0,Shift:1,Ctrl:2,Alt:4,Meta:8,get CtrlOrMeta(){return Platform$1.isMac()?this.Meta:this.Ctrl;},get ShiftOrOption(){return Platform$1.isMac()?this.Alt:this.Shift;}};const Keys={Backspace:{code:8,name:'\u21a4'},Tab:{code:9,name:{mac:'\u21e5',other:'Tab'}},Enter:{code:13,name:{mac:'\u21a9',other:'Enter'}},Shift:{code:16,name:{mac:'\u21e7',other:'Shift'}},Ctrl:{code:17,name:'Ctrl'},Esc:{code:27,name:'Esc'},Space:{code:32,name:'Space'},PageUp:{code:33,name:{mac:'\u21de',other:'PageUp'}},PageDown:{code:34,name:{mac:'\u21df',other:'PageDown'}},End:{code:35,name:{mac:'\u2197',other:'End'}},Home:{code:36,name:{mac:'\u2196',other:'Home'}},Left:{code:37,name:'\u2190'},Up:{code:38,name:'\u2191'},Right:{code:39,name:'\u2192'},Down:{code:40,name:'\u2193'},Delete:{code:46,name:'Del'},Zero:{code:48,name:'0'},H:{code:72,name:'H'},N:{code:78,name:'N'},P:{code:80,name:'P'},Meta:{code:91,name:'Meta'},F1:{code:112,name:'F1'},F2:{code:113,name:'F2'},F3:{code:114,name:'F3'},F4:{code:115,name:'F4'},F5:{code:116,name:'F5'},F6:{code:117,name:'F6'},F7:{code:118,name:'F7'},F8:{code:119,name:'F8'},F9:{code:120,name:'F9'},F10:{code:121,name:'F10'},F11:{code:122,name:'F11'},F12:{code:123,name:'F12'},Semicolon:{code:186,name:';'},NumpadPlus:{code:107,name:'Numpad +'},NumpadMinus:{code:109,name:'Numpad -'},Numpad0:{code:96,name:'Numpad 0'},Plus:{code:187,name:'+'},Comma:{code:188,name:','},Minus:{code:189,name:'-'},Period:{code:190,name:'.'},Slash:{code:191,name:'/'},QuestionMark:{code:191,name:'?'},Apostrophe:{code:192,name:'`'},Tilde:{code:192,name:'Tilde'},LeftSquareBracket:{code:219,name:'['},RightSquareBracket:{code:221,name:']'},Backslash:{code:220,name:'\\'},SingleQuote:{code:222,name:'\''},get CtrlOrMeta(){return Platform$1.isMac()?this.Meta:this.Ctrl;},};const Type={UserShortcut:Symbol('UserShortcut'),DefaultShortcut:Symbol('DefaultShortcut'),DisabledDefault:Symbol('DisabledDefault'),UnsetShortcut:Symbol('UnsetShortcut'),};const KeyBindings={};(function(){for(const key in Keys){const descriptor=Keys[key];if(typeof descriptor==='object'&&descriptor['code']){const name=typeof descriptor['name']==='string'?descriptor['name']:key;KeyBindings[name]=descriptor;}}})();let Key;let Descriptor$1;var KeyboardShortcut$1=Object.freeze({__proto__:null,KeyboardShortcut:KeyboardShortcut,Modifiers:Modifiers,Keys:Keys,Type:Type,KeyBindings:KeyBindings,Key:Key,Descriptor:Descriptor$1});class ResizerWidget extends ObjectWrapper.ObjectWrapper{constructor(){super();this._isEnabled=true;this._elements=new Set();this._installDragOnMouseDownBound=this._installDragOnMouseDown.bind(this);this._cursor='nwse-resize';}
isEnabled(){return this._isEnabled;}
setEnabled(enabled){this._isEnabled=enabled;this.updateElementCursors();}
elements(){return[...this._elements];}
addElement(element){if(!this._elements.has(element)){this._elements.add(element);element.addEventListener('mousedown',this._installDragOnMouseDownBound,false);this._updateElementCursor(element);}}
removeElement(element){if(this._elements.has(element)){this._elements.delete(element);element.removeEventListener('mousedown',this._installDragOnMouseDownBound,false);element.style.removeProperty('cursor');}}
updateElementCursors(){this._elements.forEach(this._updateElementCursor.bind(this));}
_updateElementCursor(element){if(this._isEnabled){element.style.setProperty('cursor',this.cursor());}else{element.style.removeProperty('cursor');}}
cursor(){return this._cursor;}
setCursor(cursor){this._cursor=cursor;this.updateElementCursors();}
_installDragOnMouseDown(event){const element=(event.target);if(!this._elements.has(element)){return false;}
elementDragStart(element,this._dragStart.bind(this),this._drag.bind(this),this._dragEnd.bind(this),this.cursor(),event);}
_dragStart(event){if(!this._isEnabled){return false;}
this._startX=event.pageX;this._startY=event.pageY;this.sendDragStart(this._startX,this._startY);return true;}
sendDragStart(x,y){this.dispatchEventToListeners(Events$2.ResizeStart,{startX:x,currentX:x,startY:y,currentY:y});}
_drag(event){if(!this._isEnabled){this._dragEnd(event);return true;}
this.sendDragMove(this._startX,event.pageX,this._startY,event.pageY,event.shiftKey);event.preventDefault();return false;}
sendDragMove(startX,currentX,startY,currentY,shiftKey){this.dispatchEventToListeners(Events$2.ResizeUpdate,{startX:startX,currentX:currentX,startY:startY,currentY:currentY,shiftKey:shiftKey});}
_dragEnd(event){this.dispatchEventToListeners(Events$2.ResizeEnd);delete this._startX;delete this._startY;}}
const Events$2={ResizeStart:Symbol('ResizeStart'),ResizeUpdate:Symbol('ResizeUpdate'),ResizeEnd:Symbol('ResizeEnd')};class SimpleResizerWidget extends ResizerWidget{constructor(){super();this._isVertical=true;}
isVertical(){return this._isVertical;}
setVertical(vertical){this._isVertical=vertical;this.updateElementCursors();}
cursor(){return this._isVertical?'ns-resize':'ew-resize';}
sendDragStart(x,y){const position=this._isVertical?y:x;this.dispatchEventToListeners(Events$2.ResizeStart,{startPosition:position,currentPosition:position});}
sendDragMove(startX,currentX,startY,currentY,shiftKey){if(this._isVertical){this.dispatchEventToListeners(Events$2.ResizeUpdate,{startPosition:startY,currentPosition:currentY,shiftKey:shiftKey});}else{this.dispatchEventToListeners(Events$2.ResizeUpdate,{startPosition:startX,currentPosition:currentX,shiftKey:shiftKey});}}}
var ResizerWidget$1=Object.freeze({__proto__:null,ResizerWidget:ResizerWidget,Events:Events$2,SimpleResizerWidget:SimpleResizerWidget});const createSettingCheckbox=function(name,setting,omitParagraphElement,tooltip){const label=CheckboxLabel.create(name);if(tooltip){label.title=tooltip;}
const input=label.checkboxElement;input.name=name;bindCheckbox(input,setting);if(omitParagraphElement){return label;}
const p=createElement('p');p.appendChild(label);return p;};const createSettingSelect=function(name,options,setting,subtitle){const settingSelectElement=createElement('p');const label=settingSelectElement.createChild('label');const select=settingSelectElement.createChild('select','chrome-select');label.textContent=name;if(subtitle){settingSelectElement.classList.add('chrome-select-label');label.createChild('p').textContent=subtitle;}
bindLabelToControl(label,select);for(let i=0;i<options.length;++i){const option=options[i];const optionName=option.raw?option.text:UIString.UIString(option.text);select.add(new Option(optionName,option.value));}
setting.addChangeListener(settingChanged);settingChanged();select.addEventListener('change',selectChanged,false);return settingSelectElement;function settingChanged(){const newValue=setting.get();for(let i=0;i<options.length;i++){if(options[i].value===newValue){select.selectedIndex=i;}}}
function selectChanged(){setting.set(options[select.selectedIndex].value);}};const bindCheckbox=function(input,setting){function settingChanged(){if(input.checked!==setting.get()){input.checked=setting.get();}}
setting.addChangeListener(settingChanged);settingChanged();function inputChanged(){if(setting.get()!==input.checked){setting.set(input.checked);}}
input.addEventListener('change',inputChanged,false);};const createCustomSetting=function(name,element){const p=createElement('p');const fieldsetElement=p.createChild('fieldset');const label=fieldsetElement.createChild('label');label.textContent=name;bindLabelToControl(label,element);fieldsetElement.appendChild(element);return p;};const createControlForSetting=function(setting,subtitle){if(!setting.extension()){return null;}
const descriptor=setting.extension().descriptor();const uiTitle=UIString.UIString(setting.title()||'');switch(descriptor['settingType']){case'boolean':return createSettingCheckbox(uiTitle,setting);case'enum':if(Array.isArray(descriptor['options'])){return createSettingSelect(uiTitle,descriptor['options'],setting,subtitle);}
console.error('Enum setting defined without options');return null;default:console.error('Invalid setting type: '+descriptor['settingType']);return null;}};class SettingUI{settingElement(){}}
var SettingsUI=Object.freeze({__proto__:null,createSettingCheckbox:createSettingCheckbox,bindCheckbox:bindCheckbox,createCustomSetting:createCustomSetting,createControlForSetting:createControlForSetting,SettingUI:SettingUI});class ListModel extends ObjectWrapper.ObjectWrapper{constructor(items){super();this._items=items||[];}
[Symbol.iterator](){return this._items[Symbol.iterator]();}
get length(){return this._items.length;}
at(index){return this._items[index];}
every(callback){return this._items.every(callback);}
filter(callback){return this._items.filter(callback);}
find(callback){return this._items.find(callback);}
findIndex(callback){return this._items.findIndex(callback);}
indexOf(value,fromIndex){return this._items.indexOf(value,fromIndex);}
insert(index,value){this._items.splice(index,0,value);this._replaced(index,[],1);}
insertWithComparator(value,comparator){this.insert(this._items.lowerBound(value,comparator),value);}
join(separator){return this._items.join(separator);}
remove(index){const result=this._items[index];this._items.splice(index,1);this._replaced(index,[result],0);return result;}
replace(index,value){const oldValue=this._items[index];this._items[index]=value;this._replaced(index,[oldValue],1);return oldValue;}
replaceRange(from,to,items){let removed;if(items.length<10000){removed=this._items.splice(from,to-from,...items);}else{removed=this._items.slice(from,to);const before=this._items.slice(0,from);const after=this._items.slice(to);this._items=[].concat(before,items,after);}
this._replaced(from,removed,items.length);return removed;}
replaceAll(items){const oldItems=this._items.slice();this._items=items;this._replaced(0,oldItems,items.length);return oldItems;}
slice(from,to){return this._items.slice(from,to);}
some(callback){return this._items.some(callback);}
_replaced(index,removed,inserted){this.dispatchEventToListeners(Events$3.ItemsReplaced,{index:index,removed:removed,inserted:inserted});}}
const Events$3={ItemsReplaced:Symbol('ItemsReplaced'),};var ListModel$1=Object.freeze({__proto__:null,ListModel:ListModel,Events:Events$3});class ListDelegate{createElementForItem(item){}
heightForItem(item){}
isItemSelectable(item){}
selectedItemChanged(from,to,fromElement,toElement){}
updateSelectedItemARIA(fromElement,toElement){}}
const ListMode={NonViewport:Symbol('UI.ListMode.NonViewport'),EqualHeightItems:Symbol('UI.ListMode.EqualHeightItems'),VariousHeightItems:Symbol('UI.ListMode.VariousHeightItems')};class ListControl{constructor(model,delegate,mode){this.element=createElement('div');this.element.style.overflowY='auto';this._topElement=this.element.createChild('div');this._bottomElement=this.element.createChild('div');this._firstIndex=0;this._lastIndex=0;this._renderedHeight=0;this._topHeight=0;this._bottomHeight=0;this._model=model;this._model.addEventListener(Events$3.ItemsReplaced,this._replacedItemsInRange,this);this._itemToElement=new Map();this._selectedIndex=-1;this._selectedItem=null;this.element.tabIndex=-1;this.element.addEventListener('click',this._onClick.bind(this),false);this.element.addEventListener('keydown',this._onKeyDown.bind(this),false);markAsListBox(this.element);this._delegate=delegate;this._mode=mode||ListMode.EqualHeightItems;this._fixedHeight=0;this._variableOffsets=new Int32Array(0);this._clearContents();if(this._mode!==ListMode.NonViewport){this.element.addEventListener('scroll',()=>{this._updateViewport(this.element.scrollTop,this.element.offsetHeight);},false);}}
setModel(model){this._itemToElement.clear();const length=this._model.length;this._model.removeEventListener(Events$3.ItemsReplaced,this._replacedItemsInRange,this);this._model=model;this._model.addEventListener(Events$3.ItemsReplaced,this._replacedItemsInRange,this);this.invalidateRange(0,length);}
_replacedItemsInRange(event){const data=(event.data);const from=data.index;const to=from+data.removed.length;const oldSelectedItem=this._selectedItem;const oldSelectedElement=oldSelectedItem?(this._itemToElement.get(oldSelectedItem)||null):null;for(let i=0;i<data.removed.length;i++){this._itemToElement.delete(data.removed[i]);}
this._invalidate(from,to,data.inserted);if(this._selectedIndex>=to){this._selectedIndex+=data.inserted-(to-from);this._selectedItem=this._model.at(this._selectedIndex);}else if(this._selectedIndex>=from){let index=this._findFirstSelectable(from+data.inserted,+1,false);if(index===-1){index=this._findFirstSelectable(from-1,-1,false);}
this._select(index,oldSelectedItem,oldSelectedElement);}}
refreshItem(item){const index=this._model.indexOf(item);if(index===-1){console.error('Item to refresh is not present');return;}
this.refreshItemByIndex(index);}
refreshItemByIndex(index){const item=this._model.at(index);this._itemToElement.delete(item);this.invalidateRange(index,index+1);if(this._selectedIndex!==-1){this._select(this._selectedIndex,null,null);}}
invalidateRange(from,to){this._invalidate(from,to,to-from);}
viewportResized(){if(this._mode===ListMode.NonViewport){return;}
const scrollTop=this.element.scrollTop;const viewportHeight=this.element.offsetHeight;this._clearViewport();this._updateViewport(NumberUtilities.clamp(scrollTop,0,this._totalHeight()-viewportHeight),viewportHeight);}
invalidateItemHeight(){if(this._mode!==ListMode.EqualHeightItems){console.error('Only supported in equal height items mode');return;}
this._fixedHeight=0;if(this._model.length){this._itemToElement.clear();this._invalidate(0,this._model.length,this._model.length);}}
itemForNode(node){while(node&&node.parentNodeOrShadowHost()!==this.element){node=node.parentNodeOrShadowHost();}
if(!node){return null;}
const element=(node);const index=this._model.findIndex(item=>this._itemToElement.get(item)===element);return index!==-1?this._model.at(index):null;}
scrollItemIntoView(item,center){const index=this._model.indexOf(item);if(index===-1){console.error('Attempt to scroll onto missing item');return;}
this._scrollIntoView(index,center);}
selectedItem(){return this._selectedItem;}
selectedIndex(){return this._selectedIndex;}
selectItem(item,center,dontScroll){let index=-1;if(item!==null){index=this._model.indexOf(item);if(index===-1){console.error('Attempt to select missing item');return;}
if(!this._delegate.isItemSelectable(item)){console.error('Attempt to select non-selectable item');return;}}
if(index!==-1&&!dontScroll){this._scrollIntoView(index,center);}
if(this._selectedIndex!==index){this._select(index);}}
selectPreviousItem(canWrap,center){if(this._selectedIndex===-1&&!canWrap){return false;}
let index=this._selectedIndex===-1?this._model.length-1:this._selectedIndex-1;index=this._findFirstSelectable(index,-1,!!canWrap);if(index!==-1){this._scrollIntoView(index,center);this._select(index);return true;}
return false;}
selectNextItem(canWrap,center){if(this._selectedIndex===-1&&!canWrap){return false;}
let index=this._selectedIndex===-1?0:this._selectedIndex+1;index=this._findFirstSelectable(index,+1,!!canWrap);if(index!==-1){this._scrollIntoView(index,center);this._select(index);return true;}
return false;}
selectItemPreviousPage(center){if(this._mode===ListMode.NonViewport){return false;}
let index=this._selectedIndex===-1?this._model.length-1:this._selectedIndex;index=this._findPageSelectable(index,-1);if(index!==-1){this._scrollIntoView(index,center);this._select(index);return true;}
return false;}
selectItemNextPage(center){if(this._mode===ListMode.NonViewport){return false;}
let index=this._selectedIndex===-1?0:this._selectedIndex;index=this._findPageSelectable(index,+1);if(index!==-1){this._scrollIntoView(index,center);this._select(index);return true;}
return false;}
_scrollIntoView(index,center){if(this._mode===ListMode.NonViewport){this._elementAtIndex(index).scrollIntoViewIfNeeded(!!center);return;}
const top=this._offsetAtIndex(index);const bottom=this._offsetAtIndex(index+1);const viewportHeight=this.element.offsetHeight;if(center){const scrollTo=(top+bottom)/2-viewportHeight/2;this._updateViewport(NumberUtilities.clamp(scrollTo,0,this._totalHeight()-viewportHeight),viewportHeight);return;}
const scrollTop=this.element.scrollTop;if(top<scrollTop){this._updateViewport(top,viewportHeight);}else if(bottom>scrollTop+viewportHeight){this._updateViewport(bottom-viewportHeight,viewportHeight);}}
_onClick(event){const item=this.itemForNode((event.target));if(item&&this._delegate.isItemSelectable(item)){this.selectItem(item);}}
_onKeyDown(event){let selected=false;switch(event.key){case'ArrowUp':selected=this.selectPreviousItem(true,false);break;case'ArrowDown':selected=this.selectNextItem(true,false);break;case'PageUp':selected=this.selectItemPreviousPage(false);break;case'PageDown':selected=this.selectItemNextPage(false);break;}
if(selected){event.consume(true);}}
_totalHeight(){return this._offsetAtIndex(this._model.length);}
_indexAtOffset(offset){if(this._mode===ListMode.NonViewport){throw'There should be no offset conversions in non-viewport mode';}
if(!this._model.length||offset<0){return 0;}
if(this._mode===ListMode.VariousHeightItems){return Math.min(this._model.length-1,this._variableOffsets.lowerBound(offset,undefined,0,this._model.length));}
if(!this._fixedHeight){this._measureHeight();}
return Math.min(this._model.length-1,Math.floor(offset/this._fixedHeight));}
_elementAtIndex(index){const item=this._model.at(index);let element=this._itemToElement.get(item);if(!element){element=this._delegate.createElementForItem(item);if(!hasRole(element)){markAsOption(element);}
this._itemToElement.set(item,element);}
return element;}
_offsetAtIndex(index){if(this._mode===ListMode.NonViewport){throw new Error('There should be no offset conversions in non-viewport mode');}
if(!this._model.length){return 0;}
if(this._mode===ListMode.VariousHeightItems){return this._variableOffsets[index];}
if(!this._fixedHeight){this._measureHeight();}
return index*this._fixedHeight;}
_measureHeight(){this._fixedHeight=this._delegate.heightForItem(this._model.at(0));if(!this._fixedHeight){this._fixedHeight=measurePreferredSize(this._elementAtIndex(0),this.element).height;}}
_select(index,oldItem,oldElement){if(oldItem===undefined){oldItem=this._selectedItem;}
if(oldElement===undefined){oldElement=this._itemToElement.get(oldItem)||null;}
this._selectedIndex=index;this._selectedItem=index===-1?null:this._model.at(index);const newItem=this._selectedItem;const newElement=this._selectedIndex!==-1?this._elementAtIndex(index):null;this._delegate.selectedItemChanged(oldItem,newItem,(oldElement),newElement);if(!this._delegate.updateSelectedItemARIA((oldElement),newElement)){if(oldElement){setSelected(oldElement,false);}
if(newElement){setSelected(newElement,true);}
setActiveDescendant(this.element,newElement);}}
_findFirstSelectable(index,direction,canWrap){const length=this._model.length;if(!length){return-1;}
for(let step=0;step<=length;step++){if(index<0||index>=length){if(!canWrap){return-1;}
index=(index+length)%length;}
if(this._delegate.isItemSelectable(this._model.at(index))){return index;}
index+=direction;}
return-1;}
_findPageSelectable(index,direction){let lastSelectable=-1;const startOffset=this._offsetAtIndex(index);const viewportHeight=this.element.offsetHeight-1;while(index>=0&&index<this._model.length){if(this._delegate.isItemSelectable(this._model.at(index))){if(Math.abs(this._offsetAtIndex(index)-startOffset)>=viewportHeight){return index;}
lastSelectable=index;}
index+=direction;}
return lastSelectable;}
_reallocateVariableOffsets(length,copyTo){if(this._variableOffsets.length<length){const variableOffsets=new Int32Array(Math.max(length,this._variableOffsets.length*2));variableOffsets.set(this._variableOffsets.slice(0,copyTo),0);this._variableOffsets=variableOffsets;}else if(this._variableOffsets.length>=2*length){const variableOffsets=new Int32Array(length);variableOffsets.set(this._variableOffsets.slice(0,copyTo),0);this._variableOffsets=variableOffsets;}}
_invalidate(from,to,inserted){if(this._mode===ListMode.NonViewport){this._invalidateNonViewportMode(from,to-from,inserted);return;}
if(this._mode===ListMode.VariousHeightItems){this._reallocateVariableOffsets(this._model.length+1,from+1);for(let i=from+1;i<=this._model.length;i++){this._variableOffsets[i]=this._variableOffsets[i-1]+this._delegate.heightForItem(this._model.at(i-1));}}
const viewportHeight=this.element.offsetHeight;const totalHeight=this._totalHeight();const scrollTop=this.element.scrollTop;if(this._renderedHeight<viewportHeight||totalHeight<viewportHeight){this._clearViewport();this._updateViewport(NumberUtilities.clamp(scrollTop,0,totalHeight-viewportHeight),viewportHeight);return;}
const heightDelta=totalHeight-this._renderedHeight;if(to<=this._firstIndex){const topHeight=this._topHeight+heightDelta;this._topElement.style.height=topHeight+'px';this.element.scrollTop=scrollTop+heightDelta;this._topHeight=topHeight;this._renderedHeight=totalHeight;const indexDelta=inserted-(to-from);this._firstIndex+=indexDelta;this._lastIndex+=indexDelta;return;}
if(from>=this._lastIndex){const bottomHeight=this._bottomHeight+heightDelta;this._bottomElement.style.height=bottomHeight+'px';this._bottomHeight=bottomHeight;this._renderedHeight=totalHeight;return;}
this._clearViewport();this._updateViewport(NumberUtilities.clamp(scrollTop,0,totalHeight-viewportHeight),viewportHeight);}
_invalidateNonViewportMode(start,remove,add){let startElement=this._topElement;for(let index=0;index<start;index++){startElement=startElement.nextElementSibling;}
while(remove--){startElement.nextElementSibling.remove();}
while(add--){this.element.insertBefore(this._elementAtIndex(start+add),startElement.nextElementSibling);}}
_clearViewport(){if(this._mode===ListMode.NonViewport){console.error('There should be no viewport updates in non-viewport mode');return;}
this._firstIndex=0;this._lastIndex=0;this._renderedHeight=0;this._topHeight=0;this._bottomHeight=0;this._clearContents();}
_clearContents(){this._topElement.style.height='0';this._bottomElement.style.height='0';this.element.removeChildren();this.element.appendChild(this._topElement);this.element.appendChild(this._bottomElement);}
_updateViewport(scrollTop,viewportHeight){if(this._mode===ListMode.NonViewport){console.error('There should be no viewport updates in non-viewport mode');return;}
const totalHeight=this._totalHeight();if(!totalHeight){this._firstIndex=0;this._lastIndex=0;this._topHeight=0;this._bottomHeight=0;this._renderedHeight=0;this._topElement.style.height='0';this._bottomElement.style.height='0';return;}
const firstIndex=this._indexAtOffset(scrollTop-viewportHeight);const lastIndex=this._indexAtOffset(scrollTop+2*viewportHeight)+1;while(this._firstIndex<Math.min(firstIndex,this._lastIndex)){this._elementAtIndex(this._firstIndex).remove();this._firstIndex++;}
while(this._lastIndex>Math.max(lastIndex,this._firstIndex)){this._elementAtIndex(this._lastIndex-1).remove();this._lastIndex--;}
this._firstIndex=Math.min(this._firstIndex,lastIndex);this._lastIndex=Math.max(this._lastIndex,firstIndex);for(let index=this._firstIndex-1;index>=firstIndex;index--){const element=this._elementAtIndex(index);this.element.insertBefore(element,this._topElement.nextSibling);}
for(let index=this._lastIndex;index<lastIndex;index++){const element=this._elementAtIndex(index);this.element.insertBefore(element,this._bottomElement);}
this._firstIndex=firstIndex;this._lastIndex=lastIndex;this._topHeight=this._offsetAtIndex(firstIndex);this._topElement.style.height=this._topHeight+'px';this._bottomHeight=totalHeight-this._offsetAtIndex(lastIndex);this._bottomElement.style.height=this._bottomHeight+'px';this._renderedHeight=totalHeight;this.element.scrollTop=scrollTop;}}
var ListControl$1=Object.freeze({__proto__:null,ListDelegate:ListDelegate,ListMode:ListMode,ListControl:ListControl});class SuggestBoxDelegate{applySuggestion(suggestion,isIntermediateSuggestion){}
acceptSuggestion(){}}
class SuggestBox{constructor(suggestBoxDelegate,maxItemsHeight){this._suggestBoxDelegate=suggestBoxDelegate;this._maxItemsHeight=maxItemsHeight;this._rowHeight=17;this._userEnteredText='';this._defaultSelectionIsDimmed=false;this._onlyCompletion=null;this._items=new ListModel();this._list=new ListControl(this._items,this,ListMode.EqualHeightItems);this._element=this._list.element;this._element.classList.add('suggest-box');this._element.addEventListener('mousedown',event=>event.preventDefault(),true);this._element.addEventListener('click',this._onClick.bind(this),false);this._glassPane=new GlassPane();this._glassPane.setAnchorBehavior(AnchorBehavior.PreferBottom);this._glassPane.setOutsideClickCallback(this.hide.bind(this));const shadowRoot=createShadowRootWithCoreStyles(this._glassPane.contentElement,'ui/suggestBox.css');shadowRoot.appendChild(this._element);}
visible(){return this._glassPane.isShowing();}
setPosition(anchorBox){this._glassPane.setContentAnchorBox(anchorBox);}
setAnchorBehavior(behavior){this._glassPane.setAnchorBehavior(behavior);}
_updateMaxSize(items){const maxWidth=this._maxWidth(items);const length=this._maxItemsHeight?Math.min(this._maxItemsHeight,items.length):items.length;const maxHeight=length*this._rowHeight;this._glassPane.setMaxContentSize(new Size(maxWidth,maxHeight));}
_maxWidth(items){const kMaxWidth=300;if(!items.length){return kMaxWidth;}
let maxItem;let maxLength=-Infinity;for(let i=0;i<items.length;i++){const length=(items[i].title||items[i].text).length+(items[i].subtitle||'').length;if(length>maxLength){maxLength=length;maxItem=items[i];}}
const element=this.createElementForItem((maxItem));const preferredWidth=measurePreferredSize(element,this._element).width+measuredScrollbarWidth(this._element.ownerDocument);return Math.min(kMaxWidth,preferredWidth);}
_show(){if(this.visible()){return;}
this._glassPane.show(document);this._rowHeight=measurePreferredSize(this.createElementForItem({text:'1',subtitle:'12'}),this._element).height;}
hide(){if(!this.visible()){return;}
this._glassPane.hide();}
_applySuggestion(isIntermediateSuggestion){if(this._onlyCompletion){alert(ls`${this._onlyCompletion.text}, suggestion`,this._element);this._suggestBoxDelegate.applySuggestion(this._onlyCompletion,isIntermediateSuggestion);return true;}
const suggestion=this._list.selectedItem();if(suggestion&&suggestion.text){alert(ls`${suggestion.title || suggestion.text}, suggestion`,this._element);}
this._suggestBoxDelegate.applySuggestion(suggestion,isIntermediateSuggestion);return this.visible()&&!!suggestion;}
acceptSuggestion(){const result=this._applySuggestion();this.hide();if(!result){return false;}
this._suggestBoxDelegate.acceptSuggestion();return true;}
createElementForItem(item){const query=this._userEnteredText;const element=createElementWithClass('div','suggest-box-content-item source-code');if(item.iconType){const icon=Icon.create(item.iconType,'suggestion-icon');element.appendChild(icon);}
if(item.isSecondary){element.classList.add('secondary');}
element.tabIndex=-1;const maxTextLength=50+query.length;const displayText=(item.title||item.text).trim().trimEndWithMaxLength(maxTextLength).replace(/\n/g,'\u21B5');const titleElement=element.createChild('span','suggestion-title');const index=displayText.toLowerCase().indexOf(query.toLowerCase());if(index>0){titleElement.createChild('span').textContent=displayText.substring(0,index);}
if(index>-1){titleElement.createChild('span','query').textContent=displayText.substring(index,index+query.length);}
titleElement.createChild('span').textContent=displayText.substring(index>-1?index+query.length:0);titleElement.createChild('span','spacer');if(item.subtitleRenderer){const subtitleElement=item.subtitleRenderer.call(null);subtitleElement.classList.add('suggestion-subtitle');element.appendChild(subtitleElement);}else if(item.subtitle){const subtitleElement=element.createChild('span','suggestion-subtitle');subtitleElement.textContent=item.subtitle.trimEndWithMaxLength(maxTextLength-displayText.length);}
return element;}
heightForItem(item){return this._rowHeight;}
isItemSelectable(item){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.classList.remove('selected','force-white-icons');}
if(toElement){toElement.classList.add('selected');toElement.classList.add('force-white-icons');}
this._applySuggestion(true);}
updateSelectedItemARIA(fromElement,toElement){return false;}
_onClick(event){const item=this._list.itemForNode((event.target));if(!item){return;}
this._list.selectItem(item);this.acceptSuggestion();event.consume(true);}
_canShowBox(completions,highestPriorityItem,canShowForSingleItem,userEnteredText){if(!completions||!completions.length){return false;}
if(completions.length>1){return true;}
if(!highestPriorityItem||highestPriorityItem.isSecondary||!highestPriorityItem.text.startsWith(userEnteredText)){return true;}
return canShowForSingleItem&&highestPriorityItem.text!==userEnteredText;}
updateSuggestions(anchorBox,completions,selectHighestPriority,canShowForSingleItem,userEnteredText){this._onlyCompletion=null;const highestPriorityItem=selectHighestPriority?completions.reduce((a,b)=>(a.priority||0)>=(b.priority||0)?a:b):null;if(this._canShowBox(completions,highestPriorityItem,canShowForSingleItem,userEnteredText)){this._userEnteredText=userEnteredText;this._show();this._updateMaxSize(completions);this._glassPane.setContentAnchorBox(anchorBox);this._list.invalidateItemHeight();this._items.replaceAll(completions);if(highestPriorityItem&&!highestPriorityItem.isSecondary){this._list.selectItem(highestPriorityItem,true);}else{this._list.selectItem(null);}}else{if(completions.length===1){this._onlyCompletion=completions[0];this._applySuggestion(true);}
this.hide();}}
keyPressed(event){switch(event.key){case'Enter':return this.enterKeyPressed();case'ArrowUp':return this._list.selectPreviousItem(true,false);case'ArrowDown':return this._list.selectNextItem(true,false);case'PageUp':return this._list.selectItemPreviousPage(false);case'PageDown':return this._list.selectItemNextPage(false);}
return false;}
enterKeyPressed(){const hasSelectedItem=!!this._list.selectedItem()||!!this._onlyCompletion;this.acceptSuggestion();return hasSelectedItem;}}
let Suggestion;let Suggestions;let AutocompleteConfig;var SuggestBox$1=Object.freeze({__proto__:null,SuggestBoxDelegate:SuggestBoxDelegate,SuggestBox:SuggestBox,Suggestion:Suggestion,Suggestions:Suggestions,AutocompleteConfig:AutocompleteConfig});class TextPrompt extends ObjectWrapper.ObjectWrapper{constructor(){super();this._proxyElement;this._proxyElementDisplay='inline-block';this._autocompletionTimeout=DefaultAutocompletionTimeout;this._title='';this._queryRange=null;this._previousText='';this._currentSuggestion=null;this._completionRequestId=0;this._ghostTextElement=createElementWithClass('span','auto-complete-text');this._ghostTextElement.setAttribute('contenteditable','false');markAsHidden(this._ghostTextElement);}
initialize(completions,stopCharacters){this._loadCompletions=completions;this._completionStopCharacters=stopCharacters||' =:[({;,!+-*/&|^<>.';}
setAutocompletionTimeout(timeout){this._autocompletionTimeout=timeout;}
renderAsBlock(){this._proxyElementDisplay='block';}
attach(element){return this._attachInternal(element);}
attachAndStartEditing(element,blurListener){const proxyElement=this._attachInternal(element);this._startEditing(blurListener);return proxyElement;}
_attachInternal(element){if(this._proxyElement){throw'Cannot attach an attached TextPrompt';}
this._element=element;this._boundOnKeyDown=this.onKeyDown.bind(this);this._boundOnInput=this.onInput.bind(this);this._boundOnMouseWheel=this.onMouseWheel.bind(this);this._boundClearAutocomplete=this.clearAutocomplete.bind(this);this._proxyElement=element.ownerDocument.createElement('span');appendStyle(this._proxyElement,'ui/textPrompt.css');this._contentElement=this._proxyElement.createChild('div','text-prompt-root');this._proxyElement.style.display=this._proxyElementDisplay;element.parentElement.insertBefore(this._proxyElement,element);this._contentElement.appendChild(element);this._element.classList.add('text-prompt');markAsTextBox(this._element);this._element.setAttribute('contenteditable','plaintext-only');this._element.addEventListener('keydown',this._boundOnKeyDown,false);this._element.addEventListener('input',this._boundOnInput,false);this._element.addEventListener('mousewheel',this._boundOnMouseWheel,false);this._element.addEventListener('selectstart',this._boundClearAutocomplete,false);this._element.addEventListener('blur',this._boundClearAutocomplete,false);this._suggestBox=new SuggestBox(this,20);if(this._title){this._proxyElement.title=this._title;}
return this._proxyElement;}
detach(){this._removeFromElement();this._focusRestorer.restore();this._proxyElement.parentElement.insertBefore(this._element,this._proxyElement);this._proxyElement.remove();delete this._proxyElement;this._element.classList.remove('text-prompt');this._element.removeAttribute('contenteditable');this._element.removeAttribute('role');}
textWithCurrentSuggestion(){const text=this.text();if(!this._queryRange||!this._currentSuggestion){return text;}
const suggestion=this._currentSuggestion.text;return text.substring(0,this._queryRange.startColumn)+suggestion+text.substring(this._queryRange.endColumn);}
text(){let text=this._element.textContent;if(this._ghostTextElement.parentNode){const addition=this._ghostTextElement.textContent;text=text.substring(0,text.length-addition.length);}
return text;}
setText(text){this.clearAutocomplete();this._element.textContent=text;this._previousText=this.text();if(this._element.hasFocus()){this.moveCaretToEndOfPrompt();this._element.scrollIntoView();}}
focus(){this._element.focus();}
title(){return this._title;}
setTitle(title){this._title=title;if(this._proxyElement){this._proxyElement.title=title;}}
setPlaceholder(placeholder,ariaPlaceholder){if(placeholder){this._element.setAttribute('data-placeholder',placeholder);setPlaceholder(this._element,ariaPlaceholder||placeholder);}else{this._element.removeAttribute('data-placeholder');setPlaceholder(this._element,null);}}
setEnabled(enabled){if(enabled){this._element.setAttribute('contenteditable','plaintext-only');}else{this._element.removeAttribute('contenteditable');}
this._element.classList.toggle('disabled',!enabled);}
_removeFromElement(){this.clearAutocomplete();this._element.removeEventListener('keydown',this._boundOnKeyDown,false);this._element.removeEventListener('input',this._boundOnInput,false);this._element.removeEventListener('selectstart',this._boundClearAutocomplete,false);this._element.removeEventListener('blur',this._boundClearAutocomplete,false);if(this._isEditing){this._stopEditing();}
if(this._suggestBox){this._suggestBox.hide();}}
_startEditing(blurListener){this._isEditing=true;this._contentElement.classList.add('text-prompt-editing');if(blurListener){this._blurListener=blurListener;this._element.addEventListener('blur',this._blurListener,false);}
this._oldTabIndex=this._element.tabIndex;if(this._element.tabIndex<0){this._element.tabIndex=0;}
this._focusRestorer=new ElementFocusRestorer(this._element);if(!this.text()){this.autoCompleteSoon();}}
_stopEditing(){this._element.tabIndex=this._oldTabIndex;if(this._blurListener){this._element.removeEventListener('blur',this._blurListener,false);}
this._contentElement.classList.remove('text-prompt-editing');delete this._isEditing;}
onMouseWheel(event){}
onKeyDown(event){let handled=false;if(this.isSuggestBoxVisible()&&this._suggestBox.keyPressed(event)){event.consume(true);return;}
switch(event.key){case'Tab':handled=this.tabKeyPressed(event);break;case'ArrowLeft':case'ArrowUp':case'PageUp':case'Home':this.clearAutocomplete();break;case'PageDown':case'ArrowRight':case'ArrowDown':case'End':if(this._isCaretAtEndOfPrompt()){handled=this.acceptAutoComplete();}else{this.clearAutocomplete();}
break;case'Escape':if(this.isSuggestBoxVisible()){this.clearAutocomplete();handled=true;}
break;case' ':if(event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey){this.autoCompleteSoon(true);handled=true;}
break;}
if(isEnterKey(event)){event.preventDefault();}
if(handled){event.consume(true);}}
_acceptSuggestionOnStopCharacters(key){if(!this._currentSuggestion||!this._queryRange||key.length!==1||!this._completionStopCharacters.includes(key)){return false;}
const query=this.text().substring(this._queryRange.startColumn,this._queryRange.endColumn);if(query&&this._currentSuggestion.text.startsWith(query+key)){this._queryRange.endColumn+=1;return this.acceptAutoComplete();}
return false;}
onInput(event){const text=this.text();if(event.data&&!this._acceptSuggestionOnStopCharacters(event.data)){const hasCommonPrefix=text.startsWith(this._previousText)||this._previousText.startsWith(text);if(this._queryRange&&hasCommonPrefix){this._queryRange.endColumn+=text.length-this._previousText.length;}}
this._refreshGhostText();this._previousText=text;this.dispatchEventToListeners(Events$4.TextChanged);this.autoCompleteSoon();}
acceptAutoComplete(){let result=false;if(this.isSuggestBoxVisible()){result=this._suggestBox.acceptSuggestion();}
if(!result){result=this._acceptSuggestionInternal();}
return result;}
clearAutocomplete(){const beforeText=this.textWithCurrentSuggestion();if(this.isSuggestBoxVisible()){this._suggestBox.hide();}
this._clearAutocompleteTimeout();this._queryRange=null;this._refreshGhostText();if(beforeText!==this.textWithCurrentSuggestion()){this.dispatchEventToListeners(Events$4.TextChanged);}}
_refreshGhostText(){if(this._currentSuggestion&&this._currentSuggestion.hideGhostText){this._ghostTextElement.remove();return;}
if(this._queryRange&&this._currentSuggestion&&this._isCaretAtEndOfPrompt()&&this._currentSuggestion.text.startsWith(this.text().substring(this._queryRange.startColumn))){this._ghostTextElement.textContent=this._currentSuggestion.text.substring(this._queryRange.endColumn-this._queryRange.startColumn);this._element.appendChild(this._ghostTextElement);}else{this._ghostTextElement.remove();}}
_clearAutocompleteTimeout(){if(this._completeTimeout){clearTimeout(this._completeTimeout);delete this._completeTimeout;}
this._completionRequestId++;}
autoCompleteSoon(force){const immediately=this.isSuggestBoxVisible()||force;if(!this._completeTimeout){this._completeTimeout=setTimeout(this.complete.bind(this,force),immediately?0:this._autocompletionTimeout);}}
async complete(force){this._clearAutocompleteTimeout();const selection=this._element.getComponentSelection();const selectionRange=selection&&selection.rangeCount?selection.getRangeAt(0):null;if(!selectionRange){return;}
let shouldExit;if(!force&&!this._isCaretAtEndOfPrompt()&&!this.isSuggestBoxVisible()){shouldExit=true;}else if(!selection.isCollapsed){shouldExit=true;}
if(shouldExit){this.clearAutocomplete();return;}
const wordQueryRange=selectionRange.startContainer.rangeOfWord(selectionRange.startOffset,this._completionStopCharacters,this._element,'backward');const expressionRange=wordQueryRange.cloneRange();expressionRange.collapse(true);expressionRange.setStartBefore(this._element);const completionRequestId=++this._completionRequestId;const completions=await this._loadCompletions(expressionRange.toString(),wordQueryRange.toString(),!!force);this._completionsReady(completionRequestId,selection,wordQueryRange,!!force,completions);}
disableDefaultSuggestionForEmptyInput(){this._disableDefaultSuggestionForEmptyInput=true;}
_boxForAnchorAtStart(selection,textRange){const rangeCopy=selection.getRangeAt(0).cloneRange();const anchorElement=createElement('span');anchorElement.textContent='\u200B';textRange.insertNode(anchorElement);const box=anchorElement.boxInWindow(window);anchorElement.remove();selection.removeAllRanges();selection.addRange(rangeCopy);return box;}
_createRange(){return document.createRange();}
additionalCompletions(query){return[];}
_completionsReady(completionRequestId,selection,originalWordQueryRange,force,completions){if(this._completionRequestId!==completionRequestId){return;}
const query=originalWordQueryRange.toString();const store=new Set();completions=completions.filter(item=>!store.has(item.text)&&!!store.add(item.text));if(query||force){if(query){completions=completions.concat(this.additionalCompletions(query));}else{completions=this.additionalCompletions(query).concat(completions);}}
if(!completions.length){this.clearAutocomplete();return;}
const selectionRange=selection.getRangeAt(0);const fullWordRange=this._createRange();fullWordRange.setStart(originalWordQueryRange.startContainer,originalWordQueryRange.startOffset);fullWordRange.setEnd(selectionRange.endContainer,selectionRange.endOffset);if(query+selectionRange.toString()!==fullWordRange.toString()){return;}
const beforeRange=this._createRange();beforeRange.setStart(this._element,0);beforeRange.setEnd(fullWordRange.startContainer,fullWordRange.startOffset);this._queryRange=new TextUtils.TextRange(0,beforeRange.toString().length,0,beforeRange.toString().length+fullWordRange.toString().length);const shouldSelect=!this._disableDefaultSuggestionForEmptyInput||!!this.text();if(this._suggestBox){this._suggestBox.updateSuggestions(this._boxForAnchorAtStart(selection,fullWordRange),completions,shouldSelect,!this._isCaretAtEndOfPrompt(),this.text());}}
applySuggestion(suggestion,isIntermediateSuggestion){this._currentSuggestion=suggestion;this._refreshGhostText();if(isIntermediateSuggestion){this.dispatchEventToListeners(Events$4.TextChanged);}}
acceptSuggestion(){this._acceptSuggestionInternal();}
_acceptSuggestionInternal(){if(!this._queryRange){return false;}
const suggestionLength=this._currentSuggestion?this._currentSuggestion.text.length:0;const selectionRange=this._currentSuggestion?this._currentSuggestion.selectionRange:null;const endColumn=selectionRange?selectionRange.endColumn:suggestionLength;const startColumn=selectionRange?selectionRange.startColumn:suggestionLength;this._element.textContent=this.textWithCurrentSuggestion();this.setDOMSelection(this._queryRange.startColumn+startColumn,this._queryRange.startColumn+endColumn);this.clearAutocomplete();this.dispatchEventToListeners(Events$4.TextChanged);return true;}
setDOMSelection(startColumn,endColumn){this._element.normalize();const node=this._element.childNodes[0];if(!node||node===this._ghostTextElement){return;}
const range=this._createRange();range.setStart(node,startColumn);range.setEnd(node,endColumn);const selection=this._element.getComponentSelection();selection.removeAllRanges();selection.addRange(range);}
isSuggestBoxVisible(){return this._suggestBox&&this._suggestBox.visible();}
isCaretInsidePrompt(){const selection=this._element.getComponentSelection();const selectionRange=selection&&selection.rangeCount?selection.getRangeAt(0):null;if(!selectionRange||!selection.isCollapsed){return false;}
return selectionRange.startContainer.isSelfOrDescendant(this._element);}
_isCaretAtEndOfPrompt(){const selection=this._element.getComponentSelection();const selectionRange=selection&&selection.rangeCount?selection.getRangeAt(0):null;if(!selectionRange||!selection.isCollapsed){return false;}
let node=selectionRange.startContainer;if(!node.isSelfOrDescendant(this._element)){return false;}
if(this._ghostTextElement.isAncestor(node)){return true;}
if(node.nodeType===Node.TEXT_NODE&&selectionRange.startOffset<node.nodeValue.length){return false;}
let foundNextText=false;while(node){if(node.nodeType===Node.TEXT_NODE&&node.nodeValue.length){if(foundNextText&&!this._ghostTextElement.isAncestor(node)){return false;}
foundNextText=true;}
node=node.traverseNextNode(this._element);}
return true;}
moveCaretToEndOfPrompt(){const selection=this._element.getComponentSelection();const selectionRange=this._createRange();let container=this._element;while(container.childNodes.length){container=container.lastChild;}
const offset=container.nodeType===Node.TEXT_NODE?container.textContent.length:0;selectionRange.setStart(container,offset);selectionRange.setEnd(container,offset);selection.removeAllRanges();selection.addRange(selectionRange);}
tabKeyPressed(event){return this.acceptAutoComplete();}
proxyElementForTests(){return this._proxyElement||null;}}
const DefaultAutocompletionTimeout=250;const Events$4={TextChanged:Symbol('TextChanged')};var TextPrompt$1=Object.freeze({__proto__:null,TextPrompt:TextPrompt,Events:Events$4});let zoomManagerInstance;class ZoomManager extends ObjectWrapper.ObjectWrapper{constructor(window,frontendHost){super();this._frontendHost=frontendHost;this._zoomFactor=this._frontendHost.zoomFactor();window.addEventListener('resize',this._onWindowResize.bind(this),true);}
static instance(opts={forceNew:null,win:null,frontendHost:null}){const{forceNew,win,frontendHost}=opts;if(!zoomManagerInstance||forceNew){if(!win||!frontendHost){throw new Error(`Unable to create zoom manager: window and frontendHost must be provided: ${new Error().stack}`);}
zoomManagerInstance=new ZoomManager(win,frontendHost);}
return zoomManagerInstance;}
zoomFactor(){return this._zoomFactor;}
cssToDIP(value){return value*this._zoomFactor;}
dipToCSS(valueDIP){return valueDIP/this._zoomFactor;}
_onWindowResize(){const oldZoomFactor=this._zoomFactor;this._zoomFactor=this._frontendHost.zoomFactor();if(oldZoomFactor!==this._zoomFactor){this.dispatchEventToListeners(Events$5.ZoomChanged,{from:oldZoomFactor,to:this._zoomFactor});}}}
const Events$5={ZoomChanged:Symbol('ZoomChanged')};var ZoomManager$1=Object.freeze({__proto__:null,ZoomManager:ZoomManager,Events:Events$5});class Tooltip{constructor(doc){this.element=doc.body.createChild('div');this._shadowRoot=createShadowRootWithCoreStyles(this.element,'ui/tooltip.css');this._tooltipElement=this._shadowRoot.createChild('div','tooltip');doc.addEventListener('mousemove',this._mouseMove.bind(this),true);doc.addEventListener('mousedown',this._hide.bind(this,true),true);doc.addEventListener('mouseleave',this._hide.bind(this,false),true);doc.addEventListener('keydown',this._hide.bind(this,true),true);ZoomManager.instance().addEventListener(Events$5.ZoomChanged,this._reset,this);doc.defaultView.addEventListener('resize',this._reset.bind(this),false);}
static installHandler(doc){new Tooltip(doc);}
static install(element,tooltipContent,actionId,options){if(!tooltipContent){delete element[_symbol];return;}
element[_symbol]={content:tooltipContent,actionId:actionId,options:options||{}};}
static addNativeOverrideContainer(element){_nativeOverrideContainer.push(element);}
_mouseMove(event){const mouseEvent=(event);const path=mouseEvent.composedPath();if(!path||mouseEvent.buttons!==0||(mouseEvent.movementX===0&&mouseEvent.movementY===0)){return;}
if(this._anchorElement&&path.indexOf(this._anchorElement)===-1){this._hide(false);}
for(const element of path){if(element===this._anchorElement){return;}
if(!(element instanceof Element)||element.offsetParent===null){continue;}
if(element[_symbol]){this._show(element,mouseEvent);return;}}}
_reposition(anchorElement,event){this._tooltipElement.positionAt(0,0);const container=GlassPane.container((anchorElement.ownerDocument));const containerBox=container.boxInWindow(this.element.window());const anchorBox=this._anchorElement.boxInWindow(this.element.window());const anchorOffset=2;const pageMargin=2;const cursorOffset=10;this._tooltipElement.classList.toggle('tooltip-breakword',!this._tooltipElement.textContent.match('\\s'));this._tooltipElement.style.maxWidth=(containerBox.width-pageMargin*2)+'px';this._tooltipElement.style.maxHeight='';const tooltipWidth=this._tooltipElement.offsetWidth;const tooltipHeight=this._tooltipElement.offsetHeight;const anchorTooltipAtElement=this._anchorTooltipAtElement();let tooltipX=anchorTooltipAtElement?anchorBox.x:event.x+cursorOffset;tooltipX=NumberUtilities.clamp(tooltipX,containerBox.x+pageMargin,containerBox.x+containerBox.width-tooltipWidth-pageMargin);let tooltipY;if(!anchorTooltipAtElement){tooltipY=event.y+cursorOffset+tooltipHeight<containerBox.y+containerBox.height?event.y+cursorOffset:event.y-tooltipHeight-1;}else{const onBottom=anchorBox.y+anchorOffset+anchorBox.height+tooltipHeight<containerBox.y+containerBox.height;tooltipY=onBottom?anchorBox.y+anchorBox.height+anchorOffset:anchorBox.y-tooltipHeight-anchorOffset;}
this._tooltipElement.positionAt(tooltipX,tooltipY);}
_anchorTooltipAtElement(){const tooltip=this._anchorElement[_symbol];if(tooltip.options.anchorTooltipAtElement!==undefined){return tooltip.options.anchorTooltipAtElement;}
return this._anchorElement.nodeName==='BUTTON'||this._anchorElement.nodeName==='LABEL';}
_show(anchorElement,event){const tooltip=anchorElement[_symbol];this._anchorElement=anchorElement;this._tooltipElement.removeChildren();if(this._shouldUseNativeTooltips()){Object.defineProperty(this._anchorElement,'title',(_nativeTitle));this._anchorElement.title=tooltip.content;return;}
if(typeof tooltip.content==='string'){this._tooltipElement.setTextContentTruncatedIfNeeded(tooltip.content);}else{this._tooltipElement.appendChild(tooltip.content);}
if(tooltip.actionId){const shortcuts=self.UI.shortcutRegistry.shortcutDescriptorsForAction(tooltip.actionId);for(const shortcut of shortcuts){const shortcutElement=this._tooltipElement.createChild('div','tooltip-shortcut');shortcutElement.textContent=shortcut.name;}}
const now=Date.now();const instant=(this._tooltipLastClosed&&now-this._tooltipLastClosed<Timing.InstantThreshold);this._tooltipElement.classList.toggle('instant',instant);this._tooltipLastOpened=instant?now:now+Timing.OpeningDelay;this._reposition(anchorElement,event);this._tooltipElement.classList.add('shown');}
_shouldUseNativeTooltips(){for(const element of _nativeOverrideContainer){if(this._anchorElement.isSelfOrDescendant(element)){return true;}}
return false;}
_hide(removeInstant){delete this._anchorElement;this._tooltipElement.classList.remove('shown');if(Date.now()>this._tooltipLastOpened){this._tooltipLastClosed=Date.now();}
if(removeInstant){delete this._tooltipLastClosed;}}
_reset(){this._hide(true);this._tooltipElement.positionAt(0,0);this._tooltipElement.style.maxWidth='0';this._tooltipElement.style.maxHeight='0';}}
let TooltipOptions;const Timing={'InstantThreshold':300,'OpeningDelay':600};const _symbol=Symbol('Tooltip');const TooltipSymbol=_symbol;const _nativeOverrideContainer=[];const _nativeTitle=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'title');Object.defineProperty(HTMLElement.prototype,'title',{get:function(){const tooltip=this[_symbol];return tooltip?tooltip.content:'';},set:function(x){Tooltip.install(this,x);}});var Tooltip$1=Object.freeze({__proto__:null,Tooltip:Tooltip,TooltipOptions:TooltipOptions,TooltipSymbol:TooltipSymbol});class Toolbar{constructor(className,parentElement){this._items=[];this.element=parentElement?parentElement.createChild('div'):createElement('div');this.element.className=className;this.element.classList.add('toolbar');this._enabled=true;this._shadowRoot=createShadowRootWithCoreStyles(this.element,'ui/toolbar.css');this._contentElement=this._shadowRoot.createChild('div','toolbar-shadow');this._insertionPoint=this._contentElement.createChild('slot');}
static createLongPressActionButton(action,toggledOptions,untoggledOptions){const button=Toolbar.createActionButton(action);const mainButtonClone=Toolbar.createActionButton(action);let longClickController=null;let longClickButtons=null;let longClickGlyph=null;action.addEventListener(Events$1.Toggled,updateOptions);updateOptions();return button;function updateOptions(){const buttons=action.toggled()?(toggledOptions||null):(untoggledOptions||null);if(buttons&&buttons.length){if(!longClickController){longClickController=new LongClickController(button.element,showOptions);longClickGlyph=Icon.create('largeicon-longclick-triangle','long-click-glyph');button.element.appendChild(longClickGlyph);longClickButtons=buttons;}}else{if(longClickController){longClickController.dispose();longClickController=null;longClickGlyph.remove();longClickGlyph=null;longClickButtons=null;}}}
function showOptions(){let buttons=longClickButtons.slice();buttons.push(mainButtonClone);const document=button.element.ownerDocument;document.documentElement.addEventListener('mouseup',mouseUp,false);const optionsGlassPane=new GlassPane();optionsGlassPane.setPointerEventsBehavior(PointerEventsBehavior.BlockedByGlassPane);optionsGlassPane.show(document);const optionsBar=new Toolbar('fill',optionsGlassPane.contentElement);optionsBar._contentElement.classList.add('floating');const buttonHeight=26;const hostButtonPosition=button.element.boxInWindow().relativeToElement(GlassPane.container(document));const topNotBottom=hostButtonPosition.y+buttonHeight*buttons.length<document.documentElement.offsetHeight;if(topNotBottom){buttons=buttons.reverse();}
optionsBar.element.style.height=(buttonHeight*buttons.length)+'px';if(topNotBottom){optionsBar.element.style.top=(hostButtonPosition.y-5)+'px';}else{optionsBar.element.style.top=(hostButtonPosition.y-(buttonHeight*(buttons.length-1))-6)+'px';}
optionsBar.element.style.left=(hostButtonPosition.x-5)+'px';for(let i=0;i<buttons.length;++i){buttons[i].element.addEventListener('mousemove',mouseOver,false);buttons[i].element.addEventListener('mouseout',mouseOut,false);optionsBar.appendToolbarItem(buttons[i]);}
const hostButtonIndex=topNotBottom?0:buttons.length-1;buttons[hostButtonIndex].element.classList.add('emulate-active');function mouseOver(e){if(e.which!==1){return;}
const buttonElement=e.target.enclosingNodeOrSelfWithClass('toolbar-item');buttonElement.classList.add('emulate-active');}
function mouseOut(e){if(e.which!==1){return;}
const buttonElement=e.target.enclosingNodeOrSelfWithClass('toolbar-item');buttonElement.classList.remove('emulate-active');}
function mouseUp(e){if(e.which!==1){return;}
optionsGlassPane.hide();document.documentElement.removeEventListener('mouseup',mouseUp,false);for(let i=0;i<buttons.length;++i){if(buttons[i].element.classList.contains('emulate-active')){buttons[i].element.classList.remove('emulate-active');buttons[i]._clicked(e);break;}}}}}
static createActionButton(action,options=TOOLBAR_BUTTON_DEFAULT_OPTIONS){const button=action.toggleable()?makeToggle():makeButton();if(options.showLabel){button.setText(action.title());}
let handler=event=>{action.execute();};if(options.userActionCode){const actionCode=options.userActionCode;handler=()=>{userMetrics.actionTaken(actionCode);action.execute();};}
button.addEventListener(ToolbarButton.Events.Click,handler,action);action.addEventListener(Events$1.Enabled,enabledChanged);button.setEnabled(action.enabled());return button;function makeButton(){const button=new ToolbarButton(action.title(),action.icon());if(action.title()){Tooltip.install(button.element,action.title(),action.id(),{anchorTooltipAtElement:true,});}
return button;}
function makeToggle(){const toggleButton=new ToolbarToggle(action.title(),action.icon(),action.toggledIcon());toggleButton.setToggleWithRedColor(action.toggleWithRedColor());action.addEventListener(Events$1.Toggled,toggled);toggled();return toggleButton;function toggled(){toggleButton.setToggled(action.toggled());if(action.title()){toggleButton.setTitle(action.title());Tooltip.install(toggleButton.element,action.title(),action.id(),{anchorTooltipAtElement:true,});}}}
function enabledChanged(event){button.setEnabled((event.data));}}
static createActionButtonForId(actionId,options=TOOLBAR_BUTTON_DEFAULT_OPTIONS){const action=self.UI.actionRegistry.action(actionId);return Toolbar.createActionButton((action),options);}
gripElementForResize(){return this._contentElement;}
makeWrappable(growVertically){this._contentElement.classList.add('wrappable');if(growVertically){this._contentElement.classList.add('toolbar-grow-vertical');}}
makeVertical(){this._contentElement.classList.add('vertical');}
makeBlueOnHover(){this._contentElement.classList.add('toolbar-blue-on-hover');}
makeToggledGray(){this._contentElement.classList.add('toolbar-toggled-gray');}
renderAsLinks(){this._contentElement.classList.add('toolbar-render-as-links');}
empty(){return!this._items.length;}
setEnabled(enabled){this._enabled=enabled;for(const item of this._items){item._applyEnabledState(this._enabled&&item._enabled);}}
appendToolbarItem(item){this._items.push(item);item._toolbar=this;if(!this._enabled){item._applyEnabledState(false);}
this._contentElement.insertBefore(item.element,this._insertionPoint);this._hideSeparatorDupes();}
appendSeparator(){this.appendToolbarItem(new ToolbarSeparator());}
appendSpacer(){this.appendToolbarItem(new ToolbarSeparator(true));}
appendText(text){this.appendToolbarItem(new ToolbarText(text));}
removeToolbarItems(){for(const item of this._items){delete item._toolbar;}
this._items=[];this._contentElement.removeChildren();this._insertionPoint=this._contentElement.createChild('slot');}
setColor(color){const style=createElement('style');style.textContent='.toolbar-glyph { background-color: '+color+' !important }';this._shadowRoot.appendChild(style);}
setToggledColor(color){const style=createElement('style');style.textContent='.toolbar-button.toolbar-state-on .toolbar-glyph { background-color: '+color+' !important }';this._shadowRoot.appendChild(style);}
_hideSeparatorDupes(){if(!this._items.length){return;}
let previousIsSeparator=false;let lastSeparator;let nonSeparatorVisible=false;for(let i=0;i<this._items.length;++i){if(this._items[i]instanceof ToolbarSeparator){this._items[i].setVisible(!previousIsSeparator);previousIsSeparator=true;lastSeparator=this._items[i];continue;}
if(this._items[i].visible()){previousIsSeparator=false;lastSeparator=null;nonSeparatorVisible=true;}}
if(lastSeparator&&lastSeparator!==this._items.peekLast()){lastSeparator.setVisible(false);}
this.element.classList.toggle('hidden',!!lastSeparator&&lastSeparator.visible()&&!nonSeparatorVisible);}
async appendItemsAtLocation(location){const extensions=self.runtime.extensions(Provider);const filtered=extensions.filter(e=>e.descriptor()['location']===location);const items=await Promise.all(filtered.map(extension=>{const descriptor=extension.descriptor();if(descriptor['separator']){return new ToolbarSeparator();}
if(descriptor['actionId']){return Toolbar.createActionButtonForId(descriptor['actionId'],descriptor['showLabel']);}
return extension.instance().then(p=>p.item());}));items.filter(item=>item).forEach(item=>this.appendToolbarItem(item));}}
let ToolbarButtonOptions;const TOOLBAR_BUTTON_DEFAULT_OPTIONS={showLabel:false,userActionCode:undefined};class ToolbarItem extends ObjectWrapper.ObjectWrapper{constructor(element){super();this.element=element;this.element.classList.add('toolbar-item');this._visible=true;this._enabled=true;}
setTitle(title){if(this._title===title){return;}
this._title=title;setAccessibleName(this.element,title);Tooltip.install(this.element,title,undefined,{anchorTooltipAtElement:true,});}
setEnabled(value){if(this._enabled===value){return;}
this._enabled=value;this._applyEnabledState(this._enabled&&(!this._toolbar||this._toolbar._enabled));}
_applyEnabledState(enabled){this.element.disabled=!enabled;}
visible(){return this._visible;}
setVisible(x){if(this._visible===x){return;}
this.element.classList.toggle('hidden',!x);this._visible=x;if(this._toolbar&&!(this instanceof ToolbarSeparator)){this._toolbar._hideSeparatorDupes();}}
setRightAligned(alignRight){this.element.classList.toggle('toolbar-item-right-aligned',alignRight);}}
class ToolbarText extends ToolbarItem{constructor(text){super(createElementWithClass('div','toolbar-text'));this.element.classList.add('toolbar-text');this.setText(text||'');}
text(){return this.element.textContent;}
setText(text){this.element.textContent=text;}}
class ToolbarButton extends ToolbarItem{constructor(title,glyph,text){super(createElementWithClass('button','toolbar-button'));this.element.addEventListener('click',this._clicked.bind(this),false);this.element.addEventListener('mousedown',this._mouseDown.bind(this),false);this._glyphElement=Icon.create('','toolbar-glyph hidden');this.element.appendChild(this._glyphElement);this._textElement=this.element.createChild('div','toolbar-text hidden');this.setTitle(title);if(glyph){this.setGlyph(glyph);}
this.setText(text||'');this._title='';}
setText(text){if(this._text===text){return;}
this._textElement.textContent=text;this._textElement.classList.toggle('hidden',!text);this._text=text;}
setGlyph(glyph){if(this._glyph===glyph){return;}
this._glyphElement.setIconType(glyph);this._glyphElement.classList.toggle('hidden',!glyph);this.element.classList.toggle('toolbar-has-glyph',!!glyph);this._glyph=glyph;}
setBackgroundImage(iconURL){this.element.style.backgroundImage='url('+iconURL+')';}
setSecondary(){this.element.classList.add('toolbar-button-secondary');}
setDarkText(){this.element.classList.add('dark-text');}
turnIntoSelect(width){this.element.classList.add('toolbar-has-dropdown');const dropdownArrowIcon=Icon.create('smallicon-triangle-down','toolbar-dropdown-arrow');this.element.appendChild(dropdownArrowIcon);if(width){this.element.style.width=width+'px';}}
_clicked(event){if(!this._enabled){return;}
this.dispatchEventToListeners(ToolbarButton.Events.Click,event);event.consume();}
_mouseDown(event){if(!this._enabled){return;}
this.dispatchEventToListeners(ToolbarButton.Events.MouseDown,event);}}
ToolbarButton.Events={Click:Symbol('Click'),MouseDown:Symbol('MouseDown')};class ToolbarInput extends ToolbarItem{constructor(placeholder,accessiblePlaceholder,growFactor,shrinkFactor,tooltip,completions){super(createElementWithClass('div','toolbar-input'));const internalPromptElement=this.element.createChild('div','toolbar-input-prompt');internalPromptElement.addEventListener('focus',()=>this.element.classList.add('focused'));internalPromptElement.addEventListener('blur',()=>this.element.classList.remove('focused'));markAsHidden(internalPromptElement);this._prompt=new TextPrompt();this._proxyElement=this._prompt.attach(internalPromptElement);this._proxyElement.classList.add('toolbar-prompt-proxy');this._proxyElement.addEventListener('keydown',event=>this._onKeydownCallback(event));this._prompt.initialize(completions||(()=>Promise.resolve([])),' ');if(tooltip){this._prompt.setTitle(tooltip);}
this._prompt.setPlaceholder(placeholder,accessiblePlaceholder);this._prompt.addEventListener(Events$4.TextChanged,this._onChangeCallback.bind(this));if(growFactor){this.element.style.flexGrow=growFactor;}
if(shrinkFactor){this.element.style.flexShrink=shrinkFactor;}
const clearButton=this.element.createChild('div','toolbar-input-clear-button');clearButton.appendChild(Icon.create('mediumicon-gray-cross-hover','search-cancel-button'));clearButton.addEventListener('click',()=>{this.setValue('',true);this._prompt.focus();});this._updateEmptyStyles();}
_applyEnabledState(enabled){this._prompt.setEnabled(enabled);}
setValue(value,notify){this._prompt.setText(value);if(notify){this._onChangeCallback();}
this._updateEmptyStyles();}
value(){return this._prompt.textWithCurrentSuggestion();}
_onKeydownCallback(event){if(!isEscKey(event)||!this._prompt.text()){return;}
this.setValue('',true);event.consume(true);}
_onChangeCallback(){this._updateEmptyStyles();this.dispatchEventToListeners(ToolbarInput.Event.TextChanged,this._prompt.text());}
_updateEmptyStyles(){this.element.classList.toggle('toolbar-input-empty',!this._prompt.text());}}
ToolbarInput.Event={TextChanged:Symbol('TextChanged')};class ToolbarToggle extends ToolbarButton{constructor(title,glyph,toggledGlyph){super(title,glyph,'');this._toggled=false;this._untoggledGlyph=glyph;this._toggledGlyph=toggledGlyph;this.element.classList.add('toolbar-state-off');setPressed(this.element,false);}
toggled(){return this._toggled;}
setToggled(toggled){if(this._toggled===toggled){return;}
this._toggled=toggled;this.element.classList.toggle('toolbar-state-on',toggled);this.element.classList.toggle('toolbar-state-off',!toggled);setPressed(this.element,toggled);if(this._toggledGlyph&&this._untoggledGlyph){this.setGlyph(toggled?this._toggledGlyph:this._untoggledGlyph);}}
setDefaultWithRedColor(withRedColor){this.element.classList.toggle('toolbar-default-with-red-color',withRedColor);}
setToggleWithRedColor(toggleWithRedColor){this.element.classList.toggle('toolbar-toggle-with-red-color',toggleWithRedColor);}}
class ToolbarMenuButton extends ToolbarButton{constructor(contextMenuHandler,useSoftMenu){super('','largeicon-menu');this._contextMenuHandler=contextMenuHandler;this._useSoftMenu=!!useSoftMenu;markAsMenuButton(this.element);}
_mouseDown(event){if(event.buttons!==1){super._mouseDown(event);return;}
if(!this._triggerTimeout){this._triggerTimeout=setTimeout(this._trigger.bind(this,event),200);}}
_trigger(event){delete this._triggerTimeout;if(this._lastTriggerTime&&Date.now()-this._lastTriggerTime<300){return;}
const contextMenu=new ContextMenu(event,this._useSoftMenu,this.element.totalOffsetLeft(),this.element.totalOffsetTop()+this.element.offsetHeight);this._contextMenuHandler(contextMenu);contextMenu.show();this._lastTriggerTime=Date.now();}
_clicked(event){if(this._triggerTimeout){clearTimeout(this._triggerTimeout);}
this._trigger(event);}}
class ToolbarSettingToggle extends ToolbarToggle{constructor(setting,glyph,title){super(title,glyph);this._defaultTitle=title;this._setting=setting;this._settingChanged();this._setting.addChangeListener(this._settingChanged,this);}
_settingChanged(){const toggled=this._setting.get();this.setToggled(toggled);this.setTitle(this._defaultTitle);}
_clicked(event){this._setting.set(!this.toggled());super._clicked(event);}}
class ToolbarSeparator extends ToolbarItem{constructor(spacer){super(createElementWithClass('div',spacer?'toolbar-spacer':'toolbar-divider'));}}
class Provider{item(){}}
class ItemsProvider{toolbarItems(){}}
class ToolbarComboBox extends ToolbarItem{constructor(changeHandler,title,className){super(createElementWithClass('span','toolbar-select-container'));this._selectElement=this.element.createChild('select','toolbar-item');const dropdownArrowIcon=Icon.create('smallicon-triangle-down','toolbar-dropdown-arrow');this.element.appendChild(dropdownArrowIcon);if(changeHandler){this._selectElement.addEventListener('change',changeHandler,false);}
setAccessibleName(this._selectElement,title);super.setTitle(title);if(className){this._selectElement.classList.add(className);}}
selectElement(){return(this._selectElement);}
size(){return this._selectElement.childElementCount;}
options(){return Array.prototype.slice.call(this._selectElement.children,0);}
addOption(option){this._selectElement.appendChild(option);}
createOption(label,value){const option=this._selectElement.createChild('option');option.text=label;if(typeof value!=='undefined'){option.value=value;}
return option;}
_applyEnabledState(enabled){super._applyEnabledState(enabled);this._selectElement.disabled=!enabled;}
removeOption(option){this._selectElement.removeChild(option);}
removeOptions(){this._selectElement.removeChildren();}
selectedOption(){if(this._selectElement.selectedIndex>=0){return this._selectElement[this._selectElement.selectedIndex];}
return null;}
select(option){this._selectElement.selectedIndex=Array.prototype.indexOf.call((this._selectElement),option);}
setSelectedIndex(index){this._selectElement.selectedIndex=index;}
selectedIndex(){return this._selectElement.selectedIndex;}
setMaxWidth(width){this._selectElement.style.maxWidth=width+'px';}
setMinWidth(width){this._selectElement.style.minWidth=width+'px';}}
class ToolbarSettingComboBox extends ToolbarComboBox{constructor(options,setting,accessibleName){super(null,accessibleName);this._options=options;this._setting=setting;this._selectElement.addEventListener('change',this._valueChanged.bind(this),false);this.setOptions(options);setting.addChangeListener(this._settingChanged,this);}
setOptions(options){this._options=options;this._selectElement.removeChildren();for(let i=0;i<options.length;++i){const dataOption=options[i];const option=this.createOption(dataOption.label,dataOption.value);this._selectElement.appendChild(option);if(this._setting.get()===dataOption.value){this.setSelectedIndex(i);}}}
value(){return this._options[this.selectedIndex()].value;}
_settingChanged(){if(this._muteSettingListener){return;}
const value=this._setting.get();for(let i=0;i<this._options.length;++i){if(value===this._options[i].value){this.setSelectedIndex(i);break;}}}
_valueChanged(event){const option=this._options[this.selectedIndex()];this._muteSettingListener=true;this._setting.set(option.value);this._muteSettingListener=false;}}
class ToolbarCheckbox extends ToolbarItem{constructor(text,tooltip,listener){super(CheckboxLabel.create(text));this.element.classList.add('checkbox');this.inputElement=this.element.checkboxElement;if(tooltip){Tooltip.install(this.element,tooltip,undefined,{anchorTooltipAtElement:true,});}
if(listener){this.inputElement.addEventListener('click',listener,false);}}
checked(){return this.inputElement.checked;}
setChecked(value){this.inputElement.checked=value;}
_applyEnabledState(enabled){super._applyEnabledState(enabled);this.inputElement.disabled=!enabled;}}
class ToolbarSettingCheckbox extends ToolbarCheckbox{constructor(setting,tooltip,alternateTitle){super(alternateTitle||setting.title()||'',tooltip);bindCheckbox(this.inputElement,setting);}}
var Toolbar$1=Object.freeze({__proto__:null,Toolbar:Toolbar,ToolbarButtonOptions:ToolbarButtonOptions,ToolbarItem:ToolbarItem,ToolbarText:ToolbarText,ToolbarButton:ToolbarButton,ToolbarInput:ToolbarInput,ToolbarToggle:ToolbarToggle,ToolbarMenuButton:ToolbarMenuButton,ToolbarSettingToggle:ToolbarSettingToggle,ToolbarSeparator:ToolbarSeparator,Provider:Provider,ItemsProvider:ItemsProvider,ToolbarComboBox:ToolbarComboBox,ToolbarSettingComboBox:ToolbarSettingComboBox,ToolbarCheckbox:ToolbarCheckbox,ToolbarSettingCheckbox:ToolbarSettingCheckbox});class SplitWidget extends Widget{constructor(isVertical,secondIsSidebar,settingName,defaultSidebarWidth,defaultSidebarHeight,constraintsInDip){super(true);this.element.classList.add('split-widget');this.registerRequiredCSS('ui/splitWidget.css');this.contentElement.classList.add('shadow-split-widget');this._sidebarElement=this.contentElement.createChild('div','shadow-split-widget-contents shadow-split-widget-sidebar vbox');this._mainElement=this.contentElement.createChild('div','shadow-split-widget-contents shadow-split-widget-main vbox');this._mainElement.createChild('slot').name='insertion-point-main';this._sidebarElement.createChild('slot').name='insertion-point-sidebar';this._resizerElement=this.contentElement.createChild('div','shadow-split-widget-resizer');this._resizerElementSize=null;this._resizerWidget=new SimpleResizerWidget();this._resizerWidget.setEnabled(true);this._resizerWidget.addEventListener(Events$2.ResizeStart,this._onResizeStart,this);this._resizerWidget.addEventListener(Events$2.ResizeUpdate,this._onResizeUpdate,this);this._resizerWidget.addEventListener(Events$2.ResizeEnd,this._onResizeEnd,this);this._defaultSidebarWidth=defaultSidebarWidth||200;this._defaultSidebarHeight=defaultSidebarHeight||this._defaultSidebarWidth;this._constraintsInDip=!!constraintsInDip;this._resizeStartSizeDIP=0;this._setting=settingName?Settings.Settings.instance().createSetting(settingName,{}):null;this._totalSizeCSS=0;this._totalSizeOtherDimensionCSS=0;this._mainWidget=null;this._sidebarWidget=null;this._animationFrameHandle=0;this._animationCallback=null;this._showHideSidebarButtonTitle='';this._showHideSidebarButton=null;this._isVertical=false;this._sidebarMinimized=false;this._detaching=false;this._sidebarSizeDIP=-1;this._savedSidebarSizeDIP=this._sidebarSizeDIP;this._secondIsSidebar=false;this._shouldSaveShowMode=false;this._savedVerticalMainSize=null;this._savedHorizontalMainSize=null;this.setSecondIsSidebar(secondIsSidebar);this._innerSetVertical(isVertical);this._showMode=ShowMode.Both;this._savedShowMode=this._showMode;this.installResizer(this._resizerElement);}
isVertical(){return this._isVertical;}
setVertical(isVertical){if(this._isVertical===isVertical){return;}
this._innerSetVertical(isVertical);if(this.isShowing()){this._updateLayout();}}
_innerSetVertical(isVertical){this.contentElement.classList.toggle('vbox',!isVertical);this.contentElement.classList.toggle('hbox',isVertical);this._isVertical=isVertical;this._resizerElementSize=null;this._sidebarSizeDIP=-1;this._restoreSidebarSizeFromSettings();if(this._shouldSaveShowMode){this._restoreAndApplyShowModeFromSettings();}
this._updateShowHideSidebarButton();this._resizerWidget.setVertical(!isVertical);this.invalidateConstraints();}
_updateLayout(animate){this._totalSizeCSS=0;this._totalSizeOtherDimensionCSS=0;this._mainElement.style.removeProperty('width');this._mainElement.style.removeProperty('height');this._sidebarElement.style.removeProperty('width');this._sidebarElement.style.removeProperty('height');this._innerSetSidebarSizeDIP(this._preferredSidebarSizeDIP(),!!animate);}
setMainWidget(widget){if(this._mainWidget===widget){return;}
this.suspendInvalidations();if(this._mainWidget){this._mainWidget.detach();}
this._mainWidget=widget;if(widget){widget.element.slot='insertion-point-main';if(this._showMode===ShowMode.OnlyMain||this._showMode===ShowMode.Both){widget.show(this.element);}}
this.resumeInvalidations();}
setSidebarWidget(widget){if(this._sidebarWidget===widget){return;}
this.suspendInvalidations();if(this._sidebarWidget){this._sidebarWidget.detach();}
this._sidebarWidget=widget;if(widget){widget.element.slot='insertion-point-sidebar';if(this._showMode===ShowMode.OnlySidebar||this._showMode===ShowMode.Both){widget.show(this.element);}}
this.resumeInvalidations();}
mainWidget(){return this._mainWidget;}
sidebarWidget(){return this._sidebarWidget;}
childWasDetached(widget){if(this._detaching){return;}
if(this._mainWidget===widget){this._mainWidget=null;}
if(this._sidebarWidget===widget){this._sidebarWidget=null;}
this.invalidateConstraints();}
isSidebarSecond(){return this._secondIsSidebar;}
enableShowModeSaving(){this._shouldSaveShowMode=true;this._restoreAndApplyShowModeFromSettings();}
showMode(){return this._showMode;}
setSecondIsSidebar(secondIsSidebar){if(secondIsSidebar===this._secondIsSidebar){return;}
this._secondIsSidebar=secondIsSidebar;if(!this._mainWidget||!this._mainWidget.shouldHideOnDetach()){if(secondIsSidebar){this.contentElement.insertBefore(this._mainElement,this._sidebarElement);}else{this.contentElement.insertBefore(this._mainElement,this._resizerElement);}}else if(!this._sidebarWidget||!this._sidebarWidget.shouldHideOnDetach()){if(secondIsSidebar){this.contentElement.insertBefore(this._sidebarElement,this._resizerElement);}else{this.contentElement.insertBefore(this._sidebarElement,this._mainElement);}}else{console.error('Could not swap split widget side. Both children widgets contain iframes.');this._secondIsSidebar=!secondIsSidebar;}}
sidebarSide(){if(this._showMode!==ShowMode.Both){return null;}
return this._isVertical?(this._secondIsSidebar?'right':'left'):(this._secondIsSidebar?'bottom':'top');}
resizerElement(){return this._resizerElement;}
hideMain(animate){this._showOnly(this._sidebarWidget,this._mainWidget,this._sidebarElement,this._mainElement,animate);this._updateShowMode(ShowMode.OnlySidebar);}
hideSidebar(animate){this._showOnly(this._mainWidget,this._sidebarWidget,this._mainElement,this._sidebarElement,animate);this._updateShowMode(ShowMode.OnlyMain);}
setSidebarMinimized(minimized){this._sidebarMinimized=minimized;this.invalidateConstraints();}
isSidebarMinimized(){return this._sidebarMinimized;}
_showOnly(sideToShow,sideToHide,shadowToShow,shadowToHide,animate){this._cancelAnimation();function callback(){if(sideToShow){if(sideToShow===this._mainWidget){this._mainWidget.show(this.element,this._sidebarWidget?this._sidebarWidget.element:null);}else{this._sidebarWidget.show(this.element);}}
if(sideToHide){this._detaching=true;sideToHide.detach();this._detaching=false;}
this._resizerElement.classList.add('hidden');shadowToShow.classList.remove('hidden');shadowToShow.classList.add('maximized');shadowToHide.classList.add('hidden');shadowToHide.classList.remove('maximized');this._removeAllLayoutProperties();this.doResize();this._showFinishedForTest();}
if(animate){this._animate(true,callback.bind(this));}else{callback.call(this);}
this._sidebarSizeDIP=-1;this.setResizable(false);}
_showFinishedForTest(){}
_removeAllLayoutProperties(){this._sidebarElement.style.removeProperty('flexBasis');this._mainElement.style.removeProperty('width');this._mainElement.style.removeProperty('height');this._sidebarElement.style.removeProperty('width');this._sidebarElement.style.removeProperty('height');this._resizerElement.style.removeProperty('left');this._resizerElement.style.removeProperty('right');this._resizerElement.style.removeProperty('top');this._resizerElement.style.removeProperty('bottom');this._resizerElement.style.removeProperty('margin-left');this._resizerElement.style.removeProperty('margin-right');this._resizerElement.style.removeProperty('margin-top');this._resizerElement.style.removeProperty('margin-bottom');}
showBoth(animate){if(this._showMode===ShowMode.Both){animate=false;}
this._cancelAnimation();this._mainElement.classList.remove('maximized','hidden');this._sidebarElement.classList.remove('maximized','hidden');this._resizerElement.classList.remove('hidden');this.setResizable(true);this.suspendInvalidations();if(this._sidebarWidget){this._sidebarWidget.show(this.element);}
if(this._mainWidget){this._mainWidget.show(this.element,this._sidebarWidget?this._sidebarWidget.element:null);}
this.resumeInvalidations();this.setSecondIsSidebar(this._secondIsSidebar);this._sidebarSizeDIP=-1;this._updateShowMode(ShowMode.Both);this._updateLayout(animate);}
setResizable(resizable){this._resizerWidget.setEnabled(resizable);}
isResizable(){return this._resizerWidget.isEnabled();}
setSidebarSize(size){const sizeDIP=ZoomManager.instance().cssToDIP(size);this._savedSidebarSizeDIP=sizeDIP;this._saveSetting();this._innerSetSidebarSizeDIP(sizeDIP,false,true);}
sidebarSize(){const sizeDIP=Math.max(0,this._sidebarSizeDIP);return ZoomManager.instance().dipToCSS(sizeDIP);}
_totalSizeDIP(){if(!this._totalSizeCSS){this._totalSizeCSS=this._isVertical?this.contentElement.offsetWidth:this.contentElement.offsetHeight;this._totalSizeOtherDimensionCSS=this._isVertical?this.contentElement.offsetHeight:this.contentElement.offsetWidth;}
return ZoomManager.instance().cssToDIP(this._totalSizeCSS);}
_updateShowMode(showMode){this._showMode=showMode;this._saveShowModeToSettings();this._updateShowHideSidebarButton();this.dispatchEventToListeners(Events$6.ShowModeChanged,showMode);this.invalidateConstraints();}
_innerSetSidebarSizeDIP(sizeDIP,animate,userAction){if(this._showMode!==ShowMode.Both||!this.isShowing()){return;}
sizeDIP=this._applyConstraints(sizeDIP,userAction);if(this._sidebarSizeDIP===sizeDIP){return;}
if(!this._resizerElementSize){this._resizerElementSize=this._isVertical?this._resizerElement.offsetWidth:this._resizerElement.offsetHeight;}
this._removeAllLayoutProperties();const roundSizeCSS=Math.round(ZoomManager.instance().dipToCSS(sizeDIP));const sidebarSizeValue=roundSizeCSS+'px';const mainSizeValue=(this._totalSizeCSS-roundSizeCSS)+'px';this._sidebarElement.style.flexBasis=sidebarSizeValue;if(this._isVertical){this._sidebarElement.style.width=sidebarSizeValue;this._mainElement.style.width=mainSizeValue;this._sidebarElement.style.height=this._totalSizeOtherDimensionCSS+'px';this._mainElement.style.height=this._totalSizeOtherDimensionCSS+'px';}else{this._sidebarElement.style.height=sidebarSizeValue;this._mainElement.style.height=mainSizeValue;this._sidebarElement.style.width=this._totalSizeOtherDimensionCSS+'px';this._mainElement.style.width=this._totalSizeOtherDimensionCSS+'px';}
if(this._isVertical){if(this._secondIsSidebar){this._resizerElement.style.right=sidebarSizeValue;this._resizerElement.style.marginRight=-this._resizerElementSize/2+'px';}else{this._resizerElement.style.left=sidebarSizeValue;this._resizerElement.style.marginLeft=-this._resizerElementSize/2+'px';}}else{if(this._secondIsSidebar){this._resizerElement.style.bottom=sidebarSizeValue;this._resizerElement.style.marginBottom=-this._resizerElementSize/2+'px';}else{this._resizerElement.style.top=sidebarSizeValue;this._resizerElement.style.marginTop=-this._resizerElementSize/2+'px';}}
this._sidebarSizeDIP=sizeDIP;if(animate){this._animate(false);}else{this.doResize();this.dispatchEventToListeners(Events$6.SidebarSizeChanged,this.sidebarSize());}}
_animate(reverse,callback){const animationTime=50;this._animationCallback=callback||null;let animatedMarginPropertyName;if(this._isVertical){animatedMarginPropertyName=this._secondIsSidebar?'margin-right':'margin-left';}else{animatedMarginPropertyName=this._secondIsSidebar?'margin-bottom':'margin-top';}
const marginFrom=reverse?'0':'-'+ZoomManager.instance().dipToCSS(this._sidebarSizeDIP)+'px';const marginTo=reverse?'-'+ZoomManager.instance().dipToCSS(this._sidebarSizeDIP)+'px':'0';this.contentElement.style.setProperty(animatedMarginPropertyName,marginFrom);if(!reverse){suppressUnused(this._mainElement.offsetWidth);suppressUnused(this._sidebarElement.offsetWidth);}
if(!reverse){this._sidebarWidget.doResize();}
this.contentElement.style.setProperty('transition',animatedMarginPropertyName+' '+animationTime+'ms linear');const boundAnimationFrame=animationFrame.bind(this);let startTime;function animationFrame(){this._animationFrameHandle=0;if(!startTime){this.contentElement.style.setProperty(animatedMarginPropertyName,marginTo);startTime=window.performance.now();}else if(window.performance.now()<startTime+animationTime){if(this._mainWidget){this._mainWidget.doResize();}}else{this._cancelAnimation();if(this._mainWidget){this._mainWidget.doResize();}
this.dispatchEventToListeners(Events$6.SidebarSizeChanged,this.sidebarSize());return;}
this._animationFrameHandle=this.contentElement.window().requestAnimationFrame(boundAnimationFrame);}
this._animationFrameHandle=this.contentElement.window().requestAnimationFrame(boundAnimationFrame);}
_cancelAnimation(){this.contentElement.style.removeProperty('margin-top');this.contentElement.style.removeProperty('margin-right');this.contentElement.style.removeProperty('margin-bottom');this.contentElement.style.removeProperty('margin-left');this.contentElement.style.removeProperty('transition');if(this._animationFrameHandle){this.contentElement.window().cancelAnimationFrame(this._animationFrameHandle);this._animationFrameHandle=0;}
if(this._animationCallback){this._animationCallback();this._animationCallback=null;}}
_applyConstraints(sidebarSize,userAction){const totalSize=this._totalSizeDIP();const zoomFactor=this._constraintsInDip?1:ZoomManager.instance().zoomFactor();let constraints=this._sidebarWidget?this._sidebarWidget.constraints():new Constraints();let minSidebarSize=this.isVertical()?constraints.minimum.width:constraints.minimum.height;if(!minSidebarSize){minSidebarSize=MinPadding;}
minSidebarSize*=zoomFactor;if(this._sidebarMinimized){sidebarSize=minSidebarSize;}
let preferredSidebarSize=this.isVertical()?constraints.preferred.width:constraints.preferred.height;if(!preferredSidebarSize){preferredSidebarSize=MinPadding;}
preferredSidebarSize*=zoomFactor;if(sidebarSize<preferredSidebarSize){preferredSidebarSize=Math.max(sidebarSize,minSidebarSize);}
preferredSidebarSize+=zoomFactor;constraints=this._mainWidget?this._mainWidget.constraints():new Constraints();let minMainSize=this.isVertical()?constraints.minimum.width:constraints.minimum.height;if(!minMainSize){minMainSize=MinPadding;}
minMainSize*=zoomFactor;let preferredMainSize=this.isVertical()?constraints.preferred.width:constraints.preferred.height;if(!preferredMainSize){preferredMainSize=MinPadding;}
preferredMainSize*=zoomFactor;const savedMainSize=this.isVertical()?this._savedVerticalMainSize:this._savedHorizontalMainSize;if(savedMainSize!==null){preferredMainSize=Math.min(preferredMainSize,savedMainSize*zoomFactor);}
if(userAction){preferredMainSize=minMainSize;}
const totalPreferred=preferredMainSize+preferredSidebarSize;if(totalPreferred<=totalSize){return NumberUtilities.clamp(sidebarSize,preferredSidebarSize,totalSize-preferredMainSize);}
if(minMainSize+minSidebarSize<=totalSize){const delta=totalPreferred-totalSize;const sidebarDelta=delta*preferredSidebarSize/totalPreferred;sidebarSize=preferredSidebarSize-sidebarDelta;return NumberUtilities.clamp(sidebarSize,minSidebarSize,totalSize-minMainSize);}
return Math.max(0,totalSize-minMainSize);}
wasShown(){this._forceUpdateLayout();ZoomManager.instance().addEventListener(Events$5.ZoomChanged,this._onZoomChanged,this);}
willHide(){ZoomManager.instance().removeEventListener(Events$5.ZoomChanged,this._onZoomChanged,this);}
onResize(){this._updateLayout();}
onLayout(){this._updateLayout();}
calculateConstraints(){if(this._showMode===ShowMode.OnlyMain){return this._mainWidget?this._mainWidget.constraints():new Constraints();}
if(this._showMode===ShowMode.OnlySidebar){return this._sidebarWidget?this._sidebarWidget.constraints():new Constraints();}
let mainConstraints=this._mainWidget?this._mainWidget.constraints():new Constraints();let sidebarConstraints=this._sidebarWidget?this._sidebarWidget.constraints():new Constraints();const min=MinPadding;if(this._isVertical){mainConstraints=mainConstraints.widthToMax(min).addWidth(1);sidebarConstraints=sidebarConstraints.widthToMax(min);return mainConstraints.addWidth(sidebarConstraints).heightToMax(sidebarConstraints);}
mainConstraints=mainConstraints.heightToMax(min).addHeight(1);sidebarConstraints=sidebarConstraints.heightToMax(min);return mainConstraints.widthToMax(sidebarConstraints).addHeight(sidebarConstraints);}
_onResizeStart(event){this._resizeStartSizeDIP=this._sidebarSizeDIP;}
_onResizeUpdate(event){const offset=event.data.currentPosition-event.data.startPosition;const offsetDIP=ZoomManager.instance().cssToDIP(offset);const newSizeDIP=this._secondIsSidebar?this._resizeStartSizeDIP-offsetDIP:this._resizeStartSizeDIP+offsetDIP;const constrainedSizeDIP=this._applyConstraints(newSizeDIP,true);this._savedSidebarSizeDIP=constrainedSizeDIP;this._saveSetting();this._innerSetSidebarSizeDIP(constrainedSizeDIP,false,true);if(this.isVertical()){this._savedVerticalMainSize=this._totalSizeDIP()-this._sidebarSizeDIP;}else{this._savedHorizontalMainSize=this._totalSizeDIP()-this._sidebarSizeDIP;}}
_onResizeEnd(event){this._resizeStartSizeDIP=0;}
hideDefaultResizer(noSplitter){this.uninstallResizer(this._resizerElement);this._sidebarElement.classList.toggle('no-default-splitter',!!noSplitter);}
installResizer(resizerElement){this._resizerWidget.addElement(resizerElement);}
uninstallResizer(resizerElement){this._resizerWidget.removeElement(resizerElement);}
hasCustomResizer(){const elements=this._resizerWidget.elements();return elements.length>1||(elements.length===1&&elements[0]!==this._resizerElement);}
toggleResizer(resizer,on){if(on){this.installResizer(resizer);}else{this.uninstallResizer(resizer);}}
_settingForOrientation(){const state=this._setting?this._setting.get():{};return this._isVertical?state.vertical:state.horizontal;}
_preferredSidebarSizeDIP(){let size=this._savedSidebarSizeDIP;if(!size){size=this._isVertical?this._defaultSidebarWidth:this._defaultSidebarHeight;if(0<size&&size<1){size*=this._totalSizeDIP();}}
return size;}
_restoreSidebarSizeFromSettings(){const settingForOrientation=this._settingForOrientation();this._savedSidebarSizeDIP=settingForOrientation?settingForOrientation.size:0;}
_restoreAndApplyShowModeFromSettings(){const orientationState=this._settingForOrientation();this._savedShowMode=orientationState&&orientationState.showMode?orientationState.showMode:this._showMode;this._showMode=this._savedShowMode;switch(this._savedShowMode){case ShowMode.Both:this.showBoth();break;case ShowMode.OnlyMain:this.hideSidebar();break;case ShowMode.OnlySidebar:this.hideMain();break;}}
_saveShowModeToSettings(){this._savedShowMode=this._showMode;this._saveSetting();}
_saveSetting(){if(!this._setting){return;}
const state=this._setting.get();const orientationState=(this._isVertical?state.vertical:state.horizontal)||{};orientationState.size=this._savedSidebarSizeDIP;if(this._shouldSaveShowMode){orientationState.showMode=this._savedShowMode;}
if(this._isVertical){state.vertical=orientationState;}else{state.horizontal=orientationState;}
this._setting.set(state);}
_forceUpdateLayout(){this._sidebarSizeDIP=-1;this._updateLayout();}
_onZoomChanged(event){this._forceUpdateLayout();}
createShowHideSidebarButton(title){this._showHideSidebarButtonTitle=title;this._showHideSidebarButton=new ToolbarButton('','');this._showHideSidebarButton.addEventListener(ToolbarButton.Events.Click,buttonClicked,this);this._updateShowHideSidebarButton();function buttonClicked(event){if(this._showMode!==ShowMode.Both){this.showBoth(true);}else{this.hideSidebar(true);}}
return this._showHideSidebarButton;}
_updateShowHideSidebarButton(){if(!this._showHideSidebarButton){return;}
const sidebarHidden=this._showMode===ShowMode.OnlyMain;let glyph='';if(sidebarHidden){glyph=this.isVertical()?(this.isSidebarSecond()?'largeicon-show-right-sidebar':'largeicon-show-left-sidebar'):(this.isSidebarSecond()?'largeicon-show-bottom-sidebar':'largeicon-show-top-sidebar');}else{glyph=this.isVertical()?(this.isSidebarSecond()?'largeicon-hide-right-sidebar':'largeicon-hide-left-sidebar'):(this.isSidebarSecond()?'largeicon-hide-bottom-sidebar':'largeicon-hide-top-sidebar');}
this._showHideSidebarButton.setGlyph(glyph);this._showHideSidebarButton.setTitle(sidebarHidden?UIString.UIString('Show %s',this._showHideSidebarButtonTitle):UIString.UIString('Hide %s',this._showHideSidebarButtonTitle));}}
const ShowMode={Both:'Both',OnlyMain:'OnlyMain',OnlySidebar:'OnlySidebar'};const Events$6={SidebarSizeChanged:Symbol('SidebarSizeChanged'),ShowModeChanged:Symbol('ShowModeChanged')};const MinPadding=20;let SettingForOrientation;var SplitWidget$1=Object.freeze({__proto__:null,SplitWidget:SplitWidget,ShowMode:ShowMode,Events:Events$6,SettingForOrientation:SettingForOrientation});class Dialog extends GlassPane{constructor(){super();this.registerRequiredCSS('ui/dialog.css');this.contentElement.tabIndex=0;this.contentElement.addEventListener('focus',()=>this.widget().focus(),false);this.widget().setDefaultFocusedElement(this.contentElement);this.setPointerEventsBehavior(PointerEventsBehavior.BlockedByGlassPane);this.setOutsideClickCallback(event=>{this.hide();event.consume(true);});markAsModalDialog(this.contentElement);this._tabIndexBehavior=OutsideTabIndexBehavior.DisableAllOutsideTabIndex;this._tabIndexMap=new Map();this._focusRestorer=null;this._closeOnEscape=true;this._targetDocument;this._targetDocumentKeyDownHandler=this._onKeyDown.bind(this);}
static hasInstance(){return!!Dialog._instance;}
show(where){const document=(where instanceof Document?where:(where||self.UI.inspectorView.element).ownerDocument);this._targetDocument=document;this._targetDocument.addEventListener('keydown',this._targetDocumentKeyDownHandler,true);if(Dialog._instance){Dialog._instance.hide();}
Dialog._instance=this;this._disableTabIndexOnElements(document);super.show(document);this._focusRestorer=new WidgetFocusRestorer(this.widget());}
hide(){this._focusRestorer.restore();super.hide();if(this._targetDocument){this._targetDocument.removeEventListener('keydown',this._targetDocumentKeyDownHandler,true);}
this._restoreTabIndexOnElements();delete Dialog._instance;}
setCloseOnEscape(close){this._closeOnEscape=close;}
addCloseButton(){const closeButton=this.contentElement.createChild('div','dialog-close-button','dt-close-button');closeButton.gray=true;closeButton.addEventListener('click',()=>this.hide(),false);}
setOutsideTabIndexBehavior(tabIndexBehavior){this._tabIndexBehavior=tabIndexBehavior;}
_disableTabIndexOnElements(document){if(this._tabIndexBehavior===OutsideTabIndexBehavior.PreserveTabIndex){return;}
let exclusionSet=(null);if(this._tabIndexBehavior===OutsideTabIndexBehavior.PreserveMainViewTabIndex){exclusionSet=this._getMainWidgetTabIndexElements(self.UI.inspectorView.ownerSplit());}
this._tabIndexMap.clear();for(let node=document;node;node=node.traverseNextNode(document)){if(node instanceof HTMLElement){const element=(node);const tabIndex=element.tabIndex;if(tabIndex>=0&&(!exclusionSet||!exclusionSet.has(element))){this._tabIndexMap.set(element,tabIndex);element.tabIndex=-1;}}}}
_getMainWidgetTabIndexElements(splitWidget){const elementSet=(new Set());if(!splitWidget){return elementSet;}
const mainWidget=splitWidget.mainWidget();if(!mainWidget||!mainWidget.element){return elementSet;}
for(let node=mainWidget.element;node;node=node.traverseNextNode(mainWidget.element)){if(!(node instanceof HTMLElement)){continue;}
const element=(node);const tabIndex=element.tabIndex;if(tabIndex<0){continue;}
elementSet.add(element);}
return elementSet;}
_restoreTabIndexOnElements(){for(const element of this._tabIndexMap.keys()){element.tabIndex=(this._tabIndexMap.get(element));}
this._tabIndexMap.clear();}
_onKeyDown(event){if(this._closeOnEscape&&event.keyCode===Keys.Esc.code&&KeyboardShortcut.hasNoModifiers(event)){event.consume(true);this.hide();}}}
const OutsideTabIndexBehavior={DisableAllOutsideTabIndex:Symbol('DisableAllTabIndex'),PreserveMainViewTabIndex:Symbol('PreserveMainViewTabIndex'),PreserveTabIndex:Symbol('PreserveTabIndex')};var Dialog$1=Object.freeze({__proto__:null,Dialog:Dialog,OutsideTabIndexBehavior:OutsideTabIndexBehavior});class InplaceEditor{static startEditing(element,config){if(!InplaceEditor._defaultInstance){InplaceEditor._defaultInstance=new InplaceEditor();}
return InplaceEditor._defaultInstance.startEditing(element,config);}
editorContent(editingContext){const element=editingContext.element;if(element.tagName==='INPUT'&&element.type==='text'){return element.value;}
return element.textContent;}
setUpEditor(editingContext){const element=editingContext.element;element.classList.add('editing');element.setAttribute('contenteditable','plaintext-only');const oldRole=element.getAttribute('role');markAsTextBox(element);editingContext.oldRole=oldRole;const oldTabIndex=element.getAttribute('tabIndex');if(typeof oldTabIndex!=='number'||oldTabIndex<0){element.tabIndex=0;}
this._focusRestorer=new ElementFocusRestorer(element);editingContext.oldTabIndex=oldTabIndex;}
closeEditor(editingContext){const element=editingContext.element;element.classList.remove('editing');element.removeAttribute('contenteditable');if(typeof editingContext.oldRole!=='string'){element.removeAttribute('role');}else{element.role=editingContext.oldRole;}
if(typeof editingContext.oldTabIndex!=='number'){element.removeAttribute('tabIndex');}else{element.tabIndex=editingContext.oldTabIndex;}
element.scrollTop=0;element.scrollLeft=0;}
cancelEditing(editingContext){const element=editingContext.element;if(element.tagName==='INPUT'&&element.type==='text'){element.value=editingContext.oldText;}else{element.textContent=editingContext.oldText;}}
augmentEditingHandle(editingContext,handle){}
startEditing(element,config){if(!markBeingEdited(element,true)){return null;}
config=config||new Config(function(){},function(){});const editingContext={element:element,config:config};const committedCallback=config.commitHandler;const cancelledCallback=config.cancelHandler;const pasteCallback=config.pasteHandler;const context=config.context;let moveDirection='';const self=this;this.setUpEditor(editingContext);editingContext.oldText=this.editorContent(editingContext);function blurEventListener(e){if(config.blurHandler&&!config.blurHandler(element,e)){return;}
editingCommitted.call(element);}
function cleanUpAfterEditing(){markBeingEdited(element,false);element.removeEventListener('blur',blurEventListener,false);element.removeEventListener('keydown',keyDownEventListener,true);if(pasteCallback){element.removeEventListener('paste',pasteEventListener,true);}
if(self._focusRestorer){self._focusRestorer.restore();}
self.closeEditor(editingContext);}
function editingCancelled(){self.cancelEditing(editingContext);cleanUpAfterEditing();cancelledCallback(this,context);}
function editingCommitted(){cleanUpAfterEditing();committedCallback(this,self.editorContent(editingContext),editingContext.oldText,context,moveDirection);}
function defaultFinishHandler(event){if(isEnterKey(event)){return'commit';}
if(event.keyCode===Keys.Esc.code||event.key==='Escape'){return'cancel';}
if(event.key==='Tab'){return'move-'+(event.shiftKey?'backward':'forward');}
return'';}
function handleEditingResult(result,event){if(result==='commit'){editingCommitted.call(element);event.consume(true);}else if(result==='cancel'){editingCancelled.call(element);event.consume(true);}else if(result&&result.startsWith('move-')){moveDirection=result.substring(5);if(event.key==='Tab'){event.consume(true);}
blurEventListener();}}
function pasteEventListener(event){const result=pasteCallback(event);handleEditingResult(result,event);}
function keyDownEventListener(event){let result=defaultFinishHandler(event);if(!result&&config.postKeydownFinishHandler){result=config.postKeydownFinishHandler(event);}
handleEditingResult(result,event);}
element.addEventListener('blur',blurEventListener,false);element.addEventListener('keydown',keyDownEventListener,true);if(pasteCallback){element.addEventListener('paste',pasteEventListener,true);}
const handle={cancel:editingCancelled.bind(element),commit:editingCommitted.bind(element)};this.augmentEditingHandle(editingContext,handle);return handle;}}
class Config{constructor(commitHandler,cancelHandler,context,blurHandler){this.commitHandler=commitHandler;this.cancelHandler=cancelHandler;this.context=context;this.blurHandler=blurHandler;this.pasteHandler;this.postKeydownFinishHandler;}
setPasteHandler(pasteHandler){this.pasteHandler=pasteHandler;}
setPostKeydownFinishHandler(postKeydownFinishHandler){this.postKeydownFinishHandler=postKeydownFinishHandler;}}
let Controller;var InplaceEditor$1=Object.freeze({__proto__:null,InplaceEditor:InplaceEditor,Config:Config,Controller:Controller});class TreeOutline extends ObjectWrapper.ObjectWrapper{constructor(){super();this._createRootElement();this.selectedTreeElement=null;this.expandTreeElementsWhenArrowing=false;this._comparator=null;this.contentElement=this._rootElement._childrenListNode;this.contentElement.addEventListener('keydown',this._treeKeyDown.bind(this),false);this._preventTabOrder=false;this._showSelectionOnKeyboardFocus=false;this.setFocusable(true);this.element=this.contentElement;markAsTree(this.element);}
setShowSelectionOnKeyboardFocus(show,preventTabOrder){this.contentElement.classList.toggle('hide-selection-when-blurred',show);this._preventTabOrder=!!preventTabOrder;if(this._focusable){this.contentElement.tabIndex=!!preventTabOrder?-1:0;}
this._showSelectionOnKeyboardFocus=show;}
_createRootElement(){this._rootElement=new TreeElement();this._rootElement.treeOutline=this;this._rootElement.root=true;this._rootElement.selectable=false;this._rootElement.expanded=true;this._rootElement._childrenListNode.classList.remove('children');}
rootElement(){return this._rootElement;}
firstChild(){return this._rootElement.firstChild();}
_lastDescendent(){let last=this._rootElement.lastChild();while(last.expanded&&last.childCount()){last=last.lastChild();}
return last;}
appendChild(child){this._rootElement.appendChild(child);}
insertChild(child,index){this._rootElement.insertChild(child,index);}
removeChild(child){this._rootElement.removeChild(child);}
removeChildren(){this._rootElement.removeChildren();}
treeElementFromPoint(x,y){const node=this.contentElement.ownerDocument.deepElementFromPoint(x,y);if(!node){return null;}
const listNode=node.enclosingNodeOrSelfWithNodeNameInArray(['ol','li']);if(listNode){return listNode.parentTreeElement||listNode.treeElement;}
return null;}
treeElementFromEvent(event){return event?this.treeElementFromPoint(event.pageX,event.pageY):null;}
setComparator(comparator){this._comparator=comparator;}
setFocusable(focusable){this._focusable=focusable;this.updateFocusable();}
updateFocusable(){if(this._focusable){this.contentElement.tabIndex=(this._preventTabOrder||!!this.selectedTreeElement)?-1:0;if(this.selectedTreeElement){this.selectedTreeElement._setFocusable(true);}}else{this.contentElement.removeAttribute('tabIndex');if(this.selectedTreeElement){this.selectedTreeElement._setFocusable(false);}}}
focus(){if(this.selectedTreeElement){this.selectedTreeElement.listItemElement.focus();}else{this.contentElement.focus();}}
useLightSelectionColor(){this._useLightSelectionColor=true;}
_bindTreeElement(element){if(element.treeOutline){console.error('Binding element for the second time: '+new Error().stack);}
element.treeOutline=this;element.onbind();}
_unbindTreeElement(element){if(!element.treeOutline){console.error('Unbinding element that was not bound: '+new Error().stack);}
element.deselect();element.onunbind();element.treeOutline=null;}
selectPrevious(){let nextSelectedElement=this.selectedTreeElement.traversePreviousTreeElement(true);while(nextSelectedElement&&!nextSelectedElement.selectable){nextSelectedElement=nextSelectedElement.traversePreviousTreeElement(!this.expandTreeElementsWhenArrowing);}
if(!nextSelectedElement){return false;}
nextSelectedElement.select(false,true);return true;}
selectNext(){let nextSelectedElement=this.selectedTreeElement.traverseNextTreeElement(true);while(nextSelectedElement&&!nextSelectedElement.selectable){nextSelectedElement=nextSelectedElement.traverseNextTreeElement(!this.expandTreeElementsWhenArrowing);}
if(!nextSelectedElement){return false;}
nextSelectedElement.select(false,true);return true;}
forceSelect(omitFocus=false,selectedByUser=true){if(this.selectedTreeElement){this.selectedTreeElement.deselect();}
this._selectFirst(omitFocus,selectedByUser);}
_selectFirst(omitFocus=false,selectedByUser=true){let first=this.firstChild();while(first&&!first.selectable){first=first.traverseNextTreeElement(true);}
if(!first){return false;}
first.select(omitFocus,selectedByUser);return true;}
_selectLast(){let last=this._lastDescendent();while(last&&!last.selectable){last=last.traversePreviousTreeElement(true);}
if(!last){return false;}
last.select(false,true);return true;}
_treeKeyDown(event){if(event.shiftKey||event.metaKey||event.ctrlKey||isEditing()){return;}
let handled=false;if(!this.selectedTreeElement){if(event.key==='ArrowUp'&&!event.altKey){handled=this._selectLast();}else if(event.key==='ArrowDown'&&!event.altKey){handled=this._selectFirst();}}else if(event.key==='ArrowUp'&&!event.altKey){handled=this.selectPrevious();}else if(event.key==='ArrowDown'&&!event.altKey){handled=this.selectNext();}else if(event.key==='ArrowLeft'){handled=this.selectedTreeElement.collapseOrAscend(event.altKey);}else if(event.key==='ArrowRight'){if(!this.selectedTreeElement.revealed()){this.selectedTreeElement.reveal();handled=true;}else{handled=this.selectedTreeElement.descendOrExpand(event.altKey);}}else if(event.keyCode===8||event.keyCode===46){handled=this.selectedTreeElement.ondelete();}else if(isEnterKey(event)){handled=this.selectedTreeElement.onenter();}else if(event.keyCode===Keys.Space.code){handled=this.selectedTreeElement.onspace();}else if(event.key==='Home'){handled=this._selectFirst();}else if(event.key==='End'){handled=this._selectLast();}
if(handled){event.consume(true);}}
_deferredScrollIntoView(treeElement,center){if(!this._treeElementToScrollIntoView){this.element.window().requestAnimationFrame(deferredScrollIntoView.bind(this));}
this._treeElementToScrollIntoView=treeElement;this._centerUponScrollIntoView=center;function deferredScrollIntoView(){this._treeElementToScrollIntoView.listItemElement.scrollIntoViewIfNeeded(this._centerUponScrollIntoView);delete this._treeElementToScrollIntoView;delete this._centerUponScrollIntoView;}}}
const Events$7={ElementAttached:Symbol('ElementAttached'),ElementsDetached:Symbol('ElementsDetached'),ElementExpanded:Symbol('ElementExpanded'),ElementCollapsed:Symbol('ElementCollapsed'),ElementSelected:Symbol('ElementSelected')};class TreeOutlineInShadow extends TreeOutline{constructor(){super();this.contentElement.classList.add('tree-outline');this.element=createElement('div');this._shadowRoot=createShadowRootWithCoreStyles(this.element,'ui/treeoutline.css');this._disclosureElement=this._shadowRoot.createChild('div','tree-outline-disclosure');this._disclosureElement.appendChild(this.contentElement);this._renderSelection=true;}
registerRequiredCSS(cssFile){appendStyle(this._shadowRoot,cssFile);}
hideOverflow(){this._disclosureElement.classList.add('tree-outline-disclosure-hide-overflow');}
makeDense(){this.contentElement.classList.add('tree-outline-dense');}}
class TreeElement{constructor(title,expandable){this.treeOutline=null;this.parent=null;this.previousSibling=null;this.nextSibling=null;this._boundOnFocus=this._onFocus.bind(this);this._boundOnBlur=this._onBlur.bind(this);this._listItemNode=createElement('li');this.titleElement=this._listItemNode.createChild('span','tree-element-title');this._listItemNode.treeElement=this;if(title){this.title=title;}
this._listItemNode.addEventListener('mousedown',this._handleMouseDown.bind(this),false);this._listItemNode.addEventListener('click',this._treeElementToggled.bind(this),false);this._listItemNode.addEventListener('dblclick',this._handleDoubleClick.bind(this),false);markAsTreeitem(this._listItemNode);this._childrenListNode=createElement('ol');this._childrenListNode.parentTreeElement=this;this._childrenListNode.classList.add('children');markAsGroup(this._childrenListNode);this._hidden=false;this._selectable=true;this.expanded=false;this.selected=false;this.setExpandable(expandable||false);this._collapsible=true;}
hasAncestor(ancestor){if(!ancestor){return false;}
let currentNode=this.parent;while(currentNode){if(ancestor===currentNode){return true;}
currentNode=currentNode.parent;}
return false;}
hasAncestorOrSelf(ancestor){return this===ancestor||this.hasAncestor(ancestor);}
isHidden(){if(this.hidden){return true;}
let currentNode=this.parent;while(currentNode){if(currentNode.hidden){return true;}
currentNode=currentNode.parent;}
return false;}
children(){return this._children||[];}
childCount(){return this._children?this._children.length:0;}
firstChild(){return this._children?this._children[0]:null;}
lastChild(){return this._children?this._children[this._children.length-1]:null;}
childAt(index){return this._children?this._children[index]:null;}
indexOfChild(child){return this._children?this._children.indexOf(child):-1;}
appendChild(child){if(!this._children){this._children=[];}
let insertionIndex;if(this.treeOutline&&this.treeOutline._comparator){insertionIndex=this._children.lowerBound(child,this.treeOutline._comparator);}else{insertionIndex=this._children.length;}
this.insertChild(child,insertionIndex);}
insertChild(child,index){if(!this._children){this._children=[];}
if(!child){throw'child can\'t be undefined or null';}
console.assert(!child.parent,'Attempting to insert a child that is already in the tree, reparenting is not supported.');const previousChild=(index>0?this._children[index-1]:null);if(previousChild){previousChild.nextSibling=child;child.previousSibling=previousChild;}else{child.previousSibling=null;}
const nextChild=this._children[index];if(nextChild){nextChild.previousSibling=child;child.nextSibling=nextChild;}else{child.nextSibling=null;}
this._children.splice(index,0,child);this.setExpandable(true);child.parent=this;if(this.treeOutline){this.treeOutline._bindTreeElement(child);}
for(let current=child.firstChild();this.treeOutline&&current;current=current.traverseNextTreeElement(false,child,true)){this.treeOutline._bindTreeElement(current);}
child.onattach();child._ensureSelection();if(this.treeOutline){this.treeOutline.dispatchEventToListeners(Events$7.ElementAttached,child);}
const nextSibling=child.nextSibling?child.nextSibling._listItemNode:null;this._childrenListNode.insertBefore(child._listItemNode,nextSibling);this._childrenListNode.insertBefore(child._childrenListNode,nextSibling);if(child.selected){child.select();}
if(child.expanded){child.expand();}}
removeChildAtIndex(childIndex){if(childIndex<0||childIndex>=this._children.length){throw'childIndex out of range';}
const child=this._children[childIndex];this._children.splice(childIndex,1);const parent=child.parent;if(this.treeOutline&&this.treeOutline.selectedTreeElement&&this.treeOutline.selectedTreeElement.hasAncestorOrSelf(child)){if(child.nextSibling){child.nextSibling.select(true);}else if(child.previousSibling){child.previousSibling.select(true);}else if(parent){parent.select(true);}}
if(child.previousSibling){child.previousSibling.nextSibling=child.nextSibling;}
if(child.nextSibling){child.nextSibling.previousSibling=child.previousSibling;}
child.parent=null;if(this.treeOutline){this.treeOutline._unbindTreeElement(child);}
for(let current=child.firstChild();this.treeOutline&&current;current=current.traverseNextTreeElement(false,child,true)){this.treeOutline._unbindTreeElement(current);}
child._detach();if(this.treeOutline){this.treeOutline.dispatchEventToListeners(Events$7.ElementsDetached);}}
removeChild(child){if(!child){throw'child can\'t be undefined or null';}
if(child.parent!==this){return;}
const childIndex=this._children.indexOf(child);if(childIndex===-1){throw'child not found in this node\'s children';}
this.removeChildAtIndex(childIndex);}
removeChildren(){if(!this.root&&this.treeOutline&&this.treeOutline.selectedTreeElement&&this.treeOutline.selectedTreeElement.hasAncestorOrSelf(this)){this.select(true);}
for(let i=0;this._children&&i<this._children.length;++i){const child=this._children[i];child.previousSibling=null;child.nextSibling=null;child.parent=null;if(this.treeOutline){this.treeOutline._unbindTreeElement(child);}
for(let current=child.firstChild();this.treeOutline&&current;current=current.traverseNextTreeElement(false,child,true)){this.treeOutline._unbindTreeElement(current);}
child._detach();}
this._children=[];if(this.treeOutline){this.treeOutline.dispatchEventToListeners(Events$7.ElementsDetached);}}
get selectable(){if(this.isHidden()){return false;}
return this._selectable;}
set selectable(x){this._selectable=x;}
get listItemElement(){return this._listItemNode;}
get childrenListElement(){return this._childrenListNode;}
get title(){return this._title;}
set title(x){if(this._title===x){return;}
this._title=x;if(typeof x==='string'){this.titleElement.textContent=x;this.tooltip=x;}else{this.titleElement=x;this.tooltip='';}
this._listItemNode.removeChildren();if(this._leadingIconsElement){this._listItemNode.appendChild(this._leadingIconsElement);}
this._listItemNode.appendChild(this.titleElement);if(this._trailingIconsElement){this._listItemNode.appendChild(this._trailingIconsElement);}
this._ensureSelection();}
titleAsText(){if(!this._title){return'';}
if(typeof this._title==='string'){return this._title;}
return this._title.textContent;}
startEditingTitle(editingConfig){InplaceEditor.startEditing((this.titleElement),editingConfig);this.treeOutline._shadowRoot.getSelection().selectAllChildren(this.titleElement);}
setLeadingIcons(icons){if(!this._leadingIconsElement&&!icons.length){return;}
if(!this._leadingIconsElement){this._leadingIconsElement=createElementWithClass('div','leading-icons');this._leadingIconsElement.classList.add('icons-container');this._listItemNode.insertBefore(this._leadingIconsElement,this.titleElement);this._ensureSelection();}
this._leadingIconsElement.removeChildren();for(const icon of icons){this._leadingIconsElement.appendChild(icon);}}
setTrailingIcons(icons){if(!this._trailingIconsElement&&!icons.length){return;}
if(!this._trailingIconsElement){this._trailingIconsElement=createElementWithClass('div','trailing-icons');this._trailingIconsElement.classList.add('icons-container');this._listItemNode.appendChild(this._trailingIconsElement);this._ensureSelection();}
this._trailingIconsElement.removeChildren();for(const icon of icons){this._trailingIconsElement.appendChild(icon);}}
get tooltip(){return this._tooltip||'';}
set tooltip(x){if(this._tooltip===x){return;}
this._tooltip=x;this._listItemNode.title=x;}
isExpandable(){return this._expandable;}
setExpandable(expandable){if(this._expandable===expandable){return;}
this._expandable=expandable;this._listItemNode.classList.toggle('parent',expandable);if(!expandable){this.collapse();unsetExpandable(this._listItemNode);}else{setExpanded(this._listItemNode,false);}}
setCollapsible(collapsible){if(this._collapsible===collapsible){return;}
this._collapsible=collapsible;this._listItemNode.classList.toggle('always-parent',!collapsible);if(!collapsible){this.expand();}}
get hidden(){return this._hidden;}
set hidden(x){if(this._hidden===x){return;}
this._hidden=x;this._listItemNode.classList.toggle('hidden',x);this._childrenListNode.classList.toggle('hidden',x);if(x&&this.treeOutline&&this.treeOutline.selectedTreeElement&&this.treeOutline.selectedTreeElement.hasAncestorOrSelf(this)){const hadFocus=this.treeOutline.selectedTreeElement.listItemElement.hasFocus();this.treeOutline.forceSelect(!hadFocus,false);}}
invalidateChildren(){if(this._children){this.removeChildren();this._children=null;}}
_ensureSelection(){if(!this.treeOutline||!this.treeOutline._renderSelection){return;}
if(!this._selectionElement){this._selectionElement=createElementWithClass('div','selection fill');}
this._listItemNode.insertBefore(this._selectionElement,this.listItemElement.firstChild);}
_treeElementToggled(event){const element=event.currentTarget;if(element.treeElement!==this||element.hasSelection()){return;}
console.assert(!!this.treeOutline);const showSelectionOnKeyboardFocus=this.treeOutline?this.treeOutline._showSelectionOnKeyboardFocus:false;const toggleOnClick=this.toggleOnClick&&(showSelectionOnKeyboardFocus||!this.selectable);const isInTriangle=this.isEventWithinDisclosureTriangle(event);if(!toggleOnClick&&!isInTriangle){return;}
if(this.expanded){if(event.altKey){this.collapseRecursively();}else{this.collapse();}}else{if(event.altKey){this.expandRecursively();}else{this.expand();}}
event.consume();}
_handleMouseDown(event){const element=event.currentTarget;if(!element){return;}
if(!this.selectable){return;}
if(element.treeElement!==this){return;}
if(this.isEventWithinDisclosureTriangle(event)){return;}
this.selectOnMouseDown(event);}
_handleDoubleClick(event){const element=event.currentTarget;if(!element||element.treeElement!==this){return;}
const handled=this.ondblclick(event);if(handled){return;}
if(this._expandable&&!this.expanded){this.expand();}}
_detach(){this._listItemNode.remove();this._childrenListNode.remove();}
collapse(){if(!this.expanded||!this._collapsible){return;}
this._listItemNode.classList.remove('expanded');this._childrenListNode.classList.remove('expanded');setExpanded(this._listItemNode,false);this.expanded=false;this.oncollapse();if(this.treeOutline){this.treeOutline.dispatchEventToListeners(Events$7.ElementCollapsed,this);}
const selectedTreeElement=this.treeOutline.selectedTreeElement;if(selectedTreeElement&&selectedTreeElement.hasAncestor(this)){this.select(true,true);}}
collapseRecursively(){let item=this;while(item){if(item.expanded){item.collapse();}
item=item.traverseNextTreeElement(false,this,true);}}
collapseChildren(){if(!this._children){return;}
for(const child of this._children){child.collapseRecursively();}}
expand(){if(!this._expandable||(this.expanded&&this._children)){return;}
this.expanded=true;this._populateIfNeeded();this._listItemNode.classList.add('expanded');this._childrenListNode.classList.add('expanded');setExpanded(this._listItemNode,true);if(this.treeOutline){this.onexpand();this.treeOutline.dispatchEventToListeners(Events$7.ElementExpanded,this);}}
async expandRecursively(maxDepth){let item=this;const info={};let depth=0;if(isNaN(maxDepth)){maxDepth=3;}
while(item){await item._populateIfNeeded();if(depth<maxDepth){item.expand();}
item=item.traverseNextTreeElement(false,this,(depth>=maxDepth),info);depth+=info.depthChange;}}
collapseOrAscend(altKey){if(this.expanded&&this._collapsible){if(altKey){this.collapseRecursively();}else{this.collapse();}
return true;}
if(!this.parent||this.parent.root){return false;}
if(!this.parent.selectable){this.parent.collapse();return true;}
let nextSelectedElement=this.parent;while(nextSelectedElement&&!nextSelectedElement.selectable){nextSelectedElement=nextSelectedElement.parent;}
if(!nextSelectedElement){return false;}
nextSelectedElement.select(false,true);return true;}
descendOrExpand(altKey){if(!this._expandable){return false;}
if(!this.expanded){if(altKey){this.expandRecursively();}else{this.expand();}
return true;}
let nextSelectedElement=this.firstChild();while(nextSelectedElement&&!nextSelectedElement.selectable){nextSelectedElement=nextSelectedElement.nextSibling;}
if(!nextSelectedElement){return false;}
nextSelectedElement.select(false,true);return true;}
reveal(center){let currentAncestor=this.parent;while(currentAncestor&&!currentAncestor.root){if(!currentAncestor.expanded){currentAncestor.expand();}
currentAncestor=currentAncestor.parent;}
this.treeOutline._deferredScrollIntoView(this,!!center);}
revealed(){let currentAncestor=this.parent;while(currentAncestor&&!currentAncestor.root){if(!currentAncestor.expanded){return false;}
currentAncestor=currentAncestor.parent;}
return true;}
selectOnMouseDown(event){if(this.select(false,true)){event.consume(true);}
if(this._listItemNode.draggable&&this._selectionElement){const marginLeft=this.treeOutline.element.getBoundingClientRect().left-this._listItemNode.getBoundingClientRect().left;this._selectionElement.style.setProperty('margin-left',marginLeft+'px');}}
select(omitFocus,selectedByUser){if(!this.treeOutline||!this.selectable||this.selected){if(!omitFocus){this.listItemElement.focus();}
return false;}
const lastSelected=this.treeOutline.selectedTreeElement;this.treeOutline.selectedTreeElement=null;if(this.treeOutline._rootElement===this){if(lastSelected){lastSelected.deselect();}
if(!omitFocus){this.listItemElement.focus();}
return false;}
this.selected=true;this.treeOutline.selectedTreeElement=this;this.treeOutline.updateFocusable();if(!omitFocus||this.treeOutline.contentElement.hasFocus()){this.listItemElement.focus();}
this._listItemNode.classList.add('selected');setSelected(this._listItemNode,true);this.treeOutline.dispatchEventToListeners(Events$7.ElementSelected,this);if(lastSelected){lastSelected.deselect();}
return this.onselect(selectedByUser);}
_setFocusable(focusable){if(focusable){this._listItemNode.setAttribute('tabIndex',this.treeOutline&&this.treeOutline._preventTabOrder?-1:0);this._listItemNode.addEventListener('focus',this._boundOnFocus,false);this._listItemNode.addEventListener('blur',this._boundOnBlur,false);}else{this._listItemNode.removeAttribute('tabIndex');this._listItemNode.removeEventListener('focus',this._boundOnFocus,false);this._listItemNode.removeEventListener('blur',this._boundOnBlur,false);}}
_onFocus(){if(this.treeOutline._useLightSelectionColor){return;}
if(!this.treeOutline.contentElement.classList.contains('hide-selection-when-blurred')){this._listItemNode.classList.add('force-white-icons');}}
_onBlur(){if(this.treeOutline._useLightSelectionColor){return;}
if(!this.treeOutline.contentElement.classList.contains('hide-selection-when-blurred')){this._listItemNode.classList.remove('force-white-icons');}}
revealAndSelect(omitFocus){this.reveal(true);this.select(omitFocus);}
deselect(){const hadFocus=this._listItemNode.hasFocus();this.selected=false;this._listItemNode.classList.remove('selected');clearSelected(this._listItemNode);this._setFocusable(false);if(this.treeOutline&&this.treeOutline.selectedTreeElement===this){this.treeOutline.selectedTreeElement=null;this.treeOutline.updateFocusable();if(hadFocus){this.treeOutline.focus();}}}
async _populateIfNeeded(){if(this.treeOutline&&this._expandable&&!this._children){this._children=[];await this.onpopulate();}}
async onpopulate(){}
onenter(){return false;}
ondelete(){return false;}
onspace(){return false;}
onbind(){}
onunbind(){}
onattach(){}
onexpand(){}
oncollapse(){}
ondblclick(e){return false;}
onselect(selectedByUser){return false;}
traverseNextTreeElement(skipUnrevealed,stayWithin,dontPopulate,info){if(!dontPopulate){this._populateIfNeeded();}
if(info){info.depthChange=0;}
let element=skipUnrevealed?(this.revealed()?this.firstChild():null):this.firstChild();if(element&&(!skipUnrevealed||(skipUnrevealed&&this.expanded))){if(info){info.depthChange=1;}
return element;}
if(this===stayWithin){return null;}
element=skipUnrevealed?(this.revealed()?this.nextSibling:null):this.nextSibling;if(element){return element;}
element=this;while(element&&!element.root&&!(skipUnrevealed?(element.revealed()?element.nextSibling:null):element.nextSibling)&&element.parent!==stayWithin){if(info){info.depthChange-=1;}
element=element.parent;}
if(!element||element.root){return null;}
return(skipUnrevealed?(element.revealed()?element.nextSibling:null):element.nextSibling);}
traversePreviousTreeElement(skipUnrevealed,dontPopulate){let element=skipUnrevealed?(this.revealed()?this.previousSibling:null):this.previousSibling;if(!dontPopulate&&element){element._populateIfNeeded();}
while(element&&(skipUnrevealed?(element.revealed()&&element.expanded?element.lastChild():null):element.lastChild())){if(!dontPopulate){element._populateIfNeeded();}
element=(skipUnrevealed?(element.revealed()&&element.expanded?element.lastChild():null):element.lastChild());}
if(element){return element;}
if(!this.parent||this.parent.root){return null;}
return this.parent;}
isEventWithinDisclosureTriangle(event){const paddingLeftValue=window.getComputedStyle(this._listItemNode).paddingLeft;console.assert(paddingLeftValue.endsWith('px'));const computedLeftPadding=parseFloat(paddingLeftValue);const left=this._listItemNode.totalOffsetLeft()+computedLeftPadding;return event.pageX>=left&&event.pageX<=left+TreeElement._ArrowToggleWidth&&this._expandable;}}
TreeElement._ArrowToggleWidth=10;(function(){const img=new Image();img.src='Images/treeoutlineTriangles.svg';TreeElement._imagePreload=img;})();var Treeoutline=Object.freeze({__proto__:null,TreeOutline:TreeOutline,Events:Events$7,TreeOutlineInShadow:TreeOutlineInShadow,TreeElement:TreeElement});class Fragment{constructor(element){this._element=element;this._elementsById=new Map();}
element(){return this._element;}
$(elementId){return this._elementsById.get(elementId);}
static build(strings,...values){return Fragment._render(Fragment._template(strings),values);}
static cached(strings,...values){let template=_templateCache.get(strings);if(!template){template=Fragment._template(strings);_templateCache.set(strings,template);}
return Fragment._render(template,values);}
static _template(strings){let html='';let insideText=true;for(let i=0;i<strings.length-1;i++){html+=strings[i];const close=strings[i].lastIndexOf('>');const open=strings[i].indexOf('<',close+1);if(close!==-1&&open===-1){insideText=true;}else if(open!==-1){insideText=false;}
html+=insideText?_textMarker:_attributeMarker(i);}
html+=strings[strings.length-1];const template=window.document.createElement('template');template.innerHTML=html;const walker=template.ownerDocument.createTreeWalker(template.content,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,null,false);let valueIndex=0;const emptyTextNodes=[];const binds=[];const nodesToMark=[];while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===Node.ELEMENT_NODE&&node.hasAttributes()){if(node.hasAttribute('$')){nodesToMark.push(node);binds.push({elementId:node.getAttribute('$')});node.removeAttribute('$');}
const attributesToRemove=[];for(let i=0;i<node.attributes.length;i++){const name=node.attributes[i].name;if(!_attributeMarkerRegex.test(name)&&!_attributeMarkerRegex.test(node.attributes[i].value)){continue;}
attributesToRemove.push(name);nodesToMark.push(node);const bind={attr:{index:valueIndex}};bind.attr.names=name.split(_attributeMarkerRegex);valueIndex+=bind.attr.names.length-1;bind.attr.values=node.attributes[i].value.split(_attributeMarkerRegex);valueIndex+=bind.attr.values.length-1;binds.push(bind);}
for(let i=0;i<attributesToRemove.length;i++){node.removeAttribute(attributesToRemove[i]);}}
if(node.nodeType===Node.TEXT_NODE&&node.data.indexOf(_textMarker)!==-1){const texts=node.data.split(_textMarkerRegex);node.data=texts[texts.length-1];for(let i=0;i<texts.length-1;i++){if(texts[i]){node.parentNode.insertBefore(createTextNode(texts[i]),node);}
const nodeToReplace=createElement('span');nodesToMark.push(nodeToReplace);binds.push({replaceNodeIndex:valueIndex++});node.parentNode.insertBefore(nodeToReplace,node);}}
if(node.nodeType===Node.TEXT_NODE&&(!node.previousSibling||node.previousSibling.nodeType===Node.ELEMENT_NODE)&&(!node.nextSibling||node.nextSibling.nodeType===Node.ELEMENT_NODE)&&/^\s*$/.test(node.data)){emptyTextNodes.push(node);}}
for(let i=0;i<nodesToMark.length;i++){nodesToMark[i].classList.add(_class(i));}
for(const emptyTextNode of emptyTextNodes){emptyTextNode.remove();}
return{template:template,binds:binds};}
static _render(template,values){const content=template.template.ownerDocument.importNode(template.template.content,true);const resultElement=(content.firstChild===content.lastChild?content.firstChild:content);const result=new Fragment(resultElement);const boundElements=[];for(let i=0;i<template.binds.length;i++){const className=_class(i);const element=(content.querySelector('.'+className));element.classList.remove(className);boundElements.push(element);}
for(let bindIndex=0;bindIndex<template.binds.length;bindIndex++){const bind=template.binds[bindIndex];const element=boundElements[bindIndex];if('elementId'in bind){result._elementsById.set((bind.elementId),element);}else if('replaceNodeIndex'in bind){const value=values[(bind.replaceNodeIndex)];element.parentNode.replaceChild(this._nodeForValue(value),element);}else if('attr'in bind){if(bind.attr.names.length===2&&bind.attr.values.length===1&&typeof values[bind.attr.index]==='function'){values[bind.attr.index].call(null,element);}else{let name=bind.attr.names[0];for(let i=1;i<bind.attr.names.length;i++){name+=values[bind.attr.index+i-1];name+=bind.attr.names[i];}
if(name){let value=bind.attr.values[0];for(let i=1;i<bind.attr.values.length;i++){value+=values[bind.attr.index+bind.attr.names.length-1+i-1];value+=bind.attr.values[i];}
element.setAttribute(name,value);}}}else{throw new Error('Unexpected bind');}}
return result;}
static _nodeForValue(value){if(value instanceof Node){return value;}
if(value instanceof Fragment){return value._element;}
if(Array.isArray(value)){const node=createDocumentFragment();for(const v of value){node.appendChild(this._nodeForValue(v));}
return node;}
return createTextNode(''+value);}}
const _textMarker='{{template-text}}';const _textMarkerRegex=/{{template-text}}/;const _attributeMarker=index=>'template-attribute'+index;const _attributeMarkerRegex=/template-attribute\d+/;const _class=index=>'template-class-'+index;const _templateCache=new Map();const html=(strings,...vararg)=>{return Fragment.cached(strings,...vararg).element();};let _Bind;let _Template;var Fragment$1=Object.freeze({__proto__:null,Fragment:Fragment,_textMarker:_textMarker,_attributeMarker:_attributeMarker,html:html,_Bind:_Bind,_Template:_Template});class XLink extends XElement{static create(url,linkText,className,preventClick){if(!linkText){linkText=url;}
className=className||'';url=addReferrerToURLIfNecessary(url);return html`
        <x-link href='${url}' class='${className} devtools-link' ${preventClick ? 'no-click' : ''}
        >${linkText.trimMiddle(MaxLengthForDisplayedURLs)}</x-link>`;}
constructor(){super();this.style.setProperty('display','inline');markAsLink(this);this.tabIndex=0;this.target='_blank';this.rel='noopener';this._href=null;this._clickable=true;this._onClick=event=>{event.consume(true);InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab((this._href));};this._onKeyDown=event=>{if(isEnterOrSpaceKey(event)){event.consume(true);InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab((this._href));}};}
static get observedAttributes(){return XElement.observedAttributes.concat(['href','no-click']);}
attributeChangedCallback(attr,oldValue,newValue){if(attr==='no-click'){this._clickable=!newValue;this._updateClick();return;}
if(attr==='href'){if(!newValue){newValue='';}
let href=null;let url=null;try{url=new URL(newValue);href=url.toString();}catch(error){}
if(url&&url.protocol==='javascript:'){href=null;}
this._href=href;this.title=newValue;this._updateClick();return;}
super.attributeChangedCallback(attr,oldValue,newValue);}
_updateClick(){if(this._href!==null&&this._clickable){this.addEventListener('click',this._onClick,false);this.addEventListener('keydown',this._onKeyDown,false);this.style.setProperty('cursor','pointer');}else{this.removeEventListener('click',this._onClick,false);this.removeEventListener('keydown',this._onKeyDown,false);this.style.removeProperty('cursor');}}}
class ContextMenuProvider{appendApplicableItems(event,contextMenu,target){let targetNode=(target);while(targetNode&&!(targetNode instanceof XLink)){targetNode=targetNode.parentNodeOrShadowHost();}
if(!targetNode||!targetNode._href){return;}
contextMenu.revealSection().appendItem(openLinkExternallyLabel(),()=>InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(targetNode._href));contextMenu.revealSection().appendItem(copyLinkAddressLabel(),()=>InspectorFrontendHost.InspectorFrontendHostInstance.copyText(targetNode._href));}}
self.customElements.define('x-link',XLink);var XLink$1=Object.freeze({__proto__:null,XLink:XLink,ContextMenuProvider:ContextMenuProvider});const highlightedSearchResultClassName='highlighted-search-result';const highlightedCurrentSearchResultClassName='current-search-result';function installDragHandle(element,elementDragStart,elementDrag,elementDragEnd,cursor,hoverCursor,startDelay){function onMouseDown(event){const dragHandler=new DragHandler();const dragStart=dragHandler.elementDragStart.bind(dragHandler,element,elementDragStart,elementDrag,elementDragEnd,cursor,event);if(startDelay){startTimer=setTimeout(dragStart,startDelay);}else{dragStart();}}
function onMouseUp(){if(startTimer){clearTimeout(startTimer);}
startTimer=null;}
let startTimer;element.addEventListener('mousedown',onMouseDown,false);if(startDelay){element.addEventListener('mouseup',onMouseUp,false);}
if(hoverCursor!==null){element.style.cursor=hoverCursor||cursor||'';}}
function elementDragStart(targetElement,elementDragStart,elementDrag,elementDragEnd,cursor,event){const dragHandler=new DragHandler();dragHandler.elementDragStart(targetElement,elementDragStart,elementDrag,elementDragEnd,cursor,event);}
class DragHandler{constructor(){this._elementDragMove=this._elementDragMove.bind(this);this._elementDragEnd=this._elementDragEnd.bind(this);this._mouseOutWhileDragging=this._mouseOutWhileDragging.bind(this);}
_createGlassPane(){this._glassPaneInUse=true;if(!DragHandler._glassPaneUsageCount++){DragHandler._glassPane=new GlassPane();DragHandler._glassPane.setPointerEventsBehavior(PointerEventsBehavior.BlockedByGlassPane);DragHandler._glassPane.show(DragHandler._documentForMouseOut);}}
_disposeGlassPane(){if(!this._glassPaneInUse){return;}
this._glassPaneInUse=false;if(--DragHandler._glassPaneUsageCount){return;}
DragHandler._glassPane.hide();delete DragHandler._glassPane;delete DragHandler._documentForMouseOut;}
elementDragStart(targetElement,elementDragStart,elementDrag,elementDragEnd,cursor,event){if(event.button||(Platform$1.isMac()&&event.ctrlKey)){return;}
if(this._elementDraggingEventListener){return;}
if(elementDragStart&&!elementDragStart((event))){return;}
const targetDocument=event.target.ownerDocument;this._elementDraggingEventListener=elementDrag;this._elementEndDraggingEventListener=elementDragEnd;console.assert((DragHandler._documentForMouseOut||targetDocument)===targetDocument,'Dragging on multiple documents.');DragHandler._documentForMouseOut=targetDocument;this._dragEventsTargetDocument=targetDocument;try{this._dragEventsTargetDocumentTop=targetDocument.defaultView.top.document;}catch(e){this._dragEventsTargetDocumentTop=this._dragEventsTargetDocument;}
targetDocument.addEventListener('mousemove',this._elementDragMove,true);targetDocument.addEventListener('mouseup',this._elementDragEnd,true);targetDocument.addEventListener('mouseout',this._mouseOutWhileDragging,true);if(targetDocument!==this._dragEventsTargetDocumentTop){this._dragEventsTargetDocumentTop.addEventListener('mouseup',this._elementDragEnd,true);}
if(typeof cursor==='string'){this._restoreCursorAfterDrag=restoreCursor.bind(this,targetElement.style.cursor);targetElement.style.cursor=cursor;targetDocument.body.style.cursor=cursor;}
function restoreCursor(oldCursor){targetDocument.body.style.removeProperty('cursor');targetElement.style.cursor=oldCursor;this._restoreCursorAfterDrag=null;}
event.preventDefault();}
_mouseOutWhileDragging(){this._unregisterMouseOutWhileDragging();this._createGlassPane();}
_unregisterMouseOutWhileDragging(){if(!DragHandler._documentForMouseOut){return;}
DragHandler._documentForMouseOut.removeEventListener('mouseout',this._mouseOutWhileDragging,true);}
_unregisterDragEvents(){if(!this._dragEventsTargetDocument){return;}
this._dragEventsTargetDocument.removeEventListener('mousemove',this._elementDragMove,true);this._dragEventsTargetDocument.removeEventListener('mouseup',this._elementDragEnd,true);if(this._dragEventsTargetDocument!==this._dragEventsTargetDocumentTop){this._dragEventsTargetDocumentTop.removeEventListener('mouseup',this._elementDragEnd,true);}
delete this._dragEventsTargetDocument;delete this._dragEventsTargetDocumentTop;}
_elementDragMove(event){if(event.buttons!==1){this._elementDragEnd(event);return;}
if(this._elementDraggingEventListener((event))){this._cancelDragEvents(event);}}
_cancelDragEvents(event){this._unregisterDragEvents();this._unregisterMouseOutWhileDragging();if(this._restoreCursorAfterDrag){this._restoreCursorAfterDrag();}
this._disposeGlassPane();delete this._elementDraggingEventListener;delete this._elementEndDraggingEventListener;}
_elementDragEnd(event){const elementDragEnd=this._elementEndDraggingEventListener;this._cancelDragEvents((event));event.preventDefault();if(elementDragEnd){elementDragEnd((event));}}}
DragHandler._glassPaneUsageCount=0;function isBeingEdited(node){if(!node||node.nodeType!==Node.ELEMENT_NODE){return false;}
let element=(node);if(element.classList.contains('text-prompt')||element.nodeName==='INPUT'||element.nodeName==='TEXTAREA'){return true;}
if(!UI.__editingCount){return false;}
while(element){if(element.__editing){return true;}
element=element.parentElementOrShadowHost();}
return false;}
function isEditing(){if(UI.__editingCount){return true;}
const focused=document.deepActiveElement();if(!focused){return false;}
return focused.classList.contains('text-prompt')||focused.nodeName==='INPUT'||focused.nodeName==='TEXTAREA';}
function markBeingEdited(element,value){if(value){if(element.__editing){return false;}
element.classList.add('being-edited');element.__editing=true;UI.__editingCount=(UI.__editingCount||0)+1;}else{if(!element.__editing){return false;}
element.classList.remove('being-edited');delete element.__editing;--UI.__editingCount;}
return true;}
const _numberRegex=/^(-?(?:\d+(?:\.\d+)?|\.\d+))$/;const StyleValueDelimiters=' \xA0\t\n"\':;,/()';function _valueModificationDirection(event){let direction=null;if(event.type==='mousewheel'){if(event.wheelDeltaY>0||event.wheelDeltaX>0){direction='Up';}else if(event.wheelDeltaY<0||event.wheelDeltaX<0){direction='Down';}}else{if(event.key==='ArrowUp'||event.key==='PageUp'){direction='Up';}else if(event.key==='ArrowDown'||event.key==='PageDown'){direction='Down';}}
return direction;}
function _modifiedHexValue(hexString,event){const direction=_valueModificationDirection(event);if(!direction){return null;}
const mouseEvent=(event);const number=parseInt(hexString,16);if(isNaN(number)||!isFinite(number)){return null;}
const hexStrLen=hexString.length;const channelLen=hexStrLen/3;if(channelLen!==1&&channelLen!==2){return null;}
let delta=0;if(KeyboardShortcut.eventHasCtrlOrMeta(mouseEvent)){delta+=Math.pow(16,channelLen*2);}
if(mouseEvent.shiftKey){delta+=Math.pow(16,channelLen);}
if(mouseEvent.altKey){delta+=1;}
if(delta===0){delta=1;}
if(direction==='Down'){delta*=-1;}
const maxValue=Math.pow(16,hexStrLen)-1;const result=NumberUtilities.clamp(number+delta,0,maxValue);let resultString=result.toString(16).toUpperCase();for(let i=0,lengthDelta=hexStrLen-resultString.length;i<lengthDelta;++i){resultString='0'+resultString;}
return resultString;}
function _modifiedFloatNumber(number,event,modifierMultiplier){const direction=_valueModificationDirection(event);if(!direction){return null;}
const mouseEvent=(event);let delta=1;if(KeyboardShortcut.eventHasCtrlOrMeta(mouseEvent)){delta=100;}else if(mouseEvent.shiftKey){delta=10;}else if(mouseEvent.altKey){delta=0.1;}
if(direction==='Down'){delta*=-1;}
if(modifierMultiplier){delta*=modifierMultiplier;}
const result=Number((number+delta).toFixed(6));if(!String(result).match(_numberRegex)){return null;}
return result;}
function createReplacementString(wordString,event,customNumberHandler){let prefix;let suffix;let number;let replacementString=null;let matches=/(.*#)([\da-fA-F]+)(.*)/.exec(wordString);if(matches&&matches.length){prefix=matches[1];suffix=matches[3];number=_modifiedHexValue(matches[2],event);if(number!==null){replacementString=prefix+number+suffix;}}else{matches=/(.*?)(-?(?:\d+(?:\.\d+)?|\.\d+))(.*)/.exec(wordString);if(matches&&matches.length){prefix=matches[1];suffix=matches[3];number=_modifiedFloatNumber(parseFloat(matches[2]),event);if(number!==null){replacementString=customNumberHandler?customNumberHandler(prefix,number,suffix):prefix+number+suffix;}}}
return replacementString;}
function handleElementValueModifications(event,element,finishHandler,suggestionHandler,customNumberHandler){function createRange(){return document.createRange();}
const arrowKeyOrMouseWheelEvent=(event.key==='ArrowUp'||event.key==='ArrowDown'||event.type==='mousewheel');const pageKeyPressed=(event.key==='PageUp'||event.key==='PageDown');if(!arrowKeyOrMouseWheelEvent&&!pageKeyPressed){return false;}
const selection=element.getComponentSelection();if(!selection.rangeCount){return false;}
const selectionRange=selection.getRangeAt(0);if(!selectionRange.commonAncestorContainer.isSelfOrDescendant(element)){return false;}
const originalValue=element.textContent;const wordRange=selectionRange.startContainer.rangeOfWord(selectionRange.startOffset,StyleValueDelimiters,element);const wordString=wordRange.toString();if(suggestionHandler&&suggestionHandler(wordString)){return false;}
const replacementString=createReplacementString(wordString,event,customNumberHandler);if(replacementString){const replacementTextNode=createTextNode(replacementString);wordRange.deleteContents();wordRange.insertNode(replacementTextNode);const finalSelectionRange=createRange();finalSelectionRange.setStart(replacementTextNode,0);finalSelectionRange.setEnd(replacementTextNode,replacementString.length);selection.removeAllRanges();selection.addRange(finalSelectionRange);event.handled=true;event.preventDefault();if(finishHandler){finishHandler(originalValue,replacementString);}
return true;}
return false;}
Number.preciseMillisToString=function(ms,precision){precision=precision||0;const format='%.'+precision+'f\xa0ms';return UIString.UIString(format,ms);};const _microsFormat=new UIString.UIStringFormat('%.0f\xa0\u03bcs');const _subMillisFormat=new UIString.UIStringFormat('%.2f\xa0ms');const _millisFormat=new UIString.UIStringFormat('%.0f\xa0ms');const _secondsFormat=new UIString.UIStringFormat('%.2f\xa0s');const _minutesFormat=new UIString.UIStringFormat('%.1f\xa0min');const _hoursFormat=new UIString.UIStringFormat('%.1f\xa0hrs');const _daysFormat=new UIString.UIStringFormat('%.1f\xa0days');Number.millisToString=function(ms,higherResolution){if(!isFinite(ms)){return'-';}
if(ms===0){return'0';}
if(higherResolution&&ms<0.1){return _microsFormat.format(ms*1000);}
if(higherResolution&&ms<1000){return _subMillisFormat.format(ms);}
if(ms<1000){return _millisFormat.format(ms);}
const seconds=ms/1000;if(seconds<60){return _secondsFormat.format(seconds);}
const minutes=seconds/60;if(minutes<60){return _minutesFormat.format(minutes);}
const hours=minutes/60;if(hours<24){return _hoursFormat.format(hours);}
const days=hours/24;return _daysFormat.format(days);};Number.secondsToString=function(seconds,higherResolution){if(!isFinite(seconds)){return'-';}
return Number.millisToString(seconds*1000,higherResolution);};Number.bytesToString=function(bytes){if(bytes<1000){return UIString.UIString('%.0f\xA0B',bytes);}
const kilobytes=bytes/1000;if(kilobytes<100){return UIString.UIString('%.1f\xA0kB',kilobytes);}
if(kilobytes<1000){return UIString.UIString('%.0f\xA0kB',kilobytes);}
const megabytes=kilobytes/1000;if(megabytes<100){return UIString.UIString('%.1f\xA0MB',megabytes);}
return UIString.UIString('%.0f\xA0MB',megabytes);};Number.withThousandsSeparator=function(num){let str=num+'';const re=/(\d+)(\d{3})/;while(str.match(re)){str=str.replace(re,'$1\xA0$2');}
return str;};function formatLocalized(format,substitutions){const formatters={s:substitution=>substitution};function append(a,b){a.appendChild(typeof b==='string'?createTextNode(b):b);return a;}
return StringUtilities.format(UIString.UIString(format),substitutions,formatters,createElement('span'),append).formattedResult;}
function openLinkExternallyLabel(){return UIString.UIString('Open in new tab');}
function copyLinkAddressLabel(){return UIString.UIString('Copy link address');}
function anotherProfilerActiveLabel(){return UIString.UIString('Another profiler is already active');}
function asyncStackTraceLabel(description){if(description){if(description==='Promise.resolve'){return ls`Promise resolved (async)`;}
if(description==='Promise.reject'){return ls`Promise rejected (async)`;}
return ls`${description} (async)`;}
return UIString.UIString('Async Call');}
function installComponentRootStyles(element){injectCoreStyles(element);element.classList.add('platform-'+Platform$1.platform());if(!Platform$1.isMac()&&measuredScrollbarWidth(element.ownerDocument)===0){element.classList.add('overlay-scrollbar-enabled');}}
function _windowFocused(document,event){if(event.target.document.nodeType===Node.DOCUMENT_NODE){document.body.classList.remove('inactive');}
UI._keyboardFocus=true;const listener=()=>{const activeElement=document.deepActiveElement();if(activeElement){activeElement.removeAttribute('data-keyboard-focus');}
UI._keyboardFocus=false;};document.defaultView.requestAnimationFrame(()=>{UI._keyboardFocus=false;document.removeEventListener('mousedown',listener,true);});document.addEventListener('mousedown',listener,true);}
function _windowBlurred(document,event){if(event.target.document.nodeType===Node.DOCUMENT_NODE){document.body.classList.add('inactive');}}
function elementIsFocusedByKeyboard(element){return element.hasAttribute('data-keyboard-focus');}
class ElementFocusRestorer{constructor(element){this._element=element;this._previous=element.ownerDocument.deepActiveElement();element.focus();}
restore(){if(!this._element){return;}
if(this._element.hasFocus()&&this._previous){this._previous.focus();}
this._previous=null;this._element=null;}}
function highlightSearchResult(element,offset,length,domChanges){const result=highlightSearchResults(element,[new TextUtils.SourceRange(offset,length)],domChanges);return result.length?result[0]:null;}
function highlightSearchResults(element,resultRanges,changes){return highlightRangesWithStyleClass(element,resultRanges,highlightedSearchResultClassName,changes);}
function runCSSAnimationOnce(element,className){function animationEndCallback(){element.classList.remove(className);element.removeEventListener('webkitAnimationEnd',animationEndCallback,false);}
if(element.classList.contains(className)){element.classList.remove(className);}
element.addEventListener('webkitAnimationEnd',animationEndCallback,false);element.classList.add(className);}
function highlightRangesWithStyleClass(element,resultRanges,styleClass,changes){changes=changes||[];const highlightNodes=[];const textNodes=element.childTextNodes();const lineText=textNodes.map(function(node){return node.textContent;}).join('');const ownerDocument=element.ownerDocument;if(textNodes.length===0){return highlightNodes;}
const nodeRanges=[];let rangeEndOffset=0;for(let i=0;i<textNodes.length;++i){const range={};range.offset=rangeEndOffset;range.length=textNodes[i].textContent.length;rangeEndOffset=range.offset+range.length;nodeRanges.push(range);}
let startIndex=0;for(let i=0;i<resultRanges.length;++i){const startOffset=resultRanges[i].offset;const endOffset=startOffset+resultRanges[i].length;while(startIndex<textNodes.length&&nodeRanges[startIndex].offset+nodeRanges[startIndex].length<=startOffset){startIndex++;}
let endIndex=startIndex;while(endIndex<textNodes.length&&nodeRanges[endIndex].offset+nodeRanges[endIndex].length<endOffset){endIndex++;}
if(endIndex===textNodes.length){break;}
const highlightNode=ownerDocument.createElement('span');highlightNode.className=styleClass;highlightNode.textContent=lineText.substring(startOffset,endOffset);const lastTextNode=textNodes[endIndex];const lastText=lastTextNode.textContent;lastTextNode.textContent=lastText.substring(endOffset-nodeRanges[endIndex].offset);changes.push({node:lastTextNode,type:'changed',oldText:lastText,newText:lastTextNode.textContent});if(startIndex===endIndex){lastTextNode.parentElement.insertBefore(highlightNode,lastTextNode);changes.push({node:highlightNode,type:'added',nextSibling:lastTextNode,parent:lastTextNode.parentElement});highlightNodes.push(highlightNode);const prefixNode=ownerDocument.createTextNode(lastText.substring(0,startOffset-nodeRanges[startIndex].offset));lastTextNode.parentElement.insertBefore(prefixNode,highlightNode);changes.push({node:prefixNode,type:'added',nextSibling:highlightNode,parent:lastTextNode.parentElement});}else{const firstTextNode=textNodes[startIndex];const firstText=firstTextNode.textContent;const anchorElement=firstTextNode.nextSibling;firstTextNode.parentElement.insertBefore(highlightNode,anchorElement);changes.push({node:highlightNode,type:'added',nextSibling:anchorElement,parent:firstTextNode.parentElement});highlightNodes.push(highlightNode);firstTextNode.textContent=firstText.substring(0,startOffset-nodeRanges[startIndex].offset);changes.push({node:firstTextNode,type:'changed',oldText:firstText,newText:firstTextNode.textContent});for(let j=startIndex+1;j<endIndex;j++){const textNode=textNodes[j];const text=textNode.textContent;textNode.textContent='';changes.push({node:textNode,type:'changed',oldText:text,newText:textNode.textContent});}}
startIndex=endIndex;nodeRanges[startIndex].offset=endOffset;nodeRanges[startIndex].length=lastTextNode.textContent.length;}
return highlightNodes;}
function applyDomChanges(domChanges){for(let i=0,size=domChanges.length;i<size;++i){const entry=domChanges[i];switch(entry.type){case'added':entry.parent.insertBefore(entry.node,entry.nextSibling);break;case'changed':entry.node.textContent=entry.newText;break;}}}
function revertDomChanges(domChanges){for(let i=domChanges.length-1;i>=0;--i){const entry=domChanges[i];switch(entry.type){case'added':entry.node.remove();break;case'changed':entry.node.textContent=entry.oldText;break;}}}
function measurePreferredSize(element,containerElement){const oldParent=element.parentElement;const oldNextSibling=element.nextSibling;containerElement=containerElement||element.ownerDocument.body;containerElement.appendChild(element);element.positionAt(0,0);const result=element.getBoundingClientRect();element.positionAt(undefined,undefined);if(oldParent){oldParent.insertBefore(element,oldNextSibling);}else{element.remove();}
return new Size(result.width,result.height);}
class InvokeOnceHandlers{constructor(autoInvoke){this._handlers=null;this._autoInvoke=autoInvoke;}
add(object,method){if(!this._handlers){this._handlers=new Map();if(this._autoInvoke){this.scheduleInvoke();}}
let methods=this._handlers.get(object);if(!methods){methods=new Set();this._handlers.set(object,methods);}
methods.add(method);}
scheduleInvoke(){if(this._handlers){requestAnimationFrame(this._invoke.bind(this));}}
_invoke(){const handlers=this._handlers||new Map();this._handlers=null;for(const[object,methods]of handlers){for(const method of methods){method.call(object);}}}}
let _coalescingLevel=0;let _postUpdateHandlers=null;function startBatchUpdate(){if(!_coalescingLevel++){_postUpdateHandlers=new InvokeOnceHandlers(false);}}
function endBatchUpdate(){if(--_coalescingLevel){return;}
_postUpdateHandlers.scheduleInvoke();_postUpdateHandlers=null;}
function invokeOnceAfterBatchUpdate(object,method){if(!_postUpdateHandlers){_postUpdateHandlers=new InvokeOnceHandlers(true);}
_postUpdateHandlers.add(object,method);}
function animateFunction(window,func,params,duration,animationComplete){const start=window.performance.now();let raf=window.requestAnimationFrame(animationStep);function animationStep(timestamp){const progress=NumberUtilities.clamp((timestamp-start)/duration,0,1);func(...params.map(p=>p.from+(p.to-p.from)*progress));if(progress<1){raf=window.requestAnimationFrame(animationStep);}else if(animationComplete){animationComplete();}}
return()=>window.cancelAnimationFrame(raf);}
class LongClickController extends ObjectWrapper.ObjectWrapper{constructor(element,callback,isEditKeyFunc=event=>isEnterOrSpaceKey(event)){super();this._element=element;this._callback=callback;this._editKey=isEditKeyFunc;this._enable();}
reset(){if(this._longClickInterval){clearInterval(this._longClickInterval);delete this._longClickInterval;}}
_enable(){if(this._longClickData){return;}
const boundKeyDown=keyDown.bind(this);const boundKeyUp=keyUp.bind(this);const boundMouseDown=mouseDown.bind(this);const boundMouseUp=mouseUp.bind(this);const boundReset=this.reset.bind(this);this._element.addEventListener('keydown',boundKeyDown,false);this._element.addEventListener('keyup',boundKeyUp,false);this._element.addEventListener('mousedown',boundMouseDown,false);this._element.addEventListener('mouseout',boundReset,false);this._element.addEventListener('mouseup',boundMouseUp,false);this._element.addEventListener('click',boundReset,true);this._longClickData={mouseUp:boundMouseUp,mouseDown:boundMouseDown,reset:boundReset};function keyDown(e){if(this._editKey(e)){const callback=this._callback;this._longClickInterval=setTimeout(callback.bind(null,e),LongClickController.TIME_MS);}}
function keyUp(e){if(this._editKey(e)){this.reset();}}
function mouseDown(e){if(e.which!==1){return;}
const callback=this._callback;this._longClickInterval=setTimeout(callback.bind(null,e),LongClickController.TIME_MS);}
function mouseUp(e){if(e.which!==1){return;}
this.reset();}}
dispose(){if(!this._longClickData){return;}
this._element.removeEventListener('mousedown',this._longClickData.mouseDown,false);this._element.removeEventListener('mouseout',this._longClickData.reset,false);this._element.removeEventListener('mouseup',this._longClickData.mouseUp,false);this._element.addEventListener('click',this._longClickData.reset,true);delete this._longClickData;}}
LongClickController.TIME_MS=200;function _trackKeyboardFocus(){UI._keyboardFocus=true;document.defaultView.requestAnimationFrame(()=>void(UI._keyboardFocus=false));}
function initializeUIUtils(document,themeSetting){document.body.classList.toggle('inactive',!document.hasFocus());document.defaultView.addEventListener('focus',_windowFocused.bind(UI,document),false);document.defaultView.addEventListener('blur',_windowBlurred.bind(UI,document),false);document.addEventListener('focus',focusChanged.bind(UI),true);document.addEventListener('keydown',_trackKeyboardFocus,true);document.addEventListener('keyup',_trackKeyboardFocus,true);if(!self.UI.themeSupport){self.UI.themeSupport=new ThemeSupport(themeSetting);}
self.UI.themeSupport.applyTheme(document);const body=(document.body);appendStyle(body,'ui/inspectorStyle.css');GlassPane.setContainer((document.body));}
function beautifyFunctionName(name){return name||UIString.UIString('(anonymous)');}
function createTextButton(text,clickHandler,className,primary){const element=createElementWithClass('button',className||'');element.textContent=text;element.classList.add('text-button');if(primary){element.classList.add('primary-button');}
if(clickHandler){element.addEventListener('click',clickHandler,false);}
element.type='button';return element;}
function createInput(className,type){const element=createElementWithClass('input',className||'');element.spellcheck=false;element.classList.add('harmony-input');if(type){element.type=type;}
return element;}
function createLabel(title,className,associatedControl){const element=createElementWithClass('label',className||'');element.textContent=title;if(associatedControl){bindLabelToControl(element,associatedControl);}
return element;}
function createRadioLabel(name,title,checked){const element=createElement('span','dt-radio');element.radioElement.name=name;element.radioElement.checked=!!checked;element.labelElement.createTextChild(title);return element;}
function createIconLabel(title,iconClass){const element=createElement('span','dt-icon-label');element.createChild('span').textContent=title;element.type=iconClass;return element;}
function createSlider(min,max,tabIndex){const element=createElement('span','dt-slider');element.sliderElement.min=min;element.sliderElement.max=max;element.sliderElement.step=1;element.sliderElement.tabIndex=tabIndex;return element;}
class CheckboxLabel extends HTMLSpanElement{constructor(){super();this._shadowRoot;this.checkboxElement;this.textElement;CheckboxLabel._lastId=(CheckboxLabel._lastId||0)+1;const id='ui-checkbox-label'+CheckboxLabel._lastId;this._shadowRoot=createShadowRootWithCoreStyles(this,'ui/checkboxTextLabel.css');this.checkboxElement=(this._shadowRoot.createChild('input'));this.checkboxElement.type='checkbox';this.checkboxElement.setAttribute('id',id);this.textElement=this._shadowRoot.createChild('label','dt-checkbox-text');this.textElement.setAttribute('for',id);this._shadowRoot.createChild('slot');}
static create(title,checked,subtitle){if(!CheckboxLabel._constructor){CheckboxLabel._constructor=registerCustomElement('span','dt-checkbox',CheckboxLabel);}
const element=(CheckboxLabel._constructor());element.checkboxElement.checked=!!checked;if(title!==undefined){element.textElement.textContent=title;setAccessibleName(element.checkboxElement,title);if(subtitle!==undefined){element.textElement.createChild('div','dt-checkbox-subtitle').textContent=subtitle;}}
return element;}
set backgroundColor(color){this.checkboxElement.classList.add('dt-checkbox-themed');this.checkboxElement.style.backgroundColor=color;}
set checkColor(color){this.checkboxElement.classList.add('dt-checkbox-themed');const stylesheet=createElement('style');stylesheet.textContent='input.dt-checkbox-themed:checked:after { background-color: '+color+'}';this._shadowRoot.appendChild(stylesheet);}
set borderColor(color){this.checkboxElement.classList.add('dt-checkbox-themed');this.checkboxElement.style.borderColor=color;}}
(function(){let labelId=0;registerCustomElement('span','dt-radio',class extends HTMLSpanElement{constructor(){super();this.radioElement=this.createChild('input','dt-radio-button');this.labelElement=this.createChild('label');const id='dt-radio-button-id'+(++labelId);this.radioElement.id=id;this.radioElement.type='radio';this.labelElement.htmlFor=id;const root=createShadowRootWithCoreStyles(this,'ui/radioButton.css');root.createChild('slot');this.addEventListener('click',radioClickHandler,false);}});function radioClickHandler(event){if(this.radioElement.checked||this.radioElement.disabled){return;}
this.radioElement.checked=true;this.radioElement.dispatchEvent(new Event('change'));}
registerCustomElement('span','dt-icon-label',class extends HTMLSpanElement{constructor(){super();const root=createShadowRootWithCoreStyles(this);this._iconElement=Icon.create();this._iconElement.style.setProperty('margin-right','4px');root.appendChild(this._iconElement);root.createChild('slot');}
set type(type){this._iconElement.setIconType(type);}});registerCustomElement('span','dt-slider',class extends HTMLSpanElement{constructor(){super();const root=createShadowRootWithCoreStyles(this,'ui/slider.css');this.sliderElement=createElementWithClass('input','dt-range-input');this.sliderElement.type='range';root.appendChild(this.sliderElement);}
set value(amount){this.sliderElement.value=amount;}
get value(){return this.sliderElement.value;}});registerCustomElement('span','dt-small-bubble',class extends HTMLSpanElement{constructor(){super();const root=createShadowRootWithCoreStyles(this,'ui/smallBubble.css');this._textElement=root.createChild('div');this._textElement.className='info';this._textElement.createChild('slot');}
set type(type){this._textElement.className=type;}});registerCustomElement('div','dt-close-button',class extends HTMLDivElement{constructor(){super();const root=createShadowRootWithCoreStyles(this,'ui/closeButton.css');this._buttonElement=root.createChild('div','close-button');setAccessibleName(this._buttonElement,ls`Close`);markAsButton(this._buttonElement);const regularIcon=Icon.create('smallicon-cross','default-icon');this._hoverIcon=Icon.create('mediumicon-red-cross-hover','hover-icon');this._activeIcon=Icon.create('mediumicon-red-cross-active','active-icon');this._buttonElement.appendChild(regularIcon);this._buttonElement.appendChild(this._hoverIcon);this._buttonElement.appendChild(this._activeIcon);}
set gray(gray){if(gray){this._hoverIcon.setIconType('mediumicon-gray-cross-hover');this._activeIcon.setIconType('mediumicon-gray-cross-active');}else{this._hoverIcon.setIconType('mediumicon-red-cross-hover');this._activeIcon.setIconType('mediumicon-red-cross-active');}}
setAccessibleName(name){setAccessibleName(this._buttonElement,name);}
setTabbable(tabbable){if(tabbable){this._buttonElement.tabIndex=0;}else{this._buttonElement.tabIndex=-1;}}});})();function bindInput(input,apply,validate,numeric,modifierMultiplier){input.addEventListener('change',onChange,false);input.addEventListener('input',onInput,false);input.addEventListener('keydown',onKeyDown,false);input.addEventListener('focus',input.select.bind(input),false);function onInput(){input.classList.toggle('error-input',!validate(input.value));}
function onChange(){const{valid}=validate(input.value);input.classList.toggle('error-input',!valid);if(valid){apply(input.value);}}
function onKeyDown(event){if(isEnterKey(event)){const{valid}=validate(input.value);if(valid){apply(input.value);}
event.preventDefault();return;}
if(!numeric){return;}
const value=_modifiedFloatNumber(parseFloat(input.value),event,modifierMultiplier);const stringValue=value?String(value):'';const{valid}=validate(stringValue);if(!valid||!value){return;}
input.value=stringValue;apply(input.value);event.preventDefault();}
function setValue(value){if(value===input.value){return;}
const{valid}=validate(value);input.classList.toggle('error-input',!valid);input.value=value;}
return setValue;}
function trimText(context,text,maxWidth,trimFunction){const maxLength=200;if(maxWidth<=10){return'';}
if(text.length>maxLength){text=trimFunction(text,maxLength);}
const textWidth=measureTextWidth(context,text);if(textWidth<=maxWidth){return text;}
let l=0;let r=text.length;let lv=0;let rv=textWidth;while(l<r&&lv!==rv&&lv!==maxWidth){const m=Math.ceil(l+(r-l)*(maxWidth-lv)/(rv-lv));const mv=measureTextWidth(context,trimFunction(text,m));if(mv<=maxWidth){l=m;lv=mv;}else{r=m-1;rv=mv;}}
text=trimFunction(text,l);return text!=='…'?text:'';}
function trimTextMiddle(context,text,maxWidth){return trimText(context,text,maxWidth,(text,width)=>text.trimMiddle(width));}
function trimTextEnd(context,text,maxWidth){return trimText(context,text,maxWidth,(text,width)=>text.trimEndWithMaxLength(width));}
function measureTextWidth(context,text){const maxCacheableLength=200;if(text.length>maxCacheableLength){return context.measureText(text).width;}
let widthCache=measureTextWidth._textWidthCache;if(!widthCache){widthCache=new Map();measureTextWidth._textWidthCache=widthCache;}
const font=context.font;let textWidths=widthCache.get(font);if(!textWidths){textWidths=new Map();widthCache.set(font,textWidths);}
let width=textWidths.get(text);if(!width){width=context.measureText(text).width;textWidths.set(text,width);}
return width;}
class ThemeSupport{constructor(setting){const systemPreferredTheme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'default';this._themeName=setting.get()==='systemPreferred'?systemPreferredTheme:setting.get();this._themableProperties=new Set(['color','box-shadow','text-shadow','outline-color','background-image','background-color','border-left-color','border-right-color','border-top-color','border-bottom-color','-webkit-border-image','fill','stroke']);this._cachedThemePatches=new Map();this._setting=setting;this._customSheets=new Set();}
hasTheme(){return this._themeName!=='default';}
themeName(){return this._themeName;}
injectHighlightStyleSheets(element){this._injectingStyleSheet=true;appendStyle(element,'ui/inspectorSyntaxHighlight.css');if(this._themeName==='dark'){appendStyle(element,'ui/inspectorSyntaxHighlightDark.css');}
this._injectingStyleSheet=false;}
injectCustomStyleSheets(element){for(const sheet of this._customSheets){const styleElement=createElement('style');styleElement.textContent=sheet;element.appendChild(styleElement);}}
isForcedColorsMode(){return window.matchMedia('(forced-colors: active)').matches;}
addCustomStylesheet(sheetText){this._customSheets.add(sheetText);}
applyTheme(document){if(!this.hasTheme()||this.isForcedColorsMode()){return;}
if(this._themeName==='dark'){document.documentElement.classList.add('-theme-with-dark-background');}
const styleSheets=document.styleSheets;const result=[];for(let i=0;i<styleSheets.length;++i){result.push(this._patchForTheme(styleSheets[i].href,styleSheets[i]));}
result.push('/*# sourceURL=inspector.css.theme */');const styleElement=createElement('style');styleElement.textContent=result.join('\n');document.head.appendChild(styleElement);}
themeStyleSheet(id,text){if(!this.hasTheme()||this._injectingStyleSheet||this.isForcedColorsMode()){return'';}
let patch=this._cachedThemePatches.get(id);if(!patch){const styleElement=createElement('style');styleElement.textContent=text;document.body.appendChild(styleElement);patch=this._patchForTheme(id,styleElement.sheet);document.body.removeChild(styleElement);}
return patch;}
_patchForTheme(id,styleSheet){const cached=this._cachedThemePatches.get(id);if(cached){return cached;}
try{const rules=styleSheet.cssRules;const result=[];for(let j=0;j<rules.length;++j){if(rules[j]instanceof CSSImportRule){result.push(this._patchForTheme(rules[j].styleSheet.href,rules[j].styleSheet));continue;}
const output=[];const style=rules[j].style;const selectorText=rules[j].selectorText;for(let i=0;style&&i<style.length;++i){this._patchProperty(selectorText,style,style[i],output);}
if(output.length){result.push(rules[j].selectorText+'{'+output.join('')+'}');}}
const fullText=result.join('\n');this._cachedThemePatches.set(id,fullText);return fullText;}catch(e){this._setting.set('default');return'';}}
_patchProperty(selectorText,style,name,output){if(!this._themableProperties.has(name)){return;}
const value=style.getPropertyValue(name);if(!value||value==='none'||value==='inherit'||value==='initial'||value==='transparent'){return;}
if(name==='background-image'&&value.indexOf('gradient')===-1){return;}
if(selectorText.indexOf('-theme-')!==-1){return;}
let colorUsage=ThemeSupport.ColorUsage.Unknown;if(name.indexOf('background')===0||name.indexOf('border')===0){colorUsage|=ThemeSupport.ColorUsage.Background;}
if(name.indexOf('background')===-1){colorUsage|=ThemeSupport.ColorUsage.Foreground;}
output.push(name);output.push(':');const items=value.replace(Color.Regex,'\0$1\0').split('\0');for(let i=0;i<items.length;++i){output.push(this.patchColorText(items[i],(colorUsage)));}
if(style.getPropertyPriority(name)){output.push(' !important');}
output.push(';');}
patchColorText(text,colorUsage){const color=Color.Color.parse(text);if(!color){return text;}
const outColor=this.patchColor(color,colorUsage);let outText=outColor.asString(null);if(!outText){outText=outColor.asString(outColor.hasAlpha()?Color.Format.RGBA:Color.Format.RGB);}
return outText||text;}
patchColor(color,colorUsage){const hsla=color.hsla();this._patchHSLA(hsla,colorUsage);const rgba=[];Color.Color.hsl2rgb(hsla,rgba);return new Color.Color(rgba,color.format());}
_patchHSLA(hsla,colorUsage){const hue=hsla[0];const sat=hsla[1];let lit=hsla[2];const alpha=hsla[3];switch(this._themeName){case'dark':{const minCap=colorUsage&ThemeSupport.ColorUsage.Background?0.14:0;const maxCap=colorUsage&ThemeSupport.ColorUsage.Foreground?0.9:1;lit=1-lit;if(lit<minCap*2){lit=minCap+lit/2;}else if(lit>2*maxCap-1){lit=maxCap-1/2+lit/2;}
break;}}
hsla[0]=NumberUtilities.clamp(hue,0,1);hsla[1]=NumberUtilities.clamp(sat,0,1);hsla[2]=NumberUtilities.clamp(lit,0,1);hsla[3]=NumberUtilities.clamp(alpha,0,1);}}
ThemeSupport.ColorUsage={Unknown:0,Foreground:1<<0,Background:1<<1,};function createDocumentationLink(article,title){return XLink.create('https://developers.google.com/web/tools/chrome-devtools/'+article,title);}
function createWebDevLink(article,title){return XLink.create('https://web.dev/'+article,title);}
function addReferrerToURL(url){if(/(\?|&)utm_source=devtools/.test(url)){return url;}
if(url.indexOf('?')===-1){return url.replace(/^([^#]*)(#.*)?$/g,'$1?utm_source=devtools$2');}
return url.replace(/^([^#]*)(#.*)?$/g,'$1&utm_source=devtools$2');}
function addReferrerToURLIfNecessary(url){if(/(\/\/developers.google.com\/|\/\/web.dev\/)/.test(url)){return addReferrerToURL(url);}
return url;}
function loadImage(url){return new Promise(fulfill=>{const image=new Image();image.addEventListener('load',()=>fulfill(image));image.addEventListener('error',()=>fulfill(null));image.src=url;});}
function loadImageFromData(data){return data?loadImage('data:image/jpg;base64,'+data):Promise.resolve(null);}
function createFileSelectorElement(callback){const fileSelectorElement=createElement('input');fileSelectorElement.type='file';fileSelectorElement.style.display='none';fileSelectorElement.setAttribute('tabindex',-1);fileSelectorElement.onchange=onChange;function onChange(event){callback(fileSelectorElement.files[0]);}
return fileSelectorElement;}
const MaxLengthForDisplayedURLs=150;class MessageDialog{static async show(message,where){const dialog=new Dialog();dialog.setSizeBehavior(SizeBehavior.MeasureContent);dialog.setDimmed(true);const shadowRoot=createShadowRootWithCoreStyles(dialog.contentElement,'ui/confirmDialog.css');const content=shadowRoot.createChild('div','widget');await new Promise(resolve=>{const okButton=createTextButton(UIString.UIString('OK'),resolve,'',true);content.createChild('div','message').createChild('span').textContent=message;content.createChild('div','button').appendChild(okButton);dialog.setOutsideClickCallback(event=>{event.consume();resolve();});dialog.show(where);okButton.focus();});dialog.hide();}}
class ConfirmDialog{static async show(message,where){const dialog=new Dialog();dialog.setSizeBehavior(SizeBehavior.MeasureContent);dialog.setDimmed(true);setAccessibleName(dialog.contentElement,message);const shadowRoot=createShadowRootWithCoreStyles(dialog.contentElement,'ui/confirmDialog.css');const content=shadowRoot.createChild('div','widget');content.createChild('div','message').createChild('span').textContent=message;const buttonsBar=content.createChild('div','button');const result=await new Promise(resolve=>{const okButton=createTextButton(ls`OK`,()=>resolve(true),'',true);buttonsBar.appendChild(okButton);buttonsBar.appendChild(createTextButton(ls`Cancel`,()=>resolve(false)));dialog.setOutsideClickCallback(event=>{event.consume();resolve(false);});dialog.show(where);okButton.focus();});dialog.hide();return result;}}
function createInlineButton(toolbarButton){const element=createElement('span');const shadowRoot=createShadowRootWithCoreStyles(element,'ui/inlineButton.css');element.classList.add('inline-button');const toolbar=new Toolbar('');toolbar.appendToolbarItem(toolbarButton);shadowRoot.appendChild(toolbar.element);return element;}
class Renderer{render(object,options){}}
Renderer.render=async function(object,options){if(!object){throw new Error('Can\'t render '+object);}
const renderer=await self.runtime.extension(Renderer,object).instance();return renderer?renderer.render(object,options||{}):null;};function formatTimestamp(timestamp,full){const date=new Date(timestamp);const yymmdd=date.getFullYear()+'-'+leadZero(date.getMonth()+1,2)+'-'+leadZero(date.getDate(),2);const hhmmssfff=leadZero(date.getHours(),2)+':'+leadZero(date.getMinutes(),2)+':'+
leadZero(date.getSeconds(),2)+'.'+leadZero(date.getMilliseconds(),3);return full?(yymmdd+' '+hhmmssfff):hhmmssfff;function leadZero(value,length){const valueString=String(value);return valueString.padStart(length,'0');}}
let Options;var UIUtils=Object.freeze({__proto__:null,highlightedSearchResultClassName:highlightedSearchResultClassName,highlightedCurrentSearchResultClassName:highlightedCurrentSearchResultClassName,installDragHandle:installDragHandle,elementDragStart:elementDragStart,isBeingEdited:isBeingEdited,isEditing:isEditing,markBeingEdited:markBeingEdited,StyleValueDelimiters:StyleValueDelimiters,createReplacementString:createReplacementString,handleElementValueModifications:handleElementValueModifications,_microsFormat:_microsFormat,_subMillisFormat:_subMillisFormat,_millisFormat:_millisFormat,_secondsFormat:_secondsFormat,_minutesFormat:_minutesFormat,_hoursFormat:_hoursFormat,_daysFormat:_daysFormat,formatLocalized:formatLocalized,openLinkExternallyLabel:openLinkExternallyLabel,copyLinkAddressLabel:copyLinkAddressLabel,anotherProfilerActiveLabel:anotherProfilerActiveLabel,asyncStackTraceLabel:asyncStackTraceLabel,installComponentRootStyles:installComponentRootStyles,elementIsFocusedByKeyboard:elementIsFocusedByKeyboard,ElementFocusRestorer:ElementFocusRestorer,highlightSearchResult:highlightSearchResult,highlightSearchResults:highlightSearchResults,runCSSAnimationOnce:runCSSAnimationOnce,highlightRangesWithStyleClass:highlightRangesWithStyleClass,applyDomChanges:applyDomChanges,revertDomChanges:revertDomChanges,measurePreferredSize:measurePreferredSize,startBatchUpdate:startBatchUpdate,endBatchUpdate:endBatchUpdate,invokeOnceAfterBatchUpdate:invokeOnceAfterBatchUpdate,animateFunction:animateFunction,LongClickController:LongClickController,initializeUIUtils:initializeUIUtils,beautifyFunctionName:beautifyFunctionName,createTextButton:createTextButton,createInput:createInput,createLabel:createLabel,createRadioLabel:createRadioLabel,createIconLabel:createIconLabel,createSlider:createSlider,CheckboxLabel:CheckboxLabel,bindInput:bindInput,trimText:trimText,trimTextMiddle:trimTextMiddle,trimTextEnd:trimTextEnd,measureTextWidth:measureTextWidth,ThemeSupport:ThemeSupport,createDocumentationLink:createDocumentationLink,createWebDevLink:createWebDevLink,addReferrerToURL:addReferrerToURL,addReferrerToURLIfNecessary:addReferrerToURLIfNecessary,loadImage:loadImage,loadImageFromData:loadImageFromData,createFileSelectorElement:createFileSelectorElement,MaxLengthForDisplayedURLs:MaxLengthForDisplayedURLs,MessageDialog:MessageDialog,ConfirmDialog:ConfirmDialog,createInlineButton:createInlineButton,Renderer:Renderer,formatTimestamp:formatTimestamp,Options:Options,markAsFocusedByKeyboard:markAsFocusedByKeyboard});class SoftContextMenu{constructor(items,itemSelectedCallback,parentMenu){this._items=items;this._itemSelectedCallback=itemSelectedCallback;this._parentMenu=parentMenu;this._highlightedMenuItemElement=null;}
show(document,anchorBox){if(!this._items.length){return;}
this._document=document;this._glassPane=new GlassPane();this._glassPane.setPointerEventsBehavior(this._parentMenu?PointerEventsBehavior.PierceGlassPane:PointerEventsBehavior.BlockedByGlassPane);this._glassPane.registerRequiredCSS('ui/softContextMenu.css');this._glassPane.setContentAnchorBox(anchorBox);this._glassPane.setSizeBehavior(SizeBehavior.MeasureContent);this._glassPane.setMarginBehavior(MarginBehavior.NoMargin);this._glassPane.setAnchorBehavior(this._parentMenu?AnchorBehavior.PreferRight:AnchorBehavior.PreferBottom);this._contextMenuElement=this._glassPane.contentElement.createChild('div','soft-context-menu');this._contextMenuElement.tabIndex=-1;markAsMenu(this._contextMenuElement);this._contextMenuElement.addEventListener('mouseup',e=>e.consume(),false);this._contextMenuElement.addEventListener('keydown',this._menuKeyDown.bind(this),false);for(let i=0;i<this._items.length;++i){this._contextMenuElement.appendChild(this._createMenuItem(this._items[i]));}
this._glassPane.show(document);this._focusRestorer=new ElementFocusRestorer(this._contextMenuElement);if(!this._parentMenu){this._hideOnUserGesture=event=>{let subMenu=this._subMenu;while(subMenu){if(subMenu._contextMenuElement===event.path[0]){return;}
subMenu=subMenu._subMenu;}
this.discard();event.consume(true);};this._document.body.addEventListener('mousedown',this._hideOnUserGesture,false);this._document.defaultView.addEventListener('resize',this._hideOnUserGesture,false);}}
discard(){if(this._subMenu){this._subMenu.discard();}
if(this._focusRestorer){this._focusRestorer.restore();}
if(this._glassPane){this._glassPane.hide();delete this._glassPane;if(this._hideOnUserGesture){this._document.body.removeEventListener('mousedown',this._hideOnUserGesture,false);this._document.defaultView.removeEventListener('resize',this._hideOnUserGesture,false);delete this._hideOnUserGesture;}}
if(this._parentMenu){delete this._parentMenu._subMenu;}}
_createMenuItem(item){if(item.type==='separator'){return this._createSeparator();}
if(item.type==='subMenu'){return this._createSubMenu(item);}
const menuItemElement=createElementWithClass('div','soft-context-menu-item');menuItemElement.tabIndex=-1;markAsMenuItem(menuItemElement);const checkMarkElement=Icon.create('smallicon-checkmark','checkmark');menuItemElement.appendChild(checkMarkElement);if(!item.checked){checkMarkElement.style.opacity='0';}
if(item.element){const wrapper=menuItemElement.createChild('div','soft-context-menu-custom-item');wrapper.appendChild(item.element);menuItemElement._customElement=item.element;return menuItemElement;}
if(!item.enabled){menuItemElement.classList.add('soft-context-menu-disabled');}
menuItemElement.createTextChild(item.label);menuItemElement.createChild('span','soft-context-menu-shortcut').textContent=item.shortcut;menuItemElement.addEventListener('mousedown',this._menuItemMouseDown.bind(this),false);menuItemElement.addEventListener('mouseup',this._menuItemMouseUp.bind(this),false);menuItemElement.addEventListener('mouseover',this._menuItemMouseOver.bind(this),false);menuItemElement.addEventListener('mouseleave',this._menuItemMouseLeave.bind(this),false);menuItemElement._actionId=item.id;let accessibleName=item.label;if(item.type==='checkbox'){const checkedState=item.checked?ls`checked`:ls`unchecked`;if(item.shortcut){accessibleName=ls`${item.label}, ${item.shortcut}, ${checkedState}`;}else{accessibleName=ls`${item.label}, ${checkedState}`;}}else if(item.shortcut){accessibleName=ls`${item.label}, ${item.shortcut}`;}
setAccessibleName(menuItemElement,accessibleName);return menuItemElement;}
_createSubMenu(item){const menuItemElement=createElementWithClass('div','soft-context-menu-item');menuItemElement._subItems=item.subItems;menuItemElement.tabIndex=-1;markAsMenuItemSubMenu(menuItemElement);setAccessibleName(menuItemElement,item.label);const checkMarkElement=Icon.create('smallicon-checkmark','soft-context-menu-item-checkmark');checkMarkElement.classList.add('checkmark');menuItemElement.appendChild(checkMarkElement);checkMarkElement.style.opacity='0';menuItemElement.createTextChild(item.label);if(Platform$1.isMac()&&!self.UI.themeSupport.hasTheme()){const subMenuArrowElement=menuItemElement.createChild('span','soft-context-menu-item-submenu-arrow');subMenuArrowElement.textContent='\u25B6';}else{const subMenuArrowElement=Icon.create('smallicon-triangle-right','soft-context-menu-item-submenu-arrow');menuItemElement.appendChild(subMenuArrowElement);}
menuItemElement.addEventListener('mousedown',this._menuItemMouseDown.bind(this),false);menuItemElement.addEventListener('mouseup',this._menuItemMouseUp.bind(this),false);menuItemElement.addEventListener('mouseover',this._menuItemMouseOver.bind(this),false);menuItemElement.addEventListener('mouseleave',this._menuItemMouseLeave.bind(this),false);return menuItemElement;}
_createSeparator(){const separatorElement=createElementWithClass('div','soft-context-menu-separator');separatorElement._isSeparator=true;separatorElement.createChild('div','separator-line');return separatorElement;}
_menuItemMouseDown(event){event.consume(true);}
_menuItemMouseUp(event){this._triggerAction(event.target,event);event.consume();}
_root(){let root=this;while(root._parentMenu){root=root._parentMenu;}
return root;}
_triggerAction(menuItemElement,event){if(!menuItemElement._subItems){this._root().discard();event.consume(true);if(typeof menuItemElement._actionId!=='undefined'){this._itemSelectedCallback(menuItemElement._actionId);delete menuItemElement._actionId;}
return;}
this._showSubMenu(menuItemElement);event.consume();}
_showSubMenu(menuItemElement){if(menuItemElement._subMenuTimer){clearTimeout(menuItemElement._subMenuTimer);delete menuItemElement._subMenuTimer;}
if(this._subMenu){return;}
this._subMenu=new SoftContextMenu(menuItemElement._subItems,this._itemSelectedCallback,this);const anchorBox=menuItemElement.boxInWindow();anchorBox.y-=5;anchorBox.x+=3;anchorBox.width-=6;anchorBox.height+=10;this._subMenu.show(this._document,anchorBox);}
_menuItemMouseOver(event){this._highlightMenuItem(event.target,true);}
_menuItemMouseLeave(event){if(!this._subMenu||!event.relatedTarget){this._highlightMenuItem(null,true);return;}
const relatedTarget=event.relatedTarget;if(relatedTarget===this._contextMenuElement){this._highlightMenuItem(null,true);}}
_highlightMenuItem(menuItemElement,scheduleSubMenu){if(this._highlightedMenuItemElement===menuItemElement){return;}
if(this._subMenu){this._subMenu.discard();}
if(this._highlightedMenuItemElement){this._highlightedMenuItemElement.classList.remove('force-white-icons');this._highlightedMenuItemElement.classList.remove('soft-context-menu-item-mouse-over');if(this._highlightedMenuItemElement._subItems&&this._highlightedMenuItemElement._subMenuTimer){clearTimeout(this._highlightedMenuItemElement._subMenuTimer);delete this._highlightedMenuItemElement._subMenuTimer;}}
this._highlightedMenuItemElement=menuItemElement;if(this._highlightedMenuItemElement){if(self.UI.themeSupport.hasTheme()||Platform$1.isMac()){this._highlightedMenuItemElement.classList.add('force-white-icons');}
this._highlightedMenuItemElement.classList.add('soft-context-menu-item-mouse-over');if(this._highlightedMenuItemElement._customElement){this._highlightedMenuItemElement._customElement.focus();}else{this._highlightedMenuItemElement.focus();}
if(scheduleSubMenu&&this._highlightedMenuItemElement._subItems&&!this._highlightedMenuItemElement._subMenuTimer){this._highlightedMenuItemElement._subMenuTimer=setTimeout(this._showSubMenu.bind(this,this._highlightedMenuItemElement),150);}}}
_highlightPrevious(){let menuItemElement=this._highlightedMenuItemElement?this._highlightedMenuItemElement.previousSibling:this._contextMenuElement.lastChild;while(menuItemElement&&(menuItemElement._isSeparator||menuItemElement.classList.contains('soft-context-menu-disabled'))){menuItemElement=menuItemElement.previousSibling;}
if(menuItemElement){this._highlightMenuItem(menuItemElement,false);}}
_highlightNext(){let menuItemElement=this._highlightedMenuItemElement?this._highlightedMenuItemElement.nextSibling:this._contextMenuElement.firstChild;while(menuItemElement&&(menuItemElement._isSeparator||menuItemElement.classList.contains('soft-context-menu-disabled'))){menuItemElement=menuItemElement.nextSibling;}
if(menuItemElement){this._highlightMenuItem(menuItemElement,false);}}
_menuKeyDown(event){switch(event.key){case'ArrowUp':this._highlightPrevious();break;case'ArrowDown':this._highlightNext();break;case'ArrowLeft':if(this._parentMenu){this._highlightMenuItem(null,false);this.discard();}
break;case'ArrowRight':if(!this._highlightedMenuItemElement){break;}
if(this._highlightedMenuItemElement._subItems){this._showSubMenu(this._highlightedMenuItemElement);this._subMenu._highlightNext();}
break;case'Escape':this.discard();break;case'Enter':if(!isEnterKey(event)){return;}
case' ':if(!this._highlightedMenuItemElement||this._highlightedMenuItemElement._customElement){return;}
this._triggerAction(this._highlightedMenuItemElement,event);if(this._highlightedMenuItemElement._subItems){this._subMenu._highlightNext();}
break;}
event.consume(true);}}
var SoftContextMenu$1=Object.freeze({__proto__:null,SoftContextMenu:SoftContextMenu});class Item{constructor(contextMenu,type,label,disabled,checked){this._type=type;this._label=label;this._disabled=disabled;this._checked=checked;this._contextMenu=contextMenu;if(type==='item'||type==='checkbox'){this._id=contextMenu?contextMenu._nextId():0;}}
id(){return this._id;}
type(){return this._type;}
isEnabled(){return!this._disabled;}
setEnabled(enabled){this._disabled=!enabled;}
_buildDescriptor(){switch(this._type){case'item':{const result={type:'item',id:this._id,label:this._label,enabled:!this._disabled};if(this._customElement){result.element=this._customElement;}
if(this._shortcut){result.shortcut=this._shortcut;}
return result;}
case'separator':{return{type:'separator'};}
case'checkbox':{return{type:'checkbox',id:this._id,label:this._label,checked:!!this._checked,enabled:!this._disabled};}}
throw new Error('Invalid item type:'+this._type);}
setShortcut(shortcut){this._shortcut=shortcut;}}
class Section{constructor(contextMenu){this._contextMenu=contextMenu;this._items=[];}
appendItem(label,handler,disabled){const item=new Item(this._contextMenu,'item',label,disabled);this._items.push(item);this._contextMenu._setHandler(item.id(),handler);return item;}
appendCustomItem(element){const item=new Item(this._contextMenu,'item','<custom>');item._customElement=element;this._items.push(item);return item;}
appendSeparator(){const item=new Item(this._contextMenu,'separator');this._items.push(item);return item;}
appendAction(actionId,label,optional){const action=self.UI.actionRegistry.action(actionId);if(!action){if(!optional){console.error(`Action ${actionId} was not defined`);}
return;}
if(!label){label=action.title();}
const result=this.appendItem(label,action.execute.bind(action));const shortcut=self.UI.shortcutRegistry.shortcutTitleForAction(actionId);if(shortcut){result.setShortcut(shortcut);}}
appendSubMenuItem(label,disabled){const item=new SubMenu(this._contextMenu,label,disabled);item._init();this._items.push(item);return item;}
appendCheckboxItem(label,handler,checked,disabled){const item=new Item(this._contextMenu,'checkbox',label,disabled,checked);this._items.push(item);this._contextMenu._setHandler(item.id(),handler);return item;}}
class SubMenu extends Item{constructor(contextMenu,label,disabled){super(contextMenu,'subMenu',label,disabled);this._sections=new Map();this._sectionList=[];}
_init(){_groupWeights.forEach(name=>this.section(name));}
section(name){let section=name?this._sections.get(name):null;if(!section){section=new Section(this._contextMenu);if(name){this._sections.set(name,section);this._sectionList.push(section);}else{this._sectionList.splice(ContextMenu._groupWeights.indexOf('default'),0,section);}}
return section;}
headerSection(){return this.section('header');}
newSection(){return this.section('new');}
revealSection(){return this.section('reveal');}
clipboardSection(){return this.section('clipboard');}
editSection(){return this.section('edit');}
debugSection(){return this.section('debug');}
viewSection(){return this.section('view');}
defaultSection(){return this.section('default');}
saveSection(){return this.section('save');}
footerSection(){return this.section('footer');}
_buildDescriptor(){const result={type:'subMenu',label:this._label,enabled:!this._disabled,subItems:[]};const nonEmptySections=this._sectionList.filter(section=>!!section._items.length);for(const section of nonEmptySections){for(const item of section._items){result.subItems.push(item._buildDescriptor());}
if(section!==nonEmptySections.peekLast()){result.subItems.push({type:'separator'});}}
return result;}
appendItemsAtLocation(location){for(const extension of self.runtime.extensions('context-menu-item')){const itemLocation=extension.descriptor()['location']||'';if(!itemLocation.startsWith(location+'/')){continue;}
const section=itemLocation.substr(location.length+1);if(!section||section.includes('/')){continue;}
this.section(section).appendAction(extension.descriptor()['actionId']);}}}
Item._uniqueSectionName=0;class ContextMenu extends SubMenu{constructor(event,useSoftMenu,x,y){super(null);this._contextMenu=this;super._init();this._defaultSection=this.defaultSection();this._pendingPromises=[];this._pendingTargets=[];this._event=event;this._useSoftMenu=!!useSoftMenu;this._x=x===undefined?event.x:x;this._y=y===undefined?event.y:y;this._handlers={};this._id=0;const target=event.deepElementFromPoint();if(target){this.appendApplicableItems((target));}}
static initialize(){InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.SetUseSoftMenu,setUseSoftMenu);function setUseSoftMenu(event){ContextMenu._useSoftMenu=(event.data);}}
static installHandler(doc){doc.body.addEventListener('contextmenu',handler,false);function handler(event){const contextMenu=new ContextMenu(event);contextMenu.show();}}
_nextId(){return this._id++;}
show(){Promise.all(this._pendingPromises).then(populate.bind(this)).then(this._innerShow.bind(this));ContextMenu._pendingMenu=this;function populate(appendCallResults){if(ContextMenu._pendingMenu!==this){return;}
delete ContextMenu._pendingMenu;for(let i=0;i<appendCallResults.length;++i){const providers=appendCallResults[i];const target=this._pendingTargets[i];for(let j=0;j<providers.length;++j){const provider=(providers[j]);provider.appendApplicableItems(this._event,this,target);}}
this._pendingPromises=[];this._pendingTargets=[];}
this._event.consume(true);}
discard(){if(this._softMenu){this._softMenu.discard();}}
_innerShow(){const menuObject=this._buildMenuDescriptors();if(this._useSoftMenu||ContextMenu._useSoftMenu||InspectorFrontendHost.InspectorFrontendHostInstance.isHostedMode()){this._softMenu=new SoftContextMenu(menuObject,this._itemSelected.bind(this));this._softMenu.show(this._event.target.ownerDocument,new AnchorBox(this._x,this._y,0,0));}else{InspectorFrontendHost.InspectorFrontendHostInstance.showContextMenuAtPoint(this._x,this._y,menuObject,this._event.target.ownerDocument);function listenToEvents(){InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.ContextMenuCleared,this._menuCleared,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.ContextMenuItemSelected,this._onItemSelected,this);}
setImmediate(listenToEvents.bind(this));}}
setX(x){this._x=x;}
setY(y){this._y=y;}
_setHandler(id,handler){if(handler){this._handlers[id]=handler;}}
_buildMenuDescriptors(){return(super._buildDescriptor().subItems);}
_onItemSelected(event){this._itemSelected((event.data));}
_itemSelected(id){if(this._handlers[id]){this._handlers[id].call(this);}
this._menuCleared();}
_menuCleared(){InspectorFrontendHost.InspectorFrontendHostInstance.events.removeEventListener(InspectorFrontendHostAPI.Events.ContextMenuCleared,this._menuCleared,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.removeEventListener(InspectorFrontendHostAPI.Events.ContextMenuItemSelected,this._onItemSelected,this);}
containsTarget(target){return this._pendingTargets.indexOf(target)>=0;}
appendApplicableItems(target){this._pendingPromises.push(self.runtime.allInstances(Provider$1,target));this._pendingTargets.push(target);}}
const _groupWeights=['header','new','reveal','edit','clipboard','debug','view','default','save','footer'];class Provider$1{appendApplicableItems(event,contextMenu,target){}}
ContextMenu._groupWeights=_groupWeights;var ContextMenu$1=Object.freeze({__proto__:null,Item:Item,Section:Section,SubMenu:SubMenu,ContextMenu:ContextMenu,_groupWeights:_groupWeights,Provider:Provider$1});class DropTarget{constructor(element,transferTypes,messageText,handleDrop){element.addEventListener('dragenter',this._onDragEnter.bind(this),true);element.addEventListener('dragover',this._onDragOver.bind(this),true);this._element=element;this._transferTypes=transferTypes;this._messageText=messageText;this._handleDrop=handleDrop;this._enabled=true;}
setEnabled(enabled){this._enabled=enabled;}
_onDragEnter(event){if(this._enabled&&this._hasMatchingType(event)){event.consume(true);}}
_hasMatchingType(event){for(const transferType of this._transferTypes){const found=Array.from(event.dataTransfer.items).find(item=>{return transferType.kind===item.kind&&!!transferType.type.exec(item.type);});if(found){return true;}}
return false;}
_onDragOver(event){if(!this._enabled||!this._hasMatchingType(event)){return;}
event.dataTransfer.dropEffect='copy';event.consume(true);if(this._dragMaskElement){return;}
this._dragMaskElement=this._element.createChild('div','');const shadowRoot=createShadowRootWithCoreStyles(this._dragMaskElement,'ui/dropTarget.css');shadowRoot.createChild('div','drop-target-message').textContent=this._messageText;this._dragMaskElement.addEventListener('drop',this._onDrop.bind(this),true);this._dragMaskElement.addEventListener('dragleave',this._onDragLeave.bind(this),true);}
_onDrop(event){event.consume(true);this._removeMask();if(this._enabled){this._handleDrop(event.dataTransfer);}}
_onDragLeave(event){event.consume(true);this._removeMask();}
_removeMask(){this._dragMaskElement.remove();delete this._dragMaskElement;}}
const Type$1={URI:{kind:'string',type:/text\/uri-list/},Folder:{kind:'file',type:/$^/},File:{kind:'file',type:/.*/},WebFile:{kind:'file',type:/[\w]+/},ImageFile:{kind:'file',type:/image\/.*/},};var DropTarget$1=Object.freeze({__proto__:null,DropTarget:DropTarget,Type:Type$1});class EmptyWidget extends VBox{constructor(text){super();this.registerRequiredCSS('ui/emptyWidget.css');this.element.classList.add('empty-view-scroller');this._contentElement=this.element.createChild('div','empty-view');this._textElement=this._contentElement.createChild('div','empty-bold-text');this._textElement.textContent=text;}
appendParagraph(){return this._contentElement.createChild('p');}
appendLink(link){return this._contentElement.appendChild(XLink.create(link,'Learn more'));}
set text(text){this._textElement.textContent=text;}}
var EmptyWidget$1=Object.freeze({__proto__:null,EmptyWidget:EmptyWidget});class FilterBar extends HBox{constructor(name,visibleByDefault){super();this.registerRequiredCSS('ui/filter.css');this._enabled=true;this.element.classList.add('filter-bar');this._stateSetting=Settings.Settings.instance().createSetting('filterBar-'+name+'-toggled',!!visibleByDefault);this._filterButton=new ToolbarSettingToggle(this._stateSetting,'largeicon-filter',UIString.UIString('Filter'));this._filters=[];this._updateFilterBar();this._stateSetting.addChangeListener(this._updateFilterBar.bind(this));}
filterButton(){return this._filterButton;}
addFilter(filter){this._filters.push(filter);this.element.appendChild(filter.element());filter.addEventListener(FilterUI.Events.FilterChanged,this._filterChanged,this);this._updateFilterButton();}
setEnabled(enabled){this._enabled=enabled;this._filterButton.setEnabled(enabled);this._updateFilterBar();}
forceShowFilterBar(){this._alwaysShowFilters=true;this._updateFilterBar();}
showOnce(){this._stateSetting.set(true);}
_filterChanged(event){this._updateFilterButton();this.dispatchEventToListeners(FilterBar.Events.Changed);}
wasShown(){super.wasShown();this._updateFilterBar();}
_updateFilterBar(){if(!this.parentWidget()||this._showingWidget){return;}
if(this.visible()){this._showingWidget=true;this.showWidget();this._showingWidget=false;}else{this.hideWidget();}}
focus(){for(let i=0;i<this._filters.length;++i){if(this._filters[i]instanceof TextFilterUI){const textFilterUI=(this._filters[i]);textFilterUI.focus();break;}}}
_updateFilterButton(){let isActive=false;for(const filter of this._filters){isActive=isActive||filter.isActive();}
this._filterButton.setDefaultWithRedColor(isActive);this._filterButton.setToggleWithRedColor(isActive);}
clear(){this.element.removeChildren();this._filters=[];this._updateFilterButton();}
setting(){return this._stateSetting;}
visible(){return this._alwaysShowFilters||(this._stateSetting.get()&&this._enabled);}}
FilterBar.Events={Changed:Symbol('Changed'),};class FilterUI extends EventTarget.EventTarget{isActive(){}
element(){}}
FilterUI.Events={FilterChanged:Symbol('FilterChanged')};class TextFilterUI extends ObjectWrapper.ObjectWrapper{constructor(){super();this._filterElement=createElement('div');this._filterElement.className='filter-text-filter';const container=this._filterElement.createChild('div','filter-input-container');this._filterInputElement=container.createChild('span','filter-input-field');this._prompt=new TextPrompt();this._prompt.initialize(this._completions.bind(this),' ');this._proxyElement=this._prompt.attach(this._filterInputElement);this._proxyElement.title=UIString.UIString('e.g. /small[\\d]+/ url:a.com/b');this._prompt.setPlaceholder(UIString.UIString('Filter'));this._prompt.addEventListener(Events$4.TextChanged,this._valueChanged.bind(this));this._suggestionProvider=null;const clearButton=container.createChild('div','filter-input-clear-button');clearButton.appendChild(Icon.create('mediumicon-gray-cross-hover','filter-cancel-button'));clearButton.addEventListener('click',()=>{this.clear();this.focus();});this._updateEmptyStyles();}
_completions(expression,prefix,force){if(this._suggestionProvider){return this._suggestionProvider(expression,prefix,force);}
return Promise.resolve([]);}
isActive(){return!!this._prompt.text();}
element(){return this._filterElement;}
value(){return this._prompt.textWithCurrentSuggestion();}
setValue(value){this._prompt.setText(value);this._valueChanged();}
focus(){this._filterInputElement.focus();}
setSuggestionProvider(suggestionProvider){this._prompt.clearAutocomplete();this._suggestionProvider=suggestionProvider;}
_valueChanged(){this.dispatchEventToListeners(FilterUI.Events.FilterChanged,null);this._updateEmptyStyles();}
_updateEmptyStyles(){this._filterElement.classList.toggle('filter-text-empty',!this._prompt.text());}
clear(){this.setValue('');}}
class NamedBitSetFilterUI extends ObjectWrapper.ObjectWrapper{constructor(items,setting){super();this._filtersElement=createElementWithClass('div','filter-bitset-filter');markAsListBox(this._filtersElement);markAsMultiSelectable(this._filtersElement);this._filtersElement.title=UIString.UIString('%sClick to select multiple types',KeyboardShortcut.shortcutToString('',Modifiers.CtrlOrMeta));this._allowedTypes={};this._typeFilterElements=[];this._addBit(NamedBitSetFilterUI.ALL_TYPES,UIString.UIString('All'));this._typeFilterElements[0].tabIndex=0;this._filtersElement.createChild('div','filter-bitset-filter-divider');for(let i=0;i<items.length;++i){this._addBit(items[i].name,items[i].label,items[i].title);}
if(setting){this._setting=setting;setting.addChangeListener(this._settingChanged.bind(this));this._settingChanged();}else{this._toggleTypeFilter(NamedBitSetFilterUI.ALL_TYPES,false);}}
reset(){this._toggleTypeFilter(NamedBitSetFilterUI.ALL_TYPES,false);}
isActive(){return!this._allowedTypes[NamedBitSetFilterUI.ALL_TYPES];}
element(){return this._filtersElement;}
accept(typeName){return!!this._allowedTypes[NamedBitSetFilterUI.ALL_TYPES]||!!this._allowedTypes[typeName];}
_settingChanged(){const allowedTypes=this._setting.get();this._allowedTypes={};for(const element of this._typeFilterElements){if(allowedTypes[element.typeName]){this._allowedTypes[element.typeName]=true;}}
this._update();}
_update(){if((Object.keys(this._allowedTypes).length===0)||this._allowedTypes[NamedBitSetFilterUI.ALL_TYPES]){this._allowedTypes={};this._allowedTypes[NamedBitSetFilterUI.ALL_TYPES]=true;}
for(const element of this._typeFilterElements){const typeName=element.typeName;const active=!!this._allowedTypes[typeName];element.classList.toggle('selected',active);setSelected(element,active);}
this.dispatchEventToListeners(FilterUI.Events.FilterChanged,null);}
_addBit(name,label,title){const typeFilterElement=this._filtersElement.createChild('span',name);typeFilterElement.tabIndex=-1;typeFilterElement.typeName=name;typeFilterElement.createTextChild(label);markAsOption(typeFilterElement);if(title){typeFilterElement.title=title;}
typeFilterElement.addEventListener('click',this._onTypeFilterClicked.bind(this),false);typeFilterElement.addEventListener('keydown',this._onTypeFilterKeydown.bind(this),false);this._typeFilterElements.push(typeFilterElement);}
_onTypeFilterClicked(e){let toggle;if(Platform$1.isMac()){toggle=e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey;}else{toggle=e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey;}
this._toggleTypeFilter(e.target.typeName,toggle);}
_onTypeFilterKeydown(event){const element=(event.target);if(!element){return;}
if(event.key==='ArrowLeft'||event.key==='ArrowUp'){if(this._keyFocusNextBit(element,true)){event.consume(true);}}else if(event.key==='ArrowRight'||event.key==='ArrowDown'){if(this._keyFocusNextBit(element,false)){event.consume(true);}}else if(isEnterOrSpaceKey(event)){this._onTypeFilterClicked(event);}}
_keyFocusNextBit(target,selectPrevious){const index=this._typeFilterElements.indexOf(target);if(index===-1){return false;}
const nextIndex=selectPrevious?index-1:index+1;if(nextIndex<0||nextIndex>=this._typeFilterElements.length){return false;}
const nextElement=this._typeFilterElements[nextIndex];nextElement.tabIndex=0;target.tabIndex=-1;nextElement.focus();return true;}
_toggleTypeFilter(typeName,allowMultiSelect){if(allowMultiSelect&&typeName!==NamedBitSetFilterUI.ALL_TYPES){this._allowedTypes[NamedBitSetFilterUI.ALL_TYPES]=false;}else{this._allowedTypes={};}
this._allowedTypes[typeName]=!this._allowedTypes[typeName];if(this._setting){this._setting.set(this._allowedTypes);}else{this._update();}}}
NamedBitSetFilterUI.ALL_TYPES='all';class CheckboxFilterUI extends ObjectWrapper.ObjectWrapper{constructor(className,title,activeWhenChecked,setting){super();this._filterElement=createElementWithClass('div','filter-checkbox-filter');this._activeWhenChecked=!!activeWhenChecked;this._label=CheckboxLabel.create(title);this._filterElement.appendChild(this._label);this._checkboxElement=this._label.checkboxElement;if(setting){bindCheckbox(this._checkboxElement,setting);}else{this._checkboxElement.checked=true;}
this._checkboxElement.addEventListener('change',this._fireUpdated.bind(this),false);}
isActive(){return this._activeWhenChecked===this._checkboxElement.checked;}
checked(){return this._checkboxElement.checked;}
setChecked(checked){this._checkboxElement.checked=checked;}
element(){return this._filterElement;}
labelElement(){return this._label;}
_fireUpdated(){this.dispatchEventToListeners(FilterUI.Events.FilterChanged,null);}
setColor(backgroundColor,borderColor){this._label.backgroundColor=backgroundColor;this._label.borderColor=borderColor;}}
let Item$1;var FilterBar$1=Object.freeze({__proto__:null,FilterBar:FilterBar,FilterUI:FilterUI,TextFilterUI:TextFilterUI,NamedBitSetFilterUI:NamedBitSetFilterUI,CheckboxFilterUI:CheckboxFilterUI,Item:Item$1});class FilterSuggestionBuilder{constructor(keys,valueSorter){this._keys=keys;this._valueSorter=valueSorter||((key,result)=>result.sort());this._valuesMap=new Map();}
completions(expression,prefix,force){if(!prefix&&!force){return Promise.resolve([]);}
const negative=prefix.startsWith('-');if(negative){prefix=prefix.substring(1);}
const modifier=negative?'-':'';const valueDelimiterIndex=prefix.indexOf(':');const suggestions=[];if(valueDelimiterIndex===-1){const matcher=new RegExp('^'+prefix.escapeForRegExp(),'i');for(const key of this._keys){if(matcher.test(key)){suggestions.push({text:modifier+key+':'});}}}else{const key=prefix.substring(0,valueDelimiterIndex).toLowerCase();const value=prefix.substring(valueDelimiterIndex+1);const matcher=new RegExp('^'+value.escapeForRegExp(),'i');const values=Array.from(this._valuesMap.get(key)||new Set());this._valueSorter(key,values);for(const item of values){if(matcher.test(item)&&(item!==value)){suggestions.push({text:modifier+key+':'+item});}}}
return Promise.resolve(suggestions);}
addItem(key,value){if(!value){return;}
if(!this._valuesMap.get(key)){this._valuesMap.set(key,(new Set()));}
this._valuesMap.get(key).add(value);}
clear(){this._valuesMap.clear();}}
var FilterSuggestionBuilder$1=Object.freeze({__proto__:null,FilterSuggestionBuilder:FilterSuggestionBuilder});class ShortcutRegistry{constructor(actionRegistry){this._actionRegistry=actionRegistry;this._keyToShortcut=new Platform.Multimap();this._actionToShortcut=new Platform.Multimap();this._registerBindings();}
_applicableActions(key){return this._actionRegistry.applicableActions(this.actionsForKey(key),self.UI.context);}
actionsForKey(key){const shortcuts=[...this._keyToShortcut.get(key)];return shortcuts.map(shortcut=>shortcut.action);}
shortcutsForAction(action){return[...this._actionToShortcut.get(action)];}
globalShortcutKeys(){const keys=[];for(const key of this._keyToShortcut.keysArray()){const actions=[...this._keyToShortcut.get(key)];const applicableActions=this._actionRegistry.applicableActions(actions,new Context());if(applicableActions.length){keys.push(key);}}
return keys;}
shortcutDescriptorsForAction(actionId){return[...this._actionToShortcut.get(actionId)].map(shortcut=>shortcut.descriptor);}
keysForActions(actionIds){const result=[];for(let i=0;i<actionIds.length;++i){const descriptors=this.shortcutDescriptorsForAction(actionIds[i]);for(let j=0;j<descriptors.length;++j){result.push(descriptors[j].key);}}
return result;}
shortcutTitleForAction(actionId){const descriptors=this.shortcutDescriptorsForAction(actionId);if(descriptors.length){return descriptors[0].name;}}
handleShortcut(event){this.handleKey(KeyboardShortcut.makeKeyFromEvent(event),event.key,event);}
eventMatchesAction(event,actionId){console.assert(this._actionToShortcut.has(actionId),'Unknown action '+actionId);const key=KeyboardShortcut.makeKeyFromEvent(event);return[...this._actionToShortcut.get(actionId)].some(shortcut=>shortcut.descriptor.key===key);}
addShortcutListener(element,actionId,listener,capture){console.assert(this._actionToShortcut.has(actionId),'Unknown action '+actionId);element.addEventListener('keydown',event=>{if(!this.eventMatchesAction((event),actionId)||!listener.call(null)){return;}
event.consume(true);},capture);}
async handleKey(key,domKey,event){const keyModifiers=key>>8;const actions=this._applicableActions(key);if(!actions.length||isPossiblyInputKey()){return;}
if(event){event.consume(true);}
if(Dialog.hasInstance()){return;}
for(const action of actions){try{const result=await action.execute();if(result){userMetrics.keyboardShortcutFired(action.id());return;}}catch(e){console.error(e);throw e;}}
function isPossiblyInputKey(){if(!event||!isEditing()||/^F\d+|Control|Shift|Alt|Meta|Escape|Win|U\+001B$/.test(domKey)){return false;}
if(!keyModifiers){return true;}
const modifiers=Modifiers;if(Platform$1.isMac()){if(KeyboardShortcut.makeKey('z',modifiers.Meta)===key){return true;}
if(KeyboardShortcut.makeKey('z',modifiers.Meta|modifiers.Shift)===key){return true;}}else{if(KeyboardShortcut.makeKey('z',modifiers.Ctrl)===key){return true;}
if(KeyboardShortcut.makeKey('y',modifiers.Ctrl)===key){return true;}
if(!Platform$1.isWin()&&KeyboardShortcut.makeKey('z',modifiers.Ctrl|modifiers.Shift)===key){return true;}}
if((keyModifiers&(modifiers.Ctrl|modifiers.Alt))===(modifiers.Ctrl|modifiers.Alt)){return Platform$1.isWin();}
return!hasModifier(modifiers.Ctrl)&&!hasModifier(modifiers.Alt)&&!hasModifier(modifiers.Meta);}
function hasModifier(mod){return!!(keyModifiers&mod);}}
_registerShortcut(shortcut){this._actionToShortcut.set(shortcut.action,shortcut);this._keyToShortcut.set(shortcut.descriptor.key,shortcut);}
_registerBindings(){const extensions=self.runtime.extensions('action');extensions.forEach(registerExtension,this);function registerExtension(extension){const descriptor=extension.descriptor();const bindings=descriptor.bindings;for(let i=0;bindings&&i<bindings.length;++i){if(!platformMatches(bindings[i].platform)){continue;}
const shortcuts=bindings[i].shortcut.split(/\s+/);shortcuts.forEach(shortcut=>{const shortcutDescriptor=KeyboardShortcut.makeDescriptorFromBindingShortcut(shortcut);if(shortcutDescriptor){this._registerShortcut(new KeyboardShortcut(shortcutDescriptor,(descriptor.actionId),Type.DefaultShortcut));}});}}
function platformMatches(platformsString){if(!platformsString){return true;}
const platforms=platformsString.split(',');let isMatch=false;const currentPlatform=Platform$1.platform();for(let i=0;!isMatch&&i<platforms.length;++i){isMatch=platforms[i]===currentPlatform;}
return isMatch;}}}
class ForwardedShortcut{}
ForwardedShortcut.instance=new ForwardedShortcut();var ShortcutRegistry$1=Object.freeze({__proto__:null,ShortcutRegistry:ShortcutRegistry,ForwardedShortcut:ForwardedShortcut});class ForwardedInputEventHandler{constructor(){InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.KeyEventUnhandled,this._onKeyEventUnhandled,this);}
_onKeyEventUnhandled(event){const data=event.data;const type=(data.type);const key=(data.key);const keyCode=(data.keyCode);const modifiers=(data.modifiers);if(type!=='keydown'){return;}
self.UI.context.setFlavor(ForwardedShortcut,ForwardedShortcut.instance);self.UI.shortcutRegistry.handleKey(KeyboardShortcut.makeKey(keyCode,modifiers),key);self.UI.context.setFlavor(ForwardedShortcut,null);}}
new ForwardedInputEventHandler();var ForwardedInputEventHandler$1=Object.freeze({__proto__:null,ForwardedInputEventHandler:ForwardedInputEventHandler});class HistoryInput extends HTMLInputElement{constructor(){super();this._history=[''];this._historyPosition=0;this.addEventListener('keydown',this._onKeyDown.bind(this),false);this.addEventListener('input',this._onInput.bind(this),false);}
static create(){if(!HistoryInput._constructor){HistoryInput._constructor=registerCustomElement('input','history-input',HistoryInput);}
return(HistoryInput._constructor());}
_onInput(event){if(this._history.length===this._historyPosition+1){this._history[this._history.length-1]=this.value;}}
_onKeyDown(event){if(event.keyCode===Keys.Up.code){this._historyPosition=Math.max(this._historyPosition-1,0);this.value=this._history[this._historyPosition];this.dispatchEvent(new Event('input',{'bubbles':true,'cancelable':true}));event.consume(true);}else if(event.keyCode===Keys.Down.code){this._historyPosition=Math.min(this._historyPosition+1,this._history.length-1);this.value=this._history[this._historyPosition];this.dispatchEvent(new Event('input',{'bubbles':true,'cancelable':true}));event.consume(true);}else if(event.keyCode===Keys.Enter.code){this._saveToHistory();}}
_saveToHistory(){if(this._history.length>1&&this._history[this._history.length-2]===this.value){return;}
this._history[this._history.length-1]=this.value;this._historyPosition=this._history.length-1;this._history.push('');}}
var HistoryInput$1=Object.freeze({__proto__:null,HistoryInput:HistoryInput});class Infobar{constructor(type,text,actions,disableSetting){this.element=createElementWithClass('div','flex-none');this._shadowRoot=createShadowRootWithCoreStyles(this.element,'ui/infobar.css');this._contentElement=this._shadowRoot.createChild('div','infobar infobar-'+type);this._mainRow=this._contentElement.createChild('div','infobar-main-row');this._detailsRows=this._contentElement.createChild('div','infobar-details-rows hidden');this._infoContainer=this._mainRow.createChild('div','infobar-info-container');this._infoMessage=this._infoContainer.createChild('div','infobar-info-message');this._infoMessage.createChild('div',type+'-icon icon');this._infoText=this._infoMessage.createChild('div','infobar-info-text');this._infoText.textContent=text;markAsAlert(this._infoText);this._actionContainer=this._infoContainer.createChild('div','infobar-info-actions');if(actions){for(const action of actions){const actionCallback=this._actionCallbackFactory(action);let buttonClass='infobar-button';if(action.highlight){buttonClass+=' primary-button';}
const button=createTextButton(action.text,actionCallback,buttonClass);this._actionContainer.appendChild(button);}}
this._disableSetting=disableSetting||null;if(disableSetting){const disableButton=createTextButton(ls`Don't show again`,this._onDisable.bind(this),'infobar-button');this._actionContainer.appendChild(disableButton);}
this._closeContainer=this._mainRow.createChild('div','infobar-close-container');this._toggleElement=createTextButton(ls`Learn more`,this._onToggleDetails.bind(this),'link-style devtools-link hidden');this._closeContainer.appendChild(this._toggleElement);this._closeButton=this._closeContainer.createChild('div','close-button','dt-close-button');this._closeButton.setTabbable(true);setDescription(this._closeButton,ls`Close`);self.onInvokeElement(this._closeButton,this.dispose.bind(this));this._contentElement.tabIndex=0;setAccessibleName(this._contentElement,text);this._contentElement.addEventListener('keydown',event=>{if(event.keyCode===Keys.Esc.code){this.dispose();event.consume();return;}
if(event.target!==this._contentElement){return;}
if(event.key==='Enter'){this._onToggleDetails();event.consume();return;}});this._closeCallback=null;}
static create(type,text,actions,disableSetting){if(disableSetting&&disableSetting.get()){return null;}
return new Infobar(type,text,actions,disableSetting);}
dispose(){this.element.remove();this._onResize();if(this._closeCallback){this._closeCallback.call(null);}}
setText(text){this._infoText.textContent=text;this._onResize();}
setCloseCallback(callback){this._closeCallback=callback;}
setParentView(parentView){this._parentView=parentView;}
_actionCallbackFactory(action){if(!action.delegate){return action.dismiss?this.dispose.bind(this):()=>{};}
if(!action.dismiss){return action.delegate;}
return(()=>{action.delegate();this.dispose();}).bind(this);}
_onResize(){if(this._parentView){this._parentView.doResize();}}
_onDisable(){this._disableSetting.set(true);this.dispose();}
_onToggleDetails(){this._detailsRows.classList.remove('hidden');this._toggleElement.remove();this._onResize();}
createDetailsRowMessage(message){this._toggleElement.classList.remove('hidden');const infobarDetailsRow=this._detailsRows.createChild('div','infobar-details-row');const detailsRowMessage=infobarDetailsRow.createChild('span','infobar-row-message');detailsRowMessage.textContent=message||'';return detailsRowMessage;}}
let InfobarAction;const Type$2={Warning:'warning',Info:'info'};var Infobar$1=Object.freeze({__proto__:null,Infobar:Infobar,InfobarAction:InfobarAction,Type:Type$2});class SearchableView extends VBox{constructor(searchable,settingName){super(true);this.registerRequiredCSS('ui/searchableView.css');this.element[_symbol$1]=this;this._searchProvider=searchable;this._setting=settingName?Settings.Settings.instance().createSetting(settingName,{}):null;this._replaceable=false;this.contentElement.createChild('slot');this._footerElementContainer=this.contentElement.createChild('div','search-bar hidden');this._footerElementContainer.style.order=100;this._footerElement=this._footerElementContainer.createChild('div','toolbar-search');const replaceToggleToolbar=new Toolbar('replace-toggle-toolbar',this._footerElement);this._replaceToggleButton=new ToolbarToggle(UIString.UIString('Replace'),'mediumicon-replace');this._replaceToggleButton.addEventListener(ToolbarButton.Events.Click,this._toggleReplace,this);replaceToggleToolbar.appendToolbarItem(this._replaceToggleButton);const searchInputElements=this._footerElement.createChild('div','toolbar-search-inputs');const searchControlElement=searchInputElements.createChild('div','toolbar-search-control');this._searchInputElement=HistoryInput.create();this._searchInputElement.classList.add('search-replace');this._searchInputElement.id='search-input-field';this._searchInputElement.placeholder=UIString.UIString('Find');searchControlElement.appendChild(this._searchInputElement);this._matchesElement=searchControlElement.createChild('label','search-results-matches');this._matchesElement.setAttribute('for','search-input-field');const searchNavigationElement=searchControlElement.createChild('div','toolbar-search-navigation-controls');this._searchNavigationPrevElement=searchNavigationElement.createChild('div','toolbar-search-navigation toolbar-search-navigation-prev');this._searchNavigationPrevElement.addEventListener('click',this._onPrevButtonSearch.bind(this),false);this._searchNavigationPrevElement.title=UIString.UIString('Search previous');this._searchNavigationNextElement=searchNavigationElement.createChild('div','toolbar-search-navigation toolbar-search-navigation-next');this._searchNavigationNextElement.addEventListener('click',this._onNextButtonSearch.bind(this),false);this._searchNavigationNextElement.title=UIString.UIString('Search next');this._searchInputElement.addEventListener('keydown',this._onSearchKeyDown.bind(this),true);this._searchInputElement.addEventListener('input',this._onInput.bind(this),false);this._replaceInputElement=searchInputElements.createChild('input','search-replace toolbar-replace-control hidden');this._replaceInputElement.addEventListener('keydown',this._onReplaceKeyDown.bind(this),true);this._replaceInputElement.placeholder=UIString.UIString('Replace');this._buttonsContainer=this._footerElement.createChild('div','toolbar-search-buttons');const firstRowButtons=this._buttonsContainer.createChild('div','first-row-buttons');const toolbar=new Toolbar('toolbar-search-options',firstRowButtons);if(this._searchProvider.supportsCaseSensitiveSearch()){this._caseSensitiveButton=new ToolbarToggle(UIString.UIString('Match Case'));this._caseSensitiveButton.setText('Aa');this._caseSensitiveButton.addEventListener(ToolbarButton.Events.Click,this._toggleCaseSensitiveSearch,this);toolbar.appendToolbarItem(this._caseSensitiveButton);}
if(this._searchProvider.supportsRegexSearch()){this._regexButton=new ToolbarToggle(UIString.UIString('Use Regular Expression'));this._regexButton.setText('.*');this._regexButton.addEventListener(ToolbarButton.Events.Click,this._toggleRegexSearch,this);toolbar.appendToolbarItem(this._regexButton);}
const cancelButtonElement=createTextButton(UIString.UIString('Cancel'),this.closeSearch.bind(this),'search-action-button');firstRowButtons.appendChild(cancelButtonElement);this._secondRowButtons=this._buttonsContainer.createChild('div','second-row-buttons hidden');this._replaceButtonElement=createTextButton(UIString.UIString('Replace'),this._replace.bind(this),'search-action-button');this._replaceButtonElement.disabled=true;this._secondRowButtons.appendChild(this._replaceButtonElement);this._replaceAllButtonElement=createTextButton(UIString.UIString('Replace all'),this._replaceAll.bind(this),'search-action-button');this._secondRowButtons.appendChild(this._replaceAllButtonElement);this._replaceAllButtonElement.disabled=true;this._minimalSearchQuerySize=3;this._loadSetting();}
static fromElement(element){let view=null;while(element&&!view){view=element[_symbol$1];element=element.parentElementOrShadowHost();}
return view;}
_toggleCaseSensitiveSearch(){this._caseSensitiveButton.setToggled(!this._caseSensitiveButton.toggled());this._saveSetting();this._performSearch(false,true);}
_toggleRegexSearch(){this._regexButton.setToggled(!this._regexButton.toggled());this._saveSetting();this._performSearch(false,true);}
_toggleReplace(){this._replaceToggleButton.setToggled(!this._replaceToggleButton.toggled());this._updateSecondRowVisibility();}
_saveSetting(){if(!this._setting){return;}
const settingValue=this._setting.get()||{};settingValue.caseSensitive=this._caseSensitiveButton.toggled();settingValue.isRegex=this._regexButton.toggled();this._setting.set(settingValue);}
_loadSetting(){const settingValue=this._setting?(this._setting.get()||{}):{};if(this._searchProvider.supportsCaseSensitiveSearch()){this._caseSensitiveButton.setToggled(!!settingValue.caseSensitive);}
if(this._searchProvider.supportsRegexSearch()){this._regexButton.setToggled(!!settingValue.isRegex);}}
setMinimalSearchQuerySize(minimalSearchQuerySize){this._minimalSearchQuerySize=minimalSearchQuerySize;}
setPlaceholder(placeholder){this._searchInputElement.placeholder=placeholder;}
setReplaceable(replaceable){this._replaceable=replaceable;}
updateSearchMatchesCount(matches){if(this._searchProvider.currentSearchMatches===matches){return;}
this._searchProvider.currentSearchMatches=matches;this._updateSearchMatchesCountAndCurrentMatchIndex(this._searchProvider.currentQuery?matches:0,-1);}
updateCurrentMatchIndex(currentMatchIndex){this._updateSearchMatchesCountAndCurrentMatchIndex(this._searchProvider.currentSearchMatches,currentMatchIndex);}
isSearchVisible(){return this._searchIsVisible;}
closeSearch(){this.cancelSearch();if(this._footerElementContainer.hasFocus()){this.focus();}}
_toggleSearchBar(toggled){this._footerElementContainer.classList.toggle('hidden',!toggled);this.doResize();}
cancelSearch(){if(!this._searchIsVisible){return;}
this.resetSearch();delete this._searchIsVisible;this._toggleSearchBar(false);}
resetSearch(){this._clearSearch();this._updateReplaceVisibility();this._matchesElement.textContent='';}
refreshSearch(){if(!this._searchIsVisible){return;}
this.resetSearch();this._performSearch(false,false);}
handleFindNextShortcut(){if(!this._searchIsVisible){return false;}
this._searchProvider.jumpToNextSearchResult();return true;}
handleFindPreviousShortcut(){if(!this._searchIsVisible){return false;}
this._searchProvider.jumpToPreviousSearchResult();return true;}
handleFindShortcut(){this.showSearchField();return true;}
handleCancelSearchShortcut(){if(!this._searchIsVisible){return false;}
this.closeSearch();return true;}
_updateSearchNavigationButtonState(enabled){this._replaceButtonElement.disabled=!enabled;this._replaceAllButtonElement.disabled=!enabled;this._searchNavigationPrevElement.classList.toggle('enabled',enabled);this._searchNavigationNextElement.classList.toggle('enabled',enabled);}
_updateSearchMatchesCountAndCurrentMatchIndex(matches,currentMatchIndex){if(!this._currentQuery){this._matchesElement.textContent='';}else if(matches===0||currentMatchIndex>=0){this._matchesElement.textContent=UIString.UIString('%d of %d',currentMatchIndex+1,matches);}else if(matches===1){this._matchesElement.textContent=UIString.UIString('1 match');}else{this._matchesElement.textContent=UIString.UIString('%d matches',matches);}
this._updateSearchNavigationButtonState(matches>0);}
showSearchField(){if(this._searchIsVisible){this.cancelSearch();}
let queryCandidate;if(!this._searchInputElement.hasFocus()){const selection=self.UI.inspectorView.element.window().getSelection();if(selection.rangeCount){queryCandidate=selection.toString().replace(/\r?\n.*/,'');}}
this._toggleSearchBar(true);this._updateReplaceVisibility();if(queryCandidate){this._searchInputElement.value=queryCandidate;}
this._performSearch(false,false);this._searchInputElement.focus();this._searchInputElement.select();this._searchIsVisible=true;}
_updateReplaceVisibility(){this._replaceToggleButton.setVisible(this._replaceable);if(!this._replaceable){this._replaceToggleButton.setToggled(false);this._updateSecondRowVisibility();}}
_onSearchKeyDown(event){if(isEscKey(event)){this.closeSearch();event.consume(true);return;}
if(!isEnterKey(event)){return;}
if(!this._currentQuery){this._performSearch(true,true,event.shiftKey);}else{this._jumpToNextSearchResult(event.shiftKey);}}
_onReplaceKeyDown(event){if(isEnterKey(event)){this._replace();}}
_jumpToNextSearchResult(isBackwardSearch){if(!this._currentQuery){return;}
if(isBackwardSearch){this._searchProvider.jumpToPreviousSearchResult();}else{this._searchProvider.jumpToNextSearchResult();}}
_onNextButtonSearch(event){if(!this._searchNavigationNextElement.classList.contains('enabled')){return;}
this._jumpToNextSearchResult();this._searchInputElement.focus();}
_onPrevButtonSearch(event){if(!this._searchNavigationPrevElement.classList.contains('enabled')){return;}
this._jumpToNextSearchResult(true);this._searchInputElement.focus();}
_onFindClick(event){if(!this._currentQuery){this._performSearch(true,true);}else{this._jumpToNextSearchResult();}
this._searchInputElement.focus();}
_onPreviousClick(event){if(!this._currentQuery){this._performSearch(true,true,true);}else{this._jumpToNextSearchResult(true);}
this._searchInputElement.focus();}
_clearSearch(){delete this._currentQuery;if(!!this._searchProvider.currentQuery){delete this._searchProvider.currentQuery;this._searchProvider.searchCanceled();}
this._updateSearchMatchesCountAndCurrentMatchIndex(0,-1);}
_performSearch(forceSearch,shouldJump,jumpBackwards){const query=this._searchInputElement.value;if(!query||(!forceSearch&&query.length<this._minimalSearchQuerySize&&!this._currentQuery)){this._clearSearch();return;}
this._currentQuery=query;this._searchProvider.currentQuery=query;const searchConfig=this._currentSearchConfig();this._searchProvider.performSearch(searchConfig,shouldJump,jumpBackwards);}
_currentSearchConfig(){const query=this._searchInputElement.value;const caseSensitive=this._caseSensitiveButton?this._caseSensitiveButton.toggled():false;const isRegex=this._regexButton?this._regexButton.toggled():false;return new SearchConfig(query,caseSensitive,isRegex);}
_updateSecondRowVisibility(){const secondRowVisible=this._replaceToggleButton.toggled();this._footerElementContainer.classList.toggle('replaceable',secondRowVisible);this._secondRowButtons.classList.toggle('hidden',!secondRowVisible);this._replaceInputElement.classList.toggle('hidden',!secondRowVisible);if(secondRowVisible){this._replaceInputElement.focus();}else{this._searchInputElement.focus();}
this.doResize();}
_replace(){const searchConfig=this._currentSearchConfig();(this._searchProvider).replaceSelectionWith(searchConfig,this._replaceInputElement.value);delete this._currentQuery;this._performSearch(true,true);}
_replaceAll(){const searchConfig=this._currentSearchConfig();(this._searchProvider).replaceAllWith(searchConfig,this._replaceInputElement.value);}
_onInput(event){if(this._valueChangedTimeoutId){clearTimeout(this._valueChangedTimeoutId);}
const timeout=this._searchInputElement.value.length<3?200:0;this._valueChangedTimeoutId=setTimeout(this._onValueChanged.bind(this),timeout);}
_onValueChanged(){if(!this._searchIsVisible){return;}
delete this._valueChangedTimeoutId;this._performSearch(false,true);}}
const _symbol$1=Symbol('searchableView');class Searchable{searchCanceled(){}
performSearch(searchConfig,shouldJump,jumpBackwards){}
jumpToNextSearchResult(){}
jumpToPreviousSearchResult(){}
supportsCaseSensitiveSearch(){}
supportsRegexSearch(){}}
class Replaceable{replaceSelectionWith(searchConfig,replacement){}
replaceAllWith(searchConfig,replacement){}}
class SearchConfig{constructor(query,caseSensitive,isRegex){this.query=query;this.caseSensitive=caseSensitive;this.isRegex=isRegex;}
toSearchRegex(global){let modifiers=this.caseSensitive?'':'i';if(global){modifiers+='g';}
const query=this.isRegex?'/'+this.query+'/':this.query;let regex;try{if(/^\/.+\/$/.test(query)){regex=new RegExp(query.substring(1,query.length-1),modifiers);regex.__fromRegExpQuery=true;}}catch(e){}
if(!regex){regex=createPlainTextSearchRegex(query,modifiers);}
return regex;}}
var SearchableView$1=Object.freeze({__proto__:null,SearchableView:SearchableView,_symbol:_symbol$1,Searchable:Searchable,Replaceable:Replaceable,SearchConfig:SearchConfig});class Panel extends VBox{constructor(name){super();this.element.classList.add('panel');this.element.setAttribute('aria-label',name);this.element.classList.add(name);this._panelName=name;UI.panels[name]=this;}
get name(){return this._panelName;}
searchableView(){return null;}
elementsToRestoreScrollPositionsFor(){return[];}}
class PanelWithSidebar extends Panel{constructor(name,defaultWidth){super(name);this._panelSplitWidget=new SplitWidget(true,false,this._panelName+'PanelSplitViewState',defaultWidth||200);this._panelSplitWidget.show(this.element);this._mainWidget=new VBox();this._panelSplitWidget.setMainWidget(this._mainWidget);this._sidebarWidget=new VBox();this._sidebarWidget.setMinimumSize(100,25);this._panelSplitWidget.setSidebarWidget(this._sidebarWidget);this._sidebarWidget.element.classList.add('panel-sidebar');}
panelSidebarElement(){return this._sidebarWidget.element;}
mainElement(){return this._mainWidget.element;}
splitWidget(){return this._panelSplitWidget;}}
var Panel$1=Object.freeze({__proto__:null,Panel:Panel,PanelWithSidebar:PanelWithSidebar});class TabbedPane extends VBox{constructor(){super(true);this.registerRequiredCSS('ui/tabbedPane.css');this.element.classList.add('tabbed-pane');this.contentElement.classList.add('tabbed-pane-shadow');this.contentElement.tabIndex=-1;this.setDefaultFocusedElement(this.contentElement);this._headerElement=this.contentElement.createChild('div','tabbed-pane-header');this._headerContentsElement=this._headerElement.createChild('div','tabbed-pane-header-contents');this._tabSlider=createElementWithClass('div','tabbed-pane-tab-slider');this._tabsElement=this._headerContentsElement.createChild('div','tabbed-pane-header-tabs');this._tabsElement.setAttribute('role','tablist');this._tabsElement.addEventListener('keydown',this._keyDown.bind(this),false);this._contentElement=this.contentElement.createChild('div','tabbed-pane-content');this._contentElement.createChild('slot');this._tabs=[];this._tabsHistory=[];this._tabsById=new Map();this._currentTabLocked=false;this._autoSelectFirstItemOnShow=true;this._triggerDropDownTimeout=null;this._dropDownButton=this._createDropDownButton();ZoomManager.instance().addEventListener(Events$5.ZoomChanged,this._zoomChanged,this);this.makeTabSlider();}
setAccessibleName(name){setAccessibleName(this._tabsElement,name);}
setCurrentTabLocked(locked){this._currentTabLocked=locked;this._headerElement.classList.toggle('locked',this._currentTabLocked);}
setAutoSelectFirstItemOnShow(autoSelect){this._autoSelectFirstItemOnShow=autoSelect;}
get visibleView(){return this._currentTab?this._currentTab.view:null;}
tabIds(){return this._tabs.map(tab=>tab._id);}
tabIndex(tabId){return this._tabs.findIndex(tab=>tab.id===tabId);}
tabViews(){return this._tabs.map(tab=>tab.view);}
tabView(tabId){return this._tabsById.has(tabId)?this._tabsById.get(tabId).view:null;}
get selectedTabId(){return this._currentTab?this._currentTab.id:null;}
setShrinkableTabs(shrinkableTabs){this._shrinkableTabs=shrinkableTabs;}
makeVerticalTabLayout(){this._verticalTabLayout=true;this._setTabSlider(false);this.contentElement.classList.add('vertical-tab-layout');this.invalidateConstraints();}
setCloseableTabs(closeableTabs){this._closeableTabs=closeableTabs;}
focus(){if(this.visibleView){this.visibleView.focus();}else{this._defaultFocusedElement.focus();}}
focusSelectedTabHeader(){const selectedTab=this._currentTab;if(selectedTab){selectedTab.tabElement.focus();}}
headerElement(){return this._headerElement;}
isTabCloseable(id){const tab=this._tabsById.get(id);return tab?tab.isCloseable():false;}
setTabDelegate(delegate){const tabs=this._tabs.slice();for(let i=0;i<tabs.length;++i){tabs[i].setDelegate(delegate);}
this._delegate=delegate;}
appendTab(id,tabTitle,view,tabTooltip,userGesture,isCloseable,index){isCloseable=typeof isCloseable==='boolean'?isCloseable:this._closeableTabs;const tab=new TabbedPaneTab(this,id,tabTitle,isCloseable,view,tabTooltip);tab.setDelegate(this._delegate);console.assert(!this._tabsById.has(id),`Tabbed pane already contains a tab with id '${id}'`);this._tabsById.set(id,tab);if(index!==undefined){this._tabs.splice(index,0,tab);}else{this._tabs.push(tab);}
this._tabsHistory.push(tab);if(this._tabsHistory[0]===tab&&this.isShowing()){this.selectTab(tab.id,userGesture);}
this._updateTabElements();}
closeTab(id,userGesture){this.closeTabs([id],userGesture);}
closeTabs(ids,userGesture){const focused=this.hasFocus();for(let i=0;i<ids.length;++i){this._innerCloseTab(ids[i],userGesture);}
this._updateTabElements();if(this._tabsHistory.length){this.selectTab(this._tabsHistory[0].id,false);}
if(focused){this.focus();}}
_innerCloseTab(id,userGesture){if(!this._tabsById.has(id)){return;}
if(userGesture&&!this._tabsById.get(id)._closeable){return;}
if(this._currentTab&&this._currentTab.id===id){this._hideCurrentTab();}
const tab=this._tabsById.get(id);this._tabsById.delete(id);this._tabsHistory.splice(this._tabsHistory.indexOf(tab),1);this._tabs.splice(this._tabs.indexOf(tab),1);if(tab._shown){this._hideTabElement(tab);}
const eventData={prevTabId:undefined,tabId:id,view:tab.view,isUserGesture:userGesture};this.dispatchEventToListeners(Events$8.TabClosed,eventData);return true;}
hasTab(tabId){return this._tabsById.has(tabId);}
otherTabs(id){const result=[];for(let i=0;i<this._tabs.length;++i){if(this._tabs[i].id!==id){result.push(this._tabs[i].id);}}
return result;}
_tabsToTheRight(id){let index=-1;for(let i=0;i<this._tabs.length;++i){if(this._tabs[i].id===id){index=i;break;}}
if(index===-1){return[];}
return this._tabs.slice(index+1).map(function(tab){return tab.id;});}
_viewHasFocus(){if(this.visibleView&&this.visibleView.hasFocus()){return true;}
return this.contentElement===this.contentElement.getComponentRoot().activeElement;}
selectTab(id,userGesture,forceFocus){if(this._currentTabLocked){return false;}
const focused=this._viewHasFocus();const tab=this._tabsById.get(id);if(!tab){return false;}
const eventData={prevTabId:this._currentTab?this._currentTab.id:undefined,tabId:id,view:tab.view,isUserGesture:userGesture,};this.dispatchEventToListeners(Events$8.TabInvoked,eventData);if(this._currentTab&&this._currentTab.id===id){return true;}
this.suspendInvalidations();this._hideCurrentTab();this._showTab(tab);this.resumeInvalidations();this._currentTab=tab;this._tabsHistory.splice(this._tabsHistory.indexOf(tab),1);this._tabsHistory.splice(0,0,tab);this._updateTabElements();if(focused||forceFocus){this.focus();}
this.dispatchEventToListeners(Events$8.TabSelected,eventData);return true;}
selectNextTab(){const index=this._tabs.indexOf(this._currentTab);const nextIndex=NumberUtilities.mod(index+1,this._tabs.length);this.selectTab(this._tabs[nextIndex].id,true);}
selectPrevTab(){const index=this._tabs.indexOf(this._currentTab);const nextIndex=NumberUtilities.mod(index-1,this._tabs.length);this.selectTab(this._tabs[nextIndex].id,true);}
lastOpenedTabIds(tabsCount){function tabToTabId(tab){return tab.id;}
return this._tabsHistory.slice(0,tabsCount).map(tabToTabId);}
setTabIcon(id,icon){const tab=this._tabsById.get(id);tab._setIcon(icon);this._updateTabElements();}
setTabEnabled(id,enabled){const tab=this._tabsById.get(id);tab.tabElement.classList.toggle('disabled',!enabled);}
toggleTabClass(id,className,force){const tab=this._tabsById.get(id);if(tab._toggleClass(className,force)){this._updateTabElements();}}
_zoomChanged(event){for(let i=0;i<this._tabs.length;++i){delete this._tabs[i]._measuredWidth;}
if(this.isShowing()){this._updateTabElements();}}
changeTabTitle(id,tabTitle,tabTooltip){const tab=this._tabsById.get(id);if(tabTooltip!==undefined){tab.tooltip=tabTooltip;}
if(tab.title!==tabTitle){tab.title=tabTitle;setAccessibleName(tab.tabElement,tabTitle);this._updateTabElements();}}
changeTabView(id,view){const tab=this._tabsById.get(id);if(tab.view===view){return;}
this.suspendInvalidations();const isSelected=this._currentTab&&this._currentTab.id===id;const shouldFocus=tab.view.hasFocus();if(isSelected){this._hideTab(tab);}
tab.view=view;if(isSelected){this._showTab(tab);}
if(shouldFocus){tab.view.focus();}
this.resumeInvalidations();}
onResize(){this._updateTabElements();}
headerResized(){this._updateTabElements();}
wasShown(){const effectiveTab=this._currentTab||this._tabsHistory[0];if(effectiveTab&&this._autoSelectFirstItemOnShow){this.selectTab(effectiveTab.id);}}
makeTabSlider(){if(this._verticalTabLayout){return;}
this._setTabSlider(true);}
_setTabSlider(enable){this._sliderEnabled=enable;this._tabSlider.classList.toggle('enabled',enable);}
calculateConstraints(){let constraints=super.calculateConstraints();const minContentConstraints=new Constraints(new Size(0,0),new Size(50,50));constraints=constraints.widthToMax(minContentConstraints).heightToMax(minContentConstraints);if(this._verticalTabLayout){constraints=constraints.addWidth(new Constraints(new Size(120,0)));}else{constraints=constraints.addHeight(new Constraints(new Size(0,30)));}
return constraints;}
_updateTabElements(){invokeOnceAfterBatchUpdate(this,this._innerUpdateTabElements);}
setPlaceholderElement(element,focusedElement){this._placeholderElement=element;if(focusedElement){this._focusedPlaceholderElement=focusedElement;}
if(this._placeholderContainerElement){this._placeholderContainerElement.removeChildren();this._placeholderContainerElement.appendChild(element);}}
async waitForTabElementUpdate(){this._innerUpdateTabElements();}
_innerUpdateTabElements(){if(!this.isShowing()){return;}
if(!this._tabs.length){this._contentElement.classList.add('has-no-tabs');if(this._placeholderElement&&!this._placeholderContainerElement){this._placeholderContainerElement=this._contentElement.createChild('div','tabbed-pane-placeholder fill');this._placeholderContainerElement.appendChild(this._placeholderElement);if(this._focusedPlaceholderElement){this.setDefaultFocusedElement(this._focusedPlaceholderElement);this.focus();}}}else{this._contentElement.classList.remove('has-no-tabs');if(this._placeholderContainerElement){this._placeholderContainerElement.remove();this.setDefaultFocusedElement(this.contentElement);delete this._placeholderContainerElement;}}
this._measureDropDownButton();this._updateWidths();this._updateTabsDropDown();this._updateTabSlider();}
_showTabElement(index,tab){if(index>=this._tabsElement.children.length){this._tabsElement.appendChild(tab.tabElement);}else{this._tabsElement.insertBefore(tab.tabElement,this._tabsElement.children[index]);}
tab._shown=true;}
_hideTabElement(tab){this._tabsElement.removeChild(tab.tabElement);tab._shown=false;}
_createDropDownButton(){const dropDownContainer=createElementWithClass('div','tabbed-pane-header-tabs-drop-down-container');const chevronIcon=Icon.create('largeicon-chevron','chevron-icon');markAsMenuButton(dropDownContainer);setAccessibleName(dropDownContainer,ls`More tabs`);dropDownContainer.tabIndex=0;dropDownContainer.appendChild(chevronIcon);dropDownContainer.addEventListener('click',this._dropDownClicked.bind(this));dropDownContainer.addEventListener('keydown',this._dropDownKeydown.bind(this));dropDownContainer.addEventListener('mousedown',event=>{if(event.which!==1||this._triggerDropDownTimeout){return;}
this._triggerDropDownTimeout=setTimeout(this._dropDownClicked.bind(this,event),200);});return dropDownContainer;}
_dropDownClicked(event){if(event.which!==1){return;}
if(this._triggerDropDownTimeout){clearTimeout(this._triggerDropDownTimeout);this._triggerDropDownTimeout=null;}
const rect=this._dropDownButton.getBoundingClientRect();const menu=new ContextMenu(event,false,rect.left,rect.bottom);for(const tab of this._tabs){if(tab._shown){continue;}
if(this._numberOfTabsShown()===0&&this._tabsHistory[0]===tab){menu.defaultSection().appendCheckboxItem(tab.title,this._dropDownMenuItemSelected.bind(this,tab),true);}else{menu.defaultSection().appendItem(tab.title,this._dropDownMenuItemSelected.bind(this,tab));}}
menu.show();}
_dropDownKeydown(event){if(isEnterOrSpaceKey(event)){this._dropDownButton.click();event.consume(true);}}
_dropDownMenuItemSelected(tab){this._lastSelectedOverflowTab=tab;this.selectTab(tab.id,true,true);}
_totalWidth(){return this._headerContentsElement.getBoundingClientRect().width;}
_numberOfTabsShown(){let numTabsShown=0;for(const tab of this._tabs){if(tab._shown){numTabsShown++;}}
return numTabsShown;}
disableOverflowMenu(){this._overflowDisabled=true;}
_updateTabsDropDown(){const tabsToShowIndexes=this._tabsToShowIndexes(this._tabs,this._tabsHistory,this._totalWidth(),this._measuredDropDownButtonWidth||0);if(this._lastSelectedOverflowTab&&this._numberOfTabsShown()!==tabsToShowIndexes.length){delete this._lastSelectedOverflowTab;this._updateTabsDropDown();return;}
for(let i=0;i<this._tabs.length;++i){if(this._tabs[i]._shown&&tabsToShowIndexes.indexOf(i)===-1){this._hideTabElement(this._tabs[i]);}}
for(let i=0;i<tabsToShowIndexes.length;++i){const tab=this._tabs[tabsToShowIndexes[i]];if(!tab._shown){this._showTabElement(i,tab);}}
if(!this._overflowDisabled){this._maybeShowDropDown(tabsToShowIndexes.length!==this._tabs.length);}}
_maybeShowDropDown(hasMoreTabs){if(hasMoreTabs&&!this._dropDownButton.parentElement){this._headerContentsElement.appendChild(this._dropDownButton);}else if(!hasMoreTabs&&this._dropDownButton.parentElement){this._headerContentsElement.removeChild(this._dropDownButton);}}
_measureDropDownButton(){if(this._overflowDisabled||this._measuredDropDownButtonWidth){return;}
this._dropDownButton.classList.add('measuring');this._headerContentsElement.appendChild(this._dropDownButton);this._measuredDropDownButtonWidth=this._dropDownButton.getBoundingClientRect().width;this._headerContentsElement.removeChild(this._dropDownButton);this._dropDownButton.classList.remove('measuring');}
_updateWidths(){const measuredWidths=this._measureWidths();const maxWidth=this._shrinkableTabs?this._calculateMaxWidth(measuredWidths.slice(),this._totalWidth()):Number.MAX_VALUE;let i=0;for(const tab of this._tabs){tab.setWidth(this._verticalTabLayout?-1:Math.min(maxWidth,measuredWidths[i++]));}}
_measureWidths(){this._tabsElement.style.setProperty('width','2000px');const measuringTabElements=[];for(const tab of this._tabs){if(typeof tab._measuredWidth==='number'){continue;}
const measuringTabElement=tab._createTabElement(true);measuringTabElement.__tab=tab;measuringTabElements.push(measuringTabElement);this._tabsElement.appendChild(measuringTabElement);}
for(let i=0;i<measuringTabElements.length;++i){const width=measuringTabElements[i].getBoundingClientRect().width;measuringTabElements[i].__tab._measuredWidth=Math.ceil(width);}
for(let i=0;i<measuringTabElements.length;++i){measuringTabElements[i].remove();}
const measuredWidths=[];for(const tab of this._tabs){measuredWidths.push(tab._measuredWidth);}
this._tabsElement.style.removeProperty('width');return measuredWidths;}
_calculateMaxWidth(measuredWidths,totalWidth){if(!measuredWidths.length){return 0;}
measuredWidths.sort(function(x,y){return x-y;});let totalMeasuredWidth=0;for(let i=0;i<measuredWidths.length;++i){totalMeasuredWidth+=measuredWidths[i];}
if(totalWidth>=totalMeasuredWidth){return measuredWidths[measuredWidths.length-1];}
let totalExtraWidth=0;for(let i=measuredWidths.length-1;i>0;--i){const extraWidth=measuredWidths[i]-measuredWidths[i-1];totalExtraWidth+=(measuredWidths.length-i)*extraWidth;if(totalWidth+totalExtraWidth>=totalMeasuredWidth){return measuredWidths[i-1]+
(totalWidth+totalExtraWidth-totalMeasuredWidth)/(measuredWidths.length-i);}}
return totalWidth/measuredWidths.length;}
_tabsToShowIndexes(tabsOrdered,tabsHistory,totalWidth,measuredDropDownButtonWidth){const tabsToShowIndexes=[];let totalTabsWidth=0;const tabCount=tabsOrdered.length;const tabsToLookAt=tabsOrdered.slice(0);if(this._currentTab!==undefined){tabsToLookAt.unshift(tabsToLookAt.splice(tabsToLookAt.indexOf(this._currentTab),1)[0]);}
if(this._lastSelectedOverflowTab!==undefined){tabsToLookAt.unshift(tabsToLookAt.splice(tabsToLookAt.indexOf(this._lastSelectedOverflowTab),1)[0]);}
for(let i=0;i<tabCount;++i){const tab=this._automaticReorder?tabsHistory[i]:tabsToLookAt[i];totalTabsWidth+=tab.width();let minimalRequiredWidth=totalTabsWidth;if(i!==tabCount-1){minimalRequiredWidth+=measuredDropDownButtonWidth;}
if(!this._verticalTabLayout&&minimalRequiredWidth>totalWidth){break;}
tabsToShowIndexes.push(tabsOrdered.indexOf(tab));}
tabsToShowIndexes.sort(function(x,y){return x-y;});return tabsToShowIndexes;}
_hideCurrentTab(){if(!this._currentTab){return;}
this._hideTab(this._currentTab);delete this._currentTab;}
_showTab(tab){tab.tabElement.tabIndex=0;tab.tabElement.classList.add('selected');setSelected(tab.tabElement,true);tab.view.show(this.element);this._updateTabSlider();}
_updateTabSlider(){if(!this._sliderEnabled){return;}
if(!this._currentTab){this._tabSlider.style.width=0;return;}
let left=0;for(let i=0;i<this._tabs.length&&this._currentTab!==this._tabs[i];i++){if(this._tabs[i]._shown){left+=this._tabs[i]._measuredWidth;}}
const sliderWidth=this._currentTab._shown?this._currentTab._measuredWidth:this._dropDownButton.offsetWidth;const scaleFactor=window.devicePixelRatio>=1.5?' scaleY(0.75)':'';this._tabSlider.style.transform='translateX('+left+'px)'+scaleFactor;this._tabSlider.style.width=sliderWidth+'px';if(this._tabSlider.parentElement!==this._headerContentsElement){this._headerContentsElement.appendChild(this._tabSlider);}}
_hideTab(tab){tab.tabElement.removeAttribute('tabIndex');tab.tabElement.classList.remove('selected');tab.tabElement.setAttribute('aria-selected','false');tab.view.detach();}
elementsToRestoreScrollPositionsFor(){return[this._contentElement];}
_insertBefore(tab,index){this._tabsElement.insertBefore(tab.tabElement,this._tabsElement.childNodes[index]);const oldIndex=this._tabs.indexOf(tab);this._tabs.splice(oldIndex,1);if(oldIndex<index){--index;}
this._tabs.splice(index,0,tab);const eventData={prevTabId:undefined,tabId:tab.id,view:tab.view,isUserGesture:undefined};this.dispatchEventToListeners(Events$8.TabOrderChanged,eventData);}
leftToolbar(){if(!this._leftToolbar){this._leftToolbar=new Toolbar('tabbed-pane-left-toolbar');this._headerElement.insertBefore(this._leftToolbar.element,this._headerElement.firstChild);}
return this._leftToolbar;}
rightToolbar(){if(!this._rightToolbar){this._rightToolbar=new Toolbar('tabbed-pane-right-toolbar');this._headerElement.appendChild(this._rightToolbar.element);}
return this._rightToolbar;}
setAllowTabReorder(allow,automatic){this._allowTabReorder=allow;this._automaticReorder=automatic;}
_keyDown(event){if(!this._currentTab){return;}
let nextTabElement=null;switch(event.key){case'ArrowUp':case'ArrowLeft':nextTabElement=this._currentTab.tabElement.previousElementSibling;if(!nextTabElement&&!this._dropDownButton.parentElement){nextTabElement=this._currentTab.tabElement.parentElement.lastElementChild;}
break;case'ArrowDown':case'ArrowRight':nextTabElement=this._currentTab.tabElement.nextElementSibling;if(!nextTabElement&&!this._dropDownButton.parentElement){nextTabElement=this._currentTab.tabElement.parentElement.firstElementChild;}
break;case'Enter':case' ':this._currentTab.view.focus();return;default:return;}
if(!nextTabElement){this._dropDownButton.click();return;}
const tab=this._tabs.find(tab=>tab.tabElement===nextTabElement);this.selectTab(tab.id,true);nextTabElement.focus();}}
let EventData;const Events$8={TabInvoked:Symbol('TabInvoked'),TabSelected:Symbol('TabSelected'),TabClosed:Symbol('TabClosed'),TabOrderChanged:Symbol('TabOrderChanged')};class TabbedPaneTab{constructor(tabbedPane,id,title,closeable,view,tooltip){this._closeable=closeable;this._tabbedPane=tabbedPane;this._id=id;this._title=title;this._tooltip=tooltip;this._view=view;this._shown=false;this._measuredWidth;this._tabElement;this._iconContainer=null;}
get id(){return this._id;}
get title(){return this._title;}
set title(title){if(title===this._title){return;}
this._title=title;if(this._titleElement){this._titleElement.textContent=title;}
delete this._measuredWidth;}
isCloseable(){return this._closeable;}
_setIcon(icon){this._icon=icon;if(this._tabElement){this._createIconElement(this._tabElement,this._titleElement,false);}
delete this._measuredWidth;}
_toggleClass(className,force){const element=this.tabElement;const hasClass=element.classList.contains(className);if(hasClass===force){return false;}
element.classList.toggle(className,force);delete this._measuredWidth;return true;}
get view(){return this._view;}
set view(view){this._view=view;}
get tooltip(){return this._tooltip;}
set tooltip(tooltip){this._tooltip=tooltip;if(this._titleElement){this._titleElement.title=tooltip||'';}}
get tabElement(){if(!this._tabElement){this._tabElement=this._createTabElement(false);}
return this._tabElement;}
width(){return this._width;}
setWidth(width){this.tabElement.style.width=width===-1?'':(width+'px');this._width=width;}
setDelegate(delegate){this._delegate=delegate;}
_createIconElement(tabElement,titleElement,measuring){if(tabElement.__iconElement){tabElement.__iconElement.remove();tabElement.__iconElement=null;}
if(!this._icon){return;}
const iconContainer=createElementWithClass('span','tabbed-pane-header-tab-icon');const iconNode=measuring?this._icon.cloneNode(true):this._icon;iconContainer.appendChild(iconNode);tabElement.insertBefore(iconContainer,titleElement);tabElement.__iconElement=iconContainer;}
_createTabElement(measuring){const tabElement=createElementWithClass('div','tabbed-pane-header-tab');tabElement.id='tab-'+this._id;markAsTab(tabElement);setSelected(tabElement,false);setAccessibleName(tabElement,this.title);const titleElement=tabElement.createChild('span','tabbed-pane-header-tab-title');titleElement.textContent=this.title;titleElement.title=this.tooltip||'';this._createIconElement(tabElement,titleElement,measuring);if(!measuring){this._titleElement=titleElement;}
if(this._closeable){const closeButton=tabElement.createChild('div','tabbed-pane-close-button','dt-close-button');closeButton.gray=true;closeButton.setAccessibleName(ls`Close ${this.title}`);tabElement.classList.add('closeable');}
if(measuring){tabElement.classList.add('measuring');}else{tabElement.addEventListener('click',this._tabClicked.bind(this),false);tabElement.addEventListener('auxclick',this._tabClicked.bind(this),false);tabElement.addEventListener('mousedown',this._tabMouseDown.bind(this),false);tabElement.addEventListener('mouseup',this._tabMouseUp.bind(this),false);tabElement.addEventListener('contextmenu',this._tabContextMenu.bind(this),false);if(this._tabbedPane._allowTabReorder){installDragHandle(tabElement,this._startTabDragging.bind(this),this._tabDragging.bind(this),this._endTabDragging.bind(this),'-webkit-grabbing','pointer',200);}}
return tabElement;}
_tabClicked(event){const middleButton=event.button===1;const shouldClose=this._closeable&&(middleButton||event.target.classList.contains('tabbed-pane-close-button'));if(!shouldClose){this._tabbedPane.focus();return;}
this._closeTabs([this.id]);event.consume(true);}
_tabMouseDown(event){if(event.target.classList.contains('tabbed-pane-close-button')||event.button===1){return;}
this._tabbedPane.selectTab(this.id,true);}
_tabMouseUp(event){if(event.button===1){event.consume(true);}}
_closeTabs(ids){if(this._delegate){this._delegate.closeTabs(this._tabbedPane,ids);return;}
this._tabbedPane.closeTabs(ids,true);}
_tabContextMenu(event){function close(){this._closeTabs([this.id]);}
function closeOthers(){this._closeTabs(this._tabbedPane.otherTabs(this.id));}
function closeAll(){this._closeTabs(this._tabbedPane.tabIds());}
function closeToTheRight(){this._closeTabs(this._tabbedPane._tabsToTheRight(this.id));}
const contextMenu=new ContextMenu(event);if(this._closeable){contextMenu.defaultSection().appendItem(UIString.UIString('Close'),close.bind(this));contextMenu.defaultSection().appendItem(UIString.UIString('Close others'),closeOthers.bind(this));contextMenu.defaultSection().appendItem(UIString.UIString('Close tabs to the right'),closeToTheRight.bind(this));contextMenu.defaultSection().appendItem(UIString.UIString('Close all'),closeAll.bind(this));}
if(this._delegate){this._delegate.onContextMenu(this.id,contextMenu);}
contextMenu.show();}
_startTabDragging(event){if(event.target.classList.contains('tabbed-pane-close-button')){return false;}
this._dragStartX=event.pageX;this._tabElement.classList.add('dragging');this._tabbedPane._tabSlider.remove();return true;}
_tabDragging(event){const tabElements=this._tabbedPane._tabsElement.childNodes;for(let i=0;i<tabElements.length;++i){let tabElement=tabElements[i];if(tabElement===this._tabElement){continue;}
const intersects=tabElement.offsetLeft+tabElement.clientWidth>this._tabElement.offsetLeft&&this._tabElement.offsetLeft+this._tabElement.clientWidth>tabElement.offsetLeft;if(!intersects){continue;}
if(Math.abs(event.pageX-this._dragStartX)<tabElement.clientWidth/2+5){break;}
if(event.pageX-this._dragStartX>0){tabElement=tabElement.nextSibling;++i;}
const oldOffsetLeft=this._tabElement.offsetLeft;this._tabbedPane._insertBefore(this,i);this._dragStartX+=this._tabElement.offsetLeft-oldOffsetLeft;break;}
if(!this._tabElement.previousSibling&&event.pageX-this._dragStartX<0){this._tabElement.style.setProperty('left','0px');return;}
if(!this._tabElement.nextSibling&&event.pageX-this._dragStartX>0){this._tabElement.style.setProperty('left','0px');return;}
this._tabElement.style.setProperty('left',(event.pageX-this._dragStartX)+'px');}
_endTabDragging(event){this._tabElement.classList.remove('dragging');this._tabElement.style.removeProperty('left');delete this._dragStartX;this._tabbedPane._updateTabSlider();}}
class TabbedPaneTabDelegate{closeTabs(tabbedPane,ids){}
onContextMenu(tabId,contextMenu){}}
var TabbedPane$1=Object.freeze({__proto__:null,TabbedPane:TabbedPane,EventData:EventData,Events:Events$8,TabbedPaneTab:TabbedPaneTab,TabbedPaneTabDelegate:TabbedPaneTabDelegate});let viewManagerInstance;class ViewManager{constructor(){this._views=new Map();this._locationNameByViewId=new Map();for(const extension of self.runtime.extensions('view')){const descriptor=extension.descriptor();this._views.set(descriptor['id'],new ProvidedView(extension));this._locationNameByViewId.set(descriptor['id'],descriptor['location']);}}
static instance(opts={forceNew:null}){const{forceNew}=opts;if(!viewManagerInstance||forceNew){viewManagerInstance=new ViewManager();}
return viewManagerInstance;}
static _createToolbar(toolbarItems){if(!toolbarItems.length){return null;}
const toolbar=new Toolbar('');for(const item of toolbarItems){toolbar.appendToolbarItem(item);}
return toolbar.element;}
revealView(view){const location=(view[_Location.symbol]);if(!location){return Promise.resolve();}
location._reveal();return location.showView(view);}
view(viewId){return this._views.get(viewId);}
materializedWidget(viewId){const view=this.view(viewId);return view?view[widgetSymbol]:null;}
showView(viewId,userGesture,omitFocus){const view=this._views.get(viewId);if(!view){console.error('Could not find view for id: \''+viewId+'\' '+new Error().stack);return Promise.resolve();}
const locationName=this._locationNameByViewId.get(viewId);const location=view[_Location.symbol];if(location){location._reveal();return location.showView(view,undefined,userGesture,omitFocus);}
return this.resolveLocation(locationName).then(location=>{if(!location){throw new Error('Could not resolve location for view: '+viewId);}
location._reveal();return location.showView(view,undefined,userGesture,omitFocus);});}
resolveLocation(location){if(!location){return(Promise.resolve(null));}
const resolverExtensions=self.runtime.extensions(ViewLocationResolver).filter(extension=>extension.descriptor()['name']===location);if(!resolverExtensions.length){throw new Error('Unresolved location: '+location);}
const resolverExtension=resolverExtensions[0];return resolverExtension.instance().then(resolver=>(resolver.resolveLocation(location)));}
createTabbedLocation(revealCallback,location,restoreSelection,allowReorder,defaultTab){return new _TabbedLocation(this,revealCallback,location,restoreSelection,allowReorder,defaultTab);}
createStackLocation(revealCallback,location){return new _StackLocation(this,revealCallback,location);}
hasViewsForLocation(location){return!!this._viewsForLocation(location).length;}
_viewsForLocation(location){const result=[];for(const id of this._views.keys()){if(this._locationNameByViewId.get(id)===location){result.push(this._views.get(id));}}
return result;}}
class ContainerWidget extends VBox{constructor(view){super();this.element.classList.add('flex-auto','view-container','overflow-auto');this._view=view;this.element.tabIndex=-1;markAsTabpanel(this.element);setAccessibleName(this.element,ls`${view.title()} panel`);this.setDefaultFocusedElement(this.element);}
_materialize(){if(this._materializePromise){return this._materializePromise;}
const promises=[];promises.push(this._view.toolbarItems().then(toolbarItems=>{const toolbarElement=ViewManager._createToolbar(toolbarItems);if(toolbarElement){this.element.insertBefore(toolbarElement,this.element.firstChild);}}));promises.push(this._view.widget().then(widget=>{const shouldFocus=this.element.hasFocus();this.setDefaultFocusedElement(null);this._view[widgetSymbol]=widget;widget.show(this.element);if(shouldFocus){widget.focus();}}));this._materializePromise=Promise.all(promises);return this._materializePromise;}
wasShown(){this._materialize().then(()=>{this._view[widgetSymbol].show(this.element);this._wasShownForTest();});}
_wasShownForTest(){}}
class _ExpandableContainerWidget extends VBox{constructor(view){super(true);this.element.classList.add('flex-none');this.registerRequiredCSS('ui/viewContainers.css');this._titleElement=createElementWithClass('div','expandable-view-title');markAsButton(this._titleElement);this._titleExpandIcon=Icon.create('smallicon-triangle-right','title-expand-icon');this._titleElement.appendChild(this._titleExpandIcon);const titleText=view.title();this._titleElement.createTextChild(titleText);setAccessibleName(this._titleElement,titleText);setExpanded(this._titleElement,false);this._titleElement.tabIndex=0;self.onInvokeElement(this._titleElement,this._toggleExpanded.bind(this));this._titleElement.addEventListener('keydown',this._onTitleKeyDown.bind(this),false);this.contentElement.insertBefore(this._titleElement,this.contentElement.firstChild);setControls(this._titleElement,this.contentElement.createChild('slot'));this._view=view;view[_ExpandableContainerWidget._symbol]=this;}
wasShown(){if(this._widget){this._materializePromise.then(()=>this._widget.show(this.element));}}
_materialize(){if(this._materializePromise){return this._materializePromise;}
const promises=[];promises.push(this._view.toolbarItems().then(toolbarItems=>{const toolbarElement=ViewManager._createToolbar(toolbarItems);if(toolbarElement){this._titleElement.appendChild(toolbarElement);}}));promises.push(this._view.widget().then(widget=>{this._widget=widget;this._view[widgetSymbol]=widget;widget.show(this.element);}));this._materializePromise=Promise.all(promises);return this._materializePromise;}
_expand(){if(this._titleElement.classList.contains('expanded')){return this._materialize();}
this._titleElement.classList.add('expanded');setExpanded(this._titleElement,true);this._titleExpandIcon.setIconType('smallicon-triangle-down');return this._materialize().then(()=>this._widget.show(this.element));}
_collapse(){if(!this._titleElement.classList.contains('expanded')){return;}
this._titleElement.classList.remove('expanded');setExpanded(this._titleElement,false);this._titleExpandIcon.setIconType('smallicon-triangle-right');this._materialize().then(()=>this._widget.detach());}
_toggleExpanded(event){if(event.type==='keydown'&&event.target!==this._titleElement){return;}
if(this._titleElement.classList.contains('expanded')){this._collapse();}else{this._expand();}}
_onTitleKeyDown(event){if(event.target!==this._titleElement){return;}
if(event.key==='ArrowLeft'){this._collapse();}else if(event.key==='ArrowRight'){if(!this._titleElement.classList.contains('expanded')){this._expand();}else if(this._widget){this._widget.focus();}}}}
_ExpandableContainerWidget._symbol=Symbol('container');class _Location{constructor(manager,widget,revealCallback){this._manager=manager;this._revealCallback=revealCallback;this._widget=widget;}
widget(){return this._widget;}
_reveal(){if(this._revealCallback){this._revealCallback();}}}
_Location.symbol=Symbol('location');class _TabbedLocation extends _Location{constructor(manager,revealCallback,location,restoreSelection,allowReorder,defaultTab){const tabbedPane=new TabbedPane();if(allowReorder){tabbedPane.setAllowTabReorder(true);}
super(manager,tabbedPane,revealCallback);this._tabbedPane=tabbedPane;this._allowReorder=allowReorder;this._tabbedPane.addEventListener(Events$8.TabSelected,this._tabSelected,this);this._tabbedPane.addEventListener(Events$8.TabClosed,this._tabClosed,this);this._closeableTabSetting=Settings.Settings.instance().createSetting(location+'-closeableTabs',{});this._tabOrderSetting=Settings.Settings.instance().createSetting(location+'-tabOrder',{});this._tabbedPane.addEventListener(Events$8.TabOrderChanged,this._persistTabOrder,this);if(restoreSelection){this._lastSelectedTabSetting=Settings.Settings.instance().createSetting(location+'-selectedTab','');}
this._defaultTab=defaultTab;this._views=new Map();if(location){this.appendApplicableItems(location);}}
widget(){return this._tabbedPane;}
tabbedPane(){return this._tabbedPane;}
enableMoreTabsButton(){const moreTabsButton=new ToolbarMenuButton(this._appendTabsToMenu.bind(this));this._tabbedPane.leftToolbar().appendToolbarItem(moreTabsButton);this._tabbedPane.disableOverflowMenu();return moreTabsButton;}
appendApplicableItems(locationName){const views=this._manager._viewsForLocation(locationName);if(this._allowReorder){let i=0;const persistedOrders=this._tabOrderSetting.get();const orders=new Map();for(const view of views){orders.set(view.viewId(),persistedOrders[view.viewId()]||(++i)*_TabbedLocation.orderStep);}
views.sort((a,b)=>orders.get(a.viewId())-orders.get(b.viewId()));}
for(const view of views){const id=view.viewId();this._views.set(id,view);view[_Location.symbol]=this;if(view.isTransient()){continue;}
if(!view.isCloseable()){this._appendTab(view);}else if(this._closeableTabSetting.get()[id]){this._appendTab(view);}}
if(this._defaultTab&&this._tabbedPane.hasTab(this._defaultTab)){this._tabbedPane.selectTab(this._defaultTab);}else if(this._lastSelectedTabSetting&&this._tabbedPane.hasTab(this._lastSelectedTabSetting.get())){this._tabbedPane.selectTab(this._lastSelectedTabSetting.get());}}
_appendTabsToMenu(contextMenu){const views=Array.from(this._views.values());views.sort((viewa,viewb)=>viewa.title().localeCompare(viewb.title()));for(const view of views){const title=UIString.UIString(view.title());contextMenu.defaultSection().appendItem(title,this.showView.bind(this,view,undefined,true));}}
_appendTab(view,index){this._tabbedPane.appendTab(view.viewId(),view.title(),new ContainerWidget(view),undefined,false,view.isCloseable()||view.isTransient(),index);}
appendView(view,insertBefore){if(this._tabbedPane.hasTab(view.viewId())){return;}
const oldLocation=view[_Location.symbol];if(oldLocation&&oldLocation!==this){oldLocation.removeView(view);}
view[_Location.symbol]=this;this._manager._views.set(view.viewId(),view);this._views.set(view.viewId(),view);let index=undefined;const tabIds=this._tabbedPane.tabIds();if(this._allowReorder){const orderSetting=this._tabOrderSetting.get();const order=orderSetting[view.viewId()];for(let i=0;order&&i<tabIds.length;++i){if(orderSetting[tabIds[i]]&&orderSetting[tabIds[i]]>order){index=i;break;}}}else if(insertBefore){for(let i=0;i<tabIds.length;++i){if(tabIds[i]===insertBefore.viewId()){index=i;break;}}}
this._appendTab(view,index);if(view.isCloseable()){const tabs=this._closeableTabSetting.get();const tabId=view.viewId();if(!tabs[tabId]){tabs[tabId]=true;this._closeableTabSetting.set(tabs);}}
this._persistTabOrder();}
showView(view,insertBefore,userGesture,omitFocus){this.appendView(view,insertBefore);this._tabbedPane.selectTab(view.viewId(),userGesture);if(!omitFocus){this._tabbedPane.focus();}
const widget=(this._tabbedPane.tabView(view.viewId()));return widget._materialize();}
removeView(view){if(!this._tabbedPane.hasTab(view.viewId())){return;}
delete view[_Location.symbol];this._manager._views.delete(view.viewId());this._tabbedPane.closeTab(view.viewId());this._views.delete(view.viewId());}
_tabSelected(event){const tabId=(event.data.tabId);if(this._lastSelectedTabSetting&&event.data['isUserGesture']){this._lastSelectedTabSetting.set(tabId);}}
_tabClosed(event){const id=(event.data['tabId']);const tabs=this._closeableTabSetting.get();if(tabs[id]){delete tabs[id];this._closeableTabSetting.set(tabs);}
this._views.get(id).disposeView();}
_persistTabOrder(){const tabIds=this._tabbedPane.tabIds();const tabOrders={};for(let i=0;i<tabIds.length;i++){tabOrders[tabIds[i]]=(i+1)*_TabbedLocation.orderStep;}
const oldTabOrder=this._tabOrderSetting.get();const oldTabArray=Object.keys(oldTabOrder);oldTabArray.sort((a,b)=>oldTabOrder[a]-oldTabOrder[b]);let lastOrder=0;for(const key of oldTabArray){if(key in tabOrders){lastOrder=tabOrders[key];continue;}
tabOrders[key]=++lastOrder;}
this._tabOrderSetting.set(tabOrders);}}
_TabbedLocation.orderStep=10;class _StackLocation extends _Location{constructor(manager,revealCallback,location){const vbox=new VBox();super(manager,vbox,revealCallback);this._vbox=vbox;this._expandableContainers=new Map();if(location){this.appendApplicableItems(location);}}
appendView(view,insertBefore){const oldLocation=view[_Location.symbol];if(oldLocation&&oldLocation!==this){oldLocation.removeView(view);}
let container=this._expandableContainers.get(view.viewId());if(!container){view[_Location.symbol]=this;this._manager._views.set(view.viewId(),view);container=new _ExpandableContainerWidget(view);let beforeElement=null;if(insertBefore){const beforeContainer=insertBefore[_ExpandableContainerWidget._symbol];beforeElement=beforeContainer?beforeContainer.element:null;}
container.show(this._vbox.contentElement,beforeElement);this._expandableContainers.set(view.viewId(),container);}}
showView(view,insertBefore){this.appendView(view,insertBefore);const container=this._expandableContainers.get(view.viewId());return container._expand();}
removeView(view){const container=this._expandableContainers.get(view.viewId());if(!container){return;}
container.detach();this._expandableContainers.delete(view.viewId());delete view[_Location.symbol];this._manager._views.delete(view.viewId());}
appendApplicableItems(locationName){for(const view of this._manager._viewsForLocation(locationName)){this.appendView(view);}}}
var ViewManager$1=Object.freeze({__proto__:null,ViewManager:ViewManager,ContainerWidget:ContainerWidget,_ExpandableContainerWidget:_ExpandableContainerWidget,_TabbedLocation:_TabbedLocation});class View{viewId(){}
title(){}
isCloseable(){}
isTransient(){}
toolbarItems(){}
widget(){}
disposeView(){}}
const _symbol$2=Symbol('view');const _widgetSymbol=Symbol('widget');const widgetSymbol=_widgetSymbol;class SimpleView extends VBox{constructor(title,isWebComponent){super(isWebComponent);this._title=title;this[_symbol$2]=this;}
viewId(){return this._title;}
title(){return this._title;}
isCloseable(){return false;}
isTransient(){return false;}
toolbarItems(){return Promise.resolve([]);}
widget(){return((Promise.resolve(this)));}
revealView(){return ViewManager.instance().revealView(this);}
disposeView(){}}
class ProvidedView{constructor(extension){this._extension=extension;}
viewId(){return this._extension.descriptor()['id'];}
title(){return this._extension.title();}
isCloseable(){return this._extension.descriptor()['persistence']==='closeable';}
isTransient(){return this._extension.descriptor()['persistence']==='transient';}
toolbarItems(){const actionIds=this._extension.descriptor()['actionIds'];if(actionIds){const result=actionIds.split(',').map(id=>Toolbar.createActionButtonForId(id.trim()));return Promise.resolve(result);}
if(this._extension.descriptor()['hasToolbar']){return this.widget().then(widget=>(widget).toolbarItems());}
return Promise.resolve([]);}
async widget(){this._widgetRequested=true;const widget=await this._extension.instance();if(!(widget instanceof Widget)){throw new Error('view className should point to a UI.Widget');}
widget[_symbol$2]=this;return((widget));}
async disposeView(){if(!this._widgetRequested){return;}
const widget=await this.widget();widget.ownerViewDisposed();}}
class ViewLocation{appendApplicableItems(locationName){}
appendView(view,insertBefore){}
showView(view,insertBefore,userGesture){}
removeView(view){}
widget(){}}
class TabbedViewLocation extends ViewLocation{tabbedPane(){}
enableMoreTabsButton(){}}
class ViewLocationResolver{resolveLocation(location){}}
var View$1=Object.freeze({__proto__:null,View:View,_symbol:_symbol$2,_widgetSymbol:_widgetSymbol,widgetSymbol:widgetSymbol,SimpleView:SimpleView,ProvidedView:ProvidedView,ViewLocation:ViewLocation,TabbedViewLocation:TabbedViewLocation,ViewLocationResolver:ViewLocationResolver});class InspectorView extends VBox{constructor(){super();GlassPane.setContainer(this.element);this.setMinimumSize(240,72);this._drawerSplitWidget=new SplitWidget(false,true,'Inspector.drawerSplitViewState',200,200);this._drawerSplitWidget.hideSidebar();this._drawerSplitWidget.hideDefaultResizer();this._drawerSplitWidget.enableShowModeSaving();this._drawerSplitWidget.show(this.element);this._drawerTabbedLocation=ViewManager.instance().createTabbedLocation(this._showDrawer.bind(this,false),'drawer-view',true,true);const moreTabsButton=this._drawerTabbedLocation.enableMoreTabsButton();moreTabsButton.setTitle(ls`More Tools`);this._drawerTabbedPane=this._drawerTabbedLocation.tabbedPane();this._drawerTabbedPane.setMinimumSize(0,27);const closeDrawerButton=new ToolbarButton(UIString.UIString('Close drawer'),'largeicon-delete');closeDrawerButton.addEventListener(ToolbarButton.Events.Click,this._closeDrawer,this);this._drawerSplitWidget.installResizer(this._drawerTabbedPane.headerElement());this._drawerTabbedPane.addEventListener(Events$8.TabSelected,this._drawerTabSelected,this);this._drawerSplitWidget.setSidebarWidget(this._drawerTabbedPane);this._drawerTabbedPane.rightToolbar().appendToolbarItem(closeDrawerButton);this._tabbedLocation=ViewManager.instance().createTabbedLocation(InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront.bind(InspectorFrontendHost.InspectorFrontendHostInstance),'panel',true,true,Root.Runtime.queryParam('panel'));this._tabbedPane=this._tabbedLocation.tabbedPane();this._tabbedPane.registerRequiredCSS('ui/inspectorViewTabbedPane.css');this._tabbedPane.addEventListener(Events$8.TabSelected,this._tabSelected,this);this._tabbedPane.setAccessibleName(UIString.UIString('Panels'));userMetrics.setLaunchPanel(this._tabbedPane.selectedTabId);if(InspectorFrontendHost.isUnderTest()){this._tabbedPane.setAutoSelectFirstItemOnShow(false);}
this._drawerSplitWidget.setMainWidget(this._tabbedPane);this._keyDownBound=this._keyDown.bind(this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.ShowPanel,showPanel.bind(this));function showPanel(event){const panelName=(event.data);this.showPanel(panelName);}}
static instance(){return(self.runtime.sharedInstance(InspectorView));}
wasShown(){this.element.ownerDocument.addEventListener('keydown',this._keyDownBound,false);}
willHide(){this.element.ownerDocument.removeEventListener('keydown',this._keyDownBound,false);}
resolveLocation(locationName){if(locationName==='drawer-view'){return this._drawerTabbedLocation;}
if(locationName==='panel'){return this._tabbedLocation;}
return null;}
createToolbars(){this._tabbedPane.leftToolbar().appendItemsAtLocation('main-toolbar-left');this._tabbedPane.rightToolbar().appendItemsAtLocation('main-toolbar-right');}
addPanel(view){this._tabbedLocation.appendView(view);}
hasPanel(panelName){return this._tabbedPane.hasTab(panelName);}
panel(panelName){return((ViewManager.instance().view(panelName).widget()));}
onSuspendStateChanged(allTargetsSuspended){this._currentPanelLocked=allTargetsSuspended;this._tabbedPane.setCurrentTabLocked(this._currentPanelLocked);this._tabbedPane.leftToolbar().setEnabled(!this._currentPanelLocked);this._tabbedPane.rightToolbar().setEnabled(!this._currentPanelLocked);}
canSelectPanel(panelName){return!this._currentPanelLocked||this._tabbedPane.selectedTabId===panelName;}
showPanel(panelName){return ViewManager.instance().showView(panelName);}
setPanelIcon(panelName,icon){this._tabbedPane.setTabIcon(panelName,icon);}
currentPanelDeprecated(){return((ViewManager.instance().materializedWidget(this._tabbedPane.selectedTabId||'')));}
_showDrawer(focus){if(this._drawerTabbedPane.isShowing()){return;}
this._drawerSplitWidget.showBoth();if(focus){this._focusRestorer=new WidgetFocusRestorer(this._drawerTabbedPane);}else{this._focusRestorer=null;}}
drawerVisible(){return this._drawerTabbedPane.isShowing();}
_closeDrawer(){if(!this._drawerTabbedPane.isShowing()){return;}
if(this._focusRestorer){this._focusRestorer.restore();}
this._drawerSplitWidget.hideSidebar(true);}
setDrawerMinimized(minimized){this._drawerSplitWidget.setSidebarMinimized(minimized);this._drawerSplitWidget.setResizable(!minimized);}
isDrawerMinimized(){return this._drawerSplitWidget.isSidebarMinimized();}
closeDrawerTab(id,userGesture){this._drawerTabbedPane.closeTab(id,userGesture);}
_keyDown(event){const keyboardEvent=(event);if(!KeyboardShortcut.eventHasCtrlOrMeta(keyboardEvent)||event.altKey||event.shiftKey){return;}
const panelShortcutEnabled=Settings.moduleSetting('shortcutPanelSwitch').get();if(panelShortcutEnabled){let panelIndex=-1;if(event.keyCode>0x30&&event.keyCode<0x3A){panelIndex=event.keyCode-0x31;}else if(event.keyCode>0x60&&event.keyCode<0x6A&&keyboardEvent.location===KeyboardEvent.DOM_KEY_LOCATION_NUMPAD){panelIndex=event.keyCode-0x61;}
if(panelIndex!==-1){const panelName=this._tabbedPane.tabIds()[panelIndex];if(panelName){if(!Dialog.hasInstance()&&!this._currentPanelLocked){this.showPanel(panelName);}
event.consume(true);}}}}
onResize(){GlassPane.containerMoved(this.element);}
topResizerElement(){return this._tabbedPane.headerElement();}
toolbarItemResized(){this._tabbedPane.headerResized();}
_tabSelected(event){const tabId=(event.data['tabId']);userMetrics.panelShown(tabId);}
_drawerTabSelected(event){const tabId=(event.data['tabId']);userMetrics.drawerShown(tabId);}
setOwnerSplit(splitWidget){this._ownerSplitWidget=splitWidget;}
ownerSplit(){return this._ownerSplitWidget;}
minimize(){if(this._ownerSplitWidget){this._ownerSplitWidget.setSidebarMinimized(true);}}
restore(){if(this._ownerSplitWidget){this._ownerSplitWidget.setSidebarMinimized(false);}}}
class ActionDelegate$2{handleAction(context,actionId){switch(actionId){case'main.toggle-drawer':if(self.UI.inspectorView.drawerVisible()){self.UI.inspectorView._closeDrawer();}else{self.UI.inspectorView._showDrawer(true);}
return true;case'main.next-tab':self.UI.inspectorView._tabbedPane.selectNextTab();self.UI.inspectorView._tabbedPane.focus();return true;case'main.previous-tab':self.UI.inspectorView._tabbedPane.selectPrevTab();self.UI.inspectorView._tabbedPane.focus();return true;}
return false;}}
var InspectorView$1=Object.freeze({__proto__:null,InspectorView:InspectorView,ActionDelegate:ActionDelegate$2});class ListWidget extends VBox{constructor(delegate){super(true,true);this.registerRequiredCSS('ui/listWidget.css');this._delegate=delegate;this._list=this.contentElement.createChild('div','list');this._list.addEventListener('keydown',event=>this._onKeyDown(event));this._lastSeparator=false;this._focusRestorer=null;this._items=[];this._editable=[];this._elements=[];this._editor=null;this._editItem=null;this._editElement=null;this._selectedIndex=-1;this._emptyPlaceholder=null;this._updatePlaceholder();}
clear(){this._items=[];this._editable=[];this._elements=[];this._lastSeparator=false;this._list.removeChildren();this._updatePlaceholder();this._stopEditing();}
appendItem(item,editable){if(this._lastSeparator&&this._items.length){this._list.appendChild(createElementWithClass('div','list-separator'));}
this._lastSeparator=false;this._items.push(item);this._editable.push(editable);const element=this._list.createChild('div','list-item');element.appendChild(this._delegate.renderItem(item,editable));if(editable){element.classList.add('editable');element.appendChild(this._createControls(item,element));}
const index=this._items.length-1;element.addEventListener('click',()=>{this._select(index,true);});this._elements.push(element);if(this._selectedIndex===-1||this._selectedIndex===index){this._select(index,false);}
this._updatePlaceholder();}
appendSeparator(){this._lastSeparator=true;}
removeItem(index){if(this._editItem===this._items[index]){this._stopEditing();}
const element=this._elements[index];const previous=element.previousElementSibling;const previousIsSeparator=previous&&previous.classList.contains('list-separator');const next=element.nextElementSibling;const nextIsSeparator=next&&next.classList.contains('list-separator');if(previousIsSeparator&&(nextIsSeparator||!next)){previous.remove();}
if(nextIsSeparator&&!previous){next.remove();}
element.remove();if(this._selectedIndex===index){this._selectNext();}
this._elements.splice(index,1);this._items.splice(index,1);this._editable.splice(index,1);this._updatePlaceholder();}
addNewItem(index,item){this._startEditing(item,null,this._elements[index]||null);}
setEmptyPlaceholder(element){this._emptyPlaceholder=element;this._updatePlaceholder();}
_onKeyDown(event){if(this._editor||this._elements.length<1){return;}
if(event.key==='ArrowUp'||event.key==='ArrowDown'){if(this._selectedIndex<0){return;}
const offset=event.key==='ArrowUp'?-1:1;const newIndex=this._selectedIndex+offset;if(newIndex<0||newIndex>=this._elements.length){return;}
this._select(newIndex,true);event.consume(true);}}
_select(index,takeFocus){if(index<0||index>=this._elements.length){return;}
if(this._selectedIndex>=0){const oldSelectedElement=this._elements[this._selectedIndex].firstElementChild;oldSelectedElement.tabIndex=-1;}
const newSelectedElement=this._elements[index].firstElementChild;newSelectedElement.tabIndex=0;this._selectedIndex=index;if(takeFocus){newSelectedElement.focus();}}
_selectNext(){if(this._selectedIndex<0||this._list.length===0){return;}
const offset=this._selectedIndex<this._list.length?1:-1;const nextIndex=this._selectedIndex+offset;this._select(nextIndex,false);}
_createControls(item,element){const controls=createElementWithClass('div','controls-container fill');controls.createChild('div','controls-gradient');const buttons=controls.createChild('div','controls-buttons');const toolbar=new Toolbar('',buttons);const editButton=new ToolbarButton(UIString.UIString('Edit'),'largeicon-edit');editButton.addEventListener(ToolbarButton.Events.Click,onEditClicked.bind(this));toolbar.appendToolbarItem(editButton);const removeButton=new ToolbarButton(UIString.UIString('Remove'),'largeicon-trash-bin');removeButton.addEventListener(ToolbarButton.Events.Click,onRemoveClicked.bind(this));toolbar.appendToolbarItem(removeButton);return controls;function onEditClicked(){const index=this._elements.indexOf(element);const insertionPoint=this._elements[index+1]||null;this._startEditing(item,element,insertionPoint);}
function onRemoveClicked(){const index=this._elements.indexOf(element);this.element.focus();this._delegate.removeItemRequested(this._items[index],index);}}
wasShown(){super.wasShown();this._stopEditing();}
_updatePlaceholder(){if(!this._emptyPlaceholder){return;}
if(!this._elements.length&&!this._editor){this._list.appendChild(this._emptyPlaceholder);}else{this._emptyPlaceholder.remove();}}
_startEditing(item,element,insertionPoint){if(element&&this._editElement===element){return;}
this._stopEditing();this._focusRestorer=new ElementFocusRestorer(this.element);this._list.classList.add('list-editing');this._editItem=item;this._editElement=element;if(element){element.classList.add('hidden');}
const index=element?this._elements.indexOf(element):-1;this._editor=this._delegate.beginEdit(item);this._updatePlaceholder();this._list.insertBefore(this._editor.element,insertionPoint);this._editor.beginEdit(item,index,element?UIString.UIString('Save'):UIString.UIString('Add'),this._commitEditing.bind(this),this._stopEditing.bind(this));}
_commitEditing(){const editItem=this._editItem;const isNew=!this._editElement;const editor=(this._editor);this._stopEditing();this._delegate.commitEdit(editItem,editor,isNew);}
_stopEditing(){this._list.classList.remove('list-editing');if(this._focusRestorer){this._focusRestorer.restore();}
if(this._editElement){this._editElement.classList.remove('hidden');}
if(this._editor&&this._editor.element.parentElement){this._editor.element.remove();}
this._editor=null;this._editItem=null;this._editElement=null;this._updatePlaceholder();}}
class Delegate{renderItem(item,editable){}
removeItemRequested(item,index){}
beginEdit(item){}
commitEdit(item,editor,isNew){}}
class Editor{constructor(){this.element=createElementWithClass('div','editor-container');this.element.addEventListener('keydown',onKeyDown.bind(null,isEscKey,this._cancelClicked.bind(this)),false);this.element.addEventListener('keydown',onKeyDown.bind(null,isEnterKey,this._commitClicked.bind(this)),false);this._contentElement=this.element.createChild('div','editor-content');const buttonsRow=this.element.createChild('div','editor-buttons');this._commitButton=createTextButton('',this._commitClicked.bind(this),'',true);buttonsRow.appendChild(this._commitButton);this._cancelButton=createTextButton(UIString.UIString('Cancel'),this._cancelClicked.bind(this));this._cancelButton.addEventListener('keydown',onKeyDown.bind(null,isEnterKey,this._cancelClicked.bind(this)),false);buttonsRow.appendChild(this._cancelButton);this._errorMessageContainer=this.element.createChild('div','list-widget-input-validation-error');markAsAlert(this._errorMessageContainer);function onKeyDown(predicate,callback,event){if(predicate(event)){event.consume(true);callback();}}
this._controls=[];this._controlByName=new Map();this._validators=[];this._commit=null;this._cancel=null;this._item=null;this._index=-1;}
contentElement(){return this._contentElement;}
createInput(name,type,title,validator){const input=(createInput('',type));input.placeholder=title;input.addEventListener('input',this._validateControls.bind(this,false),false);input.addEventListener('blur',this._validateControls.bind(this,false),false);setAccessibleName(input,title);this._controlByName.set(name,input);this._controls.push(input);this._validators.push(validator);return input;}
createSelect(name,options,validator,title){const select=(createElementWithClass('select','chrome-select'));for(let index=0;index<options.length;++index){const option=select.createChild('option');option.value=options[index];option.textContent=options[index];}
if(title){select.title=title;setAccessibleName(select,title);}
select.addEventListener('input',this._validateControls.bind(this,false),false);select.addEventListener('blur',this._validateControls.bind(this,false),false);this._controlByName.set(name,select);this._controls.push(select);this._validators.push(validator);return select;}
control(name){return(this._controlByName.get(name));}
_validateControls(forceValid){let allValid=true;this._errorMessageContainer.textContent='';for(let index=0;index<this._controls.length;++index){const input=this._controls[index];const{valid,errorMessage}=this._validators[index].call(null,this._item,this._index,input);input.classList.toggle('error-input',!valid&&!forceValid);if(valid||forceValid){setInvalid(input,false);}else{setInvalid(input,true);}
if(!forceValid&&errorMessage&&!this._errorMessageContainer.textContent){this._errorMessageContainer.textContent=errorMessage;}
allValid&=valid;}
this._commitButton.disabled=!allValid;}
beginEdit(item,index,commitButtonTitle,commit,cancel){this._commit=commit;this._cancel=cancel;this._item=item;this._index=index;this._commitButton.textContent=commitButtonTitle;this.element.scrollIntoViewIfNeeded(false);if(this._controls.length){this._controls[0].focus();}
this._validateControls(true);}
_commitClicked(){if(this._commitButton.disabled){return;}
const commit=this._commit;this._commit=null;this._cancel=null;this._item=null;this._index=-1;commit();}
_cancelClicked(){const cancel=this._cancel;this._commit=null;this._cancel=null;this._item=null;this._index=-1;cancel();}}
let ValidatorResult;var ListWidget$1=Object.freeze({__proto__:null,ListWidget:ListWidget,Delegate:Delegate,Editor:Editor,ValidatorResult:ValidatorResult});class PopoverHelper{constructor(container,getRequest){this._disableOnClick=false;this._hasPadding=false;this._getRequest=getRequest;this._scheduledRequest=null;this._hidePopoverCallback=null;this._container=container;this._showTimeout=0;this._hideTimeout=0;this._hidePopoverTimer=null;this._showPopoverTimer=null;this._boundMouseDown=this._mouseDown.bind(this);this._boundMouseMove=this._mouseMove.bind(this);this._boundMouseOut=this._mouseOut.bind(this);this._container.addEventListener('mousedown',this._boundMouseDown,false);this._container.addEventListener('mousemove',this._boundMouseMove,false);this._container.addEventListener('mouseout',this._boundMouseOut,false);this.setTimeout(1000);}
setTimeout(showTimeout,hideTimeout){this._showTimeout=showTimeout;this._hideTimeout=typeof hideTimeout==='number'?hideTimeout:showTimeout/2;}
setHasPadding(hasPadding){this._hasPadding=hasPadding;}
setDisableOnClick(disableOnClick){this._disableOnClick=disableOnClick;}
_eventInScheduledContent(event){return this._scheduledRequest?this._scheduledRequest.box.contains(event.clientX,event.clientY):false;}
_mouseDown(event){if(this._disableOnClick){this.hidePopover();return;}
if(this._eventInScheduledContent(event)){return;}
this._startHidePopoverTimer(0);this._stopShowPopoverTimer();this._startShowPopoverTimer((event),0);}
_mouseMove(event){if(this._eventInScheduledContent(event)){return;}
this._startHidePopoverTimer(this._hideTimeout);this._stopShowPopoverTimer();if(event.which&&this._disableOnClick){return;}
this._startShowPopoverTimer((event),this.isPopoverVisible()?this._showTimeout*0.6:this._showTimeout);}
_popoverMouseMove(event){this._stopHidePopoverTimer();}
_popoverMouseOut(popover,event){if(!popover.isShowing()){return;}
if(event.relatedTarget&&!event.relatedTarget.isSelfOrDescendant(popover.contentElement)){this._startHidePopoverTimer(this._hideTimeout);}}
_mouseOut(event){if(!this.isPopoverVisible()){return;}
if(!this._eventInScheduledContent(event)){this._startHidePopoverTimer(this._hideTimeout);}}
_startHidePopoverTimer(timeout){if(!this._hidePopoverCallback||this._hidePopoverTimer){return;}
this._hidePopoverTimer=setTimeout(()=>{this._hidePopover();this._hidePopoverTimer=null;},timeout);}
_startShowPopoverTimer(event,timeout){this._scheduledRequest=this._getRequest.call(null,event);if(!this._scheduledRequest){return;}
this._showPopoverTimer=setTimeout(()=>{this._showPopoverTimer=null;this._stopHidePopoverTimer();this._hidePopover();this._showPopover(event.target.ownerDocument);},timeout);}
_stopShowPopoverTimer(){if(!this._showPopoverTimer){return;}
clearTimeout(this._showPopoverTimer);this._showPopoverTimer=null;}
isPopoverVisible(){return!!this._hidePopoverCallback;}
hidePopover(){this._stopShowPopoverTimer();this._hidePopover();}
_hidePopover(){if(!this._hidePopoverCallback){return;}
this._hidePopoverCallback.call(null);this._hidePopoverCallback=null;}
_showPopover(document){const popover=new GlassPane();popover.registerRequiredCSS('ui/popover.css');popover.setSizeBehavior(SizeBehavior.MeasureContent);popover.setMarginBehavior(MarginBehavior.Arrow);const request=this._scheduledRequest;request.show.call(null,popover).then(success=>{if(!success){return;}
if(this._scheduledRequest!==request){if(request.hide){request.hide.call(null);}
return;}
if(PopoverHelper._popoverHelper){console.error('One popover is already visible');PopoverHelper._popoverHelper.hidePopover();}
PopoverHelper._popoverHelper=this;popover.contentElement.classList.toggle('has-padding',this._hasPadding);popover.contentElement.addEventListener('mousemove',this._popoverMouseMove.bind(this),true);popover.contentElement.addEventListener('mouseout',this._popoverMouseOut.bind(this,popover),true);popover.setContentAnchorBox(request.box);popover.show(document);this._hidePopoverCallback=()=>{if(request.hide){request.hide.call(null);}
popover.hide();delete PopoverHelper._popoverHelper;};});}
_stopHidePopoverTimer(){if(!this._hidePopoverTimer){return;}
clearTimeout(this._hidePopoverTimer);this._hidePopoverTimer=null;this._stopShowPopoverTimer();}
dispose(){this._container.removeEventListener('mousedown',this._boundMouseDown,false);this._container.removeEventListener('mousemove',this._boundMouseMove,false);this._container.removeEventListener('mouseout',this._boundMouseOut,false);}}
let PopoverRequest;var PopoverHelper$1=Object.freeze({__proto__:null,PopoverHelper:PopoverHelper,PopoverRequest:PopoverRequest});class ProgressIndicator{constructor(){this.element=createElementWithClass('div','progress-indicator');this._shadowRoot=createShadowRootWithCoreStyles(this.element,'ui/progressIndicator.css');this._contentElement=this._shadowRoot.createChild('div','progress-indicator-shadow-container');this._labelElement=this._contentElement.createChild('div','title');this._progressElement=this._contentElement.createChild('progress');this._progressElement.value=0;this._stopButton=this._contentElement.createChild('button','progress-indicator-shadow-stop-button');this._stopButton.addEventListener('click',this.cancel.bind(this));this._isCanceled=false;this._worked=0;}
show(parent){parent.appendChild(this.element);}
done(){if(this._isDone){return;}
this._isDone=true;this.element.remove();}
cancel(){this._isCanceled=true;}
isCanceled(){return this._isCanceled;}
setTitle(title){this._labelElement.textContent=title;}
setTotalWork(totalWork){this._progressElement.max=totalWork;}
setWorked(worked,title){this._worked=worked;this._progressElement.value=worked;if(title){this.setTitle(title);}}
worked(worked){this.setWorked(this._worked+(worked||1));}}
var ProgressIndicator$1=Object.freeze({__proto__:null,ProgressIndicator:ProgressIndicator});class RemoteDebuggingTerminatedScreen extends VBox{constructor(reason){super(true);this.registerRequiredCSS('ui/remoteDebuggingTerminatedScreen.css');const message=this.contentElement.createChild('div','message');const reasonElement=message.createChild('span','reason');reasonElement.textContent=reason;message.appendChild(formatLocalized('Debugging connection was closed. Reason: %s',[reasonElement]));this.contentElement.createChild('div','message').textContent=UIString.UIString('Reconnect when ready by reopening DevTools.');const button=createTextButton(UIString.UIString('Reconnect DevTools'),()=>window.location.reload());this.contentElement.createChild('div','button').appendChild(button);}
static show(reason){const dialog=new Dialog();dialog.setSizeBehavior(SizeBehavior.MeasureContent);dialog.addCloseButton();dialog.setDimmed(true);new RemoteDebuggingTerminatedScreen(reason).show(dialog.contentElement);dialog.show();}}
var RemoteDebuggingTerminatedScreen$1=Object.freeze({__proto__:null,RemoteDebuggingTerminatedScreen:RemoteDebuggingTerminatedScreen});class ReportView extends VBox{constructor(title){super(true);this.registerRequiredCSS('ui/reportView.css');this._contentBox=this.contentElement.createChild('div','report-content-box');this._headerElement=this._contentBox.createChild('div','report-header vbox');this._titleElement=this._headerElement.createChild('div','report-title');this._titleElement.textContent=title;markAsHeading(this._titleElement,1);this._sectionList=this._contentBox.createChild('div','vbox');}
setTitle(title){if(this._titleElement.textContent===title){return;}
this._titleElement.textContent=title;}
setSubtitle(subtitle){if(this._subtitleElement&&this._subtitleElement.textContent===subtitle){return;}
if(!this._subtitleElement){this._subtitleElement=this._headerElement.createChild('div','report-subtitle');}
this._subtitleElement.textContent=subtitle;}
setURL(link){if(!this._urlElement){this._urlElement=this._headerElement.createChild('div','report-url link');}
this._urlElement.removeChildren();if(link){this._urlElement.appendChild(link);}}
createToolbar(){const toolbar=new Toolbar('');this._headerElement.appendChild(toolbar.element);return toolbar;}
appendSection(title,className){const section=new Section$1(title,className);section.show(this._sectionList);return section;}
sortSections(comparator){const sections=(this.children().slice());const sorted=sections.every((e,i,a)=>!i||comparator(a[i-1],a[i])<=0);if(sorted){return;}
this.detachChildWidgets();sections.sort(comparator);for(const section of sections){section.show(this._sectionList);}}
setHeaderVisible(visible){this._headerElement.classList.toggle('hidden',!visible);}
setBodyScrollable(scrollable){this._contentBox.classList.toggle('no-scroll',!scrollable);}}
class Section$1 extends VBox{constructor(title,className){super();this.element.classList.add('report-section');if(className){this.element.classList.add(className);}
this._headerElement=this.element.createChild('div','report-section-header');this._titleElement=this._headerElement.createChild('div','report-section-title');this.setTitle(title);markAsHeading(this._titleElement,2);this._fieldList=this.element.createChild('div','vbox');this._fieldMap=new Map();}
title(){return this._titleElement.textContent;}
setTitle(title){if(this._titleElement.textContent!==title){this._titleElement.textContent=title;}
this._titleElement.classList.toggle('hidden',!this._titleElement.textContent);}
setUiGroupTitle(groupTitle){markAsGroup(this.element);setAccessibleName(this.element,groupTitle);}
createToolbar(){const toolbar=new Toolbar('');this._headerElement.appendChild(toolbar.element);return toolbar;}
appendField(title,textValue){let row=this._fieldMap.get(title);if(!row){row=this._fieldList.createChild('div','report-field');row.createChild('div','report-field-name').textContent=title;this._fieldMap.set(title,row);row.createChild('div','report-field-value');}
if(textValue){row.lastElementChild.textContent=textValue;}
return(row.lastElementChild);}
appendFlexedField(title,textValue){const field=this.appendField(title,textValue);field.classList.add('report-field-value-is-flexed');return field;}
removeField(title){const row=this._fieldMap.get(title);if(row){row.remove();}
this._fieldMap.delete(title);}
setFieldVisible(title,visible){const row=this._fieldMap.get(title);if(row){row.classList.toggle('hidden',!visible);}}
fieldValue(title){const row=this._fieldMap.get(title);return row?row.lastElementChild:null;}
appendRow(){return this._fieldList.createChild('div','report-row');}
appendSelectableRow(){return this._fieldList.createChild('div','report-row report-row-selectable');}
clearContent(){this._fieldList.removeChildren();this._fieldMap.clear();}
markFieldListAsGroup(){markAsGroup(this._fieldList);setAccessibleName(this._fieldList,this.title());}
setIconMasked(masked){this.element.classList.toggle('show-mask',masked);}}
var ReportView$1=Object.freeze({__proto__:null,ReportView:ReportView,Section:Section$1});class RootView extends VBox{constructor(){super();this.markAsRoot();this.element.classList.add('root-view');this.registerRequiredCSS('ui/rootView.css');this.element.setAttribute('spellcheck',false);}
attachToDocument(document){document.defaultView.addEventListener('resize',this.doResize.bind(this),false);this._window=document.defaultView;this.doResize();this.show((document.body));}
doResize(){if(this._window){const size=this.constraints().minimum;const zoom=ZoomManager.instance().zoomFactor();const right=Math.min(0,this._window.innerWidth-size.width/zoom);this.element.style.marginRight=right+'px';const bottom=Math.min(0,this._window.innerHeight-size.height/zoom);this.element.style.marginBottom=bottom+'px';}
super.doResize();}}
var RootView$1=Object.freeze({__proto__:null,RootView:RootView});class SegmentedButton extends HBox{constructor(){super(true);this._buttons=new Map();this._selected=null;this.registerRequiredCSS('ui/segmentedButton.css');this.contentElement.classList.add('segmented-button');}
addSegment(label,value,tooltip){const button=this.contentElement.createChild('button','segmented-button-segment');button.textContent=label;button.title=tooltip;this._buttons.set(value,button);button.addEventListener('click',()=>this.select(value));}
select(value){if(this._selected===value){return;}
this._selected=value;for(const key of this._buttons.keys()){this._buttons.get(key).classList.toggle('segmented-button-segment-selected',key===this._selected);}}
selected(){return this._selected;}}
var SegmentedButton$1=Object.freeze({__proto__:null,SegmentedButton:SegmentedButton});class ShortcutsScreen{constructor(){this._sections={};}
static registerShortcuts(){const elementsSection=self.UI.shortcutsScreen.section(UIString.UIString('Elements Panel'));const navigate=ElementsPanelShortcuts.NavigateUp.concat(ElementsPanelShortcuts.NavigateDown);elementsSection.addRelatedKeys(navigate,UIString.UIString('Navigate elements'));const expandCollapse=ElementsPanelShortcuts.Expand.concat(ElementsPanelShortcuts.Collapse);elementsSection.addRelatedKeys(expandCollapse,UIString.UIString('Expand/collapse'));elementsSection.addAlternateKeys(ElementsPanelShortcuts.EditAttribute,UIString.UIString('Edit attribute'));elementsSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('elements.hide-element'),UIString.UIString('Hide element'));elementsSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('elements.edit-as-html'),UIString.UIString('Toggle edit as HTML'));const stylesPaneSection=self.UI.shortcutsScreen.section(UIString.UIString('Styles Pane'));const nextPreviousProperty=ElementsPanelShortcuts.NextProperty.concat(ElementsPanelShortcuts.PreviousProperty);stylesPaneSection.addRelatedKeys(nextPreviousProperty,UIString.UIString('Next/previous property'));stylesPaneSection.addRelatedKeys(ElementsPanelShortcuts.IncrementValue,UIString.UIString('Increment value'));stylesPaneSection.addRelatedKeys(ElementsPanelShortcuts.DecrementValue,UIString.UIString('Decrement value'));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.IncrementBy10,UIString.UIString('Increment by %f',10));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.DecrementBy10,UIString.UIString('Decrement by %f',10));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.IncrementBy100,UIString.UIString('Increment by %f',100));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.DecrementBy100,UIString.UIString('Decrement by %f',100));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.IncrementBy01,UIString.UIString('Increment by %f',0.1));stylesPaneSection.addAlternateKeys(ElementsPanelShortcuts.DecrementBy01,UIString.UIString('Decrement by %f',0.1));const consoleSection=self.UI.shortcutsScreen.section(UIString.UIString('Console'));consoleSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('console.clear'),UIString.UIString('Clear console'));consoleSection.addRelatedKeys(ConsolePanelShortcuts.AcceptSuggestion,UIString.UIString('Accept suggestion'));consoleSection.addAlternateKeys(ConsolePanelShortcuts.ClearConsolePrompt,UIString.UIString('Clear console prompt'));consoleSection.addRelatedKeys(ConsolePanelShortcuts.NextPreviousLine,UIString.UIString('Next/previous line'));if(Platform$1.isMac()){consoleSection.addRelatedKeys(ConsolePanelShortcuts.NextPreviousCommand,UIString.UIString('Next/previous command'));}
consoleSection.addKey(ConsolePanelShortcuts.ExecuteCommand,UIString.UIString('Execute command'));const debuggerSection=self.UI.shortcutsScreen.section(UIString.UIString('Debugger'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.toggle-pause'),UIString.UIString('Pause/ Continue'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.step-over'),UIString.UIString('Step over'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.step-into'),UIString.UIString('Step into'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.step-out'),UIString.UIString('Step out'));const nextAndPrevFrameKeys=self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.next-call-frame').concat(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.previous-call-frame'));debuggerSection.addRelatedKeys(nextAndPrevFrameKeys,UIString.UIString('Next/previous call frame'));debuggerSection.addAlternateKeys(SourcesPanelShortcuts.EvaluateSelectionInConsole,UIString.UIString('Evaluate selection in console'));debuggerSection.addAlternateKeys(SourcesPanelShortcuts.AddSelectionToWatch,UIString.UIString('Add selection to watch'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.toggle-breakpoint'),UIString.UIString('Toggle breakpoint'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.toggle-breakpoint-enabled'),UIString.UIString('Toggle breakpoint enabled'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.toggle-breakpoints-active'),UIString.UIString('Toggle all breakpoints'));debuggerSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('debugger.breakpoint-input-window'),ls`Open breakpoint editor`);const editingSection=self.UI.shortcutsScreen.section(UIString.UIString('Text Editor'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.go-to-member'),UIString.UIString('Go to member'));editingSection.addAlternateKeys(SourcesPanelShortcuts.ToggleAutocompletion,UIString.UIString('Autocompletion'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.go-to-line'),UIString.UIString('Go to line'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.jump-to-previous-location'),UIString.UIString('Jump to previous editing location'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.jump-to-next-location'),UIString.UIString('Jump to next editing location'));editingSection.addAlternateKeys(SourcesPanelShortcuts.ToggleComment,UIString.UIString('Toggle comment'));editingSection.addAlternateKeys(SourcesPanelShortcuts.IncreaseCSSUnitByOne,UIString.UIString('Increment CSS unit by 1'));editingSection.addAlternateKeys(SourcesPanelShortcuts.DecreaseCSSUnitByOne,UIString.UIString('Decrement CSS unit by 1'));editingSection.addAlternateKeys(SourcesPanelShortcuts.IncreaseCSSUnitByTen,UIString.UIString('Increment CSS unit by 10'));editingSection.addAlternateKeys(SourcesPanelShortcuts.DecreaseCSSUnitByTen,UIString.UIString('Decrement CSS unit by 10'));editingSection.addAlternateKeys(SourcesPanelShortcuts.SelectNextOccurrence,UIString.UIString('Select next occurrence'));editingSection.addAlternateKeys(SourcesPanelShortcuts.SoftUndo,UIString.UIString('Soft undo'));editingSection.addAlternateKeys(SourcesPanelShortcuts.GotoMatchingBracket,UIString.UIString('Go to matching bracket'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.close-editor-tab'),UIString.UIString('Close editor tab'));editingSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('sources.switch-file'),UIString.UIString('Switch between files with the same name and different extensions.'));const performanceSection=self.UI.shortcutsScreen.section(UIString.UIString('Performance Panel'));performanceSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.toggle-recording'),UIString.UIString('Start/stop recording'));performanceSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.record-reload'),UIString.UIString('Record page reload'));performanceSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.save-to-file'),UIString.UIString('Save profile'));performanceSection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.load-from-file'),UIString.UIString('Load profile'));performanceSection.addRelatedKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.jump-to-previous-frame').concat(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.jump-to-next-frame')),UIString.UIString('Jump to previous/next frame'));performanceSection.addRelatedKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.show-history'),UIString.UIString('Pick a recording from history'));performanceSection.addRelatedKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.previous-recording').concat(self.UI.shortcutRegistry.shortcutDescriptorsForAction('timeline.next-recording')),UIString.UIString('Show previous/next recording'));const memorySection=self.UI.shortcutsScreen.section(UIString.UIString('Memory Panel'));memorySection.addAlternateKeys(self.UI.shortcutRegistry.shortcutDescriptorsForAction('profiler.heap-toggle-recording'),UIString.UIString('Start/stop recording'));const layersSection=self.UI.shortcutsScreen.section(UIString.UIString('Layers Panel'));layersSection.addAlternateKeys(LayersPanelShortcuts.ResetView,UIString.UIString('Reset view'));layersSection.addAlternateKeys(LayersPanelShortcuts.PanMode,UIString.UIString('Switch to pan mode'));layersSection.addAlternateKeys(LayersPanelShortcuts.RotateMode,UIString.UIString('Switch to rotate mode'));layersSection.addAlternateKeys(LayersPanelShortcuts.TogglePanRotate,UIString.UIString('Temporarily toggle pan/rotate mode while held'));layersSection.addAlternateKeys(LayersPanelShortcuts.ZoomIn,UIString.UIString('Zoom in'));layersSection.addAlternateKeys(LayersPanelShortcuts.ZoomOut,UIString.UIString('Zoom out'));layersSection.addRelatedKeys(LayersPanelShortcuts.Up.concat(LayersPanelShortcuts.Down),UIString.UIString('Pan or rotate up/down'));layersSection.addRelatedKeys(LayersPanelShortcuts.Left.concat(LayersPanelShortcuts.Right),UIString.UIString('Pan or rotate left/right'));}
section(name){let section=this._sections[name];if(!section){this._sections[name]=section=new ShortcutsSection(name);}
return section;}
createShortcutsTabView(){const orderedSections=[];for(const section in this._sections){orderedSections.push(this._sections[section]);}
function compareSections(a,b){return a.order-b.order;}
orderedSections.sort(compareSections);const widget=new Widget();widget.element.className='settings-tab-container';widget.element.createChild('header').createChild('h1').createTextChild(ls`Shortcuts`);const scrollPane=widget.element.createChild('div','settings-container-wrapper');const container=scrollPane.createChild('div');container.className='settings-content settings-container';for(let i=0;i<orderedSections.length;++i){orderedSections[i].renderSection(container);}
const note=scrollPane.createChild('p','settings-footnote');note.appendChild(createDocumentationLink('iterate/inspect-styles/shortcuts',UIString.UIString('Full list of DevTools keyboard shortcuts and gestures')));return widget;}}
class ShortcutsSection{constructor(name){this.name=name;this._lines=([]);this.order=++ShortcutsSection._sequenceNumber;}
addKey(key,description){this._addLine(this._renderKey(key),description);}
addRelatedKeys(keys,description){this._addLine(this._renderSequence(keys,'/'),description);}
addAlternateKeys(keys,description){this._addLine(this._renderSequence(keys,UIString.UIString('or')),description);}
_addLine(keyElement,description){this._lines.push({key:keyElement,text:description});}
renderSection(container){const parent=container.createChild('div','settings-block');const headLine=parent.createChild('div','settings-line');headLine.createChild('div','settings-key-cell');headLine.createChild('div','settings-section-title settings-cell').textContent=this.name;markAsHeading(headLine,2);for(let i=0;i<this._lines.length;++i){const line=parent.createChild('div','settings-line');const keyCell=line.createChild('div','settings-key-cell');keyCell.appendChild(this._lines[i].key);keyCell.appendChild(this._createSpan('settings-key-delimiter',':'));line.createChild('div','settings-cell').textContent=this._lines[i].text;}}
_renderSequence(sequence,delimiter){const delimiterSpan=this._createSpan('settings-key-delimiter',delimiter);return this._joinNodes(sequence.map(this._renderKey.bind(this)),delimiterSpan);}
_renderKey(key){const keyName=key.name;const plus=this._createSpan('settings-combine-keys','+');return this._joinNodes(keyName.split(' + ').map(this._createSpan.bind(this,'settings-key')),plus);}
_createSpan(className,textContent){const node=createElement('span');node.className=className;node.textContent=textContent;return node;}
_joinNodes(nodes,delimiter){const result=createDocumentFragment();for(let i=0;i<nodes.length;++i){if(i>0){result.appendChild(delimiter.cloneNode(true));}
result.appendChild(nodes[i]);}
return result;}}
ShortcutsSection._sequenceNumber=0;const ElementsPanelShortcuts={NavigateUp:[KeyboardShortcut.makeDescriptor(Keys.Up)],NavigateDown:[KeyboardShortcut.makeDescriptor(Keys.Down)],Expand:[KeyboardShortcut.makeDescriptor(Keys.Right)],Collapse:[KeyboardShortcut.makeDescriptor(Keys.Left)],EditAttribute:[KeyboardShortcut.makeDescriptor(Keys.Enter)],NextProperty:[KeyboardShortcut.makeDescriptor(Keys.Tab)],PreviousProperty:[KeyboardShortcut.makeDescriptor(Keys.Tab,Modifiers.Shift)],IncrementValue:[KeyboardShortcut.makeDescriptor(Keys.Up)],DecrementValue:[KeyboardShortcut.makeDescriptor(Keys.Down)],IncrementBy10:[KeyboardShortcut.makeDescriptor(Keys.PageUp),KeyboardShortcut.makeDescriptor(Keys.Up,Modifiers.Shift)],DecrementBy10:[KeyboardShortcut.makeDescriptor(Keys.PageDown),KeyboardShortcut.makeDescriptor(Keys.Down,Modifiers.Shift)],IncrementBy100:[KeyboardShortcut.makeDescriptor(Keys.PageUp,Modifiers.Shift)],DecrementBy100:[KeyboardShortcut.makeDescriptor(Keys.PageDown,Modifiers.Shift)],IncrementBy01:[KeyboardShortcut.makeDescriptor(Keys.Up,Modifiers.Alt)],DecrementBy01:[KeyboardShortcut.makeDescriptor(Keys.Down,Modifiers.Alt)]};const ConsolePanelShortcuts={AcceptSuggestion:[KeyboardShortcut.makeDescriptor(Keys.Tab),KeyboardShortcut.makeDescriptor(Keys.Right)],ClearConsolePrompt:[KeyboardShortcut.makeDescriptor('u',Modifiers.Ctrl)],ExecuteCommand:KeyboardShortcut.makeDescriptor(Keys.Enter),NextPreviousLine:[KeyboardShortcut.makeDescriptor(Keys.Down),KeyboardShortcut.makeDescriptor(Keys.Up)],NextPreviousCommand:[KeyboardShortcut.makeDescriptor('N',Modifiers.Alt),KeyboardShortcut.makeDescriptor('P',Modifiers.Alt)],};const SourcesPanelShortcuts={SelectNextOccurrence:[KeyboardShortcut.makeDescriptor('d',Modifiers.CtrlOrMeta)],SoftUndo:[KeyboardShortcut.makeDescriptor('u',Modifiers.CtrlOrMeta)],GotoMatchingBracket:[KeyboardShortcut.makeDescriptor('m',Modifiers.Ctrl)],ToggleAutocompletion:[KeyboardShortcut.makeDescriptor(Keys.Space,Modifiers.Ctrl)],IncreaseCSSUnitByOne:[KeyboardShortcut.makeDescriptor(Keys.Up,Modifiers.Alt)],DecreaseCSSUnitByOne:[KeyboardShortcut.makeDescriptor(Keys.Down,Modifiers.Alt)],IncreaseCSSUnitByTen:[KeyboardShortcut.makeDescriptor(Keys.PageUp,Modifiers.Alt)],DecreaseCSSUnitByTen:[KeyboardShortcut.makeDescriptor(Keys.PageDown,Modifiers.Alt)],EvaluateSelectionInConsole:[KeyboardShortcut.makeDescriptor('e',Modifiers.Shift|Modifiers.Ctrl)],AddSelectionToWatch:[KeyboardShortcut.makeDescriptor('a',Modifiers.Shift|Modifiers.Ctrl)],ToggleComment:[KeyboardShortcut.makeDescriptor(Keys.Slash,Modifiers.CtrlOrMeta)],};const LayersPanelShortcuts={ResetView:[KeyboardShortcut.makeDescriptor('0')],PanMode:[KeyboardShortcut.makeDescriptor('x')],RotateMode:[KeyboardShortcut.makeDescriptor('v')],TogglePanRotate:[KeyboardShortcut.makeDescriptor(Keys.Shift)],ZoomIn:[KeyboardShortcut.makeDescriptor(Keys.Plus,Modifiers.Shift),KeyboardShortcut.makeDescriptor(Keys.NumpadPlus)],ZoomOut:[KeyboardShortcut.makeDescriptor(Keys.Minus,Modifiers.Shift),KeyboardShortcut.makeDescriptor(Keys.NumpadMinus)],Up:[KeyboardShortcut.makeDescriptor(Keys.Up),KeyboardShortcut.makeDescriptor('w')],Down:[KeyboardShortcut.makeDescriptor(Keys.Down),KeyboardShortcut.makeDescriptor('s')],Left:[KeyboardShortcut.makeDescriptor(Keys.Left),KeyboardShortcut.makeDescriptor('a')],Right:[KeyboardShortcut.makeDescriptor(Keys.Right),KeyboardShortcut.makeDescriptor('d')]};var ShortcutsScreen$1=Object.freeze({__proto__:null,ShortcutsScreen:ShortcutsScreen,SourcesPanelShortcuts:SourcesPanelShortcuts,LayersPanelShortcuts:LayersPanelShortcuts});class SoftDropDown{constructor(model,delegate){this._delegate=delegate;this._selectedItem=null;this._model=model;this._placeholderText=ls`(no item selected)`;this.element=createElementWithClass('button','soft-dropdown');appendStyle(this.element,'ui/softDropDownButton.css');this._titleElement=this.element.createChild('span','title');const dropdownArrowIcon=Icon.create('smallicon-triangle-down');this.element.appendChild(dropdownArrowIcon);setExpanded(this.element,false);this._glassPane=new GlassPane();this._glassPane.setMarginBehavior(MarginBehavior.NoMargin);this._glassPane.setAnchorBehavior(AnchorBehavior.PreferBottom);this._glassPane.setOutsideClickCallback(this._hide.bind(this));this._glassPane.setPointerEventsBehavior(PointerEventsBehavior.BlockedByGlassPane);this._list=new ListControl(model,this,ListMode.EqualHeightItems);this._list.element.classList.add('item-list');this._rowHeight=36;this._width=315;createShadowRootWithCoreStyles(this._glassPane.contentElement,'ui/softDropDown.css').appendChild(this._list.element);markAsMenu(this._list.element);this._listWasShowing200msAgo=false;this.element.addEventListener('mousedown',event=>{if(this._listWasShowing200msAgo){this._hide(event);}else if(!this.element.disabled){this._show(event);}},false);this.element.addEventListener('keydown',this._onKeyDownButton.bind(this),false);this._list.element.addEventListener('keydown',this._onKeyDownList.bind(this),false);this._list.element.addEventListener('focusout',this._hide.bind(this),false);this._list.element.addEventListener('mousedown',event=>event.consume(true),false);this._list.element.addEventListener('mouseup',event=>{if(event.target===this._list.element){return;}
if(!this._listWasShowing200msAgo){return;}
this._selectHighlightedItem();this._hide(event);},false);model.addEventListener(Events$3.ItemsReplaced,this._itemsReplaced,this);}
_show(event){if(this._glassPane.isShowing()){return;}
this._glassPane.setContentAnchorBox(this.element.boxInWindow());this._glassPane.show((this.element.ownerDocument));this._list.element.focus();setExpanded(this.element,true);this._updateGlasspaneSize();if(this._selectedItem){this._list.selectItem(this._selectedItem);}
event.consume(true);setTimeout(()=>this._listWasShowing200msAgo=true,200);}
_updateGlasspaneSize(){const maxHeight=this._rowHeight*(Math.min(this._model.length,9));this._glassPane.setMaxContentSize(new Size(this._width,maxHeight));this._list.viewportResized();}
_hide(event){setTimeout(()=>this._listWasShowing200msAgo=false,200);this._glassPane.hide();this._list.selectItem(null);setExpanded(this.element,false);this.element.focus();event.consume(true);}
_onKeyDownButton(event){let handled=false;switch(event.key){case'ArrowUp':this._show(event);this._list.selectItemNextPage();handled=true;break;case'ArrowDown':this._show(event);this._list.selectItemPreviousPage();handled=true;break;case'Enter':case' ':this._show(event);handled=true;break;default:break;}
if(handled){event.consume(true);}}
_onKeyDownList(event){let handled=false;switch(event.key){case'ArrowLeft':handled=this._list.selectPreviousItem(false,false);break;case'ArrowRight':handled=this._list.selectNextItem(false,false);break;case'Home':for(let i=0;i<this._model.length;i++){if(this.isItemSelectable(this._model.at(i))){this._list.selectItem(this._model.at(i));handled=true;break;}}
break;case'End':for(let i=this._model.length-1;i>=0;i--){if(this.isItemSelectable(this._model.at(i))){this._list.selectItem(this._model.at(i));handled=true;break;}}
break;case'Escape':this._hide(event);handled=true;break;case'Tab':case'Enter':case' ':this._selectHighlightedItem();this._hide(event);handled=true;break;default:if(event.key.length===1){const selectedIndex=this._list.selectedIndex();const letter=event.key.toUpperCase();for(let i=0;i<this._model.length;i++){const item=this._model.at((selectedIndex+i+1)%this._model.length);if(this._delegate.titleFor(item).toUpperCase().startsWith(letter)){this._list.selectItem(item);break;}}
handled=true;}
break;}
if(handled){event.consume(true);}}
setWidth(width){this._width=width;this._updateGlasspaneSize();}
setRowHeight(rowHeight){this._rowHeight=rowHeight;}
setPlaceholderText(text){this._placeholderText=text;if(!this._selectedItem){this._titleElement.textContent=this._placeholderText;}}
_itemsReplaced(event){const removed=(event.data.removed);if(removed.indexOf(this._selectedItem)!==-1){this._selectedItem=null;this._selectHighlightedItem();}
this._updateGlasspaneSize();}
selectItem(item){this._selectedItem=item;if(this._selectedItem){this._titleElement.textContent=this._delegate.titleFor(this._selectedItem);}else{this._titleElement.textContent=this._placeholderText;}
this._delegate.itemSelected(this._selectedItem);}
createElementForItem(item){const element=createElementWithClass('div','item');element.addEventListener('mousemove',e=>{if((e.movementX||e.movementY)&&this._delegate.isItemSelectable(item)){this._list.selectItem(item,false,true);}});element.classList.toggle('disabled',!this._delegate.isItemSelectable(item));element.classList.toggle('highlighted',this._list.selectedItem()===item);markAsMenuItem(element);element.appendChild(this._delegate.createElementForItem(item));return element;}
heightForItem(item){return this._rowHeight;}
isItemSelectable(item){return this._delegate.isItemSelectable(item);}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.classList.remove('highlighted');}
if(toElement){toElement.classList.add('highlighted');}
setActiveDescendant(this._list.element,toElement);this._delegate.highlightedItemChanged(from,to,fromElement&&fromElement.firstElementChild,toElement&&toElement.firstElementChild);}
updateSelectedItemARIA(fromElement,toElement){return false;}
_selectHighlightedItem(){this.selectItem(this._list.selectedItem());}
refreshItem(item){this._list.refreshItem(item);}}
class Delegate$1{titleFor(item){}
createElementForItem(item){}
isItemSelectable(item){}
itemSelected(item){}
highlightedItemChanged(from,to,fromElement,toElement){}}
var SoftDropDown$1=Object.freeze({__proto__:null,SoftDropDown:SoftDropDown,Delegate:Delegate$1});class SyntaxHighlighter{constructor(mimeType,stripExtraWhitespace){this._mimeType=mimeType;this._stripExtraWhitespace=stripExtraWhitespace;}
createSpan(content,className){const span=createElement('span');span.className=className.replace(/\S+/g,'cm-$&');if(this._stripExtraWhitespace&&className!=='whitespace'){content=content.replace(/^[\n\r]*/,'').replace(/\s*$/,'');}
span.createTextChild(content);return span;}
syntaxHighlightNode(node){const lines=node.textContent.split('\n');let plainTextStart;let line;return self.runtime.extension(TextUtils.TokenizerFactory).instance().then(processTokens.bind(this));function processTokens(tokenizerFactory){node.removeChildren();const tokenize=tokenizerFactory.createTokenizer(this._mimeType);for(let i=0;i<lines.length;++i){line=lines[i];plainTextStart=0;tokenize(line,processToken.bind(this));if(plainTextStart<line.length){const plainText=line.substring(plainTextStart,line.length);node.createTextChild(plainText);}
if(i<lines.length-1){node.createTextChild('\n');}}}
function processToken(token,tokenType,column,newColumn){if(!tokenType){return;}
if(column>plainTextStart){const plainText=line.substring(plainTextStart,column);node.createTextChild(plainText);}
node.appendChild(this.createSpan(token,tokenType));plainTextStart=newColumn;}}}
var SyntaxHighlighter$1=Object.freeze({__proto__:null,SyntaxHighlighter:SyntaxHighlighter});class TargetCrashedScreen extends VBox{constructor(hideCallback){super(true);this.registerRequiredCSS('ui/targetCrashedScreen.css');this.contentElement.createChild('div','message').textContent=UIString.UIString('DevTools was disconnected from the page.');this.contentElement.createChild('div','message').textContent=UIString.UIString('Once page is reloaded, DevTools will automatically reconnect.');this._hideCallback=hideCallback;}
willHide(){this._hideCallback.call(null);}}
var TargetCrashedScreen$1=Object.freeze({__proto__:null,TargetCrashedScreen:TargetCrashedScreen});class TextEditorFactory{createEditor(options){}}
class TextEditor extends EventTarget.EventTarget{widget(){}
fullRange(){}
selection(){}
setSelection(selection){}
text(textRange){}
textWithCurrentSuggestion(){}
setText(text){}
line(lineNumber){}
newlineAndIndent(){}
addKeyDownHandler(handler){}
configureAutocomplete(config){}
clearAutocomplete(){}
visualCoordinates(lineNumber,columnNumber){}
tokenAtTextPosition(lineNumber,columnNumber){}
setPlaceholder(placeholder){}}
const Events$9={CursorChanged:Symbol('CursorChanged'),TextChanged:Symbol('TextChanged'),SuggestionChanged:Symbol('SuggestionChanged')};let Options$1;let AutocompleteConfig$1;var TextEditor$1=Object.freeze({__proto__:null,TextEditorFactory:TextEditorFactory,TextEditor:TextEditor,Events:Events$9,Options:Options$1,AutocompleteConfig:AutocompleteConfig$1});class ThrottledWidget extends VBox{constructor(isWebComponent,timeout){super(isWebComponent);this._updateThrottler=new Throttler.Throttler(timeout===undefined?100:timeout);this._updateWhenVisible=false;}
doUpdate(){return Promise.resolve();}
update(){this._updateWhenVisible=!this.isShowing();if(this._updateWhenVisible){return;}
this._updateThrottler.schedule(innerUpdate.bind(this));function innerUpdate(){if(this.isShowing()){return this.doUpdate();}
this._updateWhenVisible=true;return Promise.resolve();}}
wasShown(){super.wasShown();if(this._updateWhenVisible){this.update();}}}
var ThrottledWidget$1=Object.freeze({__proto__:null,ThrottledWidget:ThrottledWidget});var utils=Object.freeze({__proto__:null,appendStyle:appendStyle,createShadowRootWithCoreStyles:createShadowRootWithCoreStyles,focusChanged:focusChanged,injectCoreStyles:injectCoreStyles,measuredScrollbarWidth:measuredScrollbarWidth,registerCustomElement:registerCustomElement});let PopoverRequest$1;export{ARIAUtils,Action$1 as Action,ActionDelegate$1 as ActionDelegate,ActionRegistry$1 as ActionRegistry,Context$1 as Context,ContextFlavorListener$1 as ContextFlavorListener,ContextMenu$1 as ContextMenu,Dialog$1 as Dialog,DropTarget$1 as DropTarget,EmptyWidget$1 as EmptyWidget,FilterBar$1 as FilterBar,FilterSuggestionBuilder$1 as FilterSuggestionBuilder,ForwardedInputEventHandler$1 as ForwardedInputEventHandler,Fragment$1 as Fragment,Geometry,GlassPane$1 as GlassPane,HistoryInput$1 as HistoryInput,Icon$1 as Icon,Infobar$1 as Infobar,InplaceEditor$1 as InplaceEditor,InspectorView$1 as InspectorView,KeyboardShortcut$1 as KeyboardShortcut,ListControl$1 as ListControl,ListModel$1 as ListModel,ListWidget$1 as ListWidget,Panel$1 as Panel,PopoverHelper$1 as PopoverHelper,PopoverRequest$1 as PopoverRequest,ProgressIndicator$1 as ProgressIndicator,RemoteDebuggingTerminatedScreen$1 as RemoteDebuggingTerminatedScreen,ReportView$1 as ReportView,ResizerWidget$1 as ResizerWidget,RootView$1 as RootView,SearchableView$1 as SearchableView,SegmentedButton$1 as SegmentedButton,SettingsUI,ShortcutRegistry$1 as ShortcutRegistry,ShortcutsScreen$1 as ShortcutsScreen,SoftContextMenu$1 as SoftContextMenu,SoftDropDown$1 as SoftDropDown,SplitWidget$1 as SplitWidget,SuggestBox$1 as SuggestBox,SyntaxHighlighter$1 as SyntaxHighlighter,TabbedPane$1 as TabbedPane,TargetCrashedScreen$1 as TargetCrashedScreen,TextEditor$1 as TextEditor,TextPrompt$1 as TextPrompt,ThrottledWidget$1 as ThrottledWidget,Toolbar$1 as Toolbar,Tooltip$1 as Tooltip,Treeoutline as TreeOutline,UIUtils,utils as Utils,View$1 as View,ViewManager$1 as ViewManager,Widget$1 as Widget,XElement$1 as XElement,XLink$1 as XLink,XWidget$1 as XWidget,ZoomManager$1 as ZoomManager};