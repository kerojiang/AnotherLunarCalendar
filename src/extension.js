const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const Path = imports.misc.extensionUtils.getCurrentExtension();
const SettingHelper = Path.imports.settingHelper;

let panelButton;

//配置信息
let settings;

function init() {
  // Create a Button with "Hello World" text
  panelButton = new St.Bin({
    style_class: "panel-button",
  });
  let panelButtonText = new St.Label({
    text: "kero jiang",
    y_align: Clutter.ActorAlign.CENTER,
  });
  panelButton.set_child(panelButtonText);

  let folderPath = Path.dir.get_child("data").get_path();
  print(folderPath);
}

function enable() {
  //读取配置文件
  settings = SettingHelper.getSettings();

  // Add the button to the panel
  Main.panel._rightBox.insert_child_at_index(panelButton, 0);

  log("初始化插件");
}

function disable() {
  // Remove the added button from panel
  Main.panel._rightBox.remove_child(panelButton);
  log("取消初始化插件");
}
