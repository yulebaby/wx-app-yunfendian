const app = getApp();
const Http = require('../../../utils/request.js');
const back = wx.getBackgroundAudioManager();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    activityDetail: {},
    shopDetail: {},
    playMusic: true,
    buttonUserInfo: false,
    listName: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'],
    payStatus: false,
    joinRecord: [],
    joinCount: 0,
    shopBaseInfo: {},
    countDown: {},
    music: {},
    friendsList: [],
    ruleStatus: false,
    purchaseShow: false,
    headImg: null,
    nofromText: null,
    isformText: false,
    latitude: null,
    longitude: null,
    endActivity: false,
    endStatus: -1,
    loadingBtn: false,
    islocationLimit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getlocations();
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
        // console.log(res.code);
        // return false;
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
        if (res.data.activity.musicId){
          that.getMusic(res.data.activity.musicId);
        }
        res.data.activity.startTime = that.format(res.data.activity.startTime);
        res.data.activity.endTime = that.format(res.data.activity.endTime);
        res.data.activity.activityImgs = res.data.activity.activityImgs.split(',');
        let otherContent = JSON.parse(res.data.activity.otherContent);
        that.setData({
          otherContent,
          activityDetail: res.data.activity,
          shopBaseInfo: res.data.shopBaseInfo
        })
        let endTime = new Date(res.data.activity.endTime.replace(/-/g, '/') + ' 23:59:59').getTime();
        const shopBaseInfo = res.data.shopBaseInfo;
        app.shopDetail = res.data.shopBaseInfo;

        const nowDate = new Date().getTime();

        const expireDate = (res && shopBaseInfo.expireDate && new Date(shopBaseInfo.expireDate).getTime()) || null;
        if (!expireDate || (nowDate > expireDate)) {
          let countDown = {
            d:  0,
            h: 0,
            m:  0,
            s: 0
          }
          this.setData({
            countDown,
            endActivity:true,
            endStatus : 1
          })
        } else if ((nowDate > endTime) || res.data.activity.runningStatus == 1){
          let countDown = {
            d: 0,
            h: 0,
            m: 0,
            s: 0
          }
          this.setData({
            countDown,
            endActivity: true,
            endStatus: 2
          })
        }else{  
          that.getCountDown(endTime);
        }

        if (this.data.latitude) {
          that.getDistance(that.data.latitude, that.data.longitude);
        }
        this.setData({
          loadingBtn: true
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
  getShopInfo(id){
    return new Promise((resolve,reject)=>{
      Http.get(`/activity/shop/${id }`, {
      }).then(res => {
        resolve(res.data);
      })
    })
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
  bindGetUserInfo(e) {
    app.userInfo.nickName = e.detail.userInfo.nickName;
    app.userInfo.headImg = e.detail.userInfo.avatarUrl;
    let that = this;
    if (e.detail) {
      wx.login({
        success(res) {
          Http.post('/account/sign', {
            code: res.code,
            paramJson: JSON.stringify({
              nickName: app.userInfo.nickName,
              headImg: app.userInfo.headImg
            })
          }).then(res => {
            that.setData({
              buttonUserInfo: false
            })
            that.getJoinRecord();
            if (app.openId) {
              that.authorization();
            }
            wx.hideLoading();

          })
        }
      })
    }
  },
  getLogin(code) {
    let that = this;
    Http.get('/activity/getLoginAuthorization', {
      code
    }).then(res => {
      if (res.result == 1000) {
        app.openId = res.data;
        that.getFriends(res.data);
        if (that.data.userInfo.nickName){
          that.authorization();
        }
        
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
          item.entryTime = item.entryTime.replace(/-/g,'.');
        })
        that.setData({
          friendsList: res.data
        })
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
        if (that.data.shopBaseInfo.id){
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
        if (that.activityDetail.locationLimit == 1 && distance > 15000){
          that.setData({
            islocationLimit: true
          })
        }
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
  ruleHide(){
    this.setData({
      ruleStatus: false
    })
  },
  ruleShow() {
    this.setData({
      ruleStatus: true
    })
  },
  editinput(e){
    let val = e.detail.value;
    let index = e.currentTarget.dataset.index;
    let list = this.data.otherContent.list;
    list[index].value = val;
    this.setData({
      'otherContent.list': list
    })
  },
  bindDate(e){
    let val = e.detail.value;
    let index = e.currentTarget.dataset.index;
    let list = this.data.otherContent.list;
    list[index].value = val;
    this.setData({
      'otherContent.list': list
    })
  },
  closePurchase(){
    this.setData({
      purchaseShow: false
    })
  },
  showInputs(e){
    if (this.data.payStatus){
      wx.showModal({
        title: '温馨提示',
        content: '您已经购买过了，不能重复购买哦~',
        showCancel: false
      })
    }else{
      this.setData({
        purchaseShow: true
      })   
    }

  },
  ifForm(name){
    this.setData({
      isformText : true,
      nofromText: `${ name }不能为空`
    })
    return false;
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
  purchaseSubmit(){
    let otherContent = this.data.otherContent;
    let len = 0;
    let phone = null
    otherContent.list.map(item=>{
      if(!item.value){
        this.ifForm(item.name);
      }else{
        len++;
      }
      if(item.name == '手机号'){
        phone = item.value;
      }
    })
    if (otherContent.list.length != len){
      return false;
    }else{
      this.setData({
        isformText: false,
      })
    }
    let that = this;
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    Http.get('/activityPublic/rebate/getPayUrl', {
      openId: app.openId,
      activityId: this.data.id,
      phoneNum: phone,
      otherContent: JSON.stringify(this.data.otherContent)
    }).then(res => {
      if (res.result == 1000) {
        let data = JSON.parse(res.data);
        wx.requestPayment({
          'timeStamp': data.timeStamp + '',
          'nonceStr': data.nonceStr,
          'package': data.packages,
          'signType': 'MD5',
          'paySign': data.paySign,
          'success': function (res) {
            //that.submitUserInfo();
            that.setData({
              payStatus: true,
              purchaseShow: false
            })
            wx.requestSubscribeMessage({
              tmplIds: ['dwRlqFPYBrn7WLC0A8yEZjIxtiMSP8vqPkjjTuv4wVM'],
              success(res) {
                
              }
            })
            
   
          },fail:function(res){
          }
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
  submitUserInfo(){
    let that = this;
    let babyName, phoneNum, nickName;
    this.data.otherContent.list.map(item=>{
      if(item.name == '姓名'){
        babyName = item.value;
      }
      if (item.name == '手机号'){
        phoneNum = item.value;
      }
    })
    Http.get('/activity/submitUserInfo', {
      paramJson: JSON.stringify({
        activityId: this.data.id,
        openId: app.openId,
        babyName,
        phoneNum, 
        nickName,
        otherContent: JSON.stringify(this.data.otherContent),
        sharerOpenId: that.data.shareOpenId || null
      })
    }).then(res => {
      that.purchaseSubmit();
    });
  },
  authorization(userInfo) {
    let that = this;
    userInfo = this.data.userInfo;
    Http.get('/activityPublic/rebate/authorization', {
      paramJson: JSON.stringify({
        activityId: this.data.id,
        openId: app.openId,
        headImg: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        productName: that.data.activityDetail.productName,
        sharerOpenId: that.data.shareOpenId || null
      })
    }).then(res => {
      if (res.result == 1000) {
        if (res.data.payStatus){
  
          that.setData({
            payStatus: true
          })
            
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
  toggleMusic() {
    if (this.data.playMusic) {
      back.pause();
      this.setData({
        playMusic: false
      })
    } else {
      back.play();
      this.setData({
        playMusic: true
      })
    }
    },
  toStoreList(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/shop-index/shop-index?id=${id}`,
    })
  },
  /** 我要制作 **/
  toStoreDeit(){
    let path = '/pages/index/index';
    wx.navigateToMiniProgram({
      appId: 'wxcd43d6c8aa6558c2', // 要跳转的小程序的appid
      path: path, // 跳转的目标页面
      envVersion: app.envVersion,
      extarData: {
        open: 'auth'
      },
      success(res) {
        // 打开成功  
      }
    })
  },
  // 拨打电话
  makePhone () {
    wx.makePhoneCall({
      phoneNumber: this.data.shopBaseInfo.shopPhone,
    })
  }
})