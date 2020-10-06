import{UIString,Linkifier,Revealer}from'../common/common.js';import{SDKModel,DOMDebuggerModel,DebuggerModel,RuntimeModel}from'../sdk/sdk.js';import{Widget,ListModel,ListControl,ARIAUtils,UIUtils,ContextMenu,ViewManager,TreeOutline,Toolbar,InplaceEditor}from'../ui/ui.js';import{EventListenersView}from'../event_listeners/event_listeners.js';class DOMBreakpointsSidebarPane extends Widget.VBox{constructor(){super(true);this.registerRequiredCSS('browser_debugger/domBreakpointsSidebarPane.css');this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=UIString.UIString('No breakpoints');this._breakpoints=new ListModel.ListModel();this._list=new ListControl.ListControl(this._breakpoints,this,ListControl.ListMode.NonViewport);this.contentElement.appendChild(this._list.element);this._list.element.classList.add('breakpoint-list','hidden');ARIAUtils.markAsList(this._list.element);ARIAUtils.setAccessibleName(this._list.element,ls`DOM Breakpoints list`);this._emptyElement.tabIndex=-1;SDKModel.TargetManager.instance().addModelListener(DOMDebuggerModel.DOMDebuggerModel,DOMDebuggerModel.Events.DOMBreakpointAdded,this._breakpointAdded,this);SDKModel.TargetManager.instance().addModelListener(DOMDebuggerModel.DOMDebuggerModel,DOMDebuggerModel.Events.DOMBreakpointToggled,this._breakpointToggled,this);SDKModel.TargetManager.instance().addModelListener(DOMDebuggerModel.DOMDebuggerModel,DOMDebuggerModel.Events.DOMBreakpointsRemoved,this._breakpointsRemoved,this);for(const domDebuggerModel of SDKModel.TargetManager.instance().models(DOMDebuggerModel.DOMDebuggerModel)){domDebuggerModel.retrieveDOMBreakpoints();for(const breakpoint of domDebuggerModel.domBreakpoints()){this._addBreakpoint(breakpoint);}}
this._highlightedBreakpoint=null;this._update();}
createElementForItem(item){const element=createElementWithClass('div','breakpoint-entry');element.addEventListener('contextmenu',this._contextMenu.bind(this,item),true);ARIAUtils.markAsListitem(element);element.tabIndex=this._list.selectedItem()===item?0:-1;const checkboxLabel=UIUtils.CheckboxLabel.create('',item.enabled);const checkboxElement=checkboxLabel.checkboxElement;checkboxElement.addEventListener('click',this._checkboxClicked.bind(this,item),false);checkboxElement.tabIndex=-1;ARIAUtils.markAsHidden(checkboxLabel);element.appendChild(checkboxLabel);const labelElement=createElementWithClass('div','dom-breakpoint');element.appendChild(labelElement);element.addEventListener('keydown',event=>{if(event.key===' '){checkboxElement.click();event.consume(true);}});const description=createElement('div');const breakpointTypeLabel=BreakpointTypeLabels.get(item.type);description.textContent=breakpointTypeLabel;const linkifiedNode=createElementWithClass('monospace');linkifiedNode.style.display='block';labelElement.appendChild(linkifiedNode);Linkifier.Linkifier.linkify(item.node,{preventKeyboardFocus:true}).then(linkified=>{linkifiedNode.appendChild(linkified);ARIAUtils.setAccessibleName(checkboxElement,ls`${breakpointTypeLabel}: ${linkified.deepTextContent()}`);});labelElement.appendChild(description);const checkedStateText=item.enabled?ls`checked`:ls`unchecked`;if(item===this._highlightedBreakpoint){element.classList.add('breakpoint-hit');ARIAUtils.setDescription(element,ls`${checkedStateText} breakpoint hit`);}else{ARIAUtils.setDescription(element,checkedStateText);}
this._emptyElement.classList.add('hidden');this._list.element.classList.remove('hidden');return element;}
heightForItem(item){return 0;}
isItemSelectable(item){return true;}
updateSelectedItemARIA(fromElement,toElement){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.tabIndex=-1;}
if(toElement){this.setDefaultFocusedElement(toElement);toElement.tabIndex=0;if(this.hasFocus()){toElement.focus();}}}
_breakpointAdded(event){this._addBreakpoint((event.data));}
_breakpointToggled(event){const hadFocus=this.hasFocus();const breakpoint=(event.data);this._list.refreshItem(breakpoint);if(hadFocus){this.focus();}}
_breakpointsRemoved(event){const hadFocus=this.hasFocus();const breakpoints=(event.data);let lastIndex=-1;for(const breakpoint of breakpoints){const index=this._breakpoints.indexOf(breakpoint);if(index>=0){this._breakpoints.remove(index);lastIndex=index;}}
if(this._breakpoints.length===0){this._emptyElement.classList.remove('hidden');this.setDefaultFocusedElement(this._emptyElement);this._list.element.classList.add('hidden');}else if(lastIndex>=0){const breakpointToSelect=this._breakpoints.at(lastIndex);if(breakpointToSelect){this._list.selectItem(breakpointToSelect);}}
if(hadFocus){this.focus();}}
_addBreakpoint(breakpoint){this._breakpoints.insertWithComparator(breakpoint,(breakpointA,breakpointB)=>{if(breakpointA.type>breakpointB.type){return-1;}
if(breakpointA.type<breakpointB.type){return 1;}
return 0;});if(!this.hasFocus()){this._list.selectItem(this._breakpoints.at(0));}}
_contextMenu(breakpoint,event){const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.defaultSection().appendItem(ls`Reveal DOM node in Elements panel`,Revealer.reveal.bind(null,breakpoint.node));contextMenu.defaultSection().appendItem(UIString.UIString('Remove breakpoint'),()=>{breakpoint.domDebuggerModel.removeDOMBreakpoint(breakpoint.node,breakpoint.type);});contextMenu.defaultSection().appendItem(UIString.UIString('Remove all DOM breakpoints'),()=>{breakpoint.domDebuggerModel.removeAllDOMBreakpoints();});contextMenu.show();}
_checkboxClicked(breakpoint,event){breakpoint.domDebuggerModel.toggleDOMBreakpoint(breakpoint,event.target.checked);}
flavorChanged(object){this._update();}
_update(){const details=self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails);if(this._highlightedBreakpoint){const oldHighlightedBreakpoint=this._highlightedBreakpoint;delete this._highlightedBreakpoint;this._list.refreshItem(oldHighlightedBreakpoint);}
if(!details||!details.auxData||details.reason!==DebuggerModel.BreakReason.DOM){return;}
const domDebuggerModel=details.debuggerModel.target().model(DOMDebuggerModel.DOMDebuggerModel);if(!domDebuggerModel){return;}
const data=domDebuggerModel.resolveDOMBreakpointData((details.auxData));if(!data){return;}
for(const breakpoint of this._breakpoints){if(breakpoint.node===data.node&&breakpoint.type===data.type){this._highlightedBreakpoint=breakpoint;}}
if(this._highlightedBreakpoint){this._list.refreshItem(this._highlightedBreakpoint);}
ViewManager.ViewManager.instance().showView('sources.domBreakpoints');}}
const BreakpointTypeLabels=new Map([[Protocol.DOMDebugger.DOMBreakpointType.SubtreeModified,UIString.UIString('Subtree modified')],[Protocol.DOMDebugger.DOMBreakpointType.AttributeModified,UIString.UIString('Attribute modified')],[Protocol.DOMDebugger.DOMBreakpointType.NodeRemoved,UIString.UIString('Node removed')],]);class ContextMenuProvider{appendApplicableItems(event,contextMenu,object){const node=(object);if(node.pseudoType()){return;}
const domDebuggerModel=node.domModel().target().model(DOMDebuggerModel.DOMDebuggerModel);if(!domDebuggerModel){return;}
function toggleBreakpoint(type){if(domDebuggerModel.hasDOMBreakpoint(node,type)){domDebuggerModel.removeDOMBreakpoint(node,type);}else{domDebuggerModel.setDOMBreakpoint(node,type);}}
const breakpointsMenu=contextMenu.debugSection().appendSubMenuItem(UIString.UIString('Break on'));for(const key in Protocol.DOMDebugger.DOMBreakpointType){const type=Protocol.DOMDebugger.DOMBreakpointType[key];const label=Sources.DebuggerPausedMessage.BreakpointTypeNouns.get(type);breakpointsMenu.defaultSection().appendCheckboxItem(label,toggleBreakpoint.bind(null,type),domDebuggerModel.hasDOMBreakpoint(node,type));}}}
var DOMBreakpointsSidebarPane$1=Object.freeze({__proto__:null,DOMBreakpointsSidebarPane:DOMBreakpointsSidebarPane,BreakpointTypeLabels:BreakpointTypeLabels,ContextMenuProvider:ContextMenuProvider});class EventListenerBreakpointsSidebarPane extends Widget.VBox{constructor(){super(true);this._categoriesTreeOutline=new TreeOutline.TreeOutlineInShadow();this._categoriesTreeOutline.registerRequiredCSS('browser_debugger/eventListenerBreakpoints.css');this._categoriesTreeOutline.setShowSelectionOnKeyboardFocus(true);this.contentElement.appendChild(this._categoriesTreeOutline.element);this._categories=new Map();const categories=self.SDK.domDebuggerManager.eventListenerBreakpoints().map(breakpoint=>breakpoint.category());categories.sort();for(const category of categories){if(!this._categories.has(category)){this._createCategory(category);}}
if(categories.length>0){const firstCategory=this._categories.get(categories[0]);firstCategory.element.select();}
this._breakpoints=new Map();for(const breakpoint of self.SDK.domDebuggerManager.eventListenerBreakpoints()){this._createBreakpoint(breakpoint);}
SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerPaused,this._update,this);SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerResumed,this._update,this);self.UI.context.addFlavorChangeListener(SDKModel.Target,this._update,this);}
focus(){this._categoriesTreeOutline.forceSelect();}
_createCategory(name){const labelNode=UIUtils.CheckboxLabel.create(name);labelNode.checkboxElement.addEventListener('click',this._categoryCheckboxClicked.bind(this,name),true);labelNode.checkboxElement.tabIndex=-1;const treeElement=new TreeOutline.TreeElement(labelNode);treeElement.listItemElement.addEventListener('keydown',event=>{if(event.key===' '){this._categories.get(name).checkbox.click();event.consume(true);}});labelNode.checkboxElement.addEventListener('focus',()=>treeElement.listItemElement.focus());ARIAUtils.setChecked(treeElement.listItemElement,false);this._categoriesTreeOutline.appendChild(treeElement);this._categories.set(name,{element:treeElement,checkbox:labelNode.checkboxElement});}
_createBreakpoint(breakpoint){const labelNode=UIUtils.CheckboxLabel.create(breakpoint.title());labelNode.classList.add('source-code');labelNode.checkboxElement.addEventListener('click',this._breakpointCheckboxClicked.bind(this,breakpoint),true);labelNode.checkboxElement.tabIndex=-1;const treeElement=new TreeOutline.TreeElement(labelNode);treeElement.listItemElement.addEventListener('keydown',event=>{if(event.key===' '){this._breakpoints.get(breakpoint).checkbox.click();event.consume(true);}});labelNode.checkboxElement.addEventListener('focus',()=>treeElement.listItemElement.focus());ARIAUtils.setChecked(treeElement.listItemElement,false);treeElement.listItemElement.createChild('div','breakpoint-hit-marker');this._categories.get(breakpoint.category()).element.appendChild(treeElement);this._breakpoints.set(breakpoint,{element:treeElement,checkbox:labelNode.checkboxElement});}
_update(){const target=self.UI.context.flavor(SDKModel.Target);const debuggerModel=target?target.model(DebuggerModel.DebuggerModel):null;const details=debuggerModel?debuggerModel.debuggerPausedDetails():null;if(!details||details.reason!==DebuggerModel.BreakReason.EventListener||!details.auxData){if(this._highlightedElement){ARIAUtils.setDescription(this._highlightedElement,'');this._highlightedElement.classList.remove('breakpoint-hit');delete this._highlightedElement;}
return;}
const breakpoint=self.SDK.domDebuggerManager.resolveEventListenerBreakpoint((details.auxData));if(!breakpoint){return;}
ViewManager.ViewManager.instance().showView('sources.eventListenerBreakpoints');this._categories.get(breakpoint.category()).element.expand();this._highlightedElement=this._breakpoints.get(breakpoint).element.listItemElement;ARIAUtils.setDescription(this._highlightedElement,ls`breakpoint hit`);this._highlightedElement.classList.add('breakpoint-hit');}
_categoryCheckboxClicked(category){const item=this._categories.get(category);const enabled=item.checkbox.checked;ARIAUtils.setChecked(item.element.listItemElement,enabled);for(const breakpoint of this._breakpoints.keys()){if(breakpoint.category()===category){breakpoint.setEnabled(enabled);this._breakpoints.get(breakpoint).checkbox.checked=enabled;}}}
_breakpointCheckboxClicked(breakpoint){const item=this._breakpoints.get(breakpoint);breakpoint.setEnabled(item.checkbox.checked);ARIAUtils.setChecked(item.element.listItemElement,item.checkbox.checked);let hasEnabled=false;let hasDisabled=false;for(const other of this._breakpoints.keys()){if(other.category()===breakpoint.category()){if(other.enabled()){hasEnabled=true;}else{hasDisabled=true;}}}
const category=this._categories.get(breakpoint.category());category.checkbox.checked=hasEnabled;category.checkbox.indeterminate=hasEnabled&&hasDisabled;if(category.checkbox.indeterminate){ARIAUtils.setCheckboxAsIndeterminate(category.element.listItemElement);}else{ARIAUtils.setChecked(category.element.listItemElement,hasEnabled);}}}
let Item;var EventListenerBreakpointsSidebarPane$1=Object.freeze({__proto__:null,EventListenerBreakpointsSidebarPane:EventListenerBreakpointsSidebarPane,Item:Item});class ObjectEventListenersSidebarPane extends Widget.VBox{constructor(){super();this._refreshButton=new Toolbar.ToolbarButton(ls`Refresh global listeners`,'largeicon-refresh');this._refreshButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._refreshClick,this);this._refreshButton.setEnabled(false);this._eventListenersView=new EventListenersView.EventListenersView(this.update.bind(this));this._eventListenersView.show(this.element);this.setDefaultFocusedChild(this._eventListenersView);}
toolbarItems(){return[this._refreshButton];}
update(){if(this._lastRequestedContext){this._lastRequestedContext.runtimeModel.releaseObjectGroup(objectGroupName);delete this._lastRequestedContext;}
const executionContext=self.UI.context.flavor(RuntimeModel.ExecutionContext);if(!executionContext){this._eventListenersView.reset();this._eventListenersView.addEmptyHolderIfNeeded();return;}
this._lastRequestedContext=executionContext;Promise.all([this._windowObjectInContext(executionContext)]).then(this._eventListenersView.addObjects.bind(this._eventListenersView));}
wasShown(){super.wasShown();self.UI.context.addFlavorChangeListener(RuntimeModel.ExecutionContext,this.update,this);this._refreshButton.setEnabled(true);this.update();}
willHide(){super.willHide();self.UI.context.removeFlavorChangeListener(RuntimeModel.ExecutionContext,this.update,this);this._refreshButton.setEnabled(false);}
_windowObjectInContext(executionContext){return executionContext.evaluate({expression:'self',objectGroup:objectGroupName,includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:false},false,false).then(result=>result.object&&!result.exceptionDetails?result.object:null);}
_refreshClick(event){event.data.consume();this.update();}}
const objectGroupName='object-event-listeners-sidebar-pane';var ObjectEventListenersSidebarPane$1=Object.freeze({__proto__:null,ObjectEventListenersSidebarPane:ObjectEventListenersSidebarPane,objectGroupName:objectGroupName});class XHRBreakpointsSidebarPane extends Widget.VBox{constructor(){super(true);this.registerRequiredCSS('browser_debugger/xhrBreakpointsSidebarPane.css');this._breakpoints=new ListModel.ListModel();this._list=new ListControl.ListControl(this._breakpoints,this,ListControl.ListMode.NonViewport);this.contentElement.appendChild(this._list.element);this._list.element.classList.add('breakpoint-list','hidden');ARIAUtils.markAsList(this._list.element);ARIAUtils.setAccessibleName(this._list.element,ls`XHR/fetch Breakpoints`);this._emptyElement=this.contentElement.createChild('div','gray-info-message');this._emptyElement.textContent=UIString.UIString('No breakpoints');this._breakpointElements=new Map();this._addButton=new Toolbar.ToolbarButton(ls`Add XHR/fetch breakpoint`,'largeicon-add');this._addButton.addEventListener(Toolbar.ToolbarButton.Events.Click,event=>{this._addButtonClicked();});this._emptyElement.addEventListener('contextmenu',this._emptyElementContextMenu.bind(this),true);this._emptyElement.tabIndex=-1;this._restoreBreakpoints();this._update();}
toolbarItems(){return[this._addButton];}
_emptyElementContextMenu(event){const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.defaultSection().appendItem(UIString.UIString('Add breakpoint'),this._addButtonClicked.bind(this));contextMenu.show();}
async _addButtonClicked(){await ViewManager.ViewManager.instance().showView('sources.xhrBreakpoints');const inputElementContainer=createElementWithClass('p','breakpoint-condition');inputElementContainer.textContent=UIString.UIString('Break when URL contains:');const inputElement=inputElementContainer.createChild('span','breakpoint-condition-input');this._addListElement(inputElementContainer,(this._list.element.firstChild));function finishEditing(accept,e,text){this._removeListElement(inputElementContainer);if(accept){self.SDK.domDebuggerManager.addXHRBreakpoint(text,true);this._setBreakpoint(text);}
this._update();}
const config=new InplaceEditor.Config(finishEditing.bind(this,true),finishEditing.bind(this,false));InplaceEditor.InplaceEditor.startEditing(inputElement,config);}
heightForItem(item){return 0;}
isItemSelectable(item){return true;}
_setBreakpoint(url){if(this._breakpoints.indexOf(url)!==-1){this._list.refreshItem(url);}else{this._breakpoints.insertWithComparator(url,(a,b)=>{if(a>b){return 1;}
if(a<b){return-1;}
return 0;});}
if(!this._list.selectedItem()||!this.hasFocus()){this._list.selectItem(this._breakpoints.at(0));}}
createElementForItem(item){const listItemElement=createElement('div');ARIAUtils.markAsListitem(listItemElement);const element=listItemElement.createChild('div','breakpoint-entry');listItemElement.checkboxElement=element;const enabled=self.SDK.domDebuggerManager.xhrBreakpoints().get(item);ARIAUtils.markAsCheckbox(element);ARIAUtils.setChecked(element,enabled);element._url=item;element.addEventListener('contextmenu',this._contextMenu.bind(this,item),true);const title=item?UIString.UIString('URL contains "%s"',item):UIString.UIString('Any XHR or fetch');const label=UIUtils.CheckboxLabel.create(title,enabled);ARIAUtils.markAsHidden(label);ARIAUtils.setAccessibleName(element,title);element.appendChild(label);label.checkboxElement.addEventListener('click',this._checkboxClicked.bind(this,item,enabled),false);element.addEventListener('click',event=>{if(event.target===element){this._checkboxClicked(item,enabled);}},false);element._checkboxElement=label.checkboxElement;label.checkboxElement.tabIndex=-1;element.tabIndex=-1;if(item===this._list.selectedItem()){element.tabIndex=0;this.setDefaultFocusedElement(element);}
element.addEventListener('keydown',event=>{let handled=false;if(event.key===' '){this._checkboxClicked(item,enabled);handled=true;}else if(isEnterKey(event)){this._labelClicked(item);handled=true;}
if(handled){event.consume(true);}});if(item===this._hitBreakpoint){element.classList.add('breakpoint-hit');ARIAUtils.setDescription(element,ls`breakpoint hit`);}
label.classList.add('cursor-auto');label.textElement.addEventListener('dblclick',this._labelClicked.bind(this,item),false);this._breakpointElements.set(item,listItemElement);return listItemElement;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.checkboxElement.tabIndex=-1;}
if(toElement){this.setDefaultFocusedElement(toElement.checkboxElement);toElement.checkboxElement.tabIndex=0;if(this.hasFocus()){toElement.checkboxElement.focus();}}}
updateSelectedItemARIA(fromElement,toElement){return true;}
_removeBreakpoint(url){const index=this._breakpoints.indexOf(url);if(index>=0){this._breakpoints.remove(index);}
this._breakpointElements.delete(url);this._update();}
_addListElement(element,beforeNode){this._list.element.insertBefore(element,beforeNode);this._emptyElement.classList.add('hidden');this._list.element.classList.remove('hidden');}
_removeListElement(element){this._list.element.removeChild(element);if(!this._list.element.firstElementChild){this._emptyElement.classList.remove('hidden');this._list.element.classList.add('hidden');}}
_contextMenu(url,event){const contextMenu=new ContextMenu.ContextMenu(event);function removeBreakpoint(){self.SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);}
function removeAllBreakpoints(){for(const url of this._breakpointElements.keys()){self.SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);}
this._update();}
const removeAllTitle=UIString.UIString('Remove all breakpoints');contextMenu.defaultSection().appendItem(UIString.UIString('Add breakpoint'),this._addButtonClicked.bind(this));contextMenu.defaultSection().appendItem(UIString.UIString('Remove breakpoint'),removeBreakpoint.bind(this));contextMenu.defaultSection().appendItem(removeAllTitle,removeAllBreakpoints.bind(this));contextMenu.show();}
_checkboxClicked(url,checked){const hadFocus=this.hasFocus();self.SDK.domDebuggerManager.toggleXHRBreakpoint(url,!checked);this._list.refreshItem(url);this._list.selectItem(url);if(hadFocus){this.focus();}}
_labelClicked(url){const element=this._breakpointElements.get(url)||null;const inputElement=createElementWithClass('span','breakpoint-condition');inputElement.textContent=url;this._list.element.insertBefore(inputElement,element);element.classList.add('hidden');function finishEditing(accept,e,text){this._removeListElement(inputElement);if(accept){self.SDK.domDebuggerManager.removeXHRBreakpoint(url);this._removeBreakpoint(url);const enabled=element?element.checkboxElement._checkboxElement.checked:true;self.SDK.domDebuggerManager.addXHRBreakpoint(text,enabled);this._setBreakpoint(text);this._list.selectItem(text);}else{element.classList.remove('hidden');}
this.focus();}
InplaceEditor.InplaceEditor.startEditing(inputElement,new InplaceEditor.Config(finishEditing.bind(this,true),finishEditing.bind(this,false)));}
flavorChanged(object){this._update();}
_update(){const isEmpty=this._breakpoints.length===0;this._list.element.classList.toggle('hidden',isEmpty);this._emptyElement.classList.toggle('hidden',!isEmpty);const details=self.UI.context.flavor(DebuggerModel.DebuggerPausedDetails);if(!details||details.reason!==DebuggerModel.BreakReason.XHR){if(this._hitBreakpoint){const oldHitBreakpoint=this._hitBreakpoint;delete this._hitBreakpoint;if(this._breakpoints.indexOf(oldHitBreakpoint)>=0){this._list.refreshItem(oldHitBreakpoint);}}
return;}
const url=details.auxData['breakpointURL'];this._hitBreakpoint=url;if(this._breakpoints.indexOf(url)<0){return;}
this._list.refreshItem(url);ViewManager.ViewManager.instance().showView('sources.xhrBreakpoints');}
_restoreBreakpoints(){const breakpoints=self.SDK.domDebuggerManager.xhrBreakpoints();for(const url of breakpoints.keys()){this._setBreakpoint(url);}}}
var XHRBreakpointsSidebarPane$1=Object.freeze({__proto__:null,XHRBreakpointsSidebarPane:XHRBreakpointsSidebarPane});export{DOMBreakpointsSidebarPane$1 as DOMBreakpointsSidebarPane,EventListenerBreakpointsSidebarPane$1 as EventListenerBreakpointsSidebarPane,ObjectEventListenersSidebarPane$1 as ObjectEventListenersSidebarPane,XHRBreakpointsSidebarPane$1 as XHRBreakpointsSidebarPane};