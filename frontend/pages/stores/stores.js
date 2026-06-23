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

  async onShow() {
    const app = getApp();
    await app.loadBackendData();
    await this.refreshStores();
  },

  async refreshStores() {
    const app = getApp();
    const nextStores = app.globalData.backendStores && app.globalData.backendStores.length ? app.globalData.backendStores : stores;
    console.info(`[stores-page] backendReady=${app.globalData.backendReady} source=${app.globalData.backendSource || 'unknown'} count=${nextStores.length}`);
    const storesWithImages = await Promise.all(nextStores.map(async (store) => {
      try {
        const displayImage = await app.resolveImageForDisplay(store.image, { storeId: store.id });
        console.info(`[store-image] storeId=${store.id} source=${store.imageType || 'unknown'} urlLength=${store.imageLength || 0} status=${displayImage ? 'display-ready' : 'placeholder'}`);
        return Object.assign({}, store, {
          displayImage,
          imageLoadFailed: false
        });
      } catch (error) {
        console.warn(`[store-image] storeId=${store.id} status=resolve-failed error=${error && error.message ? error.message : 'unknown'}`);
        return Object.assign({}, store, {
          displayImage: '',
          imageLoadFailed: true
        });
      }
    }));
    this.setData({
      stores: storesWithImages
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
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/store-detail/store-detail?id=${id}`
    });
  },

  navigateStore(event) {
    const latitude = Number(event.currentTarget.dataset.latitude);
    const longitude = Number(event.currentTarget.dataset.longitude);
    const name = event.currentTarget.dataset.name;
    const address = event.currentTarget.dataset.address;

    if (Number.isFinite(latitude) && Number.isFinite(longitude) && latitude && longitude) {
      wx.openLocation({
        latitude,
        longitude,
        name,
        address
      });
      return;
    }

    wx.showModal({
      title: '门店导航',
      content: `当前门店暂未配置地图坐标。\n\n门店：${name}\n地址：${address}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  handleStoreImageError(event) {
    const id = event.currentTarget.dataset.id;
    const type = event.currentTarget.dataset.imageType || 'unknown';
    const length = event.currentTarget.dataset.imageLength || 0;
    console.warn(`[stores-page] image load failed storeId=${id} imageType=${type} imageLength=${length}`, event.detail || {});

    const storesList = this.data.stores.map((store) => (
      String(store.id) === String(id) ? Object.assign({}, store, { imageLoadFailed: true }) : store
    ));
    this.setData({ stores: storesList }, this.applyFilters);
  }
});
