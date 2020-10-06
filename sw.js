"use strict";

const version = 3,
	name = `devtools-v${version}`,
	timeout = 1800,
	urls = ["/RuntimeInstantiator.js","/devtools_app.js","/index.html","/inspector.html","/inspector.js","/loader.js","/manifest.appcache","/root.js","/shell.js","/Images/largeIcons.svg","/Images/lighthouse_logo.svg","/Images/mediumIcons.svg","/Images/navigationControls.png","/Images/navigationControls_2x.png","/Images/popoverArrows.png","/Images/radioDot.png","/Images/securityIcons.svg","/Images/smallIcons.svg","/Images/treeoutlineTriangles.svg","/bindings/bindings-legacy.js","/bindings/bindings.js","/browser_debugger/browser_debugger-legacy.js","/browser_debugger/browser_debugger.js","/browser_debugger/browser_debugger_module.js","/browser_sdk/browser_sdk-legacy.js","/browser_sdk/browser_sdk.js","/cm/cm.js","/cm/cm_module.js","/cm_web_modes/cm_web_modes.js","/color_picker/color_picker-legacy.js","/color_picker/color_picker.js","/color_picker/color_picker_module.js","/common/common-legacy.js","/common/common.js","/components/components-legacy.js","/components/components.js","/console/console-legacy.js","/console/console.js","/console/console_module.js","/console_counters/console_counters-legacy.js","/console_counters/console_counters.js","/cookie_table/cookie_table-legacy.js","/cookie_table/cookie_table.js","/cookie_table/cookie_table_module.js","/coverage/coverage-legacy.js","/coverage/coverage.js","/coverage/coverage_module.js","/data_grid/data_grid-legacy.js","/data_grid/data_grid.js","/data_grid/data_grid_module.js","/diff/diff-legacy.js","/diff/diff.js","/dom_extension/dom_extension.js","/elements/elements-legacy.js","/elements/elements.js","/elements/elements_module.js","/emulation/emulation-legacy.js","/emulation/emulation.js","/event_listeners/event_listeners-legacy.js","/event_listeners/event_listeners.js","/event_listeners/event_listeners_module.js","/extensions/extensions-legacy.js","/extensions/extensions.js","/formatter/formatter-legacy.js","/formatter/formatter.js","/har_importer/har_importer-legacy.js","/har_importer/har_importer.js","/heap_snapshot_model/heap_snapshot_model-legacy.js","/heap_snapshot_model/heap_snapshot_model.js","/help/help-legacy.js","/help/help.js","/help/help_module.js","/host/host-legacy.js","/host/host.js","/inline_editor/inline_editor-legacy.js","/inline_editor/inline_editor.js","/inline_editor/inline_editor_module.js","/inspector_main/inspector_main-legacy.js","/inspector_main/inspector_main.js","/layer_viewer/layer_viewer-legacy.js","/layer_viewer/layer_viewer.js","/layer_viewer/layer_viewer_module.js","/lighthouse/lighthouse-legacy.js","/lighthouse/lighthouse.js","/lighthouse/lighthouse_module.js","/main/main-legacy.js","/main/main.js","/mobile_throttling/mobile_throttling-legacy.js","/mobile_throttling/mobile_throttling.js","/network/network-legacy.js","/network/network.js","/network/network_module.js","/object_ui/object_ui-legacy.js","/object_ui/object_ui.js","/object_ui/object_ui_module.js","/perf_ui/perf_ui-legacy.js","/perf_ui/perf_ui.js","/perf_ui/perf_ui_module.js","/persistence/persistence-legacy.js","/persistence/persistence.js","/platform/platform.js","/profiler/profiler-legacy.js","/profiler/profiler.js","/profiler/profiler_module.js","/protocol_client/protocol_client-legacy.js","/protocol_client/protocol_client.js","/quick_open/quick_open-legacy.js","/quick_open/quick_open.js","/quick_open/quick_open_module.js","/resources/resources-legacy.js","/resources/resources.js","/resources/resources_module.js","/root/root-legacy.js","/root/root.js","/screencast/screencast-legacy.js","/screencast/screencast.js","/sdk/sdk-legacy.js","/sdk/sdk.js","/search/search-legacy.js","/search/search.js","/search/search_module.js","/security/security-legacy.js","/security/security.js","/security/security_module.js","/services/services-legacy.js","/services/services.js","/snippets/snippets-legacy.js","/snippets/snippets.js","/source_frame/source_frame-legacy.js","/source_frame/source_frame.js","/source_frame/source_frame_module.js","/sources/sources-legacy.js","/sources/sources.js","/sources/sources_module.js","/text_editor/text_editor-legacy.js","/text_editor/text_editor.js","/text_editor/text_editor_module.js","/text_utils/text_utils-legacy.js","/text_utils/text_utils.js","/timeline/timeline-legacy.js","/timeline/timeline.js","/timeline/timeline_module.js","/timeline_model/timeline_model-legacy.js","/timeline_model/timeline_model.js","/ui/ui-legacy.js","/ui/ui.js","/workspace/workspace-legacy.js","/workspace/workspace.js","/workspace_diff/workspace_diff-legacy.js","/workspace_diff/workspace_diff.js"],
	failover = "",
	reload = false,
	cacheable = arg => (arg.includes("no-store") || arg.includes("max-age=0")) === false;

async function error (cache) {
	let result;

	if (failover.length > 0) {
		result = await cache.match(failover);
	}

	return result !== void 0 ? result : Response.error();
}

function log (arg) {
	console.log(`[serviceWorker:${new Date().getTime()}] ${arg}`);
}

self.addEventListener("activate", ev => ev.waitUntil(caches.keys().then(args => {
	const invalid = args.filter(i => i !== name);
	let result;

	if (args.includes(name) === false) {
		caches.open(name).then(cache => {
			log("type=activate, cached=false, message=\"Caching core assets\"");

			return cache.addAll(urls);
		}).catch(err => log(`type=error, action=activate, message="${err.message}"`));
	} else {
		log("type=activate, cached=true, message=\"Reusing cached core assets\"");
	}

	if (invalid.length === 0) {
		log("type=delete, message=\"No stale caches\"");
		result = Promise.resolve();
	} else {
		log(`type=delete, message="Stale caches: ${invalid.toString()}"`);
		result = Promise.all(invalid.map(i => {
			log(`type=delete, message="Deleted stale cache ${i}"`);
			caches.delete(i);

			if (reload) {
				self.clients.claim();
				self.clients.matchAll().then(clients => clients.forEach(client => {
					log("type=reload, message=\"Loading new version of application\"");
					client.postMessage("reload");
				}));
			}
		}));
	}

	return result;
}).catch(() => void 0)));

self.addEventListener("install", ev => {
	self.skipWaiting();
	ev.waitUntil(() => log("type=install, message=\"New service worker installed\""));
});

self.addEventListener("fetch", ev => ev.respondWith(new Promise(async resolve => {
	const cache = await caches.open(name),
		method = ev.request.method;
	let result;

	if (method === "GET") {
		const cached = await cache.match(ev.request),
			now = new Date().getTime();

		if (cached !== void 0) {
			const url = new URL(cached.url),
				cdate = cached.headers.get("date"),
				then = (cdate !== null ? new Date(cdate) : new Date()).getTime() + Number((cached.headers.get("cache-control") || "").replace(/[^\d]/g, "") || timeout) * 1e3;

			if (urls.includes(url.pathname) || then > now) {
				result = cached.clone();
			}
		}

		if (result === void 0) {
			result = fetch(ev.request).then(res => {
				if ((res.type === "basic" || res.type === "cors") && res.status === 200 && cacheable(res.headers.get("cache-control") || "")) {
					cache.put(ev.request, res.clone());
				}

				return res;
			}).catch(() => error(cache));
		}
	} else {
		result = fetch(ev.request).then(res => {
			if ((res.type === "basic" || res.type === "cors") && res.status >= 200 && res.status < 400 && method !== "HEAD" && method !== "OPTIONS") {
				cache.delete(ev.request, {ignoreMethod: true});
			}

			return res;
		}).catch(() => error(cache));
	}

	resolve(result);
})));
