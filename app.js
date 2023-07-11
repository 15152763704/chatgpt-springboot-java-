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
                wx.setStorageSync('user', resChangeSession.data.data.loginUser.user);
                wx.setStorageSync('token', resChangeSession.data.data.token)
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


  
  globalData:{
    userInfo:null,
    token: null,
    answeredTime:0,
    // ip:"https://"+"inner.luqingwu.top"+":80",
    ip:"https://"+"inner.luqingwu.top"+":9099",
    // ip:"https://"+"127.0.0.1"+":80",
    // wsip:"ws://"+"192.168.1.173"+":80"
  }
})