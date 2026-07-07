const DEFAULT_CITY = '北京';
const DEFAULT_ALL_DISTRICT = '全市区';
const DEFAULT_DISTRICTS = [DEFAULT_ALL_DISTRICT, '东城区', '朝阳区', '海淀区', '丰台区', '通州区', '西城区'];
const DEFAULT_FILTER_CONFIG = {
  visible: true,
  searchPlaceholder: '搜索门店/小区/大厅名称',
  districts: DEFAULT_DISTRICTS,
  showCanStayFilter: true,
  emptyText: '没有符合条件的门店，换个条件试试'
};
const DEFAULT_ACTION_CONFIG = {
  navigationButtonText: '导航',
  phoneButtonText: '电话',
  detailHint: '',
  navigationUnavailableText: '当前门店暂未配置地图坐标。',
  showNavigationButton: true,
  showPhoneButton: true
};

function parseConfig(value) {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function visible(value) {
  return value !== false && value !== 'false' && value !== 0 && value !== '0';
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function uniqueList(list) {
  const seen = {};
  return list.filter((item) => {
    if (!item || seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

function buildFilterConfig(module) {
  const config = module ? parseConfig(module.targetValue) : {};
  const configuredDistricts = parseList(config.districts || config.areas || (module && module.iconText));
  const districts = uniqueList([DEFAULT_ALL_DISTRICT].concat(configuredDistricts.length ? configuredDistricts : DEFAULT_DISTRICTS.slice(1)));
  return Object.assign({}, DEFAULT_FILTER_CONFIG, {
    visible: module ? visible(module.visible) : DEFAULT_FILTER_CONFIG.visible,
    searchPlaceholder: config.searchPlaceholder || config.placeholder || (module && module.title) || DEFAULT_FILTER_CONFIG.searchPlaceholder,
    districts,
    showCanStayFilter: config.showCanStayFilter !== false && config.showStayFilter !== false,
    emptyText: config.emptyText || (module && module.description) || DEFAULT_FILTER_CONFIG.emptyText
  });
}

function buildActionConfig(module) {
  const config = module ? parseConfig(module.targetValue) : {};
  return Object.assign({}, DEFAULT_ACTION_CONFIG, {
    visible: module ? visible(module.visible) : true,
    navigationButtonText: config.navigationButtonText || config.navText || (module && module.title) || DEFAULT_ACTION_CONFIG.navigationButtonText,
    phoneButtonText: config.phoneButtonText || config.callText || (module && module.iconText) || DEFAULT_ACTION_CONFIG.phoneButtonText,
    detailHint: config.detailHint || (module && module.description) || DEFAULT_ACTION_CONFIG.detailHint,
    navigationUnavailableText: config.navigationUnavailableText || config.noLocationText || (module && module.targetValue && !Object.keys(config).length ? module.targetValue : '') || DEFAULT_ACTION_CONFIG.navigationUnavailableText,
    showNavigationButton: config.showNavigationButton !== false && config.showNavButton !== false,
    showPhoneButton: config.showPhoneButton !== false && config.showCallButton !== false
  });
}

function sortStores(list) {
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aHasSort = a.item.sort !== undefined && a.item.sort !== null && a.item.sort !== '';
      const bHasSort = b.item.sort !== undefined && b.item.sort !== null && b.item.sort !== '';
      if (aHasSort && bHasSort) return Number(a.item.sort || 0) - Number(b.item.sort || 0);
      if (aHasSort) return -1;
      if (bHasSort) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

Page({
  data: {
    city: DEFAULT_CITY,
    query: '',
    storeFilterConfig: DEFAULT_FILTER_CONFIG,
    storeActionConfig: DEFAULT_ACTION_CONFIG,
    districtNames: DEFAULT_DISTRICTS,
    districts: [],
    activeDistrict: DEFAULT_ALL_DISTRICT,
    canStayOnly: false,
    stayClass: '',
    stayMark: '',
    stores: [],
    visibleStores: [],
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
    const modules = app.globalData.serviceModules || [];
    const filterModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'stores_page_filter');
    const actionModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'stores_page_actions');
    const filterConfig = buildFilterConfig(filterModule);
    const actionConfig = buildActionConfig(actionModule);
    const currentDistrict = filterConfig.districts.includes(this.data.activeDistrict)
      ? this.data.activeDistrict
      : DEFAULT_ALL_DISTRICT;
    const nextStores = app.globalData.backendStores || [];
    console.info(`[stores-page] backendReady=${app.globalData.backendReady} source=${app.globalData.backendSource || 'unknown'} count=${nextStores.length}`);
    const visibleStoreSource = sortStores(nextStores.filter((store) => store && store.visible !== false));
    const storesWithImages = await Promise.all(visibleStoreSource.map(async (store) => {
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
      city: (app.globalData.companyProfile || {}).defaultCity || DEFAULT_CITY,
      storeFilterConfig: filterConfig,
      storeActionConfig: actionConfig,
      districtNames: filterConfig.districts,
      activeDistrict: currentDistrict,
      stores: storesWithImages
    }, () => {
      this.refreshDistricts();
      this.applyFilters();
    });
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
      const matchDistrict = district === DEFAULT_ALL_DISTRICT || store.district === district;
      const matchStay = !this.data.canStayOnly || store.canStay;
      const matchKeyword = !keyword ||
        store.name.indexOf(keyword) >= 0 ||
        store.address.indexOf(keyword) >= 0 ||
        store.area.indexOf(keyword) >= 0;
      return matchDistrict && matchStay && matchKeyword;
    });

    this.setData({
      visibleStores: this.data.storeFilterConfig.visible === false ? [] : list,
      emptyText: getApp().globalData.backendError || (this.data.storeFilterConfig.visible === false
        ? this.data.storeFilterConfig.emptyText
        : (list.length ? '' : this.data.storeFilterConfig.emptyText))
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
      content: `${this.data.storeActionConfig.navigationUnavailableText}\n\n门店：${name}\n地址：${address}`,
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
