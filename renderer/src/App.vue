<script setup>
  import { useI18n } from "vue-I18n";
  const { t, locale } = useI18n({ useScope: 'global' })

  import { ref, onMounted, onUpdated, nextTick } from 'vue'
  import {
    ArrowLeftBold,
    ArrowRightBold,
    Close,
    CopyDocument,
    Delete,
    DocumentCopy,
    FolderAdd,
    FullScreen,
    Minus,
    More,
    Plus,
    Refresh,
    ScaleToOriginal,
    Scissor,
    SetUp,
    Star,
    ZoomIn,
    ZoomOut,
    Document as iconDocument,
    Loading as iconLoading
  } from '@element-plus/icons-vue'
  import unibox from './utils/unibox'
  const $ = (query) => {
    return document.querySelector(query)
  }
  const $main = window.electronAPI
  const $options = new URL(location.href).searchParams
  const sendNotification = ElNotification
  const sendMessage = ElMessage

  let tabIndex = -1
  let lastTab = false
  let initTabs = {}
  const tabContextMenuIndex = ref(-1)
  const version = $options.get('ver') || ""
  const startUrl = $options.get('url') || ref('https://limestart.cn/')
  const newTabUrl = $options.get('newTabUrl') || ref('https://limestart.cn/')
  const searchUrl = $options.get('searchUrl') || ref('https://cn.bing.com/search?q=')
  const targetUrl = ref('')
  const targetUrlBarVisible = ref(false)
  const contextMenuPos = ref(['50px', '100px'])
  const contextMenuVisible = ref(false)
  const contextMenuMore = ref(false)
  const contextMenuFlags = ref({ editFlags: {} })
  const contextMenuMainPos = ref(['50px', '100px'])
  const contextMenuMainVisible = ref(false)
  const contextMenuMainMore = ref(false)
  const contextMenuMainFlags = ref({ target: {} })
  const popMenu = ref('')
  const userAgent = ref(navigator.userAgent.replace(/Electron\/\d*(\.\d)*\s/, "").replace("ryokin", "Ryokin"))
  console.log(`UA: ${userAgent.value}`)
  const activeTabsId = ref('')
  const newTabPos = ref('0')
  const dragAreaHeight = ref('0')
  const webTabs = ref([{
    title: '',
    favicon: '',
    loading: false,
    url: '',
    urlInput: '',
    id: '',
    zoomLevel: 0,
    canGoBack: false,
    canGoForward: false
  }])
  const zoomFactors = {
    "-7": 0.25,
    "-6": 0.33,
    "-5": 0.50,
    "-4": 0.67,
    "-3": 0.75,
    "-2": 0.80,
    "-1": 0.90,
    "0": 1.00,
    "1": 1.10,
    "2": 1.25,
    "3": 1.50,
    "4": 1.75,
    "5": 2.00,
    "6": 2.50,
    "7": 3.00,
    "8": 4.00,
    "9": 5.00
  }
  $main.handleTab((event, value) => {
    switch (value.action) {
      case 'add':
        addTab(value.url)
        break
    }
  })
  $main.handleZoom((event, action) => {
    doWebZoom(action)
  })

  const handleTabsEdit = (
    targetId,
    action
  ) => {
    if (action === 'add') {
      addTab()
    } else if (action === 'remove') {
      removeTab(targetId)
    }
    update()
  }
  const addTab = (url = newTabUrl.value) => {
    const newTabId = `${++tabIndex}`
    webTabs.value.push({
      title: t('app.message.loading'),
      id: newTabId,
      url: url,
      urlInput: url,
      zoomLevel: 0,
      canGoBack: false,
      canGoForward: false,
      loading: true
    })
    activeTabsId.value = newTabId
    //nextTick(initWebview(newTabId))
    //if(tabIndex!=0)url == newTabUrl.value ? doAddressInputFocus() : () => { }
  }
  const removeTab = (targetId) => {
    let tabs = webTabs.value
    if (tabs.length <= 1) {
      if (lastTab)
        winClose()
      else {
        addTab()
        lastTab = true
      }
    } else
      lastTab = false
    let activeId = activeTabsId.value
    delete initTabs[targetId]
    if (targetId != '') {
      $("#webview" + targetId).closeDevTools()
      $("#webview" + targetId).stop()
    }
    if (activeId === targetId) {
      tabs.forEach((tab, index) => {
        if (tab.id === targetId) {
          const nextTab = tabs[index + 1] || tabs[index - 1]
          if (nextTab) {
            activeId = nextTab.id
          }
        }
      })
    }

    $("#webview" + targetId).remove()
    activeTabsId.value = activeId
    webTabs.value = tabs.filter((tab) => tab.id !== targetId)
  }
  const getTabIndex = (id) => {
    let idx = -1
    webTabs.value.forEach((tab, index) => {
      if (tab.id === id) {
        idx = index
      }
    })
    return idx
  }
  const getZoomLevel = () => {
    let currentZoomLevel = null
    let currentZoomFactor = $("#webview" + activeTabsId.value).getZoomFactor()
    for (var index in zoomFactors) {
      if (Math.abs(currentZoomFactor - zoomFactors[index]) <= 0.025) {
        currentZoomLevel = index
      }
    }
    if (currentZoomLevel == null) {
      $("#webview" + activeTabsId.value).setZoomFactor(1.0)
      currentZoomLevel = 0
    }
    return currentZoomLevel
  }

  const initNewTabButton = () => {
    setTimeout(() => {
      newTabPos.value = $("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-scroll").getBoundingClientRect().width + ($("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-prev") ? $("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-prev").getBoundingClientRect().width : 0) + ($("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-next") ? $("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-next").getBoundingClientRect().width : 0) + 5 + "px"
    }, 15)
  }
  const initDragArea = () => {
    setTimeout(() => {
      dragAreaHeight.value = $("#webTabs>.el-tabs__header>.el-tabs__nav-wrap>.el-tabs__nav-scroll").getBoundingClientRect().height + 5 + "px"
    }, 15)
  }
  const initWebview = (id) => {
    /**const webviewEvent = [
      'load-commit',
      'did-finish-load',
      'did-fail-load',
      'did-frame-finish-load',
      'did-start-loading',
      'did-stop-loading',
      'did-attach',
      'dom-ready',
      //'page-title-updated',
      //'page-favicon-updated',
      //'enter-html-full-screen',
      //'leave-html-full-screen',
      //'console-message',
      'found-in-page',
      'will-navigate',
      'did-start-navigation',
      'did-redirect-navigation',
      'did-navigate',
      'did-frame-navigate',
      'did-navigate-in-page',
      'ipc-message',
      'crashed',
      'plugin-crashed',
      'destroyed',
      'media-started-playing',
      'media-paused',
      'did-change-theme-color',
      //'update-target-url',
      //'devtools-open-url',
      //'devtools-opened',
      //'devtools-closed',
      //'devtools-focused',
      'context-menu'
    ]
    webviewEvent.forEach((event) => {
      $("#webview" + id).addEventListener(event, (a, b) => {
        console.log("#webview" + id, event, a, b)
      })
    })**/
    $("#webview" + id).addEventListener('context-menu', (e) => {
      contextMenuFlags.value = e.params
      doContextMenuShow(e.params.x, e.params.y)
    })
    $("#webview" + id).addEventListener('dom-ready', (e) => {
      if (initTabs[id] !== true) {
        $main.webReg($("#webview" + id).getWebContentsId())
        initTabs[id] = true
      }
      webTabs.value[getTabIndex(activeTabsId.value)].zoomLevel = getZoomLevel()
    })
    $("#webview" + id).addEventListener('page-title-updated', () => {
      webTabs.value[getTabIndex(id)].title = $("#webview" + id).getTitle()
      update()
    })
    $("#webview" + id).addEventListener('close', () => {
      removeTab(id)
    })
    $("#webview" + id).addEventListener('did-navigate', () => {
      //$("#webview" + id).stop()
    })
    $("#webview" + id).addEventListener('did-start-loading', () => {
      webTabs.value[getTabIndex(id)].loading = true
      doAddressInputRecover()
    })
    $("#webview" + id).addEventListener('did-stop-loading', () => {
      webTabs.value[getTabIndex(id)].loading = false
      doAddressInputRecover()
      canWebBackForward()
    })
    $("#webview" + id).addEventListener('did-navigate', (e) => {
      webTabs.value[getTabIndex(id)].url = $("#webview" + id).getURL()
      doAddressInputRecover()
      canWebBackForward()
    })
    $("#webview" + id).addEventListener('page-favicon-updated', (e) => {
      webTabs.value[getTabIndex(id)].favicon = e.favicons[0]
    })
    $("#webview" + id).addEventListener('update-target-url', (e) => {
      if (e.url == "") {
        targetUrlBarVisible.value = false
      } else {
        targetUrlBarVisible.value = true
        targetUrl.value = e.url
      }
    })
    $("#webview" + id).addEventListener('devtools-open-url', (e) => {
      addTab(e.url)
    })
  }

  const onTabChange = (id = activeTabsId.value) => {
    initWebview(id)
    targetUrlBarVisible.value = false
    update()
  }
  const onTabBeforeChange = (newId, oldId) => {
    return true
    canWebBackForward(newId)
  }
  const onTabContextMenu = (e) => {
    contextMenuMainFlags.value = e
    doContextMenuMainShow(e.x, e.y)
  }
  const onContextMenuClick = (action, data) => {
    action == "more" ? null : doWebviewFocus()
    switch (action) {
      case 'copy':
        $("#webview" + activeTabsId.value).copy()
        sendMessage({
          message: t('app.message.copySuccess'),
          type: 'success'
        })
        break
      case 'cut':
        $("#webview" + activeTabsId.value).cut()
        break
      case 'paste':
        $("#webview" + activeTabsId.value).paste()
        break
      case 'delete':
        $("#webview" + activeTabsId.value).delete()
        break
      case 'addTab':
        addTab(data)
        break
      case 'debug':
        //$("#webview" + activeTabsId.value).openDevTools()
        $main.webDebug($("#webview" + activeTabsId.value).getWebContentsId(), parseInt(data[0]) - 20, parseInt(data[1]) - 20)
        break
      case 'more':
        contextMenuMore.value = true
        break
    }
    action == "more" ? null : doContextMenuHide()
  }
  const onContextMenuMainClick = (action, data) => {
    if (tabContextMenuIndex.value == -1) {
      switch (action) {
        case 'copy':
          document.execCommand('copy', false)
          sendMessage({
            message: t('app.message.copySuccess'),
            type: 'success'
          })
          break
        case 'cut':
          document.execCommand('cut', false)
          break
        case 'paste':
          document.execCommand('paste', false)
          break
        case 'delete':
          document.execCommand('delete', false)
          break
        case 'addTab':
          $('#addressBar').select()
          document.execCommand('paste', false)
          doWebGo()
          break
        case 'debug':
          $main.winDebug()
          break
        case 'more':
          contextMenuMainMore.value = true
          break
      }
    } else {
      switch (action) {
        case 'copy':
          addTab(webTabs.value[getTabIndex(tabContextMenuIndex.value)].url)
          break
        case 'delete':
          handleTabsEdit(tabContextMenuIndex.value, 'remove')
          doContextMenuMainHide()
          break
        case 'addTab':
          addTab()
          break
        case 'debug':
          $main.winDebug()
          break
        case 'more':
          contextMenuMainMore.value = true
          break
      }
    }
    action == "more" ? null : doContextMenuMainHide()
  }
  const onPopMenuClick = (menu, action) => {
    switch (menu) {
      case 'zoom':
        doWebZoom(action)
        doWebviewFocus()
        break
    }
  }
  const onAddressBarFocus = () => {
    $("#addressBar").select()
  }
  const onToolBarClick = (id) => {
    switch (id) {
      case 'zoom':
        doPopMenuShow('zoom')
        break
    }
  }
  const onMaskClick = () => {
    doContextMenuHide()
    doContextMenuMainHide()
    doPopMenuHide()
  }
  const onAddressBarContextMenu = (e) => {
    contextMenuMainFlags.value = e
    doContextMenuMainShow(e.x, e.y)
  }

  const winClose = () => {
    $("#winClose").blur()
    $main.winClose()
  }
  const winMax = () => {
    $("#winMax").blur()
    $main.winMax()
  }
  const winMin = () => {
    $("#winMin").blur()
    $main.winMin()
  }

  const canWebBackForward = (id = activeTabsId.value) => {
    webTabs.value[getTabIndex(id)].canGoBack = $("#webview" + id).canGoBack()
    webTabs.value[getTabIndex(id)].canGoForward = $("#webview" + id).canGoForward()
  }

  const doTabContextMenu = (id) => {
    tabContextMenuIndex.value = id
  }

  const doAddressInputFocus = () => {
    $("#addressBar").focus()
  }
  const doAddressInputRecover = (id = activeTabsId.value) => {
    webTabs.value[getTabIndex(id)].urlInput = decodeURI(webTabs.value[getTabIndex(id)].url)
    doWebviewFocus()
  }
  const doWebviewFocus = () => {
    $("#webview" + activeTabsId.value) ? $("#webview" + activeTabsId.value).focus() : null
  }
  const doWebGo = (cmd) => {
    // console.error('dowebgo',cmd)
    if (cmd == "force")
      webTabs.value[getTabIndex(activeTabsId.value)].url = webTabs.value[getTabIndex(activeTabsId.value)].urlInput
    else
      webTabs.value[getTabIndex(activeTabsId.value)].url = unibox.input(webTabs.value[getTabIndex(activeTabsId.value)].urlInput, searchUrl.value)[0]
    doWebviewFocus()
  }
  const doWebBack = () => {
    $("#webview" + activeTabsId.value).goBack()
    doAddressInputRecover()
  }
  const doWebForward = () => {
    $("#webview" + activeTabsId.value).goForward()
    doAddressInputRecover()
  }
  const doWebStop = () => {
    $("#webview" + activeTabsId.value).stop()
    doAddressInputRecover()
  }
  const doWebReload = () => {
    $("#webview" + activeTabsId.value).reload()
    doAddressInputRecover()
  }
  const doWebZoom = (action) => {
    let currentZoomLevel = getZoomLevel()
    switch (action) {
      case 'in':
        currentZoomLevel < 9 ? $("#webview" + activeTabsId.value).setZoomFactor(zoomFactors[(parseInt(currentZoomLevel) + 1).toString()]) : null
        break
      case 'out':
        currentZoomLevel > -7 ? $("#webview" + activeTabsId.value).setZoomFactor(zoomFactors[(parseInt(currentZoomLevel) - 1).toString()]) : null
        break
      case 'origin':
        $("#webview" + activeTabsId.value).setZoomFactor(1.0)
        break
    }
    webTabs.value[activeTabsId.value].zoomLevel = getZoomLevel()
  }
  const doPopMenuShow = (id) => {
    popMenu.value = id
  }
  const doPopMenuHide = (id) => {
    popMenu.value = ''
  }
  const doContextMenuHide = () => {
    doWebviewFocus()
    $("#webview" + activeTabsId.value) ? $("#webview" + activeTabsId.value).unselect() : null
    contextMenuVisible.value = false
    setTimeout(() => { contextMenuMore.value = false }, 100)
  }
  const doContextMenuMainHide = () => {
    contextMenuMainVisible.value = false
    setTimeout(() => { tabContextMenuIndex.value = -1 }, 20)
    setTimeout(() => { contextMenuMainMore.value = false }, 100)
  }
  const doContextMenuShow = (x, y) => {
    contextMenuPos.value = [x + 20 + 'px', y + 20 + 'px']
    contextMenuVisible.value = true
  }
  const doContextMenuMainShow = (x, y) => {
    contextMenuMainPos.value = [x + 20 + 'px', y + 20 + 'px']
    contextMenuMainVisible.value = true
  }
  const update = () => {
    initNewTabButton()
    initDragArea()
    webTabs.value[getTabIndex(activeTabsId.value)] ? document.title = webTabs.value[getTabIndex(activeTabsId.value)].title : null
  }

  const init = () => {
    addTab(startUrl.value)
    removeTab('')
  }
  const showBuildingTip = () => {
    sendMessage({
      message: t('app.message.uncompletedFunction'),
      type: 'warning'
    })
    doWebviewFocus()
  }
  onUpdated(() => {
    update()
  })
  onMounted(() => {
    init()
    update()
    window.onresize = () => {
      update()
    }
    sendNotification({
      title: t('app.welcome.title'),
      dangerouslyUseHTMLString: true,
      message: t('app.welcome.message', { version: version, buildVersion: userAgent.value.match(/Ryokin\/\d*(\.\d)*/)[0] }),
      duration: 10000,
      offset: 80
    })
  })
</script>

<template>
  <view class="dragArea winDrag" :style="'height: '+dragAreaHeight"></view>
  <view :class="['mask',contextMenuVisible||contextMenuMainVisible||popMenu!=''?'':'hide']" @wheel.passive="onMaskClick"
    @keydown.esc="onMaskClick" @mouseup="onMaskClick" style="left: 0;"></view>
  <view id="contextMenu" :class="['contextMenu',contextMenuVisible?'':'hide']" @wheel.passive="onMaskClick"
    @keydown.esc="onMaskClick" :style="'left:'+contextMenuPos[0]+';top:'+contextMenuPos[1]">
    <el-button-group class="contextMenuSimple">
      <el-button text @click="onContextMenuClick('copy')" v-show="!contextMenuMore&&contextMenuFlags.editFlags.canCopy"
        :icon="CopyDocument" style="transform: rotate(180deg);"></el-button>
      <el-button text @click="onContextMenuClick('cut')" v-show="!contextMenuMore&&contextMenuFlags.editFlags.canCut"
        :icon="Scissor"></el-button>
      <el-button text @click="onContextMenuClick('paste')"
        v-show="!contextMenuMore&&contextMenuFlags.editFlags.canPaste" :icon="DocumentCopy"></el-button>
      <el-button text
        @click="onContextMenuClick('addTab',contextMenuFlags.srcURL==''?contextMenuFlags.linkURL:contextMenuFlags.srcURL)"
        v-show="!contextMenuMore&&contextMenuFlags.mediaType!='none'||contextMenuFlags.linkURL!=''" :icon="FolderAdd"
        style="transform: rotateY(180deg);"></el-button>
      <el-button text @click="onContextMenuClick('more')" v-show="!contextMenuMore" :icon="More"></el-button>
      <el-button text @click="onContextMenuClick('delete')"
        v-show="contextMenuMore||contextMenuFlags.editFlags.canDelete" :icon="Delete"></el-button>
      <el-button v-show="contextMenuMore" text @click="onContextMenuClick('debug',contextMenuPos)"
        :icon="SetUp"></el-button>
    </el-button-group>
  </view>
  <view id="contextMainMenu" :class="['contextMenu',contextMenuMainVisible?'':'hide']" @wheel.passive="onMaskClick"
    @keydown.esc="onMaskClick" :style="'left:'+contextMenuMainPos[0]+';top:'+contextMenuMainPos[1]">
    <el-button-group class="contextMenuSimple">
      <el-button text @click="onContextMenuMainClick('copy')"
        v-show="!contextMenuMainMore&&(tabContextMenuIndex!=-1||contextMenuMainFlags.target.selectionStart!=contextMenuMainFlags.target.selectionEnd)"
        :icon="CopyDocument" style="transform: rotate(180deg);"></el-button>
      <el-button text @click="onContextMenuMainClick('cut')"
        v-show="!contextMenuMainMore&&tabContextMenuIndex==-1&&contextMenuMainFlags.target.selectionStart!=contextMenuMainFlags.target.selectionEnd"
        :icon="Scissor"></el-button>
      <el-button v-show="!contextMenuMainMore&&tabContextMenuIndex==-1" text @click="onContextMenuMainClick('paste')"
        :icon="DocumentCopy"></el-button>
      <el-button text
        @click="onContextMenuMainClick('addTab',contextMenuFlags.srcURL==''?contextMenuMainFlags.linkURL:contextMenuMainFlags.srcURL)"
        v-show="!contextMenuMainMore" :icon="FolderAdd" style="transform: rotateY(180deg);"></el-button>
      <el-button text @click="onContextMenuMainClick('more')" v-show="!contextMenuMainMore" :icon="More"></el-button>
      <el-button text @click="onContextMenuMainClick('delete')"
        v-show="contextMenuMainMore&&(tabContextMenuIndex!=-1||contextMenuMainFlags.target.selectionStart!=contextMenuMainFlags.target.selectionEnd)"
        :icon="Delete"></el-button>
      <el-button v-show="contextMenuMainMore" text @click="onContextMenuMainClick('debug',contextMainMenuPos)"
        :icon="SetUp"></el-button>
    </el-button-group>
  </view>
  <view :class="['targetUrlBar',targetUrlBarVisible?'':'hide']">
    <el-text size="small" truncated style="max-width:30vw;text-align: start;">{{targetUrl}}</el-text>
  </view>
  <view class="newTab" :style="'left: '+newTabPos">
    <el-button text style="height: 30px;width: 30px;" :icon="Plus" @click="handleTabsEdit(activeTabsId,'add')" />
  </view>
  <view id="winBar" class="winBar">
    <el-button-group>
      <el-button text :style="'height: '+dragAreaHeight-10" @click="winMin" id="winMin" :icon="Minus" />
      <el-button text :style="'height: '+dragAreaHeight-10" @click="winMax" id="winMax" :icon="FullScreen" />
      <el-button text :style="'height: '+dragAreaHeight-10" @click="winClose" id="winClose" :icon="Close" />
    </el-button-group>
  </view>
  <el-tabs id="webTabs" @mousemove="update" v-model="activeTabsId" type="card" class="webTabs"
    :before-leave="onTabBeforeChange" @tab-change="onTabChange" @edit="handleTabsEdit" closable>
    <el-tab-pane v-for="item in webTabs" :key="item.id" :name="item.id">
      <template #label>
        <el-row :title="item.title" @click.middle="handleTabsEdit(item.id,'remove')"
          @contextmenu="doTabContextMenu(item.id)" @click.right="onTabContextMenu"
          style="flex-direction: row;flex-wrap: nowrap">
          <el-icon class="tabFavicon is-loading" v-show="item.loading" style="margin: 5;"
            :size="15"><icon-Loading /></el-icon>
          <el-image v-show="!item.loading" class="tabFavicon" :src="item.favicon">
            <template #error>
              <el-icon style="height: 100%;" :size="15"><icon-Document /></el-icon>
            </template>
            <template #placeholder>
            </template>
          </el-image>
          <el-text :type="item.id==activeTabsId?'primary':''" truncated
            style="min-width:30px;max-width:150px;text-align:start;width: calc(100% - 15px)">{{item.title}}</el-text>
          <el-space></el-space>
        </el-row>
      </template>
      <webview :useragent="userAgent" :id="'webview'+item.id" class="webview" :src="item.url||''" allowpopups></webview>
    </el-tab-pane>
  </el-tabs>
  <el-row class="toolbar">
    <el-button-group id="toolBarLeft">
      <el-button :disable="!webTabs[getTabIndex(activeTabsId)].canGoBack" text
        :class="['toolButton',webTabs[getTabIndex(activeTabsId)].canGoBack?'':'disabled']" :icon="ArrowLeftBold"
        @click="doWebBack" />
      <el-button v-show="webTabs[getTabIndex(activeTabsId)].canGoForward" text class="toolButton" :icon="ArrowRightBold"
        @show="update" @click="doWebForward" />
      <el-button v-if="webTabs[getTabIndex(activeTabsId)].loading" text class="toolButton" :icon="Close"
        @click="doWebStop" style="font-size: 17px;" />
      <el-button v-else text class="toolButton" :icon="Refresh" @click="doWebReload" style="font-size: 17px;" />
    </el-button-group>
    <el-input id="addressBar" v-model="webTabs[getTabIndex(activeTabsId)].urlInput" @focus="onAddressBarFocus"
      @click.right="onAddressBarContextMenu" @keydown.esc="doAddressInputRecover" @keydown.enter.exact="doWebGo()"
      @keydown.ctrl.enter.exact="doWebGo('force')" class="addressBar"
      :style="'width:'+';margin-left: 5px;margin-right: 5px;'">
      <template #append style="background-color: var(--el-fill-color-blank);">
        <view>
          <el-button :title="Math.round(zoomFactors[webTabs[getTabIndex(activeTabsId)].zoomLevel]*100)+'%'" size="small"
            text :icon="webTabs[getTabIndex(activeTabsId)].zoomLevel>=0?ZoomIn:ZoomOut" class="addressBarButton"
            :style="webTabs[getTabIndex(activeTabsId)].zoomLevel==0?'':'color: var(--el-color-primary);'"
            @click="onToolBarClick('zoom')"></el-button>
          <el-row :class="['popMenu',popMenu=='zoom'?'':'hide']">
            <el-text
              style="height: 100%">{{Math.round(zoomFactors[webTabs[getTabIndex(activeTabsId)].zoomLevel]*100)+"%"}}</el-text>
            <el-button-group class="popMenuButtons">
              <el-button text size="small" :icon="Plus" @click="onPopMenuClick('zoom','in')"></el-button>
              <el-button text size="small" :icon="Minus" @click="onPopMenuClick('zoom','out')"></el-button>
              <el-button text size="small" :icon="ScaleToOriginal" @click="onPopMenuClick('zoom','origin')"
                style="font-size: 17px;padding: 6.5px;"></el-button>
            </el-button-group>
          </el-row>
        </view>
        <el-button @click="showBuildingTip" size="small" text :icon="Star"
          class="addressBarButton disabled"></el-button>
      </template>
    </el-input>
    <el-button-group id="toolBarRight">
      <el-button @click="showBuildingTip" text class="toolButton" :icon="More" />
    </el-button-group>
    <!-- <el-input v-model="webTabs[getTabIndex(activeTabsId)].url"></el-input> -->
  </el-row>
</template>

<style scoped>
  .webview {
    margin-top: 25px;
    width: 100vw;
    height: calc(100vh - 86px);
  }

  .popMenu {
    display: flex;
    position: absolute;
    background-color: var(--w-alpha-90);
    top: 42px;
    right: 20px;
    flex-direction: row;
    padding: 5px 10px;
    padding-right: 5px;
    border-radius: 7px;
    flex-wrap: nowrap;
    height: 40px;
    align-items: center;
    justify-content: center;
    z-index: 70;
    user-select: none;
    transition: 0.1s;
  }

  .popMenu>.popMenuButtons {
    margin-left: 5px;
    display: flex;
    flex-direction: row;
    height: 30px;
    width: 90px;
    color: var(--el-text-color-primary);
  }

  .popMenu>.popMenuButtons>.el-button {
    left: 20px;
    width: 30px;
    height: 30px;
    padding: 8px;

  }

  .contextMenu {
    position: absolute;
    z-index: 70;
    transition: filter 0.1s;
  }

  .contextMenuSimple {
    background-color: rgba(246, 246, 246, 0.8);
    border-radius: 7px;
  }

  .contextMenuSimple>* {
    font-size: 20px;
    width: 35px;
  }

  .targetUrlBar {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 20;
    background-color: var(--el-border-color);
    color: var(--el-text-color-secondary);
    padding: 2px 4px;
    border-top-right-radius: 5px;
    line-height: 14px;
    transition: 0.1s;
  }

  .toolbar {
    padding-left: 5px;
    padding-right: 5px;
    display: flex;
    flex-direction: row;
    position: absolute;
    top: 50px;
    height: 32px;
    width: 100vw;
  }

  .toolBarMiddle {
    flex: 1;
  }

  .toolButton {
    width: 35px;
  }

  .addressBarButton {
    width: 26px;
    /* height: 26px; */
    margin: 4px 0px;
    text-align: center;
    padding: 5px;
  }

  .webTabs {
    height: calc(100vh - 5px);
    width: 100vw;
  }

  .tabFavicon {
    width: 20px;
    margin-left: -10px;
    margin-right: 5px;
    height: 20px;
  }

  .el-tabs__nav-scroll {
    width: 95vw;
    -webkit-app-region: drag;
  }

  .newTab {
    position: absolute;
    z-index: 50;
    margin: 5px;
    margin-top: 10px;
    -webkit-app-region: no-drag;
  }

  .winBar {
    position: absolute;
    right: 0px;
    top: 0px;
    z-index: 100;
  }

  .dragArea {
    position: absolute;
    width: 100vw;
    left: 0;
    z-index: 10;
  }

  .disabled {
    color: #ddd;
    cursor: default;
  }

  .disabled:hover {
    background-color: #FFF;
  }

  .addressBar {
    width: fit-content;
    flex: 1;
  }
</style>