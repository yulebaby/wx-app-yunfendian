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
    let that = this;
      this.setData({
        id: options.id
      });
    this.getData();
      },
  getDistance(latitude, longitude) {
    let that = this;
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
        that.setData({
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
    let that = this;
    Http.get('/activity/getActivityListByStoreId', {
      paramJson: JSON.stringify({
        storeId: this.data.shopDetail.id
      })
    }).then(res => {
      if (res.result == 1000) {
        that.setData({
          activityList: res.data.list
        })
      }
    });
  },
  toClistindex(e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    
    let path = `/pages/drainage/index/index?id=${id}&openId=${app.openId}&nickName=${e.detail.userInfo.nickName}&headImg=${e.detail.userInfo.avatarUrl}`;
    wx.navigateTo({
      url: path,
    })
  },
  getData() {
    let that = this;
    Http.get('/activity/showActivityDetail', {
      activityId: this.data.id
    }).then(res => {
      if (res.result == 1000) {
          that.setData({
            shopDetail: res.data.shopBaseInfo
          })
          console.log();
        that.getActivityList();
        wx.getLocation({
          type: 'wgs84',
          success: function (res) {
            that.getDistance(res.latitude, res.longitude);
          }
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