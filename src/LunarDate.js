/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:LunarDate.js
 * 修改日期:2020/12/03 11:08:17
 * 作者:kerojiang
 */

const Lang = imports.lang;
const { St, Clutter, Soup, GLib, Gio } = imports.gi;
const Calendar = imports.ui.calendar;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const ByteArray = imports.byteArray;

//文件夹权限
const PERMISSIONS_MODE = 0o744;

const LunarDate = new Lang.Class({
  Name: "LunarDate",
  _init: function () {
    this.isEnable = false;
    this.lunarMap = new Map();
    this.settings = null;
    this.dataPath = "";
  },
  enable: function () {
    this.isEnable = true;
    if (this.settings == null) {
      _initSetting();
      _onSettingChanged();
    }
    if (this.dataPath == "") {
      _initDataPath();
    }
    if (this.lunarMap == null) {
    }
  },
  disable: function () {},
  _initSetting: function () {
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.another-lunar-calendar"
    );
  },
  _onSettingChanged: function () {},
  _initDataPath: function () {
    let path = CurrentExtension.dir.get_child("data").get_path();
    if (GLib.mkdir_with_parents(path, PERMISSIONS_MODE) === 0) {
      this.dataPath = path;
    }
  },
  _initLunarData: function (year, month) {
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
          let model = new Object();
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
          this.lunarMap.set(model.GetKeyString(), model);
        }
      });
    } catch (err) {
      logError(err, "获取农历数据异常");
    }
  },
  _readLocalData: function (filePath) {
    try {
      let [ok, contents] = GLib.file_get_contents(filePath);
      if (ok) {
        return ByteArray.toString(contents);
      }
    } catch (err) {
      logError(err, "读取本地数据异常");
    }
  },
  _writeLocalData(filePath, contents) {
    try {
      GLib.file_set_contents(filePath, contents);
    } catch (err) {
      logError(err, "写入本地数据异常");
    }
  },
  _getHttpJson(url, encode) {
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
  },
});
