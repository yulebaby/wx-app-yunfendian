//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    tabIndex: 1,
    dataList: [1,2,3,4,5,6,7,8,9,0]
  },

  onLoad: function () {


  },
  switchTab(e){
    const index = e.currentTarget.dataset.index;
    this.setData({
      tabIndex: index
    })
  },
  toQrcode(){
    console.log(this.data.tabIndex);
    wx.navigateTo({
      url: `./qrcode/qrcode?step=${ this.data.tabIndex }`,
    })
  }
})
