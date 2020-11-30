/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:1.js
 * 修改日期:2020/11/27 17:58:25
 * 作者:kerojiang
 */

const Lang = imports.lang;
const { St, Clutter, Soup, GLib, Json, Gio } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const ByteArray = imports.byteArray;

let panelButton;

//配置信息
let settings;

//json解析器
let jsonParser;

//数据文件夹路径
let dataPath;

//设置发生改变
function _settingsChanged() {}

/**
 * 读取本地数据
 * @param filePath 文件路径
 */
function _readLocalData(filePath) {
  try {
    let [ok, contents] = GLib.file_get_contents(filePath);

    if (ok) {
      return ByteArray.toString(contents);
    }
  } catch (err) {
    logError(err, "读取本地数据异常");
  }
}

/**
 * 写入本地数据
 * @param filePath 文件路径
 *@param contents 文件内容
 */
function _writeLocalData(filePath, contents) {
  try {
    GLib.file_set_contents(filePath, contents);
  } catch (err) {
    logError(err, "写入本地数据异常");
  }
}

/**
 * 获取http数据
 * @param url http地址
 */
function _getHttpJson(url) {
  let session = Soup.Session.new();

  let message = Soup.Message.new("GET", url);

  try {
    let status_code = session.send_message(message);
    if (status_code == Soup.Status.OK) {
      let result = ByteArray.toString(
        ByteArray.fromGBytes(message.response_body_data),
        "GBK"
      );
      return result;
    } else {
      //网络异常
      log("请求数据错误,code:" + status_code);
    }
  } catch (err) {
    logError(err, "网络数据异常");
  }
}

/**
 * 获取节假日数据
 */
function _getHolidayData() {
  let filename = "holiday.json";
  let url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=法定节假日&resource_id=39042&format=json&tn=wisetpl";
  let jsonData = _getHttpJson(url);

  try {
  } catch (err) {
    logError(err, "获取节假日数据异常");
  }
}

/**
 * 获取农历数据
 * @param year 年
 *@param month 月
 */
function _getLunarData(year, month) {
  let filePath = dataPath + "/" + year + "-" + month + ".json";

  let url =
    "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=" +
    year +
    "年" +
    month +
    "月&resource_id=39043&format=json&tn=wisetpl";

  try {
    let jsonData;

    //检查本地是否存在指定数据,不存在才获取网络数据
    let isExit = GLib.file_test(filePath, GLib.FileTest.EXISTS);
    if (isExit) {
      //读取本地文件
      jsonData = _readLocalData(filePath);
      log(jsonData);
    } else {
      jsonData = _getHttpJson(url);
      //保存文件
      _writeLocalData(filePath, jsonData);
    }

    //j解析json数据
  } catch (err) {
    logError(err, "获取农历数据异常");
  }
}

//初始化插件
function init() {
  try {
    //初始化全局变量
    jsonParser = Json.Parser.new();
    dataPath = CurrentExtension.dir.get_child("data").get_path();

    log("data文件夹路径" + dataPath);

    //读取配置文件
    settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.another-lunar-calendar"
    );
    //属性变动触发对应操作

    // // 创建面板按钮
    // panelButton = new St.Bin({
    //   style_class: "panel-button",
    // });
    // let panelButtonText = new St.Label({
    //   text: "kero jiang",
    //   y_align: Clutter.ActorAlign.CENTER,
    // });
    // panelButton.set_child(panelButtonText);
  } catch (err) {
    logError(err, "初始化插件异常");
  }
}

//启动插件
function enable() {
  try {
    // // Add the button to the panel
    // Main.panel._rightBox.insert_child_at_index(panelButton, 0);

    _getLunarData(2020, 11);
    //_getHolidayData();
  } catch (err) {
    logError(err, "启用插件异常");
  }
}

//结束插件
function disable() {
  try {
    // // Remove the added button from panel
    // Main.panel._rightBox.remove_child(panelButton);
  } catch (err) {
    logError(err, "禁用插件异常");
  }
}
