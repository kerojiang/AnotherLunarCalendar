/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:LunarDate.js
 * 修改日期:2020/12/03 11:08:17
 * 作者:kerojiang
 */
const Lang = imports.lang;
const { St, Clutter, Soup, GLib, Gdk, GnomeDesktop, Gio } = imports.gi;
const Main = imports.ui.main;
const Calendar = imports.ui.calendar;
const MessageList = imports.ui.messageList;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const ByteArray = imports.byteArray;

//文件夹权限
const PERMISSIONS_MODE = 0o744;

//设置信息
let settings;


//左边消息
var LunarCalendarMessage = GObject.registerClass(
  class LunarCalendarMessage extends MessageList.Message {

    canClear() { return false; }

    canClose() { return false; }

    _sync() {
      super._sync();
      this._closeButton.visible = this.canClear();
    }
  });


//右边消息
var LunarCalendarSection = GObject.registerClass(
  class LunarCalendarSection extends MessageList.MessageListSection {

    _init() {
      super._init('Lunar Calendar');

      this._title = new St.Button({
        style_class: 'events-section-title',
        label: '',
        x_align: Clutter.ActorAlign.START,
        can_focus: true
      });
      this.insert_child_below(this._title, null);
    }

    get allowed() {
      return true;
    }

    _reloadEvents() {
      this._reloading = true;

      this._list.destroy_all_children();

      let todayKey =
        String(this.localDateTime.get_year()) +
        String(this.localDateTime.get_month()) +
        String(this.localDateTime.get_day_of_month());

      let todayModel = this.lunarMap.get(todayKey);

      //显示节气
      this.addMessage(new LunarCalendarMessage("节气", todayModel.Term, false));

      //是否显示节假日
      if (this.settings.get_boolean("showholiday")) {
        this.addMessage(new LunarCalendarMessage("节日", todayModel.HolidayName, false));
      }

      //是否显示黄道吉日
      if (this.settings.get_boolean("show-avoidsuit")) {
        this.addMessage(new LunarCalendarMessage("宜", todayModel.Suit, false));
        this.addMessage(new LunarCalendarMessage("忌", todayModel.Avoid, false));
      }

      this._reloading = false;
      this._sync();
    }

    setDate(date) {
      // 3.38
      if (super.setDate) {
        super.setDate(date);
      }
      ld.setDateNoon(date);
      let cny = ld.strftime("%(shengxiao)");
      this._title.label = ld.strftime("%(NIAN)年%(YUE)月%(RI)日");
      this._reloadEvents();
    }

    _shouldShow() { return true; }

    _sync() {
      if (this._reloading)
        return;

      super._sync();
    }
  });


//农历日历
let lunarButton = function (orig_button, iter_date, oargs) {
  let fat_button = false;
  if (+oargs[0].label == +iter_date.getDate().toString()) {
    iter_date._lunar_iter_found = true;
    ld.setDate(iter_date);
    let yd = settings.get_boolean("show-calendar") ? ld.day_name : "";
    let jr = settings.get_boolean("jieri") ? ld.jieri : "";
    let dx = settings.get_string("zti-dx");
    fat_button = yd != "";
    let l = oargs[0].label;
    if (jr != null && jr != "") {
      l =
        "<span weight='bold' color='" +
        localSettings.jieri_color +
        "'>" +
        l +
        "</span>";
    }
    if (yd != "") {
      l += "\n<small>" + ld.getDateSting() + "</small>";
    }
    if (dx != "none") {
      l = "<span size='" + dx + "'>" + l + "</span>";
    }
    oargs[0].label = l;
  }
  let new_button = _make_new_with_args(orig_button, oargs);
  return new_button;
};

var LunarDate = new Lang.Class({
  Name: "LunarDate",
  _init: function () {
    this.isEnable = false;
    this.lunarMap = null;
    this.settings = null;
    this.settingChangeSignal = null;
    this.dataPath = "";
    this.localDateTime = GLib.DateTime.new_now_local();
    this.dateMenuControl = null;
    this.panelClockChangeSignal = null;
    //日历控件
    this.calendarControl = null;
  },
  enable: function () {
    this.isEnable = true;

    //读取配置文件
    if (this.settings == null) {
      this._initSetting();
    }


    if (this.dataPath == "") {
      this._initDataPath();
    }
    //获取当前日期的农历数据
    this._initLunarData(
      this.localDateTime.get_year(),
      this.localDateTime.get_month()
    );

    if (this.settingChangeSignal == null) {
      //绑定设置信息变化事件
      this.settingChangeSignal = this.settings.connect(
        "changed",
        Lang.bind(this, this._onSettingChanged)
      );
    }

    //初始化日期控件
    this.dateMenuControl = Main.panel.statusArea.dateMenu;
    this.calendarControl = this.dateMenuControl._calendar;

    log(
      "--------------------------------------------------------初始化日历日期" +
      this.calendarControl._monthLabel.text +
      this.calendarControl._dateLabel.text
    );
    this._initPanelLunarDate();

    //显示时钟面板农历
    if (this.panelClockChangeSignal == null) {
      this.panelClockChangeSignal = this.dateMenuControl._clock.connect(
        "notify::clock",
        Lang.bind(this, this._initPanelLunarDate)
      );
    }

  },
  disable: function () {
    this.isEnable = false;
    this._initPanelLunarDate();
    if (this.settingChangeSignal != null) {
      this.settings.disconnect(this.settingChangeSignal);
      this.settingChangeSignal = null;
    }
    if (this.panelClockChangeSignal != null) {
      this.dateMenuControl._clock.disconnect(this.panelClockChangeSignal);
      this.panelClockChangeSignal = null;
    }
    if (this.lunarMap != null) {
      this.lunarMap = null;
    }
    if (this.settings != null) {
      this.settings = null;
    }
    if (this.dateMenuControl != null) {
      this.dateMenuControl = null;
    }
  },
  _initSetting: function () {
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.another-lunar-calendar"
    );
  },
  _onSettingChanged: function () {
    if (this.lunarMap != null) {
      this._initPanelLunarDate();
    }
  },
  _initPanelLunarDate: function () {
    if (this.isEnable) {

      let todayKey =
        String(this.localDateTime.get_year()) +
        String(this.localDateTime.get_month()) +
        String(this.localDateTime.get_day_of_month());

      let todayModel = this.lunarMap.get(todayKey);



      //是否在面板显示农历
      if (this.settings.get_boolean("show-onpanel")) {
        let lunarString = " " + todayModel.LunarYear + "年" + todayModel.LunarMonth + "月" + todayModel.LunarDay;

        this.dateMenuControl._clockDisplay.text =
          this.dateMenuControl._clock.clock + lunarString;
      }
      //是否显示节假日
      if (this.settings.get_boolean("showholiday")) {

      }

      //是否显示农历
      if (this.settings.get_boolean("show-lunardate")) {

      }

      //是否显示工作日
      if (this.settings.get_boolean("show-workday")) {

      }

      //是否显示黄道吉日
      if (this.settings.get_boolean("show-avoidsuit")) {

      }

    } else {
      this.dateMenuControl._clockDisplay.text =
        this.dateMenuControl._clock.clock;
    }

  },
  _initCalendarLunarDate: function () { },
  _initDataPath: function () {
    if (this.isEnable) {
      let path = CurrentExtension.dir.get_child("data").get_path();
      //如果data文件夹不存在就自动创建
      if (GLib.mkdir_with_parents(path, PERMISSIONS_MODE) === 0) {
        this.dataPath = path;
      }
    }
  },
  //调用对应api获取数据,api:0百度,
  _getAPIData(api, year, month) {
    let encode = ""
    let url = "";

    if (api == 0) {
      encode = "GBK"
      url = "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=" +
        year +
        "年" +
        month +
        "月&resource_id=39043&format=json&tn=wisetpl";
    }

    return this._getHttpJson(url, encode);

  },
  //初始化农历数据
  _initLunarData: function (year, month) {
    if (this.isEnable) {

      this.lunarMap = new Map();

      let filePath = this.dataPath + "/" + year + "-" + month + ".json";

      try {
        let jsonData;
        //检查本地是否存在指定数据,不存在才获取网络数据
        let isExit = GLib.file_test(filePath, GLib.FileTest.EXISTS);
        if (isExit) {
          //读取本地文件
          jsonData = this._readLocalData(filePath);
        } else {
          //获取网络数据
          jsonData = this._getAPIData(0, year, month);
          //保存文件
          this._writeLocalData(filePath, jsonData);
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
            let key = model.Year + model.Month + model.Day;
            this.lunarMap.set(key, model);
          }
        });
      } catch (err) {
        logError(err, "获取农历数据异常");
      }
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
  _writeLocalData: function (filePath, contents) {
    try {
      GLib.file_set_contents(filePath, contents);
    } catch (err) {
      logError(err, "写入本地数据异常");
    }
  },
  _getHttpJson: function (url, encode) {
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
