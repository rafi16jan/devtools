self.Runtime.cachedResources["inline_editor/bezierEditor.css"]="/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    width: 270px;\n    height: 350px;\n    user-select: none;\n    padding: 16px;\n    overflow: hidden;\n}\n\n.bezier-preset-selected > svg {\n    background-color: var(--selection-bg-color);\n}\n\n.bezier-preset {\n    width: 50px;\n    height: 50px;\n    padding: 5px;\n    margin: auto;\n    background-color: #f5f5f5;\n    border-radius: 3px;\n}\n\n.bezier-preset line.bezier-control-line {\n    stroke: #666;\n    stroke-width: 1;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preset circle.bezier-control-circle {\n    fill: #666;\n}\n\n.bezier-preset path.bezier-path {\n    stroke: black;\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preset-selected path.bezier-path, .bezier-preset-selected line.bezier-control-line {\n    stroke: white;\n}\n\n.bezier-preset-selected circle.bezier-control-circle {\n    fill: white;\n}\n\n.bezier-curve line.linear-line {\n    stroke: rgb(238, 238, 238);\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n}\n\n:host-context(.-theme-with-dark-background) .bezier-curve line.linear-line {\n    stroke: rgb(138, 138, 138);\n}\n\n.bezier-curve line.bezier-control-line {\n    stroke: #9C27B0;\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n    opacity: 0.6;\n}\n\n.bezier-curve circle.bezier-control-circle {\n    fill: #9C27B0;\n    cursor: pointer;\n}\n\n.bezier-curve path.bezier-path {\n    stroke: black;\n    stroke-width: 3;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preview-container {\n    position: relative;\n    background-color: white;\n    overflow: hidden;\n    border-radius: 20px;\n    width: 200%;\n    height: 20px;\n    z-index: 2;\n    flex-shrink: 0;\n    opacity: 0;\n}\n\n.bezier-preview-animation {\n    background-color: #9C27B0;\n    width: 20px;\n    height: 20px;\n    border-radius: 20px;\n    position: absolute;\n}\n\n.bezier-preview-onion {\n    margin-top: -20px;\n    position: relative;\n    z-index: 1;\n}\n\n.bezier-preview-onion > .bezier-preview-animation {\n    opacity: 0.1;\n}\n\nsvg.bezier-preset-modify {\n    background-color: #f5f5f5;\n    border-radius: 35px;\n    display: inline-block;\n    visibility: hidden;\n    transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);\n    cursor: pointer;\n    position: absolute;\n}\n\nsvg.bezier-preset-modify:hover, .bezier-preset:hover {\n    background-color: #999;\n}\n\n.bezier-preset-selected .bezier-preset:hover {\n    background-color: var(--selection-bg-color);\n}\n\n.bezier-preset-modify path {\n    stroke-width: 2;\n    stroke: black;\n    fill: none;\n}\n\n.bezier-preset-selected .bezier-preset-modify {\n    opacity: 1;\n}\n\n.bezier-preset-category {\n    width: 50px;\n    margin: 20px 0;\n    cursor: pointer;\n    transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n\nspan.bezier-display-value {\n    width: 100%;\n    user-select: text;\n    display: block;\n    text-align: center;\n    line-height: 20px;\n    height: 20px;\n    cursor: text;\n    white-space: nowrap !important;\n}\n\n.bezier-container {\n    display: flex;\n    margin-top: 38px;\n}\n\nsvg.bezier-curve {\n    margin-left: 32px;\n    margin-top: -8px;\n}\n\nsvg.bezier-preset-modify.bezier-preset-plus {\n    right: 0;\n}\n\n.bezier-header {\n    margin-top: 16px;\n}\n\nsvg.bezier-preset-modify:active {\n    transform: scale(1.1);\n    background-color: var(--selection-bg-color);\n}\n\n.bezier-preset-category:active {\n    transform: scale(1.05);\n}\n\n.bezier-header-active > svg.bezier-preset-modify {\n    visibility: visible;\n}\n\n.bezier-preset-modify:active path {\n    stroke: white;\n}\n\n/*# sourceURL=inline_editor/bezierEditor.css */";self.Runtime.cachedResources["inline_editor/colorSwatch.css"]="/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    white-space: nowrap;\n}\n\n.color-swatch {\n    position: relative;\n    margin-left: 1px;\n    margin-right: 2px;\n    width: 10px;\n    height: 10px;\n    top: 1px;\n    display: inline-block;\n    user-select: none;\n    background-image: url(Images/checker.png);\n    line-height: 10px;\n}\n\n.color-swatch-inner {\n    width: 100%;\n    height: 100%;\n    display: inline-block;\n    border: 1px solid rgba(128, 128, 128, 0.6);\n    cursor: default;\n}\n\n.color-swatch-inner:hover {\n    border: 1px solid rgba(64, 64, 64, 0.8);\n}\n\n@media (forced-colors: active) {\n    .color-swatch {\n        forced-color-adjust: none;\n    }\n}\n\n/*# sourceURL=inline_editor/colorSwatch.css */";self.Runtime.cachedResources["inline_editor/bezierSwatch.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    white-space: nowrap;\n}\n\n.bezier-swatch-icon {\n    position: relative;\n    margin-left: 1px;\n    margin-right: 2px;\n    top: 1px;\n    user-select: none;\n    line-height: 10px;\n    background-color: #9C27B0;\n    cursor: default;\n}\n\n.bezier-swatch-icon:hover {\n    background-color: #800080;\n}\n\n/*# sourceURL=inline_editor/bezierSwatch.css */";self.Runtime.cachedResources["inline_editor/cssShadowSwatch.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    white-space: nowrap;\n}\n\n.shadow-swatch-icon {\n    position: relative;\n    margin-left: 1px;\n    margin-right: 2px;\n    top: 1px;\n    user-select: none;\n    line-height: 10px;\n    background-color: #9C27B0;\n}\n\n.shadow-swatch-icon:hover {\n    background-color: #800080;\n}\n\n/*# sourceURL=inline_editor/cssShadowSwatch.css */";self.Runtime.cachedResources["inline_editor/cssShadowEditor.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    user-select: none;\n    padding: 4px 12px 12px 12px;\n    border: 1px solid transparent;\n}\n\n.shadow-editor-field:last-of-type {\n    margin-bottom: 8px;\n}\n\n.shadow-editor-field {\n    height: 24px;\n    margin-top: 8px;\n    font-size: 12px;\n    flex-shrink: 0;\n}\n\n.shadow-editor-flex-field {\n    display: flex;\n    align-items: center;\n    flex-direction: row;\n}\n\n.shadow-editor-field.shadow-editor-blur-field {\n    margin-top: 40px;\n}\n\n.shadow-editor-2D-slider {\n    position: absolute;\n    height: 88px;\n    width: 88px;\n    border: 1px solid rgba(0, 0, 0, 0.14);\n    border-radius: 2px;\n}\n\n.shadow-editor-label {\n    display: inline-block;\n    width: 52px;\n    height: 24px;\n    line-height: 24px;\n    margin-right: 8px;\n    text-align: right;\n}\n\n.shadow-editor-button-left, .shadow-editor-button-right {\n    width: 74px;\n    height: 24px;\n    padding: 3px 7px;\n    line-height: 16px;\n    border: 1px solid rgba(0, 0, 0, 0.14);\n    color: #333;\n    background-color: #ffffff;\n    text-align: center;\n    font-weight: 500;\n}\n\n.shadow-editor-button-left {\n    border-radius: 2px 0 0 2px;\n}\n\n.shadow-editor-button-right {\n    border-radius: 0 2px 2px 0;\n    border-left-width: 0;\n}\n\n.shadow-editor-button-left:hover, .shadow-editor-button-right:hover {\n    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);\n}\n\n.shadow-editor-button-left:focus, .shadow-editor-button-right:focus {\n    background-color: #eeeeee;\n}\n\n.shadow-editor-button-left.enabled, .shadow-editor-button-right.enabled, -theme-preserve {\n    background-color: #4285F4;\n    color: #ffffff;\n}\n\n.shadow-editor-button-left.enabled:focus, .shadow-editor-button-right.enabled:focus, -theme-preserve  {\n    background-color: #3B78E7;\n}\n\n.shadow-editor-text-input {\n    width: 52px;\n    margin-right: 8px;\n    text-align: right;\n    box-shadow: var(--focus-ring-inactive-shadow);\n}\n\n@media (forced-colors: active) {\n    .shadow-editor-button-left:hover,\n    .shadow-editor-button-right:hover\n    .shadow-editor-button-left.enabled,\n    .shadow-editor-button-right.enabled,\n    .shadow-editor-button-left.enabled:focus,\n    .shadow-editor-button-right.enabled:focus {\n        forced-color-adjust: none;\n        background-color: Highlight;\n        color: HighlightText;\n    }\n}\n\n/*# sourceURL=inline_editor/cssShadowEditor.css */";self.Runtime.cachedResources["inline_editor/swatchPopover.css"]="/*\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.widget {\n    display: flex;\n    background: white;\n    box-shadow: var(--drop-shadow);\n    border-radius: 2px;\n    overflow: auto;\n    user-select: text;\n    line-height: 11px;\n}\n\n/*# sourceURL=inline_editor/swatchPopover.css */";