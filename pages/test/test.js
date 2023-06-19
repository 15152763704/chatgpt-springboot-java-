
const app = getApp()
const recorderManager = wx.getRecorderManager();
var wxst; //语音websocket
var status = 0;  // 音频的状态
var iatResult = [] // 识别结果
const searchoptions = {
    
    
  duration: 60000,//指定录音的时长，单位 ms
  sampleRate: 8000,//采样率
  numberOfChannels: 1,//录音通道数
  encodeBitRate: 48000,//编码码率
  format: 'PCM',//音频格式
  frameSize: 5,//指定帧大小，单位 KB
}


Page({
    data: {

    },
    onLoad: function(options) {
    
    
      var that = this;
      wx.onSocketOpen((res) => {
      
      // websocket打开
        console.log('监听到 WebSocket 连接已打开' + res);
      })
      wx.onSocketError((err) => {
      
      //连接失败
        console.log('websocket连接失败', err);
        wx.showToast({
      
      
          title: 'websocket连接失败',
          icon: 'none',
          duration: 2000,
          mask: false
        })
      })
      wx.onSocketMessage((res) => {
      
      //接收返回值
        var data = JSON.parse(res.data)
        if (data.code != 0) {
      
      
          console.log("error code " + data.code + ", reason " + data.message)
          return
        }
        let str = ""
        if (data.data.status == 2) {
      
      //最终识别结果
          // data.data.status ==2 说明数据全部返回完毕，可以关闭连接，释放资源
          wxst.close();
        } else {
      
      //中间识别结果
        }
        iatResult[data.data.result.sn] = data.data.result
        if (data.data.result.pgs == 'rpl') {
      
      
          data.data.result.rg.forEach(i => {
      
      
            iatResult[i] = null
          })
        }
        iatResult.forEach(i => {
      
      
          if (i != null) {
      
      
            i.ws.forEach(j => {
      
      
              j.cw.forEach(k => {
      
      
                str += k.w
              })
            })
          }
        })
        that.setData({
      
      
          searchKey: str //这个是中间的语音识别结果
        })
      })
      wx.onSocketClose((res) => {
      
      //WebSocket连接已关闭！
        var that = this;
        recorderManager.stop();
        that.setData({
      
      //把之前开开的遮罩层关上
          shows: false,
        })
        var str = that.data.searchKey;
        console.log(str);
        str = str.replace(/\s*/g, "");//去除空格
        if (str.substr(str.length - 1, 1) == "。") {
      
      //去除句号
          str = str.substr(0, str.length - 1);
        }
        that.setData({
      
      
          searchKey: str//这个是最后确定的语音识别结果
        })
        console.log('WebSocket连接已关闭！')
      })
    },

    onShow: function() {
    
    
      var that = this;
      recorderManager.onStart(() => {
      
      //开始录音时触发
        status = 0;
        iatResult = []
        console.log('recorder start')
      });
      recorderManager.onError((res) => {
      
      //错误回调
        console.log(res);
      });
      recorderManager.onStop((res) => {
      
      //结束录音时触发
        console.log('recorder stop', res)
        status = 2;
        var sendsty = '{"data":{"status":2,"audio":"","format":"audio/L16;rate=8000","encoding":"raw"}}'
        wxst.send({
      
      
          data: sendsty
        })
      });
      recorderManager.onFrameRecorded((res) => {
      console.log('fram',res)
      //每帧触发
        const {
      
       frameBuffer } = res
        var int16Arr = new Int8Array(res.frameBuffer);
        const base64 = wx.arrayBufferToBase64(int16Arr)
        switch (status) {
      
      
          case 0:
            status = 1;
            var sendsty = '{"common":{"app_id":"3e7ed421"},"business":{"language":"zh_cn","domain":"iat","accent":"mandarin","dwa":"wpgs","vad_eos":1000},"data":{"status":0,"format":"audio/L16;rate=8000","encoding":"raw","audio":"' + base64 + '"}}'
            wxst.send({
      
      
              data: sendsty
            })
            break;
          case 1:
            var sendsty = '{"data":{"status":1,"format":"audio/L16;rate=8000","encoding":"raw","audio":"' + base64 + '"}}'
            wxst.send({
      
      
              data: sendsty
            })
            break;
          default:
            console.log("default");
        }
      })
    },



    start_say: function (e) {
    
      //开始录音按钮
     var that = this;
     wx.getSetting({
     
     //查看用户有没有开启语音权限
       success(res) {
     let uurrll = "wss://iat-api.xfyun.cn/v2/iat?authorization=YXBpX2tleT0iNTc5MTAwNTdhMTMzNTY0NTQ1ZTAzMjY3ZjhlNjgyOTciLCBhbGdvcml0aG09ImhtYWMtc2hhMjU2IiwgaGVhZGVycz0iaG9zdCBkYXRlIHJlcXVlc3QtbGluZSIsIHNpZ25hdHVyZT0iNkxVT3hGQjVCUEJxdU1lZkUrUFBIVG1uRmJwcHBLbDBBOE85Z1FrVEpxST0i&date=Thu%2C%2015%20Jun%202023%2012%3A18%3A12%20GMT&host=iat-api.xfyun.cn"
     
     wxst = wx.connectSocket({
     
      // 开启websocket连接
                       url: uurrll,
                       method: 'GET',
                       complete: function (res) {
     
     
                         that.setData({
     
                            //我这里是个遮罩层 开启他
                           shows: true,
                         })
                         console.log('即将开始',res)
                         recorderManager.start(searchoptions);//开始录音
                       }
                     });



         if (res.authSetting['scope.record']) {
     
     
           wx.authorize({
     
     
             scope: 'scope.record',
             success() {
     
     
               var xfurl = "";
               wx.request({
     
     //请求接口 获取讯飞语音鉴权
                url:  app.globalData.ip +'/KeDaController/getAuthUrl',
                method: 'get',
                header:{
                  'Authorization': 'Bearer '+app.globalData.token
                },
                 success: function (res) {
     
                    console.log(res)
                   if (res.data.code == "200" && res.data.data) {
     
                    console.log('即将连接')
                     xfurl = res.data.data;
                     wxst = wx.connectSocket({
     
      // 开启websocket连接
                       url: xfurl,
                       method: 'GET',
                       complete: function (res) {
     
     
                         that.setData({
     
                            //我这里是个遮罩层 开启他
                           shows: true,
                         })
                         console.log('即将开始',res)
                         recorderManager.start(searchoptions);//开始录音
                       }
                     });
                   } else {
     
     
                     wx.showToast({
     
     
                       title: '获取语音鉴权失败',
                       icon: 'none',
                       mask: true,
                       duration: 3000
                     })
                   }
                 },
                 fail: function () {
     
     
                   wx.showToast({
     
     
                     title: '获取语音鉴权失败',
                     icon: 'none',
                     mask: true,
                     duration: 3000
                   })
                 }
               })
             },
             fail() {
     
     
               wx.showModal({
     
     
                 title: '微信授权',
                 content: '您当前未开启语音权限，请在右上角设置(···)中开启“录音功能”',
                 showCancel: false,
                 success(res) {
     
     
                   if (res.confirm) {
     
     
                     console.log('用户点击确定')
                   }
                 }
               })
             }
           })
         }else{
     
     
           wx.showModal({
     
     
             title: '微信授权',
             content: '您当前未开启语音权限，请在右上角设置(···)中开启“录音功能”',
             showCancel: false,
             success(res) {
     
     
               if (res.confirm) {
     
     
                 console.log('用户点击确定')
               }
             }
           })
         }
       }
     })
   },


   end_say: function () {
    
      //结束录音按钮
    var that = this;
    recorderManager.stop();
    that.setData({
    
    //关闭遮罩层
      shows: false,
    })
   }  




})
