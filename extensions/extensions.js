import'../protocol_client/protocol_client.js';import{SDKModel,ResourceTreeModel,HARLog,NetworkManager,DOMModel,RuntimeModel,RemoteObject}from'../sdk/sdk.js';import{View,Widget,Panel,Toolbar,SearchableView,UIUtils}from'../ui/ui.js';import{ResourceUtils}from'../bindings/bindings.js';import{ObjectWrapper,Revealer}from'../common/common.js';import{Linkifier}from'../components/components.js';import{InspectorFrontendHost,InspectorFrontendHostAPI}from'../host/host.js';import{StringUtilities}from'../platform/platform.js';import{Runtime}from'../root/root.js';import'../text_utils/text_utils.js';import{Workspace}from'../workspace/workspace.js';function defineCommonExtensionSymbols(apiPrivate){if(!apiPrivate.panels){apiPrivate.panels={};}
apiPrivate.panels.SearchAction={CancelSearch:'cancelSearch',PerformSearch:'performSearch',NextSearchResult:'nextSearchResult',PreviousSearchResult:'previousSearchResult'};apiPrivate.Events={ButtonClicked:'button-clicked-',PanelObjectSelected:'panel-objectSelected-',NetworkRequestFinished:'network-request-finished',OpenResource:'open-resource',PanelSearch:'panel-search-',RecordingStarted:'trace-recording-started-',RecordingStopped:'trace-recording-stopped-',ResourceAdded:'resource-added',ResourceContentCommitted:'resource-content-committed',ViewShown:'view-shown-',ViewHidden:'view-hidden-'};apiPrivate.Commands={AddRequestHeaders:'addRequestHeaders',AddTraceProvider:'addTraceProvider',ApplyStyleSheet:'applyStyleSheet',CompleteTraceSession:'completeTraceSession',CreatePanel:'createPanel',CreateSidebarPane:'createSidebarPane',CreateToolbarButton:'createToolbarButton',EvaluateOnInspectedPage:'evaluateOnInspectedPage',ForwardKeyboardEvent:'_forwardKeyboardEvent',GetHAR:'getHAR',GetPageResources:'getPageResources',GetRequestContent:'getRequestContent',GetResourceContent:'getResourceContent',InspectedURLChanged:'inspectedURLChanged',OpenResource:'openResource',Reload:'Reload',Subscribe:'subscribe',SetOpenResourceHandler:'setOpenResourceHandler',SetResourceContent:'setResourceContent',SetSidebarContent:'setSidebarContent',SetSidebarHeight:'setSidebarHeight',SetSidebarPage:'setSidebarPage',ShowPanel:'showPanel',Unsubscribe:'unsubscribe',UpdateButton:'updateButton'};}
self.injectedExtensionAPI=function(extensionInfo,inspectedTabId,themeName,keysToForward,testHook,injectedScriptId){const keysToForwardSet=new Set(keysToForward);const chrome=window.chrome||{};const devtools_descriptor=Object.getOwnPropertyDescriptor(chrome,'devtools');if(devtools_descriptor){return;}
const apiPrivate={};defineCommonExtensionSymbols(apiPrivate);const commands=apiPrivate.Commands;const events=apiPrivate.Events;let userAction=false;function EventSinkImpl(type,customDispatch){this._type=type;this._listeners=[];this._customDispatch=customDispatch;}
EventSinkImpl.prototype={addListener:function(callback){if(typeof callback!=='function'){throw'addListener: callback is not a function';}
if(this._listeners.length===0){extensionServer.sendRequest({command:commands.Subscribe,type:this._type});}
this._listeners.push(callback);extensionServer.registerHandler('notify-'+this._type,this._dispatch.bind(this));},removeListener:function(callback){const listeners=this._listeners;for(let i=0;i<listeners.length;++i){if(listeners[i]===callback){listeners.splice(i,1);break;}}
if(this._listeners.length===0){extensionServer.sendRequest({command:commands.Unsubscribe,type:this._type});}},_fire:function(vararg){const listeners=this._listeners.slice();for(let i=0;i<listeners.length;++i){listeners[i].apply(null,arguments);}},_dispatch:function(request){if(this._customDispatch){this._customDispatch.call(this,request);}else{this._fire.apply(this,request.arguments);}}};function InspectorExtensionAPI(){this.inspectedWindow=new InspectedWindow();this.panels=new Panels();this.network=new Network();this.timeline=new Timeline();defineDeprecatedProperty(this,'webInspector','resources','network');}
function Network(){function dispatchRequestEvent(message){const request=message.arguments[1];request.__proto__=new Request(message.arguments[0]);this._fire(request);}
this.onRequestFinished=new EventSink(events.NetworkRequestFinished,dispatchRequestEvent);defineDeprecatedProperty(this,'network','onFinished','onRequestFinished');this.onNavigated=new EventSink(events.InspectedURLChanged);}
Network.prototype={getHAR:function(callback){function callbackWrapper(result){const entries=(result&&result.entries)||[];for(let i=0;i<entries.length;++i){entries[i].__proto__=new Request(entries[i]._requestId);delete entries[i]._requestId;}
callback(result);}
extensionServer.sendRequest({command:commands.GetHAR},callback&&callbackWrapper);},addRequestHeaders:function(headers){extensionServer.sendRequest({command:commands.AddRequestHeaders,headers:headers,extensionId:window.location.hostname});}};function RequestImpl(id){this._id=id;}
RequestImpl.prototype={getContent:function(callback){function callbackWrapper(response){callback(response.content,response.encoding);}
extensionServer.sendRequest({command:commands.GetRequestContent,id:this._id},callback&&callbackWrapper);}};function Panels(){const panels={elements:new ElementsPanel(),sources:new SourcesPanel(),};function panelGetter(name){return panels[name];}
for(const panel in panels){Object.defineProperty(this,panel,{get:panelGetter.bind(null,panel),enumerable:true});}
this.applyStyleSheet=function(styleSheet){extensionServer.sendRequest({command:commands.ApplyStyleSheet,styleSheet:styleSheet});};}
Panels.prototype={create:function(title,icon,page,callback){const id='extension-panel-'+extensionServer.nextObjectId();const request={command:commands.CreatePanel,id:id,title:title,icon:icon,page:page};extensionServer.sendRequest(request,callback&&callback.bind(this,new ExtensionPanel(id)));},setOpenResourceHandler:function(callback){const hadHandler=extensionServer.hasHandler(events.OpenResource);function callbackWrapper(message){userAction=true;try{callback.call(null,new Resource(message.resource),message.lineNumber);}finally{userAction=false;}}
if(!callback){extensionServer.unregisterHandler(events.OpenResource);}else{extensionServer.registerHandler(events.OpenResource,callbackWrapper);}
if(hadHandler===!callback){extensionServer.sendRequest({command:commands.SetOpenResourceHandler,'handlerPresent':!!callback});}},openResource:function(url,lineNumber,callback){extensionServer.sendRequest({command:commands.OpenResource,'url':url,'lineNumber':lineNumber},callback);},get SearchAction(){return apiPrivate.panels.SearchAction;}};function ExtensionViewImpl(id){this._id=id;function dispatchShowEvent(message){const frameIndex=message.arguments[0];if(typeof frameIndex==='number'){this._fire(window.parent.frames[frameIndex]);}else{this._fire();}}
if(id){this.onShown=new EventSink(events.ViewShown+id,dispatchShowEvent);this.onHidden=new EventSink(events.ViewHidden+id);}}
function PanelWithSidebarImpl(hostPanelName){ExtensionViewImpl.call(this,null);this._hostPanelName=hostPanelName;this.onSelectionChanged=new EventSink(events.PanelObjectSelected+hostPanelName);}
PanelWithSidebarImpl.prototype={createSidebarPane:function(title,callback){const id='extension-sidebar-'+extensionServer.nextObjectId();const request={command:commands.CreateSidebarPane,panel:this._hostPanelName,id:id,title:title};function callbackWrapper(){callback(new ExtensionSidebarPane(id));}
extensionServer.sendRequest(request,callback&&callbackWrapper);},__proto__:ExtensionViewImpl.prototype};function declareInterfaceClass(implConstructor){return function(){const impl={__proto__:implConstructor.prototype};implConstructor.apply(impl,arguments);populateInterfaceClass(this,impl);};}
function defineDeprecatedProperty(object,className,oldName,newName){let warningGiven=false;function getter(){if(!warningGiven){console.warn(className+'.'+oldName+' is deprecated. Use '+className+'.'+newName+' instead');warningGiven=true;}
return object[newName];}
object.__defineGetter__(oldName,getter);}
function extractCallbackArgument(args){const lastArgument=args[args.length-1];return typeof lastArgument==='function'?lastArgument:undefined;}
const Button=declareInterfaceClass(ButtonImpl);const EventSink=declareInterfaceClass(EventSinkImpl);const ExtensionPanel=declareInterfaceClass(ExtensionPanelImpl);const ExtensionSidebarPane=declareInterfaceClass(ExtensionSidebarPaneImpl);const PanelWithSidebarClass=declareInterfaceClass(PanelWithSidebarImpl);const Request=declareInterfaceClass(RequestImpl);const Resource=declareInterfaceClass(ResourceImpl);const TraceSession=declareInterfaceClass(TraceSessionImpl);class ElementsPanel extends PanelWithSidebarClass{constructor(){super('elements');}}
class SourcesPanel extends PanelWithSidebarClass{constructor(){super('sources');}}
function ExtensionPanelImpl(id){ExtensionViewImpl.call(this,id);this.onSearch=new EventSink(events.PanelSearch+id);}
ExtensionPanelImpl.prototype={createStatusBarButton:function(iconPath,tooltipText,disabled){const id='button-'+extensionServer.nextObjectId();const request={command:commands.CreateToolbarButton,panel:this._id,id:id,icon:iconPath,tooltip:tooltipText,disabled:!!disabled};extensionServer.sendRequest(request);return new Button(id);},show:function(){if(!userAction){return;}
const request={command:commands.ShowPanel,id:this._id};extensionServer.sendRequest(request);},__proto__:ExtensionViewImpl.prototype};function ExtensionSidebarPaneImpl(id){ExtensionViewImpl.call(this,id);}
ExtensionSidebarPaneImpl.prototype={setHeight:function(height){extensionServer.sendRequest({command:commands.SetSidebarHeight,id:this._id,height:height});},setExpression:function(expression,rootTitle,evaluateOptions){const request={command:commands.SetSidebarContent,id:this._id,expression:expression,rootTitle:rootTitle,evaluateOnPage:true,};if(typeof evaluateOptions==='object'){request.evaluateOptions=evaluateOptions;}
extensionServer.sendRequest(request,extractCallbackArgument(arguments));},setObject:function(jsonObject,rootTitle,callback){extensionServer.sendRequest({command:commands.SetSidebarContent,id:this._id,expression:jsonObject,rootTitle:rootTitle},callback);},setPage:function(page){extensionServer.sendRequest({command:commands.SetSidebarPage,id:this._id,page:page});},__proto__:ExtensionViewImpl.prototype};function ButtonImpl(id){this._id=id;this.onClicked=new EventSink(events.ButtonClicked+id);}
ButtonImpl.prototype={update:function(iconPath,tooltipText,disabled){const request={command:commands.UpdateButton,id:this._id,icon:iconPath,tooltip:tooltipText,disabled:!!disabled};extensionServer.sendRequest(request);}};function Timeline(){}
Timeline.prototype={addTraceProvider:function(categoryName,categoryTooltip){const id='extension-trace-provider-'+extensionServer.nextObjectId();extensionServer.sendRequest({command:commands.AddTraceProvider,id:id,categoryName:categoryName,categoryTooltip:categoryTooltip});return new TraceProvider(id);}};function TraceSessionImpl(id){this._id=id;}
TraceSessionImpl.prototype={complete:function(url,timeOffset){const request={command:commands.CompleteTraceSession,id:this._id,url:url||'',timeOffset:timeOffset||0};extensionServer.sendRequest(request);}};function TraceProvider(id){function dispatchRecordingStarted(message){const sessionId=message.arguments[0];this._fire(new TraceSession(sessionId));}
this.onRecordingStarted=new EventSink(events.RecordingStarted+id,dispatchRecordingStarted);this.onRecordingStopped=new EventSink(events.RecordingStopped+id);}
function InspectedWindow(){function dispatchResourceEvent(message){this._fire(new Resource(message.arguments[0]));}
function dispatchResourceContentEvent(message){this._fire(new Resource(message.arguments[0]),message.arguments[1]);}
this.onResourceAdded=new EventSink(events.ResourceAdded,dispatchResourceEvent);this.onResourceContentCommitted=new EventSink(events.ResourceContentCommitted,dispatchResourceContentEvent);}
InspectedWindow.prototype={reload:function(optionsOrUserAgent){let options=null;if(typeof optionsOrUserAgent==='object'){options=optionsOrUserAgent;}else if(typeof optionsOrUserAgent==='string'){options={userAgent:optionsOrUserAgent};console.warn('Passing userAgent as string parameter to inspectedWindow.reload() is deprecated. '+'Use inspectedWindow.reload({ userAgent: value}) instead.');}
extensionServer.sendRequest({command:commands.Reload,options:options});},eval:function(expression,evaluateOptions){const callback=extractCallbackArgument(arguments);function callbackWrapper(result){if(result.isError||result.isException){callback(undefined,result);}else{callback(result.value);}}
const request={command:commands.EvaluateOnInspectedPage,expression:expression};if(typeof evaluateOptions==='object'){request.evaluateOptions=evaluateOptions;}
extensionServer.sendRequest(request,callback&&callbackWrapper);return null;},getResources:function(callback){function wrapResource(resourceData){return new Resource(resourceData);}
function callbackWrapper(resources){callback(resources.map(wrapResource));}
extensionServer.sendRequest({command:commands.GetPageResources},callback&&callbackWrapper);}};function ResourceImpl(resourceData){this._url=resourceData.url;this._type=resourceData.type;}
ResourceImpl.prototype={get url(){return this._url;},get type(){return this._type;},getContent:function(callback){function callbackWrapper(response){callback(response.content,response.encoding);}
extensionServer.sendRequest({command:commands.GetResourceContent,url:this._url},callback&&callbackWrapper);},setContent:function(content,commit,callback){extensionServer.sendRequest({command:commands.SetResourceContent,url:this._url,content:content,commit:commit},callback);}};function getTabId(){return inspectedTabId;}
let keyboardEventRequestQueue=[];let forwardTimer=null;function forwardKeyboardEvent(event){const focused=document.activeElement;if(focused){const isInput=focused.nodeName==='INPUT'||focused.nodeName==='TEXTAREA';if(isInput&&!(event.ctrlKey||event.altKey||event.metaKey)){return;}}
let modifiers=0;if(event.shiftKey){modifiers|=1;}
if(event.ctrlKey){modifiers|=2;}
if(event.altKey){modifiers|=4;}
if(event.metaKey){modifiers|=8;}
const num=(event.keyCode&255)|(modifiers<<8);if(!keysToForwardSet.has(num)){return;}
event.preventDefault();const requestPayload={eventType:event.type,ctrlKey:event.ctrlKey,altKey:event.altKey,metaKey:event.metaKey,shiftKey:event.shiftKey,keyIdentifier:event.keyIdentifier,key:event.key,code:event.code,location:event.location,keyCode:event.keyCode};keyboardEventRequestQueue.push(requestPayload);if(!forwardTimer){forwardTimer=setTimeout(forwardEventQueue,0);}}
function forwardEventQueue(){forwardTimer=null;const request={command:commands.ForwardKeyboardEvent,entries:keyboardEventRequestQueue};extensionServer.sendRequest(request);keyboardEventRequestQueue=[];}
document.addEventListener('keydown',forwardKeyboardEvent,false);function ExtensionServerClient(){this._callbacks={};this._handlers={};this._lastRequestId=0;this._lastObjectId=0;this.registerHandler('callback',this._onCallback.bind(this));const channel=new MessageChannel();this._port=channel.port1;this._port.addEventListener('message',this._onMessage.bind(this),false);this._port.start();window.parent.postMessage('registerExtension','*',[channel.port2]);}
ExtensionServerClient.prototype={sendRequest:function(message,callback){if(typeof callback==='function'){message.requestId=this._registerCallback(callback);}
this._port.postMessage(message);},hasHandler:function(command){return!!this._handlers[command];},registerHandler:function(command,handler){this._handlers[command]=handler;},unregisterHandler:function(command){delete this._handlers[command];},nextObjectId:function(){return injectedScriptId.toString()+'_'+ ++this._lastObjectId;},_registerCallback:function(callback){const id=++this._lastRequestId;this._callbacks[id]=callback;return id;},_onCallback:function(request){if(request.requestId in this._callbacks){const callback=this._callbacks[request.requestId];delete this._callbacks[request.requestId];callback(request.result);}},_onMessage:function(event){const request=event.data;const handler=this._handlers[request.command];if(handler){handler.call(this,request);}}};function populateInterfaceClass(interfaze,implementation){for(const member in implementation){if(member.charAt(0)==='_'){continue;}
let descriptor=null;for(let owner=implementation;owner&&!descriptor;owner=owner.__proto__){descriptor=Object.getOwnPropertyDescriptor(owner,member);}
if(!descriptor){continue;}
if(typeof descriptor.value==='function'){interfaze[member]=descriptor.value.bind(implementation);}else if(typeof descriptor.get==='function'){interfaze.__defineGetter__(member,descriptor.get.bind(implementation));}else{Object.defineProperty(interfaze,member,descriptor);}}}
const extensionServer=new ExtensionServerClient();const coreAPI=new InspectorExtensionAPI();Object.defineProperty(chrome,'devtools',{value:{},enumerable:true});chrome.devtools.inspectedWindow={};Object.defineProperty(chrome.devtools.inspectedWindow,'tabId',{get:getTabId});chrome.devtools.inspectedWindow.__proto__=coreAPI.inspectedWindow;chrome.devtools.network=coreAPI.network;chrome.devtools.panels=coreAPI.panels;chrome.devtools.panels.themeName=themeName;if(extensionInfo.exposeExperimentalAPIs!==false){chrome.experimental=chrome.experimental||{};chrome.experimental.devtools=chrome.experimental.devtools||{};const properties=Object.getOwnPropertyNames(coreAPI);for(let i=0;i<properties.length;++i){const descriptor=Object.getOwnPropertyDescriptor(coreAPI,properties[i]);if(descriptor){Object.defineProperty(chrome.experimental.devtools,properties[i],descriptor);}}
chrome.experimental.devtools.inspectedWindow=chrome.devtools.inspectedWindow;}
if(extensionInfo.exposeWebInspectorNamespace){window.webInspector=coreAPI;}
testHook(extensionServer,coreAPI);};self.buildExtensionAPIInjectedScript=function(extensionInfo,inspectedTabId,themeName,keysToForward,testHook){const argumentsJSON=[extensionInfo,inspectedTabId||null,themeName,keysToForward].map(_=>JSON.stringify(_)).join(',');if(!testHook){testHook=()=>{};}
return'(function(injectedScriptId){ '+defineCommonExtensionSymbols.toString()+';'+'('+self.injectedExtensionAPI.toString()+')('+argumentsJSON+','+testHook+', injectedScriptId);'+'})';};var ExtensionAPI=Object.freeze({__proto__:null,defineCommonExtensionSymbols:defineCommonExtensionSymbols});class ExtensionTraceProvider{constructor(extensionOrigin,id,categoryName,categoryTooltip){this._extensionOrigin=extensionOrigin;this._id=id;this._categoryName=categoryName;this._categoryTooltip=categoryTooltip;}
start(session){const sessionId=String(++_lastSessionId);self.Extensions.extensionServer.startTraceRecording(this._id,sessionId,session);}
stop(){self.Extensions.extensionServer.stopTraceRecording(this._id);}
shortDisplayName(){return this._categoryName;}
longDisplayName(){return this._categoryTooltip;}
persistentIdentifier(){return`${this._extensionOrigin}/${this._categoryName}`;}}
let _lastSessionId=0;class TracingSession{complete(url,timeOffsetMicroseconds){}}
var ExtensionTraceProvider$1=Object.freeze({__proto__:null,ExtensionTraceProvider:ExtensionTraceProvider,TracingSession:TracingSession});const extensionOriginSymbol=Symbol('extensionOrigin');class ExtensionServer extends ObjectWrapper.ObjectWrapper{constructor(){super();this._clientObjects={};this._handlers={};this._subscribers=new Map();this._subscriptionStartHandlers={};this._subscriptionStopHandlers={};this._extraHeaders=new Map();this._requests={};this._lastRequestId=0;this._registeredExtensions=new Map();this._status=new ExtensionStatus();this._sidebarPanes=[];this._traceProviders=[];this._traceSessions=new Map();this._extensionsEnabled=true;const commands=Extensions.extensionAPI.Commands;this._registerHandler(commands.AddRequestHeaders,this._onAddRequestHeaders.bind(this));this._registerHandler(commands.AddTraceProvider,this._onAddTraceProvider.bind(this));this._registerHandler(commands.ApplyStyleSheet,this._onApplyStyleSheet.bind(this));this._registerHandler(commands.CompleteTraceSession,this._onCompleteTraceSession.bind(this));this._registerHandler(commands.CreatePanel,this._onCreatePanel.bind(this));this._registerHandler(commands.CreateSidebarPane,this._onCreateSidebarPane.bind(this));this._registerHandler(commands.CreateToolbarButton,this._onCreateToolbarButton.bind(this));this._registerHandler(commands.EvaluateOnInspectedPage,this._onEvaluateOnInspectedPage.bind(this));this._registerHandler(commands.ForwardKeyboardEvent,this._onForwardKeyboardEvent.bind(this));this._registerHandler(commands.GetHAR,this._onGetHAR.bind(this));this._registerHandler(commands.GetPageResources,this._onGetPageResources.bind(this));this._registerHandler(commands.GetRequestContent,this._onGetRequestContent.bind(this));this._registerHandler(commands.GetResourceContent,this._onGetResourceContent.bind(this));this._registerHandler(commands.Reload,this._onReload.bind(this));this._registerHandler(commands.SetOpenResourceHandler,this._onSetOpenResourceHandler.bind(this));this._registerHandler(commands.SetResourceContent,this._onSetResourceContent.bind(this));this._registerHandler(commands.SetSidebarHeight,this._onSetSidebarHeight.bind(this));this._registerHandler(commands.SetSidebarContent,this._onSetSidebarContent.bind(this));this._registerHandler(commands.SetSidebarPage,this._onSetSidebarPage.bind(this));this._registerHandler(commands.ShowPanel,this._onShowPanel.bind(this));this._registerHandler(commands.Subscribe,this._onSubscribe.bind(this));this._registerHandler(commands.OpenResource,this._onOpenResource.bind(this));this._registerHandler(commands.Unsubscribe,this._onUnsubscribe.bind(this));this._registerHandler(commands.UpdateButton,this._onUpdateButton.bind(this));window.addEventListener('message',this._onWindowMessage.bind(this),false);const existingTabId=window.DevToolsAPI&&window.DevToolsAPI.getInspectedTabId&&window.DevToolsAPI.getInspectedTabId();if(existingTabId){this._setInspectedTabId({data:existingTabId});}
InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.SetInspectedTabId,this._setInspectedTabId,this);this._initExtensions();}
initializeExtensions(){InspectorFrontendHost.InspectorFrontendHostInstance.setAddExtensionCallback(this._addExtension.bind(this));}
hasExtensions(){return!!this._registeredExtensions.size;}
notifySearchAction(panelId,action,searchString){this._postNotification(Extensions.extensionAPI.Events.PanelSearch+panelId,action,searchString);}
notifyViewShown(identifier,frameIndex){this._postNotification(Extensions.extensionAPI.Events.ViewShown+identifier,frameIndex);}
notifyViewHidden(identifier){this._postNotification(Extensions.extensionAPI.Events.ViewHidden+identifier);}
notifyButtonClicked(identifier){this._postNotification(Extensions.extensionAPI.Events.ButtonClicked+identifier);}
_inspectedURLChanged(event){if(!this._canInspectURL(event.data.inspectedURL())){this._disableExtensions();return;}
if(event.data!==SDKModel.TargetManager.instance().mainTarget()){return;}
this._requests={};const url=event.data.inspectedURL();this._postNotification(Extensions.extensionAPI.Events.InspectedURLChanged,url);}
startTraceRecording(providerId,sessionId,session){this._traceSessions.set(sessionId,session);this._postNotification('trace-recording-started-'+providerId,sessionId);}
stopTraceRecording(providerId){this._postNotification('trace-recording-stopped-'+providerId);}
hasSubscribers(type){return this._subscribers.has(type);}
_postNotification(type,vararg){if(!this._extensionsEnabled){return;}
const subscribers=this._subscribers.get(type);if(!subscribers){return;}
const message={command:'notify-'+type,arguments:Array.prototype.slice.call(arguments,1)};for(const subscriber of subscribers){subscriber.postMessage(message);}}
_onSubscribe(message,port){const subscribers=this._subscribers.get(message.type);if(subscribers){subscribers.add(port);}else{this._subscribers.set(message.type,new Set([port]));if(this._subscriptionStartHandlers[message.type]){this._subscriptionStartHandlers[message.type]();}}}
_onUnsubscribe(message,port){const subscribers=this._subscribers.get(message.type);if(!subscribers){return;}
subscribers.delete(port);if(!subscribers.size){this._subscribers.delete(message.type);if(this._subscriptionStopHandlers[message.type]){this._subscriptionStopHandlers[message.type]();}}}
_onAddRequestHeaders(message){const id=message.extensionId;if(typeof id!=='string'){return this._status.E_BADARGTYPE('extensionId',typeof id,'string');}
let extensionHeaders=this._extraHeaders.get(id);if(!extensionHeaders){extensionHeaders=new Map();this._extraHeaders.set(id,extensionHeaders);}
for(const name in message.headers){extensionHeaders.set(name,message.headers[name]);}
const allHeaders=({});for(const headers of this._extraHeaders.values()){for(const name of headers.keys()){if(name!=='__proto__'&&typeof headers.get(name)==='string'){allHeaders[name]=headers.get(name);}}}
self.SDK.multitargetNetworkManager.setExtraHTTPHeaders(allHeaders);}
_onApplyStyleSheet(message){if(!Runtime.experiments.isEnabled('applyCustomStylesheet')){return;}
const styleSheet=createElement('style');styleSheet.textContent=message.styleSheet;document.head.appendChild(styleSheet);self.UI.themeSupport.addCustomStylesheet(message.styleSheet);for(let node=document.body;node;node=node.traverseNextNode(document.body)){if(node instanceof ShadowRoot){self.UI.themeSupport.injectCustomStyleSheets(node);}}}
_onCreatePanel(message,port){const id=message.id;if(id in this._clientObjects||self.UI.inspectorView.hasPanel(id)){return this._status.E_EXISTS(id);}
const page=this._expandResourcePath(port[extensionOriginSymbol],message.page);let persistentId=port[extensionOriginSymbol]+message.title;persistentId=persistentId.replace(/\s/g,'');const panelView=new ExtensionServerPanelView(persistentId,message.title,new ExtensionPanel(this,persistentId,id,page));this._clientObjects[id]=panelView;self.UI.inspectorView.addPanel(panelView);return this._status.OK();}
_onShowPanel(message){let panelViewId=message.id;const panelView=this._clientObjects[message.id];if(panelView&&panelView instanceof ExtensionServerPanelView){panelViewId=panelView.viewId();}
self.UI.inspectorView.showPanel(panelViewId);}
_onCreateToolbarButton(message,port){const panelView=this._clientObjects[message.panel];if(!panelView||!(panelView instanceof ExtensionServerPanelView)){return this._status.E_NOTFOUND(message.panel);}
const button=new ExtensionButton(this,message.id,this._expandResourcePath(port[extensionOriginSymbol],message.icon),message.tooltip,message.disabled);this._clientObjects[message.id]=button;panelView.widget().then(appendButton);function appendButton(panel){(panel).addToolbarItem(button.toolbarButton());}
return this._status.OK();}
_onUpdateButton(message,port){const button=this._clientObjects[message.id];if(!button||!(button instanceof ExtensionButton)){return this._status.E_NOTFOUND(message.id);}
button.update(this._expandResourcePath(port[extensionOriginSymbol],message.icon),message.tooltip,message.disabled);return this._status.OK();}
_onCompleteTraceSession(message){const session=this._traceSessions.get(message.id);if(!session){return this._status.E_NOTFOUND(message.id);}
this._traceSessions.delete(message.id);session.complete(message.url,message.timeOffset);}
_onCreateSidebarPane(message){if(message.panel!=='elements'&&message.panel!=='sources'){return this._status.E_NOTFOUND(message.panel);}
const id=message.id;const sidebar=new ExtensionSidebarPane(this,message.panel,message.title,id);this._sidebarPanes.push(sidebar);this._clientObjects[id]=sidebar;this.dispatchEventToListeners(Events.SidebarPaneAdded,sidebar);return this._status.OK();}
sidebarPanes(){return this._sidebarPanes;}
_onSetSidebarHeight(message){const sidebar=this._clientObjects[message.id];if(!sidebar){return this._status.E_NOTFOUND(message.id);}
sidebar.setHeight(message.height);return this._status.OK();}
_onSetSidebarContent(message,port){const sidebar=this._clientObjects[message.id];if(!sidebar){return this._status.E_NOTFOUND(message.id);}
function callback(error){const result=error?this._status.E_FAILED(error):this._status.OK();this._dispatchCallback(message.requestId,port,result);}
if(message.evaluateOnPage){return sidebar.setExpression(message.expression,message.rootTitle,message.evaluateOptions,port[extensionOriginSymbol],callback.bind(this));}
sidebar.setObject(message.expression,message.rootTitle,callback.bind(this));}
_onSetSidebarPage(message,port){const sidebar=this._clientObjects[message.id];if(!sidebar){return this._status.E_NOTFOUND(message.id);}
sidebar.setPage(this._expandResourcePath(port[extensionOriginSymbol],message.page));}
_onOpenResource(message){const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(message.url);if(uiSourceCode){Revealer.reveal(uiSourceCode.uiLocation(message.lineNumber,0));return this._status.OK();}
const resource=ResourceUtils.resourceForURL(message.url);if(resource){Revealer.reveal(resource);return this._status.OK();}
const request=self.SDK.networkLog.requestForURL(message.url);if(request){Revealer.reveal(request);return this._status.OK();}
return this._status.E_NOTFOUND(message.url);}
_onSetOpenResourceHandler(message,port){const name=this._registeredExtensions.get(port[extensionOriginSymbol]).name;if(message.handlerPresent){Linkifier.Linkifier.registerLinkHandler(name,this._handleOpenURL.bind(this,port));}else{Linkifier.Linkifier.unregisterLinkHandler(name);}}
_handleOpenURL(port,contentProvider,lineNumber){port.postMessage({command:'open-resource',resource:this._makeResource(contentProvider),lineNumber:lineNumber+1});}
_onReload(message){const options=(message.options||{});self.SDK.multitargetNetworkManager.setUserAgentOverride(typeof options.userAgent==='string'?options.userAgent:'');let injectedScript;if(options.injectedScript){injectedScript='(function(){'+options.injectedScript+'})()';}
ResourceTreeModel.ResourceTreeModel.reloadAllPages(!!options.ignoreCache,injectedScript);return this._status.OK();}
_onEvaluateOnInspectedPage(message,port){function callback(error,object,wasThrown){let result;if(error||!object){result=this._status.E_PROTOCOLERROR(error.toString());}else if(wasThrown){result={isException:true,value:object.description};}else{result={value:object.value};}
this._dispatchCallback(message.requestId,port,result);}
return this.evaluate(message.expression,true,true,message.evaluateOptions,port[extensionOriginSymbol],callback.bind(this));}
async _onGetHAR(){const requests=self.SDK.networkLog.requests();const harLog=await HARLog.HARLog.build(requests);for(let i=0;i<harLog.entries.length;++i){harLog.entries[i]._requestId=this._requestId(requests[i]);}
return harLog;}
_makeResource(contentProvider){return{url:contentProvider.contentURL(),type:contentProvider.contentType().name()};}
_onGetPageResources(){const resources=new Map();function pushResourceData(contentProvider){if(!resources.has(contentProvider.contentURL())){resources.set(contentProvider.contentURL(),this._makeResource(contentProvider));}}
let uiSourceCodes=Workspace.WorkspaceImpl.instance().uiSourceCodesForProjectType(Workspace.projectTypes.Network);uiSourceCodes=uiSourceCodes.concat(Workspace.WorkspaceImpl.instance().uiSourceCodesForProjectType(Workspace.projectTypes.ContentScripts));uiSourceCodes.forEach(pushResourceData.bind(this));for(const resourceTreeModel of SDKModel.TargetManager.instance().models(ResourceTreeModel.ResourceTreeModel)){resourceTreeModel.forAllResources(pushResourceData.bind(this));}
return[...resources.values()];}
async _getResourceContent(contentProvider,message,port){const{content}=await contentProvider.requestContent();const encoded=await contentProvider.contentEncoded();this._dispatchCallback(message.requestId,port,{encoding:encoded?'base64':'',content:content});}
_onGetRequestContent(message,port){const request=this._requestById(message.id);if(!request){return this._status.E_NOTFOUND(message.id);}
this._getResourceContent(request,message,port);}
_onGetResourceContent(message,port){const url=(message.url);const contentProvider=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url)||ResourceUtils.resourceForURL(url);if(!contentProvider){return this._status.E_NOTFOUND(url);}
this._getResourceContent(contentProvider,message,port);}
_onSetResourceContent(message,port){function callbackWrapper(error){const response=error?this._status.E_FAILED(error):this._status.OK();this._dispatchCallback(message.requestId,port,response);}
const url=(message.url);const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);if(!uiSourceCode||!uiSourceCode.contentType().isDocumentOrScriptOrStyleSheet()){const resource=ResourceTreeModel.ResourceTreeModel.resourceForURL(url);if(!resource){return this._status.E_NOTFOUND(url);}
return this._status.E_NOTSUPPORTED('Resource is not editable');}
uiSourceCode.setWorkingCopy(message.content);if(message.commit){uiSourceCode.commitWorkingCopy();}
callbackWrapper.call(this,null);}
_requestId(request){if(!request._extensionRequestId){request._extensionRequestId=++this._lastRequestId;this._requests[request._extensionRequestId]=request;}
return request._extensionRequestId;}
_requestById(id){return this._requests[id];}
_onAddTraceProvider(message,port){const provider=new ExtensionTraceProvider(port[extensionOriginSymbol],message.id,message.categoryName,message.categoryTooltip);this._clientObjects[message.id]=provider;this._traceProviders.push(provider);this.dispatchEventToListeners(Events.TraceProviderAdded,provider);}
traceProviders(){return this._traceProviders;}
_onForwardKeyboardEvent(message){message.entries.forEach(handleEventEntry);function handleEventEntry(entry){const event=new window.KeyboardEvent(entry.eventType,{key:entry.key,code:entry.code,keyCode:entry.keyCode,location:entry.location,ctrlKey:entry.ctrlKey,altKey:entry.altKey,shiftKey:entry.shiftKey,metaKey:entry.metaKey});event.__keyCode=keyCodeForEntry(entry);document.dispatchEvent(event);}
function keyCodeForEntry(entry){let keyCode=entry.keyCode;if(!keyCode){if(entry.key==='Escape'){keyCode=27;}}
return keyCode||0;}}
_dispatchCallback(requestId,port,result){if(requestId){port.postMessage({command:'callback',requestId:requestId,result:result});}}
_initExtensions(){this._registerAutosubscriptionHandler(Extensions.extensionAPI.Events.ResourceAdded,Workspace.WorkspaceImpl.instance(),Workspace.Events.UISourceCodeAdded,this._notifyResourceAdded);this._registerAutosubscriptionTargetManagerHandler(Extensions.extensionAPI.Events.NetworkRequestFinished,NetworkManager.NetworkManager,NetworkManager.Events.RequestFinished,this._notifyRequestFinished);function onElementsSubscriptionStarted(){self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this._notifyElementsSelectionChanged,this);}
function onElementsSubscriptionStopped(){self.UI.context.removeFlavorChangeListener(DOMModel.DOMNode,this._notifyElementsSelectionChanged,this);}
this._registerSubscriptionHandler(Extensions.extensionAPI.Events.PanelObjectSelected+'elements',onElementsSubscriptionStarted.bind(this),onElementsSubscriptionStopped.bind(this));this._registerResourceContentCommittedHandler(this._notifyUISourceCodeContentCommitted);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.InspectedURLChanged,this._inspectedURLChanged,this);}
_notifyResourceAdded(event){const uiSourceCode=(event.data);this._postNotification(Extensions.extensionAPI.Events.ResourceAdded,this._makeResource(uiSourceCode));}
_notifyUISourceCodeContentCommitted(event){const uiSourceCode=(event.data.uiSourceCode);const content=(event.data.content);this._postNotification(Extensions.extensionAPI.Events.ResourceContentCommitted,this._makeResource(uiSourceCode),content);}
async _notifyRequestFinished(event){const request=(event.data);const entry=await HARLog.Entry.build(request);this._postNotification(Extensions.extensionAPI.Events.NetworkRequestFinished,this._requestId(request),entry);}
_notifyElementsSelectionChanged(){this._postNotification(Extensions.extensionAPI.Events.PanelObjectSelected+'elements');}
sourceSelectionChanged(url,range){this._postNotification(Extensions.extensionAPI.Events.PanelObjectSelected+'sources',{startLine:range.startLine,startColumn:range.startColumn,endLine:range.endLine,endColumn:range.endColumn,url:url,});}
_setInspectedTabId(event){this._inspectedTabId=(event.data);}
_addExtension(extensionInfo){const startPage=extensionInfo.startPage;const inspectedURL=SDKModel.TargetManager.instance().mainTarget().inspectedURL();if(!this._canInspectURL(inspectedURL)){this._disableExtensions();}
if(!this._extensionsEnabled){return;}
try{const startPageURL=new URL((startPage));const extensionOrigin=startPageURL.origin;if(!this._registeredExtensions.get(extensionOrigin)){const injectedAPI=self.buildExtensionAPIInjectedScript((extensionInfo),this._inspectedTabId,self.UI.themeSupport.themeName(),self.UI.shortcutRegistry.globalShortcutKeys(),self.Extensions.extensionServer['_extensionAPITestHook']);InspectorFrontendHost.InspectorFrontendHostInstance.setInjectedScriptForOrigin(extensionOrigin,injectedAPI);const name=extensionInfo.name||`Extension ${extensionOrigin}`;this._registeredExtensions.set(extensionOrigin,{name});}
const iframe=createElement('iframe');iframe.src=startPage;iframe.style.display='none';document.body.appendChild(iframe);}catch(e){console.error('Failed to initialize extension '+startPage+':'+e);return false;}
return true;}
_registerExtension(origin,port){if(!this._registeredExtensions.has(origin)){if(origin!==window.location.origin){console.error('Ignoring unauthorized client request from '+origin);}
return;}
port[extensionOriginSymbol]=origin;port.addEventListener('message',this._onmessage.bind(this),false);port.start();}
_onWindowMessage(event){if(event.data==='registerExtension'){this._registerExtension(event.origin,event.ports[0]);}}
async _onmessage(event){const message=event.data;let result;if(!(message.command in this._handlers)){result=this._status.E_NOTSUPPORTED(message.command);}else if(!this._extensionsEnabled){result=this._status.E_FAILED('Permission denied');}else{result=await this._handlers[message.command](message,event.target);}
if(result&&message.requestId){this._dispatchCallback(message.requestId,event.target,result);}}
_registerHandler(command,callback){console.assert(command);this._handlers[command]=callback;}
_registerSubscriptionHandler(eventTopic,onSubscribeFirst,onUnsubscribeLast){this._subscriptionStartHandlers[eventTopic]=onSubscribeFirst;this._subscriptionStopHandlers[eventTopic]=onUnsubscribeLast;}
_registerAutosubscriptionHandler(eventTopic,eventTarget,frontendEventType,handler){this._registerSubscriptionHandler(eventTopic,eventTarget.addEventListener.bind(eventTarget,frontendEventType,handler,this),eventTarget.removeEventListener.bind(eventTarget,frontendEventType,handler,this));}
_registerAutosubscriptionTargetManagerHandler(eventTopic,modelClass,frontendEventType,handler){this._registerSubscriptionHandler(eventTopic,SDKModel.TargetManager.instance().addModelListener.bind(SDKModel.TargetManager.instance(),modelClass,frontendEventType,handler,this),SDKModel.TargetManager.instance().removeModelListener.bind(SDKModel.TargetManager.instance(),modelClass,frontendEventType,handler,this));}
_registerResourceContentCommittedHandler(handler){function addFirstEventListener(){Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.WorkingCopyCommittedByUser,handler,this);Workspace.WorkspaceImpl.instance().setHasResourceContentTrackingExtensions(true);}
function removeLastEventListener(){Workspace.WorkspaceImpl.instance().setHasResourceContentTrackingExtensions(false);Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Events.WorkingCopyCommittedByUser,handler,this);}
this._registerSubscriptionHandler(Extensions.extensionAPI.Events.ResourceContentCommitted,addFirstEventListener.bind(this),removeLastEventListener.bind(this));}
_expandResourcePath(extensionPath,resourcePath){if(!resourcePath){return;}
return extensionPath+this._normalizePath(resourcePath);}
_normalizePath(path){const source=path.split('/');const result=[];for(let i=0;i<source.length;++i){if(source[i]==='.'){continue;}
if(source[i]===''){continue;}
if(source[i]==='..'){result.pop();}else{result.push(source[i]);}}
return'/'+result.join('/');}
evaluate(expression,exposeCommandLineAPI,returnByValue,options,securityOrigin,callback){let context;function resolveURLToFrame(url){let found;function hasMatchingURL(frame){found=(frame.url===url)?frame:null;return found;}
ResourceTreeModel.ResourceTreeModel.frames().some(hasMatchingURL);return found;}
options=options||{};let frame;if(options.frameURL){frame=resolveURLToFrame(options.frameURL);}else{const target=SDKModel.TargetManager.instance().mainTarget();const resourceTreeModel=target&&target.model(ResourceTreeModel.ResourceTreeModel);frame=resourceTreeModel&&resourceTreeModel.mainFrame;}
if(!frame){if(options.frameURL){console.warn('evaluate: there is no frame with URL '+options.frameURL);}else{console.warn('evaluate: the main frame is not yet available');}
return this._status.E_NOTFOUND(options.frameURL||'<top>');}
if(!this._canInspectURL(frame.url)){return this._status.E_FAILED('Permission denied');}
let contextSecurityOrigin;if(options.useContentScriptContext){contextSecurityOrigin=securityOrigin;}else if(options.scriptExecutionContext){contextSecurityOrigin=options.scriptExecutionContext;}
const runtimeModel=frame.resourceTreeModel().target().model(RuntimeModel.RuntimeModel);const executionContexts=runtimeModel?runtimeModel.executionContexts():[];if(contextSecurityOrigin){for(let i=0;i<executionContexts.length;++i){const executionContext=executionContexts[i];if(executionContext.frameId===frame.id&&executionContext.origin===contextSecurityOrigin&&!executionContext.isDefault){context=executionContext;}}
if(!context){console.warn('The JavaScript context '+contextSecurityOrigin+' was not found in the frame '+frame.url);return this._status.E_NOTFOUND(contextSecurityOrigin);}}else{for(let i=0;i<executionContexts.length;++i){const executionContext=executionContexts[i];if(executionContext.frameId===frame.id&&executionContext.isDefault){context=executionContext;}}
if(!context){return this._status.E_FAILED(frame.url+' has no execution context');}}
if(!this._canInspectURL(context.origin)){return this._status.E_FAILED('Permission denied');}
context.evaluate({expression:expression,objectGroup:'extension',includeCommandLineAPI:exposeCommandLineAPI,silent:true,returnByValue:returnByValue,generatePreview:false},false,false).then(onEvaluate);function onEvaluate(result){if(result.error){callback(result.error,null,false);return;}
callback(null,result.object||null,!!result.exceptionDetails);}}
_canInspectURL(url){let parsedURL;try{parsedURL=new URL(url);}catch(exception){return false;}
if(parsedURL.protocol==='chrome:'||parsedURL.protocol==='devtools:'){return false;}
if(parsedURL.protocol.startsWith('http')&&parsedURL.hostname==='chrome.google.com'&&parsedURL.pathname.startsWith('/webstore')){return false;}
return true;}
_disableExtensions(){this._extensionsEnabled=false;}}
const Events={SidebarPaneAdded:Symbol('SidebarPaneAdded'),TraceProviderAdded:Symbol('TraceProviderAdded')};class ExtensionServerPanelView extends View.SimpleView{constructor(name,title,panel){super(title);this._name=name;this._panel=panel;}
viewId(){return this._name;}
widget(){return(Promise.resolve(this._panel));}}
class ExtensionStatus{constructor(){function makeStatus(code,description){const details=Array.prototype.slice.call(arguments,2);const status={code:code,description:description,details:details};if(code!=='OK'){status.isError=true;console.error('Extension server error: '+StringUtilities.vsprintf(description,details));}
return status;}
this.OK=makeStatus.bind(null,'OK','OK');this.E_EXISTS=makeStatus.bind(null,'E_EXISTS','Object already exists: %s');this.E_BADARG=makeStatus.bind(null,'E_BADARG','Invalid argument %s: %s');this.E_BADARGTYPE=makeStatus.bind(null,'E_BADARGTYPE','Invalid type for argument %s: got %s, expected %s');this.E_NOTFOUND=makeStatus.bind(null,'E_NOTFOUND','Object not found: %s');this.E_NOTSUPPORTED=makeStatus.bind(null,'E_NOTSUPPORTED','Object does not support requested operation: %s');this.E_PROTOCOLERROR=makeStatus.bind(null,'E_PROTOCOLERROR','Inspector protocol error: %s');this.E_FAILED=makeStatus.bind(null,'E_FAILED','Operation failed: %s');}}
let Record;var ExtensionServer$1=Object.freeze({__proto__:null,ExtensionServer:ExtensionServer,Events:Events,ExtensionStatus:ExtensionStatus,Record:Record});class ExtensionView extends Widget.Widget{constructor(server,id,src,className){super();this.setHideOnDetach();this.element.className='vbox flex-auto';this.element.tabIndex=-1;this._server=server;this._id=id;this._iframe=createElement('iframe');this._iframe.addEventListener('load',this._onLoad.bind(this),false);this._iframe.src=src;this._iframe.className=className;this.setDefaultFocusedElement(this.element);this.element.appendChild(this._iframe);}
wasShown(){if(typeof this._frameIndex==='number'){this._server.notifyViewShown(this._id,this._frameIndex);}}
willHide(){if(typeof this._frameIndex==='number'){this._server.notifyViewHidden(this._id);}}
_onLoad(){const frames=window.frames;this._frameIndex=Array.prototype.indexOf.call(frames,this._iframe.contentWindow);if(this.isShowing()){this._server.notifyViewShown(this._id,this._frameIndex);}}}
class ExtensionNotifierView extends Widget.VBox{constructor(server,id){super();this._server=server;this._id=id;}
wasShown(){this._server.notifyViewShown(this._id);}
willHide(){this._server.notifyViewHidden(this._id);}}
var ExtensionView$1=Object.freeze({__proto__:null,ExtensionView:ExtensionView,ExtensionNotifierView:ExtensionNotifierView});class ExtensionPanel extends Panel.Panel{constructor(server,panelName,id,pageURL){super(panelName);this._server=server;this._id=id;this.setHideOnDetach();this._panelToolbar=new Toolbar.Toolbar('hidden',this.element);this._searchableView=new SearchableView.SearchableView(this);this._searchableView.show(this.element);const extensionView=new ExtensionView(server,this._id,pageURL,'extension');extensionView.show(this._searchableView.element);}
addToolbarItem(item){this._panelToolbar.element.classList.remove('hidden');this._panelToolbar.appendToolbarItem(item);}
searchCanceled(){this._server.notifySearchAction(this._id,Extensions.extensionAPI.panels.SearchAction.CancelSearch);this._searchableView.updateSearchMatchesCount(0);}
searchableView(){return this._searchableView;}
performSearch(searchConfig,shouldJump,jumpBackwards){const query=searchConfig.query;this._server.notifySearchAction(this._id,Extensions.extensionAPI.panels.SearchAction.PerformSearch,query);}
jumpToNextSearchResult(){this._server.notifySearchAction(this._id,Extensions.extensionAPI.panels.SearchAction.NextSearchResult);}
jumpToPreviousSearchResult(){this._server.notifySearchAction(this._id,Extensions.extensionAPI.panels.SearchAction.PreviousSearchResult);}
supportsCaseSensitiveSearch(){return false;}
supportsRegexSearch(){return false;}}
class ExtensionButton{constructor(server,id,iconURL,tooltip,disabled){this._id=id;this._toolbarButton=new Toolbar.ToolbarButton('','');this._toolbarButton.addEventListener(Toolbar.ToolbarButton.Events.Click,server.notifyButtonClicked.bind(server,this._id));this.update(iconURL,tooltip,disabled);}
update(iconURL,tooltip,disabled){if(typeof iconURL==='string'){this._toolbarButton.setBackgroundImage(iconURL);}
if(typeof tooltip==='string'){this._toolbarButton.setTitle(tooltip);}
if(typeof disabled==='boolean'){this._toolbarButton.setEnabled(!disabled);}}
toolbarButton(){return this._toolbarButton;}}
class ExtensionSidebarPane extends View.SimpleView{constructor(server,panelName,title,id){super(title);this.element.classList.add('fill');this._panelName=panelName;this._server=server;this._id=id;}
id(){return this._id;}
panelName(){return this._panelName;}
setObject(object,title,callback){this._createObjectPropertiesView();this._setObject(RemoteObject.RemoteObject.fromLocalObject(object),title,callback);}
setExpression(expression,title,evaluateOptions,securityOrigin,callback){this._createObjectPropertiesView();this._server.evaluate(expression,true,false,evaluateOptions,securityOrigin,this._onEvaluate.bind(this,title,callback));}
setPage(url){if(this._objectPropertiesView){this._objectPropertiesView.detach();delete this._objectPropertiesView;}
if(this._extensionView){this._extensionView.detach(true);}
this._extensionView=new ExtensionView(this._server,this._id,url,'extension fill');this._extensionView.show(this.element);if(!this.element.style.height){this.setHeight('150px');}}
setHeight(height){this.element.style.height=height;}
_onEvaluate(title,callback,error,result,wasThrown){if(error||!result){callback(error.toString());}else{this._setObject(result,title,callback);}}
_createObjectPropertiesView(){if(this._objectPropertiesView){return;}
if(this._extensionView){this._extensionView.detach(true);delete this._extensionView;}
this._objectPropertiesView=new ExtensionNotifierView(this._server,this._id);this._objectPropertiesView.show(this.element);}
_setObject(object,title,callback){if(!this._objectPropertiesView){callback('operation cancelled');return;}
this._objectPropertiesView.element.removeChildren();UIUtils.Renderer.render(object,{title,editable:false}).then(result=>{if(!result){callback();return;}
if(result.tree&&result.tree.firstChild()){result.tree.firstChild().expand();}
this._objectPropertiesView.element.appendChild(result.node);callback();});}}
var ExtensionPanel$1=Object.freeze({__proto__:null,ExtensionPanel:ExtensionPanel,ExtensionButton:ExtensionButton,ExtensionSidebarPane:ExtensionSidebarPane});export{ExtensionAPI,ExtensionPanel$1 as ExtensionPanel,ExtensionServer$1 as ExtensionServer,ExtensionTraceProvider$1 as ExtensionTraceProvider,ExtensionView$1 as ExtensionView};