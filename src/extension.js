/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar 
 * 文件名称:1.js
 * 修改日期:2020/11/27 17:58:25
 * 作者:kerojiang
*/

const Lang = imports.lang;
const { St, Clutter, Soup, GLib } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let panelButton;

//配置信息
let settings;

//网络session
let webSession;

//写入本地数据
function _writeLocalData(cdata) {
  let jsonPath = "";
  try {
    let contents = JSON.stringify(cdata, null, "\t");
    GLib.file_set_contents(jsonPath, contents);
  } catch (err) {
    logError(err, "写入本地数据异常");
  }
}

//设置发生改变
function _settingsChanged() { }
//读取本地json数据
function _readLocalData() {
  //检查本地数据
  var jsonPath = "";

  try {
    let [ok, contents] = GLib.file_get_contents(jsonPath);

    if (ok) {
      let cdata = JSON.parse(contents);
      log(cdata);
    }
  } catch (err) {
    logError(err, "读取本地数据异常");
  }
}

//获取农历数据
function _getLunarData() {
  let url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=" +
    year +
    "年" +
    month +
    "月&resource_id=39043&format=json&tn=wisetpl";

  url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=%E6%B3%95%E5%AE%9A%E8%8A%82%E5%81%87%E6%97%A5&resource_id=39042&format=json&tn=wisetpl";
  log("请求地址" + url);

  if (!webSession) {
    webSession = Soup.Session.new();
    // webSession.set_property(
    //   Soup.SESSION_USER_AGENT,
    //   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
    // );
  }
  try {
    let message = Soup.Message.new("GET", url);
    let status_code = webSession.send_message(message);
    log("请求状态" + status_code);
    log("接收到数据" + message.response_body.data);

    if (status_code == Soup.Status.OK) {
      log("接收到数据" + message.response_body.data);
      //let dataObj = JSON.parse(message.response_body.data);
    }
  } catch (err) {
    logError(err, "读取网络数据异常");
  }
}

//初始化插件
function init() {
  try {
    // 创建面板按钮
    panelButton = new St.Bin({
      style_class: "panel-button",
    });
    let panelButtonText = new St.Label({
      text: "kero jiang",
      y_align: Clutter.ActorAlign.CENTER,
    });
    panelButton.set_child(panelButtonText);

    let folderPath = CurrentExtension.dir.get_child("data").get_path();
  } catch (err) {
    logError(err, "初始化插件异常");
  }
}

//启动插件
function enable() {
  try {
    //读取配置文件
    settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.another-lunar-calendar"
    );
    //属性变动触发对应操作

    // Add the button to the panel
    Main.panel._rightBox.insert_child_at_index(panelButton, 0);

    _getLunarData(2020, 11);
  } catch (err) {
    logError(err, "启用插件异常");
  }
}

//结束插件
function disable() {
  try {
    // Remove the added button from panel
    Main.panel._rightBox.remove_child(panelButton);
    log("取消初始化插件");
  } catch (err) {
    logError(err, "禁用插件异常");
  }
}

//设置发生改变
// function _settingsChanged() {}

//读取本地json数据
// function _readLocalData() {
//   //检查本地数据
//   var jsonPath = "";

//   try {
//     let [ok, contents] = GLib.file_get_contents(jsonPath);

//     if (ok) {
//       let cdata = JSON.parse(contents);
//       log(cdata);
//     }
//   } catch (err) {
//     logError(err, "读取本地数据异常");
//   }
// }

//写入本地数据
// function _writeLocalData(cdata) {
//   let jsonPath = "";
//   try {
//     let contents = JSON.stringify(cdata, null, "\t");
//     GLib.file_set_contents(jsonPath, contents);
//   } catch (err) {
//     logError(err, "写入本地数据异常");
//   }
// }

//获取农历数据
function _getLunarData(year, month) {
  let url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=" +
    year +
    "年" +
    month +
    "月&resource_id=39043&format=json&tn=wisetpl";

  url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=%E6%B3%95%E5%AE%9A%E8%8A%82%E5%81%87%E6%97%A5&resource_id=39042&format=json&tn=wisetpl";
  log("请求地址" + url);

  if (!webSession) {
    webSession = Soup.Session.new();
    // webSession.set_property(
    //   Soup.SESSION_USER_AGENT,
    //   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
    // );
  }
  try {
    let message = Soup.Message.new("GET", url);
    let status_code = webSession.send_message(message);
    log("请求状态" + status_code);
    log("接收到数据" + message.response_body.data);

    if (status_code == Soup.Status.OK) {
      log("接收到数据" + message.response_body.data);
      //let dataObj = JSON.parse(message.response_body.data);
    }
  } catch (err) {
    logError(err, "读取网络数据异常");
  }
}
