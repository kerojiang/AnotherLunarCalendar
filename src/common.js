/*
 * Copyright (c)  2020  All Rights Reserved
 * 项目名称:AnotherLunarCalendar
 * 文件名称:common.js
 * 修改日期:2020/11/30 17:16:07
 * 作者:kerojiang
 */

/**
 * 获取http数据异步方法
 * @param url 请求地址
 *@param callbackFunc 获取数据后的回调方法
 */
function _beginHttpAsync(url, callbackFunc) {
  let session = Soup.Session.new();
  //session.use_thread_context = false;
  let message = Soup.Message.new("GET", url);

  try {
    // session.async_context = callbackFunc;
    session.send_async(message, null, _endHttpAsync);
  } catch (err) {
    logError(err, "请求网络数据异常");
  }
}

//获取http数据异步方法
/**
 * 获取http数据异步方法
 * @param self 上一步本体
 *@param res 请求结果
 */
function _endHttpAsync(self, res) {
  try {
    let dataStream = self.send_finish(res);
    let [ok, data] = dataStream.read(null);
    if (ok) {
      let result = ByteArray.toString(ByteArray.fromGBytes(data), "GBK");

      log(result);
      // self.async_context(result);
    }
  } catch (err) {
    logError(err, "接收网络数据异常");
  }
}
