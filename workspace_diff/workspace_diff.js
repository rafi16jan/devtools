import{ObjectWrapper}from'../common/common.js';import{Diff}from'../diff/diff.js';import{userMetrics,UserMetrics}from'../host/host.js';import{Workspace,UISourceCode}from'../workspace/workspace.js';class WorkspaceDiffImpl extends ObjectWrapper.ObjectWrapper{constructor(workspace){super();this._uiSourceCodeDiffs=new WeakMap();this._loadingUISourceCodes=new Map();this._modifiedUISourceCodes=new Set();workspace.addEventListener(Workspace.Events.WorkingCopyChanged,this._uiSourceCodeChanged,this);workspace.addEventListener(Workspace.Events.WorkingCopyCommitted,this._uiSourceCodeChanged,this);workspace.addEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);workspace.addEventListener(Workspace.Events.UISourceCodeRemoved,this._uiSourceCodeRemoved,this);workspace.addEventListener(Workspace.Events.ProjectRemoved,this._projectRemoved,this);workspace.uiSourceCodes().forEach(this._updateModifiedState.bind(this));}
requestDiff(uiSourceCode){return this._uiSourceCodeDiff(uiSourceCode).requestDiff();}
subscribeToDiffChange(uiSourceCode,callback,thisObj){this._uiSourceCodeDiff(uiSourceCode).addEventListener(Events.DiffChanged,callback,thisObj);}
unsubscribeFromDiffChange(uiSourceCode,callback,thisObj){this._uiSourceCodeDiff(uiSourceCode).removeEventListener(Events.DiffChanged,callback,thisObj);}
modifiedUISourceCodes(){return Array.from(this._modifiedUISourceCodes);}
isUISourceCodeModified(uiSourceCode){return this._modifiedUISourceCodes.has(uiSourceCode)||this._loadingUISourceCodes.has(uiSourceCode);}
_uiSourceCodeDiff(uiSourceCode){if(!this._uiSourceCodeDiffs.has(uiSourceCode)){this._uiSourceCodeDiffs.set(uiSourceCode,new UISourceCodeDiff(uiSourceCode));}
return this._uiSourceCodeDiffs.get(uiSourceCode);}
_uiSourceCodeChanged(event){const uiSourceCode=(event.data.uiSourceCode);this._updateModifiedState(uiSourceCode);}
_uiSourceCodeAdded(event){const uiSourceCode=(event.data);this._updateModifiedState(uiSourceCode);}
_uiSourceCodeRemoved(event){const uiSourceCode=(event.data);this._removeUISourceCode(uiSourceCode);}
_projectRemoved(event){const project=(event.data);for(const uiSourceCode of project.uiSourceCodes()){this._removeUISourceCode(uiSourceCode);}}
_removeUISourceCode(uiSourceCode){this._loadingUISourceCodes.delete(uiSourceCode);const uiSourceCodeDiff=this._uiSourceCodeDiffs.get(uiSourceCode);if(uiSourceCodeDiff){uiSourceCodeDiff._dispose=true;}
this._markAsUnmodified(uiSourceCode);}
_markAsUnmodified(uiSourceCode){this._uiSourceCodeProcessedForTest();if(this._modifiedUISourceCodes.delete(uiSourceCode)){this.dispatchEventToListeners(Events.ModifiedStatusChanged,{uiSourceCode,isModified:false});}}
_markAsModified(uiSourceCode){this._uiSourceCodeProcessedForTest();if(this._modifiedUISourceCodes.has(uiSourceCode)){return;}
this._modifiedUISourceCodes.add(uiSourceCode);this.dispatchEventToListeners(Events.ModifiedStatusChanged,{uiSourceCode,isModified:true});}
_uiSourceCodeProcessedForTest(){}
async _updateModifiedState(uiSourceCode){this._loadingUISourceCodes.delete(uiSourceCode);if(uiSourceCode.project().type()!==Workspace.projectTypes.Network){this._markAsUnmodified(uiSourceCode);return;}
if(uiSourceCode.isDirty()){this._markAsModified(uiSourceCode);return;}
if(!uiSourceCode.hasCommits()){this._markAsUnmodified(uiSourceCode);return;}
const contentsPromise=Promise.all([this.requestOriginalContentForUISourceCode(uiSourceCode),uiSourceCode.requestContent().then(deferredContent=>deferredContent.content)]);this._loadingUISourceCodes.set(uiSourceCode,contentsPromise);const contents=await contentsPromise;if(this._loadingUISourceCodes.get(uiSourceCode)!==contentsPromise){return;}
this._loadingUISourceCodes.delete(uiSourceCode);if(contents[0]!==null&&contents[1]!==null&&contents[0]!==contents[1]){this._markAsModified(uiSourceCode);}else{this._markAsUnmodified(uiSourceCode);}}
requestOriginalContentForUISourceCode(uiSourceCode){return this._uiSourceCodeDiff(uiSourceCode)._originalContent();}
revertToOriginal(uiSourceCode){function callback(content){if(typeof content!=='string'){return;}
uiSourceCode.addRevision(content);}
userMetrics.actionTaken(UserMetrics.Action.RevisionApplied);return this.requestOriginalContentForUISourceCode(uiSourceCode).then(callback);}}
class UISourceCodeDiff extends ObjectWrapper.ObjectWrapper{constructor(uiSourceCode){super();this._uiSourceCode=uiSourceCode;uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._uiSourceCodeChanged,this);uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._uiSourceCodeChanged,this);this._requestDiffPromise=null;this._pendingChanges=null;this._dispose=false;}
_uiSourceCodeChanged(){if(this._pendingChanges){clearTimeout(this._pendingChanges);this._pendingChanges=null;}
this._requestDiffPromise=null;const content=this._uiSourceCode.content();const delay=(!content||content.length<65536)?0:UpdateTimeout;this._pendingChanges=setTimeout(emitDiffChanged.bind(this),delay);function emitDiffChanged(){if(this._dispose){return;}
this.dispatchEventToListeners(Events.DiffChanged);this._pendingChanges=null;}}
requestDiff(){if(!this._requestDiffPromise){this._requestDiffPromise=this._innerRequestDiff();}
return this._requestDiffPromise;}
async _originalContent(){const originalNetworkContent=self.Persistence.networkPersistenceManager.originalContentForUISourceCode(this._uiSourceCode);if(originalNetworkContent){return originalNetworkContent;}
const content=await this._uiSourceCode.project().requestFileContent(this._uiSourceCode);return content.content||content.error||'';}
async _innerRequestDiff(){if(this._dispose){return null;}
const baseline=await this._originalContent();if(baseline.length>1024*1024){return null;}
if(this._dispose){return null;}
let current=this._uiSourceCode.workingCopy();if(!current&&!this._uiSourceCode.contentLoaded()){current=(await this._uiSourceCode.requestContent()).content;}
if(current.length>1024*1024){return null;}
if(this._dispose){return null;}
if(current===null||baseline===null){return null;}
return Diff.DiffWrapper.lineDiff(baseline.split(/\r\n|\n|\r/),current.split(/\r\n|\n|\r/));}}
const Events={DiffChanged:Symbol('DiffChanged'),ModifiedStatusChanged:Symbol('ModifiedStatusChanged')};let _instance=null;function workspaceDiff(){if(!_instance){_instance=new WorkspaceDiffImpl(Workspace.WorkspaceImpl.instance());}
return _instance;}
class DiffUILocation{constructor(uiSourceCode){this.uiSourceCode=uiSourceCode;}}
const UpdateTimeout=200;var WorkspaceDiff=Object.freeze({__proto__:null,WorkspaceDiffImpl:WorkspaceDiffImpl,UISourceCodeDiff:UISourceCodeDiff,Events:Events,workspaceDiff:workspaceDiff,DiffUILocation:DiffUILocation,UpdateTimeout:UpdateTimeout});export{WorkspaceDiff};