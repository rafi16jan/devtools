import{Revealer,UIString,Settings,Progress}from'../common/common.js';import'../workspace/workspace.js';import{Linkifier}from'../components/components.js';import{TextRange}from'../text_utils/text_utils.js';import{Widget,TreeOutline,ARIAUtils,UIUtils,HistoryInput,Toolbar,ProgressIndicator,EmptyWidget,KeyboardShortcut}from'../ui/ui.js';class SearchConfig{constructor(query,ignoreCase,isRegex){this._query=query;this._ignoreCase=ignoreCase;this._isRegex=isRegex;this._parse();}
static fromPlainObject(object){return new SearchConfig(object.query,object.ignoreCase,object.isRegex);}
query(){return this._query;}
ignoreCase(){return this._ignoreCase;}
isRegex(){return this._isRegex;}
toPlainObject(){return{query:this.query(),ignoreCase:this.ignoreCase(),isRegex:this.isRegex()};}
_parse(){const quotedPattern=/"([^\\"]|\\.)+"/;const unquotedWordPattern=/(\s*(?!-?f(ile)?:)[^\\ ]|\\.)+/;const unquotedPattern=unquotedWordPattern.source+'(\\s+'+unquotedWordPattern.source+')*';const pattern=['(\\s*'+FilePatternRegex.source+'\\s*)','('+quotedPattern.source+')','('+unquotedPattern+')',].join('|');const regexp=new RegExp(pattern,'g');const queryParts=this._query.match(regexp)||[];this._fileQueries=[];this._queries=[];for(let i=0;i<queryParts.length;++i){const queryPart=queryParts[i];if(!queryPart){continue;}
const fileQuery=this._parseFileQuery(queryPart);if(fileQuery){this._fileQueries.push(fileQuery);this._fileRegexQueries=this._fileRegexQueries||[];this._fileRegexQueries.push({regex:new RegExp(fileQuery.text,this.ignoreCase?'i':''),isNegative:fileQuery.isNegative});continue;}
if(this._isRegex){this._queries.push(queryPart);continue;}
if(queryPart.startsWith('"')){if(!queryPart.endsWith('"')){continue;}
this._queries.push(this._parseQuotedQuery(queryPart));continue;}
this._queries.push(this._parseUnquotedQuery(queryPart));}}
filePathMatchesFileQuery(filePath){if(!this._fileRegexQueries){return true;}
for(let i=0;i<this._fileRegexQueries.length;++i){if(!!filePath.match(this._fileRegexQueries[i].regex)===this._fileRegexQueries[i].isNegative){return false;}}
return true;}
queries(){return this._queries;}
_parseUnquotedQuery(query){return query.replace(/\\(.)/g,'$1');}
_parseQuotedQuery(query){return query.substring(1,query.length-1).replace(/\\(.)/g,'$1');}
_parseFileQuery(query){const match=query.match(FilePatternRegex);if(!match){return null;}
const isNegative=!!match[1];query=match[3];let result='';for(let i=0;i<query.length;++i){const char=query[i];if(char==='*'){result+='.*';}else if(char==='\\'){++i;const nextChar=query[i];if(nextChar===' '){result+=' ';}}else{if(String.regexSpecialCharacters().indexOf(query.charAt(i))!==-1){result+='\\';}
result+=query.charAt(i);}}
return new QueryTerm(result,isNegative);}}
const FilePatternRegex=/(-)?f(ile)?:((?:[^\\ ]|\\.)+)/;class QueryTerm{constructor(text,isNegative){this.text=text;this.isNegative=isNegative;}}
class SearchResult{label(){}
description(){}
matchesCount(){}
matchLabel(index){}
matchLineContent(index){}
matchRevealable(index){}}
class SearchScope{performSearch(searchConfig,progress,searchResultCallback,searchFinishedCallback){}
performIndexing(progress){}
stopSearch(){}}
let RegexQuery;var SearchConfig$1=Object.freeze({__proto__:null,SearchConfig:SearchConfig,FilePatternRegex:FilePatternRegex,QueryTerm:QueryTerm,SearchResult:SearchResult,SearchScope:SearchScope,RegexQuery:RegexQuery});class SearchResultsPane extends Widget.VBox{constructor(searchConfig){super(true);this._searchConfig=searchConfig;this._searchResults=[];this._treeOutline=new TreeOutline.TreeOutlineInShadow();this._treeOutline.hideOverflow();this._treeOutline.registerRequiredCSS('search/searchResultsPane.css');this.contentElement.appendChild(this._treeOutline.element);this._matchesExpandedCount=0;}
addSearchResult(searchResult){this._searchResults.push(searchResult);this._addTreeElement(searchResult);}
_addTreeElement(searchResult){const treeElement=new SearchResultsTreeElement(this._searchConfig,searchResult);this._treeOutline.appendChild(treeElement);if(!this._treeOutline.selectedTreeElement){treeElement.select(true,true);}
if(this._matchesExpandedCount<matchesExpandedByDefault){treeElement.expand();}
this._matchesExpandedCount+=searchResult.matchesCount();}}
const matchesExpandedByDefault=20;const matchesShownAtOnce=20;class SearchResultsTreeElement extends TreeOutline.TreeElement{constructor(searchConfig,searchResult){super('',true);this._searchConfig=searchConfig;this._searchResult=searchResult;this._initialized=false;this.toggleOnClick=true;}
onexpand(){if(this._initialized){return;}
this._updateMatchesUI();this._initialized=true;}
_updateMatchesUI(){this.removeChildren();const toIndex=Math.min(this._searchResult.matchesCount(),matchesShownAtOnce);if(toIndex<this._searchResult.matchesCount()){this._appendSearchMatches(0,toIndex-1);this._appendShowMoreMatchesElement(toIndex-1);}else{this._appendSearchMatches(0,toIndex);}}
onattach(){this._updateSearchMatches();}
_updateSearchMatches(){this.listItemElement.classList.add('search-result');const fileNameSpan=span(this._searchResult.label(),'search-result-file-name');fileNameSpan.appendChild(span('\u2014','search-result-dash'));fileNameSpan.appendChild(span(this._searchResult.description(),'search-result-qualifier'));this.tooltip=this._searchResult.description();this.listItemElement.appendChild(fileNameSpan);const matchesCountSpan=createElement('span');matchesCountSpan.className='search-result-matches-count';matchesCountSpan.textContent=`${this._searchResult.matchesCount()}`;ARIAUtils.setAccessibleName(matchesCountSpan,ls`Matches Count ${this._searchResult.matchesCount()}`);this.listItemElement.appendChild(matchesCountSpan);if(this.expanded){this._updateMatchesUI();}
function span(text,className){const span=createElement('span');span.className=className;span.textContent=text;return span;}}
_appendSearchMatches(fromIndex,toIndex){const searchResult=this._searchResult;const queries=this._searchConfig.queries();const regexes=[];for(let i=0;i<queries.length;++i){regexes.push(createSearchRegex(queries[i],!this._searchConfig.ignoreCase(),this._searchConfig.isRegex()));}
for(let i=fromIndex;i<toIndex;++i){const lineContent=searchResult.matchLineContent(i).trim();let matchRanges=[];for(let j=0;j<regexes.length;++j){matchRanges=matchRanges.concat(this._regexMatchRanges(lineContent,regexes[j]));}
const anchor=Linkifier.Linkifier.linkifyRevealable(searchResult.matchRevealable(i),'');anchor.classList.add('search-match-link');const labelSpan=createElement('span');labelSpan.classList.add('search-match-line-number');const resultLabel=searchResult.matchLabel(i);labelSpan.textContent=resultLabel;if(typeof resultLabel==='number'&&!isNaN(resultLabel)){ARIAUtils.setAccessibleName(labelSpan,ls`Line ${resultLabel}`);}else{ARIAUtils.setAccessibleName(labelSpan,ls`${resultLabel}`);}
anchor.appendChild(labelSpan);const contentSpan=this._createContentSpan(lineContent,matchRanges);anchor.appendChild(contentSpan);const searchMatchElement=new TreeOutline.TreeElement();this.appendChild(searchMatchElement);searchMatchElement.listItemElement.className='search-match';searchMatchElement.listItemElement.appendChild(anchor);searchMatchElement.listItemElement.addEventListener('keydown',event=>{if(isEnterKey(event)){event.consume(true);Revealer.reveal(searchResult.matchRevealable(i));}});searchMatchElement.tooltip=lineContent;}}
_appendShowMoreMatchesElement(startMatchIndex){const matchesLeftCount=this._searchResult.matchesCount()-startMatchIndex;const showMoreMatchesText=UIString.UIString('Show %d more',matchesLeftCount);const showMoreMatchesTreeElement=new TreeOutline.TreeElement(showMoreMatchesText);this.appendChild(showMoreMatchesTreeElement);showMoreMatchesTreeElement.listItemElement.classList.add('show-more-matches');showMoreMatchesTreeElement.onselect=this._showMoreMatchesElementSelected.bind(this,showMoreMatchesTreeElement,startMatchIndex);}
_createContentSpan(lineContent,matchRanges){let trimBy=0;if(matchRanges.length>0&&matchRanges[0].offset>20){trimBy=15;}
lineContent=lineContent.substring(trimBy,1000+trimBy);if(trimBy){matchRanges=matchRanges.map(range=>new TextRange.SourceRange(range.offset-trimBy+1,range.length));lineContent='…'+lineContent;}
const contentSpan=createElement('span');contentSpan.className='search-match-content';contentSpan.textContent=lineContent;ARIAUtils.setAccessibleName(contentSpan,`${lineContent} line`);UIUtils.highlightRangesWithStyleClass(contentSpan,matchRanges,'highlighted-match');return contentSpan;}
_regexMatchRanges(lineContent,regex){regex.lastIndex=0;let match;const matchRanges=[];while((regex.lastIndex<lineContent.length)&&(match=regex.exec(lineContent))){matchRanges.push(new TextRange.SourceRange(match.index,match[0].length));}
return matchRanges;}
_showMoreMatchesElementSelected(showMoreMatchesTreeElement,startMatchIndex){this.removeChild(showMoreMatchesTreeElement);this._appendSearchMatches(startMatchIndex,this._searchResult.matchesCount());return false;}}
var SearchResultsPane$1=Object.freeze({__proto__:null,SearchResultsPane:SearchResultsPane,matchesExpandedByDefault:matchesExpandedByDefault,matchesShownAtOnce:matchesShownAtOnce,SearchResultsTreeElement:SearchResultsTreeElement});class SearchView extends Widget.VBox{constructor(settingKey){super(true);this.setMinimumSize(0,40);this.registerRequiredCSS('search/searchView.css');this._focusOnShow=false;this._isIndexing=false;this._searchId=1;this._searchMatchesCount=0;this._searchResultsCount=0;this._nonEmptySearchResultsCount=0;this._searchingView=null;this._notFoundView=null;this._searchConfig=null;this._pendingSearchConfig=null;this._searchResultsPane=null;this._progressIndicator=null;this._visiblePane=null;this.contentElement.classList.add('search-view');this._searchPanelElement=this.contentElement.createChild('div','search-drawer-header');this._searchPanelElement.addEventListener('keydown',this._onKeyDown.bind(this),false);this._searchResultsElement=this.contentElement.createChild('div');this._searchResultsElement.className='search-results';const searchContainer=createElement('div');searchContainer.style.flex='auto';searchContainer.style.justifyContent='start';searchContainer.style.maxWidth='300px';this._search=HistoryInput.HistoryInput.create();searchContainer.appendChild(this._search);this._search.placeholder=UIString.UIString('Search');this._search.setAttribute('type','text');this._search.setAttribute('results','0');this._search.setAttribute('size',42);ARIAUtils.setAccessibleName(this._search,ls`Search Query`);const searchItem=new Toolbar.ToolbarItem(searchContainer);const toolbar=new Toolbar.Toolbar('search-toolbar',this._searchPanelElement);this._matchCaseButton=SearchView._appendToolbarToggle(toolbar,'Aa',UIString.UIString('Match Case'));this._regexButton=SearchView._appendToolbarToggle(toolbar,'.*',UIString.UIString('Use Regular Expression'));toolbar.appendToolbarItem(searchItem);const refreshButton=new Toolbar.ToolbarButton(UIString.UIString('Refresh'),'largeicon-refresh');const clearButton=new Toolbar.ToolbarButton(UIString.UIString('Clear'),'largeicon-clear');toolbar.appendToolbarItem(refreshButton);toolbar.appendToolbarItem(clearButton);refreshButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onAction.bind(this));clearButton.addEventListener(Toolbar.ToolbarButton.Events.Click,()=>{this._resetSearch();this._onSearchInputClear();});const searchStatusBarElement=this.contentElement.createChild('div','search-toolbar-summary');this._searchMessageElement=searchStatusBarElement.createChild('div','search-message');this._searchProgressPlaceholderElement=searchStatusBarElement.createChild('div','flex-centered');this._searchResultsMessageElement=searchStatusBarElement.createChild('div','search-message');this._advancedSearchConfig=Settings.Settings.instance().createLocalSetting(settingKey+'SearchConfig',new SearchConfig('',true,false).toPlainObject());this._load();this._searchScope=null;}
static _appendToolbarToggle(toolbar,text,tooltip){const toggle=new Toolbar.ToolbarToggle(tooltip);toggle.setText(text);toggle.addEventListener(Toolbar.ToolbarButton.Events.Click,()=>toggle.setToggled(!toggle.toggled()));toolbar.appendToolbarItem(toggle);return toggle;}
_buildSearchConfig(){return new SearchConfig(this._search.value,!this._matchCaseButton.toggled(),this._regexButton.toggled());}
async toggle(queryCandidate,searchImmediately){if(queryCandidate){this._search.value=queryCandidate;}
if(this.isShowing()){this.focus();}else{this._focusOnShow=true;}
this._initScope();if(searchImmediately){this._onAction();}else{this._startIndexing();}}
createScope(){throw new Error('Not implemented');}
_initScope(){this._searchScope=this.createScope();}
wasShown(){if(this._focusOnShow){this.focus();this._focusOnShow=false;}}
_onIndexingFinished(){const finished=!this._progressIndicator.isCanceled();this._progressIndicator.done();this._progressIndicator=null;this._isIndexing=false;this._indexingFinished(finished);if(!finished){this._pendingSearchConfig=null;}
if(!this._pendingSearchConfig){return;}
const searchConfig=this._pendingSearchConfig;this._pendingSearchConfig=null;this._innerStartSearch(searchConfig);}
_startIndexing(){this._isIndexing=true;if(this._progressIndicator){this._progressIndicator.done();}
this._progressIndicator=new ProgressIndicator.ProgressIndicator();this._searchMessageElement.textContent=UIString.UIString('Indexing…');this._progressIndicator.show(this._searchProgressPlaceholderElement);this._searchScope.performIndexing(new Progress.ProgressProxy(this._progressIndicator,this._onIndexingFinished.bind(this)));}
_onSearchInputClear(){this._search.value='';this.focus();}
_onSearchResult(searchId,searchResult){if(searchId!==this._searchId||!this._progressIndicator){return;}
if(this._progressIndicator&&this._progressIndicator.isCanceled()){this._onIndexingFinished();return;}
this._addSearchResult(searchResult);if(!searchResult.matchesCount()){return;}
if(!this._searchResultsPane){this._searchResultsPane=new SearchResultsPane((this._searchConfig));this._showPane(this._searchResultsPane);}
this._searchResultsPane.addSearchResult(searchResult);}
_onSearchFinished(searchId,finished){if(searchId!==this._searchId||!this._progressIndicator){return;}
if(!this._searchResultsPane){this._nothingFound();}
this._searchFinished(finished);this._searchConfig=null;ARIAUtils.alert(this._searchMessageElement.textContent+' '+this._searchResultsMessageElement.textContent,this._searchMessageElement);}
async _startSearch(searchConfig){this._resetSearch();++this._searchId;this._initScope();if(!this._isIndexing){this._startIndexing();}
this._pendingSearchConfig=searchConfig;}
_innerStartSearch(searchConfig){this._searchConfig=searchConfig;if(this._progressIndicator){this._progressIndicator.done();}
this._progressIndicator=new ProgressIndicator.ProgressIndicator();this._searchStarted(this._progressIndicator);this._searchScope.performSearch(searchConfig,this._progressIndicator,this._onSearchResult.bind(this,this._searchId),this._onSearchFinished.bind(this,this._searchId));}
_resetSearch(){this._stopSearch();this._showPane(null);this._searchResultsPane=null;}
_stopSearch(){if(this._progressIndicator&&!this._isIndexing){this._progressIndicator.cancel();}
if(this._searchScope){this._searchScope.stopSearch();}
this._searchConfig=null;}
_searchStarted(progressIndicator){this._resetCounters();if(!this._searchingView){this._searchingView=new EmptyWidget.EmptyWidget(UIString.UIString('Searching…'));}
this._showPane(this._searchingView);this._searchMessageElement.textContent=UIString.UIString('Searching…');progressIndicator.show(this._searchProgressPlaceholderElement);this._updateSearchResultsMessage();}
_indexingFinished(finished){this._searchMessageElement.textContent=finished?'':UIString.UIString('Indexing interrupted.');}
_updateSearchResultsMessage(){if(this._searchMatchesCount&&this._searchResultsCount){if(this._searchMatchesCount===1&&this._nonEmptySearchResultsCount===1){this._searchResultsMessageElement.textContent=UIString.UIString('Found 1 matching line in 1 file.');}else if(this._searchMatchesCount>1&&this._nonEmptySearchResultsCount===1){this._searchResultsMessageElement.textContent=UIString.UIString('Found %d matching lines in 1 file.',this._searchMatchesCount);}else{this._searchResultsMessageElement.textContent=UIString.UIString('Found %d matching lines in %d files.',this._searchMatchesCount,this._nonEmptySearchResultsCount);}}else{this._searchResultsMessageElement.textContent='';}}
_showPane(panel){if(this._visiblePane){this._visiblePane.detach();}
if(panel){panel.show(this._searchResultsElement);}
this._visiblePane=panel;}
_resetCounters(){this._searchMatchesCount=0;this._searchResultsCount=0;this._nonEmptySearchResultsCount=0;}
_nothingFound(){if(!this._notFoundView){this._notFoundView=new EmptyWidget.EmptyWidget(UIString.UIString('No matches found.'));}
this._showPane(this._notFoundView);this._searchResultsMessageElement.textContent=UIString.UIString('No matches found.');}
_addSearchResult(searchResult){const matchesCount=searchResult.matchesCount();this._searchMatchesCount+=matchesCount;this._searchResultsCount++;if(matchesCount){this._nonEmptySearchResultsCount++;}
this._updateSearchResultsMessage();}
_searchFinished(finished){this._searchMessageElement.textContent=finished?UIString.UIString('Search finished.'):UIString.UIString('Search interrupted.');}
focus(){this._search.focus();this._search.select();}
willHide(){this._stopSearch();}
_onKeyDown(event){switch(event.keyCode){case KeyboardShortcut.Keys.Enter.code:this._onAction();break;}}
_save(){this._advancedSearchConfig.set(this._buildSearchConfig().toPlainObject());}
_load(){const searchConfig=SearchConfig.fromPlainObject(this._advancedSearchConfig.get());this._search.value=searchConfig.query();this._matchCaseButton.setToggled(!searchConfig.ignoreCase());this._regexButton.setToggled(searchConfig.isRegex());}
_onAction(){ARIAUtils.alert(' ',this._searchMessageElement);const searchConfig=this._buildSearchConfig();if(!searchConfig.query()||!searchConfig.query().length){return;}
this._save();this._startSearch(searchConfig);}}
var SearchView$1=Object.freeze({__proto__:null,SearchView:SearchView});export{SearchConfig$1 as SearchConfig,SearchResultsPane$1 as SearchResultsPane,SearchView$1 as SearchView};