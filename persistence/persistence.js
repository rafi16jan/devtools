import{NetworkProject}from'../bindings/bindings.js';import{ObjectWrapper,ParsedURL,Console,UIString,Settings,ResourceType,EventTarget,CharacterIdMap,Throttler,Trie,Revealer}from'../common/common.js';import{StringUtilities}from'../platform/platform.js';import{SDKModel,NetworkManager}from'../sdk/sdk.js';import{Workspace,UISourceCode}from'../workspace/workspace.js';import{TextUtils}from'../text_utils/text_utils.js';import{InspectorFrontendHost,InspectorFrontendHostAPI,Platform as Platform$1,userMetrics,UserMetrics}from'../host/host.js';import{Linkifier}from'../components/components.js';import{Icon,Widget,UIUtils,ListWidget,ARIAUtils,Toolbar}from'../ui/ui.js';class PlatformFileSystem{constructor(path,type){this._path=path;this._type=type;}
getMetadata(path){return Promise.resolve((null));}
initialFilePaths(){return[];}
initialGitFolders(){return[];}
path(){return this._path;}
embedderPath(){throw new Error('Not implemented');}
type(){return this._type;}
async createFile(path,name){return Promise.resolve(null);}
deleteFile(path){return Promise.resolve(false);}
requestFileBlob(path){return Promise.resolve((null));}
async requestFileContent(path){return{error:ls`Unable to read files with this implementation.`,isEncoded:false};}
setFileContent(path,content,isBase64){throw new Error('Not implemented');}
renameFile(path,newName,callback){callback(false);}
addExcludedFolder(path){}
removeExcludedFolder(path){}
fileSystemRemoved(){}
isFileExcluded(folderPath){return false;}
excludedFolders(){return new Set();}
searchInPath(query,progress){return Promise.resolve([]);}
indexContent(progress){setImmediate(()=>progress.done());}
mimeFromPath(path){throw new Error('Not implemented');}
canExcludeFolder(path){return false;}
contentType(path){throw new Error('Not implemented');}
tooltipForURL(url){throw new Error('Not implemented');}
supportsAutomapping(){throw new Error('Not implemented');}}
var PlatformFileSystem$1=Object.freeze({__proto__:null,PlatformFileSystem:PlatformFileSystem});let isolatedFileSystemManagerInstance;class IsolatedFileSystemManager extends ObjectWrapper.ObjectWrapper{constructor(){super();this._fileSystems=new Map();this._callbacks=new Map();this._progresses=new Map();InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.FileSystemRemoved,this._onFileSystemRemoved,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.FileSystemAdded,event=>{this._onFileSystemAdded(event);},this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.FileSystemFilesChangedAddedRemoved,this._onFileSystemFilesChanged,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.IndexingTotalWorkCalculated,this._onIndexingTotalWorkCalculated,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.IndexingWorked,this._onIndexingWorked,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.IndexingDone,this._onIndexingDone,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.SearchCompleted,this._onSearchCompleted,this);this._initExcludePatterSetting();this._fileSystemRequestResolve=null;this._fileSystemsLoadedPromise=this._requestFileSystems();}
static instance(opts={forceNew:null}){const{forceNew}=opts;if(!isolatedFileSystemManagerInstance||forceNew){isolatedFileSystemManagerInstance=new IsolatedFileSystemManager();}
return isolatedFileSystemManagerInstance;}
_requestFileSystems(){let fulfill;const promise=new Promise(f=>fulfill=f);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.FileSystemsLoaded,onFileSystemsLoaded,this);InspectorFrontendHost.InspectorFrontendHostInstance.requestFileSystems();return promise;function onFileSystemsLoaded(event){const fileSystems=(event.data);const promises=[];for(let i=0;i<fileSystems.length;++i){promises.push(this._innerAddFileSystem(fileSystems[i],false));}
Promise.all(promises).then(onFileSystemsAdded);}
function onFileSystemsAdded(fileSystems){fulfill(fileSystems.filter(fs=>!!fs));}}
addFileSystem(type){return new Promise(resolve=>{this._fileSystemRequestResolve=resolve;InspectorFrontendHost.InspectorFrontendHostInstance.addFileSystem(type||'');});}
removeFileSystem(fileSystem){InspectorFrontendHost.InspectorFrontendHostInstance.removeFileSystem(fileSystem.embedderPath());}
waitForFileSystems(){return this._fileSystemsLoadedPromise;}
_innerAddFileSystem(fileSystem,dispatchEvent){const embedderPath=fileSystem.fileSystemPath;const fileSystemURL=ParsedURL.ParsedURL.platformPathToURL(fileSystem.fileSystemPath);const promise=IsolatedFileSystem.create(this,fileSystemURL,embedderPath,fileSystem.type,fileSystem.fileSystemName,fileSystem.rootURL);return promise.then(storeFileSystem.bind(this));function storeFileSystem(fileSystem){if(!fileSystem){return null;}
this._fileSystems.set(fileSystemURL,fileSystem);if(dispatchEvent){this.dispatchEventToListeners(Events.FileSystemAdded,fileSystem);}
return fileSystem;}}
addPlatformFileSystem(fileSystemURL,fileSystem){this._fileSystems.set(fileSystemURL,fileSystem);this.dispatchEventToListeners(Events.FileSystemAdded,fileSystem);}
_onFileSystemAdded(event){const errorMessage=(event.data['errorMessage']);const fileSystem=(event.data['fileSystem']);if(errorMessage){if(errorMessage!=='<selection cancelled>'){Console.Console.instance().error(UIString.UIString('Unable to add filesystem: %s',errorMessage));}
if(!this._fileSystemRequestResolve){return;}
this._fileSystemRequestResolve.call(null,null);this._fileSystemRequestResolve=null;}else if(fileSystem){this._innerAddFileSystem(fileSystem,true).then(fileSystem=>{if(this._fileSystemRequestResolve){this._fileSystemRequestResolve.call(null,fileSystem);this._fileSystemRequestResolve=null;}});}}
_onFileSystemRemoved(event){const embedderPath=(event.data);const fileSystemPath=ParsedURL.ParsedURL.platformPathToURL(embedderPath);const isolatedFileSystem=this._fileSystems.get(fileSystemPath);if(!isolatedFileSystem){return;}
this._fileSystems.delete(fileSystemPath);isolatedFileSystem.fileSystemRemoved();this.dispatchEventToListeners(Events.FileSystemRemoved,isolatedFileSystem);}
_onFileSystemFilesChanged(event){const urlPaths={changed:groupFilePathsIntoFileSystemPaths.call(this,event.data.changed),added:groupFilePathsIntoFileSystemPaths.call(this,event.data.added),removed:groupFilePathsIntoFileSystemPaths.call(this,event.data.removed)};this.dispatchEventToListeners(Events.FileSystemFilesChanged,urlPaths);function groupFilePathsIntoFileSystemPaths(embedderPaths){const paths=new Platform.Multimap();for(const embedderPath of embedderPaths){const filePath=ParsedURL.ParsedURL.platformPathToURL(embedderPath);for(const fileSystemPath of this._fileSystems.keys()){if(this._fileSystems.get(fileSystemPath).isFileExcluded(embedderPath)){continue;}
const pathPrefix=fileSystemPath.endsWith('/')?fileSystemPath:fileSystemPath+'/';if(!filePath.startsWith(pathPrefix)){continue;}
paths.set(fileSystemPath,filePath);}}
return paths;}}
fileSystems(){return[...this._fileSystems.values()];}
fileSystem(fileSystemPath){return this._fileSystems.get(fileSystemPath)||null;}
_initExcludePatterSetting(){const defaultCommonExcludedFolders=['/node_modules/','/bower_components/','/\\.devtools','/\\.git/','/\\.sass-cache/','/\\.hg/','/\\.idea/','/\\.svn/','/\\.cache/','/\\.project/'];const defaultWinExcludedFolders=['/Thumbs.db$','/ehthumbs.db$','/Desktop.ini$','/\\$RECYCLE.BIN/'];const defaultMacExcludedFolders=['/\\.DS_Store$','/\\.Trashes$','/\\.Spotlight-V100$','/\\.AppleDouble$','/\\.LSOverride$','/Icon$','/\\._.*$'];const defaultLinuxExcludedFolders=['/.*~$'];let defaultExcludedFolders=defaultCommonExcludedFolders;if(Platform$1.isWin()){defaultExcludedFolders=defaultExcludedFolders.concat(defaultWinExcludedFolders);}else if(Platform$1.isMac()){defaultExcludedFolders=defaultExcludedFolders.concat(defaultMacExcludedFolders);}else{defaultExcludedFolders=defaultExcludedFolders.concat(defaultLinuxExcludedFolders);}
const defaultExcludedFoldersPattern=defaultExcludedFolders.join('|');this._workspaceFolderExcludePatternSetting=Settings.Settings.instance().createRegExpSetting('workspaceFolderExcludePattern',defaultExcludedFoldersPattern,Platform$1.isWin()?'i':'');}
workspaceFolderExcludePatternSetting(){return this._workspaceFolderExcludePatternSetting;}
registerCallback(callback){const requestId=++_lastRequestId;this._callbacks.set(requestId,callback);return requestId;}
registerProgress(progress){const requestId=++_lastRequestId;this._progresses.set(requestId,progress);return requestId;}
_onIndexingTotalWorkCalculated(event){const requestId=(event.data['requestId']);const totalWork=(event.data['totalWork']);const progress=this._progresses.get(requestId);if(!progress){return;}
progress.setTotalWork(totalWork);}
_onIndexingWorked(event){const requestId=(event.data['requestId']);const worked=(event.data['worked']);const progress=this._progresses.get(requestId);if(!progress){return;}
progress.worked(worked);if(progress.isCanceled()){InspectorFrontendHost.InspectorFrontendHostInstance.stopIndexing(requestId);this._onIndexingDone(event);}}
_onIndexingDone(event){const requestId=(event.data['requestId']);const progress=this._progresses.get(requestId);if(!progress){return;}
progress.done();this._progresses.delete(requestId);}
_onSearchCompleted(event){const requestId=(event.data['requestId']);const files=(event.data['files']);const callback=this._callbacks.get(requestId);if(!callback){return;}
callback.call(null,files);this._callbacks.delete(requestId);}}
const Events={FileSystemAdded:Symbol('FileSystemAdded'),FileSystemRemoved:Symbol('FileSystemRemoved'),FileSystemFilesChanged:Symbol('FileSystemFilesChanged'),ExcludedFolderAdded:Symbol('ExcludedFolderAdded'),ExcludedFolderRemoved:Symbol('ExcludedFolderRemoved')};let _lastRequestId=0;let FileSystem;var IsolatedFileSystemManager$1=Object.freeze({__proto__:null,IsolatedFileSystemManager:IsolatedFileSystemManager,Events:Events,FileSystem:FileSystem});class IsolatedFileSystem extends PlatformFileSystem{constructor(manager,path,embedderPath,domFileSystem,type){super(path,type);this._manager=manager;this._embedderPath=embedderPath;this._domFileSystem=domFileSystem;this._excludedFoldersSetting=Settings.Settings.instance().createLocalSetting('workspaceExcludedFolders',{});this._excludedFolders=new Set(this._excludedFoldersSetting.get()[path]||[]);this._excludedEmbedderFolders=[];this._initialFilePaths=new Set();this._initialGitFolders=new Set();this._fileLocks=new Map();}
static create(manager,path,embedderPath,type,name,rootURL){const domFileSystem=InspectorFrontendHost.InspectorFrontendHostInstance.isolatedFileSystem(name,rootURL);if(!domFileSystem){return Promise.resolve((null));}
const fileSystem=new IsolatedFileSystem(manager,path,embedderPath,domFileSystem,type);return fileSystem._initializeFilePaths().then(()=>fileSystem).catch(error=>{console.error(error);});}
static errorMessage(error){return UIString.UIString('File system error: %s',error.message);}
_serializedFileOperation(path,operation){const promise=Promise.resolve(this._fileLocks.get(path)).then(()=>operation.call(null));this._fileLocks.set(path,promise);return promise;}
getMetadata(path){let fulfill;const promise=new Promise(f=>fulfill=f);this._domFileSystem.root.getFile(path,undefined,fileEntryLoaded,errorHandler);return promise;function fileEntryLoaded(entry){entry.getMetadata(fulfill,errorHandler);}
function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when getting file metadata \''+path);fulfill(null);}}
initialFilePaths(){return[...this._initialFilePaths];}
initialGitFolders(){return[...this._initialGitFolders];}
embedderPath(){return this._embedderPath;}
_initializeFilePaths(){let fulfill;const promise=new Promise(x=>fulfill=x);let pendingRequests=1;const boundInnerCallback=innerCallback.bind(this);this._requestEntries('',boundInnerCallback);return promise;function innerCallback(entries){for(let i=0;i<entries.length;++i){const entry=entries[i];if(!entry.isDirectory){if(this.isFileExcluded(entry.fullPath)){continue;}
this._initialFilePaths.add(entry.fullPath.substr(1));}else{if(entry.fullPath.endsWith('/.git')){const lastSlash=entry.fullPath.lastIndexOf('/');const parentFolder=entry.fullPath.substring(1,lastSlash);this._initialGitFolders.add(parentFolder);}
if(this.isFileExcluded(entry.fullPath+'/')){this._excludedEmbedderFolders.push(ParsedURL.ParsedURL.urlToPlatformPath(this.path()+entry.fullPath,Platform$1.isWin()));continue;}
++pendingRequests;this._requestEntries(entry.fullPath,boundInnerCallback);}}
if((--pendingRequests===0)){fulfill();}}}
async _createFoldersIfNotExist(folderPath){let dirEntry=await new Promise(resolve=>this._domFileSystem.root.getDirectory(folderPath,undefined,resolve,()=>resolve(null)));if(dirEntry){return dirEntry;}
const paths=folderPath.split('/');let activePath='';for(const path of paths){activePath=activePath+'/'+path;dirEntry=await this._innerCreateFolderIfNeeded(activePath);if(!dirEntry){return null;}}
return dirEntry;}
_innerCreateFolderIfNeeded(path){return new Promise(resolve=>{this._domFileSystem.root.getDirectory(path,{create:true},dirEntry=>resolve(dirEntry),error=>{const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' trying to create directory \''+path+'\'');resolve(null);});});}
async createFile(path,name){const dirEntry=await this._createFoldersIfNotExist(path);if(!dirEntry){return null;}
const fileEntry=await this._serializedFileOperation(path,createFileCandidate.bind(this,name||'NewFile'));if(!fileEntry){return null;}
return fileEntry.fullPath.substr(1);function createFileCandidate(name,newFileIndex){return new Promise(resolve=>{const nameCandidate=name+(newFileIndex||'');dirEntry.getFile(nameCandidate,{create:true,exclusive:true},resolve,error=>{if(error.name==='InvalidModificationError'){resolve(createFileCandidate.call(this,name,(newFileIndex?newFileIndex+1:1)));return;}
const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when testing if file exists \''+(this.path()+'/'+path+'/'+nameCandidate)+'\'');resolve(null);});});}}
deleteFile(path){let resolveCallback;const promise=new Promise(resolve=>resolveCallback=resolve);this._domFileSystem.root.getFile(path,undefined,fileEntryLoaded.bind(this),errorHandler.bind(this));return promise;function fileEntryLoaded(fileEntry){fileEntry.remove(fileEntryRemoved,errorHandler.bind(this));}
function fileEntryRemoved(){resolveCallback(true);}
function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when deleting file \''+(this.path()+'/'+path)+'\'');resolveCallback(false);}}
requestFileBlob(path){return new Promise(resolve=>{this._domFileSystem.root.getFile(path,undefined,entry=>{entry.file(resolve,errorHandler.bind(this));},errorHandler.bind(this));function errorHandler(error){if(error.name==='NotFoundError'){resolve(null);return;}
const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when getting content for file \''+(this.path()+'/'+path)+'\'');resolve(null);}});}
requestFileContent(path){return this._serializedFileOperation(path,()=>this._innerRequestFileContent(path));}
async _innerRequestFileContent(path){const blob=await this.requestFileBlob(path);if(!blob){return{error:ls`Blob could not be loaded.`,isEncoded:false};}
const reader=new FileReader();const extension=ParsedURL.ParsedURL.extractExtension(path);const encoded=BinaryExtensions.has(extension);const readPromise=new Promise(x=>reader.onloadend=x);if(encoded){reader.readAsBinaryString(blob);}else{reader.readAsText(blob);}
await readPromise;if(reader.error){const error=ls`Can't read file: ${path}: ${reader.error}`;console.error(error);return{isEncoded:false,error};}
let result=null;let error=null;try{result=(reader.result);}catch(e){result=null;error=ls`Can't read file: ${path}: ${e.message}`;}
if(result===undefined||result===null){error=error||ls`Unknown error reading file: ${path}`;console.error(error);return{isEncoded:false,error};}
return{isEncoded:encoded,content:encoded?btoa(result):result};}
async setFileContent(path,content,isBase64){userMetrics.actionTaken(UserMetrics.Action.FileSavedInWorkspace);let callback;const innerSetFileContent=()=>{const promise=new Promise(x=>callback=x);this._domFileSystem.root.getFile(path,{create:true},fileEntryLoaded.bind(this),errorHandler.bind(this));return promise;};this._serializedFileOperation(path,innerSetFileContent);function fileEntryLoaded(entry){entry.createWriter(fileWriterCreated.bind(this),errorHandler.bind(this));}
async function fileWriterCreated(fileWriter){fileWriter.onerror=errorHandler.bind(this);fileWriter.onwriteend=fileWritten;let blob;if(isBase64){blob=await(await fetch(`data:application/octet-stream;base64,${content}`)).blob();}else{blob=new Blob([content],{type:'text/plain'});}
fileWriter.write(blob);function fileWritten(){fileWriter.onwriteend=callback;fileWriter.truncate(blob.size);}}
function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when setting content for file \''+(this.path()+'/'+path)+'\'');callback();}}
renameFile(path,newName,callback){newName=newName?newName.trim():newName;if(!newName||newName.indexOf('/')!==-1){callback(false);return;}
let fileEntry;let dirEntry;this._domFileSystem.root.getFile(path,undefined,fileEntryLoaded.bind(this),errorHandler.bind(this));function fileEntryLoaded(entry){if(entry.name===newName){callback(false);return;}
fileEntry=entry;fileEntry.getParent(dirEntryLoaded.bind(this),errorHandler.bind(this));}
function dirEntryLoaded(entry){dirEntry=entry;dirEntry.getFile(newName,null,newFileEntryLoaded,newFileEntryLoadErrorHandler.bind(this));}
function newFileEntryLoaded(entry){callback(false);}
function newFileEntryLoadErrorHandler(error){if(error.name!=='NotFoundError'){callback(false);return;}
fileEntry.moveTo(dirEntry,newName,fileRenamed,errorHandler.bind(this));}
function fileRenamed(entry){callback(true,entry.name);}
function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when renaming file \''+(this.path()+'/'+path)+'\' to \''+newName+'\'');callback(false);}}
_readDirectory(dirEntry,callback){const dirReader=dirEntry.createReader();let entries=[];function innerCallback(results){if(!results.length){callback(entries.sort());}else{entries=entries.concat(toArray(results));dirReader.readEntries(innerCallback,errorHandler);}}
function toArray(list){return Array.prototype.slice.call(list||[],0);}
dirReader.readEntries(innerCallback,errorHandler);function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when reading directory \''+dirEntry.fullPath+'\'');callback([]);}}
_requestEntries(path,callback){this._domFileSystem.root.getDirectory(path,undefined,innerCallback.bind(this),errorHandler);function innerCallback(dirEntry){this._readDirectory(dirEntry,callback);}
function errorHandler(error){const errorMessage=IsolatedFileSystem.errorMessage(error);console.error(errorMessage+' when requesting entry \''+path+'\'');callback([]);}}
_saveExcludedFolders(){const settingValue=this._excludedFoldersSetting.get();settingValue[this.path()]=[...this._excludedFolders];this._excludedFoldersSetting.set(settingValue);}
addExcludedFolder(path){this._excludedFolders.add(path);this._saveExcludedFolders();this._manager.dispatchEventToListeners(Events.ExcludedFolderAdded,path);}
removeExcludedFolder(path){this._excludedFolders.delete(path);this._saveExcludedFolders();this._manager.dispatchEventToListeners(Events.ExcludedFolderRemoved,path);}
fileSystemRemoved(){const settingValue=this._excludedFoldersSetting.get();delete settingValue[this.path()];this._excludedFoldersSetting.set(settingValue);}
isFileExcluded(folderPath){if(this._excludedFolders.has(folderPath)){return true;}
const regex=this._manager.workspaceFolderExcludePatternSetting().asRegExp();return!!(regex&&regex.test(folderPath));}
excludedFolders(){return this._excludedFolders;}
searchInPath(query,progress){return new Promise(resolve=>{const requestId=this._manager.registerCallback(innerCallback);InspectorFrontendHost.InspectorFrontendHostInstance.searchInPath(requestId,this._embedderPath,query);function innerCallback(files){resolve(files.map(path=>ParsedURL.ParsedURL.platformPathToURL(path)));progress.worked(1);}});}
indexContent(progress){progress.setTotalWork(1);const requestId=this._manager.registerProgress(progress);InspectorFrontendHost.InspectorFrontendHostInstance.indexPath(requestId,this._embedderPath,JSON.stringify(this._excludedEmbedderFolders));}
mimeFromPath(path){return ResourceType.ResourceType.mimeFromURL(path)||'text/plain';}
canExcludeFolder(path){return!!path&&this.type()!=='overrides';}
contentType(path){const extension=ParsedURL.ParsedURL.extractExtension(path);if(_styleSheetExtensions.has(extension)){return ResourceType.resourceTypes.Stylesheet;}
if(_documentExtensions.has(extension)){return ResourceType.resourceTypes.Document;}
if(ImageExtensions.has(extension)){return ResourceType.resourceTypes.Image;}
if(_scriptExtensions.has(extension)){return ResourceType.resourceTypes.Script;}
return BinaryExtensions.has(extension)?ResourceType.resourceTypes.Other:ResourceType.resourceTypes.Document;}
tooltipForURL(url){const path=ParsedURL.ParsedURL.urlToPlatformPath(url,Platform$1.isWin()).trimMiddle(150);return ls`Linked to ${path}`;}
supportsAutomapping(){return this.type()!=='overrides';}}
const _styleSheetExtensions=new Set(['css','scss','sass','less']);const _documentExtensions=new Set(['htm','html','asp','aspx','phtml','jsp']);const _scriptExtensions=new Set(['asp','aspx','c','cc','cljs','coffee','cpp','cs','dart','java','js','jsp','jsx','h','m','mjs','mm','py','sh','ts','tsx','ls']);const ImageExtensions=new Set(['jpeg','jpg','svg','gif','webp','png','ico','tiff','tif','bmp']);const BinaryExtensions=new Set(['cmd','com','exe','a','ar','iso','tar','bz2','gz','lz','lzma','z','7z','apk','arc','cab','dmg','jar','pak','rar','zip','3gp','aac','aiff','flac','m4a','mmf','mp3','ogg','oga','raw','sln','wav','wma','webm','mkv','flv','vob','ogv','gifv','avi','mov','qt','mp4','m4p','m4v','mpg','mpeg','jpeg','jpg','gif','webp','png','ico','tiff','tif','bmp']);var IsolatedFileSystem$1=Object.freeze({__proto__:null,IsolatedFileSystem:IsolatedFileSystem,BinaryExtensions:BinaryExtensions});class FileSystemWorkspaceBinding{constructor(isolatedFileSystemManager,workspace){this._isolatedFileSystemManager=isolatedFileSystemManager;this._workspace=workspace;this._eventListeners=[this._isolatedFileSystemManager.addEventListener(Events.FileSystemAdded,this._onFileSystemAdded,this),this._isolatedFileSystemManager.addEventListener(Events.FileSystemRemoved,this._onFileSystemRemoved,this),this._isolatedFileSystemManager.addEventListener(Events.FileSystemFilesChanged,this._fileSystemFilesChanged,this)];this._boundFileSystems=new Map();this._isolatedFileSystemManager.waitForFileSystems().then(this._onFileSystemsLoaded.bind(this));}
static projectId(fileSystemPath){return fileSystemPath;}
static relativePath(uiSourceCode){const baseURL=(uiSourceCode.project())._fileSystemBaseURL;return uiSourceCode.url().substring(baseURL.length).split('/');}
static tooltipForUISourceCode(uiSourceCode){const fileSystem=(uiSourceCode.project())._fileSystem;return fileSystem.tooltipForURL(uiSourceCode.url());}
static fileSystemType(project){const fileSystem=(project)._fileSystem;return fileSystem.type();}
static fileSystemSupportsAutomapping(project){const fileSystem=(project)._fileSystem;return fileSystem.supportsAutomapping();}
static completeURL(project,relativePath){const fsProject=(project);return fsProject._fileSystemBaseURL+relativePath;}
static fileSystemPath(projectId){return projectId;}
fileSystemManager(){return this._isolatedFileSystemManager;}
_onFileSystemsLoaded(fileSystems){for(const fileSystem of fileSystems){this._addFileSystem(fileSystem);}}
_onFileSystemAdded(event){const fileSystem=(event.data);this._addFileSystem(fileSystem);}
_addFileSystem(fileSystem){const boundFileSystem=new FileSystem$1(this,fileSystem,this._workspace);this._boundFileSystems.set(fileSystem.path(),boundFileSystem);}
_onFileSystemRemoved(event){const fileSystem=(event.data);const boundFileSystem=this._boundFileSystems.get(fileSystem.path());boundFileSystem.dispose();this._boundFileSystems.delete(fileSystem.path());}
_fileSystemFilesChanged(event){const paths=(event.data);for(const fileSystemPath of paths.changed.keysArray()){const fileSystem=this._boundFileSystems.get(fileSystemPath);if(!fileSystem){continue;}
paths.changed.get(fileSystemPath).forEach(path=>fileSystem._fileChanged(path));}
for(const fileSystemPath of paths.added.keysArray()){const fileSystem=this._boundFileSystems.get(fileSystemPath);if(!fileSystem){continue;}
paths.added.get(fileSystemPath).forEach(path=>fileSystem._fileChanged(path));}
for(const fileSystemPath of paths.removed.keysArray()){const fileSystem=this._boundFileSystems.get(fileSystemPath);if(!fileSystem){continue;}
paths.removed.get(fileSystemPath).forEach(path=>fileSystem.removeUISourceCode(path));}}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);for(const fileSystem of this._boundFileSystems.values()){fileSystem.dispose();this._boundFileSystems.delete(fileSystem._fileSystem.path());}}}
class FileSystem$1 extends Workspace.ProjectStore{constructor(fileSystemWorkspaceBinding,isolatedFileSystem,workspace){const fileSystemPath=isolatedFileSystem.path();const id=FileSystemWorkspaceBinding.projectId(fileSystemPath);console.assert(!workspace.project(id));const displayName=fileSystemPath.substr(fileSystemPath.lastIndexOf('/')+1);super(workspace,id,Workspace.projectTypes.FileSystem,displayName);this._fileSystem=isolatedFileSystem;this._fileSystemBaseURL=this._fileSystem.path()+'/';this._fileSystemParentURL=this._fileSystemBaseURL.substr(0,fileSystemPath.lastIndexOf('/')+1);this._fileSystemWorkspaceBinding=fileSystemWorkspaceBinding;this._fileSystemPath=fileSystemPath;this._creatingFilesGuard=new Set();workspace.addProject(this);this.populate();}
fileSystemPath(){return this._fileSystemPath;}
mimeType(uiSourceCode){return this._fileSystem.mimeFromPath(uiSourceCode.url());}
initialGitFolders(){return this._fileSystem.initialGitFolders().map(folder=>this._fileSystemPath+'/'+folder);}
_filePathForUISourceCode(uiSourceCode){return uiSourceCode.url().substring(this._fileSystemPath.length);}
isServiceProject(){return false;}
requestMetadata(uiSourceCode){if(uiSourceCode[_metadata]){return uiSourceCode[_metadata];}
const relativePath=this._filePathForUISourceCode(uiSourceCode);const promise=this._fileSystem.getMetadata(relativePath).then(onMetadata);uiSourceCode[_metadata]=promise;return promise;function onMetadata(metadata){if(!metadata){return null;}
return new UISourceCode.UISourceCodeMetadata(metadata.modificationTime,metadata.size);}}
requestFileBlob(uiSourceCode){return this._fileSystem.requestFileBlob(this._filePathForUISourceCode(uiSourceCode));}
requestFileContent(uiSourceCode){const filePath=this._filePathForUISourceCode(uiSourceCode);return this._fileSystem.requestFileContent(filePath);}
canSetFileContent(){return true;}
async setFileContent(uiSourceCode,newContent,isBase64){const filePath=this._filePathForUISourceCode(uiSourceCode);await this._fileSystem.setFileContent(filePath,newContent,isBase64);}
fullDisplayName(uiSourceCode){const baseURL=(uiSourceCode.project())._fileSystemParentURL;return uiSourceCode.url().substring(baseURL.length);}
canRename(){return true;}
rename(uiSourceCode,newName,callback){if(newName===uiSourceCode.name()){callback(true,uiSourceCode.name(),uiSourceCode.url(),uiSourceCode.contentType());return;}
let filePath=this._filePathForUISourceCode(uiSourceCode);this._fileSystem.renameFile(filePath,newName,innerCallback.bind(this));function innerCallback(success,newName){if(!success||!newName){callback(false,newName);return;}
console.assert(newName);const slash=filePath.lastIndexOf('/');const parentPath=filePath.substring(0,slash);filePath=parentPath+'/'+newName;filePath=filePath.substr(1);const newURL=this._fileSystemBaseURL+filePath;const newContentType=this._fileSystem.contentType(newName);this.renameUISourceCode(uiSourceCode,newName);callback(true,newName,newURL,newContentType);}}
async searchInFileContent(uiSourceCode,query,caseSensitive,isRegex){const filePath=this._filePathForUISourceCode(uiSourceCode);const{content}=await this._fileSystem.requestFileContent(filePath);if(content){return TextUtils.performSearchInContent(content,query,caseSensitive,isRegex);}
return[];}
async findFilesMatchingSearchRequest(searchConfig,filesMathingFileQuery,progress){let result=filesMathingFileQuery;const queriesToRun=searchConfig.queries().slice();if(!queriesToRun.length){queriesToRun.push('');}
progress.setTotalWork(queriesToRun.length);for(const query of queriesToRun){const files=await this._fileSystem.searchInPath(searchConfig.isRegex()?'':query,progress);result=result.intersectOrdered(files.sort(),String.naturalOrderComparator);progress.worked(1);}
progress.done();return result;}
indexContent(progress){this._fileSystem.indexContent(progress);}
populate(){const chunkSize=1000;const filePaths=this._fileSystem.initialFilePaths();reportFileChunk.call(this,0);function reportFileChunk(from){const to=Math.min(from+chunkSize,filePaths.length);for(let i=from;i<to;++i){this._addFile(filePaths[i]);}
if(to<filePaths.length){setTimeout(reportFileChunk.bind(this,to),100);}}}
excludeFolder(url){let relativeFolder=url.substring(this._fileSystemBaseURL.length);if(!relativeFolder.startsWith('/')){relativeFolder='/'+relativeFolder;}
if(!relativeFolder.endsWith('/')){relativeFolder+='/';}
this._fileSystem.addExcludedFolder(relativeFolder);const uiSourceCodes=this.uiSourceCodes().slice();for(let i=0;i<uiSourceCodes.length;++i){const uiSourceCode=uiSourceCodes[i];if(uiSourceCode.url().startsWith(url)){this.removeUISourceCode(uiSourceCode.url());}}}
canExcludeFolder(path){return this._fileSystem.canExcludeFolder(path);}
canCreateFile(){return true;}
async createFile(path,name,content,isBase64){const guardFileName=this._fileSystemPath+path+(!path.endsWith('/')?'/':'')+name;this._creatingFilesGuard.add(guardFileName);const filePath=await this._fileSystem.createFile(path,name);if(!filePath){return null;}
const uiSourceCode=this._addFile(filePath);uiSourceCode.setContent(content,!!isBase64);this._creatingFilesGuard.delete(guardFileName);return uiSourceCode;}
deleteFile(uiSourceCode){const relativePath=this._filePathForUISourceCode(uiSourceCode);this._fileSystem.deleteFile(relativePath).then(success=>{if(success){this.removeUISourceCode(uiSourceCode.url());}});}
remove(){this._fileSystemWorkspaceBinding._isolatedFileSystemManager.removeFileSystem(this._fileSystem);}
_addFile(filePath){const contentType=this._fileSystem.contentType(filePath);const uiSourceCode=this.createUISourceCode(this._fileSystemBaseURL+filePath,contentType);this.addUISourceCode(uiSourceCode);return uiSourceCode;}
_fileChanged(path){if(this._creatingFilesGuard.has(path)){return;}
const uiSourceCode=this.uiSourceCodeForURL(path);if(!uiSourceCode){const contentType=this._fileSystem.contentType(path);this.addUISourceCode(this.createUISourceCode(path,contentType));return;}
uiSourceCode[_metadata]=null;uiSourceCode.checkContentUpdated();}
tooltipForURL(url){return this._fileSystem.tooltipForURL(url);}
dispose(){this.removeProject();}}
const _metadata=Symbol('FileSystemWorkspaceBinding.Metadata');let FilesChangedData;var FileSystemWorkspaceBinding$1=Object.freeze({__proto__:null,FileSystemWorkspaceBinding:FileSystemWorkspaceBinding,FileSystem:FileSystem$1,FilesChangedData:FilesChangedData});class PersistenceUtils{static tooltipForUISourceCode(uiSourceCode){const binding=self.Persistence.persistence.binding(uiSourceCode);if(!binding){return'';}
if(uiSourceCode===binding.network){return FileSystemWorkspaceBinding.tooltipForUISourceCode(binding.fileSystem);}
if(binding.network.contentType().isFromSourceMap()){return UIString.UIString('Linked to source map: %s',binding.network.url().trimMiddle(150));}
return UIString.UIString('Linked to %s',binding.network.url().trimMiddle(150));}
static iconForUISourceCode(uiSourceCode){const binding=self.Persistence.persistence.binding(uiSourceCode);if(binding){if(!binding.fileSystem.url().startsWith('file://')){return null;}
const icon=Icon.Icon.create('mediumicon-file-sync');icon.title=PersistenceUtils.tooltipForUISourceCode(binding.network);if(self.Persistence.networkPersistenceManager.project()===binding.fileSystem.project()){icon.style.filter='hue-rotate(160deg)';}
return icon;}
if(uiSourceCode.project().type()!==Workspace.projectTypes.FileSystem||!uiSourceCode.url().startsWith('file://')){return null;}
const icon=Icon.Icon.create('mediumicon-file');icon.title=PersistenceUtils.tooltipForUISourceCode(uiSourceCode);return icon;}}
class LinkDecorator extends ObjectWrapper.ObjectWrapper{constructor(persistence){super();persistence.addEventListener(Events$1.BindingCreated,this._bindingChanged,this);persistence.addEventListener(Events$1.BindingRemoved,this._bindingChanged,this);}
_bindingChanged(event){const binding=(event.data);this.dispatchEventToListeners(Linkifier.LinkDecorator.Events.LinkIconChanged,binding.network);}
linkIcon(uiSourceCode){return PersistenceUtils.iconForUISourceCode(uiSourceCode);}}
var PersistenceUtils$1=Object.freeze({__proto__:null,PersistenceUtils:PersistenceUtils,LinkDecorator:LinkDecorator});class PersistenceImpl extends ObjectWrapper.ObjectWrapper{constructor(workspace,breakpointManager){super();this._workspace=workspace;this._breakpointManager=breakpointManager;this._filePathPrefixesToBindingCount=new Map();this._subscribedBindingEventListeners=new Platform.Multimap();const linkDecorator=new LinkDecorator(this);Linkifier.Linkifier.setLinkDecorator(linkDecorator);this._mapping=new Automapping(this._workspace,this._onStatusAdded.bind(this),this._onStatusRemoved.bind(this));}
addNetworkInterceptor(interceptor){this._mapping.addNetworkInterceptor(interceptor);}
refreshAutomapping(){this._mapping.scheduleRemap();}
async addBinding(binding){await this._innerAddBinding(binding);}
async addBindingForTest(binding){await this._innerAddBinding(binding);}
async removeBinding(binding){await this._innerRemoveBinding(binding);}
async removeBindingForTest(binding){await this._innerRemoveBinding(binding);}
async _innerAddBinding(binding){binding.network[_binding]=binding;binding.fileSystem[_binding]=binding;binding.fileSystem.forceLoadOnCheckContent();binding.network.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._onWorkingCopyCommitted,this);binding.fileSystem.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._onWorkingCopyCommitted,this);binding.network.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._onWorkingCopyChanged,this);binding.fileSystem.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._onWorkingCopyChanged,this);this._addFilePathBindingPrefixes(binding.fileSystem.url());await this._moveBreakpoints(binding.fileSystem,binding.network);console.assert(!binding.fileSystem.isDirty()||!binding.network.isDirty());if(binding.fileSystem.isDirty()){this._syncWorkingCopy(binding.fileSystem);}else if(binding.network.isDirty()){this._syncWorkingCopy(binding.network);}else if(binding.network.hasCommits()&&binding.network.content()!==binding.fileSystem.content()){binding.network.setWorkingCopy(binding.network.content());this._syncWorkingCopy(binding.network);}
this._notifyBindingEvent(binding.network);this._notifyBindingEvent(binding.fileSystem);this.dispatchEventToListeners(Events$1.BindingCreated,binding);}
async _innerRemoveBinding(binding){if(binding.network[_binding]!==binding){return;}
console.assert(binding.network[_binding]===binding.fileSystem[_binding],'ERROR: inconsistent binding for networkURL '+binding.network.url());binding.network[_binding]=null;binding.fileSystem[_binding]=null;binding.network.removeEventListener(UISourceCode.Events.WorkingCopyCommitted,this._onWorkingCopyCommitted,this);binding.fileSystem.removeEventListener(UISourceCode.Events.WorkingCopyCommitted,this._onWorkingCopyCommitted,this);binding.network.removeEventListener(UISourceCode.Events.WorkingCopyChanged,this._onWorkingCopyChanged,this);binding.fileSystem.removeEventListener(UISourceCode.Events.WorkingCopyChanged,this._onWorkingCopyChanged,this);this._removeFilePathBindingPrefixes(binding.fileSystem.url());await this._breakpointManager.copyBreakpoints(binding.network.url(),binding.fileSystem);this._notifyBindingEvent(binding.network);this._notifyBindingEvent(binding.fileSystem);this.dispatchEventToListeners(Events$1.BindingRemoved,binding);}
async _onStatusAdded(status){const binding=new PersistenceBinding(status.network,status.fileSystem);status[_binding]=binding;await this._innerAddBinding(binding);}
async _onStatusRemoved(status){const binding=(status[_binding]);await this._innerRemoveBinding(binding);}
_onWorkingCopyChanged(event){const uiSourceCode=(event.data);this._syncWorkingCopy(uiSourceCode);}
_syncWorkingCopy(uiSourceCode){const binding=uiSourceCode[_binding];if(!binding||binding[_muteWorkingCopy]){return;}
const other=binding.network===uiSourceCode?binding.fileSystem:binding.network;if(!uiSourceCode.isDirty()){binding[_muteWorkingCopy]=true;other.resetWorkingCopy();binding[_muteWorkingCopy]=false;this._contentSyncedForTest();return;}
const target=NetworkProject.NetworkProject.targetForUISourceCode(binding.network);if(target.type()===SDKModel.Type.Node){const newContent=uiSourceCode.workingCopy();other.requestContent().then(()=>{const nodeJSContent=PersistenceImpl.rewrapNodeJSContent(other,other.workingCopy(),newContent);setWorkingCopy.call(this,()=>nodeJSContent);});return;}
setWorkingCopy.call(this,()=>uiSourceCode.workingCopy());function setWorkingCopy(workingCopyGetter){binding[_muteWorkingCopy]=true;other.setWorkingCopyGetter(workingCopyGetter);binding[_muteWorkingCopy]=false;this._contentSyncedForTest();}}
_onWorkingCopyCommitted(event){const uiSourceCode=(event.data.uiSourceCode);const newContent=(event.data.content);this.syncContent(uiSourceCode,newContent,event.data.encoded);}
syncContent(uiSourceCode,newContent,encoded){const binding=uiSourceCode[_binding];if(!binding||binding[_muteCommit]){return;}
const other=binding.network===uiSourceCode?binding.fileSystem:binding.network;const target=NetworkProject.NetworkProject.targetForUISourceCode(binding.network);if(target.type()===SDKModel.Type.Node){other.requestContent().then(currentContent=>{const nodeJSContent=PersistenceImpl.rewrapNodeJSContent(other,currentContent.content,newContent);setContent.call(this,nodeJSContent);});return;}
setContent.call(this,newContent);function setContent(newContent){binding[_muteCommit]=true;other.setContent(newContent,encoded);binding[_muteCommit]=false;this._contentSyncedForTest();}}
static rewrapNodeJSContent(uiSourceCode,currentContent,newContent){if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem){if(newContent.startsWith(NodePrefix)&&newContent.endsWith(NodeSuffix)){newContent=newContent.substring(NodePrefix.length,newContent.length-NodeSuffix.length);}
if(currentContent.startsWith(NodeShebang)){newContent=NodeShebang+newContent;}}else{if(newContent.startsWith(NodeShebang)){newContent=newContent.substring(NodeShebang.length);}
if(currentContent.startsWith(NodePrefix)&&currentContent.endsWith(NodeSuffix)){newContent=NodePrefix+newContent+NodeSuffix;}}
return newContent;}
_contentSyncedForTest(){}
async _moveBreakpoints(from,to){const breakpoints=this._breakpointManager.breakpointLocationsForUISourceCode(from).map(breakpointLocation=>breakpointLocation.breakpoint);await Promise.all(breakpoints.map(breakpoint=>{breakpoint.remove(false);return this._breakpointManager.setBreakpoint(to,breakpoint.lineNumber(),breakpoint.columnNumber(),breakpoint.condition(),breakpoint.enabled());}));}
hasUnsavedCommittedChanges(uiSourceCode){if(this._workspace.hasResourceContentTrackingExtensions()){return false;}
if(uiSourceCode.project().canSetFileContent()){return false;}
if(uiSourceCode[_binding]){return false;}
return!!uiSourceCode.hasCommits();}
binding(uiSourceCode){return uiSourceCode[_binding]||null;}
subscribeForBindingEvent(uiSourceCode,listener){this._subscribedBindingEventListeners.set(uiSourceCode,listener);}
unsubscribeFromBindingEvent(uiSourceCode,listener){this._subscribedBindingEventListeners.delete(uiSourceCode,listener);}
_notifyBindingEvent(uiSourceCode){if(!this._subscribedBindingEventListeners.has(uiSourceCode)){return;}
const listeners=Array.from(this._subscribedBindingEventListeners.get(uiSourceCode));for(const listener of listeners){listener.call(null);}}
fileSystem(uiSourceCode){const binding=this.binding(uiSourceCode);return binding?binding.fileSystem:null;}
network(uiSourceCode){const binding=this.binding(uiSourceCode);return binding?binding.network:null;}
_addFilePathBindingPrefixes(filePath){let relative='';for(const token of filePath.split('/')){relative+=token+'/';const count=this._filePathPrefixesToBindingCount.get(relative)||0;this._filePathPrefixesToBindingCount.set(relative,count+1);}}
_removeFilePathBindingPrefixes(filePath){let relative='';for(const token of filePath.split('/')){relative+=token+'/';const count=this._filePathPrefixesToBindingCount.get(relative);if(count===1){this._filePathPrefixesToBindingCount.delete(relative);}else{this._filePathPrefixesToBindingCount.set(relative,count-1);}}}
filePathHasBindings(filePath){if(!filePath.endsWith('/')){filePath+='/';}
return this._filePathPrefixesToBindingCount.has(filePath);}}
const _binding=Symbol('Persistence.Binding');const _muteCommit=Symbol('Persistence.MuteCommit');const _muteWorkingCopy=Symbol('Persistence.MuteWorkingCopy');const NodePrefix='(function (exports, require, module, __filename, __dirname) { ';const NodeSuffix='\n});';const NodeShebang='#!/usr/bin/env node';const Events$1={BindingCreated:Symbol('BindingCreated'),BindingRemoved:Symbol('BindingRemoved')};class PathEncoder{constructor(){this._encoder=new CharacterIdMap.CharacterIdMap();}
encode(path){return path.split('/').map(token=>this._encoder.toChar(token)).join('');}
decode(path){return path.split('').map(token=>this._encoder.fromChar(token)).join('/');}}
class PersistenceBinding{constructor(network,fileSystem){this.network=network;this.fileSystem=fileSystem;}}
var PersistenceImpl$1=Object.freeze({__proto__:null,PersistenceImpl:PersistenceImpl,NodePrefix:NodePrefix,NodeSuffix:NodeSuffix,NodeShebang:NodeShebang,Events:Events$1,PathEncoder:PathEncoder,PersistenceBinding:PersistenceBinding});class Automapping{constructor(workspace,onStatusAdded,onStatusRemoved){this._workspace=workspace;this._onStatusAdded=onStatusAdded;this._onStatusRemoved=onStatusRemoved;this._statuses=new Set();this._statusSymbol=Symbol('Automapping.Status');this._processingPromiseSymbol=Symbol('Automapping.ProcessingPromise');this._metadataSymbol=Symbol('Automapping.Metadata');this._fileSystemUISourceCodes=new Map();this._sweepThrottler=new Throttler.Throttler(100);const pathEncoder=new PathEncoder();this._filesIndex=new FilePathIndex(pathEncoder);this._projectFoldersIndex=new FolderIndex(pathEncoder);this._activeFoldersIndex=new FolderIndex(pathEncoder);this._interceptors=[];this._workspace.addEventListener(Workspace.Events.UISourceCodeAdded,event=>this._onUISourceCodeAdded((event.data)));this._workspace.addEventListener(Workspace.Events.UISourceCodeRemoved,event=>this._onUISourceCodeRemoved((event.data)));this._workspace.addEventListener(Workspace.Events.UISourceCodeRenamed,this._onUISourceCodeRenamed,this);this._workspace.addEventListener(Workspace.Events.ProjectAdded,event=>this._onProjectAdded((event.data)),this);this._workspace.addEventListener(Workspace.Events.ProjectRemoved,event=>this._onProjectRemoved((event.data)),this);for(const fileSystem of workspace.projects()){this._onProjectAdded(fileSystem);}
for(const uiSourceCode of workspace.uiSourceCodes()){this._onUISourceCodeAdded(uiSourceCode);}}
addNetworkInterceptor(interceptor){this._interceptors.push(interceptor);this.scheduleRemap();}
scheduleRemap(){for(const status of this._statuses.values()){this._clearNetworkStatus(status.network);}
this._scheduleSweep();}
_scheduleSweep(){this._sweepThrottler.schedule(sweepUnmapped.bind(this));function sweepUnmapped(){const networkProjects=this._workspace.projectsForType(Workspace.projectTypes.Network);for(const networkProject of networkProjects){for(const uiSourceCode of networkProject.uiSourceCodes()){this._computeNetworkStatus(uiSourceCode);}}
this._onSweepHappenedForTest();return Promise.resolve();}}
_onSweepHappenedForTest(){}
_onProjectRemoved(project){for(const uiSourceCode of project.uiSourceCodes()){this._onUISourceCodeRemoved(uiSourceCode);}
if(project.type()!==Workspace.projectTypes.FileSystem){return;}
const fileSystem=(project);for(const gitFolder of fileSystem.initialGitFolders()){this._projectFoldersIndex.removeFolder(gitFolder);}
this._projectFoldersIndex.removeFolder(fileSystem.fileSystemPath());this.scheduleRemap();}
_onProjectAdded(project){if(project.type()!==Workspace.projectTypes.FileSystem){return;}
const fileSystem=(project);for(const gitFolder of fileSystem.initialGitFolders()){this._projectFoldersIndex.addFolder(gitFolder);}
this._projectFoldersIndex.addFolder(fileSystem.fileSystemPath());project.uiSourceCodes().forEach(this._onUISourceCodeAdded.bind(this));this.scheduleRemap();}
_onUISourceCodeAdded(uiSourceCode){const project=uiSourceCode.project();if(project.type()===Workspace.projectTypes.FileSystem){if(!FileSystemWorkspaceBinding.fileSystemSupportsAutomapping(project)){return;}
this._filesIndex.addPath(uiSourceCode.url());this._fileSystemUISourceCodes.set(uiSourceCode.url(),uiSourceCode);this._scheduleSweep();}else if(project.type()===Workspace.projectTypes.Network){this._computeNetworkStatus(uiSourceCode);}}
_onUISourceCodeRemoved(uiSourceCode){if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem){this._filesIndex.removePath(uiSourceCode.url());this._fileSystemUISourceCodes.delete(uiSourceCode.url());const status=uiSourceCode[this._statusSymbol];if(status){this._clearNetworkStatus(status.network);}}else if(uiSourceCode.project().type()===Workspace.projectTypes.Network){this._clearNetworkStatus(uiSourceCode);}}
_onUISourceCodeRenamed(event){const uiSourceCode=(event.data.uiSourceCode);const oldURL=(event.data.oldURL);if(uiSourceCode.project().type()!==Workspace.projectTypes.FileSystem){return;}
this._filesIndex.removePath(oldURL);this._fileSystemUISourceCodes.delete(oldURL);const status=uiSourceCode[this._statusSymbol];if(status){this._clearNetworkStatus(status.network);}
this._filesIndex.addPath(uiSourceCode.url());this._fileSystemUISourceCodes.set(uiSourceCode.url(),uiSourceCode);this._scheduleSweep();}
_computeNetworkStatus(networkSourceCode){if(networkSourceCode[this._processingPromiseSymbol]||networkSourceCode[this._statusSymbol]){return;}
if(this._interceptors.some(interceptor=>interceptor(networkSourceCode))){return;}
if(networkSourceCode.url().startsWith('wasm://')){return;}
const createBindingPromise=this._createBinding(networkSourceCode).then(validateStatus.bind(this)).then(onStatus.bind(this));networkSourceCode[this._processingPromiseSymbol]=createBindingPromise;async function validateStatus(status){if(!status){return null;}
if(networkSourceCode[this._processingPromiseSymbol]!==createBindingPromise){return null;}
if(status.network.contentType().isFromSourceMap()||!status.fileSystem.contentType().isTextType()){return status;}
if(status.fileSystem.isDirty()&&(status.network.isDirty()||status.network.hasCommits())){return null;}
const[fileSystemContent,networkContent]=await Promise.all([status.fileSystem.requestContent(),status.network.project().requestFileContent(status.network)]);if(fileSystemContent.content===null||networkContent===null){return null;}
if(networkSourceCode[this._processingPromiseSymbol]!==createBindingPromise){return null;}
const target=NetworkProject.NetworkProject.targetForUISourceCode(status.network);let isValid=false;const fileContent=fileSystemContent.content;if(target&&target.type()===SDKModel.Type.Node){const rewrappedNetworkContent=PersistenceImpl.rewrapNodeJSContent(status.fileSystem,fileContent,networkContent.content);isValid=fileContent===rewrappedNetworkContent;}else{isValid=fileContent.trimRight()===networkContent.content.trimRight();}
if(!isValid){this._prevalidationFailedForTest(status);return null;}
return status;}
function onStatus(status){if(networkSourceCode[this._processingPromiseSymbol]!==createBindingPromise){return;}
networkSourceCode[this._processingPromiseSymbol]=null;if(!status){this._onBindingFailedForTest();return;}
if(status.network[this._statusSymbol]||status.fileSystem[this._statusSymbol]){return;}
this._statuses.add(status);status.network[this._statusSymbol]=status;status.fileSystem[this._statusSymbol]=status;if(status.exactMatch){const projectFolder=this._projectFoldersIndex.closestParentFolder(status.fileSystem.url());const newFolderAdded=projectFolder?this._activeFoldersIndex.addFolder(projectFolder):false;if(newFolderAdded){this._scheduleSweep();}}
this._onStatusAdded.call(null,status);}}
_prevalidationFailedForTest(binding){}
_onBindingFailedForTest(){}
_clearNetworkStatus(networkSourceCode){if(networkSourceCode[this._processingPromiseSymbol]){networkSourceCode[this._processingPromiseSymbol]=null;return;}
const status=networkSourceCode[this._statusSymbol];if(!status){return;}
this._statuses.delete(status);status.network[this._statusSymbol]=null;status.fileSystem[this._statusSymbol]=null;if(status.exactMatch){const projectFolder=this._projectFoldersIndex.closestParentFolder(status.fileSystem.url());if(projectFolder){this._activeFoldersIndex.removeFolder(projectFolder);}}
this._onStatusRemoved.call(null,status);}
_createBinding(networkSourceCode){if(networkSourceCode.url().startsWith('file://')||networkSourceCode.url().startsWith('snippet://')){const decodedUrl=decodeURI(networkSourceCode.url());const fileSourceCode=this._fileSystemUISourceCodes.get(decodedUrl);const status=fileSourceCode?new AutomappingStatus(networkSourceCode,fileSourceCode,false):null;return Promise.resolve(status);}
let networkPath=ParsedURL.ParsedURL.extractPath(networkSourceCode.url());if(networkPath===null){return Promise.resolve((null));}
if(networkPath.endsWith('/')){networkPath+='index.html';}
const urlDecodedNetworkPath=decodeURI(networkPath);const similarFiles=this._filesIndex.similarFiles(urlDecodedNetworkPath).map(path=>this._fileSystemUISourceCodes.get(path));if(!similarFiles.length){return Promise.resolve((null));}
return this._pullMetadatas(similarFiles.concat(networkSourceCode)).then(onMetadatas.bind(this));function onMetadatas(){const activeFiles=similarFiles.filter(file=>!!this._activeFoldersIndex.closestParentFolder(file.url()));const networkMetadata=networkSourceCode[this._metadataSymbol];if(!networkMetadata||(!networkMetadata.modificationTime&&typeof networkMetadata.contentSize!=='number')){if(activeFiles.length!==1){return null;}
return new AutomappingStatus(networkSourceCode,activeFiles[0],false);}
let exactMatches=this._filterWithMetadata(activeFiles,networkMetadata);if(!exactMatches.length){exactMatches=this._filterWithMetadata(similarFiles,networkMetadata);}
if(exactMatches.length!==1){return null;}
return new AutomappingStatus(networkSourceCode,exactMatches[0],true);}}
_pullMetadatas(uiSourceCodes){return Promise.all(uiSourceCodes.map(async file=>{file[this._metadataSymbol]=await file.requestMetadata();}));}
_filterWithMetadata(files,networkMetadata){return files.filter(file=>{const fileMetadata=file[this._metadataSymbol];if(!fileMetadata){return false;}
const timeMatches=!networkMetadata.modificationTime||Math.abs(networkMetadata.modificationTime-fileMetadata.modificationTime)<1000;const contentMatches=!networkMetadata.contentSize||fileMetadata.contentSize===networkMetadata.contentSize;return timeMatches&&contentMatches;});}}
class FilePathIndex{constructor(encoder){this._encoder=encoder;this._reversedIndex=new Trie.Trie();}
addPath(path){const encodedPath=this._encoder.encode(path);this._reversedIndex.add(StringUtilities.reverse(encodedPath));}
removePath(path){const encodedPath=this._encoder.encode(path);this._reversedIndex.remove(StringUtilities.reverse(encodedPath));}
similarFiles(networkPath){const encodedPath=this._encoder.encode(networkPath);const reversedEncodedPath=StringUtilities.reverse(encodedPath);const longestCommonPrefix=this._reversedIndex.longestPrefix(reversedEncodedPath,false);if(!longestCommonPrefix){return[];}
return this._reversedIndex.words(longestCommonPrefix).map(encodedPath=>this._encoder.decode(StringUtilities.reverse(encodedPath)));}}
class FolderIndex{constructor(encoder){this._encoder=encoder;this._index=new Trie.Trie();this._folderCount=new Map();}
addFolder(path){if(path.endsWith('/')){path=path.substring(0,path.length-1);}
const encodedPath=this._encoder.encode(path);this._index.add(encodedPath);const count=this._folderCount.get(encodedPath)||0;this._folderCount.set(encodedPath,count+1);return count===0;}
removeFolder(path){if(path.endsWith('/')){path=path.substring(0,path.length-1);}
const encodedPath=this._encoder.encode(path);const count=this._folderCount.get(encodedPath)||0;if(!count){return false;}
if(count>1){this._folderCount.set(encodedPath,count-1);return false;}
this._index.remove(encodedPath);this._folderCount.delete(encodedPath);return true;}
closestParentFolder(path){const encodedPath=this._encoder.encode(path);const commonPrefix=this._index.longestPrefix(encodedPath,true);return this._encoder.decode(commonPrefix);}}
class AutomappingStatus{constructor(network,fileSystem,exactMatch){this.network=network;this.fileSystem=fileSystem;this.exactMatch=exactMatch;}}
var Automapping$1=Object.freeze({__proto__:null,Automapping:Automapping,AutomappingStatus:AutomappingStatus});class EditFileSystemView extends Widget.VBox{constructor(fileSystemPath){super(true);this.registerRequiredCSS('persistence/editFileSystemView.css');this._fileSystemPath=fileSystemPath;this._eventListeners=[IsolatedFileSystemManager.instance().addEventListener(Events.ExcludedFolderAdded,this._update,this),IsolatedFileSystemManager.instance().addEventListener(Events.ExcludedFolderRemoved,this._update,this)];const excludedFoldersHeader=this.contentElement.createChild('div','file-system-header');excludedFoldersHeader.createChild('div','file-system-header-text').textContent=UIString.UIString('Excluded folders');excludedFoldersHeader.appendChild(UIUtils.createTextButton(UIString.UIString('Add'),this._addExcludedFolderButtonClicked.bind(this),'add-button'));this._excludedFoldersList=new ListWidget.ListWidget(this);this._excludedFoldersList.element.classList.add('file-system-list');this._excludedFoldersList.registerRequiredCSS('persistence/editFileSystemView.css');const excludedFoldersPlaceholder=createElementWithClass('div','file-system-list-empty');excludedFoldersPlaceholder.textContent=UIString.UIString('None');this._excludedFoldersList.setEmptyPlaceholder(excludedFoldersPlaceholder);this._excludedFoldersList.show(this.contentElement);this._update();}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);}
_update(){if(this._muteUpdate){return;}
this._excludedFoldersList.clear();this._excludedFolders=[];for(const folder of IsolatedFileSystemManager.instance().fileSystem(this._fileSystemPath).excludedFolders().values()){this._excludedFolders.push(folder);this._excludedFoldersList.appendItem(folder,true);}}
_addExcludedFolderButtonClicked(){this._excludedFoldersList.addNewItem(0,'');}
renderItem(item,editable){const element=createElementWithClass('div','file-system-list-item');const pathPrefix=(editable?item:UIString.UIString('%s (via .devtools)',item));const pathPrefixElement=element.createChild('div','file-system-value');pathPrefixElement.textContent=pathPrefix;pathPrefixElement.title=pathPrefix;return element;}
removeItemRequested(item,index){IsolatedFileSystemManager.instance().fileSystem(this._fileSystemPath).removeExcludedFolder(this._excludedFolders[index]);}
commitEdit(item,editor,isNew){this._muteUpdate=true;if(!isNew){IsolatedFileSystemManager.instance().fileSystem(this._fileSystemPath).removeExcludedFolder((item));}
IsolatedFileSystemManager.instance().fileSystem(this._fileSystemPath).addExcludedFolder(this._normalizePrefix(editor.control('pathPrefix').value));this._muteUpdate=false;this._update();}
beginEdit(item){const editor=this._createExcludedFolderEditor();editor.control('pathPrefix').value=item;return editor;}
_createExcludedFolderEditor(){if(this._excludedFolderEditor){return this._excludedFolderEditor;}
const editor=new ListWidget.Editor();this._excludedFolderEditor=editor;const content=editor.contentElement();const titles=content.createChild('div','file-system-edit-row');titles.createChild('div','file-system-value').textContent=UIString.UIString('Folder path');const fields=content.createChild('div','file-system-edit-row');fields.createChild('div','file-system-value').appendChild(editor.createInput('pathPrefix','text','/path/to/folder/',pathPrefixValidator.bind(this)));return editor;function pathPrefixValidator(item,index,input){const prefix=this._normalizePrefix(input.value.trim());if(!prefix){return{valid:false,errorMessage:ls`Enter a path`};}
const configurableCount=IsolatedFileSystemManager.instance().fileSystem(this._fileSystemPath).excludedFolders().size;for(let i=0;i<configurableCount;++i){if(i!==index&&this._excludedFolders[i]===prefix){return{valid:false,errorMessage:ls`Enter a unique path`};}}
return{valid:true};}}
_normalizePrefix(prefix){if(!prefix){return'';}
return prefix+(prefix[prefix.length-1]==='/'?'':'/');}}
var EditFileSystemView$1=Object.freeze({__proto__:null,EditFileSystemView:EditFileSystemView});class NetworkPersistenceManager extends ObjectWrapper.ObjectWrapper{constructor(workspace){super();this._bindingSymbol=Symbol('NetworkPersistenceBinding');this._originalResponseContentPromiseSymbol=Symbol('OriginalResponsePromise');this._savingSymbol=Symbol('SavingForOverrides');this._enabledSetting=Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled');this._enabledSetting.addChangeListener(this._enabledChanged,this);this._workspace=workspace;this._networkUISourceCodeForEncodedPath=new Map();this._interceptionHandlerBound=this._interceptionHandler.bind(this);this._updateInterceptionThrottler=new Throttler.Throttler(50);this._project=null;this._activeProject=null;this._active=false;this._enabled=false;this._workspace.addEventListener(Workspace.Events.ProjectAdded,event=>{this._onProjectAdded((event.data));});this._workspace.addEventListener(Workspace.Events.ProjectRemoved,event=>{this._onProjectRemoved((event.data));});self.Persistence.persistence.addNetworkInterceptor(this._canHandleNetworkUISourceCode.bind(this));this._eventDescriptors=[];this._enabledChanged();}
active(){return this._active;}
project(){return this._project;}
originalContentForUISourceCode(uiSourceCode){if(!uiSourceCode[this._bindingSymbol]){return null;}
const fileSystemUISourceCode=uiSourceCode[this._bindingSymbol].fileSystem;return fileSystemUISourceCode[this._originalResponseContentPromiseSymbol]||null;}
async _enabledChanged(){if(this._enabled===this._enabledSetting.get()){return;}
this._enabled=this._enabledSetting.get();if(this._enabled){this._eventDescriptors=[Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeRenamed,event=>{this._uiSourceCodeRenamedListener(event);}),Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeAdded,event=>{this._uiSourceCodeAdded(event);}),Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeRemoved,event=>{this._uiSourceCodeRemovedListener(event);}),Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.WorkingCopyCommitted,event=>this._onUISourceCodeWorkingCopyCommitted((event.data.uiSourceCode)))];await this._updateActiveProject();}else{EventTarget.EventTarget.removeEventListeners(this._eventDescriptors);await this._updateActiveProject();}}
async _uiSourceCodeRenamedListener(event){const uiSourceCode=(event.data.uiSourceCode);await this._onUISourceCodeRemoved(uiSourceCode);await this._onUISourceCodeAdded(uiSourceCode);}
async _uiSourceCodeRemovedListener(event){await this._onUISourceCodeRemoved((event.data));}
async _uiSourceCodeAdded(event){await this._onUISourceCodeAdded((event.data));}
async _updateActiveProject(){const wasActive=this._active;this._active=!!(this._enabledSetting.get()&&SDKModel.TargetManager.instance().mainTarget()&&this._project);if(this._active===wasActive){return;}
if(this._active){await Promise.all(this._project.uiSourceCodes().map(uiSourceCode=>this._filesystemUISourceCodeAdded(uiSourceCode)));const networkProjects=this._workspace.projectsForType(Workspace.projectTypes.Network);for(const networkProject of networkProjects){await Promise.all(networkProject.uiSourceCodes().map(uiSourceCode=>this._networkUISourceCodeAdded(uiSourceCode)));}}else if(this._project){await Promise.all(this._project.uiSourceCodes().map(uiSourceCode=>this._filesystemUISourceCodeRemoved(uiSourceCode)));this._networkUISourceCodeForEncodedPath.clear();}
self.Persistence.persistence.refreshAutomapping();}
_encodedPathFromUrl(url){if(!this._active){return'';}
let urlPath=ParsedURL.ParsedURL.urlWithoutHash(url.replace(/^https?:\/\//,''));if(urlPath.endsWith('/')&&urlPath.indexOf('?')===-1){urlPath=urlPath+'index.html';}
let encodedPathParts=encodeUrlPathToLocalPathParts(urlPath);const projectPath=FileSystemWorkspaceBinding.fileSystemPath(this._project.id());const encodedPath=encodedPathParts.join('/');if(projectPath.length+encodedPath.length>200){const domain=encodedPathParts[0];const encodedFileName=encodedPathParts[encodedPathParts.length-1];const shortFileName=encodedFileName?encodedFileName.substr(0,10)+'-':'';const extension=ParsedURL.ParsedURL.extractExtension(urlPath);const extensionPart=extension?'.'+extension.substr(0,10):'';encodedPathParts=[domain,'longurls',shortFileName+String.hashCode(encodedPath).toString(16)+extensionPart];}
return encodedPathParts.join('/');function encodeUrlPathToLocalPathParts(urlPath){const encodedParts=[];for(const pathPart of fileNamePartsFromUrlPath(urlPath)){if(!pathPart){continue;}
let encodedName=encodeURI(pathPart).replace(/[\/:\?\*]/g,match=>'%'+match[0].charCodeAt(0).toString(16));if(_reservedFileNames.has(encodedName.toLowerCase())){encodedName=encodedName.split('').map(char=>'%'+char.charCodeAt(0).toString(16)).join('');}
const lastChar=encodedName.charAt(encodedName.length-1);if(lastChar==='.'){encodedName=encodedName.substr(0,encodedName.length-1)+'%2e';}
encodedParts.push(encodedName);}
return encodedParts;}
function fileNamePartsFromUrlPath(urlPath){urlPath=ParsedURL.ParsedURL.urlWithoutHash(urlPath);const queryIndex=urlPath.indexOf('?');if(queryIndex===-1){return urlPath.split('/');}
if(queryIndex===0){return[urlPath];}
const endSection=urlPath.substr(queryIndex);const parts=urlPath.substr(0,urlPath.length-endSection.length).split('/');parts[parts.length-1]+=endSection;return parts;}}
_decodeLocalPathToUrlPath(path){try{return unescape(path);}catch(e){console.error(e);}
return path;}
async _unbind(uiSourceCode){const binding=uiSourceCode[this._bindingSymbol];if(binding){delete binding.network[this._bindingSymbol];delete binding.fileSystem[this._bindingSymbol];await self.Persistence.persistence.removeBinding(binding);}}
async _bind(networkUISourceCode,fileSystemUISourceCode){if(networkUISourceCode[this._bindingSymbol]){await this._unbind(networkUISourceCode);}
if(fileSystemUISourceCode[this._bindingSymbol]){await this._unbind(fileSystemUISourceCode);}
const binding=new PersistenceBinding(networkUISourceCode,fileSystemUISourceCode);networkUISourceCode[this._bindingSymbol]=binding;fileSystemUISourceCode[this._bindingSymbol]=binding;await self.Persistence.persistence.addBinding(binding);const uiSourceCodeOfTruth=networkUISourceCode[this._savingSymbol]?networkUISourceCode:fileSystemUISourceCode;const[{content},encoded]=await Promise.all([uiSourceCodeOfTruth.requestContent(),uiSourceCodeOfTruth.contentEncoded()]);self.Persistence.persistence.syncContent(uiSourceCodeOfTruth,content,encoded);}
_onUISourceCodeWorkingCopyCommitted(uiSourceCode){this.saveUISourceCodeForOverrides(uiSourceCode);}
canSaveUISourceCodeForOverrides(uiSourceCode){return this._active&&uiSourceCode.project().type()===Workspace.projectTypes.Network&&!uiSourceCode[this._bindingSymbol]&&!uiSourceCode[this._savingSymbol];}
async saveUISourceCodeForOverrides(uiSourceCode){if(!this.canSaveUISourceCodeForOverrides(uiSourceCode)){return;}
uiSourceCode[this._savingSymbol]=true;let encodedPath=this._encodedPathFromUrl(uiSourceCode.url());const content=(await uiSourceCode.requestContent()).content||'';const encoded=await uiSourceCode.contentEncoded();const lastIndexOfSlash=encodedPath.lastIndexOf('/');const encodedFileName=encodedPath.substr(lastIndexOfSlash+1);encodedPath=encodedPath.substr(0,lastIndexOfSlash);await this._project.createFile(encodedPath,encodedFileName,content,encoded);this._fileCreatedForTest(encodedPath,encodedFileName);uiSourceCode[this._savingSymbol]=false;}
_fileCreatedForTest(path,fileName){}
_patternForFileSystemUISourceCode(uiSourceCode){const relativePathParts=FileSystemWorkspaceBinding.relativePath(uiSourceCode);if(relativePathParts.length<2){return'';}
if(relativePathParts[1]==='longurls'&&relativePathParts.length!==2){return'http?://'+relativePathParts[0]+'/*';}
return'http?://'+this._decodeLocalPathToUrlPath(relativePathParts.join('/'));}
async _onUISourceCodeAdded(uiSourceCode){await this._networkUISourceCodeAdded(uiSourceCode);await this._filesystemUISourceCodeAdded(uiSourceCode);}
_canHandleNetworkUISourceCode(uiSourceCode){return this._active&&!uiSourceCode.url().startsWith('snippet://');}
async _networkUISourceCodeAdded(uiSourceCode){if(uiSourceCode.project().type()!==Workspace.projectTypes.Network||!this._canHandleNetworkUISourceCode(uiSourceCode)){return;}
const url=ParsedURL.ParsedURL.urlWithoutHash(uiSourceCode.url());this._networkUISourceCodeForEncodedPath.set(this._encodedPathFromUrl(url),uiSourceCode);const fileSystemUISourceCode=this._project.uiSourceCodeForURL((this._project).fileSystemPath()+'/'+this._encodedPathFromUrl(url));if(fileSystemUISourceCode){await this._bind(uiSourceCode,fileSystemUISourceCode);}}
async _filesystemUISourceCodeAdded(uiSourceCode){if(!this._active||uiSourceCode.project()!==this._project){return;}
this._updateInterceptionPatterns();const relativePath=FileSystemWorkspaceBinding.relativePath(uiSourceCode);const networkUISourceCode=this._networkUISourceCodeForEncodedPath.get(relativePath.join('/'));if(networkUISourceCode){await this._bind(networkUISourceCode,uiSourceCode);}}
_updateInterceptionPatterns(){this._updateInterceptionThrottler.schedule(innerUpdateInterceptionPatterns.bind(this));function innerUpdateInterceptionPatterns(){if(!this._active){return self.SDK.multitargetNetworkManager.setInterceptionHandlerForPatterns([],this._interceptionHandlerBound);}
const patterns=new Set();const indexFileName='index.html';for(const uiSourceCode of this._project.uiSourceCodes()){const pattern=this._patternForFileSystemUISourceCode(uiSourceCode);patterns.add(pattern);if(pattern.endsWith('/'+indexFileName)){patterns.add(pattern.substr(0,pattern.length-indexFileName.length));}}
return self.SDK.multitargetNetworkManager.setInterceptionHandlerForPatterns(Array.from(patterns).map(pattern=>({urlPattern:pattern,interceptionStage:Protocol.Network.InterceptionStage.HeadersReceived})),this._interceptionHandlerBound);}}
async _onUISourceCodeRemoved(uiSourceCode){await this._networkUISourceCodeRemoved(uiSourceCode);await this._filesystemUISourceCodeRemoved(uiSourceCode);}
async _networkUISourceCodeRemoved(uiSourceCode){if(uiSourceCode.project().type()===Workspace.projectTypes.Network){await this._unbind(uiSourceCode);this._networkUISourceCodeForEncodedPath.delete(this._encodedPathFromUrl(uiSourceCode.url()));}}
async _filesystemUISourceCodeRemoved(uiSourceCode){if(uiSourceCode.project()!==this._project){return;}
this._updateInterceptionPatterns();delete uiSourceCode[this._originalResponseContentPromiseSymbol];await this._unbind(uiSourceCode);}
async _setProject(project){if(project===this._project){return;}
if(this._project){await Promise.all(this._project.uiSourceCodes().map(uiSourceCode=>this._filesystemUISourceCodeRemoved(uiSourceCode)));}
this._project=project;if(this._project){await Promise.all(this._project.uiSourceCodes().map(uiSourceCode=>this._filesystemUISourceCodeAdded(uiSourceCode)));}
await this._updateActiveProject();this.dispatchEventToListeners(Events$2.ProjectChanged,this._project);}
async _onProjectAdded(project){if(project.type()!==Workspace.projectTypes.FileSystem||FileSystemWorkspaceBinding.fileSystemType(project)!=='overrides'){return;}
const fileSystemPath=FileSystemWorkspaceBinding.fileSystemPath(project.id());if(!fileSystemPath){return;}
if(this._project){this._project.remove();}
await this._setProject(project);}
async _onProjectRemoved(project){if(project===this._project){await this._setProject(null);}}
async _interceptionHandler(interceptedRequest){const method=interceptedRequest.request.method;if(!this._active||(method!=='GET'&&method!=='POST')){return;}
const path=(this._project).fileSystemPath()+'/'+
this._encodedPathFromUrl(interceptedRequest.request.url);const fileSystemUISourceCode=this._project.uiSourceCodeForURL(path);if(!fileSystemUISourceCode){return;}
let mimeType='';if(interceptedRequest.responseHeaders){const responseHeaders=NetworkManager.NetworkManager.lowercaseHeaders(interceptedRequest.responseHeaders);mimeType=responseHeaders['content-type'];}
if(!mimeType){const expectedResourceType=ResourceType.resourceTypes[interceptedRequest.resourceType]||ResourceType.resourceTypes.Other;mimeType=fileSystemUISourceCode.mimeType();if(ResourceType.ResourceType.fromMimeType(mimeType)!==expectedResourceType){mimeType=expectedResourceType.canonicalMimeType();}}
const project=(fileSystemUISourceCode.project());fileSystemUISourceCode[this._originalResponseContentPromiseSymbol]=interceptedRequest.responseBody().then(response=>{if(response.error||response.content===null){return null;}
return response.encoded?atob(response.content):response.content;});const blob=await project.requestFileBlob(fileSystemUISourceCode);interceptedRequest.continueRequestWithContent(new Blob([blob],{type:mimeType}));}}
const _reservedFileNames=new Set(['con','prn','aux','nul','com1','com2','com3','com4','com5','com6','com7','com8','com9','lpt1','lpt2','lpt3','lpt4','lpt5','lpt6','lpt7','lpt8','lpt9']);const Events$2={ProjectChanged:Symbol('ProjectChanged')};var NetworkPersistenceManager$1=Object.freeze({__proto__:null,NetworkPersistenceManager:NetworkPersistenceManager,Events:Events$2});class ContextMenuProvider{appendApplicableItems(event,contextMenu,target){const contentProvider=(target);async function saveAs(){if(contentProvider instanceof UISourceCode.UISourceCode){(contentProvider).commitWorkingCopy();}
let content=(await contentProvider.requestContent()).content||'';if(await contentProvider.contentEncoded()){content=window.atob(content);}
const url=contentProvider.contentURL();self.Workspace.fileManager.save(url,(content),true);self.Workspace.fileManager.close(url);}
if(contentProvider.contentType().isDocumentOrScriptOrStyleSheet()){contextMenu.saveSection().appendItem(UIString.UIString('Save as...'),saveAs);}
const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(contentProvider.contentURL());if(uiSourceCode&&self.Persistence.networkPersistenceManager.canSaveUISourceCodeForOverrides(uiSourceCode)){contextMenu.saveSection().appendItem(UIString.UIString('Save for overrides'),()=>{uiSourceCode.commitWorkingCopy();self.Persistence.networkPersistenceManager.saveUISourceCodeForOverrides((uiSourceCode));Revealer.reveal(uiSourceCode);});}
const binding=uiSourceCode&&self.Persistence.persistence.binding(uiSourceCode);const fileURL=binding?binding.fileSystem.contentURL():contentProvider.contentURL();if(fileURL.startsWith('file://')){const path=ParsedURL.ParsedURL.urlToPlatformPath(fileURL,Platform$1.isWin());contextMenu.revealSection().appendItem(UIString.UIString('Open in containing folder'),()=>InspectorFrontendHost.InspectorFrontendHostInstance.showItemInFolder(path));}}}
var PersistenceActions=Object.freeze({__proto__:null,ContextMenuProvider:ContextMenuProvider});class WorkspaceSettingsTab extends Widget.VBox{constructor(){super();this.registerRequiredCSS('persistence/workspaceSettingsTab.css');const header=this.element.createChild('header');header.createChild('h1').createTextChild(UIString.UIString('Workspace'));this.containerElement=this.element.createChild('div','settings-container-wrapper').createChild('div','settings-tab settings-content settings-container');IsolatedFileSystemManager.instance().addEventListener(Events.FileSystemAdded,event=>this._fileSystemAdded((event.data)),this);IsolatedFileSystemManager.instance().addEventListener(Events.FileSystemRemoved,event=>this._fileSystemRemoved((event.data)),this);const folderExcludePatternInput=this._createFolderExcludePatternInput();folderExcludePatternInput.classList.add('folder-exclude-pattern');this.containerElement.appendChild(folderExcludePatternInput);const div=this.containerElement.createChild('div','settings-info-message');div.createTextChild(UIString.UIString('Mappings are inferred automatically.'));this._fileSystemsListContainer=this.containerElement.createChild('div','');const addButton=UIUtils.createTextButton(ls`Add folder…`,this._addFileSystemClicked.bind(this));this.containerElement.appendChild(addButton);this.setDefaultFocusedElement(addButton);this._elementByPath=new Map();this._mappingViewByPath=new Map();const fileSystems=IsolatedFileSystemManager.instance().fileSystems();for(let i=0;i<fileSystems.length;++i){this._addItem(fileSystems[i]);}}
_createFolderExcludePatternInput(){const p=createElement('p');const labelElement=p.createChild('label');labelElement.textContent=ls`Folder exclude pattern`;const inputElement=UIUtils.createInput('','text');ARIAUtils.bindLabelToControl(labelElement,inputElement);p.appendChild(inputElement);inputElement.style.width='270px';const folderExcludeSetting=IsolatedFileSystemManager.instance().workspaceFolderExcludePatternSetting();const setValue=UIUtils.bindInput(inputElement,folderExcludeSetting.set.bind(folderExcludeSetting),regexValidator,false);folderExcludeSetting.addChangeListener(()=>setValue.call(null,folderExcludeSetting.get()));setValue(folderExcludeSetting.get());return p;function regexValidator(value){let regex;try{regex=new RegExp(value);}catch(e){}
const valid=!!regex;return{valid};}}
_addItem(fileSystem){if(!(fileSystem instanceof IsolatedFileSystem)){return;}
const networkPersistenceProject=self.Persistence.networkPersistenceManager.project();if(networkPersistenceProject&&IsolatedFileSystemManager.instance().fileSystem((networkPersistenceProject).fileSystemPath())===fileSystem){return;}
const element=this._renderFileSystem(fileSystem);this._elementByPath.set(fileSystem.path(),element);this._fileSystemsListContainer.appendChild(element);const mappingView=new EditFileSystemView(fileSystem.path());this._mappingViewByPath.set(fileSystem.path(),mappingView);mappingView.element.classList.add('file-system-mapping-view');mappingView.show(element);}
_renderFileSystem(fileSystem){const fileSystemPath=fileSystem.path();const lastIndexOfSlash=fileSystemPath.lastIndexOf('/');const folderName=fileSystemPath.substr(lastIndexOfSlash+1);const element=createElementWithClass('div','file-system-container');const header=element.createChild('div','file-system-header');const nameElement=header.createChild('div','file-system-name');nameElement.textContent=folderName;ARIAUtils.markAsHeading(nameElement,2);const path=header.createChild('div','file-system-path');path.textContent=fileSystemPath;path.title=fileSystemPath;const toolbar=new Toolbar.Toolbar('');const button=new Toolbar.ToolbarButton(UIString.UIString('Remove'),'largeicon-delete');button.addEventListener(Toolbar.ToolbarButton.Events.Click,this._removeFileSystemClicked.bind(this,fileSystem));toolbar.appendToolbarItem(button);header.appendChild(toolbar.element);return element;}
_removeFileSystemClicked(fileSystem){IsolatedFileSystemManager.instance().removeFileSystem(fileSystem);}
_addFileSystemClicked(){IsolatedFileSystemManager.instance().addFileSystem();}
_fileSystemAdded(fileSystem){this._addItem(fileSystem);}
_fileSystemRemoved(fileSystem){const mappingView=this._mappingViewByPath.get(fileSystem.path());if(mappingView){mappingView.dispose();this._mappingViewByPath.delete(fileSystem.path());}
const element=this._elementByPath.get(fileSystem.path());if(element){this._elementByPath.delete(fileSystem.path());element.remove();}}}
var WorkspaceSettingsTab$1=Object.freeze({__proto__:null,WorkspaceSettingsTab:WorkspaceSettingsTab});export{Automapping$1 as Automapping,EditFileSystemView$1 as EditFileSystemView,FileSystemWorkspaceBinding$1 as FileSystemWorkspaceBinding,IsolatedFileSystem$1 as IsolatedFileSystem,IsolatedFileSystemManager$1 as IsolatedFileSystemManager,NetworkPersistenceManager$1 as NetworkPersistenceManager,PersistenceImpl$1 as Persistence,PersistenceActions,PersistenceUtils$1 as PersistenceUtils,PlatformFileSystem$1 as PlatformFileSystem,WorkspaceSettingsTab$1 as WorkspaceSettingsTab};