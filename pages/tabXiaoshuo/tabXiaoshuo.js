var app = getApp()
import encode from '../../utils/encode'

Page({
    data: {
       choosed:{
          nrActive:'',
          lxActive:'',
          fgActive:'',
       },

       waitLeftTime:'',//等待时间
       sendButtonCanUse:false,//生产按钮是否可以点击  false 可以点击，true不能点击
       waitTimer:'',//等待响应定时器
       findNeweastMessageTimer:'',//定时器查早最新的聊天信息

       scrollTop:0,//滚动条的位置
       answerText:'努力思考中...',//gpt答复的文本
       isAnswer:false,//答复文本框是否显示，，默认不显示

       pageInfo: [],//页面表格
       chatFunctionId:'',//功能id

       form:[],//用户选择的文本
    },
    onLoad: function (option) {
      let that = this 
      this.setData({
        chatFunctionId:option.id
      },function(){
        that.initPage()
      })

      wx.setNavigationBarTitle({
        title: option.title
      })
     
      that.initLoadRabbitJob()

    },

  /** 初始化加载是否存在rabbit任务执行 */
  initLoadRabbitJob(){
    let that = this 
    wx.getStorage({
      key: 'chatWaitRabbitUnionId_genText',
      success (res) {
        console.log(res)
        wx.request({
          url: app.globalData.ip+'/RabbitJobController/findGenerateTextMessageRabbitJobByUnionId',
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
              waitLeftTime: leftTime,
              isAnswer:true,
              scrollTop:99999999,   
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


    //初始化加载标签
    initPage(){
      let that = this 
      wx.request({
        url: app.globalData.ip +'/chatFunctionDetail/findPageItemsByCahtFunctionId?chatFunctionId='+that.data.chatFunctionId,
        header:{
          'Authorization': 'Bearer '+app.globalData.token
        },
        method:'get',
        success:function(res){
          that.setData({
            pageInfo: res.data.data
          })
          that.initChoosedValue()
        }
      })
    },

    //初始化 选择框默认选中的值
    initChoosedValue(){
      let that = this 
      for (let i = 0 ;i < that.data.pageInfo.length ; i++) {
         if(that.data.pageInfo[i].type == 0){//选择款框
          let key = `choosed.${that.data.pageInfo[i].id}`;
          let arrKey = `form[${i}]`;
           that.setData({
              [key]: that.data.pageInfo[i].list[0].name,
              [arrKey]:that.data.pageInfo[i].list[0].name,
           })
         }
      }
    },
    //选择类型
    chooseType(e){
      let key = `choosed.${e.currentTarget.dataset.id}`;
      let arrKey = `form[${e.currentTarget.dataset.index}]`;
      this.setData({
        [key]:e.currentTarget.dataset.name,
        [arrKey]:(e.currentTarget.dataset.name == '自定义' ? '':e.currentTarget.dataset.name),
      })
    },



    //开始AI生成
    goGenText(){
      let that = this 
      for (let i = 0 ;i < that.data.pageInfo.length ; i++) {
        if(that.data.pageInfo[i].isMust == 1){ //必填项，需要校验是否填写
          if(this.data.form[i] == '' || this.data.form[i] == null){
            wx.showToast({
              title: '请输入' + that.data.pageInfo[i].label,
              icon: 'none',
              duration: 2000
            })
            return false
          }
        }
      }
      // 校验剩余回答次数是否足够
      if(!app.checkLeftAnswerTime())return false

      const requestTask = wx.request({
        url: app.globalData.ip+'/chatFunctionDetail/generateText',
        data: {
          id:that.data.pageInfo[0].chatFunctionId,
          form:that.data.form
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
      that.setData({
        isAnswer:true,
        scrollTop:999999,   
        answerText:'努力思考中...'
      })

      requestTask.onChunkReceived(function (taskRes){
        let text =  app.arrayBufferToString(taskRes)
        // console.log(text)
        let arr = app.formatText(text)
        for (var i = 0; i < arr.length; i++) {
          if(arr[i].indexOf("500sse_error_zq")!=-1){
            console.log('出错了')
          }else if(arr[i].indexOf("need_wait")!=-1 ){
            let json = JSON.parse(arr[i] == '' ? '{}':arr[i])
            console.log(json)
            that.data.waitLeftTime = json.waitTime
            let msg = '服务器忙,预计等待'+Math.floor(Math.round(that.data.waitLeftTime/1000)/60)+'分'+Math.round(that.data.waitLeftTime/1000)%60+'秒'
            wx.setStorage({key:'chatWaitRabbitUnionId_genText',data: json.unionId})
            that.setData({
              answerText:msg,
              isAnswer:true,
              scrollTop:that.data.scrollTop+1,   
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
              console.log(msg)
              that.setData({
                answerText : (that.data.answerText=='努力思考中...'?'':that.data.answerText) + msg,
                scrollTop:that.data.scrollTop +1
              })
              if(json.choices[0].finish_reason == 'stop'){//响应结束
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

     //等待chat响应执行器
  execTimer(){
    let that = this 
    that.setData({
      sendButtonCanUse:true
    })
    that.data.waitTimer = setInterval(function(){       
      that.data.waitLeftTime = that.data.waitLeftTime - 1000   
      if( that.data.waitLeftTime>=1000) {
        let msg = '服务器忙,预计等待'+Math.floor(Math.round(that.data.waitLeftTime/1000)/60)+'分'+Math.round(that.data.waitLeftTime/1000)%60+'秒'
        that.setData({answerText:msg,scrollTop:that.data.scrollTop+1,   })  
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
        key: 'chatWaitRabbitUnionId_genText',
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
                that.setData({
                  sendButtonCanUse:false,
                  answerText:resData.data.data.responseData,
                  messageScrollTop:that.data.messageScrollTop +1
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



    //自定义类型 文本输入框 变化事件
    customerType(e){
      let arrKey = `form[${e.currentTarget.dataset.index}]`;
      this.setData({
        [arrKey]:e.detail.value,
      })
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
}

})
