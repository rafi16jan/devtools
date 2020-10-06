import{UIString,Throttler,Revealer,Color,Linkifier,Progress,Settings,ParsedURL,Trie,EventTarget,ResourceType,ObjectWrapper}from'../common/common.js';import{Widget,UIUtils,Dialog,GlassPane,Toolbar,TextEditor,View,ListModel,ListControl,ARIAUtils,Icon,ContextMenu,ViewManager,ShortcutsScreen,KeyboardShortcut,Geometry,Utils,TreeOutline,InplaceEditor,PopoverHelper,TabbedPane,SearchableView,XLink,Panel,DropTarget,SplitWidget,SettingsUI,Infobar,ThrottledWidget,EmptyWidget,Fragment}from'../ui/ui.js';import{JavaScriptAutocomplete,JavaScriptREPL,ObjectPopoverHelper,RemoteObjectPreviewFormatter,ObjectPropertiesSection}from'../object_ui/object_ui.js';import{LiveLocation,BlackboxManager,DebuggerWorkspaceBinding,DefaultScriptMapping,NetworkProject,CompilerScriptMapping,BreakpointManager,ResourceScriptMapping}from'../bindings/bindings.js';import{InspectorFrontendHost,Platform as Platform$1,userMetrics,UserMetrics}from'../host/host.js';import{DebuggerModel,SDKModel,CSSMetadata,DOMDebuggerModel,RemoteObject as RemoteObject$1,OverlayModel,RuntimeModel,ConsoleModel,NetworkRequest}from'../sdk/sdk.js';import{Workspace,UISourceCode}from'../workspace/workspace.js';import{CoverageModel}from'../coverage/coverage.js';import{sourceFormatter,FormatterWorkerPool,ScriptFormatter}from'../formatter/formatter.js';import{SourcesTextEditor,SourceCodeDiff,SourceFrame,ImageView,FontView}from'../source_frame/source_frame.js';import{Spectrum}from'../color_picker/color_picker.js';import{SwatchPopoverHelper,ColorSwatch,BezierEditor}from'../inline_editor/inline_editor.js';import{StringUtilities,Multimap,NumberUtilities,ArrayUtilities}from'../platform/platform.js';import{TextRange,TextUtils,Text,TextCursor}from'../text_utils/text_utils.js';import{CodeMirrorUtils}from'../text_editor/text_editor.js';import{ExtensionServer}from'../extensions/extensions.js';import{ScriptSnippetFileSystem}from'../snippets/snippets.js';import{Persistence,FileSystemWorkspaceBinding,PersistenceUtils,NetworkPersistenceManager,IsolatedFileSystemManager}from'../persistence/persistence.js';import{SearchView}from'../search/search.js';import{QuickOpen,FilteredListWidget}from'../quick_open/quick_open.js';import'../diff/diff.js';import{WorkspaceDiff}from'../workspace_diff/workspace_diff.js';import{Linkifier as Linkifier$1}from'../components/components.js';class AddSourceMapURLDialog extends Widget.HBox{constructor(callback){super(true);this.registerRequiredCSS('sources/dialog.css');this.contentElement.createChild('label').textContent=UIString.UIString('Source map URL: ');this._input=UIUtils.createInput('add-source-map','text');this._input.addEventListener('keydown',this._onKeyDown.bind(this),false);this.contentElement.appendChild(this._input);const addButton=UIUtils.createTextButton(ls`Add`,this._apply.bind(this));this.contentElement.appendChild(addButton);this._dialog=new Dialog.Dialog();this._dialog.setSizeBehavior(GlassPane.SizeBehavior.MeasureContent);this._dialog.setDefaultFocusedElement(this._input);this._done=function(value){this._dialog.hide();callback(value);};}
show(){super.show(this._dialog.contentElement);this._dialog.show();}
_apply(){this._done(this._input.value);}
_onKeyDown(event){if(isEnterKey(event)){event.consume(true);this._apply();}}}
var AddSourceMapURLDialog$1=Object.freeze({__proto__:null,AddSourceMapURLDialog:AddSourceMapURLDialog});class BreakpointEditDialog extends Widget.Widget{constructor(editorLineNumber,oldCondition,preferLogpoint,onFinish){super(true);this.registerRequiredCSS('sources/breakpointEditDialog.css');this._onFinish=onFinish;this._finished=false;this._editor=null;this.element.tabIndex=-1;const logpointPrefix=LogpointPrefix;const logpointSuffix=LogpointSuffix;this._isLogpoint=oldCondition.startsWith(logpointPrefix)&&oldCondition.endsWith(logpointSuffix);if(this._isLogpoint){oldCondition=oldCondition.substring(logpointPrefix.length,oldCondition.length-logpointSuffix.length);}
this._isLogpoint=this._isLogpoint||preferLogpoint;this.element.classList.add('sources-edit-breakpoint-dialog');const toolbar=new Toolbar.Toolbar('source-frame-breakpoint-toolbar',this.contentElement);toolbar.appendText(`Line ${editorLineNumber + 1}:`);this._typeSelector=new Toolbar.ToolbarComboBox(this._onTypeChanged.bind(this),ls`Breakpoint type`);this._typeSelector.createOption(ls`Breakpoint`,BreakpointType.Breakpoint);const conditionalOption=this._typeSelector.createOption(ls`Conditional breakpoint`,BreakpointType.Conditional);const logpointOption=this._typeSelector.createOption(ls`Logpoint`,BreakpointType.Logpoint);this._typeSelector.select(this._isLogpoint?logpointOption:conditionalOption);toolbar.appendToolbarItem(this._typeSelector);self.runtime.extension(TextEditor.TextEditorFactory).instance().then(factory=>{const editorOptions={lineNumbers:false,lineWrapping:true,mimeType:'javascript',autoHeight:true};this._editor=factory.createEditor(editorOptions);this._updatePlaceholder();this._editor.widget().element.classList.add('condition-editor');this._editor.configureAutocomplete(JavaScriptAutocomplete.JavaScriptAutocompleteConfig.createConfigForEditor(this._editor));if(oldCondition){this._editor.setText(oldCondition);}
this._editor.widget().markAsExternallyManaged();this._editor.widget().show(this.contentElement);this._editor.setSelection(this._editor.fullRange());this._editor.widget().focus();this._editor.widget().element.addEventListener('keydown',this._onKeyDown.bind(this),true);this.contentElement.addEventListener('blur',event=>{if(event.relatedTarget&&!event.relatedTarget.isSelfOrDescendant(this.element)){this._finishEditing(true);}},true);});}
static _conditionForLogpoint(condition){return`${LogpointPrefix}${condition}${LogpointSuffix}`;}
_onTypeChanged(){const value=this._typeSelector.selectedOption().value;this._isLogpoint=value===BreakpointType.Logpoint;this._updatePlaceholder();if(value===BreakpointType.Breakpoint){this._editor.setText('');this._finishEditing(true);}}
_updatePlaceholder(){const selectedValue=this._typeSelector.selectedOption().value;if(selectedValue===BreakpointType.Conditional){this._editor.setPlaceholder(ls`Expression to check before pausing, e.g. x > 5`);this._typeSelector.element.title=ls`Pause only when the condition is true`;}else if(selectedValue===BreakpointType.Logpoint){this._editor.setPlaceholder(ls`Log message, e.g. 'x is', x`);this._typeSelector.element.title=ls`Log a message to Console, do not break`;}}
_finishEditing(committed){if(this._finished){return;}
this._finished=true;this._editor.widget().detach();let condition=this._editor.text();if(this._isLogpoint){condition=BreakpointEditDialog._conditionForLogpoint(condition);}
this._onFinish({committed,condition});}
async _onKeyDown(event){if(isEnterKey(event)&&!event.shiftKey){event.consume(true);const expression=this._editor.text();if(event.ctrlKey||await JavaScriptAutocomplete.JavaScriptAutocomplete.isExpressionComplete(expression)){this._finishEditing(true);}else{this._editor.newlineAndIndent();}}
if(isEscKey(event)){this._finishEditing(false);}}}
const LogpointPrefix='/** DEVTOOLS_LOGPOINT */ console.log(';const LogpointSuffix=')';const BreakpointType={Breakpoint:'Breakpoint',Conditional:'Conditional',Logpoint:'Logpoint',};var BreakpointEditDialog$1=Object.freeze({__proto__:null,BreakpointEditDialog:BreakpointEditDialog,LogpointPrefix:LogpointPrefix,LogpointSuffix:LogpointSuffix,BreakpointType:BreakpointType});class CallStackSidebarPane extends View.SimpleView{constructor(){super(UIString.UIString('Call Stack'),true);this.registerRequiredCSS('sources/callStackSidebarPane.css');this._blackboxedMessageElement=this._createBlackboxedMessageElement();this.contentElement.appendChild(this._blackboxedMessageElement);this._notPausedMessageElement=this.contentElement.createChild('div','gray-info-message');this._notPausedMessageElement.textContent=UIString.UIString('Not paused');this._notPausedMessageElement.tabIndex=-1;this._items=new ListModel.ListModel();this._list=new ListControl.ListControl(this._items,this,ListControl.ListMode.NonViewport);this.contentElement.appendChild(this._list.element);this._list.element.addEventListener('contextmenu',this._onContextMenu.bind(this),false);self.onInvokeElement(this._list.element,event=>{const item=this._list.itemForNode((event.target));if(item){this._activateItem(item);event.consume(true);}});this._showMoreMessageElement=this._createShowMoreMessageElement();this._showMoreMessageElement.classList.add('hidden');this.contentElement.appendChild(this._showMoreMessageElement);this._showBlackboxed=false;this._locationPool=new LiveLocation.LiveLocationPool();this._updateThrottler=new Throttler.Throttler(100);this._maxAsyncStackChainDepth=defaultMaxAsyncStackChainDepth;this._update();this._updateItemThrottler=new Throttler.Throttler(100);this._scheduledForUpdateItems=new Set();}
flavorChanged(object){this._showBlackboxed=false;this._maxAsyncStackChainDepth=defaultMaxAsyncStackChainDepth;this._update();}
_update(){this._updateThrottler.schedule(()=>this._doUpdate());}
async _doUpdate(){this._locationPool.disposeAll();const details=self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails);if(!details){this.setDefaultFocusedElement(this._notPausedMessageElement);this._notPausedMessageElement.classList.remove('hidden');this._blackboxedMessageElement.classList.add('hidden');this._showMoreMessageElement.classList.add('hidden');this._items.replaceAll([]);self.UI.context.setFlavor(DebuggerModel.CallFrame,null);return;}
let debuggerModel=details.debuggerModel;this._notPausedMessageElement.classList.add('hidden');const itemPromises=[];for(const frame of details.callFrames){const itemPromise=Item.createForDebuggerCallFrame(frame,this._locationPool,this._refreshItem.bind(this)).then(item=>{item[debuggerCallFrameSymbol]=frame;return item;});itemPromises.push(itemPromise);}
const items=await Promise.all(itemPromises);let asyncStackTrace=details.asyncStackTrace;if(!asyncStackTrace&&details.asyncStackTraceId){if(details.asyncStackTraceId.debuggerId){debuggerModel=DebuggerModel.DebuggerModel.modelForDebuggerId(details.asyncStackTraceId.debuggerId);}
asyncStackTrace=debuggerModel?await debuggerModel.fetchAsyncStackTrace(details.asyncStackTraceId):null;}
let peviousStackTrace=details.callFrames;let maxAsyncStackChainDepth=this._maxAsyncStackChainDepth;while(asyncStackTrace&&maxAsyncStackChainDepth>0){let title='';const isAwait=asyncStackTrace.description==='async function';if(isAwait&&peviousStackTrace.length&&asyncStackTrace.callFrames.length){const lastPreviousFrame=peviousStackTrace[peviousStackTrace.length-1];const lastPreviousFrameName=UIUtils.beautifyFunctionName(lastPreviousFrame.functionName);title=UIUtils.asyncStackTraceLabel('await in '+lastPreviousFrameName);}else{title=UIUtils.asyncStackTraceLabel(asyncStackTrace.description);}
items.push(...await Item.createItemsForAsyncStack(title,debuggerModel,asyncStackTrace.callFrames,this._locationPool,this._refreshItem.bind(this)));--maxAsyncStackChainDepth;peviousStackTrace=asyncStackTrace.callFrames;if(asyncStackTrace.parent){asyncStackTrace=asyncStackTrace.parent;}else if(asyncStackTrace.parentId){if(asyncStackTrace.parentId.debuggerId){debuggerModel=DebuggerModel.DebuggerModel.modelForDebuggerId(asyncStackTrace.parentId.debuggerId);}
asyncStackTrace=debuggerModel?await debuggerModel.fetchAsyncStackTrace(asyncStackTrace.parentId):null;}else{asyncStackTrace=null;}}
this._showMoreMessageElement.classList.toggle('hidden',!asyncStackTrace);this._items.replaceAll(items);if(this._maxAsyncStackChainDepth===defaultMaxAsyncStackChainDepth){this._list.selectNextItem(true,false);const selectedItem=this._list.selectedItem();if(selectedItem){this._activateItem(selectedItem);}}
this._updatedForTest();}
_updatedForTest(){}
_refreshItem(item){this._scheduledForUpdateItems.add(item);this._updateItemThrottler.schedule(innerUpdate.bind(this));function innerUpdate(){const items=Array.from(this._scheduledForUpdateItems);this._scheduledForUpdateItems.clear();this._muteActivateItem=true;if(!this._showBlackboxed&&this._items.every(item=>item.isBlackboxed)){this._showBlackboxed=true;for(let i=0;i<this._items.length;++i){this._list.refreshItemByIndex(i);}
this._blackboxedMessageElement.classList.toggle('hidden',true);}else{const itemsSet=new Set(items);let hasBlackboxed=false;for(let i=0;i<this._items.length;++i){const item=this._items.at(i);if(itemsSet.has(item)){this._list.refreshItemByIndex(i);}
hasBlackboxed=hasBlackboxed||item.isBlackboxed;}
this._blackboxedMessageElement.classList.toggle('hidden',this._showBlackboxed||!hasBlackboxed);}
delete this._muteActivateItem;return Promise.resolve();}}
createElementForItem(item){const element=createElementWithClass('div','call-frame-item');const title=element.createChild('div','call-frame-item-title');title.createChild('div','call-frame-title-text').textContent=item.title;if(item.isAsyncHeader){element.classList.add('async-header');}else{const linkElement=element.createChild('div','call-frame-location');linkElement.textContent=item.linkText.trimMiddle(30);linkElement.title=item.linkText;element.classList.toggle('blackboxed-call-frame',item.isBlackboxed);if(item.isBlackboxed){ARIAUtils.setDescription(element,ls`blackboxed`);}
if(!item[debuggerCallFrameSymbol]){ARIAUtils.setDisabled(element,true);}}
const isSelected=item[debuggerCallFrameSymbol]===self.UI.context.flavor(DebuggerModel.CallFrame);element.classList.toggle('selected',isSelected);ARIAUtils.setSelected(element,isSelected);element.classList.toggle('hidden',!this._showBlackboxed&&item.isBlackboxed);element.appendChild(Icon.Icon.create('smallicon-thick-right-arrow','selected-call-frame-icon'));element.tabIndex=item===this._list.selectedItem()?0:-1;return element;}
heightForItem(item){console.assert(false);return 0;}
isItemSelectable(item){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.tabIndex=-1;}
if(toElement){this.setDefaultFocusedElement(toElement);toElement.tabIndex=0;if(this.hasFocus()){toElement.focus();}}}
updateSelectedItemARIA(fromElement,toElement){return true;}
_createBlackboxedMessageElement(){const element=createElementWithClass('div','blackboxed-message');element.createChild('span');const showAllLink=element.createChild('span','link');showAllLink.textContent=UIString.UIString('Show blackboxed frames');ARIAUtils.markAsLink(showAllLink);showAllLink.tabIndex=0;const showAll=()=>{this._showBlackboxed=true;for(const item of this._items){this._refreshItem(item);}
this._blackboxedMessageElement.classList.toggle('hidden',true);};showAllLink.addEventListener('click',showAll);showAllLink.addEventListener('keydown',event=>isEnterKey(event)&&showAll());return element;}
_createShowMoreMessageElement(){const element=createElementWithClass('div','show-more-message');element.createChild('span');const showAllLink=element.createChild('span','link');showAllLink.textContent=UIString.UIString('Show more');showAllLink.addEventListener('click',()=>{this._maxAsyncStackChainDepth+=defaultMaxAsyncStackChainDepth;this._update();},false);return element;}
_onContextMenu(event){const item=this._list.itemForNode((event.target));if(!item){return;}
const contextMenu=new ContextMenu.ContextMenu(event);const debuggerCallFrame=item[debuggerCallFrameSymbol];if(debuggerCallFrame){contextMenu.defaultSection().appendItem(UIString.UIString('Restart frame'),()=>debuggerCallFrame.restart());}
contextMenu.defaultSection().appendItem(UIString.UIString('Copy stack trace'),this._copyStackTrace.bind(this));if(item.uiLocation){this.appendBlackboxURLContextMenuItems(contextMenu,item.uiLocation.uiSourceCode);}
contextMenu.show();}
_onClick(event){const item=this._list.itemForNode((event.target));if(item){this._activateItem(item);}}
_activateItem(item){const uiLocation=item.uiLocation;if(this._muteActivateItem||!uiLocation){return;}
this._list.selectItem(item);const debuggerCallFrame=item[debuggerCallFrameSymbol];const oldItem=this.activeCallFrameItem();if(debuggerCallFrame&&oldItem!==item){debuggerCallFrame.debuggerModel.setSelectedCallFrame(debuggerCallFrame);self.UI.context.setFlavor(DebuggerModel.CallFrame,debuggerCallFrame);if(oldItem){this._refreshItem(oldItem);}
this._refreshItem(item);}else{Revealer.reveal(uiLocation);}}
activeCallFrameItem(){const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(callFrame){return this._items.find(callFrameItem=>callFrameItem[debuggerCallFrameSymbol]===callFrame)||null;}
return null;}
appendBlackboxURLContextMenuItems(contextMenu,uiSourceCode){const binding=self.Persistence.persistence.binding(uiSourceCode);if(binding){uiSourceCode=binding.network;}
if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem){return;}
const canBlackbox=BlackboxManager.BlackboxManager.instance().canBlackboxUISourceCode(uiSourceCode);const isBlackboxed=BlackboxManager.BlackboxManager.instance().isBlackboxedUISourceCode(uiSourceCode);const isContentScript=uiSourceCode.project().type()===Workspace.projectTypes.ContentScripts;const manager=BlackboxManager.BlackboxManager.instance();if(canBlackbox){if(isBlackboxed){contextMenu.defaultSection().appendItem(UIString.UIString('Stop blackboxing'),manager.unblackboxUISourceCode.bind(manager,uiSourceCode));}else{contextMenu.defaultSection().appendItem(UIString.UIString('Blackbox script'),manager.blackboxUISourceCode.bind(manager,uiSourceCode));}}
if(isContentScript){if(isBlackboxed){contextMenu.defaultSection().appendItem(UIString.UIString('Stop blackboxing all content scripts'),manager.blackboxContentScripts.bind(manager));}else{contextMenu.defaultSection().appendItem(UIString.UIString('Blackbox all content scripts'),manager.unblackboxContentScripts.bind(manager));}}}
_selectNextCallFrameOnStack(){const oldItem=this.activeCallFrameItem();const startIndex=oldItem?this._items.indexOf(oldItem)+1:0;for(let i=startIndex;i<this._items.length;i++){const newItem=this._items.at(i);if(newItem[debuggerCallFrameSymbol]){this._activateItem(newItem);break;}}}
_selectPreviousCallFrameOnStack(){const oldItem=this.activeCallFrameItem();const startIndex=oldItem?this._items.indexOf(oldItem)-1:this._items.length-1;for(let i=startIndex;i>=0;i--){const newItem=this._items.at(i);if(newItem[debuggerCallFrameSymbol]){this._activateItem(newItem);break;}}}
_copyStackTrace(){const text=[];for(const item of this._items){let itemText=item.title;if(item.uiLocation){itemText+=' ('+item.uiLocation.linkText(true)+')';}
text.push(itemText);}
InspectorFrontendHost.InspectorFrontendHostInstance.copyText(text.join('\n'));}}
const debuggerCallFrameSymbol=Symbol('debuggerCallFrame');const elementSymbol=Symbol('element');const defaultMaxAsyncStackChainDepth=32;class ActionDelegate{handleAction(context,actionId){const callStackSidebarPane=self.runtime.sharedInstance(CallStackSidebarPane);switch(actionId){case'debugger.next-call-frame':callStackSidebarPane._selectNextCallFrameOnStack();return true;case'debugger.previous-call-frame':callStackSidebarPane._selectPreviousCallFrameOnStack();return true;}
return false;}}
class Item{static async createForDebuggerCallFrame(frame,locationPool,updateDelegate){const item=new Item(UIUtils.beautifyFunctionName(frame.functionName),updateDelegate);await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createCallFrameLiveLocation(frame.location(),item._update.bind(item),locationPool);return item;}
static async createItemsForAsyncStack(title,debuggerModel,frames,locationPool,updateDelegate){const whiteboxedItemsSymbol=Symbol('whiteboxedItems');const asyncHeaderItem=new Item(title,updateDelegate);asyncHeaderItem[whiteboxedItemsSymbol]=new Set();asyncHeaderItem.isAsyncHeader=true;const asyncFrameItems=[];const liveLocationPromises=[];for(const frame of frames){const item=new Item(UIUtils.beautifyFunctionName(frame.functionName),update);const rawLocation=debuggerModel?debuggerModel.createRawLocationByScriptId(frame.scriptId,frame.lineNumber,frame.columnNumber):null;if(!rawLocation){item.linkText=(frame.url||'<unknown>')+':'+(frame.lineNumber+1);item.updateDelegate(item);}else{liveLocationPromises.push(DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createCallFrameLiveLocation(rawLocation,item._update.bind(item),locationPool));}
asyncFrameItems.push(item);}
await Promise.all(liveLocationPromises);updateDelegate(asyncHeaderItem);return[asyncHeaderItem,...asyncFrameItems];function update(item){updateDelegate(item);let shouldUpdate=false;const items=asyncHeaderItem[whiteboxedItemsSymbol];if(item.isBlackboxed){items.delete(item);shouldUpdate=items.size===0;}else{shouldUpdate=items.size===0;items.add(item);}
asyncHeaderItem.isBlackboxed=asyncHeaderItem[whiteboxedItemsSymbol].size===0;if(shouldUpdate){updateDelegate(asyncHeaderItem);}}}
constructor(title,updateDelegate){this.isBlackboxed=false;this.title=title;this.linkText='';this.uiLocation=null;this.isAsyncHeader=false;this.updateDelegate=updateDelegate;}
async _update(liveLocation){const uiLocation=await liveLocation.uiLocation();this.isBlackboxed=await liveLocation.isBlackboxed();this.linkText=uiLocation?uiLocation.linkText():'';this.uiLocation=uiLocation;this.updateDelegate(this);}}
var CallStackSidebarPane$1=Object.freeze({__proto__:null,CallStackSidebarPane:CallStackSidebarPane,debuggerCallFrameSymbol:debuggerCallFrameSymbol,elementSymbol:elementSymbol,defaultMaxAsyncStackChainDepth:defaultMaxAsyncStackChainDepth,ActionDelegate:ActionDelegate,Item:Item});class Plugin{static accepts(uiSourceCode){return false;}
wasShown(){}
willHide(){}
async rightToolbarItems(){return[];}
leftToolbarItems(){return[];}
populateLineGutterContextMenu(contextMenu,lineNumber){return Promise.resolve();}
populateTextAreaContextMenu(contextMenu,lineNumber,columnNumber){return Promise.resolve();}
dispose(){}}
var Plugin$1=Object.freeze({__proto__:null,Plugin:Plugin});class CoveragePlugin extends Plugin{constructor(textEditor,uiSourceCode){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;this._originalSourceCode=sourceFormatter.getOriginalUISourceCode(this._uiSourceCode);this._text=new Toolbar.ToolbarButton(ls`Click to show Coverage Panel`);this._text.setSecondary();this._text.addEventListener(Toolbar.ToolbarButton.Events.Click,()=>{ViewManager.ViewManager.instance().showView('coverage');});const mainTarget=SDKModel.TargetManager.instance().mainTarget();if(mainTarget){this._model=mainTarget.model(CoverageModel.CoverageModel);this._model.addEventListener(CoverageModel.Events.CoverageReset,this._handleReset,this);this._coverage=this._model.getCoverageForUrl(this._originalSourceCode.url());if(this._coverage){this._coverage.addEventListener(CoverageModel.URLCoverageInfo.Events.SizesChanged,this._handleCoverageSizesChanged,this);}}
this._updateStats();}
dispose(){if(this._coverage){this._coverage.removeEventListener(CoverageModel.URLCoverageInfo.Events.SizesChanged,this._handleCoverageSizesChanged,this);}
if(this._model){this._model.removeEventListener(CoverageModel.Events.CoverageReset,this._handleReset,this);}}
static accepts(uiSourceCode){return uiSourceCode.contentType().isDocumentOrScriptOrStyleSheet();}
_handleReset(){this._coverage=null;this._updateStats();}
_handleCoverageSizesChanged(){this._updateStats();}
_updateStats(){if(this._coverage){this._text.setTitle(ls`Show Details`);this._text.setText(ls`Coverage: ${this._coverage.usedPercentage().toFixed(1)} %`);}else{this._text.setTitle(ls`Click to show Coverage Panel`);this._text.setText(ls`Coverage: n/a`);}}
async rightToolbarItems(){return[this._text];}}
var CoveragePlugin$1=Object.freeze({__proto__:null,CoveragePlugin:CoveragePlugin});class CSSPlugin extends Plugin{constructor(textEditor){super();this._textEditor=textEditor;this._swatchPopoverHelper=new SwatchPopoverHelper.SwatchPopoverHelper();this._muteSwatchProcessing=false;this._hadSwatchChange=false;this._bezierEditor=null;this._editedSwatchTextRange=null;this._spectrum=null;this._currentSwatch=null;this._textEditor.configureAutocomplete({suggestionsCallback:this._cssSuggestions.bind(this),isWordChar:this._isWordChar.bind(this)});this._textEditor.addEventListener(SourcesTextEditor.Events.ScrollChanged,this._textEditorScrolled,this);this._textEditor.addEventListener(TextEditor.Events.TextChanged,this._onTextChanged,this);this._updateSwatches(0,this._textEditor.linesCount-1);this._shortcuts={};this._registerShortcuts();this._boundHandleKeyDown=this._handleKeyDown.bind(this);this._textEditor.element.addEventListener('keydown',this._boundHandleKeyDown,false);}
static accepts(uiSourceCode){return uiSourceCode.contentType().isStyleSheet();}
_registerShortcuts(){const shortcutKeys=ShortcutsScreen.SourcesPanelShortcuts;for(const descriptor of shortcutKeys.IncreaseCSSUnitByOne){this._shortcuts[descriptor.key]=this._handleUnitModification.bind(this,1);}
for(const descriptor of shortcutKeys.DecreaseCSSUnitByOne){this._shortcuts[descriptor.key]=this._handleUnitModification.bind(this,-1);}
for(const descriptor of shortcutKeys.IncreaseCSSUnitByTen){this._shortcuts[descriptor.key]=this._handleUnitModification.bind(this,10);}
for(const descriptor of shortcutKeys.DecreaseCSSUnitByTen){this._shortcuts[descriptor.key]=this._handleUnitModification.bind(this,-10);}}
_handleKeyDown(event){const shortcutKey=KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent((event));const handler=this._shortcuts[shortcutKey];if(handler&&handler()){event.consume(true);}}
_textEditorScrolled(){if(this._swatchPopoverHelper.isShowing()){this._swatchPopoverHelper.hide(true);}}
_modifyUnit(unit,change){const unitValue=parseInt(unit,10);if(isNaN(unitValue)){return null;}
const tail=unit.substring((unitValue).toString().length);return StringUtilities.sprintf('%d%s',unitValue+change,tail);}
_handleUnitModification(change){const selection=this._textEditor.selection().normalize();let token=this._textEditor.tokenAtTextPosition(selection.startLine,selection.startColumn);if(!token){if(selection.startColumn>0){token=this._textEditor.tokenAtTextPosition(selection.startLine,selection.startColumn-1);}
if(!token){return false;}}
if(token.type!=='css-number'){return false;}
const cssUnitRange=new TextRange.TextRange(selection.startLine,token.startColumn,selection.startLine,token.endColumn);const cssUnitText=this._textEditor.text(cssUnitRange);const newUnitText=this._modifyUnit(cssUnitText,change);if(!newUnitText){return false;}
this._textEditor.editRange(cssUnitRange,newUnitText);selection.startColumn=token.startColumn;selection.endColumn=selection.startColumn+newUnitText.length;this._textEditor.setSelection(selection);return true;}
_updateSwatches(startLine,endLine){const swatches=[];const swatchPositions=[];const regexes=[CSSMetadata.VariableRegex,CSSMetadata.URLRegex,Geometry.CubicBezier.Regex,Color.Regex];const handlers=new Map();handlers.set(Color.Regex,this._createColorSwatch.bind(this));handlers.set(Geometry.CubicBezier.Regex,this._createBezierSwatch.bind(this));for(let lineNumber=startLine;lineNumber<=endLine;lineNumber++){const line=this._textEditor.line(lineNumber).substring(0,maxSwatchProcessingLength);const results=TextUtils.Utils.splitStringByRegexes(line,regexes);for(let i=0;i<results.length;i++){const result=results[i];if(result.regexIndex===-1||!handlers.has(regexes[result.regexIndex])){continue;}
const delimiters=/[\s:;,(){}]/;const positionBefore=result.position-1;const positionAfter=result.position+result.value.length;if(positionBefore>=0&&!delimiters.test(line.charAt(positionBefore))||positionAfter<line.length&&!delimiters.test(line.charAt(positionAfter))){continue;}
const swatch=handlers.get(regexes[result.regexIndex])(result.value);if(!swatch){continue;}
swatches.push(swatch);swatchPositions.push(TextRange.TextRange.createFromLocation(lineNumber,result.position));}}
this._textEditor.operation(putSwatchesInline.bind(this));function putSwatchesInline(){const clearRange=new TextRange.TextRange(startLine,0,endLine,this._textEditor.line(endLine).length);this._textEditor.bookmarks(clearRange,SwatchBookmark).forEach(marker=>marker.clear());for(let i=0;i<swatches.length;i++){const swatch=swatches[i];const swatchPosition=swatchPositions[i];const bookmark=this._textEditor.addBookmark(swatchPosition.startLine,swatchPosition.startColumn,swatch,SwatchBookmark);swatch[SwatchBookmark]=bookmark;}}}
_createColorSwatch(text){const color=Color.Color.parse(text);if(!color){return null;}
const swatch=ColorSwatch.ColorSwatch.create();swatch.setColor(color);swatch.iconElement().title=UIString.UIString('Open color picker.');swatch.iconElement().addEventListener('click',this._swatchIconClicked.bind(this,swatch),false);swatch.hideText(true);return swatch;}
_createBezierSwatch(text){if(!Geometry.CubicBezier.parse(text)){return null;}
const swatch=ColorSwatch.BezierSwatch.create();swatch.setBezierText(text);swatch.iconElement().title=UIString.UIString('Open cubic bezier editor.');swatch.iconElement().addEventListener('click',this._swatchIconClicked.bind(this,swatch),false);swatch.hideText(true);return swatch;}
_swatchIconClicked(swatch,event){event.consume(true);this._hadSwatchChange=false;this._muteSwatchProcessing=true;const swatchPosition=swatch[SwatchBookmark].position();this._textEditor.setSelection(swatchPosition);this._editedSwatchTextRange=swatchPosition.clone();this._editedSwatchTextRange.endColumn+=swatch.textContent.length;this._currentSwatch=swatch;if(swatch instanceof ColorSwatch.ColorSwatch){this._showSpectrum(swatch);}else if(swatch instanceof ColorSwatch.BezierSwatch){this._showBezierEditor(swatch);}}
_showSpectrum(swatch){if(!this._spectrum){this._spectrum=new Spectrum.Spectrum();this._spectrum.addEventListener(Spectrum.Events.SizeChanged,this._spectrumResized,this);this._spectrum.addEventListener(Spectrum.Events.ColorChanged,this._spectrumChanged,this);}
this._spectrum.setColor(swatch.color(),swatch.format());this._swatchPopoverHelper.show(this._spectrum,swatch.iconElement(),this._swatchPopoverHidden.bind(this));}
_spectrumResized(event){this._swatchPopoverHelper.reposition();}
_spectrumChanged(event){const colorString=(event.data);const color=Color.Color.parse(colorString);if(!color){return;}
this._currentSwatch.setColor(color);this._changeSwatchText(colorString);}
_showBezierEditor(swatch){if(!this._bezierEditor){this._bezierEditor=new BezierEditor.BezierEditor();this._bezierEditor.addEventListener(BezierEditor.Events.BezierChanged,this._bezierChanged,this);}
let cubicBezier=Geometry.CubicBezier.parse(swatch.bezierText());if(!cubicBezier){cubicBezier=(Geometry.CubicBezier.parse('linear'));}
this._bezierEditor.setBezier(cubicBezier);this._swatchPopoverHelper.show(this._bezierEditor,swatch.iconElement(),this._swatchPopoverHidden.bind(this));}
_bezierChanged(event){const bezierString=(event.data);this._currentSwatch.setBezierText(bezierString);this._changeSwatchText(bezierString);}
_changeSwatchText(text){this._hadSwatchChange=true;this._textEditor.editRange((this._editedSwatchTextRange),text,'*swatch-text-changed');this._editedSwatchTextRange.endColumn=this._editedSwatchTextRange.startColumn+text.length;}
_swatchPopoverHidden(commitEdit){this._muteSwatchProcessing=false;if(!commitEdit&&this._hadSwatchChange){this._textEditor.undo();}}
_onTextChanged(event){if(!this._muteSwatchProcessing){this._updateSwatches(event.data.newRange.startLine,event.data.newRange.endLine);}}
_isWordChar(char){return TextUtils.Utils.isWordChar(char)||char==='.'||char==='-'||char==='$';}
_cssSuggestions(prefixRange,substituteRange){const prefix=this._textEditor.text(prefixRange);if(prefix.startsWith('$')){return null;}
const propertyToken=this._backtrackPropertyToken(prefixRange.startLine,prefixRange.startColumn-1);if(!propertyToken){return null;}
const line=this._textEditor.line(prefixRange.startLine);const tokenContent=line.substring(propertyToken.startColumn,propertyToken.endColumn);const propertyValues=CSSMetadata.cssMetadata().propertyValues(tokenContent);return Promise.resolve(propertyValues.filter(value=>value.startsWith(prefix)).map(value=>({text:value})));}
_backtrackPropertyToken(lineNumber,columnNumber){const backtrackDepth=10;let tokenPosition=columnNumber;const line=this._textEditor.line(lineNumber);let seenColon=false;for(let i=0;i<backtrackDepth&&tokenPosition>=0;++i){const token=this._textEditor.tokenAtTextPosition(lineNumber,tokenPosition);if(!token){return null;}
if(token.type==='css-property'){return seenColon?token:null;}
if(token.type&&!(token.type.indexOf('whitespace')!==-1||token.type.startsWith('css-comment'))){return null;}
if(!token.type&&line.substring(token.startColumn,token.endColumn)===':'){if(!seenColon){seenColon=true;}else{return null;}}
tokenPosition=token.startColumn-1;}
return null;}
dispose(){if(this._swatchPopoverHelper.isShowing()){this._swatchPopoverHelper.hide(true);}
this._textEditor.removeEventListener(SourcesTextEditor.Events.ScrollChanged,this._textEditorScrolled,this);this._textEditor.removeEventListener(TextEditor.Events.TextChanged,this._onTextChanged,this);this._textEditor.bookmarks(this._textEditor.fullRange(),SwatchBookmark).forEach(marker=>marker.clear());this._textEditor.element.removeEventListener('keydown',this._boundHandleKeyDown,false);}}
const maxSwatchProcessingLength=300;const SwatchBookmark=Symbol('swatch');var CSSPlugin$1=Object.freeze({__proto__:null,CSSPlugin:CSSPlugin,maxSwatchProcessingLength:maxSwatchProcessingLength,SwatchBookmark:SwatchBookmark});class DebuggerPausedMessage{constructor(){this._element=createElementWithClass('div','paused-message flex-none');const root=Utils.createShadowRootWithCoreStyles(this._element,'sources/debuggerPausedMessage.css');this._contentElement=root.createChild('div');ARIAUtils.markAsPoliteLiveRegion(this._element,false);}
element(){return this._element;}
static _descriptionWithoutStack(description){const firstCallFrame=/^\s+at\s/m.exec(description);return firstCallFrame?description.substring(0,firstCallFrame.index-1):description.substring(0,description.lastIndexOf('\n'));}
static async _createDOMBreakpointHitMessage(details){const messageWrapper=createElement('span');const domDebuggerModel=details.debuggerModel.target().model(DOMDebuggerModel.DOMDebuggerModel);if(!details.auxData||!domDebuggerModel){return messageWrapper;}
const data=domDebuggerModel.resolveDOMBreakpointData((details.auxData));if(!data){return messageWrapper;}
const mainElement=messageWrapper.createChild('div','status-main');mainElement.appendChild(Icon.Icon.create('smallicon-info','status-icon'));const breakpointType=BreakpointTypeNouns.get(data.type);mainElement.appendChild(createTextNode(ls`Paused on ${breakpointType}`));const subElement=messageWrapper.createChild('div','status-sub monospace');const linkifiedNode=await Linkifier.Linkifier.linkify(data.node);subElement.appendChild(linkifiedNode);if(data.targetNode){const targetNodeLink=await Linkifier.Linkifier.linkify(data.targetNode);let messageElement;if(data.insertion){if(data.targetNode===data.node){messageElement=UIUtils.formatLocalized('Child %s added',[targetNodeLink]);}else{messageElement=UIUtils.formatLocalized('Descendant %s added',[targetNodeLink]);}}else{messageElement=UIUtils.formatLocalized('Descendant %s removed',[targetNodeLink]);}
subElement.appendChild(createElement('br'));subElement.appendChild(messageElement);}
return messageWrapper;}
async render(details,debuggerWorkspaceBinding,breakpointManager){this._contentElement.removeChildren();this._contentElement.hidden=!details;if(!details){return;}
const status=this._contentElement.createChild('div','paused-status');const errorLike=details.reason===DebuggerModel.BreakReason.Exception||details.reason===DebuggerModel.BreakReason.PromiseRejection||details.reason===DebuggerModel.BreakReason.Assert||details.reason===DebuggerModel.BreakReason.OOM;let messageWrapper;if(details.reason===DebuggerModel.BreakReason.DOM){messageWrapper=await DebuggerPausedMessage._createDOMBreakpointHitMessage(details);}else if(details.reason===DebuggerModel.BreakReason.EventListener){let eventNameForUI='';if(details.auxData){eventNameForUI=self.SDK.domDebuggerManager.resolveEventListenerBreakpointTitle((details.auxData));}
messageWrapper=buildWrapper(UIString.UIString('Paused on event listener'),eventNameForUI);}else if(details.reason===DebuggerModel.BreakReason.XHR){messageWrapper=buildWrapper(UIString.UIString('Paused on XHR or fetch'),details.auxData['url']||'');}else if(details.reason===DebuggerModel.BreakReason.Exception){const description=details.auxData['description']||details.auxData['value']||'';const descriptionWithoutStack=DebuggerPausedMessage._descriptionWithoutStack(description);messageWrapper=buildWrapper(UIString.UIString('Paused on exception'),descriptionWithoutStack,description);}else if(details.reason===DebuggerModel.BreakReason.PromiseRejection){const description=details.auxData['description']||details.auxData['value']||'';const descriptionWithoutStack=DebuggerPausedMessage._descriptionWithoutStack(description);messageWrapper=buildWrapper(UIString.UIString('Paused on promise rejection'),descriptionWithoutStack,description);}else if(details.reason===DebuggerModel.BreakReason.Assert){messageWrapper=buildWrapper(UIString.UIString('Paused on assertion'));}else if(details.reason===DebuggerModel.BreakReason.DebugCommand){messageWrapper=buildWrapper(UIString.UIString('Paused on debugged function'));}else if(details.reason===DebuggerModel.BreakReason.OOM){messageWrapper=buildWrapper(UIString.UIString('Paused before potential out-of-memory crash'));}else if(details.callFrames.length){const uiLocation=await debuggerWorkspaceBinding.rawLocationToUILocation(details.callFrames[0].location());const breakpoint=uiLocation?breakpointManager.findBreakpoint(uiLocation):null;const defaultText=breakpoint?UIString.UIString('Paused on breakpoint'):UIString.UIString('Debugger paused');messageWrapper=buildWrapper(defaultText);}else{console.warn('ScriptsPanel paused, but callFrames.length is zero.');}
status.classList.toggle('error-reason',errorLike);if(messageWrapper){status.appendChild(messageWrapper);}
function buildWrapper(mainText,subText,title){const messageWrapper=createElement('span');const mainElement=messageWrapper.createChild('div','status-main');const icon=Icon.Icon.create(errorLike?'smallicon-error':'smallicon-info','status-icon');mainElement.appendChild(icon);mainElement.appendChild(createTextNode(mainText));if(subText){const subElement=messageWrapper.createChild('div','status-sub monospace');subElement.textContent=subText;subElement.title=title||subText;}
return messageWrapper;}}}
const BreakpointTypeNouns=new Map([[Protocol.DOMDebugger.DOMBreakpointType.SubtreeModified,UIString.UIString('subtree modifications')],[Protocol.DOMDebugger.DOMBreakpointType.AttributeModified,UIString.UIString('attribute modifications')],[Protocol.DOMDebugger.DOMBreakpointType.NodeRemoved,UIString.UIString('node removal')],]);var DebuggerPausedMessage$1=Object.freeze({__proto__:null,DebuggerPausedMessage:DebuggerPausedMessage,BreakpointTypeNouns:BreakpointTypeNouns});const cachedMapSymbol=Symbol('cache');const cachedIdentifiersSymbol=Symbol('cachedIdentifiers');class Identifier{constructor(name,lineNumber,columnNumber){this.name=name;this.lineNumber=lineNumber;this.columnNumber=columnNumber;}}
const scopeIdentifiers=function(scope){const startLocation=scope.startLocation();const endLocation=scope.endLocation();if(scope.type()===Protocol.Debugger.ScopeType.Global||!startLocation||!endLocation||!startLocation.script()||!startLocation.script().sourceMapURL||(startLocation.script()!==endLocation.script())){return Promise.resolve(([]));}
const script=startLocation.script();return script.requestContent().then(onContent);function onContent(deferredContent){if(!deferredContent.content){return Promise.resolve(([]));}
const content=deferredContent.content;const text=new Text.Text(content);const scopeRange=new TextRange.TextRange(startLocation.lineNumber,startLocation.columnNumber,endLocation.lineNumber,endLocation.columnNumber);const scopeText=text.extract(scopeRange);const scopeStart=text.toSourceRange(scopeRange).offset;const prefix='function fui';return FormatterWorkerPool.formatterWorkerPool().javaScriptIdentifiers(prefix+scopeText).then(onIdentifiers.bind(null,text,scopeStart,prefix));}
function onIdentifiers(text,scopeStart,prefix,identifiers){const result=[];const cursor=new TextCursor.TextCursor(text.lineEndings());for(let i=0;i<identifiers.length;++i){const id=identifiers[i];if(id.offset<prefix.length){continue;}
const start=scopeStart+id.offset-prefix.length;cursor.resetTo(start);result.push(new Identifier(id.name,cursor.lineNumber(),cursor.columnNumber()));}
return result;}};const resolveScope=function(scope){let identifiersPromise=scope[cachedIdentifiersSymbol];if(identifiersPromise){return identifiersPromise;}
const script=scope.callFrame().script;const sourceMap=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().sourceMapForScript(script);if(!sourceMap){return Promise.resolve(new Map());}
const textCache=new Map();identifiersPromise=scopeIdentifiers(scope).then(onIdentifiers);scope[cachedIdentifiersSymbol]=identifiersPromise;return identifiersPromise;function onIdentifiers(identifiers){const namesMapping=new Map();for(let i=0;i<identifiers.length;++i){const id=identifiers[i];const entry=sourceMap.findEntry(id.lineNumber,id.columnNumber);if(entry&&entry.name){namesMapping.set(id.name,entry.name);}}
const promises=[];for(let i=0;i<identifiers.length;++i){const id=identifiers[i];if(namesMapping.has(id.name)){continue;}
const promise=resolveSourceName(id).then(onSourceNameResolved.bind(null,namesMapping,id));promises.push(promise);}
return Promise.all(promises).then(()=>Sources.SourceMapNamesResolver._scopeResolvedForTest()).then(()=>namesMapping);}
function onSourceNameResolved(namesMapping,id,sourceName){if(!sourceName){return;}
namesMapping.set(id.name,sourceName);}
function resolveSourceName(id){const startEntry=sourceMap.findEntry(id.lineNumber,id.columnNumber);const endEntry=sourceMap.findEntry(id.lineNumber,id.columnNumber+id.name.length);if(!startEntry||!endEntry||!startEntry.sourceURL||startEntry.sourceURL!==endEntry.sourceURL||!startEntry.sourceLineNumber||!startEntry.sourceColumnNumber||!endEntry.sourceLineNumber||!endEntry.sourceColumnNumber){return Promise.resolve((null));}
const sourceTextRange=new TextRange.TextRange(startEntry.sourceLineNumber,startEntry.sourceColumnNumber,endEntry.sourceLineNumber,endEntry.sourceColumnNumber);const uiSourceCode=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiSourceCodeForSourceMapSourceURL(script.debuggerModel,startEntry.sourceURL,script.isContentScript());if(!uiSourceCode){return Promise.resolve((null));}
return uiSourceCode.requestContent().then(deferredContent=>{const content=deferredContent.content;return onSourceContent(sourceTextRange,content);});}
function onSourceContent(sourceTextRange,content){if(!content){return null;}
let text=textCache.get(content);if(!text){text=new Text.Text(content);textCache.set(content,text);}
const originalIdentifier=text.extract(sourceTextRange).trim();return/[a-zA-Z0-9_$]+/.test(originalIdentifier)?originalIdentifier:null;}};const allVariablesInCallFrame=function(callFrame){const cached=callFrame[cachedMapSymbol];if(cached){return Promise.resolve(cached);}
const promises=[];const scopeChain=callFrame.scopeChain();for(let i=0;i<scopeChain.length;++i){promises.push(resolveScope(scopeChain[i]));}
return Promise.all(promises).then(mergeVariables);function mergeVariables(nameMappings){const reverseMapping=new Map();for(const map of nameMappings){for(const compiledName of map.keys()){const originalName=map.get(compiledName);if(!reverseMapping.has(originalName)){reverseMapping.set(originalName,compiledName);}}}
callFrame[cachedMapSymbol]=reverseMapping;return reverseMapping;}};const resolveExpression=function(callFrame,originalText,uiSourceCode,lineNumber,startColumnNumber,endColumnNumber){if(!uiSourceCode.contentType().isFromSourceMap()){return Promise.resolve('');}
return allVariablesInCallFrame(callFrame).then(reverseMapping=>findCompiledName(callFrame.debuggerModel,reverseMapping));function findCompiledName(debuggerModel,reverseMapping){if(reverseMapping.has(originalText)){return Promise.resolve(reverseMapping.get(originalText)||'');}
return resolveExpressionAsync(debuggerModel,uiSourceCode,lineNumber,startColumnNumber,endColumnNumber);}};const resolveExpressionAsync=async function(debuggerModel,uiSourceCode,lineNumber,startColumnNumber,endColumnNumber){const rawLocations=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,lineNumber,startColumnNumber);const rawLocation=rawLocations.find(location=>location.debuggerModel===debuggerModel);if(!rawLocation){return'';}
const script=rawLocation.script();if(!script){return'';}
const sourceMap=(DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().sourceMapForScript(script));if(!sourceMap){return'';}
return script.requestContent().then(onContent);function onContent(deferredContent){const content=deferredContent.content;if(!content){return Promise.resolve('');}
const text=new Text.Text(content);const textRange=sourceMap.reverseMapTextRange(uiSourceCode.url(),new TextRange.TextRange(lineNumber,startColumnNumber,lineNumber,endColumnNumber));const originalText=text.extract(textRange);if(!originalText){return Promise.resolve('');}
return FormatterWorkerPool.formatterWorkerPool().evaluatableJavaScriptSubstring(originalText);}};const resolveThisObject=function(callFrame){if(!callFrame){return Promise.resolve((null));}
if(!callFrame.scopeChain().length){return Promise.resolve(callFrame.thisObject());}
return resolveScope(callFrame.scopeChain()[0]).then(onScopeResolved);function onScopeResolved(namesMapping){const thisMappings=namesMapping.inverse().get('this');if(!thisMappings||thisMappings.size!==1){return Promise.resolve(callFrame.thisObject());}
const thisMapping=thisMappings.values().next().value;return callFrame.evaluate({expression:thisMapping,objectGroup:'backtrace',includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:true}).then(onEvaluated);}
function onEvaluated(result){return!result.exceptionDetails&&result.object?result.object:callFrame.thisObject();}};const resolveScopeInObject=function(scope){const startLocation=scope.startLocation();const endLocation=scope.endLocation();if(scope.type()===Protocol.Debugger.ScopeType.Global||!startLocation||!endLocation||!startLocation.script()||!startLocation.script().sourceMapURL||startLocation.script()!==endLocation.script()){return scope.object();}
return new RemoteObject(scope);};class RemoteObject extends RemoteObject$1.RemoteObject{constructor(scope){super();this._scope=scope;this._object=scope.object();}
customPreview(){return this._object.customPreview();}
get objectId(){return this._object.objectId;}
get type(){return this._object.type;}
get subtype(){return this._object.subtype;}
get value(){return this._object.value;}
get description(){return this._object.description;}
get hasChildren(){return this._object.hasChildren;}
get preview(){return this._object.preview;}
arrayLength(){return this._object.arrayLength();}
getOwnProperties(generatePreview){return this._object.getOwnProperties(generatePreview);}
async getAllProperties(accessorPropertiesOnly,generatePreview){const allProperties=await this._object.getAllProperties(accessorPropertiesOnly,generatePreview);const namesMapping=await resolveScope(this._scope);const properties=allProperties.properties;const internalProperties=allProperties.internalProperties;const newProperties=[];if(properties){for(let i=0;i<properties.length;++i){const property=properties[i];const name=namesMapping.get(property.name)||properties[i].name;newProperties.push(new RemoteObject$1.RemoteObjectProperty(name,property.value,property.enumerable,property.writable,property.isOwn,property.wasThrown,property.symbol,property.synthetic));}}
return{properties:newProperties,internalProperties:internalProperties};}
async setPropertyValue(argumentName,value){const namesMapping=await resolveScope(this._scope);let name;if(typeof argumentName==='string'){name=argumentName;}else{name=(argumentName.value);}
let actualName=name;for(const compiledName of namesMapping.keys()){if(namesMapping.get(compiledName)===name){actualName=compiledName;break;}}
return this._object.setPropertyValue(actualName,value);}
async deleteProperty(name){return this._object.deleteProperty(name);}
callFunction(functionDeclaration,args){return this._object.callFunction(functionDeclaration,args);}
callFunctionJSON(functionDeclaration,args){return this._object.callFunctionJSON(functionDeclaration,args);}
release(){this._object.release();}
debuggerModel(){return this._object.debuggerModel();}
runtimeModel(){return this._object.runtimeModel();}
isNode(){return this._object.isNode();}}
var SourceMapNamesResolver=Object.freeze({__proto__:null,cachedMapSymbol:cachedMapSymbol,cachedIdentifiersSymbol:cachedIdentifiersSymbol,Identifier:Identifier,scopeIdentifiers:scopeIdentifiers,resolveScope:resolveScope,allVariablesInCallFrame:allVariablesInCallFrame,resolveExpression:resolveExpression,resolveExpressionAsync:resolveExpressionAsync,resolveThisObject:resolveThisObject,resolveScopeInObject:resolveScopeInObject,RemoteObject:RemoteObject});class SourcesSearchScope{constructor(){this._searchId=0;this._searchResultCandidates=[];this._searchResultCallback=null;this._searchFinishedCallback=null;this._searchConfig=null;}
static _filesComparator(uiSourceCode1,uiSourceCode2){if(uiSourceCode1.isDirty()&&!uiSourceCode2.isDirty()){return-1;}
if(!uiSourceCode1.isDirty()&&uiSourceCode2.isDirty()){return 1;}
const isFileSystem1=uiSourceCode1.project().type()===Workspace.projectTypes.FileSystem&&!self.Persistence.persistence.binding(uiSourceCode1);const isFileSystem2=uiSourceCode2.project().type()===Workspace.projectTypes.FileSystem&&!self.Persistence.persistence.binding(uiSourceCode2);if(isFileSystem1!==isFileSystem2){return isFileSystem1?1:-1;}
const url1=uiSourceCode1.url();const url2=uiSourceCode2.url();if(url1&&!url2){return-1;}
if(!url1&&url2){return 1;}
return String.naturalOrderComparator(uiSourceCode1.fullDisplayName(),uiSourceCode2.fullDisplayName());}
performIndexing(progress){this.stopSearch();const projects=this._projects();const compositeProgress=new Progress.CompositeProgress(progress);for(let i=0;i<projects.length;++i){const project=projects[i];const projectProgress=compositeProgress.createSubProgress(project.uiSourceCodes().length);project.indexContent(projectProgress);}}
_projects(){const searchInAnonymousAndContentScripts=Settings.Settings.instance().moduleSetting('searchInAnonymousAndContentScripts').get();return Workspace.WorkspaceImpl.instance().projects().filter(project=>{if(project.type()===Workspace.projectTypes.Service){return false;}
if(!searchInAnonymousAndContentScripts&&project.isServiceProject()){return false;}
if(!searchInAnonymousAndContentScripts&&project.type()===Workspace.projectTypes.ContentScripts){return false;}
return true;});}
performSearch(searchConfig,progress,searchResultCallback,searchFinishedCallback){this.stopSearch();this._searchResultCandidates=[];this._searchResultCallback=searchResultCallback;this._searchFinishedCallback=searchFinishedCallback;this._searchConfig=searchConfig;const promises=[];const compositeProgress=new Progress.CompositeProgress(progress);const searchContentProgress=compositeProgress.createSubProgress();const findMatchingFilesProgress=new Progress.CompositeProgress(compositeProgress.createSubProgress());for(const project of this._projects()){const weight=project.uiSourceCodes().length;const findMatchingFilesInProjectProgress=findMatchingFilesProgress.createSubProgress(weight);const filesMathingFileQuery=this._projectFilesMatchingFileQuery(project,searchConfig);const promise=project.findFilesMatchingSearchRequest(searchConfig,filesMathingFileQuery,findMatchingFilesInProjectProgress).then(this._processMatchingFilesForProject.bind(this,this._searchId,project,searchConfig,filesMathingFileQuery));promises.push(promise);}
Promise.all(promises).then(this._processMatchingFiles.bind(this,this._searchId,searchContentProgress,this._searchFinishedCallback.bind(this,true)));}
_projectFilesMatchingFileQuery(project,searchConfig,dirtyOnly){const result=[];const uiSourceCodes=project.uiSourceCodes();for(let i=0;i<uiSourceCodes.length;++i){const uiSourceCode=uiSourceCodes[i];if(!uiSourceCode.contentType().isTextType()){continue;}
const binding=self.Persistence.persistence.binding(uiSourceCode);if(binding&&binding.network===uiSourceCode){continue;}
if(dirtyOnly&&!uiSourceCode.isDirty()){continue;}
if(searchConfig.filePathMatchesFileQuery(uiSourceCode.fullDisplayName())){result.push(uiSourceCode.url());}}
result.sort(String.naturalOrderComparator);return result;}
_processMatchingFilesForProject(searchId,project,searchConfig,filesMathingFileQuery,files){if(searchId!==this._searchId){this._searchFinishedCallback(false);return;}
files.sort(String.naturalOrderComparator);files=files.intersectOrdered(filesMathingFileQuery,String.naturalOrderComparator);const dirtyFiles=this._projectFilesMatchingFileQuery(project,searchConfig,true);files=files.mergeOrdered(dirtyFiles,String.naturalOrderComparator);const uiSourceCodes=[];for(const file of files){const uiSourceCode=project.uiSourceCodeForURL(file);if(!uiSourceCode){continue;}
const script=DefaultScriptMapping.DefaultScriptMapping.scriptForUISourceCode(uiSourceCode);if(script&&!script.isAnonymousScript()){continue;}
uiSourceCodes.push(uiSourceCode);}
uiSourceCodes.sort(SourcesSearchScope._filesComparator);this._searchResultCandidates=this._searchResultCandidates.mergeOrdered(uiSourceCodes,SourcesSearchScope._filesComparator);}
_processMatchingFiles(searchId,progress,callback){if(searchId!==this._searchId){this._searchFinishedCallback(false);return;}
const files=this._searchResultCandidates;if(!files.length){progress.done();callback();return;}
progress.setTotalWork(files.length);let fileIndex=0;const maxFileContentRequests=20;let callbacksLeft=0;for(let i=0;i<maxFileContentRequests&&i<files.length;++i){scheduleSearchInNextFileOrFinish.call(this);}
function searchInNextFile(uiSourceCode){if(uiSourceCode.isDirty()){contentLoaded.call(this,uiSourceCode,uiSourceCode.workingCopy());}else{uiSourceCode.requestContent().then(deferredContent=>{contentLoaded.call(this,uiSourceCode,deferredContent.content||'');});}}
function scheduleSearchInNextFileOrFinish(){if(fileIndex>=files.length){if(!callbacksLeft){progress.done();callback();return;}
return;}
++callbacksLeft;const uiSourceCode=files[fileIndex++];setTimeout(searchInNextFile.bind(this,uiSourceCode),0);}
function contentLoaded(uiSourceCode,content){function matchesComparator(a,b){return a.lineNumber-b.lineNumber;}
progress.worked(1);let matches=[];const queries=this._searchConfig.queries();if(content!==null){for(let i=0;i<queries.length;++i){const nextMatches=TextUtils.performSearchInContent(content,queries[i],!this._searchConfig.ignoreCase(),this._searchConfig.isRegex());matches=matches.mergeOrdered(nextMatches,matchesComparator);}}
if(matches){const searchResult=new FileBasedSearchResult(uiSourceCode,matches);this._searchResultCallback(searchResult);}
--callbacksLeft;scheduleSearchInNextFileOrFinish.call(this);}}
stopSearch(){++this._searchId;}}
class FileBasedSearchResult{constructor(uiSourceCode,searchMatches){this._uiSourceCode=uiSourceCode;this._searchMatches=searchMatches;}
label(){return this._uiSourceCode.displayName();}
description(){return this._uiSourceCode.fullDisplayName();}
matchesCount(){return this._searchMatches.length;}
matchLineContent(index){return this._searchMatches[index].lineContent;}
matchRevealable(index){const match=this._searchMatches[index];return this._uiSourceCode.uiLocation(match.lineNumber,undefined);}
matchLabel(index){return this._searchMatches[index].lineNumber+1;}}
var SourcesSearchScope$1=Object.freeze({__proto__:null,SourcesSearchScope:SourcesSearchScope,FileBasedSearchResult:FileBasedSearchResult});class SearchSourcesView extends SearchView.SearchView{constructor(){super('sources');}
static async openSearch(query,searchImmediately){const view=ViewManager.ViewManager.instance().view('sources.search-sources-tab');const location=await ViewManager.ViewManager.instance().resolveLocation('drawer-view');location.appendView(view);await ViewManager.ViewManager.instance().revealView((view));const widget=(await view.widget());widget.toggle(query,!!searchImmediately);return widget;}
createScope(){return new SourcesSearchScope();}}
class ActionDelegate$1{handleAction(context,actionId){this._showSearch();return true;}
_showSearch(){const selection=self.UI.inspectorView.element.window().getSelection();let queryCandidate='';if(selection.rangeCount){queryCandidate=selection.toString().replace(/\r?\n.*/,'');}
return SearchSourcesView.openSearch(queryCandidate);}}
var SearchSourcesView$1=Object.freeze({__proto__:null,SearchSourcesView:SearchSourcesView,ActionDelegate:ActionDelegate$1});class NavigatorView extends Widget.VBox{constructor(){super(true);this.registerRequiredCSS('sources/navigatorView.css');this._placeholder=null;this._scriptsTree=new TreeOutline.TreeOutlineInShadow();this._scriptsTree.registerRequiredCSS('sources/navigatorTree.css');this._scriptsTree.setComparator(NavigatorView._treeElementsCompare);this.contentElement.appendChild(this._scriptsTree.element);this.setDefaultFocusedElement(this._scriptsTree.element);this._uiSourceCodeNodes=new Multimap();this._subfolderNodes=new Map();this._rootNode=new NavigatorRootTreeNode(this);this._rootNode.populate();this._frameNodes=new Map();this.contentElement.addEventListener('contextmenu',this.handleContextMenu.bind(this),false);self.UI.shortcutRegistry.addShortcutListener(this.contentElement,'sources.rename',this._renameShortcut.bind(this),true);this._navigatorGroupByFolderSetting=Settings.Settings.instance().moduleSetting('navigatorGroupByFolder');this._navigatorGroupByFolderSetting.addChangeListener(this._groupingChanged.bind(this));this._initGrouping();self.Persistence.persistence.addEventListener(Persistence.Events.BindingCreated,this._onBindingChanged,this);self.Persistence.persistence.addEventListener(Persistence.Events.BindingRemoved,this._onBindingChanged,this);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.NameChanged,this._targetNameChanged,this);SDKModel.TargetManager.instance().observeTargets(this);this._resetWorkspace(Workspace.WorkspaceImpl.instance());this._workspace.uiSourceCodes().forEach(this._addUISourceCode.bind(this));NetworkProject.NetworkProjectManager.instance().addEventListener(NetworkProject.Events.FrameAttributionAdded,this._frameAttributionAdded,this);NetworkProject.NetworkProjectManager.instance().addEventListener(NetworkProject.Events.FrameAttributionRemoved,this._frameAttributionRemoved,this);}
static _treeElementOrder(treeElement){if(treeElement._boostOrder){return 0;}
if(!NavigatorView._typeOrders){const weights={};const types=Types;weights[types.Root]=1;weights[types.Domain]=10;weights[types.FileSystemFolder]=1;weights[types.NetworkFolder]=1;weights[types.SourceMapFolder]=2;weights[types.File]=10;weights[types.Frame]=70;weights[types.Worker]=90;weights[types.FileSystem]=100;NavigatorView._typeOrders=weights;}
let order=NavigatorView._typeOrders[treeElement._nodeType];if(treeElement._uiSourceCode){const contentType=treeElement._uiSourceCode.contentType();if(contentType.isDocument()){order+=3;}else if(contentType.isScript()){order+=5;}else if(contentType.isStyleSheet()){order+=10;}else{order+=15;}}
return order;}
static appendSearchItem(contextMenu,path){function searchPath(){SearchSourcesView.openSearch(`file:${path.trim()}`);}
let searchLabel=UIString.UIString('Search in folder');if(!path||!path.trim()){path='*';searchLabel=UIString.UIString('Search in all files');}
contextMenu.viewSection().appendItem(searchLabel,searchPath);}
static _treeElementsCompare(treeElement1,treeElement2){const typeWeight1=NavigatorView._treeElementOrder(treeElement1);const typeWeight2=NavigatorView._treeElementOrder(treeElement2);if(typeWeight1>typeWeight2){return 1;}
if(typeWeight1<typeWeight2){return-1;}
return treeElement1.titleAsText().compareTo(treeElement2.titleAsText());}
setPlaceholder(placeholder){console.assert(!this._placeholder,'A placeholder widget was already set');this._placeholder=placeholder;placeholder.show(this.contentElement,this.contentElement.firstChild);updateVisibility.call(this);this._scriptsTree.addEventListener(TreeOutline.Events.ElementAttached,updateVisibility.bind(this));this._scriptsTree.addEventListener(TreeOutline.Events.ElementsDetached,updateVisibility.bind(this));function updateVisibility(){const showTree=this._scriptsTree.firstChild();if(showTree){placeholder.hideWidget();}else{placeholder.showWidget();}
this._scriptsTree.element.classList.toggle('hidden',!showTree);}}
_onBindingChanged(event){const binding=(event.data);const networkNodes=this._uiSourceCodeNodes.get(binding.network);for(const networkNode of networkNodes){networkNode.updateTitle();}
const fileSystemNodes=this._uiSourceCodeNodes.get(binding.fileSystem);for(const fileSystemNode of fileSystemNodes){fileSystemNode.updateTitle();}
const pathTokens=FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.relativePath(binding.fileSystem);let folderPath='';for(let i=0;i<pathTokens.length-1;++i){folderPath+=pathTokens[i];const folderId=this._folderNodeId(binding.fileSystem.project(),null,null,binding.fileSystem.origin(),folderPath);const folderNode=this._subfolderNodes.get(folderId);if(folderNode){folderNode.updateTitle();}
folderPath+='/';}
const fileSystemRoot=this._rootNode.child(binding.fileSystem.project().id());if(fileSystemRoot){fileSystemRoot.updateTitle();}}
focus(){this._scriptsTree.focus();}
_resetWorkspace(workspace){this._workspace=workspace;this._workspace.addEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);this._workspace.addEventListener(Workspace.Events.UISourceCodeRemoved,this._uiSourceCodeRemoved,this);this._workspace.addEventListener(Workspace.Events.ProjectAdded,event=>{const project=(event.data);this._projectAdded(project);if(project.type()===Workspace.projectTypes.FileSystem){this._computeUniqueFileSystemProjectNames();}});this._workspace.addEventListener(Workspace.Events.ProjectRemoved,event=>{const project=(event.data);this._removeProject(project);if(project.type()===Workspace.projectTypes.FileSystem){this._computeUniqueFileSystemProjectNames();}});this._workspace.projects().forEach(this._projectAdded.bind(this));this._computeUniqueFileSystemProjectNames();}
workspace(){return this._workspace;}
acceptProject(project){return!project.isServiceProject();}
_frameAttributionAdded(event){const uiSourceCode=(event.data.uiSourceCode);if(!this._acceptsUISourceCode(uiSourceCode)){return;}
const addedFrame=(event.data.frame);this._addUISourceCodeNode(uiSourceCode,addedFrame);}
_frameAttributionRemoved(event){const uiSourceCode=(event.data.uiSourceCode);if(!this._acceptsUISourceCode(uiSourceCode)){return;}
const removedFrame=(event.data.frame);const node=Array.from(this._uiSourceCodeNodes.get(uiSourceCode)).find(node=>node.frame()===removedFrame);this._removeUISourceCodeNode(node);}
_acceptsUISourceCode(uiSourceCode){return this.acceptProject(uiSourceCode.project());}
_addUISourceCode(uiSourceCode){if(!this._acceptsUISourceCode(uiSourceCode)){return;}
const frames=NetworkProject.NetworkProject.framesForUISourceCode(uiSourceCode);if(frames.length){for(const frame of frames){this._addUISourceCodeNode(uiSourceCode,frame);}}else{this._addUISourceCodeNode(uiSourceCode,null);}
this.uiSourceCodeAdded(uiSourceCode);}
_addUISourceCodeNode(uiSourceCode,frame){const isFromSourceMap=uiSourceCode.contentType().isFromSourceMap();let path;if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem){path=FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.relativePath(uiSourceCode).slice(0,-1);}else{path=ParsedURL.ParsedURL.extractPath(uiSourceCode.url()).split('/').slice(1,-1);}
const project=uiSourceCode.project();const target=NetworkProject.NetworkProject.targetForUISourceCode(uiSourceCode);const folderNode=this._folderNode(uiSourceCode,project,target,frame,uiSourceCode.origin(),path,isFromSourceMap);const uiSourceCodeNode=new NavigatorUISourceCodeTreeNode(this,uiSourceCode,frame);folderNode.appendChild(uiSourceCodeNode);this._uiSourceCodeNodes.set(uiSourceCode,uiSourceCodeNode);this._selectDefaultTreeNode();}
uiSourceCodeAdded(uiSourceCode){}
_uiSourceCodeAdded(event){const uiSourceCode=(event.data);this._addUISourceCode(uiSourceCode);}
_uiSourceCodeRemoved(event){const uiSourceCode=(event.data);this._removeUISourceCode(uiSourceCode);}
tryAddProject(project){this._projectAdded(project);project.uiSourceCodes().forEach(this._addUISourceCode.bind(this));}
_projectAdded(project){if(!this.acceptProject(project)||project.type()!==Workspace.projectTypes.FileSystem||ScriptSnippetFileSystem.isSnippetsProject(project)||this._rootNode.child(project.id())){return;}
this._rootNode.appendChild(new NavigatorGroupTreeNode(this,project,project.id(),Types.FileSystem,project.displayName()));this._selectDefaultTreeNode();}
_selectDefaultTreeNode(){const children=this._rootNode.children();if(children.length&&!this._scriptsTree.selectedTreeElement){children[0].treeNode().select(true,false);}}
_computeUniqueFileSystemProjectNames(){const fileSystemProjects=this._workspace.projectsForType(Workspace.projectTypes.FileSystem);if(!fileSystemProjects.length){return;}
const encoder=new Persistence.PathEncoder();const reversedPaths=fileSystemProjects.map(project=>{const fileSystem=(project);return StringUtilities.reverse(encoder.encode(fileSystem.fileSystemPath()));});const reversedIndex=new Trie.Trie();for(const reversedPath of reversedPaths){reversedIndex.add(reversedPath);}
for(let i=0;i<fileSystemProjects.length;++i){const reversedPath=reversedPaths[i];const project=fileSystemProjects[i];reversedIndex.remove(reversedPath);const commonPrefix=reversedIndex.longestPrefix(reversedPath,false);reversedIndex.add(reversedPath);const prefixPath=reversedPath.substring(0,commonPrefix.length+1);const path=encoder.decode(StringUtilities.reverse(prefixPath));const fileSystemNode=this._rootNode.child(project.id());if(fileSystemNode){fileSystemNode.setTitle(path);}}}
_removeProject(project){const uiSourceCodes=project.uiSourceCodes();for(let i=0;i<uiSourceCodes.length;++i){this._removeUISourceCode(uiSourceCodes[i]);}
if(project.type()!==Workspace.projectTypes.FileSystem){return;}
const fileSystemNode=this._rootNode.child(project.id());if(!fileSystemNode){return;}
this._rootNode.removeChild(fileSystemNode);}
_folderNodeId(project,target,frame,projectOrigin,path){const targetId=target?target.id():'';const projectId=project.type()===Workspace.projectTypes.FileSystem?project.id():'';const frameId=this._groupByFrame&&frame?frame.id:'';return targetId+':'+projectId+':'+frameId+':'+projectOrigin+':'+path;}
_folderNode(uiSourceCode,project,target,frame,projectOrigin,path,fromSourceMap){if(ScriptSnippetFileSystem.isSnippetsUISourceCode(uiSourceCode)){return this._rootNode;}
if(target&&!this._groupByFolder&&!fromSourceMap){return this._domainNode(uiSourceCode,project,target,frame,projectOrigin);}
const folderPath=path.join('/');const folderId=this._folderNodeId(project,target,frame,projectOrigin,folderPath);let folderNode=this._subfolderNodes.get(folderId);if(folderNode){return folderNode;}
if(!path.length){if(target){return this._domainNode(uiSourceCode,project,target,frame,projectOrigin);}
return(this._rootNode.child(project.id()));}
const parentNode=this._folderNode(uiSourceCode,project,target,frame,projectOrigin,path.slice(0,-1),fromSourceMap);let type=fromSourceMap?Types.SourceMapFolder:Types.NetworkFolder;if(project.type()===Workspace.projectTypes.FileSystem){type=Types.FileSystemFolder;}
const name=path[path.length-1];folderNode=new NavigatorFolderTreeNode(this,project,folderId,type,folderPath,name);this._subfolderNodes.set(folderId,folderNode);parentNode.appendChild(folderNode);return folderNode;}
_domainNode(uiSourceCode,project,target,frame,projectOrigin){const frameNode=this._frameNode(project,target,frame);if(!this._groupByDomain){return frameNode;}
let domainNode=frameNode.child(projectOrigin);if(domainNode){return domainNode;}
domainNode=new NavigatorGroupTreeNode(this,project,projectOrigin,Types.Domain,this._computeProjectDisplayName(target,projectOrigin));if(frame&&projectOrigin===ParsedURL.ParsedURL.extractOrigin(frame.url)){domainNode.treeNode()._boostOrder=true;}
frameNode.appendChild(domainNode);return domainNode;}
_frameNode(project,target,frame){if(!this._groupByFrame||!frame){return this._targetNode(project,target);}
let frameNode=this._frameNodes.get(frame);if(frameNode){return frameNode;}
frameNode=new NavigatorGroupTreeNode(this,project,target.id()+':'+frame.id,Types.Frame,frame.displayName());frameNode.setHoverCallback(hoverCallback);this._frameNodes.set(frame,frameNode);const parentFrame=frame.parentFrame||frame.crossTargetParentFrame();this._frameNode(project,parentFrame?parentFrame.resourceTreeModel().target():target,parentFrame).appendChild(frameNode);if(!parentFrame){frameNode.treeNode()._boostOrder=true;frameNode.treeNode().expand();}
function hoverCallback(hovered){if(hovered){const overlayModel=target.model(OverlayModel.OverlayModel);if(overlayModel){overlayModel.highlightFrame(frame.id);}}else{OverlayModel.OverlayModel.hideDOMNodeHighlight();}}
return frameNode;}
_targetNode(project,target){if(target===SDKModel.TargetManager.instance().mainTarget()){return this._rootNode;}
let targetNode=this._rootNode.child('target:'+target.id());if(!targetNode){targetNode=new NavigatorGroupTreeNode(this,project,'target:'+target.id(),target.type()===SDKModel.Type.Frame?Types.Frame:Types.Worker,target.name());this._rootNode.appendChild(targetNode);}
return targetNode;}
_computeProjectDisplayName(target,projectOrigin){const runtimeModel=target.model(RuntimeModel.RuntimeModel);const executionContexts=runtimeModel?runtimeModel.executionContexts():[];for(const context of executionContexts){if(context.name&&context.origin&&projectOrigin.startsWith(context.origin)){return context.name;}}
if(!projectOrigin){return UIString.UIString('(no domain)');}
const parsedURL=new ParsedURL.ParsedURL(projectOrigin);const prettyURL=parsedURL.isValid?parsedURL.host+(parsedURL.port?(':'+parsedURL.port):''):'';return(prettyURL||projectOrigin);}
revealUISourceCode(uiSourceCode,select){const nodes=this._uiSourceCodeNodes.get(uiSourceCode);const node=nodes.firstValue();if(!node){return null;}
if(this._scriptsTree.selectedTreeElement){this._scriptsTree.selectedTreeElement.deselect();}
this._lastSelectedUISourceCode=uiSourceCode;node.reveal(select);return node;}
_sourceSelected(uiSourceCode,focusSource){this._lastSelectedUISourceCode=uiSourceCode;Revealer.reveal(uiSourceCode,!focusSource);}
_removeUISourceCode(uiSourceCode){const nodes=this._uiSourceCodeNodes.get(uiSourceCode);for(const node of nodes){this._removeUISourceCodeNode(node);}}
_removeUISourceCodeNode(node){const uiSourceCode=node.uiSourceCode();this._uiSourceCodeNodes.delete(uiSourceCode,node);const project=uiSourceCode.project();const target=NetworkProject.NetworkProject.targetForUISourceCode(uiSourceCode);const frame=node.frame();let parentNode=node.parent;parentNode.removeChild(node);node=parentNode;while(node){parentNode=node.parent;if(!parentNode||!node.isEmpty()){break;}
if(parentNode===this._rootNode&&project.type()===Workspace.projectTypes.FileSystem){break;}
if(!(node instanceof NavigatorGroupTreeNode||node instanceof NavigatorFolderTreeNode)){break;}
if(node._type===Types.Frame){this._discardFrame((frame));break;}
const folderId=this._folderNodeId(project,target,frame,uiSourceCode.origin(),node._folderPath);this._subfolderNodes.delete(folderId);parentNode.removeChild(node);node=parentNode;}}
reset(){for(const node of this._uiSourceCodeNodes.valuesArray()){node.dispose();}
this._scriptsTree.removeChildren();this._uiSourceCodeNodes.clear();this._subfolderNodes.clear();this._frameNodes.clear();this._rootNode.reset();}
handleContextMenu(event){}
_renameShortcut(){const node=this._scriptsTree.selectedTreeElement&&this._scriptsTree.selectedTreeElement._node;if(!node||!node._uiSourceCode||!node._uiSourceCode.canRename()){return false;}
this.rename(node,false);return true;}
_handleContextMenuCreate(project,path,uiSourceCode){if(uiSourceCode){const relativePath=FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.relativePath(uiSourceCode);relativePath.pop();path=relativePath.join('/');}
this.create(project,path,uiSourceCode);}
_handleContextMenuRename(node){this.rename(node,false);}
_handleContextMenuExclude(project,path){const shouldExclude=window.confirm(UIString.UIString('Are you sure you want to exclude this folder?'));if(shouldExclude){UIUtils.startBatchUpdate();project.excludeFolder(FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.completeURL(project,path));UIUtils.endBatchUpdate();}}
_handleContextMenuDelete(uiSourceCode){const shouldDelete=window.confirm(UIString.UIString('Are you sure you want to delete this file?'));if(shouldDelete){uiSourceCode.project().deleteFile(uiSourceCode);}}
handleFileContextMenu(event,node){const uiSourceCode=node.uiSourceCode();const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.appendApplicableItems(uiSourceCode);const project=uiSourceCode.project();if(project.type()===Workspace.projectTypes.FileSystem){contextMenu.editSection().appendItem(UIString.UIString('Rename…'),this._handleContextMenuRename.bind(this,node));contextMenu.editSection().appendItem(UIString.UIString('Make a copy…'),this._handleContextMenuCreate.bind(this,project,'',uiSourceCode));contextMenu.editSection().appendItem(UIString.UIString('Delete'),this._handleContextMenuDelete.bind(this,uiSourceCode));}
contextMenu.show();}
_handleDeleteOverrides(node){const shouldRemove=window.confirm(ls`Are you sure you want to delete all overrides contained in this folder?`);if(shouldRemove){this._handleDeleteOverridesHelper(node);}}
_handleDeleteOverridesHelper(node){node._children.forEach(child=>{this._handleDeleteOverridesHelper(child);});if(node instanceof NavigatorUISourceCodeTreeNode){node.uiSourceCode().project().deleteFile(node.uiSourceCode());}}
handleFolderContextMenu(event,node){const path=node._folderPath||'';const project=node._project;const contextMenu=new ContextMenu.ContextMenu(event);if(project.type()===Workspace.projectTypes.FileSystem){NavigatorView.appendSearchItem(contextMenu,path);const folderPath=ParsedURL.ParsedURL.urlToPlatformPath(FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.completeURL(project,path),Platform$1.isWin());contextMenu.revealSection().appendItem(UIString.UIString('Open folder'),()=>InspectorFrontendHost.InspectorFrontendHostInstance.showItemInFolder(folderPath));if(project.canCreateFile()){contextMenu.defaultSection().appendItem(UIString.UIString('New file'),this._handleContextMenuCreate.bind(this,project,path));}}
if(project.canExcludeFolder(path)){contextMenu.defaultSection().appendItem(UIString.UIString('Exclude folder'),this._handleContextMenuExclude.bind(this,project,path));}
function removeFolder(){const shouldRemove=window.confirm(UIString.UIString('Are you sure you want to remove this folder?'));if(shouldRemove){project.remove();}}
if(project.type()===Workspace.projectTypes.FileSystem){contextMenu.defaultSection().appendAction('sources.add-folder-to-workspace',undefined,true);if(node instanceof NavigatorGroupTreeNode){contextMenu.defaultSection().appendItem(UIString.UIString('Remove folder from workspace'),removeFolder);}
if(project._fileSystem._type==='overrides'){contextMenu.defaultSection().appendItem(ls`Delete all overrides`,this._handleDeleteOverrides.bind(this,node));}}
contextMenu.show();}
rename(node,creatingNewUISourceCode){const uiSourceCode=node.uiSourceCode();node.rename(callback.bind(this));function callback(committed){if(!creatingNewUISourceCode){return;}
if(!committed){uiSourceCode.remove();}else if(node._treeElement.listItemElement.hasFocus()){this._sourceSelected(uiSourceCode,true);}}}
async create(project,path,uiSourceCodeToCopy){let content='';if(uiSourceCodeToCopy){content=(await uiSourceCodeToCopy.requestContent()).content||'';}
const uiSourceCode=await project.createFile(path,null,content);if(!uiSourceCode){return;}
this._sourceSelected(uiSourceCode,false);const node=this.revealUISourceCode(uiSourceCode,true);if(node){this.rename(node,true);}}
_groupingChanged(){this.reset();this._initGrouping();this._workspace.uiSourceCodes().forEach(this._addUISourceCode.bind(this));}
_initGrouping(){this._groupByFrame=true;this._groupByDomain=this._navigatorGroupByFolderSetting.get();this._groupByFolder=this._groupByDomain;}
_resetForTest(){this.reset();this._workspace.uiSourceCodes().forEach(this._addUISourceCode.bind(this));}
_discardFrame(frame){const node=this._frameNodes.get(frame);if(!node){return;}
if(node.parent){node.parent.removeChild(node);}
this._frameNodes.delete(frame);for(const child of frame.childFrames){this._discardFrame(child);}}
targetAdded(target){}
targetRemoved(target){const targetNode=this._rootNode.child('target:'+target.id());if(targetNode){this._rootNode.removeChild(targetNode);}}
_targetNameChanged(event){const target=(event.data);const targetNode=this._rootNode.child('target:'+target.id());if(targetNode){targetNode.setTitle(target.name());}}}
const Types={Domain:'domain',File:'file',FileSystem:'fs',FileSystemFolder:'fs-folder',Frame:'frame',NetworkFolder:'nw-folder',Root:'root',SourceMapFolder:'sm-folder',Worker:'worker'};class NavigatorFolderTreeElement extends TreeOutline.TreeElement{constructor(navigatorView,type,title,hoverCallback){super('',true);this.listItemElement.classList.add('navigator-'+type+'-tree-item','navigator-folder-tree-item');ARIAUtils.setAccessibleName(this.listItemElement,`${title}, ${type}`);this._nodeType=type;this.title=title;this.tooltip=title;this._navigatorView=navigatorView;this._hoverCallback=hoverCallback;let iconType='largeicon-navigator-folder';if(type===Types.Domain){iconType='largeicon-navigator-domain';}else if(type===Types.Frame){iconType='largeicon-navigator-frame';}else if(type===Types.Worker){iconType='largeicon-navigator-worker';}
this.setLeadingIcons([Icon.Icon.create(iconType,'icon')]);}
async onpopulate(){this._node.populate();}
onattach(){this.collapse();this._node.onattach();this.listItemElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this),false);this.listItemElement.addEventListener('mousemove',this._mouseMove.bind(this),false);this.listItemElement.addEventListener('mouseleave',this._mouseLeave.bind(this),false);}
setNode(node){this._node=node;const paths=[];while(node&&!node.isRoot()){paths.push(node._title);node=node.parent;}
paths.reverse();this.tooltip=paths.join('/');ARIAUtils.setAccessibleName(this.listItemElement,`${this.title}, ${this._nodeType}`);}
_handleContextMenuEvent(event){if(!this._node){return;}
this.select();this._navigatorView.handleFolderContextMenu(event,this._node);}
_mouseMove(event){if(this._hovered||!this._hoverCallback){return;}
this._hovered=true;this._hoverCallback(true);}
_mouseLeave(event){if(!this._hoverCallback){return;}
this._hovered=false;this._hoverCallback(false);}}
class NavigatorSourceTreeElement extends TreeOutline.TreeElement{constructor(navigatorView,uiSourceCode,title,node){super('',false);this._nodeType=Types.File;this._node=node;this.title=title;this.listItemElement.classList.add('navigator-'+uiSourceCode.contentType().name()+'-tree-item','navigator-file-tree-item');this.tooltip=uiSourceCode.url();ARIAUtils.setAccessibleName(this.listItemElement,`${uiSourceCode.name()}, ${this._nodeType}`);EventTarget.fireEvent('source-tree-file-added',uiSourceCode.fullDisplayName());this._navigatorView=navigatorView;this._uiSourceCode=uiSourceCode;this.updateIcon();}
updateIcon(){const binding=self.Persistence.persistence.binding(this._uiSourceCode);if(binding){const container=createElementWithClass('span','icon-stack');let iconType='largeicon-navigator-file-sync';if(ScriptSnippetFileSystem.isSnippetsUISourceCode(binding.fileSystem)){iconType='largeicon-navigator-snippet';}
const icon=Icon.Icon.create(iconType,'icon');const badge=Icon.Icon.create('badge-navigator-file-sync','icon-badge');if(self.Persistence.networkPersistenceManager.project()===binding.fileSystem.project()){badge.style.filter='hue-rotate(160deg)';}
container.appendChild(icon);container.appendChild(badge);container.title=PersistenceUtils.PersistenceUtils.tooltipForUISourceCode(this._uiSourceCode);this.setLeadingIcons([container]);}else{let iconType='largeicon-navigator-file';if(ScriptSnippetFileSystem.isSnippetsUISourceCode(this._uiSourceCode)){iconType='largeicon-navigator-snippet';}
const defaultIcon=Icon.Icon.create(iconType,'icon');this.setLeadingIcons([defaultIcon]);}}
get uiSourceCode(){return this._uiSourceCode;}
onattach(){this.listItemElement.draggable=true;this.listItemElement.addEventListener('click',this._onclick.bind(this),false);this.listItemElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this),false);this.listItemElement.addEventListener('dragstart',this._ondragstart.bind(this),false);}
_shouldRenameOnMouseDown(){if(!this._uiSourceCode.canRename()){return false;}
const isSelected=this===this.treeOutline.selectedTreeElement;return isSelected&&this.treeOutline.element.hasFocus()&&!UIUtils.isBeingEdited(this.treeOutline.element);}
selectOnMouseDown(event){if(event.which!==1||!this._shouldRenameOnMouseDown()){super.selectOnMouseDown(event);return;}
setTimeout(rename.bind(this),300);function rename(){if(this._shouldRenameOnMouseDown()){this._navigatorView.rename(this._node,false);}}}
_ondragstart(event){event.dataTransfer.setData('text/plain',this._uiSourceCode.url());event.dataTransfer.effectAllowed='copy';}
onspace(){this._navigatorView._sourceSelected(this.uiSourceCode,true);return true;}
_onclick(event){this._navigatorView._sourceSelected(this.uiSourceCode,false);}
ondblclick(event){const middleClick=event.button===1;this._navigatorView._sourceSelected(this.uiSourceCode,!middleClick);return false;}
onenter(){this._navigatorView._sourceSelected(this.uiSourceCode,true);return true;}
ondelete(){return true;}
_handleContextMenuEvent(event){this.select();this._navigatorView.handleFileContextMenu(event,this._node);}}
class NavigatorTreeNode{constructor(id,type){this.id=id;this._type=type;this._children=new Map();}
treeNode(){throw'Not implemented';}
dispose(){}
isRoot(){return false;}
hasChildren(){return true;}
onattach(){}
setTitle(title){throw'Not implemented';}
populate(){if(this.isPopulated()){return;}
if(this.parent){this.parent.populate();}
this._populated=true;this.wasPopulated();}
wasPopulated(){const children=this.children();for(let i=0;i<children.length;++i){this.treeNode().appendChild((children[i].treeNode()));}}
didAddChild(node){if(this.isPopulated()){this.treeNode().appendChild((node.treeNode()));}}
willRemoveChild(node){if(this.isPopulated()){this.treeNode().removeChild((node.treeNode()));}}
isPopulated(){return this._populated;}
isEmpty(){return!this._children.size;}
children(){return[...this._children.values()];}
child(id){return this._children.get(id)||null;}
appendChild(node){this._children.set(node.id,node);node.parent=this;this.didAddChild(node);}
removeChild(node){this.willRemoveChild(node);this._children.delete(node.id);delete node.parent;node.dispose();}
reset(){this._children.clear();}}
class NavigatorRootTreeNode extends NavigatorTreeNode{constructor(navigatorView){super('',Types.Root);this._navigatorView=navigatorView;}
isRoot(){return true;}
treeNode(){return this._navigatorView._scriptsTree.rootElement();}}
class NavigatorUISourceCodeTreeNode extends NavigatorTreeNode{constructor(navigatorView,uiSourceCode,frame){super(uiSourceCode.project().id()+':'+uiSourceCode.url(),Types.File);this._navigatorView=navigatorView;this._uiSourceCode=uiSourceCode;this._treeElement=null;this._eventListeners=[];this._frame=frame;}
frame(){return this._frame;}
uiSourceCode(){return this._uiSourceCode;}
treeNode(){if(this._treeElement){return this._treeElement;}
this._treeElement=new NavigatorSourceTreeElement(this._navigatorView,this._uiSourceCode,'',this);this.updateTitle();const updateTitleBound=this.updateTitle.bind(this,undefined);this._eventListeners=[this._uiSourceCode.addEventListener(UISourceCode.Events.TitleChanged,updateTitleBound),this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,updateTitleBound),this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,updateTitleBound)];return this._treeElement;}
updateTitle(ignoreIsDirty){if(!this._treeElement){return;}
let titleText=this._uiSourceCode.displayName();if(!ignoreIsDirty&&this._uiSourceCode.isDirty()){titleText='*'+titleText;}
this._treeElement.title=titleText;this._treeElement.updateIcon();let tooltip=this._uiSourceCode.url();if(this._uiSourceCode.contentType().isFromSourceMap()){tooltip=UIString.UIString('%s (from source map)',this._uiSourceCode.displayName());}
this._treeElement.tooltip=tooltip;}
hasChildren(){return false;}
dispose(){EventTarget.EventTarget.removeEventListeners(this._eventListeners);}
reveal(select){this.parent.populate();this.parent.treeNode().expand();this._treeElement.reveal(true);if(select){this._treeElement.select(true);}}
rename(callback){if(!this._treeElement){return;}
this._treeElement.listItemElement.focus();const treeOutlineElement=this._treeElement.treeOutline.element;UIUtils.markBeingEdited(treeOutlineElement,true);function commitHandler(element,newTitle,oldTitle){if(newTitle!==oldTitle){this._treeElement.title=newTitle;this._uiSourceCode.rename(newTitle).then(renameCallback.bind(this));return;}
afterEditing.call(this,true);}
function renameCallback(success){if(!success){UIUtils.markBeingEdited(treeOutlineElement,false);this.updateTitle();this.rename(callback);return;}
afterEditing.call(this,true);}
function afterEditing(committed){UIUtils.markBeingEdited(treeOutlineElement,false);this.updateTitle();if(callback){callback(committed);}}
this.updateTitle(true);this._treeElement.startEditingTitle(new InplaceEditor.Config(commitHandler.bind(this),afterEditing.bind(this,false)));}}
class NavigatorFolderTreeNode extends NavigatorTreeNode{constructor(navigatorView,project,id,type,folderPath,title){super(id,type);this._navigatorView=navigatorView;this._project=project;this._folderPath=folderPath;this._title=title;}
treeNode(){if(this._treeElement){return this._treeElement;}
this._treeElement=this._createTreeElement(this._title,this);this.updateTitle();return this._treeElement;}
updateTitle(){if(!this._treeElement||this._project.type()!==Workspace.projectTypes.FileSystem){return;}
const absoluteFileSystemPath=FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemPath(this._project.id())+'/'+
this._folderPath;const hasMappedFiles=self.Persistence.persistence.filePathHasBindings(absoluteFileSystemPath);this._treeElement.listItemElement.classList.toggle('has-mapped-files',hasMappedFiles);}
_createTreeElement(title,node){if(this._project.type()!==Workspace.projectTypes.FileSystem){try{title=decodeURI(title);}catch(e){}}
const treeElement=new NavigatorFolderTreeElement(this._navigatorView,this._type,title);treeElement.setNode(node);return treeElement;}
wasPopulated(){if(!this._treeElement||this._treeElement._node!==this){return;}
this._addChildrenRecursive();}
_addChildrenRecursive(){const children=this.children();for(let i=0;i<children.length;++i){const child=children[i];this.didAddChild(child);if(child instanceof NavigatorFolderTreeNode){child._addChildrenRecursive();}}}
_shouldMerge(node){return this._type!==Types.Domain&&node instanceof NavigatorFolderTreeNode;}
didAddChild(node){function titleForNode(node){return node._title;}
if(!this._treeElement){return;}
let children=this.children();if(children.length===1&&this._shouldMerge(node)){node._isMerged=true;this._treeElement.title=this._treeElement.title+'/'+node._title;node._treeElement=this._treeElement;this._treeElement.setNode(node);return;}
let oldNode;if(children.length===2){oldNode=children[0]!==node?children[0]:children[1];}
if(oldNode&&oldNode._isMerged){delete oldNode._isMerged;const mergedToNodes=[];mergedToNodes.push(this);let treeNode=this;while(treeNode._isMerged){treeNode=treeNode.parent;mergedToNodes.push(treeNode);}
mergedToNodes.reverse();const titleText=mergedToNodes.map(titleForNode).join('/');const nodes=[];treeNode=oldNode;do{nodes.push(treeNode);children=treeNode.children();treeNode=children.length===1?children[0]:null;}while(treeNode&&treeNode._isMerged);if(!this.isPopulated()){this._treeElement.title=titleText;this._treeElement.setNode(this);for(let i=0;i<nodes.length;++i){delete nodes[i]._treeElement;delete nodes[i]._isMerged;}
return;}
const oldTreeElement=this._treeElement;const treeElement=this._createTreeElement(titleText,this);for(let i=0;i<mergedToNodes.length;++i){mergedToNodes[i]._treeElement=treeElement;}
oldTreeElement.parent.appendChild(treeElement);oldTreeElement.setNode(nodes[nodes.length-1]);oldTreeElement.title=nodes.map(titleForNode).join('/');oldTreeElement.parent.removeChild(oldTreeElement);this._treeElement.appendChild(oldTreeElement);if(oldTreeElement.expanded){treeElement.expand();}}
if(this.isPopulated()){this._treeElement.appendChild(node.treeNode());}}
willRemoveChild(node){if(node._isMerged||!this.isPopulated()){return;}
this._treeElement.removeChild(node._treeElement);}}
class NavigatorGroupTreeNode extends NavigatorTreeNode{constructor(navigatorView,project,id,type,title){super(id,type);this._project=project;this._navigatorView=navigatorView;this._title=title;this.populate();}
setHoverCallback(hoverCallback){this._hoverCallback=hoverCallback;}
treeNode(){if(this._treeElement){return this._treeElement;}
this._treeElement=new NavigatorFolderTreeElement(this._navigatorView,this._type,this._title,this._hoverCallback);this._treeElement.setNode(this);return this._treeElement;}
onattach(){this.updateTitle();}
updateTitle(){if(!this._treeElement||this._project.type()!==Workspace.projectTypes.FileSystem){return;}
const fileSystemPath=FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemPath(this._project.id());const wasActive=this._treeElement.listItemElement.classList.contains('has-mapped-files');const isActive=self.Persistence.persistence.filePathHasBindings(fileSystemPath);if(wasActive===isActive){return;}
this._treeElement.listItemElement.classList.toggle('has-mapped-files',isActive);if(this._treeElement.childrenListElement.hasFocus()){return;}
if(isActive){this._treeElement.expand();}else{this._treeElement.collapse();}}
setTitle(title){this._title=title;if(this._treeElement){this._treeElement.title=this._title;}}}
var NavigatorView$1=Object.freeze({__proto__:null,NavigatorView:NavigatorView,Types:Types,NavigatorFolderTreeElement:NavigatorFolderTreeElement,NavigatorSourceTreeElement:NavigatorSourceTreeElement,NavigatorTreeNode:NavigatorTreeNode,NavigatorRootTreeNode:NavigatorRootTreeNode,NavigatorUISourceCodeTreeNode:NavigatorUISourceCodeTreeNode,NavigatorFolderTreeNode:NavigatorFolderTreeNode,NavigatorGroupTreeNode:NavigatorGroupTreeNode});class HistoryEntry{valid(){}
reveal(){}}
class SimpleHistoryManager{constructor(historyDepth){this._entries=[];this._activeEntryIndex=-1;this._coalescingReadonly=0;this._historyDepth=historyDepth;}
readOnlyLock(){++this._coalescingReadonly;}
releaseReadOnlyLock(){--this._coalescingReadonly;}
readOnly(){return!!this._coalescingReadonly;}
filterOut(filterOutCallback){if(this.readOnly()){return;}
const filteredEntries=[];let removedBeforeActiveEntry=0;for(let i=0;i<this._entries.length;++i){if(!filterOutCallback(this._entries[i])){filteredEntries.push(this._entries[i]);}else if(i<=this._activeEntryIndex){++removedBeforeActiveEntry;}}
this._entries=filteredEntries;this._activeEntryIndex=Math.max(0,this._activeEntryIndex-removedBeforeActiveEntry);}
empty(){return!this._entries.length;}
active(){return this.empty()?null:this._entries[this._activeEntryIndex];}
push(entry){if(this.readOnly()){return;}
if(!this.empty()){this._entries.splice(this._activeEntryIndex+1);}
this._entries.push(entry);if(this._entries.length>this._historyDepth){this._entries.shift();}
this._activeEntryIndex=this._entries.length-1;}
rollback(){if(this.empty()){return false;}
let revealIndex=this._activeEntryIndex-1;while(revealIndex>=0&&!this._entries[revealIndex].valid()){--revealIndex;}
if(revealIndex<0){return false;}
this.readOnlyLock();this._entries[revealIndex].reveal();this.releaseReadOnlyLock();this._activeEntryIndex=revealIndex;return true;}
rollover(){let revealIndex=this._activeEntryIndex+1;while(revealIndex<this._entries.length&&!this._entries[revealIndex].valid()){++revealIndex;}
if(revealIndex>=this._entries.length){return false;}
this.readOnlyLock();this._entries[revealIndex].reveal();this.releaseReadOnlyLock();this._activeEntryIndex=revealIndex;return true;}}
var SimpleHistoryManager$1=Object.freeze({__proto__:null,HistoryEntry:HistoryEntry,SimpleHistoryManager:SimpleHistoryManager});class GutterDiffPlugin extends Plugin{constructor(textEditor,uiSourceCode){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;this._decorations=[];this._textEditor.installGutter(DiffGutterType,true);this._workspaceDiff=WorkspaceDiff.workspaceDiff();this._workspaceDiff.subscribeToDiffChange(this._uiSourceCode,this._update,this);this._update();}
static accepts(uiSourceCode){return uiSourceCode.project().type()===Workspace.projectTypes.Network;}
_updateDecorations(removed,added){this._textEditor.operation(operation);function operation(){for(const decoration of removed){decoration.remove();}
for(const decoration of added){decoration.install();}}}
_update(){if(this._uiSourceCode){this._workspaceDiff.requestDiff(this._uiSourceCode).then(this._innerUpdate.bind(this));}else{this._innerUpdate(null);}}
_innerUpdate(lineDiff){if(!lineDiff){this._updateDecorations(this._decorations,[]);this._decorations=[];return;}
const diff=SourceCodeDiff.SourceCodeDiff.computeDiff(lineDiff);const newDecorations=new Map();for(let i=0;i<diff.length;++i){const diffEntry=diff[i];for(let lineNumber=diffEntry.from;lineNumber<diffEntry.to;++lineNumber){newDecorations.set(lineNumber,{lineNumber:lineNumber,type:diffEntry.type});}}
const decorationDiff=this._calculateDecorationsDiff(newDecorations);const addedDecorations=decorationDiff.added.map(entry=>new GutterDecoration(this._textEditor,entry.lineNumber,entry.type));this._decorations=decorationDiff.equal.concat(addedDecorations);this._updateDecorations(decorationDiff.removed,addedDecorations);this._decorationsSetForTest(newDecorations);}
_decorationsByLine(){const decorations=new Map();for(const decoration of this._decorations){const lineNumber=decoration.lineNumber();if(lineNumber!==-1){decorations.set(lineNumber,decoration);}}
return decorations;}
_calculateDecorationsDiff(decorations){const oldDecorations=this._decorationsByLine();const leftKeys=[...oldDecorations.keys()];const rightKeys=[...decorations.keys()];leftKeys.sort((a,b)=>a-b);rightKeys.sort((a,b)=>a-b);const removed=[];const added=[];const equal=[];let leftIndex=0;let rightIndex=0;while(leftIndex<leftKeys.length&&rightIndex<rightKeys.length){const leftKey=leftKeys[leftIndex];const rightKey=rightKeys[rightIndex];const left=oldDecorations.get(leftKey);const right=decorations.get(rightKey);if(leftKey===rightKey&&left.type===right.type){equal.push(left);++leftIndex;++rightIndex;}else if(leftKey<=rightKey){removed.push(left);++leftIndex;}else{added.push(right);++rightIndex;}}
while(leftIndex<leftKeys.length){const leftKey=leftKeys[leftIndex++];removed.push(oldDecorations.get(leftKey));}
while(rightIndex<rightKeys.length){const rightKey=rightKeys[rightIndex++];added.push(decorations.get(rightKey));}
return{added:added,removed:removed,equal:equal};}
_decorationsSetForTest(decorations){}
async populateLineGutterContextMenu(contextMenu,lineNumber){GutterDiffPlugin._appendRevealDiffContextMenu(contextMenu,this._uiSourceCode);}
async populateTextAreaContextMenu(contextMenu,lineNumber,columnNumber){GutterDiffPlugin._appendRevealDiffContextMenu(contextMenu,this._uiSourceCode);}
static _appendRevealDiffContextMenu(contextMenu,uiSourceCode){if(!WorkspaceDiff.workspaceDiff().isUISourceCodeModified(uiSourceCode)){return;}
contextMenu.revealSection().appendItem(ls`Local Modifications...`,()=>{Revealer.reveal(new WorkspaceDiff.DiffUILocation(uiSourceCode));});}
dispose(){for(const decoration of this._decorations){decoration.remove();}
WorkspaceDiff.workspaceDiff().unsubscribeFromDiffChange(this._uiSourceCode,this._update,this);}}
class GutterDecoration{constructor(textEditor,lineNumber,type){this._textEditor=textEditor;this._position=this._textEditor.textEditorPositionHandle(lineNumber,0);this._className='';if(type===SourceCodeDiff.EditType.Insert){this._className='diff-entry-insert';}else if(type===SourceCodeDiff.EditType.Delete){this._className='diff-entry-delete';}else if(type===SourceCodeDiff.EditType.Modify){this._className='diff-entry-modify';}
this.type=type;}
lineNumber(){const location=this._position.resolve();if(!location){return-1;}
return location.lineNumber;}
install(){const location=this._position.resolve();if(!location){return;}
const element=createElementWithClass('div','diff-marker');element.textContent='\xA0';this._textEditor.setGutterDecoration(location.lineNumber,DiffGutterType,element);this._textEditor.toggleLineClass(location.lineNumber,this._className,true);}
remove(){const location=this._position.resolve();if(!location){return;}
this._textEditor.setGutterDecoration(location.lineNumber,DiffGutterType,null);this._textEditor.toggleLineClass(location.lineNumber,this._className,false);}}
const DiffGutterType='CodeMirror-gutter-diff';class ContextMenuProvider{appendApplicableItems(event,contextMenu,target){let uiSourceCode=(target);const binding=self.Persistence.persistence.binding(uiSourceCode);if(binding){uiSourceCode=binding.network;}
GutterDiffPlugin._appendRevealDiffContextMenu(contextMenu,uiSourceCode);}}
var GutterDiffPlugin$1=Object.freeze({__proto__:null,GutterDiffPlugin:GutterDiffPlugin,GutterDecoration:GutterDecoration,DiffGutterType:DiffGutterType,ContextMenuProvider:ContextMenuProvider});class JavaScriptCompilerPlugin extends Plugin{constructor(textEditor,uiSourceCode){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;this._compiling=false;this._recompileScheduled=false;this._timeout=null;this._message=null;this._disposed=false;this._textEditor.addEventListener(TextEditor.Events.TextChanged,this._scheduleCompile,this);if(this._uiSourceCode.hasCommits()||this._uiSourceCode.isDirty()){this._scheduleCompile();}}
static accepts(uiSourceCode){if(uiSourceCode.extension()==='js'){return true;}
if(ScriptSnippetFileSystem.isSnippetsUISourceCode(uiSourceCode)){return true;}
for(const debuggerModel of SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel)){if(DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().scriptFile(uiSourceCode,debuggerModel)){return true;}}
return false;}
_scheduleCompile(){if(this._compiling){this._recompileScheduled=true;return;}
if(this._timeout){clearTimeout(this._timeout);}
this._timeout=setTimeout(this._compile.bind(this),CompileDelay);}
_findRuntimeModel(){const debuggerModels=SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel);for(let i=0;i<debuggerModels.length;++i){const scriptFile=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().scriptFile(this._uiSourceCode,debuggerModels[i]);if(scriptFile){return debuggerModels[i].runtimeModel();}}
return SDKModel.TargetManager.instance().mainTarget()?SDKModel.TargetManager.instance().mainTarget().model(RuntimeModel.RuntimeModel):null;}
async _compile(){const runtimeModel=this._findRuntimeModel();if(!runtimeModel){return;}
const currentExecutionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!currentExecutionContext){return;}
const code=this._textEditor.text();if(code.length>1024*100){return;}
this._compiling=true;const result=await runtimeModel.compileScript(code,'',false,currentExecutionContext.id);this._compiling=false;if(this._recompileScheduled){this._recompileScheduled=false;this._scheduleCompile();return;}
if(this._message){this._uiSourceCode.removeMessage(this._message);}
if(this._disposed||!result||!result.exceptionDetails){return;}
const exceptionDetails=result.exceptionDetails;const text=RuntimeModel.RuntimeModel.simpleTextFromException(exceptionDetails);this._message=this._uiSourceCode.addLineMessage(UISourceCode.Message.Level.Error,text,exceptionDetails.lineNumber,exceptionDetails.columnNumber);this._compilationFinishedForTest();}
_compilationFinishedForTest(){}
dispose(){this._textEditor.removeEventListener(TextEditor.Events.TextChanged,this._scheduleCompile,this);if(this._message){this._uiSourceCode.removeMessage(this._message);}
this._disposed=true;if(this._timeout){clearTimeout(this._timeout);}}}
const CompileDelay=1000;var JavaScriptCompilerPlugin$1=Object.freeze({__proto__:null,JavaScriptCompilerPlugin:JavaScriptCompilerPlugin,CompileDelay:CompileDelay});class ScriptOriginPlugin extends Plugin{constructor(textEditor,uiSourceCode){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;}
static accepts(uiSourceCode){return uiSourceCode.contentType().hasScripts()||!!ScriptOriginPlugin._script(uiSourceCode);}
async rightToolbarItems(){const originURL=CompilerScriptMapping.CompilerScriptMapping.uiSourceCodeOrigin(this._uiSourceCode);if(originURL){const item=UIUtils.formatLocalized('(source mapped from %s)',[Linkifier$1.Linkifier.linkifyURL(originURL)]);return[new Toolbar.ToolbarItem(item)];}
const script=await ScriptOriginPlugin._script(this._uiSourceCode);if(!script||!script.originStackTrace){return[];}
const link=linkifier.linkifyStackTraceTopFrame(script.debuggerModel.target(),script.originStackTrace);return[new Toolbar.ToolbarItem(link)];}
static async _script(uiSourceCode){const locations=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,0,0);for(const location of locations){const script=location.script();if(script&&script.originStackTrace){return script;}}
return null;}}
const linkifier=new Linkifier$1.Linkifier();var ScriptOriginPlugin$1=Object.freeze({__proto__:null,ScriptOriginPlugin:ScriptOriginPlugin,linkifier:linkifier});class SnippetsPlugin extends Plugin{constructor(textEditor,uiSourceCode){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;}
static accepts(uiSourceCode){return ScriptSnippetFileSystem.isSnippetsUISourceCode(uiSourceCode);}
async rightToolbarItems(){const runSnippet=Toolbar.Toolbar.createActionButtonForId('debugger.run-snippet');runSnippet.setText(Platform$1.isMac()?UIString.UIString('\u2318+Enter'):UIString.UIString('Ctrl+Enter'));return[runSnippet];}}
var SnippetsPlugin$1=Object.freeze({__proto__:null,SnippetsPlugin:SnippetsPlugin});class UISourceCodeFrame extends SourceFrame.SourceFrameImpl{constructor(uiSourceCode){super(workingCopy);this._uiSourceCode=uiSourceCode;if(Root.Runtime.experiments.isEnabled('sourceDiff')){this._diff=new SourceCodeDiff.SourceCodeDiff(this.textEditor);}
this._muteSourceCodeEvents=false;this._isSettingContent=false;this._persistenceBinding=self.Persistence.persistence.binding(uiSourceCode);this._rowMessageBuckets=new Map();this._typeDecorationsPending=new Set();this._uiSourceCodeEventListeners=[];this._messageAndDecorationListeners=[];this._boundOnBindingChanged=this._onBindingChanged.bind(this);this.textEditor.addEventListener(SourcesTextEditor.Events.EditorBlurred,()=>self.UI.context.setFlavor(UISourceCodeFrame,null));this.textEditor.addEventListener(SourcesTextEditor.Events.EditorFocused,()=>self.UI.context.setFlavor(UISourceCodeFrame,this));Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled').addChangeListener(this._onNetworkPersistenceChanged,this);this._errorPopoverHelper=new PopoverHelper.PopoverHelper(this.element,this._getErrorPopoverContent.bind(this));this._errorPopoverHelper.setHasPadding(true);this._errorPopoverHelper.setTimeout(100,100);this._plugins=[];this._initializeUISourceCode();function workingCopy(){if(uiSourceCode.isDirty()){return Promise.resolve({content:uiSourceCode.workingCopy(),isEncoded:false});}
return uiSourceCode.requestContent();}}
_installMessageAndDecorationListeners(){if(this._persistenceBinding){const networkSourceCode=this._persistenceBinding.network;const fileSystemSourceCode=this._persistenceBinding.fileSystem;this._messageAndDecorationListeners=[networkSourceCode.addEventListener(UISourceCode.Events.MessageAdded,this._onMessageAdded,this),networkSourceCode.addEventListener(UISourceCode.Events.MessageRemoved,this._onMessageRemoved,this),networkSourceCode.addEventListener(UISourceCode.Events.LineDecorationAdded,this._onLineDecorationAdded,this),networkSourceCode.addEventListener(UISourceCode.Events.LineDecorationRemoved,this._onLineDecorationRemoved,this),fileSystemSourceCode.addEventListener(UISourceCode.Events.MessageAdded,this._onMessageAdded,this),fileSystemSourceCode.addEventListener(UISourceCode.Events.MessageRemoved,this._onMessageRemoved,this),];}else{this._messageAndDecorationListeners=[this._uiSourceCode.addEventListener(UISourceCode.Events.MessageAdded,this._onMessageAdded,this),this._uiSourceCode.addEventListener(UISourceCode.Events.MessageRemoved,this._onMessageRemoved,this),this._uiSourceCode.addEventListener(UISourceCode.Events.LineDecorationAdded,this._onLineDecorationAdded,this),this._uiSourceCode.addEventListener(UISourceCode.Events.LineDecorationRemoved,this._onLineDecorationRemoved,this)];}}
uiSourceCode(){return this._uiSourceCode;}
setUISourceCode(uiSourceCode){this._unloadUISourceCode();this._uiSourceCode=uiSourceCode;if(uiSourceCode.contentLoaded()){if(uiSourceCode.workingCopy()!==this.textEditor.text()){this._innerSetContent(uiSourceCode.workingCopy());}}else{uiSourceCode.requestContent().then(()=>{if(this._uiSourceCode!==uiSourceCode){return;}
if(uiSourceCode.workingCopy()!==this.textEditor.text()){this._innerSetContent(uiSourceCode.workingCopy());}});}
this._initializeUISourceCode();}
_unloadUISourceCode(){this._disposePlugins();for(const message of this._allMessages()){this._removeMessageFromSource(message);}
EventTarget.EventTarget.removeEventListeners(this._messageAndDecorationListeners);EventTarget.EventTarget.removeEventListeners(this._uiSourceCodeEventListeners);this._uiSourceCode.removeWorkingCopyGetter();self.Persistence.persistence.unsubscribeFromBindingEvent(this._uiSourceCode,this._boundOnBindingChanged);}
_initializeUISourceCode(){this._uiSourceCodeEventListeners=[this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._onWorkingCopyChanged,this),this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._onWorkingCopyCommitted,this),this._uiSourceCode.addEventListener(UISourceCode.Events.TitleChanged,this._refreshHighlighterType,this)];self.Persistence.persistence.subscribeForBindingEvent(this._uiSourceCode,this._boundOnBindingChanged);for(const message of this._allMessages()){this._addMessageToSource(message);}
this._installMessageAndDecorationListeners();this._updateStyle();this._decorateAllTypes();this._refreshHighlighterType();if(Root.Runtime.experiments.isEnabled('sourcesPrettyPrint')){const supportedPrettyTypes=new Set(['text/html','text/css','text/javascript']);this.setCanPrettyPrint(supportedPrettyTypes.has(this.highlighterType()),true);}
this._ensurePluginsLoaded();}
wasShown(){super.wasShown();setImmediate(this._updateBucketDecorations.bind(this));this.setEditable(this._canEditSource());for(const plugin of this._plugins){plugin.wasShown();}}
willHide(){for(const plugin of this._plugins){plugin.willHide();}
super.willHide();self.UI.context.setFlavor(UISourceCodeFrame,null);this._uiSourceCode.removeWorkingCopyGetter();}
_refreshHighlighterType(){const binding=self.Persistence.persistence.binding(this._uiSourceCode);const highlighterType=binding?binding.network.mimeType():this._uiSourceCode.mimeType();if(this.highlighterType()===highlighterType){return;}
this._disposePlugins();this.setHighlighterType(highlighterType);this._ensurePluginsLoaded();}
_canEditSource(){if(this.hasLoadError()){return false;}
if(this._uiSourceCode.editDisabled()){return false;}
if(self.Persistence.persistence.binding(this._uiSourceCode)){return true;}
if(this._uiSourceCode.project().canSetFileContent()){return true;}
if(this._uiSourceCode.project().isServiceProject()){return false;}
if(this._uiSourceCode.project().type()===Workspace.projectTypes.Network&&self.Persistence.networkPersistenceManager.active()){return true;}
if(this.pretty&&this._uiSourceCode.contentType().hasScripts()){return false;}
return this._uiSourceCode.contentType()!==ResourceType.resourceTypes.Document;}
_onNetworkPersistenceChanged(){this.setEditable(this._canEditSource());}
commitEditing(){if(!this._uiSourceCode.isDirty()){return;}
this._muteSourceCodeEvents=true;this._uiSourceCode.commitWorkingCopy();this._muteSourceCodeEvents=false;}
setContent(content,loadError){this._disposePlugins();this._rowMessageBuckets.clear();super.setContent(content,loadError);for(const message of this._allMessages()){this._addMessageToSource(message);}
this._decorateAllTypes();this._ensurePluginsLoaded();}
_allMessages(){if(this._persistenceBinding){const combinedSet=this._persistenceBinding.network.messages();combinedSet.addAll(this._persistenceBinding.fileSystem.messages());return combinedSet;}
return this._uiSourceCode.messages();}
onTextChanged(oldRange,newRange){const wasPretty=this.pretty;super.onTextChanged(oldRange,newRange);this._errorPopoverHelper.hidePopover();if(this._isSettingContent){return;}
SourcesPanel.instance().updateLastModificationTime();this._muteSourceCodeEvents=true;if(this.isClean()){this._uiSourceCode.resetWorkingCopy();}else{this._uiSourceCode.setWorkingCopyGetter(this.textEditor.text.bind(this.textEditor));}
this._muteSourceCodeEvents=false;if(wasPretty!==this.pretty){this._updateStyle();this._disposePlugins();this._ensurePluginsLoaded();}}
_onWorkingCopyChanged(event){if(this._muteSourceCodeEvents){return;}
this._innerSetContent(this._uiSourceCode.workingCopy());}
_onWorkingCopyCommitted(event){if(!this._muteSourceCodeEvents){this._innerSetContent(this._uiSourceCode.workingCopy());}
this.contentCommitted();this._updateStyle();}
_ensurePluginsLoaded(){if(!this.loaded||this._plugins.length){return;}
const binding=self.Persistence.persistence.binding(this._uiSourceCode);const pluginUISourceCode=binding?binding.network:this._uiSourceCode;if(DebuggerPlugin.accepts(pluginUISourceCode)){this._plugins.push(new DebuggerPlugin(this.textEditor,pluginUISourceCode,this.transformer()));}
if(CSSPlugin.accepts(pluginUISourceCode)){this._plugins.push(new CSSPlugin(this.textEditor));}
if(!this.pretty&&JavaScriptCompilerPlugin.accepts(pluginUISourceCode)){this._plugins.push(new JavaScriptCompilerPlugin(this.textEditor,pluginUISourceCode));}
if(SnippetsPlugin.accepts(pluginUISourceCode)){this._plugins.push(new SnippetsPlugin(this.textEditor,pluginUISourceCode));}
if(ScriptOriginPlugin.accepts(pluginUISourceCode)){this._plugins.push(new ScriptOriginPlugin(this.textEditor,pluginUISourceCode));}
if(!this.pretty&&Root.Runtime.experiments.isEnabled('sourceDiff')&&GutterDiffPlugin.accepts(pluginUISourceCode)){this._plugins.push(new GutterDiffPlugin(this.textEditor,pluginUISourceCode));}
if(CoveragePlugin.accepts(pluginUISourceCode)){this._plugins.push(new CoveragePlugin(this.textEditor,pluginUISourceCode));}
this.dispatchEventToListeners(Events.ToolbarItemsChanged);for(const plugin of this._plugins){plugin.wasShown();}}
_disposePlugins(){this.textEditor.operation(()=>{for(const plugin of this._plugins){plugin.dispose();}});this._plugins=[];}
_onBindingChanged(){const binding=self.Persistence.persistence.binding(this._uiSourceCode);if(binding===this._persistenceBinding){return;}
this._unloadUISourceCode();this._persistenceBinding=binding;this._initializeUISourceCode();}
_updateStyle(){this.setEditable(this._canEditSource());}
_innerSetContent(content){this._isSettingContent=true;const oldContent=this.textEditor.text();if(this._diff){this._diff.highlightModifiedLines(oldContent,content);}
if(oldContent!==content){this.setContent(content,null);}
this._isSettingContent=false;}
async populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber){await super.populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber);contextMenu.appendApplicableItems(this._uiSourceCode);const location=this.transformer().editorToRawLocation(editorLineNumber,editorColumnNumber);contextMenu.appendApplicableItems(new UISourceCode.UILocation(this._uiSourceCode,location[0],location[1]));contextMenu.appendApplicableItems(this);for(const plugin of this._plugins){await plugin.populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber);}}
dispose(){this._errorPopoverHelper.dispose();this._unloadUISourceCode();this.textEditor.dispose();this.detach();Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled').removeChangeListener(this._onNetworkPersistenceChanged,this);}
_onMessageAdded(event){const message=(event.data);this._addMessageToSource(message);}
_addMessageToSource(message){if(!this.loaded){return;}
const editorLocation=this.transformer().rawToEditorLocation(message.lineNumber(),message.columnNumber());let editorLineNumber=editorLocation[0];if(editorLineNumber>=this.textEditor.linesCount){editorLineNumber=this.textEditor.linesCount-1;}
if(editorLineNumber<0){editorLineNumber=0;}
let messageBucket=this._rowMessageBuckets.get(editorLineNumber);if(!messageBucket){messageBucket=new RowMessageBucket(this,this.textEditor,editorLineNumber);this._rowMessageBuckets.set(editorLineNumber,messageBucket);}
messageBucket.addMessage(message);}
_onMessageRemoved(event){const message=(event.data);this._removeMessageFromSource(message);}
_removeMessageFromSource(message){if(!this.loaded){return;}
const editorLocation=this.transformer().rawToEditorLocation(message.lineNumber(),message.columnNumber());let editorLineNumber=editorLocation[0];if(editorLineNumber>=this.textEditor.linesCount){editorLineNumber=this.textEditor.linesCount-1;}
if(editorLineNumber<0){editorLineNumber=0;}
const messageBucket=this._rowMessageBuckets.get(editorLineNumber);if(!messageBucket){return;}
messageBucket.removeMessage(message);if(!messageBucket.uniqueMessagesCount()){messageBucket.detachFromEditor();this._rowMessageBuckets.delete(editorLineNumber);}}
_getErrorPopoverContent(event){const element=event.target.enclosingNodeOrSelfWithClass('text-editor-line-decoration-icon')||event.target.enclosingNodeOrSelfWithClass('text-editor-line-decoration-wave');if(!element){return null;}
const anchor=element.enclosingNodeOrSelfWithClass('text-editor-line-decoration-icon')?element.boxInWindow():new AnchorBox(event.clientX,event.clientY,1,1);return{box:anchor,show:popover=>{const messageBucket=element.enclosingNodeOrSelfWithClass('text-editor-line-decoration')._messageBucket;const messagesOutline=messageBucket.messagesDescription();popover.contentElement.appendChild(messagesOutline);return Promise.resolve(true);}};}
_updateBucketDecorations(){for(const bucket of this._rowMessageBuckets.values()){bucket._updateDecoration();}}
_onLineDecorationAdded(event){const marker=(event.data);this._decorateTypeThrottled(marker.type());}
_onLineDecorationRemoved(event){const marker=(event.data);this._decorateTypeThrottled(marker.type());}
async _decorateTypeThrottled(type){if(this._typeDecorationsPending.has(type)){return;}
this._typeDecorationsPending.add(type);const decorator=await self.runtime.extensions(SourceFrame.LineDecorator).find(extension=>extension.descriptor()['decoratorType']===type).instance();this._typeDecorationsPending.delete(type);this.textEditor.codeMirror().operation(()=>{decorator.decorate(this._persistenceBinding?this._persistenceBinding.network:this.uiSourceCode(),this.textEditor,type);});}
_decorateAllTypes(){if(!this.loaded){return;}
for(const extension of self.runtime.extensions(SourceFrame.LineDecorator)){const type=extension.descriptor()['decoratorType'];if(this._uiSourceCode.decorationsForType(type)){this._decorateTypeThrottled(type);}}}
async toolbarItems(){const leftToolbarItems=await super.toolbarItems();const rightToolbarItems=[];for(const plugin of this._plugins){leftToolbarItems.push(...plugin.leftToolbarItems());rightToolbarItems.push(...await plugin.rightToolbarItems());}
if(!rightToolbarItems.length){return leftToolbarItems;}
return[...leftToolbarItems,new Toolbar.ToolbarSeparator(true),...rightToolbarItems];}
async populateLineGutterContextMenu(contextMenu,lineNumber){await super.populateLineGutterContextMenu(contextMenu,lineNumber);for(const plugin of this._plugins){await plugin.populateLineGutterContextMenu(contextMenu,lineNumber);}}}
const iconClassPerLevel={};iconClassPerLevel[UISourceCode.Message.Level.Error]='smallicon-error';iconClassPerLevel[UISourceCode.Message.Level.Warning]='smallicon-warning';const bubbleTypePerLevel={};bubbleTypePerLevel[UISourceCode.Message.Level.Error]='error';bubbleTypePerLevel[UISourceCode.Message.Level.Warning]='warning';const lineClassPerLevel={};lineClassPerLevel[UISourceCode.Message.Level.Error]='text-editor-line-with-error';lineClassPerLevel[UISourceCode.Message.Level.Warning]='text-editor-line-with-warning';class RowMessage{constructor(message){this._message=message;this._repeatCount=1;this.element=createElementWithClass('div','text-editor-row-message');this._icon=this.element.createChild('label','','dt-icon-label');this._icon.type=iconClassPerLevel[message.level()];this._repeatCountElement=this.element.createChild('span','text-editor-row-message-repeat-count hidden','dt-small-bubble');this._repeatCountElement.type=bubbleTypePerLevel[message.level()];const linesContainer=this.element.createChild('div');const lines=this._message.text().split('\n');for(let i=0;i<lines.length;++i){const messageLine=linesContainer.createChild('div');messageLine.textContent=lines[i];}}
message(){return this._message;}
repeatCount(){return this._repeatCount;}
setRepeatCount(repeatCount){if(this._repeatCount===repeatCount){return;}
this._repeatCount=repeatCount;this._updateMessageRepeatCount();}
_updateMessageRepeatCount(){this._repeatCountElement.textContent=this._repeatCount;const showRepeatCount=this._repeatCount>1;this._repeatCountElement.classList.toggle('hidden',!showRepeatCount);this._icon.classList.toggle('hidden',showRepeatCount);}}
class RowMessageBucket{constructor(sourceFrame,textEditor,editorLineNumber){this._sourceFrame=sourceFrame;this.textEditor=textEditor;this._lineHandle=textEditor.textEditorPositionHandle(editorLineNumber,0);this._decoration=createElementWithClass('div','text-editor-line-decoration');this._decoration._messageBucket=this;this._wave=this._decoration.createChild('div','text-editor-line-decoration-wave');this._icon=this._wave.createChild('span','text-editor-line-decoration-icon','dt-icon-label');this._decorationStartColumn=null;this._messagesDescriptionElement=createElementWithClass('div','text-editor-messages-description-container');this._messages=[];this._level=null;}
_updateWavePosition(editorLineNumber,columnNumber){editorLineNumber=Math.min(editorLineNumber,this.textEditor.linesCount-1);const lineText=this.textEditor.line(editorLineNumber);columnNumber=Math.min(columnNumber,lineText.length);const lineIndent=TextUtils.Utils.lineIndent(lineText).length;const startColumn=Math.max(columnNumber-1,lineIndent);if(this._decorationStartColumn===startColumn){return;}
if(this._decorationStartColumn!==null){this.textEditor.removeDecoration(this._decoration,editorLineNumber);}
this.textEditor.addDecoration(this._decoration,editorLineNumber,startColumn);this._decorationStartColumn=startColumn;}
messagesDescription(){this._messagesDescriptionElement.removeChildren();Utils.appendStyle(this._messagesDescriptionElement,'source_frame/messagesPopover.css');for(let i=0;i<this._messages.length;++i){this._messagesDescriptionElement.appendChild(this._messages[i].element);}
return this._messagesDescriptionElement;}
detachFromEditor(){const position=this._lineHandle.resolve();if(!position){return;}
const editorLineNumber=position.lineNumber;if(this._level){this.textEditor.toggleLineClass(editorLineNumber,lineClassPerLevel[this._level],false);}
if(this._decorationStartColumn!==null){this.textEditor.removeDecoration(this._decoration,editorLineNumber);this._decorationStartColumn=null;}}
uniqueMessagesCount(){return this._messages.length;}
addMessage(message){for(let i=0;i<this._messages.length;++i){const rowMessage=this._messages[i];if(rowMessage.message().isEqual(message)){rowMessage.setRepeatCount(rowMessage.repeatCount()+1);return;}}
const rowMessage=new RowMessage(message);this._messages.push(rowMessage);this._updateDecoration();}
removeMessage(message){for(let i=0;i<this._messages.length;++i){const rowMessage=this._messages[i];if(!rowMessage.message().isEqual(message)){continue;}
rowMessage.setRepeatCount(rowMessage.repeatCount()-1);if(!rowMessage.repeatCount()){this._messages.splice(i,1);}
this._updateDecoration();return;}}
_updateDecoration(){if(!this._sourceFrame.isShowing()){return;}
if(!this._messages.length){return;}
const position=this._lineHandle.resolve();if(!position){return;}
const editorLineNumber=position.lineNumber;let columnNumber=Number.MAX_VALUE;let maxMessage=null;for(let i=0;i<this._messages.length;++i){const message=this._messages[i].message();const editorLocation=this._sourceFrame.transformer().rawToEditorLocation(editorLineNumber,message.columnNumber());columnNumber=Math.min(columnNumber,editorLocation[1]);if(!maxMessage||UISourceCode.Message.messageLevelComparator(maxMessage,message)<0){maxMessage=message;}}
this._updateWavePosition(editorLineNumber,columnNumber);if(this._level===maxMessage.level()){return;}
if(this._level){this.textEditor.toggleLineClass(editorLineNumber,lineClassPerLevel[this._level],false);this._icon.type='';}
this._level=maxMessage.level();if(!this._level){return;}
this.textEditor.toggleLineClass(editorLineNumber,lineClassPerLevel[this._level],true);this._icon.type=iconClassPerLevel[this._level];}}
UISourceCode.Message._messageLevelPriority={'Warning':3,'Error':4};UISourceCode.Message.messageLevelComparator=function(a,b){return UISourceCode.Message._messageLevelPriority[a.level()]-
UISourceCode.Message._messageLevelPriority[b.level()];};const Events={ToolbarItemsChanged:Symbol('ToolbarItemsChanged')};var UISourceCodeFrame$1=Object.freeze({__proto__:null,UISourceCodeFrame:UISourceCodeFrame,iconClassPerLevel:iconClassPerLevel,bubbleTypePerLevel:bubbleTypePerLevel,lineClassPerLevel:lineClassPerLevel,RowMessage:RowMessage,RowMessageBucket:RowMessageBucket,Events:Events});class EditingLocationHistoryManager{constructor(sourcesView,currentSourceFrameCallback){this._sourcesView=sourcesView;this._historyManager=new SimpleHistoryManager(HistoryDepth);this._currentSourceFrameCallback=currentSourceFrameCallback;}
trackSourceFrameCursorJumps(sourceFrame){sourceFrame.textEditor.addEventListener(SourcesTextEditor.Events.JumpHappened,this._onJumpHappened.bind(this));}
_onJumpHappened(event){if(event.data.from){this._updateActiveState(event.data.from);}
if(event.data.to){this._pushActiveState(event.data.to);}}
rollback(){this._historyManager.rollback();}
rollover(){this._historyManager.rollover();}
updateCurrentState(){const sourceFrame=this._currentSourceFrameCallback();if(!sourceFrame){return;}
this._updateActiveState(sourceFrame.textEditor.selection());}
pushNewState(){const sourceFrame=this._currentSourceFrameCallback();if(!sourceFrame){return;}
this._pushActiveState(sourceFrame.textEditor.selection());}
_updateActiveState(selection){const active=(this._historyManager.active());if(!active){return;}
const sourceFrame=this._currentSourceFrameCallback();if(!sourceFrame){return;}
const entry=new EditingLocationHistoryEntry(this._sourcesView,this,sourceFrame,selection);active.merge(entry);}
_pushActiveState(selection){const sourceFrame=this._currentSourceFrameCallback();if(!sourceFrame){return;}
const entry=new EditingLocationHistoryEntry(this._sourcesView,this,sourceFrame,selection);this._historyManager.push(entry);}
removeHistoryForSourceCode(uiSourceCode){function filterOut(entry){return entry._projectId===uiSourceCode.project().id()&&entry._url===uiSourceCode.url();}
this._historyManager.filterOut(filterOut);}}
const HistoryDepth=20;class EditingLocationHistoryEntry{constructor(sourcesView,editingLocationManager,sourceFrame,selection){this._sourcesView=sourcesView;this._editingLocationManager=editingLocationManager;const uiSourceCode=sourceFrame.uiSourceCode();this._projectId=uiSourceCode.project().id();this._url=uiSourceCode.url();const position=this._positionFromSelection(selection);this._positionHandle=sourceFrame.textEditor.textEditorPositionHandle(position.lineNumber,position.columnNumber);}
merge(entry){if(this._projectId!==entry._projectId||this._url!==entry._url){return;}
this._positionHandle=entry._positionHandle;}
_positionFromSelection(selection){return{lineNumber:selection.endLine,columnNumber:selection.endColumn};}
valid(){const position=this._positionHandle.resolve();const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCode(this._projectId,this._url);return!!(position&&uiSourceCode);}
reveal(){const position=this._positionHandle.resolve();const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCode(this._projectId,this._url);if(!position||!uiSourceCode){return;}
this._editingLocationManager.updateCurrentState();this._sourcesView.showSourceLocation(uiSourceCode,position.lineNumber,position.columnNumber);}}
var EditingLocationHistoryManager$1=Object.freeze({__proto__:null,EditingLocationHistoryManager:EditingLocationHistoryManager,HistoryDepth:HistoryDepth,EditingLocationHistoryEntry:EditingLocationHistoryEntry});class TabbedEditorContainerDelegate{viewForFile(uiSourceCode){}
recycleUISourceCodeFrame(sourceFrame,uiSourceCode){}}
class TabbedEditorContainer extends ObjectWrapper.ObjectWrapper{constructor(delegate,setting,placeholderElement,focusedPlaceholderElement){super();this._delegate=delegate;this._tabbedPane=new TabbedPane.TabbedPane();this._tabbedPane.setPlaceholderElement(placeholderElement,focusedPlaceholderElement);this._tabbedPane.setTabDelegate(new EditorContainerTabDelegate(this));this._tabbedPane.setCloseableTabs(true);this._tabbedPane.setAllowTabReorder(true,true);this._tabbedPane.addEventListener(TabbedPane.Events.TabClosed,this._tabClosed,this);this._tabbedPane.addEventListener(TabbedPane.Events.TabSelected,this._tabSelected,this);self.Persistence.persistence.addEventListener(Persistence.Events.BindingCreated,this._onBindingCreated,this);self.Persistence.persistence.addEventListener(Persistence.Events.BindingRemoved,this._onBindingRemoved,this);this._tabIds=new Map();this._files={};this._previouslyViewedFilesSetting=setting;this._history=History.fromObject(this._previouslyViewedFilesSetting.get());this._uriToUISourceCode=new Map();}
_onBindingCreated(event){const binding=(event.data);this._updateFileTitle(binding.fileSystem);const networkTabId=this._tabIds.get(binding.network);let fileSystemTabId=this._tabIds.get(binding.fileSystem);const wasSelectedInNetwork=this._currentFile===binding.network;const currentSelectionRange=this._history.selectionRange(binding.network.url());const currentScrollLineNumber=this._history.scrollLineNumber(binding.network.url());this._history.remove(binding.network.url());if(!networkTabId){return;}
if(!fileSystemTabId){const networkView=this._tabbedPane.tabView(networkTabId);const tabIndex=this._tabbedPane.tabIndex(networkTabId);if(networkView instanceof UISourceCodeFrame){this._delegate.recycleUISourceCodeFrame(networkView,binding.fileSystem);fileSystemTabId=this._appendFileTab(binding.fileSystem,false,tabIndex,networkView);}else{fileSystemTabId=this._appendFileTab(binding.fileSystem,false,tabIndex);const fileSystemTabView=(this._tabbedPane.tabView(fileSystemTabId));this._restoreEditorProperties(fileSystemTabView,currentSelectionRange,currentScrollLineNumber);}}
this._closeTabs([networkTabId],true);if(wasSelectedInNetwork){this._tabbedPane.selectTab(fileSystemTabId,false);}
this._updateHistory();}
_onBindingRemoved(event){const binding=(event.data);this._updateFileTitle(binding.fileSystem);}
get view(){return this._tabbedPane;}
get visibleView(){return this._tabbedPane.visibleView;}
fileViews(){return(this._tabbedPane.tabViews());}
leftToolbar(){return this._tabbedPane.leftToolbar();}
rightToolbar(){return this._tabbedPane.rightToolbar();}
show(parentElement){this._tabbedPane.show(parentElement);}
showFile(uiSourceCode){this._innerShowFile(this._canonicalUISourceCode(uiSourceCode),true);}
closeFile(uiSourceCode){const tabId=this._tabIds.get(uiSourceCode);if(!tabId){return;}
this._closeTabs([tabId]);}
closeAllFiles(){this._closeTabs(this._tabbedPane.tabIds());}
historyUISourceCodes(){const result=[];const uris=this._history._urls();for(const uri of uris){const uiSourceCode=this._uriToUISourceCode.get(uri);if(uiSourceCode){result.push(uiSourceCode);}}
return result;}
_addViewListeners(){if(!this._currentView||!this._currentView.textEditor){return;}
this._currentView.textEditor.addEventListener(SourcesTextEditor.Events.ScrollChanged,this._scrollChanged,this);this._currentView.textEditor.addEventListener(SourcesTextEditor.Events.SelectionChanged,this._selectionChanged,this);}
_removeViewListeners(){if(!this._currentView||!this._currentView.textEditor){return;}
this._currentView.textEditor.removeEventListener(SourcesTextEditor.Events.ScrollChanged,this._scrollChanged,this);this._currentView.textEditor.removeEventListener(SourcesTextEditor.Events.SelectionChanged,this._selectionChanged,this);}
_scrollChanged(event){if(this._scrollTimer){clearTimeout(this._scrollTimer);}
const lineNumber=(event.data);this._scrollTimer=setTimeout(saveHistory.bind(this),100);this._history.updateScrollLineNumber(this._currentFile.url(),lineNumber);function saveHistory(){this._history.save(this._previouslyViewedFilesSetting);}}
_selectionChanged(event){const range=(event.data);this._history.updateSelectionRange(this._currentFile.url(),range);this._history.save(this._previouslyViewedFilesSetting);self.Extensions.extensionServer.sourceSelectionChanged(this._currentFile.url(),range);}
_innerShowFile(uiSourceCode,userGesture){const binding=self.Persistence.persistence.binding(uiSourceCode);uiSourceCode=binding?binding.fileSystem:uiSourceCode;if(this._currentFile===uiSourceCode){return;}
this._removeViewListeners();this._currentFile=uiSourceCode;const tabId=this._tabIds.get(uiSourceCode)||this._appendFileTab(uiSourceCode,userGesture);this._tabbedPane.selectTab(tabId,userGesture);if(userGesture){this._editorSelectedByUserAction();}
const previousView=this._currentView;this._currentView=this.visibleView;this._addViewListeners();const eventData={currentFile:this._currentFile,currentView:this._currentView,previousView:previousView,userGesture:userGesture};this.dispatchEventToListeners(Events$1.EditorSelected,eventData);}
_titleForFile(uiSourceCode){const maxDisplayNameLength=30;let title=uiSourceCode.displayName(true).trimMiddle(maxDisplayNameLength);if(uiSourceCode.isDirty()){title+='*';}
return title;}
_maybeCloseTab(id,nextTabId){const uiSourceCode=this._files[id];const shouldPrompt=uiSourceCode.isDirty()&&uiSourceCode.project().canSetFileContent();if(!shouldPrompt||confirm(UIString.UIString('Are you sure you want to close unsaved file: %s?',uiSourceCode.name()))){uiSourceCode.resetWorkingCopy();if(nextTabId){this._tabbedPane.selectTab(nextTabId,true);}
this._tabbedPane.closeTab(id,true);return true;}
return false;}
_closeTabs(ids,forceCloseDirtyTabs){const dirtyTabs=[];const cleanTabs=[];for(let i=0;i<ids.length;++i){const id=ids[i];const uiSourceCode=this._files[id];if(!forceCloseDirtyTabs&&uiSourceCode.isDirty()){dirtyTabs.push(id);}else{cleanTabs.push(id);}}
if(dirtyTabs.length){this._tabbedPane.selectTab(dirtyTabs[0],true);}
this._tabbedPane.closeTabs(cleanTabs,true);for(let i=0;i<dirtyTabs.length;++i){const nextTabId=i+1<dirtyTabs.length?dirtyTabs[i+1]:null;if(!this._maybeCloseTab(dirtyTabs[i],nextTabId)){break;}}}
_onContextMenu(tabId,contextMenu){const uiSourceCode=this._files[tabId];if(uiSourceCode){contextMenu.appendApplicableItems(uiSourceCode);}}
_canonicalUISourceCode(uiSourceCode){if(this._uriToUISourceCode.has(uiSourceCode.url())){return this._uriToUISourceCode.get(uiSourceCode.url());}
this._uriToUISourceCode.set(uiSourceCode.url(),uiSourceCode);return uiSourceCode;}
addUISourceCode(uiSourceCode){const canonicalSourceCode=this._canonicalUISourceCode(uiSourceCode);const duplicated=canonicalSourceCode!==uiSourceCode;const binding=self.Persistence.persistence.binding(canonicalSourceCode);uiSourceCode=binding?binding.fileSystem:canonicalSourceCode;if(duplicated){uiSourceCode.disableEdit();}
if(this._currentFile===uiSourceCode){return;}
const uri=uiSourceCode.url();const index=this._history.index(uri);if(index===-1){return;}
if(!this._tabIds.has(uiSourceCode)){this._appendFileTab(uiSourceCode,false);}
if(!index){this._innerShowFile(uiSourceCode,false);return;}
if(!this._currentFile){return;}
const currentProjectIsSnippets=ScriptSnippetFileSystem.isSnippetsUISourceCode(this._currentFile);const addedProjectIsSnippets=ScriptSnippetFileSystem.isSnippetsUISourceCode(uiSourceCode);if(this._history.index(this._currentFile.url())&&currentProjectIsSnippets&&!addedProjectIsSnippets){this._innerShowFile(uiSourceCode,false);}}
removeUISourceCode(uiSourceCode){this.removeUISourceCodes([uiSourceCode]);}
removeUISourceCodes(uiSourceCodes){const tabIds=[];for(const uiSourceCode of uiSourceCodes){const tabId=this._tabIds.get(uiSourceCode);if(tabId){tabIds.push(tabId);}
if(this._uriToUISourceCode.get(uiSourceCode.url())===uiSourceCode){this._uriToUISourceCode.delete(uiSourceCode.url());}}
this._tabbedPane.closeTabs(tabIds);}
_editorClosedByUserAction(uiSourceCode){this._history.remove(uiSourceCode.url());this._updateHistory();}
_editorSelectedByUserAction(){this._updateHistory();}
_updateHistory(){const tabIds=this._tabbedPane.lastOpenedTabIds(maximalPreviouslyViewedFilesCount);function tabIdToURI(tabId){return this._files[tabId].url();}
this._history.update(tabIds.map(tabIdToURI.bind(this)));this._history.save(this._previouslyViewedFilesSetting);}
_tooltipForFile(uiSourceCode){uiSourceCode=self.Persistence.persistence.network(uiSourceCode)||uiSourceCode;return uiSourceCode.url();}
_appendFileTab(uiSourceCode,userGesture,index,replaceView){const view=replaceView||this._delegate.viewForFile(uiSourceCode);const title=this._titleForFile(uiSourceCode);const tooltip=this._tooltipForFile(uiSourceCode);const tabId=this._generateTabId();this._tabIds.set(uiSourceCode,tabId);this._files[tabId]=uiSourceCode;if(!replaceView){const savedSelectionRange=this._history.selectionRange(uiSourceCode.url());const savedScrollLineNumber=this._history.scrollLineNumber(uiSourceCode.url());this._restoreEditorProperties(view,savedSelectionRange,savedScrollLineNumber);}
this._tabbedPane.appendTab(tabId,title,view,tooltip,userGesture,undefined,index);this._updateFileTitle(uiSourceCode);this._addUISourceCodeListeners(uiSourceCode);if(uiSourceCode.loadError()){this._addLoadErrorIcon(tabId);}else if(!uiSourceCode.contentLoaded()){uiSourceCode.requestContent().then(content=>{if(uiSourceCode.loadError()){this._addLoadErrorIcon(tabId);}});}
return tabId;}
_addLoadErrorIcon(tabId){const icon=Icon.Icon.create('smallicon-error');icon.title=ls`Unable to load this content.`;if(this._tabbedPane.tabView(tabId)){this._tabbedPane.setTabIcon(tabId,icon);}}
_restoreEditorProperties(editorView,selection,firstLineNumber){const sourceFrame=editorView instanceof SourceFrame.SourceFrameImpl?(editorView):null;if(!sourceFrame){return;}
if(selection){sourceFrame.setSelection(selection);}
if(typeof firstLineNumber==='number'){sourceFrame.scrollToLine(firstLineNumber);}}
_tabClosed(event){const tabId=(event.data.tabId);const userGesture=(event.data.isUserGesture);const uiSourceCode=this._files[tabId];if(this._currentFile===uiSourceCode){this._removeViewListeners();delete this._currentView;delete this._currentFile;}
this._tabIds.delete(uiSourceCode);delete this._files[tabId];this._removeUISourceCodeListeners(uiSourceCode);this.dispatchEventToListeners(Events$1.EditorClosed,uiSourceCode);if(userGesture){this._editorClosedByUserAction(uiSourceCode);}}
_tabSelected(event){const tabId=(event.data.tabId);const userGesture=(event.data.isUserGesture);const uiSourceCode=this._files[tabId];this._innerShowFile(uiSourceCode,userGesture);}
_addUISourceCodeListeners(uiSourceCode){uiSourceCode.addEventListener(UISourceCode.Events.TitleChanged,this._uiSourceCodeTitleChanged,this);uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._uiSourceCodeWorkingCopyChanged,this);uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._uiSourceCodeWorkingCopyCommitted,this);}
_removeUISourceCodeListeners(uiSourceCode){uiSourceCode.removeEventListener(UISourceCode.Events.TitleChanged,this._uiSourceCodeTitleChanged,this);uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyChanged,this._uiSourceCodeWorkingCopyChanged,this);uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyCommitted,this._uiSourceCodeWorkingCopyCommitted,this);}
_updateFileTitle(uiSourceCode){const tabId=this._tabIds.get(uiSourceCode);if(tabId){const title=this._titleForFile(uiSourceCode);const tooltip=this._tooltipForFile(uiSourceCode);this._tabbedPane.changeTabTitle(tabId,title,tooltip);let icon=null;if(uiSourceCode.loadError()){icon=Icon.Icon.create('smallicon-error');icon.title=ls`Unable to load this content.`;}else if(self.Persistence.persistence.hasUnsavedCommittedChanges(uiSourceCode)){icon=Icon.Icon.create('smallicon-warning');icon.title=UIString.UIString('Changes to this file were not saved to file system.');}else{icon=PersistenceUtils.PersistenceUtils.iconForUISourceCode(uiSourceCode);}
this._tabbedPane.setTabIcon(tabId,icon);}}
_uiSourceCodeTitleChanged(event){const uiSourceCode=(event.data);this._updateFileTitle(uiSourceCode);this._updateHistory();}
_uiSourceCodeWorkingCopyChanged(event){const uiSourceCode=(event.data);this._updateFileTitle(uiSourceCode);}
_uiSourceCodeWorkingCopyCommitted(event){const uiSourceCode=(event.data.uiSourceCode);this._updateFileTitle(uiSourceCode);}
_generateTabId(){return'tab_'+(tabId++);}
currentFile(){return this._currentFile||null;}}
const Events$1={EditorSelected:Symbol('EditorSelected'),EditorClosed:Symbol('EditorClosed')};let tabId=0;const maximalPreviouslyViewedFilesCount=30;class HistoryItem{constructor(url,selectionRange,scrollLineNumber){this.url=url;this._isSerializable=url.length<HistoryItem.serializableUrlLengthLimit;this.selectionRange=selectionRange;this.scrollLineNumber=scrollLineNumber;}
static fromObject(serializedHistoryItem){const selectionRange=serializedHistoryItem.selectionRange?TextRange.TextRange.fromObject(serializedHistoryItem.selectionRange):undefined;return new HistoryItem(serializedHistoryItem.url,selectionRange,serializedHistoryItem.scrollLineNumber);}
serializeToObject(){if(!this._isSerializable){return null;}
const serializedHistoryItem={};serializedHistoryItem.url=this.url;serializedHistoryItem.selectionRange=this.selectionRange;serializedHistoryItem.scrollLineNumber=this.scrollLineNumber;return serializedHistoryItem;}}
HistoryItem.serializableUrlLengthLimit=4096;class History{constructor(items){this._items=items;this._rebuildItemIndex();}
static fromObject(serializedHistory){const items=[];for(let i=0;i<serializedHistory.length;++i){items.push(HistoryItem.fromObject(serializedHistory[i]));}
return new History(items);}
index(url){return this._itemsIndex.has(url)?(this._itemsIndex.get(url)):-1;}
_rebuildItemIndex(){this._itemsIndex=new Map();for(let i=0;i<this._items.length;++i){console.assert(!this._itemsIndex.has(this._items[i].url));this._itemsIndex.set(this._items[i].url,i);}}
selectionRange(url){const index=this.index(url);return index!==-1?this._items[index].selectionRange:undefined;}
updateSelectionRange(url,selectionRange){if(!selectionRange){return;}
const index=this.index(url);if(index===-1){return;}
this._items[index].selectionRange=selectionRange;}
scrollLineNumber(url){const index=this.index(url);return index!==-1?this._items[index].scrollLineNumber:undefined;}
updateScrollLineNumber(url,scrollLineNumber){const index=this.index(url);if(index===-1){return;}
this._items[index].scrollLineNumber=scrollLineNumber;}
update(urls){for(let i=urls.length-1;i>=0;--i){const index=this.index(urls[i]);let item;if(index!==-1){item=this._items[index];this._items.splice(index,1);}else{item=new HistoryItem(urls[i]);}
this._items.unshift(item);this._rebuildItemIndex();}}
remove(url){const index=this.index(url);if(index!==-1){this._items.splice(index,1);this._rebuildItemIndex();}}
save(setting){setting.set(this._serializeToObject());}
_serializeToObject(){const serializedHistory=[];for(let i=0;i<this._items.length;++i){const serializedItem=this._items[i].serializeToObject();if(serializedItem){serializedHistory.push(serializedItem);}
if(serializedHistory.length===maximalPreviouslyViewedFilesCount){break;}}
return serializedHistory;}
_urls(){const result=[];for(let i=0;i<this._items.length;++i){result.push(this._items[i].url);}
return result;}}
class EditorContainerTabDelegate{constructor(editorContainer){this._editorContainer=editorContainer;}
closeTabs(tabbedPane,ids){this._editorContainer._closeTabs(ids);}
onContextMenu(tabId,contextMenu){this._editorContainer._onContextMenu(tabId,contextMenu);}}
var TabbedEditorContainer$1=Object.freeze({__proto__:null,TabbedEditorContainerDelegate:TabbedEditorContainerDelegate,TabbedEditorContainer:TabbedEditorContainer,Events:Events$1,get tabId(){return tabId;},maximalPreviouslyViewedFilesCount:maximalPreviouslyViewedFilesCount,HistoryItem:HistoryItem,History:History,EditorContainerTabDelegate:EditorContainerTabDelegate});class SourcesView extends Widget.VBox{constructor(){super();this.registerRequiredCSS('sources/sourcesView.css');this.element.id='sources-panel-sources-view';this.setMinimumAndPreferredSizes(88,52,150,100);const workspace=Workspace.WorkspaceImpl.instance();this._searchableView=new SearchableView.SearchableView(this,'sourcesViewSearchConfig');this._searchableView.setMinimalSearchQuerySize(0);this._searchableView.show(this.element);this._sourceViewByUISourceCode=new Map();this._editorContainer=new TabbedEditorContainer(this,Settings.Settings.instance().createLocalSetting('previouslyViewedFiles',[]),this._placeholderElement(),this._focusedPlaceholderElement);this._editorContainer.show(this._searchableView.element);this._editorContainer.addEventListener(Events$1.EditorSelected,this._editorSelected,this);this._editorContainer.addEventListener(Events$1.EditorClosed,this._editorClosed,this);this._historyManager=new EditingLocationHistoryManager(this,this.currentSourceFrame.bind(this));this._toolbarContainerElement=this.element.createChild('div','sources-toolbar');if(!Root.Runtime.experiments.isEnabled('sourcesPrettyPrint')){this._toolbarEditorActions=new Toolbar.Toolbar('',this._toolbarContainerElement);self.runtime.allInstances(EditorAction).then(appendButtonsForExtensions.bind(this));}
function appendButtonsForExtensions(actions){for(let i=0;i<actions.length;++i){this._toolbarEditorActions.appendToolbarItem(actions[i].button(this));}}
this._scriptViewToolbar=new Toolbar.Toolbar('',this._toolbarContainerElement);this._scriptViewToolbar.element.style.flex='auto';this._bottomToolbar=new Toolbar.Toolbar('',this._toolbarContainerElement);this._toolbarChangedListener=null;UIUtils.startBatchUpdate();workspace.uiSourceCodes().forEach(this._addUISourceCode.bind(this));UIUtils.endBatchUpdate();workspace.addEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);workspace.addEventListener(Workspace.Events.UISourceCodeRemoved,this._uiSourceCodeRemoved,this);workspace.addEventListener(Workspace.Events.ProjectRemoved,this._projectRemoved.bind(this),this);function handleBeforeUnload(event){if(event.returnValue){return;}
let unsavedSourceCodes=[];const projects=Workspace.WorkspaceImpl.instance().projectsForType(Workspace.projectTypes.FileSystem);for(let i=0;i<projects.length;++i){unsavedSourceCodes=unsavedSourceCodes.concat(projects[i].uiSourceCodes().filter(sourceCode=>sourceCode.isDirty()));}
if(!unsavedSourceCodes.length){return;}
event.returnValue=UIString.UIString('DevTools have unsaved changes that will be permanently lost.');ViewManager.ViewManager.instance().showView('sources');for(let i=0;i<unsavedSourceCodes.length;++i){Revealer.reveal(unsavedSourceCodes[i]);}}
if(!window.opener){window.addEventListener('beforeunload',handleBeforeUnload,true);}
this._shortcuts={};this.element.addEventListener('keydown',this._handleKeyDown.bind(this),false);}
_placeholderElement(){this._placeholderOptionArray=[];const shortcuts=[{actionId:'quickOpen.show',description:ls`Open file`},{actionId:'commandMenu.show',description:ls`Run command`},{actionId:'sources.add-folder-to-workspace',description:ls`Drop in a folder to add to workspace`}];const element=createElementWithClass('div');const list=element.createChild('div','tabbed-pane-placeholder');list.addEventListener('keydown',this._placeholderOnKeyDown.bind(this),false);ARIAUtils.markAsList(list);ARIAUtils.setAccessibleName(list,ls`Source View Actions`);for(let i=0;i<shortcuts.length;i++){const shortcut=shortcuts[i];const shortcutKeyText=self.UI.shortcutRegistry.shortcutTitleForAction(shortcut.actionId);const listItemElement=list.createChild('div');ARIAUtils.markAsListitem(listItemElement);const row=listItemElement.createChild('div','tabbed-pane-placeholder-row');row.tabIndex=-1;ARIAUtils.markAsButton(row);if(shortcutKeyText){row.createChild('div','tabbed-pane-placeholder-key').textContent=shortcutKeyText;row.createChild('div','tabbed-pane-placeholder-value').textContent=shortcut.description;}else{row.createChild('div','tabbed-pane-no-shortcut').textContent=shortcut.description;}
const action=self.UI.actionRegistry.action(shortcut.actionId);const actionHandler=action.execute.bind(action);this._placeholderOptionArray.push({element:row,handler:actionHandler});}
const firstElement=this._placeholderOptionArray[0].element;firstElement.tabIndex=0;this._focusedPlaceholderElement=firstElement;this._selectedIndex=0;element.appendChild(XLink.XLink.create('https://developers.google.com/web/tools/chrome-devtools/sources?utm_source=devtools&utm_campaign=2018Q1','Learn more'));return element;}
_placeholderOnKeyDown(event){if(isEnterOrSpaceKey(event)){this._placeholderOptionArray[this._selectedIndex].handler.call();return;}
let offset=0;if(event.key==='ArrowDown'){offset=1;}else if(event.key==='ArrowUp'){offset=-1;}
const newIndex=Math.max(Math.min(this._placeholderOptionArray.length-1,this._selectedIndex+offset),0);const newElement=this._placeholderOptionArray[newIndex].element;const oldElement=this._placeholderOptionArray[this._selectedIndex].element;if(newElement!==oldElement){oldElement.tabIndex=-1;newElement.tabIndex=0;ARIAUtils.setSelected(oldElement,false);ARIAUtils.setSelected(newElement,true);this._selectedIndex=newIndex;newElement.focus();}}
_resetPlaceholderState(){this._placeholderOptionArray[this._selectedIndex].element.tabIndex=-1;this._placeholderOptionArray[0].element.tabIndex=0;this._selectedIndex=0;}
static defaultUISourceCodeScores(){const defaultScores=new Map();const sourcesView=self.UI.context.flavor(SourcesView);if(sourcesView){const uiSourceCodes=sourcesView._editorContainer.historyUISourceCodes();for(let i=1;i<uiSourceCodes.length;++i)
{defaultScores.set(uiSourceCodes[i],uiSourceCodes.length-i);}}
return defaultScores;}
leftToolbar(){return this._editorContainer.leftToolbar();}
rightToolbar(){return this._editorContainer.rightToolbar();}
bottomToolbar(){return this._bottomToolbar;}
_registerShortcuts(keys,handler){for(let i=0;i<keys.length;++i){this._shortcuts[keys[i].key]=handler;}}
_handleKeyDown(event){const shortcutKey=KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent(event);const handler=this._shortcuts[shortcutKey];if(handler&&handler()){event.consume(true);}}
wasShown(){super.wasShown();self.UI.context.setFlavor(SourcesView,this);}
willHide(){self.UI.context.setFlavor(SourcesView,null);this._resetPlaceholderState();super.willHide();}
toolbarContainerElement(){return this._toolbarContainerElement;}
searchableView(){return this._searchableView;}
visibleView(){return this._editorContainer.visibleView;}
currentSourceFrame(){const view=this.visibleView();if(!(view instanceof UISourceCodeFrame)){return null;}
return((view));}
currentUISourceCode(){return this._editorContainer.currentFile();}
_onCloseEditorTab(){const uiSourceCode=this._editorContainer.currentFile();if(!uiSourceCode){return false;}
this._editorContainer.closeFile(uiSourceCode);return true;}
_onJumpToPreviousLocation(){this._historyManager.rollback();}
_onJumpToNextLocation(){this._historyManager.rollover();}
_uiSourceCodeAdded(event){const uiSourceCode=(event.data);this._addUISourceCode(uiSourceCode);}
_addUISourceCode(uiSourceCode){if(uiSourceCode.project().isServiceProject()){return;}
if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem&&FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(uiSourceCode.project())==='overrides'){return;}
this._editorContainer.addUISourceCode(uiSourceCode);}
_uiSourceCodeRemoved(event){const uiSourceCode=(event.data);this._removeUISourceCodes([uiSourceCode]);}
_removeUISourceCodes(uiSourceCodes){this._editorContainer.removeUISourceCodes(uiSourceCodes);for(let i=0;i<uiSourceCodes.length;++i){this._removeSourceFrame(uiSourceCodes[i]);this._historyManager.removeHistoryForSourceCode(uiSourceCodes[i]);}}
_projectRemoved(event){const project=event.data;const uiSourceCodes=project.uiSourceCodes();this._removeUISourceCodes(uiSourceCodes);}
_updateScriptViewToolbarItems(){this._scriptViewToolbar.removeToolbarItems();const view=this.visibleView();if(view instanceof View.SimpleView){((view)).toolbarItems().then(items=>{items.map(item=>this._scriptViewToolbar.appendToolbarItem(item));});}}
showSourceLocation(uiSourceCode,lineNumber,columnNumber,omitFocus,omitHighlight){this._historyManager.updateCurrentState();this._editorContainer.showFile(uiSourceCode);const currentSourceFrame=this.currentSourceFrame();if(currentSourceFrame&&typeof lineNumber==='number'){currentSourceFrame.revealPosition(lineNumber,columnNumber,!omitHighlight);}
this._historyManager.pushNewState();if(!omitFocus){this.visibleView().focus();}}
_createSourceView(uiSourceCode){let sourceFrame;let sourceView;const contentType=uiSourceCode.contentType();if(contentType===ResourceType.resourceTypes.Image){sourceView=new ImageView.ImageView(uiSourceCode.mimeType(),uiSourceCode);}else if(contentType===ResourceType.resourceTypes.Font){sourceView=new FontView.FontView(uiSourceCode.mimeType(),uiSourceCode);}else{sourceFrame=new UISourceCodeFrame(uiSourceCode);}
if(sourceFrame){this._historyManager.trackSourceFrameCursorJumps(sourceFrame);}
const widget=(sourceFrame||sourceView);this._sourceViewByUISourceCode.set(uiSourceCode,widget);return widget;}
_getOrCreateSourceView(uiSourceCode){return this._sourceViewByUISourceCode.get(uiSourceCode)||this._createSourceView(uiSourceCode);}
recycleUISourceCodeFrame(sourceFrame,uiSourceCode){this._sourceViewByUISourceCode.delete(sourceFrame.uiSourceCode());sourceFrame.setUISourceCode(uiSourceCode);this._sourceViewByUISourceCode.set(uiSourceCode,sourceFrame);}
viewForFile(uiSourceCode){return this._getOrCreateSourceView(uiSourceCode);}
_removeSourceFrame(uiSourceCode){const sourceView=this._sourceViewByUISourceCode.get(uiSourceCode);this._sourceViewByUISourceCode.delete(uiSourceCode);if(sourceView&&sourceView instanceof UISourceCodeFrame){(sourceView).dispose();}}
_editorClosed(event){const uiSourceCode=(event.data);this._historyManager.removeHistoryForSourceCode(uiSourceCode);let wasSelected=false;if(!this._editorContainer.currentFile()){wasSelected=true;}
this._removeToolbarChangedListener();this._updateScriptViewToolbarItems();this._searchableView.resetSearch();const data={};data.uiSourceCode=uiSourceCode;data.wasSelected=wasSelected;this.dispatchEventToListeners(Events$2.EditorClosed,data);}
_editorSelected(event){const previousSourceFrame=event.data.previousView instanceof UISourceCodeFrame?event.data.previousView:null;if(previousSourceFrame){previousSourceFrame.setSearchableView(null);}
const currentSourceFrame=event.data.currentView instanceof UISourceCodeFrame?event.data.currentView:null;if(currentSourceFrame){currentSourceFrame.setSearchableView(this._searchableView);}
this._searchableView.setReplaceable(!!currentSourceFrame&&currentSourceFrame.canEditSource());this._searchableView.refreshSearch();this._updateToolbarChangedListener();this._updateScriptViewToolbarItems();this.dispatchEventToListeners(Events$2.EditorSelected,this._editorContainer.currentFile());}
_removeToolbarChangedListener(){if(this._toolbarChangedListener){EventTarget.EventTarget.removeEventListeners([this._toolbarChangedListener]);}
this._toolbarChangedListener=null;}
_updateToolbarChangedListener(){this._removeToolbarChangedListener();const sourceFrame=this.currentSourceFrame();if(!sourceFrame){return;}
this._toolbarChangedListener=sourceFrame.addEventListener(Events.ToolbarItemsChanged,this._updateScriptViewToolbarItems,this);}
searchCanceled(){if(this._searchView){this._searchView.searchCanceled();}
delete this._searchView;delete this._searchConfig;}
performSearch(searchConfig,shouldJump,jumpBackwards){const sourceFrame=this.currentSourceFrame();if(!sourceFrame){return;}
this._searchView=sourceFrame;this._searchConfig=searchConfig;this._searchView.performSearch(this._searchConfig,shouldJump,jumpBackwards);}
jumpToNextSearchResult(){if(!this._searchView){return;}
if(this._searchView!==this.currentSourceFrame()){this.performSearch(this._searchConfig,true);return;}
this._searchView.jumpToNextSearchResult();}
jumpToPreviousSearchResult(){if(!this._searchView){return;}
if(this._searchView!==this.currentSourceFrame()){this.performSearch(this._searchConfig,true);if(this._searchView){this._searchView.jumpToLastSearchResult();}
return;}
this._searchView.jumpToPreviousSearchResult();}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return true;}
replaceSelectionWith(searchConfig,replacement){const sourceFrame=this.currentSourceFrame();if(!sourceFrame){console.assert(sourceFrame);return;}
sourceFrame.replaceSelectionWith(searchConfig,replacement);}
replaceAllWith(searchConfig,replacement){const sourceFrame=this.currentSourceFrame();if(!sourceFrame){console.assert(sourceFrame);return;}
sourceFrame.replaceAllWith(searchConfig,replacement);}
_showOutlineQuickOpen(){QuickOpen.QuickOpenImpl.show('@');}
_showGoToLineQuickOpen(){if(this._editorContainer.currentFile()){QuickOpen.QuickOpenImpl.show(':');}}
_save(){this._saveSourceFrame(this.currentSourceFrame());}
_saveAll(){const sourceFrames=this._editorContainer.fileViews();sourceFrames.forEach(this._saveSourceFrame.bind(this));}
_saveSourceFrame(sourceFrame){if(!(sourceFrame instanceof UISourceCodeFrame)){return;}
const uiSourceCodeFrame=(sourceFrame);uiSourceCodeFrame.commitEditing();}
toggleBreakpointsActiveState(active){this._editorContainer.view.element.classList.toggle('breakpoints-deactivated',!active);}}
const Events$2={EditorClosed:Symbol('EditorClosed'),EditorSelected:Symbol('EditorSelected'),};class EditorAction{button(sourcesView){}}
class SwitchFileActionDelegate{static _nextFile(currentUISourceCode){function fileNamePrefix(name){const lastDotIndex=name.lastIndexOf('.');const namePrefix=name.substr(0,lastDotIndex!==-1?lastDotIndex:name.length);return namePrefix.toLowerCase();}
const uiSourceCodes=currentUISourceCode.project().uiSourceCodes();const candidates=[];const url=currentUISourceCode.parentURL();const name=currentUISourceCode.name();const namePrefix=fileNamePrefix(name);for(let i=0;i<uiSourceCodes.length;++i){const uiSourceCode=uiSourceCodes[i];if(url!==uiSourceCode.parentURL()){continue;}
if(fileNamePrefix(uiSourceCode.name())===namePrefix){candidates.push(uiSourceCode.name());}}
candidates.sort(String.naturalOrderComparator);const index=NumberUtilities.mod(candidates.indexOf(name)+1,candidates.length);const fullURL=(url?url+'/':'')+candidates[index];const nextUISourceCode=currentUISourceCode.project().uiSourceCodeForURL(fullURL);return nextUISourceCode!==currentUISourceCode?nextUISourceCode:null;}
handleAction(context,actionId){const sourcesView=self.UI.context.flavor(SourcesView);const currentUISourceCode=sourcesView.currentUISourceCode();if(!currentUISourceCode){return false;}
const nextUISourceCode=SwitchFileActionDelegate._nextFile(currentUISourceCode);if(!nextUISourceCode){return false;}
sourcesView.showSourceLocation(nextUISourceCode);return true;}}
class ActionDelegate$2{handleAction(context,actionId){const sourcesView=self.UI.context.flavor(SourcesView);if(!sourcesView){return false;}
switch(actionId){case'sources.close-all':sourcesView._editorContainer.closeAllFiles();return true;case'sources.jump-to-previous-location':sourcesView._onJumpToPreviousLocation();return true;case'sources.jump-to-next-location':sourcesView._onJumpToNextLocation();return true;case'sources.close-editor-tab':return sourcesView._onCloseEditorTab();case'sources.go-to-line':sourcesView._showGoToLineQuickOpen();return true;case'sources.go-to-member':sourcesView._showOutlineQuickOpen();return true;case'sources.save':sourcesView._save();return true;case'sources.save-all':sourcesView._saveAll();return true;}
return false;}}
var SourcesView$1=Object.freeze({__proto__:null,SourcesView:SourcesView,Events:Events$2,EditorAction:EditorAction,SwitchFileActionDelegate:SwitchFileActionDelegate,ActionDelegate:ActionDelegate$2});class ThreadsSidebarPane extends Widget.VBox{constructor(){super(true);this.registerRequiredCSS('sources/threadsSidebarPane.css');this._items=new ListModel.ListModel();this._list=new ListControl.ListControl(this._items,this,ListControl.ListMode.NonViewport);const currentTarget=self.UI.context.flavor(SDKModel.Target);this._selectedModel=!!currentTarget?currentTarget.model(DebuggerModel.DebuggerModel):null;this.contentElement.appendChild(this._list.element);self.UI.context.addFlavorChangeListener(SDKModel.Target,this._targetFlavorChanged,this);SDKModel.TargetManager.instance().observeModels(DebuggerModel.DebuggerModel,this);}
static shouldBeShown(){return SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel).length>=2;}
createElementForItem(debuggerModel){const element=createElementWithClass('div','thread-item');const title=element.createChild('div','thread-item-title');const pausedState=element.createChild('div','thread-item-paused-state');element.appendChild(Icon.Icon.create('smallicon-thick-right-arrow','selected-thread-icon'));element.tabIndex=-1;self.onInvokeElement(element,event=>{self.UI.context.setFlavor(SDKModel.Target,debuggerModel.target());event.consume(true);});const isSelected=self.UI.context.flavor(SDKModel.Target)===debuggerModel.target();element.classList.toggle('selected',isSelected);ARIAUtils.setSelected(element,isSelected);function updateTitle(){const executionContext=debuggerModel.runtimeModel().defaultExecutionContext();title.textContent=executionContext&&executionContext.label()?executionContext.label():debuggerModel.target().name();}
function updatePausedState(){pausedState.textContent=debuggerModel.isPaused()?ls`paused`:'';}
function targetNameChanged(event){const target=(event.data);if(target===debuggerModel.target()){updateTitle();}}
debuggerModel.addEventListener(DebuggerModel.Events.DebuggerPaused,updatePausedState);debuggerModel.addEventListener(DebuggerModel.Events.DebuggerResumed,updatePausedState);debuggerModel.runtimeModel().addEventListener(RuntimeModel.Events.ExecutionContextChanged,updateTitle);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.NameChanged,targetNameChanged);updatePausedState();updateTitle();return element;}
heightForItem(debuggerModel){console.assert(false);return 0;}
isItemSelectable(debuggerModel){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.tabIndex=-1;}
if(toElement){this.setDefaultFocusedElement(toElement);toElement.tabIndex=0;if(this.hasFocus()){toElement.focus();}}}
updateSelectedItemARIA(fromElement,toElement){return false;}
modelAdded(debuggerModel){this._items.insert(this._items.length,debuggerModel);const currentTarget=self.UI.context.flavor(SDKModel.Target);if(currentTarget===debuggerModel.target()){this._list.selectItem(debuggerModel);}}
modelRemoved(debuggerModel){this._items.remove(this._items.indexOf(debuggerModel));}
_targetFlavorChanged(event){const hadFocus=this.hasFocus();const target=(event.data);const debuggerModel=target.model(DebuggerModel.DebuggerModel);if(debuggerModel){this._list.refreshItem(debuggerModel);}
if(!!this._selectedModel){this._list.refreshItem(this._selectedModel);}
this._selectedModel=debuggerModel;if(hadFocus){this.focus();}}}
var ThreadsSidebarPane$1=Object.freeze({__proto__:null,ThreadsSidebarPane:ThreadsSidebarPane});class SourcesPanel extends Panel.Panel{constructor(){super('sources');SourcesPanel._instance=this;this.registerRequiredCSS('sources/sourcesPanel.css');new DropTarget.DropTarget(this.element,[DropTarget.Type.Folder],UIString.UIString('Drop workspace folder here'),this._handleDrop.bind(this));this._workspace=Workspace.WorkspaceImpl.instance();this._togglePauseAction=(self.UI.actionRegistry.action('debugger.toggle-pause'));this._stepOverAction=(self.UI.actionRegistry.action('debugger.step-over'));this._stepIntoAction=(self.UI.actionRegistry.action('debugger.step-into'));this._stepOutAction=(self.UI.actionRegistry.action('debugger.step-out'));this._stepAction=(self.UI.actionRegistry.action('debugger.step'));this._toggleBreakpointsActiveAction=(self.UI.actionRegistry.action('debugger.toggle-breakpoints-active'));this._debugToolbar=this._createDebugToolbar();this._debugToolbarDrawer=this._createDebugToolbarDrawer();this._debuggerPausedMessage=new DebuggerPausedMessage();const initialDebugSidebarWidth=225;this._splitWidget=new SplitWidget.SplitWidget(true,true,'sourcesPanelSplitViewState',initialDebugSidebarWidth);this._splitWidget.enableShowModeSaving();this._splitWidget.show(this.element);const initialNavigatorWidth=225;this.editorView=new SplitWidget.SplitWidget(true,false,'sourcesPanelNavigatorSplitViewState',initialNavigatorWidth);this.editorView.enableShowModeSaving();this._splitWidget.setMainWidget(this.editorView);this._navigatorTabbedLocation=ViewManager.ViewManager.instance().createTabbedLocation(this._revealNavigatorSidebar.bind(this),'navigator-view',true);const tabbedPane=this._navigatorTabbedLocation.tabbedPane();tabbedPane.setMinimumSize(100,25);tabbedPane.element.classList.add('navigator-tabbed-pane');const navigatorMenuButton=new Toolbar.ToolbarMenuButton(this._populateNavigatorMenu.bind(this),true);navigatorMenuButton.setTitle(UIString.UIString('More options'));tabbedPane.rightToolbar().appendToolbarItem(navigatorMenuButton);if(ViewManager.ViewManager.instance().hasViewsForLocation('run-view-sidebar')){const navigatorSplitWidget=new SplitWidget.SplitWidget(false,true,'sourcePanelNavigatorSidebarSplitViewState');navigatorSplitWidget.setMainWidget(tabbedPane);const runViewTabbedPane=ViewManager.ViewManager.instance().createTabbedLocation(this._revealNavigatorSidebar.bind(this),'run-view-sidebar').tabbedPane();navigatorSplitWidget.setSidebarWidget(runViewTabbedPane);navigatorSplitWidget.installResizer(runViewTabbedPane.headerElement());this.editorView.setSidebarWidget(navigatorSplitWidget);}else{this.editorView.setSidebarWidget(tabbedPane);}
this._sourcesView=new SourcesView();this._sourcesView.addEventListener(Events$2.EditorSelected,this._editorSelected.bind(this));this._toggleNavigatorSidebarButton=this.editorView.createShowHideSidebarButton(ls`navigator`);this._toggleDebuggerSidebarButton=this._splitWidget.createShowHideSidebarButton(ls`debugger`);this.editorView.setMainWidget(this._sourcesView);this._threadsSidebarPane=null;this._watchSidebarPane=(ViewManager.ViewManager.instance().view('sources.watch'));this._callstackPane=self.runtime.sharedInstance(CallStackSidebarPane);Settings.Settings.instance().moduleSetting('sidebarPosition').addChangeListener(this._updateSidebarPosition.bind(this));this._updateSidebarPosition();this._updateDebuggerButtonsAndStatus();this._pauseOnExceptionEnabledChanged();Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').addChangeListener(this._pauseOnExceptionEnabledChanged,this);this._liveLocationPool=new LiveLocation.LiveLocationPool();this._setTarget(self.UI.context.flavor(SDKModel.Target));Settings.Settings.instance().moduleSetting('breakpointsActive').addChangeListener(this._breakpointsActiveStateChanged,this);self.UI.context.addFlavorChangeListener(SDKModel.Target,this._onCurrentTargetChanged,this);self.UI.context.addFlavorChangeListener(DebuggerModel.CallFrame,this._callFrameChanged,this);SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerWasEnabled,this._debuggerWasEnabled,this);SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerPaused,this._debuggerPaused,this);SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerResumed,event=>this._debuggerResumed((event.data)));SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.GlobalObjectCleared,event=>this._debuggerResumed((event.data)));self.Extensions.extensionServer.addEventListener(ExtensionServer.Events.SidebarPaneAdded,this._extensionSidebarPaneAdded,this);SDKModel.TargetManager.instance().observeTargets(this);}
static instance(){if(SourcesPanel._instance){return SourcesPanel._instance;}
return(self.runtime.sharedInstance(SourcesPanel));}
static updateResizerAndSidebarButtons(panel){panel._sourcesView.leftToolbar().removeToolbarItems();panel._sourcesView.rightToolbar().removeToolbarItems();panel._sourcesView.bottomToolbar().removeToolbarItems();const isInWrapper=WrapperView.isShowing()&&!self.UI.inspectorView.isDrawerMinimized();if(panel._splitWidget.isVertical()||isInWrapper){panel._splitWidget.uninstallResizer(panel._sourcesView.toolbarContainerElement());}else{panel._splitWidget.installResizer(panel._sourcesView.toolbarContainerElement());}
if(!isInWrapper){panel._sourcesView.leftToolbar().appendToolbarItem(panel._toggleNavigatorSidebarButton);if(panel._splitWidget.isVertical()){panel._sourcesView.rightToolbar().appendToolbarItem(panel._toggleDebuggerSidebarButton);}else{panel._sourcesView.bottomToolbar().appendToolbarItem(panel._toggleDebuggerSidebarButton);}}}
targetAdded(target){this._showThreadsIfNeeded();}
targetRemoved(target){}
_showThreadsIfNeeded(){if(ThreadsSidebarPane.shouldBeShown()&&!this._threadsSidebarPane){this._threadsSidebarPane=(ViewManager.ViewManager.instance().view('sources.threads'));if(this._sidebarPaneStack&&this._threadsSidebarPane){this._sidebarPaneStack.showView(this._threadsSidebarPane,this._splitWidget.isVertical()?this._watchSidebarPane:this._callstackPane);}}}
_setTarget(target){if(!target){return;}
const debuggerModel=target.model(DebuggerModel.DebuggerModel);if(!debuggerModel){return;}
if(debuggerModel.isPaused()){this._showDebuggerPausedDetails((debuggerModel.debuggerPausedDetails()));}else{this._paused=false;this._clearInterface();this._toggleDebuggerSidebarButton.setEnabled(true);}}
_onCurrentTargetChanged(event){const target=(event.data);this._setTarget(target);}
paused(){return this._paused;}
wasShown(){self.UI.context.setFlavor(SourcesPanel,this);super.wasShown();const wrapper=WrapperView._instance;if(wrapper&&wrapper.isShowing()){self.UI.inspectorView.setDrawerMinimized(true);SourcesPanel.updateResizerAndSidebarButtons(this);}
this.editorView.setMainWidget(this._sourcesView);}
willHide(){super.willHide();self.UI.context.setFlavor(SourcesPanel,null);if(WrapperView.isShowing()){WrapperView._instance._showViewInWrapper();self.UI.inspectorView.setDrawerMinimized(false);SourcesPanel.updateResizerAndSidebarButtons(this);}}
resolveLocation(locationName){if(locationName==='sources.sidebar-top'||locationName==='sources.sidebar-bottom'||locationName==='sources.sidebar-tabs'){return this._sidebarPaneStack;}
return this._navigatorTabbedLocation;}
_ensureSourcesViewVisible(){if(WrapperView.isShowing()){return true;}
if(!self.UI.inspectorView.canSelectPanel('sources')){return false;}
ViewManager.ViewManager.instance().showView('sources');return true;}
onResize(){if(Settings.Settings.instance().moduleSetting('sidebarPosition').get()==='auto'){this.element.window().requestAnimationFrame(this._updateSidebarPosition.bind(this));}}
searchableView(){return this._sourcesView.searchableView();}
_debuggerPaused(event){const debuggerModel=(event.data);const details=debuggerModel.debuggerPausedDetails();if(!this._paused){this._setAsCurrentPanel();}
if(self.UI.context.flavor(SDKModel.Target)===debuggerModel.target()){this._showDebuggerPausedDetails((details));}else if(!this._paused){self.UI.context.setFlavor(SDKModel.Target,debuggerModel.target());}}
_showDebuggerPausedDetails(details){this._paused=true;this._updateDebuggerButtonsAndStatus();self.UI.context.setFlavor(DebuggerModel.DebuggerPausedDetails,details);this._toggleDebuggerSidebarButton.setEnabled(false);this._revealDebuggerSidebar();window.focus();InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();}
_debuggerResumed(debuggerModel){const target=debuggerModel.target();if(self.UI.context.flavor(SDKModel.Target)!==target){return;}
this._paused=false;this._clearInterface();this._toggleDebuggerSidebarButton.setEnabled(true);this._switchToPausedTargetTimeout=setTimeout(this._switchToPausedTarget.bind(this,debuggerModel),500);}
_debuggerWasEnabled(event){const debuggerModel=(event.data);if(self.UI.context.flavor(SDKModel.Target)!==debuggerModel.target()){return;}
this._updateDebuggerButtonsAndStatus();}
get visibleView(){return this._sourcesView.visibleView();}
showUISourceCode(uiSourceCode,lineNumber,columnNumber,omitFocus){if(omitFocus){const wrapperShowing=WrapperView._instance&&WrapperView._instance.isShowing();if(!this.isShowing()&&!wrapperShowing){return;}}else{this._showEditor();}
this._sourcesView.showSourceLocation(uiSourceCode,lineNumber,columnNumber,omitFocus);}
_showEditor(){if(WrapperView._instance&&WrapperView._instance.isShowing()){return;}
this._setAsCurrentPanel();}
showUILocation(uiLocation,omitFocus){this.showUISourceCode(uiLocation.uiSourceCode,uiLocation.lineNumber,uiLocation.columnNumber,omitFocus);}
_revealInNavigator(uiSourceCode,skipReveal){const extensions=self.runtime.extensions(NavigatorView);Promise.all(extensions.map(extension=>extension.instance())).then(filterNavigators.bind(this));function filterNavigators(objects){for(let i=0;i<objects.length;++i){const navigatorView=(objects[i]);const viewId=extensions[i].descriptor()['viewId'];if(navigatorView.acceptProject(uiSourceCode.project())){navigatorView.revealUISourceCode(uiSourceCode,true);if(skipReveal){this._navigatorTabbedLocation.tabbedPane().selectTab(viewId);}else{ViewManager.ViewManager.instance().showView(viewId);}}}}}
_populateNavigatorMenu(contextMenu){const groupByFolderSetting=Settings.Settings.instance().moduleSetting('navigatorGroupByFolder');contextMenu.appendItemsAtLocation('navigatorMenu');contextMenu.viewSection().appendCheckboxItem(UIString.UIString('Group by folder'),()=>groupByFolderSetting.set(!groupByFolderSetting.get()),groupByFolderSetting.get());}
setIgnoreExecutionLineEvents(ignoreExecutionLineEvents){this._ignoreExecutionLineEvents=ignoreExecutionLineEvents;}
updateLastModificationTime(){this._lastModificationTime=window.performance.now();}
async _executionLineChanged(liveLocation){const uiLocation=await liveLocation.uiLocation();if(!uiLocation){return;}
if(window.performance.now()-this._lastModificationTime<lastModificationTimeout){return;}
this._sourcesView.showSourceLocation(uiLocation.uiSourceCode,uiLocation.lineNumber,uiLocation.columnNumber,undefined,true);}
_lastModificationTimeoutPassedForTest(){lastModificationTimeout=Number.MIN_VALUE;}
_updateLastModificationTimeForTest(){lastModificationTimeout=Number.MAX_VALUE;}
async _callFrameChanged(){const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(!callFrame){return;}
if(this._executionLineLocation){this._executionLineLocation.dispose();}
this._executionLineLocation=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createCallFrameLiveLocation(callFrame.location(),this._executionLineChanged.bind(this),this._liveLocationPool);}
_pauseOnExceptionEnabledChanged(){const enabled=Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').get();this._pauseOnExceptionButton.setToggled(enabled);this._pauseOnExceptionButton.setTitle(enabled?ls`Don't pause on exceptions`:ls`Pause on exceptions`);this._debugToolbarDrawer.classList.toggle('expanded',enabled);}
async _updateDebuggerButtonsAndStatus(){const currentTarget=self.UI.context.flavor(SDKModel.Target);const currentDebuggerModel=currentTarget?currentTarget.model(DebuggerModel.DebuggerModel):null;if(!currentDebuggerModel){this._togglePauseAction.setEnabled(false);this._stepOverAction.setEnabled(false);this._stepIntoAction.setEnabled(false);this._stepOutAction.setEnabled(false);this._stepAction.setEnabled(false);}else if(this._paused){this._togglePauseAction.setToggled(true);this._togglePauseAction.setEnabled(true);this._stepOverAction.setEnabled(true);this._stepIntoAction.setEnabled(true);this._stepOutAction.setEnabled(true);this._stepAction.setEnabled(true);}else{this._togglePauseAction.setToggled(false);this._togglePauseAction.setEnabled(!currentDebuggerModel.isPausing());this._stepOverAction.setEnabled(false);this._stepIntoAction.setEnabled(false);this._stepOutAction.setEnabled(false);this._stepAction.setEnabled(false);}
const details=currentDebuggerModel?currentDebuggerModel.debuggerPausedDetails():null;await this._debuggerPausedMessage.render(details,DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance(),BreakpointManager.BreakpointManager.instance());if(details){this._updateDebuggerButtonsAndStatusForTest();}}
_updateDebuggerButtonsAndStatusForTest(){}
_clearInterface(){this._updateDebuggerButtonsAndStatus();self.UI.context.setFlavor(DebuggerModel.DebuggerPausedDetails,null);if(this._switchToPausedTargetTimeout){clearTimeout(this._switchToPausedTargetTimeout);}
this._liveLocationPool.disposeAll();}
_switchToPausedTarget(debuggerModel){delete this._switchToPausedTargetTimeout;if(this._paused||debuggerModel.isPaused()){return;}
for(const debuggerModel of SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel)){if(debuggerModel.isPaused()){self.UI.context.setFlavor(SDKModel.Target,debuggerModel.target());break;}}}
_togglePauseOnExceptions(){Settings.Settings.instance().moduleSetting('pauseOnExceptionEnabled').set(!this._pauseOnExceptionButton.toggled());}
_runSnippet(){const uiSourceCode=this._sourcesView.currentUISourceCode();if(uiSourceCode){ScriptSnippetFileSystem.evaluateScriptSnippet(uiSourceCode);}}
_editorSelected(event){const uiSourceCode=(event.data);if(this.editorView.mainWidget()&&Settings.Settings.instance().moduleSetting('autoRevealInNavigator').get()){this._revealInNavigator(uiSourceCode,true);}}
_togglePause(){const target=self.UI.context.flavor(SDKModel.Target);if(!target){return true;}
const debuggerModel=target.model(DebuggerModel.DebuggerModel);if(!debuggerModel){return true;}
if(this._paused){this._paused=false;debuggerModel.resume();}else{debuggerModel.pause();}
this._clearInterface();return true;}
_prepareToResume(){if(!this._paused){return null;}
this._paused=false;this._clearInterface();const target=self.UI.context.flavor(SDKModel.Target);return target?target.model(DebuggerModel.DebuggerModel):null;}
_longResume(event){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.skipAllPausesUntilReloadOrTimeout(500);debuggerModel.resume();}}
_terminateExecution(event){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.runtimeModel().terminateExecution();debuggerModel.resume();}}
_stepOver(){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.stepOver();}
return true;}
_stepInto(){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.stepInto();}
return true;}
_stepIntoAsync(){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.scheduleStepIntoAsync();}
return true;}
_stepOut(){const debuggerModel=this._prepareToResume();if(debuggerModel){debuggerModel.stepOut();}
return true;}
async _continueToLocation(uiLocation){const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!executionContext){return;}
const rawLocations=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiLocation.uiSourceCode,uiLocation.lineNumber,0);const rawLocation=rawLocations.find(location=>location.debuggerModel===executionContext.debuggerModel);if(rawLocation&&this._prepareToResume()){rawLocation.continueToLocation();}}
_toggleBreakpointsActive(){Settings.Settings.instance().moduleSetting('breakpointsActive').set(!Settings.Settings.instance().moduleSetting('breakpointsActive').get());}
_breakpointsActiveStateChanged(){const active=Settings.Settings.instance().moduleSetting('breakpointsActive').get();this._toggleBreakpointsActiveAction.setToggled(!active);this._sourcesView.toggleBreakpointsActiveState(active);}
_createDebugToolbar(){const debugToolbar=new Toolbar.Toolbar('scripts-debug-toolbar');const longResumeButton=new Toolbar.ToolbarButton(UIString.UIString('Resume with all pauses blocked for 500 ms'),'largeicon-play');longResumeButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._longResume,this);const terminateExecutionButton=new Toolbar.ToolbarButton(ls`Terminate current JavaScript call`,'largeicon-terminate-execution');terminateExecutionButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._terminateExecution,this);debugToolbar.appendToolbarItem(Toolbar.Toolbar.createLongPressActionButton(this._togglePauseAction,[terminateExecutionButton,longResumeButton],[]));debugToolbar.appendToolbarItem(Toolbar.Toolbar.createActionButton(this._stepOverAction));debugToolbar.appendToolbarItem(Toolbar.Toolbar.createActionButton(this._stepIntoAction));debugToolbar.appendToolbarItem(Toolbar.Toolbar.createActionButton(this._stepOutAction));debugToolbar.appendToolbarItem(Toolbar.Toolbar.createActionButton(this._stepAction));debugToolbar.appendSeparator();debugToolbar.appendToolbarItem(Toolbar.Toolbar.createActionButton(this._toggleBreakpointsActiveAction));this._pauseOnExceptionButton=new Toolbar.ToolbarToggle('','largeicon-pause-on-exceptions');this._pauseOnExceptionButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._togglePauseOnExceptions,this);debugToolbar.appendToolbarItem(this._pauseOnExceptionButton);return debugToolbar;}
_createDebugToolbarDrawer(){const debugToolbarDrawer=createElementWithClass('div','scripts-debug-toolbar-drawer');const label=UIString.UIString('Pause on caught exceptions');const setting=Settings.Settings.instance().moduleSetting('pauseOnCaughtException');debugToolbarDrawer.appendChild(SettingsUI.createSettingCheckbox(label,setting,true));return debugToolbarDrawer;}
appendApplicableItems(event,contextMenu,target){this._appendUISourceCodeItems(event,contextMenu,target);this._appendUISourceCodeFrameItems(event,contextMenu,target);this.appendUILocationItems(contextMenu,target);this._appendRemoteObjectItems(contextMenu,target);this._appendNetworkRequestItems(contextMenu,target);}
_appendUISourceCodeItems(event,contextMenu,target){if(!(target instanceof UISourceCode.UISourceCode)){return;}
const uiSourceCode=(target);if(!uiSourceCode.project().isServiceProject()&&!event.target.isSelfOrDescendant(this._navigatorTabbedLocation.widget().element)){contextMenu.revealSection().appendItem(UIString.UIString('Reveal in sidebar'),this._handleContextMenuReveal.bind(this,uiSourceCode));}}
_appendUISourceCodeFrameItems(event,contextMenu,target){if(!(target instanceof UISourceCodeFrame)){return;}
if(target.uiSourceCode().contentType().isFromSourceMap()||target.textEditor.selection().isEmpty()){return;}
contextMenu.debugSection().appendAction('debugger.evaluate-selection');}
appendUILocationItems(contextMenu,object){if(!(object instanceof UISourceCode.UILocation)){return;}
const uiLocation=(object);const uiSourceCode=uiLocation.uiSourceCode;const contentType=uiSourceCode.contentType();if(contentType.hasScripts()){const target=self.UI.context.flavor(SDKModel.Target);const debuggerModel=target?target.model(DebuggerModel.DebuggerModel):null;if(debuggerModel&&debuggerModel.isPaused()){contextMenu.debugSection().appendItem(UIString.UIString('Continue to here'),this._continueToLocation.bind(this,uiLocation));}
this._callstackPane.appendBlackboxURLContextMenuItems(contextMenu,uiSourceCode);}}
_handleContextMenuReveal(uiSourceCode){this.editorView.showBoth();this._revealInNavigator(uiSourceCode);}
_appendRemoteObjectItems(contextMenu,target){if(!(target instanceof RemoteObject$1.RemoteObject)){return;}
const remoteObject=(target);const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);contextMenu.debugSection().appendItem(ls`Store as global variable`,()=>ConsoleModel.ConsoleModel.instance().saveToTempVariable(executionContext,remoteObject));if(remoteObject.type==='function'){contextMenu.debugSection().appendItem(ls`Show function definition`,this._showFunctionDefinition.bind(this,remoteObject));}}
_appendNetworkRequestItems(contextMenu,target){if(!(target instanceof NetworkRequest.NetworkRequest)){return;}
const request=(target);const uiSourceCode=this._workspace.uiSourceCodeForURL(request.url());if(!uiSourceCode){return;}
const openText=UIString.UIString('Open in Sources panel');contextMenu.revealSection().appendItem(openText,this.showUILocation.bind(this,uiSourceCode.uiLocation(0,0)));}
_showFunctionDefinition(remoteObject){remoteObject.debuggerModel().functionDetailsPromise(remoteObject).then(this._didGetFunctionDetails.bind(this));}
async _didGetFunctionDetails(response){if(!response||!response.location){return;}
const uiLocation=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(response.location);if(uiLocation){this.showUILocation(uiLocation);}}
_revealNavigatorSidebar(){this._setAsCurrentPanel();this.editorView.showBoth(true);}
_revealDebuggerSidebar(){this._setAsCurrentPanel();this._splitWidget.showBoth(true);}
_updateSidebarPosition(){let vertically;const position=Settings.Settings.instance().moduleSetting('sidebarPosition').get();if(position==='right'){vertically=false;}else if(position==='bottom'){vertically=true;}else{vertically=self.UI.inspectorView.element.offsetWidth<680;}
if(this.sidebarPaneView&&vertically===!this._splitWidget.isVertical()){return;}
if(this.sidebarPaneView&&this.sidebarPaneView.shouldHideOnDetach()){return;}
if(this.sidebarPaneView){this.sidebarPaneView.detach();}
this._splitWidget.setVertical(!vertically);this._splitWidget.element.classList.toggle('sources-split-view-vertical',vertically);SourcesPanel.updateResizerAndSidebarButtons(this);const vbox=new Widget.VBox();vbox.element.appendChild(this._debugToolbar.element);vbox.element.appendChild(this._debugToolbarDrawer);vbox.setMinimumAndPreferredSizes(minToolbarWidth,25,minToolbarWidth,100);this._sidebarPaneStack=ViewManager.ViewManager.instance().createStackLocation(this._revealDebuggerSidebar.bind(this));this._sidebarPaneStack.widget().element.classList.add('overflow-auto');this._sidebarPaneStack.widget().show(vbox.element);this._sidebarPaneStack.widget().element.appendChild(this._debuggerPausedMessage.element());this._sidebarPaneStack.appendApplicableItems('sources.sidebar-top');if(this._threadsSidebarPane){this._sidebarPaneStack.showView(this._threadsSidebarPane);}
if(!vertically){this._sidebarPaneStack.appendView(this._watchSidebarPane);}
this._sidebarPaneStack.showView(this._callstackPane);const jsBreakpoints=(ViewManager.ViewManager.instance().view('sources.jsBreakpoints'));const sourceScopeChainView=(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')?ViewManager.ViewManager.instance().view('sources.sourceScopeChain'):null);const scopeChainView=(ViewManager.ViewManager.instance().view('sources.scopeChain'));if(this._tabbedLocationHeader){this._splitWidget.uninstallResizer(this._tabbedLocationHeader);this._tabbedLocationHeader=null;}
if(!vertically){if(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')){this._sidebarPaneStack.showView((sourceScopeChainView));}
this._sidebarPaneStack.showView(scopeChainView);this._sidebarPaneStack.showView(jsBreakpoints);this._extensionSidebarPanesContainer=this._sidebarPaneStack;this.sidebarPaneView=vbox;this._splitWidget.uninstallResizer(this._debugToolbar.gripElementForResize());}else{const splitWidget=new SplitWidget.SplitWidget(true,true,'sourcesPanelDebuggerSidebarSplitViewState',0.5);splitWidget.setMainWidget(vbox);this._sidebarPaneStack.showView(jsBreakpoints);const tabbedLocation=ViewManager.ViewManager.instance().createTabbedLocation(this._revealDebuggerSidebar.bind(this));splitWidget.setSidebarWidget(tabbedLocation.tabbedPane());this._tabbedLocationHeader=tabbedLocation.tabbedPane().headerElement();this._splitWidget.installResizer(this._tabbedLocationHeader);this._splitWidget.installResizer(this._debugToolbar.gripElementForResize());if(Root.Runtime.experiments.isEnabled('wasmDWARFDebugging')){tabbedLocation.appendView((sourceScopeChainView));}
tabbedLocation.appendView(scopeChainView);tabbedLocation.appendView(this._watchSidebarPane);tabbedLocation.appendApplicableItems('sources.sidebar-tabs');this._extensionSidebarPanesContainer=tabbedLocation;this.sidebarPaneView=splitWidget;}
this._sidebarPaneStack.appendApplicableItems('sources.sidebar-bottom');const extensionSidebarPanes=self.Extensions.extensionServer.sidebarPanes();for(let i=0;i<extensionSidebarPanes.length;++i){this._addExtensionSidebarPane(extensionSidebarPanes[i]);}
this._splitWidget.setSidebarWidget(this.sidebarPaneView);}
_setAsCurrentPanel(){return ViewManager.ViewManager.instance().showView('sources');}
_extensionSidebarPaneAdded(event){const pane=(event.data);this._addExtensionSidebarPane(pane);}
_addExtensionSidebarPane(pane){if(pane.panelName()===this.name){this._extensionSidebarPanesContainer.appendView(pane);}}
sourcesView(){return this._sourcesView;}
_handleDrop(dataTransfer){const items=dataTransfer.items;if(!items.length){return;}
const entry=items[0].webkitGetAsEntry();if(!entry.isDirectory){return;}
InspectorFrontendHost.InspectorFrontendHostInstance.upgradeDraggedFileSystemPermissions(entry.filesystem);}}
let lastModificationTimeout=200;const minToolbarWidth=215;class UILocationRevealer{reveal(uiLocation,omitFocus){if(!(uiLocation instanceof UISourceCode.UILocation)){return Promise.reject(new Error('Internal error: not a ui location'));}
SourcesPanel.instance().showUILocation(uiLocation,omitFocus);return Promise.resolve();}}
class DebuggerLocationRevealer{async reveal(rawLocation,omitFocus){if(!(rawLocation instanceof DebuggerModel.Location)){throw new Error('Internal error: not a debugger location');}
const uiLocation=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(rawLocation);if(uiLocation){SourcesPanel.instance().showUILocation(uiLocation,omitFocus);}}}
class UISourceCodeRevealer{reveal(uiSourceCode,omitFocus){if(!(uiSourceCode instanceof UISourceCode.UISourceCode)){return Promise.reject(new Error('Internal error: not a ui source code'));}
SourcesPanel.instance().showUISourceCode(uiSourceCode,undefined,undefined,omitFocus);return Promise.resolve();}}
class DebuggerPausedDetailsRevealer{reveal(object){return SourcesPanel.instance()._setAsCurrentPanel();}}
class RevealingActionDelegate{handleAction(context,actionId){const panel=SourcesPanel.instance();if(!panel._ensureSourcesViewVisible()){return false;}
switch(actionId){case'debugger.toggle-pause':panel._togglePause();return true;}
return false;}}
class DebuggingActionDelegate{handleAction(context,actionId){const panel=SourcesPanel.instance();switch(actionId){case'debugger.step-over':{panel._stepOver();return true;}
case'debugger.step-into':{panel._stepIntoAsync();return true;}
case'debugger.step':{panel._stepInto();return true;}
case'debugger.step-out':{panel._stepOut();return true;}
case'debugger.run-snippet':{panel._runSnippet();return true;}
case'debugger.toggle-breakpoints-active':{panel._toggleBreakpointsActive();return true;}
case'debugger.evaluate-selection':{const frame=self.UI.context.flavor(UISourceCodeFrame);if(frame){let text=frame.textEditor.text(frame.textEditor.selection());const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(executionContext){const message=ConsoleModel.ConsoleModel.instance().addCommandMessage(executionContext,text);text=JavaScriptREPL.JavaScriptREPL.wrapObjectLiteral(text);ConsoleModel.ConsoleModel.instance().evaluateCommandInConsole(executionContext,message,text,true);}}
return true;}}
return false;}}
class WrapperView extends Widget.VBox{constructor(){super();this.element.classList.add('sources-view-wrapper');WrapperView._instance=this;this._view=SourcesPanel.instance()._sourcesView;}
static isShowing(){return!!WrapperView._instance&&WrapperView._instance.isShowing();}
wasShown(){if(!SourcesPanel.instance().isShowing()){this._showViewInWrapper();}else{self.UI.inspectorView.setDrawerMinimized(true);}
SourcesPanel.updateResizerAndSidebarButtons(SourcesPanel.instance());}
willHide(){self.UI.inspectorView.setDrawerMinimized(false);setImmediate(()=>SourcesPanel.updateResizerAndSidebarButtons(SourcesPanel.instance()));}
_showViewInWrapper(){this._view.show(this.element);}}
var SourcesPanel$1=Object.freeze({__proto__:null,SourcesPanel:SourcesPanel,get lastModificationTimeout(){return lastModificationTimeout;},minToolbarWidth:minToolbarWidth,UILocationRevealer:UILocationRevealer,DebuggerLocationRevealer:DebuggerLocationRevealer,UISourceCodeRevealer:UISourceCodeRevealer,DebuggerPausedDetailsRevealer:DebuggerPausedDetailsRevealer,RevealingActionDelegate:RevealingActionDelegate,DebuggingActionDelegate:DebuggingActionDelegate,WrapperView:WrapperView});const breakpointsGutterType='CodeMirror-gutter-breakpoints';class DebuggerPlugin extends Plugin{constructor(textEditor,uiSourceCode,transformer){super();this._textEditor=textEditor;this._uiSourceCode=uiSourceCode;this._transformer=transformer;this._executionLocation=null;this._controlDown=false;this._asyncStepInHoveredLine=0;this._asyncStepInHovered=false;this._clearValueWidgetsTimer=null;this._sourceMapInfobar=null;this._controlTimeout=null;this._scriptsPanel=SourcesPanel.instance();this._breakpointManager=BreakpointManager.BreakpointManager.instance();if(uiSourceCode.project().type()===Workspace.projectTypes.Debugger){this._textEditor.element.classList.add('source-frame-debugger-script');}
this._popoverHelper=new PopoverHelper.PopoverHelper(this._scriptsPanel.element,this._getPopoverRequest.bind(this));this._popoverHelper.setDisableOnClick(true);this._popoverHelper.setTimeout(250,250);this._popoverHelper.setHasPadding(true);this._boundPopoverHelperHide=this._popoverHelper.hidePopover.bind(this._popoverHelper);this._scriptsPanel.element.addEventListener('scroll',this._boundPopoverHelperHide,true);this._boundKeyDown=(this._onKeyDown.bind(this));this._textEditor.element.addEventListener('keydown',this._boundKeyDown,true);this._boundKeyUp=(this._onKeyUp.bind(this));this._textEditor.element.addEventListener('keyup',this._boundKeyUp,true);this._boundMouseMove=(this._onMouseMove.bind(this));this._textEditor.element.addEventListener('mousemove',this._boundMouseMove,false);this._boundMouseDown=(this._onMouseDown.bind(this));this._textEditor.element.addEventListener('mousedown',this._boundMouseDown,true);this._boundBlur=this._onBlur.bind(this);this._textEditor.element.addEventListener('focusout',this._boundBlur,false);this._boundWheel=event=>{if(this._executionLocation&&KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event)){event.preventDefault();}};this._textEditor.element.addEventListener('wheel',this._boundWheel,true);this._textEditor.addEventListener(SourcesTextEditor.Events.GutterClick,event=>{this._handleGutterClick(event);},this);this._breakpointManager.addEventListener(BreakpointManager.Events.BreakpointAdded,this._breakpointAdded,this);this._breakpointManager.addEventListener(BreakpointManager.Events.BreakpointRemoved,this._breakpointRemoved,this);this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyChanged,this._workingCopyChanged,this);this._uiSourceCode.addEventListener(UISourceCode.Events.WorkingCopyCommitted,this._workingCopyCommitted,this);this._breakpointDecorations=new Set();this._decorationByBreakpoint=new Map();this._possibleBreakpointsRequested=new Set();this._scriptFileForDebuggerModel=new Map();Settings.Settings.instance().moduleSetting('skipStackFramesPattern').addChangeListener(this._showBlackboxInfobarIfNeeded,this);Settings.Settings.instance().moduleSetting('skipContentScripts').addChangeListener(this._showBlackboxInfobarIfNeeded,this);this._valueWidgets=new Map();this._continueToLocationDecorations=null;self.UI.context.addFlavorChangeListener(DebuggerModel.CallFrame,this._callFrameChanged,this);this._liveLocationPool=new LiveLocation.LiveLocationPool();this._callFrameChanged();this._updateScriptFiles();if(this._uiSourceCode.isDirty()){this._muted=true;this._mutedFromStart=true;}else{this._muted=false;this._mutedFromStart=false;this._initializeBreakpoints();}
this._blackboxInfobar=null;this._showBlackboxInfobarIfNeeded();for(const scriptFile of this._scriptFileForDebuggerModel.values()){scriptFile.checkMapping();}
this._hasLineWithoutMapping=false;this._updateLinesWithoutMappingHighlight();if(!Root.Runtime.experiments.isEnabled('sourcesPrettyPrint')){this._prettyPrintInfobar=null;this._detectMinified();}
this._textEditor.installGutter(breakpointsGutterType,true);for(let i=0;i<this._textEditor.linesCount;++i){const gutterElement=createElementWithClass('div','breakpoint-element');this._textEditor.setGutterDecoration(i,breakpointsGutterType,gutterElement);}}
static accepts(uiSourceCode){return uiSourceCode.contentType().hasScripts();}
_showBlackboxInfobarIfNeeded(){const uiSourceCode=this._uiSourceCode;if(!uiSourceCode.contentType().hasScripts()){return;}
const projectType=uiSourceCode.project().type();if(!BlackboxManager.BlackboxManager.instance().isBlackboxedUISourceCode(uiSourceCode)){this._hideBlackboxInfobar();return;}
if(this._blackboxInfobar){this._blackboxInfobar.dispose();}
function unblackbox(){BlackboxManager.BlackboxManager.instance().unblackboxUISourceCode(uiSourceCode);if(projectType===Workspace.projectTypes.ContentScripts){BlackboxManager.BlackboxManager.instance().unblackboxContentScripts();}}
const infobar=new Infobar.Infobar(Infobar.Type.Warning,UIString.UIString('This script is blackboxed in the debugger'),[{text:ls`Unblackbox`,highlight:false,delegate:unblackbox,dismiss:true},{text:ls`Configure`,highlight:false,delegate:ViewManager.ViewManager.instance().showView.bind(ViewManager.ViewManager.instance(),'blackbox'),dismiss:false}]);this._blackboxInfobar=infobar;infobar.createDetailsRowMessage(UIString.UIString('The debugger will skip stepping through this script, and will not stop on exceptions.'));const scriptFile=this._scriptFileForDebuggerModel.size?this._scriptFileForDebuggerModel.values().next().value:null;if(scriptFile&&scriptFile.hasSourceMapURL()){infobar.createDetailsRowMessage(UIString.UIString('Source map found, but ignored for blackboxed file.'));}
this._textEditor.attachInfobar(this._blackboxInfobar);}
_hideBlackboxInfobar(){if(!this._blackboxInfobar){return;}
this._blackboxInfobar.dispose();this._blackboxInfobar=null;}
wasShown(){if(this._executionLocation){setImmediate(()=>{this._generateValuesInSource();});}}
willHide(){this._popoverHelper.hidePopover();}
populateLineGutterContextMenu(contextMenu,editorLineNumber){function populate(resolve,reject){const uiLocation=new UISourceCode.UILocation(this._uiSourceCode,editorLineNumber,0);this._scriptsPanel.appendUILocationItems(contextMenu,uiLocation);const breakpoints=this._lineBreakpointDecorations(editorLineNumber).map(decoration=>decoration.breakpoint).filter(breakpoint=>!!breakpoint);if(!breakpoints.length){contextMenu.debugSection().appendItem(UIString.UIString('Add breakpoint'),this._createNewBreakpoint.bind(this,editorLineNumber,'',true));contextMenu.debugSection().appendItem(UIString.UIString('Add conditional breakpoint…'),this._editBreakpointCondition.bind(this,editorLineNumber,null,null));contextMenu.debugSection().appendItem(ls`Add logpoint…`,this._editBreakpointCondition.bind(this,editorLineNumber,null,null,true));contextMenu.debugSection().appendItem(UIString.UIString('Never pause here'),this._createNewBreakpoint.bind(this,editorLineNumber,'false',true));}else{const hasOneBreakpoint=breakpoints.length===1;const removeTitle=hasOneBreakpoint?UIString.UIString('Remove breakpoint'):UIString.UIString('Remove all breakpoints in line');contextMenu.debugSection().appendItem(removeTitle,()=>breakpoints.map(breakpoint=>breakpoint.remove()));if(hasOneBreakpoint){contextMenu.debugSection().appendItem(UIString.UIString('Edit breakpoint…'),this._editBreakpointCondition.bind(this,editorLineNumber,breakpoints[0],null));}
const hasEnabled=breakpoints.some(breakpoint=>breakpoint.enabled());if(hasEnabled){const title=hasOneBreakpoint?UIString.UIString('Disable breakpoint'):UIString.UIString('Disable all breakpoints in line');contextMenu.debugSection().appendItem(title,()=>breakpoints.map(breakpoint=>breakpoint.setEnabled(false)));}
const hasDisabled=breakpoints.some(breakpoint=>!breakpoint.enabled());if(hasDisabled){const title=hasOneBreakpoint?UIString.UIString('Enable breakpoint'):UIString.UIString('Enable all breakpoints in line');contextMenu.debugSection().appendItem(title,()=>breakpoints.map(breakpoint=>breakpoint.setEnabled(true)));}}
resolve();}
return new Promise(populate.bind(this));}
populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber){function addSourceMapURL(scriptFile){const dialog=new AddSourceMapURLDialog(addSourceMapURLDialogCallback.bind(null,scriptFile));dialog.show();}
function addSourceMapURLDialogCallback(scriptFile,url){if(!url){return;}
scriptFile.addSourceMapURL(url);}
function populateSourceMapMembers(){if(this._uiSourceCode.project().type()===Workspace.projectTypes.Network&&Settings.Settings.instance().moduleSetting('jsSourceMapsEnabled').get()&&!BlackboxManager.BlackboxManager.instance().isBlackboxedUISourceCode(this._uiSourceCode)){if(this._scriptFileForDebuggerModel.size){const scriptFile=this._scriptFileForDebuggerModel.values().next().value;const addSourceMapURLLabel=UIString.UIString('Add source map…');contextMenu.debugSection().appendItem(addSourceMapURLLabel,addSourceMapURL.bind(null,scriptFile));}}}
return super.populateTextAreaContextMenu(contextMenu,editorLineNumber,editorColumnNumber).then(populateSourceMapMembers.bind(this));}
_workingCopyChanged(){if(this._scriptFileForDebuggerModel.size){return;}
if(this._uiSourceCode.isDirty()){this._muteBreakpointsWhileEditing();}else{this._restoreBreakpointsAfterEditing();}}
_workingCopyCommitted(event){this._scriptsPanel.updateLastModificationTime();if(!this._scriptFileForDebuggerModel.size){this._restoreBreakpointsAfterEditing();}}
_didMergeToVM(){this._restoreBreakpointsIfConsistentScripts();}
_didDivergeFromVM(){this._muteBreakpointsWhileEditing();}
_muteBreakpointsWhileEditing(){if(this._muted){return;}
for(const decoration of this._breakpointDecorations){this._updateBreakpointDecoration(decoration);}
this._muted=true;}
async _restoreBreakpointsIfConsistentScripts(){for(const scriptFile of this._scriptFileForDebuggerModel.values()){if(scriptFile.hasDivergedFromVM()||scriptFile.isMergingToVM()){return;}}
await this._restoreBreakpointsAfterEditing();}
async _restoreBreakpointsAfterEditing(){this._muted=false;if(this._mutedFromStart){this._mutedFromStart=false;this._initializeBreakpoints();return;}
const decorations=Array.from(this._breakpointDecorations);this._breakpointDecorations.clear();this._textEditor.operation(()=>decorations.map(decoration=>decoration.hide()));for(const decoration of decorations){if(!decoration.breakpoint){continue;}
const enabled=decoration.enabled;decoration.breakpoint.remove();const location=decoration.handle.resolve();if(location){await this._setBreakpoint(location.lineNumber,location.columnNumber,decoration.condition,enabled);}}}
_isIdentifier(tokenType){return tokenType.startsWith('js-variable')||tokenType.startsWith('js-property')||tokenType==='js-def';}
_getPopoverRequest(event){if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event)){return null;}
const target=self.UI.context.flavor(SDKModel.Target);const debuggerModel=target?target.model(DebuggerModel.DebuggerModel):null;if(!debuggerModel||!debuggerModel.isPaused()){return null;}
const textPosition=this._textEditor.coordinatesToCursorPosition(event.x,event.y);if(!textPosition){return null;}
const mouseLine=textPosition.startLine;const mouseColumn=textPosition.startColumn;const textSelection=this._textEditor.selection().normalize();let anchorBox;let editorLineNumber;let startHighlight;let endHighlight;const selectedCallFrame=(self.UI.context.flavor(DebuggerModel.CallFrame));if(!selectedCallFrame){return null;}
if(selectedCallFrame.script.isWasm()){return null;}
if(textSelection&&!textSelection.isEmpty()){if(textSelection.startLine!==textSelection.endLine||textSelection.startLine!==mouseLine||mouseColumn<textSelection.startColumn||mouseColumn>textSelection.endColumn){return null;}
const leftCorner=this._textEditor.cursorPositionToCoordinates(textSelection.startLine,textSelection.startColumn);const rightCorner=this._textEditor.cursorPositionToCoordinates(textSelection.endLine,textSelection.endColumn);anchorBox=new AnchorBox(leftCorner.x,leftCorner.y,rightCorner.x-leftCorner.x,leftCorner.height);editorLineNumber=textSelection.startLine;startHighlight=textSelection.startColumn;endHighlight=textSelection.endColumn-1;}else{const token=this._textEditor.tokenAtTextPosition(textPosition.startLine,textPosition.startColumn);if(!token||!token.type){return null;}
editorLineNumber=textPosition.startLine;const line=this._textEditor.line(editorLineNumber);const tokenContent=line.substring(token.startColumn,token.endColumn);const isIdentifier=this._isIdentifier(token.type);if(!isIdentifier&&(token.type!=='js-keyword'||tokenContent!=='this')){return null;}
const leftCorner=this._textEditor.cursorPositionToCoordinates(editorLineNumber,token.startColumn);const rightCorner=this._textEditor.cursorPositionToCoordinates(editorLineNumber,token.endColumn-1);anchorBox=new AnchorBox(leftCorner.x,leftCorner.y,rightCorner.x-leftCorner.x,leftCorner.height);startHighlight=token.startColumn;endHighlight=token.endColumn-1;while(startHighlight>1&&line.charAt(startHighlight-1)==='.'){const tokenBefore=this._textEditor.tokenAtTextPosition(editorLineNumber,startHighlight-2);if(!tokenBefore||!tokenBefore.type){return null;}
if(tokenBefore.type==='js-meta'){break;}
if(tokenBefore.type==='js-string-2'){if(tokenBefore.endColumn<2){return null;}
startHighlight=line.lastIndexOf('`',tokenBefore.endColumn-2);if(startHighlight<0){return null;}
break;}
startHighlight=tokenBefore.startColumn;}}
let objectPopoverHelper;let highlightDescriptor;return{box:anchorBox,show:async popover=>{const evaluationText=this._textEditor.line(editorLineNumber).substring(startHighlight,endHighlight+1);const resolvedText=await resolveExpression(selectedCallFrame,evaluationText,this._uiSourceCode,editorLineNumber,startHighlight,endHighlight);const result=await selectedCallFrame.evaluate({expression:resolvedText||evaluationText,objectGroup:'popover',includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:false});if(!result.object||(result.object.type==='object'&&result.object.subtype==='error')){return false;}
objectPopoverHelper=await ObjectPopoverHelper.ObjectPopoverHelper.buildObjectPopover(result.object,popover);const potentiallyUpdatedCallFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(!objectPopoverHelper||selectedCallFrame!==potentiallyUpdatedCallFrame){debuggerModel.runtimeModel().releaseObjectGroup('popover');if(objectPopoverHelper){objectPopoverHelper.dispose();}
return false;}
const highlightRange=new TextRange.TextRange(editorLineNumber,startHighlight,editorLineNumber,endHighlight);highlightDescriptor=this._textEditor.highlightRange(highlightRange,'source-frame-eval-expression');return true;},hide:()=>{objectPopoverHelper.dispose();debuggerModel.runtimeModel().releaseObjectGroup('popover');this._textEditor.removeHighlight(highlightDescriptor);}};}
async _onKeyDown(event){this._clearControlDown();if(event.key==='Escape'){if(this._popoverHelper.isPopoverVisible()){this._popoverHelper.hidePopover();event.consume();}
return;}
if(self.UI.shortcutRegistry.eventMatchesAction(event,'debugger.toggle-breakpoint')){const selection=this._textEditor.selection();if(!selection){return;}
await this._toggleBreakpoint(selection.startLine,false);event.consume(true);return;}
if(self.UI.shortcutRegistry.eventMatchesAction(event,'debugger.toggle-breakpoint-enabled')){const selection=this._textEditor.selection();if(!selection){return;}
await this._toggleBreakpoint(selection.startLine,true);event.consume(true);return;}
if(self.UI.shortcutRegistry.eventMatchesAction(event,'debugger.breakpoint-input-window')){const selection=this._textEditor.selection();if(!selection){return;}
const breakpoints=this._lineBreakpointDecorations(selection.startLine).map(decoration=>decoration.breakpoint).filter(breakpoint=>!!breakpoint);let breakpoint;if(breakpoints.length){breakpoint=breakpoints[0];}
const isLogpoint=breakpoint?breakpoint.condition().includes(LogpointPrefix):false;this._editBreakpointCondition(selection.startLine,breakpoint,null,isLogpoint);event.consume(true);return;}
if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event)&&this._executionLocation){this._controlDown=true;if(event.key===(Platform$1.isMac()?'Meta':'Control')){this._controlTimeout=setTimeout(()=>{if(this._executionLocation&&this._controlDown){this._showContinueToLocations();}},150);}}}
_onMouseMove(event){if(this._executionLocation&&this._controlDown&&KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event)){if(!this._continueToLocationDecorations){this._showContinueToLocations();}}
if(this._continueToLocationDecorations){const textPosition=this._textEditor.coordinatesToCursorPosition(event.x,event.y);const hovering=!!event.target.enclosingNodeOrSelfWithClass('source-frame-async-step-in');this._setAsyncStepInHoveredLine(textPosition?textPosition.startLine:null,hovering);}}
_setAsyncStepInHoveredLine(editorLineNumber,hovered){if(this._asyncStepInHoveredLine===editorLineNumber&&this._asyncStepInHovered===hovered){return;}
if(this._asyncStepInHovered&&this._asyncStepInHoveredLine){this._textEditor.toggleLineClass(this._asyncStepInHoveredLine,'source-frame-async-step-in-hovered',false);}
this._asyncStepInHoveredLine=editorLineNumber;this._asyncStepInHovered=hovered;if(this._asyncStepInHovered&&this._asyncStepInHoveredLine){this._textEditor.toggleLineClass(this._asyncStepInHoveredLine,'source-frame-async-step-in-hovered',true);}}
_onMouseDown(event){if(!this._executionLocation||!KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event)){return;}
if(!this._continueToLocationDecorations){return;}
event.consume();const textPosition=this._textEditor.coordinatesToCursorPosition(event.x,event.y);if(!textPosition){return;}
for(const decoration of this._continueToLocationDecorations.keys()){const range=decoration.find();if(range.from.line!==textPosition.startLine||range.to.line!==textPosition.startLine){continue;}
if(range.from.ch<=textPosition.startColumn&&textPosition.startColumn<=range.to.ch){this._continueToLocationDecorations.get(decoration)();break;}}}
_onBlur(event){if(this._textEditor.element.isAncestor((event.target))){return;}
this._clearControlDown();}
_onKeyUp(event){this._clearControlDown();}
_clearControlDown(){this._controlDown=false;this._clearContinueToLocations();clearTimeout(this._controlTimeout);}
async _editBreakpointCondition(editorLineNumber,breakpoint,location,preferLogpoint){const oldCondition=breakpoint?breakpoint.condition():'';const decorationElement=createElement('div');const dialog=new BreakpointEditDialog(editorLineNumber,oldCondition,!!preferLogpoint,async result=>{dialog.detach();this._textEditor.removeDecoration(decorationElement,editorLineNumber);if(!result.committed){return;}
if(breakpoint){breakpoint.setCondition(result.condition);}else if(location){await this._setBreakpoint(location.lineNumber,location.columnNumber,result.condition,true);}else{await this._createNewBreakpoint(editorLineNumber,result.condition,true);}});this._textEditor.addDecoration(decorationElement,editorLineNumber);dialog.markAsExternallyManaged();dialog.show(decorationElement);}
async _executionLineChanged(liveLocation){this._clearExecutionLine();const uiLocation=await liveLocation.uiLocation();if(!uiLocation||uiLocation.uiSourceCode!==this._uiSourceCode){this._executionLocation=null;return;}
this._executionLocation=uiLocation;const editorLocation=this._transformer.rawToEditorLocation(uiLocation.lineNumber,uiLocation.columnNumber);this._textEditor.setExecutionLocation(editorLocation[0],editorLocation[1]);if(this._textEditor.isShowing()){setImmediate(()=>{if(this._controlDown){this._showContinueToLocations();}else{this._generateValuesInSource();}});}}
_generateValuesInSource(){if(!Settings.Settings.instance().moduleSetting('inlineVariableValues').get()){return;}
const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!executionContext){return;}
const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(!callFrame){return;}
const localScope=callFrame.localScope();const functionLocation=callFrame.functionLocation();if(localScope&&functionLocation){resolveScopeInObject(localScope).getAllProperties(false,false).then(this._prepareScopeVariables.bind(this,callFrame));}}
_showContinueToLocations(){this._popoverHelper.hidePopover();const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!executionContext){return;}
const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(!callFrame){return;}
const start=callFrame.functionLocation()||callFrame.location();const debuggerModel=callFrame.debuggerModel;debuggerModel.getPossibleBreakpoints(start,null,true).then(locations=>this._textEditor.operation(renderLocations.bind(this,locations)));function renderLocations(locations){this._clearContinueToLocationsNoRestore();this._textEditor.hideExecutionLineBackground();this._clearValueWidgets();this._continueToLocationDecorations=new Map();locations=locations.reverse();let previousCallLine=-1;for(const location of locations){const editorLocation=this._transformer.rawToEditorLocation(location.lineNumber,location.columnNumber);let token=this._textEditor.tokenAtTextPosition(editorLocation[0],editorLocation[1]);if(!token){continue;}
const line=this._textEditor.line(editorLocation[0]);let tokenContent=line.substring(token.startColumn,token.endColumn);if(!token.type&&tokenContent==='.'){token=this._textEditor.tokenAtTextPosition(editorLocation[0],token.endColumn+1);tokenContent=line.substring(token.startColumn,token.endColumn);}
if(!token.type){continue;}
const validKeyword=token.type==='js-keyword'&&(tokenContent==='this'||tokenContent==='return'||tokenContent==='new'||tokenContent==='continue'||tokenContent==='break');if(!validKeyword&&!this._isIdentifier(token.type)){continue;}
if(previousCallLine===editorLocation[0]&&location.type!==Protocol.Debugger.BreakLocationType.Call){continue;}
let highlightRange=new TextRange.TextRange(editorLocation[0],token.startColumn,editorLocation[0],token.endColumn-1);let decoration=this._textEditor.highlightRange(highlightRange,'source-frame-continue-to-location');this._continueToLocationDecorations.set(decoration,location.continueToLocation.bind(location));if(location.type===Protocol.Debugger.BreakLocationType.Call){previousCallLine=editorLocation[0];}
let isAsyncCall=(line[token.startColumn-1]==='.'&&tokenContent==='then')||tokenContent==='setTimeout'||tokenContent==='setInterval'||tokenContent==='postMessage';if(tokenContent==='new'){token=this._textEditor.tokenAtTextPosition(editorLocation[0],token.endColumn+1);tokenContent=line.substring(token.startColumn,token.endColumn);isAsyncCall=tokenContent==='Worker';}
const isCurrentPosition=this._executionLocation&&location.lineNumber===this._executionLocation.lineNumber&&location.columnNumber===this._executionLocation.columnNumber;if(location.type===Protocol.Debugger.BreakLocationType.Call&&isAsyncCall){const asyncStepInRange=this._findAsyncStepInRange(this._textEditor,editorLocation[0],line,token.endColumn);if(asyncStepInRange){highlightRange=new TextRange.TextRange(editorLocation[0],asyncStepInRange.from,editorLocation[0],asyncStepInRange.to-1);decoration=this._textEditor.highlightRange(highlightRange,'source-frame-async-step-in');this._continueToLocationDecorations.set(decoration,this._asyncStepIn.bind(this,location,!!isCurrentPosition));}}}
this._continueToLocationRenderedForTest();}}
_continueToLocationRenderedForTest(){}
_findAsyncStepInRange(textEditor,editorLineNumber,line,column){let token;let tokenText;let from=column;let to=line.length;let position=line.indexOf('(',column);const argumentsStart=position;if(position===-1){return null;}
position++;skipWhitespace();if(position>=line.length){return null;}
nextToken();if(!token){return null;}
from=token.startColumn;if(token.type==='js-keyword'&&tokenText==='async'){skipWhitespace();if(position>=line.length){return{from:from,to:to};}
nextToken();if(!token){return{from:from,to:to};}}
if(token.type==='js-keyword'&&tokenText==='function'){return{from:from,to:to};}
if(token.type==='js-string'){return{from:argumentsStart,to:to};}
if(token.type&&this._isIdentifier(token.type)){return{from:from,to:to};}
if(tokenText!=='('){return null;}
const closeParen=line.indexOf(')',position);if(closeParen===-1||line.substring(position,closeParen).indexOf('(')!==-1){return{from:from,to:to};}
return{from:from,to:closeParen+1};function nextToken(){token=textEditor.tokenAtTextPosition(editorLineNumber,position);if(token){position=token.endColumn;to=token.endColumn;tokenText=line.substring(token.startColumn,token.endColumn);}}
function skipWhitespace(){while(position<line.length){if(line[position]===' '){position++;continue;}
const token=textEditor.tokenAtTextPosition(editorLineNumber,position);if(token.type==='js-comment'){position=token.endColumn;continue;}
break;}}}
_asyncStepIn(location,isCurrentPosition){if(!isCurrentPosition){location.continueToLocation(asyncStepIn);}else{asyncStepIn();}
function asyncStepIn(){location.debuggerModel.scheduleStepIntoAsync();}}
async _prepareScopeVariables(callFrame,allProperties){const properties=allProperties.properties;this._clearValueWidgets();if(!properties||!properties.length||properties.length>500||!this._textEditor.isShowing()){return;}
const functionUILocationPromise=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation((callFrame.functionLocation()));const executionUILocationPromise=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(callFrame.location());const[functionUILocation,executionUILocation]=await Promise.all([functionUILocationPromise,executionUILocationPromise]);if(!functionUILocation||!executionUILocation||functionUILocation.uiSourceCode!==this._uiSourceCode||executionUILocation.uiSourceCode!==this._uiSourceCode){return;}
const functionEditorLocation=this._transformer.rawToEditorLocation(functionUILocation.lineNumber,functionUILocation.columnNumber);const executionEditorLocation=this._transformer.rawToEditorLocation(executionUILocation.lineNumber,executionUILocation.columnNumber);const fromLine=functionEditorLocation[0];const fromColumn=functionEditorLocation[1];const toLine=executionEditorLocation[0];if(fromLine>=toLine||toLine-fromLine>500||fromLine<0||toLine>=this._textEditor.linesCount){return;}
const valuesMap=new Map();for(const property of properties){valuesMap.set(property.name,property.value);}
const namesPerLine=new Map();let skipObjectProperty=false;const tokenizer=new CodeMirrorUtils.TokenizerFactory().createTokenizer('text/javascript');tokenizer(this._textEditor.line(fromLine).substring(fromColumn),processToken.bind(this,fromLine));for(let i=fromLine+1;i<toLine;++i){tokenizer(this._textEditor.line(i),processToken.bind(this,i));}
function processToken(editorLineNumber,tokenValue,tokenType,column,newColumn){if(!skipObjectProperty&&tokenType&&this._isIdentifier(tokenType)&&valuesMap.get(tokenValue)){let names=namesPerLine.get(editorLineNumber);if(!names){names=new Set();namesPerLine.set(editorLineNumber,names);}
names.add(tokenValue);}
skipObjectProperty=tokenValue==='.';}
this._textEditor.operation(this._renderDecorations.bind(this,valuesMap,namesPerLine,fromLine,toLine));}
_renderDecorations(valuesMap,namesPerLine,fromLine,toLine){const formatter=new RemoteObjectPreviewFormatter.RemoteObjectPreviewFormatter();for(let i=fromLine;i<toLine;++i){const names=namesPerLine.get(i);const oldWidget=this._valueWidgets.get(i);if(!names){if(oldWidget){this._valueWidgets.delete(i);this._textEditor.removeDecoration(oldWidget,i);}
continue;}
const widget=createElementWithClass('div','text-editor-value-decoration');const base=this._textEditor.cursorPositionToCoordinates(i,0);const offset=this._textEditor.cursorPositionToCoordinates(i,this._textEditor.line(i).length);const codeMirrorLinesLeftPadding=4;const left=offset.x-base.x+codeMirrorLinesLeftPadding;widget.style.left=left+'px';widget.__nameToToken=new Map();let renderedNameCount=0;for(const name of names){if(renderedNameCount>10){break;}
if(namesPerLine.get(i-1)&&namesPerLine.get(i-1).has(name)){continue;}
if(renderedNameCount){widget.createTextChild(', ');}
const nameValuePair=widget.createChild('span');widget.__nameToToken.set(name,nameValuePair);nameValuePair.createTextChild(name+' = ');const value=valuesMap.get(name);const propertyCount=value.preview?value.preview.properties.length:0;const entryCount=value.preview&&value.preview.entries?value.preview.entries.length:0;if(value.preview&&propertyCount+entryCount<10){formatter.appendObjectPreview(nameValuePair,value.preview,false);}else{const propertyValue=ObjectPropertiesSection.ObjectPropertiesSection.createPropertyValue(value,false,false);nameValuePair.appendChild(propertyValue.element);}
++renderedNameCount;}
let widgetChanged=true;if(oldWidget){widgetChanged=false;for(const name of widget.__nameToToken.keys()){const oldText=oldWidget.__nameToToken.get(name)?oldWidget.__nameToToken.get(name).textContent:'';const newText=widget.__nameToToken.get(name)?widget.__nameToToken.get(name).textContent:'';if(newText!==oldText){widgetChanged=true;UIUtils.runCSSAnimationOnce((widget.__nameToToken.get(name)),'source-frame-value-update-highlight');}}
if(widgetChanged){this._valueWidgets.delete(i);this._textEditor.removeDecoration(oldWidget,i);}}
if(widgetChanged){this._valueWidgets.set(i,widget);this._textEditor.addDecoration(widget,i);}}}
_clearExecutionLine(){this._textEditor.operation(()=>{if(this._executionLocation){this._textEditor.clearExecutionLine();}
this._executionLocation=null;if(this._clearValueWidgetsTimer){clearTimeout(this._clearValueWidgetsTimer);this._clearValueWidgetsTimer=null;}
this._clearValueWidgetsTimer=setTimeout(this._clearValueWidgets.bind(this),1000);this._clearContinueToLocationsNoRestore();});}
_clearValueWidgets(){clearTimeout(this._clearValueWidgetsTimer);this._clearValueWidgetsTimer=null;this._textEditor.operation(()=>{for(const line of this._valueWidgets.keys()){this._textEditor.removeDecoration(this._valueWidgets.get(line),line);}
this._valueWidgets.clear();});}
_clearContinueToLocationsNoRestore(){if(!this._continueToLocationDecorations){return;}
this._textEditor.operation(()=>{for(const decoration of this._continueToLocationDecorations.keys()){this._textEditor.removeHighlight(decoration);}
this._continueToLocationDecorations=null;this._setAsyncStepInHoveredLine(null,false);});}
_clearContinueToLocations(){if(!this._continueToLocationDecorations){return;}
this._textEditor.operation(()=>{this._textEditor.showExecutionLineBackground();this._generateValuesInSource();this._clearContinueToLocationsNoRestore();});}
_lineBreakpointDecorations(lineNumber){return Array.from(this._breakpointDecorations).filter(decoration=>(decoration.handle.resolve()||{}).lineNumber===lineNumber);}
_breakpointDecoration(editorLineNumber,editorColumnNumber){for(const decoration of this._breakpointDecorations){const location=decoration.handle.resolve();if(!location){continue;}
if(location.lineNumber===editorLineNumber&&location.columnNumber===editorColumnNumber){return decoration;}}
return null;}
_updateBreakpointDecoration(decoration){if(!this._scheduledBreakpointDecorationUpdates){this._scheduledBreakpointDecorationUpdates=new Set();setImmediate(()=>this._textEditor.operation(update.bind(this)));}
this._scheduledBreakpointDecorationUpdates.add(decoration);function update(){if(!this._scheduledBreakpointDecorationUpdates){return;}
const editorLineNumbers=new Set();for(const decoration of this._scheduledBreakpointDecorationUpdates){const location=decoration.handle.resolve();if(!location){continue;}
editorLineNumbers.add(location.lineNumber);}
this._scheduledBreakpointDecorationUpdates=null;let waitingForInlineDecorations=false;for(const lineNumber of editorLineNumbers){const decorations=this._lineBreakpointDecorations(lineNumber);updateGutter.call(this,lineNumber,decorations);if(this._possibleBreakpointsRequested.has(lineNumber)){waitingForInlineDecorations=true;continue;}
updateInlineDecorations.call(this,lineNumber,decorations);}
if(!waitingForInlineDecorations){this._breakpointDecorationsUpdatedForTest();}}
function updateGutter(editorLineNumber,decorations){this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint',false);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-disabled',false);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-unbound',false);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-conditional',false);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-logpoint',false);if(decorations.length){decorations.sort(BreakpointDecoration.mostSpecificFirst);const isDisabled=!decorations[0].enabled||this._muted;const isLogpoint=decorations[0].condition.includes(LogpointPrefix);const isUnbound=!decorations[0].bound;const isConditionalBreakpoint=!!decorations[0].condition&&!isLogpoint;this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint',true);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-disabled',isDisabled);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-unbound',isUnbound&&!isDisabled);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-logpoint',isLogpoint);this._textEditor.toggleLineClass(editorLineNumber,'cm-breakpoint-conditional',isConditionalBreakpoint);}}
function updateInlineDecorations(editorLineNumber,decorations){const actualBookmarks=new Set(decorations.map(decoration=>decoration.bookmark).filter(bookmark=>!!bookmark));const lineEnd=this._textEditor.line(editorLineNumber).length;const bookmarks=this._textEditor.bookmarks(new TextRange.TextRange(editorLineNumber,0,editorLineNumber,lineEnd),BreakpointDecoration.bookmarkSymbol);for(const bookmark of bookmarks){if(!actualBookmarks.has(bookmark)){bookmark.clear();}}
if(!decorations.length){return;}
if(decorations.length>1){for(const decoration of decorations){decoration.update();if(!this._muted){decoration.show();}else{decoration.hide();}}}else{decorations[0].update();decorations[0].hide();}}}
_breakpointDecorationsUpdatedForTest(){}
async _inlineBreakpointClick(decoration,event){event.consume(true);if(decoration.breakpoint){if(event.shiftKey){decoration.breakpoint.setEnabled(!decoration.breakpoint.enabled());}else{decoration.breakpoint.remove();}}else{const editorLocation=decoration.handle.resolve();if(!editorLocation){return;}
const location=this._transformer.editorToRawLocation(editorLocation.lineNumber,editorLocation.columnNumber);await this._setBreakpoint(location[0],location[1],decoration.condition,true);}}
_inlineBreakpointContextMenu(decoration,event){event.consume(true);const editorLocation=decoration.handle.resolve();if(!editorLocation){return;}
const location=this._transformer.editorToRawLocation(editorLocation[0],editorLocation[1]);const contextMenu=new ContextMenu.ContextMenu(event);if(decoration.breakpoint){contextMenu.debugSection().appendItem(UIString.UIString('Edit breakpoint…'),this._editBreakpointCondition.bind(this,editorLocation.lineNumber,decoration.breakpoint,null));}else{contextMenu.debugSection().appendItem(UIString.UIString('Add conditional breakpoint…'),this._editBreakpointCondition.bind(this,editorLocation.lineNumber,null,editorLocation));contextMenu.debugSection().appendItem(ls`Add logpoint…`,this._editBreakpointCondition.bind(this,editorLocation.lineNumber,null,editorLocation,true));contextMenu.debugSection().appendItem(UIString.UIString('Never pause here'),this._setBreakpoint.bind(this,location[0],location[1],'false',true));}
contextMenu.show();}
_shouldIgnoreExternalBreakpointEvents(event){const uiLocation=(event.data.uiLocation);if(uiLocation.uiSourceCode!==this._uiSourceCode){return true;}
if(this._muted){return true;}
for(const scriptFile of this._scriptFileForDebuggerModel.values()){if(scriptFile.isDivergingFromVM()||scriptFile.isMergingToVM()){return true;}}
return false;}
_breakpointAdded(event){if(this._shouldIgnoreExternalBreakpointEvents(event)){return;}
const uiLocation=(event.data.uiLocation);const breakpoint=(event.data.breakpoint);this._addBreakpoint(uiLocation,breakpoint);}
_addBreakpoint(uiLocation,breakpoint){const editorLocation=this._transformer.rawToEditorLocation(uiLocation.lineNumber,uiLocation.columnNumber);const lineDecorations=this._lineBreakpointDecorations(uiLocation.lineNumber);let decoration=this._breakpointDecoration(editorLocation[0],editorLocation[1]);if(decoration){decoration.breakpoint=breakpoint;decoration.condition=breakpoint.condition();decoration.enabled=breakpoint.enabled();}else{const handle=this._textEditor.textEditorPositionHandle(editorLocation[0],editorLocation[1]);decoration=new BreakpointDecoration(this._textEditor,handle,breakpoint.condition(),breakpoint.enabled(),breakpoint.bound(),breakpoint);decoration.element.addEventListener('click',this._inlineBreakpointClick.bind(this,decoration),true);decoration.element.addEventListener('contextmenu',this._inlineBreakpointContextMenu.bind(this,decoration),true);this._breakpointDecorations.add(decoration);}
this._decorationByBreakpoint.set(breakpoint,decoration);this._updateBreakpointDecoration(decoration);if(breakpoint.enabled()&&!lineDecorations.length){this._possibleBreakpointsRequested.add(editorLocation[0]);const start=this._transformer.editorToRawLocation(editorLocation[0],0);const end=this._transformer.editorToRawLocation(editorLocation[0]+1,0);this._breakpointManager.possibleBreakpoints(this._uiSourceCode,new TextRange.TextRange(start[0],start[1],end[0],end[1])).then(addInlineDecorations.bind(this,editorLocation[0]));}
function addInlineDecorations(editorLineNumber,possibleLocations){this._possibleBreakpointsRequested.delete(editorLineNumber);const decorations=this._lineBreakpointDecorations(editorLineNumber);for(const decoration of decorations){this._updateBreakpointDecoration(decoration);}
if(!decorations.some(decoration=>!!decoration.breakpoint)){return;}
const columns=new Set();for(const decoration of decorations){const editorLocation=decoration.handle.resolve();if(!editorLocation){continue;}
columns.add(editorLocation.columnNumber);}
for(const location of possibleLocations.slice(0,100)){const editorLocation=this._transformer.rawToEditorLocation(location.lineNumber,location.columnNumber);if(editorLocation[0]!==editorLineNumber){continue;}
if(columns.has(editorLocation[1])){continue;}
const handle=this._textEditor.textEditorPositionHandle(editorLocation[0],editorLocation[1]);const decoration=new BreakpointDecoration(this._textEditor,handle,'',false,false,null);decoration.element.addEventListener('click',this._inlineBreakpointClick.bind(this,decoration),true);decoration.element.addEventListener('contextmenu',this._inlineBreakpointContextMenu.bind(this,decoration),true);this._breakpointDecorations.add(decoration);this._updateBreakpointDecoration(decoration);}}}
_breakpointRemoved(event){if(this._shouldIgnoreExternalBreakpointEvents(event)){return;}
const uiLocation=(event.data.uiLocation);const breakpoint=(event.data.breakpoint);const decoration=this._decorationByBreakpoint.get(breakpoint);if(!decoration){return;}
this._decorationByBreakpoint.delete(breakpoint);const editorLocation=this._transformer.rawToEditorLocation(uiLocation.lineNumber,uiLocation.columnNumber);decoration.breakpoint=null;decoration.enabled=false;const lineDecorations=this._lineBreakpointDecorations(editorLocation[0]);if(!lineDecorations.some(decoration=>!!decoration.breakpoint)){for(const lineDecoration of lineDecorations){this._breakpointDecorations.delete(lineDecoration);this._updateBreakpointDecoration(lineDecoration);}}else{this._updateBreakpointDecoration(decoration);}}
_initializeBreakpoints(){const breakpointLocations=this._breakpointManager.breakpointLocationsForUISourceCode(this._uiSourceCode);for(const breakpointLocation of breakpointLocations){this._addBreakpoint(breakpointLocation.uiLocation,breakpointLocation.breakpoint);}}
_updateLinesWithoutMappingHighlight(){const isSourceMapSource=!!CompilerScriptMapping.CompilerScriptMapping.uiSourceCodeOrigin(this._uiSourceCode);if(!isSourceMapSource){return;}
const linesCount=this._textEditor.linesCount;for(let i=0;i<linesCount;++i){const lineHasMapping=CompilerScriptMapping.CompilerScriptMapping.uiLineHasMapping(this._uiSourceCode,i);if(!lineHasMapping){this._hasLineWithoutMapping=true;}
if(this._hasLineWithoutMapping){this._textEditor.toggleLineClass(i,'cm-line-without-source-mapping',!lineHasMapping);}}}
_updateScriptFiles(){for(const debuggerModel of SDKModel.TargetManager.instance().models(DebuggerModel.DebuggerModel)){const scriptFile=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().scriptFile(this._uiSourceCode,debuggerModel);if(scriptFile){this._updateScriptFile(debuggerModel);}}}
_updateScriptFile(debuggerModel){const oldScriptFile=this._scriptFileForDebuggerModel.get(debuggerModel);const newScriptFile=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().scriptFile(this._uiSourceCode,debuggerModel);this._scriptFileForDebuggerModel.delete(debuggerModel);if(oldScriptFile){oldScriptFile.removeEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidMergeToVM,this._didMergeToVM,this);oldScriptFile.removeEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidDivergeFromVM,this._didDivergeFromVM,this);if(this._muted&&!this._uiSourceCode.isDirty()){this._restoreBreakpointsIfConsistentScripts();}}
if(!newScriptFile){return;}
this._scriptFileForDebuggerModel.set(debuggerModel,newScriptFile);newScriptFile.addEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidMergeToVM,this._didMergeToVM,this);newScriptFile.addEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidDivergeFromVM,this._didDivergeFromVM,this);newScriptFile.checkMapping();if(newScriptFile.hasSourceMapURL()){this._showSourceMapInfobar();}}
_showSourceMapInfobar(){if(this._sourceMapInfobar){return;}
this._sourceMapInfobar=Infobar.Infobar.create(Infobar.Type.Info,UIString.UIString('Source Map detected.'),[],Settings.Settings.instance().createSetting('sourceMapInfobarDisabled',false));if(!this._sourceMapInfobar){return;}
this._sourceMapInfobar.createDetailsRowMessage(UIString.UIString('Associated files should be added to the file tree. You can debug these resolved source files as regular JavaScript files.'));this._sourceMapInfobar.createDetailsRowMessage(UIString.UIString('Associated files are available via file tree or %s.',self.UI.shortcutRegistry.shortcutTitleForAction('quickOpen.show')));this._sourceMapInfobar.setCloseCallback(()=>this._sourceMapInfobar=null);this._textEditor.attachInfobar(this._sourceMapInfobar);}
async _detectMinified(){const content=this._uiSourceCode.content();if(!content||!TextUtils.isMinified(content)){return;}
const editorActions=await self.runtime.allInstances(Sources.SourcesView.EditorAction);let formatterCallback=null;for(const editorAction of editorActions){if(editorAction instanceof Sources.ScriptFormatterEditorAction){formatterCallback=editorAction.toggleFormatScriptSource.bind(editorAction);break;}}
this._prettyPrintInfobar=Infobar.Infobar.create(Infobar.Type.Info,UIString.UIString('Pretty-print this minified file?'),[{text:ls`Pretty-print`,delegate:formatterCallback,highlight:true,dismiss:true}],Settings.Settings.instance().createSetting('prettyPrintInfobarDisabled',false));if(!this._prettyPrintInfobar){return;}
this._prettyPrintInfobar.setCloseCallback(()=>this._prettyPrintInfobar=null);const toolbar=new Toolbar.Toolbar('');const button=new Toolbar.ToolbarButton('','largeicon-pretty-print');toolbar.appendToolbarItem(button);toolbar.element.style.display='inline-block';toolbar.element.style.verticalAlign='middle';toolbar.element.style.marginBottom='3px';toolbar.element.style.pointerEvents='none';toolbar.element.tabIndex=-1;const element=this._prettyPrintInfobar.createDetailsRowMessage();element.appendChild(UIUtils.formatLocalized('Pretty-printing will format this file in a new tab where you can continue debugging. You can also pretty-print this file by clicking the %s button on the bottom status bar.',[toolbar.element]));this._textEditor.attachInfobar(this._prettyPrintInfobar);}
async _handleGutterClick(event){if(this._muted){return;}
const eventData=(event.data);if(eventData.gutterType!==SourcesTextEditor.lineNumbersGutterType&&eventData.gutterType!==breakpointsGutterType){return;}
const editorLineNumber=eventData.lineNumber;const eventObject=eventData.event;if(eventObject.button!==0||eventObject.altKey||eventObject.ctrlKey||eventObject.metaKey){return;}
await this._toggleBreakpoint(editorLineNumber,eventObject.shiftKey);eventObject.consume(true);}
async _toggleBreakpoint(editorLineNumber,onlyDisable){const decorations=this._lineBreakpointDecorations(editorLineNumber);if(!decorations.length){await this._createNewBreakpoint(editorLineNumber,'',true);return;}
const hasDisabled=this._textEditor.hasLineClass(editorLineNumber,'cm-breakpoint-disabled');const breakpoints=decorations.map(decoration=>decoration.breakpoint).filter(breakpoint=>!!breakpoint);for(const breakpoint of breakpoints){if(onlyDisable){breakpoint.setEnabled(hasDisabled);}else{breakpoint.remove();}}}
async _createNewBreakpoint(editorLineNumber,condition,enabled){userMetrics.actionTaken(UserMetrics.Action.ScriptsBreakpointSet);if(editorLineNumber<this._textEditor.linesCount){const lineLength=Math.min(this._textEditor.line(editorLineNumber).length,1024);const start=this._transformer.editorToRawLocation(editorLineNumber,0);const end=this._transformer.editorToRawLocation(editorLineNumber,lineLength);const locations=await this._breakpointManager.possibleBreakpoints(this._uiSourceCode,new TextRange.TextRange(start[0],start[1],end[0],end[1]));if(locations&&locations.length){await this._setBreakpoint(locations[0].lineNumber,locations[0].columnNumber,condition,enabled);return;}}
const origin=this._transformer.editorToRawLocation(editorLineNumber,0);await this._setBreakpoint(origin[0],origin[1],condition,enabled);}
async _setBreakpoint(lineNumber,columnNumber,condition,enabled){if(!CompilerScriptMapping.CompilerScriptMapping.uiLineHasMapping(this._uiSourceCode,lineNumber)){return;}
Settings.Settings.instance().moduleSetting('breakpointsActive').set(true);await this._breakpointManager.setBreakpoint(this._uiSourceCode,lineNumber,columnNumber,condition,enabled);this._breakpointWasSetForTest(lineNumber,columnNumber,condition,enabled);}
_breakpointWasSetForTest(lineNumber,columnNumber,condition,enabled){}
async _callFrameChanged(){this._liveLocationPool.disposeAll();const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);if(!callFrame){this._clearExecutionLine();return;}
await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createCallFrameLiveLocation(callFrame.location(),this._executionLineChanged.bind(this),this._liveLocationPool);}
dispose(){for(const decoration of this._breakpointDecorations){decoration.dispose();}
this._breakpointDecorations.clear();if(this._scheduledBreakpointDecorationUpdates){for(const decoration of this._scheduledBreakpointDecorationUpdates){decoration.dispose();}
this._scheduledBreakpointDecorationUpdates.clear();}
this._hideBlackboxInfobar();if(this._sourceMapInfobar){this._sourceMapInfobar.dispose();}
if(this._prettyPrintInfobar){this._prettyPrintInfobar.dispose();}
this._scriptsPanel.element.removeEventListener('scroll',this._boundPopoverHelperHide,true);for(const script of this._scriptFileForDebuggerModel.values()){script.removeEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidMergeToVM,this._didMergeToVM,this);script.removeEventListener(ResourceScriptMapping.ResourceScriptFile.Events.DidDivergeFromVM,this._didDivergeFromVM,this);}
this._scriptFileForDebuggerModel.clear();this._textEditor.element.removeEventListener('keydown',this._boundKeyDown,true);this._textEditor.element.removeEventListener('keyup',this._boundKeyUp,true);this._textEditor.element.removeEventListener('mousemove',this._boundMouseMove,false);this._textEditor.element.removeEventListener('mousedown',this._boundMouseDown,true);this._textEditor.element.removeEventListener('focusout',this._boundBlur,false);this._textEditor.element.removeEventListener('wheel',this._boundWheel,true);this._textEditor.removeEventListener(SourcesTextEditor.Events.GutterClick,event=>{this._handleGutterClick(event);},this);this._popoverHelper.hidePopover();this._popoverHelper.dispose();this._breakpointManager.removeEventListener(BreakpointManager.Events.BreakpointAdded,this._breakpointAdded,this);this._breakpointManager.removeEventListener(BreakpointManager.Events.BreakpointRemoved,this._breakpointRemoved,this);this._uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyChanged,this._workingCopyChanged,this);this._uiSourceCode.removeEventListener(UISourceCode.Events.WorkingCopyCommitted,this._workingCopyCommitted,this);Settings.Settings.instance().moduleSetting('skipStackFramesPattern').removeChangeListener(this._showBlackboxInfobarIfNeeded,this);Settings.Settings.instance().moduleSetting('skipContentScripts').removeChangeListener(this._showBlackboxInfobarIfNeeded,this);super.dispose();this._clearExecutionLine();self.UI.context.removeFlavorChangeListener(DebuggerModel.CallFrame,this._callFrameChanged,this);this._liveLocationPool.disposeAll();}}
class BreakpointDecoration{constructor(textEditor,handle,condition,enabled,bound,breakpoint){this._textEditor=textEditor;this.handle=handle;this.condition=condition;this.enabled=enabled;this.bound=bound;this.breakpoint=breakpoint;this.element=createElement('span');this.element.classList.toggle('cm-inline-breakpoint',true);this.bookmark=null;}
static mostSpecificFirst(decoration1,decoration2){if(decoration1.enabled!==decoration2.enabled){return decoration1.enabled?-1:1;}
if(decoration1.bound!==decoration2.bound){return decoration1.bound?-1:1;}
if(!!decoration1.condition!==!!decoration2.condition){return!!decoration1.condition?-1:1;}
return 0;}
update(){const isLogpoint=!!this.condition&&this.condition.includes(LogpointPrefix);const isConditionalBreakpoint=!!this.condition&&!isLogpoint;this.element.classList.toggle('cm-inline-logpoint',isLogpoint);this.element.classList.toggle('cm-inline-breakpoint-conditional',isConditionalBreakpoint);this.element.classList.toggle('cm-inline-disabled',!this.enabled);}
show(){if(this.bookmark){return;}
const editorLocation=this.handle.resolve();if(!editorLocation){return;}
this.bookmark=this._textEditor.addBookmark(editorLocation.lineNumber,editorLocation.columnNumber,this.element,BreakpointDecoration.bookmarkSymbol);this.bookmark[BreakpointDecoration._elementSymbolForTest]=this.element;}
hide(){if(!this.bookmark){return;}
this.bookmark.clear();this.bookmark=null;}
dispose(){const location=this.handle.resolve();if(location){this._textEditor.toggleLineClass(location.lineNumber,'cm-breakpoint',false);this._textEditor.toggleLineClass(location.lineNumber,'cm-breakpoint-disabled',false);this._textEditor.toggleLineClass(location.lineNumber,'cm-breakpoint-unbound',false);this._textEditor.toggleLineClass(location.lineNumber,'cm-breakpoint-conditional',false);this._textEditor.toggleLineClass(location.lineNumber,'cm-breakpoint-logpoint',false);}
this.hide();}}
BreakpointDecoration.bookmarkSymbol=Symbol('bookmark');BreakpointDecoration._elementSymbolForTest=Symbol('element');const continueToLocationDecorationSymbol=Symbol('bookmark');var DebuggerPlugin$1=Object.freeze({__proto__:null,DebuggerPlugin:DebuggerPlugin,BreakpointDecoration:BreakpointDecoration,continueToLocationDecorationSymbol:continueToLocationDecorationSymbol});class FilePathScoreFunction{constructor(query){this._query=query;this._queryUpperCase=query.toUpperCase();this._score=new Int32Array(20*100);this._sequence=new Int32Array(20*100);this._dataUpperCase='';this._fileNameIndex=0;}
score(data,matchIndexes){if(!data||!this._query){return 0;}
const n=this._query.length;const m=data.length;if(!this._score||this._score.length<n*m){this._score=new Int32Array(n*m*2);this._sequence=new Int32Array(n*m*2);}
const score=this._score;const sequence=(this._sequence);this._dataUpperCase=data.toUpperCase();this._fileNameIndex=data.lastIndexOf('/');for(let i=0;i<n;++i){for(let j=0;j<m;++j){const skipCharScore=j===0?0:score[i*m+j-1];const prevCharScore=i===0||j===0?0:score[(i-1)*m+j-1];const consecutiveMatch=i===0||j===0?0:sequence[(i-1)*m+j-1];const pickCharScore=this._match(this._query,data,i,j,consecutiveMatch);if(pickCharScore&&prevCharScore+pickCharScore>=skipCharScore){sequence[i*m+j]=consecutiveMatch+1;score[i*m+j]=(prevCharScore+pickCharScore);}else{sequence[i*m+j]=0;score[i*m+j]=skipCharScore;}}}
if(matchIndexes){this._restoreMatchIndexes(sequence,n,m,matchIndexes);}
const maxDataLength=256;return score[n*m-1]*maxDataLength+(maxDataLength-data.length);}
_testWordStart(data,j){if(j===0){return true;}
const prevChar=data.charAt(j-1);return prevChar==='_'||prevChar==='-'||prevChar==='/'||(data[j-1]!==this._dataUpperCase[j-1]&&data[j]===this._dataUpperCase[j]);}
_restoreMatchIndexes(sequence,n,m,out){let i=n-1,j=m-1;while(i>=0&&j>=0){switch(sequence[i*m+j]){case 0:--j;break;default:out.push(j);--i;--j;break;}}
out.reverse();}
_singleCharScore(query,data,i,j){const isWordStart=this._testWordStart(data,j);const isFileName=j>this._fileNameIndex;const isPathTokenStart=j===0||data[j-1]==='/';const isCapsMatch=query[i]===data[j]&&query[i]===this._queryUpperCase[i];let score=10;if(isPathTokenStart){score+=4;}
if(isWordStart){score+=2;}
if(isCapsMatch){score+=6;}
if(isFileName){score+=4;}
if(j===this._fileNameIndex+1&&i===0){score+=5;}
if(isFileName&&isWordStart){score+=3;}
return score;}
_sequenceCharScore(query,data,i,j,sequenceLength){const isFileName=j>this._fileNameIndex;const isPathTokenStart=j===0||data[j-1]==='/';let score=10;if(isFileName){score+=4;}
if(isPathTokenStart){score+=5;}
score+=sequenceLength*4;return score;}
_match(query,data,i,j,consecutiveMatch){if(this._queryUpperCase[i]!==this._dataUpperCase[j]){return 0;}
if(!consecutiveMatch){return this._singleCharScore(query,data,i,j);}
return this._sequenceCharScore(query,data,i,j-consecutiveMatch,consecutiveMatch);}}
var FilePathScoreFunction$1=Object.freeze({__proto__:null,FilePathScoreFunction:FilePathScoreFunction});class FilteredUISourceCodeListProvider extends FilteredListWidget.Provider{constructor(){super();this._queryLineNumberAndColumnNumber='';this._defaultScores=null;this._scorer=new FilePathScoreFunction('');}
_projectRemoved(event){const project=(event.data);this._populate(project);this.refresh();}
_populate(skipProject){this._uiSourceCodes=[];const projects=Workspace.WorkspaceImpl.instance().projects().filter(this.filterProject.bind(this));for(let i=0;i<projects.length;++i){if(skipProject&&projects[i]===skipProject){continue;}
const uiSourceCodes=projects[i].uiSourceCodes().filter(this._filterUISourceCode.bind(this));this._uiSourceCodes=this._uiSourceCodes.concat(uiSourceCodes);}}
_filterUISourceCode(uiSourceCode){const binding=self.Persistence.persistence.binding(uiSourceCode);return!binding||binding.fileSystem===uiSourceCode;}
uiSourceCodeSelected(uiSourceCode,lineNumber,columnNumber){}
filterProject(project){return true;}
itemCount(){return this._uiSourceCodes.length;}
itemKeyAt(itemIndex){return this._uiSourceCodes[itemIndex].url();}
setDefaultScores(defaultScores){this._defaultScores=defaultScores;}
itemScoreAt(itemIndex,query){const uiSourceCode=this._uiSourceCodes[itemIndex];const score=this._defaultScores?(this._defaultScores.get(uiSourceCode)||0):0;if(!query||query.length<2){return score;}
if(this._query!==query){this._query=query;this._scorer=new FilePathScoreFunction(query);}
let multiplier=10;if(uiSourceCode.project().type()===Workspace.projectTypes.FileSystem&&!self.Persistence.persistence.binding(uiSourceCode)){multiplier=5;}
const fullDisplayName=uiSourceCode.fullDisplayName();return score+multiplier*this._scorer.score(fullDisplayName,null);}
renderItem(itemIndex,query,titleElement,subtitleElement){query=this.rewriteQuery(query);const uiSourceCode=this._uiSourceCodes[itemIndex];const fullDisplayName=uiSourceCode.fullDisplayName();const indexes=[];new FilePathScoreFunction(query).score(fullDisplayName,indexes);const fileNameIndex=fullDisplayName.lastIndexOf('/');titleElement.classList.add('monospace');subtitleElement.classList.add('monospace');titleElement.textContent=uiSourceCode.displayName()+(this._queryLineNumberAndColumnNumber||'');this._renderSubtitleElement(subtitleElement,fullDisplayName);subtitleElement.title=fullDisplayName;const ranges=[];for(let i=0;i<indexes.length;++i){ranges.push({offset:indexes[i],length:1});}
if(indexes[0]>fileNameIndex){for(let i=0;i<ranges.length;++i){ranges[i].offset-=fileNameIndex+1;}
UIUtils.highlightRangesWithStyleClass(titleElement,ranges,'highlight');}else{UIUtils.highlightRangesWithStyleClass(subtitleElement,ranges,'highlight');}}
_renderSubtitleElement(element,text){element.removeChildren();let splitPosition=text.lastIndexOf('/');if(text.length>55){splitPosition=text.length-55;}
const first=element.createChild('div','first-part');first.textContent=text.substring(0,splitPosition);const second=element.createChild('div','second-part');second.textContent=text.substring(splitPosition);element.title=text;}
selectItem(itemIndex,promptValue){const parsedExpression=promptValue.trim().match(/^([^:]*)(:\d+)?(:\d+)?$/);if(!parsedExpression){return;}
let lineNumber;let columnNumber;if(parsedExpression[2]){lineNumber=parseInt(parsedExpression[2].substr(1),10)-1;}
if(parsedExpression[3]){columnNumber=parseInt(parsedExpression[3].substr(1),10)-1;}
const uiSourceCode=itemIndex!==null?this._uiSourceCodes[itemIndex]:null;this.uiSourceCodeSelected(uiSourceCode,lineNumber,columnNumber);}
rewriteQuery(query){query=query?query.trim():'';if(!query||query===':'){return'';}
const lineNumberMatch=query.match(/^([^:]+)((?::[^:]*){0,2})$/);this._queryLineNumberAndColumnNumber=lineNumberMatch?lineNumberMatch[2]:'';return lineNumberMatch?lineNumberMatch[1]:query;}
_uiSourceCodeAdded(event){const uiSourceCode=(event.data);if(!this._filterUISourceCode(uiSourceCode)||!this.filterProject(uiSourceCode.project())){return;}
this._uiSourceCodes.push(uiSourceCode);this.refresh();}
notFoundText(){return UIString.UIString('No files found');}
attach(){Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.ProjectRemoved,this._projectRemoved,this);this._populate();}
detach(){Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Events.UISourceCodeAdded,this._uiSourceCodeAdded,this);Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Events.ProjectRemoved,this._projectRemoved,this);this._queryLineNumberAndColumnNumber='';this._defaultScores=null;}}
var FilteredUISourceCodeListProvider$1=Object.freeze({__proto__:null,FilteredUISourceCodeListProvider:FilteredUISourceCodeListProvider});class GoToLineQuickOpen extends FilteredListWidget.Provider{selectItem(itemIndex,promptValue){const uiSourceCode=this._currentUISourceCode();if(!uiSourceCode){return;}
const position=this._parsePosition(promptValue);if(!position){return;}
Revealer.reveal(uiSourceCode.uiLocation(position.line-1,position.column-1));}
notFoundText(query){if(!this._currentUISourceCode()){return UIString.UIString('No file selected.');}
const position=this._parsePosition(query);if(!position){const sourceFrame=this._currentSourceFrame();if(!sourceFrame){return ls`Type a number to go to that line.`;}
const currentLineNumber=sourceFrame.textEditor.currentLineNumber()+1;const linesCount=sourceFrame.textEditor.linesCount;return ls`Current line: ${currentLineNumber}. Type a line number between 1 and ${linesCount} to navigate to.`;}
if(position.column&&position.column>1){return ls`Go to line ${position.line} and column ${position.column}.`;}
return ls`Go to line ${position.line}.`;}
_parsePosition(query){const parts=query.match(/([0-9]+)(\:[0-9]*)?/);if(!parts||!parts[0]||parts[0].length!==query.length){return null;}
const line=parseInt(parts[1],10);let column;if(parts[2]){column=parseInt(parts[2].substring(1),10);}
return{line:Math.max(line|0,1),column:Math.max(column|0,1)};}
_currentUISourceCode(){const sourcesView=self.UI.context.flavor(SourcesView);if(!sourcesView){return null;}
return sourcesView.currentUISourceCode();}
_currentSourceFrame(){const sourcesView=self.UI.context.flavor(SourcesView);if(!sourcesView){return null;}
return sourcesView.currentSourceFrame();}}
var GoToLineQuickOpen$1=Object.freeze({__proto__:null,GoToLineQuickOpen:GoToLineQuickOpen});class InplaceFormatterEditorAction{_editorSelected(event){const uiSourceCode=(event.data);this._updateButton(uiSourceCode);}
_editorClosed(event){const wasSelected=(event.data.wasSelected);if(wasSelected){this._updateButton(null);}}
_updateButton(uiSourceCode){const isFormattable=this._isFormattable(uiSourceCode);this._button.element.classList.toggle('hidden',!isFormattable);if(isFormattable){this._button.setTitle(UIString.UIString(`Format ${uiSourceCode.name()}`));}}
button(sourcesView){if(this._button){return this._button;}
this._sourcesView=sourcesView;this._sourcesView.addEventListener(Events$2.EditorSelected,this._editorSelected.bind(this));this._sourcesView.addEventListener(Events$2.EditorClosed,this._editorClosed.bind(this));this._button=new Toolbar.ToolbarButton(UIString.UIString('Format'),'largeicon-pretty-print');this._button.addEventListener(Toolbar.ToolbarButton.Events.Click,this._formatSourceInPlace,this);this._updateButton(sourcesView.currentUISourceCode());return this._button;}
_isFormattable(uiSourceCode){if(!uiSourceCode){return false;}
if(uiSourceCode.project().canSetFileContent()){return true;}
if(self.Persistence.persistence.binding(uiSourceCode)){return true;}
return uiSourceCode.contentType().isStyleSheet();}
_formatSourceInPlace(event){const uiSourceCode=this._sourcesView.currentUISourceCode();if(!this._isFormattable(uiSourceCode)){return;}
if(uiSourceCode.isDirty()){this._contentLoaded(uiSourceCode,uiSourceCode.workingCopy());}else{uiSourceCode.requestContent().then(deferredContent=>{this._contentLoaded(uiSourceCode,deferredContent.content);});}}
_contentLoaded(uiSourceCode,content){const highlighterType=uiSourceCode.mimeType();ScriptFormatter.FormatterInterface.format(uiSourceCode.contentType(),highlighterType,content,(formattedContent,formatterMapping)=>{this._formattingComplete(uiSourceCode,formattedContent,formatterMapping);});}
_formattingComplete(uiSourceCode,formattedContent,formatterMapping){if(uiSourceCode.workingCopy()===formattedContent){return;}
const sourceFrame=this._sourcesView.viewForFile(uiSourceCode);let start=[0,0];if(sourceFrame){const selection=sourceFrame.selection();start=formatterMapping.originalToFormatted(selection.startLine,selection.startColumn);}
uiSourceCode.setWorkingCopy(formattedContent);this._sourcesView.showSourceLocation(uiSourceCode,start[0],start[1]);}}
var InplaceFormatterEditorAction$1=Object.freeze({__proto__:null,InplaceFormatterEditorAction:InplaceFormatterEditorAction});class JavaScriptBreakpointsSidebarPane extends ThrottledWidget.ThrottledWidget{constructor(){super(true);this.registerRequiredCSS('sources/javaScriptBreakpointsSidebarPane.css');this._breakpointManager=BreakpointManager.BreakpointManager.instance();this._breakpointManager.addEventListener(BreakpointManager.Events.BreakpointAdded,this.update,this);this._breakpointManager.addEventListener(BreakpointManager.Events.BreakpointRemoved,this.update,this);Settings.Settings.instance().moduleSetting('breakpointsActive').addChangeListener(this.update,this);this._breakpoints=new ListModel.ListModel();this._list=new ListControl.ListControl(this._breakpoints,this,ListControl.ListMode.NonViewport);ARIAUtils.markAsList(this._list.element);this.contentElement.appendChild(this._list.element);this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=ls`No breakpoints`;this._emptyElement.tabIndex=-1;this.update();}
async doUpdate(){const hadFocus=this.hasFocus();const breakpointLocations=this._breakpointManager.allBreakpointLocations().filter(breakpointLocation=>breakpointLocation.uiLocation.uiSourceCode.project().type()!==Workspace.projectTypes.Debugger);if(!breakpointLocations.length){this._list.element.classList.add('hidden');this._emptyElement.classList.remove('hidden');this._breakpoints.replaceAll([]);this._didUpdateForTest();return Promise.resolve();}
this._list.element.classList.remove('hidden');this._emptyElement.classList.add('hidden');breakpointLocations.sort((item1,item2)=>item1.uiLocation.compareTo(item2.uiLocation));const breakpointEntriesForLine=new Platform.Multimap();const locationForEntry=new Platform.Multimap();for(const breakpointLocation of breakpointLocations){const uiLocation=breakpointLocation.uiLocation;const entryDescriptor=`${uiLocation.uiSourceCode.url()}:${uiLocation.lineNumber}:${uiLocation.columnNumber}`;locationForEntry.set(entryDescriptor,breakpointLocation);const lineDescriptor=`${uiLocation.uiSourceCode.url()}:${uiLocation.lineNumber}`;breakpointEntriesForLine.set(lineDescriptor,entryDescriptor);}
const details=self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails);const selectedUILocation=details&&details.callFrames.length?await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(details.callFrames[0].location()):null;let shouldShowView=false;const promises=[];const breakpoints=[];let itemToSelect;for(const descriptor of locationForEntry.keysArray()){const locations=Array.from(locationForEntry.get(descriptor));const breakpointLocation=locations[0];const uiLocation=breakpointLocation.uiLocation;const isSelected=!!selectedUILocation&&locations.some(location=>location.uiLocation.id()===selectedUILocation.id());const showColumn=breakpointEntriesForLine.get(`${uiLocation.uiSourceCode.url()}:${uiLocation.lineNumber}`).size>1;const content=uiLocation.uiSourceCode.requestContent();promises.push(content);const item={breakpointLocation,locations,isSelected,showColumn,content};breakpoints.push(item);if(this._list.selectedItem()&&this._list.selectedItem().breakpointLocation.breakpoint===breakpointLocation.breakpoint){itemToSelect=item;}
if(isSelected){shouldShowView=true;}}
if(shouldShowView){ViewManager.ViewManager.instance().showView('sources.jsBreakpoints');}
this._list.element.classList.toggle('breakpoints-list-deactivated',!Settings.Settings.instance().moduleSetting('breakpointsActive').get());this._breakpoints.replaceAll(breakpoints);this._list.selectItem(itemToSelect||this._breakpoints.at(0));if(hadFocus){this.focus();}
return Promise.all(promises).then(()=>this._didUpdateForTest());}
createElementForItem(item){const element=createElementWithClass('div','breakpoint-entry');ARIAUtils.markAsListitem(element);element.tabIndex=this._list.selectedItem()===item?0:-1;element.addEventListener('contextmenu',this._breakpointContextMenu.bind(this),true);element.addEventListener('click',this._revealLocation.bind(this,element),false);const checkboxLabel=UIUtils.CheckboxLabel.create('');const uiLocation=item.locations[0].uiLocation;const hasEnabled=item.locations.some(location=>location.breakpoint.enabled());const hasDisabled=item.locations.some(location=>!location.breakpoint.enabled());checkboxLabel.textElement.textContent=uiLocation.linkText()+(item.showColumn?':'+(uiLocation.columnNumber+1):'');checkboxLabel.checkboxElement.checked=hasEnabled;checkboxLabel.checkboxElement.indeterminate=hasEnabled&&hasDisabled;checkboxLabel.checkboxElement.tabIndex=-1;checkboxLabel.addEventListener('click',this._breakpointCheckboxClicked.bind(this),false);element.appendChild(checkboxLabel);let checkedDescription=hasEnabled?ls`checked`:ls`unchecked`;if(hasEnabled&&hasDisabled){checkedDescription=ls`mixed`;}
if(item.isSelected){ARIAUtils.setDescription(element,ls`${checkedDescription} breakpoint hit`);element.classList.add('breakpoint-hit');this.setDefaultFocusedElement(element);}else{ARIAUtils.setDescription(element,checkedDescription);}
element.addEventListener('keydown',event=>{if(event.key===' '){checkboxLabel.checkboxElement.click();event.consume(true);}});const snippetElement=element.createChild('div','source-text monospace');item.content.then(content=>{const lineNumber=uiLocation.lineNumber;const text=new Text.Text(content.content||'');if(lineNumber<text.lineCount()){const lineText=text.lineAt(lineNumber);const maxSnippetLength=200;snippetElement.textContent=lineText.substring(item.showColumn?uiLocation.columnNumber:0).trimEndWithMaxLength(maxSnippetLength);}});element[breakpointLocationsSymbol]=item.locations;element[locationSymbol]=uiLocation;return element;}
heightForItem(item){return 0;}
isItemSelectable(item){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.tabIndex=-1;}
if(toElement){toElement.tabIndex=0;this.setDefaultFocusedElement(toElement);if(this.hasFocus()){toElement.focus();}}}
updateSelectedItemARIA(fromElement,toElement){return true;}
_breakpointLocations(event){if(event.target instanceof Element){return this._breakpointLocationsForElement(event.target);}
return[];}
_breakpointLocationsForElement(element){const node=element.enclosingNodeOrSelfWithClass('breakpoint-entry');if(!node){return[];}
return node[breakpointLocationsSymbol]||[];}
_breakpointCheckboxClicked(event){const hadFocus=this.hasFocus();const breakpoints=this._breakpointLocations(event).map(breakpointLocation=>breakpointLocation.breakpoint);const newState=event.target.checkboxElement.checked;for(const breakpoint of breakpoints){breakpoint.setEnabled(newState);const item=this._breakpoints.find(breakpointItem=>breakpointItem.breakpointLocation.breakpoint===breakpoint);if(item){this._list.refreshItem(item);}}
if(hadFocus){this.focus();}
event.consume();}
_revealLocation(element){const uiLocations=this._breakpointLocationsForElement(element).map(breakpointLocation=>breakpointLocation.uiLocation);let uiLocation=null;for(const uiLocationCandidate of uiLocations){if(!uiLocation||uiLocationCandidate.columnNumber<uiLocation.columnNumber){uiLocation=uiLocationCandidate;}}
if(uiLocation){Revealer.reveal(uiLocation);}}
_breakpointContextMenu(event){const breakpoints=this._breakpointLocations(event).map(breakpointLocation=>breakpointLocation.breakpoint);const contextMenu=new ContextMenu.ContextMenu(event);const removeEntryTitle=breakpoints.length>1?UIString.UIString('Remove all breakpoints in line'):UIString.UIString('Remove breakpoint');contextMenu.defaultSection().appendItem(removeEntryTitle,()=>breakpoints.map(breakpoint=>breakpoint.remove(false)));if(event.target instanceof Element){contextMenu.defaultSection().appendItem(ls`Reveal location`,this._revealLocation.bind(this,event.target));}
const breakpointActive=Settings.Settings.instance().moduleSetting('breakpointsActive').get();const breakpointActiveTitle=breakpointActive?UIString.UIString('Deactivate breakpoints'):UIString.UIString('Activate breakpoints');contextMenu.defaultSection().appendItem(breakpointActiveTitle,()=>Settings.Settings.instance().moduleSetting('breakpointsActive').set(!breakpointActive));if(breakpoints.some(breakpoint=>!breakpoint.enabled())){const enableTitle=UIString.UIString('Enable all breakpoints');contextMenu.defaultSection().appendItem(enableTitle,this._toggleAllBreakpoints.bind(this,true));}
if(breakpoints.some(breakpoint=>breakpoint.enabled())){const disableTitle=UIString.UIString('Disable all breakpoints');contextMenu.defaultSection().appendItem(disableTitle,this._toggleAllBreakpoints.bind(this,false));}
const removeAllTitle=UIString.UIString('Remove all breakpoints');contextMenu.defaultSection().appendItem(removeAllTitle,this._removeAllBreakpoints.bind(this));const removeOtherTitle=UIString.UIString('Remove other breakpoints');contextMenu.defaultSection().appendItem(removeOtherTitle,this._removeOtherBreakpoints.bind(this,new Set(breakpoints)));contextMenu.show();}
_toggleAllBreakpoints(toggleState){for(const breakpointLocation of this._breakpointManager.allBreakpointLocations()){breakpointLocation.breakpoint.setEnabled(toggleState);}}
_removeAllBreakpoints(){for(const breakpointLocation of this._breakpointManager.allBreakpointLocations()){breakpointLocation.breakpoint.remove(false);}}
_removeOtherBreakpoints(selectedBreakpoints){for(const breakpointLocation of this._breakpointManager.allBreakpointLocations()){if(!selectedBreakpoints.has(breakpointLocation.breakpoint)){breakpointLocation.breakpoint.remove(false);}}}
flavorChanged(object){this.update();}
_didUpdateForTest(){}}
const locationSymbol=Symbol('location');const checkboxLabelSymbol=Symbol('checkbox-label');const snippetElementSymbol=Symbol('snippet-element');const breakpointLocationsSymbol=Symbol('locations');let Breakpoint;let BreakpointItem;var JavaScriptBreakpointsSidebarPane$1=Object.freeze({__proto__:null,JavaScriptBreakpointsSidebarPane:JavaScriptBreakpointsSidebarPane,locationSymbol:locationSymbol,checkboxLabelSymbol:checkboxLabelSymbol,snippetElementSymbol:snippetElementSymbol,breakpointLocationsSymbol:breakpointLocationsSymbol,Breakpoint:Breakpoint,BreakpointItem:BreakpointItem});class OpenFileQuickOpen extends FilteredUISourceCodeListProvider{attach(){this.setDefaultScores(SourcesView.defaultUISourceCodeScores());super.attach();}
uiSourceCodeSelected(uiSourceCode,lineNumber,columnNumber){userMetrics.actionTaken(UserMetrics.Action.SelectFileFromFilePicker);if(!uiSourceCode){return;}
if(typeof lineNumber==='number'){Revealer.reveal(uiSourceCode.uiLocation(lineNumber,columnNumber));}else{Revealer.reveal(uiSourceCode);}}
filterProject(project){return!project.isServiceProject();}
renderAsTwoRows(){return true;}}
var OpenFileQuickOpen$1=Object.freeze({__proto__:null,OpenFileQuickOpen:OpenFileQuickOpen});class OutlineQuickOpen extends FilteredListWidget.Provider{constructor(){super();this._items=[];this._active=false;}
attach(){this._items=[];this._active=false;const uiSourceCode=this._currentUISourceCode();if(uiSourceCode){this._active=FormatterWorkerPool.formatterWorkerPool().outlineForMimetype(uiSourceCode.workingCopy(),uiSourceCode.contentType().canonicalMimeType(),this._didBuildOutlineChunk.bind(this));}}
_didBuildOutlineChunk(isLastChunk,items){this._items.push(...items);this.refresh();}
itemCount(){return this._items.length;}
itemKeyAt(itemIndex){const item=this._items[itemIndex];return item.title+(item.subtitle?item.subtitle:'');}
itemScoreAt(itemIndex,query){const item=this._items[itemIndex];const methodName=query.split('(')[0];if(methodName.toLowerCase()===item.title.toLowerCase()){return 1/(1+item.line);}
return-item.line-1;}
renderItem(itemIndex,query,titleElement,subtitleElement){const item=this._items[itemIndex];titleElement.textContent=item.title+(item.subtitle?item.subtitle:'');FilteredListWidget.FilteredListWidget.highlightRanges(titleElement,query);subtitleElement.textContent=':'+(item.line+1);}
selectItem(itemIndex,promptValue){if(itemIndex===null){return;}
const uiSourceCode=this._currentUISourceCode();if(!uiSourceCode){return;}
const lineNumber=this._items[itemIndex].line;if(!isNaN(lineNumber)&&lineNumber>=0){Revealer.reveal(uiSourceCode.uiLocation(lineNumber,this._items[itemIndex].column));}}
_currentUISourceCode(){const sourcesView=self.UI.context.flavor(SourcesView);if(!sourcesView){return null;}
return sourcesView.currentUISourceCode();}
notFoundText(){if(!this._currentUISourceCode()){return UIString.UIString('No file selected.');}
if(!this._active){return UIString.UIString('Open a JavaScript or CSS file to see symbols');}
return UIString.UIString('No results found');}}
var OutlineQuickOpen$1=Object.freeze({__proto__:null,OutlineQuickOpen:OutlineQuickOpen});class ScopeChainSidebarPaneBase extends Widget.VBox{constructor(){super(true);this.registerRequiredCSS('sources/scopeChainSidebarPane.css');this._treeOutline=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline();this._treeOutline.registerRequiredCSS('sources/scopeChainSidebarPane.css');this._treeOutline.setShowSelectionOnKeyboardFocus(true);this._expandController=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeExpandController(this._treeOutline);this._linkifier=new Linkifier$1.Linkifier();this._infoElement=createElement('div');this._infoElement.className='gray-info-message';this._infoElement.textContent=ls`Not paused`;this._infoElement.tabIndex=-1;this._update();}
flavorChanged(object){this._update();}
focus(){if(this.hasFocus()){return;}
if(self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails)){this._treeOutline.forceSelect();}}
_getScopeChain(callFrame){return[];}
_update(){const callFrame=self.UI.context.flavor(DebuggerModel.CallFrame);const details=self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails);this._linkifier.reset();resolveThisObject(callFrame).then(this._innerUpdate.bind(this,details,callFrame));}
_innerUpdate(details,callFrame,thisObject){this._treeOutline.removeChildren();this.contentElement.removeChildren();if(!details||!callFrame){this.contentElement.appendChild(this._infoElement);return;}
this.contentElement.appendChild(this._treeOutline.element);let foundLocalScope=false;const scopeChain=this._getScopeChain(callFrame);if(scopeChain){for(let i=0;i<scopeChain.length;++i){const scope=scopeChain[i];const extraProperties=this._extraPropertiesForScope(scope,details,callFrame,thisObject,i===0);if(scope.type()===Protocol.Debugger.ScopeType.Local){foundLocalScope=true;}
const section=this._createScopeSectionTreeElement(scope,extraProperties);if(scope.type()===Protocol.Debugger.ScopeType.Global){section.collapse();}else if(!foundLocalScope||scope.type()===Protocol.Debugger.ScopeType.Local){section.expand();}
this._treeOutline.appendChild(section);if(i===0){section.select(true);}}}
this._sidebarPaneUpdatedForTest();}
_createScopeSectionTreeElement(scope,extraProperties){let emptyPlaceholder=null;if(scope.type()===Protocol.Debugger.ScopeType.Local||Protocol.Debugger.ScopeType.Closure){emptyPlaceholder=ls`No variables`;}
let title=scope.typeName();if(scope.type()===Protocol.Debugger.ScopeType.Closure){const scopeName=scope.name();if(scopeName){title=ls`Closure (${UIUtils.beautifyFunctionName(scopeName)})`;}else{title=ls`Closure`;}}
let subtitle=scope.description();if(!title||title===subtitle){subtitle=undefined;}
const titleElement=createElementWithClass('div','scope-chain-sidebar-pane-section-header tree-element-title');titleElement.createChild('div','scope-chain-sidebar-pane-section-subtitle').textContent=subtitle;titleElement.createChild('div','scope-chain-sidebar-pane-section-title').textContent=title;const section=new ObjectPropertiesSection.RootElement(resolveScopeInObject(scope),this._linkifier,emptyPlaceholder,true,extraProperties);section.title=titleElement;section.listItemElement.classList.add('scope-chain-sidebar-pane-section');this._expandController.watchSection(title+(subtitle?':'+subtitle:''),section);return section;}
_extraPropertiesForScope(scope,details,callFrame,thisObject,isFirstScope){if(scope.type()!==Protocol.Debugger.ScopeType.Local){return[];}
const extraProperties=[];if(thisObject){extraProperties.push(new RemoteObject$1.RemoteObjectProperty('this',thisObject));}
if(isFirstScope){const exception=details.exception();if(exception){extraProperties.push(new RemoteObject$1.RemoteObjectProperty(UIString.UIString('Exception'),exception,undefined,undefined,undefined,undefined,undefined,true));}
const returnValue=callFrame.returnValue();if(returnValue){extraProperties.push(new RemoteObject$1.RemoteObjectProperty(UIString.UIString('Return value'),returnValue,undefined,undefined,undefined,undefined,undefined,true,callFrame.setReturnValue.bind(callFrame)));}}
return extraProperties;}
_sidebarPaneUpdatedForTest(){}}
class SourceScopeChainSidebarPane extends ScopeChainSidebarPaneBase{constructor(){super();}
_getScopeChain(callFrame){return callFrame.sourceScopeChain;}}
class ScopeChainSidebarPane extends ScopeChainSidebarPaneBase{_getScopeChain(callFrame){return callFrame.scopeChain();}}
const pathSymbol=Symbol('path');var ScopeChainSidebarPane$1=Object.freeze({__proto__:null,ScopeChainSidebarPaneBase:ScopeChainSidebarPaneBase,SourceScopeChainSidebarPane:SourceScopeChainSidebarPane,ScopeChainSidebarPane:ScopeChainSidebarPane,pathSymbol:pathSymbol});class ScriptFormatterEditorAction{constructor(){this._pathsToFormatOnLoad=new Set();}
_editorSelected(event){const uiSourceCode=(event.data);this._updateButton(uiSourceCode);if(this._isFormatableScript(uiSourceCode)&&this._pathsToFormatOnLoad.has(uiSourceCode.url())&&!sourceFormatter.hasFormatted(uiSourceCode)){this._showFormatted(uiSourceCode);}}
async _editorClosed(event){const uiSourceCode=(event.data.uiSourceCode);const wasSelected=(event.data.wasSelected);if(wasSelected){this._updateButton(null);}
const original=await sourceFormatter.discardFormattedUISourceCode(uiSourceCode);if(original){this._pathsToFormatOnLoad.delete(original.url());}}
_updateButton(uiSourceCode){const isFormattable=this._isFormatableScript(uiSourceCode);this._button.element.classList.toggle('hidden',!isFormattable);if(isFormattable){this._button.setTitle(UIString.UIString(`Pretty print ${uiSourceCode.name()}`));}}
button(sourcesView){if(this._button){return this._button;}
this._sourcesView=sourcesView;this._sourcesView.addEventListener(Events$2.EditorSelected,event=>{this._editorSelected(event);});this._sourcesView.addEventListener(Events$2.EditorClosed,event=>{this._editorClosed(event);});this._button=new Toolbar.ToolbarButton(UIString.UIString('Pretty print'),'largeicon-pretty-print');this._button.addEventListener(Toolbar.ToolbarButton.Events.Click,this.toggleFormatScriptSource,this);this._updateButton(sourcesView.currentUISourceCode());return this._button;}
_isFormatableScript(uiSourceCode){if(!uiSourceCode){return false;}
if(uiSourceCode.project().canSetFileContent()){return false;}
if(uiSourceCode.project().type()===Workspace.projectTypes.Formatter){return false;}
if(self.Persistence.persistence.binding(uiSourceCode)){return false;}
return uiSourceCode.contentType().hasScripts();}
toggleFormatScriptSource(event){const uiSourceCode=this._sourcesView.currentUISourceCode();if(!this._isFormatableScript(uiSourceCode)){return;}
this._pathsToFormatOnLoad.add(uiSourceCode.url());this._showFormatted(uiSourceCode);}
async _showFormatted(uiSourceCode){const formatData=await sourceFormatter.format(uiSourceCode);if(uiSourceCode!==this._sourcesView.currentUISourceCode()){return;}
const sourceFrame=this._sourcesView.viewForFile(uiSourceCode);let start=[0,0];if(sourceFrame){const selection=sourceFrame.selection();start=formatData.mapping.originalToFormatted(selection.startLine,selection.startColumn);}
this._sourcesView.showSourceLocation(formatData.formattedSourceCode,start[0],start[1]);}}
var ScriptFormatterEditorAction$1=Object.freeze({__proto__:null,ScriptFormatterEditorAction:ScriptFormatterEditorAction});class NetworkNavigatorView extends NavigatorView{constructor(){super();SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.InspectedURLChanged,this._inspectedURLChanged,this);userMetrics.panelLoaded('sources','DevTools.Launch.Sources');}
acceptProject(project){return project.type()===Workspace.projectTypes.Network;}
_inspectedURLChanged(event){const mainTarget=SDKModel.TargetManager.instance().mainTarget();if(event.data!==mainTarget){return;}
const inspectedURL=mainTarget&&mainTarget.inspectedURL();if(!inspectedURL){return;}
for(const uiSourceCode of this.workspace().uiSourceCodes()){if(this.acceptProject(uiSourceCode.project())&&uiSourceCode.url()===inspectedURL){this.revealUISourceCode(uiSourceCode,true);}}}
uiSourceCodeAdded(uiSourceCode){const mainTarget=SDKModel.TargetManager.instance().mainTarget();const inspectedURL=mainTarget&&mainTarget.inspectedURL();if(!inspectedURL){return;}
if(uiSourceCode.url()===inspectedURL){this.revealUISourceCode(uiSourceCode,true);}}}
class FilesNavigatorView extends NavigatorView{constructor(){super();const placeholder=new EmptyWidget.EmptyWidget('');this.setPlaceholder(placeholder);placeholder.appendParagraph().appendChild(Fragment.html`
      <div>${ls`Sync changes in DevTools with the local filesystem`}</div><br />
      ${XLink.XLink.create('https://developers.google.com/web/tools/chrome-devtools/workspaces/', ls`Learn more`)}
    `);const toolbar=new Toolbar.Toolbar('navigator-toolbar');toolbar.appendItemsAtLocation('files-navigator-toolbar').then(()=>{if(!toolbar.empty()){this.contentElement.insertBefore(toolbar.element,this.contentElement.firstChild);}});}
acceptProject(project){return project.type()===Workspace.projectTypes.FileSystem&&FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(project)!=='overrides'&&!ScriptSnippetFileSystem.isSnippetsProject(project);}
handleContextMenu(event){const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.defaultSection().appendAction('sources.add-folder-to-workspace',undefined,true);contextMenu.show();}}
class OverridesNavigatorView extends NavigatorView{constructor(){super();const placeholder=new EmptyWidget.EmptyWidget('');this.setPlaceholder(placeholder);placeholder.appendParagraph().appendChild(Fragment.html`
      <div>${ls`Override page assets with files from a local folder`}</div><br />
      ${XLink.XLink.create('https://developers.google.com/web/updates/2018/01/devtools#overrides', ls`Learn more`)}
    `);this._toolbar=new Toolbar.Toolbar('navigator-toolbar');this.contentElement.insertBefore(this._toolbar.element,this.contentElement.firstChild);self.Persistence.networkPersistenceManager.addEventListener(NetworkPersistenceManager.Events.ProjectChanged,this._updateProjectAndUI,this);this.workspace().addEventListener(Workspace.Events.ProjectAdded,this._onProjectAddOrRemoved,this);this.workspace().addEventListener(Workspace.Events.ProjectRemoved,this._onProjectAddOrRemoved,this);this._updateProjectAndUI();}
_onProjectAddOrRemoved(event){const project=(event.data);if(project&&project.type()===Workspace.projectTypes.FileSystem&&FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(project)!=='overrides'){return;}
this._updateUI();}
_updateProjectAndUI(){this.reset();const project=self.Persistence.networkPersistenceManager.project();if(project){this.tryAddProject(project);}
this._updateUI();}
_updateUI(){this._toolbar.removeToolbarItems();const project=self.Persistence.networkPersistenceManager.project();if(project){const enableCheckbox=new Toolbar.ToolbarSettingCheckbox(Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled'));this._toolbar.appendToolbarItem(enableCheckbox);this._toolbar.appendToolbarItem(new Toolbar.ToolbarSeparator(true));const clearButton=new Toolbar.ToolbarButton(UIString.UIString('Clear configuration'),'largeicon-clear');clearButton.addEventListener(Toolbar.ToolbarButton.Events.Click,()=>{project.remove();});this._toolbar.appendToolbarItem(clearButton);return;}
const title=UIString.UIString('Select folder for overrides');const setupButton=new Toolbar.ToolbarButton(title,'largeicon-add',title);setupButton.addEventListener(Toolbar.ToolbarButton.Events.Click,event=>{this._setupNewWorkspace();},this);this._toolbar.appendToolbarItem(setupButton);}
async _setupNewWorkspace(){const fileSystem=await IsolatedFileSystemManager.IsolatedFileSystemManager.instance().addFileSystem('overrides');if(!fileSystem){return;}
Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled').set(true);}
acceptProject(project){return project===self.Persistence.networkPersistenceManager.project();}}
class ContentScriptsNavigatorView extends NavigatorView{constructor(){super();const placeholder=new EmptyWidget.EmptyWidget('');this.setPlaceholder(placeholder);placeholder.appendParagraph().appendChild(Fragment.html`
      <div>${ls`Content scripts served by extensions appear here`}</div><br />
      ${XLink.XLink.create('https://developer.chrome.com/extensions/content_scripts', ls`Learn more`)}
    `);}
acceptProject(project){return project.type()===Workspace.projectTypes.ContentScripts;}}
class SnippetsNavigatorView extends NavigatorView{constructor(){super();const placeholder=new EmptyWidget.EmptyWidget('');this.setPlaceholder(placeholder);placeholder.appendParagraph().appendChild(Fragment.html`
      <div>${ls`Create and save code snippets for later reuse`}</div><br />
      ${
        XLink.XLink.create(
            'https://developers.google.com/web/tools/chrome-devtools/javascript/snippets', ls`Learn more`)}
    `);const toolbar=new Toolbar.Toolbar('navigator-toolbar');const newButton=new Toolbar.ToolbarButton(ls`New snippet`,'largeicon-add',UIString.UIString('New snippet'));newButton.addEventListener(Toolbar.ToolbarButton.Events.Click,event=>{this.create(self.Snippets.project,'');});toolbar.appendToolbarItem(newButton);this.contentElement.insertBefore(toolbar.element,this.contentElement.firstChild);}
acceptProject(project){return ScriptSnippetFileSystem.isSnippetsProject(project);}
handleContextMenu(event){const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.headerSection().appendItem(ls`Create new snippet`,()=>this.create(self.Snippets.project,''));contextMenu.show();}
handleFileContextMenu(event,node){const uiSourceCode=node.uiSourceCode();const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.headerSection().appendItem(UIString.UIString('Run'),()=>ScriptSnippetFileSystem.evaluateScriptSnippet(uiSourceCode));contextMenu.editSection().appendItem(UIString.UIString('Rename…'),()=>this.rename(node,false));contextMenu.editSection().appendItem(UIString.UIString('Remove'),()=>uiSourceCode.project().deleteFile(uiSourceCode));contextMenu.saveSection().appendItem(UIString.UIString('Save as...'),this._handleSaveAs.bind(this,uiSourceCode));contextMenu.show();}
async _handleSaveAs(uiSourceCode){uiSourceCode.commitWorkingCopy();const{content}=await uiSourceCode.requestContent();self.Workspace.fileManager.save(uiSourceCode.url(),content||'',true);self.Workspace.fileManager.close(uiSourceCode.url());}}
class ActionDelegate$3{handleAction(context,actionId){switch(actionId){case'sources.create-snippet':self.Snippets.project.createFile('',null,'').then(uiSourceCode=>Revealer.reveal(uiSourceCode));return true;case'sources.add-folder-to-workspace':IsolatedFileSystemManager.IsolatedFileSystemManager.instance().addFileSystem();return true;}
return false;}}
var SourcesNavigator=Object.freeze({__proto__:null,NetworkNavigatorView:NetworkNavigatorView,FilesNavigatorView:FilesNavigatorView,OverridesNavigatorView:OverridesNavigatorView,ContentScriptsNavigatorView:ContentScriptsNavigatorView,SnippetsNavigatorView:SnippetsNavigatorView,ActionDelegate:ActionDelegate$3});class WatchExpressionsSidebarPane extends ThrottledWidget.ThrottledWidget{constructor(){super(true);this.registerRequiredCSS('object_ui/objectValue.css');this.registerRequiredCSS('sources/watchExpressionsSidebarPane.css');this._watchExpressions=[];this._watchExpressionsSetting=Settings.Settings.instance().createLocalSetting('watchExpressions',[]);this._addButton=new Toolbar.ToolbarButton(ls`Add watch expression`,'largeicon-add');this._addButton.addEventListener(Toolbar.ToolbarButton.Events.Click,event=>{this._addButtonClicked();});this._refreshButton=new Toolbar.ToolbarButton(ls`Refresh watch expressions`,'largeicon-refresh');this._refreshButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this.update,this);this.contentElement.classList.add('watch-expressions');this.contentElement.addEventListener('contextmenu',this._contextMenu.bind(this),false);this._treeOutline=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline();this._treeOutline.registerRequiredCSS('sources/watchExpressionsSidebarPane.css');this._treeOutline.setShowSelectionOnKeyboardFocus(true);this._expandController=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeExpandController(this._treeOutline);self.UI.context.addFlavorChangeListener(RuntimeModel.ExecutionContext,this.update,this);self.UI.context.addFlavorChangeListener(DebuggerModel.CallFrame,this.update,this);this._linkifier=new Linkifier$1.Linkifier();this.update();}
toolbarItems(){return[this._addButton,this._refreshButton];}
focus(){if(this.hasFocus()){return;}
if(this._watchExpressions.length>0){this._treeOutline.forceSelect();}}
hasExpressions(){return!!this._watchExpressionsSetting.get().length;}
_saveExpressions(){const toSave=[];for(let i=0;i<this._watchExpressions.length;i++){if(this._watchExpressions[i].expression()){toSave.push(this._watchExpressions[i].expression());}}
this._watchExpressionsSetting.set(toSave);}
async _addButtonClicked(){await ViewManager.ViewManager.instance().showView('sources.watch');this._createWatchExpression(null).startEditing();}
doUpdate(){this._linkifier.reset();this.contentElement.removeChildren();this._treeOutline.removeChildren();this._watchExpressions=[];this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=UIString.UIString('No watch expressions');this._emptyElement.tabIndex=-1;const watchExpressionStrings=this._watchExpressionsSetting.get();for(let i=0;i<watchExpressionStrings.length;++i){const expression=watchExpressionStrings[i];if(!expression){continue;}
this._createWatchExpression(expression);}
return Promise.resolve();}
_createWatchExpression(expression){this._emptyElement.classList.add('hidden');this.contentElement.appendChild(this._treeOutline.element);const watchExpression=new WatchExpression(expression,this._expandController,this._linkifier);watchExpression.addEventListener(WatchExpression.Events.ExpressionUpdated,this._watchExpressionUpdated,this);this._treeOutline.appendChild(watchExpression.treeElement());this._watchExpressions.push(watchExpression);return watchExpression;}
_watchExpressionUpdated(event){const watchExpression=(event.data);if(!watchExpression.expression()){ArrayUtilities.removeElement(this._watchExpressions,watchExpression);this._treeOutline.removeChild(watchExpression.treeElement());this._emptyElement.classList.toggle('hidden',!!this._watchExpressions.length);if(this._watchExpressions.length===0){this._treeOutline.element.remove();}}
this._saveExpressions();}
_contextMenu(event){const contextMenu=new ContextMenu.ContextMenu(event);this._populateContextMenu(contextMenu,event);contextMenu.show();}
_populateContextMenu(contextMenu,event){let isEditing=false;for(const watchExpression of this._watchExpressions){isEditing|=watchExpression.isEditing();}
if(!isEditing){contextMenu.debugSection().appendItem(UIString.UIString('Add watch expression'),this._addButtonClicked.bind(this));}
if(this._watchExpressions.length>1){contextMenu.debugSection().appendItem(UIString.UIString('Delete all watch expressions'),this._deleteAllButtonClicked.bind(this));}
const treeElement=this._treeOutline.treeElementFromEvent(event);if(!treeElement){return;}
const currentWatchExpression=this._watchExpressions.find(watchExpression=>treeElement.hasAncestorOrSelf(watchExpression.treeElement()));currentWatchExpression._populateContextMenu(contextMenu,event);}
_deleteAllButtonClicked(){this._watchExpressions=[];this._saveExpressions();this.update();}
_focusAndAddExpressionToWatch(expression){ViewManager.ViewManager.instance().showView('sources.watch');this.doUpdate();this._addExpressionToWatch(expression);}
_addExpressionToWatch(expression){this._createWatchExpression(expression);this._saveExpressions();}
handleAction(context,actionId){const frame=self.UI.context.flavor(UISourceCodeFrame);if(!frame){return false;}
const text=frame.textEditor.text(frame.textEditor.selection());this._focusAndAddExpressionToWatch(text);return true;}
_addPropertyPathToWatch(target){this._addExpressionToWatch(target.path());}
appendApplicableItems(event,contextMenu,target){if(target instanceof ObjectPropertiesSection.ObjectPropertyTreeElement&&!target.property.synthetic){contextMenu.debugSection().appendItem(ls`Add property path to watch`,this._addPropertyPathToWatch.bind(this,target));}
const frame=self.UI.context.flavor(UISourceCodeFrame);if(!frame||frame.textEditor.selection().isEmpty()){return;}
contextMenu.debugSection().appendAction('sources.add-to-watch');}}
class WatchExpression extends ObjectWrapper.ObjectWrapper{constructor(expression,expandController,linkifier){super();this._expression=expression;this._expandController=expandController;this._element=createElementWithClass('div','watch-expression monospace');this._editing=false;this._linkifier=linkifier;this._createWatchExpression();this.update();}
treeElement(){return this._treeElement;}
expression(){return this._expression;}
update(){const currentExecutionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(currentExecutionContext&&this._expression){currentExecutionContext.evaluate({expression:this._expression,objectGroup:WatchExpression._watchObjectGroupId,includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:false},false,false).then(result=>this._createWatchExpression(result.object,result.exceptionDetails));}}
startEditing(){this._editing=true;this._element.removeChildren();const newDiv=this._element.createChild('div');newDiv.textContent=this._nameElement.textContent;this._textPrompt=new ObjectPropertiesSection.ObjectPropertyPrompt();this._textPrompt.renderAsBlock();const proxyElement=this._textPrompt.attachAndStartEditing(newDiv,this._finishEditing.bind(this));this._treeElement.listItemElement.classList.add('watch-expression-editing');proxyElement.classList.add('watch-expression-text-prompt-proxy');proxyElement.addEventListener('keydown',this._promptKeyDown.bind(this),false);this._element.getComponentSelection().selectAllChildren(newDiv);}
isEditing(){return!!this._editing;}
_finishEditing(event,canceled){if(event){event.consume(canceled);}
this._editing=false;this._treeElement.listItemElement.classList.remove('watch-expression-editing');this._textPrompt.detach();const newExpression=canceled?this._expression:this._textPrompt.text();delete this._textPrompt;this._element.removeChildren();this._updateExpression(newExpression);}
_dblClickOnWatchExpression(event){event.consume();if(!this.isEditing()){this.startEditing();}}
_updateExpression(newExpression){if(this._expression){this._expandController.stopWatchSectionsWithId(this._expression);}
this._expression=newExpression;this.update();this.dispatchEventToListeners(WatchExpression.Events.ExpressionUpdated,this);}
_deleteWatchExpression(event){event.consume(true);this._updateExpression(null);}
_createWatchExpression(result,exceptionDetails){this._result=result||null;this._element.removeChildren();const oldTreeElement=this._treeElement;this._createWatchExpressionTreeElement(result,exceptionDetails);if(oldTreeElement&&oldTreeElement.parent){const root=oldTreeElement.parent;const index=root.indexOfChild(oldTreeElement);root.removeChild(oldTreeElement);root.insertChild(this._treeElement,index);}
this._treeElement.select();}
_createWatchExpressionHeader(expressionValue,exceptionDetails){const headerElement=this._element.createChild('div','watch-expression-header');const deleteButton=Icon.Icon.create('smallicon-cross','watch-expression-delete-button');deleteButton.title=ls`Delete watch expression`;deleteButton.addEventListener('click',this._deleteWatchExpression.bind(this),false);headerElement.appendChild(deleteButton);const titleElement=headerElement.createChild('div','watch-expression-title tree-element-title');this._nameElement=ObjectPropertiesSection.ObjectPropertiesSection.createNameElement(this._expression);if(!!exceptionDetails||!expressionValue){this._valueElement=createElementWithClass('span','watch-expression-error value');titleElement.classList.add('dimmed');this._valueElement.textContent=UIString.UIString('<not available>');}else{const propertyValue=ObjectPropertiesSection.ObjectPropertiesSection.createPropertyValueWithCustomSupport(expressionValue,!!exceptionDetails,false,titleElement,this._linkifier);this._valueElement=propertyValue.element;}
const separatorElement=createElementWithClass('span','watch-expressions-separator');separatorElement.textContent=': ';titleElement.appendChildren(this._nameElement,separatorElement,this._valueElement);return headerElement;}
_createWatchExpressionTreeElement(expressionValue,exceptionDetails){const headerElement=this._createWatchExpressionHeader(expressionValue,exceptionDetails);if(!exceptionDetails&&expressionValue&&expressionValue.hasChildren&&!expressionValue.customPreview()){headerElement.classList.add('watch-expression-object-header');this._treeElement=new ObjectPropertiesSection.RootElement(expressionValue,this._linkifier);this._expandController.watchSection((this._expression),this._treeElement);this._treeElement.toggleOnClick=false;this._treeElement.listItemElement.addEventListener('click',this._onSectionClick.bind(this),false);this._treeElement.listItemElement.addEventListener('dblclick',this._dblClickOnWatchExpression.bind(this));}else{headerElement.addEventListener('dblclick',this._dblClickOnWatchExpression.bind(this));this._treeElement=new TreeOutline.TreeElement();}
this._treeElement.title=this._element;this._treeElement.listItemElement.classList.add('watch-expression-tree-item');this._treeElement.listItemElement.addEventListener('keydown',event=>{if(isEnterKey(event)&&!this.isEditing()){this.startEditing();event.consume(true);}});}
_onSectionClick(event){event.consume(true);if(event.detail===1){this._preventClickTimeout=setTimeout(handleClick.bind(this),333);}else{clearTimeout(this._preventClickTimeout);delete this._preventClickTimeout;}
function handleClick(){if(!this._treeElement){return;}
if(this._treeElement.expanded){this._treeElement.collapse();}else{this._treeElement.expand();}}}
_promptKeyDown(event){if(isEnterKey(event)||isEscKey(event)){this._finishEditing(event,isEscKey(event));}}
_populateContextMenu(contextMenu,event){if(!this.isEditing()){contextMenu.editSection().appendItem(UIString.UIString('Delete watch expression'),this._updateExpression.bind(this,null));}
if(!this.isEditing()&&this._result&&(this._result.type==='number'||this._result.type==='string')){contextMenu.clipboardSection().appendItem(UIString.UIString('Copy value'),this._copyValueButtonClicked.bind(this));}
const target=event.deepElementFromPoint();if(target&&this._valueElement.isSelfOrAncestor(target)){contextMenu.appendApplicableItems(this._result);}}
_copyValueButtonClicked(){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(this._valueElement.textContent);}}
WatchExpression._watchObjectGroupId='watch-group';WatchExpression.Events={ExpressionUpdated:Symbol('ExpressionUpdated')};var WatchExpressionsSidebarPane$1=Object.freeze({__proto__:null,WatchExpressionsSidebarPane:WatchExpressionsSidebarPane,WatchExpression:WatchExpression});export{AddSourceMapURLDialog$1 as AddSourceMapURLDialog,BreakpointEditDialog$1 as BreakpointEditDialog,CSSPlugin$1 as CSSPlugin,CallStackSidebarPane$1 as CallStackSidebarPane,CoveragePlugin$1 as CoveragePlugin,DebuggerPausedMessage$1 as DebuggerPausedMessage,DebuggerPlugin$1 as DebuggerPlugin,EditingLocationHistoryManager$1 as EditingLocationHistoryManager,FilePathScoreFunction$1 as FilePathScoreFunction,FilteredUISourceCodeListProvider$1 as FilteredUISourceCodeListProvider,GoToLineQuickOpen$1 as GoToLineQuickOpen,GutterDiffPlugin$1 as GutterDiffPlugin,InplaceFormatterEditorAction$1 as InplaceFormatterEditorAction,JavaScriptBreakpointsSidebarPane$1 as JavaScriptBreakpointsSidebarPane,JavaScriptCompilerPlugin$1 as JavaScriptCompilerPlugin,NavigatorView$1 as NavigatorView,OpenFileQuickOpen$1 as OpenFileQuickOpen,OutlineQuickOpen$1 as OutlineQuickOpen,Plugin$1 as Plugin,ScopeChainSidebarPane$1 as ScopeChainSidebarPane,ScriptFormatterEditorAction$1 as ScriptFormatterEditorAction,ScriptOriginPlugin$1 as ScriptOriginPlugin,SearchSourcesView$1 as SearchSourcesView,SimpleHistoryManager$1 as SimpleHistoryManager,SnippetsPlugin$1 as SnippetsPlugin,SourceMapNamesResolver,SourcesNavigator,SourcesPanel$1 as SourcesPanel,SourcesSearchScope$1 as SourcesSearchScope,SourcesView$1 as SourcesView,TabbedEditorContainer$1 as TabbedEditorContainer,ThreadsSidebarPane$1 as ThreadsSidebarPane,UISourceCodeFrame$1 as UISourceCodeFrame,WatchExpressionsSidebarPane$1 as WatchExpressionsSidebarPane};