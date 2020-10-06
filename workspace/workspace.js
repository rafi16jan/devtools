import{ObjectWrapper,ParsedURL,UIString,Revealer}from'../common/common.js';import{InspectorFrontendHost,InspectorFrontendHostAPI}from'../host/host.js';import{Multimap}from'../platform/platform.js';import{TextUtils,TextRange}from'../text_utils/text_utils.js';class FileManager extends ObjectWrapper.ObjectWrapper{constructor(){super();this._saveCallbacks=new Map();InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.SavedURL,this._savedURL,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.CanceledSaveURL,this._canceledSavedURL,this);InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.AppendedToURL,this._appendedToURL,this);}
save(url,content,forceSaveAs){const result=new Promise(resolve=>this._saveCallbacks.set(url,resolve));InspectorFrontendHost.InspectorFrontendHostInstance.save(url,content,forceSaveAs);return result;}
_savedURL(event){const url=(event.data.url);const callback=this._saveCallbacks.get(url);this._saveCallbacks.delete(url);if(callback){callback({fileSystemPath:(event.data.fileSystemPath)});}}
_canceledSavedURL(event){const url=(event.data);const callback=this._saveCallbacks.get(url);this._saveCallbacks.delete(url);if(callback){callback(null);}}
append(url,content){InspectorFrontendHost.InspectorFrontendHostInstance.append(url,content);}
close(url){InspectorFrontendHost.InspectorFrontendHostInstance.close(url);}
_appendedToURL(event){const url=(event.data);this.dispatchEventToListeners(Events.AppendedToURL,url);}}
const Events={AppendedToURL:Symbol('AppendedToURL')};var FileManager$1=Object.freeze({__proto__:null,FileManager:FileManager,Events:Events});class ProjectSearchConfig{query(){throw new Error('not implemented');}
ignoreCase(){throw new Error('not implemented');}
isRegex(){throw new Error('not implemented');}
queries(){throw new Error('not implemented');}
filePathMatchesFileQuery(filePath){throw new Error('not implemented');}}
class Project{workspace(){throw new Error('not implemented');}
id(){throw new Error('not implemented');}
type(){throw new Error('not implemented');}
isServiceProject(){throw new Error('not implemented');}
displayName(){throw new Error('not implemented');}
requestMetadata(uiSourceCode){throw new Error('not implemented');}
requestFileContent(uiSourceCode){throw new Error('not implemented');}
canSetFileContent(){throw new Error('not implemented');}
setFileContent(uiSourceCode,newContent,isBase64){throw new Error('not implemented');}
fullDisplayName(uiSourceCode){throw new Error('not implemented');}
mimeType(uiSourceCode){throw new Error('not implemented');}
canRename(){throw new Error('not implemented');}
rename(uiSourceCode,newName,callback){}
excludeFolder(path){}
canExcludeFolder(path){throw new Error('not implemented');}
createFile(path,name,content,isBase64){throw new Error('not implemented');}
canCreateFile(){throw new Error('not implemented');}
deleteFile(uiSourceCode){}
remove(){}
searchInFileContent(uiSourceCode,query,caseSensitive,isRegex){throw new Error('not implemented');}
findFilesMatchingSearchRequest(searchConfig,filesMathingFileQuery,progress){throw new Error('not implemented');}
indexContent(progress){}
uiSourceCodeForURL(url){throw new Error('not implemented');}
uiSourceCodes(){throw new Error('not implemented');}}
const projectTypes={Debugger:'debugger',Formatter:'formatter',Network:'network',FileSystem:'filesystem',ContentScripts:'contentscripts',Service:'service'};class ProjectStore{constructor(workspace,id,type,displayName){this._workspace=workspace;this._id=id;this._type=type;this._displayName=displayName;this._uiSourceCodesMap=new Map();this._uiSourceCodesList=[];this._project=((this));}
id(){return this._id;}
type(){return this._type;}
displayName(){return this._displayName;}
workspace(){return this._workspace;}
createUISourceCode(url,contentType){return new UISourceCode(this._project,url,contentType);}
addUISourceCode(uiSourceCode){const url=uiSourceCode.url();if(this.uiSourceCodeForURL(url)){return false;}
this._uiSourceCodesMap.set(url,{uiSourceCode:uiSourceCode,index:this._uiSourceCodesList.length});this._uiSourceCodesList.push(uiSourceCode);this._workspace.dispatchEventToListeners(Events$1.UISourceCodeAdded,uiSourceCode);return true;}
removeUISourceCode(url){const uiSourceCode=this.uiSourceCodeForURL(url);if(!uiSourceCode){return;}
const entry=this._uiSourceCodesMap.get(url);if(!entry){return;}
const movedUISourceCode=this._uiSourceCodesList[this._uiSourceCodesList.length-1];this._uiSourceCodesList[entry.index]=movedUISourceCode;const movedEntry=this._uiSourceCodesMap.get(movedUISourceCode.url());if(movedEntry){movedEntry.index=entry.index;}
this._uiSourceCodesList.splice(this._uiSourceCodesList.length-1,1);this._uiSourceCodesMap.delete(url);this._workspace.dispatchEventToListeners(Events$1.UISourceCodeRemoved,entry.uiSourceCode);}
removeProject(){this._workspace._removeProject(this._project);this._uiSourceCodesMap=new Map();this._uiSourceCodesList=[];}
uiSourceCodeForURL(url){const entry=this._uiSourceCodesMap.get(url);return entry?entry.uiSourceCode:null;}
uiSourceCodes(){return this._uiSourceCodesList;}
renameUISourceCode(uiSourceCode,newName){const oldPath=uiSourceCode.url();const newPath=uiSourceCode.parentURL()?uiSourceCode.parentURL()+'/'+newName:newName;const value=(this._uiSourceCodesMap.get(oldPath));this._uiSourceCodesMap.set(newPath,value);this._uiSourceCodesMap.delete(oldPath);}}
let workspaceInstance;class WorkspaceImpl extends ObjectWrapper.ObjectWrapper{constructor(){super();this._projects=new Map();this._hasResourceContentTrackingExtensions=false;}
static instance(opts={forceNew:null}){const{forceNew}=opts;if(!workspaceInstance||forceNew){workspaceInstance=new WorkspaceImpl();}
return workspaceInstance;}
uiSourceCode(projectId,url){const project=this._projects.get(projectId);return project?project.uiSourceCodeForURL(url):null;}
uiSourceCodeForURL(url){for(const project of this._projects.values()){const uiSourceCode=project.uiSourceCodeForURL(url);if(uiSourceCode){return uiSourceCode;}}
return null;}
uiSourceCodesForProjectType(type){const result=[];for(const project of this._projects.values()){if(project.type()===type){result.push(...project.uiSourceCodes());}}
return result;}
addProject(project){console.assert(!this._projects.has(project.id()),`A project with id ${project.id()} already exists!`);this._projects.set(project.id(),project);this.dispatchEventToListeners(Events$1.ProjectAdded,project);}
_removeProject(project){this._projects.delete(project.id());this.dispatchEventToListeners(Events$1.ProjectRemoved,project);}
project(projectId){return this._projects.get(projectId)||null;}
projects(){return[...this._projects.values()];}
projectsForType(type){function filterByType(project){return project.type()===type;}
return this.projects().filter(filterByType);}
uiSourceCodes(){const result=[];for(const project of this._projects.values()){result.push(...project.uiSourceCodes());}
return result;}
setHasResourceContentTrackingExtensions(hasExtensions){this._hasResourceContentTrackingExtensions=hasExtensions;}
hasResourceContentTrackingExtensions(){return this._hasResourceContentTrackingExtensions;}}
const Events$1={UISourceCodeAdded:Symbol('UISourceCodeAdded'),UISourceCodeRemoved:Symbol('UISourceCodeRemoved'),UISourceCodeRenamed:Symbol('UISourceCodeRenamed'),WorkingCopyChanged:Symbol('WorkingCopyChanged'),WorkingCopyCommitted:Symbol('WorkingCopyCommitted'),WorkingCopyCommittedByUser:Symbol('WorkingCopyCommittedByUser'),ProjectAdded:Symbol('ProjectAdded'),ProjectRemoved:Symbol('ProjectRemoved')};var WorkspaceImpl$1=Object.freeze({__proto__:null,ProjectSearchConfig:ProjectSearchConfig,Project:Project,projectTypes:projectTypes,ProjectStore:ProjectStore,WorkspaceImpl:WorkspaceImpl,Events:Events$1});class UISourceCode extends ObjectWrapper.ObjectWrapper{constructor(project,url,contentType){super();this._project=project;this._url=url;const parsedURL=ParsedURL.ParsedURL.fromString(url);if(parsedURL){this._origin=parsedURL.securityOrigin();this._parentURL=this._origin+parsedURL.folderPathComponents;this._name=parsedURL.lastPathComponent;if(parsedURL.queryParams){this._name+='?'+parsedURL.queryParams;}}else{this._origin='';this._parentURL='';this._name=url;}
this._contentType=contentType;this._requestContentPromise=null;this._decorations=null;this._hasCommits=false;this._messages=null;this._contentLoaded=false;this._content=null;this._forceLoadOnCheckContent=false;this._checkingContent=false;this._lastAcceptedContent=null;this._workingCopy=null;this._workingCopyGetter=null;this._disableEdit=false;}
requestMetadata(){return this._project.requestMetadata(this);}
name(){return this._name;}
mimeType(){return this._project.mimeType(this);}
url(){return this._url;}
parentURL(){return this._parentURL;}
origin(){return this._origin;}
fullDisplayName(){return this._project.fullDisplayName(this);}
displayName(skipTrim){if(!this._name){return UIString.UIString('(index)');}
let name=this._name;try{if(this.project().type()===projectTypes.FileSystem){name=unescape(name);}else{name=decodeURI(name);}}catch(e){}
return skipTrim?name:name.trimEndWithMaxLength(100);}
canRename(){return this._project.canRename();}
rename(newName){let fulfill;const promise=new Promise(x=>fulfill=x);this._project.rename(this,newName,innerCallback.bind(this));return promise;function innerCallback(success,newName,newURL,newContentType){if(success){this._updateName((newName),(newURL),(newContentType));}
fulfill(success);}}
remove(){this._project.deleteFile(this);}
_updateName(name,url,contentType){const oldURL=this._url;this._url=this._url.substring(0,this._url.length-this._name.length)+name;this._name=name;if(url){this._url=url;}
if(contentType){this._contentType=contentType;}
this.dispatchEventToListeners(Events$2.TitleChanged,this);this.project().workspace().dispatchEventToListeners(Events$1.UISourceCodeRenamed,{oldURL:oldURL,uiSourceCode:this});}
contentURL(){return this.url();}
contentType(){return this._contentType;}
async contentEncoded(){await this.requestContent();return this._contentEncoded||false;}
project(){return this._project;}
requestContent(){if(this._requestContentPromise){return this._requestContentPromise;}
if(this._contentLoaded){return Promise.resolve((this._content));}
this._requestContentPromise=this._requestContentImpl();return this._requestContentPromise;}
async _requestContentImpl(){try{const content=await this._project.requestFileContent(this);if(!this._contentLoaded){this._contentLoaded=true;this._content=content;this._contentEncoded=content.isEncoded;}}catch(err){this._contentLoaded=true;this._content={error:err?String(err):'',isEncoded:false};}
return(this._content);}
async checkContentUpdated(){if(!this._contentLoaded&&!this._forceLoadOnCheckContent){return;}
if(!this._project.canSetFileContent()||this._checkingContent){return;}
this._checkingContent=true;const updatedContent=await this._project.requestFileContent(this);if('error'in updatedContent){return;}
this._checkingContent=false;if(updatedContent.content===null){const workingCopy=this.workingCopy();this._contentCommitted('',false);this.setWorkingCopy(workingCopy);return;}
if(this._lastAcceptedContent===updatedContent.content){return;}
if(this._content&&'content'in this._content&&this._content.content===updatedContent.content){this._lastAcceptedContent=null;return;}
if(!this.isDirty()||this._workingCopy===updatedContent.content){this._contentCommitted((updatedContent.content),false);return;}
await Revealer.reveal(this);await new Promise(resolve=>setTimeout(resolve,0));const shouldUpdate=window.confirm(ls`This file was changed externally. Would you like to reload it?`);if(shouldUpdate){this._contentCommitted((updatedContent.content),false);}else{this._lastAcceptedContent=updatedContent.content;}}
forceLoadOnCheckContent(){this._forceLoadOnCheckContent=true;}
_commitContent(content){if(this._project.canSetFileContent()){this._project.setFileContent(this,content,false);}
this._contentCommitted(content,true);}
_contentCommitted(content,committedByUser){this._lastAcceptedContent=null;this._content={content,isEncoded:false};this._contentLoaded=true;this._requestContentPromise=null;this._hasCommits=true;this._innerResetWorkingCopy();const data={uiSourceCode:this,content,encoded:this._contentEncoded};this.dispatchEventToListeners(Events$2.WorkingCopyCommitted,data);this._project.workspace().dispatchEventToListeners(Events$1.WorkingCopyCommitted,data);if(committedByUser){this._project.workspace().dispatchEventToListeners(Events$1.WorkingCopyCommittedByUser,data);}}
addRevision(content){this._commitContent(content);}
hasCommits(){return this._hasCommits;}
workingCopy(){if(this._workingCopyGetter){this._workingCopy=this._workingCopyGetter();this._workingCopyGetter=null;}
if(this.isDirty()){return(this._workingCopy);}
return(this._content&&'content'in this._content&&this._content.content)||'';}
resetWorkingCopy(){this._innerResetWorkingCopy();this._workingCopyChanged();}
_innerResetWorkingCopy(){this._workingCopy=null;this._workingCopyGetter=null;}
setWorkingCopy(newWorkingCopy){this._workingCopy=newWorkingCopy;this._workingCopyGetter=null;this._workingCopyChanged();}
setContent(content,isBase64){this._contentEncoded=isBase64;if(this._project.canSetFileContent()){this._project.setFileContent(this,content,isBase64);}
this._contentCommitted(content,true);}
setWorkingCopyGetter(workingCopyGetter){this._workingCopyGetter=workingCopyGetter;this._workingCopyChanged();}
_workingCopyChanged(){this._removeAllMessages();this.dispatchEventToListeners(Events$2.WorkingCopyChanged,this);this._project.workspace().dispatchEventToListeners(Events$1.WorkingCopyChanged,{uiSourceCode:this});}
removeWorkingCopyGetter(){if(!this._workingCopyGetter){return;}
this._workingCopy=this._workingCopyGetter();this._workingCopyGetter=null;}
commitWorkingCopy(){if(this.isDirty()){this._commitContent(this.workingCopy());}}
isDirty(){return this._workingCopy!==null||this._workingCopyGetter!==null;}
extension(){return ParsedURL.ParsedURL.extractExtension(this._name);}
content(){return(this._content&&'content'in this._content&&this._content.content)||'';}
loadError(){return(this._content&&'error'in this._content&&this._content.error)||null;}
searchInContent(query,caseSensitive,isRegex){const content=this.content();if(!content){return this._project.searchInFileContent(this,query,caseSensitive,isRegex);}
return Promise.resolve(TextUtils.performSearchInContent(content,query,caseSensitive,isRegex));}
contentLoaded(){return this._contentLoaded;}
uiLocation(lineNumber,columnNumber){if(typeof columnNumber==='undefined'){columnNumber=0;}
return new UILocation(this,lineNumber,columnNumber);}
messages(){return this._messages?new Set(this._messages):new Set();}
addLineMessage(level,text,lineNumber,columnNumber){return this.addMessage(level,text,new TextRange.TextRange(lineNumber,columnNumber||0,lineNumber,columnNumber||0));}
addMessage(level,text,range){const message=new Message(this,level,text,range);if(!this._messages){this._messages=new Set();}
this._messages.add(message);this.dispatchEventToListeners(Events$2.MessageAdded,message);return message;}
removeMessage(message){if(this._messages&&this._messages.delete(message)){this.dispatchEventToListeners(Events$2.MessageRemoved,message);}}
_removeAllMessages(){if(!this._messages){return;}
for(const message of this._messages){this.dispatchEventToListeners(Events$2.MessageRemoved,message);}
this._messages=null;}
addLineDecoration(lineNumber,type,data){this.addDecoration(TextRange.TextRange.createFromLocation(lineNumber,0),type,data);}
addDecoration(range,type,data){const marker=new LineMarker(range,type,data);if(!this._decorations){this._decorations=new Multimap();}
this._decorations.set(type,marker);this.dispatchEventToListeners(Events$2.LineDecorationAdded,marker);}
removeDecorationsForType(type){if(!this._decorations){return;}
const markers=this._decorations.get(type);this._decorations.deleteAll(type);markers.forEach(marker=>{this.dispatchEventToListeners(Events$2.LineDecorationRemoved,marker);});}
allDecorations(){return this._decorations?this._decorations.valuesArray():[];}
removeAllDecorations(){if(!this._decorations){return;}
const decorationList=this._decorations.valuesArray();this._decorations.clear();decorationList.forEach(marker=>this.dispatchEventToListeners(Events$2.LineDecorationRemoved,marker));}
decorationsForType(type){return this._decorations?this._decorations.get(type):null;}
disableEdit(){this._disableEdit=true;}
editDisabled(){return this._disableEdit;}}
const Events$2={WorkingCopyChanged:Symbol('WorkingCopyChanged'),WorkingCopyCommitted:Symbol('WorkingCopyCommitted'),TitleChanged:Symbol('TitleChanged'),MessageAdded:Symbol('MessageAdded'),MessageRemoved:Symbol('MessageRemoved'),LineDecorationAdded:Symbol('LineDecorationAdded'),LineDecorationRemoved:Symbol('LineDecorationRemoved')};class UILocation{constructor(uiSourceCode,lineNumber,columnNumber){this.uiSourceCode=uiSourceCode;this.lineNumber=lineNumber;this.columnNumber=columnNumber;}
linkText(skipTrim){let linkText=this.uiSourceCode.displayName(skipTrim);if(typeof this.lineNumber==='number'){linkText+=':'+(this.lineNumber+1);}
return linkText;}
id(){return this.uiSourceCode.project().id()+':'+this.uiSourceCode.url()+':'+this.lineNumber+':'+
this.columnNumber;}
toUIString(){return this.uiSourceCode.url()+':'+(this.lineNumber+1);}
static comparator(location1,location2){return location1.compareTo(location2);}
compareTo(other){if(this.uiSourceCode.url()!==other.uiSourceCode.url()){return this.uiSourceCode.url()>other.uiSourceCode.url()?1:-1;}
if(this.lineNumber!==other.lineNumber){return this.lineNumber-other.lineNumber;}
return this.columnNumber-other.columnNumber;}}
class Message{constructor(uiSourceCode,level,text,range){this._uiSourceCode=uiSourceCode;this._level=level;this._text=text;this._range=range;}
uiSourceCode(){return this._uiSourceCode;}
level(){return this._level;}
text(){return this._text;}
range(){return this._range;}
lineNumber(){return this._range.startLine;}
columnNumber(){return this._range.startColumn;}
isEqual(another){return this._uiSourceCode===another._uiSourceCode&&this.text()===another.text()&&this.level()===another.level()&&this.range().equal(another.range());}
remove(){this._uiSourceCode.removeMessage(this);}}
Message.Level={Error:'Error',Warning:'Warning'};class LineMarker{constructor(range,type,data){this._range=range;this._type=type;this._data=data;}
range(){return this._range;}
type(){return this._type;}
data(){return this._data;}}
class UISourceCodeMetadata{constructor(modificationTime,contentSize){this.modificationTime=modificationTime;this.contentSize=contentSize;}}
var UISourceCode$1=Object.freeze({__proto__:null,UISourceCode:UISourceCode,Events:Events$2,UILocation:UILocation,Message:Message,LineMarker:LineMarker,UISourceCodeMetadata:UISourceCodeMetadata});export{FileManager$1 as FileManager,UISourceCode$1 as UISourceCode,WorkspaceImpl$1 as Workspace};