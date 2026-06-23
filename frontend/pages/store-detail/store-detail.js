const { stores: localStores } = require('../../data/stores');
const { ayis: localAyis } = require('../../data/ayis');

function normalizeId(value) {
  return String(value || '');
}

function imageInfo(src) {
  const value = String(src || '');
  return {
    imageType: value.startsWith('data:image/') ? 'data-url' : (value ? 'url' : 'empty'),
    imageLength: value.length
  };
}

function certifiedAyi(item) {
  return ['已认证', 'approved'].includes(item.status || '已认证');
}

function normalizeStore(store) {
  if (!store) return null;
  const tags = Array.isArray(store.tags) ? store.tags : [];
  return Object.assign({
    tags: [],
    businessHours: '',
    intro: '',
    managerName: '',
    managerTitle: '',
    managerImage: '',
    managerIntro: '',
    staffCount: '',
    consultantCount: '',
    ayiCount: '',
    teamIntro: ''
  }, store, {
    tags,
    tagsText: tags.join('｜'),
    addressText: store.address || '暂未填写',
    phoneText: store.phone || '暂未填写',
    managerDisplayName: store.managerName || '门店负责人',
    canStayText: store.canStay ? '可住宿' : '不提供住宿',
    canStay: Boolean(store.canStay),
    imageLoadFailed: false
  }, imageInfo(store.image));
}

function normalizeAyi(item) {
  const serviceType = item.serviceType || item.role || '家政';
  return Object.assign({}, item, {
    role: serviceType,
    serviceType,
    avatarText: item.avatarText || (item.name || '阿姨').slice(0, 1),
    skills: Array.isArray(item.skills) ? item.skills : [],
    salary: item.salary || '面议',
    schedule: item.availableTime || item.schedule || '可预约',
    featuredTitleText: item.featuredTitle || '门店推荐',
    featured: item.featured === true || item.featured === 'true'
  });
}

Page({
  data: {
    storeId: '',
    store: null,
    featuredAyis: [],
    notFound: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ storeId: normalizeId(options.id) });
  },

  onShow() {
    if (this.data.storeId) {
      this.loadStoreDetail();
    }
  },

  async loadStoreDetail() {
    const app = getApp();
    const id = this.data.storeId;
    this.setData({ loading: true });

    await app.loadBackendData();

    const backendStores = app.globalData.backendStores || [];
    const storeList = backendStores.length ? backendStores : localStores;
    const store = normalizeStore(storeList.find((item) => normalizeId(item.id) === id));
    const displayImage = store ? await app.resolveImageForDisplay(store.image, { storeId: store.id }) : '';
    const managerDisplayImage = store ? await app.resolveImageForDisplay(store.managerImage, { storeId: store.id }) : '';
    const displayStore = store ? Object.assign({}, store, {
      displayImage,
      managerDisplayImage,
      imageLoadFailed: !displayImage && Boolean(store.image),
      managerImageLoadFailed: !managerDisplayImage && Boolean(store.managerImage),
      managerImageType: store.managerImage ? (String(store.managerImage).indexOf('http://localhost:5177/') === 0 ? 'http-local' : 'url') : 'empty',
      managerImageLength: String(store.managerImage || '').length
    }) : null;
    const ayiSource = (app.globalData.ayis && app.globalData.ayis.length ? app.globalData.ayis : localAyis)
      .map(normalizeAyi)
      .filter((item) => normalizeId(item.storeId) === id && certifiedAyi(item))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

    console.info(`[store-detail] storeId=${id} backendReady=${app.globalData.backendReady} source=${app.globalData.backendSource || 'unknown'} imageType=${store ? store.imageType : 'empty'} imageLength=${store ? store.imageLength : 0} displayImage=${displayImage ? 'ready' : 'empty'}`);

    this.setData({
      store: displayStore,
      featuredAyis: ayiSource,
      notFound: !displayStore,
      loading: false
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/stores/stores' });
      }
    });
  },

  goAyiDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${id}`
    });
  },

  callStore() {
    const phone = this.data.store && this.data.store.phone;
    if (!phone) {
      wx.showToast({ title: '门店暂未配置电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: phone });
  },

  navigateStore() {
    const store = this.data.store;
    if (!store) return;
    const latitude = Number(store.latitude);
    const longitude = Number(store.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && latitude && longitude) {
      wx.openLocation({
        latitude,
        longitude,
        name: store.name,
        address: store.address
      });
      return;
    }

    wx.showModal({
      title: '门店导航',
      content: `当前门店暂未配置地图坐标。\n\n地址：${store.address || '暂未填写'}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  handleStoreImageError(event) {
    const store = this.data.store;
    if (!store) return;
    const type = event.currentTarget.dataset.imageType || 'unknown';
    const length = event.currentTarget.dataset.imageLength || 0;
    console.warn(`[store-detail] image load failed storeId=${store.id} imageType=${type} imageLength=${length}`, event.detail || {});
    this.setData({
      store: Object.assign({}, store, { imageLoadFailed: true })
    });
  },

  handleManagerImageError(event) {
    const store = this.data.store;
    if (!store) return;
    const type = event.currentTarget.dataset.imageType || 'unknown';
    const length = event.currentTarget.dataset.imageLength || 0;
    console.warn(`[store-detail] manager image load failed storeId=${store.id} imageType=${type} imageLength=${length}`, event.detail || {});
    this.setData({
      store: Object.assign({}, store, { managerImageLoadFailed: true })
    });
  }
});
