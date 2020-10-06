import{ArrayUtilities,NumberUtilities,StringUtilities}from'../platform/platform.js';import{SDKModel,CPUProfilerModel,CPUProfileDataModel,IsolateManager,RuntimeModel,HeapProfilerModel,ProfileTreeModel,ConsoleModel,RemoteObject,ResourceTreeModel}from'../sdk/sdk.js';import{UIUtils,Icon,Widget,TreeOutline,InplaceEditor,ARIAUtils,ContextMenu,View,SearchableView,Toolbar,ListModel,ListControl,Fragment,SplitWidget,TabbedPane,PopoverHelper,SettingsUI,Panel,ViewManager}from'../ui/ui.js';import{UIString,Color,ObjectWrapper,Settings,Revealer,ParsedURL,Worker,Console,Throttler}from'../common/common.js';import{DataGrid,ShowMoreDataGridNode,SortableDataGrid}from'../data_grid/data_grid.js';import{HeapSnapshotModel}from'../heap_snapshot_model/heap_snapshot_model.js';import{Platform,userMetrics,UserMetrics}from'../host/host.js';import{FlameChart,OverviewGrid,LineLevelProfile,PieChart}from'../perf_ui/perf_ui.js';import{Linkifier}from'../components/components.js';import{DebuggerWorkspaceBinding,FileUtils,TempFile}from'../bindings/bindings.js';import{ObjectPopoverHelper}from'../object_ui/object_ui.js';import{Workspace}from'../workspace/workspace.js';class ProfileDataGridNode extends DataGrid.DataGridNode{constructor(profileNode,owningTree,hasChildren){super(null,hasChildren);this._searchMatchedSelfColumn=false;this._searchMatchedTotalColumn=false;this._searchMatchedFunctionColumn=false;this.profileNode=profileNode;this.tree=owningTree;this.childrenByCallUID=new Map();this.lastComparator=null;this.callUID=profileNode.callUID;this.self=profileNode.self;this.total=profileNode.total;this.functionName=UIUtils.beautifyFunctionName(profileNode.functionName);this._deoptReason=profileNode.deoptReason||'';this.url=profileNode.url;this.linkElement=null;}
static sort(gridNodeGroups,comparator,force){for(let gridNodeGroupIndex=0;gridNodeGroupIndex<gridNodeGroups.length;++gridNodeGroupIndex){const gridNodes=gridNodeGroups[gridNodeGroupIndex];const count=gridNodes.length;for(let index=0;index<count;++index){const gridNode=gridNodes[index];if(!force&&(!gridNode.expanded||gridNode.lastComparator===comparator)){if(gridNode.children.length){gridNode.shouldRefreshChildren=true;}
continue;}
gridNode.lastComparator=comparator;const children=gridNode.children;const childCount=children.length;if(childCount){children.sort(comparator);for(let childIndex=0;childIndex<childCount;++childIndex){children[childIndex].recalculateSiblings(childIndex);}
gridNodeGroups.push(children);}}}}
static merge(container,child,shouldAbsorb){container.self+=child.self;if(!shouldAbsorb){container.total+=child.total;}
let children=container.children.slice();container.removeChildren();let count=children.length;for(let index=0;index<count;++index){if(!shouldAbsorb||children[index]!==child){container.appendChild(children[index]);}}
children=child.children.slice();count=children.length;for(let index=0;index<count;++index){const orphanedChild=children[index];const existingChild=container.childrenByCallUID.get(orphanedChild.callUID);if(existingChild){existingChild.merge((orphanedChild),false);}else{container.appendChild(orphanedChild);}}}
static populate(container){if(container._populated){return;}
container._populated=true;container.populateChildren();const currentComparator=container.tree.lastComparator;if(currentComparator){container.sort(currentComparator,true);}}
createCell(columnId){let cell;switch(columnId){case'self':{cell=this._createValueCell(this.self,this.selfPercent,columnId);cell.classList.toggle('highlight',this._searchMatchedSelfColumn);break;}
case'total':{cell=this._createValueCell(this.total,this.totalPercent,columnId);cell.classList.toggle('highlight',this._searchMatchedTotalColumn);break;}
case'function':{cell=this.createTD(columnId);cell.classList.toggle('highlight',this._searchMatchedFunctionColumn);if(this._deoptReason){cell.classList.add('not-optimized');const warningIcon=Icon.Icon.create('smallicon-warning','profile-warn-marker');warningIcon.title=UIString.UIString('Not optimized: %s',this._deoptReason);cell.appendChild(warningIcon);}
cell.createTextChild(this.functionName);if(this.profileNode.scriptId==='0'){break;}
const urlElement=this.tree._formatter.linkifyNode(this);if(!urlElement){break;}
urlElement.style.maxWidth='75%';cell.appendChild(urlElement);this.linkElement=urlElement;break;}
default:{cell=super.createCell(columnId);break;}}
return cell;}
_createValueCell(value,percent,columnId){const cell=createElementWithClass('td','numeric-column');const div=cell.createChild('div','profile-multiple-values');const valueSpan=div.createChild('span');const valueText=this.tree._formatter.formatValue(value,this);valueSpan.textContent=valueText;const percentSpan=div.createChild('span','percent-column');const percentText=this.tree._formatter.formatPercent(percent,this);percentSpan.textContent=percentText;const valueAccessibleText=this.tree._formatter.formatValueAccessibleText(value,this);this.setCellAccessibleName(ls`${valueAccessibleText}, ${percentText}`,cell,columnId);return cell;}
sort(comparator,force){return ProfileDataGridNode.sort([[this]],comparator,force);}
insertChild(profileDataGridNode,index){super.insertChild(profileDataGridNode,index);this.childrenByCallUID.set(profileDataGridNode.callUID,(profileDataGridNode));}
removeChild(profileDataGridNode){super.removeChild(profileDataGridNode);this.childrenByCallUID.delete(((profileDataGridNode)).callUID);}
removeChildren(){super.removeChildren();this.childrenByCallUID.clear();}
findChild(node){if(!node){return null;}
return this.childrenByCallUID.get(node.callUID);}
get selfPercent(){return this.self/this.tree.total*100.0;}
get totalPercent(){return this.total/this.tree.total*100.0;}
populate(){ProfileDataGridNode.populate(this);}
populateChildren(){}
save(){if(this._savedChildren){return;}
this._savedSelf=this.self;this._savedTotal=this.total;this._savedChildren=this.children.slice();}
restore(){if(!this._savedChildren){return;}
this.self=this._savedSelf;this.total=this._savedTotal;this.removeChildren();const children=this._savedChildren;const count=children.length;for(let index=0;index<count;++index){children[index].restore();this.appendChild(children[index]);}}
merge(child,shouldAbsorb){ProfileDataGridNode.merge(this,child,shouldAbsorb);}}
class ProfileDataGridTree{constructor(formatter,searchableView,total){this.tree=this;this.children=[];this._formatter=formatter;this._searchableView=searchableView;this.total=total;this.lastComparator=null;this.childrenByCallUID=new Map();this.deepSearch=true;}
static propertyComparator(property,isAscending){let comparator=ProfileDataGridTree.propertyComparators[(isAscending?1:0)][property];if(!comparator){if(isAscending){comparator=function(lhs,rhs){if(lhs[property]<rhs[property]){return-1;}
if(lhs[property]>rhs[property]){return 1;}
return 0;};}else{comparator=function(lhs,rhs){if(lhs[property]>rhs[property]){return-1;}
if(lhs[property]<rhs[property]){return 1;}
return 0;};}
ProfileDataGridTree.propertyComparators[(isAscending?1:0)][property]=comparator;}
return comparator;}
get expanded(){return true;}
appendChild(child){this.insertChild(child,this.children.length);}
insertChild(child,index){this.children.splice(index,0,child);this.childrenByCallUID.set(child.callUID,child);}
removeChildren(){this.children=[];this.childrenByCallUID.clear();}
populateChildren(){}
findChild(node){if(!node){return null;}
return this.childrenByCallUID.get(node.callUID);}
sort(comparator,force){return ProfileDataGridNode.sort([[this]],comparator,force);}
save(){if(this._savedChildren){return;}
this._savedTotal=this.total;this._savedChildren=this.children.slice();}
restore(){if(!this._savedChildren){return;}
this.children=this._savedChildren;this.total=this._savedTotal;const children=this.children;const count=children.length;for(let index=0;index<count;++index){children[index].restore();}
this._savedChildren=null;}
_matchFunction(searchConfig){const query=searchConfig.query.trim();if(!query.length){return null;}
const greaterThan=(query.startsWith('>'));const lessThan=(query.startsWith('<'));let equalTo=(query.startsWith('=')||((greaterThan||lessThan)&&query.indexOf('=')===1));const percentUnits=(query.endsWith('%'));const millisecondsUnits=(query.length>2&&query.endsWith('ms'));const secondsUnits=(!millisecondsUnits&&query.endsWith('s'));let queryNumber=parseFloat(query);if(greaterThan||lessThan||equalTo){if(equalTo&&(greaterThan||lessThan)){queryNumber=parseFloat(query.substring(2));}else{queryNumber=parseFloat(query.substring(1));}}
const queryNumberMilliseconds=(secondsUnits?(queryNumber*1000):queryNumber);if(!isNaN(queryNumber)&&!(greaterThan||lessThan)){equalTo=true;}
const matcher=createPlainTextSearchRegex(query,'i');function matchesQuery(profileDataGridNode){profileDataGridNode._searchMatchedSelfColumn=false;profileDataGridNode._searchMatchedTotalColumn=false;profileDataGridNode._searchMatchedFunctionColumn=false;if(percentUnits){if(lessThan){if(profileDataGridNode.selfPercent<queryNumber){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.totalPercent<queryNumber){profileDataGridNode._searchMatchedTotalColumn=true;}}else if(greaterThan){if(profileDataGridNode.selfPercent>queryNumber){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.totalPercent>queryNumber){profileDataGridNode._searchMatchedTotalColumn=true;}}
if(equalTo){if(profileDataGridNode.selfPercent===queryNumber){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.totalPercent===queryNumber){profileDataGridNode._searchMatchedTotalColumn=true;}}}else if(millisecondsUnits||secondsUnits){if(lessThan){if(profileDataGridNode.self<queryNumberMilliseconds){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.total<queryNumberMilliseconds){profileDataGridNode._searchMatchedTotalColumn=true;}}else if(greaterThan){if(profileDataGridNode.self>queryNumberMilliseconds){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.total>queryNumberMilliseconds){profileDataGridNode._searchMatchedTotalColumn=true;}}
if(equalTo){if(profileDataGridNode.self===queryNumberMilliseconds){profileDataGridNode._searchMatchedSelfColumn=true;}
if(profileDataGridNode.total===queryNumberMilliseconds){profileDataGridNode._searchMatchedTotalColumn=true;}}}
if(profileDataGridNode.functionName.match(matcher)||(profileDataGridNode.url&&profileDataGridNode.url.match(matcher))){profileDataGridNode._searchMatchedFunctionColumn=true;}
if(profileDataGridNode._searchMatchedSelfColumn||profileDataGridNode._searchMatchedTotalColumn||profileDataGridNode._searchMatchedFunctionColumn){profileDataGridNode.refresh();return true;}
return false;}
return matchesQuery;}
performSearch(searchConfig,shouldJump,jumpBackwards){this.searchCanceled();const matchesQuery=this._matchFunction(searchConfig);if(!matchesQuery){return;}
this._searchResults=[];const deepSearch=this.deepSearch;for(let current=this.children[0];current;current=current.traverseNextNode(!deepSearch,null,!deepSearch)){if(matchesQuery(current)){this._searchResults.push({profileNode:current});}}
this._searchResultIndex=jumpBackwards?0:this._searchResults.length-1;this._searchableView.updateSearchMatchesCount(this._searchResults.length);this._searchableView.updateCurrentMatchIndex(this._searchResultIndex);}
searchCanceled(){if(this._searchResults){for(let i=0;i<this._searchResults.length;++i){const profileNode=this._searchResults[i].profileNode;profileNode._searchMatchedSelfColumn=false;profileNode._searchMatchedTotalColumn=false;profileNode._searchMatchedFunctionColumn=false;profileNode.refresh();}}
this._searchResults=[];this._searchResultIndex=-1;}
jumpToNextSearchResult(){if(!this._searchResults||!this._searchResults.length){return;}
this._searchResultIndex=(this._searchResultIndex+1)%this._searchResults.length;this._jumpToSearchResult(this._searchResultIndex);}
jumpToPreviousSearchResult(){if(!this._searchResults||!this._searchResults.length){return;}
this._searchResultIndex=(this._searchResultIndex-1+this._searchResults.length)%this._searchResults.length;this._jumpToSearchResult(this._searchResultIndex);}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return false;}
_jumpToSearchResult(index){const searchResult=this._searchResults[index];if(!searchResult){return;}
const profileNode=searchResult.profileNode;profileNode.revealAndSelect();this._searchableView.updateCurrentMatchIndex(index);}}
ProfileDataGridTree.propertyComparators=[{},{}];class Formatter{formatValue(value,node){}
formatValueAccessibleText(value){}
formatPercent(value,node){}
linkifyNode(node){}}
var ProfileDataGrid=Object.freeze({__proto__:null,ProfileDataGridNode:ProfileDataGridNode,ProfileDataGridTree:ProfileDataGridTree,Formatter:Formatter});class TopDownProfileDataGridNode extends ProfileDataGridNode{constructor(profileNode,owningTree){const hasChildren=!!(profileNode.children&&profileNode.children.length);super(profileNode,owningTree,hasChildren);this._remainingChildren=profileNode.children;}
static _sharedPopulate(container){const children=container._remainingChildren;const childrenLength=children.length;for(let i=0;i<childrenLength;++i){container.appendChild(new TopDownProfileDataGridNode(children[i],(container.tree)));}
container._remainingChildren=null;}
static _excludeRecursively(container,aCallUID){if(container._remainingChildren){container.populate();}
container.save();const children=container.children;let index=container.children.length;while(index--){TopDownProfileDataGridNode._excludeRecursively(children[index],aCallUID);}
const child=container.childrenByCallUID.get(aCallUID);if(child){ProfileDataGridNode.merge(container,child,true);}}
populateChildren(){TopDownProfileDataGridNode._sharedPopulate(this);}}
class TopDownProfileDataGridTree extends ProfileDataGridTree{constructor(formatter,searchableView,rootProfileNode,total){super(formatter,searchableView,total);this._remainingChildren=rootProfileNode.children;ProfileDataGridNode.populate(this);}
focus(profileDataGridNode){if(!profileDataGridNode){return;}
this.save();profileDataGridNode.savePosition();this.children=[profileDataGridNode];this.total=profileDataGridNode.total;}
exclude(profileDataGridNode){if(!profileDataGridNode){return;}
this.save();TopDownProfileDataGridNode._excludeRecursively(this,profileDataGridNode.callUID);if(this.lastComparator){this.sort(this.lastComparator,true);}}
restore(){if(!this._savedChildren){return;}
this.children[0].restorePosition();super.restore();}
populateChildren(){TopDownProfileDataGridNode._sharedPopulate(this);}}
var TopDownProfileDataGrid=Object.freeze({__proto__:null,TopDownProfileDataGridNode:TopDownProfileDataGridNode,TopDownProfileDataGridTree:TopDownProfileDataGridTree});class BottomUpProfileDataGridNode extends ProfileDataGridNode{constructor(profileNode,owningTree){super(profileNode,owningTree,!!profileNode.parent&&!!profileNode.parent.parent);this._remainingNodeInfos=[];}
static _sharedPopulate(container){const remainingNodeInfos=container._remainingNodeInfos;const count=remainingNodeInfos.length;for(let index=0;index<count;++index){const nodeInfo=remainingNodeInfos[index];const ancestor=nodeInfo.ancestor;const focusNode=nodeInfo.focusNode;let child=container.findChild(ancestor);if(child){const totalAccountedFor=nodeInfo.totalAccountedFor;child.self+=focusNode.self;if(!totalAccountedFor){child.total+=focusNode.total;}}else{child=new BottomUpProfileDataGridNode(ancestor,(container.tree));if(ancestor!==focusNode){child.self=focusNode.self;child.total=focusNode.total;}
container.appendChild(child);}
const parent=ancestor.parent;if(parent&&parent.parent){nodeInfo.ancestor=parent;child._remainingNodeInfos.push(nodeInfo);}}
delete container._remainingNodeInfos;}
_takePropertiesFromProfileDataGridNode(profileDataGridNode){this.save();this.self=profileDataGridNode.self;this.total=profileDataGridNode.total;}
_keepOnlyChild(child){this.save();this.removeChildren();this.appendChild(child);}
_exclude(aCallUID){if(this._remainingNodeInfos){this.populate();}
this.save();const children=this.children;let index=this.children.length;while(index--){children[index]._exclude(aCallUID);}
const child=this.childrenByCallUID.get(aCallUID);if(child){this.merge(child,true);}}
restore(){super.restore();if(!this.children.length){this.setHasChildren(this._willHaveChildren(this.profileNode));}}
merge(child,shouldAbsorb){this.self-=child.self;super.merge(child,shouldAbsorb);}
populateChildren(){BottomUpProfileDataGridNode._sharedPopulate(this);}
_willHaveChildren(profileNode){return!!(profileNode.parent&&profileNode.parent.parent);}}
class BottomUpProfileDataGridTree extends ProfileDataGridTree{constructor(formatter,searchableView,rootProfileNode,total){super(formatter,searchableView,total);this.deepSearch=false;let profileNodeUIDs=0;const profileNodeGroups=[[],[rootProfileNode]];const visitedProfileNodesForCallUID=new Map();this._remainingNodeInfos=[];for(let profileNodeGroupIndex=0;profileNodeGroupIndex<profileNodeGroups.length;++profileNodeGroupIndex){const parentProfileNodes=profileNodeGroups[profileNodeGroupIndex];const profileNodes=profileNodeGroups[++profileNodeGroupIndex];const count=profileNodes.length;for(let index=0;index<count;++index){const profileNode=profileNodes[index];if(!profileNode.UID){profileNode.UID=++profileNodeUIDs;}
if(profileNode.parent){let visitedNodes=visitedProfileNodesForCallUID.get(profileNode.callUID);let totalAccountedFor=false;if(!visitedNodes){visitedNodes=new Set();visitedProfileNodesForCallUID.set(profileNode.callUID,visitedNodes);}else{const parentCount=parentProfileNodes.length;for(let parentIndex=0;parentIndex<parentCount;++parentIndex){if(visitedNodes.has(parentProfileNodes[parentIndex].UID)){totalAccountedFor=true;break;}}}
visitedNodes.add(profileNode.UID);this._remainingNodeInfos.push({ancestor:profileNode,focusNode:profileNode,totalAccountedFor:totalAccountedFor});}
const children=profileNode.children;if(children.length){profileNodeGroups.push(parentProfileNodes.concat([profileNode]));profileNodeGroups.push(children);}}}
ProfileDataGridNode.populate(this);return this;}
focus(profileDataGridNode){if(!profileDataGridNode){return;}
this.save();let currentNode=profileDataGridNode;let focusNode=profileDataGridNode;while(currentNode.parent&&(currentNode instanceof ProfileDataGridNode)){currentNode._takePropertiesFromProfileDataGridNode(profileDataGridNode);focusNode=currentNode;currentNode=currentNode.parent;if(currentNode instanceof ProfileDataGridNode){currentNode._keepOnlyChild(focusNode);}}
this.children=[focusNode];this.total=profileDataGridNode.total;}
exclude(profileDataGridNode){if(!profileDataGridNode){return;}
this.save();const excludedCallUID=profileDataGridNode.callUID;const excludedTopLevelChild=this.childrenByCallUID.get(excludedCallUID);if(excludedTopLevelChild){ArrayUtilities.removeElement(this.children,excludedTopLevelChild);}
const children=this.children;const count=children.length;for(let index=0;index<count;++index){children[index]._exclude(excludedCallUID);}
if(this.lastComparator){this.sort(this.lastComparator,true);}}
populateChildren(){BottomUpProfileDataGridNode._sharedPopulate(this);}}
var BottomUpProfileDataGrid=Object.freeze({__proto__:null,BottomUpProfileDataGridNode:BottomUpProfileDataGridNode,BottomUpProfileDataGridTree:BottomUpProfileDataGridTree});class ChildrenProvider{dispose(){}
nodePosition(snapshotObjectId){}
isEmpty(){}
serializeItemsRange(startPosition,endPosition){}
sortAndRewind(comparator){}}
var ChildrenProvider$1=Object.freeze({__proto__:null,ChildrenProvider:ChildrenProvider});class ProfileFlameChartDataProvider{constructor(){this._colorGenerator=ProfileFlameChartDataProvider.colorGenerator();}
static colorGenerator(){if(!ProfileFlameChartDataProvider._colorGenerator){const colorGenerator=new Color.Generator({min:30,max:330},{min:50,max:80,count:5},{min:80,max:90,count:3});colorGenerator.setColorForID('(idle)','hsl(0, 0%, 94%)');colorGenerator.setColorForID('(program)','hsl(0, 0%, 80%)');colorGenerator.setColorForID('(garbage collector)','hsl(0, 0%, 80%)');ProfileFlameChartDataProvider._colorGenerator=colorGenerator;}
return ProfileFlameChartDataProvider._colorGenerator;}
minimumBoundary(){return this._cpuProfile.profileStartTime;}
totalTime(){return this._cpuProfile.profileHead.total;}
formatValue(value,precision){return Number.preciseMillisToString(value,precision);}
maxStackDepth(){return this._maxStackDepth;}
timelineData(){return this._timelineData||this._calculateTimelineData();}
_calculateTimelineData(){throw'Not implemented.';}
prepareHighlightedEntryInfo(entryIndex){throw'Not implemented.';}
canJumpToEntry(entryIndex){return this._entryNodes[entryIndex].scriptId!=='0';}
entryTitle(entryIndex){const node=this._entryNodes[entryIndex];return UIUtils.beautifyFunctionName(node.functionName);}
entryFont(entryIndex){if(!this._font){this._font='11px '+Platform.fontFamily();this._boldFont='bold '+this._font;}
const node=this._entryNodes[entryIndex];return node.deoptReason?this._boldFont:this._font;}
entryColor(entryIndex){const node=this._entryNodes[entryIndex];return this._colorGenerator.colorForID(node.url||(node.scriptId!=='0'?node.scriptId:node.functionName));}
decorateEntry(entryIndex,context,text,barX,barY,barWidth,barHeight){return false;}
forceDecoration(entryIndex){return false;}
textColor(entryIndex){return'#333';}}
class CPUProfileFlameChart extends Widget.VBox{constructor(searchableView,dataProvider){super();this.element.id='cpu-flame-chart';this._searchableView=searchableView;this._overviewPane=new OverviewPane(dataProvider);this._overviewPane.show(this.element);this._mainPane=new FlameChart.FlameChart(dataProvider,this._overviewPane);this._mainPane.setBarHeight(15);this._mainPane.setTextBaseline(4);this._mainPane.setTextPadding(2);this._mainPane.show(this.element);this._mainPane.addEventListener(FlameChart.Events.EntrySelected,this._onEntrySelected,this);this._mainPane.addEventListener(FlameChart.Events.EntryInvoked,this._onEntryInvoked,this);this._entrySelected=false;this._mainPane.addEventListener(FlameChart.Events.CanvasFocused,this._onEntrySelected,this);this._overviewPane.addEventListener(OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._dataProvider=dataProvider;this._searchResults=[];}
focus(){this._mainPane.focus();}
_onWindowChanged(event){const windowLeft=event.data.windowTimeLeft;const windowRight=event.data.windowTimeRight;this._mainPane.setWindowTimes(windowLeft,windowRight,true);}
selectRange(timeLeft,timeRight){this._overviewPane._selectRange(timeLeft,timeRight);}
_onEntrySelected(event){if(event.data){const eventIndex=Number(event.data);this._mainPane.setSelectedEntry(eventIndex);if(eventIndex===-1){this._entrySelected=false;}else{this._entrySelected=true;}}else if(!this._entrySelected){this._mainPane.setSelectedEntry(0);this._entrySelected=true;}}
_onEntryInvoked(event){this._onEntrySelected(event);this.dispatchEventToListeners(FlameChart.Events.EntryInvoked,event.data);}
update(){this._overviewPane.update();this._mainPane.update();}
performSearch(searchConfig,shouldJump,jumpBackwards){const matcher=createPlainTextSearchRegex(searchConfig.query,searchConfig.caseSensitive?'':'i');const selectedEntryIndex=this._searchResultIndex!==-1?this._searchResults[this._searchResultIndex]:-1;this._searchResults=[];const entriesCount=this._dataProvider._entryNodes.length;for(let index=0;index<entriesCount;++index){if(this._dataProvider.entryTitle(index).match(matcher)){this._searchResults.push(index);}}
if(this._searchResults.length){this._searchResultIndex=this._searchResults.indexOf(selectedEntryIndex);if(this._searchResultIndex===-1){this._searchResultIndex=jumpBackwards?this._searchResults.length-1:0;}
this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);}else{this.searchCanceled();}
this._searchableView.updateSearchMatchesCount(this._searchResults.length);this._searchableView.updateCurrentMatchIndex(this._searchResultIndex);}
searchCanceled(){this._mainPane.setSelectedEntry(-1);this._searchResults=[];this._searchResultIndex=-1;}
jumpToNextSearchResult(){this._searchResultIndex=(this._searchResultIndex+1)%this._searchResults.length;this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);this._searchableView.updateCurrentMatchIndex(this._searchResultIndex);}
jumpToPreviousSearchResult(){this._searchResultIndex=(this._searchResultIndex-1+this._searchResults.length)%this._searchResults.length;this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);this._searchableView.updateCurrentMatchIndex(this._searchResultIndex);}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return false;}}
class OverviewCalculator{constructor(dataProvider){this._dataProvider=dataProvider;}
_updateBoundaries(overviewPane){this._minimumBoundaries=overviewPane._dataProvider.minimumBoundary();const totalTime=overviewPane._dataProvider.totalTime();this._maximumBoundaries=this._minimumBoundaries+totalTime;this._xScaleFactor=overviewPane._overviewContainer.clientWidth/totalTime;}
computePosition(time){return(time-this._minimumBoundaries)*this._xScaleFactor;}
formatValue(value,precision){return this._dataProvider.formatValue(value-this._minimumBoundaries,precision);}
maximumBoundary(){return this._maximumBoundaries;}
minimumBoundary(){return this._minimumBoundaries;}
zeroTime(){return this._minimumBoundaries;}
boundarySpan(){return this._maximumBoundaries-this._minimumBoundaries;}}
class OverviewPane extends Widget.VBox{constructor(dataProvider){super();this.element.classList.add('cpu-profile-flame-chart-overview-pane');this._overviewContainer=this.element.createChild('div','cpu-profile-flame-chart-overview-container');this._overviewCalculator=new OverviewCalculator(dataProvider);this._overviewGrid=new OverviewGrid.OverviewGrid('cpu-profile-flame-chart',this._overviewCalculator);this._overviewGrid.element.classList.add('fill');this._overviewCanvas=this._overviewContainer.createChild('canvas','cpu-profile-flame-chart-overview-canvas');this._overviewContainer.appendChild(this._overviewGrid.element);this._dataProvider=dataProvider;this._overviewGrid.addEventListener(OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);}
windowChanged(windowStartTime,windowEndTime){this._selectRange(windowStartTime,windowEndTime);}
updateRangeSelection(startTime,endTime){}
updateSelectedGroup(flameChart,group){}
_selectRange(timeLeft,timeRight){const startTime=this._dataProvider.minimumBoundary();const totalTime=this._dataProvider.totalTime();this._overviewGrid.setWindow((timeLeft-startTime)/totalTime,(timeRight-startTime)/totalTime);}
_onWindowChanged(event){const windowPosition={windowTimeLeft:event.data.rawStartValue,windowTimeRight:event.data.rawEndValue};this._windowTimeLeft=windowPosition.windowTimeLeft;this._windowTimeRight=windowPosition.windowTimeRight;this.dispatchEventToListeners(OverviewGrid.Events.WindowChanged,windowPosition);}
_timelineData(){return this._dataProvider.timelineData();}
onResize(){this._scheduleUpdate();}
_scheduleUpdate(){if(this._updateTimerId){return;}
this._updateTimerId=this.element.window().requestAnimationFrame(this.update.bind(this));}
update(){this._updateTimerId=0;const timelineData=this._timelineData();if(!timelineData){return;}
this._resetCanvas(this._overviewContainer.clientWidth,this._overviewContainer.clientHeight-FlameChart.HeaderHeight);this._overviewCalculator._updateBoundaries(this);this._overviewGrid.updateDividers(this._overviewCalculator);this._drawOverviewCanvas();}
_drawOverviewCanvas(){const canvasWidth=this._overviewCanvas.width;const canvasHeight=this._overviewCanvas.height;const drawData=this._calculateDrawData(canvasWidth);const context=this._overviewCanvas.getContext('2d');const ratio=window.devicePixelRatio;const offsetFromBottom=ratio;const lineWidth=1;const yScaleFactor=canvasHeight/(this._dataProvider.maxStackDepth()*1.1);context.lineWidth=lineWidth;context.translate(0.5,0.5);context.strokeStyle='rgba(20,0,0,0.4)';context.fillStyle='rgba(214,225,254,0.8)';context.moveTo(-lineWidth,canvasHeight+lineWidth);context.lineTo(-lineWidth,Math.round(canvasHeight-drawData[0]*yScaleFactor-offsetFromBottom));let value;for(let x=0;x<canvasWidth;++x){value=Math.round(canvasHeight-drawData[x]*yScaleFactor-offsetFromBottom);context.lineTo(x,value);}
context.lineTo(canvasWidth+lineWidth,value);context.lineTo(canvasWidth+lineWidth,canvasHeight+lineWidth);context.fill();context.stroke();context.closePath();}
_calculateDrawData(width){const dataProvider=this._dataProvider;const timelineData=this._timelineData();const entryStartTimes=timelineData.entryStartTimes;const entryTotalTimes=timelineData.entryTotalTimes;const entryLevels=timelineData.entryLevels;const length=entryStartTimes.length;const minimumBoundary=this._dataProvider.minimumBoundary();const drawData=new Uint8Array(width);const scaleFactor=width/dataProvider.totalTime();for(let entryIndex=0;entryIndex<length;++entryIndex){const start=Math.floor((entryStartTimes[entryIndex]-minimumBoundary)*scaleFactor);const finish=Math.floor((entryStartTimes[entryIndex]-minimumBoundary+entryTotalTimes[entryIndex])*scaleFactor);for(let x=start;x<=finish;++x){drawData[x]=Math.max(drawData[x],entryLevels[entryIndex]+1);}}
return drawData;}
_resetCanvas(width,height){const ratio=window.devicePixelRatio;this._overviewCanvas.width=width*ratio;this._overviewCanvas.height=height*ratio;this._overviewCanvas.style.width=width+'px';this._overviewCanvas.style.height=height+'px';}}
var CPUProfileFlameChart$1=Object.freeze({__proto__:null,ProfileFlameChartDataProvider:ProfileFlameChartDataProvider,CPUProfileFlameChart:CPUProfileFlameChart,OverviewCalculator:OverviewCalculator,OverviewPane:OverviewPane});class ProfileHeader extends ObjectWrapper.ObjectWrapper{constructor(profileType,title){super();this._profileType=profileType;this.title=title;this.uid=profileType.incrementProfileUid();this._fromFile=false;}
setTitle(title){this.title=title;this.dispatchEventToListeners(Events.ProfileTitleChanged,this);}
profileType(){return this._profileType;}
updateStatus(subtitle,wait){this.dispatchEventToListeners(Events.UpdateStatus,new StatusUpdate(subtitle,wait));}
createSidebarTreeElement(dataDisplayDelegate){throw new Error('Not implemented.');}
createView(dataDisplayDelegate){throw new Error('Not implemented.');}
removeTempFile(){if(this._tempFile){this._tempFile.remove();}}
dispose(){}
canSaveToFile(){return false;}
saveToFile(){throw new Error('Not implemented');}
loadFromFile(file){throw new Error('Not implemented');}
fromFile(){return this._fromFile;}
setFromFile(){this._fromFile=true;}
setProfile(profile){}}
class StatusUpdate{constructor(subtitle,wait){this.subtitle=subtitle;this.wait=wait;}}
const Events={UpdateStatus:Symbol('UpdateStatus'),ProfileReceived:Symbol('ProfileReceived'),ProfileTitleChanged:Symbol('ProfileTitleChanged')};class ProfileType extends ObjectWrapper.ObjectWrapper{constructor(id,name){super();this._id=id;this._name=name;this._profiles=[];this._profileBeingRecorded=null;this._nextProfileUid=1;if(!window.opener){window.addEventListener('unload',this._clearTempStorage.bind(this),false);}}
typeName(){return'';}
nextProfileUid(){return this._nextProfileUid;}
incrementProfileUid(){return this._nextProfileUid++;}
hasTemporaryView(){return false;}
fileExtension(){return null;}
get buttonTooltip(){return'';}
get id(){return this._id;}
get treeItemTitle(){return this._name;}
get name(){return this._name;}
buttonClicked(){return false;}
get description(){return'';}
isInstantProfile(){return false;}
isEnabled(){return true;}
getProfiles(){function isFinished(profile){return this._profileBeingRecorded!==profile;}
return this._profiles.filter(isFinished.bind(this));}
customContent(){return null;}
setCustomContentEnabled(enable){}
getProfile(uid){for(let i=0;i<this._profiles.length;++i){if(this._profiles[i].uid===uid){return this._profiles[i];}}
return null;}
loadFromFile(file){let name=file.name;const fileExtension=this.fileExtension();if(fileExtension&&name.endsWith(fileExtension)){name=name.substr(0,name.length-fileExtension.length);}
const profile=this.createProfileLoadedFromFile(name);profile.setFromFile();this.setProfileBeingRecorded(profile);this.addProfile(profile);return profile.loadFromFile(file);}
createProfileLoadedFromFile(title){throw new Error('Needs implemented.');}
addProfile(profile){this._profiles.push(profile);this.dispatchEventToListeners(ProfileEvents.AddProfileHeader,profile);}
removeProfile(profile){const index=this._profiles.indexOf(profile);if(index===-1){return;}
this._profiles.splice(index,1);this._disposeProfile(profile);}
_clearTempStorage(){for(let i=0;i<this._profiles.length;++i){this._profiles[i].removeTempFile();}}
profileBeingRecorded(){return this._profileBeingRecorded;}
setProfileBeingRecorded(profile){this._profileBeingRecorded=profile;}
profileBeingRecordedRemoved(){}
reset(){for(const profile of this._profiles.slice()){this._disposeProfile(profile);}
this._profiles=[];this._nextProfileUid=1;}
_disposeProfile(profile){this.dispatchEventToListeners(ProfileEvents.RemoveProfileHeader,profile);profile.dispose();if(this._profileBeingRecorded===profile){this.profileBeingRecordedRemoved();this.setProfileBeingRecorded(null);}}}
const ProfileEvents={AddProfileHeader:Symbol('add-profile-header'),ProfileComplete:Symbol('profile-complete'),RemoveProfileHeader:Symbol('remove-profile-header'),ViewUpdated:Symbol('view-updated')};class DataDisplayDelegate{showProfile(profile){}
showObject(snapshotObjectId,perspectiveName){}
async linkifyObject(nodeIndex){}}
var ProfileHeader$1=Object.freeze({__proto__:null,ProfileHeader:ProfileHeader,StatusUpdate:StatusUpdate,Events:Events,ProfileType:ProfileType,ProfileEvents:ProfileEvents,DataDisplayDelegate:DataDisplayDelegate});class ProfileSidebarTreeElement extends TreeOutline.TreeElement{constructor(dataDisplayDelegate,profile,className){super('',false);this._iconElement=createElementWithClass('div','icon');this._titlesElement=createElementWithClass('div','titles no-subtitle');this._titleContainer=this._titlesElement.createChild('span','title-container');this.titleElement=this._titleContainer.createChild('span','title');this._subtitleElement=this._titlesElement.createChild('span','subtitle');this.titleElement.textContent=profile.title;this._className=className;this._small=false;this._dataDisplayDelegate=dataDisplayDelegate;this.profile=profile;profile.addEventListener(Events.UpdateStatus,this._updateStatus,this);if(profile.canSaveToFile()){this._createSaveLink();}else{profile.addEventListener(Events.ProfileReceived,this._onProfileReceived,this);}}
_createSaveLink(){this._saveLinkElement=this._titleContainer.createChild('span','save-link');this._saveLinkElement.textContent=UIString.UIString('Save');this._saveLinkElement.addEventListener('click',this._saveProfile.bind(this),false);}
_onProfileReceived(event){this._createSaveLink();}
_updateStatus(event){const statusUpdate=event.data;if(statusUpdate.subtitle!==null){this._subtitleElement.textContent=statusUpdate.subtitle||'';this._titlesElement.classList.toggle('no-subtitle',!statusUpdate.subtitle);}
if(typeof statusUpdate.wait==='boolean'&&this.listItemElement){this.listItemElement.classList.toggle('wait',statusUpdate.wait);}}
ondblclick(event){if(!this._editing){this._startEditing((event.target));}
return false;}
_startEditing(eventTarget){const container=eventTarget.enclosingNodeOrSelfWithClass('title');if(!container){return;}
const config=new InplaceEditor.Config(this._editingCommitted.bind(this),this._editingCancelled.bind(this));this._editing=InplaceEditor.InplaceEditor.startEditing(container,config);}
_editingCommitted(container,newTitle){delete this._editing;this.profile.setTitle(newTitle);}
_editingCancelled(){delete this._editing;}
dispose(){this.profile.removeEventListener(Events.UpdateStatus,this._updateStatus,this);this.profile.removeEventListener(Events.ProfileReceived,this._onProfileReceived,this);}
onselect(){this._dataDisplayDelegate.showProfile(this.profile);return true;}
ondelete(){this.profile.profileType().removeProfile(this.profile);return true;}
onattach(){if(this._className){this.listItemElement.classList.add(this._className);}
if(this._small){this.listItemElement.classList.add('small');}
this.listItemElement.appendChildren(this._iconElement,this._titlesElement);this.listItemElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this),true);ARIAUtils.setDescription(this.listItemElement,ls`${this.profile.profileType().name}`);}
_handleContextMenuEvent(event){const profile=this.profile;const contextMenu=new ContextMenu.ContextMenu(event);contextMenu.headerSection().appendItem(UIString.UIString('Load…'),self.Profiler.ProfilesPanel._fileSelectorElement.click.bind(self.Profiler.ProfilesPanel._fileSelectorElement));if(profile.canSaveToFile()){contextMenu.saveSection().appendItem(UIString.UIString('Save…'),profile.saveToFile.bind(profile));}
contextMenu.footerSection().appendItem(UIString.UIString('Delete'),this.ondelete.bind(this));contextMenu.show();}
_saveProfile(event){this.profile.saveToFile();}
setSmall(small){this._small=small;if(this.listItemElement){this.listItemElement.classList.toggle('small',this._small);}}
setMainTitle(title){this.titleElement.textContent=title;}}
var ProfileSidebarTreeElement$1=Object.freeze({__proto__:null,ProfileSidebarTreeElement:ProfileSidebarTreeElement});class ProfileView extends View.SimpleView{constructor(){super(UIString.UIString('Profile'));this._profile=null;this._searchableView=new SearchableView.SearchableView(this);this._searchableView.setPlaceholder(UIString.UIString('Find by cost (>50ms), name or file'));this._searchableView.show(this.element);const columns=([]);columns.push({id:'self',title:this.columnHeader('self'),width:'120px',fixedWidth:true,sortable:true,sort:DataGrid.Order.Descending});columns.push({id:'total',title:this.columnHeader('total'),width:'120px',fixedWidth:true,sortable:true});columns.push({id:'function',title:UIString.UIString('Function'),disclosure:true,sortable:true});this.dataGrid=new DataGrid.DataGridImpl({displayName:ls`Profiler`,columns});this.dataGrid.addEventListener(DataGrid.Events.SortingChanged,this._sortProfile,this);this.dataGrid.addEventListener(DataGrid.Events.SelectedNode,this._nodeSelected.bind(this,true));this.dataGrid.addEventListener(DataGrid.Events.DeselectedNode,this._nodeSelected.bind(this,false));this.dataGrid.setRowContextMenuCallback(this._populateContextMenu.bind(this));this.viewSelectComboBox=new Toolbar.ToolbarComboBox(this._changeView.bind(this),ls`Profile view mode`);this.focusButton=new Toolbar.ToolbarButton(UIString.UIString('Focus selected function'),'largeicon-visibility');this.focusButton.setEnabled(false);this.focusButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._focusClicked,this);this.excludeButton=new Toolbar.ToolbarButton(UIString.UIString('Exclude selected function'),'largeicon-delete');this.excludeButton.setEnabled(false);this.excludeButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._excludeClicked,this);this.resetButton=new Toolbar.ToolbarButton(UIString.UIString('Restore all functions'),'largeicon-refresh');this.resetButton.setEnabled(false);this.resetButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._resetClicked,this);this._linkifier=new Linkifier.Linkifier(maxLinkLength);}
static buildPopoverTable(entryInfo){const table=createElement('table');for(const entry of entryInfo){const row=table.createChild('tr');row.createChild('td').textContent=entry.title;row.createChild('td').textContent=entry.value;}
return table;}
setProfile(profile){this._profile=profile;this._bottomUpProfileDataGridTree=null;this._topDownProfileDataGridTree=null;this._changeView();this.refresh();}
profile(){return this._profile;}
initialize(nodeFormatter,viewTypes){this._nodeFormatter=nodeFormatter;this._viewType=Settings.Settings.instance().createSetting('profileView',ViewTypes.Heavy);viewTypes=viewTypes||[ViewTypes.Flame,ViewTypes.Heavy,ViewTypes.Tree];const optionNames=new Map([[ViewTypes.Flame,ls`Chart`],[ViewTypes.Heavy,ls`Heavy (Bottom Up)`],[ViewTypes.Tree,ls`Tree (Top Down)`],[ViewTypes.Text,ls`Text (Top Down)`],]);const options=new Map(viewTypes.map(type=>[type,this.viewSelectComboBox.createOption(optionNames.get(type),type)]));const optionName=this._viewType.get()||viewTypes[0];const option=options.get(optionName)||options.get(viewTypes[0]);this.viewSelectComboBox.select(option);this._changeView();if(this._flameChart){this._flameChart.update();}}
focus(){if(this._flameChart){this._flameChart.focus();}else{super.focus();}}
columnHeader(columnId){throw'Not implemented';}
selectRange(timeLeft,timeRight){if(!this._flameChart){return;}
this._flameChart.selectRange(timeLeft,timeRight);}
async toolbarItems(){return[this.viewSelectComboBox,this.focusButton,this.excludeButton,this.resetButton];}
_getBottomUpProfileDataGridTree(){if(!this._bottomUpProfileDataGridTree){this._bottomUpProfileDataGridTree=new BottomUpProfileDataGridTree(this._nodeFormatter,this._searchableView,this._profile.root,this.adjustedTotal);}
return this._bottomUpProfileDataGridTree;}
_getTopDownProfileDataGridTree(){if(!this._topDownProfileDataGridTree){this._topDownProfileDataGridTree=new TopDownProfileDataGridTree(this._nodeFormatter,this._searchableView,this._profile.root,this.adjustedTotal);}
return this._topDownProfileDataGridTree;}
_populateContextMenu(contextMenu,gridNode){const node=(gridNode);if(node.linkElement&&!contextMenu.containsTarget(node.linkElement)){contextMenu.appendApplicableItems(node.linkElement);}}
willHide(){this._currentSearchResultIndex=-1;}
refresh(){if(!this.profileDataGridTree){return;}
const selectedProfileNode=this.dataGrid.selectedNode?this.dataGrid.selectedNode.profileNode:null;this.dataGrid.rootNode().removeChildren();const children=this.profileDataGridTree.children;const count=children.length;for(let index=0;index<count;++index){this.dataGrid.rootNode().appendChild(children[index]);}
if(selectedProfileNode){selectedProfileNode.selected=true;}}
refreshVisibleData(){let child=this.dataGrid.rootNode().children[0];while(child){child.refresh();child=child.traverseNextNode(false,null,true);}}
searchableView(){return this._searchableView;}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return false;}
searchCanceled(){this._searchableElement.searchCanceled();}
performSearch(searchConfig,shouldJump,jumpBackwards){this._searchableElement.performSearch(searchConfig,shouldJump,jumpBackwards);}
jumpToNextSearchResult(){this._searchableElement.jumpToNextSearchResult();}
jumpToPreviousSearchResult(){this._searchableElement.jumpToPreviousSearchResult();}
linkifier(){return this._linkifier;}
_ensureTextViewCreated(){if(this._textView){return;}
this._textView=new View.SimpleView(ls`Call tree`);this._textView.registerRequiredCSS('profiler/profilesPanel.css');this.populateTextView(this._textView);}
populateTextView(view){}
createFlameChartDataProvider(){throw'Not implemented';}
_ensureFlameChartCreated(){if(this._flameChart){return;}
this._dataProvider=this.createFlameChartDataProvider();this._flameChart=new CPUProfileFlameChart(this._searchableView,this._dataProvider);this._flameChart.addEventListener(FlameChart.Events.EntryInvoked,event=>{this._onEntryInvoked(event);});}
async _onEntryInvoked(event){const entryIndex=event.data;const node=this._dataProvider._entryNodes[entryIndex];const debuggerModel=this._profileHeader._debuggerModel;if(!node||!node.scriptId||!debuggerModel){return;}
const script=debuggerModel.scriptForId(node.scriptId);if(!script){return;}
const location=(debuggerModel.createRawLocation(script,node.lineNumber,node.columnNumber));const uiLocation=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(location);Revealer.reveal(uiLocation);}
_changeView(){if(!this._profile){return;}
this._searchableView.closeSearch();if(this._visibleView){this._visibleView.detach();}
this._viewType.set(this.viewSelectComboBox.selectedOption().value);switch(this._viewType.get()){case ViewTypes.Flame:this._ensureFlameChartCreated();this._visibleView=this._flameChart;this._searchableElement=this._flameChart;break;case ViewTypes.Tree:this.profileDataGridTree=this._getTopDownProfileDataGridTree();this._sortProfile();this._visibleView=this.dataGrid.asWidget();this._searchableElement=this.profileDataGridTree;break;case ViewTypes.Heavy:this.profileDataGridTree=this._getBottomUpProfileDataGridTree();this._sortProfile();this._visibleView=this.dataGrid.asWidget();this._searchableElement=this.profileDataGridTree;break;case ViewTypes.Text:this._ensureTextViewCreated();this._visibleView=this._textView;this._searchableElement=this._textView;break;}
const isFlame=this._viewType.get()===ViewTypes.Flame;this.focusButton.setVisible(!isFlame);this.excludeButton.setVisible(!isFlame);this.resetButton.setVisible(!isFlame);this._visibleView.show(this._searchableView.element);}
_nodeSelected(selected){this.focusButton.setEnabled(selected);this.excludeButton.setEnabled(selected);}
_focusClicked(event){if(!this.dataGrid.selectedNode){return;}
this.resetButton.setEnabled(true);this.resetButton.element.focus();this.profileDataGridTree.focus(this.dataGrid.selectedNode);this.refresh();this.refreshVisibleData();userMetrics.actionTaken(UserMetrics.Action.CpuProfileNodeFocused);}
_excludeClicked(event){const selectedNode=this.dataGrid.selectedNode;if(!selectedNode){return;}
this.resetButton.setEnabled(true);this.resetButton.element.focus();selectedNode.deselect();this.profileDataGridTree.exclude(selectedNode);this.refresh();this.refreshVisibleData();userMetrics.actionTaken(UserMetrics.Action.CpuProfileNodeExcluded);}
_resetClicked(event){this.viewSelectComboBox.selectElement().focus();this.resetButton.setEnabled(false);this.profileDataGridTree.restore();this._linkifier.reset();this.refresh();this.refreshVisibleData();}
_sortProfile(){const sortAscending=this.dataGrid.isSortOrderAscending();const sortColumnId=this.dataGrid.sortColumnId();const sortProperty=sortColumnId==='function'?'functionName':sortColumnId||'';this.profileDataGridTree.sort(ProfileDataGridTree.propertyComparator(sortProperty,sortAscending));this.refresh();}}
const maxLinkLength=30;const ViewTypes={Flame:'Flame',Tree:'Tree',Heavy:'Heavy',Text:'Text'};class WritableProfileHeader extends ProfileHeader{constructor(debuggerModel,type,title){super(type,title||UIString.UIString('Profile %d',type.nextProfileUid()));this._debuggerModel=debuggerModel;this._tempFile=null;}
_onChunkTransferred(reader){this.updateStatus(UIString.UIString('Loading… %d%%',Number.bytesToString(this._jsonifiedProfile.length)));}
_onError(reader){this.updateStatus(UIString.UIString('File \'%s\' read error: %s',reader.fileName(),reader.error().message));}
async write(text){this._jsonifiedProfile+=text;}
close(){}
dispose(){this.removeTempFile();}
createSidebarTreeElement(panel){return new ProfileSidebarTreeElement(panel,this,'profile-sidebar-tree-item');}
canSaveToFile(){return!this.fromFile()&&this._protocolProfile;}
async saveToFile(){const fileOutputStream=new FileUtils.FileOutputStream();this._fileName=this._fileName||`${this.profileType().typeName()}-${new Date().toISO8601Compact()}${this.profileType().fileExtension()}`;const accepted=await fileOutputStream.open(this._fileName);if(!accepted||!this._tempFile){return;}
const data=await this._tempFile.read();if(data){await fileOutputStream.write(data);}
fileOutputStream.close();}
async loadFromFile(file){this.updateStatus(UIString.UIString('Loading…'),true);const fileReader=new FileUtils.ChunkedFileReader(file,10000000,this._onChunkTransferred.bind(this));this._jsonifiedProfile='';const success=await fileReader.read(this);if(!success){this._onError(fileReader);return new Error(UIString.UIString('Failed to read file'));}
this.updateStatus(UIString.UIString('Parsing…'),true);let error=null;try{this._profile=(JSON.parse(this._jsonifiedProfile));this.setProfile(this._profile);this.updateStatus(UIString.UIString('Loaded'),false);}catch(e){error=e;this.profileType().removeProfile(this);}
this._jsonifiedProfile=null;if(this.profileType().profileBeingRecorded()===this){this.profileType().setProfileBeingRecorded(null);}
return error;}
setProtocolProfile(profile){this.setProfile(profile);this._protocolProfile=profile;this._tempFile=new TempFile.TempFile();this._tempFile.write([JSON.stringify(profile)]);if(this.canSaveToFile()){this.dispatchEventToListeners(Events.ProfileReceived);}}}
var ProfileView$1=Object.freeze({__proto__:null,ProfileView:ProfileView,maxLinkLength:maxLinkLength,ViewTypes:ViewTypes,WritableProfileHeader:WritableProfileHeader});class CPUProfileView extends ProfileView{constructor(profileHeader){super();this._profileHeader=profileHeader;this.initialize(new NodeFormatter(this));const profile=profileHeader.profileModel();this.adjustedTotal=profile.profileHead.total;this.adjustedTotal-=profile.idleNode?profile.idleNode.total:0;this.setProfile(profile);}
wasShown(){super.wasShown();const lineLevelProfile=self.runtime.sharedInstance(LineLevelProfile.Performance);lineLevelProfile.reset();lineLevelProfile.appendCPUProfile(this._profileHeader.profileModel());}
columnHeader(columnId){switch(columnId){case'self':return UIString.UIString('Self Time');case'total':return UIString.UIString('Total Time');}
return'';}
createFlameChartDataProvider(){return new CPUFlameChartDataProvider(this._profileHeader.profileModel(),this._profileHeader._cpuProfilerModel);}}
class CPUProfileType extends ProfileType{constructor(){super(CPUProfileType.TypeId,UIString.UIString('Record JavaScript CPU Profile'));this._recording=false;CPUProfileType.instance=this;SDKModel.TargetManager.instance().addModelListener(CPUProfilerModel.CPUProfilerModel,CPUProfilerModel.Events.ConsoleProfileFinished,this._consoleProfileFinished,this);}
profileBeingRecorded(){return(super.profileBeingRecorded());}
typeName(){return'CPU';}
fileExtension(){return'.cpuprofile';}
get buttonTooltip(){return this._recording?UIString.UIString('Stop CPU profiling'):UIString.UIString('Start CPU profiling');}
buttonClicked(){if(this._recording){this._stopRecordingProfile();return false;}
this._startRecordingProfile();return true;}
get treeItemTitle(){return UIString.UIString('CPU PROFILES');}
get description(){return UIString.UIString('CPU profiles show where the execution time is spent in your page\'s JavaScript functions.');}
_consoleProfileFinished(event){const data=(event.data);const cpuProfile=(data.cpuProfile);const profile=new CPUProfileHeader(data.cpuProfilerModel,this,data.title);profile.setProtocolProfile(cpuProfile);this.addProfile(profile);}
_startRecordingProfile(){const cpuProfilerModel=self.UI.context.flavor(CPUProfilerModel.CPUProfilerModel);if(this.profileBeingRecorded()||!cpuProfilerModel){return;}
const profile=new CPUProfileHeader(cpuProfilerModel,this);this.setProfileBeingRecorded(profile);SDKModel.TargetManager.instance().suspendAllTargets();this.addProfile(profile);profile.updateStatus(UIString.UIString('Recording…'));this._recording=true;cpuProfilerModel.startRecording();userMetrics.actionTaken(UserMetrics.Action.ProfilesCPUProfileTaken);}
async _stopRecordingProfile(){this._recording=false;if(!this.profileBeingRecorded()||!this.profileBeingRecorded()._cpuProfilerModel){return;}
const profile=await this.profileBeingRecorded()._cpuProfilerModel.stopRecording();const recordedProfile=this.profileBeingRecorded();if(recordedProfile){console.assert(profile);recordedProfile.setProtocolProfile(profile);recordedProfile.updateStatus('');this.setProfileBeingRecorded(null);}
await SDKModel.TargetManager.instance().resumeAllTargets();this.dispatchEventToListeners(ProfileEvents.ProfileComplete,recordedProfile);}
createProfileLoadedFromFile(title){return new CPUProfileHeader(null,this,title);}
profileBeingRecordedRemoved(){this._stopRecordingProfile();}}
CPUProfileType.TypeId='CPU';class CPUProfileHeader extends WritableProfileHeader{constructor(cpuProfilerModel,type,title){super(cpuProfilerModel&&cpuProfilerModel.debuggerModel(),type,title);this._cpuProfilerModel=cpuProfilerModel;}
createView(){return new CPUProfileView(this);}
protocolProfile(){return this._protocolProfile;}
profileModel(){return this._profileModel;}
setProfile(profile){const target=this._cpuProfilerModel&&this._cpuProfilerModel.target()||null;this._profileModel=new CPUProfileDataModel.CPUProfileDataModel(profile,target);}}
class NodeFormatter{constructor(profileView){this._profileView=profileView;}
formatValue(value){return UIString.UIString('%.1f\xa0ms',value);}
formatValueAccessibleText(value){return this.formatValue(value);}
formatPercent(value,node){return node.profileNode===this._profileView.profile().idleNode?'':UIString.UIString('%.2f\xa0%%',value);}
linkifyNode(node){const cpuProfilerModel=this._profileView._profileHeader._cpuProfilerModel;const target=cpuProfilerModel?cpuProfilerModel.target():null;const options={className:'profile-node-file'};return this._profileView.linkifier().maybeLinkifyConsoleCallFrame(target,node.profileNode.callFrame,options);}}
class CPUFlameChartDataProvider extends ProfileFlameChartDataProvider{constructor(cpuProfile,cpuProfilerModel){super();this._cpuProfile=cpuProfile;this._cpuProfilerModel=cpuProfilerModel;}
_calculateTimelineData(){const entries=[];const stack=[];let maxDepth=5;function onOpenFrame(){stack.push(entries.length);entries.push(null);}
function onCloseFrame(depth,node,startTime,totalTime,selfTime){const index=stack.pop();entries[index]=new CPUFlameChartDataProvider.ChartEntry(depth,totalTime,startTime,selfTime,node);maxDepth=Math.max(maxDepth,depth);}
this._cpuProfile.forEachFrame(onOpenFrame,onCloseFrame);const entryNodes=new Array(entries.length);const entryLevels=new Uint16Array(entries.length);const entryTotalTimes=new Float32Array(entries.length);const entrySelfTimes=new Float32Array(entries.length);const entryStartTimes=new Float64Array(entries.length);for(let i=0;i<entries.length;++i){const entry=entries[i];entryNodes[i]=entry.node;entryLevels[i]=entry.depth;entryTotalTimes[i]=entry.duration;entryStartTimes[i]=entry.startTime;entrySelfTimes[i]=entry.selfTime;}
this._maxStackDepth=maxDepth+1;this._timelineData=new FlameChart.TimelineData(entryLevels,entryTotalTimes,entryStartTimes,null);this._entryNodes=entryNodes;this._entrySelfTimes=entrySelfTimes;return this._timelineData;}
prepareHighlightedEntryInfo(entryIndex){const timelineData=this._timelineData;const node=this._entryNodes[entryIndex];if(!node){return null;}
const entryInfo=[];function pushEntryInfoRow(title,value){entryInfo.push({title:title,value:value});}
function millisecondsToString(ms){if(ms===0){return'0';}
if(ms<1000){return UIString.UIString('%.1f\xa0ms',ms);}
return Number.secondsToString(ms/1000,true);}
const name=UIUtils.beautifyFunctionName(node.functionName);pushEntryInfoRow(ls`Name`,name);const selfTime=millisecondsToString(this._entrySelfTimes[entryIndex]);const totalTime=millisecondsToString(timelineData.entryTotalTimes[entryIndex]);pushEntryInfoRow(ls`Self time`,selfTime);pushEntryInfoRow(ls`Total time`,totalTime);const linkifier=new Linkifier.Linkifier();const link=linkifier.maybeLinkifyConsoleCallFrame(this._cpuProfilerModel&&this._cpuProfilerModel.target(),node.callFrame);if(link){pushEntryInfoRow(ls`URL`,link.textContent);}
linkifier.dispose();pushEntryInfoRow(ls`Aggregated self time`,Number.secondsToString(node.self/1000,true));pushEntryInfoRow(ls`Aggregated total time`,Number.secondsToString(node.total/1000,true));if(node.deoptReason){pushEntryInfoRow(ls`Not optimized`,node.deoptReason);}
return ProfileView.buildPopoverTable(entryInfo);}}
CPUFlameChartDataProvider.ChartEntry=class{constructor(depth,duration,startTime,selfTime,node){this.depth=depth;this.duration=duration;this.startTime=startTime;this.selfTime=selfTime;this.node=node;}};var CPUProfileView$1=Object.freeze({__proto__:null,CPUProfileView:CPUProfileView,CPUProfileType:CPUProfileType,CPUProfileHeader:CPUProfileHeader,NodeFormatter:NodeFormatter,CPUFlameChartDataProvider:CPUFlameChartDataProvider});class IsolateSelector extends Widget.VBox{constructor(){super(false);this._items=new ListModel.ListModel();this._list=new ListControl.ListControl(this._items,this,ListControl.ListMode.NonViewport);this._list.element.tabIndex=0;this._list.element.classList.add('javascript-vm-instances-list');ARIAUtils.setAccessibleName(this._list.element,ls`JavaScript VM instances`);this.contentElement.appendChild(this._list.element);this._itemByIsolate=new Map();this._totalElement=createElementWithClass('div','profile-memory-usage-item hbox');this._totalValueDiv=this._totalElement.createChild('div','profile-memory-usage-item-size');this._totalTrendDiv=this._totalElement.createChild('div','profile-memory-usage-item-trend');this._totalElement.createChild('div').textContent=ls`Total JS heap size`;const trendIntervalMinutes=Math.round(IsolateManager.MemoryTrendWindowMs/60e3);this._totalTrendDiv.title=ls`Total page JS heap size change trend over the last ${trendIntervalMinutes} minutes.`;this._totalValueDiv.title=ls`Total page JS heap size across all VM instances.`;self.SDK.isolateManager.observeIsolates(this);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.NameChanged,this._targetChanged,this);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.InspectedURLChanged,this._targetChanged,this);}
wasShown(){self.SDK.isolateManager.addEventListener(IsolateManager.Events.MemoryChanged,this._heapStatsChanged,this);}
willHide(){self.SDK.isolateManager.removeEventListener(IsolateManager.Events.MemoryChanged,this._heapStatsChanged,this);}
isolateAdded(isolate){const item=new ListItem(isolate);const index=item.model().target()===SDKModel.TargetManager.instance().mainTarget()?0:this._items.length;this._items.insert(index,item);this._itemByIsolate.set(isolate,item);if(this._items.length===1||isolate.isMainThread()){this._list.selectItem(item);}
this._update();}
isolateChanged(isolate){const item=this._itemByIsolate.get(isolate);item.updateTitle();this._update();}
isolateRemoved(isolate){const item=this._itemByIsolate.get(isolate);this._items.remove(this._items.indexOf(item));this._itemByIsolate.delete(isolate);this._update();}
_targetChanged(event){const target=(event.data);const model=target.model(RuntimeModel.RuntimeModel);if(!model){return;}
const isolate=self.SDK.isolateManager.isolateByModel(model);const item=isolate&&this._itemByIsolate.get(isolate);if(item){item.updateTitle();}}
_heapStatsChanged(event){const isolate=(event.data);const listItem=this._itemByIsolate.get(isolate);if(listItem){listItem.updateStats();}
this._updateTotal();}
_updateTotal(){let total=0;let trend=0;for(const isolate of self.SDK.isolateManager.isolates()){total+=isolate.usedHeapSize();trend+=isolate.usedHeapSizeGrowRate();}
this._totalValueDiv.textContent=Number.bytesToString(total);IsolateSelector._formatTrendElement(trend,this._totalTrendDiv);}
static _formatTrendElement(trendValueMs,element){const changeRateBytesPerSecond=trendValueMs*1e3;const changeRateThresholdBytesPerSecond=1024;if(Math.abs(changeRateBytesPerSecond)<changeRateThresholdBytesPerSecond){return;}
const changeRateText=Number.bytesToString(Math.abs(changeRateBytesPerSecond));let changeText,changeLabel;if(changeRateBytesPerSecond>0){changeText=ls`\u2B06${changeRateText}/s`;element.classList.toggle('increasing',true);changeLabel=ls`increasing by ${changeRateText} per second`;}else{changeText=ls`\u2B07${changeRateText}/s`;element.classList.toggle('increasing',false);changeLabel=ls`decreasing by ${changeRateText} per second`;}
element.textContent=changeText;ARIAUtils.setAccessibleName(element,changeLabel);}
totalMemoryElement(){return this._totalElement;}
createElementForItem(item){return item.element;}
heightForItem(item){}
updateSelectedItemARIA(fromElement,toElement){return false;}
isItemSelectable(item){return true;}
selectedItemChanged(from,to,fromElement,toElement){if(fromElement){fromElement.classList.remove('selected');}
if(toElement){toElement.classList.add('selected');}
const model=to&&to.model();self.UI.context.setFlavor(HeapProfilerModel.HeapProfilerModel,model&&model.heapProfilerModel());self.UI.context.setFlavor(CPUProfilerModel.CPUProfilerModel,model&&model.target().model(CPUProfilerModel.CPUProfilerModel));}
_update(){this._updateTotal();this._list.invalidateRange(0,this._items.length);}}
class ListItem{constructor(isolate){this._isolate=isolate;const trendIntervalMinutes=Math.round(IsolateManager.MemoryTrendWindowMs/60e3);this.element=createElementWithClass('div','profile-memory-usage-item hbox');ARIAUtils.markAsOption(this.element);this._heapDiv=this.element.createChild('div','profile-memory-usage-item-size');this._heapDiv.title=ls`Heap size in use by live JS objects.`;this._trendDiv=this.element.createChild('div','profile-memory-usage-item-trend');this._trendDiv.title=ls`Heap size change trend over the last ${trendIntervalMinutes} minutes.`;this._nameDiv=this.element.createChild('div','profile-memory-usage-item-name');this.updateTitle();}
model(){return this._isolate.runtimeModel();}
updateStats(){this._heapDiv.textContent=Number.bytesToString(this._isolate.usedHeapSize());IsolateSelector._formatTrendElement(this._isolate.usedHeapSizeGrowRate(),this._trendDiv);}
updateTitle(){const modelCountByName=new Map();for(const model of this._isolate.models()){const target=model.target();const name=SDKModel.TargetManager.instance().mainTarget()!==target?target.name():'';const parsedURL=new ParsedURL.ParsedURL(target.inspectedURL());const domain=parsedURL.isValid?parsedURL.domain():'';const title=target.decorateLabel(domain&&name?`${domain}: ${name}`:name||domain||ls`(empty)`);modelCountByName.set(title,(modelCountByName.get(title)||0)+1);}
this._nameDiv.removeChildren();const titles=[];for(const[name,count]of modelCountByName){const title=count>1?`${name} (${count})`:name;titles.push(title);const titleDiv=this._nameDiv.createChild('div');titleDiv.textContent=title;titleDiv.title=title;}}}
var IsolateSelector$1=Object.freeze({__proto__:null,IsolateSelector:IsolateSelector,ListItem:ListItem});class ProfileLauncherView extends Widget.VBox{constructor(profilesPanel){super();this.registerRequiredCSS('profiler/profileLauncherView.css');this._panel=profilesPanel;this.element.classList.add('profile-launcher-view');this._contentElement=this.element.createChild('div','profile-launcher-view-content vbox');const profileTypeSelectorElement=this._contentElement.createChild('div','vbox');this._selectedProfileTypeSetting=Settings.Settings.instance().createSetting('selectedProfileType','CPU');this._profileTypeHeaderElement=profileTypeSelectorElement.createChild('h1');this._profileTypeSelectorForm=profileTypeSelectorElement.createChild('form');ARIAUtils.markAsRadioGroup(this._profileTypeSelectorForm);const isolateSelectorElement=this._contentElement.createChild('div','vbox profile-isolate-selector-block');isolateSelectorElement.createChild('h1').textContent=ls`Select JavaScript VM instance`;const isolateSelector=new IsolateSelector();isolateSelector.show(isolateSelectorElement.createChild('div','vbox profile-launcher-target-list'));isolateSelectorElement.appendChild(isolateSelector.totalMemoryElement());const buttonsDiv=this._contentElement.createChild('div','hbox profile-launcher-buttons');this._controlButton=UIUtils.createTextButton('',this._controlButtonClicked.bind(this),'',true);this._loadButton=UIUtils.createTextButton(ls`Load`,this._loadButtonClicked.bind(this),'');buttonsDiv.appendChild(this._controlButton);buttonsDiv.appendChild(this._loadButton);this._recordButtonEnabled=true;this._typeIdToOptionElement=new Map();}
_loadButtonClicked(){this._panel.showLoadFromFileDialog();}
_updateControls(){if(this._isEnabled&&this._recordButtonEnabled){this._controlButton.removeAttribute('disabled');}else{this._controlButton.setAttribute('disabled','');}
this._controlButton.title=this._recordButtonEnabled?'':UIUtils.anotherProfilerActiveLabel();if(this._isInstantProfile){this._controlButton.classList.remove('running');this._controlButton.classList.add('primary-button');this._controlButton.textContent=UIString.UIString('Take snapshot');}else if(this._isProfiling){this._controlButton.classList.add('running');this._controlButton.classList.remove('primary-button');this._controlButton.textContent=UIString.UIString('Stop');}else{this._controlButton.classList.remove('running');this._controlButton.classList.add('primary-button');this._controlButton.textContent=UIString.UIString('Start');}
for(const item of this._typeIdToOptionElement.values()){item.disabled=!!this._isProfiling;}}
profileStarted(){this._isProfiling=true;this._updateControls();}
profileFinished(){this._isProfiling=false;this._updateControls();}
updateProfileType(profileType,recordButtonEnabled){this._isInstantProfile=profileType.isInstantProfile();this._recordButtonEnabled=recordButtonEnabled;this._isEnabled=profileType.isEnabled();this._updateControls();}
addProfileType(profileType){const labelElement=UIUtils.createRadioLabel('profile-type',profileType.name);this._profileTypeSelectorForm.appendChild(labelElement);const optionElement=labelElement.radioElement;this._typeIdToOptionElement.set(profileType.id,optionElement);optionElement._profileType=profileType;optionElement.style.hidden=true;optionElement.addEventListener('change',this._profileTypeChanged.bind(this,profileType),false);const descriptionElement=this._profileTypeSelectorForm.createChild('p');descriptionElement.textContent=profileType.description;ARIAUtils.setDescription(optionElement,profileType.description);const customContent=profileType.customContent();if(customContent){this._profileTypeSelectorForm.createChild('p').appendChild(customContent);profileType.setCustomContentEnabled(false);}
const headerText=this._typeIdToOptionElement.size>1?ls`Select profiling type`:profileType.name;this._profileTypeHeaderElement.textContent=headerText;ARIAUtils.setAccessibleName(this._profileTypeSelectorForm,headerText);}
restoreSelectedProfileType(){let typeId=this._selectedProfileTypeSetting.get();if(!this._typeIdToOptionElement.has(typeId)){typeId=this._typeIdToOptionElement.keys().next().value;this._selectedProfileTypeSetting.set(typeId);}
this._typeIdToOptionElement.get(typeId).checked=true;const type=this._typeIdToOptionElement.get(typeId)._profileType;for(const[id,element]of this._typeIdToOptionElement){const enabled=(id===typeId);element._profileType.setCustomContentEnabled(enabled);}
this.dispatchEventToListeners(Events$1.ProfileTypeSelected,type);}
_controlButtonClicked(){this._panel.toggleRecord();}
_profileTypeChanged(profileType){const typeId=this._selectedProfileTypeSetting.get();const type=this._typeIdToOptionElement.get(typeId)._profileType;type.setCustomContentEnabled(false);profileType.setCustomContentEnabled(true);this.dispatchEventToListeners(Events$1.ProfileTypeSelected,profileType);this._isInstantProfile=profileType.isInstantProfile();this._isEnabled=profileType.isEnabled();this._updateControls();this._selectedProfileTypeSetting.set(profileType.id);}}
const Events$1={ProfileTypeSelected:Symbol('ProfileTypeSelected')};var ProfileLauncherView$1=Object.freeze({__proto__:null,ProfileLauncherView:ProfileLauncherView,Events:Events$1});class HeapTimelineOverview extends Widget.VBox{constructor(){super();this.element.id='heap-recording-view';this.element.classList.add('heap-tracking-overview');this._overviewCalculator=new OverviewCalculator$1();this._overviewContainer=this.element.createChild('div','heap-overview-container');this._overviewGrid=new OverviewGrid.OverviewGrid('heap-recording',this._overviewCalculator);this._overviewGrid.element.classList.add('fill');this._overviewCanvas=this._overviewContainer.createChild('canvas','heap-recording-overview-canvas');this._overviewContainer.appendChild(this._overviewGrid.element);this._overviewGrid.addEventListener(OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._windowLeft=0.0;this._windowRight=1.0;this._overviewGrid.setWindow(this._windowLeft,this._windowRight);this._yScale=new SmoothScale();this._xScale=new SmoothScale();this._profileSamples=new Samples();}
start(){this._running=true;const drawFrame=()=>{this.update();if(this._running){this.element.window().requestAnimationFrame(drawFrame);}};drawFrame();}
stop(){this._running=false;}
setSamples(samples){this._profileSamples=samples;if(!this._running){this.update();}}
_drawOverviewCanvas(width,height){if(!this._profileSamples){return;}
const profileSamples=this._profileSamples;const sizes=profileSamples.sizes;const topSizes=profileSamples.max;const timestamps=profileSamples.timestamps;const startTime=timestamps[0];const scaleFactor=this._xScale.nextScale(width/profileSamples.totalTime);let maxSize=0;function aggregateAndCall(sizes,callback){let size=0;let currentX=0;for(let i=1;i<timestamps.length;++i){const x=Math.floor((timestamps[i]-startTime)*scaleFactor);if(x!==currentX){if(size){callback(currentX,size);}
size=0;currentX=x;}
size+=sizes[i];}
callback(currentX,size);}
function maxSizeCallback(x,size){maxSize=Math.max(maxSize,size);}
aggregateAndCall(sizes,maxSizeCallback);const yScaleFactor=this._yScale.nextScale(maxSize?height/(maxSize*1.1):0.0);this._overviewCanvas.width=width*window.devicePixelRatio;this._overviewCanvas.height=height*window.devicePixelRatio;this._overviewCanvas.style.width=width+'px';this._overviewCanvas.style.height=height+'px';const context=this._overviewCanvas.getContext('2d');context.scale(window.devicePixelRatio,window.devicePixelRatio);if(this._running){context.beginPath();context.lineWidth=2;context.strokeStyle='rgba(192, 192, 192, 0.6)';const currentX=(Date.now()-startTime)*scaleFactor;context.moveTo(currentX,height-1);context.lineTo(currentX,0);context.stroke();context.closePath();}
let gridY;let gridValue;const gridLabelHeight=14;if(yScaleFactor){const maxGridValue=(height-gridLabelHeight)/yScaleFactor;gridValue=Math.pow(1024,Math.floor(Math.log(maxGridValue)/Math.log(1024)));gridValue*=Math.pow(10,Math.floor(Math.log(maxGridValue/gridValue)/Math.LN10));if(gridValue*5<=maxGridValue){gridValue*=5;}
gridY=Math.round(height-gridValue*yScaleFactor-0.5)+0.5;context.beginPath();context.lineWidth=1;context.strokeStyle='rgba(0, 0, 0, 0.2)';context.moveTo(0,gridY);context.lineTo(width,gridY);context.stroke();context.closePath();}
function drawBarCallback(x,size){context.moveTo(x,height-1);context.lineTo(x,Math.round(height-size*yScaleFactor-1));}
context.beginPath();context.lineWidth=2;context.strokeStyle='rgba(192, 192, 192, 0.6)';aggregateAndCall(topSizes,drawBarCallback);context.stroke();context.closePath();context.beginPath();context.lineWidth=2;context.strokeStyle='rgba(0, 0, 192, 0.8)';aggregateAndCall(sizes,drawBarCallback);context.stroke();context.closePath();if(gridValue){const label=Number.bytesToString(gridValue);const labelPadding=4;const labelX=0;const labelY=gridY-0.5;const labelWidth=2*labelPadding+context.measureText(label).width;context.beginPath();context.textBaseline='bottom';context.font='10px '+window.getComputedStyle(this.element,null).getPropertyValue('font-family');context.fillStyle='rgba(255, 255, 255, 0.75)';context.fillRect(labelX,labelY-gridLabelHeight,labelWidth,gridLabelHeight);context.fillStyle='rgb(64, 64, 64)';context.fillText(label,labelX+labelPadding,labelY);context.fill();context.closePath();}}
onResize(){this._updateOverviewCanvas=true;this._scheduleUpdate();}
_onWindowChanged(){if(!this._updateGridTimerId){this._updateGridTimerId=setTimeout(this.updateGrid.bind(this),10);}}
_scheduleUpdate(){if(this._updateTimerId){return;}
this._updateTimerId=setTimeout(this.update.bind(this),10);}
_updateBoundaries(){this._windowLeft=this._overviewGrid.windowLeft();this._windowRight=this._overviewGrid.windowRight();this._windowWidth=this._windowRight-this._windowLeft;}
update(){this._updateTimerId=null;if(!this.isShowing()){return;}
this._updateBoundaries();this._overviewCalculator._updateBoundaries(this);this._overviewGrid.updateDividers(this._overviewCalculator);this._drawOverviewCanvas(this._overviewContainer.clientWidth,this._overviewContainer.clientHeight-20);}
updateGrid(){this._updateGridTimerId=0;this._updateBoundaries();const ids=this._profileSamples.ids;if(!ids.length){return;}
const timestamps=this._profileSamples.timestamps;const sizes=this._profileSamples.sizes;const startTime=timestamps[0];const totalTime=this._profileSamples.totalTime;const timeLeft=startTime+totalTime*this._windowLeft;const timeRight=startTime+totalTime*this._windowRight;const minIndex=timestamps.lowerBound(timeLeft);const maxIndex=timestamps.upperBound(timeRight);let size=0;for(let i=minIndex;i<=maxIndex;++i){size+=sizes[i];}
const minId=minIndex>0?ids[minIndex-1]:0;const maxId=maxIndex<ids.length?ids[maxIndex]:Infinity;this.dispatchEventToListeners(IdsRangeChanged,{minId,maxId,size});}}
const IdsRangeChanged=Symbol('IdsRangeChanged');class SmoothScale{constructor(){this._lastUpdate=0;this._currentScale=0.0;}
nextScale(target){target=target||this._currentScale;if(this._currentScale){const now=Date.now();const timeDeltaMs=now-this._lastUpdate;this._lastUpdate=now;const maxChangePerSec=20;const maxChangePerDelta=Math.pow(maxChangePerSec,timeDeltaMs/1000);const scaleChange=target/this._currentScale;this._currentScale*=NumberUtilities.clamp(scaleChange,1/maxChangePerDelta,maxChangePerDelta);}else{this._currentScale=target;}
return this._currentScale;}}
class Samples{constructor(){this.sizes=[];this.ids=[];this.timestamps=[];this.max=[];this.totalTime=30000;}}
class OverviewCalculator$1{_updateBoundaries(chart){this._minimumBoundaries=0;this._maximumBoundaries=chart._profileSamples.totalTime;this._xScaleFactor=chart._overviewContainer.clientWidth/this._maximumBoundaries;}
computePosition(time){return(time-this._minimumBoundaries)*this._xScaleFactor;}
formatValue(value,precision){return Number.secondsToString(value/1000,!!precision);}
maximumBoundary(){return this._maximumBoundaries;}
minimumBoundary(){return this._minimumBoundaries;}
zeroTime(){return this._minimumBoundaries;}
boundarySpan(){return this._maximumBoundaries-this._minimumBoundaries;}}
var HeapTimelineOverview$1=Object.freeze({__proto__:null,HeapTimelineOverview:HeapTimelineOverview,IdsRangeChanged:IdsRangeChanged,SmoothScale:SmoothScale,Samples:Samples,OverviewCalculator:OverviewCalculator$1});class HeapProfileView extends ProfileView{constructor(profileHeader){super();this._profileHeader=profileHeader;this._profileType=profileHeader.profileType();const views=[ViewTypes.Flame,ViewTypes.Heavy,ViewTypes.Tree];const isNativeProfile=this._profileType.id===SamplingNativeHeapProfileType.TypeId||this._profileType.id===SamplingNativeHeapSnapshotType.TypeId;if(isNativeProfile){views.push(ViewTypes.Text);}
this.initialize(new NodeFormatter$1(this),views);const profile=new SamplingHeapProfileModel(profileHeader._profile||profileHeader.protocolProfile());this.adjustedTotal=profile.total;this.setProfile(profile);this._selectedSizeText=new Toolbar.ToolbarText();if(Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline')){this._timelineOverview=new HeapTimelineOverview();this._timelineOverview.addEventListener(IdsRangeChanged,this._onIdsRangeChanged.bind(this));this._timelineOverview.show(this.element,this.element.firstChild);this._timelineOverview.start();this._profileType.addEventListener(SamplingHeapProfileType.Events.StatsUpdate,this._onStatsUpdate,this);this._profileType.once(ProfileEvents.ProfileComplete).then(()=>{this._profileType.removeEventListener(SamplingHeapProfileType.Events.StatsUpdate,this._onStatsUpdate,this);this._timelineOverview.stop();this._timelineOverview.updateGrid();});}}
async toolbarItems(){return[...await super.toolbarItems(),this._selectedSizeText];}
_onIdsRangeChanged(event){const minId=(event.data.minId);const maxId=(event.data.maxId);this._selectedSizeText.setText(ls`Selected size: ${Number.bytesToString(event.data.size)}`);this._setSelectionRange(minId,maxId);}
_setSelectionRange(minId,maxId){const profile=new SamplingHeapProfileModel(this._profileHeader._profile||this._profileHeader.protocolProfile(),minId,maxId);this.adjustedTotal=profile.total;this.setProfile(profile);}
_onStatsUpdate(event){const profile=event.data;if(!this._totalTime){this._timestamps=[];this._sizes=[];this._max=[];this._ordinals=[];this._totalTime=30000;this._lastOrdinal=0;}
this._sizes.fill(0);this._sizes.push(0);this._timestamps.push(Date.now());this._ordinals.push(this._lastOrdinal+1);this._lastOrdinal=profile.samples.reduce((res,sample)=>Math.max(res,sample.ordinal),this._lastOrdinal);for(const sample of profile.samples){const bucket=this._ordinals.upperBound(sample.ordinal)-1;this._sizes[bucket]+=sample.size;}
this._max.push(this._sizes.peekLast());if(this._timestamps.peekLast()-this._timestamps[0]>this._totalTime){this._totalTime*=2;}
const samples=({sizes:this._sizes,max:this._max,ids:this._ordinals,timestamps:this._timestamps,totalTime:this._totalTime});this._timelineOverview.setSamples(samples);}
columnHeader(columnId){switch(columnId){case'self':return UIString.UIString('Self Size (bytes)');case'total':return UIString.UIString('Total Size (bytes)');}
return'';}
createFlameChartDataProvider(){return new HeapFlameChartDataProvider((this.profile()),this._profileHeader.heapProfilerModel());}
populateTextView(view){const guides='+!:|';let text=`Sampling memory profile.\n\nDate/Time:       ${new Date()}\n`+'Report Version:  7\n'+`App Version:     ${/Chrom\S*/.exec(navigator.appVersion)[0] || 'Unknown'}\n`+'Node Weight:     1 KiB\n'+`Total Size:      ${Math.round(this.profile().root.total / 1024)} KiB\n`+'----\n\nCall graph:\n';const sortedChildren=this.profile().root.children.sort((a,b)=>b.total-a.total);const modules=this.profile().modules.map(m=>Object.assign({address:BigInt(m.baseAddress),endAddress:BigInt(m.baseAddress)+BigInt(m.size)},m));modules.sort((m1,m2)=>m1.address>m2.address?1:m1.address<m2.address?-1:0);for(const child of sortedChildren){printTree('    ',child!==sortedChildren.peekLast(),child);}
text+='\nBinary Images:\n';for(const module of modules){const fileName=/[^/\\]*$/.exec(module.name)[0];const version='1.0';const formattedUuid=module.uuid.includes('-')?module.uuid:module.uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12}).*/,'$1-$2-$3-$4-$5');text+=`${('0x' + module.address.toString(16)).padStart(18)} - `;text+=`${('0x' + (module.endAddress - BigInt(1)).toString(16)).padStart(18)}`;text+=`  ${fileName} (${version}) <${formattedUuid}> ${module.name}\n`;}
view.contentElement.createChild('pre','profile-text-view monospace').textContent=text;function printTree(padding,drawGuide,node){const addressText=/0x[0-9a-f]*|[0-9]*/.exec(node.functionName)[0]||'';let module;if(addressText){const address=BigInt(addressText);const pos=modules.upperBound(address,(address,module)=>address-module.address);if(pos>0&&address<modules[pos-1].endAddress){module=modules[pos-1];}}
const functionName=(addressText?node.functionName.substr(addressText.length+1):node.functionName)||'???';text+=`${padding}${Math.round(node.total / 1024)}  ${functionName}  `;if(module){const fileName=/[^/\\]*$/.exec(module.name);if(fileName){text+=`(in ${fileName})  `;}
const offset=BigInt(addressText)-module.address;text+=`load address ${module.baseAddress} + 0x${offset.toString(16)}  `;}
if(addressText){text+=`[${addressText}]`;}
text+='\n';const guideChar=drawGuide?guides[padding.length/2%guides.length]:' ';const nextPadding=padding+guideChar+' ';const sortedChildren=node.children.sort((a,b)=>b.total-a.total);for(const child of sortedChildren){printTree(nextPadding,child!==sortedChildren.peekLast(),child);}}}}
class SamplingHeapProfileTypeBase extends ProfileType{constructor(typeId,description){super(typeId,description);this._recording=false;}
profileBeingRecorded(){return(super.profileBeingRecorded());}
typeName(){return'Heap';}
fileExtension(){return'.heapprofile';}
get buttonTooltip(){return this._recording?ls`Stop heap profiling`:ls`Start heap profiling`;}
buttonClicked(){if(this._recording){this._stopRecordingProfile();}else{this._startRecordingProfile();}
return this._recording;}
_startRecordingProfile(){const heapProfilerModel=self.UI.context.flavor(HeapProfilerModel.HeapProfilerModel);if(this.profileBeingRecorded()||!heapProfilerModel){return;}
const profileHeader=new SamplingHeapProfileHeader(heapProfilerModel,this);this.setProfileBeingRecorded(profileHeader);this.addProfile(profileHeader);profileHeader.updateStatus(ls`Recording…`);const icon=Icon.Icon.create('smallicon-warning');icon.title=ls`Heap profiler is recording`;self.UI.inspectorView.setPanelIcon('heap_profiler',icon);this._recording=true;this._startSampling();}
async _stopRecordingProfile(){this._recording=false;if(!this.profileBeingRecorded()||!this.profileBeingRecorded().heapProfilerModel()){return;}
this.profileBeingRecorded().updateStatus(ls`Stopping…`);const profile=await this._stopSampling();const recordedProfile=this.profileBeingRecorded();if(recordedProfile){console.assert(profile);recordedProfile.setProtocolProfile(profile);recordedProfile.updateStatus('');this.setProfileBeingRecorded(null);}
self.UI.inspectorView.setPanelIcon('heap_profiler',null);this.dispatchEventToListeners(ProfileEvents.ProfileComplete,recordedProfile);}
createProfileLoadedFromFile(title){return new SamplingHeapProfileHeader(null,this,title);}
profileBeingRecordedRemoved(){this._stopRecordingProfile();}
_startSampling(){throw'Not implemented';}
_stopSampling(){throw'Not implemented';}}
class SamplingHeapProfileType extends SamplingHeapProfileTypeBase{constructor(){super(SamplingHeapProfileType.TypeId,ls`Allocation sampling`);SamplingHeapProfileType.instance=this;this._updateTimer=null;this._updateIntervalMs=200;}
get treeItemTitle(){return ls`SAMPLING PROFILES`;}
get description(){return ls`Record memory allocations using sampling method.
              This profile type has minimal performance overhead and can be used for long running operations.
              It provides good approximation of allocations broken down by JavaScript execution stack.`;}
hasTemporaryView(){return Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline');}
_startSampling(){this.profileBeingRecorded().heapProfilerModel().startSampling();if(Root.Runtime.experiments.isEnabled('samplingHeapProfilerTimeline')){this._updateTimer=setTimeout(this._updateStats.bind(this),this._updateIntervalMs);}}
_stopSampling(){clearTimeout(this._updateTimer);this._updateTimer=null;this.dispatchEventToListeners(SamplingHeapProfileType.Events.RecordingStopped);return this.profileBeingRecorded().heapProfilerModel().stopSampling();}
async _updateStats(){const profile=await this.profileBeingRecorded().heapProfilerModel().getSamplingProfile();if(!this._updateTimer){return;}
this.dispatchEventToListeners(SamplingHeapProfileType.Events.StatsUpdate,profile);this._updateTimer=setTimeout(this._updateStats.bind(this),this._updateIntervalMs);}}
SamplingHeapProfileType.TypeId='SamplingHeap';SamplingHeapProfileType.Events={RecordingStopped:Symbol('RecordingStopped'),StatsUpdate:Symbol('StatsUpdate')};class SamplingNativeHeapProfileType extends SamplingHeapProfileTypeBase{constructor(){super(SamplingNativeHeapProfileType.TypeId,ls`Native memory allocation sampling`);SamplingNativeHeapProfileType.instance=this;}
get treeItemTitle(){return ls`NATIVE SAMPLING PROFILES`;}
get description(){return ls`Allocation profiles show sampled native memory allocations from the renderer process.`;}
_startSampling(){this.profileBeingRecorded().heapProfilerModel().startNativeSampling();}
_stopSampling(){return this.profileBeingRecorded().heapProfilerModel().stopNativeSampling();}}
SamplingNativeHeapProfileType.TypeId='SamplingNativeHeapRecording';class SamplingNativeHeapSnapshotType extends SamplingHeapProfileTypeBase{constructor(processType){super(SamplingNativeHeapSnapshotType.TypeId,ls`Native memory allocation snapshot (${processType})`);}
isInstantProfile(){return true;}
get treeItemTitle(){return ls`NATIVE SNAPSHOTS`;}
get description(){return ls`Native memory snapshots show sampled native allocations in the renderer process since start up.
              Chrome has to be started with --memlog=all flag. Check flags at chrome://flags`;}
buttonClicked(){this._takeSnapshot();return false;}
async _takeSnapshot(){if(this.profileBeingRecorded()){return;}
const heapProfilerModel=self.UI.context.flavor(HeapProfilerModel.HeapProfilerModel);if(!heapProfilerModel){return;}
const profile=new SamplingHeapProfileHeader(heapProfilerModel,this,ls`Snapshot ${this.nextProfileUid()}`);this.setProfileBeingRecorded(profile);this.addProfile(profile);profile.updateStatus(ls`Snapshotting…`);const protocolProfile=await this._takeNativeSnapshot((heapProfilerModel));const recordedProfile=this.profileBeingRecorded();if(recordedProfile){console.assert(protocolProfile);recordedProfile.setProtocolProfile((protocolProfile));recordedProfile.updateStatus('');this.setProfileBeingRecorded(null);}
this.dispatchEventToListeners(ProfileEvents.ProfileComplete,recordedProfile);}
_takeNativeSnapshot(heapProfilerModel){throw'Not implemented';}}
SamplingNativeHeapSnapshotType.TypeId='SamplingNativeHeapSnapshot';class SamplingNativeHeapSnapshotBrowserType extends SamplingNativeHeapSnapshotType{constructor(){super(ls`Browser`);SamplingNativeHeapSnapshotBrowserType.instance=this;}
async _takeNativeSnapshot(heapProfilerModel){return await heapProfilerModel.takeNativeBrowserSnapshot();}}
class SamplingNativeHeapSnapshotRendererType extends SamplingNativeHeapSnapshotType{constructor(){super(ls`Renderer`);SamplingNativeHeapSnapshotRendererType.instance=this;}
async _takeNativeSnapshot(heapProfilerModel){return await heapProfilerModel.takeNativeSnapshot();}}
class SamplingHeapProfileHeader extends WritableProfileHeader{constructor(heapProfilerModel,type,title){super(heapProfilerModel&&heapProfilerModel.debuggerModel(),type,title||UIString.UIString('Profile %d',type.nextProfileUid()));this._heapProfilerModel=heapProfilerModel;this._protocolProfile=({head:{callFrame:{},children:[]}});}
createView(){return new HeapProfileView(this);}
protocolProfile(){return this._protocolProfile;}
heapProfilerModel(){return this._heapProfilerModel;}}
class SamplingHeapProfileNode extends ProfileTreeModel.ProfileNode{constructor(node){const callFrame=node.callFrame||({functionName:node['functionName'],scriptId:node['scriptId'],url:node['url'],lineNumber:node['lineNumber']-1,columnNumber:node['columnNumber']-1});super(callFrame);this.self=node.selfSize;}}
class SamplingHeapProfileModel extends ProfileTreeModel.ProfileTreeModel{constructor(profile,minOrdinal,maxOrdinal){super();this.modules=profile.modules||[];let nodeIdToSizeMap=null;if(minOrdinal||maxOrdinal){nodeIdToSizeMap=new Map();minOrdinal=minOrdinal||0;maxOrdinal=maxOrdinal||Infinity;for(const sample of profile.samples){if(sample.ordinal<minOrdinal||sample.ordinal>maxOrdinal){continue;}
const size=nodeIdToSizeMap.get(sample.nodeId)||0;nodeIdToSizeMap.set(sample.nodeId,size+sample.size);}}
this.initialize(translateProfileTree(profile.head));function translateProfileTree(root){const resultRoot=new SamplingHeapProfileNode(root);const sourceNodeStack=[root];const targetNodeStack=[resultRoot];while(sourceNodeStack.length){const sourceNode=sourceNodeStack.pop();const targetNode=targetNodeStack.pop();targetNode.children=sourceNode.children.map(child=>{const targetChild=new SamplingHeapProfileNode(child);if(nodeIdToSizeMap){targetChild.self=nodeIdToSizeMap.get(child.id)||0;}
return targetChild;});sourceNodeStack.push(...sourceNode.children);targetNodeStack.push(...targetNode.children);}
pruneEmptyBranches(resultRoot);return resultRoot;}
function pruneEmptyBranches(node){node.children=node.children.filter(pruneEmptyBranches);return!!(node.children.length||node.self);}}}
class NodeFormatter$1{constructor(profileView){this._profileView=profileView;}
formatValue(value){return Number.withThousandsSeparator(value);}
formatValueAccessibleText(value){return ls`${value} bytes`;}
formatPercent(value,node){return UIString.UIString('%.2f\xa0%%',value);}
linkifyNode(node){const heapProfilerModel=this._profileView._profileHeader.heapProfilerModel();const target=heapProfilerModel?heapProfilerModel.target():null;const options={className:'profile-node-file'};return this._profileView.linkifier().maybeLinkifyConsoleCallFrame(target,node.profileNode.callFrame,options);}}
class HeapFlameChartDataProvider extends ProfileFlameChartDataProvider{constructor(profile,heapProfilerModel){super();this._profile=profile;this._heapProfilerModel=heapProfilerModel;}
minimumBoundary(){return 0;}
totalTime(){return this._profile.root.total;}
formatValue(value,precision){return UIString.UIString('%s\xa0KB',Number.withThousandsSeparator(value/1e3));}
_calculateTimelineData(){function nodesCount(node){return node.children.reduce((count,node)=>count+nodesCount(node),1);}
const count=nodesCount(this._profile.root);const entryNodes=new Array(count);const entryLevels=new Uint16Array(count);const entryTotalTimes=new Float32Array(count);const entryStartTimes=new Float64Array(count);let depth=0;let maxDepth=0;let position=0;let index=0;function addNode(node){const start=position;entryNodes[index]=node;entryLevels[index]=depth;entryTotalTimes[index]=node.total;entryStartTimes[index]=position;++index;++depth;node.children.forEach(addNode);--depth;maxDepth=Math.max(maxDepth,depth);position=start+node.total;}
addNode(this._profile.root);this._maxStackDepth=maxDepth+1;this._entryNodes=entryNodes;this._timelineData=new FlameChart.TimelineData(entryLevels,entryTotalTimes,entryStartTimes,null);return this._timelineData;}
prepareHighlightedEntryInfo(entryIndex){const node=this._entryNodes[entryIndex];if(!node){return null;}
const entryInfo=[];function pushEntryInfoRow(title,value){entryInfo.push({title:title,value:value});}
pushEntryInfoRow(ls`Name`,UIUtils.beautifyFunctionName(node.functionName));pushEntryInfoRow(ls`Self size`,Number.bytesToString(node.self));pushEntryInfoRow(ls`Total size`,Number.bytesToString(node.total));const linkifier=new Linkifier.Linkifier();const link=linkifier.maybeLinkifyConsoleCallFrame(this._heapProfilerModel?this._heapProfilerModel.target():null,node.callFrame);if(link){pushEntryInfoRow(ls`URL`,link.textContent);}
linkifier.dispose();return ProfileView.buildPopoverTable(entryInfo);}}
var HeapProfileView$1=Object.freeze({__proto__:null,HeapProfileView:HeapProfileView,SamplingHeapProfileTypeBase:SamplingHeapProfileTypeBase,SamplingHeapProfileType:SamplingHeapProfileType,SamplingNativeHeapProfileType:SamplingNativeHeapProfileType,SamplingNativeHeapSnapshotType:SamplingNativeHeapSnapshotType,SamplingNativeHeapSnapshotBrowserType:SamplingNativeHeapSnapshotBrowserType,SamplingNativeHeapSnapshotRendererType:SamplingNativeHeapSnapshotRendererType,SamplingHeapProfileHeader:SamplingHeapProfileHeader,SamplingHeapProfileNode:SamplingHeapProfileNode,SamplingHeapProfileModel:SamplingHeapProfileModel,NodeFormatter:NodeFormatter$1,HeapFlameChartDataProvider:HeapFlameChartDataProvider});class HeapSnapshotWorkerProxy extends ObjectWrapper.ObjectWrapper{constructor(eventHandler){super();this._eventHandler=eventHandler;this._nextObjectId=1;this._nextCallId=1;this._callbacks=new Map();this._previousCallbacks=new Set();this._worker=new Worker.WorkerWrapper('heap_snapshot_worker_entrypoint');this._worker.onmessage=this._messageReceived.bind(this);}
createLoader(profileUid,snapshotReceivedCallback){const objectId=this._nextObjectId++;const proxy=new HeapSnapshotLoaderProxy(this,objectId,profileUid,snapshotReceivedCallback);this._postMessage({callId:this._nextCallId++,disposition:'create',objectId:objectId,methodName:'HeapSnapshotWorker.HeapSnapshotLoader'});return proxy;}
dispose(){this._worker.terminate();if(this._interval){clearInterval(this._interval);}}
disposeObject(objectId){this._postMessage({callId:this._nextCallId++,disposition:'dispose',objectId:objectId});}
evaluateForTest(script,callback){const callId=this._nextCallId++;this._callbacks.set(callId,callback);this._postMessage({callId:callId,disposition:'evaluateForTest',source:script});}
callFactoryMethod(callback,objectId,methodName,proxyConstructor){const callId=this._nextCallId++;const methodArguments=Array.prototype.slice.call(arguments,4);const newObjectId=this._nextObjectId++;function wrapCallback(remoteResult){callback(remoteResult?new proxyConstructor(this,newObjectId):null);}
if(callback){this._callbacks.set(callId,wrapCallback.bind(this));this._postMessage({callId:callId,disposition:'factory',objectId:objectId,methodName:methodName,methodArguments:methodArguments,newObjectId:newObjectId});return null;}
this._postMessage({callId:callId,disposition:'factory',objectId:objectId,methodName:methodName,methodArguments:methodArguments,newObjectId:newObjectId});return new proxyConstructor(this,newObjectId);}
callMethod(callback,objectId,methodName){const callId=this._nextCallId++;const methodArguments=Array.prototype.slice.call(arguments,3);if(callback){this._callbacks.set(callId,callback);}
this._postMessage({callId:callId,disposition:'method',objectId:objectId,methodName:methodName,methodArguments:methodArguments});}
startCheckingForLongRunningCalls(){if(this._interval){return;}
this._checkLongRunningCalls();this._interval=setInterval(this._checkLongRunningCalls.bind(this),300);}
_checkLongRunningCalls(){for(const callId of this._previousCallbacks){if(!this._callbacks.has(callId)){this._previousCallbacks.delete(callId);}}
const hasLongRunningCalls=!!this._previousCallbacks.size;this.dispatchEventToListeners(HeapSnapshotWorkerProxy.Events.Wait,hasLongRunningCalls);for(const callId of this._callbacks.keys()){this._previousCallbacks.add(callId);}}
_messageReceived(event){const data=event.data;if(data.eventName){if(this._eventHandler){this._eventHandler(data.eventName,data.data);}
return;}
if(data.error){if(data.errorMethodName){Console.Console.instance().error(UIString.UIString('An error occurred when a call to method \'%s\' was requested',data.errorMethodName));}
Console.Console.instance().error(data['errorCallStack']);this._callbacks.delete(data.callId);return;}
if(!this._callbacks.has(data.callId)){return;}
const callback=this._callbacks.get(data.callId);this._callbacks.delete(data.callId);callback(data.result);}
_postMessage(message){this._worker.postMessage(message);}}
HeapSnapshotWorkerProxy.Events={Wait:Symbol('Wait')};class HeapSnapshotProxyObject{constructor(worker,objectId){this._worker=worker;this._objectId=objectId;}
_callWorker(workerMethodName,args){args.splice(1,0,this._objectId);return this._worker[workerMethodName].apply(this._worker,args);}
dispose(){this._worker.disposeObject(this._objectId);}
disposeWorker(){this._worker.dispose();}
callFactoryMethod(callback,methodName,proxyConstructor,var_args){return this._callWorker('callFactoryMethod',Array.prototype.slice.call(arguments,0));}
_callMethodPromise(methodName,var_args){const args=Array.prototype.slice.call(arguments);return new Promise(resolve=>this._callWorker('callMethod',[resolve,...args]));}}
class HeapSnapshotLoaderProxy extends HeapSnapshotProxyObject{constructor(worker,objectId,profileUid,snapshotReceivedCallback){super(worker,objectId);this._profileUid=profileUid;this._snapshotReceivedCallback=snapshotReceivedCallback;}
write(chunk){return this._callMethodPromise('write',chunk);}
async close(){await this._callMethodPromise('close');const snapshotProxy=await new Promise(resolve=>this.callFactoryMethod(resolve,'buildSnapshot',HeapSnapshotProxy));this.dispose();snapshotProxy.setProfileUid(this._profileUid);await snapshotProxy.updateStaticData();this._snapshotReceivedCallback(snapshotProxy);}}
class HeapSnapshotProxy extends HeapSnapshotProxyObject{constructor(worker,objectId){super(worker,objectId);this._staticData=null;}
search(searchConfig,filter){return this._callMethodPromise('search',searchConfig,filter);}
aggregatesWithFilter(filter){return this._callMethodPromise('aggregatesWithFilter',filter);}
aggregatesForDiff(){return this._callMethodPromise('aggregatesForDiff');}
calculateSnapshotDiff(baseSnapshotId,baseSnapshotAggregates){return this._callMethodPromise('calculateSnapshotDiff',baseSnapshotId,baseSnapshotAggregates);}
nodeClassName(snapshotObjectId){return this._callMethodPromise('nodeClassName',snapshotObjectId);}
createEdgesProvider(nodeIndex){return this.callFactoryMethod(null,'createEdgesProvider',HeapSnapshotProviderProxy,nodeIndex);}
createRetainingEdgesProvider(nodeIndex){return this.callFactoryMethod(null,'createRetainingEdgesProvider',HeapSnapshotProviderProxy,nodeIndex);}
createAddedNodesProvider(baseSnapshotId,className){return this.callFactoryMethod(null,'createAddedNodesProvider',HeapSnapshotProviderProxy,baseSnapshotId,className);}
createDeletedNodesProvider(nodeIndexes){return this.callFactoryMethod(null,'createDeletedNodesProvider',HeapSnapshotProviderProxy,nodeIndexes);}
createNodesProvider(filter){return this.callFactoryMethod(null,'createNodesProvider',HeapSnapshotProviderProxy,filter);}
createNodesProviderForClass(className,nodeFilter){return this.callFactoryMethod(null,'createNodesProviderForClass',HeapSnapshotProviderProxy,className,nodeFilter);}
allocationTracesTops(){return this._callMethodPromise('allocationTracesTops');}
allocationNodeCallers(nodeId){return this._callMethodPromise('allocationNodeCallers',nodeId);}
allocationStack(nodeIndex){return this._callMethodPromise('allocationStack',nodeIndex);}
dispose(){throw new Error('Should never be called');}
get nodeCount(){return this._staticData.nodeCount;}
get rootNodeIndex(){return this._staticData.rootNodeIndex;}
async updateStaticData(){this._staticData=await this._callMethodPromise('updateStaticData');}
getStatistics(){return this._callMethodPromise('getStatistics');}
getLocation(nodeIndex){return this._callMethodPromise('getLocation',nodeIndex);}
getSamples(){return this._callMethodPromise('getSamples');}
get totalSize(){return this._staticData.totalSize;}
get uid(){return this._profileUid;}
setProfileUid(profileUid){this._profileUid=profileUid;}
maxJSObjectId(){return this._staticData.maxJSObjectId;}}
class HeapSnapshotProviderProxy extends HeapSnapshotProxyObject{constructor(worker,objectId){super(worker,objectId);}
nodePosition(snapshotObjectId){return this._callMethodPromise('nodePosition',snapshotObjectId);}
isEmpty(){return this._callMethodPromise('isEmpty');}
serializeItemsRange(startPosition,endPosition){return this._callMethodPromise('serializeItemsRange',startPosition,endPosition);}
sortAndRewind(comparator){return this._callMethodPromise('sortAndRewind',comparator);}}
var HeapSnapshotProxy$1=Object.freeze({__proto__:null,HeapSnapshotWorkerProxy:HeapSnapshotWorkerProxy,HeapSnapshotProxyObject:HeapSnapshotProxyObject,HeapSnapshotLoaderProxy:HeapSnapshotLoaderProxy,HeapSnapshotProxy:HeapSnapshotProxy,HeapSnapshotProviderProxy:HeapSnapshotProviderProxy});class HeapSnapshotGridNode extends DataGrid.DataGridNode{constructor(tree,hasChildren){super(null,hasChildren);this._dataGrid=tree;this._instanceCount=0;this._savedChildren=null;this._retrievedChildrenRanges=[];this._providerObject=null;this._reachableFromWindow=false;}
static createComparator(fieldNames){return({fieldName1:fieldNames[0],ascending1:fieldNames[1],fieldName2:fieldNames[2],ascending2:fieldNames[3]});}
heapSnapshotDataGrid(){return this._dataGrid;}
createProvider(){throw new Error('Not implemented.');}
retainersDataSource(){return null;}
_provider(){if(!this._providerObject){this._providerObject=this.createProvider();}
return this._providerObject;}
createCell(columnId){const cell=super.createCell(columnId);if(this._searchMatched){cell.classList.add('highlight');}
return cell;}
collapse(){super.collapse();this._dataGrid.updateVisibleNodes(true);}
expand(){super.expand();this._dataGrid.updateVisibleNodes(true);}
dispose(){if(this._providerObject){this._providerObject.dispose();}
for(let node=this.children[0];node;node=node.traverseNextNode(true,this,true)){if(node.dispose){node.dispose();}}}
queryObjectContent(heapProfilerModel,objectGroupName){}
tryQueryObjectContent(heapProfilerModel,objectGroupName){}
populateContextMenu(contextMenu,dataDisplayDelegate,heapProfilerModel){}
_toPercentString(num){return num.toFixed(0)+'\xa0%';}
_toUIDistance(distance){const baseSystemDistance=HeapSnapshotModel.baseSystemDistance;return distance>=0&&distance<baseSystemDistance?UIString.UIString('%d',distance):UIString.UIString('\u2212');}
allChildren(){return this._dataGrid.allChildren(this);}
removeChildByIndex(index){this._dataGrid.removeChildByIndex(this,index);}
childForPosition(nodePosition){let indexOfFirstChildInRange=0;for(let i=0;i<this._retrievedChildrenRanges.length;i++){const range=this._retrievedChildrenRanges[i];if(range.from<=nodePosition&&nodePosition<range.to){const childIndex=indexOfFirstChildInRange+nodePosition-range.from;return this.allChildren()[childIndex];}
indexOfFirstChildInRange+=range.to-range.from+1;}
return null;}
_createValueCell(columnId){const cell=Fragment.html`<td class="numeric-column" />`;if(this.dataGrid.snapshot.totalSize!==0){const div=createElement('div');const valueSpan=Fragment.html`<span>${this.data[columnId]}</span>`;div.appendChild(valueSpan);const percentColumn=columnId+'-percent';if(percentColumn in this.data){const percentSpan=Fragment.html`<span class="percent-column">${this.data[percentColumn]}</span>`;div.appendChild(percentSpan);div.classList.add('profile-multiple-values');ARIAUtils.markAsHidden(valueSpan);ARIAUtils.markAsHidden(percentSpan);this.setCellAccessibleName(ls`${this.data[columnId]}, ${this.data[percentColumn]}`,cell,columnId);}
cell.appendChild(div);}
return cell;}
populate(){if(this._populated){return;}
this._populated=true;this._provider().sortAndRewind(this.comparator()).then(()=>this._populateChildren());}
expandWithoutPopulate(){this._populated=true;this.expand();return this._provider().sortAndRewind(this.comparator());}
_populateChildren(fromPosition,toPosition){let afterPopulate;const promise=new Promise(resolve=>afterPopulate=resolve);fromPosition=fromPosition||0;toPosition=toPosition||fromPosition+this._dataGrid.defaultPopulateCount();let firstNotSerializedPosition=fromPosition;serializeNextChunk.call(this);return promise;function serializeNextChunk(){if(firstNotSerializedPosition>=toPosition){return;}
const end=Math.min(firstNotSerializedPosition+this._dataGrid.defaultPopulateCount(),toPosition);this._provider().serializeItemsRange(firstNotSerializedPosition,end).then(childrenRetrieved.bind(this));firstNotSerializedPosition=end;}
function insertRetrievedChild(item,insertionIndex){if(this._savedChildren){const hash=this._childHashForEntity(item);if(hash in this._savedChildren){this._dataGrid.insertChild(this,this._savedChildren[hash],insertionIndex);return;}}
this._dataGrid.insertChild(this,this._createChildNode(item),insertionIndex);}
function insertShowMoreButton(from,to,insertionIndex){const button=new ShowMoreDataGridNode.ShowMoreDataGridNode(this._populateChildren.bind(this),from,to,this._dataGrid.defaultPopulateCount());this._dataGrid.insertChild(this,button,insertionIndex);}
function childrenRetrieved(itemsRange){let itemIndex=0;let itemPosition=itemsRange.startPosition;const items=itemsRange.items;let insertionIndex=0;if(!this._retrievedChildrenRanges.length){if(itemsRange.startPosition>0){this._retrievedChildrenRanges.push({from:0,to:0});insertShowMoreButton.call(this,0,itemsRange.startPosition,insertionIndex++);}
this._retrievedChildrenRanges.push({from:itemsRange.startPosition,to:itemsRange.endPosition});for(let i=0,l=items.length;i<l;++i){insertRetrievedChild.call(this,items[i],insertionIndex++);}
if(itemsRange.endPosition<itemsRange.totalLength){insertShowMoreButton.call(this,itemsRange.endPosition,itemsRange.totalLength,insertionIndex++);}}else{let rangeIndex=0;let found=false;let range;while(rangeIndex<this._retrievedChildrenRanges.length){range=this._retrievedChildrenRanges[rangeIndex];if(range.to>=itemPosition){found=true;break;}
insertionIndex+=range.to-range.from;if(range.to<itemsRange.totalLength){insertionIndex+=1;}
++rangeIndex;}
if(!found||itemsRange.startPosition<range.from){this.allChildren()[insertionIndex-1].setEndPosition(itemsRange.startPosition);insertShowMoreButton.call(this,itemsRange.startPosition,found?range.from:itemsRange.totalLength,insertionIndex);range={from:itemsRange.startPosition,to:itemsRange.startPosition};if(!found){rangeIndex=this._retrievedChildrenRanges.length;}
this._retrievedChildrenRanges.splice(rangeIndex,0,range);}else{insertionIndex+=itemPosition-range.from;}
while(range.to<itemsRange.endPosition){const skipCount=range.to-itemPosition;insertionIndex+=skipCount;itemIndex+=skipCount;itemPosition=range.to;const nextRange=this._retrievedChildrenRanges[rangeIndex+1];let newEndOfRange=nextRange?nextRange.from:itemsRange.totalLength;if(newEndOfRange>itemsRange.endPosition){newEndOfRange=itemsRange.endPosition;}
while(itemPosition<newEndOfRange){insertRetrievedChild.call(this,items[itemIndex++],insertionIndex++);++itemPosition;}
if(nextRange&&newEndOfRange===nextRange.from){range.to=nextRange.to;this.removeChildByIndex(insertionIndex);this._retrievedChildrenRanges.splice(rangeIndex+1,1);}else{range.to=newEndOfRange;if(newEndOfRange===itemsRange.totalLength){this.removeChildByIndex(insertionIndex);}else{this.allChildren()[insertionIndex].setStartPosition(itemsRange.endPosition);}}}}
this._instanceCount+=items.length;if(firstNotSerializedPosition<toPosition){serializeNextChunk.call(this);return;}
if(this.expanded){this._dataGrid.updateVisibleNodes(true);}
afterPopulate();this.dispatchEventToListeners(HeapSnapshotGridNode.Events.PopulateComplete);}}
_saveChildren(){this._savedChildren=null;const children=this.allChildren();for(let i=0,l=children.length;i<l;++i){const child=children[i];if(!child.expanded){continue;}
if(!this._savedChildren){this._savedChildren={};}
this._savedChildren[this._childHashForNode(child)]=child;}}
async sort(){this._dataGrid.recursiveSortingEnter();await this._provider().sortAndRewind(this.comparator());this._saveChildren();this._dataGrid.removeAllChildren(this);this._retrievedChildrenRanges=[];const instanceCount=this._instanceCount;this._instanceCount=0;await this._populateChildren(0,instanceCount);for(const child of this.allChildren()){if(child.expanded){child.sort();}}
this._dataGrid.recursiveSortingLeave();}}
HeapSnapshotGridNode.Events={PopulateComplete:Symbol('PopulateComplete')};class HeapSnapshotGenericObjectNode extends HeapSnapshotGridNode{constructor(dataGrid,node){super(dataGrid,false);if(!node){return;}
this._name=node.name;this._type=node.type;this._distance=node.distance;this._shallowSize=node.selfSize;this._retainedSize=node.retainedSize;this.snapshotNodeId=node.id;this.snapshotNodeIndex=node.nodeIndex;if(this._type==='string'){this._reachableFromWindow=true;}else if(this._type==='object'&&this._name.startsWith('Window')){this._name=this.shortenWindowURL(this._name,false);this._reachableFromWindow=true;}else if(node.canBeQueried){this._reachableFromWindow=true;}
if(node.detachedDOMTreeNode){this.detachedDOMTreeNode=true;}
const snapshot=dataGrid.snapshot;const shallowSizePercent=this._shallowSize/snapshot.totalSize*100.0;const retainedSizePercent=this._retainedSize/snapshot.totalSize*100.0;this.data={'distance':this._toUIDistance(this._distance),'shallowSize':Number.withThousandsSeparator(this._shallowSize),'retainedSize':Number.withThousandsSeparator(this._retainedSize),'shallowSize-percent':this._toPercentString(shallowSizePercent),'retainedSize-percent':this._toPercentString(retainedSizePercent)};}
retainersDataSource(){return{snapshot:this._dataGrid.snapshot,snapshotNodeIndex:this.snapshotNodeIndex};}
createCell(columnId){const cell=columnId!=='object'?this._createValueCell(columnId):this._createObjectCell();if(this._searchMatched){cell.classList.add('highlight');}
return cell;}
_createObjectCell(){let value=this._name;let valueStyle='object';switch(this._type){case'concatenated string':case'string':value=`"${value}"`;valueStyle='string';break;case'regexp':value=`/${value}/`;valueStyle='string';break;case'closure':value=`${value}()`;valueStyle='function';break;case'bigint':valueStyle='bigint';break;case'number':valueStyle='number';break;case'hidden':valueStyle='null';break;case'array':value=value?`${value}[]`:ls`(internal array)[]`;break;}
return this._createObjectCellWithValue(valueStyle,value);}
_createObjectCellWithValue(valueStyle,value){const fragment=Fragment.Fragment.build`
        <td class="object-column disclosure">
          <div class="source-code event-properties" style="overflow: visible" $="container">
            <span class="value object-value-${valueStyle}">${value}</span>
            <span class="object-value-id">@${this.snapshotNodeId}</span>
          </div>
        </td>`;const div=fragment.$('container');this._prefixObjectCell(div);if(this._reachableFromWindow){div.appendChild(Fragment.html`<span class="heap-object-tag" title="${ls`User object reachable from window`}">🗖</span>`);}
if(this.detachedDOMTreeNode){div.appendChild(Fragment.html`<span class="heap-object-tag" title="${ls`Detached from DOM tree`}">✀</span>`);}
this._appendSourceLocation(div);const cell=fragment.element();if(this.depth){cell.style.setProperty('padding-left',(this.depth*this.dataGrid.indentWidth)+'px');}
cell.heapSnapshotNode=this;return cell;}
_prefixObjectCell(div){}
async _appendSourceLocation(div){const linkContainer=Fragment.html`<span class="heap-object-source-link" />`;div.appendChild(linkContainer);const link=await this._dataGrid.dataDisplayDelegate().linkifyObject(this.snapshotNodeIndex);if(link){linkContainer.appendChild(link);this.linkElement=link;}else{linkContainer.remove();}}
async queryObjectContent(heapProfilerModel,objectGroupName){const remoteObject=await this.tryQueryObjectContent(heapProfilerModel,objectGroupName);return remoteObject||heapProfilerModel.runtimeModel().createRemoteObjectFromPrimitiveValue(ls`Preview is not available`);}
async tryQueryObjectContent(heapProfilerModel,objectGroupName){if(this._type==='string'){return heapProfilerModel.runtimeModel().createRemoteObjectFromPrimitiveValue(this._name);}
return await heapProfilerModel.objectForSnapshotObjectId(String(this.snapshotNodeId),objectGroupName);}
async updateHasChildren(){const isEmpty=await this._provider().isEmpty();this.setHasChildren(!isEmpty);}
shortenWindowURL(fullName,hasObjectId){const startPos=fullName.indexOf('/');const endPos=hasObjectId?fullName.indexOf('@'):fullName.length;if(startPos===-1||endPos===-1){return fullName;}
const fullURL=fullName.substring(startPos+1,endPos).trimLeft();let url=StringUtilities.trimURL(fullURL);if(url.length>40){url=url.trimMiddle(40);}
return fullName.substr(0,startPos+2)+url+fullName.substr(endPos);}
populateContextMenu(contextMenu,dataDisplayDelegate,heapProfilerModel){contextMenu.revealSection().appendItem(ls`Reveal in Summary view`,()=>{dataDisplayDelegate.showObject(String(this.snapshotNodeId),ls`Summary`);});if(this._referenceName){for(const match of this._referenceName.matchAll(/\((?<objectName>[^@)]*) @(?<snapshotNodeId>\d+)\)/g)){const{objectName,snapshotNodeId}=(match.groups);contextMenu.revealSection().appendItem(ls`Reveal object '${objectName}' with id @${snapshotNodeId} in Summary view`,()=>{dataDisplayDelegate.showObject(snapshotNodeId,ls`Summary`);});}}
if(heapProfilerModel){contextMenu.revealSection().appendItem(ls`Store as global variable`,async()=>{const remoteObject=await this.tryQueryObjectContent((heapProfilerModel),'');if(!remoteObject){Console.Console.instance().error(ls`Preview is not available`);}else{await ConsoleModel.ConsoleModel.instance().saveToTempVariable(self.UI.context.flavor(RuntimeModel.ExecutionContext),remoteObject);}});}}}
class HeapSnapshotObjectNode extends HeapSnapshotGenericObjectNode{constructor(dataGrid,snapshot,edge,parentObjectNode){super(dataGrid,edge.node);this._referenceName=edge.name;this._referenceType=edge.type;this._edgeIndex=edge.edgeIndex;this._snapshot=snapshot;this._parentObjectNode=parentObjectNode;this._cycledWithAncestorGridNode=this._findAncestorWithSameSnapshotNodeId();if(!this._cycledWithAncestorGridNode){this.updateHasChildren();}
const data=this.data;data['count']='';data['addedCount']='';data['removedCount']='';data['countDelta']='';data['addedSize']='';data['removedSize']='';data['sizeDelta']='';}
retainersDataSource(){return{snapshot:this._snapshot,snapshotNodeIndex:this.snapshotNodeIndex};}
createProvider(){return this._snapshot.createEdgesProvider(this.snapshotNodeIndex);}
_findAncestorWithSameSnapshotNodeId(){let ancestor=this._parentObjectNode;while(ancestor){if(ancestor.snapshotNodeId===this.snapshotNodeId){return ancestor;}
ancestor=ancestor._parentObjectNode;}
return null;}
_createChildNode(item){return new HeapSnapshotObjectNode(this._dataGrid,this._snapshot,item,this);}
_childHashForEntity(edge){return edge.edgeIndex;}
_childHashForNode(childNode){return childNode._edgeIndex;}
comparator(){const sortAscending=this._dataGrid.isSortOrderAscending();const sortColumnId=this._dataGrid.sortColumnId();const sortFields={object:['!edgeName',sortAscending,'retainedSize',false],count:['!edgeName',true,'retainedSize',false],shallowSize:['selfSize',sortAscending,'!edgeName',true],retainedSize:['retainedSize',sortAscending,'!edgeName',true],distance:['distance',sortAscending,'_name',true]}[sortColumnId]||['!edgeName',true,'retainedSize',false];return HeapSnapshotGridNode.createComparator(sortFields);}
_prefixObjectCell(div){let name=this._referenceName||'(empty)';let nameClass='name';switch(this._referenceType){case'context':nameClass='object-value-number';break;case'internal':case'hidden':case'weak':nameClass='object-value-null';break;case'element':name=`[${name}]`;break;}
if(this._cycledWithAncestorGridNode){div.classList.add('cycled-ancessor-node');}
div.prepend(Fragment.html`<span class="${nameClass}">${name}</span>
                        <span class="grayed">${this._edgeNodeSeparator()}</span>`);}
_edgeNodeSeparator(){return'::';}}
class HeapSnapshotRetainingObjectNode extends HeapSnapshotObjectNode{constructor(dataGrid,snapshot,edge,parentRetainingObjectNode){super(dataGrid,snapshot,edge,parentRetainingObjectNode);}
createProvider(){return this._snapshot.createRetainingEdgesProvider(this.snapshotNodeIndex);}
_createChildNode(item){return new HeapSnapshotRetainingObjectNode(this._dataGrid,this._snapshot,item,this);}
_edgeNodeSeparator(){return ls`in`;}
expand(){this._expandRetainersChain(20);}
_expandRetainersChain(maxExpandLevels){if(!this._populated){this.once(HeapSnapshotGridNode.Events.PopulateComplete).then(()=>this._expandRetainersChain(maxExpandLevels));this.populate();return;}
super.expand();if(--maxExpandLevels>0&&this.children.length>0){const retainer=this.children[0];if(retainer._distance>1){retainer._expandRetainersChain(maxExpandLevels);return;}}
this._dataGrid.dispatchEventToListeners(HeapSnapshotRetainmentDataGrid.Events.ExpandRetainersComplete);}}
class HeapSnapshotInstanceNode extends HeapSnapshotGenericObjectNode{constructor(dataGrid,snapshot,node,isDeletedNode){super(dataGrid,node);this._baseSnapshotOrSnapshot=snapshot;this._isDeletedNode=isDeletedNode;this.updateHasChildren();const data=this.data;data['count']='';data['countDelta']='';data['sizeDelta']='';if(this._isDeletedNode){data['addedCount']='';data['addedSize']='';data['removedCount']='\u2022';data['removedSize']=Number.withThousandsSeparator(this._shallowSize);}else{data['addedCount']='\u2022';data['addedSize']=Number.withThousandsSeparator(this._shallowSize);data['removedCount']='';data['removedSize']='';}}
retainersDataSource(){return{snapshot:this._baseSnapshotOrSnapshot,snapshotNodeIndex:this.snapshotNodeIndex};}
createProvider(){return this._baseSnapshotOrSnapshot.createEdgesProvider(this.snapshotNodeIndex);}
_createChildNode(item){return new HeapSnapshotObjectNode(this._dataGrid,this._baseSnapshotOrSnapshot,item,null);}
_childHashForEntity(edge){return edge.edgeIndex;}
_childHashForNode(childNode){return childNode._edgeIndex;}
comparator(){const sortAscending=this._dataGrid.isSortOrderAscending();const sortColumnId=this._dataGrid.sortColumnId();const sortFields={object:['!edgeName',sortAscending,'retainedSize',false],distance:['distance',sortAscending,'retainedSize',false],count:['!edgeName',true,'retainedSize',false],addedSize:['selfSize',sortAscending,'!edgeName',true],removedSize:['selfSize',sortAscending,'!edgeName',true],shallowSize:['selfSize',sortAscending,'!edgeName',true],retainedSize:['retainedSize',sortAscending,'!edgeName',true]}[sortColumnId]||['!edgeName',true,'retainedSize',false];return HeapSnapshotGridNode.createComparator(sortFields);}}
class HeapSnapshotConstructorNode extends HeapSnapshotGridNode{constructor(dataGrid,className,aggregate,nodeFilter){super(dataGrid,aggregate.count>0);this._name=className;this._nodeFilter=nodeFilter;this._distance=aggregate.distance;this._count=aggregate.count;this._shallowSize=aggregate.self;this._retainedSize=aggregate.maxRet;const snapshot=dataGrid.snapshot;const retainedSizePercent=this._retainedSize/snapshot.totalSize*100.0;const shallowSizePercent=this._shallowSize/snapshot.totalSize*100.0;this.data={'object':className,'count':Number.withThousandsSeparator(this._count),'distance':this._toUIDistance(this._distance),'shallowSize':Number.withThousandsSeparator(this._shallowSize),'retainedSize':Number.withThousandsSeparator(this._retainedSize),'shallowSize-percent':this._toPercentString(shallowSizePercent),'retainedSize-percent':this._toPercentString(retainedSizePercent)};}
createProvider(){return this._dataGrid.snapshot.createNodesProviderForClass(this._name,this._nodeFilter);}
async populateNodeBySnapshotObjectId(snapshotObjectId){this._dataGrid.resetNameFilter();await this.expandWithoutPopulate();const nodePosition=await this._provider().nodePosition(snapshotObjectId);if(nodePosition===-1){this.collapse();return[];}
await this._populateChildren(nodePosition,null);const node=(this.childForPosition(nodePosition));return node?[this,node]:[];}
filteredOut(filterValue){return this._name.toLowerCase().indexOf(filterValue)===-1;}
createCell(columnId){const cell=columnId==='object'?super.createCell(columnId):this._createValueCell(columnId);if(columnId==='object'&&this._count>1){cell.appendChild(Fragment.html`<span class="objects-count">×${this._count}</span>`);}
if(this._searchMatched){cell.classList.add('highlight');}
return cell;}
_createChildNode(item){return new HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.snapshot,item,false);}
comparator(){const sortAscending=this._dataGrid.isSortOrderAscending();const sortColumnId=this._dataGrid.sortColumnId();const sortFields={object:['name',sortAscending,'id',true],distance:['distance',sortAscending,'retainedSize',false],shallowSize:['selfSize',sortAscending,'id',true],retainedSize:['retainedSize',sortAscending,'id',true]}[sortColumnId];return HeapSnapshotGridNode.createComparator(sortFields);}
_childHashForEntity(node){return node.id;}
_childHashForNode(childNode){return childNode.snapshotNodeId;}}
class HeapSnapshotDiffNodesProvider{constructor(addedNodesProvider,deletedNodesProvider,addedCount,removedCount){this._addedNodesProvider=addedNodesProvider;this._deletedNodesProvider=deletedNodesProvider;this._addedCount=addedCount;this._removedCount=removedCount;}
dispose(){this._addedNodesProvider.dispose();this._deletedNodesProvider.dispose();}
nodePosition(snapshotObjectId){throw new Error('Unreachable');}
isEmpty(){return Promise.resolve(false);}
async serializeItemsRange(beginPosition,endPosition){let itemsRange;let addedItems;if(beginPosition<this._addedCount){itemsRange=await this._addedNodesProvider.serializeItemsRange(beginPosition,endPosition);for(const item of itemsRange.items){item.isAddedNotRemoved=true;}
if(itemsRange.endPosition>=endPosition){itemsRange.totalLength=this._addedCount+this._removedCount;return itemsRange;}
addedItems=itemsRange;itemsRange=await this._deletedNodesProvider.serializeItemsRange(0,endPosition-itemsRange.endPosition);}else{addedItems=new HeapSnapshotModel.ItemsRange(0,0,0,[]);itemsRange=await this._deletedNodesProvider.serializeItemsRange(beginPosition-this._addedCount,endPosition-this._addedCount);}
if(!addedItems.items.length){addedItems.startPosition=this._addedCount+itemsRange.startPosition;}
for(const item of itemsRange.items){item.isAddedNotRemoved=false;}
addedItems.items.push(...itemsRange.items);addedItems.endPosition=this._addedCount+itemsRange.endPosition;addedItems.totalLength=this._addedCount+this._removedCount;return addedItems;}
async sortAndRewind(comparator){await this._addedNodesProvider.sortAndRewind(comparator);await this._deletedNodesProvider.sortAndRewind(comparator);}}
class HeapSnapshotDiffNode extends HeapSnapshotGridNode{constructor(dataGrid,className,diffForClass){super(dataGrid,true);this._name=className;this._addedCount=diffForClass.addedCount;this._removedCount=diffForClass.removedCount;this._countDelta=diffForClass.countDelta;this._addedSize=diffForClass.addedSize;this._removedSize=diffForClass.removedSize;this._sizeDelta=diffForClass.sizeDelta;this._deletedIndexes=diffForClass.deletedIndexes;this.data={'object':className,'addedCount':Number.withThousandsSeparator(this._addedCount),'removedCount':Number.withThousandsSeparator(this._removedCount),'countDelta':this._signForDelta(this._countDelta)+Number.withThousandsSeparator(Math.abs(this._countDelta)),'addedSize':Number.withThousandsSeparator(this._addedSize),'removedSize':Number.withThousandsSeparator(this._removedSize),'sizeDelta':this._signForDelta(this._sizeDelta)+Number.withThousandsSeparator(Math.abs(this._sizeDelta))};}
createProvider(){const tree=this._dataGrid;return new HeapSnapshotDiffNodesProvider(tree.snapshot.createAddedNodesProvider(tree.baseSnapshot.uid,this._name),tree.baseSnapshot.createDeletedNodesProvider(this._deletedIndexes),this._addedCount,this._removedCount);}
createCell(columnId){const cell=super.createCell(columnId);if(columnId!=='object'){cell.classList.add('numeric-column');}
return cell;}
_createChildNode(item){if(item.isAddedNotRemoved){return new HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.snapshot,item,false);}
return new HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.baseSnapshot,item,true);}
_childHashForEntity(node){return node.id;}
_childHashForNode(childNode){return childNode.snapshotNodeId;}
comparator(){const sortAscending=this._dataGrid.isSortOrderAscending();const sortColumnId=this._dataGrid.sortColumnId();const sortFields={object:['name',sortAscending,'id',true],addedCount:['name',true,'id',true],removedCount:['name',true,'id',true],countDelta:['name',true,'id',true],addedSize:['selfSize',sortAscending,'id',true],removedSize:['selfSize',sortAscending,'id',true],sizeDelta:['selfSize',sortAscending,'id',true]}[sortColumnId];return HeapSnapshotGridNode.createComparator(sortFields);}
filteredOut(filterValue){return this._name.toLowerCase().indexOf(filterValue)===-1;}
_signForDelta(delta){if(delta===0){return'';}
if(delta>0){return'+';}
return'\u2212';}}
class AllocationGridNode extends HeapSnapshotGridNode{constructor(dataGrid,data){super(dataGrid,data.hasChildren);this._populated=false;this._allocationNode=data;this.data={'liveCount':Number.withThousandsSeparator(data.liveCount),'count':Number.withThousandsSeparator(data.count),'liveSize':Number.withThousandsSeparator(data.liveSize),'size':Number.withThousandsSeparator(data.size),'name':data.name};}
populate(){if(this._populated){return;}
this._doPopulate();}
async _doPopulate(){this._populated=true;const callers=await this._dataGrid.snapshot.allocationNodeCallers(this._allocationNode.id);const callersChain=callers.nodesWithSingleCaller;let parentNode=this;const dataGrid=(this._dataGrid);for(const caller of callersChain){const child=new AllocationGridNode(dataGrid,caller);dataGrid.appendNode(parentNode,child);parentNode=child;parentNode._populated=true;if(this.expanded){parentNode.expand();}}
const callersBranch=callers.branchingCallers;callersBranch.sort(this._dataGrid._createComparator());for(const caller of callersBranch){dataGrid.appendNode(parentNode,new AllocationGridNode(dataGrid,caller));}
dataGrid.updateVisibleNodes(true);}
expand(){super.expand();if(this.children.length===1){this.children[0].expand();}}
createCell(columnId){if(columnId!=='name'){return this._createValueCell(columnId);}
const cell=super.createCell(columnId);const allocationNode=this._allocationNode;const heapProfilerModel=this._dataGrid.heapProfilerModel();if(allocationNode.scriptId){const linkifier=this._dataGrid._linkifier;const urlElement=linkifier.linkifyScriptLocation(heapProfilerModel?heapProfilerModel.target():null,String(allocationNode.scriptId),allocationNode.scriptName,allocationNode.line-1,allocationNode.column-1,'profile-node-file');urlElement.style.maxWidth='75%';cell.insertBefore(urlElement,cell.firstChild);}
return cell;}
allocationNodeId(){return this._allocationNode.id;}}
var HeapSnapshotGridNodes=Object.freeze({__proto__:null,HeapSnapshotGridNode:HeapSnapshotGridNode,HeapSnapshotGenericObjectNode:HeapSnapshotGenericObjectNode,HeapSnapshotObjectNode:HeapSnapshotObjectNode,HeapSnapshotRetainingObjectNode:HeapSnapshotRetainingObjectNode,HeapSnapshotInstanceNode:HeapSnapshotInstanceNode,HeapSnapshotConstructorNode:HeapSnapshotConstructorNode,HeapSnapshotDiffNodesProvider:HeapSnapshotDiffNodesProvider,HeapSnapshotDiffNode:HeapSnapshotDiffNode,AllocationGridNode:AllocationGridNode});class HeapSnapshotSortableDataGrid extends DataGrid.DataGridImpl{constructor(heapProfilerModel,dataDisplayDelegate,dataGridParameters){super(dataGridParameters);this._heapProfilerModel=heapProfilerModel;this._dataDisplayDelegate=dataDisplayDelegate;const tooltips=[['distance',ls`Distance from window object`],['shallowSize',ls`Size of the object itself in bytes`],['retainedSize',ls`Size of the object plus the graph it retains in bytes`]];for(const info of tooltips){const headerCell=this.headerTableHeader(info[0]);if(headerCell){headerCell.setAttribute('title',info[1]);}}
this._recursiveSortingDepth=0;this._highlightedNode=null;this._populatedAndSorted=false;this._nameFilter=null;this._nodeFilter=new HeapSnapshotModel.NodeFilter();this.addEventListener(HeapSnapshotSortableDataGrid.Events.SortingComplete,this._sortingComplete,this);this.addEventListener(DataGrid.Events.SortingChanged,this.sortingChanged,this);this.setRowContextMenuCallback(this._populateContextMenu.bind(this));}
heapProfilerModel(){return this._heapProfilerModel;}
dataDisplayDelegate(){return this._dataDisplayDelegate;}
nodeFilter(){return this._nodeFilter;}
setNameFilter(nameFilter){this._nameFilter=nameFilter;}
defaultPopulateCount(){return 100;}
_disposeAllNodes(){const children=this.topLevelNodes();for(let i=0,l=children.length;i<l;++i){children[i].dispose();}}
wasShown(){if(this._nameFilter){this._nameFilter.addEventListener(Toolbar.ToolbarInput.Event.TextChanged,this._onNameFilterChanged,this);this.updateVisibleNodes(true);}
if(this._populatedAndSorted){this.dispatchEventToListeners(HeapSnapshotSortableDataGrid.Events.ContentShown,this);}}
_sortingComplete(){this.removeEventListener(HeapSnapshotSortableDataGrid.Events.SortingComplete,this._sortingComplete,this);this._populatedAndSorted=true;this.dispatchEventToListeners(HeapSnapshotSortableDataGrid.Events.ContentShown,this);}
willHide(){if(this._nameFilter){this._nameFilter.removeEventListener(Toolbar.ToolbarInput.Event.TextChanged,this._onNameFilterChanged,this);}
this._clearCurrentHighlight();}
_populateContextMenu(contextMenu,gridNode){const node=(gridNode);node.populateContextMenu(contextMenu,this._dataDisplayDelegate,this.heapProfilerModel());if(gridNode.linkElement&&!contextMenu.containsTarget(gridNode.linkElement)){contextMenu.appendApplicableItems(gridNode.linkElement);}}
resetSortingCache(){delete this._lastSortColumnId;delete this._lastSortAscending;}
topLevelNodes(){return this.rootNode().children;}
revealObjectByHeapSnapshotId(heapSnapshotObjectId){return Promise.resolve((null));}
highlightNode(node){this._clearCurrentHighlight();this._highlightedNode=node;UIUtils.runCSSAnimationOnce(this._highlightedNode.element(),'highlighted-row');}
_clearCurrentHighlight(){if(!this._highlightedNode){return;}
this._highlightedNode.element().classList.remove('highlighted-row');this._highlightedNode=null;}
resetNameFilter(){this._nameFilter.setValue('');}
_onNameFilterChanged(){this.updateVisibleNodes(true);this._deselectFilteredNodes();}
_deselectFilteredNodes(){let currentNode=this.selectedNode;while(currentNode){if(this._isFilteredOut(currentNode)){this.selectedNode.deselect();this.selectedNode=null;return;}
currentNode=currentNode.parent;}}
sortingChanged(){const sortAscending=this.isSortOrderAscending();const sortColumnId=this.sortColumnId();if(this._lastSortColumnId===sortColumnId&&this._lastSortAscending===sortAscending){return;}
this._lastSortColumnId=sortColumnId;this._lastSortAscending=sortAscending;const sortFields=this._sortFields(sortColumnId,sortAscending);function SortByTwoFields(nodeA,nodeB){let field1=nodeA[sortFields[0]];let field2=nodeB[sortFields[0]];let result=field1<field2?-1:(field1>field2?1:0);if(!sortFields[1]){result=-result;}
if(result!==0){return result;}
field1=nodeA[sortFields[2]];field2=nodeB[sortFields[2]];result=field1<field2?-1:(field1>field2?1:0);if(!sortFields[3]){result=-result;}
return result;}
this._performSorting(SortByTwoFields);}
_performSorting(sortFunction){this.recursiveSortingEnter();const children=this.allChildren(this.rootNode());this.rootNode().removeChildren();children.sort(sortFunction);for(let i=0,l=children.length;i<l;++i){const child=children[i];this.appendChildAfterSorting(child);if(child.expanded){child.sort();}}
this.recursiveSortingLeave();}
appendChildAfterSorting(child){const revealed=child.revealed;this.rootNode().appendChild(child);child.revealed=revealed;}
recursiveSortingEnter(){++this._recursiveSortingDepth;}
recursiveSortingLeave(){if(!this._recursiveSortingDepth){return;}
if(--this._recursiveSortingDepth){return;}
this.updateVisibleNodes(true);this.dispatchEventToListeners(HeapSnapshotSortableDataGrid.Events.SortingComplete);}
updateVisibleNodes(force){}
allChildren(parent){return parent.children;}
insertChild(parent,node,index){parent.insertChild(node,index);}
removeChildByIndex(parent,index){parent.removeChild(parent.children[index]);}
removeAllChildren(parent){parent.removeChildren();}}
HeapSnapshotSortableDataGrid.Events={ContentShown:Symbol('ContentShown'),SortingComplete:Symbol('SortingComplete')};class HeapSnapshotViewportDataGrid extends HeapSnapshotSortableDataGrid{constructor(heapProfilerModel,dataDisplayDelegate,dataGridParameters){super(heapProfilerModel,dataDisplayDelegate,dataGridParameters);this.scrollContainer.addEventListener('scroll',this._onScroll.bind(this),true);this._topPaddingHeight=0;this._bottomPaddingHeight=0;}
topLevelNodes(){return this.allChildren(this.rootNode());}
appendChildAfterSorting(child){}
updateVisibleNodes(force){const guardZoneHeight=40;const scrollHeight=this.scrollContainer.scrollHeight;let scrollTop=this.scrollContainer.scrollTop;let scrollBottom=scrollHeight-scrollTop-this.scrollContainer.offsetHeight;scrollTop=Math.max(0,scrollTop-guardZoneHeight);scrollBottom=Math.max(0,scrollBottom-guardZoneHeight);let viewPortHeight=scrollHeight-scrollTop-scrollBottom;if(!force&&scrollTop>=this._topPaddingHeight&&scrollBottom>=this._bottomPaddingHeight){return;}
const hysteresisHeight=500;scrollTop-=hysteresisHeight;viewPortHeight+=2*hysteresisHeight;const selectedNode=this.selectedNode;this.rootNode().removeChildren();this._topPaddingHeight=0;this._bottomPaddingHeight=0;this._addVisibleNodes(this.rootNode(),scrollTop,scrollTop+viewPortHeight);this.setVerticalPadding(this._topPaddingHeight,this._bottomPaddingHeight);if(selectedNode){if(selectedNode.parent){selectedNode.select(true);}else{this.selectedNode=selectedNode;}}}
_addVisibleNodes(parentNode,topBound,bottomBound){if(!parentNode.expanded){return 0;}
const children=this.allChildren(parentNode);let topPadding=0;let i=0;for(;i<children.length;++i){const child=children[i];if(this._isFilteredOut(child)){continue;}
const newTop=topPadding+this._nodeHeight(child);if(newTop>topBound){break;}
topPadding=newTop;}
let position=topPadding;for(;i<children.length&&position<bottomBound;++i){const child=children[i];if(this._isFilteredOut(child)){continue;}
const hasChildren=child.hasChildren();child.removeChildren();child.setHasChildren(hasChildren);parentNode.appendChild(child);position+=child.nodeSelfHeight();position+=this._addVisibleNodes(child,topBound-position,bottomBound-position);}
let bottomPadding=0;for(;i<children.length;++i){const child=children[i];if(this._isFilteredOut(child)){continue;}
bottomPadding+=this._nodeHeight(child);}
this._topPaddingHeight+=topPadding;this._bottomPaddingHeight+=bottomPadding;return position+bottomPadding;}
_isFilteredOut(node){const nameFilterValue=this._nameFilter?this._nameFilter.value().toLowerCase():'';if(nameFilterValue&&node.filteredOut&&node.filteredOut(nameFilterValue)){return true;}
return false;}
_nodeHeight(node){let result=node.nodeSelfHeight();if(!node.expanded){return result;}
const children=this.allChildren(node);for(let i=0;i<children.length;i++){result+=this._nodeHeight(children[i]);}
return result;}
revealTreeNode(pathToReveal){const height=this._calculateOffset(pathToReveal);const node=(pathToReveal.peekLast());const scrollTop=this.scrollContainer.scrollTop;const scrollBottom=scrollTop+this.scrollContainer.offsetHeight;if(height>=scrollTop&&height<scrollBottom){return Promise.resolve(node);}
const scrollGap=40;this.scrollContainer.scrollTop=Math.max(0,height-scrollGap);return new Promise(resolve=>{console.assert(!this._scrollToResolveCallback);this._scrollToResolveCallback=resolve.bind(null,node);this.scrollContainer.window().requestAnimationFrame(()=>{if(!this._scrollToResolveCallback){return;}
this._scrollToResolveCallback();this._scrollToResolveCallback=null;});});}
_calculateOffset(pathToReveal){let parentNode=this.rootNode();let height=0;for(let i=0;i<pathToReveal.length;++i){const node=pathToReveal[i];const children=this.allChildren(parentNode);for(let j=0;j<children.length;++j){const child=children[j];if(node===child){height+=node.nodeSelfHeight();break;}
height+=this._nodeHeight(child);}
parentNode=node;}
return height-pathToReveal.peekLast().nodeSelfHeight();}
allChildren(parent){return parent._allChildren||(parent._allChildren=[]);}
appendNode(parent,node){this.allChildren(parent).push(node);}
insertChild(parent,node,index){this.allChildren(parent).splice(index,0,(node));}
removeChildByIndex(parent,index){this.allChildren(parent).splice(index,1);}
removeAllChildren(parent){parent._allChildren=[];}
removeTopLevelNodes(){this._disposeAllNodes();this.rootNode().removeChildren();this.rootNode()._allChildren=[];}
_isScrolledIntoView(element){const viewportTop=this.scrollContainer.scrollTop;const viewportBottom=viewportTop+this.scrollContainer.clientHeight;const elemTop=element.offsetTop;const elemBottom=elemTop+element.offsetHeight;return elemBottom<=viewportBottom&&elemTop>=viewportTop;}
onResize(){super.onResize();this.updateVisibleNodes(false);}
_onScroll(event){this.updateVisibleNodes(false);if(this._scrollToResolveCallback){this._scrollToResolveCallback();this._scrollToResolveCallback=null;}}}
class HeapSnapshotContainmentDataGrid extends HeapSnapshotSortableDataGrid{constructor(heapProfilerModel,dataDisplayDelegate,displayName,columns){columns=columns||(([{id:'object',title:ls`Object`,disclosure:true,sortable:true},{id:'distance',title:ls`Distance`,width:'70px',sortable:true,fixedWidth:true},{id:'shallowSize',title:ls`Shallow Size`,width:'110px',sortable:true,fixedWidth:true},{id:'retainedSize',title:ls`Retained Size`,width:'110px',sortable:true,fixedWidth:true,sort:DataGrid.Order.Descending}]));const dataGridParameters={displayName,columns};super(heapProfilerModel,dataDisplayDelegate,dataGridParameters);}
setDataSource(snapshot,nodeIndex){this.snapshot=snapshot;const node={nodeIndex:nodeIndex||snapshot.rootNodeIndex};const fakeEdge={node:node};this.setRootNode(this._createRootNode(snapshot,fakeEdge));this.rootNode().sort();}
_createRootNode(snapshot,fakeEdge){return new HeapSnapshotObjectNode(this,snapshot,fakeEdge,null);}
sortingChanged(){const rootNode=this.rootNode();if(rootNode.hasChildren()){rootNode.sort();}}}
class HeapSnapshotRetainmentDataGrid extends HeapSnapshotContainmentDataGrid{constructor(heapProfilerModel,dataDisplayDelegate){const columns=([{id:'object',title:ls`Object`,disclosure:true,sortable:true},{id:'distance',title:ls`Distance`,width:'70px',sortable:true,fixedWidth:true,sort:DataGrid.Order.Ascending},{id:'shallowSize',title:ls`Shallow Size`,width:'110px',sortable:true,fixedWidth:true},{id:'retainedSize',title:ls`Retained Size`,width:'110px',sortable:true,fixedWidth:true}]);super(heapProfilerModel,dataDisplayDelegate,ls`Heap Snapshot Retainment`,columns);}
_createRootNode(snapshot,fakeEdge){return new HeapSnapshotRetainingObjectNode(this,snapshot,fakeEdge,null);}
_sortFields(sortColumn,sortAscending){return{object:['_name',sortAscending,'_count',false],count:['_count',sortAscending,'_name',true],shallowSize:['_shallowSize',sortAscending,'_name',true],retainedSize:['_retainedSize',sortAscending,'_name',true],distance:['_distance',sortAscending,'_name',true]}[sortColumn];}
reset(){this.rootNode().removeChildren();this.resetSortingCache();}
setDataSource(snapshot,nodeIndex){super.setDataSource(snapshot,nodeIndex);this.rootNode().expand();}}
HeapSnapshotRetainmentDataGrid.Events={ExpandRetainersComplete:Symbol('ExpandRetainersComplete')};class HeapSnapshotConstructorsDataGrid extends HeapSnapshotViewportDataGrid{constructor(heapProfilerModel,dataDisplayDelegate){const columns=([{id:'object',title:ls`Constructor`,disclosure:true,sortable:true},{id:'distance',title:ls`Distance`,width:'70px',sortable:true,fixedWidth:true},{id:'shallowSize',title:ls`Shallow Size`,width:'110px',sortable:true,fixedWidth:true},{id:'retainedSize',title:ls`Retained Size`,width:'110px',sort:DataGrid.Order.Descending,sortable:true,fixedWidth:true}]);super(heapProfilerModel,dataDisplayDelegate,{displayName:ls`Heap Snapshot Constructors`,columns});this._profileIndex=-1;this._objectIdToSelect=null;}
_sortFields(sortColumn,sortAscending){return{object:['_name',sortAscending,'_retainedSize',false],distance:['_distance',sortAscending,'_retainedSize',false],shallowSize:['_shallowSize',sortAscending,'_name',true],retainedSize:['_retainedSize',sortAscending,'_name',true]}[sortColumn];}
async revealObjectByHeapSnapshotId(id){if(!this.snapshot){this._objectIdToSelect=id;return null;}
const className=await this.snapshot.nodeClassName(parseInt(id,10));if(!className){return null;}
const parent=this.topLevelNodes().find(classNode=>classNode._name===className);if(!parent){return null;}
const nodes=await parent.populateNodeBySnapshotObjectId(parseInt(id,10));return nodes.length?this.revealTreeNode(nodes):null;}
clear(){this._nextRequestedFilter=null;this._lastFilter=null;this.removeTopLevelNodes();}
setDataSource(snapshot){this.snapshot=snapshot;if(this._profileIndex===-1){this._populateChildren();}
if(this._objectIdToSelect){this.revealObjectByHeapSnapshotId(this._objectIdToSelect);this._objectIdToSelect=null;}}
setSelectionRange(minNodeId,maxNodeId){this._nodeFilter=new HeapSnapshotModel.NodeFilter(minNodeId,maxNodeId);this._populateChildren(this._nodeFilter);}
setAllocationNodeId(allocationNodeId){this._nodeFilter=new HeapSnapshotModel.NodeFilter();this._nodeFilter.allocationNodeId=allocationNodeId;this._populateChildren(this._nodeFilter);}
_aggregatesReceived(nodeFilter,aggregates){this._filterInProgress=null;if(this._nextRequestedFilter){this.snapshot.aggregatesWithFilter(this._nextRequestedFilter).then(this._aggregatesReceived.bind(this,this._nextRequestedFilter));this._filterInProgress=this._nextRequestedFilter;this._nextRequestedFilter=null;}
this.removeTopLevelNodes();this.resetSortingCache();for(const constructor in aggregates){this.appendNode(this.rootNode(),new HeapSnapshotConstructorNode(this,constructor,aggregates[constructor],nodeFilter));}
this.sortingChanged();this._lastFilter=nodeFilter;}
async _populateChildren(maybeNodeFilter){const nodeFilter=maybeNodeFilter||new HeapSnapshotModel.NodeFilter();if(this._filterInProgress){this._nextRequestedFilter=this._filterInProgress.equals(nodeFilter)?null:nodeFilter;return;}
if(this._lastFilter&&this._lastFilter.equals(nodeFilter)){return;}
this._filterInProgress=nodeFilter;const aggregates=await this.snapshot.aggregatesWithFilter(nodeFilter);this._aggregatesReceived(nodeFilter,aggregates);}
filterSelectIndexChanged(profiles,profileIndex){this._profileIndex=profileIndex;this._nodeFilter=undefined;if(profileIndex!==-1){const minNodeId=profileIndex>0?profiles[profileIndex-1].maxJSObjectId:0;const maxNodeId=profiles[profileIndex].maxJSObjectId;this._nodeFilter=new HeapSnapshotModel.NodeFilter(minNodeId,maxNodeId);}
this._populateChildren(this._nodeFilter);}}
class HeapSnapshotDiffDataGrid extends HeapSnapshotViewportDataGrid{constructor(heapProfilerModel,dataDisplayDelegate){const columns=([{id:'object',title:ls`Constructor`,disclosure:true,sortable:true},{id:'addedCount',title:ls`# New`,width:'75px',sortable:true,fixedWidth:true},{id:'removedCount',title:ls`# Deleted`,width:'75px',sortable:true,fixedWidth:true},{id:'countDelta',title:ls`# Delta`,width:'65px',sortable:true,fixedWidth:true},{id:'addedSize',title:ls`Alloc. Size`,width:'75px',sortable:true,fixedWidth:true,sort:DataGrid.Order.Descending},{id:'removedSize',title:ls`Freed Size`,width:'75px',sortable:true,fixedWidth:true},{id:'sizeDelta',title:ls`Size Delta`,width:'75px',sortable:true,fixedWidth:true}]);super(heapProfilerModel,dataDisplayDelegate,{displayName:ls`Heap Snapshot Diff`,columns});}
defaultPopulateCount(){return 50;}
_sortFields(sortColumn,sortAscending){return{object:['_name',sortAscending,'_count',false],addedCount:['_addedCount',sortAscending,'_name',true],removedCount:['_removedCount',sortAscending,'_name',true],countDelta:['_countDelta',sortAscending,'_name',true],addedSize:['_addedSize',sortAscending,'_name',true],removedSize:['_removedSize',sortAscending,'_name',true],sizeDelta:['_sizeDelta',sortAscending,'_name',true]}[sortColumn];}
setDataSource(snapshot){this.snapshot=snapshot;}
setBaseDataSource(baseSnapshot){this.baseSnapshot=baseSnapshot;this.removeTopLevelNodes();this.resetSortingCache();if(this.baseSnapshot===this.snapshot){this.dispatchEventToListeners(HeapSnapshotSortableDataGrid.Events.SortingComplete);return;}
this._populateChildren();}
async _populateChildren(){const aggregatesForDiff=await this.baseSnapshot.aggregatesForDiff();const diffByClassName=await this.snapshot.calculateSnapshotDiff(this.baseSnapshot.uid,aggregatesForDiff);for(const className in diffByClassName){const diff=diffByClassName[className];this.appendNode(this.rootNode(),new HeapSnapshotDiffNode(this,className,diff));}
this.sortingChanged();}}
class AllocationDataGrid extends HeapSnapshotViewportDataGrid{constructor(heapProfilerModel,dataDisplayDelegate){const columns=([{id:'liveCount',title:ls`Live Count`,width:'75px',sortable:true,fixedWidth:true},{id:'count',title:ls`Count`,width:'65px',sortable:true,fixedWidth:true},{id:'liveSize',title:ls`Live Size`,width:'75px',sortable:true,fixedWidth:true},{id:'size',title:ls`Size`,width:'75px',sortable:true,fixedWidth:true,sort:DataGrid.Order.Descending},{id:'name',title:ls`Function`,disclosure:true,sortable:true},]);super(heapProfilerModel,dataDisplayDelegate,{displayName:ls`Allocation`,columns});this._linkifier=new Linkifier.Linkifier();}
dispose(){this._linkifier.reset();}
async setDataSource(snapshot){this.snapshot=snapshot;this._topNodes=await this.snapshot.allocationTracesTops();this._populateChildren();}
_populateChildren(){this.removeTopLevelNodes();const root=this.rootNode();const tops=this._topNodes;for(const top of tops){this.appendNode(root,new AllocationGridNode(this,top));}
this.updateVisibleNodes(true);}
sortingChanged(){this._topNodes.sort(this._createComparator());this.rootNode().removeChildren();this._populateChildren();}
_createComparator(){const fieldName=this.sortColumnId();const compareResult=(this.sortOrder()===DataGrid.Order.Ascending)?+1:-1;function compare(a,b){if(a[fieldName]>b[fieldName]){return compareResult;}
if(a[fieldName]<b[fieldName]){return-compareResult;}
return 0;}
return compare;}}
var HeapSnapshotDataGrids=Object.freeze({__proto__:null,HeapSnapshotSortableDataGrid:HeapSnapshotSortableDataGrid,HeapSnapshotViewportDataGrid:HeapSnapshotViewportDataGrid,HeapSnapshotContainmentDataGrid:HeapSnapshotContainmentDataGrid,HeapSnapshotRetainmentDataGrid:HeapSnapshotRetainmentDataGrid,HeapSnapshotConstructorsDataGrid:HeapSnapshotConstructorsDataGrid,HeapSnapshotDiffDataGrid:HeapSnapshotDiffDataGrid,AllocationDataGrid:AllocationDataGrid});class HeapSnapshotView extends View.SimpleView{constructor(dataDisplayDelegate,profile){super(UIString.UIString('Heap Snapshot'));this.element.classList.add('heap-snapshot-view');this._profile=profile;this._linkifier=new Linkifier.Linkifier();const profileType=profile.profileType();profileType.addEventListener(HeapSnapshotProfileType.SnapshotReceived,this._onReceiveSnapshot,this);profileType.addEventListener(ProfileEvents.RemoveProfileHeader,this._onProfileHeaderRemoved,this);const isHeapTimeline=profileType.id===TrackingHeapSnapshotProfileType.TypeId;if(isHeapTimeline){this._createOverview();}
this._parentDataDisplayDelegate=dataDisplayDelegate;this._searchableView=new SearchableView.SearchableView(this);this._searchableView.show(this.element);this._splitWidget=new SplitWidget.SplitWidget(false,true,'heapSnapshotSplitViewState',200,200);this._splitWidget.show(this._searchableView.element);const heapProfilerModel=profile.heapProfilerModel();this._containmentDataGrid=new HeapSnapshotContainmentDataGrid(heapProfilerModel,this,ls`Containment`);this._containmentDataGrid.addEventListener(DataGrid.Events.SelectedNode,this._selectionChanged,this);this._containmentWidget=this._containmentDataGrid.asWidget();this._containmentWidget.setMinimumSize(50,25);this._statisticsView=new HeapSnapshotStatisticsView();this._constructorsDataGrid=new HeapSnapshotConstructorsDataGrid(heapProfilerModel,this);this._constructorsDataGrid.addEventListener(DataGrid.Events.SelectedNode,this._selectionChanged,this);this._constructorsWidget=this._constructorsDataGrid.asWidget();this._constructorsWidget.setMinimumSize(50,25);this._diffDataGrid=new HeapSnapshotDiffDataGrid(heapProfilerModel,this);this._diffDataGrid.addEventListener(DataGrid.Events.SelectedNode,this._selectionChanged,this);this._diffWidget=this._diffDataGrid.asWidget();this._diffWidget.setMinimumSize(50,25);if(isHeapTimeline){this._allocationDataGrid=new AllocationDataGrid(heapProfilerModel,this);this._allocationDataGrid.addEventListener(DataGrid.Events.SelectedNode,this._onSelectAllocationNode,this);this._allocationWidget=this._allocationDataGrid.asWidget();this._allocationWidget.setMinimumSize(50,25);this._allocationStackView=new HeapAllocationStackView(heapProfilerModel);this._allocationStackView.setMinimumSize(50,25);this._tabbedPane=new TabbedPane.TabbedPane();}
this._retainmentDataGrid=new HeapSnapshotRetainmentDataGrid(heapProfilerModel,this);this._retainmentWidget=this._retainmentDataGrid.asWidget();this._retainmentWidget.setMinimumSize(50,21);this._retainmentWidget.element.classList.add('retaining-paths-view');let splitWidgetResizer;if(this._allocationStackView){this._tabbedPane=new TabbedPane.TabbedPane();this._tabbedPane.appendTab('retainers',UIString.UIString('Retainers'),this._retainmentWidget);this._tabbedPane.appendTab('allocation-stack',UIString.UIString('Allocation stack'),this._allocationStackView);splitWidgetResizer=this._tabbedPane.headerElement();this._objectDetailsView=this._tabbedPane;}else{const retainmentViewHeader=createElementWithClass('div','heap-snapshot-view-resizer');const retainingPathsTitleDiv=retainmentViewHeader.createChild('div','title');const retainingPathsTitle=retainingPathsTitleDiv.createChild('span');retainingPathsTitle.textContent=UIString.UIString('Retainers');splitWidgetResizer=retainmentViewHeader;this._objectDetailsView=new Widget.VBox();this._objectDetailsView.element.appendChild(retainmentViewHeader);this._retainmentWidget.show(this._objectDetailsView.element);}
this._splitWidget.hideDefaultResizer();this._splitWidget.installResizer(splitWidgetResizer);this._retainmentDataGrid.addEventListener(DataGrid.Events.SelectedNode,this._inspectedObjectChanged,this);this._retainmentDataGrid.reset();this._perspectives=[];this._comparisonPerspective=new ComparisonPerspective();this._perspectives.push(new SummaryPerspective());if(profile.profileType()!==instance.trackingHeapSnapshotProfileType){this._perspectives.push(this._comparisonPerspective);}
this._perspectives.push(new ContainmentPerspective());if(this._allocationWidget){this._perspectives.push(new AllocationPerspective());}
this._perspectives.push(new StatisticsPerspective());this._perspectiveSelect=new Toolbar.ToolbarComboBox(this._onSelectedPerspectiveChanged.bind(this),ls`Perspective`);this._updatePerspectiveOptions();this._baseSelect=new Toolbar.ToolbarComboBox(this._changeBase.bind(this),ls`Base snapshot`);this._baseSelect.setVisible(false);this._updateBaseOptions();this._filterSelect=new Toolbar.ToolbarComboBox(this._changeFilter.bind(this),ls`Filter`);this._filterSelect.setVisible(false);this._updateFilterOptions();this._classNameFilter=new Toolbar.ToolbarInput(ls`Class filter`);this._classNameFilter.setVisible(false);this._constructorsDataGrid.setNameFilter(this._classNameFilter);this._diffDataGrid.setNameFilter(this._classNameFilter);this._selectedSizeText=new Toolbar.ToolbarText();this._popoverHelper=new PopoverHelper.PopoverHelper(this.element,this._getPopoverRequest.bind(this));this._popoverHelper.setDisableOnClick(true);this._popoverHelper.setHasPadding(true);this.element.addEventListener('scroll',this._popoverHelper.hidePopover.bind(this._popoverHelper),true);this._currentPerspectiveIndex=0;this._currentPerspective=this._perspectives[0];this._currentPerspective.activate(this);this._dataGrid=this._currentPerspective.masterGrid(this);this._populate();this._searchThrottler=new Throttler.Throttler(0);for(const existingProfile of this._profiles()){existingProfile.addEventListener(Events.ProfileTitleChanged,this._updateControls,this);}}
_createOverview(){const profileType=this._profile.profileType();this._trackingOverviewGrid=new HeapTimelineOverview();this._trackingOverviewGrid.addEventListener(IdsRangeChanged,this._onIdsRangeChanged.bind(this));if(!this._profile.fromFile()&&profileType.profileBeingRecorded()===this._profile){profileType.addEventListener(TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._onHeapStatsUpdate,this);profileType.addEventListener(TrackingHeapSnapshotProfileType.TrackingStopped,this._onStopTracking,this);this._trackingOverviewGrid.start();}}
_onStopTracking(){this._profile.profileType().removeEventListener(TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._onHeapStatsUpdate,this);this._profile.profileType().removeEventListener(TrackingHeapSnapshotProfileType.TrackingStopped,this._onStopTracking,this);if(this._trackingOverviewGrid){this._trackingOverviewGrid.stop();}}
_onHeapStatsUpdate(event){const samples=event.data;if(samples){this._trackingOverviewGrid.setSamples(event.data);}}
searchableView(){return this._searchableView;}
showProfile(profile){return this._parentDataDisplayDelegate.showProfile(profile);}
showObject(snapshotObjectId,perspectiveName){if(snapshotObjectId<=this._profile.maxJSObjectId){this.selectLiveObject(perspectiveName,snapshotObjectId);}else{this._parentDataDisplayDelegate.showObject(snapshotObjectId,perspectiveName);}}
async linkifyObject(nodeIndex){const heapProfilerModel=this._profile.heapProfilerModel();if(!heapProfilerModel){return null;}
const location=await this._profile.getLocation(nodeIndex);if(!location){return null;}
const debuggerModel=heapProfilerModel.runtimeModel().debuggerModel();const rawLocation=debuggerModel.createRawLocationByScriptId(String(location.scriptId),location.lineNumber,location.columnNumber);if(!rawLocation){return null;}
const sourceURL=rawLocation.script()&&rawLocation.script().sourceURL;return sourceURL&&this._linkifier?this._linkifier.linkifyRawLocation(rawLocation,sourceURL):null;}
async _populate(){const heapSnapshotProxy=await this._profile._loadPromise;this._retrieveStatistics(heapSnapshotProxy);this._dataGrid.setDataSource(heapSnapshotProxy);if(this._profile.profileType().id===TrackingHeapSnapshotProfileType.TypeId&&this._profile.fromFile()){const samples=await heapSnapshotProxy.getSamples();if(samples){console.assert(samples.timestamps.length);const profileSamples=new Samples();profileSamples.sizes=samples.sizes;profileSamples.ids=samples.lastAssignedIds;profileSamples.timestamps=samples.timestamps;profileSamples.max=samples.sizes;profileSamples.totalTime=Math.max(samples.timestamps.peekLast(),10000);this._trackingOverviewGrid.setSamples(profileSamples);}}
const list=this._profiles();const profileIndex=list.indexOf(this._profile);this._baseSelect.setSelectedIndex(Math.max(0,profileIndex-1));if(this._trackingOverviewGrid){this._trackingOverviewGrid.updateGrid();}}
async _retrieveStatistics(heapSnapshotProxy){const statistics=await heapSnapshotProxy.getStatistics();this._statisticsView.setTotal(statistics.total);this._statisticsView.addRecord(statistics.code,UIString.UIString('Code'),'#f77');this._statisticsView.addRecord(statistics.strings,UIString.UIString('Strings'),'#5e5');this._statisticsView.addRecord(statistics.jsArrays,UIString.UIString('JS Arrays'),'#7af');this._statisticsView.addRecord(statistics.native,UIString.UIString('Typed Arrays'),'#fc5');this._statisticsView.addRecord(statistics.system,UIString.UIString('System Objects'),'#98f');return statistics;}
_onIdsRangeChanged(event){const minId=event.data.minId;const maxId=event.data.maxId;this._selectedSizeText.setText(UIString.UIString('Selected size: %s',Number.bytesToString(event.data.size)));if(this._constructorsDataGrid.snapshot){this._constructorsDataGrid.setSelectionRange(minId,maxId);}}
async toolbarItems(){const result=[this._perspectiveSelect,this._classNameFilter];if(this._profile.profileType()!==instance.trackingHeapSnapshotProfileType){result.push(this._baseSelect,this._filterSelect);}
result.push(this._selectedSizeText);return result;}
willHide(){this._currentSearchResultIndex=-1;this._popoverHelper.hidePopover();}
supportsCaseSensitiveSearch(){return true;}
supportsRegexSearch(){return false;}
searchCanceled(){this._currentSearchResultIndex=-1;this._searchResults=[];}
_selectRevealedNode(node){if(node){node.select();}}
performSearch(searchConfig,shouldJump,jumpBackwards){const nextQuery=new HeapSnapshotModel.SearchConfig(searchConfig.query.trim(),searchConfig.caseSensitive,searchConfig.isRegex,shouldJump,jumpBackwards||false);this._searchThrottler.schedule(this._performSearch.bind(this,nextQuery));}
async _performSearch(nextQuery){this.searchCanceled();if(!this._currentPerspective.supportsSearch()){return;}
this.currentQuery=nextQuery;const query=nextQuery.query.trim();if(!query){return;}
if(query.charAt(0)==='@'){const snapshotNodeId=parseInt(query.substring(1),10);if(isNaN(snapshotNodeId)){return;}
const node=await this._dataGrid.revealObjectByHeapSnapshotId(String(snapshotNodeId));this._selectRevealedNode(node);return;}
this._searchResults=await this._profile._snapshotProxy.search(this.currentQuery,this._dataGrid.nodeFilter());this._searchableView.updateSearchMatchesCount(this._searchResults.length);if(this._searchResults.length){this._currentSearchResultIndex=nextQuery.jumpBackwards?this._searchResults.length-1:0;}
await this._jumpToSearchResult(this._currentSearchResultIndex);}
jumpToNextSearchResult(){if(!this._searchResults.length){return;}
this._currentSearchResultIndex=(this._currentSearchResultIndex+1)%this._searchResults.length;this._searchThrottler.schedule(this._jumpToSearchResult.bind(this,this._currentSearchResultIndex));}
jumpToPreviousSearchResult(){if(!this._searchResults.length){return;}
this._currentSearchResultIndex=(this._currentSearchResultIndex+this._searchResults.length-1)%this._searchResults.length;this._searchThrottler.schedule(this._jumpToSearchResult.bind(this,this._currentSearchResultIndex));}
async _jumpToSearchResult(searchResultIndex){this._searchableView.updateCurrentMatchIndex(searchResultIndex);if(searchResultIndex===-1){return;}
const node=await this._dataGrid.revealObjectByHeapSnapshotId(String(this._searchResults[searchResultIndex]));this._selectRevealedNode(node);}
refreshVisibleData(){if(!this._dataGrid){return;}
let child=this._dataGrid.rootNode().children[0];while(child){child.refresh();child=child.traverseNextNode(false,null,true);}}
_changeBase(){if(this._baseProfile===this._profiles()[this._baseSelect.selectedIndex()]){return;}
this._baseProfile=this._profiles()[this._baseSelect.selectedIndex()];const dataGrid=(this._dataGrid);if(dataGrid.snapshot){this._baseProfile._loadPromise.then(dataGrid.setBaseDataSource.bind(dataGrid));}
if(!this.currentQuery||!this._searchResults){return;}
this.performSearch(this.currentQuery,false);}
_changeFilter(){const profileIndex=this._filterSelect.selectedIndex()-1;this._dataGrid.filterSelectIndexChanged(this._profiles(),profileIndex);if(!this.currentQuery||!this._searchResults){return;}
this.performSearch(this.currentQuery,false);}
_profiles(){return this._profile.profileType().getProfiles();}
_selectionChanged(event){const selectedNode=(event.data);this._setSelectedNodeForDetailsView(selectedNode);this._inspectedObjectChanged(event);}
_onSelectAllocationNode(event){const selectedNode=(event.data);this._constructorsDataGrid.setAllocationNodeId(selectedNode.allocationNodeId());this._setSelectedNodeForDetailsView(null);}
_inspectedObjectChanged(event){const selectedNode=(event.data);const heapProfilerModel=this._profile.heapProfilerModel();if(heapProfilerModel&&selectedNode instanceof HeapSnapshotGenericObjectNode){heapProfilerModel.addInspectedHeapObject(String(selectedNode.snapshotNodeId));}}
_setSelectedNodeForDetailsView(nodeItem){const dataSource=nodeItem&&nodeItem.retainersDataSource();if(dataSource){this._retainmentDataGrid.setDataSource(dataSource.snapshot,dataSource.snapshotNodeIndex);if(this._allocationStackView){this._allocationStackView.setAllocatedObject(dataSource.snapshot,dataSource.snapshotNodeIndex);}}else{if(this._allocationStackView){this._allocationStackView.clear();}
this._retainmentDataGrid.reset();}}
_changePerspectiveAndWait(perspectiveTitle){const perspectiveIndex=this._perspectives.findIndex(perspective=>perspective.title()===perspectiveTitle);if(perspectiveIndex===-1||this._currentPerspectiveIndex===perspectiveIndex){return Promise.resolve();}
const promise=this._perspectives[perspectiveIndex].masterGrid(this).once(HeapSnapshotSortableDataGrid.Events.ContentShown);const option=this._perspectiveSelect.options().find(option=>option.value===String(perspectiveIndex));this._perspectiveSelect.select((option));this._changePerspective(perspectiveIndex);return promise;}
async _updateDataSourceAndView(){const dataGrid=this._dataGrid;if(!dataGrid||dataGrid.snapshot){return;}
const snapshotProxy=await this._profile._loadPromise;if(this._dataGrid!==dataGrid){return;}
if(dataGrid.snapshot!==snapshotProxy){dataGrid.setDataSource(snapshotProxy);}
if(dataGrid!==this._diffDataGrid){return;}
if(!this._baseProfile){this._baseProfile=this._profiles()[this._baseSelect.selectedIndex()];}
const baseSnapshotProxy=await this._baseProfile._loadPromise;if(this._diffDataGrid.baseSnapshot!==baseSnapshotProxy){this._diffDataGrid.setBaseDataSource(baseSnapshotProxy);}}
_onSelectedPerspectiveChanged(event){this._changePerspective(event.target.selectedOptions[0].value);}
_changePerspective(selectedIndex){if(selectedIndex===this._currentPerspectiveIndex){return;}
this._currentPerspectiveIndex=selectedIndex;this._currentPerspective.deactivate(this);const perspective=this._perspectives[selectedIndex];this._currentPerspective=perspective;this._dataGrid=perspective.masterGrid(this);perspective.activate(this);this.refreshVisibleData();if(this._dataGrid){this._dataGrid.updateWidths();}
this._updateDataSourceAndView();if(!this.currentQuery||!this._searchResults){return;}
this.performSearch(this.currentQuery,false);}
async selectLiveObject(perspectiveName,snapshotObjectId){await this._changePerspectiveAndWait(perspectiveName);const node=await this._dataGrid.revealObjectByHeapSnapshotId(snapshotObjectId);if(node){node.select();}else{Console.Console.instance().error('Cannot find corresponding heap snapshot node');}}
_getPopoverRequest(event){const span=event.target.enclosingNodeOrSelfWithNodeName('span');const row=event.target.enclosingNodeOrSelfWithNodeName('tr');const heapProfilerModel=this._profile.heapProfilerModel();if(!row||!span||!heapProfilerModel){return null;}
const node=row._dataGridNode;let objectPopoverHelper;return{box:span.boxInWindow(),show:async popover=>{const remoteObject=await node.queryObjectContent(heapProfilerModel,'popover');if(!remoteObject){return false;}
objectPopoverHelper=await ObjectPopoverHelper.ObjectPopoverHelper.buildObjectPopover(remoteObject,popover);if(!objectPopoverHelper){heapProfilerModel.runtimeModel().releaseObjectGroup('popover');return false;}
return true;},hide:()=>{heapProfilerModel.runtimeModel().releaseObjectGroup('popover');objectPopoverHelper.dispose();}};}
_updatePerspectiveOptions(){const multipleSnapshots=this._profiles().length>1;this._perspectiveSelect.removeOptions();this._perspectives.forEach((perspective,index)=>{if(multipleSnapshots||perspective!==this._comparisonPerspective){this._perspectiveSelect.createOption(perspective.title(),String(index));}});}
_updateBaseOptions(){const list=this._profiles();const selectedIndex=this._baseSelect.selectedIndex();this._baseSelect.removeOptions();for(const item of list){this._baseSelect.createOption(item.title);}
if(selectedIndex>-1){this._baseSelect.setSelectedIndex(selectedIndex);}}
_updateFilterOptions(){const list=this._profiles();const selectedIndex=this._filterSelect.selectedIndex();this._filterSelect.removeOptions();this._filterSelect.createOption(UIString.UIString('All objects'));for(let i=0;i<list.length;++i){let title;if(!i){title=UIString.UIString('Objects allocated before %s',list[i].title);}else{title=UIString.UIString('Objects allocated between %s and %s',list[i-1].title,list[i].title);}
this._filterSelect.createOption(title);}
if(selectedIndex>-1){this._filterSelect.setSelectedIndex(selectedIndex);}}
_updateControls(){this._updatePerspectiveOptions();this._updateBaseOptions();this._updateFilterOptions();}
_onReceiveSnapshot(event){this._updateControls();const profile=event.data;profile.addEventListener(Events.ProfileTitleChanged,this._updateControls,this);}
_onProfileHeaderRemoved(event){const profile=event.data;profile.removeEventListener(Events.ProfileTitleChanged,this._updateControls,this);if(this._profile===profile){this.detach();this._profile.profileType().removeEventListener(HeapSnapshotProfileType.SnapshotReceived,this._onReceiveSnapshot,this);this._profile.profileType().removeEventListener(ProfileEvents.RemoveProfileHeader,this._onProfileHeaderRemoved,this);this.dispose();}else{this._updateControls();}}
dispose(){this._linkifier.dispose();this._popoverHelper.dispose();if(this._allocationStackView){this._allocationStackView.clear();this._allocationDataGrid.dispose();}
this._onStopTracking();if(this._trackingOverviewGrid){this._trackingOverviewGrid.removeEventListener(IdsRangeChanged,this._onIdsRangeChanged.bind(this));}}}
class Perspective{constructor(title){this._title=title;}
activate(heapSnapshotView){}
deactivate(heapSnapshotView){heapSnapshotView._baseSelect.setVisible(false);heapSnapshotView._filterSelect.setVisible(false);heapSnapshotView._classNameFilter.setVisible(false);if(heapSnapshotView._trackingOverviewGrid){heapSnapshotView._trackingOverviewGrid.detach();}
if(heapSnapshotView._allocationWidget){heapSnapshotView._allocationWidget.detach();}
if(heapSnapshotView._statisticsView){heapSnapshotView._statisticsView.detach();}
heapSnapshotView._splitWidget.detach();heapSnapshotView._splitWidget.detachChildWidgets();}
masterGrid(heapSnapshotView){return null;}
title(){return this._title;}
supportsSearch(){return false;}}
class SummaryPerspective extends Perspective{constructor(){super(UIString.UIString('Summary'));}
activate(heapSnapshotView){heapSnapshotView._splitWidget.setMainWidget(heapSnapshotView._constructorsWidget);heapSnapshotView._splitWidget.setSidebarWidget(heapSnapshotView._objectDetailsView);heapSnapshotView._splitWidget.show(heapSnapshotView._searchableView.element);heapSnapshotView._filterSelect.setVisible(true);heapSnapshotView._classNameFilter.setVisible(true);if(!heapSnapshotView._trackingOverviewGrid){return;}
heapSnapshotView._trackingOverviewGrid.show(heapSnapshotView._searchableView.element,heapSnapshotView._splitWidget.element);heapSnapshotView._trackingOverviewGrid.update();heapSnapshotView._trackingOverviewGrid.updateGrid();}
masterGrid(heapSnapshotView){return heapSnapshotView._constructorsDataGrid;}
supportsSearch(){return true;}}
class ComparisonPerspective extends Perspective{constructor(){super(UIString.UIString('Comparison'));}
activate(heapSnapshotView){heapSnapshotView._splitWidget.setMainWidget(heapSnapshotView._diffWidget);heapSnapshotView._splitWidget.setSidebarWidget(heapSnapshotView._objectDetailsView);heapSnapshotView._splitWidget.show(heapSnapshotView._searchableView.element);heapSnapshotView._baseSelect.setVisible(true);heapSnapshotView._classNameFilter.setVisible(true);}
masterGrid(heapSnapshotView){return heapSnapshotView._diffDataGrid;}
supportsSearch(){return true;}}
class ContainmentPerspective extends Perspective{constructor(){super(UIString.UIString('Containment'));}
activate(heapSnapshotView){heapSnapshotView._splitWidget.setMainWidget(heapSnapshotView._containmentWidget);heapSnapshotView._splitWidget.setSidebarWidget(heapSnapshotView._objectDetailsView);heapSnapshotView._splitWidget.show(heapSnapshotView._searchableView.element);}
masterGrid(heapSnapshotView){return heapSnapshotView._containmentDataGrid;}}
class AllocationPerspective extends Perspective{constructor(){super(UIString.UIString('Allocation'));this._allocationSplitWidget=new SplitWidget.SplitWidget(false,true,'heapSnapshotAllocationSplitViewState',200,200);this._allocationSplitWidget.setSidebarWidget(new Widget.VBox());}
activate(heapSnapshotView){this._allocationSplitWidget.setMainWidget(heapSnapshotView._allocationWidget);heapSnapshotView._splitWidget.setMainWidget(heapSnapshotView._constructorsWidget);heapSnapshotView._splitWidget.setSidebarWidget(heapSnapshotView._objectDetailsView);const allocatedObjectsView=new Widget.VBox();const resizer=createElementWithClass('div','heap-snapshot-view-resizer');const title=resizer.createChild('div','title').createChild('span');title.textContent=UIString.UIString('Live objects');this._allocationSplitWidget.hideDefaultResizer();this._allocationSplitWidget.installResizer(resizer);allocatedObjectsView.element.appendChild(resizer);heapSnapshotView._splitWidget.show(allocatedObjectsView.element);this._allocationSplitWidget.setSidebarWidget(allocatedObjectsView);this._allocationSplitWidget.show(heapSnapshotView._searchableView.element);heapSnapshotView._constructorsDataGrid.clear();const selectedNode=heapSnapshotView._allocationDataGrid.selectedNode;if(selectedNode){heapSnapshotView._constructorsDataGrid.setAllocationNodeId(selectedNode.allocationNodeId());}}
deactivate(heapSnapshotView){this._allocationSplitWidget.detach();super.deactivate(heapSnapshotView);}
masterGrid(heapSnapshotView){return heapSnapshotView._allocationDataGrid;}}
class StatisticsPerspective extends Perspective{constructor(){super(UIString.UIString('Statistics'));}
activate(heapSnapshotView){heapSnapshotView._statisticsView.show(heapSnapshotView._searchableView.element);}
masterGrid(heapSnapshotView){return null;}}
class HeapSnapshotProfileType extends ProfileType{constructor(id,title){super(id||HeapSnapshotProfileType.TypeId,title||ls`Heap snapshot`);SDKModel.TargetManager.instance().observeModels(HeapProfilerModel.HeapProfilerModel,this);SDKModel.TargetManager.instance().addModelListener(HeapProfilerModel.HeapProfilerModel,HeapProfilerModel.Events.ResetProfiles,this._resetProfiles,this);SDKModel.TargetManager.instance().addModelListener(HeapProfilerModel.HeapProfilerModel,HeapProfilerModel.Events.AddHeapSnapshotChunk,this._addHeapSnapshotChunk,this);SDKModel.TargetManager.instance().addModelListener(HeapProfilerModel.HeapProfilerModel,HeapProfilerModel.Events.ReportHeapSnapshotProgress,this._reportHeapSnapshotProgress,this);this._treatGlobalObjectsAsRoots=Settings.Settings.instance().createSetting('treatGlobalObjectsAsRoots',true);this._customContent=null;}
modelAdded(heapProfilerModel){heapProfilerModel.enable();}
modelRemoved(heapProfilerModel){}
getProfiles(){return(super.getProfiles());}
fileExtension(){return'.heapsnapshot';}
get buttonTooltip(){return UIString.UIString('Take heap snapshot');}
isInstantProfile(){return true;}
buttonClicked(){this._takeHeapSnapshot();userMetrics.actionTaken(UserMetrics.Action.ProfilesHeapProfileTaken);return false;}
get treeItemTitle(){return UIString.UIString('HEAP SNAPSHOTS');}
get description(){return UIString.UIString('Heap snapshot profiles show memory distribution among your page\'s JavaScript objects and related DOM nodes.');}
customContent(){const checkboxSetting=SettingsUI.createSettingCheckbox(ls`Treat global objects as roots (recommended, unchecking this exposes internal nodes and introduces excessive detail, but might help debugging cycles in retaining paths)`,this._treatGlobalObjectsAsRoots,true);this._customContent=(checkboxSetting);const showOptionToNotTreatGlobalObjectsAsRoots=Root.Runtime.experiments.isEnabled('showOptionToNotTreatGlobalObjectsAsRoots');return showOptionToNotTreatGlobalObjectsAsRoots?checkboxSetting:null;}
setCustomContentEnabled(enable){this._customContent.checkboxElement.disabled=!enable;}
createProfileLoadedFromFile(title){return new HeapProfileHeader(null,this,title);}
async _takeHeapSnapshot(){if(this.profileBeingRecorded()){return;}
const heapProfilerModel=self.UI.context.flavor(HeapProfilerModel.HeapProfilerModel);if(!heapProfilerModel){return;}
let profile=new HeapProfileHeader(heapProfilerModel,this);this.setProfileBeingRecorded(profile);this.addProfile(profile);profile.updateStatus(UIString.UIString('Snapshotting…'));await heapProfilerModel.takeHeapSnapshot(true,this._treatGlobalObjectsAsRoots.get());profile=this.profileBeingRecorded();profile.title=UIString.UIString('Snapshot %d',profile.uid);profile._finishLoad();this.setProfileBeingRecorded(null);this.dispatchEventToListeners(ProfileEvents.ProfileComplete,profile);}
_addHeapSnapshotChunk(event){if(!this.profileBeingRecorded()){return;}
const chunk=(event.data);this.profileBeingRecorded().transferChunk(chunk);}
_reportHeapSnapshotProgress(event){const profile=this.profileBeingRecorded();if(!profile){return;}
const data=(event.data);profile.updateStatus(UIString.UIString('%.0f%%',(data.done/data.total)*100),true);if(data.finished){profile._prepareToLoad();}}
_resetProfiles(event){const heapProfilerModel=(event.data);for(const profile of this.getProfiles()){if(profile.heapProfilerModel()===heapProfilerModel){this.removeProfile(profile);}}}
_snapshotReceived(profile){if(this.profileBeingRecorded()===profile){this.setProfileBeingRecorded(null);}
this.dispatchEventToListeners(HeapSnapshotProfileType.SnapshotReceived,profile);}}
HeapSnapshotProfileType.TypeId='HEAP';HeapSnapshotProfileType.SnapshotReceived='SnapshotReceived';class TrackingHeapSnapshotProfileType extends HeapSnapshotProfileType{constructor(){super(TrackingHeapSnapshotProfileType.TypeId,ls`Allocation instrumentation on timeline`);this._recordAllocationStacksSetting=Settings.Settings.instance().createSetting('recordAllocationStacks',false);this._customContent=null;}
modelAdded(heapProfilerModel){super.modelAdded(heapProfilerModel);heapProfilerModel.addEventListener(HeapProfilerModel.Events.HeapStatsUpdate,this._heapStatsUpdate,this);heapProfilerModel.addEventListener(HeapProfilerModel.Events.LastSeenObjectId,this._lastSeenObjectId,this);}
modelRemoved(heapProfilerModel){super.modelRemoved(heapProfilerModel);heapProfilerModel.removeEventListener(HeapProfilerModel.Events.HeapStatsUpdate,this._heapStatsUpdate,this);heapProfilerModel.removeEventListener(HeapProfilerModel.Events.LastSeenObjectId,this._lastSeenObjectId,this);}
_heapStatsUpdate(event){if(!this._profileSamples){return;}
const samples=(event.data);let index;for(let i=0;i<samples.length;i+=3){index=samples[i];const size=samples[i+2];this._profileSamples.sizes[index]=size;if(!this._profileSamples.max[index]){this._profileSamples.max[index]=size;}}}
_lastSeenObjectId(event){const profileSamples=this._profileSamples;if(!profileSamples){return;}
const data=(event.data);const currentIndex=Math.max(profileSamples.ids.length,profileSamples.max.length-1);profileSamples.ids[currentIndex]=data.lastSeenObjectId;if(!profileSamples.max[currentIndex]){profileSamples.max[currentIndex]=0;profileSamples.sizes[currentIndex]=0;}
profileSamples.timestamps[currentIndex]=data.timestamp;if(profileSamples.totalTime<data.timestamp-profileSamples.timestamps[0]){profileSamples.totalTime*=2;}
this.dispatchEventToListeners(TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._profileSamples);this.profileBeingRecorded().updateStatus(null,true);}
hasTemporaryView(){return true;}
get buttonTooltip(){return this._recording?ls`Stop recording heap profile`:ls`Start recording heap profile`;}
isInstantProfile(){return false;}
buttonClicked(){return this._toggleRecording();}
_startRecordingProfile(){if(this.profileBeingRecorded()){return;}
const heapProfilerModel=this._addNewProfile();if(!heapProfilerModel){return;}
heapProfilerModel.startTrackingHeapObjects(this._recordAllocationStacksSetting.get());}
customContent(){const checkboxSetting=SettingsUI.createSettingCheckbox(ls`Record allocation stacks (extra performance overhead)`,this._recordAllocationStacksSetting,true);this._customContent=(checkboxSetting);return checkboxSetting;}
setCustomContentEnabled(enable){this._customContent.checkboxElement.disabled=!enable;}
_addNewProfile(){const heapProfilerModel=self.UI.context.flavor(HeapProfilerModel.HeapProfilerModel);if(!heapProfilerModel){return null;}
this.setProfileBeingRecorded(new HeapProfileHeader(heapProfilerModel,this,undefined));this._profileSamples=new Samples();this.profileBeingRecorded()._profileSamples=this._profileSamples;this._recording=true;this.addProfile((this.profileBeingRecorded()));this.profileBeingRecorded().updateStatus(UIString.UIString('Recording…'));this.dispatchEventToListeners(TrackingHeapSnapshotProfileType.TrackingStarted);return heapProfilerModel;}
async _stopRecordingProfile(){this.profileBeingRecorded().updateStatus(UIString.UIString('Snapshotting…'));const stopPromise=this.profileBeingRecorded().heapProfilerModel().stopTrackingHeapObjects(true);this._recording=false;this.dispatchEventToListeners(TrackingHeapSnapshotProfileType.TrackingStopped);await stopPromise;const profile=this.profileBeingRecorded();if(!profile){return;}
profile._finishLoad();this._profileSamples=null;this.setProfileBeingRecorded(null);this.dispatchEventToListeners(ProfileEvents.ProfileComplete,profile);}
_toggleRecording(){if(this._recording){this._stopRecordingProfile();}else{this._startRecordingProfile();}
return this._recording;}
fileExtension(){return'.heaptimeline';}
get treeItemTitle(){return ls`ALLOCATION TIMELINES`;}
get description(){return ls`
        Allocation timelines show instrumented JavaScript memory allocations over time.
        Once profile is recorded you can select a time interval to see objects that
        were allocated within it and still alive by the end of recording.
        Use this profile type to isolate memory leaks.`;}
_resetProfiles(event){const wasRecording=this._recording;this.setProfileBeingRecorded(null);super._resetProfiles(event);this._profileSamples=null;if(wasRecording){this._addNewProfile();}}
profileBeingRecordedRemoved(){this._stopRecordingProfile();this._profileSamples=null;}}
TrackingHeapSnapshotProfileType.TypeId='HEAP-RECORD';TrackingHeapSnapshotProfileType.HeapStatsUpdate='HeapStatsUpdate';TrackingHeapSnapshotProfileType.TrackingStarted='TrackingStarted';TrackingHeapSnapshotProfileType.TrackingStopped='TrackingStopped';class HeapProfileHeader extends ProfileHeader{constructor(heapProfilerModel,type,title){super(type,title||UIString.UIString('Snapshot %d',type.nextProfileUid()));this._heapProfilerModel=heapProfilerModel;this.maxJSObjectId=-1;this._workerProxy=null;this._receiver=null;this._snapshotProxy=null;this._loadPromise=new Promise(resolve=>this._fulfillLoad=resolve);this._totalNumberOfChunks=0;this._bufferedWriter=null;this._tempFile=null;}
heapProfilerModel(){return this._heapProfilerModel;}
getLocation(nodeIndex){return this._snapshotProxy.getLocation(nodeIndex);}
createSidebarTreeElement(dataDisplayDelegate){return new ProfileSidebarTreeElement(dataDisplayDelegate,this,'heap-snapshot-sidebar-tree-item');}
createView(dataDisplayDelegate){return new HeapSnapshotView(dataDisplayDelegate,this);}
_prepareToLoad(){console.assert(!this._receiver,'Already loading');this._setupWorker();this.updateStatus(UIString.UIString('Loading…'),true);}
_finishLoad(){if(!this._wasDisposed){this._receiver.close();}
if(!this._bufferedWriter){return;}
this._didWriteToTempFile(this._bufferedWriter);}
_didWriteToTempFile(tempFile){if(this._wasDisposed){if(tempFile){tempFile.remove();}
return;}
this._tempFile=tempFile;if(!tempFile){this._failedToCreateTempFile=true;}
if(this._onTempFileReady){this._onTempFileReady();this._onTempFileReady=null;}}
_setupWorker(){function setProfileWait(event){this.updateStatus(null,event.data);}
console.assert(!this._workerProxy,'HeapSnapshotWorkerProxy already exists');this._workerProxy=new HeapSnapshotWorkerProxy(this._handleWorkerEvent.bind(this));this._workerProxy.addEventListener(HeapSnapshotWorkerProxy.Events.Wait,setProfileWait,this);this._receiver=this._workerProxy.createLoader(this.uid,this._snapshotReceived.bind(this));}
_handleWorkerEvent(eventName,data){if(HeapSnapshotModel.HeapSnapshotProgressEvent.BrokenSnapshot===eventName){const error=(data);Console.Console.instance().error(error);return;}
if(HeapSnapshotModel.HeapSnapshotProgressEvent.Update!==eventName){return;}
const serializedMessage=(data);const messageObject=UIString.deserializeUIString(serializedMessage);this.updateStatus(ls(messageObject.messageParts,messageObject.values));}
dispose(){if(this._workerProxy){this._workerProxy.dispose();}
this.removeTempFile();this._wasDisposed=true;}
_didCompleteSnapshotTransfer(){if(!this._snapshotProxy){return;}
this.updateStatus(Number.bytesToString(this._snapshotProxy.totalSize),false);}
transferChunk(chunk){if(!this._bufferedWriter){this._bufferedWriter=new TempFile.TempFile();}
this._bufferedWriter.write([chunk]);++this._totalNumberOfChunks;this._receiver.write(chunk);}
_snapshotReceived(snapshotProxy){if(this._wasDisposed){return;}
this._receiver=null;this._snapshotProxy=snapshotProxy;this.maxJSObjectId=snapshotProxy.maxJSObjectId();this._didCompleteSnapshotTransfer();this._workerProxy.startCheckingForLongRunningCalls();this.notifySnapshotReceived();}
notifySnapshotReceived(){this._fulfillLoad(this._snapshotProxy);this.profileType()._snapshotReceived(this);if(this.canSaveToFile()){this.dispatchEventToListeners(Events.ProfileReceived);}}
canSaveToFile(){return!this.fromFile()&&!!this._snapshotProxy;}
saveToFile(){const fileOutputStream=new FileUtils.FileOutputStream();this._fileName=this._fileName||'Heap-'+new Date().toISO8601Compact()+this.profileType().fileExtension();fileOutputStream.open(this._fileName).then(onOpen.bind(this));async function onOpen(accepted){if(!accepted){return;}
if(this._failedToCreateTempFile){Console.Console.instance().error('Failed to open temp file with heap snapshot');fileOutputStream.close();return;}
if(this._tempFile){const error=await this._tempFile.copyToOutputStream(fileOutputStream,this._onChunkTransferred.bind(this));if(error){Console.Console.instance().error('Failed to read heap snapshot from temp file: '+error.message);}
this._didCompleteSnapshotTransfer();return;}
this._onTempFileReady=onOpen.bind(this,accepted);this._updateSaveProgress(0,1);}}
_onChunkTransferred(reader){this._updateSaveProgress(reader.loadedSize(),reader.fileSize());}
_updateSaveProgress(value,total){const percentValue=((total&&value/total)*100).toFixed(0);this.updateStatus(UIString.UIString('Saving… %d%%',percentValue));}
async loadFromFile(file){this.updateStatus(UIString.UIString('Loading…'),true);this._setupWorker();const reader=new FileUtils.ChunkedFileReader(file,10000000);const success=await reader.read((this._receiver));if(!success){this.updateStatus(reader.error().message);}
return success?null:reader.error();}}
class HeapSnapshotStatisticsView extends Widget.VBox{constructor(){super();this.element.classList.add('heap-snapshot-statistics-view');this._pieChart=new PieChart.PieChart({chartName:ls`Heap memory usage`,size:150,formatter:HeapSnapshotStatisticsView._valueFormatter,showLegend:true});this._pieChart.element.classList.add('heap-snapshot-stats-pie-chart');this.element.appendChild(this._pieChart.element);}
static _valueFormatter(value){return UIString.UIString('%s KB',Number.withThousandsSeparator(Math.round(value/1024)));}
setTotal(value){this._pieChart.initializeWithTotal(value);}
addRecord(value,name,color){this._pieChart.addSlice(value,color,name);}}
class HeapAllocationStackView extends Widget.Widget{constructor(heapProfilerModel){super();this._heapProfilerModel=heapProfilerModel;this._linkifier=new Linkifier.Linkifier();this._frameElements=[];}
_onContextMenu(link,event){const contextMenu=new ContextMenu.ContextMenu(event);if(!contextMenu.containsTarget(link)){contextMenu.appendApplicableItems(link);}
contextMenu.show();event.consume(true);}
_onStackViewKeydown(event){const target=(event.target);if(!target){return;}
if(isEnterKey(event)){const link=target._linkElement;if(!link){return;}
if(Linkifier.Linkifier.invokeFirstAction(link)){event.consume(true);}
return;}
let navDown;if(event.key==='ArrowUp'){navDown=false;}else if(event.key==='ArrowDown'){navDown=true;}else{return;}
const index=this._frameElements.indexOf(target);if(index===-1){return;}
const nextIndex=navDown?index+1:index-1;if(nextIndex<0||nextIndex>=this._frameElements.length){return;}
const nextFrame=this._frameElements[nextIndex];nextFrame.tabIndex=0;target.tabIndex=-1;nextFrame.focus();event.consume(true);}
async setAllocatedObject(snapshot,snapshotNodeIndex){this.clear();const frames=await snapshot.allocationStack(snapshotNodeIndex);if(!frames){const stackDiv=this.element.createChild('div','no-heap-allocation-stack');stackDiv.createTextChild(UIString.UIString('Stack was not recorded for this object because it had been allocated before this profile recording started.'));return;}
const stackDiv=this.element.createChild('div','heap-allocation-stack');stackDiv.addEventListener('keydown',this._onStackViewKeydown.bind(this),false);for(const frame of frames){const frameDiv=stackDiv.createChild('div','stack-frame');this._frameElements.push(frameDiv);frameDiv.tabIndex=-1;const name=frameDiv.createChild('div');name.textContent=UIUtils.beautifyFunctionName(frame.functionName);if(!frame.scriptId){continue;}
const target=this._heapProfilerModel?this._heapProfilerModel.target():null;const options={columnNumber:frame.column-1};const urlElement=this._linkifier.linkifyScriptLocation(target,String(frame.scriptId),frame.scriptName,frame.line-1,options);frameDiv.appendChild(urlElement);frameDiv._linkElement=urlElement;frameDiv.addEventListener('contextmenu',this._onContextMenu.bind(this,urlElement));}
this._frameElements[0].tabIndex=0;}
clear(){this.element.removeChildren();this._frameElements=[];this._linkifier.reset();}}
var HeapSnapshotView$1=Object.freeze({__proto__:null,HeapSnapshotView:HeapSnapshotView,Perspective:Perspective,SummaryPerspective:SummaryPerspective,ComparisonPerspective:ComparisonPerspective,ContainmentPerspective:ContainmentPerspective,AllocationPerspective:AllocationPerspective,StatisticsPerspective:StatisticsPerspective,HeapSnapshotProfileType:HeapSnapshotProfileType,TrackingHeapSnapshotProfileType:TrackingHeapSnapshotProfileType,HeapProfileHeader:HeapProfileHeader,HeapSnapshotStatisticsView:HeapSnapshotStatisticsView,HeapAllocationStackView:HeapAllocationStackView});class ProfileTypeRegistry{constructor(){this.cpuProfileType=new CPUProfileType();this.heapSnapshotProfileType=new HeapSnapshotProfileType();this.samplingHeapProfileType=new SamplingHeapProfileType();this.samplingNativeHeapProfileType=new SamplingNativeHeapProfileType();this.samplingNativeHeapSnapshotBrowserType=new SamplingNativeHeapSnapshotBrowserType();this.samplingNativeHeapSnapshotRendererType=new SamplingNativeHeapSnapshotRendererType();this.trackingHeapSnapshotProfileType=new TrackingHeapSnapshotProfileType();}}
const instance=new ProfileTypeRegistry();var ProfileTypeRegistry$1=Object.freeze({__proto__:null,ProfileTypeRegistry:ProfileTypeRegistry,instance:instance});class ProfilesPanel extends Panel.PanelWithSidebar{constructor(name,profileTypes,recordingActionId){super(name);this._profileTypes=profileTypes;this.registerRequiredCSS('profiler/heapProfiler.css');this.registerRequiredCSS('profiler/profilesPanel.css');this.registerRequiredCSS('object_ui/objectValue.css');const mainContainer=new Widget.VBox();this.splitWidget().setMainWidget(mainContainer);this.profilesItemTreeElement=new ProfilesSidebarTreeElement(this);this._sidebarTree=new TreeOutline.TreeOutlineInShadow();this._sidebarTree.registerRequiredCSS('profiler/profilesSidebarTree.css');this._sidebarTree.element.classList.add('profiles-sidebar-tree-box');this.panelSidebarElement().appendChild(this._sidebarTree.element);this._sidebarTree.appendChild(this.profilesItemTreeElement);this._sidebarTree.element.addEventListener('keydown',this._onKeyDown.bind(this),false);this.profileViews=createElement('div');this.profileViews.id='profile-views';this.profileViews.classList.add('vbox');mainContainer.element.appendChild(this.profileViews);this._toolbarElement=createElementWithClass('div','profiles-toolbar');mainContainer.element.insertBefore(this._toolbarElement,mainContainer.element.firstChild);this.panelSidebarElement().classList.add('profiles-tree-sidebar');const toolbarContainerLeft=createElementWithClass('div','profiles-toolbar');this.panelSidebarElement().insertBefore(toolbarContainerLeft,this.panelSidebarElement().firstChild);const toolbar=new Toolbar.Toolbar('',toolbarContainerLeft);this._toggleRecordAction=(self.UI.actionRegistry.action(recordingActionId));this._toggleRecordButton=Toolbar.Toolbar.createActionButton(this._toggleRecordAction);toolbar.appendToolbarItem(this._toggleRecordButton);this.clearResultsButton=new Toolbar.ToolbarButton(UIString.UIString('Clear all profiles'),'largeicon-clear');this.clearResultsButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._reset,this);toolbar.appendToolbarItem(this.clearResultsButton);toolbar.appendSeparator();toolbar.appendToolbarItem(Toolbar.Toolbar.createActionButtonForId('components.collect-garbage'));this._profileViewToolbar=new Toolbar.Toolbar('',this._toolbarElement);this._profileGroups={};this._launcherView=new ProfileLauncherView(this);this._launcherView.addEventListener(Events$1.ProfileTypeSelected,this._onProfileTypeSelected,this);this._profileToView=[];this._typeIdToSidebarSection={};const types=this._profileTypes;for(let i=0;i<types.length;i++){this._registerProfileType(types[i]);}
this._launcherView.restoreSelectedProfileType();this.profilesItemTreeElement.select();this._showLauncherView();this._createFileSelectorElement();this.element.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this),false);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.SuspendStateChanged,this._onSuspendStateChanged,this);self.UI.context.addFlavorChangeListener(CPUProfilerModel.CPUProfilerModel,this._updateProfileTypeSpecificUI,this);self.UI.context.addFlavorChangeListener(HeapProfilerModel.HeapProfilerModel,this._updateProfileTypeSpecificUI,this);}
_onKeyDown(event){let handled=false;if(event.key==='ArrowDown'&&!event.altKey){handled=this._sidebarTree.selectNext();}else if(event.key==='ArrowUp'&&!event.altKey){handled=this._sidebarTree.selectPrevious();}
if(handled){event.consume(true);}}
searchableView(){return this.visibleView&&this.visibleView.searchableView?this.visibleView.searchableView():null;}
_createFileSelectorElement(){if(this._fileSelectorElement){this.element.removeChild(this._fileSelectorElement);}
this._fileSelectorElement=UIUtils.createFileSelectorElement(this._loadFromFile.bind(this));ProfilesPanel._fileSelectorElement=this._fileSelectorElement;this.element.appendChild(this._fileSelectorElement);}
_findProfileTypeByExtension(fileName){return this._profileTypes.find(type=>!!type.fileExtension()&&fileName.endsWith(type.fileExtension()||''))||null;}
async _loadFromFile(file){this._createFileSelectorElement();const profileType=this._findProfileTypeByExtension(file.name);if(!profileType){const extensions=new Set(this._profileTypes.map(type=>type.fileExtension()).filter(ext=>ext));Console.Console.instance().error(UIString.UIString('Can’t load file. Supported file extensions: `%s`.',Array.from(extensions).join("', '")));return;}
if(!!profileType.profileBeingRecorded()){Console.Console.instance().error(UIString.UIString('Can’t load profile while another profile is being recorded.'));return;}
const error=await profileType.loadFromFile(file);if(error){UIUtils.MessageDialog.show(UIString.UIString('Profile loading failed: %s.',error.message));}}
toggleRecord(){if(!this._toggleRecordAction.enabled()){return true;}
const toggleButton=this.element.ownerDocument.deepActiveElement();const type=this._selectedProfileType;const isProfiling=type.buttonClicked();this._updateToggleRecordAction(isProfiling);if(isProfiling){this._launcherView.profileStarted();if(type.hasTemporaryView()){this.showProfile(type.profileBeingRecorded());}}else{this._launcherView.profileFinished();}
if(toggleButton){toggleButton.focus();}
return true;}
_onSuspendStateChanged(){this._updateToggleRecordAction(this._toggleRecordAction.toggled());}
_updateToggleRecordAction(toggled){const hasSelectedTarget=!!(self.UI.context.flavor(CPUProfilerModel.CPUProfilerModel)||self.UI.context.flavor(HeapProfilerModel.HeapProfilerModel));const enable=toggled||(!SDKModel.TargetManager.instance().allTargetsSuspended()&&hasSelectedTarget);this._toggleRecordAction.setEnabled(enable);this._toggleRecordAction.setToggled(toggled);if(enable){this._toggleRecordButton.setTitle(this._selectedProfileType?this._selectedProfileType.buttonTooltip:'');}else{this._toggleRecordButton.setTitle(UIUtils.anotherProfilerActiveLabel());}
if(this._selectedProfileType){this._launcherView.updateProfileType(this._selectedProfileType,enable);}}
_profileBeingRecordedRemoved(){this._updateToggleRecordAction(false);this._launcherView.profileFinished();}
_onProfileTypeSelected(event){this._selectedProfileType=(event.data);this._updateProfileTypeSpecificUI();}
_updateProfileTypeSpecificUI(){this._updateToggleRecordAction(this._toggleRecordAction.toggled());}
_reset(){this._profileTypes.forEach(type=>type.reset());delete this.visibleView;this._profileGroups={};this._updateToggleRecordAction(false);this._launcherView.profileFinished();this._sidebarTree.element.classList.remove('some-expandable');this._launcherView.detach();this.profileViews.removeChildren();this._profileViewToolbar.removeToolbarItems();this.clearResultsButton.element.classList.remove('hidden');this.profilesItemTreeElement.select();this._showLauncherView();}
_showLauncherView(){this.closeVisibleView();this._profileViewToolbar.removeToolbarItems();this._launcherView.show(this.profileViews);this.visibleView=this._launcherView;this._toolbarElement.classList.add('hidden');}
_registerProfileType(profileType){this._launcherView.addProfileType(profileType);const profileTypeSection=new ProfileTypeSidebarSection(this,profileType);this._typeIdToSidebarSection[profileType.id]=profileTypeSection;this._sidebarTree.appendChild(profileTypeSection);profileTypeSection.childrenListElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this),false);function onAddProfileHeader(event){this._addProfileHeader((event.data));}
function onRemoveProfileHeader(event){this._removeProfileHeader((event.data));}
function profileComplete(event){this.showProfile((event.data));}
profileType.addEventListener(ProfileEvents.ViewUpdated,this._updateProfileTypeSpecificUI,this);profileType.addEventListener(ProfileEvents.AddProfileHeader,onAddProfileHeader,this);profileType.addEventListener(ProfileEvents.RemoveProfileHeader,onRemoveProfileHeader,this);profileType.addEventListener(ProfileEvents.ProfileComplete,profileComplete,this);const profiles=profileType.getProfiles();for(let i=0;i<profiles.length;i++){this._addProfileHeader(profiles[i]);}}
_handleContextMenuEvent(event){const contextMenu=new ContextMenu.ContextMenu(event);if(this.panelSidebarElement().isSelfOrAncestor(event.srcElement)){contextMenu.defaultSection().appendItem(UIString.UIString('Load…'),this._fileSelectorElement.click.bind(this._fileSelectorElement));}
contextMenu.show();}
showLoadFromFileDialog(){this._fileSelectorElement.click();}
_addProfileHeader(profile){const profileType=profile.profileType();const typeId=profileType.id;this._typeIdToSidebarSection[typeId].addProfileHeader(profile);if(!this.visibleView||this.visibleView===this._launcherView){this.showProfile(profile);}}
_removeProfileHeader(profile){if(profile.profileType().profileBeingRecorded()===profile){this._profileBeingRecordedRemoved();}
const i=this._indexOfViewForProfile(profile);if(i!==-1){this._profileToView.splice(i,1);}
const typeId=profile.profileType().id;const sectionIsEmpty=this._typeIdToSidebarSection[typeId].removeProfileHeader(profile);if(sectionIsEmpty){this.profilesItemTreeElement.select();this._showLauncherView();}}
showProfile(profile){if(!profile||(profile.profileType().profileBeingRecorded()===profile)&&!profile.profileType().hasTemporaryView()){return null;}
const view=this.viewForProfile(profile);if(view===this.visibleView){return view;}
this.closeVisibleView();view.show(this.profileViews);this._toolbarElement.classList.remove('hidden');this.visibleView=view;const profileTypeSection=this._typeIdToSidebarSection[profile.profileType().id];const sidebarElement=profileTypeSection.sidebarElementForProfile(profile);sidebarElement.revealAndSelect();this._profileViewToolbar.removeToolbarItems();view.toolbarItems().then(items=>{items.map(item=>this._profileViewToolbar.appendToolbarItem(item));});return view;}
showObject(snapshotObjectId,perspectiveName){}
async linkifyObject(nodeIndex){return null;}
viewForProfile(profile){const index=this._indexOfViewForProfile(profile);if(index!==-1){return this._profileToView[index].view;}
const view=profile.createView(this);view.element.classList.add('profile-view');this._profileToView.push({profile:profile,view:view});return view;}
_indexOfViewForProfile(profile){return this._profileToView.findIndex(item=>item.profile===profile);}
closeVisibleView(){if(this.visibleView){this.visibleView.detach();}
delete this.visibleView;}
focus(){this._sidebarTree.focus();}}
class ProfileTypeSidebarSection extends TreeOutline.TreeElement{constructor(dataDisplayDelegate,profileType){super(profileType.treeItemTitle,true);this.selectable=false;this._dataDisplayDelegate=dataDisplayDelegate;this._profileTreeElements=[];this._profileGroups={};this.expand();this.hidden=true;this.setCollapsible(false);}
addProfileHeader(profile){this.hidden=false;const profileType=profile.profileType();let sidebarParent=this;const profileTreeElement=(profile.createSidebarTreeElement(this._dataDisplayDelegate));this._profileTreeElements.push(profileTreeElement);if(!profile.fromFile()&&profileType.profileBeingRecorded()!==profile){const profileTitle=profile.title;let group=this._profileGroups[profileTitle];if(!group){group=new ProfileGroup();this._profileGroups[profileTitle]=group;}
group.profileSidebarTreeElements.push(profileTreeElement);const groupSize=group.profileSidebarTreeElements.length;if(groupSize===2){group.sidebarTreeElement=new ProfileGroupSidebarTreeElement(this._dataDisplayDelegate,profile.title);const firstProfileTreeElement=group.profileSidebarTreeElements[0];const index=this.children().indexOf(firstProfileTreeElement);this.insertChild(group.sidebarTreeElement,index);const selected=firstProfileTreeElement.selected;this.removeChild(firstProfileTreeElement);group.sidebarTreeElement.appendChild(firstProfileTreeElement);if(selected){firstProfileTreeElement.revealAndSelect();}
firstProfileTreeElement.setSmall(true);firstProfileTreeElement.setMainTitle(UIString.UIString('Run %d',1));this.treeOutline.element.classList.add('some-expandable');}
if(groupSize>=2){sidebarParent=group.sidebarTreeElement;profileTreeElement.setSmall(true);profileTreeElement.setMainTitle(UIString.UIString('Run %d',groupSize));}}
sidebarParent.appendChild(profileTreeElement);}
removeProfileHeader(profile){const index=this._sidebarElementIndex(profile);if(index===-1){return false;}
const profileTreeElement=this._profileTreeElements[index];this._profileTreeElements.splice(index,1);let sidebarParent=this;const group=this._profileGroups[profile.title];if(group){const groupElements=group.profileSidebarTreeElements;groupElements.splice(groupElements.indexOf(profileTreeElement),1);if(groupElements.length===1){const pos=sidebarParent.children().indexOf((group.sidebarTreeElement));group.sidebarTreeElement.removeChild(groupElements[0]);this.insertChild(groupElements[0],pos);groupElements[0].setSmall(false);groupElements[0].setMainTitle(profile.title);this.removeChild(group.sidebarTreeElement);}
if(groupElements.length!==0){sidebarParent=group.sidebarTreeElement;}}
sidebarParent.removeChild(profileTreeElement);profileTreeElement.dispose();if(this.childCount()){return false;}
this.hidden=true;return true;}
sidebarElementForProfile(profile){const index=this._sidebarElementIndex(profile);return index===-1?null:this._profileTreeElements[index];}
_sidebarElementIndex(profile){const elements=this._profileTreeElements;for(let i=0;i<elements.length;i++){if(elements[i].profile===profile){return i;}}
return-1;}
onattach(){this.listItemElement.classList.add('profiles-tree-section');}}
class ProfileGroup{constructor(){this.profileSidebarTreeElements=[];this.sidebarTreeElement=null;}}
class ProfileGroupSidebarTreeElement extends TreeOutline.TreeElement{constructor(dataDisplayDelegate,title){super('',true);this.selectable=false;this._dataDisplayDelegate=dataDisplayDelegate;this._title=title;this.expand();this.toggleOnClick=true;}
onselect(){const hasChildren=this.childCount()>0;if(hasChildren){this._dataDisplayDelegate.showProfile(this.lastChild().profile);}
return hasChildren;}
onattach(){this.listItemElement.classList.add('profile-group-sidebar-tree-item');this.listItemElement.createChild('div','icon');this.listItemElement.createChild('div','titles no-subtitle').createChild('span','title-container').createChild('span','title').textContent=this._title;}}
class ProfilesSidebarTreeElement extends TreeOutline.TreeElement{constructor(panel){super('',false);this.selectable=true;this._panel=panel;}
onselect(){this._panel._showLauncherView();return true;}
onattach(){this.listItemElement.classList.add('profile-launcher-view-tree-item');this.listItemElement.createChild('div','icon');this.listItemElement.createChild('div','titles no-subtitle').createChild('span','title-container').createChild('span','title').textContent=UIString.UIString('Profiles');}}
class JSProfilerPanel extends ProfilesPanel{constructor(){const registry=instance;super('js_profiler',[registry.cpuProfileType],'profiler.js-toggle-recording');}
wasShown(){self.UI.context.setFlavor(JSProfilerPanel,this);}
willHide(){self.UI.context.setFlavor(JSProfilerPanel,null);}
handleAction(context,actionId){const panel=self.UI.context.flavor(JSProfilerPanel);console.assert(panel&&panel instanceof JSProfilerPanel);panel.toggleRecord();return true;}}
var ProfilesPanel$1=Object.freeze({__proto__:null,ProfilesPanel:ProfilesPanel,ProfileTypeSidebarSection:ProfileTypeSidebarSection,ProfileGroup:ProfileGroup,ProfileGroupSidebarTreeElement:ProfileGroupSidebarTreeElement,ProfilesSidebarTreeElement:ProfilesSidebarTreeElement,JSProfilerPanel:JSProfilerPanel});class HeapProfilerPanel extends ProfilesPanel{constructor(){const registry=instance;const profileTypes=[registry.heapSnapshotProfileType,registry.trackingHeapSnapshotProfileType,registry.samplingHeapProfileType];if(Root.Runtime.experiments.isEnabled('nativeHeapProfiler')){profileTypes.push(registry.samplingNativeHeapProfileType);profileTypes.push(registry.samplingNativeHeapSnapshotRendererType);profileTypes.push(registry.samplingNativeHeapSnapshotBrowserType);}
super('heap_profiler',profileTypes,'profiler.heap-toggle-recording');}
appendApplicableItems(event,contextMenu,target){if(!(target instanceof RemoteObject.RemoteObject)){return;}
if(!this.isShowing()){return;}
const object=(target);if(!object.objectId){return;}
const objectId=(object.objectId);const heapProfiles=instance.heapSnapshotProfileType.getProfiles();if(!heapProfiles.length){return;}
const heapProfilerModel=object.runtimeModel().heapProfilerModel();if(!heapProfilerModel){return;}
function revealInView(viewName){heapProfilerModel.snapshotObjectIdForObjectId(objectId).then(result=>{if(this.isShowing()&&result){this.showObject(result,viewName);}});}
contextMenu.revealSection().appendItem(UIString.UIString('Reveal in Summary view'),revealInView.bind(this,'Summary'));}
handleAction(context,actionId){const panel=self.UI.context.flavor(HeapProfilerPanel);console.assert(panel&&panel instanceof HeapProfilerPanel);panel.toggleRecord();return true;}
wasShown(){self.UI.context.setFlavor(HeapProfilerPanel,this);userMetrics.panelLoaded('heap_profiler','DevTools.Launch.HeapProfiler');}
willHide(){self.UI.context.setFlavor(HeapProfilerPanel,null);}
showObject(snapshotObjectId,perspectiveName){const registry=instance;const heapProfiles=registry.heapSnapshotProfileType.getProfiles();for(let i=0;i<heapProfiles.length;i++){const profile=heapProfiles[i];if(profile.maxJSObjectId>=snapshotObjectId){this.showProfile(profile);const view=this.viewForProfile(profile);view.selectLiveObject(perspectiveName,snapshotObjectId);break;}}}}
var HeapProfilerPanel$1=Object.freeze({__proto__:null,HeapProfilerPanel:HeapProfilerPanel});class LiveHeapProfileView extends Widget.VBox{constructor(){super(true);this._gridNodeByUrl=new Map();this.registerRequiredCSS('profiler/liveHeapProfile.css');this._setting=Settings.Settings.instance().moduleSetting('memoryLiveHeapProfile');const toolbar=new Toolbar.Toolbar('live-heap-profile-toolbar',this.contentElement);this._toggleRecordAction=(self.UI.actionRegistry.action('live-heap-profile.toggle-recording'));this._toggleRecordButton=Toolbar.Toolbar.createActionButton(this._toggleRecordAction);this._toggleRecordButton.setToggled(this._setting.get());toolbar.appendToolbarItem(this._toggleRecordButton);const mainTarget=SDKModel.TargetManager.instance().mainTarget();if(mainTarget&&mainTarget.model(ResourceTreeModel.ResourceTreeModel)){const startWithReloadAction=(self.UI.actionRegistry.action('live-heap-profile.start-with-reload'));this._startWithReloadButton=Toolbar.Toolbar.createActionButton(startWithReloadAction);toolbar.appendToolbarItem(this._startWithReloadButton);}
this._dataGrid=this._createDataGrid();this._dataGrid.asWidget().show(this.contentElement);this._currentPollId=0;}
_createDataGrid(){const columns=[{id:'size',title:ls`JS Heap`,width:'72px',fixedWidth:true,sortable:true,align:DataGrid.Align.Right,sort:DataGrid.Order.Descending,tooltip:ls`Allocated JS heap size currently in use`,},{id:'isolates',title:ls`VMs`,width:'40px',fixedWidth:true,align:DataGrid.Align.Right,tooltip:ls`Number of VMs sharing the same script source`},{id:'url',title:ls`Script URL`,fixedWidth:false,sortable:true,tooltip:ls`URL of the script source`}];const dataGrid=new SortableDataGrid.SortableDataGrid({displayName:ls`Heap Profile`,columns});dataGrid.setResizeMethod(DataGrid.ResizeMethod.Last);dataGrid.element.classList.add('flex-auto');dataGrid.element.addEventListener('keydown',this._onKeyDown.bind(this),false);dataGrid.addEventListener(DataGrid.Events.OpenedNode,this._revealSourceForSelectedNode,this);dataGrid.addEventListener(DataGrid.Events.SortingChanged,this._sortingChanged,this);for(const info of columns){const headerCell=dataGrid.headerTableHeader(info.id);if(headerCell){headerCell.setAttribute('title',info.tooltip);}}
return dataGrid;}
wasShown(){this._poll();this._setting.addChangeListener(this._settingChanged,this);}
willHide(){++this._currentPollId;this._setting.removeChangeListener(this._settingChanged,this);}
_settingChanged(value){this._toggleRecordButton.setToggled((value.data));}
async _poll(){const pollId=this._currentPollId;do{const isolates=Array.from(self.SDK.isolateManager.isolates());const profiles=await Promise.all(isolates.map(isolate=>isolate.heapProfilerModel()&&isolate.heapProfilerModel().getSamplingProfile()));if(this._currentPollId!==pollId){return;}
this._update(isolates,profiles);await new Promise(r=>setTimeout(r,3000));}while(this._currentPollId===pollId);}
_update(isolates,profiles){const dataByUrl=new Map();profiles.forEach((profile,index)=>{if(profile){processNodeTree(isolates[index],'',profile.head);}});const rootNode=this._dataGrid.rootNode();const exisitingNodes=new Set();for(const pair of dataByUrl){const url=(pair[0]);const size=(pair[1].size);const isolateCount=(pair[1].isolates.size);if(!url){console.info(`Node with empty URL: ${size} bytes`);continue;}
let node=this._gridNodeByUrl.get(url);if(node){node.updateNode(size,isolateCount);}else{node=new GridNode(url,size,isolateCount);this._gridNodeByUrl.set(url,node);rootNode.appendChild(node);}
exisitingNodes.add(node);}
for(const node of rootNode.children.slice()){if(!exisitingNodes.has(node)){node.remove();}
this._gridNodeByUrl.delete(node);}
this._sortingChanged();function processNodeTree(isolate,parentUrl,node){const url=node.callFrame.url||parentUrl||systemNodeName(node)||anonymousScriptName(node);node.children.forEach(processNodeTree.bind(null,isolate,url));if(!node.selfSize){return;}
let data=dataByUrl.get(url);if(!data){data={size:0,isolates:new Set()};dataByUrl.set(url,data);}
data.size+=node.selfSize;data.isolates.add(isolate);}
function systemNodeName(node){const name=node.callFrame.functionName;return name.startsWith('(')&&name!=='(root)'?name:'';}
function anonymousScriptName(node){return Number(node.callFrame.scriptId)?UIString.UIString('(Anonymous Script %s)',node.callFrame.scriptId):'';}}
_onKeyDown(event){if(!isEnterKey(event)){return;}
event.consume(true);this._revealSourceForSelectedNode();}
_revealSourceForSelectedNode(){const node=this._dataGrid.selectedNode;if(!node||!node._url){return;}
const sourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(node._url);if(sourceCode){Revealer.reveal(sourceCode);}}
_sortingChanged(){const columnId=this._dataGrid.sortColumnId();if(!columnId){return;}
const sortByUrl=(a,b)=>b._url.localeCompare(a._url);const sortBySize=(a,b)=>b._size-a._size;const sortFunction=columnId==='url'?sortByUrl:sortBySize;this._dataGrid.sortNodes(sortFunction,this._dataGrid.isSortOrderAscending());}
_toggleRecording(){const enable=!this._setting.get();if(enable){this._startRecording(false);}else{this._stopRecording();}}
_startRecording(reload){this._setting.set(true);if(!reload){return;}
const mainTarget=SDKModel.TargetManager.instance().mainTarget();if(!mainTarget){return;}
const resourceTreeModel=(mainTarget.model(ResourceTreeModel.ResourceTreeModel));if(resourceTreeModel){resourceTreeModel.reloadPage();}}
async _stopRecording(){this._setting.set(false);}}
class GridNode extends SortableDataGrid.SortableDataGridNode{constructor(url,size,isolateCount){super();this._url=url;this._size=size;this._isolateCount=isolateCount;}
updateNode(size,isolateCount){if(this._size===size&&this._isolateCount===isolateCount){return;}
this._size=size;this._isolateCount=isolateCount;this.refresh();}
createCell(columnId){const cell=this.createTD(columnId);switch(columnId){case'url':cell.textContent=this._url;break;case'size':cell.textContent=Number.withThousandsSeparator(Math.round(this._size/1e3));cell.createChild('span','size-units').textContent=ls`KB`;break;case'isolates':cell.textContent=this._isolateCount;break;}
return cell;}}
class ActionDelegate{handleAction(context,actionId){(async()=>{const profileViewId='live_heap_profile';await ViewManager.ViewManager.instance().showView(profileViewId);const widget=await ViewManager.ViewManager.instance().view(profileViewId).widget();this._innerHandleAction((widget),actionId);})();return true;}
_innerHandleAction(profilerView,actionId){switch(actionId){case'live-heap-profile.toggle-recording':profilerView._toggleRecording();break;case'live-heap-profile.start-with-reload':profilerView._startRecording(true);break;default:console.assert(false,`Unknown action: ${actionId}`);}}}
var LiveHeapProfileView$1=Object.freeze({__proto__:null,LiveHeapProfileView:LiveHeapProfileView,GridNode:GridNode,ActionDelegate:ActionDelegate});export{BottomUpProfileDataGrid,CPUProfileFlameChart$1 as CPUProfileFlameChart,CPUProfileView$1 as CPUProfileView,ChildrenProvider$1 as ChildrenProvider,HeapProfileView$1 as HeapProfileView,HeapProfilerPanel$1 as HeapProfilerPanel,HeapSnapshotDataGrids,HeapSnapshotGridNodes,HeapSnapshotProxy$1 as HeapSnapshotProxy,HeapSnapshotView$1 as HeapSnapshotView,HeapTimelineOverview$1 as HeapTimelineOverview,IsolateSelector$1 as IsolateSelector,LiveHeapProfileView$1 as LiveHeapProfileView,ProfileDataGrid,ProfileHeader$1 as ProfileHeader,ProfileLauncherView$1 as ProfileLauncherView,ProfileSidebarTreeElement$1 as ProfileSidebarTreeElement,ProfileTypeRegistry$1 as ProfileTypeRegistry,ProfileView$1 as ProfileView,ProfilesPanel$1 as ProfilesPanel,TopDownProfileDataGrid};