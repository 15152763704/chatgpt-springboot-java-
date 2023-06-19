var app = getApp()
Page({
    data: {

      hyList:[],

      choosedHyType: 0,//index 索引
    },
    onLoad: function () {
      this.initHyList()

    },

    // 会员类型点击切换
    chooseType(e){
      console.log(e.currentTarget.dataset)
      this.setData({

        choosedHyType:e.currentTarget.dataset.index
      })
    },
    // 初始化加载会员列表
    initHyList(){
      let that = this 
      wx.request({
        url: app.globalData.ip +'/chatHy/findHyList',
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        method:'get',
        success:function(res){
          that.setData({
            hyList:res.data.data
          })
        }
      })

    },

   /**
   * 立即支付
   * @param {点击事件参数} e 
   */
  goPay(e){
    let that = this 
    let item = this.data.hyList[this.data.choosedHyType];
    wx.request({
      url: app.globalData.ip +'/WxPayController/beforePay',
      data:{
        id:item.id
      },
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      method:'get',
      success:function(res){
        console.log(res)
        wx.requestPayment({
          timeStamp: res.data.data.timeStamp,
          nonceStr: res.data.data.nonceStr,
          package: res.data.data.packageValue,
          signType: 'MD5',
          paySign: res.data.data.paySign,
          success(sucres) { // 付款成功
            console.log(sucres)
          },
          fail(failres) { // 取消付款，付款失败 
            console.log(failres)
          }
        })
      }
    })
  },
})
