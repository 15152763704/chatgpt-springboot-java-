//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this

    try {
      var valueList = wx.batchGetStorageSync(['user','token'])
      console.log(valueList)
      if (valueList) {
        this.globalData.userInfo = valueList[0]
        this.globalData.token = valueList[1]
      }
    } catch (e) {
      console.log(e)
    }

    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success (res) {
          console.log(res)
          if (res.code) {
            //发起网络请求
            wx.request({
              url:  that.globalData.ip +'/wx/loginWithwxxcx',
              method:'get',
              data: {
                code: res.code
              },
              success (resChangeSession) {
                // 必须是在用户已经授权的情况下调用
                console.log(resChangeSession)
                that.globalData.userInfo = resChangeSession.data.data.loginUser.user
                that.globalData.token = resChangeSession.data.data.token
                try{
                  wx.setStorageSync('user', resChangeSession.data.data.loginUser.user)
                  wx.setStorageSync('token', resChangeSession.data.data.token)
                }catch(e){
                  console.log(e)
                }
                typeof cb == "function" && cb(resChangeSession.data.data.loginUser.user) 
              }
            })
          } else {
            console.log('登录失败！' + res.errMsg)
          }
        }
      })
    }
  },


  //arraybuffer转字符串
  arrayBufferToString:function(arr){
    if(typeof arr === 'string') {  
        return arr;  
    }  
    if(arr.data.constructor.toString().indexOf('Uint8Array') !== -1){
      return String.fromCharCode.apply(null, arr.data)
    }

    var dataview=new DataView(arr.data);
    var ints=new Uint8Array(arr.data.byteLength);
    for(var i=0;i<ints.length;i++){
      ints[i]=dataview.getUint8(i);
    }
    arr=ints;
    var str = '',  
        _arr = arr;  
    for(var i = 0; i < _arr.length; i++) {  
        var one = _arr[i].toString(2),  
            v = one.match(/^1+?(?=0)/);  
        if(v && one.length == 8) {  
            var bytesLength = v[0].length;  
            var store = _arr[i].toString(2).slice(7 - bytesLength);  
            for(var st = 1; st < bytesLength; st++) {  
                store += _arr[st + i].toString(2).slice(2);  
            }  
            str += String.fromCharCode(parseInt(store, 2));  
            i += bytesLength - 1;  
        } else {  
            str += String.fromCharCode(_arr[i]);  
        }  
    }  
    return str; 
  },

  //格式化响应流数据
  formatText(text){
    text = text.replaceAll("\n","")
    text = text.replaceAll("event:message","")
    let arr = text.split("data:")
    return arr
  },


  // 校验剩余回答次数是否足够
  checkLeftAnswerTime(){
    console.log()
    let flag = false
    if(this.globalData.userInfo.canUseAnswer == -1 
      && this.globalData.userInfo.expireTime 
      && new Date(this.globalData.userInfo.expireTime) > new Date()){
        flag = true
    }
    if(this.globalData.userInfo.canUseAnswer > 0){
      flag = true
    }
    if(!flag){
      wx.showToast({
        title: '您的体验次数用完',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
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
      }, 800);
    }
    return flag
  },


  // 回答次数 -1 
  reduceCanUseAnswerTime:function(){
    let that = this 
    if(this.globalData.userInfo.canUseAnswer != -1){
      this.globalData.userInfo.canUseAnswer = this.globalData.userInfo.canUseAnswer -1
      wx.request({
        url: that.globalData.ip+'/system/user/reduceCanUseAnswerTime',
        data: {},
        method: 'get',
        header:{
          'Authorization': 'Bearer '+that.globalData.token
        },
        success:(res)=>{
          console.log(res)
        }
      })
    } 
  },


  getUUid:function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
   
    var uuid = s.join("");
    return uuid
  },
  
  globalData:{
    userInfo:null,
    bbxData:[],//百宝箱页面数据预加载
    token: null,
    answeredTime:0,
    ip:"https://"+"inner.luqingwu.top"+":80",
    // ip:"https://"+"inner.luqingwu.top"+":9099",
    // ip:"https://"+"127.0.0.1"+":80",
    // wsip:"ws://"+"192.168.1.173"+":80"
  }
})