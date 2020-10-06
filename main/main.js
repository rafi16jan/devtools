import{Settings,UIString,AppProvider,QueryParamHandler,Console,Revealer}from'../common/common.js';import{RuntimeModel,SDKModel,ResourceTreeModel,ConsoleModel,NetworkManager,DOMDebuggerModel,DebuggerModel}from'../sdk/sdk.js';import{ViewManager,UIUtils,ZoomManager,InspectorView,ContextMenu,Tooltip,ShortcutsScreen,ActionRegistry,ShortcutRegistry,KeyboardShortcut,SearchableView,Toolbar,RootView}from'../ui/ui.js';import{NetworkProject,ResourceMapping,PresentationConsoleMessageHelper,CSSWorkspaceBinding,DebuggerWorkspaceBinding,BreakpointManager,BlackboxManager}from'../bindings/bindings.js';import*as Components from'../components/components.js';import{Reload,DockController}from'../components/components.js';import{ExtensionServer}from'../extensions/extensions.js';import{InspectorFrontendHost,Platform,InspectorFrontendHostAPI,userMetrics,UserMetrics}from'../host/host.js';import{IsolatedFileSystemManager,FileSystemWorkspaceBinding,Persistence,NetworkPersistenceManager}from'../persistence/persistence.js';import{NumberUtilities}from'../platform/platform.js';import{InspectorBackend}from'../protocol_client/protocol_client.js';import{FileManager,Workspace}from'../workspace/workspace.js';class ExecutionContextSelector{constructor(targetManager,context){context.addFlavorChangeListener(RuntimeModel.ExecutionContext,this._executionContextChanged,this);context.addFlavorChangeListener(SDKModel.Target,this._targetChanged,this);targetManager.addModelListener(RuntimeModel.RuntimeModel,RuntimeModel.Events.ExecutionContextCreated,this._onExecutionContextCreated,this);targetManager.addModelListener(RuntimeModel.RuntimeModel,RuntimeModel.Events.ExecutionContextDestroyed,this._onExecutionContextDestroyed,this);targetManager.addModelListener(RuntimeModel.RuntimeModel,RuntimeModel.Events.ExecutionContextOrderChanged,this._onExecutionContextOrderChanged,this);this._targetManager=targetManager;this._context=context;targetManager.observeModels(RuntimeModel.RuntimeModel,this);}
modelAdded(runtimeModel){setImmediate(deferred.bind(this));function deferred(){if(!this._context.flavor(SDKModel.Target)){this._context.setFlavor(SDKModel.Target,runtimeModel.target());}}}
modelRemoved(runtimeModel){const currentExecutionContext=this._context.flavor(RuntimeModel.ExecutionContext);if(currentExecutionContext&&currentExecutionContext.runtimeModel===runtimeModel){this._currentExecutionContextGone();}
const models=this._targetManager.models(RuntimeModel.RuntimeModel);if(this._context.flavor(SDKModel.Target)===runtimeModel.target()&&models.length){this._context.setFlavor(SDKModel.Target,models[0].target());}}
_executionContextChanged(event){const newContext=(event.data);if(newContext){this._context.setFlavor(SDKModel.Target,newContext.target());if(!this._ignoreContextChanged){this._lastSelectedContextId=this._contextPersistentId(newContext);}}}
_contextPersistentId(executionContext){return executionContext.isDefault?executionContext.target().name()+':'+executionContext.frameId:'';}
_targetChanged(event){const newTarget=(event.data);const currentContext=this._context.flavor(RuntimeModel.ExecutionContext);if(!newTarget||(currentContext&&currentContext.target()===newTarget)){return;}
const runtimeModel=newTarget.model(RuntimeModel.RuntimeModel);const executionContexts=runtimeModel?runtimeModel.executionContexts():[];if(!executionContexts.length){return;}
let newContext=null;for(let i=0;i<executionContexts.length&&!newContext;++i){if(this._shouldSwitchToContext(executionContexts[i])){newContext=executionContexts[i];}}
for(let i=0;i<executionContexts.length&&!newContext;++i){if(this._isDefaultContext(executionContexts[i])){newContext=executionContexts[i];}}
this._ignoreContextChanged=true;this._context.setFlavor(RuntimeModel.ExecutionContext,newContext||executionContexts[0]);this._ignoreContextChanged=false;}
_shouldSwitchToContext(executionContext){if(this._lastSelectedContextId&&this._lastSelectedContextId===this._contextPersistentId(executionContext)){return true;}
if(!this._lastSelectedContextId&&this._isDefaultContext(executionContext)){return true;}
return false;}
_isDefaultContext(executionContext){if(!executionContext.isDefault||!executionContext.frameId){return false;}
if(executionContext.target().parentTarget()){return false;}
const resourceTreeModel=executionContext.target().model(ResourceTreeModel.ResourceTreeModel);const frame=resourceTreeModel&&resourceTreeModel.frameForId(executionContext.frameId);if(frame&&frame.isTopFrame()){return true;}
return false;}
_onExecutionContextCreated(event){this._switchContextIfNecessary((event.data));}
_onExecutionContextDestroyed(event){const executionContext=(event.data);if(this._context.flavor(RuntimeModel.ExecutionContext)===executionContext){this._currentExecutionContextGone();}}
_onExecutionContextOrderChanged(event){const runtimeModel=(event.data);const executionContexts=runtimeModel.executionContexts();for(let i=0;i<executionContexts.length;i++){if(this._switchContextIfNecessary(executionContexts[i])){break;}}}
_switchContextIfNecessary(executionContext){if(!this._context.flavor(RuntimeModel.ExecutionContext)||this._shouldSwitchToContext(executionContext)){this._ignoreContextChanged=true;this._context.setFlavor(RuntimeModel.ExecutionContext,executionContext);this._ignoreContextChanged=false;return true;}
return false;}
_currentExecutionContextGone(){const runtimeModels=this._targetManager.models(RuntimeModel.RuntimeModel);let newContext=null;for(let i=0;i<runtimeModels.length&&!newContext;++i){const executionContexts=runtimeModels[i].executionContexts();for(const executionContext of executionContexts){if(this._isDefaultContext(executionContext)){newContext=executionContext;break;}}}
if(!newContext){for(let i=0;i<runtimeModels.length&&!newContext;++i){const executionContexts=runtimeModels[i].executionContexts();if(executionContexts.length){newContext=executionContexts[0];break;}}}
this._ignoreContextChanged=true;this._context.setFlavor(RuntimeModel.ExecutionContext,newContext);this._ignoreContextChanged=false;}}
var ExecutionContextSelector$1=Object.freeze({__proto__:null,ExecutionContextSelector:ExecutionContextSelector});class MainImpl{constructor(){MainImpl._instanceForTest=this;runOnWindowLoad(this._loaded.bind(this));}
static time(label){if(InspectorFrontendHost.isUnderTest()){return;}
console.time(label);}
static timeEnd(label){if(InspectorFrontendHost.isUnderTest()){return;}
console.timeEnd(label);}
async _loaded(){console.timeStamp('Main._loaded');await Runtime.appStarted;Root.Runtime.setPlatform(Platform.platform());Root.Runtime.setL10nCallback(ls);InspectorFrontendHost.InspectorFrontendHostInstance.getPreferences(this._gotPreferences.bind(this));}
_gotPreferences(prefs){console.timeStamp('Main._gotPreferences');if(InspectorFrontendHost.isUnderTest(prefs)){self.runtime.useTestBase();}
this._createSettings(prefs);this._createAppUI();}
_createSettings(prefs){this._initializeExperiments();let storagePrefix='';if(Platform.isCustomDevtoolsFrontend()){storagePrefix='__custom__';}else if(!Root.Runtime.queryParam('can_dock')&&!!Root.Runtime.queryParam('debugFrontend')&&!InspectorFrontendHost.isUnderTest()){storagePrefix='__bundled__';}
let localStorage;if(!InspectorFrontendHost.isUnderTest()&&window.localStorage){localStorage=new Settings.SettingsStorage(window.localStorage,undefined,undefined,()=>window.localStorage.clear(),storagePrefix);}else{localStorage=new Settings.SettingsStorage({},undefined,undefined,undefined,storagePrefix);}
const globalStorage=new Settings.SettingsStorage(prefs,InspectorFrontendHost.InspectorFrontendHostInstance.setPreference,InspectorFrontendHost.InspectorFrontendHostInstance.removePreference,InspectorFrontendHost.InspectorFrontendHostInstance.clearPreferences,storagePrefix);Settings.Settings.instance({forceNew:true,globalStorage,localStorage});self.Common.settings=Settings.Settings.instance();if(!InspectorFrontendHost.isUnderTest()){new Settings.VersionController().updateVersion();}}
_initializeExperiments(){Root.Runtime.experiments.register('applyCustomStylesheet','Allow custom UI themes');Root.Runtime.experiments.register('captureNodeCreationStacks','Capture node creation stacks');Root.Runtime.experiments.register('sourcesPrettyPrint','Automatically pretty print in the Sources Panel');Root.Runtime.experiments.register('backgroundServices','Background web platform feature events',true);Root.Runtime.experiments.register('backgroundServicesNotifications','Background services section for Notifications');Root.Runtime.experiments.register('backgroundServicesPaymentHandler','Background services section for Payment Handler');Root.Runtime.experiments.register('backgroundServicesPushMessaging','Background services section for Push Messaging');Root.Runtime.experiments.register('blackboxJSFramesOnTimeline','Blackbox JavaScript frames on Timeline',true);Root.Runtime.experiments.register('cssOverview','CSS Overview');Root.Runtime.experiments.register('emptySourceMapAutoStepping','Empty sourcemap auto-stepping');Root.Runtime.experiments.register('inputEventsOnTimelineOverview','Input events on Timeline overview',true);Root.Runtime.experiments.register('liveHeapProfile','Live heap profile',true);Root.Runtime.experiments.register('mediaInspector','Media Element Inspection');Root.Runtime.experiments.register('nativeHeapProfiler','Native memory sampling heap profiler',true);Root.Runtime.experiments.register('protocolMonitor','Protocol Monitor');Root.Runtime.experiments.register('issuesPane','Issues Pane');Root.Runtime.experiments.register('recordCoverageWithPerformanceTracing','Record coverage while performance tracing');Root.Runtime.experiments.register('samplingHeapProfilerTimeline','Sampling heap profiler timeline',true);Root.Runtime.experiments.register('showOptionToNotTreatGlobalObjectsAsRoots','Show option to take heap snapshot where globals are not treated as root');Root.Runtime.experiments.register('sourceDiff','Source diff');Root.Runtime.experiments.register('spotlight','Spotlight',true);Root.Runtime.experiments.register('customKeyboardShortcuts','Enable custom keyboard shortcuts settings tab (requires reload)');Root.Runtime.experiments.register('timelineEventInitiators','Timeline: event initiators');Root.Runtime.experiments.register('timelineFlowEvents','Timeline: flow events',true);Root.Runtime.experiments.register('timelineInvalidationTracking','Timeline: invalidation tracking',true);Root.Runtime.experiments.register('timelineShowAllEvents','Timeline: show all events',true);Root.Runtime.experiments.register('timelineV8RuntimeCallStats','Timeline: V8 Runtime Call Stats on Timeline',true);Root.Runtime.experiments.register('timelineWebGL','Timeline: WebGL-based flamechart');Root.Runtime.experiments.register('timelineReplayEvent','Timeline: Replay input events',true);Root.Runtime.experiments.register('wasmDWARFDebugging','WebAssembly Debugging: Enable DWARF support');Root.Runtime.experiments.cleanUpStaleExperiments();const enabledExperiments=Root.Runtime.queryParam('enabledExperiments');if(enabledExperiments){Root.Runtime.experiments.setServerEnabledExperiments(enabledExperiments.split(';'));}
Root.Runtime.experiments.setDefaultExperiments(['backgroundServices','backgroundServicesNotifications','backgroundServicesPushMessaging','backgroundServicesPaymentHandler',]);if(InspectorFrontendHost.isUnderTest()&&Root.Runtime.queryParam('test').includes('live-line-level-heap-profile.js')){Root.Runtime.experiments.enableForTest('liveHeapProfile');}}
async _createAppUI(){MainImpl.time('Main._createAppUI');self.UI.viewManager=ViewManager.ViewManager.instance();self.Persistence.isolatedFileSystemManager=IsolatedFileSystemManager.IsolatedFileSystemManager.instance();const themeSetting=Settings.Settings.instance().createSetting('uiTheme','systemPreferred');UIUtils.initializeUIUtils(document,themeSetting);themeSetting.addChangeListener(Reload.reload.bind(Components));UIUtils.installComponentRootStyles((document.body));this._addMainEventListeners(document);const canDock=!!Root.Runtime.queryParam('can_dock');self.UI.zoomManager=ZoomManager.ZoomManager.instance({forceNew:true,win:window,frontendHost:InspectorFrontendHost.InspectorFrontendHostInstance});self.UI.inspectorView=InspectorView.InspectorView.instance();ContextMenu.ContextMenu.initialize();ContextMenu.ContextMenu.installHandler(document);Tooltip.Tooltip.installHandler(document);self.SDK.consoleModel=ConsoleModel.ConsoleModel.instance();self.Components.dockController=new DockController.DockController(canDock);self.SDK.multitargetNetworkManager=new NetworkManager.MultitargetNetworkManager();self.SDK.domDebuggerManager=new DOMDebuggerModel.DOMDebuggerManager();SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.SuspendStateChanged,this._onSuspendStateChanged.bind(this));self.UI.shortcutsScreen=new ShortcutsScreen.ShortcutsScreen();self.UI.shortcutsScreen.section(UIString.UIString('Elements Panel'));self.UI.shortcutsScreen.section(UIString.UIString('Styles Pane'));self.UI.shortcutsScreen.section(UIString.UIString('Debugger'));self.UI.shortcutsScreen.section(UIString.UIString('Console'));self.Workspace.fileManager=new FileManager.FileManager();self.Workspace.workspace=Workspace.WorkspaceImpl.instance();self.Bindings.networkProjectManager=NetworkProject.NetworkProjectManager.instance();self.Bindings.resourceMapping=ResourceMapping.ResourceMapping.instance({forceNew:true,targetManager:SDKModel.TargetManager.instance(),workspace:Workspace.WorkspaceImpl.instance()});new PresentationConsoleMessageHelper.PresentationConsoleMessageManager();self.Bindings.cssWorkspaceBinding=CSSWorkspaceBinding.CSSWorkspaceBinding.instance({forceNew:true,targetManager:SDKModel.TargetManager.instance(),workspace:Workspace.WorkspaceImpl.instance()});self.Bindings.debuggerWorkspaceBinding=DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew:true,targetManager:SDKModel.TargetManager.instance(),workspace:Workspace.WorkspaceImpl.instance()});self.Bindings.breakpointManager=BreakpointManager.BreakpointManager.instance({forceNew:true,workspace:Workspace.WorkspaceImpl.instance(),targetManager:SDKModel.TargetManager.instance(),debuggerWorkspaceBinding:DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance()});self.Extensions.extensionServer=new ExtensionServer.ExtensionServer();new FileSystemWorkspaceBinding.FileSystemWorkspaceBinding(IsolatedFileSystemManager.IsolatedFileSystemManager.instance(),Workspace.WorkspaceImpl.instance());self.Persistence.persistence=new Persistence.PersistenceImpl(Workspace.WorkspaceImpl.instance(),BreakpointManager.BreakpointManager.instance());self.Persistence.networkPersistenceManager=new NetworkPersistenceManager.NetworkPersistenceManager(Workspace.WorkspaceImpl.instance());new ExecutionContextSelector(SDKModel.TargetManager.instance(),self.UI.context);self.Bindings.blackboxManager=BlackboxManager.BlackboxManager.instance({forceNew:true,debuggerWorkspaceBinding:DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance()});new PauseListener();self.UI.actionRegistry=new ActionRegistry.ActionRegistry();self.UI.shortcutRegistry=new ShortcutRegistry.ShortcutRegistry(self.UI.actionRegistry);ShortcutsScreen.ShortcutsScreen.registerShortcuts();this._registerForwardedShortcuts();this._registerMessageSinkListener();MainImpl.timeEnd('Main._createAppUI');this._showAppUI(await self.runtime.extension(AppProvider.AppProvider).instance());}
_showAppUI(appProvider){MainImpl.time('Main._showAppUI');const app=(appProvider).createApp();self.Components.dockController.initialize();app.presentUI(document);const toggleSearchNodeAction=self.UI.actionRegistry.action('elements.toggle-element-search');if(toggleSearchNodeAction){InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.EnterInspectElementMode,()=>{toggleSearchNodeAction.execute();},this);}
InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(InspectorFrontendHostAPI.Events.RevealSourceLine,this._revealSourceLine,this);self.UI.inspectorView.createToolbars();InspectorFrontendHost.InspectorFrontendHostInstance.loadCompleted();const extensions=self.runtime.extensions(QueryParamHandler.QueryParamHandler);for(const extension of extensions){const value=Root.Runtime.queryParam(extension.descriptor()['name']);if(value!==null){extension.instance().then(handleQueryParam.bind(null,value));}}
function handleQueryParam(value,handler){handler.handleQueryParam(value);}
setTimeout(this._initializeTarget.bind(this),0);MainImpl.timeEnd('Main._showAppUI');}
async _initializeTarget(){MainImpl.time('Main._initializeTarget');const instances=await Promise.all(self.runtime.extensions('early-initialization').map(extension=>extension.instance()));for(const instance of instances){await(instance).run();}
InspectorFrontendHost.InspectorFrontendHostInstance.readyForTest();setTimeout(this._lateInitialization.bind(this),100);MainImpl.timeEnd('Main._initializeTarget');}
_lateInitialization(){MainImpl.time('Main._lateInitialization');this._registerShortcuts();self.Extensions.extensionServer.initializeExtensions();const extensions=self.runtime.extensions('late-initialization');const promises=[];for(const extension of extensions){const setting=extension.descriptor()['setting'];if(!setting||Settings.Settings.instance().moduleSetting(setting).get()){promises.push(extension.instance().then(instance=>((instance)).run()));continue;}
async function changeListener(event){if(!event.data){return;}
Settings.Settings.instance().moduleSetting(setting).removeChangeListener(changeListener);((await extension.instance())).run();}
Settings.Settings.instance().moduleSetting(setting).addChangeListener(changeListener);}
this._lateInitDonePromise=Promise.all(promises);MainImpl.timeEnd('Main._lateInitialization');}
lateInitDonePromiseForTest(){return this._lateInitDonePromise;}
_registerForwardedShortcuts(){const forwardedActions=['main.toggle-dock','debugger.toggle-breakpoints-active','debugger.toggle-pause','commandMenu.show','console.show'];const actionKeys=self.UI.shortcutRegistry.keysForActions(forwardedActions).map(KeyboardShortcut.KeyboardShortcut.keyCodeAndModifiersFromKey);InspectorFrontendHost.InspectorFrontendHostInstance.setWhitelistedShortcuts(JSON.stringify(actionKeys));}
_registerMessageSinkListener(){Console.Console.instance().addEventListener(Console.Events.MessageAdded,messageAdded);function messageAdded(event){const message=(event.data);if(message.show){Console.Console.instance().show();}}}
_revealSourceLine(event){const url=(event.data['url']);const lineNumber=(event.data['lineNumber']);const columnNumber=(event.data['columnNumber']);const uiSourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);if(uiSourceCode){Revealer.reveal(uiSourceCode.uiLocation(lineNumber,columnNumber));return;}
function listener(event){const uiSourceCode=(event.data);if(uiSourceCode.url()===url){Revealer.reveal(uiSourceCode.uiLocation(lineNumber,columnNumber));Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Events.UISourceCodeAdded,listener);}}
Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeAdded,listener);}
_registerShortcuts(){const shortcut=KeyboardShortcut.KeyboardShortcut;const section=self.UI.shortcutsScreen.section(UIString.UIString('All Panels'));let keys=[shortcut.makeDescriptor('[',KeyboardShortcut.Modifiers.CtrlOrMeta),shortcut.makeDescriptor(']',KeyboardShortcut.Modifiers.CtrlOrMeta)];section.addRelatedKeys(keys,UIString.UIString('Go to the panel to the left/right'));const toggleConsoleLabel=UIString.UIString('Show console');section.addKey(shortcut.makeDescriptor(KeyboardShortcut.Keys.Tilde,KeyboardShortcut.Modifiers.Ctrl),toggleConsoleLabel);section.addKey(shortcut.makeDescriptor(KeyboardShortcut.Keys.Esc),UIString.UIString('Toggle drawer'));if(self.Components.dockController.canDock()){section.addKey(shortcut.makeDescriptor('M',KeyboardShortcut.Modifiers.CtrlOrMeta|KeyboardShortcut.Modifiers.Shift),UIString.UIString('Toggle device mode'));section.addKey(shortcut.makeDescriptor('D',KeyboardShortcut.Modifiers.CtrlOrMeta|KeyboardShortcut.Modifiers.Shift),UIString.UIString('Toggle dock side'));}
section.addKey(shortcut.makeDescriptor('f',KeyboardShortcut.Modifiers.CtrlOrMeta),UIString.UIString('Search'));const advancedSearchShortcutModifier=Platform.isMac()?KeyboardShortcut.Modifiers.Meta|KeyboardShortcut.Modifiers.Alt:KeyboardShortcut.Modifiers.Ctrl|KeyboardShortcut.Modifiers.Shift;const advancedSearchShortcut=shortcut.makeDescriptor('f',advancedSearchShortcutModifier);section.addKey(advancedSearchShortcut,UIString.UIString('Search across all sources'));const inspectElementModeShortcuts=self.UI.shortcutRegistry.shortcutDescriptorsForAction('elements.toggle-element-search');if(inspectElementModeShortcuts.length){section.addKey(inspectElementModeShortcuts[0],UIString.UIString('Select node to inspect'));}
const openResourceShortcut=KeyboardShortcut.KeyboardShortcut.makeDescriptor('p',KeyboardShortcut.Modifiers.CtrlOrMeta);section.addKey(openResourceShortcut,UIString.UIString('Go to source'));if(Platform.isMac()){keys=[shortcut.makeDescriptor('g',KeyboardShortcut.Modifiers.Meta),shortcut.makeDescriptor('g',KeyboardShortcut.Modifiers.Meta|KeyboardShortcut.Modifiers.Shift)];section.addRelatedKeys(keys,UIString.UIString('Find next/previous'));}}
_postDocumentKeyDown(event){if(!event.handled){self.UI.shortcutRegistry.handleShortcut(event);}}
_redispatchClipboardEvent(event){const eventCopy=new CustomEvent('clipboard-'+event.type,{bubbles:true});eventCopy['original']=event;const document=event.target&&event.target.ownerDocument;const target=document?document.deepActiveElement():null;if(target){target.dispatchEvent(eventCopy);}
if(eventCopy.handled){event.preventDefault();}}
_contextMenuEventFired(event){if(event.handled||event.target.classList.contains('popup-glasspane')){event.preventDefault();}}
_addMainEventListeners(document){document.addEventListener('keydown',this._postDocumentKeyDown.bind(this),false);document.addEventListener('beforecopy',this._redispatchClipboardEvent.bind(this),true);document.addEventListener('copy',this._redispatchClipboardEvent.bind(this),false);document.addEventListener('cut',this._redispatchClipboardEvent.bind(this),false);document.addEventListener('paste',this._redispatchClipboardEvent.bind(this),false);document.addEventListener('contextmenu',this._contextMenuEventFired.bind(this),true);}
_onSuspendStateChanged(){const suspended=SDKModel.TargetManager.instance().allTargetsSuspended();self.UI.inspectorView.onSuspendStateChanged(suspended);}}
class ZoomActionDelegate{handleAction(context,actionId){if(InspectorFrontendHost.InspectorFrontendHostInstance.isHostedMode()){return false;}
switch(actionId){case'main.zoom-in':InspectorFrontendHost.InspectorFrontendHostInstance.zoomIn();return true;case'main.zoom-out':InspectorFrontendHost.InspectorFrontendHostInstance.zoomOut();return true;case'main.zoom-reset':InspectorFrontendHost.InspectorFrontendHostInstance.resetZoom();return true;}
return false;}}
class SearchActionDelegate{handleAction(context,actionId){let searchableView=SearchableView.SearchableView.fromElement(document.deepActiveElement());if(!searchableView){const currentPanel=self.UI.inspectorView.currentPanelDeprecated();if(currentPanel){searchableView=currentPanel.searchableView();}
if(!searchableView){return false;}}
switch(actionId){case'main.search-in-panel.find':return searchableView.handleFindShortcut();case'main.search-in-panel.cancel':return searchableView.handleCancelSearchShortcut();case'main.search-in-panel.find-next':return searchableView.handleFindNextShortcut();case'main.search-in-panel.find-previous':return searchableView.handleFindPreviousShortcut();}
return false;}}
class MainMenuItem{constructor(){this._item=new Toolbar.ToolbarMenuButton(this._handleContextMenu.bind(this),true);this._item.setTitle(UIString.UIString('Customize and control DevTools'));}
item(){return this._item;}
_handleContextMenu(contextMenu){if(self.Components.dockController.canDock()){const dockItemElement=createElementWithClass('div','flex-centered flex-auto');dockItemElement.tabIndex=-1;const titleElement=dockItemElement.createChild('span','flex-auto');titleElement.textContent=UIString.UIString('Dock side');const toggleDockSideShorcuts=self.UI.shortcutRegistry.shortcutDescriptorsForAction('main.toggle-dock');titleElement.title=UIString.UIString('Placement of DevTools relative to the page. (%s to restore last position)',toggleDockSideShorcuts[0].name);dockItemElement.appendChild(titleElement);const dockItemToolbar=new Toolbar.Toolbar('',dockItemElement);if(Platform.isMac()&&!self.UI.themeSupport.hasTheme()){dockItemToolbar.makeBlueOnHover();}
const undock=new Toolbar.ToolbarToggle(UIString.UIString('Undock into separate window'),'largeicon-undock');const bottom=new Toolbar.ToolbarToggle(UIString.UIString('Dock to bottom'),'largeicon-dock-to-bottom');const right=new Toolbar.ToolbarToggle(UIString.UIString('Dock to right'),'largeicon-dock-to-right');const left=new Toolbar.ToolbarToggle(UIString.UIString('Dock to left'),'largeicon-dock-to-left');undock.addEventListener(Toolbar.ToolbarButton.Events.MouseDown,event=>event.data.consume());bottom.addEventListener(Toolbar.ToolbarButton.Events.MouseDown,event=>event.data.consume());right.addEventListener(Toolbar.ToolbarButton.Events.MouseDown,event=>event.data.consume());left.addEventListener(Toolbar.ToolbarButton.Events.MouseDown,event=>event.data.consume());undock.addEventListener(Toolbar.ToolbarButton.Events.Click,setDockSide.bind(null,DockController.State.Undocked));bottom.addEventListener(Toolbar.ToolbarButton.Events.Click,setDockSide.bind(null,DockController.State.DockedToBottom));right.addEventListener(Toolbar.ToolbarButton.Events.Click,setDockSide.bind(null,DockController.State.DockedToRight));left.addEventListener(Toolbar.ToolbarButton.Events.Click,setDockSide.bind(null,DockController.State.DockedToLeft));undock.setToggled(self.Components.dockController.dockSide()===DockController.State.Undocked);bottom.setToggled(self.Components.dockController.dockSide()===DockController.State.DockedToBottom);right.setToggled(self.Components.dockController.dockSide()===DockController.State.DockedToRight);left.setToggled(self.Components.dockController.dockSide()===DockController.State.DockedToLeft);dockItemToolbar.appendToolbarItem(undock);dockItemToolbar.appendToolbarItem(left);dockItemToolbar.appendToolbarItem(bottom);dockItemToolbar.appendToolbarItem(right);dockItemElement.addEventListener('keydown',event=>{let dir=0;if(event.key==='ArrowLeft'){dir=-1;}else if(event.key==='ArrowRight'){dir=1;}else{return;}
const buttons=[undock,left,bottom,right];let index=buttons.findIndex(button=>button.element.hasFocus());index=NumberUtilities.clamp(index+dir,0,buttons.length-1);buttons[index].element.focus();event.consume(true);});contextMenu.headerSection().appendCustomItem(dockItemElement);}
const button=this._item.element;function setDockSide(side){const hadKeyboardFocus=document.deepActiveElement().hasAttribute('data-keyboard-focus');self.Components.dockController.once(DockController.Events.AfterDockSideChanged).then(()=>{button.focus();if(hadKeyboardFocus){UIUtils.markAsFocusedByKeyboard(button);}});self.Components.dockController.setDockSide(side);contextMenu.discard();}
if(self.Components.dockController.dockSide()===DockController.State.Undocked&&SDKModel.TargetManager.instance().mainTarget()&&SDKModel.TargetManager.instance().mainTarget().type()===SDKModel.Type.Frame){contextMenu.defaultSection().appendAction('inspector_main.focus-debuggee',UIString.UIString('Focus debuggee'));}
contextMenu.defaultSection().appendAction('main.toggle-drawer',self.UI.inspectorView.drawerVisible()?UIString.UIString('Hide console drawer'):UIString.UIString('Show console drawer'));contextMenu.appendItemsAtLocation('mainMenu');const moreTools=contextMenu.defaultSection().appendSubMenuItem(UIString.UIString('More tools'));const extensions=self.runtime.extensions('view',undefined,true);for(const extension of extensions){const descriptor=extension.descriptor();if(descriptor['id']==='settings-default'){moreTools.defaultSection().appendItem(extension.title(),()=>{userMetrics.actionTaken(UserMetrics.Action.SettingsOpenedFromMenu);ViewManager.ViewManager.instance().showView('preferences',true);});continue;}
if(descriptor['persistence']!=='closeable'){continue;}
if(descriptor['location']!=='drawer-view'&&descriptor['location']!=='panel'){continue;}
moreTools.defaultSection().appendItem(extension.title(),ViewManager.ViewManager.instance().showView.bind(ViewManager.ViewManager.instance(),descriptor['id'],true));}
const helpSubMenu=contextMenu.footerSection().appendSubMenuItem(UIString.UIString('Help'));helpSubMenu.appendItemsAtLocation('mainMenuHelp');}}
class SettingsButtonProvider{constructor(){const settingsActionId='settings.show';this._settingsButton=Toolbar.Toolbar.createActionButtonForId(settingsActionId,{showLabel:false,userActionCode:UserMetrics.Action.SettingsOpenedFromGear});}
item(){return this._settingsButton;}}
class PauseListener{constructor(){SDKModel.TargetManager.instance().addModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerPaused,this._debuggerPaused,this);}
_debuggerPaused(event){SDKModel.TargetManager.instance().removeModelListener(DebuggerModel.DebuggerModel,DebuggerModel.Events.DebuggerPaused,this._debuggerPaused,this);const debuggerModel=(event.data);const debuggerPausedDetails=debuggerModel.debuggerPausedDetails();self.UI.context.setFlavor(SDKModel.Target,debuggerModel.target());Revealer.reveal(debuggerPausedDetails);}}
function sendOverProtocol(method,params){return new Promise((resolve,reject)=>{InspectorBackend.test.sendRawMessage(method,params,(err,...results)=>{if(err){return reject(err);}
return resolve(results);});});}
class ReloadActionDelegate{handleAction(context,actionId){switch(actionId){case'main.debug-reload':Reload.reload();return true;}
return false;}}
new MainImpl();var MainImpl$1=Object.freeze({__proto__:null,MainImpl:MainImpl,ZoomActionDelegate:ZoomActionDelegate,SearchActionDelegate:SearchActionDelegate,MainMenuItem:MainMenuItem,SettingsButtonProvider:SettingsButtonProvider,PauseListener:PauseListener,sendOverProtocol:sendOverProtocol,ReloadActionDelegate:ReloadActionDelegate});class SimpleApp{presentUI(document){const rootView=new RootView.RootView();self.UI.inspectorView.show(rootView.element);rootView.attachToDocument(document);rootView.focus();}}
class SimpleAppProvider{createApp(){return new SimpleApp();}}
var SimpleApp$1=Object.freeze({__proto__:null,'default':SimpleApp,SimpleAppProvider:SimpleAppProvider});export{ExecutionContextSelector$1 as ExecutionContextSelector,MainImpl$1 as MainImpl,SimpleApp$1 as SimpleApp};