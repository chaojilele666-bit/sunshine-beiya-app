const { ayis } = require('../../data/ayis');
const { sampleDemands } = require('../../data/demands');

Page({
  data: {
    role: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    city: '北京',
    profile: null,
    profileText: '请先完善个人资料和证件信息',
    applications: [],
    todayJobs: sampleDemands.slice(0, 3),
    services: [
      { name: '育儿嫂', desc: '0-3 岁照护', type: '育儿嫂' },
      { name: '月嫂', desc: '产妇和新生儿', type: '月嫂' },
      { name: '住家保姆', desc: '三餐家务照护', type: '住家保姆' },
      { name: '小时工', desc: '保洁收纳', type: '小时工' },
      { name: '老人陪护', desc: '陪诊照护', type: '老人陪护' }
    ],
    features: [
      '身份与健康资料审核',
      '顾问协助预约面试',
      '合同与服务保障'
    ],
    stats: [
      { label: '服务范围', value: '家政/母婴/养老' },
      { label: '重点区域', value: '东城/朝阳/海淀' },
      { label: '推荐机制', value: '顾问匹配' }
    ],
    process: [
      { step: '1', title: '提交需求', desc: '填写服务类型、地址和时间' },
      { step: '2', title: '顾问匹配', desc: '根据家庭情况推荐合适阿姨' },
      { step: '3', title: '预约面试', desc: '线上提交预约，线下确认上户' }
    ],
    recommended: ayis.slice(0, 4)
  },

  onShow() {
    const app = getApp();
    this.refreshPage();
    app.loadBackendData().then(() => {
      this.refreshPage();
    });
  },

  refreshPage() {
    const app = getApp();
    const profile = app.globalData.ayiProfile;
    const backendAyis = app.globalData.ayis && app.globalData.ayis.length ? app.globalData.ayis : ayis;
    const backendDemands = app.globalData.backendDemands && app.globalData.backendDemands.length ? app.globalData.backendDemands : sampleDemands;
    const localDemands = app.globalData.demands || [];
    const jobs = localDemands.length ? localDemands.concat(backendDemands) : backendDemands;
    this.setData({
      role: app.globalData.role,
      noRole: !app.globalData.role,
      isCustomer: app.globalData.role === 'customer',
      isAyi: app.globalData.role === 'ayi',
      profile,
      profileText: profile ? `资料状态：${profile.status}` : '请先完善个人资料和证件信息',
      applications: app.globalData.applications,
      stats: app.globalData.serviceModules && app.globalData.serviceModules.length ? app.globalData.serviceModules : this.data.stats,
      todayJobs: jobs.slice(0, 3),
      recommended: backendAyis.slice(0, 4)
    });
  },

  chooseCustomer() {
    getApp().setRole('customer');
    this.onShow();
  },

  chooseAyi() {
    getApp().setRole('ayi');
    this.onShow();
  },

  goList(event) {
    const type = event.currentTarget.dataset.type || '';
    getApp().globalData.pendingServiceType = type;
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
    });
  },

  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  goProfile() {
    wx.navigateTo({
      url: '/pages/ayi-profile/ayi-profile'
    });
  },

  goCerts() {
    wx.navigateTo({
      url: '/pages/ayi-certs/ayi-certs'
    });
  },

  goHall(event) {
    const type = event && event.currentTarget ? event.currentTarget.dataset.type || '' : '';
    getApp().globalData.pendingServiceType = type;
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goApplications() {
    wx.navigateTo({
      url: '/pages/my-applications/my-applications'
    });
  },

  callService() {
    wx.makePhoneCall({
      phoneNumber: '4000000000'
    });
  },

  switchRole() {
    getApp().setRole('');
    this.refreshPage();
  }
});
