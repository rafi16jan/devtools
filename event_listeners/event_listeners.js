import{DOMDebuggerModel,RemoteObject}from'../sdk/sdk.js';import{Console,UIString,Revealer}from'../common/common.js';import{Linkifier}from'../components/components.js';import{ObjectPropertiesSection}from'../object_ui/object_ui.js';import{Widget,TreeOutline,ARIAUtils,ContextMenu}from'../ui/ui.js';function frameworkEventListeners(object){const domDebuggerModel=object.runtimeModel().target().model(DOMDebuggerModel.DOMDebuggerModel);if(!domDebuggerModel){return Promise.resolve(({eventListeners:[],internalHandlers:null}));}
const listenersResult=({eventListeners:[]});return object.callFunction(frameworkEventListenersImpl,undefined).then(assertCallFunctionResult).then(getOwnProperties).then(createEventListeners).then(returnResult).catch(error=>{console.error(error);return listenersResult;});function getOwnProperties(object){return object.getOwnProperties(false);}
function createEventListeners(result){if(!result.properties){throw new Error('Object properties is empty');}
const promises=[];for(const property of result.properties){if(property.name==='eventListeners'&&property.value){promises.push(convertToEventListeners(property.value).then(storeEventListeners));}
if(property.name==='internalHandlers'&&property.value){promises.push(convertToInternalHandlers(property.value).then(storeInternalHandlers));}
if(property.name==='errorString'&&property.value){printErrorString(property.value);}}
return(Promise.all(promises));}
function convertToEventListeners(pageEventListenersObject){return RemoteObject.RemoteArray.objectAsArray(pageEventListenersObject).map(toEventListener).then(filterOutEmptyObjects);function toEventListener(listenerObject){let type;let useCapture;let passive;let once;let handler=null;let originalHandler=null;let location=null;let removeFunctionObject=null;const promises=[];promises.push(listenerObject.callFunctionJSON(truncatePageEventListener,undefined).then(storeTruncatedListener));function truncatePageEventListener(){return{type:this.type,useCapture:this.useCapture,passive:this.passive,once:this.once};}
function storeTruncatedListener(truncatedListener){type=truncatedListener.type;useCapture=truncatedListener.useCapture;passive=truncatedListener.passive;once=truncatedListener.once;}
promises.push(listenerObject.callFunction(handlerFunction).then(assertCallFunctionResult).then(storeOriginalHandler).then(toTargetFunction).then(storeFunctionWithDetails));function handlerFunction(){return this.handler;}
function storeOriginalHandler(functionObject){originalHandler=functionObject;return originalHandler;}
function storeFunctionWithDetails(functionObject){handler=functionObject;return(functionObject.debuggerModel().functionDetailsPromise(functionObject).then(storeFunctionDetails));}
function storeFunctionDetails(functionDetails){location=functionDetails?functionDetails.location:null;}
promises.push(listenerObject.callFunction(getRemoveFunction).then(assertCallFunctionResult).then(storeRemoveFunction));function getRemoveFunction(){return this.remove;}
function storeRemoveFunction(functionObject){if(functionObject.type!=='function'){return;}
removeFunctionObject=functionObject;}
return Promise.all(promises).then(createEventListener).catch(error=>{console.error(error);return null;});function createEventListener(){if(!location){throw new Error('Empty event listener\'s location');}
return new DOMDebuggerModel.EventListener((domDebuggerModel),object,type,useCapture,passive,once,handler,originalHandler,location,removeFunctionObject,DOMDebuggerModel.EventListener.Origin.FrameworkUser);}}}
function convertToInternalHandlers(pageInternalHandlersObject){return RemoteObject.RemoteArray.objectAsArray(pageInternalHandlersObject).map(toTargetFunction).then(RemoteObject.RemoteArray.createFromRemoteObjects.bind(null));}
function toTargetFunction(functionObject){return RemoteObject.RemoteFunction.objectAsFunction(functionObject).targetFunction();}
function storeEventListeners(eventListeners){listenersResult.eventListeners=eventListeners;}
function storeInternalHandlers(internalHandlers){listenersResult.internalHandlers=internalHandlers;}
function printErrorString(errorString){Console.Console.instance().error(String(errorString.value));}
function returnResult(){return listenersResult;}
function assertCallFunctionResult(result){if(result.wasThrown||!result.object){throw new Error('Exception in callFunction or empty result');}
return result.object;}
function filterOutEmptyObjects(objects){return objects.filter(filterOutEmpty);function filterOutEmpty(object){return!!object;}}
function frameworkEventListenersImpl(){const errorLines=[];let eventListeners=[];let internalHandlers=[];let fetchers=[jQueryFetcher];try{if(self.devtoolsFrameworkEventListeners&&isArrayLike(self.devtoolsFrameworkEventListeners)){fetchers=fetchers.concat(self.devtoolsFrameworkEventListeners);}}catch(e){errorLines.push('devtoolsFrameworkEventListeners call produced error: '+toString(e));}
for(let i=0;i<fetchers.length;++i){try{const fetcherResult=fetchers[i](this);if(fetcherResult.eventListeners&&isArrayLike(fetcherResult.eventListeners)){eventListeners=eventListeners.concat(fetcherResult.eventListeners.map(checkEventListener).filter(nonEmptyObject));}
if(fetcherResult.internalHandlers&&isArrayLike(fetcherResult.internalHandlers)){internalHandlers=internalHandlers.concat(fetcherResult.internalHandlers.map(checkInternalHandler).filter(nonEmptyObject));}}catch(e){errorLines.push('fetcher call produced error: '+toString(e));}}
const result={eventListeners:eventListeners};if(internalHandlers.length){result.internalHandlers=internalHandlers;}
if(errorLines.length){let errorString='Framework Event Listeners API Errors:\n\t'+errorLines.join('\n\t');errorString=errorString.substr(0,errorString.length-1);result.errorString=errorString;}
return result;function isArrayLike(obj){if(!obj||typeof obj!=='object'){return false;}
try{if(typeof obj.splice==='function'){const len=obj.length;return typeof len==='number'&&(len>>>0===len&&(len>0||1/len>0));}}catch(e){}
return false;}
function checkEventListener(eventListener){try{let errorString='';if(!eventListener){errorString+='empty event listener, ';}
const type=eventListener.type;if(!type||(typeof type!=='string')){errorString+='event listener\'s type isn\'t string or empty, ';}
const useCapture=eventListener.useCapture;if(typeof useCapture!=='boolean'){errorString+='event listener\'s useCapture isn\'t boolean or undefined, ';}
const passive=eventListener.passive;if(typeof passive!=='boolean'){errorString+='event listener\'s passive isn\'t boolean or undefined, ';}
const once=eventListener.once;if(typeof once!=='boolean'){errorString+='event listener\'s once isn\'t boolean or undefined, ';}
const handler=eventListener.handler;if(!handler||(typeof handler!=='function')){errorString+='event listener\'s handler isn\'t a function or empty, ';}
const remove=eventListener.remove;if(remove&&(typeof remove!=='function')){errorString+='event listener\'s remove isn\'t a function, ';}
if(!errorString){return{type:type,useCapture:useCapture,passive:passive,once:once,handler:handler,remove:remove};}
errorLines.push(errorString.substr(0,errorString.length-2));return null;}catch(error){errorLines.push(toString(error));return null;}}
function checkInternalHandler(handler){if(handler&&(typeof handler==='function')){return handler;}
errorLines.push('internal handler isn\'t a function or empty');return null;}
function toString(obj){try{return''+obj;}catch(e){return'<error>';}}
function nonEmptyObject(obj){return!!obj;}
function jQueryFetcher(node){if(!node||!(node instanceof Node)){return{eventListeners:[]};}
const jQuery=(window['jQuery']);if(!jQuery||!jQuery.fn){return{eventListeners:[]};}
const jQueryFunction=(jQuery);const data=jQuery._data||jQuery.data;const eventListeners=[];const internalHandlers=[];if(typeof data==='function'){const events=data(node,'events');for(const type in events){for(const key in events[type]){const frameworkListener=events[type][key];if(typeof frameworkListener==='object'||typeof frameworkListener==='function'){const listener={handler:frameworkListener.handler||frameworkListener,useCapture:true,passive:false,once:false,type:type};listener.remove=jQueryRemove.bind(node,frameworkListener.selector);eventListeners.push(listener);}}}
const nodeData=data(node);if(nodeData&&typeof nodeData.handle==='function'){internalHandlers.push(nodeData.handle);}}
const entry=jQueryFunction(node)[0];if(entry){const entryEvents=entry['$events'];for(const type in entryEvents){const events=entryEvents[type];for(const key in events){if(typeof events[key]==='function'){const listener={handler:events[key],useCapture:true,passive:false,once:false,type:type};eventListeners.push(listener);}}}
if(entry&&entry['$handle']){internalHandlers.push(entry['$handle']);}}
return{eventListeners:eventListeners,internalHandlers:internalHandlers};}
function jQueryRemove(selector,type,handler){if(!this||!(this instanceof Node)){return;}
const node=(this);const jQuery=(window['jQuery']);if(!jQuery||!jQuery.fn){return;}
const jQueryFunction=(jQuery);jQueryFunction(node).off(type,selector,handler);}}}
let FrameworkEventListenersObject;let EventListenerObjectInInspectedPage;var EventListenersUtils=Object.freeze({__proto__:null,frameworkEventListeners:frameworkEventListeners,FrameworkEventListenersObject:FrameworkEventListenersObject,EventListenerObjectInInspectedPage:EventListenerObjectInInspectedPage});class EventListenersView extends Widget.VBox{constructor(changeCallback){super();this._changeCallback=changeCallback;this._treeOutline=new TreeOutline.TreeOutlineInShadow();this._treeOutline.hideOverflow();this._treeOutline.registerRequiredCSS('object_ui/objectValue.css');this._treeOutline.registerRequiredCSS('event_listeners/eventListenersView.css');this._treeOutline.setComparator(EventListenersTreeElement.comparator);this._treeOutline.element.classList.add('monospace');this._treeOutline.setShowSelectionOnKeyboardFocus(true);this._treeOutline.setFocusable(true);this.element.appendChild(this._treeOutline.element);this._emptyHolder=createElementWithClass('div','gray-info-message');this._emptyHolder.textContent=UIString.UIString('No event listeners');this._emptyHolder.tabIndex=-1;this._linkifier=new Linkifier.Linkifier();this._treeItemMap=new Map();}
focus(){if(!this._emptyHolder.parentNode){this._treeOutline.forceSelect();}else{this._emptyHolder.focus();}}
async addObjects(objects){this.reset();await Promise.all(objects.map(obj=>obj?this._addObject(obj):Promise.resolve()));this.addEmptyHolderIfNeeded();this._eventListenersArrivedForTest();}
_addObject(object){let eventListeners;let frameworkEventListenersObject=null;const promises=[];const domDebuggerModel=object.runtimeModel().target().model(DOMDebuggerModel.DOMDebuggerModel);if(domDebuggerModel){promises.push(domDebuggerModel.eventListeners(object).then(storeEventListeners));}
promises.push(frameworkEventListeners(object).then(storeFrameworkEventListenersObject));return Promise.all(promises).then(markInternalEventListeners).then(addEventListeners.bind(this));function storeEventListeners(result){eventListeners=result;}
function storeFrameworkEventListenersObject(result){frameworkEventListenersObject=result;}
function markInternalEventListeners(){if(!frameworkEventListenersObject.internalHandlers){return Promise.resolve(undefined);}
return frameworkEventListenersObject.internalHandlers.object().callFunctionJSON(isInternalEventListener,eventListeners.map(handlerArgument)).then(setIsInternal);function handlerArgument(listener){return RemoteObject.RemoteObject.toCallArgument(listener.handler());}
function isInternalEventListener(){const isInternal=[];const internalHandlersSet=new Set(this);for(const handler of arguments){isInternal.push(internalHandlersSet.has(handler));}
return isInternal;}
function setIsInternal(isInternal){for(let i=0;i<eventListeners.length;++i){if(isInternal[i]){eventListeners[i].markAsFramework();}}}}
function addEventListeners(){this._addObjectEventListeners(object,eventListeners);this._addObjectEventListeners(object,frameworkEventListenersObject.eventListeners);}}
_addObjectEventListeners(object,eventListeners){if(!eventListeners){return;}
for(const eventListener of eventListeners){const treeItem=this._getOrCreateTreeElementForType(eventListener.type());treeItem.addObjectEventListener(eventListener,object);}}
showFrameworkListeners(showFramework,showPassive,showBlocking){const eventTypes=this._treeOutline.rootElement().children();for(const eventType of eventTypes){let hiddenEventType=true;for(const listenerElement of eventType.children()){const listenerOrigin=listenerElement.eventListener().origin();let hidden=false;if(listenerOrigin===DOMDebuggerModel.EventListener.Origin.FrameworkUser&&!showFramework){hidden=true;}
if(listenerOrigin===DOMDebuggerModel.EventListener.Origin.Framework&&showFramework){hidden=true;}
if(!showPassive&&listenerElement.eventListener().passive()){hidden=true;}
if(!showBlocking&&!listenerElement.eventListener().passive()){hidden=true;}
listenerElement.hidden=hidden;hiddenEventType=hiddenEventType&&hidden;}
eventType.hidden=hiddenEventType;}}
_getOrCreateTreeElementForType(type){let treeItem=this._treeItemMap.get(type);if(!treeItem){treeItem=new EventListenersTreeElement(type,this._linkifier,this._changeCallback);this._treeItemMap.set(type,treeItem);treeItem.hidden=true;this._treeOutline.appendChild(treeItem);}
this._emptyHolder.remove();return treeItem;}
addEmptyHolderIfNeeded(){let allHidden=true;let firstVisibleChild=null;for(const eventType of this._treeOutline.rootElement().children()){eventType.hidden=!eventType.firstChild();allHidden=allHidden&&eventType.hidden;if(!firstVisibleChild&&!eventType.hidden){firstVisibleChild=eventType;}}
if(allHidden&&!this._emptyHolder.parentNode){this.element.appendChild(this._emptyHolder);}
if(firstVisibleChild){firstVisibleChild.select(true);}}
reset(){const eventTypes=this._treeOutline.rootElement().children();for(const eventType of eventTypes){eventType.removeChildren();}
this._linkifier.reset();}
_eventListenersArrivedForTest(){}}
class EventListenersTreeElement extends TreeOutline.TreeElement{constructor(type,linkifier,changeCallback){super(type);this.toggleOnClick=true;this._linkifier=linkifier;this._changeCallback=changeCallback;ARIAUtils.setAccessibleName(this.listItemElement,`${type}, event listener`);}
static comparator(element1,element2){if(element1.title===element2.title){return 0;}
return element1.title>element2.title?1:-1;}
addObjectEventListener(eventListener,object){const treeElement=new ObjectEventListenerBar(eventListener,object,this._linkifier,this._changeCallback);this.appendChild((treeElement));}}
class ObjectEventListenerBar extends TreeOutline.TreeElement{constructor(eventListener,object,linkifier,changeCallback){super('',true);this._eventListener=eventListener;this.editable=false;this._setTitle(object,linkifier);this._changeCallback=changeCallback;}
async onpopulate(){const properties=[];const eventListener=this._eventListener;const runtimeModel=eventListener.domDebuggerModel().runtimeModel();properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('useCapture',eventListener.useCapture()));properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('passive',eventListener.passive()));properties.push(runtimeModel.createRemotePropertyFromPrimitiveValue('once',eventListener.once()));if(typeof eventListener.handler()!=='undefined'){properties.push(new RemoteObject.RemoteObjectProperty('handler',eventListener.handler()));}
ObjectPropertiesSection.ObjectPropertyTreeElement.populateWithProperties(this,properties,[],true,null);}
_setTitle(object,linkifier){const title=this.listItemElement.createChild('span','event-listener-details');const subtitle=this.listItemElement.createChild('span','event-listener-tree-subtitle');const linkElement=linkifier.linkifyRawLocation(this._eventListener.location(),this._eventListener.sourceURL());subtitle.appendChild(linkElement);const propertyValue=ObjectPropertiesSection.ObjectPropertiesSection.createPropertyValue(object,false,false);this._valueTitle=propertyValue.element;title.appendChild(this._valueTitle);if(this._eventListener.canRemove()){const deleteButton=title.createChild('span','event-listener-button');deleteButton.textContent=UIString.UIString('Remove');deleteButton.title=UIString.UIString('Delete event listener');deleteButton.addEventListener('click',event=>{this._removeListener();event.consume();},false);title.appendChild(deleteButton);}
if(this._eventListener.isScrollBlockingType()&&this._eventListener.canTogglePassive()){const passiveButton=title.createChild('span','event-listener-button');passiveButton.textContent=UIString.UIString('Toggle Passive');passiveButton.title=UIString.UIString('Toggle whether event listener is passive or blocking');passiveButton.addEventListener('click',event=>{this._togglePassiveListener();event.consume();},false);title.appendChild(passiveButton);}
this.listItemElement.addEventListener('contextmenu',event=>{const menu=new ContextMenu.ContextMenu(event);if(event.target!==linkElement){menu.appendApplicableItems(linkElement);}
if(object.subtype==='node'){menu.defaultSection().appendItem(ls`Reveal in Elements panel`,()=>Revealer.reveal(object));}
menu.defaultSection().appendItem(ls`Delete event listener`,this._removeListener.bind(this),!this._eventListener.canRemove());menu.defaultSection().appendCheckboxItem(ls`Passive`,this._togglePassiveListener.bind(this),this._eventListener.passive(),!this._eventListener.canTogglePassive());menu.show();});}
_removeListener(){this._removeListenerBar();this._eventListener.remove();}
_togglePassiveListener(){this._eventListener.togglePassive().then(this._changeCallback());}
_removeListenerBar(){const parent=this.parent;parent.removeChild(this);if(!parent.childCount()){parent.collapse();}
let allHidden=true;for(let i=0;i<parent.childCount();++i){if(!parent.childAt(i).hidden){allHidden=false;}}
parent.hidden=allHidden;}
eventListener(){return this._eventListener;}
onenter(){if(this._valueTitle){this._valueTitle.click();return true;}
return false;}}
var EventListenersView$1=Object.freeze({__proto__:null,EventListenersView:EventListenersView,EventListenersTreeElement:EventListenersTreeElement,ObjectEventListenerBar:ObjectEventListenerBar});export{EventListenersUtils,EventListenersView$1 as EventListenersView};