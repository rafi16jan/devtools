import*as HostModule from'./host.js';self.Host=self.Host||{};Host=Host||{};Host.InspectorFrontendHost=HostModule.InspectorFrontendHost.InspectorFrontendHostInstance;Host.isUnderTest=HostModule.InspectorFrontendHost.isUnderTest;Host.InspectorFrontendHostAPI={};Host.InspectorFrontendHostAPI.Events=HostModule.InspectorFrontendHostAPI.Events;Host.platform=HostModule.Platform.platform;Host.isWin=HostModule.Platform.isWin;Host.isMac=HostModule.Platform.isMac;Host.isCustomDevtoolsFrontend=HostModule.Platform.isCustomDevtoolsFrontend;Host.fontFamily=HostModule.Platform.fontFamily;Host.ResourceLoader=HostModule.ResourceLoader.ResourceLoader;Host.ResourceLoader.load=HostModule.ResourceLoader.load;Host.ResourceLoader.loadAsStream=HostModule.ResourceLoader.loadAsStream;Host.UserMetrics=HostModule.UserMetrics.UserMetrics;Host.UserMetrics._PanelCodes=HostModule.UserMetrics.PanelCodes;Host.UserMetrics.Action=HostModule.UserMetrics.Action;Host.userMetrics=HostModule.userMetrics;