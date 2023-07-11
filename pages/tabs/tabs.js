var app = getApp()
Page({
  data: {
    tabs: [],
    activeTab: 0,

    ip:app.globalData.ip


  },

  onLoad() {
    const titles = ['全部', '生活', '工作', '学习']
    const tabs = titles.map(item => ({title: item,description:"人人都能写小说"}))
    this.setData({tabs})


    this.initData()
  },

  onTabCLick(e) {
    const index = e.detail.index
    this.setData({activeTab: index})
  },

  onChange(e) {
    const index = e.detail.index
    this.setData({activeTab: index})
  },

  goXiaoshuo(e){
    if(e.currentTarget.dataset.writetype == "1"){
      wx.navigateTo({
        url: "/pages/tabXiaoshuo/tabXiaoshuo?id=" + e.currentTarget.dataset.id  + '&title=' + e.currentTarget.dataset.fun
      })
    }else{
      wx.navigateTo({
        url: "/pages/messageTemplate/messageTemplate?id=" + e.currentTarget.dataset.id  + '&title=' + e.currentTarget.dataset.fun
      })
    }
  },

  //初始化页面数据
  initData(){
    let that = this 
    if(app.globalData.bbxData){
      that.setData({
        tabs:app.globalData.bbxData
      })
    }else{
      wx.request({
        url: app.globalData.ip+'/chatFunction/findList',
        method: "GET",
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        success: function(res) {
          that.setData({
            tabs:res.data.data
          })
        },
      })
    }
  },

})
