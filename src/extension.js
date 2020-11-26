const { St, Clutter, Soup, GLib } = imports.gi;
const Main = imports.ui.main;
const Path = imports.misc.extensionUtils.getCurrentExtension();
const SettingHelper = Path.imports.settingHelper;

let panelButton;

//配置信息
let settings;

//网络session
let webSession;

//初始化插件
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

//启动插件
function enable() {
  //读取配置文件
  settings = SettingHelper.getSettings();

  // Add the button to the panel
  Main.panel._rightBox.insert_child_at_index(panelButton, 0);

  log("初始化插件");
}

//结束插件
function disable() {
  // Remove the added button from panel
  Main.panel._rightBox.remove_child(panelButton);
  log("取消初始化插件");
}


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

  }
}


//写入本地数据
function _writeLocalData(cdata) {
  var jsonPath = "";
  try {
    let contents = JSON.stringify(cdata, null, "\t");
    GLib.file_set_contents(jsonPath, contents);
  } catch (err) {

  }

}

//获取农历数据
function _getLunarData(year, month) {
  var url = "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=" + year + "年" + month + "月&resource_id=39043&format=json&tn=wisetpl";

  if (!webSession) {
    webSession = Soup.Session.new();
    webSession.set_property(Soup.SESSION_USER_AGENT, "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36");
  }
  try {
    let message = Soup.Message.new('GET', url);
    let status_code = webSession.send_message(message);
    if (status_code == Soup.Status.OK) {

      log(message.response_body.data);
      let dataObj = JSON.parse(message.response_body.data);


    }
  } catch (error) {

  }

}