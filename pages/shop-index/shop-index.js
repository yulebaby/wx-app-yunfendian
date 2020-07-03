const app = getApp();
const Http = require('../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    latitude: null,
    longitude: null,
    distance: 0,
    activityList: [],
    showPage: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.setData({
        id: options.id
      });
    this.getData();
      },
  getDistance(latitude, longitude) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    Http.get('/shop/distance', {
      shopId: this.data.shopDetail.id,
      latitude,
      longitude
    }).then(res => {
      if (res.result == 1000) {
        this.setData({
          distance: parseInt(res.data)
        })
        wx.hideLoading();
      } else {
        wx.showModal({
          title: '温馨提示',
          showCancel: false,
          content: res.message,
        })
        wx.hideLoading();
      }
    });
  },
  getActivityList() {
    Http.get('/activity/getActivityListByStoreId', {
      paramJson: JSON.stringify({
        storeId: this.data.shopDetail.id
      })
    }).then(res => {
      if (res.result == 1000) {
        this.setData({
          activityList: res.data.list
        })
      }
    });
  },
  toClistindex(e) {
    let id = e.currentTarget.dataset.id;
    
    let path = `/pages/drainage/index/index?id=${id}&openId=${app.openId}&nickName=${e.detail.userInfo.nickName}&headImg=${e.detail.userInfo.avatarUrl}`;
    wx.navigateTo({
      url: path,
    })
  },
  getData() {
    Http.get('/activity/shop', {
      id: this.data.id
    }).then(res => {
      if (res.result == 1000) {
        res.data.shopImgList = res.data.shopImg.split(',');
          this.setData({
            shopDetail: res.data
          })
        this.getActivityList();
        wx.getLocation({
          type: 'wgs84',
          success:(res=>{
            this.getDistance(res.latitude, res.longitude);
          })
        })
      } else {
        wx.showModal({
          title: '温馨提示',
          showCancel: false,
          content: res.message,
        })
        wx.hideLoading();
      }
    });
  },
  /* 显示添加二维码弹窗  */
  showWx() {
    this.setData({
      showPage: true
    })
  },
  /* 隐藏添加二维码弹窗  */
  hidePage() {
    this.setData({
      showPage: false
    })
  },
  downloadImg: function (e) {　　　　　　　　　　　　　　　　 //触发函数
    wx.downloadFile({
      url: e.currentTarget.dataset.url,
      //需要下载的图片url
      success: function (res) {　　　　　　　　　　　　 //成功后的回调函数
        wx.saveImageToPhotosAlbum({　　　　　　　　　 //保存到本地
          filePath: res.tempFilePath,
          success(res) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function (err) {
            console.log(err);
            if (err.errMsg == "saveImageToPhotosAlbum:fail auth deny") {
              wx.openSetting({
                success(settingdata) {
                  if (settingdata.authSetting['scope.writePhotosAlbum']) {
                    wx.showToast({
                      title: '授权成功，请重新点击保存二维码',
                    })
                  } else {
                    wx.showToast({
                      title: '授权失败，请重新设置',
                      icon: 'none'
                    })
                  }
                }, fail(err) {
                  console.log(err);
                }
              })
            }
          }
        })
      }
    });
  },
  /* 复制客服微信 */
  copy: function (e) {
    var code = e.currentTarget.dataset.copy;
    wx.setClipboardData({
      data: code,
      success: function (res) {
        wx.showToast({
          title: '复制成功',
        });
      },
      fail: function (res) {
        wx.showToast({
          title: '复制失败',
        });
      }
    })
  },
  toTel() {
    wx.makePhoneCall({
      phoneNumber: app.shopDetail.shopPhone,
    })
  },
})