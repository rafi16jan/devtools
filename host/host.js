import{StringOutputStream,ParsedURL,UIString,Console,ObjectWrapper,Settings,EventTarget}from'../common/common.js';import{StringUtilities}from'../platform/platform.js';import{Runtime}from'../root/root.js';const Events={AppendedToURL:Symbol('appendedToURL'),CanceledSaveURL:Symbol('canceledSaveURL'),ContextMenuCleared:Symbol('contextMenuCleared'),ContextMenuItemSelected:Symbol('contextMenuItemSelected'),DeviceCountUpdated:Symbol('deviceCountUpdated'),DevicesDiscoveryConfigChanged:Symbol('devicesDiscoveryConfigChanged'),DevicesPortForwardingStatusChanged:Symbol('devicesPortForwardingStatusChanged'),DevicesUpdated:Symbol('devicesUpdated'),DispatchMessage:Symbol('dispatchMessage'),DispatchMessageChunk:Symbol('dispatchMessageChunk'),EnterInspectElementMode:Symbol('enterInspectElementMode'),EyeDropperPickedColor:Symbol('eyeDropperPickedColor'),FileSystemsLoaded:Symbol('fileSystemsLoaded'),FileSystemRemoved:Symbol('fileSystemRemoved'),FileSystemAdded:Symbol('fileSystemAdded'),FileSystemFilesChangedAddedRemoved:Symbol('FileSystemFilesChangedAddedRemoved'),IndexingTotalWorkCalculated:Symbol('indexingTotalWorkCalculated'),IndexingWorked:Symbol('indexingWorked'),IndexingDone:Symbol('indexingDone'),KeyEventUnhandled:Symbol('keyEventUnhandled'),ReattachMainTarget:Symbol('reattachMainTarget'),ReloadInspectedPage:Symbol('reloadInspectedPage'),RevealSourceLine:Symbol('revealSourceLine'),SavedURL:Symbol('savedURL'),SearchCompleted:Symbol('searchCompleted'),SetInspectedTabId:Symbol('setInspectedTabId'),SetUseSoftMenu:Symbol('setUseSoftMenu'),ShowPanel:Symbol('showPanel')};const EventDescriptors=[[Events.AppendedToURL,'appendedToURL',['url']],[Events.CanceledSaveURL,'canceledSaveURL',['url']],[Events.ContextMenuCleared,'contextMenuCleared',[]],[Events.ContextMenuItemSelected,'contextMenuItemSelected',['id']],[Events.DeviceCountUpdated,'deviceCountUpdated',['count']],[Events.DevicesDiscoveryConfigChanged,'devicesDiscoveryConfigChanged',['config']],[Events.DevicesPortForwardingStatusChanged,'devicesPortForwardingStatusChanged',['status']],[Events.DevicesUpdated,'devicesUpdated',['devices']],[Events.DispatchMessage,'dispatchMessage',['messageObject']],[Events.DispatchMessageChunk,'dispatchMessageChunk',['messageChunk','messageSize']],[Events.EnterInspectElementMode,'enterInspectElementMode',[]],[Events.EyeDropperPickedColor,'eyeDropperPickedColor',['color']],[Events.FileSystemsLoaded,'fileSystemsLoaded',['fileSystems']],[Events.FileSystemRemoved,'fileSystemRemoved',['fileSystemPath']],[Events.FileSystemAdded,'fileSystemAdded',['errorMessage','fileSystem']],[Events.FileSystemFilesChangedAddedRemoved,'fileSystemFilesChangedAddedRemoved',['changed','added','removed']],[Events.IndexingTotalWorkCalculated,'indexingTotalWorkCalculated',['requestId','fileSystemPath','totalWork']],[Events.IndexingWorked,'indexingWorked',['requestId','fileSystemPath','worked']],[Events.IndexingDone,'indexingDone',['requestId','fileSystemPath']],[Events.KeyEventUnhandled,'keyEventUnhandled',['event']],[Events.ReattachMainTarget,'reattachMainTarget',[]],[Events.ReloadInspectedPage,'reloadInspectedPage',['hard']],[Events.RevealSourceLine,'revealSourceLine',['url','lineNumber','columnNumber']],[Events.SavedURL,'savedURL',['url','fileSystemPath']],[Events.SearchCompleted,'searchCompleted',['requestId','fileSystemPath','files']],[Events.SetInspectedTabId,'setInspectedTabId',['tabId']],[Events.SetUseSoftMenu,'setUseSoftMenu',['useSoftMenu']],[Events.ShowPanel,'showPanel',['panelName']]];class InspectorFrontendHostAPI{addFileSystem(type){}
loadCompleted(){}
indexPath(requestId,fileSystemPath,excludedFolders){}
setInspectedPageBounds(bounds){}
showCertificateViewer(certChain){}
setWhitelistedShortcuts(shortcuts){}
setEyeDropperActive(active){}
inspectElementCompleted(){}
openInNewTab(url){}
showItemInFolder(fileSystemPath){}
removeFileSystem(fileSystemPath){}
requestFileSystems(){}
save(url,content,forceSaveAs){}
append(url,content){}
close(url){}
searchInPath(requestId,fileSystemPath,query){}
stopIndexing(requestId){}
bringToFront(){}
closeWindow(){}
copyText(text){}
inspectedURLChanged(url){}
isolatedFileSystem(fileSystemId,registeredName){throw new Error('not implemented');}
loadNetworkResource(url,headers,streamId,callback){}
getPreferences(callback){}
setPreference(name,value){}
removePreference(name){}
clearPreferences(){}
upgradeDraggedFileSystemPermissions(fileSystem){}
platform(){throw new Error('Not implemented');}
recordEnumeratedHistogram(actionName,actionCode,bucketSize){}
recordPerformanceHistogram(histogramName,duration){}
recordUserMetricsAction(umaName){}
sendMessageToBackend(message){}
setDevicesDiscoveryConfig(config){}
setDevicesUpdatesEnabled(enabled){}
performActionOnRemotePage(pageId,action){}
openRemotePage(browserId,url){}
openNodeFrontend(){}
setInjectedScriptForOrigin(origin,script){}
setIsDocked(isDocked,callback){}
zoomFactor(){throw new Error('Not implemented');}
zoomIn(){}
zoomOut(){}
resetZoom(){}
showContextMenuAtPoint(x,y,items,document){}
reattach(callback){}
readyForTest(){}
connectionReady(){}
setOpenNewWindowForPopups(value){}
isHostedMode(){throw new Error('Not implemented');}
setAddExtensionCallback(callback){}}
let ContextMenuDescriptor;let LoadNetworkResourceResult;let ExtensionDescriptor;var InspectorFrontendHostAPI$1=Object.freeze({__proto__:null,Events:Events,EventDescriptors:EventDescriptors,InspectorFrontendHostAPI:InspectorFrontendHostAPI,ContextMenuDescriptor:ContextMenuDescriptor,LoadNetworkResourceResult:LoadNetworkResourceResult,ExtensionDescriptor:ExtensionDescriptor});const ResourceLoader={};let _lastStreamId=0;const _boundStreams={};const _bindOutputStream=function(stream){_boundStreams[++_lastStreamId]=stream;return _lastStreamId;};const _discardOutputStream=function(id){_boundStreams[id].close();delete _boundStreams[id];};const streamWrite=function(id,chunk){_boundStreams[id].write(chunk);};let LoadErrorDescription;let load=function(url,headers,callback){const stream=new StringOutputStream.StringOutputStream();loadAsStream(url,headers,stream,mycallback);function mycallback(success,headers,errorDescription){callback(success,headers,stream.data(),errorDescription);}};function setLoadForTest(newLoad){load=newLoad;}
function getNetErrorCategory(netError){if(netError>-100){return ls`System error`;}
if(netError>-200){return ls`Connection error`;}
if(netError>-300){return ls`Certificate error`;}
if(netError>-400){return ls`HTTP error`;}
if(netError>-500){return ls`Cache error`;}
if(netError>-600){return ls`Signed Exchange error`;}
if(netError>-700){return ls`FTP error`;}
if(netError>-800){return ls`Certificate manager error`;}
if(netError>-900){return ls`DNS resolver error`;}
return ls`Unknown error`;}
function isHTTPError(netError){return netError<=-300&&netError>-400;}
function createErrorMessageFromResponse(response){const{statusCode,netError,netErrorName,urlValid,messageOverride}=response;let message='';const success=statusCode>=200&&statusCode<300;if(typeof messageOverride==='string'){message=messageOverride;}else if(!success){if(typeof netError==='undefined'){if(urlValid===false){message=ls`Invalid URL`;}else{message=ls`Unknown error`;}}else{if(netError!==0){if(isHTTPError(netError)){message+=ls`HTTP error: status code ${statusCode}, ${netErrorName}`;}else{const errorCategory=getNetErrorCategory(netError);message=`${errorCategory}: ${netErrorName}`;}}}}
console.assert(success===(message.length===0));return{success,description:{statusCode,netError,netErrorName,urlValid,message}};}
const loadXHR=url=>{return new Promise((successCallback,failureCallback)=>{function onReadyStateChanged(){if(xhr.readyState!==XMLHttpRequest.DONE){return;}
if(xhr.status!==200){xhr.onreadystatechange=null;failureCallback(new Error(String(xhr.status)));return;}
xhr.onreadystatechange=null;successCallback(xhr.responseText);}
const xhr=new XMLHttpRequest();xhr.withCredentials=false;xhr.open('GET',url,true);xhr.onreadystatechange=onReadyStateChanged;xhr.send(null);});};const loadAsStream=function(url,headers,stream,callback){const streamId=_bindOutputStream(stream);const parsedURL=new ParsedURL.ParsedURL(url);if(parsedURL.isDataURL()){loadXHR(url).then(dataURLDecodeSuccessful).catch(dataURLDecodeFailed);return;}
const rawHeaders=[];if(headers){for(const key in headers){rawHeaders.push(key+': '+headers[key]);}}
InspectorFrontendHostInstance.loadNetworkResource(url,rawHeaders.join('\r\n'),streamId,finishedCallback);function finishedCallback(response){if(callback){const{success,description}=createErrorMessageFromResponse(response);callback(success,response.headers||{},description);}
_discardOutputStream(streamId);}
function dataURLDecodeSuccessful(text){streamWrite(streamId,text);finishedCallback(({statusCode:200}));}
function dataURLDecodeFailed(xhrStatus){const messageOverride=ls`Decoding Data URL failed`;finishedCallback(({statusCode:404,messageOverride}));}};var ResourceLoader$1=Object.freeze({__proto__:null,ResourceLoader:ResourceLoader,streamWrite:streamWrite,LoadErrorDescription:LoadErrorDescription,get load(){return load;},setLoadForTest:setLoadForTest,loadAsStream:loadAsStream});class InspectorFrontendHostStub{constructor(){function stopEventPropagation(event){const zoomModifier=this.platform()==='mac'?event.metaKey:event.ctrlKey;if(zoomModifier&&(event.keyCode===187||event.keyCode===189)){event.stopPropagation();}}
document.addEventListener('keydown',event=>{stopEventPropagation.call(this,(event));},true);this._urlsBeingSaved=new Map();this.events;}
platform(){let match=navigator.userAgent.match(/Windows NT/);if(match){return'windows';}
match=navigator.userAgent.match(/Mac OS X/);if(match){return'mac';}
return'linux';}
loadCompleted(){}
bringToFront(){this._windowVisible=true;}
closeWindow(){this._windowVisible=false;}
setIsDocked(isDocked,callback){setTimeout(callback,0);}
setInspectedPageBounds(bounds){}
inspectElementCompleted(){}
setInjectedScriptForOrigin(origin,script){}
inspectedURLChanged(url){document.title=UIString.UIString('DevTools - %s',url.replace(/^https?:\/\//,''));}
copyText(text){if(text===undefined||text===null){return;}
if(navigator.clipboard){navigator.clipboard.writeText(text);}else if(document.queryCommandSupported('copy')){const input=document.createElement('input');input.value=text;document.body.appendChild(input);input.select();document.execCommand('copy');document.body.removeChild(input);}else{Console.Console.instance().error('Clipboard is not enabled in hosted mode. Please inspect using chrome://inspect');}}
openInNewTab(url){window.open(url,'_blank');}
showItemInFolder(fileSystemPath){Console.Console.instance().error('Show item in folder is not enabled in hosted mode. Please inspect using chrome://inspect');}
save(url,content,forceSaveAs){let buffer=this._urlsBeingSaved.get(url);if(!buffer){buffer=[];this._urlsBeingSaved.set(url,buffer);}
buffer.push(content);this.events.dispatchEventToListeners(Events.SavedURL,{url,fileSystemPath:url});}
append(url,content){const buffer=this._urlsBeingSaved.get(url);if(buffer){buffer.push(content);this.events.dispatchEventToListeners(Events.AppendedToURL,url);}}
close(url){const buffer=this._urlsBeingSaved.get(url)||[];this._urlsBeingSaved.delete(url);const fileName=url?StringUtilities.trimURL(url).removeURLFragment():'';const link=document.createElement('a');link.download=fileName;const blob=new Blob([buffer.join('')],{type:'text/plain'});link.href=URL.createObjectURL(blob);link.click();}
sendMessageToBackend(message){}
recordEnumeratedHistogram(actionName,actionCode,bucketSize){}
recordPerformanceHistogram(histogramName,duration){}
recordUserMetricsAction(umaName){}
requestFileSystems(){this.events.dispatchEventToListeners(Events.FileSystemsLoaded,[]);}
addFileSystem(type){}
removeFileSystem(fileSystemPath){}
isolatedFileSystem(fileSystemId,registeredName){return null;}
loadNetworkResource(url,headers,streamId,callback){Runtime.loadResourcePromise(url).then(function(text){streamWrite(streamId,text);callback({statusCode:200,headers:undefined,messageOverride:undefined,netError:undefined,netErrorName:undefined,urlValid:undefined});}).catch(function(){callback({statusCode:404,headers:undefined,messageOverride:undefined,netError:undefined,netErrorName:undefined,urlValid:undefined});});}
getPreferences(callback){const prefs={};for(const name in window.localStorage){prefs[name]=window.localStorage[name];}
callback(prefs);}
setPreference(name,value){window.localStorage[name]=value;}
removePreference(name){delete window.localStorage[name];}
clearPreferences(){window.localStorage.clear();}
upgradeDraggedFileSystemPermissions(fileSystem){}
indexPath(requestId,fileSystemPath,excludedFolders){}
stopIndexing(requestId){}
searchInPath(requestId,fileSystemPath,query){}
zoomFactor(){return 1;}
zoomIn(){}
zoomOut(){}
resetZoom(){}
setWhitelistedShortcuts(shortcuts){}
setEyeDropperActive(active){}
showCertificateViewer(certChain){}
reattach(callback){}
readyForTest(){}
connectionReady(){}
setOpenNewWindowForPopups(value){}
setDevicesDiscoveryConfig(config){}
setDevicesUpdatesEnabled(enabled){}
performActionOnRemotePage(pageId,action){}
openRemotePage(browserId,url){}
openNodeFrontend(){}
showContextMenuAtPoint(x,y,items,document){throw'Soft context menu should be used';}
isHostedMode(){return true;}
setAddExtensionCallback(callback){}}
let InspectorFrontendHostInstance=window.InspectorFrontendHost;class InspectorFrontendAPIImpl{constructor(){this._debugFrontend=(!!Runtime.Runtime.queryParam('debugFrontend'))||(window['InspectorTest']&&window['InspectorTest']['debugTest']);const descriptors=EventDescriptors;for(let i=0;i<descriptors.length;++i){this[descriptors[i][1]]=this._dispatch.bind(this,descriptors[i][0],descriptors[i][2],descriptors[i][3]);}}
_dispatch(name,signature,runOnceLoaded){const params=Array.prototype.slice.call(arguments,3);if(this._debugFrontend){setTimeout(()=>innerDispatch(),0);}else{innerDispatch();}
function innerDispatch(){if(signature.length<2){try{InspectorFrontendHostInstance.events.dispatchEventToListeners(name,params[0]);}catch(e){console.error(e+' '+e.stack);}
return;}
const data={};for(let i=0;i<signature.length;++i){data[signature[i]]=params[i];}
try{InspectorFrontendHostInstance.events.dispatchEventToListeners(name,data);}catch(e){console.error(e+' '+e.stack);}}}
streamWrite(id,chunk){streamWrite(id,chunk);}}
(function(){function initializeInspectorFrontendHost(){let proto;if(!InspectorFrontendHostInstance){window.InspectorFrontendHost=InspectorFrontendHostInstance=new InspectorFrontendHostStub();}else{proto=InspectorFrontendHostStub.prototype;for(const name of Object.getOwnPropertyNames(proto)){const stub=proto[name];if(typeof stub!=='function'||InspectorFrontendHostInstance[name]){continue;}
console.error('Incompatible embedder: method Host.InspectorFrontendHost.'+name+' is missing. Using stub instead.');InspectorFrontendHostInstance[name]=stub;}}
InspectorFrontendHostInstance.events=new ObjectWrapper.ObjectWrapper();}
initializeInspectorFrontendHost();window.InspectorFrontendAPI=new InspectorFrontendAPIImpl();})();function isUnderTest(prefs){if(Runtime.Runtime.queryParam('test')){return true;}
if(prefs){return prefs['isUnderTest']==='true';}
return Settings.Settings.hasInstance()&&Settings.Settings.instance().createSetting('isUnderTest',false).get();}
var InspectorFrontendHost=Object.freeze({__proto__:null,InspectorFrontendHostStub:InspectorFrontendHostStub,get InspectorFrontendHostInstance(){return InspectorFrontendHostInstance;},isUnderTest:isUnderTest});let _platform;function platform(){if(!_platform){_platform=InspectorFrontendHostInstance.platform();}
return _platform;}
let _isMac;function isMac(){if(typeof _isMac==='undefined'){_isMac=platform()==='mac';}
return _isMac;}
let _isWin;function isWin(){if(typeof _isWin==='undefined'){_isWin=platform()==='windows';}
return _isWin;}
let _isCustomDevtoolsFrontend;function isCustomDevtoolsFrontend(){if(typeof _isCustomDevtoolsFrontend==='undefined'){_isCustomDevtoolsFrontend=window.location.toString().startsWith('devtools://devtools/custom/');}
return _isCustomDevtoolsFrontend;}
let _fontFamily;function fontFamily(){if(_fontFamily){return _fontFamily;}
switch(platform()){case'linux':_fontFamily='Roboto, Ubuntu, Arial, sans-serif';break;case'mac':_fontFamily='\'Lucida Grande\', sans-serif';break;case'windows':_fontFamily='\'Segoe UI\', Tahoma, sans-serif';break;}
return _fontFamily;}
var Platform=Object.freeze({__proto__:null,platform:platform,isMac:isMac,isWin:isWin,isCustomDevtoolsFrontend:isCustomDevtoolsFrontend,fontFamily:fontFamily});class UserMetrics{constructor(){this._panelChangedSinceLaunch=false;this._firedLaunchHistogram=false;this._launchPanelName='';}
panelShown(panelName){const code=PanelCodes[panelName]||0;const size=Object.keys(PanelCodes).length+1;InspectorFrontendHostInstance.recordEnumeratedHistogram('DevTools.PanelShown',code,size);EventTarget.fireEvent('DevTools.PanelShown',{value:code});this._panelChangedSinceLaunch=true;}
drawerShown(drawerId){this.panelShown('drawer-'+drawerId);}
settingsPanelShown(settingsViewId){this.panelShown('settings-'+settingsViewId);}
actionTaken(action){const size=Object.keys(Action).length+1;InspectorFrontendHostInstance.recordEnumeratedHistogram('DevTools.ActionTaken',action,size);EventTarget.fireEvent('DevTools.ActionTaken',{value:action});}
panelLoaded(panelName,histogramName){if(this._firedLaunchHistogram||panelName!==this._launchPanelName){return;}
this._firedLaunchHistogram=true;requestAnimationFrame(()=>{setTimeout(()=>{performance.mark(histogramName);if(this._panelChangedSinceLaunch){return;}
InspectorFrontendHostInstance.recordPerformanceHistogram(histogramName,performance.now());EventTarget.fireEvent('DevTools.PanelLoaded',{value:{panelName,histogramName}});},0);});}
setLaunchPanel(panelName){this._launchPanelName=(panelName);}
keyboardShortcutFired(actionId){const size=Object.keys(KeyboardShortcutAction).length+1;const action=KeyboardShortcutAction[actionId]||KeyboardShortcutAction.OtherShortcut;InspectorFrontendHostInstance.recordEnumeratedHistogram('DevTools.KeyboardShortcutFired',action,size);EventTarget.fireEvent('DevTools.KeyboardShortcutFired',{value:action});}}
const Action={WindowDocked:1,WindowUndocked:2,ScriptsBreakpointSet:3,TimelineStarted:4,ProfilesCPUProfileTaken:5,ProfilesHeapProfileTaken:6,'LegacyAuditsStarted-deprecated':7,ConsoleEvaluated:8,FileSavedInWorkspace:9,DeviceModeEnabled:10,AnimationsPlaybackRateChanged:11,RevisionApplied:12,FileSystemDirectoryContentReceived:13,StyleRuleEdited:14,CommandEvaluatedInConsolePanel:15,DOMPropertiesExpanded:16,ResizedViewInResponsiveMode:17,TimelinePageReloadStarted:18,ConnectToNodeJSFromFrontend:19,ConnectToNodeJSDirectly:20,CpuThrottlingEnabled:21,CpuProfileNodeFocused:22,CpuProfileNodeExcluded:23,SelectFileFromFilePicker:24,SelectCommandFromCommandMenu:25,ChangeInspectedNodeInElementsPanel:26,StyleRuleCopied:27,CoverageStarted:28,LighthouseStarted:29,LighthouseFinished:30,ShowedThirdPartyBadges:31,LighthouseViewTrace:32,FilmStripStartedRecording:33,CoverageReportFiltered:34,CoverageStartedPerBlock:35,SettingsOpenedFromGear:36,SettingsOpenedFromMenu:37,SettingsOpenedFromCommandMenu:38};const PanelCodes={elements:1,resources:2,network:3,sources:4,timeline:5,heap_profiler:6,'legacy-audits-deprecated':7,console:8,layers:9,'drawer-console-view':10,'drawer-animations':11,'drawer-network.config':12,'drawer-rendering':13,'drawer-sensors':14,'drawer-sources.search':15,security:16,js_profiler:17,lighthouse:18,'drawer-coverage':19,'drawer-protocol-monitor':20,'drawer-remote-devices':21,'drawer-web-audio':22,'drawer-changes.changes':23,'drawer-performance.monitor':24,'drawer-release-note':25,'drawer-live_heap_profile':26,'drawer-sources.quick':27,'drawer-network.blocked-urls':28,'settings-preferences':29,'settings-workspace':30,'settings-experiments':31,'settings-blackbox':32,'settings-devices':33,'settings-throttling-conditions':34,'settings-emulation-geolocations':35,'settings-shortcuts':36};const KeyboardShortcutAction={OtherShortcut:0,'commandMenu.show':1,'console.clear':2,'console.show':3,'debugger.step':4,'debugger.step-into':5,'debugger.step-out':6,'debugger.step-over':7,'debugger.toggle-breakpoint':8,'debugger.toggle-breakpoint-enabled':9,'debugger.toggle-pause':10,'elements.edit-as-html':11,'elements.hide-element':12,'elements.redo':13,'elements.toggle-element-search':14,'elements.undo':15,'main.search-in-panel.find':16,'main.toggle-drawer':17,'network.hide-request-details':18,'network.search':19,'network.toggle-recording':20,'quickOpen.show':21,'settings.show':22,'sources.search':23,};var UserMetrics$1=Object.freeze({__proto__:null,UserMetrics:UserMetrics,Action:Action,PanelCodes:PanelCodes,KeyboardShortcutAction:KeyboardShortcutAction});const userMetrics=new UserMetrics();export{InspectorFrontendHost,InspectorFrontendHostAPI$1 as InspectorFrontendHostAPI,Platform,ResourceLoader$1 as ResourceLoader,UserMetrics$1 as UserMetrics,userMetrics};