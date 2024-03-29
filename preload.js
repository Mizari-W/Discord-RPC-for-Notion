"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../helpers/setEnvironment");
const process_1 = __importDefault(require("process"));
const electron_1 = __importDefault(require("electron"));
const rendererIpc = __importStar(require("./rendererIpc"));
const contextMenuWrapperFunctions = new Map();
const newWindowWrapperFunctions = new Map();
const electronApi = {
    openInNewWindow(urlPath) {
        rendererIpc.sendToMain("notion:create-window", urlPath);
    },
    openInNewTab(urlPath, makeTabActive, position) {
        rendererIpc.sendToMain("notion:new-tab-from-notion", urlPath, Boolean(makeTabActive), position || "after-children");
    },
    openExternalUrl(url) {
        rendererIpc.sendToMain("notion:open-external-url", { url });
    },
    clearBrowserHistory() {
        rendererIpc.sendToMain("notion:clear-browser-history");
    },
    async getAppVersion() {
        const invokeResult = await rendererIpc.invokeInMainAndReturnResult("notion:get-app-version");
        if (invokeResult.error) {
            return "0.0.0";
        }
        else {
            return invokeResult.value;
        }
    },
    setBadge(str) {
        if (str === "") {
            rendererIpc.sendToMain("notion:set-badge", {
                badgeString: "",
                badgeImageDataUrl: null,
                devicePixelRatio: window.devicePixelRatio,
            });
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 16 * window.devicePixelRatio;
        canvas.height = 16 * window.devicePixelRatio;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            rendererIpc.sendToMain("notion:set-badge", {
                badgeString: "",
                badgeImageDataUrl: null,
                devicePixelRatio: window.devicePixelRatio,
            });
            return;
        }
        const scale = 18 / 20;
        const centerX = canvas.width / 2 / scale;
        const centerY = canvas.height / 2 / scale;
        const radius = (canvas.width / 2) * scale * scale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(247,94,79,0.95)";
        ctx.fill();
        ctx.font = `${9 * scale * window.devicePixelRatio}px sans-serif`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(str, centerX, centerY + 3.5 * scale * window.devicePixelRatio);
        const badgeImageDataUrl = canvas.toDataURL("image/png");
        rendererIpc.sendToMain("notion:set-badge", {
            badgeString: str,
            badgeImageDataUrl: badgeImageDataUrl,
            devicePixelRatio: window.devicePixelRatio,
        });
    },
    fullscreen: {
        get() {
            const result = rendererIpc.DEPRECATED_sendSyncToMainAndReturnResult("notion:get-fullscreen");
            if (result.error) {
                return false;
            }
            return result.value;
        },
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:full-screen-changed", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:full-screen-changed", fn);
        },
    },
    inPageSearch: {
        start(isCenterPeekOpen) {
            rendererIpc.sendToMain("notion:search-start", isCenterPeekOpen);
        },
        stop() {
            rendererIpc.sendToMain("notion:search-stop-from-notion");
        },
        started: {
            addListener(fn) {
                rendererIpc.handleMainToNotionEvent.addListener("notion:search-started", fn);
            },
            removeListener(fn) {
                rendererIpc.handleMainToNotionEvent.removeListener("notion:search-started", fn);
            },
        },
        stopped: {
            addListener(fn) {
                rendererIpc.handleMainToNotionEvent.addListener("notion:search-stopped", fn);
            },
            removeListener(fn) {
                rendererIpc.handleMainToNotionEvent.removeListener("notion:search-stopped", fn);
            },
        },
    },
    zoom: {
        set(scale) {
            rendererIpc.sendToMain("notion:zoom", scale);
        },
        get() {
            return electron_1.default.webFrame.getZoomFactor();
        },
    },
    loadSpellcheck: () => {
    },
    getSpellCheckerLanguages() {
        return rendererIpc.invokeInMainAndReturnResult("notion:get-spellchecker-languages");
    },
    getAvailableSpellCheckerLanguages() {
        return rendererIpc.invokeInMainAndReturnResult("notion:get-available-spellchecker-languages");
    },
    setSpellCheckerLanguages: languages => {
        rendererIpc.sendToMain("notion:set-spellchecker-languages", languages);
    },
    setSpellCheckerEnabled: enabled => {
        rendererIpc.sendToMain("notion:set-spellchecker-enabled", enabled);
    },
    addToDictionary: word => {
        rendererIpc.sendToMain("notion:add-to-dictionary", word);
    },
    contextMenu: {
        addListener: fn => {
            const dummyEvent = {
                preventDefault: () => { },
            };
            const wrapperFn = (sender, params) => {
                fn(dummyEvent, params);
            };
            contextMenuWrapperFunctions.set(fn, wrapperFn);
            rendererIpc.handleMainToNotionEvent.addListener("notion:context-menu", wrapperFn);
        },
        removeListener: fn => {
            const wrapperFn = contextMenuWrapperFunctions.get(fn);
            if (!wrapperFn) {
                return;
            }
            rendererIpc.handleMainToNotionEvent.removeListener("notion:context-menu", wrapperFn);
        },
    },
    replaceMisspelling: (word) => {
        rendererIpc.sendToMain("notion:replace-misspelling", word);
    },
    cut: () => {
        rendererIpc.sendToMain("notion:cut");
    },
    copy: () => {
        rendererIpc.sendToMain("notion:copy");
    },
    paste: () => {
        rendererIpc.sendToMain("notion:paste");
    },
    copyText: (text) => {
        electron_1.default.clipboard.writeText(text);
    },
    copyImage: (src) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            canvas.height = img.height;
            canvas.width = img.width;
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL("image/png");
                electron_1.default.clipboard.writeImage(electron_1.default.nativeImage.createFromDataURL(dataURL));
            }
        };
        img.src = src;
    },
    openDevTools: () => {
        rendererIpc.sendToMain("notion:open-dev-tools");
    },
    setWindowTitle: title => {
        rendererIpc.sendToMain("notion:set-window-title", { title });
    },
    toggleMaximized: () => {
        rendererIpc.sendToMain("notion:toggle-maximized");
    },
    checkForUpdates() {
        rendererIpc.sendToMain("notion:check-for-updates");
    },
    updateReady: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:update-ready", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:update-ready", fn);
        },
    },
    installUpdate() {
        rendererIpc.sendToMain("notion:install-update");
    },
    installAppJsUpdate(url) {
        rendererIpc.sendToMain("notion:install-appjs-update", url);
    },
    updateError: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:update-error", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:update-error", fn);
        },
    },
    updateChecking: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:checking-for-update", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:checking-for-update", fn);
        },
    },
    updateAvailable: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:update-available", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:update-available", fn);
        },
    },
    updateProgress: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:update-progress", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:update-progress", fn);
        },
    },
    updateNotAvailable: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:update-not-available", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:update-not-available", fn);
        },
    },
    checkForAppUpdates() {
        rendererIpc.sendToMain("notion:check-for-app-updates");
    },
    appUpdateReady: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-ready", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-ready", fn);
        },
    },
    appUpdateError: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-error", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-error", fn);
        },
    },
    appUpdateChecking: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:checking-for-app-update", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:checking-for-app-update", fn);
        },
    },
    appUpdateAvailable: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-available", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-available", fn);
        },
    },
    appUpdateProgress: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-progress", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-progress", fn);
        },
    },
    appUpdateNotAvailable: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-not-available", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-not-available", fn);
        },
    },
    appUpdateFinished: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-finished", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-finished", fn);
        },
    },
    appUpdateInstall: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:app-update-install", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:app-update-install", fn);
        },
    },
    async getSubstitutions() {
        const invokeResult = await rendererIpc.invokeInMainAndReturnResult("notion:get-substitutions");
        if (invokeResult.error) {
            return [];
        }
        return invokeResult.value;
    },
    async isRunningUnderArm64Translation() {
        var _a;
        return (_a = electronApi.isRunningUnderArm64Translation) === null || _a === void 0 ? void 0 : _a.call(electronApi);
    },
    async isMainWindow() {
        if (electronApi.isMainTab) {
            return electronApi.isMainTab();
        }
        throw new Error("electronApi.isMainTab should not be undefined since it was added in the same commit");
    },
    async isMainTab() {
        const invokeResult = await rendererIpc.invokeInMainAndReturnResult("notion:is-main-tab");
        if (invokeResult.error) {
            return false;
        }
        return invokeResult.value;
    },
    isActiveTab: {
        get() {
            return rendererIpc.invokeInMainAndReturnResult("notion:is-active-tab");
        },
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:set-is-active-tab", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:set-is-active-tab", fn);
        },
    },
    async windowIsVisible() {
        const invokeResult = await rendererIpc.invokeInMainAndReturnResult("notion:is-window-visible");
        if (invokeResult.error) {
            return false;
        }
        return invokeResult.value;
    },
    setTheme(theme) {
        rendererIpc.sendToMain("notion:set-theme", theme);
    },
    newWindow: {
        addListener: fn => {
            const dummyEvent = {
                preventDefault: () => { },
            };
            const wrapperFn = (sender, url) => {
                fn(dummyEvent, url);
            };
            newWindowWrapperFunctions.set(fn, wrapperFn);
            rendererIpc.handleMainToNotionEvent.addListener("notion:new-window", wrapperFn);
        },
        removeListener: fn => {
            const wrapperFn = newWindowWrapperFunctions.get(fn);
            if (!wrapperFn) {
                return;
            }
            rendererIpc.handleMainToNotionEvent.removeListener("notion:new-window", wrapperFn);
        },
    },
    openOauthPopup: async (args) => {
        rendererIpc.sendToMain("notion:create-popup", args);
        return new Promise(resolve => {
            const handlePopupCallback = (sender, url) => {
                rendererIpc.handleMainToNotionEvent.removeListener("notion:popup-callback", handlePopupCallback);
                resolve(url);
            };
            rendererIpc.handleMainToNotionEvent.addListener("notion:popup-callback", handlePopupCallback);
        });
    },
    openGoogleDrivePickerPopup: async (args) => {
        rendererIpc.sendToMain("notion:create-google-drive-picker", args);
        return new Promise(resolve => {
            const handlePopupCallback = (sender, file) => {
                rendererIpc.handleMainToNotionEvent.removeListener("notion:google-drive-picker-callback", handlePopupCallback);
                resolve(file);
            };
            rendererIpc.handleMainToNotionEvent.addListener("notion:google-drive-picker-callback", handlePopupCallback);
        });
    },
    getCookie: (cookieName) => {
        return rendererIpc.invokeInMainAndReturnResult("notion:get-cookie", cookieName);
    },
    setCookie: (args) => {
        rendererIpc.sendToMain("notion:set-cookie", args);
    },
    setLoggerData: data => {
        rendererIpc.sendToMain("notion:set-logger-data", data);
    },
    clearCookies: () => {
        rendererIpc.sendToMain("notion:clear-cookies");
    },
    appUpdateReload: {
        emit: info => {
            rendererIpc.broadcast.emit("notion:app-update-reload", info);
        },
        addListener(fn) {
            rendererIpc.broadcast.addListener("notion:app-update-reload", fn);
        },
        removeListener(fn) {
            rendererIpc.broadcast.removeListener("notion:app-update-reload", fn);
        },
    },
    async getAppPath() {
        const invokeResult = await rendererIpc.invokeInMainAndReturnResult("notion:get-app-path");
        if (invokeResult.error) {
            return "";
        }
        else {
            return invokeResult.value;
        }
    },
    clearAllCookies: () => {
        rendererIpc.sendToMain("notion:clear-all-cookies");
    },
    downloadUrl(url) {
        rendererIpc.sendToMain("notion:download-url", { url });
    },
    onNavigate: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:navigate-to-url", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:navigate-to-url", fn);
        },
    },
    onOpenSettings: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:open-settings", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:open-settings", fn);
        },
    },
    getSqliteMeta: () => {
        return rendererIpc.invokeInMainAndReturnResult("notion:get-sqlite-meta");
    },
    refreshAll: includeActiveTabInFocusedWindow => {
        return rendererIpc.invokeInMainAndReturnResult("notion:refresh-all", includeActiveTabInFocusedWindow);
    },
    ready() {
        return rendererIpc.invokeInMainAndReturnResult("notion:ready");
    },
    sqliteServerEnabled: true,
    electronAppFeatures: {
        get() {
            return rendererIpc.invokeInMainAndReturnResult("notion:get-electron-app-features");
        },
        setPreference(key, value) {
            rendererIpc.sendToMain("notion:set-user-preference", key, value);
        },
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:set-electron-app-features", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:set-electron-app-features", fn);
        },
    },
    sidebarState: {
        set(state) {
            rendererIpc.sendToMain("notion:set-sidebar-state", state);
        },
        addToggleListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:toggle-sidebar-expanded", fn);
        },
        removeToggleListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:toggle-sidebar-expanded", fn);
        },
    },
    windowSidebarState: {
        get() {
            return rendererIpc.invokeInMainAndReturnResult("notion:get-window-sidebar-state");
        },
        set(state) {
            rendererIpc.sendToMain("notion:set-window-sidebar-state", state);
        },
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:set-window-sidebar-state", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:set-window-sidebar-state", fn);
        },
    },
    track: {
        addListener(fn) {
            rendererIpc.handleMainToNotionEvent.addListener("notion:track", fn);
        },
        removeListener(fn) {
            rendererIpc.handleMainToNotionEvent.removeListener("notion:track", fn);
        },
    },
    closeGlobalSearchModal() {
        rendererIpc.sendToMain("notion:close-global-search-modal");
    },
    openPageFromGlobalSearch(url) {
        rendererIpc.sendToMain("notion:open-page-from-global-search", url);
    },
};
window["__electronApi"] = electronApi;
window["__isElectron"] = true;
window["__platform"] = process_1.default.platform;
window.addEventListener("keydown", event => {
    if (event.altKey) {
        rendererIpc.sendToMain("notion:alt-key-down");
    }
});
window.addEventListener("focus", () => {
    rendererIpc.sendToMain("notion:focus");
});
window.addEventListener("blur", () => {
    rendererIpc.sendToMain("notion:blur");
});

// Mizari fait des bêtises :D

const RPC = require('discord-rpc');


const client = new RPC.Client({ transport: 'ipc' });
const rpcOpt = {
  details: `Currently working (I guess ?)`,
  state: `In a certain workspace`,
  startTimestamp: new Date(),
  largeImageKey: `logo`,
  largeImageText: `dev by Mizari`,
  buttons:[
    {
      label: "notion.so",
      url: "https://www.notion.so/"
    },
    {
      label: "get the RPC",
      url: "https://github.com/Mizari-W/Discord-RPC-for-Notion"
    }
  ]
};

client.on('ready', () => {
  client.setActivity(rpcOpt);
  console.log(`Client ready 👍`);
});

window.addEventListener('DOMContentLoaded', () => {
  client.login({ clientId: "928952870374621194" });
});

var oldTitle = document.title;
var oldWorkspace = "";
var modified = false;

window.setInterval(function(){
    if (document.title !== oldTitle){
      rpcOpt.details = `Currently working on ${document.title}`;
      modified = true;
    }
    oldTitle = document.title;

    try {
      var newWorkspace = document.querySelector("#notion-app").querySelector("div").querySelector("div").querySelector("div").querySelector("div").querySelector("div").querySelector("div").querySelectorAll(".notranslate")[1].querySelector("div").querySelector("div").textContent;
    } catch (e) {
      var newWorkspace = "";
    }
    if (newWorkspace !== null && newWorkspace !== oldWorkspace){
      rpcOpt.state = `In ${newWorkspace}`;
      modified = true;
    }
    oldWorkspace = newWorkspace;

    if (modified){
      modified = false;
      client.setActivity(rpcOpt);
    }
}, 100);
