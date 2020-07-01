const app = getApp();
const Http = require('../../utils/request.js');
Page({
  data: {
    tabIndex: 1,
    dataList: [],
    buttonUserInfo: false,
    storeList: []
  },

  onLoad: function () {
    const that = this;
    wx.login({
      success(res) {
        that.getLogin(res.code);
      }
    })
    this.getUser();
  },
  getUser() {
    let that = this;
    wx.getUserInfo({
      success(e) {
        app.userInfo = e.userInfo;

      }, fail(err) {
        that.setData({
          buttonUserInfo: true
        })
      }
    })
  },
  toQrcode() {
    wx.navigateTo({
      url: `./qrcode/qrcode?step=${this.data.tabIndex}`,
    })
  },
  getData(openId) {
    const that = this;
    Http.get('/activity/getMyActivityList', {
      openId
    }).then(res => {
      if (res.result == 1000) {
        res.data.map((item, index) => {
          item.isShow = true;
          this.getlocations(1,item.shop_id, index);
        })
        this.setData({
          dataList: res.data
        })
        this.getCountDown();
      }
      wx.hideLoading();

    })
  },

  getCountDown: function (endTime) {
    let list = JSON.parse(JSON.stringify(this.data.dataList));
    setInterval(() => {
      list.map((item,index) => {
        let surplus, d, h, m, s;
        surplus = parseInt((item.end_time - new Date().getTime()) / 1000);
        d = Math.floor(surplus / (24 * 60 * 60));
        h = Math.floor(surplus / (60 * 60) % 24);
        m = Math.floor(surplus / 60 % 60);
        s = surplus % 60;
        let countDown = {
          d: d >= 0 ? d : 0,
          h: h >= 0 ? h : 0,
          m: m >= 0 ? m : 0,
          s: s >= 0 ? s : 0
        }        
        const data = "dataList[" + index +"].countDown";
        const isShow = "dataList[" + index + "].isShow"
        this.setData({
          [data]: countDown,
          [isShow]: countDown.d == 0 && countDown.h == 0 && countDown.m == 0 && countDown.s == 0 ? true : false
        })
      })
   
    },1000)
  },


  getLogin(code) {
    Http.get('/activity/getLoginAuthorization', {
      code
    }).then(res => {
      if (res.result == 1000) {
        app.openId = res.data;
        this.getData(res.data);
        this.getStoreList(res.data);
      }
      wx.hideLoading();

    }).catch((err) => {
      console.log(err);
    });
  },
  toDetail(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../drainage/index/index?id=${ id }`,
    })
  },
  getlocations(type,shopId,index) {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
        that.getDistance(type,res.latitude, res.longitude, shopId, index);
      },
      fail: function (res) {
        console.log(res);
      }
    })
  },
  getDistance(type,latitude, longitude, shopId, index) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    Http.get('/shop/distance', {
      shopId,
      latitude,
      longitude
    }).then(res => {
      if (res.result == 1000) {
        const data = type == 1 ? "dataList[" + index + "].distance" : "storeList[" + index + "].distance";
        this.setData({
          [data] : parseInt(res.data)
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
  shareGetUserInfo(e){
    app.userInfo.nickName = e.detail.userInfo.nickName;
    app.userInfo.avatarUrl = e.detail.userInfo.avatarUrl;
    this.setData({
      buttonUserInfo: false
    })
  },
  onShareAppMessage(e) {
    const that = this;
    return {
      title: '云分店卡券',
      path: `/pages/drainage/index/index?id=${e.target.dataset.id}&openId=${app.openId}&nickName=${app.userInfo.nickName}&headImg=${app.userInfo.avatarUrl}`,
      imageUrl: 'https://ylbb-wxapp.oss-cn-beijing.aliyuncs.com/branch-store/hbfxtopbg.png'
    }
  },
  toDetail(e){
    app.userInfo.nickName = e.detail.userInfo.nickName;
    app.userInfo.avatarUrl = e.detail.userInfo.avatarUrl;
    console.log(e);
    wx.navigateTo({
      url: `../drainage/index/index?id=${e.target.dataset.id}&openId=${app.openId}&nickName=${app.userInfo.nickName}&headImg=${app.userInfo.avatarUrl}`,
    })
  },
  toStore(e){
    console.log(e);
    const id = e.currentTarget.dataset.activity_id;
    wx.navigateTo({
      url: `../shop-index/shop-index?id=${ id }`,
    })
  },
  getStoreList(openId){
    Http.get('/activity/getMyShopList', {
      openId
    }).then(res => {
      if (res.result == 1000) {
        res.data.map((item,index)=>{
          this.getlocations(2, item.shop_id, index);
        })
          this.setData({
            storeList :res.data
          })
      }
      wx.hideLoading();

    }).catch((err) => {
      console.log(err);
    });
  },
  toStoreIndex(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/shop-index/shop-index?id=${id }`,
    })
  }
})
