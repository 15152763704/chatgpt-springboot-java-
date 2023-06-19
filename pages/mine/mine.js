var app = getApp()
Page({
    data: {
        userInfo: {},
        zcTime:'',//注册时间
        canUseTime:0,
    },
    goPage:function(event){
        console.log(event.currentTarget.dataset.log);
        wx.navigateTo({
            url: event.currentTarget.dataset.url
        })
    },
    onLoad: function () {
        // wx.showNavigationBarLoading();
        //that.initzcTime(app.globalData.userInfo.createTime)
        console.log(app.globalData)
    },
    onShow: function(){
      //调用应用实例的方法获取全局数据
      this.setData({
        userInfo:app.globalData.userInfo,
        canUseTime: app.globalData.userInfo.canUseAnswer 
      })
    },
    initzcTime:function(val){
      let oDate = new Date(val)
      let oYear = oDate.getFullYear(),
      oMonth = oDate.getMonth() + 1,
      oDay = oDate.getDate();
      this.setData({
        zcTime:oYear+'-'+oMonth+'-'+oDay
      })
    },

  goHyPage(){
    wx.navigateTo({
      url: '/pages/hy/hy',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function(data) {
          console.log(data)
        },
        someEvent: function(data) {
          console.log(data)
        }
      },
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: 'test' })
      }
    })
  }



})
