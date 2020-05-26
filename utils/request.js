 /**
 * @Services Http请求
 *
 * @export get/post <function>
 * 
 * @param url: string 请求地址
 * @param param: object 请求参数
 * @return Promise
 * 
 */
const App = getApp();
const Domain = App.domain;
const getUserInfo = require('./getUserInfo.js');

const Get = (url, param) => {
  return new Promise((resolve, reject) => {
    let requestPath = url.substr(0, 4) === 'http' ? url : `${Domain}${url}`;
    wx.request({
      url: requestPath,
      method: 'GET',
      data: param,
      dataType: 'json',
      header: {
        'token': App.token
      },
      success(res) {
  
          resolve(res.data);

      },
      fail(err) {
        reject(err);
      }
    });
  });
}

const Post = (url, param) => {
  return new Promise((resolve, reject) => {
    let requestPath = url.substr(0, 4) === 'http' ? url : `${Domain}${url}`;
    wx.request({
      url: requestPath,
      method: "POST",
      data: param,
      dataType: 'json',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'token': App.token
      },
      success(res) {
        if (res.data.result == 7777) {
          getUserInfo().then(userInfo);
          wx.showToast({
            title: '登录过期，请重新操作',
            icon: 'none'
          })
          setTimeout(res=>{
            // wx.redirectTo({
            //   url: '/pages/index/index',
            // })
          },1500);
 
        } else {
          resolve(res.data);
        }
      },
      fail(err) {
        reject(err);
      }
    })
  })
}

const Serialize = (data) => {
  var val = "",
    str = "";
  for (var v in data) {
    str = v + "=" + data[v];
    val += str + '&';
  }
  return val.slice(0, val.length - 1);
}


module.exports = {
  get: Get,
  post: Post
}