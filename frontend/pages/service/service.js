const { ayis } = require('../../data/ayis');
const { sampleDemands } = require('../../data/demands');

Page({
  data: {
    role: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    query: '',
    serviceTypeNames: ['全部', '育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护'],
    serviceTypes: [],
    activeType: '全部',
    filterTips: ['从业年限', '价格', '人气', '筛选'],
    ayis,
    visibleAyis: ayis,
    noAyis: false,
    allDemands: [],
    demands: [],
    noDemands: false
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
    const role = app.globalData.role;
    const applications = app.globalData.applications || [];
    const sourceAyis = app.globalData.ayis && app.globalData.ayis.length ? app.globalData.ayis : ayis;
    const backendDemands = app.globalData.backendDemands && app.globalData.backendDemands.length ? app.globalData.backendDemands : sampleDemands;

    this.setData({
      role,
      noRole: !role,
      isCustomer: role === 'customer',
      isAyi: role === 'ayi'
    });

    const localDemands = app.globalData.demands || [];
    const merged = this.formatDemandList(localDemands.concat(backendDemands), applications);
    this.setData({
      ayis: sourceAyis,
      allDemands: merged
    });

    const nextType = app.globalData.pendingServiceType || this.data.activeType || '全部';
    app.globalData.pendingServiceType = '';
    if (role === 'ayi') {
      this.filterDemands(nextType, merged);
    } else {
      this.filterAyis(nextType, sourceAyis);
    }
    this.refreshServiceTypes();
  },

  chooseRole() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  changeType(event) {
    const type = event.currentTarget.dataset.type;
    if (this.data.isAyi) {
      this.filterDemands(type);
    } else {
      this.filterAyis(type);
    }
  },

  useFeature(event) {
    const type = event.currentTarget.dataset.type || '';
    if (type === 'demand') {
      this.goDemand();
      return;
    }
    this.filterAyis(type);
    wx.showToast({
      title: type ? `已筛选${type}` : '已筛选',
      icon: 'none'
    });
  },

  showFilter(event) {
    wx.showToast({
      title: `${event.currentTarget.dataset.name}筛选后续接入`,
      icon: 'none'
    });
  },

  updateQuery(event) {
    this.setData({
      query: event.detail.value
    });
    this.filterAyis(this.data.activeType);
  },

  filterAyis(type, source) {
    const list = source || this.data.ayis || ayis;
    const keyword = this.data.query.trim();
    const visibleAyis = list.filter((item) => {
      const matchType = type === '全部' || item.role === type || item.serviceType === type;
      const matchKeyword = !keyword ||
        item.name.indexOf(keyword) >= 0 ||
        item.hometown.indexOf(keyword) >= 0 ||
        item.role.indexOf(keyword) >= 0;
      return matchType && matchKeyword;
    });
    this.setData({
      activeType: type,
      visibleAyis,
      noAyis: visibleAyis.length === 0
    });
    this.refreshServiceTypes(type);
  },

  filterDemands(type, source) {
    const list = source || this.data.allDemands || [];
    const demands = list.filter((item) => type === '全部' || item.serviceType === type);
    this.setData({
      activeType: type,
      demands,
      noDemands: demands.length === 0
    });
    this.refreshServiceTypes(type);
  },

  refreshServiceTypes(type) {
    const activeType = type || this.data.activeType;
    const serviceTypes = this.data.serviceTypeNames.map((name) => ({
      name,
      activeClass: name === activeType ? 'active' : ''
    }));
    this.setData({ serviceTypes });
  },

  formatDemandList(list, applications) {
    return list.map((demand) => {
      const applied = applications.some((item) => item.demandId === demand.id);
      return Object.assign({}, demand, {
        applied,
        buttonClass: applied ? 'ghost-button' : 'primary-button',
        buttonText: applied ? '已申请' : '申请接单',
        disabled: applied
      });
    });
  },

  goAyiDetail(event) {
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
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

  applyDemand(event) {
    const id = Number(event.currentTarget.dataset.id);
    const demand = this.data.demands.find((item) => item.id === id);
    if (!demand) return;

    const app = getApp();
    const profile = app.globalData.ayiProfile;
    if (!profile) {
      wx.showToast({
        title: '请先完善个人资料',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/ayi-profile/ayi-profile'
        });
      }, 700);
      return;
    }

    app.addApplication({
      demandId: demand.id,
      serviceType: demand.serviceType,
      customerAddress: `${demand.city} ${demand.address}`,
      startTime: demand.startTime,
      budget: demand.budget,
      familyInfo: demand.familyInfo,
      ayiName: profile.name,
      ayiPhone: profile.phone
    });

    wx.showToast({
      title: '已申请接单',
      icon: 'success'
    });
    this.onShow();
  }
});
