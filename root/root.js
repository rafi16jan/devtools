const REMOTE_MODULE_FALLBACK_REVISION='@010ddcfda246975d194964ccf20038ebbdec6084';const instanceSymbol=Symbol('instance');const originalConsole=console;const originalAssert=console.assert;const queryParamsObject=new URLSearchParams(location.search);let remoteBase;let importScriptPathPrefix;let runtimePlatform='';let l10nCallback;let runtimeInstance;class Runtime{constructor(descriptors){this._modules=[];this._modulesMap={};this._extensions=[];this._cachedTypeClasses={};this._descriptorsMap={};for(let i=0;i<descriptors.length;++i){this._registerModule(descriptors[i]);}}
static instance(opts={forceNew:null,moduleDescriptors:null}){const{forceNew,moduleDescriptors}=opts;if(!moduleDescriptors||forceNew){if(!moduleDescriptors){throw new Error(`Unable to create settings: targetManager and workspace must be provided: ${new Error().stack}`);}
runtimeInstance=new Runtime(moduleDescriptors);}
return runtimeInstance;}
loadBinaryResourcePromise(url){return internalLoadResourcePromise(url,true);}
static normalizePath(path){if(path.indexOf('..')===-1&&path.indexOf('.')===-1){return path;}
const normalizedSegments=[];const segments=path.split('/');for(let i=0;i<segments.length;i++){const segment=segments[i];if(segment==='.'){continue;}else if(segment==='..'){normalizedSegments.pop();}else if(segment){normalizedSegments.push(segment);}}
let normalizedPath=normalizedSegments.join('/');if(normalizedPath[normalizedPath.length-1]==='/'){return normalizedPath;}
if(path[0]==='/'&&normalizedPath){normalizedPath='/'+normalizedPath;}
if((path[path.length-1]==='/')||(segments[segments.length-1]==='.')||(segments[segments.length-1]==='..')){normalizedPath=normalizedPath+'/';}
return normalizedPath;}
static queryParam(name){return queryParamsObject.get(name);}
static _experimentsSetting(){try{return(JSON.parse(self.localStorage&&self.localStorage['experiments']?self.localStorage['experiments']:'{}'));}catch(e){console.error('Failed to parse localStorage[\'experiments\']');return{};}}
static _assert(value,message){if(value){return;}
originalAssert.call(originalConsole,value,message+' '+new Error().stack);}
static setPlatform(platform){runtimePlatform=platform;}
static _isDescriptorEnabled(descriptor){const activatorExperiment=descriptor['experiment'];if(activatorExperiment==='*'){return true;}
if(activatorExperiment&&activatorExperiment.startsWith('!')&&experiments.isEnabled(activatorExperiment.substring(1))){return false;}
if(activatorExperiment&&!activatorExperiment.startsWith('!')&&!experiments.isEnabled(activatorExperiment)){return false;}
const condition=descriptor['condition'];if(condition&&!condition.startsWith('!')&&!Runtime.queryParam(condition)){return false;}
if(condition&&condition.startsWith('!')&&Runtime.queryParam(condition.substring(1))){return false;}
return true;}
static resolveSourceURL(path){let sourceURL=self.location.href;if(self.location.search){sourceURL=sourceURL.replace(self.location.search,'');}
sourceURL=sourceURL.substring(0,sourceURL.lastIndexOf('/')+1)+path;return'\n/*# sourceURL='+sourceURL+' */';}
static setL10nCallback(localizationFunction){l10nCallback=localizationFunction;}
useTestBase(){remoteBase='http://localhost:8000/inspector-sources/';if(Runtime.queryParam('debugFrontend')){remoteBase+='debug/';}}
module(moduleName){return this._modulesMap[moduleName];}
_registerModule(descriptor){const module=new Module(this,descriptor);this._modules.push(module);this._modulesMap[descriptor['name']]=module;}
loadModulePromise(moduleName){return this._modulesMap[moduleName]._loadPromise();}
loadAutoStartModules(moduleNames){const promises=[];for(let i=0;i<moduleNames.length;++i){promises.push(this.loadModulePromise(moduleNames[i]));}
return Promise.all(promises);}
_checkExtensionApplicability(extension,predicate){if(!predicate){return false;}
const contextTypes=extension.descriptor().contextTypes;if(!contextTypes){return true;}
for(let i=0;i<contextTypes.length;++i){const contextType=this._resolve(contextTypes[i]);const isMatching=!!contextType&&predicate(contextType);if(isMatching){return true;}}
return false;}
isExtensionApplicableToContext(extension,context){if(!context){return true;}
return this._checkExtensionApplicability(extension,isInstanceOf);function isInstanceOf(targetType){return context instanceof targetType;}}
isExtensionApplicableToContextTypes(extension,currentContextTypes){if(!extension.descriptor().contextTypes){return true;}
let callback=null;if(currentContextTypes){callback=targetType=>{return currentContextTypes.has(targetType);};}
return this._checkExtensionApplicability(extension,callback);}
extensions(type,context,sortByTitle){return this._extensions.filter(filter).sort(sortByTitle?titleComparator:orderComparator);function filter(extension){if(extension._type!==type&&extension._typeClass()!==type){return false;}
if(!extension.enabled()){return false;}
return!context||extension.isApplicable(context);}
function orderComparator(extension1,extension2){const order1=extension1.descriptor()['order']||0;const order2=extension2.descriptor()['order']||0;return order1-order2;}
function titleComparator(extension1,extension2){const title1=extension1.title()||'';const title2=extension2.title()||'';return title1.localeCompare(title2);}}
extension(type,context){return this.extensions(type,context)[0]||null;}
allInstances(type,context){return Promise.all(this.extensions(type,context).map(extension=>extension.instance()));}
_resolve(typeName){if(!this._cachedTypeClasses[typeName]){const path=typeName.split('.');let object=self;for(let i=0;object&&(i<path.length);++i){object=object[path[i]];}
if(object){this._cachedTypeClasses[typeName]=(object);}}
return this._cachedTypeClasses[typeName]||null;}
sharedInstance(constructorFunction){if(instanceSymbol in constructorFunction&&Object.getOwnPropertySymbols(constructorFunction).includes(instanceSymbol)){return constructorFunction[instanceSymbol];}
const instance=new constructorFunction();constructorFunction[instanceSymbol]=instance;return instance;}}
class ModuleDescriptor{constructor(){this.name;this.extensions;this.dependencies;this.scripts;this.modules;this.resources;this.condition;this.remote;this.experiment;}}
class RuntimeExtensionDescriptor{constructor(){this.type;this.className;this.factoryName;this.contextTypes;this.bindings;this.order;this.extension;this.actionId;this.experiment;this.condition;this.settingName;this.settingType;this.defaultValue;this.storageType;this.userActionCondition;this.startPage;this.name;}}
const specialCases={'sdk':'SDK','js_sdk':'JSSDK','browser_sdk':'BrowserSDK','ui':'UI','object_ui':'ObjectUI','javascript_metadata':'JavaScriptMetadata','perf_ui':'PerfUI','har_importer':'HARImporter','sdk_test_runner':'SDKTestRunner','cpu_profiler_test_runner':'CPUProfilerTestRunner'};class Module{constructor(manager,descriptor){this._manager=manager;this._descriptor=descriptor;this._name=descriptor.name;this._extensions=[];this._extensionsByClassName=new Map();const extensions=(descriptor.extensions);for(let i=0;extensions&&i<extensions.length;++i){const extension=new Extension(this,extensions[i]);this._manager._extensions.push(extension);this._extensions.push(extension);}
this._loadedForTest=false;}
name(){return this._name;}
enabled(){return Runtime._isDescriptorEnabled(this._descriptor);}
resource(name){const fullName=this._name+'/'+name;const content=self.Runtime.cachedResources[fullName];if(!content){throw new Error(fullName+' not preloaded. Check module.json');}
return content;}
_loadPromise(){if(!this.enabled()){return Promise.reject(new Error('Module '+this._name+' is not enabled'));}
if(this._pendingLoadPromise){return this._pendingLoadPromise;}
const dependencies=this._descriptor.dependencies;const dependencyPromises=[];for(let i=0;dependencies&&i<dependencies.length;++i){dependencyPromises.push(this._manager._modulesMap[dependencies[i]]._loadPromise());}
this._pendingLoadPromise=Promise.all(dependencyPromises).then(this._loadResources.bind(this)).then(this._loadModules.bind(this)).then(this._loadScripts.bind(this)).then(()=>this._loadedForTest=true);return this._pendingLoadPromise;}
_loadResources(){const resources=this._descriptor['resources'];if(!resources||!resources.length){return Promise.resolve();}
const promises=[];for(let i=0;i<resources.length;++i){const url=this._modularizeURL(resources[i]);const isHtml=url.endsWith('.html');promises.push(loadResourceIntoCache(url,!isHtml));}
return Promise.all(promises).then(undefined);}
_loadModules(){if(!this._descriptor.modules||!this._descriptor.modules.length){return Promise.resolve();}
const namespace=this._computeNamespace();self[namespace]=self[namespace]||{};const legacyFileName=`${this._name}-legacy.js`;const fileName=this._descriptor.modules.includes(legacyFileName)?legacyFileName:`${this._name}.js`;return eval(`import('../${this._name}/${fileName}')`);}
_loadScripts(){if(!this._descriptor.scripts||!this._descriptor.scripts.length){return Promise.resolve();}
const namespace=this._computeNamespace();self[namespace]=self[namespace]||{};return loadScriptsPromise(this._descriptor.scripts.map(this._modularizeURL,this),this._remoteBase());}
_computeNamespace(){return specialCases[this._name]||this._name.split('_').map(a=>a.substring(0,1).toUpperCase()+a.substring(1)).join('');}
_modularizeURL(resourceName){return Runtime.normalizePath(this._name+'/'+resourceName);}
_remoteBase(){return!Runtime.queryParam('debugFrontend')&&this._descriptor.remote&&remoteBase||undefined;}
fetchResource(resourceName){const base=this._remoteBase();const sourceURL=getResourceURL(this._modularizeURL(resourceName),base);return base?loadResourcePromiseWithFallback(sourceURL):loadResourcePromise(sourceURL);}
substituteURL(value){const base=this._remoteBase()||'';return value.replace(/@url\(([^\)]*?)\)/g,convertURL.bind(this));function convertURL(match,url){return base+this._modularizeURL(url);}}}
class Extension{constructor(moduleParam,descriptor){this._module=moduleParam;this._descriptor=descriptor;this._type=descriptor.type;this._hasTypeClass=this._type.charAt(0)==='@';this._className=descriptor.className||null;this._factoryName=descriptor.factoryName||null;}
descriptor(){return this._descriptor;}
module(){return this._module;}
enabled(){return this._module.enabled()&&Runtime._isDescriptorEnabled(this.descriptor());}
_typeClass(){if(!this._hasTypeClass){return null;}
return this._module._manager._resolve(this._type.substring(1));}
isApplicable(context){return this._module._manager.isExtensionApplicableToContext(this,context);}
instance(){return this._module._loadPromise().then(this._createInstance.bind(this));}
canInstantiate(){return!!(this._className||this._factoryName);}
_createInstance(){const className=this._className||this._factoryName;if(!className){throw new Error('Could not instantiate extension with no class');}
const constructorFunction=self.eval((className));if(!(constructorFunction instanceof Function)){throw new Error('Could not instantiate: '+className);}
if(this._className){return this._module._manager.sharedInstance(constructorFunction);}
return new constructorFunction(this);}
title(){const title=this._descriptor['title-'+runtimePlatform]||this._descriptor['title'];if(title&&l10nCallback){return l10nCallback(title);}
return title;}
hasContextType(contextType){const contextTypes=this.descriptor().contextTypes;if(!contextTypes){return false;}
for(let i=0;i<contextTypes.length;++i){if(contextType===this._module._manager._resolve(contextTypes[i])){return true;}}
return false;}}
class ExperimentsSupport{constructor(){this._experiments=[];this._experimentNames={};this._enabledTransiently={};this._serverEnabled=new Set();}
allConfigurableExperiments(){const result=[];for(let i=0;i<this._experiments.length;i++){const experiment=this._experiments[i];if(!this._enabledTransiently[experiment.name]){result.push(experiment);}}
return result;}
_setExperimentsSetting(value){if(!self.localStorage){return;}
self.localStorage['experiments']=JSON.stringify(value);}
register(experimentName,experimentTitle,unstable){Runtime._assert(!this._experimentNames[experimentName],'Duplicate registration of experiment '+experimentName);this._experimentNames[experimentName]=true;this._experiments.push(new Experiment(this,experimentName,experimentTitle,!!unstable));}
isEnabled(experimentName){this._checkExperiment(experimentName);if(Runtime._experimentsSetting()[experimentName]===false){return false;}
if(this._enabledTransiently[experimentName]){return true;}
if(this._serverEnabled.has(experimentName)){return true;}
return!!Runtime._experimentsSetting()[experimentName];}
setEnabled(experimentName,enabled){this._checkExperiment(experimentName);const experimentsSetting=Runtime._experimentsSetting();experimentsSetting[experimentName]=enabled;this._setExperimentsSetting(experimentsSetting);}
setDefaultExperiments(experimentNames){for(let i=0;i<experimentNames.length;++i){this._checkExperiment(experimentNames[i]);this._enabledTransiently[experimentNames[i]]=true;}}
setServerEnabledExperiments(experimentNames){for(const experiment of experimentNames){this._checkExperiment(experiment);this._serverEnabled.add(experiment);}}
enableForTest(experimentName){this._checkExperiment(experimentName);this._enabledTransiently[experimentName]=true;}
clearForTest(){this._experiments=[];this._experimentNames={};this._enabledTransiently={};this._serverEnabled.clear();}
cleanUpStaleExperiments(){const experimentsSetting=Runtime._experimentsSetting();const cleanedUpExperimentSetting={};for(let i=0;i<this._experiments.length;++i){const experimentName=this._experiments[i].name;if(experimentsSetting[experimentName]){cleanedUpExperimentSetting[experimentName]=true;}}
this._setExperimentsSetting(cleanedUpExperimentSetting);}
_checkExperiment(experimentName){Runtime._assert(this._experimentNames[experimentName],'Unknown experiment '+experimentName);}}
class Experiment{constructor(experiments,name,title,unstable){this.name=name;this.title=title;this.unstable=unstable;this._experiments=experiments;}
isEnabled(){return this._experiments.isEnabled(this.name);}
setEnabled(enabled){this._experiments.setEnabled(this.name,enabled);}}
function internalLoadResourcePromise(url,asBinary){return new Promise(load);function load(fulfill,reject){const xhr=new XMLHttpRequest();xhr.open('GET',url,true);if(asBinary){xhr.responseType='arraybuffer';}
xhr.onreadystatechange=onreadystatechange;function onreadystatechange(e){if(xhr.readyState!==XMLHttpRequest.DONE){return;}
const{response}=(e.target);const text=asBinary?new TextDecoder().decode(response):response;const status=/^HTTP\/1.1 404/.test(text)?404:xhr.status;if([0,200,304].indexOf(status)===-1)
{reject(new Error('While loading from url '+url+' server responded with a status of '+status));}else{fulfill(response);}}
xhr.send(null);}}
const loadedScripts={};function loadScriptsPromise(scriptNames,base){const promises=[];const urls=[];const sources=new Array(scriptNames.length);let scriptToEval=0;for(let i=0;i<scriptNames.length;++i){const scriptName=scriptNames[i];const sourceURL=getResourceURL(scriptName,base);if(loadedScripts[sourceURL]){continue;}
urls.push(sourceURL);const promise=base?loadResourcePromiseWithFallback(sourceURL):loadResourcePromise(sourceURL);promises.push(promise.then(scriptSourceLoaded.bind(null,i),scriptSourceLoaded.bind(null,i,undefined)));}
return Promise.all(promises).then(undefined);function scriptSourceLoaded(scriptNumber,scriptSource){sources[scriptNumber]=scriptSource||'';while(typeof sources[scriptToEval]!=='undefined'){evaluateScript(urls[scriptToEval],sources[scriptToEval]);++scriptToEval;}}
function evaluateScript(sourceURL,scriptSource){loadedScripts[sourceURL]=true;if(!scriptSource){console.error('Empty response arrived for script \''+sourceURL+'\'');return;}
self.eval(scriptSource+'\n//# sourceURL='+sourceURL);}}
function loadResourcePromiseWithFallback(url){return loadResourcePromise(url).catch(err=>{const urlWithFallbackVersion=url.replace(/@[0-9a-f]{40}/,REMOTE_MODULE_FALLBACK_REVISION);if(urlWithFallbackVersion===url||!url.includes('lighthouse_worker_module')){throw err;}
return loadResourcePromise(urlWithFallbackVersion);});}
function loadResourceIntoCache(url,appendSourceURL){return loadResourcePromise(url).then(cacheResource.bind(null,url),cacheResource.bind(null,url,undefined));function cacheResource(path,content){if(!content){console.error('Failed to load resource: '+path);return;}
const sourceURL=appendSourceURL?Runtime.resolveSourceURL(path):'';self.Runtime.cachedResources[path]=content+sourceURL;}}
function loadResourcePromise(url){return internalLoadResourcePromise(url,false);}
function getResourceURL(scriptName,base){const sourceURL=(base||importScriptPathPrefix)+scriptName;const schemaIndex=sourceURL.indexOf('://')+3;let pathIndex=sourceURL.indexOf('/',schemaIndex);if(pathIndex===-1){pathIndex=sourceURL.length;}
return sourceURL.substring(0,pathIndex)+Runtime.normalizePath(sourceURL.substring(pathIndex));}
(function validateRemoteBase(){if(location.href.startsWith('devtools://devtools/bundled/')){const queryParam=Runtime.queryParam('remoteBase');if(queryParam){const versionMatch=/\/serve_file\/(@[0-9a-zA-Z]+)\/?$/.exec(queryParam);if(versionMatch){remoteBase=`${location.origin}/remote/serve_file/${versionMatch[1]}/`;}}}})();(function(){const baseUrl=self.location?self.location.origin+self.location.pathname:'';importScriptPathPrefix=baseUrl.substring(0,baseUrl.lastIndexOf('/')+1);})();const experiments=new ExperimentsSupport();var Runtime$1=Object.freeze({__proto__:null,Runtime:Runtime,ModuleDescriptor:ModuleDescriptor,RuntimeExtensionDescriptor:RuntimeExtensionDescriptor,Module:Module,Extension:Extension,ExperimentsSupport:ExperimentsSupport,loadResourcePromise:loadResourcePromise,experiments:experiments});export{Runtime$1 as Runtime};