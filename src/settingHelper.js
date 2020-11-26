/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:another-lunar-calendar@kerojiang.com
 * 文件名称:configHelper.js
 * 修改日期:2020/11/26 15:51:04
 * 作者:kerojiang
 */

const Gio = imports.gi.Gio;
const PathExtension = imports.misc.extensionUtils.getCurrentExtension();

//读取配置信息
function getSettings() {
  let GioSSS = Gio.SettingsSchemaSource;
  let schemaSource = GioSSS.new_from_directory(
    Me.dir.get_child("schemas").get_path(),
    GioSSS.get_default(),
    false
  );
  let schemaObj = schemaSource.lookup(
    "org.gnome.shell.extensions.config",
    true
  );
  if (!schemaObj) {
    throw new Error("cannot find schemas");
  }
  return new Gio.Settings({ settings_schema: schemaObj });
}
