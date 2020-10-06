import{ObjectWrapper,ParsedURL,Color,Settings,ResourceType,UIString,ls as ls$1,Console,EventTarget,Revealer,Worker,Throttler}from'../common/common.js';import{InspectorFrontendHost,ResourceLoader,userMetrics,Platform as Platform$1,InspectorFrontendHostAPI}from'../host/host.js';import{Multimap,StringUtilities,ArrayUtilities,NumberUtilities}from'../platform/platform.js';import{InspectorBackend}from'../protocol_client/protocol_client.js';import{TextUtils as TextUtils$1,ContentProvider,StaticContentProvider,TextRange}from'../text_utils/text_utils.js';const _registeredModels=new Map();class SDKModel extends ObjectWrapper.ObjectWrapper{constructor(target){super();this._target=target;}
target(){return this._target;}
preSuspendModel(reason){return Promise.resolve();}
suspendModel(reason){return Promise.resolve();}
resumeModel(){return Promise.resolve();}
postResumeModel(){return Promise.resolve();}
dispose(){}
static register(modelClass,capabilities,autostart){_registeredModels.set(modelClass,{capabilities,autostart});}
static get registeredModels(){return _registeredModels;}}
class Target extends InspectorBackend.TargetBase{constructor(targetManager,id,name,type,parentTarget,sessionId,suspended,connection){const needsNodeJSPatching=type===Type.Node;super(needsNodeJSPatching,parentTarget,sessionId,connection);this._targetManager=targetManager;this._name=name;this._inspectedURL='';this._inspectedURLName='';this._capabilitiesMask=0;switch(type){case Type.Frame:this._capabilitiesMask=Capability.Browser|Capability.Storage|Capability.DOM|Capability.JS|Capability.Log|Capability.Network|Capability.Target|Capability.Tracing|Capability.Emulation|Capability.Input|Capability.Inspector|Capability.Audits;if(!parentTarget){this._capabilitiesMask|=Capability.DeviceEmulation|Capability.ScreenCapture|Capability.Security|Capability.ServiceWorker;}
break;case Type.ServiceWorker:this._capabilitiesMask=Capability.JS|Capability.Log|Capability.Network|Capability.Target|Capability.Inspector;if(!parentTarget){this._capabilitiesMask|=Capability.Browser;}
break;case Type.Worker:this._capabilitiesMask=Capability.JS|Capability.Log|Capability.Network|Capability.Target;break;case Type.Node:this._capabilitiesMask=Capability.JS;break;case Type.Browser:this._capabilitiesMask=Capability.Target;break;}
this._type=type;this._parentTarget=parentTarget;this._id=id;this._modelByConstructor=new Map();this._isSuspended=suspended;}
createModels(required){this._creatingModels=true;this.model(SDK.ResourceTreeModel);const registered=Array.from(SDKModel.registeredModels.keys());for(const modelClass of registered){const info=(SDKModel.registeredModels.get(modelClass));if(info.autostart||required.has(modelClass)){this.model(modelClass);}}
this._creatingModels=false;}
id(){return this._id;}
name(){return this._name||this._inspectedURLName;}
type(){return this._type;}
markAsNodeJSForTest(){super.markAsNodeJSForTest();this._type=Type.Node;}
targetManager(){return this._targetManager;}
hasAllCapabilities(capabilitiesMask){return(this._capabilitiesMask&capabilitiesMask)===capabilitiesMask;}
decorateLabel(label){return(this._type===Type.Worker||this._type===Type.ServiceWorker)?'\u2699 '+label:label;}
parentTarget(){return this._parentTarget;}
dispose(reason){super.dispose(reason);this._targetManager.removeTarget(this);for(const model of this._modelByConstructor.values()){model.dispose();}}
model(modelClass){if(!this._modelByConstructor.get(modelClass)){const info=SDKModel.registeredModels.get(modelClass);if(info===undefined){throw'Model class is not registered @'+new Error().stack;}
if((this._capabilitiesMask&info.capabilities)===info.capabilities){const model=new modelClass(this);this._modelByConstructor.set(modelClass,model);if(!this._creatingModels){this._targetManager.modelAdded(this,modelClass,model);}}}
return this._modelByConstructor.get(modelClass)||null;}
models(){return this._modelByConstructor;}
inspectedURL(){return this._inspectedURL;}
setInspectedURL(inspectedURL){this._inspectedURL=inspectedURL;const parsedURL=ParsedURL.ParsedURL.fromString(inspectedURL);this._inspectedURLName=parsedURL?parsedURL.lastPathComponentWithFragment():'#'+this._id;if(!this.parentTarget()){InspectorFrontendHost.InspectorFrontendHostInstance.inspectedURLChanged(inspectedURL||'');}
this._targetManager.dispatchEventToListeners(Events.InspectedURLChanged,this);if(!this._name){this._targetManager.dispatchEventToListeners(Events.NameChanged,this);}}
async suspend(reason){if(this._isSuspended){return Promise.resolve();}
this._isSuspended=true;await Promise.all(Array.from(this.models().values(),m=>m.preSuspendModel(reason)));await Promise.all(Array.from(this.models().values(),m=>m.suspendModel(reason)));}
async resume(){if(!this._isSuspended){return Promise.resolve();}
this._isSuspended=false;await Promise.all(Array.from(this.models().values(),m=>m.resumeModel()));await Promise.all(Array.from(this.models().values(),m=>m.postResumeModel()));}
suspended(){return this._isSuspended;}}
const Capability={Browser:1<<0,DOM:1<<1,JS:1<<2,Log:1<<3,Network:1<<4,Target:1<<5,ScreenCapture:1<<6,Tracing:1<<7,Emulation:1<<8,Security:1<<9,Input:1<<10,Inspector:1<<11,DeviceEmulation:1<<12,Storage:1<<13,ServiceWorker:1<<14,Audits:1<<15,None:0,};const Type={Frame:'frame',ServiceWorker:'service-worker',Worker:'worker',Node:'node',Browser:'browser',};let targetManagerInstance;class TargetManager extends ObjectWrapper.ObjectWrapper{constructor(){super();this._targets=new Set();this._observers=new Set();this._modelListeners=new Multimap();this._modelObservers=new Multimap();this._isSuspended=false;}
static instance({forceNew}={forceNew:false}){if(!targetManagerInstance||forceNew){targetManagerInstance=new TargetManager();}
return targetManagerInstance;}
async suspendAllTargets(reason){if(this._isSuspended){return;}
this._isSuspended=true;this.dispatchEventToListeners(Events.SuspendStateChanged);const suspendPromises=Array.from(this._targets.values(),target=>target.suspend(reason));await Promise.all(suspendPromises);}
async resumeAllTargets(){if(!this._isSuspended){return;}
this._isSuspended=false;this.dispatchEventToListeners(Events.SuspendStateChanged);const resumePromises=Array.from(this._targets.values(),target=>target.resume());await Promise.all(resumePromises);}
allTargetsSuspended(){return this._isSuspended;}
models(modelClass){const result=[];for(const target of this._targets){const model=target.model(modelClass);if(model){result.push(model);}}
return result;}
inspectedURL(){const mainTarget=this.mainTarget();return mainTarget?mainTarget.inspectedURL():'';}
observeModels(modelClass,observer){const models=this.models(modelClass);this._modelObservers.set(modelClass,observer);for(const model of models){observer.modelAdded(model);}}
unobserveModels(modelClass,observer){this._modelObservers.delete(modelClass,observer);}
modelAdded(target,modelClass,model){for(const observer of this._modelObservers.get(modelClass).values()){observer.modelAdded(model);}}
_modelRemoved(target,modelClass,model){for(const observer of this._modelObservers.get(modelClass).values()){observer.modelRemoved(model);}}
addModelListener(modelClass,eventType,listener,thisObject){for(const model of this.models(modelClass)){model.addEventListener(eventType,listener,thisObject);}
this._modelListeners.set(eventType,{modelClass:modelClass,thisObject:thisObject,listener:listener});}
removeModelListener(modelClass,eventType,listener,thisObject){if(!this._modelListeners.has(eventType)){return;}
for(const model of this.models(modelClass)){model.removeEventListener(eventType,listener,thisObject);}
for(const info of this._modelListeners.get(eventType)){if(info.modelClass===modelClass&&info.listener===listener&&info.thisObject===thisObject){this._modelListeners.delete(eventType,info);}}}
observeTargets(targetObserver){if(this._observers.has(targetObserver)){throw new Error('Observer can only be registered once');}
for(const target of this._targets){targetObserver.targetAdded(target);}
this._observers.add(targetObserver);}
unobserveTargets(targetObserver){this._observers.delete(targetObserver);}
createTarget(id,name,type,parentTarget,sessionId,waitForDebuggerInPage,connection){const target=new Target(this,id,name,type,parentTarget,sessionId||'',this._isSuspended,connection||null);if(waitForDebuggerInPage){target.pageAgent().waitForDebugger();}
target.createModels(new Set(this._modelObservers.keysArray()));this._targets.add(target);for(const observer of[...this._observers]){observer.targetAdded(target);}
for(const modelClass of target.models().keys()){const model=(target.models().get(modelClass));this.modelAdded(target,modelClass,model);}
for(const key of this._modelListeners.keysArray()){for(const info of this._modelListeners.get(key)){const model=target.model(info.modelClass);if(model){model.addEventListener(key,info.listener,info.thisObject);}}}
return target;}
removeTarget(target){if(!this._targets.has(target)){return;}
this._targets.delete(target);for(const modelClass of target.models().keys()){const model=(target.models().get(modelClass));this._modelRemoved(target,modelClass,model);}
for(const observer of[...this._observers]){observer.targetRemoved(target);}
for(const key of this._modelListeners.keysArray()){for(const info of this._modelListeners.get(key)){const model=target.model(info.modelClass);if(model){model.removeEventListener(key,info.listener,info.thisObject);}}}}
targets(){return[...this._targets];}
targetById(id){return this.targets().find(target=>target.id()===id)||null;}
mainTarget(){return this._targets.size?this._targets.values().next().value:null;}}
const Events={AvailableTargetsChanged:Symbol('AvailableTargetsChanged'),InspectedURLChanged:Symbol('InspectedURLChanged'),NameChanged:Symbol('NameChanged'),SuspendStateChanged:Symbol('SuspendStateChanged')};class Observer{targetAdded(target){}
targetRemoved(target){}}
class SDKModelObserver{modelAdded(model){}
modelRemoved(model){}}
var SDKModel$1=Object.freeze({__proto__:null,SDKModel:SDKModel,Target:Target,Capability:Capability,Type:Type,TargetManager:TargetManager,Events:Events,Observer:Observer,SDKModelObserver:SDKModelObserver});const generatedProperties=[{'name':'-internal-effective-zoom','inherited':true},{'name':'-internal-empty-line-height','inherited':false},{'name':'-internal-ua-background-attachment'},{'name':'-internal-ua-background-blend-mode'},{'name':'-internal-ua-background-clip'},{'name':'-internal-ua-background-color'},{'name':'-internal-ua-background-image'},{'name':'-internal-ua-background-origin'},{'name':'-internal-ua-background-position-x'},{'name':'-internal-ua-background-position-y'},{'name':'-internal-ua-background-size'},{'name':'-internal-ua-border-bottom-color'},{'name':'-internal-ua-border-bottom-left-radius'},{'name':'-internal-ua-border-bottom-right-radius'},{'name':'-internal-ua-border-bottom-style'},{'name':'-internal-ua-border-bottom-width'},{'name':'-internal-ua-border-image-outset'},{'name':'-internal-ua-border-image-repeat'},{'name':'-internal-ua-border-image-slice'},{'name':'-internal-ua-border-image-source'},{'name':'-internal-ua-border-image-width'},{'name':'-internal-ua-border-left-color'},{'name':'-internal-ua-border-left-style'},{'name':'-internal-ua-border-left-width'},{'name':'-internal-ua-border-right-color'},{'name':'-internal-ua-border-right-style'},{'name':'-internal-ua-border-right-width'},{'name':'-internal-ua-border-top-color'},{'name':'-internal-ua-border-top-left-radius'},{'name':'-internal-ua-border-top-right-radius'},{'name':'-internal-ua-border-top-style'},{'name':'-internal-ua-border-top-width'},{'name':'-internal-visited-background-color'},{'name':'-internal-visited-border-block-end-color'},{'name':'-internal-visited-border-block-start-color'},{'name':'-internal-visited-border-bottom-color'},{'name':'-internal-visited-border-inline-end-color'},{'name':'-internal-visited-border-inline-start-color'},{'name':'-internal-visited-border-left-color'},{'name':'-internal-visited-border-right-color'},{'name':'-internal-visited-border-top-color'},{'name':'-internal-visited-caret-color','inherited':true},{'name':'-internal-visited-color','inherited':true},{'name':'-internal-visited-column-rule-color'},{'name':'-internal-visited-fill','svg':true,'inherited':true},{'name':'-internal-visited-outline-color'},{'name':'-internal-visited-stroke','svg':true,'inherited':true},{'name':'-internal-visited-text-decoration-color'},{'name':'-internal-visited-text-emphasis-color','inherited':true},{'name':'-internal-visited-text-fill-color','inherited':true},{'name':'-internal-visited-text-stroke-color','inherited':true},{'name':'-webkit-app-region','keywords':['none','drag','no-drag']},{'name':'-webkit-appearance'},{'name':'-webkit-border-horizontal-spacing','inherited':true},{'name':'-webkit-border-image'},{'name':'-webkit-border-vertical-spacing','inherited':true},{'name':'-webkit-box-align','keywords':['stretch','start','center','end','baseline']},{'name':'-webkit-box-decoration-break','keywords':['slice','clone']},{'name':'-webkit-box-direction','inherited':true,'keywords':['normal','reverse']},{'name':'-webkit-box-flex'},{'name':'-webkit-box-ordinal-group'},{'name':'-webkit-box-orient','keywords':['horizontal','vertical']},{'name':'-webkit-box-pack','keywords':['start','center','end','justify']},{'name':'-webkit-box-reflect'},{'longhands':['break-after'],'name':'-webkit-column-break-after'},{'longhands':['break-before'],'name':'-webkit-column-break-before'},{'longhands':['break-inside'],'name':'-webkit-column-break-inside'},{'name':'-webkit-font-size-delta'},{'name':'-webkit-font-smoothing','inherited':true},{'name':'-webkit-highlight','inherited':true},{'name':'-webkit-hyphenate-character','inherited':true},{'name':'-webkit-line-break','inherited':true,'keywords':['auto','loose','normal','strict','after-white-space','anywhere']},{'name':'-webkit-line-clamp'},{'name':'-webkit-locale','inherited':true},{'longhands':['-webkit-mask-image','-webkit-mask-position-x','-webkit-mask-position-y','-webkit-mask-size','-webkit-mask-repeat-x','-webkit-mask-repeat-y','-webkit-mask-origin','-webkit-mask-clip'],'name':'-webkit-mask'},{'longhands':['-webkit-mask-box-image-source','-webkit-mask-box-image-slice','-webkit-mask-box-image-width','-webkit-mask-box-image-outset','-webkit-mask-box-image-repeat'],'name':'-webkit-mask-box-image'},{'name':'-webkit-mask-box-image-outset'},{'name':'-webkit-mask-box-image-repeat'},{'name':'-webkit-mask-box-image-slice'},{'name':'-webkit-mask-box-image-source'},{'name':'-webkit-mask-box-image-width'},{'name':'-webkit-mask-clip'},{'name':'-webkit-mask-composite'},{'name':'-webkit-mask-image'},{'name':'-webkit-mask-origin'},{'longhands':['-webkit-mask-position-x','-webkit-mask-position-y'],'name':'-webkit-mask-position'},{'name':'-webkit-mask-position-x'},{'name':'-webkit-mask-position-y'},{'longhands':['-webkit-mask-repeat-x','-webkit-mask-repeat-y'],'name':'-webkit-mask-repeat'},{'name':'-webkit-mask-repeat-x'},{'name':'-webkit-mask-repeat-y'},{'name':'-webkit-mask-size'},{'name':'-webkit-perspective-origin-x'},{'name':'-webkit-perspective-origin-y'},{'name':'-webkit-print-color-adjust','inherited':true,'keywords':['economy','exact']},{'name':'-webkit-rtl-ordering','inherited':true,'keywords':['logical','visual']},{'name':'-webkit-ruby-position','inherited':true,'keywords':['before','after']},{'name':'-webkit-tap-highlight-color','inherited':true},{'name':'-webkit-text-combine','inherited':true},{'name':'-webkit-text-decorations-in-effect','inherited':true},{'longhands':['-webkit-text-emphasis-style','-webkit-text-emphasis-color'],'name':'-webkit-text-emphasis','inherited':true},{'name':'-webkit-text-emphasis-color','inherited':true},{'name':'-webkit-text-emphasis-position','inherited':true},{'name':'-webkit-text-emphasis-style','inherited':true},{'name':'-webkit-text-fill-color','inherited':true},{'name':'-webkit-text-orientation','inherited':true},{'name':'-webkit-text-security','inherited':true,'keywords':['none','disc','circle','square']},{'longhands':['-webkit-text-stroke-width','-webkit-text-stroke-color'],'name':'-webkit-text-stroke','inherited':true},{'name':'-webkit-text-stroke-color','inherited':true},{'name':'-webkit-text-stroke-width','inherited':true},{'name':'-webkit-transform-origin-x'},{'name':'-webkit-transform-origin-y'},{'name':'-webkit-transform-origin-z'},{'name':'-webkit-user-drag','keywords':['auto','none','element']},{'name':'-webkit-user-modify','inherited':true,'keywords':['read-only','read-write','read-write-plaintext-only']},{'name':'-webkit-writing-mode','inherited':true},{'name':'align-content'},{'name':'align-items'},{'name':'align-self'},{'keywords':['baseline','alphabetic','ideographic','middle','central','mathematical'],'svg':true,'name':'alignment-baseline'},{'name':'all'},{'longhands':['animation-duration','animation-timing-function','animation-delay','animation-iteration-count','animation-direction','animation-fill-mode','animation-play-state','animation-name'],'name':'animation'},{'name':'animation-delay'},{'name':'animation-direction','keywords':['normal','reverse','alternate','alternate-reverse']},{'name':'animation-duration'},{'name':'animation-fill-mode','keywords':['none','forwards','backwards','both']},{'name':'animation-iteration-count','keywords':['infinite']},{'name':'animation-name','keywords':['none']},{'name':'animation-play-state','keywords':['running','paused']},{'name':'animation-timing-function','keywords':['linear','ease','ease-in','ease-out','ease-in-out','jump-both','jump-end','jump-none','jump-start','step-start','step-end']},{'name':'backdrop-filter','keywords':['none']},{'name':'backface-visibility','keywords':['visible','hidden']},{'longhands':['background-image','background-position-x','background-position-y','background-size','background-repeat-x','background-repeat-y','background-attachment','background-origin','background-clip','background-color'],'name':'background'},{'name':'background-attachment','keywords':['scroll','fixed','local']},{'name':'background-blend-mode','keywords':['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']},{'name':'background-clip','keywords':['border-box','padding-box','content-box']},{'name':'background-color','keywords':['currentcolor']},{'name':'background-image','keywords':['auto','none']},{'name':'background-origin','keywords':['border-box','padding-box','content-box']},{'longhands':['background-position-x','background-position-y'],'name':'background-position'},{'name':'background-position-x'},{'name':'background-position-y'},{'longhands':['background-repeat-x','background-repeat-y'],'name':'background-repeat'},{'name':'background-repeat-x'},{'name':'background-repeat-y'},{'name':'background-size','keywords':['auto','cover','contain']},{'name':'baseline-shift','svg':true,'keywords':['sub','super']},{'name':'block-size','keywords':['auto']},{'longhands':['border-top-color','border-top-style','border-top-width','border-right-color','border-right-style','border-right-width','border-bottom-color','border-bottom-style','border-bottom-width','border-left-color','border-left-style','border-left-width','border-image-source','border-image-slice','border-image-width','border-image-outset','border-image-repeat'],'name':'border'},{'longhands':['border-block-start-color','border-block-start-style','border-block-start-width','border-block-end-color','border-block-end-style','border-block-end-width'],'name':'border-block'},{'longhands':['border-block-start-color','border-block-end-color'],'name':'border-block-color'},{'longhands':['border-block-end-width','border-block-end-style','border-block-end-color'],'name':'border-block-end'},{'name':'border-block-end-color'},{'name':'border-block-end-style'},{'name':'border-block-end-width'},{'longhands':['border-block-start-width','border-block-start-style','border-block-start-color'],'name':'border-block-start'},{'name':'border-block-start-color'},{'name':'border-block-start-style'},{'name':'border-block-start-width'},{'longhands':['border-block-start-style','border-block-end-style'],'name':'border-block-style'},{'longhands':['border-block-start-width','border-block-end-width'],'name':'border-block-width'},{'longhands':['border-bottom-width','border-bottom-style','border-bottom-color'],'name':'border-bottom'},{'name':'border-bottom-color','keywords':['currentcolor']},{'name':'border-bottom-left-radius'},{'name':'border-bottom-right-radius'},{'name':'border-bottom-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'border-bottom-width','keywords':['thin','medium','thick']},{'name':'border-collapse','inherited':true,'keywords':['separate','collapse']},{'longhands':['border-top-color','border-right-color','border-bottom-color','border-left-color'],'name':'border-color'},{'longhands':['border-image-source','border-image-slice','border-image-width','border-image-outset','border-image-repeat'],'name':'border-image'},{'name':'border-image-outset'},{'name':'border-image-repeat','keywords':['stretch','repeat','round','space']},{'name':'border-image-slice'},{'name':'border-image-source','keywords':['none']},{'name':'border-image-width','keywords':['auto']},{'longhands':['border-inline-start-color','border-inline-start-style','border-inline-start-width','border-inline-end-color','border-inline-end-style','border-inline-end-width'],'name':'border-inline'},{'longhands':['border-inline-start-color','border-inline-end-color'],'name':'border-inline-color'},{'longhands':['border-inline-end-width','border-inline-end-style','border-inline-end-color'],'name':'border-inline-end'},{'name':'border-inline-end-color'},{'name':'border-inline-end-style'},{'name':'border-inline-end-width'},{'longhands':['border-inline-start-width','border-inline-start-style','border-inline-start-color'],'name':'border-inline-start'},{'name':'border-inline-start-color'},{'name':'border-inline-start-style'},{'name':'border-inline-start-width'},{'longhands':['border-inline-start-style','border-inline-end-style'],'name':'border-inline-style'},{'longhands':['border-inline-start-width','border-inline-end-width'],'name':'border-inline-width'},{'longhands':['border-left-width','border-left-style','border-left-color'],'name':'border-left'},{'name':'border-left-color','keywords':['currentcolor']},{'name':'border-left-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'border-left-width','keywords':['thin','medium','thick']},{'longhands':['border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius'],'name':'border-radius'},{'longhands':['border-right-width','border-right-style','border-right-color'],'name':'border-right'},{'name':'border-right-color','keywords':['currentcolor']},{'name':'border-right-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'border-right-width','keywords':['thin','medium','thick']},{'longhands':['-webkit-border-horizontal-spacing','-webkit-border-vertical-spacing'],'name':'border-spacing','inherited':true},{'keywords':['none'],'longhands':['border-top-style','border-right-style','border-bottom-style','border-left-style'],'name':'border-style'},{'longhands':['border-top-width','border-top-style','border-top-color'],'name':'border-top'},{'name':'border-top-color','keywords':['currentcolor']},{'name':'border-top-left-radius'},{'name':'border-top-right-radius'},{'name':'border-top-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'border-top-width','keywords':['thin','medium','thick']},{'longhands':['border-top-width','border-right-width','border-bottom-width','border-left-width'],'name':'border-width'},{'name':'bottom','keywords':['auto']},{'name':'box-shadow','keywords':['none']},{'name':'box-sizing','keywords':['content-box','border-box']},{'name':'break-after','keywords':['auto','avoid','avoid-column','avoid-page','column','left','page','recto','right','verso']},{'name':'break-before','keywords':['auto','avoid','avoid-column','avoid-page','column','left','page','recto','right','verso']},{'name':'break-inside','keywords':['auto','avoid','avoid-column','avoid-page']},{'svg':true,'name':'buffered-rendering'},{'name':'caption-side','inherited':true,'keywords':['top','bottom']},{'name':'caret-color','inherited':true,'keywords':['auto','currentcolor']},{'name':'clear','keywords':['none','left','right','both','inline-start','inline-end']},{'name':'clip','keywords':['auto']},{'name':'clip-path','keywords':['none']},{'name':'clip-rule','svg':true,'inherited':true,'keywords':['nonzero','evenodd']},{'name':'color','inherited':true,'keywords':['currentcolor']},{'name':'color-interpolation','svg':true,'inherited':true,'keywords':['auto','srgb','linearrgb']},{'svg':true,'name':'color-interpolation-filters','inherited':true},{'name':'color-rendering','svg':true,'inherited':true,'keywords':['auto','optimizespeed','optimizequality']},{'name':'color-scheme','inherited':true},{'name':'column-count','keywords':['auto']},{'name':'column-fill','keywords':['balance','auto']},{'name':'column-gap','keywords':['normal']},{'longhands':['column-rule-width','column-rule-style','column-rule-color'],'name':'column-rule'},{'name':'column-rule-color','keywords':['currentcolor']},{'name':'column-rule-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'column-rule-width','keywords':['thin','medium','thick']},{'name':'column-span','keywords':['none','all']},{'name':'column-width','keywords':['auto']},{'longhands':['column-width','column-count'],'name':'columns'},{'name':'contain','keywords':['none','strict','content','size','layout','style','paint']},{'name':'contain-intrinsic-size','keywords':['auto']},{'name':'content'},{'name':'counter-increment','keywords':['none']},{'name':'counter-reset','keywords':['none']},{'name':'cursor','inherited':true,'keywords':['auto','default','none','context-menu','help','pointer','progress','wait','cell','crosshair','text','vertical-text','alias','copy','move','no-drop','not-allowed','e-resize','n-resize','ne-resize','nw-resize','s-resize','se-resize','sw-resize','w-resize','ew-resize','ns-resize','nesw-resize','nwse-resize','col-resize','row-resize','all-scroll','zoom-in','zoom-out','grab','grabbing']},{'svg':true,'name':'cx'},{'svg':true,'name':'cy'},{'name':'d','svg':true,'keywords':['none']},{'name':'direction','inherited':true,'keywords':['ltr','rtl']},{'keywords':['inline','block','list-item','inline-block','table','inline-table','table-row-group','table-header-group','table-footer-group','table-row','table-column-group','table-column','table-cell','table-caption','-webkit-box','-webkit-inline-box','flex','inline-flex','grid','inline-grid','contents','flow-root','none'],'name':'display'},{'name':'dominant-baseline','svg':true,'inherited':true,'keywords':['auto','alphabetic','ideographic','middle','central','mathematical','hanging']},{'name':'empty-cells','inherited':true,'keywords':['show','hide']},{'name':'fill','svg':true,'inherited':true},{'svg':true,'inherited':true,'name':'fill-opacity'},{'name':'fill-rule','svg':true,'inherited':true,'keywords':['nonzero','evenodd']},{'name':'filter','keywords':['none']},{'longhands':['flex-grow','flex-shrink','flex-basis'],'name':'flex'},{'name':'flex-basis','keywords':['auto']},{'name':'flex-direction','keywords':['row','row-reverse','column','column-reverse']},{'longhands':['flex-direction','flex-wrap'],'name':'flex-flow'},{'name':'flex-grow'},{'name':'flex-shrink'},{'name':'flex-wrap','keywords':['nowrap','wrap','wrap-reverse']},{'name':'float','keywords':['none','left','right','inline-start','inline-end']},{'name':'flood-color','svg':true,'keywords':['currentcolor']},{'name':'flood-opacity','svg':true},{'longhands':['font-style','font-variant-ligatures','font-variant-caps','font-variant-numeric','font-variant-east-asian','font-weight','font-stretch','font-size','line-height','font-family'],'name':'font','inherited':true},{'name':'font-display'},{'name':'font-family','inherited':true},{'name':'font-feature-settings','inherited':true,'keywords':['normal']},{'name':'font-kerning','inherited':true,'keywords':['auto','normal','none']},{'name':'font-optical-sizing','inherited':true,'keywords':['auto','none']},{'name':'font-size','inherited':true,'keywords':['xx-small','x-small','small','medium','large','x-large','xx-large','xxx-large','larger','smaller','-webkit-xxx-large']},{'name':'font-size-adjust','inherited':true,'keywords':['none']},{'name':'font-stretch','inherited':true,'keywords':['normal','ultra-condensed','extra-condensed','condensed','semi-condensed','semi-expanded','expanded','extra-expanded','ultra-expanded']},{'name':'font-style','inherited':true,'keywords':['normal','italic','oblique']},{'longhands':['font-variant-ligatures','font-variant-caps','font-variant-numeric','font-variant-east-asian'],'name':'font-variant','inherited':true},{'inherited':true,'keywords':['normal','small-caps','all-small-caps','petite-caps','all-petite-caps','unicase','titling-caps'],'name':'font-variant-caps'},{'inherited':true,'keywords':['normal','jis78','jis83','jis90','jis04','simplified','traditional','full-width','proportional-width','ruby'],'name':'font-variant-east-asian'},{'name':'font-variant-ligatures','inherited':true,'keywords':['normal','none','common-ligatures','no-common-ligatures','discretionary-ligatures','no-discretionary-ligatures','historical-ligatures','no-historical-ligatures','contextual','no-contextual']},{'inherited':true,'keywords':['normal','lining-nums','oldstyle-nums','proportional-nums','tabular-nums','diagonal-fractions','stacked-fractions','ordinal','slashed-zero'],'name':'font-variant-numeric'},{'name':'font-variation-settings','inherited':true,'keywords':['normal']},{'name':'font-weight','inherited':true,'keywords':['normal','bold','bolder','lighter']},{'name':'forced-color-adjust','inherited':true,'keywords':['auto','none']},{'longhands':['row-gap','column-gap'],'name':'gap'},{'longhands':['grid-template-rows','grid-template-columns','grid-template-areas','grid-auto-flow','grid-auto-rows','grid-auto-columns'],'name':'grid'},{'longhands':['grid-row-start','grid-column-start','grid-row-end','grid-column-end'],'name':'grid-area'},{'name':'grid-auto-columns','keywords':['auto','min-content','max-content']},{'name':'grid-auto-flow','keywords':['row','column']},{'name':'grid-auto-rows','keywords':['auto','min-content','max-content']},{'longhands':['grid-column-start','grid-column-end'],'name':'grid-column'},{'name':'grid-column-end','keywords':['auto']},{'longhands':['column-gap'],'name':'grid-column-gap'},{'name':'grid-column-start','keywords':['auto']},{'longhands':['row-gap','column-gap'],'name':'grid-gap'},{'longhands':['grid-row-start','grid-row-end'],'name':'grid-row'},{'name':'grid-row-end','keywords':['auto']},{'longhands':['row-gap'],'name':'grid-row-gap'},{'name':'grid-row-start','keywords':['auto']},{'longhands':['grid-template-rows','grid-template-columns','grid-template-areas'],'name':'grid-template'},{'keywords':['none'],'name':'grid-template-areas'},{'name':'grid-template-columns','keywords':['none']},{'name':'grid-template-rows','keywords':['none']},{'name':'height','keywords':['auto','fit-content','min-content','max-content']},{'name':'hyphens','inherited':true,'keywords':['none','manual','auto']},{'name':'image-orientation','inherited':true},{'name':'image-rendering','inherited':true,'keywords':['auto','optimizespeed','optimizequality','-webkit-optimize-contrast','pixelated']},{'name':'inherits'},{'name':'initial-value'},{'name':'inline-size','keywords':['auto']},{'longhands':['top','right','bottom','left'],'name':'inset'},{'longhands':['inset-block-start','inset-block-end'],'name':'inset-block'},{'name':'inset-block-end'},{'name':'inset-block-start'},{'longhands':['inset-inline-start','inset-inline-end'],'name':'inset-inline'},{'name':'inset-inline-end'},{'name':'inset-inline-start'},{'name':'isolation','keywords':['auto','isolate']},{'name':'justify-content'},{'name':'justify-items'},{'name':'justify-self'},{'name':'left','keywords':['auto']},{'inherited':true,'keywords':['normal'],'name':'letter-spacing'},{'name':'lighting-color','svg':true,'keywords':['currentcolor']},{'name':'line-break','inherited':true,'keywords':['auto','loose','normal','strict','anywhere']},{'name':'line-height','inherited':true,'keywords':['normal']},{'name':'line-height-step','inherited':true},{'longhands':['list-style-position','list-style-image','list-style-type'],'name':'list-style','inherited':true},{'name':'list-style-image','inherited':true,'keywords':['none']},{'name':'list-style-position','inherited':true,'keywords':['outside','inside']},{'keywords':['disc','circle','square','decimal','decimal-leading-zero','arabic-indic','bengali','cambodian','khmer','devanagari','gujarati','gurmukhi','kannada','lao','malayalam','mongolian','myanmar','oriya','persian','urdu','telugu','tibetan','thai','lower-roman','upper-roman','lower-greek','lower-alpha','lower-latin','upper-alpha','upper-latin','cjk-earthly-branch','cjk-heavenly-stem','ethiopic-halehame','ethiopic-halehame-am','ethiopic-halehame-ti-er','ethiopic-halehame-ti-et','hangul','hangul-consonant','korean-hangul-formal','korean-hanja-formal','korean-hanja-informal','hebrew','armenian','lower-armenian','upper-armenian','georgian','cjk-ideographic','simp-chinese-formal','simp-chinese-informal','trad-chinese-formal','trad-chinese-informal','hiragana','katakana','hiragana-iroha','katakana-iroha','none'],'name':'list-style-type','inherited':true},{'longhands':['margin-top','margin-right','margin-bottom','margin-left'],'name':'margin'},{'longhands':['margin-block-start','margin-block-end'],'name':'margin-block'},{'name':'margin-block-end','keywords':['auto']},{'name':'margin-block-start','keywords':['auto']},{'name':'margin-bottom','keywords':['auto']},{'longhands':['margin-inline-start','margin-inline-end'],'name':'margin-inline'},{'name':'margin-inline-end','keywords':['auto']},{'name':'margin-inline-start','keywords':['auto']},{'name':'margin-left','keywords':['auto']},{'name':'margin-right','keywords':['auto']},{'name':'margin-top','keywords':['auto']},{'longhands':['marker-start','marker-mid','marker-end'],'inherited':true,'name':'marker','svg':true},{'svg':true,'inherited':true,'keywords':['none'],'name':'marker-end'},{'svg':true,'inherited':true,'keywords':['none'],'name':'marker-mid'},{'svg':true,'inherited':true,'keywords':['none'],'name':'marker-start'},{'svg':true,'name':'mask'},{'name':'mask-source-type'},{'keywords':['luminance','alpha'],'svg':true,'name':'mask-type'},{'keywords':['none'],'name':'max-block-size'},{'name':'max-height','keywords':['none']},{'keywords':['none'],'name':'max-inline-size'},{'name':'max-width','keywords':['none']},{'name':'max-zoom'},{'name':'min-block-size'},{'name':'min-height'},{'name':'min-inline-size'},{'name':'min-width'},{'name':'min-zoom'},{'name':'mix-blend-mode','keywords':['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']},{'name':'object-fit','keywords':['fill','contain','cover','none','scale-down']},{'name':'object-position'},{'longhands':['offset-position','offset-path','offset-distance','offset-rotate','offset-anchor'],'name':'offset'},{'name':'offset-anchor','keywords':['auto']},{'name':'offset-distance'},{'name':'offset-path','keywords':['none']},{'name':'offset-position','keywords':['auto']},{'name':'offset-rotate','keywords':['auto','reverse']},{'name':'opacity'},{'name':'order'},{'name':'orientation'},{'name':'origin-trial-test-property','keywords':['normal','none']},{'name':'orphans','inherited':true},{'longhands':['outline-color','outline-style','outline-width'],'name':'outline'},{'name':'outline-color','keywords':['currentcolor']},{'name':'outline-offset'},{'name':'outline-style','keywords':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},{'name':'outline-width','keywords':['thin','medium','thick']},{'longhands':['overflow-x','overflow-y'],'name':'overflow'},{'name':'overflow-anchor','inherited':false,'keywords':['visible','none','auto']},{'name':'overflow-block'},{'name':'overflow-inline'},{'name':'overflow-wrap','inherited':true,'keywords':['normal','break-word','anywhere']},{'name':'overflow-x','keywords':['visible','hidden','scroll','auto','overlay']},{'name':'overflow-y','keywords':['visible','hidden','scroll','auto','overlay']},{'longhands':['overscroll-behavior-x','overscroll-behavior-y'],'name':'overscroll-behavior'},{'name':'overscroll-behavior-block'},{'name':'overscroll-behavior-inline'},{'name':'overscroll-behavior-x','keywords':['auto','contain','none']},{'name':'overscroll-behavior-y','keywords':['auto','contain','none']},{'longhands':['padding-top','padding-right','padding-bottom','padding-left'],'name':'padding'},{'longhands':['padding-block-start','padding-block-end'],'name':'padding-block'},{'name':'padding-block-end'},{'name':'padding-block-start'},{'name':'padding-bottom'},{'longhands':['padding-inline-start','padding-inline-end'],'name':'padding-inline'},{'name':'padding-inline-end'},{'name':'padding-inline-start'},{'name':'padding-left'},{'name':'padding-right'},{'name':'padding-top'},{'name':'page'},{'longhands':['break-after'],'name':'page-break-after'},{'longhands':['break-before'],'name':'page-break-before'},{'longhands':['break-inside'],'name':'page-break-inside'},{'svg':true,'inherited':true,'keywords':['normal','fill','stroke','markers'],'name':'paint-order'},{'name':'perspective','keywords':['none']},{'name':'perspective-origin'},{'longhands':['align-content','justify-content'],'name':'place-content'},{'longhands':['align-items','justify-items'],'name':'place-items'},{'longhands':['align-self','justify-self'],'name':'place-self'},{'name':'pointer-events','inherited':true,'keywords':['none','auto','stroke','fill','painted','visible','visiblestroke','visiblefill','visiblepainted','bounding-box','all']},{'name':'position','keywords':['static','relative','absolute','fixed','sticky']},{'name':'quotes','inherited':true,'keywords':['none']},{'svg':true,'name':'r'},{'name':'resize','keywords':['none','both','horizontal','vertical','block','inline']},{'name':'right','keywords':['auto']},{'name':'rotate'},{'name':'row-gap','keywords':['normal']},{'name':'rx','svg':true,'keywords':['auto']},{'name':'ry','svg':true,'keywords':['auto']},{'name':'scale'},{'name':'scroll-behavior','keywords':['auto','smooth']},{'name':'scroll-customization'},{'longhands':['scroll-margin-top','scroll-margin-right','scroll-margin-bottom','scroll-margin-left'],'name':'scroll-margin'},{'longhands':['scroll-margin-block-start','scroll-margin-block-end'],'name':'scroll-margin-block'},{'name':'scroll-margin-block-end'},{'name':'scroll-margin-block-start'},{'name':'scroll-margin-bottom'},{'longhands':['scroll-margin-inline-start','scroll-margin-inline-end'],'name':'scroll-margin-inline'},{'name':'scroll-margin-inline-end'},{'name':'scroll-margin-inline-start'},{'name':'scroll-margin-left'},{'name':'scroll-margin-right'},{'name':'scroll-margin-top'},{'longhands':['scroll-padding-top','scroll-padding-right','scroll-padding-bottom','scroll-padding-left'],'name':'scroll-padding'},{'longhands':['scroll-padding-block-start','scroll-padding-block-end'],'name':'scroll-padding-block'},{'name':'scroll-padding-block-end','keywords':['auto']},{'name':'scroll-padding-block-start','keywords':['auto']},{'name':'scroll-padding-bottom','keywords':['auto']},{'longhands':['scroll-padding-inline-start','scroll-padding-inline-end'],'name':'scroll-padding-inline'},{'name':'scroll-padding-inline-end','keywords':['auto']},{'name':'scroll-padding-inline-start','keywords':['auto']},{'name':'scroll-padding-left','keywords':['auto']},{'name':'scroll-padding-right','keywords':['auto']},{'name':'scroll-padding-top','keywords':['auto']},{'name':'scroll-snap-align','keywords':['none','start','end','center']},{'name':'scroll-snap-stop','keywords':['normal','always']},{'name':'scroll-snap-type','keywords':['none','x','y','block','inline','both','mandatory','proximity']},{'name':'shape-image-threshold'},{'name':'shape-margin','keywords':['none']},{'name':'shape-outside','keywords':['none']},{'name':'shape-rendering','svg':true,'inherited':true,'keywords':['auto','optimizespeed','crispedges','geometricprecision']},{'name':'size'},{'name':'speak','inherited':true,'keywords':['none','normal','spell-out','digits','literal-punctuation','no-punctuation']},{'name':'src'},{'name':'stop-color','svg':true,'keywords':['currentcolor']},{'name':'stop-opacity','svg':true},{'name':'stroke','svg':true,'inherited':true},{'name':'stroke-dasharray','svg':true,'inherited':true,'keywords':['none']},{'name':'stroke-dashoffset','svg':true,'inherited':true},{'name':'stroke-linecap','svg':true,'inherited':true,'keywords':['butt','round','square']},{'name':'stroke-linejoin','svg':true,'inherited':true,'keywords':['miter','bevel','round']},{'name':'stroke-miterlimit','svg':true,'inherited':true},{'svg':true,'inherited':true,'name':'stroke-opacity'},{'svg':true,'inherited':true,'name':'stroke-width'},{'name':'subtree-visibility','keywords':['visible','auto','hidden','hidden-matchable']},{'name':'syntax'},{'name':'tab-size','inherited':true},{'name':'table-layout','keywords':['auto','fixed']},{'name':'text-align','inherited':true,'keywords':['left','right','center','justify','-webkit-left','-webkit-right','-webkit-center','start','end']},{'name':'text-align-last','inherited':true,'keywords':['auto','start','end','left','right','center','justify']},{'name':'text-anchor','svg':true,'inherited':true,'keywords':['start','middle','end']},{'name':'text-combine-upright','inherited':true,'keywords':['none','all']},{'longhands':['text-decoration-line','text-decoration-style','text-decoration-color'],'name':'text-decoration'},{'name':'text-decoration-color','keywords':['currentcolor']},{'name':'text-decoration-line','keywords':['none','underline','overline','line-through','blink']},{'name':'text-decoration-skip-ink','inherited':true,'keywords':['none','auto']},{'name':'text-decoration-style','keywords':['solid','double','dotted','dashed','wavy']},{'name':'text-indent','inherited':true},{'name':'text-justify','inherited':true,'keywords':['auto','none','inter-word','distribute']},{'name':'text-orientation','inherited':true,'keywords':['sideways','mixed','upright']},{'name':'text-overflow','keywords':['clip','ellipsis']},{'name':'text-rendering','inherited':true,'keywords':['auto','optimizespeed','optimizelegibility','geometricprecision']},{'name':'text-shadow','inherited':true,'keywords':['none']},{'name':'text-size-adjust','inherited':true,'keywords':['none','auto']},{'name':'text-transform','inherited':true,'keywords':['capitalize','uppercase','lowercase','none']},{'name':'text-underline-position','inherited':true,'keywords':['auto','under','left','right']},{'name':'top','keywords':['auto']},{'name':'touch-action','keywords':['auto','none','pan-x','pan-left','pan-right','pan-y','pan-up','pan-down','pinch-zoom','manipulation']},{'name':'transform','keywords':['none']},{'name':'transform-box','keywords':['fill-box','view-box']},{'name':'transform-origin'},{'name':'transform-style','keywords':['flat','preserve-3d']},{'longhands':['transition-property','transition-duration','transition-timing-function','transition-delay'],'name':'transition'},{'name':'transition-delay'},{'name':'transition-duration'},{'name':'transition-property','keywords':['none']},{'name':'transition-timing-function','keywords':['linear','ease','ease-in','ease-out','ease-in-out','jump-both','jump-end','jump-none','jump-start','step-start','step-end']},{'name':'translate'},{'name':'unicode-bidi','keywords':['normal','embed','bidi-override','isolate','plaintext','isolate-override']},{'name':'unicode-range'},{'name':'user-select','inherited':true,'keywords':['auto','none','text','all']},{'name':'user-zoom'},{'keywords':['none','non-scaling-stroke'],'svg':true,'name':'vector-effect'},{'name':'vertical-align','keywords':['baseline','sub','super','text-top','text-bottom','middle']},{'name':'viewport-fit'},{'name':'visibility','inherited':true,'keywords':['visible','hidden','collapse']},{'name':'white-space','inherited':true,'keywords':['none','normal','pre','pre-wrap','pre-line','nowrap','-webkit-nowrap','break-spaces']},{'name':'widows','inherited':true},{'name':'width','keywords':['auto','fit-content','min-content','max-content']},{'keywords':['auto'],'name':'will-change'},{'name':'word-break','inherited':true,'keywords':['normal','break-all','keep-all','break-word']},{'inherited':true,'keywords':['normal'],'name':'word-spacing'},{'name':'writing-mode','inherited':true,'keywords':['horizontal-tb','vertical-rl','vertical-lr']},{'svg':true,'name':'x'},{'svg':true,'name':'y'},{'name':'z-index','keywords':['auto']},{'name':'zoom'}];const generatedPropertyValues={'-webkit-app-region':{'values':['none','drag','no-drag']},'-webkit-box-align':{'values':['stretch','start','center','end','baseline']},'-webkit-box-decoration-break':{'values':['slice','clone']},'-webkit-box-direction':{'values':['normal','reverse']},'-webkit-box-orient':{'values':['horizontal','vertical']},'-webkit-box-pack':{'values':['start','center','end','justify']},'-webkit-line-break':{'values':['auto','loose','normal','strict','after-white-space','anywhere']},'-webkit-print-color-adjust':{'values':['economy','exact']},'-webkit-rtl-ordering':{'values':['logical','visual']},'-webkit-ruby-position':{'values':['before','after']},'-webkit-text-security':{'values':['none','disc','circle','square']},'-webkit-user-drag':{'values':['auto','none','element']},'-webkit-user-modify':{'values':['read-only','read-write','read-write-plaintext-only']},'alignment-baseline':{'values':['baseline','alphabetic','ideographic','middle','central','mathematical']},'animation-direction':{'values':['normal','reverse','alternate','alternate-reverse']},'animation-fill-mode':{'values':['none','forwards','backwards','both']},'animation-iteration-count':{'values':['infinite']},'animation-name':{'values':['none']},'animation-play-state':{'values':['running','paused']},'animation-timing-function':{'values':['linear','ease','ease-in','ease-out','ease-in-out','jump-both','jump-end','jump-none','jump-start','step-start','step-end']},'backdrop-filter':{'values':['none']},'backface-visibility':{'values':['visible','hidden']},'background-attachment':{'values':['scroll','fixed','local']},'background-blend-mode':{'values':['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']},'background-clip':{'values':['border-box','padding-box','content-box']},'background-color':{'values':['currentcolor']},'background-image':{'values':['auto','none']},'background-origin':{'values':['border-box','padding-box','content-box']},'background-size':{'values':['auto','cover','contain']},'baseline-shift':{'values':['sub','super']},'block-size':{'values':['auto']},'border-bottom-color':{'values':['currentcolor']},'border-bottom-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'border-bottom-width':{'values':['thin','medium','thick']},'border-collapse':{'values':['separate','collapse']},'border-image-repeat':{'values':['stretch','repeat','round','space']},'border-image-source':{'values':['none']},'border-image-width':{'values':['auto']},'border-left-color':{'values':['currentcolor']},'border-left-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'border-left-width':{'values':['thin','medium','thick']},'border-right-color':{'values':['currentcolor']},'border-right-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'border-right-width':{'values':['thin','medium','thick']},'border-style':{'values':['none']},'border-top-color':{'values':['currentcolor']},'border-top-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'border-top-width':{'values':['thin','medium','thick']},'bottom':{'values':['auto']},'box-shadow':{'values':['none']},'box-sizing':{'values':['content-box','border-box']},'break-after':{'values':['auto','avoid','avoid-column','avoid-page','column','left','page','recto','right','verso']},'break-before':{'values':['auto','avoid','avoid-column','avoid-page','column','left','page','recto','right','verso']},'break-inside':{'values':['auto','avoid','avoid-column','avoid-page']},'caption-side':{'values':['top','bottom']},'caret-color':{'values':['auto','currentcolor']},'clear':{'values':['none','left','right','both','inline-start','inline-end']},'clip':{'values':['auto']},'clip-path':{'values':['none']},'clip-rule':{'values':['nonzero','evenodd']},'color':{'values':['currentcolor']},'color-interpolation':{'values':['auto','srgb','linearrgb']},'color-rendering':{'values':['auto','optimizespeed','optimizequality']},'column-count':{'values':['auto']},'column-fill':{'values':['balance','auto']},'column-gap':{'values':['normal']},'column-rule-color':{'values':['currentcolor']},'column-rule-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'column-rule-width':{'values':['thin','medium','thick']},'column-span':{'values':['none','all']},'column-width':{'values':['auto']},'contain':{'values':['none','strict','content','size','layout','style','paint']},'contain-intrinsic-size':{'values':['auto']},'counter-increment':{'values':['none']},'counter-reset':{'values':['none']},'cursor':{'values':['auto','default','none','context-menu','help','pointer','progress','wait','cell','crosshair','text','vertical-text','alias','copy','move','no-drop','not-allowed','e-resize','n-resize','ne-resize','nw-resize','s-resize','se-resize','sw-resize','w-resize','ew-resize','ns-resize','nesw-resize','nwse-resize','col-resize','row-resize','all-scroll','zoom-in','zoom-out','grab','grabbing']},'d':{'values':['none']},'direction':{'values':['ltr','rtl']},'display':{'values':['inline','block','list-item','inline-block','table','inline-table','table-row-group','table-header-group','table-footer-group','table-row','table-column-group','table-column','table-cell','table-caption','-webkit-box','-webkit-inline-box','flex','inline-flex','grid','inline-grid','contents','flow-root','none']},'dominant-baseline':{'values':['auto','alphabetic','ideographic','middle','central','mathematical','hanging']},'empty-cells':{'values':['show','hide']},'fill-rule':{'values':['nonzero','evenodd']},'filter':{'values':['none']},'flex-basis':{'values':['auto']},'flex-direction':{'values':['row','row-reverse','column','column-reverse']},'flex-wrap':{'values':['nowrap','wrap','wrap-reverse']},'float':{'values':['none','left','right','inline-start','inline-end']},'flood-color':{'values':['currentcolor']},'font-feature-settings':{'values':['normal']},'font-kerning':{'values':['auto','normal','none']},'font-optical-sizing':{'values':['auto','none']},'font-size':{'values':['xx-small','x-small','small','medium','large','x-large','xx-large','xxx-large','larger','smaller','-webkit-xxx-large']},'font-size-adjust':{'values':['none']},'font-stretch':{'values':['normal','ultra-condensed','extra-condensed','condensed','semi-condensed','semi-expanded','expanded','extra-expanded','ultra-expanded']},'font-style':{'values':['normal','italic','oblique']},'font-variant-caps':{'values':['normal','small-caps','all-small-caps','petite-caps','all-petite-caps','unicase','titling-caps']},'font-variant-east-asian':{'values':['normal','jis78','jis83','jis90','jis04','simplified','traditional','full-width','proportional-width','ruby']},'font-variant-ligatures':{'values':['normal','none','common-ligatures','no-common-ligatures','discretionary-ligatures','no-discretionary-ligatures','historical-ligatures','no-historical-ligatures','contextual','no-contextual']},'font-variant-numeric':{'values':['normal','lining-nums','oldstyle-nums','proportional-nums','tabular-nums','diagonal-fractions','stacked-fractions','ordinal','slashed-zero']},'font-variation-settings':{'values':['normal']},'font-weight':{'values':['normal','bold','bolder','lighter']},'forced-color-adjust':{'values':['auto','none']},'grid-auto-columns':{'values':['auto','min-content','max-content']},'grid-auto-flow':{'values':['row','column']},'grid-auto-rows':{'values':['auto','min-content','max-content']},'grid-column-end':{'values':['auto']},'grid-column-start':{'values':['auto']},'grid-row-end':{'values':['auto']},'grid-row-start':{'values':['auto']},'grid-template-areas':{'values':['none']},'grid-template-columns':{'values':['none']},'grid-template-rows':{'values':['none']},'height':{'values':['auto','fit-content','min-content','max-content']},'hyphens':{'values':['none','manual','auto']},'image-rendering':{'values':['auto','optimizespeed','optimizequality','-webkit-optimize-contrast','pixelated']},'inline-size':{'values':['auto']},'isolation':{'values':['auto','isolate']},'left':{'values':['auto']},'letter-spacing':{'values':['normal']},'lighting-color':{'values':['currentcolor']},'line-break':{'values':['auto','loose','normal','strict','anywhere']},'line-height':{'values':['normal']},'list-style-image':{'values':['none']},'list-style-position':{'values':['outside','inside']},'list-style-type':{'values':['disc','circle','square','decimal','decimal-leading-zero','arabic-indic','bengali','cambodian','khmer','devanagari','gujarati','gurmukhi','kannada','lao','malayalam','mongolian','myanmar','oriya','persian','urdu','telugu','tibetan','thai','lower-roman','upper-roman','lower-greek','lower-alpha','lower-latin','upper-alpha','upper-latin','cjk-earthly-branch','cjk-heavenly-stem','ethiopic-halehame','ethiopic-halehame-am','ethiopic-halehame-ti-er','ethiopic-halehame-ti-et','hangul','hangul-consonant','korean-hangul-formal','korean-hanja-formal','korean-hanja-informal','hebrew','armenian','lower-armenian','upper-armenian','georgian','cjk-ideographic','simp-chinese-formal','simp-chinese-informal','trad-chinese-formal','trad-chinese-informal','hiragana','katakana','hiragana-iroha','katakana-iroha','none']},'margin-block-end':{'values':['auto']},'margin-block-start':{'values':['auto']},'margin-bottom':{'values':['auto']},'margin-inline-end':{'values':['auto']},'margin-inline-start':{'values':['auto']},'margin-left':{'values':['auto']},'margin-right':{'values':['auto']},'margin-top':{'values':['auto']},'marker-end':{'values':['none']},'marker-mid':{'values':['none']},'marker-start':{'values':['none']},'mask-type':{'values':['luminance','alpha']},'max-block-size':{'values':['none']},'max-height':{'values':['none']},'max-inline-size':{'values':['none']},'max-width':{'values':['none']},'mix-blend-mode':{'values':['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']},'object-fit':{'values':['fill','contain','cover','none','scale-down']},'offset-anchor':{'values':['auto']},'offset-path':{'values':['none']},'offset-position':{'values':['auto']},'offset-rotate':{'values':['auto','reverse']},'origin-trial-test-property':{'values':['normal','none']},'outline-color':{'values':['currentcolor']},'outline-style':{'values':['none','hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'outline-width':{'values':['thin','medium','thick']},'overflow-anchor':{'values':['visible','none','auto']},'overflow-wrap':{'values':['normal','break-word','anywhere']},'overflow-x':{'values':['visible','hidden','scroll','auto','overlay']},'overflow-y':{'values':['visible','hidden','scroll','auto','overlay']},'overscroll-behavior-x':{'values':['auto','contain','none']},'overscroll-behavior-y':{'values':['auto','contain','none']},'paint-order':{'values':['normal','fill','stroke','markers']},'perspective':{'values':['none']},'pointer-events':{'values':['none','auto','stroke','fill','painted','visible','visiblestroke','visiblefill','visiblepainted','bounding-box','all']},'position':{'values':['static','relative','absolute','fixed','sticky']},'quotes':{'values':['none']},'resize':{'values':['none','both','horizontal','vertical','block','inline']},'right':{'values':['auto']},'row-gap':{'values':['normal']},'rx':{'values':['auto']},'ry':{'values':['auto']},'scroll-behavior':{'values':['auto','smooth']},'scroll-padding-block-end':{'values':['auto']},'scroll-padding-block-start':{'values':['auto']},'scroll-padding-bottom':{'values':['auto']},'scroll-padding-inline-end':{'values':['auto']},'scroll-padding-inline-start':{'values':['auto']},'scroll-padding-left':{'values':['auto']},'scroll-padding-right':{'values':['auto']},'scroll-padding-top':{'values':['auto']},'scroll-snap-align':{'values':['none','start','end','center']},'scroll-snap-stop':{'values':['normal','always']},'scroll-snap-type':{'values':['none','x','y','block','inline','both','mandatory','proximity']},'shape-margin':{'values':['none']},'shape-outside':{'values':['none']},'shape-rendering':{'values':['auto','optimizespeed','crispedges','geometricprecision']},'speak':{'values':['none','normal','spell-out','digits','literal-punctuation','no-punctuation']},'stop-color':{'values':['currentcolor']},'stroke-dasharray':{'values':['none']},'stroke-linecap':{'values':['butt','round','square']},'stroke-linejoin':{'values':['miter','bevel','round']},'subtree-visibility':{'values':['visible','auto','hidden','hidden-matchable']},'table-layout':{'values':['auto','fixed']},'text-align':{'values':['left','right','center','justify','-webkit-left','-webkit-right','-webkit-center','start','end']},'text-align-last':{'values':['auto','start','end','left','right','center','justify']},'text-anchor':{'values':['start','middle','end']},'text-combine-upright':{'values':['none','all']},'text-decoration-color':{'values':['currentcolor']},'text-decoration-line':{'values':['none','underline','overline','line-through','blink']},'text-decoration-skip-ink':{'values':['none','auto']},'text-decoration-style':{'values':['solid','double','dotted','dashed','wavy']},'text-justify':{'values':['auto','none','inter-word','distribute']},'text-orientation':{'values':['sideways','mixed','upright']},'text-overflow':{'values':['clip','ellipsis']},'text-rendering':{'values':['auto','optimizespeed','optimizelegibility','geometricprecision']},'text-shadow':{'values':['none']},'text-size-adjust':{'values':['none','auto']},'text-transform':{'values':['capitalize','uppercase','lowercase','none']},'text-underline-position':{'values':['auto','under','left','right']},'top':{'values':['auto']},'touch-action':{'values':['auto','none','pan-x','pan-left','pan-right','pan-y','pan-up','pan-down','pinch-zoom','manipulation']},'transform':{'values':['none']},'transform-box':{'values':['fill-box','view-box']},'transform-style':{'values':['flat','preserve-3d']},'transition-property':{'values':['none']},'transition-timing-function':{'values':['linear','ease','ease-in','ease-out','ease-in-out','jump-both','jump-end','jump-none','jump-start','step-start','step-end']},'unicode-bidi':{'values':['normal','embed','bidi-override','isolate','plaintext','isolate-override']},'user-select':{'values':['auto','none','text','all']},'vector-effect':{'values':['none','non-scaling-stroke']},'vertical-align':{'values':['baseline','sub','super','text-top','text-bottom','middle']},'visibility':{'values':['visible','hidden','collapse']},'white-space':{'values':['none','normal','pre','pre-wrap','pre-line','nowrap','-webkit-nowrap','break-spaces']},'width':{'values':['auto','fit-content','min-content','max-content']},'will-change':{'values':['auto']},'word-break':{'values':['normal','break-all','keep-all','break-word']},'word-spacing':{'values':['normal']},'writing-mode':{'values':['horizontal-tb','vertical-rl','vertical-lr']},'z-index':{'values':['auto']}};const generatedAliasesFor=new Map(Object.entries({'-epub-caption-side':'caption-side','-epub-text-combine':'-webkit-text-combine','-epub-text-emphasis':'-webkit-text-emphasis','-epub-text-emphasis-color':'-webkit-text-emphasis-color','-epub-text-emphasis-style':'-webkit-text-emphasis-style','-epub-text-orientation':'-webkit-text-orientation','-epub-text-transform':'text-transform','-epub-word-break':'word-break','-epub-writing-mode':'-webkit-writing-mode','-webkit-align-content':'align-content','-webkit-align-items':'align-items','-webkit-align-self':'align-self','-webkit-animation':'animation','-webkit-animation-delay':'animation-delay','-webkit-animation-direction':'animation-direction','-webkit-animation-duration':'animation-duration','-webkit-animation-fill-mode':'animation-fill-mode','-webkit-animation-iteration-count':'animation-iteration-count','-webkit-animation-name':'animation-name','-webkit-animation-play-state':'animation-play-state','-webkit-animation-timing-function':'animation-timing-function','-webkit-backface-visibility':'backface-visibility','-webkit-background-clip':'background-clip','-webkit-background-origin':'background-origin','-webkit-background-size':'background-size','-webkit-border-after':'border-block-end','-webkit-border-after-color':'border-block-end-color','-webkit-border-after-style':'border-block-end-style','-webkit-border-after-width':'border-block-end-width','-webkit-border-before':'border-block-start','-webkit-border-before-color':'border-block-start-color','-webkit-border-before-style':'border-block-start-style','-webkit-border-before-width':'border-block-start-width','-webkit-border-bottom-left-radius':'border-bottom-left-radius','-webkit-border-bottom-right-radius':'border-bottom-right-radius','-webkit-border-end':'border-inline-end','-webkit-border-end-color':'border-inline-end-color','-webkit-border-end-style':'border-inline-end-style','-webkit-border-end-width':'border-inline-end-width','-webkit-border-radius':'border-radius','-webkit-border-start':'border-inline-start','-webkit-border-start-color':'border-inline-start-color','-webkit-border-start-style':'border-inline-start-style','-webkit-border-start-width':'border-inline-start-width','-webkit-border-top-left-radius':'border-top-left-radius','-webkit-border-top-right-radius':'border-top-right-radius','-webkit-box-shadow':'box-shadow','-webkit-box-sizing':'box-sizing','-webkit-clip-path':'clip-path','-webkit-column-count':'column-count','-webkit-column-gap':'column-gap','-webkit-column-rule':'column-rule','-webkit-column-rule-color':'column-rule-color','-webkit-column-rule-style':'column-rule-style','-webkit-column-rule-width':'column-rule-width','-webkit-column-span':'column-span','-webkit-column-width':'column-width','-webkit-columns':'columns','-webkit-filter':'filter','-webkit-flex':'flex','-webkit-flex-basis':'flex-basis','-webkit-flex-direction':'flex-direction','-webkit-flex-flow':'flex-flow','-webkit-flex-grow':'flex-grow','-webkit-flex-shrink':'flex-shrink','-webkit-flex-wrap':'flex-wrap','-webkit-font-feature-settings':'font-feature-settings','-webkit-justify-content':'justify-content','-webkit-logical-height':'block-size','-webkit-logical-width':'inline-size','-webkit-margin-after':'margin-block-end','-webkit-margin-before':'margin-block-start','-webkit-margin-end':'margin-inline-end','-webkit-margin-start':'margin-inline-start','-webkit-max-logical-height':'max-block-size','-webkit-max-logical-width':'max-inline-size','-webkit-min-logical-height':'min-block-size','-webkit-min-logical-width':'min-inline-size','-webkit-opacity':'opacity','-webkit-order':'order','-webkit-padding-after':'padding-block-end','-webkit-padding-before':'padding-block-start','-webkit-padding-end':'padding-inline-end','-webkit-padding-start':'padding-inline-start','-webkit-perspective':'perspective','-webkit-perspective-origin':'perspective-origin','-webkit-shape-image-threshold':'shape-image-threshold','-webkit-shape-margin':'shape-margin','-webkit-shape-outside':'shape-outside','-webkit-text-size-adjust':'text-size-adjust','-webkit-transform':'transform','-webkit-transform-origin':'transform-origin','-webkit-transform-style':'transform-style','-webkit-transition':'transition','-webkit-transition-delay':'transition-delay','-webkit-transition-duration':'transition-duration','-webkit-transition-property':'transition-property','-webkit-transition-timing-function':'transition-timing-function','-webkit-user-select':'user-select','word-wrap':'overflow-wrap'}));class CSSMetadata{constructor(properties,aliasesFor){this._values=([]);this._longhands=new Map();this._shorthands=new Map();this._inherited=new Set();this._svgProperties=new Set();this._propertyValues=new Map();this._aliasesFor=aliasesFor;for(let i=0;i<properties.length;++i){const property=properties[i];const propertyName=property.name;if(!CSS.supports(propertyName,'initial')){continue;}
this._values.push(propertyName);if(property.inherited){this._inherited.add(propertyName);}
if(property.svg){this._svgProperties.add(propertyName);}
const longhands=properties[i].longhands;if(longhands){this._longhands.set(propertyName,longhands);for(let j=0;j<longhands.length;++j){const longhandName=longhands[j];let shorthands=this._shorthands.get(longhandName);if(!shorthands){shorthands=[];this._shorthands.set(longhandName,shorthands);}
shorthands.push(propertyName);}}}
this._values.sort(CSSMetadata._sortPrefixesToEnd);this._valuesSet=new Set(this._values);const propertyValueSets=new Map();for(const[propertyName,basisValueObj]of Object.entries(generatedPropertyValues)){propertyValueSets.set(propertyName,new Set(basisValueObj.values));}
for(const[propertyName,extraValueObj]of Object.entries(_extraPropertyValues)){if(propertyValueSets.has(propertyName)){propertyValueSets.get(propertyName).addAll(extraValueObj.values);}else{propertyValueSets.set(propertyName,new Set(extraValueObj.values));}}
for(const[propertyName,values]of propertyValueSets){for(const commonKeyword of CommonKeywords){if(!values.has(commonKeyword)&&CSS.supports(propertyName,commonKeyword)){values.add(commonKeyword);}}
this._propertyValues.set(propertyName,[...values]);}
this._nameValuePresets=[];this._nameValuePresetsIncludingSVG=[];for(const name of this._valuesSet){const values=this._specificPropertyValues(name).filter(value=>CSS.supports(name,value)).sort(CSSMetadata._sortPrefixesToEnd);const presets=values.map(value=>`${name}: ${value}`);if(!this.isSVGProperty(name)){this._nameValuePresets.push(...presets);}
this._nameValuePresetsIncludingSVG.push(...presets);}}
static _sortPrefixesToEnd(a,b){const aIsPrefixed=a.startsWith('-webkit-');const bIsPrefixed=b.startsWith('-webkit-');if(aIsPrefixed&&!bIsPrefixed){return 1;}
if(!aIsPrefixed&&bIsPrefixed){return-1;}
return a<b?-1:(a>b?1:0);}
allProperties(){return this._values;}
nameValuePresets(includeSVG){return includeSVG?this._nameValuePresetsIncludingSVG:this._nameValuePresets;}
isSVGProperty(name){name=name.toLowerCase();return this._svgProperties.has(name);}
longhands(shorthand){return this._longhands.get(shorthand)||null;}
shorthands(longhand){return this._shorthands.get(longhand)||null;}
isColorAwareProperty(propertyName){return!!_colorAwareProperties.has(propertyName.toLowerCase())||this.isCustomProperty(propertyName.toLowerCase());}
isGridAreaDefiningProperty(propertyName){propertyName=propertyName.toLowerCase();return propertyName==='grid'||propertyName==='grid-template'||propertyName==='grid-template-areas';}
isLengthProperty(propertyName){propertyName=propertyName.toLowerCase();if(propertyName==='line-height'){return false;}
return _distanceProperties.has(propertyName)||propertyName.startsWith('margin')||propertyName.startsWith('padding')||propertyName.indexOf('width')!==-1||propertyName.indexOf('height')!==-1;}
isBezierAwareProperty(propertyName){propertyName=propertyName.toLowerCase();return!!_bezierAwareProperties.has(propertyName)||this.isCustomProperty(propertyName);}
isCustomProperty(propertyName){return propertyName.startsWith('--');}
isShadowProperty(propertyName){propertyName=propertyName.toLowerCase();return propertyName==='box-shadow'||propertyName==='text-shadow'||propertyName==='-webkit-box-shadow';}
isStringProperty(propertyName){propertyName=propertyName.toLowerCase();return propertyName==='content';}
canonicalPropertyName(name){if(this.isCustomProperty(name)){return name;}
name=name.toLowerCase();const aliasFor=this._aliasesFor.get(name);if(aliasFor){return aliasFor;}
if(!name||name.length<9||name.charAt(0)!=='-'){return name;}
const match=name.match(/(?:-webkit-)(.+)/);if(!match||!this._valuesSet.has(match[1])){return name;}
return match[1];}
isCSSPropertyName(propertyName){propertyName=propertyName.toLowerCase();if(propertyName.startsWith('-moz-')||propertyName.startsWith('-o-')||propertyName.startsWith('-webkit-')||propertyName.startsWith('-ms-')){return true;}
return this._valuesSet.has(propertyName);}
isPropertyInherited(propertyName){propertyName=propertyName.toLowerCase();return propertyName.startsWith('--')||this._inherited.has(this.canonicalPropertyName(propertyName))||this._inherited.has(propertyName);}
_specificPropertyValues(propertyName){const unprefixedName=propertyName.replace(/^-webkit-/,'');const propertyValues=this._propertyValues;let keywords=propertyValues.get(propertyName)||propertyValues.get(unprefixedName);if(!keywords){keywords=[];for(const commonKeyword of CommonKeywords){if(CSS.supports(propertyName,commonKeyword)){keywords.push(commonKeyword);}}
propertyValues.set(propertyName,keywords);}
return keywords;}
propertyValues(propertyName){const acceptedKeywords=['inherit','initial','unset'];propertyName=propertyName.toLowerCase();acceptedKeywords.push(...this._specificPropertyValues(propertyName));if(this.isColorAwareProperty(propertyName)){acceptedKeywords.push('currentColor');for(const color in Color.Nicknames){acceptedKeywords.push(color);}}
return acceptedKeywords.sort(CSSMetadata._sortPrefixesToEnd);}
propertyUsageWeight(property){return Weight[property]||Weight[this.canonicalPropertyName(property)]||0;}
getValuePreset(key,value){const values=_valuePresets.get(key);let text=values?values.get(value):null;if(!text){return null;}
let startColumn=text.length;let endColumn=text.length;if(text){startColumn=text.indexOf('|');endColumn=text.lastIndexOf('|');endColumn=startColumn===endColumn?endColumn:endColumn-1;text=text.replace(/\|/g,'');}
return{text,startColumn,endColumn};}}
const VariableRegex=/(var\(--.*?\))/g;const URLRegex=/url\(\s*('.+?'|".+?"|[^)]+)\s*\)/g;const GridAreaRowRegex=/((?:\[[\w\- ]+\]\s*)*(?:"[^"]+"|'[^']+'))[^'"\[]*\[?[^'"\[]*/;function cssMetadata(){if(!CSSMetadata._instance){CSSMetadata._instance=new CSSMetadata(generatedProperties,generatedAliasesFor);}
return CSSMetadata._instance;}
const _imageValuePresetMap=new Map([['linear-gradient','linear-gradient(|45deg, black, transparent|)'],['radial-gradient','radial-gradient(|black, transparent|)'],['repeating-linear-gradient','repeating-linear-gradient(|45deg, black, transparent 100px|)'],['repeating-radial-gradient','repeating-radial-gradient(|black, transparent 100px|)'],['url','url(||)'],]);const _valuePresets=new Map([['filter',new Map([['blur','blur(|1px|)'],['brightness','brightness(|0.5|)'],['contrast','contrast(|0.5|)'],['drop-shadow','drop-shadow(|2px 4px 6px black|)'],['grayscale','grayscale(|1|)'],['hue-rotate','hue-rotate(|45deg|)'],['invert','invert(|1|)'],['opacity','opacity(|0.5|)'],['saturate','saturate(|0.5|)'],['sepia','sepia(|1|)'],['url','url(||)'],])],['background',_imageValuePresetMap],['background-image',_imageValuePresetMap],['-webkit-mask-image',_imageValuePresetMap],['transform',new Map([['scale','scale(|1.5|)'],['scaleX','scaleX(|1.5|)'],['scaleY','scaleY(|1.5|)'],['scale3d','scale3d(|1.5, 1.5, 1.5|)'],['rotate','rotate(|45deg|)'],['rotateX','rotateX(|45deg|)'],['rotateY','rotateY(|45deg|)'],['rotateZ','rotateZ(|45deg|)'],['rotate3d','rotate3d(|1, 1, 1, 45deg|)'],['skew','skew(|10deg, 10deg|)'],['skewX','skewX(|10deg|)'],['skewY','skewY(|10deg|)'],['translate','translate(|10px, 10px|)'],['translateX','translateX(|10px|)'],['translateY','translateY(|10px|)'],['translateZ','translateZ(|10px|)'],['translate3d','translate3d(|10px, 10px, 10px|)'],['matrix','matrix(|1, 0, 0, 1, 0, 0|)'],['matrix3d','matrix3d(|1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1|)'],['perspective','perspective(|10px|)']])]]);const _distanceProperties=new Set(['background-position','border-spacing','bottom','font-size','height','left','letter-spacing','max-height','max-width','min-height','min-width','right','text-indent','top','width','word-spacing','grid-row-gap','grid-column-gap','row-gap']);const _bezierAwareProperties=new Set(['animation','animation-timing-function','transition','transition-timing-function','-webkit-animation','-webkit-animation-timing-function','-webkit-transition','-webkit-transition-timing-function']);const _colorAwareProperties=new Set(['backdrop-filter','background','background-color','background-image','border','border-color','border-image','border-image-source','border-bottom','border-bottom-color','border-left','border-left-color','border-right','border-right-color','border-top','border-top-color','box-shadow','caret-color','color','column-rule','column-rule-color','fill','list-style-image','outline','outline-color','stroke','text-decoration-color','text-shadow','-webkit-border-after','-webkit-border-after-color','-webkit-border-before','-webkit-border-before-color','-webkit-border-end','-webkit-border-end-color','-webkit-border-start','-webkit-border-start-color','-webkit-box-reflect','-webkit-box-shadow','-webkit-column-rule-color','-webkit-filter','-webkit-mask','-webkit-mask-box-image','-webkit-mask-box-image-source','-webkit-mask-image','-webkit-tap-highlight-color','-webkit-text-decoration-color','-webkit-text-emphasis','-webkit-text-emphasis-color','-webkit-text-fill-color','-webkit-text-stroke','-webkit-text-stroke-color']);const _extraPropertyValues={'background-repeat':{values:['repeat','repeat-x','repeat-y','no-repeat','space','round']},'content':{values:['normal','close-quote','no-close-quote','no-open-quote','open-quote']},'baseline-shift':{values:['baseline']},'max-height':{values:['min-content','max-content','-webkit-fill-available','fit-content']},'box-shadow':{values:['inset']},'-webkit-writing-mode':{values:['horizontal-tb','vertical-rl','vertical-lr']},'writing-mode':{values:['lr','rl','tb','lr-tb','rl-tb','tb-rl']},'page-break-inside':{values:['avoid']},'cursor':{values:['-webkit-zoom-in','-webkit-zoom-out','-webkit-grab','-webkit-grabbing']},'border-width':{values:['medium','thick','thin']},'border-style':{values:['hidden','inset','groove','ridge','outset','dotted','dashed','solid','double']},'size':{values:['a3','a4','a5','b4','b5','landscape','ledger','legal','letter','portrait']},'overflow':{values:['hidden','visible','overlay','scroll']},'overscroll-behavior':{values:['contain']},'text-rendering':{values:['optimizeSpeed','optimizeLegibility','geometricPrecision']},'text-align':{values:['-webkit-auto','-webkit-match-parent']},'color-interpolation':{values:['sRGB','linearRGB']},'word-wrap':{values:['normal','break-word']},'font-weight':{values:['100','200','300','400','500','600','700','800','900']},'-webkit-text-emphasis':{values:['circle','filled','open','dot','double-circle','triangle','sesame']},'color-rendering':{values:['optimizeSpeed','optimizeQuality']},'-webkit-text-combine':{values:['horizontal']},'text-orientation':{values:['sideways-right']},'outline':{values:['inset','groove','ridge','outset','dotted','dashed','solid','double','medium','thick','thin']},'font':{values:['caption','icon','menu','message-box','small-caption','-webkit-mini-control','-webkit-small-control','-webkit-control','status-bar']},'dominant-baseline':{values:['text-before-edge','text-after-edge','use-script','no-change','reset-size']},'-webkit-text-emphasis-position':{values:['over','under']},'alignment-baseline':{values:['before-edge','after-edge','text-before-edge','text-after-edge','hanging']},'page-break-before':{values:['left','right','always','avoid']},'border-image':{values:['repeat','stretch','space','round']},'text-decoration':{values:['blink','line-through','overline','underline','wavy','double','solid','dashed','dotted']},'font-family':{values:['serif','sans-serif','cursive','fantasy','monospace','-webkit-body','-webkit-pictograph']},'zoom':{values:['normal']},'max-width':{values:['min-content','max-content','-webkit-fill-available','fit-content']},'-webkit-font-smoothing':{values:['antialiased','subpixel-antialiased']},'border':{values:['hidden','inset','groove','ridge','outset','dotted','dashed','solid','double','medium','thick','thin']},'font-variant':{values:['small-caps','normal','common-ligatures','no-common-ligatures','discretionary-ligatures','no-discretionary-ligatures','historical-ligatures','no-historical-ligatures','contextual','no-contextual','all-small-caps','petite-caps','all-petite-caps','unicase','titling-caps','lining-nums','oldstyle-nums','proportional-nums','tabular-nums','diagonal-fractions','stacked-fractions','ordinal','slashed-zero','jis78','jis83','jis90','jis04','simplified','traditional','full-width','proportional-width','ruby']},'vertical-align':{values:['top','bottom','-webkit-baseline-middle']},'page-break-after':{values:['left','right','always','avoid']},'-webkit-text-emphasis-style':{values:['circle','filled','open','dot','double-circle','triangle','sesame']},'transform':{values:['scale','scaleX','scaleY','scale3d','rotate','rotateX','rotateY','rotateZ','rotate3d','skew','skewX','skewY','translate','translateX','translateY','translateZ','translate3d','matrix','matrix3d','perspective']},'align-content':{values:['normal','baseline','space-between','space-around','space-evenly','stretch','center','start','end','flex-start','flex-end']},'justify-content':{values:['normal','space-between','space-around','space-evenly','stretch','center','start','end','flex-start','flex-end','left','right']},'place-content':{values:['normal','space-between','space-around','space-evenly','stretch','center','start','end','flex-start','flex-end','baseline']},'align-items':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end']},'justify-items':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end','left','right','legacy']},'place-items':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end']},'align-self':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end']},'justify-self':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end','left','right']},'place-self':{values:['normal','stretch','baseline','center','start','end','self-start','self-end','flex-start','flex-end']},'perspective-origin':{values:['left','center','right','top','bottom']},'transform-origin':{values:['left','center','right','top','bottom']},'transition-timing-function':{values:['cubic-bezier','steps']},'animation-timing-function':{values:['cubic-bezier','steps']},'-webkit-backface-visibility':{values:['visible','hidden']},'-webkit-column-break-after':{values:['always','avoid']},'-webkit-column-break-before':{values:['always','avoid']},'-webkit-column-break-inside':{values:['avoid']},'-webkit-column-span':{values:['all']},'-webkit-column-gap':{values:['normal']},'filter':{values:['url','blur','brightness','contrast','drop-shadow','grayscale','hue-rotate','invert','opacity','saturate','sepia']},'mix-blend-mode':{values:['unset']},'background-blend-mode':{values:['unset']},'grid-template-columns':{values:['min-content','max-content']},'grid-template-rows':{values:['min-content','max-content']},'grid-auto-flow':{values:['dense']},'background':{values:['repeat','repeat-x','repeat-y','no-repeat','top','bottom','left','right','center','fixed','local','scroll','space','round','border-box','content-box','padding-box','linear-gradient','radial-gradient','repeating-linear-gradient','repeating-radial-gradient','url']},'background-image':{values:['linear-gradient','radial-gradient','repeating-linear-gradient','repeating-radial-gradient','url']},'background-position':{values:['top','bottom','left','right','center']},'background-position-x':{values:['left','right','center']},'background-position-y':{values:['top','bottom','center']},'background-repeat-x':{values:['repeat','no-repeat']},'background-repeat-y':{values:['repeat','no-repeat']},'border-bottom':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'border-left':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'border-right':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'border-top':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'buffered-rendering':{values:['static','dynamic']},'color-interpolation-filters':{values:['srgb','linearrgb']},'column-rule':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'flex-flow':{values:['nowrap','row','row-reverse','column','column-reverse','wrap','wrap-reverse']},'height':{values:['-webkit-fill-available']},'inline-size':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'list-style':{values:['outside','inside','disc','circle','square','decimal','decimal-leading-zero','arabic-indic','bengali','cambodian','khmer','devanagari','gujarati','gurmukhi','kannada','lao','malayalam','mongolian','myanmar','oriya','persian','urdu','telugu','tibetan','thai','lower-roman','upper-roman','lower-greek','lower-alpha','lower-latin','upper-alpha','upper-latin','cjk-earthly-branch','cjk-heavenly-stem','ethiopic-halehame','ethiopic-halehame-am','ethiopic-halehame-ti-er','ethiopic-halehame-ti-et','hangul','hangul-consonant','korean-hangul-formal','korean-hanja-formal','korean-hanja-informal','hebrew','armenian','lower-armenian','upper-armenian','georgian','cjk-ideographic','simp-chinese-formal','simp-chinese-informal','trad-chinese-formal','trad-chinese-informal','hiragana','katakana','hiragana-iroha','katakana-iroha']},'max-block-size':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'max-inline-size':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'min-block-size':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'min-height':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'min-inline-size':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'min-width':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'object-position':{values:['top','bottom','left','right','center']},'shape-outside':{values:['border-box','content-box','padding-box','margin-box']},'-webkit-appearance':{values:['checkbox','radio','push-button','square-button','button','inner-spin-button','listbox','media-slider','media-sliderthumb','media-volume-slider','media-volume-sliderthumb','menulist','menulist-button','meter','progress-bar','slider-horizontal','slider-vertical','sliderthumb-horizontal','sliderthumb-vertical','searchfield','searchfield-cancel-button','textfield','textarea']},'-webkit-border-after':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'-webkit-border-after-style':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'-webkit-border-after-width':{values:['medium','thick','thin']},'-webkit-border-before':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'-webkit-border-before-style':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'-webkit-border-before-width':{values:['medium','thick','thin']},'-webkit-border-end':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'-webkit-border-end-style':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'-webkit-border-end-width':{values:['medium','thick','thin']},'-webkit-border-start':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double','medium','thick','thin']},'-webkit-border-start-style':{values:['hidden','inset','groove','outset','ridge','dotted','dashed','solid','double']},'-webkit-border-start-width':{values:['medium','thick','thin']},'-webkit-logical-height':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-logical-width':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-margin-collapse':{values:['collapse','separate','discard']},'-webkit-mask-box-image':{values:['repeat','stretch','space','round']},'-webkit-mask-box-image-repeat':{values:['repeat','stretch','space','round']},'-webkit-mask-clip':{values:['text','border','border-box','content','content-box','padding','padding-box']},'-webkit-mask-composite':{values:['clear','copy','source-over','source-in','source-out','source-atop','destination-over','destination-in','destination-out','destination-atop','xor','plus-lighter']},'-webkit-mask-image':{values:['linear-gradient','radial-gradient','repeating-linear-gradient','repeating-radial-gradient','url']},'-webkit-mask-origin':{values:['border','border-box','content','content-box','padding','padding-box']},'-webkit-mask-position':{values:['top','bottom','left','right','center']},'-webkit-mask-position-x':{values:['left','right','center']},'-webkit-mask-position-y':{values:['top','bottom','center']},'-webkit-mask-repeat':{values:['repeat','repeat-x','repeat-y','no-repeat','space','round']},'-webkit-mask-size':{values:['contain','cover']},'-webkit-max-logical-height':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-max-logical-width':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-min-logical-height':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-min-logical-width':{values:['-webkit-fill-available','min-content','max-content','fit-content']},'-webkit-perspective-origin-x':{values:['left','right','center']},'-webkit-perspective-origin-y':{values:['top','bottom','center']},'-webkit-text-decorations-in-effect':{values:['blink','line-through','overline','underline']},'-webkit-text-stroke':{values:['medium','thick','thin']},'-webkit-text-stroke-width':{values:['medium','thick','thin']},'-webkit-transform-origin-x':{values:['left','right','center']},'-webkit-transform-origin-y':{values:['top','bottom','center']},'width':{values:['-webkit-fill-available']}};const Weight={'align-content':57,'align-items':129,'align-self':55,'animation':175,'animation-delay':114,'animation-direction':113,'animation-duration':137,'animation-fill-mode':132,'animation-iteration-count':124,'animation-name':139,'animation-play-state':104,'animation-timing-function':141,'backface-visibility':123,'background':260,'background-attachment':119,'background-clip':165,'background-color':259,'background-image':246,'background-origin':107,'background-position':237,'background-position-x':108,'background-position-y':93,'background-repeat':234,'background-size':203,'border':263,'border-bottom':233,'border-bottom-color':190,'border-bottom-left-radius':186,'border-bottom-right-radius':185,'border-bottom-style':150,'border-bottom-width':179,'border-collapse':209,'border-color':226,'border-image':89,'border-image-outset':50,'border-image-repeat':49,'border-image-slice':58,'border-image-source':32,'border-image-width':52,'border-left':221,'border-left-color':174,'border-left-style':142,'border-left-width':172,'border-radius':224,'border-right':223,'border-right-color':182,'border-right-style':130,'border-right-width':178,'border-spacing':198,'border-style':206,'border-top':231,'border-top-color':192,'border-top-left-radius':187,'border-top-right-radius':189,'border-top-style':152,'border-top-width':180,'border-width':214,'bottom':227,'box-shadow':213,'box-sizing':216,'caption-side':96,'clear':229,'clip':173,'clip-rule':5,'color':256,'content':219,'counter-increment':111,'counter-reset':110,'cursor':250,'direction':176,'display':262,'empty-cells':99,'fill':140,'fill-opacity':82,'fill-rule':22,'filter':160,'flex':133,'flex-basis':66,'flex-direction':85,'flex-flow':94,'flex-grow':112,'flex-shrink':61,'flex-wrap':68,'float':252,'font':211,'font-family':254,'font-kerning':18,'font-size':264,'font-stretch':77,'font-style':220,'font-variant':161,'font-weight':257,'height':266,'image-rendering':90,'justify-content':127,'left':248,'letter-spacing':188,'line-height':244,'list-style':215,'list-style-image':145,'list-style-position':149,'list-style-type':199,'margin':267,'margin-bottom':241,'margin-left':243,'margin-right':238,'margin-top':253,'mask':20,'max-height':205,'max-width':225,'min-height':217,'min-width':218,'object-fit':33,'opacity':251,'order':117,'orphans':146,'outline':222,'outline-color':153,'outline-offset':147,'outline-style':151,'outline-width':148,'overflow':255,'overflow-wrap':105,'overflow-x':184,'overflow-y':196,'padding':265,'padding-bottom':230,'padding-left':235,'padding-right':232,'padding-top':240,'page':8,'page-break-after':120,'page-break-before':69,'page-break-inside':121,'perspective':92,'perspective-origin':103,'pointer-events':183,'position':261,'quotes':158,'resize':168,'right':245,'shape-rendering':38,'size':64,'speak':118,'src':170,'stop-color':42,'stop-opacity':31,'stroke':98,'stroke-dasharray':36,'stroke-dashoffset':3,'stroke-linecap':30,'stroke-linejoin':21,'stroke-miterlimit':12,'stroke-opacity':34,'stroke-width':87,'table-layout':171,'tab-size':46,'text-align':260,'text-anchor':35,'text-decoration':247,'text-indent':207,'text-overflow':204,'text-rendering':155,'text-shadow':208,'text-transform':202,'top':258,'touch-action':80,'transform':181,'transform-origin':162,'transform-style':86,'transition':193,'transition-delay':134,'transition-duration':135,'transition-property':131,'transition-timing-function':122,'unicode-bidi':156,'unicode-range':136,'vertical-align':236,'visibility':242,'-webkit-appearance':191,'-webkit-backface-visibility':154,'-webkit-background-clip':164,'-webkit-background-origin':40,'-webkit-background-size':163,'-webkit-border-end':9,'-webkit-border-horizontal-spacing':81,'-webkit-border-image':75,'-webkit-border-radius':212,'-webkit-border-start':10,'-webkit-border-start-color':16,'-webkit-border-start-width':13,'-webkit-border-vertical-spacing':43,'-webkit-box-align':101,'-webkit-box-direction':51,'-webkit-box-flex':128,'-webkit-box-ordinal-group':91,'-webkit-box-orient':144,'-webkit-box-pack':106,'-webkit-box-reflect':39,'-webkit-box-shadow':210,'-webkit-column-break-inside':60,'-webkit-column-count':84,'-webkit-column-gap':76,'-webkit-column-rule':25,'-webkit-column-rule-color':23,'-webkit-columns':44,'-webkit-column-span':29,'-webkit-column-width':47,'-webkit-filter':159,'-webkit-font-feature-settings':59,'-webkit-font-smoothing':177,'-webkit-highlight':1,'-webkit-line-break':45,'-webkit-line-clamp':126,'-webkit-margin-after':67,'-webkit-margin-before':70,'-webkit-margin-collapse':14,'-webkit-margin-end':65,'-webkit-margin-start':100,'-webkit-margin-top-collapse':78,'-webkit-mask':19,'-webkit-mask-box-image':72,'-webkit-mask-image':88,'-webkit-mask-position':54,'-webkit-mask-repeat':63,'-webkit-mask-size':79,'-webkit-padding-after':15,'-webkit-padding-before':28,'-webkit-padding-end':48,'-webkit-padding-start':73,'-webkit-print-color-adjust':83,'-webkit-rtl-ordering':7,'-webkit-tap-highlight-color':169,'-webkit-text-emphasis-color':11,'-webkit-text-fill-color':71,'-webkit-text-security':17,'-webkit-text-stroke':56,'-webkit-text-stroke-color':37,'-webkit-text-stroke-width':53,'-webkit-user-drag':95,'-webkit-user-modify':62,'-webkit-user-select':194,'-webkit-writing-mode':4,'white-space':228,'widows':115,'width':268,'will-change':74,'word-break':166,'word-spacing':157,'word-wrap':197,'writing-mode':41,'z-index':239,'zoom':200};const CommonKeywords=['auto','none'];let CSSPropertyDefinition;var CSSMetadata$1=Object.freeze({__proto__:null,CSSMetadata:CSSMetadata,VariableRegex:VariableRegex,URLRegex:URLRegex,GridAreaRowRegex:GridAreaRowRegex,cssMetadata:cssMetadata,CSSPropertyDefinition:CSSPropertyDefinition});class ProfileNode{constructor(callFrame){this.callFrame=callFrame;this.callUID=`${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;this.self=0;this.total=0;this.id=0;this.parent=null;this.children=[];}
get functionName(){return this.callFrame.functionName;}
get scriptId(){return this.callFrame.scriptId;}
get url(){return this.callFrame.url;}
get lineNumber(){return this.callFrame.lineNumber;}
get columnNumber(){return this.callFrame.columnNumber;}}
class ProfileTreeModel{constructor(target){this._target=target||null;}
initialize(root){this.root=root;this._assignDepthsAndParents();this.total=this._calculateTotals(this.root);}
_assignDepthsAndParents(){const root=this.root;root.depth=-1;root.parent=null;this.maxDepth=0;const nodesToTraverse=[root];while(nodesToTraverse.length){const parent=nodesToTraverse.pop();const depth=parent.depth+1;if(depth>this.maxDepth){this.maxDepth=depth;}
const children=parent.children;const length=children.length;for(let i=0;i<length;++i){const child=children[i];child.depth=depth;child.parent=parent;if(child.children.length){nodesToTraverse.push(child);}}}}
_calculateTotals(root){const nodesToTraverse=[root];const dfsList=[];while(nodesToTraverse.length){const node=nodesToTraverse.pop();node.total=node.self;dfsList.push(node);nodesToTraverse.push(...node.children);}
while(dfsList.length>1){const node=dfsList.pop();node.parent.total+=node.total;}
return root.total;}
target(){return this._target;}}
var ProfileTreeModel$1=Object.freeze({__proto__:null,ProfileNode:ProfileNode,ProfileTreeModel:ProfileTreeModel});class Cookie{constructor(name,value,type,priority){this._name=name;this._value=value;this._type=type;this._attributes={};this._size=0;this._priority=(priority||'Medium');this._cookieLine=null;}
static fromProtocolCookie(protocolCookie){const cookie=new Cookie(protocolCookie.name,protocolCookie.value,null,protocolCookie.priority);cookie.addAttribute('domain',protocolCookie['domain']);cookie.addAttribute('path',protocolCookie['path']);cookie.addAttribute('port',protocolCookie['port']);if(protocolCookie['expires']){cookie.addAttribute('expires',protocolCookie['expires']*1000);}
if(protocolCookie['httpOnly']){cookie.addAttribute('httpOnly');}
if(protocolCookie['secure']){cookie.addAttribute('secure');}
if(protocolCookie['sameSite']){cookie.addAttribute('sameSite',protocolCookie['sameSite']);}
cookie.setSize(protocolCookie['size']);return cookie;}
key(){return(this.domain()||'-')+' '+this.name()+' '+(this.path()||'-');}
name(){return this._name;}
value(){return this._value;}
type(){return this._type;}
httpOnly(){return'httponly'in this._attributes;}
secure(){return'secure'in this._attributes;}
sameSite(){return(this._attributes['samesite']);}
priority(){return this._priority;}
session(){return!('expires'in this._attributes||'max-age'in this._attributes);}
path(){return(this._attributes['path']);}
port(){return(this._attributes['port']);}
domain(){return(this._attributes['domain']);}
expires(){return(this._attributes['expires']);}
maxAge(){return(this._attributes['max-age']);}
size(){return this._size;}
url(){if(!this.domain()||!this.path()){return null;}
return(this.secure()?'https://':'http://')+this.domain()+this.path();}
setSize(size){this._size=size;}
expiresDate(requestDate){if(this.maxAge()){return new Date(requestDate.getTime()+1000*this.maxAge());}
if(this.expires()){return new Date(this.expires());}
return null;}
addAttribute(key,value){const normalizedKey=key.toLowerCase();switch(normalizedKey){case'priority':this._priority=(value);break;default:this._attributes[normalizedKey]=value;}}
setCookieLine(cookieLine){this._cookieLine=cookieLine;}
getCookieLine(){return this._cookieLine;}}
const Type$1={Request:0,Response:1};const Attributes={Name:'name',Value:'value',Size:'size',Domain:'domain',Path:'path',Expires:'expires',HttpOnly:'httpOnly',Secure:'secure',SameSite:'sameSite',Priority:'priority',};class CookieReference{constructor(name,domain,path,contextUrl){this._name=name;this._domain=domain;this._path=path;this._contextUrl=contextUrl;}
domain(){return this._domain;}
contextUrl(){return this._contextUrl;}}
var Cookie$1=Object.freeze({__proto__:null,Cookie:Cookie,Type:Type$1,Attributes:Attributes,CookieReference:CookieReference});class CookieParser{constructor(domain){if(domain){this._domain=domain.toLowerCase().replace(/^\./,'');}
this._cookies=[];this._input;this._originalInputLength=0;}
static parseCookie(header){return(new CookieParser()).parseCookie(header);}
static parseSetCookie(header,domain){return(new CookieParser(domain)).parseSetCookie(header);}
cookies(){return this._cookies;}
parseCookie(cookieHeader){if(!this._initialize(cookieHeader)){return null;}
for(let kv=this._extractKeyValue();kv;kv=this._extractKeyValue()){if(kv.key.charAt(0)==='$'&&this._lastCookie){this._lastCookie.addAttribute(kv.key.slice(1),kv.value);}else if(kv.key.toLowerCase()!=='$version'&&typeof kv.value==='string'){this._addCookie(kv,Type$1.Request);}
this._advanceAndCheckCookieDelimiter();}
this._flushCookie();return this._cookies;}
parseSetCookie(setCookieHeader){if(!this._initialize(setCookieHeader)){return null;}
for(let kv=this._extractKeyValue();kv;kv=this._extractKeyValue()){if(this._lastCookie){this._lastCookie.addAttribute(kv.key,kv.value);}else{this._addCookie(kv,Type$1.Response);}
if(this._advanceAndCheckCookieDelimiter()){this._flushCookie();}}
this._flushCookie();return this._cookies;}
_initialize(headerValue){this._input=headerValue;if(typeof headerValue!=='string'){return false;}
this._cookies=[];this._lastCookie=null;this._lastCookieLine='';this._originalInputLength=(this._input).length;return true;}
_flushCookie(){if(this._lastCookie){this._lastCookie.setSize(this._originalInputLength-(this._input).length-
(this._lastCookiePosition));this._lastCookie.setCookieLine((this._lastCookieLine).replace('\n',''));}
this._lastCookie=null;this._lastCookieLine='';}
_extractKeyValue(){if(!this._input||!this._input.length){return null;}
const keyValueMatch=/^[ \t]*([^\s=;]+)[ \t]*(?:=[ \t]*([^;\n]*))?/.exec(this._input);if(!keyValueMatch){console.error('Failed parsing cookie header before: '+this._input);return null;}
const result=new KeyValue(keyValueMatch[1],keyValueMatch[2]&&keyValueMatch[2].trim(),(this._originalInputLength)-this._input.length);this._lastCookieLine+=keyValueMatch[0];this._input=this._input.slice(keyValueMatch[0].length);return result;}
_advanceAndCheckCookieDelimiter(){if(!this._input){return false;}
const match=/^\s*[\n;]\s*/.exec(this._input);if(!match){return false;}
this._lastCookieLine+=match[0];this._input=this._input.slice(match[0].length);return match[0].match('\n')!==null;}
_addCookie(keyValue,type){if(this._lastCookie){this._lastCookie.setSize(keyValue.position-(this._lastCookiePosition));}
this._lastCookie=typeof keyValue.value==='string'?new Cookie(keyValue.key,keyValue.value,type):new Cookie('',keyValue.key,type);if(this._domain){this._lastCookie.addAttribute('domain',this._domain);}
this._lastCookiePosition=keyValue.position;this._cookies.push(this._lastCookie);}}
class KeyValue{constructor(key,value,position){this.key=key;this.value=value;this.position=position;}}
var CookieParser$1=Object.freeze({__proto__:null,CookieParser:CookieParser});class NetworkManager extends SDKModel{constructor(target){super(target);this._dispatcher=new NetworkDispatcher(this);this._networkAgent=target.networkAgent();target.registerNetworkDispatcher(this._dispatcher);if(Settings.Settings.instance().moduleSetting('cacheDisabled').get()){this._networkAgent.setCacheDisabled(true);}
this._networkAgent.enable(undefined,undefined,MAX_EAGER_POST_REQUEST_BODY_LENGTH);this._bypassServiceWorkerSetting=Settings.Settings.instance().createSetting('bypassServiceWorker',false);if(this._bypassServiceWorkerSetting.get()){this._bypassServiceWorkerChanged();}
this._bypassServiceWorkerSetting.addChangeListener(this._bypassServiceWorkerChanged,this);Settings.Settings.instance().moduleSetting('cacheDisabled').addChangeListener(this._cacheDisabledSettingChanged,this);}
static forRequest(request){return request[_networkManagerForRequestSymbol];}
static canReplayRequest(request){return!!request[_networkManagerForRequestSymbol]&&request.resourceType()===ResourceType.resourceTypes.XHR;}
static replayRequest(request){const manager=request[_networkManagerForRequestSymbol];if(!manager){return;}
manager._networkAgent.replayXHR(request.requestId());}
static async searchInRequest(request,query,caseSensitive,isRegex){const manager=NetworkManager.forRequest(request);if(!manager){return[];}
const response=await manager._networkAgent.invoke_searchInResponseBody({requestId:request.requestId(),query:query,caseSensitive:caseSensitive,isRegex:isRegex});return response.result||[];}
static async requestContentData(request){if(request.resourceType()===ResourceType.resourceTypes.WebSocket){return{error:'Content for WebSockets is currently not supported',content:null,encoded:false};}
if(!request.finished){await request.once(Events$2.FinishedLoading);}
const manager=NetworkManager.forRequest(request);if(!manager){return{error:'No network manager for request',content:null,encoded:false};}
const response=await manager._networkAgent.invoke_getResponseBody({requestId:request.requestId()});const error=response[InspectorBackend.ProtocolError]||null;return{error:error,content:error?null:response.body,encoded:response.base64Encoded};}
static requestPostData(request){const manager=NetworkManager.forRequest(request);if(manager){return manager._networkAgent.getRequestPostData(request.backendRequestId());}
console.error('No network manager for request');return(Promise.resolve(null));}
static _connectionType(conditions){if(!conditions.download&&!conditions.upload){return Protocol.Network.ConnectionType.None;}
let types=NetworkManager._connectionTypes;if(!types){NetworkManager._connectionTypes=[];types=NetworkManager._connectionTypes;types.push(['2g',Protocol.Network.ConnectionType.Cellular2g]);types.push(['3g',Protocol.Network.ConnectionType.Cellular3g]);types.push(['4g',Protocol.Network.ConnectionType.Cellular4g]);types.push(['bluetooth',Protocol.Network.ConnectionType.Bluetooth]);types.push(['wifi',Protocol.Network.ConnectionType.Wifi]);types.push(['wimax',Protocol.Network.ConnectionType.Wimax]);}
for(const type of types){if(conditions.title.toLowerCase().indexOf(type[0])!==-1){return type[1];}}
return Protocol.Network.ConnectionType.Other;}
static lowercaseHeaders(headers){const newHeaders={};for(const headerName in headers){newHeaders[headerName.toLowerCase()]=headers[headerName];}
return newHeaders;}
inflightRequestForURL(url){return this._dispatcher._inflightRequestsByURL[url];}
_cacheDisabledSettingChanged(event){const enabled=(event.data);this._networkAgent.setCacheDisabled(enabled);}
dispose(){Settings.Settings.instance().moduleSetting('cacheDisabled').removeChangeListener(this._cacheDisabledSettingChanged,this);}
_bypassServiceWorkerChanged(){this._networkAgent.setBypassServiceWorker(this._bypassServiceWorkerSetting.get());}}
const Events$1={RequestStarted:Symbol('RequestStarted'),RequestUpdated:Symbol('RequestUpdated'),RequestFinished:Symbol('RequestFinished'),RequestUpdateDropped:Symbol('RequestUpdateDropped'),ResponseReceived:Symbol('ResponseReceived'),MessageGenerated:Symbol('MessageGenerated'),RequestRedirected:Symbol('RequestRedirected'),LoadingFinished:Symbol('LoadingFinished'),};const _MIMETypes={'text/html':{'document':true},'text/xml':{'document':true},'text/plain':{'document':true},'application/xhtml+xml':{'document':true},'image/svg+xml':{'document':true},'text/css':{'stylesheet':true},'text/xsl':{'stylesheet':true},'text/vtt':{'texttrack':true},'application/pdf':{'document':true},};const NoThrottlingConditions={title:UIString.UIString('Online'),download:-1,upload:-1,latency:0};const OfflineConditions={title:UIString.UIString('Offline'),download:0,upload:0,latency:0,};const Slow3GConditions={title:UIString.UIString('Slow 3G'),download:500*1024/8*.8,upload:500*1024/8*.8,latency:400*5,};const Fast3GConditions={title:UIString.UIString('Fast 3G'),download:1.6*1024*1024/8*.9,upload:750*1024/8*.9,latency:150*3.75,};const _networkManagerForRequestSymbol=Symbol('NetworkManager');const MAX_EAGER_POST_REQUEST_BODY_LENGTH=64*1024;class NetworkDispatcher{constructor(manager){this._manager=manager;this._inflightRequestsById={};this._inflightRequestsByURL={};this._requestIdToRedirectExtraInfoBuilder=new Map();}
_headersMapToHeadersArray(headersMap){const result=[];for(const name in headersMap){const values=headersMap[name].split('\n');for(let i=0;i<values.length;++i){result.push({name:name,value:values[i]});}}
return result;}
_updateNetworkRequestWithRequest(networkRequest,request){networkRequest.requestMethod=request.method;networkRequest.setRequestHeaders(this._headersMapToHeadersArray(request.headers));networkRequest.setRequestFormData(!!request.hasPostData,request.postData||null);networkRequest.setInitialPriority(request.initialPriority);networkRequest.mixedContentType=request.mixedContentType||Protocol.Security.MixedContentType.None;networkRequest.setReferrerPolicy(request.referrerPolicy);}
_updateNetworkRequestWithResponse(networkRequest,response){if(response.url&&networkRequest.url()!==response.url){networkRequest.setUrl(response.url);}
networkRequest.mimeType=response.mimeType;networkRequest.statusCode=response.status;networkRequest.statusText=response.statusText;if(!networkRequest.hasExtraResponseInfo()){networkRequest.responseHeaders=this._headersMapToHeadersArray(response.headers);}
if(response.encodedDataLength>=0){networkRequest.setTransferSize(response.encodedDataLength);}
if(response.requestHeaders&&!networkRequest.hasExtraRequestInfo()){networkRequest.setRequestHeaders(this._headersMapToHeadersArray(response.requestHeaders));networkRequest.setRequestHeadersText(response.requestHeadersText||'');}
networkRequest.connectionReused=response.connectionReused;networkRequest.connectionId=String(response.connectionId);if(response.remoteIPAddress){networkRequest.setRemoteAddress(response.remoteIPAddress,response.remotePort||-1);}
if(response.fromServiceWorker){networkRequest.fetchedViaServiceWorker=true;}
if(response.fromDiskCache){networkRequest.setFromDiskCache();}
if(response.fromPrefetchCache){networkRequest.setFromPrefetchCache();}
networkRequest.timing=response.timing;networkRequest.protocol=response.protocol||'';networkRequest.setSecurityState(response.securityState);if(!this._mimeTypeIsConsistentWithType(networkRequest)){const message=UIString.UIString('Resource interpreted as %s but transferred with MIME type %s: "%s".',networkRequest.resourceType().title(),networkRequest.mimeType,networkRequest.url());this._manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:networkRequest.requestId(),warning:true});}
if(response.securityDetails){networkRequest.setSecurityDetails(response.securityDetails);}}
_mimeTypeIsConsistentWithType(networkRequest){if(networkRequest.hasErrorStatusCode()||networkRequest.statusCode===304||networkRequest.statusCode===204){return true;}
const resourceType=networkRequest.resourceType();if(resourceType!==ResourceType.resourceTypes.Stylesheet&&resourceType!==ResourceType.resourceTypes.Document&&resourceType!==ResourceType.resourceTypes.TextTrack){return true;}
if(!networkRequest.mimeType){return true;}
if(networkRequest.mimeType in _MIMETypes){return resourceType.name()in _MIMETypes[networkRequest.mimeType];}
return false;}
resourceChangedPriority(requestId,newPriority,timestamp){const networkRequest=this._inflightRequestsById[requestId];if(networkRequest){networkRequest.setPriority(newPriority);}}
signedExchangeReceived(requestId,info){let networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){networkRequest=this._inflightRequestsByURL[info.outerResponse.url];if(!networkRequest){return;}}
networkRequest.setSignedExchangeInfo(info);networkRequest.setResourceType(ResourceType.resourceTypes.SignedExchange);this._updateNetworkRequestWithResponse(networkRequest,info.outerResponse);this._updateNetworkRequest(networkRequest);this._manager.dispatchEventToListeners(Events$1.ResponseReceived,networkRequest);}
requestWillBeSent(requestId,loaderId,documentURL,request,time,wallTime,initiator,redirectResponse,resourceType,frameId){let networkRequest=this._inflightRequestsById[requestId];if(networkRequest){if(!redirectResponse){return;}
if(!networkRequest.signedExchangeInfo()){this.responseReceived(requestId,loaderId,time,Protocol.Network.ResourceType.Other,redirectResponse,frameId);}
networkRequest=this._appendRedirect(requestId,time,request.url);this._manager.dispatchEventToListeners(Events$1.RequestRedirected,networkRequest);}else{networkRequest=this._createNetworkRequest(requestId,frameId||'',loaderId,request.url,documentURL,initiator);}
networkRequest.hasNetworkData=true;this._updateNetworkRequestWithRequest(networkRequest,request);networkRequest.setIssueTime(time,wallTime);networkRequest.setResourceType(resourceType?ResourceType.resourceTypes[resourceType]:Protocol.Network.ResourceType.Other);this._getExtraInfoBuilder(requestId).addRequest(networkRequest);this._startNetworkRequest(networkRequest);}
requestServedFromCache(requestId){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.setFromMemoryCache();}
responseReceived(requestId,loaderId,time,resourceType,response,frameId){const networkRequest=this._inflightRequestsById[requestId];const lowercaseHeaders=NetworkManager.lowercaseHeaders(response.headers);if(!networkRequest){const eventData={};eventData.url=response.url;eventData.frameId=frameId||'';eventData.loaderId=loaderId;eventData.resourceType=resourceType;eventData.mimeType=response.mimeType;const lastModifiedHeader=lowercaseHeaders['last-modified'];eventData.lastModified=lastModifiedHeader?new Date(lastModifiedHeader):null;this._manager.dispatchEventToListeners(Events$1.RequestUpdateDropped,eventData);return;}
networkRequest.responseReceivedTime=time;networkRequest.setResourceType(ResourceType.resourceTypes[resourceType]);if('set-cookie'in lowercaseHeaders&&lowercaseHeaders['set-cookie'].length>4096){const values=lowercaseHeaders['set-cookie'].split('\n');for(let i=0;i<values.length;++i){if(values[i].length<=4096){continue;}
const message=UIString.UIString('Set-Cookie header is ignored in response from url: %s. Cookie length should be less than or equal to 4096 characters.',response.url);this._manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:requestId,warning:true});}}
this._updateNetworkRequestWithResponse(networkRequest,response);this._updateNetworkRequest(networkRequest);this._manager.dispatchEventToListeners(Events$1.ResponseReceived,networkRequest);}
dataReceived(requestId,time,dataLength,encodedDataLength){let networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){networkRequest=this._maybeAdoptMainResourceRequest(requestId);}
if(!networkRequest){return;}
networkRequest.resourceSize+=dataLength;if(encodedDataLength!==-1){networkRequest.increaseTransferSize(encodedDataLength);}
networkRequest.endTime=time;this._updateNetworkRequest(networkRequest);}
loadingFinished(requestId,finishTime,encodedDataLength,shouldReportCorbBlocking){let networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){networkRequest=this._maybeAdoptMainResourceRequest(requestId);}
if(!networkRequest){return;}
this._getExtraInfoBuilder(requestId).finished();this._finishNetworkRequest(networkRequest,finishTime,encodedDataLength,shouldReportCorbBlocking);this._manager.dispatchEventToListeners(Events$1.LoadingFinished,networkRequest);}
loadingFailed(requestId,time,resourceType,localizedDescription,canceled,blockedReason){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.failed=true;networkRequest.setResourceType(ResourceType.resourceTypes[resourceType]);networkRequest.canceled=!!canceled;if(blockedReason){networkRequest.setBlockedReason(blockedReason);if(blockedReason===Protocol.Network.BlockedReason.Inspector){const message=UIString.UIString('Request was blocked by DevTools: "%s".',networkRequest.url());this._manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:requestId,warning:true});}}
networkRequest.localizedFailDescription=localizedDescription;this._getExtraInfoBuilder(requestId).finished();this._finishNetworkRequest(networkRequest,time,-1);}
webSocketCreated(requestId,requestURL,initiator){const networkRequest=new NetworkRequest(requestId,requestURL,'','','',initiator||null);networkRequest[_networkManagerForRequestSymbol]=this._manager;networkRequest.setResourceType(ResourceType.resourceTypes.WebSocket);this._startNetworkRequest(networkRequest);}
webSocketWillSendHandshakeRequest(requestId,time,wallTime,request){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.requestMethod='GET';networkRequest.setRequestHeaders(this._headersMapToHeadersArray(request.headers));networkRequest.setIssueTime(time,wallTime);this._updateNetworkRequest(networkRequest);}
webSocketHandshakeResponseReceived(requestId,time,response){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.statusCode=response.status;networkRequest.statusText=response.statusText;networkRequest.responseHeaders=this._headersMapToHeadersArray(response.headers);networkRequest.responseHeadersText=response.headersText||'';if(response.requestHeaders){networkRequest.setRequestHeaders(this._headersMapToHeadersArray(response.requestHeaders));}
if(response.requestHeadersText){networkRequest.setRequestHeadersText(response.requestHeadersText);}
networkRequest.responseReceivedTime=time;networkRequest.protocol='websocket';this._updateNetworkRequest(networkRequest);}
webSocketFrameReceived(requestId,time,response){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.addProtocolFrame(response,time,false);networkRequest.responseReceivedTime=time;this._updateNetworkRequest(networkRequest);}
webSocketFrameSent(requestId,time,response){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.addProtocolFrame(response,time,true);networkRequest.responseReceivedTime=time;this._updateNetworkRequest(networkRequest);}
webSocketFrameError(requestId,time,errorMessage){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.addProtocolFrameError(errorMessage,time);networkRequest.responseReceivedTime=time;this._updateNetworkRequest(networkRequest);}
webSocketClosed(requestId,time){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
this._finishNetworkRequest(networkRequest,time,-1);}
eventSourceMessageReceived(requestId,time,eventName,eventId,data){const networkRequest=this._inflightRequestsById[requestId];if(!networkRequest){return;}
networkRequest.addEventSourceMessage(time,eventName,eventId,data);}
requestIntercepted(interceptionId,request,frameId,resourceType,isNavigationRequest,isDownload,redirectUrl,authChallenge,responseErrorReason,responseStatusCode,responseHeaders,requestId){self.SDK.multitargetNetworkManager._requestIntercepted(new InterceptedRequest(this._manager.target().networkAgent(),interceptionId,request,frameId,resourceType,isNavigationRequest,isDownload,redirectUrl,authChallenge,responseErrorReason,responseStatusCode,responseHeaders,requestId));}
requestWillBeSentExtraInfo(requestId,blockedCookies,headers){const extraRequestInfo={blockedRequestCookies:blockedCookies.map(blockedCookie=>{return{blockedReasons:blockedCookie.blockedReasons,cookie:Cookie.fromProtocolCookie(blockedCookie.cookie)};}),requestHeaders:this._headersMapToHeadersArray(headers)};this._getExtraInfoBuilder(requestId).addRequestExtraInfo(extraRequestInfo);}
responseReceivedExtraInfo(requestId,blockedCookies,headers,headersText){const extraResponseInfo={blockedResponseCookies:blockedCookies.map(blockedCookie=>{return{blockedReasons:blockedCookie.blockedReasons,cookieLine:blockedCookie.cookieLine,cookie:blockedCookie.cookie?Cookie.fromProtocolCookie(blockedCookie.cookie):null};}),responseHeaders:this._headersMapToHeadersArray(headers),responseHeadersText:headersText};this._getExtraInfoBuilder(requestId).addResponseExtraInfo(extraResponseInfo);}
cookiesChanged(url,firstPartyUrl,blockedCookies){}
_getExtraInfoBuilder(requestId){if(!this._requestIdToRedirectExtraInfoBuilder.get(requestId)){const deleteCallback=()=>{this._requestIdToRedirectExtraInfoBuilder.delete(requestId);};this._requestIdToRedirectExtraInfoBuilder.set(requestId,new RedirectExtraInfoBuilder(deleteCallback));}
return this._requestIdToRedirectExtraInfoBuilder.get(requestId);}
_appendRedirect(requestId,time,redirectURL){const originalNetworkRequest=this._inflightRequestsById[requestId];let redirectCount=0;for(let redirect=originalNetworkRequest.redirectSource();redirect;redirect=redirect.redirectSource()){redirectCount++;}
originalNetworkRequest.markAsRedirect(redirectCount);this._finishNetworkRequest(originalNetworkRequest,time,-1);const newNetworkRequest=this._createNetworkRequest(requestId,originalNetworkRequest.frameId,originalNetworkRequest.loaderId,redirectURL,originalNetworkRequest.documentURL,originalNetworkRequest.initiator());newNetworkRequest.setRedirectSource(originalNetworkRequest);originalNetworkRequest.setRedirectDestination(newNetworkRequest);return newNetworkRequest;}
_maybeAdoptMainResourceRequest(requestId){const request=self.SDK.multitargetNetworkManager._inflightMainResourceRequests.get(requestId);if(!request){return null;}
const oldDispatcher=NetworkManager.forRequest(request)._dispatcher;delete oldDispatcher._inflightRequestsById[requestId];delete oldDispatcher._inflightRequestsByURL[request.url()];this._inflightRequestsById[requestId]=request;this._inflightRequestsByURL[request.url()]=request;request[_networkManagerForRequestSymbol]=this._manager;return request;}
_startNetworkRequest(networkRequest){this._inflightRequestsById[networkRequest.requestId()]=networkRequest;this._inflightRequestsByURL[networkRequest.url()]=networkRequest;if(networkRequest.loaderId===networkRequest.requestId()){self.SDK.multitargetNetworkManager._inflightMainResourceRequests.set(networkRequest.requestId(),networkRequest);}
this._manager.dispatchEventToListeners(Events$1.RequestStarted,networkRequest);}
_updateNetworkRequest(networkRequest){this._manager.dispatchEventToListeners(Events$1.RequestUpdated,networkRequest);}
_finishNetworkRequest(networkRequest,finishTime,encodedDataLength,shouldReportCorbBlocking){networkRequest.endTime=finishTime;networkRequest.finished=true;if(encodedDataLength>=0){const redirectSource=networkRequest.redirectSource();if(redirectSource&&redirectSource.signedExchangeInfo()){networkRequest.setTransferSize(0);redirectSource.setTransferSize(encodedDataLength);this._updateNetworkRequest(redirectSource);}else{networkRequest.setTransferSize(encodedDataLength);}}
this._manager.dispatchEventToListeners(Events$1.RequestFinished,networkRequest);delete this._inflightRequestsById[networkRequest.requestId()];delete this._inflightRequestsByURL[networkRequest.url()];self.SDK.multitargetNetworkManager._inflightMainResourceRequests.delete(networkRequest.requestId());if(shouldReportCorbBlocking){const message=UIString.UIString('Cross-Origin Read Blocking (CORB) blocked cross-origin response %s with MIME type %s. See https://www.chromestatus.com/feature/5629709824032768 for more details.',networkRequest.url(),networkRequest.mimeType);this._manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:networkRequest.requestId(),warning:true});}
if(Settings.Settings.instance().moduleSetting('monitoringXHREnabled').get()&&networkRequest.resourceType().category()===ResourceType.resourceCategories.XHR){let message;const failedToLoad=networkRequest.failed||networkRequest.hasErrorStatusCode();if(failedToLoad){message=UIString.UIString('%s failed loading: %s "%s".',networkRequest.resourceType().title(),networkRequest.requestMethod,networkRequest.url());}else{message=UIString.UIString('%s finished loading: %s "%s".',networkRequest.resourceType().title(),networkRequest.requestMethod,networkRequest.url());}
this._manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:networkRequest.requestId(),warning:false});}}
_createNetworkRequest(requestId,frameId,loaderId,url,documentURL,initiator){const request=new NetworkRequest(requestId,url,documentURL,frameId,loaderId,initiator);request[_networkManagerForRequestSymbol]=this._manager;return request;}}
class MultitargetNetworkManager extends ObjectWrapper.ObjectWrapper{constructor(){super();this._userAgentOverride='';this._agents=new Set();this._inflightMainResourceRequests=new Map();this._networkConditions=NoThrottlingConditions;this._updatingInterceptionPatternsPromise=null;this._blockingEnabledSetting=Settings.Settings.instance().moduleSetting('requestBlockingEnabled');this._blockedPatternsSetting=Settings.Settings.instance().createSetting('networkBlockedPatterns',[]);this._effectiveBlockedURLs=[];this._updateBlockedPatterns();this._urlsForRequestInterceptor=new Multimap();TargetManager.instance().observeModels(NetworkManager,this);}
static patchUserAgentWithChromeVersion(uaString){const chromeRegex=new RegExp('(?:^|\\W)Chrome/(\\S+)');const chromeMatch=navigator.userAgent.match(chromeRegex);if(chromeMatch&&chromeMatch.length>1){const additionalAppVersion=chromeMatch[1].split('.',1)[0]+'.0.100.0';return StringUtilities.sprintf(uaString,chromeMatch[1],additionalAppVersion);}
return uaString;}
modelAdded(networkManager){const networkAgent=networkManager.target().networkAgent();if(this._extraHeaders){networkAgent.setExtraHTTPHeaders(this._extraHeaders);}
if(this.currentUserAgent()){networkAgent.setUserAgentOverride(this.currentUserAgent());}
if(this._effectiveBlockedURLs.length){networkAgent.setBlockedURLs(this._effectiveBlockedURLs);}
if(this.isIntercepting()){networkAgent.setRequestInterception(this._urlsForRequestInterceptor.valuesArray());}
this._agents.add(networkAgent);if(this.isThrottling()){this._updateNetworkConditions(networkAgent);}}
modelRemoved(networkManager){for(const entry of this._inflightMainResourceRequests){const manager=NetworkManager.forRequest((entry[1]));if(manager!==networkManager){continue;}
this._inflightMainResourceRequests.delete((entry[0]));}
this._agents.delete(networkManager.target().networkAgent());}
isThrottling(){return this._networkConditions.download>=0||this._networkConditions.upload>=0||this._networkConditions.latency>0;}
isOffline(){return!this._networkConditions.download&&!this._networkConditions.upload;}
setNetworkConditions(conditions){this._networkConditions=conditions;for(const agent of this._agents){this._updateNetworkConditions(agent);}
this.dispatchEventToListeners(MultitargetNetworkManager.Events.ConditionsChanged);}
networkConditions(){return this._networkConditions;}
_updateNetworkConditions(networkAgent){const conditions=this._networkConditions;if(!this.isThrottling()){networkAgent.emulateNetworkConditions(false,0,0,0);}else{networkAgent.emulateNetworkConditions(this.isOffline(),conditions.latency,conditions.download<0?0:conditions.download,conditions.upload<0?0:conditions.upload,NetworkManager._connectionType(conditions));}}
setExtraHTTPHeaders(headers){this._extraHeaders=headers;for(const agent of this._agents){agent.setExtraHTTPHeaders(this._extraHeaders);}}
currentUserAgent(){return this._customUserAgent?this._customUserAgent:this._userAgentOverride;}
_updateUserAgentOverride(){const userAgent=this.currentUserAgent();for(const agent of this._agents){agent.setUserAgentOverride(userAgent);}}
setUserAgentOverride(userAgent){if(this._userAgentOverride===userAgent){return;}
this._userAgentOverride=userAgent;if(!this._customUserAgent){this._updateUserAgentOverride();}
this.dispatchEventToListeners(MultitargetNetworkManager.Events.UserAgentChanged);}
userAgentOverride(){return this._userAgentOverride;}
setCustomUserAgentOverride(userAgent){this._customUserAgent=userAgent;this._updateUserAgentOverride();}
blockedPatterns(){return this._blockedPatternsSetting.get().slice();}
blockingEnabled(){return this._blockingEnabledSetting.get();}
isBlocking(){return!!this._effectiveBlockedURLs.length;}
setBlockedPatterns(patterns){this._blockedPatternsSetting.set(patterns);this._updateBlockedPatterns();this.dispatchEventToListeners(MultitargetNetworkManager.Events.BlockedPatternsChanged);}
setBlockingEnabled(enabled){if(this._blockingEnabledSetting.get()===enabled){return;}
this._blockingEnabledSetting.set(enabled);this._updateBlockedPatterns();this.dispatchEventToListeners(MultitargetNetworkManager.Events.BlockedPatternsChanged);}
_updateBlockedPatterns(){const urls=[];if(this._blockingEnabledSetting.get()){for(const pattern of this._blockedPatternsSetting.get()){if(pattern.enabled){urls.push(pattern.url);}}}
if(!urls.length&&!this._effectiveBlockedURLs.length){return;}
this._effectiveBlockedURLs=urls;for(const agent of this._agents){agent.setBlockedURLs(this._effectiveBlockedURLs);}}
isIntercepting(){return!!this._urlsForRequestInterceptor.size;}
setInterceptionHandlerForPatterns(patterns,requestInterceptor){this._urlsForRequestInterceptor.deleteAll(requestInterceptor);for(const newPattern of patterns){this._urlsForRequestInterceptor.set(requestInterceptor,newPattern);}
return this._updateInterceptionPatternsOnNextTick();}
_updateInterceptionPatternsOnNextTick(){if(!this._updatingInterceptionPatternsPromise){this._updatingInterceptionPatternsPromise=Promise.resolve().then(this._updateInterceptionPatterns.bind(this));}
return this._updatingInterceptionPatternsPromise;}
_updateInterceptionPatterns(){if(!Settings.Settings.instance().moduleSetting('cacheDisabled').get()){Settings.Settings.instance().moduleSetting('cacheDisabled').set(true);}
this._updatingInterceptionPatternsPromise=null;const promises=([]);for(const agent of this._agents){promises.push(agent.setRequestInterception(this._urlsForRequestInterceptor.valuesArray()));}
this.dispatchEventToListeners(MultitargetNetworkManager.Events.InterceptorsChanged);return Promise.all(promises);}
async _requestIntercepted(interceptedRequest){for(const requestInterceptor of this._urlsForRequestInterceptor.keysArray()){await requestInterceptor(interceptedRequest);if(interceptedRequest.hasResponded()){return;}}
if(!interceptedRequest.hasResponded()){interceptedRequest.continueRequestWithoutChange();}}
clearBrowserCache(){for(const agent of this._agents){agent.clearBrowserCache();}}
clearBrowserCookies(){for(const agent of this._agents){agent.clearBrowserCookies();}}
getCertificate(origin){const target=TargetManager.instance().mainTarget();return target.networkAgent().getCertificate(origin).then(certificate=>certificate||[]);}
loadResource(url,callback){const headers={};const currentUserAgent=this.currentUserAgent();if(currentUserAgent){headers['User-Agent']=currentUserAgent;}
if(Settings.Settings.instance().moduleSetting('cacheDisabled').get()){headers['Cache-Control']='no-cache';}
ResourceLoader.load(url,headers,callback);}}
MultitargetNetworkManager.Events={BlockedPatternsChanged:Symbol('BlockedPatternsChanged'),ConditionsChanged:Symbol('ConditionsChanged'),UserAgentChanged:Symbol('UserAgentChanged'),InterceptorsChanged:Symbol('InterceptorsChanged')};class InterceptedRequest{constructor(networkAgent,interceptionId,request,frameId,resourceType,isNavigationRequest,isDownload,redirectUrl,authChallenge,responseErrorReason,responseStatusCode,responseHeaders,requestId){this._networkAgent=networkAgent;this._interceptionId=interceptionId;this._hasResponded=false;this.request=request;this.frameId=frameId;this.resourceType=resourceType;this.isNavigationRequest=isNavigationRequest;this.isDownload=!!isDownload;this.redirectUrl=redirectUrl;this.authChallenge=authChallenge;this.responseErrorReason=responseErrorReason;this.responseStatusCode=responseStatusCode;this.responseHeaders=responseHeaders;this.requestId=requestId;}
hasResponded(){return this._hasResponded;}
async continueRequestWithContent(contentBlob){this._hasResponded=true;const headers=['HTTP/1.1 200 OK','Date: '+(new Date()).toUTCString(),'Server: Chrome Devtools Request Interceptor','Connection: closed','Content-Length: '+contentBlob.size,'Content-Type: '+contentBlob.type||'text/x-unknown',];const encodedResponse=await blobToBase64(new Blob([headers.join('\r\n'),'\r\n\r\n',contentBlob]));this._networkAgent.continueInterceptedRequest(this._interceptionId,undefined,encodedResponse);async function blobToBase64(blob){const reader=new FileReader();const fileContentsLoadedPromise=new Promise(resolve=>reader.onloadend=resolve);reader.readAsDataURL(blob);await fileContentsLoadedPromise;if(reader.error){console.error('Could not convert blob to base64.',reader.error);return'';}
const result=reader.result;if(result===undefined){console.error('Could not convert blob to base64.');return'';}
return result.substring(result.indexOf(',')+1);}}
continueRequestWithoutChange(){console.assert(!this._hasResponded);this._hasResponded=true;this._networkAgent.continueInterceptedRequest(this._interceptionId);}
continueRequestWithError(errorReason){console.assert(!this._hasResponded);this._hasResponded=true;this._networkAgent.continueInterceptedRequest(this._interceptionId,errorReason);}
async responseBody(){const response=await this._networkAgent.invoke_getResponseBodyForInterception({interceptionId:this._interceptionId});const error=response[InspectorBackend.ProtocolError]||null;return{error:error,content:error?null:response.body,encoded:response.base64Encoded};}}
class RedirectExtraInfoBuilder{constructor(deleteCallback){this._requests=[];this._requestExtraInfos=[];this._responseExtraInfos=[];this._finished=false;this._hasExtraInfo=false;this._deleteCallback=deleteCallback;}
addRequest(req){this._requests.push(req);this._sync(this._requests.length-1);}
addRequestExtraInfo(info){this._hasExtraInfo=true;this._requestExtraInfos.push(info);this._sync(this._requestExtraInfos.length-1);}
addResponseExtraInfo(info){this._responseExtraInfos.push(info);this._sync(this._responseExtraInfos.length-1);}
finished(){this._finished=true;this._deleteIfComplete();}
_sync(index){const req=this._requests[index];if(!req){return;}
const requestExtraInfo=this._requestExtraInfos[index];if(requestExtraInfo){req.addExtraRequestInfo(requestExtraInfo);this._requestExtraInfos[index]=null;}
const responseExtraInfo=this._responseExtraInfos[index];if(responseExtraInfo){req.addExtraResponseInfo(responseExtraInfo);this._responseExtraInfos[index]=null;}
this._deleteIfComplete();}
_deleteIfComplete(){if(!this._finished){return;}
if(this._hasExtraInfo){if(!this._requests.peekLast().hasExtraResponseInfo()){return;}}
this._deleteCallback();}}
SDKModel.register(NetworkManager,Capability.Network,true);let Conditions;let BlockedPattern;let Message;let InterceptionPattern;let RequestInterceptor;var NetworkManager$1=Object.freeze({__proto__:null,NetworkManager:NetworkManager,Events:Events$1,NoThrottlingConditions:NoThrottlingConditions,OfflineConditions:OfflineConditions,Slow3GConditions:Slow3GConditions,Fast3GConditions:Fast3GConditions,NetworkDispatcher:NetworkDispatcher,MultitargetNetworkManager:MultitargetNetworkManager,InterceptedRequest:InterceptedRequest,Conditions:Conditions,BlockedPattern:BlockedPattern,Message:Message,InterceptionPattern:InterceptionPattern,RequestInterceptor:RequestInterceptor});class ServerTiming{constructor(metric,value,description){this.metric=metric;this.value=value;this.description=description;}
static parseHeaders(headers){const rawServerTimingHeaders=headers.filter(item=>item.name.toLowerCase()==='server-timing');if(!rawServerTimingHeaders.length){return null;}
const serverTimings=rawServerTimingHeaders.reduce((memo,header)=>{const timing=this.createFromHeaderValue(header.value);memo.push(...timing.map(function(entry){return new ServerTiming(entry.name,entry.hasOwnProperty('dur')?entry.dur:null,entry.hasOwnProperty('desc')?entry.desc:'');}));return memo;},([]));serverTimings.sort((a,b)=>a.metric.toLowerCase().compareTo(b.metric.toLowerCase()));return serverTimings;}
static createFromHeaderValue(valueString){function trimLeadingWhiteSpace(){valueString=valueString.replace(/^\s*/,'');}
function consumeDelimiter(char){console.assert(char.length===1);trimLeadingWhiteSpace();if(valueString.charAt(0)!==char){return false;}
valueString=valueString.substring(1);return true;}
function consumeToken(){const result=/^(?:\s*)([\w!#$%&'*+\-.^`|~]+)(?:\s*)(.*)/.exec(valueString);if(!result){return null;}
valueString=result[2];return result[1];}
function consumeTokenOrQuotedString(){trimLeadingWhiteSpace();if(valueString.charAt(0)==='"'){return consumeQuotedString();}
return consumeToken();}
function consumeQuotedString(){console.assert(valueString.charAt(0)==='"');valueString=valueString.substring(1);let value='';while(valueString.length){const result=/^([^"\\]*)(.*)/.exec(valueString);if(!result){return null;}
value+=result[1];if(result[2].charAt(0)==='"'){valueString=result[2].substring(1);return value;}
console.assert(result[2].charAt(0)==='\\');value+=result[2].charAt(1);valueString=result[2].substring(2);}
return null;}
function consumeExtraneous(){const result=/([,;].*)/.exec(valueString);if(result){valueString=result[1];}}
const result=[];let name;while((name=consumeToken())!==null){const entry={name};if(valueString.charAt(0)==='='){this.showWarning(ls$1`Deprecated syntax found. Please use: <name>;dur=<duration>;desc=<description>`);}
while(consumeDelimiter(';')){let paramName;if((paramName=consumeToken())===null){continue;}
paramName=paramName.toLowerCase();const parseParameter=this.getParserForParameter(paramName);let paramValue=null;if(consumeDelimiter('=')){paramValue=consumeTokenOrQuotedString();consumeExtraneous();}
if(parseParameter){if(entry.hasOwnProperty(paramName)){this.showWarning(ls$1`Duplicate parameter "${paramName}" ignored.`);continue;}
if(paramValue===null){this.showWarning(ls$1`No value found for parameter "${paramName}".`);}
parseParameter.call(this,entry,paramValue);}else{this.showWarning(ls$1`Unrecognized parameter "${paramName}".`);}}
result.push(entry);if(!consumeDelimiter(',')){break;}}
if(valueString.length){this.showWarning(ls$1`Extraneous trailing characters.`);}
return result;}
static getParserForParameter(paramName){switch(paramName){case'dur':{function durParser(entry,paramValue){entry.dur=0;if(paramValue!==null){const duration=parseFloat(paramValue);if(isNaN(duration)){ServerTiming.showWarning(ls$1`Unable to parse "${paramName}" value "${paramValue}".`);return;}
entry.dur=duration;}}
return durParser;}
case'desc':{function descParser(entry,paramValue){entry.desc=paramValue||'';}
return descParser;}
default:{return null;}}}
static showWarning(msg){Console.Console.instance().warn(UIString.UIString(`ServerTiming: ${msg}`));}}
var ServerTiming$1=Object.freeze({__proto__:null,ServerTiming:ServerTiming});class NetworkRequest extends ObjectWrapper.ObjectWrapper{constructor(requestId,url,documentURL,frameId,loaderId,initiator){super();this._requestId=requestId;this._backendRequestId=requestId;this.setUrl(url);this._documentURL=documentURL;this._frameId=frameId;this._loaderId=loaderId;this._initiator=initiator;this._redirectSource=null;this._redirectDestination=null;this._issueTime=-1;this._startTime=-1;this._endTime=-1;this._blockedReason=undefined;this.statusCode=0;this.statusText='';this.requestMethod='';this.requestTime=0;this.protocol='';this.mixedContentType=Protocol.Security.MixedContentType.None;this._initialPriority=null;this._currentPriority=null;this._signedExchangeInfo=null;this._resourceType=ResourceType.resourceTypes.Other;this._contentData=null;this._frames=[];this._eventSourceMessages=[];this._responseHeaderValues={};this._responseHeadersText='';this._requestHeaders=[];this._requestHeaderValues={};this._remoteAddress='';this._referrerPolicy=null;this._securityState=Protocol.Security.SecurityState.Unknown;this._securityDetails=null;this.connectionId='0';this._formParametersPromise=null;this._requestFormDataPromise=(Promise.resolve(null));this._hasExtraRequestInfo=false;this._hasExtraResponseInfo=false;this._blockedRequestCookies=[];this._blockedResponseCookies=[];}
indentityCompare(other){const thisId=this.requestId();const thatId=other.requestId();if(thisId>thatId){return 1;}
if(thisId<thatId){return-1;}
return 0;}
requestId(){return this._requestId;}
backendRequestId(){return this._backendRequestId;}
url(){return this._url;}
isBlobRequest(){return this._url.startsWith('blob:');}
setUrl(x){if(this._url===x){return;}
this._url=x;this._parsedURL=new ParsedURL.ParsedURL(x);delete this._queryString;delete this._parsedQueryParameters;delete this._name;delete this._path;}
get documentURL(){return this._documentURL;}
get parsedURL(){return this._parsedURL;}
get frameId(){return this._frameId;}
get loaderId(){return this._loaderId;}
setRemoteAddress(ip,port){this._remoteAddress=ip+':'+port;this.dispatchEventToListeners(Events$2.RemoteAddressChanged,this);}
remoteAddress(){return this._remoteAddress;}
setReferrerPolicy(referrerPolicy){this._referrerPolicy=referrerPolicy;}
referrerPolicy(){return this._referrerPolicy;}
securityState(){return this._securityState;}
setSecurityState(securityState){this._securityState=securityState;}
securityDetails(){return this._securityDetails;}
setSecurityDetails(securityDetails){this._securityDetails=securityDetails;}
get startTime(){return this._startTime||-1;}
setIssueTime(monotonicTime,wallTime){this._issueTime=monotonicTime;this._wallIssueTime=wallTime;this._startTime=monotonicTime;}
issueTime(){return this._issueTime;}
pseudoWallTime(monotonicTime){return this._wallIssueTime?this._wallIssueTime-this._issueTime+monotonicTime:monotonicTime;}
get responseReceivedTime(){return this._responseReceivedTime||-1;}
set responseReceivedTime(x){this._responseReceivedTime=x;}
get endTime(){return this._endTime||-1;}
set endTime(x){if(this.timing&&this.timing.requestTime){this._endTime=Math.max(x,this.responseReceivedTime);}else{this._endTime=x;if(this._responseReceivedTime>x){this._responseReceivedTime=x;}}
this.dispatchEventToListeners(Events$2.TimingChanged,this);}
get duration(){if(this._endTime===-1||this._startTime===-1){return-1;}
return this._endTime-this._startTime;}
get latency(){if(this._responseReceivedTime===-1||this._startTime===-1){return-1;}
return this._responseReceivedTime-this._startTime;}
get resourceSize(){return this._resourceSize||0;}
set resourceSize(x){this._resourceSize=x;}
get transferSize(){return this._transferSize||0;}
increaseTransferSize(x){this._transferSize=(this._transferSize||0)+x;}
setTransferSize(x){this._transferSize=x;}
get finished(){return this._finished;}
set finished(x){if(this._finished===x){return;}
this._finished=x;if(x){this.dispatchEventToListeners(Events$2.FinishedLoading,this);}}
get failed(){return this._failed;}
set failed(x){this._failed=x;}
get canceled(){return this._canceled;}
set canceled(x){this._canceled=x;}
blockedReason(){return this._blockedReason;}
setBlockedReason(reason){this._blockedReason=reason;}
wasBlocked(){return!!this._blockedReason;}
cached(){return(!!this._fromMemoryCache||!!this._fromDiskCache)&&!this._transferSize;}
cachedInMemory(){return!!this._fromMemoryCache&&!this._transferSize;}
fromPrefetchCache(){return!!this._fromPrefetchCache;}
setFromMemoryCache(){this._fromMemoryCache=true;delete this._timing;}
setFromDiskCache(){this._fromDiskCache=true;}
setFromPrefetchCache(){this._fromPrefetchCache=true;}
get fetchedViaServiceWorker(){return!!this._fetchedViaServiceWorker;}
set fetchedViaServiceWorker(x){this._fetchedViaServiceWorker=x;}
initiatedByServiceWorker(){const networkManager=NetworkManager.forRequest(this);if(!networkManager){return false;}
return networkManager.target().type()===Type.ServiceWorker;}
get timing(){return this._timing;}
set timing(timingInfo){if(!timingInfo||this._fromMemoryCache){return;}
this._startTime=timingInfo.requestTime;const headersReceivedTime=timingInfo.requestTime+timingInfo.receiveHeadersEnd/1000.0;if((this._responseReceivedTime||-1)<0||this._responseReceivedTime>headersReceivedTime){this._responseReceivedTime=headersReceivedTime;}
if(this._startTime>this._responseReceivedTime){this._responseReceivedTime=this._startTime;}
this._timing=timingInfo;this.dispatchEventToListeners(Events$2.TimingChanged,this);}
get mimeType(){return this._mimeType;}
set mimeType(x){this._mimeType=x;}
get displayName(){return this._parsedURL.displayName;}
name(){if(this._name){return this._name;}
this._parseNameAndPathFromURL();return this._name;}
path(){if(this._path){return this._path;}
this._parseNameAndPathFromURL();return this._path;}
_parseNameAndPathFromURL(){if(this._parsedURL.isDataURL()){this._name=this._parsedURL.dataURLDisplayName();this._path='';}else if(this._parsedURL.isBlobURL()){this._name=this._parsedURL.url;this._path='';}else if(this._parsedURL.isAboutBlank()){this._name=this._parsedURL.url;this._path='';}else{this._path=this._parsedURL.host+this._parsedURL.folderPathComponents;const networkManager=NetworkManager.forRequest(this);const inspectedURL=networkManager?ParsedURL.ParsedURL.fromString(networkManager.target().inspectedURL()):null;this._path=StringUtilities.trimURL(this._path,inspectedURL?inspectedURL.host:'');if(this._parsedURL.lastPathComponent||this._parsedURL.queryParams){this._name=this._parsedURL.lastPathComponent+(this._parsedURL.queryParams?'?'+this._parsedURL.queryParams:'');}else if(this._parsedURL.folderPathComponents){this._name=this._parsedURL.folderPathComponents.substring(this._parsedURL.folderPathComponents.lastIndexOf('/')+1)+'/';this._path=this._path.substring(0,this._path.lastIndexOf('/'));}else{this._name=this._parsedURL.host;this._path='';}}}
get folder(){let path=this._parsedURL.path;const indexOfQuery=path.indexOf('?');if(indexOfQuery!==-1){path=path.substring(0,indexOfQuery);}
const lastSlashIndex=path.lastIndexOf('/');return lastSlashIndex!==-1?path.substring(0,lastSlashIndex):'';}
get pathname(){return this._parsedURL.path;}
resourceType(){return this._resourceType;}
setResourceType(resourceType){this._resourceType=resourceType;}
get domain(){return this._parsedURL.host;}
get scheme(){return this._parsedURL.scheme;}
redirectSource(){return this._redirectSource;}
setRedirectSource(originatingRequest){this._redirectSource=originatingRequest;}
redirectDestination(){return this._redirectDestination;}
setRedirectDestination(redirectDestination){this._redirectDestination=redirectDestination;}
requestHeaders(){return this._requestHeaders;}
setRequestHeaders(headers){this._requestHeaders=headers;delete this._requestCookies;this.dispatchEventToListeners(Events$2.RequestHeadersChanged);}
requestHeadersText(){return this._requestHeadersText;}
setRequestHeadersText(text){this._requestHeadersText=text;this.dispatchEventToListeners(Events$2.RequestHeadersChanged);}
requestHeaderValue(headerName){if(this._requestHeaderValues[headerName]){return this._requestHeaderValues[headerName];}
this._requestHeaderValues[headerName]=this._computeHeaderValue(this.requestHeaders(),headerName);return this._requestHeaderValues[headerName];}
get requestCookies(){if(!this._requestCookies){this._requestCookies=CookieParser.parseCookie(this.requestHeaderValue('Cookie'))||[];}
return this._requestCookies;}
requestFormData(){if(!this._requestFormDataPromise){this._requestFormDataPromise=NetworkManager.requestPostData(this);}
return this._requestFormDataPromise;}
setRequestFormData(hasData,data){this._requestFormDataPromise=(hasData&&data===null)?null:Promise.resolve(data);this._formParametersPromise=null;}
_filteredProtocolName(){const protocol=this.protocol.toLowerCase();if(protocol==='h2'){return'http/2.0';}
return protocol.replace(/^http\/2(\.0)?\+/,'http/2.0+');}
requestHttpVersion(){const headersText=this.requestHeadersText();if(!headersText){const version=this.requestHeaderValue('version')||this.requestHeaderValue(':version');if(version){return version;}
return this._filteredProtocolName();}
const firstLine=headersText.split(/\r\n/)[0];const match=firstLine.match(/(HTTP\/\d+\.\d+)$/);return match?match[1]:'HTTP/0.9';}
get responseHeaders(){return this._responseHeaders||[];}
set responseHeaders(x){this._responseHeaders=x;delete this._sortedResponseHeaders;delete this._serverTimings;delete this._responseCookies;this._responseHeaderValues={};this.dispatchEventToListeners(Events$2.ResponseHeadersChanged);}
get responseHeadersText(){return this._responseHeadersText;}
set responseHeadersText(x){this._responseHeadersText=x;this.dispatchEventToListeners(Events$2.ResponseHeadersChanged);}
get sortedResponseHeaders(){if(this._sortedResponseHeaders!==undefined){return this._sortedResponseHeaders;}
this._sortedResponseHeaders=this.responseHeaders.slice();this._sortedResponseHeaders.sort(function(a,b){return a.name.toLowerCase().compareTo(b.name.toLowerCase());});return this._sortedResponseHeaders;}
responseHeaderValue(headerName){if(headerName in this._responseHeaderValues){return this._responseHeaderValues[headerName];}
this._responseHeaderValues[headerName]=this._computeHeaderValue(this.responseHeaders,headerName);return this._responseHeaderValues[headerName];}
get responseCookies(){if(!this._responseCookies){this._responseCookies=CookieParser.parseSetCookie(this.responseHeaderValue('Set-Cookie'),this.domain)||[];}
return this._responseCookies;}
responseLastModified(){return this.responseHeaderValue('last-modified');}
allCookiesIncludingBlockedOnes(){return[...this.requestCookies,...this.responseCookies,...this.blockedRequestCookies().map(blockedRequestCookie=>blockedRequestCookie.cookie),...this.blockedResponseCookies().map(blockedResponseCookie=>blockedResponseCookie.cookie),].filter(v=>!!v);}
get serverTimings(){if(typeof this._serverTimings==='undefined'){this._serverTimings=ServerTiming.parseHeaders(this.responseHeaders);}
return this._serverTimings;}
queryString(){if(this._queryString!==undefined){return this._queryString;}
let queryString=null;const url=this.url();const questionMarkPosition=url.indexOf('?');if(questionMarkPosition!==-1){queryString=url.substring(questionMarkPosition+1);const hashSignPosition=queryString.indexOf('#');if(hashSignPosition!==-1){queryString=queryString.substring(0,hashSignPosition);}}
this._queryString=queryString;return this._queryString;}
get queryParameters(){if(this._parsedQueryParameters){return this._parsedQueryParameters;}
const queryString=this.queryString();if(!queryString){return null;}
this._parsedQueryParameters=this._parseParameters(queryString);return this._parsedQueryParameters;}
async _parseFormParameters(){const requestContentType=this.requestContentType();if(!requestContentType){return null;}
if(requestContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i)){const formData=await this.requestFormData();if(!formData){return null;}
return this._parseParameters(formData);}
const multipartDetails=requestContentType.match(/^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/);if(!multipartDetails){return null;}
const boundary=multipartDetails[1];if(!boundary){return null;}
const formData=await this.requestFormData();if(!formData){return null;}
return this._parseMultipartFormDataParameters(formData,boundary);}
formParameters(){if(!this._formParametersPromise){this._formParametersPromise=this._parseFormParameters();}
return this._formParametersPromise;}
responseHttpVersion(){const headersText=this._responseHeadersText;if(!headersText){const version=this.responseHeaderValue('version')||this.responseHeaderValue(':version');if(version){return version;}
return this._filteredProtocolName();}
const firstLine=headersText.split(/\r\n/)[0];const match=firstLine.match(/^(HTTP\/\d+\.\d+)/);return match?match[1]:'HTTP/0.9';}
_parseParameters(queryString){function parseNameValue(pair){const position=pair.indexOf('=');if(position===-1){return{name:pair,value:''};}
return{name:pair.substring(0,position),value:pair.substring(position+1)};}
return queryString.split('&').map(parseNameValue);}
_parseMultipartFormDataParameters(data,boundary){const sanitizedBoundary=boundary.escapeForRegExp();const keyValuePattern=new RegExp('^\\r\\ncontent-disposition\\s*:\\s*form-data\\s*;\\s*name="([^"]*)"(?:\\s*;\\s*filename="([^"]*)")?'+'(?:\\r\\ncontent-type\\s*:\\s*([^\\r\\n]*))?'+'\\r\\n\\r\\n'+'(.*)'+'\\r\\n$','is');const fields=data.split(new RegExp(`--${sanitizedBoundary}(?:--\s*$)?`,'g'));return fields.reduce(parseMultipartField,[]);function parseMultipartField(result,field){const[match,name,filename,contentType,value]=field.match(keyValuePattern)||[];if(!match){return result;}
const processedValue=(filename||contentType)?ls`(binary)`:value;result.push({name,value:processedValue});return result;}}
_computeHeaderValue(headers,headerName){headerName=headerName.toLowerCase();const values=[];for(let i=0;i<headers.length;++i){if(headers[i].name.toLowerCase()===headerName){values.push(headers[i].value);}}
if(!values.length){return undefined;}
if(headerName==='set-cookie'){return values.join('\n');}
return values.join(', ');}
contentData(){if(this._contentData){return this._contentData;}
if(this._contentDataProvider){this._contentData=this._contentDataProvider();}else{this._contentData=NetworkManager.requestContentData(this);}
return this._contentData;}
setContentDataProvider(dataProvider){console.assert(!this._contentData,'contentData can only be set once.');this._contentDataProvider=dataProvider;}
contentURL(){return this._url;}
contentType(){return this._resourceType;}
async contentEncoded(){return(await this.contentData()).encoded;}
async requestContent(){const{content,error,encoded}=await this.contentData();return({content,error,isEncoded:encoded,});}
async searchInContent(query,caseSensitive,isRegex){if(!this._contentDataProvider){return NetworkManager.searchInRequest(this,query,caseSensitive,isRegex);}
const contentData=await this.contentData();let content=contentData.content;if(!content){return[];}
if(contentData.encoded){content=window.atob(content);}
return TextUtils$1.performSearchInContent(content,query,caseSensitive,isRegex);}
isHttpFamily(){return!!this.url().match(/^https?:/i);}
requestContentType(){return this.requestHeaderValue('Content-Type');}
hasErrorStatusCode(){return this.statusCode>=400;}
setInitialPriority(priority){this._initialPriority=priority;}
initialPriority(){return this._initialPriority;}
setPriority(priority){this._currentPriority=priority;}
priority(){return this._currentPriority||this._initialPriority||null;}
setSignedExchangeInfo(info){this._signedExchangeInfo=info;}
signedExchangeInfo(){return this._signedExchangeInfo;}
async populateImageSource(image){const{content,encoded}=await this.contentData();let imageSrc=ContentProvider.contentAsDataURL(content,this._mimeType,encoded);if(imageSrc===null&&!this._failed){const cacheControl=this.responseHeaderValue('cache-control')||'';if(!cacheControl.includes('no-cache')){imageSrc=this._url;}}
if(imageSrc!==null){image.src=imageSrc;}}
initiator(){return this._initiator;}
frames(){return this._frames;}
addProtocolFrameError(errorMessage,time){this.addFrame({type:WebSocketFrameType.Error,text:errorMessage,time:this.pseudoWallTime(time),opCode:-1,mask:false});}
addProtocolFrame(response,time,sent){const type=sent?WebSocketFrameType.Send:WebSocketFrameType.Receive;this.addFrame({type:type,text:response.payloadData,time:this.pseudoWallTime(time),opCode:response.opcode,mask:response.mask});}
addFrame(frame){this._frames.push(frame);this.dispatchEventToListeners(Events$2.WebsocketFrameAdded,frame);}
eventSourceMessages(){return this._eventSourceMessages;}
addEventSourceMessage(time,eventName,eventId,data){const message={time:this.pseudoWallTime(time),eventName:eventName,eventId:eventId,data:data};this._eventSourceMessages.push(message);this.dispatchEventToListeners(Events$2.EventSourceMessageAdded,message);}
markAsRedirect(redirectCount){this._requestId=`${this._backendRequestId}:redirected.${redirectCount}`;}
setRequestIdForTest(requestId){this._backendRequestId=requestId;this._requestId=requestId;}
charset(){const contentTypeHeader=this.responseHeaderValue('content-type');if(!contentTypeHeader){return null;}
const responseCharsets=contentTypeHeader.replace(/ /g,'').split(';').filter(parameter=>parameter.toLowerCase().startsWith('charset=')).map(parameter=>parameter.slice('charset='.length));if(responseCharsets.length){return responseCharsets[0];}
return null;}
addExtraRequestInfo(extraRequestInfo){this._blockedRequestCookies=extraRequestInfo.blockedRequestCookies;this.setRequestHeaders(extraRequestInfo.requestHeaders);this._hasExtraRequestInfo=true;this.setRequestHeadersText('');}
hasExtraRequestInfo(){return this._hasExtraRequestInfo;}
blockedRequestCookies(){return this._blockedRequestCookies;}
addExtraResponseInfo(extraResponseInfo){this._blockedResponseCookies=extraResponseInfo.blockedResponseCookies;this.responseHeaders=extraResponseInfo.responseHeaders;if(extraResponseInfo.responseHeadersText){this.responseHeadersText=extraResponseInfo.responseHeadersText;if(!this.requestHeadersText()){let requestHeadersText=`${this.requestMethod} ${this.parsedURL.path}`;if(this.parsedURL.queryParams){requestHeadersText+=`?${this.parsedURL.queryParams}`;}
requestHeadersText+=' HTTP/1.1\r\n';for(const{name,value}of this.requestHeaders()){requestHeadersText+=`${name}: ${value}\r\n`;}
this.setRequestHeadersText(requestHeadersText);}}
this._hasExtraResponseInfo=true;}
hasExtraResponseInfo(){return this._hasExtraResponseInfo;}
blockedResponseCookies(){return this._blockedResponseCookies;}}
const Events$2={FinishedLoading:Symbol('FinishedLoading'),TimingChanged:Symbol('TimingChanged'),RemoteAddressChanged:Symbol('RemoteAddressChanged'),RequestHeadersChanged:Symbol('RequestHeadersChanged'),ResponseHeadersChanged:Symbol('ResponseHeadersChanged'),WebsocketFrameAdded:Symbol('WebsocketFrameAdded'),EventSourceMessageAdded:Symbol('EventSourceMessageAdded')};const InitiatorType={Other:'other',Parser:'parser',Redirect:'redirect',Script:'script',Preload:'preload',SignedExchange:'signedExchange'};const WebSocketFrameType={Send:'send',Receive:'receive',Error:'error'};const cookieBlockedReasonToUiString=function(blockedReason){switch(blockedReason){case Protocol.Network.CookieBlockedReason.SecureOnly:return ls`This cookie was blocked because it had the "Secure" attribute and the connection was not secure.`;case Protocol.Network.CookieBlockedReason.NotOnPath:return ls`This cookie was blocked because its path was not an exact match for or a superdirectory of the request url's path.`;case Protocol.Network.CookieBlockedReason.DomainMismatch:return ls`This cookie was blocked because neither did the request URL's domain exactly match the cookie's domain, nor was the request URL's domain a subdomain of the cookie's Domain attribute value.`;case Protocol.Network.CookieBlockedReason.SameSiteStrict:return ls`This cookie was blocked because it had the "SameSite=Strict" attribute and the request was made from a different site. This includes top-level navigation requests initiated by other sites.`;case Protocol.Network.CookieBlockedReason.SameSiteLax:return ls`This cookie was blocked because it had the "SameSite=Lax" attribute and the request was made from a different site and was not initiated by a top-level navigation.`;case Protocol.Network.CookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:return ls`This cookie didn't specify a "SameSite" attribute when it was stored and was defaulted to "SameSite=Lax," and was blocked because the request was made from a different site and was not initiated by a top-level navigation. The cookie had to have been set with "SameSite=None" to enable cross-site usage.`;case Protocol.Network.CookieBlockedReason.SameSiteNoneInsecure:return ls`This cookie was blocked because it had the "SameSite=None" attribute but was not marked "Secure". Cookies without SameSite restrictions must be marked "Secure" and sent over a secure connection.`;case Protocol.Network.CookieBlockedReason.UserPreferences:return ls`This cookie was blocked due to user preferences.`;case Protocol.Network.CookieBlockedReason.UnknownError:return ls`An unknown error was encountered when trying to send this cookie.`;}
return'';};const setCookieBlockedReasonToUiString=function(blockedReason){switch(blockedReason){case Protocol.Network.SetCookieBlockedReason.SecureOnly:return ls`This Set-Cookie was blocked because it had the "Secure" attribute but was not received over a secure connection.`;case Protocol.Network.SetCookieBlockedReason.SameSiteStrict:return ls`This Set-Cookie was blocked because it had the "SameSite=Strict" attribute but came from a cross-site response which was not the response to a top-level navigation.`;case Protocol.Network.SetCookieBlockedReason.SameSiteLax:return ls`This Set-Cookie was blocked because it had the "SameSite=Lax" attribute but came from a cross-site response which was not the response to a top-level navigation.`;case Protocol.Network.SetCookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:return ls`This Set-Cookie didn't specify a "SameSite" attribute and was defaulted to "SameSite=Lax," and was blocked because it came from a cross-site response which was not the response to a top-level navigation. The Set-Cookie had to have been set with "SameSite=None" to enable cross-site usage.`;case Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure:return ls`This Set-Cookie was blocked because it had the "SameSite=None" attribute but did not have the "Secure" attribute, which is required in order to use "SameSite=None".`;case Protocol.Network.SetCookieBlockedReason.UserPreferences:return ls`This Set-Cookie was blocked due to user preferences.`;case Protocol.Network.SetCookieBlockedReason.SyntaxError:return ls`This Set-Cookie had invalid syntax.`;case Protocol.Network.SetCookieBlockedReason.SchemeNotSupported:return ls`The scheme of this connection is not allowed to store cookies.`;case Protocol.Network.SetCookieBlockedReason.OverwriteSecure:return ls`This Set-Cookie was blocked because it was not sent over a secure connection and would have overwritten a cookie with the Secure attribute.`;case Protocol.Network.SetCookieBlockedReason.InvalidDomain:return ls`This Set-Cookie was blocked because its Domain attribute was invalid with regards to the current host url.`;case Protocol.Network.SetCookieBlockedReason.InvalidPrefix:return ls`This Set-Cookie was blocked because it used the "__Secure-" or "__Host-" prefix in its name and broke the additional rules applied to cookies with these prefixes as defined in https://tools.ietf.org/html/draft-west-cookie-prefixes-05.`;case Protocol.Network.SetCookieBlockedReason.UnknownError:return ls`An unknown error was encountered when trying to store this cookie.`;}
return'';};const cookieBlockedReasonToAttribute=function(blockedReason){switch(blockedReason){case Protocol.Network.CookieBlockedReason.SecureOnly:return Attributes.Secure;case Protocol.Network.CookieBlockedReason.NotOnPath:return Attributes.Path;case Protocol.Network.CookieBlockedReason.DomainMismatch:return Attributes.Domain;case Protocol.Network.CookieBlockedReason.SameSiteStrict:case Protocol.Network.CookieBlockedReason.SameSiteLax:case Protocol.Network.CookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:case Protocol.Network.CookieBlockedReason.SameSiteNoneInsecure:return Attributes.SameSite;case Protocol.Network.CookieBlockedReason.UserPreferences:case Protocol.Network.CookieBlockedReason.UnknownError:return null;}
return null;};const setCookieBlockedReasonToAttribute=function(blockedReason){switch(blockedReason){case Protocol.Network.SetCookieBlockedReason.SecureOnly:case Protocol.Network.SetCookieBlockedReason.OverwriteSecure:return Attributes.Secure;case Protocol.Network.SetCookieBlockedReason.SameSiteStrict:case Protocol.Network.SetCookieBlockedReason.SameSiteLax:case Protocol.Network.SetCookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:case Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure:return Attributes.SameSite;case Protocol.Network.SetCookieBlockedReason.InvalidDomain:return Attributes.Domain;case Protocol.Network.SetCookieBlockedReason.InvalidPrefix:return Attributes.Name;case Protocol.Network.SetCookieBlockedReason.UserPreferences:case Protocol.Network.SetCookieBlockedReason.SyntaxError:case Protocol.Network.SetCookieBlockedReason.SchemeNotSupported:case Protocol.Network.SetCookieBlockedReason.UnknownError:return null;}
return null;};let NameValue;let WebSocketFrame;let BlockedSetCookieWithReason;let BlockedCookieWithReason;let ContentData;let EventSourceMessage;let ExtraRequestInfo;let ExtraResponseInfo;var NetworkRequest$1=Object.freeze({__proto__:null,NetworkRequest:NetworkRequest,Events:Events$2,InitiatorType:InitiatorType,WebSocketFrameType:WebSocketFrameType,cookieBlockedReasonToUiString:cookieBlockedReasonToUiString,setCookieBlockedReasonToUiString:setCookieBlockedReasonToUiString,cookieBlockedReasonToAttribute:cookieBlockedReasonToAttribute,setCookieBlockedReasonToAttribute:setCookieBlockedReasonToAttribute,NameValue:NameValue,WebSocketFrame:WebSocketFrame,BlockedSetCookieWithReason:BlockedSetCookieWithReason,BlockedCookieWithReason:BlockedCookieWithReason,ContentData:ContentData,EventSourceMessage:EventSourceMessage,ExtraRequestInfo:ExtraRequestInfo,ExtraResponseInfo:ExtraResponseInfo});class RemoteObject{static fromLocalObject(value){return new LocalJSONObject(value);}
static type(remoteObject){if(remoteObject===null){return'null';}
const type=typeof remoteObject;if(type!=='object'&&type!=='function'){return type;}
return remoteObject.type;}
static arrayNameFromDescription(description){return description.replace(_descriptionLengthParenRegex,'').replace(_descriptionLengthSquareRegex,'');}
static arrayLength(object){if(object.subtype!=='array'&&object.subtype!=='typedarray'){return 0;}
const parenMatches=object.description.match(_descriptionLengthParenRegex);const squareMatches=object.description.match(_descriptionLengthSquareRegex);return parenMatches?parseInt(parenMatches[1],10):(squareMatches?parseInt(squareMatches[1],10):0);}
static unserializableDescription(object){const type=typeof object;if(type==='number'){const description=String(object);if(object===0&&1/object<0){return UnserializableNumber.Negative0;}
if(description===UnserializableNumber.NaN||description===UnserializableNumber.Infinity||description===UnserializableNumber.NegativeInfinity){return description;}}
if(type==='bigint'){return object+'n';}
return null;}
static toCallArgument(object){const type=typeof object;if(type==='undefined'){return{};}
const unserializableDescription=RemoteObject.unserializableDescription(object);if(type==='number'){if(unserializableDescription!==null){return{unserializableValue:unserializableDescription};}
return{value:object};}
if(type==='bigint'){return{unserializableValue:(unserializableDescription)};}
if(type==='string'||type==='boolean'){return{value:object};}
if(!object){return{value:null};}
if(object instanceof RemoteObject){const unserializableValue=object.unserializableValue();if(unserializableValue!==undefined){return{unserializableValue:unserializableValue};}}else if(object.unserializableValue!==undefined){return{unserializableValue:object.unserializableValue};}
if(typeof object.objectId!=='undefined'){return{objectId:object.objectId};}
return{value:object.value};}
static async loadFromObjectPerProto(object,generatePreview){const result=await Promise.all([object.getAllProperties(true,generatePreview),object.getOwnProperties(generatePreview)]);const accessorProperties=result[0].properties;const ownProperties=result[1].properties;const internalProperties=result[1].internalProperties;if(!ownProperties||!accessorProperties){return({properties:null,internalProperties:null});}
const propertiesMap=new Map();const propertySymbols=[];for(let i=0;i<accessorProperties.length;i++){const property=accessorProperties[i];if(property.symbol){propertySymbols.push(property);}else{propertiesMap.set(property.name,property);}}
for(let i=0;i<ownProperties.length;i++){const property=ownProperties[i];if(property.isAccessorProperty()){continue;}
if(property.symbol){propertySymbols.push(property);}else{propertiesMap.set(property.name,property);}}
return{properties:[...propertiesMap.values()].concat(propertySymbols),internalProperties:internalProperties?internalProperties:null};}
customPreview(){return null;}
get objectId(){return'Not implemented';}
get type(){throw'Not implemented';}
get subtype(){throw'Not implemented';}
get value(){throw'Not implemented';}
unserializableValue(){throw'Not implemented';}
get description(){throw'Not implemented';}
get hasChildren(){throw'Not implemented';}
get preview(){return undefined;}
get className(){return null;}
arrayLength(){throw'Not implemented';}
getOwnProperties(generatePreview){throw'Not implemented';}
getAllProperties(accessorPropertiesOnly,generatePreview){throw'Not implemented';}
async deleteProperty(name){throw'Not implemented';}
async setPropertyValue(name,value){throw'Not implemented';}
callFunction(functionDeclaration,args){throw'Not implemented';}
callFunctionJSON(functionDeclaration,args){throw'Not implemented';}
release(){}
debuggerModel(){throw new Error('DebuggerModel-less object');}
runtimeModel(){throw new Error('RuntimeModel-less object');}
isNode(){return false;}}
class RemoteObjectImpl extends RemoteObject{constructor(runtimeModel,objectId,type,subtype,value,unserializableValue,description,preview,customPreview,className){super();this._runtimeModel=runtimeModel;this._runtimeAgent=runtimeModel.target().runtimeAgent();this._type=type;this._subtype=subtype;if(objectId){this._objectId=objectId;this._description=description;this._hasChildren=(type!=='symbol');this._preview=preview;}else{this._description=description;if(!this.description&&unserializableValue){this._description=unserializableValue;}
if(!this._description&&(typeof value!=='object'||value===null)){this._description=value+'';}
this._hasChildren=false;if(typeof unserializableValue==='string'){this._unserializableValue=unserializableValue;if(unserializableValue===UnserializableNumber.Infinity||unserializableValue===UnserializableNumber.NegativeInfinity||unserializableValue===UnserializableNumber.Negative0||unserializableValue===UnserializableNumber.NaN){this._value=Number(unserializableValue);}else if(type==='bigint'&&unserializableValue.endsWith('n')){this._value=BigInt(unserializableValue.substring(0,unserializableValue.length-1));}else{this._value=unserializableValue;}}else{this._value=value;}}
this._customPreview=customPreview||null;this._className=typeof className==='string'?className:null;}
customPreview(){return this._customPreview;}
get objectId(){return this._objectId;}
get type(){return this._type;}
get subtype(){return this._subtype;}
get value(){return this._value;}
unserializableValue(){return this._unserializableValue;}
get description(){return this._description;}
get hasChildren(){return this._hasChildren;}
get preview(){return this._preview;}
get className(){return this._className;}
getOwnProperties(generatePreview){return this.doGetProperties(true,false,generatePreview);}
getAllProperties(accessorPropertiesOnly,generatePreview){return this.doGetProperties(false,accessorPropertiesOnly,generatePreview);}
async doGetProperties(ownProperties,accessorPropertiesOnly,generatePreview){if(!this._objectId){return({properties:null,internalProperties:null});}
const response=await this._runtimeAgent.invoke_getProperties({objectId:this._objectId,ownProperties,accessorPropertiesOnly,generatePreview});if(response[InspectorBackend.ProtocolError]){return({properties:null,internalProperties:null});}
if(response.exceptionDetails){this._runtimeModel.exceptionThrown(Date.now(),response.exceptionDetails);return({properties:null,internalProperties:null});}
const{result:properties=[],internalProperties=[],privateProperties=[]}=response;const result=[];for(const property of properties){const propertyValue=property.value?this._runtimeModel.createRemoteObject(property.value):null;const propertySymbol=property.symbol?this._runtimeModel.createRemoteObject(property.symbol):null;const remoteProperty=new RemoteObjectProperty(property.name,propertyValue,!!property.enumerable,!!property.writable,!!property.isOwn,!!property.wasThrown,propertySymbol);if(typeof property.value==='undefined'){if(property.get&&property.get.type!=='undefined'){remoteProperty.getter=this._runtimeModel.createRemoteObject(property.get);}
if(property.set&&property.set.type!=='undefined'){remoteProperty.setter=this._runtimeModel.createRemoteObject(property.set);}}
result.push(remoteProperty);}
for(const property of privateProperties){const propertyValue=this._runtimeModel.createRemoteObject(property.value);const remoteProperty=new RemoteObjectProperty(property.name,propertyValue,true,true,true,false,undefined,false,undefined,true);result.push(remoteProperty);}
const internalPropertiesResult=[];for(const property of internalProperties){if(!property.value){continue;}
if(property.name==='[[StableObjectId]]'){continue;}
const propertyValue=this._runtimeModel.createRemoteObject(property.value);internalPropertiesResult.push(new RemoteObjectProperty(property.name,propertyValue,true,false,undefined,undefined,undefined,true));}
return{properties:result,internalProperties:internalPropertiesResult};}
async setPropertyValue(name,value){if(!this._objectId){return'Can’t set a property of non-object.';}
const response=await this._runtimeAgent.invoke_evaluate({expression:value,silent:true});if(response[InspectorBackend.ProtocolError]||response.exceptionDetails){return response[InspectorBackend.ProtocolError]||(response.result.type!=='string'?response.result.description:(response.result.value));}
if(typeof name==='string'){name=RemoteObject.toCallArgument(name);}
const resultPromise=this.doSetObjectPropertyValue(response.result,name);if(response.result.objectId){this._runtimeAgent.releaseObject(response.result.objectId);}
return resultPromise;}
async doSetObjectPropertyValue(result,name){const setPropertyValueFunction='function(a, b) { this[a] = b; }';const argv=[name,RemoteObject.toCallArgument(result)];const response=await this._runtimeAgent.invoke_callFunctionOn({objectId:this._objectId,functionDeclaration:setPropertyValueFunction,arguments:argv,silent:true});const error=response[InspectorBackend.ProtocolError];return error||response.exceptionDetails?error||response.result.description:undefined;}
async deleteProperty(name){if(!this._objectId){return'Can’t delete a property of non-object.';}
const deletePropertyFunction='function(a) { delete this[a]; return !(a in this); }';const response=await this._runtimeAgent.invoke_callFunctionOn({objectId:this._objectId,functionDeclaration:deletePropertyFunction,arguments:[name],silent:true});if(response[InspectorBackend.ProtocolError]||response.exceptionDetails){return response[InspectorBackend.ProtocolError]||response.result.description;}
if(!response.result.value){return'Failed to delete property.';}}
async callFunction(functionDeclaration,args){const response=await this._runtimeAgent.invoke_callFunctionOn({objectId:this._objectId,functionDeclaration:functionDeclaration.toString(),arguments:args,silent:true});if(response[InspectorBackend.ProtocolError]){return{object:null,wasThrown:false};}
return{object:this._runtimeModel.createRemoteObject(response.result),wasThrown:!!response.exceptionDetails};}
async callFunctionJSON(functionDeclaration,args){const response=await this._runtimeAgent.invoke_callFunctionOn({objectId:this._objectId,functionDeclaration:functionDeclaration.toString(),arguments:args,silent:true,returnByValue:true});return response[InspectorBackend.ProtocolError]||response.exceptionDetails?null:response.result.value;}
release(){if(!this._objectId){return;}
this._runtimeAgent.releaseObject(this._objectId);}
arrayLength(){return RemoteObject.arrayLength(this);}
debuggerModel(){return this._runtimeModel.debuggerModel();}
runtimeModel(){return this._runtimeModel;}
isNode(){return!!this._objectId&&this.type==='object'&&this.subtype==='node';}}
class ScopeRemoteObject extends RemoteObjectImpl{constructor(runtimeModel,objectId,scopeRef,type,subtype,value,unserializableValue,description,preview){super(runtimeModel,objectId,type,subtype,value,unserializableValue,description,preview);this._scopeRef=scopeRef;this._savedScopeProperties=undefined;}
async doGetProperties(ownProperties,accessorPropertiesOnly,generatePreview){if(accessorPropertiesOnly){return({properties:[],internalProperties:[]});}
if(this._savedScopeProperties){return{properties:this._savedScopeProperties.slice(),internalProperties:null};}
const allProperties=await super.doGetProperties(ownProperties,accessorPropertiesOnly,true);if(this._scopeRef&&Array.isArray(allProperties.properties)){this._savedScopeProperties=allProperties.properties.slice();if(!this._scopeRef.callFrameId){for(const property of this._savedScopeProperties){property.writable=false;}}}
return allProperties;}
async doSetObjectPropertyValue(result,argumentName){const name=(argumentName.value);const error=await this.debuggerModel().setVariableValue(this._scopeRef.number,name,RemoteObject.toCallArgument(result),this._scopeRef.callFrameId);if(error){return error;}
if(this._savedScopeProperties){for(const property of this._savedScopeProperties){if(property.name===name){property.value=this._runtimeModel.createRemoteObject(result);}}}}}
class ScopeRef{constructor(number,callFrameId){this.number=number;this.callFrameId=callFrameId;}}
class RemoteObjectProperty{constructor(name,value,enumerable,writable,isOwn,wasThrown,symbol,synthetic,syntheticSetter,isPrivate){this.name=name;if(value!==null){this.value=value;}
this.enumerable=typeof enumerable!=='undefined'?enumerable:true;const isNonSyntheticOrSyntheticWritable=!synthetic||!!syntheticSetter;this.writable=typeof writable!=='undefined'?writable:isNonSyntheticOrSyntheticWritable;this.isOwn=!!isOwn;this.wasThrown=!!wasThrown;if(symbol){this.symbol=symbol;}
this.synthetic=!!synthetic;if(syntheticSetter){this.syntheticSetter=syntheticSetter;}
this.private=!!isPrivate;}
async setSyntheticValue(expression){if(!this.syntheticSetter){return false;}
const result=await this.syntheticSetter(expression);if(result){this.value=result;}
return!!result;}
isAccessorProperty(){return!!(this.getter||this.setter);}}
class LocalJSONObject extends RemoteObject{constructor(value){super();this._value=value;this._cachedDescription;this._cachedChildren;}
get objectId(){return undefined;}
get value(){return this._value;}
unserializableValue(){const unserializableDescription=RemoteObject.unserializableDescription(this._value);return unserializableDescription||undefined;}
get description(){if(this._cachedDescription){return this._cachedDescription;}
function formatArrayItem(property){return this._formatValue(property.value);}
function formatObjectItem(property){let name=property.name;if(/^\s|\s$|^$|\n/.test(name)){name='"'+name.replace(/\n/g,'\u21B5')+'"';}
return name+': '+this._formatValue(property.value);}
if(this.type==='object'){switch(this.subtype){case'array':this._cachedDescription=this._concatenate('[',']',formatArrayItem.bind(this));break;case'date':this._cachedDescription=''+this._value;break;case'null':this._cachedDescription='null';break;default:this._cachedDescription=this._concatenate('{','}',formatObjectItem.bind(this));}}else{this._cachedDescription=String(this._value);}
return this._cachedDescription;}
_formatValue(value){if(!value){return'undefined';}
const description=value.description||'';if(value.type==='string'){return'"'+description.replace(/\n/g,'\u21B5')+'"';}
return description;}
_concatenate(prefix,suffix,formatProperty){const previewChars=100;let buffer=prefix;const children=this._children();for(let i=0;i<children.length;++i){const itemDescription=formatProperty(children[i]);if(buffer.length+itemDescription.length>previewChars){buffer+=',…';break;}
if(i){buffer+=', ';}
buffer+=itemDescription;}
buffer+=suffix;return buffer;}
get type(){return typeof this._value;}
get subtype(){if(this._value===null){return'null';}
if(Array.isArray(this._value)){return'array';}
if(this._value instanceof Date){return'date';}
return undefined;}
get hasChildren(){if((typeof this._value!=='object')||(this._value===null)){return false;}
return!!Object.keys((this._value)).length;}
getOwnProperties(generatePreview){return Promise.resolve(({properties:this._children(),internalProperties:null}));}
getAllProperties(accessorPropertiesOnly,generatePreview){if(accessorPropertiesOnly){return Promise.resolve(({properties:[],internalProperties:null}));}
return Promise.resolve(({properties:this._children(),internalProperties:null}));}
_children(){if(!this.hasChildren){return[];}
const value=(this._value);function buildProperty(propName){let propValue=value[propName];if(!(propValue instanceof RemoteObject)){propValue=RemoteObject.fromLocalObject(propValue);}
return new RemoteObjectProperty(propName,propValue);}
if(!this._cachedChildren){this._cachedChildren=Object.keys(value).map(buildProperty);}
return this._cachedChildren;}
arrayLength(){return Array.isArray(this._value)?this._value.length:0;}
callFunction(functionDeclaration,args){const target=(this._value);const rawArgs=args?args.map(arg=>arg.value):[];let result;let wasThrown=false;try{result=functionDeclaration.apply(target,rawArgs);}catch(e){wasThrown=true;}
const object=RemoteObject.fromLocalObject(result);return Promise.resolve(({object,wasThrown}));}
callFunctionJSON(functionDeclaration,args){const target=(this._value);const rawArgs=args?args.map(arg=>arg.value):[];let result;try{result=functionDeclaration.apply(target,rawArgs);}catch(e){result=null;}
return Promise.resolve(result);}}
class RemoteArray{constructor(object){this._object=object;}
static objectAsArray(object){if(!object||object.type!=='object'||(object.subtype!=='array'&&object.subtype!=='typedarray')){throw new Error('Object is empty or not an array');}
return new RemoteArray(object);}
static createFromRemoteObjects(objects){if(!objects.length){throw new Error('Input array is empty');}
const objectArguments=[];for(let i=0;i<objects.length;++i){objectArguments.push(RemoteObject.toCallArgument(objects[i]));}
return objects[0].callFunction(createArray,objectArguments).then(returnRemoteArray);function createArray(){if(arguments.length>1){return new Array(arguments);}
return[arguments[0]];}
function returnRemoteArray(result){if(result.wasThrown||!result.object){throw new Error('Call function throws exceptions or returns empty value');}
return RemoteArray.objectAsArray(result.object);}}
at(index){if(index<0||index>this._object.arrayLength()){throw new Error('Out of range');}
return this._object.callFunction(at,[RemoteObject.toCallArgument(index)]).then(assertCallFunctionResult);function at(index){return this[index];}
function assertCallFunctionResult(result){if(result.wasThrown||!result.object){throw new Error('Exception in callFunction or result value is empty');}
return result.object;}}
length(){return this._object.arrayLength();}
map(func){const promises=[];for(let i=0;i<this.length();++i){promises.push(this.at(i).then(func));}
return Promise.all(promises);}
object(){return this._object;}}
class RemoteFunction{constructor(object){this._object=object;}
static objectAsFunction(object){if(!object||object.type!=='function'){throw new Error('Object is empty or not a function');}
return new RemoteFunction(object);}
targetFunction(){return this._object.getOwnProperties(false).then(targetFunction.bind(this));function targetFunction(ownProperties){if(!ownProperties.internalProperties){return this._object;}
const internalProperties=ownProperties.internalProperties;for(const property of internalProperties){if(property.name==='[[TargetFunction]]'){return property.value;}}
return this._object;}}
targetFunctionDetails(){return this.targetFunction().then(functionDetails.bind(this));function functionDetails(targetFunction){const boundReleaseFunctionDetails=releaseTargetFunction.bind(null,this._object!==targetFunction?targetFunction:null);return targetFunction.debuggerModel().functionDetailsPromise(targetFunction).then(boundReleaseFunctionDetails);}
function releaseTargetFunction(targetFunction,functionDetails){if(targetFunction){targetFunction.release();}
return functionDetails;}}
object(){return this._object;}}
const _descriptionLengthParenRegex=/\(([0-9]+)\)/;const _descriptionLengthSquareRegex=/\[([0-9]+)\]/;const UnserializableNumber={Negative0:('-0'),NaN:('NaN'),Infinity:('Infinity'),NegativeInfinity:('-Infinity')};let CallFunctionResult;let GetPropertiesResult;var RemoteObject$1=Object.freeze({__proto__:null,RemoteObject:RemoteObject,RemoteObjectImpl:RemoteObjectImpl,ScopeRemoteObject:ScopeRemoteObject,ScopeRef:ScopeRef,RemoteObjectProperty:RemoteObjectProperty,LocalJSONObject:LocalJSONObject,RemoteArray:RemoteArray,RemoteFunction:RemoteFunction,CallFunctionResult:CallFunctionResult,GetPropertiesResult:GetPropertiesResult});class CSSStyleSheetHeader{constructor(cssModel,payload){this._cssModel=cssModel;this.id=payload.styleSheetId;this.frameId=payload.frameId;this.sourceURL=payload.sourceURL;this.hasSourceURL=!!payload.hasSourceURL;this.origin=payload.origin;this.title=payload.title;this.disabled=payload.disabled;this.isInline=payload.isInline;this.startLine=payload.startLine;this.startColumn=payload.startColumn;this.endLine=payload.endLine;this.endColumn=payload.endColumn;this.contentLength=payload.length;if(payload.ownerNode){this.ownerNode=new DeferredDOMNode(cssModel.target(),payload.ownerNode);}
this.setSourceMapURL(payload.sourceMapURL);}
originalContentProvider(){if(!this._originalContentProvider){const lazyContent=(async()=>{const originalText=await this._cssModel.originalStyleSheetText(this);if(originalText===null){return{error:ls`Could not find the original style sheet.`,isEncoded:false};}
return{content:originalText,isEncoded:false};});this._originalContentProvider=new StaticContentProvider.StaticContentProvider(this.contentURL(),this.contentType(),lazyContent);}
return this._originalContentProvider;}
setSourceMapURL(sourceMapURL){this.sourceMapURL=sourceMapURL;}
cssModel(){return this._cssModel;}
isAnonymousInlineStyleSheet(){return!this.resourceURL()&&!this._cssModel.sourceMapManager().sourceMapForClient(this);}
resourceURL(){return this.isViaInspector()?this._viaInspectorResourceURL():this.sourceURL;}
_viaInspectorResourceURL(){const frame=this._cssModel.target().model(ResourceTreeModel).frameForId(this.frameId);console.assert(frame);const parsedURL=new ParsedURL.ParsedURL(frame.url);let fakeURL='inspector://'+parsedURL.host+parsedURL.folderPathComponents;if(!fakeURL.endsWith('/')){fakeURL+='/';}
fakeURL+='inspector-stylesheet';return fakeURL;}
lineNumberInSource(lineNumberInStyleSheet){return this.startLine+lineNumberInStyleSheet;}
columnNumberInSource(lineNumberInStyleSheet,columnNumberInStyleSheet){return(lineNumberInStyleSheet?0:this.startColumn)+columnNumberInStyleSheet;}
containsLocation(lineNumber,columnNumber){const afterStart=(lineNumber===this.startLine&&columnNumber>=this.startColumn)||lineNumber>this.startLine;const beforeEnd=lineNumber<this.endLine||(lineNumber===this.endLine&&columnNumber<=this.endColumn);return afterStart&&beforeEnd;}
contentURL(){return this.resourceURL();}
contentType(){return ResourceType.resourceTypes.Stylesheet;}
contentEncoded(){return Promise.resolve(false);}
async requestContent(){try{const cssText=await this._cssModel.getStyleSheetText(this.id);return{content:(cssText),isEncoded:false};}catch(err){return{error:ls`There was an error retrieving the source styles.`,isEncoded:false,};}}
async searchInContent(query,caseSensitive,isRegex){const{content}=await this.requestContent();return TextUtils$1.performSearchInContent(content||'',query,caseSensitive,isRegex);}
isViaInspector(){return this.origin==='inspector';}}
var CSSStyleSheetHeader$1=Object.freeze({__proto__:null,CSSStyleSheetHeader:CSSStyleSheetHeader});class CSSMediaQuery{constructor(payload){this._active=payload.active;this._expressions=[];for(let j=0;j<payload.expressions.length;++j){this._expressions.push(CSSMediaQueryExpression.parsePayload(payload.expressions[j]));}}
static parsePayload(payload){return new CSSMediaQuery(payload);}
active(){return this._active;}
expressions(){return this._expressions;}}
class CSSMediaQueryExpression{constructor(payload){this._value=payload.value;this._unit=payload.unit;this._feature=payload.feature;this._valueRange=payload.valueRange?TextUtils.TextRange.fromObject(payload.valueRange):null;this._computedLength=payload.computedLength||null;}
static parsePayload(payload){return new CSSMediaQueryExpression(payload);}
value(){return this._value;}
unit(){return this._unit;}
feature(){return this._feature;}
valueRange(){return this._valueRange;}
computedLength(){return this._computedLength;}}
class CSSMedia{constructor(cssModel,payload){this._cssModel=cssModel;this._reinitialize(payload);}
static parsePayload(cssModel,payload){return new CSSMedia(cssModel,payload);}
static parseMediaArrayPayload(cssModel,payload){const result=[];for(let i=0;i<payload.length;++i){result.push(CSSMedia.parsePayload(cssModel,payload[i]));}
return result;}
_reinitialize(payload){this.text=payload.text;this.source=payload.source;this.sourceURL=payload.sourceURL||'';this.range=payload.range?TextUtils.TextRange.fromObject(payload.range):null;this.styleSheetId=payload.styleSheetId;this.mediaList=null;if(payload.mediaList){this.mediaList=[];for(let i=0;i<payload.mediaList.length;++i){this.mediaList.push(CSSMediaQuery.parsePayload(payload.mediaList[i]));}}}
rebase(edit){if(this.styleSheetId!==edit.styleSheetId||!this.range){return;}
if(edit.oldRange.equal(this.range)){this._reinitialize((edit.payload));}else{this.range=this.range.rebaseAfterTextEdit(edit.oldRange,edit.newRange);}}
equal(other){if(!this.styleSheetId||!this.range||!other.range){return false;}
return this.styleSheetId===other.styleSheetId&&this.range.equal(other.range);}
active(){if(!this.mediaList){return true;}
for(let i=0;i<this.mediaList.length;++i){if(this.mediaList[i].active()){return true;}}
return false;}
lineNumberInSource(){if(!this.range){return undefined;}
const header=this.header();if(!header){return undefined;}
return header.lineNumberInSource(this.range.startLine);}
columnNumberInSource(){if(!this.range){return undefined;}
const header=this.header();if(!header){return undefined;}
return header.columnNumberInSource(this.range.startLine,this.range.startColumn);}
header(){return this.styleSheetId?this._cssModel.styleSheetHeaderForId(this.styleSheetId):null;}
rawLocation(){const header=this.header();if(!header||this.lineNumberInSource()===undefined){return null;}
const lineNumber=Number(this.lineNumberInSource());return new CSSLocation(header,lineNumber,this.columnNumberInSource());}}
const Source={LINKED_SHEET:'linkedSheet',INLINE_SHEET:'inlineSheet',MEDIA_RULE:'mediaRule',IMPORT_RULE:'importRule'};var CSSMedia$1=Object.freeze({__proto__:null,CSSMediaQuery:CSSMediaQuery,CSSMediaQueryExpression:CSSMediaQueryExpression,CSSMedia:CSSMedia,Source:Source});class CSSRule{constructor(cssModel,payload){this._cssModel=cssModel;this.styleSheetId=payload.styleSheetId;if(this.styleSheetId){const styleSheetHeader=cssModel.styleSheetHeaderForId(this.styleSheetId);this.sourceURL=styleSheetHeader.sourceURL;}
this.origin=payload.origin;this.style=new CSSStyleDeclaration(this._cssModel,this,payload.style,Type$2.Regular);}
rebase(edit){if(this.styleSheetId!==edit.styleSheetId){return;}
this.style.rebase(edit);}
resourceURL(){if(!this.styleSheetId){return'';}
const styleSheetHeader=this._cssModel.styleSheetHeaderForId(this.styleSheetId);return styleSheetHeader.resourceURL();}
isUserAgent(){return this.origin===Protocol.CSS.StyleSheetOrigin.UserAgent;}
isInjected(){return this.origin===Protocol.CSS.StyleSheetOrigin.Injected;}
isViaInspector(){return this.origin===Protocol.CSS.StyleSheetOrigin.Inspector;}
isRegular(){return this.origin===Protocol.CSS.StyleSheetOrigin.Regular;}
cssModel(){return this._cssModel;}}
class CSSValue{constructor(payload){this.text=payload.text;if(payload.range){this.range=TextUtils.TextRange.fromObject(payload.range);}}
rebase(edit){if(!this.range){return;}
this.range=this.range.rebaseAfterTextEdit(edit.oldRange,edit.newRange);}}
class CSSStyleRule extends CSSRule{constructor(cssModel,payload,wasUsed){super(cssModel,payload);this._reinitializeSelectors(payload.selectorList);this.media=payload.media?CSSMedia.parseMediaArrayPayload(cssModel,payload.media):[];this.wasUsed=wasUsed||false;}
static createDummyRule(cssModel,selectorText){const dummyPayload={selectorList:{selectors:[{text:selectorText}],},style:{styleSheetId:'0',range:new TextUtils.TextRange(0,0,0,0),shorthandEntries:[],cssProperties:[]}};return new CSSStyleRule(cssModel,(dummyPayload));}
_reinitializeSelectors(selectorList){this.selectors=[];for(let i=0;i<selectorList.selectors.length;++i){this.selectors.push(new CSSValue(selectorList.selectors[i]));}}
setSelectorText(newSelector){const styleSheetId=this.styleSheetId;if(!styleSheetId){throw'No rule stylesheet id';}
const range=this.selectorRange();if(!range){throw'Rule selector is not editable';}
return this._cssModel.setSelectorText(styleSheetId,range,newSelector);}
selectorText(){return this.selectors.map(selector=>selector.text).join(', ');}
selectorRange(){const firstRange=this.selectors[0].range;if(!firstRange){return null;}
const lastRange=this.selectors.peekLast().range;return new TextUtils.TextRange(firstRange.startLine,firstRange.startColumn,lastRange.endLine,lastRange.endColumn);}
lineNumberInSource(selectorIndex){const selector=this.selectors[selectorIndex];if(!selector||!selector.range||!this.styleSheetId){return 0;}
const styleSheetHeader=this._cssModel.styleSheetHeaderForId(this.styleSheetId);return styleSheetHeader.lineNumberInSource(selector.range.startLine);}
columnNumberInSource(selectorIndex){const selector=this.selectors[selectorIndex];if(!selector||!selector.range||!this.styleSheetId){return undefined;}
const styleSheetHeader=this._cssModel.styleSheetHeaderForId(this.styleSheetId);console.assert(styleSheetHeader);return styleSheetHeader.columnNumberInSource(selector.range.startLine,selector.range.startColumn);}
rebase(edit){if(this.styleSheetId!==edit.styleSheetId){return;}
if(this.selectorRange().equal(edit.oldRange)){this._reinitializeSelectors((edit.payload));}else{for(let i=0;i<this.selectors.length;++i){this.selectors[i].rebase(edit);}}
for(const media of this.media){media.rebase(edit);}
super.rebase(edit);}}
class CSSKeyframesRule{constructor(cssModel,payload){this._cssModel=cssModel;this._animationName=new CSSValue(payload.animationName);this._keyframes=payload.keyframes.map(keyframeRule=>new CSSKeyframeRule(cssModel,keyframeRule));}
name(){return this._animationName;}
keyframes(){return this._keyframes;}}
class CSSKeyframeRule extends CSSRule{constructor(cssModel,payload){super(cssModel,payload);this._reinitializeKey(payload.keyText);}
key(){return this._keyText;}
_reinitializeKey(payload){this._keyText=new CSSValue(payload);}
rebase(edit){if(this.styleSheetId!==edit.styleSheetId||!this._keyText.range){return;}
if(edit.oldRange.equal(this._keyText.range)){this._reinitializeKey((edit.payload));}else{this._keyText.rebase(edit);}
super.rebase(edit);}
setKeyText(newKeyText){const styleSheetId=this.styleSheetId;if(!styleSheetId){throw'No rule stylesheet id';}
const range=this._keyText.range;if(!range){throw'Keyframe key is not editable';}
return this._cssModel.setKeyframeKey(styleSheetId,range,newKeyText);}}
var CSSRule$1=Object.freeze({__proto__:null,CSSRule:CSSRule,CSSStyleRule:CSSStyleRule,CSSKeyframesRule:CSSKeyframesRule,CSSKeyframeRule:CSSKeyframeRule});class CSSStyleDeclaration{constructor(cssModel,parentRule,payload,type){this._cssModel=cssModel;this.parentRule=parentRule;this._allProperties;this.styleSheetId;this.range;this.cssText;this._shorthandValues;this._shorthandIsImportant;this._activePropertyMap;this._leadingProperties;this._reinitialize(payload);this.type=type;}
rebase(edit){if(this.styleSheetId!==edit.styleSheetId||!this.range){return;}
if(edit.oldRange.equal(this.range)){this._reinitialize((edit.payload));}else{this.range=this.range.rebaseAfterTextEdit(edit.oldRange,edit.newRange);for(let i=0;i<this._allProperties.length;++i){this._allProperties[i].rebase(edit);}}}
_reinitialize(payload){this.styleSheetId=payload.styleSheetId;this.range=payload.range?TextUtils.TextRange.fromObject(payload.range):null;const shorthandEntries=payload.shorthandEntries;this._shorthandValues=new Map();this._shorthandIsImportant=new Set();for(let i=0;i<shorthandEntries.length;++i){this._shorthandValues.set(shorthandEntries[i].name,shorthandEntries[i].value);if(shorthandEntries[i].important){this._shorthandIsImportant.add(shorthandEntries[i].name);}}
this._allProperties=[];if(payload.cssText&&this.range){const cssText=new TextUtils.Text(payload.cssText);let start={line:this.range.startLine,column:this.range.startColumn};for(const cssProperty of payload.cssProperties){const range=cssProperty.range;if(range){parseUnusedText.call(this,cssText,start.line,start.column,range.startLine,range.startColumn);start={line:range.endLine,column:range.endColumn};}
this._allProperties.push(CSSProperty.parsePayload(this,this._allProperties.length,cssProperty));}
parseUnusedText.call(this,cssText,start.line,start.column,this.range.endLine,this.range.endColumn);}else{for(const cssProperty of payload.cssProperties){this._allProperties.push(CSSProperty.parsePayload(this,this._allProperties.length,cssProperty));}}
this._generateSyntheticPropertiesIfNeeded();this._computeInactiveProperties();this._activePropertyMap=new Map();for(const property of this._allProperties){if(!property.activeInStyle()){continue;}
this._activePropertyMap.set(property.name,property);}
this.cssText=payload.cssText;this._leadingProperties=null;function parseUnusedText(cssText,startLine,startColumn,endLine,endColumn){const tr=new TextUtils.TextRange(startLine,startColumn,endLine,endColumn);const missingText=cssText.extract(tr.relativeTo(this.range.startLine,this.range.startColumn));const lines=missingText.split('\n');let lineNumber=0;let inComment=false;for(const line of lines){let column=0;for(const property of line.split(';')){const strippedProperty=stripComments(property,inComment);const trimmedProperty=strippedProperty.text.trim();inComment=strippedProperty.inComment;if(trimmedProperty){let name;let value;const colonIndex=trimmedProperty.indexOf(':');if(colonIndex===-1){name=trimmedProperty;value='';}else{name=trimmedProperty.substring(0,colonIndex).trim();value=trimmedProperty.substring(colonIndex+1).trim();}
const range=new TextUtils.TextRange(lineNumber,column,lineNumber,column+property.length);this._allProperties.push(new CSSProperty(this,this._allProperties.length,name,value,false,false,false,false,property,range.relativeFrom(startLine,startColumn)));}
column+=property.length+1;}
lineNumber++;}}
function stripComments(text,inComment){let output='';for(let i=0;i<text.length;i++){if(!inComment&&text.substring(i,i+2)==='/*'){inComment=true;i++;}else if(inComment&&text.substring(i,i+2)==='*/'){inComment=false;i++;}else if(!inComment){output+=text[i];}}
return{text:output,inComment};}}
_generateSyntheticPropertiesIfNeeded(){if(this.range){return;}
if(!this._shorthandValues.size){return;}
const propertiesSet=new Set();for(const property of this._allProperties){propertiesSet.add(property.name);}
const generatedProperties=[];for(const property of this._allProperties){const shorthands=cssMetadata().shorthands(property.name)||[];for(const shorthand of shorthands){if(propertiesSet.has(shorthand)){continue;}
const shorthandValue=this._shorthandValues.get(shorthand);if(!shorthandValue){continue;}
const shorthandImportance=!!this._shorthandIsImportant.has(shorthand);const shorthandProperty=new CSSProperty(this,this.allProperties().length,shorthand,shorthandValue,shorthandImportance,false,true,false);generatedProperties.push(shorthandProperty);propertiesSet.add(shorthand);}}
this._allProperties=this._allProperties.concat(generatedProperties);}
_computeLeadingProperties(){function propertyHasRange(property){return!!property.range;}
if(this.range){return this._allProperties.filter(propertyHasRange);}
const leadingProperties=[];for(const property of this._allProperties){const shorthands=cssMetadata().shorthands(property.name)||[];let belongToAnyShorthand=false;for(const shorthand of shorthands){if(this._shorthandValues.get(shorthand)){belongToAnyShorthand=true;break;}}
if(!belongToAnyShorthand){leadingProperties.push(property);}}
return leadingProperties;}
leadingProperties(){if(!this._leadingProperties){this._leadingProperties=this._computeLeadingProperties();}
return this._leadingProperties;}
target(){return this._cssModel.target();}
cssModel(){return this._cssModel;}
_computeInactiveProperties(){const activeProperties={};for(let i=0;i<this._allProperties.length;++i){const property=this._allProperties[i];if(property.disabled||!property.parsedOk){property.setActive(false);continue;}
const canonicalName=cssMetadata().canonicalPropertyName(property.name);const activeProperty=activeProperties[canonicalName];if(!activeProperty){activeProperties[canonicalName]=property;}else if(!activeProperty.important||property.important){activeProperty.setActive(false);activeProperties[canonicalName]=property;}else{property.setActive(false);}}}
allProperties(){return this._allProperties;}
getPropertyValue(name){const property=this._activePropertyMap.get(name);return property?property.value:'';}
isPropertyImplicit(name){const property=this._activePropertyMap.get(name);return property?property.implicit:false;}
longhandProperties(name){const longhands=cssMetadata().longhands(name);const result=[];for(let i=0;longhands&&i<longhands.length;++i){const property=this._activePropertyMap.get(longhands[i]);if(property){result.push(property);}}
return result;}
propertyAt(index){return(index<this.allProperties().length)?this.allProperties()[index]:null;}
pastLastSourcePropertyIndex(){for(let i=this.allProperties().length-1;i>=0;--i){if(this.allProperties()[i].range){return i+1;}}
return 0;}
_insertionRange(index){const property=this.propertyAt(index);return property&&property.range?property.range.collapseToStart():this.range.collapseToEnd();}
newBlankProperty(index){index=(typeof index==='undefined')?this.pastLastSourcePropertyIndex():index;const property=new CSSProperty(this,index,'','',false,false,true,false,'',this._insertionRange(index));return property;}
setText(text,majorChange){if(!this.range||!this.styleSheetId){return Promise.resolve(false);}
return this._cssModel.setStyleText(this.styleSheetId,this.range,text,majorChange);}
insertPropertyAt(index,name,value,userCallback){this.newBlankProperty(index).setText(name+': '+value+';',false,true).then(userCallback);}
appendProperty(name,value,userCallback){this.insertPropertyAt(this.allProperties().length,name,value,userCallback);}}
const Type$2={Regular:'Regular',Inline:'Inline',Attributes:'Attributes'};var CSSStyleDeclaration$1=Object.freeze({__proto__:null,CSSStyleDeclaration:CSSStyleDeclaration,Type:Type$2});class CSSProperty{constructor(ownerStyle,index,name,value,important,disabled,parsedOk,implicit,text,range){this.ownerStyle=ownerStyle;this.index=index;this.name=name;this.value=value;this.important=important;this.disabled=disabled;this.parsedOk=parsedOk;this.implicit=implicit;this.text=text;this.range=range?TextUtils.TextRange.fromObject(range):null;this._active=true;this._nameRange=null;this._valueRange=null;}
static parsePayload(ownerStyle,index,payload){const result=new CSSProperty(ownerStyle,index,payload.name,payload.value,payload.important||false,payload.disabled||false,('parsedOk'in payload)?!!payload.parsedOk:true,!!payload.implicit,payload.text,payload.range);return result;}
_ensureRanges(){if(this._nameRange&&this._valueRange){return;}
const range=this.range;const text=this.text?new TextUtils.Text(this.text):null;if(!range||!text){return;}
const nameIndex=text.value().indexOf(this.name);const valueIndex=text.value().lastIndexOf(this.value);if(nameIndex===-1||valueIndex===-1||nameIndex>valueIndex){return;}
const nameSourceRange=new TextUtils.SourceRange(nameIndex,this.name.length);const valueSourceRange=new TextUtils.SourceRange(valueIndex,this.value.length);this._nameRange=rebase(text.toTextRange(nameSourceRange),range.startLine,range.startColumn);this._valueRange=rebase(text.toTextRange(valueSourceRange),range.startLine,range.startColumn);function rebase(oneLineRange,lineOffset,columnOffset){if(oneLineRange.startLine===0){oneLineRange.startColumn+=columnOffset;oneLineRange.endColumn+=columnOffset;}
oneLineRange.startLine+=lineOffset;oneLineRange.endLine+=lineOffset;return oneLineRange;}}
nameRange(){this._ensureRanges();return this._nameRange;}
valueRange(){this._ensureRanges();return this._valueRange;}
rebase(edit){if(this.ownerStyle.styleSheetId!==edit.styleSheetId){return;}
if(this.range){this.range=this.range.rebaseAfterTextEdit(edit.oldRange,edit.newRange);}}
setActive(active){this._active=active;}
get propertyText(){if(this.text!==undefined){return this.text;}
if(this.name===''){return'';}
return this.name+': '+this.value+(this.important?' !important':'')+';';}
activeInStyle(){return this._active;}
async setText(propertyText,majorChange,overwrite){if(!this.ownerStyle){return Promise.reject(new Error('No ownerStyle for property'));}
if(!this.ownerStyle.styleSheetId){return Promise.reject(new Error('No owner style id'));}
if(!this.range||!this.ownerStyle.range){return Promise.reject(new Error('Style not editable'));}
if(majorChange){userMetrics.actionTaken(Host.UserMetrics.Action.StyleRuleEdited);}
if(overwrite&&propertyText===this.propertyText){this.ownerStyle.cssModel().domModel().markUndoableState(!majorChange);return Promise.resolve(true);}
const range=this.range.relativeTo(this.ownerStyle.range.startLine,this.ownerStyle.range.startColumn);const indentation=this.ownerStyle.cssText?this._detectIndentation(this.ownerStyle.cssText):Settings.Settings.instance().moduleSetting('textEditorIndent').get();const endIndentation=this.ownerStyle.cssText?indentation.substring(0,this.ownerStyle.range.endColumn):'';const text=new TextUtils.Text(this.ownerStyle.cssText||'');const newStyleText=text.replaceRange(range,StringUtilities.sprintf(';%s;',propertyText));const tokenizerFactory=await self.runtime.extension(TextUtils.TokenizerFactory).instance();const styleText=CSSProperty._formatStyle(newStyleText,indentation,endIndentation,tokenizerFactory);return this.ownerStyle.setText(styleText,majorChange);}
static _formatStyle(styleText,indentation,endIndentation,tokenizerFactory){const doubleIndent=indentation.substring(endIndentation.length)+indentation;if(indentation){indentation='\n'+indentation;}
let result='';let propertyName='';let propertyText;let insideProperty=false;let needsSemi=false;const tokenize=tokenizerFactory.createTokenizer('text/css');tokenize('*{'+styleText+'}',processToken);if(insideProperty){result+=propertyText;}
result=result.substring(2,result.length-1).trimRight();return result+(indentation?'\n'+endIndentation:'');function processToken(token,tokenType,column,newColumn){if(!insideProperty){const disabledProperty=tokenType&&tokenType.includes('css-comment')&&isDisabledProperty(token);const isPropertyStart=tokenType&&(tokenType.includes('css-string')||tokenType.includes('css-meta')||tokenType.includes('css-property')||tokenType.includes('css-variable-2'));if(disabledProperty){result=result.trimRight()+indentation+token;}else if(isPropertyStart){insideProperty=true;propertyText=token;}else if(token!==';'||needsSemi){result+=token;if(token.trim()&&!(tokenType&&tokenType.includes('css-comment'))){needsSemi=token!==';';}}
if(token==='{'&&!tokenType){needsSemi=false;}
return;}
if(token==='}'||token===';'){result=result.trimRight()+indentation+propertyText.trim()+';';needsSemi=false;insideProperty=false;propertyName='';if(token==='}'){result+='}';}}else{if(cssMetadata().isGridAreaDefiningProperty(propertyName)){const rowResult=GridAreaRowRegex.exec(token);if(rowResult&&rowResult.index===0&&!propertyText.trimRight().endsWith(']')){propertyText=propertyText.trimRight()+'\n'+doubleIndent;}}
if(!propertyName&&token===':'){propertyName=propertyText;}
propertyText+=token;}}
function isDisabledProperty(text){const colon=text.indexOf(':');if(colon===-1){return false;}
const propertyName=text.substring(2,colon).trim();return cssMetadata().isCSSPropertyName(propertyName);}}
_detectIndentation(text){const lines=text.split('\n');if(lines.length<2){return'';}
return TextUtils.TextUtils.lineIndent(lines[1]);}
setValue(newValue,majorChange,overwrite,userCallback){const text=this.name+': '+newValue+(this.important?' !important':'')+';';this.setText(text,majorChange,overwrite).then(userCallback);}
setDisabled(disabled){if(!this.ownerStyle){return Promise.resolve(false);}
if(disabled===this.disabled){return Promise.resolve(true);}
const propertyText=this.text.trim();const text=disabled?'/* '+propertyText+' */':this.text.substring(2,propertyText.length-2).trim();return this.setText(text,true,true);}}
var CSSProperty$1=Object.freeze({__proto__:null,CSSProperty:CSSProperty});class CSSMatchedStyles{constructor(cssModel,node,inlinePayload,attributesPayload,matchedPayload,pseudoPayload,inheritedPayload,animationsPayload){this._cssModel=cssModel;this._node=node;this._addedStyles=new Map();this._matchingSelectors=new Map();this._keyframes=[];if(animationsPayload){this._keyframes=animationsPayload.map(rule=>new CSSKeyframesRule(cssModel,rule));}
this._nodeForStyle=new Map();this._inheritedStyles=new Set();matchedPayload=cleanUserAgentPayload(matchedPayload);for(const inheritedResult of inheritedPayload){inheritedResult.matchedCSSRules=cleanUserAgentPayload(inheritedResult.matchedCSSRules);}
this._mainDOMCascade=this._buildMainCascade(inlinePayload,attributesPayload,matchedPayload,inheritedPayload);this._pseudoDOMCascades=this._buildPseudoCascades(pseudoPayload);this._styleToDOMCascade=new Map();for(const domCascade of Array.from(this._pseudoDOMCascades.values()).concat(this._mainDOMCascade)){for(const style of domCascade.styles()){this._styleToDOMCascade.set(style,domCascade);}}
function cleanUserAgentPayload(payload){for(const ruleMatch of payload){cleanUserAgentSelectors(ruleMatch);}
const cleanMatchedPayload=[];for(const ruleMatch of payload){const lastMatch=cleanMatchedPayload.peekLast();if(!lastMatch||ruleMatch.rule.origin!=='user-agent'||lastMatch.rule.origin!=='user-agent'||ruleMatch.rule.selectorList.text!==lastMatch.rule.selectorList.text||mediaText(ruleMatch)!==mediaText(lastMatch)){cleanMatchedPayload.push(ruleMatch);continue;}
mergeRule(ruleMatch,lastMatch);}
return cleanMatchedPayload;function mergeRule(from,to){const shorthands=(new Map());const properties=(new Map());for(const entry of to.rule.style.shorthandEntries){shorthands.set(entry.name,entry.value);}
for(const entry of to.rule.style.cssProperties){properties.set(entry.name,entry.value);}
for(const entry of from.rule.style.shorthandEntries){shorthands.set(entry.name,entry.value);}
for(const entry of from.rule.style.cssProperties){properties.set(entry.name,entry.value);}
to.rule.style.shorthandEntries=[...shorthands.keys()].map(name=>({name,value:shorthands.get(name)}));to.rule.style.cssProperties=[...properties.keys()].map(name=>({name,value:properties.get(name)}));}
function mediaText(ruleMatch){if(!ruleMatch.rule.media){return null;}
return ruleMatch.rule.media.map(media=>media.text).join(', ');}
function cleanUserAgentSelectors(ruleMatch){const{matchingSelectors,rule}=ruleMatch;if(rule.origin!=='user-agent'||!matchingSelectors.length){return;}
rule.selectorList.selectors=rule.selectorList.selectors.filter((item,i)=>matchingSelectors.includes(i));rule.selectorList.text=rule.selectorList.selectors.map(item=>item.text).join(', ');ruleMatch.matchingSelectors=matchingSelectors.map((item,i)=>i);}}}
_buildMainCascade(inlinePayload,attributesPayload,matchedPayload,inheritedPayload){const nodeCascades=[];const nodeStyles=[];function addAttributesStyle(){if(!attributesPayload){return;}
const style=new CSSStyleDeclaration(this._cssModel,null,attributesPayload,Type$2.Attributes);this._nodeForStyle.set(style,this._node);nodeStyles.push(style);}
if(inlinePayload&&this._node.nodeType()===Node.ELEMENT_NODE){const style=new CSSStyleDeclaration(this._cssModel,null,inlinePayload,Type$2.Inline);this._nodeForStyle.set(style,this._node);nodeStyles.push(style);}
let addedAttributesStyle;for(let i=matchedPayload.length-1;i>=0;--i){const rule=new CSSStyleRule(this._cssModel,matchedPayload[i].rule);if((rule.isInjected()||rule.isUserAgent())&&!addedAttributesStyle){addedAttributesStyle=true;addAttributesStyle.call(this);}
this._nodeForStyle.set(rule.style,this._node);nodeStyles.push(rule.style);this._addMatchingSelectors(this._node,rule,matchedPayload[i].matchingSelectors);}
if(!addedAttributesStyle){addAttributesStyle.call(this);}
nodeCascades.push(new NodeCascade(this,nodeStyles,false));let parentNode=this._node.parentNode;for(let i=0;parentNode&&inheritedPayload&&i<inheritedPayload.length;++i){const inheritedStyles=[];const entryPayload=inheritedPayload[i];const inheritedInlineStyle=entryPayload.inlineStyle?new CSSStyleDeclaration(this._cssModel,null,entryPayload.inlineStyle,Type$2.Inline):null;if(inheritedInlineStyle&&this._containsInherited(inheritedInlineStyle)){this._nodeForStyle.set(inheritedInlineStyle,parentNode);inheritedStyles.push(inheritedInlineStyle);this._inheritedStyles.add(inheritedInlineStyle);}
const inheritedMatchedCSSRules=entryPayload.matchedCSSRules||[];for(let j=inheritedMatchedCSSRules.length-1;j>=0;--j){const inheritedRule=new CSSStyleRule(this._cssModel,inheritedMatchedCSSRules[j].rule);this._addMatchingSelectors(parentNode,inheritedRule,inheritedMatchedCSSRules[j].matchingSelectors);if(!this._containsInherited(inheritedRule.style)){continue;}
if(containsStyle(nodeStyles,inheritedRule.style)||containsStyle(this._inheritedStyles,inheritedRule.style)){continue;}
this._nodeForStyle.set(inheritedRule.style,parentNode);inheritedStyles.push(inheritedRule.style);this._inheritedStyles.add(inheritedRule.style);}
parentNode=parentNode.parentNode;nodeCascades.push(new NodeCascade(this,inheritedStyles,true));}
return new DOMInheritanceCascade(nodeCascades);function containsStyle(styles,query){if(!query.styleSheetId||!query.range){return false;}
for(const style of styles){if(query.styleSheetId===style.styleSheetId&&style.range&&query.range.equal(style.range)){return true;}}
return false;}}
_buildPseudoCascades(pseudoPayload){const pseudoCascades=new Map();if(!pseudoPayload){return pseudoCascades;}
for(let i=0;i<pseudoPayload.length;++i){const entryPayload=pseudoPayload[i];const pseudoElement=this._node.pseudoElements().get(entryPayload.pseudoType)||null;const pseudoStyles=[];const rules=entryPayload.matches||[];for(let j=rules.length-1;j>=0;--j){const pseudoRule=new CSSStyleRule(this._cssModel,rules[j].rule);pseudoStyles.push(pseudoRule.style);this._nodeForStyle.set(pseudoRule.style,pseudoElement);if(pseudoElement){this._addMatchingSelectors(pseudoElement,pseudoRule,rules[j].matchingSelectors);}}
const nodeCascade=new NodeCascade(this,pseudoStyles,false);pseudoCascades.set(entryPayload.pseudoType,new DOMInheritanceCascade([nodeCascade]));}
return pseudoCascades;}
_addMatchingSelectors(node,rule,matchingSelectorIndices){for(const matchingSelectorIndex of matchingSelectorIndices){const selector=rule.selectors[matchingSelectorIndex];this._setSelectorMatches(node,selector.text,true);}}
node(){return this._node;}
cssModel(){return this._cssModel;}
hasMatchingSelectors(rule){const matchingSelectors=this.matchingSelectors(rule);return matchingSelectors.length>0&&this.mediaMatches(rule.style);}
matchingSelectors(rule){const node=this.nodeForStyle(rule.style);if(!node){return[];}
const map=this._matchingSelectors.get(node.id);if(!map){return[];}
const result=[];for(let i=0;i<rule.selectors.length;++i){if(map.get(rule.selectors[i].text)){result.push(i);}}
return result;}
recomputeMatchingSelectors(rule){const node=this.nodeForStyle(rule.style);if(!node){return Promise.resolve();}
const promises=[];for(const selector of rule.selectors){promises.push(querySelector.call(this,node,selector.text));}
return Promise.all(promises);async function querySelector(node,selectorText){const ownerDocument=node.ownerDocument||null;const map=this._matchingSelectors.get(node.id);if((map&&map.has(selectorText))||!ownerDocument){return;}
const matchingNodeIds=await this._node.domModel().querySelectorAll(ownerDocument.id,selectorText);if(matchingNodeIds){this._setSelectorMatches(node,selectorText,matchingNodeIds.indexOf(node.id)!==-1);}}}
addNewRule(rule,node){this._addedStyles.set(rule.style,node);return this.recomputeMatchingSelectors(rule);}
_setSelectorMatches(node,selectorText,value){let map=this._matchingSelectors.get(node.id);if(!map){map=new Map();this._matchingSelectors.set(node.id,map);}
map.set(selectorText,value);}
mediaMatches(style){const media=style.parentRule?style.parentRule.media:[];for(let i=0;media&&i<media.length;++i){if(!media[i].active()){return false;}}
return true;}
nodeStyles(){return this._mainDOMCascade.styles();}
keyframes(){return this._keyframes;}
pseudoStyles(pseudoType){const domCascade=this._pseudoDOMCascades.get(pseudoType);return domCascade?domCascade.styles():[];}
pseudoTypes(){return new Set(this._pseudoDOMCascades.keys());}
_containsInherited(style){const properties=style.allProperties();for(let i=0;i<properties.length;++i){const property=properties[i];if(property.activeInStyle()&&cssMetadata().isPropertyInherited(property.name)){return true;}}
return false;}
nodeForStyle(style){return this._addedStyles.get(style)||this._nodeForStyle.get(style)||null;}
availableCSSVariables(style){const domCascade=this._styleToDOMCascade.get(style)||null;return domCascade?domCascade.availableCSSVariables(style):[];}
computeCSSVariable(style,variableName){const domCascade=this._styleToDOMCascade.get(style)||null;return domCascade?domCascade.computeCSSVariable(style,variableName):null;}
computeValue(style,value){const domCascade=this._styleToDOMCascade.get(style)||null;return domCascade?domCascade.computeValue(style,value):null;}
isInherited(style){return this._inheritedStyles.has(style);}
propertyState(property){const domCascade=this._styleToDOMCascade.get(property.ownerStyle);return domCascade?domCascade.propertyState(property):null;}
resetActiveProperties(){this._mainDOMCascade.reset();for(const domCascade of this._pseudoDOMCascades.values()){domCascade.reset();}}}
class NodeCascade{constructor(matchedStyles,styles,isInherited){this._matchedStyles=matchedStyles;this._styles=styles;this._isInherited=isInherited;this._propertiesState=new Map();this._activeProperties=new Map();}
_computeActiveProperties(){this._propertiesState.clear();this._activeProperties.clear();for(const style of this._styles){const rule=style.parentRule;if(rule&&!(rule instanceof CSSStyleRule)){continue;}
if(rule&&!this._matchedStyles.hasMatchingSelectors(rule)){continue;}
for(const property of style.allProperties()){if(this._isInherited&&!cssMetadata().isPropertyInherited(property.name)){continue;}
if(!property.activeInStyle()){this._propertiesState.set(property,PropertyState.Overloaded);continue;}
const canonicalName=cssMetadata().canonicalPropertyName(property.name);const activeProperty=this._activeProperties.get(canonicalName);if(activeProperty&&(activeProperty.important||!property.important)){this._propertiesState.set(property,PropertyState.Overloaded);continue;}
if(activeProperty){this._propertiesState.set(activeProperty,PropertyState.Overloaded);}
this._propertiesState.set(property,PropertyState.Active);this._activeProperties.set(canonicalName,property);}}}}
class DOMInheritanceCascade{constructor(nodeCascades){this._nodeCascades=nodeCascades;this._propertiesState=new Map();this._availableCSSVariables=new Map();this._computedCSSVariables=new Map();this._initialized=false;this._styleToNodeCascade=new Map();for(const nodeCascade of nodeCascades){for(const style of nodeCascade._styles){this._styleToNodeCascade.set(style,nodeCascade);}}}
availableCSSVariables(style){const nodeCascade=this._styleToNodeCascade.get(style);if(!nodeCascade){return[];}
this._ensureInitialized();return Array.from(this._availableCSSVariables.get(nodeCascade).keys());}
computeCSSVariable(style,variableName){const nodeCascade=this._styleToNodeCascade.get(style);if(!nodeCascade){return null;}
this._ensureInitialized();const availableCSSVariables=this._availableCSSVariables.get(nodeCascade);const computedCSSVariables=this._computedCSSVariables.get(nodeCascade);return this._innerComputeCSSVariable(availableCSSVariables,computedCSSVariables,variableName);}
computeValue(style,value){const nodeCascade=this._styleToNodeCascade.get(style);if(!nodeCascade){return null;}
this._ensureInitialized();const availableCSSVariables=this._availableCSSVariables.get(nodeCascade);const computedCSSVariables=this._computedCSSVariables.get(nodeCascade);return this._innerComputeValue(availableCSSVariables,computedCSSVariables,value);}
_innerComputeCSSVariable(availableCSSVariables,computedCSSVariables,variableName){if(!availableCSSVariables.has(variableName)){return null;}
if(computedCSSVariables.has(variableName)){return computedCSSVariables.get(variableName);}
computedCSSVariables.set(variableName,null);const definedValue=availableCSSVariables.get(variableName);const computedValue=this._innerComputeValue(availableCSSVariables,computedCSSVariables,definedValue);computedCSSVariables.set(variableName,computedValue);return computedValue;}
_innerComputeValue(availableCSSVariables,computedCSSVariables,value){const results=TextUtils.TextUtils.splitStringByRegexes(value,[VariableRegex]);const tokens=[];for(const result of results){if(result.regexIndex===-1){tokens.push(result.value);continue;}
const regexMatch=result.value.match(/^var\((--[a-zA-Z0-9-_]+)[,]?\s*(.*)\)$/);if(!regexMatch){return null;}
const cssVariable=regexMatch[1];const computedValue=this._innerComputeCSSVariable(availableCSSVariables,computedCSSVariables,cssVariable);if(computedValue===null&&!regexMatch[2]){return null;}
if(computedValue===null){tokens.push(regexMatch[2]);}else{tokens.push(computedValue);}}
return tokens.map(token=>token.trim()).join(' ');}
styles(){return Array.from(this._styleToNodeCascade.keys());}
propertyState(property){this._ensureInitialized();return this._propertiesState.get(property)||null;}
reset(){this._initialized=false;this._propertiesState.clear();this._availableCSSVariables.clear();this._computedCSSVariables.clear();}
_ensureInitialized(){if(this._initialized){return;}
this._initialized=true;const activeProperties=new Map();for(const nodeCascade of this._nodeCascades){nodeCascade._computeActiveProperties();for(const entry of nodeCascade._propertiesState.entries()){const property=(entry[0]);const state=(entry[1]);if(state===PropertyState.Overloaded){this._propertiesState.set(property,PropertyState.Overloaded);continue;}
const canonicalName=cssMetadata().canonicalPropertyName(property.name);if(activeProperties.has(canonicalName)){this._propertiesState.set(property,PropertyState.Overloaded);continue;}
activeProperties.set(canonicalName,property);this._propertiesState.set(property,PropertyState.Active);}}
for(const entry of activeProperties.entries()){const canonicalName=(entry[0]);const shorthandProperty=(entry[1]);const shorthandStyle=shorthandProperty.ownerStyle;const longhands=shorthandStyle.longhandProperties(shorthandProperty.name);if(!longhands.length){continue;}
let hasActiveLonghands=false;for(const longhand of longhands){const longhandCanonicalName=cssMetadata().canonicalPropertyName(longhand.name);const longhandActiveProperty=activeProperties.get(longhandCanonicalName);if(!longhandActiveProperty){continue;}
if(longhandActiveProperty.ownerStyle===shorthandStyle){hasActiveLonghands=true;break;}}
if(hasActiveLonghands){continue;}
activeProperties.delete(canonicalName);this._propertiesState.set(shorthandProperty,PropertyState.Overloaded);}
const accumulatedCSSVariables=new Map();for(let i=this._nodeCascades.length-1;i>=0;--i){const nodeCascade=this._nodeCascades[i];for(const entry of nodeCascade._activeProperties.entries()){const propertyName=(entry[0]);const property=(entry[1]);if(propertyName.startsWith('--')){accumulatedCSSVariables.set(propertyName,property.value);}}
this._availableCSSVariables.set(nodeCascade,new Map(accumulatedCSSVariables));this._computedCSSVariables.set(nodeCascade,new Map());}}}
const PropertyState={Active:'Active',Overloaded:'Overloaded'};var CSSMatchedStyles$1=Object.freeze({__proto__:null,CSSMatchedStyles:CSSMatchedStyles,PropertyState:PropertyState});class CompilerSourceMappingContentProvider{constructor(sourceURL,contentType){this._sourceURL=sourceURL;this._contentType=contentType;}
contentURL(){return this._sourceURL;}
contentType(){return this._contentType;}
contentEncoded(){return Promise.resolve(false);}
requestContent(){return new Promise(resolve=>{self.SDK.multitargetNetworkManager.loadResource(this._sourceURL,(success,_headers,content,errorDescription)=>{if(!success){const error=ls`Could not load content for ${this._sourceURL} (${errorDescription.message})`;console.error(error);resolve({error,isEncoded:false});}else{resolve({content,isEncoded:false});}});});}
async searchInContent(query,caseSensitive,isRegex){const{content}=await this.requestContent();if(typeof content!=='string'){return[];}
return TextUtils$1.performSearchInContent(content,query,caseSensitive,isRegex);}}
var CompilerSourceMappingContentProvider$1=Object.freeze({__proto__:null,CompilerSourceMappingContentProvider:CompilerSourceMappingContentProvider});class SourceMap{compiledURL(){}
url(){}
sourceURLs(){}
sourceContentProvider(sourceURL,contentType){}
embeddedContentByURL(sourceURL){}
findEntry(lineNumber,columnNumber){}
sourceLineMapping(sourceURL,lineNumber,columnNumber){}
mappings(){}
dispose(){}}
class SourceMapV3{constructor(){this.version;this.file;this.sources;this.sections;this.mappings;this.sourceRoot;this.names;}}
SourceMapV3.Section=class{constructor(){this.map;this.offset;}};SourceMapV3.Offset=class{constructor(){this.line;this.column;}};class SourceMapEntry{constructor(lineNumber,columnNumber,sourceURL,sourceLineNumber,sourceColumnNumber,name){this.lineNumber=lineNumber;this.columnNumber=columnNumber;this.sourceURL=sourceURL;this.sourceLineNumber=sourceLineNumber;this.sourceColumnNumber=sourceColumnNumber;this.name=name;}
static compare(entry1,entry2){if(entry1.lineNumber!==entry2.lineNumber){return entry1.lineNumber-entry2.lineNumber;}
return entry1.columnNumber-entry2.columnNumber;}}
class EditResult{constructor(map,compiledEdits,newSources){this.map=map;this.compiledEdits=compiledEdits;this.newSources=newSources;}}
class TextSourceMap{constructor(compiledURL,sourceMappingURL,payload){if(!TextSourceMap._base64Map){const base64Digits='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';TextSourceMap._base64Map={};for(let i=0;i<base64Digits.length;++i){TextSourceMap._base64Map[base64Digits.charAt(i)]=i;}}
this._json=payload;this._compiledURL=compiledURL;this._sourceMappingURL=sourceMappingURL;this._baseURL=sourceMappingURL.startsWith('data:')?compiledURL:sourceMappingURL;this._mappings=null;this._sourceInfos=new Map();if(this._json.sections){const sectionWithURL=!!this._json.sections.find(section=>!!section.url);if(sectionWithURL){Console.Console.instance().warn(`SourceMap "${sourceMappingURL}" contains unsupported "URL" field in one of its sections.`);}}
this._eachSection(this._parseSources.bind(this));}
static async load(sourceMapURL,compiledURL){let content=await new Promise((resolve,reject)=>{self.SDK.multitargetNetworkManager.loadResource(sourceMapURL,(success,_headers,content,errorDescription)=>{if(!content||!success){const error=new Error(ls`Could not load content for ${sourceMapURL}: ${errorDescription.message}`);reject(error);}else{resolve(content);}});});if(content.slice(0,3)===')]}'){content=content.substring(content.indexOf('\n'));}
try{const payload=(JSON.parse(content));return new TextSourceMap(compiledURL,sourceMapURL,payload);}catch(error){throw new Error(ls`Could not parse content for ${sourceMapURL}: ${error.message}`);}}
compiledURL(){return this._compiledURL;}
url(){return this._sourceMappingURL;}
sourceURLs(){return[...this._sourceInfos.keys()];}
sourceContentProvider(sourceURL,contentType){const info=this._sourceInfos.get(sourceURL);if(info.content){return StaticContentProvider.StaticContentProvider.fromString(sourceURL,contentType,info.content);}
return new CompilerSourceMappingContentProvider(sourceURL,contentType);}
embeddedContentByURL(sourceURL){if(!this._sourceInfos.has(sourceURL)){return null;}
return this._sourceInfos.get(sourceURL).content;}
findEntry(lineNumber,columnNumber){const mappings=this.mappings();const index=mappings.upperBound(undefined,(unused,entry)=>lineNumber-entry.lineNumber||columnNumber-entry.columnNumber);return index?mappings[index-1]:null;}
sourceLineMapping(sourceURL,lineNumber,columnNumber){const mappings=this._reversedMappings(sourceURL);const first=mappings.lowerBound(lineNumber,lineComparator);const last=mappings.upperBound(lineNumber,lineComparator);if(first>=mappings.length||mappings[first].sourceLineNumber!==lineNumber){return null;}
const columnMappings=mappings.slice(first,last);if(!columnMappings.length){return null;}
const index=columnMappings.lowerBound(columnNumber,(columnNumber,mapping)=>columnNumber-mapping.sourceColumnNumber);return index>=columnMappings.length?columnMappings[columnMappings.length-1]:columnMappings[index];function lineComparator(lineNumber,mapping){return lineNumber-mapping.sourceLineNumber;}}
findReverseEntries(sourceURL,lineNumber,columnNumber){const mappings=this._reversedMappings(sourceURL);const endIndex=mappings.upperBound(undefined,(unused,entry)=>lineNumber-entry.sourceLineNumber||columnNumber-entry.sourceColumnNumber);let startIndex=endIndex;while(startIndex>0&&mappings[startIndex-1].sourceLineNumber===mappings[endIndex-1].sourceLineNumber&&mappings[startIndex-1].sourceColumnNumber===mappings[endIndex-1].sourceColumnNumber){--startIndex;}
return mappings.slice(startIndex,endIndex);}
mappings(){if(this._mappings===null){this._mappings=[];this._eachSection(this._parseMap.bind(this));this._json=null;}
return(this._mappings);}
_reversedMappings(sourceURL){if(!this._sourceInfos.has(sourceURL)){return[];}
const mappings=this.mappings();const info=this._sourceInfos.get(sourceURL);if(info.reverseMappings===null){info.reverseMappings=mappings.filter(mapping=>mapping.sourceURL===sourceURL).sort(sourceMappingComparator);}
return info.reverseMappings;function sourceMappingComparator(a,b){if(a.sourceLineNumber!==b.sourceLineNumber){return a.sourceLineNumber-b.sourceLineNumber;}
if(a.sourceColumnNumber!==b.sourceColumnNumber){return a.sourceColumnNumber-b.sourceColumnNumber;}
if(a.lineNumber!==b.lineNumber){return a.lineNumber-b.lineNumber;}
return a.columnNumber-b.columnNumber;}}
_eachSection(callback){if(!this._json.sections){callback(this._json,0,0);return;}
for(const section of this._json.sections){callback(section.map,section.offset.line,section.offset.column);}}
_parseSources(sourceMap){const sourcesList=[];let sourceRoot=sourceMap.sourceRoot||'';if(sourceRoot&&!sourceRoot.endsWith('/')){sourceRoot+='/';}
for(let i=0;i<sourceMap.sources.length;++i){const href=sourceRoot+sourceMap.sources[i];let url=ParsedURL.ParsedURL.completeURL(this._baseURL,href)||href;const source=sourceMap.sourcesContent&&sourceMap.sourcesContent[i];if(url===this._compiledURL&&source){url+=UIString.UIString('? [sm]');}
this._sourceInfos.set(url,new TextSourceMap.SourceInfo(source,null));sourcesList.push(url);}
sourceMap[TextSourceMap._sourcesListSymbol]=sourcesList;}
_parseMap(map,lineNumber,columnNumber){let sourceIndex=0;let sourceLineNumber=0;let sourceColumnNumber=0;let nameIndex=0;const sources=map[TextSourceMap._sourcesListSymbol];const names=map.names||[];const stringCharIterator=new TextSourceMap.StringCharIterator(map.mappings);let sourceURL=sources[sourceIndex];while(true){if(stringCharIterator.peek()===','){stringCharIterator.next();}else{while(stringCharIterator.peek()===';'){lineNumber+=1;columnNumber=0;stringCharIterator.next();}
if(!stringCharIterator.hasNext()){break;}}
columnNumber+=this._decodeVLQ(stringCharIterator);if(!stringCharIterator.hasNext()||this._isSeparator(stringCharIterator.peek())){this._mappings.push(new SourceMapEntry(lineNumber,columnNumber));continue;}
const sourceIndexDelta=this._decodeVLQ(stringCharIterator);if(sourceIndexDelta){sourceIndex+=sourceIndexDelta;sourceURL=sources[sourceIndex];}
sourceLineNumber+=this._decodeVLQ(stringCharIterator);sourceColumnNumber+=this._decodeVLQ(stringCharIterator);if(!stringCharIterator.hasNext()||this._isSeparator(stringCharIterator.peek())){this._mappings.push(new SourceMapEntry(lineNumber,columnNumber,sourceURL,sourceLineNumber,sourceColumnNumber));continue;}
nameIndex+=this._decodeVLQ(stringCharIterator);this._mappings.push(new SourceMapEntry(lineNumber,columnNumber,sourceURL,sourceLineNumber,sourceColumnNumber,names[nameIndex]));}
this._mappings.sort(SourceMapEntry.compare);}
_isSeparator(char){return char===','||char===';';}
_decodeVLQ(stringCharIterator){let result=0;let shift=0;let digit;do{digit=TextSourceMap._base64Map[stringCharIterator.next()];result+=(digit&TextSourceMap._VLQ_BASE_MASK)<<shift;shift+=TextSourceMap._VLQ_BASE_SHIFT;}while(digit&TextSourceMap._VLQ_CONTINUATION_MASK);const negative=result&1;result>>=1;return negative?-result:result;}
reverseMapTextRange(url,textRange){function comparator(position,mapping){if(position.lineNumber!==mapping.sourceLineNumber){return position.lineNumber-mapping.sourceLineNumber;}
return position.columnNumber-mapping.sourceColumnNumber;}
const mappings=this._reversedMappings(url);const startIndex=mappings.lowerBound({lineNumber:textRange.startLine,columnNumber:textRange.startColumn},comparator);const endIndex=mappings.upperBound({lineNumber:textRange.endLine,columnNumber:textRange.endColumn},comparator);const startMapping=mappings[startIndex];const endMapping=mappings[endIndex];return new TextRange.TextRange(startMapping.lineNumber,startMapping.columnNumber,endMapping.lineNumber,endMapping.columnNumber);}
dispose(){}}
TextSourceMap._VLQ_BASE_SHIFT=5;TextSourceMap._VLQ_BASE_MASK=(1<<5)-1;TextSourceMap._VLQ_CONTINUATION_MASK=1<<5;TextSourceMap.StringCharIterator=class{constructor(string){this._string=string;this._position=0;}
next(){return this._string.charAt(this._position++);}
peek(){return this._string.charAt(this._position);}
hasNext(){return this._position<this._string.length;}};TextSourceMap.SourceInfo=class{constructor(content,reverseMappings){this.content=content;this.reverseMappings=reverseMappings;}};TextSourceMap._sourcesListSymbol=Symbol('sourcesList');class WasmSourceMap{constructor(wasmUrl,resolver){this._wasmUrl=wasmUrl;this._resolver=resolver;}
static async _loadBindings(){const arrayBuffer=await self.runtime.loadBinaryResourcePromise('./sdk/wasm_source_map/pkg/wasm_source_map_bg.wasm',true);await self.wasm_bindgen(arrayBuffer);return self.wasm_bindgen.Resolver;}
static _loadBindingsOnce(){return WasmSourceMap._asyncResolver=WasmSourceMap._asyncResolver||WasmSourceMap._loadBindings();}
static async load(script,wasmUrl){const[Resolver,wasm]=await Promise.all([WasmSourceMap._loadBindingsOnce(),script.getWasmBytecode()]);return new WasmSourceMap(wasmUrl,new Resolver(new Uint8Array(wasm)));}
compiledURL(){return this._wasmUrl;}
url(){return WasmSourceMap.FAKE_URL;}
sourceURLs(){return this._resolver.listFiles();}
sourceContentProvider(sourceURL,contentType){return new CompilerSourceMappingContentProvider(sourceURL,contentType);}
embeddedContentByURL(sourceURL){return null;}
findEntry(lineNumber,columnNumber){if(lineNumber!==0){console.warn(new Error('Invalid non-zero line number.'));}
return this._resolver.resolve(columnNumber);}
sourceLineMapping(sourceURL,lineNumber,columnNumber){return this._resolver.resolveReverse(sourceURL,lineNumber,columnNumber);}
mappings(){return this._resolver.listMappings();}
dispose(){this._resolver.free();}}
WasmSourceMap.FAKE_URL='wasm://dwarf';var SourceMap$1=Object.freeze({__proto__:null,SourceMap:SourceMap,SourceMapEntry:SourceMapEntry,EditResult:EditResult,TextSourceMap:TextSourceMap,WasmSourceMap:WasmSourceMap});class SourceMapManager extends ObjectWrapper.ObjectWrapper{constructor(target){super();this._target=target;this._isEnabled=true;this._relativeSourceURL=new Map();this._relativeSourceMapURL=new Map();this._resolvedSourceMapId=new Map();this._sourceMapById=new Map();this._sourceMapIdToLoadingClients=new Platform.Multimap();this._sourceMapIdToClients=new Platform.Multimap();TargetManager.instance().addEventListener(Events.InspectedURLChanged,this._inspectedURLChanged,this);}
setEnabled(isEnabled){if(isEnabled===this._isEnabled){return;}
this._isEnabled=isEnabled;const clients=[...this._resolvedSourceMapId.keys()];for(const client of clients){const relativeSourceURL=this._relativeSourceURL.get(client);const relativeSourceMapURL=this._relativeSourceMapURL.get(client);this.detachSourceMap(client);this.attachSourceMap(client,relativeSourceURL,relativeSourceMapURL);}}
_inspectedURLChanged(event){if(event.data!==this._target){return;}
const prevSourceMapIds=new Map(this._resolvedSourceMapId);for(const[client,prevSourceMapId]of prevSourceMapIds){const relativeSourceURL=this._relativeSourceURL.get(client);const relativeSourceMapURL=this._relativeSourceMapURL.get(client);const{sourceMapId}=this._resolveRelativeURLs(relativeSourceURL,relativeSourceMapURL);if(prevSourceMapId!==sourceMapId){this.detachSourceMap(client);this.attachSourceMap(client,relativeSourceURL,relativeSourceMapURL);}}}
sourceMapForClient(client){const sourceMapId=this._resolvedSourceMapId.get(client);if(!sourceMapId){return null;}
return this._sourceMapById.get(sourceMapId)||null;}
clientsForSourceMap(sourceMap){const sourceMapId=this._getSourceMapId(sourceMap.compiledURL(),sourceMap.url());if(this._sourceMapIdToClients.has(sourceMapId)){return[...this._sourceMapIdToClients.get(sourceMapId)];}
return[...this._sourceMapIdToLoadingClients.get(sourceMapId)];}
_getSourceMapId(sourceURL,sourceMapURL){return`${sourceURL}:${sourceMapURL}`;}
_resolveRelativeURLs(sourceURL,sourceMapURL){const resolvedSourceURL=ParsedURL.ParsedURL.completeURL(this._target.inspectedURL(),sourceURL);if(!resolvedSourceURL){return null;}
const resolvedSourceMapURL=ParsedURL.ParsedURL.completeURL(resolvedSourceURL,sourceMapURL);if(!resolvedSourceMapURL){return null;}
return{sourceURL:resolvedSourceURL,sourceMapURL:resolvedSourceMapURL,sourceMapId:this._getSourceMapId(resolvedSourceURL,resolvedSourceMapURL)};}
attachSourceMap(client,relativeSourceURL,relativeSourceMapURL){if(!relativeSourceMapURL){return;}
console.assert(!this._resolvedSourceMapId.has(client),'SourceMap is already attached to client');const resolvedURLs=this._resolveRelativeURLs(relativeSourceURL,relativeSourceMapURL);if(!resolvedURLs){return;}
this._relativeSourceURL.set(client,relativeSourceURL);this._relativeSourceMapURL.set(client,relativeSourceMapURL);const{sourceURL,sourceMapURL,sourceMapId}=resolvedURLs;this._resolvedSourceMapId.set(client,sourceMapId);if(!this._isEnabled){return;}
this.dispatchEventToListeners(Events$3.SourceMapWillAttach,client);if(this._sourceMapById.has(sourceMapId)){attach.call(this,sourceMapId,client);return;}
if(!this._sourceMapIdToLoadingClients.has(sourceMapId)){const sourceMapPromise=sourceMapURL===WasmSourceMap.FAKE_URL?WasmSourceMap.load(client,sourceURL):TextSourceMap.load(sourceMapURL,sourceURL);sourceMapPromise.catch(error=>{Console.Console.instance().warn(ls`DevTools failed to load SourceMap: ${error.message}`);}).then(onSourceMap.bind(this,sourceMapId));}
this._sourceMapIdToLoadingClients.set(sourceMapId,client);function onSourceMap(sourceMapId,sourceMap){this._sourceMapLoadedForTest();const clients=this._sourceMapIdToLoadingClients.get(sourceMapId);this._sourceMapIdToLoadingClients.deleteAll(sourceMapId);if(!clients.size){return;}
if(!sourceMap){for(const client of clients){this.dispatchEventToListeners(Events$3.SourceMapFailedToAttach,client);}
return;}
this._sourceMapById.set(sourceMapId,sourceMap);for(const client of clients){attach.call(this,sourceMapId,client);}}
function attach(sourceMapId,client){this._sourceMapIdToClients.set(sourceMapId,client);const sourceMap=this._sourceMapById.get(sourceMapId);this.dispatchEventToListeners(Events$3.SourceMapAttached,{client:client,sourceMap:sourceMap});}}
detachSourceMap(client){const sourceMapId=this._resolvedSourceMapId.get(client);this._relativeSourceURL.delete(client);this._relativeSourceMapURL.delete(client);this._resolvedSourceMapId.delete(client);if(!sourceMapId){return;}
if(!this._sourceMapIdToClients.hasValue(sourceMapId,client)){if(this._sourceMapIdToLoadingClients.delete(sourceMapId,client)){this.dispatchEventToListeners(Events$3.SourceMapFailedToAttach,client);}
return;}
this._sourceMapIdToClients.delete(sourceMapId,client);const sourceMap=this._sourceMapById.get(sourceMapId);this.dispatchEventToListeners(Events$3.SourceMapDetached,{client:client,sourceMap:sourceMap});if(!this._sourceMapIdToClients.has(sourceMapId)){sourceMap.dispose();this._sourceMapById.delete(sourceMapId);}}
_sourceMapLoadedForTest(){}
dispose(){for(const sourceMap of this._sourceMapById.values()){sourceMap.dispose();}
TargetManager.instance().removeEventListener(Events.InspectedURLChanged,this._inspectedURLChanged,this);}}
const Events$3={SourceMapWillAttach:Symbol('SourceMapWillAttach'),SourceMapFailedToAttach:Symbol('SourceMapFailedToAttach'),SourceMapAttached:Symbol('SourceMapAttached'),SourceMapDetached:Symbol('SourceMapDetached'),SourceMapChanged:Symbol('SourceMapChanged')};var SourceMapManager$1=Object.freeze({__proto__:null,SourceMapManager:SourceMapManager,Events:Events$3});class CSSModel extends SDKModel{constructor(target){super(target);this._domModel=(target.model(DOMModel));this._sourceMapManager=new SourceMapManager(target);this._agent=target.cssAgent();this._styleLoader=new ComputedStyleLoader(this);this._resourceTreeModel=target.model(ResourceTreeModel);if(this._resourceTreeModel){this._resourceTreeModel.addEventListener(Events$8.MainFrameNavigated,this._resetStyleSheets,this);}
target.registerCSSDispatcher(new CSSDispatcher(this));if(!target.suspended()){this._enable();}
this._styleSheetIdToHeader=new Map();this._styleSheetIdsForURL=new Map();this._originalStyleSheetText=new Map();this._isRuleUsageTrackingEnabled=false;this._sourceMapManager.setEnabled(Settings.Settings.instance().moduleSetting('cssSourceMapsEnabled').get());Settings.Settings.instance().moduleSetting('cssSourceMapsEnabled').addChangeListener(event=>this._sourceMapManager.setEnabled((event.data)));}
headersForSourceURL(sourceURL){const headers=[];for(const headerId of this.styleSheetIdsForURL(sourceURL)){const header=this.styleSheetHeaderForId(headerId);if(header){headers.push(header);}}
return headers;}
createRawLocationsByURL(sourceURL,lineNumber,columnNumber){const headers=this.headersForSourceURL(sourceURL);headers.sort(stylesheetComparator);const compareToArgLocation=(_,header)=>lineNumber-header.startLine||columnNumber-header.startColumn;const endIndex=headers.upperBound(undefined,compareToArgLocation);if(!endIndex){return[];}
const locations=[];const last=headers[endIndex-1];for(let index=endIndex-1;index>=0&&headers[index].startLine===last.startLine&&headers[index].startColumn===last.startColumn;--index){if(headers[index].containsLocation(lineNumber,columnNumber)){locations.push(new CSSLocation(headers[index],lineNumber,columnNumber));}}
return locations;function stylesheetComparator(a,b){return a.startLine-b.startLine||a.startColumn-b.startColumn||a.id.localeCompare(b.id);}}
sourceMapManager(){return this._sourceMapManager;}
static trimSourceURL(text){let sourceURLIndex=text.lastIndexOf('/*# sourceURL=');if(sourceURLIndex===-1){sourceURLIndex=text.lastIndexOf('/*@ sourceURL=');if(sourceURLIndex===-1){return text;}}
const sourceURLLineIndex=text.lastIndexOf('\n',sourceURLIndex);if(sourceURLLineIndex===-1){return text;}
const sourceURLLine=text.substr(sourceURLLineIndex+1).split('\n',1)[0];const sourceURLRegex=/[\040\t]*\/\*[#@] sourceURL=[\040\t]*([^\s]*)[\040\t]*\*\/[\040\t]*$/;if(sourceURLLine.search(sourceURLRegex)===-1){return text;}
return text.substr(0,sourceURLLineIndex)+text.substr(sourceURLLineIndex+sourceURLLine.length+1);}
domModel(){return this._domModel;}
async setStyleText(styleSheetId,range,text,majorChange){try{await this._ensureOriginalStyleSheetText(styleSheetId);const stylePayloads=await this._agent.setStyleTexts([{styleSheetId:styleSheetId,range:range.serializeToObject(),text:text}]);if(!stylePayloads||stylePayloads.length!==1){return false;}
this._domModel.markUndoableState(!majorChange);const edit=new Edit(styleSheetId,range,text,stylePayloads[0]);this._fireStyleSheetChanged(styleSheetId,edit);return true;}catch(e){return false;}}
async setSelectorText(styleSheetId,range,text){userMetrics.actionTaken(Host.UserMetrics.Action.StyleRuleEdited);try{await this._ensureOriginalStyleSheetText(styleSheetId);const selectorPayload=await this._agent.setRuleSelector(styleSheetId,range,text);if(!selectorPayload){return false;}
this._domModel.markUndoableState();const edit=new Edit(styleSheetId,range,text,selectorPayload);this._fireStyleSheetChanged(styleSheetId,edit);return true;}catch(e){return false;}}
async setKeyframeKey(styleSheetId,range,text){userMetrics.actionTaken(Host.UserMetrics.Action.StyleRuleEdited);try{await this._ensureOriginalStyleSheetText(styleSheetId);const payload=await this._agent.setKeyframeKey(styleSheetId,range,text);if(!payload){return false;}
this._domModel.markUndoableState();const edit=new Edit(styleSheetId,range,text,payload);this._fireStyleSheetChanged(styleSheetId,edit);return true;}catch(e){return false;}}
startCoverage(){this._isRuleUsageTrackingEnabled=true;return this._agent.startRuleUsageTracking();}
async takeCoverageDelta(){const r=await this._agent.invoke_takeCoverageDelta({});const timestamp=(r&&r.timestamp)||0;const coverage=(r&&r.coverage)||[];return{timestamp,coverage};}
stopCoverage(){this._isRuleUsageTrackingEnabled=false;return this._agent.stopRuleUsageTracking();}
async mediaQueriesPromise(){const payload=await this._agent.getMediaQueries();return payload?CSSMedia.parseMediaArrayPayload(this,payload):[];}
isEnabled(){return this._isEnabled;}
async _enable(){await this._agent.enable();this._isEnabled=true;if(this._isRuleUsageTrackingEnabled){await this.startCoverage();}
this.dispatchEventToListeners(Events$4.ModelWasEnabled);}
async matchedStylesPromise(nodeId){const response=await this._agent.invoke_getMatchedStylesForNode({nodeId});if(response[InspectorBackend.ProtocolError]){return null;}
const node=this._domModel.nodeForId(nodeId);if(!node){return null;}
return new CSSMatchedStyles(this,(node),response.inlineStyle||null,response.attributesStyle||null,response.matchedCSSRules||[],response.pseudoElements||[],response.inherited||[],response.cssKeyframesRules||[]);}
classNamesPromise(styleSheetId){return this._agent.collectClassNames(styleSheetId).then(classNames=>classNames||[]);}
computedStylePromise(nodeId){return this._styleLoader.computedStylePromise(nodeId);}
async backgroundColorsPromise(nodeId){const response=this._agent.invoke_getBackgroundColors({nodeId});if(response[InspectorBackend.ProtocolError]){return null;}
return response;}
platformFontsPromise(nodeId){return this._agent.getPlatformFontsForNode(nodeId);}
allStyleSheets(){const values=[...this._styleSheetIdToHeader.values()];function styleSheetComparator(a,b){if(a.sourceURL<b.sourceURL){return-1;}
if(a.sourceURL>b.sourceURL){return 1;}
return a.startLine-b.startLine||a.startColumn-b.startColumn;}
values.sort(styleSheetComparator);return values;}
async inlineStylesPromise(nodeId){const response=await this._agent.invoke_getInlineStylesForNode({nodeId});if(response[InspectorBackend.ProtocolError]||!response.inlineStyle){return null;}
const inlineStyle=new CSSStyleDeclaration(this,null,response.inlineStyle,Type$2.Inline);const attributesStyle=response.attributesStyle?new CSSStyleDeclaration(this,null,response.attributesStyle,Type$2.Attributes):null;return new InlineStyleResult(inlineStyle,attributesStyle);}
forcePseudoState(node,pseudoClass,enable){const pseudoClasses=node.marker(PseudoStateMarker)||[];if(enable){if(pseudoClasses.indexOf(pseudoClass)>=0){return false;}
pseudoClasses.push(pseudoClass);node.setMarker(PseudoStateMarker,pseudoClasses);}else{if(pseudoClasses.indexOf(pseudoClass)<0){return false;}
ArrayUtilities.removeElement(pseudoClasses,pseudoClass);if(pseudoClasses.length){node.setMarker(PseudoStateMarker,pseudoClasses);}else{node.setMarker(PseudoStateMarker,null);}}
this._agent.forcePseudoState(node.id,pseudoClasses);this.dispatchEventToListeners(Events$4.PseudoStateForced,{node:node,pseudoClass:pseudoClass,enable:enable});return true;}
pseudoState(node){return node.marker(PseudoStateMarker)||[];}
async setMediaText(styleSheetId,range,newMediaText){userMetrics.actionTaken(Host.UserMetrics.Action.StyleRuleEdited);try{await this._ensureOriginalStyleSheetText(styleSheetId);const mediaPayload=await this._agent.setMediaText(styleSheetId,range,newMediaText);if(!mediaPayload){return false;}
this._domModel.markUndoableState();const edit=new Edit(styleSheetId,range,newMediaText,mediaPayload);this._fireStyleSheetChanged(styleSheetId,edit);return true;}catch(e){return false;}}
async addRule(styleSheetId,ruleText,ruleLocation){try{await this._ensureOriginalStyleSheetText(styleSheetId);const rulePayload=await this._agent.addRule(styleSheetId,ruleText,ruleLocation);if(!rulePayload){return null;}
this._domModel.markUndoableState();const edit=new Edit(styleSheetId,ruleLocation,ruleText,rulePayload);this._fireStyleSheetChanged(styleSheetId,edit);return new CSSStyleRule(this,rulePayload);}catch(e){return null;}}
async requestViaInspectorStylesheet(node){const frameId=node.frameId()||(this._resourceTreeModel?this._resourceTreeModel.mainFrame.id:'');const headers=[...this._styleSheetIdToHeader.values()];const styleSheetHeader=headers.find(header=>header.frameId===frameId&&header.isViaInspector());if(styleSheetHeader){return styleSheetHeader;}
try{const styleSheetId=await this._agent.createStyleSheet(frameId);return styleSheetId&&this._styleSheetIdToHeader.get(styleSheetId)||null;}catch(e){return null;}}
mediaQueryResultChanged(){this.dispatchEventToListeners(Events$4.MediaQueryResultChanged);}
fontsUpdated(){this.dispatchEventToListeners(Events$4.FontsUpdated);}
styleSheetHeaderForId(id){return this._styleSheetIdToHeader.get(id)||null;}
styleSheetHeaders(){return[...this._styleSheetIdToHeader.values()];}
_fireStyleSheetChanged(styleSheetId,edit){this.dispatchEventToListeners(Events$4.StyleSheetChanged,{styleSheetId:styleSheetId,edit:edit});}
_ensureOriginalStyleSheetText(styleSheetId){const header=this.styleSheetHeaderForId(styleSheetId);if(!header){return Promise.resolve((null));}
let promise=this._originalStyleSheetText.get(header);if(!promise){promise=this.getStyleSheetText(header.id);this._originalStyleSheetText.set(header,promise);this._originalContentRequestedForTest(header);}
return promise;}
_originalContentRequestedForTest(header){}
originalStyleSheetText(header){return this._ensureOriginalStyleSheetText(header.id);}
getAllStyleSheetHeaders(){return this._styleSheetIdToHeader.values();}
_styleSheetAdded(header){console.assert(!this._styleSheetIdToHeader.get(header.styleSheetId));const styleSheetHeader=new CSSStyleSheetHeader(this,header);this._styleSheetIdToHeader.set(header.styleSheetId,styleSheetHeader);const url=styleSheetHeader.resourceURL();if(!this._styleSheetIdsForURL.get(url)){this._styleSheetIdsForURL.set(url,new Map());}
const frameIdToStyleSheetIds=this._styleSheetIdsForURL.get(url);let styleSheetIds=frameIdToStyleSheetIds.get(styleSheetHeader.frameId);if(!styleSheetIds){styleSheetIds=new Set();frameIdToStyleSheetIds.set(styleSheetHeader.frameId,styleSheetIds);}
styleSheetIds.add(styleSheetHeader.id);this._sourceMapManager.attachSourceMap(styleSheetHeader,styleSheetHeader.sourceURL,styleSheetHeader.sourceMapURL);this.dispatchEventToListeners(Events$4.StyleSheetAdded,styleSheetHeader);}
_styleSheetRemoved(id){const header=this._styleSheetIdToHeader.get(id);console.assert(header);if(!header){return;}
this._styleSheetIdToHeader.delete(id);const url=header.resourceURL();const frameIdToStyleSheetIds=this._styleSheetIdsForURL.get(url);console.assert(frameIdToStyleSheetIds,'No frameId to styleSheetId map is available for given style sheet URL.');frameIdToStyleSheetIds.get(header.frameId).delete(id);if(!frameIdToStyleSheetIds.get(header.frameId).size){frameIdToStyleSheetIds.delete(header.frameId);if(!frameIdToStyleSheetIds.size){this._styleSheetIdsForURL.delete(url);}}
this._originalStyleSheetText.delete(header);this._sourceMapManager.detachSourceMap(header);this.dispatchEventToListeners(Events$4.StyleSheetRemoved,header);}
styleSheetIdsForURL(url){const frameIdToStyleSheetIds=this._styleSheetIdsForURL.get(url);if(!frameIdToStyleSheetIds){return[];}
const result=[];for(const styleSheetIds of frameIdToStyleSheetIds.values()){result.push(...styleSheetIds);}
return result;}
async setStyleSheetText(styleSheetId,newText,majorChange){const header=(this._styleSheetIdToHeader.get(styleSheetId));console.assert(header);newText=CSSModel.trimSourceURL(newText);if(header.hasSourceURL){newText+='\n/*# sourceURL='+header.sourceURL+' */';}
await this._ensureOriginalStyleSheetText(styleSheetId);const response=await this._agent.invoke_setStyleSheetText({styleSheetId:header.id,text:newText});const sourceMapURL=response.sourceMapURL;this._sourceMapManager.detachSourceMap(header);header.setSourceMapURL(sourceMapURL);this._sourceMapManager.attachSourceMap(header,header.sourceURL,header.sourceMapURL);if(sourceMapURL===null){return'Error in CSS.setStyleSheetText';}
this._domModel.markUndoableState(!majorChange);this._fireStyleSheetChanged(styleSheetId);return null;}
async getStyleSheetText(styleSheetId){try{const text=await this._agent.getStyleSheetText(styleSheetId);return text&&CSSModel.trimSourceURL(text);}catch(e){return null;}}
_resetStyleSheets(){const headers=[...this._styleSheetIdToHeader.values()];this._styleSheetIdsForURL.clear();this._styleSheetIdToHeader.clear();for(const header of headers){this._sourceMapManager.detachSourceMap(header);this.dispatchEventToListeners(Events$4.StyleSheetRemoved,header);}}
suspendModel(){this._isEnabled=false;return this._agent.disable().then(this._resetStyleSheets.bind(this));}
async resumeModel(){return this._enable();}
setEffectivePropertyValueForNode(nodeId,name,value){this._agent.setEffectivePropertyValueForNode(nodeId,name,value);}
cachedMatchedCascadeForNode(node){if(this._cachedMatchedCascadeNode!==node){this.discardCachedMatchedCascade();}
this._cachedMatchedCascadeNode=node;if(!this._cachedMatchedCascadePromise){this._cachedMatchedCascadePromise=this.matchedStylesPromise(node.id);}
return this._cachedMatchedCascadePromise;}
discardCachedMatchedCascade(){delete this._cachedMatchedCascadeNode;delete this._cachedMatchedCascadePromise;}
dispose(){super.dispose();this._sourceMapManager.dispose();}}
const Events$4={FontsUpdated:Symbol('FontsUpdated'),MediaQueryResultChanged:Symbol('MediaQueryResultChanged'),ModelWasEnabled:Symbol('ModelWasEnabled'),PseudoStateForced:Symbol('PseudoStateForced'),StyleSheetAdded:Symbol('StyleSheetAdded'),StyleSheetChanged:Symbol('StyleSheetChanged'),StyleSheetRemoved:Symbol('StyleSheetRemoved')};const PseudoStateMarker='pseudo-state-marker';class Edit{constructor(styleSheetId,oldRange,newText,payload){this.styleSheetId=styleSheetId;this.oldRange=oldRange;this.newRange=TextUtils.TextRange.fromEdit(oldRange,newText);this.newText=newText;this.payload=payload;}}
class CSSLocation{constructor(header,lineNumber,columnNumber){this._cssModel=header.cssModel();this.styleSheetId=header.id;this.url=header.resourceURL();this.lineNumber=lineNumber;this.columnNumber=columnNumber||0;}
cssModel(){return this._cssModel;}
header(){return this._cssModel.styleSheetHeaderForId(this.styleSheetId);}}
class CSSDispatcher{constructor(cssModel){this._cssModel=cssModel;}
mediaQueryResultChanged(){this._cssModel.mediaQueryResultChanged();}
fontsUpdated(){this._cssModel.fontsUpdated();}
styleSheetChanged(styleSheetId){this._cssModel._fireStyleSheetChanged(styleSheetId);}
styleSheetAdded(header){this._cssModel._styleSheetAdded(header);}
styleSheetRemoved(id){this._cssModel._styleSheetRemoved(id);}}
class ComputedStyleLoader{constructor(cssModel){this._cssModel=cssModel;this._nodeIdToPromise=new Map();}
computedStylePromise(nodeId){let promise=this._nodeIdToPromise.get(nodeId);if(promise){return promise;}
promise=this._cssModel._agent.getComputedStyleForNode(nodeId).then(parsePayload.bind(this));this._nodeIdToPromise.set(nodeId,promise);return promise;function parsePayload(computedPayload){this._nodeIdToPromise.delete(nodeId);if(!computedPayload||!computedPayload.length){return null;}
const result=new Map();for(const property of computedPayload){result.set(property.name,property.value);}
return result;}}}
class InlineStyleResult{constructor(inlineStyle,attributesStyle){this.inlineStyle=inlineStyle;this.attributesStyle=attributesStyle;}}
SDKModel.register(CSSModel,Capability.DOM,true);let ContrastInfo;var CSSModel$1=Object.freeze({__proto__:null,CSSModel:CSSModel,Events:Events$4,Edit:Edit,CSSLocation:CSSLocation,InlineStyleResult:InlineStyleResult,ContrastInfo:ContrastInfo});class OverlayModel extends SDKModel{constructor(target){super(target);this._domModel=(target.model(DOMModel));target.registerOverlayDispatcher(this);this._overlayAgent=target.overlayAgent();this._debuggerModel=target.model(DebuggerModel);if(this._debuggerModel){Settings.Settings.instance().moduleSetting('disablePausedStateOverlay').addChangeListener(this._updatePausedInDebuggerMessage,this);this._debuggerModel.addEventListener(Events$9.DebuggerPaused,event=>{this._updatePausedInDebuggerMessage();},this);this._debuggerModel.addEventListener(Events$9.DebuggerResumed,event=>{this._updatePausedInDebuggerMessage();},this);this._debuggerModel.addEventListener(Events$9.GlobalObjectCleared,event=>{this._updatePausedInDebuggerMessage();},this);}
this._inspectModeEnabled=false;this._hideHighlightTimeout=null;this._defaultHighlighter=new DefaultHighlighter(this);this._highlighter=this._defaultHighlighter;this._showPaintRectsSetting=Settings.Settings.instance().moduleSetting('showPaintRects');this._showLayoutShiftRegionsSetting=Settings.Settings.instance().moduleSetting('showLayoutShiftRegions');this._showAdHighlightsSetting=Settings.Settings.instance().moduleSetting('showAdHighlights');this._showDebugBordersSetting=Settings.Settings.instance().moduleSetting('showDebugBorders');this._showFPSCounterSetting=Settings.Settings.instance().moduleSetting('showFPSCounter');this._showScrollBottleneckRectsSetting=Settings.Settings.instance().moduleSetting('showScrollBottleneckRects');this._showHitTestBordersSetting=Settings.Settings.instance().moduleSetting('showHitTestBorders');this._registeredListeners=[];this._showViewportSizeOnResize=true;if(!target.suspended()){this._overlayAgent.enable();this._wireAgentToSettings();}}
static highlightObjectAsDOMNode(object){const domModel=object.runtimeModel().target().model(DOMModel);if(domModel){domModel.overlayModel().highlightInOverlay({object});}}
static hideDOMNodeHighlight(){for(const overlayModel of TargetManager.instance().models(OverlayModel)){overlayModel._delayedHideHighlight(0);}}
static async muteHighlight(){return Promise.all(TargetManager.instance().models(OverlayModel).map(model=>model.suspendModel()));}
static async unmuteHighlight(){return Promise.all(TargetManager.instance().models(OverlayModel).map(model=>model.resumeModel()));}
_wireAgentToSettings(){this._registeredListeners=[this._showPaintRectsSetting.addChangeListener(()=>this._overlayAgent.setShowPaintRects(this._showPaintRectsSetting.get())),this._showLayoutShiftRegionsSetting.addChangeListener(()=>this._overlayAgent.setShowLayoutShiftRegions(this._showLayoutShiftRegionsSetting.get())),this._showAdHighlightsSetting.addChangeListener(()=>this._overlayAgent.setShowAdHighlights(this._showAdHighlightsSetting.get())),this._showDebugBordersSetting.addChangeListener(()=>this._overlayAgent.setShowDebugBorders(this._showDebugBordersSetting.get())),this._showFPSCounterSetting.addChangeListener(()=>this._overlayAgent.setShowFPSCounter(this._showFPSCounterSetting.get())),this._showScrollBottleneckRectsSetting.addChangeListener(()=>this._overlayAgent.setShowScrollBottleneckRects(this._showScrollBottleneckRectsSetting.get())),this._showHitTestBordersSetting.addChangeListener(()=>this._overlayAgent.setShowHitTestBorders(this._showHitTestBordersSetting.get()))];if(this._showPaintRectsSetting.get()){this._overlayAgent.setShowPaintRects(true);}
if(this._showLayoutShiftRegionsSetting.get()){this._overlayAgent.setShowLayoutShiftRegions(true);}
if(this._showAdHighlightsSetting.get()){this._overlayAgent.setShowAdHighlights(true);}
if(this._showDebugBordersSetting.get()){this._overlayAgent.setShowDebugBorders(true);}
if(this._showFPSCounterSetting.get()){this._overlayAgent.setShowFPSCounter(true);}
if(this._showScrollBottleneckRectsSetting.get()){this._overlayAgent.setShowScrollBottleneckRects(true);}
if(this._showHitTestBordersSetting.get()){this._overlayAgent.setShowHitTestBorders(true);}
if(this._debuggerModel.isPaused()){this._updatePausedInDebuggerMessage();}
return this._overlayAgent.setShowViewportSizeOnResize(this._showViewportSizeOnResize);}
suspendModel(){EventTarget.EventTarget.removeEventListeners(this._registeredListeners);return this._overlayAgent.disable();}
resumeModel(){this._overlayAgent.enable();return this._wireAgentToSettings();}
setShowViewportSizeOnResize(show){this._showViewportSizeOnResize=show;if(this.target().suspended()){return;}
this._overlayAgent.setShowViewportSizeOnResize(show);}
_updatePausedInDebuggerMessage(){if(this.target().suspended()){return;}
const message=this._debuggerModel.isPaused()&&!Settings.Settings.instance().moduleSetting('disablePausedStateOverlay').get()?UIString.UIString('Paused in debugger'):undefined;this._overlayAgent.setPausedInDebuggerMessage(message);}
setHighlighter(highlighter){this._highlighter=highlighter||this._defaultHighlighter;}
async setInspectMode(mode,showStyles=true){await this._domModel.requestDocument();this._inspectModeEnabled=mode!==Protocol.Overlay.InspectMode.None;this.dispatchEventToListeners(Events$5.InspectModeWillBeToggled,this);this._highlighter.setInspectMode(mode,this._buildHighlightConfig('all',showStyles));}
inspectModeEnabled(){return this._inspectModeEnabled;}
highlightInOverlay(data,mode,showInfo){if(this._hideHighlightTimeout){clearTimeout(this._hideHighlightTimeout);this._hideHighlightTimeout=null;}
const highlightConfig=this._buildHighlightConfig(mode);if(typeof showInfo!=='undefined'){highlightConfig.showInfo=showInfo;}
this._highlighter.highlightInOverlay(data,highlightConfig);}
highlightInOverlayForTwoSeconds(data){this.highlightInOverlay(data);this._delayedHideHighlight(2000);}
_delayedHideHighlight(delay){if(this._hideHighlightTimeout===null){this._hideHighlightTimeout=setTimeout(()=>this.highlightInOverlay({}),delay);}}
highlightFrame(frameId){if(this._hideHighlightTimeout){clearTimeout(this._hideHighlightTimeout);this._hideHighlightTimeout=null;}
this._highlighter.highlightFrame(frameId);}
_buildHighlightConfig(mode='all',showStyles=false){const showRulers=Settings.Settings.instance().moduleSetting('showMetricsRulers').get();const highlightConfig={showInfo:mode==='all',showRulers:showRulers,showStyles,showExtensionLines:showRulers};if(mode==='all'||mode==='content'){highlightConfig.contentColor=Color.PageHighlight.Content.toProtocolRGBA();}
if(mode==='all'||mode==='padding'){highlightConfig.paddingColor=Color.PageHighlight.Padding.toProtocolRGBA();}
if(mode==='all'||mode==='border'){highlightConfig.borderColor=Color.PageHighlight.Border.toProtocolRGBA();}
if(mode==='all'||mode==='margin'){highlightConfig.marginColor=Color.PageHighlight.Margin.toProtocolRGBA();}
if(mode==='all'){highlightConfig.eventTargetColor=Color.PageHighlight.EventTarget.toProtocolRGBA();highlightConfig.shapeColor=Color.PageHighlight.Shape.toProtocolRGBA();highlightConfig.shapeMarginColor=Color.PageHighlight.ShapeMargin.toProtocolRGBA();}
if(mode==='all'){highlightConfig.cssGridColor=Color.PageHighlight.CssGrid.toProtocolRGBA();}
return highlightConfig;}
nodeHighlightRequested(nodeId){const node=this._domModel.nodeForId(nodeId);if(node){this.dispatchEventToListeners(Events$5.HighlightNodeRequested,node);}}
static setInspectNodeHandler(handler){OverlayModel._inspectNodeHandler=handler;}
inspectNodeRequested(backendNodeId){const deferredNode=new DeferredDOMNode(this.target(),backendNodeId);if(OverlayModel._inspectNodeHandler){deferredNode.resolvePromise().then(node=>{if(node){OverlayModel._inspectNodeHandler(node);}});}else{Revealer.reveal(deferredNode);}
this.dispatchEventToListeners(Events$5.ExitedInspectMode);}
screenshotRequested(viewport){this.dispatchEventToListeners(Events$5.ScreenshotRequested,viewport);this.dispatchEventToListeners(Events$5.ExitedInspectMode);}
inspectModeCanceled(){this.dispatchEventToListeners(Events$5.ExitedInspectMode);}}
const Events$5={InspectModeWillBeToggled:Symbol('InspectModeWillBeToggled'),ExitedInspectMode:Symbol('InspectModeExited'),HighlightNodeRequested:Symbol('HighlightNodeRequested'),ScreenshotRequested:Symbol('ScreenshotRequested'),};class Highlighter{highlightInOverlay(data,config){}
setInspectMode(mode,config){}
highlightFrame(frameId){}}
class DefaultHighlighter{constructor(model){this._model=model;}
highlightInOverlay(data,config){const{node,deferredNode,object,selectorList}=data;const nodeId=node?node.id:undefined;const backendNodeId=deferredNode?deferredNode.backendNodeId():undefined;const objectId=object?object.objectId:undefined;if(nodeId||backendNodeId||objectId){this._model._overlayAgent.highlightNode(config,nodeId,backendNodeId,objectId,selectorList);}else{this._model._overlayAgent.hideHighlight();}}
setInspectMode(mode,config){return this._model._overlayAgent.setInspectMode(mode,config);}
highlightFrame(frameId){this._model._overlayAgent.highlightFrame(frameId,Color.PageHighlight.Content.toProtocolRGBA(),Color.PageHighlight.ContentOutline.toProtocolRGBA());}}
SDKModel.register(OverlayModel,Capability.DOM,true);let HighlightData;var OverlayModel$1=Object.freeze({__proto__:null,OverlayModel:OverlayModel,Events:Events$5,Highlighter:Highlighter,HighlightData:HighlightData});class DOMNode{constructor(domModel){this._domModel=domModel;}
static create(domModel,doc,isInShadowTree,payload){const node=new DOMNode(domModel);node._init(doc,isInShadowTree,payload);return node;}
_init(doc,isInShadowTree,payload){this._agent=this._domModel._agent;this.ownerDocument=doc;this._isInShadowTree=isInShadowTree;this.id=payload.nodeId;this._backendNodeId=payload.backendNodeId;this._domModel._idToDOMNode[this.id]=this;this._nodeType=payload.nodeType;this._nodeName=payload.nodeName;this._localName=payload.localName;this._nodeValue=payload.nodeValue;this._pseudoType=payload.pseudoType;this._shadowRootType=payload.shadowRootType;this._frameOwnerFrameId=payload.frameId||null;this._xmlVersion=payload.xmlVersion;this._isSVGNode=!!payload.isSVG;this._creationStackTrace=null;this._shadowRoots=[];this._attributes=new Map();if(payload.attributes){this._setAttributesPayload(payload.attributes);}
this._markers=new Map();this._subtreeMarkerCount=0;this._childNodeCount=payload.childNodeCount||0;this._children=null;this.nextSibling=null;this.previousSibling=null;this.firstChild=null;this.lastChild=null;this.parentNode=null;if(payload.shadowRoots){for(let i=0;i<payload.shadowRoots.length;++i){const root=payload.shadowRoots[i];const node=DOMNode.create(this._domModel,this.ownerDocument,true,root);this._shadowRoots.push(node);node.parentNode=this;}}
if(payload.templateContent){this._templateContent=DOMNode.create(this._domModel,this.ownerDocument,true,payload.templateContent);this._templateContent.parentNode=this;this._children=[];}
if(payload.contentDocument){this._contentDocument=new DOMDocument(this._domModel,payload.contentDocument);this._contentDocument.parentNode=this;this._children=[];}else if((payload.nodeName==='IFRAME'||payload.nodeName==='PORTAL')&&payload.frameId){const childTarget=TargetManager.instance().targetById(payload.frameId);const childModel=childTarget?childTarget.model(DOMModel):null;if(childModel){this._childDocumentPromiseForTesting=childModel.requestDocument();}
this._children=[];}
if(payload.importedDocument){this._importedDocument=DOMNode.create(this._domModel,this.ownerDocument,true,payload.importedDocument);this._importedDocument.parentNode=this;this._children=[];}
if(payload.distributedNodes){this._setDistributedNodePayloads(payload.distributedNodes);}
if(payload.children){this._setChildrenPayload(payload.children);}
this._setPseudoElements(payload.pseudoElements);if(this._nodeType===Node.ELEMENT_NODE){if(this.ownerDocument&&!this.ownerDocument.documentElement&&this._nodeName==='HTML'){this.ownerDocument.documentElement=this;}
if(this.ownerDocument&&!this.ownerDocument.body&&this._nodeName==='BODY'){this.ownerDocument.body=this;}}else if(this._nodeType===Node.DOCUMENT_TYPE_NODE){this.publicId=payload.publicId;this.systemId=payload.systemId;this.internalSubset=payload.internalSubset;}else if(this._nodeType===Node.ATTRIBUTE_NODE){this.name=payload.name;this.value=payload.value;}}
isSVGNode(){return this._isSVGNode;}
creationStackTrace(){if(this._creationStackTrace){return this._creationStackTrace;}
const stackTracesPromise=this._agent.invoke_getNodeStackTraces({nodeId:this.id});this._creationStackTrace=stackTracesPromise.then(res=>res.creation);return this._creationStackTrace;}
domModel(){return this._domModel;}
backendNodeId(){return this._backendNodeId;}
children(){return this._children?this._children.slice():null;}
hasAttributes(){return this._attributes.size>0;}
childNodeCount(){return this._childNodeCount;}
hasShadowRoots(){return!!this._shadowRoots.length;}
shadowRoots(){return this._shadowRoots.slice();}
templateContent(){return this._templateContent||null;}
contentDocument(){return this._contentDocument||null;}
isIframe(){return this._nodeName==='IFRAME';}
isPortal(){return this._nodeName==='PORTAL';}
importedDocument(){return this._importedDocument||null;}
nodeType(){return this._nodeType;}
nodeName(){return this._nodeName;}
pseudoType(){return this._pseudoType;}
hasPseudoElements(){return this._pseudoElements.size>0;}
pseudoElements(){return this._pseudoElements;}
beforePseudoElement(){if(!this._pseudoElements){return null;}
return this._pseudoElements.get(DOMNode.PseudoElementNames.Before);}
afterPseudoElement(){if(!this._pseudoElements){return null;}
return this._pseudoElements.get(DOMNode.PseudoElementNames.After);}
markerPseudoElement(){if(!this._pseudoElements){return null;}
return this._pseudoElements.get(DOMNode.PseudoElementNames.Marker);}
isInsertionPoint(){return!this.isXMLNode()&&(this._nodeName==='SHADOW'||this._nodeName==='CONTENT'||this._nodeName==='SLOT');}
distributedNodes(){return this._distributedNodes||[];}
isInShadowTree(){return this._isInShadowTree;}
ancestorShadowHost(){const ancestorShadowRoot=this.ancestorShadowRoot();return ancestorShadowRoot?ancestorShadowRoot.parentNode:null;}
ancestorShadowRoot(){if(!this._isInShadowTree){return null;}
let current=this;while(current&&!current.isShadowRoot()){current=current.parentNode;}
return current;}
ancestorUserAgentShadowRoot(){const ancestorShadowRoot=this.ancestorShadowRoot();if(!ancestorShadowRoot){return null;}
return ancestorShadowRoot.shadowRootType()===DOMNode.ShadowRootTypes.UserAgent?ancestorShadowRoot:null;}
isShadowRoot(){return!!this._shadowRootType;}
shadowRootType(){return this._shadowRootType||null;}
nodeNameInCorrectCase(){const shadowRootType=this.shadowRootType();if(shadowRootType){return'#shadow-root ('+shadowRootType+')';}
if(!this.localName()){return this.nodeName();}
if(this.localName().length!==this.nodeName().length){return this.nodeName();}
return this.localName();}
setNodeName(name,callback){this._agent.invoke_setNodeName({nodeId:this.id,name}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null,this._domModel.nodeForId(response.nodeId));}});}
localName(){return this._localName;}
nodeValue(){return this._nodeValue;}
setNodeValue(value,callback){this._agent.invoke_setNodeValue({nodeId:this.id,value}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null);}});}
getAttribute(name){const attr=this._attributes.get(name);return attr?attr.value:undefined;}
setAttribute(name,text,callback){this._agent.invoke_setAttributesAsText({nodeId:this.id,text,name}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null);}});}
setAttributeValue(name,value,callback){this._agent.invoke_setAttributeValue({nodeId:this.id,name,value}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null);}});}
setAttributeValuePromise(name,value){return new Promise(fulfill=>this.setAttributeValue(name,value,fulfill));}
attributes(){return[...this._attributes.values()];}
async removeAttribute(name){const response=await this._agent.invoke_removeAttribute({nodeId:this.id,name});if(response[InspectorBackend.ProtocolError]){return;}
this._attributes.delete(name);this._domModel.markUndoableState();}
getChildNodes(callback){if(this._children){callback(this.children());return;}
this._agent.invoke_requestChildNodes({nodeId:this.id}).then(response=>{callback(response[InspectorBackend.ProtocolError]?null:this.children());});}
async getSubtree(depth,pierce){const response=await this._agent.invoke_requestChildNodes({nodeId:this.id,depth:depth,pierce:pierce});return response[InspectorBackend.ProtocolError]?null:this._children;}
getOuterHTML(){return this._agent.getOuterHTML(this.id);}
setOuterHTML(html,callback){this._agent.invoke_setOuterHTML({nodeId:this.id,outerHTML:html}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null);}});}
removeNode(callback){this._agent.invoke_removeNode({nodeId:this.id}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null);}});}
async copyNode(){const text=await this._agent.getOuterHTML(this.id);if(text!==null){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(text);}
return text;}
path(){function canPush(node){return node&&('index'in node||(node.isShadowRoot()&&node.parentNode))&&node._nodeName.length;}
const path=[];let node=this;while(canPush(node)){const index=typeof node.index==='number'?node.index:(node.shadowRootType()===DOMNode.ShadowRootTypes.UserAgent?'u':'a');path.push([index,node._nodeName]);node=node.parentNode;}
path.reverse();return path.join(',');}
isAncestor(node){if(!node){return false;}
let currentNode=node.parentNode;while(currentNode){if(this===currentNode){return true;}
currentNode=currentNode.parentNode;}
return false;}
isDescendant(descendant){return descendant!==null&&descendant.isAncestor(this);}
frameId(){let node=this.parentNode||this;while(!node._frameOwnerFrameId&&node.parentNode){node=node.parentNode;}
return node._frameOwnerFrameId;}
_setAttributesPayload(attrs){let attributesChanged=!this._attributes||attrs.length!==this._attributes.size*2;const oldAttributesMap=this._attributes||new Map();this._attributes=new Map();for(let i=0;i<attrs.length;i+=2){const name=attrs[i];const value=attrs[i+1];this._addAttribute(name,value);if(attributesChanged){continue;}
if(!oldAttributesMap.has(name)||oldAttributesMap.get(name).value!==value){attributesChanged=true;}}
return attributesChanged;}
_insertChild(prev,payload){const node=DOMNode.create(this._domModel,this.ownerDocument,this._isInShadowTree,payload);this._children.splice(this._children.indexOf(prev)+1,0,node);this._renumber();return node;}
_removeChild(node){if(node.pseudoType()){this._pseudoElements.delete(node.pseudoType());}else{const shadowRootIndex=this._shadowRoots.indexOf(node);if(shadowRootIndex!==-1){this._shadowRoots.splice(shadowRootIndex,1);}else{console.assert(this._children.indexOf(node)!==-1);this._children.splice(this._children.indexOf(node),1);}}
node.parentNode=null;this._subtreeMarkerCount-=node._subtreeMarkerCount;if(node._subtreeMarkerCount){this._domModel.dispatchEventToListeners(Events$6.MarkersChanged,this);}
this._renumber();}
_setChildrenPayload(payloads){this._children=[];for(let i=0;i<payloads.length;++i){const payload=payloads[i];const node=DOMNode.create(this._domModel,this.ownerDocument,this._isInShadowTree,payload);this._children.push(node);}
this._renumber();}
_setPseudoElements(payloads){this._pseudoElements=new Map();if(!payloads){return;}
for(let i=0;i<payloads.length;++i){const node=DOMNode.create(this._domModel,this.ownerDocument,this._isInShadowTree,payloads[i]);node.parentNode=this;this._pseudoElements.set(node.pseudoType(),node);}}
_setDistributedNodePayloads(payloads){this._distributedNodes=[];for(const payload of payloads){this._distributedNodes.push(new DOMNodeShortcut(this._domModel.target(),payload.backendNodeId,payload.nodeType,payload.nodeName));}}
_renumber(){this._childNodeCount=this._children.length;if(this._childNodeCount===0){this.firstChild=null;this.lastChild=null;return;}
this.firstChild=this._children[0];this.lastChild=this._children[this._childNodeCount-1];for(let i=0;i<this._childNodeCount;++i){const child=this._children[i];child.index=i;child.nextSibling=i+1<this._childNodeCount?this._children[i+1]:null;child.previousSibling=i-1>=0?this._children[i-1]:null;child.parentNode=this;}}
_addAttribute(name,value){const attr={name:name,value:value,_node:this};this._attributes.set(name,attr);}
_setAttribute(name,value){const attr=this._attributes.get(name);if(attr){attr.value=value;}else{this._addAttribute(name,value);}}
_removeAttribute(name){this._attributes.delete(name);}
copyTo(targetNode,anchorNode,callback){this._agent.invoke_copyTo({nodeId:this.id,targetNodeId:targetNode.id,insertBeforeNodeId:anchorNode?anchorNode.id:undefined}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null,response.nodeId);}});}
moveTo(targetNode,anchorNode,callback){this._agent.invoke_moveTo({nodeId:this.id,targetNodeId:targetNode.id,insertBeforeNodeId:anchorNode?anchorNode.id:undefined}).then(response=>{if(!response[InspectorBackend.ProtocolError]){this._domModel.markUndoableState();}
if(callback){callback(response[InspectorBackend.ProtocolError]||null,this._domModel.nodeForId(response.nodeId));}});}
isXMLNode(){return!!this._xmlVersion;}
setMarker(name,value){if(value===null){if(!this._markers.has(name)){return;}
this._markers.delete(name);for(let node=this;node;node=node.parentNode){--node._subtreeMarkerCount;}
for(let node=this;node;node=node.parentNode){this._domModel.dispatchEventToListeners(Events$6.MarkersChanged,node);}
return;}
if(this.parentNode&&!this._markers.has(name)){for(let node=this;node;node=node.parentNode){++node._subtreeMarkerCount;}}
this._markers.set(name,value);for(let node=this;node;node=node.parentNode){this._domModel.dispatchEventToListeners(Events$6.MarkersChanged,node);}}
marker(name){return this._markers.get(name)||null;}
traverseMarkers(visitor){function traverse(node){if(!node._subtreeMarkerCount){return;}
for(const marker of node._markers.keys()){visitor(node,marker);}
if(!node._children){return;}
for(const child of node._children){traverse(child);}}
traverse(this);}
resolveURL(url){if(!url){return url;}
for(let frameOwnerCandidate=this;frameOwnerCandidate;frameOwnerCandidate=frameOwnerCandidate.parentNode){if(frameOwnerCandidate.baseURL){return ParsedURL.ParsedURL.completeURL(frameOwnerCandidate.baseURL,url);}}
return null;}
highlight(mode){this._domModel.overlayModel().highlightInOverlay({node:this},mode);}
highlightForTwoSeconds(){this._domModel.overlayModel().highlightInOverlayForTwoSeconds({node:this});}
async resolveToObject(objectGroup){const object=await this._agent.resolveNode(this.id,undefined,objectGroup);return object&&this._domModel._runtimeModel.createRemoteObject(object);}
boxModel(){return this._agent.getBoxModel(this.id);}
setAsInspectedNode(){let node=this;if(node.pseudoType()){node=node.parentNode;}
while(true){let ancestor=node.ancestorUserAgentShadowRoot();if(!ancestor){break;}
ancestor=node.ancestorShadowHost();if(!ancestor){break;}
node=ancestor;}
this._agent.setInspectedNode(node.id);}
enclosingElementOrSelf(){let node=this;if(node&&node.nodeType()===Node.TEXT_NODE&&node.parentNode){node=node.parentNode;}
if(node&&node.nodeType()!==Node.ELEMENT_NODE){node=null;}
return node;}
async scrollIntoView(){const node=this.enclosingElementOrSelf();if(!node){return;}
const object=await node.resolveToObject();if(!object){return;}
object.callFunction(scrollIntoView);object.release();node.highlightForTwoSeconds();function scrollIntoView(){this.scrollIntoViewIfNeeded(true);}}
async focus(){const node=this.enclosingElementOrSelf();const object=await node.resolveToObject();if(!object){return;}
await object.callFunction(focusInPage);object.release();node.highlightForTwoSeconds();this._domModel.target().pageAgent().bringToFront();function focusInPage(){this.focus();}}
simpleSelector(){const lowerCaseName=this.localName()||this.nodeName().toLowerCase();if(this.nodeType()!==Node.ELEMENT_NODE){return lowerCaseName;}
if(lowerCaseName==='input'&&this.getAttribute('type')&&!this.getAttribute('id')&&!this.getAttribute('class')){return lowerCaseName+'[type="'+this.getAttribute('type')+'"]';}
if(this.getAttribute('id')){return lowerCaseName+'#'+this.getAttribute('id');}
if(this.getAttribute('class')){return(lowerCaseName==='div'?'':lowerCaseName)+'.'+
this.getAttribute('class').trim().replace(/\s+/g,'.');}
return lowerCaseName;}}
DOMNode.PseudoElementNames={Before:'before',After:'after',Marker:'marker'};DOMNode.ShadowRootTypes={UserAgent:'user-agent',Open:'open',Closed:'closed'};class DeferredDOMNode{constructor(target,backendNodeId){this._domModel=(target.model(DOMModel));this._backendNodeId=backendNodeId;}
resolve(callback){this.resolvePromise().then(callback);}
async resolvePromise(){const nodeIds=await this._domModel.pushNodesByBackendIdsToFrontend(new Set([this._backendNodeId]));return nodeIds&&nodeIds.get(this._backendNodeId)||null;}
backendNodeId(){return this._backendNodeId;}
domModel(){return this._domModel;}
highlight(){this._domModel.overlayModel().highlightInOverlay({deferredNode:this});}}
class DOMNodeShortcut{constructor(target,backendNodeId,nodeType,nodeName){this.nodeType=nodeType;this.nodeName=nodeName;this.deferredNode=new DeferredDOMNode(target,backendNodeId);}}
class DOMDocument extends DOMNode{constructor(domModel,payload){super(domModel);this._init(this,false,payload);this.documentURL=payload.documentURL||'';this.baseURL=payload.baseURL||'';}}
class DOMModel extends SDKModel{constructor(target){super(target);this._agent=target.domAgent();this._idToDOMNode={};this._document=null;this._attributeLoadNodeIds=new Set();target.registerDOMDispatcher(new DOMDispatcher(this));this._runtimeModel=(target.model(RuntimeModel));if(!target.suspended()){this._agent.enable();}
if(Root.Runtime.experiments.isEnabled('captureNodeCreationStacks')){this._agent.setNodeStackTracesEnabled(true);}}
runtimeModel(){return this._runtimeModel;}
cssModel(){return(this.target().model(CSSModel));}
overlayModel(){return(this.target().model(OverlayModel));}
static cancelSearch(){for(const domModel of TargetManager.instance().models(DOMModel)){domModel._cancelSearch();}}
_scheduleMutationEvent(node){if(!this.hasEventListeners(Events$6.DOMMutated)){return;}
this._lastMutationId=(this._lastMutationId||0)+1;Promise.resolve().then(callObserve.bind(this,node,this._lastMutationId));function callObserve(node,mutationId){if(!this.hasEventListeners(Events$6.DOMMutated)||this._lastMutationId!==mutationId){return;}
this.dispatchEventToListeners(Events$6.DOMMutated,node);}}
requestDocument(){if(this._document){return Promise.resolve(this._document);}
if(!this._pendingDocumentRequestPromise){this._pendingDocumentRequestPromise=this._requestDocument();}
return this._pendingDocumentRequestPromise;}
async _requestDocument(){const documentPayload=await this._agent.getDocument();delete this._pendingDocumentRequestPromise;if(documentPayload){this._setDocument(documentPayload);}
if(!this._document){console.error('No document');return null;}
const parentModel=this.parentModel();if(parentModel&&!this._frameOwnerNode){await parentModel.requestDocument();const response=await parentModel._agent.invoke_getFrameOwner({frameId:this.target().id()});if(!response[InspectorBackend.ProtocolError]){this._frameOwnerNode=parentModel.nodeForId(response.nodeId);}}
if(this._frameOwnerNode){const oldDocument=this._frameOwnerNode._contentDocument;this._frameOwnerNode._contentDocument=this._document;this._frameOwnerNode._children=[];if(this._document){this._document.parentNode=this._frameOwnerNode;this.dispatchEventToListeners(Events$6.NodeInserted,this._document);}else if(oldDocument){this.dispatchEventToListeners(Events$6.NodeRemoved,{node:oldDocument,parent:this._frameOwnerNode});}}
return this._document;}
existingDocument(){return this._document;}
async pushNodeToFrontend(objectId){await this.requestDocument();const nodeId=await this._agent.requestNode(objectId);return nodeId?this.nodeForId(nodeId):null;}
pushNodeByPathToFrontend(path){return this.requestDocument().then(()=>this._agent.pushNodeByPathToFrontend(path));}
async pushNodesByBackendIdsToFrontend(backendNodeIds){await this.requestDocument();const backendNodeIdsArray=[...backendNodeIds];const nodeIds=await this._agent.pushNodesByBackendIdsToFrontend(backendNodeIdsArray);if(!nodeIds){return null;}
const map=new Map();for(let i=0;i<nodeIds.length;++i){if(nodeIds[i]){map.set(backendNodeIdsArray[i],this.nodeForId(nodeIds[i]));}}
return map;}
_wrapClientCallback(callback){function wrapper(error,result){callback(error?null:result||null);}
return wrapper;}
_attributeModified(nodeId,name,value){const node=this._idToDOMNode[nodeId];if(!node){return;}
node._setAttribute(name,value);this.dispatchEventToListeners(Events$6.AttrModified,{node:node,name:name});this._scheduleMutationEvent(node);}
_attributeRemoved(nodeId,name){const node=this._idToDOMNode[nodeId];if(!node){return;}
node._removeAttribute(name);this.dispatchEventToListeners(Events$6.AttrRemoved,{node:node,name:name});this._scheduleMutationEvent(node);}
_inlineStyleInvalidated(nodeIds){this._attributeLoadNodeIds.addAll(nodeIds);if(!this._loadNodeAttributesTimeout){this._loadNodeAttributesTimeout=setTimeout(this._loadNodeAttributes.bind(this),20);}}
_loadNodeAttributes(){delete this._loadNodeAttributesTimeout;for(const nodeId of this._attributeLoadNodeIds){this._agent.getAttributes(nodeId).then(attributes=>{if(!attributes){return;}
const node=this._idToDOMNode[nodeId];if(!node){return;}
if(node._setAttributesPayload(attributes)){this.dispatchEventToListeners(Events$6.AttrModified,{node:node,name:'style'});this._scheduleMutationEvent(node);}});}
this._attributeLoadNodeIds.clear();}
_characterDataModified(nodeId,newValue){const node=this._idToDOMNode[nodeId];node._nodeValue=newValue;this.dispatchEventToListeners(Events$6.CharacterDataModified,node);this._scheduleMutationEvent(node);}
nodeForId(nodeId){return this._idToDOMNode[nodeId]||null;}
_documentUpdated(){const documentWasRequested=this._document||this._pendingDocumentRequestPromise;this._setDocument(null);if(this.parentModel()&&documentWasRequested){this.requestDocument();}}
_setDocument(payload){this._idToDOMNode={};if(payload&&'nodeId'in payload){this._document=new DOMDocument(this,payload);}else{this._document=null;}
self.SDK.domModelUndoStack._dispose(this);if(!this.parentModel()){this.dispatchEventToListeners(Events$6.DocumentUpdated,this);}}
_setDetachedRoot(payload){if(payload.nodeName==='#document'){new DOMDocument(this,payload);}else{DOMNode.create(this,null,false,payload);}}
_setChildNodes(parentId,payloads){if(!parentId&&payloads.length){this._setDetachedRoot(payloads[0]);return;}
const parent=this._idToDOMNode[parentId];parent._setChildrenPayload(payloads);}
_childNodeCountUpdated(nodeId,newValue){const node=this._idToDOMNode[nodeId];node._childNodeCount=newValue;this.dispatchEventToListeners(Events$6.ChildNodeCountUpdated,node);this._scheduleMutationEvent(node);}
_childNodeInserted(parentId,prevId,payload){const parent=this._idToDOMNode[parentId];const prev=this._idToDOMNode[prevId];const node=parent._insertChild(prev,payload);this._idToDOMNode[node.id]=node;this.dispatchEventToListeners(Events$6.NodeInserted,node);this._scheduleMutationEvent(node);}
_childNodeRemoved(parentId,nodeId){const parent=this._idToDOMNode[parentId];const node=this._idToDOMNode[nodeId];parent._removeChild(node);this._unbind(node);this.dispatchEventToListeners(Events$6.NodeRemoved,{node:node,parent:parent});this._scheduleMutationEvent(node);}
_shadowRootPushed(hostId,root){const host=this._idToDOMNode[hostId];if(!host){return;}
const node=DOMNode.create(this,host.ownerDocument,true,root);node.parentNode=host;this._idToDOMNode[node.id]=node;host._shadowRoots.unshift(node);this.dispatchEventToListeners(Events$6.NodeInserted,node);this._scheduleMutationEvent(node);}
_shadowRootPopped(hostId,rootId){const host=this._idToDOMNode[hostId];if(!host){return;}
const root=this._idToDOMNode[rootId];if(!root){return;}
host._removeChild(root);this._unbind(root);this.dispatchEventToListeners(Events$6.NodeRemoved,{node:root,parent:host});this._scheduleMutationEvent(root);}
_pseudoElementAdded(parentId,pseudoElement){const parent=this._idToDOMNode[parentId];if(!parent){return;}
const node=DOMNode.create(this,parent.ownerDocument,false,pseudoElement);node.parentNode=parent;this._idToDOMNode[node.id]=node;console.assert(!parent._pseudoElements.get(node.pseudoType()));parent._pseudoElements.set(node.pseudoType(),node);this.dispatchEventToListeners(Events$6.NodeInserted,node);this._scheduleMutationEvent(node);}
_pseudoElementRemoved(parentId,pseudoElementId){const parent=this._idToDOMNode[parentId];if(!parent){return;}
const pseudoElement=this._idToDOMNode[pseudoElementId];if(!pseudoElement){return;}
parent._removeChild(pseudoElement);this._unbind(pseudoElement);this.dispatchEventToListeners(Events$6.NodeRemoved,{node:pseudoElement,parent:parent});this._scheduleMutationEvent(pseudoElement);}
_distributedNodesUpdated(insertionPointId,distributedNodes){const insertionPoint=this._idToDOMNode[insertionPointId];if(!insertionPoint){return;}
insertionPoint._setDistributedNodePayloads(distributedNodes);this.dispatchEventToListeners(Events$6.DistributedNodesChanged,insertionPoint);this._scheduleMutationEvent(insertionPoint);}
_unbind(node){delete this._idToDOMNode[node.id];for(let i=0;node._children&&i<node._children.length;++i){this._unbind(node._children[i]);}
for(let i=0;i<node._shadowRoots.length;++i){this._unbind(node._shadowRoots[i]);}
const pseudoElements=node.pseudoElements();for(const value of pseudoElements.values()){this._unbind(value);}
if(node._templateContent){this._unbind(node._templateContent);}}
async performSearch(query,includeUserAgentShadowDOM){const response=await this._agent.invoke_performSearch({query,includeUserAgentShadowDOM});if(!response[InspectorBackend.ProtocolError]){this._searchId=response.searchId;}
return response[InspectorBackend.ProtocolError]?0:response.resultCount;}
async searchResult(index){if(!this._searchId){return null;}
const nodeIds=await this._agent.getSearchResults(this._searchId,index,index+1);return nodeIds&&nodeIds.length===1?this.nodeForId(nodeIds[0]):null;}
_cancelSearch(){if(!this._searchId){return;}
this._agent.discardSearchResults(this._searchId);delete this._searchId;}
classNamesPromise(nodeId){return this._agent.collectClassNamesFromSubtree(nodeId).then(classNames=>classNames||[]);}
querySelector(nodeId,selectors){return this._agent.querySelector(nodeId,selectors);}
querySelectorAll(nodeId,selectors){return this._agent.querySelectorAll(nodeId,selectors);}
markUndoableState(minorChange){self.SDK.domModelUndoStack._markUndoableState(this,minorChange||false);}
async nodeForLocation(x,y,includeUserAgentShadowDOM){const response=await this._agent.invoke_getNodeForLocation({x,y,includeUserAgentShadowDOM});if(response[InspectorBackend.ProtocolError]||!response.nodeId){return null;}
return this.nodeForId(response.nodeId);}
pushObjectAsNodeToFrontend(object){return object.isNode()?this.pushNodeToFrontend((object.objectId)):Promise.resolve(null);}
suspendModel(){return this._agent.disable().then(()=>this._setDocument(null));}
resumeModel(){return this._agent.enable();}
dispose(){self.SDK.domModelUndoStack._dispose(this);}
parentModel(){const parentTarget=this.target().parentTarget();return parentTarget?parentTarget.model(DOMModel):null;}}
const Events$6={AttrModified:Symbol('AttrModified'),AttrRemoved:Symbol('AttrRemoved'),CharacterDataModified:Symbol('CharacterDataModified'),DOMMutated:Symbol('DOMMutated'),NodeInserted:Symbol('NodeInserted'),NodeRemoved:Symbol('NodeRemoved'),DocumentUpdated:Symbol('DocumentUpdated'),ChildNodeCountUpdated:Symbol('ChildNodeCountUpdated'),DistributedNodesChanged:Symbol('DistributedNodesChanged'),MarkersChanged:Symbol('MarkersChanged')};class DOMDispatcher{constructor(domModel){this._domModel=domModel;}
documentUpdated(){this._domModel._documentUpdated();}
attributeModified(nodeId,name,value){this._domModel._attributeModified(nodeId,name,value);}
attributeRemoved(nodeId,name){this._domModel._attributeRemoved(nodeId,name);}
inlineStyleInvalidated(nodeIds){this._domModel._inlineStyleInvalidated(nodeIds);}
characterDataModified(nodeId,characterData){this._domModel._characterDataModified(nodeId,characterData);}
setChildNodes(parentId,payloads){this._domModel._setChildNodes(parentId,payloads);}
childNodeCountUpdated(nodeId,childNodeCount){this._domModel._childNodeCountUpdated(nodeId,childNodeCount);}
childNodeInserted(parentNodeId,previousNodeId,payload){this._domModel._childNodeInserted(parentNodeId,previousNodeId,payload);}
childNodeRemoved(parentNodeId,nodeId){this._domModel._childNodeRemoved(parentNodeId,nodeId);}
shadowRootPushed(hostId,root){this._domModel._shadowRootPushed(hostId,root);}
shadowRootPopped(hostId,rootId){this._domModel._shadowRootPopped(hostId,rootId);}
pseudoElementAdded(parentId,pseudoElement){this._domModel._pseudoElementAdded(parentId,pseudoElement);}
pseudoElementRemoved(parentId,pseudoElementId){this._domModel._pseudoElementRemoved(parentId,pseudoElementId);}
distributedNodesUpdated(insertionPointId,distributedNodes){this._domModel._distributedNodesUpdated(insertionPointId,distributedNodes);}}
class DOMModelUndoStack{constructor(){this._stack=[];this._index=0;this._lastModelWithMinorChange=null;}
_markUndoableState(model,minorChange){if(this._lastModelWithMinorChange&&model!==this._lastModelWithMinorChange){this._lastModelWithMinorChange.markUndoableState();this._lastModelWithMinorChange=null;}
if(minorChange&&this._lastModelWithMinorChange===model){return;}
this._stack=this._stack.slice(0,this._index);this._stack.push(model);this._index=this._stack.length;if(minorChange){this._lastModelWithMinorChange=model;}else{model._agent.markUndoableState();this._lastModelWithMinorChange=null;}}
undo(){if(this._index===0){return Promise.resolve();}
--this._index;this._lastModelWithMinorChange=null;return this._stack[this._index]._agent.undo();}
redo(){if(this._index>=this._stack.length){return Promise.resolve();}
++this._index;this._lastModelWithMinorChange=null;return this._stack[this._index-1]._agent.redo();}
_dispose(model){let shift=0;for(let i=0;i<this._index;++i){if(this._stack[i]===model){++shift;}}
ArrayUtilities.removeElement(this._stack,model);this._index-=shift;if(this._lastModelWithMinorChange===model){this._lastModelWithMinorChange=null;}}}
SDKModel.register(DOMModel,Capability.DOM,true);let Attribute;var DOMModel$1=Object.freeze({__proto__:null,DOMNode:DOMNode,DeferredDOMNode:DeferredDOMNode,DOMNodeShortcut:DOMNodeShortcut,DOMDocument:DOMDocument,DOMModel:DOMModel,Events:Events$6,DOMModelUndoStack:DOMModelUndoStack,Attribute:Attribute});class Resource{constructor(resourceTreeModel,request,url,documentURL,frameId,loaderId,type,mimeType,lastModified,contentSize){this._resourceTreeModel=resourceTreeModel;this._request=request;this.url=url;this._documentURL=documentURL;this._frameId=frameId;this._loaderId=loaderId;this._type=type||ResourceType.resourceTypes.Other;this._mimeType=mimeType;this._lastModified=lastModified&&lastModified.isValid()?lastModified:null;this._contentSize=contentSize;this._content;this._contentLoadError;this._contentEncoded;this._pendingContentCallbacks=[];if(this._request&&!this._request.finished){this._request.addEventListener(Events$2.FinishedLoading,this._requestFinished,this);}}
lastModified(){if(this._lastModified||!this._request){return this._lastModified;}
const lastModifiedHeader=this._request.responseLastModified();const date=lastModifiedHeader?new Date(lastModifiedHeader):null;this._lastModified=date&&date.isValid()?date:null;return this._lastModified;}
contentSize(){if(typeof this._contentSize==='number'||!this._request){return this._contentSize;}
return this._request.resourceSize;}
get request(){return this._request;}
get url(){return this._url;}
set url(x){this._url=x;this._parsedURL=new ParsedURL.ParsedURL(x);}
get parsedURL(){return this._parsedURL;}
get documentURL(){return this._documentURL;}
get frameId(){return this._frameId;}
get loaderId(){return this._loaderId;}
get displayName(){return this._parsedURL.displayName;}
resourceType(){return this._request?this._request.resourceType():this._type;}
get mimeType(){return this._request?this._request.mimeType:this._mimeType;}
get content(){return this._content;}
contentURL(){return this._url;}
contentType(){if(this.resourceType()===ResourceType.resourceTypes.Document&&this.mimeType.indexOf('javascript')!==-1){return ResourceType.resourceTypes.Script;}
return this.resourceType();}
async contentEncoded(){await this.requestContent();return this._contentEncoded;}
requestContent(){if(typeof this._content!=='undefined'){return Promise.resolve({content:(this._content),isEncoded:this._contentEncoded});}
let callback;const promise=new Promise(fulfill=>callback=fulfill);this._pendingContentCallbacks.push(callback);if(!this._request||this._request.finished){this._innerRequestContent();}
return promise;}
canonicalMimeType(){return this.contentType().canonicalMimeType()||this.mimeType;}
async searchInContent(query,caseSensitive,isRegex){if(!this.frameId){return[];}
if(this.request){return this.request.searchInContent(query,caseSensitive,isRegex);}
const result=await this._resourceTreeModel.target().pageAgent().searchInResource(this.frameId,this.url,query,caseSensitive,isRegex);return result||[];}
async populateImageSource(image){const{content}=await this.requestContent();const encoded=this._contentEncoded;image.src=ContentProvider.contentAsDataURL(content,this._mimeType,encoded)||this._url;}
_requestFinished(){this._request.removeEventListener(Events$2.FinishedLoading,this._requestFinished,this);if(this._pendingContentCallbacks.length){this._innerRequestContent();}}
async _innerRequestContent(){if(this._contentRequested){return;}
this._contentRequested=true;let loadResult;if(this.request){const contentData=await this.request.contentData();this._content=contentData.content;this._contentEncoded=contentData.encoded;loadResult={content:(contentData.content),isEncoded:contentData.encoded};}else{const response=await this._resourceTreeModel.target().pageAgent().invoke_getResourceContent({frameId:this.frameId,url:this.url});if(response[InspectorBackend.ProtocolError]){this._contentLoadError=response[InspectorBackend.ProtocolError];this._content=null;loadResult={error:response[InspectorBackend.ProtocolError],isEncoded:false};}else{this._content=response.content;this._contentLoadError=null;loadResult={content:response.content,isEncoded:response.base64Encoded};}
this._contentEncoded=response.base64Encoded;}
if(this._content===null){this._contentEncoded=false;}
for(const callback of this._pendingContentCallbacks.splice(0)){callback(loadResult);}
delete this._contentRequested;}
hasTextContent(){if(this._type.isTextType()){return true;}
if(this._type===ResourceType.resourceTypes.Other){return!!this._content&&!this._contentEncoded;}
return false;}
frame(){return this._resourceTreeModel.frameForId(this._frameId);}}
var Resource$1=Object.freeze({__proto__:null,Resource:Resource});class SecurityOriginManager extends SDKModel{constructor(target){super(target);this._mainSecurityOrigin='';this._unreachableMainSecurityOrigin='';this._securityOrigins=new Set();}
updateSecurityOrigins(securityOrigins){const oldOrigins=this._securityOrigins;this._securityOrigins=securityOrigins;for(const origin of oldOrigins){if(!this._securityOrigins.has(origin)){this.dispatchEventToListeners(Events$7.SecurityOriginRemoved,origin);}}
for(const origin of this._securityOrigins){if(!oldOrigins.has(origin)){this.dispatchEventToListeners(Events$7.SecurityOriginAdded,origin);}}}
securityOrigins(){return[...this._securityOrigins];}
mainSecurityOrigin(){return this._mainSecurityOrigin;}
unreachableMainSecurityOrigin(){return this._unreachableMainSecurityOrigin;}
setMainSecurityOrigin(securityOrigin,unreachableSecurityOrigin){this._mainSecurityOrigin=securityOrigin;this._unreachableMainSecurityOrigin=unreachableSecurityOrigin||null;this.dispatchEventToListeners(Events$7.MainSecurityOriginChanged,{mainSecurityOrigin:this._mainSecurityOrigin,unreachableMainSecurityOrigin:this._unreachableMainSecurityOrigin});}}
const Events$7={SecurityOriginAdded:Symbol('SecurityOriginAdded'),SecurityOriginRemoved:Symbol('SecurityOriginRemoved'),MainSecurityOriginChanged:Symbol('MainSecurityOriginChanged')};SDKModel.register(SecurityOriginManager,Capability.None,false);var SecurityOriginManager$1=Object.freeze({__proto__:null,SecurityOriginManager:SecurityOriginManager,Events:Events$7});class ResourceTreeModel extends SDKModel{constructor(target){super(target);const networkManager=target.model(NetworkManager);if(networkManager){networkManager.addEventListener(Events$1.RequestFinished,this._onRequestFinished,this);networkManager.addEventListener(Events$1.RequestUpdateDropped,this._onRequestUpdateDropped,this);}
this._agent=target.pageAgent();this._agent.enable();this._securityOriginManager=target.model(SecurityOriginManager);target.registerPageDispatcher(new PageDispatcher(this));this._frames=new Map();this._cachedResourcesProcessed=false;this._pendingReloadOptions=null;this._reloadSuspensionCount=0;this._isInterstitialShowing=false;this.mainFrame=null;this._agent.getResourceTree().then(this._processCachedResources.bind(this));}
static frameForRequest(request){const networkManager=NetworkManager.forRequest(request);const resourceTreeModel=networkManager?networkManager.target().model(ResourceTreeModel):null;if(!resourceTreeModel){return null;}
return resourceTreeModel.frameForId(request.frameId);}
static frames(){const result=[];for(const resourceTreeModel of TargetManager.instance().models(ResourceTreeModel)){result.push(...resourceTreeModel._frames.values());}
return result;}
static resourceForURL(url){for(const resourceTreeModel of TargetManager.instance().models(ResourceTreeModel)){const mainFrame=resourceTreeModel.mainFrame;const result=mainFrame?mainFrame.resourceForURL(url):null;if(result){return result;}}
return null;}
static reloadAllPages(bypassCache,scriptToEvaluateOnLoad){for(const resourceTreeModel of TargetManager.instance().models(ResourceTreeModel)){if(!resourceTreeModel.target().parentTarget()){resourceTreeModel.reloadPage(bypassCache,scriptToEvaluateOnLoad);}}}
domModel(){return(this.target().model(DOMModel));}
_processCachedResources(mainFramePayload){if(mainFramePayload){this.dispatchEventToListeners(Events$8.WillLoadCachedResources);this._addFramesRecursively(null,mainFramePayload);this.target().setInspectedURL(mainFramePayload.frame.url);}
this._cachedResourcesProcessed=true;const runtimeModel=this.target().model(RuntimeModel);if(runtimeModel){runtimeModel.setExecutionContextComparator(this._executionContextComparator.bind(this));runtimeModel.fireExecutionContextOrderChanged();}
this.dispatchEventToListeners(Events$8.CachedResourcesLoaded,this);}
cachedResourcesLoaded(){return this._cachedResourcesProcessed;}
isInterstitialShowing(){return this._isInterstitialShowing;}
_addFrame(frame,aboutToNavigate){this._frames.set(frame.id,frame);if(frame.isMainFrame()){this.mainFrame=frame;}
this.dispatchEventToListeners(Events$8.FrameAdded,frame);this._updateSecurityOrigins();}
_frameAttached(frameId,parentFrameId,stackTrace){const parentFrame=parentFrameId?(this._frames.get(parentFrameId)||null):null;if(!this._cachedResourcesProcessed&&parentFrame){return null;}
if(this._frames.has(frameId)){return null;}
const frame=new ResourceTreeFrame(this,parentFrame,frameId,null,stackTrace||null);if(parentFrameId&&!parentFrame){frame._crossTargetParentFrameId=parentFrameId;}
if(frame.isMainFrame()&&this.mainFrame){this._frameDetached(this.mainFrame.id);}
this._addFrame(frame,true);return frame;}
_frameNavigated(framePayload){const parentFrame=framePayload.parentId?(this._frames.get(framePayload.parentId)||null):null;if(!this._cachedResourcesProcessed&&parentFrame){return;}
let frame=this._frames.get(framePayload.id);if(!frame){frame=this._frameAttached(framePayload.id,framePayload.parentId||'');console.assert(frame);}
this.dispatchEventToListeners(Events$8.FrameWillNavigate,frame);frame._navigate(framePayload);this.dispatchEventToListeners(Events$8.FrameNavigated,frame);if(frame.isMainFrame()){this.dispatchEventToListeners(Events$8.MainFrameNavigated,frame);}
const resources=frame.resources();for(let i=0;i<resources.length;++i){this.dispatchEventToListeners(Events$8.ResourceAdded,resources[i]);}
if(frame.isMainFrame()){this.target().setInspectedURL(frame.url);}
this._updateSecurityOrigins();}
_frameDetached(frameId){if(!this._cachedResourcesProcessed){return;}
const frame=this._frames.get(frameId);if(!frame){return;}
if(frame.parentFrame){frame.parentFrame._removeChildFrame(frame);}else{frame._remove();}
this._updateSecurityOrigins();}
_onRequestFinished(event){if(!this._cachedResourcesProcessed){return;}
const request=(event.data);if(request.failed||request.resourceType()===ResourceType.resourceTypes.XHR){return;}
const frame=this._frames.get(request.frameId);if(frame){frame._addRequest(request);}}
_onRequestUpdateDropped(event){if(!this._cachedResourcesProcessed){return;}
const frameId=event.data.frameId;const frame=this._frames.get(frameId);if(!frame){return;}
const url=event.data.url;if(frame._resourcesMap[url]){return;}
const resource=new Resource(this,null,url,frame.url,frameId,event.data.loaderId,ResourceType.resourceTypes[event.data.resourceType],event.data.mimeType,event.data.lastModified,null);frame.addResource(resource);}
frameForId(frameId){return this._frames.get(frameId);}
forAllResources(callback){if(this.mainFrame){return this.mainFrame._callForFrameResources(callback);}
return false;}
frames(){return[...this._frames.values()];}
resourceForURL(url){return this.mainFrame?this.mainFrame.resourceForURL(url):null;}
_addFramesRecursively(parentFrame,frameTreePayload){const framePayload=frameTreePayload.frame;const frame=new ResourceTreeFrame(this,parentFrame,framePayload.id,framePayload,null);if(!parentFrame&&framePayload.parentId){frame._crossTargetParentFrameId=framePayload.parentId;}
this._addFrame(frame);for(const childFrame of frameTreePayload.childFrames||[]){this._addFramesRecursively(frame,childFrame);}
for(let i=0;i<frameTreePayload.resources.length;++i){const subresource=frameTreePayload.resources[i];const resource=this._createResourceFromFramePayload(framePayload,subresource.url,ResourceType.resourceTypes[subresource.type],subresource.mimeType,subresource.lastModified||null,subresource.contentSize||null);frame.addResource(resource);}
if(!frame._resourcesMap[framePayload.url]){const frameResource=this._createResourceFromFramePayload(framePayload,framePayload.url,ResourceType.resourceTypes.Document,framePayload.mimeType,null,null);frame.addResource(frameResource);}}
_createResourceFromFramePayload(frame,url,type,mimeType,lastModifiedTime,contentSize){const lastModified=typeof lastModifiedTime==='number'?new Date(lastModifiedTime*1000):null;return new Resource(this,null,url,frame.url,frame.id,frame.loaderId,type,mimeType,lastModified,contentSize);}
suspendReload(){this._reloadSuspensionCount++;}
resumeReload(){this._reloadSuspensionCount--;console.assert(this._reloadSuspensionCount>=0,'Unbalanced call to ResourceTreeModel.resumeReload()');if(!this._reloadSuspensionCount&&this._pendingReloadOptions){this.reloadPage.apply(this,this._pendingReloadOptions);}}
reloadPage(bypassCache,scriptToEvaluateOnLoad){if(!this._pendingReloadOptions){this.dispatchEventToListeners(Events$8.PageReloadRequested,this);}
if(this._reloadSuspensionCount){this._pendingReloadOptions=[bypassCache,scriptToEvaluateOnLoad];return;}
this._pendingReloadOptions=null;this.dispatchEventToListeners(Events$8.WillReloadPage);this._agent.reload(bypassCache,scriptToEvaluateOnLoad);}
navigate(url){return this._agent.navigate(url);}
async navigationHistory(){const response=await this._agent.invoke_getNavigationHistory({});if(response[InspectorBackend.ProtocolError]){return null;}
return{currentIndex:response.currentIndex,entries:response.entries};}
navigateToHistoryEntry(entry){this._agent.navigateToHistoryEntry(entry.id);}
async fetchAppManifest(){const response=await this._agent.invoke_getAppManifest({});if(response[InspectorBackend.ProtocolError]){return{url:response.url,data:null,errors:[]};}
return{url:response.url,data:response.data||null,errors:response.errors};}
async getInstallabilityErrors(){const response=await this._agent.invoke_getInstallabilityErrors({});return response.installabilityErrors||[];}
async getManifestIcons(){const response=await this._agent.invoke_getManifestIcons({});return{primaryIcon:response.primaryIcon||null};}
_executionContextComparator(a,b){function framePath(frame){let currentFrame=frame;const parents=[];while(currentFrame){parents.push(currentFrame);currentFrame=currentFrame.parentFrame;}
return parents.reverse();}
if(a.target()!==b.target()){return ExecutionContext.comparator(a,b);}
const framesA=a.frameId?framePath(this.frameForId(a.frameId)):[];const framesB=b.frameId?framePath(this.frameForId(b.frameId)):[];let frameA;let frameB;for(let i=0;;i++){if(!framesA[i]||!framesB[i]||(framesA[i]!==framesB[i])){frameA=framesA[i];frameB=framesB[i];break;}}
if(!frameA&&frameB){return-1;}
if(!frameB&&frameA){return 1;}
if(frameA&&frameB){return frameA.id.localeCompare(frameB.id);}
return ExecutionContext.comparator(a,b);}
_getSecurityOriginData(){const securityOrigins=new Set();let mainSecurityOrigin=null;let unreachableMainSecurityOrigin=null;for(const frame of this._frames.values()){const origin=frame.securityOrigin;if(!origin){continue;}
securityOrigins.add(origin);if(frame.isMainFrame()){mainSecurityOrigin=origin;if(frame.unreachableUrl()){const unreachableParsed=new ParsedURL.ParsedURL(frame.unreachableUrl());unreachableMainSecurityOrigin=unreachableParsed.securityOrigin();}}}
return{securityOrigins:securityOrigins,mainSecurityOrigin:mainSecurityOrigin,unreachableMainSecurityOrigin:unreachableMainSecurityOrigin};}
_updateSecurityOrigins(){const data=this._getSecurityOriginData();this._securityOriginManager.setMainSecurityOrigin(data.mainSecurityOrigin||'',data.unreachableMainSecurityOrigin||'');this._securityOriginManager.updateSecurityOrigins(data.securityOrigins);}
getMainSecurityOrigin(){const data=this._getSecurityOriginData();return data.mainSecurityOrigin||data.unreachableMainSecurityOrigin;}}
const Events$8={FrameAdded:Symbol('FrameAdded'),FrameNavigated:Symbol('FrameNavigated'),FrameDetached:Symbol('FrameDetached'),FrameResized:Symbol('FrameResized'),FrameWillNavigate:Symbol('FrameWillNavigate'),MainFrameNavigated:Symbol('MainFrameNavigated'),ResourceAdded:Symbol('ResourceAdded'),WillLoadCachedResources:Symbol('WillLoadCachedResources'),CachedResourcesLoaded:Symbol('CachedResourcesLoaded'),DOMContentLoaded:Symbol('DOMContentLoaded'),LifecycleEvent:Symbol('LifecycleEvent'),Load:Symbol('Load'),PageReloadRequested:Symbol('PageReloadRequested'),WillReloadPage:Symbol('WillReloadPage'),InterstitialShown:Symbol('InterstitialShown'),InterstitialHidden:Symbol('InterstitialHidden')};class ResourceTreeFrame{constructor(model,parentFrame,frameId,payload,creationStackTrace){this._model=model;this._parentFrame=parentFrame;this._id=frameId;this._url='';this._crossTargetParentFrameId=null;if(payload){this._loaderId=payload.loaderId;this._name=payload.name;this._url=payload.url;this._securityOrigin=payload.securityOrigin;this._mimeType=payload.mimeType;this._unreachableUrl=payload.unreachableUrl||'';}
this._creationStackTrace=creationStackTrace;this._childFrames=new Set();this._resourcesMap={};if(this._parentFrame){this._parentFrame._childFrames.add(this);}}
_navigate(framePayload){this._loaderId=framePayload.loaderId;this._name=framePayload.name;this._url=framePayload.url;this._securityOrigin=framePayload.securityOrigin;this._mimeType=framePayload.mimeType;this._unreachableUrl=framePayload.unreachableUrl||'';const mainResource=this._resourcesMap[this._url];this._resourcesMap={};this._removeChildFrames();if(mainResource&&mainResource.loaderId===this._loaderId){this.addResource(mainResource);}}
resourceTreeModel(){return this._model;}
get id(){return this._id;}
get name(){return this._name||'';}
get url(){return this._url;}
get securityOrigin(){return this._securityOrigin;}
unreachableUrl(){return this._unreachableUrl;}
get loaderId(){return this._loaderId;}
get parentFrame(){return this._parentFrame;}
get childFrames(){return[...this._childFrames];}
crossTargetParentFrame(){if(!this._crossTargetParentFrameId){return null;}
if(!this._model.target().parentTarget()){return null;}
const parentModel=this._model.target().parentTarget().model(ResourceTreeModel);if(!parentModel){return null;}
return parentModel._frames.get(this._crossTargetParentFrameId)||null;}
findCreationCallFrame(searchFn){let stackTrace=this._creationStackTrace;while(stackTrace){const foundEntry=stackTrace.callFrames.find(searchFn);if(foundEntry){return foundEntry;}
stackTrace=this.parent;}
return null;}
isMainFrame(){return!this._parentFrame;}
isTopFrame(){return!this._parentFrame&&!this._crossTargetParentFrameId;}
get mainResource(){return this._resourcesMap[this._url];}
_removeChildFrame(frame){this._childFrames.delete(frame);frame._remove();}
_removeChildFrames(){const frames=this._childFrames;this._childFrames=new Set();for(const frame of frames){frame._remove();}}
_remove(){this._removeChildFrames();this._model._frames.delete(this.id);this._model.dispatchEventToListeners(Events$8.FrameDetached,this);}
addResource(resource){if(this._resourcesMap[resource.url]===resource){return;}
this._resourcesMap[resource.url]=resource;this._model.dispatchEventToListeners(Events$8.ResourceAdded,resource);}
_addRequest(request){let resource=this._resourcesMap[request.url()];if(resource&&resource.request===request){return;}
resource=new Resource(this._model,request,request.url(),request.documentURL,request.frameId,request.loaderId,request.resourceType(),request.mimeType,null,null);this._resourcesMap[resource.url]=resource;this._model.dispatchEventToListeners(Events$8.ResourceAdded,resource);}
resources(){const result=[];for(const url in this._resourcesMap){result.push(this._resourcesMap[url]);}
return result;}
resourceForURL(url){const resource=this._resourcesMap[url];if(resource){return resource;}
for(const frame of this._childFrames){const resource=frame.resourceForURL(url);if(resource){return resource;}}
return null;}
_callForFrameResources(callback){for(const url in this._resourcesMap){if(callback(this._resourcesMap[url])){return true;}}
for(const frame of this._childFrames){if(frame._callForFrameResources(callback)){return true;}}
return false;}
displayName(){if(this.isTopFrame()){return UIString.UIString('top');}
const subtitle=new ParsedURL.ParsedURL(this._url).displayName;if(subtitle){if(!this._name){return subtitle;}
return this._name+' ('+subtitle+')';}
return UIString.UIString('<iframe>');}}
class PageDispatcher{constructor(resourceTreeModel){this._resourceTreeModel=resourceTreeModel;}
domContentEventFired(time){this._resourceTreeModel.dispatchEventToListeners(Events$8.DOMContentLoaded,time);}
loadEventFired(time){this._resourceTreeModel.dispatchEventToListeners(Events$8.Load,{resourceTreeModel:this._resourceTreeModel,loadTime:time});}
lifecycleEvent(frameId,loaderId,name,time){this._resourceTreeModel.dispatchEventToListeners(Events$8.LifecycleEvent,{frameId,name});}
frameAttached(frameId,parentFrameId,stackTrace){this._resourceTreeModel._frameAttached(frameId,parentFrameId,stackTrace);}
frameNavigated(frame){const url=new URL(frame.url);if(url.protocol==='chrome-error:'){return;}
this._resourceTreeModel._frameNavigated(frame);}
frameDetached(frameId){this._resourceTreeModel._frameDetached(frameId);}
frameStartedLoading(frameId){}
frameStoppedLoading(frameId){}
frameRequestedNavigation(frameId){}
frameScheduledNavigation(frameId,delay){}
frameClearedScheduledNavigation(frameId){}
navigatedWithinDocument(frameId,url){}
frameResized(){this._resourceTreeModel.dispatchEventToListeners(Events$8.FrameResized,null);}
javascriptDialogOpening(url,message,dialogType,hasBrowserHandler,prompt){if(!hasBrowserHandler){this._resourceTreeModel._agent.handleJavaScriptDialog(false);}}
javascriptDialogClosed(result,userInput){}
screencastFrame(data,metadata,sessionId){}
screencastVisibilityChanged(visible){}
interstitialShown(){this._resourceTreeModel._isInterstitialShowing=true;this._resourceTreeModel.dispatchEventToListeners(Events$8.InterstitialShown);}
interstitialHidden(){this._resourceTreeModel._isInterstitialShowing=false;this._resourceTreeModel.dispatchEventToListeners(Events$8.InterstitialHidden);}
windowOpen(url,windowName,windowFeatures,userGesture){}
compilationCacheProduced(url,data){}
fileChooserOpened(mode){}
downloadWillBegin(frameId,url){}}
SDKModel.register(ResourceTreeModel,Capability.DOM,true);let SecurityOriginData;var ResourceTreeModel$1=Object.freeze({__proto__:null,ResourceTreeModel:ResourceTreeModel,Events:Events$8,ResourceTreeFrame:ResourceTreeFrame,PageDispatcher:PageDispatcher,SecurityOriginData:SecurityOriginData});class Script{constructor(debuggerModel,scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,isContentScript,isLiveEdit,sourceMapURL,hasSourceURL,length,originStackTrace,codeOffset,scriptLanguage){this.debuggerModel=debuggerModel;this.scriptId=scriptId;this.sourceURL=sourceURL;this.lineOffset=startLine;this.columnOffset=startColumn;this.endLine=endLine;this.endColumn=endColumn;this.executionContextId=executionContextId;this.hash=hash;this._isContentScript=isContentScript;this._isLiveEdit=isLiveEdit;this.sourceMapURL=sourceMapURL;this.hasSourceURL=hasSourceURL;this.contentLength=length;this._originalContentProvider=null;this._originalSource=null;this.originStackTrace=originStackTrace;this._codeOffset=codeOffset;this._language=scriptLanguage;this._lineMap=null;}
static _trimSourceURLComment(source){let sourceURLIndex=source.lastIndexOf('//# sourceURL=');if(sourceURLIndex===-1){sourceURLIndex=source.lastIndexOf('//@ sourceURL=');if(sourceURLIndex===-1){return source;}}
const sourceURLLineIndex=source.lastIndexOf('\n',sourceURLIndex);if(sourceURLLineIndex===-1){return source;}
const sourceURLLine=source.substr(sourceURLLineIndex+1);if(!sourceURLLine.match(sourceURLRegex)){return source;}
return source.substr(0,sourceURLLineIndex);}
isContentScript(){return this._isContentScript;}
codeOffset(){return this._codeOffset;}
isWasm(){return this._language===Protocol.Debugger.ScriptLanguage.WebAssembly;}
hasWasmDisassembly(){return!!this._lineMap&&!this.sourceMapURL;}
executionContext(){return this.debuggerModel.runtimeModel().executionContext(this.executionContextId);}
isLiveEdit(){return this._isLiveEdit;}
contentURL(){return this.sourceURL;}
contentType(){return ResourceType.resourceTypes.Script;}
contentEncoded(){return Promise.resolve(false);}
async requestContent(){if(this._source){return{content:this._source,isEncoded:false};}
if(!this.scriptId){return{error:ls`Script removed or deleted.`,isEncoded:false};}
try{const sourceOrBytecode=await this.debuggerModel.target().debuggerAgent().invoke_getScriptSource({scriptId:this.scriptId});const source=sourceOrBytecode.scriptSource;if(source){if(this.hasSourceURL){this._source=Script._trimSourceURLComment(source);}else{this._source=source;}}else{this._source='';if(sourceOrBytecode.bytecode){const worker=new Worker.WorkerWrapper('wasmparser_worker_entrypoint');const promise=new Promise(function(resolve,reject){worker.onmessage=resolve;worker.onerror=reject;});worker.postMessage({method:'disassemble',params:{content:sourceOrBytecode.bytecode}});const result=await promise;this._source=result.data.source;this._lineMap=result.data.offsets;this.endLine=this._lineMap.length;}}
if(this._originalSource===null){this._originalSource=this._source;}
return{content:this._source,isEncoded:false};}catch(err){return{error:ls`Unable to fetch script source.`,isEncoded:false};}}
async getWasmBytecode(){const base64=await this.debuggerModel.target().debuggerAgent().getWasmBytecode(this.scriptId);const response=await fetch(`data:application/wasm;base64,${base64}`);return response.arrayBuffer();}
originalContentProvider(){if(!this._originalContentProvider){const lazyContent=()=>this.requestContent().then(()=>{return{content:this._originalSource,isEncoded:false,};});this._originalContentProvider=new StaticContentProvider.StaticContentProvider(this.contentURL(),this.contentType(),lazyContent);}
return this._originalContentProvider;}
async searchInContent(query,caseSensitive,isRegex){if(!this.scriptId){return[];}
const matches=await this.debuggerModel.target().debuggerAgent().searchInContent(this.scriptId,query,caseSensitive,isRegex);return(matches||[]).map(match=>new ContentProvider.SearchMatch(match.lineNumber,match.lineContent));}
_appendSourceURLCommentIfNeeded(source){if(!this.hasSourceURL){return source;}
return source+'\n //# sourceURL='+this.sourceURL;}
async editSource(newSource,callback){newSource=Script._trimSourceURLComment(newSource);newSource=this._appendSourceURLCommentIfNeeded(newSource);if(!this.scriptId){callback('Script failed to parse');return;}
await this.requestContent();if(this._source===newSource){callback(null);return;}
const response=await this.debuggerModel.target().debuggerAgent().invoke_setScriptSource({scriptId:this.scriptId,scriptSource:newSource});if(!response[InspectorBackend.ProtocolError]&&!response.exceptionDetails){this._source=newSource;}
const needsStepIn=!!response.stackChanged;callback(response[InspectorBackend.ProtocolError],response.exceptionDetails,response.callFrames,response.asyncStackTrace,response.asyncStackTraceId,needsStepIn);}
rawLocation(lineNumber,columnNumber){if(this.containsLocation(lineNumber,columnNumber)){return new Location(this.debuggerModel,this.scriptId,lineNumber,columnNumber);}
return null;}
wasmByteLocation(lineNumber){if(lineNumber<this._lineMap.length){return new Location(this.debuggerModel,this.scriptId,0,this._lineMap[lineNumber]);}
return null;}
wasmDisassemblyLine(byteOffset){let line=0;while(line<this._lineMap.length&&byteOffset>this._lineMap[line]){line++;}
return line;}
toRelativeLocation(location){console.assert(location.scriptId===this.scriptId,'`toRelativeLocation` must be used with location of the same script');const relativeLineNumber=location.lineNumber-this.lineOffset;const relativeColumnNumber=(location.columnNumber||0)-(relativeLineNumber===0?this.columnOffset:0);return[relativeLineNumber,relativeColumnNumber];}
isInlineScript(){const startsAtZero=!this.lineOffset&&!this.columnOffset;return!this.isWasm()&&!!this.sourceURL&&!startsAtZero;}
isAnonymousScript(){return!this.sourceURL;}
isInlineScriptWithSourceURL(){return!!this.hasSourceURL&&this.isInlineScript();}
async setBlackboxedRanges(positions){const response=await this.debuggerModel.target().debuggerAgent().invoke_setBlackboxedRanges({scriptId:this.scriptId,positions});return!response[InspectorBackend.ProtocolError];}
containsLocation(lineNumber,columnNumber){const afterStart=(lineNumber===this.lineOffset&&columnNumber>=this.columnOffset)||lineNumber>this.lineOffset;const beforeEnd=lineNumber<this.endLine||(lineNumber===this.endLine&&columnNumber<=this.endColumn);return afterStart&&beforeEnd;}
get frameId(){if(typeof this[frameIdSymbol]!=='string'){this[frameIdSymbol]=frameIdForScript(this);}
return this[frameIdSymbol];}}
const frameIdSymbol=Symbol('frameid');function frameIdForScript(script){const executionContext=script.executionContext();if(executionContext){return executionContext.frameId||'';}
const resourceTreeModel=script.debuggerModel.target().model(ResourceTreeModel);if(!resourceTreeModel||!resourceTreeModel.mainFrame){return'';}
return resourceTreeModel.mainFrame.id;}
const sourceURLRegex=/^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/;var Script$1=Object.freeze({__proto__:null,Script:Script,sourceURLRegex:sourceURLRegex});class DebuggerModel extends SDKModel{constructor(target){super(target);target.registerDebuggerDispatcher(new DebuggerDispatcher(this));this._agent=target.debuggerAgent();this._runtimeModel=(target.model(RuntimeModel));this._sourceMapManager=new SourceMapManager(target);this._sourceMapIdToScript=new Map();this._debuggerPausedDetails=null;this._scripts=new Map();this._scriptsBySourceURL=new Map();this._discardableScripts=[];this._breakpointResolvedEventTarget=new ObjectWrapper.ObjectWrapper();this._autoStepOver=false;this._isPausing=false;Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').addChangeListener(this._pauseOnExceptionStateChanged,this);Settings.Settings.instance().moduleSetting('pauseOnCaughtException').addChangeListener(this._pauseOnExceptionStateChanged,this);Settings.Settings.instance().moduleSetting('disableAsyncStackTraces').addChangeListener(this._asyncStackTracesStateChanged,this);Settings.Settings.instance().moduleSetting('breakpointsActive').addChangeListener(this._breakpointsActiveChanged,this);if(!target.suspended()){this._enableDebugger();}
this._stringMap=new Map();this._sourceMapManager.setEnabled(Settings.Settings.instance().moduleSetting('jsSourceMapsEnabled').get());Settings.Settings.instance().moduleSetting('jsSourceMapsEnabled').addChangeListener(event=>this._sourceMapManager.setEnabled((event.data)));}
static _sourceMapId(executionContextId,sourceURL,sourceMapURL){if(!sourceMapURL){return null;}
return executionContextId+':'+sourceURL+':'+sourceMapURL;}
sourceMapManager(){return this._sourceMapManager;}
runtimeModel(){return this._runtimeModel;}
debuggerEnabled(){return!!this._debuggerEnabled;}
_enableDebugger(){if(this._debuggerEnabled){return Promise.resolve();}
this._debuggerEnabled=true;const isRemoteFrontend=Root.Runtime.queryParam('remoteFrontend')||Root.Runtime.queryParam('ws');const maxScriptsCacheSize=isRemoteFrontend?10e6:100e6;const enablePromise=this._agent.enable(maxScriptsCacheSize);enablePromise.then(this._registerDebugger.bind(this));this._pauseOnExceptionStateChanged();this._asyncStackTracesStateChanged();if(!Settings.Settings.instance().moduleSetting('breakpointsActive').get()){this._breakpointsActiveChanged();}
if(DebuggerModel._scheduledPauseOnAsyncCall){this._pauseOnAsyncCall(DebuggerModel._scheduledPauseOnAsyncCall);}
this.dispatchEventToListeners(Events$9.DebuggerWasEnabled,this);return enablePromise;}
_registerDebugger(debuggerId){if(!debuggerId){return;}
_debuggerIdToModel.set(debuggerId,this);this._debuggerId=debuggerId;this.dispatchEventToListeners(Events$9.DebuggerIsReadyToPause,this);}
isReadyToPause(){return!!this._debuggerId;}
static modelForDebuggerId(debuggerId){return _debuggerIdToModel.get(debuggerId)||null;}
async _disableDebugger(){if(!this._debuggerEnabled){return Promise.resolve();}
this._debuggerEnabled=false;await this._asyncStackTracesStateChanged();await this._agent.disable();this._isPausing=false;this.globalObjectCleared();this.dispatchEventToListeners(Events$9.DebuggerWasDisabled);_debuggerIdToModel.delete(this._debuggerId);}
_skipAllPauses(skip){if(this._skipAllPausesTimeout){clearTimeout(this._skipAllPausesTimeout);delete this._skipAllPausesTimeout;}
this._agent.setSkipAllPauses(skip);}
skipAllPausesUntilReloadOrTimeout(timeout){if(this._skipAllPausesTimeout){clearTimeout(this._skipAllPausesTimeout);}
this._agent.setSkipAllPauses(true);this._skipAllPausesTimeout=setTimeout(this._skipAllPauses.bind(this,false),timeout);}
_pauseOnExceptionStateChanged(){let state;if(!Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').get()){state=PauseOnExceptionsState.DontPauseOnExceptions;}else if(Settings.Settings.instance().moduleSetting('pauseOnCaughtException').get()){state=PauseOnExceptionsState.PauseOnAllExceptions;}else{state=PauseOnExceptionsState.PauseOnUncaughtExceptions;}
this._agent.setPauseOnExceptions(state);}
_asyncStackTracesStateChanged(){const maxAsyncStackChainDepth=32;const enabled=!Settings.Settings.instance().moduleSetting('disableAsyncStackTraces').get()&&this._debuggerEnabled;return this._agent.setAsyncCallStackDepth(enabled?maxAsyncStackChainDepth:0);}
_breakpointsActiveChanged(){this._agent.setBreakpointsActive(Settings.Settings.instance().moduleSetting('breakpointsActive').get());}
stepInto(){this._agent.stepInto();}
stepOver(){this._autoStepOver=true;this._agent.stepOver();}
stepOut(){this._agent.stepOut();}
scheduleStepIntoAsync(){this._agent.invoke_stepInto({breakOnAsyncCall:true});}
resume(){this._agent.resume();this._isPausing=false;}
pause(){this._isPausing=true;this._skipAllPauses(false);this._agent.pause();}
_pauseOnAsyncCall(parentStackTraceId){return this._agent.invoke_pauseOnAsyncCall({parentStackTraceId:parentStackTraceId});}
async setBreakpointByURL(url,lineNumber,columnNumber,condition){let urlRegex;if(this.target().type()===Type.Node){const platformPath=ParsedURL.ParsedURL.urlToPlatformPath(url,Platform$1.isWin());urlRegex=`${platformPath.escapeForRegExp()}|${url.escapeForRegExp()}`;}
let minColumnNumber=0;const scripts=this._scriptsBySourceURL.get(url)||[];for(let i=0,l=scripts.length;i<l;++i){const script=scripts[i];if(lineNumber===script.lineOffset){minColumnNumber=minColumnNumber?Math.min(minColumnNumber,script.columnOffset):script.columnOffset;}}
columnNumber=Math.max(columnNumber,minColumnNumber);const response=await this._agent.invoke_setBreakpointByUrl({lineNumber:lineNumber,url:urlRegex?undefined:url,urlRegex:urlRegex,columnNumber:columnNumber,condition:condition});if(response[InspectorBackend.ProtocolError]){return{locations:[],breakpointId:null};}
let locations=[];if(response.locations){locations=response.locations.map(payload=>Location.fromPayload(this,payload));}
return{locations:locations,breakpointId:response.breakpointId};}
async setBreakpointInAnonymousScript(scriptId,scriptHash,lineNumber,columnNumber,condition){const response=await this._agent.invoke_setBreakpointByUrl({lineNumber:lineNumber,scriptHash:scriptHash,columnNumber:columnNumber,condition:condition});const error=response[InspectorBackend.ProtocolError];if(error){if(error!=='Either url or urlRegex must be specified.'){return{locations:[],breakpointId:null};}
return this._setBreakpointBySourceId(scriptId,lineNumber,columnNumber,condition);}
let locations=[];if(response.locations){locations=response.locations.map(payload=>Location.fromPayload(this,payload));}
return{locations:locations,breakpointId:response.breakpointId};}
async _setBreakpointBySourceId(scriptId,lineNumber,columnNumber,condition){const response=await this._agent.invoke_setBreakpoint({location:{scriptId:scriptId,lineNumber:lineNumber,columnNumber:columnNumber},condition:condition});if(response[InspectorBackend.ProtocolError]){return{breakpointId:null,locations:[]};}
let actualLocation=[];if(response.actualLocation){actualLocation=[Location.fromPayload(this,response.actualLocation)];}
return{locations:actualLocation,breakpointId:response.breakpointId};}
async removeBreakpoint(breakpointId){const response=await this._agent.invoke_removeBreakpoint({breakpointId});if(response[InspectorBackend.ProtocolError]){console.error('Failed to remove breakpoint: '+response[InspectorBackend.ProtocolError]);}}
async getPossibleBreakpoints(startLocation,endLocation,restrictToFunction){const response=await this._agent.invoke_getPossibleBreakpoints({start:startLocation.payload(),end:endLocation?endLocation.payload():undefined,restrictToFunction:restrictToFunction});if(response[InspectorBackend.ProtocolError]||!response.locations){return[];}
return response.locations.map(location=>BreakLocation.fromPayload(this,location));}
async fetchAsyncStackTrace(stackId){const response=await this._agent.invoke_getStackTrace({stackTraceId:stackId});return response[InspectorBackend.ProtocolError]?null:response.stackTrace;}
_breakpointResolved(breakpointId,location){this._breakpointResolvedEventTarget.dispatchEventToListeners(breakpointId,Location.fromPayload(this,location));}
globalObjectCleared(){this._setDebuggerPausedDetails(null);this._reset();this.dispatchEventToListeners(Events$9.GlobalObjectCleared,this);}
_reset(){for(const scriptWithSourceMap of this._sourceMapIdToScript.values()){this._sourceMapManager.detachSourceMap(scriptWithSourceMap);}
this._sourceMapIdToScript.clear();this._scripts.clear();this._scriptsBySourceURL.clear();this._stringMap.clear();this._discardableScripts=[];this._autoStepOver=false;}
scripts(){return Array.from(this._scripts.values());}
scriptForId(scriptId){return this._scripts.get(scriptId)||null;}
scriptsForSourceURL(sourceURL){if(!sourceURL){return[];}
return this._scriptsBySourceURL.get(sourceURL)||[];}
scriptsForExecutionContext(executionContext){const result=[];for(const script of this._scripts.values()){if(script.executionContextId===executionContext.id){result.push(script);}}
return result;}
setScriptSource(scriptId,newSource,callback){this._scripts.get(scriptId).editSource(newSource,this._didEditScriptSource.bind(this,scriptId,newSource,callback));}
_didEditScriptSource(scriptId,newSource,callback,error,exceptionDetails,callFrames,asyncStackTrace,asyncStackTraceId,needsStepIn){callback(error,exceptionDetails);if(needsStepIn){this.stepInto();return;}
if(!error&&callFrames&&callFrames.length){this._pausedScript(callFrames,this._debuggerPausedDetails.reason,this._debuggerPausedDetails.auxData,this._debuggerPausedDetails.breakpointIds,asyncStackTrace,asyncStackTraceId);}}
get callFrames(){return this._debuggerPausedDetails?this._debuggerPausedDetails.callFrames:null;}
debuggerPausedDetails(){return this._debuggerPausedDetails;}
_setDebuggerPausedDetails(debuggerPausedDetails){this._isPausing=false;this._debuggerPausedDetails=debuggerPausedDetails;if(this._debuggerPausedDetails){if(this._beforePausedCallback){if(!this._beforePausedCallback.call(null,this._debuggerPausedDetails)){return false;}}
this._autoStepOver=false;this.dispatchEventToListeners(Events$9.DebuggerPaused,this);}
if(debuggerPausedDetails){this.setSelectedCallFrame(debuggerPausedDetails.callFrames[0]);}else{this.setSelectedCallFrame(null);}
return true;}
setBeforePausedCallback(callback){this._beforePausedCallback=callback;}
async _pausedScript(callFrames,reason,auxData,breakpointIds,asyncStackTrace,asyncStackTraceId,asyncCallStackTraceId){if(asyncCallStackTraceId){DebuggerModel._scheduledPauseOnAsyncCall=asyncCallStackTraceId;const promises=[];for(const model of _debuggerIdToModel.values()){promises.push(model._pauseOnAsyncCall(asyncCallStackTraceId));}
await Promise.all(promises);this.resume();return;}
const pausedDetails=new DebuggerPausedDetails(this,callFrames,reason,auxData,breakpointIds,asyncStackTrace,asyncStackTraceId);const pluginManager=Bindings.debuggerWorkspaceBinding.getLanguagePluginManager(this);if(pluginManager){for(const callFrame of pausedDetails.callFrames){callFrame.sourceScopeChain=await pluginManager.resolveScopeChain(callFrame);}}
if(pausedDetails&&this._continueToLocationCallback){const callback=this._continueToLocationCallback;delete this._continueToLocationCallback;if(callback(pausedDetails)){return;}}
if(!this._setDebuggerPausedDetails(pausedDetails)){if(this._autoStepOver){this._agent.stepOver();}else{this._agent.stepInto();}}
DebuggerModel._scheduledPauseOnAsyncCall=null;}
_resumedScript(){this._setDebuggerPausedDetails(null);this.dispatchEventToListeners(Events$9.DebuggerResumed,this);}
_parsedScriptSource(scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,executionContextAuxData,isLiveEdit,sourceMapURL,hasSourceURLComment,hasSyntaxError,length,originStackTrace,codeOffset,scriptLanguage){if(this._scripts.has(scriptId)){return this._scripts.get(scriptId);}
let isContentScript=false;if(executionContextAuxData&&('isDefault'in executionContextAuxData)){isContentScript=!executionContextAuxData['isDefault'];}
sourceURL=this._internString(sourceURL);const script=new Script(this,scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,this._internString(hash),isContentScript,isLiveEdit,sourceMapURL,hasSourceURLComment,length,originStackTrace,codeOffset,scriptLanguage);this._registerScript(script);this.dispatchEventToListeners(Events$9.ParsedScriptSource,script);const pluginManager=Bindings.debuggerWorkspaceBinding.getLanguagePluginManager(this);if(!Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')||!pluginManager||!pluginManager.hasPluginForScript(script)){const sourceMapId=DebuggerModel._sourceMapId(script.executionContextId,script.sourceURL,script.sourceMapURL);if(sourceMapId&&!hasSyntaxError){const previousScript=this._sourceMapIdToScript.get(sourceMapId);if(previousScript){this._sourceMapManager.detachSourceMap(previousScript);}
this._sourceMapIdToScript.set(sourceMapId,script);this._sourceMapManager.attachSourceMap(script,script.sourceURL,script.sourceMapURL);}}
const isDiscardable=hasSyntaxError&&script.isAnonymousScript();if(isDiscardable){this._discardableScripts.push(script);this._collectDiscardedScripts();}
return script;}
setSourceMapURL(script,newSourceMapURL){let sourceMapId=DebuggerModel._sourceMapId(script.executionContextId,script.sourceURL,script.sourceMapURL);if(sourceMapId&&this._sourceMapIdToScript.get(sourceMapId)===script){this._sourceMapIdToScript.delete(sourceMapId);}
this._sourceMapManager.detachSourceMap(script);script.sourceMapURL=newSourceMapURL;sourceMapId=DebuggerModel._sourceMapId(script.executionContextId,script.sourceURL,script.sourceMapURL);if(!sourceMapId){return;}
this._sourceMapIdToScript.set(sourceMapId,script);this._sourceMapManager.attachSourceMap(script,script.sourceURL,script.sourceMapURL);}
executionContextDestroyed(executionContext){const sourceMapIds=Array.from(this._sourceMapIdToScript.keys());for(const sourceMapId of sourceMapIds){const script=this._sourceMapIdToScript.get(sourceMapId);if(script.executionContextId===executionContext.id){this._sourceMapIdToScript.delete(sourceMapId);this._sourceMapManager.detachSourceMap(script);}}}
_registerScript(script){this._scripts.set(script.scriptId,script);if(script.isAnonymousScript()){return;}
let scripts=this._scriptsBySourceURL.get(script.sourceURL);if(!scripts){scripts=[];this._scriptsBySourceURL.set(script.sourceURL,scripts);}
scripts.push(script);}
_unregisterScript(script){console.assert(script.isAnonymousScript());this._scripts.delete(script.scriptId);}
_collectDiscardedScripts(){if(this._discardableScripts.length<1000){return;}
const scriptsToDiscard=this._discardableScripts.splice(0,100);for(const script of scriptsToDiscard){this._unregisterScript(script);this.dispatchEventToListeners(Events$9.DiscardedAnonymousScriptSource,script);}}
createRawLocation(script,lineNumber,columnNumber){return new Location(this,script.scriptId,lineNumber,columnNumber);}
createRawLocationByURL(sourceURL,lineNumber,columnNumber){let closestScript=null;const scripts=this._scriptsBySourceURL.get(sourceURL)||[];for(let i=0,l=scripts.length;i<l;++i){const script=scripts[i];if(!closestScript){closestScript=script;}
if(script.lineOffset>lineNumber||(script.lineOffset===lineNumber&&script.columnOffset>columnNumber)){continue;}
if(script.endLine<lineNumber||(script.endLine===lineNumber&&script.endColumn<=columnNumber)){continue;}
closestScript=script;break;}
return closestScript?new Location(this,closestScript.scriptId,lineNumber,columnNumber):null;}
createRawLocationByScriptId(scriptId,lineNumber,columnNumber){const script=this.scriptForId(scriptId);return script?this.createRawLocation(script,lineNumber,columnNumber):null;}
createRawLocationsByStackTrace(stackTrace){const frames=[];while(stackTrace){for(const frame of stackTrace.callFrames){frames.push(frame);}
stackTrace=stackTrace.parent;}
const rawLocations=[];for(const frame of frames){const rawLocation=this.createRawLocationByScriptId(frame.scriptId,frame.lineNumber,frame.columnNumber);if(rawLocation){rawLocations.push(rawLocation);}}
return rawLocations;}
isPaused(){return!!this.debuggerPausedDetails();}
isPausing(){return this._isPausing;}
setSelectedCallFrame(callFrame){if(this._selectedCallFrame===callFrame){return;}
this._selectedCallFrame=callFrame;this.dispatchEventToListeners(Events$9.CallFrameSelected,this);}
selectedCallFrame(){return this._selectedCallFrame;}
evaluateOnSelectedCallFrame(options){return this.selectedCallFrame().evaluate(options);}
functionDetailsPromise(remoteObject){return remoteObject.getAllProperties(false,false).then(buildDetails.bind(this));function buildDetails(response){if(!response){return null;}
let location=null;if(response.internalProperties){for(const prop of response.internalProperties){if(prop.name==='[[FunctionLocation]]'){location=prop.value;}}}
let functionName=null;if(response.properties){for(const prop of response.properties){if(prop.name==='name'&&prop.value&&prop.value.type==='string'){functionName=prop.value;}
if(prop.name==='displayName'&&prop.value&&prop.value.type==='string'){functionName=prop.value;break;}}}
let debuggerLocation=null;if(location){debuggerLocation=this.createRawLocationByScriptId(location.value.scriptId,location.value.lineNumber,location.value.columnNumber);}
return{location:debuggerLocation,functionName:functionName?(functionName.value):''};}}
async setVariableValue(scopeNumber,variableName,newValue,callFrameId){const response=await this._agent.invoke_setVariableValue({scopeNumber,variableName,newValue,callFrameId});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);}
return error;}
addBreakpointListener(breakpointId,listener,thisObject){this._breakpointResolvedEventTarget.addEventListener(breakpointId,listener,thisObject);}
removeBreakpointListener(breakpointId,listener,thisObject){this._breakpointResolvedEventTarget.removeEventListener(breakpointId,listener,thisObject);}
async setBlackboxPatterns(patterns){const response=await this._agent.invoke_setBlackboxPatterns({patterns});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);}
return!error;}
dispose(){this._sourceMapManager.dispose();_debuggerIdToModel.delete(this._debuggerId);Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').removeChangeListener(this._pauseOnExceptionStateChanged,this);Settings.Settings.instance().moduleSetting('pauseOnCaughtException').removeChangeListener(this._pauseOnExceptionStateChanged,this);Settings.Settings.instance().moduleSetting('disableAsyncStackTraces').removeChangeListener(this._asyncStackTracesStateChanged,this);}
async suspendModel(){await this._disableDebugger();}
async resumeModel(){await this._enableDebugger();}
_internString(string){if(!this._stringMap.has(string)){this._stringMap.set(string,string);}
return this._stringMap.get(string);}}
const _debuggerIdToModel=new Map();const _scheduledPauseOnAsyncCall=null;const PauseOnExceptionsState={DontPauseOnExceptions:'none',PauseOnAllExceptions:'all',PauseOnUncaughtExceptions:'uncaught'};const Events$9={DebuggerWasEnabled:Symbol('DebuggerWasEnabled'),DebuggerWasDisabled:Symbol('DebuggerWasDisabled'),DebuggerPaused:Symbol('DebuggerPaused'),DebuggerResumed:Symbol('DebuggerResumed'),ParsedScriptSource:Symbol('ParsedScriptSource'),FailedToParseScriptSource:Symbol('FailedToParseScriptSource'),DiscardedAnonymousScriptSource:Symbol('DiscardedAnonymousScriptSource'),GlobalObjectCleared:Symbol('GlobalObjectCleared'),CallFrameSelected:Symbol('CallFrameSelected'),ConsoleCommandEvaluatedInSelectedCallFrame:Symbol('ConsoleCommandEvaluatedInSelectedCallFrame'),DebuggerIsReadyToPause:Symbol('DebuggerIsReadyToPause'),};const BreakReason={DOM:'DOM',EventListener:'EventListener',XHR:'XHR',Exception:'exception',PromiseRejection:'promiseRejection',Assert:'assert',DebugCommand:'debugCommand',OOM:'OOM',Other:'other'};const ContinueToLocationTargetCallFrames={Any:'any',Current:'current'};class DebuggerDispatcher{constructor(debuggerModel){this._debuggerModel=debuggerModel;}
paused(callFrames,reason,auxData,breakpointIds,asyncStackTrace,asyncStackTraceId,asyncCallStackTraceId){this._debuggerModel._pausedScript(callFrames,reason,auxData,breakpointIds||[],asyncStackTrace,asyncStackTraceId,asyncCallStackTraceId);}
resumed(){this._debuggerModel._resumedScript();}
scriptParsed(scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,executionContextAuxData,isLiveEdit,sourceMapURL,hasSourceURL,isModule,length,stackTrace,codeOffset,scriptLanguage){this._debuggerModel._parsedScriptSource(scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,executionContextAuxData,!!isLiveEdit,sourceMapURL,!!hasSourceURL,false,length||0,stackTrace||null,codeOffset||null,scriptLanguage||null);}
scriptFailedToParse(scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,executionContextAuxData,sourceMapURL,hasSourceURL,isModule,length,stackTrace,codeOffset,scriptLanguage){this._debuggerModel._parsedScriptSource(scriptId,sourceURL,startLine,startColumn,endLine,endColumn,executionContextId,hash,executionContextAuxData,false,sourceMapURL,!!hasSourceURL,true,length||0,stackTrace||null,codeOffset||null,scriptLanguage||null);}
breakpointResolved(breakpointId,location){this._debuggerModel._breakpointResolved(breakpointId,location);}}
class Location{constructor(debuggerModel,scriptId,lineNumber,columnNumber){this.debuggerModel=debuggerModel;this.scriptId=scriptId;this.lineNumber=lineNumber;this.columnNumber=columnNumber||0;}
static fromPayload(debuggerModel,payload){return new Location(debuggerModel,payload.scriptId,payload.lineNumber,payload.columnNumber);}
payload(){return{scriptId:this.scriptId,lineNumber:this.lineNumber,columnNumber:this.columnNumber};}
script(){return this.debuggerModel.scriptForId(this.scriptId);}
continueToLocation(pausedCallback){if(pausedCallback){this.debuggerModel._continueToLocationCallback=this._paused.bind(this,pausedCallback);}
this.debuggerModel._agent.continueToLocation(this.payload(),ContinueToLocationTargetCallFrames.Current);}
_paused(pausedCallback,debuggerPausedDetails){const location=debuggerPausedDetails.callFrames[0].location();if(location.scriptId===this.scriptId&&location.lineNumber===this.lineNumber&&location.columnNumber===this.columnNumber){pausedCallback();return true;}
return false;}
id(){return this.debuggerModel.target().id()+':'+this.scriptId+':'+this.lineNumber+':'+this.columnNumber;}}
class BreakLocation extends Location{constructor(debuggerModel,scriptId,lineNumber,columnNumber,type){super(debuggerModel,scriptId,lineNumber,columnNumber);if(type){this.type=type;}}
static fromPayload(debuggerModel,payload){return new BreakLocation(debuggerModel,payload.scriptId,payload.lineNumber,payload.columnNumber,payload.type);}}
class CallFrame{constructor(debuggerModel,script,payload){this.debuggerModel=debuggerModel;this.sourceScopeChain=null;this._script=script;this._payload=payload;this._location=Location.fromPayload(debuggerModel,payload.location);this._scopeChain=[];this._localScope=null;for(let i=0;i<payload.scopeChain.length;++i){const scope=new Scope(this,i);this._scopeChain.push(scope);if(scope.type()===Protocol.Debugger.ScopeType.Local){this._localScope=scope;}}
if(payload.functionLocation){this._functionLocation=Location.fromPayload(debuggerModel,payload.functionLocation);}
this._returnValue=payload.returnValue?this.debuggerModel._runtimeModel.createRemoteObject(payload.returnValue):null;}
static fromPayloadArray(debuggerModel,callFrames){const result=[];for(let i=0;i<callFrames.length;++i){const callFrame=callFrames[i];const script=debuggerModel.scriptForId(callFrame.location.scriptId);if(script){result.push(new CallFrame(debuggerModel,script,callFrame));}}
return result;}
get script(){return this._script;}
get id(){return this._payload.callFrameId;}
scopeChain(){return this._scopeChain;}
localScope(){return this._localScope;}
thisObject(){return this._payload.this?this.debuggerModel._runtimeModel.createRemoteObject(this._payload.this):null;}
returnValue(){return this._returnValue;}
async setReturnValue(expression){if(!this._returnValue){return null;}
const evaluateResponse=await this.debuggerModel._agent.invoke_evaluateOnCallFrame({callFrameId:this.id,expression:expression,silent:true,objectGroup:'backtrace'});if(evaluateResponse[InspectorBackend.ProtocolError]||evaluateResponse.exceptionDetails){return null;}
const response=await this.debuggerModel._agent.invoke_setReturnValue({newValue:evaluateResponse.result});if(response[InspectorBackend.ProtocolError]){return null;}
this._returnValue=this.debuggerModel._runtimeModel.createRemoteObject(evaluateResponse.result);return this._returnValue;}
get functionName(){return this._payload.functionName;}
location(){return this._location;}
functionLocation(){return this._functionLocation||null;}
async evaluate(options){const runtimeModel=this.debuggerModel.runtimeModel();const needsTerminationOptions=!!options.throwOnSideEffect||options.timeout!==undefined;if(needsTerminationOptions&&(runtimeModel.hasSideEffectSupport()===false||(runtimeModel.hasSideEffectSupport()===null&&!await runtimeModel.checkSideEffectSupport()))){return{error:'Side-effect checks not supported by backend.'};}
const response=await this.debuggerModel._agent.invoke_evaluateOnCallFrame({callFrameId:this.id,expression:options.expression,objectGroup:options.objectGroup,includeCommandLineAPI:options.includeCommandLineAPI,silent:options.silent,returnByValue:options.returnByValue,generatePreview:options.generatePreview,throwOnSideEffect:options.throwOnSideEffect,timeout:options.timeout});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);return{error:error};}
return{object:runtimeModel.createRemoteObject(response.result),exceptionDetails:response.exceptionDetails};}
async restart(){const response=await this.debuggerModel._agent.invoke_restartFrame({callFrameId:this._payload.callFrameId});if(!response[InspectorBackend.ProtocolError]){this.debuggerModel.stepInto();}}}
class Scope{constructor(callFrame,ordinal){this._callFrame=callFrame;this._payload=callFrame._payload.scopeChain[ordinal];this._type=this._payload.type;this._name=this._payload.name;this._ordinal=ordinal;this._startLocation=this._payload.startLocation?Location.fromPayload(callFrame.debuggerModel,this._payload.startLocation):null;this._endLocation=this._payload.endLocation?Location.fromPayload(callFrame.debuggerModel,this._payload.endLocation):null;}
callFrame(){return this._callFrame;}
type(){return this._type;}
typeName(){switch(this._type){case Protocol.Debugger.ScopeType.Local:return UIString.UIString('Local');case Protocol.Debugger.ScopeType.Closure:return UIString.UIString('Closure');case Protocol.Debugger.ScopeType.Catch:return UIString.UIString('Catch');case Protocol.Debugger.ScopeType.Block:return UIString.UIString('Block');case Protocol.Debugger.ScopeType.Script:return UIString.UIString('Script');case Protocol.Debugger.ScopeType.With:return UIString.UIString('With Block');case Protocol.Debugger.ScopeType.Global:return UIString.UIString('Global');case Protocol.Debugger.ScopeType.Module:return UIString.UIString('Module');case Protocol.Debugger.ScopeType.WasmExpressionStack:return UIString.UIString('Stack');}
return'';}
name(){return this._name;}
startLocation(){return this._startLocation;}
endLocation(){return this._endLocation;}
object(){if(this._object){return this._object;}
const runtimeModel=this._callFrame.debuggerModel._runtimeModel;const declarativeScope=this._type!==Protocol.Debugger.ScopeType.With&&this._type!==Protocol.Debugger.ScopeType.Global;if(declarativeScope){this._object=runtimeModel.createScopeRemoteObject(this._payload.object,new ScopeRef(this._ordinal,this._callFrame.id));}else{this._object=runtimeModel.createRemoteObject(this._payload.object);}
return this._object;}
description(){const declarativeScope=this._type!==Protocol.Debugger.ScopeType.With&&this._type!==Protocol.Debugger.ScopeType.Global;return declarativeScope?'':(this._payload.object.description||'');}}
class DebuggerPausedDetails{constructor(debuggerModel,callFrames,reason,auxData,breakpointIds,asyncStackTrace,asyncStackTraceId){this.debuggerModel=debuggerModel;this.callFrames=CallFrame.fromPayloadArray(debuggerModel,callFrames);this.reason=reason;this.auxData=auxData;this.breakpointIds=breakpointIds;if(asyncStackTrace){this.asyncStackTrace=this._cleanRedundantFrames(asyncStackTrace);}
this.asyncStackTraceId=asyncStackTraceId;}
exception(){if(this.reason!==BreakReason.Exception&&this.reason!==BreakReason.PromiseRejection){return null;}
return this.debuggerModel._runtimeModel.createRemoteObject((this.auxData));}
_cleanRedundantFrames(asyncStackTrace){let stack=asyncStackTrace;let previous=null;while(stack){if(stack.description==='async function'&&stack.callFrames.length){stack.callFrames.shift();}
if(previous&&!stack.callFrames.length){previous.parent=stack.parent;}else{previous=stack;}
stack=stack.parent;}
return asyncStackTrace;}}
SDKModel.register(DebuggerModel,Capability.JS,true);let FunctionDetails;let SetBreakpointResult;var DebuggerModel$1=Object.freeze({__proto__:null,DebuggerModel:DebuggerModel,_debuggerIdToModel:_debuggerIdToModel,_scheduledPauseOnAsyncCall:_scheduledPauseOnAsyncCall,PauseOnExceptionsState:PauseOnExceptionsState,Events:Events$9,BreakReason:BreakReason,Location:Location,BreakLocation:BreakLocation,CallFrame:CallFrame,Scope:Scope,DebuggerPausedDetails:DebuggerPausedDetails,FunctionDetails:FunctionDetails,SetBreakpointResult:SetBreakpointResult});class HeapProfilerModel extends SDKModel{constructor(target){super(target);target.registerHeapProfilerDispatcher(new HeapProfilerDispatcher(this));this._enabled=false;this._heapProfilerAgent=target.heapProfilerAgent();this._memoryAgent=target.memoryAgent();this._runtimeModel=(target.model(RuntimeModel));this._samplingProfilerDepth=0;}
debuggerModel(){return this._runtimeModel.debuggerModel();}
runtimeModel(){return this._runtimeModel;}
enable(){if(this._enabled){return;}
this._enabled=true;this._heapProfilerAgent.enable();}
startSampling(samplingRateInBytes){if(this._samplingProfilerDepth++){return;}
const defaultSamplingIntervalInBytes=16384;this._heapProfilerAgent.startSampling(samplingRateInBytes||defaultSamplingIntervalInBytes);}
stopSampling(){if(!this._samplingProfilerDepth){throw new Error('Sampling profiler is not running.');}
if(--this._samplingProfilerDepth){return this.getSamplingProfile();}
return this._heapProfilerAgent.stopSampling();}
getSamplingProfile(){return this._heapProfilerAgent.getSamplingProfile();}
startNativeSampling(){const defaultSamplingIntervalInBytes=65536;this._memoryAgent.startSampling(defaultSamplingIntervalInBytes);}
async stopNativeSampling(){const rawProfile=(await this._memoryAgent.getSamplingProfile());this._memoryAgent.stopSampling();return this._convertNativeProfile(rawProfile);}
async takeNativeSnapshot(){const rawProfile=(await this._memoryAgent.getAllTimeSamplingProfile());return this._convertNativeProfile(rawProfile);}
async takeNativeBrowserSnapshot(){const rawProfile=(await this._memoryAgent.getBrowserSamplingProfile());return this._convertNativeProfile(rawProfile);}
_convertNativeProfile(rawProfile){const head=({children:new Map(),selfSize:0,callFrame:{functionName:'(root)',url:''}});for(const sample of rawProfile.samples){const node=sample.stack.reverse().reduce((node,name)=>{let child=node.children.get(name);if(child){return child;}
const namespace=/^([^:]*)::/.exec(name);child={children:new Map(),callFrame:{functionName:name,url:namespace&&namespace[1]||''},selfSize:0};node.children.set(name,child);return child;},head);node.selfSize+=sample.total;}
function convertChildren(node){node.children=Array.from(node.children.values());node.children.forEach(convertChildren);}
convertChildren(head);return new NativeHeapProfile(head,rawProfile.modules);}
collectGarbage(){return this._heapProfilerAgent.collectGarbage();}
snapshotObjectIdForObjectId(objectId){return this._heapProfilerAgent.getHeapObjectId(objectId);}
async objectForSnapshotObjectId(snapshotObjectId,objectGroupName){const result=await this._heapProfilerAgent.getObjectByHeapObjectId(snapshotObjectId,objectGroupName);return result&&result.type&&this._runtimeModel.createRemoteObject(result)||null;}
addInspectedHeapObject(snapshotObjectId){return this._heapProfilerAgent.addInspectedHeapObject(snapshotObjectId);}
takeHeapSnapshot(reportProgress,treatGlobalObjectsAsRoots){return this._heapProfilerAgent.takeHeapSnapshot(reportProgress,treatGlobalObjectsAsRoots);}
startTrackingHeapObjects(recordAllocationStacks){return this._heapProfilerAgent.startTrackingHeapObjects(recordAllocationStacks);}
stopTrackingHeapObjects(reportProgress){return this._heapProfilerAgent.stopTrackingHeapObjects(reportProgress);}
heapStatsUpdate(samples){this.dispatchEventToListeners(Events$a.HeapStatsUpdate,samples);}
lastSeenObjectId(lastSeenObjectId,timestamp){this.dispatchEventToListeners(Events$a.LastSeenObjectId,{lastSeenObjectId:lastSeenObjectId,timestamp:timestamp});}
addHeapSnapshotChunk(chunk){this.dispatchEventToListeners(Events$a.AddHeapSnapshotChunk,chunk);}
reportHeapSnapshotProgress(done,total,finished){this.dispatchEventToListeners(Events$a.ReportHeapSnapshotProgress,{done:done,total:total,finished:finished});}
resetProfiles(){this.dispatchEventToListeners(Events$a.ResetProfiles,this);}}
const Events$a={HeapStatsUpdate:Symbol('HeapStatsUpdate'),LastSeenObjectId:Symbol('LastSeenObjectId'),AddHeapSnapshotChunk:Symbol('AddHeapSnapshotChunk'),ReportHeapSnapshotProgress:Symbol('ReportHeapSnapshotProgress'),ResetProfiles:Symbol('ResetProfiles')};class NativeHeapProfile{constructor(head,modules){this.head=head;this.modules=modules;}}
class HeapProfilerDispatcher{constructor(model){this._heapProfilerModel=model;}
heapStatsUpdate(samples){this._heapProfilerModel.heapStatsUpdate(samples);}
lastSeenObjectId(lastSeenObjectId,timestamp){this._heapProfilerModel.lastSeenObjectId(lastSeenObjectId,timestamp);}
addHeapSnapshotChunk(chunk){this._heapProfilerModel.addHeapSnapshotChunk(chunk);}
reportHeapSnapshotProgress(done,total,finished){this._heapProfilerModel.reportHeapSnapshotProgress(done,total,finished);}
resetProfiles(){this._heapProfilerModel.resetProfiles();}}
SDKModel.register(HeapProfilerModel,Capability.JS,false);var HeapProfilerModel$1=Object.freeze({__proto__:null,HeapProfilerModel:HeapProfilerModel,Events:Events$a});class RuntimeModel extends SDKModel{constructor(target){super(target);this._agent=target.runtimeAgent();this.target().registerRuntimeDispatcher(new RuntimeDispatcher(this));this._agent.enable();this._executionContextById=new Map();this._executionContextComparator=ExecutionContext.comparator;this._hasSideEffectSupport=null;if(Settings.Settings.instance().moduleSetting('customFormatters').get()){this._agent.setCustomObjectFormatterEnabled(true);}
Settings.Settings.instance().moduleSetting('customFormatters').addChangeListener(this._customFormattersStateChanged.bind(this));}
static isSideEffectFailure(response){const exceptionDetails=!response[InspectorBackend.ProtocolError]&&response.exceptionDetails;return!!(exceptionDetails&&exceptionDetails.exception&&exceptionDetails.exception.description&&exceptionDetails.exception.description.startsWith('EvalError: Possible side-effect in debug-evaluate'));}
debuggerModel(){return(this.target().model(DebuggerModel));}
heapProfilerModel(){return(this.target().model(HeapProfilerModel));}
executionContexts(){return[...this._executionContextById.values()].sort(this.executionContextComparator());}
setExecutionContextComparator(comparator){this._executionContextComparator=comparator;}
executionContextComparator(){return this._executionContextComparator;}
defaultExecutionContext(){for(const context of this.executionContexts()){if(context.isDefault){return context;}}
return null;}
executionContext(id){return this._executionContextById.get(id)||null;}
_executionContextCreated(context){const data=context.auxData||{isDefault:true};const executionContext=new ExecutionContext(this,context.id,context.name,context.origin,data['isDefault'],data['frameId']);this._executionContextById.set(executionContext.id,executionContext);this.dispatchEventToListeners(Events$b.ExecutionContextCreated,executionContext);}
_executionContextDestroyed(executionContextId){const executionContext=this._executionContextById.get(executionContextId);if(!executionContext){return;}
this.debuggerModel().executionContextDestroyed(executionContext);this._executionContextById.delete(executionContextId);this.dispatchEventToListeners(Events$b.ExecutionContextDestroyed,executionContext);}
fireExecutionContextOrderChanged(){this.dispatchEventToListeners(Events$b.ExecutionContextOrderChanged,this);}
_executionContextsCleared(){this.debuggerModel().globalObjectCleared();const contexts=this.executionContexts();this._executionContextById.clear();for(let i=0;i<contexts.length;++i){this.dispatchEventToListeners(Events$b.ExecutionContextDestroyed,contexts[i]);}}
createRemoteObject(payload){console.assert(typeof payload==='object','Remote object payload should only be an object');return new RemoteObjectImpl(this,payload.objectId,payload.type,payload.subtype,payload.value,payload.unserializableValue,payload.description,payload.preview,payload.customPreview,payload.className);}
createScopeRemoteObject(payload,scopeRef){return new ScopeRemoteObject(this,payload.objectId,scopeRef,payload.type,payload.subtype,payload.value,payload.unserializableValue,payload.description,payload.preview);}
createRemoteObjectFromPrimitiveValue(value){const type=typeof value;let unserializableValue=undefined;const unserializableDescription=RemoteObject.unserializableDescription(value);if(unserializableDescription!==null){unserializableValue=(unserializableDescription);}
if(typeof unserializableValue!=='undefined'){value=undefined;}
return new RemoteObjectImpl(this,undefined,type,undefined,value,unserializableValue);}
createRemotePropertyFromPrimitiveValue(name,value){return new RemoteObjectProperty(name,this.createRemoteObjectFromPrimitiveValue(value));}
discardConsoleEntries(){this._agent.discardConsoleEntries();}
releaseObjectGroup(objectGroupName){this._agent.releaseObjectGroup(objectGroupName);}
releaseEvaluationResult(result){if(result.object){result.object.release();}
if(result.exceptionDetails&&result.exceptionDetails.exception){const exception=result.exceptionDetails.exception;const exceptionObject=this.createRemoteObject({type:exception.type,objectId:exception.objectId});exceptionObject.release();}}
runIfWaitingForDebugger(){this._agent.runIfWaitingForDebugger();}
_customFormattersStateChanged(event){const enabled=(event.data);this._agent.setCustomObjectFormatterEnabled(enabled);}
async compileScript(expression,sourceURL,persistScript,executionContextId){const response=await this._agent.invoke_compileScript({expression:expression,sourceURL:sourceURL,persistScript:persistScript,executionContextId:executionContextId,});if(response[InspectorBackend.ProtocolError]){console.error(response[InspectorBackend.ProtocolError]);return null;}
return{scriptId:response.scriptId,exceptionDetails:response.exceptionDetails};}
async runScript(scriptId,executionContextId,objectGroup,silent,includeCommandLineAPI,returnByValue,generatePreview,awaitPromise){const response=await this._agent.invoke_runScript({scriptId,executionContextId,objectGroup,silent,includeCommandLineAPI,returnByValue,generatePreview,awaitPromise,});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);return{error:error};}
return{object:this.createRemoteObject(response.result),exceptionDetails:response.exceptionDetails};}
async queryObjects(prototype){if(!prototype.objectId){return{error:'Prototype should be an Object.'};}
const response=await this._agent.invoke_queryObjects({prototypeObjectId:(prototype.objectId),objectGroup:'console'});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);return{error:error};}
return{objects:this.createRemoteObject(response.objects)};}
async isolateId(){return(await this._agent.getIsolateId())||this.target().id();}
async heapUsage(){const result=await this._agent.invoke_getHeapUsage({});return result[InspectorBackend.ProtocolError]?null:result;}
_inspectRequested(payload,hints){const object=this.createRemoteObject(payload);if(hints.copyToClipboard){this._copyRequested(object);return;}
if(hints.queryObjects){this._queryObjectsRequested(object);return;}
if(object.isNode()){Revealer.reveal(object).then(object.release.bind(object));return;}
if(object.type==='function'){RemoteFunction.objectAsFunction(object).targetFunctionDetails().then(didGetDetails);return;}
function didGetDetails(response){object.release();if(!response||!response.location){return;}
Revealer.reveal(response.location);}
object.release();}
_copyRequested(object){if(!object.objectId){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(object.unserializableValue()||(object.value));return;}
object.callFunctionJSON(toStringForClipboard,[{value:object.subtype}]).then(InspectorFrontendHost.InspectorFrontendHostInstance.copyText.bind(InspectorFrontendHost.InspectorFrontendHostInstance));function toStringForClipboard(subtype){if(subtype==='node'){return this.outerHTML;}
if(subtype&&typeof this==='undefined'){return subtype+'';}
try{return JSON.stringify(this,null,'  ');}catch(e){return''+this;}}}
async _queryObjectsRequested(object){const result=await this.queryObjects(object);object.release();if(result.error){Console.Console.instance().error(result.error);return;}
this.dispatchEventToListeners(Events$b.QueryObjectRequested,{objects:result.objects});}
static simpleTextFromException(exceptionDetails){let text=exceptionDetails.text;if(exceptionDetails.exception&&exceptionDetails.exception.description){let description=exceptionDetails.exception.description;if(description.indexOf('\n')!==-1){description=description.substring(0,description.indexOf('\n'));}
text+=' '+description;}
return text;}
exceptionThrown(timestamp,exceptionDetails){const exceptionWithTimestamp={timestamp:timestamp,details:exceptionDetails};this.dispatchEventToListeners(Events$b.ExceptionThrown,exceptionWithTimestamp);}
_exceptionRevoked(exceptionId){this.dispatchEventToListeners(Events$b.ExceptionRevoked,exceptionId);}
_consoleAPICalled(type,args,executionContextId,timestamp,stackTrace,context){const consoleAPICall={type:type,args:args,executionContextId:executionContextId,timestamp:timestamp,stackTrace:stackTrace,context:context,};this.dispatchEventToListeners(Events$b.ConsoleAPICalled,consoleAPICall);}
executionContextIdForScriptId(scriptId){const script=this.debuggerModel().scriptForId(scriptId);return script?script.executionContextId:0;}
executionContextForStackTrace(stackTrace){while(stackTrace&&!stackTrace.callFrames.length){stackTrace=stackTrace.parent;}
if(!stackTrace||!stackTrace.callFrames.length){return 0;}
return this.executionContextIdForScriptId(stackTrace.callFrames[0].scriptId);}
hasSideEffectSupport(){return this._hasSideEffectSupport;}
async checkSideEffectSupport(){const testContext=this.executionContexts().peekLast();if(!testContext){return false;}
const response=await this._agent.invoke_evaluate({expression:_sideEffectTestExpression,contextId:testContext.id,throwOnSideEffect:true,});this._hasSideEffectSupport=RuntimeModel.isSideEffectFailure(response);return this._hasSideEffectSupport;}
terminateExecution(){return this._agent.invoke_terminateExecution({});}}
const _sideEffectTestExpression='(async function(){ await 1; })()';const Events$b={ExecutionContextCreated:Symbol('ExecutionContextCreated'),ExecutionContextDestroyed:Symbol('ExecutionContextDestroyed'),ExecutionContextChanged:Symbol('ExecutionContextChanged'),ExecutionContextOrderChanged:Symbol('ExecutionContextOrderChanged'),ExceptionThrown:Symbol('ExceptionThrown'),ExceptionRevoked:Symbol('ExceptionRevoked'),ConsoleAPICalled:Symbol('ConsoleAPICalled'),QueryObjectRequested:Symbol('QueryObjectRequested'),};class RuntimeDispatcher{constructor(runtimeModel){this._runtimeModel=runtimeModel;}
executionContextCreated(context){this._runtimeModel._executionContextCreated(context);}
executionContextDestroyed(executionContextId){this._runtimeModel._executionContextDestroyed(executionContextId);}
executionContextsCleared(){this._runtimeModel._executionContextsCleared();}
exceptionThrown(timestamp,exceptionDetails){this._runtimeModel.exceptionThrown(timestamp,exceptionDetails);}
exceptionRevoked(reason,exceptionId){this._runtimeModel._exceptionRevoked(exceptionId);}
consoleAPICalled(type,args,executionContextId,timestamp,stackTrace,context){this._runtimeModel._consoleAPICalled(type,args,executionContextId,timestamp,stackTrace,context);}
inspectRequested(payload,hints){this._runtimeModel._inspectRequested(payload,hints);}}
class ExecutionContext{constructor(runtimeModel,id,name,origin,isDefault,frameId){this.id=id;this.name=name;this.origin=origin;this.isDefault=isDefault;this.runtimeModel=runtimeModel;this.debuggerModel=runtimeModel.debuggerModel();this.frameId=frameId;this._setLabel('');}
target(){return this.runtimeModel.target();}
static comparator(a,b){function targetWeight(target){if(!target.parentTarget()){return 5;}
if(target.type()===Type.Frame){return 4;}
if(target.type()===Type.ServiceWorker){return 3;}
if(target.type()===Type.Worker){return 2;}
return 1;}
function targetPath(target){let currentTarget=target;const parents=[];while(currentTarget){parents.push(currentTarget);currentTarget=currentTarget.parentTarget();}
return parents.reverse();}
const tagetsA=targetPath(a.target());const targetsB=targetPath(b.target());let targetA;let targetB;for(let i=0;;i++){if(!tagetsA[i]||!targetsB[i]||(tagetsA[i]!==targetsB[i])){targetA=tagetsA[i];targetB=targetsB[i];break;}}
if(!targetA&&targetB){return-1;}
if(!targetB&&targetA){return 1;}
if(targetA&&targetB){const weightDiff=targetWeight(targetA)-targetWeight(targetB);if(weightDiff){return-weightDiff;}
return targetA.id().localeCompare(targetB.id());}
if(a.isDefault){return-1;}
if(b.isDefault){return+1;}
return a.name.localeCompare(b.name);}
evaluate(options,userGesture,awaitPromise){if(this.debuggerModel.selectedCallFrame()){return this.debuggerModel.evaluateOnSelectedCallFrame(options);}
const needsTerminationOptions=!!options.throwOnSideEffect||options.timeout!==undefined;if(!needsTerminationOptions||this.runtimeModel.hasSideEffectSupport()){return this._evaluateGlobal(options,userGesture,awaitPromise);}
const unsupportedError={error:'Side-effect checks not supported by backend.'};if(this.runtimeModel.hasSideEffectSupport()===false){return Promise.resolve(unsupportedError);}
return this.runtimeModel.checkSideEffectSupport().then(()=>{if(this.runtimeModel.hasSideEffectSupport()){return this._evaluateGlobal(options,userGesture,awaitPromise);}
return Promise.resolve(unsupportedError);});}
globalObject(objectGroup,generatePreview){return this._evaluateGlobal({expression:'this',objectGroup:objectGroup,includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:generatePreview,},false,false);}
async _evaluateGlobal(options,userGesture,awaitPromise){if(!options.expression){options.expression='this';}
const response=await this.runtimeModel._agent.invoke_evaluate({expression:options.expression,objectGroup:options.objectGroup,includeCommandLineAPI:options.includeCommandLineAPI,silent:options.silent,contextId:this.id,returnByValue:options.returnByValue,generatePreview:options.generatePreview,userGesture:userGesture,awaitPromise:awaitPromise,throwOnSideEffect:options.throwOnSideEffect,timeout:options.timeout,disableBreaks:options.disableBreaks,replMode:options.replMode,});const error=response[InspectorBackend.ProtocolError];if(error){console.error(error);return{error:error};}
return{object:this.runtimeModel.createRemoteObject(response.result),exceptionDetails:response.exceptionDetails};}
async globalLexicalScopeNames(){const response=await this.runtimeModel._agent.invoke_globalLexicalScopeNames({executionContextId:this.id});return response[InspectorBackend.ProtocolError]?[]:response.names;}
label(){return this._label;}
setLabel(label){this._setLabel(label);this.runtimeModel.dispatchEventToListeners(Events$b.ExecutionContextChanged,this);}
_setLabel(label){if(label){this._label=label;return;}
if(this.name){this._label=this.name;return;}
const parsedUrl=ParsedURL.ParsedURL.fromString(this.origin);this._label=parsedUrl?parsedUrl.lastPathComponentWithFragment():'';}}
SDKModel.register(RuntimeModel,Capability.JS,true);let EvaluationResult;let CompileScriptResult;let EvaluationOptions;let QueryObjectResult;var RuntimeModel$1=Object.freeze({__proto__:null,RuntimeModel:RuntimeModel,Events:Events$b,ExecutionContext:ExecutionContext,EvaluationResult:EvaluationResult,CompileScriptResult:CompileScriptResult,EvaluationOptions:EvaluationOptions,QueryObjectResult:QueryObjectResult});(function(){const __exports={};let wasm;let cachegetUint8Memory=null;function getUint8Memory(){if(cachegetUint8Memory===null||cachegetUint8Memory.buffer!==wasm.memory.buffer){cachegetUint8Memory=new Uint8Array(wasm.memory.buffer);}
return cachegetUint8Memory;}
let WASM_VECTOR_LEN=0;function passArray8ToWasm(arg){const ptr=wasm.__wbindgen_malloc(arg.length*1);getUint8Memory().set(arg,ptr/1);WASM_VECTOR_LEN=arg.length;return ptr;}
const heap=new Array(32);heap.fill(undefined);heap.push(undefined,null,true,false);function getObject(idx){return heap[idx];}
let heap_next=heap.length;function dropObject(idx){if(idx<36)return;heap[idx]=heap_next;heap_next=idx;}
function takeObject(idx){const ret=getObject(idx);dropObject(idx);return ret;}
let cachedTextEncoder=new TextEncoder('utf-8');const encodeString=(typeof cachedTextEncoder.encodeInto==='function'?function(arg,view){return cachedTextEncoder.encodeInto(arg,view);}:function(arg,view){const buf=cachedTextEncoder.encode(arg);view.set(buf);return{read:arg.length,written:buf.length};});function passStringToWasm(arg){let len=arg.length;let ptr=wasm.__wbindgen_malloc(len);const mem=getUint8Memory();let offset=0;for(;offset<len;offset++){const code=arg.charCodeAt(offset);if(code>0x7F)break;mem[ptr+offset]=code;}
if(offset!==len){if(offset!==0){arg=arg.slice(offset);}
ptr=wasm.__wbindgen_realloc(ptr,len,len=offset+arg.length*3);const view=getUint8Memory().subarray(ptr+offset,ptr+len);const ret=encodeString(arg,view);offset+=ret.written;}
WASM_VECTOR_LEN=offset;return ptr;}
function addHeapObject(obj){if(heap_next===heap.length)heap.push(heap.length+1);const idx=heap_next;heap_next=heap[idx];heap[idx]=obj;return idx;}
let cachedTextDecoder=new TextDecoder('utf-8',{ignoreBOM:true,fatal:true});function getStringFromWasm(ptr,len){return cachedTextDecoder.decode(getUint8Memory().subarray(ptr,ptr+len));}
class Resolver{static __wrap(ptr){const obj=Object.create(Resolver.prototype);obj.ptr=ptr;return obj;}
free(){const ptr=this.ptr;this.ptr=0;wasm.__wbg_resolver_free(ptr);}
constructor(src){const ret=wasm.resolver_from_slice(passArray8ToWasm(src),WASM_VECTOR_LEN);return Resolver.__wrap(ret);}
listFiles(){const ret=wasm.resolver_listFiles(this.ptr);return takeObject(ret);}
listMappings(){const ret=wasm.resolver_listMappings(this.ptr);return takeObject(ret);}
resolve(addr){const ret=wasm.resolver_resolve(this.ptr,addr);return takeObject(ret);}
resolveReverse(file,line,column){const ret=wasm.resolver_resolveReverse(this.ptr,passStringToWasm(file),WASM_VECTOR_LEN,line,column);return takeObject(ret);}}
__exports.Resolver=Resolver;function init(module){let result;const imports={};imports.wbg={};imports.wbg.__wbindgen_object_drop_ref=function(arg0){takeObject(arg0);};imports.wbg.__wbg_new_8e4c496df8c98a76=function(arg0,arg1,arg2,arg3,arg4){const ret=new SDK.SourceMapEntry(arg0>>>0,arg1>>>0,getObject(arg2),arg3>>>0,arg4>>>0);return addHeapObject(ret);};imports.wbg.__wbindgen_object_clone_ref=function(arg0){const ret=getObject(arg0);return addHeapObject(ret);};imports.wbg.__wbindgen_string_new=function(arg0,arg1){const ret=getStringFromWasm(arg0,arg1);return addHeapObject(ret);};imports.wbg.__wbg_new_951e889c56bc7e3c=function(){const ret=new Array();return addHeapObject(ret);};imports.wbg.__wbg_push_36cde80dfc256d1d=function(arg0,arg1){const ret=getObject(arg0).push(getObject(arg1));return ret;};imports.wbg.__wbg_new_4d5ae649984849e5=function(arg0,arg1){const ret=new Error(getStringFromWasm(arg0,arg1));return addHeapObject(ret);};imports.wbg.__wbindgen_throw=function(arg0,arg1){throw new Error(getStringFromWasm(arg0,arg1));};imports.wbg.__wbindgen_rethrow=function(arg0){throw takeObject(arg0);};if((typeof URL==='function'&&module instanceof URL)||typeof module==='string'||(typeof Request==='function'&&module instanceof Request)){const response=fetch(module);if(typeof WebAssembly.instantiateStreaming==='function'){result=WebAssembly.instantiateStreaming(response,imports).catch(e=>{return response.then(r=>{if(r.headers.get('Content-Type')!='application/wasm'){console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",e);return r.arrayBuffer();}else{throw e;}}).then(bytes=>WebAssembly.instantiate(bytes,imports));});}else{result=response.then(r=>r.arrayBuffer()).then(bytes=>WebAssembly.instantiate(bytes,imports));}}else{result=WebAssembly.instantiate(module,imports).then(result=>{if(result instanceof WebAssembly.Instance){return{instance:result,module};}else{return result;}});}
return result.then(({instance,module})=>{wasm=instance.exports;init.__wbindgen_wasm_module=module;return wasm;});}
self.wasm_bindgen=Object.assign(init,__exports);})();class MainConnection{constructor(){this._onMessage=null;this._onDisconnect=null;this._messageBuffer='';this._messageSize=0;this._eventListeners=[InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.DispatchMessage,this._dispatchMessage,this),InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.DispatchMessageChunk,this._dispatchMessageChunk,this),];}
setOnMessage(onMessage){this._onMessage=onMessage;}
setOnDisconnect(onDisconnect){this._onDisconnect=onDisconnect;}
sendRawMessage(message){if(this._onMessage){InspectorFrontendHost.InspectorFrontendHostInstance.sendMessageToBackend(message);}}
_dispatchMessage(event){if(this._onMessage){this._onMessage.call(null,(event.data));}}
_dispatchMessageChunk(event){const messageChunk=(event.data['messageChunk']);const messageSize=(event.data['messageSize']);if(messageSize){this._messageBuffer='';this._messageSize=messageSize;}
this._messageBuffer+=messageChunk;if(this._messageBuffer.length===this._messageSize){this._onMessage.call(null,this._messageBuffer);this._messageBuffer='';this._messageSize=0;}}
disconnect(){const onDisconnect=this._onDisconnect;EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._onDisconnect=null;this._onMessage=null;if(onDisconnect){onDisconnect.call(null,'force disconnect');}
return Promise.resolve();}}
class WebSocketConnection{constructor(url,onWebSocketDisconnect){this._socket=new WebSocket(url);this._socket.onerror=this._onError.bind(this);this._socket.onopen=this._onOpen.bind(this);this._socket.onmessage=messageEvent=>{if(this._onMessage){this._onMessage.call(null,(messageEvent.data));}};this._socket.onclose=this._onClose.bind(this);this._onMessage=null;this._onDisconnect=null;this._onWebSocketDisconnect=onWebSocketDisconnect;this._connected=false;this._messages=[];}
setOnMessage(onMessage){this._onMessage=onMessage;}
setOnDisconnect(onDisconnect){this._onDisconnect=onDisconnect;}
_onError(){this._onWebSocketDisconnect.call(null);this._onDisconnect.call(null,'connection failed');this._close();}
_onOpen(){this._socket.onerror=console.error;this._connected=true;for(const message of this._messages){this._socket.send(message);}
this._messages=[];}
_onClose(){this._onWebSocketDisconnect.call(null);this._onDisconnect.call(null,'websocket closed');this._close();}
_close(callback){this._socket.onerror=null;this._socket.onopen=null;this._socket.onclose=callback||null;this._socket.onmessage=null;this._socket.close();this._socket=null;this._onWebSocketDisconnect=null;}
sendRawMessage(message){if(this._connected){this._socket.send(message);}else{this._messages.push(message);}}
disconnect(){let fulfill;const promise=new Promise(f=>fulfill=f);this._close(()=>{if(this._onDisconnect){this._onDisconnect.call(null,'force disconnect');}
fulfill();});return promise;}}
class StubConnection{constructor(){this._onMessage=null;this._onDisconnect=null;}
setOnMessage(onMessage){this._onMessage=onMessage;}
setOnDisconnect(onDisconnect){this._onDisconnect=onDisconnect;}
sendRawMessage(message){setTimeout(this._respondWithError.bind(this,message),0);}
_respondWithError(message){const messageObject=JSON.parse(message);const error={message:'This is a stub connection, can\'t dispatch message.',code:InspectorBackend.DevToolsStubErrorCode,data:messageObject};if(this._onMessage){this._onMessage.call(null,{id:messageObject.id,error:error});}}
disconnect(){if(this._onDisconnect){this._onDisconnect.call(null,'force disconnect');}
this._onDisconnect=null;this._onMessage=null;return Promise.resolve();}}
class ParallelConnection{constructor(connection,sessionId){this._connection=connection;this._sessionId=sessionId;this._onMessage=null;this._onDisconnect=null;}
setOnMessage(onMessage){this._onMessage=onMessage;}
setOnDisconnect(onDisconnect){this._onDisconnect=onDisconnect;}
sendRawMessage(message){const messageObject=JSON.parse(message);if(!messageObject.sessionId){messageObject.sessionId=this._sessionId;}
this._connection.sendRawMessage(JSON.stringify(messageObject));}
disconnect(){if(this._onDisconnect){this._onDisconnect.call(null,'force disconnect');}
this._onDisconnect=null;this._onMessage=null;return Promise.resolve();}}
async function initMainConnection(createMainTarget,websocketConnectionLost){InspectorBackend.Connection.setFactory(_createMainConnection.bind(null,websocketConnectionLost));await createMainTarget();InspectorFrontendHost.InspectorFrontendHostInstance.connectionReady();InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.ReattachMainTarget,()=>{TargetManager.instance().mainTarget().router().connection().disconnect();createMainTarget();});return Promise.resolve();}
function _createMainConnection(websocketConnectionLost){const wsParam=Root.Runtime.queryParam('ws');const wssParam=Root.Runtime.queryParam('wss');if(wsParam||wssParam){const ws=wsParam?`ws://${wsParam}`:`wss://${wssParam}`;return new WebSocketConnection(ws,websocketConnectionLost);}
if(InspectorFrontendHost.InspectorFrontendHostInstance.isHostedMode()){return new StubConnection();}
return new MainConnection();}
var Connections=Object.freeze({__proto__:null,MainConnection:MainConnection,WebSocketConnection:WebSocketConnection,StubConnection:StubConnection,ParallelConnection:ParallelConnection,initMainConnection:initMainConnection,_createMainConnection:_createMainConnection});let _lastAnonymousTargetId=0;let _attachCallback;class ChildTargetManager extends SDKModel{constructor(parentTarget){super(parentTarget);this._targetManager=parentTarget.targetManager();this._parentTarget=parentTarget;this._targetAgent=parentTarget.targetAgent();this._targetInfos=new Map();this._childTargets=new Map();this._parallelConnections=new Map();this._parentTargetId=null;parentTarget.registerTargetDispatcher(this);this._targetAgent.invoke_setAutoAttach({autoAttach:true,waitForDebuggerOnStart:true,flatten:true});if(!parentTarget.parentTarget()&&!InspectorFrontendHost.isUnderTest()){this._targetAgent.setDiscoverTargets(true);this._targetAgent.setRemoteLocations([{host:'localhost',port:9229}]);}}
static install(attachCallback){_attachCallback=attachCallback;SDKModel.register(ChildTargetManager,Capability.Target,true);}
suspendModel(){return this._targetAgent.invoke_setAutoAttach({autoAttach:true,waitForDebuggerOnStart:false,flatten:true});}
resumeModel(){return this._targetAgent.invoke_setAutoAttach({autoAttach:true,waitForDebuggerOnStart:true,flatten:true});}
dispose(){for(const sessionId of this._childTargets.keys()){this.detachedFromTarget(sessionId,undefined);}}
targetCreated(targetInfo){this._targetInfos.set(targetInfo.targetId,targetInfo);this._fireAvailableTargetsChanged();}
targetInfoChanged(targetInfo){this._targetInfos.set(targetInfo.targetId,targetInfo);this._fireAvailableTargetsChanged();}
targetDestroyed(targetId){this._targetInfos.delete(targetId);this._fireAvailableTargetsChanged();}
targetCrashed(targetId,status,errorCode){}
_fireAvailableTargetsChanged(){TargetManager.instance().dispatchEventToListeners(Events.AvailableTargetsChanged,[...this._targetInfos.values()]);}
async _getParentTargetId(){if(!this._parentTargetId){this._parentTargetId=(await this._parentTarget.targetAgent().getTargetInfo()).targetId;}
return this._parentTargetId;}
attachedToTarget(sessionId,targetInfo,waitingForDebugger){if(this._parentTargetId===targetInfo.targetId){return;}
let targetName='';if(targetInfo.type==='worker'&&targetInfo.title&&targetInfo.title!==targetInfo.url){targetName=targetInfo.title;}else if(targetInfo.type!=='iframe'){const parsedURL=ParsedURL.ParsedURL.fromString(targetInfo.url);targetName=parsedURL?parsedURL.lastPathComponentWithFragment():'#'+(++_lastAnonymousTargetId);}
let type=Type.Browser;if(targetInfo.type==='iframe'){type=Type.Frame;}
else if(targetInfo.type==='page'){type=Type.Frame;}else if(targetInfo.type==='worker'){type=Type.Worker;}else if(targetInfo.type==='service_worker'){type=Type.ServiceWorker;}
const target=this._targetManager.createTarget(targetInfo.targetId,targetName,type,this._parentTarget,sessionId);this._childTargets.set(sessionId,target);if(_attachCallback){_attachCallback({target,waitingForDebugger}).then(()=>{target.runtimeAgent().runIfWaitingForDebugger();});}else{target.runtimeAgent().runIfWaitingForDebugger();}}
detachedFromTarget(sessionId,childTargetId){if(this._parallelConnections.has(sessionId)){this._parallelConnections.delete(sessionId);}else{this._childTargets.get(sessionId).dispose('target terminated');this._childTargets.delete(sessionId);}}
receivedMessageFromTarget(sessionId,message,childTargetId){}
async createParallelConnection(onMessage){const targetId=await this._getParentTargetId();const{connection,sessionId}=await this._createParallelConnectionAndSessionForTarget(this._parentTarget,targetId);connection.setOnMessage(onMessage);this._parallelConnections.set(sessionId,connection);return connection;}
async _createParallelConnectionAndSessionForTarget(target,targetId){const targetAgent=target.targetAgent();const targetRouter=target.router();const sessionId=(await targetAgent.attachToTarget(targetId,true));const connection=new ParallelConnection(targetRouter.connection(),sessionId);targetRouter.registerSession(target,sessionId,connection);connection.setOnDisconnect(()=>{targetAgent.detachFromTarget(sessionId);targetRouter.unregisterSession(sessionId);});return{connection,sessionId};}}
var ChildTargetManager$1=Object.freeze({__proto__:null,ChildTargetManager:ChildTargetManager});class CPUProfilerModel extends SDKModel{constructor(target){super(target);this._isRecording=false;this._nextAnonymousConsoleProfileNumber=1;this._anonymousConsoleProfileIdToTitle=new Map();this._profilerAgent=target.profilerAgent();this._preciseCoverageDeltaUpdateCallback=null;target.registerProfilerDispatcher(this);this._profilerAgent.enable();this._debuggerModel=(target.model(DebuggerModel));}
runtimeModel(){return this._debuggerModel.runtimeModel();}
debuggerModel(){return this._debuggerModel;}
consoleProfileStarted(id,scriptLocation,title){if(!title){title=UIString.UIString('Profile %d',this._nextAnonymousConsoleProfileNumber++);this._anonymousConsoleProfileIdToTitle.set(id,title);}
this._dispatchProfileEvent(Events$c.ConsoleProfileStarted,id,scriptLocation,title);}
consoleProfileFinished(id,scriptLocation,cpuProfile,title){if(!title){title=this._anonymousConsoleProfileIdToTitle.get(id);this._anonymousConsoleProfileIdToTitle.delete(id);}
self.runtime.loadModulePromise('profiler').then(()=>{this._dispatchProfileEvent(Events$c.ConsoleProfileFinished,id,scriptLocation,title,cpuProfile);});}
_dispatchProfileEvent(eventName,id,scriptLocation,title,cpuProfile){const debuggerLocation=Location.fromPayload(this._debuggerModel,scriptLocation);const globalId=this.target().id()+'.'+id;const data=({id:globalId,scriptLocation:debuggerLocation,cpuProfile:cpuProfile,title:title,cpuProfilerModel:this});this.dispatchEventToListeners(eventName,data);}
isRecordingProfile(){return this._isRecording;}
startRecording(){this._isRecording=true;const intervalUs=Settings.Settings.instance().moduleSetting('highResolutionCpuProfiling').get()?100:1000;this._profilerAgent.setSamplingInterval(intervalUs);return this._profilerAgent.start();}
stopRecording(){this._isRecording=false;return this._profilerAgent.stop();}
startPreciseCoverage(jsCoveragePerBlock,preciseCoverageDeltaUpdateCallback){const callCount=false;this._preciseCoverageDeltaUpdateCallback=preciseCoverageDeltaUpdateCallback;const allowUpdatesTriggeredByBackend=true;return this._profilerAgent.startPreciseCoverage(callCount,jsCoveragePerBlock,allowUpdatesTriggeredByBackend);}
async takePreciseCoverage(){const r=await this._profilerAgent.invoke_takePreciseCoverage({});const timestamp=(r&&r.timestamp)||0;const coverage=(r&&r.result)||[];return{timestamp,coverage};}
stopPreciseCoverage(){this._preciseCoverageDeltaUpdateCallback=null;return this._profilerAgent.stopPreciseCoverage();}
preciseCoverageDeltaUpdate(timestampInSeconds,occassion,coverageData){if(this._preciseCoverageDeltaUpdateCallback){this._preciseCoverageDeltaUpdateCallback(timestampInSeconds,occassion,coverageData);}}}
const Events$c={ConsoleProfileStarted:Symbol('ConsoleProfileStarted'),ConsoleProfileFinished:Symbol('ConsoleProfileFinished')};SDKModel.register(CPUProfilerModel,Capability.JS,true);let EventData;var CPUProfilerModel$1=Object.freeze({__proto__:null,CPUProfilerModel:CPUProfilerModel,Events:Events$c,EventData:EventData});class LogModel extends SDKModel{constructor(target){super(target);target.registerLogDispatcher(this);this._logAgent=target.logAgent();this._logAgent.enable();if(!InspectorFrontendHost.isUnderTest()){this._logAgent.startViolationsReport([{name:'longTask',threshold:200},{name:'longLayout',threshold:30},{name:'blockedEvent',threshold:100},{name:'blockedParser',threshold:-1},{name:'handler',threshold:150},{name:'recurringHandler',threshold:50},{name:'discouragedAPIUse',threshold:-1}]);}}
entryAdded(payload){this.dispatchEventToListeners(Events$d.EntryAdded,{logModel:this,entry:payload});}
requestClear(){this._logAgent.clear();}}
const Events$d={EntryAdded:Symbol('EntryAdded')};SDKModel.register(LogModel,Capability.Log,true);var LogModel$1=Object.freeze({__proto__:null,LogModel:LogModel,Events:Events$d});const _events=Symbol('SDK.ConsoleModel.events');let settingsInstance;class ConsoleModel extends ObjectWrapper.ObjectWrapper{constructor(){super();this._messages=[];this._messageByExceptionId=new Map();this._warnings=0;this._errors=0;this._violations=0;this._pageLoadSequenceNumber=0;TargetManager.instance().observeTargets(this);}
static instance(opts={forceNew:null}){const{forceNew}=opts;if(!settingsInstance||forceNew){settingsInstance=new ConsoleModel();}
return settingsInstance;}
targetAdded(target){const resourceTreeModel=target.model(ResourceTreeModel);if(!resourceTreeModel||resourceTreeModel.cachedResourcesLoaded()){this._initTarget(target);return;}
const eventListener=resourceTreeModel.addEventListener(Events$8.CachedResourcesLoaded,()=>{EventTarget.EventTarget.removeEventListeners([eventListener]);this._initTarget(target);});}
_initTarget(target){const eventListeners=[];const cpuProfilerModel=target.model(CPUProfilerModel);if(cpuProfilerModel){eventListeners.push(cpuProfilerModel.addEventListener(Events$c.ConsoleProfileStarted,this._consoleProfileStarted.bind(this,cpuProfilerModel)));eventListeners.push(cpuProfilerModel.addEventListener(Events$c.ConsoleProfileFinished,this._consoleProfileFinished.bind(this,cpuProfilerModel)));}
const resourceTreeModel=target.model(ResourceTreeModel);if(resourceTreeModel&&!target.parentTarget()){eventListeners.push(resourceTreeModel.addEventListener(Events$8.MainFrameNavigated,this._mainFrameNavigated,this));}
const runtimeModel=target.model(RuntimeModel);if(runtimeModel){eventListeners.push(runtimeModel.addEventListener(Events$b.ExceptionThrown,this._exceptionThrown.bind(this,runtimeModel)));eventListeners.push(runtimeModel.addEventListener(Events$b.ExceptionRevoked,this._exceptionRevoked.bind(this,runtimeModel)));eventListeners.push(runtimeModel.addEventListener(Events$b.ConsoleAPICalled,this._consoleAPICalled.bind(this,runtimeModel)));if(!target.parentTarget()){eventListeners.push(runtimeModel.debuggerModel().addEventListener(Events$9.GlobalObjectCleared,this._clearIfNecessary,this));}
eventListeners.push(runtimeModel.addEventListener(Events$b.QueryObjectRequested,this._queryObjectRequested.bind(this,runtimeModel)));}
target[_events]=eventListeners;}
targetRemoved(target){const runtimeModel=target.model(RuntimeModel);if(runtimeModel){this._messageByExceptionId.delete(runtimeModel);}
EventTarget.EventTarget.removeEventListeners(target[_events]||[]);}
async evaluateCommandInConsole(executionContext,originatingMessage,expression,useCommandLineAPI){const result=await executionContext.evaluate({expression:expression,objectGroup:'console',includeCommandLineAPI:useCommandLineAPI,silent:false,returnByValue:false,generatePreview:true,replMode:true},Settings.Settings.instance().moduleSetting('consoleUserActivationEval').get(),false);userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleEvaluated);if(result.error){return;}
await Console.Console.instance().showPromise();this.dispatchEventToListeners(Events$e.CommandEvaluated,{result:result.object,commandMessage:originatingMessage,exceptionDetails:result.exceptionDetails});}
addCommandMessage(executionContext,text){const commandMessage=new ConsoleMessage(executionContext.runtimeModel,MessageSource.JS,null,text,MessageType.Command);commandMessage.setExecutionContextId(executionContext.id);this.addMessage(commandMessage);return commandMessage;}
addMessage(msg){msg._pageLoadSequenceNumber=this._pageLoadSequenceNumber;if(msg.source===MessageSource.ConsoleAPI&&msg.type===MessageType.Clear){this._clearIfNecessary();}
this._messages.push(msg);const runtimeModel=msg.runtimeModel();if(msg._exceptionId&&runtimeModel){let modelMap=this._messageByExceptionId.get(runtimeModel);if(!modelMap){modelMap=new Map();this._messageByExceptionId.set(runtimeModel,modelMap);}
modelMap.set(msg._exceptionId,msg);}
this._incrementErrorWarningCount(msg);this.dispatchEventToListeners(Events$e.MessageAdded,msg);}
_exceptionThrown(runtimeModel,event){const exceptionWithTimestamp=(event.data);const consoleMessage=ConsoleMessage.fromException(runtimeModel,exceptionWithTimestamp.details,undefined,exceptionWithTimestamp.timestamp,undefined);consoleMessage.setExceptionId(exceptionWithTimestamp.details.exceptionId);this.addMessage(consoleMessage);}
_exceptionRevoked(runtimeModel,event){const exceptionId=(event.data);const modelMap=this._messageByExceptionId.get(runtimeModel);const exceptionMessage=modelMap?modelMap.get(exceptionId):null;if(!exceptionMessage){return;}
this._errors--;exceptionMessage.level=MessageLevel.Verbose;this.dispatchEventToListeners(Events$e.MessageUpdated,exceptionMessage);}
_consoleAPICalled(runtimeModel,event){const call=(event.data);let level=MessageLevel.Info;if(call.type===MessageType.Debug){level=MessageLevel.Verbose;}else if(call.type===MessageType.Error||call.type===MessageType.Assert){level=MessageLevel.Error;}else if(call.type===MessageType.Warning){level=MessageLevel.Warning;}else if(call.type===MessageType.Info||call.type===MessageType.Log){level=MessageLevel.Info;}
let message='';if(call.args.length&&call.args[0].unserializableValue){message=call.args[0].unserializableValue;}else if(call.args.length&&(typeof call.args[0].value!=='object'||call.args[0].value===null)){message=call.args[0].value+'';}else if(call.args.length&&call.args[0].description){message=call.args[0].description;}
const callFrame=call.stackTrace&&call.stackTrace.callFrames.length?call.stackTrace.callFrames[0]:null;const consoleMessage=new ConsoleMessage(runtimeModel,MessageSource.ConsoleAPI,level,(message),call.type,callFrame?callFrame.url:undefined,callFrame?callFrame.lineNumber:undefined,callFrame?callFrame.columnNumber:undefined,call.args,call.stackTrace,call.timestamp,call.executionContextId,undefined,undefined,call.context);this.addMessage(consoleMessage);}
_queryObjectRequested(runtimeModel,event){const consoleMessage=new ConsoleMessage(runtimeModel,MessageSource.ConsoleAPI,MessageLevel.Info,'',MessageType.QueryObjectResult,undefined,undefined,undefined,[event.data.objects]);this.addMessage(consoleMessage);}
_clearIfNecessary(){if(!Settings.Settings.instance().moduleSetting('preserveConsoleLog').get()){this._clear();}
++this._pageLoadSequenceNumber;}
_mainFrameNavigated(event){if(Settings.Settings.instance().moduleSetting('preserveConsoleLog').get()){Console.Console.instance().log(UIString.UIString('Navigated to %s',event.data.url));}}
_consoleProfileStarted(cpuProfilerModel,event){const data=(event.data);this._addConsoleProfileMessage(cpuProfilerModel,MessageType.Profile,data.scriptLocation,UIString.UIString('Profile \'%s\' started.',data.title));}
_consoleProfileFinished(cpuProfilerModel,event){const data=(event.data);this._addConsoleProfileMessage(cpuProfilerModel,MessageType.ProfileEnd,data.scriptLocation,UIString.UIString('Profile \'%s\' finished.',data.title));}
_addConsoleProfileMessage(cpuProfilerModel,type,scriptLocation,messageText){const stackTrace=[{functionName:'',scriptId:scriptLocation.scriptId,url:scriptLocation.script()?scriptLocation.script().contentURL():'',lineNumber:scriptLocation.lineNumber,columnNumber:scriptLocation.columnNumber||0}];this.addMessage(new ConsoleMessage(cpuProfilerModel.runtimeModel(),MessageSource.ConsoleAPI,MessageLevel.Info,messageText,type,undefined,undefined,undefined,stackTrace));}
_incrementErrorWarningCount(msg){if(msg.source===MessageSource.Violation){this._violations++;return;}
switch(msg.level){case MessageLevel.Warning:this._warnings++;break;case MessageLevel.Error:this._errors++;break;}}
messages(){return this._messages;}
requestClearMessages(){for(const logModel of TargetManager.instance().models(LogModel)){logModel.requestClear();}
for(const runtimeModel of TargetManager.instance().models(RuntimeModel)){runtimeModel.discardConsoleEntries();}
this._clear();}
_clear(){this._messages=[];this._messageByExceptionId.clear();this._errors=0;this._warnings=0;this._violations=0;this.dispatchEventToListeners(Events$e.ConsoleCleared);}
errors(){return this._errors;}
warnings(){return this._warnings;}
violations(){return this._violations;}
async saveToTempVariable(currentExecutionContext,remoteObject){if(!remoteObject||!currentExecutionContext){failedToSave(null);return;}
const executionContext=(currentExecutionContext);const result=await executionContext.globalObject('',false);if(!!result.exceptionDetails||!result.object){failedToSave(result.object||null);return;}
const globalObject=result.object;const callFunctionResult=await globalObject.callFunction(saveVariable,[RemoteObject.toCallArgument(remoteObject)]);globalObject.release();if(callFunctionResult.wasThrown||!callFunctionResult.object||callFunctionResult.object.type!=='string'){failedToSave(callFunctionResult.object||null);}else{const text=(callFunctionResult.object.value);const message=this.addCommandMessage(executionContext,text);this.evaluateCommandInConsole(executionContext,message,text,false);}
if(callFunctionResult.object){callFunctionResult.object.release();}
function saveVariable(value){const prefix='temp';let index=1;while((prefix+index)in this){++index;}
const name=prefix+index;this[name]=value;return name;}
function failedToSave(result){let message=UIString.UIString('Failed to save to temp variable.');if(result){message+=' '+result.description;}
Console.Console.instance().error(message);}}}
const Events$e={ConsoleCleared:Symbol('ConsoleCleared'),MessageAdded:Symbol('MessageAdded'),MessageUpdated:Symbol('MessageUpdated'),CommandEvaluated:Symbol('CommandEvaluated')};class ConsoleMessage{constructor(runtimeModel,source,level,messageText,type,url,line,column,parameters,stackTrace,timestamp,executionContextId,scriptId,workerId,context){this._runtimeModel=runtimeModel;this.source=source;this.level=(level);this.messageText=messageText;this.type=type||MessageType.Log;this.url=url||undefined;this.line=line||0;this.column=column||0;this.parameters=parameters;this.stackTrace=stackTrace;this.timestamp=timestamp||Date.now();this.executionContextId=executionContextId||0;this.scriptId=scriptId||null;this.workerId=workerId||null;if(!this.executionContextId&&this._runtimeModel){if(this.scriptId){this.executionContextId=this._runtimeModel.executionContextIdForScriptId(this.scriptId);}else if(this.stackTrace){this.executionContextId=this._runtimeModel.executionContextForStackTrace(this.stackTrace);}}
if(context){this.context=context.match(/[^#]*/)[0];}}
static fromException(runtimeModel,exceptionDetails,messageType,timestamp,forceUrl){return new ConsoleMessage(runtimeModel,MessageSource.JS,MessageLevel.Error,RuntimeModel.simpleTextFromException(exceptionDetails),messageType,forceUrl||exceptionDetails.url,exceptionDetails.lineNumber,exceptionDetails.columnNumber,exceptionDetails.exception?[RemoteObject.fromLocalObject(exceptionDetails.text),exceptionDetails.exception]:undefined,exceptionDetails.stackTrace,timestamp,exceptionDetails.executionContextId,exceptionDetails.scriptId);}
runtimeModel(){return this._runtimeModel;}
target(){return this._runtimeModel?this._runtimeModel.target():null;}
setOriginatingMessage(originatingMessage){this._originatingConsoleMessage=originatingMessage;this.executionContextId=originatingMessage.executionContextId;}
setExecutionContextId(executionContextId){this.executionContextId=executionContextId;}
setExceptionId(exceptionId){this._exceptionId=exceptionId;}
originatingMessage(){return this._originatingConsoleMessage;}
isGroupMessage(){return this.type===MessageType.StartGroup||this.type===MessageType.StartGroupCollapsed||this.type===MessageType.EndGroup;}
isGroupStartMessage(){return this.type===MessageType.StartGroup||this.type===MessageType.StartGroupCollapsed;}
isErrorOrWarning(){return(this.level===MessageLevel.Warning||this.level===MessageLevel.Error);}
isGroupable(){const isUngroupableError=this.level===MessageLevel.Error&&(this.source===MessageSource.JS||this.source===MessageSource.Network);return(this.source!==MessageSource.ConsoleAPI&&this.type!==MessageType.Command&&this.type!==MessageType.Result&&this.type!==MessageType.System&&!isUngroupableError);}
groupCategoryKey(){return[this.source,this.level,this.type,this._pageLoadSequenceNumber].join(':');}
isEqual(msg){if(!msg){return false;}
if(!this._isEqualStackTraces(this.stackTrace,msg.stackTrace)){return false;}
if(this.parameters){if(!msg.parameters||this.parameters.length!==msg.parameters.length){return false;}
for(let i=0;i<msg.parameters.length;++i){if(msg.parameters[i].type==='object'&&msg.parameters[i].subtype!=='error'){return false;}
if(this.parameters[i].type!==msg.parameters[i].type||this.parameters[i].value!==msg.parameters[i].value||this.parameters[i].description!==msg.parameters[i].description){return false;}}}
return(this.runtimeModel()===msg.runtimeModel())&&(this.source===msg.source)&&(this.type===msg.type)&&(this.level===msg.level)&&(this.line===msg.line)&&(this.url===msg.url)&&(this.messageText===msg.messageText)&&(this.request===msg.request)&&(this.executionContextId===msg.executionContextId);}
_isEqualStackTraces(stackTrace1,stackTrace2){if(!stackTrace1!==!stackTrace2){return false;}
if(!stackTrace1){return true;}
const callFrames1=stackTrace1.callFrames;const callFrames2=stackTrace2.callFrames;if(callFrames1.length!==callFrames2.length){return false;}
for(let i=0,n=callFrames1.length;i<n;++i){if(callFrames1[i].url!==callFrames2[i].url||callFrames1[i].functionName!==callFrames2[i].functionName||callFrames1[i].lineNumber!==callFrames2[i].lineNumber||callFrames1[i].columnNumber!==callFrames2[i].columnNumber){return false;}}
return this._isEqualStackTraces(stackTrace1.parent,stackTrace2.parent);}}
const MessageSource={XML:'xml',JS:'javascript',Network:'network',ConsoleAPI:'console-api',Storage:'storage',AppCache:'appcache',Rendering:'rendering',CSS:'css',Security:'security',Deprecation:'deprecation',Worker:'worker',Violation:'violation',Intervention:'intervention',Recommendation:'recommendation',Other:'other'};const MessageType={Log:'log',Debug:'debug',Info:'info',Error:'error',Warning:'warning',Dir:'dir',DirXML:'dirxml',Table:'table',Trace:'trace',Clear:'clear',StartGroup:'startGroup',StartGroupCollapsed:'startGroupCollapsed',EndGroup:'endGroup',Assert:'assert',Result:'result',Profile:'profile',ProfileEnd:'profileEnd',Command:'command',System:'system',QueryObjectResult:'queryObjectResult'};const MessageLevel={Verbose:'verbose',Info:'info',Warning:'warning',Error:'error'};const MessageSourceDisplayName=new Map([[MessageSource.XML,'xml'],[MessageSource.JS,'javascript'],[MessageSource.Network,'network'],[MessageSource.ConsoleAPI,'console-api'],[MessageSource.Storage,'storage'],[MessageSource.AppCache,'appcache'],[MessageSource.Rendering,'rendering'],[MessageSource.CSS,'css'],[MessageSource.Security,'security'],[MessageSource.Deprecation,'deprecation'],[MessageSource.Worker,'worker'],[MessageSource.Violation,'violation'],[MessageSource.Intervention,'intervention'],[MessageSource.Recommendation,'recommendation'],[MessageSource.Other,'other']]);let ConsoleAPICall;let ExceptionWithTimestamp;var ConsoleModel$1=Object.freeze({__proto__:null,ConsoleModel:ConsoleModel,Events:Events$e,ConsoleMessage:ConsoleMessage,MessageSource:MessageSource,MessageType:MessageType,MessageLevel:MessageLevel,MessageSourceDisplayName:MessageSourceDisplayName,ConsoleAPICall:ConsoleAPICall,ExceptionWithTimestamp:ExceptionWithTimestamp});class CookieModel extends SDKModel{constructor(target){super(target);this._blockedCookies=new Map();this._cookieToBlockedReasons=new Map();}
addBlockedCookie(cookie,blockedReasons){const key=cookie.key();const previousCookie=this._blockedCookies.get(key);this._blockedCookies.set(key,cookie);this._cookieToBlockedReasons.set(cookie,blockedReasons);if(previousCookie){this._cookieToBlockedReasons.delete(key);}}
getCookieToBlockedReasonsMap(){return this._cookieToBlockedReasons;}
async getCookies(urls){const normalCookies=await this.target().networkAgent().getCookies(urls).then(cookies=>(cookies||[]).map(cookie=>Cookie.fromProtocolCookie(cookie)));return normalCookies.concat(Array.from(this._blockedCookies.values()));}
deleteCookie(cookie,callback){this._deleteAll([cookie],callback);}
clear(domain,callback){this.getCookiesForDomain(domain||null).then(cookies=>this._deleteAll(cookies,callback));}
saveCookie(cookie){let domain=cookie.domain();if(!domain.startsWith('.')){domain='';}
let expires=undefined;if(cookie.expires()){expires=Math.floor(Date.parse(cookie.expires())/1000);}
return this.target().networkAgent().setCookie(cookie.name(),cookie.value(),cookie.url()||undefined,domain,cookie.path(),cookie.secure(),cookie.httpOnly(),cookie.sameSite(),expires,cookie.priority()).then(success=>!!success);}
getCookiesForDomain(domain){const resourceURLs=[];function populateResourceURLs(resource){const documentURL=ParsedURL.ParsedURL.fromString(resource.documentURL);if(documentURL&&(!domain||documentURL.securityOrigin()===domain)){resourceURLs.push(resource.url);}}
const resourceTreeModel=this.target().model(ResourceTreeModel);if(resourceTreeModel){resourceTreeModel.forAllResources(populateResourceURLs);}
return this.getCookies(resourceURLs);}
_deleteAll(cookies,callback){const networkAgent=this.target().networkAgent();this._blockedCookies.clear();this._cookieToBlockedReasons.clear();Promise.all(cookies.map(cookie=>networkAgent.deleteCookies(cookie.name(),undefined,cookie.domain(),cookie.path()))).then(callback||function(){});}}
SDKModel.register(CookieModel,Capability.Network,false);let BlockedReason;var CookieModel$1=Object.freeze({__proto__:null,CookieModel:CookieModel,BlockedReason:BlockedReason});class CPUProfileNode extends ProfileNode{constructor(node,sampleTime){const callFrame=node.callFrame||({functionName:node['functionName'],scriptId:node['scriptId'],url:node['url'],lineNumber:node['lineNumber']-1,columnNumber:node['columnNumber']-1});super(callFrame);this.id=node.id;this.self=node.hitCount*sampleTime;this.positionTicks=node.positionTicks;this.deoptReason=node.deoptReason&&node.deoptReason!=='no reason'?node.deoptReason:null;}}
class CPUProfileDataModel extends ProfileTreeModel{constructor(profile,target){super(target);const isLegacyFormat=!!profile['head'];if(isLegacyFormat){this.profileStartTime=profile.startTime*1000;this.profileEndTime=profile.endTime*1000;this.timestamps=profile.timestamps;this._compatibilityConversionHeadToNodes(profile);}else{this.profileStartTime=profile.startTime/1000;this.profileEndTime=profile.endTime/1000;this.timestamps=this._convertTimeDeltas(profile);}
this.samples=profile.samples;this.lines=profile.lines;this.totalHitCount=0;this.profileHead=this._translateProfileTree(profile.nodes);this.initialize(this.profileHead);this._extractMetaNodes();if(this.samples){this._buildIdToNodeMap();this._sortSamples();this._normalizeTimestamps();this._fixMissingSamples();}}
_compatibilityConversionHeadToNodes(profile){if(!profile.head||profile.nodes){return;}
const nodes=[];convertNodesTree(profile.head);profile.nodes=nodes;delete profile.head;function convertNodesTree(node){nodes.push(node);node.children=((node.children)).map(convertNodesTree);return node.id;}}
_convertTimeDeltas(profile){if(!profile.timeDeltas){return null;}
let lastTimeUsec=profile.startTime;const timestamps=new Array(profile.timeDeltas.length);for(let i=0;i<profile.timeDeltas.length;++i){lastTimeUsec+=profile.timeDeltas[i];timestamps[i]=lastTimeUsec;}
return timestamps;}
_translateProfileTree(nodes){function isNativeNode(node){if(node.callFrame){return!!node.callFrame.url&&node.callFrame.url.startsWith('native ');}
return!!node['url']&&node['url'].startsWith('native ');}
function buildChildrenFromParents(nodes){if(nodes[0].children){return;}
nodes[0].children=[];for(let i=1;i<nodes.length;++i){const node=nodes[i];const parentNode=nodeByIdMap.get(node.parent);if(parentNode.children){parentNode.children.push(node.id);}else{parentNode.children=[node.id];}}}
function buildHitCountFromSamples(nodes,samples){if(typeof(nodes[0].hitCount)==='number'){return;}
console.assert(samples,'Error: Neither hitCount nor samples are present in profile.');for(let i=0;i<nodes.length;++i){nodes[i].hitCount=0;}
for(let i=0;i<samples.length;++i){++nodeByIdMap.get(samples[i]).hitCount;}}
const nodeByIdMap=new Map();for(let i=0;i<nodes.length;++i){const node=nodes[i];nodeByIdMap.set(node.id,node);}
buildHitCountFromSamples(nodes,this.samples);buildChildrenFromParents(nodes);this.totalHitCount=nodes.reduce((acc,node)=>acc+node.hitCount,0);const sampleTime=(this.profileEndTime-this.profileStartTime)/this.totalHitCount;const keepNatives=!!Settings.Settings.instance().moduleSetting('showNativeFunctionsInJSProfile').get();const root=nodes[0];const idMap=new Map([[root.id,root.id]]);const resultRoot=new CPUProfileNode(root,sampleTime);const parentNodeStack=root.children.map(()=>resultRoot);const sourceNodeStack=root.children.map(id=>nodeByIdMap.get(id));while(sourceNodeStack.length){let parentNode=parentNodeStack.pop();const sourceNode=sourceNodeStack.pop();if(!sourceNode.children){sourceNode.children=[];}
const targetNode=new CPUProfileNode(sourceNode,sampleTime);if(keepNatives||!isNativeNode(sourceNode)){parentNode.children.push(targetNode);parentNode=targetNode;}else{parentNode.self+=targetNode.self;}
idMap.set(sourceNode.id,parentNode.id);parentNodeStack.push.apply(parentNodeStack,sourceNode.children.map(()=>parentNode));sourceNodeStack.push.apply(sourceNodeStack,sourceNode.children.map(id=>nodeByIdMap.get(id)));}
if(this.samples){this.samples=this.samples.map(id=>idMap.get(id));}
return resultRoot;}
_sortSamples(){const timestamps=this.timestamps;if(!timestamps){return;}
const samples=this.samples;const indices=timestamps.map((x,index)=>index);indices.sort((a,b)=>timestamps[a]-timestamps[b]);for(let i=0;i<timestamps.length;++i){let index=indices[i];if(index===i){continue;}
const savedTimestamp=timestamps[i];const savedSample=samples[i];let currentIndex=i;while(index!==i){samples[currentIndex]=samples[index];timestamps[currentIndex]=timestamps[index];currentIndex=index;index=indices[index];indices[currentIndex]=currentIndex;}
samples[currentIndex]=savedSample;timestamps[currentIndex]=savedTimestamp;}}
_normalizeTimestamps(){let timestamps=this.timestamps;if(!timestamps){const profileStartTime=this.profileStartTime;const interval=(this.profileEndTime-profileStartTime)/this.samples.length;timestamps=new Float64Array(this.samples.length+1);for(let i=0;i<timestamps.length;++i){timestamps[i]=profileStartTime+i*interval;}
this.timestamps=timestamps;return;}
for(let i=0;i<timestamps.length;++i){timestamps[i]/=1000;}
if(this.samples.length===timestamps.length){const averageSample=(timestamps.peekLast()-timestamps[0])/(timestamps.length-1);this.timestamps.push(timestamps.peekLast()+averageSample);}
this.profileStartTime=timestamps[0];this.profileEndTime=timestamps.peekLast();}
_buildIdToNodeMap(){this._idToNode=new Map();const idToNode=this._idToNode;const stack=[this.profileHead];while(stack.length){const node=stack.pop();idToNode.set(node.id,node);stack.push.apply(stack,node.children);}}
_extractMetaNodes(){const topLevelNodes=this.profileHead.children;for(let i=0;i<topLevelNodes.length&&!(this.gcNode&&this.programNode&&this.idleNode);i++){const node=topLevelNodes[i];if(node.functionName==='(garbage collector)'){this.gcNode=node;}else if(node.functionName==='(program)'){this.programNode=node;}else if(node.functionName==='(idle)'){this.idleNode=node;}}}
_fixMissingSamples(){const samples=this.samples;const samplesCount=samples.length;if(!this.programNode||samplesCount<3){return;}
const idToNode=this._idToNode;const programNodeId=this.programNode.id;const gcNodeId=this.gcNode?this.gcNode.id:-1;const idleNodeId=this.idleNode?this.idleNode.id:-1;let prevNodeId=samples[0];let nodeId=samples[1];let count=0;for(let sampleIndex=1;sampleIndex<samplesCount-1;sampleIndex++){const nextNodeId=samples[sampleIndex+1];if(nodeId===programNodeId&&!isSystemNode(prevNodeId)&&!isSystemNode(nextNodeId)&&bottomNode(idToNode.get(prevNodeId))===bottomNode(idToNode.get(nextNodeId))){++count;samples[sampleIndex]=prevNodeId;}
prevNodeId=nodeId;nodeId=nextNodeId;}
if(count){Console.Console.instance().warn(ls`DevTools: CPU profile parser is fixing ${count} missing samples.`);}
function bottomNode(node){while(node.parent&&node.parent.parent){node=node.parent;}
return node;}
function isSystemNode(nodeId){return nodeId===programNodeId||nodeId===gcNodeId||nodeId===idleNodeId;}}
forEachFrame(openFrameCallback,closeFrameCallback,startTime,stopTime){if(!this.profileHead||!this.samples){return;}
startTime=startTime||0;stopTime=stopTime||Infinity;const samples=this.samples;const timestamps=this.timestamps;const idToNode=this._idToNode;const gcNode=this.gcNode;const samplesCount=samples.length;const startIndex=timestamps.lowerBound(startTime);let stackTop=0;const stackNodes=[];let prevId=this.profileHead.id;let sampleTime;let gcParentNode=null;const stackDepth=this.maxDepth+3;if(!this._stackStartTimes){this._stackStartTimes=new Float64Array(stackDepth);}
const stackStartTimes=this._stackStartTimes;if(!this._stackChildrenDuration){this._stackChildrenDuration=new Float64Array(stackDepth);}
const stackChildrenDuration=this._stackChildrenDuration;let node;let sampleIndex;for(sampleIndex=startIndex;sampleIndex<samplesCount;sampleIndex++){sampleTime=timestamps[sampleIndex];if(sampleTime>=stopTime){break;}
const id=samples[sampleIndex];if(id===prevId){continue;}
node=idToNode.get(id);let prevNode=idToNode.get(prevId);if(node===gcNode){gcParentNode=prevNode;openFrameCallback(gcParentNode.depth+1,gcNode,sampleTime);stackStartTimes[++stackTop]=sampleTime;stackChildrenDuration[stackTop]=0;prevId=id;continue;}
if(prevNode===gcNode){const start=stackStartTimes[stackTop];const duration=sampleTime-start;stackChildrenDuration[stackTop-1]+=duration;closeFrameCallback(gcParentNode.depth+1,gcNode,start,duration,duration-stackChildrenDuration[stackTop]);--stackTop;prevNode=gcParentNode;prevId=prevNode.id;gcParentNode=null;}
while(node.depth>prevNode.depth){stackNodes.push(node);node=node.parent;}
while(prevNode!==node){const start=stackStartTimes[stackTop];const duration=sampleTime-start;stackChildrenDuration[stackTop-1]+=duration;closeFrameCallback(prevNode.depth,(prevNode),start,duration,duration-stackChildrenDuration[stackTop]);--stackTop;if(node.depth===prevNode.depth){stackNodes.push(node);node=node.parent;}
prevNode=prevNode.parent;}
while(stackNodes.length){node=stackNodes.pop();openFrameCallback(node.depth,node,sampleTime);stackStartTimes[++stackTop]=sampleTime;stackChildrenDuration[stackTop]=0;}
prevId=id;}
sampleTime=timestamps[sampleIndex]||this.profileEndTime;if(idToNode.get(prevId)===gcNode){const start=stackStartTimes[stackTop];const duration=sampleTime-start;stackChildrenDuration[stackTop-1]+=duration;closeFrameCallback(gcParentNode.depth+1,node,start,duration,duration-stackChildrenDuration[stackTop]);--stackTop;prevId=gcParentNode.id;}
for(let node=idToNode.get(prevId);node.parent;node=node.parent){const start=stackStartTimes[stackTop];const duration=sampleTime-start;stackChildrenDuration[stackTop-1]+=duration;closeFrameCallback(node.depth,(node),start,duration,duration-stackChildrenDuration[stackTop]);--stackTop;}}
nodeByIndex(index){return this._idToNode.get(this.samples[index])||null;}}
var CPUProfileDataModel$1=Object.freeze({__proto__:null,CPUProfileNode:CPUProfileNode,CPUProfileDataModel:CPUProfileDataModel});class DOMDebuggerModel extends SDKModel{constructor(target){super(target);this._agent=target.domdebuggerAgent();this._runtimeModel=(target.model(RuntimeModel));this._domModel=(target.model(DOMModel));this._domModel.addEventListener(Events$6.DocumentUpdated,this._documentUpdated,this);this._domModel.addEventListener(Events$6.NodeRemoved,this._nodeRemoved,this);this._domBreakpoints=[];this._domBreakpointsSetting=Settings.Settings.instance().createLocalSetting('domBreakpoints',[]);if(this._domModel.existingDocument()){this._documentUpdated();}}
runtimeModel(){return this._runtimeModel;}
async eventListeners(remoteObject){console.assert(remoteObject.runtimeModel()===this._runtimeModel);if(!remoteObject.objectId){return[];}
const payloads=await this._agent.getEventListeners((remoteObject.objectId));const eventListeners=[];for(const payload of payloads||[]){const location=this._runtimeModel.debuggerModel().createRawLocationByScriptId(payload.scriptId,payload.lineNumber,payload.columnNumber);if(!location){continue;}
eventListeners.push(new EventListener(this,remoteObject,payload.type,payload.useCapture,payload.passive,payload.once,payload.handler?this._runtimeModel.createRemoteObject(payload.handler):null,payload.originalHandler?this._runtimeModel.createRemoteObject(payload.originalHandler):null,location,null));}
return eventListeners;}
retrieveDOMBreakpoints(){this._domModel.requestDocument();}
domBreakpoints(){return this._domBreakpoints.slice();}
hasDOMBreakpoint(node,type){return this._domBreakpoints.some(breakpoint=>(breakpoint.node===node&&breakpoint.type===type));}
setDOMBreakpoint(node,type){for(const breakpoint of this._domBreakpoints){if(breakpoint.node===node&&breakpoint.type===type){this.toggleDOMBreakpoint(breakpoint,true);return breakpoint;}}
const breakpoint=new DOMBreakpoint(this,node,type,true);this._domBreakpoints.push(breakpoint);this._saveDOMBreakpoints();this._enableDOMBreakpoint(breakpoint);this.dispatchEventToListeners(Events$f.DOMBreakpointAdded,breakpoint);return breakpoint;}
removeDOMBreakpoint(node,type){this._removeDOMBreakpoints(breakpoint=>breakpoint.node===node&&breakpoint.type===type);}
removeAllDOMBreakpoints(){this._removeDOMBreakpoints(breakpoint=>true);}
toggleDOMBreakpoint(breakpoint,enabled){if(enabled===breakpoint.enabled){return;}
breakpoint.enabled=enabled;if(enabled){this._enableDOMBreakpoint(breakpoint);}else{this._disableDOMBreakpoint(breakpoint);}
this.dispatchEventToListeners(Events$f.DOMBreakpointToggled,breakpoint);}
_enableDOMBreakpoint(breakpoint){this._agent.setDOMBreakpoint(breakpoint.node.id,breakpoint.type);breakpoint.node.setMarker(Marker,true);}
_disableDOMBreakpoint(breakpoint){this._agent.removeDOMBreakpoint(breakpoint.node.id,breakpoint.type);breakpoint.node.setMarker(Marker,this._nodeHasBreakpoints(breakpoint.node)?true:null);}
_nodeHasBreakpoints(node){for(const breakpoint of this._domBreakpoints){if(breakpoint.node===node&&breakpoint.enabled){return true;}}
return false;}
resolveDOMBreakpointData(auxData){const type=auxData['type'];const node=this._domModel.nodeForId(auxData['nodeId']);if(!type||!node){return null;}
let targetNode=null;let insertion=false;if(type===Protocol.DOMDebugger.DOMBreakpointType.SubtreeModified){insertion=auxData['insertion']||false;targetNode=this._domModel.nodeForId(auxData['targetNodeId']);}
return{type:type,node:node,targetNode:targetNode,insertion:insertion};}
_currentURL(){const domDocument=this._domModel.existingDocument();return domDocument?domDocument.documentURL:'';}
_documentUpdated(){const removed=this._domBreakpoints;this._domBreakpoints=[];this.dispatchEventToListeners(Events$f.DOMBreakpointsRemoved,removed);const currentURL=this._currentURL();for(const breakpoint of this._domBreakpointsSetting.get()){if(breakpoint.url===currentURL){this._domModel.pushNodeByPathToFrontend(breakpoint.path).then(appendBreakpoint.bind(this,breakpoint));}}
function appendBreakpoint(breakpoint,nodeId){const node=nodeId?this._domModel.nodeForId(nodeId):null;if(!node){return;}
const domBreakpoint=new DOMBreakpoint(this,node,breakpoint.type,breakpoint.enabled);this._domBreakpoints.push(domBreakpoint);if(breakpoint.enabled){this._enableDOMBreakpoint(domBreakpoint);}
this.dispatchEventToListeners(Events$f.DOMBreakpointAdded,domBreakpoint);}}
_removeDOMBreakpoints(filter){const removed=[];const left=[];for(const breakpoint of this._domBreakpoints){if(filter(breakpoint)){removed.push(breakpoint);if(breakpoint.enabled){breakpoint.enabled=false;this._disableDOMBreakpoint(breakpoint);}}else{left.push(breakpoint);}}
if(!removed.length){return;}
this._domBreakpoints=left;this._saveDOMBreakpoints();this.dispatchEventToListeners(Events$f.DOMBreakpointsRemoved,removed);}
_nodeRemoved(event){const node=(event.data.node);const children=node.children()||[];this._removeDOMBreakpoints(breakpoint=>breakpoint.node===node||children.indexOf(breakpoint.node)!==-1);}
_saveDOMBreakpoints(){const currentURL=this._currentURL();const breakpoints=this._domBreakpointsSetting.get().filter(breakpoint=>breakpoint.url!==currentURL);for(const breakpoint of this._domBreakpoints){breakpoints.push({url:currentURL,path:breakpoint.node.path(),type:breakpoint.type,enabled:breakpoint.enabled});}
this._domBreakpointsSetting.set(breakpoints);}}
const Events$f={DOMBreakpointAdded:Symbol('DOMBreakpointAdded'),DOMBreakpointToggled:Symbol('DOMBreakpointToggled'),DOMBreakpointsRemoved:Symbol('DOMBreakpointsRemoved'),};const Marker='breakpoint-marker';class DOMBreakpoint{constructor(domDebuggerModel,node,type,enabled){this.domDebuggerModel=domDebuggerModel;this.node=node;this.type=type;this.enabled=enabled;}}
class EventListener{constructor(domDebuggerModel,eventTarget,type,useCapture,passive,once,handler,originalHandler,location,customRemoveFunction,origin){this._domDebuggerModel=domDebuggerModel;this._eventTarget=eventTarget;this._type=type;this._useCapture=useCapture;this._passive=passive;this._once=once;this._handler=handler;this._originalHandler=originalHandler||handler;this._location=location;const script=location.script();this._sourceURL=script?script.contentURL():'';this._customRemoveFunction=customRemoveFunction;this._origin=origin||EventListener.Origin.Raw;}
domDebuggerModel(){return this._domDebuggerModel;}
type(){return this._type;}
useCapture(){return this._useCapture;}
passive(){return this._passive;}
once(){return this._once;}
handler(){return this._handler;}
location(){return this._location;}
sourceURL(){return this._sourceURL;}
originalHandler(){return this._originalHandler;}
canRemove(){return!!this._customRemoveFunction||this._origin!==EventListener.Origin.FrameworkUser;}
remove(){if(!this.canRemove()){return Promise.resolve();}
if(this._origin!==EventListener.Origin.FrameworkUser){function removeListener(type,listener,useCapture){this.removeEventListener(type,listener,useCapture);if(this['on'+type]){this['on'+type]=undefined;}}
return(this._eventTarget.callFunction(removeListener,[RemoteObject.toCallArgument(this._type),RemoteObject.toCallArgument(this._originalHandler),RemoteObject.toCallArgument(this._useCapture)]));}
return this._customRemoveFunction.callFunction(callCustomRemove,[RemoteObject.toCallArgument(this._type),RemoteObject.toCallArgument(this._originalHandler),RemoteObject.toCallArgument(this._useCapture),RemoteObject.toCallArgument(this._passive),]).then(()=>undefined);function callCustomRemove(type,listener,useCapture,passive){this.call(null,type,listener,useCapture,passive);}}
canTogglePassive(){return this._origin!==EventListener.Origin.FrameworkUser;}
togglePassive(){return(this._eventTarget.callFunction(callTogglePassive,[RemoteObject.toCallArgument(this._type),RemoteObject.toCallArgument(this._originalHandler),RemoteObject.toCallArgument(this._useCapture),RemoteObject.toCallArgument(this._passive),]));function callTogglePassive(type,listener,useCapture,passive){this.removeEventListener(type,listener,{capture:useCapture});this.addEventListener(type,listener,{capture:useCapture,passive:!passive});}}
origin(){return this._origin;}
markAsFramework(){this._origin=EventListener.Origin.Framework;}
isScrollBlockingType(){return this._type==='touchstart'||this._type==='touchmove'||this._type==='mousewheel'||this._type==='wheel';}}
EventListener.Origin={Raw:'Raw',Framework:'Framework',FrameworkUser:'FrameworkUser'};class EventListenerBreakpoint{constructor(instrumentationName,eventName,eventTargetNames,category,title){this._instrumentationName=instrumentationName;this._eventName=eventName;this._eventTargetNames=eventTargetNames;this._category=category;this._title=title;this._enabled=false;}
category(){return this._category;}
enabled(){return this._enabled;}
setEnabled(enabled){if(this._enabled===enabled){return;}
this._enabled=enabled;for(const model of TargetManager.instance().models(DOMDebuggerModel)){this._updateOnModel(model);}}
_updateOnModel(model){if(this._instrumentationName){if(this._enabled){model._agent.setInstrumentationBreakpoint(this._instrumentationName);}else{model._agent.removeInstrumentationBreakpoint(this._instrumentationName);}}else{for(const eventTargetName of this._eventTargetNames){if(this._enabled){model._agent.setEventListenerBreakpoint(this._eventName,eventTargetName);}else{model._agent.removeEventListenerBreakpoint(this._eventName,eventTargetName);}}}}
title(){return this._title;}}
EventListenerBreakpoint._listener='listener:';EventListenerBreakpoint._instrumentation='instrumentation:';class DOMDebuggerManager{constructor(){this._xhrBreakpointsSetting=Settings.Settings.instance().createLocalSetting('xhrBreakpoints',[]);this._xhrBreakpoints=new Map();for(const breakpoint of this._xhrBreakpointsSetting.get()){this._xhrBreakpoints.set(breakpoint.url,breakpoint.enabled);}
this._eventListenerBreakpoints=[];this._createInstrumentationBreakpoints(UIString.UIString('Animation'),['requestAnimationFrame','cancelAnimationFrame','requestAnimationFrame.callback']);this._createInstrumentationBreakpoints(UIString.UIString('Canvas'),['canvasContextCreated','webglErrorFired','webglWarningFired']);this._createInstrumentationBreakpoints(UIString.UIString('Geolocation'),['Geolocation.getCurrentPosition','Geolocation.watchPosition']);this._createInstrumentationBreakpoints(UIString.UIString('Notification'),['Notification.requestPermission']);this._createInstrumentationBreakpoints(UIString.UIString('Parse'),['Element.setInnerHTML','Document.write']);this._createInstrumentationBreakpoints(UIString.UIString('Script'),['scriptFirstStatement','scriptBlockedByCSP']);this._createInstrumentationBreakpoints(UIString.UIString('Timer'),['setTimeout','clearTimeout','setInterval','clearInterval','setTimeout.callback','setInterval.callback']);this._createInstrumentationBreakpoints(UIString.UIString('Window'),['DOMWindow.close']);this._createInstrumentationBreakpoints(UIString.UIString('WebAudio'),['audioContextCreated','audioContextClosed','audioContextResumed','audioContextSuspended']);this._createEventListenerBreakpoints(UIString.UIString('Media'),['play','pause','playing','canplay','canplaythrough','seeking','seeked','timeupdate','ended','ratechange','durationchange','volumechange','loadstart','progress','suspend','abort','error','emptied','stalled','loadedmetadata','loadeddata','waiting'],['audio','video']);this._createEventListenerBreakpoints(UIString.UIString('Picture-in-Picture'),['enterpictureinpicture','leavepictureinpicture'],['video']);this._createEventListenerBreakpoints(UIString.UIString('Picture-in-Picture'),['resize'],['PictureInPictureWindow']);this._createEventListenerBreakpoints(UIString.UIString('Clipboard'),['copy','cut','paste','beforecopy','beforecut','beforepaste'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Control'),['resize','scroll','zoom','focus','blur','select','change','submit','reset'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Device'),['deviceorientation','devicemotion'],['*']);this._createEventListenerBreakpoints(UIString.UIString('DOM Mutation'),['DOMActivate','DOMFocusIn','DOMFocusOut','DOMAttrModified','DOMCharacterDataModified','DOMNodeInserted','DOMNodeInsertedIntoDocument','DOMNodeRemoved','DOMNodeRemovedFromDocument','DOMSubtreeModified','DOMContentLoaded'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Drag / drop'),['drag','dragstart','dragend','dragenter','dragover','dragleave','drop'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Keyboard'),['keydown','keyup','keypress','input'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Load'),['load','beforeunload','unload','abort','error','hashchange','popstate'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Mouse'),['auxclick','click','dblclick','mousedown','mouseup','mouseover','mousemove','mouseout','mouseenter','mouseleave','mousewheel','wheel','contextmenu'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Pointer'),['pointerover','pointerout','pointerenter','pointerleave','pointerdown','pointerup','pointermove','pointercancel','gotpointercapture','lostpointercapture','pointerrawupdate'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Touch'),['touchstart','touchmove','touchend','touchcancel'],['*']);this._createEventListenerBreakpoints(UIString.UIString('Worker'),['message','messageerror'],['*']);this._createEventListenerBreakpoints(UIString.UIString('XHR'),['readystatechange','load','loadstart','loadend','abort','error','progress','timeout'],['xmlhttprequest','xmlhttprequestupload']);this._resolveEventListenerBreakpoint('instrumentation:setTimeout.callback')._title=UIString.UIString('setTimeout fired');this._resolveEventListenerBreakpoint('instrumentation:setInterval.callback')._title=UIString.UIString('setInterval fired');this._resolveEventListenerBreakpoint('instrumentation:scriptFirstStatement')._title=UIString.UIString('Script First Statement');this._resolveEventListenerBreakpoint('instrumentation:scriptBlockedByCSP')._title=UIString.UIString('Script Blocked by Content Security Policy');this._resolveEventListenerBreakpoint('instrumentation:requestAnimationFrame')._title=UIString.UIString('Request Animation Frame');this._resolveEventListenerBreakpoint('instrumentation:cancelAnimationFrame')._title=UIString.UIString('Cancel Animation Frame');this._resolveEventListenerBreakpoint('instrumentation:requestAnimationFrame.callback')._title=UIString.UIString('Animation Frame Fired');this._resolveEventListenerBreakpoint('instrumentation:webglErrorFired')._title=UIString.UIString('WebGL Error Fired');this._resolveEventListenerBreakpoint('instrumentation:webglWarningFired')._title=UIString.UIString('WebGL Warning Fired');this._resolveEventListenerBreakpoint('instrumentation:Element.setInnerHTML')._title=UIString.UIString('Set innerHTML');this._resolveEventListenerBreakpoint('instrumentation:canvasContextCreated')._title=UIString.UIString('Create canvas context');this._resolveEventListenerBreakpoint('instrumentation:Geolocation.getCurrentPosition')._title='getCurrentPosition';this._resolveEventListenerBreakpoint('instrumentation:Geolocation.watchPosition')._title='watchPosition';this._resolveEventListenerBreakpoint('instrumentation:Notification.requestPermission')._title='requestPermission';this._resolveEventListenerBreakpoint('instrumentation:DOMWindow.close')._title='window.close';this._resolveEventListenerBreakpoint('instrumentation:Document.write')._title='document.write';this._resolveEventListenerBreakpoint('instrumentation:audioContextCreated')._title=UIString.UIString('Create AudioContext');this._resolveEventListenerBreakpoint('instrumentation:audioContextClosed')._title=UIString.UIString('Close AudioContext');this._resolveEventListenerBreakpoint('instrumentation:audioContextResumed')._title=UIString.UIString('Resume AudioContext');this._resolveEventListenerBreakpoint('instrumentation:audioContextSuspended')._title=UIString.UIString('Suspend AudioContext');TargetManager.instance().observeModels(DOMDebuggerModel,this);}
_createInstrumentationBreakpoints(category,instrumentationNames){for(const instrumentationName of instrumentationNames){this._eventListenerBreakpoints.push(new EventListenerBreakpoint(instrumentationName,'',[],category,instrumentationName));}}
_createEventListenerBreakpoints(category,eventNames,eventTargetNames){for(const eventName of eventNames){this._eventListenerBreakpoints.push(new EventListenerBreakpoint('',eventName,eventTargetNames,category,eventName));}}
_resolveEventListenerBreakpoint(eventName,eventTargetName){const instrumentationPrefix='instrumentation:';const listenerPrefix='listener:';let instrumentationName='';if(eventName.startsWith(instrumentationPrefix)){instrumentationName=eventName.substring(instrumentationPrefix.length);eventName='';}else if(eventName.startsWith(listenerPrefix)){eventName=eventName.substring(listenerPrefix.length);}else{return null;}
eventTargetName=(eventTargetName||'*').toLowerCase();let result=null;for(const breakpoint of this._eventListenerBreakpoints){if(instrumentationName&&breakpoint._instrumentationName===instrumentationName){result=breakpoint;}
if(eventName&&breakpoint._eventName===eventName&&breakpoint._eventTargetNames.indexOf(eventTargetName)!==-1){result=breakpoint;}
if(!result&&eventName&&breakpoint._eventName===eventName&&breakpoint._eventTargetNames.indexOf('*')!==-1){result=breakpoint;}}
return result;}
eventListenerBreakpoints(){return this._eventListenerBreakpoints.slice();}
resolveEventListenerBreakpointTitle(auxData){const id=auxData['eventName'];if(id==='instrumentation:webglErrorFired'&&auxData['webglErrorName']){let errorName=auxData['webglErrorName'];errorName=errorName.replace(/^.*(0x[0-9a-f]+).*$/i,'$1');return UIString.UIString('WebGL Error Fired (%s)',errorName);}
if(id==='instrumentation:scriptBlockedByCSP'&&auxData['directiveText']){return UIString.UIString('Script blocked due to Content Security Policy directive: %s',auxData['directiveText']);}
const breakpoint=this._resolveEventListenerBreakpoint(id,auxData['targetName']);if(!breakpoint){return'';}
if(auxData['targetName']){return auxData['targetName']+'.'+breakpoint._title;}
return breakpoint._title;}
resolveEventListenerBreakpoint(auxData){return this._resolveEventListenerBreakpoint(auxData['eventName'],auxData['targetName']);}
xhrBreakpoints(){return this._xhrBreakpoints;}
_saveXHRBreakpoints(){const breakpoints=[];for(const url of this._xhrBreakpoints.keys()){breakpoints.push({url:url,enabled:this._xhrBreakpoints.get(url)});}
this._xhrBreakpointsSetting.set(breakpoints);}
addXHRBreakpoint(url,enabled){this._xhrBreakpoints.set(url,enabled);if(enabled){for(const model of TargetManager.instance().models(DOMDebuggerModel)){model._agent.setXHRBreakpoint(url);}}
this._saveXHRBreakpoints();}
removeXHRBreakpoint(url){const enabled=this._xhrBreakpoints.get(url);this._xhrBreakpoints.delete(url);if(enabled){for(const model of TargetManager.instance().models(DOMDebuggerModel)){model._agent.removeXHRBreakpoint(url);}}
this._saveXHRBreakpoints();}
toggleXHRBreakpoint(url,enabled){this._xhrBreakpoints.set(url,enabled);for(const model of TargetManager.instance().models(DOMDebuggerModel)){if(enabled){model._agent.setXHRBreakpoint(url);}else{model._agent.removeXHRBreakpoint(url);}}
this._saveXHRBreakpoints();}
modelAdded(domDebuggerModel){for(const url of this._xhrBreakpoints.keys()){if(this._xhrBreakpoints.get(url)){domDebuggerModel._agent.setXHRBreakpoint(url);}}
for(const breakpoint of this._eventListenerBreakpoints){if(breakpoint._enabled){breakpoint._updateOnModel(domDebuggerModel);}}}
modelRemoved(domDebuggerModel){}}
SDKModel.register(DOMDebuggerModel,Capability.DOM,false);var DOMDebuggerModel$1=Object.freeze({__proto__:null,DOMDebuggerModel:DOMDebuggerModel,Events:Events$f,DOMBreakpoint:DOMBreakpoint,EventListener:EventListener,EventListenerBreakpoint:EventListenerBreakpoint,DOMDebuggerManager:DOMDebuggerManager});class EmulationModel extends SDKModel{constructor(target){super(target);this._emulationAgent=target.emulationAgent();this._pageAgent=target.pageAgent();this._deviceOrientationAgent=target.deviceOrientationAgent();this._cssModel=target.model(CSSModel);this._overlayModel=target.model(OverlayModel);if(this._overlayModel){this._overlayModel.addEventListener(Events$5.InspectModeWillBeToggled,this._updateTouch,this);}
const disableJavascriptSetting=Settings.Settings.instance().moduleSetting('javaScriptDisabled');disableJavascriptSetting.addChangeListener(()=>this._emulationAgent.setScriptExecutionDisabled(disableJavascriptSetting.get()));if(disableJavascriptSetting.get()){this._emulationAgent.setScriptExecutionDisabled(true);}
const mediaTypeSetting=Settings.Settings.instance().moduleSetting('emulatedCSSMedia');const mediaFeaturePrefersColorSchemeSetting=Settings.Settings.instance().moduleSetting('emulatedCSSMediaFeaturePrefersColorScheme');const mediaFeaturePrefersReducedMotionSetting=Settings.Settings.instance().moduleSetting('emulatedCSSMediaFeaturePrefersReducedMotion');this._mediaConfiguration=new Map([['type',mediaTypeSetting.get()],['prefers-color-scheme',mediaFeaturePrefersColorSchemeSetting.get()],['prefers-reduced-motion',mediaFeaturePrefersReducedMotionSetting.get()],]);mediaTypeSetting.addChangeListener(()=>{this._mediaConfiguration.set('type',mediaTypeSetting.get());this._updateCssMedia();});mediaFeaturePrefersColorSchemeSetting.addChangeListener(()=>{this._mediaConfiguration.set('prefers-color-scheme',mediaFeaturePrefersColorSchemeSetting.get());this._updateCssMedia();});mediaFeaturePrefersReducedMotionSetting.addChangeListener(()=>{this._mediaConfiguration.set('prefers-reduced-motion',mediaFeaturePrefersReducedMotionSetting.get());this._updateCssMedia();});this._updateCssMedia();const visionDeficiencySetting=Settings.Settings.instance().moduleSetting('emulatedVisionDeficiency');visionDeficiencySetting.addChangeListener(()=>this._emulateVisionDeficiency(visionDeficiencySetting.get()));if(visionDeficiencySetting.get()){this._emulateVisionDeficiency(visionDeficiencySetting.get());}
this._touchEnabled=false;this._touchMobile=false;this._customTouchEnabled=false;this._touchConfiguration={enabled:false,configuration:'mobile',scriptId:''};}
supportsDeviceEmulation(){return this.target().hasAllCapabilities(Capability.DeviceEmulation);}
resetPageScaleFactor(){return this._emulationAgent.resetPageScaleFactor();}
emulateDevice(metrics){if(metrics){return this._emulationAgent.invoke_setDeviceMetricsOverride(metrics);}
return this._emulationAgent.clearDeviceMetricsOverride();}
overlayModel(){return this._overlayModel;}
async emulateLocation(location){if(!location){this._emulationAgent.clearGeolocationOverride();this._emulationAgent.setTimezoneOverride('');this._emulationAgent.setLocaleOverride('');this._emulationAgent.setUserAgentOverride(SDK.multitargetNetworkManager.currentUserAgent());}
if(location.error){this._emulationAgent.setGeolocationOverride();this._emulationAgent.setTimezoneOverride('');this._emulationAgent.setLocaleOverride('');this._emulationAgent.setUserAgentOverride(SDK.multitargetNetworkManager.currentUserAgent());}else{return Promise.all([this._emulationAgent.setGeolocationOverride(location.latitude,location.longitude,Location$1.DefaultGeoMockAccuracy).catch(err=>Promise.reject({type:'emulation-set-location',message:err.message})),this._emulationAgent.setTimezoneOverride(location.timezoneId).catch(err=>Promise.reject({type:'emulation-set-timezone',message:err.message})),this._emulationAgent.setLocaleOverride(location.locale).catch(err=>Promise.reject({type:'emulation-set-locale',message:err.message})),this._emulationAgent.setUserAgentOverride(SDK.multitargetNetworkManager.currentUserAgent(),location.locale).catch(err=>Promise.reject({type:'emulation-set-user-agent',message:err.message})),]);}}
emulateDeviceOrientation(deviceOrientation){if(deviceOrientation){this._deviceOrientationAgent.setDeviceOrientationOverride(deviceOrientation.alpha,deviceOrientation.beta,deviceOrientation.gamma);}else{this._deviceOrientationAgent.clearDeviceOrientationOverride();}}
_emulateCSSMedia(type,features){this._emulationAgent.setEmulatedMedia(type,features);if(this._cssModel){this._cssModel.mediaQueryResultChanged();}}
_emulateVisionDeficiency(type){this._emulationAgent.setEmulatedVisionDeficiency(type);}
setCPUThrottlingRate(rate){this._emulationAgent.setCPUThrottlingRate(rate);}
emulateTouch(enabled,mobile){this._touchEnabled=enabled;this._touchMobile=mobile;this._updateTouch();}
overrideEmulateTouch(enabled){this._customTouchEnabled=enabled;this._updateTouch();}
_updateTouch(){let configuration={enabled:this._touchEnabled,configuration:this._touchMobile?'mobile':'desktop',};if(this._customTouchEnabled){configuration={enabled:true,configuration:'mobile'};}
if(this._overlayModel&&this._overlayModel.inspectModeEnabled()){configuration={enabled:false,configuration:'mobile'};}
if(!this._touchConfiguration.enabled&&!configuration.enabled){return;}
if(this._touchConfiguration.enabled&&configuration.enabled&&this._touchConfiguration.configuration===configuration.configuration){return;}
this._touchConfiguration=configuration;this._emulationAgent.setTouchEmulationEnabled(configuration.enabled,1);this._emulationAgent.setEmitTouchEventsForMouse(configuration.enabled,configuration.configuration);}
_updateCssMedia(){const type=this._mediaConfiguration.get('type');const features=[{name:'prefers-color-scheme',value:this._mediaConfiguration.get('prefers-color-scheme'),},{name:'prefers-reduced-motion',value:this._mediaConfiguration.get('prefers-reduced-motion'),},];this._emulateCSSMedia(type,features);}}
class Location$1{constructor(latitude,longitude,timezoneId,locale,error){this.latitude=latitude;this.longitude=longitude;this.timezoneId=timezoneId;this.locale=locale;this.error=error;}
static parseSetting(value){if(value){const[position,timezoneId,locale,error]=value.split(':');const[latitude,longitude]=position.split('@');return new Location$1(parseFloat(latitude),parseFloat(longitude),timezoneId,locale,Boolean(error));}
return new Location$1(0,0,'','',false);}
static parseUserInput(latitudeString,longitudeString,timezoneId,locale){if(!latitudeString&&!longitudeString){return null;}
const{valid:isLatitudeValid}=Location$1.latitudeValidator(latitudeString);const{valid:isLongitudeValid}=Location$1.longitudeValidator(longitudeString);if(!isLatitudeValid&&!isLongitudeValid){return null;}
const latitude=isLatitudeValid?parseFloat(latitudeString):-1;const longitude=isLongitudeValid?parseFloat(longitudeString):-1;return new Location$1(latitude,longitude,timezoneId,locale,false);}
static latitudeValidator(value){const numValue=parseFloat(value);const valid=/^([+-]?[\d]+(\.\d+)?|[+-]?\.\d+)$/.test(value)&&numValue>=-90&&numValue<=90;return{valid};}
static longitudeValidator(value){const numValue=parseFloat(value);const valid=/^([+-]?[\d]+(\.\d+)?|[+-]?\.\d+)$/.test(value)&&numValue>=-180&&numValue<=180;return{valid};}
static timezoneIdValidator(value){const valid=value===''||/[a-zA-Z]/.test(value);return{valid};}
static localeValidator(value){const valid=value===''||/[a-zA-Z]{2}/.test(value);return{valid};}
toSetting(){return`${this.latitude}@${this.longitude}:${this.timezoneId}:${this.locale}:${this.error || ''}`;}}
Location$1.DefaultGeoMockAccuracy=150;class DeviceOrientation{constructor(alpha,beta,gamma){this.alpha=alpha;this.beta=beta;this.gamma=gamma;}
static parseSetting(value){if(value){const jsonObject=JSON.parse(value);return new DeviceOrientation(jsonObject.alpha,jsonObject.beta,jsonObject.gamma);}
return new DeviceOrientation(0,0,0);}
static parseUserInput(alphaString,betaString,gammaString){if(!alphaString&&!betaString&&!gammaString){return null;}
const{valid:isAlphaValid}=DeviceOrientation.validator(alphaString);const{valid:isBetaValid}=DeviceOrientation.validator(betaString);const{valid:isGammaValid}=DeviceOrientation.validator(gammaString);if(!isAlphaValid&&!isBetaValid&&!isGammaValid){return null;}
const alpha=isAlphaValid?parseFloat(alphaString):-1;const beta=isBetaValid?parseFloat(betaString):-1;const gamma=isGammaValid?parseFloat(gammaString):-1;return new DeviceOrientation(alpha,beta,gamma);}
static validator(value){const valid=/^([+-]?[\d]+(\.\d+)?|[+-]?\.\d+)$/.test(value);return{valid};}
toSetting(){return JSON.stringify(this);}}
SDKModel.register(EmulationModel,Capability.Emulation,true);var EmulationModel$1=Object.freeze({__proto__:null,EmulationModel:EmulationModel,Location:Location$1,DeviceOrientation:DeviceOrientation});class TracingManager extends SDKModel{constructor(target){super(target);this._tracingAgent=target.tracingAgent();target.registerTracingDispatcher(new TracingDispatcher(this));this._activeClient=null;this._eventBufferSize=0;this._eventsRetrieved=0;}
_bufferUsage(usage,eventCount,percentFull){this._eventBufferSize=eventCount===undefined?null:eventCount;if(this._activeClient){this._activeClient.tracingBufferUsage(usage||percentFull||0);}}
_eventsCollected(events){if(!this._activeClient){return;}
this._activeClient.traceEventsCollected(events);this._eventsRetrieved+=events.length;if(!this._eventBufferSize){this._activeClient.eventsRetrievalProgress(0);return;}
if(this._eventsRetrieved>this._eventBufferSize){this._eventsRetrieved=this._eventBufferSize;}
this._activeClient.eventsRetrievalProgress(this._eventsRetrieved/this._eventBufferSize);}
_tracingComplete(){this._eventBufferSize=0;this._eventsRetrieved=0;if(this._activeClient){this._activeClient.tracingComplete();this._activeClient=null;}
this._finishing=false;}
async start(client,categoryFilter,options){if(this._activeClient){throw new Error('Tracing is already started');}
const bufferUsageReportingIntervalMs=500;this._activeClient=client;const args={bufferUsageReportingInterval:bufferUsageReportingIntervalMs,categories:categoryFilter,options:options,transferMode:TransferMode.ReportEvents};const response=await this._tracingAgent.invoke_start(args);if(response[InspectorBackend.ProtocolError]){this._activeClient=null;}
return response;}
stop(){if(!this._activeClient){throw new Error('Tracing is not started');}
if(this._finishing){throw new Error('Tracing is already being stopped');}
this._finishing=true;this._tracingAgent.end();}}
const TransferMode={ReportEvents:'ReportEvents',ReturnAsStream:'ReturnAsStream'};class TracingManagerClient{traceEventsCollected(events){}
tracingComplete(){}
tracingBufferUsage(usage){}
eventsRetrievalProgress(progress){}}
class TracingDispatcher{constructor(tracingManager){this._tracingManager=tracingManager;}
bufferUsage(usage,eventCount,percentFull){this._tracingManager._bufferUsage(usage,eventCount,percentFull);}
dataCollected(data){this._tracingManager._eventsCollected(data);}
tracingComplete(){this._tracingManager._tracingComplete();}}
SDKModel.register(TracingManager,Capability.Tracing,false);let EventPayload;var TracingManager$1=Object.freeze({__proto__:null,TracingManager:TracingManager,TracingManagerClient:TracingManagerClient,EventPayload:EventPayload});class TracingModel{constructor(backingStorage){this._backingStorage=backingStorage;this._firstWritePending=true;this._processById=new Map();this._processByName=new Map();this._minimumRecordTime=0;this._maximumRecordTime=0;this._devToolsMetadataEvents=[];this._asyncEvents=[];this._openAsyncEvents=new Map();this._openNestableAsyncEvents=new Map();this._profileGroups=new Map();this._parsedCategories=new Map();}
static isNestableAsyncPhase(phase){return phase==='b'||phase==='e'||phase==='n';}
static isAsyncBeginPhase(phase){return phase==='S'||phase==='b';}
static isAsyncPhase(phase){return TracingModel.isNestableAsyncPhase(phase)||phase==='S'||phase==='T'||phase==='F'||phase==='p';}
static isFlowPhase(phase){return phase==='s'||phase==='t'||phase==='f';}
static isTopLevelEvent(event){return event.hasCategory(DevToolsTimelineEventCategory)&&event.name==='RunTask'||event.hasCategory(LegacyTopLevelEventCategory)||event.hasCategory(DevToolsMetadataEventCategory)&&event.name==='Program';}
static _extractId(payload){const scope=payload.scope||'';if(typeof payload.id2==='undefined'){return scope&&payload.id?`${scope}@${payload.id}`:payload.id;}
const id2=payload.id2;if(typeof id2==='object'&&('global'in id2)!==('local'in id2)){return typeof id2['global']!=='undefined'?`:${scope}:${id2['global']}`:`:${scope}:${payload.pid}:${id2['local']}`;}
console.error(`Unexpected id2 field at ${payload.ts / 1000}, one and only one of 'local' and 'global' should be present.`);}
static browserMainThread(tracingModel){const processes=tracingModel.sortedProcesses();if(!processes.length){return null;}
const browserMainThreadName='CrBrowserMain';const browserProcesses=[];const browserMainThreads=[];for(const process of processes){if(process.name().toLowerCase().endsWith('browser')){browserProcesses.push(process);}
browserMainThreads.push(...process.sortedThreads().filter(t=>t.name()===browserMainThreadName));}
if(browserMainThreads.length===1){return browserMainThreads[0];}
if(browserProcesses.length===1){return browserProcesses[0].threadByName(browserMainThreadName);}
const tracingStartedInBrowser=tracingModel.devToolsMetadataEvents().filter(e=>e.name==='TracingStartedInBrowser');if(tracingStartedInBrowser.length===1){return tracingStartedInBrowser[0].thread;}
Console.Console.instance().error('Failed to find browser main thread in trace, some timeline features may be unavailable');return null;}
devToolsMetadataEvents(){return this._devToolsMetadataEvents;}
addEvents(events){for(let i=0;i<events.length;++i){this._addEvent(events[i]);}}
tracingComplete(){this._processPendingAsyncEvents();this._backingStorage.appendString(this._firstWritePending?'[]':']');this._backingStorage.finishWriting();this._firstWritePending=false;for(const process of this._processById.values()){for(const thread of process._threads.values()){thread.tracingComplete();}}}
dispose(){if(!this._firstWritePending){this._backingStorage.reset();}}
adjustTime(offset){this._minimumRecordTime+=offset;this._maximumRecordTime+=offset;for(const process of this._processById.values()){for(const thread of process._threads.values()){for(const event of thread.events()){event.startTime+=offset;if(typeof event.endTime==='number'){event.endTime+=offset;}}
for(const event of thread.asyncEvents()){event.startTime+=offset;if(typeof event.endTime==='number'){event.endTime+=offset;}}}}}
_addEvent(payload){let process=this._processById.get(payload.pid);if(!process){process=new Process(this,payload.pid);this._processById.set(payload.pid,process);}
const phase=Phase;const eventsDelimiter=',\n';this._backingStorage.appendString(this._firstWritePending?'[':eventsDelimiter);this._firstWritePending=false;const stringPayload=JSON.stringify(payload);const isAccessible=payload.ph===phase.SnapshotObject;let backingStorage=null;const keepStringsLessThan=10000;if(isAccessible&&stringPayload.length>keepStringsLessThan){backingStorage=this._backingStorage.appendAccessibleString(stringPayload);}else{this._backingStorage.appendString(stringPayload);}
const timestamp=payload.ts/1000;if(timestamp&&(!this._minimumRecordTime||timestamp<this._minimumRecordTime)&&(payload.ph===phase.Begin||payload.ph===phase.Complete||payload.ph===phase.Instant)){this._minimumRecordTime=timestamp;}
const endTimeStamp=(payload.ts+(payload.dur||0))/1000;this._maximumRecordTime=Math.max(this._maximumRecordTime,endTimeStamp);const event=process._addEvent(payload);if(!event){return;}
if(payload.ph===phase.Sample){this._addSampleEvent(event);return;}
if(TracingModel.isAsyncPhase(payload.ph)){this._asyncEvents.push(event);}
event._setBackingStorage(backingStorage);if(event.hasCategory(DevToolsMetadataEventCategory)){this._devToolsMetadataEvents.push(event);}
if(payload.ph!==phase.Metadata){return;}
switch(payload.name){case MetadataEvent.ProcessSortIndex:{process._setSortIndex(payload.args['sort_index']);break;}
case MetadataEvent.ProcessName:{const processName=payload.args['name'];process._setName(processName);this._processByName.set(processName,process);break;}
case MetadataEvent.ThreadSortIndex:{process.threadById(payload.tid)._setSortIndex(payload.args['sort_index']);break;}
case MetadataEvent.ThreadName:{process.threadById(payload.tid)._setName(payload.args['name']);break;}}}
_addSampleEvent(event){const id=`${event.thread.process().id()}:${event.id}`;const group=this._profileGroups.get(id);if(group){group._addChild(event);}else{this._profileGroups.set(id,new ProfileEventsGroup(event));}}
profileGroup(event){return this._profileGroups.get(`${event.thread.process().id()}:${event.id}`)||null;}
minimumRecordTime(){return this._minimumRecordTime;}
maximumRecordTime(){return this._maximumRecordTime;}
sortedProcesses(){return NamedObject._sort([...this._processById.values()]);}
processByName(name){return this._processByName.get(name);}
processById(pid){return this._processById.get(pid)||null;}
threadByName(processName,threadName){const process=this.processByName(processName);return process&&process.threadByName(threadName);}
extractEventsFromThreadByName(processName,threadName,eventName){const thread=this.threadByName(processName,threadName);if(!thread){return[];}
return thread.removeEventsByName(eventName);}
_processPendingAsyncEvents(){this._asyncEvents.sort(Event.compareStartTime);for(let i=0;i<this._asyncEvents.length;++i){const event=this._asyncEvents[i];if(TracingModel.isNestableAsyncPhase(event.phase)){this._addNestableAsyncEvent(event);}else{this._addAsyncEvent(event);}}
this._asyncEvents=[];this._closeOpenAsyncEvents();}
_closeOpenAsyncEvents(){for(const event of this._openAsyncEvents.values()){event.setEndTime(this._maximumRecordTime);event.steps[0].setEndTime(this._maximumRecordTime);}
this._openAsyncEvents.clear();for(const eventStack of this._openNestableAsyncEvents.values()){while(eventStack.length){eventStack.pop().setEndTime(this._maximumRecordTime);}}
this._openNestableAsyncEvents.clear();}
_addNestableAsyncEvent(event){const phase=Phase;const key=event.categoriesString+'.'+event.id;let openEventsStack=this._openNestableAsyncEvents.get(key);switch(event.phase){case phase.NestableAsyncBegin:{if(!openEventsStack){openEventsStack=[];this._openNestableAsyncEvents.set(key,openEventsStack);}
const asyncEvent=new AsyncEvent(event);openEventsStack.push(asyncEvent);event.thread._addAsyncEvent(asyncEvent);break;}
case phase.NestableAsyncInstant:{if(openEventsStack&&openEventsStack.length){openEventsStack.peekLast()._addStep(event);}
break;}
case phase.NestableAsyncEnd:{if(!openEventsStack||!openEventsStack.length){break;}
const top=openEventsStack.pop();if(top.name!==event.name){console.error(`Begin/end event mismatch for nestable async event, ${top.name} vs. ${event.name}, key: ${key}`);break;}
top._addStep(event);}}}
_addAsyncEvent(event){const phase=Phase;const key=event.categoriesString+'.'+event.name+'.'+event.id;let asyncEvent=this._openAsyncEvents.get(key);if(event.phase===phase.AsyncBegin){if(asyncEvent){console.error(`Event ${event.name} has already been started`);return;}
asyncEvent=new AsyncEvent(event);this._openAsyncEvents.set(key,asyncEvent);event.thread._addAsyncEvent(asyncEvent);return;}
if(!asyncEvent){return;}
if(event.phase===phase.AsyncEnd){asyncEvent._addStep(event);this._openAsyncEvents.delete(key);return;}
if(event.phase===phase.AsyncStepInto||event.phase===phase.AsyncStepPast){const lastStep=asyncEvent.steps.peekLast();if(lastStep.phase!==phase.AsyncBegin&&lastStep.phase!==event.phase){console.assert(false,'Async event step phase mismatch: '+lastStep.phase+' at '+lastStep.startTime+' vs. '+
event.phase+' at '+event.startTime);return;}
asyncEvent._addStep(event);return;}
console.assert(false,'Invalid async event phase');}
backingStorage(){return this._backingStorage;}
_parsedCategoriesForString(str){let parsedCategories=this._parsedCategories.get(str);if(!parsedCategories){parsedCategories=new Set(str?str.split(','):[]);this._parsedCategories.set(str,parsedCategories);}
return parsedCategories;}}
const Phase={Begin:'B',End:'E',Complete:'X',Instant:'I',AsyncBegin:'S',AsyncStepInto:'T',AsyncStepPast:'p',AsyncEnd:'F',NestableAsyncBegin:'b',NestableAsyncEnd:'e',NestableAsyncInstant:'n',FlowBegin:'s',FlowStep:'t',FlowEnd:'f',Metadata:'M',Counter:'C',Sample:'P',CreateObject:'N',SnapshotObject:'O',DeleteObject:'D'};const MetadataEvent={ProcessSortIndex:'process_sort_index',ProcessName:'process_name',ThreadSortIndex:'thread_sort_index',ThreadName:'thread_name'};const LegacyTopLevelEventCategory='toplevel';const DevToolsMetadataEventCategory='disabled-by-default-devtools.timeline';const DevToolsTimelineEventCategory='disabled-by-default-devtools.timeline';class BackingStorage{appendString(string){}
appendAccessibleString(string){}
finishWriting(){}
reset(){}}
class Event{constructor(categories,name,phase,startTime,thread){this.categoriesString=categories||'';this._parsedCategories=thread._model._parsedCategoriesForString(this.categoriesString);this.name=name;this.phase=phase;this.startTime=startTime;this.thread=thread;this.args={};this.selfTime=0;}
static fromPayload(payload,thread){const event=new Event(payload.cat,payload.name,(payload.ph),payload.ts/1000,thread);if(payload.args){event.addArgs(payload.args);}
if(typeof payload.dur==='number'){event.setEndTime((payload.ts+payload.dur)/1000);}
const id=TracingModel._extractId(payload);if(typeof id!=='undefined'){event.id=id;}
if(payload.bind_id){event.bind_id=payload.bind_id;}
return event;}
static compareStartTime(a,b){if(!a||!b){return 0;}
return a.startTime-b.startTime;}
static orderedCompareStartTime(a,b){return a.startTime-b.startTime||a.ordinal-b.ordinal||-1;}
hasCategory(categoryName){return this._parsedCategories.has(categoryName);}
setEndTime(endTime){if(endTime<this.startTime){console.assert(false,'Event out of order: '+this.name);return;}
this.endTime=endTime;this.duration=endTime-this.startTime;}
addArgs(args){for(const name in args){if(name in this.args){console.error('Same argument name ('+name+') is used for begin and end phases of '+this.name);}
this.args[name]=args[name];}}
_complete(endEvent){if(endEvent.args){this.addArgs(endEvent.args);}else{console.error('Missing mandatory event argument \'args\' at '+endEvent.startTime);}
this.setEndTime(endEvent.startTime);}
_setBackingStorage(backingStorage){}}
class ObjectSnapshot extends Event{constructor(category,name,startTime,thread){super(category,name,Phase.SnapshotObject,startTime,thread);this._backingStorage=null;this.id;this._objectPromise=null;}
static fromPayload(payload,thread){const snapshot=new ObjectSnapshot(payload.cat,payload.name,payload.ts/1000,thread);const id=TracingModel._extractId(payload);if(typeof id!=='undefined'){snapshot.id=id;}
if(!payload.args||!payload.args['snapshot']){console.error('Missing mandatory \'snapshot\' argument at '+payload.ts/1000);return snapshot;}
if(payload.args){snapshot.addArgs(payload.args);}
return snapshot;}
requestObject(callback){const snapshot=this.args['snapshot'];if(snapshot){callback(snapshot);return;}
this._backingStorage().then(onRead,callback.bind(null,null));function onRead(result){if(!result){callback(null);return;}
try{const payload=JSON.parse(result);callback(payload['args']['snapshot']);}catch(e){Console.Console.instance().error('Malformed event data in backing storage');callback(null);}}}
objectPromise(){if(!this._objectPromise){this._objectPromise=new Promise(this.requestObject.bind(this));}
return this._objectPromise;}
_setBackingStorage(backingStorage){if(!backingStorage){return;}
this._backingStorage=backingStorage;this.args={};}}
class AsyncEvent extends Event{constructor(startEvent){super(startEvent.categoriesString,startEvent.name,startEvent.phase,startEvent.startTime,startEvent.thread);this.addArgs(startEvent.args);this.steps=[startEvent];}
_addStep(event){this.steps.push(event);if(event.phase===Phase.AsyncEnd||event.phase===Phase.NestableAsyncEnd){this.setEndTime(event.startTime);this.steps[0].setEndTime(event.startTime);}}}
class ProfileEventsGroup{constructor(event){this.children=[event];}
_addChild(event){this.children.push(event);}}
class NamedObject{constructor(model,id){this._model=model;this._id=id;this._name='';this._sortIndex=0;}
static _sort(array){function comparator(a,b){return a._sortIndex!==b._sortIndex?a._sortIndex-b._sortIndex:a.name().localeCompare(b.name());}
return array.sort(comparator);}
_setName(name){this._name=name;}
name(){return this._name;}
_setSortIndex(sortIndex){this._sortIndex=sortIndex;}}
class Process extends NamedObject{constructor(model,id){super(model,id);this._threads=new Map();this._threadByName=new Map();}
id(){return this._id;}
threadById(id){let thread=this._threads.get(id);if(!thread){thread=new Thread(this,id);this._threads.set(id,thread);}
return thread;}
threadByName(name){return this._threadByName.get(name)||null;}
_setThreadByName(name,thread){this._threadByName.set(name,thread);}
_addEvent(payload){return this.threadById(payload.tid)._addEvent(payload);}
sortedThreads(){return NamedObject._sort([...this._threads.values()]);}}
class Thread extends NamedObject{constructor(process,id){super(process._model,id);this._process=process;this._events=[];this._asyncEvents=[];this._lastTopLevelEvent=null;}
tracingComplete(){this._asyncEvents.sort(Event.compareStartTime);this._events.sort(Event.compareStartTime);const phases=Phase;const stack=[];for(let i=0;i<this._events.length;++i){const e=this._events[i];e.ordinal=i;switch(e.phase){case phases.End:{this._events[i]=null;if(!stack.length){continue;}
const top=stack.pop();if(top.name!==e.name||top.categoriesString!==e.categoriesString){console.error('B/E events mismatch at '+top.startTime+' ('+top.name+') vs. '+e.startTime+' ('+e.name+')');}else{top._complete(e);}
break;}
case phases.Begin:{stack.push(e);break;}}}
while(stack.length){stack.pop().setEndTime(this._model.maximumRecordTime());}
this._events=this._events.filter(event=>event!==null);}
_addEvent(payload){const event=payload.ph===Phase.SnapshotObject?ObjectSnapshot.fromPayload(payload,this):Event.fromPayload(payload,this);if(TracingModel.isTopLevelEvent(event)){if(this._lastTopLevelEvent&&this._lastTopLevelEvent.endTime>event.startTime){return null;}
this._lastTopLevelEvent=event;}
this._events.push(event);return event;}
_addAsyncEvent(asyncEvent){this._asyncEvents.push(asyncEvent);}
_setName(name){super._setName(name);this._process._setThreadByName(name,this);}
id(){return this._id;}
process(){return this._process;}
events(){return this._events;}
asyncEvents(){return this._asyncEvents;}
removeEventsByName(name){const extracted=[];this._events=this._events.filter(e=>{if(!e){return false;}
if(e.name!==name){return true;}
extracted.push(e);return false;});return extracted;}}
var TracingModel$1=Object.freeze({__proto__:null,TracingModel:TracingModel,Phase:Phase,MetadataEvent:MetadataEvent,LegacyTopLevelEventCategory:LegacyTopLevelEventCategory,DevToolsMetadataEventCategory:DevToolsMetadataEventCategory,DevToolsTimelineEventCategory:DevToolsTimelineEventCategory,BackingStorage:BackingStorage,Event:Event,ObjectSnapshot:ObjectSnapshot,AsyncEvent:AsyncEvent,Process:Process,Thread:Thread});class FilmStripModel{constructor(tracingModel,zeroTime){this.reset(tracingModel,zeroTime);}
reset(tracingModel,zeroTime){this._zeroTime=zeroTime||tracingModel.minimumRecordTime();this._spanTime=tracingModel.maximumRecordTime()-this._zeroTime;this._frames=[];const browserMain=TracingModel.browserMainThread(tracingModel);if(!browserMain){return;}
const events=browserMain.events();for(let i=0;i<events.length;++i){const event=events[i];if(event.startTime<this._zeroTime){continue;}
if(!event.hasCategory(_category)){continue;}
if(event.name===TraceEvents.CaptureFrame){const data=event.args['data'];if(data){this._frames.push(Frame._fromEvent(this,event,this._frames.length));}}else if(event.name===TraceEvents.Screenshot){this._frames.push(Frame._fromSnapshot(this,(event),this._frames.length));}}}
frames(){return this._frames;}
zeroTime(){return this._zeroTime;}
spanTime(){return this._spanTime;}
frameByTimestamp(timestamp){const index=this._frames.upperBound(timestamp,(timestamp,frame)=>timestamp-frame.timestamp)-1;return index>=0?this._frames[index]:null;}}
const _category='disabled-by-default-devtools.screenshot';const TraceEvents={CaptureFrame:'CaptureFrame',Screenshot:'Screenshot'};class Frame{constructor(model,timestamp,index){this._model=model;this.timestamp=timestamp;this.index=index;this._imageData=null;this._snapshot=null;}
static _fromEvent(model,event,index){const frame=new Frame(model,event.startTime,index);frame._imageData=event.args['data'];return frame;}
static _fromSnapshot(model,snapshot,index){const frame=new Frame(model,snapshot.startTime,index);frame._snapshot=snapshot;return frame;}
model(){return this._model;}
imageDataPromise(){if(this._imageData||!this._snapshot){return Promise.resolve(this._imageData);}
return(this._snapshot.objectPromise());}}
var FilmStripModel$1=Object.freeze({__proto__:null,FilmStripModel:FilmStripModel,Frame:Frame});class NetworkLog extends ObjectWrapper.ObjectWrapper{constructor(){super();this._requests=[];this._requestsSet=new Set();this._pageLoadForManager=new Map();this._isRecording=true;TargetManager.instance().observeModels(NetworkManager,this);}
modelAdded(networkManager){const eventListeners=[];eventListeners.push(networkManager.addEventListener(Events$1.RequestStarted,this._onRequestStarted,this));eventListeners.push(networkManager.addEventListener(Events$1.RequestUpdated,this._onRequestUpdated,this));eventListeners.push(networkManager.addEventListener(Events$1.RequestRedirected,this._onRequestRedirect,this));eventListeners.push(networkManager.addEventListener(Events$1.RequestFinished,this._onRequestUpdated,this));eventListeners.push(networkManager.addEventListener(Events$1.MessageGenerated,this._networkMessageGenerated.bind(this,networkManager)));const resourceTreeModel=networkManager.target().model(ResourceTreeModel);if(resourceTreeModel){eventListeners.push(resourceTreeModel.addEventListener(Events$8.WillReloadPage,this._willReloadPage,this));eventListeners.push(resourceTreeModel.addEventListener(Events$8.MainFrameNavigated,this._onMainFrameNavigated,this));eventListeners.push(resourceTreeModel.addEventListener(Events$8.Load,this._onLoad,this));eventListeners.push(resourceTreeModel.addEventListener(Events$8.DOMContentLoaded,this._onDOMContentLoaded.bind(this,resourceTreeModel)));}
networkManager[_events$1]=eventListeners;}
modelRemoved(networkManager){this._removeNetworkManagerListeners(networkManager);}
_removeNetworkManagerListeners(networkManager){EventTarget.EventTarget.removeEventListeners(networkManager[_events$1]);}
setIsRecording(enabled){if(this._isRecording===enabled){return;}
this._isRecording=enabled;if(enabled){TargetManager.instance().observeModels(NetworkManager,this);}else{TargetManager.instance().unobserveModels(NetworkManager,this);TargetManager.instance().models(NetworkManager).forEach(this._removeNetworkManagerListeners.bind(this));}}
requestForURL(url){return this._requests.find(request=>request.url()===url)||null;}
requests(){return this._requests;}
requestByManagerAndId(networkManager,requestId){for(let i=this._requests.length-1;i>=0;i--){const request=this._requests[i];if(requestId===request.requestId()&&networkManager===NetworkManager.forRequest(request)){return request;}}
return null;}
_requestByManagerAndURL(networkManager,url){for(const request of this._requests){if(url===request.url()&&networkManager===NetworkManager.forRequest(request)){return request;}}
return null;}
_initializeInitiatorSymbolIfNeeded(request){if(!request[_initiatorDataSymbol]){request[_initiatorDataSymbol]={info:null,chain:null,request:undefined,};}}
initiatorInfoForRequest(request){this._initializeInitiatorSymbolIfNeeded(request);if(request[_initiatorDataSymbol].info){return request[_initiatorDataSymbol].info;}
let type=InitiatorType.Other;let url='';let lineNumber=-Infinity;let columnNumber=-Infinity;let scriptId=null;let initiatorStack=null;const initiator=request.initiator();const redirectSource=request.redirectSource();if(redirectSource){type=InitiatorType.Redirect;url=redirectSource.url();}else if(initiator){if(initiator.type===Protocol.Network.InitiatorType.Parser){type=InitiatorType.Parser;url=initiator.url?initiator.url:url;lineNumber=initiator.lineNumber?initiator.lineNumber:lineNumber;}else if(initiator.type===Protocol.Network.InitiatorType.Script){for(let stack=initiator.stack;stack;stack=stack.parent){const topFrame=stack.callFrames.length?stack.callFrames[0]:null;if(!topFrame){continue;}
type=InitiatorType.Script;url=topFrame.url||UIString.UIString('<anonymous>');lineNumber=topFrame.lineNumber;columnNumber=topFrame.columnNumber;scriptId=topFrame.scriptId;break;}
if(!initiator.stack&&initiator.url){type=InitiatorType.Script;url=initiator.url;lineNumber=initiator.lineNumber||0;}
if(initiator.stack&&initiator.stack.callFrames&&initiator.stack.callFrames.length){initiatorStack=initiator.stack||null;}}else if(initiator.type===Protocol.Network.InitiatorType.Preload){type=InitiatorType.Preload;}else if(initiator.type===Protocol.Network.InitiatorType.SignedExchange){type=InitiatorType.SignedExchange;url=initiator.url;}}
request[_initiatorDataSymbol].info={type:type,url:url,lineNumber:lineNumber,columnNumber:columnNumber,scriptId:scriptId,stack:initiatorStack};return request[_initiatorDataSymbol].info;}
initiatorGraphForRequest(request){const initiated=new Map();const networkManager=NetworkManager.forRequest(request);for(const otherRequest of this._requests){const otherRequestManager=NetworkManager.forRequest(otherRequest);if(networkManager===otherRequestManager&&this._initiatorChain(otherRequest).has(request)){initiated.set(otherRequest,this._initiatorRequest(otherRequest));}}
return{initiators:this._initiatorChain(request),initiated:initiated};}
_initiatorChain(request){this._initializeInitiatorSymbolIfNeeded(request);let initiatorChainCache=(request[_initiatorDataSymbol].chain);if(initiatorChainCache){return initiatorChainCache;}
initiatorChainCache=new Set();let checkRequest=request;do{this._initializeInitiatorSymbolIfNeeded(checkRequest);if(checkRequest[_initiatorDataSymbol].chain){initiatorChainCache.addAll(checkRequest[_initiatorDataSymbol].chain);break;}
if(initiatorChainCache.has(checkRequest)){break;}
initiatorChainCache.add(checkRequest);checkRequest=this._initiatorRequest(checkRequest);}while(checkRequest);request[_initiatorDataSymbol].chain=initiatorChainCache;return initiatorChainCache;}
_initiatorRequest(request){this._initializeInitiatorSymbolIfNeeded(request);if(request[_initiatorDataSymbol].request!==undefined){return request[_initiatorDataSymbol].request;}
const url=this.initiatorInfoForRequest(request).url;const networkManager=NetworkManager.forRequest(request);request[_initiatorDataSymbol].request=networkManager?this._requestByManagerAndURL(networkManager,url):null;return request[_initiatorDataSymbol].request;}
_willReloadPage(){if(!Settings.Settings.instance().moduleSetting('network_log.preserve-log').get()){this.reset();}}
_onMainFrameNavigated(event){const mainFrame=(event.data);const manager=mainFrame.resourceTreeModel().target().model(NetworkManager);if(!manager||mainFrame.resourceTreeModel().target().parentTarget()){return;}
const oldRequests=this._requests;const oldManagerRequests=this._requests.filter(request=>NetworkManager.forRequest(request)===manager);const oldRequestsSet=this._requestsSet;this._requests=[];this._requestsSet=new Set();this.dispatchEventToListeners(Events$g.Reset);let currentPageLoad=null;const requestsToAdd=[];for(const request of oldManagerRequests){if(request.loaderId!==mainFrame.loaderId){continue;}
if(!currentPageLoad){currentPageLoad=new PageLoad(request);let redirectSource=request.redirectSource();while(redirectSource){requestsToAdd.push(redirectSource);redirectSource=redirectSource.redirectSource();}}
requestsToAdd.push(request);}
const serviceWorkerRequestsToAdd=[];for(const swRequest of oldRequests){if(!swRequest.initiatedByServiceWorker()){continue;}
const keepRequest=requestsToAdd.some(request=>request.url()===swRequest.url()&&request.issueTime()<=swRequest.issueTime());if(keepRequest){serviceWorkerRequestsToAdd.push(swRequest);}}
requestsToAdd.push(...serviceWorkerRequestsToAdd);for(const request of requestsToAdd){oldRequestsSet.delete(request);this._requests.push(request);this._requestsSet.add(request);currentPageLoad.bindRequest(request);this.dispatchEventToListeners(Events$g.RequestAdded,request);}
if(Settings.Settings.instance().moduleSetting('network_log.preserve-log').get()){for(const request of oldRequestsSet){this._requests.push(request);this._requestsSet.add(request);this.dispatchEventToListeners(Events$g.RequestAdded,request);}}
if(currentPageLoad){this._pageLoadForManager.set(manager,currentPageLoad);}}
importRequests(requests){this.reset();this._requests=[];this._requestsSet.clear();for(const request of requests){this._requests.push(request);this._requestsSet.add(request);this.dispatchEventToListeners(Events$g.RequestAdded,request);}}
_onRequestStarted(event){const request=(event.data);this._requests.push(request);this._requestsSet.add(request);const manager=NetworkManager.forRequest(request);const pageLoad=manager?this._pageLoadForManager.get(manager):null;if(pageLoad){pageLoad.bindRequest(request);}
this.dispatchEventToListeners(Events$g.RequestAdded,request);}
_onRequestUpdated(event){const request=(event.data);if(!this._requestsSet.has(request)){return;}
this.dispatchEventToListeners(Events$g.RequestUpdated,request);}
_onRequestRedirect(event){const request=(event.data);delete request[_initiatorDataSymbol];}
_onDOMContentLoaded(resourceTreeModel,event){const networkManager=resourceTreeModel.target().model(NetworkManager);const pageLoad=networkManager?this._pageLoadForManager.get(networkManager):null;if(pageLoad){pageLoad.contentLoadTime=(event.data);}}
_onLoad(event){const networkManager=event.data.resourceTreeModel.target().model(NetworkManager);const pageLoad=networkManager?this._pageLoadForManager.get(networkManager):null;if(pageLoad){pageLoad.loadTime=(event.data.loadTime);}}
reset(){this._requests=[];this._requestsSet.clear();const managers=new Set(TargetManager.instance().models(NetworkManager));for(const manager of this._pageLoadForManager.keys()){if(!managers.has(manager)){this._pageLoadForManager.delete(manager);}}
this.dispatchEventToListeners(Events$g.Reset);}
_networkMessageGenerated(networkManager,event){const message=(event.data);const consoleMessage=new ConsoleMessage(networkManager.target().model(RuntimeModel),MessageSource.Network,message.warning?MessageLevel.Warning:MessageLevel.Info,message.message);this.associateConsoleMessageWithRequest(consoleMessage,message.requestId);ConsoleModel.instance().addMessage(consoleMessage);}
associateConsoleMessageWithRequest(consoleMessage,requestId){const target=consoleMessage.target();const networkManager=target?target.model(NetworkManager):null;if(!networkManager){return;}
const request=this.requestByManagerAndId(networkManager,requestId);if(!request){return;}
consoleMessage[_requestSymbol]=request;const initiator=request.initiator();if(initiator){consoleMessage.stackTrace=initiator.stack||undefined;if(initiator.url){consoleMessage.url=initiator.url;consoleMessage.line=initiator.lineNumber||0;}}}
static requestForConsoleMessage(consoleMessage){return consoleMessage[_requestSymbol]||null;}}
class PageLoad{constructor(mainRequest){this.id=++PageLoad._lastIdentifier;this.url=mainRequest.url();this.startTime=mainRequest.startTime;this.loadTime;this.contentLoadTime;this.mainRequest=mainRequest;this._showDataSaverWarningIfNeeded();}
async _showDataSaverWarningIfNeeded(){const manager=NetworkManager.forRequest(this.mainRequest);if(!manager){return;}
if(!this.mainRequest.finished){await this.mainRequest.once(Events$2.FinishedLoading);}
const saveDataHeader=this.mainRequest.requestHeaderValue('Save-Data');if(!PageLoad._dataSaverMessageWasShown&&saveDataHeader&&saveDataHeader==='on'){const message=UIString.UIString('Consider disabling %s while debugging. For more info see: %s',UIString.UIString('Chrome Data Saver'),'https://support.google.com/chrome/?p=datasaver');manager.dispatchEventToListeners(Events$1.MessageGenerated,{message:message,requestId:this.mainRequest.requestId(),warning:true});PageLoad._dataSaverMessageWasShown=true;}}
static forRequest(request){return request[PageLoad._pageLoadForRequestSymbol]||null;}
bindRequest(request){request[PageLoad._pageLoadForRequestSymbol]=this;}}
PageLoad._lastIdentifier=0;PageLoad._pageLoadForRequestSymbol=Symbol('PageLoadForRequest');PageLoad._dataSaverMessageWasShown=false;const _requestSymbol=Symbol('_request');const Events$g={Reset:Symbol('Reset'),RequestAdded:Symbol('RequestAdded'),RequestUpdated:Symbol('RequestUpdated')};const _initiatorDataSymbol=Symbol('InitiatorData');const _events$1=Symbol('SDK.NetworkLog.events');let InitiatorGraph;let _InitiatorInfo;var NetworkLog$1=Object.freeze({__proto__:null,NetworkLog:NetworkLog,PageLoad:PageLoad,Events:Events$g,InitiatorGraph:InitiatorGraph,_InitiatorInfo:_InitiatorInfo});class HARLog{static pseudoWallTime(request,monotonicTime){return new Date(request.pseudoWallTime(monotonicTime)*1000);}
static async build(requests){const log=new HARLog();const entryPromises=[];for(const request of requests){entryPromises.push(Entry.build(request));}
const entries=await Promise.all(entryPromises);return{version:'1.2',creator:log._creator(),pages:log._buildPages(requests),entries:entries};}
_creator(){const webKitVersion=/AppleWebKit\/([^ ]+)/.exec(window.navigator.userAgent);return{name:'WebInspector',version:webKitVersion?webKitVersion[1]:'n/a'};}
_buildPages(requests){const seenIdentifiers={};const pages=[];for(let i=0;i<requests.length;++i){const request=requests[i];const page=PageLoad.forRequest(request);if(!page||seenIdentifiers[page.id]){continue;}
seenIdentifiers[page.id]=true;pages.push(this._convertPage(page,request));}
return pages;}
_convertPage(page,request){return{startedDateTime:HARLog.pseudoWallTime(request,page.startTime).toJSON(),id:'page_'+page.id,title:page.url,pageTimings:{onContentLoad:this._pageEventTime(page,page.contentLoadTime),onLoad:this._pageEventTime(page,page.loadTime)}};}
_pageEventTime(page,time){const startTime=page.startTime;if(time===-1||startTime===-1){return-1;}
return Entry._toMilliseconds(time-startTime);}}
class Entry{constructor(request){this._request=request;}
static _toMilliseconds(time){return time===-1?-1:time*1000;}
static async build(request){const harEntry=new Entry(request);let ipAddress=harEntry._request.remoteAddress();const portPositionInString=ipAddress.lastIndexOf(':');if(portPositionInString!==-1){ipAddress=ipAddress.substr(0,portPositionInString);}
const timings=harEntry._buildTimings();let time=0;for(const t of[timings.blocked,timings.dns,timings.connect,timings.send,timings.wait,timings.receive]){time+=Math.max(t,0);}
const initiator=harEntry._request.initiator();const exportedInitiator={};exportedInitiator.type=initiator.type;if(initiator.url!==undefined){exportedInitiator.url=initiator.url;}
if(initiator.lineNumber!==undefined){exportedInitiator.lineNumber=initiator.lineNumber;}
if(initiator.stack){exportedInitiator.stack=initiator.stack;}
const entry={startedDateTime:HARLog.pseudoWallTime(harEntry._request,harEntry._request.issueTime()).toJSON(),time:time,request:await harEntry._buildRequest(),response:harEntry._buildResponse(),cache:{},timings:timings,serverIPAddress:ipAddress.replace(/\[\]/g,''),_initiator:exportedInitiator,_priority:harEntry._request.priority(),_resourceType:harEntry._request.resourceType().name()};if(harEntry._request.cached()){entry._fromCache=harEntry._request.cachedInMemory()?'memory':'disk';}
if(harEntry._request.connectionId!=='0'){entry.connection=harEntry._request.connectionId;}
const page=PageLoad.forRequest(harEntry._request);if(page){entry.pageref='page_'+page.id;}
if(harEntry._request.resourceType()===ResourceType.resourceTypes.WebSocket){const messages=[];for(const message of harEntry._request.frames()){messages.push({type:message.type,time:message.time,opcode:message.opCode,data:message.text});}
entry._webSocketMessages=messages;}
return entry;}
async _buildRequest(){const headersText=this._request.requestHeadersText();const res={method:this._request.requestMethod,url:this._buildRequestURL(this._request.url()),httpVersion:this._request.requestHttpVersion(),headers:this._request.requestHeaders(),queryString:this._buildParameters(this._request.queryParameters||[]),cookies:this._buildCookies(this._request.requestCookies),headersSize:headersText?headersText.length:-1,bodySize:await this._requestBodySize()};const postData=await this._buildPostData();if(postData){res.postData=postData;}
return res;}
_buildResponse(){const headersText=this._request.responseHeadersText;return{status:this._request.statusCode,statusText:this._request.statusText,httpVersion:this._request.responseHttpVersion(),headers:this._request.responseHeaders,cookies:this._buildCookies(this._request.responseCookies),content:this._buildContent(),redirectURL:this._request.responseHeaderValue('Location')||'',headersSize:headersText?headersText.length:-1,bodySize:this.responseBodySize,_transferSize:this._request.transferSize,_error:this._request.localizedFailDescription};}
_buildContent(){const content={size:this._request.resourceSize,mimeType:this._request.mimeType||'x-unknown',};const compression=this.responseCompression;if(typeof compression==='number'){content.compression=compression;}
return content;}
_buildTimings(){const timing=this._request.timing;const issueTime=this._request.issueTime();const startTime=this._request.startTime;const result={blocked:-1,dns:-1,ssl:-1,connect:-1,send:0,wait:0,receive:0,_blocked_queueing:-1};const queuedTime=(issueTime<startTime)?startTime-issueTime:-1;result.blocked=Entry._toMilliseconds(queuedTime);result._blocked_queueing=Entry._toMilliseconds(queuedTime);let highestTime=0;if(timing){const blockedStart=leastNonNegative([timing.dnsStart,timing.connectStart,timing.sendStart]);if(blockedStart!==Infinity){result.blocked+=blockedStart;}
if(timing.proxyEnd!==-1){result._blocked_proxy=timing.proxyEnd-timing.proxyStart;}
if(result._blocked_proxy&&result._blocked_proxy>result.blocked){result.blocked=result._blocked_proxy;}
const dnsStart=timing.dnsEnd>=0?blockedStart:0;const dnsEnd=timing.dnsEnd>=0?timing.dnsEnd:-1;result.dns=dnsEnd-dnsStart;const sslStart=timing.sslEnd>0?timing.sslStart:0;const sslEnd=timing.sslEnd>0?timing.sslEnd:-1;result.ssl=sslEnd-sslStart;const connectStart=timing.connectEnd>=0?leastNonNegative([dnsEnd,blockedStart]):0;const connectEnd=timing.connectEnd>=0?timing.connectEnd:-1;result.connect=connectEnd-connectStart;const sendStart=timing.sendEnd>=0?Math.max(connectEnd,dnsEnd,blockedStart):0;const sendEnd=timing.sendEnd>=0?timing.sendEnd:0;result.send=sendEnd-sendStart;if(result.send<0){result.send=0;}
highestTime=Math.max(sendEnd,connectEnd,sslEnd,dnsEnd,blockedStart,0);}else if(this._request.responseReceivedTime===-1){result.blocked=this._request.endTime-issueTime;return result;}
const requestTime=timing?timing.requestTime:startTime;const waitStart=highestTime;const waitEnd=Entry._toMilliseconds(this._request.responseReceivedTime-requestTime);result.wait=waitEnd-waitStart;const receiveStart=waitEnd;const receiveEnd=Entry._toMilliseconds(this._request.endTime-requestTime);result.receive=Math.max(receiveEnd-receiveStart,0);return result;function leastNonNegative(values){return values.reduce((best,value)=>(value>=0&&value<best)?value:best,Infinity);}}
async _buildPostData(){const postData=await this._request.requestFormData();if(!postData){return null;}
const res={mimeType:this._request.requestContentType()||'',text:postData};const formParameters=await this._request.formParameters();if(formParameters){res.params=this._buildParameters(formParameters);}
return res;}
_buildParameters(parameters){return parameters.slice();}
_buildRequestURL(url){return url.split('#',2)[0];}
_buildCookies(cookies){return cookies.map(this._buildCookie.bind(this));}
_buildCookie(cookie){const c={name:cookie.name(),value:cookie.value(),path:cookie.path(),domain:cookie.domain(),expires:cookie.expiresDate(HARLog.pseudoWallTime(this._request,this._request.startTime)),httpOnly:cookie.httpOnly(),secure:cookie.secure()};if(cookie.sameSite()){c.sameSite=cookie.sameSite();}
return c;}
async _requestBodySize(){const postData=await this._request.requestFormData();if(!postData){return 0;}
return new TextEncoder('utf-8').encode(postData).length;}
get responseBodySize(){if(this._request.cached()||this._request.statusCode===304){return 0;}
if(!this._request.responseHeadersText){return-1;}
return this._request.transferSize-this._request.responseHeadersText.length;}
get responseCompression(){if(this._request.cached()||this._request.statusCode===304||this._request.statusCode===206){return;}
if(!this._request.responseHeadersText){return;}
return this._request.resourceSize-this.responseBodySize;}}
let Timing;var HARLog$1=Object.freeze({__proto__:null,HARLog:HARLog,Entry:Entry,Timing:Timing});class IsolateManager extends ObjectWrapper.ObjectWrapper{constructor(){super();console.assert(!self.SDK.isolateManager,'Use self.SDK.isolateManager singleton.');this._isolates=new Map();this._isolateIdByModel=new Map();this._observers=new Set();TargetManager.instance().observeModels(RuntimeModel,this);this._pollId=0;}
observeIsolates(observer){if(this._observers.has(observer)){throw new Error('Observer can only be registered once');}
if(!this._observers.size){this._poll();}
this._observers.add(observer);for(const isolate of this._isolates.values()){observer.isolateAdded(isolate);}}
unobserveIsolates(observer){this._observers.delete(observer);if(!this._observers.size){++this._pollId;}}
modelAdded(model){this._modelAdded(model);}
async _modelAdded(model){this._isolateIdByModel.set(model,null);const isolateId=await model.isolateId();if(!this._isolateIdByModel.has(model)){return;}
if(!isolateId){this._isolateIdByModel.delete(model);return;}
this._isolateIdByModel.set(model,isolateId);let isolate=this._isolates.get(isolateId);if(!isolate){isolate=new Isolate(isolateId);this._isolates.set(isolateId,isolate);}
isolate._models.add(model);if(isolate._models.size===1){for(const observer of this._observers){observer.isolateAdded(isolate);}}else{for(const observer of this._observers){observer.isolateChanged(isolate);}}}
modelRemoved(model){const isolateId=this._isolateIdByModel.get(model);this._isolateIdByModel.delete(model);if(!isolateId){return;}
const isolate=this._isolates.get(isolateId);isolate._models.delete(model);if(isolate._models.size){for(const observer of this._observers){observer.isolateChanged(isolate);}
return;}
for(const observer of this._observers){observer.isolateRemoved(isolate);}
this._isolates.delete(isolateId);}
isolateByModel(model){return this._isolates.get(this._isolateIdByModel.get(model)||'')||null;}
isolates(){return this._isolates.values();}
async _poll(){const pollId=this._pollId;while(pollId===this._pollId){await Promise.all(Array.from(this.isolates(),isolate=>isolate._update()));await new Promise(r=>setTimeout(r,PollIntervalMs));}}}
class Observer$1{isolateAdded(isolate){}
isolateRemoved(isolate){}
isolateChanged(isolate){}}
const Events$h={MemoryChanged:Symbol('MemoryChanged')};const MemoryTrendWindowMs=120e3;const PollIntervalMs=2e3;class Isolate{constructor(id){this._id=id;this._models=new Set();this._usedHeapSize=0;const count=MemoryTrendWindowMs/PollIntervalMs;this._memoryTrend=new MemoryTrend(count);}
id(){return this._id;}
models(){return this._models;}
runtimeModel(){return this._models.values().next().value||null;}
heapProfilerModel(){const runtimeModel=this.runtimeModel();return runtimeModel&&runtimeModel.heapProfilerModel();}
async _update(){const model=this.runtimeModel();const usage=model&&await model.heapUsage();if(!usage){return;}
this._usedHeapSize=usage.usedSize;this._memoryTrend.add(this._usedHeapSize);self.SDK.isolateManager.dispatchEventToListeners(Events$h.MemoryChanged,this);}
samplesCount(){return this._memoryTrend.count();}
usedHeapSize(){return this._usedHeapSize;}
usedHeapSizeGrowRate(){return this._memoryTrend.fitSlope();}
isMainThread(){return this.runtimeModel().target().id()==='main';}}
class MemoryTrend{constructor(maxCount){this._maxCount=maxCount|0;this.reset();}
reset(){this._base=Date.now();this._index=0;this._x=[];this._y=[];this._sx=0;this._sy=0;this._sxx=0;this._sxy=0;}
count(){return this._x.length;}
add(heapSize,timestamp){const x=typeof timestamp==='number'?timestamp:Date.now()-this._base;const y=heapSize;if(this._x.length===this._maxCount){const x0=this._x[this._index];const y0=this._y[this._index];this._sx-=x0;this._sy-=y0;this._sxx-=x0*x0;this._sxy-=x0*y0;}
this._sx+=x;this._sy+=y;this._sxx+=x*x;this._sxy+=x*y;this._x[this._index]=x;this._y[this._index]=y;this._index=(this._index+1)%this._maxCount;}
fitSlope(){const n=this.count();return n<2?0:(this._sxy-this._sx*this._sy/n)/(this._sxx-this._sx*this._sx/n);}}
var IsolateManager$1=Object.freeze({__proto__:null,IsolateManager:IsolateManager,Observer:Observer$1,Events:Events$h,MemoryTrendWindowMs:MemoryTrendWindowMs,Isolate:Isolate,MemoryTrend:MemoryTrend});const connectedIssueSymbol=Symbol('issue');const IssueCategory={CrossOriginEmbedderPolicy:Symbol('CrossOriginEmbedderPolicy'),SameSiteCookie:Symbol('SameSiteCookie'),Other:Symbol('Other')};function connect(obj,category,issue){if(!obj){return;}
if(!obj[connectedIssueSymbol]){obj[connectedIssueSymbol]=new Map();}
const map=obj[connectedIssueSymbol];if(!map.has(category)){map.set(category,new Set());}
const set=map.get(category);set.add(issue);}
function disconnect(obj,category,issue){if(!obj||!obj[connectedIssueSymbol]){return;}
const map=obj[connectedIssueSymbol];if(!map.has(category)){return;}
const set=map.get(category);set.delete(issue);}
function hasIssues(obj){if(!obj||!obj[connectedIssueSymbol]){return false;}
const map=obj[connectedIssueSymbol];if(map.size===0){return false;}
for(const set of map.values()){if(set.size>0){return true;}}
return false;}
function hasIssueOfCategory(obj,category){if(!obj||!obj[connectedIssueSymbol]){return false;}
const map=obj[connectedIssueSymbol];if(!map.has(category)){return false;}
const set=map.get(category);return set.size>0;}
async function reveal(obj,category){if(!obj||!obj[connectedIssueSymbol]){return;}
const map=obj[connectedIssueSymbol];if(!map.has(category)){return;}
const set=map.get(category);if(set.size===0){return;}
return Revealer.reveal(set.values().next().value);}
var RelatedIssue=Object.freeze({__proto__:null,IssueCategory:IssueCategory,connect:connect,disconnect:disconnect,hasIssues:hasIssues,hasIssueOfCategory:hasIssueOfCategory,reveal:reveal});class Issue extends ObjectWrapper.ObjectWrapper{constructor(code,resources){super();this._code=code;this._resources=resources;}
code(){return this._code;}
resources(){return this._resources;}
isAssociatedWithRequestId(requestId){if(!this._resources){return false;}
if(this._resources.requests){for(const request of this._resources.requests){if(request.requestId===requestId){return true;}}}
return false;}
getCategory(){const code=this.code();if(code==='SameSiteCookieIssue'){return IssueCategory.SameSiteCookie;}
if(code.startsWith('CrossOriginEmbedderPolicy')){return IssueCategory.CrossOriginEmbedderPolicy;}
return IssueCategory.Other;}}
class AggregatedIssue extends ObjectWrapper.ObjectWrapper{constructor(code){super();this._code=code;this._resources=[];this._cookies=new Map();this._requests=new Map();}
code(){return this._code;}
cookies(){return this._cookies.values();}
requests(){return this._requests.values();}
addInstance(issue){const resources=issue.resources();if(!resources){return;}
if(resources.cookies){for(const cookie of resources.cookies){const key=JSON.stringify(cookie);if(!this._cookies.has(key)){this._cookies.set(key,cookie);}}}
if(resources.requests){for(const request of resources.requests){this._requests.set(request.requestId,request.request);}}}}
var Issue$1=Object.freeze({__proto__:null,Issue:Issue,AggregatedIssue:AggregatedIssue});class NetworkIssueDetector{constructor(target,issuesModel){this._issuesModel=issuesModel;this._networkManager=target.model(NetworkManager);if(this._networkManager){this._networkManager.addEventListener(Events$1.RequestFinished,this._handleRequestFinished,this);}
for(const request of self.SDK.networkLog.requests()){this._handleRequestFinished({data:request});}}
_handleRequestFinished(event){const request=(event.data);const blockedReason=getCoepBlockedReason(request);if(blockedReason){const resources={requests:[{requestId:request.requestId()}]};const code=`CrossOriginEmbedderPolicy::${this._toCamelCase(blockedReason)}`;this._issuesModel.issueAdded({code,resources});}
function getCoepBlockedReason(request){if(!request.wasBlocked()){return null;}
const blockedReason=request.blockedReason()||null;if(blockedReason===Protocol.Network.BlockedReason.CoepFrameResourceNeedsCoepHeader||blockedReason===Protocol.Network.BlockedReason.CorpNotSameOriginAfterDefaultedToSameOriginByCoep||blockedReason===Protocol.Network.BlockedReason.CoopSandboxedIframeCannotNavigateToCoopPage||blockedReason===Protocol.Network.BlockedReason.CorpNotSameSite||blockedReason===Protocol.Network.BlockedReason.CorpNotSameOrigin){return blockedReason;}
return null;}}
detach(){if(this._networkManager){this._networkManager.removeEventListener(Events$1.RequestFinished,this._handleRequestFinished,this);}}
_toCamelCase(string){const result=string.replace(/-\p{ASCII}/gu,match=>match.substr(1).toUpperCase());return result.replace(/^./,match=>match.toUpperCase());}}
class IssuesModel extends SDKModel{constructor(target){super(target);this._enabled=false;this._issues=[];this._aggregatedIssuesByCode=new Map();this._cookiesModel=target.model(CookieModel);this._auditsAgent=null;this._hasSeenMainFrameNavigated=false;this._networkManager=target.model(NetworkManager);const resourceTreeModel=(target.model(ResourceTreeModel));if(resourceTreeModel){resourceTreeModel.addEventListener(Events$8.MainFrameNavigated,this._onMainFrameNavigated,this);}
this._networkIssueDetector=null;this.ensureEnabled();}
_onMainFrameNavigated(event){const mainFrame=(event.data);const keptIssues=[];for(const issue of this._issues){if(issue.isAssociatedWithRequestId(mainFrame.loaderId)){keptIssues.push(issue);}else{this._disconnectIssue(issue);}}
this._issues=keptIssues;this._aggregatedIssuesByCode.clear();for(const issue of this._issues){this._aggregateIssue(issue);}
this._hasSeenMainFrameNavigated=true;this.dispatchEventToListeners(Events$i.FullUpdateRequired);}
reloadForAccurateInformationRequired(){return!this._hasSeenMainFrameNavigated;}
ensureEnabled(){if(this._enabled){return;}
this._enabled=true;this.target().registerAuditsDispatcher(this);this._auditsAgent=this.target().auditsAgent();this._auditsAgent.enable();this._networkIssueDetector=new NetworkIssueDetector(this.target(),this);}
_aggregateIssue(issue){if(!this._aggregatedIssuesByCode.has(issue.code())){this._aggregatedIssuesByCode.set(issue.code(),new AggregatedIssue(issue.code()));}
const aggregatedIssue=this._aggregatedIssuesByCode.get(issue.code());aggregatedIssue.addInstance(issue);this.dispatchEventToListeners(Events$i.AggregatedIssueUpdated,aggregatedIssue);return aggregatedIssue;}
issueAdded(inspectorIssue){const issues=this._createIssuesFromProtocolIssue(inspectorIssue);this._issues.push(...issues);for(const issue of issues){this._connectIssue(issue);this._aggregateIssue(issue);}}
_createIssuesFromProtocolIssue(inspectorIssue){const handler=issueCodeHandlers.get(inspectorIssue.code);if(handler){return handler(this,inspectorIssue);}
return[new Issue(inspectorIssue.code,inspectorIssue.resources)];}
_connectIssue(issue){const resources=issue.resources();if(!resources){return;}
if(resources.requests){for(const resourceRequest of resources.requests){const request=(self.SDK.networkLog.requests().find(r=>r.requestId()===resourceRequest.requestId));if(request){connect(request,issue.getCategory(),issue);resourceRequest.request=request;}}}}
_disconnectIssue(issue){const resources=issue.resources();if(!resources){return;}
if(resources.requests){for(const resourceRequest of resources.requests){const request=(self.SDK.networkLog.requests().find(r=>r.requestId()===resourceRequest.requestId));if(request){disconnect(request,issue.getCategory(),issue);}}}}
aggregatedIssues(){return this._aggregatedIssuesByCode.values();}
numberOfAggregatedIssues(){return this._aggregatedIssuesByCode.size;}}
const issueCodeHandlers=new Map([]);const Events$i={AggregatedIssueUpdated:Symbol('AggregatedIssueUpdated'),FullUpdateRequired:Symbol('FullUpdateRequired'),};SDKModel.register(IssuesModel,Capability.Audits,true);var IssuesModel$1=Object.freeze({__proto__:null,NetworkIssueDetector:NetworkIssueDetector,IssuesModel:IssuesModel,Events:Events$i});class PaintProfilerModel extends SDKModel{constructor(target){super(target);this._layerTreeAgent=target.layerTreeAgent();}
async loadSnapshotFromFragments(fragments){const snapshotId=await this._layerTreeAgent.loadSnapshot(fragments);return snapshotId&&new PaintProfilerSnapshot(this,snapshotId);}
loadSnapshot(encodedPicture){const fragment={x:0,y:0,picture:encodedPicture};return this.loadSnapshotFromFragments([fragment]);}
async makeSnapshot(layerId){const snapshotId=await this._layerTreeAgent.makeSnapshot(layerId);return snapshotId&&new PaintProfilerSnapshot(this,snapshotId);}}
class PaintProfilerSnapshot{constructor(paintProfilerModel,snapshotId){this._paintProfilerModel=paintProfilerModel;this._id=snapshotId;this._refCount=1;}
release(){console.assert(this._refCount>0,'release is already called on the object');if(!--this._refCount){this._paintProfilerModel._layerTreeAgent.releaseSnapshot(this._id);}}
addReference(){++this._refCount;console.assert(this._refCount>0,'Referencing a dead object');}
replay(scale,firstStep,lastStep){return this._paintProfilerModel._layerTreeAgent.replaySnapshot(this._id,firstStep,lastStep,scale||1.0);}
profile(clipRect){return this._paintProfilerModel._layerTreeAgent.profileSnapshot(this._id,5,1,clipRect||undefined);}
async commandLog(){const log=await this._paintProfilerModel._layerTreeAgent.snapshotCommandLog(this._id);return log&&log.map((entry,index)=>new PaintProfilerLogItem((entry),index));}}
class PaintProfilerLogItem{constructor(rawEntry,commandIndex){this.method=rawEntry.method;this.params=rawEntry.params;this.commandIndex=commandIndex;}}
SDKModel.register(PaintProfilerModel,Capability.DOM,false);let SnapshotWithRect;let PictureFragment;let RawPaintProfilerLogItem;var PaintProfiler=Object.freeze({__proto__:null,PaintProfilerModel:PaintProfilerModel,PaintProfilerSnapshot:PaintProfilerSnapshot,PaintProfilerLogItem:PaintProfilerLogItem,SnapshotWithRect:SnapshotWithRect,PictureFragment:PictureFragment,RawPaintProfilerLogItem:RawPaintProfilerLogItem});class Layer{id(){}
parentId(){}
parent(){}
isRoot(){}
children(){}
addChild(child){}
node(){}
nodeForSelfOrAncestor(){}
offsetX(){}
offsetY(){}
width(){}
height(){}
transform(){}
quad(){}
anchorPoint(){}
invisible(){}
paintCount(){}
lastPaintRect(){}
scrollRects(){}
stickyPositionConstraint(){}
gpuMemoryUsage(){}
requestCompositingReasonIds(){}
drawsContent(){}
snapshots(){}}
Layer.ScrollRectType={NonFastScrollable:'NonFastScrollable',TouchEventHandler:'TouchEventHandler',WheelEventHandler:'WheelEventHandler',RepaintsOnScroll:'RepaintsOnScroll',MainThreadScrollingReason:'MainThreadScrollingReason'};class StickyPositionConstraint{constructor(layerTree,constraint){this._stickyBoxRect=constraint.stickyBoxRect;this._containingBlockRect=constraint.containingBlockRect;this._nearestLayerShiftingStickyBox=null;if(layerTree&&constraint.nearestLayerShiftingStickyBox){this._nearestLayerShiftingStickyBox=layerTree.layerById(constraint.nearestLayerShiftingStickyBox);}
this._nearestLayerShiftingContainingBlock=null;if(layerTree&&constraint.nearestLayerShiftingContainingBlock){this._nearestLayerShiftingContainingBlock=layerTree.layerById(constraint.nearestLayerShiftingContainingBlock);}}
stickyBoxRect(){return this._stickyBoxRect;}
containingBlockRect(){return this._containingBlockRect;}
nearestLayerShiftingStickyBox(){return this._nearestLayerShiftingStickyBox;}
nearestLayerShiftingContainingBlock(){return this._nearestLayerShiftingContainingBlock;}}
class LayerTreeBase{constructor(target){this._target=target;this._domModel=target?target.model(DOMModel):null;this._layersById={};this._root=null;this._contentRoot=null;this._backendNodeIdToNode=new Map();}
target(){return this._target;}
root(){return this._root;}
setRoot(root){this._root=root;}
contentRoot(){return this._contentRoot;}
setContentRoot(contentRoot){this._contentRoot=contentRoot;}
forEachLayer(callback,root){if(!root){root=this.root();if(!root){return false;}}
return callback(root)||root.children().some(this.forEachLayer.bind(this,callback));}
layerById(id){return this._layersById[id]||null;}
async resolveBackendNodeIds(requestedNodeIds){if(!requestedNodeIds.size||!this._domModel){return;}
const nodesMap=await this._domModel.pushNodesByBackendIdsToFrontend(requestedNodeIds);if(!nodesMap){return;}
for(const nodeId of nodesMap.keys()){this._backendNodeIdToNode.set(nodeId,nodesMap.get(nodeId)||null);}}
backendNodeIdToNode(){return this._backendNodeIdToNode;}
setViewportSize(viewportSize){this._viewportSize=viewportSize;}
viewportSize(){return this._viewportSize;}
_nodeForId(id){return this._domModel?this._domModel.nodeForId(id):null;}}
var LayerTreeBase$1=Object.freeze({__proto__:null,Layer:Layer,StickyPositionConstraint:StickyPositionConstraint,LayerTreeBase:LayerTreeBase});class PerformanceMetricsModel extends SDKModel{constructor(target){super(target);this._agent=target.performanceAgent();const mode=MetricMode;this._metricModes=new Map([['TaskDuration',mode.CumulativeTime],['ScriptDuration',mode.CumulativeTime],['LayoutDuration',mode.CumulativeTime],['RecalcStyleDuration',mode.CumulativeTime],['LayoutCount',mode.CumulativeCount],['RecalcStyleCount',mode.CumulativeCount]]);this._metricData=new Map();}
enable(){return this._agent.enable();}
disable(){return this._agent.disable();}
async requestMetrics(){const rawMetrics=await this._agent.getMetrics()||[];const metrics=new Map();const timestamp=performance.now();for(const metric of rawMetrics){let data=this._metricData.get(metric.name);if(!data){data={};this._metricData.set(metric.name,data);}
let value;switch(this._metricModes.get(metric.name)){case MetricMode.CumulativeTime:value=data.lastTimestamp?NumberUtilities.clamp((metric.value-data.lastValue)*1000/(timestamp-data.lastTimestamp),0,1):0;data.lastValue=metric.value;data.lastTimestamp=timestamp;break;case MetricMode.CumulativeCount:value=data.lastTimestamp?Math.max(0,(metric.value-data.lastValue)*1000/(timestamp-data.lastTimestamp)):0;data.lastValue=metric.value;data.lastTimestamp=timestamp;break;default:value=metric.value;break;}
metrics.set(metric.name,value);}
return{metrics:metrics,timestamp:timestamp};}}
const MetricMode={CumulativeTime:Symbol('CumulativeTime'),CumulativeCount:Symbol('CumulativeCount'),};SDKModel.register(PerformanceMetricsModel,Capability.DOM,false);var PerformanceMetricsModel$1=Object.freeze({__proto__:null,PerformanceMetricsModel:PerformanceMetricsModel});class ScreenCaptureModel extends SDKModel{constructor(target){super(target);this._agent=target.pageAgent();this._onScreencastFrame=null;this._onScreencastVisibilityChanged=null;target.registerPageDispatcher(this);}
startScreencast(format,quality,width,height,everyNthFrame,onFrame,onVisibilityChanged){this._onScreencastFrame=onFrame;this._onScreencastVisibilityChanged=onVisibilityChanged;this._agent.startScreencast(format,quality,width,height,everyNthFrame);}
stopScreencast(){this._onScreencastFrame=null;this._onScreencastVisibilityChanged=null;this._agent.stopScreencast();}
async captureScreenshot(format,quality,clip){await OverlayModel.muteHighlight();const result=await this._agent.captureScreenshot(format,quality,clip,true);await OverlayModel.unmuteHighlight();return result;}
async fetchLayoutMetrics(){const response=await this._agent.invoke_getLayoutMetrics({});if(response[InspectorBackend.ProtocolError]){return null;}
return{viewportX:response.visualViewport.pageX,viewportY:response.visualViewport.pageY,viewportScale:response.visualViewport.scale,contentWidth:response.contentSize.width,contentHeight:response.contentSize.height};}
screencastFrame(data,metadata,sessionId){this._agent.screencastFrameAck(sessionId);if(this._onScreencastFrame){this._onScreencastFrame.call(null,data,metadata);}}
screencastVisibilityChanged(visible){if(this._onScreencastVisibilityChanged){this._onScreencastVisibilityChanged.call(null,visible);}}
domContentEventFired(time){}
loadEventFired(time){}
lifecycleEvent(frameId,loaderId,name,time){}
navigatedWithinDocument(frameId,url){}
frameAttached(frameId,parentFrameId){}
frameNavigated(frame){}
frameDetached(frameId){}
frameStartedLoading(frameId){}
frameStoppedLoading(frameId){}
frameRequestedNavigation(frameId){}
frameScheduledNavigation(frameId,delay){}
frameClearedScheduledNavigation(frameId){}
frameResized(){}
javascriptDialogOpening(url,message,dialogType,hasBrowserHandler,prompt){}
javascriptDialogClosed(result,userInput){}
interstitialShown(){}
interstitialHidden(){}
windowOpen(url,windowName,windowFeatures,userGesture){}
fileChooserOpened(mode){}
compilationCacheProduced(url,data){}
downloadWillBegin(frameId,url){}}
SDKModel.register(ScreenCaptureModel,Capability.ScreenCapture,false);var ScreenCaptureModel$1=Object.freeze({__proto__:null,ScreenCaptureModel:ScreenCaptureModel});class ServiceWorkerCacheModel extends SDKModel{constructor(target){super(target);target.registerStorageDispatcher(this);this._caches=new Map();this._cacheAgent=target.cacheStorageAgent();this._storageAgent=target.storageAgent();this._securityOriginManager=target.model(SecurityOriginManager);this._originsUpdated=new Set();this._throttler=new Throttler.Throttler(2000);this._enabled=false;}
enable(){if(this._enabled){return;}
this._securityOriginManager.addEventListener(Events$7.SecurityOriginAdded,this._securityOriginAdded,this);this._securityOriginManager.addEventListener(Events$7.SecurityOriginRemoved,this._securityOriginRemoved,this);for(const securityOrigin of this._securityOriginManager.securityOrigins()){this._addOrigin(securityOrigin);}
this._enabled=true;}
clearForOrigin(origin){this._removeOrigin(origin);this._addOrigin(origin);}
refreshCacheNames(){for(const cache of this._caches.values()){this._cacheRemoved(cache);}
this._caches.clear();const securityOrigins=this._securityOriginManager.securityOrigins();for(const securityOrigin of securityOrigins){this._loadCacheNames(securityOrigin);}}
async deleteCache(cache){const response=await this._cacheAgent.invoke_deleteCache({cacheId:cache.cacheId});if(response[InspectorBackend.ProtocolError]){console.error(`ServiceWorkerCacheAgent error deleting cache ${cache.toString()}: ${
          response[InspectorBackend.ProtocolError]}`);return;}
this._caches.delete(cache.cacheId);this._cacheRemoved(cache);}
async deleteCacheEntry(cache,request){const response=await this._cacheAgent.invoke_deleteEntry({cacheId:cache.cacheId,request});if(!response[InspectorBackend.ProtocolError]){return;}
Console.Console.instance().error(UIString.UIString('ServiceWorkerCacheAgent error deleting cache entry %s in cache: %s',cache.toString(),response[InspectorBackend.ProtocolError]));}
loadCacheData(cache,skipCount,pageSize,pathFilter,callback){this._requestEntries(cache,skipCount,pageSize,pathFilter,callback);}
loadAllCacheData(cache,pathFilter,callback){this._requestAllEntries(cache,pathFilter,callback);}
caches(){const caches=new Array();for(const cache of this._caches.values()){caches.push(cache);}
return caches;}
dispose(){for(const cache of this._caches.values()){this._cacheRemoved(cache);}
this._caches.clear();if(this._enabled){this._securityOriginManager.removeEventListener(Events$7.SecurityOriginAdded,this._securityOriginAdded,this);this._securityOriginManager.removeEventListener(Events$7.SecurityOriginRemoved,this._securityOriginRemoved,this);}}
_addOrigin(securityOrigin){this._loadCacheNames(securityOrigin);if(this._isValidSecurityOrigin(securityOrigin)){this._storageAgent.trackCacheStorageForOrigin(securityOrigin);}}
_removeOrigin(securityOrigin){for(const opaqueId of this._caches.keys()){const cache=this._caches.get(opaqueId);if(cache.securityOrigin===securityOrigin){this._caches.delete(opaqueId);this._cacheRemoved(cache);}}
if(this._isValidSecurityOrigin(securityOrigin)){this._storageAgent.untrackCacheStorageForOrigin(securityOrigin);}}
_isValidSecurityOrigin(securityOrigin){const parsedURL=ParsedURL.ParsedURL.fromString(securityOrigin);return!!parsedURL&&parsedURL.scheme.startsWith('http');}
async _loadCacheNames(securityOrigin){const caches=await this._cacheAgent.requestCacheNames(securityOrigin);if(!caches){return;}
this._updateCacheNames(securityOrigin,caches);}
_updateCacheNames(securityOrigin,cachesJson){function deleteAndSaveOldCaches(cache){if(cache.securityOrigin===securityOrigin&&!updatingCachesIds.has(cache.cacheId)){oldCaches.set(cache.cacheId,cache);this._caches.delete(cache.cacheId);}}
const updatingCachesIds=new Set();const newCaches=new Map();const oldCaches=new Map();for(const cacheJson of cachesJson){const cache=new Cache(this,cacheJson.securityOrigin,cacheJson.cacheName,cacheJson.cacheId);updatingCachesIds.add(cache.cacheId);if(this._caches.has(cache.cacheId)){continue;}
newCaches.set(cache.cacheId,cache);this._caches.set(cache.cacheId,cache);}
this._caches.forEach(deleteAndSaveOldCaches,this);newCaches.forEach(this._cacheAdded,this);oldCaches.forEach(this._cacheRemoved,this);}
_securityOriginAdded(event){const securityOrigin=(event.data);this._addOrigin(securityOrigin);}
_securityOriginRemoved(event){const securityOrigin=(event.data);this._removeOrigin(securityOrigin);}
_cacheAdded(cache){this.dispatchEventToListeners(Events$j.CacheAdded,{model:this,cache:cache});}
_cacheRemoved(cache){this.dispatchEventToListeners(Events$j.CacheRemoved,{model:this,cache:cache});}
async _requestEntries(cache,skipCount,pageSize,pathFilter,callback){const response=await this._cacheAgent.invoke_requestEntries({cacheId:cache.cacheId,skipCount,pageSize,pathFilter});if(response[InspectorBackend.ProtocolError]){console.error('ServiceWorkerCacheAgent error while requesting entries: ',response[InspectorBackend.ProtocolError]);return;}
callback(response.cacheDataEntries,response.returnCount);}
async _requestAllEntries(cache,pathFilter,callback){const response=await this._cacheAgent.invoke_requestEntries({cacheId:cache.cacheId,pathFilter});if(response[InspectorBackend.ProtocolError]){console.error('ServiceWorkerCacheAgent error while requesting entries: ',response[InspectorBackend.ProtocolError]);return;}
callback(response.cacheDataEntries,response.returnCount);}
cacheStorageListUpdated(origin){this._originsUpdated.add(origin);this._throttler.schedule(()=>{const promises=Array.from(this._originsUpdated,origin=>this._loadCacheNames(origin));this._originsUpdated.clear();return Promise.all(promises);});}
cacheStorageContentUpdated(origin,cacheName){this.dispatchEventToListeners(Events$j.CacheStorageContentUpdated,{origin:origin,cacheName:cacheName});}
indexedDBListUpdated(origin){}
indexedDBContentUpdated(origin,databaseName,objectStoreName){}}
const Events$j={CacheAdded:Symbol('CacheAdded'),CacheRemoved:Symbol('CacheRemoved'),CacheStorageContentUpdated:Symbol('CacheStorageContentUpdated')};class Cache{constructor(model,securityOrigin,cacheName,cacheId){this._model=model;this.securityOrigin=securityOrigin;this.cacheName=cacheName;this.cacheId=cacheId;}
equals(cache){return this.cacheId===cache.cacheId;}
toString(){return this.securityOrigin+this.cacheName;}
requestCachedResponse(url,requestHeaders){return this._model._cacheAgent.requestCachedResponse(this.cacheId,url,requestHeaders);}}
SDKModel.register(ServiceWorkerCacheModel,Capability.Storage,false);var ServiceWorkerCacheModel$1=Object.freeze({__proto__:null,ServiceWorkerCacheModel:ServiceWorkerCacheModel,Events:Events$j,Cache:Cache});class ServiceWorkerManager extends SDKModel{constructor(target){super(target);target.registerServiceWorkerDispatcher(new ServiceWorkerDispatcher(this));this._lastAnonymousTargetId=0;this._agent=target.serviceWorkerAgent();this._registrations=new Map();this.enable();this._forceUpdateSetting=Settings.Settings.instance().createSetting('serviceWorkerUpdateOnReload',false);if(this._forceUpdateSetting.get()){this._forceUpdateSettingChanged();}
this._forceUpdateSetting.addChangeListener(this._forceUpdateSettingChanged,this);new ServiceWorkerContextNamer(target,this);}
enable(){if(this._enabled){return;}
this._enabled=true;this._agent.enable();}
disable(){if(!this._enabled){return;}
this._enabled=false;this._registrations.clear();this._agent.disable();}
registrations(){return this._registrations;}
hasRegistrationForURLs(urls){for(const registration of this._registrations.values()){if(urls.filter(url=>url&&url.startsWith(registration.scopeURL)).length===urls.length){return true;}}
return false;}
findVersion(versionId){for(const registration of this.registrations().values()){const version=registration.versions.get(versionId);if(version){return version;}}
return null;}
deleteRegistration(registrationId){const registration=this._registrations.get(registrationId);if(!registration){return;}
if(registration._isRedundant()){this._registrations.delete(registrationId);this.dispatchEventToListeners(Events$k.RegistrationDeleted,registration);return;}
registration._deleting=true;for(const version of registration.versions.values()){this.stopWorker(version.id);}
this._unregister(registration.scopeURL);}
updateRegistration(registrationId){const registration=this._registrations.get(registrationId);if(!registration){return;}
this._agent.updateRegistration(registration.scopeURL);}
deliverPushMessage(registrationId,data){const registration=this._registrations.get(registrationId);if(!registration){return;}
const origin=ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);this._agent.deliverPushMessage(origin,registrationId,data);}
dispatchSyncEvent(registrationId,tag,lastChance){const registration=this._registrations.get(registrationId);if(!registration){return;}
const origin=ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);this._agent.dispatchSyncEvent(origin,registrationId,tag,lastChance);}
dispatchPeriodicSyncEvent(registrationId,tag){const registration=this._registrations.get(registrationId);if(!registration){return;}
const origin=ParsedURL.ParsedURL.extractOrigin(registration.scopeURL);this._agent.dispatchPeriodicSyncEvent(origin,registrationId,tag);}
_unregister(scope){this._agent.unregister(scope);}
startWorker(scope){this._agent.startWorker(scope);}
skipWaiting(scope){this._agent.skipWaiting(scope);}
stopWorker(versionId){this._agent.stopWorker(versionId);}
inspectWorker(versionId){this._agent.inspectWorker(versionId);}
_workerRegistrationUpdated(registrations){for(const payload of registrations){let registration=this._registrations.get(payload.registrationId);if(!registration){registration=new ServiceWorkerRegistration(payload);this._registrations.set(payload.registrationId,registration);this.dispatchEventToListeners(Events$k.RegistrationUpdated,registration);continue;}
registration._update(payload);if(registration._shouldBeRemoved()){this._registrations.delete(registration.id);this.dispatchEventToListeners(Events$k.RegistrationDeleted,registration);}else{this.dispatchEventToListeners(Events$k.RegistrationUpdated,registration);}}}
_workerVersionUpdated(versions){const registrations=new Set();for(const payload of versions){const registration=this._registrations.get(payload.registrationId);if(!registration){continue;}
registration._updateVersion(payload);registrations.add(registration);}
for(const registration of registrations){if(registration._shouldBeRemoved()){this._registrations.delete(registration.id);this.dispatchEventToListeners(Events$k.RegistrationDeleted,registration);}else{this.dispatchEventToListeners(Events$k.RegistrationUpdated,registration);}}}
_workerErrorReported(payload){const registration=this._registrations.get(payload.registrationId);if(!registration){return;}
registration.errors.push(payload);this.dispatchEventToListeners(Events$k.RegistrationErrorAdded,{registration:registration,error:payload});}
forceUpdateOnReloadSetting(){return this._forceUpdateSetting;}
_forceUpdateSettingChanged(){this._agent.setForceUpdateOnPageLoad(this._forceUpdateSetting.get());}}
const Events$k={RegistrationUpdated:Symbol('RegistrationUpdated'),RegistrationErrorAdded:Symbol('RegistrationErrorAdded'),RegistrationDeleted:Symbol('RegistrationDeleted')};class ServiceWorkerDispatcher{constructor(manager){this._manager=manager;}
workerRegistrationUpdated(registrations){this._manager._workerRegistrationUpdated(registrations);}
workerVersionUpdated(versions){this._manager._workerVersionUpdated(versions);}
workerErrorReported(errorMessage){this._manager._workerErrorReported(errorMessage);}}
class ServiceWorkerVersion{constructor(registration,payload){this.registration=registration;this._update(payload);}
_update(payload){this.id=payload.versionId;this.scriptURL=payload.scriptURL;const parsedURL=new ParsedURL.ParsedURL(payload.scriptURL);this.securityOrigin=parsedURL.securityOrigin();this.runningStatus=payload.runningStatus;this.status=payload.status;this.scriptLastModified=payload.scriptLastModified;this.scriptResponseTime=payload.scriptResponseTime;this.controlledClients=[];for(let i=0;i<payload.controlledClients.length;++i){this.controlledClients.push(payload.controlledClients[i]);}
this.targetId=payload.targetId||null;}
isStartable(){return!this.registration.isDeleted&&this.isActivated()&&this.isStopped();}
isStoppedAndRedundant(){return this.runningStatus===Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped&&this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant;}
isStopped(){return this.runningStatus===Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped;}
isStarting(){return this.runningStatus===Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting;}
isRunning(){return this.runningStatus===Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running;}
isStopping(){return this.runningStatus===Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopping;}
isNew(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.New;}
isInstalling(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing;}
isInstalled(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed;}
isActivating(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating;}
isActivated(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated;}
isRedundant(){return this.status===Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant;}
mode(){if(this.isNew()||this.isInstalling()){return ServiceWorkerVersion.Modes.Installing;}
if(this.isInstalled()){return ServiceWorkerVersion.Modes.Waiting;}
if(this.isActivating()||this.isActivated()){return ServiceWorkerVersion.Modes.Active;}
return ServiceWorkerVersion.Modes.Redundant;}}
ServiceWorkerVersion.RunningStatus={[Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Running]:ls`running`,[Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Starting]:ls`starting`,[Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopped]:ls`stopped`,[Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus.Stopping]:ls`stopping`,};ServiceWorkerVersion.Status={[Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated]:ls`activated`,[Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating]:ls`activating`,[Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed]:ls`installed`,[Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing]:ls`installing`,[Protocol.ServiceWorker.ServiceWorkerVersionStatus.New]:ls`new`,[Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant]:ls`redundant`,};ServiceWorkerVersion.Modes={Installing:'installing',Waiting:'waiting',Active:'active',Redundant:'redundant'};class ServiceWorkerRegistration{constructor(payload){this._update(payload);this.versions=new Map();this._deleting=false;this.errors=[];}
_update(payload){this._fingerprint=Symbol('fingerprint');this.id=payload.registrationId;this.scopeURL=payload.scopeURL;const parsedURL=new ParsedURL.ParsedURL(payload.scopeURL);this.securityOrigin=parsedURL.securityOrigin();this.isDeleted=payload.isDeleted;this.forceUpdateOnPageLoad=payload.forceUpdateOnPageLoad;}
fingerprint(){return this._fingerprint;}
versionsByMode(){const result=new Map();for(const version of this.versions.values()){result.set(version.mode(),version);}
return result;}
_updateVersion(payload){this._fingerprint=Symbol('fingerprint');let version=this.versions.get(payload.versionId);if(!version){version=new ServiceWorkerVersion(this,payload);this.versions.set(payload.versionId,version);return version;}
version._update(payload);return version;}
_isRedundant(){for(const version of this.versions.values()){if(!version.isStoppedAndRedundant()){return false;}}
return true;}
_shouldBeRemoved(){return this._isRedundant()&&(!this.errors.length||this._deleting);}
canBeRemoved(){return this.isDeleted||this._deleting;}
clearErrors(){this._fingerprint=Symbol('fingerprint');this.errors=[];}}
class ServiceWorkerContextNamer{constructor(target,serviceWorkerManager){this._target=target;this._serviceWorkerManager=serviceWorkerManager;this._versionByTargetId=new Map();serviceWorkerManager.addEventListener(Events$k.RegistrationUpdated,this._registrationsUpdated,this);serviceWorkerManager.addEventListener(Events$k.RegistrationDeleted,this._registrationsUpdated,this);TargetManager.instance().addModelListener(RuntimeModel,Events$b.ExecutionContextCreated,this._executionContextCreated,this);}
_registrationsUpdated(event){this._versionByTargetId.clear();const registrations=this._serviceWorkerManager.registrations().values();for(const registration of registrations){for(const version of registration.versions.values()){if(version.targetId){this._versionByTargetId.set(version.targetId,version);}}}
this._updateAllContextLabels();}
_executionContextCreated(event){const executionContext=(event.data);const serviceWorkerTargetId=this._serviceWorkerTargetId(executionContext.target());if(!serviceWorkerTargetId){return;}
this._updateContextLabel(executionContext,this._versionByTargetId.get(serviceWorkerTargetId)||null);}
_serviceWorkerTargetId(target){if(target.parentTarget()!==this._target||target.type()!==Type.ServiceWorker){return null;}
return target.id();}
_updateAllContextLabels(){for(const target of TargetManager.instance().targets()){const serviceWorkerTargetId=this._serviceWorkerTargetId(target);if(!serviceWorkerTargetId){continue;}
const version=this._versionByTargetId.get(serviceWorkerTargetId)||null;const runtimeModel=target.model(RuntimeModel);const executionContexts=runtimeModel?runtimeModel.executionContexts():[];for(const context of executionContexts){this._updateContextLabel(context,version);}}}
_updateContextLabel(context,version){if(!version){context.setLabel('');return;}
const parsedUrl=ParsedURL.ParsedURL.fromString(context.origin);const label=parsedUrl?parsedUrl.lastPathComponentWithFragment():context.name;const localizedStatus=ServiceWorkerVersion.Status[version.status];context.setLabel(ls`${label} #${version.id} (${localizedStatus})`);}}
SDKModel.register(ServiceWorkerManager,Capability.ServiceWorker,true);var ServiceWorkerManager$1=Object.freeze({__proto__:null,ServiceWorkerManager:ServiceWorkerManager,Events:Events$k,ServiceWorkerVersion:ServiceWorkerVersion,ServiceWorkerRegistration:ServiceWorkerRegistration});export{CPUProfileDataModel$1 as CPUProfileDataModel,CPUProfilerModel$1 as CPUProfilerModel,CSSMatchedStyles$1 as CSSMatchedStyles,CSSMedia$1 as CSSMedia,CSSMetadata$1 as CSSMetadata,CSSModel$1 as CSSModel,CSSProperty$1 as CSSProperty,CSSRule$1 as CSSRule,CSSStyleDeclaration$1 as CSSStyleDeclaration,CSSStyleSheetHeader$1 as CSSStyleSheetHeader,ChildTargetManager$1 as ChildTargetManager,CompilerSourceMappingContentProvider$1 as CompilerSourceMappingContentProvider,Connections,ConsoleModel$1 as ConsoleModel,Cookie$1 as Cookie,CookieModel$1 as CookieModel,CookieParser$1 as CookieParser,DOMDebuggerModel$1 as DOMDebuggerModel,DOMModel$1 as DOMModel,DebuggerModel$1 as DebuggerModel,EmulationModel$1 as EmulationModel,FilmStripModel$1 as FilmStripModel,HARLog$1 as HARLog,HeapProfilerModel$1 as HeapProfilerModel,IsolateManager$1 as IsolateManager,Issue$1 as Issue,IssuesModel$1 as IssuesModel,LayerTreeBase$1 as LayerTreeBase,LogModel$1 as LogModel,NetworkLog$1 as NetworkLog,NetworkManager$1 as NetworkManager,NetworkRequest$1 as NetworkRequest,OverlayModel$1 as OverlayModel,PaintProfiler,PerformanceMetricsModel$1 as PerformanceMetricsModel,ProfileTreeModel$1 as ProfileTreeModel,RelatedIssue,RemoteObject$1 as RemoteObject,Resource$1 as Resource,ResourceTreeModel$1 as ResourceTreeModel,RuntimeModel$1 as RuntimeModel,SDKModel$1 as SDKModel,ScreenCaptureModel$1 as ScreenCaptureModel,Script$1 as Script,SecurityOriginManager$1 as SecurityOriginManager,ServerTiming$1 as ServerTiming,ServiceWorkerCacheModel$1 as ServiceWorkerCacheModel,ServiceWorkerManager$1 as ServiceWorkerManager,SourceMap$1 as SourceMap,SourceMapManager$1 as SourceMapManager,TracingManager$1 as TracingManager,TracingModel$1 as TracingModel};