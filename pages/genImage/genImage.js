var app = getApp()
// pages/genImage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    array: ['256x256', '512x512', '1024x1024'],
    index:0,

    numArry:[1,2,3,4,5,6,7,8,9,10],
    numIndex:0,


    prompt:'',//图片描述

    imageList:[],//图片列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },


  bindPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value
    })
  },
  bindNumChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      numIndex: e.detail.value
    })
  },

  //自定义类型 文本输入框 变化事件
  customerType(e){
    this.setData({
      prompt:e.detail.value,
    })
  },

  goGenImage(){
    if(!this.data.prompt){
      wx.showToast({
        title: '请输入图片描述',
        icon:'none',
      })
      return 
    }
    // 校验剩余回答次数是否足够
    if(!app.checkLeftAnswerTime())return false
    let that = this 
    wx.showLoading({
      title: '图片生成中...',
    })
    wx.request({
      url: app.globalData.ip+'/v1/images/generations',
      method: "post",
      data:{
        prompt:that.data.prompt,
        size: that.data.array[that.data.index],
        n:that.data.numArry[that.data.numIndex]
      },
      header:{
        'Authorization': 'Bearer '+app.globalData.token,
        'apikey':'null',
      },
      success: function(resData) {
        that.data.imageList = []
        console.log(resData.data.data)
        for(var i = 0 ; i < resData.data.data.length ; i++ ){
          that.data.imageList.push(resData.data.data[i].url)
        }
        that.setData({
          imageList:that.data.imageList
        })
        wx.hideLoading()
      },
    })
  },

  preview(e){
    let src = e.currentTarget.dataset.src
    wx.previewImage({
      showmenu:true,
      current: src, // 当前显示图片的http链接
      urls: this.data.imageList // 需要预览的图片http链接列表
    })
  }
})