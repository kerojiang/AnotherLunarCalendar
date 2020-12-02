/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:1.js
 * 修改日期:2020/11/27 17:58:25
 * 作者:kerojiang
 */

const Lang = imports.lang;
const { St, Clutter, Soup, GLib, Gio } = imports.gi;
const Main = imports.ui.main;
const Calendar = imports.ui.calendar;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const ByteArray = imports.byteArray;

//文件夹权限
const PERMISSIONS_MODE = 0o744;

let dateMenu;

//配置信息
let settings;

//数据文件夹路径
let dataPath;

//数据集合
let lunarMap = new Map();

//当前系统时间
let LocalDateTime = GLib.DateTime.new_now_local();

//数据model
class LunarModel {
  constructor() {
    //属相
    this.Animal = "";
    //不宜
    this.Avoid = "";
    //宜
    this.Suit = "";
    //农历年
    this.LunarYear = "";
    //农历月
    this.LunarMonth = "";
    //农历日
    this.LunarDay = "";
    //是否放假
    this.IsHoliday = "0";
    //节假日名称
    this.HolidayName = "";
    //节气
    this.Term = "";
    //阳历年
    this.Year = "";
    //阳历月
    this.Month = "";
    //阳历日
    this.Day = "";
    //星期
    this.WeekDay = "";
  }

  //获取Key值
  GetKeyString() {
    return this.Year + this.Month + this.Day;
  }

  //获取农历日期格式
  GetLunarDateString() {
    return this.LunarYear + "年" + this.LunarMonth + "月" + this.LunarDay;
  }
}

//自定义日历控件
// var LunarCalendar = new Lang.Class({
//   Name: "LunarCalendar",
//   Extends: Calendar,

//   _isWorkDay(date) {
//     super._isWorkDay(date);
//   },

//   canClose() {
//     return false;
//   },
// });

//更新面板日期
function _panelClockUpdate() {
  let lunarString = "\u2001";
  let showOnPanel = settings.get_boolean("show-onpanel");
  if (showOnPanel) {
    let todayKey =
      String(LocalDateTime.get_year()) +
      String(LocalDateTime.get_month()) +
      String(LocalDateTime.get_day_of_month());
    let model = lunarMap.get(todayKey);
    if (model) {
      lunarString =
        " " + model.LunarYear + "年" + model.LunarMonth + "月" + model.LunarDay;
    }
  }

  dateMenu._clockDisplay.text = dateMenu._clock.clock + lunarString;
}

//设置发生改变
function _settingsChanged() {}

/**odel
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
 * @param encode 数据编码
 */
function _getHttpJson(url, encode) {
  let session = Soup.Session.new();
  //超时时间
  session.timeout = 2;
  let message = Soup.Message.new("GET", url);

  try {
    let status_code = session.send_message(message);
    if (status_code == Soup.Status.OK) {
      let result = ByteArray.toString(
        ByteArray.fromGBytes(message.response_body_data),
        encode
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
 * 获取农历数据
 * @param year 年
 *@param month 月
 */
function _getLunarData(year, month) {
  const encode = "GBK";
  let filePath = dataPath + "/l" + year + "-" + month + ".json";

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
    } else {
      jsonData = _getHttpJson(url, encode);
      //保存文件
      _writeLocalData(filePath, jsonData);
    }

    //解析json数据
    const rootObj = JSON.parse(jsonData);
    rootObj.data[0].almanac.forEach((e) => {
      if (e.year == year && e.month == month) {
        //创建农历obj
        const model = new LunarModel();
        model.Year = e.year;
        model.Month = e.month;
        model.Day = e.day;
        model.Animal = e.animal;
        model.Avoid = e.avoid;
        model.Suit = e.suit;
        model.LunarYear = e.gzYear;
        model.LunarMonth = e.lMonth;
        model.LunarDay = e.lDate;
        model.WeekDay = e.cnDay;
        //是否放假
        if (e.status) {
          model.IsHoliday = true;
        } else {
          model.IsHoliday = false;
        }
        if (e.value) {
          model.HolidayName = e.value;
        }
        model.Term = e.term;
        lunarMap.set(model.GetKeyString(), model);
      }
    });
  } catch (err) {
    logError(err, "获取农历数据异常");
  }
}

/**
 * 显示农历数据
 */
function _showLunarData() {
  if (lunarMap) {
  }
}

//初始化插件
function init() {
  try {
    //初始化全局变量
    dataPath = CurrentExtension.dir.get_child("data").get_path();
    if (GLib.mkdir_with_parents(dataPath, PERMISSIONS_MODE) != 0) {
      log("创建数据文件夹失败");
    }

    //读取配置文件
    settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.another-lunar-calendar"
    );
    settings.connect("changed", function () {});

    //数据准备
    _getLunarData(LocalDateTime.get_year(), LocalDateTime.get_month());

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
    dateMenu = Main.panel.statusArea.dateMenu;
    dateMenu._clock.connect(
      "notify::clock",
      Lang.bind(dateMenu, _panelClockUpdate)
    );
    _panelClockUpdate();
  } catch (err) {
    logError(err, "启用插件异常");
  }
}

//结束插件
function disable() {
  try {
    dateMenu._clock.run_dispose();
  } catch (err) {
    logError(err, "禁用插件异常");
  }
}
