/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:1.js
 * 修改日期:2020/11/27 17:58:25
 * 作者:kerojiang
 */

const Me = imports.misc.extensionUtils.getCurrentExtension();
const LunarDate = Me.imports.lunarDate.LunarDate;

let lunarDateControl = null;

//初始化插件
function init() {
  try {
    lunarDateControl = new LunarDate();
  } catch (err) {
    logError(err, "初始化插件异常");
  }
}

//启动插件
function enable() {
  try {
    lunarDateControl.enable();
  } catch (err) {
    logError(err, "启用插件异常");
  }
}

//结束插件
function disable() {
  try {
    lunarDateControl.disable();
  } catch (err) {
    logError(err, "禁用插件异常");
  }
}
