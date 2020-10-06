import{UIString,Settings}from'../common/common.js';import{Diff}from'../diff/diff.js';import{userMetrics,UserMetrics,InspectorFrontendHost}from'../host/host.js';import{Widget,ARIAUtils,TextPrompt,ListModel,ListControl,UIUtils,Dialog,Geometry,GlassPane,ViewManager,View}from'../ui/ui.js';import{NumberUtilities}from'../platform/platform.js';import{TextRange}from'../text_utils/text_utils.js';class FilteredListWidget extends Widget.VBox{constructor(provider,promptHistory,queryChangedCallback){super(true);this._promptHistory=promptHistory||[];this.contentElement.classList.add('filtered-list-widget');this.contentElement.addEventListener('keydown',this._onKeyDown.bind(this),true);ARIAUtils.markAsCombobox(this.contentElement);this.registerRequiredCSS('quick_open/filteredListWidget.css');this._promptElement=this.contentElement.createChild('div','filtered-list-widget-input');ARIAUtils.setAccessibleName(this._promptElement,ls`Quick open prompt`);this._promptElement.setAttribute('spellcheck','false');this._promptElement.setAttribute('contenteditable','plaintext-only');this._prompt=new TextPrompt.TextPrompt();this._prompt.initialize(()=>Promise.resolve([]));const promptProxy=this._prompt.attach(this._promptElement);promptProxy.addEventListener('input',this._onInput.bind(this),false);promptProxy.classList.add('filtered-list-widget-prompt-element');this._bottomElementsContainer=this.contentElement.createChild('div','vbox');this._progressElement=this._bottomElementsContainer.createChild('div','filtered-list-widget-progress');this._progressBarElement=this._progressElement.createChild('div','filtered-list-widget-progress-bar');this._items=new ListModel.ListModel();this._list=new ListControl.ListControl(this._items,this,ListControl.ListMode.EqualHeightItems);this._itemElementsContainer=this._list.element;this._itemElementsContainer.classList.add('container');this._bottomElementsContainer.appendChild(this._itemElementsContainer);this._itemElementsContainer.addEventListener('click',this._onClick.bind(this),false);ARIAUtils.markAsListBox(this._itemElementsContainer);ARIAUtils.setControls(this._promptElement,this._itemElementsContainer);ARIAUtils.setAutocomplete(this._promptElement,ARIAUtils.AutocompleteInteractionModel.list);this._notFoundElement=this._bottomElementsContainer.createChild('div','not-found-text');this._notFoundElement.classList.add('hidden');this.setDefaultFocusedElement(this._promptElement);this._prefix='';this._provider=provider;this._queryChangedCallback=queryChangedCallback;}
static highlightRanges(element,query,caseInsensitive){if(!query){return false;}
function rangesForMatch(text,query){const opcodes=Diff.DiffWrapper.charDiff(query,text);let offset=0;const ranges=[];for(let i=0;i<opcodes.length;++i){const opcode=opcodes[i];if(opcode[0]===Diff.Operation.Equal){ranges.push(new TextRange.SourceRange(offset,opcode[1].length));}else if(opcode[0]!==Diff.Operation.Insert){return null;}
offset+=opcode[1].length;}
return ranges;}
const text=element.textContent;let ranges=rangesForMatch(text,query);if(!ranges||caseInsensitive){ranges=rangesForMatch(text.toUpperCase(),query.toUpperCase());}
if(ranges){UIUtils.highlightRangesWithStyleClass(element,ranges,'highlight');return true;}
return false;}
setPlaceholder(placeholder,ariaPlaceholder){this._prompt.setPlaceholder(placeholder,ariaPlaceholder);}
showAsDialog(){this._dialog=new Dialog.Dialog();ARIAUtils.setAccessibleName(this._dialog.contentElement,ls`Quick open`);this._dialog.setMaxContentSize(new Geometry.Size(504,340));this._dialog.setSizeBehavior(GlassPane.SizeBehavior.SetExactWidthMaxHeight);this._dialog.setContentPosition(null,22);this.show(this._dialog.contentElement);ARIAUtils.setExpanded(this.contentElement,true);this._dialog.show();}
setPrefix(prefix){this._prefix=prefix;}
setProvider(provider){if(provider===this._provider){return;}
if(this._provider){this._provider.detach();}
this._clearTimers();this._provider=provider;if(this.isShowing()){this._attachProvider();}}
_attachProvider(){this._items.replaceAll([]);this._list.invalidateItemHeight();if(this._provider){this._provider.setRefreshCallback(this._itemsLoaded.bind(this,this._provider));this._provider.attach();}
this._itemsLoaded(this._provider);}
_value(){return this._prompt.text().trim();}
_cleanValue(){return this._value().substring(this._prefix.length);}
wasShown(){this._attachProvider();}
willHide(){if(this._provider){this._provider.detach();}
this._clearTimers();ARIAUtils.setExpanded(this.contentElement,false);}
_clearTimers(){clearTimeout(this._filterTimer);clearTimeout(this._scoringTimer);clearTimeout(this._loadTimeout);delete this._filterTimer;delete this._scoringTimer;delete this._loadTimeout;delete this._refreshListWithCurrentResult;}
_onEnter(event){if(!this._provider){return;}
const selectedIndexInProvider=this._provider.itemCount()?this._list.selectedItem():null;this._selectItem(selectedIndexInProvider);if(this._dialog){this._dialog.hide();}}
_itemsLoaded(provider){if(this._loadTimeout||provider!==this._provider){return;}
this._loadTimeout=setTimeout(this._updateAfterItemsLoaded.bind(this),0);}
_updateAfterItemsLoaded(){delete this._loadTimeout;this._filterItems();}
createElementForItem(item){const itemElement=createElement('div');itemElement.className='filtered-list-widget-item '+(this._provider.renderAsTwoRows()?'two-rows':'one-row');const titleElement=itemElement.createChild('div','filtered-list-widget-title');const subtitleElement=itemElement.createChild('div','filtered-list-widget-subtitle');subtitleElement.textContent='\u200B';this._provider.renderItem(item,this._cleanValue(),titleElement,subtitleElement);ARIAUtils.markAsOption(itemElement);return itemElement;}
heightForItem(item){return 0;}
isItemSelectable(item){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.classList.remove('selected');}
if(toElement){toElement.classList.add('selected');}
ARIAUtils.setActiveDescendant(this._promptElement,toElement);}
_onClick(event){const item=this._list.itemForNode((event.target));if(item===null){return;}
event.consume(true);this._selectItem(item);if(this._dialog){this._dialog.hide();}}
setQuery(query){this._prompt.focus();this._prompt.setText(query);this._queryChanged();this._prompt.autoCompleteSoon(true);this._scheduleFilter();}
_tabKeyPressed(){const userEnteredText=this._prompt.text();let completion;for(let i=this._promptHistory.length-1;i>=0;i--){if(this._promptHistory[i]!==userEnteredText&&this._promptHistory[i].startsWith(userEnteredText)){completion=this._promptHistory[i];break;}}
if(!completion){return false;}
this._prompt.focus();this._prompt.setText(completion);this._prompt.setDOMSelection(userEnteredText.length,completion.length);this._scheduleFilter();return true;}
_itemsFilteredForTest(){}
_filterItems(){delete this._filterTimer;if(this._scoringTimer){clearTimeout(this._scoringTimer);delete this._scoringTimer;if(this._refreshListWithCurrentResult){this._refreshListWithCurrentResult();}}
if(!this._provider){this._bottomElementsContainer.classList.toggle('hidden',true);this._itemsFilteredForTest();return;}
this._bottomElementsContainer.classList.toggle('hidden',false);this._progressBarElement.style.transform='scaleX(0)';this._progressBarElement.classList.remove('filtered-widget-progress-fade');this._progressBarElement.classList.remove('hidden');const query=this._provider.rewriteQuery(this._cleanValue());this._query=query;const filterRegex=query?String.filterRegex(query):null;const filteredItems=[];const bestScores=[];const bestItems=[];const bestItemsToCollect=100;let minBestScore=0;const overflowItems=[];const scoreStartTime=window.performance.now();const maxWorkItems=NumberUtilities.clamp(10,500,(this._provider.itemCount()/10)|0);scoreItems.call(this,0);function compareIntegers(a,b){return b-a;}
function scoreItems(fromIndex){delete this._scoringTimer;let workDone=0;let i;for(i=fromIndex;i<this._provider.itemCount()&&workDone<maxWorkItems;++i){if(filterRegex&&!filterRegex.test(this._provider.itemKeyAt(i))){continue;}
const score=this._provider.itemScoreAt(i,query);if(query){workDone++;}
if(score>minBestScore||bestScores.length<bestItemsToCollect){const index=bestScores.upperBound(score,compareIntegers);bestScores.splice(index,0,score);bestItems.splice(index,0,i);if(bestScores.length>bestItemsToCollect){overflowItems.push(bestItems.peekLast());bestScores.length=bestItemsToCollect;bestItems.length=bestItemsToCollect;}
minBestScore=bestScores.peekLast();}else{filteredItems.push(i);}}
this._refreshListWithCurrentResult=this._refreshList.bind(this,bestItems,overflowItems,filteredItems);if(i<this._provider.itemCount()){this._scoringTimer=setTimeout(scoreItems.bind(this,i),0);if(window.performance.now()-scoreStartTime>50){this._progressBarElement.style.transform='scaleX('+i/this._provider.itemCount()+')';}
return;}
if(window.performance.now()-scoreStartTime>100){this._progressBarElement.style.transform='scaleX(1)';this._progressBarElement.classList.add('filtered-widget-progress-fade');}else{this._progressBarElement.classList.add('hidden');}
this._refreshListWithCurrentResult();}}
_refreshList(bestItems,overflowItems,filteredItems){delete this._refreshListWithCurrentResult;filteredItems=[].concat(bestItems,overflowItems,filteredItems);this._updateNotFoundMessage(!!filteredItems.length);const oldHeight=this._list.element.offsetHeight;this._items.replaceAll(filteredItems);if(filteredItems.length){this._list.selectItem(filteredItems[0]);}
if(this._list.element.offsetHeight!==oldHeight){this._list.viewportResized();}
this._itemsFilteredForTest();}
_updateNotFoundMessage(hasItems){this._list.element.classList.toggle('hidden',!hasItems);this._notFoundElement.classList.toggle('hidden',hasItems);if(!hasItems){this._notFoundElement.textContent=this._provider.notFoundText(this._cleanValue());ARIAUtils.alert(this._notFoundElement.textContent,this._notFoundElement);}}
_onInput(){this._queryChanged();this._scheduleFilter();}
_queryChanged(){if(this._queryChangedCallback){this._queryChangedCallback(this._value());}
if(this._provider){this._provider.queryChanged(this._cleanValue());}}
updateSelectedItemARIA(fromElement,toElement){return false;}
_onKeyDown(event){let handled=false;switch(event.key){case'Enter':this._onEnter(event);return;case'Tab':handled=this._tabKeyPressed();break;case'ArrowUp':handled=this._list.selectPreviousItem(true,false);break;case'ArrowDown':handled=this._list.selectNextItem(true,false);break;case'PageUp':handled=this._list.selectItemPreviousPage(false);break;case'PageDown':handled=this._list.selectItemNextPage(false);break;}
if(handled){event.consume(true);}}
_scheduleFilter(){if(this._filterTimer){return;}
this._filterTimer=setTimeout(this._filterItems.bind(this),0);}
_selectItem(itemIndex){this._promptHistory.push(this._value());if(this._promptHistory.length>100){this._promptHistory.shift();}
this._provider.selectItem(itemIndex,this._cleanValue());}}
class Provider{setRefreshCallback(refreshCallback){this._refreshCallback=refreshCallback;}
attach(){}
itemCount(){return 0;}
itemKeyAt(itemIndex){return'';}
itemScoreAt(itemIndex,query){return 1;}
renderItem(itemIndex,query,titleElement,subtitleElement){}
renderAsTwoRows(){return false;}
selectItem(itemIndex,promptValue){}
refresh(){this._refreshCallback();}
rewriteQuery(query){return query;}
queryChanged(query){}
notFoundText(query){return UIString.UIString('No results found');}
detach(){}}
var FilteredListWidget$1=Object.freeze({__proto__:null,FilteredListWidget:FilteredListWidget,Provider:Provider});const history=[];class QuickOpenImpl{constructor(){this._prefix=null;this._query='';this._providers=new Map();this._prefixes=[];this._filteredListWidget=null;self.runtime.extensions(Provider).forEach(this._addProvider.bind(this));this._prefixes.sort((a,b)=>b.length-a.length);}
static show(query){const quickOpen=new this();const filteredListWidget=new FilteredListWidget(null,history,quickOpen._queryChanged.bind(quickOpen));quickOpen._filteredListWidget=filteredListWidget;filteredListWidget.setPlaceholder(ls`Type '?' to see available commands`,ls`Type question mark to see available commands`);filteredListWidget.showAsDialog();filteredListWidget.setQuery(query);}
_addProvider(extension){const prefix=extension.descriptor()['prefix'];this._prefixes.push(prefix);this._providers.set(prefix,(extension.instance.bind(extension)));}
_queryChanged(query){const prefix=this._prefixes.find(prefix=>query.startsWith(prefix));if(typeof prefix!=='string'||this._prefix===prefix){return;}
this._prefix=prefix;this._filteredListWidget.setPrefix(prefix);this._filteredListWidget.setProvider(null);this._providers.get(prefix)().then(provider=>{if(this._prefix!==prefix){return;}
this._filteredListWidget.setProvider(provider);this._providerLoadedForTest(provider);});}
_providerLoadedForTest(provider){}}
class ShowActionDelegate{handleAction(context,actionId){switch(actionId){case'quickOpen.show':QuickOpenImpl.show('');return true;}
return false;}}
var QuickOpen=Object.freeze({__proto__:null,history:history,QuickOpenImpl:QuickOpenImpl,ShowActionDelegate:ShowActionDelegate});class CommandMenu{constructor(){this._commands=[];this._loadCommands();}
static createCommand(options){const{category,keys,title,shortcut,executeHandler,availableHandler,userActionCode}=options;const keyList=keys.split(',');let key='';keyList.forEach(k=>{key+=(ls(k.trim())+'\0');});let handler=executeHandler;if(userActionCode){const actionCode=userActionCode;handler=()=>{userMetrics.actionTaken(actionCode);executeHandler();};}
return new Command(category,title,key,shortcut,handler,availableHandler);}
static createSettingCommand(extension,title,value){const category=extension.descriptor()['category']||'';const tags=extension.descriptor()['tags']||'';const setting=Settings.Settings.instance().moduleSetting(extension.descriptor()['settingName']);return CommandMenu.createCommand({category:ls(category),keys:tags,title,shortcut:'',executeHandler:setting.set.bind(setting,value),availableHandler,});function availableHandler(){return setting.get()!==value;}}
static createActionCommand(options){const{action,userActionCode}=options;const shortcut=self.UI.shortcutRegistry.shortcutTitleForAction(action.id())||'';return CommandMenu.createCommand({category:action.category(),keys:action.tags(),title:action.title(),shortcut,executeHandler:action.execute.bind(action),userActionCode,});}
static createRevealViewCommand(options){const{extension,category,userActionCode}=options;const viewId=extension.descriptor()['id'];return CommandMenu.createCommand({category,keys:extension.descriptor()['tags']||'',title:UIString.UIString('Show %s',extension.title()),shortcut:'',executeHandler:ViewManager.ViewManager.instance().showView.bind(ViewManager.ViewManager.instance(),viewId,true),userActionCode,});}
_loadCommands(){const locations=new Map();self.runtime.extensions(View.ViewLocationResolver).forEach(extension=>{const category=extension.descriptor()['category'];const name=extension.descriptor()['name'];if(category&&name){locations.set(name,category);}});const viewExtensions=self.runtime.extensions('view');for(const extension of viewExtensions){const category=locations.get(extension.descriptor()['location']);if(!category){continue;}
const options={extension,category:ls(category),userActionCode:undefined};if(category==='Settings'){options.userActionCode=UserMetrics.Action.SettingsOpenedFromCommandMenu;}
this._commands.push(CommandMenu.createRevealViewCommand(options));}
const settingExtensions=self.runtime.extensions('setting');for(const extension of settingExtensions){const options=extension.descriptor()['options'];if(!options||!extension.descriptor()['category']){continue;}
for(const pair of options){this._commands.push(CommandMenu.createSettingCommand(extension,ls(pair['title']),pair['value']));}}}
commands(){return this._commands;}}
let ActionCommandOptions;let RevealViewCommandOptions;let CreateCommandOptions;class CommandMenuProvider extends Provider{constructor(){super();this._commands=[];}
attach(){const allCommands=commandMenu.commands();const actions=self.UI.actionRegistry.availableActions();for(const action of actions){const category=action.category();if(!category){continue;}
const options={action};if(category==='Settings'){options.userActionCode=UserMetrics.Action.SettingsOpenedFromCommandMenu;}
this._commands.push(CommandMenu.createActionCommand(options));}
for(const command of allCommands){if(command.available()){this._commands.push(command);}}
this._commands=this._commands.sort(commandComparator);function commandComparator(left,right){const cats=left.category().compareTo(right.category());return cats?cats:left.title().compareTo(right.title());}}
detach(){this._commands=[];}
itemCount(){return this._commands.length;}
itemKeyAt(itemIndex){return this._commands[itemIndex].key();}
itemScoreAt(itemIndex,query){const command=this._commands[itemIndex];const opcodes=Diff.DiffWrapper.charDiff(query.toLowerCase(),command.title().toLowerCase());let score=0;for(let i=0;i<opcodes.length;++i){if(opcodes[i][0]===Diff.Operation.Equal){score+=opcodes[i][1].length*opcodes[i][1].length;}}
if(command.category().startsWith('Panel')){score+=2;}else if(command.category().startsWith('Drawer')){score+=1;}
return score;}
renderItem(itemIndex,query,titleElement,subtitleElement){const command=this._commands[itemIndex];titleElement.removeChildren();const tagElement=titleElement.createChild('span','tag');const index=String.hashCode(command.category())%MaterialPaletteColors.length;tagElement.style.backgroundColor=MaterialPaletteColors[index];tagElement.textContent=command.category();titleElement.createTextChild(command.title());FilteredListWidget.highlightRanges(titleElement,query,true);subtitleElement.textContent=command.shortcut();}
selectItem(itemIndex,promptValue){if(itemIndex===null){return;}
this._commands[itemIndex].execute();userMetrics.actionTaken(UserMetrics.Action.SelectCommandFromCommandMenu);}
notFoundText(){return ls`No commands found`;}}
const MaterialPaletteColors=['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B'];class Command{constructor(category,title,key,shortcut,executeHandler,availableHandler){this._category=category;this._title=title;this._key=category+'\0'+title+'\0'+key;this._shortcut=shortcut;this._executeHandler=executeHandler;this._availableHandler=availableHandler;}
category(){return this._category;}
title(){return this._title;}
key(){return this._key;}
shortcut(){return this._shortcut;}
available(){return this._availableHandler?this._availableHandler():true;}
execute(){this._executeHandler();}}
class ShowActionDelegate$1{handleAction(context,actionId){InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();QuickOpenImpl.show('>');return true;}}
const commandMenu=new CommandMenu();var CommandMenu$1=Object.freeze({__proto__:null,CommandMenu:CommandMenu,ActionCommandOptions:ActionCommandOptions,RevealViewCommandOptions:RevealViewCommandOptions,CreateCommandOptions:CreateCommandOptions,CommandMenuProvider:CommandMenuProvider,MaterialPaletteColors:MaterialPaletteColors,Command:Command,ShowActionDelegate:ShowActionDelegate$1,commandMenu:commandMenu});class HelpQuickOpen extends Provider{constructor(){super();this._providers=[];self.runtime.extensions(Provider).forEach(this._addProvider.bind(this));}
_addProvider(extension){if(extension.title()){this._providers.push({prefix:extension.descriptor()['prefix'],title:extension.title()});}}
itemCount(){return this._providers.length;}
itemKeyAt(itemIndex){return this._providers[itemIndex].prefix;}
itemScoreAt(itemIndex,query){return-this._providers[itemIndex].prefix.length;}
renderItem(itemIndex,query,titleElement,subtitleElement){const provider=this._providers[itemIndex];const prefixElement=titleElement.createChild('span','monospace');prefixElement.textContent=(provider.prefix||'…')+' ';titleElement.createTextChild(provider.title);}
selectItem(itemIndex,promptValue){if(itemIndex!==null){QuickOpenImpl.show(this._providers[itemIndex].prefix);}}
renderAsTwoRows(){return false;}}
var HelpQuickOpen$1=Object.freeze({__proto__:null,HelpQuickOpen:HelpQuickOpen});export{CommandMenu$1 as CommandMenu,FilteredListWidget$1 as FilteredListWidget,HelpQuickOpen$1 as HelpQuickOpen,QuickOpen};