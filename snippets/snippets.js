import{Settings,ResourceType,Console,UIString}from'../common/common.js';import{PlatformFileSystem,FileSystemWorkspaceBinding,IsolatedFileSystemManager}from'../persistence/persistence.js';import{RuntimeModel,ConsoleModel}from'../sdk/sdk.js';import'../text_utils/text_utils.js';import{Workspace}from'../workspace/workspace.js';import{FilteredListWidget}from'../quick_open/quick_open.js';class SnippetFileSystem extends PlatformFileSystem.PlatformFileSystem{constructor(){super('snippet://','snippets');this._lastSnippetIdentifierSetting=Settings.Settings.instance().createSetting('scriptSnippets_lastIdentifier',0);this._snippetsSetting=Settings.Settings.instance().createSetting('scriptSnippets',[]);}
initialFilePaths(){const savedSnippets=this._snippetsSetting.get();return savedSnippets.map(snippet=>escape(snippet.name));}
async createFile(path,name){const nextId=this._lastSnippetIdentifierSetting.get()+1;this._lastSnippetIdentifierSetting.set(nextId);const snippetName=ls`Script snippet #${nextId}`;const snippets=this._snippetsSetting.get();snippets.push({name:snippetName,content:''});this._snippetsSetting.set(snippets);return escape(snippetName);}
async deleteFile(path){const name=unescape(path.substring(1));const allSnippets=this._snippetsSetting.get();const snippets=allSnippets.filter(snippet=>snippet.name!==name);if(allSnippets.length!==snippets.length){this._snippetsSetting.set(snippets);return true;}
return false;}
async requestFileContent(path){const name=unescape(path.substring(1));const snippet=this._snippetsSetting.get().find(snippet=>snippet.name===name);return{content:snippet?snippet.content:null,isEncoded:false};}
async setFileContent(path,content,isBase64){const name=unescape(path.substring(1));const snippets=this._snippetsSetting.get();const snippet=snippets.find(snippet=>snippet.name===name);if(snippet){snippet.content=content;this._snippetsSetting.set(snippets);return true;}
return false;}
renameFile(path,newName,callback){const name=unescape(path.substring(1));const snippets=this._snippetsSetting.get();const snippet=snippets.find(snippet=>snippet.name===name);newName=newName.trim();if(!snippet||newName.length===0||snippets.find(snippet=>snippet.name===newName)){callback(false);return;}
snippet.name=newName;this._snippetsSetting.set(snippets);callback(true,newName);}
async searchInPath(query,progress){const re=new RegExp(query.escapeForRegExp(),'i');const snippets=this._snippetsSetting.get().filter(snippet=>snippet.content.match(re));return snippets.map(snippet=>escape(snippet.name));}
mimeFromPath(path){return'text/javascript';}
contentType(path){return ResourceType.resourceTypes.Script;}
tooltipForURL(url){return ls`Linked to ${unescape(url.substring(this.path().length))}`;}
supportsAutomapping(){return true;}}
async function evaluateScriptSnippet(uiSourceCode){if(!uiSourceCode.url().startsWith('snippet://')){return;}
const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!executionContext){return;}
const runtimeModel=executionContext.runtimeModel;await uiSourceCode.requestContent();uiSourceCode.commitWorkingCopy();const expression=uiSourceCode.workingCopy();Console.Console.instance().show();const url=uiSourceCode.url();const result=await executionContext.evaluate({expression:`${expression}\n//# sourceURL=${url}`,objectGroup:'console',silent:false,includeCommandLineAPI:true,returnByValue:false,generatePreview:true,replMode:true,},false,true);if(result.exceptionDetails){ConsoleModel.ConsoleModel.instance().addMessage(ConsoleModel.ConsoleMessage.fromException(runtimeModel,result.exceptionDetails,undefined,undefined,url));return;}
if(!result.object){return;}
const scripts=executionContext.debuggerModel.scriptsForSourceURL(url);const scriptId=scripts[scripts.length-1].scriptId;ConsoleModel.ConsoleModel.instance().addMessage(new ConsoleModel.ConsoleMessage(runtimeModel,ConsoleModel.MessageSource.JS,ConsoleModel.MessageLevel.Info,'',ConsoleModel.MessageType.Result,url,undefined,undefined,[result.object],undefined,undefined,executionContext.id,scriptId));}
function isSnippetsUISourceCode(uiSourceCode){return uiSourceCode.url().startsWith('snippet://');}
function isSnippetsProject(project){return project.type()===Workspace.projectTypes.FileSystem&&FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(project)==='snippets';}
IsolatedFileSystemManager.IsolatedFileSystemManager.instance().addPlatformFileSystem('snippet://',new SnippetFileSystem());var ScriptSnippetFileSystem=Object.freeze({__proto__:null,evaluateScriptSnippet:evaluateScriptSnippet,isSnippetsUISourceCode:isSnippetsUISourceCode,isSnippetsProject:isSnippetsProject});class SnippetsQuickOpen extends FilteredListWidget.Provider{constructor(){super();this._snippets=[];}
selectItem(itemIndex,promptValue){if(itemIndex===null){return;}
evaluateScriptSnippet(this._snippets[itemIndex]);}
notFoundText(query){return UIString.UIString('No snippets found.');}
attach(){this._snippets=Snippets.project.uiSourceCodes();}
detach(){this._snippets=[];}
itemCount(){return this._snippets.length;}
itemKeyAt(itemIndex){return this._snippets[itemIndex].name();}
renderItem(itemIndex,query,titleElement,subtitleElement){titleElement.textContent=unescape(this._snippets[itemIndex].name());titleElement.classList.add('monospace');FilteredListWidget.FilteredListWidget.highlightRanges(titleElement,query,true);}}
var SnippetsQuickOpen$1=Object.freeze({__proto__:null,SnippetsQuickOpen:SnippetsQuickOpen});export{ScriptSnippetFileSystem,SnippetsQuickOpen$1 as SnippetsQuickOpen};