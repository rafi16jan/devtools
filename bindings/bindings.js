import{ObjectWrapper,ResourceType,EventTarget,ParsedURL,Throttler,Revealer,Settings,Console,UIString}from'../common/common.js';import{ResourceTreeModel,SourceMapManager,RemoteObject,DebuggerModel,RuntimeModel,SourceMap,CompilerSourceMappingContentProvider,CSSModel,SDKModel,CSSStyleDeclaration,Script,ConsoleModel}from'../sdk/sdk.js';import{Workspace,UISourceCode,FileManager}from'../workspace/workspace.js';import{StaticContentProvider,TextRange,Text}from'../text_utils/text_utils.js';import{StringUtilities}from'../platform/platform.js';class ContentProviderBasedProject extends Workspace.ProjectStore{constructor(workspace,id,type,displayName,isServiceProject){super(workspace,id,type,displayName);this._contentProviders={};this._isServiceProject=isServiceProject;workspace.addProject(this);}
async requestFileContent(uiSourceCode){const contentProvider=this._contentProviders[uiSourceCode.url()];try{const[content,isEncoded]=await Promise.all([contentProvider.requestContent(),contentProvider.contentEncoded()]);return{content:content.content,isEncoded,error:content.error};}catch(err){return{isEncoded:false,error:err?String(err):ls`Unknown error loading file`};}}
isServiceProject(){return this._isServiceProject;}
requestMetadata(uiSourceCode){return Promise.resolve(uiSourceCode[_metadata]);}
canSetFileContent(){return false;}
async setFileContent(uiSourceCode,newContent,isBase64){}
fullDisplayName(uiSourceCode){let parentPath=uiSourceCode.parentURL().replace(/^(?:https?|file)\:\/\//,'');try{parentPath=decodeURI(parentPath);}catch(e){}
return parentPath+'/'+uiSourceCode.displayName(true);}
mimeType(uiSourceCode){return(uiSourceCode[_mimeType]);}
canRename(){return false;}
rename(uiSourceCode,newName,callback){const path=uiSourceCode.url();this.performRename(path,newName,innerCallback.bind(this));function innerCallback(success,newName){if(success&&newName){const copyOfPath=path.split('/');copyOfPath[copyOfPath.length-1]=newName;const newPath=copyOfPath.join('/');this._contentProviders[newPath]=this._contentProviders[path];delete this._contentProviders[path];this.renameUISourceCode(uiSourceCode,newName);}
callback(success,newName);}}
excludeFolder(path){}
canExcludeFolder(path){return false;}
createFile(path,name,content,isBase64){}
canCreateFile(){return false;}
deleteFile(uiSourceCode){}
remove(){}
performRename(path,newName,callback){callback(false);}
searchInFileContent(uiSourceCode,query,caseSensitive,isRegex){const contentProvider=this._contentProviders[uiSourceCode.url()];return contentProvider.searchInContent(query,caseSensitive,isRegex);}
async findFilesMatchingSearchRequest(searchConfig,filesMathingFileQuery,progress){const result=[];progress.setTotalWork(filesMathingFileQuery.length);await Promise.all(filesMathingFileQuery.map(searchInContent.bind(this)));progress.done();return result;async function searchInContent(path){const provider=this._contentProviders[path];let allMatchesFound=true;for(const query of searchConfig.queries().slice()){const searchMatches=await provider.searchInContent(query,!searchConfig.ignoreCase(),searchConfig.isRegex());if(!searchMatches.length){allMatchesFound=false;break;}}
if(allMatchesFound){result.push(path);}
progress.worked(1);}}
indexContent(progress){setImmediate(progress.done.bind(progress));}
addUISourceCodeWithProvider(uiSourceCode,contentProvider,metadata,mimeType){uiSourceCode[_mimeType]=mimeType;this._contentProviders[uiSourceCode.url()]=contentProvider;uiSourceCode[_metadata]=metadata;this.addUISourceCode(uiSourceCode);}
addContentProvider(url,contentProvider,mimeType){const uiSourceCode=this.createUISourceCode(url,contentProvider.contentType());this.addUISourceCodeWithProvider(uiSourceCode,contentProvider,null,mimeType);return uiSourceCode;}
removeFile(path){delete this._contentProviders[path];this.removeUISourceCode(path);}
reset(){this._contentProviders={};this.removeProject();this.workspace().addProject(this);}
dispose(){this._contentProviders={};this.removeProject();}}
const _metadata=Symbol('ContentProviderBasedProject.Metadata');const _mimeType=Symbol('ContentProviderBasedProject.MimeType');var ContentProviderBasedProject$1=Object.freeze({__proto__:null,ContentProviderBasedProject:ContentProviderBasedProject});let networkProjectManagerInstance;class NetworkProjectManager extends ObjectWrapper.ObjectWrapper{constructor(){super();}
static instance({forceNew}={forceNew:false}){if(!networkProjectManagerInstance||forceNew){networkProjectManagerInstance=new NetworkProjectManager();}
return networkProjectManagerInstance;}}
const Events={FrameAttributionAdded:Symbol('FrameAttributionAdded'),FrameAttributionRemoved:Symbol('FrameAttributionRemoved')};class NetworkProject{static _resolveFrame(uiSourceCode,frameId){const target=NetworkProject.targetForUISourceCode(uiSourceCode);const resourceTreeModel=target&&target.model(ResourceTreeModel.ResourceTreeModel);return resourceTreeModel?resourceTreeModel.frameForId(frameId):null;}
static setInitialFrameAttribution(uiSourceCode,frameId){const frame=NetworkProject._resolveFrame(uiSourceCode,frameId);if(!frame){return;}
const attribution=new Map();attribution.set(frameId,{frame:frame,count:1});uiSourceCode[_frameAttributionSymbol]=attribution;}
static cloneInitialFrameAttribution(fromUISourceCode,toUISourceCode){const fromAttribution=fromUISourceCode[_frameAttributionSymbol];if(!fromAttribution){return;}
const toAttribution=new Map();toUISourceCode[_frameAttributionSymbol]=toAttribution;for(const frameId of fromAttribution.keys()){const value=fromAttribution.get(frameId);toAttribution.set(frameId,{frame:value.frame,count:value.count});}}
static addFrameAttribution(uiSourceCode,frameId){const frame=NetworkProject._resolveFrame(uiSourceCode,frameId);if(!frame){return;}
const frameAttribution=uiSourceCode[_frameAttributionSymbol];const attributionInfo=frameAttribution.get(frameId)||{frame:frame,count:0};attributionInfo.count+=1;frameAttribution.set(frameId,attributionInfo);if(attributionInfo.count!==1){return;}
const data={uiSourceCode:uiSourceCode,frame:frame};NetworkProjectManager.instance().dispatchEventToListeners(Events.FrameAttributionAdded,data);}
static removeFrameAttribution(uiSourceCode,frameId){const frameAttribution=uiSourceCode[_frameAttributionSymbol];if(!frameAttribution){return;}
const attributionInfo=frameAttribution.get(frameId);console.assert(attributionInfo,'Failed to remove frame attribution for url: '+uiSourceCode.url());attributionInfo.count-=1;if(attributionInfo.count>0){return;}
frameAttribution.delete(frameId);const data={uiSourceCode:uiSourceCode,frame:attributionInfo.frame};NetworkProjectManager.instance().dispatchEventToListeners(Events.FrameAttributionRemoved,data);}
static targetForUISourceCode(uiSourceCode){return uiSourceCode.project()[_targetSymbol]||null;}
static setTargetForProject(project,target){project[_targetSymbol]=target;}
static framesForUISourceCode(uiSourceCode){const target=NetworkProject.targetForUISourceCode(uiSourceCode);const resourceTreeModel=target&&target.model(ResourceTreeModel.ResourceTreeModel);const attribution=uiSourceCode[_frameAttributionSymbol];if(!resourceTreeModel||!attribution){return[];}
const frames=Array.from(attribution.keys()).map(frameId=>resourceTreeModel.frameForId(frameId));return frames.filter(frame=>!!frame);}}
const _targetSymbol=Symbol('target');const _frameAttributionSymbol=Symbol('_frameAttributionSymbol');var NetworkProject$1=Object.freeze({__proto__:null,NetworkProjectManager:NetworkProjectManager,Events:Events,NetworkProject:NetworkProject});class CompilerScriptMapping{constructor(debuggerModel,workspace,debuggerWorkspaceBinding){this._debuggerModel=debuggerModel;this._sourceMapManager=this._debuggerModel.sourceMapManager();this._workspace=workspace;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;const target=debuggerModel.target();this._regularProject=new ContentProviderBasedProject(workspace,'jsSourceMaps::'+target.id(),Workspace.projectTypes.Network,'',false);this._contentScriptsProject=new ContentProviderBasedProject(workspace,'jsSourceMaps:extensions:'+target.id(),Workspace.projectTypes.ContentScripts,'',false);NetworkProject.setTargetForProject(this._regularProject,target);NetworkProject.setTargetForProject(this._contentScriptsProject,target);this._regularBindings=new Map();this._contentScriptsBindings=new Map();this._stubUISourceCodes=new Map();this._stubProject=new ContentProviderBasedProject(workspace,'jsSourceMaps:stub:'+target.id(),Workspace.projectTypes.Service,'',true);this._eventListeners=[this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapWillAttach,event=>{this._sourceMapWillAttach(event);},this),this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapFailedToAttach,event=>{this._sourceMapFailedToAttach(event);},this),this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapAttached,event=>{this._sourceMapAttached(event);},this),this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapDetached,event=>{this._sourceMapDetached(event);},this),];}
_addStubUISourceCode(script){const stubUISourceCode=this._stubProject.addContentProvider(script.sourceURL+':sourcemap',StaticContentProvider.StaticContentProvider.fromString(script.sourceURL,ResourceType.resourceTypes.Script,'\n\n\n\n\n// Please wait a bit.\n// Compiled script is not shown while source map is being loaded!'),'text/javascript');this._stubUISourceCodes.set(script,stubUISourceCode);}
async _removeStubUISourceCode(script){const uiSourceCode=this._stubUISourceCodes.get(script);this._stubUISourceCodes.delete(script);if(uiSourceCode){this._stubProject.removeFile(uiSourceCode.url());}
await this._debuggerWorkspaceBinding.updateLocations(script);}
static uiSourceCodeOrigin(uiSourceCode){const sourceMap=uiSourceCode[_sourceMapSymbol];if(!sourceMap){return null;}
return sourceMap.compiledURL();}
mapsToSourceCode(rawLocation){const script=rawLocation.script();const sourceMap=script?this._sourceMapManager.sourceMapForClient(script):null;if(!sourceMap){return true;}
const entry=sourceMap.findEntry(rawLocation.lineNumber,rawLocation.columnNumber);return!!entry&&entry.lineNumber===rawLocation.lineNumber&&entry.columnNumber===rawLocation.columnNumber;}
uiSourceCodeForURL(url,isContentScript){return isContentScript?this._contentScriptsProject.uiSourceCodeForURL(url):this._regularProject.uiSourceCodeForURL(url);}
rawLocationToUILocation(rawLocation){const script=rawLocation.script();if(!script){return null;}
const lineNumber=rawLocation.lineNumber-script.lineOffset;let columnNumber=rawLocation.columnNumber;if(!lineNumber){columnNumber-=script.columnOffset;}
const stubUISourceCode=this._stubUISourceCodes.get(script);if(stubUISourceCode){return new UISourceCode.UILocation(stubUISourceCode,lineNumber,columnNumber);}
const sourceMap=this._sourceMapManager.sourceMapForClient(script);if(!sourceMap){return null;}
const entry=sourceMap.findEntry(lineNumber,columnNumber);if(!entry||!entry.sourceURL){return null;}
const uiSourceCode=script.isContentScript()?this._contentScriptsProject.uiSourceCodeForURL(entry.sourceURL):this._regularProject.uiSourceCodeForURL(entry.sourceURL);if(!uiSourceCode){return null;}
return uiSourceCode.uiLocation((entry.sourceLineNumber),(entry.sourceColumnNumber));}
uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){const sourceMap=uiSourceCode[_sourceMapSymbol];if(!sourceMap){return[];}
const scripts=this._sourceMapManager.clientsForSourceMap(sourceMap);if(!scripts.length){return[];}
const entry=sourceMap.sourceLineMapping(uiSourceCode.url(),lineNumber,columnNumber);if(!entry){return[];}
return scripts.map(script=>this._debuggerModel.createRawLocation(script,entry.lineNumber+script.lineOffset,!entry.lineNumber?entry.columnNumber+script.columnOffset:entry.columnNumber));}
async _sourceMapWillAttach(event){const script=(event.data);this._addStubUISourceCode(script);await this._debuggerWorkspaceBinding.updateLocations(script);}
async _sourceMapFailedToAttach(event){const script=(event.data);await this._removeStubUISourceCode(script);}
async _sourceMapAttached(event){const script=(event.data.client);const sourceMap=(event.data.sourceMap);await this._removeStubUISourceCode(script);if(BlackboxManager.instance().isBlackboxedURL(script.sourceURL,script.isContentScript())){this._sourceMapAttachedForTest(sourceMap);return;}
await this._populateSourceMapSources(script,sourceMap);this._sourceMapAttachedForTest(sourceMap);}
async _sourceMapDetached(event){const script=(event.data.client);const sourceMap=(event.data.sourceMap);const bindings=script.isContentScript()?this._contentScriptsBindings:this._regularBindings;for(const sourceURL of sourceMap.sourceURLs()){const binding=bindings.get(sourceURL);if(binding){binding.removeSourceMap(sourceMap,script.frameId);if(!binding._uiSourceCode){bindings.delete(sourceURL);}}}
await this._debuggerWorkspaceBinding.updateLocations(script);}
sourceMapForScript(script){return this._sourceMapManager.sourceMapForClient(script);}
_sourceMapAttachedForTest(sourceMap){}
async _populateSourceMapSources(script,sourceMap){const project=script.isContentScript()?this._contentScriptsProject:this._regularProject;const bindings=script.isContentScript()?this._contentScriptsBindings:this._regularBindings;for(const sourceURL of sourceMap.sourceURLs()){let binding=bindings.get(sourceURL);if(!binding){binding=new Binding(project,sourceURL);bindings.set(sourceURL,binding);}
binding.addSourceMap(sourceMap,script.frameId);}
await this._debuggerWorkspaceBinding.updateLocations(script);}
static uiLineHasMapping(uiSourceCode,lineNumber){const sourceMap=uiSourceCode[_sourceMapSymbol];if(!sourceMap){return true;}
return!!sourceMap.sourceLineMapping(uiSourceCode.url(),lineNumber,0);}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._regularProject.dispose();this._contentScriptsProject.dispose();this._stubProject.dispose();}}
const _sourceMapSymbol=Symbol('_sourceMapSymbol');class Binding{constructor(project,url){this._project=project;this._url=url;this._referringSourceMaps=[];this._activeSourceMap=null;this._uiSourceCode=null;}
_recreateUISourceCodeIfNeeded(frameId){const sourceMap=this._referringSourceMaps.peekLast();if(this._activeSourceMap===sourceMap){return;}
this._activeSourceMap=sourceMap;const newUISourceCode=this._project.createUISourceCode(this._url,ResourceType.resourceTypes.SourceMapScript);newUISourceCode[_sourceMapSymbol]=sourceMap;const contentProvider=sourceMap.sourceContentProvider(this._url,ResourceType.resourceTypes.SourceMapScript);const mimeType=ResourceType.ResourceType.mimeFromURL(this._url)||'text/javascript';const embeddedContent=sourceMap.embeddedContentByURL(this._url);const metadata=typeof embeddedContent==='string'?new UISourceCode.UISourceCodeMetadata(null,embeddedContent.length):null;if(this._uiSourceCode){NetworkProject.cloneInitialFrameAttribution(this._uiSourceCode,newUISourceCode);this._project.removeFile(this._uiSourceCode.url());}else{NetworkProject.setInitialFrameAttribution(newUISourceCode,frameId);}
this._uiSourceCode=newUISourceCode;this._project.addUISourceCodeWithProvider(this._uiSourceCode,contentProvider,metadata,mimeType);}
addSourceMap(sourceMap,frameId){if(this._uiSourceCode){NetworkProject.addFrameAttribution(this._uiSourceCode,frameId);}
this._referringSourceMaps.push(sourceMap);this._recreateUISourceCodeIfNeeded(frameId);}
removeSourceMap(sourceMap,frameId){NetworkProject.removeFrameAttribution((this._uiSourceCode),frameId);const lastIndex=this._referringSourceMaps.lastIndexOf(sourceMap);if(lastIndex!==-1){this._referringSourceMaps.splice(lastIndex,1);}
if(!this._referringSourceMaps.length){this._project.removeFile(this._uiSourceCode.url());this._uiSourceCode=null;}else{this._recreateUISourceCodeIfNeeded(frameId);}}}
var CompilerScriptMapping$1=Object.freeze({__proto__:null,CompilerScriptMapping:CompilerScriptMapping});class SourceScopeRemoteObject extends RemoteObject.RemoteObjectImpl{constructor(runtimeModel,type){super(runtimeModel,undefined,'object',undefined,null);this.variables=[];}
async doGetProperties(ownProperties,accessorPropertiesOnly,generatePreview){if(accessorPropertiesOnly){return({properties:[],internalProperties:[]});}
const variableObjects=this.variables.map(v=>new RemoteObject.RemoteObjectProperty(v.name,new RemoteObject.LocalJSONObject('(type: '+v.type+')'),false,false,true,false));return({properties:variableObjects,internalProperties:[]});}}
class SourceScope{constructor(callFrame,type){this._callFrame=callFrame;this._type=type;this._object=new SourceScopeRemoteObject(callFrame.debuggerModel.runtimeModel(),type);this._name=type;this._startLocation=null;this._endLocation=null;}
callFrame(){return this._callFrame;}
type(){return this._type;}
typeName(){return this.type();}
name(){return this._name;}
startLocation(){return this._startLocation;}
endLocation(){return this._endLocation;}
object(){return this._object;}
description(){return this.type();}}
class DebuggerLanguagePluginManager{constructor(debuggerModel,workspace,debuggerWorkspaceBinding){this._sourceMapManager=debuggerModel.sourceMapManager();this._debuggerModel=debuggerModel;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this._plugins=[];this._uiSourceCodes=new Map();this._pluginForScriptId=new Map();const target=this._debuggerModel.target();this._project=new Bindings.ContentProviderBasedProject(workspace,'language_plugins::'+target.id(),Workspace.projectTypes.Network,'',false);Bindings.NetworkProject.setTargetForProject(this._project,target);const runtimeModel=debuggerModel.runtimeModel();this._eventHandlers=[this._debuggerModel.addEventListener(DebuggerModel.Events.ParsedScriptSource,this._newScriptSourceListener,this),runtimeModel.addEventListener(RuntimeModel.Events.ExecutionContextDestroyed,this._executionContextDestroyed,this)];}
clearPlugins(){this._plugins=[];}
addPlugin(plugin){this._plugins.push(plugin);}
hasPluginForScript(script){return this._pluginForScriptId.has(script.scriptId);}
_getPluginForScript(script){const plugin=this._pluginForScriptId.get(script.scriptId);if(plugin){return plugin;}
for(const plugin of this._plugins){if(plugin.handleScript(script)){this._pluginForScriptId.set(script.scriptId,plugin);return plugin;}}
return null;}
async rawLocationToUILocation(rawLocation){const script=rawLocation.script();if(!script){return null;}
const plugin=this._pluginForScriptId.get(script.scriptId);if(!plugin){return null;}
const pluginLocation={rawModuleId:script.scriptId,codeOffset:rawLocation.columnNumber-script.codeOffset()};const sourceLocations=await plugin.rawLocationToSourceLocation(pluginLocation);if(!sourceLocations||sourceLocations.length===0){return null;}
const sourceLocation=sourceLocations[0];const sourceFileURL=DebuggerLanguagePluginManager._makeUISourceFileURL(sourceLocation.sourceFile,new URL(script.sourceURL).origin);if(sourceFileURL===null){return null;}
const uiSourceCode=this._project.uiSourceCodeForURL(sourceFileURL.toString());if(!uiSourceCode){return null;}
return uiSourceCode.uiLocation(sourceLocation.lineNumber,sourceLocation.columnNumber);}
async uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){const mappedSourceFiles=this._uiSourceCodes.get(uiSourceCode);if(!mappedSourceFiles){return null;}
const locationPromises=[];for(const[sourceFile,script]of mappedSourceFiles){const plugin=this._pluginForScriptId.get(script.scriptId);if(plugin){locationPromises.push(getLocations(this._debuggerModel,plugin,sourceFile,script));}}
if(locationPromises.length===0){return null;}
return(await Promise.all(locationPromises)).flat();async function getLocations(debuggerModel,plugin,sourceFile,script){const pluginLocation={rawModuleId:script.scriptId,sourceFile:sourceFile,lineNumber:lineNumber,columnNumber:columnNumber};const rawLocations=await plugin.sourceLocationToRawLocation(pluginLocation);if(!rawLocations||rawLocations.length===0){return[];}
return rawLocations.map(m=>new DebuggerModel.Location(debuggerModel,script.scriptId,0,Number(m.codeOffset)+script.codeOffset()));}}
async _getRawModule(script){if(!script.sourceURL.startsWith('wasm://')){return{url:script.sourceURL};}
if(script.sourceMapURL===SourceMap.WasmSourceMap.FAKE_URL){return{code:await script.getWasmBytecode()};}
return null;}
async _getSourceFiles(script){const plugin=this._pluginForScriptId.get(script.scriptId);if(plugin){const rawModule=await this._getRawModule(script);if(!rawModule){return null;}
const sourceFiles=await plugin.addRawModule(script.scriptId,script.sourceMapURL||'',rawModule);return sourceFiles;}
return null;}
static _makeUISourceFileURL(filename,baseURL){function makeUrl(filename){try{const url=new URL(filename);if(url.protocol!=='file:'||!url.hostname){return url;}}catch(error){if(!(error instanceof TypeError)){throw error;}}
return null;}
return makeUrl(filename)||makeUrl('file://'+filename)||new URL(filename,baseURL);}
_getOrCreateUISourceCode(sourceFile,script,sourceFileURL){let uiSourceCode=this._project.uiSourceCodeForURL(sourceFileURL);if(uiSourceCode){return uiSourceCode;}
uiSourceCode=this._project.createUISourceCode(sourceFileURL,ResourceType.resourceTypes.SourceMapScript);Bindings.NetworkProject.setInitialFrameAttribution(uiSourceCode,script.frameId);const contentProvider=new CompilerSourceMappingContentProvider.CompilerSourceMappingContentProvider(sourceFileURL,ResourceType.resourceTypes.SourceMapScript);this._bindUISourceCode(uiSourceCode,script,sourceFile);this._project.addUISourceCodeWithProvider(uiSourceCode,contentProvider,null,'text/javascript');return uiSourceCode;}
_bindUISourceCode(uiSourceCode,script,sourceFile){const entry=this._uiSourceCodes.get(uiSourceCode);if(entry){entry.push([sourceFile,script]);}else{this._uiSourceCodes.set(uiSourceCode,[[sourceFile,script]]);}}
_unbindUISourceCode(uiSourceCode,scripts){const filter=([sourceFile,script])=>!scripts.has(script);this._uiSourceCodes.set(uiSourceCode,this._uiSourceCodes.get(uiSourceCode).filter(filter));if(this._uiSourceCodes.get(uiSourceCode).length===0){this._project.removeFile(uiSourceCode.url());this._uiSourceCodes.delete(uiSourceCode);}}
_newScriptSourceListener(event){const script=(event.data);this._newScriptSource(script);}
async _newScriptSource(script){if(!this._getPluginForScript(script)){return;}
const sourceFiles=await this._getSourceFiles(script);if(!sourceFiles){return;}
for(const sourceFile of sourceFiles){const sourceFileURL=DebuggerLanguagePluginManager._makeUISourceFileURL(sourceFile,new URL(script.sourceURL).origin);if(sourceFileURL===null){return;}
this._getOrCreateUISourceCode(sourceFile,script,sourceFileURL.toString());}
this._debuggerWorkspaceBinding.updateLocations(script);}
_executionContextDestroyed(event){const executionContext=(event.data);const scripts=new Set(this._debuggerModel.scriptsForExecutionContext(executionContext));for(const uiSourceCode of this._uiSourceCodes.keys()){this._unbindUISourceCode(uiSourceCode,scripts);}
for(const script of scripts){this._pluginForScriptId.delete(script.scriptId);}}
dispose(){this._project.dispose();for(const plugin of this._plugins){if(plugin.dispose){plugin.dispose();}}
this._pluginForScriptId.clear();this._uiSourceCodes.clear();}
async resolveScopeChain(callFrame){const script=callFrame.script;const plugin=this._pluginForScriptId.get(script.scriptId);if(!plugin){return null;}
const scopes=new Map();const variables=await plugin.listVariablesInScope({'rawModuleId':script.scriptId,'codeOffset':callFrame.location().columnNumber-script.codeOffset()});if(variables){for(const variable of variables){if(!scopes.has(variable.scope)){scopes.set(variable.scope,new SourceScope(callFrame,variable.scope));}
scopes.get(variable.scope).object().variables.push(variable);}}
return Array.from(scopes.values());}}
class DebuggerLanguagePluginError extends Error{constructor(code,message){super(message);this.code=code;this.name='DebuggerLanguagePluginError';}}
let RawModule;let RawLocation;let SourceLocation;let Variable;class DebuggerLanguagePlugin{handleScript(script){}
dispose(){}
async addRawModule(rawModuleId,symbolsURL,rawModule){}
async sourceLocationToRawLocation(sourceLocation){}
async rawLocationToSourceLocation(rawLocation){}
async listVariablesInScope(rawLocation){}
async evaluateVariable(name,location){}}
class DefaultScriptMapping{constructor(debuggerModel,workspace,debuggerWorkspaceBinding){this._debuggerModel=debuggerModel;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this._project=new ContentProviderBasedProject(workspace,'debugger:'+debuggerModel.target().id(),Workspace.projectTypes.Debugger,'',true);this._eventListeners=[debuggerModel.addEventListener(DebuggerModel.Events.GlobalObjectCleared,this._debuggerReset,this),debuggerModel.addEventListener(DebuggerModel.Events.ParsedScriptSource,this._parsedScriptSource,this),debuggerModel.addEventListener(DebuggerModel.Events.DiscardedAnonymousScriptSource,this._discardedScriptSource,this)];this._scriptSymbol=Symbol('symbol');}
static scriptForUISourceCode(uiSourceCode){const scripts=uiSourceCode[_scriptsSymbol];return scripts?scripts.values().next().value:null;}
rawLocationToUILocation(rawLocation){const script=rawLocation.script();if(!script){return null;}
const uiSourceCode=script[_uiSourceCodeSymbol];const lineNumber=rawLocation.lineNumber-(script.isInlineScriptWithSourceURL()?script.lineOffset:0);let columnNumber=rawLocation.columnNumber||0;if(script.isInlineScriptWithSourceURL()&&!lineNumber&&columnNumber){columnNumber-=script.columnOffset;}
return uiSourceCode.uiLocation(lineNumber,columnNumber);}
uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){const script=uiSourceCode[this._scriptSymbol];if(!script){return[];}
if(script.isInlineScriptWithSourceURL()){return[this._debuggerModel.createRawLocation(script,lineNumber+script.lineOffset,lineNumber?columnNumber:columnNumber+script.columnOffset)];}
return[this._debuggerModel.createRawLocation(script,lineNumber,columnNumber)];}
_parsedScriptSource(event){const script=(event.data);const name=ParsedURL.ParsedURL.extractName(script.sourceURL);const url='debugger:///VM'+script.scriptId+(name?' '+name:'');const uiSourceCode=this._project.createUISourceCode(url,ResourceType.resourceTypes.Script);uiSourceCode[this._scriptSymbol]=script;if(!uiSourceCode[_scriptsSymbol]){uiSourceCode[_scriptsSymbol]=new Set([script]);}else{uiSourceCode[_scriptsSymbol].add(script);}
script[_uiSourceCodeSymbol]=uiSourceCode;this._project.addUISourceCodeWithProvider(uiSourceCode,script,null,'text/javascript');this._debuggerWorkspaceBinding.updateLocations(script);}
_discardedScriptSource(event){const script=(event.data);const uiSourceCode=script[_uiSourceCodeSymbol];if(!uiSourceCode){return;}
delete script[_uiSourceCodeSymbol];delete uiSourceCode[this._scriptSymbol];uiSourceCode[_scriptsSymbol].delete(script);if(!uiSourceCode[_scriptsSymbol].size){delete uiSourceCode[_scriptsSymbol];}
this._project.removeUISourceCode(uiSourceCode.url());}
_debuggerReset(){this._project.reset();}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._debuggerReset();this._project.dispose();}}
const _scriptsSymbol=Symbol('symbol');const _uiSourceCodeSymbol=Symbol('uiSourceCodeSymbol');var DefaultScriptMapping$1=Object.freeze({__proto__:null,DefaultScriptMapping:DefaultScriptMapping});let AddRawModuleResponse;let SourceLocationToRawLocationResponse;let RawLocationToSourceLocationResponse;let ListVariablesInScopeResponse;let EvaluateVariableResponse;async function _sendJsonRPC(method,params){const payload=JSON.stringify({jsonrpc:'2.0',method:method,params,id:0});const request=new Request('http://localhost:8888',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:payload});const response=await fetch(request);if(response.status!==200){throw new DebuggerLanguagePluginError(response.status.toString(),'JSON-RPC request failed');}
const result=(await response.json()).result;if(result.error){throw new DebuggerLanguagePluginError(result.error.code,result.error.message);}
return result;}
class CXXDWARFLanguagePlugin{handleScript(script){return script.isWasm()&&!script.sourceURL.startsWith('wasm://')&&(script.sourceMapURL==='wasm://dwarf'||!script.sourceMapURL);}
async addRawModule(rawModuleId,symbols,rawModule){return(await _sendJsonRPC('addRawModule',{rawModuleId:rawModuleId,symbols:symbols,rawModule:getProtocolModule(rawModule)})).sources;function getProtocolModule(rawModule){if(!rawModule.code){return{url:rawModule.url};}
const moduleBytes=new Uint8Array(rawModule.code);let binary='';const len=moduleBytes.byteLength;for(let i=0;i<len;i++){binary+=String.fromCharCode(moduleBytes[i]);}
return{code:btoa(binary)};}}
async sourceLocationToRawLocation(sourceLocation){return(await _sendJsonRPC('sourceLocationToRawLocation',sourceLocation)).rawLocation;}
async rawLocationToSourceLocation(rawLocation){return(await _sendJsonRPC('rawLocationToSourceLocation',rawLocation)).sourceLocation;}
async listVariablesInScope(rawLocation){return(await _sendJsonRPC('listVariablesInScope',rawLocation)).variable;}
async evaluateVariable(name,location){return null;}
dispose(){}}
class LiveLocation{update(){throw new Error('not implemented');}
uiLocation(){throw new Error('not implemented');}
dispose(){}
isBlackboxed(){throw new Error('not implemented');}}
class LiveLocationWithPool{constructor(updateDelegate,locationPool){this._updateDelegate=updateDelegate;this._locationPool=locationPool;this._locationPool._add(this);this._updatePromise=null;}
async update(){if(!this._updateDelegate){return;}
if(this._updatePromise){await this._updatePromise.then(()=>this.update());}else{this._updatePromise=this._updateDelegate(this);await this._updatePromise;this._updatePromise=null;}}
async uiLocation(){throw'Not implemented';}
dispose(){this._locationPool._delete(this);this._updateDelegate=null;}
async isBlackboxed(){throw'Not implemented';}}
class LiveLocationPool{constructor(){this._locations=new Set();}
_add(location){this._locations.add(location);}
_delete(location){this._locations.delete(location);}
disposeAll(){for(const location of this._locations){location.dispose();}}}
var LiveLocation$1=Object.freeze({__proto__:null,LiveLocation:LiveLocation,LiveLocationWithPool:LiveLocationWithPool,LiveLocationPool:LiveLocationPool});class SASSSourceMapping{constructor(target,sourceMapManager,workspace){this._sourceMapManager=sourceMapManager;this._project=new ContentProviderBasedProject(workspace,'cssSourceMaps:'+target.id(),Workspace.projectTypes.Network,'',false);NetworkProject.setTargetForProject(this._project,target);this._eventListeners=[this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapAttached,event=>{this._sourceMapAttached(event);},this),this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapDetached,event=>{this._sourceMapDetached(event);},this),this._sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapChanged,event=>{this._sourceMapChanged(event);},this)];}
_sourceMapAttachedForTest(sourceMap){}
async _sourceMapAttached(event){const header=(event.data.client);const sourceMap=(event.data.sourceMap);for(const sassURL of sourceMap.sourceURLs()){let uiSourceCode=this._project.uiSourceCodeForURL(sassURL);if(uiSourceCode){NetworkProject.addFrameAttribution(uiSourceCode,header.frameId);continue;}
const contentProvider=sourceMap.sourceContentProvider(sassURL,ResourceType.resourceTypes.SourceMapStyleSheet);const mimeType=ResourceType.ResourceType.mimeFromURL(sassURL)||contentProvider.contentType().canonicalMimeType();const embeddedContent=sourceMap.embeddedContentByURL(sassURL);const metadata=typeof embeddedContent==='string'?new UISourceCode.UISourceCodeMetadata(null,embeddedContent.length):null;uiSourceCode=this._project.createUISourceCode(sassURL,contentProvider.contentType());NetworkProject.setInitialFrameAttribution(uiSourceCode,header.frameId);uiSourceCode[_sourceMapSymbol$1]=sourceMap;this._project.addUISourceCodeWithProvider(uiSourceCode,contentProvider,metadata,mimeType);}
await CSSWorkspaceBinding.instance().updateLocations(header);this._sourceMapAttachedForTest(sourceMap);}
async _sourceMapDetached(event){const header=(event.data.client);const sourceMap=(event.data.sourceMap);const headers=this._sourceMapManager.clientsForSourceMap(sourceMap);for(const sassURL of sourceMap.sourceURLs()){if(headers.length){const uiSourceCode=this._project.uiSourceCodeForURL(sassURL);if(!uiSourceCode){continue;}
NetworkProject.removeFrameAttribution(uiSourceCode,header.frameId);}else{this._project.removeFile(sassURL);}}
await CSSWorkspaceBinding.instance().updateLocations(header);}
async _sourceMapChanged(event){const sourceMap=(event.data.sourceMap);const newSources=(event.data.newSources);const headers=this._sourceMapManager.clientsForSourceMap(sourceMap);for(const sourceURL of newSources.keys()){const uiSourceCode=this._project.uiSourceCodeForURL(sourceURL);if(!uiSourceCode){console.error('Failed to update source for '+sourceURL);continue;}
const sassText=(newSources.get(sourceURL));uiSourceCode.setWorkingCopy(sassText);}
const updatePromises=headers.map(header=>CSSWorkspaceBinding.instance().updateLocations(header));await Promise.all(updatePromises);}
rawLocationToUILocation(rawLocation){const header=rawLocation.header();if(!header){return null;}
const sourceMap=this._sourceMapManager.sourceMapForClient(header);if(!sourceMap){return null;}
const entry=sourceMap.findEntry(rawLocation.lineNumber,rawLocation.columnNumber);if(!entry||!entry.sourceURL){return null;}
const uiSourceCode=this._project.uiSourceCodeForURL(entry.sourceURL);if(!uiSourceCode){return null;}
return uiSourceCode.uiLocation(entry.sourceLineNumber||0,entry.sourceColumnNumber);}
uiLocationToRawLocations(uiLocation){const sourceMap=uiLocation.uiSourceCode[_sourceMapSymbol$1];if(!sourceMap){return[];}
const entries=sourceMap.findReverseEntries(uiLocation.uiSourceCode.url(),uiLocation.lineNumber,uiLocation.columnNumber);const locations=[];for(const header of this._sourceMapManager.clientsForSourceMap(sourceMap)){locations.push(...entries.map(entry=>new CSSModel.CSSLocation(header,entry.lineNumber,entry.columnNumber)));}
return locations;}
dispose(){this._project.dispose();EventTarget.EventTarget.removeEventListeners(this._eventListeners);}}
const _sourceMapSymbol$1=Symbol('sourceMap');var SASSSourceMapping$1=Object.freeze({__proto__:null,SASSSourceMapping:SASSSourceMapping});function resourceForURL(url){for(const resourceTreeModel of SDKModel.TargetManager.instance().models(ResourceTreeModel.ResourceTreeModel)){const resource=resourceTreeModel.resourceForURL(url);if(resource){return resource;}}
return null;}
function displayNameForURL(url){if(!url){return'';}
const resource=resourceForURL(url);if(resource){return resource.displayName;}
const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);if(uiSourceCode){return uiSourceCode.displayName();}
const mainTarget=SDKModel.TargetManager.instance().mainTarget();const inspectedURL=mainTarget&&mainTarget.inspectedURL();if(!inspectedURL){return StringUtilities.trimURL(url,'');}
const parsedURL=ParsedURL.ParsedURL.fromString(inspectedURL);const lastPathComponent=parsedURL?parsedURL.lastPathComponent:parsedURL;const index=inspectedURL.indexOf(lastPathComponent);if(index!==-1&&index+lastPathComponent.length===inspectedURL.length){const baseURL=inspectedURL.substring(0,index);if(url.startsWith(baseURL)){return url.substring(index);}}
if(!parsedURL){return url;}
const displayName=StringUtilities.trimURL(url,parsedURL.host);return displayName==='/'?parsedURL.host+'/':displayName;}
function metadataForURL(target,frameId,url){const resourceTreeModel=target.model(ResourceTreeModel.ResourceTreeModel);if(!resourceTreeModel){return null;}
const frame=resourceTreeModel.frameForId(frameId);if(!frame){return null;}
return resourceMetadata(frame.resourceForURL(url));}
function resourceMetadata(resource){if(!resource||(typeof resource.contentSize()!=='number'&&!resource.lastModified())){return null;}
return new UISourceCode.UISourceCodeMetadata(resource.lastModified(),resource.contentSize());}
var ResourceUtils=Object.freeze({__proto__:null,resourceForURL:resourceForURL,displayNameForURL:displayNameForURL,metadataForURL:metadataForURL,resourceMetadata:resourceMetadata});class StylesSourceMapping{constructor(cssModel,workspace){this._cssModel=cssModel;const target=this._cssModel.target();this._project=new ContentProviderBasedProject(workspace,'css:'+target.id(),Workspace.projectTypes.Network,'',false);NetworkProject.setTargetForProject(this._project,target);this._styleFiles=new Map();this._eventListeners=[this._cssModel.addEventListener(CSSModel.Events.StyleSheetAdded,this._styleSheetAdded,this),this._cssModel.addEventListener(CSSModel.Events.StyleSheetRemoved,this._styleSheetRemoved,this),this._cssModel.addEventListener(CSSModel.Events.StyleSheetChanged,this._styleSheetChanged,this),];}
rawLocationToUILocation(rawLocation){const header=rawLocation.header();if(!header||!this._acceptsHeader(header)){return null;}
const styleFile=this._styleFiles.get(header.resourceURL());if(!styleFile){return null;}
let lineNumber=rawLocation.lineNumber;let columnNumber=rawLocation.columnNumber;if(header.isInline&&header.hasSourceURL){lineNumber-=header.lineNumberInSource(0);columnNumber-=header.columnNumberInSource(lineNumber,0);}
return styleFile._uiSourceCode.uiLocation(lineNumber,columnNumber);}
uiLocationToRawLocations(uiLocation){const styleFile=uiLocation.uiSourceCode[StyleFile._symbol];if(!styleFile){return[];}
const rawLocations=[];for(const header of styleFile._headers){let lineNumber=uiLocation.lineNumber;let columnNumber=uiLocation.columnNumber;if(header.isInline&&header.hasSourceURL){columnNumber=header.columnNumberInSource(lineNumber,columnNumber);lineNumber=header.lineNumberInSource(lineNumber);}
rawLocations.push(new CSSModel.CSSLocation(header,lineNumber,columnNumber));}
return rawLocations;}
_acceptsHeader(header){if(header.isInline&&!header.hasSourceURL&&header.origin!=='inspector'){return false;}
if(!header.resourceURL()){return false;}
return true;}
_styleSheetAdded(event){const header=(event.data);if(!this._acceptsHeader(header)){return;}
const url=header.resourceURL();let styleFile=this._styleFiles.get(url);if(!styleFile){styleFile=new StyleFile(this._cssModel,this._project,header);this._styleFiles.set(url,styleFile);}else{styleFile.addHeader(header);}}
_styleSheetRemoved(event){const header=(event.data);if(!this._acceptsHeader(header)){return;}
const url=header.resourceURL();const styleFile=this._styleFiles.get(url);if(styleFile._headers.size===1){styleFile.dispose();this._styleFiles.delete(url);}else{styleFile.removeHeader(header);}}
_styleSheetChanged(event){const header=this._cssModel.styleSheetHeaderForId(event.data.styleSheetId);if(!header||!this._acceptsHeader(header)){return;}
const styleFile=this._styleFiles.get(header.resourceURL());styleFile._styleSheetChanged(header);}
dispose(){for(const styleFile of this._styleFiles.values()){styleFile.dispose();}
this._styleFiles.clear();EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._project.removeProject();}}
class StyleFile{constructor(cssModel,project,header){this._cssModel=cssModel;this._project=project;this._headers=new Set([header]);const target=cssModel.target();const url=header.resourceURL();const metadata=metadataForURL(target,header.frameId,url);this._uiSourceCode=this._project.createUISourceCode(url,header.contentType());this._uiSourceCode[StyleFile._symbol]=this;NetworkProject.setInitialFrameAttribution(this._uiSourceCode,header.frameId);this._project.addUISourceCodeWithProvider(this._uiSourceCode,this,metadata,'text/css');this._eventListeners=[this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._workingCopyChanged,this),this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._workingCopyCommitted,this)];this._throttler=new Throttler.Throttler(StyleFile.updateTimeout);this._terminated=false;}
addHeader(header){this._headers.add(header);NetworkProject.addFrameAttribution(this._uiSourceCode,header.frameId);}
removeHeader(header){this._headers.delete(header);NetworkProject.removeFrameAttribution(this._uiSourceCode,header.frameId);}
_styleSheetChanged(header){console.assert(this._headers.has(header));if(this._isUpdatingHeaders||!this._headers.has(header)){return;}
const mirrorContentBound=this._mirrorContent.bind(this,header,true);this._throttler.schedule(mirrorContentBound,false);}
_workingCopyCommitted(event){if(this._isAddingRevision){return;}
const mirrorContentBound=this._mirrorContent.bind(this,this._uiSourceCode,true);this._throttler.schedule(mirrorContentBound,true);}
_workingCopyChanged(event){if(this._isAddingRevision){return;}
const mirrorContentBound=this._mirrorContent.bind(this,this._uiSourceCode,false);this._throttler.schedule(mirrorContentBound,false);}
async _mirrorContent(fromProvider,majorChange){if(this._terminated){this._styleFileSyncedForTest();return;}
let newContent=null;if(fromProvider===this._uiSourceCode){newContent=this._uiSourceCode.workingCopy();}else{const deferredContent=await fromProvider.requestContent();newContent=deferredContent.content;}
if(newContent===null||this._terminated){this._styleFileSyncedForTest();return;}
if(fromProvider!==this._uiSourceCode){this._isAddingRevision=true;this._uiSourceCode.addRevision(newContent);this._isAddingRevision=false;}
this._isUpdatingHeaders=true;const promises=[];for(const header of this._headers){if(header===fromProvider){continue;}
promises.push(this._cssModel.setStyleSheetText(header.id,newContent,majorChange));}
await Promise.all(promises);this._isUpdatingHeaders=false;this._styleFileSyncedForTest();}
_styleFileSyncedForTest(){}
dispose(){if(this._terminated){return;}
this._terminated=true;this._project.removeFile(this._uiSourceCode.url());EventTarget.EventTarget.removeEventListeners(this._eventListeners);}
contentURL(){return this._headers.firstValue().originalContentProvider().contentURL();}
contentType(){return this._headers.firstValue().originalContentProvider().contentType();}
contentEncoded(){return this._headers.firstValue().originalContentProvider().contentEncoded();}
requestContent(){return this._headers.firstValue().originalContentProvider().requestContent();}
searchInContent(query,caseSensitive,isRegex){return this._headers.firstValue().originalContentProvider().searchInContent(query,caseSensitive,isRegex);}}
StyleFile._symbol=Symbol('Bindings.StyleFile._symbol');StyleFile.updateTimeout=200;var StylesSourceMapping$1=Object.freeze({__proto__:null,StylesSourceMapping:StylesSourceMapping,StyleFile:StyleFile});let cssWorkspaceBindingInstance;class CSSWorkspaceBinding{constructor(targetManager,workspace){this._workspace=workspace;this._modelToInfo=new Map();this._sourceMappings=[];targetManager.observeModels(CSSModel.CSSModel,this);this._liveLocationPromises=new Set();}
static instance(opts={forceNew:null,targetManager:null,workspace:null}){const{forceNew,targetManager,workspace}=opts;if(!cssWorkspaceBindingInstance||forceNew){if(!targetManager||!workspace){throw new Error(`Unable to create settings: targetManager and workspace must be provided: ${new Error().stack}`);}
cssWorkspaceBindingInstance=new CSSWorkspaceBinding(targetManager,workspace);}
return cssWorkspaceBindingInstance;}
modelAdded(cssModel){this._modelToInfo.set(cssModel,new ModelInfo(cssModel,this._workspace));}
modelRemoved(cssModel){this._modelToInfo.get(cssModel)._dispose();this._modelToInfo.delete(cssModel);}
pendingLiveLocationChangesPromise(){return Promise.all(this._liveLocationPromises);}
_recordLiveLocationChange(promise){promise.then(()=>{this._liveLocationPromises.delete(promise);});this._liveLocationPromises.add(promise);}
async updateLocations(header){const updatePromise=this._modelToInfo.get(header.cssModel())._updateLocations(header);this._recordLiveLocationChange(updatePromise);await updatePromise;}
createLiveLocation(rawLocation,updateDelegate,locationPool){const locationPromise=this._modelToInfo.get(rawLocation.cssModel())._createLiveLocation(rawLocation,updateDelegate,locationPool);this._recordLiveLocationChange(locationPromise);return locationPromise;}
propertyUILocation(cssProperty,forName){const style=cssProperty.ownerStyle;if(!style||style.type!==CSSStyleDeclaration.Type.Regular||!style.styleSheetId){return null;}
const header=style.cssModel().styleSheetHeaderForId(style.styleSheetId);if(!header){return null;}
const range=forName?cssProperty.nameRange():cssProperty.valueRange();if(!range){return null;}
const lineNumber=range.startLine;const columnNumber=range.startColumn;const rawLocation=new CSSModel.CSSLocation(header,header.lineNumberInSource(lineNumber),header.columnNumberInSource(lineNumber,columnNumber));return this.rawLocationToUILocation(rawLocation);}
rawLocationToUILocation(rawLocation){for(let i=this._sourceMappings.length-1;i>=0;--i){const uiLocation=this._sourceMappings[i].rawLocationToUILocation(rawLocation);if(uiLocation){return uiLocation;}}
return this._modelToInfo.get(rawLocation.cssModel())._rawLocationToUILocation(rawLocation);}
uiLocationToRawLocations(uiLocation){for(let i=this._sourceMappings.length-1;i>=0;--i){const rawLocations=this._sourceMappings[i].uiLocationToRawLocations(uiLocation);if(rawLocations.length){return rawLocations;}}
const rawLocations=[];for(const modelInfo of this._modelToInfo.values()){rawLocations.push(...modelInfo._uiLocationToRawLocations(uiLocation));}
return rawLocations;}
addSourceMapping(sourceMapping){this._sourceMappings.push(sourceMapping);}}
class SourceMapping{rawLocationToUILocation(rawLocation){}
uiLocationToRawLocations(uiLocation){}}
class ModelInfo{constructor(cssModel,workspace){this._eventListeners=[cssModel.addEventListener(CSSModel.Events.StyleSheetAdded,event=>{this._styleSheetAdded(event);},this),cssModel.addEventListener(CSSModel.Events.StyleSheetRemoved,event=>{this._styleSheetRemoved(event);},this)];this._stylesSourceMapping=new StylesSourceMapping(cssModel,workspace);const sourceMapManager=cssModel.sourceMapManager();this._sassSourceMapping=new SASSSourceMapping(cssModel.target(),sourceMapManager,workspace);this._locations=new Platform.Multimap();this._unboundLocations=new Platform.Multimap();}
async _createLiveLocation(rawLocation,updateDelegate,locationPool){const location=new LiveLocation$2(rawLocation,this,updateDelegate,locationPool);const header=rawLocation.header();if(header){location._header=header;this._locations.set(header,location);await location.update();}else{this._unboundLocations.set(rawLocation.url,location);}
return location;}
_disposeLocation(location){if(location._header){this._locations.delete(location._header,location);}else{this._unboundLocations.delete(location._url,location);}}
_updateLocations(header){const promises=[];for(const location of this._locations.get(header)){promises.push(location.update());}
return Promise.all(promises);}
async _styleSheetAdded(event){const header=(event.data);if(!header.sourceURL){return;}
const promises=[];for(const location of this._unboundLocations.get(header.sourceURL)){location._header=header;this._locations.set(header,location);promises.push(location.update());}
await Promise.all(promises);this._unboundLocations.deleteAll(header.sourceURL);}
async _styleSheetRemoved(event){const header=(event.data);const promises=[];for(const location of this._locations.get(header)){location._header=null;this._unboundLocations.set(location._url,location);promises.push(location.update());}
await Promise.all(promises);this._locations.deleteAll(header);}
_rawLocationToUILocation(rawLocation){let uiLocation=null;uiLocation=uiLocation||this._sassSourceMapping.rawLocationToUILocation(rawLocation);uiLocation=uiLocation||this._stylesSourceMapping.rawLocationToUILocation(rawLocation);uiLocation=uiLocation||ResourceMapping.instance().cssLocationToUILocation(rawLocation);return uiLocation;}
_uiLocationToRawLocations(uiLocation){let rawLocations=this._sassSourceMapping.uiLocationToRawLocations(uiLocation);if(rawLocations.length){return rawLocations;}
rawLocations=this._stylesSourceMapping.uiLocationToRawLocations(uiLocation);if(rawLocations.length){return rawLocations;}
return ResourceMapping.instance().uiLocationToCSSLocations(uiLocation);}
_dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._stylesSourceMapping.dispose();this._sassSourceMapping.dispose();}}
class LiveLocation$2 extends LiveLocationWithPool{constructor(rawLocation,info,updateDelegate,locationPool){super(updateDelegate,locationPool);this._url=rawLocation.url;this._lineNumber=rawLocation.lineNumber;this._columnNumber=rawLocation.columnNumber;this._info=info;this._header=null;}
async uiLocation(){if(!this._header){return null;}
const rawLocation=new CSSModel.CSSLocation(this._header,this._lineNumber,this._columnNumber);return CSSWorkspaceBinding.instance().rawLocationToUILocation(rawLocation);}
dispose(){super.dispose();this._info._disposeLocation(this);}
async isBlackboxed(){return false;}}
var CSSWorkspaceBinding$1=Object.freeze({__proto__:null,CSSWorkspaceBinding:CSSWorkspaceBinding,SourceMapping:SourceMapping,ModelInfo:ModelInfo,LiveLocation:LiveLocation$2});let resourceMappingInstance;class ResourceMapping{constructor(targetManager,workspace){this._workspace=workspace;this._modelToInfo=new Map();targetManager.observeModels(ResourceTreeModel.ResourceTreeModel,this);}
static instance(opts={forceNew:null,targetManager:null,workspace:null}){const{forceNew,targetManager,workspace}=opts;if(!resourceMappingInstance||forceNew){if(!targetManager||!workspace){throw new Error(`Unable to create settings: targetManager and workspace must be provided: ${new Error().stack}`);}
resourceMappingInstance=new ResourceMapping(targetManager,workspace);}
return resourceMappingInstance;}
modelAdded(resourceTreeModel){const info=new ModelInfo$1(this._workspace,resourceTreeModel);this._modelToInfo.set(resourceTreeModel,info);}
modelRemoved(resourceTreeModel){const info=this._modelToInfo.get(resourceTreeModel);info.dispose();this._modelToInfo.delete(resourceTreeModel);}
_infoForTarget(target){const resourceTreeModel=target.model(ResourceTreeModel.ResourceTreeModel);return resourceTreeModel?this._modelToInfo.get(resourceTreeModel):null;}
cssLocationToUILocation(cssLocation){const header=cssLocation.header();if(!header){return null;}
const info=this._infoForTarget(cssLocation.cssModel().target());if(!info){return null;}
const uiSourceCode=info._project.uiSourceCodeForURL(cssLocation.url);if(!uiSourceCode){return null;}
const offset=header[offsetSymbol]||TextRange.TextRange.createFromLocation(header.startLine,header.startColumn);const lineNumber=cssLocation.lineNumber+offset.startLine-header.startLine;let columnNumber=cssLocation.columnNumber;if(cssLocation.lineNumber===header.startLine){columnNumber+=offset.startColumn-header.startColumn;}
return uiSourceCode.uiLocation(lineNumber,columnNumber);}
jsLocationToUILocation(jsLocation){const script=jsLocation.script();if(!script){return null;}
const info=this._infoForTarget(jsLocation.debuggerModel.target());if(!info){return null;}
const uiSourceCode=info._project.uiSourceCodeForURL(script.sourceURL);if(!uiSourceCode){return null;}
const offset=script[offsetSymbol]||TextRange.TextRange.createFromLocation(script.lineOffset,script.columnOffset);const lineNumber=jsLocation.lineNumber+offset.startLine-script.lineOffset;let columnNumber=jsLocation.columnNumber;if(jsLocation.lineNumber===script.lineOffset){columnNumber+=offset.startColumn-script.columnOffset;}
return uiSourceCode.uiLocation(lineNumber,columnNumber);}
uiLocationToJSLocations(uiSourceCode,lineNumber,columnNumber){if(!uiSourceCode[symbol]){return[];}
const target=NetworkProject.targetForUISourceCode(uiSourceCode);if(!target){return[];}
const debuggerModel=target.model(DebuggerModel.DebuggerModel);if(!debuggerModel){return[];}
const location=debuggerModel.createRawLocationByURL(uiSourceCode.url(),lineNumber,columnNumber);if(location&&location.script().containsLocation(lineNumber,columnNumber)){return[location];}
return[];}
uiLocationToCSSLocations(uiLocation){if(!uiLocation.uiSourceCode[symbol]){return[];}
const target=NetworkProject.targetForUISourceCode(uiLocation.uiSourceCode);if(!target){return[];}
const cssModel=target.model(CSSModel.CSSModel);if(!cssModel){return[];}
return cssModel.createRawLocationsByURL(uiLocation.uiSourceCode.url(),uiLocation.lineNumber,uiLocation.columnNumber);}
_resetForTest(target){const resourceTreeModel=target.model(ResourceTreeModel.ResourceTreeModel);const info=resourceTreeModel?this._modelToInfo.get(resourceTreeModel):null;if(info){info._resetForTest();}}}
class ModelInfo$1{constructor(workspace,resourceTreeModel){const target=resourceTreeModel.target();this._project=new ContentProviderBasedProject(workspace,'resources:'+target.id(),Workspace.projectTypes.Network,'',false);NetworkProject.setTargetForProject(this._project,target);this._bindings=new Map();const cssModel=target.model(CSSModel.CSSModel);this._cssModel=cssModel;this._eventListeners=[resourceTreeModel.addEventListener(ResourceTreeModel.Events.ResourceAdded,this._resourceAdded,this),resourceTreeModel.addEventListener(ResourceTreeModel.Events.FrameWillNavigate,this._frameWillNavigate,this),resourceTreeModel.addEventListener(ResourceTreeModel.Events.FrameDetached,this._frameDetached,this),cssModel.addEventListener(CSSModel.Events.StyleSheetChanged,event=>{this._styleSheetChanged(event);},this)];}
async _styleSheetChanged(event){const header=this._cssModel.styleSheetHeaderForId(event.data.styleSheetId);if(!header||!header.isInline){return;}
const binding=this._bindings.get(header.resourceURL());if(!binding){return;}
await binding._styleSheetChanged(header,event.data.edit);}
_acceptsResource(resource){const resourceType=resource.resourceType();if(resourceType!==ResourceType.resourceTypes.Image&&resourceType!==ResourceType.resourceTypes.Font&&resourceType!==ResourceType.resourceTypes.Document&&resourceType!==ResourceType.resourceTypes.Manifest){return false;}
if(resourceType===ResourceType.resourceTypes.Image&&resource.mimeType&&!resource.mimeType.startsWith('image')){return false;}
if(resourceType===ResourceType.resourceTypes.Font&&resource.mimeType&&!resource.mimeType.includes('font')){return false;}
if((resourceType===ResourceType.resourceTypes.Image||resourceType===ResourceType.resourceTypes.Font)&&resource.contentURL().startsWith('data:')){return false;}
return true;}
_resourceAdded(event){const resource=(event.data);if(!this._acceptsResource(resource)){return;}
let binding=this._bindings.get(resource.url);if(!binding){binding=new Binding$1(this._project,resource);this._bindings.set(resource.url,binding);}else{binding.addResource(resource);}}
_removeFrameResources(frame){for(const resource of frame.resources()){if(!this._acceptsResource(resource)){continue;}
const binding=this._bindings.get(resource.url);if(binding._resources.size===1){binding.dispose();this._bindings.delete(resource.url);}else{binding.removeResource(resource);}}}
_frameWillNavigate(event){const frame=(event.data);this._removeFrameResources(frame);}
_frameDetached(event){const frame=(event.data);this._removeFrameResources(frame);}
_resetForTest(){for(const binding of this._bindings.values()){binding.dispose();}
this._bindings.clear();}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);for(const binding of this._bindings.values()){binding.dispose();}
this._bindings.clear();this._project.removeProject();}}
class Binding$1{constructor(project,resource){this._resources=new Set([resource]);this._project=project;this._uiSourceCode=this._project.createUISourceCode(resource.url,resource.contentType());this._uiSourceCode[symbol]=true;NetworkProject.setInitialFrameAttribution(this._uiSourceCode,resource.frameId);this._project.addUISourceCodeWithProvider(this._uiSourceCode,this,resourceMetadata(resource),resource.mimeType);this._edits=[];}
_inlineStyles(){const target=NetworkProject.targetForUISourceCode(this._uiSourceCode);const cssModel=target.model(CSSModel.CSSModel);const stylesheets=[];if(cssModel){for(const headerId of cssModel.styleSheetIdsForURL(this._uiSourceCode.url())){const header=cssModel.styleSheetHeaderForId(headerId);if(header){stylesheets.push(header);}}}
return stylesheets;}
_inlineScripts(){const target=NetworkProject.targetForUISourceCode(this._uiSourceCode);const debuggerModel=target.model(DebuggerModel.DebuggerModel);if(!debuggerModel){return[];}
return debuggerModel.scriptsForSourceURL(this._uiSourceCode.url());}
async _styleSheetChanged(stylesheet,edit){this._edits.push({stylesheet,edit});if(this._edits.length>1){return;}
const{content}=await this._uiSourceCode.requestContent();if(content!==null){await this._innerStyleSheetChanged(content);}
this._edits=[];}
async _innerStyleSheetChanged(content){const scripts=this._inlineScripts();const styles=this._inlineStyles();let text=new Text.Text(content);for(const data of this._edits){const edit=data.edit;if(!edit){continue;}
const stylesheet=data.stylesheet;const startLocation=stylesheet[offsetSymbol]||TextRange.TextRange.createFromLocation(stylesheet.startLine,stylesheet.startColumn);const oldRange=edit.oldRange.relativeFrom(startLocation.startLine,startLocation.startColumn);const newRange=edit.newRange.relativeFrom(startLocation.startLine,startLocation.startColumn);text=new Text.Text(text.replaceRange(oldRange,edit.newText));const updatePromises=[];for(const script of scripts){const scriptOffset=script[offsetSymbol]||TextRange.TextRange.createFromLocation(script.lineOffset,script.columnOffset);if(!scriptOffset.follows(oldRange)){continue;}
script[offsetSymbol]=scriptOffset.rebaseAfterTextEdit(oldRange,newRange);updatePromises.push(DebuggerWorkspaceBinding.instance().updateLocations(script));}
for(const style of styles){const styleOffset=style[offsetSymbol]||TextRange.TextRange.createFromLocation(style.startLine,style.startColumn);if(!styleOffset.follows(oldRange)){continue;}
style[offsetSymbol]=styleOffset.rebaseAfterTextEdit(oldRange,newRange);updatePromises.push(CSSWorkspaceBinding.instance().updateLocations(style));}
await Promise.all(updatePromises);}
this._uiSourceCode.addRevision(text.value());}
addResource(resource){this._resources.add(resource);NetworkProject.addFrameAttribution(this._uiSourceCode,resource.frameId);}
removeResource(resource){this._resources.delete(resource);NetworkProject.removeFrameAttribution(this._uiSourceCode,resource.frameId);}
dispose(){this._project.removeFile(this._uiSourceCode.url());}
contentURL(){return this._resources.firstValue().contentURL();}
contentType(){return this._resources.firstValue().contentType();}
contentEncoded(){return this._resources.firstValue().contentEncoded();}
requestContent(){return this._resources.firstValue().requestContent();}
searchInContent(query,caseSensitive,isRegex){return this._resources.firstValue().searchInContent(query,caseSensitive,isRegex);}}
const symbol=Symbol('Bindings.ResourceMapping._symbol');const offsetSymbol=Symbol('Bindings.ResourceMapping._offsetSymbol');var ResourceMapping$1=Object.freeze({__proto__:null,ResourceMapping:ResourceMapping,symbol:symbol,offsetSymbol:offsetSymbol});let breakpointManagerInstance;class BreakpointManager extends ObjectWrapper.ObjectWrapper{constructor(targetManager,workspace,debuggerWorkspaceBinding){super();this._storage=new Storage();this._workspace=workspace;this._targetManager=targetManager;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this._breakpointsForUISourceCode=new Map();this._breakpointByStorageId=new Map();this._workspace.addEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);this._workspace.addEventListener(Workspace.Events.UISourceCodeRemoved,this._uiSourceCodeRemoved,this);}
static instance(opts={forceNew:null,targetManager:null,workspace:null,debuggerWorkspaceBinding:null}){const{forceNew,targetManager,workspace,debuggerWorkspaceBinding}=opts;if(!breakpointManagerInstance||forceNew){if(!targetManager||!workspace||!debuggerWorkspaceBinding){throw new Error(`Unable to create settings: targetManager, workspace, and debuggerWorkspaceBinding must be provided: ${
                new Error().stack}`);}
breakpointManagerInstance=new BreakpointManager(targetManager,workspace,debuggerWorkspaceBinding);}
return breakpointManagerInstance;}
static _breakpointStorageId(url,lineNumber,columnNumber){if(!url){return'';}
return url+':'+lineNumber+':'+columnNumber;}
async copyBreakpoints(fromURL,toSourceCode){const breakpointItems=this._storage.breakpointItems(fromURL);for(const item of breakpointItems){await this.setBreakpoint(toSourceCode,item.lineNumber,item.columnNumber,item.condition,item.enabled);}}
_restoreBreakpoints(uiSourceCode){const url=uiSourceCode.url();if(!url){return;}
this._storage.mute();const breakpointItems=this._storage.breakpointItems(url);for(const item of breakpointItems){this._innerSetBreakpoint(uiSourceCode,item.lineNumber,item.columnNumber,item.condition,item.enabled);}
this._storage.unmute();}
_uiSourceCodeAdded(event){const uiSourceCode=(event.data);this._restoreBreakpoints(uiSourceCode);}
_uiSourceCodeRemoved(event){const uiSourceCode=(event.data);const breakpoints=this.breakpointLocationsForUISourceCode(uiSourceCode);breakpoints.forEach(bp=>bp.breakpoint.removeUISourceCode(uiSourceCode));}
async setBreakpoint(uiSourceCode,lineNumber,columnNumber,condition,enabled){let uiLocation=new UISourceCode.UILocation(uiSourceCode,lineNumber,columnNumber);const normalizedLocation=await this._debuggerWorkspaceBinding.normalizeUILocation(uiLocation);if(normalizedLocation.id()!==uiLocation.id()){Revealer.reveal(normalizedLocation);uiLocation=normalizedLocation;}
return this._innerSetBreakpoint(uiLocation.uiSourceCode,uiLocation.lineNumber,uiLocation.columnNumber,condition,enabled);}
_innerSetBreakpoint(uiSourceCode,lineNumber,columnNumber,condition,enabled){const itemId=BreakpointManager._breakpointStorageId(uiSourceCode.url(),lineNumber,columnNumber);let breakpoint=this._breakpointByStorageId.get(itemId);if(breakpoint){breakpoint._updateState(condition,enabled);breakpoint.addUISourceCode(uiSourceCode);breakpoint._updateBreakpoint();return breakpoint;}
breakpoint=new Breakpoint(this,uiSourceCode,uiSourceCode.url(),lineNumber,columnNumber,condition,enabled);this._breakpointByStorageId.set(itemId,breakpoint);return breakpoint;}
findBreakpoint(uiLocation){const breakpoints=this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);return breakpoints?(breakpoints.get(uiLocation.id()))||null:null;}
async possibleBreakpoints(uiSourceCode,textRange){const startLocationsPromise=DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,textRange.startLine,textRange.startColumn);const endLocationsPromise=DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,textRange.endLine,textRange.endColumn);const[startLocations,endLocations]=await Promise.all([startLocationsPromise,endLocationsPromise]);const endLocationByModel=new Map();for(const location of endLocations){endLocationByModel.set(location.debuggerModel,location);}
let startLocation=null;let endLocation=null;for(const location of startLocations){const endLocationCandidate=endLocationByModel.get(location.debuggerModel);if(endLocationCandidate){startLocation=location;endLocation=endLocationCandidate;break;}}
if(!startLocation||!endLocation){return Promise.resolve([]);}
return startLocation.debuggerModel.getPossibleBreakpoints(startLocation,endLocation,false).then(toUILocations.bind(this));async function toUILocations(locations){const sortedLocationsPromises=locations.map(location=>this._debuggerWorkspaceBinding.rawLocationToUILocation(location));let sortedLocations=await Promise.all(sortedLocationsPromises);sortedLocations=sortedLocations.filter(location=>location&&location.uiSourceCode===uiSourceCode);if(!sortedLocations.length){return[];}
sortedLocations.sort(UISourceCode.UILocation.comparator);let lastLocation=sortedLocations[0];const result=[lastLocation];for(const location of sortedLocations){if(location.id()!==lastLocation.id()){result.push(location);lastLocation=location;}}
return result;}}
breakpointLocationsForUISourceCode(uiSourceCode){const breakpoints=this._breakpointsForUISourceCode.get(uiSourceCode);return breakpoints?Array.from(breakpoints.values()):[];}
allBreakpointLocations(){const result=[];for(const breakpoints of this._breakpointsForUISourceCode.values()){result.push(...breakpoints.values());}
return result;}
_removeBreakpoint(breakpoint,removeFromStorage){if(removeFromStorage){this._storage._removeBreakpoint(breakpoint);}
this._breakpointByStorageId.delete(breakpoint._breakpointStorageId());}
_uiLocationAdded(breakpoint,uiLocation){let breakpoints=this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);if(!breakpoints){breakpoints=new Map();this._breakpointsForUISourceCode.set(uiLocation.uiSourceCode,breakpoints);}
const breakpointLocation={breakpoint:breakpoint,uiLocation:uiLocation};breakpoints.set(uiLocation.id(),breakpointLocation);this.dispatchEventToListeners(Events$1.BreakpointAdded,breakpointLocation);}
_uiLocationRemoved(breakpoint,uiLocation){const breakpoints=this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);if(!breakpoints){return;}
const breakpointLocation=breakpoints.get(uiLocation.id())||null;if(!breakpointLocation){return;}
breakpoints.delete(uiLocation.id());if(breakpoints.size===0){this._breakpointsForUISourceCode.delete(uiLocation.uiSourceCode);}
this.dispatchEventToListeners(Events$1.BreakpointRemoved,{breakpoint:breakpoint,uiLocation:uiLocation});}}
const Events$1={BreakpointAdded:Symbol('breakpoint-added'),BreakpointRemoved:Symbol('breakpoint-removed')};class Breakpoint{constructor(breakpointManager,primaryUISourceCode,url,lineNumber,columnNumber,condition,enabled){this._breakpointManager=breakpointManager;this._url=url;this._lineNumber=lineNumber;this._columnNumber=columnNumber;this._uiLocations=new Set();this._uiSourceCodes=new Set();this._condition;this._enabled;this._isRemoved;this._currentState=null;this._modelBreakpoints=new Map();this._updateState(condition,enabled);this.addUISourceCode(primaryUISourceCode);this._breakpointManager._targetManager.observeModels(DebuggerModel.DebuggerModel,this);}
async refreshInDebugger(){if(!this._isRemoved){const breakpoints=Array.from(this._modelBreakpoints.values());return Promise.all(breakpoints.map(breakpoint=>breakpoint._refreshBreakpoint()));}}
modelAdded(debuggerModel){const debuggerWorkspaceBinding=this._breakpointManager._debuggerWorkspaceBinding;this._modelBreakpoints.set(debuggerModel,new ModelBreakpoint(debuggerModel,this,debuggerWorkspaceBinding));}
modelRemoved(debuggerModel){const modelBreakpoint=this._modelBreakpoints.get(debuggerModel);this._modelBreakpoints.delete(debuggerModel);modelBreakpoint._cleanUpAfterDebuggerIsGone();modelBreakpoint._removeEventListeners();}
addUISourceCode(uiSourceCode){if(!this._uiSourceCodes.has(uiSourceCode)){this._uiSourceCodes.add(uiSourceCode);if(!this.bound()){this._breakpointManager._uiLocationAdded(this,this._defaultUILocation(uiSourceCode));}}}
clearUISourceCodes(){if(!this.bound()){this._removeAllUnboundLocations();}
this._uiSourceCodes.clear();}
removeUISourceCode(uiSourceCode){if(this._uiSourceCodes.has(uiSourceCode)){this._uiSourceCodes.delete(uiSourceCode);if(!this.bound()){this._breakpointManager._uiLocationRemoved(this,this._defaultUILocation(uiSourceCode));}}
if(this.bound()){for(const uiLocation of this._uiLocations){if(uiLocation.uiSourceCode===uiSourceCode){this._uiLocations.delete(uiLocation);this._breakpointManager._uiLocationRemoved(this,uiLocation);}}
if(!this.bound()&&!this._isRemoved){this._addAllUnboundLocations();}}}
url(){return this._url;}
lineNumber(){return this._lineNumber;}
columnNumber(){return this._columnNumber;}
_uiLocationAdded(uiLocation){if(this._isRemoved){return;}
if(!this.bound()){this._removeAllUnboundLocations();}
this._uiLocations.add(uiLocation);this._breakpointManager._uiLocationAdded(this,uiLocation);}
_uiLocationRemoved(uiLocation){if(this._uiLocations.has(uiLocation)){this._uiLocations.delete(uiLocation);this._breakpointManager._uiLocationRemoved(this,uiLocation);if(!this.bound()&&!this._isRemoved){this._addAllUnboundLocations();}}}
enabled(){return this._enabled;}
bound(){return this._uiLocations.size!==0;}
setEnabled(enabled){this._updateState(this._condition,enabled);}
condition(){return this._condition;}
setCondition(condition){this._updateState(condition,this._enabled);}
_updateState(condition,enabled){if(this._enabled===enabled&&this._condition===condition){return;}
this._enabled=enabled;this._condition=condition;this._breakpointManager._storage._updateBreakpoint(this);this._updateBreakpoint();}
_updateBreakpoint(){if(!this.bound()){this._removeAllUnboundLocations();if(!this._isRemoved){this._addAllUnboundLocations();}}
for(const modelBreakpoint of this._modelBreakpoints.values()){modelBreakpoint._scheduleUpdateInDebugger();}}
remove(keepInStorage){this._isRemoved=true;const removeFromStorage=!keepInStorage;for(const modelBreakpoint of this._modelBreakpoints.values()){modelBreakpoint._scheduleUpdateInDebugger();modelBreakpoint._removeEventListeners();}
this._breakpointManager._removeBreakpoint(this,removeFromStorage);this._breakpointManager._targetManager.unobserveModels(DebuggerModel.DebuggerModel,this);this.clearUISourceCodes();}
_breakpointStorageId(){return BreakpointManager._breakpointStorageId(this._url,this._lineNumber,this._columnNumber);}
_resetLocations(){this.clearUISourceCodes();for(const modelBreakpoint of this._modelBreakpoints.values()){modelBreakpoint._resetLocations();}}
_defaultUILocation(uiSourceCode){return uiSourceCode.uiLocation(this._lineNumber,this._columnNumber);}
_removeAllUnboundLocations(){for(const uiSourceCode of this._uiSourceCodes){this._breakpointManager._uiLocationRemoved(this,this._defaultUILocation(uiSourceCode));}}
_addAllUnboundLocations(){for(const uiSourceCode of this._uiSourceCodes){this._breakpointManager._uiLocationAdded(this,this._defaultUILocation(uiSourceCode));}}}
class ModelBreakpoint{constructor(debuggerModel,breakpoint,debuggerWorkspaceBinding){this._debuggerModel=debuggerModel;this._breakpoint=breakpoint;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this._liveLocations=new LiveLocationPool();this._uiLocations=new Map();this._debuggerModel.addEventListener(DebuggerModel.Events.DebuggerWasDisabled,this._cleanUpAfterDebuggerIsGone,this);this._debuggerModel.addEventListener(DebuggerModel.Events.DebuggerWasEnabled,this._scheduleUpdateInDebugger,this);this._hasPendingUpdate=false;this._isUpdating=false;this._cancelCallback=false;this._currentState=null;if(this._debuggerModel.debuggerEnabled()){this._scheduleUpdateInDebugger();}}
_resetLocations(){for(const uiLocation of this._uiLocations.values()){this._breakpoint._uiLocationRemoved(uiLocation);}
this._uiLocations.clear();this._liveLocations.disposeAll();}
_scheduleUpdateInDebugger(){if(this._isUpdating){this._hasPendingUpdate=true;return;}
this._isUpdating=true;this._updateInDebugger(this._didUpdateInDebugger.bind(this));}
_didUpdateInDebugger(){this._isUpdating=false;if(this._hasPendingUpdate){this._hasPendingUpdate=false;this._scheduleUpdateInDebugger();}}
_scriptDiverged(){for(const uiSourceCode of this._breakpoint._uiSourceCodes){const scriptFile=this._debuggerWorkspaceBinding.scriptFile(uiSourceCode,this._debuggerModel);if(scriptFile&&scriptFile.hasDivergedFromVM()){return true;}}
return false;}
async _updateInDebugger(callback){if(this._debuggerModel.target().isDisposed()){this._cleanUpAfterDebuggerIsGone();callback();return;}
const lineNumber=this._breakpoint._lineNumber;const columnNumber=this._breakpoint._columnNumber;const condition=this._breakpoint.condition();let debuggerLocation=null;for(const uiSourceCode of this._breakpoint._uiSourceCodes){const locations=await DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);debuggerLocation=locations.find(location=>location.debuggerModel===this._debuggerModel);if(debuggerLocation){break;}}
let newState;if(this._breakpoint._isRemoved||!this._breakpoint.enabled()||this._scriptDiverged()){newState=null;}else if(debuggerLocation&&debuggerLocation.script()){const script=debuggerLocation.script();if(script.sourceURL){newState=new Breakpoint.State(script.sourceURL,null,null,debuggerLocation.lineNumber,debuggerLocation.columnNumber,condition);}else{newState=new Breakpoint.State(null,script.scriptId,script.hash,debuggerLocation.lineNumber,debuggerLocation.columnNumber,condition);}}else if(this._breakpoint._currentState&&this._breakpoint._currentState.url){const position=this._breakpoint._currentState;newState=new Breakpoint.State(position.url,null,null,position.lineNumber,position.columnNumber,condition);}else if(this._breakpoint._uiSourceCodes.size>0){newState=new Breakpoint.State(this._breakpoint.url(),null,null,lineNumber,columnNumber,condition);}
if(this._debuggerId&&Breakpoint.State.equals(newState,this._currentState)){callback();return;}
this._breakpoint._currentState=newState;if(this._debuggerId){await this._refreshBreakpoint();callback();return;}
if(!newState){callback();return;}
let result;this._currentState=newState;if(newState.url){result=await this._debuggerModel.setBreakpointByURL(newState.url,newState.lineNumber,newState.columnNumber,newState.condition);}else if(newState.scriptId&&newState.scriptHash){result=await this._debuggerModel.setBreakpointInAnonymousScript(newState.scriptId,newState.scriptHash,newState.lineNumber,newState.columnNumber,newState.condition);}
if(result&&result.breakpointId){await this._didSetBreakpointInDebugger(callback,result.breakpointId,result.locations);}else{await this._didSetBreakpointInDebugger(callback,null,[]);}}
async _refreshBreakpoint(){if(!this._debuggerId){return;}
this._resetLocations();await this._debuggerModel.removeBreakpoint(this._debuggerId);this._didRemoveFromDebugger();this._currentState=null;this._scheduleUpdateInDebugger();}
async _didSetBreakpointInDebugger(callback,breakpointId,locations){if(this._cancelCallback){this._cancelCallback=false;callback();return;}
if(!breakpointId){this._breakpoint.remove(true);callback();return;}
this._debuggerId=breakpointId;this._debuggerModel.addBreakpointListener(this._debuggerId,this._breakpointResolved,this);for(const location of locations){if(!(await this._addResolvedLocation(location))){break;}}
callback();}
_didRemoveFromDebugger(){if(this._cancelCallback){this._cancelCallback=false;return;}
this._resetLocations();this._debuggerModel.removeBreakpointListener(this._debuggerId,this._breakpointResolved,this);delete this._debuggerId;}
async _breakpointResolved(event){await this._addResolvedLocation((event.data));}
async _locationUpdated(liveLocation){const oldUILocation=this._uiLocations.get(liveLocation);const uiLocation=await liveLocation.uiLocation();if(oldUILocation){this._breakpoint._uiLocationRemoved(oldUILocation);}
if(uiLocation){this._uiLocations.set(liveLocation,uiLocation);this._breakpoint._uiLocationAdded(uiLocation);}else{this._uiLocations.delete(liveLocation);}}
async _addResolvedLocation(location){const uiLocation=await this._debuggerWorkspaceBinding.rawLocationToUILocation(location);if(!uiLocation){return false;}
const breakpointLocation=this._breakpoint._breakpointManager.findBreakpoint(uiLocation);if(breakpointLocation&&breakpointLocation.breakpoint!==this._breakpoint){this._breakpoint.remove(false);return false;}
await this._debuggerWorkspaceBinding.createLiveLocation(location,this._locationUpdated.bind(this),this._liveLocations);return true;}
_cleanUpAfterDebuggerIsGone(){if(this._isUpdating){this._cancelCallback=true;}
this._resetLocations();this._currentState=null;if(this._debuggerId){this._didRemoveFromDebugger();}}
_removeEventListeners(){this._debuggerModel.removeEventListener(DebuggerModel.Events.DebuggerWasDisabled,this._cleanUpAfterDebuggerIsGone,this);this._debuggerModel.removeEventListener(DebuggerModel.Events.DebuggerWasEnabled,this._scheduleUpdateInDebugger,this);}}
Breakpoint.State=class{constructor(url,scriptId,scriptHash,lineNumber,columnNumber,condition){this.url=url;this.scriptId=scriptId;this.scriptHash=scriptHash;this.lineNumber=lineNumber;this.columnNumber=columnNumber;this.condition=condition;}
static equals(stateA,stateB){if(!stateA||!stateB){return false;}
return stateA.url===stateB.url&&stateA.scriptId===stateB.scriptId&&stateA.scriptHash===stateB.scriptHash&&stateA.lineNumber===stateB.lineNumber&&stateA.columnNumber===stateB.columnNumber&&stateA.condition===stateB.condition;}};class Storage{constructor(){this._setting=Settings.Settings.instance().createLocalSetting('breakpoints',[]);this._breakpoints=new Map();const items=(this._setting.get());for(const item of items){item.columnNumber=item.columnNumber||0;this._breakpoints.set(BreakpointManager._breakpointStorageId(item.url,item.lineNumber,item.columnNumber),item);}
this._muted;}
mute(){this._muted=true;}
unmute(){delete this._muted;}
breakpointItems(url){return Array.from(this._breakpoints.values()).filter(item=>item.url===url);}
_updateBreakpoint(breakpoint){if(this._muted||!breakpoint._breakpointStorageId()){return;}
this._breakpoints.set(breakpoint._breakpointStorageId(),new Storage.Item(breakpoint));this._save();}
_removeBreakpoint(breakpoint){if(!this._muted){this._breakpoints.delete(breakpoint._breakpointStorageId());this._save();}}
_save(){this._setting.set(Array.from(this._breakpoints.values()));}}
Storage.Item=class{constructor(breakpoint){this.url=breakpoint._url;this.lineNumber=breakpoint.lineNumber();this.columnNumber=breakpoint.columnNumber();this.condition=breakpoint.condition();this.enabled=breakpoint.enabled();}};let BreakpointLocation;var BreakpointManager$1=Object.freeze({__proto__:null,BreakpointManager:BreakpointManager,Events:Events$1,Breakpoint:Breakpoint,ModelBreakpoint:ModelBreakpoint,BreakpointLocation:BreakpointLocation});class ResourceScriptMapping{constructor(debuggerModel,workspace,debuggerWorkspaceBinding){this._debuggerModel=debuggerModel;this._workspace=workspace;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this._uiSourceCodeToScriptFile=new Map();this._projects=new Map();this._acceptedScripts=new Set();const runtimeModel=debuggerModel.runtimeModel();this._eventListeners=[this._debuggerModel.addEventListener(DebuggerModel.Events.ParsedScriptSource,event=>{this._parsedScriptSource(event);},this),this._debuggerModel.addEventListener(DebuggerModel.Events.GlobalObjectCleared,this._globalObjectCleared,this),runtimeModel.addEventListener(RuntimeModel.Events.ExecutionContextDestroyed,this._executionContextDestroyed,this),];}
_project(script){const prefix=script.isContentScript()?'js:extensions:':'js::';const projectId=prefix+this._debuggerModel.target().id()+':'+script.frameId;let project=this._projects.get(projectId);if(!project){const projectType=script.isContentScript()?Workspace.projectTypes.ContentScripts:Workspace.projectTypes.Network;project=new ContentProviderBasedProject(this._workspace,projectId,projectType,'',false);NetworkProject.setTargetForProject(project,this._debuggerModel.target());this._projects.set(projectId,project);}
return project;}
rawLocationToUILocation(rawLocation){const script=rawLocation.script();if(!script){return null;}
const project=this._project(script);const uiSourceCode=project.uiSourceCodeForURL(script.sourceURL);if(!uiSourceCode){return null;}
const scriptFile=this._uiSourceCodeToScriptFile.get(uiSourceCode);if(!scriptFile){return null;}
if((scriptFile.hasDivergedFromVM()&&!scriptFile.isMergingToVM())||scriptFile.isDivergingFromVM()){return null;}
if(!scriptFile._hasScripts([script])){return null;}
let lineNumber=rawLocation.lineNumber-(script.isInlineScriptWithSourceURL()?script.lineOffset:0);let columnNumber=rawLocation.columnNumber||0;if(script.hasWasmDisassembly()){lineNumber=script.wasmDisassemblyLine(columnNumber);columnNumber=0;}else if(script.isInlineScriptWithSourceURL()&&!lineNumber&&columnNumber){columnNumber-=script.columnOffset;}
return uiSourceCode.uiLocation(lineNumber,columnNumber);}
uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){const scriptFile=this._uiSourceCodeToScriptFile.get(uiSourceCode);if(!scriptFile){return[];}
const script=scriptFile._script;if(script.hasWasmDisassembly()){return[script.wasmByteLocation(lineNumber)];}
if(script.isInlineScriptWithSourceURL()){return[this._debuggerModel.createRawLocation(script,lineNumber+script.lineOffset,lineNumber?columnNumber:columnNumber+script.columnOffset)];}
return[this._debuggerModel.createRawLocation(script,lineNumber,columnNumber)];}
_acceptsScript(script){if(!script.sourceURL||script.isLiveEdit()||(script.isInlineScript()&&!script.hasSourceURL)){return false;}
if(script.isContentScript()&&!script.hasSourceURL){const parsedURL=new ParsedURL.ParsedURL(script.sourceURL);if(!parsedURL.isValid){return false;}}
return true;}
async _parsedScriptSource(event){const script=(event.data);if(!this._acceptsScript(script)){return;}
this._acceptedScripts.add(script);const originalContentProvider=script.originalContentProvider();const url=script.sourceURL;const project=this._project(script);const oldUISourceCode=project.uiSourceCodeForURL(url);if(oldUISourceCode){const scriptFile=this._uiSourceCodeToScriptFile.get(oldUISourceCode);await this._removeScript(scriptFile._script);}
const uiSourceCode=project.createUISourceCode(url,originalContentProvider.contentType());NetworkProject.setInitialFrameAttribution(uiSourceCode,script.frameId);const metadata=metadataForURL(this._debuggerModel.target(),script.frameId,url);const scriptFile=new ResourceScriptFile(this,uiSourceCode,[script]);this._uiSourceCodeToScriptFile.set(uiSourceCode,scriptFile);project.addUISourceCodeWithProvider(uiSourceCode,originalContentProvider,metadata,'text/javascript');await this._debuggerWorkspaceBinding.updateLocations(script);}
scriptFile(uiSourceCode){return this._uiSourceCodeToScriptFile.get(uiSourceCode)||null;}
async _removeScript(script){if(!this._acceptedScripts.has(script)){return;}
this._acceptedScripts.delete(script);const project=this._project(script);const uiSourceCode=(project.uiSourceCodeForURL(script.sourceURL));const scriptFile=this._uiSourceCodeToScriptFile.get(uiSourceCode);scriptFile.dispose();this._uiSourceCodeToScriptFile.delete(uiSourceCode);project.removeFile(script.sourceURL);await this._debuggerWorkspaceBinding.updateLocations(script);}
_executionContextDestroyed(event){const executionContext=(event.data);const scripts=this._debuggerModel.scriptsForExecutionContext(executionContext);for(const script of scripts){this._removeScript(script);}}
_globalObjectCleared(event){const scripts=Array.from(this._acceptedScripts);for(const script of scripts){this._removeScript(script);}}
resetForTest(){const scripts=Array.from(this._acceptedScripts);for(const script of scripts){this._removeScript(script);}}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);const scripts=Array.from(this._acceptedScripts);for(const script of scripts){this._removeScript(script);}
for(const project of this._projects.values()){project.removeProject();}
this._projects.clear();}}
class ResourceScriptFile extends ObjectWrapper.ObjectWrapper{constructor(resourceScriptMapping,uiSourceCode,scripts){super();console.assert(scripts.length);this._resourceScriptMapping=resourceScriptMapping;this._uiSourceCode=uiSourceCode;if(this._uiSourceCode.contentType().isScript()){this._script=scripts[scripts.length-1];}
this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._workingCopyChanged,this);this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._workingCopyCommitted,this);}
_hasScripts(scripts){return this._script&&this._script===scripts[0];}
_isDiverged(){if(this._uiSourceCode.isDirty()){return true;}
if(!this._script){return false;}
if(typeof this._scriptSource==='undefined'){return false;}
const workingCopy=this._uiSourceCode.workingCopy();if(!workingCopy){return false;}
if(!workingCopy.startsWith(this._scriptSource.trimRight())){return true;}
const suffix=this._uiSourceCode.workingCopy().substr(this._scriptSource.length);return!!suffix.length&&!suffix.match(Script.sourceURLRegex);}
_workingCopyChanged(event){this._update();}
_workingCopyCommitted(event){if(this._uiSourceCode.project().canSetFileContent()){return;}
if(!this._script){return;}
const debuggerModel=this._resourceScriptMapping._debuggerModel;const breakpoints=BreakpointManager.instance().breakpointLocationsForUISourceCode(this._uiSourceCode).map(breakpointLocation=>breakpointLocation.breakpoint);const source=this._uiSourceCode.workingCopy();debuggerModel.setScriptSource(this._script.scriptId,source,scriptSourceWasSet.bind(this));async function scriptSourceWasSet(error,exceptionDetails){if(!error&&!exceptionDetails){this._scriptSource=source;}
await this._update();if(!error&&!exceptionDetails){await Promise.all(breakpoints.map(breakpoint=>breakpoint.refreshInDebugger()));return;}
if(!exceptionDetails){Console.Console.instance().addMessage(UIString.UIString('LiveEdit failed: %s',error),Console.MessageLevel.Warning);return;}
const messageText=UIString.UIString('LiveEdit compile failed: %s',exceptionDetails.text);this._uiSourceCode.addLineMessage(UISourceCode.Message.Level.Error,messageText,exceptionDetails.lineNumber,exceptionDetails.columnNumber);}}
async _update(){if(this._isDiverged()&&!this._hasDivergedFromVM){await this._divergeFromVM();}else if(!this._isDiverged()&&this._hasDivergedFromVM){await this._mergeToVM();}}
async _divergeFromVM(){this._isDivergingFromVM=true;await this._resourceScriptMapping._debuggerWorkspaceBinding.updateLocations(this._script);delete this._isDivergingFromVM;this._hasDivergedFromVM=true;this.dispatchEventToListeners(ResourceScriptFile.Events.DidDivergeFromVM,this._uiSourceCode);}
async _mergeToVM(){delete this._hasDivergedFromVM;this._isMergingToVM=true;await this._resourceScriptMapping._debuggerWorkspaceBinding.updateLocations(this._script);delete this._isMergingToVM;this.dispatchEventToListeners(ResourceScriptFile.Events.DidMergeToVM,this._uiSourceCode);}
hasDivergedFromVM(){return this._hasDivergedFromVM;}
isDivergingFromVM(){return this._isDivergingFromVM;}
isMergingToVM(){return this._isMergingToVM;}
checkMapping(){if(!this._script||typeof this._scriptSource!=='undefined'){this._mappingCheckedForTest();return;}
this._script.requestContent().then(deferredContent=>{this._scriptSource=deferredContent.content;this._update().then(()=>this._mappingCheckedForTest());});}
_mappingCheckedForTest(){}
dispose(){this._uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyChanged,this._workingCopyChanged,this);this._uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyCommitted,this._workingCopyCommitted,this);}
addSourceMapURL(sourceMapURL){if(!this._script){return;}
this._script.debuggerModel.setSourceMapURL(this._script,sourceMapURL);}
hasSourceMapURL(){return this._script&&!!this._script.sourceMapURL;}}
ResourceScriptFile.Events={DidMergeToVM:Symbol('DidMergeToVM'),DidDivergeFromVM:Symbol('DidDivergeFromVM'),};var ResourceScriptMapping$1=Object.freeze({__proto__:null,ResourceScriptMapping:ResourceScriptMapping,ResourceScriptFile:ResourceScriptFile});let debuggerWorkspaceBindingInstance;class DebuggerWorkspaceBinding{constructor(targetManager,workspace){this._workspace=workspace;this._sourceMappings=[];this._debuggerModelToData=new Map();targetManager.addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.GlobalObjectCleared,this._globalObjectCleared,this);targetManager.addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerResumed,this._debuggerResumed,this);targetManager.observeModels(DebuggerModel.DebuggerModel,this);this._liveLocationPromises=new Set();}
static instance(opts={forceNew:null,targetManager:null,workspace:null}){const{forceNew,targetManager,workspace}=opts;if(!debuggerWorkspaceBindingInstance||forceNew){if(!targetManager||!workspace){throw new Error(`Unable to create settings: targetManager and workspace must be provided: ${new Error().stack}`);}
debuggerWorkspaceBindingInstance=new DebuggerWorkspaceBinding(targetManager,workspace);}
return debuggerWorkspaceBindingInstance;}
addSourceMapping(sourceMapping){this._sourceMappings.push(sourceMapping);}
modelAdded(debuggerModel){this._debuggerModelToData.set(debuggerModel,new ModelData(debuggerModel,this));}
modelRemoved(debuggerModel){const modelData=this._debuggerModelToData.get(debuggerModel);modelData._dispose();this._debuggerModelToData.delete(debuggerModel);}
getLanguagePluginManager(debuggerModel){const modelData=this._debuggerModelToData.get(debuggerModel);if(!modelData){return null;}
return modelData.pluginManager;}
pendingLiveLocationChangesPromise(){return Promise.all(this._liveLocationPromises);}
_recordLiveLocationChange(promise){promise.then(()=>{this._liveLocationPromises.delete(promise);});this._liveLocationPromises.add(promise);}
async updateLocations(script){const modelData=this._debuggerModelToData.get(script.debuggerModel);if(modelData){const updatePromise=modelData._updateLocations(script);this._recordLiveLocationChange(updatePromise);await updatePromise;}}
createLiveLocation(rawLocation,updateDelegate,locationPool){const modelData=this._debuggerModelToData.get(rawLocation.script().debuggerModel);const liveLocationPromise=modelData._createLiveLocation(rawLocation,updateDelegate,locationPool);this._recordLiveLocationChange(liveLocationPromise);return liveLocationPromise;}
async createStackTraceTopFrameLiveLocation(rawLocations,updateDelegate,locationPool){console.assert(rawLocations.length);const locationPromise=StackTraceTopFrameLocation.createStackTraceTopFrameLocation(rawLocations,this,updateDelegate,locationPool);this._recordLiveLocationChange(locationPromise);return locationPromise;}
async createCallFrameLiveLocation(location,updateDelegate,locationPool){const script=location.script();if(!script){return null;}
const debuggerModel=location.debuggerModel;const liveLocationPromise=this.createLiveLocation(location,updateDelegate,locationPool);this._recordLiveLocationChange(liveLocationPromise);const liveLocation=await liveLocationPromise;this._registerCallFrameLiveLocation(debuggerModel,liveLocation);return liveLocation;}
async rawLocationToUILocation(rawLocation){for(const sourceMapping of this._sourceMappings){const uiLocation=sourceMapping.rawLocationToUILocation(rawLocation);if(uiLocation){return uiLocation;}}
const modelData=this._debuggerModelToData.get(rawLocation.debuggerModel);return modelData?modelData._rawLocationToUILocation(rawLocation):null;}
uiSourceCodeForSourceMapSourceURL(debuggerModel,url,isContentScript){const modelData=this._debuggerModelToData.get(debuggerModel);if(!modelData){return null;}
return modelData._compilerMapping.uiSourceCodeForURL(url,isContentScript);}
async uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){for(const sourceMapping of this._sourceMappings){const locations=sourceMapping.uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);if(locations.length){return locations;}}
const locationsPromises=[];for(const modelData of this._debuggerModelToData.values()){locationsPromises.push(modelData._uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber));}
return(await Promise.all(locationsPromises)).flat();}
uiLocationToRawLocationsForUnformattedJavaScript(uiSourceCode,lineNumber,columnNumber){console.assert(uiSourceCode.contentType().isScript());const locations=[];for(const modelData of this._debuggerModelToData.values()){locations.push(...modelData._uiLocationToRawLocationsExcludeAsync(uiSourceCode,lineNumber,columnNumber));}
return locations;}
async normalizeUILocation(uiLocation){const rawLocations=await this.uiLocationToRawLocations(uiLocation.uiSourceCode,uiLocation.lineNumber,uiLocation.columnNumber);for(const location of rawLocations){const uiLocationCandidate=await this.rawLocationToUILocation(location);if(uiLocationCandidate){return uiLocationCandidate;}}
return uiLocation;}
scriptFile(uiSourceCode,debuggerModel){const modelData=this._debuggerModelToData.get(debuggerModel);return modelData?modelData._resourceMapping.scriptFile(uiSourceCode):null;}
sourceMapForScript(script){const modelData=this._debuggerModelToData.get(script.debuggerModel);if(!modelData){return null;}
return modelData._compilerMapping.sourceMapForScript(script);}
_globalObjectCleared(event){const debuggerModel=(event.data);this._reset(debuggerModel);}
_reset(debuggerModel){const modelData=this._debuggerModelToData.get(debuggerModel);for(const location of modelData.callFrameLocations.values()){this._removeLiveLocation(location);}
modelData.callFrameLocations.clear();}
_resetForTest(target){const debuggerModel=(target.model(DebuggerModel.DebuggerModel));const modelData=this._debuggerModelToData.get(debuggerModel);modelData._resourceMapping.resetForTest();}
_registerCallFrameLiveLocation(debuggerModel,location){const locations=this._debuggerModelToData.get(debuggerModel).callFrameLocations;locations.add(location);}
_removeLiveLocation(location){const modelData=this._debuggerModelToData.get(location._script.debuggerModel);if(modelData){modelData._disposeLocation(location);}}
_debuggerResumed(event){const debuggerModel=(event.data);this._reset(debuggerModel);}}
class ModelData{constructor(debuggerModel,debuggerWorkspaceBinding){this._debuggerModel=debuggerModel;this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;this.callFrameLocations=new Set();const workspace=debuggerWorkspaceBinding._workspace;if(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')){this._pluginManager=new DebuggerLanguagePluginManager(debuggerModel,workspace,debuggerWorkspaceBinding);this._pluginManager.addPlugin(new CXXDWARFLanguagePlugin());}
this._defaultMapping=new DefaultScriptMapping(debuggerModel,workspace,debuggerWorkspaceBinding);this._resourceMapping=new ResourceScriptMapping(debuggerModel,workspace,debuggerWorkspaceBinding);this._compilerMapping=new CompilerScriptMapping(debuggerModel,workspace,debuggerWorkspaceBinding);this._locations=new Platform.Multimap();debuggerModel.setBeforePausedCallback(this._beforePaused.bind(this));}
get pluginManager(){return this._pluginManager||null;}
async _createLiveLocation(rawLocation,updateDelegate,locationPool){const script=(rawLocation.script());console.assert(script);const location=new Location(script,rawLocation,this._debuggerWorkspaceBinding,updateDelegate,locationPool);this._locations.set(script,location);await location.update();return location;}
_disposeLocation(location){this._locations.delete(location._script,location);}
async _updateLocations(script){const promises=[];for(const location of this._locations.get(script)){promises.push(location.update());}
return Promise.all(promises);}
async _rawLocationToUILocation(rawLocation){let uiLocation=null;if(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')){uiLocation=await this._pluginManager.rawLocationToUILocation(rawLocation);}
uiLocation=uiLocation||this._compilerMapping.rawLocationToUILocation(rawLocation);uiLocation=uiLocation||this._resourceMapping.rawLocationToUILocation(rawLocation);uiLocation=uiLocation||ResourceMapping.instance().jsLocationToUILocation(rawLocation);uiLocation=uiLocation||this._defaultMapping.rawLocationToUILocation(rawLocation);return(uiLocation);}
async _uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){let rawLocations=null;if(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')){rawLocations=await this._pluginManager.uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);}
rawLocations=rawLocations||this._uiLocationToRawLocationsExcludeAsync(uiSourceCode,lineNumber,columnNumber);return rawLocations;}
_uiLocationToRawLocationsExcludeAsync(uiSourceCode,lineNumber,columnNumber){let locations=this._compilerMapping.uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);locations=locations.length?locations:this._resourceMapping.uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);locations=locations.length?locations:ResourceMapping.instance().uiLocationToJSLocations(uiSourceCode,lineNumber,columnNumber);locations=locations.length?locations:this._defaultMapping.uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber);return locations;}
_beforePaused(debuggerPausedDetails){const callFrame=debuggerPausedDetails.callFrames[0];if(callFrame.script.sourceMapURL!==SourceMap.WasmSourceMap.FAKE_URL&&!Root.Runtime.experiments.isEnabled('emptySourceMapAutoStepping')){return true;}
return!!this._compilerMapping.mapsToSourceCode(callFrame.location());}
_dispose(){this._debuggerModel.setBeforePausedCallback(null);this._compilerMapping.dispose();this._resourceMapping.dispose();this._defaultMapping.dispose();}}
class Location extends LiveLocationWithPool{constructor(script,rawLocation,binding,updateDelegate,locationPool){super(updateDelegate,locationPool);this._script=script;this._rawLocation=rawLocation;this._binding=binding;}
async uiLocation(){const debuggerModelLocation=this._rawLocation;return this._binding.rawLocationToUILocation(debuggerModelLocation);}
dispose(){super.dispose();this._binding._removeLiveLocation(this);}
async isBlackboxed(){const uiLocation=await this.uiLocation();return uiLocation?BlackboxManager.instance().isBlackboxedUISourceCode(uiLocation.uiSourceCode):false;}}
class StackTraceTopFrameLocation extends LiveLocationWithPool{constructor(updateDelegate,locationPool){super(updateDelegate,locationPool);this._updateScheduled=true;this._current=null;this._locations=null;}
static async createStackTraceTopFrameLocation(rawLocations,binding,updateDelegate,locationPool){const location=new StackTraceTopFrameLocation(updateDelegate,locationPool);const locationsPromises=rawLocations.map(rawLocation=>binding.createLiveLocation(rawLocation,location._scheduleUpdate.bind(location),locationPool));location._locations=await Promise.all(locationsPromises);await location._updateLocation();return location;}
async uiLocation(){return this._current?this._current.uiLocation():null;}
async isBlackboxed(){return this._current?this._current.isBlackboxed():false;}
dispose(){super.dispose();if(this._locations){for(const location of this._locations){location.dispose();}}
this._locations=null;this._current=null;}
_scheduleUpdate(){if(this._updateScheduled){return;}
this._updateScheduled=true;setImmediate(this._updateLocation.bind(this));}
async _updateLocation(){this._updateScheduled=false;if(!this._locations||this._locations.length===0){return;}
this._current=this._locations[0];for(const location of this._locations){if(!(await location.isBlackboxed())){this._current=location;break;}}
this.update();}}
class DebuggerSourceMapping{rawLocationToUILocation(rawLocation){}
uiLocationToRawLocations(uiSourceCode,lineNumber,columnNumber){}}
var DebuggerWorkspaceBinding$1=Object.freeze({__proto__:null,DebuggerWorkspaceBinding:DebuggerWorkspaceBinding,DebuggerSourceMapping:DebuggerSourceMapping});let blackboxManagerInstance;class BlackboxManager{constructor(debuggerWorkspaceBinding){this._debuggerWorkspaceBinding=debuggerWorkspaceBinding;SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.GlobalObjectCleared,this._clearCacheIfNeeded.bind(this),this);Settings.Settings.instance().moduleSetting('skipStackFramesPattern').addChangeListener(this._patternChanged.bind(this));Settings.Settings.instance().moduleSetting('skipContentScripts').addChangeListener(this._patternChanged.bind(this));this._listeners=new Set();this._isBlackboxedURLCache=new Map();SDKModel.TargetManager.instance().observeModels(DebuggerModel.DebuggerModel,this);}
static instance(opts={forceNew:null,debuggerWorkspaceBinding:null}){const{forceNew,debuggerWorkspaceBinding}=opts;if(!blackboxManagerInstance||forceNew){if(!debuggerWorkspaceBinding){throw new Error(`Unable to create settings: targetManager, workspace, and debuggerWorkspaceBinding must be provided: ${
                new Error().stack}`);}
blackboxManagerInstance=new BlackboxManager(debuggerWorkspaceBinding);}
return blackboxManagerInstance;}
addChangeListener(listener){this._listeners.add(listener);}
removeChangeListener(listener){this._listeners.delete(listener);}
modelAdded(debuggerModel){this._setBlackboxPatterns(debuggerModel);const sourceMapManager=debuggerModel.sourceMapManager();sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapAttached,this._sourceMapAttached,this);sourceMapManager.addEventListener(SourceMapManager.Events.SourceMapDetached,this._sourceMapDetached,this);}
modelRemoved(debuggerModel){this._clearCacheIfNeeded();const sourceMapManager=debuggerModel.sourceMapManager();sourceMapManager.removeEventListener(SourceMapManager.Events.SourceMapAttached,this._sourceMapAttached,this);sourceMapManager.removeEventListener(SourceMapManager.Events.SourceMapDetached,this._sourceMapDetached,this);}
_clearCacheIfNeeded(){if(this._isBlackboxedURLCache.size>1024){this._isBlackboxedURLCache.clear();}}
_setBlackboxPatterns(debuggerModel){const regexPatterns=Settings.Settings.instance().moduleSetting('skipStackFramesPattern').getAsArray();const patterns=([]);for(const item of regexPatterns){if(!item.disabled&&item.pattern){patterns.push(item.pattern);}}
return debuggerModel.setBlackboxPatterns(patterns);}
isBlackboxedUISourceCode(uiSourceCode){const projectType=uiSourceCode.project().type();const isContentScript=projectType===Workspace.projectTypes.ContentScripts;if(isContentScript&&Settings.Settings.instance().moduleSetting('skipContentScripts').get()){return true;}
const url=this._uiSourceCodeURL(uiSourceCode);return url?this.isBlackboxedURL(url):false;}
isBlackboxedURL(url,isContentScript){if(this._isBlackboxedURLCache.has(url)){return!!this._isBlackboxedURLCache.get(url);}
if(isContentScript&&Settings.Settings.instance().moduleSetting('skipContentScripts').get()){return true;}
const regex=Settings.Settings.instance().moduleSetting('skipStackFramesPattern').asRegExp();const isBlackboxed=(regex&&regex.test(url))||false;this._isBlackboxedURLCache.set(url,isBlackboxed);return isBlackboxed;}
_sourceMapAttached(event){const script=(event.data.client);const sourceMap=(event.data.sourceMap);this._updateScriptRanges(script,sourceMap);}
_sourceMapDetached(event){const script=(event.data.client);this._updateScriptRanges(script,null);}
async _updateScriptRanges(script,sourceMap){let hasBlackboxedMappings=false;if(!BlackboxManager.instance().isBlackboxedURL(script.sourceURL,script.isContentScript())){hasBlackboxedMappings=sourceMap?sourceMap.sourceURLs().some(url=>this.isBlackboxedURL(url)):false;}
if(!hasBlackboxedMappings){if(script[_blackboxedRanges]&&await script.setBlackboxedRanges([])){delete script[_blackboxedRanges];}
await this._debuggerWorkspaceBinding.updateLocations(script);return;}
const mappings=sourceMap.mappings();const newRanges=[];let currentBlackboxed=false;if(mappings[0].lineNumber!==0||mappings[0].columnNumber!==0){newRanges.push({lineNumber:0,columnNumber:0});currentBlackboxed=true;}
for(const mapping of mappings){if(mapping.sourceURL&&currentBlackboxed!==this.isBlackboxedURL(mapping.sourceURL)){newRanges.push({lineNumber:mapping.lineNumber,columnNumber:mapping.columnNumber});currentBlackboxed=!currentBlackboxed;}}
const oldRanges=script[_blackboxedRanges]||[];if(!isEqual(oldRanges,newRanges)&&await script.setBlackboxedRanges(newRanges)){script[_blackboxedRanges]=newRanges;}
this._debuggerWorkspaceBinding.updateLocations(script);function isEqual(rangesA,rangesB){if(rangesA.length!==rangesB.length){return false;}
for(let i=0;i<rangesA.length;++i){if(rangesA[i].lineNumber!==rangesB[i].lineNumber||rangesA[i].columnNumber!==rangesB[i].columnNumber){return false;}}
return true;}}
_uiSourceCodeURL(uiSourceCode){return uiSourceCode.project().type()===Workspace.projectTypes.Debugger?null:uiSourceCode.url();}
canBlackboxUISourceCode(uiSourceCode){const url=this._uiSourceCodeURL(uiSourceCode);return url?!!this._urlToRegExpString(url):false;}
blackboxUISourceCode(uiSourceCode){const url=this._uiSourceCodeURL(uiSourceCode);if(url){this._blackboxURL(url);}}
unblackboxUISourceCode(uiSourceCode){const url=this._uiSourceCodeURL(uiSourceCode);if(url){this._unblackboxURL(url);}}
blackboxContentScripts(){Settings.Settings.instance().moduleSetting('skipContentScripts').set(true);}
unblackboxContentScripts(){Settings.Settings.instance().moduleSetting('skipContentScripts').set(false);}
_blackboxURL(url){const regexPatterns=Settings.Settings.instance().moduleSetting('skipStackFramesPattern').getAsArray();const regexValue=this._urlToRegExpString(url);if(!regexValue){return;}
let found=false;for(let i=0;i<regexPatterns.length;++i){const item=regexPatterns[i];if(item.pattern===regexValue){item.disabled=false;found=true;break;}}
if(!found){regexPatterns.push({pattern:regexValue});}
Settings.Settings.instance().moduleSetting('skipStackFramesPattern').setAsArray(regexPatterns);}
_unblackboxURL(url){let regexPatterns=Settings.Settings.instance().moduleSetting('skipStackFramesPattern').getAsArray();const regexValue=BlackboxManager.instance()._urlToRegExpString(url);if(!regexValue){return;}
regexPatterns=regexPatterns.filter(function(item){return item.pattern!==regexValue;});for(let i=0;i<regexPatterns.length;++i){const item=regexPatterns[i];if(item.disabled){continue;}
try{const regex=new RegExp(item.pattern);if(regex.test(url)){item.disabled=true;}}catch(e){}}
Settings.Settings.instance().moduleSetting('skipStackFramesPattern').setAsArray(regexPatterns);}
async _patternChanged(){this._isBlackboxedURLCache.clear();const promises=[];for(const debuggerModel of SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel)){promises.push(this._setBlackboxPatterns(debuggerModel));const sourceMapManager=debuggerModel.sourceMapManager();for(const script of debuggerModel.scripts()){promises.push(this._updateScriptRanges(script,sourceMapManager.sourceMapForClient(script)));}}
await Promise.all(promises);const listeners=Array.from(this._listeners);for(const listener of listeners){listener();}
this._patternChangeFinishedForTests();}
_patternChangeFinishedForTests(){}
_urlToRegExpString(url){const parsedURL=new ParsedURL.ParsedURL(url);if(parsedURL.isAboutBlank()||parsedURL.isDataURL()){return'';}
if(!parsedURL.isValid){return'^'+url.escapeForRegExp()+'$';}
let name=parsedURL.lastPathComponent;if(name){name='/'+name;}else if(parsedURL.folderPathComponents){name=parsedURL.folderPathComponents+'/';}
if(!name){name=parsedURL.host;}
if(!name){return'';}
const scheme=parsedURL.scheme;let prefix='';if(scheme&&scheme!=='http'&&scheme!=='https'){prefix='^'+scheme+'://';if(scheme==='chrome-extension'){prefix+=parsedURL.host+'\\b';}
prefix+='.*';}
return prefix+name.escapeForRegExp()+(url.endsWith(name)?'$':'\\b');}}
const _blackboxedRanges=Symbol('blackboxedRanged');var BlackboxManager$1=Object.freeze({__proto__:null,BlackboxManager:BlackboxManager});class ChunkedReader{fileSize(){}
loadedSize(){}
fileName(){}
cancel(){}
error(){}}
class ChunkedFileReader{constructor(blob,chunkSize,chunkTransferredCallback){this._file=blob;this._fileSize=blob.size;this._loadedSize=0;this._chunkSize=chunkSize;this._chunkTransferredCallback=chunkTransferredCallback;this._decoder=new TextDecoder();this._isCanceled=false;this._error=null;}
read(output){if(this._chunkTransferredCallback){this._chunkTransferredCallback(this);}
this._output=output;this._reader=new FileReader();this._reader.onload=this._onChunkLoaded.bind(this);this._reader.onerror=this._onError.bind(this);this._loadChunk();return new Promise(resolve=>this._transferFinished=resolve);}
cancel(){this._isCanceled=true;}
loadedSize(){return this._loadedSize;}
fileSize(){return this._fileSize;}
fileName(){return this._file.name;}
error(){return this._error;}
_onChunkLoaded(event){if(this._isCanceled){return;}
if(event.target.readyState!==FileReader.DONE){return;}
const buffer=this._reader.result;this._loadedSize+=buffer.byteLength;const endOfFile=this._loadedSize===this._fileSize;const decodedString=this._decoder.decode(buffer,{stream:!endOfFile});this._output.write(decodedString);if(this._isCanceled){return;}
if(this._chunkTransferredCallback){this._chunkTransferredCallback(this);}
if(endOfFile){this._file=null;this._reader=null;this._output.close();this._transferFinished(!this._error);return;}
this._loadChunk();}
_loadChunk(){const chunkStart=this._loadedSize;const chunkEnd=Math.min(this._fileSize,chunkStart+this._chunkSize);const nextPart=this._file.slice(chunkStart,chunkEnd);this._reader.readAsArrayBuffer(nextPart);}
_onError(event){this._error=event.target.error;this._transferFinished(false);}}
class FileOutputStream{async open(fileName){this._closed=false;this._writeCallbacks=[];this._fileName=fileName;const saveResponse=await self.Workspace.fileManager.save(this._fileName,'',true);if(saveResponse){self.Workspace.fileManager.addEventListener(FileManager.Events.AppendedToURL,this._onAppendDone,this);}
return!!saveResponse;}
write(data){return new Promise(resolve=>{this._writeCallbacks.push(resolve);self.Workspace.fileManager.append(this._fileName,data);});}
async close(){this._closed=true;if(this._writeCallbacks.length){return;}
self.Workspace.fileManager.removeEventListener(FileManager.Events.AppendedToURL,this._onAppendDone,this);self.Workspace.fileManager.close(this._fileName);}
_onAppendDone(event){if(event.data!==this._fileName){return;}
this._writeCallbacks.shift()();if(this._writeCallbacks.length){return;}
if(!this._closed){return;}
self.Workspace.fileManager.removeEventListener(FileManager.Events.AppendedToURL,this._onAppendDone,this);self.Workspace.fileManager.close(this._fileName);}}
var FileUtils=Object.freeze({__proto__:null,ChunkedReader:ChunkedReader,ChunkedFileReader:ChunkedFileReader,FileOutputStream:FileOutputStream});class PresentationConsoleMessageManager{constructor(){SDKModel.TargetManager.instance().observeModels(DebuggerModel.DebuggerModel,this);ConsoleModel.ConsoleModel.instance().addEventListener(ConsoleModel.Events.ConsoleCleared,this._consoleCleared,this);ConsoleModel.ConsoleModel.instance().addEventListener(ConsoleModel.Events.MessageAdded,event=>this._consoleMessageAdded((event.data)));ConsoleModel.ConsoleModel.instance().messages().forEach(this._consoleMessageAdded,this);}
modelAdded(debuggerModel){debuggerModel[PresentationConsoleMessageManager._symbol]=new PresentationConsoleMessageHelper(debuggerModel);}
modelRemoved(debuggerModel){debuggerModel[PresentationConsoleMessageManager._symbol]._consoleCleared();}
_consoleMessageAdded(message){if(!message.isErrorOrWarning()||!message.runtimeModel()||message.source===ConsoleModel.MessageSource.Violation){return;}
const debuggerModel=message.runtimeModel().debuggerModel();debuggerModel[PresentationConsoleMessageManager._symbol]._consoleMessageAdded(message);}
_consoleCleared(){for(const debuggerModel of SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel)){debuggerModel[PresentationConsoleMessageManager._symbol]._consoleCleared();}}}
PresentationConsoleMessageManager._symbol=Symbol('PresentationConsoleMessageHelper');class PresentationConsoleMessageHelper{constructor(debuggerModel){this._debuggerModel=debuggerModel;this._pendingConsoleMessages={};this._presentationConsoleMessages=[];debuggerModel.addEventListener(DebuggerModel.Events.ParsedScriptSource,event=>{setImmediate(this._parsedScriptSource.bind(this,event));});debuggerModel.addEventListener(DebuggerModel.Events.GlobalObjectCleared,this._debuggerReset,this);this._locationPool=new LiveLocationPool();}
_consoleMessageAdded(message){const rawLocation=this._rawLocation(message);if(rawLocation){this._addConsoleMessageToScript(message,rawLocation);}else{this._addPendingConsoleMessage(message);}}
_rawLocation(message){if(message.scriptId){return this._debuggerModel.createRawLocationByScriptId(message.scriptId,message.line,message.column);}
const callFrame=message.stackTrace&&message.stackTrace.callFrames?message.stackTrace.callFrames[0]:null;if(callFrame){return this._debuggerModel.createRawLocationByScriptId(callFrame.scriptId,callFrame.lineNumber,callFrame.columnNumber);}
if(message.url){return this._debuggerModel.createRawLocationByURL(message.url,message.line,message.column);}
return null;}
_addConsoleMessageToScript(message,rawLocation){this._presentationConsoleMessages.push(new PresentationConsoleMessage(message,rawLocation,this._locationPool));}
_addPendingConsoleMessage(message){if(!message.url){return;}
if(!this._pendingConsoleMessages[message.url]){this._pendingConsoleMessages[message.url]=[];}
this._pendingConsoleMessages[message.url].push(message);}
_parsedScriptSource(event){const script=(event.data);const messages=this._pendingConsoleMessages[script.sourceURL];if(!messages){return;}
const pendingMessages=[];for(let i=0;i<messages.length;i++){const message=messages[i];const rawLocation=this._rawLocation(message);if(!rawLocation){continue;}
if(script.scriptId===rawLocation.scriptId){this._addConsoleMessageToScript(message,rawLocation);}else{pendingMessages.push(message);}}
if(pendingMessages.length){this._pendingConsoleMessages[script.sourceURL]=pendingMessages;}else{delete this._pendingConsoleMessages[script.sourceURL];}}
_consoleCleared(){this._pendingConsoleMessages={};this._debuggerReset();}
_debuggerReset(){for(const message of this._presentationConsoleMessages){message.dispose();}
this._presentationConsoleMessages=[];this._locationPool.disposeAll();}}
class PresentationConsoleMessage{constructor(message,rawLocation,locationPool){this._text=message.messageText;this._level=message.level===ConsoleModel.MessageLevel.Error?UISourceCode.Message.Level.Error:UISourceCode.Message.Level.Warning;DebuggerWorkspaceBinding.instance().createLiveLocation(rawLocation,this._updateLocation.bind(this),locationPool);}
async _updateLocation(liveLocation){if(this._uiMessage){this._uiMessage.remove();}
const uiLocation=await liveLocation.uiLocation();if(!uiLocation){return;}
this._uiMessage=uiLocation.uiSourceCode.addLineMessage(this._level,this._text,uiLocation.lineNumber,uiLocation.columnNumber);}
dispose(){if(this._uiMessage){this._uiMessage.remove();}}}
var PresentationConsoleMessageHelper$1=Object.freeze({__proto__:null,PresentationConsoleMessageManager:PresentationConsoleMessageManager,PresentationConsoleMessageHelper:PresentationConsoleMessageHelper,PresentationConsoleMessage:PresentationConsoleMessage});class TempFile{constructor(){this._lastBlob=null;}
write(pieces){if(this._lastBlob){pieces.unshift(this._lastBlob);}
this._lastBlob=new Blob(pieces,{type:'text/plain'});}
read(){return this.readRange();}
size(){return this._lastBlob?this._lastBlob.size:0;}
async readRange(startOffset,endOffset){if(!this._lastBlob){Console.Console.instance().error('Attempt to read a temp file that was never written');return Promise.resolve('');}
const blob=typeof startOffset==='number'||typeof endOffset==='number'?this._lastBlob.slice((startOffset),(endOffset)):this._lastBlob;const reader=new FileReader();try{await new Promise((resolve,reject)=>{reader.onloadend=resolve;reader.onerror=reject;reader.readAsText(blob);});}catch(error){Console.Console.instance().error('Failed to read from temp file: '+error.message);}
return(reader.result);}
copyToOutputStream(outputStream,progress){if(!this._lastBlob){outputStream.close();return Promise.resolve((null));}
const reader=new ChunkedFileReader((this._lastBlob),10*1000*1000,progress);return reader.read(outputStream).then(success=>success?null:reader.error());}
remove(){this._lastBlob=null;}}
class TempFileBackingStorage{constructor(){this._file=null;this._strings;this._stringsLength;this.reset();}
appendString(string){this._strings.push(string);this._stringsLength+=string.length;const flushStringLength=10*1024*1024;if(this._stringsLength>flushStringLength){this._flush();}}
appendAccessibleString(string){this._flush();const startOffset=this._file.size();this._strings.push(string);this._flush();return this._file.readRange.bind(this._file,startOffset,this._file.size());}
_flush(){if(!this._strings.length){return;}
if(!this._file){this._file=new TempFile();}
this._stringsLength=0;this._file.write(this._strings.splice(0));}
finishWriting(){this._flush();}
reset(){if(this._file){this._file.remove();}
this._file=null;this._strings=[];this._stringsLength=0;}
writeToStream(outputStream){return this._file?this._file.copyToOutputStream(outputStream):Promise.resolve(null);}}
var TempFile$1=Object.freeze({__proto__:null,TempFile:TempFile,TempFileBackingStorage:TempFileBackingStorage});export{BlackboxManager$1 as BlackboxManager,BreakpointManager$1 as BreakpointManager,CSSWorkspaceBinding$1 as CSSWorkspaceBinding,CompilerScriptMapping$1 as CompilerScriptMapping,ContentProviderBasedProject$1 as ContentProviderBasedProject,DebuggerWorkspaceBinding$1 as DebuggerWorkspaceBinding,DefaultScriptMapping$1 as DefaultScriptMapping,FileUtils,LiveLocation$1 as LiveLocation,NetworkProject$1 as NetworkProject,PresentationConsoleMessageHelper$1 as PresentationConsoleMessageHelper,ResourceMapping$1 as ResourceMapping,ResourceScriptMapping$1 as ResourceScriptMapping,ResourceUtils,SASSSourceMapping$1 as SASSSourceMapping,StylesSourceMapping$1 as StylesSourceMapping,TempFile$1 as TempFile};