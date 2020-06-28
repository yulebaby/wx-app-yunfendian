const Http = require('./request.js');
const app = getApp();
export const getLogin = ()=>{
  wx.login({
    success(res) {
  Http.get('/activity/getLoginAuthorization', {
    code: res.code
  }).then(res => {
    if (res.result == 1000) {
      app.openId = res.data;
      return res.data
    }
  });
    }
    })
}