import { makeMoneyTrue } from '../../utils/money'
import { expendType, incomeType, otherType } from '../../config/type'
import { getAccount, setAccount } from '../../utils/storage'

Page({
  data: {
    type: 0,  // 0 支出，1 收入，2 不计入收支
    date: '',
    money: '',
    account: 'wechat',
    typeObj: expendType[0],
    expendType,
    incomeType,
    otherType,
    isAddRemark: false,
    remark: '',
    isAdd: false,
    isDisabled: false,
  },

  // 切换头部收支类型
  switchType (e) {
    const { type } = e.currentTarget.dataset
    const { expendType, incomeType, otherType } = this.data
    let obj = {}

    if (type === 0) obj = expendType[0]
    else if (type === 1) obj = incomeType[0]
    else if (type === 2) obj = otherType[0]

    this.setData({
      type,
      typeObj: obj
    })
  },
  
  // 改变时间
  changeTime (e) {
    this.setData({
      date: e.detail
    })
  },

  // 输入金额
  inputMoney (e) {
    this.setData({
      money: makeMoneyTrue(e.detail.value)
    })
  },

  // 选择收支具体类型
  switchTypeName (e) {
    const typeObj = e.detail
    this.setData({
      typeObj
    })
  },

  // 点击添加备注按钮
  readyAddRemark () {
    this.setData({
      isAddRemark: true
    })
  },

  // 输入备注
  inputRemark (e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 点击入账按钮
  add () {
    const { money } = this.data

    if (money < 0.01) {
      wx.showToast({
        title: '金额不得小于 0.01',
        icon: 'none'
      })
      return
    }
    
    const { type, date, typeObj, account, remark } = this.data
    
    this.setData({
      isAdd: true,
      isDisabled: true
    })
    
    // 存储到本地
    this._saveToLocal(type, date, typeObj, account, remark, money).then(() => {
      this.setData({
        money: '',
        remark: ''
      })
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }).catch(() => {
      wx.showToast({
        title: '存储失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({
        isAdd: false,
        isDisabled: false
      })
    })
  },

  _saveToLocal (type, date, typeObj, account, remark, money) {
    return new Promise((resolve, reject) => {
      // 获取当前存储的记账记录
      const records = wx.getStorageSync('records') || [];
      
      // 创建新的记账记录
      const newRecord = {
        type,
        date,
        name: typeObj.type,
        account,
        remark,
        money: parseFloat(money) * 100, // 将金额转换为分为单位
      };
      
      // 将新记录添加到数组中
      records.push(newRecord);
      
      // 存储更新后的记录到本地存储
      wx.setStorageSync('records', records);
      
      // 更新账户余额
      this._loadStorage(account, type, parseFloat(money) * 100);
      
      resolve();
    });
  },

  _loadStorage (account, type, money) {
    const accountObj = getAccount();

    if (type === 0) {
      accountObj[`${account}`] -= money;
      if (accountObj[`${account}`] < 0) accountObj[`${account}`] = 0;
    }
    if (type === 1) accountObj[`${account}`] += money;

    setAccount({
      ...accountObj
    });
  }
})