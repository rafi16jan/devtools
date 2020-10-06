self.Runtime.cachedResources["elements/breadcrumbs.css"]="/*\n * Copyright 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.crumbs {\n    display: inline-block;\n    pointer-events: auto;\n    cursor: default;\n    white-space: nowrap;\n}\n\n.crumbs .crumb {\n    display: inline-block;\n    padding: 0 7px;\n    line-height: 23px;\n    white-space: nowrap;\n}\n\n.crumbs .crumb.collapsed > * {\n    display: none;\n}\n\n.crumbs .crumb.collapsed::before {\n    content: \"\\2026\";\n    font-weight: bold;\n}\n\n.crumbs .crumb.compact .extra {\n    display: none;\n}\n\n.crumb.selected, .crumb:hover {\n    background-color: var(--toolbar-bg-color);\n}\n\n.crumb:not(.selected) .node-label-name {\n    color: var(--dom-tag-name-color);\n}\n\n.crumb:not(.selected) .node-label-class {\n    color: var(--dom-attribute-name-color);\n}\n\n/*# sourceURL=elements/breadcrumbs.css */";self.Runtime.cachedResources["elements/classesPaneWidget.css"]="/**\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.styles-element-classes-pane {\n    background-color: var(--toolbar-bg-color);\n    border-bottom: 1px solid rgb(189, 189, 189);\n    padding: 6px 2px 2px;\n}\n\n.styles-element-classes-container {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.styles-element-classes-pane [is=dt-checkbox] {\n    margin-right: 15px;\n}\n\n.styles-element-classes-pane .title-container {\n    padding-bottom: 2px;\n}\n\n.styles-element-classes-pane .new-class-input {\n    padding-left: 3px;\n    padding-right: 3px;\n    overflow: hidden;\n    border: 1px solid #ddd;\n    line-height: 15px;\n    margin-left: 3px;\n    width: calc(100% - 7px);\n    background-color: #fff;\n    cursor: text;\n}\n\n/*# sourceURL=elements/classesPaneWidget.css */";self.Runtime.cachedResources["elements/computedStyleSidebarPane.css"]="/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.computed-properties {\n    user-select: text;\n    flex-shrink: 0;\n}\n\n.styles-sidebar-pane-toolbar {\n    border-bottom: 1px solid #eee;\n    flex-shrink: 0;\n}\n\n.styles-sidebar-pane-filter-box {\n    flex: auto;\n    display: flex;\n}\n\n.styles-sidebar-pane-filter-box > input {\n    outline: none !important;\n    border: none;\n    width: 100%;\n    background: white;\n    padding-left: 4px;\n    margin: 3px;\n}\n\n.styles-sidebar-pane-filter-box > input:focus,\n.styles-sidebar-pane-filter-box > input:not(:placeholder-shown) {\n    box-shadow: var(--focus-ring-active-shadow);\n}\n\n.styles-sidebar-pane-filter-box > input::placeholder {\n    color: rgba(0, 0, 0, 0.54);\n}\n\n@media (forced-colors: active) {\n    .styles-sidebar-pane-filter-box > input {\n        border: 1px solid ButtonText;\n    }\n}\n\n/*# sourceURL=elements/computedStyleSidebarPane.css */";self.Runtime.cachedResources["elements/computedStyleWidgetTree.css"]="/*\n * Copyright (c) 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.computed-style-property {\n    overflow: hidden;\n    flex: auto;\n    text-overflow: ellipsis;\n}\n\n.computed-style-property .property-name {\n    width: 16em;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    max-width: 52%;\n    display: inline-block;\n    vertical-align: text-top;\n}\n\n.computed-style-property .property-value {\n    margin-left: 2em;\n    position: relative;\n}\n\n.computed-style-property .property-value-text {\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.tree-outline li:hover .goto-source-icon {\n    display: block;\n    margin-top: -2px;\n}\n\n.goto-source-icon {\n    background-color: #5a5a5a;\n    display: none;\n    position: absolute;\n    left: -16px;\n    top: 0;\n}\n\n.goto-source-icon:hover {\n    background-color: #333;\n}\n\n.computed-style-property-inherited {\n    opacity: 0.5;\n}\n\n.trace-link {\n    user-select: none;\n    float: right;\n    padding-left: 1em;\n    position: relative;\n    z-index: 1;\n}\n\n.property-trace {\n    text-overflow: ellipsis;\n    overflow: hidden;\n    flex-grow: 1;\n}\n\n.property-trace-selector {\n    color: gray;\n    padding-left: 2em;\n}\n\n.property-trace-value {\n    position: relative;\n    display: inline-block;\n    margin-left: 16px;\n}\n\n.property-trace-inactive .property-trace-value::before {\n    position: absolute;\n    content: \".\";\n    border-bottom: 1px solid rgba(0, 0, 0, 0.35);\n    top: 0;\n    bottom: 5px;\n    left: 0;\n    right: 0;\n}\n\n.tree-outline li.odd-row {\n    position: relative;\n    background-color: #F5F5F5;\n}\n\n.tree-outline, .tree-outline ol {\n    padding-left: 0;\n}\n\n.tree-outline li:hover {\n    background-color: rgb(235, 242, 252);\n    cursor: pointer;\n}\n\n.tree-outline li::before {\n    margin-left: 4px;\n}\n\n.delimeter {\n    color: transparent;\n}\n\n.delimeter::selection {\n    color: transparent;\n}\n\n.computed-narrow .computed-style-property .property-name,\n.computed-narrow .computed-style-property .property-value {\n    display: inline-block;\n    width: 100%;\n    max-width: 100%;\n    margin-left: 0;\n    white-space: nowrap;\n}\n\n.computed-narrow .computed-style-property {\n    padding: 2px 0;\n    display: block;\n    white-space: normal;\n}\n\n.computed-narrow.tree-outline li::before {\n    margin-top: -14px;\n}\n\n@media (forced-colors: active) {\n    .computed-style-property-inherited {\n        opacity: 1;\n    }\n    :host-context(.monospace.computed-properties) .tree-outline li:hover {\n        forced-color-adjust: none;\n        background-color: Highlight;\n    }\n    :host-context(.monospace.computed-properties) .tree-outline:not(.hide-selection-when-blurred) li.parent:hover.selected::before,\n    :host-context(.monospace.computed-properties) .tree-outline-disclosure li.parent:hover::before,\n    :host-context(.monospace.computed-properties) .tree-outline li:hover .goto-source-icon {\n        background-color: HighlightText;\n    }\n    :host-context(.monospace.computed-properties) .tree-outline li:hover * {\n        color: HighlightText;\n    }\n    .property-trace-inactive .property-trace-value::before {\n        content: \"\";\n        border-bottom-color: HighlightText !important;\n    }\n}\n\n/*# sourceURL=elements/computedStyleWidgetTree.css */";self.Runtime.cachedResources["elements/domLinkifier.css"]="/*\n * Copyright 2018 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n  display: inline;\n}\n\n.node-link {\n    cursor: pointer;\n    display: inline;\n    pointer-events: auto;\n}\n\n.node-link[data-keyboard-focus=\"true\"]:focus {\n    outline-width: unset;\n}\n\n.node-label-name {\n    color: rgb(136, 18, 128);\n}\n\n.node-label-class, .node-label-pseudo {\n    color: rgb(153, 69, 0);\n}\n\n/*# sourceURL=elements/domLinkifier.css */";self.Runtime.cachedResources["elements/elementsPanel.css"]="/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n#elements-content {\n    flex: 1 1;\n    overflow: auto;\n    padding: 2px 0 0 0;\n}\n\n#elements-content:not(.elements-wrap) > div {\n    display: inline-block;\n    min-width: 100%;\n}\n\n#elements-content.elements-wrap {\n    overflow-x: hidden;\n}\n\n#elements-crumbs {\n    flex: 0 0 23px;\n    background-color: white;\n    border-top: 1px solid var(--divider-color);\n    overflow: hidden;\n    width: 100%;\n}\n\n.style-panes-wrapper {\n    overflow: hidden auto;\n}\n\n.style-panes-wrapper > div:not(:first-child) {\n    border-top: 1px solid var(--divider-color);\n}\n\n.elements-tree-header {\n    height: 24px;\n    border-top: 1px solid var(--divider-color);\n    border-bottom: 1px solid var(--divider-color);\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n}\n\n.elements-tree-header-frame {\n    margin-left: 6px;\n    margin-right: 6px;\n    flex: none;\n}\n\n/*# sourceURL=elements/elementsPanel.css */";self.Runtime.cachedResources["elements/elementStatePaneWidget.css"]="/**\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.styles-element-state-pane {\n    overflow: hidden;\n    padding-left: 2px;\n    background-color: var(--toolbar-bg-color);\n    border-bottom: 1px solid rgb(189, 189, 189);\n    margin-top: 0;\n    padding-bottom: 2px;\n}\n\n.styles-element-state-pane > div {\n    margin: 8px 4px 6px;\n}\n\n.styles-element-state-pane > table {\n    width: 100%;\n    border-spacing: 0;\n}\n\n.styles-element-state-pane td {\n    padding: 0;\n}\n\n/*# sourceURL=elements/elementStatePaneWidget.css */";self.Runtime.cachedResources["elements/elementsTreeOutline.css"]="/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.elements-disclosure {\n    width: 100%;\n    display: inline-block;\n    line-height: normal;\n}\n\n.elements-disclosure li {\n    /** Keep margin-left & padding-left in sync with ElementsTreeElements.updateDecorators **/\n    padding: 1px 0 0 14px;\n    margin-left: -2px;\n    word-wrap: break-word;\n    position: relative;\n    min-height: 15px;\n    line-height: 1.36;\n}\n\n.elements-disclosure li.parent {\n    /** Keep it in sync with ElementsTreeElements.updateDecorators **/\n    margin-left: -13px;\n}\n\n.elements-disclosure li .selected-hint:before {\n    font-style: italic;\n    content: \" == $0\";\n    opacity: 0;\n    position: absolute;\n    white-space: pre;\n}\n\n.elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) li.selected .selected-hint:before {\n    opacity: 0.6;\n}\n\n.elements-disclosure li.parent::before {\n    box-sizing: border-box;\n}\n\n.elements-disclosure li.parent::before {\n    user-select: none;\n    -webkit-mask-image: url(Images/treeoutlineTriangles.svg);\n    -webkit-mask-size: 32px 24px;\n    content: '\\00a0\\00a0';\n    color: transparent;\n    text-shadow: none;\n    margin-right: -3px;\n}\n\n.elements-disclosure li.always-parent::before {\n    visibility: hidden;\n}\n\n.elements-disclosure li.parent::before {\n    -webkit-mask-position: 0 0;\n    background-color: #727272;\n}\n\n.elements-disclosure li .selection {\n    display: none;\n    z-index: -1;\n}\n\n.elements-disclosure li.hovered:not(.selected) .selection {\n    display: block;\n    left: 3px;\n    right: 3px;\n    background-color: var(--item-hover-color);\n    border-radius: 5px;\n}\n\n.elements-disclosure li.parent.expanded::before {\n    -webkit-mask-position: -16px 0;\n}\n\n.elements-disclosure li.selected .selection {\n    display: block;\n}\n\n.elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) .selection {\n    background-color: var(--item-selection-inactive-bg-color);\n}\n\n.elements-disclosure .elements-tree-outline.hide-selection-when-blurred .selected:focus[data-keyboard-focus=\"true\"] .highlight > * {\n    background: var(--focus-bg-color);\n    border-radius: 2px;\n    box-shadow: 0px 0px 0px 2px var(--focus-bg-color);\n}\n\n.elements-disclosure ol {\n    list-style-type: none;\n    /** Keep it in sync with ElementsTreeElements.updateDecorators **/\n    padding-inline-start: 12px;\n    margin: 0;\n}\n\n.elements-disclosure ol.children {\n    display: none;\n}\n\n.elements-disclosure ol.children.expanded {\n    display: block;\n}\n\n.elements-disclosure li .webkit-html-tag.close {\n    margin-left: -12px;\n}\n\n.elements-disclosure > ol {\n    position: relative;\n    margin: 0;\n    cursor: default;\n    min-width: 100%;\n    min-height: 100%;\n    padding-left: 2px;\n}\n\n.elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) li.selected:focus .selection {\n    background-color: var(--item-selection-bg-color);\n}\n\n.elements-tree-outline ol.shadow-root-depth-4 {\n    background-color: rgba(0, 0, 0, 0.04);\n}\n\n.elements-tree-outline ol.shadow-root-depth-3 {\n    background-color: rgba(0, 0, 0, 0.03);\n}\n\n.elements-tree-outline ol.shadow-root-depth-2 {\n    background-color: rgba(0, 0, 0, 0.02);\n}\n\n.elements-tree-outline ol.shadow-root-depth-1 {\n    background-color: rgba(0, 0, 0, 0.01);\n}\n\n.elements-tree-outline ol.shadow-root-deep {\n    background-color: transparent;\n}\n\n.elements-tree-editor {\n    box-shadow: var(--drop-shadow);\n    margin-right: 4px;\n}\n\n.elements-disclosure li.elements-drag-over .selection {\n    display: block;\n    margin-top: -2px;\n    border-top: 2px solid var(--selection-bg-color);\n}\n\n.elements-disclosure li.in-clipboard .highlight {\n    outline: 1px dotted darkgrey;\n}\n\n.CodeMirror {\n    background-color: white;\n    height: 300px !important;\n}\n\n.CodeMirror-lines {\n    padding: 0;\n}\n\n.CodeMirror pre {\n    padding: 0;\n}\n\nbutton, input, select {\n  font-family: inherit;\n  font-size: inherit;\n}\n\n.editing {\n    box-shadow: var(--drop-shadow);\n    background-color: white;\n    text-overflow: clip !important;\n    padding-left: 2px;\n    margin-left: -2px;\n    padding-right: 2px;\n    margin-right: -2px;\n    margin-bottom: -1px;\n    padding-bottom: 1px;\n    opacity: 1.0 !important;\n}\n\n.editing,\n.editing * {\n    color: #222 !important;\n    text-decoration: none !important;\n}\n\n.editing br {\n    display: none;\n}\n\n.elements-gutter-decoration {\n    position: absolute;\n    top: 3px;\n    left: 2px;\n    height: 9px;\n    width: 9px;\n    border-radius: 5px;\n    border: 1px solid orange;\n    background-color: orange;\n    cursor: pointer;\n}\n\n.elements-gutter-decoration.elements-has-decorated-children {\n    opacity: 0.5;\n}\n\n.add-attribute {\n    margin-left: 1px;\n    margin-right: 1px;\n    white-space: nowrap;\n}\n\n.elements-tree-nowrap, .elements-tree-nowrap .li {\n    white-space: pre !important;\n}\n\n.elements-disclosure .elements-tree-nowrap li {\n    word-wrap: normal;\n}\n\n/* DOM update highlight */\n@-webkit-keyframes dom-update-highlight-animation {\n    from {\n        background-color: rgb(158, 54, 153);\n        color: white;\n    }\n    80% {\n        background-color: rgb(245, 219, 244);\n        color: inherit;\n    }\n    to {\n        background-color: inherit;\n    }\n}\n\n@-webkit-keyframes dom-update-highlight-animation-dark {\n    from {\n        background-color: rgb(158, 54, 153);\n        color: white;\n    }\n    80% {\n        background-color: #333;\n        color: inherit;\n    }\n    to {\n        background-color: inherit;\n    }\n}\n\n.dom-update-highlight {\n    -webkit-animation: dom-update-highlight-animation 1.4s 1 cubic-bezier(0, 0, 0.2, 1);\n    border-radius: 2px;\n}\n\n:host-context(.-theme-with-dark-background) .dom-update-highlight {\n    -webkit-animation: dom-update-highlight-animation-dark 1.4s 1 cubic-bezier(0, 0, 0.2, 1);\n}\n\n.elements-disclosure.single-node li {\n    padding-left: 2px;\n}\n\n.elements-tree-shortcut-title, .elements-tree-shortcut-link {\n    color: rgb(87, 87, 87);\n}\n\n.elements-disclosure .gutter-container {\n    position: absolute;\n    top: 0;\n    left: 0;\n    cursor: pointer;\n    width: 15px;\n    height: 15px;\n}\n\n.elements-hide-gutter .gutter-container {\n    display: none;\n}\n\n.gutter-menu-icon {\n    display: block;\n    visibility: hidden;\n    transform: rotate(-90deg) scale(0.8);\n    background-color: white;\n    position: relative;\n    left: -7px;\n    top: -3px;\n}\n\n.elements-disclosure li.selected .gutter-container:not(.has-decorations) .gutter-menu-icon {\n    visibility: visible;\n}\n\n/** Guide line */\nli.selected {\n    z-index: 0;\n}\n\nli.hovered:not(.always-parent) + ol.children, .elements-tree-outline ol.shadow-root, li.selected:not(.always-parent) + ol.children {\n    margin-left: 5px;\n    padding-inline-start: 6px;\n    border-width: 1px;\n    border-left-style: solid;\n}\n\nli.hovered:not(.always-parent) + ol.children:not(.shadow-root) {\n    border-color: hsla(0,0%,0%,0.1);\n}\n\n.elements-tree-outline ol.shadow-root {\n    border-color: hsla(0,0%,80%,1);\n}\n\nli.selected:not(.always-parent) + ol.children {\n    border-color: hsla(216,68%,80%,1) !important;\n}\n\n@media (forced-colors: active) {\n    .elements-disclosure li.parent::before {\n        forced-color-adjust: none;\n        background-color: ButtonText !important;\n    }\n    .elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) li.selected .selected-hint:before {\n        opacity: unset;\n    }\n    .elements-disclosure li.hovered:not(.selected) .selection,\n    .elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) li.selected:focus .selection,\n    .elements-disclosure .elements-tree-outline:not(.hide-selection-when-blurred) .selection {\n        forced-color-adjust: none;\n        background: Canvas !important;\n        border: 1px solid Highlight !important;\n    }\n    .gutter-menu-icon {\n        forced-color-adjust: none;\n    }\n}\n\n/*# sourceURL=elements/elementsTreeOutline.css */";self.Runtime.cachedResources["elements/metricsSidebarPane.css"]="/**\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.metrics {\n    padding: 8px;\n    font-size: 10px;\n    text-align: center;\n    white-space: nowrap;\n    min-height: var(--metrics-height);\n    display: flex;\n    flex-direction: column;\n    -webkit-align-items: center;\n    -webkit-justify-content: center;\n}\n\n:host {\n    --metrics-height: 190px;\n    height: var(--metrics-height);\n    contain: strict;\n}\n\n:host-context(.-theme-with-dark-background) .metrics {\n    color: #222;\n}\n\n:host-context(.-theme-with-dark-background) .metrics > div:hover {\n    color: #ccc;\n}\n\n.metrics .label {\n    position: absolute;\n    font-size: 10px;\n    margin-left: 3px;\n    padding-left: 2px;\n    padding-right: 2px;\n}\n\n.metrics .position {\n    border: 1px rgb(66%, 66%, 66%) dotted;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    padding: 3px;\n    margin: 3px;\n}\n\n.metrics .margin {\n    border: 1px dashed;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px 6px;\n    margin: 3px;\n}\n\n.metrics .border {\n    border: 1px black solid;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px 6px;\n    margin: 3px;\n}\n\n.metrics .padding {\n    border: 1px grey dashed;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px 6px;\n    margin: 3px;\n}\n\n.metrics .content {\n    position: static;\n    border: 1px gray solid;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px;\n    margin: 3px;\n    min-width: 80px;\n    overflow: visible;\n}\n\n.metrics .content span {\n    display: inline-block;\n}\n\n.metrics .editing {\n    position: relative;\n    z-index: 100;\n    cursor: text;\n}\n\n.metrics .left {\n    display: inline-block;\n    vertical-align: middle;\n}\n\n.metrics .right {\n    display: inline-block;\n    vertical-align: middle;\n}\n\n.metrics .top {\n    display: inline-block;\n}\n\n.metrics .bottom {\n    display: inline-block;\n}\n\n/*# sourceURL=elements/metricsSidebarPane.css */";self.Runtime.cachedResources["elements/platformFontsWidget.css"]="/**\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    user-select: text;\n}\n\n.platform-fonts {\n    flex-shrink: 0;\n}\n\n.font-name {\n    font-weight: bold;\n}\n\n.font-usage {\n    color: #888;\n    padding-left: 3px;\n}\n\n.title {\n    padding: 0 5px;\n    border-top: 1px solid;\n    border-bottom: 1px solid;\n    border-color: #ddd;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    height: 24px;\n    background-color: #f1f1f1;\n    display: flex;\n    align-items: center;\n}\n\n.stats-section {\n    margin: 5px 0;\n}\n\n.font-stats-item {\n    padding-left: 1em;\n}\n\n.font-stats-item .font-delimeter {\n    margin: 0 1ex 0 1ex;\n}\n\n/*# sourceURL=elements/platformFontsWidget.css */";self.Runtime.cachedResources["elements/propertiesWidget.css"]="/*\n * Copyright (c) 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.properties-widget-section {\n    padding: 2px 0px 2px 5px;\n    flex: none;\n}\n\n/*# sourceURL=elements/propertiesWidget.css */";self.Runtime.cachedResources["elements/nodeStackTraceWidget.css"]="/*\n * Copyright 2019 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.stack-trace {\n  font-size: 11px !important;\n  font-family: Menlo, monospace;\n}\n\n/*# sourceURL=elements/nodeStackTraceWidget.css */";self.Runtime.cachedResources["elements/stylesSectionTree.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.tree-outline {\n    padding: 0;\n}\n\n.tree-outline li.not-parsed-ok {\n    margin-left: 0;\n}\n\n.tree-outline li.filter-match {\n    background-color: rgba(255, 255, 0, 0.5);\n}\n\n:host-context(.-theme-with-dark-background) .tree-outline li.filter-match {\n    background-color: hsla(133, 100%, 30%, 0.5);\n}\n\n.tree-outline li.overloaded.filter-match {\n    background-color: rgba(255, 255, 0, 0.25);\n}\n\n:host-context(.-theme-with-dark-background) .tree-outline li.overloaded.filter-match {\n    background-color: hsla(133, 100%, 30%, 0.25);\n}\n\n.tree-outline li.not-parsed-ok .exclamation-mark {\n    display: inline-block;\n    position: relative;\n    width: 11px;\n    height: 10px;\n    margin: 0 7px 0 0;\n    top: 1px;\n    left: -36px; /* outdent to compensate for the top-level property indent */\n    user-select: none;\n    cursor: default;\n    z-index: 1;\n}\n\n.tree-outline li {\n    margin-left: 12px;\n    padding-left: 22px;\n    white-space: normal;\n    text-overflow: ellipsis;\n    cursor: auto;\n    display: block;\n}\n\n.tree-outline li::before {\n    display: none;\n}\n\n.tree-outline li .webkit-css-property {\n    margin-left: -22px; /* outdent the first line of longhand properties (in an expanded shorthand) to compensate for the \"padding-left\" shift in .tree-outline li */\n}\n\n.tree-outline > li {\n    padding-left: 38px;\n    clear: both;\n    min-height: 14px;\n}\n\n.tree-outline > li .webkit-css-property {\n    margin-left: -38px; /* outdent the first line of the top-level properties to compensate for the \"padding-left\" shift in .tree-outline > li */\n}\n\n.tree-outline > li.child-editing {\n    padding-left: 8px;\n}\n\n.tree-outline > li.child-editing .text-prompt {\n    white-space: pre-wrap;\n}\n\n.tree-outline > li.child-editing .webkit-css-property {\n    margin-left: 0;\n}\n\n.tree-outline li.child-editing {\n    word-wrap: break-word !important;\n    white-space: normal !important;\n    padding-left: 0;\n}\n\nol:not(.tree-outline) {\n    display: none;\n    margin: 0;\n    padding-inline-start: 12px;\n    list-style: none;\n}\n\nol.expanded {\n    display: block;\n}\n\n.tree-outline li .info {\n    padding-top: 4px;\n    padding-bottom: 3px;\n}\n\n.enabled-button {\n    visibility: hidden;\n    float: left;\n    font-size: 10px;\n    margin: 0;\n    vertical-align: top;\n    position: relative;\n    z-index: 1;\n    width: 18px;\n    left: -40px; /* original -2px + (-38px) to compensate for the first line outdent */\n    top: 1px;\n    height: 13px;\n}\n\n.tree-outline li.editing .enabled-button {\n    display: none !important;\n}\n\n.overloaded:not(.has-ignorable-error),\n.inactive,\n.disabled,\n.not-parsed-ok:not(.has-ignorable-error) {\n    text-decoration: line-through;\n}\n\n.has-ignorable-error .webkit-css-property {\n    color: inherit;\n}\n\n.implicit,\n.inherited {\n    opacity: 0.5;\n}\n\n.has-ignorable-error {\n    color: gray;\n}\n\n.tree-outline li.editing {\n    margin-left: 10px;\n    text-overflow: clip;\n}\n\n.tree-outline li.editing-sub-part {\n    padding: 3px 6px 8px 18px;\n    margin: -1px -6px -8px -6px;\n    text-overflow: clip;\n}\n\n:host-context(.no-affect) .tree-outline li {\n    opacity: 0.5;\n}\n\n:host-context(.no-affect) .tree-outline li.editing {\n    opacity: 1.0;\n}\n\n:host-context(.styles-panel-hovered:not(.read-only)) .webkit-css-property:hover,\n:host-context(.styles-panel-hovered:not(.read-only)) .value:hover {\n    text-decoration: underline;\n    cursor: default;\n}\n\n.styles-name-value-separator {\n    display: inline-block;\n    width: 14px;\n    text-decoration: inherit;\n    white-space: pre;\n}\n\n.styles-clipboard-only {\n    display: inline-block;\n    width: 0;\n    opacity: 0;\n    pointer-events: none;\n    white-space: pre;\n}\n\n.tree-outline li.child-editing .styles-clipboard-only {\n    display: none;\n}\n\n/* Matched styles */\n\n:host-context(.matched-styles) .tree-outline li {\n    margin-left: 0 !important;\n}\n\n.expand-icon {\n    user-select: none;\n    margin-left: -6px;\n    margin-right: 2px;\n    margin-bottom: -2px;\n}\n\n.tree-outline li:not(.parent) .expand-icon {\n    display: none;\n}\n\n:host-context(.matched-styles:not(.read-only):hover) .enabled-button {\n    visibility: visible;\n}\n\n:host-context(.matched-styles:not(.read-only)) .tree-outline li.disabled .enabled-button {\n    visibility: visible;\n}\n\n:host-context(.matched-styles) ol.expanded {\n    margin-left: 16px;\n}\n\n.devtools-link-styled-trim {\n    display: inline-block;\n    overflow: hidden;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    max-width: 80%;\n    vertical-align: bottom;\n}\n\n@media (forced-colors: active) {\n    .tree-outline > li .webkit-css-property {\n        color: HighlightText;\n    }\n}\n\n/*# sourceURL=elements/stylesSectionTree.css */";self.Runtime.cachedResources["elements/stylesSidebarPane.css"]="/**\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.styles-section {\n    min-height: 18px;\n    white-space: nowrap;\n    user-select: text;\n    border-bottom: 1px solid var(--divider-color);\n    position: relative;\n    overflow: hidden;\n}\n\n.styles-section > div {\n    padding: 2px 2px 4px 4px;\n}\n\n.styles-section:last-child {\n    border-bottom: none;\n}\n\n.styles-section.read-only {\n    background-color: #fafafa;\n    font-style: italic;\n}\n\n.styles-section[data-keyboard-focus=\"true\"]:focus {\n    background-color: hsl(214, 48%, 95%);\n}\n\n.styles-section.read-only[data-keyboard-focus=\"true\"]:focus {\n    background-color: hsl(215, 25%, 87%);\n}\n\n.styles-section .simple-selector.filter-match {\n    background-color: rgba(255, 255, 0, 0.5);\n}\n\n:host-context(.-theme-with-dark-background) .styles-section .simple-selector.filter-match {\n    background-color: hsla(133, 100%, 30%, 0.5);\n}\n\n.sidebar-pane-closing-brace {\n    clear: both;\n}\n\n.styles-section-title {\n    background-origin: padding;\n    background-clip: padding;\n    word-wrap: break-word;\n    white-space: normal;\n}\n\n.styles-section-title .media-list {\n    color: hsl(0, 0%, 46%);\n}\n\n.styles-section-title .media-list.media-matches .media.editable-media {\n    color: #222;\n}\n\n.styles-section-title .media:not(.editing-media),\n.styles-section-title .media:not(.editing-media) .subtitle {\n    overflow: hidden;\n}\n\n.styles-section-title .media .subtitle {\n    float: right;\n    color: hsl(0, 0%, 34%);\n}\n\n.styles-section-subtitle {\n    color: hsl(0, 0%, 44%);\n    float: right;\n    padding-left: 15px;\n    max-width: 100%;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    white-space: nowrap;\n    height: 15px;\n    margin-bottom: -1px;\n}\n\n.sidebar-pane-open-brace,\n.sidebar-pane-closing-brace {\n    color: hsl(0, 0%, 46%);\n}\n\n.styles-section .styles-section-subtitle .devtools-link {\n    color: hsl(0, 0%, 44%);\n    text-decoration-color: hsl(0, 0%, 60%);\n}\n\n.styles-section .selector {\n    color: hsl(0, 0%, 46%);\n}\n\n.styles-section .simple-selector.selector-matches, .styles-section.keyframe-key {\n    color: #222;\n}\n\n.styles-section .devtools-link {\n    user-select: none;\n}\n\n.styles-section .style-properties {\n    margin: 0;\n    padding: 2px 4px 0 0;\n    list-style: none;\n    clear: both;\n    display: flex;\n}\n\n.styles-section.matched-styles .style-properties {\n    padding-left: 0;\n}\n\n@keyframes styles-element-state-pane-slidein {\n    from {\n        margin-top: -60px;\n    }\n    to {\n        margin-top: 0px;\n    }\n}\n\n@keyframes styles-element-state-pane-slideout {\n    from {\n        margin-top: 0px;\n    }\n    to {\n        margin-top: -60px;\n    }\n}\n\n.styles-sidebar-toolbar-pane {\n    position: relative;\n    animation-duration: 0.1s;\n    animation-direction: normal;\n}\n\n.styles-sidebar-toolbar-pane-container {\n    position: relative;\n    overflow: hidden;\n    flex-shrink: 0;\n}\n\n.styles-selector {\n    cursor: text;\n}\n\n.styles-sidebar-pane-toolbar-container {\n    flex-shrink: 0;\n    overflow: hidden;\n    position: sticky;\n    top: 0;\n    background-color: var(--toolbar-bg-color);\n    z-index: 1;\n}\n\n.styles-sidebar-pane-toolbar {\n    border-bottom: 1px solid #eee;\n    flex-shrink: 0;\n}\n\n.styles-sidebar-pane-filter-box {\n    flex: auto;\n    display: flex;\n}\n\n.styles-sidebar-pane-filter-box > input {\n    outline: none !important;\n    border: none;\n    width: 100%;\n    background: white;\n    padding-left: 4px;\n    margin: 3px;\n}\n\n.styles-sidebar-pane-filter-box > input:hover {\n    box-shadow: var(--focus-ring-inactive-shadow);\n}\n\n.styles-sidebar-pane-filter-box > input:focus,\n.styles-sidebar-pane-filter-box > input:not(:placeholder-shown) {\n    box-shadow: var(--focus-ring-active-shadow);\n}\n\n.styles-sidebar-pane-filter-box > input::placeholder {\n    color: rgba(0, 0, 0, 0.54);\n}\n\n.styles-section.styles-panel-hovered:not(.read-only) span.simple-selector:hover,\n.styles-section.styles-panel-hovered:not(.read-only) .media-text :hover{\n    text-decoration: underline;\n    cursor: default;\n}\n\n.sidebar-separator {\n    background-color: var(--toolbar-bg-color);\n    padding: 0 5px;\n    border-bottom: 1px solid var(--divider-color);\n    color: hsla(0, 0%, 32%, 1);\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    line-height: 22px;\n}\n\n.sidebar-separator > span.monospace {\n    max-width: 90px;\n    display: inline-block;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    vertical-align: middle;\n    margin-left: 2px;\n}\n\n.sidebar-pane-section-toolbar {\n    position: absolute;\n    right: 0;\n    bottom: 0;\n    visibility: hidden;\n    background-color: rgba(255, 255, 255, 0.9);\n    z-index: 0;\n}\n\n.styles-section[data-keyboard-focus=\"true\"]:focus .sidebar-pane-section-toolbar {\n    background-color: hsla(214, 67%, 95%, 0.9);\n}\n\n.styles-pane:not(.is-editing-style) .styles-section.matched-styles:not(.read-only):hover .sidebar-pane-section-toolbar {\n    visibility: visible;\n}\n\n.styles-show-all {\n    margin-left: 16px;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    max-width: -webkit-fill-available;\n}\n\n@media (forced-colors: active) {\n    .styles-sidebar-pane-filter-box > input {\n        border: 1px solid ButtonText;\n        background: ButtonFace;\n    }\n    .styles-section[data-keyboard-focus=\"true\"]:focus,\n    .styles-section.read-only[data-keyboard-focus=\"true\"]:focus {\n        forced-color-adjust: none;\n        background-color: Highlight;\n    }\n    .styles-section[data-keyboard-focus=\"true\"]:focus *,\n    .styles-section.read-only[data-keyboard-focus=\"true\"]:focus *,\n    .styles-section[data-keyboard-focus=\"true\"]:focus .styles-section-subtitle .devtools-link {\n        color: HighlightText;\n        text-decoration-color: HighlightText;\n    }\n    .styles-section[data-keyboard-focus=\"true\"]:focus .sidebar-pane-section-toolbar {\n        background-color: ButtonFace;\n    }\n    .sidebar-pane-section-toolbar {\n        forced-color-adjust: none;\n        border-color: 1px solid ButtonText;\n        background-color: ButtonFace;\n    }\n    .styles-section .styles-section-subtitle .devtools-link {\n        color: LinkText;\n        text-decoration-color: LinkText;\n    }\n}\n\n/*# sourceURL=elements/stylesSidebarPane.css */";