const app = getApp();
const Http = require('../../../utils/request.js');
const getUserInfo = require('../../../utils/getUserInfo.js');

const back = wx.getBackgroundAudioManager();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    activityDetail: {},
    shopDetail: {},
    buttonUserInfo: false,
    listName: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'],
    playMusic: true,
    joinRecord: [],
    joinCount: 0,
    shopBaseInfo: {},
    countDown: {},
    music: {},
    friendsList: [],
    ruleStatus: false,
    purchaseShow: false,
    userInfo: {},
    prizeMax: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.id) {
      this.setData({
        id: options.id,
        headImg: options.headImg,
        nickName: options.nickName,
        shareOpenId: options.openId
      })
      this.getData();
      this.getJoinRecord();
    }
    this.setData({
      shopDetail: app.shopDetail
    })

    let that = this;

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

        that.setData({
          userInfo: e.userInfo
        })
        that.authorization(e.userInfo);
      }, fail(err) {
        that.setData({
          buttonUserInfo: true
        })
      }
    })
  },
  getData() {
    let that = this;
    Http.get('/activity/showActivityDetail', {
      activityId: this.data.id
    }).then(res => {
      if (res.result == 1000) {
        if (res.data.activity.musicId) {
          that.getMusic(res.data.activity.musicId);
        }
        app.shopDetail = res.data.shopBaseInfo;
        res.data.activity.startTime = that.format(res.data.activity.startTime);
        res.data.activity.endTime = that.format(res.data.activity.endTime);
        res.data.activity.activityImgs = res.data.activity.activityImgs.split(',');
        let otherContent = JSON.parse(res.data.activity.otherContent);
        let prizeArr = [];
        if (res.data.activity.activityPrizes){
          res.data.activity.activityPrizes.map(item=>{
            prizeArr.push(item.prizeValue);   
          })
          
        }
        that.setData({
          otherContent,
          prizeMax: Math.max(...prizeArr),
          activityDetail: res.data.activity,
          shopBaseInfo: res.data.shopBaseInfo
        })
        let endTime = new Date(res.data.activity.endTime.replace(/-/g, '/') + ' 23:59:59').getTime();
        that.getCountDown(endTime);
        this.getlocations();
        if (this.data.latitude) {
          that.getDistance(that.data.latitude, that.data.longitude);
        }
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
  getCountDown: function (endTime) {
    var surplus = parseInt((endTime - new Date().getTime()) / 1000);
    var d = Math.floor(surplus / (24 * 60 * 60)),
      h = Math.floor(surplus / (60 * 60) % 24),
      m = Math.floor(surplus / 60 % 60),
      s = surplus % 60;
    let countDown = {
      d: d >= 0 ? d : 0,
      h: h >= 0 ? h : 0,
      m: m >= 0 ? m : 0,
      s: s >= 0 ? s : 0
    }
    this.setData({
      countDown
    })
    s >= 0 && setTimeout(this.getCountDown, 1000, endTime);
  },
  addtime(m) { return m < 10 ? '0' + m : m },
  format(shijianchuo) {
    //shijianchuo是整数，否则要parseInt转换
    var time = new Date(shijianchuo);
    var y = time.getFullYear();
    var m = time.getMonth() + 1;
    var d = time.getDate();
    var h = time.getHours();
    var mm = time.getMinutes();
    var s = time.getSeconds();
    return y + '.' + this.addtime(m) + '.' + this.addtime(d);
  },
  getMusic(id) {
    let that = this;
    Http.get('/activity/getMusic', {
      id
    }).then(res => {
      if (res.result == 1000) {
        let data = JSON.parse(res.data);
        that.setData({
          music: data
        })
        that.backmusic();
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
  onUnload() {
    wx.stopBackgroundAudio();
  },
  bindGetUserInfo(e) {
    app.userInfo.nickName = e.detail.userInfo.nickName;
    app.userInfo.headImg = e.detail.userInfo.avatarUrl;

    this.setData({
      buttonUserInfo: false,
      userInfo: e.detail.userInfo
    })
    this.getJoinRecord();
    this.authorization(e.detail.userInfo);

  },
  getLogin(code) {
    let that = this;
    Http.get('/activity/getLoginAuthorization', {
      code
    }).then(res => {
      if (res.result == 1000) {
        app.openId = res.data;
        that.getFriends(res.data);
      }
      wx.hideLoading();

    });
  },
  getJoinRecord() {
    let that = this;
    Http.post('/activityPublic/rebate/getJoinRecord', {
      paramJson: JSON.stringify({ "activityId": this.data.id }),
      pageNum: 1000
    }).then(res => {
      if (res.result == 1000) {
        that.setData({
          joinRecord: res.data.joinRecord,
          joinCount: res.data.joinCount
        })
      }
      wx.hideLoading();

    })
  },
  getFriends(openId) {
    let that = this;
    Http.post('/activity/getFriends', {
      openId,
      activityId: this.data.id
    }).then(res => {
      if (res.result == 1000) {
        res.data.map(item => {
          item.entryTime = that.format(item.entryTime);
        })
        that.setData({
          friendsList: res.data
        })
        console.log(that.data.friendsList);
      }
      wx.hideLoading();

    })
  },
  getlocations() {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
        if (that.data.shopBaseInfo.id) {
          that.getDistance(res.latitude, res.longitude);
        }
      },
      fail: function (res) {
        console.log(res);
      }
    })
  },
  getDistance(latitude, longitude) {
    let that = this;
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    Http.get('/shop/distance', {
      shopId: this.data.shopBaseInfo.id,
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
  ruleHide() {
    this.setData({
      ruleStatus: false
    })
  },
  ruleShow() {
    this.setData({
      ruleStatus: true
    })
  },
  editinput(e) {
    let val = e.detail.value;
    let index = e.currentTarget.dataset.index;
    let list = this.data.otherContent.list;
    list[index].value = val;
    this.setData({
      'otherContent.list': list
    })
  },
  bindDate(e) {
    let val = e.detail.value;
    let index = e.currentTarget.dataset.index;
    let list = this.data.otherContent.list;
    list[index].value = val;
    this.setData({
      'otherContent.list': list
    })
  },
  closePurchase() {
    this.setData({
      purchaseShow: false
    })
  },
  showInputs() {
    this.setData({
      purchaseShow: true
    })
  },



  /******** 分享好友 *********/

  onShareAppMessage() {

    let that = this;
    return {
      title: '云分店卡券',
      path: `/pages/drainage/index/index?id=${that.data.id}&openId=${app.openId}&nickName=${that.data.userInfo.nickName}&headImg=${that.data.userInfo.avatarUrl}`,
      imageUrl: 'https://ylbb-wxapp.oss-cn-beijing.aliyuncs.com/branch-store/hbfxtopbg.png'
    }
  },
  backmusic: function () {
    let that = this;
    player();
    function player() {
      back.title = that.data.music.name;
      back.src = that.data.music.url;
      back.onEnded(() => {
        player();
      })
    }
  },
  toggleMusic(){
    if (this.data.playMusic){
      back.pause();
      this.setData({
        playMusic: false
      })
    }else{
      back.play();
      this.setData({
        playMusic: true
      })     
    }
  },
  authorization(userInfo){
    let that = this;
    Http.get('/activityPublic/rebate/authorization', {
      paramJson: JSON.stringify({
        activityId: this.data.id,
        openId: app.openId,
        headImg: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        sharerOpenId: that.data.shareOpenId || null
      })
    }).then(res => {
      if (res.result == 1000) {


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
  toStore(){
    wx.navigateTo({
      url: '/pages/shop-index/shop-index',
    })
  }


})