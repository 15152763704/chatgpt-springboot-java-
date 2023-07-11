var app = getApp()
var getData = require('../../utils/util.js')
// import encoding from '../../utils/encoding.js'	// 引入js
import encode from '../../utils/encode'
const recorderManager = wx.getRecorderManager()
var plugin = requirePlugin("WechatSI")
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
const innerAudioContext = wx.createInnerAudioContext({
  useWebAudioImplement: false // 是否使用 WebAudio 作为底层音频驱动，默认关闭。对于短音频、播放频繁的音频建议开启此选项，开启后将获得更优的性能表现。由于开启此选项后也会带来一定的内存增长，因此对于长音频建议关闭此选项
})




Page({
  data:{
    text:"这是消息页面，研发中。。。",
    title:"标题",
    userInfo: {},
    messageList:[],
    animation:{},
    animation_2:{},
    tap:"tapOff",

    sendInfo:{},
    sendInfoValue:'',//发送输入框input值
    tempSendInfoValue:'未识别到内容',//临时识别的文本

    messageScrollTop:99999999,//设置的竖向滚动条位置
  
    queryParams:{
      pageNum:'',
      pageSize:'',
    },

    pullDown:{
      perScrollHeight:'',//聊天滑动区域的高度- 变化前
      nowScrollHeight:'',//聊天滑动区域的高度- 变化后
      loadFlag:true,//是否需要下拉加载上一页
      isNeetResetScrollHeight:false,//是否需要重置滚动条位置
    },

    show_wait:false,//是否显示等待提示
    wait_content:'',//等待提示的内容
    waitTimer:'',//等待响应定时器
    waitLeftTime:'',//等待时间
    sendButtonCanUse:false,//发送按钮是否可以点击  false 不能点击，true可以点击
    findNeweastMessageTimer:'',//定时器查早最新的聊天信息

    yy:{
      yy_send_image_src:'/image/yy.png',
      yy_flag:false,
      startPoint:'',
      is_clock:false,
    },
    
    socketTask:{},//socket对象
    status:0,//websocket传输的侦数 0 第一帧  1中间侦  2 最后侦
    socketUrl:'',//科大讯飞 socket连接的鉴权url后台返回
    sendInputFocus:false,//input输入框聚焦，默认不聚焦


    voiceObj:{
      showCancelSendVoicePart: false,
      timeDownNum: 0,
      status: 'start',
      startStatus: 1,
      moveToCancel: false
    },
    
    popupShow: false,
    isLuyin: false,
    resShow: false,


    chatFunctionId:'',//功能id
    questionIndex:0,//当前问题的索引
    answeredList:[],//回答的数组
    questionList:[],//问题列表
    isHideSendCon:false,//是否隐藏底部发送消息主键

  },
  onLoad:function(option){
    let that = this 
    console.log(option)
    // 页面初始化 options为页面跳转所带来的参数
    this.setData({
      title:option.title
    })
    this.initVoiceObj()
    this.initLoadRabbitJob()
    this.setData({
      chatFunctionId:option.id
    },function(){
      that.loadFunction()
    })

  },
  onReady:function(){
    // 页面渲染完成
    var _self = this
    wx.setNavigationBarTitle({
      title: _self.data.title
    })
    this.animation = wx.createAnimation();
    this.animation_2 = wx.createAnimation()
  },
  onShow: function() {
    // var that = this;
    // recorderManager.onStart(() => {
    //   //开始录音时触发
    //   status = 0;
    //   iatResult = []
    //   console.log('recorder start')
    // });
    // recorderManager.onError((res) => { 
    //   //错误回调
    //   console.log(res);
    // });
    // recorderManager.onStop((res) => {
    //   //结束录音时触发
    //   console.log('recorder stop', res)
    //   status = 2;
    //   var sendsty = '{"data":{"status":2,"audio":"","format":"audio/L16;rate=8000","encoding":"raw"}}'
    //   if(wxst){
    //     wxst.send({
    //       data: sendsty
    //     })
    //   }
    // });
    // recorderManager.onFrameRecorded((res) => {
    // console.log('fram',res)
    // //每帧触发
    //   const {frameBuffer } = res
    //   var int16Arr = new Int8Array(res.frameBuffer);
    //   const base64 = wx.arrayBufferToBase64(int16Arr)
    //   switch (status) {
    //     case 0:
    //       status = 1;
    //       var sendsty = '{"common":{"app_id":"3e7ed421"},"business":{"language":"zh_cn","domain":"iat","accent":"mandarin","dwa":"wpgs","vad_eos":1000},"data":{"status":0,"format":"audio/L16;rate=8000","encoding":"raw","audio":"' + base64 + '"}}'
    //       wxst.send({ data: sendsty})
    //       break;
    //     case 1:
    //       var sendsty = '{"data":{"status":1,"format":"audio/L16;rate=8000","encoding":"raw","audio":"' + base64 + '"}}'
    //       wxst.send({data: sendsty})
    //       break;
    //     default:
    //       console.log("default");
    //   }
    // })
  },
  onHide:function(){
    // 页面隐藏
    let _this = this
    _this.setData({
      popupShow: false,
      isLuyin: false,
      resShow: false
    })
    innerAudioContext.stop()
  },
  onUnload:function(){
    // 页面关闭
  },
  elseBtn:function(){
    // console.log(e);
    var _self = this;
    if(_self.data.tap=="tapOff"){
      _self.animation_2.height("55%").step();
      _self.setData({ animation_2: _self.animation_2.export() })
      _self.setData({
           tap:"tapOn"
      })
    }else{
      _self.animation_2.height("90%").step();
      _self.setData({ animation_2: _self.animation_2.export() })
      _self.setData({
           tap:"tapOff"
      })
    }
  },
  // 初始化录音效果数据
  initVoiceObj(){
    let systemInfo = wx.getSystemInfoSync();
    let windowHeight = systemInfo.windowHeight
    let windowWidth = systemInfo.windowWidth
    let width = windowWidth / 2.6;
    this.setData({
        'voiceObj.status': 'end',
        'voiceObj.startStatus': 0,
        'voiceObj.voicePartWidth': width,
        'voiceObj.moveToCancel': false,
        'voiceObj.voicePartPositionToBottom': (windowHeight - width / 2.4) / 2,
        'voiceObj.voicePartPositionToLeft': (windowWidth - width) / 2,
        'voiceObj.cancelLineYPosition': windowHeight * 0.12
    });
  },
  // 初始化科大讯飞socket连接
  initSocketConnect(){
    let that = this 
    wx.request({
      url:  app.globalData.ip +'/KeDaController/getAuthUrl',
      method: 'get',
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      success: function(res){
        console.log(res)
        that.setData({
          socketUrl:res.data.data
        })

      }
    })
  },


  // 初始化百度 token
  getBaiduAccessToken(){
    let that = this;
    let ApiKey='YxDEHngH4sUXAoMwN0TuN0ez';
    let SecretKey='RIEzF5XVy7jGFWtK4GGn4NdStpzlWDLp';
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + ApiKey+'&client_secret='+SecretKey,
      method: 'POST',
      success: function (res) {
        that.setData({
          AccessToken:res.data.access_token
        });
      }
    });
  },
  // 百度语音识别
  baiduVideoTransToText(base64,fileRes){
    let data = {
      "format":"m4a",
      "rate":16000,
      "dev_pid":1537,
      "channel":1,
      "token":this.data.AccessToken,
      "cuid":"baidu_workshop",
      "len":fileRes.fileSize,
      "speech":base64, // xxx为 base64（FILE_CONTENT）
    };
    wx.request({
      url: 'http://vop.baidu.com/server_api',
      method: 'post',
      data:data,
      ContentType:'application/json',
      success: function (res) {
          console.log(res);
      }
    });
  },
  // 请求百度ai转文字
  postForBaidu(fileRes){
    let that = this 
    wx.uploadFile({
        url: app.globalData.ip + '/wx/submitVideo',
        filePath: fileRes.tempFilePath,
        name: 'file',
        header:{
          'Authorization': 'Bearer '+app.globalData.token,
          'content-type': 'multipart/form-data'
        },
        success: function(event) {
          console.log(event)
          that.baiduVideoTransToText(event.data,fileRes)
          wx.hideLoading()
        }
    })
  },
  // 双向绑定发送的信息input框值到 sendValue
  sendInfoOfSendValueInput:function(e){
    this.setData({
      ['sendInfo.message']:e.detail.value,
    })
  },
  bindTempSendInfoValue(e){
    console.log(e)
    this.data.tempSendInfoValue = e.detail.value
    this.setData({
      tempSendInfoValue:e.detail.value,
    })
  },
  // 校验输入框是否有内容
  checkSendInfoValue(){
    if(this.data.sendInfo.message == '' || this.data.sendInfo.message == undefined || this.data.sendInfo.message.trim() == ''){
      wx.showToast({
        title: '请输入您要提的问题',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    return true
  },
  //发送信息
  sendInfo:function(){
    // 校验输入框是否有内容
    if(!this.checkSendInfoValue())return false
    // 校验剩余回答次数是否足够
    if(!app.checkLeftAnswerTime())return false

    this.data.answeredList.push(this.data.sendInfo.message) 
    this.setData({answeredList:this.data.answeredList})
    this.genUserAnswer(this.data.sendInfo.message)
  },

  //arraybuffer转字符串
  arrayBufferToString:function(arr){
    if(typeof arr === 'string') {  
        return arr;  
    }  
    // console.log(arr.data)
    // console.log(String.fromCharCode.apply(null, arr.data))
    //console.log(arr.data.constructor)//ƒ Uint8Array() { [native code] }   ƒ ArrayBuffer() { [native code] }
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

  //时间戳补零
  addZero: function (num) {
    if (parseInt(num) < 10) {
        num = '0' + num;
    }
    return num;
  },
  //时间戳转日期字符串
  getRealDate: function (str) {
      let oDate = new Date(str);
      if (str === undefined) {
          oDate = new Date();
      }
      let oYear = oDate.getFullYear(),
          oMonth = oDate.getMonth() + 1,
          oDay = oDate.getDate(),
          oHour = oDate.getHours(),
          oMin = oDate.getMinutes(),
          oSen = oDate.getSeconds(),
    oshm = oDate.getMilliseconds(),
          oTime = oYear + '-' + this.addZero(oMonth) + '-' + this.addZero(oDay) + ' ' + this.addZero(oHour) + ':' +
              this.addZero(oMin) + ':' + this.addZero(oSen) + ' '+this.addZero(oshm);
      return oTime;
  },

  //构建消息
  buildMessage(messageUserName,messageUserImage,messageRole,messageIndex,messageUserId){
    this.data.sendInfo.chatId = this.data.userInfo.userId
    this.data.sendInfo.system = ""
    this.data.sendInfo.apikey = "null"
    this.data.sendInfo.messageUserName = messageUserName
    this.data.sendInfo.messageUserImage = messageUserImage
    this.data.sendInfo.messageRole = messageRole
    this.data.sendInfo.messageIndex = messageIndex
    this.data.sendInfo.messageCreateDate =  this.getRealDate()
    this.data.sendInfo.messageUserId = messageUserId
    this.data.messageList.push(JSON.parse(JSON.stringify( this.data.sendInfo)))
    this.setData({
      messageList:this.data.messageList,
      messageScrollTop:this.data.messageScrollTop +1
    },()=> {
      this.setData({
        sendInfoValue:''
      })
    })
  },  
  //保存消息
  saveMessage(){
    let that = this 
    wx.request({
      url: app.globalData.ip+'/ChatMessageController/saveOrUpdateChatMessage',
      data: that.data.sendInfo,
      method: 'post',
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      success:(res)=>{
        //console.log(res)
      }
    })
  },

  //发送信息
  sendData:function(){
      console.log(this.data.sendInfo)
      let that = this 
      this.buildMessage(this.data.userInfo.nickName,this.data.userInfo.avatar,'user',this.data.sendInfo.messageIndex + 1,that.data.sendInfo.userId)
      this.saveMessage()
      const requestTask = wx.request({
        url: app.globalData.ip+'/stream-sse3?message=' + that.data.sendInfo.message + "&chatId=" + that.data.sendInfo.chatId
        + "&context_number=" + that.data.sendInfo.contextNum+ "&system=" + that.data.sendInfo.system+"&apikey="+that.data.sendInfo.apikey,
        enableChunked: true,
        responseType:'text',
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        success:(streamRes)=>{
          console.log(streamRes)
        }
      })
      this.setData({
        ['sendInfo.message']:'努力思考中...'
      })
      this.buildMessage('CHATAI','/image/adam.jpg','assistant',that.data.sendInfo.messageIndex + 1,'')
      let index = that.data.messageList.length - 1
      requestTask.onChunkReceived(function (taskRes){
        let text =  that.arrayBufferToString(taskRes)
        let arr = that.formatText(text)
        console.log(arr)
        for (var i = 0; i < arr.length; i++) {
          if(arr[i].indexOf("500sse_error_zq")!=-1 || arr[i].code == 500){
            console.log('出错了')
          }else if(arr[i].indexOf("need_wait")!=-1 ){
            let json = JSON.parse(arr[i] == '' ? '{}':arr[i])
            console.log(json)
            that.data.messageList.splice(index,1)
            that.data.waitLeftTime = json.waitTime
            let msg = '服务器忙,预计等待'+Math.floor(Math.round(that.data.waitLeftTime/1000)/60)+'分'+Math.round(that.data.waitLeftTime/1000)%60+'秒'
            wx.setStorage({key:'chatWaitRabbitUnionId_genMessageText',data: json.unionId})
            that.setData({
              wait_content:msg,
              messageList:that.data.messageList,
            },function(){
              that.execTimer()
            }) 
          }else if(arr[i].indexOf("Remote host closed connection during handshake") !=-1){
              wx.showToast({
                title: '网络异常，请重试！',
              })
          }else{
            let json = JSON.parse(arr[i] == '' ? '{}':arr[i])
            // console.log(json)
            if (json.choices && json.choices[0].message.content != undefined && json.choices[0].message.content != null) {
              //回复中
              let msg = encode.baseDecode(json.choices[0].message.content);
              //console.log(msg)
              that.setData({
                ['messageList['+ index +'].message'] : (that.data.messageList[index].message=='努力思考中...'?'':that.data.messageList[index].message) + msg,
                messageScrollTop:that.data.messageScrollTop +1
              })
              if(json.choices[0].finish_reason == 'stop'){//响应结束
                that.data.sendInfo.message = that.data.messageList[index].message
                app.globalData.userInfo.canUseAnswer  =  app.globalData.userInfo.canUseAnswer  -  1
                that.saveMessage();
              }
            }
            if (json.choices &&  json.choices[0].finish_reason != undefined && json.choices[0].finish_reason == "length") {
                swal("啊呀呀!", "token超出限制", "error");
            }
          }
        }
      })        
      
  },
  //等待chat响应执行器
  execTimer(){
    let that = this 
    that.setData({
      show_wait:true,
      messageScrollTop:that.data.messageScrollTop +1,
      sendButtonCanUse:true
    })
    that.data.waitTimer = setInterval(function(){       
      that.data.waitLeftTime = that.data.waitLeftTime - 1000   
      if( that.data.waitLeftTime>=1000) {
        let msg = '服务器忙,预计等待'+Math.floor(Math.round(that.data.waitLeftTime/1000)/60)+'分'+Math.round(that.data.waitLeftTime/1000)%60+'秒'
        that.setData({wait_content:msg,})  
      }else{
        clearInterval(that.data.waitTimer)
        that.findNeweastMessage()
      }        
    },1000)
  },
  // 定时器执行完毕查询最新的响应数据
  findNeweastMessage(){
    let that = this 
    that.data.findNeweastMessageTimer = setInterval(() => {
      wx.getStorage({
        key: 'chatWaitRabbitUnionId_genMessageText',
        success (res) {
          wx.request({
            url: app.globalData.ip+'/FunctionMessageController/findNeweastAnsweredById',
            method: "GET",
            data:{id:res.data},
            header:{
              'Authorization': 'Bearer '+app.globalData.token
            },
            success: function(resData) {
              if(resData.data.data.responseData){
                clearInterval(that.data.findNeweastMessageTimer)
                let obj = {
                  messageRole : 'assistant',
                  message:resData.data.data.responseData,
                  messageScrollTop:that.data.messageScrollTop +1
                }
                that.data.messageList.push(obj)
                that.setData({
                  show_wait:false,
                  messageList:that.data.messageList,
                  messageScrollTop:that.data.messageScrollTop + 1
                })
              }else{
                wx.request({//查询失败的任务
                  url: app.globalData.ip+'/RabbitJobController/findGenerateTextMessageRabbitJobByUnionId',
                  data: { unionId: res.data,success:1 },
                  method: "GET",
                  header:{
                    'Authorization': 'Bearer '+app.globalData.token
                  },
                  success: function(resJob) {
                    if(resJob.data.data){//任务执行失败
                      clearInterval(that.data.findNeweastMessageTimer)
                    }
                  },
                })
              }
            },
          })
        }
      })
    }, 3000);
  },
  //格式化响应流数据
  formatText(text){
    text = text.replaceAll("\n","")
    text = text.replaceAll("event:message","")
    let arr = text.split("data:")
    return arr
  },
  /**
   * 刷新页面初始化用户登陆
   */
  initUserLogin:function(){
    let that = this 
    app.getUserInfo(function(res){
      console.log(res)
      that.setData({
        userInfo: res
      })
      that.initLoadMsg()
      // that.initLoadAnsweredTime()
      that.initLoadRabbitJob()
      // that.initSocketConnect()
      that.initBBXData()
    })
  },
  /** 初始化加载是否存在rabbit任务执行 */
  initLoadRabbitJob(){
    let that = this 
    wx.getStorage({
      key: 'chatWaitRabbitUnionId_genMessageText',
      success (res) {
        console.log(res)
        wx.request({
          url: app.globalData.ip+'/RabbitJobController/findChatMessageRabbitJobByUnionId',
          data: { unionId: res.data ,success:0},
          method: "GET",
          header:{
            'Authorization': 'Bearer '+app.globalData.token
          },
          success: function(resData) {
            let obj = resData.data.data
            let json = JSON.parse(obj.sendParam)
            let leftTime =   json.time - new Date().getTime()
            that.setData({
              waitLeftTime: leftTime
            },function(){
              that.execTimer()
            })
          },
        })
      },
      complete(res){
        console.log(res)
      }
    })
  },
  /** 初始化加载chat响应次数 */
  initLoadAnsweredTime(){
    let that = this 
    wx.request({
      url: app.globalData.ip+'/ChatMessageController/findAnsweredTime',
      data: { chatId: that.data.userInfo.userId },
      method: "GET",
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      success: function(res) {
        app.globalData.answeredTime = res.data.data
      },
    })
  },
  /** 初始化加载消息列表 */
  initLoadMsg(){
    let that = this 
    wx.request({
      url: app.globalData.ip+'/ChatMessageController/getMsg',
      data: { chatId: that.data.userInfo.userId,pageSize:that.data.queryParams.pageSize,pageNum:that.data.queryParams.pageNum },
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      method: "GET",
      success: function(res) {
          console.log(res)
          that.setData({
            messageList:res.data.records,
            messageScrollTop:999999999,
            ['queryParams.pageNum']:res.data.current,
            ['queryParams.pageSize']:res.data.size,
          })
          that.data.sendInfo.messageIndex = res.data.total
      },
      fail:function(err){
          console.log(err);
      }
    })
  },
  //滚动条距离顶部50触发
  loadPerPage(e){
    console.log(e.detail)
    //this.resetScrollHeight(e)
    if(e.detail.scrollTop <=  10 && this.data.pullDown.loadFlag == true && this.data.queryParams.pageNum >=2){
      let that = this
      that.setData({
        ['queryParams.pageNum']:that.data.queryParams.pageNum - 1,
        ['pullDown.loadFlag']:false,
      })
      wx.request({
        url: app.globalData.ip+'/ChatMessageController/getMsg',
        data: { chatId: that.data.userInfo.userId,pageSize:that.data.queryParams.pageSize,pageNum:that.data.queryParams.pageNum },
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        method: "GET",
        success: function(res) {
            let arr = []
            arr = arr.concat(res.data.records)
            arr = arr.concat(that.data.messageList)
            console.log(that.data.messageList)
            console.log(arr)
            that.setData({
              messageList:arr,
              // messageScrollTop:1,
              ['pullDown.loadFlag']:true,
              ['pullDown.isNeetResetScrollHeight']:true,
            },function(){
              wx.createSelectorQuery().select('.computed_scroll_heiht').boundingClientRect(function (rect) {
                console.log(rect.height)
                that.setData({
                  messageScrollTop:rect.height - e.detail.scrollHeight
                })
              }).exec();
            })
            
        },
        fail:function(err){
            console.log(err);
        }
      })
    }  
  },
  // 滑动加载上一页重置滚动条位置
  resetScrollHeight(e){
    console.log(this.data.pullDown)
    let that = this 
    this.setData({
      ['pullDown.nowScrollHeight']:e.detail.scrollHeight,
    })
    if(this.data.pullDown.perScrollHeight){
      if(this.data.pullDown.perScrollHeight < e.detail.scrollHeight && this.data.pullDown.isNeetResetScrollHeight == true){
        this.setData({
          messageScrollTop:e.detail.scrollHeight - that.data.pullDown.perScrollHeight,
          ['pullDown.isNeetResetScrollHeight']:false,
        })
      }
    }else{
      this.setData({
        ['pullDown.perScrollHeight']:e.detail.scrollHeight,
      })
    }
  },
  chooseImg:function(){
    var _self = this;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        var t = _self.data.messageList;
        t.push({
          img:_self.data.userInfo.avatarUrl,
          imgList:tempFilePaths,
          me:true
        })
        _self.setData({
          messageList:t
        })
      }
    })
  },
  // getaddress:function(){
  //   wx.getLocation({
  //     type: 'gcj02', //返回可以用于wx.openLocation的经纬度
  //     success: function(res) {
  //       var latitude = res.latitude
  //       var longitude = res.longitude
  //       wx.openLocation({
  //         latitude: latitude,
  //         longitude: longitude,
  //         scale: 28
  //       })
  //     }
  //   })
  // },
  getlocat:function(){
    var _self = this
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success: function(res) {
        _self.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          markers: [{
            latitude: res.latitude,
            longitude: res.longitude,
            name: '时代一号',
            desc: '现在的位置'
          }],
          covers: [{
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: '/images/green_tri.png',
            rotate: 10
          }]
        })
        var t = _self.data.messageList;
          t.push({
            img:_self.data.userInfo.avatarUrl,
            me:true,
            map:true
          })
          _self.setData({
            messageList:t
          })
    }})
      
  },
  getvoice:function(){
    console.log("开始录音")
    wx.startRecord({
      // success: function(res) {
      //   console.log("录音成功")
      //   var tempFilePath = res.tempFilePath 
      //   var t = _self.data.message;
      //   t.push({
      //     img:_self.data.userInfo.avatarUrl,
      //     text:"语音消息",
      //     me:true,
      //     voice:tempFilePath
      //   })
      //   _self.setData({
      //     message:t
      //   })
      //   wx.playVoice({
      //     filePath: tempFilePath,
      //     complete: function(){
      //       console.log(播放完毕)
      //     }
      //   })
      // },
      success: function(res) {
        console.log("录音成功")
        var tempFilePath = res.tempFilePath 
      },
      complete:function(res){
        console.log("complete"+res)
      },
      fail: function(res) {
        //录音失败
        console.log("fail"+res)
      }
    })
  },
  stopvoice:function(){
    wx.stopRecord()
    console.log("stop")
  },


 //复制文本
 copyText(e) {
  let message = e.currentTarget.dataset.message;
  wx.setClipboardData({ //设置系统剪贴板的内容
    data: message,
    success(res) {
      wx.hideToast()
      wx.getClipboardData({ // 获取系统剪贴板的内容
        success(res) {
          wx.showToast({
            title: '复制成功',
          })
        }
      })
    }
  })
},


// 点击语音按钮
trigger_yy(){
  if(this.data.yy.yy_flag){
    this.setData({
      yy:{
        yy_send_image_src:'/image/yy.png',yy_flag:false
      }
    })
  }else{
    this.setData({
      yy:{
        yy_send_image_src:'/image/yy_l.png',yy_flag:true
      }
    })
    // recorderManager.start({duration: 1})
    // 可以通过 wx.getSetting 先查询一下用户是否授权了 "scope.record" 这个 scope
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success () {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
            }
          })
        }
      }
    })

    
  }
},
onSuccess() {
  let that = this
  that.setData({
    popupShow: false,
    isLuyin: false,
    resShow: false
  },()=> {
    console.log(that.data.tempSendInfoValue)
    that.setData({
      sendInfoValue:that.data.tempSendInfoValue,
      ['sendInfo.message']:that.data.tempSendInfoValue,
    })
    that.sendInfo()
  })
},
onClose() {
  let that = this
  that.setData({
    popupShow: false,
    isLuyin: false,
    resShow: false
  },()=> {
    this.setData({
      sendInfoValue:'',
      ['sendInfo.message']:'',
    })
  })
},
onLuyin() {
  let that = this
  // wx.showToast({
  //   title: '长按录音',
  //   icon: 'none'
  // })
  that.setData({
    isLuyin: true,
    resShow: false
  },()=> {
    // setTimeout(() => {
    //   that.setData({
    //     isLuyin: false
    //   })
    // }, 3000);

  })
},
// 开始录音
startRecorderManager(e){
    let that = this
    wx.vibrateLong({
      complete: function() {
        that.setData({
          popupShow: true,
          isLuyin: true,
          resShow: false
        })
      }
    })
    // this.startLuyinAnm()
    let option = {
      duration: 60000,//指定录音的时长，单位 ms
      sampleRate: 8000,//采样率
      numberOfChannels: 1,//录音通道数
      encodeBitRate: 48000,//编码码率
      format: 'PCM',//音频格式
      // frameSize: 5,//指定帧大小，单位 KB
    }
    recorderManager.start(option)
    this.setData({
      ['yy.startPoint']: e.touches[0],//记录触摸点的坐标信息
      ['yy.is_clock']: true//设置为可以发送语音
    })


    // const socketTask = wx.connectSocket({
    //   url: that.data.socketUrl,
    //   method:'get',
    //   success: function(res){
    //     console.log(res)
    //   },
    //   complete:function(res){
    //     console.log(res)
    //   }
    // })   
    // console.log(that.data.socketTask)
    // socketTask.onOpen(res=>{
    //   console.log(res)
    // })
    // socketTask.onMessage(res=>{
    //   console.log(res)
    // })
    // socketTask.onError(res=>{
    //   console.log(res)
    // })
    // socketTask.onClose(res=>{
    //   console.log(res)
    // })

    // recorderManager.onFrameRecorded((res)=>{
    //   // console.log(that.data.socketTask)
    //   // console.log(res.frameBuffer)
    //   // if (iatWS.readyState === iatWS.OPEN) {
    //     switch (that.data.status) {
    //       case 0:   // 第一帧音频status = 0
    //           let frame = {}
    //           let business = {}  //第一帧必须发送
    //           let common = {} //第一帧必须发送
    //           let data = {}  //每一帧都要发送
    //           // 填充common
    //           common.app_id =  "3e7ed421"
    //           //填充business
    //           business.language =  "zh_cn"
    //           //business.addProperty("language", "en_us");//英文
    //           //business.addProperty("language", "ja_jp");//日语，在控制台可添加试用或购买
    //           //business.addProperty("language", "ko_kr");//韩语，在控制台可添加试用或购买
    //           //business.addProperty("language", "ru-ru");//俄语，在控制台可添加试用或购买
    //           business.domain = "iat"
    //           business.accent = "mandarin"//中文方言请在控制台添加试用，添加后即展示相应参数值
    //           //business.addProperty("nunum", 0);
    //           //business.addProperty("ptt", 0);//标点符号
    //           //business.addProperty("rlang", "zh-hk"); // zh-cn :简体中文（默认值）zh-hk :繁体香港(若未授权不生效，在控制台可免费开通)
    //           //business.addProperty("vinfo", 1);
    //           business.dwa = "wpgs" //动态修正(若未授权不生效，在控制台可免费开通)
    //           //business.addProperty("nbest", 5);// 句子多候选(若未授权不生效，在控制台可免费开通)
    //           //business.addProperty("wbest", 3);// 词级多候选(若未授权不生效，在控制台可免费开通)
    //           //填充data
    //           data.status =  0
    //           data.format = "audio/L16;rate=16000"
    //           // 音频数据格式
    //           // raw：原生音频（支持单声道的pcm）
    //           // speex：speex压缩后的音频（8k）
    //           // speex-wb：speex压缩后的音频（16k）
    //           // 请注意压缩前也必须是采样率16k或8k单声道的pcm。
    //           // lame：mp3格式（仅中文普通话和英文支持，方言及小语种暂不支持）
    //           // 样例音频请参照音频样例
    //           data.encoding = "lame"
    //           let str = String.fromCharCode(...new Uint8Array(res.frameBuffer))
    //           // console.log(str)
    //           data.audio =  encode.baseEncode(str)
    //           //填充frame
    //           frame.common =  common
    //           frame.business = business
    //           frame.data = data
    //           let frameStr = JSON.stringify(frame)
    //           console.log(frameStr)
    //           socketTask.send({
    //             data:frameStr,
    //             complete:function(sendRes){
    //               console.log(sendRes)
    //             }
    //           });
    //           that.setData({status:1})  // 发送完第一帧改变status 为 1
    //           break;
    //       case 1:  //中间帧status = 1
    //           let frame1 = {}
    //           let data1 = {}
    //           data1.status =  1
    //           data1.format = "audio/L16;rate=16000"
    //           data1.encoding = "lame"
    //           let str1 = String.fromCharCode(...new Uint8Array(res.frameBuffer))
    //           // console.log(str1)
    //           data1.audio =  encode.baseEncode(str1)
    //           frame1.data = data1
    //           let frameStr1 = JSON.stringify(frame1)
    //           // console.log(frameStr1)
    //           socketTask.send({
    //             data:frameStr1,
    //             complete:function(sendRes){
    //               console.log(sendRes)
    //             }
    //           });
    //           // console.log("send continue");
    //           break;
    //       case 2:    // 最后一帧音频status = 2 ，标志音频发送结束
    //           let frame2 = {}
    //           let data2 = {}
    //           data2.status =  2
    //           data2.audio = ""
    //           data2.format = "audio/L16;rate=16000"
    //           data2.encoding = "lame"
    //           frame2.data = data2
    //           socketTask.send({
    //             data:JSON.stringify(frame2),
    //             complete:function(sendRes){
    //               console.log(sendRes)
    //             }
    //           });
    //           console.log("sendlast");
    //           break ;
    //   }
    //   // }
    // })

},
// 松开按钮-结束录音
stopRecorderManager:function(e){
  var that = this
  this.setData({popupShow: false,isLuyin:false})
  recorderManager.stop()//结束录音
    //对停止录音进行监控
    recorderManager.onStop((res) => {
      console.log(res)
      //if(that.checkLuyinIsCancel()){return false}
      //对录音时长进行判断，少于2s的不进行发送，并做出提示
      if(res.duration<1000){
        if(res.duration>15){
          wx.showToast({
            title: '录音时间太短，请长按录音',
            icon: 'none',
            duration: 1000
          })
        }
      }else{       
        console.log(res)     
        //进行语音发送
        const {tempFilePath} = res;
        wx.showLoading({
          title: '语音检索中',
        })
        //上传录制的音频
        wx.uploadFile({
          url: app.globalData.ip + '/TencentApiController/upload',
          filePath: tempFilePath,
          name: 'file',
          header:{
            'Authorization': 'Bearer '+app.globalData.token,
            'content-type': 'multipart/form-data'
          },
          success: function(event) {
            console.log(event)
            let json = JSON.parse(event.data)
            let resJson = JSON.parse(json.data)
            that.luyinEndSetVal(resJson.Result)
          }
        })

        // wx.uploadFile({
        //   url: app.globalData.ip + '/wx/submitVideo',
        //   filePath: tempFilePath,
        //   name: 'file',
        //   header:{
        //     'Authorization': 'Bearer '+app.globalData.token,
        //     'content-type': 'multipart/form-data'
        //   },
        //   success: function(event) {
        //     console.log(event)
        //     wx.hideLoading()
        //   }
        // })

        //this.postForBaidu(res)

      }
    })    
},
// 滑动取消录音
cancelRecorderManager:function(e){
  //计算距离，当滑动的垂直距离大于25时，则取消发送语音
   if (Math.abs(e.touches[e.touches.length - 1].clientY - this.data.yy.startPoint.clientY)>25){
     //取消滑动 - 不发送消息
     console.log('cancel')
     this.setData({
      'voiceObj.moveToCancel': true
     });
   }
 },

 
// 录音
luyin(){
  wx.startRecord({
    success (res) {
      const tempFilePath = res.tempFilePath
      console.log(res)
    }
  })
  setTimeout(function () {
    wx.stopRecord() // 结束录音
  }, 3000)
},



initListenSocket(){
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
          searchKey: str, //这个是中间的语音识别结果
          sendInfoValue:str
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



start_say: function (e) {
  //开始录音按钮
 var that = this;
 wx.getSetting({
 //查看用户有没有开启语音权限
success(res) {
     if (res.authSetting['scope.record']) {
       wx.authorize({
         scope: 'scope.record',
         success() {
            console.log('即将连接')
            wxst = wx.connectSocket({
              // 开启websocket连接
              url: that.data.socketUrl,
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
         },
         fail() {
          recorderManager.start({duration:1})
         }
       })
     }else{
       recorderManager.start({duration:1})
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
}  ,







 
// 松开按钮-结束录音 - 发起后端 websocket识别
stopRecorderManager_javaSocket:function(e){
  recorderManager.stop()//结束录音
  var that = this
    //对停止录音进行监控
    recorderManager.onStop((res) => {
      //对录音时长进行判断，少于2s的不进行发送，并做出提示
      if(res.duration<2000){
        wx.showToast({ title: '录音时间太短，请长按录音', icon: 'none', duration: 1000 })
      }else{       
        console.log(res)     
        //进行语音发送
        const {tempFilePath} = res;
        wx.showLoading({ title: '语音检索中', })
        //上传录制的音频
        const requestTask = wx.uploadFile({
          url: app.globalData.ip + '/JavaWebSocketController/upload',
          filePath: tempFilePath,
          enableChunked: true,
          name: 'file',
          header:{
            'Authorization': 'Bearer '+app.globalData.token,
            'content-type': 'multipart/form-data'
          },
          success: function(event) {
            console.log(event)
            let arr = that.formatText(event.data)
            console.log(arr)
            that.setData({
              sendInfoValue:arr[arr.length-1]
            })
            that.trigger_yy()
            wx.hideLoading()
          }
        })

        requestTask.onChunkReceived(function (taskRes){
          console.log(taskRes)
        })  

      }
    })    
},



  // 开始录音 - 设置录音动画
  startLuyinAnm(){
    this.setData({//调出取消弹窗
      'voiceObj.showCancelSendVoicePart': true,
      'voiceObj.status': 'start',
      'voiceObj.startStatus': 1,
      'voiceObj.moveToCancel': false
    });
  },
  // 录音结束 校验是否取消录音 
  checkLuyinIsCancel(){
    console.log(this.data.voiceObj)
    this.setData({
      'voiceObj.showCancelSendVoicePart':false
    })
    return this.data.voiceObj.moveToCancel
  },
  // 录音结束 - 输入框 - 设置录音文本 - 隐藏弹框 
  luyinEndSetVal(text){
    this.setData({
      sendInfoValue:text,
      ['sendInfo.message']:text,
      // sendInputFocus:true,
      tempSendInfoValue:text,
      isLuyin: false,
      resShow: true,
      popupShow:true
    })
    this.trigger_yy()
    wx.hideLoading()
  },

  // 文字转语音
  textToViode(e){
    wx.showLoading({
      title: '语音转换中',
    })
    console.log(e.currentTarget.dataset.text.length)
    if(e.currentTarget.dataset.text.length < 450){
      plugin.textToSpeech({
        lang: "zh_CN",
        tts: true,
        content: e.currentTarget.dataset.text,
        success: function(res) {
            console.log("succ tts", res.filename)   
            // innerAudioContext.src = 'http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E061FF02C31F716658E5C81F5594D561F2E88B854E81CAAB7806D5E4F103E55D33C16F3FAC506D1AB172DE8600B37E43FAD&fromtag=46'
            // innerAudioContext.play() // 播放
            // innerAudioContext.pause() // 暂停
            // innerAudioContext.stop() // 停止
            innerAudioContext.src = res.filename
            innerAudioContext.play()
            wx.hideLoading()
        },
        fail: function(res) {
            console.log("fail tts", res)
            wx.hideLoading()
        }
      })
    }else{
      wx.request({
        url: app.globalData.ip + '/TencentApiController/textToVideo',
        data: { text: e.currentTarget.dataset.text},
        timeout:60000,
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        method: "GET",
        success:function(res){
            innerAudioContext.src = res.data.data
            innerAudioContext.play()
        },
        complete:function(){
          wx.hideLoading()
        }
      })
    }
  },


  // 初始化查询功能id
  loadFunction(){
    let that = this 
    wx.request({
      url: app.globalData.ip +'/chatFunctionDetail/findPageItemsByCahtFunctionId?chatFunctionId='+that.data.chatFunctionId,
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      method:'get',
      success:function(res){
        that.setData({
          questionList:res.data.data
        },function(){
          that.genSysQuestion()
        })
      }
    })
  },
  // 渲染系统问题
  genSysQuestion(){
    if(this.data.questionList.length -1 >= this.data.questionIndex){
      let tempObj = this.data.questionList[this.data.questionIndex]
      let obj = {
        messageRole : 'assistant',
        messageType: tempObj.type,//问题类型 0 选择框 1 2 textarea 3 数字输入框
        message: (tempObj.type == 0 ? '请选择':'请输入') + tempObj.label,
        messagePlaceholder: tempObj.placeholder,
        chooseList: tempObj.list,
        id:app.getUUid()
      }
      this.data.messageList.push(obj)
      this.setData({
        messageList:this.data.messageList
      })
      this.updateScrollTop()
    }else{
      this.goGenText()
    }
  },
  // 用户回答 选择框 - 老款费用
  answeredChoose(e){
    // 校验剩余回答次数是否足够
    if(!app.checkLeftAnswerTime())return false
    
    let that = this 
    if(!this.data.answeredList[e.currentTarget.dataset.index/2]){
      this.data.answeredList[e.currentTarget.dataset.index/2] = e.currentTarget.dataset.name
      this.setData({
        answeredList:this.data.answeredList
      },function(){
        that.genUserAnswer(e.currentTarget.dataset.name)
      })
    }
  },

  // 用户选择款  -  radio 
  radioChange(e) {
    let that = this 
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    // 校验剩余回答次数是否足够
    if(!app.checkLeftAnswerTime())return false
    this.data.answeredList.push(e.detail.value)
    this.setData({
      answeredList:this.data.answeredList,
      ['messageList['+(this.data.messageList.length - 1)+'].id']:true
    },function(){
      console.log(this.data.messageList)
      that.genUserAnswer(e.detail.value)
      
    })   
  },


  // 渲染用户回答
  genUserAnswer(text){
    let that = this 
    let obj = {
      messageRole : 'user',
      message: text,
    }
    this.data.messageList[this.data.messageList.length-1].id = true 
    this.data.messageList.push(obj)
    let curQuestionIndex = this.data.questionIndex + 1
    this.setData({
      messageList:this.data.messageList,
      questionIndex:curQuestionIndex,
      sendInfoValue:''
    },function(){
      that.updateScrollTop()
      that.genSysQuestion()
    })
  },
  // 更新消息时 确保滑动条在最底部
  updateScrollTop(){
    this.setData({
      messageScrollTop:this.data.messageScrollTop +1
    })
  },
  //开始AI生成
  goGenText(){
    this.setData({isHideSendCon:true})
    // 校验剩余回答次数是否足够
    if(!app.checkLeftAnswerTime())return false

    let that = this 
    // 发起请求
    const requestTask = wx.request({
      url: app.globalData.ip+'/chatFunctionDetail/generateText',
      data: {
        id:that.data.chatFunctionId,
        form:that.data.answeredList
      },
      enableChunked: true,
      method: 'post',
      header:{
        'Authorization': 'Bearer '+app.globalData.token
      },
      success:(res)=>{
        console.log(res)
      }
    })

    //设置滚动条滑动到最底部  并且显示出来生成的文本框
    let obj = {
      messageRole : 'assistant',
      message:'努力思考中...',
    }
    this.data.messageList.push(obj)
    this.setData({
      messageList:this.data.messageList,
      messageScrollTop:that.data.messageScrollTop + 1
    })
    // 监听消息
    let index = that.data.messageList.length - 1
    requestTask.onChunkReceived(function (taskRes){
      let text =  that.arrayBufferToString(taskRes)
      let arr = that.formatText(text)
      console.log(arr)
      for (var i = 0; i < arr.length; i++) {
        if(arr[i].indexOf("500sse_error_zq")!=-1 || arr[i].code == 500){
          console.log('出错了')
        }else if(arr[i].indexOf("need_wait")!=-1 ){
          let json = JSON.parse(arr[i] == '' ? '{}':arr[i])
          console.log(json)
          that.data.messageList.splice(index,1)
          that.data.waitLeftTime = json.waitTime
          let msg = '服务器忙,预计等待'+Math.floor(Math.round(that.data.waitLeftTime/1000)/60)+'分'+Math.round(that.data.waitLeftTime/1000)%60+'秒'
          wx.setStorage({key:'chatWaitRabbitUnionId_genMessageText',data: json.unionId})
          that.setData({
            wait_content:msg,
            messageList:that.data.messageList,
          },function(){
            that.execTimer()
          }) 
        }else if(arr[i].indexOf("Remote host closed connection during handshake") !=-1){
            wx.showToast({
              title: '网络异常，请重试！',
            })
        }else{
          let json = JSON.parse(arr[i] == '' ? '{}':arr[i])
          // console.log(json)
          if (json.choices && json.choices[0].message.content != undefined && json.choices[0].message.content != null) {
            //回复中
            let msg = encode.baseDecode(json.choices[0].message.content);
            //console.log(msg)
            that.setData({
              ['messageList['+ index +'].message'] : (that.data.messageList[index].message=='努力思考中...'?'':that.data.messageList[index].message) + msg,
              messageScrollTop:that.data.messageScrollTop +1
            })
            if(json.choices[0].finish_reason == 'stop'){//响应结束
              that.data.sendInfo.message = that.data.messageList[index].message
              app.reduceCanUseAnswerTime()
            }
          }
          if (json.choices &&  json.choices[0].finish_reason != undefined && json.choices[0].finish_reason == "length") {
              swal("啊呀呀!", "token超出限制", "error");
          }
        }
      }
    })  

  },



})