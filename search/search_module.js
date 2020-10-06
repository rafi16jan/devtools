self.Runtime.cachedResources["search/searchResultsPane.css"]="/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    padding: 0;\n    margin: 0;\n    overflow-y: auto;\n}\n\n.tree-outline {\n    padding: 0;\n}\n\n.tree-outline ol {\n    padding: 0;\n}\n\n.tree-outline li {\n    height: 16px;\n}\n\nli.search-result {\n    cursor: pointer;\n    font-size: 12px;\n    margin-top: 8px;\n    padding: 2px 0 2px 4px;\n    word-wrap: normal;\n    white-space: pre;\n}\n\nli.search-result:hover {\n    background-color: rgba(121, 121, 121, 0.1);\n}\n\nli.search-result .search-result-file-name {\n    color: #222;\n    flex: 1 1;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\nli.search-result .search-result-matches-count {\n    color: #888;\n    margin: 0 8px;\n}\n\nli.search-result.expanded .search-result-matches-count {\n    display: none;\n}\n\nli.show-more-matches {\n    color: #222;\n    cursor: pointer;\n    margin: 8px 0 0 -4px;\n}\n\nli.show-more-matches:hover {\n    text-decoration: underline;\n}\n\nli.search-match {\n    margin: 2px 0;\n    word-wrap: normal;\n    white-space: pre;\n}\n\nli.search-match::before {\n    display: none;\n}\n\nli.search-match .search-match-line-number {\n    color: rgb(128, 128, 128);\n    text-align: right;\n    vertical-align: top;\n    word-break: normal;\n    padding: 2px 4px 2px 6px;\n    margin-right: 5px;\n}\n\nli.search-match:hover {\n    background-color: var(--item-hover-color);\n}\n\nli.search-match .highlighted-match {\n    background-color: #F1EA00;\n}\n\n:host-context(.-theme-with-dark-background) li.search-match .highlighted-match {\n    background-color: hsl(133, 100%, 30%) !important;\n}\n\n.tree-outline .devtools-link {\n    text-decoration: none;\n    display: block;\n    flex: auto;\n}\n\nli.search-match .search-match-content {\n    color: #000;\n}\n\nol.children.expanded {\n    padding-bottom: 4px;\n}\n\n.search-match-link {\n    overflow: hidden;\n    text-overflow: ellipsis;\n    margin-left: 9px;\n}\n\n.search-result-qualifier {\n    color: #AAA;\n}\n\n.search-result-dash {\n    color: #AAA;\n    margin: 0 4px;\n}\n\n/*# sourceURL=search/searchResultsPane.css */";self.Runtime.cachedResources["search/searchView.css"]="/*\n * Copyright 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.search-drawer-header {\n    align-items: center;\n    flex-shrink: 0;\n    overflow: hidden;\n}\n\n.search-toolbar {\n    background-color: var(--toolbar-bg-color);\n    border-bottom: var(--divider-border);\n}\n\n.search-toolbar-summary {\n    background-color: #eee;\n    border-top: 1px solid #ccc;\n    padding-left: 5px;\n    flex: 0 0 19px;\n    display: flex;\n    padding-right: 5px;\n}\n\n.search-toolbar-summary .search-message {\n    padding-top: 2px;\n    padding-left: 1ex;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    overflow: hidden;\n}\n\n.search-view .search-results {\n    overflow-y: auto;\n    display: flex;\n    flex: auto;\n}\n\n.search-view .search-results > div {\n    flex: auto;\n}\n\n/*# sourceURL=search/searchView.css */";