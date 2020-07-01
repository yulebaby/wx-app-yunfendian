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
    activityList: []
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

})