const { stores } = require('../../data/stores');

Page({
  data: {
    city: '北京',
    query: '',
    districtNames: ['全市区', '东城区', '朝阳区', '海淀区', '丰台区', '通州区', '西城区'],
    districts: [],
    activeDistrict: '全市区',
    canStayOnly: false,
    stayClass: '',
    stayMark: '',
    stores,
    visibleStores: stores,
    emptyText: ''
  },

  onLoad() {
    this.refreshDistricts();
  },

  onShow() {
    const app = getApp();
    this.refreshStores();
    app.loadBackendData().then(() => {
      this.refreshStores();
    });
  },

  refreshStores() {
    const app = getApp();
    const nextStores = app.globalData.backendStores && app.globalData.backendStores.length ? app.globalData.backendStores : stores;
    this.setData({
      stores: nextStores
    }, this.applyFilters);
  },

  updateQuery(event) {
    this.setData({
      query: event.detail.value
    }, this.applyFilters);
  },

  chooseDistrict(event) {
    this.setData({
      activeDistrict: event.currentTarget.dataset.district
    }, () => {
      this.refreshDistricts();
      this.applyFilters();
    });
  },

  toggleStay() {
    const canStayOnly = !this.data.canStayOnly;
    this.setData({
      canStayOnly,
      stayClass: canStayOnly ? 'checked' : '',
      stayMark: canStayOnly ? '✓' : ''
    }, this.applyFilters);
  },

  refreshDistricts() {
    const districts = this.data.districtNames.map((name) => ({
      name,
      activeClass: name === this.data.activeDistrict ? 'active' : ''
    }));
    this.setData({ districts });
  },

  applyFilters() {
    const keyword = this.data.query.trim();
    const district = this.data.activeDistrict;
    const list = this.data.stores.filter((store) => {
      const matchDistrict = district === '全市区' || store.district === district;
      const matchStay = !this.data.canStayOnly || store.canStay;
      const matchKeyword = !keyword ||
        store.name.indexOf(keyword) >= 0 ||
        store.address.indexOf(keyword) >= 0 ||
        store.area.indexOf(keyword) >= 0;
      return matchDistrict && matchStay && matchKeyword;
    });

    this.setData({
      visibleStores: list,
      emptyText: list.length ? '' : '没有符合条件的门店，换个条件试试吧'
    });
  },

  callStore(event) {
    wx.makePhoneCall({
      phoneNumber: event.currentTarget.dataset.phone
    });
  },

  showStore(event) {
    const name = event.currentTarget.dataset.name;
    const address = event.currentTarget.dataset.address;
    const area = event.currentTarget.dataset.area;
    wx.showModal({
      title: name,
      content: `地址：${address}\n覆盖区域：${area}\n\n正式版可接入微信地图导航。`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  navigateStore(event) {
    wx.showModal({
      title: '门店导航',
      content: `正式版接入地图后可一键导航。\n\n当前门店：${event.currentTarget.dataset.name}\n地址：${event.currentTarget.dataset.address}`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
