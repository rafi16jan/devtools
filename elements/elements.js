import{ObjectWrapper,EventTarget,UIString,Throttler,Color,Settings,Revealer,Linkifier as Linkifier$2,ParsedURL,Console}from'../common/common.js';import{DOMModel,ResourceTreeModel,CSSModel,CSSMetadata,CSSMatchedStyles,OverlayModel,CSSRule,CSSStyleDeclaration,CSSMedia,ConsoleModel,RuntimeModel,SDKModel,RemoteObject}from'../sdk/sdk.js';import{ThrottledWidget,TreeOutline,Geometry,Fragment,Icon,ARIAUtils,UIUtils,KeyboardShortcut,ContextMenu,TextPrompt,Utils,Widget,Toolbar,InplaceEditor,PopoverHelper,TextEditor,Tooltip,XLink,SyntaxHighlighter,Panel,SplitWidget,SearchableView,ViewManager,View,TabbedPane}from'../ui/ui.js';import{Linkifier as Linkifier$1,ImagePreview,JSPresentationUtils}from'../components/components.js';import{ExtensionServer}from'../extensions/extensions.js';import{userMetrics,UserMetrics,Platform,InspectorFrontendHost}from'../host/host.js';import{ColorSwatch,CSSShadowModel,BezierEditor,CSSShadowEditor,SwatchPopoverHelper}from'../inline_editor/inline_editor.js';import{CSSWorkspaceBinding,ResourceUtils}from'../bindings/bindings.js';import{TextUtils,TextRange}from'../text_utils/text_utils.js';import{ContrastInfo,Spectrum}from'../color_picker/color_picker.js';import{StringUtilities}from'../platform/platform.js';import'../protocol_client/protocol_client.js';import{EventListenersView}from'../event_listeners/event_listeners.js';import{ObjectPropertiesSection}from'../object_ui/object_ui.js';class ComputedStyleModel extends ObjectWrapper.ObjectWrapper{constructor(){super();this._node=self.UI.context.flavor(DOMModel.DOMNode);this._cssModel=null;this._eventListeners=[];self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this._onNodeChanged,this);}
node(){return this._node;}
cssModel(){return this._cssModel&&this._cssModel.isEnabled()?this._cssModel:null;}
_onNodeChanged(event){this._node=(event.data);this._updateModel(this._node?this._node.domModel().cssModel():null);this._onComputedStyleChanged(null);}
_updateModel(cssModel){if(this._cssModel===cssModel){return;}
EventTarget.EventTarget.removeEventListeners(this._eventListeners);this._cssModel=cssModel;const domModel=cssModel?cssModel.domModel():null;const resourceTreeModel=cssModel?cssModel.target().model(ResourceTreeModel.ResourceTreeModel):null;if(cssModel&&domModel&&resourceTreeModel){this._eventListeners=[cssModel.addEventListener(CSSModel.Events.StyleSheetAdded,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.StyleSheetRemoved,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.StyleSheetChanged,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.FontsUpdated,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.MediaQueryResultChanged,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.PseudoStateForced,this._onComputedStyleChanged,this),cssModel.addEventListener(CSSModel.Events.ModelWasEnabled,this._onComputedStyleChanged,this),domModel.addEventListener(DOMModel.Events.DOMMutated,this._onDOMModelChanged,this),resourceTreeModel.addEventListener(ResourceTreeModel.Events.FrameResized,this._onFrameResized,this),];}}
_onComputedStyleChanged(event){delete this._computedStylePromise;this.dispatchEventToListeners(Events.ComputedStyleChanged,event?event.data:null);}
_onDOMModelChanged(event){const node=(event.data);if(!this._node||this._node!==node&&node.parentNode!==this._node.parentNode&&!node.isAncestor(this._node)){return;}
this._onComputedStyleChanged(null);}
_onFrameResized(event){function refreshContents(){this._onComputedStyleChanged(null);delete this._frameResizedTimer;}
if(this._frameResizedTimer){clearTimeout(this._frameResizedTimer);}
this._frameResizedTimer=setTimeout(refreshContents.bind(this),100);}
_elementNode(){return this.node()?this.node().enclosingElementOrSelf():null;}
fetchComputedStyle(){const elementNode=this._elementNode();const cssModel=this.cssModel();if(!elementNode||!cssModel){return Promise.resolve((null));}
if(!this._computedStylePromise){this._computedStylePromise=cssModel.computedStylePromise(elementNode.id).then(verifyOutdated.bind(this,elementNode));}
return this._computedStylePromise;function verifyOutdated(elementNode,style){return elementNode===this._elementNode()&&style?new ComputedStyle(elementNode,style):(null);}}}
const Events={ComputedStyleChanged:Symbol('ComputedStyleChanged')};class ComputedStyle{constructor(node,computedStyle){this.node=node;this.computedStyle=computedStyle;}}
var ComputedStyleModel$1=Object.freeze({__proto__:null,ComputedStyleModel:ComputedStyleModel,Events:Events,ComputedStyle:ComputedStyle});class PlatformFontsWidget extends ThrottledWidget.ThrottledWidget{constructor(sharedModel){super(true);this.registerRequiredCSS('elements/platformFontsWidget.css');this._sharedModel=sharedModel;this._sharedModel.addEventListener(Events.ComputedStyleChanged,this.update,this);this._sectionTitle=createElementWithClass('div','title');this.contentElement.classList.add('platform-fonts');this.contentElement.appendChild(this._sectionTitle);this._sectionTitle.textContent=UIString.UIString('Rendered Fonts');this._fontStatsSection=this.contentElement.createChild('div','stats-section');}
doUpdate(){const cssModel=this._sharedModel.cssModel();const node=this._sharedModel.node();if(!node||!cssModel){return Promise.resolve();}
return cssModel.platformFontsPromise(node.id).then(this._refreshUI.bind(this,node));}
_refreshUI(node,platformFonts){if(this._sharedModel.node()!==node){return;}
this._fontStatsSection.removeChildren();const isEmptySection=!platformFonts||!platformFonts.length;this._sectionTitle.classList.toggle('hidden',isEmptySection);if(isEmptySection){return;}
platformFonts.sort(function(a,b){return b.glyphCount-a.glyphCount;});for(let i=0;i<platformFonts.length;++i){const fontStatElement=this._fontStatsSection.createChild('div','font-stats-item');const fontNameElement=fontStatElement.createChild('span','font-name');fontNameElement.textContent=platformFonts[i].familyName;const fontDelimeterElement=fontStatElement.createChild('span','font-delimeter');fontDelimeterElement.textContent='\u2014';const fontOrigin=fontStatElement.createChild('span');fontOrigin.textContent=platformFonts[i].isCustomFont?UIString.UIString('Network resource'):UIString.UIString('Local file');const fontUsageElement=fontStatElement.createChild('span','font-usage');const usage=platformFonts[i].glyphCount;fontUsageElement.textContent=usage===1?UIString.UIString('(%d glyph)',usage):UIString.UIString('(%d glyphs)',usage);}}}
var PlatformFontsWidget$1=Object.freeze({__proto__:null,PlatformFontsWidget:PlatformFontsWidget});class StylePropertyTreeElement extends TreeOutline.TreeElement{constructor(stylesPane,matchedStyles,property,isShorthand,inherited,overloaded,newProperty){super('',isShorthand);this._style=property.ownerStyle;this._matchedStyles=matchedStyles;this.property=property;this._inherited=inherited;this._overloaded=overloaded;this.selectable=false;this._parentPane=stylesPane;this.isShorthand=isShorthand;this._applyStyleThrottler=new Throttler.Throttler(0);this._newProperty=newProperty;if(this._newProperty){this.listItemElement.textContent='';}
this._expandedDueToFilter=false;this.valueElement=null;this.nameElement=null;this._expandElement=null;this._originalPropertyText='';this._hasBeenEditedIncrementally=false;this._prompt=null;this._lastComputedValue=null;this._contextForTest;}
matchedStyles(){return this._matchedStyles;}
_editable(){return!!(this._style.styleSheetId&&this._style.range);}
inherited(){return this._inherited;}
overloaded(){return this._overloaded;}
setOverloaded(x){if(x===this._overloaded){return;}
this._overloaded=x;this._updateState();}
get name(){return this.property.name;}
get value(){return this.property.value;}
_updateFilter(){const regex=this._parentPane.filterRegex();const matches=!!regex&&(regex.test(this.property.name)||regex.test(this.property.value));this.listItemElement.classList.toggle('filter-match',matches);this.onpopulate();let hasMatchingChildren=false;for(let i=0;i<this.childCount();++i){hasMatchingChildren|=this.childAt(i)._updateFilter();}
if(!regex){if(this._expandedDueToFilter){this.collapse();}
this._expandedDueToFilter=false;}else if(hasMatchingChildren&&!this.expanded){this.expand();this._expandedDueToFilter=true;}else if(!hasMatchingChildren&&this.expanded&&this._expandedDueToFilter){this.collapse();this._expandedDueToFilter=false;}
return matches;}
_processColor(text){const color=Color.Color.parse(text);if(!color){return createTextNode(text);}
if(!this._editable()){const swatch=ColorSwatch.ColorSwatch.create();swatch.setColor(color);return swatch;}
const swatch=ColorSwatch.ColorSwatch.create();swatch.setColor(color);swatch.setFormat(Settings.detectColorFormat(swatch.color()));this._addColorContrastInfo(swatch);return swatch;}
_processVar(text){const computedValue=this._matchedStyles.computeValue(this._style,text);if(!computedValue){return createTextNode(text);}
const color=Color.Color.parse(computedValue);if(!color){const node=createElement('span');node.textContent=text;node.title=computedValue;return node;}
if(!this._editable()){const swatch=ColorSwatch.ColorSwatch.create();swatch.setText(text,computedValue);swatch.setColor(color);return swatch;}
const swatch=ColorSwatch.ColorSwatch.create();swatch.setColor(color);swatch.setFormat(Settings.detectColorFormat(swatch.color()));swatch.setText(text,computedValue);this._addColorContrastInfo(swatch);return swatch;}
async _addColorContrastInfo(swatch){const swatchPopoverHelper=this._parentPane.swatchPopoverHelper();const swatchIcon=new ColorSwatchPopoverIcon(this,swatchPopoverHelper,swatch);if(this.property.name!=='color'||!this._parentPane.cssModel()||!this.node()){return;}
const cssModel=this._parentPane.cssModel();const contrastInfo=new ContrastInfo.ContrastInfo(await cssModel.backgroundColorsPromise(this.node().id));swatchIcon.setContrastInfo(contrastInfo);}
renderedPropertyText(){return this.nameElement.textContent+': '+this.valueElement.textContent;}
_processBezier(text){if(!this._editable()||!Geometry.CubicBezier.parse(text)){return createTextNode(text);}
const swatchPopoverHelper=this._parentPane.swatchPopoverHelper();const swatch=ColorSwatch.BezierSwatch.create();swatch.setBezierText(text);new BezierPopoverIcon(this,swatchPopoverHelper,swatch);return swatch;}
_processShadow(propertyValue,propertyName){if(!this._editable()){return createTextNode(propertyValue);}
let shadows;if(propertyName==='text-shadow'){shadows=CSSShadowModel.CSSShadowModel.parseTextShadow(propertyValue);}else{shadows=CSSShadowModel.CSSShadowModel.parseBoxShadow(propertyValue);}
if(!shadows.length){return createTextNode(propertyValue);}
const container=createDocumentFragment();const swatchPopoverHelper=this._parentPane.swatchPopoverHelper();for(let i=0;i<shadows.length;i++){if(i!==0){container.appendChild(createTextNode(', '));}
const cssShadowSwatch=ColorSwatch.CSSShadowSwatch.create();cssShadowSwatch.setCSSShadow(shadows[i]);new ShadowSwatchPopoverHelper(this,swatchPopoverHelper,cssShadowSwatch);const colorSwatch=cssShadowSwatch.colorSwatch();if(colorSwatch){new ColorSwatchPopoverIcon(this,swatchPopoverHelper,colorSwatch);}
container.appendChild(cssShadowSwatch);}
return container;}
_processGrid(propertyValue,propertyName){const splitResult=TextUtils.Utils.splitStringByRegexes(propertyValue,[CSSMetadata.GridAreaRowRegex]);if(splitResult.length<=1){return createTextNode(propertyValue);}
const indent=Settings.Settings.instance().moduleSetting('textEditorIndent').get();const container=createDocumentFragment();for(const result of splitResult){const value=result.value.trim();const content=Fragment.html`<br /><span class='styles-clipboard-only'>${indent.repeat(2)}</span>${value}`;container.appendChild(content);}
return container;}
_updateState(){if(!this.listItemElement){return;}
if(this._style.isPropertyImplicit(this.name)){this.listItemElement.classList.add('implicit');}else{this.listItemElement.classList.remove('implicit');}
const hasIgnorableError=!this.property.parsedOk&&StylesSidebarPane.ignoreErrorsForProperty(this.property);if(hasIgnorableError){this.listItemElement.classList.add('has-ignorable-error');}else{this.listItemElement.classList.remove('has-ignorable-error');}
if(this.inherited()){this.listItemElement.classList.add('inherited');}else{this.listItemElement.classList.remove('inherited');}
if(this.overloaded()){this.listItemElement.classList.add('overloaded');}else{this.listItemElement.classList.remove('overloaded');}
if(this.property.disabled){this.listItemElement.classList.add('disabled');}else{this.listItemElement.classList.remove('disabled');}}
node(){return this._parentPane.node();}
parentPane(){return this._parentPane;}
section(){return this.treeOutline&&this.treeOutline.section;}
_updatePane(){const section=this.section();if(section){section.refreshUpdate(this);}}
async _toggleDisabled(disabled){const oldStyleRange=this._style.range;if(!oldStyleRange){return;}
this._parentPane.setUserOperation(true);const success=await this.property.setDisabled(disabled);this._parentPane.setUserOperation(false);if(!success){return;}
this._matchedStyles.resetActiveProperties();this._updatePane();this.styleTextAppliedForTest();}
async onpopulate(){if(this.childCount()||!this.isShorthand){return;}
const longhandProperties=this._style.longhandProperties(this.name);for(let i=0;i<longhandProperties.length;++i){const name=longhandProperties[i].name;let inherited=false;let overloaded=false;const section=this.section();if(section){inherited=section.isPropertyInherited(name);overloaded=this._matchedStyles.propertyState(longhandProperties[i])===CSSMatchedStyles.PropertyState.Overloaded;}
const item=new StylePropertyTreeElement(this._parentPane,this._matchedStyles,longhandProperties[i],false,inherited,overloaded,false);this.appendChild(item);}}
onattach(){this.updateTitle();this.listItemElement.addEventListener('mousedown',event=>{if(event.which===1){this._parentPane[ActiveSymbol]=this;}},false);this.listItemElement.addEventListener('mouseup',this._mouseUp.bind(this));this.listItemElement.addEventListener('click',event=>{if(!event.target.hasSelection()&&event.target!==this.listItemElement){event.consume(true);}});}
onexpand(){this._updateExpandElement();}
oncollapse(){this._updateExpandElement();}
_updateExpandElement(){if(!this._expandElement){return;}
if(this.expanded){this._expandElement.setIconType('smallicon-triangle-down');}else{this._expandElement.setIconType('smallicon-triangle-right');}}
updateTitleIfComputedValueChanged(){const computedValue=this._matchedStyles.computeValue(this.property.ownerStyle,this.property.value);if(computedValue===this._lastComputedValue){return;}
this._lastComputedValue=computedValue;this._innerUpdateTitle();}
updateTitle(){this._lastComputedValue=this._matchedStyles.computeValue(this.property.ownerStyle,this.property.value);this._innerUpdateTitle();}
_innerUpdateTitle(){this._updateState();if(this.isExpandable()){this._expandElement=Icon.Icon.create('smallicon-triangle-right','expand-icon');}else{this._expandElement=null;}
const propertyRenderer=new StylesSidebarPropertyRenderer(this._style.parentRule,this.node(),this.name,this.value);if(this.property.parsedOk){propertyRenderer.setVarHandler(this._processVar.bind(this));propertyRenderer.setColorHandler(this._processColor.bind(this));propertyRenderer.setBezierHandler(this._processBezier.bind(this));propertyRenderer.setShadowHandler(this._processShadow.bind(this));propertyRenderer.setGridHandler(this._processGrid.bind(this));}
this.listItemElement.removeChildren();this.nameElement=propertyRenderer.renderName();if(this.property.name.startsWith('--')){this.nameElement.title=this._matchedStyles.computeCSSVariable(this._style,this.property.name)||'';}
this.valueElement=propertyRenderer.renderValue();if(!this.treeOutline){return;}
const indent=Settings.Settings.instance().moduleSetting('textEditorIndent').get();this.listItemElement.createChild('span','styles-clipboard-only').createTextChild(indent+(this.property.disabled?'/* ':''));this.listItemElement.appendChild(this.nameElement);const lineBreakValue=this.valueElement.firstElementChild&&this.valueElement.firstElementChild.tagName==='BR';const separator=lineBreakValue?':':': ';this.listItemElement.createChild('span','styles-name-value-separator').textContent=separator;if(this._expandElement){this.listItemElement.appendChild(this._expandElement);}
this.listItemElement.appendChild(this.valueElement);this.listItemElement.createTextChild(';');if(this.property.disabled){this.listItemElement.createChild('span','styles-clipboard-only').createTextChild(' */');}
if(!this.property.parsedOk){this.listItemElement.classList.add('not-parsed-ok');this.listItemElement.insertBefore(StylesSidebarPane.createExclamationMark(this.property),this.listItemElement.firstChild);}
if(!this.property.activeInStyle()){this.listItemElement.classList.add('inactive');}
this._updateFilter();if(this.property.parsedOk&&this.section()&&this.parent.root){const enabledCheckboxElement=createElement('input');enabledCheckboxElement.className='enabled-button';enabledCheckboxElement.type='checkbox';enabledCheckboxElement.checked=!this.property.disabled;enabledCheckboxElement.addEventListener('mousedown',event=>event.consume(),false);enabledCheckboxElement.addEventListener('click',event=>{this._toggleDisabled(!this.property.disabled);event.consume();},false);ARIAUtils.setAccessibleName(enabledCheckboxElement,`${this.nameElement.textContent} ${this.valueElement.textContent}`);this.listItemElement.insertBefore(enabledCheckboxElement,this.listItemElement.firstChild);}}
_mouseUp(event){const activeTreeElement=this._parentPane[ActiveSymbol];this._parentPane[ActiveSymbol]=null;if(activeTreeElement!==this){return;}
if(this.listItemElement.hasSelection()){return;}
if(UIUtils.isBeingEdited((event.target))){return;}
event.consume(true);if(event.target===this.listItemElement){return;}
if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event))&&this.section().navigable){this._navigateToSource((event.target));return;}
this.startEditing((event.target));}
_handleContextMenuEvent(context,event){const contextMenu=new ContextMenu.ContextMenu(event);if(this.property.parsedOk&&this.section()&&this.parent.root){contextMenu.defaultSection().appendCheckboxItem(ls`Toggle property and continue editing`,async()=>{this.editingCancelled(null,context);const sectionIndex=this._parentPane.focusedSectionIndex();const propertyIndex=this.treeOutline.rootElement().indexOfChild(this);await this._toggleDisabled(!this.property.disabled);event.consume();this._parentPane.continueEditingElement(sectionIndex,propertyIndex);},!this.property.disabled);}
contextMenu.defaultSection().appendItem(ls`Reveal in Sources panel`,this._navigateToSource.bind(this));contextMenu.show();}
_navigateToSource(element,omitFocus){if(!this.section().navigable){return;}
const propertyNameClicked=element===this.nameElement;const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(this.property,propertyNameClicked);if(uiLocation){Revealer.reveal(uiLocation,omitFocus);}}
startEditing(selectElement){if(this.parent.isShorthand){return;}
if(this._expandElement&&selectElement===this._expandElement){return;}
const section=this.section();if(section&&!section.editable){return;}
if(selectElement){selectElement=selectElement.enclosingNodeOrSelfWithClass('webkit-css-property')||selectElement.enclosingNodeOrSelfWithClass('value');}
if(!selectElement){selectElement=this.nameElement;}
if(UIUtils.isBeingEdited(selectElement)){return;}
const isEditingName=selectElement===this.nameElement;if(!isEditingName){if(CSSMetadata.cssMetadata().isGridAreaDefiningProperty(this.name)){this.valueElement.textContent=restoreGridIndents(this.value);}
this.valueElement.textContent=restoreURLs(this.valueElement.textContent,this.value);}
function restoreGridIndents(value){const splitResult=TextUtils.Utils.splitStringByRegexes(value,[CSSMetadata.GridAreaRowRegex]);return splitResult.map(result=>result.value.trim()).join('\n');}
function restoreURLs(fieldValue,modelValue){const urlRegex=/\b(url\([^)]*\))/g;const splitFieldValue=fieldValue.split(urlRegex);if(splitFieldValue.length===1){return fieldValue;}
const modelUrlRegex=new RegExp(urlRegex);for(let i=1;i<splitFieldValue.length;i+=2){const match=modelUrlRegex.exec(modelValue);if(match){splitFieldValue[i]=match[0];}}
return splitFieldValue.join('');}
const context={expanded:this.expanded,hasChildren:this.isExpandable(),isEditingName:isEditingName,originalProperty:this.property,previousContent:selectElement.textContent};this._contextForTest=context;this.setExpandable(false);if(selectElement.parentElement){selectElement.parentElement.classList.add('child-editing');}
selectElement.textContent=selectElement.textContent;function pasteHandler(context,event){const data=event.clipboardData.getData('Text');if(!data){return;}
const colonIdx=data.indexOf(':');if(colonIdx<0){return;}
const name=data.substring(0,colonIdx).trim();const value=data.substring(colonIdx+1).trim();event.preventDefault();if(!('originalName'in context)){context.originalName=this.nameElement.textContent;context.originalValue=this.valueElement.textContent;}
this.property.name=name;this.property.value=value;this.nameElement.textContent=name;this.valueElement.textContent=value;this.nameElement.normalize();this.valueElement.normalize();this._editingCommitted(event.target.textContent,context,'forward');}
function blurListener(context,event){let text=event.target.textContent;if(!context.isEditingName){text=this.value||text;}
this._editingCommitted(text,context,'');}
this._originalPropertyText=this.property.propertyText;this._parentPane.setEditingStyle(true,this);if(selectElement.parentElement){selectElement.parentElement.scrollIntoViewIfNeeded(false);}
this._prompt=new CSSPropertyPrompt(this,isEditingName);this._prompt.setAutocompletionTimeout(0);this._prompt.addEventListener(TextPrompt.Events.TextChanged,event=>{this._applyFreeFlowStyleTextEdit(context);});const proxyElement=this._prompt.attachAndStartEditing(selectElement,blurListener.bind(this,context));this._navigateToSource(selectElement,true);proxyElement.addEventListener('keydown',this._editingNameValueKeyDown.bind(this,context),false);proxyElement.addEventListener('keypress',this._editingNameValueKeyPress.bind(this,context),false);if(isEditingName){proxyElement.addEventListener('paste',pasteHandler.bind(this,context),false);proxyElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this,context),false);}
selectElement.getComponentSelection().selectAllChildren(selectElement);}
_editingNameValueKeyDown(context,event){if(event.handled){return;}
let result;if(isEnterKey(event)&&!event.shiftKey){result='forward';}else if(event.keyCode===KeyboardShortcut.Keys.Esc.code||event.key==='Escape'){result='cancel';}else if(!context.isEditingName&&this._newProperty&&event.keyCode===KeyboardShortcut.Keys.Backspace.code){const selection=event.target.getComponentSelection();if(selection.isCollapsed&&!selection.focusOffset){event.preventDefault();result='backward';}}else if(event.key==='Tab'){result=event.shiftKey?'backward':'forward';event.preventDefault();}
if(result){switch(result){case'cancel':this.editingCancelled(null,context);break;case'forward':case'backward':this._editingCommitted(event.target.textContent,context,result);break;}
event.consume();return;}}
_editingNameValueKeyPress(context,event){function shouldCommitValueSemicolon(text,cursorPosition){let openQuote='';for(let i=0;i<cursorPosition;++i){const ch=text[i];if(ch==='\\'&&openQuote!==''){++i;}
else if(!openQuote&&(ch==='"'||ch==='\'')){openQuote=ch;}else if(openQuote===ch){openQuote='';}}
return!openQuote;}
const keyChar=String.fromCharCode(event.charCode);const isFieldInputTerminated=(context.isEditingName?keyChar===':':keyChar===';'&&shouldCommitValueSemicolon(event.target.textContent,event.target.selectionLeftOffset()));if(isFieldInputTerminated){event.consume(true);this._editingCommitted(event.target.textContent,context,'forward');return;}}
async _applyFreeFlowStyleTextEdit(context){if(!this._prompt||!this._parentPane.node()){return;}
const enteredText=this._prompt.text();if(context.isEditingName&&enteredText.includes(':')){this._editingCommitted(enteredText,context,'forward');return;}
const valueText=this._prompt.textWithCurrentSuggestion();if(valueText.includes(';')){return;}
const isPseudo=!!this._parentPane.node().pseudoType();if(isPseudo){if(this.name.toLowerCase()==='content'){return;}
const lowerValueText=valueText.trim().toLowerCase();if(lowerValueText.startsWith('content:')||lowerValueText==='display: none'){return;}}
if(context.isEditingName){if(valueText.includes(':')){await this.applyStyleText(valueText,false);}else if(this._hasBeenEditedIncrementally){await this._applyOriginalStyle(context);}}else{await this.applyStyleText(`${this.nameElement.textContent}: ${valueText}`,false);}}
kickFreeFlowStyleEditForTest(){const context=this._contextForTest;return this._applyFreeFlowStyleTextEdit((context));}
editingEnded(context){this.setExpandable(context.hasChildren);if(context.expanded){this.expand();}
const editedElement=context.isEditingName?this.nameElement:this.valueElement;if(editedElement.parentElement){editedElement.parentElement.classList.remove('child-editing');}
this._parentPane.setEditingStyle(false);}
editingCancelled(element,context){this._removePrompt();if(this._hasBeenEditedIncrementally){this._applyOriginalStyle(context);}else if(this._newProperty){this.treeOutline.removeChild(this);}
this.updateTitle();this.editingEnded(context);}
async _applyOriginalStyle(context){await this.applyStyleText(this._originalPropertyText,false,context.originalProperty);}
_findSibling(moveDirection){let target=this;do{target=(moveDirection==='forward'?target.nextSibling:target.previousSibling);}while(target&&target.inherited());return target;}
async _editingCommitted(userInput,context,moveDirection){this._removePrompt();this.editingEnded(context);const isEditingName=context.isEditingName;const nameValueEntered=(isEditingName&&this.nameElement.textContent.includes(':'))||!this.property;let createNewProperty,moveToSelector;const isDataPasted='originalName'in context;const isDirtyViaPaste=isDataPasted&&(this.nameElement.textContent!==context.originalName||this.valueElement.textContent!==context.originalValue);const isPropertySplitPaste=isDataPasted&&isEditingName&&this.valueElement.textContent!==context.originalValue;let moveTo=this;const moveToOther=(isEditingName^(moveDirection==='forward'));const abandonNewProperty=this._newProperty&&!userInput&&(moveToOther||isEditingName);if(moveDirection==='forward'&&(!isEditingName||isPropertySplitPaste)||moveDirection==='backward'&&isEditingName){moveTo=moveTo._findSibling(moveDirection);if(!moveTo){if(moveDirection==='forward'&&(!this._newProperty||userInput)){createNewProperty=true;}else if(moveDirection==='backward'){moveToSelector=true;}}}
let moveToIndex=moveTo&&this.treeOutline?this.treeOutline.rootElement().indexOfChild(moveTo):-1;const blankInput=StringUtilities.isWhitespace(userInput);const shouldCommitNewProperty=this._newProperty&&(isPropertySplitPaste||moveToOther||(!moveDirection&&!isEditingName)||(isEditingName&&blankInput)||nameValueEntered);const section=(this.section());if(((userInput!==context.previousContent||isDirtyViaPaste)&&!this._newProperty)||shouldCommitNewProperty){let propertyText;if(nameValueEntered){propertyText=this.nameElement.textContent;}else if(blankInput||(this._newProperty&&StringUtilities.isWhitespace(this.valueElement.textContent))){propertyText='';}else{if(isEditingName){propertyText=userInput+': '+this.property.value;}else{propertyText=this.property.name+': '+userInput;}}
await this.applyStyleText(propertyText,true);moveToNextCallback.call(this,this._newProperty,!blankInput,section);}else{if(isEditingName){this.property.name=userInput;}else{this.property.value=userInput;}
if(!isDataPasted&&!this._newProperty){this.updateTitle();}
moveToNextCallback.call(this,this._newProperty,false,section);}
function moveToNextCallback(alreadyNew,valueChanged,section){if(!moveDirection){this._parentPane.resetFocus();return;}
if(moveTo&&moveTo.parent){moveTo.startEditing(!isEditingName?moveTo.nameElement:moveTo.valueElement);return;}
if(moveTo&&!moveTo.parent){const rootElement=section.propertiesTreeOutline.rootElement();if(moveDirection==='forward'&&blankInput&&!isEditingName){--moveToIndex;}
if(moveToIndex>=rootElement.childCount()&&!this._newProperty){createNewProperty=true;}else{const treeElement=moveToIndex>=0?rootElement.childAt(moveToIndex):null;if(treeElement){let elementToEdit=!isEditingName||isPropertySplitPaste?treeElement.nameElement:treeElement.valueElement;if(alreadyNew&&blankInput){elementToEdit=moveDirection==='forward'?treeElement.nameElement:treeElement.valueElement;}
treeElement.startEditing(elementToEdit);return;}
if(!alreadyNew){moveToSelector=true;}}}
if(createNewProperty){if(alreadyNew&&!valueChanged&&(isEditingName^(moveDirection==='backward'))){return;}
section.addNewBlankProperty().startEditing();return;}
if(abandonNewProperty){moveTo=this._findSibling(moveDirection);const sectionToEdit=(moveTo||moveDirection==='backward')?section:section.nextEditableSibling();if(sectionToEdit){if(sectionToEdit.style().parentRule){sectionToEdit.startEditingSelector();}else{sectionToEdit.moveEditorFromSelector(moveDirection);}}
return;}
if(moveToSelector){if(section.style().parentRule){section.startEditingSelector();}else{section.moveEditorFromSelector(moveDirection);}}}}
_removePrompt(){if(this._prompt){this._prompt.detach();this._prompt=null;}}
styleTextAppliedForTest(){}
applyStyleText(styleText,majorChange,property){return this._applyStyleThrottler.schedule(this._innerApplyStyleText.bind(this,styleText,majorChange,property));}
async _innerApplyStyleText(styleText,majorChange,property){if(!this.treeOutline||!this.property){return;}
const oldStyleRange=this._style.range;if(!oldStyleRange){return;}
const hasBeenEditedIncrementally=this._hasBeenEditedIncrementally;styleText=styleText.replace(/[\xA0\t]/g,' ').trim();if(!styleText.length&&majorChange&&this._newProperty&&!hasBeenEditedIncrementally){this.parent.removeChild(this);return;}
const currentNode=this._parentPane.node();this._parentPane.setUserOperation(true);if(styleText.length&&!/;\s*$/.test(styleText)){styleText+=';';}
const overwriteProperty=!this._newProperty||hasBeenEditedIncrementally;let success=await this.property.setText(styleText,majorChange,overwriteProperty);if(hasBeenEditedIncrementally&&majorChange&&!success){majorChange=false;success=await this.property.setText(this._originalPropertyText,majorChange,overwriteProperty);}
this._parentPane.setUserOperation(false);const updatedProperty=property||this._style.propertyAt(this.property.index);const isPropertyWithinBounds=this.property.index<this._style.allProperties().length;if(!success||(!updatedProperty&&isPropertyWithinBounds)){if(majorChange){if(this._newProperty){this.treeOutline.removeChild(this);}else{this.updateTitle();}}
this.styleTextAppliedForTest();return;}
this._matchedStyles.resetActiveProperties();this._hasBeenEditedIncrementally=true;this.property=updatedProperty;if(currentNode===this.node()){this._updatePane();}
this.styleTextAppliedForTest();}
ondblclick(){return true;}
isEventWithinDisclosureTriangle(event){return event.target===this._expandElement;}}
const ActiveSymbol=Symbol('ActiveSymbol');let Context;var StylePropertyTreeElement$1=Object.freeze({__proto__:null,StylePropertyTreeElement:StylePropertyTreeElement,ActiveSymbol:ActiveSymbol,Context:Context});class BezierPopoverIcon{constructor(treeElement,swatchPopoverHelper,swatch){this._treeElement=treeElement;this._swatchPopoverHelper=swatchPopoverHelper;this._swatch=swatch;this._swatch.iconElement().title=UIString.UIString('Open cubic bezier editor.');this._swatch.iconElement().addEventListener('click',this._iconClick.bind(this),false);this._swatch.iconElement().addEventListener('mousedown',event=>event.consume(),false);this._boundBezierChanged=this._bezierChanged.bind(this);this._boundOnScroll=this._onScroll.bind(this);}
_iconClick(event){event.consume(true);if(this._swatchPopoverHelper.isShowing()){this._swatchPopoverHelper.hide(true);return;}
this._bezierEditor=new BezierEditor.BezierEditor();let cubicBezier=Geometry.CubicBezier.parse(this._swatch.bezierText());if(!cubicBezier){cubicBezier=(Geometry.CubicBezier.parse('linear'));}
this._bezierEditor.setBezier(cubicBezier);this._bezierEditor.addEventListener(BezierEditor.Events.BezierChanged,this._boundBezierChanged);this._swatchPopoverHelper.show(this._bezierEditor,this._swatch.iconElement(),this._onPopoverHidden.bind(this));this._scrollerElement=this._swatch.enclosingNodeOrSelfWithClass('style-panes-wrapper');if(this._scrollerElement){this._scrollerElement.addEventListener('scroll',this._boundOnScroll,false);}
this._originalPropertyText=this._treeElement.property.propertyText;this._treeElement.parentPane().setEditingStyle(true);const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(this._treeElement.property,false);if(uiLocation){Revealer.reveal(uiLocation,true);}}
_bezierChanged(event){this._swatch.setBezierText((event.data));this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(),false);}
_onScroll(event){this._swatchPopoverHelper.reposition();}
_onPopoverHidden(commitEdit){if(this._scrollerElement){this._scrollerElement.removeEventListener('scroll',this._boundOnScroll,false);}
this._bezierEditor.removeEventListener(BezierEditor.Events.BezierChanged,this._boundBezierChanged);delete this._bezierEditor;const propertyText=commitEdit?this._treeElement.renderedPropertyText():this._originalPropertyText;this._treeElement.applyStyleText(propertyText,true);this._treeElement.parentPane().setEditingStyle(false);delete this._originalPropertyText;}}
class ColorSwatchPopoverIcon{constructor(treeElement,swatchPopoverHelper,swatch){this._treeElement=treeElement;this._treeElement[ColorSwatchPopoverIcon._treeElementSymbol]=this;this._swatchPopoverHelper=swatchPopoverHelper;this._swatch=swatch;const shiftClickMessage=UIString.UIString('Shift + Click to change color format.');this._swatch.iconElement().title=UIString.UIString('Open color picker. %s',shiftClickMessage);this._swatch.iconElement().addEventListener('click',this._iconClick.bind(this));this._swatch.iconElement().addEventListener('mousedown',event=>event.consume(),false);this._contrastInfo=null;this._boundSpectrumChanged=this._spectrumChanged.bind(this);this._boundOnScroll=this._onScroll.bind(this);}
_generateCSSVariablesPalette(){const matchedStyles=this._treeElement.matchedStyles();const style=this._treeElement.property.ownerStyle;const cssVariables=matchedStyles.availableCSSVariables(style);const colors=[];const colorNames=[];for(const cssVariable of cssVariables){if(cssVariable===this._treeElement.property.name){continue;}
const value=matchedStyles.computeCSSVariable(style,cssVariable);if(!value){continue;}
const color=Color.Color.parse(value);if(!color){continue;}
colors.push(value);colorNames.push(cssVariable);}
return{title:'CSS Variables',mutable:false,matchUserFormat:true,colors:colors,colorNames:colorNames};}
static forTreeElement(treeElement){return treeElement[ColorSwatchPopoverIcon._treeElementSymbol]||null;}
setContrastInfo(contrastInfo){this._contrastInfo=contrastInfo;}
_iconClick(event){event.consume(true);this.showPopover();}
showPopover(){if(this._swatchPopoverHelper.isShowing()){this._swatchPopoverHelper.hide(true);return;}
const color=this._swatch.color();let format=this._swatch.format();if(format===Color.Format.Original){format=color.format();}
this._spectrum=new Spectrum.Spectrum(this._contrastInfo);this._spectrum.setColor(color,format);this._spectrum.addPalette(this._generateCSSVariablesPalette());this._spectrum.addEventListener(Spectrum.Events.SizeChanged,this._spectrumResized,this);this._spectrum.addEventListener(Spectrum.Events.ColorChanged,this._boundSpectrumChanged);this._swatchPopoverHelper.show(this._spectrum,this._swatch.iconElement(),this._onPopoverHidden.bind(this));this._scrollerElement=this._swatch.enclosingNodeOrSelfWithClass('style-panes-wrapper');if(this._scrollerElement){this._scrollerElement.addEventListener('scroll',this._boundOnScroll,false);}
this._originalPropertyText=this._treeElement.property.propertyText;this._treeElement.parentPane().setEditingStyle(true);const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(this._treeElement.property,false);if(uiLocation){Revealer.reveal(uiLocation,true);}}
_spectrumResized(event){this._swatchPopoverHelper.reposition();}
_spectrumChanged(event){const color=Color.Color.parse((event.data));if(!color){return;}
this._swatch.setColor(color);const colorName=this._spectrum.colorName();if(colorName&&colorName.startsWith('--')){this._swatch.setText(`var(${colorName})`);}
this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(),false);}
_onScroll(event){this._swatchPopoverHelper.reposition();}
_onPopoverHidden(commitEdit){if(this._scrollerElement){this._scrollerElement.removeEventListener('scroll',this._boundOnScroll,false);}
this._spectrum.removeEventListener(Spectrum.Events.ColorChanged,this._boundSpectrumChanged);delete this._spectrum;const propertyText=commitEdit?this._treeElement.renderedPropertyText():this._originalPropertyText;this._treeElement.applyStyleText(propertyText,true);this._treeElement.parentPane().setEditingStyle(false);delete this._originalPropertyText;}}
ColorSwatchPopoverIcon._treeElementSymbol=Symbol('ColorSwatchPopoverIcon._treeElementSymbol');class ShadowSwatchPopoverHelper{constructor(treeElement,swatchPopoverHelper,shadowSwatch){this._treeElement=treeElement;this._treeElement[ShadowSwatchPopoverHelper._treeElementSymbol]=this;this._swatchPopoverHelper=swatchPopoverHelper;this._shadowSwatch=shadowSwatch;this._iconElement=shadowSwatch.iconElement();this._iconElement.title=UIString.UIString('Open shadow editor.');this._iconElement.addEventListener('click',this._iconClick.bind(this),false);this._iconElement.addEventListener('mousedown',event=>event.consume(),false);this._boundShadowChanged=this._shadowChanged.bind(this);this._boundOnScroll=this._onScroll.bind(this);}
static forTreeElement(treeElement){return treeElement[ShadowSwatchPopoverHelper._treeElementSymbol]||null;}
_iconClick(event){event.consume(true);this.showPopover();}
showPopover(){if(this._swatchPopoverHelper.isShowing()){this._swatchPopoverHelper.hide(true);return;}
this._cssShadowEditor=new CSSShadowEditor.CSSShadowEditor();this._cssShadowEditor.setModel(this._shadowSwatch.model());this._cssShadowEditor.addEventListener(CSSShadowEditor.Events.ShadowChanged,this._boundShadowChanged);this._swatchPopoverHelper.show(this._cssShadowEditor,this._iconElement,this._onPopoverHidden.bind(this));this._scrollerElement=this._iconElement.enclosingNodeOrSelfWithClass('style-panes-wrapper');if(this._scrollerElement){this._scrollerElement.addEventListener('scroll',this._boundOnScroll,false);}
this._originalPropertyText=this._treeElement.property.propertyText;this._treeElement.parentPane().setEditingStyle(true);const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(this._treeElement.property,false);if(uiLocation){Revealer.reveal(uiLocation,true);}}
_shadowChanged(event){this._shadowSwatch.setCSSShadow((event.data));this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(),false);}
_onScroll(event){this._swatchPopoverHelper.reposition();}
_onPopoverHidden(commitEdit){if(this._scrollerElement){this._scrollerElement.removeEventListener('scroll',this._boundOnScroll,false);}
this._cssShadowEditor.removeEventListener(CSSShadowEditor.Events.ShadowChanged,this._boundShadowChanged);delete this._cssShadowEditor;const propertyText=commitEdit?this._treeElement.renderedPropertyText():this._originalPropertyText;this._treeElement.applyStyleText(propertyText,true);this._treeElement.parentPane().setEditingStyle(false);delete this._originalPropertyText;}}
ShadowSwatchPopoverHelper._treeElementSymbol=Symbol('ShadowSwatchPopoverHelper._treeElementSymbol');var ColorSwatchPopoverIcon$1=Object.freeze({__proto__:null,BezierPopoverIcon:BezierPopoverIcon,ColorSwatchPopoverIcon:ColorSwatchPopoverIcon,ShadowSwatchPopoverHelper:ShadowSwatchPopoverHelper});const decorateNodeLabel=function(node,parentElement,tooltipContent){const originalNode=node;const isPseudo=node.nodeType()===Node.ELEMENT_NODE&&node.pseudoType();if(isPseudo&&node.parentNode){node=node.parentNode;}
let title=node.nodeNameInCorrectCase();const nameElement=parentElement.createChild('span','node-label-name');nameElement.textContent=title;const idAttribute=node.getAttribute('id');if(idAttribute){const idElement=parentElement.createChild('span','node-label-id');const part='#'+idAttribute;title+=part;idElement.createTextChild(part);nameElement.classList.add('extra');}
const classAttribute=node.getAttribute('class');if(classAttribute){const classes=classAttribute.split(/\s+/);const foundClasses={};if(classes.length){const classesElement=parentElement.createChild('span','extra node-label-class');for(let i=0;i<classes.length;++i){const className=classes[i];if(className&&!(className in foundClasses)){const part='.'+className;title+=part;classesElement.createTextChild(part);foundClasses[className]=true;}}}}
if(isPseudo){const pseudoElement=parentElement.createChild('span','extra node-label-pseudo');const pseudoText='::'+originalNode.pseudoType();pseudoElement.createTextChild(pseudoText);title+=pseudoText;}
parentElement.title=tooltipContent||title;};const linkifyNodeReference=function(node,options={}){if(!node){return createTextNode(UIString.UIString('<node>'));}
const root=createElementWithClass('span','monospace');const shadowRoot=Utils.createShadowRootWithCoreStyles(root,'elements/domLinkifier.css');const link=shadowRoot.createChild('div','node-link');decorateNodeLabel(node,link,options.tooltip);link.addEventListener('click',()=>Revealer.reveal(node,false)&&false,false);link.addEventListener('mouseover',node.highlight.bind(node,undefined),false);link.addEventListener('mouseleave',()=>OverlayModel.OverlayModel.hideDOMNodeHighlight(),false);if(!options.preventKeyboardFocus){link.addEventListener('keydown',event=>isEnterKey(event)&&Revealer.reveal(node,false)&&false);link.tabIndex=0;ARIAUtils.markAsLink(link);}
return root;};const linkifyDeferredNodeReference=function(deferredNode,options={}){const root=createElement('div');const shadowRoot=Utils.createShadowRootWithCoreStyles(root,'elements/domLinkifier.css');const link=shadowRoot.createChild('div','node-link');link.createChild('slot');link.addEventListener('click',deferredNode.resolve.bind(deferredNode,onDeferredNodeResolved),false);link.addEventListener('mousedown',e=>e.consume(),false);if(!options.preventKeyboardFocus){link.addEventListener('keydown',event=>isEnterKey(event)&&deferredNode.resolve(onDeferredNodeResolved));link.tabIndex=0;ARIAUtils.markAsLink(link);}
function onDeferredNodeResolved(node){Revealer.reveal(node);}
return root;};class Linkifier{linkify(object,options){if(object instanceof DOMModel.DOMNode){return linkifyNodeReference(object,options);}
if(object instanceof DOMModel.DeferredDOMNode){return linkifyDeferredNodeReference(object,options);}
throw new Error('Can\'t linkify non-node');}}
var DOMLinkifier=Object.freeze({__proto__:null,decorateNodeLabel:decorateNodeLabel,linkifyNodeReference:linkifyNodeReference,linkifyDeferredNodeReference:linkifyDeferredNodeReference,Linkifier:Linkifier});class ElementsSidebarPane extends Widget.VBox{constructor(delegatesFocus){super(true,delegatesFocus);this.element.classList.add('flex-none');this._computedStyleModel=new ComputedStyleModel();this._computedStyleModel.addEventListener(Events.ComputedStyleChanged,this.onCSSModelChanged,this);this._updateThrottler=new Throttler.Throttler(100);this._updateWhenVisible=false;}
node(){return this._computedStyleModel.node();}
cssModel(){return this._computedStyleModel.cssModel();}
doUpdate(){return Promise.resolve();}
update(){this._updateWhenVisible=!this.isShowing();if(this._updateWhenVisible){return;}
this._updateThrottler.schedule(innerUpdate.bind(this));function innerUpdate(){return this.isShowing()?this.doUpdate():Promise.resolve();}}
wasShown(){super.wasShown();if(this._updateWhenVisible){this.update();}}
onCSSModelChanged(event){}}
var ElementsSidebarPane$1=Object.freeze({__proto__:null,ElementsSidebarPane:ElementsSidebarPane});class StylePropertyHighlighter{constructor(ssp,cssProperty){this._styleSidebarPane=ssp;this._cssProperty=cssProperty;}
perform(){for(const section of this._styleSidebarPane.allSections()){for(let treeElement=section.propertiesTreeOutline.firstChild();treeElement;treeElement=treeElement.nextSibling){treeElement.onpopulate();}}
let highlightTreeElement=null;for(const section of this._styleSidebarPane.allSections()){let treeElement=section.propertiesTreeOutline.firstChild();while(treeElement&&!highlightTreeElement){if(treeElement.property===this._cssProperty){highlightTreeElement=treeElement;break;}
treeElement=treeElement.traverseNextTreeElement(false,null,true);}
if(highlightTreeElement){break;}}
if(!highlightTreeElement){return;}
highlightTreeElement.parent.expand();highlightTreeElement.listItemElement.scrollIntoViewIfNeeded();highlightTreeElement.listItemElement.animate([{offset:0,backgroundColor:'rgba(255, 255, 0, 0.2)'},{offset:0.1,backgroundColor:'rgba(255, 255, 0, 0.7)'},{offset:1,backgroundColor:'transparent'}],{duration:2000,easing:'cubic-bezier(0, 0, 0.2, 1)'});}}
var StylePropertyHighlighter$1=Object.freeze({__proto__:null,StylePropertyHighlighter:StylePropertyHighlighter});class StylesSidebarPane extends ElementsSidebarPane{constructor(){super(true);this.setMinimumSize(96,26);this.registerRequiredCSS('elements/stylesSidebarPane.css');Settings.Settings.instance().moduleSetting('colorFormat').addChangeListener(this.update.bind(this));Settings.Settings.instance().moduleSetting('textEditorIndent').addChangeListener(this.update.bind(this));this._currentToolbarPane=null;this._animatedToolbarPane=null;this._pendingWidget=null;this._pendingWidgetToggle=null;this._toolbarPaneElement=this._createStylesSidebarToolbar();this._noMatchesElement=this.contentElement.createChild('div','gray-info-message hidden');this._noMatchesElement.textContent=ls`No matching selector or style`;this._sectionsContainer=this.contentElement.createChild('div');ARIAUtils.markAsTree(this._sectionsContainer);this._sectionsContainer.addEventListener('keydown',this._sectionsContainerKeyDown.bind(this),false);this._sectionsContainer.addEventListener('focusin',this._sectionsContainerFocusChanged.bind(this),false);this._sectionsContainer.addEventListener('focusout',this._sectionsContainerFocusChanged.bind(this),false);this._swatchPopoverHelper=new SwatchPopoverHelper.SwatchPopoverHelper();this._linkifier=new Linkifier$1.Linkifier(_maxLinkLength,true);this._decorator=null;this._userOperation=false;this._isEditingStyle=false;this._filterRegex=null;this._isActivePropertyHighlighted=false;this.contentElement.classList.add('styles-pane');this._sectionBlocks=[];this._needsForceUpdate=false;StylesSidebarPane._instance=this;self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this.forceUpdate,this);this.contentElement.addEventListener('copy',this._clipboardCopy.bind(this));this._resizeThrottler=new Throttler.Throttler(100);}
swatchPopoverHelper(){return this._swatchPopoverHelper;}
setUserOperation(userOperation){this._userOperation=userOperation;}
static createExclamationMark(property){const exclamationElement=createElement('span','dt-icon-label');exclamationElement.className='exclamation-mark';if(!StylesSidebarPane.ignoreErrorsForProperty(property)){exclamationElement.type='smallicon-warning';}
exclamationElement.title=CSSMetadata.cssMetadata().isCSSPropertyName(property.name)?UIString.UIString('Invalid property value'):UIString.UIString('Unknown property name');return exclamationElement;}
static ignoreErrorsForProperty(property){function hasUnknownVendorPrefix(string){return!string.startsWith('-webkit-')&&/^[-_][\w\d]+-\w/.test(string);}
const name=property.name.toLowerCase();if(name.charAt(0)==='_'){return true;}
if(name==='filter'){return true;}
if(name.startsWith('scrollbar-')){return true;}
if(hasUnknownVendorPrefix(name)){return true;}
const value=property.value.toLowerCase();if(value.endsWith('\\9')){return true;}
if(hasUnknownVendorPrefix(value)){return true;}
return false;}
static createPropertyFilterElement(placeholder,container,filterCallback){const input=createElementWithClass('input');input.placeholder=placeholder;function searchHandler(){const regex=input.value?new RegExp(input.value.escapeForRegExp(),'i'):null;filterCallback(regex);}
input.addEventListener('input',searchHandler,false);function keydownHandler(event){if(event.key!=='Escape'||!input.value){return;}
event.consume(true);input.value='';searchHandler();}
input.addEventListener('keydown',keydownHandler,false);input.setFilterValue=setFilterValue;function setFilterValue(value){input.value=value;input.focus();searchHandler();}
return input;}
revealProperty(cssProperty){this._decorator=new StylePropertyHighlighter(this,cssProperty);this._decorator.perform();this.update();}
forceUpdate(){this._needsForceUpdate=true;this._swatchPopoverHelper.hide();this._resetCache();this.update();}
_sectionsContainerKeyDown(event){const activeElement=this._sectionsContainer.ownerDocument.deepActiveElement();if(!activeElement){return;}
const section=activeElement._section;if(!section){return;}
switch(event.key){case'ArrowUp':case'ArrowLeft':{const sectionToFocus=section.previousSibling()||section.lastSibling();sectionToFocus.element.focus();event.consume(true);break;}
case'ArrowDown':case'ArrowRight':{const sectionToFocus=section.nextSibling()||section.firstSibling();sectionToFocus.element.focus();event.consume(true);break;}
case'Home':{section.firstSibling().element.focus();event.consume(true);break;}
case'End':{section.lastSibling().element.focus();event.consume(true);break;}}}
_sectionsContainerFocusChanged(){this.resetFocus();}
resetFocus(){if(this._sectionBlocks[0]&&this._sectionBlocks[0].sections[0]){this._sectionBlocks[0].sections[0].element.tabIndex=this._sectionsContainer.hasFocus()?-1:0;}}
_onAddButtonLongClick(event){const cssModel=this.cssModel();if(!cssModel){return;}
const headers=cssModel.styleSheetHeaders().filter(styleSheetResourceHeader);const contextMenuDescriptors=[];for(let i=0;i<headers.length;++i){const header=headers[i];const handler=this._createNewRuleInStyleSheet.bind(this,header);contextMenuDescriptors.push({text:ResourceUtils.displayNameForURL(header.resourceURL()),handler:handler});}
contextMenuDescriptors.sort(compareDescriptors);const contextMenu=new ContextMenu.ContextMenu(event);for(let i=0;i<contextMenuDescriptors.length;++i){const descriptor=contextMenuDescriptors[i];contextMenu.defaultSection().appendItem(descriptor.text,descriptor.handler);}
contextMenu.footerSection().appendItem('inspector-stylesheet',this._createNewRuleInViaInspectorStyleSheet.bind(this));contextMenu.show();function compareDescriptors(descriptor1,descriptor2){return String.naturalOrderComparator(descriptor1.text,descriptor2.text);}
function styleSheetResourceHeader(header){return!header.isViaInspector()&&!header.isInline&&!!header.resourceURL();}}
_onFilterChanged(regex){this._filterRegex=regex;this._updateFilter();}
_refreshUpdate(editedSection,editedTreeElement){if(editedTreeElement){for(const section of this.allSections()){if(section.isBlank){continue;}
section._updateVarFunctions(editedTreeElement);}}
if(this._isEditingStyle){return;}
const node=this.node();if(!node){return;}
for(const section of this.allSections()){if(section.isBlank){continue;}
section.update(section===editedSection);}
if(this._filterRegex){this._updateFilter();}
this._nodeStylesUpdatedForTest(node,false);}
doUpdate(){return this._fetchMatchedCascade().then(this._innerRebuildUpdate.bind(this));}
onResize(){this._resizeThrottler.schedule(this._innerResize.bind(this));}
_innerResize(){const width=this.contentElement.getBoundingClientRect().width+'px';this.allSections().forEach(section=>section.propertiesTreeOutline.element.style.width=width);return Promise.resolve();}
_resetCache(){if(this.cssModel()){this.cssModel().discardCachedMatchedCascade();}}
_fetchMatchedCascade(){const node=this.node();if(!node||!this.cssModel()){return Promise.resolve((null));}
return this.cssModel().cachedMatchedCascadeForNode(node).then(validateStyles.bind(this));function validateStyles(matchedStyles){return matchedStyles&&matchedStyles.node()===this.node()?matchedStyles:null;}}
setEditingStyle(editing,treeElement){if(this._isEditingStyle===editing){return;}
this.contentElement.classList.toggle('is-editing-style',editing);this._isEditingStyle=editing;this._setActiveProperty(null);}
_setActiveProperty(treeElement){if(this._isActivePropertyHighlighted){OverlayModel.OverlayModel.hideDOMNodeHighlight();}
this._isActivePropertyHighlighted=false;if(!this.node()){return;}
if(!treeElement||treeElement.overloaded()||treeElement.inherited()){return;}
const rule=treeElement.property.ownerStyle.parentRule;const selectorList=(rule instanceof CSSRule.CSSStyleRule)?rule.selectorText():undefined;for(const mode of['padding','border','margin']){if(!treeElement.name.startsWith(mode)){continue;}
this.node().domModel().overlayModel().highlightInOverlay({node:(this.node()),selectorList},mode);this._isActivePropertyHighlighted=true;break;}}
onCSSModelChanged(event){const edit=event&&event.data?(event.data.edit):null;if(edit){for(const section of this.allSections()){section._styleSheetEdited(edit);}
return;}
if(this._userOperation||this._isEditingStyle){return;}
this._resetCache();this.update();}
focusedSectionIndex(){let index=0;for(const block of this._sectionBlocks){for(const section of block.sections){if(section.element.hasFocus()){return index;}
index++;}}
return-1;}
continueEditingElement(sectionIndex,propertyIndex){const section=this.allSections()[sectionIndex];if(section){section.propertiesTreeOutline.rootElement().childAt(propertyIndex).startEditing();}}
async _innerRebuildUpdate(matchedStyles){if(this._needsForceUpdate){this._needsForceUpdate=false;}else if(this._isEditingStyle||this._userOperation){return;}
const focusedIndex=this.focusedSectionIndex();this._linkifier.reset();this._sectionsContainer.removeChildren();this._sectionBlocks=[];const node=this.node();if(!matchedStyles||!node){this._noMatchesElement.classList.remove('hidden');return;}
this._sectionBlocks=await this._rebuildSectionsForMatchedStyleRules((matchedStyles));let pseudoTypes=[];const keys=matchedStyles.pseudoTypes();if(keys.delete(Protocol.DOM.PseudoType.Before)){pseudoTypes.push(Protocol.DOM.PseudoType.Before);}
pseudoTypes=pseudoTypes.concat([...keys].sort());for(const pseudoType of pseudoTypes){const block=SectionBlock.createPseudoTypeBlock(pseudoType);for(const style of matchedStyles.pseudoStyles(pseudoType)){const section=new StylePropertiesSection(this,matchedStyles,style);block.sections.push(section);}
this._sectionBlocks.push(block);}
for(const keyframesRule of matchedStyles.keyframes()){const block=SectionBlock.createKeyframesBlock(keyframesRule.name().text);for(const keyframe of keyframesRule.keyframes()){block.sections.push(new KeyframePropertiesSection(this,matchedStyles,keyframe.style));}
this._sectionBlocks.push(block);}
let index=0;for(const block of this._sectionBlocks){const titleElement=block.titleElement();if(titleElement){this._sectionsContainer.appendChild(titleElement);}
for(const section of block.sections){this._sectionsContainer.appendChild(section.element);if(index===focusedIndex){section.element.focus();}
index++;}}
if(focusedIndex>=index){this._sectionBlocks[0].sections[0].element.focus();}
this._sectionsContainerFocusChanged();if(this._filterRegex){this._updateFilter();}else{this._noMatchesElement.classList.toggle('hidden',this._sectionBlocks.length>0);}
this._nodeStylesUpdatedForTest((node),true);if(this._decorator){this._decorator.perform();this._decorator=null;}}
_nodeStylesUpdatedForTest(node,rebuild){}
async _rebuildSectionsForMatchedStyleRules(matchedStyles){const blocks=[new SectionBlock(null)];let lastParentNode=null;for(const style of matchedStyles.nodeStyles()){const parentNode=matchedStyles.isInherited(style)?matchedStyles.nodeForStyle(style):null;if(parentNode&&parentNode!==lastParentNode){lastParentNode=parentNode;const block=await SectionBlock._createInheritedNodeBlock(lastParentNode);blocks.push(block);}
const section=new StylePropertiesSection(this,matchedStyles,style);blocks.peekLast().sections.push(section);}
return blocks;}
async _createNewRuleInViaInspectorStyleSheet(){const cssModel=this.cssModel();const node=this.node();if(!cssModel||!node){return;}
this.setUserOperation(true);const styleSheetHeader=await cssModel.requestViaInspectorStylesheet((node));this.setUserOperation(false);await this._createNewRuleInStyleSheet(styleSheetHeader);}
async _createNewRuleInStyleSheet(styleSheetHeader){if(!styleSheetHeader){return;}
const text=(await styleSheetHeader.requestContent()).content||'';const lines=text.split('\n');const range=TextRange.TextRange.createFromLocation(lines.length-1,lines[lines.length-1].length);this._addBlankSection(this._sectionBlocks[0].sections[0],styleSheetHeader.id,range);}
_addBlankSection(insertAfterSection,styleSheetId,ruleLocation){const node=this.node();const blankSection=new BlankStylePropertiesSection(this,insertAfterSection._matchedStyles,node?node.simpleSelector():'',styleSheetId,ruleLocation,insertAfterSection._style);this._sectionsContainer.insertBefore(blankSection.element,insertAfterSection.element.nextSibling);for(const block of this._sectionBlocks){const index=block.sections.indexOf(insertAfterSection);if(index===-1){continue;}
block.sections.splice(index+1,0,blankSection);blankSection.startEditingSelector();}}
removeSection(section){for(const block of this._sectionBlocks){const index=block.sections.indexOf(section);if(index===-1){continue;}
block.sections.splice(index,1);section.element.remove();}}
filterRegex(){return this._filterRegex;}
_updateFilter(){let hasAnyVisibleBlock=false;for(const block of this._sectionBlocks){hasAnyVisibleBlock|=block.updateFilter();}
this._noMatchesElement.classList.toggle('hidden',!!hasAnyVisibleBlock);}
willHide(){this._swatchPopoverHelper.hide();super.willHide();}
allSections(){let sections=[];for(const block of this._sectionBlocks){sections=sections.concat(block.sections);}
return sections;}
_clipboardCopy(event){userMetrics.actionTaken(UserMetrics.Action.StyleRuleCopied);}
_createStylesSidebarToolbar(){const container=this.contentElement.createChild('div','styles-sidebar-pane-toolbar-container');const hbox=container.createChild('div','hbox styles-sidebar-pane-toolbar');const filterContainerElement=hbox.createChild('div','styles-sidebar-pane-filter-box');const filterInput=StylesSidebarPane.createPropertyFilterElement(ls`Filter`,hbox,this._onFilterChanged.bind(this));ARIAUtils.setAccessibleName(filterInput,UIString.UIString('Filter Styles'));filterContainerElement.appendChild(filterInput);const toolbar=new Toolbar.Toolbar('styles-pane-toolbar',hbox);toolbar.makeToggledGray();toolbar.appendItemsAtLocation('styles-sidebarpane-toolbar');const toolbarPaneContainer=container.createChild('div','styles-sidebar-toolbar-pane-container');const toolbarPaneContent=toolbarPaneContainer.createChild('div','styles-sidebar-toolbar-pane');return toolbarPaneContent;}
showToolbarPane(widget,toggle){if(this._pendingWidgetToggle){this._pendingWidgetToggle.setToggled(false);}
this._pendingWidgetToggle=toggle;if(this._animatedToolbarPane){this._pendingWidget=widget;}else{this._startToolbarPaneAnimation(widget);}
if(widget&&toggle){toggle.setToggled(true);}}
_startToolbarPaneAnimation(widget){if(widget===this._currentToolbarPane){return;}
if(widget&&this._currentToolbarPane){this._currentToolbarPane.detach();widget.show(this._toolbarPaneElement);this._currentToolbarPane=widget;this._currentToolbarPane.focus();return;}
this._animatedToolbarPane=widget;if(this._currentToolbarPane){this._toolbarPaneElement.style.animationName='styles-element-state-pane-slideout';}else if(widget){this._toolbarPaneElement.style.animationName='styles-element-state-pane-slidein';}
if(widget){widget.show(this._toolbarPaneElement);}
const listener=onAnimationEnd.bind(this);this._toolbarPaneElement.addEventListener('animationend',listener,false);function onAnimationEnd(){this._toolbarPaneElement.style.removeProperty('animation-name');this._toolbarPaneElement.removeEventListener('animationend',listener,false);if(this._currentToolbarPane){this._currentToolbarPane.detach();}
this._currentToolbarPane=this._animatedToolbarPane;if(this._currentToolbarPane){this._currentToolbarPane.focus();}
this._animatedToolbarPane=null;if(this._pendingWidget){this._startToolbarPaneAnimation(this._pendingWidget);this._pendingWidget=null;}}}}
const _maxLinkLength=23;class SectionBlock{constructor(titleElement){this._titleElement=titleElement;this.sections=[];}
static createPseudoTypeBlock(pseudoType){const separatorElement=createElement('div');separatorElement.className='sidebar-separator';separatorElement.textContent=UIString.UIString('Pseudo ::%s element',pseudoType);return new SectionBlock(separatorElement);}
static createKeyframesBlock(keyframesName){const separatorElement=createElement('div');separatorElement.className='sidebar-separator';separatorElement.textContent=`@keyframes ${keyframesName}`;return new SectionBlock(separatorElement);}
static async _createInheritedNodeBlock(node){const separatorElement=createElement('div');separatorElement.className='sidebar-separator';separatorElement.createTextChild(ls`Inherited from${' '}`);const link=await Linkifier$2.Linkifier.linkify(node,{preventKeyboardFocus:true});separatorElement.appendChild(link);return new SectionBlock(separatorElement);}
updateFilter(){let hasAnyVisibleSection=false;for(const section of this.sections){hasAnyVisibleSection|=section._updateFilter();}
if(this._titleElement){this._titleElement.classList.toggle('hidden',!hasAnyVisibleSection);}
return!!hasAnyVisibleSection;}
titleElement(){return this._titleElement;}}
class StylePropertiesSection{constructor(parentPane,matchedStyles,style){this._parentPane=parentPane;this._style=style;this._matchedStyles=matchedStyles;this.editable=!!(style.styleSheetId&&style.range);this._hoverTimer=null;this._willCauseCancelEditing=false;this._forceShowAll=false;this._originalPropertiesCount=style.leadingProperties().length;const rule=style.parentRule;this.element=createElementWithClass('div','styles-section matched-styles monospace');ARIAUtils.setAccessibleName(this.element,`${this._headerText()}, css selector`);this.element.tabIndex=-1;ARIAUtils.markAsTreeitem(this.element);this.element.addEventListener('keydown',this._onKeyDown.bind(this),false);this.element._section=this;this._innerElement=this.element.createChild('div');this._titleElement=this._innerElement.createChild('div','styles-section-title '+(rule?'styles-selector':''));this.propertiesTreeOutline=new TreeOutline.TreeOutlineInShadow();this.propertiesTreeOutline.setFocusable(false);this.propertiesTreeOutline.registerRequiredCSS('elements/stylesSectionTree.css');this.propertiesTreeOutline.element.classList.add('style-properties','matched-styles','monospace');this.propertiesTreeOutline.section=this;this._innerElement.appendChild(this.propertiesTreeOutline.element);this._showAllButton=UIUtils.createTextButton('',this._showAllItems.bind(this),'styles-show-all');this._innerElement.appendChild(this._showAllButton);const selectorContainer=createElement('div');this._selectorElement=createElementWithClass('span','selector');this._selectorElement.textContent=this._headerText();selectorContainer.appendChild(this._selectorElement);this._selectorElement.addEventListener('mouseenter',this._onMouseEnterSelector.bind(this),false);this._selectorElement.addEventListener('mousemove',event=>event.consume(),false);this._selectorElement.addEventListener('mouseleave',this._onMouseOutSelector.bind(this),false);const openBrace=selectorContainer.createChild('span','sidebar-pane-open-brace');openBrace.textContent=' {';selectorContainer.addEventListener('mousedown',this._handleEmptySpaceMouseDown.bind(this),false);selectorContainer.addEventListener('click',this._handleSelectorContainerClick.bind(this),false);const closeBrace=this._innerElement.createChild('div','sidebar-pane-closing-brace');closeBrace.textContent='}';this._createHoverMenuToolbar(closeBrace);this._selectorElement.addEventListener('click',this._handleSelectorClick.bind(this),false);this.element.addEventListener('mousedown',this._handleEmptySpaceMouseDown.bind(this),false);this.element.addEventListener('click',this._handleEmptySpaceClick.bind(this),false);this.element.addEventListener('mousemove',this._onMouseMove.bind(this),false);this.element.addEventListener('mouseleave',this._onMouseLeave.bind(this),false);this._selectedSinceMouseDown=false;if(rule){if(rule.isUserAgent()||rule.isInjected()){this.editable=false;}else{if(rule.styleSheetId){const header=rule.cssModel().styleSheetHeaderForId(rule.styleSheetId);this.navigable=!header.isAnonymousInlineStyleSheet();}}}
this._mediaListElement=this._titleElement.createChild('div','media-list media-matches');this._selectorRefElement=this._titleElement.createChild('div','styles-section-subtitle');this._updateMediaList();this._updateRuleOrigin();this._titleElement.appendChild(selectorContainer);this._selectorContainer=selectorContainer;if(this.navigable){this.element.classList.add('navigable');}
if(!this.editable){this.element.classList.add('read-only');this.propertiesTreeOutline.element.classList.add('read-only');}
this._hoverableSelectorsMode=false;this._markSelectorMatches();this.onpopulate();}
static createRuleOriginNode(matchedStyles,linkifier,rule){if(!rule){return createTextNode('');}
const ruleLocation=this._getRuleLocationFromCSSRule(rule);const header=rule.styleSheetId?matchedStyles.cssModel().styleSheetHeaderForId(rule.styleSheetId):null;if(ruleLocation&&rule.styleSheetId&&header&&!header.isAnonymousInlineStyleSheet()){return StylePropertiesSection._linkifyRuleLocation(matchedStyles.cssModel(),linkifier,rule.styleSheetId,ruleLocation);}
if(rule.isUserAgent()){return createTextNode(UIString.UIString('user agent stylesheet'));}
if(rule.isInjected()){return createTextNode(UIString.UIString('injected stylesheet'));}
if(rule.isViaInspector()){return createTextNode(UIString.UIString('via inspector'));}
if(header&&header.ownerNode){const link=linkifyDeferredNodeReference(header.ownerNode,{preventKeyboardFocus:true});link.textContent='<style>';return link;}
return createTextNode('');}
static _getRuleLocationFromCSSRule(rule){let ruleLocation=null;if(rule instanceof CSSRule.CSSStyleRule){ruleLocation=rule.style.range;}else if(rule instanceof CSSRule.CSSKeyframeRule){ruleLocation=rule.key().range;}
return ruleLocation;}
static tryNavigateToRuleLocation(matchedStyles,rule){if(!rule){return;}
const ruleLocation=this._getRuleLocationFromCSSRule(rule);const header=rule.styleSheetId?matchedStyles.cssModel().styleSheetHeaderForId(rule.styleSheetId):null;if(ruleLocation&&rule.styleSheetId&&header&&!header.isAnonymousInlineStyleSheet()){const matchingSelectorLocation=this._getCSSSelectorLocation(matchedStyles.cssModel(),rule.styleSheetId,ruleLocation);this._revealSelectorSource(matchingSelectorLocation,true);}}
static _linkifyRuleLocation(cssModel,linkifier,styleSheetId,ruleLocation){const matchingSelectorLocation=this._getCSSSelectorLocation(cssModel,styleSheetId,ruleLocation);return linkifier.linkifyCSSLocation(matchingSelectorLocation);}
static _getCSSSelectorLocation(cssModel,styleSheetId,ruleLocation){const styleSheetHeader=cssModel.styleSheetHeaderForId(styleSheetId);const lineNumber=styleSheetHeader.lineNumberInSource(ruleLocation.startLine);const columnNumber=styleSheetHeader.columnNumberInSource(ruleLocation.startLine,ruleLocation.startColumn);return new CSSModel.CSSLocation(styleSheetHeader,lineNumber,columnNumber);}
_onKeyDown(event){if(UIUtils.isEditing()||!this.editable||event.altKey||event.ctrlKey||event.metaKey){return;}
switch(event.key){case'Enter':case' ':this._startEditingAtFirstPosition();event.consume(true);break;default:if(event.key.length===1){this.addNewBlankProperty(0).startEditing();}
break;}}
_setSectionHovered(isHovered){this.element.classList.toggle('styles-panel-hovered',isHovered);this.propertiesTreeOutline.element.classList.toggle('styles-panel-hovered',isHovered);if(this._hoverableSelectorsMode!==isHovered){this._hoverableSelectorsMode=isHovered;this._markSelectorMatches();}}
_onMouseLeave(event){this._setSectionHovered(false);this._parentPane._setActiveProperty(null);}
_onMouseMove(event){const hasCtrlOrMeta=KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event));this._setSectionHovered(hasCtrlOrMeta);const treeElement=this.propertiesTreeOutline.treeElementFromEvent(event);if(treeElement instanceof StylePropertyTreeElement){this._parentPane._setActiveProperty((treeElement));}else{this._parentPane._setActiveProperty(null);}
if(!this._selectedSinceMouseDown&&this.element.getComponentSelection().toString()){this._selectedSinceMouseDown=true;}}
_createHoverMenuToolbar(container){if(!this.editable){return;}
const items=[];const textShadowButton=new Toolbar.ToolbarButton(UIString.UIString('Add text-shadow'),'largeicon-text-shadow');textShadowButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onInsertShadowPropertyClick.bind(this,'text-shadow'));textShadowButton.element.tabIndex=-1;items.push(textShadowButton);const boxShadowButton=new Toolbar.ToolbarButton(UIString.UIString('Add box-shadow'),'largeicon-box-shadow');boxShadowButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onInsertShadowPropertyClick.bind(this,'box-shadow'));boxShadowButton.element.tabIndex=-1;items.push(boxShadowButton);const colorButton=new Toolbar.ToolbarButton(UIString.UIString('Add color'),'largeicon-foreground-color');colorButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onInsertColorPropertyClick,this);colorButton.element.tabIndex=-1;items.push(colorButton);const backgroundButton=new Toolbar.ToolbarButton(UIString.UIString('Add background-color'),'largeicon-background-color');backgroundButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onInsertBackgroundColorPropertyClick,this);backgroundButton.element.tabIndex=-1;items.push(backgroundButton);let newRuleButton=null;if(this._style.parentRule){newRuleButton=new Toolbar.ToolbarButton(UIString.UIString('Insert Style Rule Below'),'largeicon-add');newRuleButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this._onNewRuleClick,this);newRuleButton.element.tabIndex=-1;items.push(newRuleButton);}
const sectionToolbar=new Toolbar.Toolbar('sidebar-pane-section-toolbar',container);for(let i=0;i<items.length;++i){sectionToolbar.appendToolbarItem(items[i]);}
const menuButton=new Toolbar.ToolbarButton('','largeicon-menu');menuButton.element.tabIndex=-1;sectionToolbar.appendToolbarItem(menuButton);setItemsVisibility(items,false);sectionToolbar.element.addEventListener('mouseenter',setItemsVisibility.bind(null,items,true));sectionToolbar.element.addEventListener('mouseleave',setItemsVisibility.bind(null,items,false));ARIAUtils.markAsHidden(sectionToolbar.element);function setItemsVisibility(items,value){for(let i=0;i<items.length;++i){items[i].setVisible(value);}
menuButton.setVisible(!value);}}
style(){return this._style;}
_headerText(){const node=this._matchedStyles.nodeForStyle(this._style);if(this._style.type===CSSStyleDeclaration.Type.Inline){return this._matchedStyles.isInherited(this._style)?UIString.UIString('Style Attribute'):'element.style';}
if(this._style.type===CSSStyleDeclaration.Type.Attributes){return ls`${node.nodeNameInCorrectCase()}[Attributes Style]`;}
return this._style.parentRule.selectorText();}
_onMouseOutSelector(){if(this._hoverTimer){clearTimeout(this._hoverTimer);}
OverlayModel.OverlayModel.hideDOMNodeHighlight();}
_onMouseEnterSelector(){if(this._hoverTimer){clearTimeout(this._hoverTimer);}
this._hoverTimer=setTimeout(this._highlight.bind(this),300);}
_highlight(mode='all'){OverlayModel.OverlayModel.hideDOMNodeHighlight();const node=this._parentPane.node();if(!node){return;}
const selectorList=this._style.parentRule?this._style.parentRule.selectorText():undefined;node.domModel().overlayModel().highlightInOverlay({node,selectorList},mode);}
firstSibling(){const parent=this.element.parentElement;if(!parent){return null;}
let childElement=parent.firstChild;while(childElement){if(childElement._section){return childElement._section;}
childElement=childElement.nextSibling;}
return null;}
lastSibling(){const parent=this.element.parentElement;if(!parent){return null;}
let childElement=parent.lastChild;while(childElement){if(childElement._section){return childElement._section;}
childElement=childElement.previousSibling;}
return null;}
nextSibling(){let curElement=this.element;do{curElement=curElement.nextSibling;}while(curElement&&!curElement._section);return curElement?curElement._section:null;}
previousSibling(){let curElement=this.element;do{curElement=curElement.previousSibling;}while(curElement&&!curElement._section);return curElement?curElement._section:null;}
_onNewRuleClick(event){event.data.consume();const rule=this._style.parentRule;const range=TextRange.TextRange.createFromLocation(rule.style.range.endLine,rule.style.range.endColumn+1);this._parentPane._addBlankSection(this,(rule.styleSheetId),range);}
_onInsertShadowPropertyClick(propertyName,event){event.data.consume(true);const treeElement=this.addNewBlankProperty();treeElement.property.name=propertyName;treeElement.property.value='0 0 black';treeElement.updateTitle();const shadowSwatchPopoverHelper=ShadowSwatchPopoverHelper.forTreeElement(treeElement);if(shadowSwatchPopoverHelper){shadowSwatchPopoverHelper.showPopover();}}
_onInsertColorPropertyClick(event){event.data.consume(true);const treeElement=this.addNewBlankProperty();treeElement.property.name='color';treeElement.property.value='black';treeElement.updateTitle();const colorSwatch=ColorSwatchPopoverIcon.forTreeElement(treeElement);if(colorSwatch){colorSwatch.showPopover();}}
_onInsertBackgroundColorPropertyClick(event){event.data.consume(true);const treeElement=this.addNewBlankProperty();treeElement.property.name='background-color';treeElement.property.value='white';treeElement.updateTitle();const colorSwatch=ColorSwatchPopoverIcon.forTreeElement(treeElement);if(colorSwatch){colorSwatch.showPopover();}}
_styleSheetEdited(edit){const rule=this._style.parentRule;if(rule){rule.rebase(edit);}else{this._style.rebase(edit);}
this._updateMediaList();this._updateRuleOrigin();}
_createMediaList(mediaRules){for(let i=mediaRules.length-1;i>=0;--i){const media=mediaRules[i];if(!media.text.includes('(')&&media.text!=='print'){continue;}
const mediaDataElement=this._mediaListElement.createChild('div','media');const mediaContainerElement=mediaDataElement.createChild('span');const mediaTextElement=mediaContainerElement.createChild('span','media-text');switch(media.source){case CSSMedia.Source.LINKED_SHEET:case CSSMedia.Source.INLINE_SHEET:{mediaTextElement.textContent=`media="${media.text}"`;break;}
case CSSMedia.Source.MEDIA_RULE:{const decoration=mediaContainerElement.createChild('span');mediaContainerElement.insertBefore(decoration,mediaTextElement);decoration.textContent='@media ';mediaTextElement.textContent=media.text;if(media.styleSheetId){mediaDataElement.classList.add('editable-media');mediaTextElement.addEventListener('click',this._handleMediaRuleClick.bind(this,media,mediaTextElement),false);}
break;}
case CSSMedia.Source.IMPORT_RULE:{mediaTextElement.textContent=`@import ${media.text}`;break;}}}}
_updateMediaList(){this._mediaListElement.removeChildren();if(this._style.parentRule&&this._style.parentRule instanceof CSSRule.CSSStyleRule){this._createMediaList(this._style.parentRule.media);}}
isPropertyInherited(propertyName){if(this._matchedStyles.isInherited(this._style)){return!CSSMetadata.cssMetadata().isPropertyInherited(propertyName);}
return false;}
nextEditableSibling(){let curSection=this;do{curSection=curSection.nextSibling();}while(curSection&&!curSection.editable);if(!curSection){curSection=this.firstSibling();while(curSection&&!curSection.editable){curSection=curSection.nextSibling();}}
return(curSection&&curSection.editable)?curSection:null;}
previousEditableSibling(){let curSection=this;do{curSection=curSection.previousSibling();}while(curSection&&!curSection.editable);if(!curSection){curSection=this.lastSibling();while(curSection&&!curSection.editable){curSection=curSection.previousSibling();}}
return(curSection&&curSection.editable)?curSection:null;}
refreshUpdate(editedTreeElement){this._parentPane._refreshUpdate(this,editedTreeElement);}
_updateVarFunctions(editedTreeElement){let child=this.propertiesTreeOutline.firstChild();while(child){if(child!==editedTreeElement){child.updateTitleIfComputedValueChanged();}
child=child.traverseNextTreeElement(false,null,true);}}
update(full){this._selectorElement.textContent=this._headerText();this._markSelectorMatches();if(full){this.onpopulate();}else{let child=this.propertiesTreeOutline.firstChild();while(child){child.setOverloaded(this._isPropertyOverloaded(child.property));child=child.traverseNextTreeElement(false,null,true);}}}
_showAllItems(event){if(event){event.consume();}
if(this._forceShowAll){return;}
this._forceShowAll=true;this.onpopulate();}
onpopulate(){this._parentPane._setActiveProperty(null);this.propertiesTreeOutline.removeChildren();const style=this._style;let count=0;const properties=style.leadingProperties();const maxProperties=StylePropertiesSection.MaxProperties+properties.length-this._originalPropertiesCount;for(const property of properties){if(!this._forceShowAll&&count>=maxProperties){break;}
count++;const isShorthand=!!style.longhandProperties(property.name).length;const inherited=this.isPropertyInherited(property.name);const overloaded=this._isPropertyOverloaded(property);if(style.parentRule&&style.parentRule.isUserAgent()&&inherited){continue;}
const item=new StylePropertyTreeElement(this._parentPane,this._matchedStyles,property,isShorthand,inherited,overloaded,false);this.propertiesTreeOutline.appendChild(item);}
if(count<properties.length){this._showAllButton.classList.remove('hidden');this._showAllButton.textContent=ls`Show All Properties (${properties.length - count} more)`;}else{this._showAllButton.classList.add('hidden');}}
_isPropertyOverloaded(property){return this._matchedStyles.propertyState(property)===CSSMatchedStyles.PropertyState.Overloaded;}
_updateFilter(){let hasMatchingChild=false;this._showAllItems();for(const child of this.propertiesTreeOutline.rootElement().children()){hasMatchingChild|=child._updateFilter();}
const regex=this._parentPane.filterRegex();const hideRule=!hasMatchingChild&&!!regex&&!regex.test(this.element.deepTextContent());this.element.classList.toggle('hidden',hideRule);if(!hideRule&&this._style.parentRule){this._markSelectorHighlights();}
return!hideRule;}
_markSelectorMatches(){const rule=this._style.parentRule;if(!rule){return;}
this._mediaListElement.classList.toggle('media-matches',this._matchedStyles.mediaMatches(this._style));const selectorTexts=rule.selectors.map(selector=>selector.text);const matchingSelectorIndexes=this._matchedStyles.matchingSelectors((rule));const matchingSelectors=(new Array(selectorTexts.length).fill(false));for(const matchingIndex of matchingSelectorIndexes){matchingSelectors[matchingIndex]=true;}
if(this._parentPane._isEditingStyle){return;}
const fragment=this._hoverableSelectorsMode?this._renderHoverableSelectors(selectorTexts,matchingSelectors):this._renderSimplifiedSelectors(selectorTexts,matchingSelectors);this._selectorElement.removeChildren();this._selectorElement.appendChild(fragment);this._markSelectorHighlights();}
_renderHoverableSelectors(selectors,matchingSelectors){const fragment=createDocumentFragment();for(let i=0;i<selectors.length;++i){if(i){fragment.createTextChild(', ');}
fragment.appendChild(this._createSelectorElement(selectors[i],matchingSelectors[i],i));}
return fragment;}
_createSelectorElement(text,isMatching,navigationIndex){const element=createElementWithClass('span','simple-selector');element.classList.toggle('selector-matches',isMatching);if(typeof navigationIndex==='number'){element._selectorIndex=navigationIndex;}
element.textContent=text;return element;}
_renderSimplifiedSelectors(selectors,matchingSelectors){const fragment=createDocumentFragment();let currentMatching=false;let text='';for(let i=0;i<selectors.length;++i){if(currentMatching!==matchingSelectors[i]&&text){fragment.appendChild(this._createSelectorElement(text,currentMatching));text='';}
currentMatching=matchingSelectors[i];text+=selectors[i]+(i===selectors.length-1?'':', ');}
if(text){fragment.appendChild(this._createSelectorElement(text,currentMatching));}
return fragment;}
_markSelectorHighlights(){const selectors=this._selectorElement.getElementsByClassName('simple-selector');const regex=this._parentPane.filterRegex();for(let i=0;i<selectors.length;++i){const selectorMatchesFilter=!!regex&&regex.test(selectors[i].textContent);selectors[i].classList.toggle('filter-match',selectorMatchesFilter);}}
_checkWillCancelEditing(){const willCauseCancelEditing=this._willCauseCancelEditing;this._willCauseCancelEditing=false;return willCauseCancelEditing;}
_handleSelectorContainerClick(event){if(this._checkWillCancelEditing()||!this.editable){return;}
if(event.target===this._selectorContainer){this.addNewBlankProperty(0).startEditing();event.consume(true);}}
addNewBlankProperty(index=this.propertiesTreeOutline.rootElement().childCount()){const property=this._style.newBlankProperty(index);const item=new StylePropertyTreeElement(this._parentPane,this._matchedStyles,property,false,false,false,true);this.propertiesTreeOutline.insertChild(item,property.index);return item;}
_handleEmptySpaceMouseDown(){this._willCauseCancelEditing=this._parentPane._isEditingStyle;this._selectedSinceMouseDown=false;}
_handleEmptySpaceClick(event){if(!this.editable||this.element.hasSelection()||this._checkWillCancelEditing()||this._selectedSinceMouseDown){return;}
if(event.target.classList.contains('header')||this.element.classList.contains('read-only')||event.target.enclosingNodeOrSelfWithClass('media')){event.consume();return;}
const deepTarget=event.deepElementFromPoint();if(deepTarget.treeElement){this.addNewBlankProperty(deepTarget.treeElement.property.index+1).startEditing();}else{this.addNewBlankProperty().startEditing();}
event.consume(true);}
_handleMediaRuleClick(media,element,event){if(UIUtils.isBeingEdited(element)){return;}
if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event))&&this.navigable){const location=media.rawLocation();if(!location){event.consume(true);return;}
const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().rawLocationToUILocation(location);if(uiLocation){Revealer.reveal(uiLocation);}
event.consume(true);return;}
if(!this.editable){return;}
const config=new InplaceEditor.Config(this._editingMediaCommitted.bind(this,media),this._editingMediaCancelled.bind(this,element),undefined,this._editingMediaBlurHandler.bind(this));InplaceEditor.InplaceEditor.startEditing(element,config);element.getComponentSelection().selectAllChildren(element);this._parentPane.setEditingStyle(true);const parentMediaElement=element.enclosingNodeOrSelfWithClass('media');parentMediaElement.classList.add('editing-media');event.consume(true);}
_editingMediaFinished(element){this._parentPane.setEditingStyle(false);const parentMediaElement=element.enclosingNodeOrSelfWithClass('media');parentMediaElement.classList.remove('editing-media');}
_editingMediaCancelled(element){this._editingMediaFinished(element);this._markSelectorMatches();element.getComponentSelection().collapse(element,0);}
_editingMediaBlurHandler(editor,blurEvent){return true;}
_editingMediaCommitted(media,element,newContent,oldContent,context,moveDirection){this._parentPane.setEditingStyle(false);this._editingMediaFinished(element);if(newContent){newContent=newContent.trim();}
function userCallback(success){if(success){this._matchedStyles.resetActiveProperties();this._parentPane._refreshUpdate(this);}
this._parentPane.setUserOperation(false);this._editingMediaTextCommittedForTest();}
this._parentPane.setUserOperation(true);const cssModel=this._parentPane.cssModel();if(cssModel){cssModel.setMediaText(media.styleSheetId,media.range,newContent).then(userCallback.bind(this));}}
_editingMediaTextCommittedForTest(){}
_handleSelectorClick(event){if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event))&&this.navigable&&event.target.classList.contains('simple-selector')){this._navigateToSelectorSource(event.target._selectorIndex,true);event.consume(true);return;}
if(this.element.hasSelection()){return;}
this._startEditingAtFirstPosition();event.consume(true);}
_navigateToSelectorSource(index,focus){const cssModel=this._parentPane.cssModel();if(!cssModel){return;}
const rule=this._style.parentRule;const header=cssModel.styleSheetHeaderForId((rule.styleSheetId));if(!header){return;}
const rawLocation=new CSSModel.CSSLocation(header,rule.lineNumberInSource(index),rule.columnNumberInSource(index));StylePropertiesSection._revealSelectorSource(rawLocation,focus);}
static _revealSelectorSource(rawLocation,focus){const uiLocation=CSSWorkspaceBinding.CSSWorkspaceBinding.instance().rawLocationToUILocation(rawLocation);if(uiLocation){Revealer.reveal(uiLocation,!focus);}}
_startEditingAtFirstPosition(){if(!this.editable){return;}
if(!this._style.parentRule){this.moveEditorFromSelector('forward');return;}
this.startEditingSelector();}
startEditingSelector(){const element=this._selectorElement;if(UIUtils.isBeingEdited(element)){return;}
element.scrollIntoViewIfNeeded(false);element.textContent=element.textContent.replace(/\s+/g,' ').trim();const config=new InplaceEditor.Config(this.editingSelectorCommitted.bind(this),this.editingSelectorCancelled.bind(this));InplaceEditor.InplaceEditor.startEditing(this._selectorElement,config);element.getComponentSelection().selectAllChildren(element);this._parentPane.setEditingStyle(true);if(element.classList.contains('simple-selector')){this._navigateToSelectorSource(0,false);}}
moveEditorFromSelector(moveDirection){this._markSelectorMatches();if(!moveDirection){return;}
if(moveDirection==='forward'){let firstChild=this.propertiesTreeOutline.firstChild();while(firstChild&&firstChild.inherited()){firstChild=firstChild.nextSibling;}
if(!firstChild){this.addNewBlankProperty().startEditing();}else{firstChild.startEditing(firstChild.nameElement);}}else{const previousSection=this.previousEditableSibling();if(!previousSection){return;}
previousSection.addNewBlankProperty().startEditing();}}
editingSelectorCommitted(element,newContent,oldContent,context,moveDirection){this._editingSelectorEnded();if(newContent){newContent=newContent.trim();}
if(newContent===oldContent){this._selectorElement.textContent=newContent;this.moveEditorFromSelector(moveDirection);return;}
const rule=this._style.parentRule;if(!rule){return;}
function headerTextCommitted(){this._parentPane.setUserOperation(false);this.moveEditorFromSelector(moveDirection);this._editingSelectorCommittedForTest();}
this._parentPane.setUserOperation(true);this._setHeaderText(rule,newContent).then(headerTextCommitted.bind(this));}
_setHeaderText(rule,newContent){function onSelectorsUpdated(rule,success){if(!success){return Promise.resolve();}
return this._matchedStyles.recomputeMatchingSelectors(rule).then(updateSourceRanges.bind(this,rule));}
function updateSourceRanges(rule){const doesAffectSelectedNode=this._matchedStyles.matchingSelectors(rule).length>0;this.propertiesTreeOutline.element.classList.toggle('no-affect',!doesAffectSelectedNode);this._matchedStyles.resetActiveProperties();this._parentPane._refreshUpdate(this);}
console.assert(rule instanceof CSSRule.CSSStyleRule);const oldSelectorRange=rule.selectorRange();if(!oldSelectorRange){return Promise.resolve();}
return rule.setSelectorText(newContent).then(onSelectorsUpdated.bind(this,(rule),oldSelectorRange));}
_editingSelectorCommittedForTest(){}
_updateRuleOrigin(){this._selectorRefElement.removeChildren();this._selectorRefElement.appendChild(StylePropertiesSection.createRuleOriginNode(this._matchedStyles,this._parentPane._linkifier,this._style.parentRule));}
_editingSelectorEnded(){this._parentPane.setEditingStyle(false);}
editingSelectorCancelled(){this._editingSelectorEnded();this._markSelectorMatches();}}
StylePropertiesSection.MaxProperties=50;class BlankStylePropertiesSection extends StylePropertiesSection{constructor(stylesPane,matchedStyles,defaultSelectorText,styleSheetId,ruleLocation,insertAfterStyle){const cssModel=(stylesPane.cssModel());const rule=CSSRule.CSSStyleRule.createDummyRule(cssModel,defaultSelectorText);super(stylesPane,matchedStyles,rule.style);this._normal=false;this._ruleLocation=ruleLocation;this._styleSheetId=styleSheetId;this._selectorRefElement.removeChildren();this._selectorRefElement.appendChild(StylePropertiesSection._linkifyRuleLocation(cssModel,this._parentPane._linkifier,styleSheetId,this._actualRuleLocation()));if(insertAfterStyle&&insertAfterStyle.parentRule){this._createMediaList(insertAfterStyle.parentRule.media);}
this.element.classList.add('blank-section');}
_actualRuleLocation(){const prefix=this._rulePrefix();const lines=prefix.split('\n');const editRange=new TextRange.TextRange(0,0,lines.length-1,lines.peekLast().length);return this._ruleLocation.rebaseAfterTextEdit(TextRange.TextRange.createFromLocation(0,0),editRange);}
_rulePrefix(){return this._ruleLocation.startLine===0&&this._ruleLocation.startColumn===0?'':'\n\n';}
get isBlank(){return!this._normal;}
editingSelectorCommitted(element,newContent,oldContent,context,moveDirection){if(!this.isBlank){super.editingSelectorCommitted(element,newContent,oldContent,context,moveDirection);return;}
function onRuleAdded(newRule){if(!newRule){this.editingSelectorCancelled();this._editingSelectorCommittedForTest();return Promise.resolve();}
return this._matchedStyles.addNewRule(newRule,this._matchedStyles.node()).then(onAddedToCascade.bind(this,newRule));}
function onAddedToCascade(newRule){const doesSelectorAffectSelectedNode=this._matchedStyles.matchingSelectors(newRule).length>0;this._makeNormal(newRule);if(!doesSelectorAffectSelectedNode){this.propertiesTreeOutline.element.classList.add('no-affect');}
this._updateRuleOrigin();this._parentPane.setUserOperation(false);this._editingSelectorEnded();if(this.element.parentElement)
{this.moveEditorFromSelector(moveDirection);}
this._markSelectorMatches();this._editingSelectorCommittedForTest();}
if(newContent){newContent=newContent.trim();}
this._parentPane.setUserOperation(true);const cssModel=this._parentPane.cssModel();const ruleText=this._rulePrefix()+newContent+' {}';if(cssModel){cssModel.addRule(this._styleSheetId,ruleText,this._ruleLocation).then(onRuleAdded.bind(this));}}
editingSelectorCancelled(){this._parentPane.setUserOperation(false);if(!this.isBlank){super.editingSelectorCancelled();return;}
this._editingSelectorEnded();this._parentPane.removeSection(this);}
_makeNormal(newRule){this.element.classList.remove('blank-section');this._style=newRule.style;this._normal=true;}}
class KeyframePropertiesSection extends StylePropertiesSection{constructor(stylesPane,matchedStyles,style){super(stylesPane,matchedStyles,style);this._selectorElement.className='keyframe-key';}
_headerText(){return this._style.parentRule.key().text;}
_setHeaderText(rule,newContent){function updateSourceRanges(success){if(!success){return;}
this._parentPane._refreshUpdate(this);}
console.assert(rule instanceof CSSRule.CSSKeyframeRule);const oldRange=rule.key().range;if(!oldRange){return Promise.resolve();}
return rule.setKeyText(newContent).then(updateSourceRanges.bind(this));}
isPropertyInherited(propertyName){return false;}
_isPropertyOverloaded(property){return false;}
_markSelectorHighlights(){}
_markSelectorMatches(){this._selectorElement.textContent=this._style.parentRule.key().text;}
_highlight(){}}
class CSSPropertyPrompt extends TextPrompt.TextPrompt{constructor(treeElement,isEditingName){super();this.initialize(this._buildPropertyCompletions.bind(this),UIUtils.StyleValueDelimiters);this._isColorAware=CSSMetadata.cssMetadata().isColorAwareProperty(treeElement.property.name);this._cssCompletions=[];if(isEditingName){this._cssCompletions=CSSMetadata.cssMetadata().allProperties();if(!treeElement.node().isSVGNode()){this._cssCompletions=this._cssCompletions.filter(property=>!CSSMetadata.cssMetadata().isSVGProperty(property));}}else{this._cssCompletions=CSSMetadata.cssMetadata().propertyValues(treeElement.nameElement.textContent);}
this._treeElement=treeElement;this._isEditingName=isEditingName;this._cssVariables=treeElement.matchedStyles().availableCSSVariables(treeElement.property.ownerStyle);if(this._cssVariables.length<1000){this._cssVariables.sort(String.naturalOrderComparator);}else{this._cssVariables.sort();}
if(!isEditingName){this.disableDefaultSuggestionForEmptyInput();if(treeElement&&treeElement.valueElement){const cssValueText=treeElement.valueElement.textContent;const cmdOrCtrl=Platform.isMac()?'Cmd':'Ctrl';if(cssValueText.match(/#[\da-f]{3,6}$/i)){this.setTitle(ls`Increment/decrement with mousewheel or up/down keys. ${cmdOrCtrl}: R ±1, Shift: G ±1, Alt: B ±1`);}else if(cssValueText.match(/\d+/)){this.setTitle(ls`Increment/decrement with mousewheel or up/down keys. ${cmdOrCtrl}: ±100, Shift: ±10, Alt: ±0.1`);}}}}
onKeyDown(event){switch(event.key){case'ArrowUp':case'ArrowDown':case'PageUp':case'PageDown':if(!this.isSuggestBoxVisible()&&this._handleNameOrValueUpDown(event)){event.preventDefault();return;}
break;case'Enter':if(event.shiftKey){return;}
this.tabKeyPressed();event.preventDefault();return;}
super.onKeyDown(event);}
onMouseWheel(event){if(this._handleNameOrValueUpDown(event)){event.consume(true);return;}
super.onMouseWheel(event);}
tabKeyPressed(){this.acceptAutoComplete();return false;}
_handleNameOrValueUpDown(event){function finishHandler(originalValue,replacementString){this._treeElement.applyStyleText(this._treeElement.nameElement.textContent+': '+this._treeElement.valueElement.textContent,false);}
function customNumberHandler(prefix,number,suffix){if(number!==0&&!suffix.length&&CSSMetadata.cssMetadata().isLengthProperty(this._treeElement.property.name)){suffix='px';}
return prefix+number+suffix;}
if(!this._isEditingName&&this._treeElement.valueElement&&UIUtils.handleElementValueModifications(event,this._treeElement.valueElement,finishHandler.bind(this),this._isValueSuggestion.bind(this),customNumberHandler.bind(this))){return true;}
return false;}
_isValueSuggestion(word){if(!word){return false;}
word=word.toLowerCase();return this._cssCompletions.indexOf(word)!==-1||word.startsWith('--');}
_buildPropertyCompletions(expression,query,force){const lowerQuery=query.toLowerCase();const editingVariable=!this._isEditingName&&expression.trim().endsWith('var(');if(!query&&!force&&!editingVariable&&(this._isEditingName||expression)){return Promise.resolve([]);}
const prefixResults=[];const anywhereResults=[];if(!editingVariable){this._cssCompletions.forEach(completion=>filterCompletions.call(this,completion,false));}
if(this._isEditingName){const nameValuePresets=CSSMetadata.cssMetadata().nameValuePresets(this._treeElement.node().isSVGNode());nameValuePresets.forEach(preset=>filterCompletions.call(this,preset,false,true));}
if(this._isEditingName||editingVariable){this._cssVariables.forEach(variable=>filterCompletions.call(this,variable,true));}
const results=prefixResults.concat(anywhereResults);if(!this._isEditingName&&!results.length&&query.length>1&&'!important'.startsWith(lowerQuery)){results.push({text:'!important'});}
const userEnteredText=query.replace('-','');if(userEnteredText&&(userEnteredText===userEnteredText.toUpperCase())){for(let i=0;i<results.length;++i){if(!results[i].text.startsWith('--')){results[i].text=results[i].text.toUpperCase();}}}
results.forEach(result=>{if(editingVariable){result.title=result.text;result.text+=')';return;}
const valuePreset=CSSMetadata.cssMetadata().getValuePreset(this._treeElement.name,result.text);if(!this._isEditingName&&valuePreset){result.title=result.text;result.text=valuePreset.text;result.selectionRange={startColumn:valuePreset.startColumn,endColumn:valuePreset.endColumn};}});if(this._isColorAware&&!this._isEditingName){results.sort((a,b)=>{if(!!a.subtitleRenderer===!!b.subtitleRenderer){return 0;}
return a.subtitleRenderer?-1:1;});}
return Promise.resolve(results);function filterCompletions(completion,variable,nameValue){const index=completion.toLowerCase().indexOf(lowerQuery);const result={text:completion};if(variable){const computedValue=this._treeElement.matchedStyles().computeCSSVariable(this._treeElement.property.ownerStyle,completion);if(computedValue){const color=Color.Color.parse(computedValue);if(color){result.subtitleRenderer=swatchRenderer.bind(null,color);}}}
if(nameValue){result.hideGhostText=true;}
if(index===0){result.priority=this._isEditingName?CSSMetadata.cssMetadata().propertyUsageWeight(completion):1;prefixResults.push(result);}else if(index>-1){anywhereResults.push(result);}}
function swatchRenderer(color){const swatch=ColorSwatch.ColorSwatch.create();swatch.hideText(true);swatch.setColor(color);swatch.style.pointerEvents='none';return swatch;}}}
class StylesSidebarPropertyRenderer{constructor(rule,node,name,value){this._rule=rule;this._node=node;this._propertyName=name;this._propertyValue=value;this._colorHandler=null;this._bezierHandler=null;this._shadowHandler=null;this._gridHandler=null;this._varHandler=createTextNode;}
setColorHandler(handler){this._colorHandler=handler;}
setBezierHandler(handler){this._bezierHandler=handler;}
setShadowHandler(handler){this._shadowHandler=handler;}
setGridHandler(handler){this._gridHandler=handler;}
setVarHandler(handler){this._varHandler=handler;}
renderName(){const nameElement=createElement('span');nameElement.className='webkit-css-property';nameElement.textContent=this._propertyName;nameElement.normalize();return nameElement;}
renderValue(){const valueElement=createElement('span');valueElement.className='value';if(!this._propertyValue){return valueElement;}
const metadata=CSSMetadata.cssMetadata();if(this._shadowHandler&&metadata.isShadowProperty(this._propertyName)&&!CSSMetadata.VariableRegex.test(this._propertyValue)){valueElement.appendChild(this._shadowHandler(this._propertyValue,this._propertyName));valueElement.normalize();return valueElement;}
if(this._gridHandler&&metadata.isGridAreaDefiningProperty(this._propertyName)){valueElement.appendChild(this._gridHandler(this._propertyValue,this._propertyName));valueElement.normalize();return valueElement;}
if(metadata.isStringProperty(this._propertyName)){valueElement.title=unescapeCssString(this._propertyValue);}
const regexes=[CSSMetadata.VariableRegex,CSSMetadata.URLRegex];const processors=[this._varHandler,this._processURL.bind(this)];if(this._bezierHandler&&metadata.isBezierAwareProperty(this._propertyName)){regexes.push(Geometry.CubicBezier.Regex);processors.push(this._bezierHandler);}
if(this._colorHandler&&metadata.isColorAwareProperty(this._propertyName)){regexes.push(Color.Regex);processors.push(this._colorHandler);}
const results=TextUtils.Utils.splitStringByRegexes(this._propertyValue,regexes);for(let i=0;i<results.length;i++){const result=results[i];const processor=result.regexIndex===-1?createTextNode:processors[result.regexIndex];valueElement.appendChild(processor(result.value));}
valueElement.normalize();return valueElement;}
_processURL(text){let url=text.substring(4,text.length-1).trim();const isQuoted=/^'.*'$/s.test(url)||/^".*"$/s.test(url);if(isQuoted){url=url.substring(1,url.length-1);}
const container=createDocumentFragment();container.createTextChild('url(');let hrefUrl=null;if(this._rule&&this._rule.resourceURL()){hrefUrl=ParsedURL.ParsedURL.completeURL(this._rule.resourceURL(),url);}else if(this._node){hrefUrl=this._node.resolveURL(url);}
container.appendChild(Linkifier$1.Linkifier.linkifyURL(hrefUrl||url,{text:url,preventClick:true,bypassURLTrimming:true,}));container.createTextChild(')');return container;}}
class ButtonProvider{constructor(){this._button=new Toolbar.ToolbarButton(UIString.UIString('New Style Rule'),'largeicon-add');this._button.addEventListener(Toolbar.ToolbarButton.Events.Click,this._clicked,this);const longclickTriangle=Icon.Icon.create('largeicon-longclick-triangle','long-click-glyph');this._button.element.appendChild(longclickTriangle);new UIUtils.LongClickController(this._button.element,this._longClicked.bind(this));self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,onNodeChanged.bind(this));onNodeChanged.call(this);function onNodeChanged(){let node=self.UI.context.flavor(DOMModel.DOMNode);node=node?node.enclosingElementOrSelf():null;this._button.setEnabled(!!node);}}
_clicked(event){StylesSidebarPane._instance._createNewRuleInViaInspectorStyleSheet();}
_longClicked(event){StylesSidebarPane._instance._onAddButtonLongClick(event);}
item(){return this._button;}}
var StylesSidebarPane$1=Object.freeze({__proto__:null,StylesSidebarPane:StylesSidebarPane,_maxLinkLength:_maxLinkLength,SectionBlock:SectionBlock,StylePropertiesSection:StylePropertiesSection,BlankStylePropertiesSection:BlankStylePropertiesSection,KeyframePropertiesSection:KeyframePropertiesSection,CSSPropertyPrompt:CSSPropertyPrompt,StylesSidebarPropertyRenderer:StylesSidebarPropertyRenderer,ButtonProvider:ButtonProvider});class ComputedStyleWidget extends ThrottledWidget.ThrottledWidget{constructor(){super(true);this.registerRequiredCSS('elements/computedStyleSidebarPane.css');this._alwaysShowComputedProperties={'display':true,'height':true,'width':true};this._computedStyleModel=new ComputedStyleModel();this._computedStyleModel.addEventListener(Events.ComputedStyleChanged,this.update,this);this._showInheritedComputedStylePropertiesSetting=Settings.Settings.instance().createSetting('showInheritedComputedStyleProperties',false);this._showInheritedComputedStylePropertiesSetting.addChangeListener(this._showInheritedComputedStyleChanged.bind(this));const hbox=this.contentElement.createChild('div','hbox styles-sidebar-pane-toolbar');const filterContainerElement=hbox.createChild('div','styles-sidebar-pane-filter-box');const filterInput=StylesSidebarPane.createPropertyFilterElement(ls`Filter`,hbox,filterCallback.bind(this));ARIAUtils.setAccessibleName(filterInput,UIString.UIString('Filter Computed Styles'));filterContainerElement.appendChild(filterInput);this.setDefaultFocusedElement(filterInput);const toolbar=new Toolbar.Toolbar('styles-pane-toolbar',hbox);toolbar.appendToolbarItem(new Toolbar.ToolbarSettingCheckbox(this._showInheritedComputedStylePropertiesSetting,undefined,UIString.UIString('Show all')));this._noMatchesElement=this.contentElement.createChild('div','gray-info-message');this._noMatchesElement.textContent=ls`No matching property`;this._propertiesOutline=new TreeOutline.TreeOutlineInShadow();this._propertiesOutline.hideOverflow();this._propertiesOutline.setShowSelectionOnKeyboardFocus(true);this._propertiesOutline.setFocusable(true);this._propertiesOutline.registerRequiredCSS('elements/computedStyleWidgetTree.css');this._propertiesOutline.element.classList.add('monospace','computed-properties');this.contentElement.appendChild(this._propertiesOutline.element);this._linkifier=new Linkifier$1.Linkifier(_maxLinkLength$1);function filterCallback(regex){this._filterRegex=regex;this._updateFilter(regex);}
const fontsWidget=new PlatformFontsWidget(this._computedStyleModel);fontsWidget.show(this.contentElement);}
onResize(){const isNarrow=this.contentElement.offsetWidth<260;this._propertiesOutline.contentElement.classList.toggle('computed-narrow',isNarrow);}
_showInheritedComputedStyleChanged(){this.update();}
async doUpdate(){const promises=[this._computedStyleModel.fetchComputedStyle(),this._fetchMatchedCascade()];const[nodeStyles,matchedStyles]=await Promise.all(promises);this._innerRebuildUpdate(nodeStyles,matchedStyles);}
_fetchMatchedCascade(){const node=this._computedStyleModel.node();if(!node||!this._computedStyleModel.cssModel()){return Promise.resolve((null));}
return this._computedStyleModel.cssModel().cachedMatchedCascadeForNode(node).then(validateStyles.bind(this));function validateStyles(matchedStyles){return matchedStyles&&matchedStyles.node()===this._computedStyleModel.node()?matchedStyles:null;}}
_processColor(text){const color=Color.Color.parse(text);if(!color){return createTextNode(text);}
const swatch=ColorSwatch.ColorSwatch.create();swatch.setColor(color);swatch.setFormat(Settings.detectColorFormat(color));return swatch;}
_innerRebuildUpdate(nodeStyle,matchedStyles){const expandedProperties=new Set();for(const treeElement of this._propertiesOutline.rootElement().children()){if(!treeElement.expanded){continue;}
const propertyName=treeElement[_propertySymbol].name;expandedProperties.add(propertyName);}
const hadFocus=this._propertiesOutline.element.hasFocus();this._propertiesOutline.removeChildren();this._linkifier.reset();const cssModel=this._computedStyleModel.cssModel();if(!nodeStyle||!matchedStyles||!cssModel){this._noMatchesElement.classList.remove('hidden');return;}
const uniqueProperties=[...nodeStyle.computedStyle.keys()];uniqueProperties.sort(propertySorter);const propertyTraces=this._computePropertyTraces(matchedStyles);const inhertiedProperties=this._computeInheritedProperties(matchedStyles);const showInherited=this._showInheritedComputedStylePropertiesSetting.get();for(let i=0;i<uniqueProperties.length;++i){const propertyName=uniqueProperties[i];const propertyValue=nodeStyle.computedStyle.get(propertyName);const canonicalName=CSSMetadata.cssMetadata().canonicalPropertyName(propertyName);const inherited=!inhertiedProperties.has(canonicalName);if(!showInherited&&inherited&&!(propertyName in this._alwaysShowComputedProperties)){continue;}
if(!showInherited&&propertyName.startsWith('--')){continue;}
if(propertyName!==canonicalName&&propertyValue===nodeStyle.computedStyle.get(canonicalName)){continue;}
const propertyElement=createElement('div');propertyElement.classList.add('computed-style-property');propertyElement.classList.toggle('computed-style-property-inherited',inherited);const renderer=new StylesSidebarPropertyRenderer(null,nodeStyle.node,propertyName,(propertyValue));renderer.setColorHandler(this._processColor.bind(this));const propertyNameElement=renderer.renderName();propertyNameElement.classList.add('property-name');propertyElement.appendChild(propertyNameElement);const colon=createElementWithClass('span','delimeter');colon.textContent=': ';propertyNameElement.appendChild(colon);const propertyValueElement=propertyElement.createChild('span','property-value');const propertyValueText=renderer.renderValue();propertyValueText.classList.add('property-value-text');propertyValueElement.appendChild(propertyValueText);const semicolon=createElementWithClass('span','delimeter');semicolon.textContent=';';propertyValueElement.appendChild(semicolon);const treeElement=new TreeOutline.TreeElement();treeElement.title=propertyElement;treeElement[_propertySymbol]={name:propertyName,value:propertyValue};const isOdd=this._propertiesOutline.rootElement().children().length%2===0;treeElement.listItemElement.classList.toggle('odd-row',isOdd);this._propertiesOutline.appendChild(treeElement);if(!this._propertiesOutline.selectedTreeElement){treeElement.select(!hadFocus);}
const trace=propertyTraces.get(propertyName);if(trace){const activeProperty=this._renderPropertyTrace(cssModel,matchedStyles,nodeStyle.node,treeElement,trace);treeElement.listItemElement.addEventListener('mousedown',e=>e.consume(),false);treeElement.listItemElement.addEventListener('dblclick',e=>e.consume(),false);treeElement.listItemElement.addEventListener('click',handleClick.bind(null,treeElement),false);treeElement.listItemElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this,matchedStyles,activeProperty));const gotoSourceElement=Icon.Icon.create('mediumicon-arrow-in-circle','goto-source-icon');gotoSourceElement.addEventListener('click',this._navigateToSource.bind(this,activeProperty));propertyValueElement.appendChild(gotoSourceElement);if(expandedProperties.has(propertyName)){treeElement.expand();}}}
this._updateFilter(this._filterRegex);function propertySorter(a,b){if(a.startsWith('--')^b.startsWith('--')){return a.startsWith('--')?1:-1;}
if(a.startsWith('-webkit')^b.startsWith('-webkit')){return a.startsWith('-webkit')?1:-1;}
const canonical1=CSSMetadata.cssMetadata().canonicalPropertyName(a);const canonical2=CSSMetadata.cssMetadata().canonicalPropertyName(b);return canonical1.compareTo(canonical2);}
function handleClick(treeElement,event){if(!treeElement.expanded){treeElement.expand();}else{treeElement.collapse();}
event.consume();}}
_navigateToSource(cssProperty,event){Revealer.reveal(cssProperty);event.consume(true);}
_renderPropertyTrace(cssModel,matchedStyles,node,rootTreeElement,tracedProperties){let activeProperty=null;for(const property of tracedProperties){const trace=createElement('div');trace.classList.add('property-trace');if(matchedStyles.propertyState(property)===CSSMatchedStyles.PropertyState.Overloaded){trace.classList.add('property-trace-inactive');}else{activeProperty=property;}
const renderer=new StylesSidebarPropertyRenderer(null,node,property.name,(property.value));renderer.setColorHandler(this._processColor.bind(this));const valueElement=renderer.renderValue();valueElement.classList.add('property-trace-value');valueElement.addEventListener('click',this._navigateToSource.bind(this,property),false);const gotoSourceElement=Icon.Icon.create('mediumicon-arrow-in-circle','goto-source-icon');gotoSourceElement.addEventListener('click',this._navigateToSource.bind(this,property));valueElement.insertBefore(gotoSourceElement,valueElement.firstChild);trace.appendChild(valueElement);const rule=property.ownerStyle.parentRule;const selectorElement=trace.createChild('span','property-trace-selector');selectorElement.textContent=rule?rule.selectorText():'element.style';selectorElement.title=selectorElement.textContent;if(rule){const linkSpan=trace.createChild('span','trace-link');linkSpan.appendChild(StylePropertiesSection.createRuleOriginNode(matchedStyles,this._linkifier,rule));}
const traceTreeElement=new TreeOutline.TreeElement();traceTreeElement.title=trace;traceTreeElement.listItemElement.addEventListener('contextmenu',this._handleContextMenuEvent.bind(this,matchedStyles,property));rootTreeElement.appendChild(traceTreeElement);}
return(activeProperty);}
_handleContextMenuEvent(matchedStyles,property,event){const contextMenu=new ContextMenu.ContextMenu(event);const rule=property.ownerStyle.parentRule;if(rule){const header=rule.styleSheetId?matchedStyles.cssModel().styleSheetHeaderForId(rule.styleSheetId):null;if(header&&!header.isAnonymousInlineStyleSheet()){contextMenu.defaultSection().appendItem(ls`Navigate to selector source`,()=>{StylePropertiesSection.tryNavigateToRuleLocation(matchedStyles,rule);});}}
contextMenu.defaultSection().appendItem(ls`Navigate to style`,()=>Revealer.reveal(property));contextMenu.show();}
_computePropertyTraces(matchedStyles){const result=new Map();for(const style of matchedStyles.nodeStyles()){const allProperties=style.allProperties();for(const property of allProperties){if(!property.activeInStyle()||!matchedStyles.propertyState(property)){continue;}
if(!result.has(property.name)){result.set(property.name,[]);}
result.get(property.name).push(property);}}
return result;}
_computeInheritedProperties(matchedStyles){const result=new Set();for(const style of matchedStyles.nodeStyles()){for(const property of style.allProperties()){if(!matchedStyles.propertyState(property)){continue;}
result.add(CSSMetadata.cssMetadata().canonicalPropertyName(property.name));}}
return result;}
_updateFilter(regex){const children=this._propertiesOutline.rootElement().children();let hasMatch=false;for(const child of children){const property=child[_propertySymbol];const matched=!regex||regex.test(property.name)||regex.test(property.value);child.hidden=!matched;hasMatch|=matched;}
this._noMatchesElement.classList.toggle('hidden',!!hasMatch);}}
const _maxLinkLength$1=30;const _propertySymbol=Symbol('property');ComputedStyleWidget._propertySymbol=_propertySymbol;var ComputedStyleWidget$1=Object.freeze({__proto__:null,ComputedStyleWidget:ComputedStyleWidget});class ElementsBreadcrumbs extends Widget.HBox{constructor(){super(true);this.registerRequiredCSS('elements/breadcrumbs.css');this.crumbsElement=this.contentElement.createChild('div','crumbs');this.crumbsElement.addEventListener('mousemove',this._mouseMovedInCrumbs.bind(this),false);this.crumbsElement.addEventListener('mouseleave',this._mouseMovedOutOfCrumbs.bind(this),false);this._nodeSymbol=Symbol('node');ARIAUtils.markAsHidden(this.element);}
wasShown(){this.update();}
updateNodes(nodes){if(!nodes.length){return;}
const crumbs=this.crumbsElement;for(let crumb=crumbs.firstChild;crumb;crumb=crumb.nextSibling){if(nodes.indexOf(crumb[this._nodeSymbol])!==-1){this.update(true);return;}}}
setSelectedNode(node){this._currentDOMNode=node;this.crumbsElement.window().requestAnimationFrame(()=>this.update());}
_mouseMovedInCrumbs(event){const nodeUnderMouse=event.target;const crumbElement=nodeUnderMouse.enclosingNodeOrSelfWithClass('crumb');const node=(crumbElement?crumbElement[this._nodeSymbol]:null);if(node){node.highlight();}}
_mouseMovedOutOfCrumbs(event){if(this._currentDOMNode){OverlayModel.OverlayModel.hideDOMNodeHighlight();}}
_onClickCrumb(event){event.preventDefault();let crumb=(event.currentTarget);if(!crumb.classList.contains('collapsed')){this.dispatchEventToListeners(Events$1.NodeSelected,crumb[this._nodeSymbol]);return;}
if(crumb===this.crumbsElement.firstChild){let currentCrumb=crumb;while(currentCrumb){const hidden=currentCrumb.classList.contains('hidden');const collapsed=currentCrumb.classList.contains('collapsed');if(!hidden&&!collapsed){break;}
crumb=currentCrumb;currentCrumb=currentCrumb.nextSiblingElement;}}
this.updateSizes(crumb);}
_determineElementTitle(domNode){switch(domNode.nodeType()){case Node.ELEMENT_NODE:if(domNode.pseudoType()){return'::'+domNode.pseudoType();}
return null;case Node.TEXT_NODE:return UIString.UIString('(text)');case Node.COMMENT_NODE:return'<!-->';case Node.DOCUMENT_TYPE_NODE:return'<!doctype>';case Node.DOCUMENT_FRAGMENT_NODE:return domNode.shadowRootType()?'#shadow-root':domNode.nodeNameInCorrectCase();default:return domNode.nodeNameInCorrectCase();}}
update(force){if(!this.isShowing()){return;}
const currentDOMNode=this._currentDOMNode;const crumbs=this.crumbsElement;let handled=false;let crumb=crumbs.firstChild;while(crumb){if(crumb[this._nodeSymbol]===currentDOMNode){crumb.classList.add('selected');handled=true;}else{crumb.classList.remove('selected');}
crumb=crumb.nextSibling;}
if(handled&&!force){this.updateSizes();return;}
crumbs.removeChildren();for(let current=currentDOMNode;current;current=current.parentNode){if(current.nodeType()===Node.DOCUMENT_NODE){continue;}
crumb=createElementWithClass('span','crumb');crumb[this._nodeSymbol]=current;crumb.addEventListener('mousedown',this._onClickCrumb.bind(this),false);const crumbTitle=this._determineElementTitle(current);if(crumbTitle){const nameElement=createElement('span');nameElement.textContent=crumbTitle;crumb.appendChild(nameElement);crumb.title=crumbTitle;}else{decorateNodeLabel(current,crumb);}
if(current===currentDOMNode){crumb.classList.add('selected');}
crumbs.insertBefore(crumb,crumbs.firstChild);}
this.updateSizes();}
_resetCrumbStylesAndFindSelections(focusedCrumb){const crumbs=this.crumbsElement;let selectedIndex=0;let focusedIndex=0;let selectedCrumb=null;for(let i=0;i<crumbs.childNodes.length;++i){const crumb=crumbs.children[i];if(!selectedCrumb&&crumb.classList.contains('selected')){selectedCrumb=crumb;selectedIndex=i;}
if(crumb===focusedCrumb){focusedIndex=i;}
crumb.classList.remove('compact','collapsed','hidden');}
return{selectedIndex:selectedIndex,focusedIndex:focusedIndex,selectedCrumb:selectedCrumb};}
_measureElementSizes(){const crumbs=this.crumbsElement;const collapsedElement=createElementWithClass('span','crumb collapsed');crumbs.insertBefore(collapsedElement,crumbs.firstChild);const available=crumbs.offsetWidth;const collapsed=collapsedElement.offsetWidth;const normalSizes=[];for(let i=1;i<crumbs.childNodes.length;++i){const crumb=crumbs.childNodes[i];normalSizes[i-1]=crumb.offsetWidth;}
crumbs.removeChild(collapsedElement);const compactSizes=[];for(let i=0;i<crumbs.childNodes.length;++i){const crumb=crumbs.childNodes[i];crumb.classList.add('compact');}
for(let i=0;i<crumbs.childNodes.length;++i){const crumb=crumbs.childNodes[i];compactSizes[i]=crumb.offsetWidth;}
for(let i=0;i<crumbs.childNodes.length;++i){const crumb=crumbs.childNodes[i];crumb.classList.remove('compact','collapsed');}
return{normal:normalSizes,compact:compactSizes,collapsed:collapsed,available:available};}
updateSizes(focusedCrumb){if(!this.isShowing()){return;}
const crumbs=this.crumbsElement;if(!crumbs.firstChild){return;}
const selections=this._resetCrumbStylesAndFindSelections(focusedCrumb);const sizes=this._measureElementSizes();const selectedIndex=selections.selectedIndex;const focusedIndex=selections.focusedIndex;const selectedCrumb=selections.selectedCrumb;function crumbsAreSmallerThanContainer(){let totalSize=0;for(let i=0;i<crumbs.childNodes.length;++i){const crumb=crumbs.childNodes[i];if(crumb.classList.contains('hidden')){continue;}
if(crumb.classList.contains('collapsed')){totalSize+=sizes.collapsed;continue;}
totalSize+=crumb.classList.contains('compact')?sizes.compact[i]:sizes.normal[i];}
const rightPadding=10;return totalSize+rightPadding<sizes.available;}
if(crumbsAreSmallerThanContainer()){return;}
const BothSides=0;const AncestorSide=-1;const ChildSide=1;function makeCrumbsSmaller(shrinkingFunction,direction){const significantCrumb=focusedCrumb||selectedCrumb;const significantIndex=significantCrumb===selectedCrumb?selectedIndex:focusedIndex;function shrinkCrumbAtIndex(index){const shrinkCrumb=crumbs.children[index];if(shrinkCrumb&&shrinkCrumb!==significantCrumb){shrinkingFunction(shrinkCrumb);}
if(crumbsAreSmallerThanContainer()){return true;}
return false;}
if(direction){let index=(direction>0?0:crumbs.childNodes.length-1);while(index!==significantIndex){if(shrinkCrumbAtIndex(index)){return true;}
index+=(direction>0?1:-1);}}else{let startIndex=0;let endIndex=crumbs.childNodes.length-1;while(startIndex!==significantIndex||endIndex!==significantIndex){const startDistance=significantIndex-startIndex;const endDistance=endIndex-significantIndex;let index;if(startDistance>=endDistance){index=startIndex++;}else{index=endIndex--;}
if(shrinkCrumbAtIndex(index)){return true;}}}
return false;}
function coalesceCollapsedCrumbs(){let crumb=crumbs.firstChild;let collapsedRun=false;let newStartNeeded=false;let newEndNeeded=false;while(crumb){const hidden=crumb.classList.contains('hidden');if(!hidden){const collapsed=crumb.classList.contains('collapsed');if(collapsedRun&&collapsed){crumb.classList.add('hidden');crumb.classList.remove('compact');crumb.classList.remove('collapsed');if(crumb.classList.contains('start')){crumb.classList.remove('start');newStartNeeded=true;}
if(crumb.classList.contains('end')){crumb.classList.remove('end');newEndNeeded=true;}
continue;}
collapsedRun=collapsed;if(newEndNeeded){newEndNeeded=false;crumb.classList.add('end');}}else{collapsedRun=true;}
crumb=crumb.nextSibling;}
if(newStartNeeded){crumb=crumbs.lastChild;while(crumb){if(!crumb.classList.contains('hidden')){crumb.classList.add('start');break;}
crumb=crumb.previousSibling;}}}
function compact(crumb){if(crumb.classList.contains('hidden')){return;}
crumb.classList.add('compact');}
function collapse(crumb,dontCoalesce){if(crumb.classList.contains('hidden')){return;}
crumb.classList.add('collapsed');crumb.classList.remove('compact');if(!dontCoalesce){coalesceCollapsedCrumbs();}}
if(!focusedCrumb){if(makeCrumbsSmaller(compact,ChildSide)){return;}
if(makeCrumbsSmaller(collapse,ChildSide)){return;}}
if(makeCrumbsSmaller(compact,focusedCrumb?BothSides:AncestorSide)){return;}
if(makeCrumbsSmaller(collapse,focusedCrumb?BothSides:AncestorSide)){return;}
if(!selectedCrumb){return;}
compact(selectedCrumb);if(crumbsAreSmallerThanContainer()){return;}
collapse(selectedCrumb,true);}}
const Events$1={NodeSelected:Symbol('NodeSelected')};var ElementsBreadcrumbs$1=Object.freeze({__proto__:null,ElementsBreadcrumbs:ElementsBreadcrumbs,Events:Events$1});const fullQualifiedSelector=function(node,justSelector){if(node.nodeType()!==Node.ELEMENT_NODE){return node.localName()||node.nodeName().toLowerCase();}
return cssPath(node,justSelector);};const cssPath=function(node,optimized){if(node.nodeType()!==Node.ELEMENT_NODE){return'';}
const steps=[];let contextNode=node;while(contextNode){const step=_cssPathStep(contextNode,!!optimized,contextNode===node);if(!step){break;}
steps.push(step);if(step.optimized){break;}
contextNode=contextNode.parentNode;}
steps.reverse();return steps.join(' > ');};const canGetJSPath=function(node){let wp=node;while(wp){if(wp.ancestorShadowRoot()&&wp.ancestorShadowRoot().shadowRootType()!==DOMModel.DOMNode.ShadowRootTypes.Open){return false;}
wp=wp.ancestorShadowHost();}
return true;};const jsPath=function(node,optimized){if(node.nodeType()!==Node.ELEMENT_NODE){return'';}
const path=[];let wp=node;while(wp){path.push(cssPath(wp,optimized));wp=wp.ancestorShadowHost();}
path.reverse();let result='';for(let i=0;i<path.length;++i){const string=JSON.stringify(path[i]);if(i){result+=`.shadowRoot.querySelector(${string})`;}else{result+=`document.querySelector(${string})`;}}
return result;};const _cssPathStep=function(node,optimized,isTargetNode){if(node.nodeType()!==Node.ELEMENT_NODE){return null;}
const id=node.getAttribute('id');if(optimized){if(id){return new Step(idSelector(id),true);}
const nodeNameLower=node.nodeName().toLowerCase();if(nodeNameLower==='body'||nodeNameLower==='head'||nodeNameLower==='html'){return new Step(node.nodeNameInCorrectCase(),true);}}
const nodeName=node.nodeNameInCorrectCase();if(id){return new Step(nodeName+idSelector(id),true);}
const parent=node.parentNode;if(!parent||parent.nodeType()===Node.DOCUMENT_NODE){return new Step(nodeName,true);}
function prefixedElementClassNames(node){const classAttribute=node.getAttribute('class');if(!classAttribute){return[];}
return classAttribute.split(/\s+/g).filter(Boolean).map(function(name){return'$'+name;});}
function idSelector(id){return'#'+CSS.escape(id);}
const prefixedOwnClassNamesArray=prefixedElementClassNames(node);let needsClassNames=false;let needsNthChild=false;let ownIndex=-1;let elementIndex=-1;const siblings=parent.children();for(let i=0;(ownIndex===-1||!needsNthChild)&&i<siblings.length;++i){const sibling=siblings[i];if(sibling.nodeType()!==Node.ELEMENT_NODE){continue;}
elementIndex+=1;if(sibling===node){ownIndex=elementIndex;continue;}
if(needsNthChild){continue;}
if(sibling.nodeNameInCorrectCase()!==nodeName){continue;}
needsClassNames=true;const ownClassNames=new Set(prefixedOwnClassNamesArray);if(!ownClassNames.size){needsNthChild=true;continue;}
const siblingClassNamesArray=prefixedElementClassNames(sibling);for(let j=0;j<siblingClassNamesArray.length;++j){const siblingClass=siblingClassNamesArray[j];if(!ownClassNames.has(siblingClass)){continue;}
ownClassNames.delete(siblingClass);if(!ownClassNames.size){needsNthChild=true;break;}}}
let result=nodeName;if(isTargetNode&&nodeName.toLowerCase()==='input'&&node.getAttribute('type')&&!node.getAttribute('id')&&!node.getAttribute('class')){result+='[type='+CSS.escape(node.getAttribute('type'))+']';}
if(needsNthChild){result+=':nth-child('+(ownIndex+1)+')';}else if(needsClassNames){for(const prefixedName of prefixedOwnClassNamesArray){result+='.'+CSS.escape(prefixedName.slice(1));}}
return new Step(result,false);};const xPath=function(node,optimized){if(node.nodeType()===Node.DOCUMENT_NODE){return'/';}
const steps=[];let contextNode=node;while(contextNode){const step=_xPathValue(contextNode,optimized);if(!step){break;}
steps.push(step);if(step.optimized){break;}
contextNode=contextNode.parentNode;}
steps.reverse();return(steps.length&&steps[0].optimized?'':'/')+steps.join('/');};const _xPathValue=function(node,optimized){let ownValue;const ownIndex=_xPathIndex(node);if(ownIndex===-1){return null;}
switch(node.nodeType()){case Node.ELEMENT_NODE:if(optimized&&node.getAttribute('id')){return new Step('//*[@id="'+node.getAttribute('id')+'"]',true);}
ownValue=node.localName();break;case Node.ATTRIBUTE_NODE:ownValue='@'+node.nodeName();break;case Node.TEXT_NODE:case Node.CDATA_SECTION_NODE:ownValue='text()';break;case Node.PROCESSING_INSTRUCTION_NODE:ownValue='processing-instruction()';break;case Node.COMMENT_NODE:ownValue='comment()';break;case Node.DOCUMENT_NODE:ownValue='';break;default:ownValue='';break;}
if(ownIndex>0){ownValue+='['+ownIndex+']';}
return new Step(ownValue,node.nodeType()===Node.DOCUMENT_NODE);};const _xPathIndex=function(node){function areNodesSimilar(left,right){if(left===right){return true;}
if(left.nodeType()===Node.ELEMENT_NODE&&right.nodeType()===Node.ELEMENT_NODE){return left.localName()===right.localName();}
if(left.nodeType()===right.nodeType()){return true;}
const leftType=left.nodeType()===Node.CDATA_SECTION_NODE?Node.TEXT_NODE:left.nodeType();const rightType=right.nodeType()===Node.CDATA_SECTION_NODE?Node.TEXT_NODE:right.nodeType();return leftType===rightType;}
const siblings=node.parentNode?node.parentNode.children():null;if(!siblings){return 0;}
let hasSameNamedElements;for(let i=0;i<siblings.length;++i){if(areNodesSimilar(node,siblings[i])&&siblings[i]!==node){hasSameNamedElements=true;break;}}
if(!hasSameNamedElements){return 0;}
let ownIndex=1;for(let i=0;i<siblings.length;++i){if(areNodesSimilar(node,siblings[i])){if(siblings[i]===node){return ownIndex;}
++ownIndex;}}
return-1;};class Step{constructor(value,optimized){this.value=value;this.optimized=optimized||false;}
toString(){return this.value;}}
var DOMPath=Object.freeze({__proto__:null,fullQualifiedSelector:fullQualifiedSelector,cssPath:cssPath,canGetJSPath:canGetJSPath,jsPath:jsPath,_cssPathStep:_cssPathStep,xPath:xPath,_xPathValue:_xPathValue,_xPathIndex:_xPathIndex,Step:Step});class ElementsTreeOutline extends TreeOutline.TreeOutline{constructor(omitRootDOMNode,selectEnabled,hideGutter){super();this._treeElementSymbol=Symbol('treeElement');const shadowContainer=createElement('div');this._shadowRoot=Utils.createShadowRootWithCoreStyles(shadowContainer,'elements/elementsTreeOutline.css');const outlineDisclosureElement=this._shadowRoot.createChild('div','elements-disclosure');this._element=this.element;this._element.classList.add('elements-tree-outline','source-code');if(hideGutter){this._element.classList.add('elements-hide-gutter');}
ARIAUtils.setAccessibleName(this._element,UIString.UIString('Page DOM'));this._element.addEventListener('focusout',this._onfocusout.bind(this),false);this._element.addEventListener('mousedown',this._onmousedown.bind(this),false);this._element.addEventListener('mousemove',this._onmousemove.bind(this),false);this._element.addEventListener('mouseleave',this._onmouseleave.bind(this),false);this._element.addEventListener('dragstart',this._ondragstart.bind(this),false);this._element.addEventListener('dragover',this._ondragover.bind(this),false);this._element.addEventListener('dragleave',this._ondragleave.bind(this),false);this._element.addEventListener('drop',this._ondrop.bind(this),false);this._element.addEventListener('dragend',this._ondragend.bind(this),false);this._element.addEventListener('contextmenu',this._contextMenuEventFired.bind(this),false);this._element.addEventListener('clipboard-beforecopy',this._onBeforeCopy.bind(this),false);this._element.addEventListener('clipboard-copy',this._onCopyOrCut.bind(this,false),false);this._element.addEventListener('clipboard-cut',this._onCopyOrCut.bind(this,true),false);this._element.addEventListener('clipboard-paste',this._onPaste.bind(this),false);this._element.addEventListener('keydown',this._onKeyDown.bind(this),false);outlineDisclosureElement.appendChild(this._element);this.element=shadowContainer;this._includeRootDOMNode=!omitRootDOMNode;this._selectEnabled=selectEnabled;this._rootDOMNode=null;this._selectedDOMNode=null;this._visible=false;this._popoverHelper=new PopoverHelper.PopoverHelper(this._element,this._getPopoverRequest.bind(this));this._popoverHelper.setHasPadding(true);this._popoverHelper.setTimeout(0,100);this._updateRecords=new Map();this._treeElementsBeingUpdated=new Set();this._showHTMLCommentsSetting=Settings.Settings.instance().moduleSetting('showHTMLComments');this._showHTMLCommentsSetting.addChangeListener(this._onShowHTMLCommentsChange.bind(this));this.useLightSelectionColor();}
static forDOMModel(domModel){return domModel[ElementsTreeOutline._treeOutlineSymbol]||null;}
_onShowHTMLCommentsChange(){const selectedNode=this.selectedDOMNode();if(selectedNode&&selectedNode.nodeType()===Node.COMMENT_NODE&&!this._showHTMLCommentsSetting.get()){this.selectDOMNode(selectedNode.parentNode);}
this.update();}
treeElementSymbol(){return this._treeElementSymbol;}
setWordWrap(wrap){this._element.classList.toggle('elements-tree-nowrap',!wrap);}
setMultilineEditing(multilineEditing){this._multilineEditing=multilineEditing;}
visibleWidth(){return this._visibleWidth;}
setVisibleWidth(width){this._visibleWidth=width;if(this._multilineEditing){this._multilineEditing.resize();}}
_setClipboardData(data){if(this._clipboardNodeData){const treeElement=this.findTreeElement(this._clipboardNodeData.node);if(treeElement){treeElement.setInClipboard(false);}
delete this._clipboardNodeData;}
if(data){const treeElement=this.findTreeElement(data.node);if(treeElement){treeElement.setInClipboard(true);}
this._clipboardNodeData=data;}}
resetClipboardIfNeeded(removedNode){if(this._clipboardNodeData&&this._clipboardNodeData.node===removedNode){this._setClipboardData(null);}}
_onBeforeCopy(event){event.handled=true;}
_onCopyOrCut(isCut,event){this._setClipboardData(null);const originalEvent=event['original'];if(originalEvent.target.hasSelection()){return;}
if(UIUtils.isEditing()){return;}
const targetNode=this.selectedDOMNode();if(!targetNode){return;}
originalEvent.clipboardData.clearData();event.handled=true;this.performCopyOrCut(isCut,targetNode);}
performCopyOrCut(isCut,node){if(isCut&&(node.isShadowRoot()||node.ancestorUserAgentShadowRoot())){return;}
node.copyNode();this._setClipboardData({node:node,isCut:isCut});}
canPaste(targetNode){if(targetNode.isShadowRoot()||targetNode.ancestorUserAgentShadowRoot()){return false;}
if(!this._clipboardNodeData){return false;}
const node=this._clipboardNodeData.node;if(this._clipboardNodeData.isCut&&(node===targetNode||node.isAncestor(targetNode))){return false;}
if(targetNode.domModel()!==node.domModel()){return false;}
return true;}
pasteNode(targetNode){if(this.canPaste(targetNode)){this._performPaste(targetNode);}}
_onPaste(event){if(UIUtils.isEditing()){return;}
const targetNode=this.selectedDOMNode();if(!targetNode||!this.canPaste(targetNode)){return;}
event.handled=true;this._performPaste(targetNode);}
_performPaste(targetNode){if(this._clipboardNodeData.isCut){this._clipboardNodeData.node.moveTo(targetNode,null,expandCallback.bind(this));this._setClipboardData(null);}else{this._clipboardNodeData.node.copyTo(targetNode,null,expandCallback.bind(this));}
function expandCallback(error,nodeId){if(error){return;}
const pastedNode=targetNode.domModel().nodeForId(nodeId);if(!pastedNode){return;}
this.selectDOMNode(pastedNode);}}
setVisible(visible){if(visible===this._visible){return;}
this._visible=visible;if(!this._visible){this._popoverHelper.hidePopover();if(this._multilineEditing){this._multilineEditing.cancel();}
return;}
this.runPendingUpdates();if(this._selectedDOMNode){this._revealAndSelectNode(this._selectedDOMNode,false);}}
get rootDOMNode(){return this._rootDOMNode;}
set rootDOMNode(x){if(this._rootDOMNode===x){return;}
this._rootDOMNode=x;this._isXMLMimeType=x&&x.isXMLNode();this.update();}
get isXMLMimeType(){return this._isXMLMimeType;}
selectedDOMNode(){return this._selectedDOMNode;}
selectDOMNode(node,focus){if(this._selectedDOMNode===node){this._revealAndSelectNode(node,!focus);return;}
this._selectedDOMNode=node;this._revealAndSelectNode(node,!focus);if(this._selectedDOMNode===node){this._selectedNodeChanged(!!focus);}}
editing(){const node=this.selectedDOMNode();if(!node){return false;}
const treeElement=this.findTreeElement(node);if(!treeElement){return false;}
return treeElement.isEditing()||false;}
update(){const selectedNode=this.selectedDOMNode();this.removeChildren();if(!this.rootDOMNode){return;}
if(this._includeRootDOMNode){const treeElement=this._createElementTreeElement(this.rootDOMNode);this.appendChild(treeElement);}else{const children=this._visibleChildren(this.rootDOMNode);for(const child of children){const treeElement=this._createElementTreeElement(child);this.appendChild(treeElement);}}
if(selectedNode){this._revealAndSelectNode(selectedNode,true);}}
_selectedNodeChanged(focus){this.dispatchEventToListeners(ElementsTreeOutline.Events.SelectedNodeChanged,{node:this._selectedDOMNode,focus:focus});}
_fireElementsTreeUpdated(nodes){this.dispatchEventToListeners(ElementsTreeOutline.Events.ElementsTreeUpdated,nodes);}
findTreeElement(node){let treeElement=this._lookUpTreeElement(node);if(!treeElement&&node.nodeType()===Node.TEXT_NODE){treeElement=this._lookUpTreeElement(node.parentNode);}
return(treeElement);}
_lookUpTreeElement(node){if(!node){return null;}
const cachedElement=node[this._treeElementSymbol];if(cachedElement){return cachedElement;}
const ancestors=[];let currentNode;for(currentNode=node.parentNode;currentNode;currentNode=currentNode.parentNode){ancestors.push(currentNode);if(currentNode[this._treeElementSymbol])
{break;}}
if(!currentNode){return null;}
for(let i=ancestors.length-1;i>=0;--i){const child=ancestors[i-1]||node;const treeElement=ancestors[i][this._treeElementSymbol];if(treeElement){treeElement.onpopulate();if(child.index>=treeElement.expandedChildrenLimit()){this.setExpandedChildrenLimit(treeElement,child.index+1);}}}
return node[this._treeElementSymbol];}
createTreeElementFor(node){let treeElement=this.findTreeElement(node);if(treeElement){return treeElement;}
if(!node.parentNode){return null;}
treeElement=this.createTreeElementFor(node.parentNode);return treeElement?this._showChild(treeElement,node):null;}
set suppressRevealAndSelect(x){if(this._suppressRevealAndSelect===x){return;}
this._suppressRevealAndSelect=x;}
_revealAndSelectNode(node,omitFocus){if(this._suppressRevealAndSelect){return;}
if(!this._includeRootDOMNode&&node===this.rootDOMNode&&this.rootDOMNode){node=this.rootDOMNode.firstChild;}
if(!node){return;}
const treeElement=this.createTreeElementFor(node);if(!treeElement){return;}
treeElement.revealAndSelect(omitFocus);}
_treeElementFromEvent(event){const scrollContainer=this.element.parentElement;const x=scrollContainer.totalOffsetLeft()+scrollContainer.offsetWidth-36;const y=event.pageY;const elementUnderMouse=this.treeElementFromPoint(x,y);const elementAboveMouse=this.treeElementFromPoint(x,y-2);let element;if(elementUnderMouse===elementAboveMouse){element=elementUnderMouse;}else{element=this.treeElementFromPoint(x,y+2);}
return element;}
_getPopoverRequest(event){let link=event.target;while(link&&!link[HrefSymbol]){link=link.parentElementOrShadowHost();}
if(!link){return null;}
return{box:link.boxInWindow(),show:async popover=>{const listItem=link.enclosingNodeOrSelfWithNodeName('li');if(!listItem){return false;}
const node=(listItem.treeElement).node();const precomputedFeatures=await ImagePreview.ImagePreview.loadDimensionsForNode(node);const preview=await ImagePreview.ImagePreview.build(node.domModel().target(),link[HrefSymbol],true,{precomputedFeatures});if(preview){popover.contentElement.appendChild(preview);}
return!!preview;}};}
_onfocusout(event){OverlayModel.OverlayModel.hideDOMNodeHighlight();}
_onmousedown(event){const element=this._treeElementFromEvent(event);if(!element||element.isEventWithinDisclosureTriangle(event)){return;}
element.select();}
setHoverEffect(treeElement){if(this._previousHoveredElement===treeElement){return;}
if(this._previousHoveredElement){this._previousHoveredElement.hovered=false;delete this._previousHoveredElement;}
if(treeElement){treeElement.hovered=true;this._previousHoveredElement=treeElement;}}
_onmousemove(event){const element=this._treeElementFromEvent(event);if(element&&this._previousHoveredElement===element){return;}
this.setHoverEffect(element);this._highlightTreeElement((element),!KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(event));}
_highlightTreeElement(element,showInfo){if(element instanceof ElementsTreeElement){element.node().domModel().overlayModel().highlightInOverlay({node:element.node()},'all',showInfo);return;}
if(element instanceof ShortcutTreeElement){element.domModel().overlayModel().highlightInOverlay({deferredNode:element.deferredNode()},'all',showInfo);}}
_onmouseleave(event){this.setHoverEffect(null);OverlayModel.OverlayModel.hideDOMNodeHighlight();}
_ondragstart(event){if(event.target.hasSelection()){return false;}
if(event.target.nodeName==='A'){return false;}
const treeElement=this._validDragSourceOrTarget(this._treeElementFromEvent(event));if(!treeElement){return false;}
if(treeElement.node().nodeName()==='BODY'||treeElement.node().nodeName()==='HEAD'){return false;}
event.dataTransfer.setData('text/plain',treeElement.listItemElement.textContent.replace(/\u200b/g,''));event.dataTransfer.effectAllowed='copyMove';this._treeElementBeingDragged=treeElement;OverlayModel.OverlayModel.hideDOMNodeHighlight();return true;}
_ondragover(event){if(!this._treeElementBeingDragged){return false;}
const treeElement=this._validDragSourceOrTarget(this._treeElementFromEvent(event));if(!treeElement){return false;}
let node=treeElement.node();while(node){if(node===this._treeElementBeingDragged._node){return false;}
node=node.parentNode;}
treeElement.listItemElement.classList.add('elements-drag-over');this._dragOverTreeElement=treeElement;event.preventDefault();event.dataTransfer.dropEffect='move';return false;}
_ondragleave(event){this._clearDragOverTreeElementMarker();event.preventDefault();return false;}
_validDragSourceOrTarget(treeElement){if(!treeElement){return null;}
if(!(treeElement instanceof ElementsTreeElement)){return null;}
const elementsTreeElement=(treeElement);const node=elementsTreeElement.node();if(!node.parentNode||node.parentNode.nodeType()!==Node.ELEMENT_NODE){return null;}
return elementsTreeElement;}
_ondrop(event){event.preventDefault();const treeElement=this._treeElementFromEvent(event);if(treeElement instanceof ElementsTreeElement){this._doMove(treeElement);}}
_doMove(treeElement){if(!this._treeElementBeingDragged){return;}
let parentNode;let anchorNode;if(treeElement.isClosingTag()){parentNode=treeElement.node();}else{const dragTargetNode=treeElement.node();parentNode=dragTargetNode.parentNode;anchorNode=dragTargetNode;}
const wasExpanded=this._treeElementBeingDragged.expanded;this._treeElementBeingDragged._node.moveTo(parentNode,anchorNode,this.selectNodeAfterEdit.bind(this,wasExpanded));delete this._treeElementBeingDragged;}
_ondragend(event){event.preventDefault();this._clearDragOverTreeElementMarker();delete this._treeElementBeingDragged;}
_clearDragOverTreeElementMarker(){if(this._dragOverTreeElement){this._dragOverTreeElement.listItemElement.classList.remove('elements-drag-over');delete this._dragOverTreeElement;}}
_contextMenuEventFired(event){const treeElement=this._treeElementFromEvent(event);if(treeElement instanceof ElementsTreeElement){this.showContextMenu(treeElement,event);}}
showContextMenu(treeElement,event){if(UIUtils.isEditing()){return;}
const contextMenu=new ContextMenu.ContextMenu(event);const isPseudoElement=!!treeElement.node().pseudoType();const isTag=treeElement.node().nodeType()===Node.ELEMENT_NODE&&!isPseudoElement;let textNode=event.target.enclosingNodeOrSelfWithClass('webkit-html-text-node');if(textNode&&textNode.classList.contains('bogus')){textNode=null;}
const commentNode=event.target.enclosingNodeOrSelfWithClass('webkit-html-comment');contextMenu.saveSection().appendItem(ls`Store as global variable`,this._saveNodeToTempVariable.bind(this,treeElement.node()));if(textNode){treeElement.populateTextContextMenu(contextMenu,textNode);}else if(isTag){treeElement.populateTagContextMenu(contextMenu,event);}else if(commentNode){treeElement.populateNodeContextMenu(contextMenu);}else if(isPseudoElement){treeElement.populateScrollIntoView(contextMenu);}
contextMenu.appendApplicableItems(treeElement.node());contextMenu.show();}
async _saveNodeToTempVariable(node){const remoteObjectForConsole=await node.resolveToObject();await ConsoleModel.ConsoleModel.instance().saveToTempVariable(self.UI.context.flavor(RuntimeModel.ExecutionContext),remoteObjectForConsole);}
runPendingUpdates(){this._updateModifiedNodes();}
_onKeyDown(event){const keyboardEvent=(event);if(UIUtils.isEditing()){return;}
const node=this.selectedDOMNode();if(!node){return;}
const treeElement=node[this._treeElementSymbol];if(!treeElement){return;}
if(KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta(keyboardEvent)&&node.parentNode){if(keyboardEvent.key==='ArrowUp'&&node.previousSibling){node.moveTo(node.parentNode,node.previousSibling,this.selectNodeAfterEdit.bind(this,treeElement.expanded));keyboardEvent.consume(true);return;}
if(keyboardEvent.key==='ArrowDown'&&node.nextSibling){node.moveTo(node.parentNode,node.nextSibling.nextSibling,this.selectNodeAfterEdit.bind(this,treeElement.expanded));keyboardEvent.consume(true);return;}}}
toggleEditAsHTML(node,startEditing,callback){const treeElement=node[this._treeElementSymbol];if(!treeElement||!treeElement.hasEditableNode()){return;}
if(node.pseudoType()){return;}
const parentNode=node.parentNode;const index=node.index;const wasExpanded=treeElement.expanded;treeElement.toggleEditAsHTML(editingFinished.bind(this),startEditing);function editingFinished(success){if(callback){callback();}
if(!success){return;}
this.runPendingUpdates();const newNode=parentNode?parentNode.children()[index]||parentNode:null;if(!newNode){return;}
this.selectDOMNode(newNode,true);if(wasExpanded){const newTreeItem=this.findTreeElement(newNode);if(newTreeItem){newTreeItem.expand();}}}}
selectNodeAfterEdit(wasExpanded,error,newNode){if(error){return null;}
this.runPendingUpdates();if(!newNode){return null;}
this.selectDOMNode(newNode,true);const newTreeItem=this.findTreeElement(newNode);if(wasExpanded){if(newTreeItem){newTreeItem.expand();}}
return newTreeItem;}
async toggleHideElement(node){const pseudoType=node.pseudoType();const effectiveNode=pseudoType?node.parentNode:node;if(!effectiveNode){return;}
const hidden=node.marker('hidden-marker');const object=await effectiveNode.resolveToObject('');if(!object){return;}
await object.callFunction(toggleClassAndInjectStyleRule,[{value:pseudoType},{value:!hidden}]);object.release();node.setMarker('hidden-marker',hidden?null:true);function toggleClassAndInjectStyleRule(pseudoType,hidden){const classNamePrefix='__web-inspector-hide';const classNameSuffix='-shortcut__';const styleTagId='__web-inspector-hide-shortcut-style__';const selectors=[];selectors.push('.__web-inspector-hide-shortcut__');selectors.push('.__web-inspector-hide-shortcut__ *');selectors.push('.__web-inspector-hidebefore-shortcut__::before');selectors.push('.__web-inspector-hideafter-shortcut__::after');const selector=selectors.join(', ');const ruleBody='    visibility: hidden !important;';const rule='\n'+selector+'\n{\n'+ruleBody+'\n}\n';const className=classNamePrefix+(pseudoType||'')+classNameSuffix;this.classList.toggle(className,hidden);let localRoot=this;while(localRoot.parentNode){localRoot=localRoot.parentNode;}
if(localRoot.nodeType===Node.DOCUMENT_NODE){localRoot=document.head;}
let style=localRoot.querySelector('style#'+styleTagId);if(style){return;}
style=document.createElement('style');style.id=styleTagId;style.textContent=rule;localRoot.appendChild(style);}}
isToggledToHidden(node){return!!node.marker('hidden-marker');}
_reset(){this.rootDOMNode=null;this.selectDOMNode(null,false);this._popoverHelper.hidePopover();delete this._clipboardNodeData;OverlayModel.OverlayModel.hideDOMNodeHighlight();this._updateRecords.clear();}
wireToDOMModel(domModel){domModel[ElementsTreeOutline._treeOutlineSymbol]=this;domModel.addEventListener(DOMModel.Events.MarkersChanged,this._markersChanged,this);domModel.addEventListener(DOMModel.Events.NodeInserted,this._nodeInserted,this);domModel.addEventListener(DOMModel.Events.NodeRemoved,this._nodeRemoved,this);domModel.addEventListener(DOMModel.Events.AttrModified,this._attributeModified,this);domModel.addEventListener(DOMModel.Events.AttrRemoved,this._attributeRemoved,this);domModel.addEventListener(DOMModel.Events.CharacterDataModified,this._characterDataModified,this);domModel.addEventListener(DOMModel.Events.DocumentUpdated,this._documentUpdated,this);domModel.addEventListener(DOMModel.Events.ChildNodeCountUpdated,this._childNodeCountUpdated,this);domModel.addEventListener(DOMModel.Events.DistributedNodesChanged,this._distributedNodesChanged,this);}
unwireFromDOMModel(domModel){domModel.removeEventListener(DOMModel.Events.MarkersChanged,this._markersChanged,this);domModel.removeEventListener(DOMModel.Events.NodeInserted,this._nodeInserted,this);domModel.removeEventListener(DOMModel.Events.NodeRemoved,this._nodeRemoved,this);domModel.removeEventListener(DOMModel.Events.AttrModified,this._attributeModified,this);domModel.removeEventListener(DOMModel.Events.AttrRemoved,this._attributeRemoved,this);domModel.removeEventListener(DOMModel.Events.CharacterDataModified,this._characterDataModified,this);domModel.removeEventListener(DOMModel.Events.DocumentUpdated,this._documentUpdated,this);domModel.removeEventListener(DOMModel.Events.ChildNodeCountUpdated,this._childNodeCountUpdated,this);domModel.removeEventListener(DOMModel.Events.DistributedNodesChanged,this._distributedNodesChanged,this);delete domModel[ElementsTreeOutline._treeOutlineSymbol];}
_addUpdateRecord(node){let record=this._updateRecords.get(node);if(!record){record=new UpdateRecord();this._updateRecords.set(node,record);}
return record;}
_updateRecordForHighlight(node){if(!this._visible){return null;}
return this._updateRecords.get(node)||null;}
_documentUpdated(event){const domModel=(event.data);this._reset();if(domModel.existingDocument()){this.rootDOMNode=domModel.existingDocument();}}
_attributeModified(event){const node=(event.data.node);this._addUpdateRecord(node).attributeModified(event.data.name);this._updateModifiedNodesSoon();}
_attributeRemoved(event){const node=(event.data.node);this._addUpdateRecord(node).attributeRemoved(event.data.name);this._updateModifiedNodesSoon();}
_characterDataModified(event){const node=(event.data);this._addUpdateRecord(node).charDataModified();if(node.parentNode&&node.parentNode.firstChild===node.parentNode.lastChild){this._addUpdateRecord(node.parentNode).childrenModified();}
this._updateModifiedNodesSoon();}
_nodeInserted(event){const node=(event.data);this._addUpdateRecord((node.parentNode)).nodeInserted(node);this._updateModifiedNodesSoon();}
_nodeRemoved(event){const node=(event.data.node);const parentNode=(event.data.parent);this.resetClipboardIfNeeded(node);this._addUpdateRecord(parentNode).nodeRemoved(node);this._updateModifiedNodesSoon();}
_childNodeCountUpdated(event){const node=(event.data);this._addUpdateRecord(node).childrenModified();this._updateModifiedNodesSoon();}
_distributedNodesChanged(event){const node=(event.data);this._addUpdateRecord(node).childrenModified();this._updateModifiedNodesSoon();}
_updateModifiedNodesSoon(){if(!this._updateRecords.size){return;}
if(this._updateModifiedNodesTimeout){return;}
this._updateModifiedNodesTimeout=setTimeout(this._updateModifiedNodes.bind(this),50);}
_updateModifiedNodes(){if(this._updateModifiedNodesTimeout){clearTimeout(this._updateModifiedNodesTimeout);delete this._updateModifiedNodesTimeout;}
const updatedNodes=[...this._updateRecords.keys()];const hidePanelWhileUpdating=updatedNodes.length>10;let treeOutlineContainerElement;let originalScrollTop;if(hidePanelWhileUpdating){treeOutlineContainerElement=this.element.parentNode;originalScrollTop=treeOutlineContainerElement?treeOutlineContainerElement.scrollTop:0;this._element.classList.add('hidden');}
if(this._rootDOMNode&&this._updateRecords.get(this._rootDOMNode)&&this._updateRecords.get(this._rootDOMNode).hasChangedChildren()){this.update();}else{for(const node of this._updateRecords.keys()){if(this._updateRecords.get(node).hasChangedChildren()){this._updateModifiedParentNode(node);}else{this._updateModifiedNode(node);}}}
if(hidePanelWhileUpdating){this._element.classList.remove('hidden');if(originalScrollTop){treeOutlineContainerElement.scrollTop=originalScrollTop;}}
this._updateRecords.clear();this._fireElementsTreeUpdated(updatedNodes);}
_updateModifiedNode(node){const treeElement=this.findTreeElement(node);if(treeElement){treeElement.updateTitle(this._updateRecordForHighlight(node));}}
_updateModifiedParentNode(node){const parentTreeElement=this.findTreeElement(node);if(parentTreeElement){parentTreeElement.setExpandable(this._hasVisibleChildren(node));parentTreeElement.updateTitle(this._updateRecordForHighlight(node));if(parentTreeElement.populated){this._updateChildren(parentTreeElement);}}}
populateTreeElement(treeElement){if(treeElement.childCount()||!treeElement.isExpandable()){return Promise.resolve();}
return new Promise(resolve=>{treeElement.node().getChildNodes(()=>{treeElement.populated=true;this._updateModifiedParentNode(treeElement.node());resolve();});});}
_createElementTreeElement(node,closingTag){const treeElement=new ElementsTreeElement(node,closingTag);treeElement.setExpandable(!closingTag&&this._hasVisibleChildren(node));if(node.nodeType()===Node.ELEMENT_NODE&&node.parentNode&&node.parentNode.nodeType()===Node.DOCUMENT_NODE&&!node.parentNode.parentNode){treeElement.setCollapsible(false);}
treeElement.selectable=this._selectEnabled;return treeElement;}
_showChild(treeElement,child){if(treeElement.isClosingTag()){return null;}
const index=this._visibleChildren(treeElement.node()).indexOf(child);if(index===-1){return null;}
if(index>=treeElement.expandedChildrenLimit()){this.setExpandedChildrenLimit(treeElement,index+1);}
return(treeElement.childAt(index));}
_visibleChildren(node){let visibleChildren=ElementsTreeElement.visibleShadowRoots(node);const contentDocument=node.contentDocument();if(contentDocument){visibleChildren.push(contentDocument);}
const importedDocument=node.importedDocument();if(importedDocument){visibleChildren.push(importedDocument);}
const templateContent=node.templateContent();if(templateContent){visibleChildren.push(templateContent);}
const markerPseudoElement=node.markerPseudoElement();if(markerPseudoElement){visibleChildren.push(markerPseudoElement);}
const beforePseudoElement=node.beforePseudoElement();if(beforePseudoElement){visibleChildren.push(beforePseudoElement);}
if(node.childNodeCount()){let children=node.children()||[];if(!this._showHTMLCommentsSetting.get()){children=children.filter(n=>n.nodeType()!==Node.COMMENT_NODE);}
visibleChildren=visibleChildren.concat(children);}
const afterPseudoElement=node.afterPseudoElement();if(afterPseudoElement){visibleChildren.push(afterPseudoElement);}
return visibleChildren;}
_hasVisibleChildren(node){if(node.isIframe()){return true;}
if(node.isPortal()){return true;}
if(node.contentDocument()){return true;}
if(node.importedDocument()){return true;}
if(node.templateContent()){return true;}
if(ElementsTreeElement.visibleShadowRoots(node).length){return true;}
if(node.hasPseudoElements()){return true;}
if(node.isInsertionPoint()){return true;}
return!!node.childNodeCount()&&!ElementsTreeElement.canShowInlineText(node);}
_createExpandAllButtonTreeElement(treeElement){const button=UIUtils.createTextButton('',handleLoadAllChildren.bind(this));button.value='';const expandAllButtonElement=new TreeOutline.TreeElement(button);expandAllButtonElement.selectable=false;expandAllButtonElement.expandAllButton=true;expandAllButtonElement.button=button;return expandAllButtonElement;function handleLoadAllChildren(event){const visibleChildCount=this._visibleChildren(treeElement.node()).length;this.setExpandedChildrenLimit(treeElement,Math.max(visibleChildCount,treeElement.expandedChildrenLimit()+InitialChildrenLimit));event.consume();}}
setExpandedChildrenLimit(treeElement,expandedChildrenLimit){if(treeElement.expandedChildrenLimit()===expandedChildrenLimit){return;}
treeElement.setExpandedChildrenLimit(expandedChildrenLimit);if(treeElement.treeOutline&&!this._treeElementsBeingUpdated.has(treeElement)){this._updateModifiedParentNode(treeElement.node());}}
_updateChildren(treeElement){if(!treeElement.isExpandable()){const selectedTreeElement=treeElement.treeOutline.selectedTreeElement;if(selectedTreeElement&&selectedTreeElement.hasAncestor(treeElement)){treeElement.select(true);}
treeElement.removeChildren();return;}
console.assert(!treeElement.isClosingTag());this._innerUpdateChildren(treeElement);}
insertChildElement(treeElement,child,index,closingTag){const newElement=this._createElementTreeElement(child,closingTag);treeElement.insertChild(newElement,index);return newElement;}
_moveChild(treeElement,child,targetIndex){if(treeElement.indexOfChild(child)===targetIndex){return;}
const wasSelected=child.selected;if(child.parent){child.parent.removeChild(child);}
treeElement.insertChild(child,targetIndex);if(wasSelected){child.select();}}
_innerUpdateChildren(treeElement){if(this._treeElementsBeingUpdated.has(treeElement)){return;}
this._treeElementsBeingUpdated.add(treeElement);const node=treeElement.node();const visibleChildren=this._visibleChildren(node);const visibleChildrenSet=new Set(visibleChildren);const existingTreeElements=new Map();for(let i=treeElement.childCount()-1;i>=0;--i){const existingTreeElement=treeElement.childAt(i);if(!(existingTreeElement instanceof ElementsTreeElement)){treeElement.removeChildAtIndex(i);continue;}
const elementsTreeElement=(existingTreeElement);const existingNode=elementsTreeElement.node();if(visibleChildrenSet.has(existingNode)){existingTreeElements.set(existingNode,existingTreeElement);continue;}
treeElement.removeChildAtIndex(i);}
for(let i=0;i<visibleChildren.length&&i<treeElement.expandedChildrenLimit();++i){const child=visibleChildren[i];const existingTreeElement=existingTreeElements.get(child)||this.findTreeElement(child);if(existingTreeElement&&existingTreeElement!==treeElement){this._moveChild(treeElement,existingTreeElement,i);}else{const newElement=this.insertChildElement(treeElement,child,i);if(this._updateRecordForHighlight(node)&&treeElement.expanded){ElementsTreeElement.animateOnDOMUpdate(newElement);}
if(treeElement.childCount()>treeElement.expandedChildrenLimit()){this.setExpandedChildrenLimit(treeElement,treeElement.expandedChildrenLimit()+1);}}}
const expandedChildCount=treeElement.childCount();if(visibleChildren.length>expandedChildCount){const targetButtonIndex=expandedChildCount;if(!treeElement.expandAllButtonElement){treeElement.expandAllButtonElement=this._createExpandAllButtonTreeElement(treeElement);}
treeElement.insertChild(treeElement.expandAllButtonElement,targetButtonIndex);treeElement.expandAllButtonElement.button.textContent=UIString.UIString('Show All Nodes (%d More)',visibleChildren.length-expandedChildCount);}else if(treeElement.expandAllButtonElement){delete treeElement.expandAllButtonElement;}
if(node.isInsertionPoint()){for(const distributedNode of node.distributedNodes()){treeElement.appendChild(new ShortcutTreeElement(distributedNode));}}
if(node.nodeType()===Node.ELEMENT_NODE&&!node.pseudoType()&&treeElement.isExpandable()){this.insertChildElement(treeElement,node,treeElement.childCount(),true);}
this._treeElementsBeingUpdated.delete(treeElement);}
_markersChanged(event){const node=(event.data);const treeElement=node[this._treeElementSymbol];if(treeElement){treeElement.updateDecorations();}}}
ElementsTreeOutline._treeOutlineSymbol=Symbol('treeOutline');ElementsTreeOutline.Events={SelectedNodeChanged:Symbol('SelectedNodeChanged'),ElementsTreeUpdated:Symbol('ElementsTreeUpdated')};const MappedCharToEntity={'\xA0':'nbsp','\x93':'#147','\xAD':'shy','\u2002':'ensp','\u2003':'emsp','\u2009':'thinsp','\u200a':'#8202','\u200b':'#8203','\u200c':'zwnj','\u200d':'zwj','\u200e':'lrm','\u200f':'rlm','\u202a':'#8234','\u202b':'#8235','\u202c':'#8236','\u202d':'#8237','\u202e':'#8238','\ufeff':'#65279'};class UpdateRecord{attributeModified(attrName){if(this._removedAttributes&&this._removedAttributes.has(attrName)){this._removedAttributes.delete(attrName);}
if(!this._modifiedAttributes){this._modifiedAttributes=(new Set());}
this._modifiedAttributes.add(attrName);}
attributeRemoved(attrName){if(this._modifiedAttributes&&this._modifiedAttributes.has(attrName)){this._modifiedAttributes.delete(attrName);}
if(!this._removedAttributes){this._removedAttributes=(new Set());}
this._removedAttributes.add(attrName);}
nodeInserted(node){this._hasChangedChildren=true;}
nodeRemoved(node){this._hasChangedChildren=true;this._hasRemovedChildren=true;}
charDataModified(){this._charDataModified=true;}
childrenModified(){this._hasChangedChildren=true;}
isAttributeModified(attributeName){return this._modifiedAttributes&&this._modifiedAttributes.has(attributeName);}
hasRemovedAttributes(){return!!this._removedAttributes&&!!this._removedAttributes.size;}
isCharDataModified(){return!!this._charDataModified;}
hasChangedChildren(){return!!this._hasChangedChildren;}
hasRemovedChildren(){return!!this._hasRemovedChildren;}}
class Renderer{async render(object){let node;if(object instanceof DOMModel.DOMNode){node=(object);}else if(object instanceof DOMModel.DeferredDOMNode){node=await((object)).resolvePromise();}
if(!node){return null;}
const treeOutline=new ElementsTreeOutline(false,true,true);treeOutline.rootDOMNode=node;if(!treeOutline.firstChild().isExpandable()){treeOutline._element.classList.add('single-node');}
treeOutline.setVisible(true);treeOutline.element.treeElementForTest=treeOutline.firstChild();treeOutline.setShowSelectionOnKeyboardFocus(true,true);return{node:treeOutline.element,tree:treeOutline};}}
class ShortcutTreeElement extends TreeOutline.TreeElement{constructor(nodeShortcut){super('');this.listItemElement.createChild('div','selection fill');const title=this.listItemElement.createChild('span','elements-tree-shortcut-title');let text=nodeShortcut.nodeName.toLowerCase();if(nodeShortcut.nodeType===Node.ELEMENT_NODE){text='<'+text+'>';}
title.textContent='\u21AA '+text;const link=linkifyDeferredNodeReference(nodeShortcut.deferredNode);this.listItemElement.createTextChild(' ');link.classList.add('elements-tree-shortcut-link');link.textContent=UIString.UIString('reveal');this.listItemElement.appendChild(link);this._nodeShortcut=nodeShortcut;}
get hovered(){return this._hovered;}
set hovered(x){if(this._hovered===x){return;}
this._hovered=x;this.listItemElement.classList.toggle('hovered',x);}
deferredNode(){return this._nodeShortcut.deferredNode;}
domModel(){return this._nodeShortcut.deferredNode.domModel();}
onselect(selectedByUser){if(!selectedByUser){return true;}
this._nodeShortcut.deferredNode.highlight();this._nodeShortcut.deferredNode.resolve(resolved.bind(this));function resolved(node){if(node){this.treeOutline._selectedDOMNode=node;this.treeOutline._selectedNodeChanged();}}
return true;}}
let MultilineEditorController;let ClipboardData;var ElementsTreeOutline$1=Object.freeze({__proto__:null,ElementsTreeOutline:ElementsTreeOutline,MappedCharToEntity:MappedCharToEntity,UpdateRecord:UpdateRecord,Renderer:Renderer,ShortcutTreeElement:ShortcutTreeElement,MultilineEditorController:MultilineEditorController,ClipboardData:ClipboardData});class MarkerDecorator{decorate(node){}}
class GenericDecorator{constructor(extension){this._title=UIString.UIString(extension.title());this._color=extension.descriptor()['color'];}
decorate(node){return{title:this._title,color:this._color};}}
var MarkerDecorator$1=Object.freeze({__proto__:null,MarkerDecorator:MarkerDecorator,GenericDecorator:GenericDecorator});class ElementsTreeElement extends TreeOutline.TreeElement{constructor(node,elementCloseTag){super();this._node=node;this._gutterContainer=this.listItemElement.createChild('div','gutter-container');this._gutterContainer.addEventListener('click',this._showContextMenu.bind(this));const gutterMenuIcon=Icon.Icon.create('largeicon-menu','gutter-menu-icon');this._gutterContainer.appendChild(gutterMenuIcon);this._decorationsElement=this._gutterContainer.createChild('div','hidden');this._elementCloseTag=elementCloseTag;if(this._node.nodeType()===Node.ELEMENT_NODE&&!elementCloseTag){this._canAddAttributes=true;}
this._searchQuery=null;this._expandedChildrenLimit=InitialChildrenLimit;this._decorationsThrottler=new Throttler.Throttler(100);this._htmlEditElement;}
static animateOnDOMUpdate(treeElement){const tagName=treeElement.listItemElement.querySelector('.webkit-html-tag-name');UIUtils.runCSSAnimationOnce(tagName||treeElement.listItemElement,'dom-update-highlight');}
static visibleShadowRoots(node){let roots=node.shadowRoots();if(roots.length&&!Settings.Settings.instance().moduleSetting('showUAShadowDOM').get()){roots=roots.filter(filter);}
function filter(root){return root.shadowRootType()!==DOMModel.DOMNode.ShadowRootTypes.UserAgent;}
return roots;}
static canShowInlineText(node){if(node.contentDocument()||node.importedDocument()||node.templateContent()||ElementsTreeElement.visibleShadowRoots(node).length||node.hasPseudoElements()){return false;}
if(node.nodeType()!==Node.ELEMENT_NODE){return false;}
if(!node.firstChild||node.firstChild!==node.lastChild||node.firstChild.nodeType()!==Node.TEXT_NODE){return false;}
const textChild=node.firstChild;const maxInlineTextChildLength=80;if(textChild.nodeValue().length<maxInlineTextChildLength){return true;}
return false;}
static populateForcedPseudoStateItems(contextMenu,node){const pseudoClasses=['active','hover','focus','visited','focus-within'];try{document.querySelector(':focus-visible');pseudoClasses.push('focus-visible');}catch(e){}
const forcedPseudoState=node.domModel().cssModel().pseudoState(node);const stateMenu=contextMenu.debugSection().appendSubMenuItem(UIString.UIString('Force state'));for(let i=0;i<pseudoClasses.length;++i){const pseudoClassForced=forcedPseudoState.indexOf(pseudoClasses[i])>=0;stateMenu.defaultSection().appendCheckboxItem(':'+pseudoClasses[i],setPseudoStateCallback.bind(null,pseudoClasses[i],!pseudoClassForced),pseudoClassForced,false);}
function setPseudoStateCallback(pseudoState,enabled){node.domModel().cssModel().forcePseudoState(node,pseudoState,enabled);}}
isClosingTag(){return!!this._elementCloseTag;}
node(){return this._node;}
isEditing(){return!!this._editing;}
highlightSearchResults(searchQuery){if(this._searchQuery!==searchQuery){this._hideSearchHighlight();}
this._searchQuery=searchQuery;this._searchHighlightsVisible=true;this.updateTitle(null,true);}
hideSearchHighlights(){delete this._searchHighlightsVisible;this._hideSearchHighlight();}
_hideSearchHighlight(){if(!this._highlightResult){return;}
function updateEntryHide(entry){switch(entry.type){case'added':entry.node.remove();break;case'changed':entry.node.textContent=entry.oldText;break;}}
for(let i=(this._highlightResult.length-1);i>=0;--i){updateEntryHide(this._highlightResult[i]);}
delete this._highlightResult;}
setInClipboard(inClipboard){if(this._inClipboard===inClipboard){return;}
this._inClipboard=inClipboard;this.listItemElement.classList.toggle('in-clipboard',inClipboard);}
get hovered(){return this._hovered;}
set hovered(x){if(this._hovered===x){return;}
this._hovered=x;if(this.listItemElement){if(x){this._createSelection();this.listItemElement.classList.add('hovered');}else{this.listItemElement.classList.remove('hovered');}}}
expandedChildrenLimit(){return this._expandedChildrenLimit;}
setExpandedChildrenLimit(expandedChildrenLimit){this._expandedChildrenLimit=expandedChildrenLimit;}
_createSelection(){const listItemElement=this.listItemElement;if(!listItemElement){return;}
if(!this.selectionElement){this.selectionElement=createElement('div');this.selectionElement.className='selection fill';this.selectionElement.style.setProperty('margin-left',(-this._computeLeftIndent())+'px');listItemElement.insertBefore(this.selectionElement,listItemElement.firstChild);}}
_createHint(){if(this.listItemElement&&!this._hintElement){this._hintElement=this.listItemElement.createChild('span','selected-hint');const selectedElementCommand='$0';this._hintElement.title=ls`Use ${selectedElementCommand} in the console to refer to this element.`;ARIAUtils.markAsHidden(this._hintElement);}}
onbind(){if(!this._elementCloseTag){this._node[this.treeOutline.treeElementSymbol()]=this;}}
onunbind(){if(this._node[this.treeOutline.treeElementSymbol()]===this){this._node[this.treeOutline.treeElementSymbol()]=null;}}
onattach(){if(this._hovered){this._createSelection();this.listItemElement.classList.add('hovered');}
this.updateTitle();this.listItemElement.draggable=true;}
async onpopulate(){return this.treeOutline.populateTreeElement(this);}
async expandRecursively(){await this._node.getSubtree(-1,true);await super.expandRecursively(Number.MAX_VALUE);}
onexpand(){if(this._elementCloseTag){return;}
this.updateTitle();}
oncollapse(){if(this._elementCloseTag){return;}
this.updateTitle();}
select(omitFocus,selectedByUser){if(this._editing){return false;}
return super.select(omitFocus,selectedByUser);}
onselect(selectedByUser){this.treeOutline.suppressRevealAndSelect=true;this.treeOutline.selectDOMNode(this._node,selectedByUser);if(selectedByUser){this._node.highlight();userMetrics.actionTaken(UserMetrics.Action.ChangeInspectedNodeInElementsPanel);}
this._createSelection();this._createHint();this.treeOutline.suppressRevealAndSelect=false;return true;}
ondelete(){const startTagTreeElement=this.treeOutline.findTreeElement(this._node);startTagTreeElement?startTagTreeElement.remove():this.remove();return true;}
onenter(){if(this._editing){return false;}
this._startEditing();return true;}
selectOnMouseDown(event){super.selectOnMouseDown(event);if(this._editing){return;}
if(event.detail>=2){event.preventDefault();}}
ondblclick(event){if(this._editing||this._elementCloseTag){return false;}
if(this._startEditingTarget((event.target))){return false;}
if(this.isExpandable()&&!this.expanded){this.expand();}
return false;}
hasEditableNode(){return!this._node.isShadowRoot()&&!this._node.ancestorUserAgentShadowRoot();}
_insertInLastAttributePosition(tag,node){if(tag.getElementsByClassName('webkit-html-attribute').length>0){tag.insertBefore(node,tag.lastChild);}else{const nodeName=tag.textContent.match(/^<(.*?)>$/)[1];tag.textContent='';tag.createTextChild('<'+nodeName);tag.appendChild(node);tag.createTextChild('>');}}
_startEditingTarget(eventTarget){if(this.treeOutline.selectedDOMNode()!==this._node){return false;}
if(this._node.nodeType()!==Node.ELEMENT_NODE&&this._node.nodeType()!==Node.TEXT_NODE){return false;}
const textNode=eventTarget.enclosingNodeOrSelfWithClass('webkit-html-text-node');if(textNode){return this._startEditingTextNode(textNode);}
const attribute=eventTarget.enclosingNodeOrSelfWithClass('webkit-html-attribute');if(attribute){return this._startEditingAttribute(attribute,eventTarget);}
const tagName=eventTarget.enclosingNodeOrSelfWithClass('webkit-html-tag-name');if(tagName){return this._startEditingTagName(tagName);}
const newAttribute=eventTarget.enclosingNodeOrSelfWithClass('add-attribute');if(newAttribute){return this._addNewAttribute();}
return false;}
_showContextMenu(event){this.treeOutline.showContextMenu(this,event);}
populateTagContextMenu(contextMenu,event){const treeElement=this._elementCloseTag?this.treeOutline.findTreeElement(this._node):this;contextMenu.editSection().appendItem(UIString.UIString('Add attribute'),treeElement._addNewAttribute.bind(treeElement));const attribute=event.target.enclosingNodeOrSelfWithClass('webkit-html-attribute');const newAttribute=event.target.enclosingNodeOrSelfWithClass('add-attribute');if(attribute&&!newAttribute){contextMenu.editSection().appendItem(UIString.UIString('Edit attribute'),this._startEditingAttribute.bind(this,attribute,event.target));}
this.populateNodeContextMenu(contextMenu);ElementsTreeElement.populateForcedPseudoStateItems(contextMenu,treeElement.node());this.populateScrollIntoView(contextMenu);contextMenu.viewSection().appendItem(UIString.UIString('Focus'),async()=>{await this._node.focus();});}
populateScrollIntoView(contextMenu){contextMenu.viewSection().appendItem(UIString.UIString('Scroll into view'),()=>this._node.scrollIntoView());}
populateTextContextMenu(contextMenu,textNode){if(!this._editing){contextMenu.editSection().appendItem(UIString.UIString('Edit text'),this._startEditingTextNode.bind(this,textNode));}
this.populateNodeContextMenu(contextMenu);}
populateNodeContextMenu(contextMenu){const isEditable=this.hasEditableNode();if(isEditable&&!this._editing){contextMenu.editSection().appendItem(UIString.UIString('Edit as HTML'),this._editAsHTML.bind(this));}
const isShadowRoot=this._node.isShadowRoot();const copyMenu=contextMenu.clipboardSection().appendSubMenuItem(UIString.UIString('Copy'));const createShortcut=KeyboardShortcut.KeyboardShortcut.shortcutToString.bind(null);const modifier=KeyboardShortcut.Modifiers.CtrlOrMeta;const treeOutline=this.treeOutline;let menuItem;let section;if(!isShadowRoot){section=copyMenu.section();menuItem=section.appendItem(UIString.UIString('Copy outerHTML'),treeOutline.performCopyOrCut.bind(treeOutline,false,this._node));menuItem.setShortcut(createShortcut('V',modifier));}
if(this._node.nodeType()===Node.ELEMENT_NODE){section.appendItem(UIString.UIString('Copy selector'),this._copyCSSPath.bind(this));section.appendItem(UIString.UIString('Copy JS path'),this._copyJSPath.bind(this),!canGetJSPath(this._node));section.appendItem(ls`Copy styles`,this._copyStyles.bind(this));}
if(!isShadowRoot){section.appendItem(UIString.UIString('Copy XPath'),this._copyXPath.bind(this));section.appendItem(ls`Copy full XPath`,this._copyFullXPath.bind(this));}
if(!isShadowRoot){menuItem=copyMenu.clipboardSection().appendItem(UIString.UIString('Cut element'),treeOutline.performCopyOrCut.bind(treeOutline,true,this._node),!this.hasEditableNode());menuItem.setShortcut(createShortcut('X',modifier));menuItem=copyMenu.clipboardSection().appendItem(UIString.UIString('Copy element'),treeOutline.performCopyOrCut.bind(treeOutline,false,this._node));menuItem.setShortcut(createShortcut('C',modifier));menuItem=copyMenu.clipboardSection().appendItem(UIString.UIString('Paste element'),treeOutline.pasteNode.bind(treeOutline,this._node),!treeOutline.canPaste(this._node));menuItem.setShortcut(createShortcut('V',modifier));}
menuItem=contextMenu.debugSection().appendCheckboxItem(UIString.UIString('Hide element'),treeOutline.toggleHideElement.bind(treeOutline,this._node),treeOutline.isToggledToHidden(this._node));menuItem.setShortcut(self.UI.shortcutRegistry.shortcutTitleForAction('elements.hide-element'));if(isEditable){contextMenu.editSection().appendItem(UIString.UIString('Delete element'),this.remove.bind(this));}
contextMenu.viewSection().appendItem(ls`Expand recursively`,this.expandRecursively.bind(this));contextMenu.viewSection().appendItem(ls`Collapse children`,this.collapseChildren.bind(this));}
_startEditing(){if(this.treeOutline.selectedDOMNode()!==this._node){return;}
const listItem=this.listItemElement;if(this._canAddAttributes){const attribute=listItem.getElementsByClassName('webkit-html-attribute')[0];if(attribute){return this._startEditingAttribute(attribute,attribute.getElementsByClassName('webkit-html-attribute-value')[0]);}
return this._addNewAttribute();}
if(this._node.nodeType()===Node.TEXT_NODE){const textNode=listItem.getElementsByClassName('webkit-html-text-node')[0];if(textNode){return this._startEditingTextNode(textNode);}
return;}}
_addNewAttribute(){const container=createElement('span');this._buildAttributeDOM(container,' ','',null);const attr=container.firstElementChild;attr.style.marginLeft='2px';attr.style.marginRight='2px';const tag=this.listItemElement.getElementsByClassName('webkit-html-tag')[0];this._insertInLastAttributePosition(tag,attr);attr.scrollIntoViewIfNeeded(true);return this._startEditingAttribute(attr,attr);}
_triggerEditAttribute(attributeName){const attributeElements=this.listItemElement.getElementsByClassName('webkit-html-attribute-name');for(let i=0,len=attributeElements.length;i<len;++i){if(attributeElements[i].textContent===attributeName){for(let elem=attributeElements[i].nextSibling;elem;elem=elem.nextSibling){if(elem.nodeType!==Node.ELEMENT_NODE){continue;}
if(elem.classList.contains('webkit-html-attribute-value')){return this._startEditingAttribute(elem.parentNode,elem);}}}}}
_startEditingAttribute(attribute,elementForSelection){console.assert(this.listItemElement.isAncestor(attribute));if(UIUtils.isBeingEdited(attribute)){return true;}
const attributeNameElement=attribute.getElementsByClassName('webkit-html-attribute-name')[0];if(!attributeNameElement){return false;}
const attributeName=attributeNameElement.textContent;const attributeValueElement=attribute.getElementsByClassName('webkit-html-attribute-value')[0];elementForSelection=attributeValueElement.isAncestor(elementForSelection)?attributeValueElement:elementForSelection;function removeZeroWidthSpaceRecursive(node){if(node.nodeType===Node.TEXT_NODE){node.nodeValue=node.nodeValue.replace(/\u200B/g,'');return;}
if(node.nodeType!==Node.ELEMENT_NODE){return;}
for(let child=node.firstChild;child;child=child.nextSibling){removeZeroWidthSpaceRecursive(child);}}
const attributeValue=attributeName&&attributeValueElement?this._node.getAttribute(attributeName):undefined;if(attributeValue!==undefined){attributeValueElement.setTextContentTruncatedIfNeeded(attributeValue,UIString.UIString('<value is too large to edit>'));}
removeZeroWidthSpaceRecursive(attribute);const config=new InplaceEditor.Config(this._attributeEditingCommitted.bind(this),this._editingCancelled.bind(this),attributeName);function postKeyDownFinishHandler(event){UIUtils.handleElementValueModifications(event,attribute);return'';}
if(!ParsedURL.ParsedURL.fromString(attributeValueElement.textContent)){config.setPostKeydownFinishHandler(postKeyDownFinishHandler);}
this._editing=InplaceEditor.InplaceEditor.startEditing(attribute,config);this.listItemElement.getComponentSelection().selectAllChildren(elementForSelection);return true;}
_startEditingTextNode(textNodeElement){if(UIUtils.isBeingEdited(textNodeElement)){return true;}
let textNode=this._node;if(textNode.nodeType()===Node.ELEMENT_NODE&&textNode.firstChild){textNode=textNode.firstChild;}
const container=textNodeElement.enclosingNodeOrSelfWithClass('webkit-html-text-node');if(container){container.textContent=textNode.nodeValue();}
const config=new InplaceEditor.Config(this._textNodeEditingCommitted.bind(this,textNode),this._editingCancelled.bind(this));this._editing=InplaceEditor.InplaceEditor.startEditing(textNodeElement,config);this.listItemElement.getComponentSelection().selectAllChildren(textNodeElement);return true;}
_startEditingTagName(tagNameElement){if(!tagNameElement){tagNameElement=this.listItemElement.getElementsByClassName('webkit-html-tag-name')[0];if(!tagNameElement){return false;}}
const tagName=tagNameElement.textContent;if(EditTagBlacklist.has(tagName.toLowerCase())){return false;}
if(UIUtils.isBeingEdited(tagNameElement)){return true;}
const closingTagElement=this._distinctClosingTagElement();function keyupListener(event){if(closingTagElement){closingTagElement.textContent='</'+tagNameElement.textContent+'>';}}
const keydownListener=event=>{if(event.key!==' '){return;}
this._editing.commit();event.consume(true);};function editingComitted(element,newTagName){tagNameElement.removeEventListener('keyup',keyupListener,false);tagNameElement.removeEventListener('keydown',keydownListener,false);this._tagNameEditingCommitted.apply(this,arguments);}
function editingCancelled(){tagNameElement.removeEventListener('keyup',keyupListener,false);tagNameElement.removeEventListener('keydown',keydownListener,false);this._editingCancelled.apply(this,arguments);}
tagNameElement.addEventListener('keyup',keyupListener,false);tagNameElement.addEventListener('keydown',keydownListener,false);const config=new InplaceEditor.Config(editingComitted.bind(this),editingCancelled.bind(this),tagName);this._editing=InplaceEditor.InplaceEditor.startEditing(tagNameElement,config);this.listItemElement.getComponentSelection().selectAllChildren(tagNameElement);return true;}
_startEditingAsHTML(commitCallback,disposeCallback,maybeInitialValue){if(maybeInitialValue===null){return;}
let initialValue=maybeInitialValue;if(this._editing){return;}
initialValue=this._convertWhitespaceToEntities(initialValue).text;this._htmlEditElement=createElement('div');this._htmlEditElement.className='source-code elements-tree-editor';let child=this.listItemElement.firstChild;while(child){child.style.display='none';child=child.nextSibling;}
if(this.childrenListElement){this.childrenListElement.style.display='none';}
this.listItemElement.appendChild(this._htmlEditElement);self.runtime.extension(TextEditor.TextEditorFactory).instance().then(gotFactory.bind(this));function gotFactory(factory){const editor=factory.createEditor({lineNumbers:false,lineWrapping:Settings.Settings.instance().moduleSetting('domWordWrap').get(),mimeType:'text/html',autoHeight:false,padBottom:false});this._editing={commit:commit.bind(this),cancel:dispose.bind(this),editor:editor,resize:resize.bind(this)};resize.call(this);editor.widget().show((this._htmlEditElement));editor.setText(initialValue);editor.widget().focus();editor.widget().element.addEventListener('focusout',event=>{if(event.relatedTarget&&!event.relatedTarget.isSelfOrDescendant(editor.widget().element)){this._editing.commit();}},false);editor.widget().element.addEventListener('keydown',keydown.bind(this),true);this.treeOutline.setMultilineEditing(this._editing);}
function resize(){if(this._htmlEditElement){this._htmlEditElement.style.width=this.treeOutline.visibleWidth()-this._computeLeftIndent()-30+'px';}
this._editing.editor.onResize();}
function commit(){commitCallback(initialValue,this._editing.editor.text());dispose.call(this);}
function dispose(){if(!this._editing||!this._editing.editor){return;}
this._editing.editor.widget().element.removeEventListener('blur',this._editing.commit,true);this._editing.editor.widget().detach();delete this._editing;this.listItemElement.removeChild(this._htmlEditElement);delete this._htmlEditElement;if(this.childrenListElement){this.childrenListElement.style.removeProperty('display');}
let child=this.listItemElement.firstChild;while(child){child.style.removeProperty('display');child=child.nextSibling;}
if(this.treeOutline){this.treeOutline.setMultilineEditing(null);this.treeOutline.focus();}
disposeCallback();}
function keydown(event){const isMetaOrCtrl=KeyboardShortcut.KeyboardShortcut.eventHasCtrlOrMeta((event))&&!event.altKey&&!event.shiftKey;if(isEnterKey(event)&&(isMetaOrCtrl||event.isMetaOrCtrlForTest)){event.consume(true);this._editing.commit();}else if(event.keyCode===KeyboardShortcut.Keys.Esc.code||event.key==='Escape'){event.consume(true);this._editing.cancel();}}}
_attributeEditingCommitted(element,newText,oldText,attributeName,moveDirection){delete this._editing;const treeOutline=this.treeOutline;function moveToNextAttributeIfNeeded(error){if(error){this._editingCancelled(element,attributeName);}
if(!moveDirection){return;}
treeOutline.runPendingUpdates();treeOutline.focus();const attributes=this._node.attributes();for(let i=0;i<attributes.length;++i){if(attributes[i].name!==attributeName){continue;}
if(moveDirection==='backward'){if(i===0){this._startEditingTagName();}else{this._triggerEditAttribute(attributes[i-1].name);}}else{if(i===attributes.length-1){this._addNewAttribute();}else{this._triggerEditAttribute(attributes[i+1].name);}}
return;}
if(moveDirection==='backward'){if(newText===' '){if(attributes.length>0){this._triggerEditAttribute(attributes[attributes.length-1].name);}}else{if(attributes.length>1){this._triggerEditAttribute(attributes[attributes.length-2].name);}}}else if(moveDirection==='forward'){if(!StringUtilities.isWhitespace(newText)){this._addNewAttribute();}else{this._startEditingTagName();}}}
if((attributeName.trim()||newText.trim())&&oldText!==newText){this._node.setAttribute(attributeName,newText,moveToNextAttributeIfNeeded.bind(this));return;}
this.updateTitle();moveToNextAttributeIfNeeded.call(this);}
_tagNameEditingCommitted(element,newText,oldText,tagName,moveDirection){delete this._editing;const self=this;function cancel(){const closingTagElement=self._distinctClosingTagElement();if(closingTagElement){closingTagElement.textContent='</'+tagName+'>';}
self._editingCancelled(element,tagName);moveToNextAttributeIfNeeded.call(self);}
function moveToNextAttributeIfNeeded(){if(moveDirection!=='forward'){this._addNewAttribute();return;}
const attributes=this._node.attributes();if(attributes.length>0){this._triggerEditAttribute(attributes[0].name);}else{this._addNewAttribute();}}
newText=newText.trim();if(newText===oldText){cancel();return;}
const treeOutline=this.treeOutline;const wasExpanded=this.expanded;this._node.setNodeName(newText,(error,newNode)=>{if(error||!newNode){cancel();return;}
const newTreeItem=treeOutline.selectNodeAfterEdit(wasExpanded,error,newNode);moveToNextAttributeIfNeeded.call(newTreeItem);});}
_textNodeEditingCommitted(textNode,element,newText){delete this._editing;function callback(){this.updateTitle();}
textNode.setNodeValue(newText,callback.bind(this));}
_editingCancelled(element,context){delete this._editing;this.updateTitle();}
_distinctClosingTagElement(){if(this.expanded){const closers=this.childrenListElement.querySelectorAll('.close');return closers[closers.length-1];}
const tags=this.listItemElement.getElementsByClassName('webkit-html-tag');return(tags.length===1?null:tags[tags.length-1]);}
updateTitle(updateRecord,onlySearchQueryChanged){if(this._editing){return;}
if(onlySearchQueryChanged){this._hideSearchHighlight();}else{const nodeInfo=this._nodeTitleInfo(updateRecord||null);if(this._node.nodeType()===Node.DOCUMENT_FRAGMENT_NODE&&this._node.isInShadowTree()&&this._node.shadowRootType()){this.childrenListElement.classList.add('shadow-root');let depth=4;for(let node=this._node;depth&&node;node=node.parentNode){if(node.nodeType()===Node.DOCUMENT_FRAGMENT_NODE){depth--;}}
if(!depth){this.childrenListElement.classList.add('shadow-root-deep');}else{this.childrenListElement.classList.add('shadow-root-depth-'+depth);}}
const highlightElement=createElement('span');highlightElement.className='highlight';highlightElement.appendChild(nodeInfo);this.title=highlightElement;this.updateDecorations();this.listItemElement.insertBefore(this._gutterContainer,this.listItemElement.firstChild);delete this._highlightResult;delete this.selectionElement;delete this._hintElement;if(this.selected){this._createSelection();this._createHint();}}
this._highlightSearchResults();}
_computeLeftIndent(){let treeElement=this.parent;let depth=0;while(treeElement!==null){depth++;treeElement=treeElement.parent;}
return 12*(depth-2)+(this.isExpandable()?1:12);}
updateDecorations(){this._gutterContainer.style.left=(-this._computeLeftIndent())+'px';if(this.isClosingTag()){return;}
if(this._node.nodeType()!==Node.ELEMENT_NODE){return;}
this._decorationsThrottler.schedule(this._updateDecorationsInternal.bind(this));}
_updateDecorationsInternal(){if(!this.treeOutline){return Promise.resolve();}
const node=this._node;if(!this.treeOutline._decoratorExtensions){this.treeOutline._decoratorExtensions=self.runtime.extensions(MarkerDecorator);}
const markerToExtension=new Map();for(let i=0;i<this.treeOutline._decoratorExtensions.length;++i){markerToExtension.set(this.treeOutline._decoratorExtensions[i].descriptor()['marker'],this.treeOutline._decoratorExtensions[i]);}
const promises=[];const decorations=[];const descendantDecorations=[];node.traverseMarkers(visitor);function visitor(n,marker){const extension=markerToExtension.get(marker);if(!extension){return;}
promises.push(extension.instance().then(collectDecoration.bind(null,n)));}
function collectDecoration(n,decorator){const decoration=decorator.decorate(n);if(!decoration){return;}
(n===node?decorations:descendantDecorations).push(decoration);}
return Promise.all(promises).then(updateDecorationsUI.bind(this));function updateDecorationsUI(){this._decorationsElement.removeChildren();this._decorationsElement.classList.add('hidden');this._gutterContainer.classList.toggle('has-decorations',decorations.length||descendantDecorations.length);if(!decorations.length&&!descendantDecorations.length){return;}
const colors=new Set();const titles=createElement('div');for(const decoration of decorations){const titleElement=titles.createChild('div');titleElement.textContent=decoration.title;colors.add(decoration.color);}
if(this.expanded&&!decorations.length){return;}
const descendantColors=new Set();if(descendantDecorations.length){let element=titles.createChild('div');element.textContent=UIString.UIString('Children:');for(const decoration of descendantDecorations){element=titles.createChild('div');element.style.marginLeft='15px';element.textContent=decoration.title;descendantColors.add(decoration.color);}}
let offset=0;processColors.call(this,colors,'elements-gutter-decoration');if(!this.expanded){processColors.call(this,descendantColors,'elements-gutter-decoration elements-has-decorated-children');}
Tooltip.Tooltip.install(this._decorationsElement,titles);function processColors(colors,className){for(const color of colors){const child=this._decorationsElement.createChild('div',className);this._decorationsElement.classList.remove('hidden');child.style.backgroundColor=color;child.style.borderColor=color;if(offset){child.style.marginLeft=offset+'px';}
offset+=3;}}}}
_buildAttributeDOM(parentElement,name,value,updateRecord,forceValue,node){const closingPunctuationRegex=/[\/;:\)\]\}]/g;let highlightIndex=0;let highlightCount;let additionalHighlightOffset=0;let result;function replacer(match,replaceOffset){while(highlightIndex<highlightCount&&result.entityRanges[highlightIndex].offset<replaceOffset){result.entityRanges[highlightIndex].offset+=additionalHighlightOffset;++highlightIndex;}
additionalHighlightOffset+=1;return match+'\u200B';}
function setValueWithEntities(element,value){result=this._convertWhitespaceToEntities(value);highlightCount=result.entityRanges.length;value=result.text.replace(closingPunctuationRegex,replacer);while(highlightIndex<highlightCount){result.entityRanges[highlightIndex].offset+=additionalHighlightOffset;++highlightIndex;}
element.setTextContentTruncatedIfNeeded(value);UIUtils.highlightRangesWithStyleClass(element,result.entityRanges,'webkit-html-entity-value');}
const hasText=(forceValue||value.length>0);const attrSpanElement=parentElement.createChild('span','webkit-html-attribute');const attrNameElement=attrSpanElement.createChild('span','webkit-html-attribute-name');attrNameElement.textContent=name;if(hasText){attrSpanElement.createTextChild('=\u200B"');}
const attrValueElement=attrSpanElement.createChild('span','webkit-html-attribute-value');if(updateRecord&&updateRecord.isAttributeModified(name)){UIUtils.runCSSAnimationOnce(hasText?attrValueElement:attrNameElement,'dom-update-highlight');}
function linkifyValue(value){const rewrittenHref=node.resolveURL(value);if(rewrittenHref===null){const span=createElement('span');setValueWithEntities.call(this,span,value);return span;}
value=value.replace(closingPunctuationRegex,'$&\u200B');if(value.startsWith('data:')){value=value.trimMiddle(60);}
const link=node.nodeName().toLowerCase()==='a'?XLink.XLink.create(rewrittenHref,value,'',true):Linkifier$1.Linkifier.linkifyURL(rewrittenHref,{text:value,preventClick:true});link[HrefSymbol]=rewrittenHref;return link;}
const nodeName=node?node.nodeName().toLowerCase():'';if(nodeName&&(name==='src'||name==='href')){attrValueElement.appendChild(linkifyValue.call(this,value));}else if((nodeName==='img'||nodeName==='source')&&name==='srcset'){attrValueElement.appendChild(linkifySrcset.call(this,value));}else if(nodeName==='image'&&(name==='xlink:href'||name==='href')){attrValueElement.appendChild(linkifySrcset.call(this,value));}else{setValueWithEntities.call(this,attrValueElement,value);}
if(hasText){attrSpanElement.createTextChild('"');}
function linkifySrcset(value){const fragment=createDocumentFragment();let i=0;while(value.length){if(i++>0){fragment.createTextChild(' ');}
value=value.trim();let url='';let descriptor='';const indexOfSpace=value.search(/\s/);if(indexOfSpace===-1){url=value;}else if(indexOfSpace>0&&value[indexOfSpace-1]===','){url=value.substring(0,indexOfSpace);}else{url=value.substring(0,indexOfSpace);const indexOfComma=value.indexOf(',',indexOfSpace);if(indexOfComma!==-1){descriptor=value.substring(indexOfSpace,indexOfComma+1);}else{descriptor=value.substring(indexOfSpace);}}
if(url){if(url.endsWith(',')){fragment.appendChild(linkifyValue.call(this,url.substring(0,url.length-1)));fragment.createTextChild(',');}else{fragment.appendChild(linkifyValue.call(this,url));}}
if(descriptor){fragment.createTextChild(descriptor);}
value=value.substring(url.length+descriptor.length);}
return fragment;}}
_buildPseudoElementDOM(parentElement,pseudoElementName){const pseudoElement=parentElement.createChild('span','webkit-html-pseudo-element');pseudoElement.textContent='::'+pseudoElementName;parentElement.createTextChild('\u200B');}
_buildTagDOM(parentElement,tagName,isClosingTag,isDistinctTreeElement,updateRecord){const node=this._node;const classes=['webkit-html-tag'];if(isClosingTag&&isDistinctTreeElement){classes.push('close');}
const tagElement=parentElement.createChild('span',classes.join(' '));tagElement.createTextChild('<');const tagNameElement=tagElement.createChild('span',isClosingTag?'webkit-html-close-tag-name':'webkit-html-tag-name');tagNameElement.textContent=(isClosingTag?'/':'')+tagName;if(!isClosingTag){if(node.hasAttributes()){const attributes=node.attributes();for(let i=0;i<attributes.length;++i){const attr=attributes[i];tagElement.createTextChild(' ');this._buildAttributeDOM(tagElement,attr.name,attr.value,updateRecord,false,node);}}
if(updateRecord){let hasUpdates=updateRecord.hasRemovedAttributes()||updateRecord.hasRemovedChildren();hasUpdates|=!this.expanded&&updateRecord.hasChangedChildren();if(hasUpdates){UIUtils.runCSSAnimationOnce(tagNameElement,'dom-update-highlight');}}}
tagElement.createTextChild('>');parentElement.createTextChild('\u200B');}
_convertWhitespaceToEntities(text){let result='';let lastIndexAfterEntity=0;const entityRanges=[];const charToEntity=MappedCharToEntity;for(let i=0,size=text.length;i<size;++i){const char=text.charAt(i);if(charToEntity[char]){result+=text.substring(lastIndexAfterEntity,i);const entityValue='&'+charToEntity[char]+';';entityRanges.push({offset:result.length,length:entityValue.length});result+=entityValue;lastIndexAfterEntity=i+1;}}
if(result){result+=text.substring(lastIndexAfterEntity);}
return{text:result||text,entityRanges:entityRanges};}
_nodeTitleInfo(updateRecord){const node=this._node;const titleDOM=createDocumentFragment();switch(node.nodeType()){case Node.ATTRIBUTE_NODE:this._buildAttributeDOM(titleDOM,(node.name),(node.value),updateRecord,true);break;case Node.ELEMENT_NODE:{const pseudoType=node.pseudoType();if(pseudoType){this._buildPseudoElementDOM(titleDOM,pseudoType);break;}
const tagName=node.nodeNameInCorrectCase();if(this._elementCloseTag){this._buildTagDOM(titleDOM,tagName,true,true,updateRecord);break;}
this._buildTagDOM(titleDOM,tagName,false,false,updateRecord);if(this.isExpandable()){if(!this.expanded){const textNodeElement=titleDOM.createChild('span','webkit-html-text-node bogus');textNodeElement.textContent='…';titleDOM.createTextChild('\u200B');this._buildTagDOM(titleDOM,tagName,true,false,updateRecord);}
break;}
if(ElementsTreeElement.canShowInlineText(node)){const textNodeElement=titleDOM.createChild('span','webkit-html-text-node');const result=this._convertWhitespaceToEntities(node.firstChild.nodeValue());textNodeElement.textContent=result.text;UIUtils.highlightRangesWithStyleClass(textNodeElement,result.entityRanges,'webkit-html-entity-value');titleDOM.createTextChild('\u200B');this._buildTagDOM(titleDOM,tagName,true,false,updateRecord);if(updateRecord&&updateRecord.hasChangedChildren()){UIUtils.runCSSAnimationOnce(textNodeElement,'dom-update-highlight');}
if(updateRecord&&updateRecord.isCharDataModified()){UIUtils.runCSSAnimationOnce(textNodeElement,'dom-update-highlight');}
break;}
if(this.treeOutline.isXMLMimeType||!ForbiddenClosingTagElements.has(tagName)){this._buildTagDOM(titleDOM,tagName,true,false,updateRecord);}
break;}
case Node.TEXT_NODE:if(node.parentNode&&node.parentNode.nodeName().toLowerCase()==='script'){const newNode=titleDOM.createChild('span','webkit-html-text-node webkit-html-js-node');const text=node.nodeValue();newNode.textContent=text.startsWith('\n')?text.substring(1):text;const javascriptSyntaxHighlighter=new SyntaxHighlighter.SyntaxHighlighter('text/javascript',true);javascriptSyntaxHighlighter.syntaxHighlightNode(newNode).then(updateSearchHighlight.bind(this));}else if(node.parentNode&&node.parentNode.nodeName().toLowerCase()==='style'){const newNode=titleDOM.createChild('span','webkit-html-text-node webkit-html-css-node');const text=node.nodeValue();newNode.textContent=text.startsWith('\n')?text.substring(1):text;const cssSyntaxHighlighter=new SyntaxHighlighter.SyntaxHighlighter('text/css',true);cssSyntaxHighlighter.syntaxHighlightNode(newNode).then(updateSearchHighlight.bind(this));}else{titleDOM.createTextChild('"');const textNodeElement=titleDOM.createChild('span','webkit-html-text-node');const result=this._convertWhitespaceToEntities(node.nodeValue());textNodeElement.textContent=result.text;UIUtils.highlightRangesWithStyleClass(textNodeElement,result.entityRanges,'webkit-html-entity-value');titleDOM.createTextChild('"');if(updateRecord&&updateRecord.isCharDataModified()){UIUtils.runCSSAnimationOnce(textNodeElement,'dom-update-highlight');}}
break;case Node.COMMENT_NODE:{const commentElement=titleDOM.createChild('span','webkit-html-comment');commentElement.createTextChild('<!--'+node.nodeValue()+'-->');break;}
case Node.DOCUMENT_TYPE_NODE:{const docTypeElement=titleDOM.createChild('span','webkit-html-doctype');docTypeElement.createTextChild('<!DOCTYPE '+node.nodeName());if(node.publicId){docTypeElement.createTextChild(' PUBLIC "'+node.publicId+'"');if(node.systemId){docTypeElement.createTextChild(' "'+node.systemId+'"');}}else if(node.systemId){docTypeElement.createTextChild(' SYSTEM "'+node.systemId+'"');}
if(node.internalSubset){docTypeElement.createTextChild(' ['+node.internalSubset+']');}
docTypeElement.createTextChild('>');break;}
case Node.CDATA_SECTION_NODE:{const cdataElement=titleDOM.createChild('span','webkit-html-text-node');cdataElement.createTextChild('<![CDATA['+node.nodeValue()+']]>');break;}
case Node.DOCUMENT_FRAGMENT_NODE:{const fragmentElement=titleDOM.createChild('span','webkit-html-fragment');fragmentElement.textContent=StringUtilities.collapseWhitespace(node.nodeNameInCorrectCase());break;}
default:{const nameWithSpaceCollapsed=StringUtilities.collapseWhitespace(node.nodeNameInCorrectCase());titleDOM.createTextChild(nameWithSpaceCollapsed);}}
function updateSearchHighlight(){delete this._highlightResult;this._highlightSearchResults();}
return titleDOM;}
remove(){if(this._node.pseudoType()){return;}
const parentElement=this.parent;if(!parentElement){return;}
if(!this._node.parentNode||this._node.parentNode.nodeType()===Node.DOCUMENT_NODE){return;}
this._node.removeNode();}
toggleEditAsHTML(callback,startEditing){if(this._editing&&this._htmlEditElement){this._editing.commit();return;}
if(startEditing===false){return;}
function selectNode(error){if(callback){callback(!error);}}
function commitChange(initialValue,value){if(initialValue!==value){node.setOuterHTML(value,selectNode);}}
function disposeCallback(){if(callback){callback(false);}}
const node=this._node;node.getOuterHTML().then(this._startEditingAsHTML.bind(this,commitChange,disposeCallback));}
_copyCSSPath(){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(cssPath(this._node,true));}
_copyJSPath(){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(jsPath(this._node,true));}
_copyXPath(){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(xPath(this._node,true));}
_copyFullXPath(){InspectorFrontendHost.InspectorFrontendHostInstance.copyText(xPath(this._node,false));}
async _copyStyles(){const node=this._node;const cssModel=node.domModel().cssModel();const cascade=await cssModel.cachedMatchedCascadeForNode(node);if(!cascade){return;}
const lines=[];for(const style of cascade.nodeStyles().reverse()){for(const property of style.leadingProperties()){if(!property.parsedOk||property.disabled||!property.activeInStyle()||property.implicit){continue;}
if(cascade.isInherited(style)&&!CSSMetadata.cssMetadata().isPropertyInherited(property.name)){continue;}
if(style.parentRule&&style.parentRule.isUserAgent()){continue;}
if(cascade.propertyState(property)!==CSSMatchedStyles.PropertyState.Active){continue;}
lines.push(`${property.name}: ${property.value};`);}}
InspectorFrontendHost.InspectorFrontendHostInstance.copyText(lines.join('\n'));}
_highlightSearchResults(){if(!this._searchQuery||!this._searchHighlightsVisible){return;}
this._hideSearchHighlight();const text=this.listItemElement.textContent;const regexObject=createPlainTextSearchRegex(this._searchQuery,'gi');let match=regexObject.exec(text);const matchRanges=[];while(match){matchRanges.push(new TextRange.SourceRange(match.index,match[0].length));match=regexObject.exec(text);}
if(!matchRanges.length){matchRanges.push(new TextRange.SourceRange(0,text.length));}
this._highlightResult=[];UIUtils.highlightSearchResults(this.listItemElement,matchRanges,this._highlightResult);}
_editAsHTML(){const promise=Revealer.reveal(this.node());promise.then(()=>self.UI.actionRegistry.action('elements.edit-as-html').execute());}}
const HrefSymbol=Symbol('ElementsTreeElement.Href');const InitialChildrenLimit=500;const ForbiddenClosingTagElements=new Set(['area','base','basefont','br','canvas','col','command','embed','frame','hr','img','input','keygen','link','menuitem','meta','param','source','track','wbr']);const EditTagBlacklist=new Set(['html','head','body']);var ElementsTreeElement$1=Object.freeze({__proto__:null,ElementsTreeElement:ElementsTreeElement,HrefSymbol:HrefSymbol,InitialChildrenLimit:InitialChildrenLimit,ForbiddenClosingTagElements:ForbiddenClosingTagElements,EditTagBlacklist:EditTagBlacklist});class ElementsTreeElementHighlighter{constructor(treeOutline){this._throttler=new Throttler.Throttler(100);this._treeOutline=treeOutline;this._treeOutline.addEventListener(TreeOutline.Events.ElementExpanded,this._clearState,this);this._treeOutline.addEventListener(TreeOutline.Events.ElementCollapsed,this._clearState,this);this._treeOutline.addEventListener(ElementsTreeOutline.Events.SelectedNodeChanged,this._clearState,this);SDKModel.TargetManager.instance().addModelListener(OverlayModel.OverlayModel,OverlayModel.Events.HighlightNodeRequested,this._highlightNode,this);SDKModel.TargetManager.instance().addModelListener(OverlayModel.OverlayModel,OverlayModel.Events.InspectModeWillBeToggled,this._clearState,this);}
_highlightNode(event){if(!Settings.Settings.instance().moduleSetting('highlightNodeOnHoverInOverlay').get()){return;}
const domNode=(event.data);this._throttler.schedule(callback.bind(this));this._pendingHighlightNode=this._treeOutline===ElementsTreeOutline.forDOMModel(domNode.domModel())?domNode:null;function callback(){this._highlightNodeInternal(this._pendingHighlightNode);delete this._pendingHighlightNode;return Promise.resolve();}}
_highlightNodeInternal(node){this._isModifyingTreeOutline=true;let treeElement=null;if(this._currentHighlightedElement){let currentTreeElement=this._currentHighlightedElement;while(currentTreeElement!==this._alreadyExpandedParentElement){if(currentTreeElement.expanded){currentTreeElement.collapse();}
currentTreeElement=currentTreeElement.parent;}}
delete this._currentHighlightedElement;delete this._alreadyExpandedParentElement;if(node){let deepestExpandedParent=node;const treeElementSymbol=this._treeOutline.treeElementSymbol();while(deepestExpandedParent&&(!deepestExpandedParent[treeElementSymbol]||!deepestExpandedParent[treeElementSymbol].expanded)){deepestExpandedParent=deepestExpandedParent.parentNode;}
this._alreadyExpandedParentElement=deepestExpandedParent?deepestExpandedParent[treeElementSymbol]:this._treeOutline.rootElement();treeElement=this._treeOutline.createTreeElementFor(node);}
this._currentHighlightedElement=treeElement;this._treeOutline.setHoverEffect(treeElement);if(treeElement){treeElement.reveal(true);}
this._isModifyingTreeOutline=false;}
_clearState(){if(this._isModifyingTreeOutline){return;}
delete this._currentHighlightedElement;delete this._alreadyExpandedParentElement;delete this._pendingHighlightNode;}}
var ElementsTreeElementHighlighter$1=Object.freeze({__proto__:null,ElementsTreeElementHighlighter:ElementsTreeElementHighlighter});class MetricsSidebarPane extends ElementsSidebarPane{constructor(){super();this.registerRequiredCSS('elements/metricsSidebarPane.css');this._inlineStyle=null;}
doUpdate(){if(this._isEditingMetrics){return Promise.resolve();}
const node=this.node();const cssModel=this.cssModel();if(!node||node.nodeType()!==Node.ELEMENT_NODE||!cssModel){this.contentElement.removeChildren();return Promise.resolve();}
function callback(style){if(!style||this.node()!==node){return;}
this._updateMetrics(style);}
function inlineStyleCallback(inlineStyleResult){if(inlineStyleResult&&this.node()===node){this._inlineStyle=inlineStyleResult.inlineStyle;}}
const promises=[cssModel.computedStylePromise(node.id).then(callback.bind(this)),cssModel.inlineStylesPromise(node.id).then(inlineStyleCallback.bind(this))];return Promise.all(promises);}
onCSSModelChanged(){this.update();}
_getPropertyValueAsPx(style,propertyName){return Number(style.get(propertyName).replace(/px$/,'')||0);}
_getBox(computedStyle,componentName){const suffix=componentName==='border'?'-width':'';const left=this._getPropertyValueAsPx(computedStyle,componentName+'-left'+suffix);const top=this._getPropertyValueAsPx(computedStyle,componentName+'-top'+suffix);const right=this._getPropertyValueAsPx(computedStyle,componentName+'-right'+suffix);const bottom=this._getPropertyValueAsPx(computedStyle,componentName+'-bottom'+suffix);return{left:left,top:top,right:right,bottom:bottom};}
_highlightDOMNode(showHighlight,mode,event){event.consume();if(showHighlight&&this.node()){if(this._highlightMode===mode){return;}
this._highlightMode=mode;this.node().highlight(mode);}else{delete this._highlightMode;OverlayModel.OverlayModel.hideDOMNodeHighlight();}
for(let i=0;this._boxElements&&i<this._boxElements.length;++i){const element=this._boxElements[i];if(!this.node()||mode==='all'||element._name===mode){element.style.backgroundColor=element._backgroundColor;}else{element.style.backgroundColor='';}}}
_updateMetrics(style){const metricsElement=createElement('div');metricsElement.className='metrics';const self=this;function createBoxPartElement(style,name,side,suffix){const propertyName=(name!=='position'?name+'-':'')+side+suffix;let value=style.get(propertyName);if(value===''||(name!=='position'&&value==='0px')){value='\u2012';}else if(name==='position'&&value==='auto'){value='\u2012';}
value=value.replace(/px$/,'');value=Number.toFixedIfFloating(value);const element=createElement('div');element.className=side;element.textContent=value;element.addEventListener('dblclick',this.startEditing.bind(this,element,name,propertyName,style),false);return element;}
function getContentAreaWidthPx(style){let width=style.get('width').replace(/px$/,'');if(!isNaN(width)&&style.get('box-sizing')==='border-box'){const borderBox=self._getBox(style,'border');const paddingBox=self._getBox(style,'padding');width=width-borderBox.left-borderBox.right-paddingBox.left-paddingBox.right;}
return Number.toFixedIfFloating(width.toString());}
function getContentAreaHeightPx(style){let height=style.get('height').replace(/px$/,'');if(!isNaN(height)&&style.get('box-sizing')==='border-box'){const borderBox=self._getBox(style,'border');const paddingBox=self._getBox(style,'padding');height=height-borderBox.top-borderBox.bottom-paddingBox.top-paddingBox.bottom;}
return Number.toFixedIfFloating(height.toString());}
const noMarginDisplayType={'table-cell':true,'table-column':true,'table-column-group':true,'table-footer-group':true,'table-header-group':true,'table-row':true,'table-row-group':true};const noPaddingDisplayType={'table-column':true,'table-column-group':true,'table-footer-group':true,'table-header-group':true,'table-row':true,'table-row-group':true};const noPositionType={'static':true};const boxes=['content','padding','border','margin','position'];const boxColors=[Color.PageHighlight.Content,Color.PageHighlight.Padding,Color.PageHighlight.Border,Color.PageHighlight.Margin,Color.Color.fromRGBA([0,0,0,0])];const boxLabels=[UIString.UIString('content'),UIString.UIString('padding'),UIString.UIString('border'),UIString.UIString('margin'),UIString.UIString('position')];let previousBox=null;this._boxElements=[];for(let i=0;i<boxes.length;++i){const name=boxes[i];if(name==='margin'&&noMarginDisplayType[style.get('display')]){continue;}
if(name==='padding'&&noPaddingDisplayType[style.get('display')]){continue;}
if(name==='position'&&noPositionType[style.get('position')]){continue;}
const boxElement=createElement('div');boxElement.className=name;boxElement._backgroundColor=boxColors[i].asString(Color.Format.RGBA);boxElement._name=name;boxElement.style.backgroundColor=boxElement._backgroundColor;boxElement.addEventListener('mouseover',this._highlightDOMNode.bind(this,true,name==='position'?'all':name),false);this._boxElements.push(boxElement);if(name==='content'){const widthElement=createElement('span');widthElement.textContent=getContentAreaWidthPx(style);widthElement.addEventListener('dblclick',this.startEditing.bind(this,widthElement,'width','width',style),false);const heightElement=createElement('span');heightElement.textContent=getContentAreaHeightPx(style);heightElement.addEventListener('dblclick',this.startEditing.bind(this,heightElement,'height','height',style),false);boxElement.appendChild(widthElement);boxElement.createTextChild(' × ');boxElement.appendChild(heightElement);}else{const suffix=(name==='border'?'-width':'');const labelElement=createElement('div');labelElement.className='label';labelElement.textContent=boxLabels[i];boxElement.appendChild(labelElement);boxElement.appendChild(createBoxPartElement.call(this,style,name,'top',suffix));boxElement.appendChild(createElement('br'));boxElement.appendChild(createBoxPartElement.call(this,style,name,'left',suffix));if(previousBox){boxElement.appendChild(previousBox);}
boxElement.appendChild(createBoxPartElement.call(this,style,name,'right',suffix));boxElement.appendChild(createElement('br'));boxElement.appendChild(createBoxPartElement.call(this,style,name,'bottom',suffix));}
previousBox=boxElement;}
metricsElement.appendChild(previousBox);metricsElement.addEventListener('mouseover',this._highlightDOMNode.bind(this,false,'all'),false);this.contentElement.removeChildren();this.contentElement.appendChild(metricsElement);userMetrics.panelLoaded('elements','DevTools.Launch.Elements');}
startEditing(targetElement,box,styleProperty,computedStyle){if(UIUtils.isBeingEdited(targetElement)){return;}
const context={box:box,styleProperty:styleProperty,computedStyle:computedStyle};const boundKeyDown=this._handleKeyDown.bind(this,context,styleProperty);context.keyDownHandler=boundKeyDown;targetElement.addEventListener('keydown',boundKeyDown,false);this._isEditingMetrics=true;const config=new InplaceEditor.Config(this._editingCommitted.bind(this),this.editingCancelled.bind(this),context);InplaceEditor.InplaceEditor.startEditing(targetElement,config);targetElement.getComponentSelection().selectAllChildren(targetElement);}
_handleKeyDown(context,styleProperty,event){const element=event.currentTarget;function finishHandler(originalValue,replacementString){this._applyUserInput(element,replacementString,originalValue,context,false);}
function customNumberHandler(prefix,number,suffix){if(styleProperty!=='margin'&&number<0){number=0;}
return prefix+number+suffix;}
UIUtils.handleElementValueModifications(event,element,finishHandler.bind(this),undefined,customNumberHandler);}
editingEnded(element,context){delete this.originalPropertyData;delete this.previousPropertyDataCandidate;element.removeEventListener('keydown',context.keyDownHandler,false);delete this._isEditingMetrics;}
editingCancelled(element,context){if('originalPropertyData'in this&&this._inlineStyle){if(!this.originalPropertyData){const pastLastSourcePropertyIndex=this._inlineStyle.pastLastSourcePropertyIndex();if(pastLastSourcePropertyIndex){this._inlineStyle.allProperties()[pastLastSourcePropertyIndex-1].setText('',false);}}else{this._inlineStyle.allProperties()[this.originalPropertyData.index].setText(this.originalPropertyData.propertyText,false);}}
this.editingEnded(element,context);this.update();}
_applyUserInput(element,userInput,previousContent,context,commitEditor){if(!this._inlineStyle){return this.editingCancelled(element,context);}
if(commitEditor&&userInput===previousContent){return this.editingCancelled(element,context);}
if(context.box!=='position'&&(!userInput||userInput==='\u2012')){userInput='0px';}else if(context.box==='position'&&(!userInput||userInput==='\u2012')){userInput='auto';}
userInput=userInput.toLowerCase();if(/^\d+$/.test(userInput)){userInput+='px';}
const styleProperty=context.styleProperty;const computedStyle=context.computedStyle;if(computedStyle.get('box-sizing')==='border-box'&&(styleProperty==='width'||styleProperty==='height')){if(!userInput.match(/px$/)){Console.Console.instance().error('For elements with box-sizing: border-box, only absolute content area dimensions can be applied');return;}
const borderBox=this._getBox(computedStyle,'border');const paddingBox=this._getBox(computedStyle,'padding');let userValuePx=Number(userInput.replace(/px$/,''));if(isNaN(userValuePx)){return;}
if(styleProperty==='width'){userValuePx+=borderBox.left+borderBox.right+paddingBox.left+paddingBox.right;}else{userValuePx+=borderBox.top+borderBox.bottom+paddingBox.top+paddingBox.bottom;}
userInput=userValuePx+'px';}
this.previousPropertyDataCandidate=null;const allProperties=this._inlineStyle.allProperties();for(let i=0;i<allProperties.length;++i){const property=allProperties[i];if(property.name!==context.styleProperty||!property.activeInStyle()){continue;}
this.previousPropertyDataCandidate=property;property.setValue(userInput,commitEditor,true,callback.bind(this));return;}
this._inlineStyle.appendProperty(context.styleProperty,userInput,callback.bind(this));function callback(success){if(!success){return;}
if(!('originalPropertyData'in this)){this.originalPropertyData=this.previousPropertyDataCandidate;}
if(typeof this._highlightMode!=='undefined'){this.node().highlight(this._highlightMode);}
if(commitEditor){this.update();}}}
_editingCommitted(element,userInput,previousContent,context){this.editingEnded(element,context);this._applyUserInput(element,userInput,previousContent,context,true);}}
var MetricsSidebarPane$1=Object.freeze({__proto__:null,MetricsSidebarPane:MetricsSidebarPane});class ElementsPanel extends Panel.Panel{constructor(){super('elements');this.registerRequiredCSS('elements/elementsPanel.css');this._splitWidget=new SplitWidget.SplitWidget(true,true,'elementsPanelSplitViewState',325,325);this._splitWidget.addEventListener(SplitWidget.Events.SidebarSizeChanged,this._updateTreeOutlineVisibleWidth.bind(this));this._splitWidget.show(this.element);this._searchableView=new SearchableView.SearchableView(this);this._searchableView.setMinimumSize(25,28);this._searchableView.setPlaceholder(UIString.UIString('Find by string, selector, or XPath'));const stackElement=this._searchableView.element;this._contentElement=createElement('div');const crumbsContainer=createElement('div');stackElement.appendChild(this._contentElement);stackElement.appendChild(crumbsContainer);this._splitWidget.setMainWidget(this._searchableView);this._splitMode=null;this._contentElement.id='elements-content';if(Settings.Settings.instance().moduleSetting('domWordWrap').get()){this._contentElement.classList.add('elements-wrap');}
Settings.Settings.instance().moduleSetting('domWordWrap').addChangeListener(this._domWordWrapSettingChanged.bind(this));crumbsContainer.id='elements-crumbs';this._breadcrumbs=new ElementsBreadcrumbs();this._breadcrumbs.show(crumbsContainer);this._breadcrumbs.addEventListener(Events$1.NodeSelected,this._crumbNodeSelected,this);this._stylesWidget=new StylesSidebarPane();this._computedStyleWidget=new ComputedStyleWidget();this._metricsWidget=new MetricsSidebarPane();Settings.Settings.instance().moduleSetting('sidebarPosition').addChangeListener(this._updateSidebarPosition.bind(this));this._updateSidebarPosition();this._treeOutlines=new Set();this._treeOutlineHeaders=new Map();SDKModel.TargetManager.instance().observeModels(DOMModel.DOMModel,this);SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.NameChanged,event=>this._targetNameChanged((event.data)));Settings.Settings.instance().moduleSetting('showUAShadowDOM').addChangeListener(this._showUAShadowDOMChanged.bind(this));SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.DocumentUpdated,this._documentUpdatedEvent,this);self.Extensions.extensionServer.addEventListener(ExtensionServer.Events.SidebarPaneAdded,this._extensionSidebarPaneAdded,this);this._searchResults;}
static instance(){return(self.runtime.sharedInstance(ElementsPanel));}
_revealProperty(cssProperty){return this.sidebarPaneView.showView(this._stylesViewToReveal).then(()=>{this._stylesWidget.revealProperty((cssProperty));});}
resolveLocation(locationName){return this.sidebarPaneView;}
showToolbarPane(widget,toggle){this._stylesWidget.showToolbarPane(widget,toggle);}
modelAdded(domModel){const parentModel=domModel.parentModel();let treeOutline=parentModel?ElementsTreeOutline.forDOMModel(parentModel):null;if(!treeOutline){treeOutline=new ElementsTreeOutline(true,true);treeOutline.setWordWrap(Settings.Settings.instance().moduleSetting('domWordWrap').get());treeOutline.addEventListener(ElementsTreeOutline.Events.SelectedNodeChanged,this._selectedNodeChanged,this);treeOutline.addEventListener(ElementsTreeOutline.Events.ElementsTreeUpdated,this._updateBreadcrumbIfNeeded,this);new ElementsTreeElementHighlighter(treeOutline);this._treeOutlines.add(treeOutline);if(domModel.target().parentTarget()){this._treeOutlineHeaders.set(treeOutline,createElementWithClass('div','elements-tree-header'));this._targetNameChanged(domModel.target());}}
treeOutline.wireToDOMModel(domModel);if(this.isShowing()){this.wasShown();}}
modelRemoved(domModel){const treeOutline=ElementsTreeOutline.forDOMModel(domModel);treeOutline.unwireFromDOMModel(domModel);if(domModel.parentModel()){return;}
this._treeOutlines.delete(treeOutline);const header=this._treeOutlineHeaders.get(treeOutline);if(header){header.remove();}
this._treeOutlineHeaders.delete(treeOutline);treeOutline.element.remove();}
_targetNameChanged(target){const domModel=target.model(DOMModel.DOMModel);if(!domModel){return;}
const treeOutline=ElementsTreeOutline.forDOMModel(domModel);if(!treeOutline){return;}
const header=this._treeOutlineHeaders.get(treeOutline);if(!header){return;}
header.removeChildren();header.createChild('div','elements-tree-header-frame').textContent=UIString.UIString('Frame');header.appendChild(Linkifier$1.Linkifier.linkifyURL(target.inspectedURL(),{text:target.name()}));}
_updateTreeOutlineVisibleWidth(){if(!this._treeOutlines.size){return;}
let width=this._splitWidget.element.offsetWidth;if(this._splitWidget.isVertical()){width-=this._splitWidget.sidebarSize();}
for(const treeOutline of this._treeOutlines){treeOutline.setVisibleWidth(width);}
this._breadcrumbs.updateSizes();}
focus(){if(this._treeOutlines.size){this._treeOutlines.values().next().value.focus();}}
searchableView(){return this._searchableView;}
wasShown(){self.UI.context.setFlavor(ElementsPanel,this);for(const treeOutline of this._treeOutlines){if(treeOutline.element.parentElement!==this._contentElement){const header=this._treeOutlineHeaders.get(treeOutline);if(header){this._contentElement.appendChild(header);}
this._contentElement.appendChild(treeOutline.element);}}
super.wasShown();this._breadcrumbs.update();const domModels=SDKModel.TargetManager.instance().models(DOMModel.DOMModel);for(const domModel of domModels){if(domModel.parentModel()){continue;}
const treeOutline=ElementsTreeOutline.forDOMModel(domModel);treeOutline.setVisible(true);if(!treeOutline.rootDOMNode){if(domModel.existingDocument()){treeOutline.rootDOMNode=domModel.existingDocument();this._documentUpdated(domModel);}else{domModel.requestDocument();}}}}
willHide(){OverlayModel.OverlayModel.hideDOMNodeHighlight();for(const treeOutline of this._treeOutlines){treeOutline.setVisible(false);this._contentElement.removeChild(treeOutline.element);const header=this._treeOutlineHeaders.get(treeOutline);if(header){this._contentElement.removeChild(header);}}
if(this._popoverHelper){this._popoverHelper.hidePopover();}
super.willHide();self.UI.context.setFlavor(ElementsPanel,null);}
onResize(){this.element.window().requestAnimationFrame(this._updateSidebarPosition.bind(this));this._updateTreeOutlineVisibleWidth();}
_selectedNodeChanged(event){const selectedNode=(event.data.node);const focus=(event.data.focus);for(const treeOutline of this._treeOutlines){if(!selectedNode||ElementsTreeOutline.forDOMModel(selectedNode.domModel())!==treeOutline){treeOutline.selectDOMNode(null);}}
this._breadcrumbs.setSelectedNode(selectedNode);self.UI.context.setFlavor(DOMModel.DOMNode,selectedNode);if(!selectedNode){return;}
selectedNode.setAsInspectedNode();if(focus){this._selectedNodeOnReset=selectedNode;this._hasNonDefaultSelectedNode=true;}
const executionContexts=selectedNode.domModel().runtimeModel().executionContexts();const nodeFrameId=selectedNode.frameId();for(const context of executionContexts){if(context.frameId===nodeFrameId){self.UI.context.setFlavor(RuntimeModel.ExecutionContext,context);break;}}}
_documentUpdatedEvent(event){const domModel=(event.data);this._documentUpdated(domModel);}
_documentUpdated(domModel){this._searchableView.resetSearch();if(!domModel.existingDocument()){if(this.isShowing()){domModel.requestDocument();}
return;}
this._hasNonDefaultSelectedNode=false;if(this._omitDefaultSelection){return;}
const savedSelectedNodeOnReset=this._selectedNodeOnReset;restoreNode.call(this,domModel,this._selectedNodeOnReset);async function restoreNode(domModel,staleNode){const nodePath=staleNode?staleNode.path():null;const restoredNodeId=nodePath?await domModel.pushNodeByPathToFrontend(nodePath):null;if(savedSelectedNodeOnReset!==this._selectedNodeOnReset){return;}
let node=restoredNodeId?domModel.nodeForId(restoredNodeId):null;if(!node){const inspectedDocument=domModel.existingDocument();node=inspectedDocument?inspectedDocument.body||inspectedDocument.documentElement:null;}
if(node){this._setDefaultSelectedNode(node);this._lastSelectedNodeSelectedForTest();}}}
_lastSelectedNodeSelectedForTest(){}
_setDefaultSelectedNode(node){if(!node||this._hasNonDefaultSelectedNode||this._pendingNodeReveal){return;}
const treeOutline=ElementsTreeOutline.forDOMModel(node.domModel());if(!treeOutline){return;}
this.selectDOMNode(node);if(treeOutline.selectedTreeElement){treeOutline.selectedTreeElement.expand();}}
searchCanceled(){delete this._searchConfig;this._hideSearchHighlights();this._searchableView.updateSearchMatchesCount(0);delete this._currentSearchResultIndex;delete this._searchResults;DOMModel.DOMModel.cancelSearch();}
performSearch(searchConfig,shouldJump,jumpBackwards){const query=searchConfig.query;const whitespaceTrimmedQuery=query.trim();if(!whitespaceTrimmedQuery.length){return;}
if(!this._searchConfig||this._searchConfig.query!==query){this.searchCanceled();}else{this._hideSearchHighlights();}
this._searchConfig=searchConfig;const showUAShadowDOM=Settings.Settings.instance().moduleSetting('showUAShadowDOM').get();const domModels=SDKModel.TargetManager.instance().models(DOMModel.DOMModel);const promises=domModels.map(domModel=>domModel.performSearch(whitespaceTrimmedQuery,showUAShadowDOM));Promise.all(promises).then(resultCountCallback.bind(this));function resultCountCallback(resultCounts){this._searchResults=[];for(let i=0;i<resultCounts.length;++i){const resultCount=resultCounts[i];for(let j=0;j<resultCount;++j){this._searchResults.push({domModel:domModels[i],index:j,node:undefined});}}
this._searchableView.updateSearchMatchesCount(this._searchResults.length);if(!this._searchResults.length){return;}
if(this._currentSearchResultIndex>=this._searchResults.length){this._currentSearchResultIndex=undefined;}
let index=this._currentSearchResultIndex;if(shouldJump){if(this._currentSearchResultIndex===undefined){index=jumpBackwards?-1:0;}else{index=jumpBackwards?index-1:index+1;}
this._jumpToSearchResult(index);}}}
_domWordWrapSettingChanged(event){this._contentElement.classList.toggle('elements-wrap',event.data);for(const treeOutline of this._treeOutlines){treeOutline.setWordWrap((event.data));}}
switchToAndFocus(node){this._searchableView.cancelSearch();ViewManager.ViewManager.instance().showView('elements').then(()=>this.selectDOMNode(node,true));}
_getPopoverRequest(event){let link=event.target;while(link&&!link[HrefSymbol]){link=link.parentElementOrShadowHost();}
if(!link){return null;}
return{box:link.boxInWindow(),show:async popover=>{const node=this.selectedDOMNode();if(!node){return false;}
const preview=await ImagePreview.ImagePreview.build(node.domModel().target(),link[HrefSymbol],true);if(preview){popover.contentElement.appendChild(preview);}
return!!preview;}};}
_jumpToSearchResult(index){if(!this._searchResults){return;}
this._currentSearchResultIndex=(index+this._searchResults.length)%this._searchResults.length;this._highlightCurrentSearchResult();}
jumpToNextSearchResult(){if(!this._searchResults){return;}
this.performSearch(this._searchConfig,true);}
jumpToPreviousSearchResult(){if(!this._searchResults){return;}
this.performSearch(this._searchConfig,true,true);}
supportsCaseSensitiveSearch(){return false;}
supportsRegexSearch(){return false;}
_highlightCurrentSearchResult(){const index=this._currentSearchResultIndex;const searchResults=this._searchResults;if(!searchResults){return;}
const searchResult=searchResults[index];this._searchableView.updateCurrentMatchIndex(index);if(searchResult.node===null){return;}
if(typeof searchResult.node==='undefined'){searchResult.domModel.searchResult(searchResult.index).then(node=>{searchResult.node=node;this._highlightCurrentSearchResult();});return;}
const treeElement=this._treeElementForNode(searchResult.node);searchResult.node.scrollIntoView();if(treeElement){treeElement.highlightSearchResults(this._searchConfig.query);treeElement.reveal();const matches=treeElement.listItemElement.getElementsByClassName(UIUtils.highlightedSearchResultClassName);if(matches.length){matches[0].scrollIntoViewIfNeeded(false);}}}
_hideSearchHighlights(){if(!this._searchResults||!this._searchResults.length||this._currentSearchResultIndex===undefined){return;}
const searchResult=this._searchResults[this._currentSearchResultIndex];if(!searchResult.node){return;}
const treeOutline=ElementsTreeOutline.forDOMModel(searchResult.node.domModel());const treeElement=treeOutline.findTreeElement(searchResult.node);if(treeElement){treeElement.hideSearchHighlights();}}
selectedDOMNode(){for(const treeOutline of this._treeOutlines){if(treeOutline.selectedDOMNode()){return treeOutline.selectedDOMNode();}}
return null;}
selectDOMNode(node,focus){for(const treeOutline of this._treeOutlines){const outline=ElementsTreeOutline.forDOMModel(node.domModel());if(outline===treeOutline){treeOutline.selectDOMNode(node,focus);}else{treeOutline.selectDOMNode(null);}}}
_updateBreadcrumbIfNeeded(event){const nodes=(event.data);this._breadcrumbs.updateNodes(nodes);}
_crumbNodeSelected(event){const node=(event.data);this.selectDOMNode(node,true);}
_treeOutlineForNode(node){if(!node){return null;}
return ElementsTreeOutline.forDOMModel(node.domModel());}
_treeElementForNode(node){const treeOutline=this._treeOutlineForNode(node);return(treeOutline.findTreeElement(node));}
_leaveUserAgentShadowDOM(node){let userAgentShadowRoot;while((userAgentShadowRoot=node.ancestorUserAgentShadowRoot())&&userAgentShadowRoot.parentNode){node=userAgentShadowRoot.parentNode;}
return node;}
revealAndSelectNode(node,focus,omitHighlight){this._omitDefaultSelection=true;node=Settings.Settings.instance().moduleSetting('showUAShadowDOM').get()?node:this._leaveUserAgentShadowDOM(node);if(!omitHighlight){node.highlightForTwoSeconds();}
return ViewManager.ViewManager.instance().showView('elements',false,!focus).then(()=>{this.selectDOMNode(node,focus);delete this._omitDefaultSelection;if(!this._notFirstInspectElement){ElementsPanel._firstInspectElementNodeNameForTest=node.nodeName();ElementsPanel._firstInspectElementCompletedForTest();InspectorFrontendHost.InspectorFrontendHostInstance.inspectElementCompleted();}
this._notFirstInspectElement=true;});}
_showUAShadowDOMChanged(){for(const treeOutline of this._treeOutlines){treeOutline.update();}}
_setupTextSelectionHack(stylePaneWrapperElement){const uninstallHackBound=uninstallHack.bind(this);const uninstallHackOnMousemove=event=>{if(event.buttons===0){uninstallHack.call(this);}};stylePaneWrapperElement.addEventListener('mousedown',event=>{if(event.which!==1){return;}
this._splitWidget.element.classList.add('disable-resizer-for-elements-hack');stylePaneWrapperElement.style.setProperty('height',`${stylePaneWrapperElement.offsetHeight}px`);const largeLength=1000000;stylePaneWrapperElement.style.setProperty('left',`${- 1 * largeLength}px`);stylePaneWrapperElement.style.setProperty('padding-left',`${largeLength}px`);stylePaneWrapperElement.style.setProperty('width',`calc(100% + ${largeLength}px)`);stylePaneWrapperElement.style.setProperty('position','fixed');stylePaneWrapperElement.window().addEventListener('blur',uninstallHackBound);stylePaneWrapperElement.window().addEventListener('contextmenu',uninstallHackBound,true);stylePaneWrapperElement.window().addEventListener('dragstart',uninstallHackBound,true);stylePaneWrapperElement.window().addEventListener('mousemove',uninstallHackOnMousemove,true);stylePaneWrapperElement.window().addEventListener('mouseup',uninstallHackBound,true);stylePaneWrapperElement.window().addEventListener('visibilitychange',uninstallHackBound);},true);function uninstallHack(){this._splitWidget.element.classList.remove('disable-resizer-for-elements-hack');stylePaneWrapperElement.style.removeProperty('left');stylePaneWrapperElement.style.removeProperty('padding-left');stylePaneWrapperElement.style.removeProperty('width');stylePaneWrapperElement.style.removeProperty('position');stylePaneWrapperElement.window().removeEventListener('blur',uninstallHackBound);stylePaneWrapperElement.window().removeEventListener('contextmenu',uninstallHackBound,true);stylePaneWrapperElement.window().removeEventListener('dragstart',uninstallHackBound,true);stylePaneWrapperElement.window().removeEventListener('mousemove',uninstallHackOnMousemove,true);stylePaneWrapperElement.window().removeEventListener('mouseup',uninstallHackBound,true);stylePaneWrapperElement.window().removeEventListener('visibilitychange',uninstallHackBound);}}
_updateSidebarPosition(){if(this.sidebarPaneView&&this.sidebarPaneView.tabbedPane().shouldHideOnDetach()){return;}
let splitMode;const position=Settings.Settings.instance().moduleSetting('sidebarPosition').get();if(position==='right'||(position==='auto'&&self.UI.inspectorView.element.offsetWidth>680)){splitMode=_splitMode.Vertical;}else if(self.UI.inspectorView.element.offsetWidth>415){splitMode=_splitMode.Horizontal;}else{splitMode=_splitMode.Slim;}
if(this.sidebarPaneView&&splitMode===this._splitMode){return;}
this._splitMode=splitMode;const extensionSidebarPanes=self.Extensions.extensionServer.sidebarPanes();let lastSelectedTabId=null;if(this.sidebarPaneView){lastSelectedTabId=this.sidebarPaneView.tabbedPane().selectedTabId;this.sidebarPaneView.tabbedPane().detach();this._splitWidget.uninstallResizer(this.sidebarPaneView.tabbedPane().headerElement());}
this._splitWidget.setVertical(this._splitMode===_splitMode.Vertical);this.showToolbarPane(null,null);const matchedStylePanesWrapper=new Widget.VBox();matchedStylePanesWrapper.element.classList.add('style-panes-wrapper');this._stylesWidget.show(matchedStylePanesWrapper.element);this._setupTextSelectionHack(matchedStylePanesWrapper.element);const computedStylePanesWrapper=new Widget.VBox();computedStylePanesWrapper.element.classList.add('style-panes-wrapper');this._computedStyleWidget.show(computedStylePanesWrapper.element);function showMetrics(inComputedStyle){if(inComputedStyle){this._metricsWidget.show(computedStylePanesWrapper.element,this._computedStyleWidget.element);}else{this._metricsWidget.show(matchedStylePanesWrapper.element);}}
function tabSelected(event){const tabId=(event.data.tabId);if(tabId===UIString.UIString('Computed')){showMetrics.call(this,true);}else if(tabId===UIString.UIString('Styles')){showMetrics.call(this,false);}}
this.sidebarPaneView=ViewManager.ViewManager.instance().createTabbedLocation(()=>ViewManager.ViewManager.instance().showView('elements'));const tabbedPane=this.sidebarPaneView.tabbedPane();if(this._popoverHelper){this._popoverHelper.hidePopover();}
this._popoverHelper=new PopoverHelper.PopoverHelper(tabbedPane.element,this._getPopoverRequest.bind(this));this._popoverHelper.setHasPadding(true);this._popoverHelper.setTimeout(0);if(this._splitMode!==_splitMode.Vertical){this._splitWidget.installResizer(tabbedPane.headerElement());}
const stylesView=new View.SimpleView(UIString.UIString('Styles'));this.sidebarPaneView.appendView(stylesView);if(splitMode===_splitMode.Horizontal){stylesView.element.classList.add('flex-auto');const splitWidget=new SplitWidget.SplitWidget(true,true,'stylesPaneSplitViewState',215);splitWidget.show(stylesView.element);splitWidget.setMainWidget(matchedStylePanesWrapper);splitWidget.setSidebarWidget(computedStylePanesWrapper);}else{stylesView.element.classList.add('flex-auto');matchedStylePanesWrapper.show(stylesView.element);const computedView=new View.SimpleView(UIString.UIString('Computed'));computedView.element.classList.add('composite','fill');computedStylePanesWrapper.show(computedView.element);tabbedPane.addEventListener(TabbedPane.Events.TabSelected,tabSelected,this);this.sidebarPaneView.appendView(computedView);}
this._stylesViewToReveal=stylesView;showMetrics.call(this,this._splitMode===_splitMode.Horizontal);this.sidebarPaneView.appendApplicableItems('elements-sidebar');for(let i=0;i<extensionSidebarPanes.length;++i){this._addExtensionSidebarPane(extensionSidebarPanes[i]);}
if(lastSelectedTabId){this.sidebarPaneView.tabbedPane().selectTab(lastSelectedTabId);}
this._splitWidget.setSidebarWidget(this.sidebarPaneView.tabbedPane());}
_extensionSidebarPaneAdded(event){const pane=(event.data);this._addExtensionSidebarPane(pane);}
_addExtensionSidebarPane(pane){if(pane.panelName()===this.name){this.sidebarPaneView.appendView(pane);}}}
ElementsPanel._firstInspectElementCompletedForTest=function(){};const _splitMode={Vertical:Symbol('Vertical'),Horizontal:Symbol('Horizontal'),Slim:Symbol('Slim'),};class ContextMenuProvider{appendApplicableItems(event,contextMenu,object){if(!(object instanceof RemoteObject.RemoteObject&&((object)).isNode())&&!(object instanceof DOMModel.DOMNode)&&!(object instanceof DOMModel.DeferredDOMNode)){return;}
if(ElementsPanel.instance().element.isAncestor((event.target))){return;}
const commandCallback=Revealer.reveal.bind(Revealer.Revealer,object);contextMenu.revealSection().appendItem(UIString.UIString('Reveal in Elements panel'),commandCallback);}}
class DOMNodeRevealer{reveal(node,omitFocus){const panel=ElementsPanel.instance();panel._pendingNodeReveal=true;return new Promise(revealPromise);function revealPromise(resolve,reject){if(node instanceof DOMModel.DOMNode){onNodeResolved((node));}else if(node instanceof DOMModel.DeferredDOMNode){((node)).resolve(onNodeResolved);}else if(node instanceof RemoteObject.RemoteObject){const domModel=(node).runtimeModel().target().model(DOMModel.DOMModel);if(domModel){domModel.pushObjectAsNodeToFrontend(node).then(onNodeResolved);}else{reject(new Error('Could not resolve a node to reveal.'));}}else{reject(new Error('Can\'t reveal a non-node.'));panel._pendingNodeReveal=false;}
function onNodeResolved(resolvedNode){panel._pendingNodeReveal=false;let currentNode=resolvedNode;if(currentNode){while(currentNode.parentNode){currentNode=currentNode.parentNode;}}
const isDetached=!(currentNode instanceof DOMModel.DOMDocument);const isDocument=node instanceof DOMModel.DOMDocument;if(!isDocument&&isDetached){const msg=ls`Node cannot be found in the current page.`;Console.Console.instance().warn(msg);reject(new Error(msg));return;}
if(resolvedNode){panel.revealAndSelectNode(resolvedNode,!omitFocus).then(resolve);return;}
reject(new Error('Could not resolve node to reveal.'));}}}}
class CSSPropertyRevealer{reveal(property){const panel=ElementsPanel.instance();return panel._revealProperty((property));}}
class ElementsActionDelegate{handleAction(context,actionId){const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){return true;}
const treeOutline=ElementsTreeOutline.forDOMModel(node.domModel());if(!treeOutline){return true;}
switch(actionId){case'elements.hide-element':treeOutline.toggleHideElement(node);return true;case'elements.edit-as-html':treeOutline.toggleEditAsHTML(node);return true;case'elements.undo':self.SDK.domModelUndoStack.undo();ElementsPanel.instance()._stylesWidget.forceUpdate();return true;case'elements.redo':self.SDK.domModelUndoStack.redo();ElementsPanel.instance()._stylesWidget.forceUpdate();return true;}
return false;}}
class PseudoStateMarkerDecorator{decorate(node){return{color:'orange',title:UIString.UIString('Element state: %s',':'+node.domModel().cssModel().pseudoState(node).join(', :'))};}}
var ElementsPanel$1=Object.freeze({__proto__:null,ElementsPanel:ElementsPanel,_splitMode:_splitMode,ContextMenuProvider:ContextMenuProvider,DOMNodeRevealer:DOMNodeRevealer,CSSPropertyRevealer:CSSPropertyRevealer,ElementsActionDelegate:ElementsActionDelegate,PseudoStateMarkerDecorator:PseudoStateMarkerDecorator});class InspectElementModeController{constructor(){this._toggleSearchAction=self.UI.actionRegistry.action('elements.toggle-element-search');this._mode=Protocol.Overlay.InspectMode.None;SDKModel.TargetManager.instance().addEventListener(SDKModel.Events.SuspendStateChanged,this._suspendStateChanged,this);SDKModel.TargetManager.instance().addModelListener(OverlayModel.OverlayModel,OverlayModel.Events.ExitedInspectMode,()=>this._setMode(Protocol.Overlay.InspectMode.None));OverlayModel.OverlayModel.setInspectNodeHandler(this._inspectNode.bind(this));SDKModel.TargetManager.instance().observeModels(OverlayModel.OverlayModel,this);this._showDetailedInspectTooltipSetting=Settings.Settings.instance().moduleSetting('showDetailedInspectTooltip');this._showDetailedInspectTooltipSetting.addChangeListener(this._showDetailedInspectTooltipChanged.bind(this));document.addEventListener('keydown',event=>{if(event.keyCode!==KeyboardShortcut.Keys.Esc.code){return;}
if(!this._isInInspectElementMode()){return;}
this._setMode(Protocol.Overlay.InspectMode.None);event.consume(true);},true);}
modelAdded(overlayModel){if(this._mode===Protocol.Overlay.InspectMode.None){return;}
overlayModel.setInspectMode(this._mode,this._showDetailedInspectTooltipSetting.get());}
modelRemoved(overlayModel){}
_isInInspectElementMode(){return this._mode!==Protocol.Overlay.InspectMode.None;}
_toggleInspectMode(){let mode;if(this._isInInspectElementMode()){mode=Protocol.Overlay.InspectMode.None;}else{mode=Settings.Settings.instance().moduleSetting('showUAShadowDOM').get()?Protocol.Overlay.InspectMode.SearchForUAShadowDOM:Protocol.Overlay.InspectMode.SearchForNode;}
this._setMode(mode);}
_captureScreenshotMode(){this._setMode(Protocol.Overlay.InspectMode.CaptureAreaScreenshot);}
_setMode(mode){if(SDKModel.TargetManager.instance().allTargetsSuspended()){return;}
this._mode=mode;for(const overlayModel of SDKModel.TargetManager.instance().models(OverlayModel.OverlayModel)){overlayModel.setInspectMode(mode,this._showDetailedInspectTooltipSetting.get());}
this._toggleSearchAction.setToggled(this._isInInspectElementMode());}
_suspendStateChanged(){if(!SDKModel.TargetManager.instance().allTargetsSuspended()){return;}
this._mode=Protocol.Overlay.InspectMode.None;this._toggleSearchAction.setToggled(false);}
async _inspectNode(node){ElementsPanel.instance().revealAndSelectNode(node,true,true);}
_showDetailedInspectTooltipChanged(){this._setMode(this._mode);}}
class ToggleSearchActionDelegate{handleAction(context,actionId){if(!inspectElementModeController){return false;}
if(actionId==='elements.toggle-element-search'){inspectElementModeController._toggleInspectMode();}else if(actionId==='elements.capture-area-screenshot'){inspectElementModeController._captureScreenshotMode();}
return true;}}
const inspectElementModeController=Root.Runtime.queryParam('isSharedWorker')?null:new InspectElementModeController();var InspectElementModeController$1=Object.freeze({__proto__:null,InspectElementModeController:InspectElementModeController,ToggleSearchActionDelegate:ToggleSearchActionDelegate,inspectElementModeController:inspectElementModeController});class EventListenersWidget extends ThrottledWidget.ThrottledWidget{constructor(){super();this._toolbarItems=[];this._showForAncestorsSetting=Settings.Settings.instance().moduleSetting('showEventListenersForAncestors');this._showForAncestorsSetting.addChangeListener(this.update.bind(this));this._dispatchFilterBySetting=Settings.Settings.instance().createSetting('eventListenerDispatchFilterType',DispatchFilterBy.All);this._dispatchFilterBySetting.addChangeListener(this.update.bind(this));this._showFrameworkListenersSetting=Settings.Settings.instance().createSetting('showFrameowkrListeners',true);this._showFrameworkListenersSetting.setTitle(UIString.UIString('Framework listeners'));this._showFrameworkListenersSetting.addChangeListener(this._showFrameworkListenersChanged.bind(this));this._eventListenersView=new EventListenersView.EventListenersView(this.update.bind(this));this._eventListenersView.show(this.element);const refreshButton=new Toolbar.ToolbarButton(UIString.UIString('Refresh'),'largeicon-refresh');refreshButton.addEventListener(Toolbar.ToolbarButton.Events.Click,this.update.bind(this));this._toolbarItems.push(refreshButton);this._toolbarItems.push(new Toolbar.ToolbarSettingCheckbox(this._showForAncestorsSetting,UIString.UIString('Show listeners on the ancestors'),UIString.UIString('Ancestors')));const dispatchFilter=new Toolbar.ToolbarComboBox(this._onDispatchFilterTypeChanged.bind(this),ls`Event listeners category`);function addDispatchFilterOption(name,value){const option=dispatchFilter.createOption(name,value);if(value===this._dispatchFilterBySetting.get()){dispatchFilter.select(option);}}
addDispatchFilterOption.call(this,UIString.UIString('All'),DispatchFilterBy.All);addDispatchFilterOption.call(this,UIString.UIString('Passive'),DispatchFilterBy.Passive);addDispatchFilterOption.call(this,UIString.UIString('Blocking'),DispatchFilterBy.Blocking);dispatchFilter.setMaxWidth(200);this._toolbarItems.push(dispatchFilter);this._toolbarItems.push(new Toolbar.ToolbarSettingCheckbox(this._showFrameworkListenersSetting,UIString.UIString('Resolve event listeners bound with framework')));self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this.update,this);this.update();}
doUpdate(){if(this._lastRequestedNode){this._lastRequestedNode.domModel().runtimeModel().releaseObjectGroup(_objectGroupName);delete this._lastRequestedNode;}
const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){this._eventListenersView.reset();this._eventListenersView.addEmptyHolderIfNeeded();return Promise.resolve();}
this._lastRequestedNode=node;const selectedNodeOnly=!this._showForAncestorsSetting.get();const promises=[];promises.push(node.resolveToObject(_objectGroupName));if(!selectedNodeOnly){let currentNode=node.parentNode;while(currentNode){promises.push(currentNode.resolveToObject(_objectGroupName));currentNode=currentNode.parentNode;}
promises.push(this._windowObjectInNodeContext(node));}
return Promise.all(promises).then(this._eventListenersView.addObjects.bind(this._eventListenersView)).then(this._showFrameworkListenersChanged.bind(this));}
toolbarItems(){return this._toolbarItems;}
_onDispatchFilterTypeChanged(event){this._dispatchFilterBySetting.set(event.target.value);}
_showFrameworkListenersChanged(){const dispatchFilter=this._dispatchFilterBySetting.get();const showPassive=dispatchFilter===DispatchFilterBy.All||dispatchFilter===DispatchFilterBy.Passive;const showBlocking=dispatchFilter===DispatchFilterBy.All||dispatchFilter===DispatchFilterBy.Blocking;this._eventListenersView.showFrameworkListeners(this._showFrameworkListenersSetting.get(),showPassive,showBlocking);}
_windowObjectInNodeContext(node){const executionContexts=node.domModel().runtimeModel().executionContexts();let context=null;if(node.frameId()){for(let i=0;i<executionContexts.length;++i){const executionContext=executionContexts[i];if(executionContext.frameId===node.frameId()&&executionContext.isDefault){context=executionContext;}}}else{context=executionContexts[0];}
return context.evaluate({expression:'self',objectGroup:_objectGroupName,includeCommandLineAPI:false,silent:true,returnByValue:false,generatePreview:false},false,false).then(result=>result.object||null);}
_eventListenersArrivedForTest(){}}
const DispatchFilterBy={All:'All',Blocking:'Blocking',Passive:'Passive'};const _objectGroupName='event-listeners-panel';var EventListenersWidget$1=Object.freeze({__proto__:null,EventListenersWidget:EventListenersWidget,DispatchFilterBy:DispatchFilterBy,_objectGroupName:_objectGroupName});class PropertiesWidget extends ThrottledWidget.ThrottledWidget{constructor(){super(true);this.registerRequiredCSS('elements/propertiesWidget.css');SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.AttrModified,this._onNodeChange,this);SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.AttrRemoved,this._onNodeChange,this);SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.CharacterDataModified,this._onNodeChange,this);SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.ChildNodeCountUpdated,this._onNodeChange,this);self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this._setNode,this);this._node=self.UI.context.flavor(DOMModel.DOMNode);this._treeOutline=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline({readOnly:true});this._treeOutline.setShowSelectionOnKeyboardFocus(true,false);this._expandController=new ObjectPropertiesSection.ObjectPropertiesSectionsTreeExpandController(this._treeOutline);this.contentElement.appendChild(this._treeOutline.element);this._treeOutline.addEventListener(TreeOutline.Events.ElementExpanded,()=>{userMetrics.actionTaken(UserMetrics.Action.DOMPropertiesExpanded);});this.update();}
_setNode(event){this._node=(event.data);this.update();}
async doUpdate(){if(this._lastRequestedNode){this._lastRequestedNode.domModel().runtimeModel().releaseObjectGroup(_objectGroupName$1);delete this._lastRequestedNode;}
if(!this._node){this._treeOutline.removeChildren();return;}
this._lastRequestedNode=this._node;const object=await this._node.resolveToObject(_objectGroupName$1);if(!object){return;}
const result=await object.callFunction(protoList);object.release();if(!result.object||result.wasThrown){return;}
const propertiesResult=await result.object.getOwnProperties(false);result.object.release();if(!propertiesResult||!propertiesResult.properties){return;}
const properties=propertiesResult.properties;this._treeOutline.removeChildren();let selected=false;for(let i=0;i<properties.length;++i){if(!parseInt(properties[i].name,10)){continue;}
const property=properties[i].value;let title=property.description;title=title.replace(/Prototype$/,'');const section=this._createSectionTreeElement(property,title);this._treeOutline.appendChild(section);if(!selected){section.select(true,false);selected=true;}}
function protoList(){let proto=this;const result={__proto__:null};let counter=1;while(proto){result[counter++]=proto;proto=proto.__proto__;}
return result;}}
_createSectionTreeElement(property,title){const titleElement=createElementWithClass('span','tree-element-title');titleElement.textContent=title;const section=new ObjectPropertiesSection.RootElement(property);section.title=titleElement;this._expandController.watchSection(title,section);return section;}
_onNodeChange(event){if(!this._node){return;}
const data=event.data;const node=(data instanceof DOMModel.DOMNode?data:data.node);if(this._node!==node){return;}
this.update();}}
const _objectGroupName$1='properties-sidebar-pane';var PropertiesWidget$1=Object.freeze({__proto__:null,PropertiesWidget:PropertiesWidget,_objectGroupName:_objectGroupName$1});class NodeStackTraceWidget extends ThrottledWidget.ThrottledWidget{constructor(){super(true);this.registerRequiredCSS('elements/nodeStackTraceWidget.css');this._noStackTraceElement=this.contentElement.createChild('div','gray-info-message');this._noStackTraceElement.textContent=ls`No stack trace available`;this._creationStackTraceElement=this.contentElement.createChild('div','stack-trace');this._linkifier=new Linkifier$1.Linkifier(MaxLengthForLinks);}
wasShown(){self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this.update,this);this.update();}
willHide(){self.UI.context.removeFlavorChangeListener(DOMModel.DOMNode,this.update,this);}
async doUpdate(){const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){this._noStackTraceElement.classList.remove('hidden');this._creationStackTraceElement.classList.add('hidden');return;}
const creationStackTrace=await node.creationStackTrace();if(creationStackTrace){this._noStackTraceElement.classList.add('hidden');this._creationStackTraceElement.classList.remove('hidden');const stackTracePreview=JSPresentationUtils.buildStackTracePreviewContents(node.domModel().target(),this._linkifier,{stackTrace:creationStackTrace});this._creationStackTraceElement.removeChildren();this._creationStackTraceElement.appendChild(stackTracePreview.element);}else{this._noStackTraceElement.classList.remove('hidden');this._creationStackTraceElement.classList.add('hidden');}}}
const MaxLengthForLinks=40;var NodeStackTraceWidget$1=Object.freeze({__proto__:null,NodeStackTraceWidget:NodeStackTraceWidget,MaxLengthForLinks:MaxLengthForLinks});class ClassesPaneWidget extends Widget.Widget{constructor(){super(true);this.registerRequiredCSS('elements/classesPaneWidget.css');this.contentElement.className='styles-element-classes-pane';const container=this.contentElement.createChild('div','title-container');this._input=container.createChild('div','new-class-input monospace');this.setDefaultFocusedElement(this._input);this._classesContainer=this.contentElement.createChild('div','source-code');this._classesContainer.classList.add('styles-element-classes-container');this._prompt=new ClassNamePrompt(this._nodeClasses.bind(this));this._prompt.setAutocompletionTimeout(0);this._prompt.renderAsBlock();const proxyElement=this._prompt.attach(this._input);this._prompt.setPlaceholder(UIString.UIString('Add new class'));this._prompt.addEventListener(TextPrompt.Events.TextChanged,this._onTextChanged,this);proxyElement.addEventListener('keydown',this._onKeyDown.bind(this),false);SDKModel.TargetManager.instance().addModelListener(DOMModel.DOMModel,DOMModel.Events.DOMMutated,this._onDOMMutated,this);this._mutatingNodes=new Set();this._pendingNodeClasses=new Map();this._updateNodeThrottler=new Throttler.Throttler(0);this._previousTarget=null;self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this._onSelectedNodeChanged,this);}
_splitTextIntoClasses(text){return text.split(/[.,\s]/).map(className=>className.trim()).filter(className=>className.length);}
_onKeyDown(event){if(!isEnterKey(event)&&!isEscKey(event)){return;}
if(isEnterKey(event)){event.consume();if(this._prompt.acceptAutoComplete()){return;}}
let text=event.target.textContent;if(isEscKey(event)){if(!StringUtilities.isWhitespace(text)){event.consume(true);}
text='';}
this._prompt.clearAutocomplete();event.target.textContent='';const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){return;}
const classNames=this._splitTextIntoClasses(text);if(!classNames.length){return;}
for(const className of classNames){this._toggleClass(node,className,true);}
const joinClassString=classNames.join(' ');const announcementString=classNames.length>1?ls`Classes ${joinClassString} added.`:ls`Class ${joinClassString} added.`;ARIAUtils.alert(announcementString,this.contentElement);this._installNodeClasses(node);this._update();}
_onTextChanged(){const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){return;}
this._installNodeClasses(node);}
_onDOMMutated(event){const node=(event.data);if(this._mutatingNodes.has(node)){return;}
delete node[ClassesPaneWidget._classesSymbol];this._update();}
_onSelectedNodeChanged(event){if(this._previousTarget&&this._prompt.text()){this._input.textContent='';this._installNodeClasses(this._previousTarget);}
this._previousTarget=(event.data);this._update();}
wasShown(){this._update();}
_update(){if(!this.isShowing()){return;}
let node=self.UI.context.flavor(DOMModel.DOMNode);if(node){node=node.enclosingElementOrSelf();}
this._classesContainer.removeChildren();this._input.disabled=!node;if(!node){return;}
const classes=this._nodeClasses(node);const keys=[...classes.keys()];keys.sort(String.caseInsensetiveComparator);for(let i=0;i<keys.length;++i){const className=keys[i];const label=UIUtils.CheckboxLabel.create(className,classes.get(className));label.classList.add('monospace');label.checkboxElement.addEventListener('click',this._onClick.bind(this,className),false);this._classesContainer.appendChild(label);}}
_onClick(className,event){const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){return;}
const enabled=event.target.checked;this._toggleClass(node,className,enabled);this._installNodeClasses(node);}
_nodeClasses(node){let result=node[ClassesPaneWidget._classesSymbol];if(!result){const classAttribute=node.getAttribute('class')||'';const classes=classAttribute.split(/\s/);result=new Map();for(let i=0;i<classes.length;++i){const className=classes[i].trim();if(!className.length){continue;}
result.set(className,true);}
node[ClassesPaneWidget._classesSymbol]=result;}
return result;}
_toggleClass(node,className,enabled){const classes=this._nodeClasses(node);classes.set(className,enabled);}
_installNodeClasses(node){const classes=this._nodeClasses(node);const activeClasses=new Set();for(const className of classes.keys()){if(classes.get(className)){activeClasses.add(className);}}
const additionalClasses=this._splitTextIntoClasses(this._prompt.textWithCurrentSuggestion());for(const className of additionalClasses){activeClasses.add(className);}
const newClasses=[...activeClasses.values()].sort();this._pendingNodeClasses.set(node,newClasses.join(' '));this._updateNodeThrottler.schedule(this._flushPendingClasses.bind(this));}
_flushPendingClasses(){const promises=[];for(const node of this._pendingNodeClasses.keys()){this._mutatingNodes.add(node);const promise=node.setAttributeValuePromise('class',this._pendingNodeClasses.get(node)).then(onClassValueUpdated.bind(this,node));promises.push(promise);}
this._pendingNodeClasses.clear();return Promise.all(promises);function onClassValueUpdated(node){this._mutatingNodes.delete(node);}}}
ClassesPaneWidget._classesSymbol=Symbol('ClassesPaneWidget._classesSymbol');class ButtonProvider$1{constructor(){this._button=new Toolbar.ToolbarToggle(UIString.UIString('Element Classes'),'');this._button.setText('.cls');this._button.element.classList.add('monospace');this._button.addEventListener(Toolbar.ToolbarButton.Events.Click,this._clicked,this);this._view=new ClassesPaneWidget();}
_clicked(){ElementsPanel.instance().showToolbarPane(!this._view.isShowing()?this._view:null,this._button);}
item(){return this._button;}}
class ClassNamePrompt extends TextPrompt.TextPrompt{constructor(nodeClasses){super();this._nodeClasses=nodeClasses;this.initialize(this._buildClassNameCompletions.bind(this),' ');this.disableDefaultSuggestionForEmptyInput();this._selectedFrameId='';this._classNamesPromise=null;}
_getClassNames(selectedNode){const promises=[];const completions=new Set();this._selectedFrameId=selectedNode.frameId();const cssModel=selectedNode.domModel().cssModel();const allStyleSheets=cssModel.allStyleSheets();for(const stylesheet of allStyleSheets){if(stylesheet.frameId!==this._selectedFrameId){continue;}
const cssPromise=cssModel.classNamesPromise(stylesheet.id).then(classes=>completions.addAll(classes));promises.push(cssPromise);}
const domPromise=selectedNode.domModel().classNamesPromise(selectedNode.ownerDocument.id).then(classes=>completions.addAll(classes));promises.push(domPromise);return Promise.all(promises).then(()=>[...completions]);}
_buildClassNameCompletions(expression,prefix,force){if(!prefix||force){this._classNamesPromise=null;}
const selectedNode=self.UI.context.flavor(DOMModel.DOMNode);if(!selectedNode||(!prefix&&!force&&!expression.trim())){return Promise.resolve([]);}
if(!this._classNamesPromise||this._selectedFrameId!==selectedNode.frameId()){this._classNamesPromise=this._getClassNames(selectedNode);}
return this._classNamesPromise.then(completions=>{const classesMap=this._nodeClasses((selectedNode));completions=completions.filter(value=>!classesMap.get(value));if(prefix[0]==='.'){completions=completions.map(value=>'.'+value);}
return completions.filter(value=>value.startsWith(prefix)).sort().map(completion=>({text:completion}));});}}
var ClassesPaneWidget$1=Object.freeze({__proto__:null,ClassesPaneWidget:ClassesPaneWidget,ButtonProvider:ButtonProvider$1,ClassNamePrompt:ClassNamePrompt});class ElementStatePaneWidget extends Widget.Widget{constructor(){super(true);this.registerRequiredCSS('elements/elementStatePaneWidget.css');this.contentElement.className='styles-element-state-pane';this.contentElement.createChild('div').createTextChild(UIString.UIString('Force element state'));const table=createElementWithClass('table','source-code');ARIAUtils.markAsPresentation(table);const inputs=[];this._inputs=inputs;function clickListener(event){const node=self.UI.context.flavor(DOMModel.DOMNode);if(!node){return;}
node.domModel().cssModel().forcePseudoState(node,event.target.state,event.target.checked);}
function createCheckbox(state){const td=createElement('td');const label=UIUtils.CheckboxLabel.create(':'+state);const input=label.checkboxElement;input.state=state;input.addEventListener('click',clickListener,false);inputs.push(input);td.appendChild(label);return td;}
let tr=table.createChild('tr');tr.appendChild(createCheckbox.call(null,'active'));tr.appendChild(createCheckbox.call(null,'hover'));tr=table.createChild('tr');tr.appendChild(createCheckbox.call(null,'focus'));tr.appendChild(createCheckbox.call(null,'visited'));tr=table.createChild('tr');tr.appendChild(createCheckbox.call(null,'focus-within'));try{tr.querySelector(':focus-visible');tr.appendChild(createCheckbox.call(null,'focus-visible'));}catch(e){}
this.contentElement.appendChild(table);self.UI.context.addFlavorChangeListener(DOMModel.DOMNode,this._update,this);}
_updateModel(cssModel){if(this._cssModel===cssModel){return;}
if(this._cssModel){this._cssModel.removeEventListener(CSSModel.Events.PseudoStateForced,this._update,this);}
this._cssModel=cssModel;if(this._cssModel){this._cssModel.addEventListener(CSSModel.Events.PseudoStateForced,this._update,this);}}
wasShown(){this._update();}
_update(){if(!this.isShowing()){return;}
let node=self.UI.context.flavor(DOMModel.DOMNode);if(node){node=node.enclosingElementOrSelf();}
this._updateModel(node?node.domModel().cssModel():null);if(node){const nodePseudoState=node.domModel().cssModel().pseudoState(node);for(const input of this._inputs){input.disabled=!!node.pseudoType();input.checked=nodePseudoState.indexOf(input.state)>=0;}}else{for(const input of this._inputs){input.disabled=true;input.checked=false;}}}}
class ButtonProvider$2{constructor(){this._button=new Toolbar.ToolbarToggle(UIString.UIString('Toggle Element State'),'');this._button.setText(UIString.UIString(':hov'));this._button.addEventListener(Toolbar.ToolbarButton.Events.Click,this._clicked,this);this._button.element.classList.add('monospace');this._view=new ElementStatePaneWidget();}
_clicked(){ElementsPanel.instance().showToolbarPane(!this._view.isShowing()?this._view:null,this._button);}
item(){return this._button;}}
var ElementStatePaneWidget$1=Object.freeze({__proto__:null,ElementStatePaneWidget:ElementStatePaneWidget,ButtonProvider:ButtonProvider$2});export{ClassesPaneWidget$1 as ClassesPaneWidget,ColorSwatchPopoverIcon$1 as ColorSwatchPopoverIcon,ComputedStyleModel$1 as ComputedStyleModel,ComputedStyleWidget$1 as ComputedStyleWidget,DOMLinkifier,DOMPath,ElementStatePaneWidget$1 as ElementStatePaneWidget,ElementsBreadcrumbs$1 as ElementsBreadcrumbs,ElementsPanel$1 as ElementsPanel,ElementsSidebarPane$1 as ElementsSidebarPane,ElementsTreeElement$1 as ElementsTreeElement,ElementsTreeElementHighlighter$1 as ElementsTreeElementHighlighter,ElementsTreeOutline$1 as ElementsTreeOutline,EventListenersWidget$1 as EventListenersWidget,InspectElementModeController$1 as InspectElementModeController,MarkerDecorator$1 as MarkerDecorator,MetricsSidebarPane$1 as MetricsSidebarPane,NodeStackTraceWidget$1 as NodeStackTraceWidget,PlatformFontsWidget$1 as PlatformFontsWidget,PropertiesWidget$1 as PropertiesWidget,StylePropertyHighlighter$1 as StylePropertyHighlighter,StylePropertyTreeElement$1 as StylePropertyTreeElement,StylesSidebarPane$1 as StylesSidebarPane};