Page({
  data: {
    role: '',
    roleText: '未选择身份',
    avatarText: '我',
    pageTitle: '个人中心',
    pageDesc: '请选择身份后查看对应内容',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    profile: null,
    profileStatus: '未完善',
    applications: [],
    hasApplications: false,
    noApplications: true,
    appointments: [],
    hasAppointments: false,
    noAppointments: true,
    demands: [],
    hasDemands: false,
    noDemands: true,
    companyProfile: {}
  },

  onShow() {
    const app = getApp();
    const role = app.globalData.role || '';
    const roleText = role === 'ayi' ? '阿姨' : role === 'customer' ? '客户' : '未选择身份';
    const avatarText = role === 'ayi' ? '姨' : role === 'customer' ? '客' : '我';
    const pageTitle = role === 'ayi' ? '阿姨中心' : role === 'customer' ? '客户中心' : '个人中心';
    const pageDesc = role === 'ayi' ? '资料、证件和接单记录' : role === 'customer' ? '需求、预约和顾问跟进' : '请选择客户或阿姨身份';
    const profile = app.globalData.ayiProfile;
    const applications = app.globalData.applications || [];
    const appointments = app.globalData.appointments || [];
    const localDemands = app.globalData.demands || [];
    this.setData({
      role,
      roleText,
      avatarText,
      pageTitle,
      pageDesc,
      noRole: !role,
      isCustomer: role === 'customer',
      isAyi: role === 'ayi',
      profile,
      profileStatus: profile ? profile.status : '未完善',
      applications,
      companyProfile: app.globalData.companyProfile || {},
      hasApplications: applications.length > 0,
      noApplications: applications.length === 0,
      appointments,
      hasAppointments: appointments.length > 0,
      noAppointments: appointments.length === 0,
      demands: localDemands,
      hasDemands: localDemands.length > 0,
      noDemands: localDemands.length === 0
    });
    if (role === 'customer') {
      this.loadCustomerDemands();
    }
    app.loadBackendData({ force: true }).then(() => {
      this.setData({
        companyProfile: app.globalData.companyProfile || {}
      });
    });
  },

  loadCustomerDemands() {
    const app = getApp();
    const accessList = app.getStoredCustomerDemandAccessList();
    if (!accessList.length) {
      this.setData({
        demands: [],
        hasDemands: false,
        noDemands: true
      });
      return;
    }

    Promise.all(accessList.map((item) => (
      app.fetchCustomerDemand(item.demandId, item.accessToken).catch(() => null)
    ))).then((list) => {
      const demands = list.filter(Boolean);
      this.setData({
        demands,
        hasDemands: demands.length > 0,
        noDemands: demands.length === 0
      });
    });
  },

  goList() {
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
    });
  },

  goDemandDetail(event) {
    wx.navigateTo({
      url: `/pages/demand-detail/demand-detail?id=${event.currentTarget.dataset.id}`
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

  goHall() {
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goApplications() {
    wx.navigateTo({
      url: '/pages/my-applications/my-applications'
    });
  },

  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  callService() {
    const phoneNumber = (getApp().globalData.companyProfile || {}).customerServicePhone;
    if (!phoneNumber) {
      wx.showToast({
        title: '客服电话暂未配置，请稍后再试。',
        icon: 'none'
      });
      return;
    }
    wx.makePhoneCall({ phoneNumber });
  },

  switchRole() {
    getApp().setRole('');
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});
