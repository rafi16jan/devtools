import{DebuggerWorkspaceBinding,CSSWorkspaceBinding,FileUtils}from'../bindings/bindings.js';import{ObjectWrapper,UIString,Revealer,Settings}from'../common/common.js';import{SDKModel,CPUProfilerModel,CSSModel,DebuggerModel,ResourceTreeModel}from'../sdk/sdk.js';import{Text,TextRange}from'../text_utils/text_utils.js';import{DataGrid,SortableDataGrid}from'../data_grid/data_grid.js';import{sourceFormatter}from'../formatter/formatter.js';import{Widget,UIUtils,Toolbar,ViewManager}from'../ui/ui.js';import{Workspace,UISourceCode}from'../workspace/workspace.js';import{userMetrics,UserMetrics}from'../host/host.js';import{SourcesTextEditor}from'../source_frame/source_frame.js';import'../text_editor/text_editor.js';const CoverageType={CSS:(1<<0),JavaScript:(1<<1),JavaScriptPerFunction:(1<<2),};const SuspensionState={Active:Symbol('Active'),Suspending:Symbol('Suspending'),Suspended:Symbol('Suspended')};const Events={CoverageUpdated:Symbol('CoverageUpdated'),CoverageReset:Symbol('CoverageReset'),};const _coveragePollingPeriodMs=200;class CoverageModel extends SDKModel.SDKModel{constructor(target){super(target);this._cpuProfilerModel=target.model(CPUProfilerModel.CPUProfilerModel);this._cssModel=target.model(CSSModel.CSSModel);this._debuggerModel=target.model(DebuggerModel.DebuggerModel);this._coverageByURL=new Map();this._coverageByContentProvider=new Map();this._coverageUpdateTimes=new Set();this._suspensionState=SuspensionState.Active;this._pollTimer=null;this._currentPollPromise=null;this._shouldResumePollingOnResume=false;this._jsBacklog=[];this._cssBacklog=[];this._performanceTraceRecording=false;}
async start(jsCoveragePerBlock){if(this._suspensionState!==SuspensionState.Active){throw Error('Cannot start CoverageModel while it is not active.');}
const promises=[];if(this._cssModel){this._clearCSS();this._cssModel.addEventListener(CSSModel.Events.StyleSheetAdded,this._handleStyleSheetAdded,this);promises.push(this._cssModel.startCoverage());}
if(this._cpuProfilerModel){promises.push(this._cpuProfilerModel.startPreciseCoverage(jsCoveragePerBlock,this.preciseCoverageDeltaUpdate.bind(this)));}
await Promise.all(promises);return!!(this._cssModel||this._cpuProfilerModel);}
preciseCoverageDeltaUpdate(timestamp,occasion,coverageData){this._coverageUpdateTimes.add(timestamp);this._backlogOrProcessJSCoverage(coverageData,timestamp);}
async stop(){await this.stopPolling();const promises=[];if(this._cpuProfilerModel){promises.push(this._cpuProfilerModel.stopPreciseCoverage());}
if(this._cssModel){promises.push(this._cssModel.stopCoverage());this._cssModel.removeEventListener(CSSModel.Events.StyleSheetAdded,this._handleStyleSheetAdded,this);}
await Promise.all(promises);}
reset(){this._coverageByURL=new Map();this._coverageByContentProvider=new Map();this._coverageUpdateTimes=new Set();this.dispatchEventToListeners(CoverageModel.Events.CoverageReset);}
async startPolling(){if(this._currentPollPromise||this._suspensionState!==SuspensionState.Active){return;}
await this._pollLoop();}
async _pollLoop(){this._clearTimer();this._currentPollPromise=this._pollAndCallback();await this._currentPollPromise;if(this._suspensionState===SuspensionState.Active||this._performanceTraceRecording){this._pollTimer=setTimeout(()=>this._pollLoop(),_coveragePollingPeriodMs);}}
async stopPolling(){this._clearTimer();await this._currentPollPromise;this._currentPollPromise=null;await this._pollAndCallback();}
async _pollAndCallback(){if(this._suspensionState===SuspensionState.Suspended&&!this._performanceTraceRecording){return;}
const updates=await this._takeAllCoverage();console.assert(this._suspensionState!==SuspensionState.Suspended||this._performanceTraceRecording,'CoverageModel was suspended while polling.');if(updates.length){this.dispatchEventToListeners(Events.CoverageUpdated,updates);}}
_clearTimer(){if(this._pollTimer){clearTimeout(this._pollTimer);this._pollTimer=null;}}
async preSuspendModel(reason){if(this._suspensionState!==SuspensionState.Active){return;}
this._suspensionState=SuspensionState.Suspending;if(reason==='performance-timeline'){this._performanceTraceRecording=true;return;}
if(this._currentPollPromise){await this.stopPolling();this._shouldResumePollingOnResume=true;}}
async suspendModel(reason){this._suspensionState=SuspensionState.Suspended;}
async resumeModel(){}
async postResumeModel(){this._suspensionState=SuspensionState.Active;this._performanceTraceRecording=false;if(this._shouldResumePollingOnResume){this._shouldResumePollingOnResume=false;await this.startPolling();}}
entries(){return Array.from(this._coverageByURL.values());}
getCoverageForUrl(url){return this._coverageByURL.get(url);}
usageForRange(contentProvider,startOffset,endOffset){const coverageInfo=this._coverageByContentProvider.get(contentProvider);return coverageInfo&&coverageInfo.usageForRange(startOffset,endOffset);}
_clearCSS(){for(const entry of this._coverageByContentProvider.values()){if(entry.type()!==CoverageType.CSS){continue;}
const contentProvider=(entry.contentProvider());this._coverageByContentProvider.delete(contentProvider);const key=`${contentProvider.startLine}:${contentProvider.startColumn}`;const urlEntry=this._coverageByURL.get(entry.url());if(!urlEntry||!urlEntry._coverageInfoByLocation.delete(key)){continue;}
urlEntry._addToSizes(-entry._usedSize,-entry._size);if(!urlEntry._coverageInfoByLocation.size){this._coverageByURL.delete(entry.url());}}
for(const styleSheetHeader of this._cssModel.getAllStyleSheetHeaders()){this._addStyleSheetToCSSCoverage(styleSheetHeader);}}
async _takeAllCoverage(){const[updatesCSS,updatesJS]=await Promise.all([this._takeCSSCoverage(),this._takeJSCoverage()]);return[...updatesCSS,...updatesJS];}
async _takeJSCoverage(){if(!this._cpuProfilerModel){return[];}
const{coverage,timestamp}=await this._cpuProfilerModel.takePreciseCoverage();this._coverageUpdateTimes.add(timestamp);return this._backlogOrProcessJSCoverage(coverage,timestamp);}
coverageUpdateTimes(){return this._coverageUpdateTimes;}
async _backlogOrProcessJSCoverage(freshRawCoverageData,freshTimestamp){if(freshRawCoverageData.length>0){this._jsBacklog.push({rawCoverageData:freshRawCoverageData,stamp:freshTimestamp});}
if(this._suspensionState!==SuspensionState.Active){return[];}
const ascendingByTimestamp=(x,y)=>x.stamp-y.stamp;const results=[];for(const{rawCoverageData,stamp}of this._jsBacklog.sort(ascendingByTimestamp)){results.push(this._processJSCoverage(rawCoverageData,stamp));}
this._jsBacklog=[];return results.flat();}
async processJSBacklog(){this._backlogOrProcessJSCoverage([],0);}
_processJSCoverage(scriptsCoverage,stamp){const updatedEntries=[];for(const entry of scriptsCoverage){const script=this._debuggerModel.scriptForId(entry.scriptId);if(!script){continue;}
const ranges=[];let type=CoverageType.JavaScript;for(const func of entry.functions){if(func.isBlockCoverage===false&&!(func.ranges.length===1&&!func.ranges[0].count)){type|=CoverageType.JavaScriptPerFunction;}
for(const range of func.ranges){ranges.push(range);}}
const subentry=this._addCoverage(script,script.contentLength,script.lineOffset,script.columnOffset,ranges,(type),stamp);if(subentry){updatedEntries.push(subentry);}}
return updatedEntries;}
_handleStyleSheetAdded(event){const styleSheetHeader=(event.data);this._addStyleSheetToCSSCoverage(styleSheetHeader);}
async _takeCSSCoverage(){if(!this._cssModel||this._suspensionState!==SuspensionState.Active){return[];}
const{coverage,timestamp}=await this._cssModel.takeCoverageDelta();this._coverageUpdateTimes.add(timestamp);return this._backlogOrProcessCSSCoverage(coverage,timestamp);}
async _backlogOrProcessCSSCoverage(freshRawCoverageData,freshTimestamp){if(freshRawCoverageData.length>0){this._cssBacklog.push({rawCoverageData:freshRawCoverageData,stamp:freshTimestamp});}
if(this._suspensionState!==SuspensionState.Active){return[];}
const ascendingByTimestamp=(x,y)=>x.stamp-y.stamp;const results=[];for(const{rawCoverageData,stamp}of this._cssBacklog.sort(ascendingByTimestamp)){results.push(this._processCSSCoverage(rawCoverageData,stamp));}
this._cssBacklog=[];return results.flat();}
_processCSSCoverage(ruleUsageList,stamp){const updatedEntries=[];const rulesByStyleSheet=new Map();for(const rule of ruleUsageList){const styleSheetHeader=this._cssModel.styleSheetHeaderForId(rule.styleSheetId);if(!styleSheetHeader){continue;}
let ranges=rulesByStyleSheet.get(styleSheetHeader);if(!ranges){ranges=[];rulesByStyleSheet.set(styleSheetHeader,ranges);}
ranges.push({startOffset:rule.startOffset,endOffset:rule.endOffset,count:Number(rule.used)});}
for(const entry of rulesByStyleSheet){const styleSheetHeader=(entry[0]);const ranges=(entry[1]);const subentry=this._addCoverage(styleSheetHeader,styleSheetHeader.contentLength,styleSheetHeader.startLine,styleSheetHeader.startColumn,ranges,CoverageType.CSS,stamp);if(subentry){updatedEntries.push(subentry);}}
return updatedEntries;}
static _convertToDisjointSegments(ranges,stamp){ranges.sort((a,b)=>a.startOffset-b.startOffset);const result=[];const stack=[];for(const entry of ranges){let top=stack.peekLast();while(top&&top.endOffset<=entry.startOffset){append(top.endOffset,top.count);stack.pop();top=stack.peekLast();}
append(entry.startOffset,top?top.count:undefined);stack.push(entry);}
while(stack.length){const top=stack.pop();append(top.endOffset,top.count);}
function append(end,count){const last=result.peekLast();if(last){if(last.end===end){return;}
if(last.count===count){last.end=end;return;}}
result.push({end:end,count:count,stamp:stamp});}
return result;}
_addStyleSheetToCSSCoverage(styleSheetHeader){this._addCoverage(styleSheetHeader,styleSheetHeader.contentLength,styleSheetHeader.startLine,styleSheetHeader.startColumn,[],CoverageType.CSS,Date.now());}
_addCoverage(contentProvider,contentLength,startLine,startColumn,ranges,type,stamp){const url=contentProvider.contentURL();if(!url){return null;}
let urlCoverage=this._coverageByURL.get(url);let isNewUrlCoverage=false;if(!urlCoverage){isNewUrlCoverage=true;urlCoverage=new URLCoverageInfo(url);this._coverageByURL.set(url,urlCoverage);}
const coverageInfo=urlCoverage._ensureEntry(contentProvider,contentLength,startLine,startColumn,type);this._coverageByContentProvider.set(contentProvider,coverageInfo);const segments=CoverageModel._convertToDisjointSegments(ranges,stamp);if(segments.length&&segments.peekLast().end<contentLength){segments.push({end:contentLength,stamp:stamp});}
const oldUsedSize=coverageInfo._usedSize;coverageInfo.mergeCoverage(segments);if(!isNewUrlCoverage&&coverageInfo._usedSize===oldUsedSize){return null;}
urlCoverage._addToSizes(coverageInfo._usedSize-oldUsedSize,0);return coverageInfo;}
async exportReport(fos){const result=[];function locationCompare(a,b){const[aLine,aPos]=a.split(':');const[bLine,bPos]=b.split(':');return aLine-bLine||aPos-bPos;}
const coverageByUrlKeys=Array.from(this._coverageByURL.keys()).sort();for(const urlInfoKey of coverageByUrlKeys){const urlInfo=this._coverageByURL.get(urlInfoKey);const url=urlInfo.url();if(url.startsWith('extensions::')||url.startsWith('chrome-extension://')){continue;}
let useFullText=false;for(const info of urlInfo._coverageInfoByLocation.values()){if(info._lineOffset||info._columnOffset){useFullText=!!url;break;}}
let fullText=null;if(useFullText){const resource=ResourceTreeModel.ResourceTreeModel.resourceForURL(url);const content=(await resource.requestContent()).content;fullText=resource?new Text.Text(content||''):null;}
const coverageByLocationKeys=Array.from(urlInfo._coverageInfoByLocation.keys()).sort(locationCompare);if(fullText){const entry={url,ranges:[],text:fullText.value()};for(const infoKey of coverageByLocationKeys){const info=urlInfo._coverageInfoByLocation.get(infoKey);const offset=fullText?fullText.offsetFromPosition(info._lineOffset,info._columnOffset):0;let start=0;for(const segment of info._segments){if(segment.count){entry.ranges.push({start:start+offset,end:segment.end+offset});}else{start=segment.end;}}}
result.push(entry);continue;}
for(const infoKey of coverageByLocationKeys){const info=urlInfo._coverageInfoByLocation.get(infoKey);const entry={url,ranges:[],text:(await info.contentProvider().requestContent()).content};let start=0;for(const segment of info._segments){if(segment.count){entry.ranges.push({start:start,end:segment.end});}else{start=segment.end;}}
result.push(entry);}}
await fos.write(JSON.stringify(result,undefined,2));fos.close();}}
SDKModel.SDKModel.register(CoverageModel,SDKModel.Capability.None,false);class URLCoverageInfo extends ObjectWrapper.ObjectWrapper{constructor(url){super();this._url=url;this._coverageInfoByLocation=new Map();this._size=0;this._usedSize=0;this._type;this._isContentScript=false;}
url(){return this._url;}
type(){return this._type;}
size(){return this._size;}
usedSize(){return this._usedSize;}
unusedSize(){return this._size-this._usedSize;}
usedPercentage(){if(this._size===0){return 0;}
return this.usedSize()/this.size()*100;}
unusedPercentage(){if(this._size===0){return 100;}
return this.unusedSize()/this.size()*100;}
isContentScript(){return this._isContentScript;}
entries(){return this._coverageInfoByLocation.values();}
_addToSizes(usedSize,size){this._usedSize+=usedSize;this._size+=size;if(usedSize!==0||size!==0){this.dispatchEventToListeners(URLCoverageInfo.Events.SizesChanged);}}
_ensureEntry(contentProvider,contentLength,lineOffset,columnOffset,type){const key=`${lineOffset}:${columnOffset}`;let entry=this._coverageInfoByLocation.get(key);if((type&CoverageType.JavaScript)&&!this._coverageInfoByLocation.size){this._isContentScript=(contentProvider).isContentScript();}
this._type|=type;if(entry){entry._coverageType|=type;return entry;}
if((type&CoverageType.JavaScript)&&!this._coverageInfoByLocation.size){this._isContentScript=(contentProvider).isContentScript();}
entry=new CoverageInfo(contentProvider,contentLength,lineOffset,columnOffset,type);this._coverageInfoByLocation.set(key,entry);this._addToSizes(0,contentLength);return entry;}}
URLCoverageInfo.Events={SizesChanged:Symbol('SizesChanged')};class CoverageInfo{constructor(contentProvider,size,lineOffset,columnOffset,type){this._contentProvider=contentProvider;this._size=size;this._usedSize=0;this._statsByTimestamp=new Map();this._lineOffset=lineOffset;this._columnOffset=columnOffset;this._coverageType=type;this._segments=[];}
contentProvider(){return this._contentProvider;}
url(){return this._contentProvider.contentURL();}
type(){return this._coverageType;}
mergeCoverage(segments){this._segments=CoverageInfo._mergeCoverage(this._segments,segments);this._updateStats();}
usedByTimestamp(){return this._statsByTimestamp;}
size(){return this._size;}
usageForRange(start,end){let index=this._segments.upperBound(start,(position,segment)=>position-segment.end);for(;index<this._segments.length&&this._segments[index].end<end;++index){if(this._segments[index].count){return true;}}
return index<this._segments.length&&!!this._segments[index].count;}
static _mergeCoverage(segmentsA,segmentsB){const result=[];let indexA=0;let indexB=0;while(indexA<segmentsA.length&&indexB<segmentsB.length){const a=segmentsA[indexA];const b=segmentsB[indexB];const count=typeof a.count==='number'||typeof b.count==='number'?(a.count||0)+(b.count||0):undefined;const end=Math.min(a.end,b.end);const last=result.peekLast();const stamp=Math.min(a.stamp,b.stamp);if(!last||last.count!==count||last.stamp!==stamp){result.push({end:end,count:count,stamp:stamp});}else{last.end=end;}
if(a.end<=b.end){indexA++;}
if(a.end>=b.end){indexB++;}}
for(;indexA<segmentsA.length;indexA++){result.push(segmentsA[indexA]);}
for(;indexB<segmentsB.length;indexB++){result.push(segmentsB[indexB]);}
return result;}
_updateStats(){this._statsByTimestamp=new Map();this._usedSize=0;let last=0;for(const segment of this._segments){if(!this._statsByTimestamp.has(segment.stamp)){this._statsByTimestamp.set(segment.stamp,0);}
if(segment.count){const used=segment.end-last;this._usedSize+=used;this._statsByTimestamp.set(segment.stamp,this._statsByTimestamp.get(segment.stamp)+used);}
last=segment.end;}}}
let RangeUseCount;let CoverageSegment;var CoverageModel$1=Object.freeze({__proto__:null,CoverageType:CoverageType,SuspensionState:SuspensionState,Events:Events,CoverageModel:CoverageModel,URLCoverageInfo:URLCoverageInfo,CoverageInfo:CoverageInfo,RangeUseCount:RangeUseCount,CoverageSegment:CoverageSegment});class CoverageListView extends Widget.VBox{constructor(filterCallback){super(true);this._nodeForCoverageInfo=new Map();this._filterCallback=filterCallback;this._highlightRegExp=null;this.registerRequiredCSS('coverage/coverageListView.css');const columns=[{id:'url',title:UIString.UIString('URL'),width:'250px',fixedWidth:false,sortable:true},{id:'type',title:UIString.UIString('Type'),width:'45px',fixedWidth:true,sortable:true},{id:'size',title:UIString.UIString('Total Bytes'),width:'60px',fixedWidth:true,sortable:true,align:DataGrid.Align.Right},{id:'unusedSize',title:UIString.UIString('Unused Bytes'),width:'100px',fixedWidth:true,sortable:true,align:DataGrid.Align.Right,sort:DataGrid.Order.Descending},{id:'bars',title:ls`Usage Visualization`,width:'250px',fixedWidth:false,sortable:true}];this._dataGrid=new SortableDataGrid.SortableDataGrid({displayName:ls`Code Coverage`,columns});this._dataGrid.setResizeMethod(DataGrid.ResizeMethod.Last);this._dataGrid.element.classList.add('flex-auto');this._dataGrid.element.addEventListener('keydown',this._onKeyDown.bind(this),false);this._dataGrid.addEventListener(DataGrid.Events.OpenedNode,this._onOpenedNode,this);this._dataGrid.addEventListener(DataGrid.Events.SortingChanged,this._sortingChanged,this);const dataGridWidget=this._dataGrid.asWidget();dataGridWidget.show(this.contentElement);this.setDefaultFocusedChild(dataGridWidget);}
update(coverageInfo){let hadUpdates=false;const maxSize=coverageInfo.reduce((acc,entry)=>Math.max(acc,entry.size()),0);const rootNode=this._dataGrid.rootNode();for(const entry of coverageInfo){let node=this._nodeForCoverageInfo.get(entry);if(node){if(this._filterCallback(node._coverageInfo)){hadUpdates=node._refreshIfNeeded(maxSize)||hadUpdates;}
continue;}
node=new GridNode(entry,maxSize);this._nodeForCoverageInfo.set(entry,node);if(this._filterCallback(node._coverageInfo)){rootNode.appendChild(node);hadUpdates=true;}}
if(hadUpdates){this._sortingChanged();}}
reset(){this._nodeForCoverageInfo.clear();this._dataGrid.rootNode().removeChildren();}
updateFilterAndHighlight(highlightRegExp){this._highlightRegExp=highlightRegExp;let hadTreeUpdates=false;for(const node of this._nodeForCoverageInfo.values()){const shouldBeVisible=this._filterCallback(node._coverageInfo);const isVisible=!!node.parent;if(shouldBeVisible){node._setHighlight(this._highlightRegExp);}
if(shouldBeVisible===isVisible){continue;}
hadTreeUpdates=true;if(!shouldBeVisible){node.remove();}else{this._dataGrid.rootNode().appendChild(node);}}
if(hadTreeUpdates){this._sortingChanged();}}
selectByUrl(url){for(const[info,node]of this._nodeForCoverageInfo.entries()){if(info.url()===url){node.revealAndSelect();break;}}}
_onOpenedNode(){this._revealSourceForSelectedNode();}
_onKeyDown(event){if(!isEnterKey(event)){return;}
event.consume(true);this._revealSourceForSelectedNode();}
async _revealSourceForSelectedNode(){const node=this._dataGrid.selectedNode;if(!node){return;}
const coverageInfo=(node)._coverageInfo;let sourceCode=Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(coverageInfo.url());if(!sourceCode){return;}
const formatData=await sourceFormatter.format(sourceCode);sourceCode=formatData.formattedSourceCode;if(this._dataGrid.selectedNode!==node){return;}
Revealer.reveal(sourceCode);}
_sortingChanged(){const columnId=this._dataGrid.sortColumnId();if(!columnId){return;}
let sortFunction;switch(columnId){case'url':sortFunction=compareURL;break;case'type':sortFunction=compareType;break;case'size':sortFunction=compareNumericField.bind(null,'size');break;case'bars':case'unusedSize':sortFunction=compareNumericField.bind(null,'unusedSize');break;default:console.assert(false,'Unknown sort field: '+columnId);return;}
this._dataGrid.sortNodes(sortFunction,!this._dataGrid.isSortOrderAscending());function compareURL(a,b){const nodeA=(a);const nodeB=(b);return nodeA._url.localeCompare(nodeB._url);}
function compareNumericField(fieldName,a,b){const nodeA=(a);const nodeB=(b);return nodeA._coverageInfo[fieldName]()-nodeB._coverageInfo[fieldName]()||compareURL(a,b);}
function compareType(a,b){const nodeA=(a);const nodeB=(b);const typeA=CoverageListView._typeToString(nodeA._coverageInfo.type());const typeB=CoverageListView._typeToString(nodeB._coverageInfo.type());return typeA.localeCompare(typeB)||compareURL(a,b);}}
static _typeToString(type){const types=[];if(type&CoverageType.CSS){types.push(UIString.UIString('CSS'));}
if(type&CoverageType.JavaScriptPerFunction){types.push(UIString.UIString('JS (per function)'));}else if(type&CoverageType.JavaScript){types.push(UIString.UIString('JS (per block)'));}
return types.join('+');}}
class GridNode extends SortableDataGrid.SortableDataGridNode{constructor(coverageInfo,maxSize){super();this._coverageInfo=coverageInfo;this._lastUsedSize;this._url=coverageInfo.url();this._maxSize=maxSize;this._highlightDOMChanges=[];this._highlightRegExp=null;}
_setHighlight(highlightRegExp){if(this._highlightRegExp===highlightRegExp){return;}
this._highlightRegExp=highlightRegExp;this.refresh();}
_refreshIfNeeded(maxSize){if(this._lastUsedSize===this._coverageInfo.usedSize()&&maxSize===this._maxSize){return false;}
this._lastUsedSize=this._coverageInfo.usedSize();this._maxSize=maxSize;this.refresh();return true;}
createCell(columnId){const cell=this.createTD(columnId);switch(columnId){case'url':{cell.title=this._url;const outer=cell.createChild('div','url-outer');const prefix=outer.createChild('div','url-prefix');const suffix=outer.createChild('div','url-suffix');const splitURL=/^(.*)(\/[^/]*)$/.exec(this._url);prefix.textContent=splitURL?splitURL[1]:this._url;suffix.textContent=splitURL?splitURL[2]:'';if(this._highlightRegExp){this._highlight(outer,this._url);}
this.setCellAccessibleName(this._url,cell,columnId);break;}
case'type':{cell.textContent=CoverageListView._typeToString(this._coverageInfo.type());if(this._coverageInfo.type()&CoverageType.JavaScriptPerFunction){cell.title=ls`JS coverage with per function granularity: Once a function was executed, the whole function is marked as covered.`;}else if(this._coverageInfo.type()&CoverageType.JavaScript){cell.title=ls`JS coverage with per block granularity: Once a block of JavaScript was executed, that block is marked as covered.`;}
break;}
case'size':{const sizeSpan=cell.createChild('span');sizeSpan.textContent=Number.withThousandsSeparator(this._coverageInfo.size()||0);const sizeAccessibleName=(this._coverageInfo.size()===1)?ls`1 byte`:ls`${this._coverageInfo.size() || 0} bytes`;this.setCellAccessibleName(sizeAccessibleName,cell,columnId);break;}
case'unusedSize':{const unusedSize=this._coverageInfo.unusedSize()||0;const unusedSizeSpan=cell.createChild('span');const unusedPercentsSpan=cell.createChild('span','percent-value');unusedSizeSpan.textContent=Number.withThousandsSeparator(unusedSize);const unusedPercentFormatted=ls`${this._percentageString(this._coverageInfo.unusedPercentage())} %`;unusedPercentsSpan.textContent=unusedPercentFormatted;const unusedAccessibleName=(unusedSize===1)?ls`1 byte, ${unusedPercentFormatted}`:ls`${unusedSize} bytes, ${unusedPercentFormatted}`;this.setCellAccessibleName(unusedAccessibleName,cell,columnId);break;}
case'bars':{const barContainer=cell.createChild('div','bar-container');const unusedPercent=this._percentageString(this._coverageInfo.unusedPercentage());const usedPercent=this._percentageString(this._coverageInfo.usedPercentage());if(this._coverageInfo.unusedSize()>0){const unusedSizeBar=barContainer.createChild('div','bar bar-unused-size');unusedSizeBar.style.width=((this._coverageInfo.unusedSize()/this._maxSize)*100||0)+'%';if(this._coverageInfo.type()&CoverageType.JavaScriptPerFunction){unusedSizeBar.title=ls`${this._coverageInfo.unusedSize()} bytes (${
                unusedPercent} %) belong to functions that have not (yet) been executed.`;}else if(this._coverageInfo.type()&CoverageType.JavaScript){unusedSizeBar.title=ls`${this._coverageInfo.unusedSize()} bytes (${
                unusedPercent} %) belong to blocks of JavaScript that have not (yet) been executed.`;}}
if(this._coverageInfo.usedSize()>0){const usedSizeBar=barContainer.createChild('div','bar bar-used-size');usedSizeBar.style.width=((this._coverageInfo.usedSize()/this._maxSize)*100||0)+'%';if(this._coverageInfo.type()&CoverageType.JavaScriptPerFunction){usedSizeBar.title=ls`${this._coverageInfo.usedSize()} bytes (${
                usedPercent} %) belong to functions that have executed at least once.`;}else if(this._coverageInfo.type()&CoverageType.JavaScript){usedSizeBar.title=ls`${this._coverageInfo.usedSize()} bytes (${
                usedPercent} %) belong to blocks of JavaScript that have executed at least once.`;}}
this.setCellAccessibleName(ls`${unusedPercent} % of file unused, ${usedPercent} % of file used`,cell,columnId);}}
return cell;}
_percentageString(value){return value.toFixed(1);}
_highlight(element,textContent){const matches=this._highlightRegExp.exec(textContent);if(!matches||!matches.length){return;}
const range=new TextRange.SourceRange(matches.index,matches[0].length);UIUtils.highlightRangesWithStyleClass(element,[range],'filter-highlight');}}
var CoverageListView$1=Object.freeze({__proto__:null,CoverageListView:CoverageListView,GridNode:GridNode});const decoratorType='coverage';class CoverageDecorationManager{constructor(coverageModel){this._coverageModel=coverageModel;this._textByProvider=new Map();this._uiSourceCodeByContentProvider=new Platform.Multimap();for(const uiSourceCode of Workspace.WorkspaceImpl.instance().uiSourceCodes()){uiSourceCode.addLineDecoration(0,decoratorType,this);}
Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Events.UISourceCodeAdded,this._onUISourceCodeAdded,this);}
reset(){for(const uiSourceCode of Workspace.WorkspaceImpl.instance().uiSourceCodes()){uiSourceCode.removeDecorationsForType(decoratorType);}}
dispose(){this.reset();Workspace.WorkspaceImpl.instance().removeEventListener(Workspace.Events.UISourceCodeAdded,this._onUISourceCodeAdded,this);}
update(updatedEntries){for(const entry of updatedEntries){for(const uiSourceCode of this._uiSourceCodeByContentProvider.get(entry.contentProvider())){uiSourceCode.removeDecorationsForType(decoratorType);uiSourceCode.addLineDecoration(0,decoratorType,this);}}}
async usageByLine(uiSourceCode){const result=[];const{content}=await uiSourceCode.requestContent();if(!content){return[];}
const sourceText=new Text.Text((content));await this._updateTexts(uiSourceCode,sourceText);const lineEndings=sourceText.lineEndings();for(let line=0;line<sourceText.lineCount();++line){const lineLength=lineEndings[line]-(line?lineEndings[line-1]:0)-1;if(!lineLength){result.push(undefined);continue;}
const startLocationsPromise=this._rawLocationsForSourceLocation(uiSourceCode,line,0);const endLocationsPromise=this._rawLocationsForSourceLocation(uiSourceCode,line,lineLength);const[startLocations,endLocations]=await Promise.all([startLocationsPromise,endLocationsPromise]);let used=undefined;for(let startIndex=0,endIndex=0;startIndex<startLocations.length;++startIndex){const start=startLocations[startIndex];while(endIndex<endLocations.length&&CoverageDecorationManager._compareLocations(start,endLocations[endIndex])>=0){++endIndex;}
if(endIndex>=endLocations.length||endLocations[endIndex].id!==start.id){continue;}
const end=endLocations[endIndex++];const text=this._textByProvider.get(end.contentProvider);if(!text){continue;}
const textValue=text.value();let startOffset=Math.min(text.offsetFromPosition(start.line,start.column),textValue.length-1);let endOffset=Math.min(text.offsetFromPosition(end.line,end.column),textValue.length-1);while(startOffset<=endOffset&&/\s/.test(textValue[startOffset])){++startOffset;}
while(startOffset<=endOffset&&/\s/.test(textValue[endOffset])){--endOffset;}
if(startOffset<=endOffset){used=this._coverageModel.usageForRange(end.contentProvider,startOffset,endOffset);}
if(used){break;}}
result.push(used);}
return result;}
async _updateTexts(uiSourceCode,text){const promises=[];for(let line=0;line<text.lineCount();++line){for(const entry of await this._rawLocationsForSourceLocation(uiSourceCode,line,0)){if(this._textByProvider.has(entry.contentProvider)){continue;}
this._textByProvider.set(entry.contentProvider,null);this._uiSourceCodeByContentProvider.set(entry.contentProvider,uiSourceCode);promises.push(this._updateTextForProvider(entry.contentProvider));}}
return Promise.all(promises);}
async _updateTextForProvider(contentProvider){const{content}=await contentProvider.requestContent();this._textByProvider.set(contentProvider,new Text.Text(content||''));}
async _rawLocationsForSourceLocation(uiSourceCode,line,column){const result=[];const contentType=uiSourceCode.contentType();if(contentType.hasScripts()){let locations=await DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode,line,column);locations=locations.filter(location=>!!location.script());for(const location of locations){const script=location.script();if(script.isInlineScript()&&contentType.isDocument()){location.lineNumber-=script.lineOffset;if(!location.lineNumber){location.columnNumber-=script.columnOffset;}}
result.push({id:`js:${location.scriptId}`,contentProvider:location.script(),line:location.lineNumber,column:location.columnNumber});}}
if(contentType.isStyleSheet()||contentType.isDocument()){const rawStyleLocations=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().uiLocationToRawLocations(new UISourceCode.UILocation(uiSourceCode,line,column));for(const location of rawStyleLocations){const header=location.header();if(!header){continue;}
if(header.isInline&&contentType.isDocument()){location.lineNumber-=header.startLine;if(!location.lineNumber){location.columnNumber-=header.startColumn;}}
result.push({id:`css:${location.styleSheetId}`,contentProvider:location.header(),line:location.lineNumber,column:location.columnNumber});}}
return result.sort(CoverageDecorationManager._compareLocations);}
static _compareLocations(a,b){return a.id.localeCompare(b.id)||a.line-b.line||a.column-b.column;}
_onUISourceCodeAdded(event){const uiSourceCode=(event.data);uiSourceCode.addLineDecoration(0,decoratorType,this);}}
let RawLocation;var CoverageDecorationManager$1=Object.freeze({__proto__:null,decoratorType:decoratorType,CoverageDecorationManager:CoverageDecorationManager,RawLocation:RawLocation});class CoverageView extends Widget.VBox{constructor(){super(true);this._model=null;this._decorationManager=null;this._resourceTreeModel=null;this.registerRequiredCSS('coverage/coverageView.css');const toolbarContainer=this.contentElement.createChild('div','coverage-toolbar-container');const toolbar=new Toolbar.Toolbar('coverage-toolbar',toolbarContainer);this._coverageType=null;this._coverageTypeComboBox=new Toolbar.ToolbarComboBox(this._onCoverageTypeComboBoxSelectionChanged.bind(this),ls`Choose coverage granularity: Per function has low overhead, per block has significant overhead.`);const coverageTypes=[{label:ls`Per function`,value:CoverageType.JavaScript|CoverageType.JavaScriptPerFunction,},{label:ls`Per block`,value:CoverageType.JavaScript,},];for(const type of coverageTypes){this._coverageTypeComboBox.addOption(this._coverageTypeComboBox.createOption(type.label,type.value));}
this._coverageTypeComboBoxSetting=self.Common.settings.createSetting('coverageViewCoverageType',0);this._coverageTypeComboBox.setSelectedIndex(this._coverageTypeComboBoxSetting.get());this._coverageTypeComboBox.setEnabled(true);toolbar.appendToolbarItem(this._coverageTypeComboBox);this._toggleRecordAction=(self.UI.actionRegistry.action('coverage.toggle-recording'));this._toggleRecordButton=Toolbar.Toolbar.createActionButton(this._toggleRecordAction);toolbar.appendToolbarItem(this._toggleRecordButton);const mainTarget=SDKModel.TargetManager.instance().mainTarget();const mainTargetSupportsRecordOnReload=mainTarget&&mainTarget.model(ResourceTreeModel.ResourceTreeModel);if(mainTargetSupportsRecordOnReload){const startWithReloadAction=(self.UI.actionRegistry.action('coverage.start-with-reload'));this._startWithReloadButton=Toolbar.Toolbar.createActionButton(startWithReloadAction);toolbar.appendToolbarItem(this._startWithReloadButton);this._toggleRecordButton.setEnabled(false);this._toggleRecordButton.setVisible(false);}
this._clearButton=new Toolbar.ToolbarButton(UIString.UIString('Clear all'),'largeicon-clear');this._clearButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._clear.bind(this));toolbar.appendToolbarItem(this._clearButton);toolbar.appendSeparator();this._saveButton=new Toolbar.ToolbarButton(UIString.UIString('Export...'),'largeicon-download');this._saveButton.addEventListener(Toolbar.ToolbarButton.Events.Click,event=>{this._exportReport();});toolbar.appendToolbarItem(this._saveButton);this._saveButton.setEnabled(false);this._textFilterRegExp=null;toolbar.appendSeparator();this._filterInput=new Toolbar.ToolbarInput(UIString.UIString('URL filter'),'',0.4,1);this._filterInput.setEnabled(false);this._filterInput.addEventListener(Toolbar.ToolbarInput.Event.TextChanged,this._onFilterChanged,this);toolbar.appendToolbarItem(this._filterInput);toolbar.appendSeparator();this._typeFilterValue=null;this._filterByTypeComboBox=new Toolbar.ToolbarComboBox(this._onFilterByTypeChanged.bind(this),ls`Filter coverage by type`);const options=[{label:ls`All`,value:'',},{label:ls`CSS`,value:CoverageType.CSS,},{label:ls`JavaScript`,value:CoverageType.JavaScript|CoverageType.JavaScriptPerFunction,},];for(const option of options){this._filterByTypeComboBox.addOption(this._filterByTypeComboBox.createOption(option.label,option.value));}
this._filterByTypeComboBox.setSelectedIndex(0);this._filterByTypeComboBox.setEnabled(false);toolbar.appendToolbarItem(this._filterByTypeComboBox);toolbar.appendSeparator();this._showContentScriptsSetting=Settings.Settings.instance().createSetting('showContentScripts',false);this._showContentScriptsSetting.addChangeListener(this._onFilterChanged,this);const contentScriptsCheckbox=new Toolbar.ToolbarSettingCheckbox(this._showContentScriptsSetting,UIString.UIString('Include extension content scripts'),UIString.UIString('Content scripts'));toolbar.appendToolbarItem(contentScriptsCheckbox);this._coverageResultsElement=this.contentElement.createChild('div','coverage-results');this._landingPage=this._buildLandingPage();this._listView=new CoverageListView(this._isVisible.bind(this,false));this._statusToolbarElement=this.contentElement.createChild('div','coverage-toolbar-summary');this._statusMessageElement=this._statusToolbarElement.createChild('div','coverage-message');this._landingPage.show(this._coverageResultsElement);}
_buildLandingPage(){const widget=new Widget.VBox();let message;if(this._startWithReloadButton){const reloadButton=UIUtils.createInlineButton(Toolbar.Toolbar.createActionButtonForId('coverage.start-with-reload'));message=UIUtils.formatLocalized('Click the reload button %s to reload and start capturing coverage.',[reloadButton]);}else{const recordButton=UIUtils.createInlineButton(Toolbar.Toolbar.createActionButton(this._toggleRecordAction));message=UIUtils.formatLocalized('Click the record button %s to start capturing coverage.',[recordButton]);}
message.classList.add('message');widget.contentElement.appendChild(message);widget.element.classList.add('landing-page');return widget;}
_clear(){if(this._model){this._model.reset();}
this._reset();}
_reset(){if(this._decorationManager){this._decorationManager.dispose();this._decorationManager=null;}
this._listView.reset();this._listView.detach();this._landingPage.show(this._coverageResultsElement);this._statusMessageElement.textContent='';this._filterInput.setEnabled(false);this._filterByTypeComboBox.setEnabled(false);this._saveButton.setEnabled(false);}
_toggleRecording(){const enable=!this._toggleRecordAction.toggled();if(enable){this._startRecording({reload:false,jsCoveragePerBlock:this.isBlockCoverageSelected()});}else{this.stopRecording();}}
isBlockCoverageSelected(){const coverageType=Number(this._coverageTypeComboBox.selectedOption().value);return coverageType===CoverageType.JavaScript;}
_selectCoverageType(jsCoveragePerBlock){const selectedIndex=jsCoveragePerBlock?1:0;this._coverageTypeComboBox.setSelectedIndex(selectedIndex);}
_onCoverageTypeComboBoxSelectionChanged(){this._coverageTypeComboBoxSetting.set(this._coverageTypeComboBox.selectedIndex());}
async ensureRecordingStarted(){const enabled=this._toggleRecordAction.toggled();if(enabled){await this.stopRecording();}
await this._startRecording({reload:false,jsCoveragePerBlock:false});}
async _startRecording(options){let hadFocus,reloadButtonFocused;if(this._startWithReloadButton&&this._startWithReloadButton.element.hasFocus()){reloadButtonFocused=true;}else if(this.hasFocus()){hadFocus=true;}
this._reset();const mainTarget=SDKModel.TargetManager.instance().mainTarget();if(!mainTarget){return;}
const{reload,jsCoveragePerBlock}={reload:false,jsCoveragePerBlock:false,...options};if(!this._model||reload){this._model=mainTarget.model(CoverageModel);}
userMetrics.actionTaken(UserMetrics.Action.CoverageStarted);if(jsCoveragePerBlock){userMetrics.actionTaken(UserMetrics.Action.CoverageStartedPerBlock);}
const success=await this._model.start(jsCoveragePerBlock);if(!success){return;}
this._selectCoverageType(jsCoveragePerBlock);this._model.addEventListener(Events.CoverageUpdated,this._onCoverageDataReceived,this);this._resourceTreeModel=(mainTarget.model(ResourceTreeModel.ResourceTreeModel));if(this._resourceTreeModel){this._resourceTreeModel.addEventListener(ResourceTreeModel.Events.MainFrameNavigated,this._onMainFrameNavigated,this);}
this._decorationManager=new CoverageDecorationManager((this._model));this._toggleRecordAction.setToggled(true);this._clearButton.setEnabled(false);if(this._startWithReloadButton){this._startWithReloadButton.setEnabled(false);this._startWithReloadButton.setVisible(false);this._toggleRecordButton.setEnabled(true);this._toggleRecordButton.setVisible(true);if(reloadButtonFocused){this._toggleRecordButton.element.focus();}}
this._coverageTypeComboBox.setEnabled(false);this._filterInput.setEnabled(true);this._filterByTypeComboBox.setEnabled(true);if(this._landingPage.isShowing()){this._landingPage.detach();}
this._listView.show(this._coverageResultsElement);if(hadFocus&&!reloadButtonFocused){this._listView.focus();}
if(reload&&this._resourceTreeModel){this._resourceTreeModel.reloadPage();}else{this._model.startPolling();}}
_onCoverageDataReceived(event){this._updateViews(event.data);}
async stopRecording(){if(this._resourceTreeModel){this._resourceTreeModel.removeEventListener(ResourceTreeModel.Events.MainFrameNavigated,this._onMainFrameNavigated,this);this._resourceTreeModel=null;}
if(this.hasFocus()){this._listView.focus();}
await this._model.stop();this._model.removeEventListener(Events.CoverageUpdated,this._onCoverageDataReceived,this);this._toggleRecordAction.setToggled(false);this._coverageTypeComboBox.setEnabled(true);if(this._startWithReloadButton){this._startWithReloadButton.setEnabled(true);this._startWithReloadButton.setVisible(true);this._toggleRecordButton.setEnabled(false);this._toggleRecordButton.setVisible(false);}
this._clearButton.setEnabled(true);}
processBacklog(){this._model.processJSBacklog();}
_onMainFrameNavigated(){this._model.reset();this._decorationManager.reset();this._listView.reset();this._model.startPolling();}
_updateViews(updatedEntries){this._updateStats();this._listView.update(this._model.entries());this._saveButton.setEnabled(this._model.entries().length>0);this._decorationManager.update(updatedEntries);}
_updateStats(){let total=0;let unused=0;for(const info of this._model.entries()){if(!this._isVisible(true,info)){continue;}
total+=info.size();unused+=info.unusedSize();}
const used=total-unused;const percentUsed=total?Math.round(100*used/total):0;this._statusMessageElement.textContent=ls`${Number.bytesToString(used)} of ${Number.bytesToString(total)} (${percentUsed}%) used so far.
        ${Number.bytesToString(unused)} unused.`;}
_onFilterChanged(){if(!this._listView){return;}
const text=this._filterInput.value();this._textFilterRegExp=text?createPlainTextSearchRegex(text,'i'):null;this._listView.updateFilterAndHighlight(this._textFilterRegExp);this._updateStats();}
_onFilterByTypeChanged(){if(!this._listView){return;}
userMetrics.actionTaken(UserMetrics.Action.CoverageReportFiltered);const type=this._filterByTypeComboBox.selectedOption().value;this._typeFilterValue=parseInt(type,10)||null;this._listView.updateFilterAndHighlight(this._textFilterRegExp);this._updateStats();}
_isVisible(ignoreTextFilter,coverageInfo){const url=coverageInfo.url();if(url.startsWith(CoverageView._extensionBindingsURLPrefix)){return false;}
if(coverageInfo.isContentScript()&&!this._showContentScriptsSetting.get()){return false;}
if(this._typeFilterValue&&!(coverageInfo.type()&this._typeFilterValue)){return false;}
return ignoreTextFilter||!this._textFilterRegExp||this._textFilterRegExp.test(url);}
async _exportReport(){const fos=new FileUtils.FileOutputStream();const fileName=`Coverage-${new Date().toISO8601Compact()}.json`;const accepted=await fos.open(fileName);if(!accepted){return;}
this._model.exportReport(fos);}
selectCoverageItemByUrl(url){this._listView.selectByUrl(url);}}
CoverageView._extensionBindingsURLPrefix='extensions::';class ActionDelegate{handleAction(context,actionId){const coverageViewId='coverage';ViewManager.ViewManager.instance().showView(coverageViewId,false,true).then(()=>ViewManager.ViewManager.instance().view(coverageViewId).widget()).then(widget=>this._innerHandleAction((widget),actionId));return true;}
_innerHandleAction(coverageView,actionId){switch(actionId){case'coverage.toggle-recording':coverageView._toggleRecording();break;case'coverage.start-with-reload':coverageView._startRecording({reload:true,jsCoveragePerBlock:coverageView.isBlockCoverageSelected()});break;default:console.assert(false,`Unknown action: ${actionId}`);}}}
class LineDecorator{constructor(){this._listeners=new WeakMap();}
decorate(uiSourceCode,textEditor){const decorations=uiSourceCode.decorationsForType(decoratorType);if(!decorations||!decorations.size){this._uninstallGutter(textEditor);return;}
const decorationManager=(decorations.values().next().value.data());decorationManager.usageByLine(uiSourceCode).then(lineUsage=>{textEditor.operation(()=>this._innerDecorate(uiSourceCode,textEditor,lineUsage));});}
_innerDecorate(uiSourceCode,textEditor,lineUsage){const gutterType=LineDecorator._gutterType;this._uninstallGutter(textEditor);if(lineUsage.length){this._installGutter(textEditor,uiSourceCode.url());}
for(let line=0;line<lineUsage.length;++line){if(typeof lineUsage[line]!=='boolean'){continue;}
const className=lineUsage[line]?'text-editor-coverage-used-marker':'text-editor-coverage-unused-marker';const gutterElement=createElementWithClass('div',className);textEditor.setGutterDecoration(line,gutterType,gutterElement);}}
makeGutterClickHandler(url){function handleGutterClick(event){const eventData=(event.data);if(eventData.gutterType!==LineDecorator._gutterType){return;}
const coverageViewId='coverage';ViewManager.ViewManager.instance().showView(coverageViewId).then(()=>ViewManager.ViewManager.instance().view(coverageViewId).widget()).then(widget=>{const matchFormattedSuffix=url.match(/(.*):formatted$/);const urlWithoutFormattedSuffix=(matchFormattedSuffix&&matchFormattedSuffix[1])||url;widget.selectCoverageItemByUrl(urlWithoutFormattedSuffix);});}
return handleGutterClick;}
_installGutter(textEditor,url){let listener=this._listeners.get(textEditor);if(!listener){listener=this.makeGutterClickHandler(url);this._listeners.set(textEditor,listener);}
textEditor.installGutter(LineDecorator._gutterType,false);textEditor.addEventListener(SourcesTextEditor.Events.GutterClick,listener,this);}
_uninstallGutter(textEditor){textEditor.uninstallGutter(LineDecorator._gutterType);const listener=this._listeners.get(textEditor);if(listener){textEditor.removeEventListener(SourcesTextEditor.Events.GutterClick,listener,this);this._listeners.delete(textEditor);}}}
LineDecorator._gutterType='CodeMirror-gutter-coverage';var CoverageView$1=Object.freeze({__proto__:null,CoverageView:CoverageView,ActionDelegate:ActionDelegate,LineDecorator:LineDecorator});export{CoverageDecorationManager$1 as CoverageDecorationManager,CoverageListView$1 as CoverageListView,CoverageModel$1 as CoverageModel,CoverageView$1 as CoverageView};